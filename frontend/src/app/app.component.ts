import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { LangService } from './lang.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    <nav class="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50">
      <div class="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <a routerLink="/" class="flex items-center gap-3 group">
          <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 font-bold text-sm
                      group-hover:shadow-lg group-hover:shadow-emerald-500/25 transition-all duration-300">
            D
          </div>
          <span class="text-xl font-bold gradient-text">
            DORA Vastavuskontroll
          </span>
        </a>
        <div class="flex items-center gap-4 hidden sm:flex">
          <a routerLink="/history"
             class="text-sm text-slate-400 hover:text-emerald-400 transition-colors duration-200 flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ lang.t('nav.history') }}
          </a>
          <a routerLink="/assessment"
             class="text-sm text-slate-400 hover:text-emerald-400 transition-colors duration-200">
            {{ lang.t('nav.assessment') }}
          </a>
          <!-- Language toggle -->
          <button (click)="lang.toggle()"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                         bg-slate-700/50 text-slate-300 border border-slate-600/30
                         hover:bg-slate-600/50 hover:text-emerald-400 transition-all duration-200">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ lang.currentLang === 'et' ? 'EN' : 'ET' }}
          </button>
        </div>
      </div>
    </nav>
    <main class="max-w-5xl mx-auto px-4 py-8">
      <router-outlet />
    </main>
    <footer class="border-t border-slate-800 mt-16 py-6 text-center text-xs text-slate-600">
      DORA (EU) 2022/2554 &middot; Vastavuskontrolli t&ouml;&ouml;riist
    </footer>
  `
})
export class AppComponent {
  constructor(public lang: LangService) {}
}
