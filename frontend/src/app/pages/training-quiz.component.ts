import { Component, signal, computed, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LangService } from '../lang.service';

interface QuizQuestion {
  id: number;
  category: string;
  roles: string[];
  question: { et: string; en: string };
  options: { et: string[]; en: string[] };
  correctIndex: number;
  explanation: { et: string; en: string };
  doraReference: string;
}

interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  grade: string;
  categoryBreakdown: { category: string; correct: number; total: number; percentage: number }[];
  completedAt: string;
  role: string;
  elapsedSeconds: number;
}

type QuizPhase = 'role-select' | 'quiz' | 'results';
type Role = 'board' | 'ciso' | 'compliance' | 'it-staff' | 'general';

const QUESTIONS: QuizQuestion[] = [
  // ─── DORA General Knowledge (9 questions) ───
  {
    id: 1,
    category: 'DORA General Knowledge',
    roles: ['board', 'ciso', 'compliance', 'it-staff', 'general'],
    question: {
      et: 'Millal jõustus DORA (Digital Operational Resilience Act) täielikult?',
      en: 'When did the Digital Operational Resilience Act (DORA) become fully applicable?'
    },
    options: {
      et: ['1. jaanuar 2024', '17. jaanuar 2025', '1. juuli 2025', '1. jaanuar 2026'],
      en: ['1 January 2024', '17 January 2025', '1 July 2025', '1 January 2026']
    },
    correctIndex: 1,
    explanation: {
      et: 'DORA jõustus 16. jaanuaril 2023, kuid hakkas täielikult kehtima 17. jaanuaril 2025 pärast 2-aastast üleminekuperioodi.',
      en: 'DORA entered into force on 16 January 2023 but became fully applicable on 17 January 2025 after a 2-year transition period.'
    },
    doraReference: 'DORA Art. 64'
  },
  {
    id: 2,
    category: 'DORA General Knowledge',
    roles: ['board', 'ciso', 'compliance', 'general'],
    question: {
      et: 'Millised organisatsioonid peavad DORA nõudeid täitma?',
      en: 'Which types of organizations must comply with DORA?'
    },
    options: {
      et: ['Ainult pangad', 'Ainult pangad ja kindlustusseltsid', 'Kõik EL-i finantsüksused ja kriitilised IKT kolmanda osapoole teenusepakkujad', 'Kõik EL-i ettevõtted'],
      en: ['Only banks', 'Only banks and insurance companies', 'All EU financial entities and critical ICT third-party service providers', 'All EU companies']
    },
    correctIndex: 2,
    explanation: {
      et: 'DORA kehtib kõigile EL-i finantsüksustele (pangad, kindlustusandjad, investeerimisühingud, makseasutused jne) ja kriitilise tähtsusega IKT teenusepakkujatele.',
      en: 'DORA applies to all EU financial entities (banks, insurers, investment firms, payment institutions, etc.) and critical ICT third-party service providers.'
    },
    doraReference: 'DORA Art. 2'
  },
  {
    id: 3,
    category: 'DORA General Knowledge',
    roles: ['board', 'ciso', 'compliance', 'it-staff', 'general'],
    question: {
      et: 'Mitu peamist sammast on DORA raamistikus?',
      en: 'How many key pillars does the DORA framework have?'
    },
    options: {
      et: ['3 sammast', '5 sammast', '7 sammast', '10 sammast'],
      en: ['3 pillars', '5 pillars', '7 pillars', '10 pillars']
    },
    correctIndex: 1,
    explanation: {
      et: 'DORA raamistikul on 5 sammast: IKT riskijuhtimine, intsidentide raporteerimine, digitaalse vastupidavuse testimine, IKT kolmandate osapoolte riski juhtimine ja teabe jagamine.',
      en: 'DORA has 5 pillars: ICT Risk Management, Incident Reporting, Digital Resilience Testing, ICT Third-Party Risk Management, and Information Sharing.'
    },
    doraReference: 'DORA Chapters II-VI'
  },
  {
    id: 4,
    category: 'DORA General Knowledge',
    roles: ['board', 'compliance', 'general'],
    question: {
      et: 'Milline DORA artikkel nõuab juhtkonna lõplikku vastutust IKT riskijuhtimise eest?',
      en: 'Which DORA article requires the management body to bear ultimate responsibility for ICT risk management?'
    },
    options: {
      et: ['Artikkel 3', 'Artikkel 5', 'Artikkel 13', 'Artikkel 28'],
      en: ['Article 3', 'Article 5', 'Article 13', 'Article 28']
    },
    correctIndex: 1,
    explanation: {
      et: 'DORA artikkel 5 sätestab, et juhtorgan määratleb, kiidab heaks ja kontrollib IKT riskijuhtimise raamistiku rakendamist ning kannab lõplikku vastutust.',
      en: 'DORA Article 5 establishes that the management body defines, approves, oversees and bears ultimate responsibility for the implementation of the ICT risk management framework.'
    },
    doraReference: 'DORA Art. 5(1)-(2)'
  },
  {
    id: 5,
    category: 'DORA General Knowledge',
    roles: ['board', 'ciso', 'compliance', 'it-staff'],
    question: {
      et: 'Milline DORA artikkel käsitleb IKT turvalisuse koolituse nõudeid?',
      en: 'Which DORA article establishes requirements for ICT security training?'
    },
    options: {
      et: ['Artikkel 5', 'Artikkel 10', 'Artikkel 13(6)', 'Artikkel 19'],
      en: ['Article 5', 'Article 10', 'Article 13(6)', 'Article 19']
    },
    correctIndex: 2,
    explanation: {
      et: 'DORA artikkel 13(6) nõuab, et finantsüksused peavad rakendama kohustuslikud IKT turvalisuse teadlikkuse programmid ja digitaalse vastupidavuse koolitused kõigile töötajatele ja juhtkonnale.',
      en: 'DORA Article 13(6) requires financial entities to develop mandatory ICT security awareness programs and digital operational resilience training for all staff and management.'
    },
    doraReference: 'DORA Art. 13(6)'
  },
  {
    id: 6,
    category: 'DORA General Knowledge',
    roles: ['board', 'ciso', 'compliance'],
    question: {
      et: 'Millised on DORA rikkumise võimalikud karistused?',
      en: 'What are the possible penalties for DORA non-compliance?'
    },
    options: {
      et: ['Ainult hoiatused', 'Kuni 1% aasta käibest', 'Kuni 2% aasta käibest või 1% päevakäibest iga päev mitte-vastavuse eest', 'Ainult litsentsitühistamine'],
      en: ['Warnings only', 'Up to 1% of annual turnover', 'Up to 2% of annual turnover or 1% of daily turnover for each day of non-compliance', 'License revocation only']
    },
    correctIndex: 2,
    explanation: {
      et: 'DORA võimaldab riiklikel pädevatel asutustel määrata trahve kuni 2% aasta kogukäibest või 1% keskmisest päevakäibest iga päev mitte-vastavuse eest, kuni 6 kuud.',
      en: 'DORA allows national competent authorities to impose fines of up to 2% of total annual turnover or 1% of average daily turnover for each day of non-compliance, for up to 6 months.'
    },
    doraReference: 'DORA Art. 50-52'
  },
  {
    id: 7,
    category: 'DORA General Knowledge',
    roles: ['compliance', 'general'],
    question: {
      et: 'Mis on proportsionaalsuse põhimõte DORA kontekstis?',
      en: 'What is the proportionality principle in the context of DORA?'
    },
    options: {
      et: ['Kõik ettevõtted peavad täitma samu nõudeid', 'Nõuded sõltuvad ettevõtte suurusest, riskiprofiilist ja IKT teenuste keerukusest', 'Ainult suured ettevõtted peavad DORA-t täitma', 'Väikesed ettevõtted on DORA-st vabastatud'],
      en: ['All companies must meet the same requirements', 'Requirements depend on the entity size, risk profile, and complexity of ICT services', 'Only large companies must comply with DORA', 'Small companies are exempt from DORA']
    },
    correctIndex: 1,
    explanation: {
      et: 'DORA proportsionaalsuse põhimõte tähendab, et nõuded on kohandatud ettevõtte suuruse, riskiprofiili, tegevuse laadi ja IKT-teenuste keerukuse järgi.',
      en: 'DORA proportionality principle means requirements are scaled according to entity size, risk profile, nature of activities, and complexity of ICT services.'
    },
    doraReference: 'DORA Art. 4'
  },
  {
    id: 8,
    category: 'DORA General Knowledge',
    roles: ['board', 'compliance'],
    question: {
      et: 'Kui tihti peab juhtkond DORA kohaselt IKT riskijuhtimise poliitikat üle vaatama?',
      en: 'How often must the management body review the ICT risk management policy under DORA?'
    },
    options: {
      et: ['Iga kuu', 'Iga kvartal', 'Vähemalt kord aastas', 'Iga 3 aasta tagant'],
      en: ['Every month', 'Every quarter', 'At least once a year', 'Every 3 years']
    },
    correctIndex: 2,
    explanation: {
      et: 'DORA nõuab, et juhtkond vaatab IKT riskijuhtimise raamistiku üle vähemalt kord aastas ning pärast olulisi IKT intsidente.',
      en: 'DORA requires the management body to review the ICT risk management framework at least once a year and after major ICT incidents.'
    },
    doraReference: 'DORA Art. 6(5)'
  },
  {
    id: 9,
    category: 'DORA General Knowledge',
    roles: ['board', 'ciso', 'compliance', 'it-staff', 'general'],
    question: {
      et: 'Milline Euroopa järelevalveasutus koordineerib DORA rakendamist?',
      en: 'Which European supervisory authority coordinates DORA implementation?'
    },
    options: {
      et: ['Ainult Euroopa Keskpank (ECB)', 'Ainult ENISA', 'Euroopa järelevalveasutused (EBA, ESMA, EIOPA) ühiselt', 'Euroopa Komisjon otse'],
      en: ['European Central Bank (ECB) only', 'ENISA only', 'European Supervisory Authorities (EBA, ESMA, EIOPA) jointly', 'European Commission directly']
    },
    correctIndex: 2,
    explanation: {
      et: 'DORA rakendamist koordineerivad EBA, ESMA ja EIOPA ühiselt läbi ühiskomitee. Nad töötavad välja regulatiivseid tehnilisi standardeid (RTS) ja rakenduslikke tehnilisi standardeid (ITS).',
      en: 'DORA implementation is coordinated jointly by EBA, ESMA, and EIOPA through a Joint Committee. They develop Regulatory Technical Standards (RTS) and Implementing Technical Standards (ITS).'
    },
    doraReference: 'DORA Art. 56-58'
  },

  // ─── ICT Risk Management (7 questions) ───
  {
    id: 10,
    category: 'ICT Risk Management',
    roles: ['ciso', 'it-staff', 'compliance'],
    question: {
      et: 'Milline on DORA artikkel 6 kohane IKT riskijuhtimise raamistiku põhielement?',
      en: 'What is a key element of the ICT risk management framework under DORA Article 6?'
    },
    options: {
      et: ['Ainult tulemüüri paigaldamine', 'Terviklik IKT riskide tuvastamise, kaitse, avastamise, reageerimise ja taastamise raamistik', 'Ainult viirusetõrje tarkvara kasutamine', 'Ainult andmete varundamine'],
      en: ['Only installing a firewall', 'Comprehensive ICT risk identification, protection, detection, response and recovery framework', 'Only using antivirus software', 'Only backing up data']
    },
    correctIndex: 1,
    explanation: {
      et: 'DORA artikkel 6 nõuab terviklikku IKT riskijuhtimise raamistikku, mis hõlmab riskide tuvastamist, kaitset, avastamist, reageerimist ja taastamist — sarnaselt NIST raamistikule.',
      en: 'DORA Article 6 requires a comprehensive ICT risk management framework covering identification, protection, detection, response and recovery — similar to the NIST framework approach.'
    },
    doraReference: 'DORA Art. 6-14'
  },
  {
    id: 11,
    category: 'ICT Risk Management',
    roles: ['ciso', 'it-staff'],
    question: {
      et: 'Millist DORA nõuet peab järgima IKT süsteemide muudatuste haldamisel?',
      en: 'What DORA requirement must be followed when managing changes to ICT systems?'
    },
    options: {
      et: ['Muudatusi võib teha igal ajal ilma dokumenteerimata', 'Kõik muudatused peavad olema dokumenteeritud, testitud ja kinnitatud enne rakendamist', 'Ainult suured muudatused vajavad dokumenteerimist', 'Muudatuste haldamine on vabatahtlik'],
      en: ['Changes can be made at any time without documentation', 'All changes must be documented, tested and approved before deployment', 'Only major changes need documentation', 'Change management is voluntary']
    },
    correctIndex: 1,
    explanation: {
      et: 'DORA artikkel 9(4)(e) nõuab, et finantsüksused rakendavad IKT muudatuste haldamise poliitikaid, mis tagavad kõigi muudatuste dokumenteerimise, testimise ja kinnitamise.',
      en: 'DORA Article 9(4)(e) requires financial entities to implement ICT change management policies ensuring all changes are documented, tested, and approved.'
    },
    doraReference: 'DORA Art. 9(4)(e)'
  },
  {
    id: 12,
    category: 'ICT Risk Management',
    roles: ['ciso', 'it-staff', 'board'],
    question: {
      et: 'Mis on DORA nõue seoses IKT talitluspidevuse plaanidega?',
      en: 'What is the DORA requirement regarding ICT business continuity plans?'
    },
    options: {
      et: ['Talitluspidevuse plaanid on soovituslikud', 'Plaane tuleb testida iga 5 aasta tagant', 'Plaanid peavad olema kehtestatud, dokumenteeritud ja regulaarselt testitud', 'Ainult pangad vajavad talitluspidevuse plaane'],
      en: ['Business continuity plans are recommended', 'Plans must be tested every 5 years', 'Plans must be established, documented and regularly tested', 'Only banks need business continuity plans']
    },
    correctIndex: 2,
    explanation: {
      et: 'DORA artikkel 11 nõuab terviklikke IKT talitluspidevuse poliitikaid ja plaane, mis peavad olema dokumenteeritud, regulaarselt testitud ja ajakohastatud.',
      en: 'DORA Article 11 requires comprehensive ICT business continuity policies and plans that must be documented, regularly tested and kept up to date.'
    },
    doraReference: 'DORA Art. 11'
  },
  {
    id: 13,
    category: 'ICT Risk Management',
    roles: ['ciso', 'it-staff'],
    question: {
      et: 'Milline on DORA nõue andmete krüpteerimisele?',
      en: 'What does DORA require regarding data encryption?'
    },
    options: {
      et: ['Krüpteerimine pole nõutud', 'Ainult rahalised andmed peavad olema krüpteeritud', 'Andmed peavad olema kaitstud nii puhkeolekus kui ka edastamisel, kasutades kaasaegseid krüpteerimismeetodeid', 'Ainult e-kirjad peavad olema krüpteeritud'],
      en: ['Encryption is not required', 'Only financial data must be encrypted', 'Data must be protected at rest and in transit using up-to-date cryptographic methods', 'Only emails must be encrypted']
    },
    correctIndex: 2,
    explanation: {
      et: 'DORA artikkel 9(4)(d) nõuab kaasaegsete krüpteerimislahenduste kasutamist andmete kaitseks nii puhkeolekus kui edastamisel, vastavalt andmete klassifikatsioonile.',
      en: 'DORA Article 9(4)(d) requires up-to-date cryptographic solutions to protect data at rest and in transit, based on data classification.'
    },
    doraReference: 'DORA Art. 9(4)(d)'
  },
  {
    id: 14,
    category: 'ICT Risk Management',
    roles: ['it-staff', 'ciso'],
    question: {
      et: 'Stsenaarium: Teie organisatsioon kasutab pilvepõhist andmebaasi. DORA kohaselt, millist riskijuhtimise meedet peate rakendama?',
      en: 'Scenario: Your organization uses a cloud-based database. Under DORA, which risk management measure must you implement?'
    },
    options: {
      et: ['Piisab pilve teenusepakkuja turvalisuse usaldamisest', 'Peate teostama oma sõltumatu riskihindamise ja kehtestama väljumisstrateegiad', 'Pilveteenuseid DORA ei reguleeri', 'Peate ainult lepingut sõlmima'],
      en: ['It is sufficient to trust the cloud provider security', 'You must conduct your own independent risk assessment and establish exit strategies', 'Cloud services are not regulated by DORA', 'You only need to sign a contract']
    },
    correctIndex: 1,
    explanation: {
      et: 'DORA nõuab, et finantsüksused teostavad sõltumatu riskihindamise kõigi IKT teenusepakkujate kohta, sealhulgas pilveteenused, ja kehtestavad väljumisstrateegiad.',
      en: 'DORA requires financial entities to conduct independent risk assessments for all ICT service providers including cloud services, and establish exit strategies.'
    },
    doraReference: 'DORA Art. 28, Art. 29'
  },
  {
    id: 15,
    category: 'ICT Risk Management',
    roles: ['ciso', 'it-staff', 'compliance'],
    question: {
      et: 'Milline on DORA nõue seoses IKT varade inventuuriga?',
      en: 'What is the DORA requirement regarding ICT asset inventory?'
    },
    options: {
      et: ['Varade inventuur pole nõutud', 'Ainult riistvaraline inventuur on vajalik', 'Peab pidama ajakohast registrit kõigist IKT varadest, sealhulgas süsteemid, andmed ja konfiguratsioonid', 'Inventuur on vajalik ainult auditite ajal'],
      en: ['Asset inventory is not required', 'Only hardware inventory is needed', 'Must maintain an up-to-date register of all ICT assets including systems, data and configurations', 'Inventory is only needed during audits']
    },
    correctIndex: 2,
    explanation: {
      et: 'DORA artikkel 8 nõuab, et finantsüksused tuvastavad, klassifitseerivad ja dokumenteerivad kõik IKT varad, funktsioonid ja nende omavahelised sõltuvused.',
      en: 'DORA Article 8 requires financial entities to identify, classify and document all ICT assets, functions and their interdependencies.'
    },
    doraReference: 'DORA Art. 8'
  },
  {
    id: 16,
    category: 'ICT Risk Management',
    roles: ['ciso', 'board', 'compliance'],
    question: {
      et: 'Kes peab DORA kohaselt finantsüksuses vastutama IKT riskijuhtimise funktsiooni eest?',
      en: 'Who must be responsible for the ICT risk management function within a financial entity under DORA?'
    },
    options: {
      et: ['Iga IT-töötaja individuaalselt', 'Sõltumatu kontrollifunktsioon piisava volituse, sõltumatuse ja ressurssidega', 'Välised konsultandid', 'Ainult IT-osakonna juht'],
      en: ['Each IT employee individually', 'An independent control function with sufficient authority, independence and resources', 'External consultants', 'Only the IT department head']
    },
    correctIndex: 1,
    explanation: {
      et: 'DORA artikkel 6(4) nõuab sõltumatut IKT riskijuhtimise kontrollifunktsiooni, millel on piisav volitus, sõltumatus ja ressursid tõhusaks riskijuhtimiseks.',
      en: 'DORA Article 6(4) requires an independent ICT risk management control function with sufficient authority, independence and resources for effective risk management.'
    },
    doraReference: 'DORA Art. 6(4)'
  },

  // ─── Incident Reporting (6 questions) ───
  {
    id: 17,
    category: 'Incident Reporting',
    roles: ['ciso', 'it-staff', 'compliance', 'board'],
    question: {
      et: 'Mitme tunni jooksul tuleb oluline IKT intsident esialgselt raporteerida?',
      en: 'Within how many hours must a major ICT incident be initially reported?'
    },
    options: {
      et: ['1 tunni jooksul', '4 tunni jooksul', '24 tunni jooksul', '72 tunni jooksul'],
      en: ['Within 1 hour', 'Within 4 hours', 'Within 24 hours', 'Within 72 hours']
    },
    correctIndex: 1,
    explanation: {
      et: 'DORA nõuab, et oluline IKT intsident raporteeritakse esialgselt 4 tunni jooksul pärast intsidendi klassifitseerimist oluliseks, kuid mitte hiljem kui 24 tundi pärast intsidendi avastamist.',
      en: 'DORA requires a major ICT incident to be initially reported within 4 hours of classifying the incident as major, but no later than 24 hours after detection.'
    },
    doraReference: 'DORA Art. 19(4)(a)'
  },
  {
    id: 18,
    category: 'Incident Reporting',
    roles: ['ciso', 'it-staff', 'compliance'],
    question: {
      et: 'Mitu etappi on DORA intsidentide raporteerimise protsessis?',
      en: 'How many stages are in the DORA incident reporting process?'
    },
    options: {
      et: ['1 — ainult lõpparuanne', '2 — esialgne ja lõpparuanne', '3 — esialgne teade, vahearuanne ja lõpparuanne', '4 — esialgne teade, 2 vahearuannet ja lõpparuanne'],
      en: ['1 — only a final report', '2 — initial and final report', '3 — initial notification, intermediate report and final report', '4 — initial notification, 2 intermediate reports and final report']
    },
    correctIndex: 2,
    explanation: {
      et: 'DORA intsidentide raporteerimine koosneb 3 etapist: esialgne teade (4h), vahearuanne (72h) ja lõpparuanne (1 kuu) pärast olulise intsidendi klassifitseerimist.',
      en: 'DORA incident reporting consists of 3 stages: initial notification (4h), intermediate report (72h), and final report (1 month) after classifying a major incident.'
    },
    doraReference: 'DORA Art. 19(4)'
  },
  {
    id: 19,
    category: 'Incident Reporting',
    roles: ['ciso', 'it-staff', 'compliance', 'general'],
    question: {
      et: 'Stsenaarium: Teie ettevõtte peamine veebipank on olnud maas 3 tundi ja mõjutab 50 000 klienti. Kas see on DORA kohaselt oluline intsident?',
      en: 'Scenario: Your company main online banking platform has been down for 3 hours affecting 50,000 customers. Is this a major incident under DORA?'
    },
    options: {
      et: ['Ei, see on tavaline hooldus', 'Jah, see on oluline intsident, kuna mõjutab kriitilisi teenuseid ja suurt klientide arvu', 'Ainult siis, kui on andmeleke', 'Ei, alla 24 tunni ei ole oluline'],
      en: ['No, this is routine maintenance', 'Yes, this is a major incident as it affects critical services and a large number of clients', 'Only if there is a data breach', 'No, under 24 hours is not major']
    },
    correctIndex: 1,
    explanation: {
      et: 'See on oluline intsident DORA kohaselt, kuna see mõjutab kriitilisi teenuseid ja suurt klientide arvu. Olulised intsidendid klassifitseeritakse mõju ulatuse, kestuse, mõjutatud kasutajate arvu ja andmekao põhjal.',
      en: 'This qualifies as a major incident under DORA because it affects critical services and a large number of clients. Major incidents are classified based on impact scope, duration, affected users and data loss.'
    },
    doraReference: 'DORA Art. 18'
  },
  {
    id: 20,
    category: 'Incident Reporting',
    roles: ['ciso', 'compliance'],
    question: {
      et: 'Kellele tuleb DORA kohaselt olulisest IKT intsidendist teatada?',
      en: 'To whom must a major ICT incident be reported under DORA?'
    },
    options: {
      et: ['Ainult ettevõtte juhtkonnale', 'Ainult politseile', 'Pädevale järelevalveasutusele ja vajaduse korral ka klientidele', 'Ainult meediasse'],
      en: ['Only to the company management', 'Only to the police', 'To the competent supervisory authority and, where relevant, to clients', 'Only to the media']
    },
    correctIndex: 2,
    explanation: {
      et: 'DORA nõuab intsidentidest teatamist pädevale järelevalveasutusele. Kui intsident mõjutab klientide finantshuve, tuleb teavitada ka kliente ning meetmetest, mida nad saavad enda kaitsmiseks võtta.',
      en: 'DORA requires reporting to the competent supervisory authority. If the incident impacts clients financial interests, clients must also be notified about the incident and the measures they can take to protect themselves.'
    },
    doraReference: 'DORA Art. 19(1), Art. 19(3)'
  },
  {
    id: 21,
    category: 'Incident Reporting',
    roles: ['it-staff', 'ciso'],
    question: {
      et: 'Mis on DORA nõue seoses küberohustimulatsioonidega (cyber threat notifications)?',
      en: 'What does DORA require regarding significant cyber threat notifications?'
    },
    options: {
      et: ['Küberohududest ei pea teavitama', 'Ainult realiseerunud ohtudest tuleb teavitada', 'Finantsüksused võivad vabatahtlikult teavitada olulistest küberohtudest', 'Kõigist ohtudest peab teavitama 1 tunni jooksul'],
      en: ['Cyber threats do not need to be reported', 'Only realized threats need to be reported', 'Financial entities may voluntarily report significant cyber threats', 'All threats must be reported within 1 hour']
    },
    correctIndex: 2,
    explanation: {
      et: 'DORA artikkel 19(2) lubab finantsüksustel vabatahtlikult teavitada olulistest küberohtudest, mida nad peavad oluliseks. See on vabatahtlik, kuid soovitatav.',
      en: 'DORA Article 19(2) allows financial entities to voluntarily notify significant cyber threats they deem relevant. This is voluntary but encouraged.'
    },
    doraReference: 'DORA Art. 19(2)'
  },
  {
    id: 22,
    category: 'Incident Reporting',
    roles: ['ciso', 'compliance', 'general'],
    question: {
      et: 'Kui kaua on aega DORA lõpparuande esitamiseks pärast olulist IKT intsidenti?',
      en: 'How long do you have to submit the final DORA report after a major ICT incident?'
    },
    options: {
      et: ['1 nädal', '2 nädalat', '1 kuu', '3 kuud'],
      en: ['1 week', '2 weeks', '1 month', '3 months']
    },
    correctIndex: 2,
    explanation: {
      et: 'DORA lõpparuanne tuleb esitada 1 kuu jooksul pärast intsidendi klassifitseerimist oluliseks. See peab sisaldama põhjuste analüüsi, mõju hinnangut ja võetud meetmeid.',
      en: 'The DORA final report must be submitted within 1 month after classifying the incident as major. It must include root cause analysis, impact assessment and remediation measures taken.'
    },
    doraReference: 'DORA Art. 19(4)(c)'
  },

  // ─── Third-Party Risk (6 questions) ───
  {
    id: 23,
    category: 'Third-Party Risk',
    roles: ['compliance', 'ciso', 'board'],
    question: {
      et: 'Milline DORA artikkel kehtestab nõuded IKT kolmandate osapoolte lepingutele?',
      en: 'Which DORA article establishes requirements for ICT third-party contracts?'
    },
    options: {
      et: ['Artikkel 15', 'Artikkel 25', 'Artikkel 30', 'Artikkel 40'],
      en: ['Article 15', 'Article 25', 'Article 30', 'Article 40']
    },
    correctIndex: 2,
    explanation: {
      et: 'DORA artikkel 30 sätestab üksikasjalikud nõuded IKT kolmandate osapoolte lepingutele, sealhulgas kohustuslikud lepingutingimused, auditi õigused ja väljumisklauslid.',
      en: 'DORA Article 30 establishes detailed requirements for ICT third-party contracts, including mandatory contractual provisions, audit rights and exit clauses.'
    },
    doraReference: 'DORA Art. 30'
  },
  {
    id: 24,
    category: 'Third-Party Risk',
    roles: ['compliance', 'ciso', 'board'],
    question: {
      et: 'Mis on Teaberegister (Register of Information) DORA kontekstis?',
      en: 'What is the Register of Information in the context of DORA?'
    },
    options: {
      et: ['Töötajate register', 'Kõigi IKT kolmandate osapoolte teenuste kokkulepete register', 'Intsidentide register', 'IT varade nimekiri'],
      en: ['An employee register', 'A register of all ICT third-party service arrangements', 'An incident register', 'An IT asset list']
    },
    correctIndex: 1,
    explanation: {
      et: 'DORA artikkel 28(3) nõuab, et finantsüksused peavad ja ajakohastavad teaberegistrit kõigi IKT kolmandate osapoolte teenuste kokkulepete kohta, eristades neid, mis toetavad kriitilisi funktsioone.',
      en: 'DORA Article 28(3) requires financial entities to maintain and update a register of information for all ICT third-party service arrangements, distinguishing those supporting critical or important functions.'
    },
    doraReference: 'DORA Art. 28(3)'
  },
  {
    id: 25,
    category: 'Third-Party Risk',
    roles: ['compliance', 'ciso'],
    question: {
      et: 'Mis on DORA nõue seoses IKT teenusepakkuja väljumisstrateegiatega?',
      en: 'What does DORA require regarding ICT service provider exit strategies?'
    },
    options: {
      et: ['Väljumisstrateegiad pole nõutud', 'Ainult suurte teenusepakkujate puhul on need nõutud', 'Finantsüksused peavad kehtestama väljumisstrateegiad kõigi kriitiliste IKT teenusepakkujate jaoks', 'Väljumisstrateegiad on vajalikud ainult pilve puhul'],
      en: ['Exit strategies are not required', 'Only for large service providers', 'Financial entities must establish exit strategies for all critical ICT service providers', 'Exit strategies are only needed for cloud']
    },
    correctIndex: 2,
    explanation: {
      et: 'DORA artikkel 28(8) nõuab väljumisstrateegiate kehtestamist kriitiliste või oluliste funktsioonide IKT teenusepakkujate jaoks, et tagada teenuste jätkuvus teenuseosutaja vahetumisel.',
      en: 'DORA Article 28(8) requires exit strategies for ICT service providers supporting critical or important functions, ensuring service continuity when switching providers.'
    },
    doraReference: 'DORA Art. 28(8)'
  },
  {
    id: 26,
    category: 'Third-Party Risk',
    roles: ['compliance', 'board'],
    question: {
      et: 'Mis on kontsentratsioonirisik DORA kontekstis?',
      en: 'What is concentration risk in the context of DORA?'
    },
    options: {
      et: ['Risk, et kõik töötajad on samas hoones', 'Risk, et ühe IKT teenusepakkuja häire mõjutab suurt osa finantssektorist', 'Risk, et andmed on ühes riigis', 'Risk, et liiga palju kliente kasutab sama toodet'],
      en: ['The risk of all employees being in the same building', 'The risk that a disruption at one ICT provider could impact a significant part of the financial sector', 'The risk of data being in one country', 'The risk of too many clients using the same product']
    },
    correctIndex: 1,
    explanation: {
      et: 'DORA artikkel 29 käsitleb kontsentratsiooniriski — riski, et ühe kriitilise IKT teenusepakkuja häire võib mõjutada suurt osa finantssektorist, luues süsteemse riski.',
      en: 'DORA Article 29 addresses concentration risk — the risk that disruption at one critical ICT provider could impact a significant part of the financial sector, creating systemic risk.'
    },
    doraReference: 'DORA Art. 29'
  },
  {
    id: 27,
    category: 'Third-Party Risk',
    roles: ['board', 'compliance', 'ciso'],
    question: {
      et: 'Stsenaarium: Teie ettevõte plaanib pilveteenuse lepingut uuendada. DORA nõuab, et lepingus oleksid...',
      en: 'Scenario: Your company plans to renew a cloud service contract. DORA requires the contract to include...'
    },
    options: {
      et: ['Ainult hind ja teenustase', 'Auditõigused, andmete asukoha nõuded, allhanketingimused, intsidentide teavitamine ja väljumisklauslid', 'Ainult SLA ja hind', 'Ainult GDPR klauslid'],
      en: ['Only price and service levels', 'Audit rights, data location requirements, subcontracting conditions, incident notification and exit clauses', 'Only SLA and price', 'Only GDPR clauses']
    },
    correctIndex: 1,
    explanation: {
      et: 'DORA artikkel 30 nõuab ulatuslikke lepingutingimusi, sealhulgas auditõigused, andmete asukoha nõuded, allhanketingimused, intsidentide teavitamine, teenustaseme kokkulepped ja väljumisklauslid.',
      en: 'DORA Article 30 requires extensive contractual provisions including audit rights, data location requirements, subcontracting conditions, incident notification, service level agreements and exit clauses.'
    },
    doraReference: 'DORA Art. 30(2)-(3)'
  },
  {
    id: 28,
    category: 'Third-Party Risk',
    roles: ['compliance', 'ciso', 'it-staff'],
    question: {
      et: 'Mis on kriitilise tähtsusega IKT kolmanda osapoole teenusepakkuja (CTPP) DORA kohaselt?',
      en: 'What is a Critical ICT Third-Party Provider (CTPP) under DORA?'
    },
    options: {
      et: ['Iga IKT teenusepakkuja', 'Ainult pilveteenuse pakkujad', 'IKT teenusepakkuja, kelle häire kujutab süsteemset riski finantssüsteemi stabiilsusele', 'Ainult EL-is asuvad teenusepakkujad'],
      en: ['Any ICT service provider', 'Only cloud service providers', 'An ICT provider whose disruption poses systemic risk to financial system stability', 'Only EU-based providers']
    },
    correctIndex: 2,
    explanation: {
      et: 'CTPP on IKT teenusepakkuja, mille EJ-d (ESA-d) on määranud kriitilise tähtsusega, kuna selle häire kujutaks süsteemset riski finantssüsteemi stabiilsusele. Nende üle teostatakse otsest järelevalvet.',
      en: 'A CTPP is an ICT provider designated as critical by the ESAs because its disruption would pose systemic risk to financial system stability. They are subject to direct oversight.'
    },
    doraReference: 'DORA Art. 31'
  },

  // ─── Resilience Testing (7 questions) ───
  {
    id: 29,
    category: 'Resilience Testing',
    roles: ['ciso', 'it-staff', 'compliance'],
    question: {
      et: 'Mis on TLPT (Threat-Led Penetration Testing)?',
      en: 'What is TLPT (Threat-Led Penetration Testing)?'
    },
    options: {
      et: ['Tavaline haavatavuse skannimine', 'Ohuteabel põhinev läbistustestimine, mis simuleerib reaalset küberrünnakut kriitiliste süsteemide vastu', 'Tulemüüri konfiguratsioon testimine', 'Töötajate phishing test'],
      en: ['Regular vulnerability scanning', 'Threat intelligence-led penetration testing that simulates real cyberattacks against critical systems', 'Firewall configuration testing', 'Employee phishing test']
    },
    correctIndex: 1,
    explanation: {
      et: 'TLPT on kõrgetasemeline läbistustestimine, mis kasutab reaalseid ohuteabeid kriitiliste IKT süsteemide vastu suunatud simuleeritud rünnakute läbiviimiseks. See põhineb TIBER-EU raamistikul.',
      en: 'TLPT is advanced penetration testing that uses real threat intelligence to conduct simulated attacks against critical ICT systems. It is based on the TIBER-EU framework.'
    },
    doraReference: 'DORA Art. 26'
  },
  {
    id: 30,
    category: 'Resilience Testing',
    roles: ['ciso', 'it-staff', 'board'],
    question: {
      et: 'Kui tihti tuleb DORA kohaselt TLPT läbi viia?',
      en: 'How often must TLPT be conducted under DORA?'
    },
    options: {
      et: ['Igal aastal', 'Iga 2 aasta tagant', 'Vähemalt iga 3 aasta tagant', 'Iga 5 aasta tagant'],
      en: ['Every year', 'Every 2 years', 'At least every 3 years', 'Every 5 years']
    },
    correctIndex: 2,
    explanation: {
      et: 'DORA artikkel 26(1) nõuab, et TLPT viiakse läbi vähemalt iga 3 aasta tagant. Seda peavad tegema ainult suuremad ja süsteemselt olulised finantsüksused.',
      en: 'DORA Article 26(1) requires TLPT to be conducted at least every 3 years. This applies only to larger and systemically important financial entities.'
    },
    doraReference: 'DORA Art. 26(1)'
  },
  {
    id: 31,
    category: 'Resilience Testing',
    roles: ['ciso', 'it-staff'],
    question: {
      et: 'Millist tüüpi digitaalse vastupidavuse testimist peavad DORA kohaselt kõik finantsüksused läbi viima?',
      en: 'What type of digital operational resilience testing must all financial entities perform under DORA?'
    },
    options: {
      et: ['Ainult TLPT', 'Ainult haavatavuse skannimine', 'Sobiv valik testidest: haavatavuse skannimised, avatud lähtekoodiga tarkvaraanalüüs, võrgu turvalisuse kontroll, läbistustestimine jne', 'Testimine pole kohustuslik'],
      en: ['Only TLPT', 'Only vulnerability scanning', 'An appropriate range of tests: vulnerability scans, open-source software analysis, network security assessment, penetration testing, etc.', 'Testing is not mandatory']
    },
    correctIndex: 2,
    explanation: {
      et: 'DORA artikkel 25 nõuab, et kõik finantsüksused viivad läbi sobiva valiku digitaalse vastupidavuse teste, mis hõlmavad haavatavuse skannimisi, läbistustestimist, avatud lähtekoodiga analüüsi ja muud.',
      en: 'DORA Article 25 requires all financial entities to perform an appropriate range of digital resilience tests including vulnerability scans, penetration testing, open-source analysis and more.'
    },
    doraReference: 'DORA Art. 25'
  },
  {
    id: 32,
    category: 'Resilience Testing',
    roles: ['it-staff', 'ciso'],
    question: {
      et: 'Kes peab DORA kohaselt TLPT testimist läbi viima?',
      en: 'Who must conduct TLPT testing under DORA?'
    },
    options: {
      et: ['Ettevõtte enda IT-meeskond', 'Iga küberturvalisuse ettevõte', 'Sõltumatud kvalifitseeritud testijad, kes täidavad TIBER-EU nõudeid', 'Automatiseeritud testimistarkvara'],
      en: ['The entity own IT team', 'Any cybersecurity company', 'Independent qualified testers meeting TIBER-EU requirements', 'Automated testing software']
    },
    correctIndex: 2,
    explanation: {
      et: 'DORA artikkel 27 nõuab, et TLPT viivad läbi sõltumatud kvalifitseeritud testijad, kes täidavad TIBER-EU raamistiku nõudeid. Sisemised testijad võivad osaleda, kuid välise testija kaasamine on kohustuslik.',
      en: 'DORA Article 27 requires TLPT to be conducted by independent qualified testers meeting TIBER-EU framework requirements. Internal testers may participate but an external tester must be involved.'
    },
    doraReference: 'DORA Art. 27'
  },
  {
    id: 33,
    category: 'Resilience Testing',
    roles: ['ciso', 'it-staff', 'compliance', 'board'],
    question: {
      et: 'Stsenaarium: Teie ettevõte avastas läbistustestimise käigus kriitilise haavatavuse. DORA kohaselt peate...',
      en: 'Scenario: Your company discovered a critical vulnerability during penetration testing. Under DORA, you must...'
    },
    options: {
      et: ['Lihtsalt dokumenteerima leiu', 'Viivitamatult teavitama järelevalveasutust', 'Prioriteetselt kõrvaldama haavatavuse, dokumenteerima leiu ja rakendama parandusmeetmeid', 'Ootama järgmist plaanipärast testi'],
      en: ['Simply document the finding', 'Immediately notify the supervisory authority', 'Prioritize remediation, document the finding and implement corrective measures', 'Wait for the next scheduled test']
    },
    correctIndex: 2,
    explanation: {
      et: 'DORA nõuab, et kõik testimise käigus avastatud haavatavused kõrvaldataks prioriteetselt. Leiud tuleb dokumenteerida ja parandusmeetmed rakendada. Kui haavatavust ära kasutati, võib see ka intsidendiraporteerimise alla kuuluda.',
      en: 'DORA requires all vulnerabilities discovered during testing to be prioritized for remediation. Findings must be documented and corrective measures implemented. If exploited, it may also trigger incident reporting.'
    },
    doraReference: 'DORA Art. 24(5)-(6)'
  },
  {
    id: 34,
    category: 'Resilience Testing',
    roles: ['it-staff', 'ciso'],
    question: {
      et: 'Kui tihti tuleb DORA kohaselt läbi viia haavatavuse skannimisi?',
      en: 'How often must vulnerability scans be performed under DORA?'
    },
    options: {
      et: ['Kord kuus', 'Kord aastas', 'Regulaarselt vastavalt riskipõhisele lähenemisele, vähemalt kord aastas', 'Ainult intsidentide järel'],
      en: ['Once a month', 'Once a year', 'Regularly based on a risk-based approach, at least annually', 'Only after incidents']
    },
    correctIndex: 2,
    explanation: {
      et: 'DORA nõuab regulaarseid haavatavuse skannimisi riskipõhise lähenemise alusel. Minimaalselt tuleb neid teha kord aastas, kuid kõrgema riskiga süsteemide puhul sagedamini.',
      en: 'DORA requires regular vulnerability scans based on a risk-based approach. Minimum annually, but more frequently for higher-risk systems.'
    },
    doraReference: 'DORA Art. 25(1)-(2)'
  },
  {
    id: 35,
    category: 'Resilience Testing',
    roles: ['ciso', 'it-staff', 'compliance'],
    question: {
      et: 'Mis on "pooling" TLPT kontekstis DORA kohaselt?',
      en: 'What is "pooling" in the context of TLPT under DORA?'
    },
    options: {
      et: ['Mitme testija kasutamine samal ajal', 'Mitu finantsüksust viivad ühiselt läbi TLPT testimise ühiste IKT teenusepakkujate jaoks', 'Testitulemuste kogumine andmebaasi', 'Küberrünnaku simulatsioon'],
      en: ['Using multiple testers at the same time', 'Multiple financial entities jointly conducting TLPT for shared ICT service providers', 'Collecting test results in a database', 'A cyberattack simulation']
    },
    correctIndex: 1,
    explanation: {
      et: 'DORA artikkel 26(4) lubab "pooling" ehk ühendatud TLPT testimist, kus mitu finantsüksust teevad koostööd ühiste IKT kolmandate osapoolte teenusepakkujate TLPT testimisel.',
      en: 'DORA Article 26(4) allows "pooling" — joint TLPT testing where multiple financial entities collaborate to conduct TLPT on shared ICT third-party service providers.'
    },
    doraReference: 'DORA Art. 26(4)'
  }
];

