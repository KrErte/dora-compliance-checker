import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';
import { SubscriptionService } from '../services/subscription.service';
import { AutopilotInsight, AutopilotCounts } from '../models';

@Component({
  selector: 'app-autopilot',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        <!-- Header -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h1 class="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                {{ lang.t('autopilot.title') }}
              </h1>
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 animate-pulse">AI</span>
            </div>
            <p class="text-sm text-slate-400 max-w-xl">{{ lang.t('autopilot.subtitle') }}</p>
          </div>
          @if (sub.isPremium()) {
            <div class="flex gap-2">
              <button (click)="generateComplianceReport()" [disabled]="generatingReport()"
                class="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2
                       bg-white border border-violet-500/30 text-violet-300 hover:border-violet-500/50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed">
                @if (generatingReport()) {
                  <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>
                  {{ lang.t('dashboard.generating_report') }}
                } @else {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  {{ lang.t('dashboard.generate_report') }}
                }
              </button>
              <button (click)="triggerScan()" [disabled]="scanning()"
                class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2"
                [class]="scanning() ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40'">
                @if (scanning()) {
                  <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>
                  {{ lang.t('autopilot.scanning') }}
                } @else {
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  {{ lang.t('autopilot.scan_now') }}
                }
              </button>
            </div>
          }
        </div>

        <!-- Premium Gate -->
        @if (!sub.isPremium()) {
          <div class="bg-white backdrop-blur border border-slate-200 rounded-2xl p-8 text-center">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <h2 class="text-xl font-bold text-white mb-2">{{ lang.t('autopilot.premium_title') }}</h2>
            <p class="text-slate-400 text-sm mb-6 max-w-md mx-auto">{{ lang.t('autopilot.premium_desc') }}</p>
            <a routerLink="/pricing" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-500/20">
              {{ lang.t('autopilot.upgrade') }}
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
          </div>
        } @else {

          <!-- KPI Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-white backdrop-blur border border-slate-200 rounded-xl p-4">
              <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">{{ lang.t('autopilot.kpi_new') }}</p>
              <p class="text-2xl font-bold text-violet-400">{{ counts()?.new || 0 }}</p>
            </div>
            <div class="bg-white backdrop-blur border border-slate-200 rounded-xl p-4">
              <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">{{ lang.t('autopilot.kpi_critical') }}</p>
              <p class="text-2xl font-bold text-red-400">{{ counts()?.critical || 0 }}</p>
            </div>
            <div class="bg-white backdrop-blur border border-slate-200 rounded-xl p-4">
              <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">{{ lang.t('autopilot.kpi_accepted') }}</p>
              <p class="text-2xl font-bold text-blue-600">{{ counts()?.accepted || 0 }}</p>
            </div>
            <div class="bg-white backdrop-blur border border-slate-200 rounded-xl p-4">
              <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">{{ lang.t('autopilot.kpi_total') }}</p>
              <p class="text-2xl font-bold text-slate-600">{{ counts()?.total || 0 }}</p>
            </div>
          </div>

          <!-- Filter Bar -->
          <div class="flex flex-wrap items-center gap-2 mb-6">
            <div class="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
              @for (sev of severityFilters; track sev.value) {
                <button (click)="activeSeverity.set(sev.value)"
                  class="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
                  [class]="activeSeverity() === sev.value ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'">
                  {{ sev.label }}
                </button>
              }
            </div>
            <div class="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
              <button (click)="showDismissed.set(false)"
                class="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
                [class]="!showDismissed() ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'">
                {{ lang.t('autopilot.filter_active') }}
              </button>
              <button (click)="showDismissed.set(true)"
                class="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
                [class]="showDismissed() ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'">
                {{ lang.t('autopilot.filter_dismissed') }}
              </button>
            </div>
          </div>

          <!-- Loading -->
          @if (loading()) {
            <div class="flex items-center justify-center py-16">
              <svg class="w-8 h-8 animate-spin text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>
            </div>
          }

          <!-- Error -->
          @if (error()) {
            <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center text-red-400 text-sm mb-6">
              {{ error() }}
            </div>
          }

          <!-- Insight Cards -->
          @if (!loading() && filteredInsights().length > 0) {
            <div class="space-y-3">
              @for (insight of filteredInsights(); track insight.id) {
                <div class="bg-white backdrop-blur border border-slate-200 rounded-xl overflow-hidden hover:border-slate-200 transition-colors">
                  <div class="flex">
                    <!-- Severity Bar -->
                    <div class="w-1.5 shrink-0" [class]="getSeverityBarClass(insight.severity)"></div>

                    <div class="flex-1 p-4 sm:p-5">
                      <div class="flex items-start justify-between gap-3">
                        <div class="flex-1 min-w-0">
                          <!-- Type + Severity -->
                          <div class="flex items-center gap-2 mb-1.5">
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider"
                              [class]="getSeverityBadgeClass(insight.severity)">
                              {{ insight.severity }}
                            </span>
                            <span class="text-[10px] text-slate-500 uppercase tracking-wider">{{ getTypeLabel(insight.insightType) }}</span>
                            @if (insight.status === 'NEW') {
                              <span class="w-2 h-2 rounded-full bg-violet-400 animate-pulse"></span>
                            }
                          </div>

                          <!-- Title -->
                          <h3 class="text-sm font-semibold text-white mb-1">{{ insight.title }}</h3>

                          <!-- Description -->
                          <p class="text-xs text-slate-400 mb-2 line-clamp-2">{{ insight.description }}</p>

                          <!-- Recommended Action -->
                          <div class="flex items-center gap-1.5 text-xs text-violet-400">
                            <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                            </svg>
                            {{ insight.recommendedAction }}
                          </div>
                        </div>

                        <!-- Actions -->
                        <div class="flex flex-col gap-1.5 shrink-0">
                          @if (insight.status !== 'DISMISSED') {
                            @if (insight.actionLink) {
                              <a [routerLink]="insight.actionLink"
                                class="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 border border-violet-500/20 transition-colors text-center whitespace-nowrap">
                                {{ lang.t('autopilot.take_action') }}
                              </a>
                            }
                            @if (insight.status === 'NEW') {
                              <button (click)="accept(insight.id)"
                                class="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-blue-700/20 text-blue-600 hover:bg-blue-700/30 border border-blue-200 transition-colors whitespace-nowrap">
                                {{ lang.t('autopilot.accept') }}
                              </button>
                            }
                            <button (click)="dismiss(insight.id)"
                              class="px-3 py-1.5 text-[11px] rounded-lg text-slate-500 hover:text-slate-600 hover:bg-slate-100 transition-colors whitespace-nowrap">
                              {{ lang.t('autopilot.dismiss') }}
                            </button>
                            <button (click)="snooze(insight.id)"
                              class="px-3 py-1.5 text-[11px] rounded-lg text-slate-500 hover:text-slate-600 hover:bg-slate-100 transition-colors whitespace-nowrap">
                              {{ lang.t('autopilot.snooze') }}
                            </button>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Empty State -->
          @if (!loading() && filteredInsights().length === 0 && !error()) {
            <div class="bg-white backdrop-blur border border-slate-200 rounded-2xl p-12 text-center">
              <div class="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h3 class="text-lg font-bold text-white mb-1">{{ lang.t('autopilot.empty_title') }}</h3>
              <p class="text-sm text-slate-400">{{ lang.t('autopilot.empty_desc') }}</p>
            </div>
          }
        }
      </div>
    </div>
  `
})
export class AutopilotComponent implements OnInit {
  lang = inject(LangService);
  sub = inject(SubscriptionService);
  private api = inject(ApiService);

  insights = signal<AutopilotInsight[]>([]);
  counts = signal<AutopilotCounts | null>(null);
  loading = signal(true);
  scanning = signal(false);
  generatingReport = signal(false);
  error = signal('');

  activeSeverity = signal('');
  showDismissed = signal(false);

  severityFilters = [
    { value: '', label: 'All' },
    { value: 'CRITICAL', label: 'Critical' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' },
  ];

  filteredInsights = computed(() => {
    let list = this.insights();
    const sev = this.activeSeverity();
    const dismissed = this.showDismissed();

    if (dismissed) {
      list = list.filter(i => i.status === 'DISMISSED' || i.status === 'SNOOZED');
    } else {
      list = list.filter(i => i.status === 'NEW' || i.status === 'ACCEPTED');
    }
    if (sev) {
      list = list.filter(i => i.severity === sev);
    }

    // Sort: CRITICAL first, then HIGH, MEDIUM, LOW
    const order: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return [...list].sort((a, b) => (order[a.severity] ?? 4) - (order[b.severity] ?? 4));
  });

  ngOnInit() {
    if (this.sub.isPremium()) {
      this.loadData();
    } else {
      this.loading.set(false);
    }
  }

  private loadData() {
    this.loading.set(true);
    this.api.getAutopilotInsights().subscribe({
      next: data => {
        this.insights.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load insights');
        this.loading.set(false);
      }
    });
    this.api.getAutopilotCounts().subscribe({
      next: data => this.counts.set(data)
    });
  }

  triggerScan() {
    this.scanning.set(true);
    this.error.set('');
    this.api.triggerAutopilotScan().subscribe({
      next: data => {
        this.insights.set(data);
        this.scanning.set(false);
        this.api.getAutopilotCounts().subscribe({ next: c => this.counts.set(c) });
      },
      error: (err) => {
        this.scanning.set(false);
        this.error.set(err?.error?.error || 'Scan failed');
      }
    });
  }

  accept(id: string) {
    this.api.acceptAutopilotInsight(id).subscribe({
      next: updated => {
        this.insights.update(list => list.map(i => i.id === id ? updated : i));
        this.api.getAutopilotCounts().subscribe({ next: c => this.counts.set(c) });
      }
    });
  }

  dismiss(id: string) {
    this.api.dismissAutopilotInsight(id).subscribe({
      next: updated => {
        this.insights.update(list => list.map(i => i.id === id ? updated : i));
        this.api.getAutopilotCounts().subscribe({ next: c => this.counts.set(c) });
      }
    });
  }

  snooze(id: string) {
    this.api.snoozeAutopilotInsight(id, 7).subscribe({
      next: updated => {
        this.insights.update(list => list.map(i => i.id === id ? updated : i));
        this.api.getAutopilotCounts().subscribe({ next: c => this.counts.set(c) });
      }
    });
  }

  generateComplianceReport() {
    this.generatingReport.set(true);
    this.api.exportComplianceReport(this.lang.lang()).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dora-compliance-report.pdf';
        a.click();
        URL.revokeObjectURL(url);
        this.generatingReport.set(false);
      },
      error: () => {
        this.generatingReport.set(false);
      }
    });
  }

  getSeverityBarClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-amber-500';
      case 'LOW': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  }

  getSeverityBadgeClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'LOW': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      EVIDENCE_GAP: 'Evidence Gap',
      ASSESSMENT_DUE: 'Assessment Due',
      REMEDIATION_OVERDUE: 'Remediation Overdue',
      SCORE_DROP: 'Score Drop',
      ARTICLE_RISK: 'Article Risk',
      EXPIRING_EVIDENCE: 'Expiring Evidence',
      QUICK_WIN: 'Quick Win',
      TRAINING_GAP: 'Training Gap',
    };
    return labels[type] || type;
  }
}
