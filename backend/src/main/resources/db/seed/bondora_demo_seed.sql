-- =====================================================
-- DoraAudit.eu — Bondora CEO demo seed data
-- Tabel: ict_service_arrangements
-- Jooksuta: psql -d doradb -f bondora_demo_seed.sql
-- =====================================================

-- MUUDA SEE kasutaja ID vastavalt!
-- Leia kasutaja ID: SELECT id FROM users WHERE email = 'partel.tomberg@bondora.com';
-- Või kasuta demo kasutaja ID-d pärast registreerimist

-- Kustuta vana demo data (kui on)
DELETE FROM ict_service_arrangements WHERE user_id = 'DEMO_USER_ID';

-- =====================================================
-- ICT TEENUSEPAKKUJAD (10 pakkujat)
-- =====================================================

-- 1. Tuum OÜ — Core Banking (KRIITILINE, madal risk)
INSERT INTO ict_service_arrangements (
    id, user_id, provider_name, provider_country, country_code,
    service_type, service_description, criticality, is_critical, risk_score,
    has_exit_strategy, exit_strategy_description, contract_number,
    contract_start_date, contract_end_date, subcontracting_info, notes,
    created_at, updated_at
) VALUES (
    'demo-001', 'DEMO_USER_ID', 'Tuum OÜ', 'Eesti', 'EE',
    'Core Banking', 'Cloud-native core banking platvorm laenu- ja hoiusetoodetele', 'critical', true, 28,
    true, 'Alternatiivid: Mambu, Temenos. Migratsiooniperiood 12 kuud. Andmete eksport API kaudu.',
    'LEP-2025-001', '2025-01-01', '2028-12-31',
    '[{"name": "AWS", "country": "Iirimaa", "countryCode": "IE", "type": "Hosting", "riskScore": 25}, {"name": "Finastra", "country": "Suurbritannia", "countryCode": "GB", "type": "Core banking moodulid", "riskScore": 35}]',
    'Bondora uus core banking partner. AWS-is deployed EU regioonis. DORA Art.28 — kriitiline ICT teenus.',
    NOW(), NOW()
);

-- 2. Microsoft Azure — Cloud IaaS/PaaS (KRIITILINE)
INSERT INTO ict_service_arrangements (
    id, user_id, provider_name, provider_country, country_code,
    service_type, service_description, criticality, is_critical, risk_score,
    has_exit_strategy, exit_strategy_description, contract_number,
    contract_start_date, contract_end_date, subcontracting_info, notes,
    created_at, updated_at
) VALUES (
    'demo-002', 'DEMO_USER_ID', 'Microsoft Azure (Ireland)', 'Iirimaa', 'IE',
    'Cloud IaaS/PaaS', 'Peamine pilveplatvorm: Kubernetes, Terraform, Azure AD', 'critical', true, 32,
    true, 'Multi-cloud strateegia AWS-iga. Terraform IaC võimaldab migratsiooni. Azure AD -> Okta fallback.',
    'LEP-2024-002', '2024-03-01', '2027-02-28',
    '[{"name": "Equinix", "country": "Holland", "countryCode": "NL", "type": "Data center", "riskScore": 25}, {"name": "Akamai", "country": "USA", "countryCode": "US", "type": "CDN", "riskScore": 35}]',
    'CTPP kandidaat — ESA järelevalve all alates 2025. Azure AD identiteedihaldus kõigile töötajatele.',
    NOW(), NOW()
);

-- 3. Onfido Ltd — KYC/Identity (OLULINE, KÕRGE RISK!)
INSERT INTO ict_service_arrangements (
    id, user_id, provider_name, provider_country, country_code,
    service_type, service_description, criticality, is_critical, risk_score,
    has_exit_strategy, exit_strategy_description, contract_number,
    contract_start_date, contract_end_date, subcontracting_info, notes,
    created_at, updated_at
) VALUES (
    'demo-003', 'DEMO_USER_ID', 'Onfido Ltd', 'Suurbritannia', 'GB',
    'KYC / Identity', 'Klientide tuvastamine, dokumendikontroll, AML screening', 'important', false, 45,
    false, NULL,
    'LEP-2023-003', '2023-06-01', '2025-05-31',
    '[{"name": "AWS", "country": "USA", "countryCode": "US", "type": "Pilveinfrastruktuur", "riskScore": 35}, {"name": "Jumio", "country": "USA", "countryCode": "US", "type": "Backup ID verification", "riskScore": 35}]',
    'PUNANE LIPP: UK firma (kolmas riik), EXIT STRATEEGIA PUUDUB, allhankijad USA-s. Leping lõpeb peagi!',
    NOW(), NOW()
);

