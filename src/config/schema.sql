-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MULTI-TENANT CLINIC MANAGEMENT
-- ============================================

CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subdomain VARCHAR(50) UNIQUE NOT NULL,
    clinic_name VARCHAR(255) NOT NULL,
    clinic_code VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Pakistan',
    license_number VARCHAR(100),
    regulatory_body_name VARCHAR(200),
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    subscription_status VARCHAR(30) DEFAULT 'active', -- active, expired, cancelled, pending
    subscription_starts_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- USER MANAGEMENT (Multi-role)
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- admin, doctor, embryologist, nurse, lab_tech, receptionist
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(clinic_id, email)
);

-- Government auditor accounts (no clinic_id, special role)
CREATE TABLE government_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    department VARCHAR(100), -- e.g., "Punjab Healthcare Commission"
    designation VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PATIENT MANAGEMENT
-- ============================================

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    patient_code VARCHAR(50) NOT NULL, -- Clinic-specific patient ID
    mrn VARCHAR(50), -- Medical Record Number
    
    -- Personal Information
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    age INTEGER,
    gender VARCHAR(10),
    cnic VARCHAR(20), -- Pakistani ID
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    
    -- Medical Information
    blood_group VARCHAR(5),
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    bmi DECIMAL(4,2),
    
    -- Partner Information
    partner_name VARCHAR(255),
    partner_age INTEGER,
    partner_phone VARCHAR(20),
    
    -- Referral
    referred_by VARCHAR(255),
    referring_doctor VARCHAR(255),
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(clinic_id, patient_code)
);

-- ============================================
-- IVF CYCLE MANAGEMENT
-- ============================================

CREATE TABLE ivf_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    cycle_number INTEGER NOT NULL, -- 1st cycle, 2nd cycle, etc.
    cycle_code VARCHAR(50) NOT NULL UNIQUE,
    
    -- Cycle Type
    cycle_type VARCHAR(50) NOT NULL, -- fresh, frozen, donor_egg, donor_sperm
    protocol VARCHAR(100), -- long, short, antagonist, natural
    
    -- Important Dates
    start_date DATE NOT NULL,
    expected_egg_retrieval DATE,
    actual_egg_retrieval DATE,
    embryo_transfer_date DATE,
    pregnancy_test_date DATE,
    
    -- Cycle Status
    current_stage VARCHAR(50) NOT NULL DEFAULT 'consultation', 
    -- consultation, stimulation, monitoring, egg_retrieval, fertilization, 
    -- embryo_culture, embryo_transfer, waiting, completed, cancelled
    
    cycle_outcome VARCHAR(50), -- positive, negative, cancelled, ongoing
    pregnancy_result BOOLEAN,
    
    -- Clinical Details
    primary_doctor_id UUID REFERENCES users(id),
    embryologist_id UUID REFERENCES users(id),
    
    notes TEXT,
    cancellation_reason TEXT,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- OVARIAN STIMULATION MONITORING
-- ============================================

