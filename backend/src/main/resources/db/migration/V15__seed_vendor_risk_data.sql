-- Seed vendor risk data for the Vendors page
-- This populates the vendor_risk table so the page shows real data instead of being empty

INSERT INTO vendor_risk (id, vendor_name, vendor_category, assessment_count, average_score, audit_clause_score, exit_strategy_score, incident_score, data_protection_score, subcontracting_score, common_gaps, risk_level, last_updated) VALUES
-- Cloud Infrastructure
(RANDOM_UUID(), 'Amazon Web Services (AWS)', 'Cloud Infrastructure', 156, 72.5, 85.0, 65.0, 78.0, 80.0, 55.0, 'Subcontracting transparency, Data localization', 'MEDIUM', CURRENT_TIMESTAMP),
(RANDOM_UUID(), 'Microsoft Azure', 'Cloud Infrastructure', 142, 74.8, 88.0, 70.0, 75.0, 82.0, 60.0, 'Exit strategy clarity', 'MEDIUM', CURRENT_TIMESTAMP),
(RANDOM_UUID(), 'Google Cloud Platform', 'Cloud Infrastructure', 98, 71.2, 82.0, 68.0, 72.0, 78.0, 58.0, 'Audit rights, Subcontracting', 'MEDIUM', CURRENT_TIMESTAMP),
(RANDOM_UUID(), 'Hetzner', 'Cloud Infrastructure', 45, 78.5, 85.0, 82.0, 80.0, 78.0, 68.0, 'SLA response times', 'LOW', CURRENT_TIMESTAMP),
(RANDOM_UUID(), 'Oracle Cloud', 'Cloud Infrastructure', 54, 64.8, 72.0, 55.0, 68.0, 70.0, 50.0, 'Audit access, Data retention', 'MEDIUM', CURRENT_TIMESTAMP),
(RANDOM_UUID(), 'DigitalOcean', 'Cloud Infrastructure', 38, 66.2, 72.0, 62.0, 68.0, 72.0, 52.0, 'Incident notification timelines', 'MEDIUM', CURRENT_TIMESTAMP),

-- Security & Identity
(RANDOM_UUID(), 'Cloudflare', 'Security & CDN', 89, 82.8, 90.0, 85.0, 88.0, 85.0, 70.0, 'Minor subcontracting disclosure gaps', 'LOW', CURRENT_TIMESTAMP),
(RANDOM_UUID(), 'CrowdStrike', 'Security & Identity', 67, 80.5, 88.0, 78.0, 85.0, 82.0, 72.0, 'Exit data format documentation', 'LOW', CURRENT_TIMESTAMP),
(RANDOM_UUID(), 'Okta', 'Security & Identity', 45, 85.2, 95.0, 88.0, 90.0, 92.0, 78.0, 'None significant', 'LOW', CURRENT_TIMESTAMP),
(RANDOM_UUID(), 'Veriff', 'KYC / Identity', 55, 76.5, 82.0, 75.0, 80.0, 78.0, 62.0, 'Data retention policies', 'LOW', CURRENT_TIMESTAMP),

-- Payment Processing
(RANDOM_UUID(), 'Stripe', 'Payment Processing', 78, 82.5, 92.0, 85.0, 88.0, 90.0, 72.0, 'Minor documentation gaps', 'LOW', CURRENT_TIMESTAMP),
(RANDOM_UUID(), 'Adyen', 'Payment Processing', 62, 79.8, 88.0, 82.0, 85.0, 88.0, 68.0, 'SLA specificity', 'LOW', CURRENT_TIMESTAMP),
(RANDOM_UUID(), 'SWIFT', 'Payment Processing', 34, 88.5, 95.0, 90.0, 92.0, 90.0, 78.0, 'None significant', 'LOW', CURRENT_TIMESTAMP),

-- Estonian Tech
(RANDOM_UUID(), 'Nortal', 'IT Consulting', 40, 75.2, 82.0, 72.0, 78.0, 80.0, 58.0, 'Subcontracting chain visibility', 'LOW', CURRENT_TIMESTAMP),
(RANDOM_UUID(), 'Cybernetica', 'Security', 35, 82.0, 90.0, 80.0, 85.0, 88.0, 68.0, 'None significant', 'LOW', CURRENT_TIMESTAMP),
(RANDOM_UUID(), 'Guardtime', 'Security', 30, 80.8, 88.0, 78.0, 82.0, 85.0, 65.0, 'Exit strategy details', 'LOW', CURRENT_TIMESTAMP),
(RANDOM_UUID(), 'Tuum', 'Core Banking', 28, 77.5, 85.0, 75.0, 80.0, 82.0, 60.0, 'SLA monitoring', 'LOW', CURRENT_TIMESTAMP),

-- Communication
(RANDOM_UUID(), 'Telia', 'Network / Transit', 56, 72.8, 80.0, 68.0, 75.0, 78.0, 58.0, 'SLA monitoring', 'MEDIUM', CURRENT_TIMESTAMP),
(RANDOM_UUID(), 'Elisa', 'Network / Transit', 42, 70.5, 78.0, 65.0, 72.0, 76.0, 55.0, 'Exit strategy, Data localization', 'MEDIUM', CURRENT_TIMESTAMP),

-- Data & Analytics
(RANDOM_UUID(), 'Snowflake', 'Data & Analytics', 42, 68.5, 75.0, 62.0, 72.0, 78.0, 55.0, 'Data localization, Audit scope', 'MEDIUM', CURRENT_TIMESTAMP),
(RANDOM_UUID(), 'Datadog', 'SIEM / Monitoring', 48, 75.2, 82.0, 72.0, 78.0, 80.0, 62.0, 'Subcontracting disclosure', 'LOW', CURRENT_TIMESTAMP),

-- Core Banking
(RANDOM_UUID(), 'Temenos', 'Core Banking', 38, 70.5, 78.0, 65.0, 72.0, 75.0, 55.0, 'Exit costs, Data portability', 'MEDIUM', CURRENT_TIMESTAMP),
(RANDOM_UUID(), 'Mambu', 'Core Banking', 32, 73.8, 80.0, 70.0, 75.0, 78.0, 58.0, 'Audit rights specificity', 'MEDIUM', CURRENT_TIMESTAMP),

-- Additional vendors
(RANDOM_UUID(), 'Splunk', 'SIEM / Monitoring', 55, 72.0, 80.0, 68.0, 75.0, 76.0, 60.0, 'Data retention policies', 'MEDIUM', CURRENT_TIMESTAMP),
(RANDOM_UUID(), 'Palo Alto Networks', 'Security & Identity', 48, 78.8, 86.0, 75.0, 82.0, 80.0, 65.0, 'SLA response times', 'LOW', CURRENT_TIMESTAMP);
