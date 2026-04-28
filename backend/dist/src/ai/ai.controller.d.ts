import { AiService, AnalyzeStockInput, ChatMessage, NewsItem } from './ai.service';
declare class AnalyzeStockDto implements AnalyzeStockInput {
    symbol: string;
    price?: number | null;
    change?: number | null;
    rsi?: number | null;
    macd?: number | null;
    sma20?: number | null;
    ema20?: number | null;
}
declare class ChatDto {
    messages: ChatMessage[];
}
declare class SummarizeNewsDto {
    symbol: string;
    news: NewsItem[];
}
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    analyzeStock(body: AnalyzeStockDto): Promise<import("./ai.service").AnalyzeStockResult>;
    chat(body: ChatDto): Promise<import("./ai.service").ChatResult>;
    summarizeNews(body: SummarizeNewsDto, _req: any): Promise<import("./ai.service").NewsSummaryResult>;
}
export {};
