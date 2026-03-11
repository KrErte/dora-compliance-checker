package com.dorachecker.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class StressTestService {

    private static final Logger log = LoggerFactory.getLogger(StressTestService.class);
    private static final long SESSION_TTL_MS = 3_600_000 * 2; // 2 hours
    private static final int MAX_SESSIONS = 5_000;
    private static final int EXERCISE_DURATION_SECONDS = 300; // 5 minutes

    private final SubscriptionGuardService subscriptionGuard;
    private final ConcurrentHashMap<String, StressSession> sessions = new ConcurrentHashMap<>();

    // Leaderboard: scenarioId:difficulty -> sorted list of scores
    private final ConcurrentHashMap<String, List<Map<String, Object>>> leaderboards = new ConcurrentHashMap<>();

    private static final List<Map<String, Object>> EXERCISES = buildExercises();
    private static final Map<String, List<StressEvent>> SCENARIO_EVENTS = buildAllEvents();

    public StressTestService(SubscriptionGuardService subscriptionGuard) {
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
            log.warn("Stress test session count {} exceeds max {}", sessions.size(), MAX_SESSIONS);
            sessions.entrySet().stream()
                .sorted(Comparator.comparing(e -> e.getValue().startedAt))
                .limit(sessions.size() - MAX_SESSIONS)
                .forEach(e -> sessions.remove(e.getKey()));
        }
    }

    // ========== EXERCISES ==========

    private static List<Map<String, Object>> buildExercises() {
        List<Map<String, Object>> list = new ArrayList<>();
        list.add(exercise("ransomware_attack", "Ransomware Attack", "Lunavararünnak",
            "Your critical systems are being encrypted. Handle the crisis under extreme time pressure.",
            "Teie kriitilised süsteemid krüpteeritakse. Lahendage kriis äärmise ajasurve all.",
            "fire", "FREE", List.of("CADET", "OFFICER", "COMMANDER")));
        list.add(exercise("vendor_breach", "Vendor Data Breach", "Tarnija andmeleke",
            "A critical vendor reports a data breach affecting your customer data. React fast.",
            "Kriitiline tarnija teatab andmelekest, mis mõjutab teie kliendiandmeid. Reageerige kiiresti.",
            "shield", "STANDARD", List.of("CADET", "OFFICER", "COMMANDER")));
        list.add(exercise("regulatory_inspection", "Regulatory Inspection", "Regulatiivne kontroll",
            "Regulators arrive unannounced. Respond to rapid-fire compliance questions.",
            "Regulaatorid saabuvad ette teatamata. Vastake kiirele vastavusküsimuste tulvale.",
            "gavel", "STANDARD", List.of("CADET", "OFFICER", "COMMANDER")));
        list.add(exercise("cloud_failure", "Cloud Provider Failure", "Pilveteenuse pakkuja tõrge",
            "Your primary cloud provider is experiencing a major outage. Activate DR plans.",
            "Teie peamine pilveteenuse pakkuja kogeb suurt katkestust. Aktiveerige DR plaanid.",
            "cloud", "STANDARD", List.of("CADET", "OFFICER", "COMMANDER")));
        list.add(exercise("insider_threat", "Insider Threat", "Sisemine oht",
            "Suspicious activity detected from a privileged user account. Investigate and contain.",
            "Tuvastatud kahtlane tegevus privilegeeritud kasutajakontolt. Uurige ja ohjeldage.",
            "user_alert", "STANDARD", List.of("CADET", "OFFICER", "COMMANDER")));
        list.add(exercise("coordinated_attack", "Coordinated Multi-Vector Attack", "Koordineeritud mitmesuunaline rünnak",
            "Simultaneous DDoS, phishing, and insider compromise. The ultimate stress test.",
            "Samaaegne DDoS, andmepüük ja sisene kompromiteerimine. Ülim stressitest.",
            "crosshair", "ENTERPRISE", List.of("COMMANDER")));
        return Collections.unmodifiableList(list);
    }

    private static Map<String, Object> exercise(String id, String name, String nameEt, String desc, String descEt, String icon, String tier, List<String> difficulties) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("name", name);
        m.put("nameEt", nameEt);
        m.put("description", desc);
        m.put("descriptionEt", descEt);
        m.put("icon", icon);
        m.put("tier", tier);
        m.put("difficulties", difficulties);
        return m;
    }

    // ========== EVENTS ==========

    private static Map<String, List<StressEvent>> buildAllEvents() {
        Map<String, List<StressEvent>> map = new LinkedHashMap<>();
        map.put("ransomware_attack", buildRansomwareEvents());
        map.put("vendor_breach", buildVendorBreachEvents());
        map.put("regulatory_inspection", buildRegulatoryEvents());
        map.put("cloud_failure", buildCloudFailureEvents());
        map.put("insider_threat", buildInsiderThreatEvents());
        map.put("coordinated_attack", buildCoordinatedEvents());
        return map;
    }

    private static List<StressEvent> buildRansomwareEvents() {
        List<StressEvent> events = new ArrayList<>();
        events.add(new StressEvent("r1", "SYSTEM_ALERT", 9, 25, "Multiple servers reporting encryption activity detected by EDR",
            "Mitu serverit teatavad EDR-i poolt tuvastatud krüpteerimisaktiivsusest",
            List.of(new EventOption("Isolate affected network segments immediately", "Isoleerige mõjutatud võrgusegmendid kohe", 95),
                    new EventOption("Investigate scope before taking action", "Uurige ulatust enne tegutsemist", 35),
                    new EventOption("Shut down all servers", "Lülitage kõik serverid välja", 55),
                    new EventOption("Contact the attackers", "Võtke ründajatega ühendust", 5))));
        events.add(new StressEvent("r2", "PHONE_CALL", 8, 20, "CISO calling: Board wants an update. What do you tell them?",
            "CISO helistab: juhatus soovib ülevaadet. Mida räägite?",
            List.of(new EventOption("Full briefing: scope, impact, containment plan, timeline", "Täielik ülevaade: ulatus, mõju, ohjeldamise plaan, ajakava", 90),
                    new EventOption("Reassure them everything is under control", "Kinnitage, et kõik on kontrolli all", 25),
                    new EventOption("Tell them to wait until we know more", "Paluge neil oodata, kuni saame rohkem infot", 40))));
        events.add(new StressEvent("r3", "EMAIL", 7, 30, "Attacker demands 50 BTC ransom with 24h deadline. Legal wants guidance.",
            "Ründaja nõuab 50 BTC lunaraha 24h tähtajaga. Juriidiline osakond soovib juhiseid.",
            List.of(new EventOption("Do not engage. Focus on backup restoration and forensics", "Ärge vastake. Keskenduge varukoopiate taastamisele ja ekspertiisile", 95),
                    new EventOption("Negotiate to buy time", "Pidage läbirääkimisi ajavõitmiseks", 30),
                    new EventOption("Pay the ransom to restore operations quickly", "Makske lunaraha operatsioonide kiireks taastamiseks", 5))));
        events.add(new StressEvent("r4", "ALERT", 10, 15, "Customer database server now encrypted. 200K records at risk.",
            "Kliendiandmebaasi server nüüd krüpteeritud. 200K kirjet ohus.",
            List.of(new EventOption("Activate DORA Art. 19 major incident notification process", "Aktiveerige DORA Art. 19 olulise intsidendi teavitamise protsess", 95),
                    new EventOption("Wait to assess full impact before classifying", "Oodake täieliku mõju hindamist enne klassifitseerimist", 30),
                    new EventOption("Classify as minor operational disruption", "Klassifitseerige väikseks operatiivseks häireks", 10))));
        events.add(new StressEvent("r5", "SYSTEM_ALERT", 6, 30, "Backup verification complete. Last clean backup is from 48 hours ago.",
            "Varukoopiate kontroll lõpetatud. Viimane puhas varukoopia on 48 tundi vana.",
            List.of(new EventOption("Begin staged restoration from clean backup with integrity checks", "Alustage järkjärgulist taastamist puhtast varukoopiast tervikluskontrollidega", 90),
                    new EventOption("Restore everything immediately from the backup", "Taastage kohe kõik varukoopiast", 45),
                    new EventOption("Look for more recent backups on other media", "Otsige värskeimaid varukoopiaid muult meediumilt", 50))));
        events.add(new StressEvent("r6", "PHONE_CALL", 8, 20, "NCA (National Competent Authority) calls asking for initial notification.",
            "Pädev asutus helistab ja küsib esialgset teavitust.",
            List.of(new EventOption("Submit prepared Art. 19 initial notification within 4h deadline", "Esitage ettevalmistatud Art. 19 esialgne teavitus 4h tähtaja jooksul", 100),
                    new EventOption("Request extension due to ongoing investigation", "Taotlege pikendust käimasoleva uurimise tõttu", 30),
                    new EventOption("Provide verbal summary, formal report later", "Andke suuline kokkuvõte, ametlik aruanne hiljem", 40))));
        events.add(new StressEvent("r7", "EMAIL", 5, 35, "Media inquiry: 'We hear your company was hacked. Can you confirm?'",
            "Meedia päring: 'Kuulsime, et teie ettevõte häkiti. Kas saate kinnitada?'",
            List.of(new EventOption("Prepared statement: acknowledging incident, protecting customers, cooperating with authorities", "Ettevalmistatud avaldus: intsidendi tunnistamine, klientide kaitsmine, koostöö ametiasutustega", 85),
                    new EventOption("No comment", "Kommentaarideta", 35),
                    new EventOption("Deny the incident", "Eitage intsidenti", 5))));
        events.add(new StressEvent("r8", "ALERT", 7, 25, "Lateral movement detected — attacker accessing email server.",
            "Tuvastatud külgliikumine — ründaja pääseb ligi meiliserverile.",
            List.of(new EventOption("Immediately isolate email server, reset all credentials, deploy EDR response", "Isoleerige kohe meiliserver, lähtestage kõik mandaadid, rakendage EDR vastumeetmed", 95),
                    new EventOption("Monitor the activity to gather threat intelligence", "Jälgige tegevust ohuteabe kogumiseks", 25),
                    new EventOption("Block the attacker's known IP addresses only", "Blokeerige ainult ründaja teadaolevad IP-aadressid", 35))));
        events.add(new StressEvent("r9", "SYSTEM_ALERT", 9, 20, "Payment processing system offline. Revenue impact €50K/hour.",
            "Maksete töötlemise süsteem väljas. Tulumõju €50K/tund.",
            List.of(new EventOption("Switch to BCP backup payment processing route", "Lülituge BCP varuprotsessori maksete töötlemise marsruudile", 90),
                    new EventOption("Prioritize restoring this system above all others", "Seadke selle süsteemi taastamine kõigist teistest tähtsamaks", 50),
                    new EventOption("Notify customers to use alternative payment methods", "Teavitage kliente alternatiivsete makseviiside kasutamiseks", 60))));
        events.add(new StressEvent("r10", "PHONE_CALL", 6, 30, "Third-party forensics team needs access credentials. Security policy requires approval.",
            "Kolmanda osapoole ekspertiisimeeskond vajab ligipääsumandaate. Turvapoliitika nõuab heakskiitu.",
            List.of(new EventOption("Emergency approval with time-limited, audited access and NDA", "Erakorraline kinnitus ajaliselt piiratud, auditeeritud ligipääsu ja konfidentsiaalsuslepinguga", 90),
                    new EventOption("Full standard approval process (takes 24h)", "Täielik standardne kinnitusprotsess (võtab 24h)", 20),
                    new EventOption("Give them admin access to speed things up", "Andke neile admin-ligipääs asjade kiirendamiseks", 15))));
        return events;
    }

    private static List<StressEvent> buildVendorBreachEvents() {
        List<StressEvent> events = new ArrayList<>();
        events.add(new StressEvent("v1", "EMAIL", 9, 25, "Critical vendor notification: unauthorized access to shared customer database.",
            "Kriitilise tarnija teavitus: volitamata ligipääs jagatud kliendiandmebaasile.",
            List.of(new EventOption("Activate vendor incident response plan, demand forensic report, assess exposure", "Aktiveerige tarnija intsidendi reageerimise plaan, nõudke ekspertiisiaruannet, hindake kokkupuudet", 95),
                    new EventOption("Ask vendor for more details before taking action", "Küsige tarnijalt lisateavet enne tegutsemist", 40),
                    new EventOption("Immediately terminate vendor access to your systems", "Lõpetage kohe tarnija ligipääs teie süsteemidele", 55))));
        events.add(new StressEvent("v2", "ALERT", 8, 20, "Vendor confirms 3-month undetected access. Your customer data likely exposed.",
            "Tarnija kinnitab 3-kuulist avastamata ligipääsu. Teie kliendiandmed tõenäoliselt paljastatud.",
            List.of(new EventOption("Classify as major incident, initiate dual DORA + GDPR notification", "Klassifitseerige oluliseks intsidendiks, algatage topelt DORA + GDPR teavitamine", 95),
                    new EventOption("Wait for vendor's full forensic report before classifying", "Oodake tarnija täielikku ekspertiisiaruannet enne klassifitseerimist", 30),
                    new EventOption("Classify as vendor issue, not our incident", "Klassifitseerige tarnija probleemiks, mitte meie intsidendiks", 10))));
        events.add(new StressEvent("v3", "PHONE_CALL", 7, 25, "DPO asks: Do we notify 50K affected customers now or after investigation?",
            "DPO küsib: kas teavitame 50K mõjutatud klienti nüüd või pärast uurimist?",
            List.of(new EventOption("Begin customer notification with known facts, update as investigation progresses", "Alustage klientide teavitamist teadaolevate faktidega, uuendage uurimise edenedes", 85),
                    new EventOption("Wait for full investigation results", "Oodake uurimise tulemusi", 35),
                    new EventOption("Notify only customers with financial data exposed", "Teavitage ainult kliente, kelle finantsandmed olid paljastatud", 50))));
        events.add(new StressEvent("v4", "SYSTEM_ALERT", 8, 20, "Vendor API still active in your production systems. Data flow continues.",
            "Tarnija API endiselt aktiivne teie tootmissüsteemides. Andmevoog jätkub.",
            List.of(new EventOption("Immediately revoke vendor API access, switch to internal fallback", "Tühistage kohe tarnija API ligipääs, lülitage sisemisele varuvariandile", 95),
                    new EventOption("Monitor the API traffic for suspicious activity", "Jälgige API liiklust kahtlase tegevuse suhtes", 30),
                    new EventOption("Ask vendor to secure their end first", "Paluge tarnijal esmalt oma poolt turvata", 20))));
        events.add(new StressEvent("v5", "EMAIL", 6, 30, "Other financial institutions contact you about the same vendor. DORA Art. 45 applies.",
            "Teised finantsasutused võtavad teiega ühendust sama tarnija kohta. DORA Art. 45 kehtib.",
            List.of(new EventOption("Share IOCs and timeline through established ISAC channels", "Jagage IOC-sid ja ajakava kehtestatud ISAC kanalite kaudu", 90),
                    new EventOption("Share limited information only", "Jagage ainult piiratud teavet", 40),
                    new EventOption("Decline to share due to confidentiality", "Keelduge jagamast konfidentsiaalsuse tõttu", 15))));
        events.add(new StressEvent("v6", "ALERT", 9, 20, "Concentration risk alert: This vendor handles 40% of your critical functions.",
            "Kontsentratsiooni riski hoiatus: see tarnija haldab 40% teie kriitilistest funktsioonidest.",
            List.of(new EventOption("Activate exit strategy, begin parallel onboarding of alternative vendor", "Aktiveerige väljumisstrateegia, alustage alternatiivse tarnija paralleelset sisseseadmist", 85),
                    new EventOption("Document concentration risk for board review", "Dokumenteerige kontsentratsiooni risk juhatuse ülevaatamiseks", 50),
                    new EventOption("Continue with vendor after they resolve the breach", "Jätkake tarnijaga pärast rikkumise lahendamist", 25))));
        events.add(new StressEvent("v7", "PHONE_CALL", 7, 25, "Board emergency meeting in 30 minutes. Prepare key talking points.",
            "Juhatuse erakorraline koosolek 30 minuti pärast. Valmistage põhilised rääkimispunktid.",
            List.of(new EventOption("Impact assessment, containment status, regulatory timeline, vendor accountability, next steps", "Mõjuhinnang, ohjeldamise staatus, regulatiivne ajakava, tarnija vastutus, järgmised sammud", 90),
                    new EventOption("Technical details of the breach", "Rikkumise tehnilised üksikasjad", 35),
                    new EventOption("Reassure board that vendor is handling it", "Kinnitage juhatusele, et tarnija tegeleb sellega", 15))));
        events.add(new StressEvent("v8", "SYSTEM_ALERT", 5, 30, "Vendor provides initial forensic report. Attack vector was unpatched vulnerability.",
            "Tarnija esitab esialgse ekspertiisiaruande. Ründevektor oli parandamata haavatavus.",
            List.of(new EventOption("Review vendor's patch management in RoI, update risk rating, demand remediation plan", "Vaadake üle tarnija paigahaldus RoI-s, uuendage riskihinnangut, nõudke parandusplaani", 90),
                    new EventOption("Accept the report and monitor vendor's fix", "Aktsepteerige aruanne ja jälgige tarnija parandust", 40),
                    new EventOption("Immediately switch to backup vendor", "Lülituge kohe varutarnijale", 45))));
        return events;
    }

    private static List<StressEvent> buildRegulatoryEvents() {
        List<StressEvent> events = new ArrayList<>();
        events.add(new StressEvent("reg1", "ALERT", 8, 25, "NCA inspectors at reception. Unannounced DORA compliance inspection.",
            "Pädeva asutuse inspektorid vastuvõtus. Etteteatamata DORA vastavuskontroll.",
            List.of(new EventOption("Welcome inspectors, notify management, prepare documentation room", "Tervitage inspektoreid, teavitage juhtkonda, valmistage dokumentatsiooni ruum", 90),
                    new EventOption("Ask them to wait while you prepare", "Paluge neil oodata, kuni valmistute", 40),
                    new EventOption("Request they schedule a formal visit later", "Paluge neil planeerida ametlik visiit hiljem", 10))));
        events.add(new StressEvent("reg2", "PHONE_CALL", 9, 20, "Inspector asks: Show me your Register of Information per DORA Art. 28(3).",
            "Inspektor küsib: näidake mulle oma teaberegistrit DORA Art. 28(3) alusel.",
            List.of(new EventOption("Present complete, up-to-date RoI with all critical ICT providers", "Esitage täielik, ajakohane RoI kõigi kriitiliste IKT pakkujatega", 95),
                    new EventOption("Show partially complete RoI with explanation of gaps", "Näidake osaliselt täielikku RoI-d koos selgitusega lünkade kohta", 50),
                    new EventOption("Explain RoI is still being compiled", "Selgitage, et RoI on veel koostamisel", 15))));
        events.add(new StressEvent("reg3", "EMAIL", 7, 30, "Inspector requests: Evidence of TLPT testing per Art. 26-27 within 1 hour.",
            "Inspektor nõuab: TLPT testimise tõendid Art. 26-27 alusel 1 tunni jooksul.",
            List.of(new EventOption("Provide TLPT test reports, remediation tracking, and improvement plans", "Esitage TLPT testiaruanded, paranduste jälgimine ja parendusplaanid", 90),
                    new EventOption("Explain testing is scheduled for next quarter", "Selgitage, et testimine on planeeritud järgmiseks kvartaliks", 30),
                    new EventOption("Provide general penetration test reports instead", "Esitage üldised penetratsioonitestide aruanded", 45))));
        events.add(new StressEvent("reg4", "ALERT", 8, 20, "Inspector finds gap: No documented exit strategy for critical cloud provider.",
            "Inspektor leiab lünga: puudub dokumenteeritud väljumisstrateegia kriitilise pilveteenuse pakkuja jaoks.",
            List.of(new EventOption("Acknowledge gap, present remediation plan with timeline and interim controls", "Tunnistage lünka, esitage parandusplaan ajakava ja vahepealsete kontrollidega", 85),
                    new EventOption("Argue that exit strategy is implicit in the contract", "Väitke, et väljumisstrateegia on lepingus kaudne", 20),
                    new EventOption("Commit to creating one by next month", "Kohustuge looma seda järgmiseks kuuks", 50))));
        events.add(new StressEvent("reg5", "PHONE_CALL", 6, 25, "Inspector asks about your last incident report. When was it filed?",
            "Inspektor küsib teie viimase intsidendi aruande kohta. Millal see esitati?",
            List.of(new EventOption("Provide complete incident report log with all three DORA reporting phases documented", "Esitage täielik intsidendiaruannete logi kõigi kolme DORA aruandlusfaasiga", 95),
                    new EventOption("Show the initial notification only", "Näidake ainult esialgset teavitust", 40),
                    new EventOption("We haven't had any reportable incidents", "Meil pole olnud ühtegi aruandekohustusega intsidenti", 55))));
        events.add(new StressEvent("reg6", "SYSTEM_ALERT", 7, 25, "Inspector requests real-time access to your compliance monitoring dashboard.",
            "Inspektor nõuab reaalajas ligipääsu teie vastavuse seirepaneelile.",
            List.of(new EventOption("Grant read-only regulator portal access with full audit trail", "Andke ainult lugemisõigusega regulaatori portaali ligipääs täieliku auditijäljega", 90),
                    new EventOption("Show screenshots of the dashboard", "Näidake juhtpaneeli ekraanitõmmiseid", 35),
                    new EventOption("Explain the dashboard is being upgraded", "Selgitage, et juhtpaneeli uuendatakse", 15))));
        events.add(new StressEvent("reg7", "EMAIL", 8, 20, "Inspector's preliminary finding: Insufficient ICT risk management framework documentation.",
            "Inspektori esialgne leid: ebapiisav IKT riskijuhtimise raamistiku dokumentatsioon.",
            List.of(new EventOption("Accept finding, present existing framework gaps analysis and remediation roadmap", "Nõustuge leiuga, esitage olemasoleva raamistiku lünkaanalüüs ja paranduste teekaaart", 85),
                    new EventOption("Challenge the finding with available documentation", "Vaidlustage leid olemasoleva dokumentatsiooniga", 50),
                    new EventOption("Promise to address it in the next compliance cycle", "Lubake sellega tegeleda järgmises vastavustsüklis", 25))));
        events.add(new StressEvent("reg8", "ALERT", 9, 20, "Inspector asks for evidence of board-level ICT risk oversight per Art. 5.",
            "Inspektor küsib tõendeid juhatuse tasandi IKT riskijärelevalve kohta Art. 5 alusel.",
            List.of(new EventOption("Present board meeting minutes, ICT risk committee charter, and quarterly board reports", "Esitage juhatuse koosolekute protokollid, IKT riskikomitee põhikiri ja kvartaalsed juhatuse aruanded", 95),
                    new EventOption("Show the latest board risk dashboard", "Näidake viimast juhatuse riski juhtpaneeli", 55),
                    new EventOption("Explain board oversight is informal but effective", "Selgitage, et juhatuse järelevalve on mitteametlik, kuid tõhus", 15))));
        return events;
    }

    private static List<StressEvent> buildCloudFailureEvents() {
        List<StressEvent> events = new ArrayList<>();
        events.add(new StressEvent("cf1", "SYSTEM_ALERT", 10, 20, "All services hosted on Cloud Provider X are unreachable. Status page confirms major outage.",
            "Kõik pilveteenuse pakkuja X teenused on kättesaamatud. Olekuleht kinnitab suurt katkestust.",
            List.of(new EventOption("Activate DR plan, switch to multi-cloud failover, notify stakeholders", "Aktiveerige DR plaan, lülituge mitme pilve tõrkesiirdele, teavitage sidusrühmi", 95),
                    new EventOption("Wait for provider status update", "Oodake pakkuja olekuuuendust", 20),
                    new EventOption("Try restarting services in the same region", "Proovige teenuseid samas piirkonnas taaskäivitada", 25))));
        events.add(new StressEvent("cf2", "PHONE_CALL", 8, 25, "Online banking is down. Customer complaints flooding call center.",
            "Internetipank on maas. Kliendikaebused ujutavad kõnekeskust üle.",
            List.of(new EventOption("Activate customer communication plan, status page update, alternative channels", "Aktiveerige kliendikommunikatsiooni plaan, olekuleht uuendus, alternatiivsed kanalid", 85),
                    new EventOption("Focus on restoration, communicate after services are back", "Keskenduge taastamisele, suhelge pärast teenuste taastumist", 30),
                    new EventOption("Redirect all calls to the cloud provider's support", "Suunake kõik kõned pilveteenuse pakkuja toele", 10))));
        events.add(new StressEvent("cf3", "ALERT", 9, 20, "Provider estimates 48h recovery. Your RTO is 4 hours for critical functions.",
            "Pakkuja hindab 48h taastumist. Teie RTO kriitiliste funktsioonide jaoks on 4 tundi.",
            List.of(new EventOption("Migrate critical workloads to backup cloud provider per DR plan", "Migreerige kriitilised töökoormused varupilveteenuse pakkujale DR plaani järgi", 95),
                    new EventOption("Negotiate priority restoration with the provider", "Läbirääkige pakkujaga prioriteetse taastamise osas", 35),
                    new EventOption("Accept extended downtime and notify clients", "Nõustuge pikema seisakuajaga ja teavitage kliente", 20))));
        events.add(new StressEvent("cf4", "SYSTEM_ALERT", 7, 25, "Payment processing queue building up. €2M in pending transactions.",
            "Maksete töötlemise järjekord kasvab. €2M ootel tehinguid.",
            List.of(new EventOption("Route payments through backup processor, queue reconciliation for later", "Suunake maksed varuprotsessori kaudu, järjekorra kooskõlastamine hiljem", 90),
                    new EventOption("Pause all payments until primary system recovers", "Peatage kõik maksed kuni põhisüsteem taastub", 40),
                    new EventOption("Process payments manually through branch network", "Töödelge makseid käsitsi kontorite võrgu kaudu", 50))));
        events.add(new StressEvent("cf5", "EMAIL", 6, 30, "DORA Art. 28: Do we invoke contractual exit strategy provisions?",
            "DORA Art. 28: kas kasutame lepingulisi väljumisstrateegia sätteid?",
            List.of(new EventOption("Prepare exit strategy activation while monitoring recovery timeline", "Valmistage ette väljumisstrateegia aktiveerimine, jälgides taastumise ajakava", 85),
                    new EventOption("Yes, begin immediate provider migration", "Jah, alustage kohest pakkuja migreerimist", 35),
                    new EventOption("No, maintain relationship with current provider", "Ei, säilitage suhe praeguse pakkujaga", 25))));
        events.add(new StressEvent("cf6", "PHONE_CALL", 8, 20, "NCA calls: How long has your critical function been unavailable?",
            "Pädev asutus helistab: kui kaua on teie kriitiline funktsioon kättesaamatu olnud?",
            List.of(new EventOption("Provide exact timeline, DR activation status, expected recovery, and RTO compliance", "Esitage täpne ajakava, DR aktiveerimise staatus, eeldatav taastumisaeg ja RTO vastavus", 95),
                    new EventOption("Minimize the duration and impact in your report", "Minimeerige kestust ja mõju oma aruandes", 15),
                    new EventOption("Defer to the cloud provider for timeline details", "Viidake pilveteenuse pakkujale ajakava üksikasjade osas", 30))));
        events.add(new StressEvent("cf7", "ALERT", 7, 25, "Data integrity check reveals potential inconsistencies in recovered databases.",
            "Andmete tervikluse kontroll paljastab võimalikud ebakõlad taastatud andmebaasides.",
            List.of(new EventOption("Full reconciliation with backup systems, audit trail verification, regulatory notification", "Täielik kooskõlastamine varusüsteemidega, auditijälje kontroll, regulatiivne teavitamine", 90),
                    new EventOption("Spot-check critical data only", "Kontrollige ainult kriitilisi andmeid", 45),
                    new EventOption("Trust provider's assurance that data is intact", "Usaldage pakkuja kinnitust andmete tervikluse kohta", 15))));
        events.add(new StressEvent("cf8", "SYSTEM_ALERT", 8, 20, "Secondary cloud region also showing degraded performance.",
            "Ka sekundaarne pilvepiirkond näitab halvenenud jõudlust.",
            List.of(new EventOption("Activate tertiary failover, contact alternative providers, escalate with current provider", "Aktiveerige kolmanda taseme tõrkesiire, võtke ühendust alternatiivsete pakkujatega, eskaleerige", 90),
                    new EventOption("Wait for primary region recovery", "Oodake esmase piirkonna taastumist", 20),
                    new EventOption("Reduce non-critical services to free up resources", "Vähendage mittekriitilisi teenuseid ressursside vabastamiseks", 55))));
        return events;
    }

    private static List<StressEvent> buildInsiderThreatEvents() {
        List<StressEvent> events = new ArrayList<>();
        events.add(new StressEvent("it1", "SYSTEM_ALERT", 8, 25, "SIEM alert: Privileged user downloading large volumes of customer data at 2 AM.",
            "SIEM hoiatus: privilegeeritud kasutaja laeb alla suuri koguseid kliendiandmeid kell 2 öösel.",
            List.of(new EventOption("Immediately suspend account, preserve logs, initiate investigation", "Peatage kohe konto, säilitage logid, algatage uurimine", 95),
                    new EventOption("Monitor the activity to gather more evidence", "Jälgige tegevust lisatõendite kogumiseks", 35),
                    new EventOption("Contact the user to ask about the activity", "Võtke kasutajaga ühendust ja küsige tegevuse kohta", 15))));
        events.add(new StressEvent("it2", "ALERT", 9, 20, "Investigation reveals the user has been exfiltrating data for 2 weeks.",
            "Uurimine paljastab, et kasutaja on andmeid eksfiltreerinud 2 nädalat.",
            List.of(new EventOption("Classify as major incident, involve legal, HR, and law enforcement", "Klassifitseerige oluliseks intsidendiks, kaasake juriidiline, HR ja õiguskaitse", 90),
                    new EventOption("Handle internally through HR disciplinary process", "Lahendage sisemiselt HR distsiplinaarprotsessi kaudu", 30),
                    new EventOption("Confront the employee directly", "Seiske töötajaga otse silmitsi", 15))));
        events.add(new StressEvent("it3", "PHONE_CALL", 7, 25, "HR asks: The employee is a senior manager. How do we handle this discreetly?",
            "HR küsib: töötaja on vanemjuht. Kuidas me seda diskreetselt käsitleme?",
            List.of(new EventOption("Follow established insider threat protocol regardless of seniority, involve legal", "Järgige kehtestatud sisemine ohu protokolli sõltumata ametikohast, kaasake juriidiline osakond", 90),
                    new EventOption("Allow HR to handle through normal disciplinary channels", "Laske HR-il käsitleda tavaliste distsiplinaarkanalite kaudu", 25),
                    new EventOption("Quietly restrict access and observe further", "Piirake vaikselt ligipääsu ja jälgige edasi", 40))));
        events.add(new StressEvent("it4", "SYSTEM_ALERT", 8, 20, "Forensics shows stolen data includes PII of 30,000 customers.",
            "Ekspertiis näitab, et varastatud andmed sisaldavad 30 000 kliendi isikuandmeid.",
            List.of(new EventOption("Trigger DORA major incident + GDPR breach notification, begin customer impact assessment", "Käivitage DORA oluline intsident + GDPR rikkumise teavitamine, alustage kliendimõju hindamist", 95),
                    new EventOption("Assess whether data was actually used before notifying", "Hinnake, kas andmeid tegelikult kasutati, enne teavitamist", 30),
                    new EventOption("Notify only the most severely affected customers", "Teavitage ainult kõige raskemalt mõjutatud kliente", 40))));
        events.add(new StressEvent("it5", "EMAIL", 6, 30, "Access review reveals 15 other accounts with similar excessive privileges.",
            "Ligipääsu ülevaatus paljastab 15 teist kontot sarnaste liigsete õigustega.",
            List.of(new EventOption("Immediately implement least-privilege, audit all privileged accounts, update access policy", "Rakendage kohe minimaalsete õiguste põhimõte, auditeerige kõik privilegeeritud kontod", 90),
                    new EventOption("Add these to the access review backlog", "Lisage need ligipääsu ülevaatuse ootejärjekorda", 25),
                    new EventOption("Revoke excess privileges for all 15 accounts now", "Tühistage liigsed õigused kõigilt 15 kontolt kohe", 70))));
        events.add(new StressEvent("it6", "PHONE_CALL", 7, 20, "Law enforcement requests preservation order for all evidence.",
            "Õiguskaitse esitab tõendite säilitamise korralduse.",
            List.of(new EventOption("Implement legal hold, preserve all relevant logs, systems, and communications", "Rakendage juriidiline keeld, säilitage kõik asjakohased logid, süsteemid ja kommunikatsioon", 95),
                    new EventOption("Provide what we have and continue normal operations", "Esitage mis meil on ja jätkake tavatoimingutega", 35),
                    new EventOption("Consult with legal before complying", "Konsulteerige juriidilise osakonnaga enne täitmist", 60))));
        events.add(new StressEvent("it7", "ALERT", 8, 25, "The insider had access to third-party vendor credentials. Supply chain risk activated.",
            "Sisemisel oli ligipääs kolmanda osapoole tarnija mandaatidele. Tarneahela risk aktiveeritud.",
            List.of(new EventOption("Immediately rotate all vendor credentials, notify affected vendors, assess exposure", "Roteerige kohe kõik tarnija mandaadid, teavitage mõjutatud tarnijaid, hindake kokkupuudet", 95),
                    new EventOption("Check if vendor credentials were actually used", "Kontrollige, kas tarnija mandaate tegelikult kasutati", 40),
                    new EventOption("Notify vendors after our internal investigation completes", "Teavitage tarnijaid pärast meie sisemise uurimise lõpetamist", 20))));
        events.add(new StressEvent("it8", "SYSTEM_ALERT", 6, 30, "Board demands: What controls failed and who is accountable?",
            "Juhatus nõuab: millised kontrollid ebaõnnestusid ja kes vastutab?",
            List.of(new EventOption("Present root cause analysis: access control gaps, monitoring blind spots, remediation plan", "Esitage algpõhjuse analüüs: ligipääsukontrolli lüngad, seire pimedad kohad, parandusplaan", 90),
                    new EventOption("Blame the individual employee's malicious intent", "Süüdistage üksiku töötaja pahatahtlikku kavatsust", 15),
                    new EventOption("Explain this was an unprecedented event", "Selgitage, et see oli enneolematu sündmus", 25))));
        return events;
    }

    private static List<StressEvent> buildCoordinatedEvents() {
        List<StressEvent> events = new ArrayList<>();
        events.add(new StressEvent("ca1", "SYSTEM_ALERT", 10, 15, "Simultaneous DDoS on public services AND phishing emails to executives detected.",
            "Samaaegne DDoS avalikele teenustele JA juhtidele suunatud andmepüügimeilid tuvastatud.",
            List.of(new EventOption("Split response teams: DDoS mitigation + phishing containment + threat intel correlation", "Jagage reageerimismeeskonnad: DDoS leevendamine + andmepüügi ohjeldamine + ohuteabe korrelatsioon", 95),
                    new EventOption("Focus on DDoS first as it affects more users", "Keskenduge esmalt DDoS-ile, kuna see mõjutab rohkem kasutajaid", 30),
                    new EventOption("Focus on phishing as it targets high-value accounts", "Keskenduge andmepüügile, kuna see sihib kõrge väärtusega kontosid", 35))));
        events.add(new StressEvent("ca2", "ALERT", 10, 15, "Executive's email compromised via phishing. Attacker sending wire transfer requests.",
            "Juhi e-post kompromiteeritud andmepüügi kaudu. Ründaja saadab pangatülekande taotlusi.",
            List.of(new EventOption("Freeze all pending wire transfers, disable compromised account, alert finance team", "Külmutage kõik ootel pangaülekanded, keelake kompromiteeritud konto, teavitage finantsosakonda", 95),
                    new EventOption("Disable the compromised email account only", "Keelake ainult kompromiteeritud meilikonto", 40),
                    new EventOption("Send company-wide phishing alert", "Saatke kogu ettevõttele andmepüügihoiatus", 50))));
        events.add(new StressEvent("ca3", "PHONE_CALL", 9, 20, "SOC reports: DDoS may be covering lateral movement. Suspicious admin activity detected.",
            "SOC teatab: DDoS võib varjata külgliikumist. Tuvastatud kahtlane admin-tegevus.",
            List.of(new EventOption("Assume advanced persistent threat, activate full IR, isolate critical assets, hunt for IOCs", "Eeldage kõrgetasemelist püsivat ohtu, aktiveerige täielik IR, isoleerige kriitilised varad, otsige IOC-sid", 95),
                    new EventOption("Investigate the admin activity while maintaining DDoS response", "Uurige admin-tegevust, säilitades DDoS vastumeetmeid", 45),
                    new EventOption("Focus resources on stopping the DDoS to free up SOC capacity", "Suunake ressursid DDoS-i peatamisele SOC võimekuse vabastamiseks", 20))));
        events.add(new StressEvent("ca4", "SYSTEM_ALERT", 10, 15, "Confirmed: Attacker has domain admin access. All systems potentially compromised.",
            "Kinnitatud: ründajal on domeeni admin-ligipääs. Kõik süsteemid potentsiaalselt ohustatud.",
            List.of(new EventOption("Full network isolation, activate offline DR environment, begin credential reset for ALL accounts", "Täielik võrgu isoleerimine, aktiveerige offline DR keskkond, alustage kõigi kontode mandaatide lähtestamist", 95),
                    new EventOption("Reset only the compromised admin account", "Lähtestage ainult kompromiteeritud admin-konto", 15),
                    new EventOption("Monitor attacker activity to understand objectives", "Jälgige ründaja tegevust eesmärkide mõistmiseks", 10))));
        events.add(new StressEvent("ca5", "ALERT", 9, 20, "Customer data exfiltration detected. GDPR, DORA, and possibly PCI-DSS all triggered.",
            "Tuvastatud kliendiandmete eksfiltratsioon. GDPR, DORA ja võimalik, et PCI-DSS kõik käivitatud.",
            List.of(new EventOption("Parallel multi-regulation notification: NCA, DPA, card schemes. Coordinate with legal.", "Paralleelne mitme regulatsiooni teavitamine: pädev asutus, andmekaitseasutus, kaardiskeemid. Koordineerige juriidilisega.", 95),
                    new EventOption("File DORA notification first, others can follow", "Esitage esmalt DORA teavitus, teised võivad järgneda", 45),
                    new EventOption("Wait for full damage assessment before any notifications", "Oodake täielikku kahju hindamist enne teavitamist", 15))));
        events.add(new StressEvent("ca6", "PHONE_CALL", 8, 20, "Media breaking news: 'Major bank under sophisticated cyber attack'. Your name mentioned.",
            "Meedia kiirteade: 'Suur pank keeruka küberrünnaku all'. Teie nimi mainitud.",
            List.of(new EventOption("Activate crisis communications plan, prepared statement, executive spokesperson", "Aktiveerige kriisikommunikatsiooni plaan, ettevalmistatud avaldus, juhi pressiesindaja", 90),
                    new EventOption("Issue a brief 'no comment' while focusing on technical response", "Avaldage lühike 'kommentaarideta', keskendudes tehnilisele vastusele", 35),
                    new EventOption("Deny the attack to protect share price", "Eitage rünnakut aktsia hinna kaitsmiseks", 5))));
        events.add(new StressEvent("ca7", "SYSTEM_ALERT", 7, 25, "Clean DR environment operational. Begin controlled service restoration?",
            "Puhas DR keskkond toimiv. Alustada kontrollitud teenuste taastamist?",
            List.of(new EventOption("Phased restoration: critical services first, with enhanced monitoring at each stage", "Järkjärguline taastamine: kriitilised teenused esmalt, tõhustatud seirega igal etapil", 90),
                    new EventOption("Restore all services simultaneously to minimize downtime", "Taastage kõik teenused samaaegselt seisakuaja minimeerimiseks", 30),
                    new EventOption("Wait until full forensic analysis is complete before restoring anything", "Oodake enne millegi taastamist kuni ekspertiisianalüüs on lõpetatud", 40))));
        events.add(new StressEvent("ca8", "EMAIL", 8, 25, "Other financial institutions report similar coordinated attacks. Sector-wide threat.",
            "Teised finantsasutused teatavad sarnastest koordineeritud rünnakutest. Sektoriülene oht.",
            List.of(new EventOption("Engage sector CERT, share IOCs via ISAC, coordinate national response", "Kaasake sektori CERT, jagage IOC-sid ISAC kaudu, koordineerige riiklikku vastust", 95),
                    new EventOption("Focus on our own recovery first", "Keskenduge esmalt meie enda taastumisele", 30),
                    new EventOption("Share only sanitized, high-level information", "Jagage ainult puhastatud kõrgetasemelist teavet", 40))));
        return events;
    }

    // ========== PUBLIC API ==========

    public List<Map<String, Object>> getExercises(String userId, String sessionId) {
        boolean isPremium = subscriptionGuard.isPremium(userId, sessionId);
        boolean isEnterprise = subscriptionGuard.isEnterprise(userId, sessionId);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> ex : EXERCISES) {
            Map<String, Object> item = new LinkedHashMap<>(ex);
            String tier = (String) ex.get("tier");
            boolean locked;
            if ("FREE".equals(tier)) locked = false;
            else if ("ENTERPRISE".equals(tier)) locked = !isEnterprise;
            else locked = !isPremium;
            item.put("locked", locked);
            result.add(item);
        }
        return result;
    }

    public Map<String, Object> startExercise(String userId, String sessionId, String scenarioId, String difficulty) {
        // Validate scenario
        Map<String, Object> exercise = EXERCISES.stream()
            .filter(e -> e.get("id").equals(scenarioId))
            .findFirst().orElse(null);
        if (exercise == null) return Map.of("error", "Unknown scenario");

        // Tier check
        String tier = (String) exercise.get("tier");
        boolean isPremium = subscriptionGuard.isPremium(userId, sessionId);
        boolean isEnterprise = subscriptionGuard.isEnterprise(userId, sessionId);
        if ("STANDARD".equals(tier) && !isPremium) return Map.of("error", "Requires Standard subscription");
        if ("ENTERPRISE".equals(tier) && !isEnterprise) return Map.of("error", "Requires Enterprise subscription");

        if (difficulty == null) difficulty = "CADET";
        String exerciseSessionId = UUID.randomUUID().toString();
        String sessionKey = userId + ":" + exerciseSessionId;

        // Get events for this scenario
        List<StressEvent> allEvents = SCENARIO_EVENTS.getOrDefault(scenarioId, SCENARIO_EVENTS.get("ransomware_attack"));

        // Schedule 8-12 events depending on difficulty
        int eventCount;
        switch (difficulty) {
            case "COMMANDER": eventCount = Math.min(allEvents.size(), 10); break;
            case "OFFICER": eventCount = Math.min(allEvents.size(), 8); break;
            default: eventCount = Math.min(allEvents.size(), 6);
        }

        // Select events and schedule them
        List<StressEvent> selectedEvents = new ArrayList<>(allEvents.subList(0, eventCount));
        Random rng = new Random();
        List<ScheduledEvent> scheduled = new ArrayList<>();
        int interval = EXERCISE_DURATION_SECONDS / (eventCount + 1);

        for (int i = 0; i < selectedEvents.size(); i++) {
            StressEvent se = selectedEvents.get(i);
            int baseTime = (i + 1) * interval;
            int jitter = rng.nextInt(Math.max(1, interval / 3)) - interval / 6;
            int triggerTime = Math.max(5, Math.min(EXERCISE_DURATION_SECONDS - 30, baseTime + jitter));
            scheduled.add(new ScheduledEvent(se, triggerTime, false));
        }
        scheduled.sort(Comparator.comparingInt(a -> a.triggerSecond));

        // Create session
        StressSession session = new StressSession();
        session.sessionId = exerciseSessionId;
        session.userId = userId;
        session.scenarioId = scenarioId;
        session.difficulty = difficulty;
        session.scheduledEvents = scheduled;
        session.startedAt = Instant.now().toString();
        session.state = "ACTIVE";
        session.score = 0;
        session.totalDecisions = 0;

        sessions.put(sessionKey, session);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("sessionId", exerciseSessionId);
        result.put("scenario", exercise);
        result.put("difficulty", difficulty);
        result.put("duration", EXERCISE_DURATION_SECONDS);
        result.put("totalEvents", eventCount);
        result.put("state", "ACTIVE");
        return result;
    }

    public Map<String, Object> getNextEvents(String userId, String exerciseSessionId, int elapsedSeconds) {
        String sessionKey = userId + ":" + exerciseSessionId;
        StressSession session = sessions.get(sessionKey);
        if (session == null) return Map.of("error", "Session not found");
        if (!"ACTIVE".equals(session.state)) return Map.of("error", "Exercise not active");

        List<Map<String, Object>> newEvents = new ArrayList<>();

        synchronized (session) {
            for (ScheduledEvent se : session.scheduledEvents) {
                if (!se.delivered && se.triggerSecond <= elapsedSeconds) {
                    se.delivered = true;
                    se.deliveredAt = elapsedSeconds;
                    Map<String, Object> eventData = new LinkedHashMap<>();
                    eventData.put("eventId", se.event.id);
                    eventData.put("type", se.event.type);
                    eventData.put("urgency", se.event.urgency);
                    eventData.put("responseWindow", se.event.responseWindowSeconds);
                    eventData.put("prompt", se.event.prompt);
                    eventData.put("promptEt", se.event.promptEt);
                    List<Map<String, Object>> options = new ArrayList<>();
                    for (int i = 0; i < se.event.options.size(); i++) {
                        EventOption opt = se.event.options.get(i);
                        Map<String, Object> o = new LinkedHashMap<>();
                        o.put("index", i);
                        o.put("text", opt.text);
                        o.put("textEt", opt.textEt);
                        options.add(o);
                    }
                    eventData.put("options", options);
                    eventData.put("appearedAt", elapsedSeconds);
                    newEvents.add(eventData);
                }
            }
        }

        // Count pending (delivered but not responded)
        long pending = session.scheduledEvents.stream()
            .filter(se -> se.delivered && se.respondedAt < 0)
            .count();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("events", newEvents);
        result.put("pendingCount", pending);
        result.put("score", session.score);
        result.put("elapsed", elapsedSeconds);
        result.put("remaining", Math.max(0, EXERCISE_DURATION_SECONDS - elapsedSeconds));
        return result;
    }

    public Map<String, Object> respondToEvent(String userId, String exerciseSessionId, String eventId, int optionIndex, int reactionTimeMs) {
        String sessionKey = userId + ":" + exerciseSessionId;
        StressSession session = sessions.get(sessionKey);
        if (session == null) return Map.of("error", "Session not found");
        if (!"ACTIVE".equals(session.state)) return Map.of("error", "Exercise not active");

        synchronized (session) {
            ScheduledEvent target = null;
            for (ScheduledEvent se : session.scheduledEvents) {
                if (se.event.id.equals(eventId) && se.delivered && se.respondedAt < 0) {
                    target = se;
                    break;
                }
            }
            if (target == null) return Map.of("error", "Event not found or already responded");
            if (optionIndex < 0 || optionIndex >= target.event.options.size()) return Map.of("error", "Invalid option");

            EventOption chosen = target.event.options.get(optionIndex);
            target.respondedAt = reactionTimeMs;
            target.chosenOptionIndex = optionIndex;

            // Score: decision quality (0-100) + reaction time bonus
            int qualityScore = chosen.qualityScore;
            int reactionBonus = reactionTimeMs < 5000 ? 10 : reactionTimeMs < 10000 ? 5 : reactionTimeMs < 15000 ? 2 : 0;
            int eventScore = qualityScore + reactionBonus;
            session.score += eventScore;
            session.totalDecisions++;

            Map<String, Object> response = new LinkedHashMap<>();
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("eventId", eventId);
            result.put("qualityScore", qualityScore);
            result.put("reactionBonus", reactionBonus);
            result.put("eventScore", eventScore);
            result.put("totalScore", session.score);
            result.put("reactionTimeMs", reactionTimeMs);
            result.put("isOptimal", qualityScore >= 85);
            return result;
        }
    }

    public Map<String, Object> completeExercise(String userId, String exerciseSessionId) {
        String sessionKey = userId + ":" + exerciseSessionId;
        StressSession session = sessions.get(sessionKey);
        if (session == null) return Map.of("error", "Session not found");

        synchronized (session) {
            if (session.cachedResult != null) return session.cachedResult;
            session.state = "COMPLETED";
            session.completedAt = Instant.now().toString();

            int totalEvents = session.scheduledEvents.size();
            int responded = session.totalDecisions;
            int missed = (int) session.scheduledEvents.stream().filter(se -> se.delivered && se.respondedAt < 0).count();

            // Calculate category scores
            int maxPossible = totalEvents * 110; // max quality (100) + max reaction bonus (10)
            int decisionQuality = maxPossible > 0 ? Math.min(100, (session.score * 100) / maxPossible) : 0;

            // Reaction speed: average reaction time
            double avgReactionMs = session.scheduledEvents.stream()
                .filter(se -> se.respondedAt >= 0)
                .mapToInt(se -> se.respondedAt)
                .average().orElse(15000);
            int speedScore = avgReactionMs < 3000 ? 100 : avgReactionMs < 5000 ? 85 : avgReactionMs < 8000 ? 70 : avgReactionMs < 12000 ? 50 : 30;

            // Prioritization: did they handle high-urgency events faster?
            int prioritizationScore = 70;
            long highUrgencyFast = session.scheduledEvents.stream()
                .filter(se -> se.respondedAt >= 0 && se.event.urgency >= 8 && se.respondedAt < 8000)
                .count();
            long highUrgencyTotal = session.scheduledEvents.stream()
                .filter(se -> se.event.urgency >= 8)
                .count();
            if (highUrgencyTotal > 0) {
                prioritizationScore = (int) (highUrgencyFast * 100 / highUrgencyTotal);
            }

            // Completeness: percentage of events responded to
            int completeness = totalEvents > 0 ? (responded * 100 / totalEvents) : 0;

            // Composure: consistency of decision quality (low variance = calm under pressure)
            int composure = 75; // default
            if (responded > 2) {
                List<Integer> scores = new ArrayList<>();
                for (ScheduledEvent se : session.scheduledEvents) {
                    if (se.respondedAt >= 0 && se.chosenOptionIndex >= 0) {
                        scores.add(se.event.options.get(se.chosenOptionIndex).qualityScore);
                    }
                }
                double mean = scores.stream().mapToInt(Integer::intValue).average().orElse(50);
                double variance = scores.stream().mapToDouble(s -> Math.pow(s - mean, 2)).average().orElse(500);
                double stdDev = Math.sqrt(variance);
                composure = stdDev < 10 ? 95 : stdDev < 20 ? 80 : stdDev < 30 ? 65 : 45;
            }

            int overall = (int) (decisionQuality * 0.35 + speedScore * 0.20 + prioritizationScore * 0.15 + completeness * 0.15 + composure * 0.15);
            String grade;
            if (overall >= 90) grade = "A";
            else if (overall >= 80) grade = "B";
            else if (overall >= 70) grade = "C";
            else if (overall >= 60) grade = "D";
            else grade = "F";

            // Build event replay
            List<Map<String, Object>> replay = new ArrayList<>();
            for (ScheduledEvent se : session.scheduledEvents) {
                Map<String, Object> re = new LinkedHashMap<>();
                re.put("eventId", se.event.id);
                re.put("prompt", se.event.prompt);
                re.put("urgency", se.event.urgency);
                re.put("triggerSecond", se.triggerSecond);
                re.put("delivered", se.delivered);
                re.put("responded", se.respondedAt >= 0);
                if (se.respondedAt >= 0 && se.chosenOptionIndex >= 0) {
                    re.put("chosenOption", se.event.options.get(se.chosenOptionIndex).text);
                    re.put("qualityScore", se.event.options.get(se.chosenOptionIndex).qualityScore);
                    re.put("reactionTimeMs", se.respondedAt);
                    re.put("isOptimal", se.event.options.get(se.chosenOptionIndex).qualityScore >= 85);
                } else {
                    re.put("missed", true);
                }
                replay.add(re);
            }

            Map<String, Object> scorecard = new LinkedHashMap<>();
            scorecard.put("sessionId", exerciseSessionId);
            scorecard.put("scenarioId", session.scenarioId);
            scorecard.put("difficulty", session.difficulty);
            scorecard.put("grade", grade);
            scorecard.put("overall", overall);
            scorecard.put("scores", Map.of(
                "decisionQuality", decisionQuality,
                "speed", speedScore,
                "prioritization", prioritizationScore,
                "completeness", completeness,
                "composure", composure
            ));
            scorecard.put("totalScore", session.score);
            scorecard.put("eventsDelivered", (int) session.scheduledEvents.stream().filter(se -> se.delivered).count());
            scorecard.put("eventsResponded", responded);
            scorecard.put("eventsMissed", missed);
            scorecard.put("replay", replay);
            scorecard.put("startedAt", session.startedAt);
            scorecard.put("completedAt", session.completedAt);

            // Update leaderboard
            updateLeaderboard(session.scenarioId, session.difficulty, overall, grade);
            scorecard.put("leaderboardPosition", getLeaderboardPosition(session.scenarioId, session.difficulty, overall));

            session.cachedResult = scorecard;
            return scorecard;
        }
    }

    public Map<String, Object> getLeaderboard(String scenarioId, String difficulty) {
        if (scenarioId == null) scenarioId = "ransomware_attack";
        if (difficulty == null) difficulty = "CADET";
        String key = scenarioId + ":" + difficulty;
        List<Map<String, Object>> board = leaderboards.getOrDefault(key, new ArrayList<>());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("scenarioId", scenarioId);
        result.put("difficulty", difficulty);
        result.put("entries", board.size() > 20 ? board.subList(0, 20) : board);
        result.put("totalEntries", board.size());
        return result;
    }

    private void updateLeaderboard(String scenarioId, String difficulty, int score, String grade) {
        String key = scenarioId + ":" + difficulty;
        leaderboards.computeIfAbsent(key, k -> Collections.synchronizedList(new ArrayList<>()));
        List<Map<String, Object>> board = leaderboards.get(key);
        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("score", score);
        entry.put("grade", grade);
        entry.put("date", Instant.now().toString());
        entry.put("player", "Officer #" + (board.size() + 1));
        board.add(entry);
        board.sort((a, b) -> ((Integer) b.get("score")).compareTo((Integer) a.get("score")));
        while (board.size() > 100) board.remove(board.size() - 1);
    }

    private int getLeaderboardPosition(String scenarioId, String difficulty, int score) {
        String key = scenarioId + ":" + difficulty;
        List<Map<String, Object>> board = leaderboards.getOrDefault(key, new ArrayList<>());
        int position = 1;
        for (Map<String, Object> entry : board) {
            if (((Integer) entry.get("score")) > score) position++;
            else break;
        }
        return position;
    }

    // ========== INNER CLASSES ==========

    private static class StressSession {
        String sessionId;
        String userId;
        String scenarioId;
        String difficulty;
        String state; // ACTIVE, COMPLETED
        List<ScheduledEvent> scheduledEvents;
        int score;
        int totalDecisions;
        String startedAt;
        volatile String completedAt;
        volatile Map<String, Object> cachedResult;
    }

    private static class ScheduledEvent {
        StressEvent event;
        int triggerSecond;
        boolean delivered;
        int deliveredAt;
        int respondedAt = -1;
        int chosenOptionIndex = -1;

        ScheduledEvent(StressEvent event, int triggerSecond, boolean delivered) {
            this.event = event;
            this.triggerSecond = triggerSecond;
            this.delivered = delivered;
        }
    }

    private static class StressEvent {
        String id;
        String type;
        int urgency;
        int responseWindowSeconds;
        String prompt;
        String promptEt;
        List<EventOption> options;

        StressEvent(String id, String type, int urgency, int responseWindow, String prompt, String promptEt, List<EventOption> options) {
            this.id = id;
            this.type = type;
            this.urgency = urgency;
            this.responseWindowSeconds = responseWindow;
            this.prompt = prompt;
            this.promptEt = promptEt;
            this.options = options;
        }
    }

    private static class EventOption {
        String text;
        String textEt;
        int qualityScore;

        EventOption(String text, String textEt, int qualityScore) {
            this.text = text;
            this.textEt = textEt;
            this.qualityScore = qualityScore;
        }
    }
}
