import { StockService } from './stock.service';
import { StockApiService } from './stock-api.service';
export declare class StockController {
    private readonly stockService;
    private readonly stockApiService;
    constructor(stockService: StockService, stockApiService: StockApiService);
    getAllStocks(): Promise<import("./stock.service").StockResponse[]>;
    getLiveStock(symbol: string): Promise<import("./stock-api.service").LiveQuote>;
    getStock(symbol: string): Promise<import("./stock.service").StockResponse>;
}
