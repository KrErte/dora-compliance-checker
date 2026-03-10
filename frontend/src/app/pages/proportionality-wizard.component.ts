import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LangService } from '../lang.service';
import { SubscriptionService } from '../services/subscription.service';

interface EntityTypeOption {
  code: string;
  label: string;
}

interface ArticleApplicability {
  articleRange: string;
  title: string;
  status: 'FULL' | 'SIMPLIFIED' | 'EXEMPT' | 'VOLUNTARY';
  description: string;
}

interface ProportionalityScope {
  entityType: string;
  sizeCategory: string;
  complexityLevel: string;
  simplifiedRegime: boolean;
  significant: boolean;
  articles: ArticleApplicability[];
  totalArticles: number;
  fullApply: number;
  simplified: number;
  exempted: number;
  voluntary: number;
  reductionPercentage: number;
}

interface Classification {
  id: string;
  userId: string;
  entityType: string;
  sizeCategory: string;
  employeeCount: number;
  annualRevenue: number;
  totalAssets: number;
  complexityLevel: string;
  ictSystemCount: number;
  crossBorderOperations: boolean;
  isSignificant: boolean;
  ncaDesignated: boolean;
  simplifiedRegime: boolean;
}

@Component({
  selector: 'app-proportionality-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-24 pb-16 px-4">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <a routerLink="/dashboard" class="text-sm text-slate-500 hover:text-emerald-400 transition-colors">&larr; {{ lang.t('prop.back') }}</a>
          <h1 class="text-2xl font-bold text-white mt-2">{{ lang.t('prop.title') }}</h1>
          <p class="text-slate-400 text-sm mt-1">{{ lang.t('prop.subtitle') }}</p>
        </div>

        <!-- Stepper -->
        <div class="flex items-center gap-1 mb-8">
          @for (s of steps; track s.num) {
            <button (click)="goToStep(s.num)"
                    class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
                    [class]="step === s.num ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : (s.num < step ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-800/30 text-slate-500')">
              <span class="w-6 h-6 flex items-center justify-center rounded-full text-xs"
                    [class]="s.num < step ? 'bg-emerald-500 text-white' : (step === s.num ? 'bg-emerald-500/30 text-emerald-400' : 'bg-slate-700 text-slate-500')">
                {{ s.num < step ? '&#10003;' : s.num }}
              </span>
              {{ s.label }}
            </button>
          }
        </div>

        <div class="glass-card p-6 md:p-8">
          <!-- Step 1: Entity Type -->
          @if (step === 1) {
            <h2 class="text-xl font-semibold text-white mb-2">{{ lang.t('prop.entity_type_title') }}</h2>
            <p class="text-slate-400 text-sm mb-6">{{ lang.t('prop.entity_type_desc') }}</p>

            @for (sector of sectors; track sector.name) {
              <div class="mb-6">
                <h3 class="text-sm font-semibold text-slate-400 mb-3">{{ lang.t('prop.sector_' + sector.name.toLowerCase()) }}</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                  @for (et of sector.types; track et.code) {
                    <button (click)="form.entityType = et.code"
                            class="flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all"
                            [class]="form.entityType === et.code ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 bg-slate-800/30 text-slate-300 hover:border-slate-600'">
                      <span class="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                            [class]="form.entityType === et.code ? 'bg-emerald-500/20' : 'bg-slate-700/50'">
                        {{ getSectorIcon(sector.name) }}
                      </span>
                      <span class="text-sm">{{ et.label }}</span>
                    </button>
                  }
                </div>
              </div>
            }
          }

          <!-- Step 2: Size & Financials -->
          @if (step === 2) {
            <h2 class="text-xl font-semibold text-white mb-6">{{ lang.t('prop.size_title') }}</h2>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label class="block text-sm text-slate-400 mb-1">{{ lang.t('prop.employees') }}</label>
                <input type="number" [(ngModel)]="form.employeeCount" min="0"
                       class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white"
                       (ngModelChange)="updateSizeCategory()">
              </div>
              <div>
                <label class="block text-sm text-slate-400 mb-1">{{ lang.t('prop.revenue') }}</label>
                <input type="number" [(ngModel)]="form.annualRevenue" min="0"
                       class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white"
                       (ngModelChange)="updateSizeCategory()">
              </div>
              <div>
                <label class="block text-sm text-slate-400 mb-1">{{ lang.t('prop.total_assets') }}</label>
                <input type="number" [(ngModel)]="form.totalAssets" min="0"
                       class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
              </div>
            </div>

            <!-- Auto-calculated size indicator -->
            <div class="p-4 rounded-xl border mb-4"
                 [class]="computedSize === 'MICRO' ? 'border-blue-500/30 bg-blue-500/10' :
                          (computedSize === 'SMALL' ? 'border-cyan-500/30 bg-cyan-500/10' :
                          (computedSize === 'MEDIUM' ? 'border-amber-500/30 bg-amber-500/10' : 'border-red-500/30 bg-red-500/10'))">
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                     [class]="computedSize === 'MICRO' ? 'bg-blue-500/20 text-blue-400' :
                              (computedSize === 'SMALL' ? 'bg-cyan-500/20 text-cyan-400' :
                              (computedSize === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'))">
                  {{ computedSize?.charAt(0) }}
                </div>
                <div>
                  <h3 class="text-lg font-bold text-white">{{ lang.t('prop.size_' + computedSize.toLowerCase()) }}</h3>
                  <p class="text-sm text-slate-400">
                    {{ form.employeeCount }} {{ lang.t('prop.employees').toLowerCase() }},
                    {{ (form.annualRevenue || 0) | number }} EUR {{ lang.t('prop.revenue').toLowerCase() }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Size thresholds reference -->
            <div class="grid grid-cols-4 gap-2 text-center text-xs">
              @for (size of ['MICRO', 'SMALL', 'MEDIUM', 'LARGE']; track size) {
                <div class="p-2 rounded-lg"
                     [class]="computedSize === size ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-slate-800/30 text-slate-500'">
                  <div class="font-bold mb-1">{{ lang.t('prop.size_' + size.toLowerCase()) }}</div>
                  @switch (size) {
                    @case ('MICRO') { <div>&lt;10 empl<br>&lt;2M EUR</div> }
                    @case ('SMALL') { <div>&lt;50 empl<br>&lt;10M EUR</div> }
                    @case ('MEDIUM') { <div>&lt;250 empl<br>&lt;50M EUR</div> }
                    @case ('LARGE') { <div>250+ empl<br>50M+ EUR</div> }
                  }
                </div>
              }
            </div>
          }

          <!-- Step 3: Complexity & Significance -->
          @if (step === 3) {
            <h2 class="text-xl font-semibold text-white mb-6">{{ lang.t('prop.complexity_title') }}</h2>

            <div class="space-y-5">
              <div>
                <label class="block text-sm text-slate-400 mb-1">{{ lang.t('prop.ict_systems') }}</label>
                <input type="number" [(ngModel)]="form.ictSystemCount" min="0"
                       class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
              </div>
              <div>
                <label class="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="form.crossBorderOperations" class="w-5 h-5 accent-emerald-500">
                  <span class="text-sm text-slate-300">{{ lang.t('prop.cross_border') }}</span>
                </label>
              </div>
              <div>
                <label class="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="form.ncaDesignated" class="w-5 h-5 accent-emerald-500">
                  <span class="text-sm text-slate-300">{{ lang.t('prop.nca_significant') }}</span>
                </label>
                <p class="text-xs text-slate-500 mt-1 ml-8">Determines whether TLPT (Art. 26-27) applies to your entity</p>
              </div>
            </div>

            <!-- Complexity indicator -->
            <div class="mt-6 p-4 bg-slate-800/30 rounded-lg">
              <div class="flex items-center gap-3">
                <span class="text-sm text-slate-400">Complexity:</span>
                <span class="px-3 py-1 rounded-full text-sm font-medium"
                      [class]="computedComplexity === 'SIMPLE' ? 'bg-emerald-500/20 text-emerald-400' :
                               (computedComplexity === 'MODERATE' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400')">
                  {{ computedComplexity }}
                </span>
              </div>
            </div>
          }

          <!-- Step 4: Your DORA Scope -->
          @if (step === 4) {
            @if (loading) {
              <div class="text-center py-12">
                <div class="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p class="text-slate-400">Calculating your DORA scope...</p>
              </div>
            }

            @if (scope) {
              <h2 class="text-xl font-semibold text-white mb-6">{{ lang.t('prop.scope_title') }}</h2>

              <!-- Classification Summary Card -->
              <div class="p-5 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 rounded-xl border border-emerald-500/20 mb-6">
                <h3 class="text-sm text-slate-400 mb-3">{{ lang.t('prop.classification_summary') }}</h3>
                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <div class="text-xs text-slate-500">Entity Type</div>
                    <div class="text-sm font-medium text-white">{{ getEntityLabel(scope.entityType) }}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-500">Size</div>
                    <div class="text-sm font-medium text-white">{{ scope.sizeCategory }}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-500">Complexity</div>
                    <div class="text-sm font-medium text-white">{{ scope.complexityLevel }}</div>
                  </div>
                </div>
              </div>

              <!-- Simplified regime banner -->
              @if (scope.simplifiedRegime) {
                <div class="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl mb-6">
                  <h3 class="text-blue-400 font-semibold">{{ lang.t('prop.simplified_regime') }}</h3>
                  <p class="text-sm text-slate-400 mt-1">As a micro entity, you qualify for the simplified ICT risk management framework. Fewer governance requirements and no need for a dedicated ICT officer.</p>
                </div>
              }

              <!-- Reduction highlight -->
              @if (scope.reductionPercentage > 0) {
                <div class="text-center py-4 mb-6">
                  <span class="text-4xl font-bold text-emerald-400">{{ scope.reductionPercentage | number:'1.0-0' }}%</span>
                  <span class="text-slate-400 ml-2">{{ lang.t('prop.fewer_requirements') }}</span>
                </div>
              }

              <!-- Article-by-article table -->
              <div class="space-y-2 mb-6">
                @for (article of scope.articles; track article.articleRange) {
                  <div class="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-xs text-slate-400">{{ article.articleRange }}</span>
                        <span class="text-sm text-white">{{ article.title }}</span>
                      </div>
                      <p class="text-xs text-slate-500 mt-1">{{ article.description }}</p>
                    </div>
                    <span class="ml-4 px-3 py-1 rounded-full text-xs font-bold shrink-0"
                          [class]="article.status === 'FULL' ? 'bg-emerald-500/20 text-emerald-400' :
                                   (article.status === 'SIMPLIFIED' ? 'bg-blue-500/20 text-blue-400' :
                                   (article.status === 'EXEMPT' ? 'bg-slate-500/20 text-slate-400' : 'bg-purple-500/20 text-purple-400'))">
                      {{ article.status === 'FULL' ? lang.t('prop.full_apply') :
                         (article.status === 'SIMPLIFIED' ? lang.t('prop.simplified') :
                         (article.status === 'EXEMPT' ? lang.t('prop.exempt') : lang.t('prop.voluntary'))) }}
                    </span>
                  </div>
                }
              </div>

              <!-- Summary stats -->
              <div class="grid grid-cols-4 gap-3 mb-6">
                <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center">
                  <div class="text-xl font-bold text-emerald-400">{{ scope.fullApply }}</div>
                  <div class="text-[10px] text-slate-400">{{ lang.t('prop.full_apply') }}</div>
                </div>
                <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
                  <div class="text-xl font-bold text-blue-400">{{ scope.simplified }}</div>
                  <div class="text-[10px] text-slate-400">{{ lang.t('prop.simplified') }}</div>
                </div>
                <div class="bg-slate-500/10 border border-slate-500/30 rounded-lg p-3 text-center">
                  <div class="text-xl font-bold text-slate-400">{{ scope.exempted }}</div>
                  <div class="text-[10px] text-slate-400">{{ lang.t('prop.exempt') }}</div>
                </div>
                <div class="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-center">
                  <div class="text-xl font-bold text-purple-400">{{ scope.voluntary }}</div>
                  <div class="text-[10px] text-slate-400">{{ lang.t('prop.voluntary') }}</div>
                </div>
              </div>

              <!-- Action buttons -->
              <div class="flex flex-wrap gap-3">
                <button (click)="applyToAssessment()" class="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold">
                  {{ lang.t('prop.apply_to_assessment') }}
                </button>
              </div>
            }
          }
        </div>

        <!-- Navigation -->
        <div class="flex justify-between mt-6">
          <button (click)="prevStep()" [disabled]="step === 1"
                  class="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed">
            &larr; {{ lang.t('roi.prev') }}
          </button>
          <button (click)="nextStep()"
                  class="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg font-semibold"
                  [disabled]="step === 1 && !form.entityType">
            {{ step === 4 ? lang.t('roi.finish') : lang.t('roi.next') + ' &rarr;' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .glass-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 12px;
      backdrop-filter: blur(12px);
    }
    select option { background: #1e293b; color: #e2e8f0; }
  `]
})
export class ProportionalityWizardComponent implements OnInit {
  step = 1;
  loading = false;
  scope: ProportionalityScope | null = null;
  classification: Classification | null = null;

  form: any = {
    entityType: '',
    employeeCount: 0,
    annualRevenue: 0,
    totalAssets: 0,
    ictSystemCount: 0,
    crossBorderOperations: false,
    ncaDesignated: false
  };

  computedSize = 'MICRO';
  computedComplexity = 'SIMPLE';

  sectors: { name: string; types: EntityTypeOption[] }[] = [
    { name: 'BANKING', types: [
      { code: 'CREDIT_INSTITUTION', label: 'Credit institution' },
      { code: 'PAYMENT_INSTITUTION', label: 'Payment institution' },
      { code: 'ACCOUNT_INFO_SERVICE', label: 'Account information service provider' },
      { code: 'ELECTRONIC_MONEY', label: 'Electronic money institution' }
    ]},
    { name: 'INVESTMENT', types: [
      { code: 'INVESTMENT_FIRM', label: 'Investment firm' },
      { code: 'AIFM', label: 'Alternative investment fund manager' },
      { code: 'UCITS_MANAGEMENT', label: 'UCITS management company' },
      { code: 'CROWDFUNDING', label: 'Crowdfunding service provider' }
    ]},
    { name: 'INSURANCE', types: [
      { code: 'INSURANCE', label: 'Insurance undertaking' },
      { code: 'REINSURANCE', label: 'Reinsurance undertaking' },
      { code: 'INSURANCE_INTERMEDIARY', label: 'Insurance intermediary' },
      { code: 'IORP', label: 'Institution for occupational retirement provision' }
    ]},
    { name: 'CRYPTO', types: [
      { code: 'CASP', label: 'Crypto-asset service provider' }
    ]},
    { name: 'INFRASTRUCTURE', types: [
      { code: 'CSD', label: 'Central securities depository' },
      { code: 'CCP', label: 'Central counterparty' },
      { code: 'TRADING_VENUE', label: 'Trading venue' },
      { code: 'TRADE_REPOSITORY', label: 'Trade repository' },
      { code: 'CREDIT_RATING_AGENCY', label: 'Credit rating agency' },
      { code: 'BENCHMARK_ADMIN', label: 'Benchmark administrator' },
      { code: 'SECURITISATION_REPOSITORY', label: 'Securitisation repository' }
    ]}
  ];

  entityTypeLabels: { [key: string]: string } = {};

  get steps() {
    return [
      { num: 1, label: this.lang.t('prop.step_entity_type') },
      { num: 2, label: this.lang.t('prop.step_size') },
      { num: 3, label: this.lang.t('prop.step_complexity') },
      { num: 4, label: this.lang.t('prop.step_scope') }
    ];
  }

  constructor(
    public lang: LangService,
    private http: HttpClient,
    private router: Router,
    public subscription: SubscriptionService
  ) {
    for (const sector of this.sectors) {
      for (const t of sector.types) {
        this.entityTypeLabels[t.code] = t.label;
      }
    }
  }

  ngOnInit() {
    // Try loading existing classification
    this.http.get<Classification>('/api/proportionality/classification').subscribe({
      next: (c) => {
        if (c) {
          this.classification = c;
          this.form = {
            entityType: c.entityType,
            employeeCount: c.employeeCount,
            annualRevenue: c.annualRevenue,
            totalAssets: c.totalAssets,
            ictSystemCount: c.ictSystemCount,
            crossBorderOperations: c.crossBorderOperations,
            ncaDesignated: c.ncaDesignated
          };
          this.updateSizeCategory();
        }
      },
      error: () => {}
    });
  }

  goToStep(num: number) {
    if (num <= this.step || (num === this.step + 1)) {
      this.step = num;
      if (num === 4) this.submitClassification();
    }
  }

  nextStep() {
    if (this.step === 4) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.step++;
    if (this.step === 4) this.submitClassification();
  }

  prevStep() {
    this.step = Math.max(1, this.step - 1);
  }

  updateSizeCategory() {
    const emp = this.form.employeeCount || 0;
    const rev = this.form.annualRevenue || 0;
    if (emp < 10 && rev < 2000000) this.computedSize = 'MICRO';
    else if (emp < 50 && rev < 10000000) this.computedSize = 'SMALL';
    else if (emp < 250 && rev < 50000000) this.computedSize = 'MEDIUM';
    else this.computedSize = 'LARGE';

    const ict = this.form.ictSystemCount || 0;
    if (ict <= 5 && !this.form.crossBorderOperations) this.computedComplexity = 'SIMPLE';
    else if (ict <= 20) this.computedComplexity = 'MODERATE';
    else this.computedComplexity = 'COMPLEX';
  }

  submitClassification() {
    this.loading = true;
    this.http.post<Classification>('/api/proportionality/classify', this.form).subscribe({
      next: (c) => {
        this.classification = c;
        this.http.get<ProportionalityScope>('/api/proportionality/scope').subscribe({
          next: (s) => {
            this.scope = s;
            this.loading = false;
          },
          error: () => { this.loading = false; }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  applyToAssessment() {
    this.router.navigate(['/assessment']);
  }

  getEntityLabel(code: string): string {
    return this.entityTypeLabels[code] || code;
  }

  getSectorIcon(sector: string): string {
    const icons: { [key: string]: string } = {
      'BANKING': '\u{1F3E6}',
      'INVESTMENT': '\u{1F4C8}',
      'INSURANCE': '\u{1F6E1}',
      'CRYPTO': '\u{1F4B0}',
      'INFRASTRUCTURE': '\u{2699}'
    };
    return icons[sector] || '\u{1F3E2}';
  }

  get computedComplexityDisplay() {
    this.updateSizeCategory();
    return this.computedComplexity;
  }
}
