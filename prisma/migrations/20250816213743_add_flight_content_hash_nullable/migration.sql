/*
  Warnings:

  - A unique constraint covering the columns `[userId,contentHash]` on the table `Flight` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Flight" ADD COLUMN "contentHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Flight_userId_contentHash_key" ON "Flight"("userId", "contentHash");
