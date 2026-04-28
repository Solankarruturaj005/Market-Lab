"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndicatorService = void 0;
const common_1 = require("@nestjs/common");
const sma_1 = require("./strategies/sma");
const ema_1 = require("./strategies/ema");
const rsi_1 = require("./strategies/rsi");
const macd_1 = require("./strategies/macd");
let IndicatorService = class IndicatorService {
    analyzeStock(history) {
        if (!history || history.length < 30) {
            return { signal: 'HOLD', confidence: 50, indicators: {} };
        }
        const closes = history.map(item => Number(item.close));
        const sma20 = (0, sma_1.calculateSMA)(closes, 20);
        const ema20 = (0, ema_1.calculateEMA)(closes, 20);
        const rsi14 = (0, rsi_1.calculateRSI)(closes, 14);
        const macd = (0, macd_1.calculateMACD)(closes);
        const currentPrice = closes[closes.length - 1];
        const currentSMA = sma20[sma20.length - 1];
        const currentRSI = rsi14[rsi14.length - 1];
        const currentMACDHistogram = macd.histogram[macd.histogram.length - 1];
        let buyScore = 0;
        let sellScore = 0;
        if (currentRSI < 30)
            buyScore += 2;
        else if (currentRSI > 70)
            sellScore += 2;
        if (currentPrice > currentSMA)
            buyScore += 1;
        else if (currentPrice < currentSMA)
            sellScore += 1;
        if (currentMACDHistogram > 0)
            buyScore += 1;
        else if (currentMACDHistogram < 0)
            sellScore += 1;
        let signal = 'HOLD';
        let confidence = 50;
        if (buyScore > sellScore && buyScore >= 2) {
            signal = 'BUY';
            confidence = 60 + (buyScore * 10);
        }
        else if (sellScore > buyScore && sellScore >= 2) {
            signal = 'SELL';
            confidence = 60 + (sellScore * 10);
        }
        return {
            signal,
            confidence: Math.min(confidence, 100),
            indicators: {
                sma20: currentSMA,
                ema20: ema20[ema20.length - 1],
                rsi14: currentRSI,
                macdHistogram: currentMACDHistogram,
            }
        };
    }
};
IndicatorService = __decorate([
    (0, common_1.Injectable)()
], IndicatorService);
exports.IndicatorService = IndicatorService;
//# sourceMappingURL=indicator.service.js.map