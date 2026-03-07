import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DoraQuestion, AssessmentRequest, AssessmentResult, ContractAnalysisResult, NegotiationResult, NegotiationMessageResult, MonitoredContract, ContractAlert, RegulatoryUpdate, IncidentReport, IncidentStats, RemediationItem, RemediationStats, Organization, OrgMember, OrgInvite, EvidenceItem, EvidenceStats, EvidenceCoverage, ComplianceAlert, NotificationItem, GapAnalysisResult, SupportedArticle, ComplianceProfile, UserAlert, AlertDetail } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = '/api';

  constructor(private http: HttpClient) {}

  getQuestions(): Observable<DoraQuestion[]> {
    return this.http.get<DoraQuestion[]>(`${this.baseUrl}/questions`);
  }

  submitAssessment(request: AssessmentRequest): Observable<AssessmentResult> {
    return this.http.post<AssessmentResult>(`${this.baseUrl}/assessments`, request);
  }

  getAssessment(id: string): Observable<AssessmentResult> {
    return this.http.get<AssessmentResult>(`${this.baseUrl}/assessments/${id}`);
  }

  analyzeContract(file: File, companyName: string, contractName: string): Observable<ContractAnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('companyName', companyName);
    formData.append('contractName', contractName);
    return this.http.post<ContractAnalysisResult>(`${this.baseUrl}/contracts/analyze`, formData);
  }

  getContractAnalysis(id: string): Observable<ContractAnalysisResult> {
    return this.http.get<ContractAnalysisResult>(`${this.baseUrl}/contracts/${id}`);
  }

  getSampleContract(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/sample/sample-pdf`, { responseType: 'blob' });
  }

  exportAssessmentPdf(id: string): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/exports/pdf/assessment/${id}`, {}, { responseType: 'blob' });
  }

  exportContractPdf(id: string): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/exports/pdf/contract/${id}`, {}, { responseType: 'blob' });
  }

  exportIncidentPdf(id: string): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/exports/pdf/incident/${id}`, {}, { responseType: 'blob' });
  }

  exportAssessmentExcel(id: string): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/exports/excel/assessment/${id}`, {}, { responseType: 'blob' });
  }

  exportProfessionalReport(id: string, language: string): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/exports/report/assessment/${id}?language=${language}`, {}, { responseType: 'blob' });
  }

  exportContractExcel(id: string): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/exports/excel/contract/${id}`, {}, { responseType: 'blob' });
  }

  // Negotiations
  createNegotiation(contractAnalysisId: string, vendorType: string): Observable<NegotiationResult> {
    return this.http.post<NegotiationResult>(`${this.baseUrl}/negotiations`, { contractAnalysisId, vendorType });
  }

  getNegotiations(): Observable<NegotiationResult[]> {
    return this.http.get<NegotiationResult[]>(`${this.baseUrl}/negotiations`);
  }

  getNegotiation(id: string): Observable<NegotiationResult> {
    return this.http.get<NegotiationResult>(`${this.baseUrl}/negotiations/${id}`);
  }

  generateStrategy(negotiationId: string): Observable<NegotiationResult> {
    return this.http.post<NegotiationResult>(`${this.baseUrl}/negotiations/${negotiationId}/generate-strategy`, {});
  }

  generateEmail(negotiationId: string): Observable<NegotiationMessageResult> {
    return this.http.post<NegotiationMessageResult>(`${this.baseUrl}/negotiations/${negotiationId}/generate-email`, {});
  }

  generateItemEmail(itemId: string): Observable<NegotiationMessageResult> {
    return this.http.post<NegotiationMessageResult>(`${this.baseUrl}/negotiations/items/${itemId}/generate-email`, {});
  }

  updateItemStatus(itemId: string, status: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/negotiations/items/${itemId}/status`, { status });
  }

  addNegotiationMessage(negotiationId: string, body: any): Observable<NegotiationMessageResult> {
    return this.http.post<NegotiationMessageResult>(`${this.baseUrl}/negotiations/${negotiationId}/messages`, body);
  }

  // Guardian
  startMonitoring(contractAnalysisId: string, contractText: string): Observable<MonitoredContract> {
    return this.http.post<MonitoredContract>(`${this.baseUrl}/guardian/monitor`, { contractAnalysisId, contractText });
  }

  getMonitoredContracts(): Observable<MonitoredContract[]> {
    return this.http.get<MonitoredContract[]>(`${this.baseUrl}/guardian/contracts`);
  }

  pauseMonitoring(id: string): Observable<MonitoredContract> {
    return this.http.put<MonitoredContract>(`${this.baseUrl}/guardian/contracts/${id}/pause`, {});
  }

  resumeMonitoring(id: string): Observable<MonitoredContract> {
    return this.http.put<MonitoredContract>(`${this.baseUrl}/guardian/contracts/${id}/resume`, {});
  }

  reanalyzeContract(id: string): Observable<MonitoredContract> {
    return this.http.post<MonitoredContract>(`${this.baseUrl}/guardian/contracts/${id}/reanalyze`, {});
  }

  getAlerts(): Observable<ContractAlert[]> {
    return this.http.get<ContractAlert[]>(`${this.baseUrl}/guardian/alerts`);
  }

  getAlertCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/guardian/alerts/count`);
  }

  markAlertRead(id: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/guardian/alerts/${id}/read`, {});
  }

  getRegulatoryUpdates(): Observable<RegulatoryUpdate[]> {
    return this.http.get<RegulatoryUpdate[]>(`${this.baseUrl}/guardian/regulatory-updates`);
  }

  addRegulatoryUpdate(body: any): Observable<RegulatoryUpdate> {
    return this.http.post<RegulatoryUpdate>(`${this.baseUrl}/guardian/regulatory-updates`, body);
  }

  // ICT Providers (Supply Chain)
  getIctProviders(): Observable<IctProvider[]> {
    return this.http.get<IctProvider[]>(`${this.baseUrl}/ict-providers`);
  }

  getIctProviderStats(): Observable<{ total: number; highRisk: number }> {
    return this.http.get<{ total: number; highRisk: number }>(`${this.baseUrl}/ict-providers/stats`);
  }

  createIctProvider(provider: CreateIctProviderRequest): Observable<IctProvider> {
    return this.http.post<IctProvider>(`${this.baseUrl}/ict-providers`, provider);
  }

  createIctProvidersBatch(providers: CreateIctProviderRequest[]): Observable<{ imported: number; providers: IctProvider[] }> {
    return this.http.post<{ imported: number; providers: IctProvider[] }>(`${this.baseUrl}/ict-providers/batch`, providers);
  }

  categorizeIctProvider(id: string, criticality: string, reason: string): Observable<IctProvider> {
    return this.http.put<IctProvider>(`${this.baseUrl}/ict-providers/${id}/categorize`, { criticality, reason });
  }

  deleteIctProvider(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.baseUrl}/ict-providers/${id}`);
  }

  // Contact
  submitContact(data: { name: string; email: string; reason?: string; message: string }): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/contact`, data);
  }

  // Usage Stats
  getUsageStats(): Observable<{ totalAssessments: number; totalScopeChecks: number; totalUsers: number }> {
    return this.http.get<{ totalAssessments: number; totalScopeChecks: number; totalUsers: number }>(`${this.baseUrl}/stats/usage`);
  }

  // Public Stats
  getPublicStats(): Observable<{
    userCount: number;
    assessmentCount: number;
    contractAnalysisCount: number;
    totalChecks: number;
  }> {
    return this.http.get<{
      userCount: number;
      assessmentCount: number;
      contractAnalysisCount: number;
      totalChecks: number;
    }>(`${this.baseUrl}/stats/public`);
  }

  // Email Subscription
  subscribeForChecklist(email: string): Observable<{ message: string; status: string }> {
    return this.http.post<{ message: string; status: string }>(`${this.baseUrl}/subscribe/checklist`, { email });
  }

  // Tracking
  trackEvent(event: {
    eventType: string;
    pageUrl?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    sessionId?: string;
    eventData?: string; // JSON string with additional event data
  }): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/public/track`, event);
  }

  // Benchmarks
  getAssessmentBenchmark(score: number): Observable<BenchmarkData> {
    return this.http.get<BenchmarkData>(`${this.baseUrl}/benchmarks/assessment/${score}`);
  }

  getContractBenchmark(score: number): Observable<BenchmarkData> {
    return this.http.get<BenchmarkData>(`${this.baseUrl}/benchmarks/contract/${score}`);
  }

  // RoI xBRL-CSV Export
  exportRoiXbrlCsv(companyName: string, leiCode?: string): Observable<Blob> {
    const params: any = { companyName };
    if (leiCode) params.leiCode = leiCode;
    return this.http.get(`${this.baseUrl}/roi/export/xbrl-csv`, { params, responseType: 'blob' });
  }

  getRoiCompleteness(): Observable<RoiCompleteness> {
    return this.http.get<RoiCompleteness>(`${this.baseUrl}/roi/completeness`);
  }

  // Incident Reporting (DORA Art. 19)
  createIncident(data: any): Observable<IncidentReport> {
    return this.http.post<IncidentReport>(`${this.baseUrl}/incidents`, data);
  }

  getIncidents(): Observable<IncidentReport[]> {
    return this.http.get<IncidentReport[]>(`${this.baseUrl}/incidents`);
  }

  getIncident(id: string): Observable<IncidentReport> {
    return this.http.get<IncidentReport>(`${this.baseUrl}/incidents/${id}`);
  }

  updateIncident(id: string, data: any): Observable<IncidentReport> {
    return this.http.put<IncidentReport>(`${this.baseUrl}/incidents/${id}`, data);
  }

  classifyIncident(id: string): Observable<IncidentReport> {
    return this.http.post<IncidentReport>(`${this.baseUrl}/incidents/${id}/classify`, {});
  }

  submitInitialReport(id: string, data: any): Observable<IncidentReport> {
    return this.http.post<IncidentReport>(`${this.baseUrl}/incidents/${id}/initial-report`, data);
  }

  submitIntermediateReport(id: string, data: any): Observable<IncidentReport> {
    return this.http.post<IncidentReport>(`${this.baseUrl}/incidents/${id}/intermediate-report`, data);
  }

  submitFinalReport(id: string, data: any): Observable<IncidentReport> {
    return this.http.post<IncidentReport>(`${this.baseUrl}/incidents/${id}/final-report`, data);
  }

  resolveIncident(id: string, data: any): Observable<IncidentReport> {
    return this.http.post<IncidentReport>(`${this.baseUrl}/incidents/${id}/resolve`, data);
  }

  closeIncident(id: string): Observable<IncidentReport> {
    return this.http.post<IncidentReport>(`${this.baseUrl}/incidents/${id}/close`, {});
  }

  getIncidentStats(): Observable<IncidentStats> {
    return this.http.get<IncidentStats>(`${this.baseUrl}/incidents/stats`);
  }

  // Remediation Tracker
  createRemediation(data: any): Observable<RemediationItem> {
    return this.http.post<RemediationItem>(`${this.baseUrl}/remediation`, data);
  }

  getRemediations(): Observable<RemediationItem[]> {
    return this.http.get<RemediationItem[]>(`${this.baseUrl}/remediation`);
  }

  updateRemediation(id: string, data: any): Observable<RemediationItem> {
    return this.http.put<RemediationItem>(`${this.baseUrl}/remediation/${id}`, data);
  }

  deleteRemediation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/remediation/${id}`);
  }

  getRemediationStats(): Observable<RemediationStats> {
    return this.http.get<RemediationStats>(`${this.baseUrl}/remediation/stats`);
  }

  // ─── Organizations ──────────────────────────────────
  createOrganization(data: { name: string; description?: string }): Observable<Organization> {
    return this.http.post<Organization>(`${this.baseUrl}/organizations`, data);
  }
  getOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(`${this.baseUrl}/organizations`);
  }
  getOrganization(orgId: string): Observable<Organization> {
    return this.http.get<Organization>(`${this.baseUrl}/organizations/${orgId}`);
  }
  updateOrganization(orgId: string, data: { name: string; description?: string }): Observable<Organization> {
    return this.http.put<Organization>(`${this.baseUrl}/organizations/${orgId}`, data);
  }
  deleteOrganization(orgId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/organizations/${orgId}`);
  }
  getOrgMembers(orgId: string): Observable<OrgMember[]> {
    return this.http.get<OrgMember[]>(`${this.baseUrl}/organizations/${orgId}/members`);
  }
  inviteToOrg(orgId: string, data: { email: string; role?: string }): Observable<OrgInvite> {
    return this.http.post<OrgInvite>(`${this.baseUrl}/organizations/${orgId}/invite`, data);
  }
  getOrgInvites(orgId: string): Observable<OrgInvite[]> {
    return this.http.get<OrgInvite[]>(`${this.baseUrl}/organizations/${orgId}/invites`);
  }
  cancelOrgInvite(orgId: string, inviteId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/organizations/${orgId}/invites/${inviteId}`);
  }
  acceptOrgInvite(token: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/organizations/invites/${token}/accept`, {});
  }
  getMyOrgInvites(): Observable<OrgInvite[]> {
    return this.http.get<OrgInvite[]>(`${this.baseUrl}/organizations/my-invites`);
  }
  updateMemberRole(orgId: string, memberId: string, role: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/organizations/${orgId}/members/${memberId}/role`, { role });
  }
  removeOrgMember(orgId: string, memberId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/organizations/${orgId}/members/${memberId}`);
  }
  leaveOrganization(orgId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/organizations/${orgId}/leave`, {});
  }

  // ─── SSO Config ─────────────────────────────────────
  getSsoConfigs(orgId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/organizations/${orgId}/sso`);
  }
  createSsoConfig(orgId: string, config: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/organizations/${orgId}/sso`, config);
  }
  updateSsoConfig(orgId: string, configId: string, config: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/organizations/${orgId}/sso/${configId}`, config);
  }
  deleteSsoConfig(orgId: string, configId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/organizations/${orgId}/sso/${configId}`);
  }

  // Evidence Vault
  uploadEvidence(formData: FormData): Observable<EvidenceItem> {
    return this.http.post<EvidenceItem>(`${this.baseUrl}/evidence`, formData);
  }
  getEvidence(params?: { pillar?: string; status?: string }): Observable<EvidenceItem[]> {
    let url = `${this.baseUrl}/evidence`;
    const qp: string[] = [];
    if (params?.pillar) qp.push(`pillar=${params.pillar}`);
    if (params?.status) qp.push(`status=${params.status}`);
    if (qp.length) url += '?' + qp.join('&');
    return this.http.get<EvidenceItem[]>(url);
  }
  getEvidenceById(id: string): Observable<EvidenceItem> {
    return this.http.get<EvidenceItem>(`${this.baseUrl}/evidence/${id}`);
  }
  updateEvidence(id: string, data: any): Observable<EvidenceItem> {
    return this.http.put<EvidenceItem>(`${this.baseUrl}/evidence/${id}`, data);
  }
  deleteEvidence(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/evidence/${id}`);
  }
  verifyEvidence(id: string, verifiedBy: string): Observable<EvidenceItem> {
    return this.http.post<EvidenceItem>(`${this.baseUrl}/evidence/${id}/verify`, { verifiedBy });
  }
  uploadEvidenceVersion(id: string, formData: FormData): Observable<EvidenceItem> {
    return this.http.post<EvidenceItem>(`${this.baseUrl}/evidence/${id}/version`, formData);
  }
  downloadEvidence(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/evidence/${id}/download`, { responseType: 'blob' });
  }
  getEvidenceStats(): Observable<EvidenceStats> {
    return this.http.get<EvidenceStats>(`${this.baseUrl}/evidence/stats`);
  }
  getEvidenceCoverage(): Observable<EvidenceCoverage> {
    return this.http.get<EvidenceCoverage>(`${this.baseUrl}/evidence/coverage`);
  }
  exportEvidenceZip(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/evidence/export`, { responseType: 'blob' });
  }

  // Gap Analysis (Evidence Gap Analyzer)
  analyzeGap(file: File, documentTitle: string, documentCategory: string, articleNumbers: string[]): Observable<GapAnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentTitle', documentTitle);
    formData.append('documentCategory', documentCategory);
    formData.append('articleNumbers', articleNumbers.join(','));
    return this.http.post<GapAnalysisResult>(`${this.baseUrl}/gap-analysis/analyze`, formData);
  }
  getGapAnalysisHistory(): Observable<GapAnalysisResult[]> {
    return this.http.get<GapAnalysisResult[]>(`${this.baseUrl}/gap-analysis`);
  }
  getGapAnalysis(id: string): Observable<GapAnalysisResult> {
    return this.http.get<GapAnalysisResult>(`${this.baseUrl}/gap-analysis/${id}`);
  }
  getSupportedGapArticles(): Observable<SupportedArticle[]> {
    return this.http.get<SupportedArticle[]>(`${this.baseUrl}/gap-analysis/supported-articles`);
  }
  linkGapToEvidence(id: string, evidenceId: string): Observable<GapAnalysisResult> {
    const formData = new FormData();
    formData.append('evidenceId', evidenceId);
    return this.http.post<GapAnalysisResult>(`${this.baseUrl}/gap-analysis/${id}/link-evidence`, formData);
  }
  syncGapToTracker(id: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/gap-analysis/${id}/sync-tracker`, {});
  }

  exportGapAnalysisPdf(id: string): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/exports/pdf/gap-analysis/${id}`, {}, { responseType: 'blob' });
  }

  // Audit Readiness
  getAuditReadiness(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/audit-readiness`);
  }

  // Notifications & Compliance Alerts
  getNotifications(): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>(`${this.baseUrl}/notifications`);
  }
  getUnreadNotifications(): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>(`${this.baseUrl}/notifications/unread`);
  }
  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/notifications/count`);
  }
  markNotificationRead(id: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/notifications/${id}/read`, {});
  }
  markAllNotificationsRead(): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/notifications/read-all`, {});
  }
  getComplianceAlerts(): Observable<ComplianceAlert[]> {
    return this.http.get<ComplianceAlert[]>(`${this.baseUrl}/notifications/alerts`);
  }
  getComplianceAlertCounts(): Observable<{ critical: number; warning: number; info: number; total: number }> {
    return this.http.get<{ critical: number; warning: number; info: number; total: number }>(`${this.baseUrl}/notifications/alerts/count`);
  }

  // Compliance Alert Profile
  getComplianceProfile(): Observable<ComplianceProfile> {
    return this.http.get<ComplianceProfile>(`${this.baseUrl}/v1/compliance-profile`);
  }
  hasComplianceProfile(): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(`${this.baseUrl}/v1/compliance-profile/exists`);
  }
  saveComplianceProfile(data: any): Observable<ComplianceProfile> {
    return this.http.post<ComplianceProfile>(`${this.baseUrl}/v1/compliance-profile`, data);
  }
  deleteComplianceProfile(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/v1/compliance-profile`);
  }

  // Regulatory Alert Feed
  getUserAlerts(): Observable<UserAlert[]> {
    return this.http.get<UserAlert[]>(`${this.baseUrl}/v1/alerts`);
  }
  getUnreadAlertCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/v1/alerts/unread-count`);
  }
  markAlertAsRead(id: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/v1/alerts/${id}/read`, {});
  }
  markAllAlertsRead(): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/v1/alerts/read-all`, {});
  }
  getAlertDetail(id: string): Observable<AlertDetail> {
    return this.http.get<AlertDetail>(`${this.baseUrl}/v1/alerts/${id}`);
  }

  // Compliance Activity Timeline
  getActivityTimeline(limit: number = 50): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/activity?limit=${limit}`);
  }
  getActivityStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/activity/stats`);
  }
}

export interface BenchmarkData {
  industryAverage: number;
  median: number;
  percentile25?: number;
  percentile75?: number;
  minScore?: number;
  maxScore?: number;
  totalAssessments?: number;
  totalAnalyses?: number;
  percentileRank: number;
  complianceLevelDistribution?: { [key: string]: number };
  industryBenchmarks?: { [key: string]: { average: number; label: string } };
}

export interface IctProvider {
  id: string;
  providerName: string;
  providerCountry?: string;
  countryCode?: string;
  serviceType: string;
  criticality?: string;
  riskScore?: number;
  contractNumber?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  hasExitStrategy?: boolean;
  exitStrategyDescription?: string;
  subcontractingInfo?: string;
  createdAt: string;
}

export interface RoiCompleteness {
  totalProviders: number;
  completedFields: number;
  totalFields: number;
  percentage: number;
  providers: {
    id: string;
    name: string;
    completeness: number;
    missingFields: string[];
  }[];
}

export interface CreateIctProviderRequest {
  name: string;
  country?: string;
  countryCode?: string;
  type?: string;
  criticality?: string;
  contractNumber?: string;
  contractStart?: string;
  contractEnd?: string;
  riskScore?: number;
  hasExitStrategy?: boolean;
  exitStrategyDescription?: string;
  subcontractors?: string;
}
