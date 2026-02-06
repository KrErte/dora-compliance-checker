import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LangService } from '../lang.service';

interface ActionItem {
  id: string;
  domainCode: string;
  domainNameEn: string;
  domainNameEt: string;
  titleEn: string;
  titleEt: string;
  priority: string;
  phase: string;
  reference: string;
  estimatedDays: number;
}

interface ActionPlan {
  regulationCode: string;
  overallScore: number;
  riskLevel: string;
  immediate: ActionItem[];
  shortTerm: ActionItem[];
  mediumTerm: ActionItem[];
  totalEstimatedDays: number;
}

interface DomainScore {
  domainId: string;
  domainCode: string;
  nameEn: string;
  nameEt: string;
  score: number;
  answeredQuestions: number;
  totalQuestions: number;
}

interface AssessmentResult {
  regulationCode: string;
  overallScore: number;
  riskLevel: string;
  domainScores: DomainScore[];
  answeredQuestions: number;
  totalQuestions: number;
  actionPlan: ActionPlan;
}

@Component({
  selector: 'app-nis2-results',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-5xl mx-auto" *ngIf="result">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8 animate-fade-in">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center"
               [class]="getScoreBgClass(result.overallScore)">
            <span class="text-2xl font-bold" [class]="getScoreTextClass(result.overallScore)">
              {{ result.overallScore | number:'1.0-0' }}
            </span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-100">{{ lang.t('nis2_results.title') }}</h1>
            <p class="text-sm" [class]="getScoreTextClass(result.overallScore)">
              {{ lang.t('nis2_assess.risk_' + result.riskLevel.toLowerCase()) }}
            </p>
          </div>
        </div>
        <button type="button" (click)="exportPdf()"
                class="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          {{ lang.t('nis2_results.export_pdf') }}
        </button>
      </div>

      <!-- Domain scores (radar-like visualization) -->
      <div class="glass-card p-6 mb-8 animate-fade-in-up">
        <h2 class="text-lg font-semibold text-slate-200 mb-4">{{ lang.t('nis2_results.domain_scores') }}</h2>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div *ngFor="let domain of result.domainScores"
               class="p-3 rounded-xl border transition-all hover:scale-105"
               [class]="domain.score >= 80 ? 'bg-emerald-500/10 border-emerald-500/30' :
                        domain.score >= 60 ? 'bg-amber-500/10 border-amber-500/30' :
                        domain.score >= 40 ? 'bg-orange-500/10 border-orange-500/30' :
                        'bg-red-500/10 border-red-500/30'">
            <div class="text-center">
              <div class="text-2xl font-bold mb-1"
                   [class]="domain.score >= 80 ? 'text-emerald-400' :
                            domain.score >= 60 ? 'text-amber-400' :
                            domain.score >= 40 ? 'text-orange-400' : 'text-red-400'">
                {{ domain.score | number:'1.0-0' }}
              </div>
              <div class="text-xs text-slate-400 line-clamp-2">
                {{ lang.currentLang === 'et' ? domain.nameEt : domain.nameEn }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Plan -->
      <div class="mb-8 animate-fade-in-up delay-100">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-slate-100">{{ lang.t('nis2_results.action_plan') }}</h2>
          <div class="text-sm text-slate-400">
            {{ lang.t('nis2_results.total_effort') }}: <span class="text-amber-400 font-medium">~{{ result.actionPlan.totalEstimatedDays }} {{ lang.t('nis2_results.days') }}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Immediate (0-3 months) -->
          <div class="glass-card p-4">
            <div class="flex items-center gap-2 mb-4 pb-3 border-b border-red-500/20">
              <div class="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-red-400">{{ lang.t('nis2_results.immediate') }}</h3>
                <p class="text-xs text-slate-500">0-3 {{ lang.t('nis2_results.months') }}</p>
              </div>
              <span class="ml-auto px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">
                {{ result.actionPlan.immediate.length }}
              </span>
            </div>
            <div class="space-y-2 max-h-80 overflow-y-auto">
              <div *ngFor="let action of result.actionPlan.immediate"
                   class="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-red-500/30 transition-colors">
                <div class="flex items-start gap-2">
                  <span [class]="getPriorityBadgeClass(action.priority)">
                    {{ action.priority }}
                  </span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-slate-200">
                      {{ lang.currentLang === 'et' ? action.titleEt : action.titleEn }}
                    </p>
                    <p class="text-xs text-slate-500 mt-1">
                      {{ lang.currentLang === 'et' ? action.domainNameEt : action.domainNameEn }}
                    </p>
                    <div class="flex items-center gap-2 mt-2 text-xs text-slate-600">
                      <span>{{ action.reference }}</span>
                      <span>&middot;</span>
                      <span>~{{ action.estimatedDays }}d</span>
                    </div>
                  </div>
                </div>
              </div>
              <div *ngIf="result.actionPlan.immediate.length === 0" class="text-center py-6 text-slate-500 text-sm">
                {{ lang.t('nis2_results.no_actions') }}
              </div>
            </div>
          </div>

          <!-- Short-term (3-6 months) -->
          <div class="glass-card p-4">
            <div class="flex items-center gap-2 mb-4 pb-3 border-b border-amber-500/20">
              <div class="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-amber-400">{{ lang.t('nis2_results.short_term') }}</h3>
                <p class="text-xs text-slate-500">3-6 {{ lang.t('nis2_results.months') }}</p>
              </div>
              <span class="ml-auto px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400">
                {{ result.actionPlan.shortTerm.length }}
              </span>
            </div>
            <div class="space-y-2 max-h-80 overflow-y-auto">
              <div *ngFor="let action of result.actionPlan.shortTerm"
                   class="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-amber-500/30 transition-colors">
                <div class="flex items-start gap-2">
                  <span [class]="getPriorityBadgeClass(action.priority)">
                    {{ action.priority }}
                  </span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-slate-200">
                      {{ lang.currentLang === 'et' ? action.titleEt : action.titleEn }}
                    </p>
                    <p class="text-xs text-slate-500 mt-1">
                      {{ lang.currentLang === 'et' ? action.domainNameEt : action.domainNameEn }}
                    </p>
                    <div class="flex items-center gap-2 mt-2 text-xs text-slate-600">
                      <span>{{ action.reference }}</span>
                      <span>&middot;</span>
                      <span>~{{ action.estimatedDays }}d</span>
                    </div>
                  </div>
                </div>
              </div>
              <div *ngIf="result.actionPlan.shortTerm.length === 0" class="text-center py-6 text-slate-500 text-sm">
                {{ lang.t('nis2_results.no_actions') }}
              </div>
            </div>
          </div>

          <!-- Medium-term (6-12 months) -->
          <div class="glass-card p-4">
            <div class="flex items-center gap-2 mb-4 pb-3 border-b border-emerald-500/20">
              <div class="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-emerald-400">{{ lang.t('nis2_results.medium_term') }}</h3>
                <p class="text-xs text-slate-500">6-12 {{ lang.t('nis2_results.months') }}</p>
              </div>
              <span class="ml-auto px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
                {{ result.actionPlan.mediumTerm.length }}
              </span>
            </div>
            <div class="space-y-2 max-h-80 overflow-y-auto">
              <div *ngFor="let action of result.actionPlan.mediumTerm"
                   class="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 transition-colors">
                <div class="flex items-start gap-2">
                  <span [class]="getPriorityBadgeClass(action.priority)">
                    {{ action.priority }}
                  </span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-slate-200">
                      {{ lang.currentLang === 'et' ? action.titleEt : action.titleEn }}
                    </p>
                    <p class="text-xs text-slate-500 mt-1">
                      {{ lang.currentLang === 'et' ? action.domainNameEt : action.domainNameEn }}
                    </p>
                    <div class="flex items-center gap-2 mt-2 text-xs text-slate-600">
                      <span>{{ action.reference }}</span>
                      <span>&middot;</span>
                      <span>~{{ action.estimatedDays }}d</span>
                    </div>
                  </div>
                </div>
              </div>
              <div *ngIf="result.actionPlan.mediumTerm.length === 0" class="text-center py-6 text-slate-500 text-sm">
                {{ lang.t('nis2_results.no_actions') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Estonian references -->
      <div class="glass-card p-6 animate-fade-in-up delay-200">
        <h2 class="text-lg font-semibold text-slate-200 mb-4">{{ lang.t('nis2_results.references') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="https://www.ria.ee/kuberturvalisus/kuberturvalisuse-seadus" target="_blank"
             class="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-amber-500/30 transition-all group">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <span class="text-lg">&#128220;</span>
              </div>
              <div>
                <p class="font-medium text-slate-200 group-hover:text-amber-400 transition-colors">KüTS</p>
                <p class="text-xs text-slate-500">{{ lang.t('nis2_results.ref_kyts') }}</p>
              </div>
            </div>
          </a>
          <a href="https://eits.ria.ee/" target="_blank"
             class="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30 transition-all group">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
                <span class="text-lg">&#128736;</span>
              </div>
              <div>
                <p class="font-medium text-slate-200 group-hover:text-cyan-400 transition-colors">E-ITS</p>
                <p class="text-xs text-slate-500">{{ lang.t('nis2_results.ref_eits') }}</p>
              </div>
            </div>
          </a>
          <a href="https://www.cert.ee/" target="_blank"
             class="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 transition-all group">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                <span class="text-lg">&#128737;</span>
              </div>
              <div>
                <p class="font-medium text-slate-200 group-hover:text-emerald-400 transition-colors">CERT-EE</p>
                <p class="text-xs text-slate-500">{{ lang.t('nis2_results.ref_cert') }}</p>
              </div>
            </div>
          </a>
        </div>
      </div>

      <!-- Back button -->
      <div class="mt-8 text-center">
        <button type="button" (click)="goBack()"
                class="px-6 py-2 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-colors">
          {{ lang.t('nis2_results.back') }}
        </button>
      </div>
    </div>

    <!-- No result -->
    <div *ngIf="!result" class="text-center py-16">
      <p class="text-slate-400 mb-4">{{ lang.t('nis2_results.no_result') }}</p>
      <button type="button" (click)="goBack()"
              class="px-6 py-2 rounded-lg text-sm font-medium bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors">
        {{ lang.t('nis2_results.start_assessment') }}
      </button>
    </div>
  `
})
export class Nis2ResultsComponent implements OnInit {
  result: AssessmentResult | null = null;

  constructor(
    private router: Router,
    public lang: LangService
  ) {}

  ngOnInit() {
    // Load result from sessionStorage (set by assessment component)
    const stored = sessionStorage.getItem('nis2_result');
    if (stored) {
      this.result = JSON.parse(stored);
    }
  }

  getScoreBgClass(score: number): string {
    if (score >= 80) return 'bg-emerald-500/20';
    if (score >= 60) return 'bg-amber-500/20';
    if (score >= 40) return 'bg-orange-500/20';
    return 'bg-red-500/20';
  }

  getScoreTextClass(score: number): string {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'CRITICAL':
        return 'px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/20 text-red-400 shrink-0';
      case 'HIGH':
        return 'px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-500/20 text-orange-400 shrink-0';
      default:
        return 'px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400 shrink-0';
    }
  }

  exportPdf() {
    // Generate PDF using browser print
    const printContent = this.generatePrintContent();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  }

  private generatePrintContent(): string {
    if (!this.result) return '';
    const r = this.result;
    const isEt = this.lang.currentLang === 'et';

    const actionRows = (items: ActionItem[], phase: string) => items.map(a => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${phase}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${a.priority}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${isEt ? a.titleEt : a.titleEn}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${isEt ? a.domainNameEt : a.domainNameEn}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${a.reference}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${a.estimatedDays}d</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>NIS2 ${isEt ? 'Vastavushindamise tulemused' : 'Compliance Assessment Results'}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #1f2937; }
          h1 { color: #f59e0b; margin-bottom: 8px; }
          h2 { color: #374151; margin-top: 32px; }
          .score { font-size: 48px; font-weight: bold; color: ${r.overallScore >= 80 ? '#10b981' : r.overallScore >= 60 ? '#f59e0b' : '#ef4444'}; }
          .risk { color: ${r.overallScore >= 80 ? '#10b981' : r.overallScore >= 60 ? '#f59e0b' : '#ef4444'}; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #f3f4f6; padding: 12px 8px; text-align: left; font-size: 12px; }
          .domains { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-top: 16px; }
          .domain { padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <h1>NIS2 ${isEt ? 'Vastavushindamine' : 'Compliance Assessment'}</h1>
        <p style="color: #6b7280;">${new Date().toLocaleDateString(isEt ? 'et-EE' : 'en-GB')}</p>

        <div style="margin: 24px 0;">
          <span class="score">${Math.round(r.overallScore)}</span>
          <span style="font-size: 24px; color: #9ca3af;">/100</span>
          <p class="risk" style="font-size: 18px; margin-top: 8px;">
            ${isEt ? (r.riskLevel === 'LOW' ? 'Madal risk' : r.riskLevel === 'MEDIUM' ? 'Keskmine risk' : r.riskLevel === 'HIGH' ? 'Kõrge risk' : 'Kriitiline risk')
                   : (r.riskLevel === 'LOW' ? 'Low Risk' : r.riskLevel === 'MEDIUM' ? 'Medium Risk' : r.riskLevel === 'HIGH' ? 'High Risk' : 'Critical Risk')}
          </p>
        </div>

        <h2>${isEt ? 'Domeenide skoorid' : 'Domain Scores'}</h2>
        <div class="domains">
          ${r.domainScores.map(d => `
            <div class="domain">
              <div style="font-size: 24px; font-weight: bold; color: ${d.score >= 80 ? '#10b981' : d.score >= 60 ? '#f59e0b' : '#ef4444'};">${Math.round(d.score)}</div>
              <div style="font-size: 11px; color: #6b7280;">${isEt ? d.nameEt : d.nameEn}</div>
            </div>
          `).join('')}
        </div>

        <h2>${isEt ? 'Tegevuskava' : 'Action Plan'}</h2>
        <p style="color: #6b7280;">${isEt ? 'Hinnanguline koguaeg' : 'Estimated total effort'}: ~${r.actionPlan.totalEstimatedDays} ${isEt ? 'päeva' : 'days'}</p>
        <table>
          <thead>
            <tr>
              <th>${isEt ? 'Faas' : 'Phase'}</th>
              <th>${isEt ? 'Prioriteet' : 'Priority'}</th>
              <th>${isEt ? 'Tegevus' : 'Action'}</th>
              <th>${isEt ? 'Domeen' : 'Domain'}</th>
              <th>${isEt ? 'Viide' : 'Reference'}</th>
              <th style="text-align: right;">${isEt ? 'Aeg' : 'Est.'}</th>
            </tr>
          </thead>
          <tbody>
            ${actionRows(r.actionPlan.immediate, isEt ? 'Koheselt' : 'Immediate')}
            ${actionRows(r.actionPlan.shortTerm, isEt ? 'Lühiajaline' : 'Short-term')}
            ${actionRows(r.actionPlan.mediumTerm, isEt ? 'Keskpikk' : 'Medium-term')}
          </tbody>
        </table>

        <div class="footer">
          <p><strong>${isEt ? 'Viited' : 'References'}:</strong></p>
          <p>KüTS - ${isEt ? 'Küberturvalisuse seadus' : 'Cybersecurity Act'} (ria.ee)</p>
          <p>E-ITS - ${isEt ? 'Eesti infoturbestandard' : 'Estonian Information Security Standard'} (eits.ria.ee)</p>
          <p>CERT-EE - ${isEt ? 'Riigi Infosüsteemi Amet' : 'Information System Authority'} (cert.ee)</p>
          <p style="margin-top: 16px;">Generated by ComplianceHub</p>
        </div>
      </body>
      </html>
    `;
  }

  goBack() {
    this.router.navigate(['/nis2/assessment']);
  }
}
