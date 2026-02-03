import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';
import { NegotiationResult, NegotiationItemResult, NegotiationMessageResult } from '../models';

@Component({
  selector: 'app-negotiation-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Loading -->
    <div *ngIf="loading" class="text-center py-20">
      <div class="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-slate-700 border-t-violet-400 animate-spin"></div>
    </div>

    <div *ngIf="neg" class="max-w-5xl mx-auto space-y-6">

      <!-- Back + Header -->
      <a routerLink="/negotiations" class="text-sm text-slate-500 hover:text-violet-400 transition-colors">
        &larr; {{ lang.t('neg.back') }}
      </a>

      <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
        <div class="flex items-center justify-between mb-2">
          <h1 class="text-2xl font-bold text-white">{{ neg.contractName }}</h1>
          <span [class]="overallBadge(neg.overallStatus)">{{ overallLabel(neg.overallStatus) }}</span>
        </div>
        <p class="text-slate-500 text-sm mb-4">{{ neg.companyName }}
          <span *ngIf="neg.vendorType"> &middot; {{ neg.vendorType }}</span>
        </p>

        <!-- Progress -->
        <div class="flex items-center gap-4 mb-4">
          <div class="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all"
                 [style.width.%]="neg.totalItems > 0 ? (neg.resolvedItems / neg.totalItems) * 100 : 0"></div>
          </div>
          <span class="text-sm text-slate-400">{{ neg.resolvedItems }}/{{ neg.totalItems }}</span>
        </div>

        <!-- Strategy section -->
        <div *ngIf="neg.strategySummary" class="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4 mb-4">
          <h3 class="text-sm font-semibold text-violet-400 mb-2">{{ lang.t('neg.strategy') }}</h3>
          <p class="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{{ neg.strategySummary }}</p>
        </div>

        <!-- Action buttons -->
        <div class="flex flex-wrap gap-3">
          <button (click)="generateStrategy()" [disabled]="strategyLoading"
                  class="px-4 py-2 rounded-lg bg-violet-500/20 text-violet-400 border border-violet-500/30 text-sm font-medium
                         hover:bg-violet-500/30 transition-all disabled:opacity-50">
            {{ strategyLoading ? lang.t('neg.generating') : lang.t('neg.generate_strategy') }}
          </button>
          <button (click)="generateEmail()" [disabled]="emailLoading"
                  class="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-sm font-medium
                         hover:bg-cyan-500/30 transition-all disabled:opacity-50">
            {{ emailLoading ? lang.t('neg.generating') : lang.t('neg.generate_email') }}
          </button>
        </div>
      </div>

      <!-- Email draft -->
      <div *ngIf="emailDraft" class="bg-slate-800/50 backdrop-blur border border-cyan-500/30 rounded-2xl overflow-hidden">
        <div class="px-5 py-3 bg-cyan-500/10 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-cyan-400">{{ lang.t('neg.email_draft') }}</h3>
          <button (click)="copyEmail()" class="px-3 py-1 rounded-lg text-xs font-medium bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-all">
            {{ copied ? lang.t('neg.copied') : lang.t('neg.copy') }}
          </button>
        </div>
        <div class="p-5">
          <p class="text-xs text-slate-500 mb-1">{{ emailDraft.subject }}</p>
          <pre class="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{{ emailDraft.body }}</pre>
        </div>
      </div>

      <!-- Items list -->
      <div>
        <h2 class="text-lg font-semibold text-white mb-4">{{ lang.t('neg.items') }} ({{ neg.items.length }})</h2>

        <div *ngFor="let item of neg.items; let i = index"
             class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl mb-3 overflow-hidden">

          <!-- Item header -->
          <div class="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-700/20 transition-colors"
               (click)="toggleItem(item.id)">
            <div class="flex items-center gap-3 min-w-0">
              <span class="text-slate-500 text-sm font-mono">{{ item.priority }}.</span>
              <span class="text-slate-300 text-sm whitespace-nowrap">{{ item.articleReference }}</span>
              <span class="text-slate-400 text-sm truncate">{{ item.requirementText }}</span>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0 ml-2">
              <span [class]="severityBadge(item.gapSeverity)">{{ item.gapSeverity }}</span>
              <span [class]="itemStatusBadge(item.status)">{{ itemStatusLabel(item.status) }}</span>
              <svg [class]="'w-4 h-4 text-slate-500 transition-transform ' + (expandedItem === item.id ? 'rotate-180' : '')"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
          </div>

          <!-- Expanded detail -->
          <div *ngIf="expandedItem === item.id" class="px-5 py-4 border-t border-slate-700/30 space-y-4">

            <!-- Strategy -->
            <div *ngIf="item.strategy">
              <p class="text-xs font-semibold text-violet-400 uppercase mb-1">{{ lang.t('neg.strategy') }}</p>
              <p class="text-sm text-slate-300">{{ item.strategy }}</p>
            </div>

            <!-- Suggested clause -->
            <div *ngIf="item.suggestedClause" class="bg-slate-700/30 rounded-lg p-3">
              <p class="text-xs font-semibold text-slate-500 uppercase mb-1">{{ lang.t('neg.suggested_clause') }}</p>
              <p class="text-sm text-slate-400 leading-relaxed">{{ item.suggestedClause }}</p>
            </div>

            <!-- Status buttons -->
            <div class="flex flex-wrap gap-2">
              <button *ngFor="let s of statuses" (click)="updateStatus(item, s)"
                      [class]="'px-3 py-1.5 rounded-lg text-xs font-medium transition-all ' +
                        (item.status === s ? 'bg-violet-500/30 text-violet-300 border border-violet-500/40' : 'bg-slate-700/30 text-slate-500 border border-slate-600/30 hover:text-slate-300')">
                {{ itemStatusLabel(s) }}
              </button>
            </div>

            <!-- Item messages -->
            <div *ngIf="item.messages && item.messages.length > 0" class="space-y-2 pt-2 border-t border-slate-700/30">
              <div *ngFor="let msg of item.messages"
                   [class]="'p-3 rounded-lg text-sm ' + (msg.direction === 'OUTBOUND' ? 'bg-cyan-500/5 border border-cyan-500/10' : 'bg-slate-700/30')">
                <p class="text-xs text-slate-500 mb-1">{{ msg.subject }} &middot; {{ msg.createdAt | date:'dd.MM HH:mm' }}</p>
                <p class="text-slate-300 whitespace-pre-line">{{ msg.body }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class NegotiationDetailComponent implements OnInit {
  neg: NegotiationResult | null = null;
  loading = true;
  strategyLoading = false;
  emailLoading = false;
  emailDraft: NegotiationMessageResult | null = null;
  copied = false;
  expandedItem: string | null = null;

  statuses = ['PENDING', 'DRAFTED', 'SENT', 'RESPONDED', 'AGREED', 'REJECTED'];

  constructor(
    public lang: LangService,
    private api: ApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loadNegotiation(id);
  }

  loadNegotiation(id: string) {
    this.api.getNegotiation(id).subscribe({
      next: (neg) => {
        this.neg = neg;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  generateStrategy() {
    if (!this.neg) return;
    this.strategyLoading = true;
    this.api.generateStrategy(this.neg.id).subscribe({
      next: (updated) => {
        this.neg = updated;
        this.strategyLoading = false;
      },
      error: () => { this.strategyLoading = false; }
    });
  }

  generateEmail() {
    if (!this.neg) return;
    this.emailLoading = true;
    this.api.generateEmail(this.neg.id).subscribe({
      next: (msg) => {
        this.emailDraft = msg;
        this.emailLoading = false;
      },
      error: () => { this.emailLoading = false; }
    });
  }

  copyEmail() {
    if (!this.emailDraft) return;
    const text = (this.emailDraft.subject || '') + '\n\n' + this.emailDraft.body;
    navigator.clipboard.writeText(text).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    });
  }

  toggleItem(id: string) {
    this.expandedItem = this.expandedItem === id ? null : id;
  }

  updateStatus(item: NegotiationItemResult, newStatus: string) {
    if (item.status === newStatus) return;
    this.api.updateItemStatus(item.id, newStatus).subscribe({
      next: () => {
        (item as any).status = newStatus;
        // Recalculate resolved count
        if (this.neg) {
          this.neg = {
            ...this.neg,
            resolvedItems: this.neg.items.filter(i => i.status === 'AGREED').length
          };
        }
      }
    });
  }

  overallBadge(status: string): string {
    const base = 'px-2.5 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'DRAFT': return base + ' bg-slate-500/20 text-slate-400';
      case 'IN_PROGRESS': return base + ' bg-violet-500/20 text-violet-400';
      case 'COMPLETED': return base + ' bg-emerald-500/20 text-emerald-400';
      default: return base + ' bg-yellow-500/20 text-yellow-400';
    }
  }

  overallLabel(status: string): string {
    return this.lang.t('neg.overall_' + status.toLowerCase());
  }

  severityBadge(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20';
      case 'HIGH': return 'px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      default: return 'px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
  }

  itemStatusBadge(status: string): string {
    const base = 'px-2 py-0.5 rounded-full text-xs font-medium';
    switch (status) {
      case 'AGREED': return base + ' bg-emerald-500/20 text-emerald-400';
      case 'REJECTED': return base + ' bg-red-500/20 text-red-400';
      case 'SENT': return base + ' bg-cyan-500/20 text-cyan-400';
      case 'RESPONDED': return base + ' bg-violet-500/20 text-violet-400';
      case 'DRAFTED': return base + ' bg-yellow-500/20 text-yellow-400';
      default: return base + ' bg-slate-500/20 text-slate-400';
    }
  }

  itemStatusLabel(status: string): string {
    return this.lang.t('neg.status_' + status.toLowerCase());
  }
}
