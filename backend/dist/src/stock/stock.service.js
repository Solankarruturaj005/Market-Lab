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
exports.StockService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let StockService = class StockService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        console.log('[StockService] findAll()');
        const stocks = await this.prisma.stock.findMany({
            include: {
                prices: true,
            },
            orderBy: [{ volume: 'desc' }, { symbol: 'asc' }],
        });
        console.log(`[StockService] Found ${stocks.length} stocks`);
        return stocks.map((stock) => this.serializeStock(stock, 90));
    }
    async findBySymbol(symbol) {
        const upperSymbol = symbol.trim().toUpperCase();
        console.log(`[StockService] findBySymbol(${upperSymbol})`);
        const stock = await this.prisma.stock.findUnique({
            where: { symbol: upperSymbol },
            include: {
                prices: true,
            },
        });
        if (!stock) {
            console.warn(`[StockService] Stock ${upperSymbol} not found`);
            throw new common_1.NotFoundException(`Stock with symbol ${symbol} not found`);
        }
        console.log(`[StockService] Found stock ${upperSymbol} with ${stock.prices.length} price records`);
        return this.serializeStock(stock, 365);
    }
    serializeStock(stock, historyLimit) {
        const historyByDate = new Map();
        for (const point of (stock.prices ?? []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())) {
            const close = Number(Number(point.close).toFixed(2));
            if (!Number.isFinite(close) || close <= 0) {
                continue;
            }
            const date = new Date(point.date).toISOString();
            historyByDate.set(date, { date, close });
        }
        const history = Array.from(historyByDate.values())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-historyLimit);
        return {
            id: stock.id,
            symbol: stock.symbol,
            name: stock.name,
            price: this.toPositiveNumberOrNull(stock.price),
            change: this.toNumberOrNull(stock.change),
            volume: Number(stock.volume) || 0,
            isFallback: true,
            source: 'database',
            history,
        };
    }
    toNumberOrNull(value) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    toPositiveNumberOrNull(value) {
        const parsed = this.toNumberOrNull(value);
        return parsed != null && parsed > 0 ? parsed : null;
    }
};
StockService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StockService);
exports.StockService = StockService;
//# sourceMappingURL=stock.service.js.map