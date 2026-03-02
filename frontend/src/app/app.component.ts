import { Component, OnInit, OnDestroy, effect, Inject, PLATFORM_ID, ChangeDetectorRef, afterNextRender, ViewChild } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { Subscription, filter, skip } from 'rxjs';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LangService } from './lang.service';
import { AuthService } from './auth/auth.service';
import { TrackingService } from './tracking.service';
import { SubscriptionService } from './services/subscription.service';
import { CookieConsentComponent } from './components/cookie-consent/cookie-consent.component';
import { OnboardingComponent } from './pages/onboarding.component';
import { ChatWidgetComponent } from './components/chat-widget.component';
import { ToastService } from './auth/toast.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, CookieConsentComponent, OnboardingComponent, ChatWidgetComponent],
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(window:scroll)': 'closeAllMenus()'
  },
  template: `
    <a class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-teal-500 focus:text-white focus:px-4 focus:py-2 focus:rounded" href="#main-content">{{ lang.t('nav.skip_link') }}</a>
    <nav ngSkipHydration class="bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50" [attr.aria-label]="lang.t('nav.main_nav')">
      <div class="max-w-5xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
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
        <div class="hidden lg:flex items-center gap-1">
          <!-- Tools mega dropdown (DORA + NIS2 combined) -->
          <div class="relative">
            <button type="button" (click)="toggleToolsMenu($event)"
                    class="text-sm text-slate-400 hover:text-emerald-400 transition-colors duration-200 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-700/30">
              <svg class="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
              {{ lang.t('nav.tools') }}
              <svg class="w-3.5 h-3.5 transition-transform" [class.rotate-180]="toolsMenu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            <div *ngIf="toolsMenu" class="absolute left-0 top-full mt-1 w-64 bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl shadow-black/20 py-2 z-50">
              <a routerLink="/chat" (click)="toolsMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors mx-1 rounded-lg bg-gradient-to-r from-emerald-600/10 to-cyan-600/10 border border-emerald-500/20 mb-1">
                <div class="w-5 h-5 rounded bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 text-[8px] font-bold shrink-0">AI</div>
                DoraBot
                <span class="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full ml-auto animate-pulse">NEW</span>
              </a>
              <div class="border-t border-slate-700/30 my-1.5"></div>
              <p class="px-4 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">DORA</p>
              <a routerLink="/assessment" (click)="toolsMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-cyan-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>
                </svg>
                {{ lang.t('nav.assessment') }}
              </a>
              <a routerLink="/contract-analysis" (click)="toolsMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-emerald-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>
                </svg>
                {{ lang.t('nav.contract') }}
              </a>
              <a routerLink="/board-risk" (click)="toolsMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-teal-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                {{ lang.t('nav.board_risk') }}
              </a>
              <a routerLink="/fine-calculator" (click)="toolsMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-red-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
                </svg>
                {{ lang.t('nav.fine_calculator') }}
              </a>
              <a routerLink="/roi" (click)="toolsMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-amber-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>
                </svg>
                {{ lang.t('nav.roi') }}
                <span class="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full ml-1">NEW</span>
              </a>
              <a routerLink="/timeline" (click)="toolsMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-cyan-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {{ lang.t('nav.timeline') }}
              </a>
              <a routerLink="/vendors" (click)="toolsMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-violet-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>
                </svg>
                {{ lang.t('nav.vendors') }}
              </a>
              <a routerLink="/company-profile" (click)="toolsMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-cyan-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
                {{ lang.t('nav.company_profile') }}
              </a>
              <div class="border-t border-slate-700/30 my-1.5"></div>
              <p class="px-4 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{{ lang.t('nav.management') }}</p>
              <a routerLink="/incident-reporting" (click)="toolsMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-red-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                {{ lang.t('nav.incidents') }}
              </a>
              <a routerLink="/remediation" (click)="toolsMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-emerald-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                {{ lang.t('nav.remediation') }}
              </a>
              <a routerLink="/negotiations" (click)="toolsMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-violet-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                {{ lang.t('nav.negotiations') }}
              </a>
              <a routerLink="/maturity" (click)="toolsMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-violet-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
                </svg>
                {{ lang.t('nav.maturity') }}
              </a>
              <a routerLink="/risk-heatmap" (click)="toolsMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-orange-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
                {{ lang.t('nav.risk_heatmap') }}
              </a>
              <a routerLink="/command-center" (click)="toolsMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-cyan-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                {{ lang.t('nav.command_center') }}
                <span class="text-[9px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full ml-1">NEW</span>
              </a>
              <div class="border-t border-slate-700/30 my-1.5"></div>
              <p class="px-4 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{{ lang.t('nav.resources') }}</p>
              <a routerLink="/dora-explorer" (click)="toolsMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-emerald-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>
                </svg>
                {{ lang.t('nav.dora_explorer') }}
                <span class="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full ml-1">NEW</span>
              </a>
              <a routerLink="/policy-generator" (click)="toolsMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-violet-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/>
                </svg>
                {{ lang.t('nav.policy_generator') }}
                <span class="text-[9px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full ml-1">NEW</span>
              </a>
              <a routerLink="/framework-mapping" (click)="toolsMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-blue-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
                </svg>
                {{ lang.t('nav.framework_mapping') }}
              </a>
              <a routerLink="/cost-calculator" (click)="toolsMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-green-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                {{ lang.t('nav.cost_calculator') }}
              </a>
              <a routerLink="/training-quiz" (click)="toolsMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-pink-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                {{ lang.t('nav.training_quiz') }}
              </a>
              <a routerLink="/incident-decision-tree" (click)="toolsMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-rose-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
                </svg>
                {{ lang.t('nav.incident_classifier') }}
              </a>
              <a routerLink="/board-report" (click)="toolsMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-sky-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>
                </svg>
                {{ lang.t('nav.board_report') }}
              </a>
              <div class="border-t border-slate-700/30 my-1.5"></div>
              <p class="px-4 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">NIS2</p>
              <a routerLink="/nis2/scope-check" (click)="toolsMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-amber-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>
                </svg>
                {{ lang.t('nav.nis2_scope') }}
              </a>
              <a routerLink="/nis2/assessment" (click)="toolsMenu = false"
                 class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-orange-400 hover:bg-slate-700/30 transition-colors">
                <svg class="w-4 h-4 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>
                </svg>
                {{ lang.t('nav.nis2_assessment') }}
              </a>
            </div>
          </div>
          <!-- Lepingud [NEW] -->
          <a routerLink="/workspace" routerLinkActive="nav-link-active"
             class="text-sm text-slate-400 hover:text-violet-400 transition-colors duration-200 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-700/30">
            {{ lang.t('nav.contracts_short') }}
            <span class="px-1.5 py-0.5 text-[9px] font-bold rounded bg-violet-500/20 text-violet-400">{{ lang.t('nav.new_badge') }}</span>
          </a>
          <!-- Tarneahel [PRO] -->
          <a routerLink="/supply-chain" routerLinkActive="nav-link-active"
             class="text-sm text-slate-400 hover:text-cyan-400 transition-colors duration-200 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-700/30">
            {{ lang.t('nav.supply_short') }}
            <span class="px-1.5 py-0.5 text-[9px] font-bold rounded bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30">PRO</span>
          </a>
          <!-- Pricing -->
          <a routerLink="/pricing" routerLinkActive="nav-link-active"
             class="text-sm text-slate-400 hover:text-emerald-400 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-slate-700/30">
            {{ lang.t('nav.pricing') }}
          </a>
          <!-- Blog -->
          <a routerLink="/blog" routerLinkActive="nav-link-active"
             class="text-sm text-slate-400 hover:text-emerald-400 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-slate-700/30">
            {{ lang.t('nav.blog') }}
          </a>
          <!-- Dashboard (logged in only) -->
          @if (auth.isLoggedIn()) {
            <a routerLink="/dashboard" routerLinkActive="nav-link-active"
               class="text-sm text-slate-400 hover:text-emerald-400 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-slate-700/30">
              {{ lang.t('nav.dashboard') }}
            </a>
          }
          <div class="w-px h-5 bg-slate-700/50 mx-0.5"></div>
          <!-- Lang toggle (pill with globe icon) -->
          <button type="button" (click)="lang.toggle()"
                  aria-label="Switch language"
                  class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                         border border-slate-600/50 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400
                         hover:bg-slate-700/30 transition-all duration-200"
                  [title]="getLangLabel()">
            <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
            </svg>
            {{ lang.currentLang.toUpperCase() }}
          </button>
          <!-- Separator between lang and user -->
          <div class="w-px h-5 bg-slate-700/50 mx-1"></div>
          <!-- User avatar / Auth -->
          @if (auth.isLoggedIn()) {
            <div class="relative">
              <button type="button" (click)="toggleUserMenu($event)"
                      class="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 text-xs font-bold
                             hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 hover:scale-105">
                {{ getUserInitials() }}
              </button>
              <div *ngIf="userMenu" class="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl shadow-black/20 py-2 z-50">
                <span class="block px-4 py-1.5 text-xs text-slate-500 truncate">{{ auth.user()?.email }}</span>
                <div class="border-t border-slate-700/30 my-1"></div>
                <a routerLink="/dashboard" (click)="userMenu = false"
                   class="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-emerald-400 hover:bg-slate-700/30 transition-colors">
                  {{ lang.t('nav.my_account') }}
                </a>
                @if (subscriptionService.isPremium()) {
                  <a routerLink="/settings/branding" (click)="userMenu = false"
                     class="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-violet-400 hover:bg-slate-700/30 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
                    </svg>
                    {{ lang.t('nav.branding') }}
                  </a>
                }
                @if (auth.isAdmin()) {
                  <a routerLink="/admin/users" (click)="userMenu = false"
                     class="flex items-center gap-2 px-4 py-2 text-sm text-amber-400 hover:text-amber-300 hover:bg-slate-700/30 transition-colors">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    Admin Panel
                  </a>
                  <a routerLink="/admin/leads" (click)="userMenu = false"
                     class="flex items-center gap-2 px-4 py-2 text-sm text-amber-400 hover:text-amber-300 hover:bg-slate-700/30 transition-colors">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    Leads
                  </a>
                }
                <button type="button" (click)="restartTour(); userMenu = false"
                        class="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-cyan-400 hover:bg-slate-700/30 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  {{ lang.t('onboarding.restart_tour') }}
                </button>
                <button type="button" (click)="auth.logout(); userMenu = false"
                        class="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-700/30 transition-colors">
                  {{ lang.t('auth.logout') }}
                </button>
              </div>
            </div>
          } @else if (isBrowser) {
            <a routerLink="/login"
               class="text-sm text-emerald-400 hover:text-emerald-300 transition-colors duration-200 px-2.5 py-2 rounded-lg hover:bg-slate-700/30">
              {{ lang.t('auth.login') }}
            </a>
            <a routerLink="/register"
               class="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white
                      hover:from-emerald-400 hover:to-cyan-400 hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200">
              {{ lang.t('auth.register') }}
            </a>
          }
        </div>

        <!-- Mobile hamburger -->
        <div class="flex items-center gap-2 lg:hidden">
          <button type="button" (click)="mobileMenu = !mobileMenu"
                  [attr.aria-label]="mobileMenu ? lang.t('nav.close_menu') : lang.t('nav.open_menu')"
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
      <div *ngIf="mobileMenu" class="lg:hidden border-t border-slate-700/50 bg-slate-800/95 backdrop-blur-xl">
        <div class="px-4 py-3 flex flex-col gap-1">
          <a routerLink="/chat" (click)="mobileMenu = false"
             class="flex items-center gap-2 text-sm text-white px-3 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600/10 to-cyan-600/10 border border-emerald-500/20 mb-2">
            <div class="w-5 h-5 rounded bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 text-[8px] font-bold">AI</div>
            DoraBot
            <span class="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full ml-auto animate-pulse">NEW</span>
          </a>
          <p class="text-[10px] text-slate-600 px-3 mb-1 font-bold uppercase tracking-wider">DORA</p>
          <a routerLink="/assessment" (click)="mobileMenu = false"
             class="text-sm text-slate-400 hover:text-cyan-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.assessment') }}</a>
          <a routerLink="/contract-analysis" (click)="mobileMenu = false"
             class="text-sm text-slate-400 hover:text-emerald-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.contract') }}</a>
          <a routerLink="/board-risk" (click)="mobileMenu = false"
             class="text-sm text-slate-400 hover:text-teal-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.board_risk') }}</a>
          <a routerLink="/fine-calculator" (click)="mobileMenu = false"
             class="text-sm text-slate-400 hover:text-red-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.fine_calculator') }}</a>
          <a routerLink="/roi" (click)="mobileMenu = false"
             class="text-sm text-slate-400 hover:text-amber-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.roi') }}</a>
          <a routerLink="/timeline" (click)="mobileMenu = false"
             class="text-sm text-slate-400 hover:text-cyan-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.timeline') }}</a>
          <a routerLink="/vendors" (click)="mobileMenu = false"
             class="text-sm text-slate-400 hover:text-violet-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.vendors') }}</a>
          <a routerLink="/company-profile" (click)="mobileMenu = false"
             class="text-sm text-slate-400 hover:text-cyan-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.company_profile') }}</a>
          <div class="border-t border-slate-700/50 mt-2 pt-2">
            <p class="text-[10px] text-slate-600 px-3 mb-1 font-bold uppercase tracking-wider">{{ lang.t('nav.management') }}</p>
            <a routerLink="/command-center" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-cyan-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center justify-between">
              {{ lang.t('nav.command_center') }}
              <span class="px-1.5 py-0.5 text-[9px] font-bold rounded bg-cyan-500/20 text-cyan-400">NEW</span>
            </a>
            <a routerLink="/incident-reporting" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-red-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.incidents') }}</a>
            <a routerLink="/remediation" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-emerald-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.remediation') }}</a>
            <a routerLink="/negotiations" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-violet-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.negotiations') }}</a>
            <a routerLink="/maturity" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-violet-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.maturity') }}</a>
            <a routerLink="/risk-heatmap" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-orange-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.risk_heatmap') }}</a>
          </div>
          <div class="border-t border-slate-700/50 mt-2 pt-2">
            <p class="text-[10px] text-slate-600 px-3 mb-1 font-bold uppercase tracking-wider">{{ lang.t('nav.resources') }}</p>
            <a routerLink="/dora-explorer" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-emerald-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center justify-between">
              {{ lang.t('nav.dora_explorer') }}
              <span class="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-400">NEW</span>
            </a>
            <a routerLink="/policy-generator" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-violet-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.policy_generator') }}</a>
            <a routerLink="/framework-mapping" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-blue-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.framework_mapping') }}</a>
            <a routerLink="/cost-calculator" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-green-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.cost_calculator') }}</a>
            <a routerLink="/training-quiz" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-pink-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.training_quiz') }}</a>
            <a routerLink="/incident-decision-tree" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-rose-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.incident_classifier') }}</a>
            <a routerLink="/board-report" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-sky-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.board_report') }}</a>
          </div>
          <div class="border-t border-slate-700/50 mt-2 pt-2">
            <p class="text-[10px] text-slate-600 px-3 mb-1 font-bold uppercase tracking-wider">NIS2</p>
            <a routerLink="/nis2/scope-check" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-amber-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.nis2_scope') }}</a>
            <a routerLink="/nis2/assessment" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-orange-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.nis2_assessment') }}</a>
          </div>
          <div class="border-t border-slate-700/50 mt-2 pt-2 flex flex-col gap-1">
            <a routerLink="/workspace" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-violet-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center justify-between">
              {{ lang.t('nav.contracts_short') }}
              <span class="px-1.5 py-0.5 text-[9px] font-bold rounded bg-violet-500/20 text-violet-400">{{ lang.t('nav.new_badge') }}</span>
            </a>
            <a routerLink="/supply-chain" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-cyan-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center justify-between">
              {{ lang.t('nav.supply_short') }}
              <span class="px-1.5 py-0.5 text-[9px] font-bold rounded bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30">PRO</span>
            </a>
            <a routerLink="/pricing" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-emerald-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.pricing') }}</a>
            <a routerLink="/blog" (click)="mobileMenu = false"
               class="text-sm text-slate-400 hover:text-emerald-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.blog') }}</a>
          </div>
          @if (auth.isLoggedIn()) {
            <div class="border-t border-slate-700/50 mt-2 pt-2">
              <a routerLink="/dashboard" (click)="mobileMenu = false"
                 class="text-sm text-slate-400 hover:text-emerald-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('nav.dashboard') }}</a>
              @if (subscriptionService.isPremium()) {
                <a routerLink="/settings/branding" (click)="mobileMenu = false"
                   class="text-sm text-slate-400 hover:text-violet-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
                  </svg>
                  {{ lang.t('nav.branding') }}
                </a>
              }
              @if (auth.isAdmin()) {
                <a routerLink="/admin/users" (click)="mobileMenu = false"
                   class="text-sm text-amber-400 hover:text-amber-300 px-3 py-2 rounded-lg hover:bg-slate-700/30">Admin Panel</a>
                <a routerLink="/admin/leads" (click)="mobileMenu = false"
                   class="text-sm text-amber-400 hover:text-amber-300 px-3 py-2 rounded-lg hover:bg-slate-700/30">Leads</a>
              }
              <span class="text-xs text-slate-500 px-3 mt-1 block">{{ auth.user()?.email }}</span>
              <button type="button" (click)="restartTour(); mobileMenu = false"
                      class="w-full text-left text-sm text-slate-400 hover:text-cyan-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 mt-1 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                {{ lang.t('onboarding.restart_tour') }}
              </button>
              <button type="button" (click)="auth.logout(); mobileMenu = false"
                      class="w-full text-left text-sm text-red-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 mt-1">{{ lang.t('auth.logout') }}</button>
            </div>
          } @else if (isBrowser) {
            <div class="border-t border-slate-700/50 mt-2 pt-2 flex flex-col gap-1">
              <a routerLink="/login" (click)="mobileMenu = false"
                 class="text-sm text-emerald-400 px-3 py-2 rounded-lg hover:bg-slate-700/30">{{ lang.t('auth.login') }}</a>
              <a routerLink="/register" (click)="mobileMenu = false"
                 class="text-sm text-white bg-emerald-500/20 px-3 py-2 rounded-lg hover:bg-emerald-500/30 text-center">{{ lang.t('auth.register') }}</a>
            </div>
          }
          <div class="border-t border-slate-700/50 mt-2 pt-2">
            <button type="button" (click)="lang.toggle(); mobileMenu = false"
                    class="w-full text-left text-sm text-slate-400 px-3 py-2 rounded-lg hover:bg-slate-700/30 flex items-center gap-2">
              <svg class="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
              </svg>
              {{ getLangLabel() }} ({{ lang.currentLang.toUpperCase() }})
            </button>
          </div>
        </div>
      </div>
    </nav>
    <main id="main-content" class="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
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
              <a routerLink="/fine-calculator" class="text-xs text-slate-500 hover:text-red-400 transition-colors">{{ lang.t('nav.fine_calculator') }}</a>
              <a routerLink="/vendors" class="text-xs text-slate-500 hover:text-violet-400 transition-colors">{{ lang.t('nav.vendors') }}</a>
              <a routerLink="/roi" class="text-xs text-slate-500 hover:text-amber-400 transition-colors">{{ lang.t('nav.roi') }}</a>
            </div>
          </div>

          <!-- Company -->
          <div>
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{{ lang.t('footer.company') }}</h4>
            <div class="flex flex-col gap-2">
              <a routerLink="/about" class="text-xs text-slate-500 hover:text-emerald-400 transition-colors">{{ lang.t('nav.about') }}</a>
              <a routerLink="/methodology" class="text-xs text-slate-500 hover:text-emerald-400 transition-colors">{{ lang.t('nav.methodology') }}</a>
              <a routerLink="/pricing" class="text-xs text-slate-500 hover:text-emerald-400 transition-colors">{{ lang.t('nav.pricing') }}</a>
              <a routerLink="/blog" class="text-xs text-slate-500 hover:text-emerald-400 transition-colors">{{ lang.t('nav.blog') }}</a>
              <a routerLink="/privacy" class="text-xs text-slate-500 hover:text-emerald-400 transition-colors">{{ lang.t('footer.privacy') }}</a>
              <a routerLink="/terms" class="text-xs text-slate-500 hover:text-emerald-400 transition-colors">{{ lang.t('footer.terms') }}</a>
              <button type="button" (click)="openCookieSettings()" class="text-xs text-slate-500 hover:text-emerald-400 transition-colors text-left">{{ lang.t('cookie.settings') }}</button>
            </div>
          </div>

          <!-- Contact -->
          <div>
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{{ lang.t('footer.contact') }}</h4>
            <div class="flex flex-col gap-2 text-xs text-slate-500">
              <a href="mailto:info@doraaudit.eu" class="hover:text-emerald-400 transition-colors">info&#64;doraaudit.eu</a>
              <p>Doraaudit</p>
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
          <p class="text-xs text-slate-600">&copy; 2026 Doraaudit. {{ lang.t('footer.rights') }}</p>
          <div class="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center">
            <p class="text-[10px] text-slate-700">{{ lang.t('footer.regulation') }}</p>
            <p class="text-[10px] text-slate-700">{{ lang.t('footer.disclaimer') }}</p>
          </div>
        </div>
      </div>
    </footer>
    <app-cookie-consent></app-cookie-consent>
    @defer (when showOnboarding) {
      <app-onboarding (completed)="showOnboarding = false"></app-onboarding>
    }

    <app-chat-widget></app-chat-widget>

    <!-- Toast notifications -->
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm" *ngIf="toast.toasts().length > 0">
      <div *ngFor="let t of toast.toasts()" (click)="toast.dismiss(t.id)"
           class="px-4 py-3 rounded-lg shadow-lg cursor-pointer text-sm font-medium animate-slide-in backdrop-blur-xl border"
           [ngClass]="{
             'bg-red-500/90 text-white border-red-400': t.type === 'error',
             'bg-amber-500/90 text-white border-amber-400': t.type === 'warning',
             'bg-emerald-500/90 text-white border-emerald-400': t.type === 'success',
             'bg-slate-700/90 text-white border-slate-600': t.type === 'info'
           }">
        {{ t.message }}
      </div>
    </div>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild(CookieConsentComponent) cookieConsent?: CookieConsentComponent;
  mobileMenu = false;
  toolsMenu = false;
  userMenu = false;
  showOnboarding = false;
  private routerSub?: Subscription;
  isBrowser: boolean;

  private pageTitles: { [path: string]: { et: string; en: string } } = {
    '/': { et: 'DoraAudit.eu - DORA & NIS2 Vastavuskontroll', en: 'DoraAudit.eu - DORA & NIS2 Compliance' },
    '/pricing': { et: 'Hinnakiri | DoraAudit.eu', en: 'Pricing | DoraAudit.eu' },
    '/nis2/scope-check': { et: 'NIS2 Scope Checker | DoraAudit.eu', en: 'NIS2 Scope Checker | DoraAudit.eu' },
    '/nis2/assessment': { et: 'NIS2 Hindamine | DoraAudit.eu', en: 'NIS2 Assessment | DoraAudit.eu' },
    '/nis2/results': { et: 'NIS2 Tulemused | DoraAudit.eu', en: 'NIS2 Results | DoraAudit.eu' },
    '/assessment': { et: 'DORA Hindamine | DoraAudit.eu', en: 'DORA Assessment | DoraAudit.eu' },
    '/results': { et: 'Hindamise Tulemused | DoraAudit.eu', en: 'Assessment Results | DoraAudit.eu' },
    '/contract-analysis': { et: 'Lepingu Analüüs | DoraAudit.eu', en: 'Contract Analysis | DoraAudit.eu' },
    '/contract-results': { et: 'Lepinguanalüüsi Tulemused | DoraAudit.eu', en: 'Contract Analysis Results | DoraAudit.eu' },
    '/contract-comparison': { et: 'Lepingute Võrdlus | DoraAudit.eu', en: 'Contract Comparison | DoraAudit.eu' },
    '/contract-generator': { et: 'Lepingu Generaator | DoraAudit.eu', en: 'Contract Generator | DoraAudit.eu' },
    '/contract-checklist': { et: 'DORA Art. 30 Kontrollnimekiri | DoraAudit.eu', en: 'DORA Art. 30 Contract Checklist | DoraAudit.eu' },
    '/bulk-analysis': { et: 'Hulgianalüüs | DoraAudit.eu', en: 'Bulk Contract Analysis | DoraAudit.eu' },
    '/payment/success': { et: 'Makse Õnnestus | DoraAudit.eu', en: 'Payment Successful | DoraAudit.eu' },
    '/login': { et: 'Sisene | DoraAudit.eu', en: 'Login | DoraAudit.eu' },
    '/register': { et: 'Registreeri | DoraAudit.eu', en: 'Register | DoraAudit.eu' },
    '/forgot-password': { et: 'Unustasid parooli | DoraAudit.eu', en: 'Forgot Password | DoraAudit.eu' },
    '/reset-password': { et: 'Parooli Lähtestamine | DoraAudit.eu', en: 'Reset Password | DoraAudit.eu' },
    '/about': { et: 'Meist | DoraAudit.eu', en: 'About | DoraAudit.eu' },
    '/privacy': { et: 'Privaatsuspoliitika | DoraAudit.eu', en: 'Privacy Policy | DoraAudit.eu' },
    '/terms': { et: 'Kasutustingimused | DoraAudit.eu', en: 'Terms of Service | DoraAudit.eu' },
    '/methodology': { et: 'Metoodika | DoraAudit.eu', en: 'Methodology | DoraAudit.eu' },
    '/board-risk': { et: 'Juhatuse riskikalkulaator | DoraAudit.eu', en: 'Board Risk Calculator | DoraAudit.eu' },
    '/board-report': { et: 'Juhatuse Raport | DoraAudit.eu', en: 'Board Compliance Report | DoraAudit.eu' },
    '/workspace': { et: 'Lepingute Töölaud | DoraAudit.eu', en: 'Contract Workspace | DoraAudit.eu' },
    '/fine-calculator': { et: 'Trahvikalkulaator | DoraAudit.eu', en: 'Fine Calculator | DoraAudit.eu' },
    '/cost-calculator': { et: 'DORA Kulukalkulaator | DoraAudit.eu', en: 'DORA Cost Calculator | DoraAudit.eu' },
    '/timeline': { et: 'Regulatiivne Ajakava | DoraAudit.eu', en: 'Regulatory Timeline | DoraAudit.eu' },
    '/vendors': { et: 'ICT Teenusepakkujate Andmebaas | DoraAudit.eu', en: 'ICT Vendor Database | DoraAudit.eu' },
    '/company-profile': { et: 'Ettevõtte DORA Profiil | DoraAudit.eu', en: 'Company DORA Profile | DoraAudit.eu' },
    '/supply-chain': { et: 'ICT Tarneahela Haldus | DoraAudit.eu', en: 'ICT Supply Chain Management | DoraAudit.eu' },
    '/dashboard': { et: 'Juhtpaneel | DoraAudit.eu', en: 'Dashboard | DoraAudit.eu' },
    '/history': { et: 'Hindamiste Ajalugu | DoraAudit.eu', en: 'Assessment History | DoraAudit.eu' },
    '/certificate': { et: 'Vastavustunnistus | DoraAudit.eu', en: 'Compliance Certificate | DoraAudit.eu' },
    '/settings/branding': { et: 'Brändi Seaded | DoraAudit.eu', en: 'Branding Settings | DoraAudit.eu' },
    '/settings/sso': { et: 'SSO Seaded | DoraAudit.eu', en: 'SSO Settings | DoraAudit.eu' },
    '/playbook': { et: 'DORA Tegevuskava | DoraAudit.eu', en: 'DORA Action Playbook | DoraAudit.eu' },
    '/comparison': { et: 'DoraAudit vs Konkurendid | DoraAudit.eu', en: 'DoraAudit vs Competitors | DoraAudit.eu' },
    '/incident-simulator': { et: 'Intsidendi Simulaator | DoraAudit.eu', en: 'Incident Simulator | DoraAudit.eu' },
    '/incident-reporting': { et: 'Intsidentidest Teavitamine | DoraAudit.eu', en: 'Incident Reporting | DoraAudit.eu' },
    '/incident-decision-tree': { et: 'Intsidendi Klassifikaator | DoraAudit.eu', en: 'Incident Classification Tool | DoraAudit.eu' },
    '/guardian': { et: 'Guardian Monitooring | DoraAudit.eu', en: 'Guardian Monitoring | DoraAudit.eu' },
    '/guardian/alerts': { et: 'Guardian Teavitused | DoraAudit.eu', en: 'Guardian Alerts | DoraAudit.eu' },
    '/remediation': { et: 'Paranduskava | DoraAudit.eu', en: 'Remediation Tracker | DoraAudit.eu' },
    '/roi': { et: 'Teaberegister | DoraAudit.eu', en: 'Register of Information | DoraAudit.eu' },
    '/regulatory-updates': { et: 'Regulatiivsed Uuendused | DoraAudit.eu', en: 'Regulatory Updates | DoraAudit.eu' },
    '/blog': { et: 'DORA & NIS2 Blogi | DoraAudit.eu', en: 'DORA & NIS2 Blog | DoraAudit.eu' },
    '/dora-explorer': { et: 'DORA Regulatsiooni Sirvija | DoraAudit.eu', en: 'DORA Regulation Explorer | DoraAudit.eu' },
    '/policy-generator': { et: 'Poliitikadokumentide Generaator | DoraAudit.eu', en: 'Policy Document Generator | DoraAudit.eu' },
    '/framework-mapping': { et: 'Raamistike Kaardistus | DoraAudit.eu', en: 'Framework Compliance Mapping | DoraAudit.eu' },
    '/training-quiz': { et: 'DORA Koolitustest | DoraAudit.eu', en: 'DORA Training Quiz | DoraAudit.eu' },
    '/tlpt': { et: 'TLPT Moodul | DoraAudit.eu', en: 'TLPT Module | DoraAudit.eu' },
    '/concentration-risk': { et: 'Kontsentratsioonianalüüs | DoraAudit.eu', en: 'Concentration Risk Analysis | DoraAudit.eu' },
    '/training': { et: 'Koolituste Jälgimine | DoraAudit.eu', en: 'Training Tracker | DoraAudit.eu' },
    '/maturity': { et: 'Küpsusmudeli Hindamine | DoraAudit.eu', en: 'Maturity Model Assessment | DoraAudit.eu' },
    '/compliance-trend': { et: 'Vastavuse Trend | DoraAudit.eu', en: 'Compliance Trend | DoraAudit.eu' },
    '/risk-heatmap': { et: 'Riski Soojuskaart | DoraAudit.eu', en: 'Risk Heat Map | DoraAudit.eu' },
    '/exit-strategies': { et: 'Väljumisstrateegia | DoraAudit.eu', en: 'Exit Strategies | DoraAudit.eu' },
    '/audit-trail': { et: 'Auditijälg | DoraAudit.eu', en: 'Audit Trail | DoraAudit.eu' },
    '/info-sharing': { et: 'Teabevahetus | DoraAudit.eu', en: 'Information Sharing | DoraAudit.eu' },
    '/team': { et: 'Meeskonna Haldus | DoraAudit.eu', en: 'Team Management | DoraAudit.eu' },
    '/group-entities': { et: 'Grupi Ettevõtted | DoraAudit.eu', en: 'Group Entity Management | DoraAudit.eu' },
    '/command-center': { et: 'Juhtimiskeskus | DoraAudit.eu', en: 'Compliance Command Center | DoraAudit.eu' },
    '/trust-seal': { et: 'DORA Usaldusmärk | DoraAudit.eu', en: 'DORA Trust Seal | DoraAudit.eu' },
    '/vendor-questionnaires': { et: 'Tarnija Küsimustikud | DoraAudit.eu', en: 'Vendor Questionnaires | DoraAudit.eu' },
    '/vendor-survey': { et: 'Tarnija Enesehindamine | DoraAudit.eu', en: 'Vendor Self-Assessment | DoraAudit.eu' },
    '/negotiations': { et: 'Läbirääkimised | DoraAudit.eu', en: 'Negotiations | DoraAudit.eu' },
    '/integrations': { et: 'Integratsioonid | DoraAudit.eu', en: 'Integrations | DoraAudit.eu' },
    '/pillar': { et: 'DORA Samba Detailid | DoraAudit.eu', en: 'DORA Pillar Details | DoraAudit.eu' },
    '/admin/users': { et: 'Admin – Kasutajad | DoraAudit.eu', en: 'Admin – Users | DoraAudit.eu' },
    '/admin/leads': { et: 'Admin – Kontaktid | DoraAudit.eu', en: 'Admin – Leads | DoraAudit.eu' },
  };

  private pageDescriptions: { [path: string]: { et: string; en: string } } = {
    '/': { et: 'DORA ja NIS2 vastavuskontroll Baltikumi ettevõtetele. Tasuta NIS2 scope check, lepinguanalüüs ja juhatuse riskikalkulaator.', en: 'DORA and NIS2 compliance for Baltic companies. Free NIS2 scope check, contract analysis and board risk calculator.' },
    '/pricing': { et: 'DoraAudit.eu hinnad. DORA ja NIS2 vastavuskontroll alates €149/kuu. Tasuta kiirkontroll, Professional €149, Business €299, Enterprise €499.', en: 'DoraAudit.eu pricing. DORA and NIS2 compliance from €149/month. Free quick check, Professional €149, Business €299, Enterprise €499.' },
    '/nis2/scope-check': { et: 'Kontrolli tasuta kas NIS2 direktiiv kohaldub sinu ettevõttele. Sisesta registrikood ja saa kohene tulemus.', en: 'Check for free if NIS2 directive applies to your company. Enter registry code and get instant results.' },
    '/nis2/assessment': { et: 'NIS2 vastavushindamine Baltikumi ettevõtetele. E-ITS ja KüTS nõuetele vastav tegevuskava.', en: 'NIS2 compliance assessment for Baltic companies. Action plan aligned with E-ITS and KüTS requirements.' },
    '/nis2/results': { et: 'NIS2 vastavushindamise tulemused ja tegevuskava.', en: 'NIS2 compliance assessment results and action plan.' },
    '/assessment': { et: 'DORA täishindamine 37 küsimusega. Detailne tegevuskava ja PDF raport juhatusele.', en: 'Full DORA assessment with 37 questions. Detailed action plan and PDF report for the board.' },
    '/results': { et: 'DORA vastavushindamise tulemused. Detailne analüüs sambade kaupa ja soovitused.', en: 'DORA compliance assessment results. Detailed pillar-by-pillar analysis and recommendations.' },
    '/contract-analysis': { et: 'DORA Art. 30 lepinguanalüüs. Kontrolli kas sinu IKT-leping vastab regulatsiooni nõuetele.', en: 'DORA Art. 30 contract analysis. Check if your ICT contract meets regulatory requirements.' },
    '/contract-results': { et: 'IKT lepingu DORA Art. 30 vastavusanalüüsi tulemused ja puuduste aruanne.', en: 'ICT contract DORA Art. 30 compliance analysis results and gap report.' },
    '/contract-comparison': { et: 'Lepinguversioonide võrdlus. Vaata kuidas parandused mõjutavad DORA vastavust.', en: 'Contract version comparison. See how amendments affect DORA compliance.' },
    '/contract-generator': { et: 'DORA Art. 30 nõuetele vastav IKT-lepingu generaator. Automaatselt kõik nõutud klauslid.', en: 'DORA Art. 30 compliant ICT contract generator. Automatically includes all required clauses.' },
    '/contract-checklist': { et: 'Kontrolli kas sinu IKT-lepingud sisaldavad kõiki DORA Art. 30 kohustuslikke klausleid.', en: 'Check if your ICT contracts contain all mandatory DORA Article 30 clauses.' },
    '/bulk-analysis': { et: 'Laadi üles ja analüüsi kuni 50 lepingut korraga. Saa portfelli-tasemel DORA vastavuse ülevaade.', en: 'Upload and analyze up to 50 contracts at once. Get a portfolio-level DORA compliance overview.' },
    '/board-risk': { et: 'NIS2 ja DORA juhatuse liikme isikliku vastutuse kalkulaator. Arvuta oma riskieksposuur 2 minutiga.', en: 'NIS2 and DORA board member personal liability calculator. Calculate your risk exposure in 2 minutes.' },
    '/board-report': { et: 'Genereeri professionaalne DORA vastavusraport juhatusele ühe klikiga.', en: 'Generate a professional board-ready DORA compliance report with one click.' },
    '/methodology': { et: 'DORA vastavushindamise metoodika. Kuidas hindame IKT-lepinguid Art. 30 nõuete vastu.', en: 'DORA compliance assessment methodology. How we evaluate ICT contracts against Art. 30 requirements.' },
    '/about': { et: 'DoraAudit.eu - DORA ja NIS2 vastavuskontrolli platvorm Eesti finantsettevõtetele.', en: 'DoraAudit.eu - DORA and NIS2 compliance platform for European financial companies.' },
    '/privacy': { et: 'DoraAudit.eu privaatsuspoliitika. Kuidas me kasutame ja kaitseme teie andmeid.', en: 'DoraAudit.eu privacy policy. How we use and protect your data.' },
    '/terms': { et: 'DoraAudit.eu kasutustingimused. Teenuse kasutamise õigused ja kohustused.', en: 'DoraAudit.eu terms of service. Rights and obligations of using the service.' },
    '/workspace': { et: 'IKT lepingute töölaud DORA, GDPR, NIS2 ja SLA vastavuskontrolliks. Multiregulatiivne analüüs ja meeskonnatöö.', en: 'ICT contract workspace for DORA, GDPR, NIS2 and SLA compliance. Multi-regulatory analysis and team collaboration.' },
    '/fine-calculator': { et: 'DORA trahvikalkulaator. Arvuta võimalik trahvisumma mittevastavuse korral Art. 50-51 alusel.', en: 'DORA fine calculator. Calculate potential penalty for non-compliance under Art. 50-51.' },
    '/cost-calculator': { et: 'Hinda DORA vastavuse investeeringut. Arvuta kulud vs võimalikud trahvid ja vaata vastavuse tasuvust.', en: 'Estimate your DORA compliance investment. Calculate costs vs potential fines and see ROI.' },
    '/timeline': { et: 'DORA ja NIS2 regulatiivne ajakava. Kõik olulised tähtajad, verstapostid ja RTS/ITS standardid ühes kohas.', en: 'DORA and NIS2 regulatory timeline. All key deadlines, milestones and RTS/ITS standards in one place.' },
    '/vendors': { et: 'ICT teenusepakkujate DORA vastavuse andmebaas. Anonümiseeritud andmed lepinguanalüüsidest ja crowdsourced riskihinnangud.', en: 'ICT vendor DORA compliance database. Anonymized contract analysis data and crowdsourced risk ratings.' },
    '/company-profile': { et: 'Ettevõtte DORA digitaalse vastupidavuse profiil. Turvapäised, SSL ja vastavusandmed.', en: 'Company DORA digital resilience profile. Security headers, SSL and compliance data.' },
    '/supply-chain': { et: 'DORA tarneahela haldus. Nth-party monitooring, CTPP tõrkesimulatsioon ja intsidendi juhtimiskeskus.', en: 'DORA supply chain management. Nth-party monitoring, CTPP failure simulation, and incident command center.' },
    '/dashboard': { et: 'Sinu DORA vastavuse juhtpaneel. Hindamised, lepingud ja vastavuse ülevaade ühes kohas.', en: 'Your DORA compliance dashboard. Assessments, contracts, and compliance overview in one place.' },
    '/history': { et: 'Varasemad DORA vastavushindamised. Võrdle tulemusi ja jälgi arengut.', en: 'Previous DORA compliance assessments. Compare results and track progress over time.' },
    '/certificate': { et: 'DORA vastavustunnistus. Tõenda oma organisatsiooni digitaalset vastupidavust.', en: 'DORA compliance certificate. Demonstrate your organization digital operational resilience.' },
    '/settings/branding': { et: 'Kohanda raportite ja sertifikaatide brändi oma ettevõtte logoga.', en: 'Customize report and certificate branding with your company logo.' },
    '/settings/sso': { et: 'Seadista SAML2 või OIDC ühekordne sisselogimine oma organisatsioonile.', en: 'Configure SAML2 or OIDC Single Sign-On for your organization.' },
    '/login': { et: 'Sisene oma DoraAudit.eu kontole. DORA ja NIS2 vastavuskontrolli platvorm.', en: 'Log in to your DoraAudit.eu account. DORA and NIS2 compliance platform.' },
    '/register': { et: 'Loo tasuta DoraAudit.eu konto. Alusta DORA ja NIS2 vastavuskontrolliga.', en: 'Create a free DoraAudit.eu account. Start your DORA and NIS2 compliance journey.' },
    '/forgot-password': { et: 'Lähtesta oma DoraAudit.eu konto parool.', en: 'Reset your DoraAudit.eu account password.' },
    '/reset-password': { et: 'Loo uus parool oma DoraAudit.eu kontole.', en: 'Create a new password for your DoraAudit.eu account.' },
    '/payment/success': { et: 'Makse õnnestus. Sinu DoraAudit.eu plaan on uuendatud.', en: 'Payment successful. Your DoraAudit.eu plan has been upgraded.' },
    '/playbook': { et: 'Personaalne DORA tegevuskava. Samm-sammuline plaan hindamistulemuste põhjal.', en: 'Personalized DORA action playbook. Step-by-step plan based on your assessment results.' },
    '/comparison': { et: 'DoraAudit vs teised DORA vastavuskontrolli platvormid. Funktsioonide võrdlus ja Baltikumi fookus.', en: 'DoraAudit vs other DORA compliance platforms. Feature comparison with Baltic market focus.' },
    '/incident-simulator': { et: 'IKT intsidendi simulaator. Harjuta DORA-nõuetele vastavat intsidentide klassifitseerimist ja raporteerimist.', en: 'ICT incident simulator. Practice DORA-compliant incident classification and reporting workflows.' },
    '/incident-reporting': { et: 'DORA Art. 19 IKT intsidentidest teavitamise töövoog. Alg-, vahe- ja lõpparuanded.', en: 'DORA Article 19 ICT incident reporting workflow. Manage initial, intermediate, and final reports.' },
    '/incident-decision-tree': { et: 'Interaktiivne IKT intsidentide klassifitseerimise otsustuspuu. Määra kas intsident nõuab regulaatorile raporteerimist.', en: 'Interactive ICT incident classification decision tree. Determine if your incident requires regulatory reporting.' },
    '/guardian': { et: 'Lepingute monitooring ja teavitused. Jälgi DORA vastavuse muutusi reaalajas.', en: 'Contract monitoring and alerts. Track DORA compliance changes in real time.' },
    '/guardian/alerts': { et: 'Guardian teavituste haldamine. Vaata ja halda lepingute monitooringu märguandeid.', en: 'Guardian alert management. View and manage contract monitoring notifications.' },
    '/remediation': { et: 'DORA paranduskava jälgimine. Monitoori paranduste ja täiustuste edenemist.', en: 'DORA remediation tracking. Monitor progress of fixes and improvements across all five DORA pillars.' },
    '/roi': { et: 'DORA Art. 28(3) Teaberegister. Hallake IKT-teenusepakkujate lepingute registrit.', en: 'DORA Art. 28(3) Register of Information. Manage ICT service provider contract register.' },
    '/regulatory-updates': { et: 'DORA regulatiivsed uuendused. RTS, ITS ja juhendite viimased arengud.', en: 'DORA regulatory updates. Latest developments in RTS, ITS standards and guidelines.' },
    '/blog': { et: 'Praktilised juhendid ja artiklid DORA ja NIS2 regulatsioonide kohta. IKT lepingute nõuded, intsidentidest teavitamine, teaberegister ja palju muud.', en: 'Practical guides and articles about DORA and NIS2 compliance. ICT contract requirements, incident reporting, register of information, and more.' },
    '/dora-explorer': { et: 'Interaktiivne DORA määruse sirvija. Otsi artikleid, loe selgitusi ja mõista vastavusnõudeid.', en: 'Interactive DORA regulation browser. Search articles, read explanations, and understand compliance requirements.' },
    '/policy-generator': { et: 'Genereeri valmis DORA-vastavad poliitikadokumendid. IKT riskihaldus, intsidendireageerimine, äritegevuse jätkuvus.', en: 'Generate complete DORA-compliant policy documents. ICT risk management, incident response, business continuity.' },
    '/framework-mapping': { et: 'DORA kaardistus ISO 27001, NIS2, GDPR ja COBIT raamistikele. Arvuta olemasolev katvus.', en: 'Map DORA to ISO 27001, NIS2, GDPR and COBIT frameworks. Calculate your existing compliance coverage.' },
    '/training-quiz': { et: 'Interaktiivne DORA koolitustest töötajatele. Testi oma meeskonna teadmisi IKT riskihaldusest.', en: 'Interactive DORA training quiz for staff. Test team knowledge on ICT risk management and digital resilience.' },
    '/tlpt': { et: 'DORA Art. 26-27 ohupõhine läbistustestimine. Planeeri ja jälgi TLPT teste TIBER-EU raamistikus.', en: 'DORA Article 26-27 Threat-Led Penetration Testing. Plan and track TLPT tests with TIBER-EU framework.' },
    '/concentration-risk': { et: 'DORA Art. 29 IKT teenusepakkujate kontsentratsiooniriski analüüs.', en: 'DORA Article 29 ICT provider concentration risk analysis. Identify over-reliance on single providers.' },
    '/training': { et: 'DORA koolituste jälgimine juhatuse liikmetele ja töötajatele.', en: 'Track DORA-required training completion for board members and staff.' },
    '/maturity': { et: 'DORA vastavuse küpsusmudelil põhinev hindamine 0-5 skaalal.', en: 'DORA compliance maturity assessment on a 0-5 scale across all five DORA pillars.' },
    '/compliance-trend': { et: 'DORA vastavuse arengu jälgimine. Ajalooliste hindamiste võrdlus ja edenemise visualiseerimine.', en: 'Track DORA compliance improvement over time. Historical assessment comparison and progress visualisation.' },
    '/risk-heatmap': { et: 'DORA vastavusriskide visuaalne soojuskaart sambade ja kategooriate kaupa.', en: 'Visual heat map of DORA compliance risks by pillar and category. Identify highest-risk areas at a glance.' },
    '/exit-strategies': { et: 'DORA Art. 28 ja 30 väljumisstrateegia haldus kriitiliste IKT teenusepakkujate jaoks.', en: 'DORA Art. 28 & 30 exit strategy management for critical ICT providers.' },
    '/audit-trail': { et: 'Eksporditav vastavustegevuste logi regulaatoritele. DORA vastavuse tõendusmaterjal.', en: 'Exportable compliance activity log for regulators. Evidence of DORA compliance activities.' },
    '/info-sharing': { et: 'DORA Art. 45 küberohuteavet jagamise haldus. ISAC, CERT ja kahepoolsed kokkulepped.', en: 'DORA Article 45 cyber threat intelligence sharing. Track ISAC, CERT and bilateral arrangements.' },
    '/team': { et: 'Halda oma organisatsiooni, kutsu meeskonnaliikmeid ja tee koostööd DORA vastavuses.', en: 'Manage your organization, invite team members, and collaborate on DORA compliance.' },
    '/group-entities': { et: 'DORA Art. 11 konsolideeritud digitaalse vastupidavuse haldus finantsgruppidele.', en: 'DORA Art. 11 consolidated digital operational resilience management for financial groups.' },
    '/command-center': { et: 'Reaalajas DORA vastavuse ülevaade. Jälgi sambate tervist, tähtaegu ja kõiki mooduleid.', en: 'Real-time DORA compliance overview. Monitor pillar health, track deadlines, and manage all modules.' },
    '/trust-seal': { et: 'Saa DORA vastavuse märgis oma veebilehele. Näita klientidele oma digitaalset vastupidavust.', en: 'Get a DORA compliance badge for your website. Show clients your digital operational resilience.' },
    '/vendor-questionnaires': { et: 'Saada DORA vastavuse küsimustikud oma IKT teenusepakkujatele.', en: 'Send DORA compliance questionnaires to your ICT service providers.' },
    '/vendor-survey': { et: 'IKT teenusepakkuja DORA enesehindamise küsimustik.', en: 'ICT service provider DORA self-assessment questionnaire.' },
    '/negotiations': { et: 'Halda DORA lepinguvastavuse läbirääkimisi tarnijatega.', en: 'Manage DORA contract compliance negotiations with vendors.' },
    '/integrations': { et: 'Ühenda Slack, Microsoft Teams ja webhookid reaalajas DORA teavituste saamiseks.', en: 'Connect Slack, Microsoft Teams, and webhooks for real-time DORA compliance notifications.' },
    '/pillar': { et: 'DORA samba detailne ülevaade ja vastavusnõuded.', en: 'DORA pillar detailed overview and compliance requirements.' },
  };

  constructor(
    public lang: LangService,
    public auth: AuthService,
    private router: Router,
    private titleService: Title,
    private meta: Meta,
    private trackingService: TrackingService,
    public subscriptionService: SubscriptionService,
    public toast: ToastService,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    // Update title, hreflang, and html lang attribute when language changes
    effect(() => {
      const currentLang = this.lang.lang(); // Subscribe to language signal
      this.updatePageTitle(this.router.url);
      this.updateHreflangTags(this.router.url);
      // Update html lang attribute for accessibility and SEO
      if (this.isBrowser) {
        this.document.documentElement.lang = currentLang;
      }
    });

    // Force nav re-render after hydration and on every auth state change
    afterNextRender(() => this.cdr.detectChanges());
    toObservable(this.auth.isLoggedIn).pipe(
      skip(1),
      takeUntilDestroyed()
    ).subscribe(() => this.cdr.detectChanges());
  }

  ngOnInit() {
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updatePageTitle(event.urlAfterRedirects);
      this.updateHreflangTags(event.urlAfterRedirects);
      this.closeAllMenus();
      // Track page view on navigation
      if (this.isBrowser) {
        this.trackingService.trackPageView(event.urlAfterRedirects);
      }
    });

    // Set initial title and hreflang
    this.updatePageTitle(this.router.url);
    this.updateHreflangTags(this.router.url);

    // Initialize tracking only if user has already given consent
    if (this.isBrowser && this.trackingService.hasConsent()) {
      this.trackingService.initAllTracking();
      this.trackingService.trackPageView(this.router.url);

      // Show onboarding wizard on first Enterprise login
      if (typeof localStorage !== 'undefined' && !localStorage.getItem('onboarding_complete') && this.auth.isLoggedIn()
          && this.subscriptionService.currentPlan() === 'ENTERPRISE') {
        this.showOnboarding = true;
      }
    }
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  private static readonly LANG_PREFIXES = /^\/(?:en|et|lv|lt)(\/|$)/;

  private stripLangPrefix(path: string): string {
    return path.replace(AppComponent.LANG_PREFIXES, '/');
  }

  private resolvePath(path: string): string {
    if (this.pageTitles[path]) return path;
    // Strip trailing dynamic segment for routes like /results/:id, /pillar/:id
    const parent = path.replace(/\/[^/]+$/, '');
    if (parent && this.pageTitles[parent]) return parent;
    return path;
  }

  private updatePageTitle(url: string) {
    const rawPath = url.split('?')[0];
    const stripped = this.stripLangPrefix(rawPath);
    const path = this.resolvePath(stripped);
    const titleEntry = this.pageTitles[path];
    const title = titleEntry
      ? (this.lang.currentLang === 'et' ? titleEntry.et : titleEntry.en)
      : 'DoraAudit.eu';
    this.titleService.setTitle(title);

    // Update meta description
    const descEntry = this.pageDescriptions[path] || this.pageDescriptions['/'];
    const description = this.lang.currentLang === 'et' ? descEntry.et : descEntry.en;
    this.meta.updateTag({ name: 'description', content: description });

    // Update canonical URL — use lang-prefixed path
    const langPrefix = `/${this.lang.currentLang}`;
    const canonicalPath = path === '/' ? langPrefix : `${langPrefix}${path}`;
    const canonicalUrl = `https://doraaudit.eu${canonicalPath}`;
    this.updateCanonicalUrl(canonicalUrl);

    // Update Open Graph tags
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: 'DoraAudit.eu' });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ property: 'og:image', content: 'https://doraaudit.eu/assets/og-image.png' });
    const localeMap: Record<string, string> = { et: 'et_EE', en: 'en_US', lv: 'lv_LV', lt: 'lt_LT' };
    this.meta.updateTag({ property: 'og:locale', content: localeMap[this.lang.currentLang] || 'en_US' });

    // Update Twitter Card tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: 'https://doraaudit.eu/assets/og-image.png' });
  }

  private updateCanonicalUrl(url: string) {
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

  private updateHreflangTags(url: string) {
    const rawPath = url.split('?')[0];
    const path = this.stripLangPrefix(rawPath);
    const suffix = path === '/' ? '' : path;

    // Remove existing hreflang tags
    this.document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());

    // Create hreflang tags for en, et, and x-default
    const langs = ['en', 'et'];
    for (const lang of langs) {
      const link = this.document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', lang);
      link.setAttribute('href', `https://doraaudit.eu/${lang}${suffix}`);
      this.document.head.appendChild(link);
    }

    // x-default points to English version
    const xDefault = this.document.createElement('link');
    xDefault.setAttribute('rel', 'alternate');
    xDefault.setAttribute('hreflang', 'x-default');
    xDefault.setAttribute('href', `https://doraaudit.eu/en${suffix}`);
    this.document.head.appendChild(xDefault);
  }

  toggleToolsMenu(event: Event) {
    event.stopPropagation();
    this.userMenu = false;
    this.toolsMenu = !this.toolsMenu;
  }

  toggleUserMenu(event: Event) {
    event.stopPropagation();
    this.toolsMenu = false;
    this.userMenu = !this.userMenu;
  }

  getUserInitials(): string {
    const email = this.auth.user()?.email;
    if (!email) return 'DA';
    return email.substring(0, 2).toUpperCase();
  }

  closeAllMenus() {
    this.toolsMenu = false;
    this.userMenu = false;
  }

  getLangLabel(): string {
    const found = this.lang.availableLanguages.find(l => l.code === this.lang.currentLang);
    return found ? found.label : this.lang.currentLang.toUpperCase();
  }

  restartTour() {
    if (typeof localStorage !== 'undefined') localStorage.removeItem('onboarding_complete');
    this.showOnboarding = true;
  }

  openCookieSettings() {
    this.cookieConsent?.reopenBanner();
  }

  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.closeAllMenus();
    }
  }
}
