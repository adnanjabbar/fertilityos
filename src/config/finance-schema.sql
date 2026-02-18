-- ============================================
-- IVF Platform - Financial ERP & Asset Management
-- Comprehensive Finance, Assets, Contracts Schema
-- ============================================

-- ==================== CHART OF ACCOUNTS ====================
CREATE TABLE IF NOT EXISTS account_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    category_name VARCHAR(100) NOT NULL,
    category_type VARCHAR(30) NOT NULL, -- revenue, expense, asset, liability, equity
    parent_category_id UUID REFERENCES account_categories(id),
    
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== REVENUE TRACKING ====================
CREATE TABLE IF NOT EXISTS revenue_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Source
    source_type VARCHAR(30) NOT NULL, -- patient_payment, lab_order, procedure, consultation, other
    source_id UUID, -- Reference to patient payment, lab order, etc.
    patient_id UUID REFERENCES patients(id),
    
    -- Details
    description TEXT,
    category VARCHAR(50),
    
    -- Amounts
    gross_amount DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2) NOT NULL,
    
    -- Payment
    payment_method VARCHAR(30), -- cash, card, bank_transfer, insurance, other
    payment_reference VARCHAR(100),
    payment_status VARCHAR(20) DEFAULT 'received', -- pending, received, refunded
    
    received_by UUID REFERENCES users(id),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== EXPENSE MANAGEMENT ====================
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    category_name VARCHAR(100) NOT NULL,
    category_code VARCHAR(20),
    parent_category_id UUID REFERENCES expense_categories(id),
    
    is_recurring BOOLEAN DEFAULT FALSE,
    budget_monthly DECIMAL(12,2),
    
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    expense_number VARCHAR(50) UNIQUE NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    category_id UUID REFERENCES expense_categories(id),
    
    -- Vendor/Payee
    vendor_id UUID,
    vendor_name VARCHAR(255),
    
    -- Details
    description TEXT NOT NULL,
    
    -- Amounts
    amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    
    -- Payment
    payment_method VARCHAR(30),
    payment_reference VARCHAR(100),
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, cancelled
    payment_date DATE,
    
    -- Recurrence
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency VARCHAR(20), -- daily, weekly, monthly, quarterly, yearly
    recurring_end_date DATE,
    
    -- Attachments
    receipt_url VARCHAR(500),
    
    approved_by UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== VENDOR/SUPPLIER MANAGEMENT ====================
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    vendor_code VARCHAR(20),
    vendor_name VARCHAR(255) NOT NULL,
    vendor_type VARCHAR(50), -- supplier, contractor, service_provider, utility
    
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    
    tax_id VARCHAR(100),
    bank_name VARCHAR(100),
    bank_account VARCHAR(100),
    bank_iban VARCHAR(50),
    
    payment_terms VARCHAR(50), -- immediate, net_15, net_30, net_60
    credit_limit DECIMAL(12,2),
    
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== ASSET MANAGEMENT ====================
CREATE TABLE IF NOT EXISTS asset_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    category_name VARCHAR(100) NOT NULL,
    category_code VARCHAR(20),
    category_type VARCHAR(30) NOT NULL, -- clinical, non_clinical, it, furniture, vehicle, other
    
    depreciation_method VARCHAR(30) DEFAULT 'straight_line', -- straight_line, declining_balance, none
    useful_life_years INTEGER,
    salvage_value_percent DECIMAL(5,2) DEFAULT 10,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    category_id UUID REFERENCES asset_categories(id),
    
    -- Identification
    asset_code VARCHAR(50) UNIQUE NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    qr_code VARCHAR(255),
    serial_number VARCHAR(100),
    model_number VARCHAR(100),
    
    -- Classification
    asset_type VARCHAR(30) NOT NULL, -- fixed, non_fixed
    is_clinical BOOLEAN DEFAULT FALSE,
    
    -- Description
    description TEXT,
    brand VARCHAR(100),
    manufacturer VARCHAR(255),
    specifications TEXT,
    
    -- Location
    location VARCHAR(255),
    department VARCHAR(100),
    assigned_to UUID REFERENCES users(id),
    
    -- Purchase Info
    purchase_date DATE,
    purchase_price DECIMAL(12,2),
    vendor_id UUID REFERENCES vendors(id),
    invoice_number VARCHAR(100),
    warranty_expiry DATE,
    
    -- Valuation
    current_value DECIMAL(12,2),
    salvage_value DECIMAL(12,2),
    accumulated_depreciation DECIMAL(12,2) DEFAULT 0,
    
    -- Depreciation
    depreciation_method VARCHAR(30),
    useful_life_years INTEGER,
    depreciation_start_date DATE,
    
    -- Status
    status VARCHAR(30) DEFAULT 'active', -- active, in_maintenance, disposed, lost, transferred
    condition VARCHAR(30) DEFAULT 'good', -- excellent, good, fair, poor
    
    -- Disposal
    disposal_date DATE,
    disposal_method VARCHAR(50),
    disposal_value DECIMAL(12,2),
    disposal_notes TEXT,
    
    -- Maintenance
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    maintenance_frequency_days INTEGER,
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asset Maintenance Records
CREATE TABLE IF NOT EXISTS asset_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    
    maintenance_date DATE NOT NULL,
    maintenance_type VARCHAR(50), -- preventive, corrective, calibration, inspection
    
    description TEXT,
    performed_by VARCHAR(255),
    vendor_id UUID REFERENCES vendors(id),
    
    cost DECIMAL(10,2),
    
    next_due_date DATE,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asset Depreciation Log
