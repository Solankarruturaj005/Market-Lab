import api from './api';

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

export async function analyzeStock(input: AnalyzeStockInput): Promise<AnalyzeStockResult> {
  const { data } = await api.post<AnalyzeStockResult>('/ai/analyze-stock', input);
  return data;
}

export async function chatWithBot(messages: ChatMessage[]): Promise<ChatResult> {
  const { data } = await api.post<ChatResult>('/ai/chat', { messages });
  return data;
}
