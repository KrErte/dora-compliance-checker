import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';
import { AuthService } from '../auth/auth.service';
import { SubscriptionService } from '../services/subscription.service';
import { GapAnalysisResult, GapFinding } from '../models';

interface ArticleOption {
  articleNumber: string;
  nameEt: string;
  nameEn: string;
  requirementCount: number;
  selected: boolean;
  chapter: string;
}

@Component({
  selector: 'app-evidence-gap-analyzer',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Enterprise Paywall -->
    <div *ngIf="!isEnterprise" class="animate-fade-in">
      <div class="text-center py-16">
        <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center">
          <svg class="w-10 h-10 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <h1 class="text-3xl font-bold gradient-text mb-3">Evidence Gap Analyzer</h1>
        <p class="text-slate-400 max-w-xl mx-auto mb-6">
          {{ lang.l('AI-põhine dokumendi analüüs konkreetsete DORA artiklite nõuete vastu. Laadige üles poliitika, protseduur või testiaruanne ja saage detailsed vastavuse tulemused.',
                     'AI-powered document analysis against specific DORA article requirements. Upload any policy, procedure, or test report and get detailed compliance findings.') }}
        </p>
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm mb-6">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364A9 9 0 1112 3a9 9 0 017.364 7.636z"/>
          </svg>
          {{ lang.l('Enterprise funktsioon — uuendage ligipääsuks', 'Enterprise feature — upgrade to access') }}
        </div>
        <div>
          <a routerLink="/pricing" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-900 font-semibold hover:from-teal-400 hover:to-cyan-400 transition-all">
            {{ lang.l('Vaata plaane', 'View Plans') }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </a>
        </div>
      </div>
    </div>

    <!-- Main Content (Enterprise users) -->
    <div *ngIf="isEnterprise">

      <!-- Upload Form -->
      <div *ngIf="state === 'upload'" class="animate-fade-in-up">
        <div class="text-center mb-10">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-teal-500/10 border border-teal-500/30 text-teal-400 mb-4">
            <div class="w-4 h-4 rounded bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center text-white text-[7px] font-bold">AI</div>
            Evidence Gap Analyzer
          </span>
          <h1 class="text-3xl font-bold gradient-text mb-3">
            {{ lang.l('Analüüsi dokumenti DORA nõuete vastu', 'Analyze Document Against DORA Requirements') }}
          </h1>
          <p class="text-slate-400 max-w-2xl mx-auto">
            {{ lang.l('Laadige üles poliitika, protseduur või vastavusdokument. AI analüüsib seda valitud DORA artiklite vastu ja tuvastab lüngad.',
                       'Upload a policy, procedure, or compliance document. AI will analyze it against selected DORA articles and identify gaps.') }}
          </p>
        </div>

        <div class="max-w-3xl mx-auto space-y-6">
          <!-- Document Title -->
          <div class="glass-card p-6">
            <label class="block text-sm font-medium text-slate-300 mb-2">
              {{ lang.l('Dokumendi pealkiri', 'Document Title') }}
            </label>
            <input type="text" [(ngModel)]="documentTitle"
                   class="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/30 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30"
                   [placeholder]="lang.l('nt IKT riskijuhtimise poliitika', 'e.g. ICT Risk Management Policy')">
          </div>

          <!-- Document Category -->
          <div class="glass-card p-6">
            <label class="block text-sm font-medium text-slate-300 mb-2">
              {{ lang.l('Dokumendi kategooria', 'Document Category') }}
            </label>
            <select [(ngModel)]="documentCategory"
                    class="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/30 rounded-xl text-slate-200 focus:outline-none focus:border-teal-500/50">
              <option value="POLICY">{{ lang.l('Poliitika', 'Policy') }}</option>
              <option value="PROCEDURE">{{ lang.l('Protseduur', 'Procedure') }}</option>
              <option value="TEST_REPORT">{{ lang.l('Testiaruanne', 'Test Report') }}</option>
              <option value="AUDIT_REPORT">{{ lang.l('Auditiaruanne', 'Audit Report') }}</option>
              <option value="OTHER">{{ lang.l('Muu', 'Other') }}</option>
            </select>
          </div>

          <!-- Article Selection -->
          <div class="glass-card p-6">
            <div class="flex items-center justify-between mb-4">
              <label class="text-sm font-medium text-slate-300">
                {{ lang.l('Valige kontrollitavad DORA artiklid', 'Select DORA Articles to Check') }}
              </label>
              <button (click)="toggleAllArticles()" class="text-xs text-teal-400 hover:text-teal-300 transition-colors">
                {{ allSelected ? lang.l('Tühista kõik', 'Deselect All') : lang.l('Vali kõik', 'Select All') }}
              </button>
            </div>

            <!-- Chapter II: ICT Risk Management -->
            <div class="mb-4">
              <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {{ lang.l('Ptk. II — IKT riskijuhtimine', 'Ch. II — ICT Risk Management') }}
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                <label *ngFor="let art of getArticlesByChapter('II')"
                       class="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors border"
                       [ngClass]="art.selected ? 'bg-teal-500/10 border-teal-500/30' : 'bg-slate-700/30 border-slate-600/20'">
                  <input type="checkbox" [(ngModel)]="art.selected" class="accent-teal-500">
                  <div>
                    <div class="text-sm text-slate-200">Art. {{ art.articleNumber }}</div>
                    <div class="text-[10px] text-slate-500">{{ lang.l(art.nameEt, art.nameEn) }}</div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Chapter III: Incident Management -->
            <div class="mb-4">
              <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {{ lang.l('Ptk. III — Intsidentide haldus', 'Ch. III — Incident Management') }}
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <label *ngFor="let art of getArticlesByChapter('III')"
                       class="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors border"
                       [ngClass]="art.selected ? 'bg-teal-500/10 border-teal-500/30' : 'bg-slate-700/30 border-slate-600/20'">
                  <input type="checkbox" [(ngModel)]="art.selected" class="accent-teal-500">
                  <div>
                    <div class="text-sm text-slate-200">Art. {{ art.articleNumber }}</div>
                    <div class="text-[10px] text-slate-500">{{ lang.l(art.nameEt, art.nameEn) }}</div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Chapter IV: Testing -->
            <div class="mb-4">
              <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {{ lang.l('Ptk. IV — Digitaalse vastupidavuse testimine', 'Ch. IV — Digital Resilience Testing') }}
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <label *ngFor="let art of getArticlesByChapter('IV')"
                       class="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors border"
                       [ngClass]="art.selected ? 'bg-teal-500/10 border-teal-500/30' : 'bg-slate-700/30 border-slate-600/20'">
                  <input type="checkbox" [(ngModel)]="art.selected" class="accent-teal-500">
                  <div>
                    <div class="text-sm text-slate-200">Art. {{ art.articleNumber }}</div>
                    <div class="text-[10px] text-slate-500">{{ lang.l(art.nameEt, art.nameEn) }}</div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Chapter V: Third-Party Risk -->
            <div>
              <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {{ lang.l('Ptk. V — Kolmanda osapoole risk', 'Ch. V — Third-Party Risk') }}
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <label *ngFor="let art of getArticlesByChapter('V')"
                       class="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors border"
                       [ngClass]="art.selected ? 'bg-teal-500/10 border-teal-500/30' : 'bg-slate-700/30 border-slate-600/20'">
                  <input type="checkbox" [(ngModel)]="art.selected" class="accent-teal-500">
                  <div>
                    <div class="text-sm text-slate-200">Art. {{ art.articleNumber }}</div>
                    <div class="text-[10px] text-slate-500">{{ lang.l(art.nameEt, art.nameEn) }}</div>
                  </div>
                </label>
              </div>
            </div>

            <div class="mt-3 text-xs text-slate-500">
              {{ selectedCount }} {{ lang.l('artiklit valitud', 'articles selected') }}
              ({{ selectedRequirementCount }} {{ lang.l('nõuet', 'requirements') }})
            </div>
          </div>

          <!-- File Upload -->
          <div class="glass-card p-6">
            <label class="block text-sm font-medium text-slate-300 mb-3">
              {{ lang.l('Laadi dokument üles', 'Upload Document') }}
            </label>
            <div (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)" (drop)="onDrop($event)"
                 (click)="fileInput.click()"
                 class="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200"
                 [ngClass]="isDragging ? 'border-teal-500/50 bg-teal-500/5' : 'border-slate-600/30 hover:border-teal-500/30'">
              <input #fileInput type="file" (change)="onFileSelected($event)" accept=".pdf,.docx" class="hidden">
              <div *ngIf="!selectedFile">
                <svg class="w-12 h-12 mx-auto text-slate-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                <p class="text-sm text-slate-400">
                  {{ lang.l('Lohistage või klõpsake üleslaadimiseks', 'Drag & drop or click to upload') }}
                </p>
                <p class="text-xs text-slate-500 mt-1">PDF, DOCX — max 10MB</p>
              </div>
              <div *ngIf="selectedFile" class="flex items-center justify-center gap-3">
                <svg class="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <div class="text-left">
                  <p class="text-sm text-slate-200 font-medium">{{ selectedFile.name }}</p>
                  <p class="text-xs text-slate-500">{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</p>
                </div>
                <button (click)="clearFile($event)" class="text-slate-500 hover:text-red-400 transition-colors ml-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Analyze Button -->
          <button (click)="startAnalysis()"
                  [disabled]="!canAnalyze"
                  class="w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2"
                  [ngClass]="canAnalyze
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-900 hover:from-teal-400 hover:to-cyan-400 hover:shadow-lg hover:shadow-teal-500/25'
                    : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            {{ lang.l('Analüüsi dokumenti', 'Analyze Document') }}
          </button>
        </div>

        <!-- History Section -->
        <div *ngIf="history.length > 0" class="mt-16 max-w-3xl mx-auto">
          <h2 class="text-lg font-semibold text-slate-200 mb-4">
            {{ lang.l('Varasemad analüüsid', 'Previous Analyses') }}
          </h2>
          <div class="space-y-3">
            <div *ngFor="let item of history" (click)="loadResult(item)"
                 class="glass-card p-4 cursor-pointer card-hover flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                   [ngClass]="{
                     'bg-green-500/20': item.complianceLevel === 'GREEN',
                     'bg-yellow-500/20': item.complianceLevel === 'YELLOW',
                     'bg-red-500/20': item.complianceLevel === 'RED'
                   }">
                <span class="text-lg font-bold"
                      [ngClass]="{
                        'text-green-400': item.complianceLevel === 'GREEN',
                        'text-yellow-400': item.complianceLevel === 'YELLOW',
                        'text-red-400': item.complianceLevel === 'RED'
                      }">
                  {{ item.scorePercentage }}%
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-200 truncate">{{ item.documentTitle }}</p>
                <p class="text-xs text-slate-500">{{ item.fileName }} &middot; {{ item.analysisDate | date:'dd.MM.yyyy HH:mm' }}</p>
              </div>
              <div class="flex items-center gap-1.5 text-xs shrink-0">
                <span class="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">{{ item.foundCount }}</span>
                <span class="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">{{ item.partialCount }}</span>
                <span class="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">{{ item.missingCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="state === 'loading'" class="animate-fade-in text-center py-20">
        <div class="w-20 h-20 mx-auto mb-6 relative">
          <div class="absolute inset-0 rounded-full border-4 border-slate-700/50"></div>
          <div class="absolute inset-0 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
          <div class="absolute inset-3 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center">
            <svg class="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
        </div>
        <h2 class="text-xl font-bold text-slate-200 mb-2">
          {{ lang.l('Analüüsin dokumenti DORA nõuete vastu...', 'Analyzing document against DORA requirements...') }}
        </h2>
        <p class="text-slate-500 text-sm">
          {{ lang.l('See võib võtta 30-60 sekundit sõltuvalt dokumendi suurusest', 'This may take 30-60 seconds depending on document size') }}
        </p>
      </div>

      <!-- Results -->
      <div *ngIf="state === 'results' && result" class="animate-fade-in-up">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-slate-200">{{ result.documentTitle }}</h1>
            <p class="text-sm text-slate-500">{{ result.fileName }} &middot; {{ result.documentCategory }} &middot; {{ result.analysisDate | date:'dd.MM.yyyy HH:mm' }}</p>
          </div>
          <button (click)="resetToUpload()" class="px-4 py-2 rounded-lg text-sm bg-slate-700/50 text-slate-300 border border-slate-600/30 hover:bg-slate-600/50 hover:text-teal-400 transition-colors">
            {{ lang.l('Uus analüüs', 'New Analysis') }}
          </button>
        </div>

        <!-- Score Overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <!-- Score Ring -->
          <div class="glass-card p-6 flex flex-col items-center justify-center">
            <div class="relative w-28 h-28 mb-3">
              <svg class="w-28 h-28 transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" stroke-width="8" class="text-slate-700/50"/>
                <circle cx="60" cy="60" r="52" fill="none" stroke-width="8" stroke-linecap="round"
                        [attr.stroke-dasharray]="circumference"
                        [attr.stroke-dashoffset]="circumference - (circumference * result.scorePercentage / 100)"
                        [ngClass]="{
                          'text-green-400': result.complianceLevel === 'GREEN',
                          'text-yellow-400': result.complianceLevel === 'YELLOW',
                          'text-red-400': result.complianceLevel === 'RED'
                        }"
                        class="transition-all duration-1000"/>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-2xl font-bold text-slate-200">{{ result.scorePercentage }}%</span>
              </div>
            </div>
            <span class="text-xs font-semibold px-3 py-1 rounded-full"
                  [ngClass]="{
                    'bg-green-500/20 text-green-400': result.complianceLevel === 'GREEN',
                    'bg-yellow-500/20 text-yellow-400': result.complianceLevel === 'YELLOW',
                    'bg-red-500/20 text-red-400': result.complianceLevel === 'RED'
                  }">
              {{ result.complianceLevel }}
            </span>
          </div>

          <!-- Stats -->
          <div class="glass-card p-6 flex flex-col items-center justify-center">
            <div class="text-3xl font-bold text-green-400 mb-1">{{ result.foundCount }}</div>
            <div class="text-sm text-slate-400">{{ lang.l('Leitud', 'Found') }}</div>
            <div class="w-full bg-slate-700/30 rounded-full h-1.5 mt-3">
              <div class="bg-green-400 h-1.5 rounded-full transition-all" [style.width.%]="result.totalRequirements > 0 ? result.foundCount / result.totalRequirements * 100 : 0"></div>
            </div>
          </div>
          <div class="glass-card p-6 flex flex-col items-center justify-center">
            <div class="text-3xl font-bold text-yellow-400 mb-1">{{ result.partialCount }}</div>
            <div class="text-sm text-slate-400">{{ lang.l('Osaline', 'Partial') }}</div>
            <div class="w-full bg-slate-700/30 rounded-full h-1.5 mt-3">
              <div class="bg-yellow-400 h-1.5 rounded-full transition-all" [style.width.%]="result.totalRequirements > 0 ? result.partialCount / result.totalRequirements * 100 : 0"></div>
            </div>
          </div>
          <div class="glass-card p-6 flex flex-col items-center justify-center">
            <div class="text-3xl font-bold text-red-400 mb-1">{{ result.missingCount }}</div>
            <div class="text-sm text-slate-400">{{ lang.l('Puudu', 'Missing') }}</div>
            <div class="w-full bg-slate-700/30 rounded-full h-1.5 mt-3">
              <div class="bg-red-400 h-1.5 rounded-full transition-all" [style.width.%]="result.totalRequirements > 0 ? result.missingCount / result.totalRequirements * 100 : 0"></div>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div class="glass-card p-6 mb-8">
          <h3 class="text-sm font-semibold text-slate-300 mb-2">{{ lang.l('Kokkuvõte', 'Summary') }}</h3>
          <p class="text-slate-400 text-sm leading-relaxed">{{ lang.l(result.summaryEt, result.summaryEn) }}</p>
        </div>

        <!-- Findings by Article -->
        <div class="space-y-6 mb-8">
          <h3 class="text-lg font-semibold text-slate-200">{{ lang.l('Detailsed tulemused', 'Detailed Findings') }}</h3>

          <div *ngFor="let group of groupedFindings" class="glass-card overflow-hidden">
            <div class="px-6 py-4 bg-slate-700/20 border-b border-slate-700/30 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-400 text-xs font-bold">Art. {{ group.articleNumber }}</span>
                <span class="text-sm font-medium text-slate-200">{{ lang.l(group.nameEt, group.nameEn) }}</span>
              </div>
              <div class="flex items-center gap-1.5 text-xs">
                <span class="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">{{ group.foundCount }}</span>
                <span class="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">{{ group.partialCount }}</span>
                <span class="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">{{ group.missingCount }}</span>
              </div>
            </div>

            <div class="divide-y divide-slate-700/20">
              <div *ngFor="let finding of group.findings" class="px-6 py-4">
                <div class="flex items-start gap-3 mb-2">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold shrink-0 mt-0.5"
                        [ngClass]="{
                          'bg-green-500/20 text-green-400': finding.status === 'found',
                          'bg-yellow-500/20 text-yellow-400': finding.status === 'partial',
                          'bg-red-500/20 text-red-400': finding.status === 'missing'
                        }">
                    {{ finding.status === 'found' ? 'FOUND' : finding.status === 'partial' ? 'PARTIAL' : 'MISSING' }}
                  </span>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-[10px] text-slate-500 font-mono">{{ finding.doraReference }}</span>
                    </div>
                    <p class="text-sm font-medium text-slate-200">
                      {{ lang.l(finding.subRequirementEt, finding.subRequirementEn) }}
                    </p>
                  </div>
                </div>

                <!-- Quote from document -->
                <div *ngIf="finding.quoteFromDocument && finding.status !== 'missing'"
                     class="ml-14 mt-2 px-4 py-3 rounded-lg bg-green-500/5 border-l-2 border-green-500/30">
                  <p class="text-xs text-slate-400 italic">"{{ finding.quoteFromDocument }}"</p>
                </div>

                <!-- Recommendation -->
                <div *ngIf="finding.status !== 'found' && (finding.recommendationEt || finding.recommendationEn)"
                     class="ml-14 mt-2 px-4 py-3 rounded-lg bg-amber-500/5 border-l-2 border-amber-500/30">
                  <p class="text-xs text-amber-300/80">
                    {{ lang.l(finding.recommendationEt, finding.recommendationEn) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-3 mb-12">
          <button (click)="exportPdf()"
                  [disabled]="exporting"
                  class="px-5 py-2.5 rounded-xl text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            {{ exporting ? lang.l('Genereerin PDF-i...', 'Generating PDF...') : lang.l('Ekspordi PDF raport', 'Export PDF Report') }}
          </button>
          <button (click)="syncToTracker()"
                  [disabled]="syncing"
                  class="px-5 py-2.5 rounded-xl text-sm font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-colors flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {{ syncing ? lang.l('Sünkroniseerin...', 'Syncing...') : lang.l('Sünkroniseeri Article Trackeriga', 'Sync to Article Tracker') }}
          </button>
          <button (click)="resetToUpload()"
                  class="px-5 py-2.5 rounded-xl text-sm font-medium bg-slate-700/50 text-slate-300 border border-slate-600/30 hover:bg-slate-600/50 hover:text-teal-400 transition-colors flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            {{ lang.l('Uus analüüs', 'New Analysis') }}
          </button>
        </div>
      </div>

      <!-- Error -->
      <div *ngIf="errorMsg" class="glass-card p-6 border-red-500/30 mb-6">
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-sm text-red-400">{{ errorMsg }}</p>
        </div>
      </div>
    </div>
  `
})
export class EvidenceGapAnalyzerComponent implements OnInit {
  lang = inject(LangService);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private sub = inject(SubscriptionService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  state: 'upload' | 'loading' | 'results' = 'upload';
  isEnterprise = false;

  // Form
  documentTitle = '';
  documentCategory = 'POLICY';
  selectedFile: File | null = null;
  isDragging = false;

  // Articles
  articles: ArticleOption[] = [];

  // Results
  result: GapAnalysisResult | null = null;
  groupedFindings: { articleNumber: string; nameEt: string; nameEn: string; findings: GapFinding[]; foundCount: number; partialCount: number; missingCount: number }[] = [];
  history: GapAnalysisResult[] = [];
  circumference = 2 * Math.PI * 52;

  // State
  errorMsg = '';
  syncing = false;
  exporting = false;

  ngOnInit() {
    this.isEnterprise = this.sub.currentPlan() === 'ENTERPRISE';

    this.articles = [
      { articleNumber: '5', nameEt: 'Juhtimine ja organisatsioon', nameEn: 'Governance and Organisation', requirementCount: 4, selected: true, chapter: 'II' },
      { articleNumber: '6', nameEt: 'IKT riskijuhtimise raamistik', nameEn: 'ICT Risk Management Framework', requirementCount: 5, selected: true, chapter: 'II' },
      { articleNumber: '8', nameEt: 'Tuvastamine', nameEn: 'Identification', requirementCount: 4, selected: false, chapter: 'II' },
      { articleNumber: '9', nameEt: 'Kaitse ja ennetamine', nameEn: 'Protection and Prevention', requirementCount: 5, selected: true, chapter: 'II' },
      { articleNumber: '11', nameEt: 'Talitluspidevus', nameEn: 'Business Continuity', requirementCount: 4, selected: false, chapter: 'II' },
      { articleNumber: '17', nameEt: 'Intsidentide haldamise protsess', nameEn: 'Incident Management Process', requirementCount: 4, selected: false, chapter: 'III' },
      { articleNumber: '18', nameEt: 'IKT intsidentide klassifitseerimine', nameEn: 'Classification of ICT-related Incidents', requirementCount: 3, selected: false, chapter: 'III' },
      { articleNumber: '19', nameEt: 'Oluliste intsidentide raporteerimine', nameEn: 'Reporting of Major ICT-related Incidents', requirementCount: 4, selected: false, chapter: 'III' },
      { articleNumber: '24', nameEt: 'Digitaalse vastupidavuse testimine', nameEn: 'Digital Operational Resilience Testing', requirementCount: 4, selected: false, chapter: 'IV' },
      { articleNumber: '30', nameEt: 'Lepingu põhisätted', nameEn: 'Key Contractual Provisions', requirementCount: 8, selected: false, chapter: 'V' },
    ];

    if (this.isEnterprise) {
      this.loadHistory();
    }
  }

  get selectedCount(): number {
    return this.articles.filter(a => a.selected).length;
  }

  get selectedRequirementCount(): number {
    return this.articles.filter(a => a.selected).reduce((sum, a) => sum + a.requirementCount, 0);
  }

  get allSelected(): boolean {
    return this.articles.every(a => a.selected);
  }

  get canAnalyze(): boolean {
    return !!this.documentTitle.trim() && !!this.selectedFile && this.selectedCount > 0;
  }

  getArticlesByChapter(chapter: string): ArticleOption[] {
    return this.articles.filter(a => a.chapter === chapter);
  }

  toggleAllArticles() {
    const newState = !this.allSelected;
    this.articles.forEach(a => a.selected = newState);
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(e: DragEvent) {
    e.preventDefault();
    this.isDragging = false;
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging = false;
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectFile(files[0]);
    }
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectFile(input.files[0]);
    }
  }

  private selectFile(file: File) {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.docx')) {
      this.errorMsg = this.lang.l('Toetatud on ainult PDF ja DOCX failid', 'Only PDF and DOCX files are supported');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.errorMsg = this.lang.l('Faili suurus ületab 10MB piiri', 'File size exceeds 10MB limit');
      return;
    }
    this.selectedFile = file;
    this.errorMsg = '';
  }

  clearFile(e: Event) {
    e.stopPropagation();
    this.selectedFile = null;
  }

  startAnalysis() {
    if (!this.canAnalyze || !this.selectedFile) return;

    this.state = 'loading';
    this.errorMsg = '';

    const articleNumbers = this.articles.filter(a => a.selected).map(a => a.articleNumber);

    this.api.analyzeGap(this.selectedFile, this.documentTitle, this.documentCategory, articleNumbers).subscribe({
      next: (res) => {
        this.result = res;
        this.buildGroupedFindings();
        this.state = 'results';
        this.loadHistory();
      },
      error: (err) => {
        this.errorMsg = err.error?.error || this.lang.l('Analüüs ebaõnnestus. Palun proovige uuesti.', 'Analysis failed. Please try again.');
        this.state = 'upload';
      }
    });
  }

  loadResult(item: GapAnalysisResult) {
    this.result = item;
    this.buildGroupedFindings();
    this.state = 'results';
  }

  resetToUpload() {
    this.state = 'upload';
    this.result = null;
    this.groupedFindings = [];
    this.selectedFile = null;
    this.documentTitle = '';
    this.errorMsg = '';
  }

  syncToTracker() {
    if (!this.result || this.syncing) return;
    this.syncing = true;
    this.api.syncGapToTracker(this.result.id).subscribe({
      next: () => { this.syncing = false; },
      error: () => { this.syncing = false; }
    });
  }

  exportPdf() {
    if (!this.result || this.exporting) return;
    this.exporting = true;
    this.api.exportGapAnalysisPdf(this.result.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gap-analysis-report.pdf';
        a.click();
        URL.revokeObjectURL(url);
        this.exporting = false;
      },
      error: () => { this.exporting = false; }
    });
  }

  private loadHistory() {
    this.api.getGapAnalysisHistory().subscribe({
      next: (res) => { this.history = res; },
      error: () => {}
    });
  }

  private buildGroupedFindings() {
    if (!this.result) return;

    const map = new Map<string, GapFinding[]>();
    for (const f of this.result.findings) {
      const key = f.articleNumber;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    }

    this.groupedFindings = Array.from(map.entries()).map(([articleNumber, findings]) => {
      const art = this.articles.find(a => a.articleNumber === articleNumber);
      return {
        articleNumber,
        nameEt: art?.nameEt || 'Artikkel ' + articleNumber,
        nameEn: art?.nameEn || 'Article ' + articleNumber,
        findings,
        foundCount: findings.filter(f => f.status === 'found').length,
        partialCount: findings.filter(f => f.status === 'partial').length,
        missingCount: findings.filter(f => f.status === 'missing').length
      };
    });
  }
}