CREATE TABLE stimulation_monitoring (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cycle_id UUID REFERENCES ivf_cycles(id) ON DELETE CASCADE,
    monitoring_date DATE NOT NULL,
    day_of_stimulation INTEGER,
    
    -- Hormone Levels
    estradiol_pg_ml DECIMAL(10,2),
    lh_miu_ml DECIMAL(10,2),
    progesterone_ng_ml DECIMAL(10,2),
    fsh_miu_ml DECIMAL(10,2),
    
    -- Ultrasound Findings
    endometrial_thickness_mm DECIMAL(4,2),
    right_ovary_follicles JSONB, -- [{size: 12, count: 3}, {size: 14, count: 2}]
    left_ovary_follicles JSONB,
    
    -- Medications Administered
    medications JSONB, -- [{name: "Gonal-F", dose: "150 IU", time: "morning"}]
    
    next_visit_date DATE,
    notes TEXT,
    recorded_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- EGG RETRIEVAL
-- ============================================

CREATE TABLE egg_retrievals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cycle_id UUID REFERENCES ivf_cycles(id) ON DELETE CASCADE,
    retrieval_date TIMESTAMP NOT NULL,
    
    -- Procedure Details
    performed_by UUID REFERENCES users(id),
    anesthesiologist VARCHAR(255),
    procedure_duration_minutes INTEGER,
    
    -- Egg Collection
    right_ovary_eggs INTEGER DEFAULT 0,
    left_ovary_eggs INTEGER DEFAULT 0,
    total_eggs_retrieved INTEGER NOT NULL,
    mature_eggs_mii INTEGER, -- Metaphase II eggs
    immature_eggs_mi INTEGER, -- Metaphase I
    immature_eggs_gv INTEGER, -- Germinal Vesicle
    
    -- Quality Assessment
    egg_quality_grade VARCHAR(10), -- A, B, C
    
    -- Complications
    complications TEXT,
    blood_in_follicular_fluid BOOLEAN DEFAULT false,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SPERM ANALYSIS & PREPARATION
-- ============================================

CREATE TABLE sperm_samples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cycle_id UUID REFERENCES ivf_cycles(id) ON DELETE CASCADE,
    collection_date TIMESTAMP NOT NULL,
    
    -- Sample Source
    source_type VARCHAR(50), -- ejaculate, tesa, pesa, frozen
    partner_name VARCHAR(255),
    
    -- Semen Analysis
    volume_ml DECIMAL(4,2),
    concentration_million_ml DECIMAL(10,2),
    total_count_million DECIMAL(10,2),
    motility_percent DECIMAL(5,2),
    progressive_motility_percent DECIMAL(5,2),
    morphology_percent DECIMAL(5,2),
    
    -- Post-Preparation
    post_prep_concentration DECIMAL(10,2),
    post_prep_motility DECIMAL(5,2),
    post_prep_volume DECIMAL(4,2),
    
    quality_grade VARCHAR(10), -- A, B, C
    
    processed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- FERTILIZATION
-- ============================================

CREATE TABLE fertilizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cycle_id UUID REFERENCES ivf_cycles(id) ON DELETE CASCADE,
    egg_retrieval_id UUID REFERENCES egg_retrievals(id),
    sperm_sample_id UUID REFERENCES sperm_samples(id),
    
    fertilization_date TIMESTAMP NOT NULL,
    fertilization_method VARCHAR(20) NOT NULL, -- IVF, ICSI, mixed
    
    -- Insemination Details
    eggs_inseminated INTEGER NOT NULL,
    icsi_eggs INTEGER DEFAULT 0,
    conventional_ivf_eggs INTEGER DEFAULT 0,
    
    -- Fertilization Check (Day 1)
    check_time TIMESTAMP,
    two_pn_normal INTEGER DEFAULT 0, -- Normal fertilization (2 pronuclei)
    one_pn INTEGER DEFAULT 0, -- Abnormal
    three_pn INTEGER DEFAULT 0, -- Abnormal
    unfertilized INTEGER DEFAULT 0,
    
    fertilization_rate DECIMAL(5,2), -- Percentage
    
    performed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- EMBRYO DEVELOPMENT
-- ============================================

CREATE TABLE embryos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cycle_id UUID REFERENCES ivf_cycles(id) ON DELETE CASCADE,
    fertilization_id UUID REFERENCES fertilizations(id),
    
    embryo_number INTEGER NOT NULL, -- 1, 2, 3, etc.
    
    -- Day 1 (Fertilization Check) - covered in fertilizations table
    
    -- Day 2
    day2_cells INTEGER,
    day2_grade VARCHAR(10),
    day2_fragmentation VARCHAR(10),
    day2_symmetry VARCHAR(20),
    
    -- Day 3
    day3_cells INTEGER,
    day3_grade VARCHAR(10),
    day3_fragmentation VARCHAR(10),
    day3_symmetry VARCHAR(20),
    
    -- Day 4 (Morula)
    day4_stage VARCHAR(50),
    day4_grade VARCHAR(10),
    
    -- Day 5 (Blastocyst)
    day5_stage VARCHAR(50), -- early_blast, blast, expanded_blast, hatching, hatched
    day5_icm_grade VARCHAR(5), -- A, B, C (Inner Cell Mass)
    day5_te_grade VARCHAR(5), -- A, B, C (Trophectoderm)
    day5_expansion VARCHAR(10), -- 1-6
    day5_overall_grade VARCHAR(10), -- e.g., 4AA, 5AB
    
    -- Day 6
    day6_stage VARCHAR(50),
    day6_grade VARCHAR(10),
    
    -- Embryo Fate
    status VARCHAR(50) NOT NULL, -- developing, transferred, frozen, arrested, discarded
    transfer_date TIMESTAMP,
    freeze_date TIMESTAMP,
    discard_date TIMESTAMP,
    discard_reason TEXT,
    
    -- Genetic Testing
    pgt_tested BOOLEAN DEFAULT false,
    pgt_result VARCHAR(50), -- euploid, aneuploid, mosaic, inconclusive
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- EMBRYO TRANSFER
-- ============================================

CREATE TABLE embryo_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cycle_id UUID REFERENCES ivf_cycles(id) ON DELETE CASCADE,
    transfer_date TIMESTAMP NOT NULL,
    
    -- Transfer Details
    transfer_type VARCHAR(20), -- fresh, frozen
    embryo_day VARCHAR(10), -- day3, day5, day6
    number_of_embryos INTEGER NOT NULL,
    embryos_transferred UUID[], -- Array of embryo IDs
    
    -- Endometrial Preparation (for frozen transfers)
    endometrial_thickness_mm DECIMAL(4,2),
    endometrial_pattern VARCHAR(50),
    
    -- Procedure
    performed_by UUID REFERENCES users(id),
    catheter_type VARCHAR(100),
    difficulty_level VARCHAR(20), -- easy, moderate, difficult
    ultrasound_guided BOOLEAN DEFAULT true,
    
    -- Clinical
    blood_on_catheter BOOLEAN DEFAULT false,
    mucus_on_catheter BOOLEAN DEFAULT false,
    trial_transfer_done BOOLEAN,
    
    complications TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CRYOPRESERVATION (Freezing)
-- ============================================

CREATE TABLE cryopreservation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    cycle_id UUID REFERENCES ivf_cycles(id),
    
    specimen_type VARCHAR(50) NOT NULL, -- embryo, egg, sperm
    freeze_date TIMESTAMP NOT NULL,
    
    -- Storage Details
    tank_number VARCHAR(50),
    canister_number VARCHAR(50),
    cane_color VARCHAR(50),
    position_number VARCHAR(50),
    storage_location VARCHAR(255),
    
    -- Specimen Details
    number_of_specimens INTEGER NOT NULL,
    specimen_ids UUID[], -- References to embryos table or other
    embryo_day VARCHAR(10), -- For embryos: day3, day5, day6
    embryo_grades TEXT[], -- Quality grades
    
    -- Status
    status VARCHAR(50) DEFAULT 'stored', -- stored, thawed, discarded
    thaw_date TIMESTAMP,
    discard_date TIMESTAMP,
    discard_reason TEXT,
    
    -- Annual Renewal
    storage_expiry_date DATE,
    consent_form_signed BOOLEAN DEFAULT false,
    
    notes TEXT,
    frozen_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PREGNANCY OUTCOMES
-- ============================================

CREATE TABLE pregnancy_outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cycle_id UUID REFERENCES ivf_cycles(id) ON DELETE CASCADE,
    
    -- Beta HCG Tests
    first_beta_date DATE,
    first_beta_value DECIMAL(10,2),
    second_beta_date DATE,
    second_beta_value DECIMAL(10,2),
    beta_doubling_time_hours DECIMAL(6,2),
    
    -- Clinical Pregnancy
    clinical_pregnancy BOOLEAN,
    ultrasound_date DATE,
    gestational_sacs INTEGER,
    fetal_heartbeats INTEGER,
    
    -- Pregnancy Type
    pregnancy_type VARCHAR(50), -- singleton, twins, triplets, biochemical
    
    -- Outcome
    outcome VARCHAR(50), -- ongoing, live_birth, miscarriage, ectopic, terminated
    outcome_date DATE,
    delivery_date DATE,
    gestational_age_at_delivery INTEGER, -- weeks
    
    -- Birth Details (if applicable)
    birth_weight_grams INTEGER,
    birth_complications TEXT,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- AUDIT LOG (for government oversight)
-- ============================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id),
    user_id UUID, -- Can be users.id or government_users.id
    user_type VARCHAR(50), -- clinic_staff, government_auditor
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    changes JSONB, -- Store before/after values
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES for Performance
-- ============================================

CREATE INDEX idx_patients_clinic ON patients(clinic_id);
CREATE INDEX idx_patients_code ON patients(patient_code);
CREATE INDEX idx_cycles_patient ON ivf_cycles(patient_id);
CREATE INDEX idx_cycles_clinic ON ivf_cycles(clinic_id);
CREATE INDEX idx_cycles_status ON ivf_cycles(current_stage);
CREATE INDEX idx_embryos_cycle ON embryos(cycle_id);
CREATE INDEX idx_embryos_status ON embryos(status);
CREATE INDEX idx_cryo_clinic ON cryopreservation(clinic_id);
CREATE INDEX idx_cryo_patient ON cryopreservation(patient_id);
CREATE INDEX idx_audit_clinic ON audit_logs(clinic_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================
-- TRIGGERS for updated_at timestamps
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cycles_updated_at BEFORE UPDATE ON ivf_cycles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_embryos_updated_at BEFORE UPDATE ON embryos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
