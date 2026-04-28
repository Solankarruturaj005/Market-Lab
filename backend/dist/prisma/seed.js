"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const importStocks_1 = require("./importStocks");
const prisma = new client_1.PrismaClient();
async function main() {
    const importedCount = await (0, importStocks_1.importStocksFromDataset)(prisma);
    console.log(`Seeded ${importedCount} real high-volume stocks`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map