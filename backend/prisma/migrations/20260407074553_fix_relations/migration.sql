/*
  Warnings:

  - You are about to drop the column `history` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Stock` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Stock_symbol_key";

-- AlterTable
ALTER TABLE "Stock" DROP COLUMN "history",
DROP COLUMN "updatedAt",
ALTER COLUMN "volume" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "StockPrice" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "open" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "close" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "stockId" INTEGER NOT NULL,

    CONSTRAINT "StockPrice_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StockPrice" ADD CONSTRAINT "StockPrice_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
