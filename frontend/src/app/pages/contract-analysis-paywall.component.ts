import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';
import { ContractAnalysisResult } from '../models';

@Component({
  selector: 'app-contract-analysis',
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Paywall Modal -->
    <div *ngIf="showPaywall" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up">
        <div class="text-center">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h2 class="text-xl font-bold text-white mb-2">{{ lang.t('paywall.title') }}</h2>
          <p class="text-slate-400 text-sm mb-6">{{ lang.t('paywall.desc') }}</p>

          <div class="bg-slate-700/50 rounded-xl p-4 mb-6 text-left">
            <p class="text-xs text-slate-500 uppercase tracking-wide mb-2">{{ lang.t('paywall.includes') }}</p>
            <ul class="space-y-2">
              <li class="flex items-center gap-2 text-sm text-slate-300">
                <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                {{ lang.t('paywall.feature1') }}
              </li>
              <li class="flex items-center gap-2 text-sm text-slate-300">
                <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                {{ lang.t('paywall.feature2') }}
              </li>
              <li class="flex items-center gap-2 text-sm text-slate-300">
                <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                {{ lang.t('paywall.feature3') }}
              </li>
            </ul>
          </div>

          <a href="mailto:info@doraaudit.eu?subject=DORA%20lepingu%20anal%C3%BC%C3%BCs%20-%20hinnapakkumine"
             class="block w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 hover:from-emerald-400 hover:to-cyan-400 transition-all mb-3">
            {{ lang.t('paywall.contact') }}
          </a>
          <button (click)="showPaywall = false" class="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            {{ lang.t('paywall.close') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Upload Form -->
    <div *ngIf="!analyzing && !result" class="animate-fade-in-up">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold gradient-text mb-2">{{ lang.t('contract.title') }}</h1>
        <p class="text-slate-400 text-sm">{{ lang.t('contract.subtitle') }}</p>
      </div>

      <!-- Auto-demo banner -->
      <div *ngIf="autoDemo && !selectedFile" class="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 animate-fade-in">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-emerald-300">{{ lang.t('contract.auto_demo_title') }}</p>
            <p class="text-xs text-slate-400">{{ lang.t('contract.auto_demo_desc') }}</p>
          </div>
          <div class="ml-auto w-6 h-6 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
        </div>
      </div>

      <!-- DEMO: Load sample contract - FREE -->
      <div class="glass-card p-5 mb-6 border-emerald-500/30">
        <div class="flex items-center gap-2 mb-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase">{{ lang.t('paywall.free') }}</span>
          <span class="text-xs text-slate-500">Demo</span>
        </div>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-300">{{ lang.t('contract.sample_title') }}</p>
            <p class="text-xs text-slate-500">{{ lang.t('contract.sample_desc') }}</p>
          </div>
          <div class="flex items-center gap-2">
            <a href="/api/sample/sample-pdf" target="_blank"
               class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                      bg-slate-500/10 border border-slate-500/30 text-slate-400
                      hover:bg-slate-500/20 hover:text-slate-300 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              {{ lang.t('contract.download_sample') }}
            </a>
            <button (click)="loadSampleContract()" [disabled]="loadingSample"
                    class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                           bg-emerald-500/20 border border-emerald-500/30 text-emerald-400
                           hover:bg-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10
                           disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              <svg *ngIf="!loadingSample" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div *ngIf="loadingSample" class="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
              {{ lang.t('contract.try_demo') }}
            </button>
          </div>
        </div>
      </div>

      <!-- OWN CONTRACT: Paid feature -->
      <div class="glass-card p-6 mb-6 relative">
        <div class="flex items-center gap-2 mb-4">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 uppercase">{{ lang.t('paywall.paid') }}</span>
          <span class="text-xs text-slate-500">{{ lang.t('paywall.own_contract') }}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label for="paywall-company" class="block text-xs font-medium text-slate-400 mb-1.5">{{ lang.t('contract.company_name') }}</label>
            <input type="text" [(ngModel)]="companyName" id="paywall-company"
                   class="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-slate-100
                          focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 focus:outline-none transition-all duration-300"
                   [placeholder]="lang.t('contract.company_name')">
          </div>
          <div>
            <label for="paywall-contract" class="block text-xs font-medium text-slate-400 mb-1.5">{{ lang.t('contract.contract_name') }}</label>
            <input type="text" [(ngModel)]="contractName" id="paywall-contract"
                   class="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-slate-100
                          focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 focus:outline-none transition-all duration-300"
                   [placeholder]="lang.t('contract.contract_name')">
          </div>
        </div>

        <!-- Drag and drop zone - triggers paywall -->
        <div class="mb-6">
          <label id="paywall-upload-label" class="block text-xs font-medium text-slate-400 mb-1.5">{{ lang.t('contract.upload_label') }}</label>
          <div (click)="triggerPaywall()" aria-labelledby="paywall-upload-label" role="button" tabindex="0"
               (dragover)="onDragOver($event)"
               (dragleave)="onDragLeave($event)"
               (drop)="onDropPaywall($event)"
               [class]="'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ' +
                        (dragOver ? 'border-amber-400 bg-amber-400/5' : 'border-slate-600/50 hover:border-amber-500/30 hover:bg-slate-800/30')">
            <div>
              <svg class="w-10 h-10 mx-auto mb-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <p class="text-sm text-slate-400 mb-1">{{ lang.t('contract.drag_drop') }}</p>
              <p class="text-xs text-amber-500">{{ lang.t('paywall.click_for_pricing') }}</p>
            </div>
          </div>
        </div>

        <button (click)="triggerPaywall()"
                class="w-full py-3 rounded-lg font-semibold transition-all duration-300
                       bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white hover:shadow-lg hover:shadow-amber-500/25">
          {{ lang.t('paywall.get_pricing') }}
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div *ngIf="analyzing" class="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div class="w-16 h-16 border-4 border-slate-700 border-t-emerald-400 rounded-full animate-spin mb-6"></div>
      <h2 class="text-xl font-semibold text-slate-200 mb-2">{{ lang.t('contract.analyzing') }}</h2>
      <p class="text-sm text-slate-500 text-center max-w-md">{{ lang.t('contract.ai_note') }}</p>
      <div class="flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
        <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
        <span class="text-xs text-slate-400">Claude AI</span>
      </div>
    </div>

    <!-- Error -->
    <div *ngIf="error && !analyzing" class="glass-card p-6 border-red-500/30 mb-6 animate-fade-in">
      <div class="flex items-center gap-3">
        <svg class="w-6 h-6 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
        </svg>
        <p class="text-sm text-red-300">{{ lang.t('contract.error') }}</p>
      </div>
    </div>

    <!-- Results -->
    <div *ngIf="result" class="animate-fade-in-up">
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
          <span class="text-xs font-medium text-emerald-400">Demo</span>
        </div>
        <h1 class="text-2xl font-bold gradient-text mb-1">{{ lang.t('contract.results') }}</h1>
        <p class="text-slate-500 text-sm">{{ result.companyName }} &middot; {{ result.contractName }}</p>
      </div>

      <!-- Score overview -->
      <div class="glass-card p-6 mb-6">
        <div class="flex flex-col md:flex-row items-center gap-6">
          <!-- Score circle -->
          <div class="relative w-28 h-28 shrink-0">
            <svg class="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(30,41,59)" stroke-width="8"/>
              <circle cx="50" cy="50" r="42" fill="none"
                      [attr.stroke]="result.complianceLevel === 'GREEN' ? 'rgb(16,185,129)' : result.complianceLevel === 'YELLOW' ? 'rgb(245,158,11)' : 'rgb(239,68,68)'"
                      stroke-width="8" stroke-linecap="round"
                      [attr.stroke-dasharray]="2 * 3.14159 * 42"
                      [attr.stroke-dashoffset]="2 * 3.14159 * 42 * (1 - result.scorePercentage / 100)"/>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-2xl font-bold"
                    [class]="result.complianceLevel === 'GREEN' ? 'text-emerald-400' : result.complianceLevel === 'YELLOW' ? 'text-amber-400' : 'text-red-400'">
                {{ result.scorePercentage | number:'1.0-0' }}%
              </span>
            </div>
          </div>

          <!-- Stats -->
          <div class="flex-1 grid grid-cols-3 gap-4 w-full">
            <div class="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div class="text-2xl font-bold text-emerald-400">{{ result.foundCount }}</div>
              <div class="text-xs text-slate-400">{{ lang.t('contract.found') }}</div>
            </div>
            <div class="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div class="text-2xl font-bold text-amber-400">{{ result.partialCount }}</div>
              <div class="text-xs text-slate-400">{{ lang.t('contract.partial') }}</div>
            </div>
            <div class="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div class="text-2xl font-bold text-red-400">{{ result.missingCount }}</div>
              <div class="text-xs text-slate-400">{{ lang.t('contract.missing') }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div *ngIf="result.summary" class="glass-card p-5 mb-6">
        <h3 class="text-sm font-semibold text-slate-300 mb-2">{{ lang.t('contract.summary') }}</h3>
        <p class="text-sm text-slate-400 leading-relaxed">{{ result.summary }}</p>
      </div>

      <!-- Findings -->
      <div *ngFor="let finding of result.findings; let i = index"
           class="glass-card p-5 mb-3 card-hover"
           [style.animation-delay]="(i * 60) + 'ms'">
        <div class="flex items-start gap-3">
          <div [class]="'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ' +
                        (finding.status === 'found' ? 'bg-emerald-500/20 text-emerald-400' :
                         finding.status === 'partial' ? 'bg-amber-500/20 text-amber-400' :
                                                        'bg-red-500/20 text-red-400')">
            <svg *ngIf="finding.status === 'found'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <svg *ngIf="finding.status === 'partial'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
            <svg *ngIf="finding.status === 'missing'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="text-sm font-semibold text-slate-200">{{ lang.currentLang === 'et' ? finding.requirementEt : finding.requirementEn }}</h3>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-700/50 text-slate-400 shrink-0">
                {{ finding.doraReference }}
              </span>
            </div>

            <div *ngIf="finding.quote" class="mt-2 pl-3 border-l-2 border-emerald-500/30 bg-emerald-500/5 rounded-r-lg py-2 pr-3">
              <p class="text-xs text-slate-500 mb-0.5">{{ lang.t('contract.quote') }}</p>
              <p class="text-xs text-slate-300 italic">"{{ finding.quote }}"</p>
            </div>

            <div *ngIf="lang.currentLang === 'et' ? finding.recommendationEt : finding.recommendationEn" class="mt-2 pl-3 border-l-2 border-amber-500/30 bg-amber-500/5 rounded-r-lg py-2 pr-3">
              <p class="text-xs text-slate-500 mb-0.5">{{ lang.t('contract.recommendation') }}</p>
              <p class="text-xs text-slate-300">{{ lang.currentLang === 'et' ? finding.recommendationEt : finding.recommendationEn }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA for own contract -->
      <div class="glass-card p-6 mb-6 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
        <div class="text-center">
          <h3 class="text-lg font-semibold text-white mb-2">{{ lang.t('paywall.liked_demo') }}</h3>
          <p class="text-sm text-slate-400 mb-4">{{ lang.t('paywall.analyze_own') }}</p>
          <a href="mailto:info@doraaudit.eu?subject=DORA%20lepingu%20anal%C3%BC%C3%BCs%20-%20hinnapakkumine"
             class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 transition-all">
            {{ lang.t('paywall.contact') }}
          </a>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex items-center justify-center gap-3 mt-8">
        <button (click)="resetForm()"
                class="px-6 py-2.5 rounded-lg font-medium text-sm bg-slate-700/50 text-slate-300 border border-slate-600/30
                       hover:bg-slate-600/50 hover:text-emerald-400 transition-all duration-200">
          {{ lang.t('contract.new_analysis') }}
        </button>
      </div>
    </div>
  `
})
export class ContractAnalysisComponent implements OnInit {
  companyName = '';
  contractName = '';
  selectedFile: File | null = null;
  dragOver = false;
  analyzing = false;
  loadingSample = false;
  error = '';
  result: ContractAnalysisResult | null = null;
  autoDemo = false;
  showPaywall = false;

  constructor(private api: ApiService, public lang: LangService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['sample'] === 'true') {
        this.autoDemo = true;
        this.loadSampleAndAnalyze();
      }
    });
  }

  private loadSampleAndAnalyze() {
    this.loadingSample = true;
    this.api.getSampleContract().subscribe({
      next: (blob) => {
        this.selectedFile = new File([blob], 'sample_ikt_leping.pdf', { type: 'application/pdf' });
        this.companyName = 'OÜ Näidis Finants';
        this.contractName = 'IKT pilveteenuse leping 2025';
        this.loadingSample = false;
        this.onSubmit();
      },
      error: () => {
        this.error = 'Failed to load sample contract';
        this.loadingSample = false;
        this.autoDemo = false;
      }
    });
  }

  triggerPaywall() {
    this.showPaywall = true;
  }

  loadSampleContract() {
    this.loadingSample = true;
    this.api.getSampleContract().subscribe({
      next: (blob) => {
        this.selectedFile = new File([blob], 'sample_ikt_leping.pdf', { type: 'application/pdf' });
        this.companyName = 'OÜ Näidis Finants';
        this.contractName = 'IKT pilveteenuse leping 2025';
        this.loadingSample = false;
        this.onSubmit();
      },
      error: () => {
        this.error = 'Failed to load sample contract';
        this.loadingSample = false;
      }
    });
  }

  get canSubmit(): boolean {
    return this.companyName.trim() !== '' &&
           this.contractName.trim() !== '' &&
           this.selectedFile !== null &&
           !this.analyzing;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  onDropPaywall(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
    this.showPaywall = true;
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  onSubmit() {
    if (!this.canSubmit || !this.selectedFile) return;
    this.analyzing = true;
    this.error = '';
    this.api.analyzeContract(this.selectedFile, this.companyName, this.contractName)
      .subscribe({
        next: (res) => {
          this.result = res;
          this.analyzing = false;
        },
        error: () => {
          this.error = 'Analysis failed';
          this.analyzing = false;
        }
      });
  }

  resetForm() {
    this.result = null;
    this.selectedFile = null;
    this.error = '';
    this.companyName = '';
    this.contractName = '';
  }
}
