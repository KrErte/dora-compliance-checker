import { Component, HostListener, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, SearchResult } from '../api.service';
import { LangService } from '../lang.service';
import { ThemeService } from '../services/theme.service';
import { Subject, debounceTime, switchMap, of } from 'rxjs';

interface CommandAction {
  id: string;
  group: 'quick' | 'nav';
  icon: string;
  iconBg: string;
  labelKey: string;
  handler: () => void;
}

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-[15vh]"
           (click)="close()">
        <div class="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
             (click)="$event.stopPropagation()">
          <!-- Search input -->
          <div class="flex items-center gap-3 px-5 py-4 border-b border-slate-200">
            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input #searchInput type="text" [(ngModel)]="query" (ngModelChange)="onQueryChange($event)"
                   [placeholder]="lang.t('cmd.placeholder')"
                   class="flex-1 bg-transparent text-slate-900 placeholder-slate-500 outline-none text-sm"
                   (keydown)="onKeydown($event)" autofocus>
            <kbd class="px-2 py-0.5 rounded bg-slate-100 text-slate-400 text-[10px] font-mono">ESC</kbd>
          </div>

          <div class="max-h-[50vh] overflow-y-auto">
            <!-- Empty state: show quick actions + navigation + recent searches -->
            @if (query.length < 2) {
              <!-- Quick Actions -->
              <div class="px-3 pt-3 pb-1">
                <div class="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{{ lang.t('cmd.quick_actions') }}</div>
                @for (action of quickActions; track action.id; let i = $index) {
                  <div (click)="executeAction(action)" [class]="'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer' + (selectedIndex() === i ? ' bg-slate-100/30' : '')">
                    <div class="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0" [class]="action.iconBg">{{ action.icon }}</div>
                    <span class="text-sm text-slate-600">{{ lang.t(action.labelKey) }}</span>
                  </div>
                }
              </div>

              <!-- Navigation -->
              <div class="px-3 pt-2 pb-1">
                <div class="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{{ lang.t('cmd.navigation') }}</div>
                @for (action of navActions; track action.id; let i = $index) {
                  <div (click)="executeAction(action)" [class]="'w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer' + (selectedIndex() === quickActions.length + i ? ' bg-slate-100/30' : '')">
                    <div class="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0" [class]="action.iconBg">{{ action.icon }}</div>
                    <span class="text-sm text-slate-600">{{ lang.t(action.labelKey) }}</span>
                  </div>
                }
              </div>

              <!-- Recent searches -->
              @if (recentSearches().length > 0) {
                <div class="px-3 pt-2 pb-1">
                  <div class="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                    <span>{{ lang.t('cmd.recent') }}</span>
                    <button type="button" (click)="clearRecentSearches()" class="text-slate-600 hover:text-slate-400 transition-colors">{{ lang.t('cmd.clear') }}</button>
                  </div>
                  @for (search of recentSearches(); track search; let i = $index) {
                    <div (click)="useRecentSearch(search)" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                      <svg class="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span class="text-sm text-slate-400">{{ search }}</span>
                    </div>
                  }
                </div>
              }
            }

            <!-- Loading -->
            @if (loading()) {
              <div class="px-5 py-8 text-center">
                <div class="w-6 h-6 mx-auto rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin"></div>
              </div>
            }

            <!-- No results -->
            @if (!loading() && results().length === 0 && matchingActions().length === 0 && query.length >= 2) {
              <div class="px-5 py-8 text-center text-slate-500 text-sm">{{ lang.t('cmd.no_results') }}</div>
            }

            <!-- Matching actions (shown above API results when typing) -->
            @if (query.length >= 2 && matchingActions().length > 0) {
              <div class="px-3 pt-3 pb-1">
                <div class="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{{ lang.t('cmd.actions') }}</div>
                @for (action of matchingActions(); track action.id; let i = $index) {
                  <div (click)="executeAction(action)" [class]="'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer' + (selectedIndex() === i ? ' bg-slate-100/30' : '')">
                    <div class="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0" [class]="action.iconBg">{{ action.icon }}</div>
                    <span class="text-sm text-slate-600">{{ lang.t(action.labelKey) }}</span>
                  </div>
                }
              </div>
            }

            <!-- API search results -->
            @if (!loading() && results().length > 0) {
              @for (group of groupedResults(); track group.type) {
                <div class="px-3 pt-3 pb-1">
                  <div class="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{{ group.label }}</div>
                  @for (item of group.items; track item.url + item.title; let i = $index) {
                    <div (click)="navigate(item.url)" [class]="'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-colors text-left group cursor-pointer' + (selectedIndex() === getGlobalIndex(group, i) ? ' bg-slate-100/30' : '')">
                      <div class="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0" [class]="getTypeColor(group.type)">
                        {{ getTypeIcon(group.type) }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm text-slate-900 truncate">{{ item.title }}</div>
                        <div class="text-[11px] text-slate-500 truncate">{{ item.snippet }}</div>
                      </div>
                    </div>
                  }
                </div>
              }
            }
          </div>

          <!-- Footer hints -->
          <div class="px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
            <span><kbd class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 font-mono mr-1">&uarr;&darr;</kbd> {{ lang.t('cmd.navigate') }}</span>
            <span><kbd class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 font-mono mr-1">Enter</kbd> {{ lang.t('cmd.open') }}</span>
            <span><kbd class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 font-mono mr-1">Ctrl+K</kbd> {{ lang.t('cmd.toggle') }}</span>
          </div>
        </div>
      </div>
    }
  `
})
export class GlobalSearchComponent {
  lang = inject(LangService);
  private api = inject(ApiService);
  private router = inject(Router);
  private themeService = inject(ThemeService);

  isOpen = signal(false);
  query = '';
  results = signal<SearchResult[]>([]);
  loading = signal(false);
  selectedIndex = signal(0);
  recentSearches = signal<string[]>(this.loadRecentSearches());

  private searchSubject = new Subject<string>();

  // Quick actions
  quickActions: CommandAction[] = [
    { id: 'new-assessment', group: 'quick', icon: '📋', iconBg: 'bg-blue-600/20', labelKey: 'cmd.new_assessment', handler: () => this.go('/assessment/wizard') },
    { id: 'upload-contract', group: 'quick', icon: '📄', iconBg: 'bg-blue-100', labelKey: 'cmd.upload_contract', handler: () => this.go('/contract-analysis') },
    { id: 'create-incident', group: 'quick', icon: '🚨', iconBg: 'bg-red-500/20', labelKey: 'cmd.create_incident', handler: () => this.go('/incident-reporting') },
    { id: 'bulk-import', group: 'quick', icon: '📥', iconBg: 'bg-violet-500/20', labelKey: 'cmd.bulk_import', handler: () => this.go('/bulk-import') },
    { id: 'toggle-lang', group: 'quick', icon: '🌐', iconBg: 'bg-blue-500/20', labelKey: 'cmd.toggle_lang', handler: () => { this.lang.toggle(); this.close(); } },
    { id: 'toggle-theme', group: 'quick', icon: '🎨', iconBg: 'bg-amber-500/20', labelKey: 'cmd.toggle_theme', handler: () => { this.themeService.toggle(); this.close(); } },
  ];

  // Navigation actions
  navActions: CommandAction[] = [
    { id: 'nav-dashboard', group: 'nav', icon: '📊', iconBg: 'bg-blue-50', labelKey: 'cmd.go_dashboard', handler: () => this.go('/dashboard') },
    { id: 'nav-assessment', group: 'nav', icon: '📋', iconBg: 'bg-blue-600/15', labelKey: 'cmd.go_assessment', handler: () => this.go('/assessment') },
    { id: 'nav-contracts', group: 'nav', icon: '📄', iconBg: 'bg-blue-50', labelKey: 'cmd.go_contracts', handler: () => this.go('/workspace') },
    { id: 'nav-remediation', group: 'nav', icon: '✅', iconBg: 'bg-amber-500/15', labelKey: 'cmd.go_remediation', handler: () => this.go('/remediation') },
    { id: 'nav-evidence', group: 'nav', icon: '📁', iconBg: 'bg-violet-500/15', labelKey: 'cmd.go_evidence', handler: () => this.go('/evidence-vault') },
    { id: 'nav-incidents', group: 'nav', icon: '🚨', iconBg: 'bg-red-500/15', labelKey: 'cmd.go_incidents', handler: () => this.go('/incident-reporting') },
    { id: 'nav-roi', group: 'nav', icon: '📒', iconBg: 'bg-blue-500/15', labelKey: 'cmd.go_roi', handler: () => this.go('/roi') },
    { id: 'nav-supply', group: 'nav', icon: '🔗', iconBg: 'bg-teal-500/15', labelKey: 'cmd.go_supply', handler: () => this.go('/supply-chain') },
    { id: 'nav-autopilot', group: 'nav', icon: '🤖', iconBg: 'bg-purple-500/15', labelKey: 'cmd.go_autopilot', handler: () => this.go('/autopilot') },
    { id: 'nav-settings', group: 'nav', icon: '⚙️', iconBg: 'bg-slate-500/15', labelKey: 'cmd.go_settings', handler: () => this.go('/settings/branding') },
  ];

  // Filtered matching actions when user types
  matchingActions = computed(() => {
    if (this.query.length < 2) return [];
    const q = this.query.toLowerCase();
    const all = [...this.quickActions, ...this.navActions];
    return all.filter(a => {
      const label = this.lang.t(a.labelKey).toLowerCase();
      return label.includes(q) || a.id.includes(q);
    });
  });

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      switchMap(q => {
        if (q.length < 2) return of([]);
        this.loading.set(true);
        return this.api.globalSearch(q);
      })
    ).subscribe({
      next: (results) => {
        this.results.set(results);
        this.loading.set(false);
        this.selectedIndex.set(this.matchingActions().length);
      },
      error: () => this.loading.set(false)
    });
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      this.isOpen.set(!this.isOpen());
      if (this.isOpen()) {
        this.query = '';
        this.results.set([]);
        this.selectedIndex.set(0);
      }
    }
  }

  onQueryChange(q: string) {
    this.selectedIndex.set(0);
    this.searchSubject.next(q);
  }

  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const max = this.getTotalItemCount() - 1;
      this.selectedIndex.set(Math.min(this.selectedIndex() + 1, max));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex.set(Math.max(this.selectedIndex() - 1, 0));
    } else if (e.key === 'Enter') {
      this.handleEnter();
    }
  }

  private handleEnter(): void {
    const idx = this.selectedIndex();
    if (this.query.length < 2) {
      // In empty state: quick actions + nav actions
      const allActions = [...this.quickActions, ...this.navActions];
      if (idx < allActions.length) {
        allActions[idx].handler();
        return;
      }
    } else {
      // Matching actions first, then API results
      const matching = this.matchingActions();
      if (idx < matching.length) {
        matching[idx].handler();
        return;
      }
      const apiIdx = idx - matching.length;
      const all = this.results();
      if (apiIdx < all.length) {
        this.saveRecentSearch(this.query);
        this.navigate(all[apiIdx].url);
      }
    }
  }

  private getTotalItemCount(): number {
    if (this.query.length < 2) {
      return this.quickActions.length + this.navActions.length;
    }
    return this.matchingActions().length + this.results().length;
  }

  close() {
    this.isOpen.set(false);
    this.query = '';
    this.results.set([]);
  }

  private go(path: string) {
    this.close();
    this.router.navigateByUrl(path);
  }

  navigate(url: string) {
    this.saveRecentSearch(this.query);
    this.close();
    this.router.navigateByUrl(url);
  }

  executeAction(action: CommandAction) {
    action.handler();
  }

  useRecentSearch(search: string) {
    this.query = search;
    this.onQueryChange(search);
  }

  // Recent searches persistence
  private loadRecentSearches(): string[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('dora_recent_searches') || '[]').slice(0, 5);
    } catch { return []; }
  }

  private saveRecentSearch(q: string) {
    if (!q || q.length < 2 || typeof localStorage === 'undefined') return;
    const existing = this.loadRecentSearches().filter(s => s !== q);
    const updated = [q, ...existing].slice(0, 5);
    localStorage.setItem('dora_recent_searches', JSON.stringify(updated));
    this.recentSearches.set(updated);
  }

  clearRecentSearches() {
    if (typeof localStorage !== 'undefined') localStorage.removeItem('dora_recent_searches');
    this.recentSearches.set([]);
  }

  groupedResults(): { type: string; label: string; items: SearchResult[] }[] {
    const groups: { [key: string]: SearchResult[] } = {};
    for (const r of this.results()) {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    }
    const labels: { [key: string]: string } = {
      assessment: 'Assessments', contract: 'Contracts', remediation: 'Remediation',
      evidence: 'Evidence', incident: 'Incidents', roi: 'Register of Information'
    };
    return Object.entries(groups).map(([type, items]) => ({
      type, label: labels[type] || type, items
    }));
  }

  getGlobalIndex(group: { type: string }, localIndex: number): number {
    const offset = this.matchingActions().length;
    const groups = this.groupedResults();
    let index = offset;
    for (const g of groups) {
      if (g.type === group.type) return index + localIndex;
      index += g.items.length;
    }
    return index + localIndex;
  }

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      assessment: 'A', contract: 'C', remediation: 'R',
      evidence: 'E', incident: 'I', roi: 'Ro'
    };
    return icons[type] || '?';
  }

  getTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      assessment: 'bg-blue-600/20 text-blue-500',
      contract: 'bg-blue-100 text-blue-600',
      remediation: 'bg-amber-500/20 text-amber-400',
      evidence: 'bg-violet-500/20 text-violet-400',
      incident: 'bg-red-500/20 text-red-400',
      roi: 'bg-blue-500/20 text-blue-400'
    };
    return colors[type] || 'bg-slate-500/20 text-slate-400';
  }
}
