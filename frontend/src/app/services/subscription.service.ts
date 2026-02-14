import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';

export type SubscriptionPlan = 'FREE' | 'STANDARD' | 'ENTERPRISE';

export type PremiumFeature =
  | 'PDF_EXPORT'
  | 'EXCEL_EXPORT'
  | 'XBRL_EXPORT'
  | 'CERTIFICATE'
  | 'AI_REWRITER'
  | 'ACTION_PLAN_PDF';

export interface SubscriptionStatus {
  plan: SubscriptionPlan;
  isPremium: boolean;
  validUntil: string | null;
  features: Record<PremiumFeature, boolean>;
}

export interface FeatureCheckResult {
  hasAccess: boolean;
  message?: string;
  upgradeUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly STORAGE_KEY = 'dora_subscription';
  private readonly SESSION_KEY = 'dora_session_id';

  private status = signal<SubscriptionStatus>({
    plan: 'FREE',
    isPremium: false,
    validUntil: null,
    features: {
      PDF_EXPORT: false,
      EXCEL_EXPORT: false,
      XBRL_EXPORT: false,
      CERTIFICATE: false,
      AI_REWRITER: false,
      ACTION_PLAN_PDF: false
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

  constructor(private http: HttpClient) {
    this.ensureSessionId();
    this.loadFromStorage();
    this.refreshStatus();
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
    this.upgradeModalVisible.set(false);
    this.upgradeModalFeature.set(null);
    this.trackPaywallEvent('paywall_dismissed', this.upgradeModalFeature());
  }

  /**
   * Called when user clicks upgrade button in modal
   */
  onUpgradeClick(): void {
    this.trackPaywallEvent('paywall_upgrade_clicked', this.upgradeModalFeature());
    this.closeUpgradeModal();
  }

  /**
   * Verify checkout and activate subscription
   */
  verifyCheckout(checkoutId: string, productType: string): Observable<any> {
    return this.http.post('/api/subscription/verify', {
      checkoutId,
      productType
    }, { headers: this.getHeaders() }).pipe(
      tap(() => {
        this.refreshStatus();
        this.savePaymentCompleted(checkoutId);
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
      catchError(() => of({
        plan: 'FREE' as SubscriptionPlan,
        isPremium: false,
        validUntil: null,
        features: {
          PDF_EXPORT: false,
          EXCEL_EXPORT: false,
          XBRL_EXPORT: false,
          CERTIFICATE: false,
          AI_REWRITER: false,
          ACTION_PLAN_PDF: false
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
    return localStorage.getItem(this.SESSION_KEY) || '';
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
      }
    };
    return messages[feature];
  }

  /**
   * Check if we have a legacy payment (before subscription system)
   */
  hasLegacyPayment(): boolean {
    const payment = localStorage.getItem('paymentCompleted');
    if (!payment) return false;
    try {
      const data = JSON.parse(payment);
      return !!data.checkoutId;
    } catch {
      return false;
    }
  }

  private ensureSessionId(): void {
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
    // Add user ID if logged in
    const userJson = localStorage.getItem('dora_user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user.userId) {
          headers = headers.set('X-User-Id', user.userId);
        }
      } catch {}
    }
    return headers;
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const status = JSON.parse(stored) as SubscriptionStatus;
        this.status.set(status);
      } catch {}
    }

    // Check legacy payment and migrate if needed
    if (this.hasLegacyPayment() && !this.isPremium()) {
      const payment = JSON.parse(localStorage.getItem('paymentCompleted') || '{}');
      this.verifyCheckout(payment.checkoutId, 'standard').subscribe();
    }
  }

  private saveToStorage(status: SubscriptionStatus): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(status));
  }

  private savePaymentCompleted(checkoutId: string): void {
    const data = {
      checkoutId,
      timestamp: new Date().toISOString(),
      products: ['subscription']
    };
    localStorage.setItem('paymentCompleted', JSON.stringify(data));
  }

  private trackPaywallEvent(event: string, feature: PremiumFeature | null): void {
    // Track conversion events
    this.http.post('/api/public/track', {
      eventType: event,
      pageUrl: window.location.href,
      sessionId: this.getSessionId(),
      eventData: JSON.stringify({ feature })
    }).subscribe();
  }
}
