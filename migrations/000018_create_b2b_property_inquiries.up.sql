-- Migration: Membuat tabel b2b_property_inquiries untuk pengajuan klien bisnis & pengelola properti
CREATE TABLE IF NOT EXISTS b2b_property_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_code VARCHAR(32) UNIQUE NOT NULL,
    business_name VARCHAR(150) NOT NULL,
    property_type VARCHAR(40) NOT NULL CHECK (property_type IN ('KOS', 'KANTOR', 'RUKO_KAFE', 'APARTEMEN', 'LAINNYA')),
    contact_name VARCHAR(120) NOT NULL,
    contact_whatsapp VARCHAR(30) NOT NULL,
    contact_email VARCHAR(150) NOT NULL DEFAULT '',
    city_zone VARCHAR(100) NOT NULL,
    property_address TEXT NOT NULL,
    plan_tier VARCHAR(40) NOT NULL CHECK (plan_tier IN ('RUTIN_PROPERTI', 'MULTI_LOKASI')),
    service_focus VARCHAR(120) NOT NULL,
    unit_count INT NOT NULL CHECK (unit_count > 0 AND unit_count <= 2000),
    visit_frequency VARCHAR(30) NOT NULL CHECK (visit_frequency IN ('MINGGUAN', 'BULANAN', 'DWI_BULANAN', 'TRIBULANAN')),
    preferred_start_date DATE,
    notes TEXT NOT NULL DEFAULT '',
    estimated_monthly_fee NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (estimated_monthly_fee >= 0),
    agreed_monthly_fee NUMERIC(12,2) CHECK (agreed_monthly_fee >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'PROPOSAL_SENT', 'ACTIVE', 'PAUSED', 'REJECTED')),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'WAITING_CONFIRMATION', 'PAID', 'OVERDUE')),
    payment_reference VARCHAR(120) NOT NULL DEFAULT '',
    paid_at TIMESTAMPTZ,
    admin_notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_b2b_inquiries_status ON b2b_property_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_b2b_inquiries_payment_status ON b2b_property_inquiries(payment_status);
CREATE INDEX IF NOT EXISTS idx_b2b_inquiries_created_at ON b2b_property_inquiries(created_at DESC);

