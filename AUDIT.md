# DoraAudit — Koodibaasi audit

**Kuupäev:** 2026-04-24
**Ulatus:** kogu repo (`backend/` 379 Java-faili, `frontend/` Angular 19 ~150 komponenti)
**Eesmärk:** kaardistada, mis päriselt töötab, mis on surnud kood, mis maksab liiga palju hoolduses.

---

## 1. Lühikokkuvõte

Sul on **suurem, valmisem ja funktsionaalsemalt rikkam platvorm kui sa ilmselt ise tunned**. See pole MVP — see on **overbuilt seedstage SaaS**.

**Numbrid:**

| Mõõdik | Väärtus | Hinnang |
|---|---|---|
| Backend Java-failid | 379 | Suur |
| Service-klassid | 100 | Üle piiri soolo-arenduseks |
| Controller-klassid | 89 | Tohutult |
| Entity-klassid | 154 (sh 60+ JPA) | Üle-modelleeritud |
| Repository'd | 64 | Järgneb entity'test |
| Scheduled jobid | 13+ | Liiga palju ühe inimese jaoks |
| Frontend-route'id | 92 | Hiiglaslik UX-pind |
| Testifaile | 11 | **Kriitiline — ~3% katvus** |
| Tõlkekeeli | 6 (et, en, fi, lv, lt, pl) | Hea |
| Välised integratsioonid | 10 (Claude, Stripe, Ariregister, GLEIF, Resend, FI scrape, EBA, Google CSE, Teadmik, Inforegister) | Põhjalik |
| LemonSqueezy + Stripe duaalbilling | Osaliselt migreeritud | Tehniline võlg |

**Suurim signaal:**
- Frontend kutsub ~35 unikaalset API-endpoint'i.
- Backend'il on ~89 controller'it.
- **~50 controller'it pole frontendis kunagi kasutatud.** See on tõenäoliselt surnud või dubleeritud funktsionaalsus.

**Olulisim diagnoos:**
Sa ei ole tehnilises kriisis. Sa oled **kompleksuse-kriisis**. Iga uus feature, mille lisad, maksab sulle 10× hoolduseaega, sest olemasolev kood on nii lai. **Lahendus pole ehitada rohkem — lahendus on kustutada 30–40% sellest, mis juba on.**

---

## 2. Kriitiline tee — mida MITTE KUNAGI katki teha

See on kogu toote **tegelik väärtus**. Iga muu otsus tuleb teha seda teed kaitstes.

**Autentimine:**
- `backend/src/main/java/com/dorachecker/controller/AuthController.java`
- `backend/src/main/java/com/dorachecker/security/JwtService.java`
- `backend/src/main/java/com/dorachecker/security/SecurityConfig.java`
- `backend/src/main/java/com/dorachecker/security/JwtAuthenticationFilter.java`
- `frontend/src/app/auth/*` (service + guard + interceptor)

**Hindamine (assessment) + skooring:**
- `controller/AssessmentController.java`
- `service/AssessmentService.java` (86 LOC — väga hea, ära puutu)
- `service/QuestionService.java` (130 LOC)
- `model/AssessmentEntity.java` + repository

**Lepinguanalüüs + Claude:**
- `controller/ContractAnalysisController.java`
- `service/ContractAnalysisService.java`
- `service/ClaudeApiService.java` (südamik — siit läheb raha Anthropicule ja tuleb tagasi kliendi väärtust)

**PDF-eksport:**
- `service/PdfExportService.java` (279 LOC, puhas)
- `service/ComplianceReportService.java` (1018 LOC — **vajab refaktorit, aga funktsionaalselt töötab**)

**Tellimusmudel + Stripe:**
- `controller/StripeController.java`
- `controller/StripeWebhookController.java`
- `service/SubscriptionGuardService.java` (267 LOC)
- `model/UserSubscriptionEntity.java`

