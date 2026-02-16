-- =====================================================
-- DoraAudit.eu — Bondora demo seed data
-- Jooksuta enne demot, kustuta pärast kui vaja
-- =====================================================

-- NB! Kohanda tabel/veerunimed vastavalt oma skeemile!
-- See on template, mitte copy-paste.

-- 1. Demo kasutaja (kui pole juba loodud)
-- INSERT INTO users (email, name, company, role) 
-- VALUES ('partel.tomberg@bondora.com', 'Pärtel Tomberg', 'Bondora AS', 'CEO');

-- Eelda et kasutaja ID = @user_id

-- 2. ICT teenusepakkujad (põhineb reaalsel uuringul)

-- Tuum — nende uus core banking partner (KRIITILINE)
INSERT INTO ict_providers (user_id, name, country, country_code, service_type, criticality, risk_score, has_exit_strategy, contract_ref, notes)
VALUES (@user_id, 'Tuum OÜ', 'Eesti', 'EE', 'Core Banking', 'critical', 28, true, 'LEP-2025-001', 
'Cloud-native core banking platvorm. Bondora migreerub siia laenu- ja hoiusetoodetega. AWS-is deployed. DORA Art.28 — kriitiline ICT teenus.');

-- Microsoft Azure — nende peamine pilveplatvorm
INSERT INTO ict_providers (user_id, name, country, country_code, service_type, criticality, risk_score, has_exit_strategy, contract_ref, notes)
VALUES (@user_id, 'Microsoft Azure (Ireland)', 'Iirimaa', 'IE', 'Cloud IaaS/PaaS', 'critical', 32, true, 'LEP-2024-002',
'Peamine pilveplatvorm. Kubernetes, Terraform. Azure AD identiteedihaldus. CTPP kandidaat ESA järelevalve all.');

-- Onfido — KYC/AML partner
INSERT INTO ict_providers (user_id, name, country, country_code, service_type, criticality, risk_score, has_exit_strategy, contract_ref, notes)
VALUES (@user_id, 'Onfido Ltd', 'Suurbritannia', 'GB', 'KYC / Identity Verification', 'important', 35, false, 'LEP-2023-003',
'Klientide tuvastamine ja AML. Brexit-järgne UK firma — kolmanda riigi risk. EXIT STRATEEGIA PUUDUB.');

-- AWS — Tuum platvormi hosting
INSERT INTO ict_providers (user_id, name, country, country_code, service_type, criticality, risk_score, has_exit_strategy, contract_ref, notes)
VALUES (@user_id, 'AWS Europe (Frankfurt)', 'Saksamaa', 'DE', 'Cloud IaaS', 'critical', 22, true, 'LEP-2025-004',
'Tuum core banking hosting. EU andmeresidentsus. CTPP — ESA poolt kriitiliseks määratud 2025.');

-- Greenhouse — HR/värbamine (operatiivne, mitte kriitiline)
INSERT INTO ict_providers (user_id, name, country, country_code, service_type, criticality, risk_score, has_exit_strategy, contract_ref, notes)
VALUES (@user_id, 'Greenhouse Software', 'USA', 'US', 'HR / Recruitment', 'standard', 15, true, 'LEP-2024-005',
'Värbamisplatvorm. Sisaldab töötajate isikuandmeid — GDPR relevantne.');

-- Cloudflare — CDN/WAF
INSERT INTO ict_providers (user_id, name, country, country_code, service_type, criticality, risk_score, has_exit_strategy, contract_ref, notes)
VALUES (@user_id, 'Cloudflare Inc', 'USA', 'US', 'CDN / WAF', 'important', 25, true, 'LEP-2024-006',
'Veebiliikluse kaitse ja CDN. Kolmanda riigi teenusepakkuja — USA.');

-- China Telecom Europe — Telco (KÕRGE RISK!)
INSERT INTO ict_providers (user_id, name, country, country_code, service_type, criticality, risk_score, has_exit_strategy, contract_ref, notes)
VALUES (@user_id, 'China Telecom Europe', 'Hiina', 'CN', 'Telco / Network', 'important', 75, false, 'LEP-2024-007',
'Telekommunikatsioon. PUNANE LIPP: Hiina firma — kõrge geopoliitiline risk.');

-- Nortal AS — IT teenused (madal risk)
INSERT INTO ict_providers (user_id, name, country, country_code, service_type, criticality, risk_score, has_exit_strategy, contract_ref, notes)
VALUES (@user_id, 'Nortal AS', 'Eesti', 'EE', 'IT konsultatsioon', 'standard', 20, true, 'LEP-2024-008',
'Tarkvaraarendus ja IT konsultatsioon. Eesti firma.');

-- Helmes AS — Tarkvaraarendus (madal risk)
INSERT INTO ict_providers (user_id, name, country, country_code, service_type, criticality, risk_score, has_exit_strategy, contract_ref, notes)
VALUES (@user_id, 'Helmes AS', 'Eesti', 'EE', 'Tarkvaraarendus', 'standard', 20, true, 'LEP-2024-009',
'Custom tarkvaraarendus ja hooldus. Eesti firma.');

