import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';
import { ContractAnalysisResult, ContractFinding } from '../models';
import { MODEL_CLAUSES, ModelClause, getModelClause } from '../data/model-clauses';

@Component({
  selector: 'app-contract-comparison',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Loading -->
    <div *ngIf="loading" class="text-center py-20">
      <div class="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-slate-700 border-t-cyan-400 animate-spin"></div>
      <p class="text-slate-400">{{ lang.t('comparison.loading') }}</p>
    </div>

    <!-- Error -->
    <div *ngIf="error" class="text-center py-20">
      <p class="text-red-400">{{ error }}</p>
      <a routerLink="/contract-analysis" class="text-cyan-400 hover:underline mt-4 inline-block">{{ lang.t('contract.back') }}</a>
    </div>

    <!-- Comparison View -->
    <div *ngIf="result" class="max-w-6xl mx-auto space-y-6">

      <!-- Header Card -->
      <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-6">
            <!-- Score Ring -->
            <div class="relative flex-shrink-0">
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="#334155" stroke-width="8" fill="none"/>
                <circle cx="50" cy="50" r="42" [attr.stroke]="scoreColor" stroke-width="8" fill="none"
                        stroke-linecap="round"
                        [attr.stroke-dasharray]="circumference"
                        [attr.stroke-dashoffset]="dashOffset"
                        transform="rotate(-90 50 50)"
                        class="transition-all duration-1000"/>
                <text x="50" y="46" text-anchor="middle" [attr.fill]="scoreColor" font-size="22" font-weight="bold">
                  {{ result.scorePercentage | number:'1.0-0' }}%
                </text>
                <text x="50" y="62" text-anchor="middle" fill="#94a3b8" font-size="8">
                  {{ lang.t('contract.defensibility') }}
                </text>
              </svg>
            </div>
            <!-- Info -->
            <div>
              <h1 class="text-xl font-bold text-white mb-1">{{ lang.t('comparison.title') }}</h1>
              <p class="text-slate-400 text-sm">{{ result.companyName }} &middot; {{ result.contractName }}</p>
              <p class="text-slate-500 text-xs mt-1">{{ lang.t('comparison.subtitle') }}</p>
            </div>
          </div>
          <!-- Stats -->
          <div class="flex gap-6">
            <div class="text-center">
              <p class="text-xl font-bold text-emerald-400">{{ result.foundCount }}</p>
              <p class="text-xs text-slate-500">{{ lang.t('comparison.status_found') }}</p>
            </div>
            <div class="text-center">
              <p class="text-xl font-bold text-yellow-400">{{ result.partialCount }}</p>
              <p class="text-xs text-slate-500">{{ lang.t('comparison.status_partial') }}</p>
            </div>
            <div class="text-center">
              <p class="text-xl font-bold text-red-400">{{ result.missingCount }}</p>
              <p class="text-xs text-slate-500">{{ lang.t('comparison.status_missing') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filter Buttons -->
      <div class="flex gap-2">
        <button (click)="statusFilter = 'ALL'" [class]="filterClass('ALL')">
          {{ lang.t('comparison.filter_all') }} ({{ result.totalRequirements }})
        </button>
        <button (click)="statusFilter = 'gaps'" [class]="filterClass('gaps')">
          {{ lang.t('comparison.filter_gaps') }} ({{ result.missingCount + result.partialCount }})
        </button>
      </div>

      <!-- Comparison Matrix -->
      <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden">
        <!-- Table Header -->
        <div class="grid grid-cols-12 gap-4 px-5 py-4 bg-slate-700/30 border-b border-slate-700/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <div class="col-span-3">{{ lang.t('comparison.th_requirement') }}</div>
          <div class="col-span-4">{{ lang.t('comparison.th_your_contract') }}</div>
          <div class="col-span-4">{{ lang.t('comparison.th_model_clause') }}</div>
          <div class="col-span-1 text-center">{{ lang.t('comparison.th_status') }}</div>
        </div>

        <!-- Rows -->
        @for (f of filteredFindings; track f.requirementId; let i = $index) {
          <!-- Main Row -->
          <div (click)="toggleRow(f.requirementId)"
               class="grid grid-cols-12 gap-4 px-5 py-4 border-b border-slate-700/30 cursor-pointer hover:bg-slate-700/20 transition-all"
               [class.bg-slate-700]="expandedRows.has(f.requirementId)">

            <!-- Requirement -->
            <div class="col-span-3">
              <div class="flex items-start gap-2">
                <svg class="w-4 h-4 mt-0.5 text-slate-500 transition-transform" [class.rotate-90]="expandedRows.has(f.requirementId)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
                <div>
                  <p class="text-sm font-medium text-white">{{ f.requirementId }}. {{ getRequirementName(f.requirementId) }}</p>
                  <p class="text-xs text-cyan-400/70 mt-0.5">{{ f.doraReference }}</p>
                </div>
              </div>
            </div>

            <!-- Your Contract Quote -->
            <div class="col-span-4">
              <p *ngIf="f.quote" class="text-sm text-slate-300 line-clamp-2">"{{ f.quote }}"</p>
              <p *ngIf="!f.quote" class="text-sm text-slate-600 italic">{{ lang.t('comparison.not_found') }}</p>
            </div>

            <!-- Model Clause -->
            <div class="col-span-4">
              <p class="text-sm text-cyan-300/80 line-clamp-2">{{ getModelClauseText(f.requirementId) }}</p>
            </div>

            <!-- Status -->
            <div class="col-span-1 flex justify-center items-start">
              <span [class]="statusBadge(f.status)" class="flex items-center gap-1">
                <svg *ngIf="f.status === 'found'" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <svg *ngIf="f.status === 'partial'" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                <svg *ngIf="f.status === 'missing'" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </span>
            </div>
          </div>

          <!-- Expanded Detail Row -->
          <div *ngIf="expandedRows.has(f.requirementId)"
               class="bg-slate-800/30 border-b border-slate-700/30 animate-fade-in">
            <div class="grid grid-cols-2 gap-6 p-6">
              <!-- Your Contract Full Text -->
              <div class="space-y-2">
                <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full" [class]="f.quote ? 'bg-slate-400' : 'bg-red-400'"></span>
                  {{ lang.t('comparison.your_text') }}
                </h4>
                <div class="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                  <p *ngIf="f.quote" class="text-sm text-slate-300 leading-relaxed">"{{ f.quote }}"</p>
                  <p *ngIf="!f.quote" class="text-sm text-slate-600 italic">{{ lang.t('comparison.clause_not_present') }}</p>
                </div>
                <p *ngIf="f.status !== 'found'" class="text-xs text-amber-400/80 mt-2">
                  {{ lang.currentLang === 'et' ? f.recommendationEt : f.recommendationEn }}
                </p>
              </div>

              <!-- Model Clause Full Text -->
              <div class="space-y-2">
                <h4 class="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
                  {{ lang.t('comparison.model_text') }}
                </h4>
                <div class="bg-cyan-950/30 rounded-lg p-4 border border-cyan-700/30">
                  <p class="text-sm text-cyan-200 leading-relaxed">{{ getModelClauseText(f.requirementId) }}</p>
                </div>
                <p class="text-xs text-slate-500 mt-2">
                  {{ lang.t('comparison.model_source') }}: DORA {{ f.doraReference }}
                </p>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Legend -->
      <div class="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
            <svg class="w-3 h-3 inline" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </span>
          {{ lang.t('comparison.legend_found') }}
        </div>
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
            <svg class="w-3 h-3 inline" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
          </span>
          {{ lang.t('comparison.legend_partial') }}
        </div>
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
            <svg class="w-3 h-3 inline" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </span>
          {{ lang.t('comparison.legend_missing') }}
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-3 justify-center pt-4">
        <button (click)="exportPdf()"
                class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            {{ lang.t('comparison.export_pdf') }}
          </span>
        </button>
        <a [routerLink]="['/contract-results', result.id]"
           class="px-6 py-2.5 rounded-xl bg-slate-700/50 border border-slate-600/50 text-slate-300 font-semibold text-sm hover:bg-slate-600/50 transition-all">
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            {{ lang.t('comparison.back_to_results') }}
          </span>
        </a>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fade-in 0.2s ease-out forwards;
    }
  `]
})
export class ContractComparisonComponent implements OnInit {
  result: ContractAnalysisResult | null = null;
  loading = true;
  error = '';
  statusFilter: 'ALL' | 'gaps' = 'ALL';
  expandedRows = new Set<number>();

  readonly circumference = 2 * Math.PI * 42;

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

  get filteredFindings(): ContractFinding[] {
    if (!this.result) return [];
    if (this.statusFilter === 'ALL') return this.result.findings;
    return this.result.findings.filter(f => f.status === 'missing' || f.status === 'partial');
  }

  toggleRow(requirementId: number): void {
    if (this.expandedRows.has(requirementId)) {
      this.expandedRows.delete(requirementId);
    } else {
      this.expandedRows.add(requirementId);
    }
  }

  getRequirementName(requirementId: number): string {
    const clause = getModelClause(requirementId);
    if (!clause) return '';
    return this.lang.currentLang === 'et' ? clause.nameEt : clause.nameEn;
  }

  getModelClauseText(requirementId: number): string {
    const clause = getModelClause(requirementId);
    if (!clause) return '';
    return this.lang.currentLang === 'et' ? clause.clauseEt : clause.clauseEn;
  }

  filterClass(filter: string): string {
    const base = 'px-4 py-2 rounded-xl text-sm font-medium transition-all';
    return filter === this.statusFilter
      ? base + ' bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
      : base + ' bg-slate-700/30 text-slate-400 border border-slate-600/30 hover:text-white';
  }

  statusBadge(status: string): string {
    switch (status) {
      case 'found': return 'px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400';
      case 'partial': return 'px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400';
      default: return 'px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400';
    }
  }

  exportPdf(): void {
    if (!this.result) return;
    const isEt = this.lang.currentLang === 'et';

    let html = `<!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <title>DORA Art. 30 ${isEt ? 'Lepingu võrdlus' : 'Contract Comparison'}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
        .header h1 { font-size: 24px; color: #0f172a; }
        .header .meta { color: #64748b; font-size: 14px; }
        .score { font-size: 36px; font-weight: bold; }
        .score.green { color: #10b981; }
        .score.yellow { color: #f59e0b; }
        .score.red { color: #ef4444; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; }
        td { padding: 16px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; vertical-align: top; }
        .req-name { font-weight: 600; color: #0f172a; }
        .req-ref { font-size: 11px; color: #06b6d4; margin-top: 4px; }
        .quote { color: #334155; }
        .model { color: #0891b2; background: #f0fdfa; padding: 8px; border-radius: 4px; }
        .status { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
        .status.found { background: #d1fae5; color: #065f46; }
        .status.partial { background: #fef3c7; color: #92400e; }
        .status.missing { background: #fee2e2; color: #991b1b; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
      </style>
    </head><body>`;

    const scoreClass = this.result.scorePercentage >= 80 ? 'green' : this.result.scorePercentage >= 50 ? 'yellow' : 'red';
    html += `<div class="header">
      <div>
        <h1>DORA Art. 30 ${isEt ? 'Lepingu vs mudeli võrdlus' : 'Contract vs Model Comparison'}</h1>
        <p class="meta">${this.result.companyName} &middot; ${this.result.contractName}</p>
      </div>
      <div class="score ${scoreClass}">${Math.round(this.result.scorePercentage)}%</div>
    </div>`;

    html += `<table>
      <thead><tr>
        <th style="width:25%">${isEt ? 'Nõue' : 'Requirement'}</th>
        <th style="width:30%">${isEt ? 'Teie leping' : 'Your Contract'}</th>
        <th style="width:35%">${isEt ? 'Mudelklausel' : 'Model Clause'}</th>
        <th style="width:10%">${isEt ? 'Staatus' : 'Status'}</th>
      </tr></thead><tbody>`;

    for (const f of this.result.findings) {
      const clause = getModelClause(f.requirementId);
      const modelText = clause ? (isEt ? clause.clauseEt : clause.clauseEn) : '';
      const statusLabel = f.status === 'found' ? (isEt ? 'LEITUD' : 'FOUND') :
                          f.status === 'partial' ? (isEt ? 'OSALINE' : 'PARTIAL') :
                          (isEt ? 'PUUDU' : 'MISSING');

      html += `<tr>
        <td>
          <div class="req-name">${f.requirementId}. ${isEt ? f.requirementEt : f.requirementEn}</div>
          <div class="req-ref">${f.doraReference}</div>
        </td>
        <td class="quote">${f.quote ? `"${f.quote}"` : (isEt ? '<em>Klauslit ei leitud</em>' : '<em>Clause not found</em>')}</td>
        <td><div class="model">${modelText}</div></td>
        <td><span class="status ${f.status}">${statusLabel}</span></td>
      </tr>`;
    }

    html += `</tbody></table>`;
    html += `<div class="footer">${isEt ? 'Genereeritud' : 'Generated'}: ${new Date().toLocaleDateString(isEt ? 'et-EE' : 'en-US')} &middot; DORA Compliance Checker</div>`;
    html += `</body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  }
}
