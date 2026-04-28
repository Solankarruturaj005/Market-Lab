"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const stockCount = await prisma.stock.count();
    const priceCount = await prisma.stockPrice.count();
    console.log(`Stocks: ${stockCount}, Prices: ${priceCount}`);
    if (stockCount > 0) {
        const sample = await prisma.stock.findFirst({ include: { prices: { take: 2 } } });
        console.log('Sample stock:', JSON.stringify(sample, null, 2));
    }
    await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
//# sourceMappingURL=check-db.js.map