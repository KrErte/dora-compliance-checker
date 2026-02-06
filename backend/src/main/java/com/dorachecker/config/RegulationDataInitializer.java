package com.dorachecker.config;

import com.dorachecker.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Initializes regulation data (DORA, NIS2) on application startup.
 * Only seeds data if the regulations table is empty.
 */
@Component
public class RegulationDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(RegulationDataInitializer.class);

    private final RegulationRepository regulationRepository;
    private final ComplianceDomainRepository domainRepository;
    private final ComplianceQuestionRepository questionRepository;

    public RegulationDataInitializer(RegulationRepository regulationRepository,
                                     ComplianceDomainRepository domainRepository,
                                     ComplianceQuestionRepository questionRepository) {
        this.regulationRepository = regulationRepository;
        this.domainRepository = domainRepository;
        this.questionRepository = questionRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (regulationRepository.count() > 0) {
            log.info("RegulationDataInitializer: Data already exists, skipping");
            return;
        }

        log.info("RegulationDataInitializer: Seeding regulation data...");

        seedDora();
        seedNis2();

        log.info("RegulationDataInitializer: Seeding complete - {} regulations, {} domains, {} questions",
                regulationRepository.count(), domainRepository.count(), questionRepository.count());
    }

    private void seedDora() {
        RegulationEntity dora = new RegulationEntity(
                "DORA",
                "Digital Operational Resilience Act",
                "Digitaalse tegevuse vastupidavuse määrus",
                "EU regulation on digital operational resilience for the financial sector.",
                "EL-i määrus finantssektori digitaalse tegevuse vastupidavuse kohta.",
                LocalDate.of(2025, 1, 17)
        );
        dora = regulationRepository.save(dora);

        // DORA Domains
        ComplianceDomainEntity serviceLevel = createDomain(dora, "SERVICE_LEVEL", "Service Level", "Teenustase", 1);
        ComplianceDomainEntity exitStrategy = createDomain(dora, "EXIT_STRATEGY", "Exit Strategy", "Väljumisstrateegia", 2);
        ComplianceDomainEntity audit = createDomain(dora, "AUDIT", "Audit Rights", "Auditeerimisõigused", 3);
        ComplianceDomainEntity incident = createDomain(dora, "INCIDENT", "Incident Notification", "Intsidentidest teavitamine", 4);
        ComplianceDomainEntity data = createDomain(dora, "DATA", "Data Location", "Andmete asukoht", 5);
        ComplianceDomainEntity subcontracting = createDomain(dora, "SUBCONTRACTING", "Subcontracting", "Allhange", 6);
        ComplianceDomainEntity risk = createDomain(dora, "RISK", "Risk Management", "Riskihaldus", 7);
        ComplianceDomainEntity legal = createDomain(dora, "LEGAL", "Legal Terms", "Juriidilised tingimused", 8);
        ComplianceDomainEntity continuity = createDomain(dora, "CONTINUITY", "Business Continuity", "Äritegevuse jätkuvus", 9);
        ComplianceDomainEntity ictRisk = createDomain(dora, "ICT_RISK_MANAGEMENT", "ICT Risk Management", "IKT riskihaldus", 10);
        ComplianceDomainEntity incidentMgmt = createDomain(dora, "INCIDENT_MANAGEMENT", "Incident Management", "Intsidentide haldus", 11);
        ComplianceDomainEntity testing = createDomain(dora, "TESTING", "Resilience Testing", "Vastupidavuse testimine", 12);
        ComplianceDomainEntity infoSharing = createDomain(dora, "INFORMATION_SHARING", "Information Sharing", "Teabe jagamine", 13);

        // DORA Questions - Service Level
        createQuestion(serviceLevel, "Does the contract define the scope and quality of the ICT service?",
                "Kas leping määratleb ICT teenuse ulatuse ja kvaliteedi?",
                "DORA Art. 30(2)(a)", 1);
        createQuestion(serviceLevel, "Are there service levels (SLA) with measurable KPIs?",
                "Kas on teenustasemed (SLA) mõõdetavate KPI-dega?",
                "DORA Art. 30(2)(a)", 2);

        // Exit Strategy
        createQuestion(exitStrategy, "Is there an exit strategy for contract termination?",
                "Kas on exit-strateegia lepingu lõppemisel?",
                "DORA Art. 30(2)(f)", 1);
        createQuestion(exitStrategy, "Is there a data return clause?",
                "Kas on andmete tagastamise klausel?",
                "DORA Art. 30(2)(f)", 2);
        createQuestion(exitStrategy, "Is there a provider insolvency clause?",
                "Kas on teenusepakkuja maksejõuetuse klausel?",
                "DORA Art. 30(2)(f)", 3);

        // Audit
        createQuestion(audit, "Does the contract include an audit right clause?",
                "Kas lepingus on auditeerimisõiguse klausel?",
                "DORA Art. 30(2)(d)", 1);
        createQuestion(audit, "Is there cooperation with financial supervisory authorities?",
                "Kas on koostöö finantsjärelevalvega?",
                "DORA Art. 30(2)(d)", 2);

        // Incident
        createQuestion(incident, "Does the provider notify about incidents within 24 hours?",
                "Kas teenusepakkuja teavitab intsidentidest 24h jooksul?",
                "DORA Art. 30(2)(e)", 1);

        // Data
        createQuestion(data, "Is the data location defined (EU/non-EU)?",
                "Kas andmete asukoht on määratletud (EL/mitte-EL)?",
                "DORA Art. 30(2)(b)", 1);

        // Subcontracting
        createQuestion(subcontracting, "Does the use of subcontractors require consent?",
                "Kas subkontraktorite kasutamine nõuab nõusolekut?",
                "DORA Art. 30(2)(a)", 1);

        // Risk
        createQuestion(risk, "Does the provider follow cybersecurity standards?",
                "Kas teenusepakkuja järgib küberturvalisuse standardeid?",
                "DORA Art. 30(2)(c)", 1);
        createQuestion(risk, "Are regular security tests conducted?",
                "Kas tehakse regulaarseid turvateste?",
                "DORA Art. 30(2)(c)", 2);

        // Legal
        createQuestion(legal, "Is there a confidentiality obligation?",
                "Kas on konfidentsiaalsuskohustus?",
                "DORA Art. 30(2)(b)", 1);
        createQuestion(legal, "Are liability limits defined?",
                "Kas vastutuse piirid on määratud?",
                "DORA Art. 30(2)(a)", 2);

        // Continuity
        createQuestion(continuity, "Are there disaster recovery requirements?",
                "Kas on disaster recovery nõuded?",
                "DORA Art. 30(2)(c)", 1);

        // ICT Risk Management
        createQuestion(ictRisk, "Is there an ICT risk management framework in place?",
                "Kas on kehtestatud ICT riskihalduse raamistik?",
                "DORA Art. 6(1)", 1);
        createQuestion(ictRisk, "Are ICT systems and assets mapped and classified?",
                "Kas ICT süsteemid ja varad on kaardistatud ja klassifitseeritud?",
                "DORA Art. 8(1)", 2);
        createQuestion(ictRisk, "Is there an ICT business continuity policy?",
                "Kas on olemas ICT ärijätkuvuse poliitika?",
                "DORA Art. 11(1)", 3);
        createQuestion(ictRisk, "Is there an ICT security policy and access control?",
                "Kas on ICT turvalisuse poliitika ja juurdepääsukontroll?",
                "DORA Art. 9(1)", 4);

        // Incident Management
        createQuestion(incidentMgmt, "Is there an ICT incident classification process?",
                "Kas on ICT intsidentide klassifitseerimise protsess?",
                "DORA Art. 18(1)", 1);
        createQuestion(incidentMgmt, "Is there a major ICT incident notification process?",
                "Kas on oluliste ICT intsidentide teavitamise protsess?",
                "DORA Art. 19(1)", 2);
        createQuestion(incidentMgmt, "Are lessons learned from incidents and improvements applied?",
                "Kas intsidentidest õpitakse ja rakendatakse parandusi?",
                "DORA Art. 13(1)", 3);
        createQuestion(incidentMgmt, "Is there a cyber threat detection and response capability?",
                "Kas on küberrünnakute tuvastamise ja reageerimise võimekus?",
                "DORA Art. 10(1)", 4);

        // Testing
        createQuestion(testing, "Are regular ICT security tests conducted?",
                "Kas viiakse läbi regulaarseid ICT turvalisuse teste?",
                "DORA Art. 24(1)", 1);
        createQuestion(testing, "Are TLPT tests conducted for critical ICT systems?",
                "Kas kriitiliste ICT süsteemide jaoks tehakse TLPT teste?",
                "DORA Art. 26(1)", 2);
        createQuestion(testing, "Are test results documented and deficiencies remediated?",
                "Kas testimise tulemused dokumenteeritakse ja puudused kõrvaldatakse?",
                "DORA Art. 24(5)", 3);
        createQuestion(testing, "Are ICT business continuity plans tested regularly?",
                "Kas ICT ärijätkuvuse plaane testitakse regulaarselt?",
                "DORA Art. 11(6)", 4);

        // Information Sharing
        createQuestion(infoSharing, "Does the entity participate in a cyber threat intelligence sharing community?",
                "Kas finantsasutus osaleb küberohuteavet jagavas kogukonnas?",
                "DORA Art. 45(1)", 1);
        createQuestion(infoSharing, "Is there a process for receiving and using cyber threat intelligence?",
                "Kas on protsess küberohu teabe vastuvõtmiseks ja kasutamiseks?",
                "DORA Art. 45(2)", 2);
        createQuestion(infoSharing, "Is significant incident information shared with other financial entities?",
                "Kas jagatakse olulist intsidendi teavet teiste finantsasutustega?",
                "DORA Art. 45(3)", 3);

        log.info("RegulationDataInitializer: DORA seeded with 13 domains and 28 questions");
    }

    private void seedNis2() {
        RegulationEntity nis2 = new RegulationEntity(
                "NIS2",
                "Network and Information Security Directive 2",
                "Võrgu- ja infosüsteemide turvalisuse direktiiv 2",
                "EU directive on measures for a high common level of cybersecurity across the Union.",
                "EL-i direktiiv meetmete kohta liidu ühtse kõrge küberturvalisuse taseme tagamiseks.",
                LocalDate.of(2024, 10, 17)
        );
        nis2 = regulationRepository.save(nis2);

        // NIS2 Domains (Article 21)
        ComplianceDomainEntity riskPolicies = createDomain(nis2, "RISK_POLICIES", "Risk Analysis & Security Policies", "Riskianalüüs ja turvapoliitikad", 1);
        ComplianceDomainEntity incidentHandling = createDomain(nis2, "INCIDENT_HANDLING", "Incident Handling", "Intsidentide käsitlemine", 2);
        ComplianceDomainEntity businessContinuity = createDomain(nis2, "BUSINESS_CONTINUITY", "Business Continuity", "Äritegevuse jätkuvus", 3);
        ComplianceDomainEntity supplyChain = createDomain(nis2, "SUPPLY_CHAIN", "Supply Chain Security", "Tarneahela turvalisus", 4);
        ComplianceDomainEntity networkSecurity = createDomain(nis2, "NETWORK_SECURITY", "Network & System Security", "Võrgu- ja süsteemiturvalisus", 5);
        ComplianceDomainEntity vulnerabilityMgmt = createDomain(nis2, "VULNERABILITY_MGMT", "Vulnerability Management", "Haavatavuste haldus", 6);
        ComplianceDomainEntity securityAssessment = createDomain(nis2, "SECURITY_ASSESSMENT", "Security Assessment", "Turvalisuse hindamine", 7);
        ComplianceDomainEntity cryptography = createDomain(nis2, "CRYPTOGRAPHY", "Cryptography & Encryption", "Krüptograafia ja krüpteerimine", 8);
        ComplianceDomainEntity hrSecurity = createDomain(nis2, "HR_SECURITY", "Human Resources Security", "Personaliturvalisus", 9);
        ComplianceDomainEntity accessControl = createDomain(nis2, "ACCESS_CONTROL", "Access Control & MFA", "Juurdepääsukontroll ja MFA", 10);

        // NIS2 Questions - Risk Policies
        createQuestion(riskPolicies, "Has the organization established a comprehensive information security risk analysis process?",
                "Kas organisatsioon on kehtestanud põhjaliku infoturberiski analüüsi protsessi?",
                "NIS2 Art. 21(2)(a)", 1);
        createQuestion(riskPolicies, "Are information security policies documented and approved by management?",
                "Kas infoturbe poliitikad on dokumenteeritud ja juhtkonna poolt kinnitatud?",
                "NIS2 Art. 21(2)(a)", 2);

        // Incident Handling
        createQuestion(incidentHandling, "Is there a documented incident handling procedure?",
                "Kas on olemas dokumenteeritud intsidentide käsitlemise protseduur?",
                "NIS2 Art. 21(2)(b)", 1);
        createQuestion(incidentHandling, "Can you notify CERT-EE of significant incidents within 24 hours?",
                "Kas suudate teavitada CERT-EE-d olulistest intsidentidest 24 tunni jooksul?",
                "NIS2 Art. 23", 2);

        // Business Continuity
        createQuestion(businessContinuity, "Is there a business continuity plan covering critical services?",
                "Kas on olemas äritegevuse jätkuvuse plaan kriitiliste teenuste jaoks?",
                "NIS2 Art. 21(2)(c)", 1);
        createQuestion(businessContinuity, "Are critical systems backed up regularly with tested recovery procedures?",
                "Kas kriitilisi süsteeme varundatakse regulaarselt testitud taastamisprotseduuridega?",
                "NIS2 Art. 21(2)(c)", 2);

        // Supply Chain
        createQuestion(supplyChain, "Is there a process to assess cybersecurity risks in the supply chain?",
                "Kas on olemas protsess tarneahela küberturberiskide hindamiseks?",
                "NIS2 Art. 21(2)(d)", 1);
        createQuestion(supplyChain, "Are security requirements included in contracts with suppliers?",
                "Kas turvanõuded on lisatud tarnijatega sõlmitud lepingutesse?",
                "NIS2 Art. 21(2)(d)", 2);

        // Network Security
        createQuestion(networkSecurity, "Is the network segmented to protect critical systems?",
                "Kas võrk on segmenteeritud kriitiliste süsteemide kaitseks?",
                "NIS2 Art. 21(2)(e)", 1);
        createQuestion(networkSecurity, "Are network security measures (firewalls, IDS/IPS) in place and maintained?",
                "Kas võrguturbe meetmed (tulemüürid, IDS/IPS) on paigas ja hooldatud?",
                "NIS2 Art. 21(2)(e)", 2);

        // Vulnerability Management
        createQuestion(vulnerabilityMgmt, "Is there a vulnerability disclosure and handling process?",
                "Kas on olemas haavatavuste avalikustamise ja käsitlemise protsess?",
                "NIS2 Art. 21(2)(f)", 1);
        createQuestion(vulnerabilityMgmt, "Are systems regularly scanned for vulnerabilities and patched?",
                "Kas süsteeme skaneeritakse regulaarselt haavatavuste suhtes ja paigaldatakse paigad?",
                "NIS2 Art. 21(2)(f)", 2);

        // Security Assessment
        createQuestion(securityAssessment, "Are cybersecurity measures regularly tested for effectiveness?",
                "Kas küberturvameetmeid testitakse regulaarselt tõhususe osas?",
                "NIS2 Art. 21(2)(g)", 1);

        // Cryptography
        createQuestion(cryptography, "Is sensitive data encrypted at rest and in transit?",
                "Kas tundlikud andmed on krüpteeritud nii salvestamisel kui edastamisel?",
                "NIS2 Art. 21(2)(h)", 1);
        createQuestion(cryptography, "Is there a cryptographic key management process?",
                "Kas on olemas krüptovõtmete halduse protsess?",
                "NIS2 Art. 21(2)(h)", 2);

        // HR Security
        createQuestion(hrSecurity, "Is there a security awareness training program for all employees?",
                "Kas on olemas turvateadlikkuse koolitusprogramm kõigile töötajatele?",
                "NIS2 Art. 21(2)(i)", 1);
        createQuestion(hrSecurity, "Are background checks performed for employees with access to critical systems?",
                "Kas kriitiliste süsteemide juurdepääsuga töötajate taustakontrollid viiakse läbi?",
                "NIS2 Art. 21(2)(i)", 2);

        // Access Control
        createQuestion(accessControl, "Is multi-factor authentication implemented for critical systems?",
                "Kas kriitilistele süsteemidele on rakendatud mitmefaktoriline autentimine?",
                "NIS2 Art. 21(2)(j)", 1);
        createQuestion(accessControl, "Is there a privileged access management system?",
                "Kas on olemas privilegeeritud juurdepääsu haldussüsteem?",
                "NIS2 Art. 21(2)(j)", 2);
        createQuestion(accessControl, "Is the principle of least privilege enforced?",
                "Kas vähima privileegi põhimõte on jõustatud?",
                "NIS2 Art. 21(2)(j)", 3);

        log.info("RegulationDataInitializer: NIS2 seeded with 10 domains and 20 questions");
    }

    private ComplianceDomainEntity createDomain(RegulationEntity regulation, String code, String nameEn, String nameEt, int order) {
        ComplianceDomainEntity domain = new ComplianceDomainEntity(regulation, code, nameEn, nameEt, order);
        return domainRepository.save(domain);
    }

    private void createQuestion(ComplianceDomainEntity domain, String questionEn, String questionEt, String articleRef, int order) {
        ComplianceQuestionEntity question = new ComplianceQuestionEntity(domain, questionEn, questionEt, articleRef, order);
        questionRepository.save(question);
    }
}
