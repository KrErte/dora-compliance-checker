-- Add missing global ICT providers from the required list
-- Only inserts providers not already present in V11

-- Additional Estonian Tech Companies
INSERT INTO global_ict_providers (id, name, country, country_code, service_type, risk_score, is_ctpp, description, website, is_verified, usage_count, source, registration_code, emtak_code) VALUES
('gp-101', 'Helmes AS', 'Estonia', 'EE', 'Software Development', 20, FALSE, 'Full-cycle software development and IT consulting', 'https://helmes.com', TRUE, 30, 'SEED', '10276820', '6201'),
('gp-102', 'Proekspert AS', 'Estonia', 'EE', 'Software Development', 20, FALSE, 'Custom software development and innovation', 'https://proekspert.ee', TRUE, 25, 'SEED', '10264437', '6201'),
('gp-103', 'Net Group OÜ', 'Estonia', 'EE', 'IT Consulting', 22, FALSE, 'IT solutions and consulting services', 'https://netgroup.com', TRUE, 20, 'SEED', '10335564', '6202'),
('gp-104', 'Trinidad Wiseman OÜ', 'Estonia', 'EE', 'Software Development', 22, FALSE, 'Digital solutions and UX design', 'https://twn.ee', TRUE, 15, 'SEED', '10614820', '6201'),
('gp-105', 'Iglu OÜ', 'Estonia', 'EE', 'Software Development', 25, FALSE, 'Mobile and web app development', 'https://iglu.ee', TRUE, 10, 'SEED', NULL, '6201'),
('gp-106', 'Uptime OÜ', 'Estonia', 'EE', 'Hosting & Data Processing', 20, FALSE, 'Managed hosting and cloud services', 'https://uptime.ee', TRUE, 20, 'SEED', '11268027', '6311');

-- Additional Payment & Banking
INSERT INTO global_ict_providers (id, name, country, country_code, service_type, risk_score, is_ctpp, description, website, is_verified, usage_count, source) VALUES
('gp-107', 'Visa Inc.', 'United States', 'US', 'Payment Processing', 20, TRUE, 'Global payment technology company', 'https://visa.com', TRUE, 70, 'SEED'),
('gp-108', 'Mastercard', 'United States', 'US', 'Payment Processing', 20, TRUE, 'Global payment network', 'https://mastercard.com', TRUE, 65, 'SEED'),
('gp-109', 'Nets (Nexi Group)', 'Denmark', 'DK', 'Payment Processing', 22, FALSE, 'Nordic payment solutions', 'https://nets.eu', TRUE, 30, 'SEED'),
('gp-110', 'Finastra', 'United Kingdom', 'GB', 'Core Banking', 25, FALSE, 'Financial software solutions', 'https://finastra.com', TRUE, 25, 'SEED'),
('gp-111', 'FIS Global', 'United States', 'US', 'Core Banking', 25, TRUE, 'Financial technology provider', 'https://fisglobal.com', TRUE, 35, 'SEED');

-- Additional Infrastructure
INSERT INTO global_ict_providers (id, name, country, country_code, service_type, risk_score, is_ctpp, description, website, is_verified, usage_count, source) VALUES
('gp-112', 'Deutsche Telekom', 'Germany', 'DE', 'Network / Transit', 22, FALSE, 'European telecommunications provider', 'https://telekom.com', TRUE, 30, 'SEED');

-- Additional KYC/Identity
INSERT INTO global_ict_providers (id, name, country, country_code, service_type, risk_score, is_ctpp, description, website, is_verified, usage_count, source) VALUES
('gp-113', 'iDenfy', 'Lithuania', 'LT', 'KYC / Identity', 25, FALSE, 'Identity verification solution', 'https://idenfy.com', TRUE, 20, 'SEED');
