-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationCode" TEXT,
ADD COLUMN     "verificationCodeExpires" TIMESTAMP(3);
