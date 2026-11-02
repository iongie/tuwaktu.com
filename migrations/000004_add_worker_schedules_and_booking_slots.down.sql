-- Rollback: Remove worker_schedules table and start_time, end_time from bookings table
DROP INDEX IF EXISTS idx_bookings_start_end_time;
ALTER TABLE bookings DROP COLUMN IF EXISTS start_time;
ALTER TABLE bookings DROP COLUMN IF EXISTS end_time;
DROP TABLE IF EXISTS worker_schedules;
