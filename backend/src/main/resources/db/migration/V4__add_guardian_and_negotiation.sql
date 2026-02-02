-- V4: Add Live Contract Guardian and Negotiation Copilot tables

-- ============================================
-- Live Contract Guardian
-- ============================================

-- Stores contract text for continuous re-analysis
CREATE TABLE IF NOT EXISTS monitored_contracts (
    id                   VARCHAR(255) PRIMARY KEY,
    user_id              VARCHAR(255) NOT NULL,
    contract_analysis_id VARCHAR(255),
    company_name         VARCHAR(255) NOT NULL,
    contract_name        VARCHAR(255) NOT NULL,
    file_name            VARCHAR(255) NOT NULL,
    contract_text        TEXT NOT NULL,
    monitoring_status    VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    current_score        DOUBLE PRECISION,
    current_level        VARCHAR(50),
    last_analysis_date   TIMESTAMP,
    last_analysis_id     VARCHAR(255),
    created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monitored_contracts_user_id ON monitored_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_monitored_contracts_status ON monitored_contracts(monitoring_status);

-- Tracks regulatory changes from EUR-Lex, ESA, Finantsinspektsioon
CREATE TABLE IF NOT EXISTS regulatory_updates (
    id                VARCHAR(255) PRIMARY KEY,
    source            VARCHAR(100) NOT NULL,
    title             VARCHAR(1000) NOT NULL,
    summary           TEXT,
    url               VARCHAR(2000),
    published_date    DATE,
    relevance_score   DOUBLE PRECISION,
    affected_articles TEXT,
    status            VARCHAR(50) NOT NULL DEFAULT 'NEW',
    fetched_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regulatory_updates_status ON regulatory_updates(status);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_source ON regulatory_updates(source);

-- Notifications to users about compliance changes
CREATE TABLE IF NOT EXISTS contract_alerts (
    id                     VARCHAR(255) PRIMARY KEY,
    user_id                VARCHAR(255) NOT NULL,
    monitored_contract_id  VARCHAR(255) NOT NULL,
    regulatory_update_id   VARCHAR(255),
    alert_type             VARCHAR(50) NOT NULL,
    title                  VARCHAR(500) NOT NULL,
    message                TEXT NOT NULL,
    severity               VARCHAR(50) NOT NULL,
    is_read                BOOLEAN NOT NULL DEFAULT FALSE,
    previous_score         DOUBLE PRECISION,
    new_score              DOUBLE PRECISION,
    created_at             TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_alerts_user_id ON contract_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_alerts_read ON contract_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_contract_alerts_contract ON contract_alerts(monitored_contract_id);

-- ============================================
-- Negotiation Copilot
-- ============================================

-- One negotiation per contract analysis
CREATE TABLE IF NOT EXISTS negotiations (
    id                     VARCHAR(255) PRIMARY KEY,
    user_id                VARCHAR(255) NOT NULL,
    contract_analysis_id   VARCHAR(255) NOT NULL,
    company_name           VARCHAR(255) NOT NULL,
    contract_name          VARCHAR(255) NOT NULL,
    vendor_type            VARCHAR(100),
    overall_status         VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    strategy_summary       TEXT,
    total_items            INT NOT NULL DEFAULT 0,
    resolved_items         INT NOT NULL DEFAULT 0,
    created_at             TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_negotiations_user_id ON negotiations(user_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_analysis ON negotiations(contract_analysis_id);

-- One item per gap/requirement that needs negotiation
CREATE TABLE IF NOT EXISTS negotiation_items (
    id                VARCHAR(255) PRIMARY KEY,
    negotiation_id    VARCHAR(255) NOT NULL,
    requirement_id    INT NOT NULL,
    article_reference VARCHAR(100),
    requirement_text  TEXT,
    gap_severity      VARCHAR(50) NOT NULL,
    coverage_status   VARCHAR(50) NOT NULL,
    strategy          TEXT,
    suggested_clause  TEXT,
    status            VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    priority          INT NOT NULL DEFAULT 0,
    notes             TEXT,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_negotiation_items_negotiation ON negotiation_items(negotiation_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_items_status ON negotiation_items(status);

-- Email drafts and communication history
CREATE TABLE IF NOT EXISTS negotiation_messages (
    id                    VARCHAR(255) PRIMARY KEY,
    negotiation_item_id   VARCHAR(255),
    negotiation_id        VARCHAR(255) NOT NULL,
    message_type          VARCHAR(50) NOT NULL,
    direction             VARCHAR(50) NOT NULL DEFAULT 'OUTBOUND',
    subject               VARCHAR(500),
    body                  TEXT NOT NULL,
    status                VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    created_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_negotiation_messages_negotiation ON negotiation_messages(negotiation_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_messages_item ON negotiation_messages(negotiation_item_id);
