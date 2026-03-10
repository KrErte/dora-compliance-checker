import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, SearchResult } from '../api.service';
import { Subject, debounceTime, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-[15vh]"
           (click)="close()">
        <div class="w-full max-w-xl bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
             (click)="$event.stopPropagation()">
          <div class="flex items-center gap-3 px-5 py-4 border-b border-slate-700/50">
            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input #searchInput type="text" [(ngModel)]="query" (ngModelChange)="onQueryChange($event)"
                   placeholder="Search assessments, contracts, evidence..."
                   class="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
                   (keydown)="onKeydown($event)" autofocus>
            <kbd class="px-2 py-0.5 rounded bg-slate-700 text-slate-400 text-[10px] font-mono">ESC</kbd>
          </div>

          <div class="max-h-[50vh] overflow-y-auto">
            @if (loading()) {
              <div class="px-5 py-8 text-center">
                <div class="w-6 h-6 mx-auto rounded-full border-2 border-slate-700 border-t-emerald-400 animate-spin"></div>
              </div>
            }

            @if (!loading() && results().length === 0 && query.length >= 2) {
              <div class="px-5 py-8 text-center text-slate-500 text-sm">No results found</div>
            }

            @if (!loading() && results().length > 0) {
              @for (group of groupedResults(); track group.type) {
                <div class="px-3 pt-3 pb-1">
                  <div class="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{{ group.label }}</div>
                  @for (item of group.items; track item.url + item.title; let i = $index) {
                    <button (click)="navigate(item.url)"
                            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-700/50 transition-colors text-left group"
                            [class.bg-slate-700/30]="selectedIndex() === getGlobalIndex(group, i)">
                      <div class="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                           [class]="getTypeColor(group.type)">
                        {{ getTypeIcon(group.type) }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm text-white truncate">{{ item.title }}</div>
                        <div class="text-[11px] text-slate-500 truncate">{{ item.snippet }}</div>
                      </div>
                    </button>
                  }
                </div>
              }
            }
          </div>

          @if (query.length < 2) {
            <div class="px-5 py-6 text-center text-slate-500 text-sm">Type at least 2 characters to search</div>
          }

          <div class="px-4 py-2.5 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-500">
            <span><kbd class="px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 font-mono mr-1">&uarr;&darr;</kbd> Navigate</span>
            <span><kbd class="px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 font-mono mr-1">Enter</kbd> Open</span>
          </div>
        </div>
      </div>
    }
  `
})
export class GlobalSearchComponent {
  isOpen = signal(false);
  query = '';
  results = signal<SearchResult[]>([]);
  loading = signal(false);
  selectedIndex = signal(0);

  private searchSubject = new Subject<string>();

  constructor(private api: ApiService, private router: Router) {
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
        this.selectedIndex.set(0);
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
      }
    }
  }

  onQueryChange(q: string) {
    this.searchSubject.next(q);
  }

  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const max = this.results().length - 1;
      this.selectedIndex.set(Math.min(this.selectedIndex() + 1, max));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex.set(Math.max(this.selectedIndex() - 1, 0));
    } else if (e.key === 'Enter') {
      const all = this.results();
      if (all.length > 0 && this.selectedIndex() < all.length) {
        this.navigate(all[this.selectedIndex()].url);
      }
    }
  }

  close() {
    this.isOpen.set(false);
    this.query = '';
    this.results.set([]);
  }

  navigate(url: string) {
    this.close();
    this.router.navigateByUrl(url);
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
    const groups = this.groupedResults();
    let index = 0;
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
      assessment: 'bg-cyan-500/20 text-cyan-400',
      contract: 'bg-emerald-500/20 text-emerald-400',
      remediation: 'bg-amber-500/20 text-amber-400',
      evidence: 'bg-violet-500/20 text-violet-400',
      incident: 'bg-red-500/20 text-red-400',
      roi: 'bg-blue-500/20 text-blue-400'
    };
    return colors[type] || 'bg-slate-500/20 text-slate-400';
  }
}
