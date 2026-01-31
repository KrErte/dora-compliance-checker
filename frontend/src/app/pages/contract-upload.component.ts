import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';
import { DEMO_SCENARIOS } from '../mock-scenarios';
import { ContractAnalysisResult } from '../models';

@Component({
  selector: 'app-contract-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          DORA Art. 30
        </div>
        <h1 class="text-3xl font-bold text-white mb-3">{{ lang.t('contract.title') }}</h1>
        <p class="text-slate-400 text-sm max-w-lg mx-auto">{{ lang.t('contract.subtitle') }}</p>
      </div>

      <!-- Loading overlay -->
      <div *ngIf="loading" class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div class="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <div class="w-16 h-16 mx-auto mb-6 relative">
            <div class="absolute inset-0 rounded-full border-4 border-slate-700"></div>
            <div class="absolute inset-0 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin"></div>
          </div>
          <p class="text-white font-semibold text-lg mb-2">{{ lang.t('contract.analyzing') }}</p>
          <p class="text-slate-400 text-sm">{{ loadingStep }}</p>
          <div class="mt-4 flex items-center justify-center gap-2">
            <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style="animation-delay: 0.4s"></div>
          </div>
        </div>
      </div>

      <!-- Upload form -->
      <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-8">

        <!-- Drag and drop area -->
        <div
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          (click)="fileInput.click()"
          [class]="'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ' +
            (isDragging ? 'border-emerald-400 bg-emerald-500/10' :
             selectedFile ? 'border-emerald-500/50 bg-emerald-500/5' :
             'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30')">

          <input #fileInput type="file" class="hidden" accept=".pdf,.docx" (change)="onFileSelected($event)">

          <div *ngIf="!selectedFile">
            <svg class="w-12 h-12 mx-auto mb-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            <p class="text-white font-medium mb-1">{{ lang.t('contract.drop_file') }}</p>
            <p class="text-slate-500 text-sm">{{ lang.t('contract.file_types') }}</p>
          </div>

          <div *ngIf="selectedFile" class="flex items-center justify-center gap-3">
            <svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <div class="text-left">
              <p class="text-white font-medium">{{ selectedFile.name }}</p>
              <p class="text-slate-500 text-xs">{{ formatFileSize(selectedFile.size) }}</p>
            </div>
            <button (click)="removeFile($event)" class="ml-4 text-slate-500 hover:text-red-400 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Form fields -->
        <div class="mt-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1.5">{{ lang.t('contract.company_name') }} *</label>
            <input [(ngModel)]="companyName" type="text"
                   class="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                   [placeholder]="lang.t('contract.company_placeholder')">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1.5">{{ lang.t('contract.contract_name') }} *</label>
            <input [(ngModel)]="contractName" type="text"
                   class="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                   [placeholder]="lang.t('contract.contract_placeholder')">
          </div>
        </div>

        <!-- Error message -->
        <div *ngIf="errorMessage" class="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {{ errorMessage }}
        </div>

        <!-- Submit button -->
        <button (click)="startAnalysis()"
                [disabled]="!canSubmit()"
                [class]="'w-full mt-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ' +
                  (canSubmit() ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5' :
                   'bg-slate-700 text-slate-500 cursor-not-allowed')">
          {{ lang.t('contract.start_analysis') }}
        </button>
      </div>

      <!-- Demo scenarios -->
      <div class="mt-8">
        <h2 class="text-lg font-semibold text-white mb-1">{{ lang.t('contract.demo_title') }}</h2>
        <p class="text-slate-500 text-sm mb-4">{{ lang.t('contract.demo_desc') }}</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div *ngFor="let scenario of scenarios"
               (click)="openDemo(scenario)"
               class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 cursor-pointer hover:border-slate-500 hover:bg-slate-700/30 transition-all group">
            <div class="flex items-center justify-between mb-3">
              <span [class]="'text-2xl font-bold ' + scoreColorClass(scenario)">{{ scenario.defensibilityScore | number:'1.0-0' }}%</span>
              <span [class]="'px-2 py-0.5 rounded-full text-xs font-bold ' + levelBadge(scenario)">{{ levelText(scenario) }}</span>
            </div>
            <h3 class="text-white font-medium text-sm mb-1">{{ scenario.contractName }}</h3>
            <p class="text-slate-500 text-xs mb-3">{{ scenario.companyName }}</p>
            <div class="flex items-center gap-3 text-xs text-slate-500 mb-3">
              <span class="text-emerald-400">{{ scenario.coveredCount }} {{ lang.t('contract.covered').toLowerCase() }}</span>
              <span class="text-yellow-400">{{ scenario.weakCount }} {{ lang.t('contract.weak').toLowerCase() }}</span>
              <span class="text-red-400">{{ scenario.missingCount }} {{ lang.t('contract.missing').toLowerCase() }}</span>
            </div>
            <div class="text-emerald-400 text-xs font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
              {{ lang.t('contract.demo_view') }}
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Sample contracts for download -->
      <div class="mt-8">
        <h2 class="text-lg font-semibold text-white mb-1">{{ lang.t('contract.samples_title') }}</h2>
        <p class="text-slate-500 text-sm mb-4">{{ lang.t('contract.samples_desc') }}</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div *ngFor="let sample of sampleContracts"
               class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <div class="flex items-center gap-2 mb-2">
              <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span [class]="'px-2 py-0.5 rounded-full text-xs font-bold ' + sample.badgeClass">{{ sample.label }}</span>
            </div>
            <h3 class="text-white font-medium text-sm mb-1">{{ sample.name }}</h3>
            <p class="text-slate-500 text-xs mb-3">{{ lang.t(sample.descKey) }}</p>
            <button (click)="downloadSample(sample.level)"
                    class="flex items-center gap-1.5 text-emerald-400 text-xs font-medium hover:text-emerald-300 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              {{ lang.t('contract.sample_download') }} PDF
            </button>
          </div>
        </div>
      </div>

      <!-- Info box -->
      <div class="mt-6 bg-slate-800/30 border border-slate-700/30 rounded-xl p-5">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">{{ lang.t('contract.how_it_works') }}</h3>
        <div class="space-y-2.5">
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0 mt-0.5">1</div>
            <p class="text-slate-400 text-sm">{{ lang.t('contract.step1') }}</p>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0 mt-0.5">2</div>
            <p class="text-slate-400 text-sm">{{ lang.t('contract.step2') }}</p>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0 mt-0.5">3</div>
            <p class="text-slate-400 text-sm">{{ lang.t('contract.step3') }}</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ContractUploadComponent {
  selectedFile: File | null = null;
  companyName = '';
  contractName = '';
  isDragging = false;
  loading = false;
  loadingStep = '';
  errorMessage = '';
  scenarios = DEMO_SCENARIOS;
  sampleContracts = [
    { level: 'good', name: 'Pilveteenus leping (hea)', label: '~85%', badgeClass: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', descKey: 'contract.sample_good' },
    { level: 'medium', name: 'IT hooldusleping (keskmine)', label: '~58%', badgeClass: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30', descKey: 'contract.sample_medium' },
    { level: 'weak', name: 'Serverimajutus leping (nork)', label: '~23%', badgeClass: 'bg-red-500/20 text-red-400 border border-red-500/30', descKey: 'contract.sample_weak' },
  ];

  constructor(
    public lang: LangService,
    private api: ApiService,
    private router: Router,
    private http: HttpClient
  ) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.validateAndSetFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.validateAndSetFile(input.files[0]);
    }
  }

  private validateAndSetFile(file: File) {
    this.errorMessage = '';
    const name = file.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.docx')) {
      this.errorMessage = this.lang.t('contract.error_file_type');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage = this.lang.t('contract.error_file_size');
      return;
    }
    this.selectedFile = file;
  }

  removeFile(event: Event) {
    event.stopPropagation();
    this.selectedFile = null;
  }

  canSubmit(): boolean {
    return this.selectedFile !== null && this.companyName.trim() !== '' && this.contractName.trim() !== '' && !this.loading;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  startAnalysis() {
    if (!this.canSubmit() || !this.selectedFile) return;

    this.loading = true;
    this.errorMessage = '';
    this.loadingStep = this.lang.t('contract.step_extracting');

    // Simulate step progression
    setTimeout(() => {
      if (this.loading) this.loadingStep = this.lang.t('contract.step_mapping');
    }, 3000);
    setTimeout(() => {
      if (this.loading) this.loadingStep = this.lang.t('contract.step_scoring');
    }, 8000);

    this.api.analyzeContract(this.selectedFile, this.companyName.trim(), this.contractName.trim())
      .subscribe({
        next: (result) => {
          this.loading = false;
          this.router.navigate(['/contract-results', result.id]);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.message || this.lang.t('contract.error_analysis');
        }
      });
  }

  downloadSample(level: string) {
    this.http.get(`/api/contract-analysis/sample/${level}`, { responseType: 'blob' }).subscribe(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Naidisleping_${level}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  openDemo(scenario: ContractAnalysisResult) {
    this.router.navigate(['/contract-results', scenario.id]);
  }

  scoreColorClass(s: ContractAnalysisResult): string {
    if (s.defensibilityScore >= 80) return 'text-emerald-400';
    if (s.defensibilityScore >= 50) return 'text-yellow-400';
    return 'text-red-400';
  }

  levelBadge(s: ContractAnalysisResult): string {
    switch (s.defensibilityLevel) {
      case 'GREEN': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'YELLOW': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'RED': return 'bg-red-500/20 text-red-400 border border-red-500/30';
    }
  }

  levelText(s: ContractAnalysisResult): string {
    const et = this.lang.currentLang === 'et';
    switch (s.defensibilityLevel) {
      case 'GREEN': return et ? 'KAITSTAV' : 'DEFENSIBLE';
      case 'YELLOW': return et ? 'OSALINE' : 'PARTIAL';
      case 'RED': return et ? 'KAITSMATA' : 'NOT DEFENSIBLE';
    }
  }
}
