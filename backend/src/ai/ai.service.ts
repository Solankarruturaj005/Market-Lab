import { Injectable, Logger } from '@nestjs/common'; // FIXED
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

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
  source: 'rule-based' | 'gemini'; // FIXED
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResult {
  reply: string;
  source: 'fallback' | 'gemini'; // FIXED
}

export interface NewsItem {
  title: string;
  content?: string;
}

export interface NewsSummaryResult {
  summary: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  source: 'fallback' | 'gemini'; // FIXED
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly modelName = 'gemini-2.5-flash'; // UPDATED MODEL
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private readonly configService: ConfigService) {
    console.log('Gemini API:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET'); // FIXED
    const key = this.configService.get<string>('GEMINI_API_KEY')?.trim();
    if (key) {
      this.genAI = new GoogleGenerativeAI(key);
    } else {
      this.logger.warn('[AiService] GEMINI_API_KEY not set — using rule-based fallback');
    }
  }

  // ─── Gemini Call Helper ────────────────────────────────────────────────────
  private async callGemini(prompt: string): Promise<string | null> { // FIXED
    console.log('Gemini called'); // ADDED DEBUG

    if (!this.genAI) {
      console.log('AI fallback used: Gemini API key missing'); // SAFE FALLBACK
      return null;
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName, // UPDATED MODEL
      });

      const result = await model.generateContent(prompt); // FIXED

      const text = result.response?.text()?.trim();
      console.log('Gemini response:', text); // ADDED DEBUG
      return text || null;
    } catch (err: any) {
      console.error('Gemini Error:', err); // FIXED
      this.logger.error(`[AiService] Gemini call failed: ${err?.message ?? 'Unknown'}`);
      return null; // SAFE FALLBACK
    }
  }

  async testGemini(): Promise<void> { // ADDED
    if (!this.genAI) {
      console.log('Gemini test skipped: API key NOT SET'); // SAFE FALLBACK
      return;
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName, // UPDATED MODEL
      });
      const result = await model.generateContent('Say hello');
      console.log(result.response.text());
    } catch (error: any) {
      console.log('AI fails'); // ADDED
      this.logger.error(`[AiService] Gemini test failed: ${error?.message ?? 'Unknown'}`);
    }
  }

  // ─── Rule-based fallback analysis (UNCHANGED) ──────────────────────────────
  private geminiFailureFallback(input: AnalyzeStockInput): AnalyzeStockResult { // SAFE FALLBACK
    const fallback = this.ruleBasedSignal(input); // FIXED

    return {
      ...fallback,
      summary: fallback.summary || 'AI unavailable, using fallback analysis',
      reasoning: fallback.reasoning || 'Fallback triggered due to AI failure',
      source: 'rule-based',
    };
  }

  private ruleBasedSignal(input: AnalyzeStockInput): AnalyzeStockResult {
    const { symbol, price, change, rsi, macd, sma20, volume } = input;
    let buyScore = 0;
    let sellScore = 0;
    const reasons: string[] = [];
    const safeSymbol = String(symbol ?? '').trim().toUpperCase() || 'UNKNOWN'; // FIXED

    if (rsi != null) {
      if (rsi < 30) { buyScore += 2; reasons.push(`RSI ${rsi.toFixed(1)} is oversold (bullish)`); }
      else if (rsi > 70) { sellScore += 2; reasons.push(`RSI ${rsi.toFixed(1)} is overbought (bearish)`); }
      else reasons.push(`RSI ${rsi.toFixed(1)} is neutral`);
    }

    if (macd != null) {
      if (macd > 0) { buyScore += 1; reasons.push('MACD histogram positive (upward momentum)'); }
      else if (macd < 0) { sellScore += 1; reasons.push('MACD histogram negative (downward momentum)'); }
    }

    if (price != null && sma20 != null) {
      if (price > sma20) { buyScore += 1; reasons.push(`Price $${price} is above SMA20 $${sma20.toFixed(2)} (bullish)`); }
      else { sellScore += 1; reasons.push(`Price $${price} is below SMA20 $${sma20.toFixed(2)} (bearish)`); }
    }

    if (change != null) {
      if (change > 2) { buyScore += 1; reasons.push(`Strong daily gain of +${change.toFixed(2)}%`); }
      else if (change < -2) { sellScore += 1; reasons.push(`Significant daily loss of ${change.toFixed(2)}%`); }
    }

    if (volume != null && Number.isFinite(Number(volume))) {
      reasons.push(`Volume is ${Number(volume).toLocaleString('en-US')}`); // ADDED
    }

    const net = buyScore - sellScore;
    const signal: 'BUY' | 'SELL' | 'HOLD' = net >= 2 ? 'BUY' : net <= -2 ? 'SELL' : 'HOLD';
    const confidence = Math.min(95, 50 + Math.abs(net) * 12);

    const dirWord = signal === 'BUY' ? 'bullish' : signal === 'SELL' ? 'bearish' : 'mixed';
    const summary = `${safeSymbol} shows ${dirWord} technicals. Price is $${price ?? 'N/A'} with a ${change != null ? (change >= 0 ? '+' : '') + change.toFixed(2) + '% daily change' : 'neutral or unavailable daily change'}.`;

    return {
      symbol: safeSymbol,
      summary,
      signal,
      reasoning: reasons.join(' | ') || 'Insufficient data for detailed analysis.',
      confidence: Math.round(confidence),
      source: 'rule-based',
    };
  }

  // ─── Analyze Stock (Gemini) ────────────────────────────────────────────────
  async analyzeStock(input: AnalyzeStockInput): Promise<AnalyzeStockResult> {
    const fallback = this.ruleBasedSignal(input);
    console.log('AI INPUT:', input); // DEBUG

    if (input.price == null || !input.symbol) {
      console.log('AI fallback used: missing symbol or price'); // DEBUG
      return this.ruleBasedSignal(input); // FIXED // SAFE FALLBACK
    }

    const prompt = `
<role>
You are a professional stock market analyst.
</role>

<context>
Stock Data:
Symbol: ${input.symbol}
Price: ${input.price}
Change: ${input.change}%
RSI: ${input.rsi}
MACD: ${input.macd}
SMA20: ${input.sma20}
Volume: ${input.volume}
</context>

<task>
Analyze the stock trend and provide recommendation.
</task>

<output_format>
Return STRICT JSON:

{
  "summary": "string",
  "signal": "BUY | SELL | HOLD",
  "reasoning": "string",
  "confidence": number (0-100)
}
</output_format>
`;

    console.log('PROMPT:', prompt); // DEBUG
    const raw = await this.callGemini(prompt);
    console.log('GEMINI RESPONSE:', raw); // DEBUG

    if (!raw || raw.trim() === '') {
      console.log('AI fallback used'); // SAFE FALLBACK
      return this.ruleBasedSignal(input); // SAFE FALLBACK
    }

    if (raw.toLowerCase().includes('no data was provided')) {
      console.log('AI fallback used: Gemini reported missing data'); // DEBUG
      return this.ruleBasedSignal(input); // FIXED // SAFE FALLBACK
    }

    try {
      const cleaned = raw
        .replace(/```(?:json)?/gi, '')
        .replace(/```/g, '')
        .trim(); // FIXED
      const parsed = JSON.parse(cleaned);
      const signal = String(parsed.signal ?? '').trim().toUpperCase(); // FIXED

      return {
        symbol: input.symbol,
        summary: String(parsed.summary ?? fallback.summary),
        signal: (['BUY', 'SELL', 'HOLD'].includes(signal) ? signal : fallback.signal) as 'BUY' | 'SELL' | 'HOLD',
        reasoning: String(parsed.reasoning ?? fallback.reasoning),
        confidence: Number.isFinite(Number(parsed.confidence))
          ? Math.min(100, Math.max(0, Number(parsed.confidence)))
          : fallback.confidence,
        source: 'gemini',
      };
    } catch {
      this.logger.warn('[AiService] Failed to parse Gemini response as JSON — using fallback');
      console.log('AI fallback used'); // SAFE FALLBACK
      return this.ruleBasedSignal(input); // SAFE FALLBACK
    }
  }

  // ─── Chatbot (Gemini) ─────────────────────────────────────────────────────
  async chat(messages: ChatMessage[]): Promise<ChatResult> {
    const combined = messages.map((m) => `${m.role}: ${m.content}`).join('\n');

    const prompt = `
You are MarketBot, a helpful stock market assistant. Be concise.
Do NOT give personalized investment advice. Add a brief disclaimer.

Conversation:
${combined}
`;

    const reply = await this.callGemini(prompt); // FIXED
    console.log('Gemini response:', reply); // ADDED DEBUG

    if (!reply || reply.trim() === '') {
      console.log('AI fallback used'); // SAFE FALLBACK
      return {
        reply: 'AI temporarily unavailable. Please try again.',
        source: 'fallback',
      };
    }

    return { reply, source: 'gemini' };
  }

  // ─── News Summarization (Gemini) ───────────────────────────────────────────
  async summarizeNews(symbol: string, news: NewsItem[]): Promise<NewsSummaryResult> {
    if (!news || news.length === 0) {
      return {
        summary: `No news articles provided for ${symbol}.`,
        sentiment: 'neutral',
        source: 'fallback',
      };
    }

    const prompt = `
Summarize the following news for ${symbol} in under 150 words and classify sentiment.
Return STRICT JSON: { "summary": string, "sentiment": "bullish"|"bearish"|"neutral" }

Articles:
${news.slice(0, 5).map((n, i) => `${i + 1}. ${n.title} ${n.content?.slice(0, 200) ?? ''}`).join('\n')}
`;

    const raw = await this.callGemini(prompt); // FIXED

    if (!raw) {
      console.log('AI fallback used'); // SAFE FALLBACK
      return {
        summary: `Unable to summarize news for ${symbol}.`,
        sentiment: 'neutral',
        source: 'fallback',
      };
    }

    try {
      const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      const sentiments = ['bullish', 'bearish', 'neutral'];

      return {
        summary: String(parsed.summary ?? raw.slice(0, 300)),
        sentiment: sentiments.includes(parsed.sentiment) ? parsed.sentiment : 'neutral',
        source: 'gemini',
      };
    } catch {
      console.log('AI fallback used'); // SAFE FALLBACK
      return {
        summary: raw.slice(0, 300),
        sentiment: 'neutral',
        source: 'gemini',
      };
    }
  }
}
