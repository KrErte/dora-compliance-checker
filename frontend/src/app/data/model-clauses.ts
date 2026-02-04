// DORA Article 30 Model Contract Clauses
// These represent ideal contract clauses for each of the 8 core requirements

export interface ModelClause {
  id: string;
  nameEt: string;
  nameEn: string;
  clauseEt: string;
  clauseEn: string;
  doraReference: string;
}

export const MODEL_CLAUSES: ModelClause[] = [
  {
    id: '1',
    nameEt: 'Teenustaseme kokkulepped',
    nameEn: 'Service Level Agreements',
    clauseEt: '"Teenusepakkuja tagab teenuse kättesaadavuse vähemalt 99,5% tasemega kvartalis, mõõdetuna [monitooringusüsteemi] abil. Teenustaseme languse korral rakendatakse [X]% lepingutasu vähendamist."',
    clauseEn: '"The provider shall ensure service availability of at least 99.5% per quarter, measured by [monitoring system]. Service level degradation shall result in [X]% fee reduction."',
    doraReference: 'Art. 30(2)(a)'
  },
  {
    id: '2',
    nameEt: 'Intsidentidest teavitamine',
    nameEn: 'Incident Notification',
    clauseEt: '"Teenusepakkuja teavitab tellijat kõigist IKT-intsidentidest viivitamatult, kuid mitte hiljem kui [4] tundi pärast intsidendi tuvastamist. Teavitus sisaldab mõjuanalüüsi, prognoosi ja parandusmeetmeid."',
    clauseEn: '"The provider shall notify the client of all ICT incidents without delay, no later than [4] hours after detection. Notification shall include impact analysis, prognosis and remediation measures."',
    doraReference: 'Art. 30(2)(d)'
  },
  {
    id: '3',
    nameEt: 'Auditeerimisõigus',
    nameEn: 'Audit Rights',
    clauseEt: '"Tellijal on õigus teostada teenusepakkuja süsteemides auditit vähemalt [1] kord aastas, kaasates sõltumatuid audiitoreid. Teenusepakkuja tagab auditi läbiviimiseks vajaliku ligipääsu ja dokumentatsiooni."',
    clauseEn: '"The client shall have the right to audit the provider systems at least [1] time per year, involving independent auditors. The provider shall ensure access and documentation necessary for the audit."',
    doraReference: 'Art. 30(2)(c)'
  },
  {
    id: '4',
    nameEt: 'Väljumisstrateegia',
    nameEn: 'Exit Strategy',
    clauseEt: '"Lepingu lõppemisel või ülesütlemisel tagab teenusepakkuja andmete ja protsesside üleandmise [90] kalendripäeva jooksul. Üleandmise plaan sisaldab andmeformaate, migratsiooni ajakava ja vastutavaid isikuid."',
    clauseEn: '"Upon termination, the provider shall ensure data and process handover within [90] calendar days. The transition plan shall include data formats, migration schedule and responsible persons."',
    doraReference: 'Art. 30(2)(e)'
  },
  {
    id: '5',
    nameEt: 'Andmete asukoht ja töötlemine',
    nameEn: 'Data Location and Processing',
    clauseEt: '"Teenusepakkuja töötleb tellija andmeid ainult Euroopa Liidu/EMP piires. Allhankijate kaasamiseks on vajalik tellija eelnev kirjalik nõusolek. Andmete turvameetmed vastavad ISO 27001 standardile."',
    clauseEn: '"The provider shall process client data only within the EU/EEA. Subcontracting requires prior written consent. Data security measures shall comply with ISO 27001 standard."',
    doraReference: 'Art. 30(2)(b)'
  },
  {
    id: '6',
    nameEt: 'Alltöövõtjate tingimused',
    nameEn: 'Subcontracting Conditions',
    clauseEt: '"Teenusepakkuja ei kaasa allhankijaid ilma tellija eelneva kirjaliku nõusolekuta. Allhankijate nimekiri ja nende IKT-riskiprofiil esitatakse tellijale enne lepingu sõlmimist ning iga muudatuse korral."',
    clauseEn: '"The provider shall not engage subcontractors without prior written consent. The list of subcontractors and their ICT risk profiles shall be provided before contract signing and upon any changes."',
    doraReference: 'Art. 30(2)(f)'
  },
  {
    id: '7',
    nameEt: 'IKT riskihaldus',
    nameEn: 'ICT Risk Management',
    clauseEt: '"Teenusepakkuja hoiab ajakohasena IKT riskihalduse raamistikku, mis hõlmab riskide tuvastamist, hindamist ja maandamist. Riskianalüüsi tulemused ja maandamismeetmed esitatakse tellijale kord kvartalis."',
    clauseEn: '"The provider shall maintain an up-to-date ICT risk management framework covering risk identification, assessment and mitigation. Risk analysis results and mitigation measures shall be reported to the client quarterly."',
    doraReference: 'Art. 30(2)(g)'
  },
  {
    id: '8',
    nameEt: 'Talitluspidevus',
    nameEn: 'Business Continuity',
    clauseEt: '"Teenusepakkuja tagab äritegevuse jätkuvuse plaani olemasolu ja testimise vähemalt [1] kord aastas. Plaan sisaldab taastumise ajaeesmärke (RTO ≤ [4h], RPO ≤ [1h]) ja kriisiolukorras tegutsemise protseduure."',
    clauseEn: '"The provider shall ensure a business continuity plan is in place and tested at least [1] time per year. The plan shall include recovery time objectives (RTO ≤ [4h], RPO ≤ [1h]) and crisis procedures."',
    doraReference: 'Art. 30(2)(h)'
  }
];

// Helper to get clause by requirement ID
export function getModelClause(requirementId: number | string): ModelClause | undefined {
  return MODEL_CLAUSES.find(c => c.id === String(requirementId));
}
