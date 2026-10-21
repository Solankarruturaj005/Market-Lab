export declare class IndicatorService {
    analyzeStock(history: any[]): {
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
