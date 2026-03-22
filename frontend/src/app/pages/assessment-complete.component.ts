import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { LangService } from '../lang.service';
import { ApiService } from '../api.service';
import { SubscriptionService } from '../services/subscription.service';
import { AssessmentResult } from '../models';

@Component({
  selector: 'app-assessment-complete',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center px-4">
      <div class="max-w-lg w-full text-center">

        <!-- Checkmark animation -->
        <div class="mx-auto mb-8 relative w-24 h-24 animate-scale-in">
          <svg class="w-24 h-24" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#065f46" stroke-width="3" opacity="0.3"/>
            <circle cx="50" cy="50" r="45" fill="none"
                    stroke="#2563eb" stroke-width="3" stroke-linecap="round"
                    stroke-dasharray="282.74" class="animate-draw-circle"/>
            <path d="M30 52 L44 66 L70 38" fill="none"
                  stroke="#2563eb" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"
                  stroke-dasharray="60" stroke-dashoffset="60"
                  class="checkmark-draw"/>
          </svg>
        </div>

        <!-- Heading -->
        <h1 class="text-3xl md:text-4xl font-extrabold mb-3 animate-fade-in-up">
          <span class="gradient-text">{{ lang.t('complete.heading') }}</span>
        </h1>

        <!-- Summary card -->
        <div *ngIf="result" class="glass-card p-5 mb-8 animate-fade-in-up" style="animation-delay: 200ms">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="text-left">
              <p class="text-slate-500 text-xs mb-0.5">{{ lang.t('complete.company') }}</p>
              <p class="text-slate-700 font-medium">{{ result.companyName }}</p>
            </div>
            <div class="text-left">
              <p class="text-slate-500 text-xs mb-0.5">{{ lang.t('complete.date') }}</p>
              <p class="text-slate-700 font-medium">{{ formattedDate }}</p>
            </div>
            <div class="text-left">
              <p class="text-slate-500 text-xs mb-0.5">{{ lang.t('complete.questions') }}</p>
              <p class="text-slate-700 font-medium">{{ result.totalQuestions }}</p>
            </div>
            <div class="text-left">
              <p class="text-slate-500 text-xs mb-0.5">{{ lang.t('complete.score') }}</p>
              <p class="font-bold" [style.color]="scoreColor">{{ result.scorePercentage | number:'1.0-0' }}%</p>
            </div>
          </div>
        </div>

        <!-- Loading state -->
        <div *ngIf="!result && !error" class="mb-8 animate-fade-in">
          <div class="inline-block w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>

        <!-- Action buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6 animate-fade-in-up" style="animation-delay: 400ms">
          <a *ngIf="result" [routerLink]="['/results', result.id]"
             class="inline-flex items-center gap-2 bg-blue-600
                    hover:bg-blue-700 text-slate-900 font-bold
                    px-6 py-3 rounded-xl transition-all duration-300
                    hover:shadow-lg hover:shadow-lg text-sm w-full sm:w-auto justify-center">
            {{ lang.t('complete.view_results') }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </a>
          <button *ngIf="result" type="button" (click)="downloadPdf()"
                  [disabled]="downloading"
                  class="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-50 text-slate-700
                         font-semibold px-6 py-3 rounded-xl transition-all duration-200 text-sm
                         w-full sm:w-auto justify-center">
            <svg *ngIf="!downloading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span *ngIf="downloading" class="w-4 h-4 border-2 border-slate-400/30 border-t-slate-200 rounded-full animate-spin"></span>
            {{ lang.t('complete.download_pdf') }}
          </button>
        </div>

        <!-- Dashboard link -->
        <a routerLink="/dashboard"
           class="text-sm text-slate-500 hover:text-blue-600 transition-colors duration-200 animate-fade-in-up inline-flex items-center gap-1.5"
           style="animation-delay: 500ms">
          {{ lang.t('complete.go_dashboard') }}
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .checkmark-draw {
      animation: checkmark-stroke 0.6s ease-out 0.8s forwards;
    }
    @keyframes checkmark-stroke {
      to { stroke-dashoffset: 0; }
    }
  `]
})
export class AssessmentCompleteComponent implements OnInit {
  lang = inject(LangService);
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private subscriptionService = inject(SubscriptionService);
  private platformId = inject(PLATFORM_ID);

  result: AssessmentResult | null = null;
  error = false;
  downloading = false;

  get formattedDate(): string {
    if (!this.result?.assessmentDate) return '';
    const d = new Date(this.result.assessmentDate);
    return d.toLocaleDateString(this.lang.currentLang === 'en' ? 'en-GB' : 'et-EE', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  get scoreColor(): string {
    if (!this.result) return '#94a3b8';
    if (this.result.scorePercentage >= 80) return '#34d399';
    if (this.result.scorePercentage >= 50) return '#fbbf24';
    return '#f87171';
  }

  ngOnInit() {
    const id = this.route.snapshot.queryParamMap.get('id');
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.api.getAssessment(id).subscribe({
      next: (result) => this.result = result,
      error: () => {
        this.error = true;
        this.router.navigate(['/dashboard']);
      }
    });
  }

  downloadPdf() {
    if (!this.result || this.downloading) return;

    if (!this.subscriptionService.canAccess('PDF_EXPORT')) {
      this.subscriptionService.showUpgrade('PDF_EXPORT');
      return;
    }

    this.downloading = true;
    this.api.exportAssessmentPdf(this.result.id).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `dora-report-${this.result!.companyName || 'assessment'}.pdf`);
        this.downloading = false;
      },
      error: () => {
        if (isPlatformBrowser(this.platformId)) window.print();
        this.downloading = false;
      }
    });
  }

  private downloadBlob(blob: Blob, filename: string) {
    if (!isPlatformBrowser(this.platformId)) return;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
