import { ConfigService } from '@nestjs/config';
export interface AnalyzeStockInput {
    symbol: string;
    price?: number | null;
    change?: number | null;
    rsi?: number | null;
    macd?: number | null;
    sma20?: number | null;
    ema20?: number | null;
}
export interface AnalyzeStockResult {
    symbol: string;
    summary: string;
    signal: 'BUY' | 'SELL' | 'HOLD';
    reasoning: string;
    confidence: number;
    source: 'openai' | 'rule-based';
}
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}
export interface ChatResult {
    reply: string;
    source: 'openai' | 'fallback';
}
export interface NewsItem {
    title: string;
    content?: string;
}
export interface NewsSummaryResult {
    summary: string;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    source: 'openai' | 'fallback';
}
export declare class AiService {
    private readonly configService;
    private readonly logger;
    private readonly openaiUrl;
    private readonly model;
    constructor(configService: ConfigService);
    private get apiKey();
    private callOpenAI;
    private ruleBasedSignal;
    analyzeStock(input: AnalyzeStockInput): Promise<AnalyzeStockResult>;
    chat(messages: ChatMessage[]): Promise<ChatResult>;
    summarizeNews(symbol: string, news: NewsItem[]): Promise<NewsSummaryResult>;
}
