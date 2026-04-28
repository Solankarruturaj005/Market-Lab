export declare class IndicatorService {
    analyzeStock(history: any[]): {
        signal: string;
        confidence: number;
        indicators: {
            sma20?: undefined;
            ema20?: undefined;
            rsi14?: undefined;
            macdHistogram?: undefined;
        };
    } | {
        signal: string;
        confidence: number;
        indicators: {
            sma20: number;
            ema20: number;
            rsi14: number;
            macdHistogram: number;
        };
    };
}
