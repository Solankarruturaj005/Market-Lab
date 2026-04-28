import { PrismaService } from '../prisma/prisma.service';
import { IndicatorService } from '../indicator/indicator.service';
import { StockService } from '../stock/stock.service';
export declare class PredictionService {
    private prisma;
    private indicatorService;
    private stockService;
    constructor(prisma: PrismaService, indicatorService: IndicatorService, stockService: StockService);
    getPredictionForSymbol(symbol: string): Promise<{
        symbol: string;
        prediction: string;
        confidence: number;
        indicators: {
            sma20?: undefined;
            ema20?: undefined;
            rsi14?: undefined;
            macdHistogram?: undefined;
        } | {
            sma20: number;
            ema20: number;
            rsi14: number;
            macdHistogram: number;
        };
    }>;
}
