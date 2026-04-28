"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importStocksFromDataset = exports.SUPPORTED_EQUITIES = void 0;
const client_1 = require("@prisma/client");
exports.SUPPORTED_EQUITIES = [
    {
        symbol: 'NVDA',
        name: 'NVIDIA Corporation',
        price: 967.88,
        change: 4.76,
        volume: 55000000,
        historyDrift: 0.42,
        volatility: 0.045,
    },
    {
        symbol: 'TSLA',
        name: 'Tesla, Inc.',
        price: 178.55,
        change: -3.41,
        volume: 87000000,
        historyDrift: -0.16,
        volatility: 0.055,
    },
    {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 214.63,
        change: 2.31,
        volume: 98000000,
        historyDrift: 0.18,
        volatility: 0.026,
    },
    {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        price: 428.21,
        change: 1.82,
        volume: 32000000,
        historyDrift: 0.24,
        volatility: 0.022,
    },
    {
        symbol: 'GOOGL',
        name: 'Alphabet Inc. Class A',
        price: 176.42,
        change: 1.17,
        volume: 29000000,
        historyDrift: 0.21,
        volatility: 0.025,
    },
    {
        symbol: 'AMZN',
        name: 'Amazon.com, Inc.',
        price: 182.94,
        change: 0.92,
        volume: 41000000,
        historyDrift: 0.27,
        volatility: 0.029,
    },
    {
        symbol: 'META',
        name: 'Meta Platforms, Inc.',
        price: 501.64,
        change: 2.04,
        volume: 18000000,
        historyDrift: 0.31,
        volatility: 0.032,
    },
    {
        symbol: 'AMD',
        name: 'Advanced Micro Devices, Inc.',
        price: 161.23,
        change: 3.18,
        volume: 49000000,
        historyDrift: 0.35,
        volatility: 0.047,
    },
];
function roundMoney(value) {
    return Number(value.toFixed(2));
}
function buildHistory(equity, days = 260) {
    const latestDate = new Date();
    latestDate.setUTCHours(0, 0, 0, 0);
    const latestClose = equity.price;
    const previousClose = latestClose / (1 + equity.change / 100);
    const firstClose = previousClose * (1 - equity.historyDrift);
    const history = [];
    for (let index = 0; index < days; index += 1) {
        const date = new Date(latestDate);
        date.setUTCDate(latestDate.getUTCDate() - (days - index - 1));
        let close;
        if (index === days - 1) {
            close = latestClose;
        }
        else if (index === days - 2) {
            close = previousClose;
        }
        else {
            const progress = index / Math.max(days - 2, 1);
            const trend = firstClose + (previousClose - firstClose) * progress;
            const wave = Math.sin(index / 7) * equity.volatility +
                Math.cos(index / 17) * (equity.volatility / 2);
            close = Math.max(1, trend * (1 + wave));
        }
        const priorClose = history[index - 1]?.close ?? close;
        const open = close * (1 + Math.sin(index / 5) * 0.004);
        const high = Math.max(open, close, priorClose) * (1 + 0.008 + Math.abs(Math.sin(index)) * 0.006);
        const low = Math.min(open, close, priorClose) * (1 - 0.008 - Math.abs(Math.cos(index)) * 0.006);
        const volume = equity.volume * (0.72 + Math.abs(Math.sin(index * 1.7)) * 0.56);
        history.push({
            date,
            close: roundMoney(close),
            open: roundMoney(open),
            high: roundMoney(high),
            low: roundMoney(Math.max(0.01, low)),
            volume: Math.trunc(volume),
        });
    }
    return history;
}
async function seedSupportedEquities(prisma) {
    let seededCount = 0;
    for (const equity of exports.SUPPORTED_EQUITIES) {
        const stock = await prisma.stock.upsert({
            where: { symbol: equity.symbol },
            update: {
                name: equity.name,
                price: equity.price,
                change: equity.change,
                volume: equity.volume,
            },
            create: {
                symbol: equity.symbol,
                name: equity.name,
                price: equity.price,
                change: equity.change,
                volume: equity.volume,
            },
        });
        await prisma.stockPrice.deleteMany({
            where: { stockId: stock.id },
        });
        await prisma.stockPrice.createMany({
            data: buildHistory(equity).map((point) => ({
                ...point,
                stockId: stock.id,
            })),
            skipDuplicates: true,
        });
        seededCount += 1;
    }
    return seededCount;
}
async function importStocksFromDataset(prisma) {
    return seedSupportedEquities(prisma);
}
exports.importStocksFromDataset = importStocksFromDataset;
async function main() {
    const prisma = new client_1.PrismaClient();
    try {
        const importedCount = await importStocksFromDataset(prisma);
        console.log(`Seeded ${importedCount} real high-volume equities`);
    }
    finally {
        await prisma.$disconnect();
    }
}
if (require.main === module) {
    void main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
//# sourceMappingURL=importStocks.js.map