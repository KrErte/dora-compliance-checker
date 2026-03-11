import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LangService } from '../lang.service';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-regulatory-radar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="max-w-7xl mx-auto space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          {{ lang.t('radar.badge') }}
        </div>
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">{{ lang.t('radar.title') }}</h1>
        <p class="text-slate-400 max-w-2xl mx-auto">{{ lang.t('radar.subtitle') }}</p>
      </div>

      <!-- Summary Stats -->
      @if (data()) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-white">{{ data()!.totalCount }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('radar.total_updates') }}</div>
          </div>
          <div class="bg-slate-800/50 border border-red-500/30 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-red-400">{{ data()!.criticalCount }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('radar.critical') }}</div>
          </div>
          <div class="bg-slate-800/50 border border-orange-500/30 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-orange-400">{{ data()!.highCount }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('radar.high') }}</div>
          </div>
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-blue-400">{{ data()!.totalPages }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('radar.pages') }}</div>
          </div>
        </div>
      }

      <!-- Filters -->
      <div class="flex flex-wrap gap-3">
        <select [(ngModel)]="filterSeverity" (ngModelChange)="loadData()"
                class="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50">
          <option value="">{{ lang.t('radar.all_severity') }}</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
          <option value="INFO">Info</option>
        </select>
        <select [(ngModel)]="filterRegulation" (ngModelChange)="loadData()"
                class="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50">
          <option value="">{{ lang.t('radar.all_regulations') }}</option>
          <option value="DORA">DORA</option>
          <option value="NIS2">NIS2</option>
          <option value="GDPR">GDPR</option>
          <option value="MiCA">MiCA</option>
        </select>
      </div>

      <!-- Timeline Feed -->
      @if (loading()) {
        <div class="text-center py-12">
          <svg class="w-8 h-8 animate-spin text-blue-400 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      } @else if (items().length === 0) {
        <div class="text-center py-12 text-slate-500">{{ lang.t('radar.no_updates') }}</div>
      } @else {
        <div class="space-y-4">
          @for (item of items(); track item.id) {
            <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-blue-500/30 transition-colors cursor-pointer"
                 (click)="toggleExpand(item.id)">
              <div class="flex items-start gap-4">
                <!-- Severity badge -->
                <div class="flex-shrink-0">
                  <span class="px-2.5 py-1 rounded-lg text-xs font-medium"
                        [class]="getSeverityClass(item.severity)">
                    {{ item.severity }}
                  </span>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-white font-semibold text-sm mb-1 line-clamp-2">{{ item.title }}</h3>
                  <p class="text-slate-400 text-xs mb-2 line-clamp-2">{{ item.summary }}</p>
                  <div class="flex flex-wrap items-center gap-2 text-xs">
                    @if (item.publishedDate) {
                      <span class="text-slate-500">{{ item.publishedDate }}</span>
                    }
                    @if (item.source) {
                      <span class="px-2 py-0.5 rounded bg-slate-700/50 text-slate-400">{{ item.source }}</span>
                    }
                    @if (item.affectedContractCount > 0) {
                      <span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">{{ item.affectedContractCount }} {{ lang.t('radar.contracts') }}</span>
                    }
                    @if (item.affectedProviderCount > 0) {
                      <span class="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400">{{ item.affectedProviderCount }} {{ lang.t('radar.providers') }}</span>
                    }
                    <!-- Pillar chips -->
                    @if (item.affectedArticles) {
                      <span class="px-2 py-0.5 rounded bg-violet-500/10 text-violet-400">{{ item.affectedArticles }}</span>
                    }
                  </div>
                </div>
              </div>

              <!-- Expanded -->
              @if (expandedId() === item.id) {
                <div class="mt-4 pt-4 border-t border-slate-700/50 space-y-3">
                  @if (item.impactAnalysis) {
                    <div>
                      <div class="text-xs font-medium text-slate-300 mb-1">{{ lang.t('radar.impact_analysis') }}</div>
                      <p class="text-sm text-slate-400">{{ item.impactAnalysis }}</p>
                    </div>
                  }
                  @if (item.url) {
                    <a [href]="item.url" target="_blank" rel="noopener"
                       class="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300">
                      {{ lang.t('radar.read_more') }}
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                      </svg>
                    </a>
                  }
                  <button (click)="viewImpact(item.id); $event.stopPropagation()"
                          class="px-4 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors">
                    {{ lang.t('radar.view_impact') }}
                  </button>
                </div>
              }
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (data() && data()!.totalPages > 1) {
          <div class="flex justify-center gap-2">
            <button (click)="loadPage(currentPage - 1)" [disabled]="currentPage === 0"
                    class="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 text-sm disabled:opacity-30">
              {{ lang.t('radar.prev') }}
            </button>
            <span class="px-4 py-2 text-slate-400 text-sm">{{ currentPage + 1 }} / {{ data()!.totalPages }}</span>
            <button (click)="loadPage(currentPage + 1)" [disabled]="currentPage >= data()!.totalPages - 1"
                    class="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 text-sm disabled:opacity-30">
              {{ lang.t('radar.next') }}
            </button>
          </div>
        }
      }

      <!-- Impact Modal -->
      @if (impactData()) {
        <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" (click)="impactData.set(null)">
          <div class="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-white">{{ lang.t('radar.impact_title') }}</h2>
              <button (click)="impactData.set(null)" class="text-slate-400 hover:text-white">&times;</button>
            </div>
            @if (impactData()!.affectedContracts?.length > 0) {
              <h3 class="text-sm font-medium text-slate-300 mb-2">{{ lang.t('radar.affected_contracts') }}</h3>
              <div class="space-y-2 mb-4">
                @for (c of impactData()!.affectedContracts; track c.id) {
                  <div class="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div class="text-sm text-white">{{ c.companyName }}</div>
                      <div class="text-xs text-slate-400">{{ c.contractName }}</div>
                    </div>
                    <span class="px-2 py-0.5 rounded text-xs" [class]="c.currentLevel === 'GREEN' ? 'bg-emerald-500/10 text-emerald-400' : c.currentLevel === 'YELLOW' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'">
                      {{ c.currentLevel }}
                    </span>
                  </div>
                }
              </div>
            }
            @if (impactData()!.affectedProviders?.length > 0) {
              <h3 class="text-sm font-medium text-slate-300 mb-2">{{ lang.t('radar.affected_providers') }}</h3>
              <div class="space-y-2">
                @for (p of impactData()!.affectedProviders; track p.id) {
                  <div class="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div class="text-sm text-white">{{ p.providerName }}</div>
                      <div class="text-xs text-slate-400">{{ p.serviceType }}</div>
                    </div>
                    @if (p.criticality) {
                      <span class="px-2 py-0.5 rounded text-xs" [class]="p.criticality === 'CRITICAL' ? 'bg-red-500/10 text-red-400' : 'bg-slate-700 text-slate-400'">
                        {{ p.criticality }}
                      </span>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class RegulatoryRadarComponent implements OnInit {
  data = signal<any>(null);
  items = signal<any[]>([]);
  loading = signal(false);
  expandedId = signal<string | null>(null);
  impactData = signal<any>(null);
  filterSeverity = '';
  filterRegulation = '';
  currentPage = 0;

  constructor(public lang: LangService, private api: ApiService) {}

  ngOnInit() { this.loadData(); }

  loadData() {
    this.currentPage = 0;
    this.loadPage(0);
  }

  loadPage(page: number) {
    if (page < 0) return;
    this.loading.set(true);
    this.currentPage = page;
    this.api.getRegulatoryRadar(this.filterSeverity, this.filterRegulation, page).subscribe({
      next: (res: any) => {
        this.data.set(res);
        this.items.set(res.items || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  toggleExpand(id: string) {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  viewImpact(id: string) {
    this.api.getRegulatoryRadarImpact(id).subscribe({
      next: (res: any) => this.impactData.set(res)
    });
  }

  getSeverityClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/10 border border-red-500/30 text-red-400';
      case 'HIGH': return 'bg-orange-500/10 border border-orange-500/30 text-orange-400';
      case 'MEDIUM': return 'bg-amber-500/10 border border-amber-500/30 text-amber-400';
      case 'LOW': return 'bg-blue-500/10 border border-blue-500/30 text-blue-400';
      default: return 'bg-slate-700/50 border border-slate-600/30 text-slate-400';
    }
  }
}
