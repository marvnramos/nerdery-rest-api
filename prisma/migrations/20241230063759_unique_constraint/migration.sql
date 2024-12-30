/*
  Warnings:

  - A unique constraint covering the columns `[payment_intent_id]` on the table `PaymentDetail` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PaymentDetail_payment_intent_id_key" ON "PaymentDetail"("payment_intent_id");
