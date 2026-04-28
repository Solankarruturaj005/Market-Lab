"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateMACD = void 0;
const ema_1 = require("./ema");
function calculateMACD(data) {
    const ema12 = (0, ema_1.calculateEMA)(data, 12);
    const ema26 = (0, ema_1.calculateEMA)(data, 26);
    const macdLine = [];
    for (let i = 0; i < data.length; i++) {
        if (ema12[i] !== null && ema26[i] !== null) {
            macdLine.push(ema12[i] - ema26[i]);
        }
        else {
            macdLine.push(null);
        }
    }
    const validMacd = macdLine.filter(val => val !== null);
    const signalEma = (0, ema_1.calculateEMA)(validMacd, 9);
    const signalLine = [];
    const histogram = [];
    let signalIdx = 0;
    for (let i = 0; i < data.length; i++) {
        if (macdLine[i] === null) {
            signalLine.push(null);
            histogram.push(null);
        }
        else {
            const sig = signalEma[signalIdx++];
            signalLine.push(sig);
            histogram.push(macdLine[i] - sig);
        }
    }
    return { macdLine, signalLine, histogram };
}
exports.calculateMACD = calculateMACD;
//# sourceMappingURL=macd.js.map