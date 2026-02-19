-- Migration: Add subscription fields to clinics table
-- Date: 2026-02-18
-- Description: Add subscription_status, subscription_starts_at, and subscription_ends_at to clinics table

-- Add subscription_status column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='clinics' AND column_name='subscription_status') THEN
        ALTER TABLE clinics ADD COLUMN subscription_status VARCHAR(30) DEFAULT 'active';
    END IF;
END $$;

-- Add subscription_starts_at column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='clinics' AND column_name='subscription_starts_at') THEN
        ALTER TABLE clinics ADD COLUMN subscription_starts_at TIMESTAMP;
    END IF;
END $$;

-- Add subscription_ends_at column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='clinics' AND column_name='subscription_ends_at') THEN
        ALTER TABLE clinics ADD COLUMN subscription_ends_at TIMESTAMP;
    END IF;
END $$;

-- Update existing clinics to have a subscription_starts_at if null
UPDATE clinics 
SET subscription_starts_at = created_at 
WHERE subscription_starts_at IS NULL;

-- Comment on columns
COMMENT ON COLUMN clinics.subscription_status IS 'Status of the clinic subscription: active, expired, cancelled, pending';
COMMENT ON COLUMN clinics.subscription_starts_at IS 'Start date of the current subscription period';
COMMENT ON COLUMN clinics.subscription_ends_at IS 'End date of the current subscription period';
