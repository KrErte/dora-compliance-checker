import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { LangService } from '../lang.service';

interface ExamQuestion {
  index: number;
  question: string;
  category: string;
  articleReference: string;
  points: number;
  difficulty: string;
}

interface ExamSession {
  sessionId: string;
  questions: ExamQuestion[];
  totalQuestions: number;
}

interface AnswerFeedback {
  score: number;
  maxPoints: number;
  feedback: string;
  strengths: string[];
  gaps: string[];
  recommendation: string;
}

interface ExamResult {
  grade: string;
  verdict: string;
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
  categoryScores: CategoryScore[];
}

interface CategoryScore {
  category: string;
  earned: number;
  total: number;
  percentage: number;
}

interface HistoryEntry {
  sessionId: string;
  focus: string;
  difficulty: string;
  grade: string;
  percentage: number;
  completedAt: string;
  totalQuestions: number;
}

type Screen = 'setup' | 'exam' | 'feedback' | 'results' | 'history';

@Component({
  selector: 'app-exam-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto">

      <!-- ==================== SETUP SCREEN ==================== -->
      @if (screen() === 'setup') {
        <!-- Header -->
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-indigo-500/10 border border-violet-500/20 p-8 mb-8">
          <div class="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-violet-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div class="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2"></div>
          <div class="relative">
            <div class="flex items-center gap-2 mb-3">
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-400 border border-violet-500/30">
                AI-Powered
              </span>
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
                Regulatory Exam
              </span>
            </div>
            <h1 class="text-3xl font-bold text-white mb-2">DORA Regulatory Examination Simulator</h1>
            <p class="text-slate-400 max-w-2xl">Prepare for a real supervisory examination. An AI auditor will test your organization's DORA compliance knowledge with scenario-based questions graded against regulatory standards.</p>
          </div>
        </div>

        <!-- Past Exams Quick Link -->
        @if (history().length > 0) {
          <div class="flex justify-end mb-6">
            <button (click)="screen.set('history')"
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 text-sm hover:border-violet-500/30 transition-all">
              <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Past Examinations ({{ history().length }})
            </button>
          </div>
        }

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Focus Area Selection -->
          <div class="glass-card p-6">
            <h2 class="text-lg font-bold text-slate-200 mb-1 flex items-center gap-2">
              <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              Examination Focus
            </h2>
            <p class="text-sm text-slate-500 mb-4">Select which DORA pillar the examination will focus on</p>
            <div class="space-y-2">
              @for (f of focusOptions; track f.value) {
                <button (click)="selectedFocus.set(f.value)"
                        class="w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center gap-3"
                        [class]="selectedFocus() === f.value
                          ? 'bg-violet-500/15 border-violet-500/40 ring-1 ring-violet-500/30'
                          : 'bg-slate-800/50 border-slate-700/50 hover:border-violet-500/20 hover:bg-violet-500/5'">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                       [class]="selectedFocus() === f.value ? 'bg-violet-500/20 text-violet-400' : 'bg-slate-700/50 text-slate-500'">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="f.icon"/>
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <p class="font-medium text-sm" [class]="selectedFocus() === f.value ? 'text-violet-300' : 'text-slate-300'">{{ f.label }}</p>
                    <p class="text-xs text-slate-500">{{ f.articles }}</p>
                  </div>
                  @if (selectedFocus() === f.value) {
                    <svg class="w-5 h-5 text-violet-400 ml-auto shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  }
                </button>
              }
            </div>
          </div>

          <!-- Difficulty & Start -->
          <div class="space-y-6">
            <div class="glass-card p-6">
              <h2 class="text-lg font-bold text-slate-200 mb-1 flex items-center gap-2">
                <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                Examination Difficulty
              </h2>
              <p class="text-sm text-slate-500 mb-4">Choose the complexity level of the examination questions</p>
              <div class="space-y-2">
                @for (d of difficultyOptions; track d.value) {
                  <button (click)="selectedDifficulty.set(d.value)"
                          class="w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center gap-3"
                          [class]="selectedDifficulty() === d.value
                            ? 'bg-violet-500/15 border-violet-500/40 ring-1 ring-violet-500/30'
                            : 'bg-slate-800/50 border-slate-700/50 hover:border-violet-500/20 hover:bg-violet-500/5'">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                         [class]="d.value === 'basic' ? 'bg-emerald-500/20 text-emerald-400'
                                : d.value === 'intermediate' ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-red-500/20 text-red-400'">
                      {{ d.level }}
                    </div>
                    <div class="min-w-0">
                      <p class="font-medium text-sm" [class]="selectedDifficulty() === d.value ? 'text-violet-300' : 'text-slate-300'">{{ d.label }}</p>
                      <p class="text-xs text-slate-500">{{ d.description }}</p>
                    </div>
                  </button>
                }
              </div>
            </div>

            <!-- Exam Info -->
            <div class="glass-card p-6 border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
              <h3 class="text-sm font-bold text-violet-400 uppercase tracking-wider mb-3">Examination Protocol</h3>
              <div class="space-y-2.5 text-sm text-slate-400">
                <div class="flex items-start gap-2">
                  <svg class="w-4 h-4 text-violet-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/></svg>
                  <span>AI examiner asks scenario-based regulatory questions</span>
                </div>
                <div class="flex items-start gap-2">
                  <svg class="w-4 h-4 text-violet-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/></svg>
                  <span>Each answer is evaluated for accuracy, completeness, and regulatory alignment</span>
                </div>
                <div class="flex items-start gap-2">
                  <svg class="w-4 h-4 text-violet-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/></svg>
                  <span>Receive a supervisory grade (A-F) with detailed feedback</span>
                </div>
                <div class="flex items-start gap-2">
                  <svg class="w-4 h-4 text-violet-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/></svg>
                  <span>Identify knowledge gaps before a real regulatory inspection</span>
                </div>
              </div>
            </div>

            <!-- Start Button -->
            <button (click)="startExam()"
                    [disabled]="starting()"
                    class="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3"
                    [class]="starting()
                      ? 'bg-slate-700 text-slate-400 cursor-wait'
                      : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 hover:shadow-xl hover:shadow-violet-500/25 hover:-translate-y-0.5'">
              @if (starting()) {
                <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                Preparing Examination...
              } @else {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
                Begin Regulatory Examination
              }
            </button>
          </div>
        </div>
      }

      <!-- ==================== EXAM SCREEN ==================== -->
      @if (screen() === 'exam' || screen() === 'feedback') {
        <!-- Progress Bar -->
        <div class="glass-card p-4 mb-6">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <div>
                <p class="text-xs text-slate-500 uppercase tracking-wider font-medium">Regulatory Examination in Progress</p>
                <p class="text-sm text-slate-300">Question <span class="text-violet-400 font-bold">{{ currentQuestionIndex() + 1 }}</span> of <span class="font-semibold">{{ totalQuestions() }}</span></p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-xs text-slate-500">Points Earned</p>
              <p class="text-lg font-bold text-violet-400">{{ earnedPoints() }}<span class="text-slate-600 text-sm"> / {{ maxPossiblePoints() }}</span></p>
            </div>
          </div>
          <div class="h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-violet-600 to-purple-500 rounded-full transition-all duration-500"
                 [style.width.%]="progressPercent()"></div>
          </div>
          <!-- Question dots -->
          <div class="flex items-center gap-1 mt-3 flex-wrap">
            @for (q of session()!.questions; track q.index; let i = $index) {
              <div class="w-6 h-6 rounded-md text-[10px] font-bold flex items-center justify-center transition-all"
                   [class]="i < currentQuestionIndex() ? getQuestionDotClass(i)
                          : i === currentQuestionIndex() ? 'bg-violet-500/30 border border-violet-500 text-violet-300 ring-2 ring-violet-500/30'
                          : 'bg-slate-800/50 border border-slate-700/50 text-slate-600'">
                {{ i + 1 }}
              </div>
            }
          </div>
        </div>

        <!-- Current Question -->
        @if (currentQuestion()) {
          <div class="glass-card p-6 mb-6">
            <!-- Question Meta -->
            <div class="flex flex-wrap items-center gap-2 mb-4">
              <span class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/20">
                {{ currentQuestion()!.category }}
              </span>
              <span class="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-400 border border-slate-600/30">
                {{ currentQuestion()!.articleReference }}
              </span>
              <span class="px-2.5 py-1 rounded-lg text-xs font-medium border"
                    [class]="currentQuestion()!.difficulty === 'advanced' ? 'bg-red-500/10 text-red-400 border-red-500/20'
                           : currentQuestion()!.difficulty === 'intermediate' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                           : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'">
                {{ currentQuestion()!.difficulty | titlecase }}
              </span>
              <span class="ml-auto text-sm font-semibold text-violet-400">{{ currentQuestion()!.points }} pts</span>
            </div>

            <!-- Question Text -->
            <div class="bg-slate-900/50 rounded-xl p-5 border border-slate-700/30 mb-5">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <p class="text-slate-200 leading-relaxed">{{ currentQuestion()!.question }}</p>
              </div>
            </div>

            <!-- Answer Area -->
            @if (screen() === 'exam') {
              <div class="space-y-4">
                <label class="block">
                  <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">Your Response to the Examiner</span>
                  <textarea [(ngModel)]="currentAnswer"
                            rows="6"
                            placeholder="Provide your answer as you would to a DORA regulatory supervisor. Be specific, cite relevant articles and procedures where applicable..."
                            class="mt-2 w-full bg-slate-900/60 border border-slate-600/50 rounded-xl px-4 py-3 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 resize-y transition-all">
                  </textarea>
                </label>
                <div class="flex items-center justify-between">
                  <p class="text-xs text-slate-600">
                    @if (currentAnswer.length > 0) {
                      {{ currentAnswer.length }} characters
                    } @else {
                      Provide a thorough response for maximum points
                    }
                  </p>
                  <button (click)="submitAnswer()"
                          [disabled]="submitting() || currentAnswer.trim().length === 0"
                          class="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
                          [class]="submitting() ? 'bg-slate-700 text-slate-400 cursor-wait'
                                 : currentAnswer.trim().length === 0 ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                 : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 hover:shadow-lg hover:shadow-violet-500/25'">
                    @if (submitting()) {
                      <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      Evaluating...
                    } @else {
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                      </svg>
                      Submit Answer
                    }
                  </button>
                </div>
              </div>
            }

            <!-- Feedback Area -->
            @if (screen() === 'feedback' && currentFeedback()) {
              <div class="space-y-4 animate-fade-in-up">
                <!-- Score Banner -->
                <div class="rounded-xl p-4 border-l-4 flex items-center gap-4"
                     [class]="getFeedbackBannerClass(currentFeedback()!.score, currentFeedback()!.maxPoints)">
                  <div class="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                       [class]="getFeedbackScoreBg(currentFeedback()!.score, currentFeedback()!.maxPoints)">
                    <span class="text-xl font-extrabold" [class]="getFeedbackScoreColor(currentFeedback()!.score, currentFeedback()!.maxPoints)">
                      {{ currentFeedback()!.score }}/{{ currentFeedback()!.maxPoints }}
                    </span>
                  </div>
                  <div>
                    <p class="font-bold text-lg" [class]="getFeedbackScoreColor(currentFeedback()!.score, currentFeedback()!.maxPoints)">
                      {{ getScoreLabel(currentFeedback()!.score, currentFeedback()!.maxPoints) }}
                    </p>
                    <p class="text-sm text-slate-400">{{ currentFeedback()!.feedback }}</p>
                  </div>
                </div>

                <!-- Strengths & Gaps -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Strengths -->
                  @if (currentFeedback()!.strengths.length > 0) {
                    <div class="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/15">
                      <h4 class="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        Strengths Identified
                      </h4>
                      <div class="space-y-2">
                        @for (s of currentFeedback()!.strengths; track s) {
                          <div class="flex items-start gap-2">
                            <svg class="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                            <span class="text-xs text-slate-300">{{ s }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- Gaps -->
                  @if (currentFeedback()!.gaps.length > 0) {
                    <div class="bg-red-500/5 rounded-xl p-4 border border-red-500/15">
                      <h4 class="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        Gaps to Address
                      </h4>
                      <div class="space-y-2">
                        @for (g of currentFeedback()!.gaps; track g) {
                          <div class="flex items-start gap-2">
                            <svg class="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            <span class="text-xs text-slate-300">{{ g }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>

                <!-- Recommendation -->
                @if (currentFeedback()!.recommendation) {
                  <div class="bg-violet-500/5 rounded-xl p-4 border border-violet-500/15">
                    <h4 class="text-sm font-bold text-violet-400 mb-2 flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                      Examiner's Recommendation
                    </h4>
                    <p class="text-sm text-slate-300">{{ currentFeedback()!.recommendation }}</p>
                  </div>
                }

                <!-- Next Question Button -->
                <div class="flex justify-end">
                  <button (click)="nextQuestion()"
                          [disabled]="completing()"
                          class="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
                          [class]="completing()
                            ? 'bg-slate-700 text-slate-400 cursor-wait'
                            : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 hover:shadow-lg hover:shadow-violet-500/25'">
                    @if (completing()) {
                      <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      Completing...
                    } @else if (isLastQuestion()) {
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
                      Complete Examination
                    } @else {
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                      Next Question
                    }
                  </button>
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- ==================== RESULTS SCREEN ==================== -->
      @if (screen() === 'results' && examResult()) {
        <div class="space-y-8 animate-fade-in-up">
          <!-- Grade Hero -->
          <div class="glass-card p-8 text-center relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br opacity-10"
                 [class]="getGradeGradientClass(examResult()!.grade)"></div>
            <div class="relative">
              <p class="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Supervisory Examination Result</p>
              <div class="w-28 h-28 rounded-2xl mx-auto mb-4 flex items-center justify-center border-2"
                   [class]="getGradeBorderClass(examResult()!.grade)">
                <span class="text-6xl font-black" [class]="getGradeTextClass(examResult()!.grade)">{{ examResult()!.grade }}</span>
              </div>
              <p class="text-3xl font-bold text-white mb-1">{{ examResult()!.percentage | number:'1.0-0' }}%</p>
              <p class="text-slate-400 mb-4">{{ examResult()!.earnedPoints }} / {{ examResult()!.totalPoints }} points</p>
              <div class="inline-block px-5 py-2 rounded-xl text-sm font-semibold border"
                   [class]="getVerdictClass(examResult()!.grade)">
                {{ examResult()!.verdict }}
              </div>
            </div>
          </div>

          <!-- Category Breakdown -->
          @if (examResult()!.categoryScores && examResult()!.categoryScores.length > 0) {
            <div class="glass-card p-6">
              <h2 class="text-lg font-bold text-slate-200 mb-5 flex items-center gap-2">
                <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                Performance by Category
              </h2>
              <div class="space-y-4">
                @for (cat of examResult()!.categoryScores; track cat.category) {
                  <div>
                    <div class="flex items-center justify-between mb-1.5">
                      <span class="text-sm font-medium text-slate-300">{{ cat.category }}</span>
                      <span class="text-sm font-bold" [class]="getCategoryScoreColor(cat.percentage)">
                        {{ cat.earned }}/{{ cat.total }} ({{ cat.percentage | number:'1.0-0' }}%)
                      </span>
                    </div>
                    <div class="h-3 bg-slate-800/60 rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-1000"
                           [class]="getCategoryBarClass(cat.percentage)"
                           [style.width.%]="cat.percentage">
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Score Summary KPIs -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="glass-card p-4 text-center">
              <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">Grade</p>
              <p class="text-3xl font-bold" [class]="getGradeTextClass(examResult()!.grade)">{{ examResult()!.grade }}</p>
            </div>
            <div class="glass-card p-4 text-center">
              <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">Score</p>
              <p class="text-3xl font-bold text-violet-400">{{ examResult()!.percentage | number:'1.0-0' }}%</p>
            </div>
            <div class="glass-card p-4 text-center">
              <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">Points</p>
              <p class="text-3xl font-bold text-slate-200">{{ examResult()!.earnedPoints }}</p>
            </div>
            <div class="glass-card p-4 text-center">
              <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">Questions</p>
              <p class="text-3xl font-bold text-slate-200">{{ totalQuestions() }}</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button (click)="resetExam()"
                    class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 hover:shadow-xl hover:shadow-violet-500/25 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Take Another Exam
            </button>
            <button (click)="screen.set('history')"
                    class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-slate-800 border border-slate-700 text-slate-300 hover:border-violet-500/30 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              View History
            </button>
            <a routerLink="/dashboard"
               class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
              Dashboard
            </a>
          </div>
        </div>
      }

      <!-- ==================== HISTORY SCREEN ==================== -->
      @if (screen() === 'history') {
        <div class="space-y-6">
          <!-- Header -->
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-white flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                Examination History
              </h1>
              <p class="text-slate-400 text-sm mt-1">Review your past regulatory examination results</p>
            </div>
            <button (click)="resetExam()"
                    class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              New Exam
            </button>
          </div>

          @if (historyLoading()) {
            <div class="glass-card p-12 text-center">
              <svg class="w-8 h-8 animate-spin text-violet-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              <p class="text-slate-400">Loading examination history...</p>
            </div>
          }

          @if (!historyLoading() && history().length === 0) {
            <div class="glass-card p-12 text-center">
              <div class="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-6 border border-slate-700/50">
                <svg class="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <h2 class="text-xl font-bold text-slate-200 mb-2">No examinations yet</h2>
              <p class="text-slate-400 mb-6">Complete your first regulatory examination to see results here</p>
              <button (click)="resetExam()"
                      class="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all">
                Start First Exam
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </button>
            </div>
          }

          @if (!historyLoading() && history().length > 0) {
            <div class="space-y-3">
              @for (entry of history(); track entry.sessionId) {
                <div class="glass-card p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-violet-500/20 transition-all">
                  <!-- Grade Badge -->
                  <div class="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border"
                       [class]="getGradeBorderClass(entry.grade)">
                    <span class="text-2xl font-black" [class]="getGradeTextClass(entry.grade)">{{ entry.grade }}</span>
                  </div>
                  <!-- Details -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <p class="font-semibold text-slate-200">{{ getFocusLabel(entry.focus) }}</p>
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase"
                            [class]="entry.difficulty === 'advanced' ? 'bg-red-500/15 text-red-400'
                                   : entry.difficulty === 'intermediate' ? 'bg-amber-500/15 text-amber-400'
                                   : 'bg-emerald-500/15 text-emerald-400'">
                        {{ entry.difficulty }}
                      </span>
                    </div>
                    <div class="flex items-center gap-4 text-xs text-slate-500">
                      <span>{{ entry.totalQuestions }} questions</span>
                      <span>{{ entry.completedAt | date:'medium' }}</span>
                    </div>
                  </div>
                  <!-- Score -->
                  <div class="text-right shrink-0">
                    <p class="text-2xl font-bold" [class]="getGradeTextClass(entry.grade)">{{ entry.percentage | number:'1.0-0' }}%</p>
                    <p class="text-xs text-slate-500">Score</p>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- ==================== ERROR STATE ==================== -->
      @if (error()) {
        <div class="glass-card p-6 border-red-500/20 bg-red-500/5 mt-6">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <div>
              <p class="font-semibold text-red-400 mb-1">Examination Error</p>
              <p class="text-sm text-slate-400">{{ error() }}</p>
            </div>
            <button (click)="error.set(null)" class="ml-auto text-slate-500 hover:text-slate-300">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class ExamSimulatorComponent implements OnInit {
  readonly lang = inject(LangService);
  private readonly http = inject(HttpClient);
  private readonly titleService = inject(Title);
  private readonly destroyRef = inject(DestroyRef);

  // State
  screen = signal<Screen>('setup');
  error = signal<string | null>(null);

  // Setup
  selectedFocus = signal('all');
  selectedDifficulty = signal('intermediate');
  starting = signal(false);

  // Exam session
  session = signal<ExamSession | null>(null);
  currentQuestionIndex = signal(0);
  currentAnswer = '';
  submitting = signal(false);
  currentFeedback = signal<AnswerFeedback | null>(null);
  feedbackScores = signal<{ index: number; score: number; max: number }[]>([]);

  // Results
  examResult = signal<ExamResult | null>(null);
  completing = signal(false);

  // History
  history = signal<HistoryEntry[]>([]);
  historyLoading = signal(false);

  // Focus options
  readonly focusOptions = [
    { value: 'all', label: 'All DORA Pillars', articles: 'Articles 1-56, Full Scope', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { value: 'ict_risk', label: 'ICT Risk Management', articles: 'Articles 5-16', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { value: 'incident', label: 'Incident Management', articles: 'Articles 17-23', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    { value: 'resilience', label: 'Digital Resilience Testing', articles: 'Articles 24-27', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
    { value: 'third_party', label: 'Third-Party ICT Risk', articles: 'Articles 28-44', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { value: 'info_sharing', label: 'Information Sharing', articles: 'Articles 45-56', icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' },
  ];

  // Difficulty options
  readonly difficultyOptions = [
    { value: 'basic', label: 'Basic', level: 'L1', description: 'Foundational concepts and awareness-level questions' },
    { value: 'intermediate', label: 'Intermediate', level: 'L2', description: 'Applied knowledge with implementation scenarios' },
    { value: 'advanced', label: 'Advanced', level: 'L3', description: 'Expert-level supervisory examination standards' },
  ];

  // Computed
  currentQuestion = computed(() => {
    const s = this.session();
    const idx = this.currentQuestionIndex();
    if (!s || idx >= s.questions.length) return null;
    return s.questions[idx];
  });

  totalQuestions = computed(() => this.session()?.totalQuestions ?? 0);

  progressPercent = computed(() => {
    const total = this.totalQuestions();
    if (total === 0) return 0;
    return ((this.currentQuestionIndex()) / total) * 100;
  });

  earnedPoints = computed(() => {
    return this.feedbackScores().reduce((sum, f) => sum + f.score, 0);
  });

  maxPossiblePoints = computed(() => {
    return this.feedbackScores().reduce((sum, f) => sum + f.max, 0);
  });

  isLastQuestion = computed(() => {
    return this.currentQuestionIndex() >= this.totalQuestions() - 1;
  });

  ngOnInit() {
    this.titleService.setTitle('DORA Exam Simulator');
    this.loadHistory();
  }

  startExam() {
    this.starting.set(true);
    this.error.set(null);
    this.http.post<ExamSession>('/api/exam-simulator/start', {
      focus: this.selectedFocus(),
      difficulty: this.selectedDifficulty()
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.session.set(data);
        this.currentQuestionIndex.set(0);
        this.currentAnswer = '';
        this.currentFeedback.set(null);
        this.feedbackScores.set([]);
        this.examResult.set(null);
        this.screen.set('exam');
        this.starting.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to start examination. Please try again.');
        this.starting.set(false);
      }
    });
  }

  submitAnswer() {
    const s = this.session();
    if (!s || this.currentAnswer.trim().length === 0) return;

    this.submitting.set(true);
    this.error.set(null);
    this.http.post<AnswerFeedback>('/api/exam-simulator/answer', {
      sessionId: s.sessionId,
      questionIndex: this.currentQuestionIndex(),
      answer: this.currentAnswer.trim()
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (feedback) => {
        this.currentFeedback.set(feedback);
        this.feedbackScores.update(scores => [
          ...scores,
          { index: this.currentQuestionIndex(), score: feedback.score, max: feedback.maxPoints }
        ]);
        this.screen.set('feedback');
        this.submitting.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to evaluate answer. Please try again.');
        this.submitting.set(false);
      }
    });
  }

  nextQuestion() {
    if (this.isLastQuestion()) {
      this.completeExam();
      return;
    }
    this.currentQuestionIndex.update(i => i + 1);
    this.currentAnswer = '';
    this.currentFeedback.set(null);
    this.screen.set('exam');
  }

  private completeExam() {
    const s = this.session();
    if (!s) return;

    this.completing.set(true);
    this.error.set(null);
    this.http.post<ExamResult>('/api/exam-simulator/complete', {
      sessionId: s.sessionId
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.examResult.set(result);
        this.screen.set('results');
        this.completing.set(false);
        this.loadHistory();
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to complete examination.');
        this.completing.set(false);
      }
    });
  }

  loadHistory() {
    this.historyLoading.set(true);
    this.http.get<HistoryEntry[]>('/api/exam-simulator/history').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.history.set(data || []);
        this.historyLoading.set(false);
      },
      error: () => {
        this.history.set([]);
        this.historyLoading.set(false);
      }
    });
  }

  resetExam() {
    this.screen.set('setup');
    this.session.set(null);
    this.currentQuestionIndex.set(0);
    this.currentAnswer = '';
    this.currentFeedback.set(null);
    this.feedbackScores.set([]);
    this.examResult.set(null);
    this.error.set(null);
  }

  // --- UI Helpers ---

  private scorePct(score: number, max: number): number {
    return max > 0 ? (score / max) * 100 : 0;
  }

  getQuestionDotClass(index: number): string {
    const feedback = this.feedbackScores().find(f => f.index === index);
    if (!feedback) return 'bg-slate-700/50 border border-slate-600/50 text-slate-500';
    const pct = this.scorePct(feedback.score, feedback.max);
    if (pct >= 70) return 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400';
    if (pct >= 40) return 'bg-amber-500/20 border border-amber-500/40 text-amber-400';
    return 'bg-red-500/20 border border-red-500/40 text-red-400';
  }

  getFeedbackBannerClass(score: number, max: number): string {
    const pct = this.scorePct(score, max);
    if (pct >= 70) return 'bg-emerald-500/5 border-l-emerald-500 border border-emerald-500/15';
    if (pct >= 40) return 'bg-amber-500/5 border-l-amber-500 border border-amber-500/15';
    return 'bg-red-500/5 border-l-red-500 border border-red-500/15';
  }

  getFeedbackScoreBg(score: number, max: number): string {
    const pct = this.scorePct(score, max);
    if (pct >= 70) return 'bg-emerald-500/20';
    if (pct >= 40) return 'bg-amber-500/20';
    return 'bg-red-500/20';
  }

  getFeedbackScoreColor(score: number, max: number): string {
    const pct = this.scorePct(score, max);
    if (pct >= 70) return 'text-emerald-400';
    if (pct >= 40) return 'text-amber-400';
    return 'text-red-400';
  }

  getScoreLabel(score: number, max: number): string {
    const pct = this.scorePct(score, max);
    if (pct >= 90) return 'Excellent Response';
    if (pct >= 70) return 'Good Response';
    if (pct >= 50) return 'Adequate Response';
    if (pct >= 30) return 'Partial Response';
    return 'Insufficient Response';
  }

  getGradeGradientClass(grade: string): string {
    switch (grade) {
      case 'A': return 'from-emerald-500 to-cyan-500';
      case 'B': return 'from-emerald-500 to-teal-500';
      case 'C': return 'from-amber-500 to-yellow-500';
      case 'D': return 'from-orange-500 to-amber-500';
      default: return 'from-red-500 to-rose-500';
    }
  }

  getGradeBorderClass(grade: string): string {
    switch (grade) {
      case 'A': return 'border-emerald-500/40 bg-emerald-500/10';
      case 'B': return 'border-teal-500/40 bg-teal-500/10';
      case 'C': return 'border-amber-500/40 bg-amber-500/10';
      case 'D': return 'border-orange-500/40 bg-orange-500/10';
      default: return 'border-red-500/40 bg-red-500/10';
    }
  }

  getGradeTextClass(grade: string): string {
    switch (grade) {
      case 'A': return 'text-emerald-400';
      case 'B': return 'text-teal-400';
      case 'C': return 'text-amber-400';
      case 'D': return 'text-orange-400';
      default: return 'text-red-400';
    }
  }

  getVerdictClass(grade: string): string {
    switch (grade) {
      case 'A': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'B': return 'bg-teal-500/10 border-teal-500/30 text-teal-400';
      case 'C': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'D': return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      default: return 'bg-red-500/10 border-red-500/30 text-red-400';
    }
  }

  getCategoryScoreColor(pct: number): string {
    if (pct >= 70) return 'text-emerald-400';
    if (pct >= 40) return 'text-amber-400';
    return 'text-red-400';
  }

  getCategoryBarClass(pct: number): string {
    if (pct >= 70) return 'bg-gradient-to-r from-emerald-600 to-emerald-500';
    if (pct >= 40) return 'bg-gradient-to-r from-amber-600 to-amber-500';
    return 'bg-gradient-to-r from-red-600 to-red-500';
  }

  getFocusLabel(focus: string): string {
    const opt = this.focusOptions.find(f => f.value === focus);
    return opt?.label ?? focus;
  }
}
