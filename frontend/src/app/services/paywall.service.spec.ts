import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { PaywallService } from './paywall.service';
import { SubscriptionService } from './subscription.service';

describe('PaywallService', () => {
  let service: PaywallService;
  let mockSubscriptionService: jasmine.SpyObj<SubscriptionService>;

  beforeEach(() => {
    localStorage.clear();
    mockSubscriptionService = jasmine.createSpyObj('SubscriptionService', ['isPremium', 'hasLegacyPaymentHint']);
    mockSubscriptionService.isPremium.and.returnValue(false);
    mockSubscriptionService.hasLegacyPaymentHint.and.returnValue(false);

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: SubscriptionService, useValue: mockSubscriptionService }
      ]
    });
    service = TestBed.inject(PaywallService);
  });

  afterEach(() => localStorage.clear());

  it('hasAccess returns false when no payment data', () => {
    expect(service.hasAccess()).toBeFalse();
  });

  it('hasAccess returns true when subscription is premium', () => {
    mockSubscriptionService.isPremium.and.returnValue(true);
    expect(service.hasAccess()).toBeTrue();
  });

  it('hasAccess returns true when legacy payment hint exists', () => {
    mockSubscriptionService.hasLegacyPaymentHint.and.returnValue(true);
    expect(service.hasAccess()).toBeTrue();
  });

  it('hasAccess returns false when neither premium nor legacy hint', () => {
    mockSubscriptionService.isPremium.and.returnValue(false);
    mockSubscriptionService.hasLegacyPaymentHint.and.returnValue(false);
    expect(service.hasAccess()).toBeFalse();
  });

  it('getPaymentData returns parsed data when available', () => {
    const data = {
      checkoutId: 'checkout-456',
      timestamp: '2026-01-15T10:00:00Z',
      products: ['enterprise']
    };
    localStorage.setItem('paymentCompleted', JSON.stringify(data));

    const result = service.getPaymentData();
    expect(result).toEqual(data);
  });

  it('getPaymentData returns null when no data', () => {
    expect(service.getPaymentData()).toBeNull();
  });

  it('getPaymentData returns null for corrupt data', () => {
    localStorage.setItem('paymentCompleted', '{corrupt');
    expect(service.getPaymentData()).toBeNull();
  });
});
