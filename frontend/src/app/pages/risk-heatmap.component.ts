import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LangService } from '../lang.service';
import { calculatePillarScores, QuestionResult } from '../models';

@Component({
  selector: 'app-risk-heatmap',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8">
      <div>
        <h1 class="text-2xl font-bold text-white flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/>
            </svg>
          </div>
          {{ lang.currentLang === 'et' ? 'Riski soojuskaart' : 'Risk Heat Map' }}
        </h1>
        <p class="text-slate-400 text-sm mt-1">{{ lang.currentLang === 'et' ? 'Visuaalne riskide kaardistamine DORA sammaste kaupa' : 'Visual risk mapping across DORA pillars' }}</p>
      </div>

      @if (!hasData()) {
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
          <p class="text-slate-400">{{ lang.currentLang === 'et' ? 'Tehke esmalt hindamine, et n\u00e4ha riski soojuskaarti' : 'Complete an assessment first to see the risk heat map' }}</p>
        </div>
      }

      @if (hasData()) {
        <!-- Heat map grid -->
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
            @for (pillar of pillarData(); track pillar.id) {
              <div class="rounded-xl p-5 text-center transition-all"
                   [class]="getHeatClass(pillar.percentage)">
                <div class="text-3xl font-bold mb-2">{{ pillar.percentage | number:'1.0-0' }}%</div>
                <div class="text-sm font-medium mb-1">{{ getPillarName(pillar.id) }}</div>
                <div class="text-xs opacity-70">{{ getRiskLevel(pillar.percentage) }}</div>
              </div>
            }
          </div>
        </div>

        <!-- Legend -->
        <div class="flex justify-center gap-6">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded bg-red-500/30 border border-red-500/40"></div>
            <span class="text-xs text-slate-400">{{ lang.currentLang === 'et' ? 'K\u00f5rge risk (<50%)' : 'High Risk (<50%)' }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded bg-amber-500/30 border border-amber-500/40"></div>
            <span class="text-xs text-slate-400">{{ lang.currentLang === 'et' ? 'Keskmine risk (50-79%)' : 'Medium Risk (50-79%)' }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded bg-emerald-500/30 border border-emerald-500/40"></div>
            <span class="text-xs text-slate-400">{{ lang.currentLang === 'et' ? 'Madal risk (80%+)' : 'Low Risk (80%+)' }}</span>
          </div>
        </div>

        <!-- Category breakdown -->
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 class="text-lg font-semibold text-white mb-4">{{ lang.currentLang === 'et' ? 'Kategooriate kaart' : 'Category Map' }}</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            @for (cat of categoryData(); track cat.category) {
              <div class="rounded-lg p-3 text-center"
                   [class]="getHeatClass(cat.percentage)">
                <div class="text-lg font-bold">{{ cat.percentage | number:'1.0-0' }}%</div>
                <div class="text-[10px] opacity-80">{{ cat.category }}</div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class RiskHeatmapComponent {
  pillarData = signal<{ id: string; percentage: number }[]>([]);
  categoryData = signal<{ category: string; percentage: number }[]>([]);

  constructor(public lang: LangService) {
    this.loadFromHistory();
  }

  hasData(): boolean {
    return this.pillarData().length > 0;
  }

  loadFromHistory() {
    // Find the latest assessment
    const keys = Object.keys(localStorage).filter(k => k.startsWith('assessment_'));
    let latest: any = null;
    for (const key of keys) {
      try {
        const data = JSON.parse(localStorage.getItem(key)!);
        if (!latest || new Date(data.assessmentDate) > new Date(latest.assessmentDate)) latest = data;
      } catch {}
    }
    if (latest && latest.questionResults) {
      const scores = calculatePillarScores(latest.questionResults);
      this.pillarData.set(scores);

      // Category breakdown
      const categories: Record<string, { score: number; total: number }> = {};
      for (const qr of latest.questionResults as QuestionResult[]) {
        if (!categories[qr.category]) categories[qr.category] = { score: 0, total: 0 };
        categories[qr.category].total++;
        if (qr.complianceStatus === 'yes') categories[qr.category].score += 1;
        else if (qr.complianceStatus === 'partial') categories[qr.category].score += 0.5;
      }
      this.categoryData.set(
        Object.entries(categories).map(([category, data]) => ({
          category, percentage: data.total ? (data.score / data.total) * 100 : 0
        })).sort((a, b) => a.percentage - b.percentage)
      );
    }
  }

  getPillarName(id: string): string {
    const et = this.lang.currentLang === 'et';
    const names: Record<string, string> = {
      ICT_RISK_MANAGEMENT: et ? 'ICT Riskihaldus' : 'ICT Risk Mgmt',
      INCIDENT_MANAGEMENT: et ? 'Intsidendid' : 'Incidents',
      TESTING: et ? 'Testimine' : 'Testing',
      THIRD_PARTY: et ? '3. osapooled' : 'Third-Party',
      INFORMATION_SHARING: et ? 'Info jagamine' : 'Info Sharing'
    };
    return names[id] || id;
  }

  getHeatClass(percentage: number): string {
    if (percentage >= 80) return 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400';
    if (percentage >= 50) return 'bg-amber-500/20 border border-amber-500/30 text-amber-400';
    return 'bg-red-500/20 border border-red-500/30 text-red-400';
  }

  getRiskLevel(percentage: number): string {
    const et = this.lang.currentLang === 'et';
    if (percentage >= 80) return et ? 'Madal risk' : 'Low Risk';
    if (percentage >= 50) return et ? 'Keskmine risk' : 'Medium Risk';
    return et ? 'Kõrge risk' : 'High Risk';
  }
}
