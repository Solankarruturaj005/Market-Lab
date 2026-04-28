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
exports.WatchlistService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const stock_service_1 = require("../stock/stock.service");
let WatchlistService = class WatchlistService {
    constructor(prisma, stockService) {
        this.prisma = prisma;
        this.stockService = stockService;
    }
    async getWatchlist(userId) {
        console.log(`[WatchlistService] Loading watchlist for user ${userId}`);
        const items = await this.prisma.watchlist.findMany({
            where: { userId },
            include: { stock: { include: { prices: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return items.map((item) => ({
            ...item,
            stock: this.stockService.serializeStock(item.stock, 90),
        }));
    }
    async addToWatchlist(userId, stockId) {
        console.log(`[WatchlistService] Adding stock ${stockId} to watchlist for user ${userId}`);
        const stock = await this.prisma.stock.findUnique({ where: { id: stockId } });
        if (!stock) {
            throw new common_1.NotFoundException('Stock not found');
        }
        try {
            const item = await this.prisma.watchlist.create({
                data: { userId, stockId },
                include: { stock: { include: { prices: true } } },
            });
            return {
                ...item,
                stock: this.stockService.serializeStock(item.stock, 90),
            };
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException('Stock is already in your watchlist');
            }
            console.error('[WatchlistService] Failed to add stock to watchlist', error);
            throw new common_1.InternalServerErrorException('Unable to update your watchlist');
        }
    }
    async removeFromWatchlist(userId, id) {
        console.log(`[WatchlistService] Removing watchlist item ${id} for user ${userId}`);
        const item = await this.prisma.watchlist.findFirst({
            where: {
                userId,
                OR: [{ id }, { stockId: id }],
            },
            include: { stock: { include: { prices: true } } },
        });
        if (!item) {
            throw new common_1.NotFoundException('Watchlist item not found');
        }
        await this.prisma.watchlist.delete({
            where: { id: item.id },
        });
        return {
            id: item.id,
            stockId: item.stockId,
            stock: this.stockService.serializeStock(item.stock, 90),
            removed: true,
        };
    }
};
WatchlistService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        stock_service_1.StockService])
], WatchlistService);
exports.WatchlistService = WatchlistService;
//# sourceMappingURL=watchlist.service.js.map