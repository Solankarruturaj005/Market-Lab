import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../stock/stock.service';
export declare class WatchlistService {
    private prisma;
    private stockService;
    constructor(prisma: PrismaService, stockService: StockService);
    getWatchlist(userId: number): Promise<{
        stock: import("../stock/stock.service").StockResponse;
        id: number;
        createdAt: Date;
        stockId: number;
        userId: number;
    }[]>;
    addToWatchlist(userId: number, stockId: number): Promise<{
        stock: import("../stock/stock.service").StockResponse;
        id: number;
        createdAt: Date;
        stockId: number;
        userId: number;
    }>;
    removeFromWatchlist(userId: number, id: number): Promise<{
        id: number;
        stockId: number;
        stock: import("../stock/stock.service").StockResponse;
        removed: boolean;
    }>;
}
