import { Component, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { LangService } from '../lang.service';
import { ApiService } from '../api.service';
import { forkJoin } from 'rxjs';

type ReportTemplate = 'full' | 'executive' | 'dashboard';

interface PillarScore {
  key: string;
  nameEn: string;
  nameEt: string;
  score: number;
  articleRef: string;
}

@Component({
  selector: 'app-board-report-generator',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="max-w-7xl mx-auto space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          {{ lang.t('boardrep.board_report') }}
        </div>
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
          {{ lang.t('boardrep.dora_board_report_generator') }}
        </h1>
        <p class="text-slate-400 max-w-2xl mx-auto">
          {{ lang.t('boardrep.generate_a_professional_boardready_compl') }}
        </p>
      </div>

      <!-- Auto-fill Banner -->
      <div class="bg-gradient-to-r from-cyan-500/10 via-emerald-500/10 to-cyan-500/10 border border-cyan-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4">
        <div class="flex-1 text-center sm:text-left">
          <h3 class="text-white font-semibold mb-1">{{ lang.t('boardrep.autofill_title') }}</h3>
          <p class="text-sm text-slate-400">{{ lang.t('boardrep.autofill_desc') }}</p>
        </div>
        <button (click)="autoFillFromPlatform()"
                [disabled]="autoFillLoading()"
                class="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap"
                [class]="autoFillLoading()
                  ? 'bg-slate-700 text-slate-400 cursor-wait'
                  : autoFilled()
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                    : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-400 hover:to-emerald-400 shadow-lg shadow-cyan-500/25'">
          @if (autoFillLoading()) {
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            {{ lang.t('boardrep.autofill_loading') }}
          } @else if (autoFilled()) {
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ lang.t('boardrep.autofill_done') }}
          } @else {
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {{ lang.t('boardrep.autofill_btn') }}
          }
        </button>
      </div>

      <!-- Template Selector -->
      <div class="flex flex-wrap justify-center gap-3">
        @for (tmpl of templates; track tmpl.key) {
        <button (click)="selectedTemplate = tmpl.key"
                class="px-5 py-2.5 rounded-xl text-sm font-medium transition-all border"
                [class]="selectedTemplate === tmpl.key
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600/50 hover:text-slate-300'">
          {{ lang.l(tmpl.nameEt, tmpl.nameEn) }}
        </button>
        }
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- LEFT: Input Section -->
        <div class="space-y-6">
          <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
            <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              {{ lang.t('boardrep.company_data') }}
            </h2>

            <div class="space-y-4">
              <!-- Company Name -->
              <div>
                <label class="block text-sm text-slate-400 mb-1.5">{{ lang.t('boardrep.company_name') }}</label>
                <input type="text" [(ngModel)]="companyName"
                       [placeholder]="lang.t('boardrep.enter_company_name')"
                       class="w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500
                              focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25 transition-all">
              </div>

              <!-- Report Period -->
              <div>
                <label class="block text-sm text-slate-400 mb-1.5">{{ lang.t('boardrep.report_period') }}</label>
                <select [(ngModel)]="reportPeriod"
                        class="w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white
                               focus:outline-none focus:border-cyan-500/50 transition-all">
                  <option value="Q1 2026">Q1 2026</option>
                  <option value="Q2 2026">Q2 2026</option>
                  <option value="Q3 2026">Q3 2026</option>
                  <option value="Q4 2026">Q4 2026</option>
                  <option value="Q1 2025">Q1 2025</option>
                  <option value="Q2 2025">Q2 2025</option>
                  <option value="Q3 2025">Q3 2025</option>
                  <option value="Q4 2025">Q4 2025</option>
                </select>
              </div>

              <!-- Overall Compliance Score -->
              <div>
                <label class="block text-sm text-slate-400 mb-1.5">
                  {{ lang.t('boardrep.overall_compliance_score') }}:
                  <span class="font-bold" [class]="getScoreColor(overallScore)">{{ overallScore }}%</span>
                </label>
                <input type="range" [(ngModel)]="overallScore" min="0" max="100" step="1"
                       class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500">
              </div>
            </div>
          </div>

          <!-- Pillar Scores -->
          <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
            <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              {{ lang.t('boardrep.dora_pillars') }}
            </h2>

            <div class="space-y-4">
              @for (pillar of pillarScores; track pillar.key) {
              <div>
                <label class="block text-sm text-slate-400 mb-1.5">
                  {{ lang.l(pillar.nameEt, pillar.nameEn) }}
                  <span class="text-xs text-slate-500 ml-1">({{ pillar.articleRef }})</span>
                  <span class="float-right font-bold" [class]="getScoreColor(pillar.score)">{{ pillar.score }}%</span>
                </label>
                <input type="range" [(ngModel)]="pillar.score" min="0" max="100" step="1"
                       class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500">
              </div>
              }
            </div>
          </div>

          <!-- Key Risks & Actions -->
          <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
            <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              {{ lang.t('boardrep.risks_actions') }}
            </h2>

            <div class="space-y-4">
              <!-- Key Risks -->
              <div>
                <label class="block text-sm text-slate-400 mb-1.5">
                  {{ lang.t('boardrep.key_risks_comma_separated') }}
                </label>
                <textarea [(ngModel)]="keyRisks" rows="3"
                          [placeholder]="lang.t('boardrep.eg_thirdparty_concentration_risk_legacy')"
                          class="w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500
                                 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25 transition-all resize-none"></textarea>
              </div>

              <!-- Completed Actions -->
              <div>
                <label class="block text-sm text-slate-400 mb-1.5">
                  {{ lang.t('boardrep.completed_actions_this_period') }}
                </label>
                <textarea [(ngModel)]="completedActions" rows="3"
                          [placeholder]="lang.t('boardrep.one_action_per_line')"
                          class="w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500
                                 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25 transition-all resize-none"></textarea>
              </div>

              <!-- Planned Actions -->
              <div>
                <label class="block text-sm text-slate-400 mb-1.5">
                  {{ lang.t('boardrep.planned_actions_next_period') }}
                </label>
                <textarea [(ngModel)]="plannedActions" rows="3"
                          [placeholder]="lang.t('boardrep.one_action_per_line_51')"
                          class="w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500
                                 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25 transition-all resize-none"></textarea>
              </div>
            </div>
          </div>

          <!-- Key Metrics -->
          <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
            <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
              </svg>
              {{ lang.t('boardrep.key_metrics') }}
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm text-slate-400 mb-1.5">{{ lang.t('boardrep.open_incidents') }}</label>
                <input type="number" [(ngModel)]="openIncidents" min="0"
                       class="w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white
                              focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25 transition-all">
              </div>
              <div>
                <label class="block text-sm text-slate-400 mb-1.5">{{ lang.t('boardrep.thirdparty_providers') }}</label>
                <input type="number" [(ngModel)]="thirdPartyCount" min="0"
                       class="w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white
                              focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25 transition-all">
              </div>
              <div>
                <label class="block text-sm text-slate-400 mb-1.5">
                  {{ lang.t('boardrep.budget_utilization') }}:
                  <span class="font-bold text-cyan-400">{{ budgetUtilization }}%</span>
                </label>
                <input type="range" [(ngModel)]="budgetUtilization" min="0" max="100" step="1"
                       class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500">
              </div>
            </div>
          </div>

          <!-- Sign-off -->
          <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
            <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
              </svg>
              {{ lang.t('boardrep.signoff') }}
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-slate-400 mb-1.5">{{ lang.t('boardrep.prepared_by') }}</label>
                <input type="text" [(ngModel)]="preparedBy"
                       class="w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500
                              focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25 transition-all">
              </div>
              <div>
                <label class="block text-sm text-slate-400 mb-1.5">{{ lang.t('boardrep.approved_by') }}</label>
                <input type="text" [(ngModel)]="approvedBy"
                       class="w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500
                              focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25 transition-all">
              </div>
              <div>
                <label class="block text-sm text-slate-400 mb-1.5">{{ lang.t('boardrep.date') }}</label>
                <input type="date" [(ngModel)]="reportDate"
                       class="w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white
                              focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25 transition-all">
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Live Preview -->
        <div class="space-y-4">
          <div class="sticky top-4">
            <!-- Export Buttons (consolidated) -->
            <div class="flex items-center gap-2 mb-4">
              <!-- Primary: Download dropdown -->
              <div class="relative">
                <button (click)="exportMenuOpen = !exportMenuOpen"
                        class="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 text-sm font-semibold hover:from-emerald-400 hover:to-cyan-400 transition-all">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  {{ lang.l('Laadi alla', 'Download') }}
                  <svg class="w-3.5 h-3.5 transition-transform" [class.rotate-180]="exportMenuOpen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </button>
                @if (exportMenuOpen) {
                <div class="absolute left-0 top-full mt-1 w-56 bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl shadow-black/20 py-2 z-50">
                  <button (click)="exportAsPdf(); exportMenuOpen = false" [disabled]="pdfExporting()"
                          class="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-red-400 hover:bg-slate-700/30 transition-colors">
                    <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                    {{ lang.t('boardrep.download_pdf') }}
                  </button>
                  <button (click)="exportAsText(); exportMenuOpen = false"
                          class="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-emerald-400 hover:bg-slate-700/30 transition-colors">
                    <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    {{ lang.t('boardrep.download_txt') }}
                  </button>
                  <div class="border-t border-slate-700/30 my-1.5"></div>
                  <button (click)="exportBoardPackagePdf(); exportMenuOpen = false" [disabled]="packageExporting()"
                          class="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-violet-400 hover:bg-slate-700/30 transition-colors">
                    <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    {{ lang.t('boardrep.gen_pdf') }}
                  </button>
                </div>
                }
              </div>
              <!-- Icon buttons: Copy & Print -->
              <button (click)="copyToClipboard()" [title]="lang.t('boardrep.copy_to_clipboard')"
                      class="w-9 h-9 rounded-lg flex items-center justify-center border transition-all"
                      [class]="copied ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-slate-700/50 border-slate-600/50 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30'">
                @if (copied) {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                } @else {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                }
              </button>
              <button (click)="printReport()" [title]="lang.t('boardrep.print')"
                      class="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:text-slate-300 hover:bg-slate-700 transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              </button>
            </div>

            <!-- Live Report Preview -->
            <div id="report-preview" class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6 space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto print:max-h-none print:overflow-visible print:bg-white print:text-black print:border-none">

              <!-- Report Header -->
              <div class="text-center border-b border-slate-700/50 pb-6 print:border-gray-300">
                <div class="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mb-3">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </div>
                <h2 class="text-xl font-bold text-white print:text-black">
                  {{ companyName || lang.t('boardrep.company_name_47') }}
                </h2>
                <h3 class="text-lg font-semibold text-emerald-400 print:text-emerald-700 mt-1">
                  {{ lang.t('boardrep.dora_compliance_report') }}
                </h3>
                <p class="text-sm text-slate-400 print:text-gray-500 mt-1">{{ reportPeriod }}</p>
                <div class="inline-block mt-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium print:bg-red-50 print:border-red-200 print:text-red-600">
                  {{ lang.t('boardrep.confidential') }}
                </div>
              </div>

              <!-- Executive Summary -->
              <div class="space-y-2">
                <h4 class="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                  {{ lang.t('boardrep.executive_summary') }}
                </h4>
                <p class="text-sm text-slate-300 print:text-gray-700 leading-relaxed">
                  {{ getExecutiveSummary() }}
                </p>
              </div>

              <!-- Overall Score -->
              @if (selectedTemplate !== 'dashboard') {
              <div class="text-center py-4">
                <div class="text-sm text-slate-400 mb-2">
                  {{ lang.t('boardrep.overall_compliance_score_25') }}
                </div>
                <div class="text-6xl font-black mb-1" [class]="getScoreColor(overallScore)">
                  {{ overallScore }}%
                </div>
                <div class="text-sm" [class]="getScoreColor(overallScore)">
                  {{ getScoreLabel(overallScore) }}
                </div>
              </div>
              }

              <!-- Pillar Dashboard -->
              <div class="space-y-3">
                <h4 class="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                  {{ lang.t('boardrep.dora_pillar_dashboard') }}
                </h4>
                <div class="space-y-2.5">
                  @for (pillar of pillarScores; track pillar.key) {
                  <div class="space-y-1">
                    <div class="flex justify-between items-center text-xs">
                      <span class="text-slate-300 print:text-gray-700">{{ lang.l(pillar.nameEt, pillar.nameEn) }}</span>
                      <span class="font-bold" [class]="getScoreColor(pillar.score)">{{ pillar.score }}%</span>
                    </div>
                    <div class="h-3 bg-slate-700/50 rounded-full overflow-hidden print:bg-gray-200">
                      <div class="h-full rounded-full transition-all duration-500"
                           [style.width.%]="pillar.score"
                           [class]="pillar.score >= 75 ? 'bg-emerald-500' : pillar.score >= 50 ? 'bg-amber-500' : 'bg-red-500'"></div>
                    </div>
                  </div>
                  }
                </div>
              </div>

              <!-- Risk Heat Map Summary (only for full and dashboard) -->
              @if (selectedTemplate !== 'executive') {
              <div class="space-y-3">
                <h4 class="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                  {{ lang.t('boardrep.risk_heat_map_summary') }}
                </h4>
                <div class="grid grid-cols-2 gap-2">
                  <div class="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-center">
                    <div class="text-xs text-red-400 font-medium mb-1">
                      {{ lang.t('boardrep.high_prob_high_impact') }}
                    </div>
                    <div class="text-lg font-bold text-red-400">{{ getHighHighRisks() }}</div>
                  </div>
                  <div class="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3 text-center">
                    <div class="text-xs text-amber-400 font-medium mb-1">
                      {{ lang.t('boardrep.high_prob_low_impact') }}
                    </div>
                    <div class="text-lg font-bold text-amber-400">{{ getHighLowRisks() }}</div>
                  </div>
                  <div class="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3 text-center">
                    <div class="text-xs text-amber-400 font-medium mb-1">
                      {{ lang.t('boardrep.low_prob_high_impact') }}
                    </div>
                    <div class="text-lg font-bold text-amber-400">{{ getLowHighRisks() }}</div>
                  </div>
                  <div class="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-3 text-center">
                    <div class="text-xs text-emerald-400 font-medium mb-1">
                      {{ lang.t('boardrep.low_prob_low_impact') }}
                    </div>
                    <div class="text-lg font-bold text-emerald-400">{{ getLowLowRisks() }}</div>
                  </div>
                </div>
              </div>
              }

              <!-- Key Metrics Cards -->
              <div class="grid grid-cols-3 gap-3">
                <div class="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-center print:bg-gray-50 print:border-gray-200">
                  <div class="text-xs text-slate-400 mb-1">{{ lang.t('boardrep.open_incidents_32') }}</div>
                  <div class="text-2xl font-bold" [class]="openIncidents > 5 ? 'text-red-400' : openIncidents > 0 ? 'text-amber-400' : 'text-emerald-400'">
                    {{ openIncidents }}
                  </div>
                </div>
                <div class="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-center print:bg-gray-50 print:border-gray-200">
                  <div class="text-xs text-slate-400 mb-1">{{ lang.t('boardrep.ict_providers') }}</div>
                  <div class="text-2xl font-bold text-cyan-400">{{ thirdPartyCount }}</div>
                </div>
                <div class="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-center print:bg-gray-50 print:border-gray-200">
                  <div class="text-xs text-slate-400 mb-1">{{ lang.t('boardrep.budget') }}</div>
                  <div class="text-2xl font-bold" [class]="budgetUtilization > 90 ? 'text-red-400' : budgetUtilization > 70 ? 'text-amber-400' : 'text-emerald-400'">
                    {{ budgetUtilization }}%
                  </div>
                </div>
              </div>

              <!-- Completed Actions (not for executive) -->
              @if (selectedTemplate !== 'executive' && getCompletedActionsList().length > 0) {
              <div class="space-y-2">
                <h4 class="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                  {{ lang.t('boardrep.completed_actions') }}
                </h4>
                <ul class="space-y-1.5">
                  @for (action of getCompletedActionsList(); track action) {
                  <li class="flex items-start gap-2 text-sm text-slate-300 print:text-gray-700">
                    <svg class="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    {{ action }}
                  </li>
                  }
                </ul>
              </div>
              }

              <!-- Planned Actions (not for executive) -->
              @if (selectedTemplate !== 'executive' && getPlannedActionsList().length > 0) {
              <div class="space-y-2">
                <h4 class="text-sm font-bold text-cyan-400 uppercase tracking-wider">
                  {{ lang.t('boardrep.planned_actions') }}
                </h4>
                <ul class="space-y-1.5">
                  @for (action of getPlannedActionsList(); track $index; let i = $index) {
                  <li class="flex items-start gap-2 text-sm text-slate-300 print:text-gray-700">
                    <span class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                          [class]="i === 0 ? 'bg-red-500/20 text-red-400' : i === 1 ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'">
                      {{ i + 1 }}
                    </span>
                    {{ action }}
                  </li>
                  }
                </ul>
              </div>
              }

              <!-- Auto-Generated Recommendations -->
              @if (getRecommendations().length > 0) {
              <div class="space-y-2">
                <h4 class="text-sm font-bold text-amber-400 uppercase tracking-wider">
                  {{ lang.t('boardrep.recommendations') }}
                </h4>
                @for (rec of getRecommendations(); track $index; let i = $index) {
                <div class="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 print:bg-gray-50 print:border-gray-200">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                    {{ i + 1 }}
                  </span>
                  <p class="text-sm text-slate-300 print:text-gray-700">{{ rec }}</p>
                </div>
                }
              </div>
              }

              <!-- Regulatory Timeline (only for full report) -->
              @if (selectedTemplate === 'full') {
              <div class="space-y-2">
                <h4 class="text-sm font-bold text-cyan-400 uppercase tracking-wider">
                  {{ lang.t('boardrep.regulatory_timeline') }}
                </h4>
                <div class="space-y-2">
                  @for (deadline of getUpcomingDeadlines(); track deadline.date) {
                  <div class="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 print:bg-gray-50 print:border-gray-200">
                    <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                    </div>
                    <div>
                      <div class="text-sm font-medium text-white print:text-black">{{ deadline.date }}</div>
                      <div class="text-xs text-slate-400 print:text-gray-500">
                        {{ lang.l(deadline.descEt, deadline.descEn) }}
                      </div>
                    </div>
                  </div>
                  }
                </div>
              </div>
              }

              <!-- Key Risks (only for full report) -->
              @if (selectedTemplate === 'full' && getRisksList().length > 0) {
              <div class="space-y-2">
                <h4 class="text-sm font-bold text-red-400 uppercase tracking-wider">
                  {{ lang.t('boardrep.key_risks') }}
                </h4>
                <ul class="space-y-1.5">
                  @for (risk of getRisksList(); track risk) {
                  <li class="flex items-start gap-2 text-sm text-slate-300 print:text-gray-700">
                    <svg class="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    {{ risk }}
                  </li>
                  }
                </ul>
              </div>
              }

              <!-- Sign-off Section (not for dashboard) -->
              @if (selectedTemplate !== 'dashboard') {
              <div class="border-t border-slate-700/50 pt-4 mt-6 print:border-gray-300">
                <h4 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                  {{ lang.t('boardrep.signoff_40') }}
                </h4>
                <div class="grid grid-cols-2 gap-6">
                  <div>
                    <div class="text-xs text-slate-500 mb-1">{{ lang.t('boardrep.prepared_by_41') }}</div>
                    <div class="text-sm text-white print:text-black font-medium border-b border-slate-700/50 pb-2 print:border-gray-300">
                      {{ preparedBy || '________________________' }}
                    </div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-500 mb-1">{{ lang.t('boardrep.approved_by_42') }}</div>
                    <div class="text-sm text-white print:text-black font-medium border-b border-slate-700/50 pb-2 print:border-gray-300">
                      {{ approvedBy || '________________________' }}
                    </div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-500 mb-1">{{ lang.t('boardrep.date_43') }}</div>
                    <div class="text-sm text-white print:text-black font-medium border-b border-slate-700/50 pb-2 print:border-gray-300">
                      {{ reportDate || '________________________' }}
                    </div>
                  </div>
                </div>
              </div>
              }

            </div>
          </div>
        </div>
      </div>

      <!-- Back Link -->
      <div class="text-center pt-4">
        <a routerLink="/dashboard"
           class="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          {{ lang.t('boardrep.back_to_dashboard') }}
        </a>
      </div>
    </div>
  `,
  styles: [`
    @media print {
      :host {
        display: block;
        background: white !important;
      }
      :host ::ng-deep .print\\:max-h-none { max-height: none !important; }
      :host ::ng-deep .print\\:overflow-visible { overflow: visible !important; }
      :host ::ng-deep .print\\:bg-white { background-color: white !important; }
      :host ::ng-deep .print\\:text-black { color: black !important; }
      :host ::ng-deep .print\\:border-none { border: none !important; }
      :host ::ng-deep .print\\:border-gray-300 { border-color: #d1d5db !important; }
      :host ::ng-deep .print\\:text-gray-500 { color: #6b7280 !important; }
      :host ::ng-deep .print\\:text-gray-700 { color: #374151 !important; }
      :host ::ng-deep .print\\:bg-gray-50 { background-color: #f9fafb !important; }
      :host ::ng-deep .print\\:border-gray-200 { border-color: #e5e7eb !important; }
      :host ::ng-deep .print\\:bg-red-50 { background-color: #fef2f2 !important; }
      :host ::ng-deep .print\\:border-red-200 { border-color: #fecaca !important; }
      :host ::ng-deep .print\\:text-red-600 { color: #dc2626 !important; }
      :host ::ng-deep .print\\:text-emerald-700 { color: #047857 !important; }
    }

    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #10b981;
      cursor: pointer;
    }
    input[type="range"]::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #10b981;
      cursor: pointer;
      border: none;
    }
  `]
})
export class BoardReportGeneratorComponent {
  public lang: LangService;
  private api: ApiService;

  // Template selection
  selectedTemplate: ReportTemplate = 'full';
  templates = [
    { key: 'full' as ReportTemplate, nameEn: 'Full Board Report', nameEt: 'Täielik juhatuse aruanne' },
    { key: 'executive' as ReportTemplate, nameEn: 'Executive Summary Only', nameEt: 'Ainult juhtimisulevade' },
    { key: 'dashboard' as ReportTemplate, nameEn: 'Compliance Dashboard', nameEt: 'Vastavuse töölaup' }
  ];

  // Company data
  companyName = '';
  reportPeriod = 'Q1 2026';
  overallScore = 68;

  // Pillar scores
  pillarScores: PillarScore[] = [
    { key: 'ict_risk', nameEn: 'ICT Risk Management', nameEt: 'IKT riskihaldus', score: 72, articleRef: 'Art. 5-16' },
    { key: 'incident', nameEn: 'Incident Management', nameEt: 'Intsidentide haldus', score: 65, articleRef: 'Art. 17-23' },
    { key: 'testing', nameEn: 'Resilience Testing', nameEt: 'Vastupidavuse testimine', score: 55, articleRef: 'Art. 24-27' },
    { key: 'third_party', nameEn: 'Third-Party Risk', nameEt: 'Kolmandate osapoolte risk', score: 60, articleRef: 'Art. 28-44' },
    { key: 'info_sharing', nameEn: 'Information Sharing', nameEt: 'Teabe jagamine', score: 48, articleRef: 'Art. 45' }
  ];

  // Risks and actions
  keyRisks = '';
  completedActions = '';
  plannedActions = '';

  // Key metrics
  openIncidents = 3;
  thirdPartyCount = 12;
  budgetUtilization = 65;

  // Sign-off
  preparedBy = '';
  approvedBy = '';
  reportDate = '';

  // UI state
  copied = false;
  exportMenuOpen = false;
  autoFillLoading = signal(false);
  autoFilled = signal(false);
  pdfExporting = signal(false);
  packageExporting = signal(false);

  // Auto-fill data for PDF enrichment
  private auditData: any = null;
  private incidentStats: any = null;
  private remediationStats: any = null;
  private evidenceStats: any = null;
  private evidenceCoverage: any = null;

  constructor(langService: LangService, apiService: ApiService) {
    this.lang = langService;
    this.api = apiService;
  }

  autoFillFromPlatform(): void {
    this.autoFillLoading.set(true);
    this.autoFilled.set(false);

    forkJoin({
      audit: this.api.getAuditReadiness(),
      incidents: this.api.getIncidentStats(),
      remediation: this.api.getRemediationStats(),
      evidence: this.api.getEvidenceStats(),
      coverage: this.api.getEvidenceCoverage(),
      providers: this.api.getIctProviderStats()
    }).subscribe({
      next: (data) => {
        this.auditData = data.audit;
        this.incidentStats = data.incidents;
        this.remediationStats = data.remediation;
        this.evidenceStats = data.evidence;
        this.evidenceCoverage = data.coverage;

        // Fill overall score from audit readiness
        if (data.audit?.overallScore != null) {
          this.overallScore = Math.round(data.audit.overallScore);
        }

        // Fill pillar scores from audit readiness
        if (data.audit?.pillars) {
          const pillarMap: { [key: string]: string } = {
            ICT_RISK_MANAGEMENT: 'ict_risk',
            INCIDENT_MANAGEMENT: 'incident',
            TESTING: 'testing',
            THIRD_PARTY: 'third_party',
            INFORMATION_SHARING: 'info_sharing'
          };
          for (const [apiKey, localKey] of Object.entries(pillarMap)) {
            const pillarData = data.audit.pillars[apiKey];
            const pillar = this.pillarScores.find(p => p.key === localKey);
            if (pillar && pillarData?.score != null) {
              pillar.score = Math.round(pillarData.score);
            }
          }
        }

        // Fill incidents
        if (data.incidents) {
          this.openIncidents = data.incidents.open || 0;
        }

        // Fill third-party count
        if (data.providers) {
          this.thirdPartyCount = data.providers.total || 0;
        }

        // Auto-generate risks from audit actions
        if (data.audit?.actions?.length) {
          const risks = data.audit.actions
            .filter((a: any) => a.priority === 'CRITICAL' || a.priority === 'HIGH')
            .map((a: any) => a.action)
            .slice(0, 5);
          if (risks.length) this.keyRisks = risks.join(', ');
        }

        // Auto-generate planned actions from audit actions
        if (data.audit?.actions?.length) {
          const planned = data.audit.actions
            .map((a: any) => `[${a.priority}] ${a.action} (${a.module})`)
            .slice(0, 5);
          if (planned.length) this.plannedActions = planned.join('\n');
        }

        // Auto-generate completed actions from remediation
        if (data.remediation?.completed > 0) {
          const completedItems: string[] = [];
          completedItems.push(`${data.remediation.completed} remediation items completed`);
          if (data.evidence?.verified > 0) {
            completedItems.push(`${data.evidence.verified} evidence documents verified`);
          }
          if (data.incidents?.closed > 0) {
            completedItems.push(`${data.incidents.closed} incidents resolved`);
          }
          this.completedActions = completedItems.join('\n');
        }

        // Set report date to today
        this.reportDate = new Date().toISOString().split('T')[0];

        // Determine report period
        const now = new Date();
        const q = Math.ceil((now.getMonth() + 1) / 3);
        this.reportPeriod = `Q${q} ${now.getFullYear()}`;

        this.autoFillLoading.set(false);
        this.autoFilled.set(true);
      },
      error: () => {
        this.autoFillLoading.set(false);
      }
    });
  }

  async exportAsPdf(): Promise<void> {
    this.pdfExporting.set(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      let y = 20;

      // Brand colors
      const emerald = [16, 185, 129] as [number, number, number];
      const darkBg = [15, 23, 42] as [number, number, number];

      // Header bar
      doc.setFillColor(...emerald);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text('DORA Compliance Report', margin, 18);
      doc.setFontSize(11);
      doc.text(this.companyName || 'Company Name', margin, 27);
      doc.setFontSize(9);
      doc.text(`${this.reportPeriod}  |  CONFIDENTIAL`, margin, 34);
      y = 50;

      // Executive Summary
      doc.setFontSize(14);
      doc.setTextColor(...emerald);
      doc.text('Executive Summary', margin, y);
      y += 7;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const summaryLines = doc.splitTextToSize(this.getExecutiveSummary(), pageWidth - 2 * margin);
      doc.text(summaryLines, margin, y);
      y += summaryLines.length * 5 + 8;

      // Overall Score Box
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 28, 3, 3, 'F');
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Overall Compliance Score', margin + 10, y + 10);
      doc.setFontSize(28);
      const sc = this.overallScore;
      doc.setTextColor(sc >= 75 ? 16 : sc >= 50 ? 217 : 239, sc >= 75 ? 185 : sc >= 50 ? 119 : 68, sc >= 75 ? 129 : sc >= 50 ? 6 : 68);
      doc.text(`${this.overallScore}%`, margin + 10, y + 23);
      doc.setFontSize(12);
      doc.text(this.getScoreLabel(this.overallScore), margin + 50, y + 23);
      y += 36;

      // Pillar Scores Table
      doc.setFontSize(14);
      doc.setTextColor(...emerald);
      doc.text('DORA Pillar Scores', margin, y);
      y += 3;

      const pillarRows = this.pillarScores.map(p => [
        this.lang.l(p.nameEt, p.nameEn),
        p.articleRef,
        `${p.score}%`,
        p.score >= 75 ? 'Good' : p.score >= 50 ? 'Progressing' : 'At Risk'
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Pillar', 'Articles', 'Score', 'Status']],
        body: pillarRows,
        theme: 'striped',
        headStyles: { fillColor: emerald, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          2: { halign: 'center', fontStyle: 'bold' },
          3: { halign: 'center' }
        },
        margin: { left: margin, right: margin }
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      // Key Metrics
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setTextColor(...emerald);
      doc.text('Key Metrics', margin, y);
      y += 3;

      autoTable(doc, {
        startY: y,
        head: [['Metric', 'Value']],
        body: [
          ['Open Incidents', String(this.openIncidents)],
          ['ICT Third-Party Providers', String(this.thirdPartyCount)],
          ['Budget Utilization', `${this.budgetUtilization}%`]
        ],
        theme: 'striped',
        headStyles: { fillColor: emerald, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        margin: { left: margin, right: margin }
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      // Risk Heat Map
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setTextColor(...emerald);
      doc.text('Risk Heat Map', margin, y);
      y += 3;

      autoTable(doc, {
        startY: y,
        head: [['', 'High Impact', 'Low Impact']],
        body: [
          ['High Probability', String(this.getHighHighRisks()), String(this.getHighLowRisks())],
          ['Low Probability', String(this.getLowHighRisks()), String(this.getLowLowRisks())]
        ],
        theme: 'grid',
        headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255], fontSize: 9, halign: 'center' },
        bodyStyles: { fontSize: 9, halign: 'center' },
        margin: { left: margin, right: margin }
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      // Key Risks
      const risks = this.getRisksList();
      if (risks.length > 0) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setTextColor(239, 68, 68);
        doc.text('Key Risks', margin, y);
        y += 7;
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        for (const risk of risks) {
          doc.text(`•  ${risk}`, margin + 4, y);
          y += 5;
        }
        y += 5;
      }

      // Recommendations
      const recs = this.getRecommendations();
      if (recs.length > 0) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setTextColor(217, 119, 6);
        doc.text('Recommendations', margin, y);
        y += 7;
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        for (let i = 0; i < recs.length; i++) {
          const recLines = doc.splitTextToSize(`${i + 1}. ${recs[i]}`, pageWidth - 2 * margin - 4);
          doc.text(recLines, margin + 4, y);
          y += recLines.length * 5 + 2;
        }
        y += 5;
      }

      // Completed Actions
      const completed = this.getCompletedActionsList();
      if (completed.length > 0) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setTextColor(...emerald);
        doc.text('Completed Actions', margin, y);
        y += 7;
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        for (const action of completed) {
          doc.text(`✓  ${action}`, margin + 4, y);
          y += 5;
        }
        y += 5;
      }

      // Planned Actions
      const planned = this.getPlannedActionsList();
      if (planned.length > 0) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setTextColor(6, 182, 212);
        doc.text('Planned Actions', margin, y);
        y += 7;
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        for (let i = 0; i < planned.length; i++) {
          const pLines = doc.splitTextToSize(`${i + 1}. ${planned[i]}`, pageWidth - 2 * margin - 4);
          doc.text(pLines, margin + 4, y);
          y += pLines.length * 5 + 2;
        }
        y += 5;
      }

      // Sign-off
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
      doc.setFontSize(12);
      doc.setTextColor(...emerald);
      doc.text('Sign-off', margin, y);
      y += 8;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Prepared by:   ${this.preparedBy || '________________________'}`, margin, y); y += 6;
      doc.text(`Approved by:   ${this.approvedBy || '________________________'}`, margin, y); y += 6;
      doc.text(`Date:          ${this.reportDate || '________________________'}`, margin, y); y += 10;

      // Footer on all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(`DORA Compliance Report  |  ${this.companyName || 'Company'}  |  ${this.reportPeriod}  |  CONFIDENTIAL`, margin, doc.internal.pageSize.getHeight() - 8);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, doc.internal.pageSize.getHeight() - 8);
      }

      // Save
      const filename = this.companyName
        ? `DORA_Board_Report_${this.companyName.replace(/\s+/g, '_')}_${this.reportPeriod.replace(/\s+/g, '_')}.pdf`
        : `DORA_Board_Report_${this.reportPeriod.replace(/\s+/g, '_')}.pdf`;
      doc.save(filename);
    } catch (e) {
      console.error('PDF export error:', e);
    } finally {
      this.pdfExporting.set(false);
    }
  }

  getScoreColor(score: number): string {
    if (score >= 75) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  }

  getScoreLabel(score: number): string {
    if (score >= 90) return this.lang.t('boardrep.score_label_strong');
    if (score >= 75) return this.lang.t('boardrep.score_label_good');
    if (score >= 50) return this.lang.t('boardrep.score_label_progressing');
    return this.lang.t('boardrep.score_label_urgent');
  }

  getExecutiveSummary(): string {
    const name = this.companyName || this.lang.t('boardrep.company_name_placeholder');
    const avg = this.getAveragePillarScore();
    const lowestPillar = this.getLowestPillar();
    const lowestName = this.lang.l(lowestPillar.nameEt, lowestPillar.nameEn);

    if (this.overallScore >= 90) {
      return `${name} ${this.lang.t('boardrep.summary_strong')} ${this.overallScore}${this.lang.t('boardrep.summary_strong_2')} ${avg}${this.lang.t('boardrep.summary_strong_3')}`;
    }
    if (this.overallScore >= 75) {
      return `${name} ${this.lang.t('boardrep.summary_good')} ${this.overallScore}${this.lang.t('boardrep.summary_good_2')} ${avg}${this.lang.t('boardrep.summary_good_3')} ${lowestName} (${lowestPillar.score}%), ${this.lang.t('boardrep.summary_good_4')}`;
    }
    if (this.overallScore >= 50) {
      return `${name} ${this.lang.t('boardrep.summary_progressing')} ${this.overallScore}${this.lang.t('boardrep.summary_progressing_2')} ${avg}%. ${lowestName} ${this.lang.t('boardrep.summary_progressing_3')} (${lowestPillar.score}%) ${this.lang.t('boardrep.summary_progressing_4')}`;
    }
    return `${name} ${this.lang.t('boardrep.summary_urgent')} ${this.overallScore}${this.lang.t('boardrep.summary_urgent_2')} ${avg}${this.lang.t('boardrep.summary_urgent_3')} ${lowestName} ${this.lang.t('boardrep.summary_urgent_4')} ${lowestPillar.score}${this.lang.t('boardrep.summary_urgent_5')}`;
  }

  getAveragePillarScore(): number {
    const sum = this.pillarScores.reduce((a, p) => a + p.score, 0);
    return Math.round(sum / this.pillarScores.length);
  }

  getLowestPillar(): PillarScore {
    return this.pillarScores.reduce((lowest, p) => p.score < lowest.score ? p : lowest, this.pillarScores[0]);
  }

  getRisksList(): string[] {
    return this.keyRisks.split(',').map(r => r.trim()).filter(r => r.length > 0);
  }

  getCompletedActionsList(): string[] {
    return this.completedActions.split('\n').map(a => a.trim()).filter(a => a.length > 0);
  }

  getPlannedActionsList(): string[] {
    return this.plannedActions.split('\n').map(a => a.trim()).filter(a => a.length > 0);
  }

  // Risk heat map based on pillar scores
  getHighHighRisks(): number {
    return this.pillarScores.filter(p => p.score < 40).length;
  }

  getHighLowRisks(): number {
    return this.pillarScores.filter(p => p.score >= 40 && p.score < 55).length;
  }

  getLowHighRisks(): number {
    return this.pillarScores.filter(p => p.score >= 55 && p.score < 70).length;
  }

  getLowLowRisks(): number {
    return this.pillarScores.filter(p => p.score >= 70).length;
  }

  getRecommendations(): string[] {
    const recs: string[] = [];

    const ictRisk = this.pillarScores.find(p => p.key === 'ict_risk');
    if (ictRisk && ictRisk.score < 60) {
      recs.push(this.lang.t('boardrep.rec_ict_risk_mgmt'));
    }

    const incident = this.pillarScores.find(p => p.key === 'incident');
    if (incident && incident.score < 60) {
      recs.push(this.lang.t('boardrep.rec_incident_mgmt'));
    }

    const testing = this.pillarScores.find(p => p.key === 'testing');
    if (testing && testing.score < 60) {
      recs.push(this.lang.t('boardrep.rec_testing_prog'));
    }

    const thirdParty = this.pillarScores.find(p => p.key === 'third_party');
    if (thirdParty && thirdParty.score < 60) {
      recs.push(this.lang.t('boardrep.rec_third_party_contracts'));
    }

    const infoSharing = this.pillarScores.find(p => p.key === 'info_sharing');
    if (infoSharing && infoSharing.score < 60) {
      recs.push(this.lang.t('boardrep.rec_info_sharing'));
    }

    // Additional general recommendations if we have fewer than 3
    if (recs.length < 3) {
      if (this.budgetUtilization > 85) {
        recs.push(this.lang.t('boardrep.rec_budget_high') + ' (' + this.budgetUtilization + '%)');
      }
      if (this.openIncidents > 5) {
        recs.push(this.lang.t('boardrep.rec_incidents_high') + ' (' + this.openIncidents + ')');
      }
      if (this.thirdPartyCount > 20) {
        recs.push(this.lang.t('boardrep.rec_third_party_count_high') + ' (' + this.thirdPartyCount + ')');
      }
    }

    return recs;
  }

  getUpcomingDeadlines(): { date: string; descEn: string; descEt: string }[] {
    return [
      {
        date: '2026-06-30',
        descEn: this.lang.t('boardrep.deadline_1_desc'),
        descEt: this.lang.t('boardrep.deadline_1_desc')
      },
      {
        date: '2026-09-30',
        descEn: this.lang.t('boardrep.deadline_2_desc'),
        descEt: this.lang.t('boardrep.deadline_2_desc')
      },
      {
        date: '2027-01-17',
        descEn: this.lang.t('boardrep.deadline_3_desc'),
        descEt: this.lang.t('boardrep.deadline_3_desc')
      }
    ];
  }

  generateReportText(): string {
    const t = (key: string) => this.lang.t(key);
    const sep = '═'.repeat(60);
    const line = '─'.repeat(60);
    const name = this.companyName || t('boardrep.company_name_placeholder');

    let text = '';
    text += sep + '\n';
    text += t('boardrep.report_title') + '\n';
    text += name.toUpperCase() + '\n';
    text += t('boardrep.report_period_label') + ' ' + this.reportPeriod + '\n';
    text += t('boardrep.report_confidential') + '\n';
    text += sep + '\n\n';

    // Executive summary
    text += t('boardrep.report_exec_summary') + '\n';
    text += line + '\n';
    text += this.getExecutiveSummary() + '\n\n';

    // Overall score
    text += t('boardrep.report_overall_score') + ' ' + this.overallScore + '%\n';
    text += t('boardrep.report_status') + ' ' + this.getScoreLabel(this.overallScore) + '\n\n';

    if (this.selectedTemplate === 'executive') {
      text += this.generateSignoff(line);
      return text;
    }

    // Pillar scores
    text += t('boardrep.report_pillars') + '\n';
    text += line + '\n';
    for (const pillar of this.pillarScores) {
      const pillarName = this.lang.l(pillar.nameEt, pillar.nameEn);
      const bar = this.generateBar(pillar.score);
      text += `  ${pillarName.padEnd(30)} ${bar} ${pillar.score}%\n`;
    }
    text += '\n';

    // Key metrics
    text += t('boardrep.report_metrics') + '\n';
    text += line + '\n';
    text += `  ${t('boardrep.report_open_incidents').padEnd(30)} ${this.openIncidents}\n`;
    text += `  ${t('boardrep.report_ict_providers').padEnd(30)} ${this.thirdPartyCount}\n`;
    text += `  ${t('boardrep.report_budget').padEnd(30)} ${this.budgetUtilization}%\n\n`;

    if (this.selectedTemplate === 'dashboard') {
      return text;
    }

    // Risk heat map
    text += t('boardrep.report_risk_heatmap') + '\n';
    text += line + '\n';
    text += `  ${t('boardrep.report_risk_hh')} ${this.getHighHighRisks()}  ${t('boardrep.report_risk_hl')} ${this.getHighLowRisks()}\n`;
    text += `  ${t('boardrep.report_risk_lh')} ${this.getLowHighRisks()}  ${t('boardrep.report_risk_ll')} ${this.getLowLowRisks()}\n\n`;

    // Key risks
    const risks = this.getRisksList();
    if (risks.length > 0) {
      text += t('boardrep.report_risks') + '\n';
      text += line + '\n';
      for (const risk of risks) {
        text += `  - ${risk}\n`;
      }
      text += '\n';
    }

    // Completed actions
    const completed = this.getCompletedActionsList();
    if (completed.length > 0) {
      text += t('boardrep.report_completed') + '\n';
      text += line + '\n';
      for (const action of completed) {
        text += `  [x] ${action}\n`;
      }
      text += '\n';
    }

    // Planned actions
    const planned = this.getPlannedActionsList();
    if (planned.length > 0) {
      text += t('boardrep.report_planned') + '\n';
      text += line + '\n';
      for (let i = 0; i < planned.length; i++) {
        const priority = i === 0 ? t('boardrep.report_priority_high') : i === 1 ? t('boardrep.report_priority_medium') : t('boardrep.report_priority_normal');
        text += `  ${priority} ${planned[i]}\n`;
      }
      text += '\n';
    }

    // Recommendations
    const recs = this.getRecommendations();
    if (recs.length > 0) {
      text += t('boardrep.report_recommendations') + '\n';
      text += line + '\n';
      for (let i = 0; i < recs.length; i++) {
        text += `  ${i + 1}. ${recs[i]}\n`;
      }
      text += '\n';
    }

    // Regulatory timeline
    const deadlines = this.getUpcomingDeadlines();
    text += t('boardrep.report_timeline') + '\n';
    text += line + '\n';
    for (const d of deadlines) {
      text += `  ${d.date} — ${d.descEn}\n`;
    }
    text += '\n';

    text += this.generateSignoff(line);
    return text;
  }

  private generateSignoff(line: string): string {
    const t = (key: string) => this.lang.t(key);
    let text = '';
    text += t('boardrep.report_signoff_title') + '\n';
    text += line + '\n';
    text += `  ${t('boardrep.report_prepared_by').padEnd(16)} ${this.preparedBy || '________________________'}\n`;
    text += `  ${t('boardrep.report_approved_by').padEnd(16)} ${this.approvedBy || '________________________'}\n`;
    text += `  ${t('boardrep.report_date').padEnd(16)} ${this.reportDate || '________________________'}\n`;
    text += '\n' + '═'.repeat(60) + '\n';
    text += t('boardrep.report_footer') + '\n';
    return text;
  }

  private generateBar(score: number): string {
    const filled = Math.round(score / 5);
    const empty = 20 - filled;
    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
  }

  exportAsText(): void {
    const text = this.generateReportText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = this.companyName
      ? `DORA_Report_${this.companyName.replace(/\s+/g, '_')}_${this.reportPeriod.replace(/\s+/g, '_')}.txt`
      : `DORA_Report_${this.reportPeriod.replace(/\s+/g, '_')}.txt`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  copyToClipboard(): void {
    const text = this.generateReportText();
    navigator.clipboard.writeText(text).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    });
  }

  printReport(): void {
    window.print();
  }

  exportBoardPackagePdf(): void {
    this.packageExporting.set(true);
    this.api.exportBoardPackagePdf().subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dora-board-package.pdf';
        a.click();
        URL.revokeObjectURL(url);
        this.packageExporting.set(false);
      },
      error: () => this.packageExporting.set(false)
    });
  }
}
