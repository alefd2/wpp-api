/*
  Warnings:

  - You are about to drop the column `whatsapp_id` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the column `whatsapp_id` on the `whatsapp_credentials` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[channel_number_id]` on the table `whatsapp_credentials` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `channel_number_id` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `channel_number_id` to the `whatsapp_credentials` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_whatsappId_fkey";

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_whatsapp_id_fkey";

-- DropForeignKey
ALTER TABLE "whatsapp_credentials" DROP CONSTRAINT "whatsapp_credentials_whatsapp_id_fkey";

-- DropIndex
DROP INDEX "Message_whatsappId_idx";

-- DropIndex
DROP INDEX "whatsapp_credentials_whatsapp_id_key";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "channel_number_id" INTEGER NOT NULL,
ALTER COLUMN "whatsappId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "whatsapp_id",
ADD COLUMN     "channel_number_id" INTEGER,
ADD COLUMN     "whatsappId" INTEGER;

-- AlterTable
ALTER TABLE "whatsapp" ADD COLUMN     "whatsappCredentialId" INTEGER;

-- AlterTable
ALTER TABLE "whatsapp_credentials" DROP COLUMN "whatsapp_id",
ADD COLUMN     "channel_number_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "channels" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "company_id" INTEGER NOT NULL,
    "department_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_numbers" (
    "id" SERIAL NOT NULL,
    "number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DISCONNECTED',
    "session" TEXT,
    "qrcode" TEXT,
    "settings" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "channel_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "channels_company_id_idx" ON "channels"("company_id");

-- CreateIndex
CREATE INDEX "channels_department_id_idx" ON "channels"("department_id");

-- CreateIndex
CREATE INDEX "channels_type_idx" ON "channels"("type");

-- CreateIndex
CREATE INDEX "channel_numbers_channel_id_idx" ON "channel_numbers"("channel_id");

-- CreateIndex
CREATE INDEX "channel_numbers_number_idx" ON "channel_numbers"("number");

-- CreateIndex
CREATE INDEX "Message_channel_number_id_idx" ON "Message"("channel_number_id");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_credentials_channel_number_id_key" ON "whatsapp_credentials"("channel_number_id");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_channel_number_id_fkey" FOREIGN KEY ("channel_number_id") REFERENCES "channel_numbers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_whatsappId_fkey" FOREIGN KEY ("whatsappId") REFERENCES "whatsapp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_channel_number_id_fkey" FOREIGN KEY ("channel_number_id") REFERENCES "channel_numbers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_whatsappId_fkey" FOREIGN KEY ("whatsappId") REFERENCES "whatsapp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_numbers" ADD CONSTRAINT "channel_numbers_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_credentials" ADD CONSTRAINT "whatsapp_credentials_channel_number_id_fkey" FOREIGN KEY ("channel_number_id") REFERENCES "channel_numbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp" ADD CONSTRAINT "whatsapp_whatsappCredentialId_fkey" FOREIGN KEY ("whatsappCredentialId") REFERENCES "whatsapp_credentials"("id") ON DELETE SET NULL ON UPDATE CASCADE;
