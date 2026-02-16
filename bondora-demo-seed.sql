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
VALUES (@user_id, 'Cloudflare Inc', 'USA', 'US', 'CDN / WAF', 'important', 18, true, 'LEP-2024-006',
'Veebiliikluse kaitse ja CDN. Kolmanda riigi teenusepakkuja — USA.');


-- 3. Allhankijad (Reg. 2025/532 nõue)

INSERT INTO subcontractors (provider_id, name, country, country_code, service_type, risk_score)
VALUES 
-- Azure allhankijad
((SELECT id FROM ict_providers WHERE name = 'Microsoft Azure (Ireland)' AND user_id = @user_id), 
 'Equinix Dublin', 'Iirimaa', 'IE', 'Colocation', 12),
((SELECT id FROM ict_providers WHERE name = 'Microsoft Azure (Ireland)' AND user_id = @user_id), 
 'Akamai Technologies', 'USA', 'US', 'CDN', 20),

-- AWS allhankijad  
((SELECT id FROM ict_providers WHERE name = 'AWS Europe (Frankfurt)' AND user_id = @user_id),
 'Equinix Frankfurt', 'Saksamaa', 'DE', 'Colocation', 10),

-- Onfido allhankijad
((SELECT id FROM ict_providers WHERE name = 'Onfido Ltd' AND user_id = @user_id),
 'AWS London', 'Suurbritannia', 'GB', 'Cloud Hosting', 25),
((SELECT id FROM ict_providers WHERE name = 'Onfido Ltd' AND user_id = @user_id),
 'Jumio Corp', 'USA', 'US', 'Document Verification', 38);


-- =====================================================
-- DEMO MÄRKMED (mis näidata Pärtelile):
-- =====================================================
--
-- 1. Onfido = PUNANE LIPP
--    - UK firma (kolmas riik pärast Brexitit)  
--    - Exit strateegia puudub
--    - Allhankijad USA-s (Jumio) — topelt kolmanda riigi risk
--    - Risk score 35 — kõrgeim nende vendoritest
--    → "Kas teil on Onfido asendusplaan kui UK regulatsioon muutub?"
--
-- 2. Tuum = POSITIIVNE NÄIDE
--    - Eesti firma, EU andmeresidentsus
--    - Cloud-native, modern stack
--    - Risk score 28 — mõistlik kriitilise teenuse jaoks
--    → "Tuum valik oli DORA vaates väga hea otsus"
--
-- 3. Azure CTPP staatus
--    - ESA määras Microsoft kriitiliseks kolmanda osapoole pakkujaks
--    - Tähendab rangemat järelevalvet ja raporteerimiskohustust
--    → "Kas teate et Azure on nüüd CTPP? See muudab teie kohustusi"
--
-- 4. Allhankijate ahel (Reg. 2025/532)
--    - Onfido → AWS London → ??? (kas veel allhankijaid?)
--    - Azure → Equinix + Akamai
--    → "Regulaator küsib 2026 RoI-s allhankijate kohta"
--
-- 5. DORA kehtivus Bondorale:
--    - Krediidiandja litsents → DORA Art.2 kohaldub OTSE
--    - Panganduslitsentsi taotlus → veelgi rangem kohaldamine
--    - Finantsinspektsioon on pädev asutus
--    - RoI esitamine ESA-le läbi FI
--    - Trahv: kuni 2% aastakäibest
-- =====================================================
