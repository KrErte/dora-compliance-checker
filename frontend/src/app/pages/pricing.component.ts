import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto animate-fade-in-up">
      <div class="text-center mb-12">
        <h1 class="text-3xl font-bold gradient-text mb-2">{{ lang.t('pricing.title') }}</h1>
        <p class="text-slate-400">{{ lang.t('pricing.subtitle') }}</p>
      </div>

      <!-- Pricing cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <!-- Free -->
        <div class="glass-card p-6 flex flex-col">
          <h3 class="text-lg font-bold text-slate-200 mb-1">{{ lang.t('pricing.free') }}</h3>
          <p class="text-sm text-slate-500 mb-4">{{ lang.t('pricing.free_desc') }}</p>
          <div class="mb-6">
            <span class="text-4xl font-bold text-slate-100">&euro;{{ lang.t('pricing.free_price') }}</span>
          </div>
          <ul class="text-sm text-slate-400 space-y-3 mb-8 flex-1">
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              {{ lang.t('pricing.free_f1') }}
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              {{ lang.t('pricing.free_f2') }}
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              {{ lang.t('pricing.free_f3') }}
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              {{ lang.t('pricing.free_f4') }}
            </li>
          </ul>
          <a routerLink="/register"
             class="block w-full text-center py-3 rounded-lg font-semibold text-sm transition-all duration-300
                    bg-slate-700/50 text-slate-300 border border-slate-600/50
                    hover:bg-slate-600/50 hover:text-emerald-400 hover:border-emerald-500/30">
            {{ lang.t('pricing.free_cta') }}
          </a>
        </div>

        <!-- Pro (highlighted) -->
        <div class="glass-card p-6 flex flex-col border-emerald-500/30 relative bg-gradient-to-b from-emerald-500/5 to-transparent">
          <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold
                      bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900">
            {{ lang.t('pricing.popular') }}
          </div>
          <h3 class="text-lg font-bold text-emerald-300 mb-1">{{ lang.t('pricing.pro') }}</h3>
          <p class="text-sm text-slate-500 mb-4">{{ lang.t('pricing.pro_desc') }}</p>
          <div class="mb-6">
            <span class="text-4xl font-bold text-slate-100">&euro;{{ lang.t('pricing.pro_price') }}</span>
            <span class="text-slate-500 text-sm">{{ lang.t('pricing.pro_period') }}</span>
          </div>
          <ul class="text-sm text-slate-400 space-y-3 mb-8 flex-1">
            <li *ngFor="let f of ['pro_f1','pro_f2','pro_f3','pro_f4','pro_f5','pro_f6','pro_f7']" class="flex items-start gap-2">
              <svg class="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              {{ lang.t('pricing.' + f) }}
            </li>
          </ul>
          <a routerLink="/register"
             class="block w-full text-center py-3 rounded-lg font-semibold text-sm transition-all duration-300
                    bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900
                    hover:from-emerald-400 hover:to-cyan-400 hover:shadow-lg hover:shadow-emerald-500/25">
            {{ lang.t('pricing.pro_cta') }}
          </a>
        </div>

        <!-- Enterprise -->
        <div class="glass-card p-6 flex flex-col">
          <h3 class="text-lg font-bold text-slate-200 mb-1">{{ lang.t('pricing.enterprise') }}</h3>
          <p class="text-sm text-slate-500 mb-4">{{ lang.t('pricing.enterprise_desc') }}</p>
          <div class="mb-6">
            <span class="text-2xl font-bold text-slate-100">{{ lang.t('pricing.enterprise_price') }}</span>
          </div>
          <ul class="text-sm text-slate-400 space-y-3 mb-8 flex-1">
            <li *ngFor="let f of ['enterprise_f1','enterprise_f2','enterprise_f3','enterprise_f4','enterprise_f5','enterprise_f6','enterprise_f7']" class="flex items-start gap-2">
              <svg class="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              {{ lang.t('pricing.' + f) }}
            </li>
          </ul>
          <a routerLink="/" fragment="contact"
             class="block w-full text-center py-3 rounded-lg font-semibold text-sm transition-all duration-300
                    bg-slate-700/50 text-slate-300 border border-slate-600/50
                    hover:bg-slate-600/50 hover:text-emerald-400 hover:border-emerald-500/30">
            {{ lang.t('pricing.enterprise_cta') }}
          </a>
        </div>
      </div>

      <!-- Guarantee -->
      <div class="text-center mb-12">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          <span class="text-sm text-emerald-300 font-medium">{{ lang.t('pricing.guarantee') }}</span>
        </div>
      </div>

      <!-- FAQ -->
      <div class="max-w-2xl mx-auto mb-12">
        <h2 class="text-xl font-bold text-slate-200 text-center mb-8">{{ lang.t('pricing.faq_title') }}</h2>
        <div class="space-y-4">
          <div *ngFor="let faq of faqs; let i = index"
               class="glass-card p-5 cursor-pointer"
               (click)="toggleFaq(i)">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-slate-200">{{ lang.t(faq.q) }}</h3>
              <svg class="w-4 h-4 text-slate-500 transition-transform duration-200"
                   [class.rotate-180]="faq.open"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
            <p *ngIf="faq.open" class="text-sm text-slate-400 mt-3 leading-relaxed">{{ lang.t(faq.a) }}</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PricingComponent {
  faqs = [
    { q: 'pricing.faq1_q', a: 'pricing.faq1_a', open: false },
    { q: 'pricing.faq2_q', a: 'pricing.faq2_a', open: false },
    { q: 'pricing.faq3_q', a: 'pricing.faq3_a', open: false },
    { q: 'pricing.faq4_q', a: 'pricing.faq4_a', open: false }
  ];

  constructor(public lang: LangService) {}

  toggleFaq(index: number) {
    this.faqs[index].open = !this.faqs[index].open;
  }
}
