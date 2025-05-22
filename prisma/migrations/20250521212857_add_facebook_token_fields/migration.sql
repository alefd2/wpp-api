/*
  Warnings:

  - Added the required column `client_id` to the `whatsapp_credentials` table without a default value. This is not possible if the table is not empty.
  - Added the required column `client_secret` to the `whatsapp_credentials` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "whatsapp_credentials" ADD COLUMN     "client_id" TEXT NOT NULL,
ADD COLUMN     "client_secret" TEXT NOT NULL,
ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "expires_in" INTEGER,
ADD COLUMN     "fb_exchange_token" TEXT,
ADD COLUMN     "token_type" TEXT NOT NULL DEFAULT 'bearer',
ALTER COLUMN "phone_number_id" DROP NOT NULL;
