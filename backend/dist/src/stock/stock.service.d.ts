import { PrismaService } from '../prisma/prisma.service';
export interface HistoryPoint {
    date: string;
    close: number;
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
    serializeStock(stock: any, historyLimit: number): StockResponse;
    private toNumberOrNull;
    private toPositiveNumberOrNull;
}
