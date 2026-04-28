import { WatchlistService } from './watchlist.service';
import { WatchlistStockDto } from './dto/watchlist-stock.dto';
export declare class WatchlistController {
    private readonly watchlistService;
    constructor(watchlistService: WatchlistService);
    getWatchlist(req: any): Promise<{
        stock: import("../stock/stock.service").StockResponse;
        id: number;
        createdAt: Date;
        stockId: number;
        userId: number;
    }[]>;
    addToWatchlist(req: any, body: WatchlistStockDto): Promise<{
        stock: import("../stock/stock.service").StockResponse;
        id: number;
        createdAt: Date;
        stockId: number;
        userId: number;
    }>;
    removeFromWatchlist(req: any, id: number): Promise<{
        id: number;
        stockId: number;
        stock: import("../stock/stock.service").StockResponse;
        removed: boolean;
    }>;
}
