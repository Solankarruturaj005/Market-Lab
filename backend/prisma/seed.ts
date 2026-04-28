import { PrismaClient } from '@prisma/client';
import { importStocksFromDataset } from './importStocks';

const prisma = new PrismaClient();

async function main() {
  const importedCount = await importStocksFromDataset(prisma);
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