const ROLES: { key: Role; label: { et: string; en: string }; icon: string; description: { et: string; en: string } }[] = [
  {
    key: 'board',
    label: { et: 'Juhatuse liige / Juht', en: 'Board Member / Executive' },
    icon: '\uD83C\uDFDB\uFE0F',
    description: { et: 'Strateegiline vastutus ja IKT riskijuhtimise järelevalve', en: 'Strategic oversight and ICT risk governance responsibility' }
  },
  {
    key: 'ciso',
    label: { et: 'CISO / IT turvajuht', en: 'CISO / IT Security Manager' },
    icon: '\uD83D\uDEE1\uFE0F',
    description: { et: 'IKT turvalisuse ja vastupidavuse juhtimine', en: 'Leading ICT security and resilience operations' }
  },
  {
    key: 'compliance',
    label: { et: 'Vastavusjuht', en: 'Compliance Officer' },
    icon: '\u2696\uFE0F',
    description: { et: 'Regulatiivsete nõuete täitmise tagamine', en: 'Ensuring regulatory requirements are met' }
  },
  {
    key: 'it-staff',
    label: { et: 'IT-spetsialist / Arendaja', en: 'IT Staff / Developer' },
    icon: '\uD83D\uDCBB',
    description: { et: 'IKT süsteemide arendus, haldus ja kaitse', en: 'ICT system development, administration and protection' }
  },
  {
    key: 'general',
    label: { et: '\u00DCldine personal', en: 'General Staff' },
    icon: '\uD83D\uDC65',
    description: { et: 'Kõik töötajad, kes kasutavad IKT süsteeme', en: 'All employees who use ICT systems' }
  }
];

