import { ContractAnalysisResult } from './models';

function req(id: number, art: string, text: string, cat: string, sev: string, w: number, status: 'COVERED' | 'WEAK' | 'MISSING', evidence: string, analysis: string) {
  return { requirementId: id, articleReference: art, requirementText: text, category: cat, severity: sev, weight: w, status, evidenceFound: evidence, analysis };
}

function gap(id: number, art: string, text: string, cat: string, sev: string, status: 'WEAK' | 'MISSING', recommendation: string, clause: string) {
  return { requirementId: id, articleReference: art, requirementText: text, category: cat, severity: sev, status, recommendation, suggestedClause: clause };
}

// ──────────────────────────────────────────
// SCENARIO 1: Hea leping — GREEN ~85%
// ──────────────────────────────────────────
const goodRequirements = [
  req(1, 'DORA Art. 30(2)(a)', 'Kas leping määratleb ICT teenuse ulatuse ja kvaliteedi?', 'SERVICE_LEVEL', 'HIGH', 2, 'COVERED', 'Teenuse kirjeldus sisaldab teenuse ulatuse täpset määratlust, kvaliteedinõudeid ja aktsepteeritavaid teenustasemeid.', 'Lepingus on selgelt määratletud teenuse ulatus ja kvaliteedinõuded.'),
  req(2, 'DORA Art. 30(2)(a)', 'Kas on teenustasemed (SLA) mõõdetavate KPI-dega?', 'SERVICE_LEVEL', 'HIGH', 2, 'COVERED', 'Teenuse kättesaadavus: vähemalt 99.5% kalendrikuus. Reageerimisaeg kriitilistele intsidentidele: kuni 15 minutit.', 'SLA sisaldab mõõdetavaid KPI-sid koos konkreetsete näitajatega.'),
  req(3, 'DORA Art. 30(2)(e)', 'Kas teenusepakkuja teavitab intsidentidest 24h jooksul?', 'INCIDENT', 'CRITICAL', 3, 'COVERED', 'Teenusepakkuja teavitab Tellijat kõigist IKT intsidentidest 24 tunni jooksul nende avastamisest.', '24-tunnine teavitamiskohustus on selgelt määratletud.'),
  req(4, 'DORA Art. 30(2)(d)', 'Kas lepingus on auditeerimisõiguse klausel?', 'AUDIT', 'CRITICAL', 3, 'COVERED', 'Tellijal on õigus auditeerida Teenusepakkuja tegevust, sh kohapealsed kontrollid 10 tööpäeva etteteatamisega.', 'Auditeerimisõigus on lepingus sätestatud koos kohapealsete kontrollide õigusega.'),
  req(5, 'DORA Art. 30(2)(f)', 'Kas on exit-strateegia lepingu lõppemisel?', 'EXIT_STRATEGY', 'CRITICAL', 3, 'COVERED', 'Lepingu lõppemisel tagab Teenusepakkuja üleminekuperioodi kestusega 12 kuud. Andmed tagastatakse 30 päeva jooksul.', 'Exit-strateegia on detailne ja sisaldab üleminekuperioodi, andmete tagastamist ja kustutamist.'),
  req(6, 'DORA Art. 30(2)(b)', 'Kas andmete asukoht on määratletud (EL/mitte-EL)?', 'DATA', 'HIGH', 2, 'COVERED', 'Kõiki andmeid töödeldakse ja hoiustatakse üksnes EL/EMP liikmesriikide territooriumil.', 'Andmete asukoht on selgelt piiratud EL territooriumiga.'),
  req(7, 'DORA Art. 30(2)(a)', 'Kas subkontraktorite kasutamine nõuab nõusolekut?', 'SUBCONTRACTING', 'HIGH', 2, 'COVERED', 'Teenusepakkuja ei kaasa allhankijaid ilma Tellija eelneva kirjaliku nõusolekuta.', 'Allhankijate kaasamine nõuab eelnevat kirjalikku nõusolekut.'),
  req(8, 'DORA Art. 30(2)(f)', 'Kas on andmete tagastamise klausel?', 'EXIT_STRATEGY', 'HIGH', 2, 'COVERED', 'Kogu andmestik tagastatakse kokkulepitud formaadis 30 kalendripäeva jooksul.', 'Andmete tagastamise klausel on olemas koos ajalise raamistikuga.'),
  req(9, 'DORA Art. 30(2)(c)', 'Kas teenusepakkuja järgib küberturbe standardeid?', 'RISK', 'HIGH', 2, 'COVERED', 'Teenusepakkuja järgib ISO 27001 ja SOC 2 standardeid. Sertifikaadid esitatakse kord aastas.', 'Küberturbe standardid on selgelt viidatud ja sertifikaadid nõutud.'),
  req(10, 'DORA Art. 30(2)(c)', 'Kas on disaster recovery nõuded?', 'CONTINUITY', 'CRITICAL', 3, 'COVERED', 'RPO: 1 tund, RTO: 4 tundi. DR-plaan testitakse kord kvartalis.', 'Disaster recovery nõuded on detailsed koos RPO/RTO väärtustega.'),
  req(11, 'DORA Art. 30(2)(b)', 'Kas on konfidentsiaalsuskohustus?', 'LEGAL', 'MEDIUM', 1, 'COVERED', 'Pooled kohustuvad hoidma konfidentsiaalsena kogu lepinguga seotud teavet tähtajatult.', 'Konfidentsiaalsuskohustus on olemas.'),
  req(12, 'DORA Art. 30(2)(a)', 'Kas vastutuse piirangud on määratletud?', 'LEGAL', 'MEDIUM', 1, 'COVERED', 'Teenusepakkuja vastutus on piiratud lepingu aastase väärtusega. Tahtlik rikkumine piiranguid ei rakendata.', 'Vastutuse piirangud on selgelt sätestatud.'),
  req(13, 'DORA Art. 30(2)(c)', 'Kas tehakse regulaarseid turvateste?', 'RISK', 'HIGH', 2, 'COVERED', 'Teenusepakkuja teostab penetratsiooniteste vähemalt kord aastas ja tulemused esitatakse Tellijale.', 'Regulaarsed turvatestid on lepingus ette nähtud.'),
  req(14, 'DORA Art. 30(2)(d)', 'Kas on koostöö finantsjärelevalve asutustega?', 'AUDIT', 'CRITICAL', 3, 'COVERED', 'Finantsjärelevalve asutusel on samaväärsed auditeerimisõigused vastavalt DORA Art. 30(2)(d).', 'Koostöö järelevalveasutustega on tagatud.'),
  req(15, 'DORA Art. 30(2)(f)', 'Kas on teenusepakkuja maksejõuetuse klausel?', 'CONTINUITY', 'HIGH', 2, 'WEAK', 'Lepingus on viide teenusepakkuja majandusliku olukorra halvenemisele, kuid konkreetne maksejõuetuse klausel puudub.', 'Maksejõuetuse klausel on nõrk — puudub konkreetne tegevuskava.'),
  req(16, 'DORA Art. 30 – personaliriskid', 'Kas teenusepakkuja annab kandidaatidele tagasisidet värbamisprotsessis?', 'RECRUITMENT', 'MEDIUM', 1, 'COVERED', 'Teenusepakkuja HR-poliitika näeb ette struktureeritud tagasiside andmist kõigile kandidaatidele.', 'Värbamise tagasiside protsess on olemas.'),
  req(17, 'DORA Art. 30 – personaliriskid', 'Kas teenusepakkujal on kaugtööle kohandatud sisseelamisprogramm?', 'RECRUITMENT', 'MEDIUM', 1, 'COVERED', 'Sisseelamisprogramm sisaldab nii kohapealseid kui kaugtöö elemente.', 'Kaugtöö sisseelamisprogramm on olemas.'),
  req(18, 'DORA Art. 30 – personaliriskid', 'Kas teenusepakkuja töötajate voolavus on stabiilne?', 'RECRUITMENT', 'MEDIUM', 1, 'COVERED', 'Teenusepakkuja töötajate voolavus on alla 10% aastas viimase 3 aasta jooksul.', 'Töötajate voolavus on stabiilne.'),
  req(19, 'DORA Art. 30 – finantsriskid', 'Kas teenusepakkuja kasumimarginaal on jätkusuutlik?', 'FINANCIAL_REPORTING', 'MEDIUM', 1, 'COVERED', 'Viimase 3 aasta kasumimarginaal on stabiilselt üle 15%.', 'Kasumimarginaal on jätkusuutlik.'),
  req(20, 'DORA Art. 30 – finantsriskid', 'Kas teenusepakkuja käibekapital on positiivne?', 'FINANCIAL_REPORTING', 'MEDIUM', 1, 'COVERED', 'Käibekapital on positiivne ja stabiilne.', 'Käibekapital on positiivne.'),
  req(21, 'DORA Art. 30 – finantsriskid', 'Kas teenusepakkujal on esinenud ootamatuid suuri kahjumeid?', 'FINANCIAL_REPORTING', 'MEDIUM', 1, 'COVERED', 'Suuri ootamatuid kahjumeid ei ole esinenud viimase 5 aasta jooksul.', 'Ootamatuid kahjumeid ei ole esinenud.'),
  req(22, 'DORA Art. 30 – finantsriskid', 'Kas teenusepakkuja kohustuste kasv on varade kasvuga proportsionaalne?', 'FINANCIAL_REPORTING', 'MEDIUM', 1, 'WEAK', 'Kohustuste ja varade suhe on olemas, kuid detailne analüüs puudub.', 'Finantsnäitajad on osaliselt esitatud, kuid detailsus puudulik.'),
  req(23, 'DORA Art. 6(1)', 'Kas on ICT riskihalduse raamistik?', 'ICT_RISK_MANAGEMENT', 'CRITICAL', 3, 'COVERED', 'Teenusepakkuja rakendab ICT riskihalduse raamistikku vastavalt ISO 27001 ja DORA nõuetele.', 'ICT riskihalduse raamistik on olemas ja dokumenteeritud.'),
  req(24, 'DORA Art. 8(1)', 'Kas ICT süsteemid ja varad on kaardistatud ja klassifitseeritud?', 'ICT_RISK_MANAGEMENT', 'CRITICAL', 3, 'COVERED', 'Kõik ICT varad on kaardistatud CMDB-s ja klassifitseeritud kriitilisuse järgi.', 'ICT varade kaardistus on põhjalik.'),
  req(25, 'DORA Art. 11(1)', 'Kas on ICT talitluspidevuse poliitika?', 'ICT_RISK_MANAGEMENT', 'CRITICAL', 3, 'COVERED', 'Talitluspidevuse poliitika on kinnitatud ja katab kõiki kriitilisi teenuseid.', 'Talitluspidevuse poliitika on olemas.'),
  req(26, 'DORA Art. 9(1)', 'Kas on ICT turvapoliitika ja juurdepääsu kontroll?', 'ICT_RISK_MANAGEMENT', 'CRITICAL', 3, 'COVERED', 'Turvapoliitika rakendab vähima õiguse printsiipi, MFA-d ja regulaarset juurdepääsu ülevaatust.', 'Turvapoliitika ja juurdepääsu kontroll on põhjalikud.'),
  req(27, 'DORA Art. 18(1)', 'Kas on ICT intsidentide klassifitseerimise protsess?', 'INCIDENT_MANAGEMENT', 'CRITICAL', 3, 'COVERED', 'Intsidendid klassifitseeritakse kriitilisuse järgi 4-tasemelise skaala alusel.', 'Intsidentide klassifitseerimise protsess on olemas.'),
  req(28, 'DORA Art. 19(1)', 'Kas on oluliste ICT intsidentide teavitamise protsess?', 'INCIDENT_MANAGEMENT', 'CRITICAL', 3, 'COVERED', 'Oluliste intsidentide teavitamine toimub automaatselt SIEM süsteemi kaudu 1 tunni jooksul.', 'Teavitamisprotsess on automatiseeritud ja õigeaegne.'),
  req(29, 'DORA Art. 13(1)', 'Kas intsidentidest õpitakse ja parendusi rakendatakse?', 'INCIDENT_MANAGEMENT', 'HIGH', 2, 'COVERED', 'Iga intsidendi järel viiakse läbi post-mortem analüüs ja parendusmeetmed dokumenteeritakse.', 'Post-mortem protsess on struktureeritud.'),
  req(30, 'DORA Art. 10(1)', 'Kas on küberohutuvastuse ja reageerimise võimekus?', 'INCIDENT_MANAGEMENT', 'CRITICAL', 3, 'WEAK', 'Teenusepakkujal on SOC teenus, kuid 24/7 katvus on piiratud tööpäevadega.', 'SOC teenus on olemas, kuid 24/7 katvus vajab täiendamist.'),
  req(31, 'DORA Art. 24(1)', 'Kas tehakse regulaarseid ICT turvateste?', 'TESTING', 'HIGH', 2, 'COVERED', 'Penetratsioonitestid teostatakse vähemalt kord aastas sõltumatu partneri poolt.', 'Regulaarsed turvatestid on tagatud.'),
  req(32, 'DORA Art. 26(1)', 'Kas tehakse TLPT teste kriitiliste süsteemide jaoks?', 'TESTING', 'HIGH', 2, 'WEAK', 'TLPT testid on planeeritud, kuid veel teostamata.', 'TLPT testid on planeeritud, kuid pole veel läbi viidud.'),
  req(33, 'DORA Art. 24(5)', 'Kas testitulemused on dokumenteeritud ja puudused parandatud?', 'TESTING', 'HIGH', 2, 'COVERED', 'Testitulemused dokumenteeritakse Jira-s ja puudused parandatakse 30 päeva jooksul.', 'Testitulemuste dokumenteerimine ja puuduste parandamine on struktureeritud.'),
  req(34, 'DORA Art. 11(6)', 'Kas ICT talitluspidevuse plaane testitakse regulaarselt?', 'TESTING', 'HIGH', 2, 'COVERED', 'Talitluspidevuse plaane testitakse kord kvartalis. Viimane test: 2025 Q4.', 'Regulaarsed BCP testid on tagatud.'),
  req(35, 'DORA Art. 45(1)', 'Kas finantsüksus osaleb küberohuteavet jagavas kogukonnas?', 'INFORMATION_SHARING', 'MEDIUM', 1, 'MISSING', 'Puudub.', 'Küberohuteavet jagava kogukonna liikmesus puudub.'),
  req(36, 'DORA Art. 45(2)', 'Kas on protsess küberohuteavet vastuvõtmiseks ja kasutamiseks?', 'INFORMATION_SHARING', 'MEDIUM', 1, 'MISSING', 'Puudub.', 'Küberohuteavet protsess puudub.'),
  req(37, 'DORA Art. 45(3)', 'Kas olulist intsidentteavet jagatakse teiste finantsüksustega?', 'INFORMATION_SHARING', 'MEDIUM', 1, 'MISSING', 'Puudub.', 'Intsidentteavet jagamise protsess puudub.'),
];

