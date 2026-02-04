import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-3xl mx-auto animate-fade-in-up">
      <!-- Back button -->
      <a routerLink="/" class="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors mb-8">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        {{ lang.t('pillar.back') }}
      </a>

      <div class="text-center mb-10">
        <h1 class="text-3xl font-bold text-white mb-2">{{ lang.t('privacy.title') }}</h1>
        <p class="text-slate-400">{{ lang.t('privacy.subtitle') }}</p>
      </div>

      <div class="glass-card p-6 mb-6">
        <h2 class="text-lg font-semibold text-emerald-400 mb-4">{{ lang.t('privacy.data_collection_title') }}</h2>
        <p class="text-slate-400 text-sm leading-relaxed mb-4">{{ lang.t('privacy.data_collection_desc') }}</p>
        <ul class="text-slate-400 text-sm space-y-2">
          <li class="flex items-start gap-2">
            <span class="text-emerald-400 mt-1">•</span>
            {{ lang.t('privacy.data_1') }}
          </li>
          <li class="flex items-start gap-2">
            <span class="text-emerald-400 mt-1">•</span>
            {{ lang.t('privacy.data_2') }}
          </li>
          <li class="flex items-start gap-2">
            <span class="text-emerald-400 mt-1">•</span>
            {{ lang.t('privacy.data_3') }}
          </li>
        </ul>
      </div>

      <div class="glass-card p-6 mb-6">
        <h2 class="text-lg font-semibold text-emerald-400 mb-4">{{ lang.t('privacy.storage_title') }}</h2>
        <p class="text-slate-400 text-sm leading-relaxed">{{ lang.t('privacy.storage_desc') }}</p>
      </div>

      <div class="glass-card p-6 mb-6">
        <h2 class="text-lg font-semibold text-emerald-400 mb-4">{{ lang.t('privacy.rights_title') }}</h2>
        <p class="text-slate-400 text-sm leading-relaxed mb-4">{{ lang.t('privacy.rights_desc') }}</p>
        <ul class="text-slate-400 text-sm space-y-2">
          <li class="flex items-start gap-2">
            <span class="text-emerald-400 mt-1">•</span>
            {{ lang.t('privacy.right_1') }}
          </li>
          <li class="flex items-start gap-2">
            <span class="text-emerald-400 mt-1">•</span>
            {{ lang.t('privacy.right_2') }}
          </li>
          <li class="flex items-start gap-2">
            <span class="text-emerald-400 mt-1">•</span>
            {{ lang.t('privacy.right_3') }}
          </li>
        </ul>
      </div>

      <div class="glass-card p-6 mb-6 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
        <h2 class="text-lg font-semibold text-amber-300 mb-4">{{ lang.t('privacy.gdpr_title') }}</h2>
        <p class="text-slate-400 text-sm leading-relaxed">{{ lang.t('privacy.gdpr_desc') }}</p>
      </div>

      <div class="text-center text-xs text-slate-600 mt-8">
        {{ lang.t('privacy.updated') }}: 2025-01-17
      </div>
    </div>
  `
})
export class PrivacyComponent {
  constructor(public lang: LangService) {}
}
