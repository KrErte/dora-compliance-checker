import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LangService } from '../lang.service';

interface ClassificationQuestion {
  id: string;
  questionKey: string;
  questionTextEn: string;
  questionTextEt: string;
  questionType: string;
  options: string | null;
  category: string;
  helpTextEn: string | null;
  helpTextEt: string | null;
  sortOrder: number;
  dependsOnKey: string | null;
  dependsOnAnswer: string | null;
}

interface ClassificationResult {
  riskLevel: string;
  rationale: string;
  applicableArticles: string[];
  recommendedActions: string[];
  deadline: string;
}

type Phase = 'loading' | 'questionnaire' | 'submitting' | 'result' | 'error';

const CATEGORY_ORDER = ['PROHIBITED', 'HIGH_RISK', 'SAFETY', 'LIMITED', 'EXEMPTION'];

const CATEGORY_META: Record<string, { icon: string; labelEn: string; labelEt: string; color: string; bgClass: string; borderClass: string }> = {
  PROHIBITED: {
    icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
    labelEn: 'Prohibited Practices (Article 5)',
    labelEt: 'Keelatud praktikad (Artikkel 5)',
    color: 'text-red-400',
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/30'
  },
  HIGH_RISK: {
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z',
    labelEn: 'High-Risk AI (Annex III)',
    labelEt: 'Kõrge riskiga TI (Lisa III)',
    color: 'text-orange-400',
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/30'
  },
  SAFETY: {
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    labelEn: 'Safety Component (Article 6(1))',
    labelEt: 'Ohutuskomponent (Artikkel 6(1))',
    color: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30'
  },
  LIMITED: {
    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    labelEn: 'Limited Risk / Transparency (Article 50)',
    labelEt: 'Piiratud risk / Läbipaistvus (Artikkel 50)',
    color: 'text-blue-500',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-500/30'
  },
  EXEMPTION: {
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    labelEn: 'Exemptions (Article 6(3))',
    labelEt: 'Erandid (Artikkel 6(3))',
    color: 'text-blue-600',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200'
  }
};

const RISK_LEVEL_CONFIG: Record<string, { color: string; bgClass: string; borderClass: string; gradient: string; labelEn: string; labelEt: string }> = {
  UNACCEPTABLE: {
    color: 'text-red-400',
    bgClass: 'bg-red-500/20',
    borderClass: 'border-red-500/50',
    gradient: 'from-red-500 to-rose-500',
    labelEn: 'UNACCEPTABLE RISK',
    labelEt: 'LUBAMATU RISK'
  },
  HIGH: {
    color: 'text-orange-400',
    bgClass: 'bg-orange-500/20',
    borderClass: 'border-orange-500/50',
    gradient: 'from-orange-500 to-amber-500',
    labelEn: 'HIGH RISK',
    labelEt: 'KÕRGE RISK'
  },
  LIMITED: {
    color: 'text-blue-500',
    bgClass: 'bg-blue-600/20',
    borderClass: 'border-blue-500/50',
    gradient: 'from-blue-500 to-blue-500',
    labelEn: 'LIMITED RISK',
    labelEt: 'PIIRATUD RISK'
  },
  MINIMAL: {
    color: 'text-blue-600',
    bgClass: 'bg-blue-100',
    borderClass: 'border-blue-500/50',
    gradient: 'from-blue-600 to-green-500',
    labelEn: 'MINIMAL RISK',
    labelEt: 'MINIMAALNE RISK'
  }
};

