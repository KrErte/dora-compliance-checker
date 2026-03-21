import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LangService } from '../lang.service';

interface OnboardingStep {
  icon: string;
  titleKey: string;
  descKey: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="skip()"></div>

      <!-- Modal -->
      <div class="relative w-full max-w-lg bg-slate-900 border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">

        <!-- Progress bar -->
        <div class="h-1 bg-slate-800">
          <div class="h-full bg-blue-600 transition-all duration-500"
               [style.width.%]="((currentStep + 1) / steps.length) * 100"></div>
        </div>

        <!-- Step indicator -->
        <div class="flex items-center justify-between px-8 pt-6">
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500">{{ lang.t('onboarding.step') }} {{ currentStep + 1 }} {{ lang.t('onboarding.of') }} {{ steps.length }}</span>
          </div>
          <button type="button" (click)="skip()"
                  class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors group"
                  [attr.aria-label]="lang.t('onboarding.skip')">
            <svg class="w-5 h-5 text-slate-500 group-hover:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Step content -->
        <div class="px-8 pt-5 pb-6">
          <!-- Step dots -->
          <div class="flex items-center justify-center gap-2 mb-6">
            <button *ngFor="let step of steps; let i = index" type="button"
                    (click)="currentStep = i"
                    [class]="i === currentStep
                      ? 'w-8 h-2 rounded-full bg-blue-600 transition-all duration-300'
                      : i < currentStep
                        ? 'w-2 h-2 rounded-full bg-blue-500 transition-all duration-300 hover:bg-blue-600/70'
                        : 'w-2 h-2 rounded-full bg-slate-700 transition-all duration-300 hover:bg-slate-600'">
            </button>
          </div>

          <!-- Icon -->
          <div class="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center text-3xl"
               [class]="'bg-' + steps[currentStep].color + '-500/10 border border-' + steps[currentStep].color + '-500/20'"
               [style.background]="getStepBg()"
               [style.border-color]="getStepBorder()">
            {{ steps[currentStep].icon }}
          </div>

          <!-- Title & Description -->
          <h2 class="text-xl font-bold text-white mb-3 text-center">{{ lang.t(steps[currentStep].titleKey) }}</h2>
          <p class="text-sm text-slate-400 text-center leading-relaxed mb-6">{{ lang.t(steps[currentStep].descKey) }}</p>

          <!-- Quick action link -->
          <button type="button" (click)="goToStep()"
                  class="w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2
                         bg-slate-800 border border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            {{ lang.t('onboarding.go') }}: {{ lang.t(steps[currentStep].titleKey) }}
          </button>
        </div>

        <!-- Navigation buttons -->
        <div class="px-8 pb-8 flex items-center gap-3">
          <button *ngIf="currentStep > 0" type="button" (click)="prev()"
                  class="px-5 py-2.5 rounded-xl text-sm font-medium bg-slate-800 border border-slate-200 text-slate-600
                         hover:bg-slate-700 hover:text-white transition-all duration-200">
            {{ lang.t('onboarding.prev') }}
          </button>
          <div class="flex-1"></div>
          <button *ngIf="currentStep < steps.length - 1" type="button" (click)="next()"
                  class="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-900 bg-blue-600
                         hover:bg-blue-700 hover:shadow-lg hover:shadow-lg transition-all duration-200
                         flex items-center gap-2">
            {{ lang.t('onboarding.next') }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </button>
          <button *ngIf="currentStep === steps.length - 1" type="button" (click)="finish()"
                  class="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-900 bg-blue-600
                         hover:bg-blue-700 hover:shadow-lg hover:shadow-lg transition-all duration-200
                         flex items-center gap-2">
            {{ lang.t('onboarding.finish') }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `
})
export class OnboardingComponent {
  @Output() completed = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape() { this.skip(); }

  currentStep = 0;

  steps: OnboardingStep[] = [
    { icon: '\u{1F4CA}', titleKey: 'onboarding.step1_title', descKey: 'onboarding.step1_desc', route: '/dashboard', color: 'blue' },
    { icon: '\u{1F4CB}', titleKey: 'onboarding.step2_title', descKey: 'onboarding.step2_desc', route: '/assessment', color: 'blue' },
    { icon: '\u{1F4C4}', titleKey: 'onboarding.step3_title', descKey: 'onboarding.step3_desc', route: '/contract-analysis', color: 'violet' },
    { icon: '\u26D3\uFE0F', titleKey: 'onboarding.step4_title', descKey: 'onboarding.step4_desc', route: '/supply-chain', color: 'amber' },
    { icon: '\u{1F50D}', titleKey: 'onboarding.step5_title', descKey: 'onboarding.step5_desc', route: '/vendors', color: 'teal' }
  ];

  private stepColors: { [key: string]: { bg: string; border: string } } = {
    blue: { bg: 'rgba(37,99,235,0.1)', border: 'rgba(37,99,235,0.2)' },
    sky:     { bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.2)' },
    violet:  { bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.2)' },
    amber:   { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)' },
    teal:    { bg: 'rgba(20,184,166,0.1)',   border: 'rgba(20,184,166,0.2)' }
  };

  constructor(
    public lang: LangService,
    private router: Router
  ) {}

  getStepBg(): string {
    return this.stepColors[this.steps[this.currentStep].color]?.bg || '';
  }

  getStepBorder(): string {
    return this.stepColors[this.steps[this.currentStep].color]?.border || '';
  }

  next(): void {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
    }
  }

  prev(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  goToStep(): void {
    this.markComplete();
    this.completed.emit();
    this.router.navigate([this.steps[this.currentStep].route]);
  }

  finish(): void {
    this.markComplete();
    this.completed.emit();
    this.router.navigate(['/dashboard']);
  }

  skip(): void {
    this.markComplete();
    this.completed.emit();
  }

  private markComplete(): void {
    if (typeof localStorage !== 'undefined') localStorage.setItem('onboarding_complete', 'true');
  }
}
