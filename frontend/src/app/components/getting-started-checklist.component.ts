import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChecklistService } from '../services/checklist.service';
import { LangService } from '../lang.service';
import { TourService } from '../services/tour.service';

@Component({
  selector: 'app-getting-started-checklist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div *ngIf="checklist.isVisible()" class="mb-6 animate-fade-in-up relative">
      <!-- Confetti overlay -->
      <div *ngIf="checklist.showCelebration()" class="confetti-container">
        <div *ngFor="let p of confettiPieces" class="confetti-piece"
             [style.left.%]="p.x" [style.animation-delay]="p.delay + 's'"
             [style.background]="p.color"></div>
      </div>

      <div class="bg-slate-800/60 backdrop-blur border border-emerald-500/30 rounded-xl overflow-hidden
                  shadow-lg shadow-emerald-500/5">
        <!-- Header -->
        <div class="px-6 py-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-b border-slate-700/50
                    flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-slate-200">{{ lang.t('checklist.title') }}</h3>
              <p class="text-xs text-slate-400">{{ lang.t('checklist.subtitle') }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button (click)="tourService.startTour()" type="button"
                    class="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium px-2 py-1 rounded hover:bg-slate-700/30 transition-colors flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              {{ lang.t('onboarding.restart_tour') }}
            </button>
            <span class="text-xs text-emerald-400 font-medium">{{ checklist.completedCount() }}/{{ checklist.items().length }}</span>
            <button (click)="checklist.dismiss()" type="button"
                    class="w-7 h-7 rounded-lg hover:bg-slate-700/50 flex items-center justify-center transition-colors group"
                    [title]="lang.t('checklist.dismiss')">
              <svg class="w-4 h-4 text-slate-500 group-hover:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="h-1 bg-slate-700/50">
          <div class="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-700 ease-out"
               [style.width.%]="checklist.progressPercent()"></div>
        </div>

        <!-- Items -->
        <div class="px-4 py-3 space-y-1">
          <a *ngFor="let item of checklist.items(); let i = index"
             [routerLink]="item.route"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group"
             [class]="item.completed
               ? 'bg-emerald-500/5 cursor-default'
               : 'hover:bg-slate-700/30 cursor-pointer'">
            <!-- Checkbox circle -->
            <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 text-xs font-bold"
                 [class]="item.completed
                   ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                   : 'bg-slate-700/50 border border-slate-600/50 text-slate-500 group-hover:border-emerald-500/30 group-hover:text-emerald-400'">
              <svg *ngIf="item.completed" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
              <span *ngIf="!item.completed">{{ i + 1 }}</span>
            </div>

            <!-- Label + description -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium transition-all duration-200"
                 [class]="item.completed ? 'text-slate-500 line-through' : 'text-slate-200 group-hover:text-emerald-300'">
                {{ lang.t(item.labelKey) }}
              </p>
              <p class="text-xs transition-all duration-200"
                 [class]="item.completed ? 'text-slate-600' : 'text-slate-500'">
                {{ lang.t(item.descKey) }}
              </p>
            </div>

            <!-- Arrow -->
            <svg *ngIf="!item.completed" class="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-all duration-200 group-hover:translate-x-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confetti-container {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: 10;
      border-radius: 0.75rem;
    }
    .confetti-piece {
      position: absolute;
      top: -10px;
      width: 8px;
      height: 8px;
      border-radius: 2px;
      animation: confetti-fall 4s ease-in forwards;
    }
    @keyframes confetti-fall {
      0% { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(400px) rotate(720deg); opacity: 0; }
    }
  `]
})
export class GettingStartedChecklistComponent {
  checklist = inject(ChecklistService);
  lang = inject(LangService);
  tourService = inject(TourService);

  confettiPieces = Array.from({ length: 20 }, (_, i) => ({
    x: Math.random() * 100,
    delay: Math.random() * 2,
    color: ['#34d399', '#22d3ee', '#fbbf24', '#a78bfa'][i % 4]
  }));
}
