export interface DoraQuestion {
  id: number;
  questionEt: string;
  questionEn: string;
  articleReference: string;
  explanation: string;
  recommendation: string;
  category: string;
  weight: number;
  severity: string;
  contractClauseEt: string;
}

export interface AssessmentRequest {
  companyName: string;
  contractName: string;
  answers: { [questionId: number]: boolean };
}

export interface QuestionResult {
  questionId: number;
  question: string;
  compliant: boolean;
  articleReference: string;
  explanation: string;
  recommendation: string;
  category: string;
  weight: number;
  severity: string;
}

export interface CategoryMaturity {
  category: string;
  categoryLabel: string;
  maturityLevel: number;
  maturityLabel: string;
  compliancePercent: number;
  totalQuestions: number;
  compliantQuestions: number;
}

export interface ContractClause {
  questionId: number;
  articleReference: string;
  category: string;
  clauseTextEt: string;
  severity: string;
  priority: number;
}

export interface AssessmentResult {
  id: string;
  companyName: string;
  contractName: string;
  assessmentDate: string;
  totalQuestions: number;
  compliantCount: number;
  nonCompliantCount: number;
  scorePercentage: number;
  weightedScorePercentage: number;
  complianceLevel: 'GREEN' | 'YELLOW' | 'RED';
  questionResults: QuestionResult[];
  categoryMaturity: CategoryMaturity[];
  missingClauses: ContractClause[];
  estimatedPenaltyRiskPercent: number;
}

export const CATEGORY_LABELS: { [key: string]: string } = {
  SERVICE_LEVEL: 'Teenustaseme nõuded',
  EXIT_STRATEGY: 'Väljumisstrateegia',
  AUDIT: 'Auditeerimine',
  INCIDENT: 'Intsidentide haldus',
  DATA: 'Andmekaitse',
  SUBCONTRACTING: 'Allhankimine',
  RISK: 'Riskihaldus',
  LEGAL: 'Õigusnõuded',
  CONTINUITY: 'Talitluspidevus',
  RECRUITMENT: 'Värbamine ja personal',
  FINANCIAL_REPORTING: 'Finantsaruandlus',
  ICT_RISK_MANAGEMENT: 'ICT riskihaldus',
  INCIDENT_MANAGEMENT: 'Intsidentide haldus (laiendatud)',
  TESTING: 'Testimine',
  INFORMATION_SHARING: 'Info jagamine'
};
