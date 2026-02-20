-- ============================================
-- FertilityOS - Laboratory Tests & Billing Schema
-- Comprehensive Test Catalog & Order Management
-- ============================================

-- Test Categories
CREATE TABLE IF NOT EXISTS test_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    category_name VARCHAR(100) NOT NULL,
    category_code VARCHAR(20) NOT NULL,
    description TEXT,
    
    applicable_gender VARCHAR(10) DEFAULT 'both', -- male, female, both
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(clinic_id, category_code)
);

-- Sample Types
CREATE TABLE IF NOT EXISTS sample_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    sample_name VARCHAR(50) NOT NULL,        -- Blood, Urine, Semen, Tissue, etc.
    sample_code VARCHAR(20) NOT NULL UNIQUE,
    collection_instructions TEXT,
    storage_instructions TEXT,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Container/Vial Types
CREATE TABLE IF NOT EXISTS container_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    container_name VARCHAR(100) NOT NULL,     -- Red Top, Purple Top (EDTA), etc.
    container_code VARCHAR(20) NOT NULL UNIQUE,
    color VARCHAR(30),
    additive VARCHAR(100),                    -- EDTA, Heparin, None, etc.
    sample_type_id UUID REFERENCES sample_types(id),
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test Definitions (Master Catalog)
CREATE TABLE IF NOT EXISTS test_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    category_id UUID REFERENCES test_categories(id),
    
    test_name VARCHAR(255) NOT NULL,
    test_code VARCHAR(50) NOT NULL,
    short_name VARCHAR(50),
    description TEXT,
    
    -- Sample Requirements
    sample_type_id UUID REFERENCES sample_types(id),
    container_type_id UUID REFERENCES container_types(id),
    sample_volume_ml DECIMAL(5,2),
    sample_volume_unit VARCHAR(20) DEFAULT 'ml',
    number_of_samples INTEGER DEFAULT 1,
    
    -- Collection Requirements
    fasting_required BOOLEAN DEFAULT FALSE,
    fasting_hours INTEGER,
    special_instructions TEXT,
    patient_preparation TEXT,
    
    -- Reference Ranges
    has_numeric_result BOOLEAN DEFAULT TRUE,
    unit VARCHAR(50),
    reference_range_male_min DECIMAL(15,5),
    reference_range_male_max DECIMAL(15,5),
    reference_range_female_min DECIMAL(15,5),
    reference_range_female_max DECIMAL(15,5),
    reference_range_text TEXT,               -- For non-numeric or complex ranges
    critical_low DECIMAL(15,5),
    critical_high DECIMAL(15,5),
    
    -- Pricing
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'PKR',
    cost_price DECIMAL(10,2),                -- Internal cost
    
    -- Timing
    turnaround_time_hours INTEGER,
    turnaround_time_text VARCHAR(50),        -- e.g., "Same day", "24-48 hours"
    
    -- Reporting
    report_template VARCHAR(50),              -- Template name for report
    requires_interpretation BOOLEAN DEFAULT FALSE,
    interpretation_template TEXT,
    
    -- Applicable to
    applicable_gender VARCHAR(10) DEFAULT 'both',
    
    -- Status
    is_panel BOOLEAN DEFAULT FALSE,          -- Is this a panel of multiple tests?
    panel_tests UUID[],                       -- If panel, list of test IDs included
    
    is_outsourced BOOLEAN DEFAULT FALSE,
    outsource_lab VARCHAR(255),
    
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(clinic_id, test_code)
);

