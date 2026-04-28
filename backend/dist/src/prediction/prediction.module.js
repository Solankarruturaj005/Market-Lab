"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionModule = void 0;
const common_1 = require("@nestjs/common");
const prediction_service_1 = require("./prediction.service");
const prediction_controller_1 = require("./prediction.controller");
const indicator_module_1 = require("../indicator/indicator.module");
const stock_module_1 = require("../stock/stock.module");
let PredictionModule = class PredictionModule {
};
PredictionModule = __decorate([
    (0, common_1.Module)({
        imports: [indicator_module_1.IndicatorModule, stock_module_1.StockModule],
        providers: [prediction_service_1.PredictionService],
        controllers: [prediction_controller_1.PredictionController],
    })
], PredictionModule);
exports.PredictionModule = PredictionModule;
//# sourceMappingURL=prediction.module.js.map