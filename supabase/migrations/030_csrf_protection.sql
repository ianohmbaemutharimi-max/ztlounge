-- ZT Lounge Hardening Migration: CSRF Protection for Contact Form
-- Add CSRF token generation and validation logic
CREATE OR REPLACE FUNCTION generate_csrf_token() 
RETURNS TEXT AS $$
DECLARE token TEXT;
BEGIN
    SELECT md5(random()::text) INTO token;
    RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Add CSRF token field to contact_messages table
ALTER TABLE contact_messages ADD COLUMN csrf_token TEXT;

-- Add trigger to auto-generate token on insert
CREATE OR REPLACE TRIGGER set_csrf_token 
BEFORE INSERT ON contact_messages
FOR EACH ROW
EXECUTE FUNCTION generate_csrf_token();