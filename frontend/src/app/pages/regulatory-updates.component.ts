import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';
import { RegulatoryUpdate } from '../models';

@Component({
  selector: 'app-regulatory-updates',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <a routerLink="/guardian" class="text-sm text-slate-500 hover:text-emerald-400 transition-colors mb-2 inline-block">
          &larr; {{ lang.t('guardian.back') }}
        </a>
        <h1 class="text-2xl font-bold text-white flex items-center gap-3">
          <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
          </svg>
          {{ lang.t('guardian.reg_updates') }}
        </h1>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="text-center py-16">
        <div class="w-10 h-10 mx-auto mb-3 rounded-full border-4 border-slate-700 border-t-blue-400 animate-spin"></div>
      </div>

      <!-- Empty -->
      <div *ngIf="!loading && updates.length === 0" class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
        <svg class="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
        </svg>
        <p class="text-slate-400">{{ lang.t('guardian.reg_empty') }}</p>
      </div>

      <!-- Updates list -->
      <div *ngIf="!loading && updates.length > 0" class="space-y-4">
        <div *ngFor="let update of updates"
             class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-all">
          <div class="flex items-start gap-4">
            <!-- Relevance indicator -->
            <div [class]="'flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center ' + relevanceBg(update.relevanceScore)">
              <span [class]="'text-sm font-bold ' + relevanceText(update.relevanceScore)">
                {{ (update.relevanceScore * 100) | number:'1.0-0' }}
              </span>
              <span class="text-[8px] text-slate-500">%</span>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <h3 class="text-white font-semibold text-sm">{{ update.title }}</h3>
                <span [class]="statusTag(update.status)">{{ update.status }}</span>
              </div>
              <p *ngIf="update.summary" class="text-sm text-slate-400 mb-2 line-clamp-2">{{ update.summary }}</p>
              <div class="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                <span>{{ lang.t('guardian.reg_source') }}: {{ update.source }}</span>
                <span *ngIf="update.publishedDate">{{ update.publishedDate | date:'dd.MM.yyyy' }}</span>
                <span *ngIf="update.affectedArticles">{{ lang.t('guardian.reg_affected') }}: {{ update.affectedArticles }}</span>
                <a *ngIf="update.url" [href]="update.url" target="_blank" rel="noopener"
                   class="text-blue-400 hover:text-blue-300 transition-colors">
                  Link &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegulatoryUpdatesComponent implements OnInit {
  updates: RegulatoryUpdate[] = [];
  loading = true;

  constructor(public lang: LangService, private api: ApiService) {}

  ngOnInit() {
    this.api.getRegulatoryUpdates().subscribe({
      next: (updates) => {
        this.updates = updates;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  relevanceBg(score: number): string {
    if (score >= 0.7) return 'bg-red-500/10 border border-red-500/20';
    if (score >= 0.3) return 'bg-yellow-500/10 border border-yellow-500/20';
    return 'bg-slate-500/10 border border-slate-500/20';
  }

  relevanceText(score: number): string {
    if (score >= 0.7) return 'text-red-400';
    if (score >= 0.3) return 'text-yellow-400';
    return 'text-slate-400';
  }

  statusTag(status: string): string {
    switch (status) {
      case 'RELEVANT': return 'px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400';
      case 'POTENTIALLY_RELEVANT': return 'px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-500/10 text-yellow-400';
      case 'NEW': return 'px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400';
      default: return 'px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-500/10 text-slate-400';
    }
  }
}
