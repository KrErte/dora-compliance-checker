import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, IctProvider } from '../api.service';
import { LangService } from '../lang.service';

interface WizardQuestion {
  key: string;
  options: { label: string; value: number }[];
}

@Component({
  selector: 'app-vendor-categorization',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-500/20 text-blue-500 text-xs font-medium mb-4">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          DORA Art. 36-37
        </div>
        <h1 class="text-3xl font-bold text-white mb-3">{{ lang.t('vendorcat.title') }}</h1>
        <p class="text-slate-400 max-w-2xl mx-auto">{{ lang.t('vendorcat.subtitle') }}</p>
      </div>

      <!-- Step indicator -->
      <div class="flex items-center justify-center gap-2">
        @for (s of steps; track s; let i = $index) {
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                 [class]="currentStep() > i ? 'bg-blue-100 text-blue-600 border border-blue-200' :
                          currentStep() === i ? 'bg-blue-600/20 text-blue-500 border border-blue-500/30' :
                          'bg-slate-700/50 text-slate-500 border border-slate-200'">
              @if (currentStep() > i) {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              } @else {
                {{ i + 1 }}
              }
            </div>
            <span class="text-xs hidden sm:block" [class]="currentStep() === i ? 'text-white font-medium' : 'text-slate-500'">{{ lang.t(s) }}</span>
            @if (i < steps.length - 1) {
              <div class="w-8 h-0.5" [class]="currentStep() > i ? 'bg-blue-600/30' : 'bg-slate-700'"></div>
            }
          </div>
        }
      </div>

      <!-- Step 0: Select vendor -->
      @if (currentStep() === 0) {
        <div class="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-6">
          <h2 class="text-lg font-semibold text-white mb-4">{{ lang.t('vendorcat.select_provider') }}</h2>

          @if (providers().length > 0) {
            <div class="mb-4">
              <label class="block text-sm font-medium text-slate-600 mb-2">{{ lang.t('vendorcat.existing_provider') }}</label>
              <select [(ngModel)]="selectedProviderId"
                      class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-white focus:outline-none focus:border-blue-500/50">
                <option value="">{{ lang.t('vendorcat.choose') }}</option>
                @for (p of providers(); track p.id) {
                  <option [value]="p.id">{{ p.providerName }} ({{ p.serviceType }})</option>
                }
              </select>
            </div>
            <div class="text-center text-slate-500 text-sm my-4">{{ lang.t('vendorcat.or_add_new') }}</div>
          }

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1">{{ lang.t('vendorcat.new_name') }}</label>
              <input [(ngModel)]="newVendorName" type="text"
                     class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                     placeholder="AWS, Microsoft Azure, Telia...">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1">{{ lang.t('vendorcat.new_service') }}</label>
              <select [(ngModel)]="newVendorService"
                      class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-white focus:outline-none focus:border-blue-500/50">
                <option value="Cloud">Cloud</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Software">Software</option>
                <option value="Data">Data</option>
                <option value="Security">Security</option>
                <option value="Payment">Payment</option>
                <option value="Communication">Communication</option>
                <option value="Other">{{ lang.t('incident.type_other') }}</option>
              </select>
            </div>
          </div>

          <div class="flex justify-end mt-6">
            <button (click)="nextStep()" [disabled]="!canProceedStep0()"
                    class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-500 text-white font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {{ lang.t('vendorcat.next') }}
              <svg class="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      }

      <!-- Steps 1-3: Questions -->
      @if (currentStep() >= 1 && currentStep() <= 3) {
        <div class="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-6">
          <h2 class="text-lg font-semibold text-white mb-6">
            {{ lang.t(steps[currentStep()]) }}
          </h2>

          <div class="space-y-6">
            @for (q of getStepQuestions(); track q.key) {
              <div class="bg-slate-900/30 rounded-xl p-4">
                <p class="text-sm font-medium text-slate-700 mb-3">{{ lang.t(q.key) }}</p>
                <div class="grid grid-cols-3 gap-2">
                  @for (opt of q.options; track opt.label) {
                    <button (click)="answers[q.key] = opt.value"
                            class="px-3 py-2 rounded-lg text-sm font-medium transition-all border"
                            [class]="answers[q.key] === opt.value
                              ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                              : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'">
                      {{ lang.t(opt.label) }}
                    </button>
                  }
                </div>
              </div>
            }
          </div>

          <div class="flex justify-between mt-6">
            <button (click)="prevStep()"
                    class="px-5 py-2.5 rounded-xl bg-slate-700/50 border border-slate-200 text-slate-600 text-sm hover:bg-slate-100 transition-all">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              {{ lang.t('vendorcat.prev') }}
            </button>
            <button (click)="nextStep()" [disabled]="!canProceedCurrentStep()"
                    class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-500 text-white font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {{ lang.t('vendorcat.next') }}
              <svg class="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      }

      <!-- Step 4: Result -->
      @if (currentStep() === 4) {
        <div class="max-w-2xl mx-auto">
          <!-- Result card -->
          <div class="rounded-2xl p-8 text-center mb-6"
               [class]="resultLevel() === 'CRITICAL' ? 'bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30' :
                        resultLevel() === 'IMPORTANT' ? 'bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/30' :
                        'bg-gradient-to-br from-blue-600/10 to-blue-500/10 border border-blue-200'">
            <div class="text-6xl mb-4">
              {{ resultLevel() === 'CRITICAL' ? '\u26a0\ufe0f' : resultLevel() === 'IMPORTANT' ? '\u2139\ufe0f' : '\u2705' }}
            </div>
            <h2 class="text-sm font-medium text-slate-400 mb-2">{{ lang.t('vendorcat.result_title') }}</h2>
            <div class="text-3xl font-bold mb-4"
                 [class]="resultLevel() === 'CRITICAL' ? 'text-red-400' : resultLevel() === 'IMPORTANT' ? 'text-amber-400' : 'text-blue-600'">
              {{ lang.t('vendorcat.result_' + resultLevel().toLowerCase()) }}
            </div>

            <!-- Score bar -->
            <div class="max-w-xs mx-auto mb-4">
              <div class="flex justify-between text-xs text-slate-500 mb-1">
                <span>{{ lang.t('vendorcat.score') }}</span>
                <span>{{ scorePercent() }}%</span>
              </div>
              <div class="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-1000"
                     [style.width.%]="scorePercent()"
                     [class]="resultLevel() === 'CRITICAL' ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                              resultLevel() === 'IMPORTANT' ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
                              'bg-blue-600'">
                </div>
              </div>
              <div class="flex justify-between text-[10px] text-slate-600 mt-1">
                <span>NORMAL</span>
                <span>IMPORTANT</span>
                <span>CRITICAL</span>
              </div>
            </div>

            <p class="text-sm text-slate-600 max-w-md mx-auto">
              {{ lang.t('vendorcat.explanation') }}: {{ lang.t('vendorcat.' + resultLevel().toLowerCase() + '_explanation') }}
            </p>
          </div>

          <!-- Vendor name -->
          <div class="bg-white border border-slate-200 rounded-xl p-4 mb-4">
            <div class="text-xs text-slate-400 mb-1">{{ lang.t('vendorcat.step_select') }}</div>
            <div class="text-white font-semibold">{{ getVendorDisplayName() }}</div>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap gap-3">
            <button (click)="saveResult()" [disabled]="saving()"
                    class="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-500 text-white font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              @if (saving()) {
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              }
              @if (saved()) {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                {{ lang.t('vendorcat.saved') }}
              } @else {
                {{ lang.t('vendorcat.save') }}
              }
            </button>
            <button (click)="startOver()"
                    class="px-5 py-3 rounded-xl bg-slate-700/50 border border-slate-200 text-slate-600 text-sm hover:bg-slate-100 transition-all">
              {{ lang.t('vendorcat.start_over') }}
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class VendorCategorizationComponent implements OnInit {
  steps = ['vendorcat.step_select', 'vendorcat.step_service', 'vendorcat.step_replace', 'vendorcat.step_impact', 'vendorcat.step_result'];
  currentStep = signal(0);
  providers = signal<IctProvider[]>([]);
  selectedProviderId = '';
  newVendorName = '';
  newVendorService = 'Cloud';
  answers: Record<string, number> = {};
  saving = signal(false);
  saved = signal(false);

  // Questions per step
  serviceQuestions: WizardQuestion[] = [
    { key: 'vendorcat.q_critical_functions', options: [
      { label: 'vendorcat.answer_yes', value: 100 }, { label: 'vendorcat.answer_partial', value: 50 }, { label: 'vendorcat.answer_no', value: 0 }
    ]},
    { key: 'vendorcat.q_data_confidentiality', options: [
      { label: 'vendorcat.answer_yes', value: 100 }, { label: 'vendorcat.answer_partial', value: 50 }, { label: 'vendorcat.answer_no', value: 0 }
    ]},
    { key: 'vendorcat.q_regulatory', options: [
      { label: 'vendorcat.answer_yes', value: 100 }, { label: 'vendorcat.answer_partial', value: 50 }, { label: 'vendorcat.answer_no', value: 0 }
    ]},
    { key: 'vendorcat.q_clients_depend', options: [
      { label: 'vendorcat.answer_yes', value: 100 }, { label: 'vendorcat.answer_partial', value: 50 }, { label: 'vendorcat.answer_no', value: 0 }
    ]}
  ];

  replaceQuestions: WizardQuestion[] = [
    { key: 'vendorcat.q_substitutability', options: [
      { label: 'vendorcat.answer_easy', value: 0 }, { label: 'vendorcat.answer_moderate', value: 50 }, { label: 'vendorcat.answer_difficult', value: 100 }
    ]},
    { key: 'vendorcat.q_alternatives', options: [
      { label: 'vendorcat.answer_many', value: 0 }, { label: 'vendorcat.answer_some', value: 50 }, { label: 'vendorcat.answer_few', value: 100 }
    ]},
    { key: 'vendorcat.q_migration_complexity', options: [
      { label: 'vendorcat.answer_low_complex', value: 0 }, { label: 'vendorcat.answer_medium_complex', value: 50 }, { label: 'vendorcat.answer_high_complex', value: 100 }
    ]}
  ];

  impactQuestions: WizardQuestion[] = [
    { key: 'vendorcat.q_outage_business', options: [
      { label: 'vendorcat.answer_minimal', value: 0 }, { label: 'vendorcat.answer_moderate_impact', value: 50 }, { label: 'vendorcat.answer_severe', value: 100 }
    ]},
    { key: 'vendorcat.q_outage_clients', options: [
      { label: 'vendorcat.answer_minimal', value: 0 }, { label: 'vendorcat.answer_moderate_impact', value: 50 }, { label: 'vendorcat.answer_severe', value: 100 }
    ]},
    { key: 'vendorcat.q_outage_regulatory', options: [
      { label: 'vendorcat.answer_negligible', value: 0 }, { label: 'vendorcat.answer_significant', value: 50 }, { label: 'vendorcat.answer_critical_loss', value: 100 }
    ]},
    { key: 'vendorcat.q_financial_loss', options: [
      { label: 'vendorcat.answer_negligible', value: 0 }, { label: 'vendorcat.answer_significant', value: 50 }, { label: 'vendorcat.answer_critical_loss', value: 100 }
    ]}
  ];

  constructor(private api: ApiService, public lang: LangService) {}

  ngOnInit() {
    this.api.getIctProviders().subscribe({
      next: (data) => this.providers.set(data)
    });
  }

  getStepQuestions(): WizardQuestion[] {
    switch (this.currentStep()) {
      case 1: return this.serviceQuestions;
      case 2: return this.replaceQuestions;
      case 3: return this.impactQuestions;
      default: return [];
    }
  }

  canProceedStep0(): boolean {
    return this.selectedProviderId !== '' || this.newVendorName.trim() !== '';
  }

  canProceedCurrentStep(): boolean {
    const questions = this.getStepQuestions();
    return questions.every(q => this.answers[q.key] !== undefined);
  }

  nextStep() {
    if (this.currentStep() < 4) {
      this.currentStep.update(v => v + 1);
    }
  }

  prevStep() {
    if (this.currentStep() > 0) {
      this.currentStep.update(v => v - 1);
    }
  }

  scorePercent = () => {
    const allQuestions = [...this.serviceQuestions, ...this.replaceQuestions, ...this.impactQuestions];
    const answered = allQuestions.filter(q => this.answers[q.key] !== undefined);
    if (answered.length === 0) return 0;
    const total = answered.reduce((sum, q) => sum + (this.answers[q.key] || 0), 0);
    return Math.round(total / answered.length);
  };

  resultLevel = () => {
    const pct = this.scorePercent();
    if (pct >= 70) return 'CRITICAL';
    if (pct >= 40) return 'IMPORTANT';
    return 'NORMAL';
  };

  getVendorDisplayName(): string {
    if (this.selectedProviderId) {
      const p = this.providers().find(p => p.id === this.selectedProviderId);
      return p ? p.providerName : '';
    }
    return this.newVendorName;
  }

  saveResult() {
    this.saving.set(true);
    const level = this.resultLevel();
    const reason = this.lang.t('vendorcat.' + level.toLowerCase() + '_explanation');

    if (this.selectedProviderId) {
      this.api.categorizeIctProvider(this.selectedProviderId, level, reason).subscribe({
        next: () => { this.saving.set(false); this.saved.set(true); },
        error: () => { this.saving.set(false); }
      });
    } else {
      // Create new provider first, then categorize
      this.api.createIctProvider({
        name: this.newVendorName,
        type: this.newVendorService,
        criticality: level.toLowerCase()
      }).subscribe({
        next: (created) => {
          this.api.categorizeIctProvider(created.id, level, reason).subscribe({
            next: () => { this.saving.set(false); this.saved.set(true); },
            error: () => { this.saving.set(false); this.saved.set(true); }
          });
        },
        error: () => { this.saving.set(false); }
      });
    }
  }

  startOver() {
    this.currentStep.set(0);
    this.selectedProviderId = '';
    this.newVendorName = '';
    this.newVendorService = 'Cloud';
    this.answers = {};
    this.saved.set(false);
  }
}
