import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LangService } from '../lang.service';
import { ApiService } from '../api.service';
import { AssessmentResult } from '../models';

@Component({
  selector: 'app-compliance-trend',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8">
      <div>
        <h1 class="text-2xl font-bold text-white flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
            </svg>
          </div>
          {{ lang.currentLang === 'et' ? 'Vastavuse trend' : 'Compliance Trend' }}
        </h1>
        <p class="text-slate-400 text-sm mt-1">{{ lang.currentLang === 'et' ? 'Vastavuse paranemine ajas hindamiste p\u00f5hjal' : 'Compliance improvement over time based on assessments' }}</p>
      </div>

      @if (loading()) {
        <div class="text-center py-16">
          <div class="w-10 h-10 mx-auto rounded-full border-4 border-slate-700 border-t-sky-400 animate-spin"></div>
        </div>
      }

      @if (!loading() && history().length === 0) {
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
          <p class="text-slate-400">{{ lang.currentLang === 'et' ? 'Trendi n\u00e4gemiseks tehke v\u00e4hemalt 2 hindamist' : 'Complete at least 2 assessments to see trends' }}</p>
        </div>
      }

      @if (!loading() && history().length > 0) {
        <!-- Score trend chart (CSS-only bar chart) -->
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 class="text-lg font-semibold text-white mb-4">{{ lang.currentLang === 'et' ? 'Skooride trend' : 'Score Trend' }}</h2>
          <div class="flex items-end gap-2 h-48">
            @for (item of history(); track item.id) {
              <div class="flex-1 flex flex-col items-center gap-1">
                <span class="text-xs font-bold"
                      [class]="item.scorePercentage >= 80 ? 'text-emerald-400' : item.scorePercentage >= 50 ? 'text-amber-400' : 'text-red-400'">
                  {{ item.scorePercentage }}%
                </span>
                <div class="w-full rounded-t-lg transition-all"
                     [style.height.%]="item.scorePercentage"
                     [class]="item.scorePercentage >= 80 ? 'bg-emerald-500/40' : item.scorePercentage >= 50 ? 'bg-amber-500/40' : 'bg-red-500/40'"></div>
                <span class="text-[9px] text-slate-500 text-center">{{ item.assessmentDate | date:'dd.MM' }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Improvement summary -->
        @if (history().length >= 2) {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 text-center">
              <div class="text-sm text-slate-400 mb-1">{{ lang.currentLang === 'et' ? 'Esimene skoor' : 'First Score' }}</div>
              <div class="text-2xl font-bold text-white">{{ history()[history().length - 1].scorePercentage }}%</div>
            </div>
            <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 text-center">
              <div class="text-sm text-slate-400 mb-1">{{ lang.currentLang === 'et' ? 'Viimane skoor' : 'Latest Score' }}</div>
              <div class="text-2xl font-bold text-white">{{ history()[0].scorePercentage }}%</div>
            </div>
            <div class="bg-slate-800/50 border rounded-xl p-5 text-center"
                 [class]="improvement() > 0 ? 'border-emerald-500/30' : improvement() < 0 ? 'border-red-500/30' : 'border-slate-700/50'">
              <div class="text-sm text-slate-400 mb-1">{{ lang.currentLang === 'et' ? 'Muutus' : 'Change' }}</div>
              <div class="text-2xl font-bold" [class]="improvement() > 0 ? 'text-emerald-400' : improvement() < 0 ? 'text-red-400' : 'text-slate-400'">
                {{ improvement() > 0 ? '+' : '' }}{{ improvement() }}%
              </div>
            </div>
          </div>
        }

        <!-- Assessment history table -->
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-700/50">
            <h2 class="text-lg font-semibold text-white">{{ lang.currentLang === 'et' ? 'Hindamiste ajalugu' : 'Assessment History' }}</h2>
          </div>
          <div class="divide-y divide-slate-700/30">
            @for (item of history(); track item.id) {
              <div class="px-6 py-3 flex items-center gap-4">
                <div class="w-3 h-3 rounded-full flex-shrink-0"
                     [class]="item.complianceLevel === 'GREEN' ? 'bg-emerald-500' : item.complianceLevel === 'YELLOW' ? 'bg-amber-500' : 'bg-red-500'"></div>
                <div class="flex-1">
                  <div class="text-sm text-white">{{ item.companyName }}</div>
                  <div class="text-xs text-slate-400">{{ item.assessmentDate | date:'dd.MM.yyyy HH:mm' }}</div>
                </div>
                <div class="text-sm font-bold" [class]="item.complianceLevel === 'GREEN' ? 'text-emerald-400' : item.complianceLevel === 'YELLOW' ? 'text-amber-400' : 'text-red-400'">
                  {{ item.scorePercentage }}%
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class ComplianceTrendComponent implements OnInit {
  loading = signal(true);
  history = signal<AssessmentResult[]>([]);

  constructor(public lang: LangService, private api: ApiService) {}

  ngOnInit() {
    // Load from localStorage assessment history
    const keys = Object.keys(localStorage).filter(k => k.startsWith('assessment_'));
    const results: AssessmentResult[] = [];
    for (const key of keys) {
      try { results.push(JSON.parse(localStorage.getItem(key)!)); } catch {}
    }
    results.sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime());
    this.history.set(results);
    this.loading.set(false);
  }

  improvement(): number {
    const h = this.history();
    if (h.length < 2) return 0;
    return Math.round(h[0].scorePercentage - h[h.length - 1].scorePercentage);
  }
}
