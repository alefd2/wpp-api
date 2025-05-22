/*
  Warnings:

  - You are about to drop the column `api_url` on the `whatsapp_credentials` table. All the data in the column will be lost.
  - You are about to drop the column `api_version` on the `whatsapp_credentials` table. All the data in the column will be lost.
  - You are about to drop the column `app_secret` on the `whatsapp_credentials` table. All the data in the column will be lost.
  - You are about to drop the column `business_account_id` on the `whatsapp_credentials` table. All the data in the column will be lost.
  - You are about to drop the column `phone_number_id` on the `whatsapp_credentials` table. All the data in the column will be lost.
  - You are about to drop the column `verify_token` on the `whatsapp_credentials` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "whatsapp_credentials_phone_number_id_key";

-- AlterTable
ALTER TABLE "whatsapp_credentials" DROP COLUMN "api_url",
DROP COLUMN "api_version",
DROP COLUMN "app_secret",
DROP COLUMN "business_account_id",
DROP COLUMN "phone_number_id",
DROP COLUMN "verify_token";
