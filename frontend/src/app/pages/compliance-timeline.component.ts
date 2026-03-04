import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';
import { ApiService } from '../api.service';

interface TimelineEvent {
  type: string;
  timestamp: string;
  title: string;
  description: string;
  status: string;
  icon: string;
  link: string;
  score?: number;
  severity?: string;
  priority?: string;
}

@Component({
  selector: 'app-compliance-timeline',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="max-w-4xl mx-auto space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-4">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {{ lang.t('activity.badge') }}
        </div>
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
          {{ lang.t('activity.title') }}
        </h1>
        <p class="text-slate-400 max-w-2xl mx-auto">
          {{ lang.t('activity.subtitle') }}
        </p>
      </div>

      <!-- Stats Cards -->
      @if (stats()) {
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-5 text-center">
          <div class="text-3xl font-bold text-white mb-1">{{ stats().total }}</div>
          <div class="text-xs text-slate-400">{{ lang.t('activity.total_events') }}</div>
        </div>
        <div class="bg-slate-800/50 backdrop-blur border border-violet-500/30 rounded-2xl p-5 text-center">
          <div class="text-3xl font-bold text-violet-400 mb-1">{{ stats().last7Days }}</div>
          <div class="text-xs text-slate-400">{{ lang.t('activity.last_7_days') }}</div>
        </div>
        <div class="bg-slate-800/50 backdrop-blur border border-cyan-500/30 rounded-2xl p-5 text-center">
          <div class="text-3xl font-bold text-cyan-400 mb-1">{{ stats().last30Days }}</div>
          <div class="text-xs text-slate-400">{{ lang.t('activity.last_30_days') }}</div>
        </div>
      </div>
      }

      <!-- Filter Tabs -->
      <div class="flex flex-wrap gap-2 justify-center">
        @for (f of filters; track f.key) {
        <button (click)="activeFilter = f.key"
                class="px-4 py-1.5 rounded-full text-xs font-medium transition-all border"
                [class]="activeFilter === f.key
                  ? 'bg-violet-500/20 border-violet-500/40 text-violet-400'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600/50 hover:text-slate-300'">
          {{ lang.t(f.label) }}
        </button>
        }
      </div>

      <!-- Loading -->
      @if (loading()) {
      <div class="flex flex-col items-center gap-3 py-16">
        <svg class="w-8 h-8 text-violet-400 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <span class="text-slate-400 text-sm">{{ lang.t('activity.loading') }}</span>
      </div>
      }

      <!-- Empty State -->
      @if (!loading() && filteredEvents().length === 0) {
      <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-12 text-center">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-slate-700/50 flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-white mb-2">{{ lang.t('activity.empty_title') }}</h3>
        <p class="text-sm text-slate-400">{{ lang.t('activity.empty_desc') }}</p>
      </div>
      }

      <!-- Timeline -->
      @if (!loading() && filteredEvents().length > 0) {
      <div class="relative">
        <!-- Vertical Line -->
        <div class="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500/50 via-cyan-500/30 to-transparent"></div>

        <div class="space-y-1">
          @for (event of filteredEvents(); track $index; let i = $index) {
            <!-- Date Separator -->
            @if (i === 0 || getDateGroup(event) !== getDateGroup(filteredEvents()[i - 1])) {
            <div class="relative flex items-center gap-4 py-3">
              <div class="relative z-10 w-12 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                <div class="w-2 h-2 rounded-full bg-violet-400"></div>
              </div>
              <div class="text-xs font-semibold text-violet-400 uppercase tracking-wider">
                {{ getDateGroup(event) }}
              </div>
            </div>
            }

            <!-- Event Card -->
            <div class="relative flex gap-4 group">
              <!-- Icon Circle -->
              <div class="relative z-10 flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all"
                   [class]="getIconBgClass(event)">
                <!-- ASSESSMENT -->
                @if (event.type === 'ASSESSMENT') {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
                }
                <!-- CONTRACT_ANALYSIS -->
                @if (event.type === 'CONTRACT_ANALYSIS') {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z"/>
                </svg>
                }
                <!-- EVIDENCE / EVIDENCE_VERIFIED -->
                @if (event.type === 'EVIDENCE' || event.type === 'EVIDENCE_VERIFIED') {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                }
                <!-- REMEDIATION / REMEDIATION_COMPLETED -->
                @if (event.type === 'REMEDIATION' || event.type === 'REMEDIATION_COMPLETED') {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                }
                <!-- INCIDENT / INCIDENT_RESOLVED -->
                @if (event.type === 'INCIDENT' || event.type === 'INCIDENT_RESOLVED') {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                }
                <!-- PROVIDER -->
                @if (event.type === 'PROVIDER') {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/>
                </svg>
                }
              </div>

              <!-- Content -->
              <div class="flex-1 bg-slate-800/40 backdrop-blur border border-slate-700/40 rounded-xl p-4 hover:border-slate-600/60 transition-all group-hover:shadow-lg group-hover:shadow-violet-500/5 mb-2">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap mb-1">
                      <span class="text-xs font-medium px-2 py-0.5 rounded-full"
                            [class]="getTypeBadgeClass(event)">
                        {{ getTypeLabel(event.type) }}
                      </span>
                      @if (event.status) {
                      <span class="text-xs px-2 py-0.5 rounded-full"
                            [class]="getStatusBadgeClass(event)">
                        {{ event.status }}
                      </span>
                      }
                      @if (event.score != null) {
                      <span class="text-xs font-bold"
                            [class]="event.score >= 75 ? 'text-emerald-400' : event.score >= 50 ? 'text-amber-400' : 'text-red-400'">
                        {{ event.score | number:'1.0-0' }}%
                      </span>
                      }
                    </div>
                    <h3 class="text-sm font-semibold text-white truncate">{{ event.title }}</h3>
                    <p class="text-xs text-slate-400 mt-0.5 truncate">{{ event.description }}</p>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <span class="text-xs text-slate-500 whitespace-nowrap">{{ formatTime(event.timestamp) }}</span>
                    <a [routerLink]="event.link"
                       class="w-7 h-7 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-violet-400 hover:bg-violet-500/20 transition-all">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Load More -->
        @if (hasMore()) {
        <div class="flex justify-center pt-6">
          <button (click)="loadMore()"
                  class="px-6 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 text-sm hover:border-violet-500/40 hover:text-violet-400 transition-all">
            {{ lang.t('activity.load_more') }}
          </button>
        </div>
        }
      </div>
      }

      <!-- Back Link -->
      <div class="text-center pt-4">
        <a routerLink="/dashboard"
           class="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-violet-400 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          {{ lang.t('activity.back') }}
        </a>
      </div>
    </div>
  `
})
export class ComplianceTimelineComponent implements OnInit {
  lang: LangService;
  private api: ApiService;

  loading = signal(true);
  events = signal<TimelineEvent[]>([]);
  stats = signal<any>(null);
  hasMore = signal(false);
  activeFilter = 'ALL';
  private currentLimit = 50;

  filters = [
    { key: 'ALL', label: 'activity.filter_all' },
    { key: 'ASSESSMENT', label: 'activity.filter_assessments' },
    { key: 'CONTRACT_ANALYSIS', label: 'activity.filter_contracts' },
    { key: 'EVIDENCE', label: 'activity.filter_evidence' },
    { key: 'REMEDIATION', label: 'activity.filter_remediation' },
    { key: 'INCIDENT', label: 'activity.filter_incidents' },
    { key: 'PROVIDER', label: 'activity.filter_providers' }
  ];

  constructor(langService: LangService, apiService: ApiService) {
    this.lang = langService;
    this.api = apiService;
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.api.getActivityTimeline(this.currentLimit).subscribe({
      next: (data) => {
        this.events.set(data);
        this.hasMore.set(data.length >= this.currentLimit);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
    this.api.getActivityStats().subscribe({
      next: (data) => this.stats.set(data)
    });
  }

  loadMore(): void {
    this.currentLimit += 50;
    this.loadData();
  }

  filteredEvents = () => {
    const all = this.events();
    if (this.activeFilter === 'ALL') return all;
    return all.filter(e => e.type.startsWith(this.activeFilter));
  };

  getDateGroup(event: TimelineEvent): string {
    if (!event.timestamp) return 'Unknown';
    const d = new Date(event.timestamp);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return this.lang.t('activity.today');
    if (days === 1) return this.lang.t('activity.yesterday');
    if (days < 7) return this.lang.t('activity.this_week');
    if (days < 30) return this.lang.t('activity.this_month');
    if (days < 90) return this.lang.t('activity.last_3_months');
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  formatTime(ts: string): string {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  getIconBgClass(event: TimelineEvent): string {
    switch (event.type) {
      case 'ASSESSMENT': return 'bg-blue-500/20 text-blue-400';
      case 'CONTRACT_ANALYSIS': return 'bg-cyan-500/20 text-cyan-400';
      case 'EVIDENCE': return 'bg-indigo-500/20 text-indigo-400';
      case 'EVIDENCE_VERIFIED': return 'bg-emerald-500/20 text-emerald-400';
      case 'REMEDIATION': return 'bg-amber-500/20 text-amber-400';
      case 'REMEDIATION_COMPLETED': return 'bg-emerald-500/20 text-emerald-400';
      case 'INCIDENT': return 'bg-red-500/20 text-red-400';
      case 'INCIDENT_RESOLVED': return 'bg-emerald-500/20 text-emerald-400';
      case 'PROVIDER': return 'bg-violet-500/20 text-violet-400';
      default: return 'bg-slate-700/50 text-slate-400';
    }
  }

  getTypeBadgeClass(event: TimelineEvent): string {
    switch (event.type) {
      case 'ASSESSMENT': return 'bg-blue-500/20 text-blue-400';
      case 'CONTRACT_ANALYSIS': return 'bg-cyan-500/20 text-cyan-400';
      case 'EVIDENCE': case 'EVIDENCE_VERIFIED': return 'bg-indigo-500/20 text-indigo-400';
      case 'REMEDIATION': case 'REMEDIATION_COMPLETED': return 'bg-amber-500/20 text-amber-400';
      case 'INCIDENT': case 'INCIDENT_RESOLVED': return 'bg-red-500/20 text-red-400';
      case 'PROVIDER': return 'bg-violet-500/20 text-violet-400';
      default: return 'bg-slate-700/50 text-slate-400';
    }
  }

  getStatusBadgeClass(event: TimelineEvent): string {
    const s = event.status;
    if (['GREEN', 'VERIFIED', 'COMPLETED', 'CLOSED'].includes(s)) return 'bg-emerald-500/20 text-emerald-400';
    if (['YELLOW', 'PENDING', 'IN_PROGRESS', 'DRAFT'].includes(s)) return 'bg-amber-500/20 text-amber-400';
    if (['RED', 'CRITICAL', 'OVERDUE'].includes(s)) return 'bg-red-500/20 text-red-400';
    return 'bg-slate-700/50 text-slate-400';
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      ASSESSMENT: 'Assessment',
      CONTRACT_ANALYSIS: 'Contract',
      EVIDENCE: 'Evidence',
      EVIDENCE_VERIFIED: 'Verified',
      REMEDIATION: 'Remediation',
      REMEDIATION_COMPLETED: 'Completed',
      INCIDENT: 'Incident',
      INCIDENT_RESOLVED: 'Resolved',
      PROVIDER: 'Provider'
    };
    return labels[type] || type;
  }
}
