import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-landing',
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Hero section -->
    <div class="relative overflow-hidden">
      <div class="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>

      <div class="relative flex flex-col items-center justify-center min-h-[70vh] text-center z-10">
        <h1 class="text-4xl md:text-6xl font-extrabold mb-6">
          <span class="gradient-text">DORA Art. 30</span>
          <br/>
          <span class="text-slate-100">{{ lang.t('landing.subtitle') }}</span>
        </h1>

        <p class="text-lg text-slate-400 max-w-xl mb-10 leading-relaxed">
          {{ lang.t('landing.hero_desc') }}
        </p>

        <!-- CTA buttons -->
        <div class="flex flex-col sm:flex-row gap-4">
          <a routerLink="/contract-analysis" [queryParams]="{sample: 'true'}"
             class="group inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400
                    text-slate-900 font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 text-lg
                    hover:shadow-lg hover:shadow-emerald-500/25">
            {{ lang.t('landing.cta_try_sample') }}
            <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </a>
          <a routerLink="/assessment"
             class="inline-flex items-center gap-2 bg-slate-800/50 backdrop-blur border border-slate-700/50
                    text-slate-200 font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 text-lg
                    hover:border-emerald-500/30 hover:bg-slate-800/80">
            {{ lang.t('landing.cta_assessment') }}
          </a>
        </div>

        <!-- Key stats -->
        <div class="grid grid-cols-3 gap-6 mt-16 w-full max-w-lg">
          <div class="text-center">
            <div class="text-2xl font-bold text-emerald-400">8</div>
            <p class="text-xs text-slate-500">{{ lang.t('landing.stat_requirements') }}</p>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-cyan-400">&lt;5 min</div>
            <p class="text-xs text-slate-500">{{ lang.t('landing.stat_time') }}</p>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-slate-400">PDF</div>
            <p class="text-xs text-slate-500">{{ lang.t('landing.stat_report') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Process steps -->
    <div class="py-16">
      <div class="text-center mb-10">
        <h2 class="text-2xl font-bold text-slate-100">{{ lang.t('landing.steps_title') }}</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        <div *ngFor="let step of steps; let i = index" class="glass-card p-6 text-left relative">
          <div class="absolute -top-3 -right-3 text-6xl font-extrabold text-slate-700/20">{{ i + 1 }}</div>
          <div class="relative z-10">
            <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold mb-3">{{ i + 1 }}</div>
            <h3 class="font-semibold text-slate-200 mb-1">{{ lang.t(step.titleKey) }}</h3>
            <p class="text-sm text-slate-500">{{ lang.t(step.descKey) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Scope clarification -->
    <div class="py-12">
      <div class="max-w-2xl mx-auto glass-card p-6">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">{{ lang.t('landing.scope_title') }}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-emerald-400 font-medium mb-2">{{ lang.t('landing.scope_does') }}</p>
            <ul class="text-slate-400 space-y-1">
              <li>• {{ lang.t('landing.scope_does_1') }}</li>
              <li>• {{ lang.t('landing.scope_does_2') }}</li>
              <li>• {{ lang.t('landing.scope_does_3') }}</li>
            </ul>
          </div>
          <div>
            <p class="text-slate-500 font-medium mb-2">{{ lang.t('landing.scope_not') }}</p>
            <ul class="text-slate-500 space-y-1">
              <li>• {{ lang.t('landing.scope_not_1') }}</li>
              <li>• {{ lang.t('landing.scope_not_2') }}</li>
              <li>• {{ lang.t('landing.scope_not_3') }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Final CTA -->
    <div class="py-16 text-center">
      <h2 class="text-2xl font-bold text-slate-100 mb-4">{{ lang.t('landing.final_cta_title') }}</h2>
      <p class="text-slate-400 mb-8 max-w-lg mx-auto">{{ lang.t('landing.final_cta_desc') }}</p>
      <a routerLink="/contract-analysis"
         class="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400
                text-slate-900 font-semibold px-10 py-4 rounded-xl transition-all duration-300 text-lg
                hover:shadow-xl hover:shadow-emerald-500/30">
        {{ lang.t('landing.cta_check') }}
      </a>
    </div>
  `
})
export class LandingComponent {
  steps = [
    { titleKey: 'landing.step1_title', descKey: 'landing.step1_desc' },
    { titleKey: 'landing.step2_title', descKey: 'landing.step2_desc' },
    { titleKey: 'landing.step3_title', descKey: 'landing.step3_desc' }
  ];

  constructor(public lang: LangService) {}
}
