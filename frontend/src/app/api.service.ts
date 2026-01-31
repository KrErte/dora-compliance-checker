import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DoraQuestion, AssessmentRequest, AssessmentResult, ContractAnalysisResult } from './models';

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

  downloadReport(id: string): void {
    const url = `${this.baseUrl}/assessments/${id}/report`;
    this.http.get(url, { responseType: 'blob' }).subscribe(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `DORA_Aruanne_${id}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  analyzeContract(file: File, companyName: string, contractName: string): Observable<ContractAnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('companyName', companyName);
    formData.append('contractName', contractName);
    return this.http.post<ContractAnalysisResult>(`${this.baseUrl}/contract-analysis`, formData);
  }

  getContractAnalysis(id: string): Observable<ContractAnalysisResult> {
    return this.http.get<ContractAnalysisResult>(`${this.baseUrl}/contract-analysis/${id}`);
  }

  downloadContractReport(id: string): void {
    const url = `${this.baseUrl}/contract-analysis/${id}/report`;
    this.http.get(url, { responseType: 'blob' }).subscribe(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `DORA_Lepingu_Audit_${id}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }
}
