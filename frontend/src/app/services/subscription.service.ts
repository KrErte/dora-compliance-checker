import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, take, catchError, of } from 'rxjs';

export type SubscriptionPlan = 'FREE' | 'PROFESSIONAL' | 'STANDARD' | 'ENTERPRISE';

export type PremiumFeature =
  | 'PDF_EXPORT'
  | 'EXCEL_EXPORT'
  | 'XBRL_EXPORT'
  | 'CERTIFICATE'
  | 'AI_REWRITER'
  | 'ACTION_PLAN_PDF'
  | 'ROI_EXPORT'
  | 'PROFESSIONAL_REPORT'
  | 'COMPLIANCE_REPORT'
  | 'AI_POLICY_WRITER';

export interface SubscriptionStatus {
  plan: SubscriptionPlan;
  isPremium: boolean;
  validUntil: string | null;
  trialEndsAt: string | null;
  features: Record<PremiumFeature, boolean>;
}

export interface FeatureCheckResult {
  hasAccess: boolean;
  message?: string;
  upgradeUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private readonly STORAGE_KEY = 'dora_subscription';
  private readonly SESSION_KEY = 'dora_session_id';

  private status = signal<SubscriptionStatus>({
    plan: 'FREE',
    isPremium: false,
    validUntil: null,
    trialEndsAt: null,
    features: {
      PDF_EXPORT: false,
      EXCEL_EXPORT: false,
      XBRL_EXPORT: false,
      CERTIFICATE: false,
      AI_REWRITER: false,
      ACTION_PLAN_PDF: false,
      ROI_EXPORT: false,
      PROFESSIONAL_REPORT: false,
      COMPLIANCE_REPORT: false,
      AI_POLICY_WRITER: false
    }
  });

  private upgradeModalVisible = signal(false);
  private upgradeModalFeature = signal<PremiumFeature | null>(null);

  // Public signals
  currentStatus = this.status.asReadonly();
  isPremium = computed(() => this.status().isPremium);
  currentPlan = computed(() => this.status().plan);
  showUpgradeModal = this.upgradeModalVisible.asReadonly();
  upgradeFeature = this.upgradeModalFeature.asReadonly();

  trialEndsAt = computed(() => this.status().trialEndsAt);
  isTrialActive = computed(() => {
    const t = this.status().trialEndsAt;
    return t != null && new Date(t) > new Date() && this.status().plan === 'PROFESSIONAL';
  });
  trialDaysLeft = computed(() => {
    const t = this.status().trialEndsAt;
    if (!t) return 0;
    const diff = new Date(t).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  });

  constructor(private http: HttpClient) {
    if (this.isBrowser) {
      this.ensureSessionId();
      this.loadFromStorage();
      this.refreshStatus();
    }
  }

  /**
   * Whether the email gate should be shown (only for FREE users).
   * STANDARD and ENTERPRISE subscribers skip the email gate.
   */
  shouldShowEmailGate(): boolean {
    return this.status().plan === 'FREE' && !this.isPremium() && !this.isTrialActive();
  }

  /**
   * Check if user can access a specific feature
   */
  canAccess(feature: PremiumFeature): boolean {
    return this.status().features[feature] ?? false;
  }

  /**
   * Show upgrade modal for a specific feature
   */
  showUpgrade(feature: PremiumFeature): void {
    this.upgradeModalFeature.set(feature);
    this.upgradeModalVisible.set(true);
    this.trackPaywallEvent('paywall_shown', feature);
  }

  /**
   * Close upgrade modal
   */
  closeUpgradeModal(): void {
    const feature = this.upgradeModalFeature();
    this.upgradeModalVisible.set(false);
    this.upgradeModalFeature.set(null);
    this.trackPaywallEvent('paywall_dismissed', feature);
  }

  /**
   * Called when user clicks upgrade button in modal
   */
  onUpgradeClick(): void {
    const feature = this.upgradeModalFeature();
    this.trackPaywallEvent('paywall_upgrade_clicked', feature);
    this.upgradeModalVisible.set(false);
    this.upgradeModalFeature.set(null);
  }

  /**
   * Verify checkout and activate subscription
   */
  verifyCheckout(sessionId: string, productType: string = 'standard'): Observable<any> {
    return this.http.post('/api/subscription/verify', {
      checkoutId: sessionId,
      productType
    }, { headers: this.getHeaders() }).pipe(
      tap(() => {
        this.refreshStatus();
      })
    );
  }

