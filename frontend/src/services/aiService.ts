import api from './api';

export interface AnalyzeStockInput {
  symbol: string;
  price?: number | null;
  change?: number | null;
  rsi?: number | null;
  macd?: number | null;
  sma20?: number | null;
  ema20?: number | null;
  volume?: number | null; // ADDED
}

export interface AnalyzeStockResult {
  symbol: string;
  summary: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  reasoning: string;
  confidence: number;
  source: 'gemini' | 'rule-based';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResult {
  reply: string;
  source: 'gemini' | 'fallback';
}

export async function analyzeStock(input: AnalyzeStockInput): Promise<AnalyzeStockResult> {
  console.log('AI ANALYZE PAYLOAD:', input);
  const { data } = await api.post<AnalyzeStockResult>('/ai/analyze-stock', input, {
    timeout: 30000,
  });
  return data;
}

export async function chatWithBot(messages: ChatMessage[]): Promise<ChatResult> {
  console.log('Calling AI API...');
  const { data } = await api.post<ChatResult>('/ai/chat', { messages }, {
    timeout: 30000,
  });
  return data;
}
