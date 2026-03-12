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
  answers: { [questionId: number]: string };
}

export interface QuestionResult {
  questionId: number;
  question: string;
  complianceStatus: string;
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
  partialCount: number;
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

// ─── Incident Reporting (DORA Art. 19) ──────────────────────────────

export interface IncidentReport {
  id: string;
  userId: string;
  incidentTitle: string;
  incidentType: 'CYBERATTACK' | 'SYSTEM_FAILURE' | 'DATA_BREACH' | 'THIRD_PARTY_FAILURE' | 'NATURAL_DISASTER' | 'OTHER';
  description: string;
  severityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  isMajor: boolean;
  clientsAffected?: number;
  transactionsAffected?: number;
  geographicalSpread?: string;
  dataLossType?: string;
  criticalServicesAffected?: string;
  economicImpact?: number;
  durationMinutes?: number;
  reputationalImpact?: string;
  reportingStatus: 'DRAFT' | 'DETECTED' | 'INITIAL_SENT' | 'INTERMEDIATE_SENT' | 'FINAL_SENT' | 'CLOSED';
  detectedAt: string;
  classifiedAt?: string;
  initialReportDueAt?: string;
  initialReportSentAt?: string;
  intermediateReportDueAt?: string;
  intermediateReportSentAt?: string;
  finalReportDueAt?: string;
  finalReportSentAt?: string;
  resolvedAt?: string;
  initialReportJson?: string;
  intermediateReportJson?: string;
  finalReportJson?: string;
  rootCause?: string;
  remediationActions?: string;
  lessonsLearned?: string;
  competentAuthority?: string;
  reportingContactName?: string;
  reportingContactEmail?: string;
  // War Room fields
  warRoomActive?: boolean;
  warRoomRoles?: string;
  communicationLog?: string;
  decisionLog?: string;
  warRoomPhase?: string;
  warRoomStartedAt?: string;
  warRoomClosedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface IncidentStats {
  total: number;
  major: number;
  open: number;
  closed: number;
  overdue: number;
}

// ─── Remediation Tracker ────────────────────────────────────────────

export interface RemediationItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  source: 'ASSESSMENT' | 'CONTRACT_ANALYSIS' | 'INCIDENT' | 'MANUAL';
  sourceId?: string;
  pillar: string;
  articleReference?: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'DEFERRED';
  assignee?: string;
  dueDate?: string;
  completedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RemediationStats {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  deferred: number;
}

// ─── Evidence Vault ─────────────────────────────────────────────────

export interface EvidenceItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  pillar: string;
  fileName: string;
  storedFileName: string;
  fileSize: number;
  mimeType: string;
  fileHash?: string;
  version: number;
  previousVersionId?: string;
  status: 'PENDING' | 'VERIFIED' | 'EXPIRED';
  expiryDate?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  articleNumbers?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceStats {
  total: number;
  pending: number;
  verified: number;
  expired: number;
}

export interface EvidenceCoverage {
  articles: { [key: number]: number };
  covered: number;
  total: number;
  percentage: number;
}

// ─── Organization / Team ────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  description?: string;
  createdAt: string;
}

export interface OrgMember {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

export interface OrgInvite {
  id: string;
  organizationId: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  createdAt: string;
  expiresAt: string;
}

// ─── Notifications & Compliance Alerts ──────────────────────────────

export interface ComplianceAlert {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  category: string;
  alertKey: string;
  title: string;
  message: string;
  link: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string;
  severity: string;
  read: boolean;
  createdAt: string;
}

// ─── Gap Analysis (Evidence Gap Analyzer) ───────────────────────────

export interface GapFinding {
  requirementId: number;
  articleNumber: string;
  subRequirementEt: string;
  subRequirementEn: string;
  status: 'found' | 'partial' | 'missing';
  quoteFromDocument: string;
  recommendationEt: string;
  recommendationEn: string;
  doraReference: string;
}

export interface GapAnalysisResult {
  id: string;
  userId: string;
  documentTitle: string;
  fileName: string;
  documentCategory: string;
  articleNumbers: string;
  analysisDate: string;
  totalRequirements: number;
  foundCount: number;
  missingCount: number;
  partialCount: number;
  scorePercentage: number;
  complianceLevel: 'GREEN' | 'YELLOW' | 'RED';
  summaryEt: string;
  summaryEn: string;
  findings: GapFinding[];
  linkedEvidenceId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SupportedArticle {
  articleNumber: string;
  requirementCount: number;
  firstReference: string;
  nameEt: string;
  nameEn: string;
}

// ─── Compliance Alert Profile ────────────────────────────────────────

export type CompanyType = 'BANK' | 'FINTECH' | 'INSURANCE' | 'INVESTMENT_FIRM' | 'ICT_PROVIDER' | 'OTHER';
export type AlertFrequency = 'REALTIME' | 'DAILY' | 'WEEKLY';

export interface ComplianceProfile {
  id: string;
  companyType: CompanyType;
  country: string;
  regulations: string[];
  alertFrequency: AlertFrequency;
  alertEmail: boolean;
  alertDashboard: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ─── Regulatory Alert Feed ───────────────────────────────────────────

export interface UserAlert {
  id: string;
  regulatoryUpdateId: string;
  title: string;
  message: string;
  source: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface AlertDetail extends UserAlert {
  impactAnalysis: string;
  url: string;
  regulations: string;
  companyTypes: string;
  countries: string;
  affectedArticles: string;
  relevanceScore: number;
  publishedDate: string;
}

// ─── DORA 5 Pillars: shared category mapping ───────────────────────

export const PILLAR_CATEGORIES: { [pillarId: string]: string[] } = {
  ICT_RISK_MANAGEMENT: ['ICT_RISK_MANAGEMENT'],
  INCIDENT_MANAGEMENT: ['INCIDENT_MANAGEMENT'],
  TESTING:             ['TESTING'],
  THIRD_PARTY:         ['SERVICE_LEVEL', 'EXIT_STRATEGY', 'AUDIT', 'INCIDENT',
                        'DATA', 'SUBCONTRACTING', 'RISK', 'LEGAL', 'CONTINUITY'],
  INFORMATION_SHARING: ['INFORMATION_SHARING']
};

export interface PillarScore {
  id: string;
  percentage: number;
}

/**
 * Calculate per-pillar scores from question results.
 * Uses same scoring as buildCategoryStats: yes=1, partial=0.5, no=0.
 */
export function calculatePillarScores(questionResults: QuestionResult[]): PillarScore[] {
  return Object.entries(PILLAR_CATEGORIES).map(([pillarId, categories]) => {
    const questions = questionResults.filter(qr => categories.includes(qr.category));
    if (questions.length === 0) return { id: pillarId, percentage: 0 };
    const score = questions.reduce((sum, qr) => {
      if (qr.complianceStatus === 'yes') return sum + 1;
      if (qr.complianceStatus === 'partial') return sum + 0.5;
      return sum;
    }, 0);
    return { id: pillarId, percentage: (score / questions.length) * 100 };
  });
}

// ─── Category labels ────────────────────────────────────────────────

// ─── Autopilot (DORA Compliance Autopilot) ──────────────────────────

export interface AutopilotInsight {
  id: string;
  userId: string;
  insightType: 'EVIDENCE_GAP' | 'ASSESSMENT_DUE' | 'REMEDIATION_OVERDUE' | 'SCORE_DROP' | 'ARTICLE_RISK' | 'EXPIRING_EVIDENCE' | 'QUICK_WIN' | 'TRAINING_GAP';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  recommendedAction: string;
  actionType: 'CREATE_REMEDIATION' | 'RUN_ASSESSMENT' | 'UPLOAD_EVIDENCE' | 'VIEW_MODULE';
  actionLink: string;
  status: 'NEW' | 'ACCEPTED' | 'DISMISSED' | 'SNOOZED';
  snoozeUntil?: string;
  deduplicationKey: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutopilotCounts {
  total: number;
  new: number;
  critical: number;
  accepted: number;
}

export const CATEGORY_LABELS: { [key: string]: { et: string; en: string } } = {
  SERVICE_LEVEL: { et: 'Teenustaseme nõuded', en: 'Service Level Requirements' },
  EXIT_STRATEGY: { et: 'Väljumisstrateegia', en: 'Exit Strategy' },
  AUDIT: { et: 'Auditeerimine', en: 'Audit Rights' },
  INCIDENT: { et: 'Intsidentide haldus', en: 'Incident Management' },
  DATA: { et: 'Andmekaitse', en: 'Data Protection' },
  SUBCONTRACTING: { et: 'Allhankimine', en: 'Subcontracting' },
  RISK: { et: 'Riskihaldus', en: 'Risk Management' },
  LEGAL: { et: 'Õigusnõuded', en: 'Legal Requirements' },
  CONTINUITY: { et: 'Talitluspidevus', en: 'Business Continuity' },
  RECRUITMENT: { et: 'Värbamine ja personal (vabatahtlik)', en: 'Recruitment & Personnel (optional)' },
  FINANCIAL_REPORTING: { et: 'Finantsaruandlus (vabatahtlik)', en: 'Financial Reporting (optional)' },
  ICT_RISK_MANAGEMENT: { et: 'ICT riskihaldus', en: 'ICT Risk Management' },
  INCIDENT_MANAGEMENT: { et: 'Intsidentide haldus (laiendatud)', en: 'Incident Management (Extended)' },
  TESTING: { et: 'Testimine', en: 'Testing' },
  INFORMATION_SHARING: { et: 'Info jagamine', en: 'Information Sharing' }
};

// Bulk Import DTOs
export interface BulkImportValidationResult {
  headers: string[];
  totalRows: number;
  suggestedMapping: { [csvColumn: string]: string };
  templateFields: string[];
  preview: { [key: string]: string }[];
  parseErrors: string[];
  validationErrors: BulkImportError[];
  isValid: boolean;
}

export interface BulkImportRow {
  [key: string]: string;
}

export interface BulkImportRequest {
  entityType: string;
  rows: BulkImportRow[];
  mapping: { [csvColumn: string]: string };
}

export interface BulkImportResult {
  imported: number;
  skipped: number;
  total: number;
  errors: BulkImportError[];
}

export interface BulkImportError {
  row: number;
  column: string;
  message: string;
}
