/*
  Warnings:

  - You are about to drop the column `symbol` on the `Watchlist` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[symbol]` on the table `Stock` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,stockId]` on the table `Watchlist` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Watchlist_userId_stockId_symbol_key";

-- AlterTable
ALTER TABLE "Watchlist" DROP COLUMN "symbol";

-- CreateIndex
CREATE UNIQUE INDEX "Stock_symbol_key" ON "Stock"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Watchlist_userId_stockId_key" ON "Watchlist"("userId", "stockId");
