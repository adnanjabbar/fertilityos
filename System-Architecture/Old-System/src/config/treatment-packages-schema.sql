-- Treatment Packages/Pricing
CREATE TABLE IF NOT EXISTS treatment_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    package_name VARCHAR(255) NOT NULL,
    package_code VARCHAR(50),
    category VARCHAR(100), -- ivf, iui, icsi, pgd, surgery, delivery, consultation, etc.
    
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    
    included_services TEXT[], -- Array of what's included
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient Treatments/Procedures
CREATE TABLE IF NOT EXISTS patient_treatments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    cycle_id UUID REFERENCES ivf_cycles(id), -- Optional, if related to a cycle
    
    treatment_type VARCHAR(100) NOT NULL, -- ivf, iui, icsi, pgd, delivery_normal, delivery_lscs, etc.
    treatment_name VARCHAR(255) NOT NULL,
    
    total_cost DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    outstanding DECIMAL(10,2) NOT NULL,
    
    status VARCHAR(50) DEFAULT 'planned', -- planned, ongoing, completed, cancelled
    
    start_date DATE,
    completion_date DATE,
    
    prescribed_by UUID REFERENCES users(id),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices (more detailed than simple receipts)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    invoice_date DATE NOT NULL,
    due_date DATE,
    
    items JSONB, -- [{name: "IVF Cycle", quantity: 1, unit_price: 250000, total: 250000}]
    
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    amount_paid DECIMAL(10,2) DEFAULT 0,
    outstanding DECIMAL(10,2) NOT NULL,
    
    status VARCHAR(50) DEFAULT 'pending', -- pending, partial, paid, overdue
    
    notes TEXT,
    
    issued_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_treatment_packages_clinic ON treatment_packages(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patient_treatments_patient ON patient_treatments(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);

-- Triggers
CREATE TRIGGER update_treatment_packages_updated_at BEFORE UPDATE ON treatment_packages 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_treatments_updated_at BEFORE UPDATE ON patient_treatments 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default treatment packages
INSERT INTO treatment_packages (clinic_id, package_name, package_code, category, base_price, description, included_services) 
SELECT 
    c.id,
    'IVF - Full Cycle',
    'IVF-001',
    'ivf',
    250000,
    'Complete IVF cycle including stimulation, egg retrieval, fertilization, embryo culture and transfer',
    ARRAY['Ovarian stimulation', 'Egg retrieval', 'Sperm preparation', 'Fertilization (ICSI)', 'Embryo culture (5 days)', 'Embryo transfer', 'Pregnancy test']
FROM clinics c
WHERE NOT EXISTS (SELECT 1 FROM treatment_packages WHERE package_code = 'IVF-001');

INSERT INTO treatment_packages (clinic_id, package_name, package_code, category, base_price, description, included_services) 
SELECT 
    c.id,
    'IUI - Intrauterine Insemination',
    'IUI-001',
    'iui',
    35000,
    'IUI procedure with monitoring and sperm preparation',
    ARRAY['Follicular monitoring', 'Trigger injection', 'Sperm preparation', 'IUI procedure']
FROM clinics c
WHERE NOT EXISTS (SELECT 1 FROM treatment_packages WHERE package_code = 'IUI-001');

INSERT INTO treatment_packages (clinic_id, package_name, package_code, category, base_price, description, included_services) 
SELECT 
    c.id,
    'ICSI - Intracytoplasmic Sperm Injection',
    'ICSI-001',
    'icsi',
    280000,
    'IVF with ICSI for male factor infertility',
    ARRAY['Ovarian stimulation', 'Egg retrieval', 'ICSI procedure', 'Embryo culture', 'Embryo transfer', 'Pregnancy test']
FROM clinics c
WHERE NOT EXISTS (SELECT 1 FROM treatment_packages WHERE package_code = 'ICSI-001');

INSERT INTO treatment_packages (clinic_id, package_name, package_code, category, base_price, description, included_services) 
SELECT 
    c.id,
    'PGT - Preimplantation Genetic Testing',
    'PGT-001',
    'pgd',
    150000,
    'Genetic testing of embryos (add-on to IVF)',
    ARRAY['Embryo biopsy', 'Genetic analysis', 'Report']
FROM clinics c
WHERE NOT EXISTS (SELECT 1 FROM treatment_packages WHERE package_code = 'PGT-001');

INSERT INTO treatment_packages (clinic_id, package_name, package_code, category, base_price, description, included_services) 
SELECT 
    c.id,
    'FET - Frozen Embryo Transfer',
    'FET-001',
    'frozen',
    80000,
    'Transfer of frozen embryos',
    ARRAY['Endometrial preparation', 'Embryo thawing', 'Embryo transfer', 'Pregnancy test']
FROM clinics c
WHERE NOT EXISTS (SELECT 1 FROM treatment_packages WHERE package_code = 'FET-001');

INSERT INTO treatment_packages (clinic_id, package_name, package_code, category, base_price, description, included_services) 
SELECT 
    c.id,
    'Normal Delivery',
    'DEL-NVD',
    'delivery',
    80000,
    'Normal vaginal delivery package',
    ARRAY['Labour room charges', 'Delivery', 'Post-delivery care (24hrs)', 'Medications']
FROM clinics c
WHERE NOT EXISTS (SELECT 1 FROM treatment_packages WHERE package_code = 'DEL-NVD');

INSERT INTO treatment_packages (clinic_id, package_name, package_code, category, base_price, description, included_services) 
SELECT 
    c.id,
    'LSCS - C-Section Delivery',
    'DEL-LSCS',
    'delivery',
    150000,
    'Lower Segment Cesarean Section delivery',
    ARRAY['Surgery charges', 'Anesthesia', 'OT charges', 'Post-operative care (48hrs)', 'Medications']
FROM clinics c
WHERE NOT EXISTS (SELECT 1 FROM treatment_packages WHERE package_code = 'DEL-LSCS');

INSERT INTO treatment_packages (clinic_id, package_name, package_code, category, base_price, description, included_services) 
SELECT 
    c.id,
    'Embryo Freezing',
    'CRYO-001',
    'cryopreservation',
    25000,
    'Embryo cryopreservation and storage (1 year)',
    ARRAY['Embryo freezing', 'Storage for 1 year']
FROM clinics c
WHERE NOT EXISTS (SELECT 1 FROM treatment_packages WHERE package_code = 'CRYO-001');

INSERT INTO treatment_packages (clinic_id, package_name, package_code, category, base_price, description, included_services) 
SELECT 
    c.id,
    'Initial Consultation',
    'CONS-001',
    'consultation',
    5000,
    'First consultation with fertility specialist',
    ARRAY['Medical history', 'Physical examination', 'Treatment plan discussion']
FROM clinics c
WHERE NOT EXISTS (SELECT 1 FROM treatment_packages WHERE package_code = 'CONS-001');
