import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../api.service';

type SealVariant = 'shield' | 'badge' | 'minimal';
type SealTheme = 'dark' | 'light' | 'auto';
type SealSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-trust-seal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-md">
              <svg class="w-5 h-5 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            DORA Trust Seal
          </h1>
          <p class="text-sm text-slate-400 mt-1">
            {{ lang.t('seal.embeddable_compliance_badge_for_your_web') }}
          </p>
        </div>
        <a routerLink="/command-center" class="text-sm text-slate-400 hover:text-blue-500 flex items-center gap-1.5 transition-colors">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m15 18-6-6 6-6"/></svg>
          {{ lang.t('seal.command_center') }}
        </a>
      </div>

      <!-- Main content -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left: Preview -->
        <div class="space-y-6">
          <!-- Live preview area -->
          <div class="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 class="text-sm font-semibold text-slate-600 mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              {{ lang.t('seal.live_preview') }}
            </h2>

            <!-- Preview container simulating a website -->
            <div class="rounded-xl overflow-hidden border border-slate-300/30">
              <!-- Fake browser bar -->
              <div class="bg-slate-700/60 px-4 py-2 flex items-center gap-2">
                <div class="flex gap-1.5">
                  <div class="w-2.5 h-2.5 rounded-full bg-red-400/60"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-amber-400/60"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-500/60"></div>
                </div>
                <div class="flex-1 bg-slate-600/40 rounded-md px-3 py-1 text-[10px] text-slate-400 font-mono">
                  {{ companyDomain() || 'your-company.eu' }}
                </div>
              </div>
              <!-- Website simulation -->
              <div class="p-8 flex items-center justify-center"
                   [class]="selectedTheme === 'dark' ? 'bg-white' : selectedTheme === 'light' ? 'bg-white' : 'bg-slate-100'">

                @if (selectedVariant === 'shield') {
                  <!-- Shield variant -->
                  <div class="inline-flex flex-col items-center gap-2 p-4 rounded-xl transition-all"
                       [ngClass]="getSealContainerClass()">
                    <div class="relative">
                      <svg [attr.width]="getSealIconSize()" [attr.height]="getSealIconSize()" viewBox="0 0 80 96" fill="none">
                        <path d="M40 2L4 18v28c0 24 16 38 36 46 20-8 36-22 36-46V18L40 2z"
                              [attr.fill]="sealVerified() ? 'url(#shield-grad)' : '#64748b'" opacity="0.15"/>
                        <path d="M40 2L4 18v28c0 24 16 38 36 46 20-8 36-22 36-46V18L40 2z"
                              [attr.stroke]="sealVerified() ? '#34d399' : '#64748b'" stroke-width="2.5" fill="none"/>
                        @if (sealVerified()) {
                          <path d="M28 48l10 10 14-20" stroke="#2563eb" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                        } @else {
                          <text x="40" y="52" text-anchor="middle" font-size="20" fill="#94a3b8">?</text>
                        }
                        <defs>
                          <linearGradient id="shield-grad" x1="4" y1="2" x2="76" y2="96">
                            <stop offset="0%" stop-color="#2563eb" stop-opacity="0.3"/>
                            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.3"/>
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <div class="text-center">
                      <div class="font-bold text-xs" [ngClass]="selectedTheme === 'light' ? 'text-slate-800' : 'text-slate-900'">
                        {{ sealVerified() ? 'DORA Verified' : 'Pending Verification' }}
                      </div>
                      <div class="text-[10px] mt-0.5" [ngClass]="selectedTheme === 'light' ? 'text-slate-500' : 'text-slate-400'">
                        Powered by DoraAudit
                      </div>
                      @if (sealVerified()) {
                        <div class="text-[9px] mt-1 font-mono" [ngClass]="selectedTheme === 'light' ? 'text-blue-700' : 'text-blue-600'">
                          Valid until {{ sealExpiry() }}
                        </div>
                      }
                    </div>
                  </div>
                }

                @if (selectedVariant === 'badge') {
                  <!-- Badge variant (horizontal) -->
                  <div class="inline-flex items-center gap-3 px-5 py-3 rounded-lg border transition-all"
                       [ngClass]="getBadgeContainerClass()">
                    <svg width="28" height="34" viewBox="0 0 80 96" fill="none">
                      <path d="M40 2L4 18v28c0 24 16 38 36 46 20-8 36-22 36-46V18L40 2z"
                            [attr.fill]="sealVerified() ? '#34d399' : '#64748b'" [attr.fill-opacity]="sealVerified() ? '0.15' : '0.1'"/>
                      <path d="M40 2L4 18v28c0 24 16 38 36 46 20-8 36-22 36-46V18L40 2z"
                            [attr.stroke]="sealVerified() ? '#34d399' : '#64748b'" stroke-width="3" fill="none"/>
                      @if (sealVerified()) {
                        <path d="M28 48l10 10 14-20" stroke="#2563eb" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                      }
                    </svg>
                    <div>
                      <div class="font-bold text-sm" [ngClass]="selectedTheme === 'light' ? 'text-slate-800' : 'text-slate-900'">
                        {{ sealVerified() ? 'DORA Compliant' : 'Pending' }}
                      </div>
                      <div class="text-[10px]" [ngClass]="selectedTheme === 'light' ? 'text-slate-500' : 'text-slate-400'">
                        Verified by DoraAudit.eu
                      </div>
                    </div>
                  </div>
                }

                @if (selectedVariant === 'minimal') {
                  <!-- Minimal variant -->
                  <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
                       [ngClass]="getMinimalContainerClass()">
                    <div class="w-2 h-2 rounded-full" [ngClass]="sealVerified() ? 'bg-blue-500' : 'bg-slate-400'"></div>
                    <span [ngClass]="selectedTheme === 'light' ? 'text-slate-700' : 'text-slate-700'">
                      {{ sealVerified() ? 'DORA Verified' : 'Unverified' }}
                    </span>
                    <span class="text-[9px]" [ngClass]="selectedTheme === 'light' ? 'text-slate-400' : 'text-slate-500'">
                      DoraAudit
                    </span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Verification status -->
          <div class="bg-white border border-slate-200 rounded-xl p-5">
            <h2 class="text-sm font-semibold text-slate-600 mb-3">
              {{ lang.t('seal.verification_status') }}
            </h2>
            <div class="space-y-3">
              @for (step of verificationSteps(); track step.label) {
                <div class="flex items-center gap-3">
                  <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                       [ngClass]="step.done ? 'bg-blue-100' : 'bg-slate-700/50'">
                    @if (step.done) {
                      <svg class="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m5 12 5 5L20 7"/></svg>
                    } @else {
                      <div class="w-2 h-2 rounded-full bg-slate-500"></div>
                    }
                  </div>
                  <span class="text-sm" [ngClass]="step.done ? 'text-slate-600' : 'text-slate-500'">{{ step.label }}</span>
                </div>
              }
            </div>
            <div class="mt-4 p-3 rounded-lg text-xs"
                 [ngClass]="sealVerified() ? 'bg-blue-50 border border-blue-200 text-blue-600' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'">
              {{ sealVerified()
                ? lang.t('seal.your_organization_is_verified_seal_is_ac')
                : lang.t('seal.complete_all_steps_to_activate_your_dora') }}
            </div>
          </div>
        </div>

        <!-- Right: Customization & Code -->
        <div class="space-y-6">
          <!-- Customization options -->
          <div class="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 class="text-sm font-semibold text-slate-600 mb-4">
              {{ lang.t('seal.customize') }}
            </h2>
            <div class="space-y-5">
              <!-- Variant -->
              <div>
                <label class="block text-xs text-slate-400 mb-2">{{ lang.t('seal.variant') }}</label>
                <div class="grid grid-cols-3 gap-2">
                  @for (v of variants; track v.value) {
                    <button (click)="selectedVariant = v.value" class="p-3 rounded-lg border text-xs text-center transition-all"
                            [ngClass]="selectedVariant === v.value ? 'bg-blue-50 border-blue-500/50 text-blue-500' : 'bg-slate-700/20 border-slate-200 text-slate-400 hover:border-slate-300'">
                      {{ v.label }}
                    </button>
                  }
                </div>
              </div>

              <!-- Theme -->
              <div>
                <label class="block text-xs text-slate-400 mb-2">{{ lang.t('seal.theme') }}</label>
                <div class="grid grid-cols-3 gap-2">
                  @for (t of themes; track t.value) {
                    <button (click)="selectedTheme = t.value" class="p-3 rounded-lg border text-xs text-center transition-all"
                            [ngClass]="selectedTheme === t.value ? 'bg-blue-50 border-blue-500/50 text-blue-500' : 'bg-slate-700/20 border-slate-200 text-slate-400 hover:border-slate-300'">
                      {{ t.label }}
                    </button>
                  }
                </div>
              </div>

              <!-- Size -->
              <div>
                <label class="block text-xs text-slate-400 mb-2">{{ lang.t('seal.size') }}</label>
                <div class="grid grid-cols-3 gap-2">
                  @for (s of sizes; track s.value) {
                    <button (click)="selectedSize = s.value" class="p-3 rounded-lg border text-xs text-center transition-all"
                            [ngClass]="selectedSize === s.value ? 'bg-blue-50 border-blue-500/50 text-blue-500' : 'bg-slate-700/20 border-slate-200 text-slate-400 hover:border-slate-300'">
                      {{ s.label }}
                    </button>
                  }
                </div>
              </div>

              <!-- Company domain -->
              <div>
                <label class="block text-xs text-slate-400 mb-2">{{ lang.t('seal.website_domain') }}</label>
                <input [(ngModel)]="domain" type="text" placeholder="your-company.eu"
                       class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-500/50">
              </div>
            </div>
          </div>

          <!-- Embed code -->
          <div class="bg-white border border-slate-200 rounded-2xl p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm font-semibold text-slate-600">
                {{ lang.t('seal.embed_code') }}
              </h2>
              <button (click)="copyCode()" class="text-xs px-3 py-1.5 rounded-lg transition-all"
                      [ngClass]="copied() ? 'bg-blue-100 text-blue-600' : 'bg-slate-700/50 text-slate-400 hover:text-slate-900'">
                {{ copied() ? lang.t('seal.copied') : lang.t('seal.copy') }}
              </button>
            </div>
            <div class="bg-white rounded-lg p-4 overflow-x-auto">
              <pre class="text-xs text-slate-600 font-mono whitespace-pre-wrap break-all">{{ getEmbedCode() }}</pre>
            </div>
            <p class="text-[10px] text-slate-500 mt-3">
              {{ lang.t('seal.add_this_code_to_your_website_html_where') }}
            </p>
          </div>

          <!-- Benefits -->
          <div class="bg-gradient-to-br from-blue-600/5 to-blue-500/5 border border-blue-200 rounded-xl p-5">
            <h2 class="text-sm font-semibold text-slate-900 mb-3">
              {{ lang.t('seal.why_dora_trust_seal') }}
            </h2>
            <div class="space-y-2.5">
              @for (key of benefitKeys; track key) {
                <div class="flex items-start gap-2.5">
                  <div class="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg class="w-3 h-3 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m5 12 5 5L20 7"/></svg>
                  </div>
                  <span class="text-sm text-slate-600">{{ lang.t(key) }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Public verification info -->
      <div class="bg-white border border-slate-200 rounded-xl p-6">
        <div class="flex flex-col md:flex-row items-center gap-6">
          <div class="flex-1">
            <h2 class="text-lg font-bold text-slate-900 mb-2">
              {{ lang.t('seal.public_verification_page') }}
            </h2>
            <p class="text-sm text-slate-400">
              {{ lang.t('seal.each_seal_includes_a_unique_link_to_a_pu') }}
            </p>
          </div>
          <div class="flex-shrink-0 bg-slate-700/30 rounded-lg px-4 py-3 border border-slate-300/30">
            <div class="text-[10px] text-slate-500 mb-1">{{ lang.t('seal.verification_url') }}</div>
            <div class="text-xs font-mono text-blue-500">doraaudit.eu/verify/{{ getSealId() }}</div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TrustSealComponent implements OnInit {
  selectedVariant: SealVariant = 'shield';
  selectedTheme: SealTheme = 'dark';
  selectedSize: SealSize = 'md';
  domain = '';
  copied = signal(false);
  sealVerified = signal(false);
  companyDomain = signal('');
  sealExpiry = signal('');

  verificationSteps = signal<{ label: string; done: boolean }[]>([]);

  variants: { value: SealVariant; label: string }[] = [
    { value: 'shield', label: 'Shield' },
    { value: 'badge', label: 'Badge' },
    { value: 'minimal', label: 'Minimal' }
  ];
  themes: { value: SealTheme; label: string }[] = [
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
    { value: 'auto', label: 'Auto' }
  ];
  sizes: { value: SealSize; label: string }[] = [
    { value: 'sm', label: 'Small' },
    { value: 'md', label: 'Medium' },
    { value: 'lg', label: 'Large' }
  ];

  benefitKeys = [
    'seal.benefit_build_trust',
    'seal.benefit_compliance',
    'seal.benefit_verification',
    'seal.benefit_competitive',
    'seal.benefit_auto_updates'
  ];

  private sealToken = signal('');

  constructor(public lang: LangService, public auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    const history = this.getLocalStorage('assessment-history') || [];
    const hasAssessment = history.length > 0;
    const lastScore = hasAssessment ? (history[history.length - 1].scorePercentage || 0) : 0;
    const hasHighScore = lastScore >= 60;
    const email = this.auth.user()?.email || '';
    const hasProfile = !!email;

    // Check verification steps
    const steps = [
      { label: this.lang.t('seal.step_account_created'), done: hasProfile },
      { label: this.lang.t('seal.step_assessment_completed'), done: hasAssessment },
      { label: this.lang.t('seal.step_score_threshold'), done: hasHighScore },
      { label: this.lang.t('seal.step_domain_verification'), done: false },
    ];
    this.verificationSteps.set(steps);

    const verified = hasProfile && hasAssessment && hasHighScore;
    this.sealVerified.set(verified);

    // Set expiry date (1 year from last assessment)
    if (hasAssessment) {
      const lastDate = new Date(history[history.length - 1].date || Date.now());
      lastDate.setFullYear(lastDate.getFullYear() + 1);
      this.sealExpiry.set(lastDate.toISOString().split('T')[0]);
    }

    // Load or generate real seal from backend
    this.api.getMyTrustSeal().subscribe({
      next: (seal) => {
        if (seal.exists) {
          this.sealToken.set(seal.verificationToken);
          this.sealExpiry.set(seal.validUntil);
        } else if (verified) {
          // Auto-generate seal
          const companyName = hasAssessment ? (history[history.length - 1].companyName || '') : '';
          this.api.generateTrustSeal({ companyName, score: lastScore }).subscribe({
            next: (newSeal) => {
              this.sealToken.set(newSeal.verificationToken);
              this.sealExpiry.set(newSeal.validUntil);
            }
          });
        }
      }
    });
  }

  getSealContainerClass(): string {
    return this.selectedTheme === 'light' ? 'bg-white border border-slate-200' : 'bg-transparent';
  }

  getBadgeContainerClass(): string {
    if (this.selectedTheme === 'light') {
      return this.sealVerified() ? 'bg-white border-blue-300' : 'bg-white border-slate-200';
    }
    return this.sealVerified() ? 'bg-white border-blue-200' : 'bg-white border-slate-300';
  }

  getMinimalContainerClass(): string {
    if (this.selectedTheme === 'light') {
      return this.sealVerified() ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-slate-50';
    }
    return this.sealVerified() ? 'border-blue-200 bg-blue-50' : 'border-slate-300 bg-white';
  }

  getSealIconSize(): number {
    return this.selectedSize === 'sm' ? 40 : this.selectedSize === 'md' ? 56 : 72;
  }

  getSealId(): string {
    if (this.sealToken()) return this.sealToken();
    const email = this.auth.user()?.email || 'demo';
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = ((hash << 5) - hash) + email.charCodeAt(i);
      hash |= 0;
    }
    return 'DA' + Math.abs(hash).toString(36).toUpperCase().substring(0, 8);
  }

  getEmbedCode(): string {
    const sealId = this.getSealId();
    const theme = this.selectedTheme;
    const variant = this.selectedVariant;
    const size = this.selectedSize;
    return `<!-- DORA Trust Seal by DoraAudit.eu -->\n<a href="https://doraaudit.eu/verify/${sealId}"\n   target="_blank" rel="noopener"\n   title="DORA Compliance Verified by DoraAudit">\n  <img src="https://doraaudit.eu/api/seal/${sealId}?v=${variant}&t=${theme}&s=${size}"\n       alt="DORA Trust Seal - Verified by DoraAudit"\n       width="${size === 'sm' ? 120 : size === 'md' ? 160 : 200}"\n       height="${size === 'sm' ? 48 : size === 'md' ? 64 : 80}"\n       style="border:0;" />\n</a>`;
  }

  copyCode() {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(this.getEmbedCode());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }

  private getLocalStorage(key: string): any {
    if (typeof localStorage === 'undefined') return null;
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
  }
}
