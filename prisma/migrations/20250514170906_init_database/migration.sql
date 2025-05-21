-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'QUEUE', 'ONGOING', 'IDLE', 'FINISHED', 'CANCELED');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('IMAGE', 'AUDIO', 'VIDEO', 'FILE');

-- CreateTable
CREATE TABLE "tb_company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sector_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_clients" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "company_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_sectors" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_model_meta_messages" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "content_json" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "company_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_model_meta_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_ticket" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "client_id" INTEGER NOT NULL,
    "sector_id" INTEGER NOT NULL,
    "status" "TicketStatus" NOT NULL,
    "attendant_id" INTEGER,
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_status_hist" (
    "id" SERIAL NOT NULL,
    "ticket_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL,
    "changed_by_user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_status_hist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_message" (
    "id" SERIAL NOT NULL,
    "ticket_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "is_from_user" BOOLEAN NOT NULL,
    "wp_id" TEXT,
    "wp_status" "MessageStatus",
    "wp_timestamp" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_message_attachment" (
    "id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "type" "AttachmentType" NOT NULL,
    "url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "caption" TEXT,

    CONSTRAINT "tb_message_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_message_buttons" (
    "id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "tb_message_buttons_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tb_users" ADD CONSTRAINT "tb_users_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "tb_sectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_users" ADD CONSTRAINT "tb_users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "tb_company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_clients" ADD CONSTRAINT "tb_clients_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "tb_company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_model_meta_messages" ADD CONSTRAINT "tb_model_meta_messages_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "tb_company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_ticket" ADD CONSTRAINT "tb_ticket_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "tb_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_ticket" ADD CONSTRAINT "tb_ticket_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "tb_sectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_ticket" ADD CONSTRAINT "tb_ticket_attendant_id_fkey" FOREIGN KEY ("attendant_id") REFERENCES "tb_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_status_hist" ADD CONSTRAINT "tb_status_hist_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tb_ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_status_hist" ADD CONSTRAINT "tb_status_hist_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "tb_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_message" ADD CONSTRAINT "tb_message_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tb_ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_message_attachment" ADD CONSTRAINT "tb_message_attachment_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "tb_message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_message_buttons" ADD CONSTRAINT "tb_message_buttons_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "tb_message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
