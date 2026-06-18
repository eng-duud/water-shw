-- Add village column to Customer
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "village" TEXT;

-- Change workUnits from Int to Decimal in Customer table
-- First check if it's still INT and convert
ALTER TABLE "Customer" ALTER COLUMN "workUnits" TYPE DECIMAL(12, 2) USING "workUnits"::DECIMAL(12, 2);
ALTER TABLE "Customer" ALTER COLUMN "workUnits" SET DEFAULT 1;

-- Change workUnits from Int to Decimal in Bill table (if it was Int)
ALTER TABLE "Bill" ALTER COLUMN "workUnits" TYPE DECIMAL(12, 2) USING "workUnits"::DECIMAL(12, 2);