-- Splunk Inc — SIEM/Monitoring
INSERT INTO ict_providers (user_id, name, country, country_code, service_type, criticality, risk_score, has_exit_strategy, contract_ref, notes)
VALUES (@user_id, 'Splunk Inc', 'USA', 'US', 'SIEM / Monitoring', 'important', 30, true, 'LEP-2024-010',
'Logide analüüs, turvaseire, SIEM. USA firma (Cisco omanduses).');


-- 3. Allhankijad (Reg. 2025/532 nõue)

INSERT INTO subcontractors (provider_id, name, country, country_code, service_type, risk_score)
VALUES
-- Onfido allhankijad (UK firma -> USA allhankijad)
((SELECT id FROM ict_providers WHERE name = 'Onfido Ltd' AND user_id = @user_id),
 'AWS', 'USA', 'US', 'Pilveinfrastruktuur', 35),
((SELECT id FROM ict_providers WHERE name = 'Onfido Ltd' AND user_id = @user_id),
 'Jumio', 'USA', 'US', 'Backup ID verification', 35),

-- Tuum allhankijad (EE firma -> EU + UK allhankijad)
((SELECT id FROM ict_providers WHERE name = 'Tuum OÜ' AND user_id = @user_id),
 'AWS', 'Iirimaa', 'IE', 'Hosting', 25),
((SELECT id FROM ict_providers WHERE name = 'Tuum OÜ' AND user_id = @user_id),
 'Finastra', 'Suurbritannia', 'GB', 'Core banking moodulid', 35),

-- Azure allhankijad (IE firma -> NL + USA allhankijad)
((SELECT id FROM ict_providers WHERE name = 'Microsoft Azure (Ireland)' AND user_id = @user_id),
 'Equinix', 'Holland', 'NL', 'Data center', 25),
((SELECT id FROM ict_providers WHERE name = 'Microsoft Azure (Ireland)' AND user_id = @user_id),
 'Akamai', 'USA', 'US', 'CDN', 35),

-- Cloudflare allhankija
((SELECT id FROM ict_providers WHERE name = 'Cloudflare Inc' AND user_id = @user_id),
 'Equinix', 'USA', 'US', 'Data center', 35),

-- China Telecom allhankija
((SELECT id FROM ict_providers WHERE name = 'China Telecom Europe' AND user_id = @user_id),
 'Huawei Marine', 'Hiina', 'CN', 'Merekaabel infrastruktuur', 80);


-- =====================================================
-- DEMO MÄRKMED (mis näidata Pärtelile):
-- =====================================================
--
-- 1. Onfido = PUNANE LIPP (risk 45)
--    - UK firma (kolmas riik pärast Brexitit)
--    - Exit strateegia puudub
--    - Allhankijad: AWS (US, risk 35) + Jumio (US, risk 35)
--    → "Kas teil on Onfido asendusplaan? Veriff on Eesti alternatiiv."
--
-- 2. Tuum = POSITIIVNE NÄIDE (risk 28)
--    - Eesti firma, EU andmeresidentsus
--    - Allhankijad: AWS IE (risk 25) + Finastra UK (risk 35)
--    → "Tuum valik oli DORA vaates väga hea otsus"
--
-- 3. Azure = CTPP staatus (risk 32)
--    - ESA määras kriitiliseks kolmanda osapoole pakkujaks
--    - Allhankijad: Equinix NL (risk 25) + Akamai US (risk 35)
--    → "Kas teate et Azure on nüüd CTPP? See muudab kohustusi"
--
-- 4. Cloudflare (risk 25)
--    - USA firma, CDN/WAF
--    - Allhankija: Equinix US (risk 35)
--
-- 5. China Telecom = KÕRGEIM RISK (risk 75)
--    - Hiina firma — geopoliitiline risk
--    - Allhankija: Huawei Marine (CN, risk 80)
--    → "Hiina telco allhankijate ahel on tõsine mure"
--
-- 6. Nortal, Helmes, Splunk (risk 20-30)
--    - Allhankijaid pole deklareeritud (realistlik)
--    - Mitte kõigil pole allhankijaid
--
-- 7. SUPPLY CHAIN DEPTH
--    - Onfido -> AWS US + Jumio US
--    - Tuum -> AWS IE + Finastra UK
--    - Azure -> Equinix NL + Akamai US
--    - China Telecom -> Huawei Marine CN
--    → "DORA nõuab allhankijate kaardistamist"
--
-- 8. DORA kehtivus Bondorale:
--    - Krediidiandja litsents → DORA Art.2 kohaldub OTSE
--    - Panganduslitsentsi taotlus → veelgi rangem kohaldamine
--    - Finantsinspektsioon on pädev asutus
--    - RoI esitamine ESA-le läbi FI
--    - Trahv: kuni 2% aastakäibest
-- =====================================================
