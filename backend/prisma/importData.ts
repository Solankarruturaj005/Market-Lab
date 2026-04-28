import * as fs from 'fs';
import * as csv from 'csv-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function importCSV() {
const results: any[] = [];

fs.createReadStream('prisma/data/indexData.csv')
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
    console.log("Total rows:", results.length);

      // ✅ Create one stock (INDEX)
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

      // ✅ Insert price history
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
        } catch (err) {
        console.log("Error in row:", row);
        }
    }

    console.log("✅ Data Imported Successfully");
    await prisma.$disconnect();
    });
}

importCSV();