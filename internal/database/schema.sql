-- Enable UUID extension if supported
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: workers
CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    bio TEXT,
    avatar_url VARCHAR(255),
    rating NUMERIC(3,2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    zone VARCHAR(100) NOT NULL,
    -- Rates fields
    base_price NUMERIC(12,2) DEFAULT 0.00 CHECK (base_price >= 0),
    rate_type VARCHAR(20) DEFAULT 'HOURLY' CHECK (rate_type IN ('HOURLY', 'UNIT')),
    -- Location & Radius fields
    lat NUMERIC(10, 7),
    lng NUMERIC(10, 7),
    max_radius_km NUMERIC(6, 2) NOT NULL DEFAULT 10.00 CHECK (max_radius_km > 0),
    free_radius_km NUMERIC(6, 2) NOT NULL DEFAULT 3.00 CHECK (free_radius_km >= 0),
    extra_fee_per_km INT NOT NULL DEFAULT 0 CHECK (extra_fee_per_km >= 0),
    -- Private / sensitive fields
    phone_number VARCHAR(30) NOT NULL DEFAULT '',
    whatsapp_number VARCHAR(30) DEFAULT '',
    email VARCHAR(150) NOT NULL DEFAULT '',
    address TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workers_slug ON workers(slug);
CREATE INDEX IF NOT EXISTS idx_workers_is_active ON workers(is_active);

-- Table: services
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    base_price NUMERIC(12,2) DEFAULT 0.00 CHECK (base_price >= 0),
    rate_type VARCHAR(20) DEFAULT 'HOURLY' CHECK (rate_type IN ('HOURLY', 'UNIT')),
    duration_minutes INT NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_worker_id ON services(worker_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

-- View: worker_services
CREATE OR REPLACE VIEW worker_services AS
    SELECT id, worker_id, name, description, price, base_price, rate_type, duration_minutes, is_active, created_at, updated_at
    FROM services;

-- Table: worker_schedules
CREATE TABLE IF NOT EXISTS worker_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    slot_morning BOOLEAN NOT NULL DEFAULT TRUE,
    slot_afternoon BOOLEAN NOT NULL DEFAULT TRUE,
    slot_evening BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(worker_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_worker_schedules_worker_id ON worker_schedules(worker_id);

-- Table: bookings
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code VARCHAR(50) UNIQUE NOT NULL,
    worker_id UUID NOT NULL REFERENCES workers(id),
    service_id UUID NOT NULL REFERENCES services(id),
    client_name VARCHAR(150) NOT NULL,
    client_phone VARCHAR(30) DEFAULT '',
    client_email VARCHAR(150) DEFAULT '',
    location TEXT NOT NULL,
    zone VARCHAR(100) NOT NULL,
    booking_date TIMESTAMPTZ NOT NULL,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    notes TEXT DEFAULT '',
    total_price NUMERIC(12,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING_WA',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_code ON bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_bookings_worker_id ON bookings(worker_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_start_end_time ON bookings(worker_id, start_time, end_time);