const goodGaps = [
  gap(15, 'DORA Art. 30(2)(f)', 'Kas on teenusepakkuja maksejõuetuse klausel?', 'CONTINUITY', 'HIGH', 'WEAK', 'Täiendage lepingut konkreetse maksejõuetuse klausliga, mis kirjeldab andmete ja teenuse üleminekut.', 'Teenusepakkuja maksejõuetuse korral on Tellijal õigus leping erakorraliselt üles öelda. Teenusepakkuja tagab andmete üleandmise 14 päeva jooksul.'),
  gap(22, 'DORA Art. 30 – finantsriskid', 'Kas teenusepakkuja kohustuste kasv on varade kasvuga proportsionaalne?', 'FINANCIAL_REPORTING', 'MEDIUM', 'WEAK', 'Nõudke teenusepakkujalt detailsemat finantsaruandlust.', 'Teenusepakkuja esitab Tellijale kvartaalselt finantsaruande, mis sisaldab varade ja kohustuste suhtarvu analüüsi.'),
  gap(30, 'DORA Art. 10(1)', 'Kas on küberohutuvastuse ja reageerimise võimekus?', 'INCIDENT_MANAGEMENT', 'CRITICAL', 'WEAK', 'Laiendage SOC teenuse katvust 24/7 režiimile.', 'Teenusepakkuja tagab 24/7 küberohutuvastuse ja reageerimise võimekuse SOC teenuse kaudu.'),
  gap(32, 'DORA Art. 26(1)', 'Kas tehakse TLPT teste kriitiliste süsteemide jaoks?', 'TESTING', 'HIGH', 'WEAK', 'Viige planeeritud TLPT testid läbi ja dokumenteerige tulemused.', 'Teenusepakkuja teostab TLPT teste kriitiliste süsteemide jaoks vähemalt kord aastas.'),
  gap(35, 'DORA Art. 45(1)', 'Kas finantsüksus osaleb küberohuteavet jagavas kogukonnas?', 'INFORMATION_SHARING', 'MEDIUM', 'MISSING', 'Liituge küberohuteavet jagava kogukonnaga (nt FS-ISAC, EE-ISAC).', 'Tellija liitub küberohuteavet jagava kogukonnaga ja osaleb aktiivselt teabe jagamises.'),
  gap(36, 'DORA Art. 45(2)', 'Kas on protsess küberohuteavet vastuvõtmiseks ja kasutamiseks?', 'INFORMATION_SHARING', 'MEDIUM', 'MISSING', 'Looge protsess küberohuteavet vastuvõtmiseks, analüüsimiseks ja kasutamiseks.', 'Tellija kehtestab protsessi küberohuteavet vastuvõtmiseks ja kasutamiseks ohumudelite ajakohastamisel.'),
  gap(37, 'DORA Art. 45(3)', 'Kas olulist intsidentteavet jagatakse teiste finantsüksustega?', 'INFORMATION_SHARING', 'MEDIUM', 'MISSING', 'Looge intsidentteavet jagamise protsess teiste finantsüksustega.', 'Tellija jagab olulist intsidentteavet teiste finantsüksustega vastavalt DORA Art. 45(3) nõuetele.'),
];

