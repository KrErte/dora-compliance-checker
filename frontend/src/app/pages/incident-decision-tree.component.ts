import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';

interface DecisionStep {
  id: string;
  question: { et: string; en: string };
  description?: { et: string; en: string };
  options: {
    label: { et: string; en: string };
    value: string;
    severity: number;
    nextStep: string | null;
  }[];
}

interface AnswerRecord {
  stepId: string;
  question: string;
  answer: string;
  severity: number;
}

type Classification = 'MAJOR' | 'SIGNIFICANT' | 'MINOR';
type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

@Component({
  selector: 'app-incident-decision-tree',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-8 max-w-4xl mx-auto">

      <!-- Header -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/10 via-blue-500/10 to-blue-500/10 border border-blue-200 p-8">
        <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-600/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div class="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div class="relative">
          <div class="flex items-center gap-2 mb-3">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-600 border border-blue-200">
              {{ lang.t('decisiontree.dora_art_18') }}
            </span>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-600/20 text-blue-500 border border-blue-500/30">
              {{ lang.t('decisiontree.free_tool') }}
            </span>
          </div>
          <h1 class="text-3xl font-bold text-white mb-2">
            {{ lang.t('decisiontree.title') }}
          </h1>
          <p class="text-slate-400 max-w-2xl">
            {{ lang.t('decisiontree.description') }}
          </p>
        </div>
      </div>

      <!-- Progress bar -->
      @if (!showResult()) {
        <div>
          <div class="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>{{ lang.t('decisiontree.progress') }}</span>
            <span>{{ lang.t('decisiontree.step') }} {{ currentStepIndex() + 1 }} / {{ steps.length }}</span>
          </div>
          <div class="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-blue-600 transition-all duration-500 rounded-full"
                 [style.width.%]="progressPercent()"></div>
          </div>
        </div>
      }

      <div class="flex flex-col lg:flex-row gap-6">

        <!-- Decision path sidebar (breadcrumb) -->
        @if (answers().length > 0) {
          <div class="lg:w-72 shrink-0 order-2 lg:order-1">
            <div class="bg-white rounded-2xl border border-slate-200 p-5 sticky top-24">
              <h3 class="text-sm font-semibold text-slate-600 mb-4 flex items-center gap-2">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
                {{ lang.t('decisiontree.decision_path') }}
              </h3>
              <div class="space-y-0">
                @for (answer of answers(); track answer.stepId; let i = $index; let last = $last) {
                  <div class="relative">
                    <!-- Connector line -->
                    @if (!last || !showResult()) {
                      <div class="absolute left-3 top-7 bottom-0 w-0.5 bg-slate-700"></div>
                    }
                    <div class="flex items-start gap-3 pb-4">
                      <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold"
                           [class]="getSeverityDotClass(answer.severity)">
                        {{ i + 1 }}
                      </div>
                      <div class="min-w-0">
                        <p class="text-[11px] text-slate-500 leading-tight mb-0.5 truncate">{{ answer.question }}</p>
                        <p class="text-xs font-medium leading-tight"
                           [class]="answer.severity >= 2 ? 'text-red-400' : answer.severity === 1 ? 'text-yellow-400' : 'text-blue-600'">
                          {{ answer.answer }}
                        </p>
                      </div>
                    </div>
                  </div>
                }
                @if (showResult()) {
                  <div class="flex items-start gap-3">
                    <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                         [class]="getClassificationDotClass()">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                    <div>
                      <p class="text-[11px] text-slate-500 leading-tight mb-0.5">{{ lang.t('decisiontree.result') }}</p>
                      <p class="text-xs font-bold" [class]="getClassificationTextClass()">
                        {{ getClassificationLabel() }}
                      </p>
                    </div>
                  </div>
                }
              </div>

              <!-- Severity score -->
              <div class="mt-4 pt-4 border-t border-slate-200">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-500">{{ lang.t('decisiontree.severity_score') }}</span>
                  <span class="font-bold" [class]="totalSeverity() >= 10 ? 'text-red-400' : totalSeverity() >= 5 ? 'text-yellow-400' : 'text-blue-600'">
                    {{ totalSeverity() }} / 24
                  </span>
                </div>
                <div class="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-500"
                       [class]="totalSeverity() >= 10 ? 'bg-red-500' : totalSeverity() >= 5 ? 'bg-yellow-500' : 'bg-blue-600'"
                       [style.width.%]="(totalSeverity() / 24) * 100"></div>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Main content area -->
        <div class="flex-1 order-1 lg:order-2">

          <!-- Active question -->
          @if (!showResult()) {
            <div class="bg-white rounded-2xl border border-slate-200 p-8 transition-all duration-300">
              <!-- Step indicator -->
              <div class="flex items-center gap-3 mb-6">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-500/20 border border-blue-200 flex items-center justify-center">
                  <span class="text-sm font-bold text-blue-600">{{ currentStepIndex() + 1 }}</span>
                </div>
                <div>
                  <p class="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                    {{ lang.t('decisiontree.step') }} {{ currentStepIndex() + 1 }} {{ lang.t('decisiontree.step_of') }} {{ steps.length }}
                  </p>
                  <p class="text-xs text-slate-400">{{ getCurrentStepId() }}</p>
                </div>
              </div>

              <!-- Question -->
              <h2 class="text-xl font-bold text-white mb-2">
                {{ lang.l(getCurrentStep().question.et, getCurrentStep().question.en) }}
              </h2>
              @if (getCurrentStep().description) {
                <p class="text-sm text-slate-400 mb-6">
                  {{ lang.l(getCurrentStep().description!.et, getCurrentStep().description!.en) }}
                </p>
              } @else {
                <div class="mb-6"></div>
              }

              <!-- Options -->
              <div class="space-y-3">
                @for (option of getCurrentStep().options; track option.value) {
                  <button type="button"
                          (click)="selectOption(option)"
                          class="w-full text-left p-4 rounded-xl border transition-all duration-200 group hover:scale-[1.01]"
                          [class]="getOptionClass(option.severity)">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                             [class]="getOptionIconClass(option.severity)">
                          @if (option.severity === 0) {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                          } @else if (option.severity === 1) {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          } @else if (option.severity === 2) {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                            </svg>
                          } @else {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          }
                        </div>
                        <span class="text-sm font-medium text-white">
                          {{ lang.l(option.label.et, option.label.en) }}
                        </span>
                      </div>
                      <svg class="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                      </svg>
                    </div>
                  </button>
                }
              </div>

              <!-- Back button -->
              @if (answers().length > 0) {
                <button type="button" (click)="goBack()"
                        class="mt-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-600 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                  </svg>
                  {{ lang.t('decisiontree.go_back') }}
                </button>
              }
            </div>
          }

          <!-- Result -->
          @if (showResult()) {
            <div class="space-y-6">

              <!-- Classification card -->
              <div class="rounded-2xl border p-8"
                   [class]="getResultCardClass()">
                <div class="flex items-start gap-4 mb-6">
                  <div class="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                       [class]="getResultIconBgClass()">
                    @if (classification() === 'MAJOR') {
                      <svg class="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    } @else if (classification() === 'SIGNIFICANT') {
                      <svg class="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                      </svg>
                    } @else {
                      <svg class="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    }
                  </div>
                  <div>
                    <p class="text-xs uppercase tracking-wider font-medium text-slate-400 mb-1">
                      {{ lang.t('decisiontree.incident_classification') }}
                    </p>
                    <h2 class="text-2xl font-bold" [class]="getClassificationTextClass()">
                      {{ getClassificationLabel() }}
                    </h2>
                    <p class="text-sm text-slate-400 mt-1">
                      {{ getClassificationDescription() }}
                    </p>
                  </div>
                </div>

                <!-- Severity level badge -->
                <div class="flex flex-wrap gap-3 mb-6">
                  <div class="px-4 py-2 rounded-xl border flex items-center gap-2"
                       [class]="getSeverityBadgeClass()">
                    <div class="w-2 h-2 rounded-full" [class]="getSeverityDotColorClass()"></div>
                    <span class="text-xs font-bold uppercase tracking-wider">
                      {{ lang.t('decisiontree.level') }}: {{ getSeverityLabel() }}
                    </span>
                  </div>
                  <div class="px-4 py-2 rounded-xl bg-slate-700/30 border border-slate-600/30">
                    <span class="text-xs text-slate-400">
                      {{ lang.t('decisiontree.score') }}: <span class="font-bold text-white">{{ totalSeverity() }}</span> / 24
                    </span>
                  </div>
                  <div class="px-4 py-2 rounded-xl bg-slate-700/30 border border-slate-600/30">
                    <span class="text-xs text-slate-400">
                      DORA Art. 18
                    </span>
                  </div>
                </div>

                <!-- Severity meter -->
                <div class="bg-white rounded-xl p-4">
                  <div class="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                    <span>{{ lang.t('decisiontree.classification_minor') }}</span>
                    <span>{{ lang.t('decisiontree.classification_significant') }}</span>
                    <span>{{ lang.t('decisiontree.classification_major') }}</span>
                  </div>
                  <div class="h-3 bg-slate-800 rounded-full overflow-hidden relative">
                    <div class="absolute inset-0 flex">
                      <div class="flex-1 bg-blue-100 border-r border-slate-700"></div>
                      <div class="flex-1 bg-yellow-500/20 border-r border-slate-700"></div>
                      <div class="flex-1 bg-red-500/20"></div>
                    </div>
                    <div class="absolute top-0 left-0 h-full transition-all duration-700 rounded-full"
                         [class]="totalSeverity() >= 10 ? 'bg-red-500' : totalSeverity() >= 5 ? 'bg-yellow-500' : 'bg-blue-600'"
                         [style.width.%]="(totalSeverity() / 24) * 100"></div>
                  </div>
                  <div class="flex justify-between mt-1">
                    <span class="text-[10px] text-slate-600">0</span>
                    <span class="text-[10px] text-slate-600">5</span>
                    <span class="text-[10px] text-slate-600">10</span>
                    <span class="text-[10px] text-slate-600">24</span>
                  </div>
                </div>
              </div>

              <!-- Reporting timeline (only for major/significant) -->
              @if (classification() === 'MAJOR') {
                <div class="bg-white rounded-2xl border border-red-500/20 p-6">
                  <h3 class="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ lang.t('decisiontree.mandatory_reporting_timeline') }}
                  </h3>
                  <p class="text-xs text-slate-400 mb-5">{{ lang.t('decisiontree.dora_art19_requirements') }}</p>

                  <div class="space-y-4">
                    <!-- Initial notification -->
                    <div class="flex items-start gap-4">
                      <div class="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                        <span class="text-sm font-bold text-red-400">4h</span>
                      </div>
                      <div class="flex-1 pb-4 border-b border-slate-200">
                        <p class="text-sm font-semibold text-white">{{ lang.t('decisiontree.initial_notification') }}</p>
                        <p class="text-xs text-slate-400 mt-0.5">{{ lang.t('decisiontree.initial_notif_desc') }}</p>
                        <p class="text-[11px] text-red-400/80 mt-1">DORA Art. 19(4)(a)</p>
                      </div>
                    </div>
                    <!-- Intermediate report -->
                    <div class="flex items-start gap-4">
                      <div class="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center shrink-0">
                        <span class="text-sm font-bold text-yellow-400">72h</span>
                      </div>
                      <div class="flex-1 pb-4 border-b border-slate-200">
                        <p class="text-sm font-semibold text-white">{{ lang.t('decisiontree.intermediate_report') }}</p>
                        <p class="text-xs text-slate-400 mt-0.5">{{ lang.t('decisiontree.intermediate_report_desc') }}</p>
                        <p class="text-[11px] text-yellow-400/80 mt-1">DORA Art. 19(4)(b)</p>
                      </div>
                    </div>
                    <!-- Final report -->
                    <div class="flex items-start gap-4">
                      <div class="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                        <span class="text-sm font-bold text-blue-600">1m</span>
                      </div>
                      <div class="flex-1">
                        <p class="text-sm font-semibold text-white">{{ lang.t('decisiontree.final_report') }}</p>
                        <p class="text-xs text-slate-400 mt-0.5">{{ lang.t('decisiontree.final_report_desc') }}</p>
                        <p class="text-[11px] text-blue-600/80 mt-1">DORA Art. 19(4)(c)</p>
                      </div>
                    </div>
                  </div>
                </div>
              }

              @if (classification() === 'SIGNIFICANT') {
                <div class="bg-white rounded-2xl border border-yellow-500/20 p-6">
                  <h3 class="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    {{ lang.t('decisiontree.required_actions') }}
                  </h3>
                  <p class="text-xs text-slate-400 mb-4">{{ lang.t('decisiontree.significant_incident_mgmt') }}</p>
                  <ul class="space-y-2">
                    <li class="flex items-start gap-2 text-sm text-slate-600">
                      <svg class="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/>
                      </svg>
                      {{ lang.t('decisiontree.log_internal_monitor') }}
                    </li>
                    <li class="flex items-start gap-2 text-sm text-slate-600">
                      <svg class="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/>
                      </svg>
                      {{ lang.t('decisiontree.monitor_escalation') }}
                    </li>
                    <li class="flex items-start gap-2 text-sm text-slate-600">
                      <svg class="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/>
                      </svg>
                      {{ lang.t('decisiontree.prepare_internal_report') }}
                    </li>
                    <li class="flex items-start gap-2 text-sm text-slate-600">
                      <svg class="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/>
                      </svg>
                      {{ lang.t('decisiontree.notify_management') }}
                    </li>
                  </ul>
                </div>
              }

              @if (classification() === 'MINOR') {
                <div class="bg-white rounded-2xl border border-blue-200 p-6">
                  <h3 class="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ lang.t('decisiontree.recommended_actions') }}
                  </h3>
                  <p class="text-xs text-slate-400 mb-4">{{ lang.t('decisiontree.minor_incident_mgmt') }}</p>
                  <ul class="space-y-2">
                    <li class="flex items-start gap-2 text-sm text-slate-600">
                      <svg class="w-4 h-4 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/>
                      </svg>
                      {{ lang.t('decisiontree.record_internal_log') }}
                    </li>
                    <li class="flex items-start gap-2 text-sm text-slate-600">
                      <svg class="w-4 h-4 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/>
                      </svg>
                      {{ lang.t('decisiontree.handle_internal_standard') }}
                    </li>
                    <li class="flex items-start gap-2 text-sm text-slate-600">
                      <svg class="w-4 h-4 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/>
                      </svg>
                      {{ lang.t('decisiontree.no_mandatory_reporting') }}
                    </li>
                  </ul>
                </div>
              }

              <!-- Initial notification template (major only) -->
              @if (classification() === 'MAJOR') {
                <div class="bg-white rounded-2xl border border-slate-200 p-6">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                      <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      {{ lang.t('decisiontree.initial_notif_template') }}
                    </h3>
                    <button type="button" (click)="copyTemplate()"
                            class="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-500 border border-blue-500/30 hover:bg-blue-600/20 transition-colors">
                      {{ copied() ? lang.t('decisiontree.copied') : lang.t('decisiontree.copy') }}
                    </button>
                  </div>

                  <div class="bg-slate-900/70 rounded-xl p-5 font-mono text-xs text-slate-600 leading-relaxed space-y-3 border border-slate-200">
                    <p class="text-slate-500">// {{ lang.t('decisiontree.template_header') }}</p>
                    <p><span class="text-blue-500">{{ lang.t('decisiontree.template_date') }}:</span> {{ today }}</p>
                    <p><span class="text-blue-500">{{ lang.t('decisiontree.template_incident_type') }}:</span> {{ lang.t('decisiontree.template_ict_incident') }}</p>
                    <p><span class="text-blue-500">{{ lang.t('decisiontree.template_classification') }}:</span> {{ lang.t('decisiontree.template_major_ict') }}</p>
                    <p><span class="text-blue-500">{{ lang.t('decisiontree.template_severity') }}:</span> {{ getSeverityLabel() }} ({{ totalSeverity() }}/24)</p>
                    <p class="text-slate-500">---</p>
                    <p><span class="text-blue-500">{{ lang.t('decisiontree.template_critical_functions') }}:</span> {{ getAnswerValue('critical_functions') }}</p>
                    <p><span class="text-blue-500">{{ lang.t('decisiontree.template_affected_clients') }}:</span> {{ getAnswerValue('clients_affected') }}</p>
                    <p><span class="text-blue-500">{{ lang.t('decisiontree.template_duration') }}:</span> {{ getAnswerValue('duration') }}</p>
                    <p><span class="text-blue-500">{{ lang.t('decisiontree.template_data_loss') }}:</span> {{ getAnswerValue('data_loss') }}</p>
                    <p><span class="text-blue-500">{{ lang.t('decisiontree.template_reputational_impact') }}:</span> {{ getAnswerValue('reputational_impact') }}</p>
                    <p><span class="text-blue-500">{{ lang.t('decisiontree.template_economic_impact') }}:</span> {{ getAnswerValue('economic_impact') }}</p>
                    <p><span class="text-blue-500">{{ lang.t('decisiontree.template_geographical_spread') }}:</span> {{ getAnswerValue('geographical_spread') }}</p>
                    <p class="text-slate-500">---</p>
                    <p><span class="text-blue-500">{{ lang.t('decisiontree.template_legal_basis') }}:</span> DORA Art. 18, 19</p>
                    <p><span class="text-blue-500">{{ lang.t('decisiontree.template_deadline') }}:</span> {{ lang.t('decisiontree.template_deadline_value') }}</p>
                  </div>
                </div>
              }

              <!-- Recommended next steps -->
              <div class="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                  {{ lang.t('decisiontree.recommended_next_steps') }}
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a routerLink="/incident-reporting"
                     class="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30 hover:border-blue-200 hover:bg-blue-50 transition-all group">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <svg class="w-4.5 h-4.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-white group-hover:text-blue-500 transition-colors">
                          {{ lang.t('decisiontree.incident_reporting') }}
                        </p>
                        <p class="text-[11px] text-slate-500">{{ lang.t('decisiontree.start_official_report') }}</p>
                      </div>
                    </div>
                  </a>
                  <a routerLink="/incident-simulator"
                     class="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30 hover:border-blue-500/30 hover:bg-blue-50 transition-all group">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <svg class="w-4.5 h-4.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                          {{ lang.t('decisiontree.incident_simulator') }}
                        </p>
                        <p class="text-[11px] text-slate-500">{{ lang.t('decisiontree.simulate_response') }}</p>
                      </div>
                    </div>
                  </a>
                  <a routerLink="/remediation"
                     class="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                        <svg class="w-4.5 h-4.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
                          {{ lang.t('decisiontree.remediation_tracker') }}
                        </p>
                        <p class="text-[11px] text-slate-500">{{ lang.t('decisiontree.track_fixes') }}</p>
                      </div>
                    </div>
                  </a>
                  <a routerLink="/assessment"
                     class="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <svg class="w-4.5 h-4.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                        </svg>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">
                          {{ lang.t('decisiontree.dora_assessment') }}
                        </p>
                        <p class="text-[11px] text-slate-500">{{ lang.t('decisiontree.evaluate_compliance') }}</p>
                      </div>
                    </div>
                  </a>
                </div>
              </div>

              <!-- Reset button -->
              <div class="flex justify-center">
                <button type="button" (click)="reset()"
                        class="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-700/50 border border-slate-200 text-sm font-medium text-slate-600 hover:text-white hover:border-slate-500 hover:bg-slate-700 transition-all">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  {{ lang.t('decisiontree.start_over') }}
                </button>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Reference section -->
      <div class="bg-slate-800/30 rounded-2xl border border-slate-200 p-6">
        <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
          {{ lang.t('decisiontree.references_legal_basis') }}
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 rounded-xl bg-slate-900/30 border border-slate-200">
            <h4 class="text-sm font-semibold text-blue-600 mb-2">DORA Art. 18 -- {{ lang.t('decisiontree.ref_classification') }}</h4>
            <p class="text-xs text-slate-400 leading-relaxed">
              {{ lang.t('decisiontree.ref_art18_desc') }}
            </p>
          </div>
          <div class="p-4 rounded-xl bg-slate-900/30 border border-slate-200">
            <h4 class="text-sm font-semibold text-blue-500 mb-2">EBA RTS/ITS -- {{ lang.t('decisiontree.ref_thresholds') }}</h4>
            <p class="text-xs text-slate-400 leading-relaxed">
              {{ lang.t('decisiontree.ref_eba_desc') }}
            </p>
          </div>
          <div class="p-4 rounded-xl bg-slate-900/30 border border-slate-200">
            <h4 class="text-sm font-semibold text-purple-400 mb-2">DORA Art. 19 -- {{ lang.t('decisiontree.ref_reporting') }}</h4>
            <p class="text-xs text-slate-400 leading-relaxed">
              {{ lang.t('decisiontree.ref_art19_desc') }}
            </p>
          </div>
          <div class="p-4 rounded-xl bg-slate-900/30 border border-slate-200">
            <h4 class="text-sm font-semibold text-slate-600 mb-2">{{ lang.t('decisiontree.related_tools') }}</h4>
            <div class="space-y-2">
              <a routerLink="/incident-reporting" class="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-500 transition-colors">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
                {{ lang.t('decisiontree.dora_incident_reporting_tool') }}
              </a>
              <a routerLink="/incident-simulator" class="flex items-center gap-2 text-xs text-blue-500 hover:text-blue-400 transition-colors">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
                {{ lang.t('decisiontree.ict_incident_simulator') }}
              </a>
              <a routerLink="/assessment" class="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
                {{ lang.t('decisiontree.dora_self_assessment') }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class IncidentDecisionTreeComponent {
  public lang: LangService = inject(LangService);

  today = new Date().toISOString().split('T')[0];

  currentStepId = signal<string>('incident_occurred');
  answers = signal<AnswerRecord[]>([]);
  showResult = signal(false);
  copied = signal(false);

  get et(): boolean {
    return this.lang.currentLang === 'et';
  }

  steps: DecisionStep[] = [
    {
      id: 'incident_occurred',
      question: {
        et: 'Kas IKT-ga seotud intsident on toimunud?',
        en: 'Has an ICT-related incident occurred?'
      },
      description: {
        et: 'DORA artikkel 3(8): IKT intsident on ettenägematu sündmus võrgu- ja infosüsteemides, mis mõjutab IKT teenuste turvalisust.',
        en: 'DORA Article 3(8): An ICT-related incident is an unforeseen event in network and information systems that compromises the security of ICT services.'
      },
      options: [
        { label: { et: 'Jah, intsident on toimunud', en: 'Yes, an incident has occurred' }, value: 'yes', severity: 1, nextStep: 'critical_functions' },
        { label: { et: 'Ei, ennetav hinnang', en: 'No, preventive assessment' }, value: 'no', severity: 0, nextStep: null }
      ]
    },
    {
      id: 'critical_functions',
      question: {
        et: 'Kas intsident mõjutab kriitilisi või olulisi funktsioone?',
        en: 'Does the incident affect critical or important functions?'
      },
      description: {
        et: 'DORA artikkel 3(22): Kriitilised funktsioonid on need, mille häirimine ohustaks finantsüksuse finantsstabiilsust, äritegevust või teenuste osutamist.',
        en: 'DORA Article 3(22): Critical functions are those whose disruption would compromise the financial entity\'s financial stability, business operations, or service delivery.'
      },
      options: [
        { label: { et: 'Jah, kriitilised funktsioonid on mõjutatud', en: 'Yes, critical functions are affected' }, value: 'yes', severity: 3, nextStep: 'clients_affected' },
        { label: { et: 'Ei, ainult mittekriitilised funktsioonid', en: 'No, only non-critical functions' }, value: 'no', severity: 0, nextStep: 'clients_affected' }
      ]
    },
    {
      id: 'clients_affected',
      question: {
        et: 'Kui palju kliente/vastaspooli on mõjutatud?',
        en: 'How many clients/counterparts are affected?'
      },
      description: {
        et: 'DORA artikkel 18(1)(a): Mõjutatud klientide arv on üks peamisi klassifitseerimise kriteeriume.',
        en: 'DORA Article 18(1)(a): The number of affected clients is one of the primary classification criteria.'
      },
      options: [
        { label: { et: 'Alla 10', en: 'Less than 10' }, value: '<10', severity: 0, nextStep: 'duration' },
        { label: { et: '10 - 100', en: '10 - 100' }, value: '10-100', severity: 1, nextStep: 'duration' },
        { label: { et: '100 - 1,000', en: '100 - 1,000' }, value: '100-1000', severity: 2, nextStep: 'duration' },
        { label: { et: 'Üle 1,000', en: 'More than 1,000' }, value: '1000+', severity: 3, nextStep: 'duration' }
      ]
    },
    {
      id: 'duration',
      question: {
        et: 'Kui kaua intsident kestab?',
        en: 'What is the duration of the incident?'
      },
      description: {
        et: 'DORA artikkel 18(1)(b): Intsidendi kestus mõjutab oluliselt klassifikatsiooni.',
        en: 'DORA Article 18(1)(b): The duration of the incident significantly affects classification.'
      },
      options: [
        { label: { et: 'Alla 2 tunni', en: 'Less than 2 hours' }, value: '<2h', severity: 0, nextStep: 'data_loss' },
        { label: { et: '2 - 12 tundi', en: '2 - 12 hours' }, value: '2-12h', severity: 1, nextStep: 'data_loss' },
        { label: { et: '12 - 24 tundi', en: '12 - 24 hours' }, value: '12-24h', severity: 2, nextStep: 'data_loss' },
        { label: { et: 'Üle 24 tunni', en: 'More than 24 hours' }, value: '24h+', severity: 3, nextStep: 'data_loss' }
      ]
    },
    {
      id: 'data_loss',
      question: {
        et: 'Kas esineb andmekadu või -leket?',
        en: 'Is there data loss or breach?'
      },
      description: {
        et: 'DORA artikkel 18(1)(c): Andmekaotused, sealhulgas isikuandmete lekked, tõstavad oluliselt intsidendi raskusastet.',
        en: 'DORA Article 18(1)(c): Data losses, including personal data breaches, significantly raise the severity of the incident.'
      },
      options: [
        { label: { et: 'Jah, isikuandmed', en: 'Yes, personal data' }, value: 'personal_data', severity: 2, nextStep: 'reputational_impact' },
        { label: { et: 'Jah, finantsandmed', en: 'Yes, financial data' }, value: 'financial_data', severity: 2, nextStep: 'reputational_impact' },
        { label: { et: 'Jah, mõlemad', en: 'Yes, both' }, value: 'both', severity: 3, nextStep: 'reputational_impact' },
        { label: { et: 'Ei, andmekadu puudub', en: 'No data loss' }, value: 'none', severity: 0, nextStep: 'reputational_impact' }
      ]
    },
    {
      id: 'reputational_impact',
      question: {
        et: 'Kas esineb mainemõju?',
        en: 'Is there reputational impact?'
      },
      description: {
        et: 'DORA artikkel 18(1)(d): Hinnake intsidendi mõju organisatsiooni mainele ja klientide usaldusele.',
        en: 'DORA Article 18(1)(d): Assess the incident\'s impact on the organization\'s reputation and client trust.'
      },
      options: [
        { label: { et: 'Kõrge - meediakajastus, klientide kaotus', en: 'High - media coverage, client loss' }, value: 'high', severity: 3, nextStep: 'economic_impact' },
        { label: { et: 'Keskmine - klientide mure', en: 'Medium - client concerns' }, value: 'medium', severity: 2, nextStep: 'economic_impact' },
        { label: { et: 'Madal - piiratud teadlikkus', en: 'Low - limited awareness' }, value: 'low', severity: 1, nextStep: 'economic_impact' },
        { label: { et: 'Puudub', en: 'None' }, value: 'none', severity: 0, nextStep: 'economic_impact' }
      ]
    },
    {
      id: 'economic_impact',
      question: {
        et: 'Milline on majanduslik mõju?',
        en: 'What is the economic impact?'
      },
      description: {
        et: 'DORA artikkel 18(1)(e): Otsesed ja kaudsed kulud, sealhulgas taastamine, trahvid, kaotatud tulu.',
        en: 'DORA Article 18(1)(e): Direct and indirect costs, including recovery, penalties, and lost revenue.'
      },
      options: [
        { label: { et: 'Alla 100,000 EUR', en: 'Less than \u20ac100K' }, value: '<100K', severity: 0, nextStep: 'geographical_spread' },
        { label: { et: '100,000 - 1M EUR', en: '\u20ac100K - \u20ac1M' }, value: '100K-1M', severity: 1, nextStep: 'geographical_spread' },
        { label: { et: '1M - 10M EUR', en: '\u20ac1M - \u20ac10M' }, value: '1M-10M', severity: 2, nextStep: 'geographical_spread' },
        { label: { et: 'Üle 10M EUR', en: 'More than \u20ac10M' }, value: '10M+', severity: 3, nextStep: 'geographical_spread' }
      ]
    },
    {
      id: 'geographical_spread',
      question: {
        et: 'Milline on geograafiline ulatus?',
        en: 'Is there geographical spread?'
      },
      description: {
        et: 'DORA artikkel 18(1)(f): Geograafiline ulatus määrab, kas intsident mõjutab mitut jurisdiktsiooni.',
        en: 'DORA Article 18(1)(f): Geographical spread determines whether the incident affects multiple jurisdictions.'
      },
      options: [
        { label: { et: 'Üks asukoht', en: 'Single location' }, value: 'single', severity: 0, nextStep: null },
        { label: { et: 'Mitu asukohta', en: 'Multiple locations' }, value: 'multiple', severity: 1, nextStep: null },
        { label: { et: 'Piiriülene', en: 'Cross-border' }, value: 'cross_border', severity: 3, nextStep: null }
      ]
    }
  ];

  currentStepIndex = computed(() => {
    const id = this.currentStepId();
    const idx = this.steps.findIndex(s => s.id === id);
    return idx >= 0 ? idx : 0;
  });

  progressPercent = computed(() => {
    return Math.round(((this.answers().length) / this.steps.length) * 100);
  });

  totalSeverity = computed(() => {
    return this.answers().reduce((sum, a) => sum + a.severity, 0);
  });

  classification = computed((): Classification => {
    const score = this.totalSeverity();
    if (score >= 10) return 'MAJOR';
    if (score >= 5) return 'SIGNIFICANT';
    return 'MINOR';
  });

  severityLevel = computed((): SeverityLevel => {
    const score = this.totalSeverity();
    if (score >= 15) return 'CRITICAL';
    if (score >= 10) return 'HIGH';
    if (score >= 5) return 'MEDIUM';
    return 'LOW';
  });

  getCurrentStep(): DecisionStep {
    return this.steps[this.currentStepIndex()];
  }

  getCurrentStepId(): string {
    const step = this.getCurrentStep();
    const id = step.id;
    const labels: Record<string, { et: string; en: string }> = {
      'incident_occurred': { et: 'Intsidendi tuvastamine', en: 'Incident Detection' },
      'critical_functions': { et: 'Kriitiliste funktsioonide mõju', en: 'Critical Functions Impact' },
      'clients_affected': { et: 'Mõjutatud kliendid', en: 'Affected Clients' },
      'duration': { et: 'Intsidendi kestus', en: 'Incident Duration' },
      'data_loss': { et: 'Andmekadu/leke', en: 'Data Loss/Breach' },
      'reputational_impact': { et: 'Mainemõju', en: 'Reputational Impact' },
      'economic_impact': { et: 'Majanduslik mõju', en: 'Economic Impact' },
      'geographical_spread': { et: 'Geograafiline ulatus', en: 'Geographical Spread' }
    };
    const label = labels[id];
    return label ? this.lang.l(label.et, label.en) : id;
  }

  selectOption(option: { label: { et: string; en: string }; value: string; severity: number; nextStep: string | null }): void {
    const step = this.getCurrentStep();
    const record: AnswerRecord = {
      stepId: step.id,
      question: this.lang.l(step.question.et, step.question.en),
      answer: this.lang.l(option.label.et, option.label.en),
      severity: option.severity
    };

    this.answers.update(a => [...a, record]);

    // Special case: "No incident" goes straight to result
    if (step.id === 'incident_occurred' && option.value === 'no') {
      this.showResult.set(true);
      return;
    }

    if (option.nextStep) {
      this.currentStepId.set(option.nextStep);
    } else {
      this.showResult.set(true);
    }
  }

  goBack(): void {
    const currentAnswers = this.answers();
    if (currentAnswers.length === 0) return;

    const previous = currentAnswers[currentAnswers.length - 1];
    this.answers.update(a => a.slice(0, -1));
    this.currentStepId.set(previous.stepId);
    this.showResult.set(false);
  }

  reset(): void {
    this.currentStepId.set('incident_occurred');
    this.answers.set([]);
    this.showResult.set(false);
    this.copied.set(false);
  }

  getAnswerValue(stepId: string): string {
    const answer = this.answers().find(a => a.stepId === stepId);
    return answer ? answer.answer : this.lang.t('decisiontree.not_answered');
  }

  getClassificationLabel(): string {
    const keyMap: Record<string, string> = {
      'MAJOR': 'decisiontree.classification_major_label',
      'SIGNIFICANT': 'decisiontree.classification_significant_label',
      'MINOR': 'decisiontree.classification_minor_label'
    };
    return this.lang.t(keyMap[this.classification()]);
  }

  getClassificationDescription(): string {
    const keyMap: Record<string, string> = {
      'MAJOR': 'decisiontree.desc_major_incident',
      'SIGNIFICANT': 'decisiontree.desc_significant_incident',
      'MINOR': 'decisiontree.desc_minor_incident'
    };
    return this.lang.t(keyMap[this.classification()]);
  }

  getSeverityLabel(): string {
    const keyMap: Record<string, string> = {
      'CRITICAL': 'decisiontree.severity_critical',
      'HIGH': 'decisiontree.severity_high',
      'MEDIUM': 'decisiontree.severity_medium',
      'LOW': 'decisiontree.severity_low'
    };
    return this.lang.t(keyMap[this.severityLevel()]);
  }

  getOptionClass(severity: number): string {
    switch (severity) {
      case 0: return 'bg-white border-slate-200 hover:border-blue-500/40 hover:bg-blue-50';
      case 1: return 'bg-white border-slate-200 hover:border-yellow-500/40 hover:bg-yellow-500/5';
      case 2: return 'bg-white border-slate-200 hover:border-orange-500/40 hover:bg-orange-500/5';
      case 3: return 'bg-white border-slate-200 hover:border-red-500/40 hover:bg-red-500/5';
      default: return 'bg-white border-slate-200';
    }
  }

  getOptionIconClass(severity: number): string {
    switch (severity) {
      case 0: return 'bg-blue-50 text-blue-600';
      case 1: return 'bg-yellow-500/10 text-yellow-400';
      case 2: return 'bg-orange-500/10 text-orange-400';
      case 3: return 'bg-red-500/10 text-red-400';
      default: return 'bg-slate-700/50 text-slate-400';
    }
  }

  getSeverityDotClass(severity: number): string {
    switch (severity) {
      case 0: return 'bg-blue-100 text-blue-600 border border-blue-200';
      case 1: return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 2: return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      case 3: return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default: return 'bg-slate-700/50 text-slate-400 border border-slate-600/30';
    }
  }

  getClassificationDotClass(): string {
    switch (this.classification()) {
      case 'MAJOR': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'SIGNIFICANT': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'MINOR': return 'bg-blue-100 text-blue-600 border border-blue-200';
    }
  }

  getClassificationTextClass(): string {
    switch (this.classification()) {
      case 'MAJOR': return 'text-red-400';
      case 'SIGNIFICANT': return 'text-yellow-400';
      case 'MINOR': return 'text-blue-600';
    }
  }

  getResultCardClass(): string {
    switch (this.classification()) {
      case 'MAJOR': return 'bg-red-500/5 border-red-500/20';
      case 'SIGNIFICANT': return 'bg-yellow-500/5 border-yellow-500/20';
      case 'MINOR': return 'bg-blue-50 border-blue-200';
    }
  }

  getResultIconBgClass(): string {
    switch (this.classification()) {
      case 'MAJOR': return 'bg-red-500/10 border border-red-500/30';
      case 'SIGNIFICANT': return 'bg-yellow-500/10 border border-yellow-500/30';
      case 'MINOR': return 'bg-blue-50 border border-blue-200';
    }
  }

  getSeverityBadgeClass(): string {
    switch (this.severityLevel()) {
      case 'CRITICAL': return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'HIGH': return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      case 'MEDIUM': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'LOW': return 'bg-blue-50 border-blue-200 text-blue-600';
    }
  }

  getSeverityDotColorClass(): string {
    switch (this.severityLevel()) {
      case 'CRITICAL': return 'bg-red-400';
      case 'HIGH': return 'bg-orange-400';
      case 'MEDIUM': return 'bg-yellow-400';
      case 'LOW': return 'bg-blue-500';
    }
  }

  copyTemplate(): void {
    const t = (key: string) => this.lang.t(key);
    const lines = [
      `// ${t('decisiontree.template_header')}`,
      `${t('decisiontree.template_date')}: ${this.today}`,
      `${t('decisiontree.template_incident_type')}: ${t('decisiontree.template_ict_incident')}`,
      `${t('decisiontree.template_classification')}: ${t('decisiontree.template_major_ict')}`,
      `${t('decisiontree.template_severity')}: ${this.getSeverityLabel()} (${this.totalSeverity()}/24)`,
      '---',
      `${t('decisiontree.template_critical_functions')}: ${this.getAnswerValue('critical_functions')}`,
      `${t('decisiontree.template_affected_clients')}: ${this.getAnswerValue('clients_affected')}`,
      `${t('decisiontree.template_duration')}: ${this.getAnswerValue('duration')}`,
      `${t('decisiontree.template_data_loss')}: ${this.getAnswerValue('data_loss')}`,
      `${t('decisiontree.template_reputational_impact')}: ${this.getAnswerValue('reputational_impact')}`,
      `${t('decisiontree.template_economic_impact')}: ${this.getAnswerValue('economic_impact')}`,
      `${t('decisiontree.template_geographical_spread')}: ${this.getAnswerValue('geographical_spread')}`,
      '---',
      `${t('decisiontree.template_legal_basis')}: DORA Art. 18, 19`,
      `${t('decisiontree.template_deadline')}: ${t('decisiontree.template_deadline_value')}`
    ];

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
