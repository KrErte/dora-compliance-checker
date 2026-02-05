import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';
import { AuthService } from '../auth/auth.service';
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

      <!-- Demo mode: Generate sample contract -->
      <div *ngIf="autoDemo && !selectedFile" class="mb-6 rounded-xl border-2 border-dashed border-emerald-500/50 bg-emerald-500/5 p-8 animate-fade-in">
        <div class="text-center">
          <div class="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-emerald-300 mb-2">{{ lang.t('contract.demo_title') }}</h3>
          <p class="text-sm text-slate-400 mb-6 max-w-md mx-auto">{{ lang.t('contract.demo_desc') }}</p>
          <button (click)="loadSampleContract()" [disabled]="loadingSample"
                  class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm
                         bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900
                         hover:from-emerald-400 hover:to-cyan-400 hover:shadow-lg hover:shadow-emerald-500/25
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
            <svg *ngIf="!loadingSample" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <div *ngIf="loadingSample" class="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
            {{ lang.t('contract.generate_sample') }}
          </button>
        </div>
      </div>

      <!-- Load sample contract (hidden in demo mode) -->
      <div *ngIf="!autoDemo" class="glass-card p-5 mb-6">
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

        <div class="flex gap-3">
          <button (click)="onSubmit()" [disabled]="!canSubmit"
                  [class]="'flex-1 py-3 rounded-lg font-semibold transition-all duration-300 ' +
                           (canSubmit ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-900 hover:shadow-lg hover:shadow-emerald-500/25' :
                                        'bg-slate-700/50 text-slate-500 cursor-not-allowed')">
            {{ lang.t('contract.analyze') }}
          </button>
          <!-- Demo Mock button - only for non-logged-in users -->
          <button *ngIf="!auth.isLoggedIn()" (click)="loadMockResult()"
                  class="px-6 py-3 rounded-lg font-semibold transition-all duration-300
                         bg-slate-700/50 text-slate-300 border border-slate-600/50
                         hover:bg-slate-600/50 hover:text-emerald-400 hover:border-emerald-500/30">
            Demo
          </button>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div *ngIf="analyzing" class="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div class="w-16 h-16 border-4 border-slate-700 border-t-emerald-400 rounded-full animate-spin mb-6"></div>
      <h2 class="text-xl font-semibold text-slate-200 mb-2">{{ lang.t('contract.analyzing') }}</h2>
      <p class="text-sm text-slate-500 text-center max-w-md">{{ lang.t('contract.ai_note') }}</p>
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
          <div class="flex-1 grid grid-cols-3 gap-2 sm:gap-4 w-full">
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

      <!-- Suggested contract clauses for missing/partial -->
      <div *ngIf="riskFindings.length > 0" class="glass-card p-5 mb-6">
        <div class="flex items-center gap-2 mb-4">
          <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <div>
            <h3 class="text-sm font-semibold text-cyan-300">{{ lang.t('contract.suggested_clauses') }}</h3>
            <p class="text-xs text-slate-500">{{ lang.t('contract.suggested_clauses_desc') }}</p>
          </div>
        </div>
        <div *ngFor="let rf of riskFindings; let ci = index"
             [class]="'py-3' + (ci > 0 ? ' border-t border-slate-700/50' : '')">
          <p class="text-xs font-medium text-slate-300 mb-1">{{ lang.currentLang === 'et' ? rf.requirementEt : rf.requirementEn }}
            <span class="text-slate-600 ml-1">{{ rf.doraReference }}</span>
          </p>
          <div class="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 mt-1">
            <p class="text-xs text-cyan-300/80 font-mono leading-relaxed">{{ getClause(rf.requirementId) }}</p>
          </div>
        </div>
      </div>

      <!-- Regulatory references -->
      <div class="glass-card p-5 mb-6">
        <div class="flex items-center gap-2 mb-4">
          <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
          </svg>
          <h3 class="text-sm font-semibold text-amber-300">{{ lang.t('contract.reg_references') }}</h3>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <a href="https://www.fi.ee/et/finantsinspektsioon/finantsinnovatsioon/dora" target="_blank" rel="noopener"
             class="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-amber-500/30 transition-colors group">
            <span class="text-xs font-medium text-slate-300 group-hover:text-amber-300">Finantsinspektsioon</span>
            <svg class="w-3 h-3 text-slate-600 group-hover:text-amber-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
          </a>
          <a href="https://eur-lex.europa.eu/legal-content/ET/TXT/?uri=CELEX:32022R2554" target="_blank" rel="noopener"
             class="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-amber-500/30 transition-colors group">
            <span class="text-xs font-medium text-slate-300 group-hover:text-amber-300">EUR-Lex DORA</span>
            <svg class="w-3 h-3 text-slate-600 group-hover:text-amber-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
          </a>
          <a href="https://www.eiopa.europa.eu/browse/regulation-and-policy/digital-operational-resilience-act-dora_en" target="_blank" rel="noopener"
             class="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-amber-500/30 transition-colors group">
            <span class="text-xs font-medium text-slate-300 group-hover:text-amber-300">ESA {{ lang.t('contract.guidelines') }}</span>
            <svg class="w-3 h-3 text-slate-600 group-hover:text-amber-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- Lead capture -->
      <div *ngIf="!emailCaptured" class="glass-card p-5 mb-6 border-emerald-500/20">
        <div class="flex flex-col md:flex-row items-center gap-4">
          <div class="flex-1">
            <h3 class="text-sm font-semibold text-slate-200 mb-1">{{ lang.t('contract.share_title') }}</h3>
            <p class="text-xs text-slate-500">{{ lang.t('contract.share_desc') }}</p>
          </div>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <input type="email" [(ngModel)]="email" [placeholder]="lang.t('contract.email_placeholder')"
                   class="bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-100
                          focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 focus:outline-none transition-all w-full sm:w-56">
            <button (click)="captureEmail()"
                    class="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 border border-emerald-500/30 text-emerald-400
                           hover:bg-emerald-500/30 transition-all whitespace-nowrap">
              {{ lang.t('contract.send') }}
            </button>
          </div>
        </div>
      </div>
      <div *ngIf="emailCaptured" class="glass-card p-4 mb-6 border-emerald-500/20 text-center">
        <p class="text-sm text-emerald-400">{{ lang.t('contract.email_saved') }}</p>
      </div>

      <!-- Action buttons -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
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
  email = '';
  emailCaptured = false;

  // Clause suggestions mapped to API requirement IDs
  private clauseMap: { [id: string]: { et: string; en: string } } = {
    '1': {
      et: '"Teenusepakkuja tagab teenuse kättesaadavuse vähemalt 99,5% tasemega kvartalis, mõõdetuna [monitooringusüsteemi] abil. Teenustaseme languse korral rakendatakse [X]% lepingutasu vähendamist. Kõik teenustasemed peavad olema mõõdetavad KPI-dena."',
      en: '"The provider shall ensure service availability of at least 99.5% per quarter, measured by [monitoring system]. Service level degradation shall result in [X]% fee reduction. All service levels must be measurable KPIs."'
    },
    '2': {
      et: '"Teenusepakkuja töötleb tellija andmeid ainult Euroopa Liidu/EMP piires. Andmete peamine töötlemise asukoht on [riik/linn] ja varukoopia asukoht on [riik/linn]. Andmete turvameetmed vastavad ISO 27001 standardile."',
      en: '"The provider shall process client data only within the EU/EEA. Primary data processing location is [country/city] and backup location is [country/city]. Data security measures shall comply with ISO 27001 standard."'
    },
    '3': {
      et: '"Tellijal on õigus teostada teenusepakkuja süsteemides auditit vähemalt [1] kord aastas, kaasates sõltumatuid audiitoreid. Teenusepakkuja tagab auditi läbiviimiseks vajaliku ligipääsu ja dokumentatsiooni. Finantsinspektsioonil on õigus teostada kohapealseid inspektsioone."',
      en: '"The client shall have the right to audit the provider systems at least [1] time per year, involving independent auditors. The provider shall ensure access and documentation necessary for the audit. Financial supervisory authorities have the right to conduct on-site inspections."'
    },
    '4': {
      et: '"Teenusepakkuja teavitab tellijat kõigist IKT-intsidentidest viivitamatult, kuid mitte hiljem kui 24 tundi pärast intsidendi tuvastamist. Teavitus sisaldab: a) intsidendi kirjeldust, b) mõjuanalüüsi, c) prognoosi, d) parandusmeetmeid. Kriitiliste intsidentide puhul on teavitamise tähtaeg 4 tundi."',
      en: '"The provider shall notify the client of all ICT incidents without delay, no later than 24 hours after detection. Notification shall include: a) incident description, b) impact analysis, c) prognosis, d) remediation measures. For critical incidents, notification deadline is 4 hours."'
    },
    '5': {
      et: '"Lepingu lõppemisel või ülesütlemisel tagab teenusepakkuja: a) andmete ja protsesside üleandmise [90] kalendripäeva jooksul, b) üleandmise plaani andmeformaatide, migratsiooni ajakava ja vastutavate isikutega, c) koostöö uue teenusepakkujaga üleminekuperioodil, d) kõigi tellija andmete turvalise kustutamise pärast üleandmist."',
      en: '"Upon termination, the provider shall ensure: a) data and process handover within [90] calendar days, b) transition plan with data formats, migration schedule and responsible persons, c) cooperation with new provider during transition period, d) secure deletion of all client data after handover."'
    },
    '6': {
      et: '"Teenusepakkuja ei kaasa allhankijaid ilma tellija eelneva kirjaliku nõusolekuta. Teenusepakkuja kohustub: a) esitama allhankijate nimekirja ja nende IKT-riskiprofiili enne lepingu sõlmimist, b) teavitama tellijat vähemalt [30] päeva ette igast allhankija muudatusest, c) tagama allhankijate vastavuse käesoleva lepingu tingimustele."',
      en: '"The provider shall not engage subcontractors without prior written consent. The provider undertakes to: a) provide the list of subcontractors and their ICT risk profiles before contract signing, b) notify the client at least [30] days in advance of any subcontractor changes, c) ensure subcontractors comply with the terms of this contract."'
    },
    '7': {
      et: '"Teenusepakkuja rakendab turvameetmeid vastavalt ISO 27001 standardile või samaväärsetele. Andmed krüpteeritakse AES-256 algoritmiga puhkeolekus ja TLS 1.3 protokolliga edastamisel. Juurdepääsukontroll põhineb mitmefaktorilisel autentimisel. Teenusepakkuja esitab tellijale turvaalase auditi aruande kord aastas."',
      en: '"The provider shall implement security measures in accordance with ISO 27001 standard or equivalent. Data shall be encrypted with AES-256 at rest and TLS 1.3 in transit. Access control shall be based on multi-factor authentication. The provider shall submit security audit report to the client annually."'
    },
    '8': {
      et: '"Teenusepakkuja tagab: a) ärijätkuvusplaani olemasolu ja testimise vähemalt 1 kord aastas, b) andmete varundamise iga [24] tunni tagant, c) taastamise ajaeesmärgi (RTO) kuni [4] tundi, d) taastamispunkti eesmärgi (RPO) kuni [1] tund, e) kriisiolukorras tegutsemise protseduurid ja kontaktisikud."',
      en: '"The provider shall ensure: a) business continuity plan existence and testing at least once per year, b) data backup every [24] hours, c) recovery time objective (RTO) up to [4] hours, d) recovery point objective (RPO) up to [1] hour, e) crisis procedures and contact persons."'
    }
  };

  constructor(private api: ApiService, public lang: LangService, public auth: AuthService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['sample'] === 'true') {
        this.autoDemo = true;
      }
      // Handle generated contract from Contract Generator
      if (params['generated'] === 'true') {
        this.loadGeneratedContract();
      }
    });
  }

  loadGeneratedContract() {
    const contractText = sessionStorage.getItem('generatedContract');
    const contractName = sessionStorage.getItem('generatedContractName');

    if (contractText) {
      // Create a file from the generated text
      const blob = new Blob([contractText], { type: 'text/plain' });
      this.selectedFile = new File([blob], 'generated-contract.txt', { type: 'text/plain' });
      this.companyName = this.lang.currentLang === 'et' ? 'Minu ettevõte' : 'My Company';
      this.contractName = contractName || (this.lang.currentLang === 'et' ? 'Genereeritud DORA leping' : 'Generated DORA Contract');

      // Clear sessionStorage
      sessionStorage.removeItem('generatedContract');
      sessionStorage.removeItem('generatedContractName');

      // Auto-submit for analysis
      setTimeout(() => this.onSubmit(), 100);
    }
  }

  getClause(requirementId: string | number): string {
    const clause = this.clauseMap[String(requirementId)];
    if (!clause) return '';
    return this.lang.currentLang === 'et' ? clause.et : clause.en;
  }

  captureEmail() {
    if (this.email && this.email.includes('@')) {
      const leads = JSON.parse(localStorage.getItem('dora_leads') || '[]');
      leads.push({ email: this.email, date: new Date().toISOString(), score: this.result?.scorePercentage });
      localStorage.setItem('dora_leads', JSON.stringify(leads));
      this.emailCaptured = true;
    }
  }

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
        this.companyName = 'OÜ Näidis Finants';
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

  loadMockResult() {
    this.analyzing = true;
    setTimeout(() => {
      this.result = {
        id: 'demo-' + Date.now(),
        companyName: this.companyName || 'Demo OÜ',
        contractName: this.contractName || 'IKT teenuse leping',
        fileName: 'demo_contract.pdf',
        analysisDate: new Date().toISOString(),
        scorePercentage: 62.5,
        complianceLevel: 'YELLOW',
        foundCount: 3,
        partialCount: 2,
        missingCount: 3,
        totalRequirements: 8,
        summary: this.lang.currentLang === 'et'
          ? 'Leping sisaldab mõningaid DORA nõudeid, kuid mitmed kriitilised klauslid on puudu või osaliselt kaetud.'
          : 'The contract contains some DORA requirements, but several critical clauses are missing or partially covered.',
        findings: [
          { requirementId: 1, status: 'found', doraReference: 'Art.30(2)(a)', requirementEt: 'Teenustaseme nõuded', requirementEn: 'Service level requirements', quote: 'Teenuse kättesaadavus on vähemalt 99.5%', recommendationEt: '', recommendationEn: '' },
          { requirementId: 2, status: 'found', doraReference: 'Art.30(2)(b)', requirementEt: 'Andmete asukoht', requirementEn: 'Data location', quote: 'Andmeid töödeldakse Euroopa Liidus', recommendationEt: '', recommendationEn: '' },
          { requirementId: 3, status: 'partial', doraReference: 'Art.30(2)(c)', requirementEt: 'Auditeerimisõigus', requirementEn: 'Audit rights', quote: '', recommendationEt: 'Lisage konkreetne auditeerimise sagedus ja ulatus', recommendationEn: 'Add specific audit frequency and scope' },
          { requirementId: 4, status: 'missing', doraReference: 'Art.30(2)(d)', requirementEt: 'Intsidentidest teavitamine', requirementEn: 'Incident notification', quote: '', recommendationEt: 'Lisage intsidentidest teavitamise tähtajad ja protseduurid', recommendationEn: 'Add incident notification deadlines and procedures' },
          { requirementId: 5, status: 'missing', doraReference: 'Art.30(2)(e)', requirementEt: 'Väljumisstrateegiad', requirementEn: 'Exit strategies', quote: '', recommendationEt: 'Lisage lepingu lõpetamise ja andmete üleandmise protseduurid', recommendationEn: 'Add contract termination and data handover procedures' },
          { requirementId: 6, status: 'partial', doraReference: 'Art.30(2)(f)', requirementEt: 'Allhankijate juhtimine', requirementEn: 'Subcontractor management', quote: 'Allhankijate kasutamine on lubatud', recommendationEt: 'Täpsustage allhankijate loetelu ja teavitamiskohustused', recommendationEn: 'Specify subcontractor list and notification obligations' },
          { requirementId: 7, status: 'found', doraReference: 'Art.30(2)(g)', requirementEt: 'Turvanõuded', requirementEn: 'Security requirements', quote: 'ISO 27001 sertifitseeritud', recommendationEt: '', recommendationEn: '' },
          { requirementId: 8, status: 'missing', doraReference: 'Art.30(2)(h)', requirementEt: 'Ärijärjepidevuse tagamine', requirementEn: 'Business continuity', quote: '', recommendationEt: 'Lisage ärijärjepidevuse plaanid ja taastamise ajaeesmärgid', recommendationEn: 'Add business continuity plans and recovery time objectives' }
        ]
      };
      this.analyzing = false;
    }, 1500);
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
