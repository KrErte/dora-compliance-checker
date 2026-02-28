import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { SubscriptionService, SubscriptionStatus } from './subscription.service';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(SubscriptionService);
    httpMock = TestBed.inject(HttpTestingController);

    // Flush the automatic refreshStatus() call from the constructor
    const req = httpMock.expectOne('/api/subscription/status');
    req.flush({
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
        ROI_EXPORT: false
      }
    } as SubscriptionStatus);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should start with FREE plan', () => {
    expect(service.currentPlan()).toBe('FREE');
    expect(service.isPremium()).toBeFalse();
  });

  it('canAccess returns false for FREE user', () => {
    expect(service.canAccess('PDF_EXPORT')).toBeFalse();
    expect(service.canAccess('EXCEL_EXPORT')).toBeFalse();
    expect(service.canAccess('XBRL_EXPORT')).toBeFalse();
  });

  it('refreshStatus updates signals from backend', () => {
    service.refreshStatus();

    const req = httpMock.expectOne('/api/subscription/status');
    req.flush({
      plan: 'STANDARD',
      isPremium: true,
      validUntil: '2027-01-01',
      trialEndsAt: null,
      features: {
        PDF_EXPORT: true,
        EXCEL_EXPORT: true,
        XBRL_EXPORT: false,
        CERTIFICATE: true,
        AI_REWRITER: false,
        ACTION_PLAN_PDF: true,
        ROI_EXPORT: false
      }
    } as SubscriptionStatus);

    expect(service.currentPlan()).toBe('STANDARD');
    expect(service.isPremium()).toBeTrue();
    expect(service.canAccess('PDF_EXPORT')).toBeTrue();
    expect(service.canAccess('XBRL_EXPORT')).toBeFalse();
  });

  it('refreshStatus falls back to FREE on error', () => {
    service.refreshStatus();

    const req = httpMock.expectOne('/api/subscription/status');
    req.error(new ProgressEvent('error'));

    expect(service.currentPlan()).toBe('FREE');
    expect(service.isPremium()).toBeFalse();
  });

  it('shouldShowEmailGate returns true for FREE non-trial users', () => {
    expect(service.shouldShowEmailGate()).toBeTrue();
  });

  it('shouldShowEmailGate returns false for premium users', () => {
    service.refreshStatus();
    const req = httpMock.expectOne('/api/subscription/status');
    req.flush({
      plan: 'STANDARD',
      isPremium: true,
      validUntil: null,
      trialEndsAt: null,
      features: { PDF_EXPORT: true, EXCEL_EXPORT: true, XBRL_EXPORT: false, CERTIFICATE: true, AI_REWRITER: false, ACTION_PLAN_PDF: true, ROI_EXPORT: false }
    });

    expect(service.shouldShowEmailGate()).toBeFalse();
  });

  it('showUpgrade sets modal state', () => {
    expect(service.showUpgradeModal()).toBeFalse();

    service.showUpgrade('PDF_EXPORT');

    // Flush tracking request
    const trackReq = httpMock.expectOne('/api/public/track');
    trackReq.flush({});

    expect(service.showUpgradeModal()).toBeTrue();
    expect(service.upgradeFeature()).toBe('PDF_EXPORT');
  });

  it('closeUpgradeModal resets modal state', () => {
    service.showUpgrade('EXCEL_EXPORT');
    httpMock.expectOne('/api/public/track').flush({});

    service.closeUpgradeModal();
    httpMock.expectOne('/api/public/track').flush({});

    expect(service.showUpgradeModal()).toBeFalse();
    expect(service.upgradeFeature()).toBeNull();
  });

  it('getSessionId creates and persists session ID', () => {
    const sessionId = service.getSessionId();
    expect(sessionId).toBeTruthy();
    expect(sessionId.startsWith('sess_')).toBeTrue();

    // Should return same on second call
    expect(service.getSessionId()).toBe(sessionId);
  });

  it('getUpgradeMessage returns correct message for each feature', () => {
    const pdfMsg = service.getUpgradeMessage('PDF_EXPORT');
    expect(pdfMsg.title).toBeTruthy();
    expect(pdfMsg.description).toBeTruthy();
    expect(pdfMsg.price).toBeTruthy();

    const xbrlMsg = service.getUpgradeMessage('XBRL_EXPORT');
    expect(xbrlMsg.title).toContain('xBRL');
  });

  it('trialDaysLeft computes correctly for active trial', () => {
    service.refreshStatus();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    const req = httpMock.expectOne('/api/subscription/status');
    req.flush({
      plan: 'PROFESSIONAL',
      isPremium: true,
      validUntil: null,
      trialEndsAt: futureDate.toISOString(),
      features: { PDF_EXPORT: true, EXCEL_EXPORT: true, XBRL_EXPORT: false, CERTIFICATE: true, AI_REWRITER: false, ACTION_PLAN_PDF: true, ROI_EXPORT: false }
    });

    expect(service.trialDaysLeft()).toBeGreaterThanOrEqual(9);
    expect(service.trialDaysLeft()).toBeLessThanOrEqual(11);
    expect(service.isTrialActive()).toBeTrue();
  });

  it('trialDaysLeft returns 0 when no trial', () => {
    expect(service.trialDaysLeft()).toBe(0);
    expect(service.isTrialActive()).toBeFalse();
  });

  it('hasLegacyPayment returns true when paymentCompleted exists', () => {
    localStorage.setItem('paymentCompleted', JSON.stringify({
      checkoutId: 'legacy-123',
      timestamp: new Date().toISOString()
    }));

    expect(service.hasLegacyPayment()).toBeTrue();
  });

  it('hasLegacyPayment returns false when no data', () => {
    expect(service.hasLegacyPayment()).toBeFalse();
  });
});
