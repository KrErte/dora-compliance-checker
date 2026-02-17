-- Pre-populated company profiles for FI-licensed financial entities
-- These profiles are crawled from public sources (FI register, Business Registry)
-- and shown to users when they log in for "wow-effect"

-- Main company profiles table
CREATE TABLE IF NOT EXISTS company_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    registry_code VARCHAR(20) UNIQUE,
    legal_address CLOB,
    emtak_code VARCHAR(10),
    emtak_description VARCHAR(500),
    employee_count INTEGER,
    revenue_eur DECIMAL(15,2),
    website_domain VARCHAR(255),

    -- FI (Finantsinspektsioon) license data
    fi_license_type VARCHAR(100),
    fi_license_date DATE,
    fi_license_status VARCHAR(50) DEFAULT 'active',
    dora_tier INTEGER,

    -- Digital footprint security scores
    ssl_valid_days INTEGER,
    ssl_issuer VARCHAR(255),
    tls_version VARCHAR(20),
    security_headers_score INTEGER,
    security_headers_details CLOB,
    spf_record_exists BOOLEAN,
    dmarc_record_exists BOOLEAN,
    dnssec_enabled BOOLEAN,
    https_redirect BOOLEAN,
    digital_risk_score INTEGER,

    -- Additional structured data
    board_members CLOB,
    group_structure CLOB,
    tech_stack CLOB,

    -- Meta
    last_crawled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crawl operation log for tracking and debugging
CREATE TABLE IF NOT EXISTS crawl_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_profile_id BIGINT,
    source VARCHAR(50),
    status VARCHAR(20),
    details CLOB,
    crawled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_crawl_log_company FOREIGN KEY (company_profile_id) REFERENCES company_profiles(id) ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_company_profiles_registry_code ON company_profiles(registry_code);
CREATE INDEX IF NOT EXISTS idx_company_profiles_fi_license ON company_profiles(fi_license_type);
CREATE INDEX IF NOT EXISTS idx_company_profiles_dora_tier ON company_profiles(dora_tier);
CREATE INDEX IF NOT EXISTS idx_company_profiles_name ON company_profiles(name);
CREATE INDEX IF NOT EXISTS idx_crawl_log_company ON crawl_log(company_profile_id);
CREATE INDEX IF NOT EXISTS idx_crawl_log_source ON crawl_log(source);
CREATE INDEX IF NOT EXISTS idx_crawl_log_status ON crawl_log(status);

-- Column documentation:
-- fi_license_type: krediidiasutus, makseasutus, kindlustusselts, investeerimisühing, fondivalitseja, e-raha asutus
-- fi_license_status: active, suspended, revoked
-- dora_tier: 1=Credit institutions, 2=Payment/E-money/Investment, 3=Insurance/Fund managers, 4=ICT providers (indirect)
-- security_headers_score: 0-7 count of security headers present (HSTS, CSP, X-Content-Type-Options, etc.)
-- digital_risk_score: 0-100 composite score based on SSL, headers, DNS security
-- board_members: JSON array [{"name": "...", "role": "juhatuse liige", "id_code": "..."}]
-- group_structure: JSON object with parent/subsidiary information
-- tech_stack: JSON object with detected technologies
