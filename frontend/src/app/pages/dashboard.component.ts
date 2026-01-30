import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface HistoryEntry {
  id: string;
  companyName: string;
  contractName: string;
  scorePercentage: number;
  complianceLevel: 'GREEN' | 'YELLOW' | 'RED';
  assessmentDate: string;
  compliantCount: number;
  totalQuestions: number;
}

interface LeaderboardEntry extends HistoryEntry {
  rank: number;
}

interface PillarData {
  icon: string;
  label: string;
  percentage: number;
  color: string;
  dashOffset: number;
}

interface ChartPoint {
  x: number;
  y: number;
  color: string;
  score: number;
  dateLabel: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-6xl mx-auto">

      <!-- Header -->
      <div class="flex items-center justify-between mb-10 animate-fade-in-up">
        <div>
          <h1 class="text-3xl md:text-4xl font-extrabold">
            <span class="gradient-text">Juhtpaneel</span>
          </h1>
          <p class="text-slate-500 text-sm mt-1">{{ history.length }} hindamist kokku &middot; Viimati uuendatud: {{ lastUpdated }}</p>
        </div>
        <div class="flex gap-3">
          <a routerLink="/history"
             class="bg-slate-800/50 backdrop-blur border border-slate-700/50 text-slate-300 font-semibold
                    px-5 py-2.5 rounded-lg transition-all duration-300 hover:border-emerald-500/30
                    hover:bg-slate-800/80 flex items-center gap-2 text-sm">
            <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Ajalugu
          </a>
          <a routerLink="/assessment"
             class="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400
                    text-slate-900 font-semibold px-5 py-2.5 rounded-lg transition-all duration-300
                    hover:shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2 text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Uus hindamine
          </a>
        </div>
      </div>

      <!-- Empty state -->
      <div *ngIf="history.length === 0" class="text-center py-20 animate-scale-in">
        <div class="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-6 border border-slate-700/50">
          <svg class="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-slate-300 mb-2">Andmed puuduvad</h2>
        <p class="text-slate-500 mb-8 max-w-md mx-auto">Juhtpaneel t&auml;itub automaatselt p&auml;rast hindamiste l&auml;biviimist. Alustage esimese hindamisega.</p>
        <a routerLink="/assessment"
           class="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900
                  font-semibold px-8 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25 text-lg">
          Alusta hindamist
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </a>
      </div>

      <!-- Dashboard content (only when data exists) -->
      <ng-container *ngIf="history.length > 0">

        <!-- KPI Cards Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          <!-- Kokku hindamisi -->
          <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-5 animate-fade-in-up delay-100 card-hover">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-xs text-slate-500 uppercase tracking-wider mb-2">Kokku hindamisi</p>
                <span class="text-4xl font-extrabold text-slate-100">{{ history.length }}</span>
                <p class="text-xs text-slate-500 mt-1">+{{ recentCount }} viimase 30 p&auml;eva jooksul</p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
            </div>
            <div class="mt-3">
              <svg class="w-full h-8" viewBox="0 0 120 32" preserveAspectRatio="none">
                <path [attr.d]="sparklineTotalPath" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
                <path [attr.d]="sparklineTotalArea" fill="#34d399" opacity="0.08"/>
              </svg>
            </div>
          </div>

          <!-- Keskmine skoor -->
          <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-5 animate-fade-in-up delay-200 card-hover">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-xs text-slate-500 uppercase tracking-wider mb-2">Keskmine skoor</p>
                <span class="text-4xl font-extrabold" [style.color]="avgScoreColor">{{ avgScore | number:'1.0-0' }}%</span>
                <p class="text-xs mt-1" [class]="scoreTrend >= 0 ? 'text-emerald-400' : 'text-red-400'">
                  {{ scoreTrend >= 0 ? '+' : '' }}{{ scoreTrend | number:'1.1-1' }}% trend
                </p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              </div>
            </div>
            <div class="mt-3">
              <svg class="w-full h-8" viewBox="0 0 120 32" preserveAspectRatio="none">
                <path [attr.d]="sparklineScorePath" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
                <path [attr.d]="sparklineScoreArea" fill="#22d3ee" opacity="0.08"/>
              </svg>
            </div>
          </div>

