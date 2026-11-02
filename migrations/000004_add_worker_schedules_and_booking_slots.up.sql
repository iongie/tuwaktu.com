-- Migration: Add worker_schedules table and start_time, end_time to bookings table
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

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_bookings_start_end_time ON bookings(worker_id, start_time, end_time);