-- 4. AWS Europe — Tuum hosting (KRIITILINE, madal risk)
INSERT INTO ict_service_arrangements (
    id, user_id, provider_name, provider_country, country_code,
    service_type, service_description, criticality, is_critical, risk_score,
    has_exit_strategy, exit_strategy_description, contract_number,
    contract_start_date, contract_end_date, subcontracting_info, notes,
    created_at, updated_at
) VALUES (
    'demo-004', 'DEMO_USER_ID', 'AWS Europe (Frankfurt)', 'Saksamaa', 'DE',
    'Cloud IaaS', 'Tuum core banking platvormi hosting, EU andmeresidentsus', 'critical', true, 22,
    true, 'Azure fallback. Terraform IaC. Andmed EU-s, GDPR-compliant.',
    'LEP-2025-004', '2025-01-01', '2027-12-31',
    '[{"name": "Equinix Frankfurt", "country": "Saksamaa", "type": "Colocation", "riskScore": 10}]',
    'CTPP — ESA poolt kriitiliseks määratud 2025. EU andmeresidentsus tagatud.',
    NOW(), NOW()
);

-- 5. Greenhouse Software — HR (TAVALINE, madal risk)
INSERT INTO ict_service_arrangements (
    id, user_id, provider_name, provider_country, country_code,
    service_type, service_description, criticality, is_critical, risk_score,
    has_exit_strategy, exit_strategy_description, contract_number,
    contract_start_date, contract_end_date, subcontracting_info, notes,
    created_at, updated_at
) VALUES (
    'demo-005', 'DEMO_USER_ID', 'Greenhouse Software', 'USA', 'US',
    'HR / Recruitment', 'Värbamisplatvorm, kandidaatide haldus', 'normal', false, 18,
    true, 'Alternatiivid: Workday, Lever. Andmete eksport CSV/API. 30-päevane migratsiooniperiood.',
    'LEP-2024-005', '2024-01-01', '2025-12-31',
    NULL,
    'Sisaldab töötajate ja kandidaatide isikuandmeid — GDPR relevantne. USA firma, EU-US DPF.',
    NOW(), NOW()
);

-- 6. Cloudflare — CDN/WAF (OLULINE)
INSERT INTO ict_service_arrangements (
    id, user_id, provider_name, provider_country, country_code,
    service_type, service_description, criticality, is_critical, risk_score,
    has_exit_strategy, exit_strategy_description, contract_number,
    contract_start_date, contract_end_date, subcontracting_info, notes,
    created_at, updated_at
) VALUES (
    'demo-006', 'DEMO_USER_ID', 'Cloudflare Inc', 'USA', 'US',
    'CDN / WAF', 'Veebiliikluse kaitse, DDoS mitigatsioon, CDN', 'important', false, 25,
    true, 'Alternatiivid: Akamai, AWS CloudFront. DNS-põhine, kiire ümberlülitus võimalik.',
    'LEP-2024-006', '2024-02-01', '2026-01-31',
    '[{"name": "Equinix", "country": "USA", "countryCode": "US", "type": "Data center", "riskScore": 35}]',
    'USA firma, aga EU PoP-id olemas. Anycast võrk tagab kiire failover.',
    NOW(), NOW()
);

-- 7. China Telecom Europe — Telco (KÕRGE RISK!)
INSERT INTO ict_service_arrangements (
    id, user_id, provider_name, provider_country, country_code,
    service_type, service_description, criticality, is_critical, risk_score,
    has_exit_strategy, exit_strategy_description, contract_number,
    contract_start_date, contract_end_date, subcontracting_info, notes,
    created_at, updated_at
) VALUES (
    'demo-007', 'DEMO_USER_ID', 'China Telecom Europe', 'Hiina', 'CN',
    'Telco / Network', 'Telekommunikatsiooniteenused, võrguühendus', 'important', false, 75,
    false, NULL,
    'LEP-2024-007', '2024-01-01', '2026-12-31',
    '[{"name": "Huawei Marine", "country": "Hiina", "countryCode": "CN", "type": "Merekaabel infrastruktuur", "riskScore": 80}]',
    'PUNANE LIPP: Hiina firma — kõrge geopoliitiline risk. Allhankija Huawei Marine samuti Hiina.',
    NOW(), NOW()
);

-- 8. Nortal AS — IT teenused (TAVALINE, madal risk)
INSERT INTO ict_service_arrangements (
    id, user_id, provider_name, provider_country, country_code,
    service_type, service_description, criticality, is_critical, risk_score,
    has_exit_strategy, exit_strategy_description, contract_number,
    contract_start_date, contract_end_date, subcontracting_info, notes,
    created_at, updated_at
) VALUES (
    'demo-008', 'DEMO_USER_ID', 'Nortal AS', 'Eesti', 'EE',
    'IT konsultatsioon', 'Tarkvaraarendus ja IT konsultatsioon', 'normal', false, 20,
    true, 'Alternatiivid: Helmes, Cybernetica. Teadmussiire 3 kuu jooksul.',
    'LEP-2024-008', '2024-06-01', '2026-05-31',
    NULL,
    'Eesti IT firma. Allhankijaid pole deklareeritud.',
    NOW(), NOW()
);

