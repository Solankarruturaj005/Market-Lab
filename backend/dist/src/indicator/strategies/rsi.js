"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateRSI = void 0;
function calculateRSI(data, period = 14) {
    const rsi = [];
    let gains = 0;
    let losses = 0;
    for (let i = 0; i < data.length; i++) {
        if (i === 0) {
            rsi.push(null);
            continue;
        }
        const change = data[i] - data[i - 1];
        if (change > 0) {
            gains += change;
        }
        else {
            losses -= change;
        }
        if (i < period) {
            rsi.push(null);
            if (i === period - 1) {
                gains /= period;
                losses /= period;
                const rs = gains / (losses === 0 ? 1 : losses);
                rsi.push(100 - 100 / (1 + rs));
            }
            continue;
        }
        const currentGain = change > 0 ? change : 0;
        const currentLoss = change < 0 ? -change : 0;
        gains = (gains * (period - 1) + currentGain) / period;
        losses = (losses * (period - 1) + currentLoss) / period;
        const rs = gains / (losses === 0 ? 1 : losses);
        rsi.push(100 - 100 / (1 + rs));
    }
    return rsi;
}
exports.calculateRSI = calculateRSI;
//# sourceMappingURL=rsi.js.map