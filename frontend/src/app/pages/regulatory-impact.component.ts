import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';

interface RegulatoryImpactUpdate {
  id: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  affectedPillars: string[];
  publishedAt: string;
  source: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  impactSummary?: string;
  actionRequired?: string;
}

@Component({
  selector: 'app-regulatory-impact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            Regulatory Impact Analysis
          </h1>
          <p class="text-slate-400 text-sm mt-1">
            Track regulatory changes and their impact on your DORA compliance posture.
          </p>
        </div>

        <!-- Unacknowledged badge -->
        @if (unacknowledgedCount() > 0) {
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span class="text-sm font-medium text-amber-400">{{ unacknowledgedCount() }} unacknowledged</span>
          </div>
        }
      </div>

      <!-- Severity filters -->
      <div class="flex flex-wrap gap-2">
        <button (click)="filterSeverity.set('ALL')"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                [ngClass]="filterSeverity() === 'ALL'
                  ? 'bg-slate-600/50 text-white border border-slate-500/50'
                  : 'bg-slate-800/30 text-slate-400 border border-slate-200 hover:text-white'">
          All ({{ updates().length }})
        </button>
        <button (click)="filterSeverity.set('CRITICAL')"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                [ngClass]="filterSeverity() === 'CRITICAL'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-slate-800/30 text-slate-400 border border-slate-200 hover:text-red-400'">
          Critical ({{ countBySeverity('CRITICAL') }})
        </button>
        <button (click)="filterSeverity.set('HIGH')"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                [ngClass]="filterSeverity() === 'HIGH'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-slate-800/30 text-slate-400 border border-slate-200 hover:text-orange-400'">
          High ({{ countBySeverity('HIGH') }})
        </button>
        <button (click)="filterSeverity.set('MEDIUM')"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                [ngClass]="filterSeverity() === 'MEDIUM'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-800/30 text-slate-400 border border-slate-200 hover:text-amber-400'">
          Medium ({{ countBySeverity('MEDIUM') }})
        </button>
        <button (click)="filterSeverity.set('LOW')"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                [ngClass]="filterSeverity() === 'LOW'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-800/30 text-slate-400 border border-slate-200 hover:text-blue-400'">
          Low ({{ countBySeverity('LOW') }})
        </button>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="text-center py-16">
          <div class="w-10 h-10 mx-auto mb-3 rounded-full border-4 border-slate-700 border-t-orange-400 animate-spin"></div>
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && filteredUpdates().length === 0) {
        <div class="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <svg class="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          <p class="text-slate-400">No regulatory updates found for this filter.</p>
        </div>
      }

      <!-- Timeline -->
      @if (!loading() && filteredUpdates().length > 0) {
        <div class="relative">
          <!-- Timeline line -->
          <div class="absolute left-5 top-0 bottom-0 w-px bg-slate-700/50"></div>

          <div class="space-y-4">
            @for (update of filteredUpdates(); track update.id) {
              <div class="relative pl-14">
                <!-- Timeline dot -->
                <div class="absolute left-3 top-5 w-4 h-4 rounded-full border-2"
                     [ngClass]="severityDotClass(update.severity)">
                </div>

                <div class="rounded-xl border p-5 transition-all"
                     [ngClass]="update.acknowledged
                       ? 'bg-slate-800/30 border-slate-200 opacity-70'
                       : 'bg-white border-slate-200'">
                  <!-- Header row -->
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 flex-wrap mb-1">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                              [ngClass]="severityBadgeClass(update.severity)">
                          {{ update.severity }}
                        </span>
                        <h3 class="text-sm font-semibold text-white">{{ update.title }}</h3>
                      </div>
                      <p class="text-sm text-slate-400 leading-relaxed">{{ update.description }}</p>
                    </div>
                  </div>

                  <!-- Impact summary -->
                  @if (update.impactSummary) {
                    <div class="mt-3 bg-slate-900/30 rounded-lg p-3 border border-slate-200">
                      <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Impact Assessment</p>
                      <p class="text-xs text-slate-600">{{ update.impactSummary }}</p>
                    </div>
                  }

                  <!-- Action required -->
                  @if (update.actionRequired) {
                    <div class="mt-2 bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
                      <p class="text-[10px] text-amber-500 uppercase tracking-wider mb-1">Action Required</p>
                      <p class="text-xs text-amber-300/80">{{ update.actionRequired }}</p>
                    </div>
                  }

                  <!-- Affected pillars -->
                  @if (update.affectedPillars && update.affectedPillars.length > 0) {
                    <div class="mt-3 flex flex-wrap gap-1.5">
                      @for (pillar of update.affectedPillars; track pillar) {
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-700/40 text-slate-600 border border-slate-600/30">
                          {{ pillar }}
                        </span>
                      }
                    </div>
                  }

                  <!-- Footer -->
                  <div class="mt-3 flex items-center justify-between">
                    <div class="flex items-center gap-3 text-[10px] text-slate-500">
                      <span>{{ update.publishedAt | date:'dd.MM.yyyy' }}</span>
                      @if (update.source) {
                        <span>&middot; {{ update.source }}</span>
                      }
                      @if (update.acknowledged) {
                        <span class="text-blue-600 flex items-center gap-1">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                          </svg>
                          Acknowledged {{ update.acknowledgedAt | date:'dd.MM.yyyy' }}
                        </span>
                      }
                    </div>

                    @if (!update.acknowledged) {
                      <button (click)="acknowledge(update)"
                              class="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all">
                        Acknowledge
                      </button>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class RegulatoryImpactComponent implements OnInit {
  loading = signal(true);
  updates = signal<RegulatoryImpactUpdate[]>([]);
  filterSeverity = signal<string>('ALL');
  unacknowledgedCount = signal(0);

  filteredUpdates = computed(() => {
    const sev = this.filterSeverity();
    const all = this.updates();
    if (sev === 'ALL') return all;
    return all.filter(u => u.severity === sev);
  });

  constructor(private api: ApiService, public lang: LangService) {}

  ngOnInit() {
    this.loadUpdates();
    this.loadUnacknowledgedCount();
  }

  loadUpdates() {
    this.api.getRegulatoryImpactUpdates().subscribe({
      next: (updates) => {
        this.updates.set(updates);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadUnacknowledgedCount() {
    this.api.getUnacknowledgedCount().subscribe({
      next: (res) => this.unacknowledgedCount.set(res.count),
      error: () => {}
    });
  }

  countBySeverity(severity: string): number {
    return this.updates().filter(u => u.severity === severity).length;
  }

  acknowledge(update: RegulatoryImpactUpdate) {
    this.api.acknowledgeRegulatoryUpdate(update.id).subscribe({
      next: () => {
        update.acknowledged = true;
        update.acknowledgedAt = new Date().toISOString();
        this.unacknowledgedCount.set(Math.max(0, this.unacknowledgedCount() - 1));
      }
    });
  }

  severityDotClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'border-red-500 bg-red-500';
      case 'HIGH': return 'border-orange-500 bg-orange-500';
      case 'MEDIUM': return 'border-amber-500 bg-amber-500';
      case 'LOW': return 'border-blue-500 bg-blue-500';
      default: return 'border-slate-500 bg-slate-500';
    }
  }

  severityBadgeClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-400';
      case 'LOW': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  }
}
