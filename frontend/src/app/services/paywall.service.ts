import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class PaywallService {
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  hasAccess(): boolean {
    if (!this.isBrowser) return false;
    const payment = localStorage.getItem('paymentCompleted');
    if (!payment) return false;
    try {
      const data = JSON.parse(payment);
      return !!data.checkoutId;
    } catch {
      return false;
    }
  }

  getPaymentData(): { checkoutId: string; timestamp: string; products: string[] } | null {
    if (!this.isBrowser) return null;
    const payment = localStorage.getItem('paymentCompleted');
    if (!payment) return null;
    try {
      return JSON.parse(payment);
    } catch {
      return null;
    }
  }
}
