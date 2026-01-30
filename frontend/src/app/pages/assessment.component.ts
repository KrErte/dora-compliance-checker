import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';
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
          <span class="text-sm hidden sm:inline" [class]="step >= 1 ? 'text-emerald-400' : 'text-slate-500'">Andmed</span>
        </div>
        <div class="w-12 h-px" [class]="step >= 2 ? 'bg-emerald-500' : 'bg-slate-700'"></div>
        <div class="flex items-center gap-2">
          <div [class]="step >= 2
            ? 'w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 text-sm font-bold'
            : 'w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-sm font-bold'">2</div>
          <span class="text-sm hidden sm:inline" [class]="step >= 2 ? 'text-emerald-400' : 'text-slate-500'">K&uuml;simused</span>
        </div>
        <div class="w-12 h-px" [class]="step >= 3 ? 'bg-emerald-500' : 'bg-slate-700'"></div>
        <div class="flex items-center gap-2">
          <div [class]="step >= 3
            ? 'w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 text-sm font-bold'
            : 'w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-sm font-bold'">3</div>
          <span class="text-sm hidden sm:inline" [class]="step >= 3 ? 'text-emerald-400' : 'text-slate-500'">Tulemused</span>
        </div>
      </div>

      <h1 class="text-2xl font-bold mb-6 animate-fade-in-up">
        <span class="gradient-text">DORA vastavuse hindamine</span>
      </h1>

      <div *ngIf="loading" class="text-center py-16 animate-fade-in">
        <div class="inline-block w-10 h-10 border-4 border-slate-700 border-t-emerald-400 rounded-full animate-spin"></div>
        <p class="text-slate-400 mt-4">K&uuml;simuste laadimine...</p>
      </div>

      <div *ngIf="error" class="bg-red-900/30 border border-red-700/50 rounded-xl p-4 text-red-300 animate-scale-in">
        {{ error }}
      </div>

      <!-- Scenario buttons -->
      <div *ngIf="!loading && !error" class="flex flex-wrap gap-2 mb-6 animate-fade-in-up delay-100">
        <span class="text-xs text-slate-500 self-center mr-1">Demo:</span>
        <button type="button" (click)="applyScenario('ideal')"
                class="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20
                       hover:bg-emerald-500/20 transition-all duration-200">
          Ideaalne leping
        </button>
        <button type="button" (click)="applyScenario('average')"
                class="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20
                       hover:bg-amber-500/20 transition-all duration-200">
          Keskmine leping
        </button>
        <button type="button" (click)="applyScenario('weak')"
                class="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20
                       hover:bg-red-500/20 transition-all duration-200">
          N&otilde;rk leping
        </button>
        <button type="button" (click)="clearAll()"
                class="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-400 border border-slate-600/30
                       hover:bg-slate-600/50 transition-all duration-200">
          T&uuml;hjenda
        </button>
      </div>

      <form *ngIf="!loading && !error" (ngSubmit)="onSubmit()" #assessmentForm="ngForm">
        <!-- Company info -->
        <div class="bg-slate-800/50 backdrop-blur rounded-xl p-6 mb-6 border border-slate-700/50 card-hover animate-fade-in-up">
          <h2 class="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            Ettev&otilde;tte andmed
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-slate-400 mb-1.5">Ettev&otilde;tte nimi</label>
              <input type="text" [(ngModel)]="companyName" name="companyName" required
                     class="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-slate-100
                            focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 focus:outline-none transition-all duration-300"
                     placeholder="O&Uuml; N&auml;idis">
            </div>
            <div>
              <label class="block text-sm text-slate-400 mb-1.5">Lepingu nimetus</label>
              <input type="text" [(ngModel)]="contractName" name="contractName" required
                     class="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-slate-100
                            focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 focus:outline-none transition-all duration-300"
                     placeholder="Pilveteenus leping">
            </div>
          </div>
        </div>

        <!-- Questions grouped by category -->
        <div *ngFor="let group of groupedQuestions; let gi = index"
             class="bg-slate-800/50 backdrop-blur rounded-xl p-6 mb-4 border border-slate-700/50 card-hover animate-fade-in-up"
             [style.animation-delay]="(gi * 100 + 200) + 'ms'">
          <h2 class="text-lg font-semibold text-emerald-400 mb-1 flex items-center gap-2">
            <span class="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-xs text-emerald-400">{{ gi + 1 }}</span>
            {{ getCategoryLabel(group.category) }}
          </h2>
          <p class="text-xs text-slate-500 mb-4">{{ group.questions.length }} k&uuml;simus{{ group.questions.length > 1 ? 't' : '' }}</p>

          <div *ngFor="let q of group.questions; let i = index"
               class="py-4 border-b border-slate-700/50 last:border-b-0">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <p class="text-slate-200 mb-1.5">
                  <span class="text-slate-500 text-sm mr-2">{{ q.id }}.</span>
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
                        (click)="answers[q.id] = true"
                        [class]="answers[q.id] === true
                          ? 'px-4 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-900 shadow-lg shadow-emerald-500/20 scale-105 transition-all duration-200'
                          : 'px-4 py-1.5 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-slate-200 transition-all duration-200'">
                  Jah
                </button>
                <button type="button"
                        (click)="answers[q.id] = false"
                        [class]="answers[q.id] === false
                          ? 'px-4 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-red-500 to-red-400 text-white shadow-lg shadow-red-500/20 scale-105 transition-all duration-200'
                          : 'px-4 py-1.5 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-slate-200 transition-all duration-200'">
                  Ei
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Submit bar -->
        <div class="sticky bottom-4 mt-8 animate-fade-in-up delay-300">
          <div class="bg-slate-800/90 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-2xl">
            <!-- Live score preview -->
            <div *ngIf="answeredCount > 0" class="flex items-center gap-4 mb-3 pb-3 border-b border-slate-700/30">
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
                  <p class="text-xs text-slate-400">Eeldatav skoor</p>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold" [style.color]="liveScoreColor">{{ liveScoreLabel }}</span>
                    <span class="text-xs text-slate-600">&middot;</span>
                    <span class="text-xs text-emerald-400">{{ yesCount }} jah</span>
                    <span class="text-xs text-red-400">{{ noCount }} ei</span>
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
                <div class="w-full bg-slate-700 rounded-full h-2 w-32">
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
              <span *ngIf="!submitting">Esita hindamine</span>
              <span *ngIf="submitting" class="flex items-center gap-2">
                <span class="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></span>
                Hindamine...
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
  answers: { [id: number]: boolean } = {};
  companyName = '';
  contractName = '';
  loading = true;
  error = '';
  submitting = false;

  constructor(private api: ApiService, private router: Router) {}

  get step(): number {
    if (this.submitting) return 3;
    if (this.answeredCount > 0) return 2;
    return 1;
  }

  ngOnInit() {
    this.api.getQuestions().subscribe({
      next: (questions) => {
        this.questions = questions;
        this.groupByCategory();
        this.loading = false;
      },
      error: () => {
        this.error = 'K\u00fcsimuste laadimine eba\u00f5nnestus. Palun kontrollige, kas server t\u00f6\u00f6tab.';
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
    return CATEGORY_LABELS[category] || category;
  }

  get totalQuestions(): number {
    return this.questions.length;
  }

  get answeredCount(): number {
    return Object.keys(this.answers).length;
  }

  get yesCount(): number {
    return Object.values(this.answers).filter(v => v === true).length;
  }

  get noCount(): number {
    return Object.values(this.answers).filter(v => v === false).length;
  }

  get liveScorePercent(): number {
    if (this.answeredCount === 0) return 0;
    return (this.yesCount / this.answeredCount) * 100;
  }

  get liveScoreColor(): string {
    if (this.liveScorePercent >= 80) return '#34d399';
    if (this.liveScorePercent >= 50) return '#fbbf24';
    return '#f87171';
  }

  get liveScoreLabel(): string {
    if (this.liveScorePercent >= 80) return 'Vastav';
    if (this.liveScorePercent >= 50) return 'Osaliselt';
    return 'Mittevastav';
  }

  get liveCategoryBars(): { label: string; percent: number; color: string }[] {
    return this.groupedQuestions.map(group => {
      const answered = group.questions.filter(q => this.answers[q.id] !== undefined);
      const yes = group.questions.filter(q => this.answers[q.id] === true).length;
      const total = answered.length;
      const percent = total > 0 ? (yes / total) * 100 : 0;
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
    // Kategooriad, mis on tüüpiliselt nõrgad keskmises lepingus
    const avgWeakCategories = ['DATA', 'SUBCONTRACTING', 'AUDIT', 'RISK',
      'RECRUITMENT', 'FINANCIAL_REPORTING', 'TESTING', 'INFORMATION_SHARING'];
    // Kategooriad, mis on tüüpiliselt nõrgad nõrgas lepingus (peaaegu kõik)
    const weakOkCategories = ['SERVICE_LEVEL', 'LEGAL'];

    switch (scenario) {
      case 'ideal':
        this.companyName = 'AS Finantsteenused';
        this.contractName = 'Pilveteenuse SLA leping 2025';
        for (const q of this.questions) this.answers[q.id] = true;
        break;
      case 'average':
        this.companyName = 'O\u00dc DigiLahendused';
        this.contractName = 'IT-taristu hooldusleping';
        for (const q of this.questions) {
          if (avgWeakCategories.includes(q.category)) {
            // Need kategooriad on tüüpiliselt puudulikud
            this.answers[q.id] = Math.random() > 0.6;
          } else {
            this.answers[q.id] = Math.random() > 0.2;
          }
        }
        // Kindlusta konkreetsed puudused realistlikkuse jaoks
        this.setAnswerByCategory('TESTING', false, 2);         // TLPT ja jätkuvuse testid puudu
        this.setAnswerByCategory('INFORMATION_SHARING', false, 2); // Info jagamine nõrk
        this.setAnswerByCategory('INCIDENT_MANAGEMENT', false, 1); // Üks intsidendi puudus
        this.setAnswerByCategory('FINANCIAL_REPORTING', false, 2); // Finantsriskid
        break;
      case 'weak':
        this.companyName = 'O\u00dc V\u00e4ikeettev\u00f5te';
        this.contractName = 'P\u00f5hiline IT-leping';
        for (const q of this.questions) {
          if (weakOkCategories.includes(q.category)) {
            this.answers[q.id] = Math.random() > 0.4;
          } else {
            this.answers[q.id] = Math.random() > 0.8;
          }
        }
        // Kindlusta, et kriitilised valdkonnad on mittevastav
        this.setAnswerByCategory('ICT_RISK_MANAGEMENT', false);
        this.setAnswerByCategory('INCIDENT_MANAGEMENT', false);
        this.setAnswerByCategory('TESTING', false);
        this.setAnswerByCategory('INFORMATION_SHARING', false);
        this.setAnswerByCategory('RECRUITMENT', false);
        this.setAnswerByCategory('FINANCIAL_REPORTING', false);
        this.setAnswerByCategory('EXIT_STRATEGY', false);
        this.setAnswerByCategory('CONTINUITY', false);
        break;
    }
  }

  /** Määra kategooria küsimustele vastus. Kui count on antud, muuda ainult nii palju. */
  private setAnswerByCategory(category: string, value: boolean, count?: number) {
    const qs = this.questions.filter(q => q.category === category);
    const target = count !== undefined ? Math.min(count, qs.length) : qs.length;
    for (let i = 0; i < target; i++) {
      this.answers[qs[i].id] = value;
    }
  }

  clearAll() {
    this.companyName = '';
    this.contractName = '';
    this.answers = {};
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
        this.router.navigate(['/results', result.id]);
      },
      error: () => {
        this.error = 'Hindamise esitamine eba\u00f5nnestus. Palun proovige uuesti.';
        this.submitting = false;
      }
    });
  }
}
