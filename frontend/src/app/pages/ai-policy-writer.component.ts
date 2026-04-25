import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LangService } from '../lang.service';
import { SubscriptionService } from '../services/subscription.service';
import { AuthService } from '../auth/auth.service';

interface PolicyType {
  id: string;
  nameEt: string;
  nameEn: string;
  doraRef: string;
  icon: string;
}

interface PolicySection {
  number: number;
  title: string;
  body: string;
}

interface GeneratedPolicy {
  id: string;
  policyType: string;
  companyName: string;
  language: string;
  doraArticles: string;
  sections: PolicySection[];
  gapsSummary: string | null;
  createdAt: string;
}

interface SavedPolicySummary {
  id: string;
  policyType: string;
  companyName: string;
  language: string;
  doraArticles: string;
  createdAt: string;
}

interface AssessmentSummary {
  id: string;
  companyName: string;
  scorePercentage: number;
  complianceLevel: string;
  assessmentDate: string;
}

const POLICY_TYPES: PolicyType[] = [
  { id: 'ict-risk', nameEt: 'IKT riskihalduse raamistik', nameEn: 'ICT Risk Management Framework', doraRef: 'Art. 5-6', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  { id: 'incident-response', nameEt: 'Intsidentide reageerimise plaan', nameEn: 'Incident Response Plan', doraRef: 'Art. 17-23', icon: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' },
  { id: 'bcp', nameEt: 'Äritegevuse jätkuvuse plaan', nameEn: 'Business Continuity Plan', doraRef: 'Art. 11-12', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  { id: 'tprm', nameEt: 'Kolmanda osapoole riskihalduse poliitika', nameEn: 'Third-Party Risk Management Policy', doraRef: 'Art. 28-30', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' },
  { id: 'testing', nameEt: 'Vastupidavuse testimise programm', nameEn: 'Resilience Testing Programme', doraRef: 'Art. 24-27', icon: 'M9 11 3 3L22 4' },
  { id: 'infosec', nameEt: 'Infoturbe poliitika', nameEn: 'Information Security Policy', doraRef: 'Art. 9', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  { id: 'change-mgmt', nameEt: 'Muudatuste halduse poliitika', nameEn: 'Change Management Policy', doraRef: 'Art. 8(4), 9(4)(e)', icon: 'M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  { id: 'asset-mgmt', nameEt: 'IKT varade halduse poliitika', nameEn: 'ICT Asset Management Policy', doraRef: 'Art. 8(1), 8(4)', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4' },
  { id: 'crypto', nameEt: 'Krüptograafia ja andmekaitse poliitika', nameEn: 'Cryptography and Data Protection Policy', doraRef: 'Art. 9(2), 9(4)(d)', icon: 'M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z' },
  { id: 'access-control', nameEt: 'Juurdepääsu kontrolli poliitika', nameEn: 'Access Control Policy', doraRef: 'Art. 9(4)(c)', icon: 'M15 7a2 2 0 0 1 2 2m4 0a6 6 0 0 1-7.743 5.743L11 17H9v2H7v2H4a1 1 0 0 1-1-1v-2.586a1 1 0 0 1 .293-.707l5.964-5.964A6 6 0 1 1 21 9z' }
];

@Component({
  selector: 'app-ai-policy-writer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-4">
          <div class="w-4 h-4 rounded bg-gradient-to-br from-violet-400 to-purple-400 flex items-center justify-center text-[7px] text-white font-bold">AI</div>
          Enterprise
        </div>
        <h1 class="text-3xl sm:text-4xl font-bold text-white mb-3">
          {{ lang.l('AI poliitikakirjutaja', 'AI Policy Writer') }}
        </h1>
        <p class="text-slate-400 max-w-2xl mx-auto">
          {{ lang.l(
            'Genereeri professionaalsed, ettevõttespetsiifilised DORA poliitikaadokumendid AI abil. Valikuliselt kohandatud sinu hindamise lünkade alusel.',
            'Generate professional, company-specific DORA policy documents using AI. Optionally tailored to your assessment gaps.'
          ) }}
        </p>
      </div>

      <!-- Saved policies -->
      @if (savedPolicies().length > 0 && step() === 1) {
        <div class="mb-8 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <h3 class="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>
            </svg>
            {{ lang.l('Eelnevalt genereeritud', 'Previously Generated') }}
          </h3>
          <div class="space-y-2">
            @for (p of savedPolicies(); track p.id) {
              <div class="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/30 hover:border-slate-600 transition-colors">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 text-xs font-bold">
                    {{ p.language.toUpperCase() }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white">{{ getPolicyTypeName(p.policyType) }}</p>
                    <p class="text-xs text-slate-500">{{ p.companyName }} &middot; {{ p.doraArticles }} &middot; {{ formatDate(p.createdAt) }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button (click)="loadSavedPolicy(p.id)" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors">
                    {{ lang.l('Ava', 'Open') }}
                  </button>
                  <button (click)="deleteSavedPolicy(p.id)" class="px-2 py-1.5 rounded-lg text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Step indicator -->
      <div class="flex items-center justify-center gap-2 mb-8">
        @for (s of [1,2,3,4]; track s) {
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                 [ngClass]="step() >= s ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-400'">
              @if (step() > s) {
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
              } @else {
                {{ s }}
              }
            </div>
            @if (s < 4) {
              <div class="w-8 h-0.5 rounded" [ngClass]="step() > s ? 'bg-violet-500' : 'bg-slate-700'"></div>
            }
          </div>
        }
      </div>

      <!-- Step 1: Policy Type Selection -->
      @if (step() === 1) {
        <div>
          <h2 class="text-lg font-semibold text-white mb-1">{{ lang.l('Vali poliitika tüüp', 'Select Policy Type') }}</h2>
          <p class="text-sm text-slate-400 mb-5">{{ lang.l('Millist DORA poliitikaadokumenti soovid genereerida?', 'Which DORA policy document would you like to generate?') }}</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            @for (t of policyTypes; track t.id) {
              <button (click)="selectType(t)"
                      class="p-4 rounded-xl border text-left transition-all group"
                      [ngClass]="selectedType()?.id === t.id
                        ? 'bg-violet-500/10 border-violet-500/40 shadow-lg shadow-violet-500/10'
                        : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'">
                <svg class="w-5 h-5 mb-2" [ngClass]="selectedType()?.id === t.id ? 'text-violet-400' : 'text-slate-500'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path [attr.d]="t.icon"/>
                </svg>
                <p class="text-sm font-medium" [ngClass]="selectedType()?.id === t.id ? 'text-white' : 'text-slate-300'">
                  {{ lang.l(t.nameEt, t.nameEn) }}
                </p>
                <p class="text-xs text-slate-500 mt-1">{{ t.doraRef }}</p>
              </button>
            }
          </div>
        </div>
      }

      <!-- Step 2: Company Details -->
      @if (step() === 2) {
        <div>
          <h2 class="text-lg font-semibold text-white mb-1">{{ lang.l('Ettevõtte andmed', 'Company Details') }}</h2>
          <p class="text-sm text-slate-400 mb-5">{{ lang.l('Sisesta andmed, mida kasutatakse poliitikaadokumendis.', 'Enter details to be used in the policy document.') }}</p>

          <div class="p-5 rounded-xl bg-slate-800/50 border border-slate-700/50 mb-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-slate-500 mb-1">{{ lang.l('Ettevõtte nimi', 'Company Name') }} *</label>
                <input [(ngModel)]="companyName" maxlength="200" class="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none" placeholder="AS Finants">
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">CISO / IT {{ lang.l('juht', 'Manager') }}</label>
                <input [(ngModel)]="cisoName" maxlength="100" class="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none" placeholder="Mari Mets">
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">{{ lang.l('Vastutav juhatuse liige', 'Responsible Board Member') }}</label>
                <input [(ngModel)]="boardMember" maxlength="100" class="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none" placeholder="Jaan Tamm">
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">{{ lang.l('Sektor', 'Sector') }}</label>
                <select [(ngModel)]="sector" class="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none">
                  <option value="banking">{{ lang.l('Pangandus', 'Banking') }}</option>
                  <option value="insurance">{{ lang.l('Kindlustus', 'Insurance') }}</option>
                  <option value="investment">{{ lang.l('Investeerimine', 'Investment') }}</option>
                  <option value="payment">{{ lang.l('Makseteenused', 'Payment Services') }}</option>
                  <option value="fund">{{ lang.l('Fondihaldus', 'Fund Management') }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">{{ lang.l('Ettevõtte suurus', 'Company Size') }}</label>
                <select [(ngModel)]="companySize" class="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none">
                  <option value="small">{{ lang.l('Väike (< 50 töötajat)', 'Small (< 50 employees)') }}</option>
                  <option value="medium">{{ lang.l('Keskmine (50-250)', 'Medium (50-250)') }}</option>
                  <option value="large">{{ lang.l('Suur (> 250)', 'Large (> 250)') }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">{{ lang.l('Keel', 'Language') }}</label>
                <div class="flex gap-2">
                  <button (click)="docLanguage = 'et'" class="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                          [ngClass]="docLanguage === 'et' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/40' : 'bg-slate-900/50 text-slate-400 border border-slate-700 hover:border-slate-600'">
                    Eesti
                  </button>
                  <button (click)="docLanguage = 'en'" class="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                          [ngClass]="docLanguage === 'en' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/40' : 'bg-slate-900/50 text-slate-400 border border-slate-700 hover:border-slate-600'">
                    English
                  </button>
                </div>
              </div>
            </div>

            <!-- Assessment selector -->
            @if (assessments().length > 0) {
              <div class="mt-4 pt-4 border-t border-slate-700/50">
                <label class="block text-xs text-slate-500 mb-1">
                  {{ lang.l('Kohandamine hindamise alusel (valikuline)', 'Tailor to assessment gaps (optional)') }}
                </label>
                <select [(ngModel)]="selectedAssessmentId" class="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none">
                  <option value="">{{ lang.l('Ilma hindamiseta', 'Without assessment') }}</option>
                  @for (a of assessments(); track a.id) {
                    <option [value]="a.id">{{ a.companyName }} - {{ a.scorePercentage | number:'1.0-0' }}% ({{ formatDate(a.assessmentDate) }})</option>
                  }
                </select>
                @if (selectedAssessmentId) {
                  <p class="text-xs text-emerald-400/70 mt-1">
                    {{ lang.l('AI kohandab poliitikat tuvastatud lünkade alusel', 'AI will tailor the policy based on identified gaps') }}
                  </p>
                }
              </div>
            }
          </div>

          <div class="flex items-center gap-3">
            <button (click)="step.set(1)" class="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-all">
              {{ lang.l('Tagasi', 'Back') }}
            </button>
          </div>
        </div>
      }

      <!-- Step 3: Generate -->
      @if (step() === 3) {
        <div class="text-center">
          @if (generating()) {
            <div class="py-16">
              <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center">
                <svg class="w-8 h-8 text-violet-400 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-white mb-2">
                {{ lang.l('AI genereerib poliitikaadokumenti...', 'AI is generating the policy document...') }}
              </h3>
              <p class="text-sm text-slate-400 max-w-md mx-auto">
                {{ lang.l(
                  'See võib võtta kuni 60 sekundit. Palun ära sulge seda lehte.',
                  'This may take up to 60 seconds. Please don\'t close this page.'
                ) }}
              </p>
              <div class="mt-6 flex items-center justify-center gap-1">
                <div class="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style="animation-delay: 0s"></div>
                <div class="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style="animation-delay: 0.15s"></div>
                <div class="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style="animation-delay: 0.3s"></div>
              </div>
            </div>
          } @else {
            <div class="py-12">
              <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">AI</div>
              </div>
              <h3 class="text-lg font-semibold text-white mb-2">
                {{ lang.l('Valmis genereerimiseks', 'Ready to Generate') }}
              </h3>
              <p class="text-sm text-slate-400 mb-2">
                <span class="text-white font-medium">{{ lang.l(selectedType()!.nameEt, selectedType()!.nameEn) }}</span>
                &middot; {{ selectedType()!.doraRef }}
              </p>
              <p class="text-sm text-slate-400 mb-6">
                {{ companyName }} &middot; {{ docLanguage === 'et' ? 'Eesti keeles' : 'In English' }}
                @if (selectedAssessmentId) {
                  &middot; {{ lang.l('+ hindamise lüngad', '+ assessment gaps') }}
                }
              </p>

              @if (error()) {
                <div class="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400 max-w-md mx-auto">
                  {{ error() }}
                </div>
              }

              <button (click)="generatePolicy()"
                      class="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-400 hover:to-purple-400 hover:shadow-lg hover:shadow-violet-500/25 transition-all">
                <div class="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-[8px] font-bold">AI</div>
                {{ lang.l('Genereeri poliitikaadokument', 'Generate Policy Document') }}
              </button>
              <button (click)="step.set(2)" class="ml-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors">
                {{ lang.l('Tagasi', 'Back') }}
              </button>
            </div>
          }
        </div>
      }

      <!-- Step 4: Document Preview -->
      @if (step() === 4 && generatedPolicy()) {
        <div>
          <!-- Actions bar -->
          <div class="flex flex-wrap items-center gap-3 mb-6">
            <button (click)="step.set(1); generatedPolicy.set(null)" class="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-all flex items-center gap-2">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
              {{ lang.l('Uus dokument', 'New Document') }}
            </button>
            <button (click)="copyToClipboard()" class="px-4 py-2 rounded-lg text-sm font-medium bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-all flex items-center gap-2">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
              {{ copied() ? lang.l('Kopeeritud!', 'Copied!') : lang.l('Kopeeri tekst', 'Copy Text') }}
            </button>
            <button (click)="printDoc()" class="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-all flex items-center gap-2">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>
              </svg>
              {{ lang.l('Prindi', 'Print') }}
            </button>
          </div>

          <!-- Gaps summary -->
          @if (generatedPolicy()!.gapsSummary) {
            <div class="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <h4 class="text-sm font-semibold text-emerald-400 mb-1 flex items-center gap-2">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                {{ lang.l('Hindamise lünkade kokkuvõte', 'Assessment Gaps Summary') }}
              </h4>
              <p class="text-sm text-slate-300">{{ generatedPolicy()!.gapsSummary }}</p>
            </div>
          }

          <!-- Document -->
          <div id="policy-document" class="p-6 sm:p-8 rounded-xl bg-slate-800/80 border border-slate-700/50 print:bg-white print:text-black print:border-0">
            <!-- Header -->
            <div class="text-center mb-8 pb-6 border-b border-slate-700/50 print:border-gray-300">
              <p class="text-xs text-red-400 font-bold tracking-widest mb-4 print:text-red-600">{{ lang.l('KONFIDENTSIAALNE', 'CONFIDENTIAL') }}</p>
              <h2 class="text-2xl font-bold text-white mb-2 print:text-black">{{ generatedPolicy()!.companyName }}</h2>
              <h3 class="text-lg font-semibold text-violet-400 mb-4 print:text-violet-700">{{ getPolicyTypeName(generatedPolicy()!.policyType) }}</h3>
              <div class="flex justify-center gap-6 text-xs text-slate-400 print:text-gray-600">
                <span>{{ lang.l('Versioon', 'Version') }}: 1.0</span>
                <span>{{ lang.l('Kuupäev', 'Date') }}: {{ formatDate(generatedPolicy()!.createdAt) }}</span>
                <span>{{ generatedPolicy()!.doraArticles }}</span>
              </div>
            </div>

            <!-- Table of Contents -->
            <div class="mb-8 p-4 rounded-lg bg-slate-900/30 print:bg-gray-100">
              <p class="text-sm font-bold text-slate-300 mb-3 print:text-black">{{ lang.l('Sisukord', 'Table of Contents') }}</p>
              @for (section of generatedPolicy()!.sections; track section.number) {
                <p class="text-sm text-slate-400 py-0.5 print:text-gray-700">{{ section.number }}. {{ section.title }}</p>
              }
            </div>

            <!-- Sections -->
            @for (section of generatedPolicy()!.sections; track section.number) {
              <div class="mb-6">
                <h4 class="text-base font-semibold text-white mb-2 print:text-black">{{ section.number }}. {{ section.title }}</h4>
                <p class="text-sm text-slate-300 leading-relaxed whitespace-pre-line print:text-gray-800">{{ section.body }}</p>
              </div>
            }

            <!-- Sign-off -->
            <div class="mt-10 pt-6 border-t border-slate-700/50 grid grid-cols-2 gap-8 print:border-gray-300">
              <div>
                <p class="text-xs text-slate-500 mb-1 print:text-gray-500">{{ lang.l('Koostanud', 'Prepared by') }}</p>
                <div class="h-px bg-slate-600 w-48 mt-8 print:bg-gray-400"></div>
                <p class="text-sm text-slate-400 mt-1 print:text-gray-700">{{ cisoName || 'CISO' }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 mb-1 print:text-gray-500">{{ lang.l('Kinnitanud', 'Approved by') }}</p>
                <div class="h-px bg-slate-600 w-48 mt-8 print:bg-gray-400"></div>
                <p class="text-sm text-slate-400 mt-1 print:text-gray-700">{{ boardMember || lang.l('Juhatuse liige', 'Board Member') }}</p>
              </div>
            </div>
          </div>

          <!-- AI badge -->
          <div class="mt-4 text-center">
            <p class="text-xs text-slate-600">
              {{ lang.l('Genereeritud AI abil', 'Generated with AI') }} &middot; DoraAudit.eu
            </p>
          </div>
        </div>
      }
    </div>
  `
})
export class AiPolicyWriterComponent {
  private http = inject(HttpClient);
  lang = inject(LangService);
  private sub = inject(SubscriptionService);
  private auth = inject(AuthService);

  policyTypes = POLICY_TYPES;
  step = signal(1);
  selectedType = signal<PolicyType | null>(null);
  generatedPolicy = signal<GeneratedPolicy | null>(null);
  savedPolicies = signal<SavedPolicySummary[]>([]);
  assessments = signal<AssessmentSummary[]>([]);
  generating = signal(false);
  error = signal('');
  copied = signal(false);

  companyName = '';
  cisoName = '';
  boardMember = '';
  sector = 'banking';
  companySize = 'medium';
  docLanguage = 'et';
  selectedAssessmentId = '';

  constructor() {
    this.loadSavedPolicies();
    this.loadAssessments();
  }

  selectType(type: PolicyType) {
    this.selectedType.set(type);
    this.step.set(2);
  }

  generatePolicy() {
    if (!this.sub.canAccess('AI_POLICY_WRITER')) {
      this.sub.showUpgrade('AI_POLICY_WRITER');
      return;
    }

    if (!this.companyName.trim()) {
      this.error.set(this.lang.l('Ettevõtte nimi on kohustuslik', 'Company name is required'));
      return;
    }

    this.generating.set(true);
    this.error.set('');

    this.http.post<GeneratedPolicy>('/api/policy-writer/generate', {
      policyType: this.selectedType()!.id,
      companyName: this.companyName.trim(),
      cisoName: this.cisoName.trim() || null,
      boardMember: this.boardMember.trim() || null,
      sector: this.sector,
      companySize: this.companySize,
      language: this.docLanguage,
      assessmentId: this.selectedAssessmentId || null
    }).subscribe({
      next: (result) => {
        this.generatedPolicy.set(result);
        this.step.set(4);
        this.generating.set(false);
        this.loadSavedPolicies();
      },
      error: (err) => {
        this.generating.set(false);
        if (err.status === 403) {
          this.sub.showUpgrade('AI_POLICY_WRITER');
          this.step.set(2);
        } else {
          this.error.set(err.error?.message || this.lang.l('Genereerimine ebaõnnestus. Palun proovi uuesti.', 'Generation failed. Please try again.'));
        }
      }
    });
  }

  loadSavedPolicies() {
    if (!this.auth.isLoggedIn()) return;
    this.http.get<SavedPolicySummary[]>('/api/policy-writer').subscribe({
      next: (policies) => this.savedPolicies.set(policies),
      error: () => {}
    });
  }

  loadAssessments() {
    if (!this.auth.isLoggedIn()) return;
    this.http.get<AssessmentSummary[]>('/api/assessments/history').subscribe({
      next: (list) => this.assessments.set(list),
      error: () => {}
    });
  }

  loadSavedPolicy(id: string) {
    this.http.get<GeneratedPolicy>(`/api/policy-writer/${id}`).subscribe({
      next: (policy) => {
        this.generatedPolicy.set(policy);
        this.companyName = policy.companyName;
        const type = this.policyTypes.find(t => t.id === policy.policyType);
        if (type) this.selectedType.set(type);
        this.step.set(4);
      },
      error: () => {}
    });
  }

  deleteSavedPolicy(id: string) {
    this.http.delete(`/api/policy-writer/${id}`).subscribe({
      next: () => this.loadSavedPolicies(),
      error: () => {}
    });
  }

  getPolicyTypeName(typeId: string): string {
    const type = this.policyTypes.find(t => t.id === typeId);
    if (!type) return typeId;
    return this.lang.l(type.nameEt, type.nameEn);
  }

  formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('et-EE');
    } catch {
      return dateStr;
    }
  }

  copyToClipboard() {
    const el = document.getElementById('policy-document');
    if (!el) return;
    navigator.clipboard.writeText(el.innerText).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  printDoc() { window.print(); }
}
