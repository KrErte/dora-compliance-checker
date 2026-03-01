import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LangService } from '../lang.service';

interface PolicyTemplate {
  id: string;
  name: { et: string; en: string };
  doraRef: string;
  icon: string;
  sections: { title: { et: string; en: string }; body: { et: string; en: string } }[];
}

const TEMPLATES: PolicyTemplate[] = [
  {
    id: 'ict-risk', name: { et: 'IKT riskihalduse raamistik', en: 'ICT Risk Management Framework' },
    doraRef: 'Art. 5-6', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    sections: [
      { title: { et: '1. Eesmärk ja ulatus', en: '1. Purpose and Scope' },
        body: { et: 'Käesolev raamistik kehtestab [COMPANY] IKT riskihalduse põhimõtted, protsessid ja vastutused vastavalt DORA määruse artiklitele 5-6. Raamistik kohaldub kõigile IKT süsteemidele, protsessidele ja teenustele, mida [COMPANY] kasutab oma äritegevuses.', en: 'This framework establishes [COMPANY]\'s ICT risk management principles, processes, and responsibilities in accordance with DORA Articles 5-6. The framework applies to all ICT systems, processes, and services used by [COMPANY] in its business operations.' }},
      { title: { et: '2. Regulatiivne alus', en: '2. Regulatory Basis' },
        body: { et: 'Käesolev dokument põhineb Euroopa Parlamendi ja Nõukogu määrusel (EL) 2022/2554 (DORA), eelkõige artiklitel 5 (juhtimine ja korraldus), 6 (IKT riskihalduse raamistik), 7 (IKT süsteemid, protokollid ja vahendid) ning 8 (tuvastamine). Raamistik arvestab ka EBA, ESMA ja EIOPA poolt välja antud regulatiivsete tehniliste standarditega (RTS).', en: 'This document is based on Regulation (EU) 2022/2554 (DORA), specifically Articles 5 (governance and organization), 6 (ICT risk management framework), 7 (ICT systems, protocols and tools), and 8 (identification). The framework also considers Regulatory Technical Standards (RTS) issued by EBA, ESMA, and EIOPA.' }},
      { title: { et: '3. Juhtimine ja vastutus', en: '3. Governance and Accountability' },
        body: { et: '[COMPANY] juhatus vastutab IKT riskihalduse raamistiku kehtestamise ja heakskiitmise eest (DORA Art. 5(2)). Juhatus määrab [BOARD_MEMBER] vastutavaks IKT riskihalduse järelevalve eest. [CISO] vastutab raamistiku igapäevase rakendamise ja ajakohastamise eest. Juhatus vaatab raamistiku läbi vähemalt kord aastas.', en: '[COMPANY] management body is responsible for establishing and approving the ICT risk management framework (DORA Art. 5(2)). The board designates [BOARD_MEMBER] as responsible for ICT risk management oversight. [CISO] is responsible for day-to-day implementation and maintenance. The board reviews the framework at least annually.' }},
      { title: { et: '4. IKT riskide tuvastamine ja hindamine', en: '4. ICT Risk Identification and Assessment' },
        body: { et: '[COMPANY] teostab IKT riskide hindamist vähemalt kord aastas ning iga olulise muudatuse korral IKT süsteemides. Hindamine hõlmab: (a) IKT varade inventuuri ja klassifikatsiooni, (b) ohtude ja haavatavuste analüüsi, (c) riskide tõenäosuse ja mõju hindamist, (d) jääkriskide dokumenteerimist. Kõik tuvastatud riskid registreeritakse IKT riskide registris.', en: '[COMPANY] conducts ICT risk assessments at least annually and upon any significant change to ICT systems. Assessment includes: (a) ICT asset inventory and classification, (b) threat and vulnerability analysis, (c) risk likelihood and impact evaluation, (d) residual risk documentation. All identified risks are recorded in the ICT risk register.' }},
      { title: { et: '5. Kaitse ja ennetamine', en: '5. Protection and Prevention' },
        body: { et: '[COMPANY] rakendab mitmekihilise kaitse põhimõtet, mis hõlmab: juurdepääsu haldust (minimaalsete õiguste printsiip), võrgu segmenteerimist, andmete krüpteerimist (nii edastamisel kui salvestamisel), turvauuenduste haldust (kriitilistele süsteemidele 72h jooksul), ja füüsilise turvalisuse meetmeid andmekeskustes. Kõik kaitsemeetmed dokumenteeritakse ja testitakse regulaarselt.', en: '[COMPANY] implements defense-in-depth principles including: access management (least privilege), network segmentation, data encryption (in transit and at rest), patch management (critical systems within 72h), and physical security measures for data centers. All protective measures are documented and tested regularly.' }},
      { title: { et: '6. Tuvastamine ja seire', en: '6. Detection and Monitoring' },
        body: { et: '[COMPANY] rakendab pideva seire süsteemi, mis hõlmab: (a) SIEM süsteemi turvajuhtumite tuvastamiseks, (b) võrguliikluse monitoorimist, (c) anomaaliate tuvastamist, (d) logide kogumist ja säilitamist vähemalt 12 kuud. Kriitiliste süsteemide monitooring toimub 24/7 ning häired edastatakse vastutavale personalile reaalajas.', en: '[COMPANY] implements continuous monitoring including: (a) SIEM system for security event detection, (b) network traffic monitoring, (c) anomaly detection, (d) log collection and retention for at least 12 months. Critical systems are monitored 24/7 with real-time alerting to responsible personnel.' }},
      { title: { et: '7. Reageerimine ja taastumine', en: '7. Response and Recovery' },
        body: { et: '[COMPANY] on kehtestanud IKT intsidentide reageerimise plaani vastavalt DORA artiklitele 17-23. Plaan sisaldab: intsidentide klassifitseerimise kriteeriumeid, eskalatsiooni protseduure, kommunikatsiooniplaani (sh regulaatorile teavitamine 4h jooksul olulistest intsidentidest), taastumise protseduure (RTO: [COMPANY-SPECIFIC], RPO: [COMPANY-SPECIFIC]) ning juurpõhjuse analüüsi protsessi.', en: '[COMPANY] has established an ICT incident response plan per DORA Articles 17-23. The plan includes: incident classification criteria, escalation procedures, communication plan (including regulator notification within 4h for major incidents), recovery procedures (RTO: [COMPANY-SPECIFIC], RPO: [COMPANY-SPECIFIC]), and root cause analysis process.' }},
      { title: { et: '8. IKT varahaldus', en: '8. ICT Asset Management' },
        body: { et: '[COMPANY] peab IKT varade registrit, mis sisaldab kõiki riist- ja tarkvaralisi varasid, nende klassifikatsiooni (kriitiline/oluline/tavaline), vastutavaid isikuid, elutsükli staatust ja seoseid äriprotsessidega. Register vaadatakse üle kvartaalselt ja ajakohastatakse iga muudatuse korral. Varade kasutuselt kõrvaldamine toimub turvalise kustutamise protseduuride kohaselt.', en: '[COMPANY] maintains an ICT asset register containing all hardware and software assets, their classification (critical/important/standard), responsible persons, lifecycle status, and business process dependencies. The register is reviewed quarterly and updated upon any change. Asset decommissioning follows secure disposal procedures.' }},
      { title: { et: '9. Kommunikatsioon ja aruandlus', en: '9. Communication and Reporting' },
        body: { et: '[CISO] esitab juhatusele kvartaalselt IKT riskihalduse aruande, mis sisaldab: riskiregistri ülevaadet, intsidentide statistikat, testimise tulemuste kokkuvõtet, kolmanda osapoole riskide ülevaadet ning soovitusi. Olulistest riskimuutustest teavitatakse juhatust viivitamatult. Aruandlus toimub vastavalt DORA Art. 6(5) nõuetele.', en: '[CISO] submits a quarterly ICT risk management report to the board including: risk register overview, incident statistics, testing results summary, third-party risk overview, and recommendations. Significant risk changes are reported to the board immediately. Reporting follows DORA Art. 6(5) requirements.' }},
      { title: { et: '10. Läbivaatamine ja pidev parendamine', en: '10. Review and Continuous Improvement' },
        body: { et: 'Käesolevat raamistikku vaadatakse läbi vähemalt kord aastas, pärast olulisi intsidente ning regulatiivsete nõuete muutumisel. Läbivaatamise tulemused dokumenteeritakse ja kinnitatakse juhatuse poolt. [COMPANY] kohaldab pidevat parendamist, integreerides intsidentidest ja testimistest saadud õppetunnid riskihalduse protsessidesse. Raamistiku versiooniajalugu ja muudatused dokumenteeritakse auditijälje tagamiseks.', en: 'This framework is reviewed at least annually, after significant incidents, and upon regulatory changes. Review outcomes are documented and approved by the board. [COMPANY] applies continuous improvement by integrating lessons learned from incidents and testing into risk management processes. Framework version history and changes are documented for audit trail purposes.' }}
    ]
  },
  {
    id: 'incident-response', name: { et: 'Intsidentide reageerimise plaan', en: 'Incident Response Plan' },
    doraRef: 'Art. 17-23', icon: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
    sections: [
      { title: { et: '1. Eesmärk', en: '1. Purpose' },
        body: { et: 'Käesolev plaan kehtestab [COMPANY] IKT intsidentide tuvastamise, klassifitseerimise, reageerimise ja raporteerimise protseduurid vastavalt DORA artiklitele 17-23. Plaan kohaldub kõigile IKT-ga seotud intsidentidele, mis mõjutavad [COMPANY] süsteeme, andmeid või teenuseid.', en: 'This plan establishes [COMPANY]\'s procedures for ICT incident detection, classification, response, and reporting per DORA Articles 17-23. The plan applies to all ICT-related incidents affecting [COMPANY] systems, data, or services.' }},
      { title: { et: '2. Intsidentide klassifitseerimine', en: '2. Incident Classification' },
        body: { et: 'Intsidendid klassifitseeritakse vastavalt DORA Art. 18 kriteeriumidele: (a) mõjutatud klientide arv, (b) kestus, (c) geograafiline ulatus, (d) andmekadu, (e) majandusmõju, (f) kriitiliste teenuste mõjutatus. Klassid: KRIITILINE (regulaatorile teavitamine kohustuslik), OLULINE (sisemine eskaleerimine), VÄIKE (logi ja jälgi).', en: 'Incidents are classified per DORA Art. 18 criteria: (a) affected clients count, (b) duration, (c) geographical spread, (d) data loss, (e) economic impact, (f) critical service impact. Classes: MAJOR (regulator notification mandatory), SIGNIFICANT (internal escalation), MINOR (log and monitor).' }},
      { title: { et: '3. Eskalatsiooni protseduurid', en: '3. Escalation Procedures' },
        body: { et: 'Kriitilised intsidendid: kohene eskalatsioon [CISO]-le → juhatuse teavitamine 1h → regulaatori esialgne teavitus 4h → vahearuanne 72h → lõpparuanne 1 kuu. Olulised intsidendid: eskalatsioon IT juhile → [CISO] teavitamine 4h. Väikesed intsidendid: IT meeskonna sisene lahendamine ja logimine.', en: 'Major incidents: immediate escalation to [CISO] → board notification 1h → regulator initial notification 4h → intermediate report 72h → final report 1 month. Significant incidents: escalation to IT manager → [CISO] notification 4h. Minor incidents: internal IT team resolution and logging.' }},
      { title: { et: '4. Reageerimise meeskond', en: '4. Response Team' },
        body: { et: 'IKT intsidentide reageerimise meeskond (IRT) koosneb: [CISO] (juht), IT operatsioonide juht, turvameeskonna juht, kommunikatsioonijuht, õigusosakonna esindaja. Meeskond on kättesaadav 24/7 kriitiliste intsidentide korral. Kontaktandmed ja varuisikud on dokumenteeritud eraldi konfidentsiaalses dokumendis.', en: 'The ICT Incident Response Team (IRT) consists of: [CISO] (lead), IT operations manager, security team lead, communications lead, legal representative. The team is available 24/7 for major incidents. Contact details and backup persons are documented in a separate confidential document.' }},
      { title: { et: '5. Regulaatorile raporteerimise protsess', en: '5. Regulatory Reporting Process' },
        body: { et: 'Kriitiliste intsidentide raporteerimise ajajoon: Esialgne teavitus (4h): intsidendi tüüp, mõjutatud teenused, esialgne mõjuhinnang. Vahearuanne (72h): detailne kirjeldus, mõjutatud kliendid, võetud meetmed, IoC-d. Lõpparuanne (1 kuu): juurpõhjuse analüüs, rakendatud meetmed, piiriülene mõju, ennetusmeetmed.', en: 'Major incident reporting timeline: Initial notification (4h): incident type, affected services, initial impact assessment. Intermediate report (72h): detailed description, affected clients, measures taken, IoCs. Final report (1 month): root cause analysis, measures implemented, cross-border impact, prevention measures.' }},
      { title: { et: '6. Taastumise protseduurid', en: '6. Recovery Procedures' },
        body: { et: '[COMPANY] taastumise eesmärgid: RTO (taastumisaja eesmärk): kriitilised süsteemid [COMPANY-SPECIFIC], olulised süsteemid [COMPANY-SPECIFIC]. RPO (andmete taastamise punkt): kriitilised andmed [COMPANY-SPECIFIC]. Taastumisplaan sisaldab varundusstrateegiaid, failover-protseduure ja kommunikatsiooniplaani klientidele.', en: '[COMPANY] recovery objectives: RTO (Recovery Time Objective): critical systems [COMPANY-SPECIFIC], important systems [COMPANY-SPECIFIC]. RPO (Recovery Point Objective): critical data [COMPANY-SPECIFIC]. Recovery plan includes backup strategies, failover procedures, and client communication plan.' }},
      { title: { et: '7. Intsidendijärgne analüüs', en: '7. Post-Incident Review' },
        body: { et: 'Iga kriitilise ja olulise intsidendi järel viiakse 10 tööpäeva jooksul läbi juurpõhjuse analüüs. Analüüs dokumenteeritakse ja sisaldab: kronoloogiat, juurpõhjust, mõju ulatust, reageerimise tõhususe hinnangut, õppetunde ja ennetusmeetmeid. Tulemused esitatakse juhatusele ja integreeritakse riskihalduse raamistikku.', en: 'A root cause analysis is conducted within 10 business days after every major and significant incident. Analysis is documented and includes: chronology, root cause, impact scope, response effectiveness evaluation, lessons learned, and prevention measures. Results are reported to the board and integrated into the risk management framework.' }}
    ]
  },
  {
    id: 'bcp', name: { et: 'Äritegevuse jätkuvuse plaan', en: 'Business Continuity Plan' },
    doraRef: 'Art. 11-12', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    sections: [
      { title: { et: '1. Eesmärk ja ulatus', en: '1. Purpose and Scope' },
        body: { et: 'Käesolev äritegevuse jätkuvuse plaan (BCP) kehtestab [COMPANY] protseduurid IKT teenuste ja äriprotsesside jätkuvuse tagamiseks häirete korral vastavalt DORA artiklitele 11-12. Plaan katab kõik kriitilised ja olulised ärifunktsioonid ning neid toetavad IKT süsteemid.', en: 'This Business Continuity Plan (BCP) establishes [COMPANY]\'s procedures for ensuring continuity of ICT services and business processes during disruptions per DORA Articles 11-12. The plan covers all critical and important business functions and their supporting ICT systems.' }},
      { title: { et: '2. Ärimõju analüüs (BIA)', en: '2. Business Impact Analysis (BIA)' },
        body: { et: '[COMPANY] teostab ärimõju analüüsi vähemalt kord aastas, mis määratleb: kriitilised äriprotsessid ja nende IKT sõltuvused, maksimaalsed lubatavad seisakuajad (MTPD), taastumisaja eesmärgid (RTO/RPO), minimaalsed teenustasemed häire ajal, ning rahalise ja mainelise mõju hinnangud iga stsenaariumiga.', en: '[COMPANY] conducts a business impact analysis at least annually, identifying: critical business processes and their ICT dependencies, maximum tolerable periods of disruption (MTPD), recovery time objectives (RTO/RPO), minimum service levels during disruption, and financial and reputational impact estimates per scenario.' }},
      { title: { et: '3. Jätkuvuse strateegiad', en: '3. Continuity Strategies' },
        body: { et: '[COMPANY] jätkuvuse strateegiad: (a) Andmete varundamine: [COMPANY-SPECIFIC] sagedus, geograafiliselt eraldiseisev asukohavalik; (b) Infrastruktuuri redundantsus: kriitiliste süsteemide puhul aktiivne-aktiivne või aktiivne-passiivne konfiguratsioon; (c) Alternatiivsed töökohad: [COMPANY-SPECIFIC]; (d) Kommunikatsiooni varuplaanid: alternatiivsed sidekanalid ja kontaktpunktid.', en: '[COMPANY] continuity strategies: (a) Data backup: [COMPANY-SPECIFIC] frequency, geographically separate location; (b) Infrastructure redundancy: active-active or active-passive for critical systems; (c) Alternative work locations: [COMPANY-SPECIFIC]; (d) Communication contingency: alternative channels and contact points.' }},
      { title: { et: '4. Testimine ja harjutused', en: '4. Testing and Exercises' },
        body: { et: 'BCP-d testitakse vähemalt kord aastas ning pärast olulisi muudatusi. Testimise programm sisaldab: (a) lauaharjutusi kvartaalselt, (b) simulatsiooniharjutusi poolaastas, (c) täismahus failover-teste kord aastas kriitiliste süsteemide jaoks. Testimise tulemused dokumenteeritakse ja puudused kõrvaldatakse 30 päeva jooksul.', en: 'The BCP is tested at least annually and after significant changes. Testing programme includes: (a) tabletop exercises quarterly, (b) simulation exercises semi-annually, (c) full failover tests annually for critical systems. Testing results are documented and deficiencies remediated within 30 days.' }},
      { title: { et: '5. Kriisikommunikatsioon', en: '5. Crisis Communication' },
        body: { et: 'Kriisikommunikatsiooni plaan: (a) Sisemine: personali teavitamine [COMPANY-SPECIFIC] kanalite kaudu; (b) Kliendid: teavitamine esimesel võimalusel, kuid mitte hiljem kui [COMPANY-SPECIFIC]; (c) Regulaator: vastavalt DORA raporteerimise nõuetele; (d) Meedia: kommunikatsioonijuhi kaudu, kooskõlastatult õigusosakonnaga. Võtmesõnumid ja pressiteated on eelnevalt ettevalmistatud.', en: 'Crisis communication plan: (a) Internal: staff notification via [COMPANY-SPECIFIC] channels; (b) Clients: notification at earliest opportunity, no later than [COMPANY-SPECIFIC]; (c) Regulator: per DORA reporting requirements; (d) Media: via communications lead, coordinated with legal. Key messages and press statements are pre-prepared.' }},
      { title: { et: '6. Läbivaatamine ja ajakohastamine', en: '6. Review and Update' },
        body: { et: 'BCP vaadatakse läbi ja ajakohastatakse: vähemalt kord aastas, pärast olulisi intsidente, pärast ärimudeli muutusi, pärast IKT infrastruktuuri muudatusi, regulatiivsete nõuete muutumisel. Muudatused kinnitatakse [BOARD_MEMBER] poolt ja kommunikeeritakse kõigile asjaosalistele. Kehtiv versioon säilitatakse nii digitaalselt kui paberkandjal.', en: 'The BCP is reviewed and updated: at least annually, after significant incidents, after business model changes, after ICT infrastructure changes, upon regulatory changes. Changes are approved by [BOARD_MEMBER] and communicated to all stakeholders. Current version is maintained both digitally and in hard copy.' }}
    ]
  },
  {
    id: 'tprm', name: { et: 'Kolmanda osapoole riskihalduse poliitika', en: 'Third-Party Risk Management Policy' },
    doraRef: 'Art. 28-30', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    sections: [
      { title: { et: '1. Eesmärk', en: '1. Purpose' },
        body: { et: 'Käesolev poliitika kehtestab [COMPANY] nõuded IKT kolmanda osapoole teenusepakkujate riskihaldusele vastavalt DORA artiklitele 28-44. Poliitika kohaldub kõigile IKT-teenuste lepingutele, sh pilv-, tarkvara-, infrastruktuuri- ja andmetöötlusteenustele.', en: 'This policy establishes [COMPANY]\'s requirements for ICT third-party service provider risk management per DORA Articles 28-44. The policy applies to all ICT service agreements, including cloud, software, infrastructure, and data processing services.' }},
      { title: { et: '2. Teaberegister (RoI)', en: '2. Register of Information (RoI)' },
        body: { et: '[COMPANY] peab teaberegistrit kõigi IKT kolmanda osapoole lepinguliste kokkulepete kohta vastavalt DORA Art. 28(3). Register sisaldab ESA xBRL-CSV formaadis 13 tabelit ning esitatakse pädevale asutusele nõudmisel ja vähemalt kord aastas. Register ajakohastatakse iga lepingulise muudatuse korral.', en: '[COMPANY] maintains a register of information for all ICT third-party contractual arrangements per DORA Art. 28(3). The register contains 13 templates in ESA xBRL-CSV format and is submitted to the competent authority upon request and at least annually. The register is updated upon any contractual change.' }},
      { title: { et: '3. Lepingulised nõuded (Art. 30)', en: '3. Contractual Requirements (Art. 30)' },
        body: { et: 'Kõik IKT-teenuste lepingud peavad sisaldama DORA Art. 30 kohustuslikke tingimusi: teenuse kirjeldus ja SLA-d, andmete asukoht, intsidentidest teavitamine, auditeerimisõigused, lepingu lõpetamise tingimused, andmete tagastamine. Kriitiliste funktsioonide lepingud peavad lisaks sisaldama: väljumisstrateegiat, alltöövõtjate haldamist, RTO/RPO eesmärke.', en: 'All ICT service agreements must include DORA Art. 30 mandatory provisions: service description and SLAs, data location, incident notification, audit rights, termination conditions, data return. Critical function contracts must additionally include: exit strategy, subcontractor management, RTO/RPO targets.' }},
      { title: { et: '4. Riskihindamine', en: '4. Risk Assessment' },
        body: { et: 'Enne lepingu sõlmimist viiakse läbi due diligence ja riskihindamine. Hindamine sisaldab: teenusepakkuja finantsilist stabiilsust, turvameetmeid, vastavust regulatiivsetele nõuetele, BCM-võimekust, alltöövõtjate kasutamist ja kontsentreerumisriski analüüsi. Kriitiliste teenusepakkujate puhul viiakse hindamine läbi kord aastas.', en: 'Due diligence and risk assessment is conducted before contract execution. Assessment includes: provider financial stability, security measures, regulatory compliance, BCM capability, subcontractor usage, and concentration risk analysis. For critical service providers, assessment is conducted annually.' }},
      { title: { et: '5. Kontsentreerumisriski haldamine', en: '5. Concentration Risk Management' },
        body: { et: '[COMPANY] hindab IKT kontsentreerumisriski vastavalt DORA Art. 29. Hindamine hõlmab: ühe teenusepakkuja osakaal kriitilistes funktsioonides, alternatiivide olemasolu, teenusepakkuja asendatavus. Kui üks teenusepakkuja toetab enam kui [COMPANY-SPECIFIC]% kriitilistest funktsioonidest, tuleb koostada leevendusplaan ja väljumisstrateegia.', en: '[COMPANY] assesses ICT concentration risk per DORA Art. 29. Assessment covers: single provider share in critical functions, availability of alternatives, provider substitutability. If one provider supports more than [COMPANY-SPECIFIC]% of critical functions, a mitigation plan and exit strategy must be developed.' }},
      { title: { et: '6. Väljumisstrateegiad', en: '6. Exit Strategies' },
        body: { et: 'Kriitiliste ja oluliste funktsioonide teenusepakkujate jaoks koostab [COMPANY] väljumisstrateegiad, mis sisaldavad: alternatiivsete pakkujate analüüsi, üleminekuplaani (max [COMPANY-SPECIFIC] kuud), andmete migreerumise protsessi, minimaalsete teenustasemete tagamist ülemineku ajal ja ülemineku testimist vähemalt kord kahe aasta jooksul.', en: 'For critical and important function providers, [COMPANY] prepares exit strategies including: alternative provider analysis, transition plan (max [COMPANY-SPECIFIC] months), data migration process, minimum service level assurance during transition, and transition testing at least once every two years.' }}
    ]
  },
  {
    id: 'testing', name: { et: 'Vastupidavuse testimise programm', en: 'Resilience Testing Programme' },
    doraRef: 'Art. 24-27', icon: 'M9 11 3 3L22 4',
    sections: [
      { title: { et: '1. Eesmärk', en: '1. Purpose' },
        body: { et: 'Käesolev programm kehtestab [COMPANY] digitaalse operatiivse vastupidavuse testimise raamistiku vastavalt DORA artiklitele 24-27. Programm tagab, et kõik kriitilised IKT süsteemid ja protsessid testitakse regulaarselt ning tuvastatud puudused kõrvaldatakse.', en: 'This programme establishes [COMPANY]\'s digital operational resilience testing framework per DORA Articles 24-27. The programme ensures all critical ICT systems and processes are tested regularly and identified deficiencies are remediated.' }},
      { title: { et: '2. Testimise ulatus', en: '2. Testing Scope' },
        body: { et: 'Testimise programm hõlmab: haavatavuse skaneerimist (vähemalt kvartaalselt), läbistustestimist (vähemalt kord aastas), avatud lähtekoodiga tarkvara analüüsi, võrgu turvalisuse testimist, stsenaariumipõhiseid teste, ja äritegevuse jätkuvuse teste. Kriitilised süsteemid testitakse prioriteetselt.', en: 'Testing programme covers: vulnerability scanning (at least quarterly), penetration testing (at least annually), open source software analysis, network security testing, scenario-based testing, and business continuity tests. Critical systems are tested with priority.' }},
      { title: { et: '3. TLPT (Threat-Led Penetration Testing)', en: '3. TLPT (Threat-Led Penetration Testing)' },
        body: { et: 'Kui [COMPANY] on süsteemselt oluline üksus, viiakse TLPT läbi vähemalt iga 3 aasta järel vastavalt DORA Art. 26-27. TLPT-d teostavad välised sõltumatud testijad TIBER-EU raamistiku alusel. Test hõlmab ohtumodelleerimist, rünnakusimulatsiooni ja punase meeskonna harjutusi kriitiliste funktsioonide vastu. Tulemused raporteeritakse pädevale asutusele.', en: 'If [COMPANY] is a systemically important entity, TLPT is conducted at least every 3 years per DORA Art. 26-27. TLPT is performed by external independent testers under the TIBER-EU framework. Testing includes threat modelling, attack simulation, and red team exercises against critical functions. Results are reported to the competent authority.' }},
      { title: { et: '4. Puuduste haldamine', en: '4. Deficiency Management' },
        body: { et: 'Kõik testimise käigus tuvastatud puudused klassifitseeritakse: Kriitiline (lahendada 7 päeva), Kõrge (30 päeva), Keskmine (90 päeva), Madal (180 päeva). Puuduste kõrvaldamist jälgitakse [CISO] poolt ja staatust raporteeritakse juhatusele kvartaalselt. Lahendamata kriitilised puudused eskaleeritakse kohe juhatusele.', en: 'All deficiencies identified during testing are classified: Critical (resolve in 7 days), High (30 days), Medium (90 days), Low (180 days). Deficiency remediation is tracked by [CISO] and status is reported to the board quarterly. Unresolved critical deficiencies are escalated to the board immediately.' }},
      { title: { et: '5. Dokumenteerimine ja aruandlus', en: '5. Documentation and Reporting' },
        body: { et: 'Iga test dokumenteeritakse: testimise plaan, metoodika, tulemused, tuvastatud puudused, soovitused ja paranduskava. Testiraporteid säilitatakse vähemalt 5 aastat. [CISO] esitab juhatusele iga-aastase koondülevaate testimise programmist, tulemustest ja puuduste kõrvaldamise staatusest. Raportid on kättesaadavad pädevale asutusele nõudmisel.', en: 'Each test is documented: test plan, methodology, results, identified deficiencies, recommendations, and remediation plan. Test reports are retained for at least 5 years. [CISO] presents an annual summary to the board covering the testing programme, results, and deficiency remediation status. Reports are available to the competent authority upon request.' }}
    ]
  },
  {
    id: 'infosec', name: { et: 'Infoturbe poliitika', en: 'Information Security Policy' },
    doraRef: 'Art. 9', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    sections: [
      { title: { et: '1. Eesmärk ja kehtivusala', en: '1. Purpose and Scope' },
        body: { et: 'Käesolev poliitika kehtestab [COMPANY] infoturbe põhimõtted, tagades IKT süsteemide ja andmete konfidentsiaalsuse, tervikluse ja kättesaadavuse vastavalt DORA Art. 9 nõuetele. Poliitika kohaldub kõigile töötajatele, lepingulistele partneritele ja kolmanda osapoole teenusepakkujatele, kellel on juurdepääs [COMPANY] IKT süsteemidele.', en: 'This policy establishes [COMPANY]\'s information security principles, ensuring ICT system and data confidentiality, integrity, and availability per DORA Art. 9 requirements. The policy applies to all employees, contractual partners, and third-party service providers with access to [COMPANY] ICT systems.' }},
      { title: { et: '2. Juurdepääsu haldus', en: '2. Access Management' },
        body: { et: '[COMPANY] rakendab minimaalsete õiguste põhimõtet. Juurdepääsuõigused antakse rollipõhiselt, vaadatakse üle kvartaalselt ja tühistatakse kohe töösuhte lõppemisel. Privileegitud kontodele kohaldatakse täiendavaid turvameetmeid: mitmefaktoriline autentimine (MFA), sessiooni salvestamine ja eraldi auditeerimine. Paroolipoliitika: vähemalt 12 tähemärki, keerukusnõuded, vahetamine 90 päeva tagant.', en: '[COMPANY] applies the principle of least privilege. Access rights are role-based, reviewed quarterly, and revoked immediately upon employment termination. Privileged accounts have additional security: multi-factor authentication (MFA), session recording, and separate auditing. Password policy: minimum 12 characters, complexity requirements, rotation every 90 days.' }},
      { title: { et: '3. Andmekaitse ja krüpteerimine', en: '3. Data Protection and Encryption' },
        body: { et: 'Andmete klassifikatsioon: konfidentsiaalne, sisekasutuseks, avalik. Konfidentsiaalsed andmed krüpteeritakse nii edastamisel (TLS 1.2+) kui salvestamisel (AES-256). Andmekandjate kasutuselt kõrvaldamisel kohaldatakse turvalist kustutamist. Isikuandmete töötlemisel kohaldatakse lisaks GDPR nõudeid. Andmete varundamine toimub [COMPANY-SPECIFIC] sagedusega.', en: 'Data classification: confidential, internal use, public. Confidential data is encrypted in transit (TLS 1.2+) and at rest (AES-256). Secure wiping is applied when decommissioning data carriers. GDPR requirements additionally apply to personal data processing. Data backup frequency: [COMPANY-SPECIFIC].' }},
      { title: { et: '4. Võrguturvalisus', en: '4. Network Security' },
        body: { et: '[COMPANY] rakendab mitmekihilist võrgukaitset: tulemüürid võrgupiiridel, sissetungi tuvastamise ja ennetamise süsteemid (IDS/IPS), võrgu segmenteerimine (kriitilised süsteemid eraldi segmendis), VPN kaugjuurdepääsuks, DMZ avalikele teenustele. Võrguliiklust monitooritakse reaalajas ja anomaaliad eskaleeritakse automaatselt.', en: '[COMPANY] implements defense-in-depth network security: firewalls at network boundaries, intrusion detection and prevention systems (IDS/IPS), network segmentation (critical systems in separate segments), VPN for remote access, DMZ for public-facing services. Network traffic is monitored in real-time with automatic anomaly escalation.' }},
      { title: { et: '5. Turvakoolitused', en: '5. Security Training' },
        body: { et: 'Vastavalt DORA Art. 13(6) läbivad kõik töötajad kohustusliku infoturbe koolituse: sisseastumisel (enne süsteemidele juurdepääsu andmist), kord aastas (teavituskoolitus), lisaks spetsialiseeritud koolitused IT ja turvapersonalile. Juhatus läbib küberturvalisuse koolituse vähemalt kord aastas. Koolituse läbimine dokumenteeritakse ja mittevastamine eskaleeritakse.', en: 'Per DORA Art. 13(6), all staff complete mandatory security training: onboarding (before system access), annually (awareness training), plus specialized training for IT and security personnel. The board completes cybersecurity training at least annually. Training completion is documented and non-compliance is escalated.' }}
    ]
  }
];