@Component({
  selector: 'app-ai-act-classifier',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white">
            {{ lang.l('EL TI seaduse riskiklassifitseerimine', 'EU AI Act Risk Classification') }}
          </h1>
          <p class="text-sm text-slate-400 mt-1">
            {{ lang.l('Määra oma tehisintellektisüsteemi riskitase', 'Determine the risk level of your AI system') }}
          </p>
        </div>
        <a [routerLink]="['/ai-systems', systemId()]"
           class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-white hover:border-slate-300 transition-all text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          {{ lang.l('Tagasi süsteemi juurde', 'Back to AI System') }}
        </a>
      </div>

      <!-- Loading State -->
      @if (phase() === 'loading') {
        <div class="flex flex-col items-center justify-center py-24">
          <div class="w-10 h-10 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p class="text-sm text-slate-400">{{ lang.l('Laadin küsimusi...', 'Loading questions...') }}</p>
        </div>
      }

      <!-- Error State -->
      @if (phase() === 'error') {
        <div class="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
          <svg class="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <h3 class="text-lg font-semibold text-white mb-2">{{ lang.l('Viga küsimuste laadimisel', 'Error loading questions') }}</h3>
          <p class="text-sm text-slate-400 mb-6">{{ errorMessage() }}</p>
          <button (click)="loadQuestions()" class="px-5 py-2.5 rounded-xl bg-blue-100 text-blue-600 border border-blue-200 hover:bg-blue-600/30 transition-all text-sm font-medium">
            {{ lang.l('Proovi uuesti', 'Try again') }}
          </button>
        </div>
      }

      <!-- Questionnaire -->
      @if (phase() === 'questionnaire') {
        <!-- Progress Bar -->
        <div class="bg-white backdrop-blur-sm rounded-2xl border border-slate-200 p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-slate-600">
              {{ lang.l('Küsimus', 'Question') }} {{ currentVisibleIndex() + 1 }} / {{ visibleQuestions().length }}
            </span>
            <span class="text-xs text-slate-500">
              {{ progressPercent() }}%
            </span>
          </div>
          <div class="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden">
            <div class="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out"
                 [style.width.%]="progressPercent()"></div>
          </div>
        </div>

        <!-- Category Header -->
        @if (currentCategoryMeta(); as cat) {
          <div class="flex items-center gap-3 px-1">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center {{ cat.bgClass }} border {{ cat.borderClass }}">
              <svg class="w-4 h-4 {{ cat.color }}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="cat.icon"/>
              </svg>
            </div>
            <span class="text-sm font-semibold {{ cat.color }}">
              {{ lang.l(cat.labelEt, cat.labelEn) }}
            </span>
          </div>
        }

        <!-- Question Card -->
        @if (currentQuestion(); as q) {
          <div class="bg-white backdrop-blur-sm rounded-2xl border border-slate-200 p-6 space-y-6 animate-fade-in">
            <!-- Question Text -->
            <div>
              <h2 class="text-lg font-semibold text-white leading-relaxed">
                {{ lang.l(q.questionTextEt, q.questionTextEn) }}
              </h2>
              @if (getHelpText(q)) {
                <div class="mt-3 flex gap-2.5 p-3 rounded-xl bg-white border border-slate-200">
                  <svg class="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p class="text-sm text-slate-400 leading-relaxed">{{ getHelpText(q) }}</p>
                </div>
              }
            </div>

            <!-- YES / NO Buttons -->
            <div class="grid grid-cols-2 gap-4">
              <button (click)="answer('YES')"
                      class="group relative p-5 rounded-xl border-2 transition-all duration-300 text-center"
                      [class]="answers()[q.questionKey] === 'YES'
                        ? 'border-blue-500/70 bg-blue-50 shadow-lg shadow-md'
                        : 'border-slate-200 bg-slate-900/30 hover:border-blue-500/40 hover:bg-blue-50'">
                <div class="flex flex-col items-center gap-2">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                       [class]="answers()[q.questionKey] === 'YES' ? 'bg-blue-600/30' : 'bg-slate-700/50 group-hover:bg-blue-100'">
                    <svg class="w-5 h-5 transition-colors"
                         [class]="answers()[q.questionKey] === 'YES' ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'"
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <span class="font-semibold text-sm"
                        [class]="answers()[q.questionKey] === 'YES' ? 'text-blue-600' : 'text-slate-600'">
                    {{ lang.l('JAH', 'YES') }}
                  </span>
                </div>
              </button>

              <button (click)="answer('NO')"
                      class="group relative p-5 rounded-xl border-2 transition-all duration-300 text-center"
                      [class]="answers()[q.questionKey] === 'NO'
                        ? 'border-red-500/70 bg-red-500/15 shadow-lg shadow-red-500/10'
                        : 'border-slate-200 bg-slate-900/30 hover:border-red-500/40 hover:bg-red-500/5'">
                <div class="flex flex-col items-center gap-2">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                       [class]="answers()[q.questionKey] === 'NO' ? 'bg-red-500/30' : 'bg-slate-700/50 group-hover:bg-red-500/20'">
                    <svg class="w-5 h-5 transition-colors"
                         [class]="answers()[q.questionKey] === 'NO' ? 'text-red-400' : 'text-slate-400 group-hover:text-red-400'"
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </div>
                  <span class="font-semibold text-sm"
                        [class]="answers()[q.questionKey] === 'NO' ? 'text-red-400' : 'text-slate-600'">
                    {{ lang.l('EI', 'NO') }}
                  </span>
                </div>
              </button>
            </div>

            <!-- Navigation -->
            <div class="flex items-center justify-between pt-2">
              <button (click)="prevQuestion()"
                      [disabled]="currentVisibleIndex() === 0"
                      class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                      [class]="currentVisibleIndex() === 0
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-slate-600 hover:text-white bg-slate-700/30 hover:bg-slate-100 border border-slate-200'">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                {{ lang.l('Eelmine', 'Previous') }}
              </button>

              @if (isLastQuestion()) {
                <button (click)="submitClassification()"
                        [disabled]="!allVisibleAnswered()"
                        class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        [class]="allVisibleAnswered()
                          ? 'bg-blue-600 text-slate-900 hover:shadow-lg hover:shadow-lg'
                          : 'bg-slate-700/30 text-slate-500 cursor-not-allowed border border-slate-200'">
                  {{ lang.l('Klassifitseeri', 'Classify') }}
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </button>
              } @else {
                <button (click)="nextQuestion()"
                        [disabled]="!currentAnswered()"
                        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                        [class]="currentAnswered()
                          ? 'bg-blue-100 text-blue-600 border border-blue-200 hover:bg-blue-600/30'
                          : 'bg-slate-700/30 text-slate-500 cursor-not-allowed border border-slate-200'">
                  {{ lang.l('Jargmine', 'Next') }}
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              }
            </div>
          </div>
        }

        <!-- Questions Overview (dots) -->
        <div class="bg-white backdrop-blur-sm rounded-2xl border border-slate-200 p-4">
          <div class="flex flex-wrap gap-2 justify-center">
            @for (q of visibleQuestions(); track q.questionKey; let i = $index) {
              <button (click)="goToQuestion(i)"
                      class="w-3 h-3 rounded-full transition-all duration-300"
                      [class]="i === currentVisibleIndex()
                        ? 'bg-blue-500 ring-2 ring-blue-500/30 scale-125'
                        : answers()[q.questionKey]
                          ? 'bg-blue-600/40 hover:bg-blue-600/60'
                          : 'bg-slate-600/50 hover:bg-slate-500/50'"
                      [title]="(i + 1) + '. ' + lang.l(q.questionTextEt, q.questionTextEn)">
              </button>
            }
          </div>
        </div>
      }

      <!-- Submitting State -->
      @if (phase() === 'submitting') {
        <div class="flex flex-col items-center justify-center py-24">
          <div class="w-16 h-16 relative mb-6">
            <div class="absolute inset-0 border-2 border-blue-200 rounded-full"></div>
            <div class="absolute inset-0 border-2 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
            <svg class="absolute inset-3 w-10 h-10 text-blue-600/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <p class="text-lg font-semibold text-white mb-2">{{ lang.l('Klassifitseerin...', 'Classifying...') }}</p>
          <p class="text-sm text-slate-400">{{ lang.l('Analyysin vastuseid EL TI seaduse alusel', 'Analyzing answers against the EU AI Act') }}</p>
        </div>
      }

      <!-- Result -->
      @if (phase() === 'result' && result()) {
        <div class="space-y-6 animate-fade-in">
          <!-- Risk Level Badge -->
          <div class="relative overflow-hidden rounded-2xl border p-8 text-center {{ getRiskConfig().bgClass }} {{ getRiskConfig().borderClass }}">
            <div class="absolute inset-0 bg-gradient-to-br {{ getRiskConfig().gradient }} opacity-5"></div>
            <div class="relative">
              <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 {{ getRiskConfig().bgClass }} {{ getRiskConfig().color }} border {{ getRiskConfig().borderClass }}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                {{ lang.l('RISKITASE', 'RISK LEVEL') }}
              </div>
              <h2 class="text-3xl font-extrabold {{ getRiskConfig().color }} mb-3">
                {{ lang.l(getRiskConfig().labelEt, getRiskConfig().labelEn) }}
              </h2>
              <p class="text-slate-600 max-w-xl mx-auto leading-relaxed">{{ result()!.rationale }}</p>
            </div>
          </div>

          <!-- Deadline -->
          @if (result()!.deadline) {
            <div class="bg-white backdrop-blur-sm rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <div>
                <p class="text-xs text-slate-500 uppercase tracking-wider font-medium">{{ lang.l('Tahtaeg', 'Deadline') }}</p>
                <p class="text-white font-semibold">{{ result()!.deadline }}</p>
              </div>
            </div>
          }

          <!-- Applicable Articles -->
          @if (result()!.applicableArticles.length > 0) {
            <div class="bg-white backdrop-blur-sm rounded-2xl border border-slate-200 p-6">
              <h3 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
                {{ lang.l('Kohaldatavad artiklid', 'Applicable Articles') }}
              </h3>
              <div class="space-y-2">
                @for (article of result()!.applicableArticles; track article) {
                  <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-200">
                    <svg class="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                    <span class="text-sm text-slate-600">{{ article }}</span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Recommended Actions -->
          @if (result()!.recommendedActions.length > 0) {
            <div class="bg-white backdrop-blur-sm rounded-2xl border border-slate-200 p-6">
              <h3 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
                {{ lang.l('Soovituslikud tegevused', 'Recommended Actions') }}
              </h3>
              <div class="space-y-2">
                @for (action of result()!.recommendedActions; track action; let i = $index) {
                  <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-200">
                    <span class="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 text-xs font-bold text-blue-600">
                      {{ i + 1 }}
                    </span>
                    <span class="text-sm text-slate-600">{{ action }}</span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row items-center gap-3">
            <a [routerLink]="['/ai-systems', systemId()]"
               class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-slate-900 font-semibold text-sm hover:shadow-lg hover:shadow-lg transition-all w-full sm:w-auto justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              {{ lang.l('Tagasi TI susteemi juurde', 'Back to AI System') }}
            </a>
            <button (click)="resetClassification()"
                    class="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-700/30 text-slate-600 hover:text-white border border-slate-200 hover:border-slate-300 transition-all text-sm font-medium w-full sm:w-auto justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {{ lang.l('Klassifitseeri uuesti', 'Classify again') }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fade-in 0.4s ease-out;
    }
  `]
})
export class AiActClassifierComponent implements OnInit {
  lang = inject(LangService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  phase = signal<Phase>('loading');
  errorMessage = signal('');
  allQuestions = signal<ClassificationQuestion[]>([]);
  answers = signal<Record<string, string>>({});
  currentVisibleIndex = signal(0);
  result = signal<ClassificationResult | null>(null);

  systemId = signal('');

  visibleQuestions = computed(() => {
    const questions = this.allQuestions();
    const ans = this.answers();
    return questions.filter(q => {
      if (!q.dependsOnKey) return true;
      return ans[q.dependsOnKey] === q.dependsOnAnswer;
    });
  });

  currentQuestion = computed(() => {
    const visible = this.visibleQuestions();
    const idx = this.currentVisibleIndex();
    return visible[idx] ?? null;
  });

  currentCategoryMeta = computed(() => {
    const q = this.currentQuestion();
    if (!q) return null;
    return CATEGORY_META[q.category] ?? null;
  });

  progressPercent = computed(() => {
    const visible = this.visibleQuestions();
    if (visible.length === 0) return 0;
    const answered = visible.filter(q => this.answers()[q.questionKey]).length;
    return Math.round((answered / visible.length) * 100);
  });

  currentAnswered = computed(() => {
    const q = this.currentQuestion();
    if (!q) return false;
    return !!this.answers()[q.questionKey];
  });

  isLastQuestion = computed(() => {
    return this.currentVisibleIndex() >= this.visibleQuestions().length - 1;
  });

  allVisibleAnswered = computed(() => {
    const visible = this.visibleQuestions();
    const ans = this.answers();
    return visible.every(q => !!ans[q.questionKey]);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.systemId.set(id);
    this.loadQuestions();
  }

  loadQuestions(): void {
    this.phase.set('loading');
    this.http.get<ClassificationQuestion[]>(`/api/ai-systems/${this.systemId()}/classification/questions`).subscribe({
      next: (questions) => {
        const sorted = [...questions].sort((a, b) => {
          const catA = CATEGORY_ORDER.indexOf(a.category);
          const catB = CATEGORY_ORDER.indexOf(b.category);
          if (catA !== catB) return catA - catB;
          return a.sortOrder - b.sortOrder;
        });
        this.allQuestions.set(sorted);
        this.phase.set('questionnaire');
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.error || err?.message || 'Unknown error');
        this.phase.set('error');
      }
    });
  }

  getHelpText(q: ClassificationQuestion): string {
    if (this.lang.currentLang === 'et') {
      return q.helpTextEt || q.helpTextEn || '';
    }
    return q.helpTextEn || '';
  }

  answer(value: 'YES' | 'NO'): void {
    const q = this.currentQuestion();
    if (!q) return;
    const current = { ...this.answers() };
    current[q.questionKey] = value;

    // Clear answers for dependent questions that are no longer visible
    const allQ = this.allQuestions();
    for (const dq of allQ) {
      if (dq.dependsOnKey === q.questionKey && dq.dependsOnAnswer !== value) {
        delete current[dq.questionKey];
      }
    }
    this.answers.set(current);

    // Auto-advance after a brief delay
    if (!this.isLastQuestion()) {
      setTimeout(() => this.nextQuestion(), 350);
    }
  }

  nextQuestion(): void {
    const maxIdx = this.visibleQuestions().length - 1;
    if (this.currentVisibleIndex() < maxIdx) {
      this.currentVisibleIndex.set(this.currentVisibleIndex() + 1);
    }
  }

  prevQuestion(): void {
    if (this.currentVisibleIndex() > 0) {
      this.currentVisibleIndex.set(this.currentVisibleIndex() - 1);
    }
  }

  goToQuestion(index: number): void {
    this.currentVisibleIndex.set(index);
  }

  submitClassification(): void {
    this.phase.set('submitting');
    const payload = { answers: this.answers() };
    this.http.post<ClassificationResult>(`/api/ai-systems/${this.systemId()}/classification/run`, payload).subscribe({
      next: (res) => {
        this.result.set(res);
        this.phase.set('result');
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.error || err?.message || 'Classification failed');
        this.phase.set('error');
      }
    });
  }

  resetClassification(): void {
    this.answers.set({});
    this.currentVisibleIndex.set(0);
    this.result.set(null);
    this.phase.set('questionnaire');
  }

  getRiskConfig() {
    const level = this.result()?.riskLevel ?? 'MINIMAL';
    return RISK_LEVEL_CONFIG[level] ?? RISK_LEVEL_CONFIG['MINIMAL'];
  }
}