          <!-- Vastavad ettevotted -->
          <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-5 animate-fade-in-up delay-300 card-hover">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-xs text-slate-500 uppercase tracking-wider mb-2">Vastavad ettev&otilde;tted</p>
                <span class="text-4xl font-extrabold text-emerald-400">{{ greenCount }}</span>
                <p class="text-xs text-slate-500 mt-1">{{ history.length }} hindamisest</p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
            </div>
            <div class="mt-3">
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
                  <div class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000"
                       [style.width.%]="history.length > 0 ? (greenCount / history.length) * 100 : 0"></div>
                </div>
                <span class="text-xs text-slate-400 font-medium">{{ history.length > 0 ? ((greenCount / history.length) * 100 | number:'1.0-0') : 0 }}%</span>
              </div>
              <div class="flex gap-1 mt-2">
                <div class="flex-1 bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                  <div class="h-full rounded-full bg-emerald-500" [style.width.%]="history.length > 0 ? (greenCount / history.length) * 100 : 0"></div>
                </div>
                <div class="flex-1 bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                  <div class="h-full rounded-full bg-amber-500" [style.width.%]="history.length > 0 ? (yellowCount / history.length) * 100 : 0"></div>
                </div>
                <div class="flex-1 bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                  <div class="h-full rounded-full bg-red-500" [style.width.%]="history.length > 0 ? (redCount / history.length) * 100 : 0"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Kriitilised puudused -->
          <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-5 animate-fade-in-up delay-400 card-hover">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-xs text-slate-500 uppercase tracking-wider mb-2">Kriitilised puudused</p>
                <span class="text-4xl font-extrabold" [class]="redCount > 0 ? 'text-red-400' : 'text-emerald-400'">{{ redCount }}</span>
                <p class="text-xs mt-1" [class]="redCount > 0 ? 'text-red-400/70' : 'text-emerald-400/70'">
                  {{ redCount > 0 ? 'N\u00f5uab t\u00e4helepanu' : 'Puudused puuduvad' }}
                </p>
              </div>
              <div class="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
                   [class]="redCount > 0 ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'">
                <svg class="w-5 h-5" [class]="redCount > 0 ? 'text-red-400' : 'text-emerald-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
              </div>
            </div>
            <div class="mt-3">
              <svg class="w-full h-8" viewBox="0 0 120 32" preserveAspectRatio="none">
                <path [attr.d]="sparklineRedPath" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
                <path [attr.d]="sparklineRedArea" fill="#f87171" opacity="0.08"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Main content grid: Leaderboard + Pillars -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          <!-- Firmade edetabel (2 cols) -->
          <div class="lg:col-span-2 bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 animate-fade-in-up delay-300">
            <h2 class="text-sm font-semibold text-slate-300 mb-5 flex items-center gap-2">
              <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
              </svg>
              Firmade edetabel
              <span class="text-xs text-slate-500 font-normal ml-auto">{{ leaderboard.length }} ettev&otilde;tet</span>
            </h2>

            <!-- Table header -->
            <div class="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-700/50 mb-2">
              <div class="col-span-1">#</div>
              <div class="col-span-4">Ettev&otilde;te</div>
              <div class="col-span-3">Leping</div>
              <div class="col-span-2 text-center">Skoor</div>
              <div class="col-span-2 text-center">Staatus</div>
            </div>

            <!-- Table rows -->
            <div *ngFor="let entry of leaderboard; let i = index"
                 class="grid grid-cols-12 gap-2 px-3 py-3 rounded-lg items-center transition-all duration-200
                        hover:bg-slate-700/30 cursor-default animate-slide-in-right"
                 [style.animation-delay]="(i * 60 + 400) + 'ms'"
                 [ngClass]="{'border-b border-slate-700/30': i !== leaderboard.length - 1}">

