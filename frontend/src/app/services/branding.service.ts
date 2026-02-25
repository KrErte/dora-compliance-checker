import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';

export interface BrandingSettings {
  companyName: string;
  primaryColorHex: string;
  hasLogo: boolean;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class BrandingService {
  private settings = signal<BrandingSettings>({
    companyName: '',
    primaryColorHex: '#22c55e',
    hasLogo: false
  });

  currentSettings = this.settings.asReadonly();
  hasCustomBranding = computed(() => {
    const s = this.settings();
    return s.companyName !== '' || s.hasLogo || s.primaryColorHex !== '#22c55e';
  });

  constructor(private http: HttpClient) {}

  loadBranding(): Observable<BrandingSettings> {
    return this.http.get<BrandingSettings>('/api/branding').pipe(
      tap(settings => this.settings.set(settings)),
      catchError(() => {
        const defaults: BrandingSettings = { companyName: '', primaryColorHex: '#22c55e', hasLogo: false };
        this.settings.set(defaults);
        return of(defaults);
      })
    );
  }

  updateBranding(companyName: string, primaryColorHex: string): Observable<BrandingSettings> {
    return this.http.put<BrandingSettings>('/api/branding', { companyName, primaryColorHex }).pipe(
      tap(settings => this.settings.set(settings))
    );
  }

  uploadLogo(file: File): Observable<{ success: boolean; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ success: boolean; message: string }>('/api/branding/logo', formData).pipe(
      tap(() => this.loadBranding().subscribe())
    );
  }

  deleteLogo(): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>('/api/branding/logo').pipe(
      tap(() => this.loadBranding().subscribe())
    );
  }

  getLogoUrl(): string {
    return '/api/branding/logo';
  }

  getBrandingSnapshot(): BrandingSettings {
    return this.settings();
  }
}
