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
  },
  {
    id: 'change-mgmt', name: { et: 'Muudatuste halduse poliitika', en: 'Change Management Policy' },
    doraRef: 'Art. 8(4), 9(4)(e)', icon: 'M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    sections: [
      { title: { et: '1. Eesmärk ja ulatus', en: '1. Purpose and Scope' },
        body: { et: 'Käesolev poliitika kehtestab [COMPANY] IKT muudatuste halduse protseduurid vastavalt DORA Art. 8(4) ja 9(4)(e) nõuetele. Poliitika kohaldub kõigile muudatustele IKT süsteemides, infrastruktuuris, konfiguratsioonides ja tarkvaras, mis toetavad [COMPANY] äritegevust. Eesmärk on tagada, et kõik muudatused on kontrollitud, dokumenteeritud ja testitakse enne rakendamist.', en: 'This policy establishes [COMPANY]\'s ICT change management procedures per DORA Art. 8(4) and 9(4)(e). The policy applies to all changes in ICT systems, infrastructure, configurations, and software supporting [COMPANY] business operations. The objective is to ensure all changes are controlled, documented, and tested before implementation.' }},
      { title: { et: '2. Muudatuste klassifitseerimine', en: '2. Change Classification' },
        body: { et: 'Muudatused klassifitseeritakse mõju ja kiireloomulisuse alusel: STANDARDNE — madala riskiga, ettemääratud protseduur, ei nõua eraldi kinnitust. NORMAALNE — keskmise riskiga, nõuab muudatuste nõukogu (CAB) heakskiitu. KIIRELOOMULINE — kriitiline parandus, kiirkinnitusprotseduur, tagantjärele dokumenteerimine 48h jooksul. SUURMAHULINE — kõrge riskiga, mitme süsteemi mõjutamine, nõuab juhatuse tasandi kinnitust.', en: 'Changes are classified by impact and urgency: STANDARD — low risk, pre-approved procedure, no separate approval required. NORMAL — medium risk, requires Change Advisory Board (CAB) approval. EMERGENCY — critical fix, fast-track approval, retrospective documentation within 48h. MAJOR — high risk, multi-system impact, requires board-level approval.' }},
      { title: { et: '3. Muudatuste protsess', en: '3. Change Process' },
        body: { et: 'Iga muudatus läbib järgmised etapid: (1) Taotluse esitamine — muudatuse kirjeldus, põhjendus, mõjuanalüüs ja rollback-plaan. (2) Hindamine ja kinnitamine — CAB vaatab läbi, hindab riske ja kinnitab/lükkab tagasi. (3) Arendus ja testimine — muudatuse rakendamine testkeskkonnas, funktsionaalne ja regressioonitestimine. (4) Rakendamine — muudatuse viimine toodangukeskkonda vastavalt kinnitatud plaanile. (5) Järelkontroll — muudatuse mõju monitoorimine, anomaaliate tuvastamine ja dokumenteerimine.', en: 'Each change follows these stages: (1) Request submission — change description, justification, impact analysis, and rollback plan. (2) Assessment and approval — CAB review, risk evaluation, and approval/rejection. (3) Development and testing — implementation in test environment, functional and regression testing. (4) Deployment — production implementation per approved plan. (5) Post-implementation review — monitoring impact, detecting anomalies, and documentation.' }},
      { title: { et: '4. Testimine ja valideerimine', en: '4. Testing and Validation' },
        body: { et: 'Kõik muudatused testitakse enne toodangukeskkonda rakendamist. Testimise nõuded: funktsionaalne testimine (kõik muudatused), regressioonitestimine (normaalsed ja suurmahulised muudatused), jõudlustestimine (kui muudatus mõjutab koormust), turvatestimine (turvaseadete muudatused), kasutaja vastuvõtutestimine UAT (suurmahulised muudatused). Testulemused dokumenteeritakse ja kinnitatakse enne rakendamist.', en: 'All changes are tested before production deployment. Testing requirements: functional testing (all changes), regression testing (normal and major changes), performance testing (if change affects load), security testing (security configuration changes), user acceptance testing UAT (major changes). Test results are documented and approved before deployment.' }},
      { title: { et: '5. Tagasipööramise protseduurid', en: '5. Rollback Procedures' },
        body: { et: 'Iga muudatuse taotlus peab sisaldama tagasipööramise (rollback) plaani. Rollback-plaan sisaldab: eeltingimusi tagasipööramiseks, samm-sammulisi protseduure, ajaraami (maksimaalne lubatav rollback-aeg), vastutavaid isikuid ja kommunikatsiooniplaani. Kui muudatus põhjustab ootamatuid probleeme, algatab operatsioonimeeskond rollback-protseduuri viivitamatult. Rollback-otsus dokumenteeritakse.', en: 'Each change request must include a rollback plan. The rollback plan includes: rollback trigger conditions, step-by-step procedures, time frame (maximum allowable rollback time), responsible persons, and communication plan. If a change causes unexpected issues, the operations team initiates rollback immediately. Rollback decisions are documented.' }},
      { title: { et: '6. Dokumenteerimine ja audit', en: '6. Documentation and Audit' },
        body: { et: 'Kõik muudatused dokumenteeritakse muudatuste haldussüsteemis. Dokumendid sisaldavad: muudatuse taotlust, mõjuanalüüsi, kinnituse otsust, testimise tulemusi, rakendamise logi, järelkontrolli tulemusi. Muudatuste logisid säilitatakse vähemalt 5 aastat. [CISO] esitab juhatusele kvartaalselt muudatuste statistika ja trendide ülevaate. Dokumentatsioon on kättesaadav auditoritele ja regulaatorile nõudmisel.', en: 'All changes are documented in the change management system. Documentation includes: change request, impact analysis, approval decision, test results, deployment log, post-implementation review results. Change logs are retained for at least 5 years. [CISO] presents quarterly change statistics and trend overview to the board. Documentation is available to auditors and regulators upon request.' }}
    ]
  },
  {
    id: 'asset-mgmt', name: { et: 'IKT varade halduse poliitika', en: 'ICT Asset Management Policy' },
    doraRef: 'Art. 8(1), 8(4)', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4',
    sections: [
      { title: { et: '1. Eesmärk ja ulatus', en: '1. Purpose and Scope' },
        body: { et: 'Käesolev poliitika kehtestab [COMPANY] IKT varade tuvastamise, registreerimise, klassifitseerimise ja halduse nõuded vastavalt DORA Art. 8(1) ja 8(4). Poliitika kohaldub kõigile riist- ja tarkvaralistele varadele, andmebaasidele, võrguseadmetele ja pilveteenustele, mida [COMPANY] kasutab oma äritegevuses.', en: 'This policy establishes [COMPANY]\'s requirements for ICT asset identification, registration, classification, and management per DORA Art. 8(1) and 8(4). The policy applies to all hardware and software assets, databases, network devices, and cloud services used by [COMPANY] in its business operations.' }},
      { title: { et: '2. Varade register', en: '2. Asset Register' },
        body: { et: '[COMPANY] peab ajakohast IKT varade registrit, mis sisaldab iga vara kohta: unikaalset identifikaatorit, vara tüüpi ja kategooriat, asukohta (füüsiline/pilvepõhine), omanikku ja vastutavat isikut, kriitilisuse klassi, seost äriprotsessidega, versiooni/konfiguratsiooni infot, elutsükli staatust. Register ajakohastatakse iga muudatuse korral ja vaadatakse tervikuna üle kvartaalselt.', en: '[COMPANY] maintains an up-to-date ICT asset register containing for each asset: unique identifier, asset type and category, location (physical/cloud), owner and responsible person, criticality class, business process dependencies, version/configuration info, lifecycle status. The register is updated upon every change and reviewed comprehensively quarterly.' }},
      { title: { et: '3. Varade klassifitseerimine', en: '3. Asset Classification' },
        body: { et: 'IKT varad klassifitseeritakse kolme kriitilisuse klassi: KRIITILINE — vara, mille tõrge mõjutab kriitilisi ärifunktsioone, klientide teenindamist või regulatiivset vastavust. Nõuab redundantsust ja 24/7 seiret. OLULINE — vara, mis toetab olulisi äriprotsesse, kuid mille lühiajaline katkestus on talutav. Nõuab regulaarset varundamist ja tööajal seiret. TAVALINE — tugivara, mille katkestus ei mõjuta otseselt äritegevust. Standardne hooldusrežiim.', en: 'ICT assets are classified into three criticality classes: CRITICAL — asset whose failure impacts critical business functions, client services, or regulatory compliance. Requires redundancy and 24/7 monitoring. IMPORTANT — asset supporting significant business processes, but short-term interruption is tolerable. Requires regular backup and business-hours monitoring. STANDARD — support asset whose interruption does not directly impact business. Standard maintenance regime.' }},
      { title: { et: '4. Elutsükli haldamine', en: '4. Lifecycle Management' },
        body: { et: 'IKT varade elutsükli etapid: HANKIMINE — turvanõuete hindamine, ühilduvuse kontroll, kinnitusprotseduur. KASUTUSELEVÕTT — turvaline konfigureerimine, registreerimine, juurdepääsuõiguste seadistamine. HALDUS — turvauuendused, jõudluse monitooring, regulaarne ülevaatus. KASUTUSELT KÕRVALDAMINE — andmete turvaline kustutamine (NIST SP 800-88), registrist eemaldamine, sertifitseeritud hävitamine vajadusel. Kriitiliste varade asendamiseks peab olema plaan.', en: 'ICT asset lifecycle stages: ACQUISITION — security requirements assessment, compatibility check, approval procedure. DEPLOYMENT — secure configuration, registration, access rights setup. MANAGEMENT — security patches, performance monitoring, regular review. DECOMMISSIONING — secure data wiping (NIST SP 800-88), register removal, certified destruction if required. Replacement plans must exist for critical assets.' }},
      { title: { et: '5. Sõltuvuste kaardistamine', en: '5. Dependency Mapping' },
        body: { et: '[COMPANY] kaardistab IKT varade omavahelised sõltuvused ning seosed äriprotsesside ja kolmandate osapooltega. Sõltuvuste kaart uuendatakse iga muudatuse korral ja vaadatakse läbi kvartaalselt. Kaardistamine hõlmab: teenuste vahelisi sõltuvusi, andmevoogude kaardistamist, kolmanda osapoole teenuste seoseid, ühe tõrkepunkti (SPOF) tuvastamist. Sõltuvuste kaart on sisendiks ärimõju analüüsile (BIA) ja jätkuvuse planeerimisele.', en: '[COMPANY] maps ICT asset interdependencies and connections to business processes and third parties. The dependency map is updated upon every change and reviewed quarterly. Mapping covers: inter-service dependencies, data flow mapping, third-party service relationships, single point of failure (SPOF) identification. The dependency map feeds into business impact analysis (BIA) and continuity planning.' }},
      { title: { et: '6. Aruandlus ja vastavus', en: '6. Reporting and Compliance' },
        body: { et: '[CISO] esitab juhatusele kvartaalselt IKT varade ülevaate, mis sisaldab: varade koguarvu ja jaotust kriitilisuse järgi, elutsükli staatuse kokkuvõtet, tuvastatud riske ja puudusi, kasutuselt kõrvaldatud varade statistikat. Varade register on sisendiks DORA Art. 28(3) teaberegistrile (Register of Information). Dokumentatsioon on kättesaadav auditoritele ja regulaatorile nõudmisel.', en: '[CISO] presents a quarterly ICT asset overview to the board including: total asset count and distribution by criticality, lifecycle status summary, identified risks and deficiencies, decommissioned asset statistics. The asset register feeds into the DORA Art. 28(3) Register of Information. Documentation is available to auditors and regulators upon request.' }}
    ]
  },
  {
    id: 'crypto', name: { et: 'Krüptograafia ja andmekaitse poliitika', en: 'Cryptography and Data Protection Policy' },
    doraRef: 'Art. 9(2), 9(4)(d)', icon: 'M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z',
    sections: [
      { title: { et: '1. Eesmärk ja ulatus', en: '1. Purpose and Scope' },
        body: { et: 'Käesolev poliitika kehtestab [COMPANY] krüptograafiliste meetmete ja andmekaitse nõuded vastavalt DORA Art. 9(2) ja 9(4)(d). Poliitika tagab andmete konfidentsiaalsuse, tervikluse ja autentsuse nii edastamisel kui salvestamisel. Kohaldub kõigile IKT süsteemidele, mis töötlevad konfidentsiaalseid, isiku- või regulatiivselt kaitstavaid andmeid.', en: 'This policy establishes [COMPANY]\'s cryptographic measures and data protection requirements per DORA Art. 9(2) and 9(4)(d). The policy ensures data confidentiality, integrity, and authenticity both in transit and at rest. Applies to all ICT systems processing confidential, personal, or regulatory-protected data.' }},
      { title: { et: '2. Andmete klassifitseerimine', en: '2. Data Classification' },
        body: { et: 'Andmed klassifitseeritakse nelja kategooriasse: RANGELT KONFIDENTSIAALNE — ärisaladused, krüptovõtmed, paroolid, regulatiivselt piiratud andmed. Krüpteeritakse alati. KONFIDENTSIAALNE — klientide isikuandmed, finantsandmed, siseauditi tulemused. Krüpteeritakse edastamisel ja salvestamisel. SISEKASUTUSEKS — sisepoliitikad, protseduurid, tööjuhendid. Kaitstud juurdepääsupiirangutega. AVALIK — pressiteated, turundusmaterjal, avalik veebisisu. Ei nõua krüpteerimist.', en: 'Data is classified into four categories: STRICTLY CONFIDENTIAL — trade secrets, cryptographic keys, passwords, regulatory-restricted data. Always encrypted. CONFIDENTIAL — client personal data, financial data, internal audit results. Encrypted in transit and at rest. INTERNAL USE — internal policies, procedures, work instructions. Protected by access controls. PUBLIC — press releases, marketing material, public web content. No encryption required.' }},
      { title: { et: '3. Krüpteerimisstandardid', en: '3. Encryption Standards' },
        body: { et: '[COMPANY] kohaldab järgmisi krüpteerimisstandardeid: Edastamisel (in transit): TLS 1.2 või uuem (TLS 1.3 eelistatud), nõrku šifreid ei kasutata. Salvestamisel (at rest): AES-256 sümmeetriline krüpteerimine kriitiliste andmete jaoks. Andmebaasid: läbipaistev krüpteerimine (TDE) või rakenduse-taseme krüpteerimine. Varukoopiad: krüpteeritud AES-256-ga, võtmed säilitatakse eraldi asukohast. Räsifunktsioonid: SHA-256 või tugevam.', en: '[COMPANY] applies the following encryption standards: In transit: TLS 1.2 or newer (TLS 1.3 preferred), weak ciphers prohibited. At rest: AES-256 symmetric encryption for critical data. Databases: transparent data encryption (TDE) or application-level encryption. Backups: encrypted with AES-256, keys stored separately. Hash functions: SHA-256 or stronger.' }},
      { title: { et: '4. Võtmehaldus', en: '4. Key Management' },
        body: { et: 'Krüptovõtmete haldus: genereerimine — riistvaralised juhuslike arvude generaatorid (HRNG) või sertifitseeritud tarkvaralised generaatorid. Salvestamine — riistvaralised turvamuudulid (HSM) kriitiliste võtmete jaoks, võtmehoidlad (vault) muude võtmete jaoks. Rotatsioon — sümmeetrilised võtmed iga 12 kuu tagant, TLS sertifikaadid iga 12 kuu tagant, privilegeeritud kontode paroolid iga 90 päeva tagant. Tühistamine — kompromiteeritud võtmed tühistatakse viivitamatult. Kõik võtmeoperatsioonid logitakse.', en: 'Cryptographic key management: generation — hardware random number generators (HRNG) or certified software generators. Storage — hardware security modules (HSM) for critical keys, key vaults for other keys. Rotation — symmetric keys every 12 months, TLS certificates every 12 months, privileged account passwords every 90 days. Revocation — compromised keys are revoked immediately. All key operations are logged.' }},
      { title: { et: '5. Andmete transport ja edastamine', en: '5. Data Transport and Transfer' },
        body: { et: 'Andmete edastamise nõuded: sisemine võrk — TLS 1.2+ kõigi siseteenuste vahel, mTLS kriitiliste teenuste vahel. Internet — kohustuslik TLS 1.2+, HSTS päised, sertifikaadi kinnitamine. E-post — konfidentsiaalsete andmete puhul S/MIME või PGP krüpteerimine, TLS e-posti serverite vahel. Failiedastus — SFTP või SCP (FTP keelatud), krüpteeritud ZIP suurte failide puhul. API-d — OAuth 2.0 + TLS, API võtmed ei edastata URL-is. Piiriülesed edastamised vastavad GDPR artiklile 46.', en: 'Data transfer requirements: internal network — TLS 1.2+ between all internal services, mTLS between critical services. Internet — mandatory TLS 1.2+, HSTS headers, certificate pinning. Email — S/MIME or PGP encryption for confidential data, TLS between mail servers. File transfer — SFTP or SCP (FTP prohibited), encrypted ZIP for large files. APIs — OAuth 2.0 + TLS, API keys not transmitted in URLs. Cross-border transfers comply with GDPR Article 46.' }},
      { title: { et: '6. Läbivaatamine ja vastavus', en: '6. Review and Compliance' },
        body: { et: 'Krüptograafia poliitika vaadatakse läbi vähemalt kord aastas ning uute ohtude või haavatavuste ilmnemisel. [CISO] jälgib krüptograafiliste standardite arengut ja teeb ettepanekuid uuendusteks. Vastavust kontrollitakse: kvartaalsete TLS konfiguratsiooni skaneeringutega, aastaste krüptograafiliste meetmete audititega, pideva sertifikaatide kehtivuse seirega. Tulemused raporteeritakse juhatusele ja dokumenteeritakse auditijälje jaoks.', en: 'The cryptography policy is reviewed at least annually and upon emergence of new threats or vulnerabilities. [CISO] monitors cryptographic standards development and proposes updates. Compliance is verified through: quarterly TLS configuration scans, annual cryptographic measures audits, continuous certificate validity monitoring. Results are reported to the board and documented for audit trail.' }}
    ]
  },
  {
    id: 'access-control', name: { et: 'Juurdepääsu kontrolli poliitika', en: 'Access Control Policy' },
    doraRef: 'Art. 9(4)(c)', icon: 'M15 7a2 2 0 0 1 2 2m4 0a6 6 0 0 1-7.743 5.743L11 17H9v2H7v2H4a1 1 0 0 1-1-1v-2.586a1 1 0 0 1 .293-.707l5.964-5.964A6 6 0 1 1 21 9z',
    sections: [
      { title: { et: '1. Eesmärk ja ulatus', en: '1. Purpose and Scope' },
        body: { et: 'Käesolev poliitika kehtestab [COMPANY] juurdepääsu kontrolli põhimõtted ja protseduurid vastavalt DORA Art. 9(4)(c). Poliitika kohaldub kõigile kasutajatele, süsteemidele ja andmetele, tagades, et juurdepääs IKT süsteemidele on piiratud vaid volitatud isikutele ning põhineb ärivajaduse ja minimaalsete õiguste põhimõttel.', en: 'This policy establishes [COMPANY]\'s access control principles and procedures per DORA Art. 9(4)(c). The policy applies to all users, systems, and data, ensuring that access to ICT systems is restricted to authorized persons only and based on business need and least privilege principles.' }},
      { title: { et: '2. Rollipõhine juurdepääsu kontroll (RBAC)', en: '2. Role-Based Access Control (RBAC)' },
        body: { et: '[COMPANY] rakendab rollipõhist juurdepääsu kontrolli. Põhimõtted: iga kasutaja saab juurdepääsuõigused vastavalt oma rollile, rollid on defineeritud äriprotsesside põhiselt, üks kasutaja võib omada mitut rolli, kuid kohustuste lahususe (SoD) nõudeid tuleb järgida. Rollide loetelu ja neile vastavad õigused dokumenteeritakse ja kinnitatakse varade omanike poolt. Rollide muudatused nõuavad [CISO] kinnitust.', en: '[COMPANY] implements role-based access control. Principles: each user receives access rights based on their role, roles are defined by business process, one user may hold multiple roles while observing separation of duties (SoD) requirements. Role inventory and corresponding rights are documented and approved by asset owners. Role changes require [CISO] approval.' }},
      { title: { et: '3. Autentimine', en: '3. Authentication' },
        body: { et: 'Autentimisnõuded: paroolid — minimaalselt 12 tähemärki, keerukusnõuded, vahetamine 90 päeva tagant, ajaloo kontroll (viimased 12 parooli). Mitmefaktoriline autentimine (MFA) — kohustuslik kõigile kasutajatele, kes pääsevad ligi kriitilistele süsteemidele, kaugjuurdepääsu korral ja kõigile privilegeeritud kontodele. Sessioonide haldus — automaatne lukustamine pärast 15 min tegevusetust, samaaegse sessioonide piirang. Teenusekontod — sertifikaadipõhine autentimine, regulaarne rotatsioon.', en: 'Authentication requirements: passwords — minimum 12 characters, complexity requirements, rotation every 90 days, history check (last 12 passwords). Multi-factor authentication (MFA) — mandatory for all users accessing critical systems, remote access, and all privileged accounts. Session management — automatic lockout after 15 min inactivity, concurrent session limits. Service accounts — certificate-based authentication, regular rotation.' }},
      { title: { et: '4. Privilegeeritud juurdepääsu haldus (PAM)', en: '4. Privileged Access Management (PAM)' },
        body: { et: 'Privilegeeritud kontode haldus: kõik administraatorikontod registreeritakse ja neid hallatakse tsentraalselt. Just-in-time (JIT) juurdepääs — privilegeeritud õigused antakse ainult vajadusel ja piiratud ajaks. Sessiooni salvestamine — kõik privilegeeritud sessioonid salvestatakse ja on auditeeritavad. Eraldi kontod — administraatorid kasutavad igapäevaseks tööks tavakontot ja privilegeeritud kontot ainult haldusülesannete jaoks. Juurdepääsu ülevaatus toimub kvartaalselt.', en: 'Privileged account management: all admin accounts are registered and centrally managed. Just-in-time (JIT) access — privileged rights granted only when needed for limited duration. Session recording — all privileged sessions are recorded and auditable. Separate accounts — admins use regular accounts for daily work and privileged accounts only for admin tasks. Access review conducted quarterly.' }},
      { title: { et: '5. Juurdepääsu elutsükli haldamine', en: '5. Access Lifecycle Management' },
        body: { et: 'Juurdepääsu elutsükkel: LOOMINE — uue töötaja juurdepääs seadistatakse tööle asumisel vastavalt rollile, kinnitab otsene juht. MUUTMINE — rollivahetuse korral vanad õigused eemaldatakse ja uued lisatakse 48h jooksul. PEATAMINE — pikaajalise puudumise korral konto deaktiveeritakse. LÕPETAMINE — töösuhte lõppemisel juurdepääs tühistatakse kohe, hiljemalt 4h jooksul. Automaatsed teavitused personaliosakonnast IT-le. Juurdepääsulogisid säilitatakse vähemalt 12 kuud.', en: 'Access lifecycle: CREATION — new employee access set up on start date per role, approved by direct manager. MODIFICATION — on role change, old rights removed and new ones added within 48h. SUSPENSION — account deactivated during extended leave. TERMINATION — access revoked immediately upon employment end, within 4h max. Automatic notifications from HR to IT. Access logs retained for at least 12 months.' }},
      { title: { et: '6. Audit ja aruandlus', en: '6. Audit and Reporting' },
        body: { et: 'Juurdepääsu kontrolli audit: kvartaalne juurdepääsuõiguste ülevaatus — varade omanikud kinnitavad oma varade kasutajate õiguste asjakohasuse. Poolaastane privilegeeritud kontode audit — [CISO] kontrollib kõigi administraatorikontode õigustatust. Aastane penetratsioonitest — juurdepääsu kontrolli meetmete tõhususe testimine. Pidev seire — ebaõnnestunud autentimiskatsete ja anomaalsete juurdepääsumustrite tuvastamine reaalajas. [CISO] raporteerib tulemused juhatusele kvartaalselt.', en: 'Access control audit: quarterly access rights review — asset owners confirm appropriateness of user rights for their assets. Semi-annual privileged account audit — [CISO] verifies all admin account justification. Annual penetration test — testing access control measure effectiveness. Continuous monitoring — real-time detection of failed authentication attempts and anomalous access patterns. [CISO] reports results to the board quarterly.' }}
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
        {{ lang.t('policy.free_tool') }}
      </div>
      <h1 class="text-3xl sm:text-4xl font-bold text-white mb-3">
        {{ lang.t('policy.dora_policy_document_generator') }}
      </h1>
      <p class="text-slate-400 max-w-2xl mx-auto">
        {{ lang.t('policy.generate_complete_doracompliant_policy_d') }}
      </p>
    </div>

    <!-- Template selector -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
      @for (t of templates; track t.id) {
        <button (click)="selectedTemplate = t"
                class="p-4 rounded-xl border text-left transition-all"
                [ngClass]="selectedTemplate?.id === t.id
                  ? 'bg-violet-500/10 border-violet-500/40 shadow-lg shadow-violet-500/10'
                  : 'bg-white border-slate-200 hover:border-slate-300'">
          <svg class="w-5 h-5 mb-2" [ngClass]="selectedTemplate?.id === t.id ? 'text-violet-400' : 'text-slate-500'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path [attr.d]="t.icon"/>
          </svg>
          <p class="text-sm font-medium" [ngClass]="selectedTemplate?.id === t.id ? 'text-white' : 'text-slate-600'">
            {{ lang.l(t.name.et, t.name.en) }}
          </p>
          <p class="text-xs text-slate-500 mt-1">{{ t.doraRef }}</p>
        </button>
      }
    </div>

    @if (selectedTemplate) {
      <!-- Company details -->
      <div class="p-5 rounded-xl bg-white border border-slate-200 mb-6">
        <h3 class="text-sm font-semibold text-slate-600 mb-4">{{ lang.t('policy.company_details') }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-slate-500 mb-1">{{ lang.t('policy.company_name') }}</label>
            <input [(ngModel)]="companyName" class="w-full px-3 py-2 rounded-lg bg-white border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none" placeholder="AS Finants">
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">{{ lang.t('policy.registration_number') }}</label>
            <input [(ngModel)]="regNumber" class="w-full px-3 py-2 rounded-lg bg-white border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none" placeholder="12345678">
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">{{ lang.t('policy.sector') }}</label>
            <select [(ngModel)]="sector" class="w-full px-3 py-2 rounded-lg bg-white border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none">
              <option value="banking">{{ lang.t('policy.banking') }}</option>
              <option value="insurance">{{ lang.t('policy.insurance') }}</option>
              <option value="investment">{{ lang.t('policy.investment') }}</option>
              <option value="payment">{{ lang.t('policy.payment_services') }}</option>
              <option value="fund">{{ lang.t('policy.fund_management') }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">{{ lang.t('policy.country') }}</label>
            <input [(ngModel)]="country" class="w-full px-3 py-2 rounded-lg bg-white border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none" placeholder="Estonia">
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">CISO / IT {{ lang.t('policy.manager') }}</label>
            <input [(ngModel)]="cisoName" class="w-full px-3 py-2 rounded-lg bg-white border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none" placeholder="Mari Mets">
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">{{ lang.t('policy.responsible_board_member') }}</label>
            <input [(ngModel)]="boardMember" class="w-full px-3 py-2 rounded-lg bg-white border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none" placeholder="Jaan Tamm">
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3 mb-6">
        <button (click)="copyToClipboard()" class="px-4 py-2 rounded-lg text-sm font-medium bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-all flex items-center gap-2">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
          </svg>
          {{ copied ? lang.t('policy.copied') : lang.t('policy.copy_text') }}
        </button>
        <button (click)="printDoc()" class="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-600 hover:bg-slate-700 transition-all flex items-center gap-2">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>
          </svg>
          {{ lang.t('policy.print') }}
        </button>
      </div>

      <!-- Document preview -->
      <div id="policy-document" class="p-6 sm:p-8 rounded-xl bg-white border border-slate-200 print:bg-white print:text-black print:border-0">
        <!-- Header -->
        <div class="text-center mb-8 pb-6 border-b border-slate-200 print:border-gray-300">
          <p class="text-xs text-red-400 font-bold tracking-widest mb-4 print:text-red-600">{{ lang.t('policy.confidential') }}</p>
          <h2 class="text-2xl font-bold text-white mb-2 print:text-black">{{ getCompanyName() }}</h2>
          <h3 class="text-lg font-semibold text-blue-600 mb-4 print:text-blue-800">{{ lang.l(selectedTemplate.name.et, selectedTemplate.name.en) }}</h3>
          <div class="flex justify-center gap-6 text-xs text-slate-400 print:text-gray-600">
            <span>{{ lang.t('policy.version') }}: 1.0</span>
            <span>{{ lang.t('policy.date') }}: {{ today }}</span>
            <span>{{ selectedTemplate.doraRef }}</span>
          </div>
        </div>

        <!-- Table of contents -->
        <div class="mb-8 p-4 rounded-lg bg-slate-900/30 print:bg-gray-100">
          <p class="text-sm font-bold text-slate-600 mb-3 print:text-black">{{ lang.t('policy.table_of_contents') }}</p>
          @for (section of selectedTemplate.sections; track section.title.en) {
            <p class="text-sm text-slate-400 py-0.5 print:text-gray-700">{{ lang.l(section.title.et, section.title.en) }}</p>
          }
        </div>

        <!-- Sections -->
        @for (section of selectedTemplate.sections; track section.title.en) {
          <div class="mb-6">
            <h4 class="text-base font-semibold text-white mb-2 print:text-black">{{ lang.l(section.title.et, section.title.en) }}</h4>
            <p class="text-sm text-slate-600 leading-relaxed whitespace-pre-line print:text-gray-800">{{ interpolate(lang.l(section.body.et, section.body.en)) }}</p>
          </div>
        }

        <!-- Sign-off -->
        <div class="mt-10 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 print:border-gray-300">
          <div>
            <p class="text-xs text-slate-500 mb-1 print:text-gray-500">{{ lang.t('policy.prepared_by') }}</p>
            <div class="h-px bg-slate-600 w-48 mt-8 print:bg-gray-400"></div>
            <p class="text-sm text-slate-400 mt-1 print:text-gray-700">{{ cisoName || '[CISO]' }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-500 mb-1 print:text-gray-500">{{ lang.t('policy.approved_by') }}</p>
            <div class="h-px bg-slate-600 w-48 mt-8 print:bg-gray-400"></div>
            <p class="text-sm text-slate-400 mt-1 print:text-gray-700">{{ boardMember || '[Board Member]' }}</p>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="mt-8 p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 text-violet-400 text-xs font-medium mb-3">
          <div class="w-4 h-4 rounded bg-gradient-to-br from-violet-400 to-purple-400 flex items-center justify-center text-[7px] text-white font-bold">AI</div>
          Enterprise
        </div>
        <h3 class="text-lg font-semibold text-white mb-2">
          {{ lang.l('Vaja professionaalsemat, ettevõttespetsiifilist poliitikat?', 'Need a more professional, company-specific policy?') }}
        </h3>
        <p class="text-sm text-slate-400 mb-4">
          {{ lang.l(
            'Kasuta AI poliitikakirjutajat, et genereerida täielik, sinu ettevõtte andmetele ja hindamise lünkadele kohandatud poliitikaadokument.',
            'Use the AI Policy Writer to generate a complete policy document tailored to your company details and assessment gaps.'
          ) }}
        </p>
        <a routerLink="/ai-policy-writer" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-400 hover:to-purple-400 hover:shadow-lg hover:shadow-violet-500/25 transition-all">
          <div class="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-[8px] font-bold">AI</div>
          {{ lang.l('Proovi AI poliitikakirjutajat', 'Try AI Policy Writer') }}
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
