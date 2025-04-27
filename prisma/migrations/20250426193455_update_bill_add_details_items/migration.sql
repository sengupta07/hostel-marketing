/*
  Warnings:

  - You are about to drop the column `amount` on the `Bill` table. All the data in the column will be lost.
  - Added the required column `amountGiven` to the `Bill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `Bill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groceryTotal` to the `Bill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `marketingTotal` to the `Bill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalBillAmount` to the `Bill` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bill" DROP COLUMN "amount",
ADD COLUMN     "amountGiven" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "date" DATE NOT NULL,
ADD COLUMN     "groceryTotal" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "marketingTotal" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalBillAmount" DOUBLE PRECISION NOT NULL;

-- CreateTable
CREATE TABLE "BillMarketingItem" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "billId" TEXT NOT NULL,

    CONSTRAINT "BillMarketingItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BillMarketingItem_billId_idx" ON "BillMarketingItem"("billId");

-- AddForeignKey
ALTER TABLE "BillMarketingItem" ADD CONSTRAINT "BillMarketingItem_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
