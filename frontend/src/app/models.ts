export interface DoraQuestion {
  id: number;
  questionEt: string;
  questionEn: string;
  articleReference: string;
  explanation: string;
  recommendation: string;
  category: string;
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
  complianceLevel: 'GREEN' | 'YELLOW' | 'RED';
  questionResults: QuestionResult[];
}

export interface ContractFinding {
  requirementId: number;
  requirementEt: string;
  requirementEn: string;
  status: 'found' | 'missing' | 'partial';
  quote: string;
  recommendationEt: string;
  recommendationEn: string;
  doraReference: string;
}

export interface ContractAnalysisResult {
  id: string;
  companyName: string;
  contractName: string;
  fileName: string;
  analysisDate: string;
  totalRequirements: number;
  foundCount: number;
  missingCount: number;
  partialCount: number;
  scorePercentage: number;
  complianceLevel: 'GREEN' | 'YELLOW' | 'RED';
  summary: string;
  findings: ContractFinding[];
}

// Negotiation types
export interface NegotiationResult {
  id: string;
  contractAnalysisId: string;
  companyName: string;
  contractName: string;
  vendorType: string;
  overallStatus: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'STALLED';
  strategySummary: string;
  totalItems: number;
  resolvedItems: number;
  items: NegotiationItemResult[];
  createdAt: string;
  updatedAt: string;
}

export interface NegotiationItemResult {
  id: string;
  requirementId: number;
  articleReference: string;
  requirementText: string;
  gapSeverity: string;
  coverageStatus: string;
  strategy: string;
  suggestedClause: string;
  status: 'PENDING' | 'DRAFTED' | 'SENT' | 'RESPONDED' | 'AGREED' | 'REJECTED';
  priority: number;
  notes: string;
  messages: NegotiationMessageResult[];
}

export interface NegotiationMessageResult {
  id: string;
  messageType: string;
  direction: 'OUTBOUND' | 'INBOUND';
  subject: string;
  body: string;
  status: string;
  createdAt: string;
}

// Guardian types
export interface MonitoredContract {
  id: string;
  userId: string;
  contractAnalysisId: string;
  companyName: string;
  contractName: string;
  fileName: string;
  monitoringStatus: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  currentScore: number;
  currentLevel: 'GREEN' | 'YELLOW' | 'RED';
  lastAnalysisDate: string;
  lastAnalysisId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractAlert {
  id: string;
  userId: string;
  monitoredContractId: string;
  regulatoryUpdateId: string;
  alertType: 'SCORE_CHANGED' | 'NEW_REGULATION' | 'REANALYSIS_COMPLETE';
  title: string;
  message: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  read: boolean;
  previousScore: number;
  newScore: number;
  createdAt: string;
}

export interface RegulatoryUpdate {
  id: string;
  source: string;
  title: string;
  summary: string;
  url: string;
  publishedDate: string;
  relevanceScore: number;
  affectedArticles: string;
  status: 'NEW' | 'RELEVANT' | 'POTENTIALLY_RELEVANT' | 'NOT_RELEVANT';
  fetchedAt: string;
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
