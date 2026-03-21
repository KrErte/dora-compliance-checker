import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { LangService } from '../lang.service';

interface IctProvider {
  id: string;
  providerName: string;
  providerCountry?: string;
  serviceType: string;
  criticality?: string;
  riskScore?: number;
  hasExitStrategy?: boolean;
  exitStrategyDescription?: string;
  subcontractingInfo?: string;
}

interface ImpactResult {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  affectedServices: string[];
  estimatedRecoveryHours: number;
  financialImpact: string;
  cascadeRisk: number;
  mitigations: string[];
  alternativeProviders: string[];
}

@Component({
  selector: 'app-whatif-simulator',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-10">
        <h1 class="text-3xl font-bold text-slate-900 mb-2">{{ lang.t('whatif.title') }}</h1>
        <p class="text-slate-400">{{ lang.t('whatif.subtitle') }}</p>
      </div>

      <!-- No providers state -->
      @if (providers().length === 0 && !loading()) {
        <div class="glass-card p-12 text-center">
          <div class="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-6 border border-slate-200">
            <svg class="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
            </svg>
          </div>
          <h2 class="text-xl font-bold text-slate-700 mb-2">{{ lang.t('whatif.no_providers') }}</h2>
          <p class="text-slate-400 mb-6">{{ lang.t('whatif.no_providers_desc') }}</p>
          <a routerLink="/supply-chain" class="inline-flex items-center gap-2 bg-blue-600 text-slate-900 font-semibold px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-lg transition-all">
            {{ lang.t('whatif.go_supply_chain') }}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
          </a>
        </div>
      }

      @if (providers().length > 0) {
        <!-- Provider Selection -->
        <div class="glass-card p-6 mb-8">
          <h2 class="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            {{ lang.t('whatif.select_provider') }}
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            @for (p of providers(); track p.id) {
              <button (click)="simulateFailure(p)"
                      class="text-left p-4 rounded-xl border transition-all duration-200"
                      [class]="selectedProvider()?.id === p.id
                        ? 'bg-red-500/15 border-red-500/40 ring-1 ring-red-500/30'
                        : 'bg-white border-slate-200 hover:border-red-500/30 hover:bg-red-500/5'">
                <div class="flex items-center gap-3 mb-2">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                       [class]="p.criticality === 'CRITICAL' || p.criticality === 'HIGH' ? 'bg-red-500/20 text-red-400' : p.criticality === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'">
                    {{ p.providerName.charAt(0) }}
                  </div>
                  <div class="min-w-0">
                    <p class="font-medium text-slate-700 truncate">{{ p.providerName }}</p>
                    <p class="text-xs text-slate-500">{{ p.serviceType }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <span class="px-2 py-0.5 rounded-full"
                        [class]="p.criticality === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                                 p.criticality === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                                 p.criticality === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                                 'bg-slate-700 text-slate-400'">
                    {{ lang.t('whatif.criticality_' + (p.criticality || 'LOW').toLowerCase()) }}
                  </span>
                  @if (p.providerCountry) {
                    <span class="text-slate-500">{{ p.providerCountry }}</span>
                  }
                </div>
              </button>
            }
          </div>
        </div>

        <!-- Impact Analysis -->
        @if (impact()) {
          <div class="space-y-6 animate-fade-in-up">
            <!-- Severity Banner -->
            <div class="glass-card p-6 border-l-4"
                 [class]="impact()!.severity === 'CRITICAL' ? 'border-l-red-500' :
                          impact()!.severity === 'HIGH' ? 'border-l-orange-500' :
                          impact()!.severity === 'MEDIUM' ? 'border-l-amber-500' : 'border-l-blue-600'">
              <div class="flex items-start gap-4">
                <div class="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                     [class]="impact()!.severity === 'CRITICAL' ? 'bg-red-500/20' :
                              impact()!.severity === 'HIGH' ? 'bg-orange-500/20' :
                              impact()!.severity === 'MEDIUM' ? 'bg-amber-500/20' : 'bg-blue-100'">
                  <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                       [class]="impact()!.severity === 'CRITICAL' ? 'text-red-400' :
                                impact()!.severity === 'HIGH' ? 'text-orange-400' :
                                impact()!.severity === 'MEDIUM' ? 'text-amber-400' : 'text-blue-600'">
                    @if (impact()!.severity === 'CRITICAL' || impact()!.severity === 'HIGH') {
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    } @else {
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    }
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold mb-1"
                      [class]="impact()!.severity === 'CRITICAL' ? 'text-red-400' :
                               impact()!.severity === 'HIGH' ? 'text-orange-400' :
                               impact()!.severity === 'MEDIUM' ? 'text-amber-400' : 'text-blue-600'">
                    {{ lang.t('whatif.severity_' + impact()!.severity.toLowerCase()) }}
                  </h3>
                  <p class="text-slate-400 text-sm">
                    {{ lang.t('whatif.scenario_desc') }}: <strong class="text-white">{{ selectedProvider()!.providerName }}</strong>
                  </p>
                </div>
              </div>
            </div>

            <!-- Impact KPIs -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="glass-card p-4 text-center">
                <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">{{ lang.t('whatif.affected_services') }}</p>
                <p class="text-3xl font-bold text-red-400">{{ impact()!.affectedServices.length }}</p>
              </div>
              <div class="glass-card p-4 text-center">
                <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">{{ lang.t('whatif.recovery_time') }}</p>
                <p class="text-3xl font-bold text-amber-400">{{ impact()!.estimatedRecoveryHours }}{{ lang.t('whatif.hours_short') }}</p>
              </div>
              <div class="glass-card p-4 text-center">
                <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">{{ lang.t('whatif.cascade_risk') }}</p>
                <p class="text-3xl font-bold" [class]="impact()!.cascadeRisk > 70 ? 'text-red-400' : impact()!.cascadeRisk > 40 ? 'text-amber-400' : 'text-blue-600'">{{ impact()!.cascadeRisk }}%</p>
              </div>
              <div class="glass-card p-4 text-center">
                <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">{{ lang.t('whatif.financial_impact') }}</p>
                <p class="text-3xl font-bold text-violet-400">{{ impact()!.financialImpact }}</p>
              </div>
            </div>

            <!-- Affected Services & Mitigations -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Affected Services -->
              <div class="glass-card p-6">
                <h3 class="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                  {{ lang.t('whatif.affected_services') }}
                </h3>
                <div class="space-y-2">
                  @for (svc of impact()!.affectedServices; track svc) {
                    <div class="flex items-center gap-3 p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                      <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                      <span class="text-sm text-slate-600">{{ svc }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Mitigations -->
              <div class="glass-card p-6">
                <h3 class="text-lg font-bold text-blue-600 mb-4 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  {{ lang.t('whatif.mitigations') }}
                </h3>
                <div class="space-y-2">
                  @for (m of impact()!.mitigations; track m; let i = $index) {
                    <div class="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-500/10">
                      <span class="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center shrink-0 mt-0.5">{{ i + 1 }}</span>
                      <span class="text-sm text-slate-600">{{ m }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Exit Strategy Status -->
            <div class="glass-card p-6">
              <h3 class="text-lg font-bold text-blue-500 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                {{ lang.t('whatif.exit_strategy') }}
              </h3>
              @if (selectedProvider()!.hasExitStrategy) {
                <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div class="flex items-center gap-2 mb-2">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    <span class="font-medium text-blue-500">{{ lang.t('whatif.exit_exists') }}</span>
                  </div>
                  @if (selectedProvider()!.exitStrategyDescription) {
                    <p class="text-sm text-slate-400 ml-7">{{ selectedProvider()!.exitStrategyDescription }}</p>
                  }
                </div>
              } @else {
                <div class="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div class="flex items-center gap-2 mb-2">
                    <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    <span class="font-medium text-red-300">{{ lang.t('whatif.exit_missing') }}</span>
                  </div>
                  <p class="text-sm text-slate-400 ml-7">{{ lang.t('whatif.exit_missing_desc') }}</p>
                </div>
              }
            </div>

            <!-- Reset -->
            <div class="text-center">
              <button (click)="reset()" class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-600 hover:border-slate-300 transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                {{ lang.t('whatif.reset') }}
              </button>
            </div>
          </div>
        }
      }
    </div>
  `
})
export class WhatifSimulatorComponent implements OnInit {
  readonly lang = inject(LangService);
  private readonly http = inject(HttpClient);
  private readonly titleService = inject(Title);

  providers = signal<IctProvider[]>([]);
  selectedProvider = signal<IctProvider | null>(null);
  impact = signal<ImpactResult | null>(null);
  loading = signal(false);

  ngOnInit() {
    this.titleService.setTitle(this.lang.t('title.whatif'));
    this.loading.set(true);
    this.http.get<IctProvider[]>('/api/ict-providers').subscribe({
      next: data => { this.providers.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  simulateFailure(provider: IctProvider) {
    this.selectedProvider.set(provider);
    this.impact.set(this.calculateImpact(provider));
  }

  reset() {
    this.selectedProvider.set(null);
    this.impact.set(null);
  }

  private calculateImpact(provider: IctProvider): ImpactResult {
    const crit = (provider.criticality || 'LOW').toUpperCase();
    const hasExit = provider.hasExitStrategy ?? false;
    const riskScore = provider.riskScore ?? 50;
    const isEU = this.isEUCountry(provider.providerCountry || '');
    const lang = this.lang.lang();

    // Severity calculation
    let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    if (crit === 'CRITICAL') severity = 'CRITICAL';
    else if (crit === 'HIGH' || (crit === 'MEDIUM' && !hasExit)) severity = 'HIGH';
    else if (crit === 'MEDIUM') severity = 'MEDIUM';
    else severity = 'LOW';

    // Affected services based on service type
    const serviceType = (provider.serviceType || '').toLowerCase();
    const affectedServices = this.getAffectedServices(serviceType, lang);

    // Recovery time: critical = 72-168h, high = 48-72h, medium = 24-48h, low = 4-24h
    let baseHours: number;
    if (severity === 'CRITICAL') baseHours = 120;
    else if (severity === 'HIGH') baseHours = 60;
    else if (severity === 'MEDIUM') baseHours = 36;
    else baseHours = 12;
    if (!hasExit) baseHours *= 1.5;
    if (!isEU) baseHours *= 1.2;

    // Cascade risk
    let cascadeRisk = crit === 'CRITICAL' ? 85 : crit === 'HIGH' ? 60 : crit === 'MEDIUM' ? 35 : 15;
    if (!hasExit) cascadeRisk = Math.min(100, cascadeRisk + 15);

    // Financial impact estimate
    const financialMultiplier = severity === 'CRITICAL' ? 4 : severity === 'HIGH' ? 2.5 : severity === 'MEDIUM' ? 1.5 : 0.5;
    const financialImpact = severity === 'CRITICAL' || severity === 'HIGH' ? lang === 'et' ? 'Kõrge' : 'High' : lang === 'et' ? 'Keskmine' : 'Medium';

    // Mitigations
    const mitigations = this.getMitigations(provider, severity, hasExit, lang);

    return {
      severity,
      affectedServices,
      estimatedRecoveryHours: Math.round(baseHours),
      financialImpact,
      cascadeRisk,
      mitigations,
      alternativeProviders: []
    };
  }

  private getAffectedServices(serviceType: string, lang: string): string[] {
    const isEt = lang === 'et';
    const serviceMap: { [key: string]: string[] } = {
      'cloud': isEt
        ? ['Pilveinfrastruktuur', 'Andmebaasid', 'Veebiteenused', 'API-d', 'Failihoidla']
        : ['Cloud infrastructure', 'Databases', 'Web services', 'APIs', 'File storage'],
      'pilv': isEt
        ? ['Pilveinfrastruktuur', 'Andmebaasid', 'Veebiteenused', 'API-d', 'Failihoidla']
        : ['Cloud infrastructure', 'Databases', 'Web services', 'APIs', 'File storage'],
      'hosting': isEt
        ? ['Veebimajutus', 'E-posti süsteem', 'DNS teenused']
        : ['Web hosting', 'Email system', 'DNS services'],
      'payment': isEt
        ? ['Maksetöötlus', 'Kaarditehingud', 'Arveldussüsteem', 'Kliendimaksed']
        : ['Payment processing', 'Card transactions', 'Settlement system', 'Client payments'],
      'makse': isEt
        ? ['Maksetöötlus', 'Kaarditehingud', 'Arveldussüsteem', 'Kliendimaksed']
        : ['Payment processing', 'Card transactions', 'Settlement system', 'Client payments'],
      'security': isEt
        ? ['Tulemüürid', 'Sissetungituvastus', 'VPN', 'Autentimine']
        : ['Firewalls', 'Intrusion detection', 'VPN', 'Authentication'],
      'turva': isEt
        ? ['Tulemüürid', 'Sissetungituvastus', 'VPN', 'Autentimine']
        : ['Firewalls', 'Intrusion detection', 'VPN', 'Authentication'],
      'data': isEt
        ? ['Andmeanalüütika', 'Aruandlus', 'Andmeladu']
        : ['Data analytics', 'Reporting', 'Data warehouse'],
      'network': isEt
        ? ['Võrguühendus', 'Sisevõrk', 'Interneti ligipääs']
        : ['Network connectivity', 'Internal network', 'Internet access'],
      'võrk': isEt
        ? ['Võrguühendus', 'Sisevõrk', 'Interneti ligipääs']
        : ['Network connectivity', 'Internal network', 'Internet access'],
    };

    for (const [key, services] of Object.entries(serviceMap)) {
      if (serviceType.includes(key)) return services;
    }

    return isEt
      ? ['Teenuse katkestus', 'Seotud protsessid', 'Klienditeenus']
      : ['Service disruption', 'Related processes', 'Customer service'];
  }

  private getMitigations(provider: IctProvider, severity: string, hasExit: boolean, lang: string): string[] {
    const isEt = lang === 'et';
    const mitigations: string[] = [];

    if (!hasExit) {
      mitigations.push(isEt
        ? 'Koosta viivitamatult exit strateegia vastavalt DORA Art. 28(8)'
        : 'Develop an exit strategy immediately per DORA Art. 28(8)');
    }

    if (severity === 'CRITICAL' || severity === 'HIGH') {
      mitigations.push(isEt
        ? 'Teavita juhtkonda ja pädevat asutust vastavalt DORA Art. 19'
        : 'Notify management body and competent authority per DORA Art. 19');
      mitigations.push(isEt
        ? 'Aktiveeri talitluspidevuse plaan ja alusta alternatiivse pakkuja otsimist'
        : 'Activate business continuity plan and begin alternative provider search');
    }

    mitigations.push(isEt
      ? 'Hinda mõju klientidele ja käivita kliendikommunikatsioon'
      : 'Assess client impact and initiate client communication');

    if (severity === 'CRITICAL') {
      mitigations.push(isEt
        ? 'Esita esialgne teavitus 4 tunni jooksul vastavalt DORA Art. 19(4)'
        : 'Submit initial notification within 4 hours per DORA Art. 19(4)');
    }

    mitigations.push(isEt
      ? 'Dokumenteeri juhtum ja mõjuanalüüs auditiahela jaoks'
      : 'Document incident and impact analysis for audit trail');

    if (!this.isEUCountry(provider.providerCountry || '')) {
      mitigations.push(isEt
        ? 'Hinda kolmanda riigi andmekaitse riske ja GDPR vastavust'
        : 'Assess third-country data protection risks and GDPR compliance');
    }

    return mitigations;
  }

  private isEUCountry(country: string): boolean {
    const eu = ['EE', 'LV', 'LT', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'FI', 'SE', 'DK', 'IE', 'PT', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'HR', 'SI', 'LU', 'MT', 'CY', 'GR',
      'Estonia', 'Latvia', 'Lithuania', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands'];
    return eu.some(c => country.toUpperCase().includes(c.toUpperCase()));
  }
}