export const DEMO_GOOD: ContractAnalysisResult = {
  id: 'demo-good',
  companyName: 'Fintech Solutions OÜ',
  contractName: 'Pilveteenus leping nr 2024-085',
  fileName: 'demo-hea-leping.pdf',
  analysisDate: '2026-01-15T10:30:00',
  defensibilityScore: 85.2,
  defensibilityLevel: 'GREEN',
  coveredCount: 30,
  weakCount: 4,
  missingCount: 3,
  totalRequirements: 37,
  requirements: goodRequirements,
  gaps: goodGaps,
  executiveSummary: 'Leping katab enamiku DORA Art. 30 nõuetest ja on regulaatori auditi ees hästi kaitstav. Peamised puudused on seotud küberohuteavet jagamise ja mõnede operatiivsete nõuetega, mis vajavad täiendamist.',
};

// ──────────────────────────────────────────
// SCENARIO 2: Keskmine leping — YELLOW ~58%
// ──────────────────────────────────────────
const mediumRequirements = [
  req(1, 'DORA Art. 30(2)(a)', 'Kas leping määratleb ICT teenuse ulatuse ja kvaliteedi?', 'SERVICE_LEVEL', 'HIGH', 2, 'COVERED', 'Teenuse kirjeldus on olemas, kuid üldine.', 'Teenuse kirjeldus on olemas, kuid võiks olla detailsem.'),
  req(2, 'DORA Art. 30(2)(a)', 'Kas on teenustasemed (SLA) mõõdetavate KPI-dega?', 'SERVICE_LEVEL', 'HIGH', 2, 'WEAK', 'SLA-s on mainitud kättesaadavust, kuid konkreetsed KPI-d puuduvad.', 'SLA eksisteerib, kuid mõõdetavad KPI-d on puudulikud.'),
  req(3, 'DORA Art. 30(2)(e)', 'Kas teenusepakkuja teavitab intsidentidest 24h jooksul?', 'INCIDENT', 'CRITICAL', 3, 'COVERED', 'Teenusepakkuja teavitab intsidentidest "mõistliku aja jooksul", mis on täpsustatud kui 24 tundi.', 'Teavitamiskohustus on olemas 24h piirmääraga.'),
  req(4, 'DORA Art. 30(2)(d)', 'Kas lepingus on auditeerimisõiguse klausel?', 'AUDIT', 'CRITICAL', 3, 'COVERED', 'Tellijal on õigus auditeerida teenusepakkujat kord aastas.', 'Auditeerimisõigus on olemas, kuigi piiratud kord aastas.'),
  req(5, 'DORA Art. 30(2)(f)', 'Kas on exit-strateegia lepingu lõppemisel?', 'EXIT_STRATEGY', 'CRITICAL', 3, 'WEAK', 'Lepingus on mainitud üleminekuperiood, kuid detailid puuduvad.', 'Exit-strateegia on pealiskaudne — puuduvad konkreetsed tähtajad ja protseduurid.'),
  req(6, 'DORA Art. 30(2)(b)', 'Kas andmete asukoht on määratletud (EL/mitte-EL)?', 'DATA', 'HIGH', 2, 'COVERED', 'Andmeid hoiustatakse EL-s, konkreetsed asukohad on Lisa 3-s.', 'Andmete asukoht on selgelt EL-s.'),
  req(7, 'DORA Art. 30(2)(a)', 'Kas subkontraktorite kasutamine nõuab nõusolekut?', 'SUBCONTRACTING', 'HIGH', 2, 'WEAK', 'Lepingus on mainitud teavitamiskohustus, kuid eelnevat nõusolekut ei nõuta.', 'Allhankijate kasutamine nõuab ainult teavitamist, mitte nõusolekut.'),
  req(8, 'DORA Art. 30(2)(f)', 'Kas on andmete tagastamise klausel?', 'EXIT_STRATEGY', 'HIGH', 2, 'COVERED', 'Andmed tagastatakse lepingu lõppemisel 60 päeva jooksul.', 'Andmete tagastamise klausel on olemas.'),
  req(9, 'DORA Art. 30(2)(c)', 'Kas teenusepakkuja järgib küberturbe standardeid?', 'RISK', 'HIGH', 2, 'WEAK', 'Teenusepakkuja viitab "parimatele praktikatele" ilma konkreetsete standarditeta.', 'Küberturbe standardid on viidatud üldiselt, konkreetsed standardid puuduvad.'),
  req(10, 'DORA Art. 30(2)(c)', 'Kas on disaster recovery nõuded?', 'CONTINUITY', 'CRITICAL', 3, 'MISSING', 'Puudub.', 'Disaster recovery nõuded puuduvad lepingust täielikult.'),
  req(11, 'DORA Art. 30(2)(b)', 'Kas on konfidentsiaalsuskohustus?', 'LEGAL', 'MEDIUM', 1, 'COVERED', 'Konfidentsiaalsuskohustus kehtib lepingu kehtivuse ajal ja 3 aastat pärast lõppemist.', 'Konfidentsiaalsuskohustus on olemas.'),
  req(12, 'DORA Art. 30(2)(a)', 'Kas vastutuse piirangud on määratletud?', 'LEGAL', 'MEDIUM', 1, 'COVERED', 'Vastutus on piiratud lepingu väärtusega.', 'Vastutuse piirangud on sätestatud.'),
  req(13, 'DORA Art. 30(2)(c)', 'Kas tehakse regulaarseid turvateste?', 'RISK', 'HIGH', 2, 'MISSING', 'Puudub.', 'Regulaarsed turvatestid ei ole lepingus ette nähtud.'),
  req(14, 'DORA Art. 30(2)(d)', 'Kas on koostöö finantsjärelevalve asutustega?', 'AUDIT', 'CRITICAL', 3, 'MISSING', 'Puudub.', 'Koostöö järelevalveasutustega ei ole lepingus käsitletud.'),
  req(15, 'DORA Art. 30(2)(f)', 'Kas on teenusepakkuja maksejõuetuse klausel?', 'CONTINUITY', 'HIGH', 2, 'MISSING', 'Puudub.', 'Maksejõuetuse klausel puudub.'),
  req(16, 'DORA Art. 30 – personaliriskid', 'Kas teenusepakkuja annab kandidaatidele tagasisidet värbamisprotsessis?', 'RECRUITMENT', 'MEDIUM', 1, 'COVERED', 'HR-poliitika näeb ette tagasisidet.', 'Värbamise tagasiside on olemas.'),
  req(17, 'DORA Art. 30 – personaliriskid', 'Kas teenusepakkujal on kaugtööle kohandatud sisseelamisprogramm?', 'RECRUITMENT', 'MEDIUM', 1, 'WEAK', 'Sisseelamisprogramm on olemas, kuid kaugtöö aspekt pole eraldi käsitletud.', 'Sisseelamisprogramm on puudulik kaugtöö osas.'),
  req(18, 'DORA Art. 30 – personaliriskid', 'Kas teenusepakkuja töötajate voolavus on stabiilne?', 'RECRUITMENT', 'MEDIUM', 1, 'COVERED', 'Töötajate voolavus on ca 12% aastas.', 'Voolavus on mõõdukas.'),
  req(19, 'DORA Art. 30 – finantsriskid', 'Kas teenusepakkuja kasumimarginaal on jätkusuutlik?', 'FINANCIAL_REPORTING', 'MEDIUM', 1, 'COVERED', 'Kasumimarginaal on ca 10%.', 'Kasumimarginaal on positiivne.'),
  req(20, 'DORA Art. 30 – finantsriskid', 'Kas teenusepakkuja käibekapital on positiivne?', 'FINANCIAL_REPORTING', 'MEDIUM', 1, 'COVERED', 'Käibekapital on positiivne.', 'Käibekapital on positiivne.'),
  req(21, 'DORA Art. 30 – finantsriskid', 'Kas teenusepakkujal on esinenud ootamatuid suuri kahjumeid?', 'FINANCIAL_REPORTING', 'MEDIUM', 1, 'MISSING', 'Puudub.', 'Finantsinformatsioon suurte kahjumite kohta puudub.'),
  req(22, 'DORA Art. 30 – finantsriskid', 'Kas teenusepakkuja kohustuste kasv on varade kasvuga proportsionaalne?', 'FINANCIAL_REPORTING', 'MEDIUM', 1, 'MISSING', 'Puudub.', 'Finantssuhtarvude analüüs puudub.'),
  req(23, 'DORA Art. 6(1)', 'Kas on ICT riskihalduse raamistik?', 'ICT_RISK_MANAGEMENT', 'CRITICAL', 3, 'WEAK', 'Teenusepakkuja viitab riskihaldusele, kuid raamistik ei ole dokumenteeritud.', 'Riskihalduse raamistik on nõrk — puudub formaalne dokumentatsioon.'),
  req(24, 'DORA Art. 8(1)', 'Kas ICT süsteemid ja varad on kaardistatud ja klassifitseeritud?', 'ICT_RISK_MANAGEMENT', 'CRITICAL', 3, 'MISSING', 'Puudub.', 'ICT varade kaardistus puudub.'),
  req(25, 'DORA Art. 11(1)', 'Kas on ICT talitluspidevuse poliitika?', 'ICT_RISK_MANAGEMENT', 'CRITICAL', 3, 'MISSING', 'Puudub.', 'Talitluspidevuse poliitika puudub.'),
  req(26, 'DORA Art. 9(1)', 'Kas on ICT turvapoliitika ja juurdepääsu kontroll?', 'ICT_RISK_MANAGEMENT', 'CRITICAL', 3, 'COVERED', 'Juurdepääsu kontroll on rollidepõhine ja dokumenteeritud.', 'Turvapoliitika ja juurdepääsu kontroll on olemas.'),
  req(27, 'DORA Art. 18(1)', 'Kas on ICT intsidentide klassifitseerimise protsess?', 'INCIDENT_MANAGEMENT', 'CRITICAL', 3, 'WEAK', 'Intsidente klassifitseeritakse, kuid protsess ei ole formaliseeritud.', 'Klassifitseerimise protsess on mitteformaalne.'),
  req(28, 'DORA Art. 19(1)', 'Kas on oluliste ICT intsidentide teavitamise protsess?', 'INCIDENT_MANAGEMENT', 'CRITICAL', 3, 'COVERED', 'Oluliste intsidentide teavitamine on automaatne.', 'Teavitamisprotsess on olemas.'),
  req(29, 'DORA Art. 13(1)', 'Kas intsidentidest õpitakse ja parendusi rakendatakse?', 'INCIDENT_MANAGEMENT', 'HIGH', 2, 'MISSING', 'Puudub.', 'Intsidentidest õppimise protsess puudub.'),
  req(30, 'DORA Art. 10(1)', 'Kas on küberohutuvastuse ja reageerimise võimekus?', 'INCIDENT_MANAGEMENT', 'CRITICAL', 3, 'MISSING', 'Puudub.', 'Küberohutuvastuse ja reageerimise võimekus puudub.'),
  req(31, 'DORA Art. 24(1)', 'Kas tehakse regulaarseid ICT turvateste?', 'TESTING', 'HIGH', 2, 'MISSING', 'Puudub.', 'ICT turvatestid ei ole ette nähtud.'),
  req(32, 'DORA Art. 26(1)', 'Kas tehakse TLPT teste kriitiliste süsteemide jaoks?', 'TESTING', 'HIGH', 2, 'MISSING', 'Puudub.', 'TLPT testid puuduvad.'),
  req(33, 'DORA Art. 24(5)', 'Kas testitulemused on dokumenteeritud ja puudused parandatud?', 'TESTING', 'HIGH', 2, 'MISSING', 'Puudub.', 'Testitulemuste dokumenteerimine puudub.'),
  req(34, 'DORA Art. 11(6)', 'Kas ICT talitluspidevuse plaane testitakse regulaarselt?', 'TESTING', 'HIGH', 2, 'MISSING', 'Puudub.', 'Talitluspidevuse plaanide testimine puudub.'),
  req(35, 'DORA Art. 45(1)', 'Kas finantsüksus osaleb küberohuteavet jagavas kogukonnas?', 'INFORMATION_SHARING', 'MEDIUM', 1, 'MISSING', 'Puudub.', 'Küberohuteavet jagava kogukonna liikmesus puudub.'),
  req(36, 'DORA Art. 45(2)', 'Kas on protsess küberohuteavet vastuvõtmiseks ja kasutamiseks?', 'INFORMATION_SHARING', 'MEDIUM', 1, 'MISSING', 'Puudub.', 'Küberohuteavet protsess puudub.'),
  req(37, 'DORA Art. 45(3)', 'Kas olulist intsidentteavet jagatakse teiste finantsüksustega?', 'INFORMATION_SHARING', 'MEDIUM', 1, 'MISSING', 'Puudub.', 'Intsidentteavet jagamine puudub.'),
];

