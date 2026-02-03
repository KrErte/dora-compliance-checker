import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';
import { NegotiationResult } from '../models';

@Component({
  selector: 'app-negotiation-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-white">{{ lang.t('neg.title') }}</h1>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="text-center py-20">
        <div class="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-slate-700 border-t-emerald-400 animate-spin"></div>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && negotiations.length === 0" class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
        <svg class="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
        <p class="text-slate-400 mb-4">{{ lang.t('neg.empty') }}</p>
        <a routerLink="/contract-analysis"
           class="inline-block px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-sm">
          {{ lang.t('nav.contract_audit') }}
        </a>
      </div>

      <!-- Negotiation cards -->
      <a *ngFor="let neg of negotiations" [routerLink]="['/negotiations', neg.id]"
         class="block bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-5 hover:border-violet-500/30 transition-all group">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="text-white font-semibold group-hover:text-violet-400 transition-colors">{{ neg.contractName }}</h3>
            <p class="text-slate-500 text-sm">{{ neg.companyName }}</p>
          </div>
          <span [class]="overallStatusBadge(neg.overallStatus)">
            {{ overallStatusLabel(neg.overallStatus) }}
          </span>
        </div>

        <!-- Progress bar -->
        <div class="mb-2">
          <div class="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{{ lang.t('neg.progress') }}</span>
            <span>{{ neg.resolvedItems }}/{{ neg.totalItems }}</span>
          </div>
          <div class="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                 [style.width.%]="neg.totalItems > 0 ? (neg.resolvedItems / neg.totalItems) * 100 : 0"></div>
          </div>
        </div>

        <div class="flex items-center gap-3 text-xs text-slate-500">
          <span *ngIf="neg.vendorType">{{ neg.vendorType }}</span>
          <span>{{ neg.totalItems }} {{ lang.t('neg.items').toLowerCase() }}</span>
          <span>{{ neg.createdAt | date:'dd.MM.yyyy' }}</span>
        </div>
      </a>
    </div>
  `
})
export class NegotiationListComponent implements OnInit {
  negotiations: NegotiationResult[] = [];
  loading = true;

  constructor(public lang: LangService, private api: ApiService) {}

  ngOnInit() {
    this.api.getNegotiations().subscribe({
      next: (list) => {
        this.negotiations = list;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  overallStatusBadge(status: string): string {
    const base = 'px-2.5 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'DRAFT': return base + ' bg-slate-500/20 text-slate-400';
      case 'IN_PROGRESS': return base + ' bg-violet-500/20 text-violet-400';
      case 'COMPLETED': return base + ' bg-emerald-500/20 text-emerald-400';
      case 'STALLED': return base + ' bg-yellow-500/20 text-yellow-400';
      default: return base + ' bg-slate-500/20 text-slate-400';
    }
  }

  overallStatusLabel(status: string): string {
    const key = 'neg.overall_' + status.toLowerCase();
    return this.lang.t(key);
  }
}
