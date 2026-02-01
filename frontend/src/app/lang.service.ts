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

  // Contract Analysis
  'nav.contract': { et: 'Lepingu audit', en: 'Contract Audit' },
  'contract.title': { et: 'Lepingu anal\u00fc\u00fcs', en: 'Contract Analysis' },
  'contract.subtitle': { et: 'DORA Art. 30 n\u00f5uete kontroll Claude AI abil', en: 'DORA Art. 30 compliance check with Claude AI' },
  'contract.upload_label': { et: 'Lae \u00fcles leping (PDF v\u00f5i DOCX)', en: 'Upload contract (PDF or DOCX)' },
  'contract.upload_hint': { et: 'Maksimaalselt 10 MB', en: 'Maximum 10 MB' },
  'contract.company_name': { et: 'Ettev\u00f5tte nimi', en: 'Company Name' },
  'contract.contract_name': { et: 'Lepingu nimetus', en: 'Contract Name' },
  'contract.analyze': { et: 'Anal\u00fc\u00fcsi lepingut', en: 'Analyze Contract' },
  'contract.analyzing': { et: 'Anal\u00fc\u00fcsin lepingut...', en: 'Analyzing contract...' },
  'contract.ai_note': { et: 'Claude AI anal\u00fc\u00fcsib lepingut DORA Art. 30 n\u00f5uete vastu. See v\u00f5ib v\u00f5tta kuni 1 minut.', en: 'Claude AI is analyzing the contract against DORA Art. 30 requirements. This may take up to 1 minute.' },
  'contract.results': { et: 'Anal\u00fc\u00fcsi tulemused', en: 'Analysis Results' },
  'contract.score': { et: 'Vastavusskoor', en: 'Compliance Score' },
  'contract.found': { et: 'Leitud', en: 'Found' },
  'contract.missing': { et: 'Puudu', en: 'Missing' },
  'contract.partial': { et: 'Osaliselt', en: 'Partial' },
  'contract.quote': { et: 'Tsitaat lepingust', en: 'Quote from contract' },
  'contract.recommendation': { et: 'Soovitus', en: 'Recommendation' },
  'contract.new_analysis': { et: 'Uus anal\u00fc\u00fcs', en: 'New Analysis' },
  'contract.drag_drop': { et: 'Lohista fail siia v\u00f5i kliki valimiseks', en: 'Drag file here or click to select' },
  'contract.file_selected': { et: 'Fail valitud', en: 'File selected' },
  'contract.error': { et: 'Anal\u00fc\u00fcs eba\u00f5nnestus. Palun proovige uuesti.', en: 'Analysis failed. Please try again.' },
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
