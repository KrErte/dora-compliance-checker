import { Component, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';
import { ApiService } from '../api.service';
import { SubscriptionService } from '../services/subscription.service';

@Component({
  selector: 'app-stress-test',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- ============================================================ -->
    <!-- PHASE: SELECTION                                             -->
    <!-- ============================================================ -->
    @if (phase() === 'selection') {
      <div class="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
        <!-- Header -->
        <div class="text-center mb-10">
          <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
            <svg class="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"/>
            </svg>
          </div>
          <h1 class="text-3xl font-bold gradient-text mb-3">
            {{ lang.l('DORA Stressitest', 'DORA Stress Test') }}
          </h1>
          <p class="text-slate-400 max-w-2xl mx-auto">
            {{ lang.l(
              'Reaalajas kriisisimulatsiooni harjutus. Ajastatud sündmused, kiired otsused, edetabel. Nagu lennusimulaator vastavusametnikele.',
              'Real-time crisis simulation exercise. Timed events, split-second decisions, leaderboard rankings. Like a flight simulator for compliance officers.'
            ) }}
          </p>
        </div>

        <!-- Difficulty Selector -->
        <div class="flex items-center justify-center gap-3 mb-8">
          <span class="text-sm text-slate-400 mr-2">{{ lang.l('Raskusaste', 'Difficulty') }}:</span>
          <button (click)="selectedDifficulty.set('CADET')"
            [class]="selectedDifficulty() === 'CADET'
              ? 'px-5 py-2 rounded-lg text-sm font-medium bg-green-500/20 border border-green-500/50 text-green-400'
              : 'px-5 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-400 hover:bg-slate-100 transition-colors'">
            {{ lang.l('Kadett', 'Cadet') }}
          </button>
          <button (click)="selectedDifficulty.set('OFFICER')"
            [class]="selectedDifficulty() === 'OFFICER'
              ? 'px-5 py-2 rounded-lg text-sm font-medium bg-amber-500/20 border border-amber-500/50 text-amber-400'
              : 'px-5 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-400 hover:bg-slate-100 transition-colors'">
            {{ lang.l('Ohvitser', 'Officer') }}
          </button>
          <button (click)="selectedDifficulty.set('COMMANDER')"
            [class]="selectedDifficulty() === 'COMMANDER'
              ? 'px-5 py-2 rounded-lg text-sm font-medium bg-red-500/20 border border-red-500/50 text-red-400'
              : 'px-5 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-400 hover:bg-slate-100 transition-colors'">
            {{ lang.l('Komandor', 'Commander') }}
          </button>
        </div>

        <!-- Scenario Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          @for (ex of exercises(); track ex.id) {
            <div class="relative rounded-xl bg-white border border-slate-200 overflow-hidden hover:border-slate-300/70 transition-all duration-200 cursor-pointer group"
                 [style.border-left]="'4px solid ' + getScenarioColor(ex.category)"
                 (click)="!isLocked(ex) && selectScenario(ex.id)">
              <!-- Premium Lock Overlay -->
              @if (isLocked(ex)) {
                <div class="absolute inset-0 bg-slate-900/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                  <svg class="w-8 h-8 text-amber-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                  <span class="text-amber-400 text-sm font-medium">{{ lang.l('Uuenda plaani', 'Upgrade Plan') }}</span>
                </div>
              }
              <div class="p-5">
                <!-- Category & Difficulty -->
                <div class="flex items-center justify-between mb-3">
                  <span class="text-xs font-semibold uppercase tracking-wider" [style.color]="getScenarioColor(ex.category)">
                    {{ lang.l(ex.titleEt || ex.title, ex.title) }}
                  </span>
                  <span class="text-xs px-2 py-0.5 rounded-full"
                    [class]="getDifficultyBadgeClass(ex.difficulty)">
                    {{ ex.difficulty }}
                  </span>
                </div>
                <!-- Description -->
                <p class="text-slate-400 text-sm mb-4 line-clamp-2">
                  {{ lang.l(ex.descriptionEt || ex.description, ex.description) }}
                </p>
                <!-- Meta -->
                <div class="flex items-center gap-4 text-xs text-slate-500">
                  <span class="flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    {{ ex.eventCount }} {{ lang.l('sündmust', 'events') }}
                  </span>
                  <span class="flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ formatDuration(ex.durationSeconds || 300) }}
                  </span>
                  @if (ex.premium) {
                    <span class="flex items-center gap-1 text-amber-400">
                      <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      Premium
                    </span>
                  }
                </div>
              </div>
              <!-- Hover Indicator -->
              @if (!isLocked(ex)) {
                <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity"
                     [style.background]="'linear-gradient(to right, ' + getScenarioColor(ex.category) + ', transparent)'"></div>
              }
            </div>
          }
        </div>

        <!-- Loading State -->
        @if (loading()) {
          <div class="text-center py-12">
            <div class="w-8 h-8 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin mx-auto mb-3"></div>
            <p class="text-slate-400 text-sm">{{ lang.l('Laadin harjutusi...', 'Loading exercises...') }}</p>
          </div>
        }

        <!-- Back Link -->
        <div class="text-center mt-6">
          <a routerLink="/dashboard" class="text-sm text-slate-500 hover:text-slate-600 transition-colors">
            {{ lang.l('Tagasi töölauale', 'Back to Dashboard') }}
          </a>
        </div>
      </div>
    }

    <!-- ============================================================ -->
    <!-- PHASE: COUNTDOWN                                             -->
    <!-- ============================================================ -->
    @if (phase() === 'countdown') {
      <div class="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center">
        <div class="text-center">
          <div class="countdown-number text-9xl font-black text-white" [class.countdown-go]="countdownValue() === 0">
            @if (countdownValue() > 0) {
              {{ countdownValue() }}
            } @else {
              GO!
            }
          </div>
          <p class="text-slate-500 text-lg mt-6">
            {{ lang.l('Valmista ette...', 'Prepare yourself...') }}
          </p>
        </div>
      </div>
    }

    <!-- ============================================================ -->
    <!-- PHASE: ACTIVE (FULL-SCREEN IMMERSIVE)                        -->
    <!-- ============================================================ -->
    @if (phase() === 'active') {
      <div class="fixed inset-0 z-40 bg-slate-950 overflow-hidden flex flex-col"
           [class.stress-pulse]="stressLevel() > 60"
           [class.stress-critical]="stressLevel() > 80">

        <!-- Top Bar -->
        <div class="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-800/50 shrink-0">
          <!-- Scenario Title -->
          <div class="flex items-center gap-3">
            <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span class="text-sm font-semibold text-slate-600 uppercase tracking-wider">
              {{ lang.l('ELAV HARJUTUS', 'LIVE EXERCISE') }}
            </span>
            <span class="text-sm text-slate-500">|</span>
            <span class="text-sm text-slate-400">{{ session()?.scenario?.title }}</span>
          </div>

          <!-- Center: Timer -->
          <div class="flex items-center gap-3">
            <div class="text-center" [class.timer-shake]="timeRemaining() < 30">
              <div class="font-mono text-4xl font-bold tracking-wider"
                   [class]="timerColorClass()">
                {{ formatTimer(timeRemaining()) }}
              </div>
              <div class="text-xs text-slate-500 mt-0.5">{{ lang.l('AEGA JÄÄNUD', 'TIME REMAINING') }}</div>
            </div>
          </div>

          <!-- Right: Score + Events Counter -->
          <div class="flex items-center gap-6">
            <div class="text-center">
              <div class="text-2xl font-bold text-white">
                {{ currentScore() }}
                @if (scoreFlash()) {
                  <span class="text-sm ml-1 animate-bounce-once"
                        [class]="scoreFlash() === 'good' ? 'text-green-400' : 'text-red-400'">
                    {{ scoreFlash() === 'good' ? '+' + lastPointsEarned() : '+0' }}
                  </span>
                }
              </div>
              <div class="text-xs text-slate-500">{{ lang.l('SKOOR', 'SCORE') }}</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-semibold text-slate-600">{{ activeEvents().length }}</div>
              <div class="text-xs text-slate-500">{{ lang.l('OOTEL', 'QUEUED') }}</div>
            </div>
            <!-- Abort Button -->
            <button (click)="finishExercise()"
              class="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors">
              {{ lang.l('Lõpeta', 'Abort') }}
            </button>
          </div>
        </div>

        <!-- Stress Level Bar -->
        <div class="h-1 bg-slate-900 shrink-0">
          <div class="h-full transition-all duration-500"
               [style.width.%]="stressLevel()"
               [class]="stressLevel() > 80 ? 'bg-red-500' : stressLevel() > 50 ? 'bg-amber-500' : 'bg-green-500'">
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="flex-1 flex overflow-hidden">
          <!-- Left Column: Event Queue -->
          <div class="w-80 border-r border-slate-800/50 bg-slate-900/30 overflow-y-auto p-4 space-y-3 shrink-0">
            <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>{{ lang.l('Sündmuste järjekord', 'Event Queue') }}</span>
              <span class="text-slate-600">{{ activeEvents().length }}/{{ session()?.totalEvents || '?' }}</span>
            </div>

            @if (activeEvents().length === 0) {
              <div class="text-center py-8">
                <div class="w-8 h-8 border-2 border-slate-700 border-t-blue-400 rounded-full animate-spin mx-auto mb-3"></div>
                <p class="text-slate-600 text-xs">{{ lang.l('Ootan sündmusi...', 'Waiting for events...') }}</p>
              </div>
            }

            @for (event of activeEvents(); track event.id) {
              <div class="event-card rounded-lg border p-3 cursor-pointer transition-all duration-200"
                   [class]="selectedEvent()?.id === event.id
                     ? 'bg-slate-800 border-blue-500/50 shadow-lg shadow-blue-500/5'
                     : 'bg-white border-slate-200 hover:border-slate-200'"
                   (click)="selectEvent(event)">
                <!-- Type Icon + Urgency -->
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span [innerHTML]="getEventTypeIcon(event.type)"></span>
                    <span class="text-xs font-medium text-slate-400">{{ getEventTypeLabel(event.type) }}</span>
                  </div>
                  <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                        [class]="getUrgencyClass(event.urgency)">
                    {{ event.urgency }}/10
                  </span>
                </div>
                <!-- Title -->
                <p class="text-sm font-medium text-slate-700 mb-2 line-clamp-2">
                  {{ lang.l(event.titleEt || event.title, event.title) }}
                </p>
                <!-- Response Window Bar -->
                <div class="w-full h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-1000"
                       [style.width.%]="getEventTimePercent(event)"
                       [class]="getEventTimePercent(event) > 50 ? 'bg-green-500' : getEventTimePercent(event) > 25 ? 'bg-amber-500' : 'bg-red-500'">
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Center: Decision Panel -->
          <div class="flex-1 flex items-center justify-center p-8">
            @if (selectedEvent()) {
              <div class="max-w-2xl w-full animate-fade-in">
                <!-- Event Type Badge -->
                <div class="flex items-center gap-3 mb-4">
                  <span [innerHTML]="getEventTypeIconLarge(selectedEvent()!.type)"></span>
                  <span class="text-sm font-semibold uppercase tracking-wider"
                        [style.color]="getEventTypeColor(selectedEvent()!.type)">
                    {{ getEventTypeLabel(selectedEvent()!.type) }}
                  </span>
                  <span class="text-xs px-2.5 py-1 rounded-full font-bold"
                        [class]="getUrgencyClass(selectedEvent()!.urgency)">
                    {{ lang.l('Kiireloomulisus', 'Urgency') }}: {{ selectedEvent()!.urgency }}/10
                  </span>
                </div>

                <!-- Event Title -->
                <h2 class="text-2xl font-bold text-white mb-3">
                  {{ lang.l(selectedEvent()!.titleEt || selectedEvent()!.title, selectedEvent()!.title) }}
                </h2>

                <!-- Event Description -->
                <p class="text-slate-400 text-base mb-8 leading-relaxed">
                  {{ lang.l(selectedEvent()!.descriptionEt || selectedEvent()!.description, selectedEvent()!.description) }}
                </p>

                <!-- Decision Options -->
                <div class="space-y-3">
                  @for (option of selectedEvent()!.options; track $index) {
                    <button (click)="submitDecision($index)"
                      class="w-full text-left px-6 py-4 rounded-xl border transition-all duration-200 group"
                      [class]="respondingTo() === $index
                        ? (lastResponseCorrect() ? 'bg-green-500/20 border-green-500/50' : 'bg-red-500/20 border-red-500/50')
                        : 'bg-white border-slate-200 hover:bg-slate-800 hover:border-slate-300 hover:shadow-lg'"
                      [disabled]="responding()">
                      <div class="flex items-center gap-4">
                        <span class="w-8 h-8 rounded-lg bg-slate-700/50 group-hover:bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-400 shrink-0 transition-colors">
                          {{ getOptionLetter($index) }}
                        </span>
                        <span class="text-base text-slate-700">
                          {{ lang.l(option.labelEt || option.label, option.label) }}
                        </span>
                      </div>
                    </button>
                  }
                </div>

                <!-- Response Window Countdown -->
                <div class="mt-6">
                  <div class="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>{{ lang.l('Vastamise aeg', 'Response window') }}</span>
                    <span>{{ getEventRemainingSeconds(selectedEvent()!) }}s</span>
                  </div>
                  <div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-1000"
                         [style.width.%]="getEventTimePercent(selectedEvent()!)"
                         [class]="getEventTimePercent(selectedEvent()!) > 50 ? 'bg-blue-500' : getEventTimePercent(selectedEvent()!) > 25 ? 'bg-amber-500' : 'bg-red-500 animate-pulse'">
                    </div>
                  </div>
                </div>
              </div>
            } @else {
              <!-- No Event Selected -->
              <div class="text-center">
                <div class="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <p class="text-slate-600 text-lg font-medium">{{ lang.l('Ootan sündmusi...', 'Awaiting events...') }}</p>
                <p class="text-slate-700 text-sm mt-1">{{ lang.l('Sündmused saabuvad reaalajas', 'Events arrive in real-time') }}</p>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- ============================================================ -->
    <!-- PHASE: RESULTS                                               -->
    <!-- ============================================================ -->
    @if (phase() === 'results') {
      <div class="max-w-4xl mx-auto px-4 py-8 animate-fade-in">

        <!-- Grade Reveal -->
        <div class="text-center mb-12">
          <div class="grade-reveal inline-block mb-6">
            <div class="text-9xl font-black"
                 [class]="getGradeColor(results()?.grade)">
              {{ results()?.grade || '?' }}
            </div>
          </div>
          <h2 class="text-2xl font-bold text-white mb-2">
            {{ lang.l('Harjutus lõpetatud!', 'Exercise Complete!') }}
          </h2>
          <p class="text-slate-400">
            {{ getGradeMessage(results()?.grade) }}
          </p>
        </div>

        <!-- Score Overview -->
        <div class="grid grid-cols-3 gap-4 mb-10">
          <div class="rounded-xl bg-white border border-slate-200 p-6 text-center">
            <div class="text-3xl font-bold text-white mb-1">{{ results()?.totalScore || 0 }}</div>
            <div class="text-sm text-slate-400">/ {{ results()?.maxScore || 0 }} {{ lang.l('punkti', 'points') }}</div>
          </div>
          <div class="rounded-xl bg-white border border-slate-200 p-6 text-center">
            <div class="text-3xl font-bold text-white mb-1">{{ results()?.percentage || 0 }}%</div>
            <div class="text-sm text-slate-400">{{ lang.l('Täpsus', 'Accuracy') }}</div>
          </div>
          <div class="rounded-xl bg-white border border-slate-200 p-6 text-center">
            <div class="text-3xl font-bold text-amber-400 mb-1">#{{ results()?.leaderboardPosition || '-' }}</div>
            <div class="text-sm text-slate-400">{{ lang.l('Edetabelis', 'Leaderboard') }}</div>
          </div>
        </div>

        <!-- Category Gauges -->
        @if (results()?.categories?.length) {
          <div class="rounded-xl bg-white border border-slate-200 p-6 mb-8">
            <h3 class="text-lg font-semibold text-white mb-5">
              {{ lang.l('Kategooriate tulemused', 'Category Breakdown') }}
            </h3>
            <div class="space-y-4">
              @for (cat of results()!.categories; track cat.name) {
                <div>
                  <div class="flex items-center justify-between text-sm mb-1.5">
                    <span class="text-slate-600">{{ lang.l(cat.nameEt || cat.name, cat.name) }}</span>
                    <span class="text-slate-400 font-mono">{{ cat.score }}/{{ cat.maxScore }}</span>
                  </div>
                  <div class="w-full h-3 rounded-full bg-slate-700/50 overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-1000"
                         [style.width.%]="cat.maxScore > 0 ? (cat.score / cat.maxScore * 100) : 0"
                         [class]="getCategoryBarColor(cat.score, cat.maxScore)">
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Event-by-Event Replay -->
        @if (results()?.eventResults?.length) {
          <div class="rounded-xl bg-white border border-slate-200 p-6 mb-8">
            <h3 class="text-lg font-semibold text-white mb-5">
              {{ lang.l('Sündmuste taasesitus', 'Event-by-Event Replay') }}
            </h3>
            <div class="space-y-3">
              @for (er of results()!.eventResults; track $index) {
                <div class="flex items-center gap-4 p-3 rounded-lg bg-slate-900/40 border border-slate-200">
                  <!-- Index -->
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                       [class]="er.pointsEarned > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'">
                    {{ $index + 1 }}
                  </div>
                  <!-- Event Details -->
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-slate-700 truncate">{{ er.eventTitle }}</p>
                    <div class="flex items-center gap-3 mt-0.5">
                      <span class="text-xs text-slate-500">
                        {{ lang.l('Sinu valik', 'Your choice') }}: <span class="text-slate-600">{{ er.chosen }}</span>
                      </span>
                      @if (er.chosen !== er.optimal) {
                        <span class="text-xs text-slate-500">
                          {{ lang.l('Optimaalne', 'Optimal') }}: <span class="text-green-400">{{ er.optimal }}</span>
                        </span>
                      }
                    </div>
                  </div>
                  <!-- Reaction Time -->
                  <div class="text-right shrink-0">
                    <div class="text-sm font-mono" [class]="er.pointsEarned > 0 ? 'text-green-400' : 'text-red-400'">
                      +{{ er.pointsEarned }}
                    </div>
                    <div class="text-xs text-slate-500">{{ (er.reactionTimeMs / 1000).toFixed(1) }}s</div>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Leaderboard -->
        @if (leaderboard().length > 0) {
          <div class="rounded-xl bg-white border border-slate-200 p-6 mb-8">
            <h3 class="text-lg font-semibold text-white mb-5">
              {{ lang.l('Edetabel', 'Leaderboard') }}
            </h3>
            <div class="space-y-2">
              @for (entry of leaderboard(); track entry.rank) {
                <div class="flex items-center gap-4 p-3 rounded-lg"
                     [class]="entry.rank === results()?.leaderboardPosition ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-slate-900/30'">
                  <span class="w-8 text-center font-bold text-lg"
                        [class]="entry.rank === 1 ? 'text-amber-400' : entry.rank === 2 ? 'text-slate-600' : entry.rank === 3 ? 'text-orange-400' : 'text-slate-500'">
                    {{ entry.rank }}
                  </span>
                  <span class="flex-1 text-sm text-slate-600">{{ entry.anonymous || ('Player #' + entry.rank) }}</span>
                  <span class="font-mono text-sm font-bold"
                        [class]="getGradeColor(entry.grade)">
                    {{ entry.grade }}
                  </span>
                  <span class="text-sm font-mono text-slate-400 w-16 text-right">{{ entry.score }}</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- Action Buttons -->
        <div class="flex items-center justify-center gap-4">
          <button (click)="retryExercise()"
            class="px-6 py-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 font-medium hover:bg-blue-500/20 transition-colors">
            {{ lang.l('Proovi uuesti', 'Try Again') }}
          </button>
          @if (canGoHarder()) {
            <button (click)="goHarder()"
              class="px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium hover:bg-red-500/20 transition-colors">
              {{ lang.l('Raskem tase', 'Go Harder') }}
            </button>
          }
          <button (click)="backToSelection()"
            class="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-medium hover:bg-slate-100 transition-colors">
            {{ lang.l('Tagasi valikule', 'Back to Selection') }}
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    .gradient-text {
      background: linear-gradient(135deg, #60a5fa, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Countdown animations */
    .countdown-number {
      animation: countdown-pop 0.8s ease-out;
    }
    .countdown-go {
      animation: countdown-pop 0.6s ease-out;
      color: #22c55e !important;
    }

    @keyframes countdown-pop {
      0% { transform: scale(0.3); opacity: 0; }
      50% { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(1); opacity: 0.9; }
    }

    /* Timer shake */
    .timer-shake {
      animation: shake 0.4s infinite;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }

    /* Stress effects */
    .stress-pulse {
      animation: pulse-red 2s infinite;
    }
    .stress-critical {
      animation: pulse-red-critical 1s infinite;
    }

    @keyframes pulse-red {
      0%, 100% { box-shadow: inset 0 0 60px rgba(239, 68, 68, 0); }
      50% { box-shadow: inset 0 0 100px rgba(239, 68, 68, 0.15); }
    }
    @keyframes pulse-red-critical {
      0%, 100% { box-shadow: inset 0 0 60px rgba(239, 68, 68, 0.1); }
      50% { box-shadow: inset 0 0 120px rgba(239, 68, 68, 0.3); }
    }

    /* Grade reveal */
    .grade-reveal {
      animation: grade-reveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes grade-reveal {
      0% { transform: scale(0); opacity: 0; }
      60% { transform: scale(1.3); }
      100% { transform: scale(1); opacity: 1; }
    }

    /* Event card slide in */
    .event-card {
      animation: slide-in-left 0.3s ease-out;
    }

    @keyframes slide-in-left {
      from { transform: translateX(-30px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    /* Fade in */
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Bounce once for score flash */
    .animate-bounce-once {
      animation: bounceOnce 0.5s ease-out;
    }
    @keyframes bounceOnce {
      0% { transform: translateY(0); opacity: 1; }
      30% { transform: translateY(-8px); }
      60% { transform: translateY(2px); }
      100% { transform: translateY(0); opacity: 0; }
    }

    /* Scrollbar styling for event queue */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, 0.3); border-radius: 2px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(100, 116, 139, 0.5); }
  `]
})
export class StressTestComponent implements OnInit, OnDestroy {
  lang = inject(LangService);
  private api = inject(ApiService);
  sub = inject(SubscriptionService);

  // ─── State signals ──────────────────────────────────
  exercises = signal<any[]>([]);
  phase = signal<'selection' | 'countdown' | 'active' | 'results'>('selection');
  session = signal<any>(null);
  selectedDifficulty = signal<string>('OFFICER');
  countdownValue = signal(3);
  timeRemaining = signal(300);
  activeEvents = signal<any[]>([]);
  selectedEvent = signal<any>(null);
  currentScore = signal(0);
  results = signal<any>(null);
  leaderboard = signal<any[]>([]);
  eventReactionStart = signal(0);
  stressLevel = signal(0);
  loading = signal(false);
  responding = signal(false);
  respondingTo = signal<number | null>(null);
  lastResponseCorrect = signal(false);
  scoreFlash = signal<'good' | 'bad' | null>(null);
  lastPointsEarned = signal(0);
  lastSelectedScenarioId = signal<string | null>(null);

  // ─── Timers ─────────────────────────────────────────
  private timerInterval: any;
  private pollInterval: any;
  private eventExpiryInterval: any;
  private countdownInterval: any;
  private scoreFlashTimeout: any;
  private elapsedSeconds = 0;
  private eventStartTimes = new Map<string, number>();

  // ─── Computed ───────────────────────────────────────
  timerColorClass = computed(() => {
    const t = this.timeRemaining();
    if (t > 120) return 'text-white';
    if (t > 60) return 'text-amber-400';
    return 'text-red-400';
  });

  canGoHarder = computed(() => {
    const d = this.selectedDifficulty();
    return d === 'CADET' || d === 'OFFICER';
  });

  // ─── Lifecycle ──────────────────────────────────────
  ngOnInit(): void {
    this.loadExercises();
  }

  ngOnDestroy(): void {
    this.clearAllTimers();
  }

  private clearAllTimers(): void {
    clearInterval(this.timerInterval);
    clearInterval(this.pollInterval);
    clearInterval(this.eventExpiryInterval);
    clearInterval(this.countdownInterval);
    clearTimeout(this.scoreFlashTimeout);
  }

  // ─── Data Loading ───────────────────────────────────
  loadExercises(): void {
    this.loading.set(true);
    this.api.getStressExercises().subscribe({
      next: (data: any) => {
        this.exercises.set(data.exercises || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  // ─── Scenario Selection & Start ─────────────────────
  isLocked(ex: any): boolean {
    return ex.premium && !this.sub.isPremium();
  }

  selectScenario(scenarioId: string): void {
    this.lastSelectedScenarioId.set(scenarioId);
    this.phase.set('countdown');
    this.countdownValue.set(3);

    this.countdownInterval = setInterval(() => {
      const val = this.countdownValue();
      if (val > 0) {
        this.countdownValue.set(val - 1);
      } else {
        clearInterval(this.countdownInterval);
        this.startExercise(scenarioId);
      }
    }, 900);
  }

  private startExercise(scenarioId: string): void {
    this.api.startStressExercise(scenarioId, this.selectedDifficulty()).subscribe({
      next: (data: any) => {
        this.session.set(data);
        this.timeRemaining.set(data.durationSeconds || 300);
        this.currentScore.set(0);
        this.activeEvents.set([]);
        this.selectedEvent.set(null);
        this.stressLevel.set(0);
        this.elapsedSeconds = 0;
        this.eventStartTimes.clear();
        this.phase.set('active');
        this.startTimers();
      },
      error: () => {
        this.phase.set('selection');
      }
    });
  }

  // ─── Timer Management ──────────────────────────────
  private startTimers(): void {
    this.elapsedSeconds = 0;

    // Main countdown timer (1s)
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
      this.timeRemaining.update(t => Math.max(0, t - 1));

      if (this.timeRemaining() <= 0) {
        this.finishExercise();
        return;
      }

      // Update stress level
      const eventCount = this.activeEvents().length;
      const timePressure = this.timeRemaining() < 60 ? 40 : this.timeRemaining() < 120 ? 20 : 0;
      this.stressLevel.set(Math.min(100, eventCount * 20 + timePressure));
    }, 1000);

    // Event polling (2s)
    this.pollInterval = setInterval(() => {
      this.pollForEvents();
    }, 2000);

    // Event expiry checker (1s)
    this.eventExpiryInterval = setInterval(() => {
      this.checkEventExpiry();
    }, 1000);
  }

  private pollForEvents(): void {
    const sess = this.session();
    if (!sess?.sessionId) return;

    this.api.getStressEvents(sess.sessionId, this.elapsedSeconds).subscribe({
      next: (data: any) => {
        if (data.events && data.events.length > 0) {
          const now = Date.now();
          data.events.forEach((ev: any) => {
            if (!this.eventStartTimes.has(ev.id)) {
              this.eventStartTimes.set(ev.id, now);
            }
          });

          this.activeEvents.update(existing => {
            const existingIds = new Set(existing.map((e: any) => e.id));
            const newEvents = data.events.filter((e: any) => !existingIds.has(e.id));
            return [...existing, ...newEvents];
          });

          if (!this.selectedEvent()) {
            this.selectedEvent.set(data.events[0]);
            this.eventReactionStart.set(Date.now());
          }
        }
      }
    });
  }

  private checkEventExpiry(): void {
    const now = Date.now();
    const expired: string[] = [];

    this.activeEvents().forEach((event: any) => {
      const startTime = this.eventStartTimes.get(event.id);
      if (startTime && event.responseWindowSeconds) {
        const elapsed = (now - startTime) / 1000;
        if (elapsed >= event.responseWindowSeconds) {
          expired.push(event.id);
        }
      }
    });

    if (expired.length > 0) {
      // Auto-score expired events as 0
      expired.forEach(eventId => {
        const sess = this.session();
        if (sess?.sessionId) {
          this.api.respondToStressEvent(sess.sessionId, eventId, -1, 0).subscribe({
            next: (resp: any) => {
              this.currentScore.set(resp.totalScore);
            }
          });
        }
        this.eventStartTimes.delete(eventId);
      });

      this.activeEvents.update(events => events.filter(e => !expired.includes(e.id)));

      // If the selected event expired, pick next
      if (this.selectedEvent() && expired.includes(this.selectedEvent()!.id)) {
        const remaining = this.activeEvents();
        this.selectedEvent.set(remaining.length > 0 ? remaining[0] : null);
        if (remaining.length > 0) {
          this.eventReactionStart.set(Date.now());
        }
      }

      // Flash bad score
      this.flashScore('bad', 0);
    }
  }

  // ─── Event Interactions ─────────────────────────────
  selectEvent(event: any): void {
    this.selectedEvent.set(event);
    this.eventReactionStart.set(Date.now());
  }

  submitDecision(optionIndex: number): void {
    const event = this.selectedEvent();
    const sess = this.session();
    if (!event || !sess?.sessionId || this.responding()) return;

    this.responding.set(true);
    this.respondingTo.set(optionIndex);
    const reactionTimeMs = Date.now() - this.eventReactionStart();

    this.api.respondToStressEvent(sess.sessionId, event.id, optionIndex, reactionTimeMs).subscribe({
      next: (resp: any) => {
        this.lastResponseCorrect.set(resp.correct);
        this.currentScore.set(resp.totalScore);
        this.lastPointsEarned.set(resp.pointsEarned || 0);
        this.flashScore(resp.correct ? 'good' : 'bad', resp.pointsEarned || 0);

        // Brief visual feedback delay
        setTimeout(() => {
          this.eventStartTimes.delete(event.id);
          this.activeEvents.update(events => events.filter(e => e.id !== event.id));

          const remaining = this.activeEvents();
          this.selectedEvent.set(remaining.length > 0 ? remaining[0] : null);
          if (remaining.length > 0) {
            this.eventReactionStart.set(Date.now());
          }

          this.responding.set(false);
          this.respondingTo.set(null);
        }, 400);
      },
      error: () => {
        this.responding.set(false);
        this.respondingTo.set(null);
      }
    });
  }

  // ─── Exercise Completion ────────────────────────────
  finishExercise(): void {
    this.clearAllTimers();
    const sess = this.session();
    if (!sess?.sessionId) {
      this.phase.set('selection');
      return;
    }

    this.api.completeStressExercise(sess.sessionId).subscribe({
      next: (data: any) => {
        this.results.set(data);
        this.phase.set('results');

        // Load leaderboard
        const scenarioId = this.lastSelectedScenarioId();
        if (scenarioId) {
          this.api.getStressLeaderboard(scenarioId, this.selectedDifficulty()).subscribe({
            next: (lb: any) => this.leaderboard.set(lb.entries || [])
          });
        }
      },
      error: () => {
        this.phase.set('selection');
      }
    });
  }

  retryExercise(): void {
    const scenarioId = this.lastSelectedScenarioId();
    if (scenarioId) {
      this.results.set(null);
      this.leaderboard.set([]);
      this.selectScenario(scenarioId);
    }
  }

  goHarder(): void {
    const d = this.selectedDifficulty();
    if (d === 'CADET') this.selectedDifficulty.set('OFFICER');
    else if (d === 'OFFICER') this.selectedDifficulty.set('COMMANDER');
    this.retryExercise();
  }

  backToSelection(): void {
    this.results.set(null);
    this.leaderboard.set([]);
    this.session.set(null);
    this.activeEvents.set([]);
    this.selectedEvent.set(null);
    this.currentScore.set(0);
    this.stressLevel.set(0);
    this.phase.set('selection');
  }

  // ─── Score Flash ────────────────────────────────────
  private flashScore(type: 'good' | 'bad', points: number): void {
    this.scoreFlash.set(type);
    this.lastPointsEarned.set(points);
    clearTimeout(this.scoreFlashTimeout);
    this.scoreFlashTimeout = setTimeout(() => {
      this.scoreFlash.set(null);
    }, 600);
  }

  // ─── Formatting Helpers ─────────────────────────────
  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    return m + ' min';
  }

  formatTimer(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m.toString().padStart(2, '0') + ':' + s.toString().padStart(2, '0');
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  getScenarioColor(category: string): string {
    const colors: Record<string, string> = {
      'RANSOMWARE': '#ef4444',
      'VENDOR_BREACH': '#f97316',
      'REGULATORY_INSPECTION': '#f59e0b',
      'CLOUD_FAILURE': '#3b82f6',
      'INSIDER_THREAT': '#a855f7',
      'COORDINATED_ATTACK': '#dc2626'
    };
    return colors[category] || '#6b7280';
  }

  getDifficultyBadgeClass(difficulty: string): string {
    const d = (difficulty || '').toUpperCase();
    if (d === 'EASY' || d === 'CADET') return 'bg-green-500/20 text-green-400';
    if (d === 'MEDIUM' || d === 'OFFICER') return 'bg-amber-500/20 text-amber-400';
    if (d === 'HARD' || d === 'COMMANDER') return 'bg-red-500/20 text-red-400';
    return 'bg-slate-700/50 text-slate-400';
  }

  getEventTypeIcon(type: string): string {
    switch (type) {
      case 'ALERT':
        return '<svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>';
      case 'PHONE_CALL':
        return '<svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>';
      case 'EMAIL':
        return '<svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>';
      case 'SYSTEM_ALERT':
        return '<svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>';
      default:
        return '<svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    }
  }

  getEventTypeIconLarge(type: string): string {
    switch (type) {
      case 'ALERT':
        return '<svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>';
      case 'PHONE_CALL':
        return '<svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>';
      case 'EMAIL':
        return '<svg class="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>';
      case 'SYSTEM_ALERT':
        return '<svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>';
      default:
        return '<svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    }
  }

  getEventTypeColor(type: string): string {
    switch (type) {
      case 'ALERT': return '#f87171';
      case 'PHONE_CALL': return '#60a5fa';
      case 'EMAIL': return '#fbbf24';
      case 'SYSTEM_ALERT': return '#c084fc';
      default: return '#94a3b8';
    }
  }

  getEventTypeLabel(type: string): string {
    switch (type) {
      case 'ALERT': return this.lang.l('Hoiatus', 'Alert');
      case 'PHONE_CALL': return this.lang.l('Telefonikone', 'Phone Call');
      case 'EMAIL': return this.lang.l('E-kiri', 'Email');
      case 'SYSTEM_ALERT': return this.lang.l('Susteemihoiatus', 'System Alert');
      default: return type;
    }
  }

  getUrgencyClass(urgency: number): string {
    if (urgency >= 8) return 'bg-red-500/20 text-red-400';
    if (urgency >= 5) return 'bg-amber-500/20 text-amber-400';
    return 'bg-green-500/20 text-green-400';
  }

  getEventTimePercent(event: any): number {
    if (!event.responseWindowSeconds) return 100;
    const startTime = this.eventStartTimes.get(event.id);
    if (!startTime) return 100;
    const elapsed = (Date.now() - startTime) / 1000;
    const pct = Math.max(0, ((event.responseWindowSeconds - elapsed) / event.responseWindowSeconds) * 100);
    return pct;
  }

  getEventRemainingSeconds(event: any): number {
    if (!event.responseWindowSeconds) return 0;
    const startTime = this.eventStartTimes.get(event.id);
    if (!startTime) return event.responseWindowSeconds;
    const elapsed = (Date.now() - startTime) / 1000;
    return Math.max(0, Math.round(event.responseWindowSeconds - elapsed));
  }

  getGradeColor(grade: string | undefined): string {
    switch (grade) {
      case 'A': return 'text-green-400';
      case 'B': return 'text-teal-400';
      case 'C': return 'text-amber-400';
      case 'D': return 'text-orange-400';
      case 'F': return 'text-red-400';
      default: return 'text-slate-400';
    }
  }

  getGradeMessage(grade: string | undefined): string {
    switch (grade) {
      case 'A': return this.lang.l('Suureparane! Sa oled kriisijuhtimise ekspert.', 'Outstanding! You are a crisis management expert.');
      case 'B': return this.lang.l('Tugev sooritus. Moned detailid vajavad lihvimist.', 'Strong performance. A few details need polishing.');
      case 'C': return this.lang.l('Rahuldav. On ruumi paranemiseks.', 'Satisfactory. There is room for improvement.');
      case 'D': return this.lang.l('Alla keskmise. Harjutamine teeb meistriks.', 'Below average. Practice makes perfect.');
      case 'F': return this.lang.l('Ebarahuldav. Proovi uuesti ja opi vigadest.', 'Unsatisfactory. Try again and learn from mistakes.');
      default: return '';
    }
  }

  getCategoryBarColor(score: number, maxScore: number): string {
    if (maxScore === 0) return 'bg-slate-600';
    const pct = (score / maxScore) * 100;
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 60) return 'bg-teal-500';
    if (pct >= 40) return 'bg-amber-500';
    if (pct >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  }
}
