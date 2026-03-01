import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IntegrationConfig {
  id: string;
  userId: string;
  type: 'SLACK' | 'TEAMS' | 'WEBHOOK' | 'EMAIL';
  name: string;
  webhookUrl: string;
  enabled: boolean;
  events: string; // JSON array
  createdAt: string;
  lastTriggeredAt: string | null;
}

export interface EventType {
  code: string;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class IntegrationService {
  private baseUrl = '/api/integrations';

  constructor(private http: HttpClient) {}

  list(): Observable<IntegrationConfig[]> {
    return this.http.get<IntegrationConfig[]>(this.baseUrl);
  }

  create(data: Partial<IntegrationConfig>): Observable<IntegrationConfig> {
    return this.http.post<IntegrationConfig>(this.baseUrl, data);
  }

  update(id: string, data: Partial<IntegrationConfig>): Observable<IntegrationConfig> {
    return this.http.put<IntegrationConfig>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  test(id: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/test`, {});
  }

  getEventTypes(): Observable<EventType[]> {
    return this.http.get<EventType[]>(`${this.baseUrl}/events`);
  }
}
