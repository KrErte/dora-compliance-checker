import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LangService } from '../lang.service';

interface AiIndicator { indicator: string; file: string; line: string; severity: string; }
interface SecurityVuln {
  id: string; title: string; titleEt: string; severity: string; file: string; line: string;
  description: string; descriptionEt: string; realWorldParallel: string;
  financialImpact: string; exploitDifficulty: string; fix: string; fixCritique: string;
}
interface CodeQualityIssue {
  id: string; title: string; titleEt: string; severity: string;
  description: string; descriptionEt: string; file: string; potentialCost: string;
}
interface FinancialRisk {
  totalExposure: string; catastrophicFailureProbability: string;
  estimatedAnnualLoss: string; knightCapitalRisk: number; complianceRisk: string;
}
interface AnalysisResult {
  aiGeneratedPercentage: number; aiConfidence: string; aiIndicators: AiIndicator[];
  securityVulnerabilities: SecurityVuln[]; codeQualityIssues: CodeQualityIssue[];
  financialRiskSummary: FinancialRisk; iterationSummary: string; iterationSummaryEt: string;
  overallVerdict: string; topPriority: string; files: { name: string; lines: number; size: number }[];
  totalLines: number; iteration: number; companyName: string; annualRevenue: number;
}

@Component({
  selector: 'app-code-analysis',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8 animate-fade-in-up">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium mb-4">
          <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          {{ lang.t('code.badge') }}
        </div>
        <h1 class="text-3xl font-bold mb-2">
          <span class="gradient-text">{{ lang.t('code.title') }}</span>
        </h1>
        <p class="text-slate-400 text-sm max-w-2xl mx-auto">{{ lang.t('code.subtitle') }}</p>
      </div>

      <!-- Disaster ticker -->
      <div class="mb-8 overflow-hidden rounded-xl border border-red-500/20 bg-red-500/5 animate-fade-in">
        <div class="flex animate-marquee whitespace-nowrap py-2 px-4">
          <span *ngFor="let d of disasters" class="mx-6 text-xs text-red-400/80 flex items-center gap-2">
            <span class="font-bold text-red-400">{{ d.name }}</span>
            <span class="text-slate-500">{{ d.year }}</span>
            <span class="font-mono text-red-300">{{ d.cost }}</span>
            <span class="text-slate-600">&middot;</span>
            <span class="text-slate-500 max-w-[200px] truncate">{{ d.cause }}</span>
          </span>
          <span *ngFor="let d of disasters" class="mx-6 text-xs text-red-400/80 flex items-center gap-2">
            <span class="font-bold text-red-400">{{ d.name }}</span>
            <span class="text-slate-500">{{ d.year }}</span>
            <span class="font-mono text-red-300">{{ d.cost }}</span>
            <span class="text-slate-600">&middot;</span>
            <span class="text-slate-500 max-w-[200px] truncate">{{ d.cause }}</span>
          </span>
        </div>
      </div>

      <!-- Upload form -->
      <div *ngIf="!analyzing && iterations.length === 0" class="animate-fade-in-up">

        <!-- Mock codebase selector -->
        <div class="glass-card p-6 mb-6 border-orange-500/20">
          <div class="flex items-center gap-2 mb-4">
            <svg class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
            </svg>
            <h3 class="text-sm font-semibold text-orange-300">{{ lang.t('code.mock_title') }}</h3>
            <span class="text-[10px] px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">{{ lang.t('code.mock_badge') }}</span>
          </div>
          <p class="text-xs text-slate-500 mb-4">{{ lang.t('code.mock_desc') }}</p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <button *ngFor="let mock of mockCodebases" (click)="selectedMock = mock.id"
                    [class]="'text-left p-4 rounded-xl border transition-all duration-200 ' +
                             (selectedMock === mock.id ? 'border-orange-500/50 bg-orange-500/10' : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600')">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-lg">{{ mock.icon }}</span>
                <span class="text-sm font-semibold text-slate-200">{{ lang.currentLang === 'et' ? mock.nameEt : mock.name }}</span>
              </div>
              <p class="text-[10px] text-slate-500 mb-2">{{ lang.currentLang === 'et' ? mock.descEt : mock.desc }}</p>
              <div class="flex items-center gap-2">
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">{{ mock.files }} {{ lang.t('code.files_selected') }}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">{{ mock.lines }} {{ lang.currentLang === 'et' ? 'rida' : 'lines' }}</span>
              </div>
            </button>
          </div>

          <button *ngIf="selectedMock" (click)="loadMockCodebase()"
                  class="w-full py-2.5 rounded-lg text-sm font-medium bg-orange-500/20 border border-orange-500/30 text-orange-300
                         hover:bg-orange-500/30 transition-all flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            {{ lang.t('code.load_mock') }}
          </button>
        </div>

        <!-- Divider -->
        <div class="flex items-center gap-3 mb-6">
          <div class="flex-1 border-t border-slate-700/50"></div>
          <span class="text-xs text-slate-600 font-medium">{{ lang.currentLang === 'et' ? 'V\u00D5I laadi oma failid' : 'OR upload your files' }}</span>
          <div class="flex-1 border-t border-slate-700/50"></div>
        </div>

        <!-- Quality level selector (shared) -->
        <div class="glass-card p-5 mb-6 border-slate-700/30">
          <div class="flex items-center gap-2 mb-3">
            <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
            </svg>
            <h3 class="text-xs font-semibold text-slate-300">{{ lang.t('code.quality_level') }}</h3>
            <span class="text-[10px] text-slate-500">{{ lang.t('code.quality_lens_hint') }}</span>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <button *ngFor="let lvl of qualityLevels" (click)="selectedQuality = lvl.id"
                    [class]="'p-3 rounded-lg border text-center transition-all ' +
                             (selectedQuality === lvl.id ? lvl.activeClass : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600')">
              <span class="text-lg block mb-1">{{ lvl.icon }}</span>
              <span class="text-xs font-semibold block" [class]="selectedQuality === lvl.id ? lvl.textClass : 'text-slate-300'">{{ lang.currentLang === 'et' ? lvl.labelEt : lvl.label }}</span>
              <span class="text-[10px] block mt-0.5" [class]="selectedQuality === lvl.id ? 'text-slate-300' : 'text-slate-600'">{{ lang.currentLang === 'et' ? lvl.hintEt : lvl.hint }}</span>
            </button>
          </div>
        </div>

        <div class="glass-card p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5">{{ lang.t('code.company') }}</label>
              <input type="text" [(ngModel)]="companyName"
                     class="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-slate-100
                            focus:border-red-400 focus:ring-1 focus:ring-red-400/20 focus:outline-none transition-all"
                     [placeholder]="lang.currentLang === 'et' ? 'O\u00DC N\u00E4idis' : 'Example Ltd'">
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5">{{ lang.t('code.revenue') }}</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">&euro;</span>
                <input type="number" [(ngModel)]="annualRevenue"
                       class="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg pl-8 pr-4 py-2.5 text-slate-100
                              focus:border-red-400 focus:ring-1 focus:ring-red-400/20 focus:outline-none transition-all"
                       placeholder="5000000">
              </div>
              <p class="text-[10px] text-slate-600 mt-1">{{ lang.t('code.revenue_hint') }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5">{{ lang.t('code.hourly_rate') }}</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">&euro;</span>
                <input type="number" [(ngModel)]="hourlyRate"
                       class="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg pl-8 pr-4 py-2.5 text-slate-100
                              focus:border-red-400 focus:ring-1 focus:ring-red-400/20 focus:outline-none transition-all"
                       placeholder="85">
              </div>
              <p class="text-[10px] text-slate-600 mt-1">{{ lang.t('code.hourly_hint') }}</p>
            </div>
          </div>

          <!-- Team size -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5">{{ lang.t('code.team_size') }}</label>
              <input type="number" [(ngModel)]="teamSize"
                     class="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-slate-100
                            focus:border-red-400 focus:ring-1 focus:ring-red-400/20 focus:outline-none transition-all"
                     placeholder="5" min="1">
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5">{{ lang.t('code.dev_months') }}</label>
              <input type="number" [(ngModel)]="devMonths"
                     class="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-slate-100
                            focus:border-red-400 focus:ring-1 focus:ring-red-400/20 focus:outline-none transition-all"
                     placeholder="12" min="1">
            </div>
          </div>

          <!-- File upload -->
          <div (click)="fileInput.click()"
               (dragover)="onDragOver($event)" (dragleave)="dragOver=false" (drop)="onDrop($event)"
               [class]="'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ' +
                        (dragOver ? 'border-red-400 bg-red-400/5' : 'border-slate-600/50 hover:border-slate-500 hover:bg-slate-800/30')">
            <div *ngIf="selectedFiles.length === 0">
              <svg class="w-10 h-10 mx-auto mb-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
              </svg>
              <p class="text-sm text-slate-400 mb-1">{{ lang.t('code.drop_files') }}</p>
              <p class="text-xs text-slate-600">.java, .ts, .js, .py, .go, .rs, .cs, .cpp, .json, .yaml, .xml</p>
            </div>
            <div *ngIf="selectedFiles.length > 0">
              <div class="flex flex-wrap gap-2 justify-center">
                <span *ngFor="let f of selectedFiles" class="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-300">
                  {{ f.name }} <span class="text-slate-600">({{ formatSize(f.size) }})</span>
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-2">{{ selectedFiles.length }} {{ lang.t('code.files_selected') }}</p>
            </div>
          </div>
          <input #fileInput type="file" multiple accept=".java,.ts,.js,.py,.go,.rs,.cs,.cpp,.h,.json,.yaml,.yml,.xml,.kt,.swift,.rb,.php,.sql,.sh,.dockerfile,.gradle,.toml,.cfg,.ini,.properties,.html,.css,.scss"
                 (change)="onFileSelect($event)" class="hidden">

          <button (click)="startAnalysis()" [disabled]="selectedFiles.length === 0 || analyzing"
                  [class]="selectedFiles.length > 0
                    ? 'w-full mt-6 py-3 rounded-lg font-semibold transition-all duration-300 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white hover:shadow-lg hover:shadow-red-500/25 flex items-center justify-center gap-2'
                    : 'w-full mt-6 py-3 rounded-lg font-semibold bg-slate-700/50 text-slate-500 cursor-not-allowed'">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
            {{ lang.t('code.start_analysis') }}
          </button>
        </div>
      </div>

      <!-- Analyzing state -->
      <div *ngIf="analyzing" class="text-center py-16 animate-fade-in">
        <div class="w-20 h-20 mx-auto mb-6 relative">
          <div class="absolute inset-0 border-4 border-red-500/20 rounded-full"></div>
          <div class="absolute inset-0 border-4 border-transparent border-t-red-500 rounded-full animate-spin"></div>
          <div class="absolute inset-2 border-4 border-transparent border-t-orange-400 rounded-full animate-spin" style="animation-direction: reverse; animation-duration: 1.5s"></div>
          <div class="absolute inset-4 border-4 border-transparent border-t-amber-400 rounded-full animate-spin" style="animation-duration: 2s"></div>
        </div>
        <h2 class="text-xl font-semibold text-red-300 mb-2">{{ lang.t('code.analyzing_iteration') }} {{ currentIteration }}/5</h2>
        <p class="text-sm text-slate-500 max-w-md mx-auto">{{ getIterationDesc() }}</p>
        <div class="flex items-center justify-center gap-2 mt-4">
          <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <span class="text-xs text-slate-500">Claude AI</span>
        </div>
      </div>

      <!-- Results -->
      <div *ngIf="iterations.length > 0 && !analyzing" class="animate-fade-in-up">

        <!-- Iteration tabs -->
        <div class="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
          <button *ngFor="let it of iterations; let i = index" (click)="activeIteration = i"
                  [class]="'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ' +
                           (activeIteration === i
                             ? 'bg-red-500/20 border border-red-500/40 text-red-400'
                             : 'bg-slate-800/50 border border-slate-700/30 text-slate-500 hover:text-slate-300')">
            {{ lang.t('code.iteration') }} {{ i + 1 }}
          </button>
          <button *ngIf="iterations.length < 5" (click)="runNextIteration()"
                  class="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-400
                         hover:bg-red-500/20 transition-all whitespace-nowrap flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
            {{ lang.t('code.next_iteration') }}
          </button>
        </div>

        <!-- Active result -->
        <ng-container *ngIf="activeResult">

          <!-- Top cards: AI %, Verdict, Financial exposure -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <!-- AI Generated % -->
            <div class="glass-card p-5 border-orange-500/20">
              <p class="text-xs text-slate-500 mb-2">{{ lang.t('code.ai_percentage') }}</p>
              <div class="flex items-end gap-2">
                <span class="text-4xl font-black" [class]="activeResult.aiGeneratedPercentage > 70 ? 'text-red-400' : activeResult.aiGeneratedPercentage > 40 ? 'text-orange-400' : 'text-amber-400'">
                  {{ activeResult.aiGeneratedPercentage }}%
                </span>
                <span class="text-xs px-2 py-0.5 rounded mb-1"
                      [class]="'bg-' + (activeResult.aiConfidence === 'HIGH' ? 'red' : activeResult.aiConfidence === 'MEDIUM' ? 'orange' : 'amber') + '-500/15 text-' + (activeResult.aiConfidence === 'HIGH' ? 'red' : activeResult.aiConfidence === 'MEDIUM' ? 'orange' : 'amber') + '-400'">
                  {{ activeResult.aiConfidence }}
                </span>
              </div>
              <p class="text-[10px] text-slate-600 mt-2">{{ lang.t('code.ai_warning') }}</p>
            </div>

            <!-- Overall verdict -->
            <div class="glass-card p-5" [class]="getVerdictBorder()">
              <p class="text-xs text-slate-500 mb-2">{{ lang.t('code.verdict') }}</p>
              <div class="flex items-center gap-2">
                <span class="text-2xl">{{ getVerdictIcon() }}</span>
                <span class="text-lg font-bold" [class]="getVerdictColor()">{{ getVerdictLabel() }}</span>
              </div>
              <p class="text-xs text-slate-500 mt-2">{{ activeResult.topPriority }}</p>
            </div>

            <!-- Financial exposure -->
            <div class="glass-card p-5 border-red-500/30">
              <p class="text-xs text-slate-500 mb-2">{{ lang.t('code.total_exposure') }}</p>
              <p class="text-2xl font-black text-red-400">{{ activeResult.financialRiskSummary?.totalExposure || '?' }}</p>
              <div class="flex items-center gap-3 mt-2">
                <div class="text-[10px]">
                  <span class="text-slate-600">Knight Capital:</span>
                  <span class="text-red-400 font-bold"> {{ activeResult.financialRiskSummary?.knightCapitalRisk || 0 }}%</span>
                </div>
                <div class="text-[10px]">
                  <span class="text-slate-600">12kk katastroof:</span>
                  <span class="text-orange-400 font-bold"> {{ activeResult.financialRiskSummary?.catastrophicFailureProbability || '?' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Iteration summary -->
          <div class="glass-card p-5 mb-6 border-red-500/20">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
              <p class="text-sm text-slate-300 leading-relaxed">{{ lang.currentLang === 'et' ? (activeResult.iterationSummaryEt || activeResult.iterationSummary) : activeResult.iterationSummary }}</p>
            </div>
          </div>

          <!-- AI indicators -->
          <div *ngIf="activeResult!.aiIndicators?.length" class="glass-card p-5 mb-6">
            <h3 class="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              {{ lang.t('code.ai_indicators') }} ({{ activeResult.aiIndicators.length }})
            </h3>
            <div *ngFor="let ind of activeResult.aiIndicators; let i = index"
                 [class]="'flex items-start gap-3 py-2' + (i > 0 ? ' border-t border-slate-700/50' : '')">
              <span [class]="'px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ' +
                             (ind.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : ind.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400')">
                {{ ind.severity }}
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-xs text-slate-300">{{ ind.indicator }}</p>
                <p class="text-[10px] text-slate-600 mt-0.5">{{ ind.file }} {{ ind.line ? ':' + ind.line : '' }}</p>
              </div>
            </div>
          </div>

          <!-- Security vulnerabilities -->
          <div *ngIf="activeResult!.securityVulnerabilities?.length" class="mb-6">
            <h3 class="text-sm font-semibold text-red-300 mb-3 flex items-center gap-2">
              <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              {{ lang.t('code.security_vulns') }} ({{ activeResult.securityVulnerabilities.length }})
            </h3>
            <div *ngFor="let vuln of activeResult.securityVulnerabilities; let vi = index"
                 [class]="'glass-card p-5 mb-3' + (vuln.severity === 'CRITICAL' ? ' border-red-500/30' : vuln.severity === 'HIGH' ? ' border-orange-500/20' : '')">
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="flex items-center gap-2">
                  <span [class]="'px-2 py-0.5 rounded text-[10px] font-bold ' + getSeverityClass(vuln.severity)">
                    {{ vuln.severity }}
                  </span>
                  <span class="text-xs text-slate-600 font-mono">{{ vuln.id }}</span>
                </div>
                <span *ngIf="vuln.exploitDifficulty" class="text-[10px] text-slate-500 px-2 py-0.5 rounded bg-slate-800 border border-slate-700/50">
                  {{ lang.t('code.exploit') }}: {{ vuln.exploitDifficulty }}
                </span>
              </div>
              <h4 class="text-sm font-semibold text-slate-200 mb-1">{{ lang.currentLang === 'et' ? (vuln.titleEt || vuln.title) : vuln.title }}</h4>
              <p class="text-xs text-slate-400 mb-2">{{ lang.currentLang === 'et' ? (vuln.descriptionEt || vuln.description) : vuln.description }}</p>
              <p class="text-[10px] text-slate-600 mb-3">{{ vuln.file }} {{ vuln.line ? ':' + vuln.line : '' }}</p>

              <!-- Real world parallel -->
              <div *ngIf="vuln.realWorldParallel" class="bg-red-500/5 border border-red-500/15 rounded-lg p-3 mb-2">
                <p class="text-[10px] text-red-400/80 font-medium mb-0.5">{{ lang.t('code.real_world') }}</p>
                <p class="text-xs text-red-300/70">{{ vuln.realWorldParallel }}</p>
              </div>
              <!-- Financial impact -->
              <div *ngIf="vuln.financialImpact" class="flex items-center gap-2 mb-2">
                <svg class="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="text-xs font-mono text-red-400">{{ vuln.financialImpact }}</span>
              </div>
              <!-- Fix + critique -->
              <div *ngIf="vuln.fix" class="bg-emerald-500/5 border-l-2 border-emerald-500/30 rounded-r-lg p-2 mb-1">
                <p class="text-[10px] text-emerald-400 font-medium">{{ lang.t('code.fix') }}</p>
                <p class="text-xs text-slate-400">{{ vuln.fix }}</p>
              </div>
              <div *ngIf="vuln.fixCritique" class="bg-amber-500/5 border-l-2 border-amber-500/30 rounded-r-lg p-2">
                <p class="text-[10px] text-amber-400 font-medium">{{ lang.t('code.fix_critique') }}</p>
                <p class="text-xs text-slate-500">{{ vuln.fixCritique }}</p>
              </div>
            </div>
          </div>

          <!-- Code quality issues -->
          <div *ngIf="activeResult!.codeQualityIssues?.length" class="mb-6">
            <h3 class="text-sm font-semibold text-amber-300 mb-3 flex items-center gap-2">
              <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
              </svg>
              {{ lang.t('code.quality_issues') }} ({{ activeResult.codeQualityIssues.length }})
            </h3>
            <div *ngFor="let cq of activeResult.codeQualityIssues"
                 class="glass-card p-4 mb-2">
              <div class="flex items-start gap-2">
                <span [class]="'px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ' + getSeverityClass(cq.severity)">{{ cq.severity }}</span>
                <div class="flex-1 min-w-0">
                  <h4 class="text-xs font-semibold text-slate-200">{{ lang.currentLang === 'et' ? (cq.titleEt || cq.title) : cq.title }}</h4>
                  <p class="text-xs text-slate-500 mt-0.5">{{ lang.currentLang === 'et' ? (cq.descriptionEt || cq.description) : cq.description }}</p>
                  <div class="flex items-center gap-3 mt-1">
                    <span class="text-[10px] text-slate-600">{{ cq.file }}</span>
                    <span *ngIf="cq.potentialCost" class="text-[10px] text-red-400 font-mono">{{ cq.potentialCost }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Financial risk deep dive -->
          <div *ngIf="activeResult.financialRiskSummary" class="glass-card p-6 mb-6 border-red-500/20">
            <h3 class="text-sm font-semibold text-red-300 mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/>
              </svg>
              {{ lang.t('code.financial_deep') }}
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div class="bg-slate-900/50 rounded-lg p-3 text-center">
                <p class="text-[10px] text-slate-500 mb-1">{{ lang.t('code.total_exposure') }}</p>
                <p class="text-lg font-bold text-red-400">{{ activeResult.financialRiskSummary.totalExposure }}</p>
              </div>
              <div class="bg-slate-900/50 rounded-lg p-3 text-center">
                <p class="text-[10px] text-slate-500 mb-1">{{ lang.t('code.annual_loss') }}</p>
                <p class="text-lg font-bold text-orange-400">{{ activeResult.financialRiskSummary.estimatedAnnualLoss }}</p>
              </div>
              <div class="bg-slate-900/50 rounded-lg p-3 text-center">
                <p class="text-[10px] text-slate-500 mb-1">{{ lang.t('code.catastrophe_12m') }}</p>
                <p class="text-lg font-bold text-amber-400">{{ activeResult.financialRiskSummary.catastrophicFailureProbability }}</p>
              </div>
              <div class="bg-slate-900/50 rounded-lg p-3 text-center">
                <p class="text-[10px] text-slate-500 mb-1">{{ lang.t('code.compliance_risk') }}</p>
                <p class="text-lg font-bold" [class]="activeResult.financialRiskSummary.complianceRisk === 'HIGH' ? 'text-red-400' : 'text-amber-400'">
                  {{ activeResult.financialRiskSummary.complianceRisk }}
                </p>
              </div>
            </div>

            <!-- Knight Capital meter -->
            <div class="mt-4 bg-slate-900/50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <p class="text-xs text-slate-400">Knight Capital Risk Index</p>
                <p class="text-xs font-bold" [class]="(activeResult.financialRiskSummary.knightCapitalRisk || 0) > 60 ? 'text-red-400' : 'text-amber-400'">
                  {{ activeResult.financialRiskSummary.knightCapitalRisk || 0 }}/100
                </p>
              </div>
              <div class="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div class="h-3 rounded-full transition-all duration-1000"
                     [class]="(activeResult.financialRiskSummary.knightCapitalRisk || 0) > 60 ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-amber-600 to-amber-400'"
                     [style.width.%]="activeResult.financialRiskSummary.knightCapitalRisk || 0">
                </div>
              </div>
              <p class="text-[10px] text-slate-600 mt-1">0 = turvaline &middot; 100 = Knight Capital 01.08.2012 ({{ lang.currentLang === 'et' ? '460M kaotus 45 minutiga' : '$460M loss in 45 minutes' }})</p>
            </div>
          </div>

          <!-- PM Impact Dashboard -->
          <div *ngIf="activeResult" class="glass-card p-6 mb-6 border-amber-500/20">
            <div class="flex items-center gap-2 mb-4">
              <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <h3 class="text-sm font-semibold text-amber-300">{{ lang.t('code.pm_dashboard') }}</h3>
              <span class="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">PM &amp; C-level</span>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div class="bg-red-500/5 border border-red-500/15 rounded-lg p-3 text-center">
                <p class="text-[10px] text-slate-500 mb-1">{{ lang.t('code.pm_wasted_hours') }}</p>
                <p class="text-2xl font-black text-red-400">{{ calcWastedHours() }}</p>
                <p class="text-[10px] text-slate-600">{{ lang.currentLang === 'et' ? 'tundi' : 'hours' }}</p>
              </div>
              <div class="bg-orange-500/5 border border-orange-500/15 rounded-lg p-3 text-center">
                <p class="text-[10px] text-slate-500 mb-1">{{ lang.t('code.pm_wasted_eur') }}</p>
                <p class="text-2xl font-black text-orange-400">&euro;{{ calcWastedEur() }}</p>
                <p class="text-[10px] text-slate-600">{{ lang.currentLang === 'et' ? 'raisatud' : 'wasted' }}</p>
              </div>
              <div class="bg-amber-500/5 border border-amber-500/15 rounded-lg p-3 text-center">
                <p class="text-[10px] text-slate-500 mb-1">{{ lang.t('code.pm_fix_hours') }}</p>
                <p class="text-2xl font-black text-amber-400">{{ calcFixHours() }}</p>
                <p class="text-[10px] text-slate-600">{{ lang.currentLang === 'et' ? 'tundi parandamiseks' : 'hours to fix' }}</p>
              </div>
              <div class="bg-red-500/5 border border-red-500/15 rounded-lg p-3 text-center">
                <p class="text-[10px] text-slate-500 mb-1">{{ lang.t('code.pm_fix_cost') }}</p>
                <p class="text-2xl font-black text-red-400">&euro;{{ calcFixCost() }}</p>
                <p class="text-[10px] text-slate-600">{{ lang.currentLang === 'et' ? 'paranduskulu' : 'fix cost' }}</p>
              </div>
            </div>

            <!-- Team impact breakdown -->
            <div class="bg-slate-900/50 rounded-lg p-4 mb-3">
              <p class="text-xs font-medium text-slate-400 mb-3">{{ lang.t('code.pm_team_impact') }}</p>
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs text-slate-500">{{ lang.currentLang === 'et' ? 'Arendajate aeg vigade otsimisel' : 'Developer time hunting bugs' }}</span>
                  <span class="text-xs font-mono text-red-400">{{ calcDebugPercent() }}% {{ lang.currentLang === 'et' ? 'ajast' : 'of time' }}</span>
                </div>
                <div class="w-full bg-slate-700 rounded-full h-2">
                  <div class="h-2 rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all" [style.width.%]="calcDebugPercent()"></div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-slate-500">{{ lang.currentLang === 'et' ? 'FTE ekvivalent raisatud' : 'FTE equivalent wasted' }}</span>
                  <span class="text-xs font-mono text-orange-400">{{ calcWastedFTE() }} FTE</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-slate-500">{{ lang.currentLang === 'et' ? 'Projekti viivitus (kuud)' : 'Project delay (months)' }}</span>
                  <span class="text-xs font-mono text-amber-400">{{ calcDelayMonths() }} {{ lang.currentLang === 'et' ? 'kuud' : 'months' }}</span>
                </div>
              </div>
            </div>

            <!-- The brutal truth -->
            <div class="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
              <p class="text-xs font-bold text-red-400 mb-1">{{ lang.t('code.pm_brutal') }}</p>
              <p class="text-xs text-slate-400 leading-relaxed">{{ getPmBrutalTruth() }}</p>
            </div>
          </div>

          <!-- Next iteration or reset -->
          <div class="flex items-center justify-center gap-3 mt-8">
            <button *ngIf="iterations.length < 5" (click)="runNextIteration()"
                    class="px-6 py-2.5 rounded-lg font-medium text-sm bg-gradient-to-r from-red-600 to-orange-500
                           text-white hover:from-red-500 hover:to-orange-400 hover:shadow-lg hover:shadow-red-500/25 transition-all
                           flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
              {{ lang.t('code.iteration') }} {{ iterations.length + 1 }}/5: {{ getNextIterationLabel() }}
            </button>
            <button (click)="resetAll()"
                    class="px-6 py-2.5 rounded-lg font-medium text-sm bg-slate-700/50 text-slate-300 border border-slate-600/30
                           hover:bg-slate-600/50 hover:text-red-400 transition-all">
              {{ lang.t('code.new_analysis') }}
            </button>
          </div>

        </ng-container>
      </div>
    </div>
  `
})
export class CodeAnalysisComponent {
  companyName = '';
  annualRevenue = 0;
  hourlyRate = 85;
  teamSize = 5;
  devMonths = 12;
  selectedFiles: File[] = [];
  dragOver = false;
  analyzing = false;
  currentIteration = 1;
  iterations: AnalysisResult[] = [];
  activeIteration = 0;
  selectedMock: string | null = null;
  selectedQuality: string | null = null;

  mockCodebases = [
    {
      id: 'ecommerce', icon: '\uD83D\uDED2', name: 'E-Commerce Platform', nameEt: 'E-kaubanduse platvorm',
      desc: 'Node.js + Express, payment processing, user auth, product catalog',
      descEt: 'Node.js + Express, maksete t\u00F6\u00F6tlemine, autentimine, tootekataloog',
      files: 6, lines: 420
    },
    {
      id: 'fintech', icon: '\uD83C\uDFE6', name: 'Fintech API', nameEt: 'Fintech API',
      desc: 'Java Spring Boot, transaction engine, KYC/AML, risk scoring',
      descEt: 'Java Spring Boot, tehingumootor, KYC/AML, riskiskoor',
      files: 5, lines: 380
    },
    {
      id: 'healthcare', icon: '\uD83C\uDFE5', name: 'Healthcare Portal', nameEt: 'Terviseportaal',
      desc: 'Python Flask, patient records, DICOM viewer, drug interactions',
      descEt: 'Python Flask, patsiendiandmed, DICOM vaataja, ravimite kooostoimed',
      files: 5, lines: 350
    }
  ];

  qualityLevels = [
    {
      id: 'strong', icon: '\uD83D\uDEE1\uFE0F', label: 'Production-grade', labelEt: 'Tootmiskvaliteet',
      hint: 'Clean code, tests, CI/CD', hintEt: 'Puhas kood, testid, CI/CD',
      activeClass: 'border-emerald-500/50 bg-emerald-500/10', textClass: 'text-emerald-400'
    },
    {
      id: 'average', icon: '\u26A0\uFE0F', label: 'Typical startup', labelEt: 'T\u00FC\u00FCpiline startup',
      hint: 'Mixed quality, some tests', hintEt: 'Erinev kvaliteet, m\u00F5ned testid',
      activeClass: 'border-amber-500/50 bg-amber-500/10', textClass: 'text-amber-400'
    },
    {
      id: 'weak', icon: '\uD83D\uDCA3', label: 'AI-vibe-coded', labelEt: 'AI-vibe-coded',
      hint: 'No tests, copy-paste, YOLO', hintEt: 'Testideta, copy-paste, YOLO',
      activeClass: 'border-red-500/50 bg-red-500/10', textClass: 'text-red-400'
    }
  ];

  disasters = [
    { name: 'Knight Capital', year: '2012', cost: '$460M / 45min', cause: 'Untested code deployment' },
    { name: 'Therac-25', year: '1985-87', cost: '6 deaths', cause: 'Race condition, no hardware interlocks' },
    { name: 'Ariane 5', year: '1996', cost: '$370M', cause: 'Integer overflow in guidance' },
    { name: 'Boeing 737 MAX', year: '2018-19', cost: '346 deaths', cause: 'MCAS single sensor dependency' },
    { name: 'Heartbleed', year: '2014', cost: '$500M+', cause: 'Missing bounds check in OpenSSL' },
    { name: 'Equifax', year: '2017', cost: '$1.4B', cause: 'Unpatched Apache Struts' },
    { name: 'CrowdStrike', year: '2024', cost: '$5.4B', cause: 'Faulty channel file update' },
    { name: 'Patriot Missile', year: '1991', cost: '28 deaths', cause: 'Floating point rounding error' },
    { name: 'Toyota UA', year: '2009-11', cost: '$1.2B + 89 deaths', cause: 'Spaghetti code, 10K global vars' },
    { name: 'Volkswagen', year: '2015', cost: '$30B', cause: 'Emissions cheating software' },
  ];

  constructor(private http: HttpClient, public lang: LangService) {}

  get activeResult(): AnalysisResult | null {
    return this.iterations[this.activeIteration] || null;
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
    }
  }

  onDragOver(event: DragEvent) { event.preventDefault(); event.stopPropagation(); this.dragOver = true; }
  onDrop(event: DragEvent) {
    event.preventDefault(); event.stopPropagation(); this.dragOver = false;
    if (event.dataTransfer?.files) {
      this.selectedFiles = Array.from(event.dataTransfer.files);
    }
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  startAnalysis() {
    this.currentIteration = 1;
    this.iterations = [];
    this.runIteration(1);
  }

  runNextIteration() {
    if (this.iterations.length < 5) {
      this.runIteration(this.iterations.length + 1);
    }
  }

  private runIteration(iteration: number) {
    this.analyzing = true;
    this.currentIteration = iteration;

    const formData = new FormData();
    for (const f of this.selectedFiles) {
      formData.append('files', f);
    }
    formData.append('companyName', this.companyName);
    formData.append('annualRevenue', String(this.annualRevenue || 0));
    formData.append('iteration', String(iteration));
    if (this.selectedQuality) {
      formData.append('qualityContext', this.selectedQuality);
    }

    this.http.post<AnalysisResult>('/api/code-analysis/analyze', formData).subscribe({
      next: (result) => {
        this.iterations.push(result);
        this.activeIteration = this.iterations.length - 1;
        this.analyzing = false;
      },
      error: (err) => {
        console.error('Analysis failed:', err);
        this.analyzing = false;
      }
    });
  }

  resetAll() {
    this.iterations = [];
    this.activeIteration = 0;
    this.selectedFiles = [];
    this.currentIteration = 1;
  }

  getIterationDesc(): string {
    const descs: { [k: number]: { et: string; en: string } } = {
      1: { et: 'Esialgne skanneerimine. AI mustrid, turvaaaugud, koodikvaliteet...', en: 'Initial scan. AI patterns, security holes, code quality...' },
      2: { et: 'Sügavanalüüs. Miks need probleemid on ohtlikud? Knight Capital, Therac-25 parallleelid...', en: 'Deep dive. Why are these problems dangerous? Knight Capital, Therac-25 parallels...' },
      3: { et: 'Ründepinna analüüs. Mida saab ära kasutada? Andmelekked? Teenuse katkestused?', en: 'Attack surface analysis. What can be exploited? Data leaks? Service disruptions?' },
      4: { et: 'Lahenduste kriitika. Mis tööriistad on olemas ja miks need enamasti ei tööta?', en: 'Solution critique. What tools exist and why do they usually fail?' },
      5: { et: 'Juhtkonna kokkuvõte. Kogu finantsiline kokkupuude. Mis tuleb parandada KOHE?', en: 'Executive summary. Total financial exposure. What must be fixed NOW?' }
    };
    const d = descs[this.currentIteration] || descs[1];
    return this.lang.currentLang === 'et' ? d.et : d.en;
  }

  getNextIterationLabel(): string {
    const labels: { [k: number]: { et: string; en: string } } = {
      2: { et: 'Sügavanalüüs', en: 'Deep dive' },
      3: { et: 'Ründepind', en: 'Attack surface' },
      4: { et: 'Lahenduste kriitika', en: 'Solution critique' },
      5: { et: 'Juhtkonna raport', en: 'Executive report' }
    };
    const next = this.iterations.length + 1;
    const l = labels[next] || { et: 'Järgmine', en: 'Next' };
    return this.lang.currentLang === 'et' ? l.et : l.en;
  }

  getSeverityClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-400';
      case 'LOW': return 'bg-slate-500/20 text-slate-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  }

  getVerdictBorder(): string {
    switch (this.activeResult?.overallVerdict) {
      case 'CRITICAL_RISK': return 'border-red-500/40';
      case 'HIGH_RISK': return 'border-orange-500/30';
      case 'MODERATE_RISK': return 'border-amber-500/20';
      default: return 'border-emerald-500/20';
    }
  }

  getVerdictColor(): string {
    switch (this.activeResult?.overallVerdict) {
      case 'CRITICAL_RISK': return 'text-red-400';
      case 'HIGH_RISK': return 'text-orange-400';
      case 'MODERATE_RISK': return 'text-amber-400';
      default: return 'text-emerald-400';
    }
  }

  getVerdictIcon(): string {
    switch (this.activeResult?.overallVerdict) {
      case 'CRITICAL_RISK': return '\u{1F6A8}';
      case 'HIGH_RISK': return '\u26A0\uFE0F';
      case 'MODERATE_RISK': return '\u{1F7E1}';
      default: return '\u2705';
    }
  }

  getVerdictLabel(): string {
    const labels: { [k: string]: { et: string; en: string } } = {
      'CRITICAL_RISK': { et: 'KRIITILINE RISK', en: 'CRITICAL RISK' },
      'HIGH_RISK': { et: 'KÕRGE RISK', en: 'HIGH RISK' },
      'MODERATE_RISK': { et: 'MÕÕDUKAS RISK', en: 'MODERATE RISK' },
      'LOW_RISK': { et: 'MADAL RISK', en: 'LOW RISK' }
    };
    const v = this.activeResult?.overallVerdict || 'MODERATE_RISK';
    const l = labels[v] || labels['MODERATE_RISK'];
    return this.lang.currentLang === 'et' ? l.et : l.en;
  }

  loadMockCodebase() {
    if (!this.selectedMock) return;
    if (!this.selectedQuality) this.selectedQuality = 'weak';
    const code = this.getMockCode(this.selectedMock, this.selectedQuality);
    const files: File[] = [];
    for (const [name, content] of Object.entries(code)) {
      files.push(new File([content], name, { type: 'text/plain' }));
    }
    this.selectedFiles = files;
    if (!this.companyName) {
      this.companyName = this.selectedMock === 'ecommerce' ? 'ShopNow OÜ' : this.selectedMock === 'fintech' ? 'PayFast AS' : 'MedTech OÜ';
    }
    if (!this.annualRevenue) this.annualRevenue = 5000000;
  }

  private getMockCode(id: string, quality: string): { [filename: string]: string } {
    if (id === 'ecommerce') return this.ecommerceMock(quality);
    if (id === 'fintech') return this.fintechMock(quality);
    return this.healthcareMock(quality);
  }

  private ecommerceMock(q: string): { [f: string]: string } {
    const weak = q === 'weak', avg = q === 'average';
    return {
      'server.js': `const express = require('express');
const app = express();
app.use(express.json());
${weak ? `// TODO: add auth later
const DB_PASSWORD = 'admin123';
const STRIPE_KEY = 'sk_live_EXPOSED_KEY_EXAMPLE_DO_NOT_USE';` : avg ? `const bcrypt = require('bcrypt');
// Auth middleware - basic
function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({error: 'No token'});
  next(); // TODO: actually verify token
}` : `import { verify } from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);`}

app.post('/api/payment', ${weak ? '' : avg ? 'auth, ' : ''}async (req, res) => {
  const { cardNumber, amount, cvv } = req.body;
  ${weak ? `console.log('Payment:', cardNumber, cvv, amount);
  // Process payment
  const result = await fetch('https://api.stripe.com/v1/charges', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + STRIPE_KEY },
    body: JSON.stringify({ amount, source: cardNumber })
  });
  res.json({ success: true, card: cardNumber });` : avg ? `if (!amount || amount <= 0) return res.status(400).json({error: 'Invalid amount'});
  // Payment processing
  try {
    const charge = await stripe.charges.create({ amount: Math.round(amount * 100), currency: 'eur' });
    res.json({ success: true, chargeId: charge.id });
  } catch(e) {
    res.status(500).json({ error: e.message }); // Leaks internal errors
  }` : `if (!amount || amount <= 0 || amount > 999999) return res.status(400).json({error: 'Invalid amount'});
  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey) return res.status(400).json({error: 'Idempotency key required'});
  const charge = await stripe.charges.create(
    { amount: Math.round(amount * 100), currency: 'eur' },
    { idempotencyKey }
  );
  logger.info('Payment processed', { chargeId: charge.id, amount });
  res.json({ success: true, chargeId: charge.id });`}
});

app.get('/api/users', async (req, res) => {
  ${weak ? `const users = await db.query('SELECT * FROM users WHERE name = "' + req.query.name + '"');
  res.json(users);` : avg ? `const users = await db.query('SELECT id, name, email FROM users WHERE name = ?', [req.query.name]);
  res.json(users);` : `const { name } = sanitize(req.query);
  const users = await db.query('SELECT id, name FROM users WHERE name = $1 LIMIT 50', [name]);
  res.json({ data: users, count: users.length });`}
});

app.listen(${weak ? '3000' : 'process.env.PORT || 3000'});`,

      'cart.js': `${weak ? `// Shopping cart - generated by ChatGPT
function addToCart(item) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart.push(item);
  localStorage.setItem('cart', JSON.stringify(cart));
  // No size limit, no validation, no XSS protection
  document.getElementById('cart-count').innerHTML = cart.length;
  document.getElementById('total').innerHTML = '$' + cart.reduce((s, i) => s + i.price, 0);
}
function checkout() {
  const cart = JSON.parse(localStorage.getItem('cart'));
  fetch('/api/payment', {
    method: 'POST',
    body: JSON.stringify({ items: cart, cardNumber: document.getElementById('card').value, cvv: document.getElementById('cvv').value })
  });
}` : avg ? `class Cart {
  items = [];
  addItem(item) {
    if (!item.id || !item.price) throw new Error('Invalid item');
    this.items.push({...item, addedAt: Date.now()});
  }
  getTotal() {
    return this.items.reduce((sum, i) => sum + (i.price * (i.qty || 1)), 0);
  }
  async checkout(paymentToken) {
    const res = await fetch('/api/payment', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({amount: this.getTotal(), token: paymentToken})
    });
    return res.json();
  }
}` : `class Cart {
  private items: CartItem[] = [];
  private readonly MAX_ITEMS = 100;
  addItem(item: CartItem): void {
    if (this.items.length >= this.MAX_ITEMS) throw new CartError('Cart full');
    validateItem(item);
    this.items.push(Object.freeze({...item, addedAt: Date.now()}));
  }
  getTotal(): number {
    return this.items.reduce((sum, i) => sum + sanitizePrice(i.price) * Math.max(1, i.qty), 0);
  }
}`}`,

      'auth.js': `${weak ? `app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.query('SELECT * FROM users WHERE email = "' + email + '" AND password = "' + password + '"');
  if (user) {
    res.cookie('session', user.id); // No httpOnly, no secure, no sameSite
    res.json({ user });
  }
});
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  db.query('INSERT INTO users (email, password) VALUES ("' + email + '", "' + password + '")');
  res.json({ success: true });
});` : avg ? `app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});` : `app.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = validateLogin(req.body);
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !await argon2.verify(user.passwordHash, password)) {
    await sleep(randomInt(100, 500)); // Timing attack prevention
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ sub: user.id, iat: Date.now() }, config.jwtSecret, { expiresIn: '1h' });
  res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 3600000 });
  auditLog.info('Login', { userId: user.id, ip: req.ip });
  res.json({ success: true });
});`}`,

      'product.js': `${weak ? `app.get('/product/:id', (req, res) => {
  const product = db.query('SELECT * FROM products WHERE id = ' + req.params.id);
  res.send('<h1>' + product.name + '</h1><p>' + product.description + '</p><script>trackView(' + product.id + ')</script>');
});
app.post('/product', (req, res) => {
  db.query('INSERT INTO products VALUES (' + req.body.name + ', ' + req.body.price + ')');
  res.json({ok: true});
});
// eval for dynamic pricing
app.post('/price', (req, res) => {
  const result = eval(req.body.formula);
  res.json({price: result});
});` : avg ? `app.get('/product/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({error: 'Not found'});
  res.json(product);
});
app.post('/product', auth, async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.json(product);
});` : `app.get('/product/:id', cache('5m'), async (req, res) => {
  const id = validateId(req.params.id);
  const product = await Product.findById(id).select('-internalNotes');
  if (!product) return res.status(404).json({error: 'Not found'});
  res.json(product);
});`}`,

      'database.js': `${weak ? `const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'localhost', user: 'root', password: '', database: 'shop'
});
// No connection pooling, no error handling, no prepared statements
module.exports = {
  query: (sql) => {
    return new Promise((resolve) => {
      connection.query(sql, (err, results) => {
        resolve(results); // Swallows errors silently
      });
    });
  }
};` : avg ? `const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
module.exports = {
  query: (text, params) => pool.query(text, params)
};` : `const { Pool } = require('pg');
const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000
});
pool.on('error', (err) => logger.error('DB pool error', err));
module.exports = {
  query: async (text, params) => {
    const start = Date.now();
    const result = await pool.query(text, params);
    logger.debug('Query', { text, duration: Date.now() - start, rows: result.rowCount });
    return result;
  },
  transaction: async (fn) => {
    const client = await pool.connect();
    try { await client.query('BEGIN'); const r = await fn(client); await client.query('COMMIT'); return r; }
    catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
  }
};`}`,

      'config.js': `${weak ? `module.exports = {
  db: { host: 'prod-db.company.com', user: 'admin', password: 'Str0ngP@ss!' },
  stripe: { key: 'sk_live_EXPOSED_KEY_EXAMPLE_DO_NOT_USE' },
  jwt: { secret: 'mysecret123' },
  smtp: { password: 'emailpass456' }
};` : avg ? `module.exports = {
  db: { url: process.env.DATABASE_URL || 'postgresql://localhost/shop' },
  stripe: { key: process.env.STRIPE_KEY },
  jwt: { secret: process.env.JWT_SECRET || 'dev-secret' }
};` : `const config = {
  db: { url: requireEnv('DATABASE_URL') },
  stripe: { key: requireEnv('STRIPE_SECRET_KEY') },
  jwt: { secret: requireEnv('JWT_SECRET'), audience: 'shop-api', issuer: 'shop' }
};
function requireEnv(name) {
  const val = process.env[name];
  if (!val) throw new Error('Missing required env: ' + name);
  return val;
}
module.exports = Object.freeze(config);`}`
    };
  }

  private fintechMock(q: string): { [f: string]: string } {
    const weak = q === 'weak', avg = q === 'average';
    return {
      'TransactionService.java': `${weak ? `@Service
public class TransactionService {
    @Autowired JdbcTemplate db;
    public Map<String, Object> transfer(String from, String to, double amount) {
        // No transaction isolation, no locking, race condition paradise
        double balance = db.queryForObject("SELECT balance FROM accounts WHERE id = '" + from + "'", Double.class);
        if (balance >= amount) {
            db.execute("UPDATE accounts SET balance = balance - " + amount + " WHERE id = '" + from + "'");
            db.execute("UPDATE accounts SET balance = balance + " + amount + " WHERE id = '" + to + "'");
            return Map.of("status", "ok", "from_balance", balance - amount);
        }
        return Map.of("status", "insufficient_funds");
    }
    // Scheduled job runs every minute, no distributed lock
    @Scheduled(fixedRate = 60000)
    public void processSettlements() {
        List<Map> pending = db.queryForList("SELECT * FROM settlements WHERE status = 'pending'");
        for (Map s : pending) {
            transfer((String)s.get("from_id"), (String)s.get("to_id"), (Double)s.get("amount"));
            db.execute("UPDATE settlements SET status = 'done' WHERE id = " + s.get("id"));
        }
    }
}` : avg ? `@Service
public class TransactionService {
    @Autowired private AccountRepository accountRepo;
    @Transactional
    public TransferResult transfer(TransferRequest req) {
        Account from = accountRepo.findById(req.fromId()).orElseThrow();
        Account to = accountRepo.findById(req.toId()).orElseThrow();
        if (from.getBalance().compareTo(req.amount()) < 0) throw new InsufficientFundsException();
        from.debit(req.amount());
        to.credit(req.amount());
        return new TransferResult("ok", from.getBalance());
    }
}` : `@Service @Slf4j
public class TransactionService {
    private final AccountRepository accountRepo;
    private final AuditService auditService;
    private final DistributedLock lockService;
    @Transactional(isolation = Isolation.SERIALIZABLE)
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 100))
    public TransferResult transfer(TransferRequest req) {
        validateTransfer(req);
        String lockKey = "transfer:" + Stream.of(req.fromId(), req.toId()).sorted().collect(joining(":"));
        return lockService.withLock(lockKey, Duration.ofSeconds(5), () -> {
            Account from = accountRepo.findByIdWithLock(req.fromId());
            Account to = accountRepo.findByIdWithLock(req.toId());
            from.debit(req.amount());
            to.credit(req.amount());
            auditService.logTransfer(req, from, to);
            return new TransferResult("ok", from.getBalance());
        });
    }
}`}`,
      'RiskEngine.java': `${weak ? `public class RiskEngine {
    public String assessRisk(String customerId, double txAmount) {
        // Hardcoded thresholds, no ML, no learning
        if (txAmount > 10000) return "HIGH";
        if (txAmount > 1000) return "MEDIUM";
        return "LOW";
        // TODO: add proper risk scoring
        // TODO: AML checks
        // TODO: sanctions screening
    }
}` : avg ? `public class RiskEngine {
    private final SanctionsService sanctions;
    public RiskScore assessRisk(Transaction tx) {
        int score = 0;
        if (tx.amount().compareTo(new BigDecimal("10000")) > 0) score += 40;
        if (sanctions.isMatch(tx.counterparty())) score += 80;
        if (isHighRiskCountry(tx.country())) score += 30;
        return new RiskScore(score, score > 70 ? "HIGH" : score > 40 ? "MEDIUM" : "LOW");
    }
}` : `@Service
public class RiskEngine {
    private final SanctionsService sanctions;
    private final MLModelService mlModel;
    private final VelocityChecker velocity;
    public RiskAssessment assessRisk(Transaction tx) {
        CompletableFuture<Integer> mlScore = mlModel.predictAsync(tx);
        CompletableFuture<Boolean> sanctionHit = sanctions.screenAsync(tx.counterparty());
        CompletableFuture<VelocityResult> vel = velocity.checkAsync(tx.accountId(), Duration.ofHours(24));
        return CompletableFuture.allOf(mlScore, sanctionHit, vel).thenApply(v -> {
            int score = mlScore.join() + (sanctionHit.join() ? 90 : 0) + vel.join().riskPoints();
            return new RiskAssessment(score, determineAction(score), buildExplanation(tx, score));
        }).join();
    }
}`}`,
      'KycController.java': `${weak ? `@RestController
public class KycController {
    @PostMapping("/api/kyc/verify")
    public Map verify(@RequestBody Map<String, String> data) {
        String ssn = data.get("ssn");
        String name = data.get("name");
        System.out.println("Verifying KYC for: " + name + " SSN: " + ssn); // Logs PII
        // Store unencrypted
        db.execute("INSERT INTO kyc_data VALUES ('" + name + "', '" + ssn + "', NOW())");
        return Map.of("verified", true);
    }
}` : avg ? `@RestController @RequestMapping("/api/kyc")
public class KycController {
    @PostMapping("/verify")
    public ResponseEntity<KycResult> verify(@Valid @RequestBody KycRequest req) {
        KycResult result = kycService.verify(req);
        return ResponseEntity.ok(result);
    }
}` : `@RestController @RequestMapping("/api/kyc")
public class KycController {
    @PostMapping("/verify")
    @RateLimited(requests = 10, per = Duration.ofMinutes(1))
    @AuditLogged(action = "KYC_VERIFY")
    public ResponseEntity<KycResult> verify(@Valid @RequestBody KycRequest req) {
        KycResult result = kycService.verify(req);
        return ResponseEntity.ok(result);
    }
}`}`,
      'AuditLog.java': `${weak ? `// No audit logging exists
// Regulator will love this` : avg ? `@Entity
public class AuditLog {
    @Id @GeneratedValue Long id;
    String action;
    String userId;
    LocalDateTime timestamp;
}` : `@Entity @Table(indexes = @Index(columnList = "userId,timestamp"))
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.UUID) UUID id;
    @Column(nullable = false) String action;
    @Column(nullable = false) String userId;
    @Column(nullable = false) String ipAddress;
    @Column(columnDefinition = "jsonb") String details;
    @Column(nullable = false) Instant timestamp;
    @Column(nullable = false) String integrityHash;
}`}`,
      'application.properties': `${weak ? `spring.datasource.url=jdbc:postgresql://prod-db:5432/fintech
spring.datasource.username=postgres
spring.datasource.password=postgres123
server.port=8080
# No SSL, no audit, no encryption at rest` : avg ? `spring.datasource.url=\${DATABASE_URL}
spring.datasource.username=\${DB_USER}
spring.datasource.password=\${DB_PASS}
server.ssl.enabled=true` : `spring.datasource.url=\${DATABASE_URL}
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.connection-timeout=5000
server.ssl.enabled=true
server.ssl.protocol=TLS
management.endpoints.web.exposure.include=health,metrics
management.endpoint.health.show-details=authorized`}`
    };
  }

  private healthcareMock(q: string): { [f: string]: string } {
    const weak = q === 'weak', avg = q === 'average';
    return {
      'patient_api.py': `${weak ? `from flask import Flask, request, jsonify
import sqlite3
app = Flask(__name__)

@app.route('/patient/<id>')
def get_patient(id):
    conn = sqlite3.connect('patients.db')
    # SQL injection + no auth + returns everything including SSN
    patient = conn.execute(f"SELECT * FROM patients WHERE id = {id}").fetchone()
    return jsonify(dict(patient))

@app.route('/patient', methods=['POST'])
def create_patient():
    data = request.json
    conn = sqlite3.connect('patients.db')
    conn.execute(f"INSERT INTO patients VALUES ('{data['name']}', '{data['ssn']}', '{data['diagnosis']}')")
    conn.commit()
    return jsonify({'status': 'ok'})

@app.route('/prescribe', methods=['POST'])
def prescribe():
    data = request.json
    # No drug interaction check, no dosage validation
    conn = sqlite3.connect('patients.db')
    conn.execute(f"INSERT INTO prescriptions VALUES ('{data['patient_id']}', '{data['drug']}', '{data['dosage']}')")
    return jsonify({'prescribed': True})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')  # Debug mode in production` : avg ? `from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
app = Flask(__name__)
db = SQLAlchemy(app)

@app.route('/patient/<int:id>')
@login_required
def get_patient(id):
    patient = Patient.query.get_or_404(id)
    return jsonify(patient.to_dict(exclude=['ssn']))

@app.route('/prescribe', methods=['POST'])
@login_required
def prescribe():
    data = PrescriptionSchema().load(request.json)
    prescription = PrescriptionService.create(data)
    return jsonify(prescription.to_dict())` : `from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_limiter import Limiter
app = Flask(__name__)
db = SQLAlchemy(app)
limiter = Limiter(app)

@app.route('/patient/<int:id>')
@login_required
@rbac_required('patient:read')
@audit_logged
def get_patient(id):
    patient = Patient.query.get_or_404(id)
    if not current_user.can_access_patient(patient): abort(403)
    return jsonify(patient.to_safe_dict())`}`,
      'drug_interactions.py': `${weak ? `# Drug interaction checker
KNOWN_INTERACTIONS = {
    'warfarin': ['aspirin'],  # This list has 3 entries. Real databases have 50,000+
    'metformin': ['alcohol'],
    'lisinopril': ['potassium']
}
def check_interactions(drug1, drug2):
    if drug2 in KNOWN_INTERACTIONS.get(drug1, []):
        return True
    return False
# Missing: severity levels, dosage-dependent interactions, patient-specific factors` : avg ? `class DrugInteractionService:
    def __init__(self):
        self.db = DrugDatabase()
    def check(self, drugs: list[str]) -> list[Interaction]:
        interactions = []
        for i, d1 in enumerate(drugs):
            for d2 in drugs[i+1:]:
                result = self.db.find_interaction(d1, d2)
                if result: interactions.append(result)
        return interactions` : `class DrugInteractionService:
    def __init__(self, db: DrugDatabase, patient_repo: PatientRepository):
        self.db = db
        self.patient_repo = patient_repo
    def check(self, patient_id: int, new_drug: str, dosage: Dosage) -> SafetyReport:
        patient = self.patient_repo.get(patient_id)
        current_meds = patient.active_medications()
        interactions = self.db.find_all_interactions(new_drug, [m.drug for m in current_meds])
        contraindications = self.db.check_contraindications(new_drug, patient.conditions, patient.allergies)
        dosage_safety = self.db.validate_dosage(new_drug, dosage, patient.weight, patient.age, patient.renal_function)
        return SafetyReport(interactions, contraindications, dosage_safety)`}`,
      'dicom_viewer.py': `${weak ? `import os
@app.route('/dicom/<path:filename>')
def serve_dicom(filename):
    # Path traversal vulnerability
    return send_file(os.path.join('/data/dicom', filename))

@app.route('/upload', methods=['POST'])
def upload_dicom():
    f = request.files['file']
    f.save('/data/dicom/' + f.filename)  # No validation, arbitrary file upload
    return jsonify({'saved': f.filename})` : avg ? `@app.route('/dicom/<int:study_id>')
@login_required
def serve_dicom(study_id):
    study = DicomStudy.query.get_or_404(study_id)
    return send_file(study.file_path)` : `@app.route('/dicom/<int:study_id>')
@login_required
@rbac_required('dicom:read')
def serve_dicom(study_id):
    study = DicomStudy.query.get_or_404(study_id)
    if not current_user.can_access_study(study): abort(403)
    safe_path = secure_filename(study.file_path)
    return send_file(safe_path, mimetype='application/dicom')`}`,
      'config.py': `${weak ? `DATABASE_URL = 'postgresql://admin:password123@prod-db:5432/healthcare'
SECRET_KEY = 'super-secret-key-do-not-share'
DEBUG = True
HIPAA_COMPLIANCE = False  # lol` : avg ? `import os
DATABASE_URL = os.environ.get('DATABASE_URL')
SECRET_KEY = os.environ.get('SECRET_KEY', 'change-me')
DEBUG = os.environ.get('DEBUG', 'false').lower() == 'true'` : `import os
def require_env(name):
    val = os.environ.get(name)
    if not val: raise RuntimeError(f'Missing env: {name}')
    return val
DATABASE_URL = require_env('DATABASE_URL')
SECRET_KEY = require_env('SECRET_KEY')
DEBUG = False
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = True`}`,
      'models.py': `${weak ? `# No encryption, no access control, plain text everything
class Patient:
    def __init__(self, name, ssn, diagnosis, medications):
        self.name = name
        self.ssn = ssn  # Stored in plain text
        self.diagnosis = diagnosis
        self.medications = medications
        # No audit trail, no access logging, no consent tracking` : avg ? `class Patient(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    ssn_encrypted = db.Column(db.LargeBinary, nullable=False)
    diagnosis = db.Column(db.Text)` : `class Patient(db.Model):
    __tablename__ = 'patients'
    id = db.Column(db.Integer, primary_key=True)
    name_encrypted = db.Column(db.LargeBinary, nullable=False)
    ssn_encrypted = db.Column(db.LargeBinary, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    consent_given = db.Column(db.Boolean, default=False)
    access_log = db.relationship('AccessLog', backref='patient')`}`
    };
  }

  // PM calculations
  calcWastedHours(): string {
    if (!this.activeResult) return '0';
    const aiPct = this.activeResult.aiGeneratedPercentage || 0;
    const vulns = this.activeResult.securityVulnerabilities?.length || 0;
    const quality = this.activeResult.codeQualityIssues?.length || 0;
    const totalDevHours = this.teamSize * this.devMonths * 160;
    const wastedRatio = Math.min(0.8, (aiPct / 200) + (vulns * 0.03) + (quality * 0.02));
    return Math.round(totalDevHours * wastedRatio).toLocaleString();
  }

  calcWastedEur(): string {
    const hours = parseInt(this.calcWastedHours().replace(/,/g, ''));
    return Math.round(hours * (this.hourlyRate || 85)).toLocaleString();
  }

  calcFixHours(): string {
    if (!this.activeResult) return '0';
    const vulns = this.activeResult.securityVulnerabilities?.length || 0;
    const quality = this.activeResult.codeQualityIssues?.length || 0;
    const criticals = this.activeResult.securityVulnerabilities?.filter(v => v.severity === 'CRITICAL').length || 0;
    return Math.round(criticals * 80 + (vulns - criticals) * 40 + quality * 16).toLocaleString();
  }

  calcFixCost(): string {
    const hours = parseInt(this.calcFixHours().replace(/,/g, ''));
    return Math.round(hours * (this.hourlyRate || 85) * 1.5).toLocaleString();
  }

  calcDebugPercent(): number {
    if (!this.activeResult) return 0;
    const aiPct = this.activeResult.aiGeneratedPercentage || 0;
    const vulns = this.activeResult.securityVulnerabilities?.length || 0;
    return Math.min(90, Math.round(15 + (aiPct * 0.3) + (vulns * 5)));
  }

  calcWastedFTE(): string {
    const hours = parseInt(this.calcWastedHours().replace(/,/g, ''));
    return (hours / (this.devMonths * 160)).toFixed(1);
  }

  calcDelayMonths(): string {
    const fixHours = parseInt(this.calcFixHours().replace(/,/g, ''));
    const monthlyCapacity = this.teamSize * 160;
    return Math.max(0.5, fixHours / monthlyCapacity).toFixed(1);
  }

  getPmBrutalTruth(): string {
    if (!this.activeResult) return '';
    const rate = this.hourlyRate || 85;
    const wastedEur = parseInt(this.calcWastedEur().replace(/,/g, ''));
    const fixCost = parseInt(this.calcFixCost().replace(/,/g, ''));
    const aiPct = this.activeResult.aiGeneratedPercentage || 0;
    const verdict = this.activeResult.overallVerdict;

    if (this.lang.currentLang === 'et') {
      if (verdict === 'CRITICAL_RISK') return `See koodibaas on \u00E4riline katastroof. Teie ${this.teamSize}-liikmeline meeskond on raisanud hinnanguliselt \u20AC${wastedEur.toLocaleString()} vigase koodi hooldusel. Paranduseks kulub \u20AC${fixCost.toLocaleString()} (hinnaga \u20AC${rate}/h). ${aiPct}% AI-genereeritud kood t\u00E4hendab, et keegi teie meeskonnas ei m\u00F5ista t\u00E4ielikult, mida see kood teeb. Te ei saa seda auditeerida, te ei saa seda kindlustada, te ei saa seda regulaatorile seletada.`;
      if (verdict === 'HIGH_RISK') return `K\u00F5rge risk: \u20AC${wastedEur.toLocaleString()} raisatud, \u20AC${fixCost.toLocaleString()} parandamiseks. Iga kuu, mil te ei paranda, kasvab kahju \u20AC${Math.round(wastedEur / this.devMonths).toLocaleString()} v\u00F5rra. Mida kauem ootate, seda kallimaks l\u00E4heb.`;
      return `M\u00F5\u00F5dukas risk, aga iga \u20AC${rate} tunnihind korrutub vigade arvuga. Praegu: \u20AC${fixCost.toLocaleString()} parandamiseks. 6 kuu p\u00E4rast: \u20AC${Math.round(fixCost * 2.5).toLocaleString()}.`;
    }
    if (verdict === 'CRITICAL_RISK') return `This codebase is a business catastrophe. Your ${this.teamSize}-person team has wasted an estimated \u20AC${wastedEur.toLocaleString()} maintaining broken code. Fixing it will cost \u20AC${fixCost.toLocaleString()} (at \u20AC${rate}/h). ${aiPct}% AI-generated code means nobody on your team fully understands what this code does. You can't audit it, you can't insure it, you can't explain it to a regulator.`;
    if (verdict === 'HIGH_RISK') return `High risk: \u20AC${wastedEur.toLocaleString()} wasted, \u20AC${fixCost.toLocaleString()} to fix. Every month you delay adds \u20AC${Math.round(wastedEur / this.devMonths).toLocaleString()} in compounding damage. The longer you wait, the more expensive it gets.`;
    return `Moderate risk, but every \u20AC${rate}/h compounds with bug count. Current fix: \u20AC${fixCost.toLocaleString()}. In 6 months: \u20AC${Math.round(fixCost * 2.5).toLocaleString()}.`;
  }
}
