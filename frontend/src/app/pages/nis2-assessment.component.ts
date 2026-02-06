import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LangService } from '../lang.service';

interface Question {
  id: string;
  domainCode: string;
  questionEn: string;
  questionEt: string;
  guidanceEn: string;
  guidanceEt: string;
  articleReference: string;
  weight: number;
  displayOrder: number;
}

interface Domain {
  id: string;
  code: string;
  nameEn: string;
  nameEt: string;
  displayOrder: number;
  iconClass: string;
  questions: Question[];
}

interface RegulationFull {
  id: string;
  code: string;
  nameEn: string;
  nameEt: string;
  domains: Domain[];
}

interface AssessmentResult {
  regulationCode: string;
  overallScore: number;
  riskLevel: string;
  domainScores: {
    domainId: string;
    domainCode: string;
    nameEn: string;
    nameEt: string;
    score: number;
    answeredQuestions: number;
    totalQuestions: number;
  }[];
  answeredQuestions: number;
  totalQuestions: number;
}

@Component({
  selector: 'app-nis2-assessment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6 animate-fade-in">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-slate-100">{{ lang.t('nis2_assess.title') }}</h1>
          <p class="text-sm text-slate-400">{{ lang.t('nis2_assess.subtitle') }}</p>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="glass-card p-4 mb-6 animate-fade-in-up">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-slate-400">{{ lang.t('nis2_assess.progress') }}</span>
          <span class="text-sm font-medium text-amber-400">{{ answeredCount }} / {{ totalQuestions }}</span>
        </div>
        <div class="w-full bg-slate-700 rounded-full h-2">
          <div class="h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
               [style.width.%]="progressPercent"></div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="text-center py-16 animate-fade-in">
        <div class="inline-block w-10 h-10 border-4 border-slate-700 border-t-amber-400 rounded-full animate-spin"></div>
        <p class="text-slate-400 mt-4">{{ lang.t('nis2_assess.loading') }}</p>
      </div>

      <!-- Error -->
      <div *ngIf="error" class="bg-red-900/30 border border-red-700/50 rounded-xl p-4 text-red-300 animate-scale-in">
        {{ error }}
      </div>

      <!-- Draft restored -->
      <div *ngIf="hasDraft && !loading" class="flex items-center gap-2 mb-4 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400 animate-fade-in">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        {{ lang.t('nis2_assess.draft_restored') }}
      </div>

      <!-- Domain tabs -->
      <div *ngIf="!loading && !error && domains.length > 0" class="animate-fade-in-up">
        <div class="flex flex-wrap gap-2 mb-6">
          <button *ngFor="let domain of domains; let i = index"
                  (click)="activeDomain = i"
                  [class]="activeDomain === i
                    ? 'px-4 py-2 rounded-lg text-sm font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'px-4 py-2 rounded-lg text-sm font-medium bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50 hover:text-slate-300 transition-colors'">
            <span class="mr-1.5">{{ getDomainIcon(domain.code) }}</span>
            {{ lang.currentLang === 'et' ? domain.nameEt : domain.nameEn }}
            <span *ngIf="getDomainProgress(domain) === 100" class="ml-1.5 text-emerald-400">&#10003;</span>
          </button>
        </div>

        <!-- Active domain questions -->
        <div *ngIf="domains[activeDomain]" class="glass-card p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-amber-400 flex items-center gap-2">
              <span class="text-xl">{{ getDomainIcon(domains[activeDomain].code) }}</span>
              {{ lang.currentLang === 'et' ? domains[activeDomain].nameEt : domains[activeDomain].nameEn }}
            </h2>
            <span class="text-xs px-2 py-1 rounded-full"
                  [class]="getDomainProgress(domains[activeDomain]) === 100 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700/50 text-slate-400'">
              {{ getDomainAnsweredCount(domains[activeDomain]) }} / {{ domains[activeDomain].questions.length }}
            </span>
          </div>

          <div *ngFor="let q of domains[activeDomain].questions; let qi = index"
               class="py-5 border-b border-slate-700/50 last:border-b-0">
            <div class="mb-3">
              <p class="text-slate-200 mb-1">
                <span class="text-slate-500 text-sm mr-2">{{ qi + 1 }}.</span>
                {{ lang.currentLang === 'et' ? q.questionEt : q.questionEn }}
              </p>
              <p *ngIf="q.guidanceEt || q.guidanceEn" class="text-xs text-slate-500 mt-1">
                {{ lang.currentLang === 'et' ? q.guidanceEt : q.guidanceEn }}
              </p>
              <span *ngIf="q.articleReference" class="text-xs text-slate-600 mt-1 inline-block">{{ q.articleReference }}</span>
            </div>

            <!-- 1-5 scale -->
            <div class="flex flex-wrap gap-2">
              <button *ngFor="let score of [1,2,3,4,5]"
                      type="button"
                      (click)="setAnswer(q.id, score)"
                      [class]="answers[q.id] === score
                        ? getScoreButtonActiveClass(score)
                        : 'px-4 py-2 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-400 border border-slate-600/30 hover:bg-slate-600/50 hover:text-slate-200 transition-all duration-200'">
                {{ score }}
                <span class="hidden sm:inline ml-1 text-xs opacity-75">{{ getScoreLabel(score) }}</span>
              </button>
            </div>
          </div>

          <!-- Domain navigation -->
          <div class="flex justify-between mt-6 pt-4 border-t border-slate-700/50">
            <button *ngIf="activeDomain > 0"
                    (click)="activeDomain = activeDomain - 1"
                    class="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-colors flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              {{ lang.t('nis2_assess.prev') }}
            </button>
            <div *ngIf="activeDomain === 0"></div>
            <button *ngIf="activeDomain < domains.length - 1"
                    (click)="activeDomain = activeDomain + 1"
                    class="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors flex items-center gap-2">
              {{ lang.t('nis2_assess.next') }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Submit section -->
        <div class="sticky bottom-4 mt-8">
          <div class="bg-slate-800/90 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-2xl">
            <!-- Live score preview -->
            <div *ngIf="answeredCount > 0" class="flex items-center gap-4 mb-3 pb-3 border-b border-slate-700/30">
              <div class="relative w-12 h-12 shrink-0">
                <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#334155" stroke-width="8"/>
                  <circle cx="50" cy="50" r="42" fill="none"
                          [attr.stroke]="liveScoreColor"
                          stroke-width="8"
                          stroke-linecap="round"
                          stroke-dasharray="263.89"
                          [attr.stroke-dashoffset]="263.89 - (263.89 * liveScore / 100)"
                          class="transition-all duration-500"/>
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-sm font-bold" [style.color]="liveScoreColor">{{ liveScore | number:'1.0-0' }}</span>
                </div>
              </div>
              <div>
                <p class="text-xs text-slate-400">{{ lang.t('nis2_assess.score_preview') }}</p>
                <p class="text-sm font-semibold" [style.color]="liveScoreColor">{{ riskLevelLabel }}</p>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <button type="button" (click)="saveDraft()"
                      class="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-colors">
                {{ lang.t('nis2_assess.save_draft') }}
              </button>
              <button type="button"
                      (click)="submitAssessment()"
                      [disabled]="!canSubmit || submitting"
                      [class]="canSubmit && !submitting
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-8 py-2.5 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25 flex items-center gap-2'
                        : 'bg-slate-700 text-slate-500 font-semibold px-8 py-2.5 rounded-lg cursor-not-allowed flex items-center gap-2'">
                <span *ngIf="!submitting">{{ lang.t('nis2_assess.submit') }}</span>
                <span *ngIf="submitting" class="flex items-center gap-2">
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  {{ lang.t('nis2_assess.submitting') }}
                </span>
                <svg *ngIf="!submitting" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Results modal -->
        <div *ngIf="result" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="glass-card p-8 max-w-lg w-full animate-scale-in">
            <div class="text-center mb-6">
              <div class="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                   [class]="result.riskLevel === 'LOW' ? 'bg-emerald-500/20' : result.riskLevel === 'MEDIUM' ? 'bg-amber-500/20' : 'bg-red-500/20'">
                <span class="text-4xl font-bold"
                      [class]="result.riskLevel === 'LOW' ? 'text-emerald-400' : result.riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-red-400'">
                  {{ result.overallScore | number:'1.0-0' }}
                </span>
              </div>
              <h2 class="text-xl font-bold text-slate-100 mb-1">{{ lang.t('nis2_assess.result_title') }}</h2>
              <p class="text-sm"
                 [class]="result.riskLevel === 'LOW' ? 'text-emerald-400' : result.riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-red-400'">
                {{ lang.t('nis2_assess.risk_' + result.riskLevel.toLowerCase()) }}
              </p>
            </div>

            <div class="space-y-2 mb-6">
              <div *ngFor="let ds of result.domainScores" class="flex items-center justify-between text-sm">
                <span class="text-slate-400">{{ lang.currentLang === 'et' ? ds.nameEt : ds.nameEn }}</span>
                <div class="flex items-center gap-2">
                  <div class="w-20 h-1.5 bg-slate-700 rounded-full">
                    <div class="h-1.5 rounded-full transition-all"
                         [style.width.%]="ds.score"
                         [class]="ds.score >= 80 ? 'bg-emerald-500' : ds.score >= 60 ? 'bg-amber-500' : 'bg-red-500'"></div>
                  </div>
                  <span class="w-8 text-right"
                        [class]="ds.score >= 80 ? 'text-emerald-400' : ds.score >= 60 ? 'text-amber-400' : 'text-red-400'">
                    {{ ds.score | number:'1.0-0' }}
                  </span>
                </div>
              </div>
            </div>

            <button (click)="closeResult()"
                    class="w-full py-3 rounded-lg font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 transition-all">
              {{ lang.t('nis2_assess.close') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class Nis2AssessmentComponent implements OnInit {
  domains: Domain[] = [];
  answers: { [questionId: string]: number } = {};
  activeDomain = 0;
  loading = true;
  error = '';
  submitting = false;
  hasDraft = false;
  result: AssessmentResult | null = null;

  private domainIcons: { [code: string]: string } = {
    'RISK_ANALYSIS': '🔍',
    'INCIDENT_HANDLING': '🚨',
    'BUSINESS_CONTINUITY': '🔄',
    'SUPPLY_CHAIN': '🔗',
    'NETWORK_SECURITY': '🔒',
    'VULNERABILITY_MGMT': '🛡️',
    'CYBER_HYGIENE': '🧹',
    'CRYPTOGRAPHY': '🔐',
    'HR_SECURITY': '👥',
    'ACCESS_CONTROL': '🚪'
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    public lang: LangService
  ) {}

  ngOnInit() {
    this.loadDraft();
    this.loadQuestions();
  }

  loadQuestions() {
    this.http.get<RegulationFull>('/api/regulations/NIS2/full').subscribe({
      next: (data) => {
        this.domains = data.domains || [];
        this.loading = false;
      },
      error: () => {
        this.error = this.lang.t('nis2_assess.error_load');
        this.loading = false;
      }
    });
  }

  get totalQuestions(): number {
    return this.domains.reduce((sum, d) => sum + d.questions.length, 0);
  }

  get answeredCount(): number {
    return Object.keys(this.answers).length;
  }

  get progressPercent(): number {
    return this.totalQuestions > 0 ? (this.answeredCount / this.totalQuestions) * 100 : 0;
  }

  get liveScore(): number {
    if (this.answeredCount === 0) return 0;
    const sum = Object.values(this.answers).reduce((a, b) => a + b, 0);
    return (sum / (this.answeredCount * 5)) * 100;
  }

  get liveScoreColor(): string {
    if (this.liveScore >= 80) return '#34d399';
    if (this.liveScore >= 60) return '#fbbf24';
    if (this.liveScore >= 40) return '#fb923c';
    return '#f87171';
  }

  get riskLevelLabel(): string {
    if (this.liveScore >= 80) return this.lang.t('nis2_assess.risk_low');
    if (this.liveScore >= 60) return this.lang.t('nis2_assess.risk_medium');
    if (this.liveScore >= 40) return this.lang.t('nis2_assess.risk_high');
    return this.lang.t('nis2_assess.risk_critical');
  }

  get canSubmit(): boolean {
    return this.answeredCount === this.totalQuestions && this.totalQuestions > 0;
  }

  getDomainIcon(code: string): string {
    return this.domainIcons[code] || '📋';
  }

  getDomainProgress(domain: Domain): number {
    const answered = domain.questions.filter(q => this.answers[q.id] !== undefined).length;
    return domain.questions.length > 0 ? (answered / domain.questions.length) * 100 : 0;
  }

  getDomainAnsweredCount(domain: Domain): number {
    return domain.questions.filter(q => this.answers[q.id] !== undefined).length;
  }

  setAnswer(questionId: string, score: number) {
    this.answers[questionId] = score;
    this.autoSave();
  }

  getScoreLabel(score: number): string {
    const labels: { [key: number]: { et: string; en: string } } = {
      1: { et: 'Puudub', en: 'Missing' },
      2: { et: 'Algne', en: 'Initial' },
      3: { et: 'Arenev', en: 'Developing' },
      4: { et: 'Määratletud', en: 'Defined' },
      5: { et: 'Optimeeritud', en: 'Optimized' }
    };
    const label = labels[score];
    return label ? (this.lang.currentLang === 'et' ? label.et : label.en) : '';
  }

  getScoreButtonActiveClass(score: number): string {
    const colors: { [key: number]: string } = {
      1: 'px-4 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 shadow-lg shadow-red-500/10',
      2: 'px-4 py-2 rounded-lg text-sm font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-lg shadow-orange-500/10',
      3: 'px-4 py-2 rounded-lg text-sm font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10',
      4: 'px-4 py-2 rounded-lg text-sm font-medium bg-lime-500/20 text-lime-400 border border-lime-500/30 shadow-lg shadow-lime-500/10',
      5: 'px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
    };
    return colors[score] || '';
  }

  autoSave() {
    localStorage.setItem('nis2_draft', JSON.stringify({ answers: this.answers }));
  }

  saveDraft() {
    this.autoSave();
    // Show brief confirmation (could add toast notification)
  }

  loadDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem('nis2_draft') || 'null');
      if (draft && Object.keys(draft.answers || {}).length > 0) {
        this.answers = draft.answers;
        this.hasDraft = true;
      }
    } catch {}
  }

  submitAssessment() {
    if (!this.canSubmit || this.submitting) return;
    this.submitting = true;

    this.http.post<AssessmentResult>('/api/v2/assessments', {
      regulationCode: 'NIS2',
      answers: this.answers
    }).subscribe({
      next: (res) => {
        this.result = res;
        this.submitting = false;
        localStorage.removeItem('nis2_draft');
      },
      error: () => {
        this.error = this.lang.t('nis2_assess.error_submit');
        this.submitting = false;
      }
    });
  }

  closeResult() {
    this.result = null;
    this.router.navigate(['/']);
  }
}
