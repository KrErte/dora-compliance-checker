import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DoraQuestion, AssessmentRequest, AssessmentResult, ContractAnalysisResult, NegotiationResult, NegotiationMessageResult, MonitoredContract, ContractAlert, RegulatoryUpdate } from './models';

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

  downloadContractReport(id: string) {
    window.print();
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
}
