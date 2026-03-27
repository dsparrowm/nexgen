CREATE TYPE "AssetSymbol" AS ENUM ('BTC', 'ETH', 'USDT', 'BNB');
CREATE TYPE "AssetPositionStatus" AS ENUM ('ACTIVE', 'CLOSED');

CREATE TABLE "asset_positions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" "AssetSymbol" NOT NULL,
    "status" "AssetPositionStatus" NOT NULL DEFAULT 'ACTIVE',
    "amountInvested" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "unitsHeld" DECIMAL(24,8) NOT NULL DEFAULT 0.00000000,
    "averageEntryPrice" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "currentPrice" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "currentValue" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "profitLoss" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "lastValuationAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_positions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "asset_positions_userId_symbol_key" ON "asset_positions"("userId", "symbol");

ALTER TABLE "asset_positions"
ADD CONSTRAINT "asset_positions_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "transactions"
ADD COLUMN "assetPositionId" TEXT;

ALTER TABLE "transactions"
ADD CONSTRAINT "transactions_assetPositionId_fkey"
FOREIGN KEY ("assetPositionId") REFERENCES "asset_positions"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "transactions_assetPositionId_idx" ON "transactions"("assetPositionId");
