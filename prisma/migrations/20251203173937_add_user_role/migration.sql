-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'AFFILIATE', 'ADMIN', 'SUPER_ADMIN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "affiliates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "cpf" TEXT,
    "code" TEXT NOT NULL,
    "commission_rate" INTEGER NOT NULL DEFAULT 10,
    "total_sales" INTEGER NOT NULL DEFAULT 0,
    "total_earned" INTEGER NOT NULL DEFAULT 0,
    "total_bookings" INTEGER NOT NULL DEFAULT 0,
    "pix_key" TEXT,
    "bank_account" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_referrals" (
    "id" TEXT NOT NULL,
    "affiliate_id" TEXT NOT NULL,
    "booking_id" TEXT,
    "package_title" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "sale_amount" INTEGER NOT NULL,
    "commission_amount" INTEGER NOT NULL,
    "commission_status" TEXT NOT NULL DEFAULT 'pending',
    "commission_paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_referrals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "affiliates_user_id_key" ON "affiliates"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "affiliates_email_key" ON "affiliates"("email");

-- CreateIndex
CREATE UNIQUE INDEX "affiliates_cpf_key" ON "affiliates"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "affiliates_code_key" ON "affiliates"("code");

-- CreateIndex
CREATE INDEX "affiliates_code_idx" ON "affiliates"("code");

-- CreateIndex
CREATE INDEX "affiliates_status_idx" ON "affiliates"("status");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_referrals_booking_id_key" ON "affiliate_referrals"("booking_id");

-- CreateIndex
CREATE INDEX "affiliate_referrals_affiliate_id_idx" ON "affiliate_referrals"("affiliate_id");

-- CreateIndex
CREATE INDEX "affiliate_referrals_booking_id_idx" ON "affiliate_referrals"("booking_id");

-- CreateIndex
CREATE INDEX "affiliate_referrals_commission_status_idx" ON "affiliate_referrals"("commission_status");

-- AddForeignKey
ALTER TABLE "affiliate_referrals" ADD CONSTRAINT "affiliate_referrals_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "affiliates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
