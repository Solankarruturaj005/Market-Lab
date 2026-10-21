"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const generative_ai_1 = require("@google/generative-ai");
const config_1 = require("@nestjs/config");
let AiService = AiService_1 = class AiService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(AiService_1.name);
        this.modelName = 'gemini-2.5-flash';
        this.genAI = null;
        console.log('Gemini API:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');
        const key = this.configService.get('GEMINI_API_KEY')?.trim();
        if (key) {
            this.genAI = new generative_ai_1.GoogleGenerativeAI(key);
        }
        else {
            this.logger.warn('[AiService] GEMINI_API_KEY not set — using rule-based fallback');
        }
    }
    async callGemini(prompt) {
        console.log('Gemini called');
        if (!this.genAI) {
            console.log('AI fallback used: Gemini API key missing');
            return null;
        }
        try {
            const model = this.genAI.getGenerativeModel({
                model: this.modelName,
            });
            const result = await model.generateContent(prompt);
            const text = result.response?.text()?.trim();
            console.log('Gemini response:', text);
            return text || null;
        }
        catch (err) {
            console.error('Gemini Error:', err);
            this.logger.error(`[AiService] Gemini call failed: ${err?.message ?? 'Unknown'}`);
            return null;
        }
    }
    async testGemini() {
        if (!this.genAI) {
            console.log('Gemini test skipped: API key NOT SET');
            return;
        }
        try {
            const model = this.genAI.getGenerativeModel({
                model: this.modelName,
            });
            const result = await model.generateContent('Say hello');
            console.log(result.response.text());
        }
        catch (error) {
            console.log('AI fails');
            this.logger.error(`[AiService] Gemini test failed: ${error?.message ?? 'Unknown'}`);
        }
    }
    geminiFailureFallback(input) {
        const fallback = this.ruleBasedSignal(input);
        return {
            ...fallback,
            summary: fallback.summary || 'AI unavailable, using fallback analysis',
            reasoning: fallback.reasoning || 'Fallback triggered due to AI failure',
            source: 'rule-based',
        };
    }
    ruleBasedSignal(input) {
        const { symbol, price, change, rsi, macd, sma20, volume } = input;
        let buyScore = 0;
        let sellScore = 0;
        const reasons = [];
        const safeSymbol = String(symbol ?? '').trim().toUpperCase() || 'UNKNOWN';
        if (rsi != null) {
            if (rsi < 30) {
                buyScore += 2;
                reasons.push(`RSI ${rsi.toFixed(1)} is oversold (bullish)`);
            }
            else if (rsi > 70) {
                sellScore += 2;
                reasons.push(`RSI ${rsi.toFixed(1)} is overbought (bearish)`);
            }
            else
                reasons.push(`RSI ${rsi.toFixed(1)} is neutral`);
        }
        if (macd != null) {
            if (macd > 0) {
                buyScore += 1;
                reasons.push('MACD histogram positive (upward momentum)');
            }
            else if (macd < 0) {
                sellScore += 1;
                reasons.push('MACD histogram negative (downward momentum)');
            }
        }
        if (price != null && sma20 != null) {
            if (price > sma20) {
                buyScore += 1;
                reasons.push(`Price $${price} is above SMA20 $${sma20.toFixed(2)} (bullish)`);
            }
            else {
                sellScore += 1;
                reasons.push(`Price $${price} is below SMA20 $${sma20.toFixed(2)} (bearish)`);
            }
        }
        if (change != null) {
            if (change > 2) {
                buyScore += 1;
                reasons.push(`Strong daily gain of +${change.toFixed(2)}%`);
            }
            else if (change < -2) {
                sellScore += 1;
                reasons.push(`Significant daily loss of ${change.toFixed(2)}%`);
            }
        }
        if (volume != null && Number.isFinite(Number(volume))) {
            reasons.push(`Volume is ${Number(volume).toLocaleString('en-US')}`);
        }
        const net = buyScore - sellScore;
        const signal = net >= 2 ? 'BUY' : net <= -2 ? 'SELL' : 'HOLD';
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
    async analyzeStock(input) {
        const fallback = this.ruleBasedSignal(input);
        console.log('AI INPUT:', input);
        if (input.price == null || !input.symbol) {
            console.log('AI fallback used: missing symbol or price');
            return this.ruleBasedSignal(input);
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
        console.log('PROMPT:', prompt);
        const raw = await this.callGemini(prompt);
        console.log('GEMINI RESPONSE:', raw);
        if (!raw || raw.trim() === '') {
            console.log('AI fallback used');
            return this.ruleBasedSignal(input);
        }
        if (raw.toLowerCase().includes('no data was provided')) {
            console.log('AI fallback used: Gemini reported missing data');
            return this.ruleBasedSignal(input);
        }
        try {
            const cleaned = raw
                .replace(/```(?:json)?/gi, '')
                .replace(/```/g, '')
                .trim();
            const parsed = JSON.parse(cleaned);
            const signal = String(parsed.signal ?? '').trim().toUpperCase();
            return {
                symbol: input.symbol,
                summary: String(parsed.summary ?? fallback.summary),
                signal: (['BUY', 'SELL', 'HOLD'].includes(signal) ? signal : fallback.signal),
                reasoning: String(parsed.reasoning ?? fallback.reasoning),
                confidence: Number.isFinite(Number(parsed.confidence))
                    ? Math.min(100, Math.max(0, Number(parsed.confidence)))
                    : fallback.confidence,
                source: 'gemini',
            };
        }
        catch {
            this.logger.warn('[AiService] Failed to parse Gemini response as JSON — using fallback');
            console.log('AI fallback used');
            return this.ruleBasedSignal(input);
        }
    }
    async chat(messages) {
        const combined = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
        const prompt = `
You are MarketBot, a helpful stock market assistant. Be concise.
Do NOT give personalized investment advice. Add a brief disclaimer.

Conversation:
${combined}
`;
        const reply = await this.callGemini(prompt);
        console.log('Gemini response:', reply);
        if (!reply || reply.trim() === '') {
            console.log('AI fallback used');
            return {
                reply: 'AI temporarily unavailable. Please try again.',
                source: 'fallback',
            };
        }
        return { reply, source: 'gemini' };
    }
    async summarizeNews(symbol, news) {
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
        const raw = await this.callGemini(prompt);
        if (!raw) {
            console.log('AI fallback used');
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
        }
        catch {
            console.log('AI fallback used');
            return {
                summary: raw.slice(0, 300),
                sentiment: 'neutral',
                source: 'gemini',
            };
        }
    }
};
AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiService);
exports.AiService = AiService;
//# sourceMappingURL=ai.service.js.map