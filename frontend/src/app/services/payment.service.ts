import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);

  createCheckout(priceId: string, sessionId?: string): void {
    this.http.post<{ url: string }>('/api/stripe/checkout', {
      priceId,
      sessionId
    }).subscribe({
      next: (res) => {
        window.location.href = res.url;
      },
      error: (err) => {
        console.error('Stripe checkout error:', err);
        alert('Payment system temporarily unavailable. Please try again.');
      }
    });
  }
}