-- Lab Orders (Test Requests)
CREATE TABLE IF NOT EXISTS lab_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    cycle_id UUID REFERENCES ivf_cycles(id),
    
    order_number VARCHAR(50) UNIQUE NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    order_time TIME DEFAULT CURRENT_TIME,
    
    -- Clinical Info
    clinical_notes TEXT,
    diagnosis TEXT,
    lmp_date DATE,                           -- Last menstrual period (for females)
    cycle_day INTEGER,
    
    -- Priority
    priority VARCHAR(20) DEFAULT 'routine',  -- stat, urgent, routine
    
    -- Status
    status VARCHAR(30) DEFAULT 'ordered',    -- ordered, collected, processing, completed, cancelled
    
    -- Collection
    collection_date DATE,
    collection_time TIME,
    collected_by UUID REFERENCES users(id),
    collection_site VARCHAR(100),            -- Lab, Home, Clinic
    
    -- Ordering
    ordered_by UUID REFERENCES users(id),
    ordering_physician VARCHAR(255),
    
    -- Billing
    total_amount DECIMAL(10,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) DEFAULT 0,
    payment_status VARCHAR(30) DEFAULT 'pending', -- pending, partial, paid, refunded
    invoice_id UUID,
    
    -- Completion
    completed_at TIMESTAMP,
    reported_by UUID REFERENCES users(id),
    verified_by UUID REFERENCES users(id),
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lab Order Items (Individual Tests in an Order)
CREATE TABLE IF NOT EXISTS lab_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    order_id UUID REFERENCES lab_orders(id) ON DELETE CASCADE,
    test_id UUID REFERENCES test_definitions(id),
    
    -- Test Info (copied from definition for historical record)
    test_code VARCHAR(50) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    
    -- Sample
    sample_number VARCHAR(50),
    sample_collected BOOLEAN DEFAULT FALSE,
    sample_collection_time TIMESTAMP,
    sample_condition VARCHAR(50),            -- Acceptable, Hemolyzed, Lipemic, etc.
    sample_rejected BOOLEAN DEFAULT FALSE,
    rejection_reason TEXT,
    
    -- Result
    status VARCHAR(30) DEFAULT 'pending',    -- pending, processing, completed, cancelled
    result_value VARCHAR(255),
    result_numeric DECIMAL(15,5),
    result_unit VARCHAR(50),
    result_flag VARCHAR(20),                 -- normal, low, high, critical_low, critical_high
    result_text TEXT,                        -- For text-based results
    
    -- Reference Range (at time of test)
    reference_min DECIMAL(15,5),
    reference_max DECIMAL(15,5),
    reference_text VARCHAR(255),
    
    -- Interpretation
    interpretation TEXT,
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Timing
    resulted_at TIMESTAMP,
    resulted_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Sample Types
INSERT INTO sample_types (sample_name, sample_code, collection_instructions) VALUES
    ('Blood', 'BLOOD', 'Venipuncture from antecubital vein'),
    ('Serum', 'SERUM', 'Allow blood to clot, centrifuge to separate serum'),
    ('Plasma', 'PLASMA', 'Collect in anticoagulant tube, centrifuge'),
    ('Urine', 'URINE', 'Clean catch midstream urine'),
    ('Semen', 'SEMEN', 'Collect after 2-5 days abstinence'),
    ('Tissue', 'TISSUE', 'Surgical biopsy specimen'),
    ('Swab', 'SWAB', 'Sterile swab collection'),
    ('Other', 'OTHER', 'As per specific test requirements')
ON CONFLICT (sample_code) DO NOTHING;

-- Insert Default Container Types
INSERT INTO container_types (container_name, container_code, color, additive, sample_type_id) VALUES
    ('Red Top (Plain)', 'RED', 'Red', 'None - Clot activator', (SELECT id FROM sample_types WHERE sample_code = 'BLOOD')),
    ('Purple Top (EDTA)', 'PURPLE', 'Purple/Lavender', 'EDTA', (SELECT id FROM sample_types WHERE sample_code = 'BLOOD')),
    ('Green Top (Heparin)', 'GREEN', 'Green', 'Lithium Heparin', (SELECT id FROM sample_types WHERE sample_code = 'BLOOD')),
    ('Blue Top (Citrate)', 'BLUE', 'Blue', 'Sodium Citrate', (SELECT id FROM sample_types WHERE sample_code = 'BLOOD')),
    ('Yellow Top (ACD)', 'YELLOW', 'Yellow', 'ACD Solution', (SELECT id FROM sample_types WHERE sample_code = 'BLOOD')),
    ('Gray Top (Fluoride)', 'GRAY', 'Gray', 'Sodium Fluoride/Potassium Oxalate', (SELECT id FROM sample_types WHERE sample_code = 'BLOOD')),
    ('SST (Gold)', 'SST', 'Gold/Red-Gray', 'Gel separator + Clot activator', (SELECT id FROM sample_types WHERE sample_code = 'SERUM')),
    ('Urine Container', 'URINE_CUP', 'Clear', 'None', (SELECT id FROM sample_types WHERE sample_code = 'URINE')),
    ('Semen Container', 'SEMEN_CUP', 'Clear', 'Sterile', (SELECT id FROM sample_types WHERE sample_code = 'SEMEN'))
ON CONFLICT (container_code) DO NOTHING;

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_test_definitions_clinic ON test_definitions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_test_definitions_category ON test_definitions(category_id);
CREATE INDEX IF NOT EXISTS idx_test_definitions_code ON test_definitions(test_code);
CREATE INDEX IF NOT EXISTS idx_lab_orders_clinic ON lab_orders(clinic_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_lab_orders_date ON lab_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_lab_order_items_order ON lab_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_lab_order_items_test ON lab_order_items(test_id);

