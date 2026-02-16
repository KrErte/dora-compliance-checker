import { Component, OnInit, OnDestroy, effect, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { Subscription, filter } from 'rxjs';
import { LangService } from './lang.service';
import { AuthService } from './auth/auth.service';
import { TrackingService } from './tracking.service';
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
            DA
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
              <!-- Lucide: flag -->
              <svg class="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>
              </svg>
              DORA
              <!-- Lucide: chevron-down -->
              <svg class="w-4 h-4 transition-transform" [class.rotate-180]="doraMenu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            <div *ngIf="doraMenu" class="absolute left-0 top-full mt-1 w-56 bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl shadow-black/20 py-2 z-50">
              <a routerLink="/contract-analysis" (click)="doraMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-emerald-400 hover:bg-slate-700/30 transition-colors">
                <!-- Lucide: file-text -->
                <svg class="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>
                </svg>
                {{ lang.t('nav.contract') }}
              </a>
              <a routerLink="/assessment" (click)="doraMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-cyan-400 hover:bg-slate-700/30 transition-colors">
                <!-- Lucide: clipboard-check -->
                <svg class="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>
                </svg>
                {{ lang.t('nav.assessment') }}
              </a>
              <a routerLink="/board-risk" (click)="doraMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-teal-400 hover:bg-slate-700/30 transition-colors">
                <!-- Lucide: users -->
                <svg class="w-5 h-5 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                {{ lang.t('nav.board_risk') }}
              </a>
              <a routerLink="/fine-calculator" (click)="doraMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-red-400 hover:bg-slate-700/30 transition-colors">
                <!-- Lucide: bar-chart-3 -->
                <svg class="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
                </svg>
                {{ lang.t('nav.fine_calculator') }}
              </a>
              <a routerLink="/timeline" (click)="doraMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-cyan-400 hover:bg-slate-700/30 transition-colors">
                <!-- Lucide: clock -->
                <svg class="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {{ lang.t('nav.timeline') }}
              </a>
              <a routerLink="/vendors" (click)="doraMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-violet-400 hover:bg-slate-700/30 transition-colors">
                <!-- Lucide: building-2 -->
                <svg class="w-5 h-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>
                </svg>
                {{ lang.t('nav.vendors') }}
              </a>
              <div class="border-t border-slate-700/30 my-1"></div>
              <a routerLink="/supply-chain" (click)="doraMenu = false"
                 class="flex items-center justify-between px-4 py-2.5 text-sm text-slate-300 hover:text-emerald-400 hover:bg-slate-700/30 transition-colors">
                <span class="flex items-center gap-2.5">
                  <!-- Lucide: package -->
                  <svg class="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
                  </svg>
                  {{ lang.t('nav.supply_chain') }}
                </span>
                <span class="px-1.5 py-0.5 text-[9px] font-bold rounded bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30">PRO</span>
              </a>
            </div>
          </div>
          <!-- NIS2 dropdown -->
          <div class="relative">
            <button type="button" (click)="toggleNis2Menu($event)"
                    class="text-sm text-slate-400 hover:text-amber-400 transition-colors duration-200 flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-slate-700/30">
              <!-- Lucide: shield-check -->
              <svg class="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>
              </svg>
              NIS2
              <!-- Lucide: chevron-down -->
              <svg class="w-4 h-4 transition-transform" [class.rotate-180]="nis2Menu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            <div *ngIf="nis2Menu" class="absolute left-0 top-full mt-1 w-56 bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl shadow-black/20 py-2 z-50">
              <a routerLink="/nis2/scope-check" (click)="nis2Menu = false"
                 class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-amber-400 hover:bg-slate-700/30 transition-colors">
                <!-- Lucide: shield-check -->
                <svg class="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>
                </svg>
                {{ lang.t('nav.nis2_scope') }}
              </a>
              <a routerLink="/nis2/assessment" (click)="nis2Menu = false"
                 class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-orange-400 hover:bg-slate-700/30 transition-colors">
                <!-- Lucide: activity -->
                <svg class="w-5 h-5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>
                </svg>
                {{ lang.t('nav.nis2_assessment') }}
              </a>
            </div>
          </div>
          <!-- Workspace -->
          <a routerLink="/workspace" routerLinkActive="nav-link-active"
             class="text-sm text-slate-400 hover:text-violet-400 transition-colors duration-200 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-700/30 relative">
            <!-- Lucide: layout -->
            <svg class="w-5 h-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/>
            </svg>
            {{ lang.t('nav.workspace') }}
            <span class="px-1.5 py-0.5 text-[10px] font-bold rounded bg-violet-500/20 text-violet-400">{{ lang.t('nav.new_badge') }}</span>
          </a>
          <!-- Supply Chain -->
          <a routerLink="/supply-chain" routerLinkActive="nav-link-active"
             class="text-sm text-slate-400 hover:text-cyan-400 transition-colors duration-200 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-700/30 relative">
            <!-- Lucide: network -->
            <svg class="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>
            </svg>
            {{ lang.t('nav.supply_chain') }}
            <span class="px-1.5 py-0.5 text-[10px] font-bold rounded bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30">PRO</span>
          </a>
          <!-- Pricing -->
          <a routerLink="/pricing" routerLinkActive="nav-link-active"
             class="text-sm text-slate-400 hover:text-emerald-400 transition-colors duration-200 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-700/30">
            <!-- Lucide: bar-chart-3 -->
            <svg class="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
            </svg>
            {{ lang.t('nav.pricing') }}
          </a>
          <!-- Dashboard -->
          @if (auth.isLoggedIn()) {
            <a routerLink="/dashboard" routerLinkActive="nav-link-active"
               class="text-sm text-slate-400 hover:text-emerald-400 transition-colors duration-200 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-700/30">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
              </svg>
              {{ lang.t('nav.dashboard') }}
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
            <!-- Lucide: globe -->
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
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
            <!-- Lucide: menu -->
            <svg *ngIf="!mobileMenu" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
            </svg>
            <!-- Lucide: x -->
            <svg *ngIf="mobileMenu" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
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
            <!-- Lucide: file-text -->
            <svg class="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>
            </svg>
            {{ lang.t('nav.contract') }}
          </a>
          <a routerLink="/assessment" (click)="mobileMenu = false"
             class="text-sm text-slate-400 hover:text-cyan-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center gap-2">
            <!-- Lucide: clipboard-check -->
            <svg class="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>
            </svg>
            {{ lang.t('nav.assessment') }}
          </a>
          <a routerLink="/board-risk" (click)="mobileMenu = false"
             class="text-sm text-slate-400 hover:text-teal-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center gap-2">
            <!-- Lucide: users -->
            <svg class="w-5 h-5 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {{ lang.t('nav.board_risk') }}
          </a>
          <a routerLink="/fine-calculator" (click)="mobileMenu = false"
             class="text-sm text-slate-400 hover:text-red-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center gap-2">
            <!-- Lucide: bar-chart-3 -->
            <svg class="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
            </svg>
            {{ lang.t('nav.fine_calculator') }}
          </a>
          <a routerLink="/timeline" (click)="mobileMenu = false"
             class="text-sm text-slate-400 hover:text-cyan-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center gap-2">
            <!-- Lucide: clock -->
            <svg class="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {{ lang.t('nav.timeline') }}
          </a>
          <a routerLink="/vendors" (click)="mobileMenu = false"
             class="text-sm text-slate-400 hover:text-violet-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center gap-2">
            <!-- Lucide: building-2 -->
            <svg class="w-5 h-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>
            </svg>
            {{ lang.t('nav.vendors') }}
          </a>
          <a routerLink="/supply-chain" (click)="mobileMenu = false"
             class="text-sm text-slate-400 hover:text-emerald-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center justify-between">
            <span class="flex items-center gap-2">
              <!-- Lucide: package -->
              <svg class="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
              </svg>
              {{ lang.t('nav.supply_chain') }}
            </span>
            <span class="px-1.5 py-0.5 text-[9px] font-bold rounded bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30">PRO</span>
          </a>
          <a routerLink="/workspace" (click)="mobileMenu = false"
             class="text-sm text-slate-400 hover:text-violet-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center justify-between">
            <span class="flex items-center gap-2">
              <!-- Lucide: layout -->
              <svg class="w-5 h-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/>
              </svg>
              {{ lang.t('nav.workspace') }}
            </span>
            <span class="px-1.5 py-0.5 text-[10px] font-bold rounded bg-violet-500/20 text-violet-400">{{ lang.t('nav.new_badge') }}</span>
          </a>
          <div class="border-t border-slate-700/50 mt-2 pt-2">
            <p class="text-xs text-slate-600 px-3 mb-1 uppercase tracking-wider">NIS2</p>
            <a routerLink="/nis2/scope-check" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-amber-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center gap-2">
              <!-- Lucide: shield-check -->
              <svg class="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>
              </svg>
              {{ lang.t('nav.nis2_scope') }}
            </a>
            <a routerLink="/nis2/assessment" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-orange-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center gap-2">
              <!-- Lucide: activity -->
              <svg class="w-5 h-5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>
              </svg>
              {{ lang.t('nav.nis2_assessment') }}
            </a>
          </div>
          <div class="border-t border-slate-700/50 mt-2 pt-2">
            <a routerLink="/pricing" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-emerald-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center gap-2">
              <!-- Lucide: bar-chart-3 -->
              <svg class="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
              </svg>
              {{ lang.t('nav.pricing') }}
            </a>
          </div>
          @if (auth.isLoggedIn()) {
            <div class="border-t border-slate-700/50 mt-2 pt-2">
              <a routerLink="/dashboard" (click)="mobileMenu = false"
                 class="text-sm text-slate-400 hover:text-emerald-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
                </svg>
                {{ lang.t('nav.dashboard') }}
              </a>
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
              <!-- Lucide: globe -->
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
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
    <footer class="border-t border-slate-800 mt-16 py-10">
      <div class="max-w-5xl mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <!-- Brand -->
          <div class="md:col-span-1">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 font-bold text-xs">DA</div>
              <p class="text-sm font-bold text-slate-300">{{ lang.t('nav.brand') }}</p>
            </div>
            <p class="text-xs text-slate-500 leading-relaxed">{{ lang.t('footer.tagline') }}</p>
          </div>

          <!-- Tools -->
          <div>
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{{ lang.t('footer.tools') }}</h4>
            <div class="flex flex-col gap-2">
              <a routerLink="/contract-analysis" class="text-xs text-slate-500 hover:text-emerald-400 transition-colors">{{ lang.t('nav.contract') }}</a>
              <a routerLink="/assessment" class="text-xs text-slate-500 hover:text-emerald-400 transition-colors">{{ lang.t('nav.assessment') }}</a>
              <a routerLink="/nis2/scope-check" class="text-xs text-slate-500 hover:text-amber-400 transition-colors">{{ lang.t('nav.nis2_scope') }}</a>
              <a routerLink="/board-risk" class="text-xs text-slate-500 hover:text-teal-400 transition-colors">{{ lang.t('nav.board_risk') }}</a>
            </div>
          </div>

          <!-- Company -->
          <div>
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{{ lang.t('footer.company') }}</h4>
            <div class="flex flex-col gap-2">
              <a routerLink="/about" class="text-xs text-slate-500 hover:text-emerald-400 transition-colors">{{ lang.t('nav.about') }}</a>
              <a routerLink="/methodology" class="text-xs text-slate-500 hover:text-emerald-400 transition-colors">{{ lang.t('nav.methodology') }}</a>
              <a routerLink="/pricing" class="text-xs text-slate-500 hover:text-emerald-400 transition-colors">{{ lang.t('nav.pricing') }}</a>
              <a routerLink="/privacy" class="text-xs text-slate-500 hover:text-emerald-400 transition-colors">{{ lang.t('footer.privacy') }}</a>
              <a routerLink="/terms" class="text-xs text-slate-500 hover:text-emerald-400 transition-colors">{{ lang.t('footer.terms') }}</a>
            </div>
          </div>

          <!-- Contact -->
          <div>
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{{ lang.t('footer.contact') }}</h4>
            <div class="flex flex-col gap-2 text-xs text-slate-500">
              <a href="mailto:info@doraaudit.eu" class="hover:text-emerald-400 transition-colors">info&#64;doraaudit.eu</a>
              <p>ComplianceHub OÜ</p>
              <p>{{ lang.t('footer.location') }}</p>
              <a href="https://www.linkedin.com/in/kristo-erte-52b73918a/" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 hover:text-blue-400 transition-colors mt-1">
                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        <!-- Bottom bar -->
        <div class="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p class="text-xs text-slate-600">&copy; 2026 ComplianceHub OÜ. {{ lang.t('footer.rights') }}</p>
          <div class="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center">
            <p class="text-[10px] text-slate-700">{{ lang.t('footer.regulation') }}</p>
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
  private isBrowser: boolean;

  private pageTitles: { [path: string]: { et: string; en: string } } = {
    '/': { et: 'DoraAudit.eu - DORA & NIS2 Vastavuskontroll', en: 'DoraAudit.eu - DORA & NIS2 Compliance' },
    '/pricing': { et: 'Hinnakiri | DoraAudit.eu', en: 'Pricing | DoraAudit.eu' },
    '/nis2/scope-check': { et: 'NIS2 Scope Checker | DoraAudit.eu', en: 'NIS2 Scope Checker | DoraAudit.eu' },
    '/nis2/assessment': { et: 'NIS2 Hindamine | DoraAudit.eu', en: 'NIS2 Assessment | DoraAudit.eu' },
    '/assessment': { et: 'DORA Hindamine | DoraAudit.eu', en: 'DORA Assessment | DoraAudit.eu' },
    '/contract-analysis': { et: 'Lepingu Analüüs | DoraAudit.eu', en: 'Contract Analysis | DoraAudit.eu' },
    '/payment/success': { et: 'Makse Õnnestus | DoraAudit.eu', en: 'Payment Successful | DoraAudit.eu' },
    '/login': { et: 'Sisene | DoraAudit.eu', en: 'Login | DoraAudit.eu' },
    '/register': { et: 'Registreeri | DoraAudit.eu', en: 'Register | DoraAudit.eu' },
    '/about': { et: 'Meist | DoraAudit.eu', en: 'About | DoraAudit.eu' },
    '/privacy': { et: 'Privaatsuspoliitika | DoraAudit.eu', en: 'Privacy Policy | DoraAudit.eu' },
    '/methodology': { et: 'Metoodika | DoraAudit.eu', en: 'Methodology | DoraAudit.eu' },
    '/board-risk': { et: 'Juhatuse riskikalkulaator | DoraAudit.eu', en: 'Board Risk Calculator | DoraAudit.eu' },
    '/terms': { et: 'Kasutustingimused | DoraAudit.eu', en: 'Terms of Service | DoraAudit.eu' },
    '/workspace': { et: 'Lepingute Töölaud | DoraAudit.eu', en: 'Contract Workspace | DoraAudit.eu' },
    '/fine-calculator': { et: 'Trahvikalkulaator | DoraAudit.eu', en: 'Fine Calculator | DoraAudit.eu' },
    '/timeline': { et: 'Regulatiivne Ajakava | DoraAudit.eu', en: 'Regulatory Timeline | DoraAudit.eu' },
    '/vendors': { et: 'ICT Teenusepakkujate Andmebaas | DoraAudit.eu', en: 'ICT Vendor Database | DoraAudit.eu' },
    '/supply-chain': { et: 'Supply Chain Nerve Center | DoraAudit.eu', en: 'Supply Chain Nerve Center | DoraAudit.eu' },
    '/dashboard': { et: 'Juhtpaneel | DoraAudit.eu', en: 'Dashboard | DoraAudit.eu' }
  };

  private pageDescriptions: { [path: string]: string } = {
    '/': 'DORA ja NIS2 vastavuskontroll Eesti ettevõtetele. Tasuta NIS2 scope check, lepinguanalüüs ja juhatuse riskikalkulaator.',
    '/nis2/scope-check': 'Kontrolli tasuta kas NIS2 direktiiv kohaldub sinu ettevõttele. Sisesta registrikood ja saa kohene tulemus.',
    '/board-risk': 'NIS2 ja DORA juhatuse liikme isikliku vastutuse kalkulaator. Arvuta oma riskieksposuur 2 minutiga.',
    '/assessment': 'DORA täishindamine 37 küsimusega. Detailne tegevuskava ja PDF raport juhatusele.',
    '/nis2/assessment': 'NIS2 vastavushindamine Eesti ettevõtetele. E-ITS ja KüTS nõuetele vastav tegevuskava.',
    '/contract-analysis': 'DORA Art. 30 lepinguanalüüs. Kontrolli kas sinu IKT-leping vastab regulatsiooni nõuetele.',
    '/pricing': 'DoraAudit.eu hinnad. NIS2 ja DORA hindamine alates €29. Ühekordne makse, ei nõua tellimust.',
    '/methodology': 'DORA vastavushindamise metoodika. Kuidas hindame IKT-lepinguid Art. 30 nõuete vastu.',
    '/about': 'DoraAudit.eu - DORA ja NIS2 vastavuskontrolli platvorm Eesti finantsettevõtetele.',
    '/privacy': 'DoraAudit.eu privaatsuspoliitika. Kuidas me kasutame ja kaitseme teie andmeid.',
    '/terms': 'DoraAudit.eu kasutustingimused. Teenuse kasutamise õigused ja kohustused.',
    '/workspace': 'IKT lepingute töölaud DORA, GDPR, NIS2 ja SLA vastavuskontrolliks. Multiregulatiivne analüüs ja meeskonnatöö.',
    '/fine-calculator': 'DORA trahvikalkulaator. Arvuta võimalik trahvisumma mittevastavuse korral Art. 50-51 alusel.',
    '/timeline': 'DORA ja NIS2 regulatiivne ajakava. Kõik olulised tähtajad, verstapostid ja RTS/ITS standardid ühes kohas.',
    '/vendors': 'ICT teenusepakkujate DORA vastavuse andmebaas. Anonümiseeritud andmed lepinguanalüüsidest ja crowdsourced riskihinnangud.',
    '/supply-chain': 'DORA Supply Chain Nerve Center. Real-time Nth-party monitoring, CTPP failure simulation, 4h incident command ja ROI intelligence.'
  };

  constructor(
    public lang: LangService,
    public auth: AuthService,
    private router: Router,
    private titleService: Title,
    private meta: Meta,
    private trackingService: TrackingService,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    // Update title and html lang attribute when language changes
    effect(() => {
      const currentLang = this.lang.lang(); // Subscribe to language signal
      this.updatePageTitle(this.router.url);
      // Update html lang attribute for accessibility and SEO
      this.document.documentElement.lang = currentLang;
    });
  }

  ngOnInit() {
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updatePageTitle(event.urlAfterRedirects);
      this.closeAllMenus();
      // Track page view on navigation
      if (this.isBrowser) {
        this.trackingService.trackPageView(event.urlAfterRedirects);
      }
    });

    // Set initial title
    this.updatePageTitle(this.router.url);

    // Initialize all tracking (scroll, clicks, time, forms)
    if (this.isBrowser) {
      this.trackingService.initAllTracking();
      // Track initial page view
      this.trackingService.trackPageView(this.router.url);
    }
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  private updatePageTitle(url: string) {
    const path = url.split('?')[0];
    const titleEntry = this.pageTitles[path];
    const title = titleEntry
      ? (this.lang.currentLang === 'et' ? titleEntry.et : titleEntry.en)
      : 'DoraAudit.eu';
    this.titleService.setTitle(title);

    // Update meta description
    const description = this.pageDescriptions[path] || this.pageDescriptions['/'];
    this.meta.updateTag({ name: 'description', content: description });

    // Update canonical URL
    const canonicalUrl = `https://doraaudit.eu${path === '/' ? '' : path}`;
    this.updateCanonicalUrl(canonicalUrl);

    // Update Open Graph tags
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: 'DoraAudit.eu' });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ property: 'og:image', content: 'https://doraaudit.eu/assets/og-image.png' });
    this.meta.updateTag({ property: 'og:locale', content: 'et_EE' });

    // Update Twitter Card tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: 'https://doraaudit.eu/assets/og-image.png' });
  }

  private updateCanonicalUrl(url: string) {
    if (!this.isBrowser) return;

    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (link) {
      link.setAttribute('href', url);
    } else {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', url);
      this.document.head.appendChild(link);
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
