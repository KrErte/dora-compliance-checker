import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
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
  difficulty: string;
  tier: string;
  doraArticles: string[];
  description: string;
  descriptionEt: string;
  locked: boolean;
}

interface PhaseInfo {
  id: string;
  name: string;
  nameEt: string;
  phaseIndex: number;
  totalPhases: number;
  startMinutes: number;
  endMinutes: number;
  totalDecisions: number;
}

interface DecisionOption {
  index: number;
  text: string;
  textEt: string;
}

interface DecisionInfo {
  index: number;
  prompt: string;
  promptEt: string;
  options: DecisionOption[];
}

interface Deadline {
  label: string;
  labelEt: string;
  deadlineMinutes: number;
  elapsedMinutes: number;
  status: string;
}

interface FeedbackData {
  feedback: string;
  feedbackEt: string;
  qualityScore: number;
  cascadeSpread: number;
  timePenaltyMinutes: number;
  simTimeMinutes: number;
  totalCascadeSpread: number;
  phaseComplete: boolean;
  simulationComplete: boolean;
  currentPhase?: PhaseInfo;
  currentDecision?: DecisionInfo;
  deadlines: { [key: string]: Deadline };
}

interface DecisionRecord {
  phaseId: string;
  phaseName: string;
  decisionIndex: number;
  optionIndex: number;
  optionText: string;
  qualityScore: number;
  consequence: string;
  cascadeSpread: number;
  timePenaltyMinutes: number;
}

interface SimResult {
  sessionId: string;
  scenarioId: string;
  grade: string;
  overall: number;
  scores: {
    doraCompliance: number;
    containment: number;
    decisionQuality: number;
    timeManagement: number;
  };
  decisions: DecisionRecord[];
  totalCascadeSpread: number;
  simTimeMinutes: number;
}

type Screen = 'scenarios' | 'simulation' | 'feedback' | 'phase-transition' | 'results';

