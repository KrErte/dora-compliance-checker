-- Global ICT Providers Registry
-- Community-driven database of known ICT service providers

CREATE TABLE IF NOT EXISTS global_ict_providers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    country_code VARCHAR(2),
    service_type VARCHAR(100),
    risk_score INTEGER DEFAULT 30,
    is_ctpp BOOLEAN DEFAULT FALSE,
    description TEXT,
    website VARCHAR(255),
    lei_code VARCHAR(20),
    usage_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient searching
CREATE INDEX idx_global_providers_name ON global_ict_providers(LOWER(name));
CREATE INDEX idx_global_providers_usage ON global_ict_providers(usage_count DESC);
CREATE INDEX idx_global_providers_type ON global_ict_providers(service_type);
CREATE INDEX idx_global_providers_country ON global_ict_providers(country_code);
CREATE INDEX idx_global_providers_ctpp ON global_ict_providers(is_ctpp);

-- Seed data: ~50 common ICT providers
-- Cloud Infrastructure
INSERT INTO global_ict_providers (id, name, country, country_code, service_type, risk_score, is_ctpp, description, website, is_verified, usage_count) VALUES
('gp-001', 'Amazon Web Services (AWS)', 'United States', 'US', 'Cloud Hosting', 25, TRUE, 'Leading cloud infrastructure provider offering compute, storage, database, and networking services', 'https://aws.amazon.com', TRUE, 100),
('gp-002', 'Microsoft Azure', 'United States', 'US', 'Cloud Hosting', 25, TRUE, 'Enterprise cloud platform with IaaS, PaaS, and SaaS offerings', 'https://azure.microsoft.com', TRUE, 95),
('gp-003', 'Google Cloud Platform', 'United States', 'US', 'Cloud Hosting', 25, TRUE, 'Cloud computing services including compute, data storage, and machine learning', 'https://cloud.google.com', TRUE, 85),
('gp-004', 'Oracle Cloud', 'United States', 'US', 'Cloud Hosting', 30, TRUE, 'Enterprise cloud infrastructure and platform services', 'https://www.oracle.com/cloud', TRUE, 40),
('gp-005', 'IBM Cloud', 'United States', 'US', 'Cloud Hosting', 30, TRUE, 'Enterprise cloud platform with AI and hybrid cloud capabilities', 'https://www.ibm.com/cloud', TRUE, 35),
('gp-006', 'Hetzner', 'Germany', 'DE', 'Cloud Hosting', 25, FALSE, 'European cloud and dedicated server provider', 'https://www.hetzner.com', TRUE, 60),
('gp-007', 'DigitalOcean', 'United States', 'US', 'Cloud Hosting', 30, FALSE, 'Developer-focused cloud infrastructure', 'https://www.digitalocean.com', TRUE, 45),
('gp-008', 'OVHcloud', 'France', 'FR', 'Cloud Hosting', 28, FALSE, 'European cloud provider with global presence', 'https://www.ovhcloud.com', TRUE, 40),
('gp-009', 'Scaleway', 'France', 'FR', 'Cloud Hosting', 30, FALSE, 'European cloud provider focused on simplicity', 'https://www.scaleway.com', TRUE, 25),
('gp-010', 'Linode (Akamai)', 'United States', 'US', 'Cloud Hosting', 28, FALSE, 'Cloud computing and hosting services', 'https://www.linode.com', TRUE, 30);

-- Security & CDN
INSERT INTO global_ict_providers (id, name, country, country_code, service_type, risk_score, is_ctpp, description, website, is_verified, usage_count) VALUES
('gp-011', 'Cloudflare', 'United States', 'US', 'CDN / WAF', 20, TRUE, 'Web security, CDN, and DNS services', 'https://www.cloudflare.com', TRUE, 90),
('gp-012', 'Akamai', 'United States', 'US', 'CDN / WAF', 22, TRUE, 'Content delivery network and cloud security', 'https://www.akamai.com', TRUE, 50),
('gp-013', 'Fastly', 'United States', 'US', 'CDN / WAF', 25, FALSE, 'Edge cloud platform and CDN', 'https://www.fastly.com', TRUE, 30),
('gp-014', 'Imperva', 'United States', 'US', 'CDN / WAF', 25, FALSE, 'Application and data security', 'https://www.imperva.com', TRUE, 25);