  /**
   * Refresh subscription status from backend
   */
  refreshStatus(): void {
    this.http.get<SubscriptionStatus>('/api/subscription/status', {
      headers: this.getHeaders()
    }).pipe(
      take(1),
      catchError(() => of({
        plan: 'FREE' as SubscriptionPlan,
        isPremium: false,
        validUntil: null,
        trialEndsAt: null,
        features: {
          PDF_EXPORT: false,
          EXCEL_EXPORT: false,
          XBRL_EXPORT: false,
          CERTIFICATE: false,
          AI_REWRITER: false,
          ACTION_PLAN_PDF: false,
          ROI_EXPORT: false,
          PROFESSIONAL_REPORT: false,
          COMPLIANCE_REPORT: false,
          AI_POLICY_WRITER: false
        }
      }))
    ).subscribe(status => {
      this.status.set(status);
      this.saveToStorage(status);
    });
  }

  /**
   * Get session ID for anonymous users
   */
  getSessionId(): string {
    return this.isBrowser ? (localStorage.getItem(this.SESSION_KEY) || '') : '';
  }

  /**
   * Get feature-specific upgrade message
   */
  getUpgradeMessage(feature: PremiumFeature): { title: string; description: string; price: string } {
    const messages: Record<PremiumFeature, { title: string; description: string; price: string }> = {
      PDF_EXPORT: {
        title: 'Lae alla professionaalne PDF raport',
        description: 'Lae alla professionaalne PDF raport juhatusele esitamiseks',
        price: 'Alates €29/kuu'
      },
      EXCEL_EXPORT: {
        title: 'Ekspordi Excelisse',
        description: 'Ekspordi kõik andmed Excelisse edasise analüüsi jaoks',
        price: 'Alates €29/kuu'
      },
      XBRL_EXPORT: {
        title: 'xBRL-CSV eksport',
        description: 'Ekspordi register regulaatorile esitamiseks EBA nõutud formaadis',
        price: '€79/kuu'
      },
      CERTIFICATE: {
        title: 'Vastavustunnistus',
        description: 'Lae alla vastavustunnistus oma partneritele esitamiseks',
        price: 'Alates €29/kuu'
      },
      AI_REWRITER: {
        title: 'AI klauslite ümbersõnastaja',
        description: 'Kasuta AI-d lepinguklauslite automaatseks DORA-vastavusse viimiseks',
        price: '€79/kuu'
      },
      ACTION_PLAN_PDF: {
        title: 'Tegevuskava PDF',
        description: 'Lae alla detailne FAAS tegevuskava PDF-formaadis',
        price: 'Alates €29/kuu'
      },
      ROI_EXPORT: {
        title: 'Register of Information eksport',
        description: 'Ekspordi ICT pakkujate register EBA nõutud formaadis (CSV/PDF)',
        price: '€499/kuu (Enterprise)'
      },
      PROFESSIONAL_REPORT: {
        title: 'Professionaalne DORA raport',
        description: 'Genereeri regulaatorile valmis 10-15 lk raport koos tegevuskava, 5 samba analüüsi ja metoodikaga',
        price: 'Alates €29/kuu'
      },
      COMPLIANCE_REPORT: {
        title: 'DORA vastavusraport',
        description: 'Genereeri terviklik PDF vastavusraport kõigi moodulite andmetega juhatusele ja auditoritele',
        price: 'Alates €29/kuu'
      },
      AI_POLICY_WRITER: {
        title: 'AI poliitikakirjutaja',
        description: 'Genereeri professionaalsed, ettevõttespetsiifilised DORA poliitikaadokumendid AI abil',
        price: '€79/kuu'
      }
    };
    return messages[feature];
  }

  /**
   * Check if we have a legacy payment hint in localStorage.
   * This is only used to trigger a server-side verification — not for granting access.
   */
  hasLegacyPaymentHint(): boolean {
    return false;
  }

  private ensureSessionId(): void {
    if (!this.isBrowser) return;
    if (!localStorage.getItem(this.SESSION_KEY)) {
      const sessionId = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem(this.SESSION_KEY, sessionId);
    }
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const sessionId = this.getSessionId();
    if (sessionId) {
      headers = headers.set('X-Session-Id', sessionId);
    }
    // userId is derived from JWT on the backend — no need to send X-User-Id header
    return headers;
  }

  private loadFromStorage(): void {
    if (!this.isBrowser) return;
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const status = JSON.parse(stored) as SubscriptionStatus;
        this.status.set(status);
      } catch {}
    }

  }

  private saveToStorage(status: SubscriptionStatus): void {
    if (!this.isBrowser) return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(status));
  }

  private trackPaywallEvent(event: string, feature: PremiumFeature | null): void {
    if (!this.isBrowser) return;
    // Track conversion events
    this.http.post('/api/public/track', {
      eventType: event,
      pageUrl: window.location.href,
      sessionId: this.getSessionId(),
      eventData: JSON.stringify({ feature })
    }).subscribe({
      error: (e: unknown) => console.warn('Paywall tracking failed:', e)
    });
  }
}
