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
        <div class="glass-card p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5">{{ lang.t('code.company') }}</label>
              <input type="text" [(ngModel)]="companyName"
                     class="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-slate-100
                            focus:border-red-400 focus:ring-1 focus:ring-red-400/20 focus:outline-none transition-all"
                     [placeholder]="lang.currentLang === 'et' ? 'OÜ Näidis' : 'Example Ltd'">
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
  selectedFiles: File[] = [];
  dragOver = false;
  analyzing = false;
  currentIteration = 1;
  iterations: AnalysisResult[] = [];
  activeIteration = 0;

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
}