CREATE TABLE IF NOT EXISTS asset_depreciation_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    
    depreciation_date DATE NOT NULL,
    period_start DATE,
    period_end DATE,
    
    opening_value DECIMAL(12,2),
    depreciation_amount DECIMAL(12,2),
    closing_value DECIMAL(12,2),
    accumulated_depreciation DECIMAL(12,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== CONTRACTS & LICENSES ====================
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    contract_number VARCHAR(50),
    contract_name VARCHAR(255) NOT NULL,
    contract_type VARCHAR(50) NOT NULL, -- license, service, maintenance, lease, vendor, regulatory
    
    -- Parties
    vendor_id UUID REFERENCES vendors(id),
    party_name VARCHAR(255),
    party_contact VARCHAR(255),
    party_email VARCHAR(255),
    party_phone VARCHAR(50),
    
    -- Dates
    start_date DATE NOT NULL,
    end_date DATE,
    renewal_date DATE,
    notice_period_days INTEGER DEFAULT 30,
    
    -- Financial
    contract_value DECIMAL(12,2),
    payment_frequency VARCHAR(30), -- one_time, monthly, quarterly, yearly
    payment_amount DECIMAL(12,2),
    
    -- Status
    status VARCHAR(30) DEFAULT 'active', -- draft, active, expiring_soon, expired, terminated, renewed
    auto_renew BOOLEAN DEFAULT FALSE,
    
    -- Regulatory (for licenses)
    license_number VARCHAR(100),
    issuing_authority VARCHAR(255),
    regulatory_body VARCHAR(100),
    
    -- Documents
    document_url VARCHAR(500),
    
    description TEXT,
    terms_conditions TEXT,
    notes TEXT,
    
    renewal_reminder_sent BOOLEAN DEFAULT FALSE,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contract Renewals History
CREATE TABLE IF NOT EXISTS contract_renewals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    
    renewal_date DATE NOT NULL,
    previous_end_date DATE,
    new_end_date DATE,
    
    previous_value DECIMAL(12,2),
    new_value DECIMAL(12,2),
    
    renewed_by UUID REFERENCES users(id),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== INVENTORY MANAGEMENT ====================
CREATE TABLE IF NOT EXISTS inventory_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    category_name VARCHAR(100) NOT NULL,
    category_code VARCHAR(20),
    parent_category_id UUID REFERENCES inventory_categories(id),
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    category_id UUID REFERENCES inventory_categories(id),
    
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Units
    unit VARCHAR(30), -- piece, box, pack, ml, kg, etc.
    unit_price DECIMAL(10,2),
    
    -- Stock
    current_stock DECIMAL(12,2) DEFAULT 0,
    minimum_stock DECIMAL(12,2) DEFAULT 0,
    reorder_level DECIMAL(12,2),
    reorder_quantity DECIMAL(12,2),
    
    -- Location
    storage_location VARCHAR(100),
    
    -- Vendor
    preferred_vendor_id UUID REFERENCES vendors(id),
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(clinic_id, item_code)
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    
    transaction_type VARCHAR(20) NOT NULL, -- purchase, usage, adjustment, return, disposal
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    quantity DECIMAL(12,2) NOT NULL,
    unit_price DECIMAL(10,2),
    total_amount DECIMAL(12,2),
    
    -- For purchases
    vendor_id UUID REFERENCES vendors(id),
    invoice_number VARCHAR(100),
    
    -- For usage
    used_by UUID REFERENCES users(id),
    patient_id UUID REFERENCES patients(id),
    
    batch_number VARCHAR(100),
    expiry_date DATE,
    
    notes TEXT,
    created_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== PAYROLL (Basic) ====================
CREATE TABLE IF NOT EXISTS employee_salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    employee_name VARCHAR(255),
    designation VARCHAR(100),
    department VARCHAR(100),
    
    basic_salary DECIMAL(12,2),
    allowances DECIMAL(12,2) DEFAULT 0,
    deductions DECIMAL(12,2) DEFAULT 0,
    net_salary DECIMAL(12,2),
    
    payment_frequency VARCHAR(20) DEFAULT 'monthly',
    bank_account VARCHAR(100),
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salary_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    salary_id UUID REFERENCES employee_salaries(id),
    
    payment_month DATE NOT NULL,
    
    basic_salary DECIMAL(12,2),
    allowances DECIMAL(12,2),
    overtime DECIMAL(12,2) DEFAULT 0,
    bonus DECIMAL(12,2) DEFAULT 0,
    deductions DECIMAL(12,2),
    tax DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2),
    
    payment_date DATE,
    payment_method VARCHAR(30),
    payment_reference VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== INSERT DEFAULT DATA ====================

