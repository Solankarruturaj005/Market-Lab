"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSMA = void 0;
function calculateSMA(data, period) {
    const sma = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            sma.push(null);
            continue;
        }
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
    }
    return sma;
}
exports.calculateSMA = calculateSMA;
//# sourceMappingURL=sma.js.map