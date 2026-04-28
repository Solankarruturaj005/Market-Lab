"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const csv = require("csv-parser");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function importCSV() {
    const results = [];
    fs.createReadStream('prisma/data/indexData.csv')
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
        console.log("Total rows:", results.length);
        const stock = await prisma.stock.create({
            data: {
                symbol: "INDEX",
                name: "Market Index",
                price: 0,
                change: 0,
                volume: 0,
            },
        });
        console.log("Stock created:", stock.id);
        for (const row of results.slice(0, 500)) {
            try {
                await prisma.stockPrice.create({
                    data: {
                        date: new Date(row.Date),
                        open: parseFloat(row.Open || 0),
                        high: parseFloat(row.High || 0),
                        low: parseFloat(row.Low || 0),
                        close: parseFloat(row.Close || 0),
                        volume: parseFloat(row.Volume || 0),
                        stockId: stock.id,
                    },
                });
            }
            catch (err) {
                console.log("Error in row:", row);
            }
        }
        console.log("✅ Data Imported Successfully");
        await prisma.$disconnect();
    });
}
importCSV();
//# sourceMappingURL=importData.js.map