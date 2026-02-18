-- Add new columns to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS mrn VARCHAR(50) UNIQUE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS referring_doctor_name VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS referring_doctor_hospital VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS referring_doctor_phone VARCHAR(20);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS consultation_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS total_paid DECIMAL(10,2) DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS outstanding_balance DECIMAL(10,2) DEFAULT 0;

-- Medical History table
CREATE TABLE IF NOT EXISTS medical_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    -- Chief Complaint
    chief_complaint TEXT,
    duration_of_infertility VARCHAR(50),
    
    -- Present Illness
    present_illness TEXT,
    menstrual_history TEXT,
    obstetric_history TEXT, -- G_P_A_ format
    
    -- Past Medical History
    medical_conditions TEXT[], -- Array of conditions
    surgeries TEXT[], -- Past surgeries
    allergies TEXT[], -- Known allergies
    family_history TEXT,
    
    -- Gynecological History
    last_menstrual_period DATE,
    cycle_length_days INTEGER,
    cycle_regularity VARCHAR(50),
    
    -- Previous Fertility Treatments
    previous_treatments JSONB, -- [{treatment: "IUI", date: "2024-01", outcome: "negative"}]
    
    -- Lifestyle
    smoking BOOLEAN DEFAULT false,
    alcohol BOOLEAN DEFAULT false,
    exercise VARCHAR(100),
    
    recorded_by UUID REFERENCES users(id),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient Documents/Files
CREATE TABLE IF NOT EXISTS patient_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    document_type VARCHAR(100), -- report, prescription, scan, consent_form, etc.
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size_kb INTEGER,
    uploaded_date DATE NOT NULL,
    description TEXT,
    
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Receipts/Payments
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    receipt_date DATE NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50), -- cash, card, bank_transfer
    
    -- What this payment is for
    service_type VARCHAR(100), -- consultation, ivf_cycle, medication, etc.
    service_description TEXT,
    
    -- Reference
    cycle_id UUID REFERENCES ivf_cycles(id),
    
    issued_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pharmacy/Medications
CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    medication_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    brand_name VARCHAR(255),
    category VARCHAR(100), -- fertility, antibiotic, hormone, etc.
    dosage_form VARCHAR(50), -- tablet, injection, capsule
    strength VARCHAR(50),
    
    unit_price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient Medications (Current & History)
CREATE TABLE IF NOT EXISTS patient_medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    medication_id UUID REFERENCES medications(id),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    -- If medication not in our system
    medication_name VARCHAR(255), -- For external medications
    
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    route VARCHAR(50), -- oral, injection, topical
    
    start_date DATE,
    end_date DATE,
    
    is_current BOOLEAN DEFAULT true, -- Currently taking
    is_previous BOOLEAN DEFAULT false, -- Previous medication
    
    prescribed_by UUID REFERENCES users(id),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    prescription_date DATE NOT NULL,
    diagnosis TEXT,
    
    medications JSONB, -- [{medication: "Gonal-F", dosage: "150 IU", frequency: "Daily"}]
    
    instructions TEXT,
    follow_up_date DATE,
    
    prescribed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_medical_history_patient ON medical_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_patient ON patient_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_receipts_patient ON receipts(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_meds_patient ON patient_medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);

-- Triggers
CREATE TRIGGER update_medical_history_updated_at BEFORE UPDATE ON medical_history 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