              <!-- Rank -->
              <div class="col-span-1">
                <span *ngIf="entry.rank === 1" class="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs font-bold">1</span>
                <span *ngIf="entry.rank === 2" class="w-7 h-7 rounded-full bg-slate-400/20 text-slate-300 border border-slate-400/30 flex items-center justify-center text-xs font-bold">2</span>
                <span *ngIf="entry.rank === 3" class="w-7 h-7 rounded-full bg-orange-600/20 text-orange-400 border border-orange-600/30 flex items-center justify-center text-xs font-bold">3</span>
                <span *ngIf="entry.rank > 3" class="w-7 h-7 rounded-full bg-slate-700/50 text-slate-500 flex items-center justify-center text-xs font-medium">{{ entry.rank }}</span>
              </div>

              <!-- Company -->
              <div class="col-span-4">
                <p class="text-sm text-slate-200 font-medium truncate">{{ entry.companyName }}</p>
              </div>

              <!-- Contract -->
              <div class="col-span-3">
                <p class="text-sm text-slate-500 truncate">{{ entry.contractName }}</p>
              </div>

              <!-- Score circle -->
              <div class="col-span-2 flex justify-center">
                <div class="relative w-10 h-10">
                  <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" stroke-width="6"/>
                    <circle cx="50" cy="50" r="40" fill="none"
                            [attr.stroke]="getLevelColor(entry.complianceLevel)"
                            stroke-width="6" stroke-linecap="round"
                            stroke-dasharray="251.33"
                            [attr.stroke-dashoffset]="251.33 - (251.33 * entry.scorePercentage / 100)"
                            class="animate-draw-circle"/>
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <span class="text-xs font-bold" [style.color]="getLevelColor(entry.complianceLevel)">{{ entry.scorePercentage | number:'1.0-0' }}</span>
                  </div>
                </div>
              </div>

              <!-- Badge -->
              <div class="col-span-2 flex justify-center">
                <span [class]="getBadgeClass(entry.complianceLevel)">
                  {{ getBadgeLabel(entry.complianceLevel) }}
                </span>
              </div>
            </div>

            <div *ngIf="leaderboard.length === 0" class="text-center py-8 text-slate-500 text-sm">
              Andmed puuduvad
            </div>
          </div>

          <!-- DORA 5 Pillars Overview (1 col) -->
          <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 animate-fade-in-up delay-400">
            <h2 class="text-sm font-semibold text-slate-300 mb-5 flex items-center gap-2">
              <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
              DORA 5 sammast
            </h2>

            <div class="space-y-5">
              <div *ngFor="let pillar of pillarData; let i = index"
                   class="animate-fade-in-up"
                   [style.animation-delay]="(i * 100 + 500) + 'ms'">
                <div class="flex items-center gap-3 mb-2">
                  <!-- Donut chart -->
                  <div class="relative w-14 h-14 shrink-0">
                    <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#334155" stroke-width="8"/>
                      <circle cx="50" cy="50" r="38" fill="none"
                              [attr.stroke]="pillar.color"
                              stroke-width="8" stroke-linecap="round"
                              stroke-dasharray="238.76"
                              [attr.stroke-dashoffset]="pillar.dashOffset"
                              style="transition: stroke-dashoffset 1.5s ease-out;"/>
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                      <span class="text-xs font-bold" [style.color]="pillar.color">{{ pillar.percentage | number:'1.0-0' }}%</span>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-lg">{{ pillar.icon }}</span>
                      <p class="text-sm font-medium text-slate-200 truncate">{{ pillar.label }}</p>
                    </div>
                    <div class="w-full bg-slate-700/50 rounded-full h-1.5 mt-1.5">
                      <div class="h-full rounded-full transition-all duration-1000"
                           [style.width.%]="pillar.percentage"
                           [style.background]="pillar.color"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Trend Chart (full width) -->
        <div *ngIf="history.length >= 2" class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 mb-8 animate-fade-in-up delay-500">
          <h2 class="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
            Skoori trend
            <span class="text-xs text-slate-500 font-normal ml-auto">Viimased {{ trendPoints.length }} hindamist</span>
          </h2>
          <div class="relative" style="height: 240px;">
            <svg class="w-full h-full" [attr.viewBox]="'0 0 ' + trendChartWidth + ' 240'" preserveAspectRatio="none">
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#34d399" stop-opacity="0.3"/>
                  <stop offset="100%" stop-color="#34d399" stop-opacity="0"/>
                </linearGradient>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#34d399"/>
                  <stop offset="100%" stop-color="#22d3ee"/>
                </linearGradient>
              </defs>

