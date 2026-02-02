import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';
import { ContractAlert } from '../models';

@Component({
  selector: 'app-guardian-alerts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <a routerLink="/guardian" class="text-sm text-slate-500 hover:text-emerald-400 transition-colors mb-2 inline-block">
            &larr; {{ lang.t('guardian.back') }}
          </a>
          <h1 class="text-2xl font-bold text-white flex items-center gap-3">
            <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            {{ lang.t('guardian.alerts_title') }}
          </h1>
        </div>
        <div class="flex gap-2">
          <button (click)="filter = 'unread'" [class]="filterBtn(filter === 'unread')">
            {{ lang.t('guardian.unread') }} ({{ unreadCount }})
          </button>
          <button (click)="filter = 'all'" [class]="filterBtn(filter === 'all')">
            {{ lang.t('guardian.all_alerts') }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="text-center py-16">
        <div class="w-10 h-10 mx-auto mb-3 rounded-full border-4 border-slate-700 border-t-blue-400 animate-spin"></div>
      </div>

      <!-- Empty -->
      <div *ngIf="!loading && filteredAlerts.length === 0" class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
        <svg class="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        <p class="text-slate-400">{{ lang.t('guardian.alerts_empty') }}</p>
      </div>

      <!-- Alert list -->
      <div *ngIf="!loading && filteredAlerts.length > 0" class="space-y-3">
        <div *ngFor="let alert of filteredAlerts"
             [class]="'bg-slate-800/50 backdrop-blur border rounded-xl p-5 transition-all ' + (alert.read ? 'border-slate-700/50 opacity-70' : 'border-slate-600/50')">
          <div class="flex items-start gap-4">
            <!-- Severity icon -->
            <div [class]="'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ' + severityBg(alert.severity)">
              <svg *ngIf="alert.alertType === 'SCORE_CHANGED'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
              <svg *ngIf="alert.alertType === 'NEW_REGULATION'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
              </svg>
              <svg *ngIf="alert.alertType !== 'SCORE_CHANGED' && alert.alertType !== 'NEW_REGULATION'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="text-white font-semibold text-sm">{{ alert.title }}</h3>
                <span [class]="severityTag(alert.severity)">{{ severityLabel(alert.severity) }}</span>
                <span *ngIf="!alert.read" class="w-2 h-2 rounded-full bg-blue-400"></span>
              </div>
              <p class="text-sm text-slate-400 whitespace-pre-line">{{ alert.message }}</p>
              <div class="flex items-center gap-3 mt-2">
                <span class="text-xs text-slate-500">{{ alert.createdAt | date:'dd.MM.yyyy HH:mm' }}</span>
                <span *ngIf="alert.previousScore != null && alert.newScore != null" class="text-xs">
                  <span class="text-slate-500">{{ alert.previousScore | number:'1.1-1' }}%</span>
                  <span class="text-slate-600 mx-1">&rarr;</span>
                  <span [class]="alert.newScore >= alert.previousScore ? 'text-emerald-400' : 'text-red-400'">
                    {{ alert.newScore | number:'1.1-1' }}%
                  </span>
                </span>
              </div>
            </div>

            <!-- Mark read button -->
            <button *ngIf="!alert.read" (click)="markRead(alert)"
                    class="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/30 hover:bg-slate-600/50 transition-all">
              {{ lang.t('guardian.mark_read') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class GuardianAlertsComponent implements OnInit {
  alerts: ContractAlert[] = [];
  loading = true;
  filter: 'unread' | 'all' = 'unread';

  constructor(public lang: LangService, private api: ApiService) {}

  ngOnInit() {
    this.api.getAlerts().subscribe({
      next: (alerts) => {
        this.alerts = alerts;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get unreadCount(): number {
    return this.alerts.filter(a => !a.read).length;
  }

  get filteredAlerts(): ContractAlert[] {
    if (this.filter === 'unread') return this.alerts.filter(a => !a.read);
    return this.alerts;
  }

  markRead(alert: ContractAlert) {
    this.api.markAlertRead(alert.id).subscribe({
      next: () => {
        alert.read = true;
      }
    });
  }

  filterBtn(active: boolean): string {
    const base = 'px-3 py-1.5 rounded-lg text-xs font-medium transition-all';
    return active
      ? base + ' bg-blue-500/20 text-blue-400 border border-blue-500/30'
      : base + ' bg-slate-700/30 text-slate-400 border border-slate-600/30 hover:text-white';
  }

  severityBg(severity: string): string {
    switch (severity) {
      case 'HIGH': return 'bg-red-500/10 text-red-400';
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-400';
      default: return 'bg-blue-500/10 text-blue-400';
    }
  }

  severityTag(severity: string): string {
    switch (severity) {
      case 'HIGH': return 'px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400';
      case 'MEDIUM': return 'px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-500/10 text-yellow-400';
      default: return 'px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400';
    }
  }

  severityLabel(severity: string): string {
    switch (severity) {
      case 'HIGH': return this.lang.t('guardian.severity_high');
      case 'MEDIUM': return this.lang.t('guardian.severity_medium');
      default: return this.lang.t('guardian.severity_low');
    }
  }
}
