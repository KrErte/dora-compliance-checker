import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PaywallService {

  hasAccess(): boolean {
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
    const payment = localStorage.getItem('paymentCompleted');
    if (!payment) return null;
    try {
      return JSON.parse(payment);
    } catch {
      return null;
    }
  }
}
