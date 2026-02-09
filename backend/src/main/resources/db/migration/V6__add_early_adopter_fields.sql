-- Add early adopter and trial fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS early_adopter BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS early_adopter_number INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_tier VARCHAR(20) NOT NULL DEFAULT 'FREE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_end_date DATE;

-- Create index for early adopter queries
CREATE INDEX IF NOT EXISTS idx_users_early_adopter ON users(early_adopter);
