import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

declare global {
  interface Window {
    LemonSqueezy?: {
      Setup: (config: { eventHandler: (event: any) => void }) => void;
      Url: {
        Open: (url: string) => void;
      };
    };
    createLemonSqueezy?: () => void;
    lemonSqueezyLoadFailed?: boolean;
    lemonSqueezyLoaded?: boolean;
  }
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private _isAvailable = signal(false);
  private _isLoading = signal(true);
  private _errorMessage = signal<string | null>(null);
  private checkAttempts = 0;
  private maxAttempts = 10;

  isAvailable = this._isAvailable.asReadonly();
  isLoading = this._isLoading.asReadonly();
  errorMessage = this._errorMessage.asReadonly();

  constructor() {
    if (this.isBrowser) {
      this.checkLemonSqueezyAvailability();
    } else {
      this._isLoading.set(false);
    }
  }

  private checkLemonSqueezyAvailability(): void {
    this.checkAttempts++;

    // Check if script failed to load
    if (typeof window !== 'undefined' && window.lemonSqueezyLoadFailed) {
      this._isAvailable.set(false);
      this._isLoading.set(false);
      this._errorMessage.set('Maksesüsteem on ajutiselt kättesaamatu. Palun proovi hiljem uuesti.');
      return;
    }

    // Check if LemonSqueezy is available
    if (typeof window !== 'undefined' && (window.LemonSqueezy || window.lemonSqueezyLoaded)) {
      this._isAvailable.set(true);
      this._isLoading.set(false);
      this._errorMessage.set(null);
      return;
    }

    // If max attempts reached, show error
    if (this.checkAttempts >= this.maxAttempts) {
      this._isAvailable.set(false);
      this._isLoading.set(false);
      this._errorMessage.set('Maksesüsteem on ajutiselt kättesaamatu. Palun proovi hiljem uuesti.');
      return;
    }

    // Retry after 500ms
    setTimeout(() => this.checkLemonSqueezyAvailability(), 500);
  }

  openCheckout(url: string): boolean {
    if (!this._isAvailable()) {
      return false;
    }

    try {
      if (window.LemonSqueezy?.Url) {
        window.LemonSqueezy.Url.Open(url);
        return true;
      } else {
        // Fallback to direct link
        window.open(url, '_blank');
        return true;
      }
    } catch (error) {
      window.open(url, '_blank');
      return true;
    }
  }

  // Retry loading
  retry(): void {
    this.checkAttempts = 0;
    this._isLoading.set(true);
    this._errorMessage.set(null);
    this.checkLemonSqueezyAvailability();
  }
}
