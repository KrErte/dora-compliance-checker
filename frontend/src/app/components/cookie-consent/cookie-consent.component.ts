import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LangService } from '../../lang.service';

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
                  class="px-5 py-2 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-300 border border-slate-600/50
                         hover:bg-slate-600/50 hover:text-slate-200 transition-all duration-200 whitespace-nowrap">
            {{ lang.t('cookie.decline') }}
          </button>
          <button type="button" (click)="acceptCookies()"
                  class="px-5 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-teal-500 to-emerald-500 text-white
                         hover:from-teal-400 hover:to-emerald-400 hover:shadow-lg hover:shadow-teal-500/25
                         transition-all duration-200 whitespace-nowrap">
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

  constructor(public lang: LangService) {}

  ngOnInit(): void {
    const consent = localStorage.getItem('cookieConsent');
    // Show banner if user hasn't made a choice yet
    this.showBanner = !consent || (consent !== 'accepted' && consent !== 'declined' && consent !== 'true');
  }

  acceptCookies(): void {
    localStorage.setItem('cookieConsent', 'accepted');
    this.showBanner = false;
  }

  declineCookies(): void {
    localStorage.setItem('cookieConsent', 'declined');
    this.showBanner = false;
  }
}
