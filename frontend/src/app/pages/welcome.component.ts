import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center px-4">
      <div class="max-w-lg w-full text-center animate-fade-in-up">

        <!-- Icon -->
        <div class="mx-auto mb-8 w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20
                    border border-emerald-500/30 flex items-center justify-center">
          <svg class="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
        </div>

        <!-- Heading -->
        <h1 class="text-3xl md:text-4xl font-extrabold mb-4">
          <span class="gradient-text">{{ lang.t('welcome.heading') }}</span>
        </h1>

        <!-- Description -->
        <p class="text-slate-400 text-base md:text-lg leading-relaxed mb-10">
          {{ lang.t('welcome.description') }}
        </p>

        <!-- CTA Button -->
        <a routerLink="/assessment/wizard"
           class="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500
                  hover:from-emerald-400 hover:to-cyan-400 text-slate-900 font-bold
                  px-8 py-3.5 rounded-xl transition-all duration-300
                  hover:shadow-lg hover:shadow-emerald-500/25 text-base">
          {{ lang.t('welcome.cta') }}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </a>

        <!-- Time estimate -->
        <p class="text-slate-600 text-sm mt-4">
          {{ lang.t('welcome.time_estimate') }}
        </p>
      </div>
    </div>
  `
})
export class WelcomeComponent implements OnInit {
  lang = inject(LangService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const history = JSON.parse(localStorage.getItem('dora_history') || '[]');
      if (history.length > 0) {
        this.router.navigate(['/dashboard']);
      }
    }
  }
}
