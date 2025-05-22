-- AlterTable
ALTER TABLE "whatsapp" ADD COLUMN     "department_id" INTEGER,
ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "whatsapp_credentials" (
    "id" SERIAL NOT NULL,
    "access_token" TEXT NOT NULL,
    "phone_number_id" TEXT NOT NULL,
    "business_account_id" TEXT NOT NULL,
    "app_secret" TEXT NOT NULL,
    "verify_token" TEXT NOT NULL,
    "api_url" TEXT,
    "api_version" TEXT,
    "whatsapp_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_credentials_phone_number_id_key" ON "whatsapp_credentials"("phone_number_id");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_credentials_whatsapp_id_key" ON "whatsapp_credentials"("whatsapp_id");

-- CreateIndex
CREATE INDEX "whatsapp_department_id_idx" ON "whatsapp"("department_id");

-- AddForeignKey
ALTER TABLE "whatsapp_credentials" ADD CONSTRAINT "whatsapp_credentials_whatsapp_id_fkey" FOREIGN KEY ("whatsapp_id") REFERENCES "whatsapp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp" ADD CONSTRAINT "whatsapp_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