              <!-- Grid lines -->
              <line x1="50" [attr.y1]="trendYForPercent(100)" [attr.x2]="trendChartWidth - 10" [attr.y2]="trendYForPercent(100)" stroke="#334155" stroke-width="0.5" stroke-dasharray="4"/>
              <line x1="50" [attr.y1]="trendYForPercent(75)" [attr.x2]="trendChartWidth - 10" [attr.y2]="trendYForPercent(75)" stroke="#334155" stroke-width="0.5" stroke-dasharray="4"/>
              <line x1="50" [attr.y1]="trendYForPercent(50)" [attr.x2]="trendChartWidth - 10" [attr.y2]="trendYForPercent(50)" stroke="#334155" stroke-width="0.5" stroke-dasharray="4"/>
              <line x1="50" [attr.y1]="trendYForPercent(25)" [attr.x2]="trendChartWidth - 10" [attr.y2]="trendYForPercent(25)" stroke="#334155" stroke-width="0.5" stroke-dasharray="4"/>
              <line x1="50" [attr.y1]="trendYForPercent(0)" [attr.x2]="trendChartWidth - 10" [attr.y2]="trendYForPercent(0)" stroke="#334155" stroke-width="0.5" stroke-dasharray="4"/>

              <!-- Y-axis labels -->
              <text x="40" [attr.y]="trendYForPercent(100) + 4" text-anchor="end" font-size="10" class="fill-slate-500">100%</text>
              <text x="40" [attr.y]="trendYForPercent(75) + 4" text-anchor="end" font-size="10" class="fill-slate-500">75%</text>
              <text x="40" [attr.y]="trendYForPercent(50) + 4" text-anchor="end" font-size="10" class="fill-slate-500">50%</text>
              <text x="40" [attr.y]="trendYForPercent(25) + 4" text-anchor="end" font-size="10" class="fill-slate-500">25%</text>
              <text x="40" [attr.y]="trendYForPercent(0) + 4" text-anchor="end" font-size="10" class="fill-slate-500">0%</text>

              <!-- Danger zone background -->
              <rect x="50" [attr.y]="trendYForPercent(50)" [attr.width]="trendChartWidth - 60"
                    [attr.height]="trendYForPercent(0) - trendYForPercent(50)"
                    fill="#f87171" opacity="0.03" rx="4"/>

              <!-- Area fill -->
              <path [attr.d]="trendAreaPath" fill="url(#trendGradient)"/>

              <!-- Line -->
              <path [attr.d]="trendLinePath" fill="none" stroke="url(#lineGradient)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="animate-sparkline"/>

              <!-- Dots -->
              <circle *ngFor="let point of trendPoints; let i = index"
                      [attr.cx]="point.x" [attr.cy]="point.y" r="5"
                      [attr.fill]="point.color" stroke="#1e293b" stroke-width="2.5"
                      class="animate-scale-in" [style.animation-delay]="(i * 80 + 700) + 'ms'"/>

              <!-- X-axis date labels -->
              <text *ngFor="let point of trendXLabels"
                    [attr.x]="point.x" [attr.y]="232"
                    text-anchor="middle" font-size="9" class="fill-slate-500">{{ point.dateLabel }}</text>
            </svg>
          </div>
        </div>

        <!-- Bottom row: Deficiencies + Distribution -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          <!-- Top Puudused -->
          <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 animate-fade-in-up delay-600">
            <h2 class="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
              Top puudused
            </h2>

            <div *ngIf="deficiencies.length === 0" class="text-center py-10">
              <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <p class="text-sm text-slate-400">K&otilde;ik hindamised on vastavad!</p>
            </div>

