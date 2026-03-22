import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { LangService } from '../lang.service';
import { ApiService } from '../api.service';
import { SubscriptionService } from '../services/subscription.service';

interface Deadline {
  id: string;
  date: string;
  titleKey: string;
  descKey: string;
  category: 'ROI' | 'TLPT' | 'REPORT' | 'CONTRACT' | 'TRAINING' | 'GENERAL';
  recurrence?: 'ANNUAL' | 'QUARTERLY' | 'BIANNUAL';
  entityTypes: string[];
  completed?: boolean;
}

@Component({
  selector: 'app-deadline-calendar',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-10">
        <h1 class="text-3xl font-bold text-slate-900 mb-2">{{ lang.t('deadlines.title') }}</h1>
        <p class="text-slate-400 mb-4">{{ lang.t('deadlines.subtitle') }}</p>
        <button (click)="exportIcal()"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-blue-50 text-blue-500 border border-blue-500/30 hover:bg-blue-600/20">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          {{ lang.l('Ekspordi kalendrisse', 'Export to Calendar') }}
        </button>
      </div>

      <!-- Entity type filter -->
      <div class="glass-card p-4 mb-8">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm text-slate-400 mr-2">{{ lang.t('deadlines.entity_type') }}:</span>
          @for (type of entityTypes; track type.key) {
            <button (click)="toggleEntityType(type.key)"
                    class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                    [class]="selectedEntityType() === type.key
                      ? 'bg-blue-100 text-blue-600 border border-blue-200'
                      : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'">
              {{ lang.t(type.labelKey) }}
            </button>
          }
        </div>
      </div>

      <!-- Countdown cards for next 3 deadlines -->
      @if (upcomingDeadlines().length > 0) {
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          @for (d of upcomingDeadlines().slice(0, 3); track d.id) {
            <div class="glass-card p-5 border-t-2"
                 [class]="daysUntil(d.date) <= 30 ? 'border-t-red-500' : daysUntil(d.date) <= 90 ? 'border-t-amber-500' : 'border-t-blue-600'">
              <div class="flex items-center gap-2 mb-3">
                <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                      [class]="getCategoryClass(d.category)">
                  {{ lang.t('deadlines.cat_' + d.category.toLowerCase()) }}
                </span>
                @if (d.recurrence) {
                  <span class="text-xs text-slate-500">{{ lang.t('deadlines.recurrence_' + d.recurrence.toLowerCase()) }}</span>
                }
              </div>
              <h3 class="font-semibold text-slate-700 mb-1 text-sm">{{ lang.t(d.titleKey) }}</h3>
              <p class="text-xs text-slate-500 mb-3">{{ formatDate(d.date) }}</p>
              <div class="flex items-end justify-between">
                <div>
                  <span class="text-3xl font-bold"
                        [class]="daysUntil(d.date) <= 30 ? 'text-red-400' : daysUntil(d.date) <= 90 ? 'text-amber-400' : 'text-blue-600'">
                    {{ daysUntil(d.date) }}
                  </span>
                  <span class="text-sm text-slate-500 ml-1">{{ lang.t('deadlines.days') }}</span>
                </div>
                <!-- Progress ring -->
                <svg viewBox="0 0 36 36" class="w-10 h-10">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgb(51 65 85)" stroke-width="3"/>
                  <circle cx="18" cy="18" r="15" fill="none"
                          [attr.stroke]="daysUntil(d.date) <= 30 ? 'rgb(248 113 113)' : daysUntil(d.date) <= 90 ? 'rgb(251 191 36)' : 'rgb(52 211 153)'"
                          stroke-width="3" stroke-linecap="round"
                          [attr.stroke-dasharray]="getProgressDash(d.date)"
                          transform="rotate(-90 18 18)"/>
                </svg>
              </div>
            </div>
          }
        </div>
      }

      <!-- Overdue deadlines -->
      @if (overdueDeadlines().length > 0) {
        <div class="glass-card p-6 mb-8 border-l-4 border-l-red-500">
          <h2 class="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            {{ lang.t('deadlines.overdue') }} ({{ overdueDeadlines().length }})
          </h2>
          <div class="space-y-3">
            @for (d of overdueDeadlines(); track d.id) {
              <div class="flex items-center justify-between p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                <div class="flex items-center gap-3">
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium" [class]="getCategoryClass(d.category)">{{ lang.t('deadlines.cat_' + d.category.toLowerCase()) }}</span>
                  <div>
                    <p class="text-sm font-medium text-slate-700">{{ lang.t(d.titleKey) }}</p>
                    <p class="text-xs text-red-400">{{ Math.abs(daysUntil(d.date)) }} {{ lang.t('deadlines.days_overdue') }}</p>
                  </div>
                </div>
                <button (click)="markDone(d)" class="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:border-blue-200 hover:text-blue-600 transition-all">
                  {{ lang.t('deadlines.mark_done') }}
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Full timeline -->
      <div class="glass-card p-6 mb-8">
        <h2 class="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          {{ lang.t('deadlines.timeline') }}
        </h2>

        <div class="relative">
          <!-- Timeline line -->
          <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200"></div>

          <div class="space-y-6">
            @for (d of allFilteredDeadlines(); track d.id) {
              <div class="flex gap-4 relative">
                <!-- Timeline dot -->
                <div class="w-12 flex items-start justify-center shrink-0 z-10">
                  @if (d.completed) {
                    <div class="w-5 h-5 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center">
                      <svg class="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                    </div>
                  } @else if (isPast(d.date)) {
                    <div class="w-5 h-5 rounded-full bg-red-500/20 border-2 border-red-500"></div>
                  } @else if (daysUntil(d.date) <= 90) {
                    <div class="w-5 h-5 rounded-full bg-amber-500/20 border-2 border-amber-500 animate-pulse"></div>
                  } @else {
                    <div class="w-5 h-5 rounded-full bg-slate-200 border-2 border-slate-300"></div>
                  }
                </div>

                <!-- Content -->
                <div class="flex-1 pb-2">
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <div class="flex items-center gap-2 mb-1">
                        <span class="px-2 py-0.5 rounded-full text-xs font-medium" [class]="getCategoryClass(d.category)">{{ lang.t('deadlines.cat_' + d.category.toLowerCase()) }}</span>
                        @if (d.recurrence) {
                          <span class="text-xs text-slate-600">{{ lang.t('deadlines.recurrence_' + d.recurrence.toLowerCase()) }}</span>
                        }
                      </div>
                      <h3 class="font-medium text-sm" [class]="d.completed ? 'text-slate-500 line-through' : 'text-slate-700'">{{ lang.t(d.titleKey) }}</h3>
                      <p class="text-xs text-slate-500 mt-0.5">{{ lang.t(d.descKey) }}</p>
                    </div>
                    <div class="text-right shrink-0">
                      <p class="text-sm font-medium" [class]="d.completed ? 'text-blue-600' : isPast(d.date) ? 'text-red-400' : daysUntil(d.date) <= 90 ? 'text-amber-400' : 'text-slate-400'">
                        {{ formatDate(d.date) }}
                      </p>
                      @if (!d.completed && !isPast(d.date)) {
                        <p class="text-xs text-slate-500">{{ daysUntil(d.date) }} {{ lang.t('deadlines.days') }}</p>
                      }
                      @if (!d.completed) {
                        <button (click)="markDone(d)" class="text-xs text-slate-600 hover:text-blue-600 mt-1 transition-colors">{{ lang.t('deadlines.mark_done') }}</button>
                      }
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- All done message -->
      @if (upcomingDeadlines().length === 0 && overdueDeadlines().length === 0) {
        <div class="glass-card p-12 text-center">
          <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          </div>
          <h2 class="text-xl font-bold text-blue-600 mb-2">{{ lang.t('deadlines.all_done') }}</h2>
          <p class="text-slate-400">{{ lang.t('deadlines.all_done_desc') }}</p>
        </div>
      }
    </div>
  `
})
export class DeadlineCalendarComponent implements OnInit {
  readonly lang = inject(LangService);
  private readonly titleService = inject(Title);
  private readonly api = inject(ApiService);
  readonly subService = inject(SubscriptionService);
  readonly Math = Math;

  selectedEntityType = signal<string>('ALL');
  completedIds = signal<Set<string>>(new Set());

  entityTypes = [
    { key: 'ALL', labelKey: 'deadlines.type_all' },
    { key: 'BANK', labelKey: 'deadlines.type_bank' },
    { key: 'INSURANCE', labelKey: 'deadlines.type_insurance' },
    { key: 'INVESTMENT', labelKey: 'deadlines.type_investment' },
    { key: 'PAYMENT', labelKey: 'deadlines.type_payment' },
    { key: 'ICT_PROVIDER', labelKey: 'deadlines.type_ict' },
  ];

  readonly deadlines: Deadline[] = [
    // Past milestones
    { id: 'd1', date: '2025-01-17', titleKey: 'deadlines.dora_application', descKey: 'deadlines.dora_application_desc', category: 'GENERAL', entityTypes: ['ALL'] },
    { id: 'd2', date: '2025-04-30', titleKey: 'deadlines.roi_first', descKey: 'deadlines.roi_first_desc', category: 'ROI', entityTypes: ['ALL'] },
    { id: 'd3', date: '2025-06-30', titleKey: 'deadlines.tlpt_first', descKey: 'deadlines.tlpt_first_desc', category: 'TLPT', entityTypes: ['BANK', 'INSURANCE', 'INVESTMENT'] },
    { id: 'd4', date: '2025-12-31', titleKey: 'deadlines.legacy_contracts', descKey: 'deadlines.legacy_contracts_desc', category: 'CONTRACT', entityTypes: ['ALL'] },
    // Upcoming
    { id: 'd5', date: '2026-01-17', titleKey: 'deadlines.annual_report', descKey: 'deadlines.annual_report_desc', category: 'REPORT', recurrence: 'ANNUAL', entityTypes: ['ALL'] },
    { id: 'd6', date: '2026-03-31', titleKey: 'deadlines.roi_annual', descKey: 'deadlines.roi_annual_desc', category: 'ROI', recurrence: 'ANNUAL', entityTypes: ['ALL'] },
    { id: 'd7', date: '2026-04-17', titleKey: 'deadlines.ctpp_designation', descKey: 'deadlines.ctpp_designation_desc', category: 'GENERAL', entityTypes: ['ICT_PROVIDER'] },
    { id: 'd8', date: '2026-06-30', titleKey: 'deadlines.resilience_test', descKey: 'deadlines.resilience_test_desc', category: 'TLPT', recurrence: 'ANNUAL', entityTypes: ['ALL'] },
    { id: 'd9', date: '2026-09-30', titleKey: 'deadlines.training_review', descKey: 'deadlines.training_review_desc', category: 'TRAINING', recurrence: 'ANNUAL', entityTypes: ['ALL'] },
    { id: 'd10', date: '2026-12-31', titleKey: 'deadlines.contract_review', descKey: 'deadlines.contract_review_desc', category: 'CONTRACT', recurrence: 'ANNUAL', entityTypes: ['ALL'] },
    { id: 'd11', date: '2027-01-17', titleKey: 'deadlines.dora_review', descKey: 'deadlines.dora_review_desc', category: 'REPORT', entityTypes: ['ALL'] },
    { id: 'd12', date: '2027-03-31', titleKey: 'deadlines.roi_2027', descKey: 'deadlines.roi_annual_desc', category: 'ROI', recurrence: 'ANNUAL', entityTypes: ['ALL'] },
    { id: 'd13', date: '2027-06-30', titleKey: 'deadlines.tlpt_cycle', descKey: 'deadlines.tlpt_cycle_desc', category: 'TLPT', entityTypes: ['BANK', 'INSURANCE', 'INVESTMENT'] },
    { id: 'd14', date: '2028-06-30', titleKey: 'deadlines.tlpt_3year', descKey: 'deadlines.tlpt_3year_desc', category: 'TLPT', entityTypes: ['BANK', 'INSURANCE', 'INVESTMENT'] },
  ];

  allFilteredDeadlines = computed(() => {
    const type = this.selectedEntityType();
    const done = this.completedIds();
    return this.deadlines
      .filter(d => type === 'ALL' || d.entityTypes.includes('ALL') || d.entityTypes.includes(type))
      .map(d => ({ ...d, completed: done.has(d.id) }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });

  upcomingDeadlines = computed(() =>
    this.allFilteredDeadlines().filter(d => !d.completed && !this.isPast(d.date))
  );

  overdueDeadlines = computed(() =>
    this.allFilteredDeadlines().filter(d => !d.completed && this.isPast(d.date))
  );

  ngOnInit() {
    this.titleService.setTitle(this.lang.t('title.deadlines'));
    this.loadCompleted();
  }

  toggleEntityType(type: string) {
    this.selectedEntityType.set(this.selectedEntityType() === type ? 'ALL' : type);
  }

  markDone(deadline: Deadline) {
    const done = new Set(this.completedIds());
    done.add(deadline.id);
    this.completedIds.set(done);
    this.saveCompleted(done);
  }

  daysUntil(dateStr: string): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  isPast(dateStr: string): boolean {
    return this.daysUntil(dateStr) < 0;
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString(this.lang.lang() === 'et' ? 'et-EE' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getProgressDash(dateStr: string): string {
    const days = this.daysUntil(dateStr);
    const maxDays = 365;
    const progress = Math.max(0, Math.min(1, 1 - days / maxDays));
    const circ = 2 * Math.PI * 15; // ~94.25
    return `${progress * circ} ${circ}`;
  }

  getCategoryClass(cat: string): string {
    const classes: { [key: string]: string } = {
      'ROI': 'bg-violet-500/20 text-violet-400',
      'TLPT': 'bg-red-500/20 text-red-400',
      'REPORT': 'bg-blue-600/20 text-blue-500',
      'CONTRACT': 'bg-amber-500/20 text-amber-400',
      'TRAINING': 'bg-blue-100 text-blue-600',
      'GENERAL': 'bg-slate-200 text-slate-400',
    };
    return classes[cat] || classes['GENERAL'];
  }

  private loadCompleted() {
    if (typeof localStorage === 'undefined') return;
    try {
      const ids: string[] = JSON.parse(localStorage.getItem('dora_deadline_completed') || '[]');
      this.completedIds.set(new Set(ids));
    } catch { /* empty */ }
  }

  exportIcal() {
    this.api.exportIcalDeadlines().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dora-deadlines.ics';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => {}
    });
  }

  private saveCompleted(ids: Set<string>) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('dora_deadline_completed', JSON.stringify([...ids]));
  }
}
