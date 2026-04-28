/*
  Warnings:

  - You are about to drop the column `isActive` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `targetPrice` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `triggerType` on the `Alert` table. All the data in the column will be lost.
  - Added the required column `price` to the `Alert` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Alert" DROP COLUMN "isActive",
DROP COLUMN "targetPrice",
DROP COLUMN "triggerType",
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL;
