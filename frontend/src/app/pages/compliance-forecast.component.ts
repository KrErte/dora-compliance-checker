import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-compliance-forecast',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-medium mb-4">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
          </svg>
          {{ lang.t('forecast.badge') }}
        </div>
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">{{ lang.t('forecast.title') }}</h1>
        <p class="text-slate-400 max-w-2xl mx-auto">{{ lang.t('forecast.subtitle') }}</p>
      </div>

      @if (loading()) {
        <div class="text-center py-12">
          <svg class="w-8 h-8 animate-spin text-teal-400 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      } @else {
        <!-- Health Score Gauges -->
        @if (healthData()) {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            @for (window of ['30d', '60d', '90d']; track window) {
              <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 text-center">
                <div class="relative w-24 h-24 mx-auto mb-3">
                  <svg class="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke="#334155" stroke-width="3"/>
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" [attr.stroke]="getScoreColor(getWindowScore(window))" stroke-width="3"
                          [attr.stroke-dasharray]="getWindowScore(window) + ', 100'"/>
                  </svg>
                  <span class="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">
                    {{ getWindowScore(window) }}
                  </span>
                </div>
                <div class="text-white font-semibold">{{ window === '30d' ? '30' : window === '60d' ? '60' : '90' }} {{ lang.t('forecast.days') }}</div>
                <div class="text-xs mt-1" [class]="getWindowScore(window) >= 70 ? 'text-emerald-400' : getWindowScore(window) >= 40 ? 'text-amber-400' : 'text-red-400'">
                  {{ getWindowScore(window) >= 70 ? lang.t('forecast.healthy') : getWindowScore(window) >= 40 ? lang.t('forecast.at_risk') : lang.t('forecast.critical') }}
                </div>
              </div>
            }
          </div>
        }

        <!-- Filter Tabs -->
        <div class="flex flex-wrap gap-2">
          <button (click)="activeFilter.set('ALL')"
                  class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                  [class]="activeFilter() === 'ALL' ? 'bg-teal-500 text-white' : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white'">
            {{ lang.t('forecast.all') }} ({{ forecastData()?.totalItems || 0 }})
          </button>
          @for (cat of categories(); track cat.key) {
            <button (click)="activeFilter.set(cat.key)"
                    class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
                    [class]="activeFilter() === cat.key ? 'bg-teal-500 text-white' : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white'">
              {{ cat.icon }} {{ cat.label }} ({{ cat.count }})
            </button>
          }
        </div>

        <!-- Timeline -->
        @if (filteredItems().length > 0) {
          <div class="relative">
            <!-- Vertical line -->
            <div class="absolute left-6 top-0 bottom-0 w-px bg-slate-700/50"></div>

            <div class="space-y-4">
              @for (item of filteredItems(); track $index) {
                <div class="relative pl-14">
                  <!-- Icon -->
                  <div class="absolute left-3 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                       [class]="getUrgencyBgClass(item.urgency)">
                    {{ getCategoryIcon(item.category) }}
                  </div>

                  <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-teal-500/30 transition-colors">
                    <div class="flex items-start justify-between gap-3">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                          <h3 class="text-white font-semibold text-sm truncate">{{ item.title }}</h3>
                          <span class="px-2 py-0.5 rounded text-xs flex-shrink-0"
                                [class]="item.urgency >= 80 ? 'bg-red-500/10 text-red-400' : item.urgency >= 50 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'">
                            {{ item.urgency >= 80 ? lang.t('forecast.urgent') : item.urgency >= 50 ? lang.t('forecast.upcoming') : lang.t('forecast.planned') }}
                          </span>
                        </div>
                        <p class="text-xs text-slate-400 mb-2">{{ item.description }}</p>
                        <div class="flex flex-wrap items-center gap-2 text-xs">
                          @if (item.deadline) {
                            <span class="text-slate-500">{{ item.deadline.substring(0, 10) }}</span>
                          }
                          @if (item.pillar) {
                            <span class="px-2 py-0.5 rounded bg-slate-700/50 text-slate-400">{{ item.pillar }}</span>
                          }
                        </div>
                      </div>
                      <!-- Urgency bar -->
                      <div class="flex flex-col items-center gap-1 flex-shrink-0">
                        <div class="w-2 h-16 bg-slate-700/50 rounded-full overflow-hidden flex flex-col-reverse">
                          <div class="w-full rounded-full transition-all"
                               [style.height.%]="item.urgency"
                               [class]="item.urgency >= 80 ? 'bg-red-500' : item.urgency >= 50 ? 'bg-amber-500' : 'bg-emerald-500'">
                          </div>
                        </div>
                        <span class="text-xs text-slate-500">{{ item.urgency }}</span>
                      </div>
                    </div>
                    @if (item.actionLink) {
                      <a [routerLink]="item.actionLink" class="inline-flex items-center gap-1 mt-2 text-xs text-teal-400 hover:text-teal-300">
                        {{ lang.t('forecast.take_action') }}
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                      </a>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        } @else {
          <div class="text-center py-12 text-slate-500">
            {{ lang.t('forecast.no_items') }}
          </div>
        }
      }
    </div>
  `
})
export class ComplianceForecastComponent implements OnInit {
  forecastData = signal<any>(null);
  healthData = signal<any>(null);
  loading = signal(true);
  activeFilter = signal('ALL');

  constructor(public lang: LangService, private api: ApiService) {}

  ngOnInit() {
    this.api.getComplianceForecast().subscribe({
      next: (res: any) => {
        this.forecastData.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
    this.api.getComplianceHealthScore(30).subscribe({
      next: (res: any) => this.healthData.set(res)
    });
  }

  categories(): { key: string; label: string; icon: string; count: number }[] {
    const counts = this.forecastData()?.categoryCounts || {};
    return [
      { key: 'EVIDENCE_EXPIRY', label: this.lang.t('forecast.cat_evidence'), icon: '\uD83D\uDCC4', count: counts['EVIDENCE_EXPIRY'] || 0 },
      { key: 'REMEDIATION_DEADLINE', label: this.lang.t('forecast.cat_remediation'), icon: '\uD83D\uDD27', count: counts['REMEDIATION_DEADLINE'] || 0 },
      { key: 'INCIDENT_DEADLINE', label: this.lang.t('forecast.cat_incident'), icon: '\u26A0\uFE0F', count: counts['INCIDENT_DEADLINE'] || 0 },
      { key: 'CONTRACT_RENEWAL', label: this.lang.t('forecast.cat_contract'), icon: '\uD83D\uDCDD', count: counts['CONTRACT_RENEWAL'] || 0 },
      { key: 'ASSESSMENT_STALE', label: this.lang.t('forecast.cat_assessment'), icon: '\uD83D\uDCCA', count: counts['ASSESSMENT_STALE'] || 0 }
    ].filter(c => c.count > 0);
  }

  filteredItems(): any[] {
    const items = this.forecastData()?.items || [];
    if (this.activeFilter() === 'ALL') return items;
    return items.filter((i: any) => i.category === this.activeFilter());
  }

  getWindowScore(window: string): number {
    return this.healthData()?.windowScores?.[window] || 0;
  }

  getScoreColor(score: number): string {
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }

  getUrgencyBgClass(urgency: number): string {
    if (urgency >= 80) return 'bg-red-500/20 text-red-400';
    if (urgency >= 50) return 'bg-amber-500/20 text-amber-400';
    return 'bg-emerald-500/20 text-emerald-400';
  }

  getCategoryIcon(cat: string): string {
    const icons: Record<string, string> = {
      EVIDENCE_EXPIRY: '\uD83D\uDCC4', REMEDIATION_DEADLINE: '\uD83D\uDD27',
      INCIDENT_DEADLINE: '\u26A0\uFE0F', CONTRACT_RENEWAL: '\uD83D\uDCDD',
      ASSESSMENT_STALE: '\uD83D\uDCCA'
    };
    return icons[cat] || '\u2022';
  }
}
