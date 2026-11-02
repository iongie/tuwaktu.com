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
    -- Private / sensitive fields
    phone_number VARCHAR(30) NOT NULL,
    email VARCHAR(150) NOT NULL,
    address TEXT,
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
    duration_minutes INT NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_worker_id ON services(worker_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

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
    notes TEXT,
    total_price NUMERIC(12,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_code ON bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_bookings_worker_id ON bookings(worker_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
