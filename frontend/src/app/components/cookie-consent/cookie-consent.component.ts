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
         class="fixed bottom-4 left-4 z-[9999] max-w-sm bg-slate-900/95 backdrop-blur-xl border border-teal-500/30 rounded-xl shadow-2xl shadow-black/30"
         role="dialog"
         aria-label="Cookie consent">
      <div class="px-4 py-4 space-y-3">
        <p class="text-xs text-slate-600 leading-relaxed">
          {{ lang.t('cookie.message') }}
        </p>
        <div class="flex items-center gap-2">
          <button type="button" (click)="declineCookies()"
                  class="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-500/50 text-slate-700
                         hover:bg-slate-100 transition-all duration-200">
            {{ lang.t('cookie.decline') }}
          </button>
          <button type="button" (click)="acceptCookies()"
                  class="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-500/50 text-blue-600
                         hover:bg-blue-50 transition-all duration-200">
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
    this.showBanner = false;
    if (this.isBrowser) {
      localStorage.setItem('cookieConsent', 'accepted');
      this.trackingService.enableAnalytics();
    }
  }

  declineCookies(): void {
    this.showBanner = false;
    if (this.isBrowser) {
      localStorage.setItem('cookieConsent', 'declined');
      this.trackingService.disableAnalytics();
    }
  }

  /** Called from footer "Cookie settings" link */
  reopenBanner(): void {
    this.showBanner = true;
  }
}
