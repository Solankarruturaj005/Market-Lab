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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockController = void 0;
const common_1 = require("@nestjs/common");
const stock_service_1 = require("./stock.service");
const stock_api_service_1 = require("./stock-api.service");
let StockController = class StockController {
    constructor(stockService, stockApiService) {
        this.stockService = stockService;
        this.stockApiService = stockApiService;
    }
    async getAllStocks() {
        console.log('[StockController] GET /stocks');
        return this.stockService.findAll();
    }
    getLiveStock(symbol) {
        return this.stockApiService.getStockPrice(symbol);
    }
    async getStock(symbol) {
        console.log(`[StockController] GET /stocks/${symbol}`);
        return this.stockService.findBySymbol(symbol);
    }
};
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StockController.prototype, "getAllStocks", null);
__decorate([
    (0, common_1.Get)('live/:symbol'),
    __param(0, (0, common_1.Param)('symbol')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StockController.prototype, "getLiveStock", null);
__decorate([
    (0, common_1.Get)(':symbol'),
    __param(0, (0, common_1.Param)('symbol')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StockController.prototype, "getStock", null);
StockController = __decorate([
    (0, common_1.Controller)('stocks'),
    __metadata("design:paramtypes", [stock_service_1.StockService,
        stock_api_service_1.StockApiService])
], StockController);
exports.StockController = StockController;
//# sourceMappingURL=stock.controller.js.map