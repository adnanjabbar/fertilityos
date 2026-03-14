-- Migration: Add regulatory_body_name field and remove Pakistan-specific references
-- Date: 2026-02-20
-- Description: Replace phc_registration and regulatory_authority with generic regulatory_body_name

-- Add generic regulatory_body_name column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='clinics' AND column_name='regulatory_body_name') THEN
        ALTER TABLE clinics ADD COLUMN regulatory_body_name VARCHAR(200);
    END IF;
END $$;

-- Migrate existing data: populate regulatory_body_name from phc_registration or regulatory_authority
DO $$
BEGIN
    UPDATE clinics
    SET regulatory_body_name = COALESCE(
        NULLIF(phc_registration, ''),
        NULLIF(regulatory_authority, '')
    )
    WHERE regulatory_body_name IS NULL
      AND (phc_registration IS NOT NULL OR regulatory_authority IS NOT NULL);
END $$;
