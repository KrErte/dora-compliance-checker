import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { LangService } from './lang.service';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  host: { '(document:click)': 'closeDropdowns($event)' },
  template: `
    <nav class="bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <a routerLink="/" class="flex items-center gap-3 group">
          <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 font-bold text-sm
                      group-hover:shadow-lg group-hover:shadow-emerald-500/25 transition-all duration-300 group-hover:scale-105">
            D
          </div>
          <div class="flex flex-col">
            <span class="text-lg font-bold gradient-text leading-tight">
              {{ lang.t('nav.brand') }}
            </span>
            <span class="text-[10px] text-slate-600 leading-tight hidden sm:block">EU 2022/2554</span>
          </div>
        </a>

        <!-- Desktop nav - max 3 items -->
        <div class="hidden sm:flex items-center gap-1">
          @if (auth.isLoggedIn()) {
            <a routerLink="/contract-analysis" routerLinkActive="nav-link-active"
               class="text-sm text-slate-400 hover:text-emerald-400 transition-colors duration-200 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-700/30 relative">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              {{ lang.t('nav.contract') }}
            </a>
            <a routerLink="/assessment" routerLinkActive="nav-link-active"
               class="text-sm text-slate-400 hover:text-emerald-400 transition-colors duration-200 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-700/30 relative">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              {{ lang.t('nav.assessment') }}
            </a>
            <a routerLink="/history" routerLinkActive="nav-link-active"
               class="text-sm text-slate-400 hover:text-emerald-400 transition-colors duration-200 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-700/30 relative">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ lang.t('nav.history') }}
            </a>
            <!-- Tools dropdown -->
            <div class="relative">
              <button (click)="toolsMenu = !toolsMenu"
                      class="text-sm text-slate-400 hover:text-emerald-400 transition-colors duration-200 flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-slate-700/30">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"/>
                </svg>
                {{ lang.t('nav.tools') }}
                <svg class="w-3 h-3 transition-transform" [class.rotate-180]="toolsMenu" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              <div *ngIf="toolsMenu" class="absolute right-0 top-full mt-1 w-56 bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl shadow-black/20 py-2 z-50">
                <a routerLink="/contract-generator" (click)="toolsMenu = false"
                   class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-emerald-400 hover:bg-slate-700/30 transition-colors">
                  <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  {{ lang.t('nav.generator') }}
                </a>
                <a routerLink="/guardian" (click)="toolsMenu = false"
                   class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-emerald-400 hover:bg-slate-700/30 transition-colors">
                  <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                  {{ lang.t('nav.guardian') }}
                </a>
                <a routerLink="/incident-simulator" (click)="toolsMenu = false"
                   class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-emerald-400 hover:bg-slate-700/30 transition-colors">
                  <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                  </svg>
                  {{ lang.t('nav.simulator') }}
                </a>
                <a routerLink="/regulatory-updates" (click)="toolsMenu = false"
                   class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-emerald-400 hover:bg-slate-700/30 transition-colors">
                  <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
                  </svg>
                  {{ lang.t('nav.regulatory') }}
                </a>
              </div>
            </div>
            <div class="w-px h-5 bg-slate-700/50 mx-1"></div>
            <span class="text-xs text-slate-500 px-2 truncate max-w-[120px]">{{ auth.user()?.email }}</span>
            <button (click)="auth.logout()"
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
          <button (click)="lang.toggle()"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                         bg-slate-700/50 text-slate-300 border border-slate-600/30
                         hover:bg-slate-600/50 hover:text-emerald-400 transition-all duration-200">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ lang.currentLang === 'et' ? 'EN' : 'ET' }}
          </button>
        </div>

        <!-- Mobile hamburger -->
        <div class="flex items-center gap-2 sm:hidden">
          <button (click)="lang.toggle()"
                  class="px-2 py-1 rounded text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/30">
            {{ lang.currentLang === 'et' ? 'EN' : 'ET' }}
          </button>
          <button (click)="mobileMenu = !mobileMenu"
                  class="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-700/30 transition-colors">
            <svg *ngIf="!mobileMenu" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
            <svg *ngIf="mobileMenu" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile menu -->
      <div *ngIf="mobileMenu" class="sm:hidden border-t border-slate-700/50 bg-slate-800/95 backdrop-blur-xl">
        <div class="px-4 py-3 flex flex-col gap-1">
          @if (auth.isLoggedIn()) {
            <a routerLink="/contract-analysis" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-emerald-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.contract') }}</a>
            <a routerLink="/assessment" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-emerald-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.assessment') }}</a>
            <a routerLink="/history" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-emerald-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.history') }}</a>
            <div class="border-t border-slate-700/50 mt-2 pt-2">
              <p class="text-xs text-slate-600 px-3 mb-1 uppercase tracking-wider">{{ lang.t('nav.tools') }}</p>
              <a routerLink="/contract-generator" (click)="mobileMenu = false"
                 class="text-sm text-slate-400 hover:text-emerald-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center gap-2">
                <span class="text-violet-400">&#9998;</span> {{ lang.t('nav.generator') }}</a>
              <a routerLink="/guardian" (click)="mobileMenu = false"
                 class="text-sm text-slate-400 hover:text-emerald-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center gap-2">
                <span class="text-cyan-400">&#9737;</span> {{ lang.t('nav.guardian') }}</a>
              <a routerLink="/incident-simulator" (click)="mobileMenu = false"
                 class="text-sm text-slate-400 hover:text-emerald-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center gap-2">
                <span class="text-amber-400">&#9888;</span> {{ lang.t('nav.simulator') }}</a>
              <a routerLink="/regulatory-updates" (click)="mobileMenu = false"
                 class="text-sm text-slate-400 hover:text-emerald-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center gap-2">
                <span class="text-emerald-400">&#9878;</span> {{ lang.t('nav.regulatory') }}</a>
            </div>
            <div class="border-t border-slate-700/50 mt-2 pt-2">
              <span class="text-xs text-slate-500 px-3">{{ auth.user()?.email }}</span>
              <button (click)="auth.logout(); mobileMenu = false"
                      class="w-full text-left text-sm text-red-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 mt-1">
                {{ lang.t('auth.logout') }}
              </button>
            </div>
          } @else {
            <a routerLink="/login" (click)="mobileMenu = false"
               class="text-sm text-emerald-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('auth.login') }}</a>
            <a routerLink="/register" (click)="mobileMenu = false"
               class="text-sm text-white bg-emerald-500/20 px-3 py-2 rounded-lg hover:bg-emerald-500/30">{{ lang.t('auth.register') }}</a>
          }
        </div>
      </div>
    </nav>
    <main class="max-w-5xl mx-auto px-4 py-8">
      <router-outlet />
    </main>
    <footer class="border-t border-slate-800 mt-16 py-8">
      <div class="max-w-5xl mx-auto px-4">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 font-bold text-xs">D</div>
            <div>
              <p class="text-sm font-semibold text-slate-400">{{ lang.t('nav.brand') }}</p>
              <p class="text-xs text-slate-600">EU 2022/2554</p>
            </div>
          </div>
          <div class="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-600">
            <a routerLink="/contract-analysis" class="hover:text-emerald-400 transition-colors">{{ lang.t('nav.contract') }}</a>
            <a routerLink="/contract-generator" class="hover:text-emerald-400 transition-colors">{{ lang.t('nav.generator') }}</a>
            <a routerLink="/guardian" class="hover:text-emerald-400 transition-colors">{{ lang.t('nav.guardian') }}</a>
            <a routerLink="/incident-simulator" class="hover:text-emerald-400 transition-colors">{{ lang.t('nav.simulator') }}</a>
            <a routerLink="/pricing" class="hover:text-emerald-400 transition-colors">{{ lang.t('nav.pricing') }}</a>
            <a routerLink="/about" class="hover:text-emerald-400 transition-colors">{{ lang.t('nav.about') }}</a>
            <a routerLink="/methodology" class="hover:text-emerald-400 transition-colors">{{ lang.t('nav.methodology') }}</a>
            <a routerLink="/privacy" class="hover:text-emerald-400 transition-colors">{{ lang.t('footer.privacy') }}</a>
            <a href="https://eur-lex.europa.eu/legal-content/ET/TXT/?uri=CELEX:32022R2554" target="_blank" class="hover:text-emerald-400 transition-colors">{{ lang.t('footer.dora_text') }}</a>
          </div>
          <div class="flex flex-col items-center md:items-end gap-2">
            <p class="text-xs text-slate-600">{{ lang.t('footer.regulation') }}</p>
            <p class="text-[10px] text-slate-700">{{ lang.t('footer.disclaimer') }}</p>
          </div>
        </div>
      </div>
    </footer>
  `
})
export class AppComponent {
  mobileMenu = false;
  toolsMenu = false;

  constructor(public lang: LangService, public auth: AuthService) {}

  closeDropdowns(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.toolsMenu = false;
    }
  }
}
