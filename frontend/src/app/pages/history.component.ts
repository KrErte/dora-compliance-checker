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

@Component({
  selector: 'app-history',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center justify-between mb-8 animate-fade-in-up">
        <div>
          <h1 class="text-2xl font-bold">
            <span class="gradient-text">Hindamiste ajalugu</span>
          </h1>
          <p class="text-slate-500 text-sm mt-1">{{ history.length }} hindamist kokku</p>
        </div>
        <div class="flex gap-2">
          <a routerLink="/assessment"
             class="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400
                    text-slate-900 font-semibold px-5 py-2 rounded-lg transition-all duration-300
                    hover:shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2 text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Uus hindamine
          </a>
        </div>
      </div>

      <!-- Stats overview -->
      <div *ngIf="history.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4 animate-fade-in-up delay-100">
          <p class="text-xs text-slate-500 mb-1">Keskmine skoor</p>
          <span class="text-2xl font-bold text-emerald-400">{{ avgScore | number:'1.0-0' }}%</span>
        </div>
        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4 animate-fade-in-up delay-200">
          <p class="text-xs text-slate-500 mb-1">Vastavad</p>
          <span class="text-2xl font-bold text-emerald-400">{{ greenCount }}</span>
        </div>
        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4 animate-fade-in-up delay-300">
          <p class="text-xs text-slate-500 mb-1">Osaliselt</p>
          <span class="text-2xl font-bold text-amber-400">{{ yellowCount }}</span>
        </div>
        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4 animate-fade-in-up delay-400">
          <p class="text-xs text-slate-500 mb-1">Mittevastav</p>
          <span class="text-2xl font-bold text-red-400">{{ redCount }}</span>
        </div>
      </div>

      <!-- Trend chart -->
      <div *ngIf="history.length >= 2" class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 mb-8 animate-fade-in-up delay-300">
        <h2 class="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
          </svg>
          Skoori trend
        </h2>
        <div class="relative h-32">
          <svg class="w-full h-full" [attr.viewBox]="'0 0 ' + chartWidth + ' 130'" preserveAspectRatio="none">
            <!-- Grid lines -->
            <line x1="0" y1="32.5" [attr.x2]="chartWidth" y2="32.5" stroke="#334155" stroke-width="0.5" stroke-dasharray="4"/>
            <line x1="0" y1="65" [attr.x2]="chartWidth" y2="65" stroke="#334155" stroke-width="0.5" stroke-dasharray="4"/>
            <line x1="0" y1="97.5" [attr.x2]="chartWidth" y2="97.5" stroke="#334155" stroke-width="0.5" stroke-dasharray="4"/>
            <!-- Area fill -->
            <path [attr.d]="areaPath" fill="url(#gradient)" opacity="0.3"/>
            <!-- Line -->
            <path [attr.d]="linePath" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="animate-sparkline"/>
            <!-- Dots -->
            <circle *ngFor="let point of chartPoints; let i = index"
                    [attr.cx]="point.x" [attr.cy]="point.y" r="4"
                    [attr.fill]="point.color" stroke="#1e293b" stroke-width="2"
                    class="animate-scale-in" [style.animation-delay]="(i * 100 + 500) + 'ms'"/>
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#34d399" stop-opacity="0.4"/>
                <stop offset="100%" stop-color="#34d399" stop-opacity="0"/>
              </linearGradient>
            </defs>
          </svg>
          <!-- Labels -->
          <div class="absolute top-0 right-0 text-xs text-slate-600">100%</div>
          <div class="absolute bottom-0 right-0 text-xs text-slate-600">0%</div>
        </div>
      </div>

      <!-- Empty state -->
      <div *ngIf="history.length === 0" class="text-center py-16 animate-scale-in">
        <div class="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h2 class="text-lg font-semibold text-slate-300 mb-2">Ajalugu on t\u00fchi</h2>
        <p class="text-slate-500 mb-6">Te pole veel \u00fchtegi hindamist l\u00e4bi viinud.</p>
        <a routerLink="/assessment"
           class="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900
                  font-semibold px-6 py-2.5 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25">
          Alusta esimest hindamist
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </a>
      </div>

      <!-- History list -->
      <div *ngFor="let entry of history; let i = index"
           class="bg-slate-800/50 backdrop-blur rounded-xl p-5 mb-3 border border-slate-700/50 card-hover animate-slide-in-right"
           [style.animation-delay]="(i * 60 + 300) + 'ms'">
        <a [routerLink]="['/results', entry.id]" class="flex items-center gap-4">
          <!-- Score circle -->
          <div class="relative w-14 h-14 shrink-0">
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
              <span class="text-sm font-bold" [style.color]="getLevelColor(entry.complianceLevel)">
                {{ entry.scorePercentage | number:'1.0-0' }}
              </span>
            </div>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <h3 class="text-slate-200 font-medium truncate">{{ entry.companyName }}</h3>
              <span [class]="getBadgeClass(entry.complianceLevel)">
                {{ getBadgeLabel(entry.complianceLevel) }}
              </span>
            </div>
            <p class="text-sm text-slate-500 truncate">{{ entry.contractName }}</p>
            <p class="text-xs text-slate-600 mt-1">{{ entry.assessmentDate | date:'dd.MM.yyyy HH:mm' }}</p>
          </div>

          <!-- Arrow -->
          <svg class="w-5 h-5 text-slate-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </a>
      </div>

      <!-- Clear history -->
      <div *ngIf="history.length > 0" class="text-center mt-8 animate-fade-in delay-500">
        <button (click)="clearHistory()"
                class="text-xs text-slate-600 hover:text-red-400 transition-colors duration-200">
          Kustuta ajalugu
        </button>
      </div>
    </div>
  `
})
export class HistoryComponent implements OnInit {
  history: HistoryEntry[] = [];
  chartPoints: { x: number; y: number; color: string }[] = [];
  linePath = '';
  areaPath = '';
  chartWidth = 600;

  ngOnInit() {
    this.loadHistory();
    this.buildChart();
  }

  loadHistory() {
    this.history = JSON.parse(localStorage.getItem('dora_history') || '[]');
  }

  get avgScore(): number {
    if (this.history.length === 0) return 0;
    return this.history.reduce((sum, h) => sum + h.scorePercentage, 0) / this.history.length;
  }

  get greenCount(): number { return this.history.filter(h => h.complianceLevel === 'GREEN').length; }
  get yellowCount(): number { return this.history.filter(h => h.complianceLevel === 'YELLOW').length; }
  get redCount(): number { return this.history.filter(h => h.complianceLevel === 'RED').length; }

  buildChart() {
    const entries = [...this.history].reverse().slice(-10);
    if (entries.length < 2) return;

    const padding = 20;
    const w = this.chartWidth - padding * 2;
    const h = 110;

    this.chartPoints = entries.map((e, i) => ({
      x: padding + (i / (entries.length - 1)) * w,
      y: 10 + (1 - e.scorePercentage / 100) * h,
      color: this.getLevelColor(e.complianceLevel)
    }));

    this.linePath = this.chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const lastX = this.chartPoints[this.chartPoints.length - 1].x;
    const firstX = this.chartPoints[0].x;
    this.areaPath = `${this.linePath} L${lastX},130 L${firstX},130 Z`;
  }

  getLevelColor(level: string): string {
    switch (level) {
      case 'GREEN': return '#34d399';
      case 'YELLOW': return '#fbbf24';
      case 'RED': return '#f87171';
      default: return '#64748b';
    }
  }

  getBadgeClass(level: string): string {
    const base = 'text-xs px-2 py-0.5 rounded-full font-medium shrink-0';
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

  clearHistory() {
    localStorage.removeItem('dora_history');
    this.history = [];
    this.chartPoints = [];
    this.linePath = '';
    this.areaPath = '';
  }
}
