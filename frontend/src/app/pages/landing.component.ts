import { Component, OnInit, OnDestroy, AfterViewInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { LangService } from '../lang.service';
import { ApiService } from '../api.service';
import { TrackingService } from '../tracking.service';
import { Subject } from 'rxjs';

interface DoraRequirement {
  id: string;
  name: string;
  nameKey?: string;
  description: string;
  descKey?: string;
  checked: boolean;
  expanded: boolean;
}

@Component({
  selector: 'app-landing',
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <!-- Hero section -->
    <div class="relative overflow-hidden">
      <!-- Subtle gradient background -->
      <div class="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800"></div>
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl"></div>

      <div class="relative flex flex-col items-center justify-center min-h-[60vh] text-center z-10 py-16 px-4">
        <!-- Live badge -->
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span class="text-xs font-medium text-emerald-400">{{ lang.t('landing.live_badge') || 'DORA & NIS2 Active' }}</span>
        </div>

        <h1 class="text-4xl md:text-5xl font-extrabold mb-5 leading-tight max-w-3xl">
          <span class="gradient-text">{{ lang.t('landing.title') }}</span>
        </h1>

        <p class="text-lg text-slate-300 max-w-2xl mb-10 leading-relaxed">
          {{ lang.t('landing.subtitle') }}
        </p>

        <!-- CTA buttons -->
        <div class="flex flex-col items-center gap-4">
          <a routerLink="/contract-analysis"
             class="group inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400
                    text-slate-900 font-bold px-10 py-4 rounded-xl text-lg w-full sm:w-auto justify-center
                    hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            {{ lang.t('landing.cta_free_check') }}
            <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </a>
          <div class="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-3 sm:gap-4 mt-1">
            <a routerLink="/nis2/scope-check"
               class="text-sm text-slate-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1.5 py-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              {{ lang.t('landing.cta_nis2_secondary') }}
            </a>
            <span class="text-slate-700 hidden sm:inline">|</span>
            <a routerLink="/fine-calculator"
               class="text-sm text-slate-400 hover:text-red-400 transition-colors inline-flex items-center gap-1.5 py-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ lang.t('landing.cta_fine_calc') }}
            </a>
            <span class="text-slate-700 hidden sm:inline">|</span>
            <a routerLink="/timeline"
               class="text-sm text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5 py-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              {{ lang.t('landing.cta_timeline') || 'Timeline' }}
            </a>
          </div>
          <!-- Inline trust signals -->
          <p class="text-xs text-slate-500 mt-2">
            <span class="text-emerald-400 font-medium">{{ lang.l('14 päeva tasuta prooviaeg', '14-day free trial') }}</span>
            · {{ lang.t('landing.trust_no_cc') }} · {{ lang.t('landing.trust_instant') }} · {{ lang.t('landing.trust_pdf') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Free Trial CTA Banner -->
    <div class="py-10 px-4">
      <div class="max-w-3xl mx-auto">
        <div class="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-slate-800/80 to-cyan-500/10 p-8 md:p-10">
          <div class="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div class="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div class="flex-1 text-center md:text-left">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-3">
                <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider">{{ lang.l('Tasuta prooviaeg', 'Free Trial') }}</span>
              </div>
              <h2 class="text-xl md:text-2xl font-bold text-white mb-2">{{ lang.l('Proovi 14 päeva kõiki premium funktsioone', 'Try all premium features for 14 days') }}</h2>
              <p class="text-sm text-slate-400 mb-1">{{ lang.l('Registreeru ja saa koheselt ligipääs AI lepinguanalüüsile, poliitikageneraatorile, PDF eksportidele ja muule.', 'Sign up and get instant access to AI contract analysis, policy generator, PDF exports, and more.') }}</p>
              <p class="text-xs text-slate-500">{{ lang.l('Krediitkaarti pole vaja · Tühista igal ajal', 'No credit card required · Cancel anytime') }}</p>
            </div>
            <div class="shrink-0">
              <a routerLink="/register"
                 class="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-900 font-bold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25 whitespace-nowrap">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                {{ lang.l('Alusta tasuta proovi', 'Start Free Trial') }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- How It Works -->
    <div class="py-14 relative">
      <div class="relative z-10">
        <div class="text-center mb-10">
          <h2 class="text-2xl md:text-3xl font-bold text-slate-100">{{ lang.t('landing.steps_title') }}</h2>
        </div>

        <div class="max-w-4xl mx-auto px-4">
          <div class="how-it-works-grid">
            <ng-container *ngFor="let step of steps; let i = index; let last = last">
              <!-- Step card -->
              <div class="how-it-works-card group" [style.animation-delay]="i * 150 + 'ms'">
                <!-- Step number badge -->
                <span class="hiw-badge">{{ i + 1 }}</span>

                <!-- Icon -->
                <div class="hiw-icon-wrap">
                  <svg class="w-10 h-10 text-[#00d4aa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" [attr.d]="step.icon"/>
                  </svg>
                </div>

                <!-- Text -->
                <h3 class="font-bold text-base text-slate-100 mb-1">{{ lang.t(step.titleKey) }}</h3>
                <p class="text-sm text-slate-400 leading-snug line-clamp-2">{{ lang.t(step.descKey) }}</p>
              </div>

              <!-- Arrow between cards (desktop only) -->
              <div *ngIf="!last" class="hiw-arrow hidden md:flex items-center justify-center">
                <svg class="w-6 h-6 text-[#00d4aa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </div>
            </ng-container>
          </div>
        </div>
      </div>
    </div>

    <!-- Social Proof Bar -->
    <div class="py-8 px-4 bg-gradient-to-b from-slate-800/60 to-slate-900/60 border-y border-slate-700/30">
      <div class="max-w-4xl mx-auto">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <!-- DORA articles covered -->
          <div class="text-center">
            <div class="text-3xl md:text-4xl font-extrabold text-emerald-400 mb-1">64</div>
            <div class="text-xs text-slate-400 uppercase tracking-wider">{{ lang.t('landing.social_articles') }}</div>
          </div>
          <!-- AI-analyzed sub-requirements -->
          <div class="text-center">
            <div class="text-3xl md:text-4xl font-extrabold text-cyan-400 mb-1">45</div>
            <div class="text-xs text-slate-400 uppercase tracking-wider">{{ lang.l('AI-analüüsitud alanõuet', 'AI-Analyzed Sub-Requirements') }}</div>
          </div>
          <!-- Analysis time -->
          <div class="text-center">
            <div class="text-3xl md:text-4xl font-extrabold text-teal-400 mb-1">5 min</div>
            <div class="text-xs text-slate-400 uppercase tracking-wider">{{ lang.t('landing.social_analysis') }}</div>
          </div>
          <!-- Regulations -->
          <div class="text-center">
            <div class="text-3xl md:text-4xl font-extrabold text-violet-400 mb-1">4</div>
            <div class="text-xs text-slate-400 uppercase tracking-wider">{{ lang.t('landing.social_regulations') }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- DORA Status Info -->
    <div class="py-6 px-4">
      <div class="max-w-2xl mx-auto text-center">
        <div class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
          <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          <span class="text-sm font-medium text-emerald-300">{{ lang.t('landing.dora_active_since') || 'DORA on jõus alates 17. jaanuarist 2025' }}</span>
        </div>
      </div>
    </div>

    <!-- Contract Analysis CTA Card -->
    <div class="py-8 max-w-2xl mx-auto px-4">
      <a routerLink="/contract-analysis"
         class="glass-card block p-6 rounded-2xl border border-cyan-500/30 hover:border-cyan-400 cursor-pointer transition-all duration-300 hover:bg-cyan-500/5 hover:shadow-lg hover:shadow-cyan-500/10 group">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 group-hover:bg-cyan-500/20 transition-colors">
            <svg class="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors mb-1">{{ lang.t('landing.contract_cta_title') }}</h3>
            <p class="text-sm text-slate-400">{{ lang.t('landing.contract_cta_desc') }}</p>
          </div>
          <svg class="w-6 h-6 text-cyan-400 group-hover:translate-x-1 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </div>
      </a>
    </div>

    <!-- Interactive DORA Requirements Table -->
    <div class="py-16 max-w-4xl mx-auto px-4">
      <div class="text-center mb-10">
        <p class="text-xs font-medium text-teal-400 uppercase tracking-wider mb-2">{{ lang.t('landing.interactive_label') }}</p>
        <h2 class="text-2xl font-bold text-slate-100">{{ lang.t('landing.interactive_title') }}</h2>
        <p class="text-slate-500 text-sm mt-2">{{ lang.t('landing.interactive_desc') }}</p>
      </div>

      <div class="requirements-table rounded-xl overflow-x-auto border border-slate-700/50">
        <table class="w-full min-w-[480px]">
          <caption class="sr-only">{{ lang.t('landing.table_caption') }}</caption>
          <thead class="bg-slate-800/80">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-12">{{ lang.t('landing.table_check') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{{ lang.t('landing.table_requirement') }}</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider w-20">{{ lang.t('landing.table_status') }}</th>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngFor="let req of requirements; let i = index">
              <tr class="requirement-row border-t border-slate-700/50 cursor-pointer hover:bg-slate-800/50 transition-colors"
                  (click)="toggleRequirement(req)" [class.expanded]="req.expanded">
                <td class="px-4 py-4">
                  <input type="checkbox" [(ngModel)]="req.checked" (click)="$event.stopPropagation()"
                         [id]="'req-checkbox-' + req.id"
                         [attr.aria-label]="(req.nameKey ? lang.t(req.nameKey) : req.name) + ' - ' + (req.checked ? lang.t('landing.table_ok') : lang.t('landing.table_missing'))"
                         class="w-5 h-5 rounded border-slate-600 bg-slate-700 text-teal-500 focus:ring-teal-500 cursor-pointer">
                  <label [for]="'req-checkbox-' + req.id" class="sr-only">{{ req.nameKey ? lang.t(req.nameKey) : req.name }}</label>
                </td>
                <td class="px-4 py-4">
                  <div class="flex items-center gap-2">
                    <span class="text-slate-500 transition-transform duration-200" [class.rotate-90]="req.expanded">▸</span>
                    <span class="text-slate-200 font-medium">
                      {{ req.nameKey ? lang.t(req.nameKey) : req.name }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-4 text-right">
                  <span *ngIf="req.checked" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    {{ lang.t('landing.table_ok') }}
                  </span>
                  <span *ngIf="!req.checked" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                    {{ lang.t('landing.table_missing') }}
                  </span>
                </td>
              </tr>
              <tr *ngIf="req.expanded" class="bg-slate-800/30 animate-slide-down">
                <td colspan="3" class="px-4 py-4">
                  <div class="text-sm text-slate-400 pl-9">
                    <p class="mb-3 leading-relaxed">{{ req.descKey ? lang.t(req.descKey) : req.description }}</p>
                    <a routerLink="/contract-analysis" class="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 text-xs font-medium">
                      {{ lang.t('landing.table_check_contract') }}
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                      </svg>
                    </a>
                  </div>
                </td>
              </tr>
            </ng-container>
          </tbody>
        </table>
      </div>

      <div class="mt-4 text-center">
        <p class="text-slate-500 text-sm">
          {{ lang.t('landing.table_checked') }}: <span class="text-teal-400 font-medium">{{ checkedCount }}</span> / {{ requirements.length }}
        </p>
      </div>
    </div>

    <!-- DoraBot AI Assistant Showcase -->
    <div class="py-16 relative">
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>
      <div class="relative z-10 max-w-5xl mx-auto px-4">
        <div class="grid md:grid-cols-2 gap-8 items-center">
          <!-- Left: Text -->
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <div class="w-4 h-4 rounded bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 text-[7px] font-bold">AI</div>
              <span class="text-xs font-medium text-emerald-400 uppercase tracking-wider">{{ lang.t('landing.ai_badge') }}</span>
            </div>
            <h2 class="text-2xl md:text-3xl font-bold text-slate-100 mb-3">{{ lang.t('landing.ai_title') }}</h2>
            <p class="text-slate-400 text-sm leading-relaxed mb-6">{{ lang.t('landing.ai_desc') }}</p>
            <div class="space-y-3 mb-6">
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span class="text-sm text-slate-300">{{ lang.t('landing.ai_f1') }}</span>
              </div>
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span class="text-sm text-slate-300">{{ lang.t('landing.ai_f2') }}</span>
              </div>
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span class="text-sm text-slate-300">{{ lang.t('landing.ai_f3') }}</span>
              </div>
            </div>
            <a routerLink="/chat" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm font-medium hover:from-emerald-500 hover:to-cyan-500 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {{ lang.t('landing.ai_cta') }}
            </a>
          </div>
          <!-- Right: Chat preview mockup -->
          <div class="relative">
            <div class="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden max-w-sm mx-auto">
              <!-- Chat header -->
              <div class="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 border-b border-slate-700/50">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 font-bold text-xs">AI</div>
                <div>
                  <div class="text-sm font-semibold text-white">DoraBot</div>
                  <div class="text-[10px] text-emerald-400">{{ lang.t('chat.subtitle') }}</div>
                </div>
              </div>
              <!-- Mock messages -->
              <div class="px-3 py-3 space-y-3">
                <div class="flex justify-end">
                  <div class="max-w-[80%] px-3 py-2 rounded-xl rounded-br-sm bg-emerald-600/20 text-emerald-100 border border-emerald-500/20 text-sm">
                    {{ lang.t('landing.ai_q') }}
                  </div>
                </div>
                <div class="flex">
                  <div class="max-w-[85%] px-3 py-2 rounded-xl rounded-bl-sm bg-slate-800 text-slate-200 border border-slate-700/50 text-sm leading-relaxed">
                    {{ lang.t('landing.ai_a') }}
                  </div>
                </div>
                <div class="flex">
                  <div class="max-w-[85%]">
                    <div class="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      {{ lang.t('chat.try_tool') }}: {{ lang.t('landing.ai_tool') }}
                    </div>
                  </div>
                </div>
              </div>
              <!-- Mock input -->
              <div class="px-3 py-3 border-t border-slate-700/50">
                <div class="flex gap-2">
                  <div class="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-500">{{ lang.t('chat.placeholder') }}</div>
                  <div class="px-3 py-2 rounded-xl bg-emerald-600 text-white">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </div>
                </div>
              </div>
            </div>
            <!-- Glow effect -->
            <div class="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-3xl blur-2xl -z-10"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI-Powered Enterprise Tools Showcase -->
    <div class="py-16 px-4">
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-10">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 mb-4">
            <div class="w-4 h-4 rounded bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center text-slate-900 text-[7px] font-bold">AI</div>
            <span class="text-xs font-medium text-teal-400 uppercase tracking-wider">{{ lang.l('Enterprise AI tööriistad', 'Enterprise AI Tools') }}</span>
          </div>
          <h2 class="text-2xl md:text-3xl font-bold text-slate-100 mb-3">{{ lang.l('AI-põhine vastavuse automatiseerimine', 'AI-Powered Compliance Automation') }}</h2>
          <p class="text-slate-400 text-sm max-w-lg mx-auto">{{ lang.l('Minge põhihindamistest kaugemale. Meie AI tööriistad analüüsivad dokumente, genereerivad poliitikaid ja jälgivad intsidente — kõik seotud DORA artiklitega.', 'Go beyond basic assessments. Our AI tools analyze your documents, generate policies, and track incidents — all mapped to DORA articles.') }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Evidence Gap Analyzer -->
          <a routerLink="/evidence-gap-analyzer"
             class="glass-card p-5 rounded-xl border border-teal-500/30 hover:border-teal-400 cursor-pointer transition-all duration-300 hover:bg-teal-500/5 hover:shadow-lg hover:shadow-teal-500/10 group">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0 group-hover:bg-teal-500/20 transition-colors">
                <svg class="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-sm font-semibold text-slate-200 group-hover:text-teal-300 transition-colors">{{ lang.l('Tõendite lünkaanalüüs', 'Evidence Gap Analyzer') }}</h3>
                  <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-500/20 text-teal-400">NEW</span>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed">{{ lang.l('Laadige üles poliitika/protseduur ja AI analüüsib seda 45 DORA alanõude vastu 10 artiklist. Saage leitud/osaline/puudu staatus igaühe kohta.', 'Upload any policy/procedure and AI analyzes it against 45 DORA sub-requirements across 10 articles. Get found/partial/missing status for each.') }}</p>
              </div>
            </div>
          </a>

          <!-- AI Policy Writer -->
          <a routerLink="/ai-policy-writer"
             class="glass-card p-5 rounded-xl border border-violet-500/30 hover:border-violet-400 cursor-pointer transition-all duration-300 hover:bg-violet-500/5 hover:shadow-lg hover:shadow-violet-500/10 group">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 group-hover:bg-violet-500/20 transition-colors">
                <svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-sm font-semibold text-slate-200 group-hover:text-violet-300 transition-colors">{{ lang.l('AI poliitikakirjutaja', 'AI Policy Writer') }}</h3>
                  <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-500/20 text-violet-400">AI</span>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed">{{ lang.l('Genereerige DORA-le vastavad IKT poliitikad, protseduurid ja raamistikud. AI loob teie organisatsioonile kohandatud dokumendid.', 'Generate DORA-compliant ICT policies, procedures, and frameworks. AI creates professional documents tailored to your organization.') }}</p>
              </div>
            </div>
          </a>

          <!-- Incident Management -->
          <a routerLink="/incident-reporting"
             class="glass-card p-5 rounded-xl border border-amber-500/30 hover:border-amber-400 cursor-pointer transition-all duration-300 hover:bg-amber-500/5 hover:shadow-lg hover:shadow-amber-500/10 group">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
                <svg class="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-sm font-semibold text-slate-200 group-hover:text-amber-300 transition-colors">{{ lang.l('IKT intsidentide haldamine', 'ICT Incident Management') }}</h3>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed">{{ lang.l('Täielik Art. 17-19 intsidendi elutsükkel: klassifitseeri, jälgi 4h/72h/1kuu tähtaegu, genereeri regulatiivseid raporteid.', 'Full Art. 17-19 incident lifecycle: classify, track 4h/72h/1mo deadlines, generate regulatory reports, and manage remediation.') }}</p>
              </div>
            </div>
          </a>

          <!-- AI Prosecutor -->
          <a routerLink="/prosecutor"
             class="glass-card p-5 rounded-xl border border-indigo-500/30 hover:border-indigo-400 cursor-pointer transition-all duration-300 hover:bg-indigo-500/5 hover:shadow-lg hover:shadow-indigo-500/10 group">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                <svg class="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 6l9 4 9-4M3 6v10l9 4M3 6l9-4 9 4M21 6v10l-9 4M12 16V6"/>
                </svg>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">{{ lang.l('AI prokurör', 'AI Prosecutor') }}</h3>
                  <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-400">AI</span>
                  <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400 animate-pulse">NEW</span>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed">{{ lang.l('AI-toega regulatiivne auditi simulatsioon. Agressiivne regulaator uurib teie DORA vastavust ja genereerib kohtuotsuse trahviriskiskooriga.', 'AI-powered mock regulatory audit. An aggressive regulator interrogates your DORA compliance and generates a prosecution verdict with fine risk score.') }}</p>
              </div>
            </div>
          </a>

          <!-- xBRL-CSV Export -->
          <a routerLink="/pricing"
             class="glass-card p-5 rounded-xl border border-cyan-500/30 hover:border-cyan-400 cursor-pointer transition-all duration-300 hover:bg-cyan-500/5 hover:shadow-lg hover:shadow-cyan-500/10 group">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 group-hover:bg-cyan-500/20 transition-colors">
                <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">{{ lang.l('xBRL-CSV regulatiivne eksport', 'xBRL-CSV Regulatory Export') }}</h3>
                  <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-400">ENT</span>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed">{{ lang.l('Eksportige vastavusandmed xBRL-CSV formaadis otse finantsjärelevalveasutustele esitamiseks.', 'Export compliance data in xBRL-CSV format for direct submission to financial supervisory authorities. Machine-readable regulatory reporting.') }}</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>

    <!-- DORA 5 Pillars - Enhanced with 3D Effect -->
    <div class="py-16 relative">
      <!-- Background decoration -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl"></div>
      </div>

      <div class="relative z-10">
        <div class="text-center mb-10">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span class="text-xs font-medium text-emerald-400 uppercase tracking-wider">{{ lang.t('landing.pillars_label') }}</span>
          </div>
          <h2 class="text-2xl md:text-3xl font-bold text-slate-100 mb-3">{{ lang.t('landing.pillars_title') }}</h2>
          <p class="text-slate-400 text-sm max-w-lg mx-auto">{{ lang.t('landing.pillars_desc') }}</p>
        </div>

        <p class="text-center text-xs text-slate-500 mb-6">{{ lang.t('landing.pillars_hint') }}</p>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-4xl mx-auto px-4 stagger-children">
          <a *ngFor="let pillar of pillars; let i = index" [routerLink]="'/pillar/' + pillar.id"
             [title]="lang.t('landing.pillar_tooltip')"
             class="tilt-card group"
             (mouseenter)="onPillarHover($event, i)"
             (mouseleave)="onPillarLeave($event, i)"
             (mousemove)="onPillarMove($event, i)">
            <div class="tilt-card-inner feature-card glass-card p-5 text-center rounded-xl border border-slate-700/50 group-hover:border-emerald-500/40 transition-all duration-300 relative overflow-hidden">
              <div class="tilt-card-shine"></div>
              <div class="feature-card-icon mb-3 floating-label">
                <svg class="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" [attr.d]="pillar.icon"/>
                </svg>
              </div>
              <h3 class="text-sm font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors mb-1">{{ lang.t(pillar.labelKey) }}</h3>
              <p class="text-xs text-slate-500 mb-2">{{ pillar.articles }}</p>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 badge-shine">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {{ lang.t('landing.active') }}
              </span>
            </div>
          </a>
        </div>
      </div>
    </div>

    <!-- Scope clarification -->
    <div class="py-12">
      <div class="max-w-2xl mx-auto glass-card p-6">
        <h2 class="text-sm font-semibold text-slate-300 mb-3">{{ lang.t('landing.scope_title') }}</h2>
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

    <!-- Trust Badges - Enhanced -->
    <div class="py-12">
      <div class="max-w-3xl mx-auto px-4">
        <div class="grid grid-cols-3 gap-4 sm:gap-6 text-center">
          <div *ngFor="let badge of trustBadges; let i = index"
               class="group flex flex-col items-center gap-3 p-4 sm:p-6 rounded-xl glass-card border border-slate-700/30 hover:border-emerald-500/30 transition-all duration-300 cursor-default"
               [style.animation-delay]="i * 100 + 'ms'">
            <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-black/20">
              <svg class="w-7 h-7" [class]="badge.color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" [attr.d]="badge.icon"/>
              </svg>
            </div>
            <span class="text-xs sm:text-sm text-slate-400 font-medium group-hover:text-slate-300 transition-colors">{{ lang.t(badge.textKey) }}</span>
          </div>
        </div>

        <!-- Additional trust indicators -->
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/30 border border-slate-700/30 text-xs text-slate-500">
            <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            {{ lang.t('landing.trust_gdpr') || 'GDPR Compliant' }}
          </div>
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/30 border border-slate-700/30 text-xs text-slate-500">
            <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            {{ lang.t('landing.trust_secure') || 'Bank-Level Security' }}
          </div>
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/30 border border-slate-700/30 text-xs text-slate-500">
            <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ lang.t('landing.trust_eu') || 'EU Data Centers' }}
          </div>
        </div>
      </div>
    </div>

    <!-- FAQ Section -->
    <div class="py-16 px-4">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-2xl font-bold text-slate-100 text-center mb-8">{{ lang.t('landing.faq_title') }}</h2>

        <div class="space-y-3">
          <!-- FAQ 1 -->
          <div class="glass-card rounded-xl border border-slate-700/50 overflow-hidden">
            <button (click)="toggleFaq(0)" [attr.aria-expanded]="expandedFaq === 0"
                    class="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-800/30 transition-colors">
              <span class="font-medium text-slate-200">{{ lang.t('landing.faq1_q') }}</span>
              <svg class="w-5 h-5 text-slate-400 transition-transform duration-200" [class.rotate-180]="expandedFaq === 0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <div *ngIf="expandedFaq === 0" class="px-6 pb-4 text-sm text-slate-400 animate-slide-down">
              {{ lang.t('landing.faq1_a') }}
            </div>
          </div>

          <!-- FAQ 2 -->
          <div class="glass-card rounded-xl border border-slate-700/50 overflow-hidden">
            <button (click)="toggleFaq(1)" [attr.aria-expanded]="expandedFaq === 1"
                    class="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-800/30 transition-colors">
              <span class="font-medium text-slate-200">{{ lang.t('landing.faq2_q') }}</span>
              <svg class="w-5 h-5 text-slate-400 transition-transform duration-200" [class.rotate-180]="expandedFaq === 1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <div *ngIf="expandedFaq === 1" class="px-6 pb-4 text-sm text-slate-400 animate-slide-down">
              {{ lang.t('landing.faq2_a') }}
            </div>
          </div>

          <!-- FAQ 3 -->
          <div class="glass-card rounded-xl border border-slate-700/50 overflow-hidden">
            <button (click)="toggleFaq(2)" [attr.aria-expanded]="expandedFaq === 2"
                    class="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-800/30 transition-colors">
              <span class="font-medium text-slate-200">{{ lang.t('landing.faq3_q') }}</span>
              <svg class="w-5 h-5 text-slate-400 transition-transform duration-200" [class.rotate-180]="expandedFaq === 2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <div *ngIf="expandedFaq === 2" class="px-6 pb-4 text-sm text-slate-400 animate-slide-down">
              {{ lang.t('landing.faq3_a') }}
            </div>
          </div>

          <!-- FAQ 4 -->
          <div class="glass-card rounded-xl border border-slate-700/50 overflow-hidden">
            <button (click)="toggleFaq(3)" [attr.aria-expanded]="expandedFaq === 3"
                    class="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-800/30 transition-colors">
              <span class="font-medium text-slate-200">{{ lang.t('landing.faq4_q') }}</span>
              <svg class="w-5 h-5 text-slate-400 transition-transform duration-200" [class.rotate-180]="expandedFaq === 3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <div *ngIf="expandedFaq === 3" class="px-6 pb-4 text-sm text-slate-400 animate-slide-down">
              {{ lang.t('landing.faq4_a') }}
            </div>
          </div>

          <!-- FAQ 5: Gap Analyzer -->
          <div class="glass-card rounded-xl border border-slate-700/50 overflow-hidden">
            <button (click)="toggleFaq(4)" [attr.aria-expanded]="expandedFaq === 4"
                    class="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-800/30 transition-colors">
              <span class="font-medium text-slate-200">{{ lang.t('landing.faq5_q') }}</span>
              <svg class="w-5 h-5 text-slate-400 transition-transform duration-200" [class.rotate-180]="expandedFaq === 4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <div *ngIf="expandedFaq === 4" class="px-6 pb-4 text-sm text-slate-400 animate-slide-down">
              {{ lang.t('landing.faq5_a') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contact Form -->
    <div id="contact" class="py-16 bg-slate-900/50">
      <div class="max-w-4xl mx-auto px-4">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-slate-100 mb-2">{{ lang.t('landing.contact_title') }}</h2>
          <p class="text-slate-400 text-sm">{{ lang.t('landing.contact_subtitle') }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Contact Form -->
          <div>
            <form (submit)="submitContact($event)" class="glass-card p-6" *ngIf="!contactSubmitted">
              <div class="flex flex-col gap-4">
                <div>
                  <label for="contact-name" class="block text-xs font-medium text-slate-400 mb-1.5">{{ lang.t('auth.full_name') }}</label>
                  <input type="text" [(ngModel)]="contactName" name="name" id="contact-name" required
                         [class]="'w-full px-4 py-3 rounded-xl bg-slate-800 border text-slate-200 placeholder-slate-500 focus:outline-none transition-colors ' +
                                  (contactNameError ? 'border-red-500 focus:border-red-400' : 'border-slate-700 focus:border-teal-500')"
                         [placeholder]="lang.t('landing.contact_name_placeholder')">
                  <p *ngIf="contactNameError" class="text-red-400 text-xs mt-1 animate-fade-in">
                    {{ lang.t('landing.contact_error_name') }}
                  </p>
                </div>
                <div>
                  <label for="contact-email" class="block text-xs font-medium text-slate-400 mb-1.5">{{ lang.t('auth.email') }}</label>
                  <input type="email" [(ngModel)]="contactEmail" name="email" id="contact-email" [placeholder]="lang.t('landing.contact_email_placeholder')"
                         [class]="'w-full px-4 py-3 rounded-xl bg-slate-800 border text-slate-200 placeholder-slate-500 focus:outline-none transition-colors ' +
                                  (contactEmailError ? 'border-red-500 focus:border-red-400' : 'border-slate-700 focus:border-teal-500')"
                         required>
                  <p *ngIf="contactEmailError" class="text-red-400 text-xs mt-1 animate-fade-in">
                    {{ lang.t('landing.contact_error') }}
                  </p>
                </div>
                <div>
                  <label for="contact-reason" class="block text-xs font-medium text-slate-400 mb-1.5">{{ lang.t('landing.contact_reason_label') }}</label>
                  <select [(ngModel)]="contactReason" name="reason" id="contact-reason"
                          [class]="'w-full px-4 py-3 rounded-xl bg-slate-800 border text-slate-200 focus:outline-none transition-colors cursor-pointer ' +
                                   (contactReasonError ? 'border-red-500 focus:border-red-400' : 'border-slate-700 focus:border-teal-500')">
                    <option value="" disabled>{{ lang.t('landing.contact_reason_placeholder') }}</option>
                    <option *ngFor="let reason of contactReasons" [value]="reason.value">{{ lang.t(reason.labelKey) }}</option>
                  </select>
                  <p *ngIf="contactReasonError" class="text-red-400 text-xs mt-1 animate-fade-in">
                    {{ lang.t('landing.contact_error_reason') }}
                  </p>
                </div>
                <div>
                  <label for="contact-message" class="block text-xs font-medium text-slate-400 mb-1.5">{{ lang.t('landing.contact_message_label') }}</label>
                  <textarea [(ngModel)]="contactMessage" name="message" id="contact-message" rows="3"
                            [class]="'w-full px-4 py-3 rounded-xl bg-slate-800 border text-slate-200 placeholder-slate-500 focus:outline-none transition-colors resize-none ' +
                                     (contactMessageError ? 'border-red-500 focus:border-red-400' : 'border-slate-700 focus:border-teal-500')"
                            [placeholder]="lang.t('landing.contact_message_placeholder')"></textarea>
                  <p *ngIf="contactMessageError" class="text-red-400 text-xs mt-1 animate-fade-in">
                    {{ lang.t('landing.contact_error_message') }}
                  </p>
                </div>
                <button type="submit" [disabled]="contactSending"
                        class="cta-button w-full px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <svg *ngIf="contactSending" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ contactSending ? lang.t('landing.contact_sending') : lang.t('landing.contact_btn') }}
                </button>
                <p *ngIf="contactServerError" class="text-red-400 text-sm text-center animate-fade-in">
                  {{ lang.t('landing.contact_server_error') }}
                </p>
              </div>
            </form>

            <div *ngIf="contactSubmitted" class="glass-card p-8 text-center animate-fade-in">
              <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-500/20 flex items-center justify-center">
                <svg class="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p class="text-teal-400 text-lg font-semibold mb-2">{{ lang.t('landing.contact_success') }}</p>
              <p class="text-slate-400 text-sm">{{ lang.t('landing.contact_subtitle') }}</p>
            </div>
          </div>

          <!-- Contact Info Card -->
          <div class="glass-card p-6 h-fit">
            <h3 class="text-lg font-semibold text-slate-100 mb-6">{{ lang.t('landing.contact_info_title') }}</h3>

            <div class="space-y-5">
              <!-- Email -->
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-xs text-slate-500 mb-1">{{ lang.t('landing.contact_email_label') }}</p>
                  <a href="mailto:info@doraaudit.eu" class="text-slate-200 hover:text-teal-400 transition-colors">info&#64;doraaudit.eu</a>
                </div>
              </div>

              <!-- Book Demo -->
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-xs text-slate-500 mb-1">{{ lang.t('landing.contact_demo_label') }}</p>
                  <a href="https://cal.com/kristo.erte/15min" target="_blank" rel="noopener"
                     class="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
                    {{ lang.t('landing.contact_demo_link') }}
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                  </a>
                </div>
              </div>

              <!-- Company -->
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-slate-200">DoraAudit.eu</p>
                  <p class="text-sm text-slate-400">{{ lang.t('footer.location') }}</p>
                </div>
              </div>

              <!-- LinkedIn -->
              <div class="pt-4 border-t border-slate-700/50">
                <p class="text-xs text-slate-500 mb-3">{{ lang.t('landing.contact_social') }}</p>
                <a href="https://www.linkedin.com/in/kristo-erte-52b73918a/" target="_blank" rel="noopener"
                   class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/30 hover:bg-slate-700/30 transition-all group">
                  <svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span class="text-sm text-slate-300 group-hover:text-blue-300">Kristo Erte</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  `,
  styles: [`
    /* How It Works */
    .how-it-works-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    @media (min-width: 768px) {
      .how-it-works-grid {
        grid-template-columns: 1fr auto 1fr auto 1fr;
        gap: 0;
        align-items: center;
      }
    }
    .how-it-works-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 1.5rem 1.25rem 1.25rem;
      max-height: 220px;
      border-radius: 1rem;
      border: 1px solid rgba(100, 116, 139, 0.3);
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(8px);
      transition: all 0.3s ease;
      animation: fadeInUp 0.6s ease-out both;
    }
    .how-it-works-card:hover {
      border-color: rgba(0, 212, 170, 0.4);
      box-shadow: 0 0 24px rgba(0, 212, 170, 0.08);
    }
    .hiw-badge {
      position: absolute;
      top: 0.625rem;
      left: 0.625rem;
      width: 1.5rem;
      height: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.5rem;
      font-size: 0.7rem;
      font-weight: 700;
      color: #0f172a;
      background: #00d4aa;
    }
    .hiw-icon-wrap {
      width: 3.5rem;
      height: 3.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.75rem;
      background: rgba(0, 212, 170, 0.1);
      margin-bottom: 0.75rem;
    }
    .hiw-arrow {
      padding: 0 0.5rem;
    }

    .cta-button {
      transition: all 0.3s ease;
    }

    .hover-underline {
      position: relative;
    }
    .hover-underline::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 0;
      height: 1px;
      background: currentColor;
      transition: width 0.3s ease;
    }
    .hover-underline:hover::after {
      width: 100%;
    }

    .stat-card {
      animation: fadeInUp 0.6s ease-out both;
    }

    .requirements-table {
      background: rgba(30, 41, 59, 0.5);
    }

    .requirement-row.expanded {
      background: rgba(30, 41, 59, 0.8);
    }

    .animate-slide-down {
      animation: slideDown 0.2s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .rotate-90 {
      transform: rotate(90deg);
    }


    .tabular-nums {
      font-variant-numeric: tabular-nums;
    }

    .animate-fade-in {
      animation: fadeIn 0.8s ease-out both;
    }

    .animate-slide-in {
      animation: slideIn 0.6s ease-out both;
    }

    .delay-100 { animation-delay: 100ms; }
    .delay-200 { animation-delay: 200ms; }
    .delay-300 { animation-delay: 300ms; }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class LandingComponent implements OnInit, OnDestroy, AfterViewInit {
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private destroy$ = new Subject<void>();
  private promoViewTracked = false;

  steps = [
    { titleKey: 'landing.step1_title', descKey: 'landing.step1_desc', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
    { titleKey: 'landing.step2_title', descKey: 'landing.step2_desc', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { titleKey: 'landing.step3_title', descKey: 'landing.step3_desc', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' }
  ];

  pillars = [
    { id: 'ICT_RISK_MANAGEMENT', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', labelKey: 'landing.pillar_risk', articles: 'Art. 5–16' },
    { id: 'INCIDENT_MANAGEMENT', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', labelKey: 'landing.pillar_incident', articles: 'Art. 17–23' },
    { id: 'TESTING', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', labelKey: 'landing.pillar_testing', articles: 'Art. 24–27' },
    { id: 'THIRD_PARTY', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', labelKey: 'landing.pillar_thirdparty', articles: 'Art. 28–44' },
    { id: 'INFORMATION_SHARING', icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z', labelKey: 'landing.pillar_info', articles: 'Art. 45' }
  ];

  requirements: DoraRequirement[] = [
    { id: '1', name: '', nameKey: 'landing.req1_name', description: '', descKey: 'landing.req1_desc', checked: true, expanded: false },
    { id: '2', name: '', nameKey: 'landing.req2_name', description: '', descKey: 'landing.req2_desc', checked: true, expanded: false },
    { id: '3', name: '', nameKey: 'landing.req3_name', description: '', descKey: 'landing.req3_desc', checked: false, expanded: false },
    { id: '4', name: '', nameKey: 'landing.req4_name', description: '', descKey: 'landing.req4_desc', checked: false, expanded: false },
    { id: '5', name: '', nameKey: 'landing.req5_name', description: '', descKey: 'landing.req5_desc', checked: true, expanded: false },
    { id: '6', name: '', nameKey: 'landing.req6_name', description: '', descKey: 'landing.req6_desc', checked: false, expanded: false },
    { id: '7', name: '', nameKey: 'landing.req7_name', description: '', descKey: 'landing.req7_desc', checked: true, expanded: false },
    { id: '8', name: '', nameKey: 'landing.req8_name', description: '', descKey: 'landing.req8_desc', checked: false, expanded: false }
  ];

  trustBadges = [
    { icon: 'M3 21V5a2 2 0 012-2h14a2 2 0 012 2v16l-7-3.5L3 21z', color: 'text-blue-400', textKey: 'landing.badge_estonian' },
    { icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'text-cyan-400', textKey: 'landing.badge_ai' },
    { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'text-emerald-400', textKey: 'landing.badge_eu' }
  ];

  contactName = '';
  contactEmail = '';
  contactReason = '';
  contactMessage = '';
  contactSubmitted = false;
  contactNameError = false;
  contactEmailError = false;
  contactReasonError = false;
  contactMessageError = false;
  contactServerError = false;
  contactSending = false;

  // Email subscription
  subscribeEmail = '';
  emailSubscribed = false;
  emailSending = false;
  emailError = false;

  // Public stats
  publicStats: { userCount: number; assessmentCount: number; contractAnalysisCount: number; totalChecks: number } | null = null;

  // FAQ accordion state
  expandedFaq: number | null = null;


  contactReasons = [
    { value: 'demo', labelKey: 'landing.contact_reason_demo' },
    { value: 'enterprise', labelKey: 'landing.contact_reason_enterprise' },
    { value: 'technical', labelKey: 'landing.contact_reason_technical' },
    { value: 'partnership', labelKey: 'landing.contact_reason_partnership' },
    { value: 'other', labelKey: 'landing.contact_reason_other' }
  ];

  constructor(
    public lang: LangService,
    private apiService: ApiService,
    private titleService: Title,
    private trackingService: TrackingService
  ) {}

  ngOnInit(): void {
    const title = this.lang.currentLang === 'et'
      ? 'DoraAudit.eu — DORA ja NIS2 vastavusplatvorm Baltikumi ettevõtetele'
      : 'DoraAudit.eu — DORA & NIS2 Compliance Platform for Baltic Companies';
    this.titleService.setTitle(title);
    this.loadPublicStats();

    // Track page view
    this.trackingService.trackPageView('/');
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) this.setupPromoSectionObserver();
  }

  private setupPromoSectionObserver(): void {
    // Delay to ensure the element is rendered
    setTimeout(() => {
      const promoSection = document.getElementById('promo-section');

      if (promoSection && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !this.promoViewTracked) {
              this.promoViewTracked = true;
              this.trackingService.trackPromoView();
              observer.disconnect();
            }
          });
        }, { threshold: 0.5 });

        observer.observe(promoSection);
      }
    }, 100);
  }

  loadPublicStats(): void {
    this.apiService.getPublicStats().subscribe({
      next: (stats) => {
        this.publicStats = stats;
      },
      error: () => {
        // Silently fail - will show platform capabilities instead
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get checkedCount(): number {
    return this.requirements.filter(r => r.checked).length;
  }

  get daysSinceDora(): number {
    const doraDate = new Date('2025-01-17');
    const now = new Date();
    return Math.floor((now.getTime() - doraDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  toggleRequirement(req: DoraRequirement): void {
    req.expanded = !req.expanded;
  }

  toggleFaq(index: number): void {
    this.expandedFaq = this.expandedFaq === index ? null : index;
  }

  submitContact(event: Event): void {
    event.preventDefault();
    this.contactNameError = false;
    this.contactEmailError = false;
    this.contactReasonError = false;
    this.contactMessageError = false;
    this.contactServerError = false;

    let hasError = false;
    if (!this.contactName || !this.contactName.trim()) {
      this.contactNameError = true;
      hasError = true;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.contactEmail || !emailRegex.test(this.contactEmail)) {
      this.contactEmailError = true;
      hasError = true;
    }
    if (!this.contactReason) {
      this.contactReasonError = true;
      hasError = true;
    }
    if (!this.contactMessage || !this.contactMessage.trim()) {
      this.contactMessageError = true;
      hasError = true;
    }
    if (hasError) return;

    this.contactSending = true;
    this.apiService.submitContact({
      name: this.contactName.trim(),
      email: this.contactEmail.trim(),
      reason: this.contactReason,
      message: this.contactMessage.trim()
    }).subscribe({
      next: () => {
        this.contactSending = false;
        this.contactSubmitted = true;
        this.contactName = '';
        this.contactEmail = '';
        this.contactReason = '';
        this.contactMessage = '';
      },
      error: () => {
        this.contactSending = false;
        this.contactServerError = true;
      }
    });
  }

  submitEmailSubscription(event: Event): void {
    event.preventDefault();
    this.emailError = false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.subscribeEmail || !emailRegex.test(this.subscribeEmail)) {
      this.emailError = true;
      return;
    }

    this.emailSending = true;
    this.apiService.subscribeForChecklist(this.subscribeEmail.trim()).subscribe({
      next: () => {
        this.emailSending = false;
        this.emailSubscribed = true;
        this.subscribeEmail = '';
      },
      error: () => {
        this.emailSending = false;
        this.emailError = true;
      }
    });
  }

  onRegisterCtaClick(ctaLocation: string): void {
    this.trackingService.trackCtaClick(`/register_from_${ctaLocation}`);
  }

  // 3D Tilt effect for pillar cards
  onPillarHover(event: MouseEvent, index: number): void {
    const card = (event.currentTarget as HTMLElement).querySelector('.tilt-card-inner') as HTMLElement;
    if (card) {
      card.style.transition = 'transform 0.1s ease-out';
    }
  }

  onPillarLeave(event: MouseEvent, index: number): void {
    const card = (event.currentTarget as HTMLElement).querySelector('.tilt-card-inner') as HTMLElement;
    if (card) {
      card.style.transition = 'transform 0.3s ease-out';
      card.style.transform = 'rotateY(0deg) rotateX(0deg) scale(1)';
    }
  }

  onPillarMove(event: MouseEvent, index: number): void {
    const card = (event.currentTarget as HTMLElement).querySelector('.tilt-card-inner') as HTMLElement;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  }
}
