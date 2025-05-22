-- AlterTable
ALTER TABLE "whatsapp" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "settings" JSONB,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'WHATSAPP_CLOUD';

-- CreateIndex
CREATE INDEX "whatsapp_company_id_idx" ON "whatsapp"("company_id");

-- CreateIndex
CREATE INDEX "whatsapp_type_idx" ON "whatsapp"("type");
