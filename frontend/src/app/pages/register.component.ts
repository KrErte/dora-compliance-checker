import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { LangService } from '../lang.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-[60vh] flex items-center justify-center">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 font-bold text-2xl mx-auto mb-4">
            D
          </div>
          <h1 class="text-2xl font-bold text-white mb-2">{{ lang.t('auth.register') }}</h1>
          <p class="text-slate-400 text-sm">{{ lang.t('nav.brand') }}</p>
        </div>

        <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
          <form (ngSubmit)="onRegister()">
            <div class="mb-5">
              <label class="block text-sm font-medium text-slate-300 mb-2">{{ lang.t('auth.full_name') }}</label>
              <input type="text" [(ngModel)]="fullName" name="fullName" required
                     class="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-500
                            focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition-all"
                     placeholder="Jaan Tamm">
            </div>

            <div class="mb-5">
              <label class="block text-sm font-medium text-slate-300 mb-2">{{ lang.t('auth.email') }}</label>
              <input type="email" [(ngModel)]="email" name="email" required
                     class="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-500
                            focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition-all"
                     placeholder="teie@ettevote.ee">
            </div>

            <div class="mb-5">
              <label class="block text-sm font-medium text-slate-300 mb-2">{{ lang.t('auth.password') }}</label>
              <input type="password" [(ngModel)]="password" name="password" required minlength="6"
                     class="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-500
                            focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition-all"
                     placeholder="********">
            </div>

            <div class="mb-6">
              <label class="block text-sm font-medium text-slate-300 mb-2">{{ lang.t('auth.confirm_password') }}</label>
              <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" required
                     class="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-500
                            focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition-all"
                     placeholder="********">
            </div>

            @if (error) {
              <div class="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {{ error }}
              </div>
            }

            <button type="submit" [disabled]="loading"
                    class="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200
                           bg-gradient-to-r from-emerald-500 to-cyan-500 text-white
                           hover:from-emerald-400 hover:to-cyan-400 hover:shadow-lg hover:shadow-emerald-500/25
                           disabled:opacity-50 disabled:cursor-not-allowed">
              @if (loading) {
                <span class="inline-flex items-center gap-2">
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  {{ lang.t('auth.register_btn') }}...
                </span>
              } @else {
                {{ lang.t('auth.register_btn') }}
              }
            </button>
          </form>

          <div class="mt-6 text-center">
            <p class="text-sm text-slate-400">
              {{ lang.t('auth.have_account') }}
              <a routerLink="/login" class="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                {{ lang.t('auth.login_link') }}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  error = '';
  loading = false;

  constructor(public lang: LangService, private auth: AuthService, private router: Router) {}

  onRegister() {
    this.error = '';

    if (this.password !== this.confirmPassword) {
      this.error = this.lang.t('auth.error_mismatch');
      return;
    }

    this.loading = true;
    this.auth.register({ email: this.email, password: this.password, fullName: this.fullName }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/assessment']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || this.lang.t('auth.error_exists');
      }
    });
  }
}
