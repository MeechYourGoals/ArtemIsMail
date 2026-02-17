-- AlterTable
ALTER TABLE "Contact" ADD COLUMN "accessToken" TEXT;
ALTER TABLE "Contact" ADD COLUMN "refreshToken" TEXT;
ALTER TABLE "Contact" ADD COLUMN "tokenExpiry" DATETIME;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "accessToken" TEXT;
ALTER TABLE "User" ADD COLUMN "refreshToken" TEXT;
ALTER TABLE "User" ADD COLUMN "tokenExpiry" DATETIME;
