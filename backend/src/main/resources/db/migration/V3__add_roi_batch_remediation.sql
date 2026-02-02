-- V3: Add Register of Information, Bulk Analysis, and Remediation Tracking tables

-- ============================================
-- Register of Information (RoI)
-- ============================================
CREATE TABLE IF NOT EXISTS ict_service_arrangements (
    id                      VARCHAR(255) PRIMARY KEY,
    user_id                 VARCHAR(255) NOT NULL,
    provider_name           VARCHAR(500) NOT NULL,
    lei_code                VARCHAR(20),
    provider_country        VARCHAR(100),
    service_description     TEXT NOT NULL,
    service_type            VARCHAR(50) NOT NULL,
    contract_start_date     DATE,
    contract_end_date       DATE,
    is_critical             BOOLEAN NOT NULL DEFAULT FALSE,
    data_location           VARCHAR(50),
    subcontracting_info     TEXT,
    exit_strategy_status    VARCHAR(50),
    last_assessment_date    DATE,
    notes                   TEXT,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ict_arrangements_user_id ON ict_service_arrangements(user_id);
CREATE INDEX IF NOT EXISTS idx_ict_arrangements_critical ON ict_service_arrangements(is_critical);
CREATE INDEX IF NOT EXISTS idx_ict_arrangements_end_date ON ict_service_arrangements(contract_end_date);

-- ============================================
-- Bulk Contract Analysis
-- ============================================
CREATE TABLE IF NOT EXISTS analysis_batches (
    id                  VARCHAR(255) PRIMARY KEY,
    user_id             VARCHAR(255) NOT NULL,
    batch_name          VARCHAR(500) NOT NULL,
    status              VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    total_contracts     INT NOT NULL DEFAULT 0,
    completed_contracts INT NOT NULL DEFAULT 0,
    avg_score           DOUBLE PRECISION,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_batches_user_id ON analysis_batches(user_id);

ALTER TABLE contract_analyses ADD COLUMN IF NOT EXISTS batch_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_contract_analyses_batch_id ON contract_analyses(batch_id);

-- ============================================
-- Remediation Tracking
-- ============================================
CREATE TABLE IF NOT EXISTS remediation_tasks (
    id                      VARCHAR(255) PRIMARY KEY,
    user_id                 VARCHAR(255) NOT NULL,
    assessment_id           VARCHAR(255),
    contract_analysis_id    VARCHAR(255),
    requirement_id          INT NOT NULL,
    status                  VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    priority                VARCHAR(50) NOT NULL,
    assigned_to             VARCHAR(255),
    due_date                DATE,
    notes                   TEXT,
    resolution_date         DATE,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_remediation_user_id ON remediation_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_remediation_assessment ON remediation_tasks(assessment_id);
CREATE INDEX IF NOT EXISTS idx_remediation_contract ON remediation_tasks(contract_analysis_id);
CREATE INDEX IF NOT EXISTS idx_remediation_status ON remediation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_remediation_due_date ON remediation_tasks(due_date);
