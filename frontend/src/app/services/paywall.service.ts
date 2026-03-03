import { Injectable } from '@angular/core';
import { SubscriptionService } from './subscription.service';

@Injectable({ providedIn: 'root' })
export class PaywallService {

  constructor(private subscriptionService: SubscriptionService) {}

  hasAccess(): boolean {
    // Delegate to SubscriptionService which checks server-verified status
    return this.subscriptionService.isPremium() || this.subscriptionService.hasLegacyPaymentHint();
  }

  getPaymentData(): { checkoutId: string; timestamp: string; products: string[] } | null {
    const payment = typeof localStorage !== 'undefined' ? localStorage.getItem('paymentCompleted') : null;
    if (!payment) return null;
    try {
      return JSON.parse(payment);
    } catch {
      return null;
    }
  }
}
