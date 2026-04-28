"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateEMA = void 0;
function calculateEMA(data, period) {
    const ema = [];
    const multiplier = 2 / (period + 1);
    for (let i = 0; i < data.length; i++) {
        if (i === 0) {
            ema.push(data[i]);
            continue;
        }
        const prevEma = ema[i - 1];
        const currentEma = (data[i] - prevEma) * multiplier + prevEma;
        ema.push(currentEma);
    }
    return ema;
}
exports.calculateEMA = calculateEMA;
//# sourceMappingURL=ema.js.map