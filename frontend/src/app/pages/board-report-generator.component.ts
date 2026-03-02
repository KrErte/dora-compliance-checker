import { Component } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';

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
  imports: [FormsModule, RouterLink],
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
            <!-- Export Buttons -->
            <div class="flex flex-wrap gap-2 mb-4">
              <button (click)="exportAsText()"
                      class="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                {{ lang.t('boardrep.download_txt') }}
              </button>
              <button (click)="copyToClipboard()"
                      class="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
                </svg>
                {{ copied
                  ? lang.t('boardrep.copied')
                  : lang.t('boardrep.copy_to_clipboard') }}
              </button>
              <button (click)="printReport()"
                      class="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                </svg>
                {{ lang.t('boardrep.print') }}
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

  // Template selection
  selectedTemplate: ReportTemplate = 'full';
  templates = [
    { key: 'full' as ReportTemplate, nameEn: 'Full Board Report', nameEt: 'Taielik juhatuse aruanne' },
    { key: 'executive' as ReportTemplate, nameEn: 'Executive Summary Only', nameEt: 'Ainult juhtimisulevade' },
    { key: 'dashboard' as ReportTemplate, nameEn: 'Compliance Dashboard', nameEt: 'Vastavuse toolaup' }
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

  constructor(langService: LangService) {
    this.lang = langService;
  }

  getScoreColor(score: number): string {
    if (score >= 75) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  }

  getScoreLabel(score: number): string {
    const et = this.lang.currentLang === 'et';
    if (score >= 90) return et ? 'Tugev vastavus' : 'Strong Compliance';
    if (score >= 75) return et ? 'Hea edenemine' : 'Good Progress';
    if (score >= 50) return et ? 'Edeneb, kuid lunkadega' : 'Progressing with Gaps';
    return et ? 'Vajab kiiret tegutsemist' : 'Urgent Action Needed';
  }

  getExecutiveSummary(): string {
    const et = this.lang.currentLang === 'et';
    const name = this.companyName || (et ? '[Ettevotte nimi]' : '[Company Name]');
    const avg = this.getAveragePillarScore();
    const lowestPillar = this.getLowestPillar();
    const lowestName = et ? lowestPillar.nameEt : lowestPillar.nameEn;

    if (this.overallScore >= 90) {
      return et
        ? `${name} naitab tugevat DORA vastavuse positsiooni uldise skooriga ${this.overallScore}%. Organisatsioon on hasti positsioneeritud regulatiivsete noudete taitmisel. Sambade keskmine skoor on ${avg}%. Jatkuv tahelepanu on soovitatav, et sailitada korge vastavuse tase.`
        : `${name} demonstrates a strong DORA compliance posture with an overall score of ${this.overallScore}%. The organization is well-positioned to meet regulatory requirements. The average pillar score is ${avg}%. Continued attention is recommended to maintain this high level of compliance.`;
    }
    if (this.overallScore >= 75) {
      return et
        ? `${name} on teinud head edusamme DORA vastavuse saavutamisel uldise skooriga ${this.overallScore}%. Sambade keskmine on ${avg}%. Moned valdkonnad, eriti ${lowestName} (${lowestPillar.score}%), vajavad veel peenhaaldust. Soovitame keskenduda madalama skooriga valdkondadele.`
        : `${name} has made good progress toward DORA compliance with an overall score of ${this.overallScore}%. The pillar average stands at ${avg}%. Some areas, particularly ${lowestName} (${lowestPillar.score}%), still require fine-tuning. We recommend focusing on lower-scoring areas in the next period.`;
    }
    if (this.overallScore >= 50) {
      return et
        ? `${name} edeneb DORA vastavuse suunas, kuid olulised lukad jaavad skooriga ${this.overallScore}%. Sambade keskmine on ${avg}%. ${lowestName} on koige madalamal tasemel (${lowestPillar.score}%) ja vajab prioriteetset tahelepanu. Soovitame koostada kiirendatud tegevuskava.`
        : `${name} is progressing toward DORA compliance but significant gaps remain with a score of ${this.overallScore}%. The pillar average is ${avg}%. ${lowestName} is at the lowest level (${lowestPillar.score}%) and requires priority attention. We recommend developing an accelerated action plan.`;
    }
    return et
      ? `${name} vajab kiiret tegutsemist DORA vastavuse saavutamiseks uldise skooriga ${this.overallScore}%. Sambade keskmine on ${avg}%. Kriitiline valdkond on ${lowestName} skooriga ${lowestPillar.score}%. Juhatuse tasandil sekkumine on vajalik, et tagada regulatiivsete tahtaegade taitmine.`
      : `${name} requires urgent action to achieve DORA compliance with an overall score of ${this.overallScore}%. The pillar average is ${avg}%. The critical area is ${lowestName} at ${lowestPillar.score}%. Board-level intervention is necessary to meet regulatory deadlines.`;
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
    const et = this.lang.currentLang === 'et';
    const recs: string[] = [];

    const ictRisk = this.pillarScores.find(p => p.key === 'ict_risk');
    if (ictRisk && ictRisk.score < 60) {
      recs.push(et
        ? 'Prioritiseerige ametliku IKT riskihalduse raamistiku loomine vastavalt DORA Art. 6. Kehtestage riskide tuvastamise, hindamise ja maandamise protsessid.'
        : 'Prioritize establishing a formal ICT risk management framework as required by DORA Art. 6. Establish processes for risk identification, assessment, and mitigation.');
    }

    const incident = this.pillarScores.find(p => p.key === 'incident');
    if (incident && incident.score < 60) {
      recs.push(et
        ? 'Rakendage intsidentide klassifitseerimise ja teavitamise protseduurid vastavalt DORA Art. 17-23. Maaake kindlaks raporteerimiskanalid padevale asutusele.'
        : 'Implement incident classification and reporting procedures per DORA Art. 17-23. Establish reporting channels to the competent authority.');
    }

    const testing = this.pillarScores.find(p => p.key === 'testing');
    if (testing && testing.score < 60) {
      recs.push(et
        ? 'Tootage valja digitaalse toimepidevuse testimise programm vastavalt DORA Art. 24. Kaaluge ohupohise labitungimise testimist (TLPT).'
        : 'Develop a digital operational resilience testing programme per DORA Art. 24. Consider threat-led penetration testing (TLPT).');
    }

    const thirdParty = this.pillarScores.find(p => p.key === 'third_party');
    if (thirdParty && thirdParty.score < 60) {
      recs.push(et
        ? 'Vaadake ule ja uuendage koik IKT-teenuste lepingud, et lisada kohustuslikud DORA Art. 30 sated. Hinnake kontsentreerumisriske.'
        : 'Review and update all ICT service contracts to include mandatory Art. 30 provisions. Assess concentration risks across providers.');
    }

    const infoSharing = this.pillarScores.find(p => p.key === 'info_sharing');
    if (infoSharing && infoSharing.score < 60) {
      recs.push(et
        ? 'Kaaluge kuberohutuse teabejagamise kokkulepete sõlmimist vastavalt DORA Art. 45. Liituge asjakohaste infojagamise vorgustikega.'
        : 'Consider establishing cyber threat intelligence sharing arrangements per DORA Art. 45. Join relevant information sharing networks.');
    }

    // Additional general recommendations if we have fewer than 3
    if (recs.length < 3) {
      if (this.budgetUtilization > 85) {
        recs.push(et
          ? 'Eelarve kasutus on korge (' + this.budgetUtilization + '%). Taotlege taiendavat rahastust DORA vastavuse programmile.'
          : 'Budget utilization is high (' + this.budgetUtilization + '%). Request additional funding for the DORA compliance programme.');
      }
      if (this.openIncidents > 5) {
        recs.push(et
          ? 'Avatud intsidentide arv (' + this.openIncidents + ') on korge. Suurendage intsidentidele reageerimise voimekust.'
          : 'The number of open incidents (' + this.openIncidents + ') is high. Increase incident response capacity.');
      }
      if (this.thirdPartyCount > 20) {
        recs.push(et
          ? 'Suur arv kolmandate osapoolte pakkujaid (' + this.thirdPartyCount + ') suurendab kontsentreerumisriski. Teostage pohjalik ulevaatus.'
          : 'A large number of third-party providers (' + this.thirdPartyCount + ') increases concentration risk. Conduct a thorough review.');
      }
    }

    return recs;
  }

  getUpcomingDeadlines(): { date: string; descEn: string; descEt: string }[] {
    return [
      {
        date: '2026-06-30',
        descEn: 'DORA RTS/ITS implementation review deadline for incident reporting',
        descEt: 'DORA RTS/ITS rakendamise ulevaatuse tahtaeg intsidentide raporteerimiseks'
      },
      {
        date: '2026-09-30',
        descEn: 'ESA joint report on ICT third-party risk concentration',
        descEt: 'ESA uhisaruanne IKT kolmandate osapoolte riskide kontsentreerumise kohta'
      },
      {
        date: '2027-01-17',
        descEn: 'DORA Article 26 — Advanced TLPT testing cycle completion',
        descEt: 'DORA artikkel 26 — Taiustatud TLPT testimise tsukli loppetamine'
      }
    ];
  }

  generateReportText(): string {
    const et = this.lang.currentLang === 'et';
    const sep = '═'.repeat(60);
    const line = '─'.repeat(60);
    const name = this.companyName || (et ? '[Ettevotte nimi]' : '[Company Name]');

    let text = '';
    text += sep + '\n';
    text += (et ? 'DORA VASTAVUSARUANNE' : 'DORA COMPLIANCE REPORT') + '\n';
    text += name.toUpperCase() + '\n';
    text += (et ? 'Periood: ' : 'Period: ') + this.reportPeriod + '\n';
    text += (et ? 'KONFIDENTSIAALNE' : 'CONFIDENTIAL') + '\n';
    text += sep + '\n\n';

    // Executive summary
    text += (et ? 'JUHTIMISULEVADE' : 'EXECUTIVE SUMMARY') + '\n';
    text += line + '\n';
    text += this.getExecutiveSummary() + '\n\n';

    // Overall score
    text += (et ? 'ULDINE VASTAVUSE SKOOR: ' : 'OVERALL COMPLIANCE SCORE: ') + this.overallScore + '%\n';
    text += (et ? 'Staatus: ' : 'Status: ') + this.getScoreLabel(this.overallScore) + '\n\n';

    if (this.selectedTemplate === 'executive') {
      text += this.generateSignoff(et, line);
      return text;
    }

    // Pillar scores
    text += (et ? 'DORA SAMBAD' : 'DORA PILLAR DASHBOARD') + '\n';
    text += line + '\n';
    for (const pillar of this.pillarScores) {
      const pillarName = et ? pillar.nameEt : pillar.nameEn;
      const bar = this.generateBar(pillar.score);
      text += `  ${pillarName.padEnd(30)} ${bar} ${pillar.score}%\n`;
    }
    text += '\n';

    // Key metrics
    text += (et ? 'VOTNAITAJAD' : 'KEY METRICS') + '\n';
    text += line + '\n';
    text += (et ? '  Avatud intsidendid:          ' : '  Open Incidents:              ') + this.openIncidents + '\n';
    text += (et ? '  IKT pakkujad:                ' : '  ICT Providers:               ') + this.thirdPartyCount + '\n';
    text += (et ? '  Eelarve kasutus:             ' : '  Budget Utilization:          ') + this.budgetUtilization + '%\n\n';

    if (this.selectedTemplate === 'dashboard') {
      return text;
    }

    // Risk heat map
    text += (et ? 'RISKIKAART' : 'RISK HEAT MAP SUMMARY') + '\n';
    text += line + '\n';
    text += (et ? '  Kõrge/Kõrge: ' : '  High/High: ') + this.getHighHighRisks() + '  ';
    text += (et ? 'Kõrge/Madal: ' : 'High/Low: ') + this.getHighLowRisks() + '\n';
    text += (et ? '  Madal/Kõrge: ' : '  Low/High: ') + this.getLowHighRisks() + '  ';
    text += (et ? 'Madal/Madal: ' : 'Low/Low: ') + this.getLowLowRisks() + '\n\n';

    // Key risks
    const risks = this.getRisksList();
    if (risks.length > 0) {
      text += (et ? 'PEAMISED RISKID' : 'KEY RISKS') + '\n';
      text += line + '\n';
      for (const risk of risks) {
        text += `  - ${risk}\n`;
      }
      text += '\n';
    }

    // Completed actions
    const completed = this.getCompletedActionsList();
    if (completed.length > 0) {
      text += (et ? 'LOPETATUD TEGEVUSED' : 'COMPLETED ACTIONS') + '\n';
      text += line + '\n';
      for (const action of completed) {
        text += `  [x] ${action}\n`;
      }
      text += '\n';
    }

    // Planned actions
    const planned = this.getPlannedActionsList();
    if (planned.length > 0) {
      text += (et ? 'PLANEERITUD TEGEVUSED' : 'PLANNED ACTIONS') + '\n';
      text += line + '\n';
      for (let i = 0; i < planned.length; i++) {
        const priority = i === 0 ? (et ? '[KORGE]' : '[HIGH]') : i === 1 ? (et ? '[KESKMINE]' : '[MEDIUM]') : (et ? '[TAVALINE]' : '[NORMAL]');
        text += `  ${priority} ${planned[i]}\n`;
      }
      text += '\n';
    }

    // Recommendations
    const recs = this.getRecommendations();
    if (recs.length > 0) {
      text += (et ? 'SOOVITUSED' : 'RECOMMENDATIONS') + '\n';
      text += line + '\n';
      for (let i = 0; i < recs.length; i++) {
        text += `  ${i + 1}. ${recs[i]}\n`;
      }
      text += '\n';
    }

    // Regulatory timeline
    const deadlines = this.getUpcomingDeadlines();
    text += (et ? 'REGULATIIVNE AJAKAVA' : 'REGULATORY TIMELINE') + '\n';
    text += line + '\n';
    for (const d of deadlines) {
      text += `  ${d.date} — ${et ? d.descEt : d.descEn}\n`;
    }
    text += '\n';

    text += this.generateSignoff(et, line);
    return text;
  }

  private generateSignoff(et: boolean, line: string): string {
    let text = '';
    text += (et ? 'ALLKIRJAD' : 'SIGN-OFF') + '\n';
    text += line + '\n';
    text += (et ? '  Koostaja:  ' : '  Prepared By:  ') + (this.preparedBy || '________________________') + '\n';
    text += (et ? '  Kinnitaja: ' : '  Approved By:  ') + (this.approvedBy || '________________________') + '\n';
    text += (et ? '  Kuupaev:   ' : '  Date:         ') + (this.reportDate || '________________________') + '\n';
    text += '\n' + '═'.repeat(60) + '\n';
    text += (et ? 'Genereeritud DoraAudit.eu abil' : 'Generated with DoraAudit.eu') + '\n';
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
}
