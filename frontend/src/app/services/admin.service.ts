import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

}
