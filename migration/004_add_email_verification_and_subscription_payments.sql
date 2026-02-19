-- Migration: Add email verification and subscription payment tables
-- Date: 2026-02-19
-- Description: Adds email verification fields to users table and creates subscription payment tables

-- Add email verification fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMP;

-- Create index for verification token lookup
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token) WHERE verification_token IS NOT NULL;

-- Create subscription_payments table for Stripe payments
CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    stripe_payment_id VARCHAR(255) UNIQUE,
    stripe_payment_intent_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed, refunded
    payment_method VARCHAR(50), -- card, bank_transfer
    billing_cycle VARCHAR(20), -- monthly, quarterly, yearly
    plan_name VARCHAR(100), -- Starter, Growth, Enterprise
    metadata JSONB,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_payments_clinic ON subscription_payments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_stripe ON subscription_payments(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);

-- Create subscription_invoices table
CREATE TABLE IF NOT EXISTS subscription_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES subscription_payments(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(30) DEFAULT 'issued', -- issued, paid, cancelled
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_at TIMESTAMP,
    paid_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for invoice lookups
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_clinic ON subscription_invoices(clinic_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_number ON subscription_invoices(invoice_number);

-- Create email_verifications table for tracking verification emails
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for email verification lookups
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications(user_id);

-- Add trigger for subscription_payments updated_at
CREATE OR REPLACE FUNCTION update_subscription_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscription_payments_updated_at 
BEFORE UPDATE ON subscription_payments 
FOR EACH ROW EXECUTE FUNCTION update_subscription_payments_updated_at();

-- Add trigger for subscription_invoices updated_at
CREATE TRIGGER update_subscription_invoices_updated_at 
BEFORE UPDATE ON subscription_invoices 
FOR EACH ROW EXECUTE FUNCTION update_subscription_payments_updated_at();

-- Add additional fields to clinics table for subscription management
ALTER TABLE clinics
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS plan_name VARCHAR(100) DEFAULT 'Starter',
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS regulatory_authority VARCHAR(255),
ADD COLUMN IF NOT EXISTS practice_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS years_in_operation INTEGER,
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create index for Stripe customer lookup
CREATE INDEX IF NOT EXISTS idx_clinics_stripe_customer ON clinics(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
