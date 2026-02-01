import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';
import { ContractAnalysisResult } from '../models';

@Component({
  selector: 'app-contract-analysis',
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Upload Form -->
    <div *ngIf="!analyzing && !result" class="animate-fade-in-up">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold gradient-text mb-2">{{ lang.t('contract.title') }}</h1>
        <p class="text-slate-400 text-sm">{{ lang.t('contract.subtitle') }}</p>
      </div>

      <!-- Load sample contract -->
      <div class="glass-card p-5 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-300">{{ lang.t('contract.sample_title') }}</p>
            <p class="text-xs text-slate-500">{{ lang.t('contract.sample_desc') }}</p>
          </div>
          <button (click)="loadSampleContract()" [disabled]="loadingSample"
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                         bg-cyan-500/10 border border-cyan-500/30 text-cyan-400
                         hover:bg-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/10
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            <svg *ngIf="!loadingSample" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <div *ngIf="loadingSample" class="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
            {{ lang.t('contract.load_sample') }}
          </button>
        </div>
      </div>

      <div class="glass-card p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">{{ lang.t('contract.company_name') }}</label>
            <input type="text" [(ngModel)]="companyName"
                   class="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-slate-100
                          focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 focus:outline-none transition-all duration-300"
                   [placeholder]="lang.t('contract.company_name')">
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">{{ lang.t('contract.contract_name') }}</label>
            <input type="text" [(ngModel)]="contractName"
                   class="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-slate-100
                          focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 focus:outline-none transition-all duration-300"
                   [placeholder]="lang.t('contract.contract_name')">
          </div>
        </div>

        <!-- Drag and drop zone -->
        <div class="mb-6">
          <label class="block text-xs font-medium text-slate-400 mb-1.5">{{ lang.t('contract.upload_label') }}</label>
          <div (click)="fileInput.click()"
               (dragover)="onDragOver($event)"
               (dragleave)="onDragLeave($event)"
               (drop)="onDrop($event)"
               [class]="'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ' +
                        (dragOver ? 'border-emerald-400 bg-emerald-400/5' : 'border-slate-600/50 hover:border-slate-500 hover:bg-slate-800/30')">
            <div *ngIf="!selectedFile">
              <svg class="w-10 h-10 mx-auto mb-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
              <p class="text-sm text-slate-400 mb-1">{{ lang.t('contract.drag_drop') }}</p>
              <p class="text-xs text-slate-600">PDF, DOCX &middot; {{ lang.t('contract.upload_hint') }}</p>
            </div>
            <div *ngIf="selectedFile" class="flex items-center justify-center gap-3">
              <svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <div class="text-left">
                <p class="text-sm text-slate-200 font-medium">{{ selectedFile.name }}</p>
                <p class="text-xs text-slate-500">{{ formatSize(selectedFile.size) }}</p>
              </div>
              <button (click)="removeFile($event)" class="ml-2 text-slate-500 hover:text-red-400 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          <input #fileInput type="file" accept=".pdf,.docx" (change)="onFileSelect($event)" class="hidden">
        </div>

        <button (click)="onSubmit()" [disabled]="!canSubmit"
                [class]="'w-full py-3 rounded-lg font-semibold transition-all duration-300 ' +
                         (canSubmit ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-900 hover:shadow-lg hover:shadow-emerald-500/25' :
                                      'bg-slate-700/50 text-slate-500 cursor-not-allowed')">
          {{ lang.t('contract.analyze') }}
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

      <!-- Riskiest Areas -->
      <div *ngIf="riskFindings.length > 0" class="mb-6 rounded-xl border border-red-500/30 bg-red-500/5 p-5">
        <div class="flex items-center gap-2 mb-4">
          <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
          <div>
            <h3 class="text-sm font-semibold text-red-300">{{ lang.t('contract.risk_areas') }}</h3>
            <p class="text-xs text-slate-500">{{ lang.t('contract.risk_areas_desc') }}</p>
          </div>
        </div>
        <div *ngFor="let rf of riskFindings; let ri = index"
             [class]="'flex items-start gap-3 py-3' + (ri > 0 ? ' border-t border-slate-700/50' : '')">
          <span [class]="'px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ' +
                         (rf.status === 'missing' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400')">
            {{ rf.status === 'missing' ? (lang.currentLang === 'et' ? 'PUUDU' : 'MISSING') : (lang.currentLang === 'et' ? 'OSALISELT' : 'PARTIAL') }}
          </span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <span class="text-sm font-medium text-slate-200">{{ lang.currentLang === 'et' ? rf.requirementEt : rf.requirementEn }}</span>
              <span class="text-[10px] text-slate-500">{{ rf.doraReference }}</span>
            </div>
            <p class="text-xs text-slate-400">{{ lang.currentLang === 'et' ? rf.recommendationEt : rf.recommendationEn }}</p>
          </div>
        </div>
      </div>

      <!-- Findings -->
      <div *ngFor="let finding of result.findings; let i = index"
           class="glass-card p-5 mb-3 card-hover"
           [style.animation-delay]="(i * 60) + 'ms'">
        <div class="flex items-start gap-3">
          <!-- Status icon -->
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

            <!-- Quote -->
            <div *ngIf="finding.quote" class="mt-2 pl-3 border-l-2 border-emerald-500/30 bg-emerald-500/5 rounded-r-lg py-2 pr-3">
              <p class="text-xs text-slate-500 mb-0.5">{{ lang.t('contract.quote') }}</p>
              <p class="text-xs text-slate-300 italic">"{{ finding.quote }}"</p>
            </div>

            <!-- Recommendation -->
            <div *ngIf="lang.currentLang === 'et' ? finding.recommendationEt : finding.recommendationEn" class="mt-2 pl-3 border-l-2 border-amber-500/30 bg-amber-500/5 rounded-r-lg py-2 pr-3">
              <p class="text-xs text-slate-500 mb-0.5">{{ lang.t('contract.recommendation') }}</p>
              <p class="text-xs text-slate-300">{{ lang.currentLang === 'et' ? finding.recommendationEt : finding.recommendationEn }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex items-center justify-center gap-3 mt-8">
        <button (click)="downloadPdf()"
                class="px-6 py-2.5 rounded-lg font-medium text-sm bg-gradient-to-r from-emerald-500 to-cyan-500
                       text-slate-900 hover:from-emerald-400 hover:to-cyan-400 hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300
                       flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          {{ lang.t('contract.download_pdf') }}
        </button>
        <button (click)="resetForm()"
                class="px-6 py-2.5 rounded-lg font-medium text-sm bg-slate-700/50 text-slate-300 border border-slate-600/30
                       hover:bg-slate-600/50 hover:text-emerald-400 transition-all duration-200">
          {{ lang.t('contract.new_analysis') }}
        </button>
      </div>
    </div>
  `
})
export class ContractAnalysisComponent {
  companyName = '';
  contractName = '';
  selectedFile: File | null = null;
  dragOver = false;
  analyzing = false;
  loadingSample = false;
  error = '';
  result: ContractAnalysisResult | null = null;

  constructor(private api: ApiService, public lang: LangService) {}

  get riskFindings() {
    if (!this.result) return [];
    return this.result.findings
      .filter(f => f.status === 'missing' || f.status === 'partial')
      .sort((a, b) => a.status === 'missing' && b.status !== 'missing' ? -1 : a.status !== 'missing' && b.status === 'missing' ? 1 : 0);
  }

  loadSampleContract() {
    this.loadingSample = true;
    this.api.getSampleContract().subscribe({
      next: (blob) => {
        this.selectedFile = new File([blob], 'sample_ikt_leping.pdf', { type: 'application/pdf' });
        this.companyName = 'OÜ DigiLahendused';
        this.contractName = 'IKT pilveteenuse leping 2025';
        this.loadingSample = false;
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

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
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

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      const name = file.name.toLowerCase();
      if (name.endsWith('.pdf') || name.endsWith('.docx')) {
        this.selectedFile = file;
      }
    }
  }

  removeFile(event: Event) {
    event.stopPropagation();
    this.selectedFile = null;
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

  downloadPdf() {
    if (!this.result) return;
    const r = this.result;
    const isEt = this.lang.currentLang === 'et';

    const statusLabel = (s: string) => s === 'found' ? (isEt ? 'LEITUD' : 'FOUND') :
                                        s === 'partial' ? (isEt ? 'OSALISELT' : 'PARTIAL') :
                                                          (isEt ? 'PUUDU' : 'MISSING');

    let html = `<html><head><meta charset="utf-8"><style>
      body{font-family:Arial,sans-serif;margin:40px;color:#1e293b}
      h1{color:#059669;font-size:22px;border-bottom:2px solid #059669;padding-bottom:8px}
      h2{font-size:16px;margin-top:24px;color:#334155}
      .meta{color:#64748b;font-size:13px;margin-bottom:16px}
      .score{font-size:36px;font-weight:bold;text-align:center;padding:16px;border-radius:8px;margin:16px 0}
      .score.green{color:#059669;background:#ecfdf5} .score.yellow{color:#d97706;background:#fffbeb} .score.red{color:#dc2626;background:#fef2f2}
      .stats{display:flex;gap:16px;margin:12px 0}
      .stat{flex:1;text-align:center;padding:12px;border-radius:8px;font-size:13px}
      .stat.found{background:#ecfdf5;color:#059669} .stat.partial{background:#fffbeb;color:#d97706} .stat.missing{background:#fef2f2;color:#dc2626}
      .stat .num{font-size:24px;font-weight:bold}
      .finding{border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin:8px 0}
      .finding-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
      .finding-title{font-weight:600;font-size:14px}
      .badge{font-size:11px;padding:2px 8px;border-radius:4px;font-weight:600}
      .badge.found{background:#dcfce7;color:#166534} .badge.partial{background:#fef3c7;color:#92400e} .badge.missing{background:#fee2e2;color:#991b1b}
      .ref{font-size:11px;color:#94a3b8;margin-left:8px}
      .quote{background:#f0fdf4;border-left:3px solid #34d399;padding:8px 12px;margin:6px 0;font-style:italic;font-size:12px;color:#475569}
      .rec{background:#fffbeb;border-left:3px solid #fbbf24;padding:8px 12px;margin:6px 0;font-size:12px;color:#475569}
      .summary{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin:12px 0;font-size:13px;color:#475569}
      @media print{body{margin:20px}}
    </style></head><body>`;
    html += `<h1>DORA ${isEt ? 'Lepingu anal\u00fc\u00fcs' : 'Contract Analysis'}</h1>`;
    html += `<div class="meta">${r.companyName} &middot; ${r.contractName} &middot; ${r.fileName}<br>${new Date(r.analysisDate).toLocaleDateString()}</div>`;
    html += `<div class="score ${r.complianceLevel.toLowerCase()}">${r.scorePercentage.toFixed(0)}%</div>`;
    html += `<div class="stats">
      <div class="stat found"><div class="num">${r.foundCount}</div>${isEt ? 'Leitud' : 'Found'}</div>
      <div class="stat partial"><div class="num">${r.partialCount}</div>${isEt ? 'Osaliselt' : 'Partial'}</div>
      <div class="stat missing"><div class="num">${r.missingCount}</div>${isEt ? 'Puudu' : 'Missing'}</div>
    </div>`;
    if (r.summary) {
      html += `<div class="summary"><strong>${isEt ? 'Kokkuv\u00f5te' : 'Summary'}:</strong> ${r.summary}</div>`;
    }
    html += `<h2>${isEt ? 'Detailsed tulemused' : 'Detailed Findings'}</h2>`;
    for (const f of r.findings) {
      const req = isEt ? f.requirementEt : f.requirementEn;
      const rec = isEt ? f.recommendationEt : f.recommendationEn;
      html += `<div class="finding">
        <div class="finding-header">
          <span class="finding-title">${f.requirementId}. ${req}<span class="ref">${f.doraReference}</span></span>
          <span class="badge ${f.status}">${statusLabel(f.status)}</span>
        </div>`;
      if (f.quote) html += `<div class="quote">"${f.quote}"</div>`;
      if (rec) html += `<div class="rec"><strong>${isEt ? 'Soovitus' : 'Recommendation'}:</strong> ${rec}</div>`;
      html += `</div>`;
    }
    html += `</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  }
}
