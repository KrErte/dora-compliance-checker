import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

export type TrackingEventType = 'PAGE_VIEW' | 'CTA_CLICK' | 'PROMO_VIEW' | 'REGISTER_CLICK' | 'SCROLL_DEPTH';

@Injectable({ providedIn: 'root' })
export class TrackingService {
  private sessionId: string;
  private utmParams: { source?: string; medium?: string; campaign?: string } = {};

  constructor(private apiService: ApiService) {
    this.sessionId = this.getOrCreateSessionId();
    this.parseUtmParams();
  }

  private getOrCreateSessionId(): string {
    const key = 'dora_session_id';
    let sessionId = sessionStorage.getItem(key);
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem(key, sessionId);
    }
    return sessionId;
  }

  private generateSessionId(): string {
    return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
  }

  private parseUtmParams(): void {
    const urlParams = new URLSearchParams(window.location.search);
    this.utmParams = {
      source: urlParams.get('utm_source') || undefined,
      medium: urlParams.get('utm_medium') || undefined,
      campaign: urlParams.get('utm_campaign') || undefined
    };

    // Store UTM params in session storage for later page views
    if (this.utmParams.source || this.utmParams.medium || this.utmParams.campaign) {
      sessionStorage.setItem('dora_utm', JSON.stringify(this.utmParams));
    } else {
      const stored = sessionStorage.getItem('dora_utm');
      if (stored) {
        try {
          this.utmParams = JSON.parse(stored);
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }

  trackEvent(eventType: TrackingEventType, additionalData?: { pageUrl?: string }): void {
    const event = {
      eventType,
      pageUrl: additionalData?.pageUrl || window.location.pathname,
      utmSource: this.utmParams.source,
      utmMedium: this.utmParams.medium,
      utmCampaign: this.utmParams.campaign,
      sessionId: this.sessionId
    };

    this.apiService.trackEvent(event).subscribe({
      next: () => {},
      error: () => {} // Silently fail - tracking should not break the app
    });
  }

  trackPageView(pageUrl?: string): void {
    this.trackEvent('PAGE_VIEW', { pageUrl });
  }

  trackCtaClick(ctaName?: string): void {
    this.trackEvent('CTA_CLICK', { pageUrl: ctaName || window.location.pathname });
  }

  trackPromoView(): void {
    this.trackEvent('PROMO_VIEW');
  }

  trackRegisterClick(): void {
    this.trackEvent('REGISTER_CLICK');
  }
}
