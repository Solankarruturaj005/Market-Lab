/*
  Warnings:

  - A unique constraint covering the columns `[userId,stockId,symbol]` on the table `Watchlist` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `symbol` to the `Watchlist` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Watchlist_userId_stockId_key";

-- AlterTable
ALTER TABLE "Watchlist" ADD COLUMN     "symbol" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Watchlist_userId_stockId_symbol_key" ON "Watchlist"("userId", "stockId", "symbol");
