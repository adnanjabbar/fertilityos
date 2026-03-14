-- Migration: Add enhanced RBAC and payment features
-- FertilityOS v1.1.0

-- ============================================
-- ADD METADATA COLUMN TO REVENUE_TRANSACTIONS
-- For storing payment-specific metadata (cheque details, bank transfer info)
-- ============================================

ALTER TABLE revenue_transactions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- ============================================
-- UPDATE PAYMENT STATUS ENUM
-- Add 'awaiting_clearance' status for cheque payments
-- ============================================

-- Note: If using an ENUM type, you may need to add the new value:
-- ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'awaiting_clearance';

-- ============================================
-- INDEX FOR PAYMENT QUERIES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_revenue_payment_status 
ON revenue_transactions(payment_status);

CREATE INDEX IF NOT EXISTS idx_revenue_payment_method 
ON revenue_transactions(payment_method);

CREATE INDEX IF NOT EXISTS idx_revenue_patient 
ON revenue_transactions(patient_id);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN revenue_transactions.metadata IS 'JSON metadata for payment details (cheque number, bank info, etc.)';

-- ============================================
-- UPDATE USERS TABLE TO SUPPORT NEW ROLES
-- The role column should accept the expanded role list
-- ============================================

-- If using a CHECK constraint, update it:
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
-- ALTER TABLE users ADD CONSTRAINT users_role_check 
-- CHECK (role IN (
--     'owner', 'admin',
--     'physician', 'physician_assistant', 'ivf_specialist',
--     'clinical_embryologist', 'senior_embryologist',
--     'nurse', 'nurse_coordinator',
--     'lab_technician', 'lab_director', 'pathologist',
--     'radiologist', 'radiology_technician',
--     'receptionist', 'patient_coordinator',
--     'finance_manager', 'billing_specialist',
--     'pharmacist', 'quality_manager', 'fertility_counselor', 'it_admin'
-- ));

-- Note: If the role column is VARCHAR without constraints, no changes needed
