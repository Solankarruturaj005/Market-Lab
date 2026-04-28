import { PrismaClient } from '@prisma/client';
interface SeedEquity {
    symbol: string;
    name: string;
    price: number;
    change: number;
    volume: number;
    historyDrift: number;
    volatility: number;
}
export declare const SUPPORTED_EQUITIES: SeedEquity[];
export declare function importStocksFromDataset(prisma: PrismaClient): Promise<number>;
export {};
