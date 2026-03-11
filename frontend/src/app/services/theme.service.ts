import { Injectable, signal, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private themeSignal = signal<Theme>(this.getInitialTheme());
  theme = this.themeSignal.asReadonly();
  private isBrowser: boolean;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.applyTheme(this.themeSignal());
    }
  }

  private getInitialTheme(): Theme {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('dora_theme');
      if (stored === 'light' || stored === 'dark') return stored;
      // Check system preference
      if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    }
    return 'dark';
  }

  toggle(): void {
    const next: Theme = this.themeSignal() === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  setTheme(theme: Theme): void {
    this.themeSignal.set(theme);
    if (this.isBrowser) {
      localStorage.setItem('dora_theme', theme);
      this.applyTheme(theme);
    }
  }

  private applyTheme(theme: Theme): void {
    const html = this.document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
      html.classList.remove('light');
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
    }
  }

  isDark(): boolean {
    return this.themeSignal() === 'dark';
  }
}
