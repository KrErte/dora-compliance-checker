import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';
import { ComplianceAlert, NotificationItem } from '../models';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
            </div>
            {{ lang.t('notifications.title') }}
          </h1>
          <p class="text-slate-400 text-sm mt-1">{{ lang.t('notifications.subtitle') }}</p>
        </div>
        @if (notifications().length > 0) {
          <button (click)="markAllRead()"
                  class="text-sm text-slate-400 hover:text-emerald-400 transition-colors px-4 py-2 rounded-lg border border-slate-700/50 hover:border-emerald-500/30 hover:bg-emerald-500/5">
            {{ lang.t('notifications.mark_all_read') }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="text-center py-24">
          <div class="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-slate-700 border-t-rose-400 animate-spin"></div>
          <p class="text-slate-400 text-sm">{{ lang.t('notifications.loading') }}</p>
        </div>
      }

      @if (!loading()) {
        <!-- Alert Summary Cards -->
        @if (alertCounts().total > 0) {
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-4 text-center">
              <div class="text-3xl font-black text-red-400">{{ alertCounts().critical }}</div>
              <div class="text-xs text-red-400/70 mt-1 font-medium">{{ lang.t('notifications.critical') }}</div>
            </div>
            <div class="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-4 text-center">
              <div class="text-3xl font-black text-amber-400">{{ alertCounts().warning }}</div>
              <div class="text-xs text-amber-400/70 mt-1 font-medium">{{ lang.t('notifications.warnings') }}</div>
            </div>
            <div class="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-4 text-center">
              <div class="text-3xl font-black text-blue-400">{{ alertCounts().info }}</div>
              <div class="text-xs text-blue-400/70 mt-1 font-medium">{{ lang.t('notifications.informational') }}</div>
            </div>
          </div>
        }

        <!-- Tab Switcher -->
        <div class="flex gap-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-1">
          <button (click)="activeTab.set('alerts')"
                  class="flex-1 text-sm font-medium px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
                  [class]="activeTab() === 'alerts' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-700/30'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
            {{ lang.t('notifications.tab_alerts') }}
            @if (alerts().length > 0) {
              <span class="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded-full font-bold">{{ alerts().length }}</span>
            }
          </button>
          <button (click)="activeTab.set('history')"
                  class="flex-1 text-sm font-medium px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
                  [class]="activeTab() === 'history' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-700/30'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ lang.t('notifications.tab_history') }}
            @if (unreadCount() > 0) {
              <span class="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full font-bold">{{ unreadCount() }}</span>
            }
          </button>
        </div>

        <!-- Alerts Tab -->
        @if (activeTab() === 'alerts') {
          @if (alerts().length === 0) {
            <div class="text-center py-16 bg-slate-800/30 border border-slate-700/30 rounded-2xl">
              <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-white mb-1">{{ lang.t('notifications.all_clear') }}</h3>
              <p class="text-sm text-slate-400">{{ lang.t('notifications.no_alerts') }}</p>
            </div>
          }

          @for (alert of alerts(); track alert.alertKey) {
            <div class="bg-slate-800/50 border rounded-xl p-4 hover:bg-slate-800/70 transition-all group"
                 [class]="getAlertBorderClass(alert.severity)">
              <div class="flex items-start gap-4">
                <!-- Severity icon -->
                <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                     [class]="getAlertIconBgClass(alert.severity)">
                  @if (alert.severity === 'CRITICAL') {
                    <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                    </svg>
                  } @else if (alert.severity === 'WARNING') {
                    <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  } @else {
                    <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  }
                </div>
                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-[10px] px-1.5 py-0.5 rounded font-bold"
                          [class]="getSeverityBadgeClass(alert.severity)">
                      {{ alert.severity }}
                    </span>
                    <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 font-medium">
                      {{ getCategoryLabel(alert.category) }}
                    </span>
                  </div>
                  <h3 class="text-sm font-semibold text-white mb-1">{{ alert.title }}</h3>
                  <p class="text-xs text-slate-400 leading-relaxed">{{ alert.message }}</p>
                </div>
                <!-- Action -->
                <a [routerLink]="alert.link"
                   class="flex-shrink-0 text-xs font-medium px-3 py-2 rounded-lg transition-all opacity-70 group-hover:opacity-100"
                   [class]="getAlertActionClass(alert.severity)">
                  {{ lang.t('notifications.view') }}
                  <svg class="w-3 h-3 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </a>
              </div>
            </div>
          }
        }

        <!-- History Tab -->
        @if (activeTab() === 'history') {
          @if (notifications().length === 0) {
            <div class="text-center py-16 bg-slate-800/30 border border-slate-700/30 rounded-2xl">
              <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-700/30 flex items-center justify-center">
                <svg class="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-white mb-1">{{ lang.t('notifications.no_history') }}</h3>
              <p class="text-sm text-slate-400">{{ lang.t('notifications.history_empty') }}</p>
            </div>
          }

          @for (notif of notifications(); track notif.id) {
            <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 transition-all"
                 [class.opacity-50]="notif.read">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                     [class]="getNotifIconBgClass(notif.severity)">
                  <svg class="w-5 h-5" [class]="getNotifIconClass(notif.severity)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    @if (!notif.read) {
                      <div class="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0"></div>
                    }
                    <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 font-medium">
                      {{ notif.type }}
                    </span>
                    <span class="text-[10px] text-slate-600">{{ formatDate(notif.createdAt) }}</span>
                  </div>
                  <h3 class="text-sm font-medium" [class]="notif.read ? 'text-slate-400' : 'text-white'">{{ notif.title }}</h3>
                  <p class="text-xs text-slate-500 mt-0.5">{{ notif.message }}</p>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  @if (notif.link) {
                    <a [routerLink]="notif.link"
                       class="text-xs text-slate-400 hover:text-emerald-400 px-2.5 py-1.5 rounded-lg hover:bg-slate-700/30 transition-all">
                      {{ lang.t('notifications.view') }}
                    </a>
                  }
                  @if (!notif.read) {
                    <button (click)="markRead(notif.id)"
                            class="text-xs text-slate-500 hover:text-white px-2 py-1.5 rounded-lg hover:bg-slate-700/30 transition-all"
                            [title]="lang.t('notifications.mark_read')">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                      </svg>
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class NotificationCenterComponent implements OnInit {
  loading = signal(true);
  alerts = signal<ComplianceAlert[]>([]);
  notifications = signal<NotificationItem[]>([]);
  activeTab = signal<'alerts' | 'history'>('alerts');
  unreadCount = signal(0);
  alertCounts = signal<{ critical: number; warning: number; info: number; total: number }>({ critical: 0, warning: 0, info: 0, total: 0 });

  constructor(private api: ApiService, public lang: LangService) {}

  ngOnInit() {
    this.api.getComplianceAlerts().subscribe({
      next: (a) => {
        this.alerts.set(a);
        const counts = {
          critical: a.filter(x => x.severity === 'CRITICAL').length,
          warning: a.filter(x => x.severity === 'WARNING').length,
          info: a.filter(x => x.severity === 'INFO').length,
          total: a.length
        };
        this.alertCounts.set(counts);
      },
      error: () => {}
    });
    this.api.getNotifications().subscribe({
      next: (n) => {
        this.notifications.set(n);
        this.unreadCount.set(n.filter(x => !x.read).length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  markRead(id: string) {
    this.api.markNotificationRead(id).subscribe(() => {
      this.notifications.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
      this.unreadCount.update(c => Math.max(0, c - 1));
    });
  }

  markAllRead() {
    this.api.markAllNotificationsRead().subscribe(() => {
      this.notifications.update(list => list.map(n => ({ ...n, read: true })));
      this.unreadCount.set(0);
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return diffMins + 'm ago';
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return diffHours + 'h ago';
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return diffDays + 'd ago';
    return d.toLocaleDateString();
  }

  getAlertBorderClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'border-red-500/30';
      case 'WARNING': return 'border-amber-500/20';
      default: return 'border-blue-500/20';
    }
  }

  getAlertIconBgClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/10';
      case 'WARNING': return 'bg-amber-500/10';
      default: return 'bg-blue-500/10';
    }
  }

  getSeverityBadgeClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-400';
      case 'WARNING': return 'bg-amber-500/10 text-amber-400';
      default: return 'bg-blue-500/10 text-blue-400';
    }
  }

  getAlertActionClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-400 hover:bg-red-500/20';
      case 'WARNING': return 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20';
      default: return 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20';
    }
  }

  getNotifIconBgClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/10';
      case 'WARNING': return 'bg-amber-500/10';
      default: return 'bg-slate-700/50';
    }
  }

  getNotifIconClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'text-red-400';
      case 'WARNING': return 'text-amber-400';
      default: return 'text-slate-400';
    }
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      EVIDENCE: 'Evidence Vault',
      REMEDIATION: 'Remediation',
      INCIDENT: 'Incidents',
      THIRD_PARTY: 'Third-Party Risk',
      ASSESSMENT: 'Assessment'
    };
    return labels[category] || category;
  }
}
