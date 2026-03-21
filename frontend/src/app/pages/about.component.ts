import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto animate-fade-in-up">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-3xl font-bold gradient-text mb-2">{{ lang.t('about.title') }}</h1>
        <p class="text-slate-600">{{ lang.t('about.subtitle') }}</p>
      </div>

      <!-- Mission -->
      <div class="glass-card p-6 mb-6 border-blue-200 bg-gradient-to-br from-blue-600/5 to-blue-500/5">
        <h2 class="text-lg font-semibold text-blue-600 mb-3">{{ lang.t('about.mission_title') }}</h2>
        <p class="text-slate-600 text-sm leading-relaxed">{{ lang.t('about.mission_desc') }}</p>
      </div>

      <!-- Why -->
      <div class="glass-card p-6 mb-8">
        <h2 class="text-lg font-semibold text-slate-700 mb-4">{{ lang.t('about.why_title') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div *ngFor="let i of [1,2,3,4]"
               class="flex items-start gap-3 p-3 rounded-lg bg-white">
            <svg class="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
            <p class="text-sm text-slate-600">{{ lang.t('about.why_' + i) }}</p>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="glass-card p-4 text-center">
          <div class="text-2xl font-bold text-blue-600">8</div>
          <div class="text-xs text-slate-400 mt-1">{{ lang.t('about.stat_requirements') }}</div>
        </div>
        <div class="glass-card p-4 text-center">
          <div class="text-2xl font-bold text-blue-500">&lt;5 min</div>
          <div class="text-xs text-slate-400 mt-1">{{ lang.t('about.stat_analysis') }}</div>
        </div>
        <div class="glass-card p-4 text-center">
          <div class="text-2xl font-bold text-violet-400">2%</div>
          <div class="text-xs text-slate-400 mt-1">{{ lang.t('about.stat_penalty') }}</div>
        </div>
        <div class="glass-card p-4 text-center">
          <div class="text-2xl font-bold text-amber-400">2</div>
          <div class="text-xs text-slate-400 mt-1">{{ lang.t('about.stat_regulations') }}</div>
        </div>
      </div>

      <!-- Founder -->
      <div class="mb-8">
        <div class="text-center mb-6">
          <h2 class="text-xl font-bold text-slate-700">{{ lang.t('about.founder_title') }}</h2>
        </div>
        <div class="glass-card p-6 max-w-2xl mx-auto">
          <div class="flex items-start gap-5">
            <div class="w-14 h-14 rounded-xl bg-blue-600/20 text-blue-500 flex items-center justify-center text-xl font-bold shrink-0">
              KE
            </div>
            <div>
              <h3 class="text-lg font-semibold text-slate-700 mb-1">Kristo Erte</h3>
              <p class="text-sm text-slate-600 leading-relaxed">{{ lang.t('about.founder_bio') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Technology -->
      <div class="glass-card p-6 mb-8">
        <h2 class="text-lg font-semibold text-slate-700 mb-2">{{ lang.t('about.tech_title') }}</h2>
        <p class="text-sm text-slate-600 mb-4">{{ lang.t('about.tech_desc') }}</p>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div *ngFor="let t of techFeatures"
               class="flex items-center gap-2 p-3 rounded-lg bg-white border border-slate-200">
            <span class="text-lg">{{ t.icon }}</span>
            <span class="text-xs text-slate-600">{{ lang.t(t.key) }}</span>
          </div>
        </div>
      </div>

      <!-- Methodology -->
      <div class="glass-card p-6 mb-8 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <svg class="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-amber-400 mb-2">{{ lang.t('about.methodology_title') }}</h2>
            <p class="text-sm text-slate-600 leading-relaxed">{{ lang.t('about.methodology_desc') }}</p>
          </div>
        </div>
      </div>

      <!-- Contact CTA -->
      <div class="glass-card p-6 mb-6 text-center border-blue-200">
        <h2 class="text-lg font-semibold text-slate-700 mb-2">{{ lang.t('about.contact_title') }}</h2>
        <p class="text-sm text-slate-600 mb-4">{{ lang.t('about.contact_desc') }}</p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="mailto:info@doraaudit.eu"
             class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium
                    bg-blue-600 text-slate-900
                    hover:bg-blue-700 hover:shadow-lg hover:shadow-lg transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            {{ lang.t('about.contact_email') }}
          </a>
          <a routerLink="/pricing"
             class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium
                    bg-slate-700/50 text-slate-600 border border-slate-200
                    hover:bg-slate-100 hover:text-blue-600 hover:border-blue-200 transition-all">
            {{ lang.t('nav.pricing') }}
          </a>
        </div>
      </div>
    </div>
  `
})
export class AboutComponent {
  techFeatures = [
    { icon: '🇪🇺', key: 'about.tech_1' },
    { icon: '🔐', key: 'about.tech_2' },
    { icon: '✅', key: 'about.tech_3' },
    { icon: '☁️', key: 'about.tech_4' }
  ];

  constructor(public lang: LangService) {}
}
