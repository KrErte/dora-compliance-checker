import { Injectable, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ApiService } from './api.service';

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, unknown>) => void;
    };
  }
}

export type TrackingEventType =
  | 'PAGE_VIEW'
  | 'CTA_CLICK'
  | 'PROMO_VIEW'
  | 'REGISTER_CLICK'
  | 'SCROLL_DEPTH'
  | 'CLICK'
  | 'TIME_ON_PAGE'
  | 'FORM_FIELD_FOCUS'
  | 'FORM_FIELD_BLUR'
  | 'FORM_SUBMIT'
  | 'FORM_ABANDON';

interface EventData {
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class TrackingService implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private sessionId: string;
  private utmParams: { source?: string; medium?: string; campaign?: string } = {};

  // Scroll tracking
  private scrollMilestones = [25, 50, 75, 100];
  private reachedMilestones = new Set<number>();
  private scrollListener: (() => void) | null = null;

  // Time on page tracking
  private timeOnPageInterval: ReturnType<typeof setInterval> | null = null;
  private pageLoadTime = Date.now();
  private totalTimeOnPage = 0;

  // Click tracking
  private clickListener: ((e: MouseEvent) => void) | null = null;

  // Form tracking
  private formFields = new Map<string, { touched: boolean; filled: boolean; timeSpent: number; focusTime?: number }>();
  private activeFormId: string | null = null;

  constructor(private apiService: ApiService) {
    if (this.isBrowser) {
      this.sessionId = this.getOrCreateSessionId();
      this.parseUtmParams();
    } else {
      this.sessionId = '';
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private cleanup(): void {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
      this.scrollListener = null;
    }
    if (this.timeOnPageInterval) {
      clearInterval(this.timeOnPageInterval);
      this.timeOnPageInterval = null;
    }
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener, true);
      this.clickListener = null;
    }
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

  // ============================================
  // CORE TRACKING METHOD - sends to both backends
  // ============================================

  trackEvent(eventType: TrackingEventType, eventData?: EventData): void {
    if (!this.isBrowser) return;
    const pageUrl = window.location.pathname;

    // Send to custom backend
    const event = {
      eventType,
      pageUrl,
      utmSource: this.utmParams.source,
      utmMedium: this.utmParams.medium,
      utmCampaign: this.utmParams.campaign,
      sessionId: this.sessionId,
      eventData: eventData ? JSON.stringify(eventData) : undefined
    };

    this.apiService.trackEvent(event).subscribe({
      next: () => {},
      error: () => {} // Silently fail
    });

    // Send to Umami
    if (window.umami?.track) {
      try {
        window.umami.track(eventType, {
          ...eventData,
          page: pageUrl,
          session: this.sessionId
        });
      } catch (e) {
        // Silently fail
      }
    }
  }

  // ============================================
  // PAGE VIEW TRACKING
  // ============================================

  trackPageView(pageUrl?: string): void {
    this.trackEvent('PAGE_VIEW', { url: pageUrl || window.location.pathname });
  }

  // ============================================
  // SCROLL DEPTH TRACKING
  // ============================================

  initScrollTracking(): void {
    if (!this.isBrowser || this.scrollListener) return;

    this.reachedMilestones.clear();

    this.scrollListener = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

      for (const milestone of this.scrollMilestones) {
        if (scrollPercent >= milestone && !this.reachedMilestones.has(milestone)) {
          this.reachedMilestones.add(milestone);
          this.trackEvent('SCROLL_DEPTH', {
            depth: milestone,
            scrollPercent,
            viewportHeight: window.innerHeight,
            documentHeight: document.documentElement.scrollHeight
          });
        }
      }
    };

    window.addEventListener('scroll', this.scrollListener, { passive: true });

