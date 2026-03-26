export interface ParsedDocument {
  fileName: string;
  fileType: 'pdf' | 'xlsx' | 'csv' | 'docx' | 'txt';
  totalPages: number;
  pages: PageContent[];
  extractedText: string;
  extractedAt: Date;
}

export interface PageContent {
  pageNumber: number;
  text: string;
}

export interface SheetContent {
  sheetName: string;
  text: string;
  rowCount: number;
}

export interface DoraCheck {
  article: string;
  title: string;
  keywords: string[];
  requiredElements: string[];
  found: boolean;
  gaps: string[];
}

export interface DoraComplianceResult {
  documentName: string;
  analyzedAt: Date;
  overallScore: number;
  summary: {
    total: number;
    passed: number;
    partial: number;
    failed: number;
  };
  checks: DoraCheck[];
  recommendations: string[];
}

export interface AiAnalysisResult {
  summary: string;
  detailedFindings: AiDetailedFinding[];
  overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendations: string[];
}

export interface AiDetailedFinding {
  article: string;
  title: string;
  status: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT';
  finding: string;
  recommendation: string;
}

export enum DoraAnalysisType {
  GAP_ANALYSIS = 'GAP_ANALYSIS',
  ROI_VALIDATION = 'ROI_VALIDATION',
  ICT_RISK_REVIEW = 'ICT_RISK_REVIEW',
  INCIDENT_REPORT_CHECK = 'INCIDENT_REPORT_CHECK',
  THIRD_PARTY_CONTRACT_REVIEW = 'THIRD_PARTY_CONTRACT_REVIEW',
  GENERAL = 'GENERAL'
}