-- Default Expense Categories
INSERT INTO expense_categories (clinic_id, category_name, category_code, is_recurring) VALUES
    (NULL, 'Salaries & Wages', 'SAL', true),
    (NULL, 'Rent & Utilities', 'RENT', true),
    (NULL, 'Medical Supplies', 'MED_SUP', false),
    (NULL, 'Laboratory Supplies', 'LAB_SUP', false),
    (NULL, 'Office Supplies', 'OFF_SUP', false),
    (NULL, 'Equipment Maintenance', 'EQUIP_MAINT', false),
    (NULL, 'Insurance', 'INS', true),
    (NULL, 'Licenses & Permits', 'LIC', false),
    (NULL, 'Marketing & Advertising', 'MKTG', false),
    (NULL, 'Professional Services', 'PROF_SVC', false),
    (NULL, 'Travel & Transportation', 'TRAVEL', false),
    (NULL, 'Waste Management', 'WASTE', true),
    (NULL, 'IT & Software', 'IT', true),
    (NULL, 'Miscellaneous', 'MISC', false)
ON CONFLICT DO NOTHING;

-- Default Asset Categories
INSERT INTO asset_categories (clinic_id, category_name, category_code, category_type, useful_life_years, depreciation_method) VALUES
    (NULL, 'Medical Equipment', 'MED_EQUIP', 'clinical', 10, 'straight_line'),
    (NULL, 'Laboratory Equipment', 'LAB_EQUIP', 'clinical', 8, 'straight_line'),
    (NULL, 'IVF Equipment', 'IVF_EQUIP', 'clinical', 10, 'straight_line'),
    (NULL, 'Ultrasound Machines', 'USG', 'clinical', 8, 'straight_line'),
    (NULL, 'Furniture - Clinical', 'FURN_CLIN', 'clinical', 7, 'straight_line'),
    (NULL, 'Furniture - Office', 'FURN_OFF', 'non_clinical', 10, 'straight_line'),
    (NULL, 'IT Equipment', 'IT_EQUIP', 'it', 5, 'straight_line'),
    (NULL, 'Air Conditioning', 'HVAC', 'non_clinical', 10, 'straight_line'),
    (NULL, 'Vehicles', 'VEHICLE', 'non_clinical', 8, 'declining_balance'),
    (NULL, 'Building Improvements', 'BUILD_IMP', 'non_clinical', 15, 'straight_line'),
    (NULL, 'Sterilization Equipment', 'STERIL', 'clinical', 10, 'straight_line'),
    (NULL, 'Other Equipment', 'OTHER', 'non_clinical', 5, 'straight_line')
ON CONFLICT DO NOTHING;

-- Default Inventory Categories
INSERT INTO inventory_categories (clinic_id, category_name, category_code) VALUES
    (NULL, 'IVF Consumables', 'IVF_CONS'),
    (NULL, 'Laboratory Reagents', 'LAB_REAG'),
    (NULL, 'Medications', 'MEDS'),
    (NULL, 'Syringes & Needles', 'SYR_NEED'),
    (NULL, 'Catheters', 'CATH'),
    (NULL, 'Culture Media', 'CULT_MED'),
    (NULL, 'Cryopreservation Supplies', 'CRYO_SUP'),
    (NULL, 'PPE & Safety', 'PPE'),
    (NULL, 'Cleaning Supplies', 'CLEAN'),
    (NULL, 'Office Supplies', 'OFFICE')
ON CONFLICT DO NOTHING;

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_revenue_clinic_date ON revenue_transactions(clinic_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_expenses_clinic_date ON expenses(clinic_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_assets_clinic ON assets(clinic_id);
CREATE INDEX IF NOT EXISTS idx_assets_barcode ON assets(barcode);
CREATE INDEX IF NOT EXISTS idx_contracts_clinic_status ON contracts(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_contracts_renewal ON contracts(renewal_date);
CREATE INDEX IF NOT EXISTS idx_inventory_items_clinic ON inventory_items(clinic_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock ON inventory_items(clinic_id, current_stock);

