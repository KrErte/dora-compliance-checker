import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LangService } from '../lang.service';
import { ApiService } from '../api.service';
import { SubscriptionService } from '../services/subscription.service';
import { ToastService } from '../auth/toast.service';
import { CompanyType, AlertFrequency } from '../models';

@Component({
  selector: 'app-alert-profile-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div class="max-w-2xl mx-auto">

        <!-- Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-medium mb-4">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            {{ lang.t('alert.wizard.badge') }}
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">{{ lang.t('alert.wizard.title') }}</h1>
          <p class="text-slate-400 text-sm">{{ lang.t('alert.wizard.subtitle') }}</p>
        </div>

        <!-- Progress bar -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-2">
            @for (s of steps; track s.num) {
              <button (click)="goToStep(s.num)"
                      class="flex items-center gap-2 text-xs font-medium transition-colors"
                      [class.text-blue-600]="step() >= s.num"
                      [class.text-slate-500]="step() < s.num">
                <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all"
                      [class.bg-blue-600]="step() > s.num"
                      [class.border-blue-500]="step() >= s.num"
                      [class.text-white]="step() >= s.num"
                      [class.border-slate-600]="step() < s.num"
                      [class.text-slate-500]="step() < s.num">
                  @if (step() > s.num) {
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                  } @else {
                    {{ s.num }}
                  }
                </span>
                <span class="hidden sm:inline">{{ lang.t(s.label) }}</span>
              </button>
            }
          </div>
          <div class="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div class="h-full bg-blue-600 rounded-full transition-all duration-500"
                 [style.width.%]="((step() - 1) / 3) * 100"></div>
          </div>
        </div>

        <!-- Step content card -->
        <div class="bg-white backdrop-blur border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl">

          <!-- Step 1: Company Type -->
          @if (step() === 1) {
            <h2 class="text-lg font-semibold text-white mb-1">{{ lang.t('alert.wizard.step1_title') }}</h2>
            <p class="text-slate-400 text-sm mb-6">{{ lang.t('alert.wizard.step1_desc') }}</p>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              @for (ct of companyTypes; track ct.value) {
                <button (click)="companyType = ct.value"
                        class="p-4 rounded-xl border-2 text-left transition-all duration-200"
                        [ngClass]="companyType === ct.value ? 'border-blue-500 bg-blue-50' : 'border-slate-700'">
                  <div class="text-2xl mb-2">{{ ct.icon }}</div>
                  <div class="text-sm font-medium" [class.text-blue-600]="companyType === ct.value" [class.text-slate-600]="companyType !== ct.value">
                    {{ lang.t(ct.label) }}
                  </div>
                </button>
              }
            </div>
          }

          <!-- Step 2: Country -->
          @if (step() === 2) {
            <h2 class="text-lg font-semibold text-white mb-1">{{ lang.t('alert.wizard.step2_title') }}</h2>
            <p class="text-slate-400 text-sm mb-6">{{ lang.t('alert.wizard.step2_desc') }}</p>
            <div class="grid grid-cols-3 gap-4">
              @for (c of countries; track c.code) {
                <button (click)="country = c.code"
                        class="p-5 rounded-xl border-2 text-center transition-all duration-200"
                        [ngClass]="country === c.code ? 'border-blue-500 bg-blue-50' : 'border-slate-700'">
                  <div class="text-3xl mb-2">{{ c.flag }}</div>
                  <div class="text-sm font-medium" [class.text-blue-600]="country === c.code" [class.text-slate-600]="country !== c.code">
                    {{ c.name }}
                  </div>
                </button>
              }
            </div>
          }

          <!-- Step 3: Regulations -->
          @if (step() === 3) {
            <h2 class="text-lg font-semibold text-white mb-1">{{ lang.t('alert.wizard.step3_title') }}</h2>
            <p class="text-slate-400 text-sm mb-6">{{ lang.t('alert.wizard.step3_desc') }}</p>
            <div class="space-y-3">
              @for (reg of regulationOptions; track reg.value) {
                <label class="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200"
                       [ngClass]="regulations.includes(reg.value) ? 'border-blue-500 bg-blue-50' : 'border-slate-700'">
                  <input type="checkbox" [checked]="regulations.includes(reg.value)"
                         (change)="toggleRegulation(reg.value)"
                         class="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0">
                  <div>
                    <div class="text-sm font-medium text-white">{{ reg.name }}</div>
                    <div class="text-xs text-slate-400 mt-0.5">{{ lang.t(reg.desc) }}</div>
                  </div>
                </label>
              }
            </div>
          }

          <!-- Step 4: Alert Frequency -->
          @if (step() === 4) {
            <h2 class="text-lg font-semibold text-white mb-1">{{ lang.t('alert.wizard.step4_title') }}</h2>
            <p class="text-slate-400 text-sm mb-6">{{ lang.t('alert.wizard.step4_desc') }}</p>
            <div class="space-y-3">
              @for (freq of frequencyOptions; track freq.value) {
                <label class="flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200"
                       [ngClass]="{
                         'border-blue-500 bg-blue-50': alertFrequency === freq.value,
                         'border-slate-700': alertFrequency !== freq.value,
                         'opacity-50 cursor-not-allowed': freq.premium && !sub.isPremium(),
                         'cursor-pointer': !(freq.premium && !sub.isPremium())
                       }">
                  <input type="radio" name="frequency" [value]="freq.value"
                         [checked]="alertFrequency === freq.value"
                         (change)="setFrequency(freq)"
                         [disabled]="freq.premium && !sub.isPremium()"
                         class="w-4 h-4 border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium" [class.text-blue-600]="alertFrequency === freq.value" [class.text-white]="alertFrequency !== freq.value">
                        {{ lang.t(freq.label) }}
                      </span>
                      @if (freq.premium && !sub.isPremium()) {
                        <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">PRO</span>
                      }
                    </div>
                    <div class="text-xs text-slate-400 mt-0.5">{{ lang.t(freq.desc) }}</div>
                  </div>
                </label>
              }
            </div>

            <!-- Channels -->
            <div class="mt-6 pt-6 border-t border-slate-200">
              <h3 class="text-sm font-medium text-white mb-3">{{ lang.t('alert.wizard.channels') }}</h3>
              <div class="flex items-center gap-6">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="alertDashboard"
                         class="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0">
                  <span class="text-sm text-slate-600">{{ lang.t('alert.wizard.channel_dashboard') }}</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="alertEmail"
                         class="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0">
                  <span class="text-sm text-slate-600">{{ lang.t('alert.wizard.channel_email') }}</span>
                </label>
              </div>
            </div>
          }
        </div>

        <!-- Navigation buttons -->
        <div class="flex items-center justify-between mt-6">
          @if (step() > 1) {
            <button (click)="prev()"
                    class="px-5 py-2.5 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-xl hover:border-slate-500 transition-colors">
              {{ lang.t('alert.wizard.prev') }}
            </button>
          } @else {
            <div></div>
          }
          @if (step() < 4) {
            <button (click)="next()" [disabled]="!canNext()"
                    class="px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-200"
                    [ngClass]="canNext() ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'">
              {{ lang.t('alert.wizard.next') }}
            </button>
          } @else {
            <button (click)="save()" [disabled]="saving()"
                    class="px-6 py-2.5 text-sm font-medium rounded-xl bg-blue-600 text-white transition-all duration-200 flex items-center gap-2">
              @if (saving()) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              }
              {{ lang.t('alert.wizard.save') }}
            </button>
          }
        </div>

        <!-- Edit mode hint -->
        @if (editMode()) {
          <div class="mt-4 text-center">
            <button (click)="deleteProfile()" class="text-xs text-red-400/60 hover:text-red-400 transition-colors">
              {{ lang.t('alert.wizard.delete_profile') }}
            </button>
          </div>
        }
      </div>
    </div>
  `
})
export class AlertProfileWizardComponent implements OnInit {
  step = signal(1);
  saving = signal(false);
  editMode = signal(false);

  companyType: CompanyType | null = null;
  country = 'EST';
  regulations: string[] = ['DORA'];
  alertFrequency: AlertFrequency = 'WEEKLY';
  alertEmail = true;
  alertDashboard = true;

  steps = [
    { num: 1, label: 'alert.wizard.step1_short' },
    { num: 2, label: 'alert.wizard.step2_short' },
    { num: 3, label: 'alert.wizard.step3_short' },
    { num: 4, label: 'alert.wizard.step4_short' }
  ];

  companyTypes = [
    { value: 'BANK' as CompanyType, icon: '\uD83C\uDFE6', label: 'alert.wizard.type_bank' },
    { value: 'FINTECH' as CompanyType, icon: '\uD83D\uDCB3', label: 'alert.wizard.type_fintech' },
    { value: 'INSURANCE' as CompanyType, icon: '\uD83D\uDEE1\uFE0F', label: 'alert.wizard.type_insurance' },
    { value: 'INVESTMENT_FIRM' as CompanyType, icon: '\uD83D\uDCC8', label: 'alert.wizard.type_investment' },
    { value: 'ICT_PROVIDER' as CompanyType, icon: '\uD83D\uDCBB', label: 'alert.wizard.type_ict' },
    { value: 'OTHER' as CompanyType, icon: '\uD83C\uDFE2', label: 'alert.wizard.type_other' }
  ];

  countries = [
    { code: 'EST', flag: '\uD83C\uDDEA\uD83C\uDDEA', name: 'Eesti' },
    { code: 'LVA', flag: '\uD83C\uDDF1\uD83C\uDDFB', name: 'Latvija' },
    { code: 'LTU', flag: '\uD83C\uDDF1\uD83C\uDDF9', name: 'Lietuva' }
  ];

  regulationOptions = [
    { value: 'DORA', name: 'DORA', desc: 'alert.wizard.reg_dora' },
    { value: 'NIS2', name: 'NIS2', desc: 'alert.wizard.reg_nis2' },
    { value: 'AI_ACT', name: 'AI Act', desc: 'alert.wizard.reg_aiact' },
    { value: 'CSRD', name: 'CSRD', desc: 'alert.wizard.reg_csrd' }
  ];

  frequencyOptions = [
    { value: 'REALTIME' as AlertFrequency, label: 'alert.wizard.freq_realtime', desc: 'alert.wizard.freq_realtime_desc', premium: true },
    { value: 'DAILY' as AlertFrequency, label: 'alert.wizard.freq_daily', desc: 'alert.wizard.freq_daily_desc', premium: true },
    { value: 'WEEKLY' as AlertFrequency, label: 'alert.wizard.freq_weekly', desc: 'alert.wizard.freq_weekly_desc', premium: false }
  ];

  constructor(
    public lang: LangService,
    public sub: SubscriptionService,
    private api: ApiService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.api.getComplianceProfile().subscribe({
      next: (profile) => {
        this.editMode.set(true);
        this.companyType = profile.companyType;
        this.country = profile.country || 'EST';
        this.regulations = profile.regulations || ['DORA'];
        this.alertFrequency = profile.alertFrequency || 'WEEKLY';
        this.alertEmail = profile.alertEmail;
        this.alertDashboard = profile.alertDashboard;
      },
      error: () => {} // 404 = no existing profile
    });
  }

  canNext(): boolean {
    if (this.step() === 1) return this.companyType !== null;
    if (this.step() === 3) return this.regulations.length > 0;
    return true;
  }

  next() {
    if (this.canNext() && this.step() < 4) this.step.update(s => s + 1);
  }

  prev() {
    if (this.step() > 1) this.step.update(s => s - 1);
  }

  goToStep(n: number) {
    if (n <= this.step()) this.step.set(n);
  }

  toggleRegulation(value: string) {
    if (this.regulations.includes(value)) {
      this.regulations = this.regulations.filter(r => r !== value);
    } else {
      this.regulations = [...this.regulations, value];
    }
  }

  setFrequency(freq: { value: AlertFrequency; premium: boolean }) {
    if (freq.premium && !this.sub.isPremium()) return;
    this.alertFrequency = freq.value;
  }

  save() {
    this.saving.set(true);
    this.api.saveComplianceProfile({
      companyType: this.companyType,
      country: this.country,
      regulations: this.regulations,
      alertFrequency: this.alertFrequency,
      alertEmail: this.alertEmail,
      alertDashboard: this.alertDashboard
    }).subscribe({
      next: () => {
        this.toast.show(this.lang.t('alert.wizard.saved'), 'success');
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.toast.show(this.lang.t('alert.wizard.save_error'), 'error');
        this.saving.set(false);
      }
    });
  }

  deleteProfile() {
    if (!confirm(this.lang.t('alert.wizard.delete_confirm'))) return;
    this.api.deleteComplianceProfile().subscribe({
      next: () => {
        this.toast.show(this.lang.t('alert.wizard.deleted'), 'success');
        this.router.navigate(['/dashboard']);
      },
      error: () => this.toast.show(this.lang.t('alert.wizard.delete_error'), 'error')
    });
  }
}
