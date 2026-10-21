import { AiService, AnalyzeStockInput, ChatMessage, NewsItem } from './ai.service';
export declare class ChatMessageDto implements ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}
export declare class NewsItemDto implements NewsItem {
    title: string;
    content?: string;
}
export declare class AnalyzeStockDto implements AnalyzeStockInput {
    symbol: string;
    price?: number | null;
    change?: number | null;
    rsi?: number | null;
    macd?: number | null;
    sma20?: number | null;
    ema20?: number | null;
    volume?: number | null;
}
export declare class ChatDto {
    messages: ChatMessageDto[];
}
export declare class SummarizeNewsDto {
    symbol: string;
    news: NewsItemDto[];
}
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    analyzeStock(body: AnalyzeStockDto): Promise<import("./ai.service").AnalyzeStockResult>;
    chat(body: ChatDto): Promise<import("./ai.service").ChatResult>;
    summarizeNews(body: SummarizeNewsDto, _req: any): Promise<import("./ai.service").NewsSummaryResult>;
}
