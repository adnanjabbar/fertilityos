-- ============================================
-- FertilityOS - Internationalization Schema
-- Global Multi-tenant SaaS Configuration
-- ============================================

-- Countries & Regional Configuration
CREATE TABLE IF NOT EXISTS countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code VARCHAR(3) NOT NULL UNIQUE,  -- ISO 3166-1 alpha-3
    country_code_2 VARCHAR(2) NOT NULL UNIQUE, -- ISO 3166-1 alpha-2
    country_name VARCHAR(100) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,         -- ISO 4217
    currency_symbol VARCHAR(10) NOT NULL,
    currency_name VARCHAR(50) NOT NULL,
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    time_format VARCHAR(10) DEFAULT '24h',     -- 12h or 24h
    phone_code VARCHAR(10) NOT NULL,
    phone_format VARCHAR(50),                  -- e.g., "+92-XXX-XXXXXXX"
    default_language VARCHAR(10) DEFAULT 'en',
    
    -- Regulatory Info
    regulatory_body VARCHAR(100),              -- e.g., "PHC", "HFEA", "FDA"
    license_required BOOLEAN DEFAULT TRUE,
    license_field_name VARCHAR(100),           -- e.g., "PHC Registration", "HFEA License"
    
    -- Donation Laws
    sperm_donation_allowed BOOLEAN DEFAULT TRUE,
    egg_donation_allowed BOOLEAN DEFAULT TRUE,
    embryo_donation_allowed BOOLEAN DEFAULT TRUE,
    surrogacy_allowed BOOLEAN DEFAULT FALSE,
    anonymous_donation_allowed BOOLEAN DEFAULT FALSE,
    donor_compensation_allowed BOOLEAN DEFAULT TRUE,
    
    -- Data Requirements
    requires_consent_forms BOOLEAN DEFAULT TRUE,
    data_retention_years INTEGER DEFAULT 10,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ID Document Types per Country
CREATE TABLE IF NOT EXISTS country_id_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
    
    document_name VARCHAR(100) NOT NULL,        -- e.g., "CNIC", "Aadhaar", "Passport"
    document_code VARCHAR(20) NOT NULL,         -- e.g., "CNIC", "AADHAAR", "PASSPORT"
    format_regex VARCHAR(255),                  -- Validation regex
    format_example VARCHAR(100),                -- e.g., "12345-1234567-1"
    format_mask VARCHAR(100),                   -- Input mask
    is_primary BOOLEAN DEFAULT FALSE,           -- Main ID for the country
    is_required BOOLEAN DEFAULT FALSE,
    
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Regional Form Fields Configuration
CREATE TABLE IF NOT EXISTS country_form_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
    
    form_name VARCHAR(50) NOT NULL,             -- e.g., "patient_registration", "clinic_setup"
    field_name VARCHAR(50) NOT NULL,
    field_label VARCHAR(100) NOT NULL,
    field_type VARCHAR(30) NOT NULL,            -- text, number, select, date, etc.
    field_options TEXT,                         -- JSON for select options
    validation_rules TEXT,                      -- JSON validation rules
    
    is_required BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update Clinics table to support internationalization
ALTER TABLE clinics 
ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries(id),
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS logo_base64 TEXT,
ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) DEFAULT 'PKR',
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Karachi',
ADD COLUMN IF NOT EXISTS date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS regulatory_license VARCHAR(100),
ADD COLUMN IF NOT EXISTS regulatory_expiry DATE,
ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS primary_contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS primary_contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS primary_contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_address TEXT,
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_account VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_iban VARCHAR(50);

