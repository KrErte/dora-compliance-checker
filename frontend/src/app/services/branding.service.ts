import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, switchMap, map, catchError, of } from 'rxjs';

export interface BrandingSettings {
  companyName: string;
  primaryColorHex: string;
  accentColorHex?: string;
  hasLogo: boolean;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class BrandingService {
  private settings = signal<BrandingSettings>({
    companyName: '',
    primaryColorHex: '#22c55e',
    accentColorHex: '#06b6d4',
    hasLogo: false
  });

  currentSettings = this.settings.asReadonly();
  hasCustomBranding = computed(() => {
    const s = this.settings();
    return s.companyName !== '' || s.hasLogo || s.primaryColorHex !== '#22c55e';
  });

  // Computed signals for individual branding properties
  companyName = computed(() => this.settings().companyName);
  primaryColor = computed(() => this.settings().primaryColorHex);
  accentColor = computed(() => this.settings().accentColorHex || '#06b6d4');
  logoPath = computed(() => this.settings().hasLogo ? '/api/branding/logo' : '');

  constructor(private http: HttpClient) {}

  loadBranding(): Observable<BrandingSettings> {
    return this.http.get<BrandingSettings>('/api/branding').pipe(
      tap(settings => {
        this.settings.set(settings);
        this.applyBranding();
      }),
      catchError(() => {
        const defaults: BrandingSettings = { companyName: '', primaryColorHex: '#22c55e', accentColorHex: '#06b6d4', hasLogo: false };
        this.settings.set(defaults);
        this.applyBranding();
        return of(defaults);
      })
    );
  }

  updateBranding(companyName: string, primaryColorHex: string): Observable<BrandingSettings> {
    return this.http.put<BrandingSettings>('/api/branding', { companyName, primaryColorHex }).pipe(
      tap(settings => {
        this.settings.set(settings);
        this.applyBranding();
      })
    );
  }

  uploadLogo(file: File): Observable<{ success: boolean; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ success: boolean; message: string }>('/api/branding/logo', formData).pipe(
      switchMap(res => this.loadBranding().pipe(map(() => res)))
    );
  }

  deleteLogo(): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>('/api/branding/logo').pipe(
      switchMap(res => this.loadBranding().pipe(map(() => res)))
    );
  }

  getLogoUrl(): string {
    return '/api/branding/logo';
  }

  getLogoBlob(): Observable<Blob> {
    return this.http.get('/api/branding/logo', { responseType: 'blob' });
  }

  getBrandingSnapshot(): BrandingSettings {
    return this.settings();
  }

  /** Apply branding CSS custom properties to :root for global theming */
  applyBranding(): void {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', this.primaryColor());
    root.style.setProperty('--brand-accent', this.accentColor());
  }
}