-- 9. Helmes AS — Tarkvaraarendus (TAVALINE, madal risk)
INSERT INTO ict_service_arrangements (
    id, user_id, provider_name, provider_country, country_code,
    service_type, service_description, criticality, is_critical, risk_score,
    has_exit_strategy, exit_strategy_description, contract_number,
    contract_start_date, contract_end_date, subcontracting_info, notes,
    created_at, updated_at
) VALUES (
    'demo-009', 'DEMO_USER_ID', 'Helmes AS', 'Eesti', 'EE',
    'Tarkvaraarendus', 'Custom tarkvaraarendus ja hooldus', 'normal', false, 20,
    true, 'Alternatiivid: Nortal, Codeborne. Lähtekood kliendi omanduses.',
    'LEP-2024-009', '2024-03-01', '2026-02-28',
    NULL,
    'Eesti IT firma. Allhankijaid pole deklareeritud.',
    NOW(), NOW()
);

-- 10. Splunk Inc — SIEM/Monitoring (OLULINE)
INSERT INTO ict_service_arrangements (
    id, user_id, provider_name, provider_country, country_code,
    service_type, service_description, criticality, is_critical, risk_score,
    has_exit_strategy, exit_strategy_description, contract_number,
    contract_start_date, contract_end_date, subcontracting_info, notes,
    created_at, updated_at
) VALUES (
    'demo-010', 'DEMO_USER_ID', 'Splunk Inc', 'USA', 'US',
    'SIEM / Monitoring', 'Logide analüüs, turvaseire, SIEM', 'important', false, 30,
    true, 'Alternatiivid: Elastic SIEM, Microsoft Sentinel. Andmete eksport võimalik.',
    'LEP-2024-010', '2024-01-01', '2026-12-31',
    NULL,
    'USA firma (Cisco omanduses). Allhankijaid pole deklareeritud.',
    NOW(), NOW()
);


-- =====================================================
-- KASUTAMISJUHEND:
-- =====================================================
--
-- 1. Registreeri kasutaja DoraAudit.eu lehel
-- 2. Leia tema ID andmebaasist:
--    SELECT id, email FROM users WHERE email LIKE '%bondora%';
--
-- 3. Asenda 'DEMO_USER_ID' leitud ID-ga:
--    sed -i 's/DEMO_USER_ID/abc123-real-user-id/g' bondora_demo_seed.sql
--
-- 4. Jooksuta SQL:
--    psql -h localhost -U dorauser -d doradb -f bondora_demo_seed.sql
--
-- 5. Pärast demot kustuta:
--    DELETE FROM ict_service_arrangements WHERE id LIKE 'demo-%';
--    (kustutab demo-001 kuni demo-010)
--
-- =====================================================


-- =====================================================
-- DEMO MÄRKMED (mis näidata Pärtelile):
-- =====================================================
--
-- 1. ONFIDO = PUNANE LIPP (risk_score: 45)
--    - UK firma (kolmas riik pärast Brexitit)
--    - EXIT STRATEEGIA PUUDUB!
--    - Allhankijad: AWS (US, risk 35) + Jumio (US, risk 35)
--    - Leping lõpeb 2025-05 — vajab kiirelt tähelepanu
--    → "Kas teil on Onfido asendusplaan? Veriff on Eesti alternatiiv."
--
-- 2. TUUM = POSITIIVNE NÄIDE (risk_score: 28)
--    - Eesti firma, EU andmeresidentsus
--    - Allhankijad: AWS IE (risk 25) + Finastra UK (risk 35)
--    - Exit strateegia dokumenteeritud
--    → "Tuum valik oli DORA vaates väga hea otsus"
--
-- 3. AZURE = CTPP staatus
--    - ESA määras kriitiliseks kolmanda osapoole pakkujaks
--    - Allhankijad: Equinix NL (risk 25) + Akamai US (risk 35)
--    → "Kas teate et Azure on nüüd CTPP? See muudab kohustusi."
--
-- 4. CLOUDFLARE
--    - USA firma, CDN/WAF
--    - Allhankija: Equinix US (risk 35)
--
-- 5. CHINA TELECOM = KÕRGEIM RISK (risk_score: 75)
--    - Hiina firma — geopoliitiline risk
--    - Allhankija: Huawei Marine (CN, risk 80)
--    → "Hiina telco allhankijate ahel on tõsine mure"
--
-- 6. NORTAL, HELMES, SPLUNK
--    - Allhankijaid pole deklareeritud (realistlik)
--    - Näitab et mitte kõigil pole allhankijaid
--
-- 7. SUPPLY CHAIN DEPTH
--    - Onfido -> AWS US + Jumio US
--    - Tuum -> AWS IE + Finastra UK
--    - Azure -> Equinix NL + Akamai US
--    - China Telecom -> Huawei Marine
--    → "DORA nõuab allhankijate kaardistamist. Mitu taset te teate?"
--
-- =====================================================
