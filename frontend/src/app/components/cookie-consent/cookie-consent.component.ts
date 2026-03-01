import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { LangService } from '../../lang.service';
import { TrackingService } from '../../tracking.service';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="showBanner"
         class="fixed bottom-0 left-0 right-0 z-[9999] bg-slate-900/95 backdrop-blur-xl border-t border-teal-500/30 shadow-lg shadow-black/20"
         role="dialog"
         aria-label="Cookie consent">
      <div class="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="text-sm text-slate-300 text-center sm:text-left">
          {{ lang.t('cookie.message') }}
        </p>
        <div class="flex items-center gap-3">
          <button type="button" (click)="declineCookies()"
                  class="px-5 py-2 rounded-lg text-sm font-medium border border-slate-500/50 text-slate-200
                         hover:bg-slate-700/50 transition-all duration-200 whitespace-nowrap">
            {{ lang.t('cookie.decline') }}
          </button>
          <button type="button" (click)="acceptCookies()"
                  class="px-5 py-2 rounded-lg text-sm font-medium border border-emerald-500/50 text-emerald-400
                         hover:bg-emerald-500/10 transition-all duration-200 whitespace-nowrap">
            {{ lang.t('cookie.accept') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class CookieConsentComponent implements OnInit {
  showBanner = false;
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor(public lang: LangService, private trackingService: TrackingService) {}

  ngOnInit(): void {
    if (!this.isBrowser) return;
    const consent = localStorage.getItem('cookieConsent');
    this.showBanner = !consent || (consent !== 'accepted' && consent !== 'declined' && consent !== 'true');
  }

  acceptCookies(): void {
    if (this.isBrowser) {
      localStorage.setItem('cookieConsent', 'accepted');
      this.trackingService.enableAnalytics();
    }
    this.showBanner = false;
  }

  declineCookies(): void {
    if (this.isBrowser) {
      localStorage.setItem('cookieConsent', 'declined');
      this.trackingService.disableAnalytics();
    }
    this.showBanner = false;
  }

  /** Called from footer "Cookie settings" link */
  reopenBanner(): void {
    this.showBanner = true;
  }
}
