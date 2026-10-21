import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface HistoryPoint {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

export interface OhlcvBar {
  timestamp: number; // Unix epoch in milliseconds for chart input
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

export interface StockHistoryResponse {
  symbol: string;
  companyName?: string;
  currency?: string;
  interval: '1d' | '1h' | '15m' | '5m';
  dataSource: 'live' | 'cached' | 'fallback' | 'seeded' | 'database';
  lastUpdated: string | null;
  bars: OhlcvBar[];
}

export interface StockResponse {
  id: number;
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  volume: number;
  isFallback: boolean;
  source: 'database';
  history: HistoryPoint[];
}

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<StockResponse[]> {
    console.log('[StockService] findAll()');
    const stocks = await this.prisma.stock.findMany({
      include: {
        prices: true,
      },
      orderBy: [{ volume: 'desc' }, { symbol: 'asc' }],
    });

    console.log(`[StockService] Found ${stocks.length} stocks`);
    return stocks.map((stock) => this.serializeStock(stock, 90));
  }

  async findBySymbol(symbol: string): Promise<StockResponse> {
    const upperSymbol = symbol.trim().toUpperCase();
    console.log(`[StockService] findBySymbol(${upperSymbol})`);

    const stock = await this.prisma.stock.findUnique({
      where: { symbol: upperSymbol },
      include: {
        prices: true,
      },
    });

    if (!stock) {
      console.warn(`[StockService] Stock ${upperSymbol} not found`);
      throw new NotFoundException(`Stock with symbol ${symbol} not found`);
    }

    console.log(`[StockService] Found stock ${upperSymbol} with ${stock.prices.length} price records`);
    return this.serializeStock(stock, 365);
  }

  async getHistoryBySymbol(
    symbol: string,
    range = '1y',
    interval = '1d',
  ): Promise<StockHistoryResponse> {
    const upperSymbol = symbol.trim().toUpperCase();
    const stock = await this.prisma.stock.findUnique({
      where: { symbol: upperSymbol },
      include: {
        prices: {
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!stock) {
      throw new NotFoundException(`Stock with symbol ${symbol} not found`);
    }

    const serialized = this.serializeStock(stock, 1000);
    let history = serialized.history;

    // Filter by timeframe range if requested
    if (range && range !== 'all') {
      const lower = range.toLowerCase();
      if (lower === '5d') {
        history = history.slice(-5);
      } else {
        const now = new Date();
        let cutoffDays = 365;
        if (lower === '1m') cutoffDays = 30;
        else if (lower === '3m') cutoffDays = 90;
        else if (lower === '6m') cutoffDays = 180;
        else if (lower === '1y') cutoffDays = 365;
        else if (lower === '3y') cutoffDays = 365 * 3;

        const cutoffTime = now.getTime() - cutoffDays * 24 * 60 * 60 * 1000;
        const filtered = history.filter((p) => new Date(p.date).getTime() >= cutoffTime);
        if (filtered.length >= 3) {
          history = filtered;
        }
      }
    }

    const bars: OhlcvBar[] = history.map((point) => {
      const timestamp = new Date(point.date).getTime();
      const open = point.open ?? point.close;
      const close = point.close;
      const high = point.high ?? Math.max(open, close);
      const low = point.low ?? Math.min(open, close);
      return {
        timestamp,
        open,
        high: Math.max(high, open, close),
        low: Math.min(low, open, close),
        close,
        volume: point.volume != null && Number.isFinite(point.volume) ? point.volume : null,
      };
    });

    const isIndex = [
      'HSI', 'NYA', 'IXIC', '000001.SS', 'N225', 'N100',
      '399001.SZ', 'GSPTSE', 'NSEI', 'GDAXI', 'SSMI', 'TWII', 'J203.JO',
    ].includes(upperSymbol);

    return {
      symbol: stock.symbol,
      companyName: stock.name,
      currency: isIndex ? 'POINTS' : 'USD',
      interval: '1d',
      dataSource: stock.prices && stock.prices.length > 0 ? 'seeded' : 'fallback',
      lastUpdated: history.length > 0 ? history[history.length - 1].date : null,
      bars,
    };
  }

  serializeStock(stock: any, historyLimit: number): StockResponse {
    const historyByDate = new Map<string, HistoryPoint>();
    const price = this.toPositiveNumberOrNull(stock.price);

    for (const point of (stock.prices ?? []).sort(
      (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )) {
      const close = Number(Number(point.close).toFixed(2));
      const open = Number(Number(point.open ?? point.close).toFixed(2));
      const high = Number(Number(point.high ?? Math.max(open, close)).toFixed(2));
      const low = Number(Number(point.low ?? Math.min(open, close)).toFixed(2));
      const volume = Number(point.volume) || 0;

      if (!Number.isFinite(close) || close <= 0) {
        continue;
      }

      const date = new Date(point.date).toISOString();
      historyByDate.set(date, {
        date,
        open,
        high: Math.max(high, open, close),
        low: Math.min(low, open, close),
        close,
        volume,
      });
    }

    let history = Array.from(historyByDate.values())
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-historyLimit);

    if (history.length === 0 && price != null) {
      history = this.createFallbackHistory(price, Math.min(historyLimit, 90));
    }

    history = this.alignHistoryToCurrentPrice(history, price, stock.symbol);

    return {
      id: stock.id,
      symbol: stock.symbol,
      name: stock.name,
      price,
      change: this.toNumberOrNull(stock.change),
      volume: Number(stock.volume) || 0,
      isFallback: true,
      source: 'database',
      history,
    };
  }

  private toNumberOrNull(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toPositiveNumberOrNull(value: unknown): number | null {
    const parsed = this.toNumberOrNull(value);
    return parsed != null && parsed > 0 ? parsed : null;
  }

  private round(value: number): number {
    return Number(value.toFixed(2));
  }

  private alignHistoryToCurrentPrice(
    history: HistoryPoint[],
    price: number | null,
    symbol: string,
  ): HistoryPoint[] {
    if (price == null || history.length === 0) {
      return history;
    }

    const last = history.at(-1);
    const lastClose = Number(last?.close);

    if (!Number.isFinite(lastClose) || lastClose <= 0) {
      const fixed = [...history];
      fixed[fixed.length - 1] = { ...fixed[fixed.length - 1], close: price };
      return fixed;
    }

    const ratio = price / lastClose;

    if (!Number.isFinite(ratio) || ratio <= 0) {
      const fixed = [...history];
      fixed[fixed.length - 1] = { ...fixed[fixed.length - 1], close: price };
      return fixed;
    }

    if (Math.abs(price - lastClose) > 0.01) {
      console.log(
        `[StockService] Scaling cached history for ${symbol}: last=${lastClose}, current=${price}`,
      );
    }

    const scaled = history.map((point) => {
      const scaledClose = this.round(point.close * ratio);
      const scaledOpen = point.open != null ? this.round(point.open * ratio) : scaledClose;
      const scaledHigh =
        point.high != null ? this.round(point.high * ratio) : Math.max(scaledOpen, scaledClose);
      const scaledLow =
        point.low != null ? this.round(point.low * ratio) : Math.min(scaledOpen, scaledClose);
      return {
        ...point,
        open: scaledOpen,
        high: Math.max(scaledHigh, scaledOpen, scaledClose),
        low: Math.min(scaledLow, scaledOpen, scaledClose),
        close: scaledClose,
      };
    });

    const lastScaled = scaled[scaled.length - 1];
    scaled[scaled.length - 1] = {
      ...lastScaled,
      close: price,
      high: Math.max(lastScaled.high ?? price, price),
      low: Math.min(lastScaled.low ?? price, price),
    };

    return scaled;
  }

  private createFallbackHistory(price: number, days: number): HistoryPoint[] {
    const totalDays = Math.max(2, days);
    const drift = Math.max(price * 0.0015, 0.18);
    const volatility = Math.max(price * 0.015, 2);
    const today = new Date();
    const terminalWave =
      Math.sin((totalDays - 1) / 4.8) * volatility +
      Math.cos((totalDays - 1) / 11) * (volatility * 0.45);

    return Array.from({ length: totalDays }, (_, index) => {
      const dayOffset = totalDays - index - 1;
      const date = new Date(today);
      date.setDate(today.getDate() - dayOffset);

      const wave =
        Math.sin(index / 4.8) * volatility +
        Math.cos(index / 11) * (volatility * 0.45);
      const close = Math.max(1, price - dayOffset * drift + (wave - terminalWave));
      const open = Math.max(1, close * (1 - 0.003));
      const high = Math.max(open, close) * 1.006;
      const low = Math.min(open, close) * 0.994;

      return {
        date: date.toISOString(),
        open: this.round(open),
        high: this.round(high),
        low: this.round(low),
        close: index === totalDays - 1 ? price : this.round(close),
        volume: 1000000 + (index * 123456) % 5000000,
      };
    });
  }
}
