import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-[60vh] flex items-center justify-center">
      <div class="text-center">
        <div class="text-8xl font-extrabold gradient-text mb-4">404</div>
        <h1 class="text-2xl font-bold text-white mb-2">{{ lang.t('notfound.title') }}</h1>
        <p class="text-slate-400 mb-8">{{ lang.t('notfound.desc') }}</p>
        <a routerLink="/"
           class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm
                  bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900
                  hover:from-emerald-400 hover:to-cyan-400 hover:shadow-lg hover:shadow-emerald-500/25 transition-all">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          {{ lang.t('notfound.home') }}
        </a>
      </div>
    </div>
  `
})
export class NotFoundComponent {
  constructor(public lang: LangService) {}
}
