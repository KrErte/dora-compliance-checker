import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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

          <button type="button" disabled
                  class="w-full py-3 px-4 rounded-xl text-center font-medium text-sm
                         bg-slate-700/30 text-slate-400
                         cursor-not-allowed border border-slate-600/30">
            {{ lang.t('pricing.package_cta') }} →
          </button>
          <p class="text-center text-xs text-slate-500 mt-2">{{ lang.t('pricing.coming_soon') }}</p>
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
export class PricingComponent {
  paymentConfig = PAYMENT_CONFIG;

  constructor(public lang: LangService) {}
}
