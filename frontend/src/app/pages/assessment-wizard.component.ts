import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';
import { AuthService } from '../auth/auth.service';
import { DoraQuestion, AssessmentRequest, CATEGORY_LABELS, PILLAR_CATEGORIES } from '../models';

interface WizardStep {
  pillarId: string;
  categories: string[];
  questions: DoraQuestion[];
}

@Component({
  selector: 'app-assessment-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto">

      <!-- Loading -->
      <div *ngIf="loading" class="text-center py-16 animate-fade-in">
        <div class="inline-block w-10 h-10 border-4 border-slate-700 border-t-emerald-400 rounded-full animate-spin"></div>
        <p class="text-slate-400 mt-4">{{ lang.t('assessment.loading') }}</p>
      </div>

      <!-- Error -->
      <div *ngIf="error" class="bg-red-900/30 border border-red-700/50 rounded-xl p-4 text-red-300 animate-scale-in">
        {{ error }}
      </div>

      <div *ngIf="!loading && !error">

        <!-- Progress bar -->
        <div class="mb-6 animate-fade-in">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-slate-400">
              {{ lang.t('wizard.step') }} {{ currentStep + 1 }}/{{ totalSteps }}
              <span *ngIf="currentStep > 0" class="text-slate-600"> — </span>
              <span *ngIf="currentStep === 0" class="text-emerald-400">{{ lang.t('wizard.company_info') }}</span>
              <span *ngIf="currentStep > 0" class="text-emerald-400">{{ getPillarLabel(steps[currentStep - 1].pillarId) }}</span>
            </span>
            <span class="text-xs text-slate-500">{{ progressPercent | number:'1.0-0' }}%</span>
          </div>
          <div class="w-full bg-slate-700/50 rounded-full h-2">
            <div class="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
                 [style.width.%]="progressPercent"></div>
          </div>
        </div>

        <!-- Step indicators -->
        <div class="flex items-center gap-1 mb-8 overflow-x-auto pb-2 animate-fade-in">
          <button *ngFor="let s of stepIndicators; let i = index"
                  (click)="goToStep(i)"
                  [disabled]="!canGoToStep(i)"
                  [title]="s.fullLabel"
                  class="flex items-center gap-1.5 shrink-0 transition-all duration-200"
                  [class]="i === currentStep
                    ? 'px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : isStepComplete(i)
                      ? 'px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700/30 text-emerald-400 border border-slate-700/50 hover:bg-slate-700/50 cursor-pointer'
                      : 'px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/50 text-slate-500 border border-slate-700/30'
                         + (canGoToStep(i) ? ' hover:bg-slate-700/50 cursor-pointer' : ' cursor-not-allowed')">
            <span *ngIf="isStepComplete(i)" class="text-emerald-400">&#10003;</span>
            <span>{{ s.shortLabel }}</span>
          </button>
        </div>

        <!-- STEP 0: Company info -->
        <div *ngIf="currentStep === 0" class="animate-fade-in-up">
          <div class="glass-card p-6 mb-6">
            <h2 class="text-xl font-bold mb-1">
              <span class="gradient-text">{{ lang.t('assessment.company') }}</span>
            </h2>
            <p class="text-slate-500 text-sm mb-6">{{ lang.t('wizard.company_desc') }}</p>

            <div class="space-y-4">
              <div>
                <label for="wiz-company" class="block text-sm text-slate-400 mb-1.5">{{ lang.t('assessment.company_name') }} *</label>
                <input type="text" [(ngModel)]="companyName" id="wiz-company"
                       class="w-full bg-slate-900/50 border rounded-lg px-4 py-2.5 text-slate-100
                              focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 focus:outline-none transition-all duration-300"
                       [class]="showStepErrors && !companyName.trim() ? 'border-red-500/50' : 'border-slate-600/50'"
                       [placeholder]="lang.t('assess.example_ltd')">
                <p *ngIf="showStepErrors && !companyName.trim()" class="mt-1 text-xs text-red-400">
                  {{ lang.l('Ettevõtte nimi on kohustuslik', 'Company name is required') }}
                </p>
              </div>
              <div>
                <label for="wiz-contract" class="block text-sm text-slate-400 mb-1.5">{{ lang.t('assessment.contract_name') }} *</label>
                <input type="text" [(ngModel)]="contractName" id="wiz-contract"
                       class="w-full bg-slate-900/50 border rounded-lg px-4 py-2.5 text-slate-100
                              focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 focus:outline-none transition-all duration-300"
                       [class]="showStepErrors && !contractName.trim() ? 'border-red-500/50' : 'border-slate-600/50'"
                       [placeholder]="lang.t('assess.cloud_service_agreement')">
                <p *ngIf="showStepErrors && !contractName.trim()" class="mt-1 text-xs text-red-400">
                  {{ lang.l('Lepingu nimi on kohustuslik', 'Contract name is required') }}
                </p>
              </div>
              <div>
                <label for="wiz-sector" class="block text-sm text-slate-400 mb-1.5">{{ lang.t('assessment.sector') }}</label>
                <select [(ngModel)]="selectedSector" id="wiz-sector"
                        class="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-slate-100
                               focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 focus:outline-none transition-all duration-300 appearance-none">
                  <option value="">{{ lang.t('assessment.select_sector') }}</option>
                  <option *ngFor="let s of sectors" [value]="s.value">{{ lang.l(s.et, s.en) }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- STEPS 1-5: Question pillars -->
        <div *ngIf="currentStep > 0 && currentStep <= steps.length" class="animate-fade-in-up">
          <div class="mb-6">
            <h2 class="text-xl font-bold mb-1">
              <span class="gradient-text">{{ getPillarLabel(currentPillarStep.pillarId) }}</span>
            </h2>
            <p class="text-slate-500 text-sm">
              {{ currentPillarStep.questions.length }} {{ pluralizeQuestions(currentPillarStep.questions.length) }}
              &middot;
              {{ getStepAnsweredCount(currentStep - 1) }}/{{ currentPillarStep.questions.length }} {{ lang.t('wizard.answered') }}
            </p>
          </div>

          <!-- Questions grouped by category within this pillar -->
          <div *ngFor="let cat of getCurrentCategories(); let ci = index"
               class="glass-card p-6 mb-4 card-hover">
            <h3 class="text-base font-semibold text-emerald-400 mb-1 flex items-center gap-2">
              <span class="w-7 h-7 rounded-lg flex items-center justify-center text-base"
                    [class]="getCategoryIconBg(cat.category)">{{ getCategoryIcon(cat.category) }}</span>
              {{ getCategoryLabel(cat.category) }}
              <span *ngIf="isCategoryComplete(cat)"
                    class="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">&#10003;</span>
            </h3>
            <p class="text-xs text-slate-500 mb-4">{{ cat.questions.length }} {{ pluralizeQuestions(cat.questions.length) }}</p>

            <div *ngFor="let q of cat.questions; let qi = index"
                 class="py-4 border-b border-slate-700/50 last:border-b-0">
              <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div class="flex-1">
                  <p class="text-slate-200 mb-1.5">
                    <span class="text-slate-500 text-sm mr-2">{{ getQuestionNumber(ci, qi) }}.</span>
                    {{ lang.currentLang === 'en' ? q.questionEn : q.questionEt }}
                  </p>
                  <div class="flex items-center gap-2 flex-wrap">
                    <div class="group relative inline-block">
                      <span class="text-xs cursor-help border-b border-dashed text-slate-500 border-slate-600 hover:text-emerald-400 transition-colors">
                        {{ q.articleReference }}
                      </span>
                      <div class="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200
                                  absolute z-10 bottom-full left-0 mb-2 w-80 p-4 bg-slate-700/95 backdrop-blur
                                  text-slate-200 text-xs rounded-xl shadow-2xl border border-slate-600/50 pointer-events-none">
                        <div class="font-semibold mb-1 text-emerald-400">{{ q.articleReference }}</div>
                        {{ q.explanation }}
                        <div class="absolute bottom-0 left-4 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-700 border-r border-b border-slate-600/50"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0 mt-1 relative z-20">
                  <button type="button"
                          (click)="setAnswer(q.id, 'yes')"
                          class="cursor-pointer"
                          [ngClass]="answers[q.id] === 'yes'
                            ? 'px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-900 shadow-lg shadow-emerald-500/20 scale-105 transition-all duration-200'
                            : 'px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-slate-200 transition-all duration-200'">
                    {{ lang.t('assessment.yes') }}
                  </button>
                  <button type="button"
                          (click)="setAnswer(q.id, 'partial')"
                          class="cursor-pointer"
                          [ngClass]="answers[q.id] === 'partial'
                            ? 'px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900 shadow-lg shadow-amber-500/20 scale-105 transition-all duration-200'
                            : 'px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-slate-200 transition-all duration-200'">
                    {{ lang.t('assessment.partial') }}
                  </button>
                  <button type="button"
                          (click)="setAnswer(q.id, 'no')"
                          class="cursor-pointer"
                          [ngClass]="answers[q.id] === 'no'
                            ? 'px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-red-500 to-red-400 text-white shadow-lg shadow-red-500/20 scale-105 transition-all duration-200'
                            : 'px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-slate-200 transition-all duration-200'">
                    {{ lang.t('assessment.no') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation bar -->
        <div class="sticky bottom-4 mt-8 animate-fade-in-up">
          <div class="bg-slate-800/90 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-2xl">

            <!-- Live score (visible when we have answers) -->
            <div *ngIf="answeredCount > 0 && currentStep > 0" class="flex items-center gap-3 mb-3 pb-3 border-b border-slate-700/30">
              <div class="relative w-9 h-9 shrink-0">
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
                  <span class="text-[10px] font-bold" [style.color]="liveScoreColor">{{ liveScorePercent | number:'1.0-0' }}</span>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 text-xs">
                  <span class="text-emerald-400">{{ yesCount }} {{ lang.t('assessment.yes') }}</span>
                  <span class="text-slate-600">&middot;</span>
                  <span class="text-amber-400">{{ partialCount }} {{ lang.t('assessment.partial') }}</span>
                  <span class="text-slate-600">&middot;</span>
                  <span class="text-red-400">{{ noCount }} {{ lang.t('assessment.no') }}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between gap-3">
              <!-- Left: Back + Save -->
              <div class="flex items-center gap-2">
                <button *ngIf="currentStep > 0" type="button" (click)="prevStep()"
                        class="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-300
                               hover:bg-slate-600 transition-all duration-200 flex items-center gap-1.5">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12"/>
                  </svg>
                  {{ lang.t('wizard.back') }}
                </button>
                <button type="button" (click)="saveAndExit()"
                        class="px-3 py-2 rounded-lg text-xs font-medium text-slate-500
                               hover:text-slate-300 hover:bg-slate-700/50 transition-all duration-200">
                  {{ lang.t('wizard.save_exit') }}
                </button>
              </div>

              <!-- Right: Next / Submit -->
              <div>
                <!-- Next step -->
                <button *ngIf="currentStep < totalSteps - 1" type="button" (click)="nextStep()"
                        [class]="canAdvance
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-900 font-semibold px-6 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2 text-sm'
                          : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-900 font-semibold px-6 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2 text-sm opacity-80'">
                  {{ lang.t('wizard.next') }}
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </button>
                <!-- Unanswered warning -->
                <span *ngIf="currentStep === totalSteps - 1 && unansweredCount > 0"
                      class="text-[11px] text-amber-400 mr-2">
                  {{ unansweredCount }} {{ lang.l('vastamata', 'unanswered') }}
                </span>
                <!-- Final submit -->
                <button *ngIf="currentStep === totalSteps - 1" type="button" (click)="onSubmit()"
                        [disabled]="!canSubmit || submitting"
                        [class]="canSubmit && !submitting
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-900 font-semibold px-6 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2 text-sm'
                          : 'bg-slate-700 text-slate-500 font-semibold px-6 py-2 rounded-lg cursor-not-allowed flex items-center gap-2 text-sm'">
                  <span *ngIf="!submitting">{{ lang.t('wizard.finish') }}</span>
                  <span *ngIf="submitting" class="flex items-center gap-2">
                    <span class="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></span>
                    {{ lang.t('assessment.submitting') }}
                  </span>
                  <svg *ngIf="!submitting" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Confirmation dialog -->
      <div *ngIf="showConfirmDialog" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
           (click)="showConfirmDialog = false">
        <div class="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-scale-in"
             (click)="$event.stopPropagation()">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-slate-100">{{ lang.t('wizard.finish') }}</h3>
          </div>

          <div *ngIf="unansweredCount > 0" class="flex items-start gap-2 px-4 py-3 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <svg class="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
            <p class="text-sm text-amber-300">
              {{ unansweredCount }} {{ lang.t('assessment.confirm_warning') }}
            </p>
          </div>

          <div *ngIf="unansweredCount === 0" class="text-slate-300 text-sm mb-4">
            {{ lang.t('assessment.confirm_complete') }}
          </div>

          <div class="flex items-center gap-3 justify-end">
            <button type="button" (click)="showConfirmDialog = false"
                    class="px-5 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all duration-200">
              {{ lang.t('assessment.confirm_cancel') }}
            </button>
            <button type="button" (click)="confirmSubmit()"
                    class="px-5 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-900 font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/25 flex items-center gap-2">
              {{ lang.t('wizard.finish') }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Save toast -->
      <div *ngIf="showSaveToast"
           class="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30
                  rounded-lg text-sm text-emerald-400 backdrop-blur animate-fade-in-up">
        {{ lang.t('wizard.saved') }}
      </div>
    </div>
  `
})
export class AssessmentWizardComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private titleService = inject(Title);
  private platformId = inject(PLATFORM_ID);
  lang = inject(LangService);
  auth = inject(AuthService);

  questions: DoraQuestion[] = [];
  answers: { [id: number]: string } = {};
  companyName = '';
  contractName = '';
  selectedSector = '';
  loading = true;
  error = '';
  submitting = false;
  showConfirmDialog = false;
  showSaveToast = false;
  showStepErrors = false;

  steps: WizardStep[] = [];
  currentStep = 0;
  highestVisitedStep = 0;

  // Pillar display order
  private pillarOrder = [
    'THIRD_PARTY',
    'ICT_RISK_MANAGEMENT',
    'INCIDENT_MANAGEMENT',
    'TESTING',
    'INFORMATION_SHARING'
  ];

  private pillarLabels: { [key: string]: { et: string; en: string } } = {
    ICT_RISK_MANAGEMENT: { et: 'IKT riskihaldus', en: 'ICT Risk Management' },
    INCIDENT_MANAGEMENT: { et: 'Intsidentide raporteerimine', en: 'Incident Reporting' },
    TESTING: { et: 'Digitaalse vastupidavuse testimine', en: 'Digital Resilience Testing' },
    THIRD_PARTY: { et: 'Kolmandate osapoolte risk', en: 'Third-party Risk' },
    INFORMATION_SHARING: { et: 'Info jagamine', en: 'Information Sharing' }
  };

  sectors = [
    { value: 'bank', et: 'Pank', en: 'Bank' },
    { value: 'insurance', et: 'Kindlustus', en: 'Insurance' },
    { value: 'payment', et: 'Makseasutus', en: 'Payment Institution' },
    { value: 'crypto', et: 'Krüptovara teenusepakkuja', en: 'Crypto Asset Provider' },
    { value: 'fund', et: 'Fondivalitseja', en: 'Fund Manager' },
    { value: 'ict', et: 'IKT-teenusepakkuja', en: 'ICT Service Provider' }
  ];

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

  get totalSteps(): number {
    return this.steps.length + 1; // +1 for company info step
  }

  get currentPillarStep(): WizardStep {
    return this.steps[this.currentStep - 1];
  }

  get stepIndicators(): { shortLabel: string; fullLabel: string }[] {
    const companyFull = this.lang.currentLang === 'en' ? 'Company Info' : 'Ettevõtte andmed';
    const indicators: { shortLabel: string; fullLabel: string }[] = [
      { shortLabel: this.lang.currentLang === 'en' ? 'Company' : 'Ettevõte', fullLabel: companyFull }
    ];
    for (const s of this.steps) {
      const label = this.pillarLabels[s.pillarId];
      const full = label ? this.lang.pick(label) : s.pillarId;
      indicators.push({ shortLabel: full.length > 18 ? full.slice(0, 16) + '…' : full, fullLabel: full });
    }
    return indicators;
  }

  get progressPercent(): number {
    if (this.totalQuestionCount === 0) return 0;
    if (this.currentStep === 0) return 0;
    return (this.answeredCount / this.totalQuestionCount) * 100;
  }

  get answeredCount(): number {
    return Object.keys(this.answers).length;
  }

  get totalQuestionCount(): number {
    return this.questions.length;
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
    return ((this.yesCount + this.partialCount * 0.5) / this.answeredCount) * 100;
  }

  get liveScoreColor(): string {
    if (this.liveScorePercent >= 80) return '#34d399';
    if (this.liveScorePercent >= 50) return '#fbbf24';
    return '#f87171';
  }

  get unansweredCount(): number {
    return this.totalQuestionCount - this.answeredCount;
  }

  get canAdvance(): boolean {
    if (this.currentStep === 0) {
      return this.companyName.trim() !== '' && this.contractName.trim() !== '';
    }
    return true; // Allow advancing even with unanswered questions
  }

  get canSubmit(): boolean {
    return this.companyName.trim() !== ''
      && this.contractName.trim() !== ''
      && this.answeredCount > 0;
  }

  ngOnInit() {
    this.titleService.setTitle(this.lang.t('title.wizard'));
    this.loadDraft();
    this.api.getQuestions().subscribe({
      next: (questions) => {
        this.questions = questions;
        this.buildSteps();
        this.loading = false;
      },
      error: () => {
        this.error = this.lang.t('assessment.error_load');
        this.loading = false;
      }
    });
  }

  private buildSteps() {
    this.steps = this.pillarOrder
      .map(pillarId => {
        const categories = PILLAR_CATEGORIES[pillarId] || [];
        const questions = this.questions
          .filter(q => categories.includes(q.category))
          .sort((a, b) => a.id - b.id);
        return { pillarId, categories, questions };
      })
      .filter(s => s.questions.length > 0);
  }

  getPillarLabel(pillarId: string): string {
    const label = this.pillarLabels[pillarId];
    return label ? this.lang.pick(label) : pillarId;
  }

  getCategoryLabel(category: string): string {
    const label = CATEGORY_LABELS[category];
    return label ? this.lang.pick(label) : category;
  }

  getCategoryIcon(category: string): string {
    return this.categoryIcons[category] || '\u{1F4C4}';
  }

  getCategoryIconBg(category: string): string {
    const bg: { [key: string]: string } = {
      SERVICE_LEVEL: 'bg-emerald-500/10', EXIT_STRATEGY: 'bg-amber-500/10',
      AUDIT: 'bg-cyan-500/10', INCIDENT: 'bg-red-500/10',
      DATA: 'bg-violet-500/10', SUBCONTRACTING: 'bg-blue-500/10',
      RISK: 'bg-orange-500/10', LEGAL: 'bg-indigo-500/10',
      CONTINUITY: 'bg-teal-500/10', RECRUITMENT: 'bg-pink-500/10',
      FINANCIAL_REPORTING: 'bg-yellow-500/10', ICT_RISK_MANAGEMENT: 'bg-emerald-500/10',
      INCIDENT_MANAGEMENT: 'bg-red-500/10', TESTING: 'bg-purple-500/10',
      INFORMATION_SHARING: 'bg-cyan-500/10'
    };
    return bg[category] || 'bg-slate-500/10';
  }

  getCurrentCategories(): { category: string; questions: DoraQuestion[] }[] {
    if (this.currentStep === 0 || this.currentStep > this.steps.length) return [];
    const step = this.steps[this.currentStep - 1];
    const map = new Map<string, DoraQuestion[]>();
    for (const q of step.questions) {
      if (!map.has(q.category)) map.set(q.category, []);
      map.get(q.category)!.push(q);
    }
    return Array.from(map.entries()).map(([category, questions]) => ({ category, questions }));
  }

  pluralizeQuestions(count: number): string {
    if (this.lang.currentLang === 'en') {
      return count === 1 ? 'question' : 'questions';
    }
    return count === 1 ? 'küsimus' : 'küsimust';
  }

  getQuestionNumber(categoryIndex: number, questionIndex: number): number {
    const categories = this.getCurrentCategories();
    let num = 1;
    for (let i = 0; i < categoryIndex; i++) {
      num += categories[i].questions.length;
    }
    return num + questionIndex;
  }

  isCategoryComplete(cat: { category: string; questions: DoraQuestion[] }): boolean {
    return cat.questions.every(q => this.answers[q.id] !== undefined);
  }

  getStepAnsweredCount(stepIndex: number): number {
    if (stepIndex < 0 || stepIndex >= this.steps.length) return 0;
    return this.steps[stepIndex].questions.filter(q => this.answers[q.id] !== undefined).length;
  }

  isStepComplete(stepIndex: number): boolean {
    if (stepIndex === 0) {
      return this.companyName.trim() !== '' && this.contractName.trim() !== '';
    }
    const step = this.steps[stepIndex - 1];
    if (!step) return false;
    return step.questions.every(q => this.answers[q.id] !== undefined);
  }

  canGoToStep(stepIndex: number): boolean {
    // Step 0 is company info — always accessible
    if (stepIndex === 0) return true;
    // Other steps require company info to be filled
    return this.companyName.trim() !== '' && this.contractName.trim() !== '';
  }

  goToStep(stepIndex: number) {
    if (this.canGoToStep(stepIndex)) {
      this.currentStep = stepIndex;
      if (stepIndex > this.highestVisitedStep) {
        this.highestVisitedStep = stepIndex;
      }
      this.scrollToTop();
    }
  }

  nextStep() {
    if (!this.canAdvance) {
      this.showStepErrors = true;
      return;
    }
    this.showStepErrors = false;
    if (this.currentStep === 0) {
      this.autoSave();
    }
    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
      if (this.currentStep > this.highestVisitedStep) {
        this.highestVisitedStep = this.currentStep;
      }
      this.scrollToTop();
    }
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.scrollToTop();
    }
  }

  setAnswer(questionId: number, value: string) {
    this.answers = { ...this.answers, [questionId]: value };
    this.autoSave();
  }

  onSubmit() {
    if (!this.canSubmit || this.submitting) return;
    this.showConfirmDialog = true;
  }

  confirmSubmit() {
    this.showConfirmDialog = false;
    this.submitting = true;

    const request: AssessmentRequest = {
      companyName: this.companyName.trim(),
      contractName: this.contractName.trim(),
      answers: this.answers
    };

    this.api.submitAssessment(request).subscribe({
      next: (result) => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.removeItem('dora_assessment_progress');
        }
        this.router.navigate(['/assessment/complete'], { queryParams: { id: result.id } });
      },
      error: () => {
        this.error = this.lang.t('assessment.error_submit');
        this.submitting = false;
      }
    });
  }

  saveAndExit() {
    this.autoSave();
    this.showSaveToast = true;
    setTimeout(() => this.showSaveToast = false, 2000);
    setTimeout(() => this.router.navigate(['/dashboard']), 1500);
  }

  private autoSave() {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem('dora_assessment_progress', JSON.stringify({
      companyName: this.companyName,
      contractName: this.contractName,
      selectedSector: this.selectedSector,
      answers: this.answers,
      wizardStep: this.currentStep,
      savedAt: new Date().toISOString()
    }));
  }

  private loadDraft() {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const draft = JSON.parse(localStorage.getItem('dora_assessment_progress') || 'null');
      if (draft && (Object.keys(draft.answers || {}).length > 0 || draft.companyName)) {
        this.companyName = draft.companyName || '';
        this.contractName = draft.contractName || '';
        this.selectedSector = draft.selectedSector || '';
        this.answers = draft.answers || {};
        if (typeof draft.wizardStep === 'number') {
          this.currentStep = draft.wizardStep;
          this.highestVisitedStep = draft.wizardStep;
        }
      }
    } catch {}
  }

  private scrollToTop() {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
