import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-[60vh] flex items-center justify-center">
      <div class="glass-card p-8 md:p-12 max-w-lg mx-auto text-center border border-slate-700/50">
        <!-- 404 number -->
        <div class="text-8xl font-extrabold gradient-text mb-4">404</div>
        <h1 class="text-2xl font-bold text-white mb-2">{{ lang.t('notfound.title') }}</h1>
        <p class="text-slate-400 mb-8">{{ lang.t('notfound.desc') }}</p>

        <!-- Suggested pages -->
        <div class="mb-8">
          <p class="text-sm text-slate-500 mb-4">{{ lang.currentLang === 'et' ? 'Proovi neid lehti:' : 'Try these pages:' }}</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a routerLink="/nis2/scope-check"
               class="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-amber-500/30 hover:bg-slate-700/30 transition-all group">
              <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              <span class="text-sm text-slate-300 group-hover:text-amber-300">NIS2 Scope Check</span>
            </a>
            <a routerLink="/assessment"
               class="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-emerald-500/30 hover:bg-slate-700/30 transition-all group">
              <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              <span class="text-sm text-slate-300 group-hover:text-emerald-300">{{ lang.currentLang === 'et' ? 'DORA hindamine' : 'DORA Assessment' }}</span>
            </a>
            <a routerLink="/board-risk"
               class="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-teal-500/30 hover:bg-slate-700/30 transition-all group">
              <svg class="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
              <span class="text-sm text-slate-300 group-hover:text-teal-300">{{ lang.currentLang === 'et' ? 'Juhatuse riskikalkulaator' : 'Board Risk Calculator' }}</span>
            </a>
            <a routerLink="/pricing"
               class="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-violet-500/30 hover:bg-slate-700/30 transition-all group">
              <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="text-sm text-slate-300 group-hover:text-violet-300">{{ lang.currentLang === 'et' ? 'Hinnakiri' : 'Pricing' }}</span>
            </a>
          </div>
        </div>

        <!-- Back to home button -->
        <a routerLink="/"
           class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm
                  bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900
                  hover:from-emerald-400 hover:to-cyan-400 hover:shadow-lg hover:shadow-emerald-500/25 transition-all">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          {{ lang.t('notfound.home') }}
        </a>
      </div>
    </div>
  `
})
export class NotFoundComponent {
  constructor(public lang: LangService) {}
}
