/*
  Warnings:

  - You are about to drop the column `settings` on the `channels` table. All the data in the column will be lost.
  - You are about to drop the column `whatsappCredentialId` on the `channels` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "channels" DROP CONSTRAINT "channels_whatsappCredentialId_fkey";

-- AlterTable
ALTER TABLE "channels" DROP COLUMN "settings",
DROP COLUMN "whatsappCredentialId",
ADD COLUMN     "accountWBId" TEXT,
ADD COLUMN     "fbNumberPhoneId" TEXT,
ADD COLUMN     "whatsapp_credential_id" INTEGER;

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_whatsapp_credential_id_fkey" FOREIGN KEY ("whatsapp_credential_id") REFERENCES "whatsapp_credentials"("id") ON DELETE SET NULL ON UPDATE CASCADE;
