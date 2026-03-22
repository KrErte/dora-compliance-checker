import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';
import { UserAlert, AlertDetail } from '../models';

@Component({
  selector: 'app-regulatory-alert-feed',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">{{ lang.t('alerts.title') }}</h1>
          <p class="text-sm text-slate-400 mt-1">{{ lang.t('alerts.subtitle') }}</p>
        </div>
        <div class="flex items-center gap-3">
          @if (alerts().length > 0 && unreadCount() > 0) {
            <button (click)="markAllRead()"
                    class="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
              {{ lang.t('alerts.mark_all_read') }}
            </button>
          }
          <a routerLink="/alert-profile"
             class="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors">
            {{ lang.t('alerts.edit_profile') }}
          </a>
        </div>
      </div>

      <!-- Filters -->
      @if (alerts().length > 0) {
        <div class="flex flex-wrap gap-2">
          <button (click)="filterSeverity.set('')"
                  [class]="!filterSeverity() ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'"
                  class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors">
            {{ lang.t('alerts.filter_all') }} ({{ alerts().length }})
          </button>
          @for (sev of severities; track sev) {
            @if (countBySeverity(sev) > 0) {
              <button (click)="filterSeverity.set(sev)"
                      [class]="filterSeverity() === sev ? severityActiveClass(sev) : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'"
                      class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors">
                {{ sev }} ({{ countBySeverity(sev) }})
              </button>
            }
          }
          <div class="w-px bg-slate-200 mx-1"></div>
          <button (click)="filterRead.set('')"
                  [class]="!filterRead() ? 'bg-slate-600/30 text-slate-600 border-slate-500/30' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'"
                  class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors">
            {{ lang.t('alerts.filter_all_status') }}
          </button>
          <button (click)="filterRead.set('unread')"
                  [class]="filterRead() === 'unread' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'"
                  class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors">
            {{ lang.t('alerts.unread') }} ({{ unreadCount() }})
          </button>
          <button (click)="filterRead.set('read')"
                  [class]="filterRead() === 'read' ? 'bg-slate-500/20 text-slate-600 border-slate-500/30' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'"
                  class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors">
            {{ lang.t('alerts.read') }}
          </button>
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="flex items-center justify-center py-16">
          <div class="w-8 h-8 border-2 border-blue-400/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && alerts().length === 0) {
        <div class="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
            <svg class="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-slate-900 mb-2">{{ lang.t('alerts.empty_title') }}</h3>
          <p class="text-sm text-slate-400 mb-6 max-w-md mx-auto">{{ lang.t('alerts.empty_message') }}</p>
          <a routerLink="/alert-profile"
             class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all">
            {{ lang.t('alerts.setup_profile') }}
          </a>
        </div>
      }

      <!-- Alert list -->
      @if (!loading() && filteredAlerts().length > 0) {
        <div class="space-y-3">
          @for (alert of filteredAlerts(); track alert.id) {
            <div (click)="toggleExpand(alert.id)"
                 class="bg-white border rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:bg-white"
                 [class]="alert.isRead ? 'border-slate-200' : 'border-l-2 ' + severityBorderClass(alert.severity) + ' border-slate-200'">
              <div class="px-5 py-4">
                <div class="flex items-start gap-3">
                  <!-- Severity badge -->
                  <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase shrink-0 mt-0.5"
                        [class]="severityBadgeClass(alert.severity)">
                    {{ alert.severity }}
                  </span>
                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <h3 class="text-sm font-medium truncate" [class]="alert.isRead ? 'text-slate-400' : 'text-slate-900'">
                        {{ alert.title }}
                      </h3>
                      @if (!alert.isRead) {
                        <span class="w-2 h-2 rounded-full bg-blue-400 shrink-0"></span>
                      }
                    </div>
                    <div class="flex items-center gap-3 mt-1">
                      <span class="text-xs text-slate-500">{{ alert.source }}</span>
                      <span class="text-xs text-slate-600">{{ formatDate(alert.createdAt) }}</span>
                    </div>
                    @if (alert.message && !expandedId().has(alert.id)) {
                      <p class="text-xs text-slate-500 mt-1.5 line-clamp-1">{{ alert.message }}</p>
                    }
                  </div>
                  <!-- Actions -->
                  <div class="flex items-center gap-2 shrink-0">
                    @if (!alert.isRead) {
                      <button (click)="markRead(alert, $event)"
                              [title]="lang.t('alerts.mark_read')"
                              class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                      </button>
                    }
                    <svg class="w-4 h-4 text-slate-600 transition-transform" [class.rotate-180]="expandedId().has(alert.id)"
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Expanded detail -->
              @if (expandedId().has(alert.id)) {
                <div class="border-t border-slate-200 px-5 py-4 bg-slate-100/30 space-y-4">
                  @if (alertDetails()[alert.id]; as detail) {
                    <!-- AI Summary -->
                    @if (detail.message) {
                      <div>
                        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{{ lang.t('alerts.summary') }}</h4>
                        <p class="text-sm text-slate-600 leading-relaxed">{{ detail.message }}</p>
                      </div>
                    }

                    <!-- Impact Analysis -->
                    @if (detail.impactAnalysis) {
                      <div>
                        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{{ lang.t('alerts.impact') }}</h4>
                        <p class="text-sm text-slate-600 leading-relaxed">{{ detail.impactAnalysis }}</p>
                      </div>
                    }

                    <!-- Metadata row -->
                    <div class="flex flex-wrap gap-3">
                      @if (detail.regulations) {
                        <div>
                          <span class="text-[10px] text-slate-500 uppercase tracking-wider">{{ lang.t('alerts.regulations') }}</span>
                          <div class="flex flex-wrap gap-1 mt-1">
                            @for (reg of detail.regulations.split(','); track reg) {
                              <span class="px-2 py-0.5 text-[10px] font-medium rounded bg-blue-50 text-blue-600 border border-blue-200">{{ reg.trim() }}</span>
                            }
                          </div>
                        </div>
                      }
                      @if (detail.countries) {
                        <div>
                          <span class="text-[10px] text-slate-500 uppercase tracking-wider">{{ lang.t('alerts.countries') }}</span>
                          <div class="flex flex-wrap gap-1 mt-1">
                            @for (c of detail.countries.split(','); track c) {
                              <span class="px-2 py-0.5 text-[10px] font-medium rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{{ c.trim() }}</span>
                            }
                          </div>
                        </div>
                      }
                      @if (detail.publishedDate) {
                        <div>
                          <span class="text-[10px] text-slate-500 uppercase tracking-wider">{{ lang.t('alerts.published') }}</span>
                          <p class="text-xs text-slate-400 mt-1">{{ detail.publishedDate }}</p>
                        </div>
                      }
                    </div>

                    <!-- Source link -->
                    @if (detail.url) {
                      <a [href]="detail.url" target="_blank" rel="noopener"
                         class="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-500 transition-colors">
                        {{ lang.t('alerts.view_source') }}
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                      </a>
                    }
                  } @else {
                    <div class="flex items-center gap-2 py-2">
                      <div class="w-4 h-4 border-2 border-blue-400/30 border-t-blue-500 rounded-full animate-spin"></div>
                      <span class="text-xs text-slate-500">{{ lang.t('alerts.loading_detail') }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Filtered empty -->
      @if (!loading() && alerts().length > 0 && filteredAlerts().length === 0) {
        <div class="bg-slate-100/30 border border-slate-200 rounded-xl p-8 text-center">
          <p class="text-sm text-slate-500">{{ lang.t('alerts.no_match') }}</p>
        </div>
      }
    </div>
  `
})
export class RegulatoryAlertFeedComponent implements OnInit {
  alerts = signal<UserAlert[]>([]);
  loading = signal(true);
  filterSeverity = signal('');
  filterRead = signal('');
  expandedId = signal<Set<string>>(new Set());
  alertDetails = signal<{ [id: string]: AlertDetail }>({});
  unreadCount = computed(() => this.alerts().filter(a => !a.isRead).length);

  severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

  filteredAlerts = computed(() => {
    let list = this.alerts();
    const sev = this.filterSeverity();
    const read = this.filterRead();
    if (sev) list = list.filter(a => a.severity === sev);
    if (read === 'unread') list = list.filter(a => !a.isRead);
    if (read === 'read') list = list.filter(a => a.isRead);
    return list;
  });

  constructor(public lang: LangService, private api: ApiService) {}

  ngOnInit() {
    this.loadAlerts();
  }

  loadAlerts() {
    this.loading.set(true);
    this.api.getUserAlerts().subscribe({
      next: alerts => {
        this.alerts.set(alerts);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  toggleExpand(id: string) {
    const set = new Set(this.expandedId());
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
      // Load detail if not cached
      if (!this.alertDetails()[id]) {
        this.api.getAlertDetail(id).subscribe(detail => {
          this.alertDetails.update(d => ({ ...d, [id]: detail }));
        });
      }
    }
    this.expandedId.set(set);
  }

  markRead(alert: UserAlert, event: Event) {
    event.stopPropagation();
    this.api.markAlertAsRead(alert.id).subscribe(() => {
      this.alerts.update(list => list.map(a => a.id === alert.id ? { ...a, isRead: true } : a));
    });
  }

  markAllRead() {
    this.api.markAllAlertsRead().subscribe(() => {
      this.alerts.update(list => list.map(a => ({ ...a, isRead: true })));
    });
  }

  countBySeverity(severity: string): number {
    return this.alerts().filter(a => a.severity === severity).length;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('et-EE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return dateStr; }
  }

  severityBadgeClass(severity: string): string {
    const map: { [k: string]: string } = {
      CRITICAL: 'bg-red-500/15 text-red-400',
      HIGH: 'bg-orange-500/15 text-orange-400',
      MEDIUM: 'bg-yellow-500/15 text-yellow-400',
      LOW: 'bg-blue-500/15 text-blue-400',
      INFO: 'bg-slate-500/15 text-slate-400'
    };
    return map[severity] || map['INFO'];
  }

  severityBorderClass(severity: string): string {
    const map: { [k: string]: string } = {
      CRITICAL: 'border-l-red-500',
      HIGH: 'border-l-orange-500',
      MEDIUM: 'border-l-yellow-500',
      LOW: 'border-l-blue-500',
      INFO: 'border-l-slate-500'
    };
    return map[severity] || map['INFO'];
  }

  severityActiveClass(severity: string): string {
    const map: { [k: string]: string } = {
      CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
      HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      LOW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      INFO: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    };
    return map[severity] || map['INFO'];
  }
}
