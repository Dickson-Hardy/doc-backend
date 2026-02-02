-- Add splitCode column to registrations table
-- This column stores the Paystack split code used for payment distribution

ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS "splitCode" VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN registrations."splitCode" IS 'Paystack split code used for this payment transaction';