-- KYC/AML Verification (Didit.me Integration)
CREATE TABLE IF NOT EXISTS patient_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Verification Provider
    provider VARCHAR(50) DEFAULT 'didit',       -- didit, manual, other
    provider_reference_id VARCHAR(255),         -- External reference
    
    -- Verification Status
    status VARCHAR(30) DEFAULT 'pending',       -- pending, in_progress, verified, failed, expired
    verification_type VARCHAR(50),              -- identity, document, biometric, address
    
    -- Verification Details
    document_type VARCHAR(50),                  -- passport, national_id, drivers_license
    document_number VARCHAR(100),
    document_country VARCHAR(3),
    document_expiry DATE,
    
    -- Results
    verified_at TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    verification_score DECIMAL(5,2),            -- Confidence score 0-100
    verification_data JSONB,                    -- Full response from provider
    
    -- Risk Assessment
    risk_level VARCHAR(20),                     -- low, medium, high
    risk_flags TEXT[],                          -- Array of risk indicators
    
    -- Audit
    ip_address VARCHAR(50),
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consent Templates per Country
CREATE TABLE IF NOT EXISTS consent_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,  -- NULL for default templates
    
    consent_type VARCHAR(50) NOT NULL,          -- ivf_treatment, egg_donation, sperm_freezing, etc.
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    
    version VARCHAR(20) DEFAULT '1.0',
    language VARCHAR(10) DEFAULT 'en',
    
    is_mandatory BOOLEAN DEFAULT TRUE,
    requires_witness BOOLEAN DEFAULT FALSE,
    requires_partner_signature BOOLEAN DEFAULT FALSE,
    valid_days INTEGER,                         -- How long consent is valid
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient Consents (Signed)
CREATE TABLE IF NOT EXISTS patient_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    template_id UUID REFERENCES consent_templates(id),
    cycle_id UUID REFERENCES ivf_cycles(id),
    
    consent_type VARCHAR(50) NOT NULL,
    
    -- Signatures
    patient_signature TEXT,                     -- Base64 signature image
    patient_signed_at TIMESTAMP,
    patient_ip_address VARCHAR(50),
    
    partner_signature TEXT,
    partner_signed_at TIMESTAMP,
    partner_name VARCHAR(255),
    
    witness_signature TEXT,
    witness_signed_at TIMESTAMP,
    witness_name VARCHAR(255),
    
    -- Document
    pdf_url VARCHAR(500),
    
    -- Status
    status VARCHAR(30) DEFAULT 'pending',       -- pending, signed, expired, revoked
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    revoked_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INSERT DEFAULT COUNTRIES DATA
-- ============================================

INSERT INTO countries (country_code, country_code_2, country_name, currency_code, currency_symbol, currency_name, phone_code, regulatory_body, license_field_name, sperm_donation_allowed, egg_donation_allowed, surrogacy_allowed, anonymous_donation_allowed)
VALUES 
    ('PAK', 'PK', 'Pakistan', 'PKR', '₨', 'Pakistani Rupee', '+92', 'Punjab Healthcare Commission', 'PHC Registration Number', false, false, false, false),
    ('IND', 'IN', 'India', 'INR', '₹', 'Indian Rupee', '+91', 'ICMR', 'ICMR Registration', true, true, false, false),
    ('ARE', 'AE', 'United Arab Emirates', 'AED', 'د.إ', 'UAE Dirham', '+971', 'DHA/HAAD', 'DHA License Number', false, false, false, false),
    ('GBR', 'GB', 'United Kingdom', 'GBP', '£', 'British Pound', '+44', 'HFEA', 'HFEA License Number', true, true, false, false),
    ('USA', 'US', 'United States', 'USD', '$', 'US Dollar', '+1', 'FDA/State', 'State License Number', true, true, true, true),
    ('DEU', 'DE', 'Germany', 'EUR', '€', 'Euro', '+49', 'Ärztekammer', 'Medical License', true, false, false, false),
    ('FRA', 'FR', 'France', 'EUR', '€', 'Euro', '+33', 'Agence de la biomédecine', 'ABM Authorization', true, true, false, false),
    ('AUS', 'AU', 'Australia', 'AUD', '$', 'Australian Dollar', '+61', 'RTAC', 'RTAC Accreditation', true, true, true, false),
    ('CAN', 'CA', 'Canada', 'CAD', '$', 'Canadian Dollar', '+1', 'Health Canada', 'Provincial License', true, true, true, false),
    ('SAU', 'SA', 'Saudi Arabia', 'SAR', '﷼', 'Saudi Riyal', '+966', 'MOH', 'MOH License', false, false, false, false),
    ('TUR', 'TR', 'Turkey', 'TRY', '₺', 'Turkish Lira', '+90', 'Ministry of Health', 'Health License', true, true, false, false),
    ('ESP', 'ES', 'Spain', 'EUR', '€', 'Euro', '+34', 'Ministry of Health', 'Health Authorization', true, true, false, true),
    ('MYS', 'MY', 'Malaysia', 'MYR', 'RM', 'Malaysian Ringgit', '+60', 'MOH', 'CKAPS License', false, false, false, false),
    ('SGP', 'SG', 'Singapore', 'SGD', '$', 'Singapore Dollar', '+65', 'MOH', 'MOH License', true, true, false, false),
    ('ZAF', 'ZA', 'South Africa', 'ZAR', 'R', 'South African Rand', '+27', 'SASREG', 'SASREG Registration', true, true, true, true)
