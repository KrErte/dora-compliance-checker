import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApiService, BenchmarkData } from '../api.service';
import { LangService } from '../lang.service';
import { ContractAnalysisResult, ContractFinding } from '../models';
import { SubscriptionService } from '../services/subscription.service';
import { UpgradeModalComponent } from '../components/upgrade-modal.component';
import { PremiumBadgeComponent } from '../components/premium-badge.component';

@Component({
  selector: 'app-contract-results',
  standalone: true,
  imports: [CommonModule, RouterLink, UpgradeModalComponent, PremiumBadgeComponent],
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
      <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-4 sm:p-8">
        <div class="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
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
        <div class="grid grid-cols-3 gap-2 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-700/50">
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

        <!-- Benchmark comparison -->
        <div *ngIf="benchmark" class="mt-6 pt-6 border-t border-slate-700/50">
          <div class="flex items-center gap-2 mb-4">
            <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            <span class="text-sm font-semibold text-indigo-300">{{ lang.t('contractres.industry_benchmark') }}</span>
          </div>
          <div class="grid grid-cols-3 gap-2 sm:gap-4">
            <div class="text-center">
              <p class="text-xs text-slate-500 mb-1">{{ lang.t('contractres.your_score') }}</p>
              <p class="text-lg font-bold" [style.color]="scoreColor">{{ result.scorePercentage | number:'1.0-0' }}%</p>
              <p class="text-[10px]" [class]="result.scorePercentage >= benchmark.industryAverage ? 'text-emerald-400' : 'text-amber-400'">
                {{ getBenchmarkComparison() }}
              </p>
            </div>
            <div class="text-center">
              <p class="text-xs text-slate-500 mb-1">{{ lang.t('contractres.average') }}</p>
              <p class="text-lg font-bold text-slate-300">{{ benchmark.industryAverage | number:'1.0-0' }}%</p>
              <p class="text-[10px] text-slate-500">{{ benchmark.totalAnalyses }} {{ lang.t('contractres.analyses') }}</p>
            </div>
            <div class="text-center">
              <p class="text-xs text-slate-500 mb-1">{{ lang.t('contractres.ranking') }}</p>
              <p class="text-lg font-bold text-indigo-400">{{ getPercentileLabel() }}</p>
              <p class="text-[10px] text-slate-500">{{ benchmark.percentileRank | number:'1.0-0' }}. protsentiil</p>
            </div>
          </div>
        </div>
        <div *ngIf="benchmarkLoading" class="mt-6 pt-6 border-t border-slate-700/50 flex items-center gap-2">
          <div class="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-xs text-slate-400">{{ lang.t('contractres.loading_benchmark') }}</span>
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
          <button type="button" (click)="statusFilter = 'ALL'" [class]="filterClass('ALL')">
            {{ lang.t('contract.filter_all') }} ({{ result.totalRequirements }})
          </button>
          <button type="button" (click)="statusFilter = 'found'" [class]="filterClass('found')">
            {{ lang.t('contract.covered') }} ({{ result.foundCount }})
          </button>
          <button type="button" (click)="statusFilter = 'partial'" [class]="filterClass('partial')">
            {{ lang.t('contract.weak') }} ({{ result.partialCount }})
          </button>
          <button type="button" (click)="statusFilter = 'missing'" [class]="filterClass('missing')">
            {{ lang.t('contract.missing') }} ({{ result.missingCount }})
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <caption class="sr-only">{{ lang.t('contractres.contract_analysis_results') }}</caption>
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
                  <span class="line-clamp-2">{{ lang.l(f.requirementEt, f.requirementEn) }}</span>
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

      <!-- Missing/Partial findings with recommendations and clause rewriter -->
      <div *ngIf="missingFindings.length > 0" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-white">{{ lang.t('contract.tab_gaps') }} ({{ missingFindings.length }})</h2>
          <span class="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
            {{ lang.t('contractres.ai_clause_generator') }}
          </span>
        </div>
        <div *ngFor="let f of missingFindings; let i = index"
             class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl overflow-hidden">
          <div [class]="'px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ' + (f.status === 'missing' ? 'bg-red-500/10' : 'bg-yellow-500/10')">
            <div class="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0">
              <span class="text-white font-bold text-sm shrink-0">{{ i + 1 }}.</span>
              <span class="text-white text-sm font-medium shrink-0">{{ f.doraReference }}</span>
              <span class="text-slate-300 text-sm line-clamp-2 sm:line-clamp-1">{{ lang.l(f.requirementEt, f.requirementEn) }}</span>
            </div>
            <span [class]="statusBadge(f.status) + ' shrink-0 self-end sm:self-auto'">{{ statusLabel(f.status) }}</span>
          </div>
          <div class="px-5 py-4">
            <p class="text-xs font-semibold text-slate-500 uppercase mb-1">{{ lang.t('contract.recommendation') }}</p>
            <p class="text-sm text-slate-300 mb-4">{{ lang.l(f.recommendationEt, f.recommendationEn) }}</p>

            <!-- Generate clause button -->
            <button type="button" (click)="generateCompliantClause(f)"
                    [disabled]="clauseLoading[f.requirementId]"
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                           bg-gradient-to-r from-violet-500 to-purple-500 text-white
                           hover:from-violet-400 hover:to-purple-400 hover:shadow-lg hover:shadow-violet-500/25
                           disabled:opacity-50 transition-all">
              <svg *ngIf="!clauseLoading[f.requirementId]" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <svg *ngIf="clauseLoading[f.requirementId]" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              {{ clauseLoading[f.requirementId]
                ? lang.t('contractres.generating')
                : lang.t('contractres.generate_doracompliant_clause') }}
            </button>

            <!-- Generated clause -->
            <div *ngIf="generatedClauses[f.requirementId]" class="mt-4 p-4 bg-violet-500/5 border border-violet-500/20 rounded-lg animate-fade-in">
              <div class="flex items-start justify-between gap-4 mb-3">
                <h4 class="text-sm font-semibold text-violet-300 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {{ lang.t('contractres.suggested_clause') }}
                </h4>
                <button type="button" (click)="copyClause(f.requirementId)"
                        class="text-xs px-2 py-1 rounded bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-colors flex items-center gap-1">
                  <svg *ngIf="copiedClause !== f.requirementId" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                  <svg *ngIf="copiedClause === f.requirementId" class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  {{ copiedClause === f.requirementId
                    ? lang.t('contractres.copied')
                    : lang.t('contractres.copy') }}
                </button>
              </div>
              <pre class="text-sm text-slate-200 whitespace-pre-wrap font-sans bg-slate-900/50 rounded-lg p-4 mb-3 leading-relaxed">{{ generatedClauses[f.requirementId].suggestedClause }}</pre>

              <!-- Key elements -->
              <div *ngIf="generatedClauses[f.requirementId].keyElements" class="mb-3">
                <p class="text-xs text-slate-500 mb-1">{{ lang.t('contractres.key_elements') }}</p>
                <div class="flex flex-wrap gap-2">
                  <span *ngFor="let el of generatedClauses[f.requirementId].keyElements"
                        class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {{ el }}
                  </span>
                </div>
              </div>

              <!-- Legal references -->
              <div *ngIf="generatedClauses[f.requirementId].legalReferences" class="mb-3">
                <p class="text-xs text-slate-500 mb-1">{{ lang.t('contractres.legal_references') }}</p>
                <div class="flex flex-wrap gap-2">
                  <span *ngFor="let ref of generatedClauses[f.requirementId].legalReferences"
                        class="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {{ ref }}
                  </span>
                </div>
              </div>

              <!-- Implementation notes -->
              <div *ngIf="generatedClauses[f.requirementId].implementationNotes" class="text-xs text-slate-400 italic">
                {{ generatedClauses[f.requirementId].implementationNotes }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:justify-center">
        <button type="button" (click)="viewComparison()"
                class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            {{ lang.t('comparison.compare_button') }}
          </span>
        </button>

        <!-- PDF Export - Paywalled -->
        <button type="button" (click)="handlePdfClick()"
                class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
                [class.opacity-80]="!subscriptionService.canAccess('PDF_EXPORT')">
          <span class="flex items-center gap-2">
            <svg *ngIf="!subscriptionService.canAccess('PDF_EXPORT')" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <svg *ngIf="subscriptionService.canAccess('PDF_EXPORT')" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            {{ lang.t('contract.download_pdf') }}
            <app-premium-badge feature="PDF_EXPORT"></app-premium-badge>
          </span>
        </button>

        <!-- Excel Export - Paywalled -->
        <button type="button" (click)="handleExcelClick()"
                class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-900 font-semibold text-sm hover:shadow-lg hover:shadow-teal-500/25 transition-all"
                [class.opacity-80]="!subscriptionService.canAccess('EXCEL_EXPORT')">
          <span class="flex items-center gap-2">
            <svg *ngIf="!subscriptionService.canAccess('EXCEL_EXPORT')" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <svg *ngIf="subscriptionService.canAccess('EXCEL_EXPORT')" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Excel
            <app-premium-badge feature="EXCEL_EXPORT"></app-premium-badge>
          </span>
        </button>

        <button type="button" (click)="startMonitoring()"
                [disabled]="monitoringLoading"
                class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50">
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            {{ monitoringLoading ? lang.t('guardian.reanalyzing') : lang.t('guardian.start_monitoring') }}
          </span>
        </button>
        <button type="button" *ngIf="missingFindings.length > 0" (click)="startNegotiation()"
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

      <!-- Upgrade Modal -->
      <app-upgrade-modal></app-upgrade-modal>
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

  // Benchmark
  benchmark: BenchmarkData | null = null;
  benchmarkLoading = false;

  // Clause rewriter
  expandedClause: number | null = null;
  clauseLoading: { [key: number]: boolean } = {};
  generatedClauses: { [key: number]: any } = {};
  copiedClause: number | null = null;

  constructor(
    public lang: LangService,
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    public subscriptionService: SubscriptionService
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
        this.loadBenchmark();
      },
      error: () => {
        this.error = this.lang.t('contract.error_loading');
        this.loading = false;
      }
    });
  }

  loadBenchmark() {
    if (!this.result) return;
    this.benchmarkLoading = true;
    this.api.getContractBenchmark(this.result.scorePercentage).subscribe({
      next: (data) => {
        this.benchmark = data;
        this.benchmarkLoading = false;
      },
      error: () => {
        this.benchmarkLoading = false;
      }
    });
  }

  getBenchmarkComparison(): string {
    if (!this.benchmark || !this.result) return '';
    const diff = this.result.scorePercentage - this.benchmark.industryAverage;
    if (diff > 0) {
      return this.lang.currentLang === 'et'
        ? `+${diff.toFixed(1)}% \u00fcle keskmise`
        : `+${diff.toFixed(1)}% above average`;
    } else if (diff < 0) {
      return this.lang.currentLang === 'et'
        ? `${diff.toFixed(1)}% alla keskmise`
        : `${diff.toFixed(1)}% below average`;
    }
    return this.lang.t('contractres.exactly_average');
  }

  getPercentileLabel(): string {
    if (!this.benchmark) return '';
    const rank = this.benchmark.percentileRank;
    if (rank >= 90) return 'Top 10%';
    if (rank >= 75) return 'Top 25%';
    if (rank >= 50) return this.lang.t('contractres.above_median');
    if (rank >= 25) return this.lang.t('contractres.below_median');
    return this.lang.t('contractres.bottom_25');
  }

  toggleClauseExpand(requirementId: number) {
    this.expandedClause = this.expandedClause === requirementId ? null : requirementId;
  }

  generateCompliantClause(finding: ContractFinding) {
    const id = finding.requirementId;
    this.clauseLoading[id] = true;

    const requirementType = this.getRequirementType(finding);

    this.http.post<any>('/api/clause-rewriter/suggest', {
      requirementType,
      doraArticle: finding.doraReference,
      language: this.lang.currentLang,
      context: finding.quote || ''
    }).subscribe({
      next: (response) => {
        this.generatedClauses[id] = response;
        this.clauseLoading[id] = false;
        this.expandedClause = id;
      },
      error: () => {
        this.clauseLoading[id] = false;
      }
    });
  }

  getRequirementType(finding: ContractFinding): string {
    const ref = finding.doraReference?.toLowerCase() || '';
    if (ref.includes('(c)') || ref.includes('audit')) return 'AUDIT';
    if (ref.includes('(e)') || ref.includes('exit')) return 'EXIT_STRATEGY';
    if (ref.includes('(d)') || ref.includes('incident')) return 'INCIDENT';
    if (ref.includes('(b)') || ref.includes('data')) return 'DATA_LOCATION';
    if (ref.includes('(f)') || ref.includes('subcontract')) return 'SUBCONTRACTING';
    if (ref.includes('(g)') || ref.includes('security')) return 'SECURITY';
    if (ref.includes('(h)') || ref.includes('continuity')) return 'CONTINUITY';
    return 'GENERAL';
  }

  copyClause(requirementId: number) {
    const clause = this.generatedClauses[requirementId];
    if (clause?.suggestedClause) {
      navigator.clipboard.writeText(clause.suggestedClause);
      this.copiedClause = requirementId;
      setTimeout(() => this.copiedClause = null, 2000);
    }
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
    if (!this.result) return;
    this.api.exportContractPdf(this.result.id).subscribe({
      next: (blob) => this.downloadBlob(blob, 'contract-analysis-report.pdf'),
      error: () => window.print()
    });
  }

  handlePdfClick() {
    if (this.subscriptionService.canAccess('PDF_EXPORT')) {
      this.downloadPdf();
    } else {
      this.subscriptionService.showUpgrade('PDF_EXPORT');
    }
  }

  handleExcelClick() {
    if (this.subscriptionService.canAccess('EXCEL_EXPORT')) {
      if (!this.result) return;
      this.api.exportContractExcel(this.result.id).subscribe({
        next: (blob) => this.downloadBlob(blob, 'contract-analysis-report.xlsx'),
        error: () => {}
      });
    } else {
      this.subscriptionService.showUpgrade('EXCEL_EXPORT');
    }
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
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
