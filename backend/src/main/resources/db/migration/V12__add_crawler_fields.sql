-- Add fields for ICT Provider Crawler support
-- Tracks source, registration codes, and prevents overwriting user modifications

-- New columns for crawler metadata (H2 compatible syntax)
ALTER TABLE global_ict_providers ADD COLUMN IF NOT EXISTS registration_code VARCHAR(50);
ALTER TABLE global_ict_providers ADD COLUMN IF NOT EXISTS emtak_code VARCHAR(10);
ALTER TABLE global_ict_providers ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'MANUAL';
ALTER TABLE global_ict_providers ADD COLUMN IF NOT EXISTS address CLOB;
ALTER TABLE global_ict_providers ADD COLUMN IF NOT EXISTS is_user_modified BOOLEAN DEFAULT FALSE;
ALTER TABLE global_ict_providers ADD COLUMN IF NOT EXISTS last_crawled_at TIMESTAMP;
ALTER TABLE global_ict_providers ADD COLUMN IF NOT EXISTS raw_data CLOB;

-- Index for registration code lookups (Estonian business registry)
CREATE INDEX IF NOT EXISTS idx_global_providers_regcode ON global_ict_providers(registration_code);

-- Index for source-based queries
CREATE INDEX IF NOT EXISTS idx_global_providers_source ON global_ict_providers(source);

-- Index for EMTAK code filtering
CREATE INDEX IF NOT EXISTS idx_global_providers_emtak ON global_ict_providers(emtak_code);

-- Update existing records to have SEED source (they came from V11 seed data)
UPDATE global_ict_providers SET source = 'SEED' WHERE source IS NULL;

-- Column documentation (as SQL comments since H2 doesn't support COMMENT ON):
-- registration_code: Estonian registry code (registrikood) or equivalent
-- emtak_code: EMTAK business activity code (e.g., 6201, 6202, 6311)
-- source: Data source - ARIREGISTER, EBA_CTPP, SEED, MANUAL, CONTRIBUTED
-- is_user_modified: TRUE if user has customized this record - crawler will not overwrite
-- last_crawled_at: Last time this record was updated by crawler
-- raw_data: Original JSON response from source API for debugging