const mediumGaps = [
  gap(2, 'DORA Art. 30(2)(a)', 'Kas on teenustasemed (SLA) mõõdetavate KPI-dega?', 'SERVICE_LEVEL', 'HIGH', 'WEAK', 'Lisage SLA-sse konkreetsed mõõdetavad KPI-d: kättesaadavus (%), reageerimisaeg, lahendusaeg.', 'Pooled lepivad kokku järgmistes teenustasemetes: (a) kättesaadavus vähemalt 99,5%; (b) reageerimisaeg kuni 15 min; (c) lahendusaeg kuni 4h.'),
  gap(5, 'DORA Art. 30(2)(f)', 'Kas on exit-strateegia lepingu lõppemisel?', 'EXIT_STRATEGY', 'CRITICAL', 'WEAK', 'Koostage detailne exit-strateegia koos üleminekuperioodi, andmete migratsiooni ja ajakavaga.', 'Lepingu lõppemisel tagab Teenusepakkuja üleminekuperioodi kestusega 12 kuud. Andmed tagastatakse 30 päeva jooksul.'),
  gap(7, 'DORA Art. 30(2)(a)', 'Kas subkontraktorite kasutamine nõuab nõusolekut?', 'SUBCONTRACTING', 'HIGH', 'WEAK', 'Muutke teavitamiskohustus eelnevaks kirjalikuks nõusolekuks.', 'Teenusepakkuja ei kaasa allhankijaid ilma Tellija eelneva kirjaliku nõusolekuta.'),
  gap(9, 'DORA Art. 30(2)(c)', 'Kas teenusepakkuja järgib küberturbe standardeid?', 'RISK', 'HIGH', 'WEAK', 'Viidake konkreetsetele standarditele (ISO 27001, SOC 2) ja nõudke sertifikaate.', 'Teenusepakkuja järgib ISO 27001 ja SOC 2 standardeid ning esitab sertifikaadid kord aastas.'),
  gap(10, 'DORA Art. 30(2)(c)', 'Kas on disaster recovery nõuded?', 'CONTINUITY', 'CRITICAL', 'MISSING', 'Lisage disaster recovery nõuded koos RPO/RTO väärtustega.', 'Teenusepakkuja tagab: RPO kuni 1 tund, RTO kuni 4 tundi. DR-plaani testitakse kord kvartalis.'),
  gap(13, 'DORA Art. 30(2)(c)', 'Kas tehakse regulaarseid turvateste?', 'RISK', 'HIGH', 'MISSING', 'Lisage lepingusse regulaarsete turvatestide nõue.', 'Teenusepakkuja teostab penetratsiooniteste vähemalt kord aastas sõltumatu partneri poolt.'),
  gap(14, 'DORA Art. 30(2)(d)', 'Kas on koostöö finantsjärelevalve asutustega?', 'AUDIT', 'CRITICAL', 'MISSING', 'Lisage klausel finantsjärelevalve asutuste auditeerimisõiguse kohta.', 'Finantsjärelevalve asutusel on samaväärsed auditeerimisõigused vastavalt DORA Art. 30(2)(d).'),
  gap(15, 'DORA Art. 30(2)(f)', 'Kas on teenusepakkuja maksejõuetuse klausel?', 'CONTINUITY', 'HIGH', 'MISSING', 'Lisage maksejõuetuse klausel.', 'Teenusepakkuja maksejõuetuse korral on Tellijal õigus leping erakorraliselt üles öelda.'),
  gap(17, 'DORA Art. 30 – personaliriskid', 'Kas teenusepakkujal on kaugtööle kohandatud sisseelamisprogramm?', 'RECRUITMENT', 'MEDIUM', 'WEAK', 'Täiendage sisseelamisprogrammi kaugtöö elementidega.', ''),
  gap(21, 'DORA Art. 30 – finantsriskid', 'Kas teenusepakkujal on esinenud ootamatuid suuri kahjumeid?', 'FINANCIAL_REPORTING', 'MEDIUM', 'MISSING', 'Nõudke teenusepakkujalt finantsaruandlust suurte kahjumite kohta.', ''),
  gap(22, 'DORA Art. 30 – finantsriskid', 'Kas teenusepakkuja kohustuste kasv on varade kasvuga proportsionaalne?', 'FINANCIAL_REPORTING', 'MEDIUM', 'MISSING', 'Nõudke detailsemat finantsanalüüsi.', ''),
  gap(23, 'DORA Art. 6(1)', 'Kas on ICT riskihalduse raamistik?', 'ICT_RISK_MANAGEMENT', 'CRITICAL', 'WEAK', 'Nõudke formaalset ICT riskihalduse raamistikku.', 'Teenusepakkuja rakendab dokumenteeritud ICT riskihalduse raamistikku vastavalt ISO 27001 nõuetele.'),
  gap(24, 'DORA Art. 8(1)', 'Kas ICT süsteemid ja varad on kaardistatud ja klassifitseeritud?', 'ICT_RISK_MANAGEMENT', 'CRITICAL', 'MISSING', 'Nõudke ICT varade kaardistamist ja klassifitseerimist.', 'Teenusepakkuja kaardistab kõik ICT varad CMDB-s ja klassifitseerib kriitilisuse järgi.'),
  gap(25, 'DORA Art. 11(1)', 'Kas on ICT talitluspidevuse poliitika?', 'ICT_RISK_MANAGEMENT', 'CRITICAL', 'MISSING', 'Nõudke ICT talitluspidevuse poliitikat.', 'Teenusepakkuja kehtestab talitluspidevuse poliitika, mis katab kõiki kriitilisi teenuseid.'),
  gap(27, 'DORA Art. 18(1)', 'Kas on ICT intsidentide klassifitseerimise protsess?', 'INCIDENT_MANAGEMENT', 'CRITICAL', 'WEAK', 'Formaliseerige intsidentide klassifitseerimise protsess.', 'Intsidendid klassifitseeritakse kriitilisuse järgi 4-tasemelise skaala alusel.'),
  gap(29, 'DORA Art. 13(1)', 'Kas intsidentidest õpitakse ja parendusi rakendatakse?', 'INCIDENT_MANAGEMENT', 'HIGH', 'MISSING', 'Looge post-mortem analüüsi protsess.', 'Iga intsidendi järel viiakse läbi post-mortem analüüs ja parendusmeetmed dokumenteeritakse.'),
  gap(30, 'DORA Art. 10(1)', 'Kas on küberohutuvastuse ja reageerimise võimekus?', 'INCIDENT_MANAGEMENT', 'CRITICAL', 'MISSING', 'Looge küberohutuvastuse ja reageerimise võimekus.', 'Teenusepakkuja tagab 24/7 küberohutuvastuse ja reageerimise võimekuse.'),
  gap(31, 'DORA Art. 24(1)', 'Kas tehakse regulaarseid ICT turvateste?', 'TESTING', 'HIGH', 'MISSING', 'Lisage regulaarsete turvatestide nõue.', ''),
  gap(32, 'DORA Art. 26(1)', 'Kas tehakse TLPT teste?', 'TESTING', 'HIGH', 'MISSING', 'Lisage TLPT testide nõue.', ''),
  gap(33, 'DORA Art. 24(5)', 'Kas testitulemused on dokumenteeritud?', 'TESTING', 'HIGH', 'MISSING', 'Lisage testitulemuste dokumenteerimise nõue.', ''),
  gap(34, 'DORA Art. 11(6)', 'Kas talitluspidevuse plaane testitakse?', 'TESTING', 'HIGH', 'MISSING', 'Lisage BCP testimise nõue.', ''),
  gap(35, 'DORA Art. 45(1)', 'Küberohuteavet jagava kogukonna liikmesus', 'INFORMATION_SHARING', 'MEDIUM', 'MISSING', 'Liituge küberohuteavet jagava kogukonnaga.', ''),
  gap(36, 'DORA Art. 45(2)', 'Küberohuteavet vastuvõtmise protsess', 'INFORMATION_SHARING', 'MEDIUM', 'MISSING', 'Looge küberohuteavet protsess.', ''),
  gap(37, 'DORA Art. 45(3)', 'Intsidentteavet jagamine', 'INFORMATION_SHARING', 'MEDIUM', 'MISSING', 'Looge intsidentteavet jagamise protsess.', ''),
];