-- SIEM & Monitoring
INSERT INTO global_ict_providers (id, name, country, country_code, service_type, risk_score, is_ctpp, description, website, is_verified, usage_count) VALUES
('gp-015', 'Splunk', 'United States', 'US', 'SIEM / Monitoring', 25, FALSE, 'Data platform for security and observability', 'https://www.splunk.com', TRUE, 55),
('gp-016', 'Datadog', 'United States', 'US', 'SIEM / Monitoring', 25, FALSE, 'Cloud monitoring and security platform', 'https://www.datadoghq.com', TRUE, 50),
('gp-017', 'CrowdStrike', 'United States', 'US', 'SIEM / Monitoring', 22, FALSE, 'Endpoint security and threat intelligence', 'https://www.crowdstrike.com', TRUE, 45),
('gp-018', 'Elastic (ELK)', 'United States', 'US', 'SIEM / Monitoring', 28, FALSE, 'Search, observability, and security platform', 'https://www.elastic.co', TRUE, 40),
('gp-019', 'New Relic', 'United States', 'US', 'SIEM / Monitoring', 28, FALSE, 'Full-stack observability platform', 'https://newrelic.com', TRUE, 35),
('gp-020', 'PagerDuty', 'United States', 'US', 'SIEM / Monitoring', 30, FALSE, 'Incident management and response', 'https://www.pagerduty.com', TRUE, 30);

-- KYC & Identity
INSERT INTO global_ict_providers (id, name, country, country_code, service_type, risk_score, is_ctpp, description, website, is_verified, usage_count) VALUES
('gp-021', 'Onfido', 'United Kingdom', 'GB', 'KYC / Identity', 28, FALSE, 'Identity verification and authentication', 'https://www.onfido.com', TRUE, 45),
('gp-022', 'Veriff', 'Estonia', 'EE', 'KYC / Identity', 25, FALSE, 'AI-powered identity verification', 'https://www.veriff.com', TRUE, 55),
('gp-023', 'iDenfy', 'Lithuania', 'LT', 'KYC / Identity', 30, FALSE, 'Identity verification solution', 'https://www.idenfy.com', TRUE, 25),
('gp-024', 'Jumio', 'United States', 'US', 'KYC / Identity', 28, FALSE, 'AI-driven identity verification', 'https://www.jumio.com', TRUE, 30),
('gp-025', 'Sumsub', 'United Kingdom', 'GB', 'KYC / Identity', 28, FALSE, 'All-in-one verification platform', 'https://sumsub.com', TRUE, 35),
('gp-026', 'Persona', 'United States', 'US', 'KYC / Identity', 30, FALSE, 'Identity infrastructure for businesses', 'https://withpersona.com', TRUE, 20);

-- Identity & Auth
INSERT INTO global_ict_providers (id, name, country, country_code, service_type, risk_score, is_ctpp, description, website, is_verified, usage_count) VALUES
('gp-027', 'Okta', 'United States', 'US', 'Identity & Auth', 22, TRUE, 'Enterprise identity and access management', 'https://www.okta.com', TRUE, 60),
('gp-028', 'Auth0', 'United States', 'US', 'Identity & Auth', 25, FALSE, 'Authentication and authorization platform', 'https://auth0.com', TRUE, 50),
('gp-029', 'OneLogin', 'United States', 'US', 'Identity & Auth', 28, FALSE, 'Identity and access management', 'https://www.onelogin.com', TRUE, 25),
('gp-030', 'Ping Identity', 'United States', 'US', 'Identity & Auth', 28, FALSE, 'Enterprise identity security', 'https://www.pingidentity.com', TRUE, 20);

-- Estonian Tech Companies
INSERT INTO global_ict_providers (id, name, country, country_code, service_type, risk_score, is_ctpp, description, website, is_verified, usage_count) VALUES
('gp-031', 'Nortal', 'Estonia', 'EE', 'IT Consulting', 25, FALSE, 'Strategic IT partner for digital transformation', 'https://nortal.com', TRUE, 40),
('gp-032', 'Cybernetica', 'Estonia', 'EE', 'Security', 22, FALSE, 'Cybersecurity and e-governance solutions', 'https://cyber.ee', TRUE, 35),
('gp-033', 'Guardtime', 'Estonia', 'EE', 'Security', 22, FALSE, 'Blockchain-based data integrity solutions', 'https://guardtime.com', TRUE, 30),
('gp-034', 'Tuum', 'Estonia', 'EE', 'Core Banking', 25, FALSE, 'Next-gen core banking platform', 'https://tuum.com', TRUE, 45),
('gp-035', 'Icefire', 'Estonia', 'EE', 'IT Consulting', 30, FALSE, 'Digital solutions and IT consulting', 'https://icefire.ee', TRUE, 20),
('gp-036', 'RingIT', 'Estonia', 'EE', 'IT Consulting', 30, FALSE, 'IT services and solutions', 'https://ringit.ee', TRUE, 15),
('gp-037', 'Mooncascade', 'Estonia', 'EE', 'IT Consulting', 30, FALSE, 'Digital product development', 'https://mooncascade.com', TRUE, 20),
('gp-038', 'Pipedrive', 'Estonia', 'EE', 'CRM / Sales', 28, FALSE, 'Sales CRM and pipeline management', 'https://www.pipedrive.com', TRUE, 35);