const CATEGORY_ORDER = [
  'DORA General Knowledge',
  'ICT Risk Management',
  'Incident Reporting',
  'Third-Party Risk',
  'Resilience Testing'
];

const CATEGORY_TARGETS: { [cat: string]: number } = {
  'DORA General Knowledge': 5,
  'ICT Risk Management': 3,
  'Incident Reporting': 3,
  'Third-Party Risk': 2,
  'Resilience Testing': 2
};

@Component({
  selector: 'app-training-quiz',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="space-y-8 max-w-4xl mx-auto">

      <!-- ─── Header ─── -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-blue-500/10 border border-emerald-500/20 p-8">
        <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div class="relative">
          <div class="flex items-center gap-2 mb-3">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              DORA Art. 13(6)
            </span>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              {{ lang.currentLang === 'et' ? 'Interaktiivne' : 'Interactive' }}
            </span>
          </div>
          <h1 class="text-3xl font-bold text-white mb-2">
            {{ lang.currentLang === 'et' ? 'DORA personali koolituse viktoriin' : 'DORA Staff Training Quiz' }}
          </h1>
          <p class="text-slate-400 max-w-2xl">
            {{ lang.currentLang === 'et'
              ? 'DORA artikkel 13(6) nõuab kohustuslikke IKT turbekoolitusi. Testi oma teadmisi ja saa koolitustunnistus.'
              : 'DORA Article 13(6) mandates ICT security training. Test your knowledge and earn a training certificate.' }}
          </p>
        </div>
      </div>

      <!-- ═══════════ PHASE: ROLE SELECT ═══════════ -->
      @if (phase() === 'role-select') {
        <div class="space-y-6">
          <div class="text-center">
            <h2 class="text-xl font-bold text-white mb-2">
              {{ lang.currentLang === 'et' ? 'Vali oma roll' : 'Select Your Role' }}
            </h2>
            <p class="text-sm text-slate-400">
              {{ lang.currentLang === 'et'
                ? 'Küsimused kohandatakse vastavalt sinu rollile organisatsioonis.'
                : 'Questions will be tailored to your role within the organization.' }}
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (role of roles; track role.key) {
              <button (click)="selectRole(role.key)" type="button"
                      class="group text-left p-5 rounded-2xl border border-slate-700/50 bg-slate-800/50 hover:border-emerald-500/40 hover:bg-slate-800/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/10">
                <div class="text-3xl mb-3">{{ role.icon }}</div>
                <h3 class="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {{ lang.currentLang === 'et' ? role.label.et : role.label.en }}
                </h3>
                <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                  {{ lang.currentLang === 'et' ? role.description.et : role.description.en }}
                </p>
              </button>
            }
          </div>

          <!-- Info card -->
          <div class="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
            <div class="flex gap-3">
              <div class="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div>
                <h4 class="text-sm font-semibold text-white mb-1">{{ lang.currentLang === 'et' ? 'Kuidas viktoriin toimib' : 'How the quiz works' }}</h4>
                <ul class="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  <li>{{ lang.currentLang === 'et' ? '15 küsimust sinu rollile kohandatuna' : '15 questions tailored to your role' }}</li>
                  <li>{{ lang.currentLang === 'et' ? '4 vastusevarianti iga küsimuse kohta' : '4 answer options per question' }}</li>
                  <li>{{ lang.currentLang === 'et' ? 'Kohene tagasiside ja DORA artikli viited' : 'Instant feedback with DORA article references' }}</li>
                  <li>{{ lang.currentLang === 'et' ? 'Koolitustunnistus l\u00f5petamisel' : 'Training certificate upon completion' }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ═══════════ PHASE: QUIZ ═══════════ -->
      @if (phase() === 'quiz') {
        <div class="space-y-6">

          <!-- Progress bar + timer -->
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <span class="text-sm font-medium text-white">
                  {{ lang.currentLang === 'et' ? 'K\u00fcsimus' : 'Question' }} {{ currentIndex() + 1 }}/{{ quizQuestions().length }}
                </span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700/50 text-slate-300">
                  {{ getCurrentCategory() }}
                </span>
              </div>
              <div class="flex items-center gap-2 text-sm text-slate-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {{ formatTime(elapsedSeconds()) }}
              </div>
            </div>
            <div class="h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500 rounded-full"
                   [style.width.%]="((currentIndex() + 1) / quizQuestions().length) * 100"></div>
            </div>
            <!-- Score so far -->
            <div class="flex items-center justify-between mt-2 text-xs text-slate-500">
              <span>{{ lang.currentLang === 'et' ? '\u00d5igeid' : 'Correct' }}: {{ correctCount() }}/{{ answeredCount() }}</span>
              <span>{{ Math.round(((currentIndex() + 1) / quizQuestions().length) * 100) }}%</span>
            </div>
          </div>

          <!-- Question card -->
          @if (currentQuestion(); as q) {
            <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 md:p-8 space-y-6">

              <!-- Question text -->
              <div>
                <div class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-sm font-bold text-emerald-400">
                    {{ currentIndex() + 1 }}
                  </span>
                  <h3 class="text-lg font-semibold text-white leading-relaxed">
                    {{ lang.currentLang === 'et' ? q.question.et : q.question.en }}
                  </h3>
                </div>
              </div>

              <!-- Answer options -->
              <div class="space-y-3">
                @for (option of (lang.currentLang === 'et' ? q.options.et : q.options.en); track $index) {
                  <button (click)="selectAnswer($index)" type="button"
                          [disabled]="answered()"
                          class="w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-start gap-3"
                          [class]="getOptionClass($index)">
                    <span class="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all"
                          [class]="getOptionLetterClass($index)">
                      {{ ['A','B','C','D'][$index] }}
                    </span>
                    <span class="pt-0.5 text-sm leading-relaxed">{{ option }}</span>
                  </button>
                }
              </div>

              <!-- Explanation (after answering) -->
              @if (answered()) {
                <div class="rounded-xl border p-5 space-y-3"
                     [class]="selectedAnswer() === q.correctIndex
                       ? 'bg-emerald-500/5 border-emerald-500/30'
                       : 'bg-red-500/5 border-red-500/30'">
                  <div class="flex items-center gap-2">
                    @if (selectedAnswer() === q.correctIndex) {
                      <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      <span class="text-sm font-bold text-emerald-400">{{ lang.currentLang === 'et' ? '\u00d5ige!' : 'Correct!' }}</span>
                    } @else {
                      <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      <span class="text-sm font-bold text-red-400">{{ lang.currentLang === 'et' ? 'Vale!' : 'Incorrect!' }}</span>
                    }
                  </div>
                  <p class="text-sm text-slate-300 leading-relaxed">
                    {{ lang.currentLang === 'et' ? q.explanation.et : q.explanation.en }}
                  </p>
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/20 text-cyan-400">
                      {{ q.doraReference }}
                    </span>
                  </div>
                </div>

                <!-- Next button -->
                <div class="flex justify-end">
                  <button (click)="nextQuestion()" type="button"
                          class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-2">
                    {{ isLastQuestion()
                      ? (lang.currentLang === 'et' ? 'Vaata tulemusi' : 'View Results')
                      : (lang.currentLang === 'et' ? 'J\u00e4rgmine k\u00fcsimus' : 'Next Question') }}
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- ═══════════ PHASE: RESULTS ═══════════ -->
      @if (phase() === 'results') {
        @if (quizResult(); as result) {
          <div class="space-y-6">

            <!-- Score Card -->
            <div class="relative overflow-hidden rounded-2xl border p-8 text-center"
                 [class]="result.grade === 'A' ? 'bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/30'
                        : result.grade === 'B' ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30'
                        : result.grade === 'C' ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30'
                        : 'bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30'">
              <div class="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-white/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div class="relative space-y-4">
                <div class="text-6xl font-black"
                     [class]="result.grade === 'A' ? 'text-emerald-400' : result.grade === 'B' ? 'text-blue-400' : result.grade === 'C' ? 'text-amber-400' : 'text-red-400'">
                  {{ result.grade }}
                </div>
                <div class="text-4xl font-bold text-white">{{ result.correctAnswers }}/{{ result.totalQuestions }}</div>
                <div class="text-lg text-slate-300">{{ result.percentage }}%</div>
                <p class="text-sm text-slate-400">
                  {{ getGradeMessage(result.grade) }}
                </p>
              </div>
            </div>

            <!-- Category Breakdown -->
            <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
              <h3 class="text-sm font-bold text-white uppercase tracking-wider">
                {{ lang.currentLang === 'et' ? 'Tulemused kategooriate kaupa' : 'Results by Category' }}
              </h3>
              @for (cat of result.categoryBreakdown; track cat.category) {
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-slate-300">{{ getCategoryLabel(cat.category) }}</span>
                    <span class="text-sm font-bold"
                          [class]="cat.percentage >= 75 ? 'text-emerald-400' : cat.percentage >= 50 ? 'text-amber-400' : 'text-red-400'">
                      {{ cat.correct }}/{{ cat.total }} ({{ cat.percentage }}%)
                    </span>
                  </div>
                  <div class="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-700"
                         [class]="cat.percentage >= 75 ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : cat.percentage >= 50 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-red-500 to-orange-500'"
                         [style.width.%]="cat.percentage"></div>
                  </div>
                </div>
              }
            </div>

            <!-- Recommendations -->
            @if (getWeakCategories(result).length > 0) {
              <div class="bg-slate-800/50 border border-amber-500/20 rounded-2xl p-6 space-y-4">
                <h3 class="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  {{ lang.currentLang === 'et' ? 'Soovitused parandamiseks' : 'Recommendations for Improvement' }}
                </h3>
                @for (weak of getWeakCategories(result); track weak.category) {
                  <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-900/30">
                    <div class="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg class="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-white">{{ getCategoryLabel(weak.category) }}</p>
                      <p class="text-xs text-slate-400 mt-0.5">{{ getRecommendation(weak.category) }}</p>
                      <a [routerLink]="getRecommendedLink(weak.category)" class="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 mt-1.5 transition-colors">
                        {{ lang.currentLang === 'et' ? 'Ava t\u00f6\u00f6riist' : 'Open tool' }}
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                      </a>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Certificate Card -->
            <div class="relative overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-center space-y-4">
              <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent"></div>
              <div class="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-emerald-500/20 rounded-tl-lg"></div>
              <div class="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-emerald-500/20 rounded-tr-lg"></div>
              <div class="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-emerald-500/20 rounded-bl-lg"></div>
              <div class="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-emerald-500/20 rounded-br-lg"></div>

              <div class="relative space-y-4">
                <div class="text-emerald-400">
                  <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
                </div>
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/70">DoraAudit.eu</p>
                  <h3 class="text-xl font-bold text-white mt-1">
                    {{ lang.currentLang === 'et' ? 'DORA koolituse tunnistus' : 'DORA Training Certificate' }}
                  </h3>
                </div>
                <div class="text-sm text-slate-300">
                  {{ lang.currentLang === 'et' ? 'Roll' : 'Role' }}: <span class="font-semibold text-white">{{ getRoleLabel(result.role) }}</span>
                </div>
                <div class="text-sm text-slate-300">
                  {{ lang.currentLang === 'et' ? 'Tulemus' : 'Score' }}: <span class="font-bold text-emerald-400">{{ result.percentage }}% ({{ result.grade }})</span>
                </div>
                <div class="text-sm text-slate-300">
                  {{ lang.currentLang === 'et' ? 'Aeg' : 'Time' }}: <span class="text-white">{{ formatTime(result.elapsedSeconds) }}</span>
                </div>
                <div class="text-xs text-slate-500 pt-2 border-t border-slate-700/50">
                  {{ lang.currentLang === 'et' ? 'L\u00e4bitud' : 'Completed' }}: {{ result.completedAt }}
                  &bull; DORA Art. 13(6)
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <button (click)="retryQuiz()" type="button"
                      class="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-2 justify-center">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                {{ lang.currentLang === 'et' ? 'Proovi uuesti' : 'Retry Quiz' }}
              </button>
              <button (click)="shareResults()" type="button"
                      class="px-6 py-3 rounded-xl border border-slate-600/50 text-slate-300 font-semibold text-sm hover:border-emerald-500/30 hover:text-white transition-all flex items-center gap-2 justify-center">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                {{ lang.currentLang === 'et' ? 'Jaga tulemusi' : 'Share Results' }}
              </button>
              <a routerLink="/training" class="px-6 py-3 rounded-xl border border-slate-600/50 text-slate-300 font-semibold text-sm hover:border-cyan-500/30 hover:text-white transition-all flex items-center gap-2 justify-center">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                {{ lang.currentLang === 'et' ? 'Koolituste j\u00e4lgija' : 'Training Tracker' }}
              </a>
            </div>

            <!-- Copied toast -->
            @if (showCopied()) {
              <div class="fixed bottom-6 right-6 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 animate-pulse z-50">
                {{ lang.currentLang === 'et' ? 'Kopeeritud l\u00f5ikelauale!' : 'Copied to clipboard!' }}
              </div>
            }
          </div>
        }
      }
    </div>
  `
})
export class TrainingQuizComponent implements OnDestroy {
  public lang = inject(LangService);

  Math = Math;

  roles = ROLES;
  phase = signal<QuizPhase>('role-select');
  selectedRole = signal<Role | null>(null);
  quizQuestions = signal<QuizQuestion[]>([]);
  currentIndex = signal(0);
  answered = signal(false);
  selectedAnswer = signal<number | null>(null);
  answers = signal<{ questionId: number; selected: number; correct: boolean }[]>([]);
  quizResult = signal<QuizResult | null>(null);
  elapsedSeconds = signal(0);
  showCopied = signal(false);

  correctCount = computed(() => this.answers().filter(a => a.correct).length);
  answeredCount = computed(() => this.answers().length);

  private timerInterval: ReturnType<typeof setInterval> | null = null;

  currentQuestion = computed(() => {
    const qs = this.quizQuestions();
    const idx = this.currentIndex();
    return qs.length > idx ? qs[idx] : null;
  });

  selectRole(role: Role) {
    this.selectedRole.set(role);
    this.buildQuiz(role);
    this.phase.set('quiz');
    this.startTimer();
  }

  private buildQuiz(role: Role) {
    const available = QUESTIONS.filter(q => q.roles.includes(role));

    const selected: QuizQuestion[] = [];

    for (const category of CATEGORY_ORDER) {
      const target = CATEGORY_TARGETS[category];
      const pool = available.filter(q => q.category === category && !selected.includes(q));
      const shuffled = this.shuffle([...pool]);
      selected.push(...shuffled.slice(0, target));
    }

    // If we still need more questions to reach 15, fill from remaining
    if (selected.length < 15) {
      const remaining = available.filter(q => !selected.includes(q));
      const shuffledRemaining = this.shuffle([...remaining]);
      selected.push(...shuffledRemaining.slice(0, 15 - selected.length));
    }

    // Shuffle final order but keep some category grouping feel
    this.quizQuestions.set(selected.slice(0, 15));
    this.currentIndex.set(0);
    this.answers.set([]);
    this.answered.set(false);
    this.selectedAnswer.set(null);
  }

  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private startTimer() {
    this.elapsedSeconds.set(0);
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds.update(s => s + 1);
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  selectAnswer(index: number) {
    if (this.answered()) return;
    const q = this.currentQuestion();
    if (!q) return;

    this.selectedAnswer.set(index);
    this.answered.set(true);

    this.answers.update(a => [
      ...a,
      { questionId: q.id, selected: index, correct: index === q.correctIndex }
    ]);
  }

  nextQuestion() {
    if (this.isLastQuestion()) {
      this.finishQuiz();
      return;
    }
    this.currentIndex.update(i => i + 1);
    this.answered.set(false);
    this.selectedAnswer.set(null);
  }

  isLastQuestion(): boolean {
    return this.currentIndex() >= this.quizQuestions().length - 1;
  }

  getCurrentCategory(): string {
    const q = this.currentQuestion();
    if (!q) return '';
    if (this.lang.currentLang === 'et') {
      return this.getCategoryLabel(q.category);
    }
    return q.category;
  }

  private finishQuiz() {
    this.stopTimer();
    const qs = this.quizQuestions();
    const ans = this.answers();
    const correct = ans.filter(a => a.correct).length;
    const total = qs.length;
    const pct = Math.round((correct / total) * 100);

    const breakdown: QuizResult['categoryBreakdown'] = [];
    for (const cat of CATEGORY_ORDER) {
      const catQuestions = qs.filter(q => q.category === cat);
      if (catQuestions.length === 0) continue;
      const catCorrect = catQuestions.filter(q =>
        ans.find(a => a.questionId === q.id)?.correct
      ).length;
      breakdown.push({
        category: cat,
        correct: catCorrect,
        total: catQuestions.length,
        percentage: Math.round((catCorrect / catQuestions.length) * 100)
      });
    }

    let grade = 'F';
    if (pct >= 90) grade = 'A';
    else if (pct >= 75) grade = 'B';
    else if (pct >= 60) grade = 'C';

    this.quizResult.set({
      totalQuestions: total,
      correctAnswers: correct,
      percentage: pct,
      grade,
      categoryBreakdown: breakdown,
      completedAt: new Date().toLocaleDateString(this.lang.currentLang === 'et' ? 'et-EE' : 'en-GB', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }),
      role: this.selectedRole() || 'general',
      elapsedSeconds: this.elapsedSeconds()
    });

    this.phase.set('results');
  }

  retryQuiz() {
    this.phase.set('role-select');
    this.selectedRole.set(null);
    this.quizQuestions.set([]);
    this.currentIndex.set(0);
    this.answers.set([]);
    this.answered.set(false);
    this.selectedAnswer.set(null);
    this.quizResult.set(null);
    this.elapsedSeconds.set(0);
    this.stopTimer();
  }

  shareResults() {
    const r = this.quizResult();
    if (!r) return;
    const text = this.lang.currentLang === 'et'
      ? `DORA koolituse viktoriin - Tulemus: ${r.percentage}% (${r.grade}) | ${r.correctAnswers}/${r.totalQuestions} \u00f5iget | Roll: ${this.getRoleLabel(r.role)} | DoraAudit.eu`
      : `DORA Training Quiz - Score: ${r.percentage}% (${r.grade}) | ${r.correctAnswers}/${r.totalQuestions} correct | Role: ${this.getRoleLabel(r.role)} | DoraAudit.eu`;
    navigator.clipboard.writeText(text).then(() => {
      this.showCopied.set(true);
      setTimeout(() => this.showCopied.set(false), 2500);
    });
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  getOptionClass(index: number): string {
    const base = 'cursor-pointer ';
    if (!this.answered()) {
      return base + 'border-slate-700/50 bg-slate-800/30 hover:border-emerald-500/40 hover:bg-slate-800/60';
    }
    const q = this.currentQuestion();
    if (!q) return base + 'border-slate-700/50 bg-slate-800/30';

    if (index === q.correctIndex) {
      return 'border-emerald-500/50 bg-emerald-500/10';
    }
    if (index === this.selectedAnswer() && index !== q.correctIndex) {
      return 'border-red-500/50 bg-red-500/10';
    }
    return 'border-slate-700/30 bg-slate-800/20 opacity-50';
  }

  getOptionLetterClass(index: number): string {
    if (!this.answered()) {
      return 'bg-slate-700/50 text-slate-300';
    }
    const q = this.currentQuestion();
    if (!q) return 'bg-slate-700/50 text-slate-300';

    if (index === q.correctIndex) {
      return 'bg-emerald-500 text-white';
    }
    if (index === this.selectedAnswer() && index !== q.correctIndex) {
      return 'bg-red-500 text-white';
    }
    return 'bg-slate-700/30 text-slate-500';
  }

  getGradeMessage(grade: string): string {
    if (this.lang.currentLang === 'et') {
      switch (grade) {
        case 'A': return 'Suurep\u00e4rane! Sul on s\u00fcgavad teadmised DORA n\u00f5uetest. Sa oled valmis juhtima oma organisatsiooni vastavusse.';
        case 'B': return 'Hea tulemus! Sul on tugev p\u00f5hialus, kuid m\u00f5nes valdkonnas on veel arenguruumi.';
        case 'C': return 'Rahuldav tulemus. Soovitame t\u00e4iendavat koolitust n\u00f5rkades valdkondades.';
        default: return 'Vajad t\u00e4iendavat koolitust. Vaata allpool soovitusi ja proovi uuesti.';
      }
    }
    switch (grade) {
      case 'A': return 'Excellent! You have deep knowledge of DORA requirements. You are well-prepared to lead your organization to compliance.';
      case 'B': return 'Good result! You have a strong foundation, but there is room for improvement in some areas.';
      case 'C': return 'Satisfactory result. We recommend additional training in the weak areas identified below.';
      default: return 'Additional training is needed. Review the recommendations below and try again.';
    }
  }

  getCategoryLabel(category: string): string {
    if (this.lang.currentLang === 'et') {
      switch (category) {
        case 'DORA General Knowledge': return 'DORA \u00fcldteadmised';
        case 'ICT Risk Management': return 'IKT riskijuhtimine';
        case 'Incident Reporting': return 'Intsidentide raporteerimine';
        case 'Third-Party Risk': return 'Kolmandate osapoolte risk';
        case 'Resilience Testing': return 'Vastupidavuse testimine';
        default: return category;
      }
    }
    return category;
  }

  getRoleLabel(roleKey: string): string {
    const r = ROLES.find(r => r.key === roleKey);
    if (!r) return roleKey;
    return this.lang.currentLang === 'et' ? r.label.et : r.label.en;
  }

  getWeakCategories(result: QuizResult): { category: string; percentage: number }[] {
    return result.categoryBreakdown
      .filter(c => c.percentage < 75)
      .sort((a, b) => a.percentage - b.percentage);
  }

  getRecommendation(category: string): string {
    if (this.lang.currentLang === 'et') {
      switch (category) {
        case 'DORA General Knowledge': return 'Tutvu DORA \u00fcldise raamistiku ja p\u00f5him\u00f5istetega. Soovitame l\u00e4bi lugeda DORA artiklid 1-7.';
        case 'ICT Risk Management': return 'Tugevda IKT riskijuhtimise teadmisi. Vaata DORA artikleid 5-16 ja kasuta meie hindamist\u00f6\u00f6riista.';
        case 'Incident Reporting': return 'Harjuta intsidentide raporteerimise protseduure. Proovi meie intsidendi simulaatorit.';
        case 'Third-Party Risk': return 'Tutvu kolmandate osapoolte riskijuhtimise n\u00f5uetega. Kasuta meie lepinguanal\u00fc\u00fcsi t\u00f6\u00f6riista.';
        case 'Resilience Testing': return 'Uuri DORA testimisen\u00f5udeid. Vaata meie TLPT moodulit ja vastupidavuse testimise juhiseid.';
        default: return 'Soovitame t\u00e4iendavat koolitust selles valdkonnas.';
      }
    }
    switch (category) {
      case 'DORA General Knowledge': return 'Review the overall DORA framework and key concepts. We recommend reading DORA Articles 1-7.';
      case 'ICT Risk Management': return 'Strengthen your ICT risk management knowledge. Review DORA Articles 5-16 and use our assessment tool.';
      case 'Incident Reporting': return 'Practice incident reporting procedures. Try our Incident Simulator tool.';
      case 'Third-Party Risk': return 'Study third-party risk management requirements. Use our Contract Analysis tool.';
      case 'Resilience Testing': return 'Study DORA testing requirements. Review our TLPT module and resilience testing guidelines.';
      default: return 'We recommend additional training in this area.';
    }
  }

  getRecommendedLink(category: string): string {
    switch (category) {
      case 'DORA General Knowledge': return '/assessment';
      case 'ICT Risk Management': return '/risk-heatmap';
      case 'Incident Reporting': return '/incident-simulator';
      case 'Third-Party Risk': return '/contract-analysis';
      case 'Resilience Testing': return '/tlpt';
      default: return '/assessment';
    }
  }

  ngOnDestroy() {
    this.stopTimer();
  }
}