    // Check initial scroll position
    setTimeout(() => this.scrollListener?.(), 100);
  }

  // ============================================
  // CLICK TRACKING
  // ============================================

  initClickTracking(): void {
    if (!this.isBrowser || this.clickListener) return;

    this.clickListener = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Find clickable element (button, link, or element with click handler)
      const clickable = target.closest('a, button, [role="button"], [onclick], .cta-button, [routerLink]');
      if (!clickable) return;

      const elementType = clickable.tagName.toLowerCase();
      const elementText = this.getElementText(clickable as HTMLElement);
      const elementId = clickable.id || undefined;
      const elementClass = clickable.className || undefined;
      const href = (clickable as HTMLAnchorElement).href || (clickable as HTMLElement).getAttribute('routerLink') || undefined;

      // Get position info
      const rect = clickable.getBoundingClientRect();
      const position = {
        x: Math.round(e.clientX),
        y: Math.round(e.clientY),
        elementX: Math.round(rect.left),
        elementY: Math.round(rect.top),
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      };

      this.trackEvent('CLICK', {
        elementType,
        elementText: elementText.substring(0, 100), // Limit text length
        elementId,
        elementClass: elementClass?.substring(0, 200),
        href,
        position
      });
    };

    document.addEventListener('click', this.clickListener, true);
  }

  private getElementText(element: HTMLElement): string {
    // Try to get meaningful text from the element
    const text = element.innerText || element.textContent || '';
    const ariaLabel = element.getAttribute('aria-label') || '';
    const title = element.getAttribute('title') || '';
    const alt = (element as HTMLImageElement).alt || '';

    return (text || ariaLabel || title || alt).trim().replace(/\s+/g, ' ');
  }

  // ============================================
  // TIME ON PAGE TRACKING
  // ============================================

  initTimeOnPageTracking(intervalSeconds = 30): void {
    if (!this.isBrowser || this.timeOnPageInterval) return;

    this.pageLoadTime = Date.now();
    this.totalTimeOnPage = 0;

    this.timeOnPageInterval = setInterval(() => {
      this.totalTimeOnPage += intervalSeconds;
      this.trackEvent('TIME_ON_PAGE', {
        seconds: this.totalTimeOnPage,
        totalSeconds: Math.round((Date.now() - this.pageLoadTime) / 1000),
        page: window.location.pathname
      });
    }, intervalSeconds * 1000);

    // Track when user leaves the page
    window.addEventListener('beforeunload', () => {
      const finalTime = Math.round((Date.now() - this.pageLoadTime) / 1000);
      this.trackEvent('TIME_ON_PAGE', {
        seconds: finalTime,
        totalSeconds: finalTime,
        page: window.location.pathname,
        final: true
      });
    });
  }

  // ============================================
  // FORM INTERACTION TRACKING
  // ============================================

  initFormTracking(formId?: string): void {
    if (!this.isBrowser) return;
    this.activeFormId = formId || 'default';
    this.formFields.clear();

    // Use event delegation on document
    document.addEventListener('focusin', (e) => this.handleFormFocus(e));
    document.addEventListener('focusout', (e) => this.handleFormBlur(e));
    document.addEventListener('submit', (e) => this.handleFormSubmit(e));

    // Track form abandonment on page unload
    window.addEventListener('beforeunload', () => this.handleFormAbandon());
  }

  private handleFormFocus(e: FocusEvent): void {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (!this.isFormField(target)) return;

    const fieldId = this.getFieldId(target);
    const fieldData = this.formFields.get(fieldId) || { touched: false, filled: false, timeSpent: 0 };

    fieldData.touched = true;
    fieldData.focusTime = Date.now();
    this.formFields.set(fieldId, fieldData);

    this.trackEvent('FORM_FIELD_FOCUS', {
      fieldId,
      fieldType: target.type || target.tagName.toLowerCase(),
      fieldName: target.name || undefined,
      formId: this.activeFormId
    });
  }

  private handleFormBlur(e: FocusEvent): void {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (!this.isFormField(target)) return;

    const fieldId = this.getFieldId(target);
    const fieldData = this.formFields.get(fieldId);

    if (fieldData) {
      // Calculate time spent on field
      if (fieldData.focusTime) {
        fieldData.timeSpent += Math.round((Date.now() - fieldData.focusTime) / 1000);
        fieldData.focusTime = undefined;
      }

      // Check if field has value
      fieldData.filled = this.hasFieldValue(target);
      this.formFields.set(fieldId, fieldData);

      this.trackEvent('FORM_FIELD_BLUR', {
        fieldId,
        fieldType: target.type || target.tagName.toLowerCase(),
        fieldName: target.name || undefined,
        filled: fieldData.filled,
        timeSpent: fieldData.timeSpent,
        formId: this.activeFormId
      });
    }
  }

  private handleFormSubmit(e: Event): void {
    const form = e.target as HTMLFormElement;
    if (!form || form.tagName !== 'FORM') return;

    const formData = this.getFormSummary();

    this.trackEvent('FORM_SUBMIT', {
      formId: this.activeFormId,
      fieldsTotal: formData.total,
      fieldsFilled: formData.filled,
      fieldsTouched: formData.touched,
      totalTimeSpent: formData.totalTimeSpent,
      completionRate: formData.total > 0 ? Math.round((formData.filled / formData.total) * 100) : 0
    });

    // Clear form tracking after submit
    this.formFields.clear();
  }

  private handleFormAbandon(): void {
    if (this.formFields.size === 0) return;

    const formData = this.getFormSummary();

    // Only track abandon if user interacted with form but didn't submit
    if (formData.touched > 0 && formData.filled < formData.total) {
      this.trackEvent('FORM_ABANDON', {
        formId: this.activeFormId,
        fieldsTotal: formData.total,
        fieldsFilled: formData.filled,
        fieldsTouched: formData.touched,
        totalTimeSpent: formData.totalTimeSpent,
        lastFieldTouched: this.getLastTouchedField(),
        completionRate: formData.total > 0 ? Math.round((formData.filled / formData.total) * 100) : 0
      });
    }
  }

  private isFormField(element: EventTarget | null): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
    if (!element || !(element instanceof HTMLElement)) return false;
    const tagName = element.tagName.toLowerCase();
    return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
  }

  private getFieldId(field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): string {
    return field.id || field.name || `${field.tagName}_${field.type || 'field'}`;
  }

  private hasFieldValue(field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): boolean {
    if (field instanceof HTMLInputElement) {
      if (field.type === 'checkbox' || field.type === 'radio') {
        return field.checked;
      }
      return field.value.trim().length > 0;
    }
    return field.value.trim().length > 0;
  }

  private getFormSummary(): { total: number; filled: number; touched: number; totalTimeSpent: number } {
    let filled = 0;
    let touched = 0;
    let totalTimeSpent = 0;

    this.formFields.forEach((data) => {
      if (data.touched) touched++;
      if (data.filled) filled++;
      totalTimeSpent += data.timeSpent;
    });

    return {
      total: this.formFields.size,
      filled,
      touched,
      totalTimeSpent
    };
  }

  private getLastTouchedField(): string | undefined {
    let lastField: string | undefined;
    this.formFields.forEach((data, fieldId) => {
      if (data.touched) lastField = fieldId;
    });
    return lastField;
  }

  // ============================================
  // CONVENIENCE METHODS
  // ============================================

  trackCtaClick(ctaName?: string): void {
    this.trackEvent('CTA_CLICK', { cta: ctaName || 'unknown', page: window.location.pathname });
  }

  trackPromoView(): void {
    this.trackEvent('PROMO_VIEW', { page: window.location.pathname });
  }

  trackRegisterClick(): void {
    this.trackEvent('REGISTER_CLICK', { page: window.location.pathname });
  }

  // ============================================
  // INITIALIZATION - call this on app startup
  // ============================================

  initAllTracking(): void {
    this.initScrollTracking();
    this.initClickTracking();
    this.initTimeOnPageTracking(30);
    this.initFormTracking();
  }
}
