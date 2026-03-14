-- Migration: Remove hardcoded Pakistan default from clinics table
ALTER TABLE clinics ALTER COLUMN country DROP DEFAULT;

-- Note: Existing records with 'Pakistan' are preserved unchanged.
-- They may be legitimate user-selected values; there is no reliable way to distinguish
-- them from rows populated by the old default without additional audit data.
COMMENT ON COLUMN clinics.country IS 'Country selected by user during registration. No default.';

-- Remove Pakistan-biased defaults from internationalization columns
ALTER TABLE clinics ALTER COLUMN currency_code DROP DEFAULT;
ALTER TABLE clinics ALTER COLUMN timezone DROP DEFAULT;

-- Remove Pakistan-biased currency default from lab_tests table (if column exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'lab_tests' AND column_name = 'currency') THEN
        ALTER TABLE lab_tests ALTER COLUMN currency DROP DEFAULT;
    END IF;
END $$;