**AI Act klassifikaator (tasuta töövahend + tasuline süvatööriist):**
- `service/AiActClassificationEngine.java` + `AiActClassificationService.java`
- `controller/AiActClassificationController.java` + `AiSystemController.java`

**Need kokku = sinu tegelik toode.** Ülejäänud 70% koodist on saatjatootjate laager.

---

## 3. Funktsioonide triaaž — hoia, tapa, külmuta

### 3.1 HOIA (kõrge väärtus, tegelik kasutus)

| Feature | Põhjendus | Tegevus |
|---|---|---|
| Assessment + AI Contract Analysis | Tuum — see on see, mille eest makstakse | Kaitse, lisa testid |
| PDF-raportid (Assessment, Contract, Gap Analysis, Board) | Reguleeriva väärtusega dokument, salestool | Refaktoreeri (god class) |
| Evidence Vault + Gap Analysis + Evidence Harvester (Jira/GitHub/AWS/Slack jne) | Reaalne kliendiväärtus | Hoia, vaheta integratsioonid "coming soon" vastu kui ei tööta täiuslikult |
| Incident Reporting (Art. 18–19) | DORA kohustuslik | Hoia |
| AI Act Classifier (Public + Premium) | Eraldiseisev värav müügilehtrisse, EU AI Act 2026 | Hoia — see on oluline erineev |
| Subscription Guard + Stripe | Raha voog | Kaitse, viimistle |
| 2FA + OAuth (Google, Microsoft) | Eeldatav enterprise'ist | Hoia |
| Organization + multi-member + SSO | Enterprise deal killer kui puudub | Hoia, dokumenteeri |
| Regulatory Alert Feed + Autopilot Insights | Retention mootor (põhjus tulla iga päev tagasi) | Hoia, lihtsusta |
| Trust Seal + Regulator Portal (public share links) | Viraalne, näiv väärtus | Hoia |

### 3.2 KÜLMUTA (eemalda UX-ist, ei kustuta kohe)

Need on UI-s olemas, aga tõenäoliselt keegi neid ei kasuta. Peida navigatsioonist, hoia kood alles kuni otsus sügisel.

| Feature | Põhjendus |
|---|---|
| Compliance Network (peer benchmarking) | Nõuab kriitilist massi kasutajaid; sul pole seda veel |
| Chain Reaction Simulator | Gamified, demoks ilus, müügis ei tööta |
| Stress Test Simulator | Sama lugu |
| Compliance Autopsy | Post-mortem forensics — nišš nišis |
| Time Machine | Temporal visualisation — huvitav idee, mitte müügiargument |
| Compliance Genome | "Bioinformatics viz" — täiesti eksperimentaalne |
| Digital Twin | Võrgugraafika — tootega mitteseotud |
| Exam Simulator | Koolitustööriist — erinev äri, erinev müügilehter |
| Prosecutor (mock regulatory interrogation) | Cool demo, mitte ostupõhjus |
| What-if Simulator | Dubleerib Chain Reactioni |

**Hinnang kogumahult:** ~25 teenusklassi, ~15 komponenti, ~3500 LOC tagasi.

### 3.3 TAPA (eemalda, kustuta, commit clean)

Need on päris surnud või "ehitasin-ainult-põhimõttel" kood.

