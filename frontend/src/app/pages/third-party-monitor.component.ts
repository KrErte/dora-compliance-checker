import { Component, OnInit, signal } from '@angular/core';
import { LangService } from '../lang.service';
import { ApiService } from '../api.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-third-party-monitor',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="max-w-7xl mx-auto space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-4">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          {{ lang.t('tpm.badge') }}
        </div>
        <h1 class="text-3xl md:text-4xl font-bold text-slate-900 mb-2">{{ lang.t('tpm.title') }}</h1>
        <p class="text-slate-400 max-w-2xl mx-auto">{{ lang.t('tpm.subtitle') }}</p>
      </div>

      @if (loading()) {
        <div class="text-center py-12">
          <svg class="w-8 h-8 animate-spin text-amber-400 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      } @else if (dashboard()) {
        <!-- Summary Stats Row -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div class="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-slate-900">{{ dashboard()!.totalProviders }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('tpm.total') }}</div>
          </div>
          <div class="bg-white border border-red-500/30 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-red-400">{{ dashboard()!.criticalProviders }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('tpm.critical') }}</div>
          </div>
          <div class="bg-white border border-orange-500/30 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-orange-400">{{ dashboard()!.highRiskProviders }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('tpm.high_risk') }}</div>
          </div>
          <div class="bg-white border border-blue-200 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-blue-600">{{ dashboard()!.exitStrategyPercentage }}%</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('tpm.exit_coverage') }}</div>
          </div>
          <div class="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-slate-900">{{ concentrationRisks().length }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('tpm.concentration_risks') }}</div>
          </div>
        </div>

        <!-- Concentration Risk Alerts -->
        @if (concentrationRisks().length > 0) {
          <div class="bg-red-500/5 border border-red-500/20 rounded-xl p-4 space-y-2">
            <h3 class="text-red-400 font-semibold text-sm flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
              {{ lang.t('tpm.concentration_alert') }}
            </h3>
            @for (risk of concentrationRisks(); track risk.name) {
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-600">{{ risk.name }} ({{ risk.type }})</span>
                <span class="text-red-400 font-medium">{{ risk.percentage }}% — {{ risk.count }} {{ lang.t('tpm.providers_label') }}</span>
              </div>
            }
          </div>
        }

        <!-- Vendor Cards Grid -->
        @if (dashboard()!.vendors?.length > 0) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (vendor of dashboard()!.vendors; track vendor.id) {
              <div class="bg-white border border-slate-200 rounded-xl p-5 hover:border-amber-500/30 transition-colors space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-slate-900 font-semibold text-sm">{{ vendor.providerName }}</h3>
                    <p class="text-xs text-slate-400">{{ vendor.serviceType }}</p>
                  </div>
                  <span class="px-2 py-0.5 rounded text-xs font-medium"
                        [class]="vendor.criticality === 'CRITICAL' ? 'bg-red-500/10 text-red-400' : vendor.criticality === 'IMPORTANT' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-700 text-slate-400'">
                    {{ vendor.criticality }}
                  </span>
                </div>

                <!-- Risk Score Gauge -->
                <div class="flex items-center gap-3">
                  <div class="flex-1 bg-slate-700/50 rounded-full h-2.5">
                    <div class="h-full rounded-full transition-all"
                         [style.width.%]="vendor.riskScore"
                         [class]="vendor.riskScore >= 70 ? 'bg-red-500' : vendor.riskScore >= 40 ? 'bg-amber-500' : 'bg-blue-600'">
                    </div>
                  </div>
                  <span class="text-sm font-medium" [class]="vendor.riskScore >= 70 ? 'text-red-400' : vendor.riskScore >= 40 ? 'text-amber-400' : 'text-blue-600'">
                    {{ vendor.riskScore }}
                  </span>
                </div>

                <!-- 6 Dimension Bars -->
                @if (vendor.dimensions) {
                  <div class="space-y-1.5">
                    @for (dim of getDimensionEntries(vendor.dimensions); track dim.key) {
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-slate-500 w-24 truncate">{{ dim.label }}</span>
                        <div class="flex-1 bg-slate-700/50 rounded-full h-1.5">
                          <div class="h-full rounded-full bg-blue-500/70" [style.width.%]="dim.value"></div>
                        </div>
                        <span class="text-xs text-slate-500 w-8 text-right">{{ round(dim.value) }}</span>
                      </div>
                    }
                  </div>
                }

                <!-- Footer -->
                <div class="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                  <div class="flex items-center gap-2">
                    @if (vendor.hasExitStrategy) {
                      <span class="text-blue-600">{{ lang.t('tpm.has_exit') }}</span>
                    } @else {
                      <span class="text-red-400">{{ lang.t('tpm.no_exit') }}</span>
                    }
                  </div>
                  @if (vendor.activeAlerts > 0) {
                    <span class="px-2 py-0.5 rounded bg-red-500/10 text-red-400">{{ vendor.activeAlerts }} {{ lang.t('tpm.alerts') }}</span>
                  }
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="text-center py-12">
            <p class="text-slate-500">{{ lang.t('tpm.no_providers') }}</p>
            <a routerLink="/supply-chain" class="text-amber-400 hover:text-amber-300 text-sm mt-2 inline-block">{{ lang.t('tpm.add_providers') }}</a>
          </div>
        }

        <!-- Concentration Chart -->
        @if (concentrationData()) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- By Service Type -->
            <div class="bg-white border border-slate-200 rounded-xl p-5">
              <h3 class="text-slate-900 font-semibold text-sm mb-3">{{ lang.t('tpm.by_service_type') }}</h3>
              @for (entry of getEntries(concentrationData()!.byServiceType); track entry.key) {
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xs text-slate-400 w-28 truncate">{{ entry.key }}</span>
                  <div class="flex-1 bg-slate-700/50 rounded-full h-3">
                    <div class="h-full rounded-full bg-amber-500/70" [style.width.%]="getPercent(entry.value, concentrationData()!.totalProviders)"></div>
                  </div>
                  <span class="text-xs text-slate-400 w-6 text-right">{{ entry.value }}</span>
                </div>
              }
            </div>
            <!-- By Country -->
            <div class="bg-white border border-slate-200 rounded-xl p-5">
              <h3 class="text-slate-900 font-semibold text-sm mb-3">{{ lang.t('tpm.by_country') }}</h3>
              @for (entry of getEntries(concentrationData()!.byCountry); track entry.key) {
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xs text-slate-400 w-28 truncate">{{ entry.key }}</span>
                  <div class="flex-1 bg-slate-700/50 rounded-full h-3">
                    <div class="h-full rounded-full bg-blue-500/70" [style.width.%]="getPercent(entry.value, concentrationData()!.totalProviders)"></div>
                  </div>
                  <span class="text-xs text-slate-400 w-6 text-right">{{ entry.value }}</span>
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `
})
export class ThirdPartyMonitorComponent implements OnInit {
  dashboard = signal<any>(null);
  concentrationData = signal<any>(null);
  concentrationRisks = signal<any[]>([]);
  loading = signal(true);

  constructor(public lang: LangService, private api: ApiService) {}

  ngOnInit() {
    this.api.getThirdPartyDashboard().subscribe({
      next: (res: any) => {
        this.dashboard.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
    this.api.getConcentrationRisk().subscribe({
      next: (res: any) => {
        this.concentrationData.set(res);
        this.concentrationRisks.set(res.concentrationRisks || []);
      }
    });
  }

  getDimensionEntries(dims: any): { key: string; label: string; value: number }[] {
    const labels: Record<string, string> = {
      averageScore: 'Overall', auditClause: 'Audit', exitStrategy: 'Exit',
      incident: 'Incident', dataProtection: 'Data', subcontracting: 'Subcontr.'
    };
    return Object.entries(dims)
      .filter(([_, v]) => v != null)
      .map(([k, v]) => ({ key: k, label: labels[k] || k, value: v as number }));
  }

  getEntries(obj: any): { key: string; value: number }[] {
    if (!obj) return [];
    return Object.entries(obj).map(([k, v]) => ({ key: k, value: v as number }));
  }

  getPercent(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  round(value: number): number {
    return Math.round(value);
  }
}
