import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { LangService } from '../lang.service';
import { PAYMENT_CONFIG } from '../config/payment.config';
import { SubscriptionService } from '../services/subscription.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto relative">
      <!-- Background effects -->
      <div class="absolute -top-20 -left-20 w-72 h-72 bg-blue-50 rounded-full blur-3xl animate-float"></div>
      <div class="absolute -top-10 -right-20 w-72 h-72 bg-blue-50 rounded-full blur-3xl animate-float" style="animation-delay: -2s;"></div>

      <!-- Header -->
      <div class="text-center mb-12 relative z-10">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 mb-4 badge-shine">
          <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span class="text-xs font-medium text-blue-600">{{ lang.t('pricing.badge') || 'Simple Pricing' }}</span>
        </div>
        <h1 class="text-3xl md:text-5xl font-bold mb-4">
          <span class="gradient-text">{{ lang.t('pricing.title') }}</span>
        </h1>
        <p class="text-slate-400 text-lg max-w-2xl mx-auto">
          {{ lang.t('pricing.subtitle') }}
        </p>
        <!-- Trial banner -->
        <div class="mt-6 inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-blue-50 border border-blue-200">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span class="text-sm font-medium text-blue-500">{{ lang.l('Registreeru ja proovi kõiki funktsioone 14 päeva tasuta', 'Register and try all features free for 14 days') }}</span>
        </div>
      </div>

      <!-- Why DoraAudit Comparison -->
      <div class="mb-16">
        <h2 class="text-2xl font-bold text-center text-slate-900 mb-8">{{ lang.t('pricing.why_title') }}</h2>
        <div class="max-w-3xl mx-auto rounded-2xl border border-slate-200 relative">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[500px]">
              <thead>
                <tr class="bg-white">
                  <th class="px-4 py-3 text-left text-sm font-medium text-slate-400 w-1/3"></th>
                  <th class="px-4 py-3 text-center text-sm font-medium text-slate-400 w-1/3 bg-slate-700/30">{{ lang.t('pricing.compare_header_lawyer') }}</th>
                  <th class="px-4 py-3 text-center text-sm font-medium text-blue-600 w-1/3 bg-blue-50 border-l border-blue-200">{{ lang.t('pricing.compare_header_doraaudit') }}</th>
                </tr>
              </thead>
            <tbody>
              <tr class="border-t border-slate-200">
                <td class="px-4 py-4 text-sm font-medium text-slate-600">{{ lang.t('pricing.compare_price') }}</td>
                <td class="px-4 py-4 text-center text-sm text-slate-400 bg-slate-700/10">{{ lang.t('pricing.compare_price_lawyer') }}</td>
                <td class="px-4 py-4 text-center text-sm font-semibold text-blue-600 bg-blue-50 border-l border-blue-200">{{ lang.t('pricing.compare_price_doraaudit') }}</td>
              </tr>
              <tr class="border-t border-slate-200">
                <td class="px-4 py-4 text-sm font-medium text-slate-600">{{ lang.t('pricing.compare_time') }}</td>
                <td class="px-4 py-4 text-center text-sm text-slate-400 bg-slate-700/10">{{ lang.t('pricing.compare_time_lawyer') }}</td>
                <td class="px-4 py-4 text-center text-sm font-semibold text-blue-600 bg-blue-50 border-l border-blue-200">{{ lang.t('pricing.compare_time_doraaudit') }}</td>
              </tr>
              <tr class="border-t border-slate-200">
                <td class="px-4 py-4 text-sm font-medium text-slate-600">{{ lang.t('pricing.compare_result') }}</td>
                <td class="px-4 py-4 text-center text-sm text-slate-400 bg-slate-700/10">{{ lang.t('pricing.compare_result_lawyer') }}</td>
                <td class="px-4 py-4 text-center text-sm font-semibold text-blue-600 bg-blue-50 border-l border-blue-200">{{ lang.t('pricing.compare_result_doraaudit') }}</td>
              </tr>
              <tr class="border-t border-slate-200">
                <td class="px-4 py-4 text-sm font-medium text-slate-600">{{ lang.t('pricing.compare_update') }}</td>
                <td class="px-4 py-4 text-center text-sm text-slate-400 bg-slate-700/10">{{ lang.t('pricing.compare_update_lawyer') }}</td>
                <td class="px-4 py-4 text-center text-sm font-semibold text-blue-600 bg-blue-50 border-l border-blue-200">{{ lang.t('pricing.compare_update_doraaudit') }}</td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      </div>

      <!-- Pricing Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12 relative z-10">

        <!-- Card 1: Free -->
        <div class="group glass-card p-5 rounded-2xl border border-slate-200 flex flex-col feature-card hover:border-slate-300/70 transition-all duration-300">
          <div class="mb-5">
            <div class="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-slate-700 mb-1">{{ lang.t('pricing.free_title') }}</h3>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-extrabold text-slate-600">{{ lang.t('pricing.free_price') }}</span>
            </div>
          </div>

          <ul class="space-y-2.5 mb-6 flex-1 text-sm">
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-slate-600">{{ lang.t('pricing.free_f1') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-slate-600">{{ lang.t('pricing.free_f2') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-slate-600">{{ lang.t('pricing.free_f3') }}</span>
            </li>
          </ul>

          <a routerLink="/nis2/scope-check"
             class="w-full py-3 px-4 rounded-xl text-center font-semibold text-sm
                    bg-slate-700/50 text-slate-700 border border-slate-200
                    hover:bg-slate-100 hover:border-blue-200 hover:text-blue-600
                    transition-all duration-300">
            {{ lang.t('pricing.free_cta') }}
          </a>
        </div>

        <!-- Card 2: Professional -->
        <div class="group glass-card p-5 rounded-2xl border border-slate-200 flex flex-col feature-card hover:border-blue-500/50 transition-all duration-300">
          <div class="mb-5">
            <div class="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-slate-700 mb-1">Professional</h3>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-extrabold text-blue-500">€149</span>
              <span class="text-slate-500 text-sm">/ {{ lang.t('pricing.month') }}</span>
            </div>
            <div class="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
              <svg class="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="text-[11px] font-medium text-blue-600">{{ lang.l('14 päeva tasuta', '14 days free') }}</span>
            </div>
          </div>

          <ul class="space-y-2.5 mb-6 flex-1 text-sm">
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-slate-600">{{ lang.t('pricing.pro_f1') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-slate-600">{{ lang.t('pricing.pro_f2') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-slate-600">{{ lang.t('pricing.pro_f3') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-slate-600">{{ lang.t('pricing.pro_f4') }}</span>
            </li>
          </ul>

          <a [href]="paymentConfig.lemonsqueezy.products.professional?.checkoutUrl || '#'"
             target="_blank"
             class="w-full py-3 px-4 rounded-xl text-center font-semibold text-sm
                    bg-blue-600/20 text-blue-500 border border-blue-500/30
                    hover:bg-blue-600/30 hover:border-blue-500/50
                    transition-all duration-300">
            {{ lang.t('pricing.pro_cta') }}
          </a>

          <a routerLink="/register" class="block mt-2 text-center text-xs text-blue-600 hover:text-blue-500 transition-colors">
            {{ lang.l('Proovi enne 14 päeva tasuta', 'Try 14 days free first') }}
          </a>
          <div class="mt-2 pt-3 border-t border-slate-200 text-center">
            <p class="text-xs text-slate-500">{{ lang.t('pricing.lawyer_pro') }}</p>
          </div>
        </div>

        <!-- Card 3: Business - POPULAR -->
        <div class="group glass-card p-5 rounded-2xl border-2 border-blue-500/50 flex flex-col relative
                    shadow-xl shadow-md hover:shadow-md transition-all duration-300 hover:-translate-y-1 feature-card">
          <div class="absolute inset-0 rounded-2xl animate-border-glow pointer-events-none"></div>

          <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold
                      bg-blue-600 text-white uppercase tracking-wider shadow-lg shadow-md badge-shine">
            {{ lang.t('pricing.popular') }}
          </div>

          <div class="mb-5 mt-2">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-slate-700 mb-1">Business</h3>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-extrabold score-counter">€299</span>
              <span class="text-slate-500 text-sm">/ {{ lang.t('pricing.month') }}</span>
            </div>
            <div class="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
              <svg class="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="text-[11px] font-medium text-blue-600">{{ lang.l('14 päeva tasuta', '14 days free') }}</span>
            </div>
          </div>

          <ul class="space-y-2.5 mb-6 flex-1 text-sm">
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-slate-600">{{ lang.t('pricing.biz_f1') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-slate-600">{{ lang.t('pricing.biz_f2') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-slate-600">{{ lang.t('pricing.biz_f3') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-slate-600">{{ lang.t('pricing.biz_f4') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-slate-600">{{ lang.t('pricing.biz_f5') }}</span>
            </li>
          </ul>

          <a [href]="paymentConfig.lemonsqueezy.products.business?.checkoutUrl || '#'"
             target="_blank"
             class="magnetic-btn w-full py-3 px-4 rounded-xl text-center font-bold text-sm
                    bg-blue-600 text-white
                    hover:bg-blue-700 hover:shadow-lg hover:shadow-lg
                    transition-all duration-300">
            {{ lang.t('pricing.biz_cta') }}
          </a>

          <a routerLink="/register" class="block mt-2 text-center text-xs text-blue-600 hover:text-blue-500 transition-colors">
            {{ lang.l('Proovi enne 14 päeva tasuta', 'Try 14 days free first') }}
          </a>
          <div class="mt-2 pt-3 border-t border-slate-200 text-center">
            <p class="text-xs text-slate-500">{{ lang.t('pricing.lawyer_biz') }}</p>
          </div>
        </div>

        <!-- Card 4: Enterprise - BEST VALUE -->
        <div class="group glass-card p-5 rounded-2xl border border-purple-500/30 flex flex-col relative hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-1 feature-card">
          <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold
                      bg-gradient-to-r from-purple-500 to-pink-500 text-white uppercase tracking-wider shadow-lg shadow-purple-500/30 badge-shine">
            {{ lang.t('pricing.best_value') }}
          </div>

          <div class="mb-5 mt-2">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-slate-700 mb-1">Enterprise</h3>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-extrabold text-purple-400">€499</span>
              <span class="text-slate-500 text-sm">/ {{ lang.t('pricing.month') }}</span>
            </div>
          </div>

          <ul class="space-y-2.5 mb-6 flex-1 text-sm">
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-slate-600">{{ lang.t('pricing.ent_f1') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-slate-600">{{ lang.t('pricing.ent_f2') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-slate-600">{{ lang.t('pricing.ent_f3') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-slate-600">{{ lang.t('pricing.ent_f4') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-slate-600">{{ lang.t('pricing.ent_f5') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-slate-600">{{ lang.t('pricing.ent_f6') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-teal-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-slate-600">{{ lang.t('pricing.ent_f7') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-teal-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-slate-600">{{ lang.t('pricing.ent_f8') }}</span>
            </li>
          </ul>

          <a [href]="paymentConfig.lemonsqueezy.products.enterprise?.checkoutUrl || '#'"
             target="_blank"
             class="magnetic-btn w-full py-3 px-4 rounded-xl text-center font-bold text-sm
                    bg-gradient-to-r from-purple-500 to-pink-500 text-white
                    hover:from-purple-400 hover:to-pink-400 hover:shadow-lg hover:shadow-purple-500/30
                    transition-all duration-300">
            {{ lang.t('pricing.ent_cta') }}
          </a>

          <div class="mt-3 pt-3 border-t border-slate-200 text-center">
            <p class="text-xs text-slate-500">{{ lang.t('pricing.lawyer_ent') }}</p>
          </div>
        </div>
      </div>

      <!-- Feature comparison table -->
      <div class="mb-12">
        <h2 class="text-xl font-bold text-center text-slate-700 mb-6">{{ lang.t('pricing.compare_features') }}</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-200">
                <th class="text-left py-3 px-4 text-slate-400 font-medium">{{ lang.t('pricing.feature') }}</th>
                <th class="text-center py-3 px-2 text-slate-400 font-medium">Free</th>
                <th class="text-center py-3 px-2 text-blue-500 font-medium">Pro</th>
                <th class="text-center py-3 px-2 text-blue-600 font-medium">Business</th>
                <th class="text-center py-3 px-2 text-purple-400 font-medium">Enterprise</th>
              </tr>
            </thead>
            <tbody class="text-slate-600">
              <tr class="border-b border-slate-800/50">
                <td class="py-3 px-4">{{ lang.t('pricing.feat_scope') }}</td>
                <td class="text-center py-3 px-2 text-blue-600">✓</td>
                <td class="text-center py-3 px-2 text-blue-600">✓</td>
                <td class="text-center py-3 px-2 text-blue-600">✓</td>
                <td class="text-center py-3 px-2 text-blue-600">✓</td>
              </tr>
              <tr class="border-b border-slate-800/50">
                <td class="py-3 px-4">{{ lang.t('pricing.feat_full_assess') }}</td>
                <td class="text-center py-3 px-2 text-slate-600">—</td>
                <td class="text-center py-3 px-2 text-blue-500">DORA / NIS2</td>
                <td class="text-center py-3 px-2 text-blue-600">DORA + NIS2</td>
                <td class="text-center py-3 px-2 text-blue-600">DORA + NIS2</td>
              </tr>
              <tr class="border-b border-slate-800/50">
                <td class="py-3 px-4">{{ lang.t('pricing.feat_supply_chain') }}</td>
                <td class="text-center py-3 px-2 text-slate-600">—</td>
                <td class="text-center py-3 px-2 text-slate-600">—</td>
                <td class="text-center py-3 px-2 text-blue-600">✓</td>
                <td class="text-center py-3 px-2 text-blue-600">✓</td>
              </tr>
              <tr class="border-b border-slate-800/50">
                <td class="py-3 px-4">{{ lang.t('pricing.feat_ict_providers') }}</td>
                <td class="text-center py-3 px-2 text-slate-600">—</td>
                <td class="text-center py-3 px-2 text-slate-600">—</td>
                <td class="text-center py-3 px-2 text-blue-600">20</td>
                <td class="text-center py-3 px-2 text-purple-400">{{ lang.t('pricing.unlimited') }}</td>
              </tr>
              <tr class="border-b border-slate-800/50">
                <td class="py-3 px-4">{{ lang.t('pricing.feat_subcontractor') }}</td>
                <td class="text-center py-3 px-2 text-slate-600">—</td>
                <td class="text-center py-3 px-2 text-slate-600">—</td>
                <td class="text-center py-3 px-2 text-slate-600">—</td>
                <td class="text-center py-3 px-2 text-blue-600">✓</td>
              </tr>
              <tr class="border-b border-slate-800/50">
                <td class="py-3 px-4">{{ lang.t('pricing.feat_realtime') }}</td>
                <td class="text-center py-3 px-2 text-slate-600">—</td>
                <td class="text-center py-3 px-2 text-slate-600">—</td>
                <td class="text-center py-3 px-2 text-slate-600">—</td>
                <td class="text-center py-3 px-2 text-blue-600">✓</td>
              </tr>
              <tr class="border-b border-slate-800/50">
                <td class="py-3 px-4">{{ lang.t('pricing.feat_roi') }}</td>
                <td class="text-center py-3 px-2 text-slate-600">—</td>
                <td class="text-center py-3 px-2 text-slate-600">—</td>
                <td class="text-center py-3 px-2 text-slate-600">—</td>
                <td class="text-center py-3 px-2 text-blue-600">✓</td>
              </tr>
              <tr class="border-b border-slate-800/50">
                <td class="py-3 px-4">{{ lang.t('pricing.feat_branding') }}</td>
                <td class="text-center py-3 px-2 text-slate-600">—</td>
                <td class="text-center py-3 px-2 text-slate-600">—</td>
                <td class="text-center py-3 px-2 text-slate-600">—</td>
                <td class="text-center py-3 px-2 text-blue-600">✓</td>
              </tr>
              <tr class="border-b border-slate-800/50">
                <td class="py-3 px-4">{{ lang.t('pricing.feat_gap_analyzer') }}</td>
                <td class="text-center py-3 px-2 text-slate-600">—</td>
                <td class="text-center py-3 px-2 text-slate-600">—</td>
                <td class="text-center py-3 px-2 text-slate-600">—</td>
                <td class="text-center py-3 px-2 text-blue-600">✓</td>
              </tr>
              <tr>
                <td class="py-3 px-4">{{ lang.t('pricing.feat_policy_writer') }}</td>
                <td class="text-center py-3 px-2 text-slate-600">—</td>
                <td class="text-center py-3 px-2 text-slate-600">—</td>
                <td class="text-center py-3 px-2 text-slate-600">—</td>
                <td class="text-center py-3 px-2 text-blue-600">✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Footer note -->
      <div class="text-center">
        <p class="text-slate-500 text-sm flex items-center justify-center gap-3 flex-wrap">
          <span class="flex items-center gap-1.5">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ lang.t('pricing.note_1') }}
          </span>
          <span class="text-slate-700">•</span>
          <span class="flex items-center gap-1.5">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ lang.t('pricing.note_2') }}
          </span>
          <span class="text-slate-700">•</span>
          <span class="flex items-center gap-1.5">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  constructor(
    public lang: LangService,
    private titleService: Title,
    public subscriptionService: SubscriptionService
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle(this.lang.t('title.pricing'));
  }

  get currentPlan(): string {
    return this.subscriptionService.currentPlan();
  }

  get isPremium(): boolean {
    return this.subscriptionService.isPremium();
  }
}
