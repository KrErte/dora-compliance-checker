package com.dorachecker.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WarRoomService {

    private static final Logger log = LoggerFactory.getLogger(WarRoomService.class);
    private static final long SESSION_TTL_MS = 3_600_000 * 4; // 4 hours
    private static final int MAX_SESSIONS = 5_000;

    private final SubscriptionGuardService subscriptionGuard;

    private final ConcurrentHashMap<String, WarRoomSession> sessions = new ConcurrentHashMap<>();

    public WarRoomService(SubscriptionGuardService subscriptionGuard) {
        this.subscriptionGuard = subscriptionGuard;
    }

    @Scheduled(fixedRate = 900_000)
    public void cleanupSessions() {
        long now = Instant.now().toEpochMilli();
        sessions.entrySet().removeIf(entry -> {
            long created = Instant.parse(entry.getValue().startedAt).toEpochMilli();
            return (now - created) > SESSION_TTL_MS;
        });
        if (sessions.size() > MAX_SESSIONS) {
            log.warn("War room session count {} exceeds max {}, pruning oldest", sessions.size(), MAX_SESSIONS);
            sessions.entrySet().stream()
                .sorted(Comparator.comparing(e -> e.getValue().startedAt))
                .limit(sessions.size() - MAX_SESSIONS)
                .forEach(e -> sessions.remove(e.getKey()));
        }
    }

    // ========== SCENARIOS ==========

    private static final List<Map<String, Object>> SCENARIOS = buildScenarios();

    private static List<Map<String, Object>> buildScenarios() {
        List<Map<String, Object>> list = new ArrayList<>();

        // 1. Ransomware (FREE)
        Map<String, Object> s1 = new LinkedHashMap<>();
        s1.put("id", "ransomware");
        s1.put("name", "Ransomware Attack");
        s1.put("nameEt", "Lunavararünnak");
        s1.put("icon", "lock");
        s1.put("difficulty", "MEDIUM");
        s1.put("tier", "FREE");
        s1.put("doraArticles", List.of("Art. 17", "Art. 19", "Art. 11"));
        s1.put("description", "Critical servers encrypted with ransomware. Attackers demand cryptocurrency payment. Customer data and core banking systems are at risk.");
        s1.put("descriptionEt", "Kriitilised serverid on lunavaraga krüpteeritud. Ründajad nõuavad krüptovaluutas lunaraha. Kliendiandmed ja põhilised pangasüsteemid on ohus.");
        s1.put("targetNodeType", "asset");
        list.add(s1);

        // 2. Cloud Service Outage (STANDARD)
        Map<String, Object> s2 = new LinkedHashMap<>();
        s2.put("id", "cloud_outage");
        s2.put("name", "Cloud Service Outage");
        s2.put("nameEt", "Pilveteenuse katkestus");
        s2.put("icon", "cloud_off");
        s2.put("difficulty", "MEDIUM");
        s2.put("tier", "STANDARD");
        s2.put("doraArticles", List.of("Art. 28", "Art. 29", "Art. 11"));
        s2.put("description", "Your critical cloud provider experiences a major outage. All hosted services are down. SLA breach imminent.");
        s2.put("descriptionEt", "Teie kriitiline pilveteenuse pakkuja kogeb suurt katkestust. Kõik majutatud teenused on maas. SLA rikkumine on lähedal.");
        s2.put("targetNodeType", "provider");
        list.add(s2);

        // 3. Data Breach (STANDARD)
        Map<String, Object> s3 = new LinkedHashMap<>();
        s3.put("id", "data_breach");
        s3.put("name", "Data Breach");
        s3.put("nameEt", "Andmeleke");
        s3.put("icon", "shield_lock");
        s3.put("difficulty", "HIGH");
        s3.put("tier", "STANDARD");
        s3.put("doraArticles", List.of("Art. 17", "Art. 19", "Art. 10"));
        s3.put("description", "Personal data of 50,000 customers has been exfiltrated. The breach was discovered through dark web monitoring. Regulatory notification deadlines apply.");
        s3.put("descriptionEt", "50 000 kliendi isikuandmed on varastatud. Leke avastati tumeveebist. Kehtivad regulatoorsed teavitamistähtajad.");
        s3.put("targetNodeType", "asset");
        list.add(s3);

        // 4. DDoS Attack (STANDARD)
        Map<String, Object> s4 = new LinkedHashMap<>();
        s4.put("id", "ddos");
        s4.put("name", "DDoS Attack");
        s4.put("nameEt", "DDoS rünnak");
        s4.put("icon", "bolt");
        s4.put("difficulty", "LOW");
        s4.put("tier", "STANDARD");
        s4.put("doraArticles", List.of("Art. 11", "Art. 17", "Art. 12"));
        s4.put("description", "Massive distributed denial-of-service attack overwhelms your public-facing services. Online banking and payment processing are affected.");
        s4.put("descriptionEt", "Massiivne hajutatud teenustõkkerünnak koormab üle teie avalikud teenused. Internetipank ja maksete töötlemine on häiritud.");
        s4.put("targetNodeType", "asset");
        list.add(s4);

        // 5. Supply Chain Compromise (STANDARD)
        Map<String, Object> s5 = new LinkedHashMap<>();
        s5.put("id", "supply_chain");
        s5.put("name", "Supply Chain Compromise");
        s5.put("nameEt", "Tarneahela kompromiteerimine");
        s5.put("icon", "link_off");
        s5.put("difficulty", "HIGH");
        s5.put("tier", "STANDARD");
        s5.put("doraArticles", List.of("Art. 28", "Art. 30", "Art. 17"));
        s5.put("description", "A backdoor has been discovered in a critical third-party software component. The compromised library is widely used across your infrastructure.");
        s5.put("descriptionEt", "Kriitilises kolmanda osapoole tarkvarakomponendis avastati tagauks. Kompromiteeritud teeki kasutatakse laialdaselt teie taristus.");
        s5.put("targetNodeType", "provider");
        list.add(s5);

        // 6. AI Custom (ENTERPRISE)
        Map<String, Object> s6 = new LinkedHashMap<>();
        s6.put("id", "ai_custom");
        s6.put("name", "AI Custom Scenario");
        s6.put("nameEt", "AI kohandatud stsenaarium");
        s6.put("icon", "auto_awesome");
        s6.put("difficulty", "VARIABLE");
        s6.put("tier", "ENTERPRISE");
        s6.put("doraArticles", List.of("Art. 17", "Art. 19", "Art. 28"));
        s6.put("description", "AI generates a custom incident scenario based on your actual ICT infrastructure and risk profile.");
        s6.put("descriptionEt", "AI genereerib kohandatud intsidendi stsenaariumi teie tegeliku IKT taristu ja riskiprofiili põhjal.");
        s6.put("targetNodeType", "asset");
        list.add(s6);

        return Collections.unmodifiableList(list);
    }

    // ========== PHASES & DECISIONS ==========

    private static Map<String, List<Phase>> buildAllPhases() {
        Map<String, List<Phase>> map = new LinkedHashMap<>();
        map.put("ransomware", buildRansomwarePhases());
        map.put("cloud_outage", buildCloudOutagePhases());
        map.put("data_breach", buildDataBreachPhases());
        map.put("ddos", buildDDoSPhases());
        map.put("supply_chain", buildSupplyChainPhases());
        map.put("ai_custom", buildRansomwarePhases()); // fallback
        return map;
    }

    private static final Map<String, List<Phase>> ALL_PHASES = buildAllPhases();

    private static List<Phase> buildRansomwarePhases() {
        List<Phase> phases = new ArrayList<>();

        // Phase 1: Detection & Initial Response (0-4h)
        Phase p1 = new Phase("detection", "Detection & Initial Response", "Tuvastamine ja esmane reageerimine", 0, 240);
        p1.decisions.add(new Decision(
            "Your SOC alerts show multiple servers encrypting files simultaneously. What is your first action?",
            "Teie SOC hoiatused näitavad, et mitu serverit krüpteerivad samaaegselt faile. Mis on teie esimene toiming?",
            List.of(
                new Option("Isolate affected network segments immediately", "Isoleerige mõjutatud võrgusegmendid kohe", 95, "Swift isolation prevents lateral movement. Other systems are protected.", 0, 0),
                new Option("Investigate the scope before taking action", "Uurige ulatust enne tegutsemist", 40, "Investigation delays response. Ransomware spreads to 3 more servers during analysis.", 2, 30),
                new Option("Contact the ransomware operators to negotiate", "Võtke ühendust lunavara operaatoritega läbirääkimiseks", 10, "Engaging with attackers wastes critical time and may violate regulations.", 1, 60),
                new Option("Shut down all servers to prevent spread", "Lülitage kõik serverid välja leviku takistamiseks", 60, "Effective but causes complete service outage. Business continuity impacted.", 0, 15)
            )
        ));
        p1.decisions.add(new Decision(
            "Who should be notified within the first hour?",
            "Keda tuleks esimese tunni jooksul teavitada?",
            List.of(
                new Option("CISO, CEO, Legal, and incident response team", "CISO, tegevjuht, juriidiline osakond ja intsidentide meeskond", 90, "Comprehensive notification ensures coordinated response from all stakeholders.", 0, 0),
                new Option("Only the IT security team", "Ainult IT turvameeskond", 35, "Limited notification delays executive decision-making and legal compliance.", 0, 20),
                new Option("Everyone in the company via email", "Kõik ettevõttes e-posti teel", 20, "Mass notification causes panic and may leak sensitive incident details.", 1, 15)
            )
        ));
        p1.decisions.add(new Decision(
            "Do you activate your business continuity plan?",
            "Kas aktiveerite oma talitluspidevuse plaani?",
            List.of(
                new Option("Yes, activate BCP and switch to backup systems", "Jah, aktiveerige BCP ja lülituge varusüsteemidele", 95, "BCP activation ensures critical services continue. Customers barely notice disruption.", 0, 0),
                new Option("No, try to restore primary systems first", "Ei, proovige esmalt taastada põhisüsteemid", 30, "Restoration attempts fail as ransomware re-encrypts recovered files.", 2, 45),
                new Option("Partially - only for customer-facing services", "Osaliselt – ainult klienditeenuste jaoks", 70, "Partial activation protects revenue but internal operations remain disrupted.", 1, 10)
            )
        ));
        phases.add(p1);

        // Phase 2: Classification & Notification (4-8h)
        Phase p2 = new Phase("classification", "Classification & Notification", "Klassifitseerimine ja teavitamine", 240, 480);
        p2.decisions.add(new Decision(
            "How do you classify this incident under DORA Art. 18?",
            "Kuidas klassifitseerite selle intsidendi DORA Art. 18 alusel?",
            List.of(
                new Option("Major ICT incident - triggers regulatory reporting", "Oluline IKT intsident – käivitab regulatoorse teavitamise", 95, "Correct classification. DORA Art. 19 reporting timelines now apply: initial notification within 4 hours.", 0, 0),
                new Option("Significant but not major - internal handling only", "Oluline, kuid mitte suur – ainult sisene käsitlemine", 15, "Underclassification. Regulatory audit later reveals reporting obligation was missed. Penalties apply.", 0, 30),
                new Option("Critical - exceeds major incident threshold", "Kriitiline – ületab suure intsidendi künnise", 70, "Slightly over-classified but triggers appropriate response. Resources may be over-allocated.", 0, 5)
            )
        ));
        p2.decisions.add(new Decision(
            "When do you submit the initial notification to your NCA?",
            "Millal esitate esialgse teate oma pädevale asutusele?",
            List.of(
                new Option("Within 4 hours of classification as major", "4 tunni jooksul pärast suureks klassifitseerimist", 100, "Perfect compliance with DORA Art. 19 initial notification deadline.", 0, 0),
                new Option("Within 24 hours to gather more information first", "24 tunni jooksul, et esmalt rohkem teavet koguda", 30, "Exceeds the 4-hour deadline. Regulatory non-compliance documented.", 0, 0),
                new Option("After the incident is resolved", "Pärast intsidendi lahendamist", 5, "Severe non-compliance. Missing the initial notification window carries significant penalties.", 0, 0)
            )
        ));
        phases.add(p2);

        // Phase 3: Containment & Recovery (8-72h)
        Phase p3 = new Phase("containment", "Containment & Recovery", "Ohjeldamine ja taastamine", 480, 4320);
        p3.decisions.add(new Decision(
            "Forensic analysis reveals the attack vector was a phishing email. How do you contain it?",
            "Kohtuekspertiis paljastab, et ründevektor oli andmepüügimeil. Kuidas seda ohjeldada?",
            List.of(
                new Option("Block the malicious domain, reset all credentials, scan all endpoints", "Blokeerige pahatahtlik domeen, lähtestage kõik mandaadid, skannige kõik lõpp-punktid", 95, "Comprehensive containment. No further infections detected. Clean-up proceeds efficiently.", 0, 0),
                new Option("Block the malicious domain and warn employees", "Blokeerige pahatahtlik domeen ja hoiatage töötajaid", 55, "Partial containment. Compromised credentials remain active, allowing potential re-entry.", 1, 20),
                new Option("Focus only on restoring encrypted systems", "Keskenduge ainult krüpteeritud süsteemide taastamisele", 20, "Ignoring the attack vector allows reinfection. Systems are encrypted again within hours.", 3, 60)
            )
        ));
        p3.decisions.add(new Decision(
            "Your backup strategy: which approach do you take for recovery?",
            "Teie varundusstrateegia: millist lähenemist kasutate taastamiseks?",
            List.of(
                new Option("Restore from verified clean backups after full environment scan", "Taastage kontrollitud puhastest varukoopiatest pärast keskkonna täielikku skannimist", 95, "Clean restoration confirmed. Systems back online progressively with integrity verified.", 0, 0),
                new Option("Restore from most recent backup immediately", "Taastage kohe viimased varukoopiad", 45, "Recent backups may contain dormant malware. Risk of reinfection within days.", 1, 15),
                new Option("Pay the ransom to get decryption keys", "Makske lunaraha dekrüpteerimisvõtmete saamiseks", 5, "Payment does not guarantee recovery. Funds criminal operations. Regulatory and reputational damage.", 2, 30)
            )
        ));
        p3.decisions.add(new Decision(
            "How do you communicate with affected clients during recovery?",
            "Kuidas suhtlete mõjutatud klientidega taastamise ajal?",
            List.of(
                new Option("Proactive disclosure with timeline and support hotline", "Ennetav avaldamine ajakava ja tugiliinega", 90, "Transparency maintains trust. Clients appreciate proactive communication.", 0, 0),
                new Option("Wait until recovery is complete before informing clients", "Oodake enne klientide teavitamist, kuni taastamine on lõpetatud", 30, "Delayed disclosure violates notification obligations. Clients discover issues independently.", 0, 15),
                new Option("Minimal disclosure - only when directly asked", "Minimaalne avaldamine – ainult otse küsimisel", 15, "Reactive approach damages trust and may violate GDPR/DORA notification requirements.", 1, 10)
            )
        ));
        phases.add(p3);

        // Phase 4: Reporting (72h+)
        Phase p4 = new Phase("reporting", "Reporting & Lessons Learned", "Aruandlus ja õppetunnid", 4320, 43200);
        p4.decisions.add(new Decision(
            "Your intermediate report to the NCA is due within 72 hours. What do you include?",
            "Teie vaheraport pädevale asutusele tuleb esitada 72 tunni jooksul. Mida lisate?",
            List.of(
                new Option("Full technical details, impact assessment, timeline, and recovery status", "Täielikud tehnilised üksikasjad, mõjuhinnang, ajakava ja taastamise staatus", 95, "Comprehensive intermediate report meets all DORA Art. 19 requirements.", 0, 0),
                new Option("High-level summary with limited technical details", "Kõrgetasemeline kokkuvõte piiratud tehniliste üksikasjadega", 50, "Insufficient detail. NCA requests additional information, causing delays.", 0, 10),
                new Option("Copy of the initial notification with minor updates", "Esialgse teate koopia väikeste uuendustega", 15, "Fails to meet intermediate report requirements. Regulatory finding issued.", 0, 5)
            )
        ));
        p4.decisions.add(new Decision(
            "What lessons-learned actions do you prioritize?",
            "Milliseid õppetundide tegevusi te prioriseerite?",
            List.of(
                new Option("Update risk framework, enhance monitoring, conduct staff training, review BCP", "Uuendage riskide raamistikku, tõhustage seiret, viige läbi koolitusi, vaadake üle BCP", 95, "Comprehensive improvement program addresses root causes and strengthens resilience.", 0, 0),
                new Option("Focus on technical fixes only (patching, endpoint protection)", "Keskenduge ainult tehnilistele parandustele (parandused, lõpp-punktide kaitse)", 45, "Technical fixes address symptoms but not governance and process gaps.", 0, 5),
                new Option("Document the incident and move on", "Dokumenteerige intsident ja liikuge edasi", 15, "Minimal learning. Similar incidents likely to recur.", 0, 0)
            )
        ));
        phases.add(p4);

        return phases;
    }

    private static List<Phase> buildCloudOutagePhases() {
        List<Phase> phases = new ArrayList<>();

        Phase p1 = new Phase("detection", "Detection & Initial Response", "Tuvastamine ja esmane reageerimine", 0, 240);
        p1.decisions.add(new Decision(
            "Your monitoring shows all services hosted by cloud provider X are unreachable. What is your first action?",
            "Teie seire näitab, et kõik pilveteenuse pakkuja X majutatud teenused on kättesaamatud. Mis on teie esimene toiming?",
            List.of(
                new Option("Verify outage scope, activate BCP, switch to DR site", "Kontrollige katkestuse ulatust, aktiveerige BCP, lülituge DR-saidile", 95, "Swift activation of disaster recovery minimizes customer impact.", 0, 0),
                new Option("Contact cloud provider support and wait for their update", "Võtke ühendust pilveeteenuse pakkuja toega ja oodake nende uuendust", 30, "Passive approach. Service remains down while waiting for provider response.", 2, 45),
                new Option("Attempt to restart services in the same cloud region", "Proovige teenuseid samas pilvepiirkonnas taaskäivitada", 20, "Region-wide outage means restarts fail. Time wasted on futile attempts.", 1, 30)
            )
        ));
        p1.decisions.add(new Decision(
            "Multiple critical business functions depend on this provider. How do you prioritize?",
            "Mitu kriitilist ärifunktsiooni sõltuvad sellest pakkujast. Kuidas te prioriseerite?",
            List.of(
                new Option("Restore critical functions first per BIA priority matrix", "Taastage kriitilised funktsioonid esmalt BIA prioriteedimaatriksi järgi", 90, "Business Impact Analysis guides efficient recovery. Critical services restored first.", 0, 0),
                new Option("Restore everything simultaneously", "Taastage kõik samaaegselt", 35, "Resource competition slows all recovery. Nothing comes back quickly.", 1, 20),
                new Option("Focus on revenue-generating services only", "Keskenduge ainult tulu teenivatele teenustele", 55, "Revenue is protected but regulatory and compliance services are delayed.", 0, 10)
            )
        ));
        p1.decisions.add(new Decision(
            "Do you invoke exit strategy provisions in your contract?",
            "Kas kasutate oma lepingus väljumisstrateegia sätteid?",
            List.of(
                new Option("Prepare exit strategy activation while monitoring recovery", "Valmistage ette väljumisstrateegia aktiveerimine, jälgides taastumist", 85, "Prudent preparation. Exit strategy ready if recovery extends beyond RTO.", 0, 0),
                new Option("Yes, immediately begin migrating to alternative provider", "Jah, alustage kohe alternatiivse pakkuja juurde üleminekut", 40, "Premature migration is expensive and risky. Outage may resolve soon.", 0, 15),
                new Option("No, we have no exit strategy documented", "Ei, meil pole väljumisstrateegiat dokumenteeritud", 10, "DORA Art. 28 requires exit strategies. This gap requires immediate remediation.", 1, 20)
            )
        ));
        phases.add(p1);

        Phase p2 = new Phase("classification", "Classification & Notification", "Klassifitseerimine ja teavitamine", 240, 480);
        p2.decisions.add(new Decision(
            "The outage has lasted 4 hours. How do you classify it?",
            "Katkestus on kestnud 4 tundi. Kuidas te seda klassifitseerite?",
            List.of(
                new Option("Major ICT incident due to critical function impact and duration", "Oluline IKT intsident kriitiliste funktsioonide mõju ja kestuse tõttu", 95, "Correct classification triggers appropriate response and reporting.", 0, 0),
                new Option("Provider issue - not our incident to classify", "Pakkuja probleem – meie klassifitseerida pole", 10, "DORA requires the financial entity to classify, regardless of root cause.", 1, 25),
                new Option("Minor operational disruption", "Väike operatiivne häire", 20, "Underclassification. Regulatory review later flags this as a major incident.", 0, 15)
            )
        ));
        p2.decisions.add(new Decision(
            "Your NCA notification is due. What information about third-party involvement do you include?",
            "Teie pädevale asutusele teavitamine on vajalik. Millist teavet kolmanda osapoole kaasatuse kohta lisate?",
            List.of(
                new Option("Provider name, contract details, SLA terms, impact on critical functions, and exit strategy status", "Pakkuja nimi, lepingu üksikasjad, SLA tingimused, mõju kriitilistele funktsioonidele ja väljumisstrateegia staatus", 95, "Complete third-party information per DORA Art. 19 and Art. 28 requirements.", 0, 0),
                new Option("Only mention that a third-party provider is involved", "Mainige ainult, et kolmanda osapoole pakkuja on kaasatud", 35, "Insufficient detail. NCA will request additional information.", 0, 10),
                new Option("Do not mention the provider to protect the business relationship", "Ärge mainige pakkujat ärisuhte kaitsmiseks", 5, "Withholding material information from regulators is a serious compliance violation.", 0, 20)
            )
        ));
        phases.add(p2);

        Phase p3 = new Phase("containment", "Containment & Recovery", "Ohjeldamine ja taastamine", 480, 4320);
        p3.decisions.add(new Decision(
            "Cloud provider estimates 48-hour recovery. Your RTO for critical functions is 4 hours. What do you do?",
            "Pilveteenuse pakkuja hindab taastumiseks 48 tundi. Teie RTO kriitiliste funktsioonide jaoks on 4 tundi. Mida teete?",
            List.of(
                new Option("Activate multi-cloud DR plan and migrate critical workloads", "Aktiveerige mitme pilve DR-plaan ja migreerige kriitilised töökoormused", 95, "Multi-cloud DR ensures RTO compliance. Critical functions restored within target.", 0, 0),
                new Option("Negotiate with provider for priority restoration", "Läbirääkige pakkujaga prioriteetse taastamise osas", 40, "Provider overwhelmed with similar requests. No guarantee of faster restoration.", 1, 30),
                new Option("Accept the extended downtime and notify clients", "Nõustuge pikema seisakuajaga ja teavitage kliente", 25, "RTO breach. Regulatory scrutiny on adequacy of resilience arrangements.", 2, 15)
            )
        ));
        p3.decisions.add(new Decision(
            "How do you document the concentration risk exposed by this incident?",
            "Kuidas dokumenteerite selle intsidendiga paljastatud kontsentratsiooni riski?",
            List.of(
                new Option("Update concentration risk register, conduct substitutability analysis, report to board", "Uuendage kontsentratsiooni riski registrit, viige läbi asendatavuse analüüs, raporteerige juhatusele", 90, "Comprehensive concentration risk management per DORA Art. 29.", 0, 0),
                new Option("Add it to the incident report as a finding", "Lisage see intsidendi aruandele leiuna", 50, "Documented but not actioned. Concentration risk persists.", 0, 5),
                new Option("No documentation needed - this was a one-time event", "Dokumenteerimine pole vajalik – see oli ühekordne sündmus", 10, "Ignoring concentration risk violates DORA Art. 29 requirements.", 1, 15)
            )
        ));
        p3.decisions.add(new Decision(
            "Recovery is underway. How do you verify data integrity after the outage?",
            "Taastamine on käimas. Kuidas kontrollite andmete terviklust pärast katkestust?",
            List.of(
                new Option("Full data integrity checks, reconciliation with backup systems, audit trail verification", "Täielikud andmete tervikluse kontrollid, kooskõlastamine varusüsteemidega, auditijälje kontroll", 95, "Thorough verification ensures no data corruption. Full audit trail maintained.", 0, 0),
                new Option("Spot-check critical data sets only", "Kontrollige ainult kriitilisi andmekogumeid pistelist", 50, "Partial verification. Undetected corruption in non-critical data discovered weeks later.", 0, 10),
                new Option("Trust the provider's assurance that data is intact", "Usaldage pakkuja kinnitust, et andmed on terved", 15, "No independent verification. Data integrity issues surface during month-end processing.", 1, 20)
            )
        ));
        phases.add(p3);

        Phase p4 = new Phase("reporting", "Reporting & Lessons Learned", "Aruandlus ja õppetunnid", 4320, 43200);
        p4.decisions.add(new Decision(
            "Your final report is due within 1 month. What third-party risk improvements do you recommend?",
            "Teie lõpparuanne tuleb esitada 1 kuu jooksul. Milliseid kolmanda osapoole riski parandusi soovitate?",
            List.of(
                new Option("Multi-cloud strategy, enhanced SLAs, regular DR testing, exit strategy update", "Mitme pilve strateegia, täiustatud SLA-d, regulaarne DR testimine, väljumisstrateegia uuendus", 95, "Comprehensive third-party risk management improvement plan.", 0, 0),
                new Option("Negotiate better SLA with current provider", "Läbirääkige parema SLA üle praeguse pakkujaga", 45, "Addresses symptoms but not concentration risk. Single point of failure remains.", 0, 5),
                new Option("No changes - this was an exceptional event", "Muudatused puuduvad – see oli erandlik sündmus", 10, "Regulatory finding: inadequate lessons learned from major incident.", 0, 10)
            )
        ));
        p4.decisions.add(new Decision(
            "How do you update your Register of Information (RoI) after this incident?",
            "Kuidas uuendate oma teaberegistrit (RoI) pärast seda intsidenti?",
            List.of(
                new Option("Update risk ratings, add incident reference, review all arrangements with this provider", "Uuendage riskihinnanguid, lisage intsidendi viide, vaadake üle kõik kokkulepped selle pakkujaga", 90, "RoI updated per DORA Art. 28(3) requirements. Concentration risk reflected.", 0, 0),
                new Option("Note the incident in the provider's record", "Märkige intsident pakkuja kirjesse", 45, "Minimal update. Does not address systemic concentration risk.", 0, 5),
                new Option("RoI update not needed for operational incidents", "RoI uuendus pole operatiivsetele intsidentide puhul vajalik", 10, "Incorrect. All material changes must be reflected in the RoI.", 0, 10)
            )
        ));
        phases.add(p4);

        return phases;
    }

    private static List<Phase> buildDataBreachPhases() {
        List<Phase> phases = new ArrayList<>();

        Phase p1 = new Phase("detection", "Detection & Initial Response", "Tuvastamine ja esmane reageerimine", 0, 240);
        p1.decisions.add(new Decision(
            "Dark web monitoring has detected your customer database for sale. How do you verify this?",
            "Tumeveebi seire tuvastas teie kliendiandmebaasi müügil. Kuidas seda kontrollite?",
            List.of(
                new Option("Cross-reference leaked sample data with production database, conduct forensic analysis", "Võrrelge lekkinud näidisandmeid tootmisandmebaasiga, viige läbi kohtuekspertiis", 95, "Forensic analysis confirms breach and identifies the attack vector. Evidence preserved.", 0, 0),
                new Option("Assume it's real and begin response immediately", "Eeldage, et see on tõene, ja alustage kohe reageerimist", 60, "Fast response but without forensic evidence, root cause remains unknown.", 1, 10),
                new Option("Contact the dark web seller to verify authenticity", "Võtke ühendust tumeveebi müüjaga autentsuse kontrollimiseks", 5, "Engaging with criminals alerts them. Evidence may be destroyed.", 2, 30)
            )
        ));
        p1.decisions.add(new Decision(
            "Forensics confirms 50,000 customer records were exfiltrated over 3 months. What is your priority?",
            "Kohtuekspertiis kinnitab, et 50 000 kliendikirjet varastati 3 kuu jooksul. Mis on teie prioriteet?",
            List.of(
                new Option("Close the exfiltration channel, preserve evidence, begin impact assessment", "Sulgege eksfiltratsioonikanal, säilitage tõendid, alustage mõjuhindamist", 95, "Correct priority ordering. Bleeding stopped while maintaining forensic evidence.", 0, 0),
                new Option("Notify all 50,000 affected customers immediately", "Teavitage kohe kõiki 50 000 mõjutatud klienti", 40, "Premature notification without full impact assessment causes unnecessary panic.", 1, 15),
                new Option("Reset all customer passwords and force re-verification", "Lähtestage kõik kliendi paroolid ja sundige taaskontrollima", 55, "Good security measure but doesn't address the root cause or notification obligations.", 0, 10)
            )
        ));
        p1.decisions.add(new Decision(
            "Your DPO advises that GDPR notification to the DPA is also required. How do you coordinate?",
            "Teie DPO soovitab, et GDPR teavitamine andmekaitseasutusele on samuti vajalik. Kuidas koordineerite?",
            List.of(
                new Option("Parallel notification to both NCA (DORA) and DPA (GDPR) within respective deadlines", "Paralleelne teavitamine nii pädevale asutusele (DORA) kui andmekaitseasutusele (GDPR) vastavate tähtaegade jooksul", 95, "Coordinated dual-reporting ensures compliance with both frameworks.", 0, 0),
                new Option("DORA notification first, GDPR can wait", "Esmalt DORA teavitamine, GDPR võib oodata", 40, "GDPR 72-hour deadline may be missed. Separate penalties apply.", 0, 15),
                new Option("Single notification to NCA covering both", "Üks teavitus pädevale asutusele mõlemale", 25, "DORA and GDPR have different notification channels and requirements.", 0, 20)
            )
        ));
        phases.add(p1);

        Phase p2 = new Phase("classification", "Classification & Notification", "Klassifitseerimine ja teavitamine", 240, 480);
        p2.decisions.add(new Decision(
            "Classify this incident considering data loss, client impact, and duration of the breach.",
            "Klassifitseerige see intsident, arvestades andmekadu, kliendimõju ja rikkumise kestust.",
            List.of(
                new Option("Major ICT incident with significant data loss affecting 50,000+ clients over 3 months", "Oluline IKT intsident märkimisväärse andmekaoga, mis mõjutab 50 000+ klienti 3 kuu jooksul", 95, "Correct classification. All DORA Art. 18 criteria exceeded for major classification.", 0, 0),
                new Option("Significant incident but below major threshold", "Oluline intsident, kuid alla suure künnise", 15, "50,000 affected clients clearly exceeds major incident thresholds.", 0, 25),
                new Option("Data incident, not an ICT incident", "Andmeintsident, mitte IKT intsident", 10, "Data breaches through ICT systems are ICT-related incidents under DORA.", 1, 20)
            )
        ));
        p2.decisions.add(new Decision(
            "What client notification approach do you take?",
            "Millist kliendi teavitamise lähenemist kasutate?",
            List.of(
                new Option("Direct notification to all affected clients with breach details, risks, and protective measures", "Otsene teavitamine kõigile mõjutatud klientidele rikkumise üksikasjadega, riskidega ja kaitsemeetmetega", 90, "Transparent and compliant. Clients can take protective action.", 0, 0),
                new Option("General security advisory without confirming a breach", "Üldine turvasoovitus ilma rikkumist kinnitamata", 25, "Evasive communication violates notification requirements. Trust damaged when truth emerges.", 1, 10),
                new Option("Notify only clients whose financial data was compromised", "Teavitage ainult kliente, kelle finantsandmed said ohustatud", 50, "Partial notification. All 50,000 affected clients should be informed.", 0, 5)
            )
        ));
        phases.add(p2);

        Phase p3 = new Phase("containment", "Containment & Recovery", "Ohjeldamine ja taastamine", 480, 4320);
        p3.decisions.add(new Decision(
            "How do you ensure no further data exfiltration?",
            "Kuidas tagate, et edasist andmete eksfiltreerimist ei toimu?",
            List.of(
                new Option("Deploy DLP controls, enhanced monitoring, network segmentation, and access review", "Rakendage DLP kontrolle, täiustatud seiret, võrgu segmenteerimist ja ligipääsu ülevaatust", 95, "Comprehensive containment prevents recurrence.", 0, 0),
                new Option("Block the identified exfiltration IP addresses", "Blokeerige tuvastatud eksfiltreerimise IP-aadressid", 35, "Attackers use different IPs. Blocking known ones is insufficient.", 2, 20),
                new Option("Disconnect all external network connections", "Ühendage lahti kõik välised võrguühendused", 40, "Extreme measure causing total service outage. Not proportionate.", 0, 15)
            )
        ));
        p3.decisions.add(new Decision(
            "Affected clients request compensation. How do you respond?",
            "Mõjutatud kliendid nõuavad hüvitist. Kuidas vastate?",
            List.of(
                new Option("Offer credit monitoring services and engage legal for compensation framework", "Pakkuge krediidiseire teenuseid ja kaasake juriidiline osakond hüvitise raamistiku jaoks", 85, "Proactive support demonstrates good faith. Legal framework limits exposure.", 0, 0),
                new Option("Refer all claims to legal department", "Suunake kõik nõuded juriidilisele osakonnale", 50, "Legalistic approach damages customer relationship.", 0, 5),
                new Option("Deny responsibility until investigation is complete", "Eitake vastutust kuni uurimise lõpetamiseni", 15, "Adversarial stance. Regulators view negatively.", 1, 10)
            )
        ));
        p3.decisions.add(new Decision(
            "The breach exposed weaknesses in your data encryption. What do you do?",
            "Rikkumine paljastas nõrkused teie andmete krüpteerimises. Mida teete?",
            List.of(
                new Option("Implement end-to-end encryption, key rotation, tokenization for sensitive data", "Rakendage otsast lõpuni krüpteerimist, võtmete rotatsiooni, tundlike andmete tokeniseerimist", 95, "Comprehensive encryption upgrade addresses root cause.", 0, 0),
                new Option("Encrypt the specific database that was breached", "Krüpteerige konkreetne andmebaas, mis sai rünnatud", 45, "Addresses one system but leaves similar vulnerabilities elsewhere.", 1, 10),
                new Option("Add this to next quarter's security roadmap", "Lisage see järgmise kvartali turbe tegevuskavasse", 15, "Unacceptable delay for a critical vulnerability. Regulators expect immediate action.", 0, 20)
            )
        ));
        phases.add(p3);

        Phase p4 = new Phase("reporting", "Reporting & Lessons Learned", "Aruandlus ja õppetunnid", 4320, 43200);
        p4.decisions.add(new Decision(
            "Your final report must cover root cause, impact, and remediation. What is the most critical finding?",
            "Teie lõpparuanne peab hõlmama algpõhjust, mõju ja parandusmeetmeid. Mis on kõige kriitilisem leid?",
            List.of(
                new Option("3-month detection gap indicates inadequate monitoring per DORA Art. 10-11", "3-kuuline tuvastamise vahe viitab ebapiisavale seirele DORA Art. 10-11 alusel", 95, "Root cause analysis identifies the governance failure. Regulatory expectations met.", 0, 0),
                new Option("Technical vulnerability in the breached application", "Tehniline haavatavus rünnatud rakenduses", 50, "Addresses one symptom but not the systemic monitoring gap.", 0, 5),
                new Option("Employee who clicked the phishing link", "Töötaja, kes klõpsas andmepüügilingile", 15, "Blaming individuals ignores systemic controls failure.", 0, 10)
            )
        ));
        p4.decisions.add(new Decision(
            "How do you update your ICT risk management framework after this incident?",
            "Kuidas uuendate oma IKT riskijuhtimise raamistikku pärast seda intsidenti?",
            List.of(
                new Option("Comprehensive update: risk assessment, controls, monitoring, training, and third-party oversight", "Terviklik uuendus: riskihindamine, kontrollid, seire, koolitused ja kolmanda osapoole järelevalve", 95, "Full framework update per DORA Art. 6. Board-level approval obtained.", 0, 0),
                new Option("Update risk register and add monitoring controls", "Uuendage riskiregistrit ja lisage seirekontrollid", 55, "Partial update addresses immediate gaps but misses broader framework improvements.", 0, 5),
                new Option("File the incident report and close the case", "Esitage intsidendi aruanne ja sulgege juhtum", 10, "No remediation. High likelihood of repeat incident.", 1, 10)
            )
        ));
        phases.add(p4);

        return phases;
    }

    private static List<Phase> buildDDoSPhases() {
        List<Phase> phases = new ArrayList<>();

        Phase p1 = new Phase("detection", "Detection & Initial Response", "Tuvastamine ja esmane reageerimine", 0, 240);
        p1.decisions.add(new Decision(
            "Traffic to your services spikes 500x normal levels. Web and API endpoints are unresponsive. What do you do?",
            "Liiklus teie teenuste poole tõuseb 500 korda üle normaalse taseme. Veeb ja API lõpp-punktid ei reageeri. Mida teete?",
            List.of(
                new Option("Activate DDoS mitigation service, enable rate limiting, reroute traffic through scrubbing center", "Aktiveerige DDoS leevendamise teenus, lubage kiirusepiirangud, suunake liiklus puhastuskeskuse kaudu", 95, "Professional mitigation activated. Legitimate traffic flows resume within minutes.", 0, 0),
                new Option("Increase server capacity to absorb the traffic", "Suurendage serveri võimsust liikluse neelamiseks", 25, "Auto-scaling cannot match 500x volumes. Costs skyrocket without resolving the attack.", 2, 30),
                new Option("Block all incoming traffic temporarily", "Blokeerige ajutiselt kogu sissetulev liiklus", 50, "Stops the attack but also blocks all legitimate users. Service effectively down.", 0, 10)
            )
        ));
        p1.decisions.add(new Decision(
            "The attack appears to target your payment processing API specifically. How do you respond?",
            "Rünnak näib olevat suunatud konkreetselt teie maksete töötlemise API-le. Kuidas reageerite?",
            List.of(
                new Option("Isolate payment API behind additional WAF rules while maintaining other services", "Isoleerige makste API täiendavate WAF reeglite taha, säilitades muud teenused", 90, "Targeted protection. Payment processing restored via filtered path.", 0, 0),
                new Option("Temporarily disable the payment API", "Keelake ajutiselt makste API", 55, "Stops the attack target but payment processing is unavailable.", 1, 15),
                new Option("Switch to backup payment processor immediately", "Lülituge kohe varuprotsessori maksete töötlemisele", 65, "Good fallback but primary system still under attack.", 0, 5)
            )
        ));
        p1.decisions.add(new Decision(
            "How do you determine if this DDoS is covering a more targeted attack?",
            "Kuidas teete kindlaks, kas see DDoS varjab sihitumat rünnakut?",
            List.of(
                new Option("Parallel analysis: SOC monitors for anomalous internal activity while DDoS is mitigated", "Paralleelanalüüs: SOC jälgib ebatavalist sisemist tegevust, samal ajal kui DDoS-i leevendatakse", 95, "Correct approach. DDoS is often a distraction for data theft or lateral movement.", 0, 0),
                new Option("Focus entirely on stopping the DDoS first", "Keskenduge täielikult esmalt DDoS-i peatamisele", 35, "Tunnel vision. Secondary attack may be ongoing undetected.", 2, 20),
                new Option("Assume it's just a volumetric attack", "Eeldage, et see on ainult mahuline rünnak", 15, "Dangerous assumption. Missed secondary intrusion discovered weeks later.", 3, 30)
            )
        ));
        phases.add(p1);

        Phase p2 = new Phase("classification", "Classification & Notification", "Klassifitseerimine ja teavitamine", 240, 480);
        p2.decisions.add(new Decision(
            "The DDoS attack has disrupted services for 2 hours. 100,000+ customers affected. Classification?",
            "DDoS rünnak on häirinud teenuseid 2 tundi. 100 000+ klienti mõjutatud. Klassifikatsioon?",
            List.of(
                new Option("Major ICT incident - high client impact, service unavailability exceeds thresholds", "Oluline IKT intsident – suur kliendimõju, teenuse kättesaamatus ületab künnised", 95, "Correct. Duration + client impact clearly exceeds major incident criteria.", 0, 0),
                new Option("Significant operational disruption but not major", "Oluline operatiivne häire, kuid mitte suur", 25, "100,000+ affected clients clearly qualifies as major under DORA.", 0, 20),
                new Option("External attack - classify as security event only", "Väline rünnak – klassifitseerige ainult turvasündmusena", 15, "Impact on services makes this an ICT incident regardless of external origin.", 1, 15)
            )
        ));
        p2.decisions.add(new Decision(
            "Should you notify clients about the service disruption?",
            "Kas peaksite kliente teenuse häiretest teavitama?",
            List.of(
                new Option("Yes, proactive status page update and direct notification to affected clients", "Jah, ennetav olekuleht uuendus ja otsene teavitamine mõjutatud klientidele", 90, "Transparent communication. Clients redirected to alternative channels.", 0, 0),
                new Option("Only update the status page, no direct notifications", "Uuendage ainult olekuleht, otseseid teavitusi pole", 55, "Passive approach. Many clients unaware of alternative options.", 0, 5),
                new Option("Wait until services are restored before communicating", "Oodake enne suhtlemist teenuste taastamiseni", 20, "Clients frustrated by lack of information. Social media complaints escalate.", 1, 15)
            )
        ));
        phases.add(p2);

        Phase p3 = new Phase("containment", "Containment & Recovery", "Ohjeldamine ja taastamine", 480, 4320);
        p3.decisions.add(new Decision(
            "DDoS mitigation is working but attack vectors are evolving. How do you adapt?",
            "DDoS leevendamine töötab, kuid ründevektorid arenevad. Kuidas kohanete?",
            List.of(
                new Option("Continuous threat intelligence sharing with ISP and mitigation provider, adaptive rules", "Pidev ohuteabe jagamine ISP ja leevenduspakkujaga, kohanduvad reeglid", 95, "Collaborative defense. Attack effectively neutralized within hours.", 0, 0),
                new Option("Keep current mitigation rules and hope the attack subsides", "Hoidke praegused leevendusreeglid ja lootke, et rünnak vaibub", 25, "Static defense against evolving attack. Service disruptions continue.", 2, 30),
                new Option("Engage law enforcement to trace attackers", "Kaasake õiguskaitseasutused ründajate jälitamiseks", 50, "Good long-term action but doesn't help with immediate mitigation.", 0, 10)
            )
        ));
        p3.decisions.add(new Decision(
            "How do you ensure service resilience against future DDoS attacks?",
            "Kuidas tagate teenuse vastupidavuse tulevaste DDoS rünnakute vastu?",
            List.of(
                new Option("CDN deployment, anycast routing, auto-scaling, and DDoS protection as permanent service", "CDN juurutamine, anycast marsruutimine, automaatne skaleerimine ja DDoS kaitse püsiteenusena", 90, "Architecture-level resilience. Future attacks have minimal impact.", 0, 0),
                new Option("Subscribe to DDoS protection service", "Tellige DDoS kaitse teenus", 60, "Good but doesn't address architectural vulnerabilities.", 0, 5),
                new Option("Increase bandwidth capacity", "Suurendage ribalaiuse võimsust", 25, "Bandwidth alone cannot absorb volumetric attacks. Cost-ineffective.", 1, 10)
            )
        ));
        p3.decisions.add(new Decision(
            "Payment processing was down for 3 hours. How do you handle pending transactions?",
            "Maksete töötlemine oli 3 tundi maas. Kuidas käsitlete ootel tehinguid?",
            List.of(
                new Option("Reconcile all pending transactions, process queued payments, verify no duplicates", "Kooskõlastage kõik ootel tehingud, töödelge järjekorras makseid, kontrollige duplikaatide puudumist", 90, "Complete reconciliation. All transactions accounted for. No financial impact to clients.", 0, 0),
                new Option("Restart payment processing and let the system catch up", "Taaskäivitage maksete töötlemine ja laske süsteemil järele jõuda", 40, "No verification. Duplicate or missed transactions possible.", 1, 15),
                new Option("Ask clients to re-submit failed transactions", "Paluge klientidel ebaõnnestunud tehingud uuesti esitada", 30, "Poor experience. Risk of duplicate payments.", 1, 10)
            )
        ));
        phases.add(p3);

        Phase p4 = new Phase("reporting", "Reporting & Lessons Learned", "Aruandlus ja õppetunnid", 4320, 43200);
        p4.decisions.add(new Decision(
            "What is the key resilience lesson from this DDoS incident?",
            "Mis on selle DDoS intsidendi peamine vastupidavuse õppetund?",
            List.of(
                new Option("Need for permanent DDoS protection, multi-layer defense, and regular attack simulation testing", "Vajadus püsiva DDoS kaitse, mitmekihilise kaitse ja regulaarse ründesimulatsioonide testimise järele", 95, "Comprehensive lesson addressing architecture, process, and testing.", 0, 0),
                new Option("Need better DDoS mitigation vendor", "Vajadus parema DDoS leevenduse pakkuja järele", 35, "Vendor-focused lesson misses architectural improvements.", 0, 5),
                new Option("DDoS attacks are unpredictable and cannot be fully prevented", "DDoS rünnakud on ettearvamatud ja neid ei saa täielikult ära hoida", 15, "Defeatist conclusion. Modern DDoS mitigation is highly effective.", 0, 10)
            )
        ));
        p4.decisions.add(new Decision(
            "How do you test your improved DDoS resilience?",
            "Kuidas testite oma parandatud DDoS vastupidavust?",
            List.of(
                new Option("Scheduled DDoS simulation tests as part of DORA Art. 24-25 resilience testing program", "Planeeritud DDoS simulatsioonitestid DORA Art. 24-25 vastupidavuse testimise programmi raames", 95, "Regular testing validates improvements. Compliance with resilience testing requirements.", 0, 0),
                new Option("Rely on the DDoS protection vendor's testing", "Tuginege DDoS kaitse pakkuja testimisele", 40, "Third-party testing doesn't validate your specific architecture.", 0, 5),
                new Option("No testing needed - the real attack was our test", "Testimine pole vajalik – tegelik rünnak oli meie test", 10, "Reactive approach. No assurance that improvements are effective.", 1, 10)
            )
        ));
        phases.add(p4);

        return phases;
    }

    private static List<Phase> buildSupplyChainPhases() {
        List<Phase> phases = new ArrayList<>();

        Phase p1 = new Phase("detection", "Detection & Initial Response", "Tuvastamine ja esmane reageerimine", 0, 240);
        p1.decisions.add(new Decision(
            "A CERT advisory reveals a backdoor in a widely-used library present in your infrastructure. What is your first action?",
            "CERT-i nõuanne paljastab tagaukse laialdaselt kasutatavas teegis, mis on teie taristus olemas. Mis on teie esimene toiming?",
            List.of(
                new Option("Inventory all systems using the compromised library, assess exposure, isolate critical systems", "Inventeerige kõik süsteemid, mis kasutavad kompromiteeritud teeki, hindake kokkupuudet, isoleerige kriitilised süsteemid", 95, "Systematic response. Exposure mapped within hours. Critical systems protected.", 0, 0),
                new Option("Immediately patch/update the library across all systems", "Uuendage kohe teeki kõigis süsteemides", 50, "Hasty patching without testing may cause compatibility issues. Some systems missed.", 1, 15),
                new Option("Wait for the vendor to release an official fix", "Oodake, kuni müüja avaldab ametliku paranduse", 20, "Passive approach while backdoor remains exploitable. Attacker access continues.", 3, 45)
            )
        ));
        p1.decisions.add(new Decision(
            "Forensics shows the backdoor was active for 6 weeks. How do you assess the potential damage?",
            "Kohtuekspertiis näitab, et tagauks oli aktiivne 6 nädalat. Kuidas hindate potentsiaalset kahju?",
            List.of(
                new Option("Review 6 weeks of logs for all affected systems, check for data exfiltration and lateral movement", "Vaadake üle 6 nädala logid kõigis mõjutatud süsteemides, kontrollige andmete eksfiltreerimist ja külgliikumist", 95, "Thorough analysis reveals limited exploitation. Full timeline established.", 0, 0),
                new Option("Check only the most critical systems for compromise", "Kontrollige kompromiteerimist ainult kõige kriitilisemates süsteemides", 45, "Partial analysis. Compromised non-critical systems may serve as pivot points.", 1, 15),
                new Option("Assume worst case and trigger full incident response for all systems", "Eeldage halvima stsenaariumit ja käivitage täielik intsidendile reageerimine kõigi süsteemide jaoks", 60, "Conservative but resource-intensive. May overwhelm incident response capacity.", 0, 10)
            )
        ));
        p1.decisions.add(new Decision(
            "The compromised library was supplied by a critical ICT third-party provider. How do you engage them?",
            "Kompromiteeritud teeki tarnis kriitiline IKT kolmanda osapoole pakkuja. Kuidas te nendega suhtlete?",
            List.of(
                new Option("Formal notification per contract terms, request incident report, assess ongoing risk, involve legal", "Ametlik teavitamine lepingutingimuste alusel, nõudke intsidendi aruannet, hindake jätkuvat riski, kaasake juriidiline osakond", 90, "Contractual rights exercised. Provider accountability established. DORA Art. 30 provisions invoked.", 0, 0),
                new Option("Inform the provider and ask them to fix it", "Teavitage pakkujat ja paluge neil see parandada", 40, "Informal approach. No accountability trail. Contract provisions not leveraged.", 0, 10),
                new Option("Immediately terminate the contract and switch providers", "Lõpetage kohe leping ja vahetage pakkujaid", 20, "Hasty termination without exit strategy causes more disruption.", 2, 30)
            )
        ));
        phases.add(p1);

        Phase p2 = new Phase("classification", "Classification & Notification", "Klassifitseerimine ja teavitamine", 240, 480);
        p2.decisions.add(new Decision(
            "This supply chain compromise affects multiple financial institutions. How does this change your classification?",
            "See tarneahela kompromiteerimine mõjutab mitut finantsasutust. Kuidas see muudab teie klassifikatsiooni?",
            List.of(
                new Option("Major incident with cross-institution impact - coordinate with sector CERT and NCA", "Oluline intsident institutsioonideülese mõjuga – koordineerige sektori CERT-i ja pädev asutusega", 95, "Correct. Cross-sector impact elevates severity. DORA Art. 45 information sharing triggered.", 0, 0),
                new Option("Classify based on our organization's impact only", "Klassifitseerige ainult meie organisatsiooni mõju põhjal", 35, "Narrow view. Cross-sector coordination critical for supply chain incidents.", 0, 15),
                new Option("Wait for the sector CERT to provide guidance on classification", "Oodake, kuni sektori CERT annab klassifitseerimise juhised", 25, "Passive. Each entity must independently classify per DORA requirements.", 1, 20)
            )
        ));
        p2.decisions.add(new Decision(
            "Your NCA requests details about your third-party risk management for this provider. What do you provide?",
            "Teie pädev asutus küsib üksikasju teie kolmanda osapoole riskijuhtimise kohta selle pakkuja osas. Mida esitate?",
            List.of(
                new Option("Complete RoI entry, due diligence records, audit reports, SLA performance, and exit strategy", "Täielik RoI kirje, hoolsuskohustuse dokumendid, auditiaruanded, SLA tulemused ja väljumisstrateegia", 95, "Comprehensive documentation demonstrates robust third-party governance.", 0, 0),
                new Option("Contract and basic vendor assessment", "Leping ja põhiline pakkuja hindamine", 40, "Minimal documentation. NCA concerned about third-party oversight adequacy.", 0, 10),
                new Option("Explain this was a zero-day issue beyond our control", "Selgitage, et see oli nullpäeva probleem väljaspool meie kontrolli", 15, "Deflecting responsibility. DORA requires oversight regardless of attack sophistication.", 1, 15)
            )
        ));
        phases.add(p2);

        Phase p3 = new Phase("containment", "Containment & Recovery", "Ohjeldamine ja taastamine", 480, 4320);
        p3.decisions.add(new Decision(
            "The vendor has released a patch. How do you deploy it safely?",
            "Müüja on avaldanud paiga. Kuidas seda turvaliselt juurutate?",
            List.of(
                new Option("Test in isolated environment, verify patch integrity, staged rollout to production, monitor closely", "Testige isoleeritud keskkonnas, kontrollige paiga terviklust, järkjärguline tootmisse juurutamine, hoolsalt jälgimine", 95, "Controlled deployment. Patch verified and rolled out safely.", 0, 0),
                new Option("Deploy immediately to all systems in production", "Juurutage kohe kõikidele tootmissüsteemidele", 30, "No testing. Patch incompatibility causes additional service disruption.", 2, 20),
                new Option("Wait for other institutions to patch first and report results", "Oodake, kuni teised asutused esmalt paigaldavad ja tulemusi raporteerivad", 20, "Delayed patching extends vulnerability window. Attacks may target unpatched systems.", 1, 30)
            )
        ));
        p3.decisions.add(new Decision(
            "How do you strengthen your supply chain resilience after this incident?",
            "Kuidas tugevdate oma tarneahela vastupidavust pärast seda intsidenti?",
            List.of(
                new Option("SBOM requirements for all vendors, enhanced due diligence, regular security audits, contractual security clauses", "SBOM nõuded kõigile müüjatele, täiustatud hoolsuskohustus, regulaarsed turvaauditid, lepingulised turvaklauslid", 95, "Comprehensive supply chain security program per DORA Art. 28-30.", 0, 0),
                new Option("Add security requirements to new vendor contracts", "Lisage turvanõuded uutesse müüjalepingutesse", 50, "Forward-looking but doesn't address existing vendor risks.", 0, 5),
                new Option("Reduce the number of third-party dependencies", "Vähendage kolmanda osapoole sõltuvuste arvu", 40, "Difficult to achieve and may increase concentration risk.", 0, 10)
            )
        ));
        p3.decisions.add(new Decision(
            "Other financial institutions contact you asking about the compromise. How do you respond?",
            "Teised finantsasutused võtavad teiega ühendust, küsides kompromiteerimise kohta. Kuidas vastate?",
            List.of(
                new Option("Share IOCs and technical details through established information sharing arrangements", "Jagage IOC-sid ja tehnilisi üksikasju kehtivate teabevahetuse kokkulepete kaudu", 95, "DORA Art. 45 information sharing. Sector resilience improved.", 0, 0),
                new Option("Share limited information to avoid reputational damage", "Jagage piiratud teavet maine kahjustamise vältimiseks", 35, "Self-interest undermines sector cooperation. Reputation suffers more long-term.", 0, 10),
                new Option("Decline to share - this is confidential incident information", "Keelduge jagamast – see on konfidentsiaalne intsidendi teave", 15, "DORA encourages and facilitates information sharing for sector resilience.", 1, 15)
            )
        ));
        phases.add(p3);

        Phase p4 = new Phase("reporting", "Reporting & Lessons Learned", "Aruandlus ja õppetunnid", 4320, 43200);
        p4.decisions.add(new Decision(
            "What systemic change do you recommend to your board?",
            "Millist süsteemset muudatust soovitate oma juhatusele?",
            List.of(
                new Option("Establish software supply chain security program with SBOM, continuous monitoring, and vendor security assessments", "Looge tarkvara tarneahela turbeprogramm koos SBOM-i, pideva seire ja müüjate turvahindamistega", 95, "Board-level commitment to supply chain security. Budget allocated for ongoing program.", 0, 0),
                new Option("Increase vendor audit frequency", "Suurendage müüja auditite sagedust", 45, "Tactical improvement but not strategic. Doesn't address systemic vulnerability.", 0, 5),
                new Option("Accept supply chain risk as inherent to modern operations", "Nõustuge tarneahela riskiga kui kaasaegsete toimingute loomulik osa", 15, "Risk acceptance without mitigation violates DORA requirements.", 0, 10)
            )
        ));
        p4.decisions.add(new Decision(
            "How do you update your DORA resilience testing to include supply chain scenarios?",
            "Kuidas uuendate oma DORA vastupidavuse testimist, et hõlmata tarneahela stsenaariume?",
            List.of(
                new Option("Add supply chain compromise scenarios to TLPT program, test vendor incident response, validate exit strategies", "Lisage tarneahela kompromiteerimise stsenaariumid TLPT programmi, testige müüja intsidendile reageerimist, valideerige väljumisstrateegiaid", 95, "Comprehensive testing program. DORA Art. 24-27 requirements exceeded.", 0, 0),
                new Option("Include vendor assessment in annual penetration testing", "Lisage müüja hindamine aastasesse penetratsioonitestimisse", 50, "Good addition but limited scope compared to full supply chain testing.", 0, 5),
                new Option("Vendor testing is the vendor's responsibility", "Müüja testimine on müüja vastutus", 10, "DORA requires the financial entity to test its resilience, including third-party dependencies.", 0, 10)
            )
        ));
        phases.add(p4);

        return phases;
    }

    // ========== PUBLIC API ==========

    public List<Map<String, Object>> getScenarios(String userId, String sessionId) {
        boolean isPremium = subscriptionGuard.isPremium(userId, sessionId);
        boolean isEnterprise = subscriptionGuard.isEnterprise(userId, sessionId);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> scenario : SCENARIOS) {
            Map<String, Object> item = new LinkedHashMap<>(scenario);
            String tier = (String) scenario.get("tier");
            boolean locked;
            if ("FREE".equals(tier)) {
                locked = false;
            } else if ("ENTERPRISE".equals(tier)) {
                locked = !isEnterprise;
            } else {
                locked = !isPremium;
            }
            item.put("locked", locked);
            result.add(item);
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> startSimulation(String userId, String sessionId, String scenarioId) {
        // Validate scenario
        Map<String, Object> scenario = SCENARIOS.stream()
            .filter(s -> s.get("id").equals(scenarioId))
            .findFirst().orElse(null);
        if (scenario == null) {
            return Map.of("error", "Unknown scenario");
        }

        // Tier check
        String tier = (String) scenario.get("tier");
        boolean isPremium = subscriptionGuard.isPremium(userId, sessionId);
        boolean isEnterprise = subscriptionGuard.isEnterprise(userId, sessionId);
        if ("STANDARD".equals(tier) && !isPremium) {
            return Map.of("error", "This scenario requires a Standard or higher subscription");
        }
        if ("ENTERPRISE".equals(tier) && !isEnterprise) {
            return Map.of("error", "This scenario requires an Enterprise subscription");
        }

        String simSessionId = UUID.randomUUID().toString();
        String sessionKey = userId + ":" + simSessionId;

        Map<String, Object> graphData = buildFallbackGraph(scenarioId);
        String targetNodeId = "target-1";
        List<Map<String, Object>> cascadeAffected = new ArrayList<>();

        // Get phases for this scenario
        List<Phase> phases = ALL_PHASES.getOrDefault(scenarioId, ALL_PHASES.get("ransomware"));

        // Create session
        WarRoomSession session = new WarRoomSession();
        session.sessionId = simSessionId;
        session.userId = userId;
        session.scenarioId = scenarioId;
        session.graphData = graphData;
        session.targetNodeId = targetNodeId;
        session.initialCascade = cascadeAffected;
        session.phases = phases;
        session.currentPhaseIndex = 0;
        session.currentDecisionIndex = 0;
        session.simTimeMinutes = 0;
        session.startedAt = Instant.now().toString();
        session.state = "SIMULATION";
        session.totalCascadeSpread = cascadeAffected.size();

        sessions.put(sessionKey, session);

        // Build first phase response
        Phase firstPhase = phases.get(0);
        Decision firstDecision = firstPhase.decisions.get(0);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("sessionId", simSessionId);
        result.put("scenario", scenario);
        result.put("graphData", graphData);
        result.put("targetNodeId", targetNodeId);
        result.put("initialCascade", cascadeAffected);
        result.put("currentPhase", buildPhaseResponse(firstPhase, 0, phases.size()));
        result.put("currentDecision", buildDecisionResponse(firstDecision, 0));
        result.put("simTimeMinutes", 0);
        result.put("deadlines", buildDeadlines());
        result.put("state", "SIMULATION");
        return result;
    }

    public Map<String, Object> submitDecision(String userId, String simSessionId, int optionIndex) {
        String sessionKey = userId + ":" + simSessionId;
        WarRoomSession session = sessions.get(sessionKey);
        if (session == null) {
            return Map.of("error", "Session not found");
        }
        if (!"SIMULATION".equals(session.state)) {
            return Map.of("error", "Simulation is not active");
        }

        synchronized (session) {
            Phase currentPhase = session.phases.get(session.currentPhaseIndex);
            Decision currentDecision = currentPhase.decisions.get(session.currentDecisionIndex);

            if (optionIndex < 0 || optionIndex >= currentDecision.options.size()) {
                return Map.of("error", "Invalid option index");
            }

            Option chosen = currentDecision.options.get(optionIndex);

            // Record decision
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("phaseId", currentPhase.id);
            record.put("phaseName", currentPhase.name);
            record.put("decisionIndex", session.currentDecisionIndex);
            record.put("optionIndex", optionIndex);
            record.put("optionText", chosen.text);
            record.put("qualityScore", chosen.qualityScore);
            record.put("consequence", chosen.consequence);
            record.put("cascadeSpread", chosen.cascadeSpread);
            record.put("timePenaltyMinutes", chosen.timePenaltyMinutes);
            session.decisions.add(record);

            // Apply effects
            session.totalCascadeSpread += chosen.cascadeSpread;
            session.simTimeMinutes += currentPhase.durationEndMinutes - currentPhase.durationStartMinutes;
            session.simTimeMinutes += chosen.timePenaltyMinutes;

            // Build cascade update
            List<Map<String, Object>> newCascade = new ArrayList<>();
            for (int i = 0; i < chosen.cascadeSpread; i++) {
                newCascade.add(Map.of("id", "cascade-" + UUID.randomUUID().toString().substring(0, 8), "type", "asset"));
            }

            // Advance to next decision or phase
            session.currentDecisionIndex++;
            boolean phaseComplete = session.currentDecisionIndex >= currentPhase.decisions.size();
            boolean simulationComplete = false;

            if (phaseComplete) {
                session.currentPhaseIndex++;
                session.currentDecisionIndex = 0;
                simulationComplete = session.currentPhaseIndex >= session.phases.size();
                if (simulationComplete) {
                    session.state = "RESULTS";
                }
            }

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("feedback", chosen.consequence);
            result.put("feedbackEt", chosen.consequenceEt != null ? chosen.consequenceEt : chosen.consequence);
            result.put("qualityScore", chosen.qualityScore);
            result.put("cascadeSpread", chosen.cascadeSpread);
            result.put("newCascade", newCascade);
            result.put("timePenaltyMinutes", chosen.timePenaltyMinutes);
            result.put("simTimeMinutes", session.simTimeMinutes);
            result.put("totalCascadeSpread", session.totalCascadeSpread);
            result.put("phaseComplete", phaseComplete);
            result.put("simulationComplete", simulationComplete);

            if (!simulationComplete) {
                Phase nextPhase = session.phases.get(session.currentPhaseIndex);
                Decision nextDecision = nextPhase.decisions.get(session.currentDecisionIndex);
                result.put("currentPhase", buildPhaseResponse(nextPhase, session.currentPhaseIndex, session.phases.size()));
                result.put("currentDecision", buildDecisionResponse(nextDecision, session.currentDecisionIndex));
            }

            result.put("deadlines", buildDeadlinesWithTime(session.simTimeMinutes));
            return result;
        }
    }

    public Map<String, Object> completeSimulation(String userId, String simSessionId) {
        String sessionKey = userId + ":" + simSessionId;
        WarRoomSession session = sessions.get(sessionKey);
        if (session == null) {
            return Map.of("error", "Session not found");
        }

        synchronized (session) {
            if (session.cachedResult != null) return session.cachedResult;
            session.completedAt = Instant.now().toString();
            session.state = "RESULTS";

            // Calculate scores
            int totalDecisions = session.decisions.size();
            if (totalDecisions == 0) {
                return Map.of("error", "No decisions made");
            }

            // Decision Quality (average of quality scores)
            double totalQuality = 0;
            for (Map<String, Object> d : session.decisions) {
                totalQuality += ((Number) d.get("qualityScore")).intValue();
            }
            int decisionQuality = (int) Math.round(totalQuality / totalDecisions);

            // DORA Compliance (based on classification & reporting decisions)
            int doraCompliance = calculateDoraCompliance(session);

            // Containment (based on cascade spread - fewer is better)
            int maxPossibleCascade = totalDecisions * 3; // max 3 per decision
            int actualCascade = session.totalCascadeSpread - session.initialCascade.size();
            int containment = Math.max(0, Math.min(100, 100 - (actualCascade * 100 / Math.max(1, maxPossibleCascade))));

            // Time Management (based on time penalties)
            int totalTimePenalty = 0;
            for (Map<String, Object> d : session.decisions) {
                totalTimePenalty += ((Number) d.get("timePenaltyMinutes")).intValue();
            }
            int maxTimePenalty = totalDecisions * 60; // max 60 min penalty per decision
            int timeManagement = Math.max(0, Math.min(100, 100 - (totalTimePenalty * 100 / Math.max(1, maxTimePenalty))));

            // Overall = weighted average
            int overall = (int) Math.round(doraCompliance * 0.30 + containment * 0.20 + decisionQuality * 0.35 + timeManagement * 0.15);

            String grade;
            if (overall >= 90) grade = "A";
            else if (overall >= 80) grade = "B";
            else if (overall >= 70) grade = "C";
            else if (overall >= 60) grade = "D";
            else grade = "F";

            Map<String, Object> report = new LinkedHashMap<>();
            report.put("sessionId", simSessionId);
            report.put("scenarioId", session.scenarioId);
            report.put("grade", grade);
            report.put("overall", overall);
            report.put("scores", Map.of(
                "doraCompliance", doraCompliance,
                "containment", containment,
                "decisionQuality", decisionQuality,
                "timeManagement", timeManagement
            ));
            report.put("decisions", session.decisions);
            report.put("totalCascadeSpread", session.totalCascadeSpread);
            report.put("simTimeMinutes", session.simTimeMinutes);
            report.put("startedAt", session.startedAt);
            report.put("completedAt", session.completedAt);

            session.cachedResult = report;
            return report;
        }
    }

    public Map<String, Object> getSession(String userId, String simSessionId) {
        String sessionKey = userId + ":" + simSessionId;
        WarRoomSession session = sessions.get(sessionKey);
        if (session == null) {
            return Map.of("error", "Session not found");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("sessionId", session.sessionId);
        result.put("scenarioId", session.scenarioId);
        result.put("state", session.state);
        result.put("simTimeMinutes", session.simTimeMinutes);
        result.put("totalCascadeSpread", session.totalCascadeSpread);
        result.put("graphData", session.graphData);
        result.put("targetNodeId", session.targetNodeId);
        result.put("decisions", session.decisions);
        result.put("deadlines", buildDeadlinesWithTime(session.simTimeMinutes));

        if ("SIMULATION".equals(session.state) && session.currentPhaseIndex < session.phases.size()) {
            Phase currentPhase = session.phases.get(session.currentPhaseIndex);
            if (session.currentDecisionIndex < currentPhase.decisions.size()) {
                result.put("currentPhase", buildPhaseResponse(currentPhase, session.currentPhaseIndex, session.phases.size()));
                result.put("currentDecision", buildDecisionResponse(currentPhase.decisions.get(session.currentDecisionIndex), session.currentDecisionIndex));
            }
        }

        if (session.cachedResult != null) {
            result.put("result", session.cachedResult);
        }
        return result;
    }

    // ========== HELPERS ==========

    private int calculateDoraCompliance(WarRoomSession session) {
        int score = 70; // baseline
        for (Map<String, Object> d : session.decisions) {
            String phaseId = (String) d.get("phaseId");
            int quality = ((Number) d.get("qualityScore")).intValue();
            // Classification and reporting phases are weighted more for DORA compliance
            if ("classification".equals(phaseId) || "reporting".equals(phaseId)) {
                if (quality >= 90) score += 8;
                else if (quality >= 70) score += 4;
                else if (quality >= 40) score -= 5;
                else score -= 12;
            } else {
                if (quality >= 90) score += 3;
                else if (quality < 40) score -= 5;
            }
        }
        return Math.max(0, Math.min(100, score));
    }

    private Map<String, Object> buildPhaseResponse(Phase phase, int index, int total) {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("id", phase.id);
        p.put("name", phase.name);
        p.put("nameEt", phase.nameEt);
        p.put("phaseIndex", index);
        p.put("totalPhases", total);
        p.put("startMinutes", phase.durationStartMinutes);
        p.put("endMinutes", phase.durationEndMinutes);
        p.put("totalDecisions", phase.decisions.size());
        return p;
    }

    private Map<String, Object> buildDecisionResponse(Decision decision, int index) {
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("index", index);
        d.put("prompt", decision.prompt);
        d.put("promptEt", decision.promptEt);
        List<Map<String, Object>> options = new ArrayList<>();
        for (int i = 0; i < decision.options.size(); i++) {
            Option opt = decision.options.get(i);
            Map<String, Object> o = new LinkedHashMap<>();
            o.put("index", i);
            o.put("text", opt.text);
            o.put("textEt", opt.textEt);
            options.add(o);
        }
        d.put("options", options);
        return d;
    }

    private Map<String, Object> buildDeadlines() {
        return buildDeadlinesWithTime(0);
    }

    private Map<String, Object> buildDeadlinesWithTime(int simTimeMinutes) {
        Map<String, Object> deadlines = new LinkedHashMap<>();
        // DORA Art. 19 deadlines
        deadlines.put("initialNotification", Map.of(
            "label", "Initial Notification (Art. 19)",
            "labelEt", "Esialgne teavitamine (Art. 19)",
            "deadlineMinutes", 240,  // 4 hours
            "elapsedMinutes", simTimeMinutes,
            "status", simTimeMinutes <= 240 ? "active" : "expired"
        ));
        deadlines.put("intermediateReport", Map.of(
            "label", "Intermediate Report (Art. 19)",
            "labelEt", "Vaheraport (Art. 19)",
            "deadlineMinutes", 4320,  // 72 hours
            "elapsedMinutes", simTimeMinutes,
            "status", simTimeMinutes <= 4320 ? "active" : "expired"
        ));
        deadlines.put("finalReport", Map.of(
            "label", "Final Report (Art. 19)",
            "labelEt", "Lõpparuanne (Art. 19)",
            "deadlineMinutes", 43200,  // 30 days
            "elapsedMinutes", simTimeMinutes,
            "status", simTimeMinutes <= 43200 ? "active" : "expired"
        ));
        return deadlines;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> buildFallbackGraph(String scenarioId) {
        List<Map<String, Object>> nodes = new ArrayList<>();
        List<Map<String, Object>> edges = new ArrayList<>();

        // Core business functions
        nodes.add(Map.of("id", "f-1", "label", "Online Banking", "group", "function", "criticality", "CRITICAL"));
        nodes.add(Map.of("id", "f-2", "label", "Payment Processing", "group", "function", "criticality", "CRITICAL"));
        nodes.add(Map.of("id", "f-3", "label", "Customer Onboarding", "group", "function", "criticality", "IMPORTANT"));
        nodes.add(Map.of("id", "f-4", "label", "Regulatory Reporting", "group", "function", "criticality", "IMPORTANT"));

        // ICT assets
        nodes.add(Map.of("id", "target-1", "label", "Core Banking Server", "group", "asset", "assetType", "APPLICATION"));
        nodes.add(Map.of("id", "a-2", "label", "Transaction Database", "group", "asset", "assetType", "DATABASE"));
        nodes.add(Map.of("id", "a-3", "label", "API Gateway", "group", "asset", "assetType", "INFRASTRUCTURE"));
        nodes.add(Map.of("id", "a-4", "label", "Email System", "group", "asset", "assetType", "APPLICATION"));
        nodes.add(Map.of("id", "a-5", "label", "Backup Storage", "group", "asset", "assetType", "INFRASTRUCTURE"));

        // Providers
        nodes.add(Map.of("id", "p-1", "label", "Cloud Provider X", "group", "provider", "riskScore", 45));
        nodes.add(Map.of("id", "p-2", "label", "Payment Gateway Y", "group", "provider", "riskScore", 30));
        nodes.add(Map.of("id", "p-3", "label", "Security Vendor Z", "group", "provider", "riskScore", 20));

        // Dependencies
        edges.add(Map.of("from", "f-1", "to", "target-1", "type", "REQUIRED"));
        edges.add(Map.of("from", "f-1", "to", "a-3", "type", "REQUIRED"));
        edges.add(Map.of("from", "f-2", "to", "a-2", "type", "REQUIRED"));
        edges.add(Map.of("from", "f-2", "to", "p-2", "type", "REQUIRED"));
        edges.add(Map.of("from", "f-3", "to", "target-1", "type", "REQUIRED"));
        edges.add(Map.of("from", "f-3", "to", "a-4", "type", "OPTIONAL"));
        edges.add(Map.of("from", "f-4", "to", "a-2", "type", "REQUIRED"));
        edges.add(Map.of("from", "target-1", "to", "p-1", "type", "REQUIRED"));
        edges.add(Map.of("from", "target-1", "to", "a-5", "type", "BACKUP"));
        edges.add(Map.of("from", "a-2", "to", "p-1", "type", "REQUIRED"));
        edges.add(Map.of("from", "a-3", "to", "p-3", "type", "OPTIONAL"));

        return Map.of("nodes", nodes, "edges", edges);
    }

    // ========== INNER CLASSES ==========

    private static class WarRoomSession {
        String sessionId;
        String userId;
        String scenarioId;
        String state; // SIMULATION, RESULTS
        Map<String, Object> graphData;
        String targetNodeId;
        List<Map<String, Object>> initialCascade = new ArrayList<>();
        List<Phase> phases;
        int currentPhaseIndex;
        int currentDecisionIndex;
        int simTimeMinutes;
        int totalCascadeSpread;
        List<Map<String, Object>> decisions = Collections.synchronizedList(new ArrayList<>());
        String startedAt;
        volatile String completedAt;
        volatile Map<String, Object> cachedResult;
    }

    private static class Phase {
        String id;
        String name;
        String nameEt;
        int durationStartMinutes;
        int durationEndMinutes;
        List<Decision> decisions = new ArrayList<>();

        Phase(String id, String name, String nameEt, int startMinutes, int endMinutes) {
            this.id = id;
            this.name = name;
            this.nameEt = nameEt;
            this.durationStartMinutes = startMinutes;
            this.durationEndMinutes = endMinutes;
        }
    }

    private static class Decision {
        String prompt;
        String promptEt;
        List<Option> options;

        Decision(String prompt, String promptEt, List<Option> options) {
            this.prompt = prompt;
            this.promptEt = promptEt;
            this.options = options;
        }
    }

    private static class Option {
        String text;
        String textEt;
        int qualityScore;
        String consequence;
        String consequenceEt;
        int cascadeSpread;
        int timePenaltyMinutes;

        Option(String text, String textEt, int qualityScore, String consequence, int cascadeSpread, int timePenaltyMinutes) {
            this.text = text;
            this.textEt = textEt;
            this.qualityScore = qualityScore;
            this.consequence = consequence;
            this.cascadeSpread = cascadeSpread;
            this.timePenaltyMinutes = timePenaltyMinutes;
        }
    }
}