@Component({
  selector: 'app-war-room',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto">

      <!-- ==================== SCENARIOS SCREEN ==================== -->
      @if (screen() === 'scenarios') {
        <!-- Header -->
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 via-orange-500/10 to-amber-500/10 border border-red-500/20 p-8 mb-8">
          <div class="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-red-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div class="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-500/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2"></div>
          <div class="relative">
            <div class="flex items-center gap-2 mb-3">
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
                {{ lang.t('war_room.badge') }}
              </span>
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                DORA Art. 17-19
              </span>
            </div>
            <h1 class="text-3xl font-bold text-white mb-2">{{ lang.t('war_room.title') }}</h1>
            <p class="text-slate-400 max-w-2xl">{{ lang.t('war_room.subtitle') }}</p>
          </div>
        </div>

        <!-- Loading -->
        @if (loading()) {
          <div class="flex items-center justify-center py-20">
            <svg class="w-8 h-8 animate-spin text-red-400" fill="none" viewBox="0 0 24 24">
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
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (scenario of scenarios(); track scenario.id) {
              <div class="glass-card p-5 relative overflow-hidden group transition-all duration-300"
                   [class]="scenario.locked ? 'cursor-default opacity-80' : 'cursor-pointer hover:border-red-500/30 hover:-translate-y-0.5'"
                   (click)="!scenario.locked && startScenario(scenario.id)">
                <!-- Locked overlay -->
                @if (scenario.locked) {
                  <div class="absolute inset-0 bg-slate-900/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3 rounded-xl">
                    <span class="material-symbols-outlined text-3xl text-slate-500">lock</span>
                    <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {{ scenario.tier === 'ENTERPRISE' ? 'Enterprise' : 'Standard' }}
                    </span>
                    <a routerLink="/pricing" class="text-xs text-red-400 hover:text-red-300 underline underline-offset-2">
                      {{ lang.t('war_room.upgrade') }}
                    </a>
                  </div>
                }

                <!-- Scenario card content -->
                <div class="flex items-start gap-3 mb-3">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                       [class]="getDifficultyBg(scenario.difficulty)">
                    <span class="material-symbols-outlined text-xl" [class]="getDifficultyColor(scenario.difficulty)">{{ scenario.icon }}</span>
                  </div>
                  <div class="min-w-0">
                    <h3 class="font-bold text-slate-700 text-sm leading-tight">
                      {{ lang.lang() === 'et' ? scenario.nameEt : scenario.name }}
                    </h3>
                    <div class="flex items-center gap-1.5 mt-1">
                      <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                            [class]="getDifficultyBadge(scenario.difficulty)">
                        {{ getDifficultyLabel(scenario.difficulty) }}
                      </span>
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
        }
      }

      <!-- ==================== SIMULATION SCREEN ==================== -->
      @if (screen() === 'simulation' || screen() === 'feedback') {
        <!-- Phase Stepper -->
        <div class="glass-card p-4 mb-4">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                <span class="material-symbols-outlined text-lg text-red-400">emergency</span>
              </div>
              <div>
                <p class="text-xs text-slate-500 uppercase tracking-wider font-medium">{{ lang.t('war_room.phase') }} {{ (currentPhase()?.phaseIndex ?? 0) + 1 }}/{{ currentPhase()?.totalPhases ?? 4 }}</p>
                <p class="text-sm font-semibold text-slate-700">
                  {{ lang.lang() === 'et' ? currentPhase()?.nameEt : currentPhase()?.name }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-xs text-slate-500">{{ lang.t('war_room.sim_time') }}</p>
              <p class="text-lg font-bold text-red-400">{{ simTimeFormatted() }}</p>
            </div>
          </div>
          <!-- Phase progress bar -->
          <div class="h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-red-600 to-orange-500 rounded-full transition-all duration-500"
                 [style.width.%]="phaseProgress()"></div>
          </div>
          <!-- Phase dots -->
          <div class="flex items-center gap-2 mt-3">
            @for (i of phaseIndices(); track i) {
              <div class="flex-1 h-1.5 rounded-full transition-all"
                   [class]="i < (currentPhase()?.phaseIndex ?? 0) ? 'bg-red-500'
                          : i === (currentPhase()?.phaseIndex ?? 0) ? 'bg-gradient-to-r from-red-500 to-orange-500'
                          : 'bg-slate-700/50'">
              </div>
            }
          </div>
        </div>

        <!-- DORA Deadline Bar -->
        <div class="glass-card p-3 mb-4 border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-transparent">
          <div class="flex items-center gap-2 mb-2">
            <span class="material-symbols-outlined text-sm text-amber-400">schedule</span>
            <span class="text-xs font-bold text-amber-400 uppercase tracking-wider">DORA {{ lang.t('war_room.deadlines') }}</span>
          </div>
          <div class="grid grid-cols-3 gap-2">
            @for (dl of deadlineList(); track dl.key) {
              <div class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs"
                   [class]="dl.status === 'expired' ? 'bg-red-500/10 border border-red-500/20' : dl.remaining <= 30 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-blue-50 border border-blue-200'">
                <div class="w-2 h-2 rounded-full shrink-0"
                     [class]="dl.status === 'expired' ? 'bg-red-500' : dl.remaining <= 30 ? 'bg-amber-500 animate-pulse' : 'bg-blue-600'"></div>
                <div class="min-w-0">
                  <p class="font-medium truncate" [class]="dl.status === 'expired' ? 'text-red-400' : dl.remaining <= 30 ? 'text-amber-400' : 'text-blue-600'">
                    {{ lang.lang() === 'et' ? dl.labelEt : dl.label }}
                  </p>
                  <p class="text-slate-500">
                    @if (dl.status === 'expired') {
                      {{ lang.t('war_room.expired') }}
                    } @else {
                      {{ formatMinutes(dl.remaining) }} {{ lang.t('war_room.remaining') }}
                    }
                  </p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Decision Card -->
        @if (screen() === 'simulation' && currentDecision()) {
          <div class="glass-card p-6 mb-4">
            <div class="bg-white rounded-xl p-5 border border-slate-200 mb-5">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span class="material-symbols-outlined text-lg text-red-400">crisis_alert</span>
                </div>
                <p class="text-slate-700 leading-relaxed">
                  {{ lang.lang() === 'et' ? currentDecision()!.promptEt : currentDecision()!.prompt }}
                </p>
              </div>
            </div>

            <!-- Radio Options -->
            <div class="space-y-2 mb-5">
              @for (opt of currentDecision()!.options; track opt.index) {
                <button (click)="selectedOption.set(opt.index)"
                        class="w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start gap-3"
                        [class]="selectedOption() === opt.index
                          ? 'bg-red-500/10 border-red-500/40 ring-1 ring-red-500/30'
                          : 'bg-white border-slate-200 hover:border-red-500/20 hover:bg-red-500/5'">
                  <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all"
                       [class]="selectedOption() === opt.index ? 'border-red-500 bg-red-500' : 'border-slate-600'">
                    @if (selectedOption() === opt.index) {
                      <div class="w-2 h-2 rounded-full bg-white"></div>
                    }
                  </div>
                  <p class="text-sm" [class]="selectedOption() === opt.index ? 'text-red-300 font-medium' : 'text-slate-600'">
                    {{ lang.lang() === 'et' ? opt.textEt : opt.text }}
                  </p>
                </button>
              }
            </div>

            <!-- Submit -->
            <button (click)="submitDecision()"
                    [disabled]="selectedOption() === null || submitting()"
                    class="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2"
                    [class]="submitting() ? 'bg-slate-700 text-slate-400 cursor-wait'
                           : selectedOption() === null ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                           : 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-500 hover:to-orange-500 hover:shadow-xl hover:shadow-red-500/25 hover:-translate-y-0.5'">
              @if (submitting()) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              } @else {
                <span class="material-symbols-outlined text-lg">send</span>
              }
              {{ lang.t('war_room.submit_decision') }}
            </button>
          </div>
        }

        <!-- Cascade / Time KPIs -->
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="glass-card p-3 flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-orange-500/15 flex items-center justify-center">
              <span class="material-symbols-outlined text-lg text-orange-400">hub</span>
            </div>
            <div>
              <p class="text-xs text-slate-500">{{ lang.t('war_room.cascade_spread') }}</p>
              <p class="text-lg font-bold text-orange-400">{{ totalCascadeSpread() }}</p>
            </div>
          </div>
          <div class="glass-card p-3 flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center">
              <span class="material-symbols-outlined text-lg text-red-400">timer</span>
            </div>
            <div>
              <p class="text-xs text-slate-500">{{ lang.t('war_room.time_elapsed') }}</p>
              <p class="text-lg font-bold text-red-400">{{ simTimeFormatted() }}</p>
            </div>
          </div>
        </div>

        <!-- ==================== FEEDBACK OVERLAY ==================== -->
        @if (screen() === 'feedback' && lastFeedback()) {
          <div class="glass-card p-6 mb-4 animate-fade-in-up">
            <!-- Quality Score Banner -->
            <div class="rounded-xl p-4 border-l-4 flex items-center gap-4 mb-4"
                 [class]="getQualityBannerClass(lastFeedback()!.qualityScore)">
              <div class="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                   [class]="getQualityScoreBg(lastFeedback()!.qualityScore)">
                <span class="text-xl font-extrabold" [class]="getQualityScoreColor(lastFeedback()!.qualityScore)">
                  {{ lastFeedback()!.qualityScore }}%
                </span>
              </div>
              <div>
                <p class="font-bold text-lg" [class]="getQualityScoreColor(lastFeedback()!.qualityScore)">
                  {{ lang.t('war_room.decision_quality') }}
                </p>
                <p class="text-sm text-slate-400">
                  {{ lang.lang() === 'et' ? lastFeedback()!.feedbackEt : lastFeedback()!.feedback }}
                </p>
              </div>
            </div>

            <!-- Impact KPIs -->
            @if (lastFeedback()!.cascadeSpread > 0 || lastFeedback()!.timePenaltyMinutes > 0) {
              <div class="grid grid-cols-2 gap-3 mb-4">
                @if (lastFeedback()!.cascadeSpread > 0) {
                  <div class="bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
                    <p class="text-xs text-orange-400 font-medium">{{ lang.t('war_room.affected_nodes') }}</p>
                    <p class="text-lg font-bold text-orange-300">+{{ lastFeedback()!.cascadeSpread }}</p>
                  </div>
                }
                @if (lastFeedback()!.timePenaltyMinutes > 0) {
                  <div class="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                    <p class="text-xs text-red-400 font-medium">{{ lang.t('war_room.time_penalty') }}</p>
                    <p class="text-lg font-bold text-red-300">+{{ formatMinutes(lastFeedback()!.timePenaltyMinutes) }}</p>
                  </div>
                }
              </div>
            }

            <!-- Continue button -->
            <button (click)="continueAfterFeedback()"
                    class="w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-500 hover:to-orange-500 hover:shadow-xl hover:shadow-red-500/25 flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-lg">arrow_forward</span>
              @if (lastFeedback()!.simulationComplete) {
                {{ lang.t('war_room.view_results') }}
              } @else if (lastFeedback()!.phaseComplete) {
                {{ lang.t('war_room.next_phase') }}
              } @else {
                {{ lang.t('war_room.continue') }}
              }
            </button>
          </div>
        }
      }

      <!-- ==================== PHASE TRANSITION ==================== -->
      @if (screen() === 'phase-transition') {
        <div class="flex items-center justify-center min-h-[60vh]">
          <div class="text-center animate-fade-in-up">
            <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
              <span class="material-symbols-outlined text-4xl text-red-400">{{ getPhaseIcon(currentPhase()?.id) }}</span>
            </div>
            <p class="text-sm text-slate-500 uppercase tracking-wider mb-2">{{ lang.t('war_room.entering_phase') }}</p>
            <h2 class="text-2xl font-bold text-white mb-2">
              {{ lang.lang() === 'et' ? currentPhase()?.nameEt : currentPhase()?.name }}
            </h2>
            <p class="text-slate-500 text-sm">{{ lang.t('war_room.phase') }} {{ (currentPhase()?.phaseIndex ?? 0) + 1 }} / {{ currentPhase()?.totalPhases ?? 4 }}</p>
          </div>
        </div>
      }

      <!-- ==================== RESULTS SCREEN ==================== -->
      @if (screen() === 'results' && result()) {
        <!-- Grade Hero -->
        <div class="relative overflow-hidden rounded-2xl border p-8 mb-6 text-center"
             [class]="getGradeBorderClass(result()!.grade)">
          <div class="absolute inset-0 bg-gradient-to-br opacity-10"
               [class]="getGradeBgClass(result()!.grade)"></div>
          <div class="relative">
            <p class="text-sm text-slate-500 uppercase tracking-wider mb-2">{{ lang.t('war_room.simulation_result') }}</p>
            <div class="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2"
                 [class]="getGradeHeroClass(result()!.grade)">
              <span class="text-5xl font-black" [class]="getGradeTextClass(result()!.grade)">{{ result()!.grade }}</span>
            </div>
            <p class="text-xl font-bold text-white mb-1">{{ lang.t('war_room.overall_score') }}: {{ result()!.overall }}%</p>
            <p class="text-sm text-slate-400">{{ getGradeLabel(result()!.grade) }}</p>
          </div>
        </div>

        <!-- Score Breakdown -->
        <div class="glass-card p-6 mb-6">
          <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-base text-red-400">analytics</span>
            {{ lang.t('war_room.score_breakdown') }}
          </h3>
          <div class="space-y-4">
            @for (cat of scoreCategories(); track cat.key) {
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm" [class]="cat.color">{{ cat.icon }}</span>
                    <span class="text-sm font-medium text-slate-600">{{ lang.t(cat.labelKey) }}</span>
                  </div>
                  <span class="text-sm font-bold" [class]="cat.color">{{ cat.value }}%</span>
                </div>
                <div class="h-2.5 bg-slate-700/50 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-1000"
                       [class]="cat.barClass"
                       [style.width.%]="cat.value"></div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Simulation Stats -->
        <div class="grid grid-cols-2 gap-3 mb-6">
          <div class="glass-card p-4 text-center">
            <span class="material-symbols-outlined text-2xl text-orange-400 mb-1">hub</span>
            <p class="text-2xl font-bold text-white">{{ result()!.totalCascadeSpread }}</p>
            <p class="text-xs text-slate-500">{{ lang.t('war_room.total_affected') }}</p>
          </div>
          <div class="glass-card p-4 text-center">
            <span class="material-symbols-outlined text-2xl text-red-400 mb-1">timer</span>
            <p class="text-2xl font-bold text-white">{{ formatMinutes(result()!.simTimeMinutes) }}</p>
            <p class="text-xs text-slate-500">{{ lang.t('war_room.total_time') }}</p>
          </div>
        </div>

        <!-- Decision Timeline -->
        <div class="glass-card p-6 mb-6">
          <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-base text-red-400">timeline</span>
            {{ lang.t('war_room.decision_timeline') }}
          </h3>
          <div class="space-y-3">
            @for (d of result()!.decisions; track $index; let i = $index) {
              <div class="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-200">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                     [class]="d.qualityScore >= 80 ? 'bg-blue-100 text-blue-600'
                            : d.qualityScore >= 50 ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'">
                  {{ d.qualityScore }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 mb-0.5">
                    <span class="text-[10px] font-bold uppercase text-slate-500">{{ d.phaseName }}</span>
                  </div>
                  <p class="text-xs text-slate-600 leading-relaxed">{{ d.optionText }}</p>
                  <p class="text-xs text-slate-500 mt-1 italic">{{ d.consequence }}</p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3">
          <button (click)="tryAgain()"
                  class="flex-1 py-3 rounded-xl font-bold text-sm transition-all bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-500 hover:to-orange-500 hover:shadow-xl hover:shadow-red-500/25 flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-lg">replay</span>
            {{ lang.t('war_room.try_again') }}
          </button>
          <button (click)="backToScenarios()"
                  class="flex-1 py-3 rounded-xl font-bold text-sm transition-all bg-white border border-slate-200 text-slate-600 hover:border-red-500/30 hover:bg-red-500/5 flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-lg">arrow_back</span>
            {{ lang.t('war_room.back_to_scenarios') }}
          </button>
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
export class WarRoomComponent implements OnInit {
  readonly lang = inject(LangService);
  private readonly http = inject(HttpClient);
  private readonly titleService = inject(Title);
  private readonly destroyRef = inject(DestroyRef);
  readonly sub = inject(SubscriptionService);

  // State
  screen = signal<Screen>('scenarios');
  loading = signal(false);
  error = signal<string | null>(null);
  submitting = signal(false);

  // Scenarios
  scenarios = signal<Scenario[]>([]);

  // Simulation state
  sessionId = signal<string | null>(null);
  currentScenarioId = signal<string | null>(null);
  currentPhase = signal<PhaseInfo | null>(null);
  currentDecision = signal<DecisionInfo | null>(null);
  selectedOption = signal<number | null>(null);
  lastFeedback = signal<FeedbackData | null>(null);
  simTimeMinutes = signal(0);
  totalCascadeSpread = signal(0);
  deadlines = signal<{ [key: string]: Deadline }>({});

  // Results
  result = signal<SimResult | null>(null);

  // Computed
  simTimeFormatted = computed(() => this.formatMinutes(this.simTimeMinutes()));

  phaseProgress = computed(() => {
    const phase = this.currentPhase();
    if (!phase) return 0;
    const decIdx = this.currentDecision()?.index ?? 0;
    return Math.min(100, ((decIdx + 1) / phase.totalDecisions) * 100);
  });

  phaseIndices = computed(() => {
    const total = this.currentPhase()?.totalPhases ?? 4;
    return Array.from({ length: total }, (_, i) => i);
  });

  deadlineList = computed(() => {
    const dls = this.deadlines();
    return Object.entries(dls).map(([key, dl]) => ({
      key,
      label: dl.label,
      labelEt: dl.labelEt,
      status: dl.status,
      remaining: Math.max(0, dl.deadlineMinutes - dl.elapsedMinutes)
    }));
  });

  scoreCategories = computed(() => {
    const r = this.result();
    if (!r) return [];
    return [
      { key: 'dora', labelKey: 'war_room.score_dora', value: r.scores.doraCompliance, icon: 'gavel', color: 'text-blue-400', barClass: 'bg-gradient-to-r from-blue-600 to-blue-400' },
      { key: 'containment', labelKey: 'war_room.score_containment', value: r.scores.containment, icon: 'shield', color: 'text-blue-600', barClass: 'bg-gradient-to-r from-blue-700 to-blue-400' },
      { key: 'decision', labelKey: 'war_room.score_decision', value: r.scores.decisionQuality, icon: 'psychology', color: 'text-violet-400', barClass: 'bg-gradient-to-r from-violet-600 to-violet-400' },
      { key: 'time', labelKey: 'war_room.score_time', value: r.scores.timeManagement, icon: 'schedule', color: 'text-amber-400', barClass: 'bg-gradient-to-r from-amber-600 to-amber-400' }
    ];
  });

  ngOnInit() {
    this.titleService.setTitle(this.lang.t('war_room.title') + ' | DoraAudit.eu');
    this.loadScenarios();
  }

  // ==================== API ====================

  loadScenarios() {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<Scenario[]>('/api/war-room/scenarios')
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

  startScenario(scenarioId: string) {
    this.loading.set(true);
    this.error.set(null);
    this.http.post<any>('/api/war-room/start', { scenarioId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.sessionId.set(data.sessionId);
          this.currentScenarioId.set(scenarioId);
          this.currentPhase.set(data.currentPhase);
          this.currentDecision.set(data.currentDecision);
          this.simTimeMinutes.set(data.simTimeMinutes ?? 0);
          this.totalCascadeSpread.set(data.initialCascade?.length ?? 0);
          this.deadlines.set(data.deadlines ?? {});
          this.selectedOption.set(null);
          this.lastFeedback.set(null);
          this.result.set(null);
          this.screen.set('simulation');
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.error || err?.error?.message || 'Failed to start simulation');
          this.loading.set(false);
        }
      });
  }

  submitDecision() {
    const sid = this.sessionId();
    const opt = this.selectedOption();
    if (!sid || opt === null) return;

    this.submitting.set(true);
    this.error.set(null);
    this.http.post<FeedbackData>('/api/war-room/decide', { sessionId: sid, optionIndex: opt })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.lastFeedback.set(data);
          this.simTimeMinutes.set(data.simTimeMinutes);
          this.totalCascadeSpread.set(data.totalCascadeSpread);
          this.deadlines.set(data.deadlines ?? {});
          if (data.currentPhase) this.currentPhase.set(data.currentPhase);
          if (data.currentDecision) this.currentDecision.set(data.currentDecision);
          this.screen.set('feedback');
          this.submitting.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.error || 'Failed to submit decision');
          this.submitting.set(false);
        }
      });
  }

  continueAfterFeedback() {
    const fb = this.lastFeedback();
    if (!fb) return;

    if (fb.simulationComplete) {
      this.completeSimulation();
    } else if (fb.phaseComplete) {
      // Show phase transition interstitial
      this.screen.set('phase-transition');
      setTimeout(() => {
        this.selectedOption.set(null);
        this.lastFeedback.set(null);
        this.screen.set('simulation');
      }, 1500);
    } else {
      this.selectedOption.set(null);
      this.lastFeedback.set(null);
      this.screen.set('simulation');
    }
  }

  private completeSimulation() {
    const sid = this.sessionId();
    if (!sid) return;

    this.http.post<SimResult>('/api/war-room/complete', { sessionId: sid })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.result.set(data);
          this.screen.set('results');
        },
        error: (err) => {
          this.error.set(err?.error?.error || 'Failed to complete simulation');
        }
      });
  }

  tryAgain() {
    const scenarioId = this.currentScenarioId();
    if (scenarioId) {
      this.startScenario(scenarioId);
    } else {
      this.backToScenarios();
    }
  }

  backToScenarios() {
    this.screen.set('scenarios');
    this.sessionId.set(null);
    this.currentScenarioId.set(null);
    this.currentPhase.set(null);
    this.currentDecision.set(null);
    this.selectedOption.set(null);
    this.lastFeedback.set(null);
    this.result.set(null);
    this.simTimeMinutes.set(0);
    this.totalCascadeSpread.set(0);
    this.error.set(null);
    this.loadScenarios();
  }

  // ==================== UI Helpers ====================

  formatMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h < 24) return m > 0 ? `${h}h ${m}m` : `${h}h`;
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return rh > 0 ? `${d}d ${rh}h` : `${d}d`;
  }

  getDifficultyBg(difficulty: string): string {
    if (difficulty === 'HIGH') return 'bg-red-500/15';
    if (difficulty === 'LOW') return 'bg-blue-50';
    return 'bg-amber-500/15';
  }

  getDifficultyColor(difficulty: string): string {
    if (difficulty === 'HIGH') return 'text-red-400';
    if (difficulty === 'LOW') return 'text-blue-600';
    return 'text-amber-400';
  }

  getDifficultyBadge(difficulty: string): string {
    if (difficulty === 'HIGH') return 'bg-red-500/15 text-red-400';
    if (difficulty === 'LOW') return 'bg-blue-50 text-blue-600';
    return 'bg-amber-500/15 text-amber-400';
  }

  getPhaseIcon(phaseId?: string): string {
    switch (phaseId) {
      case 'detection': return 'search';
      case 'classification': return 'category';
      case 'containment': return 'shield';
      case 'reporting': return 'description';
      default: return 'emergency';
    }
  }

  getQualityBannerClass(score: number): string {
    if (score >= 80) return 'bg-blue-50 border-blue-500';
    if (score >= 50) return 'bg-amber-500/10 border-amber-500';
    return 'bg-red-500/10 border-red-500';
  }

  getQualityScoreBg(score: number): string {
    if (score >= 80) return 'bg-blue-100';
    if (score >= 50) return 'bg-amber-500/20';
    return 'bg-red-500/20';
  }

  getQualityScoreColor(score: number): string {
    if (score >= 80) return 'text-blue-600';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  }

  getGradeBorderClass(grade: string): string {
    if (grade === 'A') return 'border-blue-200 bg-gradient-to-br from-blue-600/10 to-blue-600/5';
    if (grade === 'B') return 'border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-500/5';
    if (grade === 'C') return 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-500/5';
    return 'border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-500/5';
  }

  getGradeBgClass(grade: string): string {
    if (grade === 'A') return 'from-blue-600 to-blue-800';
    if (grade === 'B') return 'from-blue-500 to-blue-700';
    if (grade === 'C') return 'from-amber-500 to-amber-700';
    return 'from-red-500 to-red-700';
  }

  getGradeHeroClass(grade: string): string {
    if (grade === 'A') return 'border-blue-500/50 bg-blue-50';
    if (grade === 'B') return 'border-blue-500/50 bg-blue-500/10';
    if (grade === 'C') return 'border-amber-500/50 bg-amber-500/10';
    return 'border-red-500/50 bg-red-500/10';
  }

  getGradeTextClass(grade: string): string {
    if (grade === 'A') return 'text-blue-600';
    if (grade === 'B') return 'text-blue-400';
    if (grade === 'C') return 'text-amber-400';
    return 'text-red-400';
  }

  getGradeLabel(grade: string): string {
    const keyMap: { [key: string]: string } = {
      'A': 'war_room.grade_a',
      'B': 'war_room.grade_b',
      'C': 'war_room.grade_c',
      'D': 'war_room.grade_d',
      'F': 'war_room.grade_f'
    };
    return keyMap[grade] ? this.lang.t(keyMap[grade]) : '';
  }

  getDifficultyLabel(difficulty: string): string {
    const keyMap: { [key: string]: string } = {
      'HIGH': 'war_room.difficulty_high',
      'MEDIUM': 'war_room.difficulty_medium',
      'LOW': 'war_room.difficulty_low'
    };
    return keyMap[difficulty] ? this.lang.t(keyMap[difficulty]) : difficulty;
  }

  getTierLabel(tier: string): string {
    const keyMap: { [key: string]: string } = {
      'FREE': 'war_room.tier_free',
      'STANDARD': 'war_room.tier_standard',
      'ENTERPRISE': 'war_room.tier_enterprise'
    };
    return keyMap[tier] ? this.lang.t(keyMap[tier]) : tier;
  }
}
