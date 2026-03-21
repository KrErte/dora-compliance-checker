import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { LangService } from '../lang.service';
import { SubscriptionService } from '../services/subscription.service';

interface Scenario {
  id: string;
  name: string;
  nameEt: string;
  icon: string;
  tier: string;
  doraArticles: string[];
  description: string;
  descriptionEt: string;
  locked: boolean;
}

interface QuestionData {
  assessment: string;
  assessmentEt: string;
  weaknessFound: boolean;
  weaknessDetail: string | null;
  weaknessDetailEt: string | null;
  severityScore: number;
  question: string;
  questionEt: string;
  articleReference: string;
  questionNumber: number;
  isFollowUp: boolean;
  hint: string | null;
  hintEt: string | null;
  auditComplete: boolean;
}

interface QaEntry {
  questionNumber: number;
  answer: string;
  assessment: string;
  weaknessFound: boolean;
  weaknessDetail: string | null;
  severityScore: number;
  articleReference: string;
}

interface BriefItem {
  weakness: string;
  weaknessEt: string;
  article: string;
  severity: string;
  evidence: string;
  evidenceEt: string;
}

interface PlaybookStep {
  step: number;
  action: string;
  actionEt: string;
  timeline: string;
  effort: string;
  article: string;
}

interface StrengthItem {
  area: string;
  areaEt: string;
  detail: string;
  detailEt: string;
}

interface Verdict {
  fineRiskScore: number;
  penaltyRangeMin: number;
  penaltyRangeMax: number;
  grade: string;
  summary: string;
  summaryEt: string;
  prosecutionBrief: BriefItem[];
  defensePlaybook: PlaybookStep[];
  strengths: StrengthItem[];
  qaLog: QaEntry[];
}

interface HistoryEntry {
  sessionId: string;
  scenarioId: string;
  difficulty: string;
  grade: string;
  fineRiskScore: number;
  completedAt: string;
  totalQuestions: number;
  weaknessCount: number;
}

type Screen = 'setup' | 'questioning' | 'awaiting-verdict' | 'verdict' | 'history';

