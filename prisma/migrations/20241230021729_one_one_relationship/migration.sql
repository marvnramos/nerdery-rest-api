/*
  Warnings:

  - A unique constraint covering the columns `[order_id]` on the table `PaymentDetail` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PaymentDetail_order_id_key" ON "PaymentDetail"("order_id");
