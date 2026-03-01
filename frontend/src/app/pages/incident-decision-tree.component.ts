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
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-blue-500/10 border border-emerald-500/20 p-8">
        <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div class="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-500/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div class="relative">
          <div class="flex items-center gap-2 mb-3">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {{ et ? 'DORA Art. 18' : 'DORA Art. 18' }}
            </span>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              {{ et ? 'Tasuta tööriist' : 'Free Tool' }}
            </span>
          </div>
          <h1 class="text-3xl font-bold text-white mb-2">
            {{ et ? 'IKT intsidendi klassifitseerimise otsustuspuu' : 'ICT Incident Classification Decision Tree' }}
          </h1>
          <p class="text-slate-400 max-w-2xl">
            {{ et ? 'Interaktiivne juhend IKT intsidentide klassifitseerimiseks DORA artikli 18 kriteeriumide alusel. Määrake teavitamiskohustused ja ajakava.' : 'Interactive guide to classify ICT incidents per DORA Article 18 criteria. Determine reporting obligations and timelines.' }}
          </p>
        </div>
      </div>

      <!-- Progress bar -->
      @if (!showResult()) {
        <div>
          <div class="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>{{ et ? 'Edenemine' : 'Progress' }}</span>
            <span>{{ et ? 'Samm' : 'Step' }} {{ currentStepIndex() + 1 }} / {{ steps.length }}</span>
          </div>
          <div class="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500 rounded-full"
                 [style.width.%]="progressPercent()"></div>
          </div>
        </div>
      }

      <div class="flex flex-col lg:flex-row gap-6">

        <!-- Decision path sidebar (breadcrumb) -->
        @if (answers().length > 0) {
          <div class="lg:w-72 shrink-0 order-2 lg:order-1">
            <div class="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-5 sticky top-24">
              <h3 class="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
                {{ et ? 'Otsustee' : 'Decision Path' }}
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
                           [class]="answer.severity >= 2 ? 'text-red-400' : answer.severity === 1 ? 'text-yellow-400' : 'text-emerald-400'">
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
                      <p class="text-[11px] text-slate-500 leading-tight mb-0.5">{{ et ? 'Tulemus' : 'Result' }}</p>
                      <p class="text-xs font-bold" [class]="getClassificationTextClass()">
                        {{ getClassificationLabel() }}
                      </p>
                    </div>
                  </div>
                }
              </div>

              <!-- Severity score -->
              <div class="mt-4 pt-4 border-t border-slate-700/50">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-500">{{ et ? 'Raskusaste skoor' : 'Severity Score' }}</span>
                  <span class="font-bold" [class]="totalSeverity() >= 10 ? 'text-red-400' : totalSeverity() >= 5 ? 'text-yellow-400' : 'text-emerald-400'">
                    {{ totalSeverity() }} / 24
                  </span>
                </div>
                <div class="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-500"
                       [class]="totalSeverity() >= 10 ? 'bg-red-500' : totalSeverity() >= 5 ? 'bg-yellow-500' : 'bg-emerald-500'"
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
            <div class="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-8 transition-all duration-300">
              <!-- Step indicator -->
              <div class="flex items-center gap-3 mb-6">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <span class="text-sm font-bold text-emerald-400">{{ currentStepIndex() + 1 }}</span>
                </div>
                <div>
                  <p class="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                    {{ et ? 'Samm' : 'Step' }} {{ currentStepIndex() + 1 }} {{ et ? '/' : 'of' }} {{ steps.length }}
                  </p>
                  <p class="text-xs text-slate-400">{{ getCurrentStepId() }}</p>
                </div>
              </div>

              <!-- Question -->
              <h2 class="text-xl font-bold text-white mb-2">
                {{ et ? getCurrentStep().question.et : getCurrentStep().question.en }}
              </h2>
              @if (getCurrentStep().description) {
                <p class="text-sm text-slate-400 mb-6">
                  {{ et ? getCurrentStep().description!.et : getCurrentStep().description!.en }}
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
                          {{ et ? option.label.et : option.label.en }}
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
                        class="mt-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                  </svg>
                  {{ et ? 'Tagasi' : 'Go Back' }}
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
                      <svg class="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    }
                  </div>
                  <div>
                    <p class="text-xs uppercase tracking-wider font-medium text-slate-400 mb-1">
                      {{ et ? 'Intsidendi klassifikatsioon' : 'Incident Classification' }}
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
                      {{ et ? 'Tase' : 'Level' }}: {{ getSeverityLabel() }}
                    </span>
                  </div>
                  <div class="px-4 py-2 rounded-xl bg-slate-700/30 border border-slate-600/30">
                    <span class="text-xs text-slate-400">
                      {{ et ? 'Skoor' : 'Score' }}: <span class="font-bold text-white">{{ totalSeverity() }}</span> / 24
                    </span>
                  </div>
                  <div class="px-4 py-2 rounded-xl bg-slate-700/30 border border-slate-600/30">
                    <span class="text-xs text-slate-400">
                      DORA Art. 18
                    </span>
                  </div>
                </div>

                <!-- Severity meter -->
                <div class="bg-slate-900/50 rounded-xl p-4">
                  <div class="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                    <span>{{ et ? 'Kerge' : 'Minor' }}</span>
                    <span>{{ et ? 'Oluline' : 'Significant' }}</span>
                    <span>{{ et ? 'Suur' : 'Major' }}</span>
                  </div>
                  <div class="h-3 bg-slate-800 rounded-full overflow-hidden relative">
                    <div class="absolute inset-0 flex">
                      <div class="flex-1 bg-emerald-500/20 border-r border-slate-700"></div>
                      <div class="flex-1 bg-yellow-500/20 border-r border-slate-700"></div>
                      <div class="flex-1 bg-red-500/20"></div>
                    </div>
                    <div class="absolute top-0 left-0 h-full transition-all duration-700 rounded-full"
                         [class]="totalSeverity() >= 10 ? 'bg-red-500' : totalSeverity() >= 5 ? 'bg-yellow-500' : 'bg-emerald-500'"
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
                <div class="bg-slate-800/50 rounded-2xl border border-red-500/20 p-6">
                  <h3 class="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ et ? 'Kohustuslik teavitamise ajakava' : 'Mandatory Reporting Timeline' }}
                  </h3>
                  <p class="text-xs text-slate-400 mb-5">{{ et ? 'DORA artikkel 19 nõuded suurte intsidentide puhul' : 'DORA Article 19 requirements for major incidents' }}</p>

                  <div class="space-y-4">
                    <!-- Initial notification -->
                    <div class="flex items-start gap-4">
                      <div class="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                        <span class="text-sm font-bold text-red-400">4h</span>
                      </div>
                      <div class="flex-1 pb-4 border-b border-slate-700/50">
                        <p class="text-sm font-semibold text-white">{{ et ? 'Esialgne teavitus' : 'Initial Notification' }}</p>
                        <p class="text-xs text-slate-400 mt-0.5">{{ et ? '4 tunni jooksul peale intsidendi klassifitseerimist suureks IKT intsidendiks' : 'Within 4 hours after classifying the incident as a major ICT-related incident' }}</p>
                        <p class="text-[11px] text-red-400/80 mt-1">DORA Art. 19(4)(a)</p>
                      </div>
                    </div>
                    <!-- Intermediate report -->
                    <div class="flex items-start gap-4">
                      <div class="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center shrink-0">
                        <span class="text-sm font-bold text-yellow-400">72h</span>
                      </div>
                      <div class="flex-1 pb-4 border-b border-slate-700/50">
                        <p class="text-sm font-semibold text-white">{{ et ? 'Vahearuanne' : 'Intermediate Report' }}</p>
                        <p class="text-xs text-slate-400 mt-0.5">{{ et ? '72 tunni jooksul peale esialgset teavitust, uuendus oluliste muutuste korral' : 'Within 72 hours after initial notification, update when significant changes occur' }}</p>
                        <p class="text-[11px] text-yellow-400/80 mt-1">DORA Art. 19(4)(b)</p>
                      </div>
                    </div>
                    <!-- Final report -->
                    <div class="flex items-start gap-4">
                      <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <span class="text-sm font-bold text-emerald-400">1m</span>
                      </div>
                      <div class="flex-1">
                        <p class="text-sm font-semibold text-white">{{ et ? 'Lõpparuanne' : 'Final Report' }}</p>
                        <p class="text-xs text-slate-400 mt-0.5">{{ et ? '1 kuu jooksul peale intsidendi lahendamist, sisaldab juurpõhjuse analüüsi' : 'Within 1 month after the incident is resolved, including root cause analysis' }}</p>
                        <p class="text-[11px] text-emerald-400/80 mt-1">DORA Art. 19(4)(c)</p>
                      </div>
                    </div>
                  </div>
                </div>
              }

              @if (classification() === 'SIGNIFICANT') {
                <div class="bg-slate-800/50 rounded-2xl border border-yellow-500/20 p-6">
                  <h3 class="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    {{ et ? 'Nõutavad toimingud' : 'Required Actions' }}
                  </h3>
                  <p class="text-xs text-slate-400 mb-4">{{ et ? 'Oluliste intsidentide haldamise nõuded' : 'Significant incident management requirements' }}</p>
                  <ul class="space-y-2">
                    <li class="flex items-start gap-2 text-sm text-slate-300">
                      <svg class="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/>
                      </svg>
                      {{ et ? 'Logida siseregistris ja jälgida pidevalt' : 'Log in internal register and monitor continuously' }}
                    </li>
                    <li class="flex items-start gap-2 text-sm text-slate-300">
                      <svg class="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/>
                      </svg>
                      {{ et ? 'Jälgida eskaleerumise kriteeriume (suureks intsidendiks muutumine)' : 'Monitor escalation criteria (potential upgrade to major incident)' }}
                    </li>
                    <li class="flex items-start gap-2 text-sm text-slate-300">
                      <svg class="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/>
                      </svg>
                      {{ et ? 'Koostada sisearuanne ja juurpõhjuse analüüs' : 'Prepare internal report and root cause analysis' }}
                    </li>
                    <li class="flex items-start gap-2 text-sm text-slate-300">
                      <svg class="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/>
                      </svg>
                      {{ et ? 'Teatada juhtkonnale' : 'Notify management body' }}
                    </li>
                  </ul>
                </div>
              }

              @if (classification() === 'MINOR') {
                <div class="bg-slate-800/50 rounded-2xl border border-emerald-500/20 p-6">
                  <h3 class="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ et ? 'Soovituslikud toimingud' : 'Recommended Actions' }}
                  </h3>
                  <p class="text-xs text-slate-400 mb-4">{{ et ? 'Kergete intsidentide haldamine' : 'Minor incident management' }}</p>
                  <ul class="space-y-2">
                    <li class="flex items-start gap-2 text-sm text-slate-300">
                      <svg class="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/>
                      </svg>
                      {{ et ? 'Registreerida sisemises intsidendi logis' : 'Record in internal incident log' }}
                    </li>
                    <li class="flex items-start gap-2 text-sm text-slate-300">
                      <svg class="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/>
                      </svg>
                      {{ et ? 'Sisemine käsitlemine standardi protseduuride alusel' : 'Handle internally per standard procedures' }}
                    </li>
                    <li class="flex items-start gap-2 text-sm text-slate-300">
                      <svg class="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/>
                      </svg>
                      {{ et ? 'Regulaatorile teavitamine pole kohustuslik' : 'No mandatory reporting to competent authority' }}
                    </li>
                  </ul>
                </div>
              }

              <!-- Initial notification template (major only) -->
              @if (classification() === 'MAJOR') {
                <div class="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                      <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      {{ et ? 'Esialgse teavituse mall' : 'Initial Notification Template' }}
                    </h3>
                    <button type="button" (click)="copyTemplate()"
                            class="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors">
                      {{ copied() ? (et ? 'Kopeeritud!' : 'Copied!') : (et ? 'Kopeeri' : 'Copy') }}
                    </button>
                  </div>

                  <div class="bg-slate-900/70 rounded-xl p-5 font-mono text-xs text-slate-300 leading-relaxed space-y-3 border border-slate-700/30">
                    <p class="text-slate-500">// {{ et ? 'DORA Art. 19 esialgne teavitus' : 'DORA Art. 19 Initial Notification' }}</p>
                    <p><span class="text-cyan-400">{{ et ? 'Kuupaev' : 'Date' }}:</span> {{ today }}</p>
                    <p><span class="text-cyan-400">{{ et ? 'Intsidendi tüüp' : 'Incident Type' }}:</span> {{ et ? 'IKT intsident' : 'ICT-related incident' }}</p>
                    <p><span class="text-cyan-400">{{ et ? 'Klassifikatsioon' : 'Classification' }}:</span> {{ et ? 'Suur IKT intsident' : 'Major ICT-related incident' }}</p>
                    <p><span class="text-cyan-400">{{ et ? 'Raskusaste' : 'Severity' }}:</span> {{ getSeverityLabel() }} ({{ totalSeverity() }}/24)</p>
                    <p class="text-slate-500">---</p>
                    <p><span class="text-cyan-400">{{ et ? 'Kriitilised funktsioonid' : 'Critical Functions' }}:</span> {{ getAnswerValue('critical_functions') }}</p>
                    <p><span class="text-cyan-400">{{ et ? 'Mõjutatud kliendid' : 'Affected Clients' }}:</span> {{ getAnswerValue('clients_affected') }}</p>
                    <p><span class="text-cyan-400">{{ et ? 'Kestus' : 'Duration' }}:</span> {{ getAnswerValue('duration') }}</p>
                    <p><span class="text-cyan-400">{{ et ? 'Andmeleke' : 'Data Loss' }}:</span> {{ getAnswerValue('data_loss') }}</p>
                    <p><span class="text-cyan-400">{{ et ? 'Mainemõju' : 'Reputational Impact' }}:</span> {{ getAnswerValue('reputational_impact') }}</p>
                    <p><span class="text-cyan-400">{{ et ? 'Majanduslik mõju' : 'Economic Impact' }}:</span> {{ getAnswerValue('economic_impact') }}</p>
                    <p><span class="text-cyan-400">{{ et ? 'Geograafiline ulatus' : 'Geographical Spread' }}:</span> {{ getAnswerValue('geographical_spread') }}</p>
                    <p class="text-slate-500">---</p>
                    <p><span class="text-cyan-400">{{ et ? 'Õiguslik alus' : 'Legal Basis' }}:</span> DORA Art. 18, 19</p>
                    <p><span class="text-cyan-400">{{ et ? 'Tähtaeg' : 'Deadline' }}:</span> {{ et ? '4 tundi peale klassifitseerimist' : '4 hours after classification' }}</p>
                  </div>
                </div>
              }

              <!-- Recommended next steps -->
              <div class="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
                <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                  {{ et ? 'Soovituslikud järgmised sammud' : 'Recommended Next Steps' }}
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a routerLink="/incident-reporting"
                     class="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <svg class="w-4.5 h-4.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-white group-hover:text-emerald-300 transition-colors">
                          {{ et ? 'Intsidentide aruandlus' : 'Incident Reporting' }}
                        </p>
                        <p class="text-[11px] text-slate-500">{{ et ? 'Alusta ametlikku aruannet' : 'Start official report' }}</p>
                      </div>
                    </div>
                  </a>
                  <a routerLink="/incident-simulator"
                     class="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all group">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                        <svg class="w-4.5 h-4.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                          {{ et ? 'Intsidendi simulaator' : 'Incident Simulator' }}
                        </p>
                        <p class="text-[11px] text-slate-500">{{ et ? 'Simuleeri reageerimist' : 'Simulate response' }}</p>
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
                          {{ et ? 'Paranduste jälgija' : 'Remediation Tracker' }}
                        </p>
                        <p class="text-[11px] text-slate-500">{{ et ? 'Jälgi parandusi' : 'Track fixes' }}</p>
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
                          {{ et ? 'DORA hindamine' : 'DORA Assessment' }}
                        </p>
                        <p class="text-[11px] text-slate-500">{{ et ? 'Hinda vastavust' : 'Evaluate compliance' }}</p>
                      </div>
                    </div>
                  </a>
                </div>
              </div>

              <!-- Reset button -->
              <div class="flex justify-center">
                <button type="button" (click)="reset()"
                        class="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-sm font-medium text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-700 transition-all">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  {{ et ? 'Alusta uuesti' : 'Start Over' }}
                </button>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Reference section -->
      <div class="bg-slate-800/30 rounded-2xl border border-slate-700/30 p-6">
        <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
          {{ et ? 'Viited ja õiguslikud alused' : 'References & Legal Basis' }}
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 rounded-xl bg-slate-900/30 border border-slate-700/20">
            <h4 class="text-sm font-semibold text-emerald-400 mb-2">DORA Art. 18 -- {{ et ? 'Klassifitseerimine' : 'Classification' }}</h4>
            <p class="text-xs text-slate-400 leading-relaxed">
              {{ et ? 'Finantsüksused klassifitseerivad IKT intsidente ja määravad nende mõju, kasutades artiklis 18 sätestatud kriteeriume: mõjutatud kliendid, kestus, geograafiline ulatus, andmekaotus, kriitiliste teenuste mõjutatus, majanduslik mõju.' : 'Financial entities shall classify ICT-related incidents and determine their impact using the criteria set out in Article 18: affected clients, duration, geographical spread, data losses, criticality of services affected, economic impact.' }}
            </p>
          </div>
          <div class="p-4 rounded-xl bg-slate-900/30 border border-slate-700/20">
            <h4 class="text-sm font-semibold text-cyan-400 mb-2">EBA RTS/ITS -- {{ et ? 'Künnised' : 'Thresholds' }}</h4>
            <p class="text-xs text-slate-400 leading-relaxed">
              {{ et ? 'Euroopa Pangandusjärelevalve regulatiivsed tehnilised standardid (RTS) ja rakendusstandardid (ITS) intsidentide teavitamise künniste kohta täpsustavad DORA artikli 18 kriteeriume ja kehtestavad konkreetsed kvantitatiivsed künnised.' : 'The European Banking Authority regulatory technical standards (RTS) and implementing technical standards (ITS) on incident reporting thresholds further specify the DORA Article 18 criteria and establish specific quantitative thresholds.' }}
            </p>
          </div>
          <div class="p-4 rounded-xl bg-slate-900/30 border border-slate-700/20">
            <h4 class="text-sm font-semibold text-purple-400 mb-2">DORA Art. 19 -- {{ et ? 'Teavitamine' : 'Reporting' }}</h4>
            <p class="text-xs text-slate-400 leading-relaxed">
              {{ et ? 'Suurtest IKT intsidentidest tuleb teatada pädevale asutusele: esialgne teavitus 4 tunni jooksul, vahearuanne 72 tunni jooksul, lõpparuanne 1 kuu jooksul peale lahendamist.' : 'Major ICT-related incidents must be reported to the competent authority: initial notification within 4 hours, intermediate report within 72 hours, final report within 1 month after resolution.' }}
            </p>
          </div>
          <div class="p-4 rounded-xl bg-slate-900/30 border border-slate-700/20">
            <h4 class="text-sm font-semibold text-slate-300 mb-2">{{ et ? 'Seotud tööriistad' : 'Related Tools' }}</h4>
            <div class="space-y-2">
              <a routerLink="/incident-reporting" class="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
                {{ et ? 'DORA intsidentide aruandluse tööriist' : 'DORA Incident Reporting Tool' }}
              </a>
              <a routerLink="/incident-simulator" class="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
                {{ et ? 'IKT intsidendi simulaator' : 'ICT Incident Simulator' }}
              </a>
              <a routerLink="/assessment" class="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
                {{ et ? 'DORA enesehindamine' : 'DORA Self-Assessment' }}
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
    return label ? (this.et ? label.et : label.en) : id;
  }

  selectOption(option: { label: { et: string; en: string }; value: string; severity: number; nextStep: string | null }): void {
    const step = this.getCurrentStep();
    const record: AnswerRecord = {
      stepId: step.id,
      question: this.et ? step.question.et : step.question.en,
      answer: this.et ? option.label.et : option.label.en,
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
    return answer ? answer.answer : (this.et ? 'Pole vastatud' : 'Not answered');
  }

  getClassificationLabel(): string {
    switch (this.classification()) {
      case 'MAJOR': return this.et ? 'Suur intsident' : 'Major Incident';
      case 'SIGNIFICANT': return this.et ? 'Oluline intsident' : 'Significant Incident';
      case 'MINOR': return this.et ? 'Kerge intsident' : 'Minor Incident';
    }
  }

  getClassificationDescription(): string {
    switch (this.classification()) {
      case 'MAJOR': return this.et ? 'Kohustuslik teavitamine pädevale asutusele DORA artikkel 19 alusel' : 'Mandatory reporting to competent authority under DORA Article 19';
      case 'SIGNIFICANT': return this.et ? 'Kohustuslik logimine ja jälgimine, juhtkonna teavitamine' : 'Mandatory logging and monitoring, management body notification';
      case 'MINOR': return this.et ? 'Sisemine käsitlemine, regulaatorile teavitamine pole kohustuslik' : 'Internal handling only, no mandatory reporting to authority';
    }
  }

  getSeverityLabel(): string {
    switch (this.severityLevel()) {
      case 'CRITICAL': return this.et ? 'Kriitiline' : 'Critical';
      case 'HIGH': return this.et ? 'Kõrge' : 'High';
      case 'MEDIUM': return this.et ? 'Keskmine' : 'Medium';
      case 'LOW': return this.et ? 'Madal' : 'Low';
    }
  }

  getOptionClass(severity: number): string {
    switch (severity) {
      case 0: return 'bg-slate-800/50 border-slate-700/50 hover:border-emerald-500/40 hover:bg-emerald-500/5';
      case 1: return 'bg-slate-800/50 border-slate-700/50 hover:border-yellow-500/40 hover:bg-yellow-500/5';
      case 2: return 'bg-slate-800/50 border-slate-700/50 hover:border-orange-500/40 hover:bg-orange-500/5';
      case 3: return 'bg-slate-800/50 border-slate-700/50 hover:border-red-500/40 hover:bg-red-500/5';
      default: return 'bg-slate-800/50 border-slate-700/50';
    }
  }

  getOptionIconClass(severity: number): string {
    switch (severity) {
      case 0: return 'bg-emerald-500/10 text-emerald-400';
      case 1: return 'bg-yellow-500/10 text-yellow-400';
      case 2: return 'bg-orange-500/10 text-orange-400';
      case 3: return 'bg-red-500/10 text-red-400';
      default: return 'bg-slate-700/50 text-slate-400';
    }
  }

  getSeverityDotClass(severity: number): string {
    switch (severity) {
      case 0: return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
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
      case 'MINOR': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    }
  }

  getClassificationTextClass(): string {
    switch (this.classification()) {
      case 'MAJOR': return 'text-red-400';
      case 'SIGNIFICANT': return 'text-yellow-400';
      case 'MINOR': return 'text-emerald-400';
    }
  }

  getResultCardClass(): string {
    switch (this.classification()) {
      case 'MAJOR': return 'bg-red-500/5 border-red-500/20';
      case 'SIGNIFICANT': return 'bg-yellow-500/5 border-yellow-500/20';
      case 'MINOR': return 'bg-emerald-500/5 border-emerald-500/20';
    }
  }

  getResultIconBgClass(): string {
    switch (this.classification()) {
      case 'MAJOR': return 'bg-red-500/10 border border-red-500/30';
      case 'SIGNIFICANT': return 'bg-yellow-500/10 border border-yellow-500/30';
      case 'MINOR': return 'bg-emerald-500/10 border border-emerald-500/30';
    }
  }

  getSeverityBadgeClass(): string {
    switch (this.severityLevel()) {
      case 'CRITICAL': return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'HIGH': return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      case 'MEDIUM': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'LOW': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    }
  }

  getSeverityDotColorClass(): string {
    switch (this.severityLevel()) {
      case 'CRITICAL': return 'bg-red-400';
      case 'HIGH': return 'bg-orange-400';
      case 'MEDIUM': return 'bg-yellow-400';
      case 'LOW': return 'bg-emerald-400';
    }
  }

  copyTemplate(): void {
    const lines = [
      `// DORA Art. 19 ${this.et ? 'Esialgne teavitus' : 'Initial Notification'}`,
      `${this.et ? 'Kuupaev' : 'Date'}: ${this.today}`,
      `${this.et ? 'Intsidendi tüüp' : 'Incident Type'}: ${this.et ? 'IKT intsident' : 'ICT-related incident'}`,
      `${this.et ? 'Klassifikatsioon' : 'Classification'}: ${this.et ? 'Suur IKT intsident' : 'Major ICT-related incident'}`,
      `${this.et ? 'Raskusaste' : 'Severity'}: ${this.getSeverityLabel()} (${this.totalSeverity()}/24)`,
      '---',
      `${this.et ? 'Kriitilised funktsioonid' : 'Critical Functions'}: ${this.getAnswerValue('critical_functions')}`,
      `${this.et ? 'Mõjutatud kliendid' : 'Affected Clients'}: ${this.getAnswerValue('clients_affected')}`,
      `${this.et ? 'Kestus' : 'Duration'}: ${this.getAnswerValue('duration')}`,
      `${this.et ? 'Andmeleke' : 'Data Loss'}: ${this.getAnswerValue('data_loss')}`,
      `${this.et ? 'Mainemõju' : 'Reputational Impact'}: ${this.getAnswerValue('reputational_impact')}`,
      `${this.et ? 'Majanduslik mõju' : 'Economic Impact'}: ${this.getAnswerValue('economic_impact')}`,
      `${this.et ? 'Geograafiline ulatus' : 'Geographical Spread'}: ${this.getAnswerValue('geographical_spread')}`,
      '---',
      `${this.et ? 'Õiguslik alus' : 'Legal Basis'}: DORA Art. 18, 19`,
      `${this.et ? 'Tähtaeg' : 'Deadline'}: ${this.et ? '4 tundi peale klassifitseerimist' : '4 hours after classification'}`
    ];

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
