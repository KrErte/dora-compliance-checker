import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { VendorQuestionnaireService, VendorQuestionnaire, QuestionnaireQuestion } from '../services/vendor-questionnaire.service';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-vendor-questionnaire-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pt-24 pb-16 px-4">
      <div class="max-w-5xl mx-auto">
        <div class="flex items-center justify-between mb-8">
          <div>
            <a routerLink="/command-center" class="text-sm text-slate-500 hover:text-blue-600 transition-colors">&larr; {{ lang.t('vq.back') }}</a>
            <h1 class="text-2xl font-bold text-slate-900 mt-1">{{ lang.t('vq.title') }}</h1>
            <p class="text-sm text-slate-400 mt-1">{{ lang.t('vq.subtitle') }}</p>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-4 mb-8">
          <div class="glass-card p-4 text-center">
            <div class="text-2xl font-bold text-amber-400">{{ stats.pending }}</div>
            <div class="text-xs text-slate-400">{{ lang.t('vq.pending') }}</div>
          </div>
          <div class="glass-card p-4 text-center">
            <div class="text-2xl font-bold text-blue-400">{{ stats.submitted }}</div>
            <div class="text-xs text-slate-400">{{ lang.t('vq.submitted') }}</div>
          </div>
          <div class="glass-card p-4 text-center">
            <div class="text-2xl font-bold text-blue-600">{{ stats.reviewed }}</div>
            <div class="text-xs text-slate-400">{{ lang.t('vq.reviewed') }}</div>
          </div>
        </div>

        <!-- Send new questionnaire -->
        <div class="glass-card p-6 mb-8">
          <h2 class="text-lg font-semibold text-slate-900 mb-4">{{ lang.t('vq.send_new') }}</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm text-slate-400 mb-1">{{ lang.t('vq.vendor_name') }}</label>
              <input type="text" [(ngModel)]="newVendorName" [placeholder]="lang.t('vq.vendor_placeholder')"
                     class="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900">
            </div>
            <div>
              <label class="block text-sm text-slate-400 mb-1">{{ lang.t('vq.vendor_email') }}</label>
              <input type="email" [(ngModel)]="newVendorEmail" placeholder="vendor@example.com"
                     class="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900">
            </div>
            <div class="flex items-end">
              <button (click)="sendQuestionnaire()" [disabled]="!newVendorName || !newVendorEmail || sending"
                      class="w-full px-6 py-2.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-30 disabled:cursor-not-allowed">
                {{ sending ? lang.t('vq.sending') : lang.t('vq.send_btn') }}
              </button>
            </div>
          </div>
          @if (sendSuccess) {
            <p class="text-sm text-blue-600 mt-3">{{ lang.t('vq.send_success') }}</p>
          }
        </div>

        <!-- Questionnaire list -->
        @if (questionnaires.length) {
          <div class="space-y-4">
            @for (q of questionnaires; track q.id) {
              <div class="glass-card p-5">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center"
                         [class]="q.status === 'SUBMITTED' ? 'bg-blue-500/20 text-blue-400' : (q.status === 'REVIEWED' ? 'bg-blue-100 text-blue-600' : 'bg-amber-500/20 text-amber-400')">
                      {{ q.status === 'SUBMITTED' ? '&#9993;' : (q.status === 'REVIEWED' ? '&#10003;' : '&#9200;') }}
                    </div>
                    <div>
                      <h3 class="font-medium text-slate-900">{{ q.vendorName }}</h3>
                      <p class="text-xs text-slate-500">{{ q.vendorEmail }} &middot; {{ lang.t('vq.sent') }} {{ q.createdAt | date:'mediumDate' }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    @if (q.riskScore !== null && q.riskScore !== undefined) {
                      <div class="text-center">
                        <div class="text-lg font-bold" [class]="q.riskScore <= 30 ? 'text-blue-600' : (q.riskScore <= 60 ? 'text-amber-400' : 'text-red-400')">
                          {{ q.riskScore }}
                        </div>
                        <div class="text-[10px] text-slate-500">{{ lang.t('vq.risk_score') }}</div>
                      </div>
                    }
                    <span class="px-3 py-1 rounded-full text-xs font-medium"
                          [class]="q.status === 'SUBMITTED' ? 'bg-blue-500/20 text-blue-400' : (q.status === 'REVIEWED' ? 'bg-blue-100 text-blue-600' : 'bg-amber-500/20 text-amber-400')">
                      {{ q.status === 'PENDING' ? lang.t('vq.pending') : (q.status === 'SUBMITTED' ? lang.t('vq.submitted') : lang.t('vq.reviewed')) }}
                    </span>
                    @if (q.status === 'PENDING') {
                      <button (click)="resend(q)" class="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-900 rounded-lg text-xs">
                        {{ lang.t('vq.resend') }}
                      </button>
                    }
                    @if (q.status === 'SUBMITTED') {
                      <button (click)="viewResponses(q)" class="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs">
                        {{ lang.t('vq.view') }}
                      </button>
                      <button (click)="markReviewed(q)" class="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs">
                        {{ lang.t('vq.mark_reviewed') }}
                      </button>
                    }
                    @if (q.status === 'REVIEWED') {
                      <button (click)="viewResponses(q)" class="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-900 rounded-lg text-xs">
                        {{ lang.t('vq.view') }}
                      </button>
                    }
                  </div>
                </div>

                <!-- Expanded responses -->
                @if (expandedId === q.id && q.responses) {
                  <div class="mt-4 pt-4 border-t border-slate-200">
                    <h4 class="text-sm font-semibold text-slate-600 mb-3">{{ lang.t('vq.responses') }}</h4>
                    <div class="space-y-2 max-h-96 overflow-y-auto">
                      @for (r of parseResponses(q.responses); track r.id) {
                        <div class="flex items-start justify-between gap-4 p-3 rounded-lg bg-slate-100/30">
                          <div class="flex-1">
                            <span class="text-[10px] text-slate-500 font-mono">{{ r.id }}</span>
                            <p class="text-sm text-slate-600">{{ r.text || r.id }}</p>
                          </div>
                          <span class="px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap"
                                [class]="r.answer === 'yes' ? 'bg-blue-100 text-blue-600' : (r.answer === 'partial' ? 'bg-amber-500/20 text-amber-400' : (r.answer === 'no' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'))">
                            {{ r.answer === 'yes' ? lang.t('vq.yes') : (r.answer === 'partial' ? lang.t('vq.partial') : (r.answer === 'no' ? lang.t('vq.no') : lang.t('vq.na'))) }}
                          </span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        } @else {
          <div class="glass-card p-8 text-center">
            <div class="text-4xl mb-3 opacity-30">&#128203;</div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">{{ lang.t('vq.empty_title') }}</h3>
            <p class="text-sm text-slate-400">{{ lang.t('vq.empty_desc') }}</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .glass-card {
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 12px;
      backdrop-filter: blur(12px);
    }
  `]
})
export class VendorQuestionnaireListComponent implements OnInit {
  questionnaires: VendorQuestionnaire[] = [];
  stats = { pending: 0, submitted: 0, reviewed: 0 };
  newVendorName = '';
  newVendorEmail = '';
  sending = false;
  sendSuccess = false;
  expandedId: string | null = null;

  constructor(public lang: LangService, private service: VendorQuestionnaireService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.service.list().subscribe(list => this.questionnaires = list);
    this.service.stats().subscribe(s => this.stats = s);
  }

  sendQuestionnaire() {
    this.sending = true;
    this.sendSuccess = false;
    this.service.create({
      vendorName: this.newVendorName,
      vendorEmail: this.newVendorEmail
    }).subscribe({
      next: () => {
        this.sending = false;
        this.sendSuccess = true;
        this.newVendorName = '';
        this.newVendorEmail = '';
        this.load();
        setTimeout(() => this.sendSuccess = false, 5000);
      },
      error: () => this.sending = false
    });
  }

  resend(q: VendorQuestionnaire) {
    this.service.resend(q.id).subscribe(() => this.load());
  }

  markReviewed(q: VendorQuestionnaire) {
    this.service.markReviewed(q.id).subscribe(() => this.load());
  }

  viewResponses(q: VendorQuestionnaire) {
    this.expandedId = this.expandedId === q.id ? null : q.id;
  }

  parseResponses(responsesJson: string): any[] {
    try {
      return JSON.parse(responsesJson);
    } catch {
      return [];
    }
  }
}
