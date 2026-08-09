-- ZT Lounge Hardening Migration: Cleanup Orphan Bookings
-- Remove bookings with no matching customer record
DELETE FROM bookings b
WHERE NOT EXISTS (
    SELECT 1 FROM customers c WHERE c.id = b.customer_id
);

-- Remove contact messages with no valid email
DELETE FROM contact_messages
WHERE email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';

-- Add duplicate booking guard (same customer + date)
CREATE UNIQUE INDEX idx_bookings_unique_customer_date
ON bookings(customer_id, booking_date)
WHERE status IN ('pending', 'confirmed');