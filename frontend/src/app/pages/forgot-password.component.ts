import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-[60vh] flex items-center justify-center">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <div class="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-slate-900 font-bold text-2xl mx-auto mb-4">
            D
          </div>
          <h1 class="text-2xl font-bold text-slate-900 mb-2">{{ lang.t('auth.forgot_password_title') }}</h1>
          <p class="text-slate-400 text-sm max-w-sm mx-auto">{{ lang.t('auth.forgot_password_desc') }}</p>
        </div>

        <div class="bg-white backdrop-blur-xl rounded-2xl border border-slate-200 p-8">
          <!-- Success state -->
          <div *ngIf="success" class="text-center space-y-4">
            <div class="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <p class="text-sm text-blue-500">{{ lang.t('auth.forgot_password_success') }}</p>
            <a routerLink="/login"
               class="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              {{ lang.t('auth.forgot_password_back') }}
            </a>
          </div>

          <!-- Email form -->
          <form *ngIf="!success" (ngSubmit)="onSubmit()">
            <div *ngIf="error" class="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ error }}
            </div>

            <div class="mb-6">
              <label for="reset-email" class="block text-sm font-medium text-slate-600 mb-2">{{ lang.t('auth.email') }}</label>
              <input type="email" [(ngModel)]="email" name="email" id="reset-email" required
                     class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-500
                            focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all"
                     placeholder="teie@ettevote.ee">
            </div>

            <button type="submit" [disabled]="loading"
                    class="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200
                           bg-blue-600 text-white
                           hover:bg-blue-700 hover:shadow-lg hover:shadow-lg
                           disabled:opacity-50 disabled:cursor-not-allowed">
              @if (loading) {
                <span class="inline-flex items-center gap-2">
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  {{ lang.t('auth.forgot_password_submit') }}...
                </span>
              } @else {
                {{ lang.t('auth.forgot_password_submit') }}
              }
            </button>
          </form>

          <div *ngIf="!success" class="mt-6 text-center">
            <a routerLink="/login" class="text-sm text-slate-500 hover:text-slate-400 transition-colors flex items-center justify-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              {{ lang.t('auth.forgot_password_back') }}
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent implements OnInit {
  email = '';
  loading = false;
  success = false;
  error = '';

  constructor(
    public lang: LangService,
    private http: HttpClient,
    private titleService: Title
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle(this.lang.t('title.forgot_password'));
  }

  onSubmit() {
    this.error = '';

    if (!this.email.trim()) {
      this.error = this.lang.t('auth.error_email_required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.error = this.lang.t('auth.error_email_invalid');
      return;
    }

    this.loading = true;

    this.http.post('/api/auth/forgot-password', { email: this.email }).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
      },
      error: () => {
        // Always show success to prevent email enumeration
        this.loading = false;
        this.success = true;
      }
    });
  }
}
