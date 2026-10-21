import { ConfigService } from '@nestjs/config';
export interface AnalyzeStockInput {
    symbol: string;
    price?: number | null;
    change?: number | null;
    rsi?: number | null;
    macd?: number | null;
    sma20?: number | null;
    ema20?: number | null;
    volume?: number | null;
}
export interface AnalyzeStockResult {
    symbol: string;
    summary: string;
    signal: 'BUY' | 'SELL' | 'HOLD';
    reasoning: string;
    confidence: number;
    source: 'rule-based' | 'gemini';
}
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}
export interface ChatResult {
    reply: string;
    source: 'fallback' | 'gemini';
}
export interface NewsItem {
    title: string;
    content?: string;
}
export interface NewsSummaryResult {
    summary: string;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    source: 'fallback' | 'gemini';
}
export declare class AiService {
    private readonly configService;
    private readonly logger;
    private readonly modelName;
    private genAI;
    constructor(configService: ConfigService);
    private callGemini;
    testGemini(): Promise<void>;
    private geminiFailureFallback;
    private ruleBasedSignal;
    analyzeStock(input: AnalyzeStockInput): Promise<AnalyzeStockResult>;
    chat(messages: ChatMessage[]): Promise<ChatResult>;
    summarizeNews(symbol: string, news: NewsItem[]): Promise<NewsSummaryResult>;
}
