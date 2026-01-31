import { Injectable, signal, computed } from '@angular/core';

export type Lang = 'et' | 'en';

const TRANSLATIONS: { [key: string]: { et: string; en: string } } = {
  // Nav
  'nav.history': { et: 'Ajalugu', en: 'History' },
  'nav.assessment': { et: 'Hindamine', en: 'Assessment' },
  'nav.subtitle': { et: 'IKT-lepingute hindamine', en: 'ICT Contract Assessment' },

  // Landing
  'landing.regulation': { et: 'EU m\u00e4\u00e4rus 2022/2554', en: 'EU Regulation 2022/2554' },
  'landing.subtitle': { et: 'Vastavuskontroll', en: 'Compliance Checker' },
  'landing.description': { et: 'Kontrollige oma IKT-teenuste lepingute vastavust digitaalse tegevuskerksuse m\u00e4\u00e4ruse (DORA) artiklite 28\u201330 n\u00f5uetele.', en: 'Check your ICT service contracts for compliance with the Digital Operational Resilience Act (DORA) Articles 28\u201330.' },
  'landing.cta': { et: 'Alusta hindamist', en: 'Start Assessment' },
  'landing.step1.title': { et: 'Sisesta andmed', en: 'Enter Data' },
  'landing.step1.desc': { et: 'Ettev\u00f5tte nimi ja IKT-lepingu nimetus', en: 'Company name and ICT contract title' },
  'landing.step2.title': { et: 'Vasta k\u00fcsimustele', en: 'Answer Questions' },
  'landing.step2.desc': { et: '15 k\u00fcsimust 9 DORA kategooriast', en: '15 questions across 9 DORA categories' },
  'landing.step3.title': { et: 'Saa tulemused', en: 'Get Results' },
  'landing.step3.desc': { et: 'Vastavusskoor ja soovitused', en: 'Compliance score and recommendations' },
  'landing.categories': { et: 'Hindamise valdkonnad', en: 'Assessment Areas' },
  'landing.pillars': { et: 'DORA 5 sammast', en: 'DORA 5 Pillars' },
  'landing.active': { et: 'Aktiivne', en: 'Active' },
  'landing.soon': { et: 'Peagi', en: 'Soon' },
  'landing.eu_compliance': { et: 'EU regulatsioonide vastavus', en: 'EU Regulatory Compliance' },
  'landing.eu_desc_dora': { et: 'Toetab', en: 'Supports' },
  'landing.eu_desc_nis2': { et: 'tugi on tulemas.', en: 'support coming soon.' },

  // Assessment
  'assessment.title': { et: 'DORA vastavuse hindamine', en: 'DORA Compliance Assessment' },
  'assessment.step_data': { et: 'Andmed', en: 'Data' },
  'assessment.step_questions': { et: 'K\u00fcsimused', en: 'Questions' },
  'assessment.step_results': { et: 'Tulemused', en: 'Results' },
  'assessment.company': { et: 'Ettev\u00f5tte andmed', en: 'Company Information' },
  'assessment.company_name': { et: 'Ettev\u00f5tte nimi', en: 'Company Name' },
  'assessment.contract_name': { et: 'Lepingu nimetus', en: 'Contract Name' },
  'assessment.submit': { et: 'Esita hindamine', en: 'Submit Assessment' },
  'assessment.submitting': { et: 'Hindamine...', en: 'Assessing...' },
  'assessment.score_preview': { et: 'Eeldatav skoor', en: 'Expected Score' },
  'assessment.yes': { et: 'Jah', en: 'Yes' },
  'assessment.no': { et: 'Ei', en: 'No' },
  'assessment.questions_suffix': { et: 'k\u00fcsimust', en: 'questions' },
  'assessment.question_suffix': { et: 'k\u00fcsimus', en: 'question' },

  // Results
  'results.loading': { et: 'Tulemuste laadimine...', en: 'Loading results...' },
  'results.percent': { et: 'protsenti', en: 'percent' },
  'results.compliant': { et: 'vastav', en: 'compliant' },
  'results.non_compliant': { et: 'mittevastav', en: 'non-compliant' },
  'results.total': { et: 'kokku', en: 'total' },
  'results.profile': { et: 'Vastavuse profiil', en: 'Compliance Profile' },
  'results.risk_matrix': { et: 'Riskimaatriks', en: 'Risk Matrix' },
  'results.low': { et: 'Madal', en: 'Low' },
  'results.medium': { et: 'Keskmine', en: 'Medium' },
  'results.high': { et: 'K\u00f5rge', en: 'High' },
  'results.low_risk': { et: 'Madal risk', en: 'Low Risk' },
  'results.med_risk': { et: 'Keskmine', en: 'Medium' },
  'results.high_risk': { et: 'K\u00f5rge risk', en: 'High Risk' },
  'results.likelihood': { et: 'T\u00f5en\u00e4osus', en: 'Likelihood' },
  'results.impact': { et: 'M\u00f5ju', en: 'Impact' },
  'results.pillars': { et: 'DORA 5 sammast', en: 'DORA 5 Pillars' },
  'results.detail': { et: 'Detailne \u00fclevaade', en: 'Detailed Overview' },
  'results.recommendation': { et: 'Soovitus', en: 'Recommendation' },
  'results.priority': { et: 'Prioriteetne tegevuskava', en: 'Priority Action Plan' },
  'results.gaps': { et: 'puudust', en: 'gaps' },
  'results.critical': { et: 'Kriitiline', en: 'Critical' },
  'results.important': { et: 'Oluline', en: 'Important' },
  'results.download_pdf': { et: 'Laadi PDF', en: 'Download PDF' },
  'results.new_assessment': { et: 'Uus hindamine', en: 'New Assessment' },
  'results.history': { et: 'Ajalugu', en: 'History' },
  'results.green': { et: 'Vastav', en: 'Compliant' },
  'results.yellow': { et: 'Osaliselt vastav', en: 'Partially Compliant' },
  'results.red': { et: 'Mittevastav', en: 'Non-Compliant' },

  // History
  'history.title': { et: 'Hindamiste ajalugu', en: 'Assessment History' },
  'history.total': { et: 'hindamist kokku', en: 'total assessments' },
  'history.avg_score': { et: 'Keskmine skoor', en: 'Average Score' },
  'history.compliant': { et: 'Vastavad', en: 'Compliant' },
  'history.partial': { et: 'Osaliselt', en: 'Partial' },
  'history.non_compliant': { et: 'Mittevastav', en: 'Non-Compliant' },
  'history.trend': { et: 'Skoori trend', en: 'Score Trend' },
  'history.empty_title': { et: 'Ajalugu on t\u00fchi', en: 'History is Empty' },
  'history.empty_desc': { et: 'Te pole veel \u00fchtegi hindamist l\u00e4bi viinud.', en: 'You haven\u2019t completed any assessments yet.' },
  'history.first': { et: 'Alusta esimest hindamist', en: 'Start First Assessment' },
  'history.clear': { et: 'Kustuta ajalugu', en: 'Clear History' },
  'history.new': { et: 'Uus hindamine', en: 'New Assessment' },

  // Contract Analysis - Nav
  'nav.contract_audit': { et: 'Lepingu audit', en: 'Contract Audit' },

  // Contract Upload
  'contract.title': { et: 'Lepingu auditivalmiduse anal\u00fc\u00fcs', en: 'Contract Audit Readiness Analysis' },
  'contract.subtitle': { et: 'Laadige \u00fcles IKT-teenuse leping ja saage teada, kas see j\u00e4\u00e4b regulaatori ees p\u00fcsima.', en: 'Upload an ICT service contract and find out if it will withstand a regulatory audit.' },
  'contract.drop_file': { et: 'Lohistage fail siia v\u00f5i kl\u00f5psake', en: 'Drag & drop file here or click' },
  'contract.file_types': { et: 'PDF v\u00f5i DOCX, max 10 MB', en: 'PDF or DOCX, max 10 MB' },
  'contract.company_name': { et: 'Ettev\u00f5tte nimi', en: 'Company Name' },
  'contract.company_placeholder': { et: 'Nt. Swedbank AS', en: 'E.g. Swedbank AS' },
  'contract.contract_name': { et: 'Lepingu nimetus', en: 'Contract Name' },
  'contract.contract_placeholder': { et: 'Nt. Pilveteenus leping nr 2024-001', en: 'E.g. Cloud service agreement no. 2024-001' },
  'contract.start_analysis': { et: 'Alusta anal\u00fc\u00fcsi', en: 'Start Analysis' },
  'contract.analyzing': { et: 'Anal\u00fc\u00fcs k\u00e4ib...', en: 'Analysis in progress...' },
  'contract.step_extracting': { et: 'Teksti eraldamine dokumendist...', en: 'Extracting text from document...' },
  'contract.step_mapping': { et: 'N\u00f5uete kaardistamine...', en: 'Mapping requirements...' },
  'contract.step_scoring': { et: 'Kaitstavuse skoori arvutamine...', en: 'Calculating defensibility score...' },
  'contract.error_file_type': { et: 'Lubatud on ainult PDF ja DOCX failid.', en: 'Only PDF and DOCX files are allowed.' },
  'contract.error_file_size': { et: 'Fail on liiga suur. Maksimaalne suurus on 10 MB.', en: 'File is too large. Maximum size is 10 MB.' },
  'contract.error_analysis': { et: 'Anal\u00fc\u00fcs eba\u00f5nnestus. Proovige uuesti.', en: 'Analysis failed. Please try again.' },
  'contract.how_it_works': { et: 'Kuidas see t\u00f6\u00f6tab?', en: 'How does it work?' },
  'contract.step1': { et: 'Tekst eraldatakse dokumendist automaatselt', en: 'Text is automatically extracted from the document' },
  'contract.step2': { et: '37 DORA Art. 30 n\u00f5uet kaardistatakse s\u00fcstemaatiliselt lepingu vastu', en: '37 DORA Art. 30 requirements are systematically mapped against the contract' },
  'contract.step3': { et: 'Kaitstavuse skoor n\u00e4itab, kui h\u00e4sti leping regulaatori auditi ees p\u00fcsti j\u00e4\u00e4b', en: 'Defensibility score shows how well the contract will withstand a regulatory audit' },

  // Contract Results
  'contract.loading_results': { et: 'Tulemuste laadimine...', en: 'Loading results...' },
  'contract.error_loading': { et: 'Tulemuste laadimine eba\u00f5nnestus.', en: 'Failed to load results.' },
  'contract.back': { et: 'Tagasi', en: 'Back' },
  'contract.defensibility': { et: 'KAITSTAVUS', en: 'DEFENSIBILITY' },
  'contract.covered': { et: 'Kaetud', en: 'Covered' },
  'contract.weak': { et: 'N\u00f5rk', en: 'Weak' },
  'contract.missing': { et: 'Puudu', en: 'Missing' },
  'contract.tab_evidence': { et: 'T\u00f5endite kaardistus', en: 'Evidence Mapping' },
  'contract.tab_gaps': { et: 'Puuduste aruanne', en: 'Gap Report' },
  'contract.evidence_mapping': { et: 'T\u00f5endite kaardistus', en: 'Evidence Mapping' },
  'contract.evidence_desc': { et: 'Iga DORA Art. 30 n\u00f5ue on kaardistatud lepingus leiduvate t\u00f5endite vastu.', en: 'Each DORA Art. 30 requirement is mapped against evidence found in the contract.' },
  'contract.filter_all': { et: 'K\u00f5ik', en: 'All' },
  'contract.th_article': { et: 'Artikkel', en: 'Article' },
  'contract.th_requirement': { et: 'N\u00f5ue', en: 'Requirement' },
  'contract.th_status': { et: 'Staatus', en: 'Status' },
  'contract.th_evidence': { et: 'T\u00f5end / Anal\u00fc\u00fcs', en: 'Evidence / Analysis' },
  'contract.no_gaps': { et: 'Puudusi ei tuvastatud! Leping katab k\u00f5iki DORA n\u00f5udeid.', en: 'No gaps found! Contract covers all DORA requirements.' },
  'contract.recommendation': { et: 'Soovitus', en: 'Recommendation' },
  'contract.suggested_clause': { et: 'Soovitatud klausel', en: 'Suggested Clause' },
  'contract.download_pdf': { et: 'Laadi PDF aruanne', en: 'Download PDF Report' },
  'contract.new_analysis': { et: 'Uus anal\u00fc\u00fcs', en: 'New Analysis' },

  // Demo scenarios
  'contract.demo_title': { et: 'N\u00e4idisanalüüsid', en: 'Example Analyses' },
  'contract.demo_desc': { et: 'Vaadake, milline anal\u00fc\u00fcsi tulemus erineva kvaliteediga lepingute puhul v\u00e4lja n\u00e4eb.', en: 'See what analysis results look like for contracts of different quality.' },
  'contract.demo_view': { et: 'Vaata tulemusi', en: 'View results' },

  // Sample contracts
  'contract.samples_title': { et: 'N\u00e4idislepingud allalaadimiseks', en: 'Sample Contracts for Download' },
  'contract.samples_desc': { et: 'Laadige alla n\u00e4idisleping ja laadige see \u00fcles, et testida p\u00e4ris anal\u00fc\u00fcsi.', en: 'Download a sample contract and upload it to test the real analysis.' },
  'contract.sample_download': { et: 'Laadi alla', en: 'Download' },
  'contract.sample_good': { et: 'H\u00e4sti koostatud pilveteenus leping, enamik DORA n\u00f5udeid kaetud.', en: 'Well-drafted cloud service contract, most DORA requirements covered.' },
  'contract.sample_medium': { et: 'T\u00fc\u00fcpiline IT hooldusleping, mitu olulist puudust.', en: 'Typical IT maintenance contract, several significant gaps.' },
  'contract.sample_weak': { et: 'Minimaalne serverimajutuse leping, enamik n\u00f5udeid puudu.', en: 'Minimal server hosting contract, most requirements missing.' },
};

@Injectable({ providedIn: 'root' })
export class LangService {
  private langSignal = signal<Lang>((localStorage.getItem('dora_lang') as Lang) || 'et');

  lang = this.langSignal.asReadonly();

  get currentLang(): Lang {
    return this.langSignal();
  }

  toggle() {
    const next: Lang = this.langSignal() === 'et' ? 'en' : 'et';
    this.langSignal.set(next);
    localStorage.setItem('dora_lang', next);
  }

  t(key: string): string {
    const entry = TRANSLATIONS[key];
    if (!entry) return key;
    return entry[this.langSignal()] || entry['et'] || key;
  }
}
