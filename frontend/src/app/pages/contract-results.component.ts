import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';
import { ContractAnalysisResult, RequirementAnalysis, GapItem } from '../models';
import { FormsModule } from '@angular/forms';
import { getDemoScenario } from '../mock-scenarios';

@Component({
  selector: 'app-contract-results',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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
                {{ result.defensibilityScore | number:'1.1-1' }}%
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
            <p class="text-slate-300 text-sm leading-relaxed">{{ result.executiveSummary }}</p>
          </div>
        </div>

        <!-- Stats row -->
        <div class="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-700/50">
          <div class="text-center">
            <p class="text-2xl font-bold text-emerald-400">{{ result.coveredCount }}</p>
            <p class="text-xs text-slate-500">{{ lang.t('contract.covered') }}</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-yellow-400">{{ result.weakCount }}</p>
            <p class="text-xs text-slate-500">{{ lang.t('contract.weak') }}</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-red-400">{{ result.missingCount }}</p>
            <p class="text-xs text-slate-500">{{ lang.t('contract.missing') }}</p>
          </div>
        </div>
      </div>

      <!-- Tab navigation -->
      <div class="flex gap-1 bg-slate-800/30 p-1 rounded-xl">
        <button (click)="activeTab = 'evidence'" [class]="tabClass('evidence')">
          {{ lang.t('contract.tab_evidence') }}
        </button>
        <button (click)="activeTab = 'gaps'" [class]="tabClass('gaps')">
          {{ lang.t('contract.tab_gaps') }} ({{ result.gaps.length }})
        </button>
      </div>

      <!-- Evidence Mapping Table -->
      <div *ngIf="activeTab === 'evidence'" class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden">
        <div class="p-4 border-b border-slate-700/50">
          <h2 class="text-lg font-semibold text-white">{{ lang.t('contract.evidence_mapping') }}</h2>
          <p class="text-xs text-slate-500 mt-1">{{ lang.t('contract.evidence_desc') }}</p>
        </div>

        <!-- Filter buttons -->
        <div class="p-4 flex gap-2 flex-wrap">
          <button (click)="statusFilter = 'ALL'" [class]="filterClass('ALL')">
            {{ lang.t('contract.filter_all') }} ({{ result.totalRequirements }})
          </button>
          <button (click)="statusFilter = 'COVERED'" [class]="filterClass('COVERED')">
            {{ lang.t('contract.covered') }} ({{ result.coveredCount }})
          </button>
          <button (click)="statusFilter = 'WEAK'" [class]="filterClass('WEAK')">
            {{ lang.t('contract.weak') }} ({{ result.weakCount }})
          </button>
          <button (click)="statusFilter = 'MISSING'" [class]="filterClass('MISSING')">
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
              <tr *ngFor="let req of filteredRequirements" class="border-t border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                <td class="px-4 py-3 text-sm text-slate-400">{{ req.requirementId }}</td>
                <td class="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">{{ req.articleReference }}</td>
                <td class="px-4 py-3 text-sm text-slate-300 max-w-xs">
                  <span class="line-clamp-2">{{ req.requirementText }}</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span [class]="statusBadge(req.status)">{{ statusLabel(req.status) }}</span>
                </td>
                <td class="px-4 py-3 text-sm text-slate-400 max-w-sm">
                  <span class="line-clamp-2">{{ req.evidenceFound }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Gap Report -->
      <div *ngIf="activeTab === 'gaps'" class="space-y-4">
        <div *ngIf="result.gaps.length === 0" class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center">
          <svg class="w-12 h-12 mx-auto mb-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-emerald-400 font-semibold">{{ lang.t('contract.no_gaps') }}</p>
        </div>

        <div *ngFor="let gap of result.gaps; let i = index"
             class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl overflow-hidden">
          <!-- Gap header -->
          <div [class]="'px-5 py-3 flex items-center justify-between ' + gapHeaderBg(gap)">
            <div class="flex items-center gap-3">
              <span class="text-white font-bold text-sm">{{ i + 1 }}.</span>
              <span class="text-white text-sm font-medium">{{ gap.articleReference }}</span>
              <span class="text-slate-300 text-sm">{{ gap.requirementText }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span [class]="severityBadge(gap.severity)">{{ severityLabel(gap.severity) }}</span>
              <span [class]="statusBadge(gap.status)">{{ statusLabel(gap.status) }}</span>
            </div>
          </div>
          <!-- Gap body -->
          <div class="px-5 py-4 space-y-3">
            <div>
              <p class="text-xs font-semibold text-slate-500 uppercase mb-1">{{ lang.t('contract.recommendation') }}</p>
              <p class="text-sm text-slate-300">{{ gap.recommendation }}</p>
            </div>
            <div *ngIf="gap.suggestedClause" class="bg-slate-700/30 rounded-lg p-3">
              <p class="text-xs font-semibold text-slate-500 uppercase mb-1">{{ lang.t('contract.suggested_clause') }}</p>
              <p class="text-sm text-slate-400 leading-relaxed">{{ gap.suggestedClause }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex flex-wrap gap-3 justify-center">
        <button *ngIf="!isDemo" (click)="downloadPdf()"
                class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all">
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            {{ lang.t('contract.download_pdf') }}
          </span>
        </button>
        <button *ngIf="!isDemo" (click)="startMonitoring()"
                [disabled]="monitoringLoading"
                class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50">
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            {{ monitoringLoading ? lang.t('guardian.reanalyzing') : lang.t('guardian.start_monitoring') }}
          </span>
        </button>
        <button *ngIf="!isDemo && result.gaps.length > 0" (click)="startNegotiation()"
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
  activeTab: 'evidence' | 'gaps' = 'evidence';
  statusFilter: 'ALL' | 'COVERED' | 'WEAK' | 'MISSING' = 'ALL';
  isDemo = false;

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

    if (id.startsWith('demo-')) {
      const demo = getDemoScenario(id);
      if (demo) {
        this.result = demo;
        this.isDemo = true;
      } else {
        this.error = this.lang.t('contract.error_loading');
      }
      this.loading = false;
      return;
    }

    this.api.getContractAnalysis(id).subscribe({
      next: (result) => {
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
    if (this.result.defensibilityScore >= 80) return '#10b981';
    if (this.result.defensibilityScore >= 50) return '#f59e0b';
    return '#ef4444';
  }

  get dashOffset(): number {
    if (!this.result) return this.circumference;
    return this.circumference - (this.result.defensibilityScore / 100) * this.circumference;
  }

  get levelClass(): string {
    if (!this.result) return '';
    switch (this.result.defensibilityLevel) {
      case 'GREEN': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'YELLOW': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'RED': return 'bg-red-500/20 text-red-400 border border-red-500/30';
    }
  }

  get levelLabel(): string {
    if (!this.result) return '';
    const et = this.lang.currentLang === 'et';
    switch (this.result.defensibilityLevel) {
      case 'GREEN': return et ? 'KAITSTAV' : 'DEFENSIBLE';
      case 'YELLOW': return et ? 'OSALISELT KAITSTAV' : 'PARTIALLY DEFENSIBLE';
      case 'RED': return et ? 'KAITSMATA' : 'NOT DEFENSIBLE';
    }
  }

  get filteredRequirements(): RequirementAnalysis[] {
    if (!this.result) return [];
    if (this.statusFilter === 'ALL') return this.result.requirements;
    return this.result.requirements.filter(r => r.status === this.statusFilter);
  }

  tabClass(tab: string): string {
    const base = 'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all';
    return tab === this.activeTab
      ? base + ' bg-slate-700 text-white'
      : base + ' text-slate-400 hover:text-white';
  }

  filterClass(filter: string): string {
    const base = 'px-3 py-1.5 rounded-lg text-xs font-medium transition-all';
    return filter === this.statusFilter
      ? base + ' bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
      : base + ' bg-slate-700/30 text-slate-400 border border-slate-600/30 hover:text-white';
  }

  statusBadge(status: string): string {
    switch (status) {
      case 'COVERED': return 'px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400';
      case 'WEAK': return 'px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400';
      default: return 'px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400';
    }
  }

  statusLabel(status: string): string {
    const et = this.lang.currentLang === 'et';
    switch (status) {
      case 'COVERED': return et ? 'KAETUD' : 'COVERED';
      case 'WEAK': return et ? 'N\u00d5RK' : 'WEAK';
      default: return et ? 'PUUDU' : 'MISSING';
    }
  }

  severityBadge(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20';
      case 'HIGH': return 'px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      default: return 'px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
  }

  severityLabel(severity: string): string {
    const et = this.lang.currentLang === 'et';
    switch (severity) {
      case 'CRITICAL': return et ? 'KRIITILINE' : 'CRITICAL';
      case 'HIGH': return et ? 'K\u00d5RGE' : 'HIGH';
      default: return et ? 'KESKMINE' : 'MEDIUM';
    }
  }

  gapHeaderBg(gap: GapItem): string {
    switch (gap.severity) {
      case 'CRITICAL': return 'bg-red-500/10';
      case 'HIGH': return 'bg-yellow-500/10';
      default: return 'bg-blue-500/10';
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
    // We pass empty contractText here - the backend will use stored analysis data
    // In a full implementation, the contract text would be stored during initial analysis
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
