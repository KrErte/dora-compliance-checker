import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subscription, filter } from 'rxjs';
import { LangService } from './lang.service';
import { AuthService } from './auth/auth.service';
import { CookieConsentComponent } from './components/cookie-consent/cookie-consent.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, CookieConsentComponent],
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(window:scroll)': 'closeAllMenus()'
  },
  template: `
    <a class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-teal-500 focus:text-white focus:px-4 focus:py-2 focus:rounded" href="#main-content">Liigu sisule</a>
    <nav class="bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50" aria-label="Peamine navigatsioon">
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <a routerLink="/" class="flex items-center gap-3 group">
          <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 font-bold text-xs
                      group-hover:shadow-lg group-hover:shadow-emerald-500/25 transition-all duration-300 group-hover:scale-105">
            CH
          </div>
          <span class="text-lg font-bold gradient-text leading-tight">
            {{ lang.t('nav.brand') }}
          </span>
        </a>

        <!-- Desktop nav -->
        <div class="hidden sm:flex items-center gap-1">
          <!-- DORA dropdown -->
          <div class="relative">
            <button type="button" (click)="toggleDoraMenu($event)"
                    class="text-sm text-slate-400 hover:text-emerald-400 transition-colors duration-200 flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-slate-700/30">
              <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              DORA
              <svg class="w-3 h-3 transition-transform" [class.rotate-180]="doraMenu" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <div *ngIf="doraMenu" class="absolute left-0 top-full mt-1 w-56 bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl shadow-black/20 py-2 z-50">
              <a routerLink="/contract-analysis" (click)="doraMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-emerald-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                {{ lang.t('nav.contract') }}
              </a>
              <a routerLink="/assessment" (click)="doraMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-emerald-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                {{ lang.t('nav.assessment') }}
              </a>
            </div>
          </div>
          <!-- NIS2 dropdown -->
          <div class="relative">
            <button type="button" (click)="toggleNis2Menu($event)"
                    class="text-sm text-slate-400 hover:text-amber-400 transition-colors duration-200 flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-slate-700/30">
              <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              NIS2
              <svg class="w-3 h-3 transition-transform" [class.rotate-180]="nis2Menu" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <div *ngIf="nis2Menu" class="absolute left-0 top-full mt-1 w-56 bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl shadow-black/20 py-2 z-50">
              <a routerLink="/nis2/scope-check" (click)="nis2Menu = false"
                 class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-amber-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
                {{ lang.t('nav.nis2_scope') }}
              </a>
              <a routerLink="/nis2/assessment" (click)="nis2Menu = false"
                 class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-amber-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                {{ lang.t('nav.nis2_assessment') }}
              </a>
            </div>
          </div>
          <!-- Pricing -->
          <a routerLink="/pricing" routerLinkActive="nav-link-active"
             class="text-sm text-slate-400 hover:text-emerald-400 transition-colors duration-200 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-700/30">
            <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ lang.t('nav.pricing') }}
          </a>
          <!-- Dashboard -->
          @if (auth.isLoggedIn()) {
            <a routerLink="/history" routerLinkActive="nav-link-active"
               class="text-sm text-slate-400 hover:text-emerald-400 transition-colors duration-200 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-700/30">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
              </svg>
              Dashboard
            </a>
            <div class="w-px h-5 bg-slate-700/50 mx-1"></div>
            <span class="text-xs text-slate-500 px-2 truncate max-w-[120px]">{{ auth.user()?.email }}</span>
            <button type="button" (click)="auth.logout()"
                    class="text-sm text-slate-400 hover:text-red-400 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-slate-700/30">
              {{ lang.t('auth.logout') }}
            </button>
          } @else {
            <a routerLink="/login"
               class="text-sm text-emerald-400 hover:text-emerald-300 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-slate-700/30">
              {{ lang.t('auth.login') }}
            </a>
            <a routerLink="/register"
               class="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white
                      hover:from-emerald-400 hover:to-cyan-400 hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200">
              {{ lang.t('auth.register') }}
            </a>
          }
          <div class="w-px h-5 bg-slate-700/50 mx-1"></div>
          <button type="button" (click)="lang.toggle()"
                  aria-label="Vaheta keelt"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                         bg-slate-700/50 text-slate-300 border border-slate-600/30
                         hover:bg-slate-600/50 hover:text-emerald-400 transition-all duration-200">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ lang.currentLang === 'et' ? 'EN' : 'ET' }}
          </button>
        </div>

        <!-- Mobile hamburger -->
        <div class="flex items-center gap-2 sm:hidden">
          <button type="button" (click)="mobileMenu = !mobileMenu"
                  [attr.aria-label]="mobileMenu ? 'Sulge menüü' : 'Ava menüü'"
                  [attr.aria-expanded]="mobileMenu"
                  class="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-700/30 transition-colors">
            <svg *ngIf="!mobileMenu" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
            <svg *ngIf="mobileMenu" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile menu -->
      <div *ngIf="mobileMenu" class="sm:hidden border-t border-slate-700/50 bg-slate-800/95 backdrop-blur-xl">
        <div class="px-4 py-3 flex flex-col gap-1">
          <p class="text-xs text-slate-600 px-3 mb-1 uppercase tracking-wider">DORA</p>
          <a routerLink="/contract-analysis" (click)="mobileMenu = false"
             class="text-sm text-slate-400 hover:text-emerald-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center gap-2">
            <span class="text-emerald-400">&#9998;</span> {{ lang.t('nav.contract') }}</a>
          <a routerLink="/assessment" (click)="mobileMenu = false"
             class="text-sm text-slate-400 hover:text-emerald-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center gap-2">
            <span class="text-cyan-400">&#9745;</span> {{ lang.t('nav.assessment') }}</a>
          <div class="border-t border-slate-700/50 mt-2 pt-2">
            <p class="text-xs text-slate-600 px-3 mb-1 uppercase tracking-wider">NIS2</p>
            <a routerLink="/nis2/scope-check" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-amber-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center gap-2">
              <span class="text-amber-400">&#9745;</span> {{ lang.t('nav.nis2_scope') }}</a>
            <a routerLink="/nis2/assessment" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-amber-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center gap-2">
              <span class="text-orange-400">&#9998;</span> {{ lang.t('nav.nis2_assessment') }}</a>
          </div>
          <div class="border-t border-slate-700/50 mt-2 pt-2">
            <a routerLink="/pricing" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-violet-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center gap-2">
              <span class="text-violet-400">&#128176;</span> {{ lang.t('nav.pricing') }}</a>
          </div>
          @if (auth.isLoggedIn()) {
            <div class="border-t border-slate-700/50 mt-2 pt-2">
              <a routerLink="/history" (click)="mobileMenu = false"
                 class="text-sm text-slate-400 hover:text-emerald-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center gap-2">
                <span class="text-violet-400">&#9635;</span> Dashboard</a>
            </div>
            <div class="border-t border-slate-700/50 mt-2 pt-2">
              <span class="text-xs text-slate-500 px-3">{{ auth.user()?.email }}</span>
              <button type="button" (click)="auth.logout(); mobileMenu = false"
                      class="w-full text-left text-sm text-red-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 mt-1">
                {{ lang.t('auth.logout') }}
              </button>
            </div>
          } @else {
            <div class="border-t border-slate-700/50 mt-2 pt-2">
              <a routerLink="/login" (click)="mobileMenu = false"
                 class="text-sm text-emerald-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('auth.login') }}</a>
              <a routerLink="/register" (click)="mobileMenu = false"
                 class="text-sm text-white bg-emerald-500/20 px-3 py-2 rounded-lg hover:bg-emerald-500/30">{{ lang.t('auth.register') }}</a>
            </div>
          }
          <div class="border-t border-slate-700/50 mt-2 pt-2">
            <button type="button" (click)="lang.toggle(); mobileMenu = false"
                    aria-label="Vaheta keelt"
                    class="w-full text-left text-sm text-slate-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ lang.currentLang === 'et' ? 'English' : 'Eesti' }}
            </button>
          </div>
        </div>
      </div>
    </nav>
    <main id="main-content" class="max-w-5xl mx-auto px-4 py-8">
      <router-outlet />
    </main>
    <footer class="border-t border-slate-800 mt-16 py-8">
      <div class="max-w-5xl mx-auto px-4">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 font-bold text-[10px]">CH</div>
            <p class="text-sm font-semibold text-slate-400">{{ lang.t('nav.brand') }}</p>
          </div>
          <div class="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-600">
            <a routerLink="/contract-analysis" class="hover:text-emerald-400 transition-colors">DORA</a>
            <a routerLink="/nis2/scope-check" class="hover:text-amber-400 transition-colors">NIS2</a>
            <a routerLink="/pricing" class="hover:text-emerald-400 transition-colors">{{ lang.t('nav.pricing') }}</a>
            <a routerLink="/about" class="hover:text-emerald-400 transition-colors">{{ lang.t('nav.about') }}</a>
            <a routerLink="/methodology" class="hover:text-emerald-400 transition-colors">{{ lang.t('nav.methodology') }}</a>
            <a routerLink="/privacy" class="hover:text-emerald-400 transition-colors">{{ lang.t('footer.privacy') }}</a>
          </div>
          <div class="flex flex-col items-center md:items-end gap-2">
            <p class="text-xs text-slate-500">&copy; 2026 ComplianceHub</p>
            <p class="text-xs text-slate-500">Kontakt: info&#64;doraaudit.eu</p>
            <p class="text-xs text-slate-600">{{ lang.t('footer.regulation') }}</p>
            <p class="text-[10px] text-slate-700">{{ lang.t('footer.disclaimer') }}</p>
          </div>
        </div>
      </div>
    </footer>
    <app-cookie-consent></app-cookie-consent>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  mobileMenu = false;
  doraMenu = false;
  nis2Menu = false;
  private routerSub?: Subscription;

  private pageTitles: { [path: string]: { et: string; en: string } } = {
    '/': { et: 'ComplianceHub - DORA & NIS2 Vastavuskontroll', en: 'ComplianceHub - DORA & NIS2 Compliance' },
    '/pricing': { et: 'Hinnakiri | ComplianceHub', en: 'Pricing | ComplianceHub' },
    '/nis2/scope-check': { et: 'NIS2 Scope Checker | ComplianceHub', en: 'NIS2 Scope Checker | ComplianceHub' },
    '/nis2/assessment': { et: 'NIS2 Hindamine | ComplianceHub', en: 'NIS2 Assessment | ComplianceHub' },
    '/assessment': { et: 'DORA Hindamine | ComplianceHub', en: 'DORA Assessment | ComplianceHub' },
    '/contract-analysis': { et: 'Lepingu Analüüs | ComplianceHub', en: 'Contract Analysis | ComplianceHub' },
    '/payment/success': { et: 'Makse Õnnestus | ComplianceHub', en: 'Payment Successful | ComplianceHub' },
    '/login': { et: 'Sisene | ComplianceHub', en: 'Login | ComplianceHub' },
    '/register': { et: 'Registreeri | ComplianceHub', en: 'Register | ComplianceHub' },
    '/about': { et: 'Meist | ComplianceHub', en: 'About | ComplianceHub' },
    '/privacy': { et: 'Privaatsuspoliitika | ComplianceHub', en: 'Privacy Policy | ComplianceHub' },
    '/methodology': { et: 'Metoodika | ComplianceHub', en: 'Methodology | ComplianceHub' }
  };

  constructor(
    public lang: LangService,
    public auth: AuthService,
    private router: Router,
    private titleService: Title
  ) {
    // Update title when language changes
    effect(() => {
      this.lang.lang(); // Subscribe to language signal
      this.updatePageTitle(this.router.url);
    });
  }

  ngOnInit() {
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updatePageTitle(event.urlAfterRedirects);
      this.closeAllMenus();
    });

    // Set initial title
    this.updatePageTitle(this.router.url);
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  private updatePageTitle(url: string) {
    const path = url.split('?')[0];
    const titleEntry = this.pageTitles[path];
    if (titleEntry) {
      const title = this.lang.currentLang === 'et' ? titleEntry.et : titleEntry.en;
      this.titleService.setTitle(title);
    } else {
      this.titleService.setTitle('ComplianceHub');
    }
  }

  toggleDoraMenu(event: Event) {
    event.stopPropagation();
    this.nis2Menu = false;
    this.doraMenu = !this.doraMenu;
  }

  toggleNis2Menu(event: Event) {
    event.stopPropagation();
    this.doraMenu = false;
    this.nis2Menu = !this.nis2Menu;
  }

  closeAllMenus() {
    this.doraMenu = false;
    this.nis2Menu = false;
  }

  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.closeAllMenus();
    }
  }
}
