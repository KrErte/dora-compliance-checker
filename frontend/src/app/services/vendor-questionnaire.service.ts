import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VendorQuestionnaire {
  id: string;
  userId: string;
  providerId: string | null;
  vendorName: string;
  vendorEmail: string;
  token: string;
  status: 'PENDING' | 'SUBMITTED' | 'REVIEWED';
  questions: string; // JSON
  responses: string | null; // JSON
  createdAt: string;
  submittedAt: string | null;
  expiresAt: string;
  riskScore: number | null;
}

export interface QuestionnaireQuestion {
  id: string;
  category: string;
  text: string;
  weight: number;
  type: string;
  options: string[];
}

export interface PublicQuestionnaire {
  status: string;
  vendorName: string;
  questions?: string; // JSON string
  submittedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class VendorQuestionnaireService {
  private baseUrl = '/api/vendor-questionnaires';

  constructor(private http: HttpClient) {}

  list(): Observable<VendorQuestionnaire[]> {
    return this.http.get<VendorQuestionnaire[]>(this.baseUrl);
  }

  get(id: string): Observable<VendorQuestionnaire> {
    return this.http.get<VendorQuestionnaire>(`${this.baseUrl}/${id}`);
  }

  create(data: { vendorName: string; vendorEmail: string; providerId?: string }): Observable<VendorQuestionnaire> {
    return this.http.post<VendorQuestionnaire>(this.baseUrl, data);
  }

  resend(id: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/resend`, {});
  }

  markReviewed(id: string): Observable<VendorQuestionnaire> {
    return this.http.post<VendorQuestionnaire>(`${this.baseUrl}/${id}/review`, {});
  }

  stats(): Observable<{ pending: number; submitted: number; reviewed: number }> {
    return this.http.get<any>(`${this.baseUrl}/stats`);
  }

  // Public (no auth)
  getPublic(token: string): Observable<PublicQuestionnaire> {
    return this.http.get<PublicQuestionnaire>(`/api/public/vendor-questionnaire/${token}`);
  }

  submitPublic(token: string, responses: string): Observable<any> {
    return this.http.post(`/api/public/vendor-questionnaire/${token}`, { responses });
  }
}
