import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export interface LiveQuote {
    symbol: string;
    price: number | null;
    change: number | null;
    isFallback: boolean;
    source?: 'live' | 'cache' | 'database' | 'fallback';
}
export declare class StockApiService {
    private readonly configService;
    private readonly prisma;
    private readonly logger;
    private readonly baseUrl;
    private readonly cacheTtlMs;
    private readonly fallbackTtlMs;
    private readonly maxExternalRequestsPerMinute;
    private readonly quoteCache;
    private readonly recentRequestTimestamps;
    constructor(configService: ConfigService, prisma: PrismaService);
    getStockPrice(symbol: string): Promise<LiveQuote>;
    private normalizeSymbol;
    private parseNullableNumber;
    private parsePositiveNumber;
    private getCachedQuote;
    private getStaleCachedQuote;
    private cacheQuote;
    private syncLiveQuoteToDatabase;
    private canMakeExternalRequest;
    private buildFallbackQuote;
}