@Component({
  selector: 'app-prosecutor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto">

      <!-- ==================== SETUP SCREEN ==================== -->
      @if (screen() === 'setup') {
        <!-- Header -->
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-600/10 to-violet-500/10 border border-indigo-500/20 p-8 mb-8">
          <div class="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div class="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-violet-500/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2"></div>
          <div class="relative">
            <div class="flex items-center gap-2 mb-3">
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                {{ lang.t('prosecutor.badge_ai') }}
              </span>
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
                {{ lang.t('prosecutor.badge_regulator') }}
              </span>
            </div>
            <h1 class="text-3xl font-bold text-white mb-2">{{ lang.t('prosecutor.title') }}</h1>
            <p class="text-slate-400 max-w-2xl">{{ lang.t('prosecutor.subtitle') }}</p>
          </div>
        </div>

        <!-- History Link -->
        @if (history().length > 0) {
          <div class="flex justify-end mb-6">
            <button (click)="screen.set('history')"
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm hover:border-indigo-500/30 transition-all">
              <span class="material-symbols-outlined text-base text-indigo-400">history</span>
              {{ lang.t('prosecutor.past_audits') }} ({{ history().length }})
            </button>
          </div>
        }

        <!-- Loading -->
        @if (loading()) {
          <div class="flex items-center justify-center py-20">
            <svg class="w-8 h-8 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          </div>
        }

        <!-- Error -->
        @if (error()) {
          <div class="glass-card p-4 mb-6 border-red-500/30 bg-red-500/5">
            <p class="text-red-400 text-sm">{{ error() }}</p>
          </div>
        }

        <!-- Scenario Grid -->
        @if (!loading() && scenarios().length > 0) {
          <h2 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-base text-indigo-400">folder_open</span>
            {{ lang.t('prosecutor.select_scenario') }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            @for (scenario of scenarios(); track scenario.id) {
              <div class="glass-card p-5 relative overflow-hidden group transition-all duration-300"
                   [class]="scenario.locked ? 'cursor-default opacity-80'
                          : selectedScenario() === scenario.id ? 'cursor-pointer border-indigo-500/50 ring-1 ring-indigo-500/30 bg-indigo-500/5'
                          : 'cursor-pointer hover:border-indigo-500/30 hover:-translate-y-0.5'"
                   (click)="!scenario.locked && selectedScenario.set(scenario.id)">
                <!-- Locked overlay -->
                @if (scenario.locked) {
                  <div class="absolute inset-0 bg-slate-900/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3 rounded-xl">
                    <span class="material-symbols-outlined text-3xl text-slate-500">lock</span>
                    <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {{ scenario.tier === 'ENTERPRISE' ? 'Enterprise' : 'Standard' }}
                    </span>
                    <a routerLink="/pricing" class="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                      {{ lang.t('prosecutor.upgrade') }}
                    </a>
                  </div>
                }

                <div class="flex items-start gap-3 mb-3">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-500/15">
                    <span class="material-symbols-outlined text-xl text-indigo-400">{{ scenario.icon }}</span>
                  </div>
                  <div class="min-w-0">
                    <h3 class="font-bold text-slate-700 text-sm leading-tight">
                      {{ lang.lang() === 'et' ? scenario.nameEt : scenario.name }}
                    </h3>
                    <div class="flex items-center gap-1.5 mt-1">
                      <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                            [class]="scenario.tier === 'FREE' ? 'bg-blue-50 text-blue-600' : scenario.tier === 'ENTERPRISE' ? 'bg-purple-500/15 text-purple-400' : 'bg-amber-500/15 text-amber-400'">
                        {{ getTierLabel(scenario.tier) }}
                      </span>
                    </div>
                  </div>
                </div>

                <p class="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-3">
                  {{ lang.lang() === 'et' ? scenario.descriptionEt : scenario.description }}
                </p>

                <div class="flex flex-wrap gap-1">
                  @for (art of scenario.doraArticles; track art) {
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-700/50 text-slate-400">{{ art }}</span>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Difficulty Selector -->
          @if (selectedScenario()) {
            <div class="glass-card p-6 mb-6">
              <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-base text-indigo-400">tune</span>
                {{ lang.t('prosecutor.select_difficulty') }}
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                @for (diff of difficulties; track diff.id) {
                  <button (click)="selectedDifficulty.set(diff.id)"
                          class="p-4 rounded-xl border text-left transition-all duration-200"
                          [class]="selectedDifficulty() === diff.id
                            ? 'bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/30'
                            : 'bg-white border-slate-200 hover:border-indigo-500/20'">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="material-symbols-outlined text-lg" [class]="diff.color">{{ diff.icon }}</span>
                      <span class="text-sm font-bold text-slate-700">{{ lang.lang() === 'et' ? diff.labelEt : diff.label }}</span>
                    </div>
                    <p class="text-xs text-slate-500">{{ diff.questions }} {{ lang.t('prosecutor.questions') }}</p>
                    <p class="text-[10px] text-slate-600 mt-1">{{ lang.lang() === 'et' ? diff.descEt : diff.desc }}</p>
                  </button>
                }
              </div>
            </div>

            <!-- Start Button -->
            <button (click)="startAudit()"
                    [disabled]="loading()"
                    class="w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-0.5">
              @if (loading()) {
                <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              } @else {
                <span class="material-symbols-outlined text-lg">gavel</span>
              }
              {{ lang.t('prosecutor.begin_audit') }}
            </button>
          }
        }
      }

      <!-- ==================== QUESTIONING SCREEN ==================== -->
      @if (screen() === 'questioning') {
        <!-- Progress Header -->
        <div class="glass-card p-4 mb-4">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <span class="material-symbols-outlined text-lg text-indigo-400">gavel</span>
              </div>
              <div>
                <p class="text-xs text-slate-500 uppercase tracking-wider font-medium">{{ lang.t('prosecutor.question_label') }} {{ questionsAsked() }}/{{ totalQuestions() }}</p>
                <p class="text-sm font-semibold text-slate-700">{{ lang.t('prosecutor.audit_in_progress') }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <!-- Weakness counter -->
              @if (weaknessCount() > 0) {
                <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30">
                  <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <span class="text-xs font-bold text-red-400">{{ weaknessCount() }} {{ lang.t('prosecutor.weaknesses') }}</span>
                </div>
              }
            </div>
          </div>
          <!-- Progress bar -->
          <div class="h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full transition-all duration-500"
                 [style.width.%]="progressPct()"></div>
          </div>
        </div>

        <!-- Assessment of previous answer -->
        @if (currentQuestion()?.assessment) {
          <div class="glass-card p-4 mb-4 border-l-4 animate-fade-in-up"
               [class]="currentQuestion()!.weaknessFound ? 'border-l-red-500 bg-red-500/5' : 'border-l-blue-600 bg-blue-50'">
            <div class="flex items-start gap-3">
              <span class="material-symbols-outlined text-lg mt-0.5"
                    [class]="currentQuestion()!.weaknessFound ? 'text-red-400' : 'text-blue-600'">
                {{ currentQuestion()!.weaknessFound ? 'warning' : 'check_circle' }}
              </span>
              <div>
                <p class="text-xs font-bold uppercase tracking-wider mb-1"
                   [class]="currentQuestion()!.weaknessFound ? 'text-red-400' : 'text-blue-600'">
                  {{ lang.t('prosecutor.prev_assessment') }}
                </p>
                <p class="text-sm text-slate-600 leading-relaxed">
                  {{ lang.lang() === 'et' ? currentQuestion()!.assessmentEt : currentQuestion()!.assessment }}
                </p>
                @if (currentQuestion()!.weaknessFound && currentQuestion()!.weaknessDetail) {
                  <div class="mt-2 flex items-center gap-2">
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400">
                      {{ lang.t('prosecutor.severity') }}: {{ currentQuestion()!.severityScore }}/10
                    </span>
                    <span class="text-xs text-slate-500">
                      {{ lang.lang() === 'et' ? currentQuestion()!.weaknessDetailEt : currentQuestion()!.weaknessDetail }}
                    </span>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <!-- Question Card -->
        <div class="glass-card p-6 mb-4 animate-fade-in-up">
          <div class="bg-white rounded-xl p-5 border border-indigo-500/20 mb-5">
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <span class="material-symbols-outlined text-lg text-indigo-400">record_voice_over</span>
              </div>
              <div>
                @if (currentQuestion()?.isFollowUp) {
                  <span class="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 mb-2">
                    {{ lang.t('prosecutor.follow_up') }}
                  </span>
                }
                <p class="text-slate-700 leading-relaxed">
                  {{ lang.lang() === 'et' ? currentQuestion()?.questionEt : currentQuestion()?.question }}
                </p>
                <div class="flex items-center gap-2 mt-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-400">
                    {{ currentQuestion()?.articleReference }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Hint -->
          @if (currentQuestion()?.hint && showHint()) {
            <div class="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 mb-4">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-sm text-amber-400">lightbulb</span>
                <p class="text-xs text-amber-300">
                  {{ lang.lang() === 'et' ? currentQuestion()!.hintEt : currentQuestion()!.hint }}
                </p>
              </div>
            </div>
          }
          @if (currentQuestion()?.hint && !showHint()) {
            <button (click)="showHint.set(true)"
                    class="text-xs text-indigo-400 hover:text-indigo-300 mb-4 flex items-center gap-1 transition-colors">
              <span class="material-symbols-outlined text-sm">lightbulb</span>
              {{ lang.t('prosecutor.show_hint') }}
            </button>
          }

          <!-- Answer Textarea -->
          <textarea [(ngModel)]="answerText"
                    [placeholder]="lang.t('prosecutor.answer_placeholder')"
                    rows="6"
                    maxlength="5000"
                    class="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 resize-none mb-3"></textarea>
          <div class="flex items-center justify-between mb-4">
            <p class="text-[10px] text-slate-600">{{ answerText.length }}/5000</p>
          </div>

          <!-- Submit Answer -->
          <button (click)="submitAnswer()"
                  [disabled]="submitting() || !answerText.trim()"
                  class="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2"
                  [class]="submitting() ? 'bg-slate-700 text-slate-400 cursor-wait'
                         : !answerText.trim() ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                         : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-0.5'">
            @if (submitting()) {
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            } @else {
              <span class="material-symbols-outlined text-lg">send</span>
            }
            {{ lang.t('prosecutor.submit_answer') }}
          </button>
        </div>

        <!-- Q&A History (collapsible) -->
        @if (qaHistory().length > 0) {
          <div class="glass-card p-4">
            <button (click)="showHistory.set(!showHistory())"
                    class="flex items-center justify-between w-full text-left">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span class="material-symbols-outlined text-sm text-indigo-400">history</span>
                {{ lang.t('prosecutor.qa_history') }} ({{ qaHistory().length }})
              </span>
              <span class="material-symbols-outlined text-sm text-slate-500 transition-transform"
                    [class.rotate-180]="showHistory()">expand_more</span>
            </button>
            @if (showHistory()) {
              <div class="mt-3 space-y-3">
                @for (qa of qaHistory(); track qa.questionNumber) {
                  <div class="rounded-lg bg-slate-800/30 border border-slate-200 p-3">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-[10px] font-bold text-indigo-400 uppercase">Q{{ qa.questionNumber }}</span>
                      @if (qa.weaknessFound) {
                        <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400">{{ lang.t('prosecutor.weakness_found') }}</span>
                      }
                    </div>
                    <p class="text-xs text-slate-400 mb-1"><span class="text-slate-500">{{ lang.t('prosecutor.your_answer') }}:</span> {{ qa.answer }}</p>
                  </div>
                }
              </div>
            }
          </div>
        }
      }

      <!-- ==================== AWAITING VERDICT ==================== -->
      @if (screen() === 'awaiting-verdict') {
        <div class="flex items-center justify-center min-h-[60vh]">
          <div class="text-center animate-fade-in-up">
            <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6">
              <span class="material-symbols-outlined text-4xl text-indigo-400 animate-pulse">balance</span>
            </div>
            <h2 class="text-2xl font-bold text-white mb-2">{{ lang.t('prosecutor.generating_verdict') }}</h2>
            <p class="text-slate-400 text-sm mb-6">{{ lang.t('prosecutor.verdict_wait') }}</p>
            <svg class="w-8 h-8 animate-spin text-indigo-400 mx-auto" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          </div>
        </div>
      }

      <!-- ==================== VERDICT SCREEN ==================== -->
      @if (screen() === 'verdict' && verdict()) {
        <!-- Fine Risk Score Hero -->
        <div class="relative overflow-hidden rounded-2xl border p-8 mb-6 text-center"
             [class]="getGradeBorderClass(verdict()!.grade)">
          <div class="absolute inset-0 bg-gradient-to-br opacity-10"
               [class]="getGradeBgClass(verdict()!.grade)"></div>
          <div class="relative">
            <p class="text-sm text-slate-500 uppercase tracking-wider mb-3">{{ lang.t('prosecutor.verdict_title') }}</p>

            <!-- Circular Gauge -->
            <div class="relative w-36 h-36 mx-auto mb-4">
              <svg class="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(51,65,85,0.3)" stroke-width="8"/>
                <circle cx="60" cy="60" r="52" fill="none"
                        [attr.stroke]="getGaugeColor(verdict()!.fineRiskScore)"
                        stroke-width="8"
                        stroke-linecap="round"
                        [attr.stroke-dasharray]="gaugeDashArray()"
                        stroke-dashoffset="0"
                        class="transition-all duration-1000"/>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-3xl font-black" [class]="getScoreColor(verdict()!.fineRiskScore)">{{ verdict()!.fineRiskScore }}</span>
                <span class="text-[10px] text-slate-500 uppercase">{{ lang.t('prosecutor.fine_risk') }}</span>
              </div>
            </div>

            <!-- Penalty Range -->
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 mb-3">
              <span class="material-symbols-outlined text-sm text-amber-400">euro</span>
              <span class="text-sm font-bold text-amber-300">
                {{ formatCurrency(verdict()!.penaltyRangeMin) }} — {{ formatCurrency(verdict()!.penaltyRangeMax) }}
              </span>
            </div>

            <!-- Grade Badge -->
            <div class="flex items-center justify-center gap-3 mt-3">
              <div class="w-16 h-16 rounded-xl flex items-center justify-center border-2"
                   [class]="getGradeHeroClass(verdict()!.grade)">
                <span class="text-3xl font-black" [class]="getGradeTextClass(verdict()!.grade)">{{ verdict()!.grade }}</span>
              </div>
              <p class="text-sm text-slate-400 text-left max-w-xs">
                {{ lang.lang() === 'et' ? verdict()!.summaryEt : verdict()!.summary }}
              </p>
            </div>
          </div>
        </div>

        <!-- Prosecution Brief -->
        @if (verdict()!.prosecutionBrief.length > 0) {
          <div class="glass-card p-6 mb-6">
            <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-base text-red-400">description</span>
              {{ lang.t('prosecutor.prosecution_brief') }}
            </h3>
            <div class="space-y-3">
              @for (item of verdict()!.prosecutionBrief; track $index) {
                <div class="rounded-xl bg-slate-800/30 border border-slate-200 p-4">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                          [class]="getSeverityClass(item.severity)">
                      {{ item.severity }}
                    </span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-400">
                      {{ item.article }}
                    </span>
                  </div>
                  <p class="text-sm text-slate-700 font-medium mb-1">
                    {{ lang.lang() === 'et' ? item.weaknessEt : item.weakness }}
                  </p>
                  <p class="text-xs text-slate-500">
                    {{ lang.lang() === 'et' ? item.evidenceEt : item.evidence }}
                  </p>
                </div>
              }
            </div>
          </div>
        }

        <!-- Defense Playbook -->
        @if (verdict()!.defensePlaybook.length > 0) {
          <div class="glass-card p-6 mb-6">
            <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-base text-blue-600">shield</span>
              {{ lang.t('prosecutor.defense_playbook') }}
            </h3>
            <div class="space-y-3">
              @for (step of verdict()!.defensePlaybook; track step.step) {
                <div class="flex items-start gap-3 rounded-xl bg-slate-800/30 border border-slate-200 p-4">
                  <div class="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-400 shrink-0">
                    {{ step.step }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-slate-700 mb-2">
                      {{ lang.lang() === 'et' ? step.actionEt : step.action }}
                    </p>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-700/50 text-slate-400">
                        {{ step.timeline }}
                      </span>
                      <span class="px-1.5 py-0.5 rounded text-[9px] font-bold"
                            [class]="getEffortClass(step.effort)">
                        {{ step.effort }}
                      </span>
                      <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/15 text-indigo-400">
                        {{ step.article }}
                      </span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Strengths -->
        @if (verdict()!.strengths.length > 0) {
          <div class="glass-card p-6 mb-6">
            <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-base text-blue-600">thumb_up</span>
              {{ lang.t('prosecutor.strengths') }}
            </h3>
            <div class="space-y-2">
              @for (s of verdict()!.strengths; track $index) {
                <div class="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <span class="material-symbols-outlined text-sm text-blue-600 mt-0.5">check_circle</span>
                  <div>
                    <p class="text-sm font-medium text-blue-500">{{ lang.lang() === 'et' ? s.areaEt : s.area }}</p>
                    <p class="text-xs text-slate-400">{{ lang.lang() === 'et' ? s.detailEt : s.detail }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Action Buttons -->
        <div class="flex gap-3">
          <button (click)="tryAgain()"
                  class="flex-1 py-3 rounded-xl font-bold text-sm transition-all bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 hover:shadow-xl hover:shadow-indigo-500/25 flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-lg">replay</span>
            {{ lang.t('prosecutor.try_again') }}
          </button>
          <button (click)="backToSetup()"
                  class="flex-1 py-3 rounded-xl font-bold text-sm transition-all bg-white border border-slate-200 text-slate-600 hover:border-indigo-500/30 hover:bg-indigo-500/5 flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-lg">arrow_back</span>
            {{ lang.t('prosecutor.back_to_scenarios') }}
          </button>
        </div>
      }

      <!-- ==================== HISTORY SCREEN ==================== -->
      @if (screen() === 'history') {
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="material-symbols-outlined text-indigo-400">history</span>
            {{ lang.t('prosecutor.past_audits') }}
          </h2>
          <button (click)="screen.set('setup')"
                  class="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
            <span class="material-symbols-outlined text-sm">arrow_back</span>
            {{ lang.t('prosecutor.back_to_scenarios') }}
          </button>
        </div>

        @if (history().length === 0) {
          <div class="glass-card p-8 text-center">
            <span class="material-symbols-outlined text-4xl text-slate-600 mb-3">folder_off</span>
            <p class="text-slate-500">{{ lang.t('prosecutor.no_history') }}</p>
          </div>
        }

        <div class="space-y-3">
          @for (entry of history(); track entry.sessionId) {
            <div class="glass-card p-4 flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center border-2 shrink-0"
                   [class]="getGradeHeroClass(entry.grade)">
                <span class="text-xl font-black" [class]="getGradeTextClass(entry.grade)">{{ entry.grade }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <p class="text-sm font-semibold text-slate-700">{{ getScenarioName(entry.scenarioId) }}</p>
                  <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/15 text-indigo-400">
                    {{ getDifficultyLabel(entry.difficulty) }}
                  </span>
                </div>
                <div class="flex items-center gap-3 text-xs text-slate-500">
                  <span>{{ lang.t('prosecutor.fine_risk') }}: {{ entry.fineRiskScore }}</span>
                  <span>{{ entry.weaknessCount }} {{ lang.t('prosecutor.weaknesses') }}</span>
                  <span>{{ formatDate(entry.completedAt) }}</span>
                </div>
              </div>
            </div>
          }
        </div>
      }

    </div>
  `,
  styles: [`
    :host { display: block; padding: 1.5rem 1rem; }
    .glass-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(51, 65, 85, 0.4);
      border-radius: 0.75rem;
      backdrop-filter: blur(12px);
    }
    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up { animation: fadeInUp 0.4s ease-out; }
  `]
})
export class ProsecutorComponent implements OnInit {
  readonly lang = inject(LangService);
  private readonly http = inject(HttpClient);
  private readonly titleService = inject(Title);
  private readonly destroyRef = inject(DestroyRef);
  readonly sub = inject(SubscriptionService);

  // State
  screen = signal<Screen>('setup');
  loading = signal(false);
  error = signal<string | null>(null);
  submitting = signal(false);

  // Setup
  scenarios = signal<Scenario[]>([]);
  selectedScenario = signal<string | null>(null);
  selectedDifficulty = signal('focused_review');
  history = signal<HistoryEntry[]>([]);

  // Questioning
  sessionId = signal<string | null>(null);
  questionsAsked = signal(0);
  totalQuestions = signal(0);
  weaknessCount = signal(0);
  currentQuestion = signal<QuestionData | null>(null);
  qaHistory = signal<QaEntry[]>([]);
  showHint = signal(false);
  showHistory = signal(false);
  answerText = '';

  // Verdict
  verdict = signal<Verdict | null>(null);

  // Computed
  progressPct = computed(() => {
    const total = this.totalQuestions();
    if (total === 0) return 0;
    return Math.min(100, (this.questionsAsked() / total) * 100);
  });

  gaugeDashArray = computed(() => {
    const score = this.verdict()?.fineRiskScore ?? 0;
    const circumference = 2 * Math.PI * 52;
    const filled = (score / 100) * circumference;
    return `${filled} ${circumference}`;
  });

  difficulties = [
    { id: 'routine_inspection', label: 'Routine Inspection', labelEt: 'Rutiinne kontroll', questions: 6, icon: 'search', color: 'text-blue-600', desc: 'Fair and direct questions with helpful hints.', descEt: 'Ausad ja otsesed küsimused koos kasulike vihjetega.' },
    { id: 'focused_review', label: 'Focused Review', labelEt: 'Fokuseeritud ülevaade', questions: 8, icon: 'policy', color: 'text-amber-400', desc: 'Probing questions that follow up on weak points.', descEt: 'Uurivad küsimused, mis jälgivad nõrku kohti.' },
    { id: 'deep_investigation', label: 'Deep Investigation', labelEt: 'Süvauurimine', questions: 10, icon: 'local_fire_department', color: 'text-red-400', desc: 'Aggressive adversarial audit. No mercy, no hints.', descEt: 'Agressiivne vastane audit. Halastust ega vihjeid pole.' }
  ];

  ngOnInit() {
    this.titleService.setTitle(this.lang.t('prosecutor.title') + ' | DoraAudit.eu');
    this.loadScenarios();
    this.loadHistory();
  }

  // ==================== API ====================

  loadScenarios() {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<Scenario[]>('/api/prosecutor/scenarios')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.scenarios.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Failed to load scenarios');
          this.loading.set(false);
        }
      });
  }

  loadHistory() {
    this.http.get<HistoryEntry[]>('/api/prosecutor/history')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.history.set(data),
        error: () => {} // silent
      });
  }

  startAudit() {
    const scenarioId = this.selectedScenario();
    if (!scenarioId) return;
    this.loading.set(true);
    this.error.set(null);
    this.http.post<any>('/api/prosecutor/start', {
      scenarioId,
      difficulty: this.selectedDifficulty()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.sessionId.set(data.sessionId);
          this.questionsAsked.set(data.questionsAsked ?? 1);
          this.totalQuestions.set(data.totalQuestions);
          this.weaknessCount.set(0);
          this.currentQuestion.set(data.question);
          this.qaHistory.set([]);
          this.answerText = '';
          this.showHint.set(false);
          this.showHistory.set(false);
          this.verdict.set(null);
          this.screen.set('questioning');
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.error || err?.error?.message || 'Failed to start audit');
          this.loading.set(false);
        }
      });
  }

  submitAnswer() {
    const sid = this.sessionId();
    if (!sid || !this.answerText.trim()) return;
    this.submitting.set(true);

    const answer = this.answerText.trim();

    this.http.post<any>('/api/prosecutor/answer', {
      sessionId: sid,
      answer
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          // Add to QA history
          const prev = this.currentQuestion();
          if (prev) {
            this.qaHistory.update(h => [...h, {
              questionNumber: prev.questionNumber,
              answer,
              assessment: data.response?.assessment || '',
              weaknessFound: data.response?.weaknessFound || false,
              weaknessDetail: data.response?.weaknessDetail || null,
              severityScore: data.response?.severityScore || 0,
              articleReference: prev.articleReference
            }]);
          }

          this.questionsAsked.set(data.questionsAsked);
          this.weaknessCount.set(data.weaknessCount ?? 0);
          this.currentQuestion.set(data.response);
          this.answerText = '';
          this.showHint.set(false);
          this.submitting.set(false);

          // Check if audit is complete
          if (data.state === 'VERDICT_READY') {
            this.requestVerdict();
          }
        },
        error: (err) => {
          this.error.set(err?.error?.error || 'Failed to submit answer');
          this.submitting.set(false);
        }
      });
  }

  requestVerdict() {
    const sid = this.sessionId();
    if (!sid) return;
    this.screen.set('awaiting-verdict');

    this.http.post<any>('/api/prosecutor/verdict', { sessionId: sid })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.verdict.set(data as Verdict);
          this.screen.set('verdict');
          this.loadHistory(); // Refresh history
        },
        error: (err) => {
          this.error.set(err?.error?.error || 'Failed to generate verdict');
          this.screen.set('questioning');
        }
      });
  }

  tryAgain() {
    this.screen.set('setup');
    this.verdict.set(null);
    this.currentQuestion.set(null);
    this.qaHistory.set([]);
    this.answerText = '';
    this.weaknessCount.set(0);
  }

  backToSetup() {
    this.screen.set('setup');
    this.selectedScenario.set(null);
    this.verdict.set(null);
    this.currentQuestion.set(null);
    this.qaHistory.set([]);
  }

  // ==================== HELPERS ====================

  getTierLabel(tier: string): string {
    if (tier === 'FREE') return this.lang.lang() === 'et' ? 'TASUTA' : 'FREE';
    if (tier === 'ENTERPRISE') return 'ENTERPRISE';
    return 'STANDARD';
  }

  getScenarioName(id: string): string {
    const s = this.scenarios().find(sc => sc.id === id);
    if (!s) return id;
    return this.lang.lang() === 'et' ? s.nameEt : s.name;
  }

  getDifficultyLabel(d: string): string {
    const diff = this.difficulties.find(x => x.id === d);
    if (!diff) return d;
    return this.lang.lang() === 'et' ? diff.labelEt : diff.label;
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString(this.lang.lang() === 'et' ? 'et-EE' : 'en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch { return iso; }
  }

  formatCurrency(val: number): string {
    if (val >= 1_000_000) return `\u20AC${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `\u20AC${(val / 1_000).toFixed(0)}K`;
    return `\u20AC${val}`;
  }

  getGaugeColor(score: number): string {
    if (score >= 80) return '#ef4444';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#eab308';
    if (score >= 20) return '#22c55e';
    return '#10b981';
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-amber-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-blue-600';
  }

  getSeverityClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-400';
      case 'LOW': return 'bg-blue-100 text-blue-600';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  }

  getEffortClass(effort: string): string {
    switch (effort) {
      case 'HIGH': return 'bg-red-500/20 text-red-400';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-400';
      case 'LOW': return 'bg-blue-100 text-blue-600';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  }

  getGradeBorderClass(grade: string): string {
    switch (grade) {
      case 'A': return 'border-blue-200 bg-blue-50';
      case 'B': return 'border-blue-500/30 bg-blue-500/5';
      case 'C': return 'border-amber-500/30 bg-amber-500/5';
      case 'D': return 'border-orange-500/30 bg-orange-500/5';
      default: return 'border-red-500/30 bg-red-500/5';
    }
  }

  getGradeBgClass(grade: string): string {
    switch (grade) {
      case 'A': return 'from-blue-600 to-green-500';
      case 'B': return 'from-blue-500 to-blue-500';
      case 'C': return 'from-amber-500 to-yellow-500';
      case 'D': return 'from-orange-500 to-red-500';
      default: return 'from-red-500 to-rose-500';
    }
  }

  getGradeHeroClass(grade: string): string {
    switch (grade) {
      case 'A': return 'bg-blue-100 border-blue-500/50';
      case 'B': return 'bg-blue-500/20 border-blue-500/50';
      case 'C': return 'bg-amber-500/20 border-amber-500/50';
      case 'D': return 'bg-orange-500/20 border-orange-500/50';
      default: return 'bg-red-500/20 border-red-500/50';
    }
  }

  getGradeTextClass(grade: string): string {
    switch (grade) {
      case 'A': return 'text-blue-600';
      case 'B': return 'text-blue-400';
      case 'C': return 'text-amber-400';
      case 'D': return 'text-orange-400';
      default: return 'text-red-400';
    }
  }
}
