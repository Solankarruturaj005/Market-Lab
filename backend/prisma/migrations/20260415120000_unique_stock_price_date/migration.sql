-- Remove duplicate daily price rows before enforcing one row per stock per date.
DELETE FROM "StockPrice" a
USING "StockPrice" b
WHERE a.id < b.id
  AND a."stockId" = b."stockId"
  AND a.date = b.date;

-- CreateIndex
CREATE UNIQUE INDEX "StockPrice_stockId_date_key" ON "StockPrice"("stockId", "date");
