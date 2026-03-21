import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';

type CompanySize = '' | 'small' | 'medium' | 'large' | 'enterprise';
type Sector = '' | 'banking' | 'insurance' | 'investment' | 'payment' | 'fund' | 'crypto';
type Maturity = '' | 'none' | 'basic' | 'intermediate' | 'advanced';

interface CostLine {
  key: string;
  labelEt: string;
  labelEn: string;
  base: number;
  amount: number;
}

interface CalculationResult {
  lines: CostLine[];
  totalOneTime: number;
  annualOngoing: number;
  certDiscount: number;
  totalAfterDiscount: number;
  annualAfterDiscount: number;
  potentialFine: number;
  costPerEmployee: number;
  breakEvenMonths: number;
}

@Component({
  selector: 'app-cost-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-8">
      <!-- Hero Header -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/10 via-blue-500/10 to-teal-500/10 border border-blue-200 p-8">
        <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-600/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div class="relative">
          <div class="flex items-center gap-2 mb-3">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-600 border border-blue-200">
              {{ lang.t('costcalc.unique_roi_tool') }}
            </span>
          </div>
          <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
            {{ lang.t('costcalc.dora_compliance_cost_calculator') }}
          </h1>
          <p class="text-slate-400 max-w-2xl">
            {{ lang.t('costcalc.estimate_your_organization') }}
          </p>
        </div>
      </div>

      <!-- Input Form -->
      <div class="max-w-3xl mx-auto bg-white backdrop-blur-sm rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6">
        <h2 class="text-xl font-semibold text-white flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
          {{ lang.t('costcalc.company_details') }}
        </h2>

        <!-- Company Size -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-600">
            {{ lang.t('costcalc.company_size') }} *
          </label>
          <select [(ngModel)]="companySize"
                  class="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-white
                         focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all">
            <option value="" disabled>{{ lang.t('costcalc.select_size') }}</option>
            <option value="small">{{ lang.t('costcalc.small_50_employees') }}</option>
            <option value="medium">{{ lang.t('costcalc.medium_50250_employees') }}</option>
            <option value="large">{{ lang.t('costcalc.large_2501000_employees') }}</option>
            <option value="enterprise">{{ lang.t('costcalc.enterprise_1000_employees') }}</option>
          </select>
        </div>

        <!-- Sector -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-600">
            {{ lang.t('costcalc.sector') }} *
          </label>
          <select [(ngModel)]="sector"
                  class="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-white
                         focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all">
            <option value="" disabled>{{ lang.t('costcalc.select_sector') }}</option>
            <option value="banking">{{ lang.t('costcalc.banking') }}</option>
            <option value="insurance">{{ lang.t('costcalc.insurance') }}</option>
            <option value="investment">{{ lang.t('costcalc.investment') }}</option>
            <option value="payment">{{ lang.t('costcalc.payment_services') }}</option>
            <option value="fund">{{ lang.t('costcalc.fund_management') }}</option>
            <option value="crypto">{{ lang.t('costcalc.crypto_assets') }}</option>
          </select>
        </div>

        <!-- Annual Revenue -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-600">
            {{ lang.t('costcalc.annual_revenue_eur') }} *
          </label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">&#8364;</span>
            <input type="text"
                   [value]="formatInputNumber(revenue)"
                   (input)="onRevenueInput($event)"
                   placeholder="10,000,000"
                   class="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-white
                          focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all
                          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          </div>
          <input type="range"
                 [min]="500000"
                 [max]="2000000000"
                 [step]="500000"
                 [(ngModel)]="revenue"
                 class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-primary mt-2" />
          <div class="flex justify-between text-xs text-slate-500">
            <span>&#8364;500K</span>
            <span>&#8364;2B</span>
          </div>
        </div>

        <!-- Current Maturity Level -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-slate-600">
            {{ lang.t('costcalc.current_maturity_level') }} *
          </label>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button *ngFor="let m of maturityOptions" (click)="maturity = m.value"
                    class="p-3 rounded-xl border text-center transition-all text-sm font-medium"
                    [ngClass]="maturity === m.value
                      ? 'bg-blue-100 border-blue-500/40 text-blue-600'
                      : 'bg-slate-900/30 border-slate-200 text-slate-400 hover:border-slate-500'">
              {{ lang.l(m.labelEt, m.labelEn) }}
            </button>
          </div>
          <p class="text-xs text-slate-500">
            {{ lang.t('costcalc.higher_maturity_reduces_implementation_c') }}
          </p>
        </div>

        <!-- Existing Certifications -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-slate-600">
            {{ lang.t('costcalc.existing_certifications') }}
          </label>
          <p class="text-xs text-slate-500 -mt-1">
            {{ lang.t('costcalc.existing_certifications_reduce_dora_comp') }}
          </p>
          <div class="space-y-2">
            <label *ngFor="let cert of certOptions"
                   class="flex items-center gap-3 p-3 rounded-xl bg-slate-900/30 border border-slate-200 cursor-pointer hover:border-slate-500 transition-all"
                   [ngClass]="cert.checked ? 'border-blue-200 bg-blue-50' : ''">
              <input type="checkbox" [(ngModel)]="cert.checked"
                     class="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500/20" />
              <div class="flex-1">
                <span class="text-sm text-white font-medium">{{ cert.name }}</span>
                <span class="text-xs text-slate-500 ml-2">
                  {{ lang.t('costcalc.reduces') }}{{ cert.discount }}%
                </span>
              </div>
            </label>
          </div>
        </div>

        <!-- Number of ICT Third-Party Providers -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-600">
            {{ lang.t('costcalc.number_of_ict_thirdparty_providers') }}
          </label>
          <div class="flex items-center gap-4">
            <input type="range" [min]="1" [max]="100" [(ngModel)]="providerCount"
                   class="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-primary" />
            <div class="w-16 px-3 py-2 rounded-lg bg-white border border-slate-200 text-center text-white text-sm font-medium">
              {{ providerCount }}{{ providerCount >= 100 ? '+' : '' }}
            </div>
          </div>
          <div class="flex justify-between text-xs text-slate-500">
            <span>1</span>
            <span>100+</span>
          </div>
        </div>

        <!-- Calculate Button -->
        <div class="pt-4">
          <button (click)="calculate()"
                  [disabled]="!isFormValid()"
                  class="w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
                  [ngClass]="isFormValid()
                    ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:shadow-lg cursor-pointer'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            {{ lang.t('costcalc.calculate_compliance_cost') }}
          </button>
        </div>
      </div>

      <!-- RESULTS -->
      <div *ngIf="result" class="space-y-8 animate-fade-in">

        <!-- Total Investment Hero -->
        <div class="max-w-3xl mx-auto text-center py-10 px-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-600/5 to-blue-500/5">
          <p class="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
            {{ lang.t('costcalc.estimated_total_investment') }}
          </p>
          <div class="text-5xl md:text-6xl font-bold text-blue-600 tabular-nums mb-2">
            &#8364; {{ formatNumber(result.totalAfterDiscount) }}
          </div>
          <p class="text-sm text-slate-500 mb-1">
            {{ lang.t('costcalc.onetime_implementation_cost') }}
          </p>
          <div class="mt-4 inline-flex items-center gap-4 text-sm">
            <div class="px-4 py-2 rounded-lg bg-slate-800/70">
              <span class="text-slate-400">{{ lang.t('costcalc.annual_cost') }}: </span>
              <span class="text-blue-500 font-semibold">&#8364; {{ formatNumber(result.annualAfterDiscount) }}</span>
            </div>
            <div class="px-4 py-2 rounded-lg bg-slate-800/70">
              <span class="text-slate-400">{{ lang.t('costcalc.costemployee') }}: </span>
              <span class="text-blue-500 font-semibold">&#8364; {{ formatNumber(result.costPerEmployee) }}</span>
            </div>
          </div>
        </div>

        <!-- Cost Breakdown Chart -->
        <div class="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
          <h3 class="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            {{ lang.t('costcalc.cost_breakdown') }}
          </h3>
          <div class="space-y-4">
            <div *ngFor="let line of result.lines" class="space-y-1.5">
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-600">{{ lang.l(line.labelEt, line.labelEn) }}</span>
                <span class="text-white font-medium tabular-nums">&#8364; {{ formatNumber(line.amount) }}</span>
              </div>
              <div class="h-3 bg-white rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-700 ease-out"
                     [ngClass]="getBarColor(line.key)"
                     [style.width.%]="getBarWidth(line.amount)">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Certification Savings -->
        <div *ngIf="result.certDiscount > 0" class="max-w-3xl mx-auto bg-blue-50 rounded-2xl border border-blue-200 p-6 md:p-8">
          <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            {{ lang.t('costcalc.certification_savings') }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div *ngFor="let cert of getActiveCerts()" class="p-4 rounded-xl bg-white border border-blue-200">
              <div class="text-sm font-semibold text-blue-600">{{ cert.name }}</div>
              <div class="text-xs text-slate-400 mt-1">
                {{ lang.t('costcalc.reduces_costs_by') }} ~{{ cert.discount }}%
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
            <svg class="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <div class="text-sm font-semibold text-blue-600">
                {{ lang.t('costcalc.total_savings') }}: &#8364; {{ formatNumber(result.totalOneTime - result.totalAfterDiscount) }}
              </div>
              <div class="text-xs text-slate-400">
                {{ lang.t('costcalc.thanks_to_your_existing_certifications') }}
                ({{ Math.round(result.certDiscount * 100) }}%
                {{ lang.t('costcalc.reduction') }})
              </div>
            </div>
          </div>
        </div>

        <!-- ROI Comparison: Investment vs Fine -->
        <div class="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
          <h3 class="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>
            </svg>
            {{ lang.t('costcalc.roi_investment_vs_fine_risk') }}
          </h3>

          <!-- Side by side comparison -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="p-6 rounded-xl bg-blue-50 border border-blue-200 text-center">
              <p class="text-xs uppercase tracking-wider text-slate-400 mb-2">
                {{ lang.t('costcalc.compliance_investment') }}
              </p>
              <p class="text-3xl font-bold text-blue-600 tabular-nums">
                &#8364; {{ formatNumber(result.totalAfterDiscount) }}
              </p>
              <p class="text-xs text-slate-500 mt-1">
                {{ lang.t('costcalc.onetime_first_year') }}
              </p>
            </div>
            <div class="p-6 rounded-xl bg-red-500/5 border border-red-500/20 text-center">
              <p class="text-xs uppercase tracking-wider text-slate-400 mb-2">
                {{ lang.t('costcalc.potential_fine_dora_art_5051') }}
              </p>
              <p class="text-3xl font-bold text-red-400 tabular-nums">
                &#8364; {{ formatNumber(result.potentialFine) }}
              </p>
              <p class="text-xs text-slate-500 mt-1">
                {{ lang.t('costcalc.up_to_1_avg_daily_worldwide_turnover_x_1') }}
              </p>
            </div>
          </div>

          <!-- Fine vs Investment Visual Bar -->
          <div class="space-y-3 mb-6">
            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="text-blue-600 font-medium">{{ lang.t('costcalc.investment_40') }}</span>
                <span class="text-slate-400">&#8364; {{ formatNumber(result.totalAfterDiscount + result.annualAfterDiscount) }}</span>
              </div>
              <div class="h-6 bg-white rounded-full overflow-hidden">
                <div class="h-full bg-blue-600 rounded-full transition-all duration-700"
                     [style.width.%]="getInvestmentBarPct()">
                </div>
              </div>
            </div>
            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="text-red-400 font-medium">{{ lang.t('costcalc.potential_fine') }}</span>
                <span class="text-slate-400">&#8364; {{ formatNumber(result.potentialFine) }}</span>
              </div>
              <div class="h-6 bg-white rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-700"
                     [style.width.%]="getFineBarPct()">
                </div>
              </div>
            </div>
          </div>

          <!-- ROI multiple -->
          <div class="text-center p-4 rounded-xl bg-gradient-to-r from-blue-600/10 to-blue-500/10 border border-blue-200">
            <span class="text-slate-400 text-sm">
              {{ lang.t('costcalc.return_on_investment') }}:
            </span>
            <span class="text-2xl font-bold text-blue-600 ml-2">{{ getRoiMultiple() }}x</span>
            <p class="text-xs text-slate-500 mt-1">
              {{ lang.l('Trahvirisk on ' + getRoiMultiple() + ' korda suurem kui vastavuse investeering',
                'Fine risk is ' + getRoiMultiple() + 'x greater than compliance investment') }}
            </p>
          </div>
        </div>

        <!-- Break-even Period -->
        <div class="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
          <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ lang.t('costcalc.breakeven_period') }}
          </h3>
          <div class="flex items-center gap-6">
            <!-- Timeline visual -->
            <div class="flex-1">
              <div class="relative h-4 bg-white rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-red-500 via-amber-500 to-blue-600 rounded-full transition-all duration-700"
                     [style.width.%]="Math.min(100, (result.breakEvenMonths / 36) * 100)">
                </div>
              </div>
              <div class="flex justify-between text-xs text-slate-500 mt-2">
                <span>0</span>
                <span>12 {{ lang.t('costcalc.months') }}</span>
                <span>24 {{ lang.t('costcalc.months_45') }}</span>
                <span>36 {{ lang.t('costcalc.months_46') }}</span>
              </div>
            </div>
            <div class="text-center shrink-0">
              <div class="text-3xl font-bold text-blue-500">{{ result.breakEvenMonths }}</div>
              <div class="text-xs text-slate-400">{{ lang.t('costcalc.months_47') }}</div>
            </div>
          </div>
          <p class="text-xs text-slate-500 mt-3">
            {{ lang.l('Vastavuse investeering tasub end ära ainuüksi trahvide vältimise arvelt ' + result.breakEvenMonths + ' kuu jooksul.',
              'Compliance investment pays for itself in fine avoidance alone within ' + result.breakEvenMonths + ' months.') }}
          </p>
        </div>

        <!-- Summary Stats Grid -->
        <div class="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-blue-600 tabular-nums">&#8364;{{ formatCompact(result.totalAfterDiscount) }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('costcalc.initial_investment') }}</div>
          </div>
          <div class="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-blue-500 tabular-nums">&#8364;{{ formatCompact(result.annualAfterDiscount) }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('costcalc.annual_cost_49') }}</div>
          </div>
          <div class="bg-white border border-red-500/30 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-red-400 tabular-nums">&#8364;{{ formatCompact(result.potentialFine) }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('costcalc.fine_risk') }}</div>
          </div>
          <div class="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-white tabular-nums">{{ getRoiMultiple() }}x</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('costcalc.roi_multiple') }}</div>
          </div>
        </div>

        <!-- Copy to Clipboard Button -->
        <div class="max-w-3xl mx-auto text-center">
          <button (click)="copyToClipboard()"
                  class="inline-flex items-center gap-2 px-6 py-3 rounded-xl border transition-all text-sm font-medium"
                  [ngClass]="copied
                    ? 'bg-blue-100 border-blue-500/40 text-blue-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-500/40 hover:text-blue-600'">
            <svg *ngIf="!copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
            </svg>
            <svg *ngIf="copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ copied
              ? lang.t('costcalc.copied')
              : lang.t('costcalc.download_summary') }}
          </button>
        </div>

        <!-- CTA Section -->
        <div class="max-w-3xl mx-auto bg-gradient-to-r from-blue-600/10 via-blue-500/10 to-teal-500/10 rounded-2xl border border-blue-200 p-8 text-center">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center mx-auto mb-4">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">
            {{ lang.t('costcalc.want_a_more_accurate_estimate') }}
          </h3>
          <p class="text-slate-400 text-sm mb-6 max-w-lg mx-auto">
            {{ lang.t('costcalc.start_your_free_assessment_to_get_a_pers') }}
          </p>
          <a routerLink="/assessment"
             class="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold
                    hover:bg-blue-700 hover:shadow-lg hover:shadow-lg transition-all text-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
            {{ lang.t('costcalc.start_free_assessment') }}
          </a>
          <p class="text-xs text-slate-500 mt-3">
            {{ lang.t('costcalc.no_registration_required') }}
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .slider-primary::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #06b6d4);
      cursor: pointer;
      border: 2px solid #1e293b;
    }
    .slider-primary::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #06b6d4);
      cursor: pointer;
      border: 2px solid #1e293b;
    }
    .animate-fade-in {
      animation: fadeIn 0.5s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .gradient-text {
      background: linear-gradient(135deg, #10b981, #06b6d4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  `]
})
export class CostCalculatorComponent {
  public lang = inject(LangService);
  Math = Math;

  // Form inputs
  companySize: CompanySize = '';
  sector: Sector = '';
  revenue = 10000000;
  maturity: Maturity = '';
  providerCount = 10;
  copied = false;

  maturityOptions = [
    { value: 'none' as Maturity, labelEt: 'Puudub', labelEn: 'None' },
    { value: 'basic' as Maturity, labelEt: 'Baas', labelEn: 'Basic' },
    { value: 'intermediate' as Maturity, labelEt: 'Keskmine', labelEn: 'Intermediate' },
    { value: 'advanced' as Maturity, labelEt: 'Kõrge', labelEn: 'Advanced' }
  ];

  certOptions = [
    { name: 'ISO 27001', discount: 30, checked: false },
    { name: 'SOC 2', discount: 15, checked: false },
    { name: 'PCI DSS', discount: 10, checked: false }
  ];

  result: CalculationResult | null = null;

  // Cost category base amounts (for "small" company)
  private baseCosts: { key: string; labelEt: string; labelEn: string; min: number; max: number }[] = [
    { key: 'governance', labelEt: 'Juhtimisraamistiku loomine', labelEn: 'Governance & Framework Setup', min: 15000, max: 80000 },
    { key: 'ict_risk', labelEt: 'IKT riskijuhtimise rakendamine', labelEn: 'ICT Risk Management Implementation', min: 20000, max: 150000 },
    { key: 'incident', labelEt: 'Intsidentide haldussüsteem', labelEn: 'Incident Management System', min: 10000, max: 60000 },
    { key: 'resilience', labelEt: 'Vastupidavuse testimisprogramm', labelEn: 'Resilience Testing Programme', min: 25000, max: 200000 },
    { key: 'third_party', labelEt: 'Kolmandate osapoolte riskijuhtimine', labelEn: 'Third-Party Risk Management', min: 15000, max: 100000 },
    { key: 'roi', labelEt: 'Teaberegister (RoI)', labelEn: 'Register of Information (RoI)', min: 5000, max: 30000 },
    { key: 'training', labelEt: 'Personalikoolitus ja teadlikkus', labelEn: 'Staff Training & Awareness', min: 5000, max: 40000 },
    { key: 'technology', labelEt: 'Tehnoloogia ja tööriistad', labelEn: 'Technology & Tools', min: 10000, max: 80000 },
    { key: 'consulting', labelEt: 'Väliskonsultatsioonid', labelEn: 'External Consulting', min: 20000, max: 150000 }
  ];

  isFormValid(): boolean {
    return this.companySize !== '' && this.sector !== '' && this.revenue > 0 && this.maturity !== '';
  }

  onRevenueInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/[^0-9]/g, '');
    this.revenue = parseInt(raw, 10) || 0;
  }

  formatInputNumber(value: number): string {
    if (!value) return '';
    return value.toLocaleString('en-US');
  }

  formatNumber(value: number): string {
    return Math.round(value).toLocaleString('en-US');
  }

  formatCompact(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'K';
    }
    return Math.round(value).toString();
  }

  private getSizeMultiplier(): number {
    switch (this.companySize) {
      case 'small': return 1.0;
      case 'medium': return 2.5;
      case 'large': return 5.0;
      case 'enterprise': return 10.0;
      default: return 1.0;
    }
  }

  private getMaturityDiscount(): number {
    switch (this.maturity) {
      case 'none': return 0;
      case 'basic': return 0.15;
      case 'intermediate': return 0.35;
      case 'advanced': return 0.55;
      default: return 0;
    }
  }

  private getEmployeeEstimate(): number {
    switch (this.companySize) {
      case 'small': return 30;
      case 'medium': return 150;
      case 'large': return 600;
      case 'enterprise': return 2500;
      default: return 50;
    }
  }

  private getSectorMultiplier(): number {
    // Banking and investment are more complex regulatory environments
    switch (this.sector) {
      case 'banking': return 1.2;
      case 'investment': return 1.15;
      case 'insurance': return 1.1;
      case 'payment': return 1.05;
      case 'fund': return 1.0;
      case 'crypto': return 1.1;
      default: return 1.0;
    }
  }

  calculate(): void {
    if (!this.isFormValid()) return;

    const sizeMultiplier = this.getSizeMultiplier();
    const maturityDiscount = this.getMaturityDiscount();
    const sectorMultiplier = this.getSectorMultiplier();
    const providerScale = Math.min(3.0, 1.0 + (this.providerCount - 1) * 0.02);

    const lines: CostLine[] = this.baseCosts.map(c => {
      // For each category, interpolate between min and max based on size multiplier
      // Small = closer to min, Enterprise = closer to max
      const sizeFraction = (sizeMultiplier - 1.0) / 9.0; // 0 for small, 1 for enterprise
      let base = c.min + (c.max - c.min) * sizeFraction;

      // Apply sector multiplier
      base *= sectorMultiplier;

      // Scale third-party costs by provider count
      if (c.key === 'third_party') {
        base *= providerScale;
      }

      // Resilience testing includes TLPT for large and enterprise
      if (c.key === 'resilience' && (this.companySize === 'large' || this.companySize === 'enterprise')) {
        base *= 1.3; // TLPT surcharge
      }

      // Apply maturity discount (higher maturity = less work needed)
      const amount = base * (1 - maturityDiscount);

      return {
        key: c.key,
        labelEt: c.labelEt,
        labelEn: c.labelEn,
        base: Math.round(base),
        amount: Math.round(amount)
      };
    });

    const totalOneTime = lines.reduce((sum, l) => sum + l.amount, 0);

    // Ongoing annual = 30-40% of initial (35% average, higher for larger firms)
    const annualPct = this.companySize === 'enterprise' ? 0.40
      : this.companySize === 'large' ? 0.37
      : this.companySize === 'medium' ? 0.34
      : 0.30;
    const annualOngoing = totalOneTime * annualPct;

    // Certification discount
    const totalCertDiscount = this.certOptions
      .filter(c => c.checked)
      .reduce((sum, c) => sum + c.discount, 0);
    // Cap combined discount at 45%
    const certDiscount = Math.min(totalCertDiscount, 45) / 100;

    const totalAfterDiscount = totalOneTime * (1 - certDiscount);
    const annualAfterDiscount = annualOngoing * (1 - certDiscount);

    // DORA Art. 50-51 fine: up to 1% of average daily worldwide turnover * 180 days (6 months)
    // For repeated violations
    const dailyTurnover = this.revenue / 365;
    const potentialFine = dailyTurnover * 0.01 * 180;

    const employees = this.getEmployeeEstimate();
    const costPerEmployee = totalAfterDiscount / employees;

    // Break-even: how many months until the fine risk "covers" the investment
    // Monthly risk = potentialFine / 12 (annualized risk)
    const monthlyFineRisk = potentialFine / 12;
    const totalFirstYear = totalAfterDiscount + annualAfterDiscount;
    const breakEvenMonths = monthlyFineRisk > 0 ? Math.ceil(totalFirstYear / monthlyFineRisk) : 36;

    this.result = {
      lines,
      totalOneTime,
      annualOngoing,
      certDiscount,
      totalAfterDiscount,
      annualAfterDiscount,
      potentialFine,
      costPerEmployee,
      breakEvenMonths: Math.min(breakEvenMonths, 36)
    };

    // Scroll to results after a brief delay
    setTimeout(() => {
      const el = document.getElementById('cost-results');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  getBarWidth(amount: number): number {
    if (!this.result) return 0;
    const maxAmount = Math.max(...this.result.lines.map(l => l.amount));
    return maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
  }

  getBarColor(key: string): string {
    const colors: Record<string, string> = {
      governance: 'bg-blue-600',
      ict_risk: 'bg-blue-600',
      incident: 'bg-blue-500',
      resilience: 'bg-violet-500',
      third_party: 'bg-amber-500',
      roi: 'bg-teal-500',
      training: 'bg-indigo-500',
      technology: 'bg-pink-500',
      consulting: 'bg-orange-500'
    };
    return colors[key] || 'bg-blue-600';
  }

  getInvestmentBarPct(): number {
    if (!this.result) return 0;
    const investment = this.result.totalAfterDiscount + this.result.annualAfterDiscount;
    const maxVal = Math.max(investment, this.result.potentialFine);
    return maxVal > 0 ? (investment / maxVal) * 100 : 0;
  }

  getFineBarPct(): number {
    if (!this.result) return 0;
    const investment = this.result.totalAfterDiscount + this.result.annualAfterDiscount;
    const maxVal = Math.max(investment, this.result.potentialFine);
    return maxVal > 0 ? (this.result.potentialFine / maxVal) * 100 : 0;
  }

  getRoiMultiple(): string {
    if (!this.result) return '0';
    const investment = this.result.totalAfterDiscount + this.result.annualAfterDiscount;
    if (investment <= 0) return '0';
    const multiple = this.result.potentialFine / investment;
    return multiple.toFixed(1);
  }

  getActiveCerts(): { name: string; discount: number; checked: boolean }[] {
    return this.certOptions.filter(c => c.checked);
  }

  async copyToClipboard(): Promise<void> {
    if (!this.result) return;

    const t = (key: string) => this.lang.t(key);
    const sizeLabel: Record<string, string> = {
      small: t('costcalc.size_small'), medium: t('costcalc.size_medium'),
      large: t('costcalc.size_large'), enterprise: t('costcalc.size_enterprise')
    };
    const sectorLabel: Record<string, string> = {
      banking: t('costcalc.sector_banking'), insurance: t('costcalc.sector_insurance'),
      investment: t('costcalc.sector_investment'), payment: t('costcalc.sector_payment'),
      fund: t('costcalc.sector_fund'), crypto: t('costcalc.sector_crypto')
    };

    const lines = [
      t('costcalc.report_title'),
      `${t('costcalc.company_size_label')}: ${sizeLabel[this.companySize] || this.companySize}`,
      `${t('costcalc.sector_label')}: ${sectorLabel[this.sector] || this.sector}`,
      `${t('costcalc.revenue_label')}: EUR ${this.formatNumber(this.revenue)}`,
      `${t('costcalc.providers_label')}: ${this.providerCount}`,
      '',
      t('costcalc.breakdown_title'),
      ...this.result.lines.map(l =>
        `${this.lang.l(l.labelEt, l.labelEn)}: EUR ${this.formatNumber(l.amount)}`
      ),
      '',
      `${t('costcalc.onetime')}: EUR ${this.formatNumber(this.result.totalAfterDiscount)}`,
      `${t('costcalc.annual')}: EUR ${this.formatNumber(this.result.annualAfterDiscount)}`,
      `${t('costcalc.per_employee')}: EUR ${this.formatNumber(this.result.costPerEmployee)}`,
      '',
      `${t('costcalc.potential_fine_detail')}: EUR ${this.formatNumber(this.result.potentialFine)}`,
      `${t('costcalc.roi_multiple')}: ${this.getRoiMultiple()}x`,
      `${t('costcalc.breakeven')}: ${this.result.breakEvenMonths} ${t('costcalc.months')}`,
      '',
      t('costcalc.generated')
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      this.copied = true;
      setTimeout(() => { this.copied = false; }, 2500);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = lines.join('\n');
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.copied = true;
      setTimeout(() => { this.copied = false; }, 2500);
    }
  }
}
