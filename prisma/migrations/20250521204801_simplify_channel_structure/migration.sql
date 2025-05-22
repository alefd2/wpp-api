/*
  Warnings:

  - You are about to drop the column `channel_number_id` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `channel_number_id` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the column `channel_number_id` on the `whatsapp_credentials` table. All the data in the column will be lost.
  - You are about to drop the `channel_numbers` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[channel_id]` on the table `whatsapp_credentials` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `channel_id` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number` to the `channels` table without a default value. This is not possible if the table is not empty.
  - Added the required column `channel_id` to the `whatsapp_credentials` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_channel_number_id_fkey";

-- DropForeignKey
ALTER TABLE "channel_numbers" DROP CONSTRAINT "channel_numbers_channel_id_fkey";

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_channel_number_id_fkey";

-- DropForeignKey
ALTER TABLE "whatsapp_credentials" DROP CONSTRAINT "whatsapp_credentials_channel_number_id_fkey";

-- DropIndex
DROP INDEX "Message_channel_number_id_idx";

-- DropIndex
DROP INDEX "whatsapp_credentials_channel_number_id_key";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "channel_number_id",
ADD COLUMN     "channel_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "channels" ADD COLUMN     "number" TEXT NOT NULL,
ADD COLUMN     "qrcode" TEXT,
ADD COLUMN     "session" TEXT,
ADD COLUMN     "settings" JSONB,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DISCONNECTED';

-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "channel_number_id",
ADD COLUMN     "channel_id" INTEGER;

-- AlterTable
ALTER TABLE "whatsapp_credentials" DROP COLUMN "channel_number_id",
ADD COLUMN     "channel_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "channel_numbers";

-- CreateIndex
CREATE INDEX "Message_channel_id_idx" ON "Message"("channel_id");

-- CreateIndex
CREATE INDEX "channels_number_idx" ON "channels"("number");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_credentials_channel_id_key" ON "whatsapp_credentials"("channel_id");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_credentials" ADD CONSTRAINT "whatsapp_credentials_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
