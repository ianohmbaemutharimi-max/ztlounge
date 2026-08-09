-- ZT Lounge Hardening Migration: Add Missing Indexes
ALTER TABLE services ADD INDEX idx_category_id (category_id);
ALTER TABLE bookings ADD INDEX idx_booking_date (booking_date);