import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BrandingService, BrandingSettings } from './branding.service';
import { Observable, of, map, catchError } from 'rxjs';

export interface PdfHeaderConfig {
  logoBase64: string | null;
  companyName: string;
  primaryColor: [number, number, number]; // RGB tuple
}

@Injectable({ providedIn: 'root' })
export class PdfBrandingHelper {
  private readonly DEFAULT_COMPANY = 'DoraAudit.eu';
  private readonly DEFAULT_COLOR: [number, number, number] = [34, 197, 94]; // Emerald green

  constructor(
    private brandingService: BrandingService,
    private http: HttpClient
  ) {}

  getHeaderConfig(): Observable<PdfHeaderConfig> {
    const settings = this.brandingService.getBrandingSnapshot();

    if (!settings.companyName && !settings.hasLogo && settings.primaryColorHex === '#22c55e') {
      return of({
        logoBase64: null,
        companyName: this.DEFAULT_COMPANY,
        primaryColor: this.DEFAULT_COLOR
      });
    }

    const config: PdfHeaderConfig = {
      logoBase64: null,
      companyName: settings.companyName || this.DEFAULT_COMPANY,
      primaryColor: this.hexToRgb(settings.primaryColorHex) || this.DEFAULT_COLOR
    };

    if (settings.hasLogo) {
      return this.fetchLogoAsBase64().pipe(
        map(base64 => ({ ...config, logoBase64: base64 })),
        catchError(() => of(config))
      );
    }

    return of(config);
  }

  getHeaderConfigSync(): PdfHeaderConfig {
    const settings = this.brandingService.getBrandingSnapshot();
    return {
      logoBase64: null,
      companyName: settings.companyName || this.DEFAULT_COMPANY,
      primaryColor: this.hexToRgb(settings.primaryColorHex) || this.DEFAULT_COLOR
    };
  }

  private fetchLogoAsBase64(): Observable<string> {
    return this.http.get('/api/branding/logo', { responseType: 'blob' }).pipe(
      map(blob => {
        // This will be resolved later through async conversion
        return URL.createObjectURL(blob);
      }),
      catchError(() => of(''))
    );
  }

  private hexToRgb(hex: string): [number, number, number] | null {
    if (!hex || !hex.match(/^#[0-9a-fA-F]{6}$/)) return null;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  }
}
