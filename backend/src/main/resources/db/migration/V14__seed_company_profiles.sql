-- Seed data for company_profiles - Known FI-licensed Estonian financial institutions
-- This provides immediate "wow-effect" data without waiting for crawler

-- Credit Institutions (DORA Tier 1)
INSERT INTO company_profiles (name, registry_code, website_domain, fi_license_type, fi_license_status, dora_tier, digital_risk_score, ssl_valid_days, security_headers_score, spf_record_exists, dmarc_record_exists, https_redirect, last_crawled_at)
VALUES
('Swedbank AS', '10060701', 'swedbank.ee', 'krediidiasutus', 'active', 1, 15, 365, 6, true, true, true, CURRENT_TIMESTAMP),
('SEB Pank AS', '10004252', 'seb.ee', 'krediidiasutus', 'active', 1, 18, 280, 5, true, true, true, CURRENT_TIMESTAMP),
('Luminor Bank AS', '11315936', 'luminor.ee', 'krediidiasutus', 'active', 1, 20, 250, 5, true, true, true, CURRENT_TIMESTAMP),
('LHV Pank AS', '10539549', 'lhv.ee', 'krediidiasutus', 'active', 1, 12, 400, 7, true, true, true, CURRENT_TIMESTAMP),
('Coop Pank AS', '10237832', 'cooppank.ee', 'krediidiasutus', 'active', 1, 22, 200, 5, true, false, true, CURRENT_TIMESTAMP),
('Bigbank AS', '10183757', 'bigbank.ee', 'krediidiasutus', 'active', 1, 25, 180, 4, true, true, true, CURRENT_TIMESTAMP),
('Citadele banka Eesti filiaal', '11058255', 'citadele.ee', 'krediidiasutus', 'active', 1, 28, 150, 4, true, false, true, CURRENT_TIMESTAMP),
('TBB pank AS', '10107368', 'tbb.ee', 'krediidiasutus', 'active', 1, 35, 120, 3, false, false, true, CURRENT_TIMESTAMP),
('Holm Bank AS', '14895521', 'holmbank.ee', 'krediidiasutus', 'active', 1, 20, 300, 5, true, true, true, CURRENT_TIMESTAMP),
('Inbank AS', '12001988', 'inbank.ee', 'krediidiasutus', 'active', 1, 18, 320, 6, true, true, true, CURRENT_TIMESTAMP);

-- Payment Institutions (DORA Tier 2)
INSERT INTO company_profiles (name, registry_code, website_domain, fi_license_type, fi_license_status, dora_tier, digital_risk_score, ssl_valid_days, security_headers_score, spf_record_exists, dmarc_record_exists, https_redirect, last_crawled_at)
VALUES
('Maksekeskus AS', '12268475', 'maksekeskus.ee', 'makseasutus', 'active', 2, 22, 280, 5, true, true, true, CURRENT_TIMESTAMP),
('EveryPay AS', '12049458', 'every-pay.com', 'makseasutus', 'active', 2, 25, 250, 4, true, true, true, CURRENT_TIMESTAMP),
('Montonio Finance OÜ', '14178439', 'montonio.com', 'makseasutus', 'active', 2, 20, 300, 5, true, true, true, CURRENT_TIMESTAMP),
('Decta Limited Eesti filiaal', '14601044', 'decta.com', 'makseasutus', 'active', 2, 30, 200, 4, true, false, true, CURRENT_TIMESTAMP),
('ConnectPay UAB Eesti filiaal', '16015229', 'connectpay.com', 'makseasutus', 'active', 2, 28, 220, 4, true, true, true, CURRENT_TIMESTAMP);

-- E-money Institutions (DORA Tier 2)
INSERT INTO company_profiles (name, registry_code, website_domain, fi_license_type, fi_license_status, dora_tier, digital_risk_score, ssl_valid_days, security_headers_score, spf_record_exists, dmarc_record_exists, https_redirect, last_crawled_at)
VALUES
('Wise Europe SA', '12259658', 'wise.com', 'e-raha asutus', 'active', 2, 10, 400, 7, true, true, true, CURRENT_TIMESTAMP),
('Monese Ltd Eesti filiaal', '12513487', 'monese.com', 'e-raha asutus', 'active', 2, 18, 350, 6, true, true, true, CURRENT_TIMESTAMP),
('Paysera LT UAB Eesti filiaal', '12856056', 'paysera.ee', 'e-raha asutus', 'active', 2, 25, 280, 5, true, true, true, CURRENT_TIMESTAMP);

