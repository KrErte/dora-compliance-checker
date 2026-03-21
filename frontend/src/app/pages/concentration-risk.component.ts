import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LangService } from '../lang.service';
import { ApiService, IctProvider } from '../api.service';

@Component({
  selector: 'app-concentration-risk',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8">
      <div>
        <h1 class="text-2xl font-bold text-white flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          {{ lang.t('concentration.concentration_risk_analysis') }}
        </h1>
        <p class="text-slate-400 text-sm mt-1">{{ lang.t('concentration.dora_art_29_assessment_of_ict_thirdparty') }}</p>
      </div>

      @if (loading()) {
        <div class="text-center py-16">
          <div class="w-10 h-10 mx-auto rounded-full border-4 border-slate-700 border-t-amber-400 animate-spin"></div>
        </div>
      }

      @if (!loading()) {
        <!-- Risk overview -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white border border-slate-200 rounded-xl p-5">
            <div class="text-3xl font-bold text-white">{{ providers().length }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('concentration.ict_providers') }}</div>
          </div>
          <div class="bg-white border rounded-xl p-5"
               [class]="highConcentrationCount() > 0 ? 'border-red-500/30' : 'border-slate-200'">
            <div class="text-3xl font-bold" [class]="highConcentrationCount() > 0 ? 'text-red-400' : 'text-blue-600'">{{ highConcentrationCount() }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('concentration.high_concentration') }}</div>
          </div>
          <div class="bg-white border border-slate-200 rounded-xl p-5">
            <div class="text-3xl font-bold text-white">{{ uniqueCountries().length }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('concentration.countries') }}</div>
          </div>
        </div>

        <!-- Service type distribution -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 class="text-lg font-semibold text-white mb-4">{{ lang.t('concentration.service_type_distribution') }}</h2>
          @for (entry of serviceTypeDistribution(); track entry.type) {
            <div class="mb-3">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-slate-600">{{ entry.type }}</span>
                <span class="font-semibold" [class]="entry.percentage > 40 ? 'text-red-400' : entry.percentage > 25 ? 'text-amber-400' : 'text-blue-600'">
                  {{ entry.count }} ({{ entry.percentage }}%)
                </span>
              </div>
              <div class="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all"
                     [style.width.%]="entry.percentage"
                     [class]="entry.percentage > 40 ? 'bg-red-400' : entry.percentage > 25 ? 'bg-amber-400' : 'bg-blue-500'"></div>
              </div>
            </div>
          }
        </div>

        <!-- Provider concentration table -->
        <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-200">
            <h2 class="text-lg font-semibold text-white">{{ lang.t('concentration.provider_concentration_analysis') }}</h2>
          </div>
          <div class="divide-y divide-slate-700/30">
            @for (provider of providers(); track provider.id) {
              <div class="px-6 py-3 flex items-center gap-4">
                <div class="w-2 h-2 rounded-full flex-shrink-0"
                     [class]="provider.criticality === 'HIGH' || provider.criticality === 'CRITICAL' ? 'bg-red-500' : provider.criticality === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'"></div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-white font-medium truncate">{{ provider.providerName }}</div>
                  <div class="text-xs text-slate-400">{{ provider.serviceType }} &bull; {{ provider.providerCountry || '?' }}</div>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-semibold"
                      [class]="provider.criticality === 'HIGH' || provider.criticality === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : provider.criticality === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'">
                  {{ provider.criticality || 'LOW' }}
                </span>
                @if (!provider.hasExitStrategy) {
                  <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                    {{ lang.t('concentration.no_exit_strategy') }}
                  </span>
                }
              </div>
            }
          </div>
        </div>

        @if (providers().length === 0) {
          <div class="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <p class="text-slate-400">{{ lang.t('concentration.add_ict_providers_first_in_supply_chain') }}</p>
          </div>
        }
      }
    </div>
  `
})
export class ConcentrationRiskComponent implements OnInit {
  loading = signal(true);
  providers = signal<IctProvider[]>([]);

  constructor(public lang: LangService, private api: ApiService) {}

  ngOnInit() {
    this.api.getIctProviders().subscribe({
      next: (data) => { this.providers.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  highConcentrationCount(): number {
    const dist = this.serviceTypeDistribution();
    return dist.filter(d => d.percentage > 40).length;
  }

  uniqueCountries(): string[] {
    return [...new Set(this.providers().map(p => p.providerCountry).filter(Boolean) as string[])];
  }

  serviceTypeDistribution(): { type: string; count: number; percentage: number }[] {
    const types: Record<string, number> = {};
    for (const p of this.providers()) {
      const t = p.serviceType || 'Unknown';
      types[t] = (types[t] || 0) + 1;
    }
    const total = this.providers().length || 1;
    return Object.entries(types)
      .map(([type, count]) => ({ type, count, percentage: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);
  }
}
