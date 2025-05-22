-- DropIndex
DROP INDEX "whatsapp_credentials_company_id_key";

-- AlterTable
ALTER TABLE "whatsapp_credentials" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "whatsapp_credentials_company_id_active_idx" ON "whatsapp_credentials"("company_id", "active");
