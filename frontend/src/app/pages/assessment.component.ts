import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';
import { AuthService } from '../auth/auth.service';
import { PaywallService } from '../services/paywall.service';
import { PAYMENT_CONFIG } from '../config/payment.config';
import { DoraQuestion, AssessmentRequest, CATEGORY_LABELS } from '../models';

@Component({
  selector: 'app-assessment',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto">
      <!-- Progress stepper -->
      <div class="flex items-center justify-center gap-3 mb-10 animate-fade-in">
        <div class="flex items-center gap-2">
          <div [class]="step >= 1
            ? 'w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 text-sm font-bold'
            : 'w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-sm font-bold'">1</div>
          <span class="text-sm hidden sm:inline" [class]="step >= 1 ? 'text-emerald-400' : 'text-slate-500'">{{ lang.t('assessment.step_data') }}</span>
        </div>
        <div class="w-12 h-px" [class]="step >= 2 ? 'bg-emerald-500' : 'bg-slate-700'"></div>
        <div class="flex items-center gap-2">
          <div [class]="step >= 2
            ? 'w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 text-sm font-bold'
            : 'w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-sm font-bold'">2</div>
          <span class="text-sm hidden sm:inline" [class]="step >= 2 ? 'text-emerald-400' : 'text-slate-500'">{{ lang.t('assessment.step_questions') }}</span>
        </div>
        <div class="w-12 h-px" [class]="step >= 3 ? 'bg-emerald-500' : 'bg-slate-700'"></div>
        <div class="flex items-center gap-2">
          <div [class]="step >= 3
            ? 'w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 text-sm font-bold'
            : 'w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-sm font-bold'">3</div>
          <span class="text-sm hidden sm:inline" [class]="step >= 3 ? 'text-emerald-400' : 'text-slate-500'">{{ lang.t('assessment.step_results') }}</span>
        </div>
      </div>

      <h1 class="text-2xl font-bold mb-6 animate-fade-in-up">
        <span class="gradient-text">{{ lang.t('assessment.title') }}</span>
      </h1>

      <!-- Login warning for guests -->
      <div *ngIf="!auth.isLoggedIn()" class="flex items-start gap-3 mb-6 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm animate-fade-in">
        <svg class="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
        </svg>
        <div>
          <p class="text-amber-300 font-medium">{{ lang.t('assessment.login_warning') }}</p>
          <p class="text-slate-400 text-xs mt-1">{{ lang.t('assessment.login_warning_desc') }}</p>
        </div>
      </div>

      <div *ngIf="loading" class="text-center py-16 animate-fade-in">
        <div class="inline-block w-10 h-10 border-4 border-slate-700 border-t-emerald-400 rounded-full animate-spin"></div>
        <p class="text-slate-400 mt-4">{{ lang.t('assessment.loading') }}</p>
      </div>

      <div *ngIf="error" class="bg-red-900/30 border border-red-700/50 rounded-xl p-4 text-red-300 animate-scale-in">
        {{ error }}
      </div>

      <!-- Draft restored indicator -->
      <div *ngIf="hasDraft && !loading" class="flex items-center gap-2 mb-4 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-xs text-cyan-400 animate-fade-in">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        {{ lang.t('assessment.draft_restored') }} &middot; {{ answeredCount }} {{ lang.t('assessment.answers_saved') }}
      </div>

      <!-- Scenario buttons -->
      <div *ngIf="!loading && !error" class="flex flex-wrap gap-2 mb-6 animate-fade-in-up delay-100">
        <span class="text-xs text-slate-500 self-center mr-1">Demo:</span>
        <button type="button" (click)="applyScenario('ideal')"
                class="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20
                       hover:bg-emerald-500/20 transition-all duration-200">
          {{ lang.t('assessment.scenario_ideal') }}
        </button>
        <button type="button" (click)="applyScenario('average')"
                class="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20
                       hover:bg-amber-500/20 transition-all duration-200">
          {{ lang.t('assessment.scenario_average') }}
        </button>
        <button type="button" (click)="applyScenario('weak')"
                class="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20
                       hover:bg-red-500/20 transition-all duration-200">
          {{ lang.t('assessment.scenario_weak') }}
        </button>
        <button type="button" (click)="clearAll()"
                class="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-400 border border-slate-600/30
                       hover:bg-slate-600/50 transition-all duration-200">
          {{ lang.t('assessment.clear') }}
        </button>
      </div>

      <form *ngIf="!loading && !error" (ngSubmit)="onSubmit()" #assessmentForm="ngForm">
        <!-- Company info -->
        <div class="glass-card p-6 mb-6 card-hover animate-fade-in-up">
          <h2 class="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            {{ lang.t('assessment.company') }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label for="assess-company" class="block text-sm text-slate-400 mb-1.5">{{ lang.t('assessment.company_name') }}</label>
              <input type="text" [(ngModel)]="companyName" name="companyName" id="assess-company" required
                     class="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-slate-100
                            focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 focus:outline-none transition-all duration-300"
                     [placeholder]="lang.currentLang === 'et' ? 'OÜ Näidis' : 'Example Ltd'">
            </div>
            <div>
              <label for="assess-contract" class="block text-sm text-slate-400 mb-1.5">{{ lang.t('assessment.contract_name') }}</label>
              <input type="text" [(ngModel)]="contractName" name="contractName" id="assess-contract" required
                     class="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-slate-100
                            focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 focus:outline-none transition-all duration-300"
                     [placeholder]="lang.currentLang === 'et' ? 'Pilveteenus leping' : 'Cloud service agreement'">
            </div>
            <div>
              <label for="assess-sector" class="block text-sm text-slate-400 mb-1.5">{{ lang.t('assessment.sector') }}</label>
              <select [(ngModel)]="selectedSector" name="sector" id="assess-sector"
                      class="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-slate-100
                             focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 focus:outline-none transition-all duration-300 appearance-none">
                <option value="">{{ lang.t('assessment.select_sector') }}</option>
                <option *ngFor="let s of sectors" [value]="s.value">{{ lang.currentLang === 'et' ? s.et : s.en }}</option>
              </select>
            </div>
          </div>
          <!-- Sector hint -->
          <div *ngIf="sectorHint" class="mt-3 flex items-start gap-2 px-3 py-2 bg-cyan-500/5 border border-cyan-500/15 rounded-lg">
            <svg class="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-xs text-cyan-300/80">{{ sectorHint }}</p>
          </div>
        </div>

        <!-- Questions grouped by category -->
        <div *ngFor="let group of groupedQuestions; let gi = index"
             [id]="'cat-' + group.category"
             class="glass-card p-6 mb-4 card-hover animate-fade-in-up"
             [style.animation-delay]="(gi * 100 + 200) + 'ms'">
          <h2 class="text-lg font-semibold text-emerald-400 mb-1 flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg flex items-center justify-center text-base"
                  [class]="getCategoryIconBg(group.category)">{{ getCategoryIcon(group.category) }}</span>
            {{ getCategoryLabel(group.category) }}
            <span *ngIf="getCategoryProgress(group) === 100" class="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">&#10003;</span>
          </h2>
          <p class="text-xs text-slate-500 mb-4">{{ group.questions.length }} {{ lang.t('assessment.questions_count') }}</p>

          <div *ngFor="let q of group.questions; let i = index"
               class="py-4 border-b border-slate-700/50 last:border-b-0">
            <!-- Free questions (1-5) -->
            <div *ngIf="!isQuestionLocked(getGlobalIndex(gi, i))" class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div class="flex-1">
                <p class="text-slate-200 mb-1.5">
                  <span class="text-slate-500 text-sm mr-2">{{ getGlobalIndex(gi, i) }}.</span>
                  {{ q.questionEt }}
                </p>
                <div class="group relative inline-block">
                  <span class="text-xs text-slate-500 cursor-help border-b border-dashed border-slate-600 hover:text-emerald-400 transition-colors">
                    {{ q.articleReference }}
                  </span>
                  <div class="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200
                              absolute z-10 bottom-full left-0 mb-2 w-80 p-4 bg-slate-700/95 backdrop-blur
                              text-slate-200 text-xs rounded-xl shadow-2xl border border-slate-600/50">
                    <div class="font-semibold text-emerald-400 mb-1">{{ q.articleReference }}</div>
                    {{ q.explanation }}
                    <div class="absolute bottom-0 left-4 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-700 border-r border-b border-slate-600/50"></div>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1.5 shrink-0 mt-1">
                <button type="button"
                        (click)="answers[q.id] = 'yes'; autoSave()"
                        [class]="answers[q.id] === 'yes'
                          ? 'px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-900 shadow-lg shadow-emerald-500/20 scale-105 transition-all duration-200'
                          : 'px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-slate-200 transition-all duration-200'">
                  {{ lang.t('assessment.yes') }}
                </button>
                <button type="button"
                        (click)="answers[q.id] = 'partial'; autoSave()"
                        [class]="answers[q.id] === 'partial'
                          ? 'px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900 shadow-lg shadow-amber-500/20 scale-105 transition-all duration-200'
                          : 'px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-slate-200 transition-all duration-200'">
                  {{ lang.t('assessment.partial') }}
                </button>
                <button type="button"
                        (click)="answers[q.id] = 'no'; autoSave()"
                        [class]="answers[q.id] === 'no'
                          ? 'px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-red-500 to-red-400 text-white shadow-lg shadow-red-500/20 scale-105 transition-all duration-200'
                          : 'px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-slate-200 transition-all duration-200'">
                  {{ lang.t('assessment.no') }}
                </button>
              </div>
            </div>

            <!-- Locked questions (6+) - blurred -->
            <div *ngIf="isQuestionLocked(getGlobalIndex(gi, i))" class="blur-sm select-none pointer-events-none opacity-50">
              <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div class="flex-1">
                  <p class="text-slate-200 mb-1.5">
                    <span class="text-slate-500 text-sm mr-2">{{ getGlobalIndex(gi, i) }}.</span>
                    {{ q.questionEt }}
                  </p>
                </div>
                <div class="flex items-center gap-1.5 shrink-0 mt-1">
                  <button type="button" class="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-400">{{ lang.t('assessment.yes') }}</button>
                  <button type="button" class="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-400">{{ lang.t('assessment.partial') }}</button>
                  <button type="button" class="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-400">{{ lang.t('assessment.no') }}</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Paywall overlay - show after first locked question in this group -->
          <div *ngIf="showPaywallInGroup(gi)" class="relative -mx-6 -mb-6 mt-4 p-6 rounded-b-xl"
               style="background: linear-gradient(to bottom, transparent, rgba(15,23,42,0.95) 20%);">
            <div class="absolute inset-0 backdrop-blur-sm rounded-b-xl"></div>
            <div class="relative glass-card p-6 border border-emerald-500/30 text-center max-w-md mx-auto">
              <div class="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-slate-200 mb-2">{{ lang.t('paywall.unlock_title') }}</h3>
              <p class="text-sm text-slate-400 mb-6">{{ lang.t('paywall.dora_desc') }}</p>
              <div class="flex flex-col gap-3">
                <a [href]="paymentConfig.lemonsqueezy.products.doraAssessment.checkoutUrl"
                   target="_blank"
                   class="w-full py-3 px-4 rounded-xl text-center font-medium text-sm
                          bg-gradient-to-r from-emerald-500 to-cyan-500 text-white
                          hover:from-emerald-400 hover:to-cyan-400 hover:shadow-lg hover:shadow-emerald-500/25
                          transition-all duration-200">
                  {{ lang.t('paywall.buy_dora') }}
                </a>
                <a [href]="paymentConfig.lemonsqueezy.products.comboPackage.checkoutUrl"
                   target="_blank"
                   class="w-full py-2.5 px-4 rounded-xl text-center font-medium text-sm
                          bg-slate-700/50 text-slate-300 border border-slate-600/50
                          hover:bg-slate-600/50 hover:text-emerald-400 hover:border-emerald-500/30
                          transition-all duration-200">
                  {{ lang.t('paywall.buy_combo') }}
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Submit bar -->
        <div class="sticky bottom-4 mt-8 animate-fade-in-up delay-300">
          <div class="bg-slate-800/90 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-2xl">
            <!-- Live score preview -->
            <div *ngIf="answeredCount > 0" class="flex items-center gap-2 sm:gap-4 mb-3 pb-3 border-b border-slate-700/30">
              <div class="flex items-center gap-2 flex-1">
                <div class="relative w-10 h-10 shrink-0">
                  <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#334155" stroke-width="8"/>
                    <circle cx="50" cy="50" r="42" fill="none"
                            [attr.stroke]="liveScoreColor"
                            stroke-width="8"
                            stroke-linecap="round"
                            stroke-dasharray="263.89"
                            [attr.stroke-dashoffset]="263.89 - (263.89 * liveScorePercent / 100)"
                            class="transition-all duration-500"/>
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <span class="text-xs font-bold" [style.color]="liveScoreColor">{{ liveScorePercent | number:'1.0-0' }}</span>
                  </div>
                </div>
                <div>
                  <p class="text-xs text-slate-400">{{ lang.t('assessment.score_preview') }}</p>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold" [style.color]="liveScoreColor">{{ liveScoreLabel }}</span>
                    <span class="text-xs text-slate-600">&middot;</span>
                    <span class="text-xs text-emerald-400">{{ yesCount }} <span class="hidden sm:inline">{{ lang.t('assessment.yes') }}</span><span class="sm:hidden">{{ lang.t('assessment.yes').charAt(0) }}</span></span>
                    <span class="text-xs text-amber-400">{{ partialCount }} <span class="hidden sm:inline">{{ lang.t('assessment.partial') }}</span><span class="sm:hidden">{{ lang.t('assessment.partial').charAt(0) }}</span></span>
                    <span class="text-xs text-red-400">{{ noCount }} <span class="hidden sm:inline">{{ lang.t('assessment.no') }}</span><span class="sm:hidden">{{ lang.t('assessment.no').charAt(0) }}</span></span>
                  </div>
                </div>
              </div>
              <!-- Mini category bars -->
              <div class="hidden md:flex items-end gap-1 h-8">
                <div *ngFor="let bar of liveCategoryBars"
                     class="w-3 rounded-t transition-all duration-300"
                     [style.height.%]="bar.percent"
                     [style.min-height.px]="2"
                     [style.background]="bar.color"
                     [title]="bar.label + ': ' + bar.percent + '%'">
                </div>
              </div>
            </div>
            <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center gap-3">
                <div class="w-full bg-slate-700 rounded-full h-2 w-20 sm:w-32">
                  <div class="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
                       [style.width.%]="(answeredCount / totalQuestions) * 100">
                  </div>
                </div>
                <span class="text-sm text-slate-400">{{ answeredCount }} / {{ totalQuestions }}</span>
              </div>
            </div>
            <button type="submit"
                    [disabled]="!canSubmit || submitting"
                    [class]="canSubmit && !submitting
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-900 font-semibold px-8 py-2.5 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2'
                      : 'bg-slate-700 text-slate-500 font-semibold px-8 py-2.5 rounded-lg cursor-not-allowed flex items-center gap-2'">
              <span *ngIf="!submitting">{{ lang.t('assessment.submit') }}</span>
              <span *ngIf="submitting" class="flex items-center gap-2">
                <span class="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></span>
                {{ lang.t('assessment.submitting') }}
              </span>
              <svg *ngIf="!submitting" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </button>
          </div>
          </div>
        </div>
      </form>
    </div>
  `
})
export class AssessmentComponent implements OnInit {
  questions: DoraQuestion[] = [];
  groupedQuestions: { category: string; questions: DoraQuestion[] }[] = [];
  answers: { [id: number]: string } = {};
  companyName = '';
  contractName = '';
  loading = true;
  error = '';
  submitting = false;
  hasDraft = false;

  private scrollToCategory = '';

  // Pillar → category mapping
  private pillarCategories: { [key: string]: string[] } = {
    'ICT_RISK_MANAGEMENT': ['ICT_RISK_MANAGEMENT'],
    'INCIDENT_MANAGEMENT': ['INCIDENT_MANAGEMENT', 'INCIDENT'],
    'TESTING': ['TESTING'],
    'THIRD_PARTY': ['SERVICE_LEVEL', 'EXIT_STRATEGY', 'AUDIT', 'INCIDENT', 'DATA', 'SUBCONTRACTING', 'RISK', 'LEGAL', 'CONTINUITY'],
    'INFORMATION_SHARING': ['INFORMATION_SHARING']
  };

  private categoryIcons: { [key: string]: string } = {
    SERVICE_LEVEL: '\u{1F4CB}',
    EXIT_STRATEGY: '\u{1F6AA}',
    AUDIT: '\u{1F50D}',
    INCIDENT: '\u26A0\uFE0F',
    DATA: '\u{1F512}',
    SUBCONTRACTING: '\u{1F91D}',
    RISK: '\u{1F6E1}\uFE0F',
    LEGAL: '\u2696\uFE0F',
    CONTINUITY: '\u{1F504}',
    RECRUITMENT: '\u{1F465}',
    FINANCIAL_REPORTING: '\u{1F4B0}',
    ICT_RISK_MANAGEMENT: '\u{1F5A5}\uFE0F',
    INCIDENT_MANAGEMENT: '\u{1F6A8}',
    TESTING: '\u{1F9EA}',
    INFORMATION_SHARING: '\u{1F4E1}'
  };

  selectedSector = '';

  sectors = [
    { value: 'bank', et: 'Pank', en: 'Bank' },
    { value: 'insurance', et: 'Kindlustus', en: 'Insurance' },
    { value: 'payment', et: 'Makseasutus', en: 'Payment Institution' },
    { value: 'crypto', et: 'Kr\u00fcptovara teenusepakkuja', en: 'Crypto Asset Provider' },
    { value: 'fund', et: 'Fondivalitseja', en: 'Fund Manager' },
    { value: 'ict', et: 'IKT-teenusepakkuja', en: 'ICT Service Provider' }
  ];

  private sectorHints: { [key: string]: { et: string; en: string } } = {
    bank: { et: 'Pangad peavad tagama k\u00f5igi IKT-teenusepakkujate lepingute vastavuse DORA Art. 28\u201330. P\u00f6\u00f6rake erilist t\u00e4helepanu audit\u00f5igustele ja andmekaitsele.', en: 'Banks must ensure all ICT service provider contracts comply with DORA Art. 28\u201330. Pay special attention to audit rights and data protection.' },
    insurance: { et: 'Kindlustusseltsidel on sageli palju kolmandate osapoolte s\u00f5ltuvusi. Kontrollige eriti exit-strateegia ja \u00e4ritegevuse j\u00e4tkuvuse klausleid.', en: 'Insurance companies often have many third-party dependencies. Check especially exit strategy and business continuity clauses.' },
    payment: { et: 'Makseasutuste kriitilised teenused s\u00f5ltuvad IT-taristust. DORA n\u00f5uab rangemaid SLA ja intsidentide teavitamise klausleid.', en: 'Payment institutions\u2019 critical services depend on IT infrastructure. DORA requires stricter SLA and incident notification clauses.' },
    crypto: { et: 'Kr\u00fcptovara teenusepakkujad on DORA all uus reguleeritud sektor. K\u00f5ik IKT-lepingud vajavad \u00fclevaatamist.', en: 'Crypto asset providers are a newly regulated sector under DORA. All ICT contracts need review.' },
    fund: { et: 'Fondivalitsejad peavad kaardistama k\u00f5ik IKT-s\u00f5ltuvused ja tagama, et lepingud vastavad DORA kolmandate osapoolte n\u00f5uetele.', en: 'Fund managers must map all ICT dependencies and ensure contracts meet DORA third-party requirements.' },
    ict: { et: 'IKT-teenusepakkujatena peavad teie klientide lepingud vastama DORA n\u00f5uetele. See hindamine aitab tuvastada puudused.', en: 'As an ICT provider, your client contracts must meet DORA requirements. This assessment helps identify gaps.' }
  };

  get sectorHint(): string {
    if (!this.selectedSector) return '';
    const hint = this.sectorHints[this.selectedSector];
    return hint ? (this.lang.currentLang === 'et' ? hint.et : hint.en) : '';
  }

  paymentConfig = PAYMENT_CONFIG;
  private freeQuestionsLimit = 5;

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    public lang: LangService,
    public auth: AuthService,
    public paywall: PaywallService
  ) {}

  get step(): number {
    if (this.submitting) return 3;
    if (this.answeredCount > 0) return 2;
    return 1;
  }

  ngOnInit() {
    const pillar = this.route.snapshot.queryParamMap.get('pillar');
    if (pillar && this.pillarCategories[pillar]) {
      this.scrollToCategory = this.pillarCategories[pillar][0];
    }

    this.loadDraft();
    this.hasDraft = Object.keys(this.answers).length > 0;
    this.api.getQuestions().subscribe({
      next: (questions) => {
        this.questions = questions;
        this.groupByCategory();
        this.loading = false;
        if (this.scrollToCategory) {
          setTimeout(() => {
            const el = document.getElementById('cat-' + this.scrollToCategory);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 400);
        }
      },
      error: () => {
        this.error = this.lang.t('assessment.error_load');
        this.loading = false;
      }
    });
  }

  groupByCategory() {
    const map = new Map<string, DoraQuestion[]>();
    for (const q of this.questions) {
      if (!map.has(q.category)) map.set(q.category, []);
      map.get(q.category)!.push(q);
    }
    this.groupedQuestions = Array.from(map.entries()).map(([category, questions]) => ({
      category,
      questions
    }));
  }

  getCategoryLabel(category: string): string {
    const label = CATEGORY_LABELS[category];
    if (!label) return category;
    return this.lang.currentLang === 'et' ? label.et : label.en;
  }

  get totalQuestions(): number {
    return this.questions.length;
  }

  get answeredCount(): number {
    return Object.keys(this.answers).length;
  }

  get yesCount(): number {
    return Object.values(this.answers).filter(v => v === 'yes').length;
  }

  get partialCount(): number {
    return Object.values(this.answers).filter(v => v === 'partial').length;
  }

  get noCount(): number {
    return Object.values(this.answers).filter(v => v === 'no').length;
  }

  get liveScorePercent(): number {
    if (this.answeredCount === 0) return 0;
    const score = this.yesCount + this.partialCount * 0.5;
    return (score / this.answeredCount) * 100;
  }

  get liveScoreColor(): string {
    if (this.liveScorePercent >= 80) return '#34d399';
    if (this.liveScorePercent >= 50) return '#fbbf24';
    return '#f87171';
  }

  get liveScoreLabel(): string {
    if (this.liveScorePercent >= 80) return this.lang.t('assessment.compliant');
    if (this.liveScorePercent >= 50) return this.lang.t('assessment.partial');
    return this.lang.t('assessment.non_compliant');
  }

  get liveCategoryBars(): { label: string; percent: number; color: string }[] {
    return this.groupedQuestions.map(group => {
      const answered = group.questions.filter(q => this.answers[q.id] !== undefined);
      const yes = group.questions.filter(q => this.answers[q.id] === 'yes').length;
      const partial = group.questions.filter(q => this.answers[q.id] === 'partial').length;
      const total = answered.length;
      const score = yes + partial * 0.5;
      const percent = total > 0 ? (score / total) * 100 : 0;
      return {
        label: this.getCategoryLabel(group.category),
        percent,
        color: percent >= 100 ? '#34d399' : (percent > 0 ? '#fbbf24' : '#f87171')
      };
    });
  }

  get canSubmit(): boolean {
    return this.companyName.trim() !== ''
      && this.contractName.trim() !== ''
      && this.answeredCount === this.totalQuestions;
  }

  applyScenario(scenario: 'ideal' | 'average' | 'weak') {
    // Deterministic answers based on question index for consistency
    // Ideal: 100% yes
    // Average: ~60% yes, ~30% partial, ~10% no
    // Weak: ~20% yes, ~30% partial, ~50% no

    switch (scenario) {
      case 'ideal':
        this.companyName = 'AS Finantsteenused';
        this.contractName = 'Pilveteenuse SLA leping 2025';
        this.selectedSector = 'bank';
        // All questions get highest score
        for (const q of this.questions) {
          this.answers[q.id] = 'yes';
        }
        break;

      case 'average':
        this.companyName = 'OÜ DigiLahendused';
        this.contractName = 'IT-taristu hooldusleping';
        this.selectedSector = 'ict';
        // Deterministic: ~60% yes, ~30% partial, ~10% no
        this.questions.forEach((q, i) => {
          const mod = i % 10;
          if (mod < 6) {
            this.answers[q.id] = 'yes';      // 60% yes (0,1,2,3,4,5)
          } else if (mod < 9) {
            this.answers[q.id] = 'partial';  // 30% partial (6,7,8)
          } else {
            this.answers[q.id] = 'no';       // 10% no (9)
          }
        });
        // Make some categories weaker for realism
        this.setAnswerByCategory('AUDIT', 'partial', 2);
        this.setAnswerByCategory('EXIT_STRATEGY', 'partial', 1);
        this.setAnswerByCategory('TESTING', 'partial', 2);
        this.setAnswerByCategory('INFORMATION_SHARING', 'no', 1);
        break;

      case 'weak':
        this.companyName = 'OÜ Väikeettevõte';
        this.contractName = 'Põhiline IT-leping';
        this.selectedSector = 'ict';
        // Deterministic: ~20% yes, ~30% partial, ~50% no
        this.questions.forEach((q, i) => {
          const mod = i % 10;
          if (mod < 2) {
            this.answers[q.id] = 'yes';      // 20% yes (0,1)
          } else if (mod < 5) {
            this.answers[q.id] = 'partial';  // 30% partial (2,3,4)
          } else {
            this.answers[q.id] = 'no';       // 50% no (5,6,7,8,9)
          }
        });
        // Critical missing items for realism
        this.setAnswerByCategory('AUDIT', 'no');
        this.setAnswerByCategory('EXIT_STRATEGY', 'no');
        this.setAnswerByCategory('INCIDENT', 'no');
        this.setAnswerByCategory('CONTINUITY', 'no');
        this.setAnswerByCategory('TESTING', 'no');
        // Some basic items present
        this.setAnswerByCategory('SERVICE_LEVEL', 'partial', 2);
        this.setAnswerByCategory('LEGAL', 'yes', 1);
        break;
    }

    // Save progress after applying scenario
    this.autoSave();
  }

  /** Määra kategooria küsimustele vastus. Kui count on antud, muuda ainult nii palju. */
  private setAnswerByCategory(category: string, value: string, count?: number) {
    const qs = this.questions.filter(q => q.category === category);
    const target = count !== undefined ? Math.min(count, qs.length) : qs.length;
    for (let i = 0; i < target; i++) {
      this.answers[qs[i].id] = value;
    }
  }

  getCategoryIcon(category: string): string {
    return this.categoryIcons[category] || '\u{1F4C4}';
  }

  getCategoryIconBg(category: string): string {
    const bg: { [key: string]: string } = {
      SERVICE_LEVEL: 'bg-emerald-500/10',
      EXIT_STRATEGY: 'bg-amber-500/10',
      AUDIT: 'bg-cyan-500/10',
      INCIDENT: 'bg-red-500/10',
      DATA: 'bg-violet-500/10',
      SUBCONTRACTING: 'bg-blue-500/10',
      RISK: 'bg-orange-500/10',
      LEGAL: 'bg-indigo-500/10',
      CONTINUITY: 'bg-teal-500/10',
      RECRUITMENT: 'bg-pink-500/10',
      FINANCIAL_REPORTING: 'bg-yellow-500/10',
      ICT_RISK_MANAGEMENT: 'bg-emerald-500/10',
      INCIDENT_MANAGEMENT: 'bg-red-500/10',
      TESTING: 'bg-purple-500/10',
      INFORMATION_SHARING: 'bg-cyan-500/10'
    };
    return bg[category] || 'bg-slate-500/10';
  }

  getGlobalIndex(groupIndex: number, questionIndex: number): number {
    let count = 0;
    for (let g = 0; g < groupIndex; g++) {
      count += this.groupedQuestions[g].questions.length;
    }
    return count + questionIndex + 1;
  }

  getCategoryProgress(group: { category: string; questions: DoraQuestion[] }): number {
    const answered = group.questions.filter(q => this.answers[q.id] !== undefined).length;
    return group.questions.length > 0 ? (answered / group.questions.length) * 100 : 0;
  }

  isQuestionLocked(globalIndex: number): boolean {
    if (this.paywall.hasAccess()) return false;
    return globalIndex > this.freeQuestionsLimit;
  }

  showPaywallInGroup(groupIndex: number): boolean {
    if (this.paywall.hasAccess()) return false;
    // Show paywall in the group that contains the first locked question
    let count = 0;
    for (let g = 0; g <= groupIndex; g++) {
      const groupSize = this.groupedQuestions[g]?.questions.length || 0;
      if (count + groupSize > this.freeQuestionsLimit) {
        return g === groupIndex;
      }
      count += groupSize;
    }
    return false;
  }

  autoSave() {
    // Find the last answered question index
    let lastQuestionIndex = 0;
    this.questions.forEach((q, i) => {
      if (this.answers[q.id]) {
        lastQuestionIndex = i + 1;
      }
    });

    localStorage.setItem('dora_assessment_progress', JSON.stringify({
      companyName: this.companyName,
      contractName: this.contractName,
      selectedSector: this.selectedSector,
      answers: this.answers,
      lastQuestion: lastQuestionIndex,
      savedAt: new Date().toISOString()
    }));
  }

  private loadDraft() {
    try {
      // Try new key first, then fallback to old key for backwards compatibility
      let draft = JSON.parse(localStorage.getItem('dora_assessment_progress') || 'null');
      if (!draft) {
        draft = JSON.parse(localStorage.getItem('dora_draft') || 'null');
        if (draft) {
          // Migrate to new key
          localStorage.removeItem('dora_draft');
        }
      }
      if (draft && Object.keys(draft.answers || {}).length > 0) {
        this.companyName = draft.companyName || '';
        this.contractName = draft.contractName || '';
        this.selectedSector = draft.selectedSector || '';
        this.answers = draft.answers || {};
      }
    } catch {}
  }

  clearAll() {
    this.companyName = '';
    this.contractName = '';
    this.selectedSector = '';
    this.answers = {};
    localStorage.removeItem('dora_assessment_progress');
    localStorage.removeItem('dora_draft'); // Clean up old key too
  }

  onSubmit() {
    if (!this.canSubmit || this.submitting) return;
    this.submitting = true;

    const request: AssessmentRequest = {
      companyName: this.companyName.trim(),
      contractName: this.contractName.trim(),
      answers: this.answers
    };

    this.api.submitAssessment(request).subscribe({
      next: (result) => {
        localStorage.removeItem('dora_assessment_progress');
        localStorage.removeItem('dora_draft'); // Clean up old key too
        this.router.navigate(['/results', result.id]);
      },
      error: () => {
        this.error = this.lang.t('assessment.error_submit');
        this.submitting = false;
      }
    });
  }
}