export const DEMO_MEDIUM: ContractAnalysisResult = {
  id: 'demo-medium',
  companyName: 'Nordic Bank AS',
  contractName: 'IT hooldusleping nr 2023-142',
  fileName: 'demo-keskmine-leping.pdf',
  analysisDate: '2026-01-15T14:00:00',
  defensibilityScore: 58.1,
  defensibilityLevel: 'YELLOW',
  coveredCount: 13,
  weakCount: 7,
  missingCount: 17,
  totalRequirements: 37,
  requirements: mediumRequirements,
  gaps: mediumGaps,
  executiveSummary: 'Leping katab põhilised lepingulised nõuded, kuid DORA-spetsiifilised nõuded on suures osas puudulikud. Kriitilised puudused on disaster recovery, finantsjärelevalve koostöö ja ICT riskihalduse valdkonnas. Leping vajab olulist täiendamist enne regulaatori auditit.',
};

// ──────────────────────────────────────────
// SCENARIO 3: Nõrk leping — RED ~23%
// ──────────────────────────────────────────
const weakRequirements = [
  req(1, 'DORA Art. 30(2)(a)', 'Kas leping määratleb ICT teenuse ulatuse ja kvaliteedi?', 'SERVICE_LEVEL', 'HIGH', 2, 'WEAK', 'Teenuse kirjeldus on väga üldine: "IT teenused vastavalt vajadusele".', 'Teenuse kirjeldus on liiga üldine ja ebamäärane.'),
  req(2, 'DORA Art. 30(2)(a)', 'Kas on teenustasemed (SLA) mõõdetavate KPI-dega?', 'SERVICE_LEVEL', 'HIGH', 2, 'MISSING', 'Puudub.', 'SLA puudub täielikult.'),
  req(3, 'DORA Art. 30(2)(e)', 'Kas teenusepakkuja teavitab intsidentidest 24h jooksul?', 'INCIDENT', 'CRITICAL', 3, 'WEAK', 'Lepingus on mainitud "teavitamine vajadusel" ilma konkreetse tähtajata.', 'Teavitamiskohustus on ebamäärane, puudub ajaline piirmäär.'),
  req(4, 'DORA Art. 30(2)(d)', 'Kas lepingus on auditeerimisõiguse klausel?', 'AUDIT', 'CRITICAL', 3, 'MISSING', 'Puudub.', 'Auditeerimisõiguse klausel puudub täielikult.'),
  req(5, 'DORA Art. 30(2)(f)', 'Kas on exit-strateegia lepingu lõppemisel?', 'EXIT_STRATEGY', 'CRITICAL', 3, 'MISSING', 'Puudub.', 'Exit-strateegia puudub.'),
  req(6, 'DORA Art. 30(2)(b)', 'Kas andmete asukoht on määratletud (EL/mitte-EL)?', 'DATA', 'HIGH', 2, 'MISSING', 'Puudub.', 'Andmete asukoht ei ole lepingus määratletud.'),
  req(7, 'DORA Art. 30(2)(a)', 'Kas subkontraktorite kasutamine nõuab nõusolekut?', 'SUBCONTRACTING', 'HIGH', 2, 'MISSING', 'Puudub.', 'Subkontraktorite kasutamise tingimused puuduvad.'),
  req(8, 'DORA Art. 30(2)(f)', 'Kas on andmete tagastamise klausel?', 'EXIT_STRATEGY', 'HIGH', 2, 'MISSING', 'Puudub.', 'Andmete tagastamise klausel puudub.'),
  req(9, 'DORA Art. 30(2)(c)', 'Kas teenusepakkuja järgib küberturbe standardeid?', 'RISK', 'HIGH', 2, 'MISSING', 'Puudub.', 'Küberturbe standardid ei ole lepingus viidatud.'),
  req(10, 'DORA Art. 30(2)(c)', 'Kas on disaster recovery nõuded?', 'CONTINUITY', 'CRITICAL', 3, 'MISSING', 'Puudub.', 'Disaster recovery nõuded puuduvad.'),
  req(11, 'DORA Art. 30(2)(b)', 'Kas on konfidentsiaalsuskohustus?', 'LEGAL', 'MEDIUM', 1, 'COVERED', 'Pooled kohustuvad hoidma konfidentsiaalsena kogu lepinguga seotud teavet.', 'Konfidentsiaalsuskohustus on olemas.'),
  req(12, 'DORA Art. 30(2)(a)', 'Kas vastutuse piirangud on määratletud?', 'LEGAL', 'MEDIUM', 1, 'COVERED', 'Vastutus piiratud lepingu väärtusega.', 'Vastutuse piirangud on olemas.'),
  req(13, 'DORA Art. 30(2)(c)', 'Kas tehakse regulaarseid turvateste?', 'RISK', 'HIGH', 2, 'MISSING', 'Puudub.', 'Turvatestid ei ole ette nähtud.'),
  req(14, 'DORA Art. 30(2)(d)', 'Kas on koostöö finantsjärelevalve asutustega?', 'AUDIT', 'CRITICAL', 3, 'MISSING', 'Puudub.', 'Koostöö järelevalveasutustega puudub.'),
  req(15, 'DORA Art. 30(2)(f)', 'Kas on teenusepakkuja maksejõuetuse klausel?', 'CONTINUITY', 'HIGH', 2, 'MISSING', 'Puudub.', 'Maksejõuetuse klausel puudub.'),
  req(16, 'DORA Art. 30 – personaliriskid', 'Kas teenusepakkuja annab kandidaatidele tagasisidet värbamisprotsessis?', 'RECRUITMENT', 'MEDIUM', 1, 'MISSING', 'Puudub.', 'Värbamise tagasiside pole käsitletud.'),
  req(17, 'DORA Art. 30 – personaliriskid', 'Kas teenusepakkujal on kaugtööle kohandatud sisseelamisprogramm?', 'RECRUITMENT', 'MEDIUM', 1, 'MISSING', 'Puudub.', 'Sisseelamisprogramm puudub.'),
  req(18, 'DORA Art. 30 – personaliriskid', 'Kas teenusepakkuja töötajate voolavus on stabiilne?', 'RECRUITMENT', 'MEDIUM', 1, 'MISSING', 'Puudub.', 'Tööjõu voolavuse info puudub.'),
  req(19, 'DORA Art. 30 – finantsriskid', 'Kas teenusepakkuja kasumimarginaal on jätkusuutlik?', 'FINANCIAL_REPORTING', 'MEDIUM', 1, 'MISSING', 'Puudub.', 'Finantsinformatsioon puudub.'),
  req(20, 'DORA Art. 30 – finantsriskid', 'Kas teenusepakkuja käibekapital on positiivne?', 'FINANCIAL_REPORTING', 'MEDIUM', 1, 'MISSING', 'Puudub.', 'Käibekapitali info puudub.'),
  req(21, 'DORA Art. 30 – finantsriskid', 'Kas teenusepakkujal on esinenud ootamatuid suuri kahjumeid?', 'FINANCIAL_REPORTING', 'MEDIUM', 1, 'MISSING', 'Puudub.', 'Finantsinformatsioon puudub.'),
  req(22, 'DORA Art. 30 – finantsriskid', 'Kas teenusepakkuja kohustuste kasv on varade kasvuga proportsionaalne?', 'FINANCIAL_REPORTING', 'MEDIUM', 1, 'MISSING', 'Puudub.', 'Finantssuhtarvud puuduvad.'),
  req(23, 'DORA Art. 6(1)', 'Kas on ICT riskihalduse raamistik?', 'ICT_RISK_MANAGEMENT', 'CRITICAL', 3, 'MISSING', 'Puudub.', 'ICT riskihalduse raamistik puudub.'),
  req(24, 'DORA Art. 8(1)', 'Kas ICT süsteemid ja varad on kaardistatud ja klassifitseeritud?', 'ICT_RISK_MANAGEMENT', 'CRITICAL', 3, 'MISSING', 'Puudub.', 'ICT varade kaardistus puudub.'),
  req(25, 'DORA Art. 11(1)', 'Kas on ICT talitluspidevuse poliitika?', 'ICT_RISK_MANAGEMENT', 'CRITICAL', 3, 'MISSING', 'Puudub.', 'Talitluspidevuse poliitika puudub.'),
  req(26, 'DORA Art. 9(1)', 'Kas on ICT turvapoliitika ja juurdepääsu kontroll?', 'ICT_RISK_MANAGEMENT', 'CRITICAL', 3, 'MISSING', 'Puudub.', 'Turvapoliitika ja juurdepääsu kontroll puuduvad.'),
  req(27, 'DORA Art. 18(1)', 'Kas on ICT intsidentide klassifitseerimise protsess?', 'INCIDENT_MANAGEMENT', 'CRITICAL', 3, 'MISSING', 'Puudub.', 'Intsidentide klassifitseerimise protsess puudub.'),
  req(28, 'DORA Art. 19(1)', 'Kas on oluliste ICT intsidentide teavitamise protsess?', 'INCIDENT_MANAGEMENT', 'CRITICAL', 3, 'MISSING', 'Puudub.', 'Teavitamisprotsess puudub.'),
  req(29, 'DORA Art. 13(1)', 'Kas intsidentidest õpitakse ja parendusi rakendatakse?', 'INCIDENT_MANAGEMENT', 'HIGH', 2, 'MISSING', 'Puudub.', 'Post-mortem protsess puudub.'),
  req(30, 'DORA Art. 10(1)', 'Kas on küberohutuvastuse ja reageerimise võimekus?', 'INCIDENT_MANAGEMENT', 'CRITICAL', 3, 'MISSING', 'Puudub.', 'Küberohutuvastuse võimekus puudub.'),
  req(31, 'DORA Art. 24(1)', 'Kas tehakse regulaarseid ICT turvateste?', 'TESTING', 'HIGH', 2, 'MISSING', 'Puudub.', 'ICT turvatestid puuduvad.'),
  req(32, 'DORA Art. 26(1)', 'Kas tehakse TLPT teste kriitiliste süsteemide jaoks?', 'TESTING', 'HIGH', 2, 'MISSING', 'Puudub.', 'TLPT testid puuduvad.'),
  req(33, 'DORA Art. 24(5)', 'Kas testitulemused on dokumenteeritud ja puudused parandatud?', 'TESTING', 'HIGH', 2, 'MISSING', 'Puudub.', 'Testitulemuste dokumenteerimine puudub.'),
  req(34, 'DORA Art. 11(6)', 'Kas ICT talitluspidevuse plaane testitakse regulaarselt?', 'TESTING', 'HIGH', 2, 'MISSING', 'Puudub.', 'BCP testimine puudub.'),
  req(35, 'DORA Art. 45(1)', 'Kas finantsüksus osaleb küberohuteavet jagavas kogukonnas?', 'INFORMATION_SHARING', 'MEDIUM', 1, 'MISSING', 'Puudub.', 'Puudub.'),
  req(36, 'DORA Art. 45(2)', 'Kas on protsess küberohuteavet vastuvõtmiseks ja kasutamiseks?', 'INFORMATION_SHARING', 'MEDIUM', 1, 'MISSING', 'Puudub.', 'Puudub.'),
  req(37, 'DORA Art. 45(3)', 'Kas olulist intsidentteavet jagatakse teiste finantsüksustega?', 'INFORMATION_SHARING', 'MEDIUM', 1, 'MISSING', 'Puudub.', 'Puudub.'),
];

