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
              <h3 class="text-sm font-semibold text-slate-200">{{ finding.requirement }}</h3>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-700/50 text-slate-400 shrink-0">
                {{ finding.articleReference }}
              </span>
            </div>

            <!-- Quote -->
            <div *ngIf="finding.quote" class="mt-2 pl-3 border-l-2 border-emerald-500/30 bg-emerald-500/5 rounded-r-lg py-2 pr-3">
              <p class="text-xs text-slate-500 mb-0.5">{{ lang.t('contract.quote') }}</p>
              <p class="text-xs text-slate-300 italic">"{{ finding.quote }}"</p>
            </div>

            <!-- Recommendation -->
            <div *ngIf="finding.recommendation" class="mt-2 pl-3 border-l-2 border-amber-500/30 bg-amber-500/5 rounded-r-lg py-2 pr-3">
              <p class="text-xs text-slate-500 mb-0.5">{{ lang.t('contract.recommendation') }}</p>
              <p class="text-xs text-slate-300">{{ finding.recommendation }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- New analysis button -->
      <div class="text-center mt-8">
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
  error = '';
  result: ContractAnalysisResult | null = null;

  constructor(private api: ApiService, public lang: LangService) {}

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
}
