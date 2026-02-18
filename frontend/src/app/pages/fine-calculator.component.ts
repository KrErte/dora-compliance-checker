import { Component, OnInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Title, Meta } from '@angular/platform-browser';
import { LangService } from '../lang.service';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface FineResult {
  minFine: number;
  maxFine: number;
  likelyMin: number;
  likelyMax: number;
  riskLevel: RiskLevel;
  riskScore: number;
  gaps: string[];
  displayValue: number;
}

@Component({
  selector: 'app-fine-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-8">
      <!-- Hero Header -->
      <div class="text-center space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
          <span class="text-base">⚠️</span>
          <span class="text-xs font-medium text-red-400">{{ lang.t('fine.badge') }}</span>
        </div>
        <h1 class="text-3xl md:text-4xl font-bold gradient-text">{{ lang.t('fine.title') }}</h1>
        <p class="text-slate-400 max-w-2xl mx-auto leading-relaxed">{{ lang.t('fine.subtitle') }}</p>
      </div>

      <!-- Progress Bar -->
      <div class="max-w-2xl mx-auto">
        <div class="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>{{ lang.t('fine.progress') }}</span>
          <span>{{ getProgress() }}%</span>
        </div>
        <div class="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500 rounded-full"
               [style.width.%]="getProgress()"></div>
        </div>
      </div>

      <!-- Main Form -->
      <div class="max-w-2xl mx-auto bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 md:p-8 space-y-6">

        <!-- Company Type -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-300">{{ lang.t('fine.company_type') }} *</label>
          <select [(ngModel)]="companyType"
                  class="w-full px-4 py-3 rounded-xl bg-slate-900/50 border text-white
                         focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all"
                  [ngClass]="showValidation && !companyType ? 'border-red-500/60' : 'border-slate-600/50'">
            <option value="" disabled>{{ lang.t('fine.select_type') }}</option>
            <option value="credit">{{ lang.t('fine.type_credit') }}</option>
            <option value="investment">{{ lang.t('fine.type_investment') }}</option>
            <option value="payment">{{ lang.t('fine.type_payment') }}</option>
            <option value="insurance">{{ lang.t('fine.type_insurance') }}</option>
            <option value="ict_provider">{{ lang.t('fine.type_ict_provider') }}</option>
            <option value="other_financial">{{ lang.t('fine.type_other_financial') }}</option>
          </select>
        </div>

        <!-- Revenue -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-300">{{ lang.t('fine.revenue') }} *</label>
          <div class="relative">
            <input type="text"
                   [value]="formatInputNumber(revenue)"
                   (input)="onRevenueInput($event)"
                   placeholder="10,000,000"
                   class="w-full px-4 py-3 pr-16 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white
                          focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all
                          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">EUR</span>
          </div>
          <p class="text-xs text-slate-500">{{ lang.t('fine.revenue_hint') }}</p>

          <!-- Revenue Slider -->
          <div class="pt-2">
            <input type="range"
                   [min]="100000"
                   [max]="1000000000"
                   [step]="100000"
                   [(ngModel)]="revenue"
                   class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-red" />
            <div class="flex justify-between text-xs text-slate-500 mt-1">
              <span>€100K</span>
              <span>€1B</span>
            </div>
          </div>
        </div>

        <!-- Employees -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-300">{{ lang.t('fine.employees') }} *</label>
          <input type="number"
                 [(ngModel)]="employees"
                 min="1"
                 placeholder="50"
                 class="w-full px-4 py-3 rounded-xl bg-slate-900/50 border text-white
                        focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all
                        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                 [ngClass]="showValidation && (!employees || employees <= 0) ? 'border-red-500/60' : 'border-slate-600/50'" />
          <p class="text-xs text-slate-500">{{ lang.t('fine.employees_hint') }}</p>
        </div>

        <!-- Country -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-300">{{ lang.t('fine.country') }} *</label>
          <select [(ngModel)]="country"
                  class="w-full px-4 py-3 rounded-xl bg-slate-900/50 border text-white
                         focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all"
                  [ngClass]="showValidation && !country ? 'border-red-500/60' : 'border-slate-600/50'">
            <option value="" disabled>{{ lang.t('fine.select_country') }}</option>
            <option value="EE">{{ lang.t('fine.country_ee') }}</option>
            <option value="PL">{{ lang.t('fine.country_pl') }}</option>
            <option value="LV">{{ lang.t('fine.country_lv') }}</option>
            <option value="LT">{{ lang.t('fine.country_lt') }}</option>
            <option value="OTHER">{{ lang.t('fine.country_other') }}</option>
          </select>
        </div>

        <!-- Compliance Questions Section -->
        <div class="pt-4 border-t border-slate-700/50 space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-white">{{ lang.t('fine.compliance_section') }}</h3>
            <p class="text-sm text-slate-500">{{ lang.t('fine.compliance_hint') }}</p>
          </div>

          <!-- Question 1 -->
          <div class="p-4 rounded-xl bg-slate-900/30 border space-y-3"
               [ngClass]="showValidation && q1 === null ? 'border-red-500/40' : 'border-slate-700/30'">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <p class="text-sm font-medium text-white">{{ lang.t('fine.q1') }}</p>
                <p class="text-xs text-slate-500 mt-1">{{ lang.t('fine.q1_article') }}</p>
              </div>
              <div class="flex gap-2">
                <button (click)="q1 = true"
                        [class]="q1 === true ? 'px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-sm font-medium' : 'px-4 py-2 rounded-lg bg-slate-800 border border-slate-600/50 text-slate-400 text-sm font-medium hover:border-slate-500'">
                  {{ lang.t('fine.yes') }}
                </button>
                <button (click)="q1 = false"
                        [class]="q1 === false ? 'px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-medium' : 'px-4 py-2 rounded-lg bg-slate-800 border border-slate-600/50 text-slate-400 text-sm font-medium hover:border-slate-500'">
                  {{ lang.t('fine.no') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Question 2 -->
          <div class="p-4 rounded-xl bg-slate-900/30 border space-y-3"
               [ngClass]="showValidation && q2 === null ? 'border-red-500/40' : 'border-slate-700/30'">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <p class="text-sm font-medium text-white">{{ lang.t('fine.q2') }}</p>
                <p class="text-xs text-slate-500 mt-1">{{ lang.t('fine.q2_article') }}</p>
              </div>
              <div class="flex gap-2">
                <button (click)="q2 = true"
                        [class]="q2 === true ? 'px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-sm font-medium' : 'px-4 py-2 rounded-lg bg-slate-800 border border-slate-600/50 text-slate-400 text-sm font-medium hover:border-slate-500'">
                  {{ lang.t('fine.yes') }}
                </button>
                <button (click)="q2 = false"
                        [class]="q2 === false ? 'px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-medium' : 'px-4 py-2 rounded-lg bg-slate-800 border border-slate-600/50 text-slate-400 text-sm font-medium hover:border-slate-500'">
                  {{ lang.t('fine.no') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Question 3 -->
          <div class="p-4 rounded-xl bg-slate-900/30 border space-y-3"
               [ngClass]="showValidation && q3 === null ? 'border-red-500/40' : 'border-slate-700/30'">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <p class="text-sm font-medium text-white">{{ lang.t('fine.q3') }}</p>
                <p class="text-xs text-slate-500 mt-1">{{ lang.t('fine.q3_article') }}</p>
              </div>
              <div class="flex gap-2">
                <button (click)="q3 = true"
                        [class]="q3 === true ? 'px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-sm font-medium' : 'px-4 py-2 rounded-lg bg-slate-800 border border-slate-600/50 text-slate-400 text-sm font-medium hover:border-slate-500'">
                  {{ lang.t('fine.yes') }}
                </button>
                <button (click)="q3 = false"
                        [class]="q3 === false ? 'px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-medium' : 'px-4 py-2 rounded-lg bg-slate-800 border border-slate-600/50 text-slate-400 text-sm font-medium hover:border-slate-500'">
                  {{ lang.t('fine.no') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Question 4 -->
          <div class="p-4 rounded-xl bg-slate-900/30 border space-y-3"
               [ngClass]="showValidation && q4 === null ? 'border-red-500/40' : 'border-slate-700/30'">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <p class="text-sm font-medium text-white">{{ lang.t('fine.q4') }}</p>
                <p class="text-xs text-slate-500 mt-1">{{ lang.t('fine.q4_article') }}</p>
              </div>
              <div class="flex gap-2">
                <button (click)="q4 = true"
                        [class]="q4 === true ? 'px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-sm font-medium' : 'px-4 py-2 rounded-lg bg-slate-800 border border-slate-600/50 text-slate-400 text-sm font-medium hover:border-slate-500'">
                  {{ lang.t('fine.yes') }}
                </button>
                <button (click)="q4 = false"
                        [class]="q4 === false ? 'px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-medium' : 'px-4 py-2 rounded-lg bg-slate-800 border border-slate-600/50 text-slate-400 text-sm font-medium hover:border-slate-500'">
                  {{ lang.t('fine.no') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Validation Message -->
        <div *ngIf="showValidation && !isFormValid()" class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {{ lang.t('fine.validation_error') }}
        </div>

        <!-- Calculate Button -->
        <div class="pt-4">
          <button (click)="calculate()"
                  class="w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2
                         bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400
                         text-white hover:shadow-lg hover:shadow-red-500/25"
                  [class.animate-shake]="shakeButton">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            {{ lang.t('fine.calculate_btn') }}
          </button>
        </div>
      </div>

      <!-- RESULTS SECTION -->
      <div #resultsSection id="fine-results" *ngIf="result" class="space-y-8 animate-fade-in">

        <!-- Hero Number -->
        <div class="max-w-2xl mx-auto text-center py-10 px-6 rounded-2xl border-2 transition-all"
             [ngClass]="getResultBorderClass()">
          <p class="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
            {{ lang.t('fine.result_title') }}
          </p>
          <div class="text-5xl md:text-7xl font-bold tabular-nums mb-4"
               [ngClass]="getResultTextClass()">
            € {{ formatNumber(result.displayValue) }}
          </div>
          <p class="text-sm text-slate-500 mb-2">{{ lang.t('fine.result_range') }}</p>
          <p class="text-lg text-slate-300">
            € {{ formatNumber(result.likelyMin) }} — € {{ formatNumber(result.likelyMax) }}
          </p>
          <div class="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full"
               [ngClass]="getResultBadgeClass()">
            <span class="text-lg">{{ getRiskEmoji() }}</span>
            <span class="text-sm font-bold">{{ lang.t('fine.risk_' + result.riskLevel) }}</span>
          </div>
        </div>

        <!-- Fine Range Breakdown -->
        <div class="max-w-2xl mx-auto bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <div class="grid grid-cols-2 gap-6">
            <div class="text-center p-4 rounded-lg bg-slate-900/30">
              <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">{{ lang.t('fine.result_min') }}</p>
              <p class="text-2xl font-bold text-slate-300">€ {{ formatNumber(result.minFine) }}</p>
            </div>
            <div class="text-center p-4 rounded-lg bg-slate-900/30">
              <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">{{ lang.t('fine.result_max') }}</p>
              <p class="text-2xl font-bold text-red-400">€ {{ formatNumber(result.maxFine) }}</p>
            </div>
          </div>
        </div>

        <!-- Gaps Section -->
        <div *ngIf="result.gaps.length > 0" class="max-w-2xl mx-auto space-y-4">
          <h3 class="text-lg font-semibold text-white flex items-center gap-2">
            <span class="text-red-400">⚠️</span>
            {{ lang.t('fine.gaps_title') }}
          </h3>

          <div *ngFor="let gap of result.gaps"
               class="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
            <p class="text-sm text-slate-300 leading-relaxed">{{ lang.t('fine.gap_' + gap) }}</p>
          </div>
        </div>

        <!-- Legal Basis Info -->
        <div class="max-w-2xl mx-auto p-5 rounded-xl border border-slate-700/50 bg-slate-800/30">
          <h4 class="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span>📋</span>
            {{ lang.t('fine.legal_basis') }}
          </h4>
          <div class="space-y-2 text-sm text-slate-400">
            <p *ngIf="companyType !== 'ict_provider'">{{ lang.t('fine.legal_basis_financial') }}</p>
            <p *ngIf="companyType === 'ict_provider'">{{ lang.t('fine.legal_basis_ict') }}</p>
          </div>
        </div>

        <!-- CTA Section -->
        <div class="max-w-2xl mx-auto space-y-6">
          <div class="grid md:grid-cols-2 gap-4">

            <!-- CTA: Assessment -->
            <a routerLink="/assessment"
               class="block p-5 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-teal-500/50 transition-all group">
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0 group-hover:bg-teal-500/20 transition-colors">
                  <span class="text-2xl">📊</span>
                </div>
                <div>
                  <h4 class="font-semibold text-white group-hover:text-teal-400 transition-colors">{{ lang.t('fine.cta_assessment') }}</h4>
                  <p class="text-sm text-slate-500 mt-1">{{ lang.t('fine.cta_assessment_desc') }}</p>
                </div>
              </div>
            </a>

            <!-- CTA: Contract Analysis -->
            <a routerLink="/contract-analysis"
               class="block p-5 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-teal-500/50 transition-all group">
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
                  <span class="text-2xl">📄</span>
                </div>
                <div>
                  <h4 class="font-semibold text-white group-hover:text-amber-400 transition-colors">{{ lang.t('fine.cta_contract') }}</h4>
                  <p class="text-sm text-slate-500 mt-1">{{ lang.t('fine.cta_contract_desc') }}</p>
                </div>
              </div>
            </a>
          </div>

          <!-- Email Gate for PDF -->
          <div class="p-6 rounded-xl border-2 border-dashed border-slate-700/50 bg-slate-800/30">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <span class="text-2xl">📥</span>
              </div>
              <div class="flex-1">
                <h4 class="font-semibold text-white">{{ lang.t('fine.cta_pdf') }}</h4>
                <p class="text-sm text-slate-500 mt-1 mb-4">{{ lang.t('fine.cta_pdf_desc') }}</p>

                <div *ngIf="!emailSent" class="flex gap-2">
                  <input type="email"
                         [(ngModel)]="email"
                         [placeholder]="lang.t('fine.email_placeholder')"
                         class="flex-1 px-4 py-2.5 rounded-lg bg-slate-900/50 border border-slate-600/50 text-white text-sm
                                focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all" />
                  <button (click)="submitEmail()"
                          [disabled]="!isValidEmail() || emailLoading"
                          class="px-5 py-2.5 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-medium transition-all
                                 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    <svg *ngIf="emailLoading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    {{ lang.t('fine.email_submit') }}
                  </button>
                </div>
                <div *ngIf="emailSent" class="flex items-center gap-2 text-emerald-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span class="text-sm font-medium">{{ lang.t('fine.email_success') }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- LinkedIn Share -->
          <div class="text-center">
            <button (click)="shareLinkedIn()"
                    class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0077B5]/20 border border-[#0077B5]/40 text-[#0077B5] hover:bg-[#0077B5]/30 transition-all">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              {{ lang.t('fine.share_linkedin') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Info Section (when no results) -->
      <div *ngIf="!result" class="max-w-2xl mx-auto">
        <div class="p-6 rounded-xl border border-slate-700/50 bg-slate-800/30">
          <h4 class="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span>💡</span>
            {{ lang.t('fine.info_title') }}
          </h4>
          <p class="text-sm text-slate-400 leading-relaxed">{{ lang.t('fine.info_desc') }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .tabular-nums {
      font-variant-numeric: tabular-nums;
    }

    .animate-fade-in {
      animation: fadeIn 0.6s ease-out forwards;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-shake {
      animation: shake 0.5s ease-in-out;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }

    .slider-red::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
      cursor: pointer;
      border: 2px solid #1e293b;
    }

    .slider-red::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
      cursor: pointer;
      border: 2px solid #1e293b;
    }
  `]
})
export class FineCalculatorComponent implements OnInit {
  @ViewChild('resultsSection') resultsSection!: ElementRef;

  companyType = '';
  revenue = 10000000;
  employees: number | null = null;
  country = '';
  q1: boolean | null = null;
  q2: boolean | null = null;
  q3: boolean | null = null;
  q4: boolean | null = null;

  result: FineResult | null = null;
  email = '';
  emailLoading = false;
  emailSent = false;
  showValidation = false;
  shakeButton = false;

  constructor(
    public lang: LangService,
    private titleService: Title,
    private meta: Meta,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.updateMeta();
  }

  private updateMeta(): void {
    const title = this.lang.currentLang === 'et'
      ? 'DORA Trahvikalkulaator — Arvuta oma potentsiaalne trahv | DoraAudit.eu'
      : 'DORA Fine Calculator — Calculate Your Potential Penalty | DoraAudit.eu';
    const description = this.lang.currentLang === 'et'
      ? 'Arvuta oma ettevõtte potentsiaalne DORA trahvirisk 2 minutiga. Põhineb DORA määruse artiklitel 50-51.'
      : 'Calculate your company\'s potential DORA fine risk in 2 minutes. Based on DORA regulation articles 50-51.';

    this.titleService.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
  }

  getProgress(): number {
    let filled = 0;
    if (this.companyType) filled++;
    if (this.revenue > 0) filled++;
    if (this.employees && this.employees > 0) filled++;
    if (this.country) filled++;
    if (this.q1 !== null) filled++;
    if (this.q2 !== null) filled++;
    if (this.q3 !== null) filled++;
    if (this.q4 !== null) filled++;
    return Math.round((filled / 8) * 100);
  }

  isFormValid(): boolean {
    return !!this.companyType &&
           this.revenue > 0 &&
           !!this.employees && this.employees > 0 &&
           !!this.country &&
           this.q1 !== null &&
           this.q2 !== null &&
           this.q3 !== null &&
           this.q4 !== null;
  }

  formatInputNumber(value: number): string {
    if (!value) return '';
    return value.toLocaleString('en-US');
  }

  onRevenueInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^0-9]/g, '');
    this.revenue = parseInt(value) || 0;
  }

  formatNumber(value: number): string {
    return value.toLocaleString('et-EE');
  }

  calculate(): void {
    if (!this.isFormValid()) {
      this.showValidation = true;
      this.shakeButton = true;
      setTimeout(() => this.shakeButton = false, 500);
      return;
    }
    this.showValidation = false;

    // Calculate base fine based on company type
    let minFine: number;
    let maxFine: number;

    if (this.companyType === 'ict_provider') {
      // Critical ICT providers: up to €5,000,000
      minFine = 100000;
      maxFine = 5000000;
    } else {
      // Financial entities: up to 2% of turnover or at least €1,000,000
      const twoPercentRevenue = this.revenue * 0.02;
      minFine = 1000000;
      maxFine = Math.max(twoPercentRevenue, 1000000);
    }

    // Calculate risk score based on compliance gaps
    const gaps: string[] = [];
    let riskScore = 0;

    if (this.q1 === false) {
      gaps.push('q1');
      riskScore += 30;
    }
    if (this.q2 === false) {
      gaps.push('q2');
      riskScore += 25;
    }
    if (this.q3 === false) {
      gaps.push('q3');
      riskScore += 25;
    }
    if (this.q4 === false) {
      gaps.push('q4');
      riskScore += 20;
    }

    // Determine risk level
    let riskLevel: RiskLevel;
    if (riskScore >= 75) {
      riskLevel = 'critical';
    } else if (riskScore >= 50) {
      riskLevel = 'high';
    } else if (riskScore >= 25) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    // Calculate likely range based on risk score
    const riskMultiplier = riskScore / 100;
    const likelyMin = Math.round(minFine + (maxFine - minFine) * riskMultiplier * 0.3);
    const likelyMax = Math.round(minFine + (maxFine - minFine) * riskMultiplier * 0.8);

    this.result = {
      minFine,
      maxFine,
      likelyMin,
      likelyMax,
      riskLevel,
      riskScore,
      gaps,
      displayValue: 0
    };

    console.log('Fine Calculator result:', this.result);

    // Force Angular to create the results DOM immediately
    this.cdr.detectChanges();

    // Animate the counter
    this.animateCounter(likelyMax);

    // Save to backend
    this.saveResult();

    // Scroll to results after DOM is ready
    setTimeout(() => {
      const el = this.resultsSection?.nativeElement || document.getElementById('fine-results');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  }

  private animateCounter(target: number): void {
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = this.easeOutQuad(currentStep / steps);
      this.result!.displayValue = Math.round(target * progress);

      if (currentStep >= steps) {
        this.result!.displayValue = target;
        clearInterval(interval);
      }
    }, stepDuration);
  }

  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  private saveResult(): void {
    const data = {
      companyType: this.companyType,
      revenue: this.revenue,
      employees: this.employees,
      country: this.country,
      riskAnswers: {
        q1: this.q1,
        q2: this.q2,
        q3: this.q3,
        q4: this.q4
      },
      calculatedFineMin: this.result?.minFine,
      calculatedFineMax: this.result?.maxFine,
      riskLevel: this.result?.riskLevel
    };

    this.http.post('/api/fine-calculator', data).subscribe({
      error: () => {} // Silently fail
    });
  }

  isValidEmail(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  submitEmail(): void {
    if (!this.isValidEmail() || !this.result) return;

    this.emailLoading = true;

    const data = {
      email: this.email,
      companyType: this.companyType,
      revenue: this.revenue,
      employees: this.employees,
      country: this.country,
      riskAnswers: {
        q1: this.q1,
        q2: this.q2,
        q3: this.q3,
        q4: this.q4
      },
      calculatedFineMin: this.result.minFine,
      calculatedFineMax: this.result.maxFine,
      riskLevel: this.result.riskLevel,
      language: this.lang.currentLang
    };

    this.http.post('/api/fine-calculator/report', data).subscribe({
      next: () => {
        this.emailSent = true;
        this.emailLoading = false;
      },
      error: () => {
        this.emailLoading = false;
      }
    });
  }

  shareLinkedIn(): void {
    const text = this.lang.currentLang === 'et'
      ? `Meie potentsiaalne DORA trahvirisk: €${this.formatNumber(this.result?.likelyMax || 0)}. Kontrolli enda oma:`
      : `Our potential DORA fine risk: €${this.formatNumber(this.result?.likelyMax || 0)}. Check yours:`;
    const url = 'https://doraaudit.eu/fine-calculator';
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`, '_blank');
  }

  getRiskEmoji(): string {
    switch (this.result?.riskLevel) {
      case 'low': return '✅';
      case 'medium': return '⚠️';
      case 'high': return '🔶';
      case 'critical': return '🔴';
      default: return '';
    }
  }

  getResultBorderClass(): string {
    switch (this.result?.riskLevel) {
      case 'low': return 'border-emerald-500/50 bg-emerald-500/5';
      case 'medium': return 'border-yellow-500/50 bg-yellow-500/5';
      case 'high': return 'border-orange-500/50 bg-orange-500/5';
      case 'critical': return 'border-red-500/50 bg-red-500/5';
      default: return 'border-slate-700/50';
    }
  }

  getResultTextClass(): string {
    switch (this.result?.riskLevel) {
      case 'low': return 'text-emerald-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'critical': return 'text-red-400';
      default: return 'text-white';
    }
  }

  getResultBadgeClass(): string {
    switch (this.result?.riskLevel) {
      case 'low': return 'bg-emerald-500/20 text-emerald-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'critical': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-700/50 text-slate-400';
    }
  }
}