const weakGaps = weakRequirements
  .filter(r => r.status !== 'COVERED')
  .map(r => gap(
    r.requirementId, r.articleReference, r.requirementText, r.category, r.severity,
    r.status as 'WEAK' | 'MISSING',
    r.status === 'MISSING' ? `Lisage lepingusse ${r.requirementText.toLowerCase().replace('kas ', '').replace('?', '')} nõue.` : `Täpsustage ja tugevdage olemasolevat klauslit.`,
    ''
  ));

export const DEMO_WEAK: ContractAnalysisResult = {
  id: 'demo-weak',
  companyName: 'Crypto Trading OÜ',
  contractName: 'Serverimajutus leping nr 2022-007',
  fileName: 'demo-nork-leping.pdf',
  analysisDate: '2026-01-15T16:45:00',
  defensibilityScore: 23.4,
  defensibilityLevel: 'RED',
  coveredCount: 2,
  weakCount: 2,
  missingCount: 33,
  totalRequirements: 37,
  requirements: weakRequirements,
  gaps: weakGaps,
  executiveSummary: 'Leping on regulaatori auditi ees praktiliselt kaitsmata. Puuduvad peaaegu kõik DORA Art. 30 nõutavad klauslid, sh auditeerimisõigus, exit-strateegia, disaster recovery, ICT riskihaldus ja intsidentide haldus. Leping vajab täielikku ümbertöötamist.',
};

export const DEMO_SCENARIOS: ContractAnalysisResult[] = [DEMO_GOOD, DEMO_MEDIUM, DEMO_WEAK];

export function getDemoScenario(id: string): ContractAnalysisResult | null {
  return DEMO_SCENARIOS.find(s => s.id === id) || null;
}
