import { Component, OnInit, signal, inject, computed, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';
import { ApiService } from '../api.service';
import { SubscriptionService } from '../services/subscription.service';

@Component({
  selector: 'app-time-machine',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">

      <!-- ======== PAGE HEADER ======== -->
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-white">
            {{ lang.l('Regulatiivne Ajamasin', 'Regulatory Time Machine') }}
          </h1>
          <p class="text-slate-400 text-sm mt-1">
            {{ lang.l(
              'Interaktiivne ajareisimine labi mineviku, oleviku ja AI-prognoositud tuleviku vastavusseisundite.',
              'Interactive time-travel through past, present, and AI-predicted future compliance states.'
            ) }}
          </p>
        </div>
      </div>

      <!-- ======== LOADING SKELETON ======== -->
      @if (loading()) {
        <div class="space-y-6 animate-pulse">
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 h-32"></div>
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 h-64"></div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 h-48"></div>
            <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 h-48"></div>
          </div>
        </div>
      }

      @if (!loading() && timeline()) {

        <!-- ======== TIMELINE SCRUBBER ======== -->
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {{ lang.l('Ajajoone navigeerimine', 'Timeline Navigation') }}
            </span>
            <span class="text-xs text-slate-500">
              {{ timelineStartLabel() }} — {{ timelineEndLabel() }}
            </span>
          </div>

          <!-- Scrubber track -->
          <div class="relative select-none"
               #scrubberContainer
               (mousedown)="onScrubberMouseDown($event)"
               (touchstart)="onScrubberTouchStart($event)">

            <!-- Background track -->
            <div class="h-2 rounded-full bg-slate-700/60 relative overflow-visible cursor-pointer">
              <!-- Past zone -->
              <div class="absolute inset-y-0 left-0 rounded-l-full bg-blue-500/30 transition-all duration-300"
                   [style.width.%]="nowPosition()"></div>
              <!-- Future zone -->
              <div class="absolute inset-y-0 right-0 rounded-r-full bg-purple-500/30 transition-all duration-300"
                   [style.width.%]="100 - nowPosition()"></div>
            </div>

            <!-- Event dots -->
            @if (timeline()?.events) {
              @for (ev of timeline().events; track ev.date) {
                <div class="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-slate-900 transition-all duration-200 z-10"
                     [class]="getEventDotClass(ev.type)"
                     [style.left.%]="dateToPosition(ev.date)"
                     [title]="ev.title || ev.type">
                </div>
              }
            }

            <!-- Cliff markers (red triangles) -->
            @if (timeline()?.cliffs) {
              @for (cliff of timeline().cliffs; track cliff.date) {
                <div class="absolute -top-3 z-10"
                     [style.left.%]="dateToPosition(cliff.date)">
                  <svg class="w-4 h-4 text-red-500 drop-shadow-lg" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 2l6 12H2z"/>
                  </svg>
                </div>
              }
            }

            <!-- NOW marker -->
            <div class="absolute top-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none"
                 [style.left.%]="nowPosition()">
              <div class="w-0.5 h-8 bg-amber-400/80 -mt-3"></div>
              <div class="flex items-center gap-1 mt-0.5">
                <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span class="text-[10px] font-bold text-amber-300 uppercase whitespace-nowrap">
                  {{ lang.l('PRAEGU', 'NOW') }}
                </span>
              </div>
            </div>

            <!-- Future zone label -->
            @if (nowPosition() < 85) {
              <div class="absolute -top-5 z-10 pointer-events-none"
                   [style.left.%]="nowPosition() + ((100 - nowPosition()) / 2)"
                   style="transform: translateX(-50%)">
                <span class="text-[9px] font-medium text-purple-400/70 uppercase tracking-wider">
                  {{ lang.l('Prognoos', 'Projected') }}
                </span>
              </div>
            }

            <!-- Draggable handle -->
            <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-30
                        w-5 h-5 rounded-full bg-white shadow-lg shadow-black/30
                        border-2 border-indigo-400
                        cursor-grab active:cursor-grabbing
                        transition-shadow hover:shadow-indigo-400/30 hover:shadow-xl"
                 [class.ring-2]="isDragging()"
                 [class.ring-indigo-400/50]="isDragging()"
                 [style.left.%]="scrubberPosition()">
            </div>
          </div>

          <!-- Selected date display -->
          <div class="flex items-center justify-between mt-4">
            <span class="text-xs text-slate-500">
              {{ lang.l('Valitud kuupaev', 'Selected date') }}:
              <span class="text-slate-300 font-medium">{{ selectedDate() }}</span>
            </span>
            <button (click)="jumpToNow()"
                    class="text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium">
              {{ lang.l('Mine olevikku', 'Jump to Now') }}
            </button>
          </div>
        </div>

        <!-- ======== MORPHING DASHBOARD ======== -->
        @if (stateAtDate()) {
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 transition-all duration-500"
               [class.sepia-zone]="currentZone() === 'PAST'"
               [class.present-zone]="currentZone() === 'PRESENT'"
               [class.future-zone]="currentZone() === 'FUTURE'">

            <!-- Zone indicator bar -->
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-2">
                @if (currentZone() === 'PAST') {
                  <div class="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span class="text-sm font-bold text-blue-300 uppercase tracking-wider">
                    {{ lang.l('MINEVIK', 'PAST') }}
                  </span>
                }
                @if (currentZone() === 'PRESENT') {
                  <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span class="text-sm font-bold text-emerald-300 uppercase tracking-wider">
                    {{ lang.l('OLEVIK', 'PRESENT') }}
                  </span>
                  <span class="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Live
                  </span>
                }
                @if (currentZone() === 'FUTURE') {
                  <div class="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                  <span class="text-sm font-bold text-purple-300 uppercase tracking-wider">
                    {{ lang.l('TULEVIK', 'FUTURE') }}
                  </span>
                }
              </div>

              @if (currentZone() === 'FUTURE' && stateAtDate().confidence != null) {
                <div class="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-1">
                  <svg class="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  <span class="text-xs text-purple-300 font-medium">
                    {{ lang.l('Usaldus', 'Confidence') }}: {{ stateAtDate().confidence }}%
                  </span>
                </div>
              }
            </div>

            <!-- Main score + pillar gauges row -->
            <div class="flex flex-col lg:flex-row items-center gap-8">

              <!-- Large circular gauge -->
              <div class="relative shrink-0">
                <svg width="140" height="140" viewBox="0 0 140 140" class="transform -rotate-90">
                  <circle cx="70" cy="70" r="58" fill="none" stroke="currentColor"
                          class="text-slate-700/50" stroke-width="10"/>
                  <circle cx="70" cy="70" r="58" fill="none"
                          [attr.stroke]="scoreColor(stateAtDate().overallScore)"
                          stroke-width="10"
                          stroke-linecap="round"
                          [attr.stroke-dasharray]="scoreArc(stateAtDate().overallScore, 58)"
                          class="transition-all duration-700 ease-out"/>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="text-3xl font-black transition-all duration-500"
                        [class]="stateAtDate().overallScore >= 80 ? 'text-emerald-400' :
                                 stateAtDate().overallScore >= 50 ? 'text-amber-400' : 'text-red-400'">
                    {{ stateAtDate().overallScore }}
                  </span>
                  <span class="text-[10px] text-slate-500 uppercase">/ 100</span>
                </div>
              </div>

              <!-- 5 Pillar mini-gauges -->
              <div class="flex flex-wrap justify-center gap-4 flex-1">
                @for (pillar of stateAtDate().pillarScores || []; track pillar.pillarId) {
                  <div class="flex flex-col items-center gap-1.5">
                    <div class="relative">
                      <svg width="68" height="68" viewBox="0 0 68 68" class="transform -rotate-90">
                        <circle cx="34" cy="34" r="28" fill="none" stroke="currentColor"
                                class="text-slate-700/40" stroke-width="5"/>
                        <circle cx="34" cy="34" r="28" fill="none"
                                [attr.stroke]="scoreColor(pillar.score)"
                                stroke-width="5"
                                stroke-linecap="round"
                                [attr.stroke-dasharray]="scoreArc(pillar.score, 28)"
                                class="transition-all duration-700 ease-out"/>
                      </svg>
                      <div class="absolute inset-0 flex items-center justify-center">
                        <span class="text-sm font-bold transition-all duration-500"
                              [class]="pillar.score >= 80 ? 'text-emerald-400' :
                                       pillar.score >= 50 ? 'text-amber-400' : 'text-red-400'">
                          {{ pillar.score }}
                        </span>
                      </div>
                    </div>
                    <span class="text-[10px] text-slate-500 text-center max-w-[72px] leading-tight">
                      {{ pillar.name || ('P' + pillar.pillarId) }}
                    </span>
                  </div>
                }
              </div>
            </div>

            <!-- Stats row -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              <div class="bg-slate-900/40 rounded-xl p-3 text-center transition-all duration-500">
                <div class="text-lg font-bold text-sky-400">{{ stateAtDate().evidenceCount ?? 0 }}</div>
                <div class="text-[10px] text-slate-500 uppercase">
                  {{ lang.l('Toendeid', 'Evidence') }}
                </div>
              </div>
              <div class="bg-slate-900/40 rounded-xl p-3 text-center transition-all duration-500">
                <div class="text-lg font-bold text-emerald-400">{{ stateAtDate().validEvidence ?? 0 }}</div>
                <div class="text-[10px] text-slate-500 uppercase">
                  {{ lang.l('Kehtivad', 'Valid') }}
                </div>
              </div>
              <div class="bg-slate-900/40 rounded-xl p-3 text-center transition-all duration-500">
                <div class="text-lg font-bold text-amber-400">
                  {{ stateAtDate().remediationsCompleted ?? 0 }}/{{ stateAtDate().remediationsTotal ?? 0 }}
                </div>
                <div class="text-[10px] text-slate-500 uppercase">
                  {{ lang.l('Parandused', 'Remediations') }}
                </div>
              </div>
              <div class="bg-slate-900/40 rounded-xl p-3 text-center transition-all duration-500">
                <div class="text-lg font-bold text-red-400">{{ stateAtDate().incidentCount ?? 0 }}</div>
                <div class="text-[10px] text-slate-500 uppercase">
                  {{ lang.l('Intsidendid', 'Incidents') }}
                </div>
              </div>
            </div>
          </div>
        }

        <!-- ======== SCORE TRAJECTORY CHART ======== -->
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-white">
              {{ lang.l('Skoori trajektoor', 'Score Trajectory') }}
            </h2>
            <div class="flex items-center gap-4 text-[10px]">
              <span class="flex items-center gap-1">
                <span class="w-4 h-0.5 bg-sky-400 rounded-full inline-block"></span>
                <span class="text-slate-500">{{ lang.l('Ajalooline', 'Historical') }}</span>
              </span>
              <span class="flex items-center gap-1">
                <span class="w-4 h-0.5 bg-purple-400 rounded-full inline-block" style="border-bottom: 1px dashed"></span>
                <span class="text-slate-500">{{ lang.l('Prognoos', 'Projected') }}</span>
              </span>
              @for (s of scenarios(); track s.scenarioId) {
                <span class="flex items-center gap-1">
                  <span class="w-4 h-0.5 rounded-full inline-block" [style.background]="s.color"></span>
                  <span class="text-slate-500">{{ lang.l(s.nameEt || s.name, s.name) }}</span>
                </span>
              }
            </div>
          </div>

          <!-- SVG Chart -->
          <div class="relative" #chartContainer>
            <svg [attr.viewBox]="'0 0 ' + chartWidth + ' ' + chartHeight"
                 class="w-full" style="height: 200px"
                 (mousemove)="onChartHover($event)"
                 (mouseleave)="chartTooltip.set(null)">

              <!-- Y-axis grid lines -->
              @for (y of [0, 25, 50, 75, 100]; track y) {
                <line [attr.x1]="chartPadding.left"
                      [attr.x2]="chartWidth - chartPadding.right"
                      [attr.y1]="scoreToY(y)"
                      [attr.y2]="scoreToY(y)"
                      stroke="currentColor" class="text-slate-700/30" stroke-width="0.5"/>
                <text [attr.x]="chartPadding.left - 6"
                      [attr.y]="scoreToY(y) + 3"
                      text-anchor="end"
                      class="text-slate-600 text-[9px]" fill="currentColor">{{ y }}</text>
              }

              <!-- Projection confidence band -->
              @if (projectionBandPath()) {
                <path [attr.d]="projectionBandPath()" fill="rgba(168,85,247,0.08)"/>
              }

              <!-- Historical trajectory line -->
              @if (trajectoryPath()) {
                <path [attr.d]="trajectoryPath()"
                      fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              }

              <!-- Projection line (dashed) -->
              @if (projectionPath()) {
                <path [attr.d]="projectionPath()"
                      fill="none" stroke="#a855f7" stroke-width="2"
                      stroke-dasharray="6,4" stroke-linecap="round" stroke-linejoin="round"/>
              }

              <!-- What-if scenario lines -->
              @for (s of scenarios(); track s.scenarioId) {
                <path [attr.d]="buildPathFromPoints(s.trajectory, timelineStart(), timelineEnd(), chartInnerWidth(), chartInnerHeight())"
                      fill="none" [attr.stroke]="s.color" stroke-width="2"
                      stroke-dasharray="4,3" stroke-linecap="round" stroke-linejoin="round"
                      class="transition-all duration-300"/>
              }

              <!-- Cliff markers on chart -->
              @if (timeline()?.cliffs) {
                @for (cliff of timeline().cliffs; track cliff.date) {
                  <g [attr.transform]="'translate(' + dateToChartX(cliff.date) + ',' + (scoreToY(cliff.score || 50) - 10) + ')'">
                    <polygon points="0,-6 5,4 -5,4" fill="#ef4444" opacity="0.9"/>
                  </g>
                }
              }

              <!-- NOW vertical line on chart -->
              <line [attr.x1]="dateToChartX(timeline().now)"
                    [attr.x2]="dateToChartX(timeline().now)"
                    [attr.y1]="chartPadding.top"
                    [attr.y2]="chartHeight - chartPadding.bottom"
                    stroke="#fbbf24" stroke-width="1" stroke-dasharray="3,3" opacity="0.5"/>

              <!-- Selected date indicator line -->
              @if (selectedDate()) {
                <line [attr.x1]="dateToChartX(selectedDate())"
                      [attr.x2]="dateToChartX(selectedDate())"
                      [attr.y1]="chartPadding.top"
                      [attr.y2]="chartHeight - chartPadding.bottom"
                      stroke="#818cf8" stroke-width="1" opacity="0.6"/>
              }

              <!-- Trajectory dots for historical -->
              @if (timeline()?.trajectory) {
                @for (pt of timeline().trajectory; track pt.date) {
                  <circle [attr.cx]="dateToChartX(pt.date)"
                          [attr.cy]="scoreToY(pt.score)"
                          r="3" fill="#38bdf8" stroke="#0f172a" stroke-width="1.5"
                          class="transition-all duration-300"/>
                }
              }

              <!-- Hover tooltip -->
              @if (chartTooltip()) {
                <g [attr.transform]="'translate(' + chartTooltip()!.x + ',' + (chartTooltip()!.y - 30) + ')'">
                  <rect x="-40" y="-16" width="80" height="28" rx="6" fill="#1e293b" stroke="#475569" stroke-width="0.5"/>
                  <text x="0" y="-2" text-anchor="middle" class="text-[9px]" fill="#94a3b8">{{ chartTooltip()!.date }}</text>
                  <text x="0" y="8" text-anchor="middle" class="text-[10px] font-bold" fill="#e2e8f0">{{ chartTooltip()!.score }}</text>
                </g>
                <circle [attr.cx]="chartTooltip()!.x" [attr.cy]="chartTooltip()!.y"
                        r="5" fill="#818cf8" stroke="white" stroke-width="2"/>
              }
            </svg>
          </div>
        </div>

        <!-- ======== WHAT-IF PANEL + EVENT FEED (2 columns on lg) ======== -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- What-If Panel (1 col) -->
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <div class="flex items-center gap-2 mb-4">
              <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <h2 class="text-sm font-semibold text-white">
                {{ lang.l('Mis siis, kui...?', 'What If...?') }}
              </h2>
            </div>

            @if (sub.isPremium()) {
              <div class="space-y-2">
                <!-- Scenario 1: Started 6 months ago -->
                <button (click)="loadScenario('started_6m_ago')"
                        class="w-full text-left px-3 py-2.5 rounded-xl border transition-all duration-200 text-sm"
                        [class]="isScenarioActive('started_6m_ago')
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-900/40 border-slate-700/30 text-slate-300 hover:border-emerald-500/30'">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full bg-emerald-400"></div>
                      <span>{{ lang.l('Alustasime 6 kuud tagasi', 'Started 6 Months Ago') }}</span>
                    </div>
                    @if (getScenarioEndScore('started_6m_ago') !== null) {
                      <span class="text-xs font-bold text-emerald-400">
                        {{ getScenarioEndScore('started_6m_ago') }}
                      </span>
                    }
                  </div>
                </button>

                <!-- Scenario 2: Do nothing 3 months -->
                <button (click)="loadScenario('do_nothing_3m')"
                        class="w-full text-left px-3 py-2.5 rounded-xl border transition-all duration-200 text-sm"
                        [class]="isScenarioActive('do_nothing_3m')
                          ? 'bg-red-500/15 border-red-500/40 text-red-300'
                          : 'bg-slate-900/40 border-slate-700/30 text-slate-300 hover:border-red-500/30'">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full bg-red-400"></div>
                      <span>{{ lang.l('Ei tee midagi 3 kuud', 'Do Nothing 3 Months') }}</span>
                    </div>
                    @if (getScenarioEndScore('do_nothing_3m') !== null) {
                      <span class="text-xs font-bold text-red-400">
                        {{ getScenarioEndScore('do_nothing_3m') }}
                      </span>
                    }
                  </div>
                </button>

                <!-- Scenario 3: Double pace -->
                <button (click)="loadScenario('double_pace')"
                        class="w-full text-left px-3 py-2.5 rounded-xl border transition-all duration-200 text-sm"
                        [class]="isScenarioActive('double_pace')
                          ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                          : 'bg-slate-900/40 border-slate-700/30 text-slate-300 hover:border-purple-500/30'">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full bg-purple-400"></div>
                      <span>{{ lang.l('Kahekordistame tempot', 'Double Our Pace') }}</span>
                    </div>
                    @if (getScenarioEndScore('double_pace') !== null) {
                      <span class="text-xs font-bold text-purple-400">
                        {{ getScenarioEndScore('double_pace') }}
                      </span>
                    }
                  </div>
                </button>

                <!-- Scenario 4: Regulatory change -->
                <button (click)="loadScenario('regulatory_change')"
                        class="w-full text-left px-3 py-2.5 rounded-xl border transition-all duration-200 text-sm"
                        [class]="isScenarioActive('regulatory_change')
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                          : 'bg-slate-900/40 border-slate-700/30 text-slate-300 hover:border-amber-500/30'">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full bg-amber-400"></div>
                      <span>{{ lang.l('Regulatiivne muudatus', 'Regulatory Change Hits') }}</span>
                    </div>
                    @if (getScenarioEndScore('regulatory_change') !== null) {
                      <span class="text-xs font-bold text-amber-400">
                        {{ getScenarioEndScore('regulatory_change') }}
                      </span>
                    }
                  </div>
                </button>
              </div>

              @if (scenarios().length > 0) {
                <button (click)="clearScenarios()"
                        class="mt-3 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  {{ lang.l('Tuhista stsenaariumid', 'Clear all scenarios') }}
                </button>
              }
            } @else {
              <!-- Premium gate -->
              <div class="text-center py-4">
                <div class="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <p class="text-sm text-slate-400 mb-3">
                  {{ lang.l('Premium funktsioon - uuendage ligipaasuks', 'Premium feature - upgrade to access') }}
                </p>
                <a routerLink="/pricing"
                   class="inline-flex items-center gap-1 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors">
                  {{ lang.l('Vaata plaane', 'View Plans') }}
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </a>
              </div>
            }
          </div>

          <!-- Event Feed (2 cols) -->
          <div class="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm font-semibold text-white flex items-center gap-2">
                <svg class="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
                {{ lang.l('Sundmuste voog', 'Event Feed') }}
              </h2>
              <span class="text-[10px] text-slate-500">
                {{ filteredEvents().length }} {{ lang.l('sundmust', 'events') }}
              </span>
            </div>

            @if (filteredEvents().length === 0) {
              <div class="text-center py-8">
                <p class="text-sm text-slate-500">
                  {{ lang.l('Selle kuupaeva umber sundmusi ei leitud.', 'No events found around this date.') }}
                </p>
              </div>
            }

            <div class="space-y-0 max-h-[400px] overflow-y-auto custom-scrollbar">
              @for (ev of filteredEvents(); track ev.date + ev.type) {
                <div class="flex gap-3 py-3 border-b border-slate-700/30 last:border-0 transition-all duration-300">
                  <!-- Vertical timeline line + dot -->
                  <div class="flex flex-col items-center shrink-0">
                    <div class="w-3 h-3 rounded-full border-2"
                         [class]="getEventFeedDotClass(ev.type)"></div>
                    <div class="w-0.5 flex-1 bg-slate-700/40 mt-1"></div>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-0.5">
                      <span class="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            [class]="getEventBadgeClass(ev.type)">
                        {{ getEventTypeLabel(ev.type) }}
                      </span>
                      <span class="text-[10px] text-slate-500">{{ ev.date }}</span>
                    </div>
                    <p class="text-sm text-slate-200 truncate">
                      {{ lang.l(ev.titleEt || ev.title, ev.title) }}
                    </p>
                    @if (ev.description) {
                      <p class="text-xs text-slate-500 mt-0.5 truncate">{{ ev.description }}</p>
                    }
                  </div>

                  @if (ev.score != null) {
                    <div class="shrink-0 text-right">
                      <span class="text-sm font-bold"
                            [class]="ev.score >= 80 ? 'text-emerald-400' : ev.score >= 50 ? 'text-amber-400' : 'text-red-400'">
                        {{ ev.score }}
                      </span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>

      } <!-- end: timeline loaded -->

    </div>
  `,
  styles: [`
    :host { display: block; }

    .sepia-zone {
      filter: sepia(0.15) brightness(0.95);
      border-color: rgba(147, 130, 100, 0.3);
    }

    .present-zone {
      box-shadow: 0 0 30px rgba(16, 185, 129, 0.06);
      border-color: rgba(16, 185, 129, 0.2);
    }

    .future-zone {
      box-shadow: 0 0 30px rgba(168, 85, 247, 0.08);
      border-color: rgba(168, 85, 247, 0.2);
    }

    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.3); border-radius: 999px; }

    @keyframes gentle-pulse {
      0%, 100% { opacity: 0.7; }
      50% { opacity: 1; }
    }
  `]
})
export class TimeMachineComponent implements OnInit, OnDestroy {
  lang = inject(LangService);
  api = inject(ApiService);
  sub = inject(SubscriptionService);

  @ViewChild('scrubberContainer') scrubberRef!: ElementRef<HTMLDivElement>;
  @ViewChild('chartContainer') chartRef!: ElementRef<HTMLDivElement>;

  // --- Signals ---
  timeline = signal<any>(null);
  selectedDate = signal<string>('');
  stateAtDate = signal<any>(null);
  scenarios = signal<any[]>([]);
  loading = signal(true);
  scrubberPosition = signal(50);
  isDragging = signal(false);
  chartTooltip = signal<{ x: number; y: number; date: string; score: number } | null>(null);

  // --- Chart constants ---
  chartWidth = 900;
  chartHeight = 200;
  chartPadding = { top: 16, right: 20, bottom: 24, left: 36 };

  // --- Bound handlers for cleanup ---
  private boundMouseMove = (e: MouseEvent) => this.onScrubberDrag(e);
  private boundMouseUp = () => this.onScrubberMouseUp();
  private boundTouchMove = (e: TouchEvent) => this.onScrubberTouchMove(e);
  private boundTouchEnd = () => this.onScrubberMouseUp();
  private stateDebounce: any = null;

  // --- Computed ---
  timelineStart = computed(() => {
    const tl = this.timeline();
    if (!tl?.events?.length && !tl?.trajectory?.length) return '';
    const allDates: string[] = [];
    if (tl.trajectory) allDates.push(...tl.trajectory.map((p: any) => p.date));
    if (tl.projections) allDates.push(...tl.projections.map((p: any) => p.date));
    if (tl.events) allDates.push(...tl.events.map((e: any) => e.date));
    allDates.sort();
    return allDates[0] || '';
  });

  timelineEnd = computed(() => {
    const tl = this.timeline();
    if (!tl?.events?.length && !tl?.trajectory?.length) return '';
    const allDates: string[] = [];
    if (tl.trajectory) allDates.push(...tl.trajectory.map((p: any) => p.date));
    if (tl.projections) allDates.push(...tl.projections.map((p: any) => p.date));
    if (tl.events) allDates.push(...tl.events.map((e: any) => e.date));
    allDates.sort();
    return allDates[allDates.length - 1] || '';
  });

  timelineStartLabel = computed(() => {
    const d = this.timelineStart();
    return d ? this.formatDateShort(d) : '';
  });

  timelineEndLabel = computed(() => {
    const d = this.timelineEnd();
    return d ? this.formatDateShort(d) : '';
  });

  nowPosition = computed(() => {
    const tl = this.timeline();
    if (!tl?.now) return 50;
    return this.dateToPosition(tl.now);
  });

  currentZone = computed(() => {
    const s = this.stateAtDate();
    return s?.zone || 'PRESENT';
  });

  chartInnerWidth = computed(() => this.chartWidth - this.chartPadding.left - this.chartPadding.right);
  chartInnerHeight = computed(() => this.chartHeight - this.chartPadding.top - this.chartPadding.bottom);

  trajectoryPath = computed(() => {
    const tl = this.timeline();
    if (!tl?.trajectory?.length) return '';
    return this.buildPathFromPoints(tl.trajectory, this.timelineStart(), this.timelineEnd(),
      this.chartInnerWidth(), this.chartInnerHeight());
  });

  projectionPath = computed(() => {
    const tl = this.timeline();
    if (!tl?.projections?.length) return '';
    return this.buildPathFromPoints(tl.projections, this.timelineStart(), this.timelineEnd(),
      this.chartInnerWidth(), this.chartInnerHeight());
  });

  projectionBandPath = computed(() => {
    const tl = this.timeline();
    if (!tl?.projections?.length) return '';
    const pts = tl.projections as { date: string; score: number }[];
    const start = this.timelineStart();
    const end = this.timelineEnd();
    const w = this.chartInnerWidth();
    const h = this.chartInnerHeight();
    if (!start || !end) return '';

    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    const range = endMs - startMs || 1;

    const bandOffset = 8; // points above/below for confidence band
    const upper: string[] = [];
    const lower: string[] = [];

    for (const pt of pts) {
      const x = this.chartPadding.left + ((new Date(pt.date).getTime() - startMs) / range) * w;
      const yMid = this.chartPadding.top + ((100 - pt.score) / 100) * h;
      const yUp = Math.max(this.chartPadding.top, yMid - bandOffset);
      const yDown = Math.min(this.chartPadding.top + h, yMid + bandOffset);
      upper.push(`${x},${yUp}`);
      lower.unshift(`${x},${yDown}`);
    }

    return `M${upper.join(' L')} L${lower.join(' L')} Z`;
  });

  filteredEvents = computed(() => {
    const tl = this.timeline();
    const selected = this.selectedDate();
    if (!tl?.events?.length || !selected) return tl?.events || [];

    const selMs = new Date(selected).getTime();
    const windowMs = 30 * 24 * 60 * 60 * 1000; // 30 days window

    const nearby = (tl.events as any[])
      .filter((e: any) => Math.abs(new Date(e.date).getTime() - selMs) <= windowMs)
      .sort((a: any, b: any) => Math.abs(new Date(a.date).getTime() - selMs) - Math.abs(new Date(b.date).getTime() - selMs));

    return nearby.length > 0 ? nearby.slice(0, 20) : (tl.events as any[]).slice(0, 10);
  });

  // --- Lifecycle ---
  ngOnInit(): void {
    this.loadTimeline();

    // Add global listeners for drag
    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);
    document.addEventListener('touchmove', this.boundTouchMove, { passive: false });
    document.addEventListener('touchend', this.boundTouchEnd);
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
    document.removeEventListener('touchmove', this.boundTouchMove);
    document.removeEventListener('touchend', this.boundTouchEnd);
    if (this.stateDebounce) clearTimeout(this.stateDebounce);
  }

  // --- Data loading ---
  loadTimeline(): void {
    this.loading.set(true);
    (this.api as any).getTimeline().subscribe({
      next: (data: any) => {
        this.timeline.set(data);
        // Set scrubber to NOW position
        if (data?.now) {
          const nowPos = this.dateToPosition(data.now);
          this.scrubberPosition.set(nowPos);
          this.selectedDate.set(data.now);
          this.loadStateAtDate(data.now);
        } else {
          this.scrubberPosition.set(50);
          const today = new Date().toISOString().split('T')[0];
          this.selectedDate.set(today);
          this.loadStateAtDate(today);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadStateAtDate(date: string): void {
    (this.api as any).getStateAtDate(date).subscribe({
      next: (data: any) => {
        this.stateAtDate.set(data);
      },
      error: () => {}
    });
  }

  // --- Scrubber interaction ---
  onScrubberMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
    this.updateScrubberFromMouse(event.clientX);
  }

  onScrubberTouchStart(event: TouchEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
    if (event.touches.length > 0) {
      this.updateScrubberFromMouse(event.touches[0].clientX);
    }
  }

  onScrubberDrag(event: MouseEvent): void {
    if (!this.isDragging()) return;
    event.preventDefault();
    this.updateScrubberFromMouse(event.clientX);
  }

  onScrubberTouchMove(event: TouchEvent): void {
    if (!this.isDragging()) return;
    event.preventDefault();
    if (event.touches.length > 0) {
      this.updateScrubberFromMouse(event.touches[0].clientX);
    }
  }

  onScrubberMouseUp(): void {
    this.isDragging.set(false);
  }

  private updateScrubberFromMouse(clientX: number): void {
    if (!this.scrubberRef) return;
    const el = this.scrubberRef.nativeElement;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    this.scrubberPosition.set(pct);

    // Map percentage to date
    const date = this.positionToDate(pct);
    if (date) {
      this.selectedDate.set(date);
      // Debounce API call
      if (this.stateDebounce) clearTimeout(this.stateDebounce);
      this.stateDebounce = setTimeout(() => {
        this.loadStateAtDate(date);
      }, 150);
    }
  }

  jumpToNow(): void {
    const tl = this.timeline();
    if (!tl?.now) return;
    const pos = this.dateToPosition(tl.now);
    this.scrubberPosition.set(pos);
    this.selectedDate.set(tl.now);
    this.loadStateAtDate(tl.now);
  }

  // --- Scenario management ---
  loadScenario(scenarioId: string): void {
    // Toggle off if already active
    const current = this.scenarios();
    const exists = current.findIndex(s => s.scenarioId === scenarioId);
    if (exists >= 0) {
      this.scenarios.set(current.filter(s => s.scenarioId !== scenarioId));
      return;
    }

    (this.api as any).whatIfScenario(scenarioId).subscribe({
      next: (data: any) => {
        const curr = this.scenarios();
        const idx = curr.findIndex(s => s.scenarioId === scenarioId);
        if (idx >= 0) {
          this.scenarios.set(curr.filter(s => s.scenarioId !== scenarioId));
        } else {
          this.scenarios.set([...curr, data]);
        }
      }
    });
  }

  isScenarioActive(scenarioId: string): boolean {
    return this.scenarios().some(s => s.scenarioId === scenarioId);
  }

  getScenarioEndScore(scenarioId: string): number | null {
    const s = this.scenarios().find(sc => sc.scenarioId === scenarioId);
    return s?.endScore ?? null;
  }

  clearScenarios(): void {
    this.scenarios.set([]);
  }

  // --- Date/position helpers ---
  dateToPosition(date: string): number {
    const start = this.timelineStart();
    const end = this.timelineEnd();
    if (!start || !end || !date) return 50;

    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    const dateMs = new Date(date).getTime();
    const range = endMs - startMs;
    if (range <= 0) return 50;

    return Math.max(0, Math.min(100, ((dateMs - startMs) / range) * 100));
  }

  positionToDate(pct: number): string {
    const start = this.timelineStart();
    const end = this.timelineEnd();
    if (!start || !end) return '';

    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    const range = endMs - startMs;
    const dateMs = startMs + (pct / 100) * range;

    const d = new Date(dateMs);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  formatDateShort(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  // --- Chart helpers ---
  dateToChartX(date: string): number {
    const start = this.timelineStart();
    const end = this.timelineEnd();
    if (!start || !end || !date) return this.chartPadding.left;

    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    const dateMs = new Date(date).getTime();
    const range = endMs - startMs || 1;

    return this.chartPadding.left + ((dateMs - startMs) / range) * this.chartInnerWidth();
  }

  scoreToY(score: number): number {
    return this.chartPadding.top + ((100 - score) / 100) * this.chartInnerHeight();
  }

  buildPathFromPoints(
    points: { date: string; score: number }[],
    minDate: string,
    maxDate: string,
    width: number,
    height: number
  ): string {
    if (!points?.length || !minDate || !maxDate) return '';

    const startMs = new Date(minDate).getTime();
    const endMs = new Date(maxDate).getTime();
    const range = endMs - startMs || 1;

    const coords = points.map(pt => {
      const x = this.chartPadding.left + ((new Date(pt.date).getTime() - startMs) / range) * width;
      const y = this.chartPadding.top + ((100 - pt.score) / 100) * height;
      return { x, y };
    });

    if (coords.length === 0) return '';
    let d = `M${coords[0].x},${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      d += ` L${coords[i].x},${coords[i].y}`;
    }
    return d;
  }

  scoreArc(score: number, radius: number): string {
    const circumference = 2 * Math.PI * radius;
    const filled = (score / 100) * circumference;
    return `${filled} ${circumference}`;
  }

  scoreColor(score: number): string {
    if (score >= 80) return '#34d399';
    if (score >= 50) return '#fbbf24';
    return '#f87171';
  }

  onChartHover(event: MouseEvent): void {
    if (!this.chartRef) return;
    const el = this.chartRef.nativeElement;
    const svg = el.querySelector('svg');
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const scaleX = this.chartWidth / rect.width;
    const mouseX = (event.clientX - rect.left) * scaleX;

    // Find nearest trajectory point
    const tl = this.timeline();
    if (!tl) return;

    const allPoints: { date: string; score: number }[] = [
      ...(tl.trajectory || []),
      ...(tl.projections || [])
    ];
    if (allPoints.length === 0) return;

    let closest: { date: string; score: number } | null = null;
    let closestDist = Infinity;

    for (const pt of allPoints) {
      const px = this.dateToChartX(pt.date);
      const dist = Math.abs(px - mouseX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = pt;
      }
    }

    if (closest && closestDist < 30) {
      this.chartTooltip.set({
        x: this.dateToChartX(closest.date),
        y: this.scoreToY(closest.score),
        date: closest.date,
        score: closest.score
      });
    } else {
      this.chartTooltip.set(null);
    }
  }

  // --- Event styling helpers ---
  getEventDotClass(type: string): string {
    switch (type?.toLowerCase()) {
      case 'assessment': return 'bg-sky-400';
      case 'evidence': return 'bg-emerald-400';
      case 'incident': return 'bg-red-400';
      case 'remediation': return 'bg-amber-400';
      case 'regulatory': return 'bg-purple-400';
      case 'audit': return 'bg-indigo-400';
      default: return 'bg-slate-400';
    }
  }

  getEventFeedDotClass(type: string): string {
    switch (type?.toLowerCase()) {
      case 'assessment': return 'border-sky-400 bg-sky-400/20';
      case 'evidence': return 'border-emerald-400 bg-emerald-400/20';
      case 'incident': return 'border-red-400 bg-red-400/20';
      case 'remediation': return 'border-amber-400 bg-amber-400/20';
      case 'regulatory': return 'border-purple-400 bg-purple-400/20';
      case 'audit': return 'border-indigo-400 bg-indigo-400/20';
      default: return 'border-slate-400 bg-slate-400/20';
    }
  }

  getEventBadgeClass(type: string): string {
    switch (type?.toLowerCase()) {
      case 'assessment': return 'bg-sky-500/15 text-sky-400';
      case 'evidence': return 'bg-emerald-500/15 text-emerald-400';
      case 'incident': return 'bg-red-500/15 text-red-400';
      case 'remediation': return 'bg-amber-500/15 text-amber-400';
      case 'regulatory': return 'bg-purple-500/15 text-purple-400';
      case 'audit': return 'bg-indigo-500/15 text-indigo-400';
      default: return 'bg-slate-500/15 text-slate-400';
    }
  }

  getEventTypeLabel(type: string): string {
    switch (type?.toLowerCase()) {
      case 'assessment': return this.lang.l('Hindamine', 'Assessment');
      case 'evidence': return this.lang.l('Toend', 'Evidence');
      case 'incident': return this.lang.l('Intsident', 'Incident');
      case 'remediation': return this.lang.l('Parandus', 'Remediation');
      case 'regulatory': return this.lang.l('Regulatsioon', 'Regulatory');
      case 'audit': return this.lang.l('Audit', 'Audit');
      default: return type || '';
    }
  }
}