-- Payment & Banking
INSERT INTO global_ict_providers (id, name, country, country_code, service_type, risk_score, is_ctpp, description, website, is_verified, usage_count) VALUES
('gp-039', 'Stripe', 'United States', 'US', 'Payment Processing', 22, TRUE, 'Payment infrastructure for the internet', 'https://stripe.com', TRUE, 80),
('gp-040', 'Adyen', 'Netherlands', 'NL', 'Payment Processing', 22, TRUE, 'Global payment platform', 'https://www.adyen.com', TRUE, 50),
('gp-041', 'Wise (TransferWise)', 'United Kingdom', 'GB', 'Payment Processing', 25, FALSE, 'International money transfers', 'https://wise.com', TRUE, 45),
('gp-042', 'Checkout.com', 'United Kingdom', 'GB', 'Payment Processing', 25, FALSE, 'Payment processing platform', 'https://www.checkout.com', TRUE, 35),
('gp-043', 'Mambu', 'Germany', 'DE', 'Core Banking', 28, FALSE, 'SaaS banking platform', 'https://www.mambu.com', TRUE, 30),
('gp-044', 'Thought Machine', 'United Kingdom', 'GB', 'Core Banking', 28, FALSE, 'Cloud-native core banking', 'https://thoughtmachine.net', TRUE, 25);

-- Communication & Collaboration
INSERT INTO global_ict_providers (id, name, country, country_code, service_type, risk_score, is_ctpp, description, website, is_verified, usage_count) VALUES
('gp-045', 'Twilio', 'United States', 'US', 'Communication', 25, FALSE, 'Cloud communications platform', 'https://www.twilio.com', TRUE, 55),
('gp-046', 'Slack (Salesforce)', 'United States', 'US', 'Communication', 25, TRUE, 'Team collaboration and messaging', 'https://slack.com', TRUE, 70),
('gp-047', 'Zoom', 'United States', 'US', 'Communication', 28, TRUE, 'Video communications platform', 'https://zoom.us', TRUE, 75),
('gp-048', 'Microsoft 365', 'United States', 'US', 'Communication', 22, TRUE, 'Productivity and collaboration suite', 'https://www.microsoft.com/microsoft-365', TRUE, 90);

-- Data & Analytics
INSERT INTO global_ict_providers (id, name, country, country_code, service_type, risk_score, is_ctpp, description, website, is_verified, usage_count) VALUES
('gp-049', 'Snowflake', 'United States', 'US', 'Data Analytics', 25, FALSE, 'Cloud data platform', 'https://www.snowflake.com', TRUE, 45),
('gp-050', 'Databricks', 'United States', 'US', 'Data Analytics', 25, FALSE, 'Unified analytics platform', 'https://databricks.com', TRUE, 40),
('gp-051', 'MongoDB', 'United States', 'US', 'Data Analytics', 28, FALSE, 'Document database platform', 'https://www.mongodb.com', TRUE, 50),
('gp-052', 'Redis', 'United States', 'US', 'Data Analytics', 30, FALSE, 'In-memory data store', 'https://redis.io', TRUE, 35);

-- SSL & PKI
INSERT INTO global_ict_providers (id, name, country, country_code, service_type, risk_score, is_ctpp, description, website, is_verified, usage_count) VALUES
('gp-053', 'DigiCert', 'United States', 'US', 'SSL / PKI', 20, FALSE, 'Digital certificates and PKI solutions', 'https://www.digicert.com', TRUE, 40),
('gp-054', 'Let''s Encrypt', 'United States', 'US', 'SSL / PKI', 20, FALSE, 'Free, automated SSL certificates', 'https://letsencrypt.org', TRUE, 60),
('gp-055', 'GlobalSign', 'Belgium', 'BE', 'SSL / PKI', 22, FALSE, 'Identity services and digital certificates', 'https://www.globalsign.com', TRUE, 25);

-- HR & Recruitment
INSERT INTO global_ict_providers (id, name, country, country_code, service_type, risk_score, is_ctpp, description, website, is_verified, usage_count) VALUES
('gp-056', 'Workday', 'United States', 'US', 'HR / Recruitment', 25, FALSE, 'Enterprise HR and finance platform', 'https://www.workday.com', TRUE, 35),
('gp-057', 'BambooHR', 'United States', 'US', 'HR / Recruitment', 30, FALSE, 'HR software for small and medium businesses', 'https://www.bamboohr.com', TRUE, 25),
('gp-058', 'Personio', 'Germany', 'DE', 'HR / Recruitment', 28, FALSE, 'All-in-one HR software for SMEs', 'https://www.personio.com', TRUE, 30);

-- Additional Network & Infrastructure
INSERT INTO global_ict_providers (id, name, country, country_code, service_type, risk_score, is_ctpp, description, website, is_verified, usage_count) VALUES
('gp-059', 'Equinix', 'United States', 'US', 'Network / Transit', 22, TRUE, 'Global interconnection and data center company', 'https://www.equinix.com', TRUE, 30),
('gp-060', 'Telia', 'Sweden', 'SE', 'Network / Transit', 25, FALSE, 'Nordic telecommunications company', 'https://www.telia.ee', TRUE, 35);
