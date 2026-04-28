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
exports.AlertService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const stockSummarySelect = {
    id: true,
    symbol: true,
    name: true,
    price: true,
    change: true,
    volume: true,
};
let AlertService = class AlertService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAlerts(userId) {
        return this.prisma.alert.findMany({
            where: { userId },
            include: { stock: { select: stockSummarySelect } },
        });
    }
    async createAlert(userId, data) {
        const stock = await this.prisma.stock.findUnique({ where: { id: data.stockId } });
        if (!stock) {
            throw new common_1.NotFoundException('Stock not found');
        }
        return this.prisma.alert.create({
            data: {
                userId,
                stockId: data.stockId,
                targetPrice: data.targetPrice,
                triggerType: data.triggerType,
            },
            include: { stock: { select: stockSummarySelect } }
        });
    }
    async deleteAlert(userId, id) {
        const alert = await this.prisma.alert.findFirst({
            where: { id, userId },
        });
        if (!alert) {
            throw new common_1.NotFoundException('Alert not found');
        }
        return this.prisma.alert.delete({ where: { id: alert.id } });
    }
};
AlertService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AlertService);
exports.AlertService = AlertService;
//# sourceMappingURL=alert.service.js.map