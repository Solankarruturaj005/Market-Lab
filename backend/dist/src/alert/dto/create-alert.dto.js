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
exports.CreateAlertDto = exports.AlertTriggerType = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
var AlertTriggerType;
(function (AlertTriggerType) {
    AlertTriggerType["ABOVE"] = "ABOVE";
    AlertTriggerType["BELOW"] = "BELOW";
})(AlertTriggerType = exports.AlertTriggerType || (exports.AlertTriggerType = {}));
class CreateAlertDto {
}
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateAlertDto.prototype, "stockId", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateAlertDto.prototype, "targetPrice", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(AlertTriggerType),
    __metadata("design:type", String)
], CreateAlertDto.prototype, "triggerType", void 0);
exports.CreateAlertDto = CreateAlertDto;
//# sourceMappingURL=create-alert.dto.js.map