| Asi | Kust see on | Miks tappa |
|---|---|---|
| `PromoSlotEntity` + `PromoSlotRepository` | `model/` | 100% surnud — ei kusagil muusa kutsutud |
| ~~`ActionPlanService.java`~~ | ~~`service/`~~ | ~~Defineeritud, iialgi instantieeritud~~ **KORRIGEERITUD 24.04:** LIVE — kasutatud `AssessmentV2Controller` poolt NIS2 action plan'i jaoks. HOIA. |
| ~~`RssFeedParser.java`~~ | ~~`service/`~~ | ~~Orvuksjäänud, sisaldab TODO-d~~ **KORRIGEERITUD 24.04:** LIVE — kasutatud `RegulatoryFeedService`-s Guardian monitooringu jaoks, @Scheduled iga 2h. HOIA. |
| `BalticLeadCrawlerService` (287 LOC) | `service/` | See on **sinu müügitööriist**, mitte kliendi funktsioon. Eemalda toote-koodist. Pane eraldi repo-sse või skripti, kui vaja. |
| `Achievement*` (3 faili) | `service/` + `controller/` + `model/` | Mängustamine — DORA B2B kliendi jaoks kasutu |
| `WarRoomService` (1198 LOC, god class) | `service/` | **Eriline juhtum:** kas see on sisseostu-eristaja või tehniline masturbatsioon? Kui 0 klienti seda viimase 3 kuu jooksul kasutanud → tapa. Kui mõni kasutas → refaktori 3-ks service'iks. |
| `GpaiService` | `service/` | GPAI Act on liiga tuleviku. Tule tagasi 2027-s. |
| `ComplianceDecayService` | `service/` | Spekulatiivne mõiste; kaetud Autopilotis |
| Suur osa ROI-alamsüsteemist (15 entity'it!) | `model/Roi*` | Üle-modelleeritud teiseseks tooteks. **Vali üks**: kas ROI on oluline müügiargument ja sa kommiteerud → puhasta üles; või pole → kustuta 12-st entity'st ja hoia ainult RoiRegister + ROI-export. |

**Hinnang kogumahult:** ~10 teenusklassi, ~5 controller'it, ~15 entity't, ~2500 LOC tagasi.

### 3.4 Eraldi — sinu **tulevikurisk** (lahenda, aga mitte esimene)

- **LemonSqueezy + Stripe duaalbilling** — DB-s on mõlema ID-d, migreerimine pooleli. Kui kunagi pead bill-failure'eid debuggima, lähed sassi. Lõpeta migratsioon lõpuni ära ja kustuta LS-read.
- **Hibernate `ddl-auto=update`** `application.properties`-es → see on prototype-mode. **Migre Flyway-le enne kui järgmise kliendi tood.** Auto-update kustutab veergu ilma küsimata, kui entity muudad.
- **`jwt.secret` default** hardkodeeritud `application.properties` reas 32. Eemalda default, fail-fast kui puudub.

---

## 4. Dubleeritud loogika — konsolideeri

See on **kõige kõrgema ROI-ga refactor**, sest see vähendab korraga koodi *ja* uute feature'ite kulu.

### 4.1 Alert-teenused — 5 → 1

**Dubleeritakse kõik:**
- `ComplianceAlertService`
- `ContractAlertService`
- `UserAlertService`
- `AlertDigestService`
- `AlertMatchingService`
- Lisaks `AiActAlertService` (73 LOC)

**Ettepanek:** üks `AlertService` koos `AlertType` enum'iga (`CONTRACT_BREACH`, `COMPLIANCE_DRIFT`, `REGULATORY_UPDATE`, `AI_ACT_DEADLINE`, `EVIDENCE_EXPIRY`). Üks repository. Üks dispatcher. Üks digest-scheduler.

**Säästetud LOC:** ~700

### 4.2 Eksport-teenused — 6 → 1 facade + 2 rendererit

**Dubleeritakse:**
- `PdfExportService`
- `ProfessionalReportService` (856 LOC)
- `ComplianceReportService` (1018 LOC)
- `ExcelExportService`
- `ICalExportService`
- `BoardPackageService`

Kõik injekteeritakse `ExportController`-isse, mis injekteerib 11 sõltuvust.

**Ettepanek:**
```
ExportFacade
  ├── PdfRenderer (iText)
  ├── ExcelRenderer (POI)
  ├── ICalRenderer
  └── ReportTemplateRegistry  (assessment, contract, gap, board, compliance)
```

`ComplianceReportService` (1018 LOC) on ise god class — sisu jagada pillari kaupa: `IctRiskPillarSection`, `IncidentManagementSection`, `TestingSection`, `ThirdPartySection`, `InfoSharingSection`. Üks üldine composer.

**Säästetud LOC:** ~1500 pärast dedupliseerimist, kuigi kogumaht samaks jääb — peamine võit on **et järgmist raporti muudatust saad teha 1 kohas, mitte 6-s**.

### 4.3 Crawler-teenused — 3 → 1 raamistik + 3 plugin'i

**Dubleeritakse:**
- `IctProviderCrawlerService` (997 LOC, god class)
- `BalticLeadCrawlerService` (287 LOC)
- `CompanyProfileCrawlerService`

Kõikidel sama muster: RestTemplate, JSoup, `TIMEOUT_MS = 30_000`, `RATE_LIMIT_MS = 2_000`, identne try-catch per source.

**Ettepanek:**
```java
interface CrawlSource {
    String name();
    CrawlResult crawl(CrawlContext ctx);
}

class CrawlerOrchestrator {
    List<CrawlSource> sources; // Spring autowire
    void runAll() { ... }
    void runOne(String sourceName) { ... }
}

// Implementations:
class AriregisterSource implements CrawlSource { ... }
class FiRegisterSource implements CrawlSource { ... }
class EbaCtppSource implements CrawlSource { ... }
class TeadmikSource implements CrawlSource { ... }
class InforegisterSource implements CrawlSource { ... }
```

**Säästetud LOC:** ~800

**Lisaks:** kõik crawler'id on cron'is `0 0 3 * * MON` — **DB-lukustused garanteeritud.** Aja need staggeritult (03:00, 03:15, 03:30, 03:45).

### 4.4 AI Act klassifikaatorid — 5 → 3

- `AiActClassificationService`
- `AiActClassificationEngine`
- `AiActClassificationQuestionSeeder`
- `AiActObligationService`
- `AiActPromptTemplateService`

Teoreetiliselt 5 erinevat rolli, praktikas ilmselt kattuvad. Ühendada:
- `AiActClassifier` (engine + service)
- `AiActObligationTracker`
- `AiActQuestionSeeder` (kui see päriselt seed-time'is käib, @PostConstruct või Flyway data)

**Säästetud LOC:** ~250

### 4.5 Scheduled jobs — 13 → 3 käsitsusmudelit

13 erinevat `@Scheduled` klassi, iga üks oma envri muutujaga (`AUTOPILOT_SCHEDULER_ENABLED`, `GUARDIAN_FEED_ENABLED`, `ALERT_DIGEST_ENABLED`, jne). Hale.

Ettepanek: üks `ScheduledJobRegistry`, mille jobs on enable'itavad ühest admin-UI-st või env-muutujate hashmap'ist. Ja **ühtne logimine + monitooring**.

---

## 5. God classes — refaktoreeri

Nimekiri suuruse järgi. Need on kõige keerulisemad kohad sinu koodis ja kõige ohtlikumad muuta.

| Fail | LOC | Probleem | Ettepanek |
|---|---|---|---|
| `service/WarRoomService.java` | 1198 | Scenario defs + session mgmt + cleanup, kõik ühes | Tapa või jaga 3-ks |
| `service/ComplianceReportService.java` | 1018 | PDF-formatteering + äriloogika + pillariloogika | Composer + per-pillar section classes (§4.2) |
| `service/IctProviderCrawlerService.java` | 997 | 5 scrape'i allikat kõik inline | Jaga per-source class'ideks (§4.3) |
| `service/ProfessionalReportService.java` | 856 | Executive PDF-layout | Builder pattern või Thymeleaf-template |
| `controller/ExportController.java` | (11 sõltuvust) | SRP rikutud | ExportFacade (§4.2) |
| `service/AutopilotService.java` | 347 | 8 analüsaatorit ühes klassis | `AutopilotAnalyzer` interface + 8 klassi |

---

## 6. Testikatvuse kriis

See on **suurim tehniline risk** kogu koodibaasis.

**Praegune seis:**
- 11 testifaili / 379 allikafaili ≈ **3%**
- Kriitilisel teel (`AssessmentService`, `ContractAnalysisService`, `PdfExportService`, `SubscriptionGuardService`) on **osaline** katvus — mitte piisav.
- Olemas: `AuthControllerTest`, `BenchmarkControllerTest`, `ExportControllerTest`, `OAuth2ControllerTest`, `ArticleTrackerServiceTest`, `ExamSimulatorServiceTest`, `IctAssetMapServiceTest`, `SubscriptionGuardServiceTest`
- Puudub: 90% teenustest

**Tagajärg:** ükski refaktor, mida ma ülal ettepanekuks teen, ei ole turvaline teha ilma testideta.

**Järeldus:** enne kui midagi muud teed — **lisa integratsioonitestid kriitilise tee jaoks.**

---

## 7. Turvalisus ja operatsioon

Leitud reaalsed probleemid (ranking: kriitiline → nice-to-have):

**KRIITILINE:**
- `jwt.secret=${JWT_SECRET:DoraComplianceCheckerDefaultSecretKeyThatIsAtLeast256BitsLong2024}` — **default hardkodeeritud**. Eemalda default.
- `spring.jpa.hibernate.ddl-auto=update` produktsioonis — **lähtetud migratsioonid.** Migre Flyway-le enne järgmist release'i.
- `ClaudeApiService` — **sünkroonne call, 30s timeout**, aga ei ole circuit breaker'it. Kui Anthropic kuuri läheb, kuivad frontendi päringud ära.

**KÕRGE:**
- Crawler'id kõik kell 3:00 MON → DB-lukustused. Stagger.
- `AlertDigestService` võib teoreetiliselt saata 1000+ emaili paralleelselt. Rate-limit.
- Stripe + LemonSqueezy duaalbilling — lõpeta migratsioon ära.
- `crawl_log` ja `tracking_events` tabelitel ei ole retention-poliitikat. Kasvavad määramatult.

**KESKMINE:**
- Exception-handling kirjutab `new RuntimeException("...")` wrapper'eid. Loo domeeni-exception'ite hierarhia.
- Logidesse kirjutatakse kohati `System.out.println`. Ühtlusta SLF4J-le.
- `backend-debug.log` ja `hs_err_pid*.log` repos — peaksid olema `.gitignore`'s.

---

## 8. Kolm kõrgeima ROI-ga sammu

Kui lugedes vaid üks asi mällu jääb, siis need.

### Samm 1 — **Kustuta 30% koodist**. Kohe.

**Mida kustutada:**
- Kogu 3.3 nimekiri (WarRoom, Genome, TimeMachine, Digital Twin, Chain Reaction, Stress Test, Compliance Autopsy, Compliance Decay, Exam Simulator, Prosecutor, Achievements, Baltic Lead Crawler, GPAI, PromoSlot, ActionPlan, RssFeedParser)
- Sellega koos vastavad controller'id, routed, Angular-komponendid, entity'd

**Hinnang:** ~6000–8000 LOC, ~25 service'it, ~15 routed, ~10 entity't.

**Plaan:**
1. Loo branch `cleanup-phase-1`.
2. Kustuta failid, kustuta route'id app.routes.ts-ist, kustuta navigatsioonist, kustuta sidebar-ist, kustuta mainitud entity'te JPA-autowire'id.
3. Commit per-feature.
4. `./gradlew build` + `npm run build` mõlemad rohelised.
5. Mergi main-iga, pärast release'i vaata logidest, kas keegi tegelikult mainitud route'idele 404 saab. Kui keegi saab → võta tagasi.

**ROI:** Järgmine kord, kui tahad uut feature'it lisada või refaktorit teha, on sinu kognitiivne koormus ~30% väiksem. Selle sammu järel **küsid sa endalt "miks ma kunagi neid üldse ehitasin"**. See on normaalne. Ehitamise rõõm on illusioon — fokusseerimise rõõm on tõeline.

### Samm 2 — **Lisa testid kriitilise tee jaoks**

Enne ühtki refaktorit, enne ühtki suurt uut feature'it:

```
✅ AssessmentServiceTest  (scoring logic, edge cases)
✅ ContractAnalysisServiceTest  (mocked Claude, known inputs)
✅ PdfExportServiceTest  (smoke: PDF non-empty, contains expected sections)
✅ SubscriptionGuardServiceTest  (feature gating matrix)
✅ AuthController integration test  (full login→JWT→protected endpoint)
✅ Stripe webhook integration test  (session.completed → subscription activated)
```

Sihi: **60% katvust kriitilisel teel** kahe nädala jooksul.

**Miks:** sammud 3-st edasi ei ole *üldse* turvalised ilma nendeta.

### Samm 3 — **Konsolideeri dubleeritud teenused** (§4)

Järjekorras ROI-järgi:
1. **Alert services: 5 → 1** (kõige suurem dubleering, selge piiritlus)
2. **Export services: 6 → 1 facade + 2 rendererit** (vabastab sind järgmise PDF-muudatuse eest)
3. **Crawler services: 3 → 1 + plugins** (staggerdib cron'id samal ajal)
4. **AI Act classifiers: 5 → 3**
5. **Scheduled jobs: 13 → 1 registry**

**Hinnang:** 2–3 nädalat fokuseeritud tööd, testid olemas (samm 2).

---

## 9. 90-päeva plaan

**Nädalad 1–2: Testid (Samm 2)**
- Kriitilise tee integratsioonitestid
- Testcontainers Postgres + Keycloak (kui aktiveerid) + WireMock Claude API-le
- CI green on main

**Nädalad 3–4: Kustutamine (Samm 1)**
- Kõik 3.3-s kirjeldatud
- Per-feature commit
- Release ja monitooring

**Nädalad 5–8: Konsolideerimine (Samm 3)**
- Alert-teenuste ühendamine
- Export-facade
- Crawler-pluginid

**Nädalad 9–10: Turva- ja operatsiooniparandused (§7)**
- JWT default eemaldamine
- Flyway sisseseadmine (katvad migratsioonid olemasolevale skeemile)
- ClaudeApi asynchronous + circuit breaker (Resilience4j)
- Crawler-cron staggerdamine
- Retention-poliitikad

**Nädalad 11–12: God class refaktor (§5)**
- `ComplianceReportService` jagamine pillariti
- `IctProviderCrawlerService` lõplik jagamine
- `ExportController` SRP

Pärast 12 nädalat on sul:
- ~70% kood jäänud mahust
- ~60–70% testikatvus kriitilisel teel
- Ühtlane, mõistetav arhitektuur
- Flyway-migratsioonid (uue kliendi turvaline onboardimine)
- Rohkem võimet fokuseeritud müügile, vähem võimet uuenduste lisamisele — **see on eesmärk.**

---

## 10. Kolm asja, mida **mitte teha**

Lõpuks, hoiatused.

1. **Ära alusta Flyway-migratsioonidega.** `ddl-auto=update` on ohtlik, aga kui lähed Flyway-le ilma olemasolevast skeemist lähtestatud baseline'ita, lõhud prod-DB. Tee esmalt `mvn flyway:baseline`, siis *ainult uued* muudatused Flyway-s.

2. **Ära hakka kõiki 100 teenust testima korraga.** Testi ainult kriitilist teed. Kui refaktori tehes avastad, et mingi külmutatud feature lahkub — see on märk, et saad selle kustutada.

3. **Ära lisa uusi feature'id enne kui samm 1 ja 2 on valmis.** Iga uus feature olemasoleva risu peale muudab nii sinu hoolduskoormust kui klientide segadust. "Teie toode teeb 147 asja, aga me ei ostnud seda, sest ei saanud aru mida te päriselt teete" on sinu tõenäoline lugu.

---

## 11. Lõppmärkus

Sinu kõige suurem konkurentsieelis pole tehnoloogia (Spring Boot + Angular on tavalised). Sinu eelis on **sinu LinkedIn-hääl + bränd + 90k impressionit**. Sinu kood peab seda hääli **toetama**, mitte **segama**. Kui klient tuleb 90k-impressionise postituse pealt ja näeb 147-feature'i toodet, mis ei ütle selgelt mida see teeb — sa kaotad. Kui ta näeb sihipärase, väljapoole lihtsustatud, kuid sügavusel tugeva toote — sa võidad.

**Kustuta. Testi. Konsolideeri. Siis ehita uut.**

---

## Lisad

### Lisa A — Kõik backend-controller'id, frontendist mitte-kutsutud

(Tõenäoliselt surnud või dubleeritud — kontrolli manuaalselt enne kustutamist.)

- Paljud eksperimentaalsed controller'id (WarRoom, TimeMachine, Genome, DigitalTwin, ChainReaction, ComplianceAutopsy, StressTest, Prosecutor, ExamSimulator, ComplianceNetwork, ComplianceDecay, Achievement, GPAI)
- Admin controller'id, mida praegu ükski admin-UI ei kutsu kõikides kohtades
- Ariregister-lookup controller (kasutatakse backend'is enrichmentiks, mitte otse UI-st)
- Hulk dubleeritud notification/alert endpoint'e (`/api/notifications/alerts` vs `/api/v1/alerts`)

### Lisa B — Environment-muutujate alam

**Praegu:**
- `POSTGRES_*`, `JWT_SECRET`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`
- `FRONTEND_URL`, `CORS_ORIGINS`
- `CRAWLER_ENABLED`, `CRAWLER_CRON`, `CRAWLER_GOOGLE_ENABLED`, `GOOGLE_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID`
- `AUTOPILOT_SCHEDULER_ENABLED`, `AUTOPILOT_SCHEDULER_CRON`
- `GUARDIAN_FEED_ENABLED`, `GUARDIAN_FEED_CRON`
- `ALERT_DIGEST_ENABLED`
- `RATE_LIMIT_RPM`, `RATE_LIMIT_AI_RPM`
- `UMAMI_APP_SECRET`

**Mis peaks kindlasti olema (ei ole):**
- `SPRING_PROFILES_ACTIVE` selgesti dev/prod eristamiseks
- `HIBERNATE_DDL_AUTO=validate` (produktsioonis) — kui Flyway on peal
- `LOG_LEVEL_ROOT` ja `LOG_LEVEL_APP`

### Lisa C — Välised sõltuvused, ülevaade riskidest

| Teenus | Kriitilisus | Katkemise mõju | Fallback |
|---|---|---|---|
| Claude API | **Kriitiline** | Lepinguanalüüs katki | Puudub — lisa kiiresti |
| Stripe | **Kriitiline** | Makseid ei tule sisse | Webhook-retry olemas |
| Postgres | **Kriitiline** | Kõik katki | K8s HA (kui on) |
| Resend | Keskmine | Emailid ei lähe välja | Graceful degradation on |
| Ariregister (no-auth) | Madal | Lead enrichment vaheks | Caching olemas |
| FI veebisait (scrape) | Madal | Crawler katki | Tolerable |
| EBA / Teadmik / Inforegister | Madal | Täiendavad crawler'id | Sama |

**Suurim risk:** Claude API katke ajal ei saa contract-analyse teha. See on *toote tuum*. **Lisa circuit breaker + queue + user-friendly error.**

---

**Dokumendi lõpp. ~4200 sõna.**
