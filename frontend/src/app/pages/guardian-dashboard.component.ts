import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';
import { MonitoredContract } from '../models';

@Component({
  selector: 'app-guardian-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            {{ lang.t('guardian.title') }}
          </h1>
          <p class="text-slate-400 text-sm mt-1">{{ lang.t('guardian.subtitle') }}</p>
        </div>
        <div class="flex gap-2">
          <a routerLink="/guardian/alerts"
             class="px-4 py-2 rounded-xl bg-slate-700/50 border border-slate-600/50 text-slate-300 text-sm hover:bg-slate-600/50 transition-all flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            {{ lang.t('guardian.alerts_title') }}
          </a>
          <a routerLink="/regulatory-updates"
             class="px-4 py-2 rounded-xl bg-slate-700/50 border border-slate-600/50 text-slate-300 text-sm hover:bg-slate-600/50 transition-all flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
            </svg>
            {{ lang.t('guardian.reg_updates') }}
          </a>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="text-center py-16">
        <div class="w-10 h-10 mx-auto mb-3 rounded-full border-4 border-slate-700 border-t-blue-400 animate-spin"></div>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && contracts.length === 0" class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
        <svg class="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
        </svg>
        <p class="text-slate-400 mb-4">{{ lang.t('guardian.empty') }}</p>
        <a routerLink="/contract-analysis"
           class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-sm hover:shadow-lg transition-all">
          {{ lang.t('contract.start_analysis') }}
        </a>
      </div>

      <!-- Contract cards -->
      <div *ngIf="!loading && contracts.length > 0" class="grid gap-4">
        <div *ngFor="let contract of contracts"
             class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-all">
          <div class="flex flex-col md:flex-row md:items-center gap-4">
            <!-- Score circle -->
            <div class="flex-shrink-0">
              <div [class]="'w-16 h-16 rounded-xl flex flex-col items-center justify-center ' + scoreBg(contract.currentLevel)">
                <span [class]="'text-lg font-bold ' + scoreText(contract.currentLevel)">
                  {{ contract.currentScore | number:'1.0-0' }}%
                </span>
                <span class="text-[9px] text-slate-400">{{ lang.t('guardian.score') }}</span>
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="text-white font-semibold truncate">{{ contract.contractName }}</h3>
                <span [class]="statusBadge(contract.monitoringStatus)">
                  {{ statusLabel(contract.monitoringStatus) }}
                </span>
              </div>
              <p class="text-sm text-slate-400">{{ contract.companyName }} &middot; {{ contract.fileName }}</p>
              <p class="text-xs text-slate-500 mt-1">
                {{ lang.t('guardian.last_analysis') }}: {{ contract.lastAnalysisDate | date:'dd.MM.yyyy HH:mm' }}
              </p>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <button *ngIf="contract.monitoringStatus === 'ACTIVE'" (click)="pause(contract)"
                      class="px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 transition-all">
                {{ lang.t('guardian.pause') }}
              </button>
              <button *ngIf="contract.monitoringStatus === 'PAUSED'" (click)="resume(contract)"
                      class="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
                {{ lang.t('guardian.resume') }}
              </button>
              <button (click)="reanalyze(contract)"
                      [disabled]="contract.id === reanalyzingId"
                      class="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all disabled:opacity-50">
                {{ contract.id === reanalyzingId ? lang.t('guardian.reanalyzing') : lang.t('guardian.reanalyze') }}
              </button>
              <a *ngIf="contract.lastAnalysisId" [routerLink]="['/contract-results', contract.lastAnalysisId]"
                 class="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/30 hover:bg-slate-600/50 transition-all">
                {{ lang.t('guardian.view_analysis') }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class GuardianDashboardComponent implements OnInit {
  contracts: MonitoredContract[] = [];
  loading = true;
  reanalyzingId = '';

  constructor(public lang: LangService, private api: ApiService) {}

  ngOnInit() {
    this.loadContracts();
  }

  loadContracts() {
    this.api.getMonitoredContracts().subscribe({
      next: (contracts) => {
        this.contracts = contracts;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  pause(contract: MonitoredContract) {
    this.api.pauseMonitoring(contract.id).subscribe({
      next: (updated) => {
        const idx = this.contracts.findIndex(c => c.id === contract.id);
        if (idx >= 0) this.contracts[idx] = updated;
      }
    });
  }

  resume(contract: MonitoredContract) {
    this.api.resumeMonitoring(contract.id).subscribe({
      next: (updated) => {
        const idx = this.contracts.findIndex(c => c.id === contract.id);
        if (idx >= 0) this.contracts[idx] = updated;
      }
    });
  }

  reanalyze(contract: MonitoredContract) {
    this.reanalyzingId = contract.id;
    this.api.reanalyzeContract(contract.id).subscribe({
      next: (updated) => {
        const idx = this.contracts.findIndex(c => c.id === contract.id);
        if (idx >= 0) this.contracts[idx] = updated;
        this.reanalyzingId = '';
      },
      error: () => {
        this.reanalyzingId = '';
      }
    });
  }

  scoreBg(level: string): string {
    switch (level) {
      case 'GREEN': return 'bg-emerald-500/10 border border-emerald-500/20';
      case 'YELLOW': return 'bg-yellow-500/10 border border-yellow-500/20';
      default: return 'bg-red-500/10 border border-red-500/20';
    }
  }

  scoreText(level: string): string {
    switch (level) {
      case 'GREEN': return 'text-emerald-400';
      case 'YELLOW': return 'text-yellow-400';
      default: return 'text-red-400';
    }
  }

  statusBadge(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400';
      case 'PAUSED': return 'px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-500/20 text-yellow-400';
      default: return 'px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-500/20 text-slate-400';
    }
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'ACTIVE': return this.lang.t('guardian.status_active');
      case 'PAUSED': return this.lang.t('guardian.status_paused');
      default: return this.lang.t('guardian.status_archived');
    }
  }
}
