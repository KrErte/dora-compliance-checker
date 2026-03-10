import { Component, signal, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-pwa-install-prompt',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (showBanner()) {
      <div class="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 animate-slide-up">
        <div class="bg-slate-800 border border-emerald-500/30 rounded-xl p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 font-bold text-xs flex-shrink-0">
              DA
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-semibold text-white">{{ lang.l('Paigalda DoraAudit', 'Install DoraAudit') }}</h3>
              <p class="text-xs text-slate-400 mt-0.5">{{ lang.l('Lisa oma avaekraanile kiireks ligipääsuks', 'Add to your home screen for quick access') }}</p>
            </div>
            <button (click)="dismiss()" class="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="flex gap-2 mt-3">
            <button (click)="install()"
                    class="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 text-xs font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all">
              {{ lang.l('Paigalda', 'Install') }}
            </button>
            <button (click)="dismiss()"
                    class="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-400 text-xs hover:text-white transition-colors">
              {{ lang.l('Mitte praegu', 'Not now') }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-slide-up { animation: slide-up 0.3s ease-out; }
  `]
})
export class PwaInstallPromptComponent {
  showBanner = signal(false);
  private deferredPrompt: any = null;

  constructor(
    public lang: LangService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      // Check if already dismissed
      const dismissed = localStorage.getItem('pwa_install_dismissed');
      if (dismissed) {
        const dismissedAt = parseInt(dismissed, 10);
        // Show again after 7 days
        if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
      }

      // Check if already installed (standalone mode)
      if (window.matchMedia('(display-mode: standalone)').matches) return;

      window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault();
        this.deferredPrompt = e;
        // Delay showing the banner by 30 seconds
        setTimeout(() => this.showBanner.set(true), 30000);
      });
    }
  }

  async install() {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    const result = await this.deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      this.showBanner.set(false);
    }
    this.deferredPrompt = null;
  }

  dismiss() {
    this.showBanner.set(false);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('pwa_install_dismissed', Date.now().toString());
    }
  }
}
