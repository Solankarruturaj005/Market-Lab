import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
