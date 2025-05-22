/*
  Warnings:

  - You are about to drop the column `channel_id` on the `whatsapp_credentials` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[company_id]` on the table `whatsapp_credentials` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `company_id` to the `whatsapp_credentials` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "whatsapp_credentials" DROP CONSTRAINT "whatsapp_credentials_channel_id_fkey";

-- DropIndex
DROP INDEX "whatsapp_credentials_channel_id_key";

-- AlterTable
ALTER TABLE "whatsapp_credentials" DROP COLUMN "channel_id",
ADD COLUMN     "company_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_credentials_company_id_key" ON "whatsapp_credentials"("company_id");

-- AddForeignKey
ALTER TABLE "whatsapp_credentials" ADD CONSTRAINT "whatsapp_credentials_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
