import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LangService } from '../lang.service';
import { ApiService } from '../api.service';

interface ClauseRewriteResult {
  originalClause: string;
  rewrittenClause: string;
  changes: string[];
  complianceScore: number;
  legalReferences: string[];
}

interface ClauseSuggestionResult {
  suggestedClause: string;
  rationale: string;
  complianceScore: number;
  legalReferences: string[];
}

@Component({
  selector: 'app-clause-rewriter',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="max-w-7xl mx-auto space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-4">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          {{ lang.t('clause.badge') }}
        </div>
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">{{ lang.t('clause.title') }}</h1>
        <p class="text-slate-400 max-w-2xl mx-auto">{{ lang.t('clause.subtitle') }}</p>
      </div>

      <!-- Mode Toggle -->
      <div class="flex justify-center">
        <div class="bg-white border border-slate-200 rounded-xl p-1 flex gap-1">
          <button (click)="mode.set('rewrite')"
                  class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
                  [class]="mode() === 'rewrite' ? 'bg-violet-500 text-white' : 'text-slate-400 hover:text-white'">
            {{ lang.t('clause.mode_rewrite') }}
          </button>
          <button (click)="mode.set('suggest')"
                  class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
                  [class]="mode() === 'suggest' ? 'bg-violet-500 text-white' : 'text-slate-400 hover:text-white'">
            {{ lang.t('clause.mode_suggest') }}
          </button>
        </div>
      </div>

      <!-- Input Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="space-y-4">
          <!-- DORA Requirement Dropdown -->
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">{{ lang.t('clause.requirement') }}</label>
            <select [(ngModel)]="selectedRequirement"
                    class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50">
              <option value="">{{ lang.t('clause.select_requirement') }}</option>
              <option value="art30_exit">Art. 30 — Exit Strategy</option>
              <option value="art30_audit">Art. 30 — Audit Rights</option>
              <option value="art30_subcontracting">Art. 30 — Subcontracting</option>
              <option value="art30_data">Art. 30 — Data Protection</option>
              <option value="art30_sla">Art. 30 — Service Level Agreement</option>
              <option value="art30_incident">Art. 30 — Incident Management</option>
              <option value="art30_continuity">Art. 30 — Business Continuity</option>
              <option value="art30_termination">Art. 30 — Termination Rights</option>
            </select>
          </div>

          <!-- Clause Input -->
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">
              {{ mode() === 'rewrite' ? lang.t('clause.input_rewrite') : lang.t('clause.input_suggest') }}
            </label>
            <textarea [(ngModel)]="inputText"
                      rows="12"
                      class="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-white text-sm font-mono resize-none focus:outline-none focus:border-violet-500/50"
                      [placeholder]="mode() === 'rewrite' ? lang.t('clause.placeholder_rewrite') : lang.t('clause.placeholder_suggest')">
            </textarea>
          </div>

          <button (click)="submit()"
                  [disabled]="loading() || !inputText.trim()"
                  class="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            @if (loading()) {
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ lang.t('clause.analyzing') }}
            } @else {
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              {{ mode() === 'rewrite' ? lang.t('clause.btn_rewrite') : lang.t('clause.btn_suggest') }}
            }
          </button>
        </div>

        <!-- Result Section -->
        <div class="space-y-4">
          @if (rewriteResult() || suggestionResult()) {
            <!-- Compliance Score -->
            <div class="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
              <div class="relative w-16 h-16">
                <svg class="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="#e2e8f0" stroke-width="3"/>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" [attr.stroke]="getScoreColor(getScore())" stroke-width="3"
                        [attr.stroke-dasharray]="getScore() + ', 100'"/>
                </svg>
                <span class="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{{ getScore() }}%</span>
              </div>
              <div>
                <div class="text-white font-semibold">{{ lang.t('clause.compliance_score') }}</div>
                <div class="text-sm" [class]="getScore() >= 80 ? 'text-blue-600' : getScore() >= 50 ? 'text-amber-400' : 'text-red-400'">
                  {{ getScore() >= 80 ? lang.t('clause.score_good') : getScore() >= 50 ? lang.t('clause.score_partial') : lang.t('clause.score_low') }}
                </div>
              </div>
            </div>

            <!-- Rewrite Result -->
            @if (mode() === 'rewrite' && rewriteResult()) {
              <div class="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <h3 class="text-white font-semibold">{{ lang.t('clause.rewritten_clause') }}</h3>
                  <button (click)="copyToClipboard(rewriteResult()!.rewrittenClause)"
                          class="text-xs px-3 py-1 rounded-lg bg-slate-700/50 text-slate-600 hover:text-white transition-colors">
                    {{ copied() ? lang.t('clause.copied') : lang.t('clause.copy') }}
                  </button>
                </div>
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <pre class="text-sm text-blue-500 whitespace-pre-wrap font-mono">{{ rewriteResult()!.rewrittenClause }}</pre>
                </div>
              </div>

              <!-- Changes -->
              @if (rewriteResult()!.changes && rewriteResult()!.changes.length > 0) {
                <div class="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                  <h3 class="text-white font-semibold text-sm">{{ lang.t('clause.changes_made') }}</h3>
                  @for (change of rewriteResult()!.changes; track change) {
                    <div class="flex items-start gap-2 text-sm">
                      <svg class="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/>
                      </svg>
                      <span class="text-slate-600">{{ change }}</span>
                    </div>
                  }
                </div>
              }
            }

            <!-- Suggestion Result -->
            @if (mode() === 'suggest' && suggestionResult()) {
              <div class="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <h3 class="text-white font-semibold">{{ lang.t('clause.suggested_clause') }}</h3>
                  <button (click)="copyToClipboard(suggestionResult()!.suggestedClause)"
                          class="text-xs px-3 py-1 rounded-lg bg-slate-700/50 text-slate-600 hover:text-white transition-colors">
                    {{ copied() ? lang.t('clause.copied') : lang.t('clause.copy') }}
                  </button>
                </div>
                <div class="bg-blue-50 border border-blue-500/20 rounded-lg p-3">
                  <pre class="text-sm text-blue-400 whitespace-pre-wrap font-mono">{{ suggestionResult()!.suggestedClause }}</pre>
                </div>
                @if (suggestionResult()!.rationale) {
                  <div class="text-sm text-slate-400">
                    <span class="text-slate-600 font-medium">{{ lang.t('clause.rationale') }}:</span> {{ suggestionResult()!.rationale }}
                  </div>
                }
              </div>
            }

            <!-- Legal References -->
            @if (getReferences().length > 0) {
              <div class="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                <h3 class="text-white font-semibold text-sm">{{ lang.t('clause.legal_refs') }}</h3>
                <div class="flex flex-wrap gap-2">
                  @for (ref of getReferences(); track ref) {
                    <span class="px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs">{{ ref }}</span>
                  }
                </div>
              </div>
            }
          } @else if (!loading()) {
            <div class="bg-slate-800/30 border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center">
              <svg class="w-12 h-12 text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p class="text-slate-500 text-sm">{{ lang.t('clause.empty_state') }}</p>
            </div>
          }
        </div>
      </div>

      @if (errorMsg()) {
        <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
          <span class="text-red-400 text-sm">{{ errorMsg() }}</span>
          <button (click)="errorMsg.set(null)" class="text-red-400 hover:text-red-300">&times;</button>
        </div>
      }
    </div>
  `
})
export class ClauseRewriterComponent {
  mode = signal<'rewrite' | 'suggest'>('rewrite');
  inputText = '';
  selectedRequirement = '';
  loading = signal(false);
  rewriteResult = signal<ClauseRewriteResult | null>(null);
  suggestionResult = signal<ClauseSuggestionResult | null>(null);
  errorMsg = signal<string | null>(null);
  copied = signal(false);

  constructor(public lang: LangService, private api: ApiService) {}

  submit() {
    if (!this.inputText.trim()) return;
    this.loading.set(true);
    this.errorMsg.set(null);
    this.rewriteResult.set(null);
    this.suggestionResult.set(null);

    const body: any = {
      clause: this.inputText.trim(),
      requirement: this.selectedRequirement || 'general',
      language: this.lang.currentLang
    };

    if (this.mode() === 'rewrite') {
      this.api.rewriteClause(body).subscribe({
        next: (res: any) => {
          this.rewriteResult.set({
            originalClause: this.inputText,
            rewrittenClause: res.rewrittenClause || res.result || '',
            changes: res.changes || [],
            complianceScore: res.complianceScore || 0,
            legalReferences: res.legalReferences || res.references || []
          });
          this.loading.set(false);
        },
        error: () => {
          this.errorMsg.set(this.lang.t('clause.error'));
          this.loading.set(false);
        }
      });
    } else {
      this.api.suggestClause(body).subscribe({
        next: (res: any) => {
          this.suggestionResult.set({
            suggestedClause: res.suggestedClause || res.result || '',
            rationale: res.rationale || '',
            complianceScore: res.complianceScore || 0,
            legalReferences: res.legalReferences || res.references || []
          });
          this.loading.set(false);
        },
        error: () => {
          this.errorMsg.set(this.lang.t('clause.error'));
          this.loading.set(false);
        }
      });
    }
  }

  getScore(): number {
    return this.rewriteResult()?.complianceScore || this.suggestionResult()?.complianceScore || 0;
  }

  getReferences(): string[] {
    return this.rewriteResult()?.legalReferences || this.suggestionResult()?.legalReferences || [];
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
