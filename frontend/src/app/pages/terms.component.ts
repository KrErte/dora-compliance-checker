import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto animate-fade-in-up">
      <!-- Back button -->
      <a routerLink="/" class="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors mb-8">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        {{ lang.t('pillar.back') }}
      </a>

      <div class="text-center mb-10">
        <h1 class="text-3xl font-bold text-white mb-2">{{ lang.t('terms.title') }}</h1>
        <p class="text-slate-300">{{ lang.t('terms.subtitle') }}</p>
      </div>

      <!-- A) General -->
      <div class="glass-card p-6 mb-6">
        <h2 class="text-xl font-semibold text-emerald-400 mb-4">{{ lang.t('terms.general_title') }}</h2>
        <div class="text-slate-300 text-sm space-y-3">
          <p><span class="text-slate-300">{{ lang.t('terms.provider') }}:</span> DoraAudit.eu</p>
          <p><span class="text-slate-300">{{ lang.t('terms.operator') }}:</span> Kristo Erte</p>
          <p class="text-slate-300">{{ lang.t('terms.service_desc') }}</p>
          <p class="text-slate-400 mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            {{ lang.t('terms.acceptance') }}
          </p>
        </div>
      </div>

      <!-- B) Service Nature & Limitations - MOST IMPORTANT -->
      <div class="glass-card p-6 mb-6 border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5">
        <div class="flex items-center gap-3 mb-4">
          <svg class="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <h2 class="text-xl font-semibold text-amber-300">{{ lang.t('terms.disclaimer_title') }}</h2>
        </div>

        <div class="space-y-4">
          <div class="p-4 bg-amber-900/20 rounded-lg border border-amber-500/20">
            <p class="text-amber-200 font-medium text-sm">{{ lang.t('terms.disclaimer_1') }}</p>
          </div>
          <div class="p-4 bg-amber-900/20 rounded-lg border border-amber-500/20">
            <p class="text-amber-200 font-medium text-sm">{{ lang.t('terms.disclaimer_2') }}</p>
          </div>
          <div class="p-4 bg-amber-900/20 rounded-lg border border-amber-500/20">
            <p class="text-amber-200 font-medium text-sm">{{ lang.t('terms.disclaimer_3') }}</p>
          </div>
          <div class="p-4 bg-amber-900/20 rounded-lg border border-amber-500/20">
            <p class="text-amber-200 font-medium text-sm">{{ lang.t('terms.disclaimer_4') }}</p>
          </div>
        </div>
      </div>

      <!-- C) User Account -->
      <div class="glass-card p-6 mb-6">
        <h2 class="text-xl font-semibold text-emerald-400 mb-4">{{ lang.t('terms.account_title') }}</h2>
        <ul class="text-slate-300 text-sm space-y-3">
          <li class="flex items-start gap-2">
            <span class="text-emerald-400 mt-1">•</span>
            {{ lang.t('terms.account_security') }}
          </li>
          <li class="flex items-start gap-2">
            <span class="text-emerald-400 mt-1">•</span>
            {{ lang.t('terms.account_one') }}
          </li>
          <li class="flex items-start gap-2">
            <span class="text-emerald-400 mt-1">•</span>
            {{ lang.t('terms.account_prohibited') }}
          </li>
        </ul>
      </div>

      <!-- D) Payments & Refunds -->
      <div class="glass-card p-6 mb-6">
        <h2 class="text-xl font-semibold text-emerald-400 mb-4">{{ lang.t('terms.payment_title') }}</h2>
        <div class="space-y-4">
          <div class="grid sm:grid-cols-2 gap-4">
            <div class="p-3 bg-slate-800/30 rounded-lg">
              <p class="text-slate-400 text-xs mb-1">{{ lang.t('terms.payment_processor') }}</p>
              <p class="text-white text-sm font-medium">LemonSqueezy</p>
            </div>
            <div class="p-3 bg-slate-800/30 rounded-lg">
              <p class="text-slate-400 text-xs mb-1">{{ lang.t('terms.payment_vat') }}</p>
              <p class="text-white text-sm font-medium">{{ lang.t('terms.payment_vat_included') }}</p>
            </div>
          </div>

          <div class="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <div class="flex items-center gap-2 mb-2">
              <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="text-emerald-400 font-medium text-sm">{{ lang.t('terms.refund_title') }}</span>
            </div>
            <p class="text-slate-300 text-sm">{{ lang.t('terms.refund_desc') }}</p>
            <p class="text-slate-400 text-xs mt-2">{{ lang.t('terms.refund_contact') }}: <a href="mailto:info@doraaudit.eu" class="text-emerald-400 hover:text-emerald-300">info&#64;doraaudit.eu</a></p>
          </div>
        </div>
      </div>

      <!-- E) Intellectual Property -->
      <div class="glass-card p-6 mb-6">
        <h2 class="text-xl font-semibold text-emerald-400 mb-4">{{ lang.t('terms.ip_title') }}</h2>
        <ul class="text-slate-300 text-sm space-y-3">
          <li class="flex items-start gap-2">
            <span class="text-emerald-400 mt-1">•</span>
            {{ lang.t('terms.ip_platform') }}
          </li>
          <li class="flex items-start gap-2">
            <span class="text-emerald-400 mt-1">•</span>
            {{ lang.t('terms.ip_user_data') }}
          </li>
          <li class="flex items-start gap-2">
            <span class="text-emerald-400 mt-1">•</span>
            {{ lang.t('terms.ip_reports') }}
          </li>
        </ul>
      </div>

      <!-- F) Liability Limitation -->
      <div class="glass-card p-6 mb-6 border-slate-600/30">
        <h2 class="text-xl font-semibold text-emerald-400 mb-4">{{ lang.t('terms.liability_title') }}</h2>
        <ul class="text-slate-300 text-sm space-y-3">
          <li class="flex items-start gap-2">
            <span class="text-slate-500 mt-1">•</span>
            {{ lang.t('terms.liability_no_damages') }}
          </li>
          <li class="flex items-start gap-2">
            <span class="text-slate-500 mt-1">•</span>
            {{ lang.t('terms.liability_max') }}
          </li>
          <li class="flex items-start gap-2">
            <span class="text-slate-500 mt-1">•</span>
            {{ lang.t('terms.liability_force') }}
          </li>
        </ul>
      </div>

      <!-- G) Service Availability -->
      <div class="glass-card p-6 mb-6">
        <h2 class="text-xl font-semibold text-emerald-400 mb-4">{{ lang.t('terms.availability_title') }}</h2>
        <ul class="text-slate-300 text-sm space-y-3">
          <li class="flex items-start gap-2">
            <span class="text-emerald-400 mt-1">•</span>
            {{ lang.t('terms.availability_uptime') }}
          </li>
          <li class="flex items-start gap-2">
            <span class="text-emerald-400 mt-1">•</span>
            {{ lang.t('terms.availability_changes') }}
          </li>
        </ul>
      </div>

      <!-- H) Termination -->
      <div class="glass-card p-6 mb-6">
        <h2 class="text-xl font-semibold text-emerald-400 mb-4">{{ lang.t('terms.termination_title') }}</h2>
        <ul class="text-slate-300 text-sm space-y-3">
          <li class="flex items-start gap-2">
            <span class="text-emerald-400 mt-1">•</span>
            {{ lang.t('terms.termination_user') }}
          </li>
          <li class="flex items-start gap-2">
            <span class="text-emerald-400 mt-1">•</span>
            {{ lang.t('terms.termination_provider') }}
          </li>
        </ul>
      </div>

      <!-- I) Applicable Law -->
      <div class="glass-card p-6 mb-6 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-indigo-500/5">
        <h2 class="text-xl font-semibold text-blue-400 mb-4">{{ lang.t('terms.law_title') }}</h2>
        <div class="text-slate-300 text-sm space-y-2">
          <p>{{ lang.t('terms.law_jurisdiction') }}</p>
          <p>{{ lang.t('terms.law_court') }}</p>
        </div>
      </div>

      <!-- J) Contact -->
      <div class="glass-card p-6 mb-6">
        <h2 class="text-xl font-semibold text-emerald-400 mb-4">{{ lang.t('terms.contact_title') }}</h2>
        <p class="text-slate-300 text-sm">
          {{ lang.t('terms.contact_desc') }}
          <a href="mailto:info@doraaudit.eu" class="text-emerald-400 hover:text-emerald-300 ml-1">info&#64;doraaudit.eu</a>
        </p>
      </div>

      <div class="text-center text-sm text-slate-500 mt-8">
        {{ lang.t('terms.updated') }}: 08.02.2026
      </div>
    </div>
  `
})
export class TermsComponent {
  constructor(public lang: LangService) {}
}
