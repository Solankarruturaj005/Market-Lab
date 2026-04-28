import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

export interface LiveQuote {
  symbol: string;
  price: number | null;
  change: number | null;
  isFallback: boolean;
  source?: 'live' | 'cache' | 'database' | 'fallback';
}

@Injectable()
export class StockApiService {
  private readonly logger = new Logger(StockApiService.name);
  private readonly baseUrl = 'https://www.alphavantage.co/query';

  private readonly cacheTtlMs = 60_000;
  private readonly fallbackTtlMs = 20_000;
  private readonly maxExternalRequestsPerMinute = 4;

  private readonly quoteCache = new Map<
    string,
    { quote: LiveQuote; expiresAt: number }
  >();

  private readonly recentRequestTimestamps: number[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async getStockPrice(symbol: string): Promise<LiveQuote> {
    const upperSymbol = this.normalizeSymbol(symbol);

    const cachedQuote = this.getCachedQuote(upperSymbol);
    if (cachedQuote) return cachedQuote;

    const fallbackQuote = await this.buildFallbackQuote(upperSymbol);
    const apiKey = this.configService.get<string>('STOCK_API_KEY')?.trim();

    if (!apiKey) {
      this.logger.warn(`[StockApiService] API key missing → fallback used`);
      return this.cacheQuote(fallbackQuote, this.fallbackTtlMs);
    }

    if (!this.canMakeExternalRequest()) {
      this.logger.warn(`[StockApiService] Rate limit reached → fallback used`);
      return this.cacheQuote(fallbackQuote, this.fallbackTtlMs);
    }

    try {
      this.logger.log(`[StockApiService] Fetching LIVE data for ${upperSymbol}`);

      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: upperSymbol,
          apikey: apiKey,
        },
        timeout: 8000,
      });

      const raw = response.data;

      //  Handle API limit message
      if (raw?.Note || raw?.Information || raw?.['Error Message']) {
        this.logger.warn(`[StockApiService] API limit hit → fallback used`);
        return this.cacheQuote(fallbackQuote, this.fallbackTtlMs);
      }

      const quote = raw?.['Global Quote'];

      // STRICT VALIDATION 
      if (
        !quote ||
        this.normalizeSymbol(quote['01. symbol'] ?? '') !== upperSymbol ||
        !quote['05. price']
      ) {
        this.logger.warn(`[StockApiService] Invalid API response → fallback`);
        return this.cacheQuote(fallbackQuote, this.fallbackTtlMs);
      }

      // Safe price parsing
      const priceRaw = quote['05. price'];
      const price = this.parsePositiveNumber(priceRaw);

      if (price == null) {
        this.logger.warn(`[StockApiService] Invalid price (${priceRaw})`);
        return this.cacheQuote(fallbackQuote, this.fallbackTtlMs);
      }

      // Safe change parsing
      const changeRaw = quote['10. change percent'] ?? quote['09. change'];
      const change = this.parseNullableNumber(String(changeRaw ?? '').replace('%', ''));

      const liveQuote: LiveQuote = {
        symbol: upperSymbol,
        price,
        change,
        isFallback: false,
        source: 'live',
      };

      this.logger.log(
        `[LIVE] ${upperSymbol} → $${price} (${change}%)`
      );

      await this.syncLiveQuoteToDatabase(liveQuote);

      return this.cacheQuote(liveQuote, this.cacheTtlMs);

    } catch (err: any) {
      const message = axios.isAxiosError(err)
        ? `${err.message} ${err.response?.status ?? ''}`
        : err?.message ?? 'Unknown error';

      this.logger.error(`[StockApiService] API failed → ${message}`);

      return this.cacheQuote(fallbackQuote, this.fallbackTtlMs);
    }
  }


  private normalizeSymbol(symbol: string): string {
    return String(symbol ?? '').trim().toUpperCase();
  }

  private parseNullableNumber(value: unknown): number | null {
    const parsed = Number.parseFloat(String(value ?? ''));
    return Number.isFinite(parsed) ? parsed : null;
  }

  private parsePositiveNumber(value: unknown): number | null {
    const parsed = this.parseNullableNumber(value);
    return parsed != null && parsed > 0 ? parsed : null;
  }

  private getCachedQuote(symbol: string): LiveQuote | null {
    const cached = this.quoteCache.get(symbol);

    if (!cached) return null;

    if (cached.expiresAt <= Date.now()) {
      return null;
    }

    return {
      ...cached.quote,
      isFallback: true,
      source: cached.quote.source === 'live' ? 'cache' : cached.quote.source,
    };
  }

  private getStaleCachedQuote(symbol: string): LiveQuote | null {
    const cached = this.quoteCache.get(symbol);

    if (!cached || cached.quote.source === 'database' || cached.quote.source === 'fallback') {
      return null;
    }

    return {
      ...cached.quote,
      isFallback: true,
      source: 'cache',
    };
  }

  private cacheQuote(quote: LiveQuote, ttlMs: number): LiveQuote {
    const staleCachedQuote = this.getStaleCachedQuote(quote.symbol);

    if ((quote.source === 'database' || quote.source === 'fallback') && staleCachedQuote) {
      return staleCachedQuote;
    }

    this.quoteCache.set(quote.symbol, {
      quote,
      expiresAt: Date.now() + ttlMs,
    });

    return quote;
  }

  private async syncLiveQuoteToDatabase(quote: LiveQuote) {
    if (quote.price == null || quote.source !== 'live') {
      return;
    }

    try {
      await this.prisma.stock.update({
        where: { symbol: quote.symbol },
        data: {
          price: quote.price,
          change: quote.change ?? 0,
        },
      });
    } catch (error) {
      this.logger.warn(
        `[StockApiService] DB sync skipped for ${quote.symbol}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // RATE LIMIT 

  private canMakeExternalRequest(): boolean {
    const now = Date.now();

    while (
      this.recentRequestTimestamps.length &&
      now - this.recentRequestTimestamps[0] >= 60_000
    ) {
      this.recentRequestTimestamps.shift();
    }

    if (this.recentRequestTimestamps.length >= this.maxExternalRequestsPerMinute) {
      return false;
    }

    this.recentRequestTimestamps.push(now);
    return true;
  }

  // FALLBACK 

  private async buildFallbackQuote(symbol: string): Promise<LiveQuote> {
    try {
      const stock = await this.prisma.stock.findUnique({
        where: { symbol },
        select: {
          symbol: true,
          price: true,
          change: true,
        },
      });

      if (stock) {
        return {
          symbol: stock.symbol,
          price: this.parsePositiveNumber(stock.price),
          change: this.parseNullableNumber(stock.change),
          isFallback: true,
          source: 'database',
        };
      }
    } catch (error) {
      this.logger.error(
        `[StockApiService] Database fallback lookup failed for ${symbol}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }

    return {
      symbol,
      price: null,
      change: null,
      isFallback: true,
      source: 'fallback',
    };
  }
}
