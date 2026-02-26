import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  accountTier: string;
  authProvider: string;
  createdAt: string;
  earlyAdopter: boolean;
  trialEndsAt: string;
}

export interface LeadCompany {
  id: string;
  companyName: string;
  registryCode: string;
  country: string;
  licenseType: string;
  regulatoryBody: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  doraApplicable: boolean;
  nis2Applicable: boolean;
  sector: string;
  companySize: string;
  linkedinUrl: string;
  ctoName: string;
  ctoLinkedin: string;
  complianceOfficerName: string;
  complianceOfficerLinkedin: string;
  leadStatus: string;
  lastContactedAt: string;
  notes: string;
  sourceUrl: string;
  scrapedAt: string;
  lastVerifiedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadPage {
  content: LeadCompany[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface LeadStats {
  total: number;
  byCountry: { EE: number; LV: number; LT: number };
  byStatus: { NEW: number; CONTACTED: number; QUALIFIED: number; CONVERTED: number };
}

@Injectable({ providedIn: 'root' })
export class AdminService {

  constructor(private http: HttpClient) {}

  // --- Users ---
  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>('/api/admin/users');
  }

  updateUser(userId: string, updates: { accountTier?: string; role?: string }): Observable<any> {
    return this.http.put(`/api/admin/users/${userId}`, updates);
  }

  // --- Leads ---
  getLeads(filters: {
    country?: string; licenseType?: string; leadStatus?: string;
    sector?: string; search?: string; page?: number; size?: number;
    sortBy?: string; sortDir?: string;
  }): Observable<LeadPage> {
    let params = new HttpParams();
    if (filters.country) params = params.set('country', filters.country);
    if (filters.licenseType) params = params.set('licenseType', filters.licenseType);
    if (filters.leadStatus) params = params.set('leadStatus', filters.leadStatus);
    if (filters.sector) params = params.set('sector', filters.sector);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.page != null) params = params.set('page', filters.page.toString());
    if (filters.size != null) params = params.set('size', filters.size.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortDir) params = params.set('sortDir', filters.sortDir);
    return this.http.get<LeadPage>('/api/admin/leads', { params });
  }

  getLead(id: string): Observable<LeadCompany> {
    return this.http.get<LeadCompany>(`/api/admin/leads/${id}`);
  }

  updateLead(id: string, updates: Partial<LeadCompany>): Observable<LeadCompany> {
    return this.http.put<LeadCompany>(`/api/admin/leads/${id}`, updates);
  }

  getLeadStats(): Observable<LeadStats> {
    return this.http.get<LeadStats>('/api/admin/leads/stats');
  }

  exportLeadsCsv(filters: {
    country?: string; licenseType?: string; leadStatus?: string;
    sector?: string; search?: string;
  }): Observable<Blob> {
    let params = new HttpParams();
    if (filters.country) params = params.set('country', filters.country);
    if (filters.licenseType) params = params.set('licenseType', filters.licenseType);
    if (filters.leadStatus) params = params.set('leadStatus', filters.leadStatus);
    if (filters.sector) params = params.set('sector', filters.sector);
    if (filters.search) params = params.set('search', filters.search);
    return this.http.get('/api/admin/leads/export/csv', { params, responseType: 'blob' });
  }

  // --- Crawler ---
  runLeadCrawler(): Observable<any> {
    return this.http.post('/api/admin/crawler/leads/run', {});
  }

  runLeadCrawlerSource(source: string): Observable<any> {
    return this.http.post(`/api/admin/crawler/leads/run/${source}`, {});
  }
}