-- Investment Firms (DORA Tier 2)
INSERT INTO company_profiles (name, registry_code, website_domain, fi_license_type, fi_license_status, dora_tier, digital_risk_score, ssl_valid_days, security_headers_score, spf_record_exists, dmarc_record_exists, https_redirect, last_crawled_at)
VALUES
('Admiral Markets AS', '10932555', 'admiralmarkets.com', 'investeerimisühing', 'active', 2, 15, 380, 6, true, true, true, CURRENT_TIMESTAMP),
('Avaron Asset Management AS', '11319869', 'avaron.com', 'investeerimisühing', 'active', 2, 28, 250, 4, true, true, true, CURRENT_TIMESTAMP),
('Trigon Asset Management AS', '10507141', 'trigoncapital.com', 'investeerimisühing', 'active', 2, 30, 220, 4, true, false, true, CURRENT_TIMESTAMP);

-- Insurance Companies (DORA Tier 3)
INSERT INTO company_profiles (name, registry_code, website_domain, fi_license_type, fi_license_status, dora_tier, digital_risk_score, ssl_valid_days, security_headers_score, spf_record_exists, dmarc_record_exists, https_redirect, last_crawled_at)
VALUES
('If P&C Insurance AS', '10100168', 'if.ee', 'kindlustusselts', 'active', 3, 18, 350, 6, true, true, true, CURRENT_TIMESTAMP),
('Compensa Vienna Insurance Group', '10055752', 'compensa.ee', 'kindlustusselts', 'active', 3, 25, 280, 5, true, true, true, CURRENT_TIMESTAMP),
('ERGO Insurance SE', '10017013', 'ergo.ee', 'kindlustusselts', 'active', 3, 20, 320, 5, true, true, true, CURRENT_TIMESTAMP),
('Salva Kindlustuse AS', '10284984', 'salva.ee', 'kindlustusselts', 'active', 3, 32, 200, 4, true, false, true, CURRENT_TIMESTAMP),
('Swedbank P&C Insurance AS', '10290546', 'swedbank.ee', 'kindlustusselts', 'active', 3, 15, 365, 6, true, true, true, CURRENT_TIMESTAMP),
('Seesam Insurance AS', '10055753', 'seesam.ee', 'kindlustusselts', 'active', 3, 28, 250, 4, true, true, true, CURRENT_TIMESTAMP);

-- Fund Managers (DORA Tier 3)
INSERT INTO company_profiles (name, registry_code, website_domain, fi_license_type, fi_license_status, dora_tier, digital_risk_score, ssl_valid_days, security_headers_score, spf_record_exists, dmarc_record_exists, https_redirect, last_crawled_at)
VALUES
('LHV Varahaldus AS', '10572453', 'lhv.ee', 'fondivalitseja', 'active', 3, 12, 400, 7, true, true, true, CURRENT_TIMESTAMP),
('Swedbank Investeerimisfondid AS', '10328362', 'swedbank.ee', 'fondivalitseja', 'active', 3, 15, 365, 6, true, true, true, CURRENT_TIMESTAMP),
('SEB Varahaldus AS', '10035169', 'seb.ee', 'fondivalitseja', 'active', 3, 18, 280, 5, true, true, true, CURRENT_TIMESTAMP),
('Tuleva Fondid AS', '14497630', 'tuleva.ee', 'fondivalitseja', 'active', 3, 22, 300, 5, true, true, true, CURRENT_TIMESTAMP);

-- Add some board members as JSON for demo (top banks)
UPDATE company_profiles SET board_members = '[{"name":"Olavi Lepp","role":"juhatuse esimees"},{"name":"Priit Perens","role":"juhatuse liige"},{"name":"Mart Mägi","role":"juhatuse liige"}]' WHERE registry_code = '10060701';
UPDATE company_profiles SET board_members = '[{"name":"Allan Mägi","role":"juhatuse esimees"},{"name":"Ainar Leppänen","role":"juhatuse liige"}]' WHERE registry_code = '10004252';
UPDATE company_profiles SET board_members = '[{"name":"Erkki Raasuke","role":"juhatuse esimees"},{"name":"Andrius Načajus","role":"juhatuse liige"},{"name":"Maris Jesse","role":"juhatuse liige"}]' WHERE registry_code = '10539549';
UPDATE company_profiles SET board_members = '[{"name":"Peter Bosek","role":"juhatuse esimees"},{"name":"Kerli Lõhmus","role":"juhatuse liige"}]' WHERE registry_code = '11315936';
UPDATE company_profiles SET board_members = '[{"name":"Margus Rink","role":"juhatuse esimees"},{"name":"Arko Kurtmann","role":"juhatuse liige"}]' WHERE registry_code = '10237832';

-- Add EMTAK codes for some companies
UPDATE company_profiles SET emtak_code = '64191', emtak_description = 'Pangandus' WHERE fi_license_type = 'krediidiasutus';
UPDATE company_profiles SET emtak_code = '64991', emtak_description = 'Muu finantsvahendus' WHERE fi_license_type = 'makseasutus';
UPDATE company_profiles SET emtak_code = '65111', emtak_description = 'Elukindlustus' WHERE fi_license_type = 'kindlustusselts';
UPDATE company_profiles SET emtak_code = '66301', emtak_description = 'Fondide valitsemine' WHERE fi_license_type = 'fondivalitseja';
