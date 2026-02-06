import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LangService } from '../lang.service';

interface CompanyInfo {
  registryCode: string;
  name: string;
  emtakCode: string;
  emtakNameEt: string;
  emtakNameEn: string;
  nis2SectorCode: string | null;
  annexType: string;
  employeeCount: number;
  revenue: number;
  balanceSheet: number;
  dataSource: string;
}

type SectorType = 'essential' | 'important';
type ClassificationResult = 'essential' | 'important' | 'not_applicable';

interface Sector {
  code: string;
  nameEt: string;
  nameEn: string;
  type: SectorType;
}

@Component({
  selector: 'app-nis2-scope-check',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="text-center space-y-3">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
          <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          <span class="text-xs font-medium text-amber-400">{{ lang.t('nis2.free_tool') }}</span>
        </div>
        <h1 class="text-3xl font-bold gradient-text">{{ lang.t('nis2.title') }}</h1>
        <p class="text-slate-400 max-w-xl mx-auto">{{ lang.t('nis2.subtitle') }}</p>
      </div>

      <div class="grid lg:grid-cols-2 gap-8">
        <!-- Input Form -->
        <div class="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 space-y-6">
          <h2 class="text-lg font-semibold text-white flex items-center gap-2">
            <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            {{ lang.t('nis2.company_info') }}
          </h2>

          <!-- Registry Code Lookup -->
          <div class="space-y-3 pb-6 border-b border-slate-700/50">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <span class="text-sm font-medium text-slate-300">{{ lang.t('nis2.registry_lookup') }}</span>
              <span class="text-xs text-slate-500">({{ lang.t('nis2.optional') }})</span>
            </div>

            <div class="flex gap-2">
              <input
                type="text"
                [(ngModel)]="registryCode"
                maxlength="8"
                placeholder="12345678"
                (keyup.enter)="lookupCompany()"
                class="flex-1 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono tracking-wider"
              />
              <button
                type="button"
                (click)="lookupCompany()"
                [disabled]="lookupLoading || registryCode.length !== 8"
                class="px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2"
                [ngClass]="registryCode.length === 8 && !lookupLoading
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 cursor-pointer'
                  : 'bg-slate-700/30 text-slate-500 border border-slate-600/30 cursor-not-allowed'">
                <svg *ngIf="lookupLoading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <svg *ngIf="!lookupLoading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                {{ lang.t('nis2.search') }}
              </button>
            </div>

            <p class="text-xs text-slate-500">{{ lang.t('nis2.registry_hint') }}</p>

            <!-- Error message -->
            <div *ngIf="lookupError" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ lookupError }}
            </div>

            <!-- Company info card -->
            <div *ngIf="companyInfo" class="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-cyan-400">{{ companyInfo.name }}</span>
                <span class="text-xs text-slate-500 font-mono">{{ companyInfo.registryCode }}</span>
              </div>
              <div class="text-xs text-slate-400">
                EMTAK: {{ companyInfo.emtakCode }} - {{ lang.currentLang === 'et' ? companyInfo.emtakNameEt : companyInfo.emtakNameEn }}
              </div>
              <div *ngIf="dataAutoFilled" class="flex items-center gap-1.5 text-xs text-emerald-400 mt-2">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                {{ lang.t('nis2.data_autofilled') }}
              </div>
              <div class="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {{ lang.t('nis2.data_source_note') }}
              </div>
            </div>
          </div>

          <!-- Sector Select -->
          <div class="space-y-2">
            <label for="nis2-sector" class="text-sm font-medium text-slate-300">{{ lang.t('nis2.sector') }} *</label>
            <select [(ngModel)]="sector" id="nis2-sector" class="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all">
              <option value="">{{ lang.t('nis2.select_sector') }}</option>
              <optgroup [label]="lang.t('nis2.essential_sectors')">
                <option *ngFor="let s of essentialSectors" [value]="s.code">{{ lang.currentLang === 'et' ? s.nameEt : s.nameEn }}</option>
              </optgroup>
              <optgroup [label]="lang.t('nis2.important_sectors')">
                <option *ngFor="let s of importantSectors" [value]="s.code">{{ lang.currentLang === 'et' ? s.nameEt : s.nameEn }}</option>
              </optgroup>
            </select>
          </div>

          <!-- Employee Count -->
          <div class="space-y-2">
            <label for="nis2-employees" class="text-sm font-medium text-slate-300">{{ lang.t('nis2.employees') }} *</label>
            <input type="number" [(ngModel)]="employees" id="nis2-employees" min="0" placeholder="0" class="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all">
            <p class="text-xs text-slate-500">{{ lang.t('nis2.employees_hint') }}</p>
          </div>

          <!-- Annual Revenue -->
          <div class="space-y-2">
            <label for="nis2-revenue" class="text-sm font-medium text-slate-300">{{ lang.t('nis2.revenue') }} *</label>
            <div class="relative">
              <input type="number" [(ngModel)]="revenue" id="nis2-revenue" min="0" placeholder="0" class="w-full px-4 py-3 pr-12 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all">
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">EUR</span>
            </div>
            <p class="text-xs text-slate-500">{{ lang.t('nis2.revenue_hint') }}</p>
          </div>

          <!-- Balance Sheet -->
          <div class="space-y-2">
            <label for="nis2-balance" class="text-sm font-medium text-slate-300">{{ lang.t('nis2.balance') }} *</label>
            <div class="relative">
              <input type="number" [(ngModel)]="balance" id="nis2-balance" min="0" placeholder="0" class="w-full px-4 py-3 pr-12 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all">
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">EUR</span>
            </div>
            <p class="text-xs text-slate-500">{{ lang.t('nis2.balance_hint') }}</p>
          </div>

          <!-- Thresholds info -->
          <div class="p-4 rounded-xl bg-slate-900/30 border border-slate-700/30 space-y-3">
            <p class="text-xs font-medium text-slate-400 uppercase tracking-wider">{{ lang.t('nis2.thresholds_title') }}</p>
            <div class="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p class="text-red-400 font-medium">{{ lang.t('nis2.essential_entity') }}</p>
                <ul class="text-slate-500 mt-1 space-y-0.5">
                  <li>&gt;250 {{ lang.t('nis2.employees_short') }}</li>
                  <li>&gt;50M EUR {{ lang.t('nis2.revenue_short') }}</li>
                  <li>&gt;43M EUR {{ lang.t('nis2.balance_short') }}</li>
                </ul>
              </div>
              <div>
                <p class="text-amber-400 font-medium">{{ lang.t('nis2.important_entity') }}</p>
                <ul class="text-slate-500 mt-1 space-y-0.5">
                  <li>&gt;50 {{ lang.t('nis2.employees_short') }}</li>
                  <li>&gt;10M EUR {{ lang.t('nis2.revenue_short') }}</li>
                  <li>&gt;10M EUR {{ lang.t('nis2.balance_short') }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Result Panel -->
        <div class="space-y-6">
          <!-- Classification Badge -->
          <div class="bg-slate-800/50 backdrop-blur-sm rounded-2xl border p-6" [ngClass]="resultBorderClass">
            <ng-container *ngIf="!hasInput">
              <div class="text-center py-8 space-y-3">
                <div class="w-16 h-16 mx-auto rounded-full bg-slate-700/50 flex items-center justify-center">
                  <svg class="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <p class="text-slate-400">{{ lang.t('nis2.fill_form') }}</p>
              </div>
            </ng-container>

            <ng-container *ngIf="hasInput">
              <div class="text-center space-y-4">
                <!-- Essential result -->
                <div *ngIf="classification === 'essential'" class="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-red-500/10 border border-red-500/30">
                  <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  <div class="text-left">
                    <p class="text-sm text-red-300">NIS2</p>
                    <p class="text-xl font-bold text-red-400">{{ lang.t('nis2.result_essential') }}</p>
                  </div>
                </div>

                <!-- Important result -->
                <div *ngIf="classification === 'important'" class="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                  <svg class="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <div class="text-left">
                    <p class="text-sm text-amber-300">NIS2</p>
                    <p class="text-xl font-bold text-amber-400">{{ lang.t('nis2.result_important') }}</p>
                  </div>
                </div>

                <!-- Not applicable result -->
                <div *ngIf="classification === 'not_applicable'" class="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                  <svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <div class="text-left">
                    <p class="text-sm text-emerald-300">NIS2</p>
                    <p class="text-xl font-bold text-emerald-400">{{ lang.t('nis2.result_not_applicable') }}</p>
                  </div>
                </div>
              </div>
            </ng-container>
          </div>

          <!-- Info Panel (shown when applicable) -->
          <div *ngIf="classification === 'essential' || classification === 'important'" class="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 space-y-5">
            <h3 class="text-lg font-semibold text-white">{{ lang.t('nis2.what_this_means') }}</h3>

            <!-- Supervision Type -->
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" [ngClass]="classification === 'essential' ? 'bg-red-500/10' : 'bg-amber-500/10'">
                <svg class="w-5 h-5" [ngClass]="classification === 'essential' ? 'text-red-400' : 'text-amber-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-300">{{ lang.t('nis2.supervision') }}</p>
                <p class="text-sm text-slate-400">{{ classification === 'essential' ? lang.t('nis2.supervision_proactive') : lang.t('nis2.supervision_reactive') }}</p>
              </div>
            </div>

            <!-- Max Penalty -->
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" [ngClass]="classification === 'essential' ? 'bg-red-500/10' : 'bg-amber-500/10'">
                <svg class="w-5 h-5" [ngClass]="classification === 'essential' ? 'text-red-400' : 'text-amber-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-300">{{ lang.t('nis2.max_penalty') }}</p>
                <p class="text-sm text-slate-400">{{ classification === 'essential' ? lang.t('nis2.penalty_essential') : lang.t('nis2.penalty_important') }}</p>
              </div>
            </div>

            <!-- Timeline -->
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-300">{{ lang.t('nis2.timeline') }}</p>
                <p class="text-sm text-slate-400">{{ lang.t('nis2.timeline_info') }}</p>
              </div>
            </div>

            <!-- CTA Button -->
            <div class="pt-4 border-t border-slate-700/50">
              <button disabled class="w-full py-3 px-4 rounded-xl font-medium text-slate-500 bg-slate-700/30 border border-slate-600/30 cursor-not-allowed flex items-center justify-center gap-2">
                {{ lang.t('nis2.start_assessment') }}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </button>
              <p class="text-xs text-slate-500 text-center mt-2">{{ lang.t('nis2.coming_soon') }}</p>
            </div>
          </div>

          <!-- Not applicable info -->
          <div *ngIf="classification === 'not_applicable' && hasInput" class="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 space-y-4">
            <h3 class="text-lg font-semibold text-white">{{ lang.t('nis2.not_applicable_title') }}</h3>
            <p class="text-sm text-slate-400">{{ lang.t('nis2.not_applicable_desc') }}</p>
            <ul class="text-sm text-slate-500 space-y-1">
              <li class="flex items-center gap-2">
                <span class="text-emerald-400">&#10003;</span>
                {{ lang.t('nis2.na_reason_1') }}
              </li>
              <li class="flex items-center gap-2">
                <span class="text-emerald-400">&#10003;</span>
                {{ lang.t('nis2.na_reason_2') }}
              </li>
            </ul>
            <p class="text-xs text-slate-500 pt-2 border-t border-slate-700/50">{{ lang.t('nis2.na_disclaimer') }}</p>
          </div>
        </div>
      </div>

      <!-- Info section -->
      <div class="bg-slate-800/30 rounded-2xl border border-slate-700/30 p-6 space-y-4">
        <h3 class="text-lg font-semibold text-white">{{ lang.t('nis2.about_title') }}</h3>
        <p class="text-sm text-slate-400">{{ lang.t('nis2.about_desc') }}</p>
        <div class="flex flex-wrap gap-3 pt-2">
          <a href="https://eur-lex.europa.eu/eli/dir/2022/2555" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            {{ lang.t('nis2.link_directive') }}
          </a>
          <a href="https://www.ria.ee/kuberturvalisus/kuberturvalisuse-seadus" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            {{ lang.t('nis2.link_kyts') }}
          </a>
        </div>
      </div>
    </div>
  `
})
export class Nis2ScopeCheckComponent {
  constructor(public lang: LangService, private http: HttpClient) {}

  // Registry lookup
  registryCode = '';
  lookupLoading = false;
  lookupError = '';
  companyInfo: CompanyInfo | null = null;
  dataAutoFilled = false;

  // Form inputs
  sector = '';
  employees: number | null = null;
  revenue: number | null = null;
  balance: number | null = null;

  // Sector definitions
  essentialSectors: Sector[] = [
    { code: 'energy', nameEt: 'Energia', nameEn: 'Energy', type: 'essential' },
    { code: 'transport', nameEt: 'Transport', nameEn: 'Transport', type: 'essential' },
    { code: 'banking', nameEt: 'Pangandus', nameEn: 'Banking', type: 'essential' },
    { code: 'financial_infra', nameEt: 'Finantsturu infrastruktuurid', nameEn: 'Financial Market Infrastructure', type: 'essential' },
    { code: 'health', nameEt: 'Tervishoid', nameEn: 'Health', type: 'essential' },
    { code: 'drinking_water', nameEt: 'Joogivesi', nameEn: 'Drinking Water', type: 'essential' },
    { code: 'wastewater', nameEt: 'Reovesi', nameEn: 'Wastewater', type: 'essential' },
    { code: 'digital_infra', nameEt: 'Digitaalne infrastruktuur', nameEn: 'Digital Infrastructure', type: 'essential' },
    { code: 'ict_b2b', nameEt: 'IKT-teenuste haldamine (B2B)', nameEn: 'ICT Service Management (B2B)', type: 'essential' },
    { code: 'public_admin', nameEt: 'Avalik haldus', nameEn: 'Public Administration', type: 'essential' },
    { code: 'space', nameEt: 'Kosmos', nameEn: 'Space', type: 'essential' },
  ];

  importantSectors: Sector[] = [
    { code: 'postal', nameEt: 'Posti- ja kullerteenused', nameEn: 'Postal and Courier Services', type: 'important' },
    { code: 'waste', nameEt: 'Jäätmekäitlus', nameEn: 'Waste Management', type: 'important' },
    { code: 'chemicals', nameEt: 'Kemikaalid', nameEn: 'Chemicals', type: 'important' },
    { code: 'food', nameEt: 'Toidutootmine', nameEn: 'Food Production', type: 'important' },
    { code: 'manufacturing', nameEt: 'Tootmine', nameEn: 'Manufacturing', type: 'important' },
    { code: 'digital_providers', nameEt: 'Digitaalsed teenusepakkujad', nameEn: 'Digital Service Providers', type: 'important' },
    { code: 'research', nameEt: 'Teadusuuringud', nameEn: 'Research', type: 'important' },
  ];

  allSectors = [...this.essentialSectors, ...this.importantSectors];

  get hasInput(): boolean {
    return this.sector !== '' && this.employees !== null && this.revenue !== null && this.balance !== null;
  }

  get selectedSectorData(): Sector | undefined {
    return this.allSectors.find(s => s.code === this.sector);
  }

  get isEssentialSector(): boolean {
    return this.selectedSectorData?.type === 'essential';
  }

  get meetsEssentialSize(): boolean {
    const emp = this.employees || 0;
    const rev = this.revenue || 0;
    const bal = this.balance || 0;
    return emp > 250 || rev > 50_000_000 || bal > 43_000_000;
  }

  get meetsImportantSize(): boolean {
    const emp = this.employees || 0;
    const rev = this.revenue || 0;
    const bal = this.balance || 0;
    return emp > 50 || rev > 10_000_000 || bal > 10_000_000;
  }

  get classification(): ClassificationResult {
    if (!this.hasInput) return 'not_applicable';
    if (!this.selectedSectorData) return 'not_applicable';

    // Essential: Annex I sector AND large enterprise criteria
    if (this.isEssentialSector && this.meetsEssentialSize) {
      return 'essential';
    }

    // Important: (Annex I OR II) AND medium+ criteria AND NOT essential
    if (this.meetsImportantSize) {
      return 'important';
    }

    return 'not_applicable';
  }

  get resultBorderClass(): string {
    switch (this.classification) {
      case 'essential': return 'border-red-500/30';
      case 'important': return 'border-amber-500/30';
      default: return 'border-slate-700/50';
    }
  }

  lookupCompany(): void {
    if (this.registryCode.length !== 8) return;

    this.lookupLoading = true;
    this.lookupError = '';
    this.companyInfo = null;
    this.dataAutoFilled = false;

    this.http.get<CompanyInfo>(`/api/company/${this.registryCode}`).subscribe({
      next: (company) => {
        this.lookupLoading = false;
        this.companyInfo = company;

        if (company.nis2SectorCode) {
          this.sector = company.nis2SectorCode;
        }
        this.employees = company.employeeCount;
        this.revenue = company.revenue;
        this.balance = company.balanceSheet;
        this.dataAutoFilled = true;
      },
      error: (err) => {
        this.lookupLoading = false;
        if (err.status === 404) {
          this.lookupError = this.lang.t('nis2.company_not_found');
        } else if (err.status === 400) {
          this.lookupError = this.lang.t('nis2.invalid_registry_code');
        } else {
          this.lookupError = this.lang.t('nis2.lookup_error');
        }
      }
    });
  }
}
