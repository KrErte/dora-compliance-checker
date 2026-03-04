import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { VendorQuestionnaireService, QuestionnaireQuestion } from '../services/vendor-questionnaire.service';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-vendor-questionnaire-public',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-16 pb-16 px-4">
      <div class="max-w-3xl mx-auto">

        <!-- Loading -->
        @if (loading) {
          <div class="text-center py-20">
            <div class="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p class="text-slate-400">{{ lang.t('vqp.loading') }}</p>
          </div>
        }

        <!-- Not found -->
        @if (!loading && error) {
          <div class="glass-card p-8 text-center">
            <div class="text-4xl mb-4 opacity-50">&#128683;</div>
            <h2 class="text-xl font-bold text-white mb-2">{{ lang.t('vqp.not_found') }}</h2>
            <p class="text-slate-400">{{ lang.t('vqp.not_found_desc') }}</p>
          </div>
        }

        <!-- Already submitted -->
        @if (!loading && status === 'SUBMITTED') {
          <div class="glass-card p-8 text-center">
            <div class="text-5xl mb-4">&#10003;</div>
            <h2 class="text-xl font-bold text-emerald-400 mb-2">{{ lang.t('vqp.already_submitted') }}</h2>
            <p class="text-slate-400">{{ lang.t('vqp.already_submitted_desc').replace('{name}', vendorName) }}</p>
          </div>
        }

        <!-- Expired -->
        @if (!loading && status === 'EXPIRED') {
          <div class="glass-card p-8 text-center">
            <div class="text-4xl mb-4 opacity-50">&#9200;</div>
            <h2 class="text-xl font-bold text-amber-400 mb-2">{{ lang.t('vqp.expired') }}</h2>
            <p class="text-slate-400">{{ lang.t('vqp.expired_desc') }}</p>
          </div>
        }

        <!-- Submission complete -->
        @if (submitted) {
          <div class="glass-card p-8 text-center">
            <div class="text-5xl mb-4">&#127881;</div>
            <h2 class="text-xl font-bold text-emerald-400 mb-2">{{ lang.t('vqp.thank_you') }}</h2>
            <p class="text-slate-400 mb-4">{{ lang.t('vqp.submitted_desc') }}</p>
            @if (submittedRiskScore !== null) {
              <div class="inline-flex items-center gap-2 px-4 py-2 rounded-lg" [class]="submittedRiskScore <= 30 ? 'bg-emerald-500/10 text-emerald-400' : (submittedRiskScore <= 60 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400')">
                <span class="font-bold text-lg">{{ submittedRiskScore }}</span>
                <span class="text-sm">{{ lang.t('vqp.risk_score') }}</span>
              </div>
            }
          </div>
        }

        <!-- Active questionnaire -->
        @if (!loading && !error && status === 'PENDING' && !submitted) {
          <!-- Header -->
          <div class="glass-card p-6 mb-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">D</div>
              <div>
                <h1 class="text-xl font-bold text-white">{{ lang.t('vqp.title') }}</h1>
                <p class="text-sm text-slate-400">{{ lang.t('vqp.powered_by') }}</p>
              </div>
            </div>
            <p class="text-sm text-slate-300" [innerHTML]="getIntroHtml()"></p>
            <p class="text-xs text-slate-500 mt-2">{{ questions.length }} {{ lang.t('vqp.estimated_time') }}</p>
          </div>

          <!-- Progress -->
          <div class="mb-6">
            <div class="flex justify-between text-xs text-slate-400 mb-1">
              <span>{{ lang.t('vqp.progress') }}</span>
              <span>{{ getAnsweredCount() }}/{{ questions.length }}</span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-2">
              <div class="h-2 rounded-full bg-emerald-500 transition-all" [style.width.%]="(getAnsweredCount() / questions.length) * 100"></div>
            </div>
          </div>

          <!-- Questions by category -->
          @for (category of getCategories(); track category) {
            <div class="glass-card p-6 mb-4">
              <h2 class="text-lg font-semibold text-white mb-4">{{ category }}</h2>
              <div class="space-y-4">
                @for (q of getQuestionsByCategory(category); track q.id) {
                  <div class="p-4 rounded-lg bg-slate-800/30">
                    <p class="text-sm text-slate-300 mb-3">
                      <span class="text-[10px] font-mono text-slate-500 mr-2">{{ q.id }}</span>
                      {{ q.text }}
                      @if (q.weight >= 3) {
                        <span class="ml-1 text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded">{{ lang.t('vqp.high_impact') }}</span>
                      }
                    </p>
                    <div class="flex gap-2">
                      @for (opt of q.options; track opt) {
                        <button (click)="setAnswer(q.id, opt)"
                                class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                                [class]="answers[q.id] === opt
                                  ? (opt === 'yes' ? 'bg-emerald-500 text-white' : (opt === 'partial' ? 'bg-amber-500 text-white' : (opt === 'no' ? 'bg-red-500 text-white' : 'bg-slate-500 text-white')))
                                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'">
                          {{ opt === 'yes' ? lang.t('vq.yes') : (opt === 'partial' ? lang.t('vq.partial') : (opt === 'no' ? lang.t('vq.no') : lang.t('vq.na'))) }}
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Submit -->
          <div class="glass-card p-6 text-center">
            <p class="text-sm text-slate-400 mb-4">{{ lang.t('vqp.submit_hint') }}</p>
            <button (click)="submit()" [disabled]="getAnsweredCount() < questions.length || submitting"
                    class="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-lg disabled:opacity-30 disabled:cursor-not-allowed">
              {{ submitting ? lang.t('vqp.submitting') : lang.t('vqp.submit') }}
            </button>
            @if (getAnsweredCount() < questions.length) {
              <p class="text-xs text-amber-400 mt-2">{{ questions.length - getAnsweredCount() }} {{ lang.t('vqp.remaining') }}</p>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .glass-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 12px;
      backdrop-filter: blur(12px);
    }
  `]
})
export class VendorQuestionnairePublicComponent implements OnInit {
  loading = true;
  error = false;
  status = '';
  vendorName = '';
  questions: QuestionnaireQuestion[] = [];
  answers: Record<string, string> = {};
  submitting = false;
  submitted = false;
  submittedRiskScore: number | null = null;
  private token = '';

  constructor(
    public lang: LangService,
    private route: ActivatedRoute,
    private service: VendorQuestionnaireService
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) { this.error = true; this.loading = false; return; }

    this.service.getPublic(this.token).subscribe({
      next: (data) => {
        this.loading = false;
        this.status = data.status;
        this.vendorName = data.vendorName;
        if (data.status === 'PENDING' && data.questions) {
          try {
            this.questions = JSON.parse(data.questions);
          } catch { this.questions = []; }
        }
      },
      error: () => { this.loading = false; this.error = true; }
    });
  }

  getIntroHtml(): string {
    return this.lang.t('vqp.intro').replace('{name}', '<strong class="text-white">' + this.vendorName + '</strong>');
  }

  getCategories(): string[] {
    const seen = new Set<string>();
    return this.questions.filter(q => { if (seen.has(q.category)) return false; seen.add(q.category); return true; }).map(q => q.category);
  }

  getQuestionsByCategory(category: string): QuestionnaireQuestion[] {
    return this.questions.filter(q => q.category === category);
  }

  setAnswer(questionId: string, answer: string) {
    this.answers[questionId] = answer;
  }

  getAnsweredCount(): number {
    return Object.keys(this.answers).length;
  }

  submit() {
    this.submitting = true;
    const responses = this.questions.map(q => ({
      id: q.id,
      text: q.text,
      weight: q.weight,
      answer: this.answers[q.id] || 'na'
    }));

    this.service.submitPublic(this.token, JSON.stringify(responses)).subscribe({
      next: (result) => {
        this.submitting = false;
        this.submitted = true;
        this.submittedRiskScore = result.riskScore;
      },
      error: () => this.submitting = false
    });
  }
}
