import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

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

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openaiUrl = 'https://api.openai.com/v1/chat/completions';
  private readonly model = 'gpt-3.5-turbo';

  constructor(private readonly configService: ConfigService) {}

  private get apiKey(): string | undefined {
    return this.configService.get<string>('OPENAI_API_KEY')?.trim();
  }

  private async callOpenAI(
    messages: { role: string; content: string }[],
    maxTokens = 400,
  ): Promise<string | null> {
    const key = this.apiKey;

    if (!key) {
      this.logger.warn('[AiService] OPENAI_API_KEY not set — using rule-based fallback');
      return null;
    }

    try {
      const response = await axios.post(
        this.openaiUrl,
        {
          model: this.model,
          messages,
          max_tokens: maxTokens,
          temperature: 0.4,
        },
        {
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          timeout: 15_000,
        },
      );

      return response.data?.choices?.[0]?.message?.content?.trim() ?? null;
    } catch (err: any) {
      const msg = axios.isAxiosError(err)
        ? `${err.message} (status: ${err.response?.status})`
        : err?.message ?? 'Unknown';
      this.logger.error(`[AiService] OpenAI call failed: ${msg}`);
      return null;
    }
  }

  // ─── Rule-based fallback analysis ─────────────────────────────────────────
  private ruleBasedSignal(input: AnalyzeStockInput): AnalyzeStockResult {
    const { symbol, price, change, rsi, macd, sma20 } = input;
    let buyScore = 0;
    let sellScore = 0;
    const reasons: string[] = [];

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

    const net = buyScore - sellScore;
    const signal: 'BUY' | 'SELL' | 'HOLD' = net >= 2 ? 'BUY' : net <= -2 ? 'SELL' : 'HOLD';
    const confidence = Math.min(95, 50 + Math.abs(net) * 12);

    const dirWord = signal === 'BUY' ? 'bullish' : signal === 'SELL' ? 'bearish' : 'mixed';
    const summary = `${symbol} shows ${dirWord} technicals. Price is $${price ?? 'N/A'} with a ${change != null ? (change >= 0 ? '+' : '') + change.toFixed(2) + '% daily change' : 'unknown daily change'}.`;

    return {
      symbol,
      summary,
      signal,
      reasoning: reasons.join(' | ') || 'Insufficient data for detailed analysis.',
      confidence: Math.round(confidence),
      source: 'rule-based',
    };
  }

  // ─── Analyze Stock ─────────────────────────────────────────────────────────
  async analyzeStock(input: AnalyzeStockInput): Promise<AnalyzeStockResult> {
    const fallback = this.ruleBasedSignal(input);

    const prompt = [
      {
        role: 'system',
        content:
          'You are a professional stock market analyst. Given technical data, produce a short JSON analysis with keys: summary (string), signal ("BUY"|"SELL"|"HOLD"), reasoning (string), confidence (0-100 integer). Be concise and factual. Return ONLY valid JSON.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          symbol: input.symbol,
          price: input.price,
          dailyChange: input.change,
          rsi14: input.rsi,
          macdHistogram: input.macd,
          sma20: input.sma20,
          ema20: input.ema20,
        }),
      },
    ];

    const raw = await this.callOpenAI(prompt);

    if (!raw) {
      return fallback;
    }

    try {
      // Strip markdown code fences if present
      const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        symbol: input.symbol,
        summary: String(parsed.summary ?? fallback.summary),
        signal: (['BUY', 'SELL', 'HOLD'].includes(parsed.signal) ? parsed.signal : fallback.signal) as 'BUY' | 'SELL' | 'HOLD',
        reasoning: String(parsed.reasoning ?? fallback.reasoning),
        confidence: Number.isFinite(Number(parsed.confidence)) ? Math.min(100, Math.max(0, Number(parsed.confidence))) : fallback.confidence,
        source: 'openai',
      };
    } catch {
      this.logger.warn('[AiService] Failed to parse OpenAI response as JSON — using fallback');
      return { ...fallback, summary: raw.slice(0, 300), source: 'openai' };
    }
  }

  // ─── Chatbot ───────────────────────────────────────────────────────────────
  async chat(messages: ChatMessage[]): Promise<ChatResult> {
    const systemMsg = {
      role: 'system',
      content:
        'You are MarketBot, a helpful AI assistant specializing in stock market analysis, technical indicators, and investment concepts. Be concise and professional. Do NOT give personalized investment advice — always add a brief disclaimer.',
    };

    const openaiMessages = [
      systemMsg,
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const reply = await this.callOpenAI(openaiMessages, 500);

    if (!reply) {
      return {
        reply:
          'I\'m temporarily unavailable (no OpenAI key configured). Set OPENAI_API_KEY in backend/.env to enable AI chat. For now, use the Technical Indicators section on each stock page for analysis.',
        source: 'fallback',
      };
    }

    return { reply, source: 'openai' };
  }

  // ─── News Summarization ────────────────────────────────────────────────────
  async summarizeNews(symbol: string, news: NewsItem[]): Promise<NewsSummaryResult> {
    if (!news || news.length === 0) {
      return {
        summary: `No news articles provided for ${symbol}.`,
        sentiment: 'neutral',
        source: 'fallback',
      };
    }

    const prompt = [
      {
        role: 'system',
        content:
          'You are a financial news analyst. Summarize the provided news articles about a stock and classify overall market sentiment. Return valid JSON only with keys: summary (string, max 150 words), sentiment ("bullish"|"bearish"|"neutral").',
      },
      {
        role: 'user',
        content: `Symbol: ${symbol}\n\nArticles:\n${news
          .slice(0, 5)
          .map((n, i) => `${i + 1}. ${n.title}${n.content ? ': ' + n.content.slice(0, 200) : ''}`)
          .join('\n')}`,
      },
    ];

    const raw = await this.callOpenAI(prompt, 300);

    if (!raw) {
      return {
        summary: `Unable to summarize news for ${symbol} — OpenAI key not configured. Add OPENAI_API_KEY to backend/.env.`,
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
        source: 'openai',
      };
    } catch {
      return {
        summary: raw.slice(0, 300),
        sentiment: 'neutral',
        source: 'openai',
      };
    }
  }
}
