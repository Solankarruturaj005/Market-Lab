import { PredictionService } from './prediction.service';
export declare class PredictionController {
    private readonly predictionService;
    constructor(predictionService: PredictionService);
    getPrediction(symbol: string): Promise<{
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
