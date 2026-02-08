import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { LangService } from '../lang.service';
import { PAYMENT_CONFIG } from '../config/payment.config';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-3xl md:text-4xl font-bold gradient-text mb-4">
          {{ lang.t('pricing.title') }}
        </h1>
        <p class="text-slate-400 text-lg max-w-2xl mx-auto">
          {{ lang.t('pricing.subtitle') }}
        </p>
      </div>

      <!-- Pricing Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

        <!-- Card 1: Free -->
        <div class="glass-card p-6 rounded-2xl border border-slate-700/50 flex flex-col">
          <div class="mb-6">
            <h3 class="text-xl font-bold text-slate-200 mb-2">{{ lang.t('pricing.free_title') }}</h3>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-bold text-emerald-400">{{ lang.t('pricing.free_price') }}</span>
            </div>
          </div>

          <ul class="space-y-3 mb-8 flex-1">
            <li class="flex items-start gap-3">
              <span class="text-emerald-400 mt-0.5">✓</span>
              <span class="text-slate-300 text-sm">{{ lang.t('pricing.free_f1') }}</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-emerald-400 mt-0.5">✓</span>
              <span class="text-slate-300 text-sm">{{ lang.t('pricing.free_f2') }}</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-emerald-400 mt-0.5">✓</span>
              <span class="text-slate-300 text-sm">{{ lang.t('pricing.free_f3') }}</span>
            </li>
          </ul>

          <a routerLink="/nis2/scope-check"
             class="w-full py-3 px-4 rounded-xl text-center font-medium text-sm
                    bg-slate-700/50 text-slate-200 border border-slate-600/50
                    hover:bg-slate-600/50 hover:border-emerald-500/30 hover:text-emerald-400
                    transition-all duration-200">
            {{ lang.t('pricing.free_cta') }} →
          </a>

          <div class="mt-4 pt-4 border-t border-slate-700/50 text-center">
            <p class="text-xs text-slate-500 line-through">{{ lang.t('pricing.lawyer_free') }}</p>
          </div>
        </div>

        <!-- Card 2: Single Assessment - POPULAR -->
        <div class="glass-card p-6 rounded-2xl border-2 border-emerald-500/50 flex flex-col relative
                    shadow-lg shadow-emerald-500/10">
          <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold
                      bg-gradient-to-r from-emerald-500 to-cyan-500 text-white uppercase tracking-wider">
            {{ lang.t('pricing.popular') }}
          </div>

          <div class="mb-6 mt-2">
            <h3 class="text-xl font-bold text-slate-200 mb-2">{{ lang.t('pricing.single_title') }}</h3>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-bold text-emerald-400">€49</span>
              <span class="text-slate-500 text-sm">/ {{ lang.t('pricing.one_time') }}</span>
            </div>
          </div>

          <ul class="space-y-3 mb-8 flex-1">
            <li class="flex items-start gap-3">
              <span class="text-emerald-400 mt-0.5">✓</span>
              <span class="text-slate-300 text-sm">{{ lang.t('pricing.single_f1') }}</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-emerald-400 mt-0.5">✓</span>
              <span class="text-slate-300 text-sm">{{ lang.t('pricing.single_f2') }}</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-emerald-400 mt-0.5">✓</span>
              <span class="text-slate-300 text-sm">{{ lang.t('pricing.single_f3') }}</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-emerald-400 mt-0.5">✓</span>
              <span class="text-slate-300 text-sm">{{ lang.t('pricing.single_f4') }}</span>
            </li>
          </ul>

          <a [href]="paymentConfig.lemonsqueezy.products.doraAssessment.checkoutUrl"
             target="_blank"
             class="w-full py-3 px-4 rounded-xl text-center font-medium text-sm
                    bg-gradient-to-r from-emerald-500 to-cyan-500 text-white
                    hover:from-emerald-400 hover:to-cyan-400 hover:shadow-lg hover:shadow-emerald-500/25
                    transition-all duration-200">
            {{ lang.t('pricing.single_cta') }} →
          </a>

          <div class="mt-4 pt-4 border-t border-slate-700/50 text-center">
            <p class="text-xs text-slate-500 line-through">{{ lang.t('pricing.lawyer_single') }}</p>
          </div>
        </div>

        <!-- Card 3: Compliance Package -->
        <div class="glass-card p-6 rounded-2xl border border-slate-700/50 flex flex-col relative">
          <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold
                      bg-gradient-to-r from-amber-500 to-orange-500 text-white uppercase tracking-wider">
            {{ lang.t('pricing.save_20') }}
          </div>

          <div class="mb-6 mt-2">
            <h3 class="text-xl font-bold text-slate-200 mb-2">{{ lang.t('pricing.package_title') }}</h3>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-bold text-emerald-400">€79</span>
              <span class="text-slate-500 text-sm line-through ml-2">€98</span>
            </div>
          </div>

          <ul class="space-y-3 mb-8 flex-1">
            <li class="flex items-start gap-3">
              <span class="text-emerald-400 mt-0.5">✓</span>
              <span class="text-slate-300 text-sm">{{ lang.t('pricing.package_f1') }}</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-emerald-400 mt-0.5">✓</span>
              <span class="text-slate-300 text-sm">{{ lang.t('pricing.package_f2') }}</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-emerald-400 mt-0.5">✓</span>
              <span class="text-slate-300 text-sm">{{ lang.t('pricing.package_f3') }}</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-emerald-400 mt-0.5">✓</span>
              <span class="text-slate-300 text-sm">{{ lang.t('pricing.package_f4') }}</span>
            </li>
          </ul>

          <a [href]="paymentConfig.lemonsqueezy.products.comboPackage.checkoutUrl"
             target="_blank"
             class="w-full py-3 px-4 rounded-xl text-center font-medium text-sm
                    bg-gradient-to-r from-amber-500 to-orange-500 text-white
                    hover:from-amber-400 hover:to-orange-400 hover:shadow-lg hover:shadow-amber-500/25
                    transition-all duration-200">
            {{ lang.t('pricing.package_cta') }} →
          </a>

          <div class="mt-4 pt-4 border-t border-slate-700/50 text-center">
            <p class="text-xs text-slate-500 line-through">{{ lang.t('pricing.lawyer_package') }}</p>
          </div>
        </div>
      </div>

      <!-- What's included section -->
      <div class="mt-12 mb-12">
        <h2 class="text-xl font-bold text-center text-slate-200 mb-6">{{ lang.t('pricing.whats_included') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Free tier details -->
          <div class="glass-card p-5 rounded-xl border border-slate-700/50">
            <h4 class="text-sm font-semibold text-emerald-400 mb-3">{{ lang.t('pricing.free_title') }}</h4>
            <ul class="space-y-2 text-xs">
              <li class="flex items-start gap-2 text-slate-300">
                <span class="text-emerald-400">✓</span> {{ lang.t('pricing.inc_scope') }}
              </li>
              <li class="flex items-start gap-2 text-slate-300">
                <span class="text-emerald-400">✓</span> {{ lang.t('pricing.inc_5q') }}
              </li>
              <li class="flex items-start gap-2 text-slate-500">
                <span class="text-slate-600">✗</span> {{ lang.t('pricing.exc_full') }}
              </li>
              <li class="flex items-start gap-2 text-slate-500">
                <span class="text-slate-600">✗</span> {{ lang.t('pricing.exc_pdf') }}
              </li>
              <li class="flex items-start gap-2 text-slate-500">
                <span class="text-slate-600">✗</span> {{ lang.t('pricing.exc_contract') }}
              </li>
            </ul>
          </div>
          <!-- Single tier details -->
          <div class="glass-card p-5 rounded-xl border border-emerald-500/30">
            <h4 class="text-sm font-semibold text-emerald-400 mb-3">{{ lang.t('pricing.single_title') }} — €49</h4>
            <ul class="space-y-2 text-xs">
              <li class="flex items-start gap-2 text-slate-300">
                <span class="text-emerald-400">✓</span> {{ lang.t('pricing.inc_37q') }}
              </li>
              <li class="flex items-start gap-2 text-slate-300">
                <span class="text-emerald-400">✓</span> {{ lang.t('pricing.inc_action') }}
              </li>
              <li class="flex items-start gap-2 text-slate-300">
                <span class="text-emerald-400">✓</span> {{ lang.t('pricing.inc_pdf') }}
              </li>
              <li class="flex items-start gap-2 text-slate-500">
                <span class="text-slate-600">✗</span> {{ lang.t('pricing.exc_contract_sep') }}
              </li>
              <li class="flex items-start gap-2 text-slate-500">
                <span class="text-slate-600">✗</span> {{ lang.t('pricing.exc_nis2') }}
              </li>
            </ul>
          </div>
          <!-- Package tier details -->
          <div class="glass-card p-5 rounded-xl border border-amber-500/30">
            <h4 class="text-sm font-semibold text-amber-400 mb-3">{{ lang.t('pricing.package_title') }} — €79</h4>
            <ul class="space-y-2 text-xs">
              <li class="flex items-start gap-2 text-slate-300">
                <span class="text-emerald-400">✓</span> {{ lang.t('pricing.inc_dora_full') }}
              </li>
              <li class="flex items-start gap-2 text-slate-300">
                <span class="text-emerald-400">✓</span> {{ lang.t('pricing.inc_nis2_full') }}
              </li>
              <li class="flex items-start gap-2 text-slate-300">
                <span class="text-emerald-400">✓</span> {{ lang.t('pricing.inc_both_pdf') }}
              </li>
              <li class="flex items-start gap-2 text-slate-300">
                <span class="text-emerald-400">✓</span> {{ lang.t('pricing.inc_save') }}
              </li>
              <li class="flex items-start gap-2 text-slate-500">
                <span class="text-slate-600">✗</span> {{ lang.t('pricing.exc_contract_sep') }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Add-ons section -->
      <div class="mb-12">
        <h2 class="text-xl font-bold text-center text-slate-200 mb-2">{{ lang.t('pricing.addons_title') }}</h2>
        <p class="text-center text-slate-500 text-sm mb-6">{{ lang.t('pricing.addons_subtitle') }}</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <!-- Board Report -->
          <div class="glass-card p-6 rounded-xl border border-teal-500/30 flex flex-col">
            <div class="flex items-start justify-between mb-4">
              <div>
                <h3 class="text-lg font-bold text-slate-200">{{ lang.t('pricing.addon_board_title') }}</h3>
                <p class="text-teal-400 text-2xl font-bold">€29 <span class="text-sm text-slate-500 font-normal">/ {{ lang.t('pricing.one_time') }}</span></p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                <svg class="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
              </div>
            </div>
            <p class="text-slate-400 text-sm mb-4 flex-1">{{ lang.t('pricing.addon_board_desc') }}</p>
            <a [href]="paymentConfig.lemonsqueezy.products.nis2Report.checkoutUrl"
               target="_blank"
               class="w-full py-2.5 px-4 rounded-lg text-center font-medium text-sm
                      bg-teal-500/20 text-teal-400 border border-teal-500/30
                      hover:bg-teal-500/30 hover:border-teal-500/50
                      transition-all duration-200">
              {{ lang.t('pricing.addon_cta') }} →
            </a>
          </div>

          <!-- Contract Analysis -->
          <div class="glass-card p-6 rounded-xl border border-emerald-500/30 flex flex-col">
            <div class="flex items-start justify-between mb-4">
              <div>
                <h3 class="text-lg font-bold text-slate-200">{{ lang.t('pricing.addon_contract_title') }}</h3>
                <p class="text-emerald-400 text-2xl font-bold">€39 <span class="text-sm text-slate-500 font-normal">/ {{ lang.t('pricing.one_time') }}</span></p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
            </div>
            <p class="text-slate-400 text-sm mb-4 flex-1">{{ lang.t('pricing.addon_contract_desc') }}</p>
            <a [href]="paymentConfig.lemonsqueezy.products.contractAnalysis.checkoutUrl"
               target="_blank"
               class="w-full py-2.5 px-4 rounded-lg text-center font-medium text-sm
                      bg-emerald-500/20 text-emerald-400 border border-emerald-500/30
                      hover:bg-emerald-500/30 hover:border-emerald-500/50
                      transition-all duration-200">
              {{ lang.t('pricing.addon_cta') }} →
            </a>
          </div>
        </div>
      </div>

      <!-- Footer note -->
      <div class="text-center">
        <p class="text-slate-500 text-sm flex items-center justify-center gap-3 flex-wrap">
          <span class="flex items-center gap-1.5">
            <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ lang.t('pricing.note_1') }}
          </span>
          <span class="text-slate-700">•</span>
          <span class="flex items-center gap-1.5">
            <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ lang.t('pricing.note_2') }}
          </span>
          <span class="text-slate-700">•</span>
          <span class="flex items-center gap-1.5">
            <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ lang.t('pricing.note_3') }}
          </span>
        </p>
      </div>
    </div>
  `
})
export class PricingComponent implements OnInit {
  paymentConfig = PAYMENT_CONFIG;

  constructor(public lang: LangService, private titleService: Title) {}

  ngOnInit(): void {
    this.titleService.setTitle('Hinnakiri — DORA ja NIS2 hindamine | DoraAudit.eu');
  }
}
