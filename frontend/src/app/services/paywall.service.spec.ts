import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { PaywallService } from './paywall.service';

describe('PaywallService', () => {
  let service: PaywallService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }]
    });
    service = TestBed.inject(PaywallService);
  });

  afterEach(() => localStorage.clear());

  it('hasAccess returns false when no payment data', () => {
    expect(service.hasAccess()).toBeFalse();
  });

  it('hasAccess returns true when valid payment exists', () => {
    localStorage.setItem('paymentCompleted', JSON.stringify({
      checkoutId: 'checkout-123',
      timestamp: new Date().toISOString(),
      products: ['standard']
    }));

    expect(service.hasAccess()).toBeTrue();
  });

  it('hasAccess returns false for invalid JSON', () => {
    localStorage.setItem('paymentCompleted', 'not-json');
    expect(service.hasAccess()).toBeFalse();
  });

  it('hasAccess returns false when checkoutId is missing', () => {
    localStorage.setItem('paymentCompleted', JSON.stringify({ timestamp: '2026-01-01' }));
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
