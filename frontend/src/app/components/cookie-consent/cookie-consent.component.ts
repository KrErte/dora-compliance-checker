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
          {{ lang.currentLang === 'et'
             ? 'See veebileht kasutab ainult tehnilisi küpsiseid. Isikuandmeid ei koguta.'
             : 'This website uses only technical cookies. No personal data is collected.' }}
        </p>
        <button (click)="acceptCookies()"
                class="px-6 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-teal-500 to-emerald-500 text-white
                       hover:from-teal-400 hover:to-emerald-400 hover:shadow-lg hover:shadow-teal-500/25
                       transition-all duration-200 whitespace-nowrap">
          {{ lang.currentLang === 'et' ? 'Sain aru' : 'I understand' }}
        </button>
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
    this.showBanner = consent !== 'true';
  }

  acceptCookies(): void {
    localStorage.setItem('cookieConsent', 'true');
    this.showBanner = false;
  }
}
