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
exports.WatchlistController = void 0;
const common_1 = require("@nestjs/common");
const watchlist_service_1 = require("./watchlist.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const watchlist_stock_dto_1 = require("./dto/watchlist-stock.dto");
let WatchlistController = class WatchlistController {
    constructor(watchlistService) {
        this.watchlistService = watchlistService;
    }
    async getWatchlist(req) {
        console.log(`[WatchlistController] GET /watchlist for user ${req.user.id}`);
        return this.watchlistService.getWatchlist(req.user.id);
    }
    async addToWatchlist(req, body) {
        console.log(`[WatchlistController] POST /watchlist for user ${req.user.id} and stock ${body.stockId}`);
        return this.watchlistService.addToWatchlist(req.user.id, body.stockId);
    }
    async removeFromWatchlist(req, id) {
        console.log(`[WatchlistController] DELETE /watchlist/${id} for user ${req.user.id}`);
        return this.watchlistService.removeFromWatchlist(req.user.id, id);
    }
};
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WatchlistController.prototype, "getWatchlist", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, watchlist_stock_dto_1.WatchlistStockDto]),
    __metadata("design:returntype", Promise)
], WatchlistController.prototype, "addToWatchlist", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], WatchlistController.prototype, "removeFromWatchlist", null);
WatchlistController = __decorate([
    (0, common_1.Controller)('watchlist'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [watchlist_service_1.WatchlistService])
], WatchlistController);
exports.WatchlistController = WatchlistController;
//# sourceMappingURL=watchlist.controller.js.map