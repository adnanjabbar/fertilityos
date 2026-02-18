-- ============================================
-- IVF Platform - Lab Module Database Schema
-- Version 1.0
-- ============================================

-- ============================================
-- SEMEN ANALYSIS & PROCESSING
-- ============================================

CREATE TABLE IF NOT EXISTS semen_samples (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    cycle_id INTEGER REFERENCES ivf_cycles(id) ON DELETE SET NULL,
    
    -- Collection Info
    sample_number VARCHAR(50) UNIQUE NOT NULL,
    collection_date DATE NOT NULL,
    collection_time TIME,
    collection_method VARCHAR(50) DEFAULT 'masturbation', -- masturbation, surgical, home
    abstinence_days INTEGER,
    
    -- Initial Analysis (Pre-Processing)
    volume_ml DECIMAL(5,2),
    ph DECIMAL(3,1),
    liquefaction_time_min INTEGER,
    appearance VARCHAR(50), -- normal, yellow, brown, red
    viscosity VARCHAR(20), -- normal, high, low
    
    -- Concentration & Count
    concentration_million_per_ml DECIMAL(10,2),
    total_sperm_count_million DECIMAL(10,2),
    
    -- Motility (WHO Standards)
    progressive_motility_percent DECIMAL(5,2), -- PR (a+b)
    non_progressive_motility_percent DECIMAL(5,2), -- NP
    immotile_percent DECIMAL(5,2),
    total_motility_percent DECIMAL(5,2), -- PR + NP
    
    -- Morphology
    normal_morphology_percent DECIMAL(5,2), -- Kruger strict criteria
    head_defects_percent DECIMAL(5,2),
    midpiece_defects_percent DECIMAL(5,2),
    tail_defects_percent DECIMAL(5,2),
    
    -- Vitality
    vitality_percent DECIMAL(5,2), -- Live sperm %
    
    -- Other Cells
    round_cells_million_per_ml DECIMAL(10,2),
    wbc_million_per_ml DECIMAL(10,2),
    
    -- Processing
    processing_method VARCHAR(50), -- swim_up, density_gradient, wash, none
    processing_notes TEXT,
    
    -- Post-Processing Results
    post_wash_volume_ml DECIMAL(5,2),
    post_wash_concentration DECIMAL(10,2),
    post_wash_motility_percent DECIMAL(5,2),
    post_wash_total_motile_count DECIMAL(10,2),
    
    -- Quality Assessment
    sample_quality VARCHAR(20), -- excellent, good, fair, poor, azoospermic
    diagnosis VARCHAR(100), -- normozoospermia, oligozoospermia, asthenozoospermia, etc.
    
    -- Usage
    used_for VARCHAR(50), -- ivf, icsi, iui, frozen, discarded
    
    -- Metadata
    analyzed_by INTEGER REFERENCES users(id),
    processed_by INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- OOCYTE (EGG) RETRIEVAL & TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS oocyte_retrievals (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    cycle_id INTEGER REFERENCES ivf_cycles(id) ON DELETE CASCADE,
    
    -- Retrieval Info
    retrieval_number VARCHAR(50) UNIQUE NOT NULL,
    retrieval_date DATE NOT NULL,
    retrieval_time TIME,
    
    -- Counts
    total_follicles_aspirated INTEGER DEFAULT 0,
    total_oocytes_retrieved INTEGER DEFAULT 0,
    
    -- Oocyte Maturity Breakdown
    mii_count INTEGER DEFAULT 0, -- Metaphase II (mature)
    mi_count INTEGER DEFAULT 0,  -- Metaphase I (intermediate)
    gv_count INTEGER DEFAULT 0,  -- Germinal Vesicle (immature)
    degenerated_count INTEGER DEFAULT 0,
    abnormal_count INTEGER DEFAULT 0,
    
    -- Procedure Details
    anesthesia_type VARCHAR(50), -- local, sedation, general
    procedure_duration_min INTEGER,
    complications TEXT,
    
    -- Post-Retrieval
    insemination_method VARCHAR(20), -- ivf, icsi, split
    insemination_time TIME,
    sperm_source VARCHAR(50), -- fresh, frozen, donor
    semen_sample_id INTEGER REFERENCES semen_samples(id),
    
    -- Staff
    retrieved_by INTEGER REFERENCES users(id), -- Doctor
    embryologist_id INTEGER REFERENCES users(id),
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual Oocyte Tracking
CREATE TABLE IF NOT EXISTS oocytes (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
    retrieval_id INTEGER REFERENCES oocyte_retrievals(id) ON DELETE CASCADE,
    
    -- Identification
    oocyte_number VARCHAR(20) NOT NULL, -- e.g., "1", "2", "3" or "A1", "A2"
    dish_position VARCHAR(20), -- Position in culture dish
    
    -- Assessment at Retrieval
    maturity VARCHAR(10) NOT NULL, -- MII, MI, GV, DEG, ABN
    morphology_grade VARCHAR(10), -- A, B, C, D
    
    -- Morphological Features
    zona_thickness VARCHAR(20), -- normal, thick, thin
    polar_body VARCHAR(20), -- normal, fragmented, absent
    cytoplasm VARCHAR(50), -- normal, granular, vacuolated, dark
    perivitelline_space VARCHAR(20), -- normal, enlarged, debris
    shape VARCHAR(20), -- round, oval, irregular
    
    -- Fertilization Check (Day 1)
    fertilization_checked BOOLEAN DEFAULT FALSE,
    fertilization_time TIMESTAMP,
    fertilization_status VARCHAR(20), -- 2PN, 1PN, 3PN, 0PN, DEG
    pronuclei_count INTEGER,
    polar_bodies_count INTEGER,
    
    -- Outcome
    status VARCHAR(20) DEFAULT 'retrieved', -- retrieved, fertilized, failed, degenerated, frozen, transferred, discarded
    embryo_id INTEGER, -- Links to embryo if fertilized
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- EMBRYO CULTURE & GRADING
-- ============================================

-- Main Embryo Records (extends existing embryos table or creates new)
CREATE TABLE IF NOT EXISTS lab_embryos (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    cycle_id INTEGER REFERENCES ivf_cycles(id) ON DELETE CASCADE,
    retrieval_id INTEGER REFERENCES oocyte_retrievals(id),
    oocyte_id INTEGER REFERENCES oocytes(id),
    
    -- Identification
    embryo_number VARCHAR(20) NOT NULL,
    embryo_code VARCHAR(50) UNIQUE NOT NULL, -- Unique lab code
    
    -- Source
    oocyte_source VARCHAR(20) DEFAULT 'self', -- self, donor
    sperm_source VARCHAR(20) DEFAULT 'partner', -- partner, donor
    
    -- Fertilization (Day 0-1)
    fertilization_method VARCHAR(10), -- IVF, ICSI
    fertilization_date DATE,
    fertilization_time TIME,
    
    -- Current Status
    current_day INTEGER DEFAULT 0, -- 0, 1, 2, 3, 4, 5, 6, 7
    current_stage VARCHAR(30), -- zygote, cleavage, morula, blastocyst
    current_grade VARCHAR(20),
    is_arrested BOOLEAN DEFAULT FALSE,
    arrest_day INTEGER,
    
    -- Final Outcome
    outcome VARCHAR(30), -- transferred, frozen, discarded, biopsied, degenerated
    outcome_date DATE,
    
    -- Transfer Info
    transfer_id INTEGER,
    transfer_date DATE,
    
    -- Freeze Info
    freeze_id INTEGER,
    freeze_date DATE,
    
    -- Biopsy (PGT)
    biopsy_performed BOOLEAN DEFAULT FALSE,
    biopsy_date DATE,
    biopsy_result VARCHAR(50), -- euploid, aneuploid, mosaic, no_result
    pgt_report TEXT,
    
    -- Quality Scores
    quality_score INTEGER, -- 1-5 overall score
    transfer_priority INTEGER, -- Ranking for transfer selection
    
    -- Metadata
    created_by INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily Embryo Assessments
CREATE TABLE IF NOT EXISTS embryo_assessments (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
    embryo_id INTEGER REFERENCES lab_embryos(id) ON DELETE CASCADE,
    
    -- Assessment Info
    assessment_day INTEGER NOT NULL, -- 1, 2, 3, 4, 5, 6, 7
    assessment_date DATE NOT NULL,
    assessment_time TIME,
    hours_post_fertilization INTEGER,
    
    -- Cleavage Stage (Day 1-3)
    cell_count INTEGER,
    fragmentation_percent INTEGER, -- 0, <10, 10-25, 25-50, >50
    symmetry VARCHAR(20), -- equal, slightly_unequal, unequal
    multinucleation BOOLEAN DEFAULT FALSE,
    compaction VARCHAR(20), -- none, partial, full (Day 3-4)
    
    -- Cleavage Grade (Day 2-3)
    cleavage_grade VARCHAR(10), -- Grade 1, 2, 3, 4 or A, B, C, D
    
    -- Morula Stage (Day 4)
    morula_grade VARCHAR(10), -- M1, M2, M3
    
    -- Blastocyst Stage (Day 5-7)
    blastocyst_expansion VARCHAR(20), -- 1-6 or early, expanding, expanded, hatching, hatched
    icm_grade VARCHAR(5), -- A, B, C (Inner Cell Mass)
    te_grade VARCHAR(5), -- A, B, C (Trophectoderm)
    blastocyst_grade VARCHAR(10), -- Combined e.g., "4AA", "3BB"
    
    -- Gardner Grading Components
    expansion_score INTEGER, -- 1-6
    icm_score VARCHAR(5), -- A, B, C
    te_score VARCHAR(5), -- A, B, C
    
    -- Morphological Notes
    zona_status VARCHAR(30), -- intact, thinning, breached, hatching
    cytoplasm_quality VARCHAR(30),
    vacuoles BOOLEAN DEFAULT FALSE,
    
    -- Overall Assessment
    development_status VARCHAR(30), -- on_track, slow, fast, arrested
    quality_category VARCHAR(20), -- excellent, good, fair, poor
    suitable_for_transfer BOOLEAN DEFAULT TRUE,
    suitable_for_freeze BOOLEAN DEFAULT TRUE,
    
    -- Staff
    assessed_by INTEGER REFERENCES users(id),
    
    notes TEXT,
    image_path VARCHAR(500), -- Path to embryo image
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CRYOPRESERVATION (FREEZING)
-- ============================================

-- Cryo Storage Locations
CREATE TABLE IF NOT EXISTS cryo_tanks (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
    
    tank_name VARCHAR(50) NOT NULL,
    tank_code VARCHAR(20) UNIQUE NOT NULL,
    tank_type VARCHAR(30), -- liquid_nitrogen, vapor
    location VARCHAR(100), -- Room/area location
    capacity_liters DECIMAL(10,2),
    
    -- Monitoring
    last_nitrogen_fill DATE,
    next_fill_due DATE,
    temperature_celsius DECIMAL(5,2),
    
    status VARCHAR(20) DEFAULT 'active', -- active, maintenance, retired
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cryo_canisters (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
    tank_id INTEGER REFERENCES cryo_tanks(id) ON DELETE CASCADE,
    
    canister_name VARCHAR(50) NOT NULL,
    canister_code VARCHAR(20) NOT NULL,
    position_in_tank VARCHAR(20), -- e.g., "1", "2", "A", "B"
    
    total_canes INTEGER DEFAULT 0,
    used_canes INTEGER DEFAULT 0,
    
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tank_id, canister_code)
);

CREATE TABLE IF NOT EXISTS cryo_canes (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
    canister_id INTEGER REFERENCES cryo_canisters(id) ON DELETE CASCADE,
    
    cane_code VARCHAR(20) NOT NULL,
    cane_color VARCHAR(20), -- Color coding
    position_in_canister VARCHAR(10),
    
    total_goblets INTEGER DEFAULT 0,
    used_goblets INTEGER DEFAULT 0,
    
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(canister_id, cane_code)
);

-- Freeze Records
CREATE TABLE IF NOT EXISTS cryo_preservation (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    cycle_id INTEGER REFERENCES ivf_cycles(id),
    
    -- Freeze Identification
    freeze_code VARCHAR(50) UNIQUE NOT NULL,
    freeze_date DATE NOT NULL,
    freeze_time TIME,
    
    -- What's Being Frozen
    specimen_type VARCHAR(30) NOT NULL, -- embryo, oocyte, sperm, tissue
    
    -- Counts
    total_specimens INTEGER NOT NULL,
    specimens_per_device INTEGER, -- How many per straw/device
    total_devices INTEGER, -- Number of straws/vitrification devices
    
    -- Method
    freeze_method VARCHAR(30), -- vitrification, slow_freeze
    device_type VARCHAR(30), -- cryolock, cryotop, straw, cryoleaf
    media_used VARCHAR(100),
    
    -- Storage Location
    tank_id INTEGER REFERENCES cryo_tanks(id),
    canister_id INTEGER REFERENCES cryo_canisters(id),
    cane_id INTEGER REFERENCES cryo_canes(id),
    goblet_position VARCHAR(20),
    specific_location VARCHAR(100), -- Full location string
    
    -- Quality at Freeze
    quality_at_freeze VARCHAR(50),
    grade_at_freeze VARCHAR(20),
    
    -- For Embryos
    embryo_ids INTEGER[], -- Array of embryo IDs if freezing embryos
    embryo_day INTEGER, -- Day of development when frozen
    embryo_stages TEXT, -- Description of stages
    
    -- For Oocytes
    oocyte_ids INTEGER[],
    maturity_at_freeze VARCHAR(20),
    
    -- For Sperm
    semen_sample_id INTEGER REFERENCES semen_samples(id),
    post_thaw_expected_motility DECIMAL(5,2),
    
    -- Consent & Documentation
    consent_signed BOOLEAN DEFAULT TRUE,
    consent_expiry_date DATE,
    storage_duration_years INTEGER,
    
    -- Staff
    frozen_by INTEGER REFERENCES users(id),
    witnessed_by INTEGER REFERENCES users(id),
    
    -- Status
    status VARCHAR(20) DEFAULT 'stored', -- stored, thawed, transferred, discarded, shipped
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Thaw Records
CREATE TABLE IF NOT EXISTS cryo_thaw (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
    freeze_id INTEGER REFERENCES cryo_preservation(id) ON DELETE CASCADE,
    
    -- Thaw Info
    thaw_code VARCHAR(50) UNIQUE NOT NULL,
    thaw_date DATE NOT NULL,
    thaw_time TIME,
    
    -- What Was Thawed
    specimens_thawed INTEGER NOT NULL,
    devices_thawed INTEGER,
    
    -- Survival
    specimens_survived INTEGER,
    survival_rate_percent DECIMAL(5,2),
    
    -- Quality Post-Thaw
    quality_post_thaw VARCHAR(50),
    grade_post_thaw VARCHAR(20),
    
    -- For Sperm
    post_thaw_motility DECIMAL(5,2),
    post_thaw_concentration DECIMAL(10,2),
    
    -- For Embryos
    expansion_post_thaw VARCHAR(30), -- For blastocysts
    re_expansion_time_hours DECIMAL(5,2),
    
    -- Usage
    used_for VARCHAR(30), -- transfer, culture, discard
    transfer_id INTEGER,
    
    -- Staff
    thawed_by INTEGER REFERENCES users(id),
    witnessed_by INTEGER REFERENCES users(id),
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- WITNESS & VERIFICATION LOG
-- ============================================

CREATE TABLE IF NOT EXISTS lab_witness_log (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
    
    -- What was witnessed
    procedure_type VARCHAR(50) NOT NULL, -- sample_receipt, insemination, freeze, thaw, transfer, discard
    procedure_date TIMESTAMP NOT NULL,
    
    -- Patient/Sample Info
    patient_id INTEGER REFERENCES patients(id),
    patient_name VARCHAR(200),
    sample_ids TEXT, -- JSON array of sample/embryo IDs involved
    
    -- Verification
    primary_operator INTEGER REFERENCES users(id),
    witness INTEGER REFERENCES users(id),
    
    -- Verification Details
    patient_id_verified BOOLEAN DEFAULT TRUE,
    sample_id_verified BOOLEAN DEFAULT TRUE,
    label_verified BOOLEAN DEFAULT TRUE,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- LAB DAILY WORKSHEETS
-- ============================================

CREATE TABLE IF NOT EXISTS lab_worksheets (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
    
    worksheet_date DATE NOT NULL,
    
    -- Daily Tasks Summary (JSON)
    retrievals_scheduled INTEGER DEFAULT 0,
    transfers_scheduled INTEGER DEFAULT 0,
    freezes_scheduled INTEGER DEFAULT 0,
    thaws_scheduled INTEGER DEFAULT 0,
    
    -- Embryos to Check
    day1_checks INTEGER DEFAULT 0,
    day3_checks INTEGER DEFAULT 0,
    day5_checks INTEGER DEFAULT 0,
    day6_checks INTEGER DEFAULT 0,
    
    -- Equipment Checks
    incubator_check BOOLEAN DEFAULT FALSE,
    incubator_temp DECIMAL(4,2),
    incubator_co2 DECIMAL(4,2),
    incubator_o2 DECIMAL(4,2),
    
    nitrogen_tanks_checked BOOLEAN DEFAULT FALSE,
    
    -- Staff
    embryologist_on_duty INTEGER REFERENCES users(id),
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(clinic_id, worksheet_date)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_semen_samples_patient ON semen_samples(patient_id);
CREATE INDEX IF NOT EXISTS idx_semen_samples_cycle ON semen_samples(cycle_id);
CREATE INDEX IF NOT EXISTS idx_semen_samples_date ON semen_samples(collection_date);

CREATE INDEX IF NOT EXISTS idx_oocyte_retrievals_patient ON oocyte_retrievals(patient_id);
CREATE INDEX IF NOT EXISTS idx_oocyte_retrievals_cycle ON oocyte_retrievals(cycle_id);
CREATE INDEX IF NOT EXISTS idx_oocyte_retrievals_date ON oocyte_retrievals(retrieval_date);

CREATE INDEX IF NOT EXISTS idx_oocytes_retrieval ON oocytes(retrieval_id);
CREATE INDEX IF NOT EXISTS idx_oocytes_status ON oocytes(status);

CREATE INDEX IF NOT EXISTS idx_lab_embryos_patient ON lab_embryos(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_embryos_cycle ON lab_embryos(cycle_id);
CREATE INDEX IF NOT EXISTS idx_lab_embryos_status ON lab_embryos(outcome);

CREATE INDEX IF NOT EXISTS idx_embryo_assessments_embryo ON embryo_assessments(embryo_id);
CREATE INDEX IF NOT EXISTS idx_embryo_assessments_day ON embryo_assessments(assessment_day);

CREATE INDEX IF NOT EXISTS idx_cryo_preservation_patient ON cryo_preservation(patient_id);
CREATE INDEX IF NOT EXISTS idx_cryo_preservation_type ON cryo_preservation(specimen_type);
CREATE INDEX IF NOT EXISTS idx_cryo_preservation_status ON cryo_preservation(status);
CREATE INDEX IF NOT EXISTS idx_cryo_preservation_location ON cryo_preservation(tank_id, canister_id, cane_id);

CREATE INDEX IF NOT EXISTS idx_cryo_thaw_freeze ON cryo_thaw(freeze_id);
