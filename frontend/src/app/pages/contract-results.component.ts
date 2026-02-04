import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';
import { ContractAnalysisResult, ContractFinding } from '../models';

@Component({
  selector: 'app-contract-results',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Loading -->
    <div *ngIf="loading" class="text-center py-20">
      <div class="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-slate-700 border-t-emerald-400 animate-spin"></div>
      <p class="text-slate-400">{{ lang.t('contract.loading_results') }}</p>
    </div>

    <!-- Error -->
    <div *ngIf="error" class="text-center py-20">
      <p class="text-red-400">{{ error }}</p>
      <a routerLink="/contract-analysis" class="text-emerald-400 hover:underline mt-4 inline-block">{{ lang.t('contract.back') }}</a>
    </div>

    <!-- Results -->
    <div *ngIf="result" class="max-w-5xl mx-auto space-y-8">

      <!-- Header with score ring -->
      <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-8">
        <div class="flex flex-col md:flex-row items-center gap-8">
          <!-- SVG Score Ring -->
          <div class="relative flex-shrink-0">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" stroke="#334155" stroke-width="10" fill="none"/>
              <circle cx="80" cy="80" r="70" [attr.stroke]="scoreColor" stroke-width="10" fill="none"
                      stroke-linecap="round"
                      [attr.stroke-dasharray]="circumference"
                      [attr.stroke-dashoffset]="dashOffset"
                      transform="rotate(-90 80 80)"
                      class="transition-all duration-1000"/>
              <text x="80" y="72" text-anchor="middle" [attr.fill]="scoreColor" font-size="32" font-weight="bold">
                {{ result.scorePercentage | number:'1.1-1' }}%
              </text>
              <text x="80" y="95" text-anchor="middle" fill="#94a3b8" font-size="10">
                {{ lang.t('contract.defensibility') }}
              </text>
            </svg>
          </div>

          <!-- Summary info -->
          <div class="flex-1 text-center md:text-left">
            <div class="flex items-center gap-2 justify-center md:justify-start mb-2">
              <span [class]="'px-2.5 py-1 rounded-full text-xs font-bold ' + levelClass">
                {{ levelLabel }}
              </span>
            </div>
            <h1 class="text-2xl font-bold text-white mb-1">{{ result.contractName }}</h1>
            <p class="text-slate-400 text-sm mb-3">{{ result.companyName }} &middot; {{ result.fileName }}</p>
            <p class="text-slate-300 text-sm leading-relaxed">{{ result.summary }}</p>
          </div>
        </div>

        <!-- Stats row -->
        <div class="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-700/50">
          <div class="text-center">
            <p class="text-2xl font-bold text-emerald-400">{{ result.foundCount }}</p>
            <p class="text-xs text-slate-500">{{ lang.t('contract.covered') }}</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-yellow-400">{{ result.partialCount }}</p>
            <p class="text-xs text-slate-500">{{ lang.t('contract.weak') }}</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-red-400">{{ result.missingCount }}</p>
            <p class="text-xs text-slate-500">{{ lang.t('contract.missing') }}</p>
          </div>
        </div>
      </div>

      <!-- Findings Table -->
      <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden">
        <div class="p-4 border-b border-slate-700/50">
          <h2 class="text-lg font-semibold text-white">{{ lang.t('contract.evidence_mapping') }}</h2>
          <p class="text-xs text-slate-500 mt-1">{{ lang.t('contract.evidence_desc') }}</p>
        </div>

        <!-- Filter buttons -->
        <div class="p-4 flex gap-2 flex-wrap">
          <button (click)="statusFilter = 'ALL'" [class]="filterClass('ALL')">
            {{ lang.t('contract.filter_all') }} ({{ result.totalRequirements }})
          </button>
          <button (click)="statusFilter = 'found'" [class]="filterClass('found')">
            {{ lang.t('contract.covered') }} ({{ result.foundCount }})
          </button>
          <button (click)="statusFilter = 'partial'" [class]="filterClass('partial')">
            {{ lang.t('contract.weak') }} ({{ result.partialCount }})
          </button>
          <button (click)="statusFilter = 'missing'" [class]="filterClass('missing')">
            {{ lang.t('contract.missing') }} ({{ result.missingCount }})
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-slate-700/30">
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-400">#</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-400">{{ lang.t('contract.th_article') }}</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-400">{{ lang.t('contract.th_requirement') }}</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-400">{{ lang.t('contract.th_status') }}</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-400">{{ lang.t('contract.th_evidence') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let f of filteredFindings" class="border-t border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                <td class="px-4 py-3 text-sm text-slate-400">{{ f.requirementId }}</td>
                <td class="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">{{ f.doraReference }}</td>
                <td class="px-4 py-3 text-sm text-slate-300 max-w-xs">
                  <span class="line-clamp-2">{{ lang.currentLang === 'et' ? f.requirementEt : f.requirementEn }}</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span [class]="statusBadge(f.status)">{{ statusLabel(f.status) }}</span>
                </td>
                <td class="px-4 py-3 text-sm text-slate-400 max-w-sm">
                  <span *ngIf="f.quote" class="line-clamp-2">{{ f.quote }}</span>
                  <span *ngIf="!f.quote" class="italic text-slate-600">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Missing/Partial findings with recommendations -->
      <div *ngIf="missingFindings.length > 0" class="space-y-4">
        <h2 class="text-lg font-semibold text-white">{{ lang.t('contract.tab_gaps') }} ({{ missingFindings.length }})</h2>
        <div *ngFor="let f of missingFindings; let i = index"
             class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl overflow-hidden">
          <div [class]="'px-5 py-3 flex items-center justify-between ' + (f.status === 'missing' ? 'bg-red-500/10' : 'bg-yellow-500/10')">
            <div class="flex items-center gap-3">
              <span class="text-white font-bold text-sm">{{ i + 1 }}.</span>
              <span class="text-white text-sm font-medium">{{ f.doraReference }}</span>
              <span class="text-slate-300 text-sm">{{ lang.currentLang === 'et' ? f.requirementEt : f.requirementEn }}</span>
            </div>
            <span [class]="statusBadge(f.status)">{{ statusLabel(f.status) }}</span>
          </div>
          <div class="px-5 py-4">
            <p class="text-xs font-semibold text-slate-500 uppercase mb-1">{{ lang.t('contract.recommendation') }}</p>
            <p class="text-sm text-slate-300">{{ lang.currentLang === 'et' ? f.recommendationEt : f.recommendationEn }}</p>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex flex-wrap gap-3 justify-center">
        <button (click)="viewComparison()"
                class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            {{ lang.t('comparison.compare_button') }}
          </span>
        </button>
        <button (click)="downloadPdf()"
                class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all">
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            {{ lang.t('contract.download_pdf') }}
          </span>
        </button>
        <button (click)="startMonitoring()"
                [disabled]="monitoringLoading"
                class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50">
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            {{ monitoringLoading ? lang.t('guardian.reanalyzing') : lang.t('guardian.start_monitoring') }}
          </span>
        </button>
        <button *ngIf="missingFindings.length > 0" (click)="startNegotiation()"
                [disabled]="negotiationLoading"
                class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-50">
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            {{ negotiationLoading ? lang.t('neg.generating') : lang.t('neg.start') }}
          </span>
        </button>
        <a routerLink="/contract-analysis"
           class="px-6 py-2.5 rounded-xl bg-slate-700/50 border border-slate-600/50 text-slate-300 font-semibold text-sm hover:bg-slate-600/50 transition-all">
          {{ lang.t('contract.new_analysis') }}
        </a>
      </div>
    </div>
  `
})
export class ContractResultsComponent implements OnInit {
  result: ContractAnalysisResult | null = null;
  loading = true;
  error = '';
  statusFilter = 'ALL';

  readonly circumference = 2 * Math.PI * 70;

  negotiationLoading = false;
  monitoringLoading = false;

  constructor(
    public lang: LangService,
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID puudub';
      this.loading = false;
      return;
    }

    this.api.getContractAnalysis(id).subscribe({
      next: (result: ContractAnalysisResult) => {
        this.result = result;
        this.loading = false;
      },
      error: () => {
        this.error = this.lang.t('contract.error_loading');
        this.loading = false;
      }
    });
  }

  get scoreColor(): string {
    if (!this.result) return '#94a3b8';
    if (this.result.scorePercentage >= 80) return '#10b981';
    if (this.result.scorePercentage >= 50) return '#f59e0b';
    return '#ef4444';
  }

  get dashOffset(): number {
    if (!this.result) return this.circumference;
    return this.circumference - (this.result.scorePercentage / 100) * this.circumference;
  }

  get levelClass(): string {
    if (!this.result) return '';
    switch (this.result.complianceLevel) {
      case 'GREEN': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'YELLOW': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'RED': return 'bg-red-500/20 text-red-400 border border-red-500/30';
    }
  }

  get levelLabel(): string {
    if (!this.result) return '';
    const et = this.lang.currentLang === 'et';
    switch (this.result.complianceLevel) {
      case 'GREEN': return et ? 'KAITSTAV' : 'DEFENSIBLE';
      case 'YELLOW': return et ? 'OSALISELT KAITSTAV' : 'PARTIALLY DEFENSIBLE';
      case 'RED': return et ? 'KAITSMATA' : 'NOT DEFENSIBLE';
    }
  }

  get filteredFindings(): ContractFinding[] {
    if (!this.result) return [];
    if (this.statusFilter === 'ALL') return this.result.findings;
    return this.result.findings.filter((f: ContractFinding) => f.status === this.statusFilter);
  }

  get missingFindings(): ContractFinding[] {
    if (!this.result) return [];
    return this.result.findings.filter((f: ContractFinding) => f.status === 'missing' || f.status === 'partial');
  }

  filterClass(filter: string): string {
    const base = 'px-3 py-1.5 rounded-lg text-xs font-medium transition-all';
    return filter === this.statusFilter
      ? base + ' bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
      : base + ' bg-slate-700/30 text-slate-400 border border-slate-600/30 hover:text-white';
  }

  statusBadge(status: string): string {
    switch (status) {
      case 'found': return 'px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400';
      case 'partial': return 'px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400';
      default: return 'px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400';
    }
  }

  statusLabel(status: string): string {
    const et = this.lang.currentLang === 'et';
    switch (status) {
      case 'found': return et ? 'LEITUD' : 'FOUND';
      case 'partial': return et ? 'OSALINE' : 'PARTIAL';
      default: return et ? 'PUUDU' : 'MISSING';
    }
  }

  viewComparison() {
    if (this.result) {
      this.router.navigate(['/contract-comparison', this.result.id]);
    }
  }

  downloadPdf() {
    if (this.result) {
      this.api.downloadContractReport(this.result.id);
    }
  }

  startMonitoring() {
    if (!this.result) return;
    this.monitoringLoading = true;
    this.api.startMonitoring(this.result.id, 'stored').subscribe({
      next: () => {
        this.router.navigate(['/guardian']);
      },
      error: () => {
        this.monitoringLoading = false;
      }
    });
  }

  startNegotiation() {
    if (!this.result) return;
    this.negotiationLoading = true;
    this.api.createNegotiation(this.result.id, '').subscribe({
      next: (neg) => {
        this.router.navigate(['/negotiations', neg.id]);
      },
      error: () => {
        this.negotiationLoading = false;
      }
    });
  }
}
