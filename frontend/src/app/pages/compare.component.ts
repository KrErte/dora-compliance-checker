import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';
import { AssessmentResult, QuestionResult, CATEGORY_LABELS } from '../models';

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

interface CompanyData {
  entry: HistoryEntry;
  result: AssessmentResult;
  categoryStats: Map<string, { compliant: number; total: number; percentage: number }>;
  color: string;
  colorClass: string;
  fillColor: string;
}

interface GapItem {
  companyName: string;
  color: string;
  gaps: {
    questionId: number;
    question: string;
    category: string;
    articleReference: string;
    recommendation: string;
    compliantIn: string[];
  }[];
}

@Component({
  selector: 'app-compare',
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto">

      <!-- Header -->
      <div class="flex items-center justify-between mb-8 animate-fade-in-up">
        <div>
          <h1 class="text-2xl font-bold">
            <span class="gradient-text">V&#245;rdlus</span>
          </h1>
          <p class="text-slate-500 text-sm mt-1">V&#245;rdle ettev&#245;tete DORA vastavust k&#245;rvuti</p>
        </div>
        <a routerLink="/history"
           class="bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 font-semibold px-5 py-2 rounded-lg
                  transition-all duration-300 border border-slate-600/50 hover:border-slate-500/50 flex items-center gap-2 text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Ajalugu
        </a>
      </div>

      <!-- Empty state -->
      <div *ngIf="history.length === 0" class="text-center py-16 animate-scale-in">
        <div class="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        </div>
        <h2 class="text-lg font-semibold text-slate-300 mb-2">V&#245;rdlusandmed puuduvad</h2>
        <p class="text-slate-500 mb-6">V&#245;rdlemiseks on vaja v&#228;hemalt kahte l&#228;bitud hindamist.</p>
        <a routerLink="/assessment"
           class="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900
                  font-semibold px-6 py-2.5 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25">
          Alusta hindamist
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </a>
      </div>

      <!-- Selection Panel -->
      <div *ngIf="history.length > 0 && !showComparison">
        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 mb-6 animate-fade-in-up delay-100">
          <h2 class="text-sm font-semibold text-slate-300 mb-1 flex items-center gap-2">
            <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
            Vali hindamised v&#245;rdluseks
          </h2>
          <p class="text-xs text-slate-500 mb-4">Vali 2&#8211;4 hindamist, mida soovid k&#245;rvuti v&#245;rrelda</p>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div *ngFor="let entry of history; let i = index"
                 (click)="toggleSelection(entry)"
                 class="relative cursor-pointer rounded-xl p-4 border transition-all duration-300 animate-fade-in-up"
                 [class]="isSelected(entry)
                   ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                   : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50 hover:bg-slate-800/70'"
                 [style.animation-delay]="(i * 60 + 200) + 'ms'">

              <!-- Selection indicator -->
              <div class="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                   [class]="isSelected(entry)
                     ? 'bg-emerald-500 text-slate-900'
                     : 'bg-slate-700/50 text-slate-500 border border-slate-600/50'">
                <span *ngIf="isSelected(entry)">&#10003;</span>
                <span *ngIf="!isSelected(entry)">{{ getSelectionIndex(entry) }}</span>
              </div>

              <div class="flex items-center gap-3">
                <!-- Score circle -->
                <div class="relative w-12 h-12 shrink-0">
                  <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#334155" stroke-width="6"/>
                    <circle cx="50" cy="50" r="42" fill="none"
                            [attr.stroke]="getLevelColor(entry.complianceLevel)"
                            stroke-width="6"
                            stroke-linecap="round"
                            stroke-dasharray="263.89"
                            [attr.stroke-dashoffset]="263.89 - (263.89 * entry.scorePercentage / 100)"/>
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <span class="text-xs font-bold" [style.color]="getLevelColor(entry.complianceLevel)">
                      {{ entry.scorePercentage | number:'1.0-0' }}
                    </span>
                  </div>
                </div>

                <div class="flex-1 min-w-0">
                  <h3 class="text-sm font-medium text-slate-200 truncate">{{ entry.companyName }}</h3>
                  <p class="text-xs text-slate-500 truncate">{{ entry.contractName }}</p>
                  <p class="text-xs text-slate-600 mt-0.5">{{ entry.assessmentDate | date:'dd.MM.yyyy' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Compare button -->
        <div class="text-center animate-fade-in-up delay-300">
          <button (click)="startComparison()"
                  [disabled]="2 > selectedIds.length"
                  class="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all duration-300 text-sm"
                  [class]="selectedIds.length >= 2
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-900 hover:shadow-lg hover:shadow-emerald-500/25 cursor-pointer'
                    : 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-700/50'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            V&#245;rdle ({{ selectedIds.length }}/4 valitud)
          </button>
          <p *ngIf="2 > selectedIds.length" class="text-xs text-slate-600 mt-2">Vali v&#228;hemalt 2 hindamist</p>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="text-center py-16 animate-fade-in">
        <div class="inline-block w-10 h-10 border-4 border-slate-700 border-t-emerald-400 rounded-full animate-spin"></div>
        <p class="text-slate-400 mt-4">Andmete laadimine...</p>
      </div>

      <!-- Comparison View -->
      <div *ngIf="showComparison && !loading">

        <!-- Back button -->
        <div class="mb-6 animate-fade-in-up">
          <button (click)="resetComparison()"
                  class="text-sm text-slate-400 hover:text-emerald-400 transition-colors duration-200 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Tagasi valikule
          </button>
        </div>

        <!-- ========================================= -->
        <!-- a. Score Comparison Bars -->
        <!-- ========================================= -->
        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 mb-6 animate-fade-in-up delay-100">
          <h2 class="text-sm font-semibold text-slate-300 mb-5 flex items-center gap-2">
            <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
            &#220;ldskooride v&#245;rdlus
          </h2>

          <div class="space-y-4">
            <div *ngFor="let cd of companyData; let i = index"
                 class="animate-fade-in-up"
                 [style.animation-delay]="(i * 120 + 200) + 'ms'">
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full" [style.background]="cd.color"></div>
                  <span class="text-sm font-medium text-slate-200">{{ cd.entry.companyName }}</span>
                  <span class="text-xs text-slate-500">{{ cd.entry.contractName }}</span>
                </div>
                <span class="text-sm font-bold" [style.color]="cd.color">
                  {{ cd.entry.scorePercentage | number:'1.0-0' }}%
                </span>
              </div>
              <div class="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                <div class="h-full rounded-full transition-all duration-1000 ease-out"
                     [style.width.%]="cd.entry.scorePercentage"
                     [style.background]="'linear-gradient(90deg, ' + cd.color + '99, ' + cd.color + ')'">
                </div>
              </div>
              <div class="flex justify-between mt-1">
                <span class="text-xs text-slate-600">{{ cd.entry.compliantCount }}/{{ cd.entry.totalQuestions }} vastav</span>
                <span class="text-xs px-2 py-0.5 rounded-full"
                      [class]="getLevelBadgeClass(cd.entry.complianceLevel)">
                  {{ getLevelLabel(cd.entry.complianceLevel) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================= -->
        <!-- b. Multi-layer Radar Chart -->
        <!-- ========================================= -->
        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 mb-6 animate-fade-in-up delay-200">
          <h2 class="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>
            </svg>
            Vastavusprofiilide v&#245;rdlus
          </h2>

          <div class="flex justify-center">
            <svg viewBox="0 0 340 340" class="w-full max-w-[400px]">
              <!-- Background rings -->
              <polygon *ngFor="let ring of radarRings"
                       [attr.points]="ring"
                       fill="none" stroke="#334155" stroke-width="0.5"/>
              <!-- Axis lines -->
              <line *ngFor="let p of radarAxisPoints"
                    x1="170" y1="170"
                    [attr.x2]="p.x" [attr.y2]="p.y"
                    stroke="#334155" stroke-width="0.5"/>
              <!-- Data layers -->
              <g *ngFor="let layer of radarLayers; let li = index">
                <polygon [attr.points]="layer.path"
                         [attr.fill]="layer.color"
                         fill-opacity="0.12"
                         [attr.stroke]="layer.color"
                         stroke-width="2"
                         class="animate-scale-in"
                         [style.animation-delay]="(li * 200 + 400) + 'ms'"/>
                <circle *ngFor="let pt of layer.points; let pi = index"
                        [attr.cx]="pt.x" [attr.cy]="pt.y" r="3.5"
                        [attr.fill]="layer.color"
                        stroke="#1e293b" stroke-width="1.5"
                        class="animate-scale-in"
                        [style.animation-delay]="(li * 200 + pi * 50 + 500) + 'ms'"/>
              </g>
              <!-- Labels -->
              <text *ngFor="let p of radarAxisPoints; let i = index"
                    [attr.x]="p.labelX" [attr.y]="p.labelY"
                    [attr.text-anchor]="p.anchor"
                    class="fill-slate-400 animate-fade-in"
                    [style.animation-delay]="(i * 40 + 300) + 'ms'"
                    font-size="7.5">{{ p.label }}</text>
            </svg>
          </div>

          <!-- Legend -->
          <div class="flex flex-wrap justify-center gap-4 mt-4">
            <div *ngFor="let cd of companyData; let i = index"
                 class="flex items-center gap-2 animate-fade-in"
                 [style.animation-delay]="(i * 100 + 600) + 'ms'">
              <div class="w-3 h-3 rounded-full" [style.background]="cd.color"></div>
              <span class="text-xs text-slate-400">{{ cd.entry.companyName }}</span>
            </div>
          </div>
        </div>

        <!-- ========================================= -->
        <!-- c. Category Comparison Table -->
        <!-- ========================================= -->
        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 mb-6 animate-fade-in-up delay-300">
          <h2 class="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            Kategooriate v&#245;rdlus
          </h2>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <caption class="sr-only">Hindamiste võrdlus kategooriate kaupa</caption>
              <thead>
                <tr class="border-b border-slate-700/50">
                  <th class="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Kategooria</th>
                  <th *ngFor="let cd of companyData"
                      class="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider min-w-[120px]"
                      [style.color]="cd.color">
                    {{ cd.entry.companyName }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let cat of allCategories; let ri = index"
                    class="border-b border-slate-700/30 transition-colors duration-200"
                    [ngClass]="{'bg-red-500/5': isCategoryDiverging(cat)}">
                  <td class="py-3 px-3">
                    <div class="flex items-center gap-2">
                      <span class="text-slate-300 text-xs font-medium">{{ getCategoryLabel(cat) }}</span>
                      <span *ngIf="isCategoryDiverging(cat)"
                            class="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
                            title="Oluline erinevus"></span>
                    </div>
                  </td>
                  <td *ngFor="let cd of companyData" class="py-3 px-3 text-center">
                    <ng-container *ngIf="getCategoryStat(cd, cat) as stat">
                      <span class="text-xs font-medium"
                            [class]="stat.compliant === stat.total ? 'text-emerald-400' : (stat.compliant === 0 ? 'text-red-400' : 'text-amber-400')">
                        {{ stat.compliant }}/{{ stat.total }}
                      </span>
                      <div class="w-full bg-slate-700/50 rounded-full h-1.5 mt-1.5">
                        <div class="h-full rounded-full transition-all duration-700"
                             [class]="stat.compliant === stat.total ? 'bg-emerald-500' : (stat.compliant === 0 ? 'bg-red-500' : 'bg-amber-500')"
                             [style.width.%]="stat.total > 0 ? (stat.compliant / stat.total) * 100 : 0">
                        </div>
                      </div>
                    </ng-container>
                    <span *ngIf="!getCategoryStat(cd, cat)" class="text-xs text-slate-600">&#8212;</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div *ngIf="divergingCount > 0" class="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
            {{ divergingCount }} kategooria{{ divergingCount > 1 ? 't' : '' }} olulise erinevusega (&#8805;30% vahe)
          </div>
        </div>

        <!-- ========================================= -->
        <!-- d. Gap Analysis -->
        <!-- ========================================= -->
        <div class="bg-gradient-to-br from-violet-900/10 to-slate-800/50 backdrop-blur border border-violet-700/20 rounded-xl p-6 mb-8 animate-fade-in-up delay-400">
          <h2 class="text-sm font-semibold text-violet-300 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
            L&#252;hianal&#252;&#252;s &#8211; mida teised teevad paremini
          </h2>

          <div *ngIf="gapAnalysis.length === 0" class="text-center py-8">
            <p class="text-slate-500 text-sm">K&#245;ik ettev&#245;tted on samal tasemel &#8211; olulisi erinevusi ei leitud.</p>
          </div>

          <div *ngFor="let gap of gapAnalysis; let gi = index" class="mb-6 last:mb-0">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-3 h-3 rounded-full" [style.background]="gap.color"></div>
              <h3 class="text-sm font-semibold text-slate-200">{{ gap.companyName }}</h3>
              <span class="text-xs text-slate-500">&#8211; {{ gap.gaps.length }} puudust, mis teistel on t&#228;idetud</span>
            </div>

            <div class="space-y-2 ml-5">
              <div *ngFor="let item of gap.gaps; let ii = index"
                   class="bg-slate-800/60 rounded-lg p-3 border border-slate-700/30 animate-slide-in-right"
                   [style.animation-delay]="(gi * 200 + ii * 80 + 500) + 'ms'">
                <div class="flex items-start gap-2">
                  <span class="mt-0.5 w-5 h-5 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center text-xs shrink-0 border border-red-500/20">&#10007;</span>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs text-slate-200">{{ item.question }}</p>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="text-xs text-slate-600">{{ item.articleReference }}</span>
                      <span class="text-xs px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-500">{{ getCategoryLabel(item.category) }}</span>
                    </div>
                    <div class="mt-2 flex items-center gap-1 flex-wrap">
                      <span class="text-xs text-emerald-500/70">T&#228;idetud:</span>
                      <span *ngFor="let name of item.compliantIn"
                            class="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {{ name }}
                      </span>
                    </div>
                    <div *ngIf="item.recommendation" class="mt-2 bg-gradient-to-r from-amber-500/5 to-transparent rounded p-2 border-l-2 border-amber-500/50">
                      <p class="text-xs text-slate-400"><span class="text-amber-400 font-medium">Soovitus:</span> {{ item.recommendation }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap justify-center gap-3 mt-10 mb-8 animate-fade-in-up delay-500">
          <button (click)="resetComparison()"
                  class="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400
                         text-slate-900 font-semibold px-6 py-2.5 rounded-lg transition-all duration-300
                         hover:shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2 text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Uus v&#245;rdlus
          </button>
          <a routerLink="/assessment"
             class="bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 font-semibold px-6 py-2.5 rounded-lg
                    transition-all duration-300 border border-slate-600/50 hover:border-slate-500/50 flex items-center gap-2 text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Uus hindamine
          </a>
        </div>
      </div>
    </div>
  `
})
export class CompareComponent implements OnInit {
  history: HistoryEntry[] = [];
  selectedIds: string[] = [];
  companyData: CompanyData[] = [];
  showComparison = false;
  loading = false;

  // Radar chart data
  radarRings: string[] = [];
  radarAxisPoints: { x: number; y: number; labelX: number; labelY: number; label: string; anchor: string }[] = [];
  radarLayers: { color: string; path: string; points: { x: number; y: number }[] }[] = [];

  // Category table data
  allCategories: string[] = [];
  divergingCount = 0;

  // Gap analysis
  gapAnalysis: GapItem[] = [];

  // Color palette for companies
  private readonly companyColors = ['#34d399', '#22d3ee', '#a78bfa', '#fbbf24'];
  private readonly companyColorClasses = ['text-emerald-400', 'text-cyan-400', 'text-violet-400', 'text-amber-400'];
  private readonly companyFillColors = ['#34d399', '#22d3ee', '#a78bfa', '#fbbf24'];

  constructor(private api: ApiService, public lang: LangService) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.history = JSON.parse(localStorage.getItem('dora_history') || '[]');
  }

  toggleSelection(entry: HistoryEntry) {
    const idx = this.selectedIds.indexOf(entry.id);
    if (idx >= 0) {
      this.selectedIds.splice(idx, 1);
    } else if (this.selectedIds.length < 4) {
      this.selectedIds.push(entry.id);
    }
  }

  isSelected(entry: HistoryEntry): boolean {
    return this.selectedIds.includes(entry.id);
  }

  getSelectionIndex(entry: HistoryEntry): string {
    const idx = this.selectedIds.indexOf(entry.id);
    return idx >= 0 ? String(idx + 1) : '';
  }

  startComparison() {
    if (this.selectedIds.length < 2) return;
    this.loading = true;
    this.showComparison = true;

    const requests = this.selectedIds.map(id => this.api.getAssessment(id));
    forkJoin(requests).subscribe({
      next: (results: AssessmentResult[]) => {
        this.companyData = results.map((result, i) => {
          const entry = this.history.find(h => h.id === result.id)!;
          const categoryStats = this.buildCategoryStats(result);
          return {
            entry,
            result,
            categoryStats,
            color: this.companyColors[i % this.companyColors.length],
            colorClass: this.companyColorClasses[i % this.companyColorClasses.length],
            fillColor: this.companyFillColors[i % this.companyFillColors.length]
          };
        });

        this.buildAllCategories();
        this.buildRadarChart();
        this.buildGapAnalysis();
        this.computeDivergingCount();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showComparison = false;
      }
    });
  }

  resetComparison() {
    this.showComparison = false;
    this.companyData = [];
    this.selectedIds = [];
    this.radarRings = [];
    this.radarAxisPoints = [];
    this.radarLayers = [];
    this.allCategories = [];
    this.gapAnalysis = [];
    this.divergingCount = 0;
  }

  // --------------------------------------------------
  // Build category stats from an assessment result
  // --------------------------------------------------
  private buildCategoryStats(result: AssessmentResult): Map<string, { compliant: number; total: number; percentage: number }> {
    const map = new Map<string, { compliant: number; total: number; percentage: number }>();
    for (const qr of result.questionResults) {
      if (!map.has(qr.category)) {
        map.set(qr.category, { compliant: 0, total: 0, percentage: 0 });
      }
      const stat = map.get(qr.category)!;
      stat.total++;
      if (qr.compliant) stat.compliant++;
    }
    map.forEach(stat => {
      stat.percentage = stat.total > 0 ? (stat.compliant / stat.total) * 100 : 0;
    });
    return map;
  }

  // --------------------------------------------------
  // Build unified category list
  // --------------------------------------------------
  private buildAllCategories() {
    const catSet = new Set<string>();
    for (const cd of this.companyData) {
      cd.categoryStats.forEach((_, key) => catSet.add(key));
    }
    // Use CATEGORY_LABELS key order
    const labelKeys = Object.keys(CATEGORY_LABELS);
    this.allCategories = labelKeys.filter(k => catSet.has(k));
    // Add any remaining that weren't in CATEGORY_LABELS
    catSet.forEach(k => {
      if (!this.allCategories.includes(k)) this.allCategories.push(k);
    });
  }

  // --------------------------------------------------
  // Radar chart with multiple layers
  // --------------------------------------------------
  private buildRadarChart() {
    if (this.allCategories.length === 0) return;

    const cx = 170, cy = 170, maxR = 120;
    const n = this.allCategories.length;

    // Build rings
    this.radarRings = [0.25, 0.5, 0.75, 1.0].map(scale => {
      const pts: string[] = [];
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
        const r = maxR * scale;
        pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      return pts.join(' ');
    });

    // Build axis points and labels
    this.radarAxisPoints = this.allCategories.map((cat, i) => {
      const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
      const x = cx + maxR * Math.cos(angle);
      const y = cy + maxR * Math.sin(angle);
      const labelR = maxR + 20;
      const labelX = cx + labelR * Math.cos(angle);
      const labelY = cy + labelR * Math.sin(angle) + 3;
      let anchor = 'middle';
      if (Math.cos(angle) > 0.3) anchor = 'start';
      else if (Math.cos(angle) < -0.3) anchor = 'end';
      return { x, y, labelX, labelY, label: this.getCategoryLabel(cat), anchor };
    });

    // Build data layers for each company
    this.radarLayers = this.companyData.map((cd) => {
      const points = this.allCategories.map((cat, i) => {
        const stat = cd.categoryStats.get(cat);
        const pct = stat ? stat.percentage : 0;
        const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
        const r = maxR * (pct / 100);
        return {
          x: cx + r * Math.cos(angle),
          y: cy + r * Math.sin(angle)
        };
      });
      return {
        color: cd.color,
        path: points.map(p => `${p.x},${p.y}`).join(' '),
        points
      };
    });
  }

  // --------------------------------------------------
  // Gap Analysis
  // --------------------------------------------------
  private buildGapAnalysis() {
    this.gapAnalysis = [];

    for (const cd of this.companyData) {
      const otherCompanies = this.companyData.filter(o => o.entry.id !== cd.entry.id);
      const gaps: GapItem['gaps'] = [];

      for (const qr of cd.result.questionResults) {
        if (qr.compliant) continue;

        // Check if any other company has this question compliant
        const compliantIn: string[] = [];
        for (const other of otherCompanies) {
          const otherQr = other.result.questionResults.find(oq => oq.questionId === qr.questionId);
          if (otherQr && otherQr.compliant) {
            compliantIn.push(other.entry.companyName);
          }
        }

        if (compliantIn.length > 0) {
          gaps.push({
            questionId: qr.questionId,
            question: qr.question,
            category: qr.category,
            articleReference: qr.articleReference,
            recommendation: qr.recommendation,
            compliantIn
          });
        }
      }

      if (gaps.length > 0) {
        this.gapAnalysis.push({
          companyName: cd.entry.companyName,
          color: cd.color,
          gaps
        });
      }
    }
  }

  // --------------------------------------------------
  // Category table helpers
  // --------------------------------------------------
  getCategoryStat(cd: CompanyData, category: string): { compliant: number; total: number; percentage: number } | null {
    return cd.categoryStats.get(category) || null;
  }

  isCategoryDiverging(category: string): boolean {
    const percentages: number[] = [];
    for (const cd of this.companyData) {
      const stat = cd.categoryStats.get(category);
      if (stat) {
        percentages.push(stat.percentage);
      }
    }
    if (percentages.length < 2) return false;
    const max = Math.max(...percentages);
    const min = Math.min(...percentages);
    return (max - min) >= 30;
  }

  private computeDivergingCount() {
    this.divergingCount = this.allCategories.filter(cat => this.isCategoryDiverging(cat)).length;
  }

  getCategoryLabel(category: string): string {
    const label = CATEGORY_LABELS[category];
    if (!label) return category;
    return this.lang.currentLang === 'et' ? label.et : label.en;
  }

  // --------------------------------------------------
  // Utility helpers
  // --------------------------------------------------
  getLevelColor(level: string): string {
    switch (level) {
      case 'GREEN': return '#34d399';
      case 'YELLOW': return '#fbbf24';
      case 'RED': return '#f87171';
      default: return '#64748b';
    }
  }

  getLevelBadgeClass(level: string): string {
    const base = 'text-xs px-2 py-0.5 rounded-full font-medium';
    switch (level) {
      case 'GREEN': return `${base} bg-emerald-500/15 text-emerald-400 border border-emerald-500/20`;
      case 'YELLOW': return `${base} bg-amber-500/15 text-amber-400 border border-amber-500/20`;
      case 'RED': return `${base} bg-red-500/15 text-red-400 border border-red-500/20`;
      default: return base;
    }
  }

  getLevelLabel(level: string): string {
    switch (level) {
      case 'GREEN': return 'Vastav';
      case 'YELLOW': return 'Osaliselt';
      case 'RED': return 'Mittevastav';
      default: return '';
    }
  }
}
