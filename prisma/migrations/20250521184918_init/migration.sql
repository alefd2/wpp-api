/*
  Warnings:

  - You are about to drop the `tb_clients` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_company` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_message_attachment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_message_buttons` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_model_meta_messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_sectors` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_status_hist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_ticket` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tb_users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "tb_clients" DROP CONSTRAINT "tb_clients_company_id_fkey";

-- DropForeignKey
ALTER TABLE "tb_message" DROP CONSTRAINT "tb_message_ticket_id_fkey";

-- DropForeignKey
ALTER TABLE "tb_message_attachment" DROP CONSTRAINT "tb_message_attachment_message_id_fkey";

-- DropForeignKey
ALTER TABLE "tb_message_buttons" DROP CONSTRAINT "tb_message_buttons_message_id_fkey";

-- DropForeignKey
ALTER TABLE "tb_model_meta_messages" DROP CONSTRAINT "tb_model_meta_messages_company_id_fkey";

-- DropForeignKey
ALTER TABLE "tb_status_hist" DROP CONSTRAINT "tb_status_hist_changed_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "tb_status_hist" DROP CONSTRAINT "tb_status_hist_ticket_id_fkey";

-- DropForeignKey
ALTER TABLE "tb_ticket" DROP CONSTRAINT "tb_ticket_attendant_id_fkey";

-- DropForeignKey
ALTER TABLE "tb_ticket" DROP CONSTRAINT "tb_ticket_client_id_fkey";

-- DropForeignKey
ALTER TABLE "tb_ticket" DROP CONSTRAINT "tb_ticket_sector_id_fkey";

-- DropForeignKey
ALTER TABLE "tb_users" DROP CONSTRAINT "tb_users_company_id_fkey";

-- DropForeignKey
ALTER TABLE "tb_users" DROP CONSTRAINT "tb_users_sector_id_fkey";

-- DropTable
DROP TABLE "tb_clients";

-- DropTable
DROP TABLE "tb_company";

-- DropTable
DROP TABLE "tb_message";

-- DropTable
DROP TABLE "tb_message_attachment";

-- DropTable
DROP TABLE "tb_message_buttons";

-- DropTable
DROP TABLE "tb_model_meta_messages";

-- DropTable
DROP TABLE "tb_sectors";

-- DropTable
DROP TABLE "tb_status_hist";

-- DropTable
DROP TABLE "tb_ticket";

-- DropTable
DROP TABLE "tb_users";

-- DropEnum
DROP TYPE "AttachmentType";

-- DropEnum
DROP TYPE "MessageStatus";

-- DropEnum
DROP TYPE "TicketStatus";
