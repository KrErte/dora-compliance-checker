import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto animate-fade-in-up">
      <!-- Back button -->
      <a routerLink="/" class="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors mb-8">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        {{ lang.t('pillar.back') }}
      </a>

      <div class="text-center mb-10">
        <h1 class="text-3xl font-bold text-white mb-2">{{ lang.t('privacy.title') }}</h1>
        <p class="text-slate-400">{{ lang.t('privacy.subtitle') }}</p>
      </div>

      <!-- 1. Controller -->
      <div class="glass-card p-6 mb-6">
        <h2 class="text-xl font-semibold text-blue-600 mb-4">{{ lang.t('privacy.controller_title') }}</h2>
        <div class="text-slate-600 text-sm space-y-2">
          <p><span class="text-slate-400">{{ lang.t('privacy.controller_service') }}:</span> DoraAudit.eu</p>
          <p><span class="text-slate-400">{{ lang.t('privacy.controller_operator') }}:</span> Doraaudit</p>
          <p><span class="text-slate-400">{{ lang.t('privacy.controller_location') }}:</span> {{ lang.t('privacy.controller_location_value') }}</p>
          <p><span class="text-slate-600">{{ lang.t('privacy.controller_email') }}:</span>&nbsp;<a href="mailto:info@doraaudit.eu" class="text-blue-600 hover:text-blue-500">info&#64;doraaudit.eu</a></p>
        </div>
      </div>

      <!-- 2. Data collected -->
      <div class="glass-card p-6 mb-6">
        <h2 class="text-xl font-semibold text-blue-600 mb-4">{{ lang.t('privacy.data_title') }}</h2>

        <div class="space-y-4">
          <div>
            <h3 class="text-white font-medium mb-2">{{ lang.t('privacy.data_contact') }}</h3>
            <p class="text-slate-400 text-sm">{{ lang.t('privacy.data_contact_desc') }}</p>
          </div>

          <div>
            <h3 class="text-white font-medium mb-2">{{ lang.t('privacy.data_company') }}</h3>
            <p class="text-slate-400 text-sm">{{ lang.t('privacy.data_company_desc') }}</p>
          </div>

          <div>
            <h3 class="text-white font-medium mb-2">{{ lang.t('privacy.data_payment') }}</h3>
            <p class="text-slate-400 text-sm">{{ lang.t('privacy.data_payment_desc') }}</p>
          </div>

          <div>
            <h3 class="text-white font-medium mb-2">{{ lang.t('privacy.data_technical') }}</h3>
            <p class="text-slate-400 text-sm">{{ lang.t('privacy.data_technical_desc') }}</p>
          </div>

          <div>
            <h3 class="text-white font-medium mb-2">{{ lang.t('privacy.data_cookies') }}</h3>
            <p class="text-slate-400 text-sm">{{ lang.t('privacy.data_cookies_desc') }}</p>
          </div>
        </div>
      </div>

      <!-- 3. Legal basis -->
      <div class="glass-card p-6 mb-6">
        <h2 class="text-xl font-semibold text-blue-600 mb-4">{{ lang.t('privacy.legal_title') }}</h2>
        <p class="text-slate-400 text-sm mb-4">{{ lang.t('privacy.legal_intro') }}</p>

        <ul class="text-slate-600 text-sm space-y-3">
          <li class="flex items-start gap-3">
            <span class="text-blue-600 font-mono text-xs bg-blue-500/10 px-2 py-1 rounded">Art. 6(1)(b)</span>
            <span>{{ lang.t('privacy.legal_contract') }}</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="text-blue-600 font-mono text-xs bg-blue-500/10 px-2 py-1 rounded">Art. 6(1)(f)</span>
            <span>{{ lang.t('privacy.legal_interest') }}</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="text-blue-600 font-mono text-xs bg-blue-500/10 px-2 py-1 rounded">Art. 6(1)(a)</span>
            <span>{{ lang.t('privacy.legal_consent') }}</span>
          </li>
        </ul>
      </div>

      <!-- 4. Data retention -->
      <div class="glass-card p-6 mb-6">
        <h2 class="text-xl font-semibold text-blue-600 mb-4">{{ lang.t('privacy.retention_title') }}</h2>

        <div class="grid gap-3">
          <div class="flex justify-between items-center py-2 border-b border-slate-200">
            <span class="text-slate-600 text-sm">{{ lang.t('privacy.retention_account') }}</span>
            <span class="text-blue-600 text-sm font-medium">{{ lang.t('privacy.retention_account_period') }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-slate-200">
            <span class="text-slate-600 text-sm">{{ lang.t('privacy.retention_assessment') }}</span>
            <span class="text-blue-600 text-sm font-medium">{{ lang.t('privacy.retention_assessment_period') }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-slate-200">
            <span class="text-slate-600 text-sm">{{ lang.t('privacy.retention_payment') }}</span>
            <span class="text-blue-600 text-sm font-medium">{{ lang.t('privacy.retention_payment_period') }}</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-slate-600 text-sm">{{ lang.t('privacy.retention_logs') }}</span>
            <span class="text-blue-600 text-sm font-medium">{{ lang.t('privacy.retention_logs_period') }}</span>
          </div>
        </div>
      </div>

      <!-- 5. Third parties -->
      <div class="glass-card p-6 mb-6">
        <h2 class="text-xl font-semibold text-blue-600 mb-4">{{ lang.t('privacy.third_title') }}</h2>
        <p class="text-slate-400 text-sm mb-4">{{ lang.t('privacy.third_intro') }}</p>

        <div class="space-y-3">
          <div class="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
            <div class="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
            <div>
              <span class="text-white text-sm font-medium">LemonSqueezy</span>
              <p class="text-slate-400 text-xs mt-1">{{ lang.t('privacy.third_lemonsqueezy') }}</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
            <div class="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
            <div>
              <span class="text-white text-sm font-medium">Hetzner</span>
              <p class="text-slate-400 text-xs mt-1">{{ lang.t('privacy.third_hetzner') }}</p>
            </div>
          </div>
        </div>

        <p class="text-slate-500 text-xs mt-4 italic">{{ lang.t('privacy.third_no_ads') }}</p>
      </div>

      <!-- 6. Rights -->
      <div class="glass-card p-6 mb-6 border-blue-200 bg-gradient-to-br from-blue-600/5 to-teal-500/5">
        <h2 class="text-xl font-semibold text-blue-600 mb-4">{{ lang.t('privacy.rights_title') }}</h2>
        <p class="text-slate-400 text-sm mb-4">{{ lang.t('privacy.rights_intro') }}</p>

        <div class="grid sm:grid-cols-2 gap-3">
          <div class="flex items-start gap-2">
            <span class="text-blue-600 font-mono text-xs">Art. 15</span>
            <span class="text-slate-600 text-sm">{{ lang.t('privacy.right_access') }}</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-blue-600 font-mono text-xs">Art. 16</span>
            <span class="text-slate-600 text-sm">{{ lang.t('privacy.right_rectification') }}</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-blue-600 font-mono text-xs">Art. 17</span>
            <span class="text-slate-600 text-sm">{{ lang.t('privacy.right_erasure') }}</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-blue-600 font-mono text-xs">Art. 18</span>
            <span class="text-slate-600 text-sm">{{ lang.t('privacy.right_restriction') }}</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-blue-600 font-mono text-xs">Art. 20</span>
            <span class="text-slate-600 text-sm">{{ lang.t('privacy.right_portability') }}</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-blue-600 font-mono text-xs">Art. 21</span>
            <span class="text-slate-600 text-sm">{{ lang.t('privacy.right_objection') }}</span>
          </div>
        </div>

        <div class="mt-4 p-3 bg-white rounded-lg">
          <p class="text-slate-600 text-sm">{{ lang.t('privacy.rights_contact') }} <a href="mailto:info@doraaudit.eu" class="text-blue-600 hover:text-blue-500">info&#64;doraaudit.eu</a></p>
          <p class="text-slate-400 text-xs mt-2">{{ lang.t('privacy.rights_complaint') }}</p>
        </div>
      </div>

      <!-- 7. Cookies -->
      <div class="glass-card p-6 mb-6">
        <h2 class="text-xl font-semibold text-blue-600 mb-4">{{ lang.t('privacy.cookies_title') }}</h2>

        <div class="space-y-3">
          <div class="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
            <span class="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-600">{{ lang.t('privacy.cookies_required') }}</span>
            <span class="text-slate-600 text-sm">{{ lang.t('privacy.cookies_functional') }}</span>
          </div>
          <div class="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
            <span class="text-xs px-2 py-1 rounded bg-amber-400/20 text-amber-400">{{ lang.t('privacy.cookies_optional') }}</span>
            <span class="text-slate-600 text-sm">{{ lang.t('privacy.cookies_analytics') }}</span>
          </div>
          <div class="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
            <span class="text-xs px-2 py-1 rounded bg-slate-400/20 text-slate-400">{{ lang.t('privacy.cookies_none') }}</span>
            <span class="text-slate-600 text-sm">{{ lang.t('privacy.cookies_marketing') }}</span>
          </div>
        </div>
      </div>

      <!-- 8. Security -->
      <div class="glass-card p-6 mb-6">
        <h2 class="text-xl font-semibold text-blue-600 mb-4">{{ lang.t('privacy.security_title') }}</h2>

        <ul class="text-slate-600 text-sm space-y-2">
          <li class="flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ lang.t('privacy.security_https') }}
          </li>
          <li class="flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ lang.t('privacy.security_access') }}
          </li>
          <li class="flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ lang.t('privacy.security_backups') }}
          </li>
        </ul>
      </div>

      <!-- 9. Changes -->
      <div class="glass-card p-6 mb-6 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
        <h2 class="text-xl font-semibold text-amber-300 mb-4">{{ lang.t('privacy.changes_title') }}</h2>
        <p class="text-slate-400 text-sm">{{ lang.t('privacy.changes_desc') }}</p>
      </div>

      <div class="text-center text-sm text-slate-500 mt-8">
        {{ lang.t('privacy.updated') }}: 08.02.2026
      </div>
    </div>
  `
})
export class PrivacyComponent {
  constructor(public lang: LangService) {}
}
