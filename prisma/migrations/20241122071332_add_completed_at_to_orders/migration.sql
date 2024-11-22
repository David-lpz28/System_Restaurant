/*
  Warnings:

  - You are about to drop the column `completedTimestamp` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "completedTimestamp",
ADD COLUMN     "completedAt" TIMESTAMP(3);
