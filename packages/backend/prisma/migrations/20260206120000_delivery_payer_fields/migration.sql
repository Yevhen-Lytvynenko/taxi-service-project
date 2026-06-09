-- CreateEnum
CREATE TYPE "DeliveryPayer" AS ENUM ('SENDER', 'RECIPIENT', 'CLIENT');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "deliverySenderName" TEXT,
ADD COLUMN "deliverySenderPhone" TEXT,
ADD COLUMN "deliveryRecipientName" TEXT,
ADD COLUMN "deliveryRecipientPhone" TEXT,
ADD COLUMN "deliveryPayer" "DeliveryPayer";
