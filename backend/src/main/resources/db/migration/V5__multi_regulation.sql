-- Multi-regulation support: regulations, domains, questions tables
-- Supports DORA, NIS2, EU AI Act

-- Regulations table
CREATE TABLE regulations (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name_en VARCHAR(100) NOT NULL,
    name_et VARCHAR(100) NOT NULL,
    description_en VARCHAR(1000),
    description_et VARCHAR(1000),
    effective_date DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Compliance domains table
CREATE TABLE compliance_domains (
    id VARCHAR(36) PRIMARY KEY,
    regulation_id VARCHAR(36) NOT NULL,
    code VARCHAR(50) NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    name_et VARCHAR(200) NOT NULL,
    description_en VARCHAR(1000),
    description_et VARCHAR(1000),
    display_order INT NOT NULL,
    icon_class VARCHAR(50),
    FOREIGN KEY (regulation_id) REFERENCES regulations(id) ON DELETE CASCADE
);

-- Compliance questions table
CREATE TABLE compliance_questions (
    id VARCHAR(36) PRIMARY KEY,
    domain_id VARCHAR(36) NOT NULL,
    question_en VARCHAR(500) NOT NULL,
    question_et VARCHAR(500) NOT NULL,
    guidance_en VARCHAR(2000),
    guidance_et VARCHAR(2000),
    recommendation_en VARCHAR(500),
    recommendation_et VARCHAR(500),
    article_reference VARCHAR(50),
    weight DOUBLE NOT NULL DEFAULT 1.0,
    display_order INT NOT NULL,
    FOREIGN KEY (domain_id) REFERENCES compliance_domains(id) ON DELETE CASCADE
);

-- Add regulation_code to assessments
ALTER TABLE assessments ADD COLUMN regulation_code VARCHAR(20);

-- Seed DORA regulation
INSERT INTO regulations (id, code, name_en, name_et, description_en, description_et, effective_date, active)
VALUES (
    'dora-001',
    'DORA',
    'Digital Operational Resilience Act',
    'Digitaalse tegevuse vastupidavuse määrus',
    'EU regulation on digital operational resilience for the financial sector, focusing on ICT risk management, incident reporting, resilience testing, and third-party risk management.',
    'EL-i määrus finantssektori digitaalse tegevuse vastupidavuse kohta, keskendudes IKT riskihaldusele, intsidentidest teavitamisele, vastupidavuse testimisele ja kolmandate osapoolte riskihaldusele.',
    '2025-01-17',
    TRUE
);

-- Seed NIS2 regulation
INSERT INTO regulations (id, code, name_en, name_et, description_en, description_et, effective_date, active)
VALUES (
    'nis2-001',
    'NIS2',
    'Network and Information Security Directive 2',
    'Võrgu- ja infosüsteemide turvalisuse direktiiv 2',
    'EU directive on measures for a high common level of cybersecurity across the Union, applicable to essential and important entities across multiple sectors.',
    'EL-i direktiiv meetmete kohta liidu ühtse kõrge küberturvalisuse taseme tagamiseks, kohaldatav olulistele ja tähtsatele üksustele mitmes sektoris.',
    '2024-10-17',
    TRUE
);

-- DORA Domains (based on existing categories)
INSERT INTO compliance_domains (id, regulation_id, code, name_en, name_et, display_order, icon_class) VALUES
('dora-dom-001', 'dora-001', 'SERVICE_LEVEL', 'Service Level', 'Teenustase', 1, 'service'),
('dora-dom-002', 'dora-001', 'EXIT_STRATEGY', 'Exit Strategy', 'Väljumisstrateegia', 2, 'exit'),
('dora-dom-003', 'dora-001', 'AUDIT', 'Audit Rights', 'Auditeerimisõigused', 3, 'audit'),
('dora-dom-004', 'dora-001', 'INCIDENT', 'Incident Notification', 'Intsidentidest teavitamine', 4, 'incident'),
('dora-dom-005', 'dora-001', 'DATA', 'Data Location', 'Andmete asukoht', 5, 'data'),
('dora-dom-006', 'dora-001', 'SUBCONTRACTING', 'Subcontracting', 'Allhange', 6, 'subcontract'),
('dora-dom-007', 'dora-001', 'RISK', 'Risk Management', 'Riskihaldus', 7, 'risk'),
('dora-dom-008', 'dora-001', 'LEGAL', 'Legal Terms', 'Juriidilised tingimused', 8, 'legal'),
('dora-dom-009', 'dora-001', 'CONTINUITY', 'Business Continuity', 'Äritegevuse jätkuvus', 9, 'continuity'),
('dora-dom-010', 'dora-001', 'ICT_RISK_MANAGEMENT', 'ICT Risk Management', 'IKT riskihaldus', 10, 'ict-risk'),
('dora-dom-011', 'dora-001', 'INCIDENT_MANAGEMENT', 'Incident Management', 'Intsidentide haldus', 11, 'incident-mgmt'),
('dora-dom-012', 'dora-001', 'TESTING', 'Resilience Testing', 'Vastupidavuse testimine', 12, 'testing'),
('dora-dom-013', 'dora-001', 'INFORMATION_SHARING', 'Information Sharing', 'Teabe jagamine', 13, 'sharing');

-- NIS2 Domains (based on Article 21)
INSERT INTO compliance_domains (id, regulation_id, code, name_en, name_et, display_order, icon_class) VALUES
('nis2-dom-001', 'nis2-001', 'RISK_POLICIES', 'Risk Analysis & Security Policies', 'Riskianalüüs ja turvapoliitikad', 1, 'policy'),
('nis2-dom-002', 'nis2-001', 'INCIDENT_HANDLING', 'Incident Handling', 'Intsidentide käsitlemine', 2, 'incident'),
('nis2-dom-003', 'nis2-001', 'BUSINESS_CONTINUITY', 'Business Continuity', 'Äritegevuse jätkuvus', 3, 'continuity'),
('nis2-dom-004', 'nis2-001', 'SUPPLY_CHAIN', 'Supply Chain Security', 'Tarneahela turvalisus', 4, 'supply'),
('nis2-dom-005', 'nis2-001', 'NETWORK_SECURITY', 'Network & System Security', 'Võrgu- ja süsteemiturvalisus', 5, 'network'),
('nis2-dom-006', 'nis2-001', 'VULNERABILITY_MGMT', 'Vulnerability Management', 'Haavatavuste haldus', 6, 'vulnerability'),
('nis2-dom-007', 'nis2-001', 'SECURITY_ASSESSMENT', 'Security Assessment', 'Turvalisuse hindamine', 7, 'assessment'),
('nis2-dom-008', 'nis2-001', 'CRYPTOGRAPHY', 'Cryptography & Encryption', 'Krüptograafia ja krüpteerimine', 8, 'crypto'),
('nis2-dom-009', 'nis2-001', 'HR_SECURITY', 'Human Resources Security', 'Personaliturvalisus', 9, 'hr'),
('nis2-dom-010', 'nis2-001', 'ACCESS_CONTROL', 'Access Control & MFA', 'Juurdepääsukontroll ja MFA', 10, 'access');

-- DORA Questions (migrated from hardcoded QuestionService)
-- Service Level domain
INSERT INTO compliance_questions (id, domain_id, question_en, question_et, guidance_en, guidance_et, recommendation_en, recommendation_et, article_reference, weight, display_order) VALUES
('dora-q-001', 'dora-dom-001', 'Does the contract define the scope and quality of the ICT service?', 'Kas leping määratleb ICT teenuse ulatuse ja kvaliteedi?', 'DORA requires ICT contracts to include a clear description of the service, including scope, quality, and service levels. This ensures both parties understand their obligations.', 'DORA nõuab, et ICT lepingud sisaldaksid selget teenuse kirjeldust, sh ulatust, kvaliteeti ja teenustasemeid. See tagab, et mõlemad pooled mõistavad kohustusi.', 'Add a detailed service description with quality requirements to the contract.', 'Lisage lepingusse detailne teenuse kirjeldus koos kvaliteedinõuetega.', 'DORA Art. 30(2)(a)', 1.0, 1),
('dora-q-002', 'dora-dom-001', 'Are there service levels (SLA) with measurable KPIs?', 'Kas on teenustasemed (SLA) mõõdetavate KPI-dega?', 'Measurable KPIs are necessary for monitoring service quality and verifying contract compliance. Without them, there is no objective basis for evaluating the service.', 'Mõõdetavad KPI-d on vajalikud teenuse kvaliteedi jälgimiseks ja lepingu täitmise kontrollimiseks. Ilma nendeta puudub objektiivne alus teenuse hindamiseks.', 'Define specific KPIs such as availability (%), response time, and resolution time.', 'Määratlege konkreetsed KPI-d nagu kättesaadavus (%), reageerimisaeg ja lahendusaeg.', 'DORA Art. 30(2)(a)', 1.0, 2);

-- Incident domain
INSERT INTO compliance_questions (id, domain_id, question_en, question_et, guidance_en, guidance_et, recommendation_en, recommendation_et, article_reference, weight, display_order) VALUES
('dora-q-003', 'dora-dom-004', 'Does the provider notify about incidents within 24 hours?', 'Kas teenusepakkuja teavitab intsidentidest 24h jooksul?', 'Prompt incident notification is critical for the financial institution to respond in a timely manner and meet its reporting obligations to supervisory authorities.', 'Kiire intsidentidest teavitamine on kriitilise tähtsusega, et finantsasutus saaks õigeaegselt reageerida ja täita oma teavituskohustusi järelevalveasutuste ees.', 'Include incident notification procedures with time limits in the contract.', 'Lisage lepingusse intsidentidest teavitamise kord koos ajaliste piirangutega.', 'DORA Art. 30(2)(e)', 1.0, 1);

-- Audit domain
INSERT INTO compliance_questions (id, domain_id, question_en, question_et, guidance_en, guidance_et, recommendation_en, recommendation_et, article_reference, weight, display_order) VALUES
('dora-q-004', 'dora-dom-003', 'Does the contract include an audit right clause?', 'Kas lepingus on auditeerimisõiguse klausel?', 'Audit rights allow the financial institution and supervisory authorities to verify provider activities, security measures, and contract compliance.', 'Auditeerimisõigus võimaldab finantsasutusel ja järelevalveasutustel kontrollida teenusepakkuja tegevust, turvameetmeid ja lepingu täitmist.', 'Add a clause granting the right to audit the provider, including on-site inspections.', 'Lisage klausel, mis annab õiguse auditeerida teenusepakkujat, sh kohapealsed kontrollid.', 'DORA Art. 30(2)(d)', 1.0, 1),
('dora-q-014', 'dora-dom-003', 'Is there cooperation with financial supervisory authorities?', 'Kas on koostöö finantsjärelevalvega?', 'The provider must be prepared to cooperate with financial supervisory authorities, including allowing access and audits.', 'Teenusepakkuja peab olema valmis tegema koostööd finantsjärelevalve asutustega, sh võimaldama juurdepääsu ja auditeid.', 'Add a clause on provider obligation to cooperate with supervisory authorities.', 'Lisage klausel teenusepakkuja kohustusest teha koostööd järelevalveasutustega.', 'DORA Art. 30(2)(d)', 1.0, 2);

-- Exit Strategy domain
INSERT INTO compliance_questions (id, domain_id, question_en, question_et, guidance_en, guidance_et, recommendation_en, recommendation_et, article_reference, weight, display_order) VALUES
('dora-q-005', 'dora-dom-002', 'Is there an exit strategy for contract termination?', 'Kas on exit-strateegia lepingu lõppemisel?', 'An exit strategy ensures smooth transition to another provider or in-house solution, avoiding service interruptions and data loss.', 'Exit-strateegia tagab teenuse sujuva ülemineku teisele pakkujale või in-house lahendusele, vältides teenuse katkestusi ja andmete kaotust.', 'Prepare a detailed exit plan with timeline, data migration, and transition period.', 'Koostage detailne exit-plaan koos ajakava, andmete migratsiooni ja üleminekuperioodiga.', 'DORA Art. 30(2)(f)', 1.0, 1),
('dora-q-008', 'dora-dom-002', 'Is there a data return clause?', 'Kas on andmete tagastamise klausel?', 'A data return clause ensures that upon contract termination, the financial institution receives all its data back in a secure and usable format.', 'Andmete tagastamise klausel tagab, et lepingu lõppemisel saab finantsasutus kõik oma andmed tagasi turvalises ja kasutatavas formaadis.', 'Define data return format, timeline, and deletion procedures upon contract termination.', 'Määratlege andmete tagastamise formaat, ajakava ja kustutamise kord lepingu lõppemisel.', 'DORA Art. 30(2)(f)', 1.0, 2),
('dora-q-015', 'dora-dom-002', 'Is there a provider insolvency clause?', 'Kas on teenusepakkuja maksejõuetuse klausel?', 'An insolvency clause protects the financial institution when the provider becomes insolvent, ensuring service continuity and data availability.', 'Maksejõuetuse klausel kaitseb finantsasutust olukorras, kus teenusepakkuja muutub maksejõuetuks, tagades teenuse jätkuvuse ja andmete kättesaadavuse.', 'Add provisions for service continuity and data return in case of provider insolvency.', 'Lisage lepingusse sätted teenuse jätkuvuse ja andmete tagastamise kohta pakkuja maksejõuetuse korral.', 'DORA Art. 30(2)(f)', 1.0, 3);

-- Data domain
INSERT INTO compliance_questions (id, domain_id, question_en, question_et, guidance_en, guidance_et, recommendation_en, recommendation_et, article_reference, weight, display_order) VALUES
('dora-q-006', 'dora-dom-005', 'Is the data location defined (EU/non-EU)?', 'Kas andmete asukoht on määratletud (EL/mitte-EL)?', 'Knowing data location is important for data protection, sovereignty, and regulatory compliance. Non-EU locations may pose additional risks.', 'Andmete asukoha teadmine on oluline andmekaitse, suveräänsuse ja regulatiivsete nõuete täitmise seisukohalt. EL-välised asukohad võivad tekitada täiendavaid riske.', 'Specify data processing and storage locations and restrictions in the contract.', 'Fikseerige lepingus andmete töötlemise ja hoiustamise asukohad ning piirangud.', 'DORA Art. 30(2)(b)', 1.0, 1);

-- Subcontracting domain
INSERT INTO compliance_questions (id, domain_id, question_en, question_et, guidance_en, guidance_et, recommendation_en, recommendation_et, article_reference, weight, display_order) VALUES
('dora-q-007', 'dora-dom-006', 'Does the use of subcontractors require consent?', 'Kas subkontraktorite kasutamine nõuab nõusolekut?', 'Uncontrolled use of subcontractors increases supply chain risks. The financial institution must have visibility and control over subcontractors.', 'Subkontraktorite kontrollimatu kasutamine suurendab tarneahela riske. Finantsasutusel peab olema ülevaade ja kontroll allhankijate üle.', 'Require prior written consent for engaging subcontractors in the contract.', 'Nõudke lepingus eelnevat kirjalikku nõusolekut subkontraktorite kaasamiseks.', 'DORA Art. 30(2)(a)', 1.0, 1);

-- Risk domain
INSERT INTO compliance_questions (id, domain_id, question_en, question_et, guidance_en, guidance_et, recommendation_en, recommendation_et, article_reference, weight, display_order) VALUES
('dora-q-009', 'dora-dom-007', 'Does the provider follow cybersecurity standards?', 'Kas teenusepakkuja järgib küberturvalisuse standardeid?', 'Adherence to cybersecurity standards (e.g., ISO 27001, SOC 2) provides assurance that the provider implements adequate security measures.', 'Küberturvalisuse standardite järgimine (nt ISO 27001, SOC 2) annab kindluse, et teenusepakkuja rakendab piisavaid turvameetmeid.', 'Require recognized security standard certifications and regular compliance verification.', 'Nõudke tunnustatud turvastandardite sertifikaate ja regulaarset vastavuse tõendamist.', 'DORA Art. 30(2)(c)', 1.0, 1),
('dora-q-013', 'dora-dom-007', 'Are regular security tests conducted?', 'Kas tehakse regulaarseid turvateste?', 'Regular security tests (penetration tests, vulnerability scans) are necessary to assess security levels and identify weaknesses.', 'Regulaarsed turvatestid (penetratsioonitestid, haavatavuste skaneerimine) on vajalikud turvalisuse taseme hindamiseks ja nõrkuste tuvastamiseks.', 'Require at least annual penetration tests and quarterly vulnerability scans.', 'Nõudke vähemalt iga-aastaseid penetratsiooniteste ja kvartaalseid haavatavuste skaneerimisi.', 'DORA Art. 30(2)(c)', 1.0, 2);

-- Continuity domain
INSERT INTO compliance_questions (id, domain_id, question_en, question_et, guidance_en, guidance_et, recommendation_en, recommendation_et, article_reference, weight, display_order) VALUES
('dora-q-010', 'dora-dom-009', 'Are there disaster recovery requirements?', 'Kas on disaster recovery nõuded?', 'A disaster recovery plan ensures service restoration during crisis situations. DORA requires recovery plans for critical ICT services.', 'Disaster recovery plaan tagab teenuse taastamise kriisiolukordades. DORA nõuab, et kriitiliste ICT teenuste jaoks oleks olemas taasteplaan.', 'Add RTO/RPO requirements and regular recovery tests to the contract.', 'Lisage lepingusse RTO/RPO nõuded ja regulaarsed taastamistestid.', 'DORA Art. 30(2)(c)', 1.0, 1);

-- Legal domain
INSERT INTO compliance_questions (id, domain_id, question_en, question_et, guidance_en, guidance_et, recommendation_en, recommendation_et, article_reference, weight, display_order) VALUES
('dora-q-011', 'dora-dom-008', 'Is there a confidentiality obligation?', 'Kas on konfidentsiaalsuskohustus?', 'A confidentiality obligation protects the financial institution sensitive information and customer data from unauthorized disclosure.', 'Konfidentsiaalsuskohustus kaitseb finantsasutuse tundlikku teavet ja kliendiandmeid volitamata avaldamise eest.', 'Add a confidentiality clause that remains in effect after contract termination.', 'Lisage lepingusse konfidentsiaalsusklausel, mis kehtib ka pärast lepingu lõppemist.', 'DORA Art. 30(2)(b)', 1.0, 1),
('dora-q-012', 'dora-dom-008', 'Are liability limits defined?', 'Kas vastutuse piirid on määratud?', 'Clear definition of liability limits protects the financial institution from excessive risks and ensures the provider is responsible for breach of obligations.', 'Vastutuse piiride selge määratlemine kaitseb finantsasutust ülemääraste riskide eest ja tagab, et teenusepakkuja kannab vastutust oma kohustuste rikkumise eest.', 'Define upper and lower liability limits and allocation of liability between parties.', 'Määratlege vastutuse ülem- ja alampiirid ning vastutuse jaotus poolte vahel.', 'DORA Art. 30(2)(a)', 1.0, 2);

-- ICT Risk Management domain
INSERT INTO compliance_questions (id, domain_id, question_en, question_et, guidance_en, guidance_et, recommendation_en, recommendation_et, article_reference, weight, display_order) VALUES
('dora-q-023', 'dora-dom-010', 'Is there an ICT risk management framework in place?', 'Kas on kehtestatud ICT riskihalduse raamistik?', 'DORA requires financial institutions to have a comprehensive ICT risk management framework covering strategies, policies, procedures, and tools for digital operational resilience.', 'DORA nõuab finantsasutustelt põhjalikku ICT riskihalduse raamistikku, mis hõlmab strateegiaid, poliitikaid, protseduure ja tööriistu digitaalse tegevuse vastupidavuse tagamiseks.', 'Establish a documented ICT risk management framework including risk identification, assessment, mitigation, and monitoring.', 'Kehtestage dokumenteeritud ICT riskihalduse raamistik, mis sisaldab riskide tuvastamist, hindamist, maandamist ja jälgimist.', 'DORA Art. 6(1)', 1.0, 1),
('dora-q-024', 'dora-dom-010', 'Are ICT systems and assets mapped and classified?', 'Kas ICT süsteemid ja varad on kaardistatud ja klassifitseeritud?', 'Financial institutions must identify, classify, and document all ICT assets, including hardware, software, data, and services, and their interdependencies.', 'Finantsasutused peavad tuvastama, klassifitseerima ja dokumenteerima kõik ICT varad, sealhulgas riistvara, tarkvara, andmed ja teenused ning nende omavahelised seosed.', 'Create and maintain an up-to-date ICT asset register with criticality classification.', 'Looge ja hoidke ajakohasena ICT varade register koos kriitilisuse klassifikatsiooniga.', 'DORA Art. 8(1)', 1.0, 2),
('dora-q-025', 'dora-dom-010', 'Is there an ICT business continuity policy?', 'Kas on olemas ICT ärijätkuvuse poliitika?', 'DORA requires an ICT business continuity policy ensuring critical functions operate during disruptions, including recovery plans and crisis management procedures.', 'DORA nõuab ICT ärijätkuvuse poliitikat, mis tagab kriitiliste funktsioonide toimimise häirete korral, sealhulgas taastamiskavad ja kriisijuhtimise protseduurid.', 'Develop an ICT business continuity policy with RTO/RPO targets and test it at least annually.', 'Koostage ICT ärijätkuvuse poliitika koos RTO/RPO eesmärkidega ja testige seda vähemalt kord aastas.', 'DORA Art. 11(1)', 1.0, 3),
('dora-q-026', 'dora-dom-010', 'Is there an ICT security policy and access control?', 'Kas on ICT turvalisuse poliitika ja juurdepääsukontroll?', 'Financial institutions must establish an ICT security policy covering access control, encryption, network security, and data protection.', 'Finantsasutused peavad kehtestama ICT turvalisuse poliitika, mis hõlmab juurdepääsukontrolli, krüpteerimist, võrguturvalisust ja andmekaitset.', 'Implement least privilege principle, multi-factor authentication, and regular access rights review.', 'Rakendage vähimõiguse põhimõtet, mitmefaktorilist autentimist ja regulaarset juurdepääsuõiguste ülevaatust.', 'DORA Art. 9(1)', 1.0, 4);

-- Incident Management domain
INSERT INTO compliance_questions (id, domain_id, question_en, question_et, guidance_en, guidance_et, recommendation_en, recommendation_et, article_reference, weight, display_order) VALUES
('dora-q-027', 'dora-dom-011', 'Is there an ICT incident classification process?', 'Kas on ICT intsidentide klassifitseerimise protsess?', 'DORA requires classifying ICT incidents by severity using criteria such as affected client count, duration, geographic scope, and data loss.', 'DORA nõuab ICT intsidentide klassifitseerimist raskusastme järgi, kasutades kriteeriume nagu mõjutatud klientide arv, kestus, geograafiline ulatus ja andmekadu.', 'Establish an incident classification matrix with automatic escalation rules.', 'Kehtestage intsidentide klassifitseerimise maatriks koos automaatse eskalatsiooni reeglitega.', 'DORA Art. 18(1)', 1.0, 1),
('dora-q-028', 'dora-dom-011', 'Is there a major ICT incident notification process?', 'Kas on oluliste ICT intsidentide teavitamise protsess?', 'Financial institutions must notify the competent authority of major ICT incidents within prescribed time, providing initial, interim, and final reports.', 'Finantsasutused peavad teavitama pädevat asutust olulistest ICT intsidentidest ettenähtud aja jooksul, esitades esialgse, vahe- ja lõpparuande.', 'Automate incident notification: initial notice within 4h, interim report within 72h, final report within 1 month.', 'Automatiseerige intsidentide teavitamise protsess: esialgne teade 4h jooksul, vahearuanne 72h jooksul, lõpparuanne 1 kuu jooksul.', 'DORA Art. 19(1)', 1.0, 2),
('dora-q-029', 'dora-dom-011', 'Are lessons learned from incidents and improvements applied?', 'Kas intsidentidest õpitakse ja rakendatakse parandusi?', 'After each major ICT incident, root cause analysis must be conducted and corrective measures implemented to prevent recurrence.', 'Pärast iga olulist ICT intsidenti tuleb läbi viia juurpõhjuse analüüs ja rakendada parandavad meetmed kordumise vältimiseks.', 'Establish a post-mortem process including root cause analysis, corrective action plan, and implementation tracking.', 'Kehtestage post-mortem protsess, mis hõlmab juurpõhjuse analüüsi, parandavate meetmete plaani ja nende elluviimise jälgimist.', 'DORA Art. 13(1)', 1.0, 3),
('dora-q-030', 'dora-dom-011', 'Is there a cyber threat detection and response capability?', 'Kas on küberrünnakute tuvastamise ja reageerimise võimekus?', 'DORA requires mechanisms for detecting unusual activities in ICT systems, including automated monitoring, log analysis, and anomaly detection.', 'DORA nõuab mehhanisme ebatavaliste tegevuste tuvastamiseks ICT süsteemides, sealhulgas automaatset jälgimist, logide analüüsi ja anomaaliate tuvastamist.', 'Implement SIEM solution, 24/7 monitoring, and automated alerting for critical events.', 'Rakendage SIEM-lahendus, 24/7 monitooring ja automatiseeritud häiresüsteem kriitiliste sündmuste jaoks.', 'DORA Art. 10(1)', 1.0, 4);

-- Testing domain
INSERT INTO compliance_questions (id, domain_id, question_en, question_et, guidance_en, guidance_et, recommendation_en, recommendation_et, article_reference, weight, display_order) VALUES
('dora-q-031', 'dora-dom-012', 'Are regular ICT security tests conducted?', 'Kas viiakse läbi regulaarseid ICT turvalisuse teste?', 'DORA requires an ICT security testing program including vulnerability scanning, open source software analysis, network security assessment, and penetration tests.', 'DORA nõuab ICT turvalisuse testimise programmi, mis hõlmab haavatavuste skaneerimist, avatud lähtekoodiga tarkvara analüüsi, võrguturvalisuse hindamist ja penetratsiooniteste.', 'Create an annual testing plan: quarterly vulnerability scans, annual penetration tests, and continuous code security analysis.', 'Koostage iga-aastane testimiskava: kvartaalsed haavatavuste skaneeringud, iga-aastased penetratsioonitestid ja pidev koodi turvaanalüüs.', 'DORA Art. 24(1)', 1.0, 1),
('dora-q-032', 'dora-dom-012', 'Are TLPT (Threat-Led Penetration Tests) conducted for critical ICT systems?', 'Kas kriitiliste ICT süsteemide jaoks tehakse TLPT teste?', 'Significant financial institutions must undergo threat-led penetration testing (TLPT) at least every 3 years using TIBER-EU or equivalent frameworks.', 'Olulised finantsasutused peavad läbima ohupõhise penetratsioonitestimise (TLPT) vähemalt iga 3 aasta järel, kasutades TIBER-EU või samaväärseid raamistikke.', 'Plan TLPT testing in coordination with competent authorities. Engage independent Red Team testing providers.', 'Planeerige TLPT testimine kooskõlas pädevate asutustega. Kaasake sõltumatud Red Team testimise teenusepakkujad.', 'DORA Art. 26(1)', 1.0, 2),
('dora-q-033', 'dora-dom-012', 'Are test results documented and deficiencies remediated?', 'Kas testimise tulemused dokumenteeritakse ja puudused kõrvaldatakse?', 'All ICT security test results must be documented, deficiencies classified by risk level, and remediation plan with deadlines prepared.', 'Kõigi ICT turvalisuse testide tulemused tuleb dokumenteerida, puudused klassifitseerida riskitaseme järgi ja koostada paranduskava koos tähtaegadega.', 'Implement vulnerability remediation SLA: critical 24h, high 7 days, medium 30 days.', 'Rakendage leitud haavatavuste parandamise SLA: kriitilised 24h, kõrged 7 päeva, keskmised 30 päeva.', 'DORA Art. 24(5)', 1.0, 3),
('dora-q-034', 'dora-dom-012', 'Are ICT business continuity plans tested regularly?', 'Kas ICT ärijätkuvuse plaane testitakse regulaarselt?', 'ICT business continuity and recovery plans must be tested at least annually and after significant changes to ICT systems.', 'ICT ärijätkuvuse ja taastamise plaane tuleb testida vähemalt kord aastas ning pärast olulisi muudatusi ICT süsteemides.', 'Conduct annual business continuity exercises including failover tests, data recovery tests, and crisis communication drills.', 'Viige läbi iga-aastased ärijätkuvuse harjutused, sh failover-testid, andmete taastamise testid ja kriisikommunikatsiooni harjutused.', 'DORA Art. 11(6)', 1.0, 4);

-- Information Sharing domain
INSERT INTO compliance_questions (id, domain_id, question_en, question_et, guidance_en, guidance_et, recommendation_en, recommendation_et, article_reference, weight, display_order) VALUES
('dora-q-035', 'dora-dom-013', 'Does the financial entity participate in a cyber threat intelligence sharing community?', 'Kas finantsasutus osaleb küberohuteavet jagavas kogukonnas?', 'DORA encourages financial institutions to participate in cyber threat intelligence sharing communities to exchange information about threats, vulnerabilities, indicators of compromise, and attack techniques.', 'DORA julgustab finantsasutusi osalema küberohuteavet jagavates kogukondades, et vahetada teavet küberohtude, haavatavuste, kompromissinäitajate ja ründetehnikate kohta.', 'Join a sector-specific ISAC (Information Sharing and Analysis Center) or equivalent cooperation forum.', 'Liituge valdkondliku ISAC-ga (Information Sharing and Analysis Center) või samaväärsete koostöövormidega.', 'DORA Art. 45(1)', 1.0, 1),
('dora-q-036', 'dora-dom-013', 'Is there a process for receiving and using cyber threat intelligence?', 'Kas on protsess küberohu teabe vastuvõtmiseks ja kasutamiseks?', 'Received cyber threat intelligence must be analyzed, validated, and integrated into own ICT risk management processes to improve defenses and response speed.', 'Saadud küberohuteavet tuleb analüüsida, valideerida ja integreerida oma ICT riskihalduse protsessidesse, et parandada kaitsemeetmeid ja reageerimiskiirust.', 'Establish a threat intelligence processing workflow: reception, validation, enrichment, distribution, and application to defenses.', 'Kehtestage ohuteabe töötlemise protsess: vastuvõtt, valideerimine, rikastamine, levitamine ja rakendamine kaitsemeetmetesse.', 'DORA Art. 45(2)', 1.0, 2),
('dora-q-037', 'dora-dom-013', 'Is significant incident information shared with other financial entities?', 'Kas jagatakse olulist intsidendi teavet teiste finantsasutustega?', 'Sharing anonymized incident information helps the entire financial sector better prepare for similar attacks and strengthen collective defense.', 'Anonümiseeritud intsidendi teabe jagamine aitab kogu finantssektoril paremini valmistuda sarnasteks rünnakuteks ja tugevdada kollektiivset kaitset.', 'Participate regularly in sector-specific incident sharing meetings and contribute to anonymized incident databases.', 'Osalege regulaarselt sektoripõhistel intsidendi jagamise kohtumistel ja panustage anonümiseeritud juhtumite andmebaasidesse.', 'DORA Art. 45(3)', 1.0, 3);

-- NIS2 Sample Questions (Article 21 based)
-- Risk Policies domain
INSERT INTO compliance_questions (id, domain_id, question_en, question_et, guidance_en, guidance_et, recommendation_en, recommendation_et, article_reference, weight, display_order) VALUES
('nis2-q-001', 'nis2-dom-001', 'Has the organization established a comprehensive information security risk analysis process?', 'Kas organisatsioon on kehtestanud põhjaliku infoturberiski analüüsi protsessi?', 'NIS2 requires entities to implement risk analysis and information system security policies as the foundation of their cybersecurity measures.', 'NIS2 nõuab, et üksused rakendaksid riskianalüüsi ja infosüsteemide turvapoliitikat oma küberturvalisuse meetmete alusena.', 'Implement a formal risk assessment methodology covering all critical assets and review it annually.', 'Rakendage formaalne riskihindamise metoodika, mis hõlmab kõiki kriitilisi varasid, ja vaadake see üle igal aastal.', 'NIS2 Art. 21(2)(a)', 1.0, 1),
('nis2-q-002', 'nis2-dom-001', 'Are information security policies documented and approved by management?', 'Kas infoturbe poliitikad on dokumenteeritud ja juhtkonna poolt kinnitatud?', 'Security policies must be formally documented, approved by senior management, and communicated to all relevant staff.', 'Turvapoliitikad peavad olema formaalselt dokumenteeritud, tippjuhtkonna poolt kinnitatud ja kõigile asjaomastele töötajatele edastatud.', 'Create a comprehensive security policy framework with clear ownership and regular review cycles.', 'Looge põhjalik turvapoliitikate raamistik selge vastutusega ja regulaarsete ülevaatustsüklitega.', 'NIS2 Art. 21(2)(a)', 1.0, 2);

-- Incident Handling domain
INSERT INTO compliance_questions (id, domain_id, question_en, question_et, guidance_en, guidance_et, recommendation_en, recommendation_et, article_reference, weight, display_order) VALUES
('nis2-q-003', 'nis2-dom-002', 'Is there a documented incident handling procedure?', 'Kas on olemas dokumenteeritud intsidentide käsitlemise protseduur?', 'NIS2 requires entities to have procedures for detecting, managing, and recovering from security incidents.', 'NIS2 nõuab, et üksustel oleksid protseduurid turvaintsidentide avastamiseks, haldamiseks ja taastumiseks.', 'Establish an incident response plan with clear roles, escalation paths, and communication templates.', 'Kehtestage intsidentidele reageerimise plaan selgete rollide, eskalatsiooniradade ja kommunikatsioonimallidega.', 'NIS2 Art. 21(2)(b)', 1.0, 1),
('nis2-q-004', 'nis2-dom-002', 'Can you notify CERT-EE of significant incidents within 24 hours?', 'Kas suudate teavitada CERT-EE-d olulistest intsidentidest 24 tunni jooksul?', 'Significant incidents must be reported to the national CSIRT within 24 hours of detection, with follow-up reports within 72 hours and 1 month.', 'Olulistest intsidentidest tuleb teavitada riiklikku CSIRT-i 24 tunni jooksul pärast avastamist, järelaruanded 72 tunni ja 1 kuu jooksul.', 'Implement automated incident detection and establish direct communication channels with CERT-EE.', 'Rakendage automaatne intsidentide tuvastamine ja looge otsesed suhtluskanalid CERT-EE-ga.', 'NIS2 Art. 23', 1.0, 2);

-- Business Continuity domain
INSERT INTO compliance_questions (id, domain_id, question_en, question_et, guidance_en, guidance_et, recommendation_en, recommendation_et, article_reference, weight, display_order) VALUES
('nis2-q-005', 'nis2-dom-003', 'Is there a business continuity plan covering critical services?', 'Kas on olemas äritegevuse jätkuvuse plaan kriitiliste teenuste jaoks?', 'NIS2 requires business continuity measures including backup management and disaster recovery capabilities.', 'NIS2 nõuab äritegevuse jätkuvuse meetmeid, sealhulgas varundamise haldust ja avariitaaste võimekust.', 'Develop and test BCP covering all essential services with defined RTO/RPO targets.', 'Töötage välja ja testige BCP, mis hõlmab kõiki olulisi teenuseid määratletud RTO/RPO eesmärkidega.', 'NIS2 Art. 21(2)(c)', 1.0, 1),
('nis2-q-006', 'nis2-dom-003', 'Are critical systems backed up regularly with tested recovery procedures?', 'Kas kriitilisi süsteeme varundatakse regulaarselt testitud taastamisprotseduuridega?', 'Backup procedures must ensure data can be recovered within acceptable timeframes, with regular testing of recovery capabilities.', 'Varundamisprotseduurid peavad tagama andmete taastamise vastuvõetavate tähtaegade jooksul, regulaarse taastamisvõimekuse testimisega.', 'Implement 3-2-1 backup strategy with quarterly recovery testing.', 'Rakendage 3-2-1 varundusstrateegia kvartaalse taastamistestimisega.', 'NIS2 Art. 21(2)(c)', 1.0, 2);

-- Supply Chain domain
INSERT INTO compliance_questions (id, domain_id, question_en, question_et, guidance_en, guidance_et, recommendation_en, recommendation_et, article_reference, weight, display_order) VALUES
('nis2-q-007', 'nis2-dom-004', 'Is there a process to assess cybersecurity risks in the supply chain?', 'Kas on olemas protsess tarneahela küberturberiskide hindamiseks?', 'NIS2 requires supply chain security measures, including assessment of suppliers and service providers for security risks.', 'NIS2 nõuab tarneahela turvameetmeid, sealhulgas tarnijate ja teenusepakkujate turvariskide hindamist.', 'Implement vendor risk assessment for all critical suppliers with security requirements in contracts.', 'Rakendage hankija riskihindamine kõigile kriitilistele tarnijatele koos turvanõuetega lepingutes.', 'NIS2 Art. 21(2)(d)', 1.0, 1),
('nis2-q-008', 'nis2-dom-004', 'Are security requirements included in contracts with suppliers?', 'Kas turvanõuded on lisatud tarnijatega sõlmitud lepingutesse?', 'Contracts with suppliers must include cybersecurity requirements, incident notification obligations, and audit rights.', 'Tarnijatega sõlmitud lepingud peavad sisaldama küberturvanõudeid, intsidentidest teavitamise kohustusi ja auditeerimisõigusi.', 'Develop standard security clauses for all supplier contracts with regular compliance verification.', 'Töötage välja standardsed turvaklauslid kõigile tarnijalepingutele regulaarse vastavuse kontrollimisega.', 'NIS2 Art. 21(2)(d)', 1.0, 2);

-- Network Security domain
INSERT INTO compliance_questions (id, domain_id, question_en, question_et, guidance_en, guidance_et, recommendation_en, recommendation_et, article_reference, weight, display_order) VALUES
('nis2-q-009', 'nis2-dom-005', 'Is the network segmented to protect critical systems?', 'Kas võrk on segmenteeritud kriitiliste süsteemide kaitseks?', 'Network segmentation limits the impact of security breaches and protects critical systems from lateral movement by attackers.', 'Võrgu segmenteerimine piirab turvarikkumiste mõju ja kaitseb kriitilisi süsteeme ründajate külgsuunalise liikumise eest.', 'Implement network segmentation with zero-trust principles for critical assets.', 'Rakendage võrgu segmenteerimine null-usalduse põhimõtetega kriitiliste varade jaoks.', 'NIS2 Art. 21(2)(e)', 1.0, 1),
('nis2-q-010', 'nis2-dom-005', 'Are network security measures (firewalls, IDS/IPS) in place and maintained?', 'Kas võrguturbe meetmed (tulemüürid, IDS/IPS) on paigas ja hooldatud?', 'Network security infrastructure must be properly configured, monitored, and regularly updated to protect against threats.', 'Võrguturbe infrastruktuur peab olema korrektselt seadistatud, jälgitud ja regulaarselt uuendatud ohtude vastu kaitseks.', 'Deploy next-generation firewalls with IDS/IPS and conduct regular security reviews.', 'Juurutage järgmise põlvkonna tulemüürid IDS/IPS-iga ja viige läbi regulaarsed turvaülevaatused.', 'NIS2 Art. 21(2)(e)', 1.0, 2);

-- Vulnerability Management domain
INSERT INTO compliance_questions (id, domain_id, question_en, question_et, guidance_en, guidance_et, recommendation_en, recommendation_et, article_reference, weight, display_order) VALUES
('nis2-q-011', 'nis2-dom-006', 'Is there a vulnerability disclosure and handling process?', 'Kas on olemas haavatavuste avalikustamise ja käsitlemise protsess?', 'NIS2 requires policies for handling and disclosing vulnerabilities, including coordination with vendors and security researchers.', 'NIS2 nõuab poliitikat haavatavuste käsitlemiseks ja avalikustamiseks, sealhulgas kooskõlastamist müüjate ja turvauurijatega.', 'Establish a vulnerability disclosure policy and patch management process with defined SLAs.', 'Kehtestage haavatavuste avalikustamise poliitika ja paikade halduse protsess määratletud SLA-dega.', 'NIS2 Art. 21(2)(f)', 1.0, 1),
('nis2-q-012', 'nis2-dom-006', 'Are systems regularly scanned for vulnerabilities and patched?', 'Kas süsteeme skaneeritakse regulaarselt haavatavuste suhtes ja paigaldatakse paigad?', 'Regular vulnerability scanning and timely patching are essential to maintain security posture and reduce attack surface.', 'Regulaarne haavatavuste skaneerimine ja õigeaegne paikade paigaldamine on olulised turvahoiaku säilitamiseks ja ründepinna vähendamiseks.', 'Implement automated vulnerability scanning with critical patches applied within 48 hours.', 'Rakendage automaatne haavatavuste skaneerimine kriitiliste paikade paigaldamisega 48 tunni jooksul.', 'NIS2 Art. 21(2)(f)', 1.0, 2);

-- Security Assessment domain
INSERT INTO compliance_questions (id, domain_id, question_en, question_et, guidance_en, guidance_et, recommendation_en, recommendation_et, article_reference, weight, display_order) VALUES
('nis2-q-013', 'nis2-dom-007', 'Are cybersecurity measures regularly tested for effectiveness?', 'Kas küberturvameetmeid testitakse regulaarselt tõhususe osas?', 'NIS2 requires policies for assessing the effectiveness of risk management measures through regular testing and audits.', 'NIS2 nõuab poliitikat riskihaldusmeetmete tõhususe hindamiseks regulaarsete testide ja auditite kaudu.', 'Conduct annual penetration tests and quarterly security assessments.', 'Viige läbi iga-aastased penetratsioonitestid ja kvartaalsed turvahindamised.', 'NIS2 Art. 21(2)(g)', 1.0, 1);

-- Cryptography domain
INSERT INTO compliance_questions (id, domain_id, question_en, question_et, guidance_en, guidance_et, recommendation_en, recommendation_et, article_reference, weight, display_order) VALUES
('nis2-q-014', 'nis2-dom-008', 'Is sensitive data encrypted at rest and in transit?', 'Kas tundlikud andmed on krüpteeritud nii salvestamisel kui edastamisel?', 'NIS2 requires policies on the use of cryptography and encryption to protect sensitive data.', 'NIS2 nõuab poliitikat krüptograafia ja krüpteerimise kasutamiseks tundlike andmete kaitseks.', 'Implement TLS 1.3 for data in transit and AES-256 for data at rest.', 'Rakendage TLS 1.3 edastatavate andmete ja AES-256 salvestatud andmete jaoks.', 'NIS2 Art. 21(2)(h)', 1.0, 1),
('nis2-q-015', 'nis2-dom-008', 'Is there a cryptographic key management process?', 'Kas on olemas krüptovõtmete halduse protsess?', 'Proper key management is essential for maintaining the security of encrypted data, including key generation, storage, rotation, and destruction.', 'Nõuetekohane võtmehaldus on oluline krüpteeritud andmete turvalisuse säilitamiseks, sealhulgas võtmete genereerimine, salvestamine, roteerimine ja hävitamine.', 'Implement a key management system with hardware security modules for critical keys.', 'Rakendage võtmehaldussüsteem riistvaraliste turvamoodulitega kriitiliste võtmete jaoks.', 'NIS2 Art. 21(2)(h)', 1.0, 2);

-- HR Security domain
INSERT INTO compliance_questions (id, domain_id, question_en, question_et, guidance_en, guidance_et, recommendation_en, recommendation_et, article_reference, weight, display_order) VALUES
('nis2-q-016', 'nis2-dom-009', 'Is there a security awareness training program for all employees?', 'Kas on olemas turvateadlikkuse koolitusprogramm kõigile töötajatele?', 'NIS2 requires human resources security measures including basic cyber hygiene practices and training.', 'NIS2 nõuab personaliturvalisuse meetmeid, sealhulgas põhilisi küberhügieeni praktikaid ja koolitust.', 'Implement mandatory annual security awareness training with phishing simulations.', 'Rakendage kohustuslik iga-aastane turvateadlikkuse koolitus andmepüügi simulatsioonidega.', 'NIS2 Art. 21(2)(i)', 1.0, 1),
('nis2-q-017', 'nis2-dom-009', 'Are background checks performed for employees with access to critical systems?', 'Kas kriitiliste süsteemide juurdepääsuga töötajate taustakontrollid viiakse läbi?', 'Personnel with access to critical systems should undergo appropriate background verification.', 'Kriitiliste süsteemide juurdepääsuga personal peaks läbima asjakohase taustakontrolli.', 'Implement background checks for all roles with elevated privileges or access to sensitive data.', 'Rakendage taustakontrollid kõigile rollidele kõrgendatud õiguste või tundlike andmete juurdepääsuga.', 'NIS2 Art. 21(2)(i)', 1.0, 2);

-- Access Control domain
INSERT INTO compliance_questions (id, domain_id, question_en, question_et, guidance_en, guidance_et, recommendation_en, recommendation_et, article_reference, weight, display_order) VALUES
('nis2-q-018', 'nis2-dom-010', 'Is multi-factor authentication implemented for critical systems?', 'Kas kriitilistele süsteemidele on rakendatud mitmefaktoriline autentimine?', 'NIS2 requires use of multi-factor authentication and secure authentication solutions where appropriate.', 'NIS2 nõuab mitmefaktorilise autentimise ja turvaliste autentimislahenduste kasutamist, kus see on asjakohane.', 'Implement MFA for all remote access and privileged accounts using hardware tokens or authenticator apps.', 'Rakendage MFA kõigile kaugjuurdepääsudele ja privilegeeritud kontodele riistvaraliste tokenite või autentikaatorirakenduste abil.', 'NIS2 Art. 21(2)(j)', 1.0, 1),
('nis2-q-019', 'nis2-dom-010', 'Is there a privileged access management system?', 'Kas on olemas privilegeeritud juurdepääsu haldussüsteem?', 'Privileged accounts require additional controls including just-in-time access, session monitoring, and regular access reviews.', 'Privilegeeritud kontod vajavad täiendavaid kontrolle, sealhulgas just-in-time juurdepääsu, sessiooni jälgimist ja regulaarseid juurdepääsu ülevaatusi.', 'Implement PAM solution with session recording and regular privileged access reviews.', 'Rakendage PAM-lahendus sessiooni salvestamise ja regulaarsete privilegeeritud juurdepääsu ülevaadetega.', 'NIS2 Art. 21(2)(j)', 1.0, 2),
('nis2-q-020', 'nis2-dom-010', 'Is the principle of least privilege enforced?', 'Kas vähima privileegi põhimõte on jõustatud?', 'Users should only have access to resources necessary for their job functions, with regular reviews of access rights.', 'Kasutajatel peaks olema juurdepääs ainult nende tööülesannete täitmiseks vajalikele ressurssidele, regulaarsete juurdepääsuõiguste ülevaadetega.', 'Implement role-based access control with quarterly access reviews and automatic deprovisioning.', 'Rakendage rollipõhine juurdepääsukontroll kvartaalsete juurdepääsu ülevaadetega ja automaatse õiguste tühistamisega.', 'NIS2 Art. 21(2)(j)', 1.0, 3);

-- Create indexes for better query performance
CREATE INDEX idx_compliance_domains_regulation ON compliance_domains(regulation_id);
CREATE INDEX idx_compliance_questions_domain ON compliance_questions(domain_id);
CREATE INDEX idx_regulations_code ON regulations(code);
CREATE INDEX idx_regulations_active ON regulations(active);