@Component({
  selector: 'app-policy-generator',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="text-center mb-8">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-4">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>
        </svg>
        {{ lang.currentLang === 'et' ? 'Tasuta tööriist' : 'Free Tool' }}
      </div>
      <h1 class="text-3xl sm:text-4xl font-bold text-white mb-3">
        {{ lang.currentLang === 'et' ? 'DORA Poliitikadokumentide Generaator' : 'DORA Policy Document Generator' }}
      </h1>
      <p class="text-slate-400 max-w-2xl mx-auto">
        {{ lang.currentLang === 'et'
           ? 'Genereeri valmis DORA-vastavad poliitikadokumendid minutitega. Konsultandid küsivad selle eest tuhandeid eurosid.'
           : 'Generate complete DORA-compliant policy documents in minutes. Consultants charge thousands for these.' }}
      </p>
    </div>

    <!-- Template selector -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
      @for (t of templates; track t.id) {
        <button (click)="selectedTemplate = t"
                class="p-4 rounded-xl border text-left transition-all"
                [ngClass]="selectedTemplate?.id === t.id
                  ? 'bg-violet-500/10 border-violet-500/40 shadow-lg shadow-violet-500/10'
                  : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'">
          <svg class="w-5 h-5 mb-2" [ngClass]="selectedTemplate?.id === t.id ? 'text-violet-400' : 'text-slate-500'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path [attr.d]="t.icon"/>
          </svg>
          <p class="text-sm font-medium" [ngClass]="selectedTemplate?.id === t.id ? 'text-white' : 'text-slate-300'">
            {{ lang.currentLang === 'et' ? t.name.et : t.name.en }}
          </p>
          <p class="text-xs text-slate-500 mt-1">{{ t.doraRef }}</p>
        </button>
      }
    </div>

    @if (selectedTemplate) {
      <!-- Company details -->
      <div class="p-5 rounded-xl bg-slate-800/50 border border-slate-700/50 mb-6">
        <h3 class="text-sm font-semibold text-slate-300 mb-4">{{ lang.currentLang === 'et' ? 'Ettevõtte andmed' : 'Company Details' }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-slate-500 mb-1">{{ lang.currentLang === 'et' ? 'Ettevõtte nimi' : 'Company Name' }}</label>
            <input [(ngModel)]="companyName" class="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none" placeholder="AS Finants">
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">{{ lang.currentLang === 'et' ? 'Registrikood' : 'Registration Number' }}</label>
            <input [(ngModel)]="regNumber" class="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none" placeholder="12345678">
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">{{ lang.currentLang === 'et' ? 'Sektor' : 'Sector' }}</label>
            <select [(ngModel)]="sector" class="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none">
              <option value="banking">{{ lang.currentLang === 'et' ? 'Pangandus' : 'Banking' }}</option>
              <option value="insurance">{{ lang.currentLang === 'et' ? 'Kindlustus' : 'Insurance' }}</option>
              <option value="investment">{{ lang.currentLang === 'et' ? 'Investeerimine' : 'Investment' }}</option>
              <option value="payment">{{ lang.currentLang === 'et' ? 'Makseteenused' : 'Payment Services' }}</option>
              <option value="fund">{{ lang.currentLang === 'et' ? 'Fondivalitsemine' : 'Fund Management' }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">{{ lang.currentLang === 'et' ? 'Riik' : 'Country' }}</label>
            <input [(ngModel)]="country" class="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none" placeholder="Estonia">
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">CISO / IT {{ lang.currentLang === 'et' ? 'juht' : 'Manager' }}</label>
            <input [(ngModel)]="cisoName" class="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none" placeholder="Mari Mets">
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">{{ lang.currentLang === 'et' ? 'Vastutav juhatuse liige' : 'Responsible Board Member' }}</label>
            <input [(ngModel)]="boardMember" class="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none" placeholder="Jaan Tamm">
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3 mb-6">
        <button (click)="copyToClipboard()" class="px-4 py-2 rounded-lg text-sm font-medium bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-all flex items-center gap-2">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
          </svg>
          {{ copied ? (lang.currentLang === 'et' ? 'Kopeeritud!' : 'Copied!') : (lang.currentLang === 'et' ? 'Kopeeri tekst' : 'Copy Text') }}
        </button>
        <button (click)="printDoc()" class="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-all flex items-center gap-2">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>
          </svg>
          {{ lang.currentLang === 'et' ? 'Prindi' : 'Print' }}
        </button>
      </div>

      <!-- Document preview -->
      <div id="policy-document" class="p-6 sm:p-8 rounded-xl bg-slate-800/80 border border-slate-700/50 print:bg-white print:text-black print:border-0">
        <!-- Header -->
        <div class="text-center mb-8 pb-6 border-b border-slate-700/50 print:border-gray-300">
          <p class="text-xs text-red-400 font-bold tracking-widest mb-4 print:text-red-600">{{ lang.currentLang === 'et' ? 'KONFIDENTSIAALNE' : 'CONFIDENTIAL' }}</p>
          <h2 class="text-2xl font-bold text-white mb-2 print:text-black">{{ getCompanyName() }}</h2>
          <h3 class="text-lg font-semibold text-emerald-400 mb-4 print:text-emerald-700">{{ lang.currentLang === 'et' ? selectedTemplate.name.et : selectedTemplate.name.en }}</h3>
          <div class="flex justify-center gap-6 text-xs text-slate-400 print:text-gray-600">
            <span>{{ lang.currentLang === 'et' ? 'Versioon' : 'Version' }}: 1.0</span>
            <span>{{ lang.currentLang === 'et' ? 'Kuupäev' : 'Date' }}: {{ today }}</span>
            <span>{{ selectedTemplate.doraRef }}</span>
          </div>
        </div>

        <!-- Table of contents -->
        <div class="mb-8 p-4 rounded-lg bg-slate-900/30 print:bg-gray-100">
          <p class="text-sm font-bold text-slate-300 mb-3 print:text-black">{{ lang.currentLang === 'et' ? 'Sisukord' : 'Table of Contents' }}</p>
          @for (section of selectedTemplate.sections; track section.title.en) {
            <p class="text-sm text-slate-400 py-0.5 print:text-gray-700">{{ lang.currentLang === 'et' ? section.title.et : section.title.en }}</p>
          }
        </div>

        <!-- Sections -->
        @for (section of selectedTemplate.sections; track section.title.en) {
          <div class="mb-6">
            <h4 class="text-base font-semibold text-white mb-2 print:text-black">{{ lang.currentLang === 'et' ? section.title.et : section.title.en }}</h4>
            <p class="text-sm text-slate-300 leading-relaxed whitespace-pre-line print:text-gray-800">{{ interpolate(lang.currentLang === 'et' ? section.body.et : section.body.en) }}</p>
          </div>
        }

        <!-- Sign-off -->
        <div class="mt-10 pt-6 border-t border-slate-700/50 grid grid-cols-2 gap-8 print:border-gray-300">
          <div>
            <p class="text-xs text-slate-500 mb-1 print:text-gray-500">{{ lang.currentLang === 'et' ? 'Koostanud' : 'Prepared by' }}</p>
            <div class="h-px bg-slate-600 w-48 mt-8 print:bg-gray-400"></div>
            <p class="text-sm text-slate-400 mt-1 print:text-gray-700">{{ cisoName || '[CISO]' }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-500 mb-1 print:text-gray-500">{{ lang.currentLang === 'et' ? 'Kinnitanud' : 'Approved by' }}</p>
            <div class="h-px bg-slate-600 w-48 mt-8 print:bg-gray-400"></div>
            <p class="text-sm text-slate-400 mt-1 print:text-gray-700">{{ boardMember || '[Board Member]' }}</p>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="mt-8 p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20 text-center">
        <h3 class="text-lg font-semibold text-white mb-2">
          {{ lang.currentLang === 'et' ? 'Soovid personaalsemat poliitikat?' : 'Want a more personalized policy?' }}
        </h3>
        <p class="text-sm text-slate-400 mb-4">
          {{ lang.currentLang === 'et'
             ? 'Alusta DORA hindamisega, et tuvastada täpsed puudused ja saada personaalne tegevuskava.'
             : 'Start a DORA assessment to identify specific gaps and get a personalized action plan.' }}
        </p>
        <a routerLink="/assessment" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-400 hover:to-cyan-400 transition-all">
          {{ lang.currentLang === 'et' ? 'Alusta hindamist' : 'Start Assessment' }}
        </a>
      </div>
    }
  `
})
export class PolicyGeneratorComponent {
  templates = TEMPLATES;
  selectedTemplate: PolicyTemplate | null = null;
  companyName = '';
  regNumber = '';
  sector = 'banking';
  country = '';
  cisoName = '';
  boardMember = '';
  copied = false;
  today = new Date().toISOString().split('T')[0];

  constructor(public lang: LangService) {}

  getCompanyName(): string { return this.companyName || '[COMPANY]'; }

  interpolate(text: string): string {
    return text
      .replace(/\[COMPANY\]/g, this.companyName || '[COMPANY]')
      .replace(/\[CISO\]/g, this.cisoName || '[CISO]')
      .replace(/\[BOARD_MEMBER\]/g, this.boardMember || '[Board Member]');
  }

  copyToClipboard() {
    const el = document.getElementById('policy-document');
    if (!el) return;
    const text = el.innerText;
    navigator.clipboard.writeText(text).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    });
  }

  printDoc() { window.print(); }
}
