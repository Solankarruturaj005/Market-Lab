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
    timestamp: number;
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
export declare class StockService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<StockResponse[]>;
    findBySymbol(symbol: string): Promise<StockResponse>;
    getHistoryBySymbol(symbol: string, range?: string, interval?: string): Promise<StockHistoryResponse>;
    serializeStock(stock: any, historyLimit: number): StockResponse;
    private toNumberOrNull;
    private toPositiveNumberOrNull;
    private round;
    private alignHistoryToCurrentPrice;
    private createFallbackHistory;
}
