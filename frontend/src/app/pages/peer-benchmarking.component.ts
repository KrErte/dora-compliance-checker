import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { LangService } from '../lang.service';

interface BenchmarkData {
  industryAverage: number;
  median: number;
  percentile25?: number;
  percentile75?: number;
  totalAssessments?: number;
  percentileRank: number;
  complianceLevelDistribution?: { [key: string]: number };
  industryBenchmarks?: { [key: string]: { average: number; label: string } };
  pillarAverages?: { [key: string]: number };
}

interface HistoryEntry {
  id: string;
  scorePercentage: number;
  complianceLevel: string;
  companyName: string;
  assessmentDate: string;
  pillarScores?: { [id: string]: number };
}

@Component({
  selector: 'app-peer-benchmarking',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-10">
        <h1 class="text-3xl font-bold text-slate-100 mb-2">{{ lang.t('bench.title') }}</h1>
        <p class="text-slate-400">{{ lang.t('bench.subtitle') }}</p>
      </div>

      <!-- No assessment state -->
      @if (!latestEntry()) {
        <div class="glass-card p-12 text-center">
          <div class="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-6 border border-slate-700/50">
            <svg class="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <h2 class="text-xl font-bold text-slate-200 mb-2">{{ lang.t('bench.no_assessment') }}</h2>
          <p class="text-slate-400 mb-6">{{ lang.t('bench.no_assessment_desc') }}</p>
          <a routerLink="/assessment" class="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-semibold px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all">
            {{ lang.t('bench.take_assessment') }}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
          </a>
        </div>
      }

      @if (latestEntry()) {
        <!-- Hero Percentile -->
        <div class="glass-card p-8 mb-8 text-center">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-4">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
            {{ benchmarkData()?.totalAssessments || 247 }} {{ lang.t('bench.total_assessments') }}
          </div>
          <div class="text-6xl font-extrabold mb-2">
            <span class="gradient-text">{{ lang.t('bench.top') }} {{ 100 - (benchmarkData()?.percentileRank || 50) | number:'1.0-0' }}%</span>
          </div>
          <p class="text-slate-400 text-lg">
            {{ lang.t('bench.better_than') }} <span class="text-emerald-400 font-semibold">{{ benchmarkData()?.percentileRank || 50 | number:'1.0-0' }}%</span> {{ lang.t('bench.of_organizations') }}
          </p>
          <div class="mt-4 flex items-center justify-center gap-6 text-sm text-slate-500">
            <span>{{ lang.t('bench.your_score') }}: <strong class="text-white">{{ latestEntry()!.scorePercentage | number:'1.0-0' }}%</strong></span>
            <span>{{ lang.t('bench.industry_avg') }}: <strong class="text-slate-300">{{ benchmarkData()?.industryAverage || 61 | number:'1.0-0' }}%</strong></span>
            <span>{{ lang.t('bench.median') }}: <strong class="text-slate-300">{{ benchmarkData()?.median || 58 | number:'1.0-0' }}%</strong></span>
          </div>
        </div>

        <!-- Radar Chart + Pillar Comparison -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <!-- Radar Chart -->
          <div class="glass-card p-6">
            <h2 class="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/></svg>
              {{ lang.t('bench.radar_title') }}
            </h2>
            <svg viewBox="0 0 300 320" class="w-full max-w-sm mx-auto">
              <!-- Grid pentagons -->
              @for (pct of gridLevels; track pct) {
                <polygon [attr.points]="getGridPolygon(pct)" fill="none" stroke="rgb(71 85 105)" stroke-opacity="0.3" stroke-width="0.5"/>
              }
              <!-- Grid lines from center -->
              @for (v of vertices(); track $index) {
                <line [attr.x1]="CX" [attr.y1]="CY" [attr.x2]="v.x" [attr.y2]="v.y" stroke="rgb(71 85 105)" stroke-opacity="0.2" stroke-width="0.5"/>
              }
              <!-- Industry average polygon -->
              <polygon [attr.points]="industryPolygon()" fill="rgb(148 163 184)" fill-opacity="0.1" stroke="rgb(148 163 184)" stroke-opacity="0.5" stroke-width="1.5" stroke-dasharray="4 2"/>
              <!-- User polygon -->
              <polygon [attr.points]="userPolygon()" fill="rgb(52 211 153)" fill-opacity="0.15" stroke="rgb(52 211 153)" stroke-width="2.5"/>
              <!-- User score dots -->
              @for (pt of userPoints(); track $index) {
                <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="4" fill="rgb(52 211 153)" stroke="rgb(16 185 129)" stroke-width="1.5"/>
              }
              <!-- Labels -->
              @for (label of pillarLabels(); track $index) {
                <text [attr.x]="label.x" [attr.y]="label.y" text-anchor="middle" dominant-baseline="middle" class="fill-slate-400" style="font-size: 10px;">{{ label.text }}</text>
                <text [attr.x]="label.x" [attr.y]="label.y + 13" text-anchor="middle" dominant-baseline="middle" class="fill-emerald-400" style="font-size: 9px; font-weight: 600;">{{ label.score | number:'1.0-0' }}%</text>
              }
              <!-- Legend -->
              <circle cx="70" cy="305" r="5" fill="rgb(52 211 153)" fill-opacity="0.3" stroke="rgb(52 211 153)" stroke-width="1.5"/>
              <text x="80" y="305" dominant-baseline="middle" class="fill-slate-300" style="font-size: 10px;">{{ lang.t('bench.your_score') }}</text>
              <circle cx="170" cy="305" r="5" fill="rgb(148 163 184)" fill-opacity="0.2" stroke="rgb(148 163 184)" stroke-width="1.5" stroke-dasharray="3 1"/>
              <text x="180" y="305" dominant-baseline="middle" class="fill-slate-400" style="font-size: 10px;">{{ lang.t('bench.industry_avg') }}</text>
            </svg>
          </div>

          <!-- Pillar Comparison Bars -->
          <div class="glass-card p-6">
            <h2 class="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              {{ lang.t('bench.pillar_comparison') }}
            </h2>
            <div class="space-y-5">
              @for (p of pillarComparison(); track p.id) {
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-sm font-medium text-slate-300">{{ p.label }}</span>
                    <div class="flex items-center gap-3 text-xs">
                      <span [class]="p.userScore >= p.industryAvg ? 'text-emerald-400' : 'text-amber-400'">
                        {{ p.userScore | number:'1.0-0' }}%
                        @if (p.userScore >= p.industryAvg) {
                          <span class="text-emerald-500">+{{ p.userScore - p.industryAvg | number:'1.0-0' }}</span>
                        } @else {
                          <span class="text-red-400">{{ p.userScore - p.industryAvg | number:'1.0-0' }}</span>
                        }
                      </span>
                    </div>
                  </div>
                  <!-- User bar -->
                  <div class="relative h-6 bg-slate-800/80 rounded-lg overflow-hidden">
                    <div class="absolute inset-y-0 left-0 rounded-lg transition-all duration-1000"
                         [class]="p.userScore >= p.industryAvg ? 'bg-gradient-to-r from-emerald-600 to-emerald-500' : 'bg-gradient-to-r from-amber-600 to-amber-500'"
                         [style.width.%]="p.userScore">
                    </div>
                    <!-- Industry average marker -->
                    <div class="absolute inset-y-0 w-0.5 bg-slate-300/60" [style.left.%]="p.industryAvg">
                      <div class="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-slate-400 whitespace-nowrap">{{ lang.t('bench.avg_short') }} {{ p.industryAvg | number:'1.0-0' }}%</div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Sector Comparison + Distribution -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <!-- Sector Comparison -->
          <div class="glass-card p-6">
            <h2 class="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
              {{ lang.t('bench.sector_comparison') }}
            </h2>
            <div class="space-y-3">
              @for (s of sectorRanking(); track s.key) {
                <div class="flex items-center gap-3">
                  <span class="text-sm text-slate-400 w-28 truncate">{{ s.label }}</span>
                  <div class="flex-1 h-5 bg-slate-800/80 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-1000"
                         [class]="s.isUser ? 'bg-gradient-to-r from-emerald-600 to-cyan-500' : 'bg-slate-600/60'"
                         [style.width.%]="s.average">
                    </div>
                  </div>
                  <span class="text-sm font-semibold w-12 text-right" [class]="s.isUser ? 'text-emerald-400' : 'text-slate-400'">{{ s.average | number:'1.0-0' }}%</span>
                </div>
              }
            </div>
          </div>

          <!-- Score Distribution -->
          <div class="glass-card p-6">
            <h2 class="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>
              {{ lang.t('bench.distribution') }}
            </h2>
            <!-- Donut chart -->
            <div class="flex items-center justify-center gap-8">
              <svg viewBox="0 0 120 120" class="w-32 h-32">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgb(239 68 68)" stroke-opacity="0.4" stroke-width="12" [attr.stroke-dasharray]="redArc + ' ' + (314.16 - redArc)" [attr.stroke-dashoffset]="redOffset"/>
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgb(251 191 36)" stroke-opacity="0.6" stroke-width="12" [attr.stroke-dasharray]="yellowArc + ' ' + (314.16 - yellowArc)" [attr.stroke-dashoffset]="yellowOffset"/>
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgb(52 211 153)" stroke-width="12" [attr.stroke-dasharray]="greenArc + ' ' + (314.16 - greenArc)" [attr.stroke-dashoffset]="greenOffset"/>
                <text x="60" y="57" text-anchor="middle" class="fill-white" style="font-size: 16px; font-weight: 700;">{{ distTotal }}</text>
                <text x="60" y="72" text-anchor="middle" class="fill-slate-500" style="font-size: 8px;">{{ lang.t('bench.total_assessments') }}</text>
              </svg>
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-emerald-400"></div>
                  <span class="text-sm text-slate-300">{{ lang.t('bench.compliant') }}</span>
                  <span class="text-sm font-semibold text-emerald-400 ml-auto">{{ distGreen }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-amber-400"></div>
                  <span class="text-sm text-slate-300">{{ lang.t('bench.partial') }}</span>
                  <span class="text-sm font-semibold text-amber-400 ml-auto">{{ distYellow }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-red-400"></div>
                  <span class="text-sm text-slate-300">{{ lang.t('bench.non_compliant') }}</span>
                  <span class="text-sm font-semibold text-red-400 ml-auto">{{ distRed }}</span>
                </div>
              </div>
            </div>
            <!-- User position indicator -->
            <div class="mt-6 p-3 rounded-lg" [class]="latestEntry()!.complianceLevel === 'GREEN' ? 'bg-emerald-500/10 border border-emerald-500/20' : latestEntry()!.complianceLevel === 'YELLOW' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-red-500/10 border border-red-500/20'">
              <p class="text-sm text-center" [class]="latestEntry()!.complianceLevel === 'GREEN' ? 'text-emerald-300' : latestEntry()!.complianceLevel === 'YELLOW' ? 'text-amber-300' : 'text-red-300'">
                {{ lang.t('bench.your_level') }}:
                <strong>{{ latestEntry()!.complianceLevel === 'GREEN' ? lang.t('bench.compliant') : latestEntry()!.complianceLevel === 'YELLOW' ? lang.t('bench.partial') : lang.t('bench.non_compliant') }}</strong>
                ({{ latestEntry()!.scorePercentage | number:'1.0-0' }}%)
              </p>
            </div>
          </div>
        </div>

        <!-- Score Range Box Plot -->
        <div class="glass-card p-6 mb-8">
          <h2 class="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
            <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/></svg>
            {{ lang.t('bench.score_range') }}
          </h2>
          <div class="relative h-12 bg-slate-800/60 rounded-xl overflow-visible mx-4">
            <!-- P25-P75 box -->
            <div class="absolute inset-y-1 rounded-lg bg-slate-600/40 border border-slate-500/30"
                 [style.left.%]="benchmarkData()?.percentile25 || 45"
                 [style.width.%]="((benchmarkData()?.percentile75 || 72) - (benchmarkData()?.percentile25 || 45))">
            </div>
            <!-- Median line -->
            <div class="absolute inset-y-0 w-0.5 bg-slate-300/60" [style.left.%]="benchmarkData()?.median || 58"></div>
            <!-- User marker -->
            <div class="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-lg shadow-emerald-500/50 z-10" [style.left.%]="latestEntry()!.scorePercentage" style="margin-left: -10px;"></div>
          </div>
          <div class="flex justify-between mt-2 px-4 text-xs text-slate-500">
            <span>0%</span>
            <span>P25: {{ benchmarkData()?.percentile25 || 45 | number:'1.0-0' }}%</span>
            <span>{{ lang.t('bench.median') }}: {{ benchmarkData()?.median || 58 | number:'1.0-0' }}%</span>
            <span>P75: {{ benchmarkData()?.percentile75 || 72 | number:'1.0-0' }}%</span>
            <span>100%</span>
          </div>
        </div>

        <!-- CTA -->
        <div class="text-center">
          <a routerLink="/assessment" class="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-semibold px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all">
            {{ lang.t('bench.retake') }}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          </a>
        </div>
      }
    </div>
  `
})
export class PeerBenchmarkingComponent implements OnInit {
  readonly lang = inject(LangService);
  private readonly http = inject(HttpClient);
  private readonly titleService = inject(Title);

  readonly CX = 150;
  readonly CY = 140;
  readonly R = 105;
  readonly gridLevels = [20, 40, 60, 80, 100];

  readonly PILLAR_IDS = ['ICT_RISK_MANAGEMENT', 'INCIDENT_MANAGEMENT', 'TESTING', 'THIRD_PARTY', 'INFORMATION_SHARING'];
  readonly PILLAR_LABEL_KEYS = ['bench.pillar_ict', 'bench.pillar_incident', 'bench.pillar_testing', 'bench.pillar_thirdparty', 'bench.pillar_infosharing'];

  latestEntry = signal<HistoryEntry | null>(null);
  benchmarkData = signal<BenchmarkData | null>(null);

  // Distribution
  distGreen = 0; distYellow = 0; distRed = 0; distTotal = 0;
  greenArc = 0; yellowArc = 0; redArc = 0;
  greenOffset = 0; yellowOffset = 0; redOffset = 0;

  // Computed: radar chart geometry
  vertices = computed(() => this.PILLAR_IDS.map((_, i) => this.getVertex(i, 100)));

  userPoints = computed(() => {
    const entry = this.latestEntry();
    if (!entry) return [];
    return this.PILLAR_IDS.map((id, i) => this.getVertex(i, entry.pillarScores?.[id] ?? entry.scorePercentage));
  });

  userPolygon = computed(() => this.pointsToString(this.userPoints()));

  industryPolygon = computed(() => {
    const data = this.benchmarkData();
    const avgs = data?.pillarAverages;
    const points = this.PILLAR_IDS.map((id, i) => this.getVertex(i, avgs?.[id] ?? data?.industryAverage ?? 61));
    return this.pointsToString(points);
  });

  pillarLabels = computed(() => {
    const entry = this.latestEntry();
    return this.PILLAR_IDS.map((id, i) => {
      const pos = this.getLabelPos(i);
      return { ...pos, text: this.lang.t(this.PILLAR_LABEL_KEYS[i]), score: entry?.pillarScores?.[id] ?? entry?.scorePercentage ?? 0 };
    });
  });

  pillarComparison = computed(() => {
    const entry = this.latestEntry();
    const data = this.benchmarkData();
    if (!entry) return [];
    return this.PILLAR_IDS.map((id, i) => ({
      id,
      label: this.lang.t(this.PILLAR_LABEL_KEYS[i]),
      userScore: entry.pillarScores?.[id] ?? entry.scorePercentage,
      industryAvg: data?.pillarAverages?.[id] ?? data?.industryAverage ?? 61
    }));
  });

  sectorRanking = computed(() => {
    const data = this.benchmarkData();
    const entry = this.latestEntry();
    if (!data?.industryBenchmarks) return [];
    const sectors = Object.entries(data.industryBenchmarks)
      .map(([key, val]) => ({ key, label: val.label, average: val.average, isUser: false }))
      .sort((a, b) => b.average - a.average);
    if (entry) {
      sectors.push({ key: 'you', label: this.lang.t('bench.you'), average: entry.scorePercentage, isUser: true });
      sectors.sort((a, b) => b.average - a.average);
    }
    return sectors;
  });

  ngOnInit() {
    this.titleService.setTitle(this.lang.t('title.benchmarking'));
    this.loadData();
  }

  private loadData() {
    if (typeof localStorage === 'undefined') return;
    try {
      const history: HistoryEntry[] = JSON.parse(localStorage.getItem('dora_history') || '[]');
      if (history.length > 0) {
        this.latestEntry.set(history[0]);
        this.http.get<BenchmarkData>(`/api/benchmarks/assessment/${history[0].scorePercentage}`).subscribe({
          next: data => {
            this.benchmarkData.set(data);
            this.buildDistribution(data);
          },
          error: () => {
            this.benchmarkData.set({ industryAverage: 61, median: 58, percentileRank: 50 });
          }
        });
      }
    } catch { /* empty */ }
  }

  private buildDistribution(data: BenchmarkData) {
    const dist = data.complianceLevelDistribution || {};
    this.distGreen = Number(dist['GREEN'] || 0);
    this.distYellow = Number(dist['YELLOW'] || 0);
    this.distRed = Number(dist['RED'] || 0);
    this.distTotal = Number(data.totalAssessments || (this.distGreen + this.distYellow + this.distRed));
    const total = this.distGreen + this.distYellow + this.distRed || 1;
    const circ = 314.16; // 2*PI*50
    this.greenArc = (this.distGreen / total) * circ;
    this.yellowArc = (this.distYellow / total) * circ;
    this.redArc = (this.distRed / total) * circ;
    // Offsets to position arcs: green starts at top (-90deg = quarter circumference)
    this.greenOffset = circ * 0.25;
    this.yellowOffset = circ * 0.25 - this.greenArc;
    this.redOffset = circ * 0.25 - this.greenArc - this.yellowArc;
  }

  private getVertex(index: number, score: number): { x: number; y: number } {
    const angle = (index * 2 * Math.PI / 5) - Math.PI / 2;
    const r = this.R * score / 100;
    return { x: this.CX + r * Math.cos(angle), y: this.CY + r * Math.sin(angle) };
  }

  private getLabelPos(index: number): { x: number; y: number } {
    const angle = (index * 2 * Math.PI / 5) - Math.PI / 2;
    const r = this.R + 30;
    return { x: this.CX + r * Math.cos(angle), y: this.CY + r * Math.sin(angle) };
  }

  private pointsToString(points: { x: number; y: number }[]): string {
    return points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  }

  getGridPolygon(pct: number): string {
    return this.pointsToString(this.PILLAR_IDS.map((_, i) => this.getVertex(i, pct)));
  }
}
