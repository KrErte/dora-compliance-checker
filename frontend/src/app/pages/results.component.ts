import { Component, OnInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { AssessmentResult, CATEGORY_LABELS } from '../models';

interface RadarPoint {
  x: number;
  y: number;
  label: string;
  labelX: number;
  labelY: number;
  value: number;
  anchor: string;
}

interface HeatmapCell {
  row: number;
  col: number;
  x: number;
  y: number;
  color: string;
  opacity: number;
  categories: string[];
  count: number;
}

@Component({
  selector: 'app-results',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto">
      <div *ngIf="loading" class="text-center py-16 animate-fade-in">
        <div class="inline-block w-10 h-10 border-4 border-slate-700 border-t-emerald-400 rounded-full animate-spin"></div>
        <p class="text-slate-400 mt-4">Tulemuste laadimine...</p>
      </div>

      <div *ngIf="error" class="bg-red-900/30 border border-red-700/50 rounded-xl p-4 text-red-300 animate-scale-in">
        {{ error }}
      </div>

      <div *ngIf="result">
        <!-- Score hero section -->
        <div class="bg-gradient-to-br from-slate-800/80 to-slate-800/40 backdrop-blur rounded-2xl p-8 mb-8 border border-slate-700/50 animate-scale-in">
          <div class="flex flex-col md:flex-row items-center gap-8">
            <!-- SVG circular score -->
            <div class="relative w-40 h-40 shrink-0">
              <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" stroke-width="6"/>
                <circle cx="50" cy="50" r="45" fill="none"
                        [attr.stroke]="circleColor"
                        stroke-width="6"
                        stroke-linecap="round"
                        [attr.stroke-dasharray]="282.74"
                        [attr.stroke-dashoffset]="282.74 - (282.74 * result.scorePercentage / 100)"
                        class="animate-draw-circle"/>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center animate-score-count delay-500">
                <span class="text-4xl font-extrabold" [class]="scoreTextClass">{{ result.scorePercentage | number:'1.0-0' }}</span>
                <span class="text-sm text-slate-500">protsenti</span>
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 text-center md:text-left">
              <div class="animate-fade-in-up delay-200">
                <span [class]="badgeClass">{{ badgeLabel }}</span>
              </div>
              <h1 class="text-2xl font-bold text-slate-100 mt-3 animate-fade-in-up delay-300">{{ result.companyName }}</h1>
              <p class="text-slate-400 animate-fade-in-up delay-400">{{ result.contractName }}</p>
              <p class="text-xs text-slate-500 mt-2 animate-fade-in delay-500">{{ result.assessmentDate | date:'dd.MM.yyyy HH:mm' }}</p>

              <!-- Stats row -->
              <div class="flex gap-6 mt-4 justify-center md:justify-start animate-fade-in-up delay-500">
                <div>
                  <span class="text-2xl font-bold text-emerald-400">{{ result.compliantCount }}</span>
                  <p class="text-xs text-slate-500">vastav</p>
                </div>
                <div>
                  <span class="text-2xl font-bold text-red-400">{{ result.nonCompliantCount }}</span>
                  <p class="text-xs text-slate-500">mittevastav</p>
                </div>
                <div>
                  <span class="text-2xl font-bold text-slate-300">{{ result.totalQuestions }}</span>
                  <p class="text-xs text-slate-500">kokku</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Radar Chart + Risk Heatmap side by side -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <!-- Radar Chart -->
          <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 animate-fade-in-up delay-300">
            <h2 class="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>
              </svg>
              Vastavuse profiil
            </h2>
            <div class="flex justify-center">
              <svg viewBox="0 0 300 300" class="w-full max-w-[280px]">
                <!-- Background rings -->
                <polygon *ngFor="let ring of radarRings"
                         [attr.points]="ring"
                         fill="none" stroke="#334155" stroke-width="0.5"/>
                <!-- Axis lines -->
                <line *ngFor="let p of radarPoints"
                      x1="150" y1="150"
                      [attr.x2]="p.x * 1.0 + 150 * (1 - 1.0)" [attr.y2]="p.y * 1.0 + 150 * (1 - 1.0)"
                      stroke="#334155" stroke-width="0.5"/>
                <!-- Data area -->
                <polygon [attr.points]="radarDataPath"
                         fill="#34d399" fill-opacity="0.15"
                         stroke="#34d399" stroke-width="2"
                         class="animate-scale-in delay-500"/>
                <!-- Data points -->
                <circle *ngFor="let p of radarDataPoints; let i = index"
                        [attr.cx]="p.x" [attr.cy]="p.y" r="4"
                        [attr.fill]="p.value >= 100 ? '#34d399' : (p.value > 0 ? '#fbbf24' : '#f87171')"
                        stroke="#1e293b" stroke-width="2"
                        class="animate-scale-in"
                        [style.animation-delay]="(i * 80 + 600) + 'ms'"/>
                <!-- Labels -->
                <text *ngFor="let p of radarPoints; let i = index"
                      [attr.x]="p.labelX" [attr.y]="p.labelY"
                      [attr.text-anchor]="p.anchor"
                      class="fill-slate-400 animate-fade-in"
                      [style.animation-delay]="(i * 60 + 400) + 'ms'"
                      font-size="8">{{ p.label }}</text>
              </svg>
            </div>
          </div>

          <!-- Risk Heatmap -->
          <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 animate-fade-in-up delay-400">
            <h2 class="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"/>
              </svg>
              Riskimaatriks
            </h2>
            <div class="flex justify-center">
              <div class="relative">
                <!-- Y axis label -->
                <div class="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-slate-500 whitespace-nowrap">M&otilde;ju</div>
                <svg viewBox="0 0 220 220" class="w-full max-w-[250px]">
                  <!-- Grid cells -->
                  <g *ngFor="let cell of heatmapCells">
                    <rect [attr.x]="cell.x" [attr.y]="cell.y"
                          width="56" height="56" rx="4"
                          [attr.fill]="cell.color"
                          [attr.fill-opacity]="cell.opacity"
                          stroke="#1e293b" stroke-width="2"
                          class="animate-scale-in"
                          [style.animation-delay]="((cell.row * 3 + cell.col) * 80 + 500) + 'ms'"/>
                    <text *ngIf="cell.count > 0"
                          [attr.x]="cell.x + 28" [attr.y]="cell.y + 32"
                          text-anchor="middle" font-size="16" font-weight="bold"
                          [attr.fill]="cell.opacity > 0.5 ? '#fff' : '#94a3b8'">{{ cell.count }}</text>
                  </g>
                  <!-- Axis labels -->
                  <text x="36" y="215" text-anchor="middle" font-size="8" class="fill-slate-500">Madal</text>
                  <text x="94" y="215" text-anchor="middle" font-size="8" class="fill-slate-500">Keskmine</text>
                  <text x="152" y="215" text-anchor="middle" font-size="8" class="fill-slate-500">K&otilde;rge</text>
                  <text x="94" y="230" text-anchor="middle" font-size="9" class="fill-slate-400">T&otilde;en&auml;osus</text>

                  <text x="-8" y="162" text-anchor="middle" font-size="8" class="fill-slate-500" transform="rotate(-90, -8, 162)">Madal</text>
                  <text x="-8" y="104" text-anchor="middle" font-size="8" class="fill-slate-500" transform="rotate(-90, -8, 104)">Keskm.</text>
                  <text x="-8" y="46" text-anchor="middle" font-size="8" class="fill-slate-500" transform="rotate(-90, -8, 46)">K&otilde;rge</text>
                </svg>
              </div>
            </div>
            <!-- Heatmap legend -->
            <div class="flex items-center justify-center gap-3 mt-3">
              <div class="flex items-center gap-1">
                <div class="w-3 h-3 rounded bg-emerald-500/40"></div>
                <span class="text-xs text-slate-500">Madal risk</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-3 h-3 rounded bg-amber-500/60"></div>
                <span class="text-xs text-slate-500">Keskmine</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-3 h-3 rounded bg-red-500/80"></div>
                <span class="text-xs text-slate-500">K&otilde;rge risk</span>
              </div>
            </div>
          </div>
        </div>

        <!-- DORA 5 Pillars Status -->
        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 mb-8 animate-fade-in-up delay-400">
          <h2 class="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            DORA 5 sammast
          </h2>
          <div class="grid grid-cols-5 gap-2">
            <div *ngFor="let pillar of doraPillars; let i = index"
                 class="text-center p-3 rounded-lg border animate-fade-in-up"
                 [class]="pillar.active
                   ? 'bg-emerald-500/5 border-emerald-500/20'
                   : 'bg-slate-800/50 border-slate-700/30'"
                 [style.animation-delay]="(i * 100 + 500) + 'ms'">
              <div class="text-2xl mb-1">{{ pillar.icon }}</div>
              <p class="text-xs font-medium" [class]="pillar.active ? 'text-emerald-400' : 'text-slate-500'">{{ pillar.label }}</p>
              <div class="mt-2" *ngIf="pillar.active">
                <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  {{ result.scorePercentage | number:'1.0-0' }}%
                </span>
              </div>
              <div class="mt-2" *ngIf="!pillar.active">
                <span class="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-600 border border-slate-700/30">
                  Peagi
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Category summary cards -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          <div *ngFor="let cat of categoryStats; let i = index"
               class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4 card-hover animate-fade-in-up"
               [style.animation-delay]="(i * 80 + 300) + 'ms'">
            <p class="text-xs text-slate-500 mb-2">{{ cat.label }}</p>
            <div class="flex items-end gap-2">
              <span class="text-lg font-bold" [class]="cat.compliant === cat.total ? 'text-emerald-400' : 'text-amber-400'">
                {{ cat.compliant }}/{{ cat.total }}
              </span>
            </div>
            <div class="w-full bg-slate-700 rounded-full h-1.5 mt-2">
              <div class="h-1.5 rounded-full transition-all duration-700 animate-progress-fill"
                   [class]="cat.compliant === cat.total ? 'bg-emerald-500' : (cat.compliant === 0 ? 'bg-red-500' : 'bg-amber-500')"
                   [style.width.%]="(cat.compliant / cat.total) * 100"
                   [style.animation-delay]="(i * 100 + 500) + 'ms'">
              </div>
            </div>
          </div>
        </div>

        <!-- Remediation Priority -->
        <div *ngIf="nonCompliantItems.length > 0" class="bg-gradient-to-br from-red-900/10 to-slate-800/50 backdrop-blur border border-red-700/20 rounded-xl p-6 mb-8 animate-fade-in-up delay-500">
          <h2 class="text-sm font-semibold text-red-300 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
            Prioriteetne tegevuskava ({{ nonCompliantItems.length }} puudust)
          </h2>
          <div class="space-y-2">
            <div *ngFor="let item of nonCompliantItems; let i = index"
                 class="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/30 animate-slide-in-right"
                 [style.animation-delay]="(i * 80 + 600) + 'ms'">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                   [class]="i < 3 ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'">
                {{ i + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-slate-200 truncate">{{ item.question }}</p>
                <p class="text-xs text-slate-500">{{ item.articleReference }} &middot; {{ getCategoryLabel(item.category) }}</p>
              </div>
              <div class="shrink-0">
                <span class="text-xs px-2 py-0.5 rounded-full"
                      [class]="i < 3 ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'">
                  {{ i < 3 ? 'Kriitiline' : 'Oluline' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Compliance Roadmap -->
        <div *ngIf="nonCompliantItems.length > 0" class="glass-card p-6 mb-8 animate-fade-in-up delay-600">
          <h2 class="text-sm font-semibold text-slate-300 mb-6 flex items-center gap-2">
            <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
            </svg>
            Vastavuse tegevuskava
          </h2>

          <div class="relative">
            <!-- Timeline line -->
            <div class="absolute left-[15px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500 via-amber-500 to-emerald-500 opacity-40"></div>

            <!-- Phase 1: Critical (0-3 months) -->
            <div class="relative pl-10 pb-8 animate-fade-in-up delay-700">
              <div class="absolute left-[7px] top-1 w-[18px] h-[18px] rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center">
                <div class="w-2 h-2 rounded-full bg-red-400"></div>
              </div>
              <div class="glass-card p-4">
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-xs font-bold text-red-400 uppercase tracking-wider">Faas 1</span>
                  <span class="text-xs text-slate-500">&middot; Kriitilised puudused</span>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 ml-auto">0&ndash;3 kuud</span>
                </div>
                <div class="w-full bg-slate-700 rounded-full h-1.5 mb-3">
                  <div class="h-1.5 rounded-full bg-gradient-to-r from-red-500 to-red-400 animate-progress-fill" [style.width.%]="roadmapPhase1Progress"></div>
                </div>
                <div class="space-y-1.5">
                  <div *ngFor="let item of roadmapPhase1; let i = index"
                       class="flex items-center gap-2 text-sm animate-slide-in-right"
                       [style.animation-delay]="(i * 60 + 800) + 'ms'">
                    <span class="w-5 h-5 rounded bg-red-500/10 flex items-center justify-center text-xs text-red-400 shrink-0">{{ i + 1 }}</span>
                    <span class="text-slate-300 truncate">{{ item.question }}</span>
                    <span class="text-xs text-slate-600 shrink-0">{{ item.articleReference }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Phase 2: Important (3-6 months) -->
            <div class="relative pl-10 pb-8 animate-fade-in-up delay-800">
              <div class="absolute left-[7px] top-1 w-[18px] h-[18px] rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center">
                <div class="w-2 h-2 rounded-full bg-amber-400"></div>
              </div>
              <div class="glass-card p-4">
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-xs font-bold text-amber-400 uppercase tracking-wider">Faas 2</span>
                  <span class="text-xs text-slate-500">&middot; Olulised parandused</span>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 ml-auto">3&ndash;6 kuud</span>
                </div>
                <div class="w-full bg-slate-700 rounded-full h-1.5 mb-3">
                  <div class="h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 animate-progress-fill delay-300" [style.width.%]="roadmapPhase2Progress"></div>
                </div>
                <div class="space-y-1.5">
                  <div *ngFor="let item of roadmapPhase2; let i = index"
                       class="flex items-center gap-2 text-sm animate-slide-in-right"
                       [style.animation-delay]="(i * 60 + 1000) + 'ms'">
                    <span class="w-5 h-5 rounded bg-amber-500/10 flex items-center justify-center text-xs text-amber-400 shrink-0">{{ i + 1 }}</span>
                    <span class="text-slate-300 truncate">{{ item.question }}</span>
                    <span class="text-xs text-slate-600 shrink-0">{{ item.articleReference }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Phase 3: Full compliance -->
            <div class="relative pl-10 animate-fade-in-up delay-1000">
              <div class="absolute left-[7px] top-1 w-[18px] h-[18px] rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center">
                <div class="w-2 h-2 rounded-full bg-emerald-400"></div>
              </div>
              <div class="glass-card p-4">
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider">Faas 3</span>
                  <span class="text-xs text-slate-500">&middot; T&auml;ielik vastavus</span>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ml-auto">6&ndash;12 kuud</span>
                </div>
                <div class="w-full bg-slate-700 rounded-full h-1.5 mb-3">
                  <div class="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 animate-progress-fill delay-500" [style.width.%]="roadmapPhase3Progress"></div>
                </div>
                <div class="flex items-center gap-2 text-sm text-emerald-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>Pidev j&auml;relevalve ja regulaarne &uuml;levaatus</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Question breakdown -->
        <h2 class="text-lg font-semibold text-slate-200 mb-4 animate-fade-in-up delay-400 flex items-center gap-2">
          <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          Detailne &uuml;levaade
        </h2>

        <div *ngFor="let qr of result.questionResults; let i = index"
             class="bg-slate-800/50 backdrop-blur rounded-xl p-5 mb-3 border border-slate-700/50 card-hover animate-slide-in-right"
             [style.animation-delay]="(i * 60 + 500) + 'ms'">
          <div class="flex items-start gap-3">
            <span [class]="qr.compliant
              ? 'mt-0.5 w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-sm shrink-0 border border-emerald-500/20'
              : 'mt-0.5 w-7 h-7 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center text-sm shrink-0 border border-red-500/20'">
              {{ qr.compliant ? '\u2713' : '\u2717' }}
            </span>
            <div class="flex-1">
              <p class="text-slate-200 font-medium">{{ qr.question }}</p>
              <div class="flex items-center gap-3 mt-1.5">
                <span class="text-xs text-slate-500">{{ qr.articleReference }}</span>
                <span class="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/30">
                  {{ getCategoryLabel(qr.category) }}
                </span>
              </div>
              <div *ngIf="!qr.compliant" class="mt-3 bg-gradient-to-r from-amber-500/5 to-transparent rounded-lg p-3 border-l-2 border-amber-500/50">
                <p class="text-xs font-semibold text-amber-400 mb-1">Soovitus</p>
                <p class="text-sm text-slate-300 leading-relaxed">{{ qr.recommendation }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Print header (only visible in PDF) -->
        <div class="print-only mb-6">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
            <div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#34d399,#22d3ee);display:flex;align-items:center;justify-content:center;color:#0f172a;font-weight:bold;font-size:14px;">D</div>
            <div>
              <div style="font-size:18px;font-weight:bold;color:#1e293b;">DORA Vastavuskontrolli Aruanne</div>
              <div style="font-size:11px;color:#64748b;">EU m&auml;&auml;rus 2022/2554 &middot; Artiklid 28&ndash;30</div>
            </div>
          </div>
          <hr style="border-color:#e2e8f0;margin-bottom:16px;">
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap justify-center gap-3 mt-10 mb-8 animate-fade-in-up delay-800 no-print">
          <a [routerLink]="['/certificate', result.id]"
                  class="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400
                         text-slate-900 font-semibold px-6 py-2.5 rounded-lg transition-all duration-300
                         hover:shadow-lg hover:shadow-amber-500/25 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
            </svg>
            Tunnistus
          </a>
          <button (click)="exportPdf()"
                  class="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400
                         text-white font-semibold px-6 py-2.5 rounded-lg transition-all duration-300
                         hover:shadow-lg hover:shadow-violet-500/25 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Laadi PDF
          </button>
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
            Ajalugu
          </a>
        </div>
      </div>
    </div>
  `
})
export class ResultsComponent implements OnInit {
  result: AssessmentResult | null = null;
  loading = true;
  error = '';
  categoryStats: { label: string; compliant: number; total: number; percentage: number }[] = [];
  radarPoints: RadarPoint[] = [];
  radarRings: string[] = [];
  radarDataPath = '';
  radarDataPoints: { x: number; y: number; value: number }[] = [];
  heatmapCells: HeatmapCell[] = [];
  nonCompliantItems: { question: string; articleReference: string; category: string }[] = [];
  roadmapPhase1: { question: string; articleReference: string }[] = [];
  roadmapPhase2: { question: string; articleReference: string }[] = [];
  roadmapPhase1Progress = 0;
  roadmapPhase2Progress = 0;
  roadmapPhase3Progress = 0;

  doraPillars = [
    { icon: '\u{1F6E1}\uFE0F', label: 'IKT risk', active: true },
    { icon: '\u{1F4CB}', label: 'Intsidendid', active: true },
    { icon: '\u{1F50D}', label: 'Testimine', active: true },
    { icon: '\u{1F91D}', label: 'Kolmandad osapooled', active: true },
    { icon: '\u{1F4E1}', label: 'Info jagamine', active: true }
  ];

  constructor(private api: ApiService, private route: ActivatedRoute, private renderer: Renderer2) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getAssessment(id).subscribe({
      next: (result) => {
        this.result = result;
        this.buildCategoryStats();
        this.buildRadarChart();
        this.buildHeatmap();
        this.buildNonCompliantList();
        this.buildRoadmap();
        this.saveToHistory();
        this.loading = false;
        if (result.complianceLevel === 'GREEN') {
          setTimeout(() => this.launchConfetti(), 800);
        }
      },
      error: () => {
        this.error = 'Tulemuste laadimine eba\u00f5nnestus.';
        this.loading = false;
      }
    });
  }

  saveToHistory() {
    if (!this.result) return;
    const history = JSON.parse(localStorage.getItem('dora_history') || '[]');
    const exists = history.some((h: any) => h.id === this.result!.id);
    if (!exists) {
      history.unshift({
        id: this.result.id,
        companyName: this.result.companyName,
        contractName: this.result.contractName,
        scorePercentage: this.result.scorePercentage,
        complianceLevel: this.result.complianceLevel,
        assessmentDate: this.result.assessmentDate,
        compliantCount: this.result.compliantCount,
        totalQuestions: this.result.totalQuestions
      });
      if (history.length > 50) history.pop();
      localStorage.setItem('dora_history', JSON.stringify(history));
    }
  }

  exportPdf() {
    window.print();
  }

  buildCategoryStats() {
    if (!this.result) return;
    const map = new Map<string, { compliant: number; total: number }>();
    for (const qr of this.result.questionResults) {
      if (!map.has(qr.category)) map.set(qr.category, { compliant: 0, total: 0 });
      const stat = map.get(qr.category)!;
      stat.total++;
      if (qr.compliant) stat.compliant++;
    }
    this.categoryStats = Array.from(map.entries()).map(([cat, stat]) => ({
      label: CATEGORY_LABELS[cat] || cat,
      compliant: stat.compliant,
      total: stat.total,
      percentage: stat.total > 0 ? (stat.compliant / stat.total) * 100 : 0
    }));
  }

  buildRadarChart() {
    if (this.categoryStats.length === 0) return;
    const cx = 150, cy = 150, maxR = 100;
    const n = this.categoryStats.length;

    // Build rings (25%, 50%, 75%, 100%)
    this.radarRings = [0.25, 0.5, 0.75, 1.0].map(scale => {
      const pts: string[] = [];
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
        const r = maxR * scale;
        pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      return pts.join(' ');
    });

    // Build axis endpoints and labels
    this.radarPoints = this.categoryStats.map((cat, i) => {
      const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
      const x = cx + maxR * Math.cos(angle);
      const y = cy + maxR * Math.sin(angle);
      const labelR = maxR + 18;
      const labelX = cx + labelR * Math.cos(angle);
      const labelY = cy + labelR * Math.sin(angle) + 3;
      let anchor = 'middle';
      if (Math.cos(angle) > 0.3) anchor = 'start';
      else if (Math.cos(angle) < -0.3) anchor = 'end';
      return { x, y, label: cat.label, labelX, labelY, value: cat.percentage, anchor };
    });

    // Build data polygon
    this.radarDataPoints = this.categoryStats.map((cat, i) => {
      const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
      const r = maxR * (cat.percentage / 100);
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        value: cat.percentage
      };
    });
    this.radarDataPath = this.radarDataPoints.map(p => `${p.x},${p.y}`).join(' ');
  }

  buildHeatmap() {
    if (!this.result) return;

    // Map categories to risk levels based on compliance
    const categoryRisk: { [cat: string]: { likelihood: number; impact: number } } = {
      SERVICE_LEVEL: { likelihood: 1, impact: 1 },
      EXIT_STRATEGY: { likelihood: 0, impact: 2 },
      AUDIT: { likelihood: 1, impact: 1 },
      INCIDENT: { likelihood: 2, impact: 2 },
      DATA: { likelihood: 2, impact: 2 },
      SUBCONTRACTING: { likelihood: 1, impact: 0 },
      RISK: { likelihood: 2, impact: 1 },
      LEGAL: { likelihood: 0, impact: 1 },
      CONTINUITY: { likelihood: 1, impact: 2 }
    };

    // Collect non-compliant categories into cells
    const grid: { [key: string]: string[] } = {};
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        grid[`${r},${c}`] = [];
      }
    }

    for (const qr of this.result.questionResults) {
      if (!qr.compliant) {
        const risk = categoryRisk[qr.category] || { likelihood: 1, impact: 1 };
        const key = `${2 - risk.impact},${risk.likelihood}`;
        if (grid[key] && !grid[key].includes(qr.category)) {
          grid[key].push(qr.category);
        }
      }
    }

    const colors = [
      ['#10b981', '#fbbf24', '#f87171'],
      ['#10b981', '#fbbf24', '#ef4444'],
      ['#fbbf24', '#ef4444', '#dc2626']
    ];

    this.heatmapCells = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const cats = grid[`${r},${c}`];
        this.heatmapCells.push({
          row: r,
          col: c,
          x: 8 + c * 60,
          y: 8 + r * 60,
          color: colors[r][c],
          opacity: cats.length > 0 ? 0.3 + cats.length * 0.2 : 0.08,
          categories: cats,
          count: cats.length
        });
      }
    }
  }

  buildNonCompliantList() {
    if (!this.result) return;
    this.nonCompliantItems = this.result.questionResults
      .filter(qr => !qr.compliant)
      .map(qr => ({
        question: qr.question,
        articleReference: qr.articleReference,
        category: qr.category
      }));
  }

  buildRoadmap() {
    if (!this.result) return;
    const items = this.nonCompliantItems;
    // Split: first 3 are critical (phase 1), rest are important (phase 2)
    this.roadmapPhase1 = items.slice(0, Math.min(3, items.length));
    this.roadmapPhase2 = items.slice(3);
    // Progress = percentage of compliant questions already done
    const total = this.result.totalQuestions;
    const done = this.result.compliantCount;
    this.roadmapPhase1Progress = items.length > 0 ? Math.round((done / total) * 100) : 100;
    this.roadmapPhase2Progress = items.length > 3 ? Math.round(((done + this.roadmapPhase1.length) / total) * 100) : this.roadmapPhase1Progress;
    this.roadmapPhase3Progress = 100;
  }

  getCategoryLabel(category: string): string {
    return CATEGORY_LABELS[category] || category;
  }

  get circleColor(): string {
    switch (this.result?.complianceLevel) {
      case 'GREEN': return '#34d399';
      case 'YELLOW': return '#fbbf24';
      case 'RED': return '#f87171';
      default: return '#64748b';
    }
  }

  get badgeClass(): string {
    const base = 'inline-block px-4 py-1.5 rounded-full text-sm font-bold';
    switch (this.result?.complianceLevel) {
      case 'GREEN': return `${base} bg-emerald-500/15 text-emerald-400 border border-emerald-500/25`;
      case 'YELLOW': return `${base} bg-amber-500/15 text-amber-400 border border-amber-500/25`;
      case 'RED': return `${base} bg-red-500/15 text-red-400 border border-red-500/25`;
      default: return base;
    }
  }

  get badgeLabel(): string {
    switch (this.result?.complianceLevel) {
      case 'GREEN': return 'Vastav';
      case 'YELLOW': return 'Osaliselt vastav';
      case 'RED': return 'Mittevastav';
      default: return '';
    }
  }

  launchConfetti() {
    const colors = ['#34d399', '#22d3ee', '#fbbf24', '#a78bfa', '#f472b6', '#60a5fa'];
    for (let i = 0; i < 60; i++) {
      const el = this.renderer.createElement('div');
      this.renderer.addClass(el, 'confetti-piece');
      this.renderer.setStyle(el, 'left', Math.random() * 100 + 'vw');
      this.renderer.setStyle(el, 'background', colors[Math.floor(Math.random() * colors.length)]);
      this.renderer.setStyle(el, 'animation-delay', Math.random() * 2 + 's');
      this.renderer.setStyle(el, 'animation-duration', (2 + Math.random() * 2) + 's');
      this.renderer.setStyle(el, 'width', (6 + Math.random() * 8) + 'px');
      this.renderer.setStyle(el, 'height', (6 + Math.random() * 8) + 'px');
      this.renderer.setStyle(el, 'border-radius', Math.random() > 0.5 ? '50%' : '2px');
      this.renderer.appendChild(document.body, el);
      setTimeout(() => el.remove(), 5000);
    }
  }

  get scoreTextClass(): string {
    switch (this.result?.complianceLevel) {
      case 'GREEN': return 'text-emerald-400';
      case 'YELLOW': return 'text-amber-400';
      case 'RED': return 'text-red-400';
      default: return 'text-slate-400';
    }
  }
}
