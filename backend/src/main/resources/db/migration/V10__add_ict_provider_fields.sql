-- V10: Add additional fields to ict_service_arrangements for Supply Chain Nerve Center

ALTER TABLE ict_service_arrangements ADD COLUMN IF NOT EXISTS country_code VARCHAR(5);
ALTER TABLE ict_service_arrangements ADD COLUMN IF NOT EXISTS risk_score INTEGER;
ALTER TABLE ict_service_arrangements ADD COLUMN IF NOT EXISTS criticality VARCHAR(20);
ALTER TABLE ict_service_arrangements ADD COLUMN IF NOT EXISTS contract_number VARCHAR(100);
ALTER TABLE ict_service_arrangements ADD COLUMN IF NOT EXISTS has_exit_strategy BOOLEAN;
ALTER TABLE ict_service_arrangements ADD COLUMN IF NOT EXISTS exit_strategy_description TEXT;

CREATE INDEX IF NOT EXISTS idx_ict_arrangements_risk_score ON ict_service_arrangements(risk_score);
