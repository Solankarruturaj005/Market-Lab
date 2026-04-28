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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const indicator_service_1 = require("../indicator/indicator.service");
const stock_service_1 = require("../stock/stock.service");
let PredictionService = class PredictionService {
    constructor(prisma, indicatorService, stockService) {
        this.prisma = prisma;
        this.indicatorService = indicatorService;
        this.stockService = stockService;
    }
    async getPredictionForSymbol(symbol) {
        const stock = await this.stockService.findBySymbol(symbol);
        if (!stock) {
            throw new common_1.NotFoundException(`Stock not found`);
        }
        try {
            const analysis = this.indicatorService.analyzeStock(stock.history);
            console.log(`[PredictionService] Analysis for ${symbol}:`, analysis.signal);
            return {
                symbol: stock.symbol,
                prediction: analysis.signal,
                confidence: analysis.confidence,
                indicators: analysis.indicators,
            };
        }
        catch (err) {
            console.warn(`[PredictionService] Indicator computation failed for ${symbol}:`, err?.message);
            return {
                symbol: stock.symbol,
                prediction: 'HOLD',
                confidence: 0,
                indicators: {
                    sma20: null,
                    ema20: null,
                    rsi14: null,
                    macdHistogram: null,
                },
            };
        }
    }
};
PredictionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        indicator_service_1.IndicatorService,
        stock_service_1.StockService])
], PredictionService);
exports.PredictionService = PredictionService;
//# sourceMappingURL=prediction.service.js.map