            <div *ngIf="deficiencies.length > 0" class="space-y-2">
              <div *ngFor="let def of deficiencies; let i = index"
                   class="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/30 animate-slide-in-right"
                   [style.animation-delay]="(i * 80 + 700) + 'ms'">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                     [class]="3 > i ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'">
                  {{ i + 1 }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-slate-200 truncate">{{ def.companyName }}</p>
                  <p class="text-xs text-slate-500">{{ def.contractName }} &middot; {{ def.scorePercentage | number:'1.0-0' }}%</p>
                </div>
                <div class="shrink-0">
                  <span class="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                    {{ def.totalQuestions - def.compliantCount }} puudust
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Score Distribution -->
          <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 animate-fade-in-up delay-700">
            <h2 class="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>
              </svg>
              Skooride jaotus
            </h2>

            <div class="flex justify-center mb-4">
              <svg viewBox="0 0 200 200" class="w-48 h-48">
                <!-- Donut segments -->
                <circle cx="100" cy="100" r="70" fill="none" stroke="#334155" stroke-width="30"/>
                <circle cx="100" cy="100" r="70" fill="none"
                        stroke="#34d399" stroke-width="30"
                        stroke-dasharray="439.82"
                        [attr.stroke-dashoffset]="439.82 - (439.82 * greenRatio)"
                        transform="rotate(-90 100 100)"
                        class="animate-draw-circle"/>
                <circle cx="100" cy="100" r="70" fill="none"
                        stroke="#fbbf24" stroke-width="30"
                        stroke-dasharray="439.82"
                        [attr.stroke-dashoffset]="439.82 - (439.82 * yellowRatio)"
                        [attr.transform]="'rotate(' + (greenRatio * 360 - 90) + ' 100 100)'"
                        class="animate-draw-circle" style="animation-delay: 200ms;"/>
                <circle cx="100" cy="100" r="70" fill="none"
                        stroke="#f87171" stroke-width="30"
                        stroke-dasharray="439.82"
                        [attr.stroke-dashoffset]="439.82 - (439.82 * redRatio)"
                        [attr.transform]="'rotate(' + ((greenRatio + yellowRatio) * 360 - 90) + ' 100 100)'"
                        class="animate-draw-circle" style="animation-delay: 400ms;"/>
                <!-- Center text -->
                <text x="100" y="95" text-anchor="middle" font-size="22" font-weight="bold" class="fill-slate-100">{{ history.length }}</text>
                <text x="100" y="115" text-anchor="middle" font-size="10" class="fill-slate-500">hindamist</text>
              </svg>
            </div>

            <!-- Legend -->
            <div class="space-y-2">
              <div class="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-700/20 transition-colors">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-emerald-400"></div>
                  <span class="text-sm text-slate-300">Vastav (GREEN)</span>
                </div>
                <span class="text-sm font-semibold text-emerald-400">{{ greenCount }} ({{ history.length > 0 ? (greenRatio * 100 | number:'1.0-0') : 0 }}%)</span>
              </div>
              <div class="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-700/20 transition-colors">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-amber-400"></div>
                  <span class="text-sm text-slate-300">Osaliselt (YELLOW)</span>
                </div>
                <span class="text-sm font-semibold text-amber-400">{{ yellowCount }} ({{ history.length > 0 ? (yellowRatio * 100 | number:'1.0-0') : 0 }}%)</span>
              </div>
              <div class="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-700/20 transition-colors">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-red-400"></div>
                  <span class="text-sm text-slate-300">Mittevastav (RED)</span>
                </div>
                <span class="text-sm font-semibold text-red-400">{{ redCount }} ({{ history.length > 0 ? (redRatio * 100 | number:'1.0-0') : 0 }}%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer actions -->
        <div class="text-center animate-fade-in delay-800 mb-8">
          <div class="flex flex-wrap justify-center gap-3">
            <a routerLink="/assessment"
               class="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400
                      text-slate-900 font-semibold px-6 py-2.5 rounded-lg transition-all duration-300
                      hover:shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Uus hindamine
            </a>
            <a routerLink="/history"
               class="bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 font-semibold px-6 py-2.5 rounded-lg
                      transition-all duration-300 border border-slate-600/50 hover:border-slate-500/50 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Vaata ajalugu
            </a>
          </div>
        </div>

      </ng-container>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  history: HistoryEntry[] = [];
  leaderboard: LeaderboardEntry[] = [];
  pillarData: PillarData[] = [];
  deficiencies: HistoryEntry[] = [];

  // Trend chart
  trendPoints: ChartPoint[] = [];
  trendLinePath = '';
  trendAreaPath = '';
  trendXLabels: { x: number; dateLabel: string }[] = [];
  trendChartWidth = 800;

  // Sparklines
  sparklineTotalPath = '';
  sparklineTotalArea = '';
  sparklineScorePath = '';
  sparklineScoreArea = '';
  sparklineRedPath = '';
  sparklineRedArea = '';

  lastUpdated = '';

  ngOnInit() {
    this.loadHistory();
    this.buildLeaderboard();
    this.buildPillarData();
    this.buildTrendChart();
    this.buildSparklines();
    this.buildDeficiencies();
    this.lastUpdated = this.formatDate(new Date().toISOString());
  }

  loadHistory() {
    try {
      this.history = JSON.parse(localStorage.getItem('dora_history') || '[]');
    } catch {
      this.history = [];
    }
  }

  // --- KPI getters ---

  get avgScore(): number {
    if (this.history.length === 0) return 0;
    return this.history.reduce((sum, h) => sum + h.scorePercentage, 0) / this.history.length;
  }

  get avgScoreColor(): string {
    const avg = this.avgScore;
    if (avg >= 75) return '#34d399';
    if (avg >= 50) return '#fbbf24';
    return '#f87171';
  }

  get scoreTrend(): number {
    if (this.history.length < 2) return 0;
    const recent = this.history.slice(0, Math.min(5, this.history.length));
    const older = this.history.slice(Math.min(5, this.history.length));
    if (older.length === 0) return 0;
    const recentAvg = recent.reduce((s, h) => s + h.scorePercentage, 0) / recent.length;
    const olderAvg = older.reduce((s, h) => s + h.scorePercentage, 0) / older.length;
    return recentAvg - olderAvg;
  }

  get greenCount(): number { return this.history.filter(h => h.complianceLevel === 'GREEN').length; }
  get yellowCount(): number { return this.history.filter(h => h.complianceLevel === 'YELLOW').length; }
  get redCount(): number { return this.history.filter(h => h.complianceLevel === 'RED').length; }

  get recentCount(): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.history.filter(h => new Date(h.assessmentDate) >= thirtyDaysAgo).length;
  }

  get greenRatio(): number {
    return this.history.length > 0 ? this.greenCount / this.history.length : 0;
  }
  get yellowRatio(): number {
    return this.history.length > 0 ? this.yellowCount / this.history.length : 0;
  }
  get redRatio(): number {
    return this.history.length > 0 ? this.redCount / this.history.length : 0;
  }

  // --- Leaderboard ---

  buildLeaderboard() {
    this.leaderboard = [...this.history]
      .sort((a, b) => b.scorePercentage - a.scorePercentage)
      .slice(0, 10)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  // --- DORA 5 Pillars ---

  buildPillarData() {
    const avgPct = this.avgScore;
    const pillars = [
      { icon: '\u{1F6E1}\uFE0F', label: 'IKT riskihaldus', base: 0.90 },
      { icon: '\u{1F4CB}', label: 'Intsidendid', base: 0.85 },
      { icon: '\u{1F50D}', label: 'Testimine', base: 0.80 },
      { icon: '\u{1F91D}', label: 'Kolmandad osapooled', base: 1.0 },
      { icon: '\u{1F4E1}', label: 'Info jagamine', base: 0.75 }
    ];

    this.pillarData = pillars.map(p => {
      const pct = Math.min(100, Math.max(0, avgPct * p.base));
      const circumference = 238.76;
      const color = pct >= 75 ? '#34d399' : (pct >= 50 ? '#fbbf24' : '#f87171');
      return {
        icon: p.icon,
        label: p.label,
        percentage: pct,
        color,
        dashOffset: circumference - (circumference * pct / 100)
      };
    });
  }

  // --- Trend Chart ---

  buildTrendChart() {
    const entries = [...this.history].reverse().slice(-15);
    if (entries.length < 2) return;

    const padLeft = 60;
    const padRight = 20;
    const padTop = 15;
    const padBottom = 30;
    const w = this.trendChartWidth - padLeft - padRight;
    const h = 240 - padTop - padBottom;

    this.trendPoints = entries.map((e, i) => ({
      x: padLeft + (i / (entries.length - 1)) * w,
      y: padTop + (1 - e.scorePercentage / 100) * h,
      color: this.getLevelColor(e.complianceLevel),
      score: e.scorePercentage,
      dateLabel: this.formatShortDate(e.assessmentDate)
    }));

    this.trendLinePath = this.trendPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

    const bottomY = padTop + h;
    const lastX = this.trendPoints[this.trendPoints.length - 1].x;
    const firstX = this.trendPoints[0].x;
    this.trendAreaPath = `${this.trendLinePath} L${lastX},${bottomY} L${firstX},${bottomY} Z`;

    // X-axis labels (show every few)
    const step = Math.max(1, Math.floor(entries.length / 6));
    this.trendXLabels = this.trendPoints.filter((_, i) => i % step === 0 || i === entries.length - 1);
  }

  trendYForPercent(pct: number): number {
    const padTop = 15;
    const h = 240 - 15 - 30;
    return padTop + (1 - pct / 100) * h;
  }

  // --- Sparklines ---

  buildSparklines() {
    const entries = [...this.history].reverse().slice(-10);
    if (entries.length < 2) {
      this.sparklineTotalPath = 'M0,16 L120,16';
      this.sparklineTotalArea = 'M0,16 L120,16 L120,32 L0,32 Z';
      this.sparklineScorePath = 'M0,16 L120,16';
      this.sparklineScoreArea = 'M0,16 L120,16 L120,32 L0,32 Z';
      this.sparklineRedPath = 'M0,28 L120,28';
      this.sparklineRedArea = 'M0,28 L120,28 L120,32 L0,32 Z';
      return;
    }

    // Total count sparkline (cumulative)
    const totalPoints = entries.map((_, i) => {
      const x = (i / (entries.length - 1)) * 120;
      const y = 28 - ((i + 1) / entries.length) * 24;
      return { x, y };
    });
    this.sparklineTotalPath = totalPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    this.sparklineTotalArea = `${this.sparklineTotalPath} L120,32 L0,32 Z`;

    // Score sparkline
    const scorePoints = entries.map((e, i) => ({
      x: (i / (entries.length - 1)) * 120,
      y: 28 - (e.scorePercentage / 100) * 24
    }));
    this.sparklineScorePath = scorePoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    this.sparklineScoreArea = `${this.sparklineScorePath} L120,32 L0,32 Z`;

    // Red count sparkline
    let redRunning = 0;
    const maxRed = Math.max(1, this.redCount);
    const redPoints = entries.map((e, i) => {
      if (e.complianceLevel === 'RED') redRunning++;
      return {
        x: (i / (entries.length - 1)) * 120,
        y: 28 - (redRunning / maxRed) * 24
      };
    });
    this.sparklineRedPath = redPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    this.sparklineRedArea = `${this.sparklineRedPath} L120,32 L0,32 Z`;
  }

  // --- Deficiencies ---

  buildDeficiencies() {
    this.deficiencies = [...this.history]
      .filter(h => h.complianceLevel === 'RED' || h.compliantCount < h.totalQuestions)
      .sort((a, b) => a.scorePercentage - b.scorePercentage)
      .slice(0, 5);
  }

  // --- Helpers ---

  getLevelColor(level: string): string {
    switch (level) {
      case 'GREEN': return '#34d399';
      case 'YELLOW': return '#fbbf24';
      case 'RED': return '#f87171';
      default: return '#64748b';
    }
  }

  getBadgeClass(level: string): string {
    const base = 'text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap';
    switch (level) {
      case 'GREEN': return `${base} bg-emerald-500/15 text-emerald-400 border border-emerald-500/20`;
      case 'YELLOW': return `${base} bg-amber-500/15 text-amber-400 border border-amber-500/20`;
      case 'RED': return `${base} bg-red-500/15 text-red-400 border border-red-500/20`;
      default: return base;
    }
  }

  getBadgeLabel(level: string): string {
    switch (level) {
      case 'GREEN': return 'Vastav';
      case 'YELLOW': return 'Osaliselt';
      case 'RED': return 'Mittevastav';
      default: return '';
    }
  }

  formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('et-EE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  }

  formatShortDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('et-EE', { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  }
}
