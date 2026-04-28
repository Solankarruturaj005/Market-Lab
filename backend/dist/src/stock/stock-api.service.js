"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StockApiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockApiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const prisma_service_1 = require("../prisma/prisma.service");
let StockApiService = StockApiService_1 = class StockApiService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(StockApiService_1.name);
        this.baseUrl = 'https://www.alphavantage.co/query';
        this.cacheTtlMs = 60000;
        this.fallbackTtlMs = 20000;
        this.maxExternalRequestsPerMinute = 4;
        this.quoteCache = new Map();
        this.recentRequestTimestamps = [];
    }
    async getStockPrice(symbol) {
        const upperSymbol = this.normalizeSymbol(symbol);
        const cachedQuote = this.getCachedQuote(upperSymbol);
        if (cachedQuote)
            return cachedQuote;
        const fallbackQuote = await this.buildFallbackQuote(upperSymbol);
        const apiKey = this.configService.get('STOCK_API_KEY')?.trim();
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
            const response = await axios_1.default.get(this.baseUrl, {
                params: {
                    function: 'GLOBAL_QUOTE',
                    symbol: upperSymbol,
                    apikey: apiKey,
                },
                timeout: 8000,
            });
            const raw = response.data;
            if (raw?.Note || raw?.Information || raw?.['Error Message']) {
                this.logger.warn(`[StockApiService] API limit hit → fallback used`);
                return this.cacheQuote(fallbackQuote, this.fallbackTtlMs);
            }
            const quote = raw?.['Global Quote'];
            if (!quote ||
                this.normalizeSymbol(quote['01. symbol'] ?? '') !== upperSymbol ||
                !quote['05. price']) {
                this.logger.warn(`[StockApiService] Invalid API response → fallback`);
                return this.cacheQuote(fallbackQuote, this.fallbackTtlMs);
            }
            const priceRaw = quote['05. price'];
            const price = this.parsePositiveNumber(priceRaw);
            if (price == null) {
                this.logger.warn(`[StockApiService] Invalid price (${priceRaw})`);
                return this.cacheQuote(fallbackQuote, this.fallbackTtlMs);
            }
            const changeRaw = quote['10. change percent'] ?? quote['09. change'];
            const change = this.parseNullableNumber(String(changeRaw ?? '').replace('%', ''));
            const liveQuote = {
                symbol: upperSymbol,
                price,
                change,
                isFallback: false,
                source: 'live',
            };
            this.logger.log(`[LIVE] ${upperSymbol} → $${price} (${change}%)`);
            await this.syncLiveQuoteToDatabase(liveQuote);
            return this.cacheQuote(liveQuote, this.cacheTtlMs);
        }
        catch (err) {
            const message = axios_1.default.isAxiosError(err)
                ? `${err.message} ${err.response?.status ?? ''}`
                : err?.message ?? 'Unknown error';
            this.logger.error(`[StockApiService] API failed → ${message}`);
            return this.cacheQuote(fallbackQuote, this.fallbackTtlMs);
        }
    }
    normalizeSymbol(symbol) {
        return String(symbol ?? '').trim().toUpperCase();
    }
    parseNullableNumber(value) {
        const parsed = Number.parseFloat(String(value ?? ''));
        return Number.isFinite(parsed) ? parsed : null;
    }
    parsePositiveNumber(value) {
        const parsed = this.parseNullableNumber(value);
        return parsed != null && parsed > 0 ? parsed : null;
    }
    getCachedQuote(symbol) {
        const cached = this.quoteCache.get(symbol);
        if (!cached)
            return null;
        if (cached.expiresAt <= Date.now()) {
            return null;
        }
        return {
            ...cached.quote,
            isFallback: true,
            source: cached.quote.source === 'live' ? 'cache' : cached.quote.source,
        };
    }
    getStaleCachedQuote(symbol) {
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
    cacheQuote(quote, ttlMs) {
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
    async syncLiveQuoteToDatabase(quote) {
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
        }
        catch (error) {
            this.logger.warn(`[StockApiService] DB sync skipped for ${quote.symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    canMakeExternalRequest() {
        const now = Date.now();
        while (this.recentRequestTimestamps.length &&
            now - this.recentRequestTimestamps[0] >= 60000) {
            this.recentRequestTimestamps.shift();
        }
        if (this.recentRequestTimestamps.length >= this.maxExternalRequestsPerMinute) {
            return false;
        }
        this.recentRequestTimestamps.push(now);
        return true;
    }
    async buildFallbackQuote(symbol) {
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
        }
        catch (error) {
            this.logger.error(`[StockApiService] Database fallback lookup failed for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        return {
            symbol,
            price: null,
            change: null,
            isFallback: true,
            source: 'fallback',
        };
    }
};
StockApiService = StockApiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], StockApiService);
exports.StockApiService = StockApiService;
//# sourceMappingURL=stock-api.service.js.map