import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, switchMap, of, catchError } from 'rxjs';
import { LangService } from '../lang.service';

interface AutocompleteResult {
  company_id: number;
  reg_code: number;
  name: string;
  legal_address: string;
  status: string;
}

interface Sector {
  code: string;
  nameEt: string;
  nameEn: string;
  type: 'essential' | 'important' | 'dora';
}

type NIS2Status = 'essential' | 'important' | 'not_applicable';
type DORAStatus = 'applies' | 'indirect' | 'not_applicable';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface CompanyRiskResult {
  name: string;
  registryCode: string;
  sector: string;
  employees: number;
  revenue: number;
  role: string;
  nis2Status: NIS2Status;
  doraStatus: DORAStatus;
  nis2Fine: number;
  doraFine: number;
  personalLiability: number;
  riskLevel: RiskLevel;
}

interface RiskCalculationResult {
  companies: CompanyRiskResult[];
  totalPersonalLiability: number;
  overallRiskLevel: RiskLevel;
  displayValue: number; // For animated counter
}

@Component({
  selector: 'app-board-risk',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="space-y-8">
      <!-- Hero Header -->
      <div class="text-center space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20">
          <span class="text-base">🆕</span>
          <span class="text-xs font-medium text-teal-400">{{ lang.t('board_risk.badge') }}</span>
        </div>
        <h1 class="text-3xl md:text-4xl font-bold gradient-text">{{ lang.t('board_risk.title') }}</h1>
        <p class="text-slate-400 max-w-2xl mx-auto leading-relaxed">{{ lang.t('board_risk.subtitle') }}</p>
      </div>

      <!-- Main Form Section -->
      <div class="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 md:p-8 space-y-6">

        <!-- Autocomplete Search -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-slate-300">
            {{ lang.t('board_risk.add_company') }}
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <input
              type="text"
              [value]="searchQuery"
              (input)="onSearchInput($event)"
              (focus)="showDropdown = true"
              [placeholder]="lang.t('board_risk.search_placeholder')"
              [disabled]="companies.length >= 10"
              class="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white placeholder-slate-500
                     focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div *ngIf="searchLoading" class="absolute inset-y-0 right-0 pr-4 flex items-center">
              <svg class="w-5 h-5 text-teal-400 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          </div>

          <!-- Autocomplete Dropdown -->
          <div *ngIf="showDropdown && autocompleteResults.length > 0"
               class="absolute z-50 w-full mt-1 max-h-72 overflow-y-auto rounded-xl bg-slate-800 border border-slate-700/50 shadow-xl shadow-black/30">
            <button
              *ngFor="let result of autocompleteResults"
              type="button"
              (click)="selectCompany(result)"
              class="w-full px-4 py-3 text-left hover:bg-teal-500/10 transition-colors border-b border-slate-700/30 last:border-b-0 group">
              <div class="flex items-center justify-between">
                <span class="font-medium text-white group-hover:text-teal-400 transition-colors">{{ result.name }}</span>
                <span class="text-xs text-slate-500 font-mono">{{ result.reg_code }}</span>
              </div>
              <div class="text-xs text-slate-500 mt-0.5">{{ result.legal_address }}</div>
            </button>
          </div>

          <!-- Max companies hint -->
          <p *ngIf="companies.length >= 10" class="text-xs text-amber-400">
            {{ lang.t('board_risk.max_companies') }}
          </p>
          <p *ngIf="companies.length === 0" class="text-xs text-slate-500">
            {{ lang.t('board_risk.search_hint') }}
          </p>
        </div>

        <!-- Company Cards -->
        <div *ngIf="companies.length > 0" class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-slate-300">
              {{ lang.t('board_risk.your_companies') }} ({{ companies.length }})
            </h3>
          </div>

          <div *ngFor="let company of companies.controls; let i = index"
               class="relative bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5 space-y-4 group">

            <!-- Remove button -->
            <button
              type="button"
              (click)="removeCompany(i)"
              class="absolute top-3 right-3 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            <!-- Company Header (locked) -->
            <div class="flex items-center gap-3 pb-3 border-b border-slate-700/50">
              <div class="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <div>
                <div class="font-medium text-white">{{ company.get('name')?.value }}</div>
                <div class="text-xs text-slate-500 font-mono">{{ company.get('registryCode')?.value }}</div>
              </div>
            </div>

            <!-- Form Fields Grid -->
            <div class="grid md:grid-cols-2 gap-4">
              <!-- Sector -->
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">{{ lang.t('board_risk.sector') }} *</label>
                <select
                  [formControl]="$any(company.get('sector'))"
                  class="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-600/50 text-white text-sm
                         focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 transition-all">
                  <option value="" disabled>{{ lang.t('board_risk.select_sector') }}</option>
                  <optgroup [label]="lang.t('board_risk.sectors_nis2_essential')">
                    <option *ngFor="let s of essentialSectors" [value]="s.code">
                      {{ lang.currentLang === 'et' ? s.nameEt : s.nameEn }}
                    </option>
                  </optgroup>
                  <optgroup [label]="lang.t('board_risk.sectors_nis2_important')">
                    <option *ngFor="let s of importantSectors" [value]="s.code">
                      {{ lang.currentLang === 'et' ? s.nameEt : s.nameEn }}
                    </option>
                  </optgroup>
                  <optgroup [label]="lang.t('board_risk.sectors_dora')">
                    <option *ngFor="let s of doraSectors" [value]="s.code">
                      {{ lang.currentLang === 'et' ? s.nameEt : s.nameEn }}
                    </option>
                  </optgroup>
                </select>
              </div>

              <!-- Role -->
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">{{ lang.t('board_risk.your_role') }} *</label>
                <div class="flex flex-wrap gap-2">
                  <label *ngFor="let role of roles"
                         class="relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all"
                         [class]="company.get('role')?.value === role.value
                           ? 'bg-teal-500/20 border border-teal-500/40 text-teal-400'
                           : 'bg-slate-800 border border-slate-600/50 text-slate-400 hover:border-slate-500'">
                    <input
                      type="radio"
                      [formControl]="$any(company.get('role'))"
                      [value]="role.value"
                      class="sr-only"
                    />
                    <span class="text-xs font-medium">{{ lang.currentLang === 'et' ? role.labelEt : role.labelEn }}</span>
                  </label>
                </div>
              </div>

              <!-- Employees -->
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">{{ lang.t('board_risk.employees') }} *</label>
                <input
                  type="number"
                  [formControl]="$any(company.get('employees'))"
                  min="1"
                  placeholder="0"
                  class="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-600/50 text-white text-sm
                         focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 transition-all
                         [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <!-- Revenue -->
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">{{ lang.t('board_risk.revenue') }} *</label>
                <div class="relative">
                  <input
                    type="number"
                    [formControl]="$any(company.get('revenue'))"
                    min="1"
                    placeholder="0"
                    class="w-full px-3 py-2.5 pr-12 rounded-lg bg-slate-800 border border-slate-600/50 text-white text-sm
                           focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 transition-all
                           [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 text-sm">EUR</span>
                </div>
              </div>
            </div>

            <!-- Validation errors -->
            <div *ngIf="company.invalid && company.touched" class="text-xs text-red-400 pt-1">
              {{ lang.t('board_risk.fill_required') }}
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="pt-4">
          <button
            type="button"
            (click)="calculateRisk()"
            [disabled]="companies.length === 0 || form.invalid"
            class="w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2
                   disabled:opacity-50 disabled:cursor-not-allowed
                   bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400
                   text-slate-900 hover:shadow-lg hover:shadow-teal-500/25">
            {{ lang.t('board_risk.calculate_btn') }}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </button>
          <p *ngIf="companies.length === 0" class="text-xs text-slate-500 text-center mt-2">
            {{ lang.t('board_risk.add_company_hint') }}
          </p>
        </div>
      </div>

      <!-- RESULTS SECTION -->
      <div #resultsSection *ngIf="results" class="space-y-8 animate-fade-in">

        <!-- Hero Number -->
        <div class="text-center py-8 px-6 rounded-2xl border-2 transition-all"
             [ngClass]="getResultBorderClass()">
          <p class="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">
            {{ lang.t('board_risk.result_title') }}
          </p>
          <div class="text-5xl md:text-6xl font-bold tabular-nums mb-3"
               [ngClass]="getResultTextClass()">
            € {{ formatNumber(results.displayValue) }}
          </div>
          <p class="text-sm text-slate-500 mb-4">
            {{ lang.t('board_risk.result_subtitle') }}
          </p>
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full"
               [ngClass]="getResultBadgeClass()">
            <span>{{ getRiskEmoji() }}</span>
            <span class="text-sm font-semibold">{{ lang.t('board_risk.risk_' + results.overallRiskLevel) }}</span>
          </div>
        </div>

        <!-- Company Result Cards -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-white">{{ lang.t('board_risk.breakdown_title') }}</h3>

          <div *ngFor="let company of results.companies"
               class="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5 space-y-4">

            <!-- Header -->
            <div class="flex items-center justify-between pb-3 border-b border-slate-700/50">
              <div>
                <div class="font-medium text-white">{{ company.name }}</div>
                <div class="text-xs text-slate-500 font-mono">{{ company.registryCode }}</div>
              </div>
              <div class="px-3 py-1 rounded-full text-xs font-medium"
                   [ngClass]="getCompanyBadgeClass(company.riskLevel)">
                {{ lang.t('board_risk.risk_' + company.riskLevel) }}
              </div>
            </div>

            <!-- Status Grid -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <p class="text-xs text-slate-500">{{ lang.t('board_risk.nis2_status') }}</p>
                <p class="text-sm font-medium" [ngClass]="getNis2StatusClass(company.nis2Status)">
                  {{ lang.t('board_risk.nis2_' + company.nis2Status) }}
                </p>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-slate-500">{{ lang.t('board_risk.dora_status') }}</p>
                <p class="text-sm font-medium" [ngClass]="getDoraStatusClass(company.doraStatus)">
                  {{ lang.t('board_risk.dora_' + company.doraStatus) }}
                </p>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-slate-500">{{ lang.t('board_risk.nis2_max_fine') }}</p>
                <p class="text-sm font-medium text-white">€ {{ formatNumber(company.nis2Fine) }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-slate-500">{{ lang.t('board_risk.dora_max_fine') }}</p>
                <p class="text-sm font-medium text-white">€ {{ formatNumber(company.doraFine) }}</p>
              </div>
            </div>

            <!-- Personal Liability -->
            <div class="pt-3 border-t border-slate-700/50">
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-400">{{ lang.t('board_risk.your_liability') }}</span>
                <span class="text-lg font-bold" [ngClass]="getResultTextClass()">
                  € {{ formatNumber(company.personalLiability) }}
                </span>
              </div>
            </div>

            <!-- Obligations -->
            <div class="pt-3 border-t border-slate-700/50 space-y-2">
              <p class="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {{ lang.t('board_risk.obligations') }}
              </p>
              <ul class="space-y-1.5 text-sm text-slate-400">
                <li *ngIf="company.nis2Status !== 'not_applicable'" class="flex items-start gap-2">
                  <span class="text-amber-400 mt-0.5">•</span>
                  {{ lang.t('board_risk.obl_nis2_training') }}
                </li>
                <li *ngIf="company.nis2Status !== 'not_applicable'" class="flex items-start gap-2">
                  <span class="text-amber-400 mt-0.5">•</span>
                  {{ lang.t('board_risk.obl_nis2_risk') }}
                </li>
                <li *ngIf="company.nis2Status !== 'not_applicable'" class="flex items-start gap-2">
                  <span class="text-amber-400 mt-0.5">•</span>
                  {{ lang.t('board_risk.obl_nis2_incident') }}
                </li>
                <li *ngIf="company.doraStatus === 'applies'" class="flex items-start gap-2">
                  <span class="text-emerald-400 mt-0.5">•</span>
                  {{ lang.t('board_risk.obl_dora_ict') }}
                </li>
                <li *ngIf="company.doraStatus === 'applies'" class="flex items-start gap-2">
                  <span class="text-emerald-400 mt-0.5">•</span>
                  {{ lang.t('board_risk.obl_dora_incident') }}
                </li>
                <li *ngIf="company.nis2Status === 'not_applicable' && company.doraStatus === 'not_applicable'"
                    class="flex items-start gap-2 text-emerald-400">
                  <span class="mt-0.5">✓</span>
                  {{ lang.t('board_risk.obl_none') }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Accordion Explanations -->
        <div class="space-y-3">
          <div *ngFor="let item of accordionItems; let i = index"
               class="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            <button
              type="button"
              (click)="toggleAccordion(i)"
              class="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-700/20 transition-colors">
              <span class="font-medium text-white flex items-center gap-2">
                <span>{{ item.icon }}</span>
                {{ lang.t(item.titleKey) }}
              </span>
              <svg class="w-5 h-5 text-slate-400 transition-transform" [class.rotate-180]="expandedAccordion === i"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <div *ngIf="expandedAccordion === i" class="px-5 pb-4 text-sm text-slate-400 leading-relaxed animate-fade-in">
              {{ lang.t(item.contentKey) }}
            </div>
          </div>
        </div>

        <!-- CTA Section -->
        <div class="space-y-6 pt-4">
          <h3 class="text-xl font-bold text-white text-center">{{ lang.t('board_risk.cta_title') }}</h3>

          <div class="grid md:grid-cols-3 gap-4">
            <!-- CTA 1 - Highlighted -->
            <div class="relative bg-slate-800/50 rounded-xl border-2 border-teal-500/50 p-5 space-y-3 animate-pulse-border">
              <div class="text-2xl">📄</div>
              <h4 class="font-semibold text-white">{{ lang.t('board_risk.cta1_title') }}</h4>
              <p class="text-sm text-slate-400">{{ lang.t('board_risk.cta1_desc') }}</p>
              <a routerLink="/pricing"
                 class="inline-flex items-center gap-1 text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors">
                {{ lang.t('board_risk.cta1_btn') }}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </a>
            </div>

            <!-- CTA 2 -->
            <div class="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 space-y-3">
              <div class="text-2xl">📊</div>
              <h4 class="font-semibold text-white">{{ lang.t('board_risk.cta2_title') }}</h4>
              <p class="text-sm text-slate-400">{{ lang.t('board_risk.cta2_desc') }}</p>
              <a routerLink="/pricing"
                 class="inline-flex items-center gap-1 text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors">
                {{ lang.t('board_risk.cta2_btn') }}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </a>
            </div>

            <!-- CTA 3 -->
            <div class="relative bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 space-y-3">
              <div class="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-[10px] font-bold text-slate-900">
                {{ lang.t('board_risk.save_badge') }}
              </div>
              <div class="text-2xl">🎯</div>
              <h4 class="font-semibold text-white">{{ lang.t('board_risk.cta3_title') }}</h4>
              <p class="text-sm text-slate-400">{{ lang.t('board_risk.cta3_desc') }}</p>
              <a routerLink="/pricing"
                 class="inline-flex items-center gap-1 text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors">
                {{ lang.t('board_risk.cta3_btn') }}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </a>
            </div>
          </div>

          <p class="text-xs text-slate-500 text-center">{{ lang.t('board_risk.cta_footer') }}</p>
        </div>
      </div>

      <!-- Info Cards (shown when no results) -->
      <div *ngIf="!results" class="grid md:grid-cols-2 gap-6">
        <div class="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h3 class="font-semibold text-white">{{ lang.t('board_risk.nis2_title') }}</h3>
          </div>
          <p class="text-sm text-slate-400 leading-relaxed">{{ lang.t('board_risk.nis2_desc') }}</p>
        </div>

        <div class="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <h3 class="font-semibold text-white">{{ lang.t('board_risk.dora_title') }}</h3>
          </div>
          <p class="text-sm text-slate-400 leading-relaxed">{{ lang.t('board_risk.dora_desc') }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
    }

    .absolute.z-50 {
      position: absolute;
      left: 0;
      right: 0;
    }

    .tabular-nums {
      font-variant-numeric: tabular-nums;
    }

    .animate-fade-in {
      animation: fadeIn 0.5s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-pulse-border {
      animation: pulseBorder 2s ease-in-out infinite;
    }

    @keyframes pulseBorder {
      0%, 100% { border-color: rgba(20, 184, 166, 0.5); box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.2); }
      50% { border-color: rgba(20, 184, 166, 0.8); box-shadow: 0 0 20px 0 rgba(20, 184, 166, 0.3); }
    }
  `]
})
export class BoardRiskComponent implements OnInit, OnDestroy {
  @ViewChild('resultsSection') resultsSection!: ElementRef;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  form: FormGroup;
  searchQuery = '';
  searchLoading = false;
  showDropdown = false;
  autocompleteResults: AutocompleteResult[] = [];
  results: RiskCalculationResult | null = null;
  expandedAccordion: number | null = null;

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

  doraSectors: Sector[] = [
    { code: 'dora_bank', nameEt: 'Pank (DORA)', nameEn: 'Bank (DORA)', type: 'dora' },
    { code: 'dora_insurance', nameEt: 'Kindlustus (DORA)', nameEn: 'Insurance (DORA)', type: 'dora' },
    { code: 'dora_payment', nameEt: 'Makseasutus (DORA)', nameEn: 'Payment Institution (DORA)', type: 'dora' },
    { code: 'dora_crypto', nameEt: 'Krüptovara teenusepakkuja (DORA)', nameEn: 'Crypto Asset Provider (DORA)', type: 'dora' },
    { code: 'dora_fund', nameEt: 'Fondivalitseja (DORA)', nameEn: 'Fund Manager (DORA)', type: 'dora' },
    { code: 'dora_ict', nameEt: 'IKT-teenusepakkuja finantssektorile (DORA)', nameEn: 'ICT Provider for Financial Sector (DORA)', type: 'dora' },
  ];

  roles = [
    { value: 'board', labelEt: 'Juhatuse liige', labelEn: 'Board Member' },
    { value: 'supervisory', labelEt: 'Nõukogu liige', labelEn: 'Supervisory Board' },
    { value: 'both', labelEt: 'Mõlemad', labelEn: 'Both' },
  ];

  accordionItems = [
    { icon: '📋', titleKey: 'board_risk.acc1_title', contentKey: 'board_risk.acc1_content' },
    { icon: '💰', titleKey: 'board_risk.acc2_title', contentKey: 'board_risk.acc2_content' },
    { icon: '⚖️', titleKey: 'board_risk.acc3_title', contentKey: 'board_risk.acc3_content' },
    { icon: '🛡️', titleKey: 'board_risk.acc4_title', contentKey: 'board_risk.acc4_content' },
  ];

  constructor(
    public lang: LangService,
    private titleService: Title,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      companies: this.fb.array([])
    });
  }

  get companies(): FormArray {
    return this.form.get('companies') as FormArray;
  }

  ngOnInit(): void {
    this.updateTitle();

    // Setup autocomplete debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
      switchMap(query => {
        if (!query || query.length < 2) {
          return of({ data: [] });
        }
        this.searchLoading = true;
        return this.http.get<{ status: string; data: AutocompleteResult[] }>(
          `/api/ariregister/autocomplete?q=${encodeURIComponent(query)}`
        ).pipe(
          catchError(() => of({ data: [] }))
        );
      })
    ).subscribe(response => {
      this.searchLoading = false;
      this.autocompleteResults = response.data || [];
      this.showDropdown = this.autocompleteResults.length > 0;
    });

    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  private onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.showDropdown = false;
    }
  }

  private updateTitle(): void {
    const title = this.lang.currentLang === 'et'
      ? 'Juhatuse riskikalkulaator | ComplianceHub'
      : 'Board Risk Calculator | ComplianceHub';
    this.titleService.setTitle(title);
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.searchSubject.next(this.searchQuery);
  }

  selectCompany(result: AutocompleteResult): void {
    const exists = this.companies.controls.some(
      c => c.get('registryCode')?.value === String(result.reg_code)
    );

    if (exists) return;

    const companyGroup = this.fb.group({
      registryCode: [String(result.reg_code)],
      name: [result.name],
      sector: ['', Validators.required],
      employees: [null, [Validators.required, Validators.min(1)]],
      revenue: [null, [Validators.required, Validators.min(1)]],
      role: ['', Validators.required]
    });

    this.companies.push(companyGroup);
    this.searchQuery = '';
    this.autocompleteResults = [];
    this.showDropdown = false;
    this.results = null; // Clear previous results
  }

  removeCompany(index: number): void {
    this.companies.removeAt(index);
    this.results = null; // Clear results when company removed
  }

  toggleAccordion(index: number): void {
    this.expandedAccordion = this.expandedAccordion === index ? null : index;
  }

  // Risk calculation logic
  calculateRisk(): void {
    if (this.form.invalid || this.companies.length === 0) {
      this.companies.controls.forEach(c => c.markAllAsTouched());
      return;
    }

    const companyResults: CompanyRiskResult[] = [];
    let totalPersonalLiability = 0;

    for (const company of this.companies.controls) {
      const data = company.value;
      const result = this.calculateCompanyRisk(data);
      companyResults.push(result);
      totalPersonalLiability += result.personalLiability;
    }

    const overallRiskLevel = this.getRiskLevel(totalPersonalLiability);

    this.results = {
      companies: companyResults,
      totalPersonalLiability,
      overallRiskLevel,
      displayValue: 0
    };

    // Animate counter
    this.animateCounter(totalPersonalLiability);

    // Smooth scroll to results
    setTimeout(() => {
      this.resultsSection?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  private calculateCompanyRisk(data: any): CompanyRiskResult {
    const { registryCode, name, sector, employees, revenue, role } = data;

    // Determine sector type
    const sectorInfo = this.getSectorInfo(sector);

    // Calculate NIS2 status
    const nis2Status = this.calculateNis2Status(sectorInfo, employees, revenue);

    // Calculate DORA status
    const doraStatus = this.calculateDoraStatus(sector);

    // Calculate fines
    const nis2Fine = this.calculateNis2Fine(nis2Status, revenue);
    const doraFine = this.calculateDoraFine(doraStatus, revenue);

    // Calculate personal liability
    const roleMultiplier = role === 'supervisory' ? 0.5 : 1.0;
    const baseLiability = Math.min((nis2Fine + doraFine) * 0.05, 500000);
    const personalLiability = Math.round(baseLiability * roleMultiplier);

    // Determine risk level
    const riskLevel = this.getRiskLevel(personalLiability);

    return {
      name,
      registryCode,
      sector,
      employees,
      revenue,
      role,
      nis2Status,
      doraStatus,
      nis2Fine,
      doraFine,
      personalLiability,
      riskLevel
    };
  }

  private getSectorInfo(sectorCode: string): { type: 'essential' | 'important' | 'dora' | 'other' } {
    if (this.essentialSectors.some(s => s.code === sectorCode)) {
      return { type: 'essential' };
    }
    if (this.importantSectors.some(s => s.code === sectorCode)) {
      return { type: 'important' };
    }
    if (this.doraSectors.some(s => s.code === sectorCode)) {
      return { type: 'dora' };
    }
    return { type: 'other' };
  }

  private calculateNis2Status(sectorInfo: { type: string }, employees: number, revenue: number): NIS2Status {
    const isEssentialSize = employees >= 250 || revenue >= 50000000;
    const isImportantSize = employees >= 50 || revenue >= 10000000;

    if (sectorInfo.type === 'essential') {
      if (isEssentialSize) return 'essential';
      if (isImportantSize) return 'important';
      return 'important'; // Annex I sector below threshold still = important
    }

    if (sectorInfo.type === 'important') {
      if (isImportantSize) return 'important';
      return 'not_applicable';
    }

    // DORA sectors may also fall under NIS2 (banking, financial)
    if (sectorInfo.type === 'dora') {
      if (isEssentialSize) return 'essential';
      if (isImportantSize) return 'important';
      return 'not_applicable';
    }

    return 'not_applicable';
  }

  private calculateDoraStatus(sectorCode: string): DORAStatus {
    if (sectorCode.startsWith('dora_')) {
      return 'applies';
    }
    if (sectorCode === 'ict_b2b' || sectorCode === 'digital_infra' || sectorCode === 'digital_providers') {
      return 'indirect';
    }
    return 'not_applicable';
  }

  private calculateNis2Fine(status: NIS2Status, revenue: number): number {
    switch (status) {
      case 'essential':
        return Math.max(10000000, revenue * 0.02);
      case 'important':
        return Math.max(7000000, revenue * 0.014);
      default:
        return 0;
    }
  }

  private calculateDoraFine(status: DORAStatus, revenue: number): number {
    switch (status) {
      case 'applies':
        return Math.max(5000000, revenue * 0.01);
      case 'indirect':
        return revenue * 0.005;
      default:
        return 0;
    }
  }

  private getRiskLevel(amount: number): RiskLevel {
    if (amount === 0) return 'low';
    if (amount <= 100000) return 'medium';
    if (amount <= 500000) return 'high';
    return 'critical';
  }

  private animateCounter(target: number): void {
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = this.easeOutQuad(currentStep / steps);
      this.results!.displayValue = Math.round(target * progress);

      if (currentStep >= steps) {
        this.results!.displayValue = target;
        clearInterval(interval);
      }
    }, stepDuration);
  }

  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  // UI helper methods
  formatNumber(value: number): string {
    return value.toLocaleString('et-EE');
  }

  getRiskEmoji(): string {
    switch (this.results?.overallRiskLevel) {
      case 'low': return '✅';
      case 'medium': return '⚠️';
      case 'high': return '🔶';
      case 'critical': return '🔴';
      default: return '';
    }
  }

  getResultBorderClass(): string {
    switch (this.results?.overallRiskLevel) {
      case 'low': return 'border-emerald-500/50 bg-emerald-500/5';
      case 'medium': return 'border-yellow-500/50 bg-yellow-500/5';
      case 'high': return 'border-orange-500/50 bg-orange-500/5';
      case 'critical': return 'border-red-500/50 bg-red-500/5 animate-pulse-border';
      default: return 'border-slate-700/50';
    }
  }

  getResultTextClass(): string {
    switch (this.results?.overallRiskLevel) {
      case 'low': return 'text-emerald-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'critical': return 'text-red-400';
      default: return 'text-white';
    }
  }

  getResultBadgeClass(): string {
    switch (this.results?.overallRiskLevel) {
      case 'low': return 'bg-emerald-500/20 text-emerald-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'critical': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-700/50 text-slate-400';
    }
  }

  getCompanyBadgeClass(level: RiskLevel): string {
    switch (level) {
      case 'low': return 'bg-emerald-500/20 text-emerald-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'critical': return 'bg-red-500/20 text-red-400';
    }
  }

  getNis2StatusClass(status: NIS2Status): string {
    switch (status) {
      case 'essential': return 'text-red-400';
      case 'important': return 'text-orange-400';
      case 'not_applicable': return 'text-emerald-400';
    }
  }

  getDoraStatusClass(status: DORAStatus): string {
    switch (status) {
      case 'applies': return 'text-red-400';
      case 'indirect': return 'text-yellow-400';
      case 'not_applicable': return 'text-emerald-400';
    }
  }
}
