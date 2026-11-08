-- Add review_token and reviewed_at to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS review_token VARCHAR(64) UNIQUE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Table: reviews
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    client_name VARCHAR(150) NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_worker_id ON reviews(worker_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

