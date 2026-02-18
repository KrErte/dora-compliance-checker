import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="skip()"></div>

      <!-- Modal -->
      <div class="relative w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl p-8 text-center">
        <!-- Icon -->
        <div class="w-16 h-16 mx-auto mb-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>

        <h2 class="text-xl font-bold text-white mb-2">{{ lang.t('onboarding.title') }}</h2>
        <p class="text-sm text-slate-400 mb-8 leading-relaxed">{{ lang.t('onboarding.subtitle') }}</p>

        <!-- Primary CTA -->
        <button (click)="goToContractAnalysis()"
                class="w-full py-3 px-6 rounded-xl font-semibold text-slate-900 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 transition-all flex items-center justify-center gap-2 mb-3">
          {{ lang.t('onboarding.cta_upload') }}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
        </button>

        <!-- Secondary -->
        <button (click)="skip()"
                class="w-full py-3 px-6 rounded-xl font-medium text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 transition-all">
          {{ lang.t('onboarding.cta_skip') }}
        </button>
      </div>
    </div>
  `
})
export class OnboardingComponent {
  @Input() isOverlay = false;
  @Output() completed = new EventEmitter<void>();

  constructor(
    public lang: LangService,
    private router: Router
  ) {}

  goToContractAnalysis(): void {
    localStorage.setItem('onboarding_complete', 'true');
    if (this.isOverlay) {
      this.completed.emit();
    }
    this.router.navigate(['/contract-analysis']);
  }

  skip(): void {
    localStorage.setItem('onboarding_complete', 'true');
    if (this.isOverlay) {
      this.completed.emit();
    }
  }
}