ON CONFLICT (country_code) DO NOTHING;

-- Insert ID Document Types for Pakistan
INSERT INTO country_id_documents (country_id, document_name, document_code, format_regex, format_example, is_primary, is_required)
SELECT id, 'CNIC', 'CNIC', '^[0-9]{5}-[0-9]{7}-[0-9]{1}$', '12345-1234567-1', true, true
FROM countries WHERE country_code = 'PAK'
ON CONFLICT DO NOTHING;

INSERT INTO country_id_documents (country_id, document_name, document_code, format_regex, format_example, is_primary, is_required)
SELECT id, 'Passport', 'PASSPORT', '^[A-Z]{2}[0-9]{7}$', 'AB1234567', false, false
FROM countries WHERE country_code = 'PAK'
ON CONFLICT DO NOTHING;

-- Insert ID Document Types for India
INSERT INTO country_id_documents (country_id, document_name, document_code, format_regex, format_example, is_primary, is_required)
SELECT id, 'Aadhaar Card', 'AADHAAR', '^[0-9]{4}\s[0-9]{4}\s[0-9]{4}$', '1234 5678 9012', true, true
FROM countries WHERE country_code = 'IND'
ON CONFLICT DO NOTHING;

INSERT INTO country_id_documents (country_id, document_name, document_code, format_regex, format_example, is_primary, is_required)
SELECT id, 'PAN Card', 'PAN', '^[A-Z]{5}[0-9]{4}[A-Z]{1}$', 'ABCDE1234F', false, false
FROM countries WHERE country_code = 'IND'
ON CONFLICT DO NOTHING;

-- Insert ID Document Types for UAE
INSERT INTO country_id_documents (country_id, document_name, document_code, format_regex, format_example, is_primary, is_required)
SELECT id, 'Emirates ID', 'EID', '^784-[0-9]{4}-[0-9]{7}-[0-9]{1}$', '784-1234-1234567-1', true, true
FROM countries WHERE country_code = 'ARE'
ON CONFLICT DO NOTHING;

-- Insert ID Document Types for UK
INSERT INTO country_id_documents (country_id, document_name, document_code, format_regex, format_example, is_primary, is_required)
SELECT id, 'NHS Number', 'NHS', '^[0-9]{3}\s[0-9]{3}\s[0-9]{4}$', '123 456 7890', true, false
FROM countries WHERE country_code = 'GBR'
ON CONFLICT DO NOTHING;

INSERT INTO country_id_documents (country_id, document_name, document_code, format_regex, format_example, is_primary, is_required)
SELECT id, 'Passport', 'PASSPORT', '^[0-9]{9}$', '123456789', false, true
FROM countries WHERE country_code = 'GBR'
ON CONFLICT DO NOTHING;

-- Insert ID Document Types for USA
INSERT INTO country_id_documents (country_id, document_name, document_code, format_regex, format_example, is_primary, is_required)
SELECT id, 'Social Security Number', 'SSN', '^[0-9]{3}-[0-9]{2}-[0-9]{4}$', '123-45-6789', false, false
FROM countries WHERE country_code = 'USA'
ON CONFLICT DO NOTHING;

INSERT INTO country_id_documents (country_id, document_name, document_code, format_regex, format_example, is_primary, is_required)
SELECT id, 'Driver License', 'DL', NULL, 'State-specific', true, false
FROM countries WHERE country_code = 'USA'
ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_country_id_docs_country ON country_id_documents(country_id);
CREATE INDEX IF NOT EXISTS idx_patient_verifications_patient ON patient_verifications(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_verifications_status ON patient_verifications(status);
CREATE INDEX IF NOT EXISTS idx_consent_templates_country ON consent_templates(country_id);
CREATE INDEX IF NOT EXISTS idx_patient_consents_patient ON patient_consents(patient_id);

