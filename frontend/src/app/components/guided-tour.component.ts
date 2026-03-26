import { Component, HostListener, signal, computed, OnInit, OnDestroy, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LangService } from '../lang.service';
import { TourService } from '../services/tour.service';

interface TourStep {
  targetSelector: string;
  titleKey: string;
  descKey: string;
  position: 'bottom' | 'top' | 'left' | 'right';
  icon: string;
}

@Component({
  selector: 'app-guided-tour',
  imports: [CommonModule],
  template: `
    @if (active()) {
      <!-- Backdrop overlay with SVG cutout -->
      <div class="fixed inset-0 z-[200]" (click)="skip()">
        <svg class="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white"/>
              @if (cutout()) {
                <rect [attr.x]="cutout()!.x - 8" [attr.y]="cutout()!.y - 8"
                      [attr.width]="cutout()!.w + 16" [attr.height]="cutout()!.h + 16"
                      rx="12" fill="black"/>
              }
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#tour-mask)"/>
        </svg>
        <!-- Highlight ring around target -->
        @if (cutout()) {
          <div class="absolute border-2 border-blue-400 rounded-xl pointer-events-none animate-pulse"
               [style.left.px]="cutout()!.x - 8" [style.top.px]="cutout()!.y - 8"
               [style.width.px]="cutout()!.w + 16" [style.height.px]="cutout()!.h + 16"
               style="box-shadow: 0 0 0 4px rgba(52,211,153,0.2), 0 0 30px rgba(52,211,153,0.15)"></div>
        }
      </div>

      <!-- Tooltip bubble -->
      <div class="fixed z-[201] w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-black/40 p-5"
           [style.left.px]="tooltipPos().x" [style.top.px]="tooltipPos().y"
           (click)="$event.stopPropagation()">
        <!-- Step icon -->
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-slate-900 text-lg">
            {{ currentStepData().icon }}
          </div>
          <div>
            <p class="text-sm font-bold text-slate-900">{{ lang.t(currentStepData().titleKey) }}</p>
            <p class="text-[10px] text-slate-400">{{ currentStep() + 1 }} / {{ steps.length }}</p>
          </div>
        </div>
        <p class="text-sm text-slate-600 leading-relaxed mb-4">{{ lang.t(currentStepData().descKey) }}</p>

        <!-- Progress dots -->
        <div class="flex items-center gap-1.5 mb-4">
          @for (step of steps; track step.titleKey; let i = $index) {
            <div class="h-1.5 rounded-full transition-all duration-300"
                 [class]="i === currentStep() ? 'w-6 bg-blue-500' : i < currentStep() ? 'w-1.5 bg-blue-500/50' : 'w-1.5 bg-slate-300'"></div>
          }
        </div>

        <!-- Navigation buttons -->
        <div class="flex items-center justify-between">
          <button type="button" (click)="skip()"
                  class="text-xs text-slate-500 hover:text-slate-600 transition-colors">
            {{ lang.t('tour.skip') }}
          </button>
          <div class="flex items-center gap-2">
            @if (currentStep() > 0) {
              <button type="button" (click)="prev()"
                      class="px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors">
                {{ lang.t('tour.prev') }}
              </button>
            }
            @if (currentStep() < steps.length - 1) {
              <button type="button" (click)="next()"
                      class="px-4 py-1.5 text-xs rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all">
                {{ lang.t('tour.next') }}
              </button>
            } @else {
              <button type="button" (click)="finish()"
                      class="px-4 py-1.5 text-xs rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all">
                {{ lang.t('tour.finish') }}
              </button>
            }
          </div>
        </div>
      </div>
    }
    `
})
export class GuidedTourComponent implements OnInit, OnDestroy {
  @Output() completed = new EventEmitter<void>();

  steps: TourStep[] = [
    { targetSelector: '.tour-target-brand', titleKey: 'tour.welcome_title', descKey: 'tour.welcome_desc', position: 'bottom', icon: '👋' },
    { targetSelector: 'nav', titleKey: 'tour.nav_title', descKey: 'tour.nav_desc', position: 'bottom', icon: '🧭' },
    { targetSelector: '[routerLink="/dashboard"]', titleKey: 'tour.dashboard_title', descKey: 'tour.dashboard_desc', position: 'bottom', icon: '📊' },
    { targetSelector: '[routerLink="/assessment"]', titleKey: 'tour.assessment_title', descKey: 'tour.assessment_desc', position: 'bottom', icon: '📋' },
    { targetSelector: '[routerLink="/contract-analysis"]', titleKey: 'tour.contracts_title', descKey: 'tour.contracts_desc', position: 'bottom', icon: '📄' },
    { targetSelector: 'app-global-search', titleKey: 'tour.search_title', descKey: 'tour.search_desc', position: 'bottom', icon: '🔍' },
    { targetSelector: '[aria-label="Notifications"]', titleKey: 'tour.notif_title', descKey: 'tour.notif_desc', position: 'bottom', icon: '🔔' },
    { targetSelector: '.tour-target-brand', titleKey: 'tour.done_title', descKey: 'tour.done_desc', position: 'bottom', icon: '🎉' },
  ];

  currentStep = signal(0);
  active = signal(false);
  cutout = signal<{ x: number; y: number; w: number; h: number } | null>(null);

  currentStepData = computed(() => this.steps[this.currentStep()]);

  tooltipPos = computed(() => {
    const cut = this.cutout();
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 768;
    if (!cut) return { x: winW / 2 - 160, y: winH / 2 - 100 };
    const step = this.currentStepData();
    const tooltipW = 320;
    let x = cut.x + cut.w / 2 - tooltipW / 2;
    let y = cut.y + cut.h + 20;
    if (step.position === 'top') y = cut.y - 260;
    if (step.position === 'left') { x = cut.x - tooltipW - 20; y = cut.y; }
    if (step.position === 'right') { x = cut.x + cut.w + 20; y = cut.y; }
    // Keep on screen
    x = Math.max(16, Math.min(x, winW - tooltipW - 16));
    y = Math.max(16, Math.min(y, winH - 280));
    return { x, y };
  });

  private resizeHandler = () => this.updateCutout();
  private isBrowser: boolean;

  constructor(public lang: LangService, private tourService: TourService, @Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      window.addEventListener('resize', this.resizeHandler);
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  start(): void {
    this.currentStep.set(0);
    this.active.set(true);
    setTimeout(() => this.updateCutout(), 100);
  }

  @HostListener('document:keydown.escape')
  skip(): void {
    this.active.set(false);
    this.tourService.completeTour();
    this.completed.emit();
  }

  next(): void {
    if (this.currentStep() < this.steps.length - 1) {
      this.currentStep.update(s => s + 1);
      setTimeout(() => this.updateCutout(), 50);
    }
  }

  prev(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update(s => s - 1);
      setTimeout(() => this.updateCutout(), 50);
    }
  }

  finish(): void {
    this.active.set(false);
    this.tourService.completeTour();
    this.completed.emit();
  }

  private updateCutout(): void {
    const step = this.steps[this.currentStep()];
    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      this.cutout.set({ x: rect.left, y: rect.top, w: rect.width, h: rect.height });
    } else {
      this.cutout.set(null);
    }
  }
}
