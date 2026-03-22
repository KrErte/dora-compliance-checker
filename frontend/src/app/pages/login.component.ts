import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { LangService } from '../lang.service';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { timeout, catchError, throwError } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [`
    .animate-shake {
      animation: shake 0.5s ease-in-out;
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
  `],
  template: `
    <div class="min-h-[60vh] flex items-center justify-center">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <div class="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-slate-900 font-bold text-2xl mx-auto mb-4">
            D
          </div>
          <h1 class="text-2xl font-bold text-slate-900 mb-2">{{ lang.t('auth.login') }}</h1>
          <p class="text-slate-400 text-sm">{{ lang.t('nav.brand') }}</p>
        </div>

        <div class="bg-white backdrop-blur-xl rounded-2xl border border-slate-200 p-8"
             [class.animate-shake]="shakeForm">
          @if (error) {
            <div class="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ error }}
            </div>
          }

          <!-- SSO Buttons -->
          <div class="space-y-3 mb-6">
            <a href="/api/auth/oauth2/google"
               class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl
                      bg-white border border-slate-300 text-slate-700
                      hover:bg-slate-50 hover:shadow-md transition-all font-medium text-sm">
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {{ lang.t('auth.login_google') }}
            </a>
            <a href="/api/auth/oauth2/microsoft"
               class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl
                      bg-white border border-slate-300 text-slate-700
                      hover:bg-slate-50 hover:shadow-md transition-all font-medium text-sm">
              <svg class="w-5 h-5" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z"/>
                <path fill="#81bc06" d="M12 1h10v10H12z"/>
                <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                <path fill="#ffba08" d="M12 12h10v10H12z"/>
              </svg>
              {{ lang.t('auth.login_microsoft') }}
            </a>
          </div>

          <!-- Separator -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-200"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white text-slate-500">{{ lang.t('auth.or') }}</span>
            </div>
          </div>

          @if (requires2fa) {
            <div class="space-y-4">
              <div class="text-center mb-4">
                <div class="w-12 h-12 mx-auto rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-3">
                  <svg class="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <h2 class="text-lg font-bold text-slate-900">{{ lang.l('Kaheastmeline autentimine', 'Two-Factor Authentication') }}</h2>
                <p class="text-slate-400 text-xs mt-1">{{ lang.l('Sisestage kood oma autentimisrakendusest', 'Enter the code from your authenticator app') }}</p>
              </div>
              <input type="text" [(ngModel)]="totpCode" name="totpCode" maxlength="8"
                     placeholder="000000"
                     class="w-full px-4 py-3 rounded-xl bg-slate-100/50 border border-slate-200 text-slate-900 text-center text-2xl tracking-[0.5em] font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25"
                     (keydown.enter)="onVerify2fa()">
              <button (click)="onVerify2fa()" [disabled]="loading || !totpCode"
                      class="w-full py-3 rounded-xl font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all">
                @if (loading) {
                  <span class="inline-flex items-center gap-2">
                    <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    {{ lang.l('Kinnitamine...', 'Verifying...') }}
                  </span>
                } @else {
                  {{ lang.l('Kinnita', 'Verify') }}
                }
              </button>
              <button (click)="requires2fa = false; error = ''" class="w-full py-2 text-sm text-slate-500 hover:text-slate-400 transition-colors">
                {{ lang.l('Tagasi', 'Back') }}
              </button>
            </div>
          } @else {

          <form (ngSubmit)="onLogin()">
            <div class="mb-5">
              <label for="login-email" class="block text-sm font-medium text-slate-600 mb-2">{{ lang.t('auth.email') }}</label>
              <input type="email" [(ngModel)]="email" name="email" id="login-email" required
                     class="w-full px-4 py-3 rounded-xl bg-slate-100/50 border text-slate-900 placeholder-slate-500
                            focus:outline-none focus:ring-1 transition-all"
                     [class]="fieldErrors['email'] ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/25' : 'border-slate-200 focus:border-blue-500/50 focus:ring-blue-500/25'"
                     placeholder="teie@ettevote.ee">
              @if (fieldErrors['email']) {
                <p class="mt-1 text-xs text-red-400">{{ fieldErrors['email'] }}</p>
              }
            </div>

            <div class="mb-6">
              <label for="login-password" class="block text-sm font-medium text-slate-600 mb-2">{{ lang.t('auth.password') }}</label>
              <input type="password" [(ngModel)]="password" name="password" id="login-password" required
                     class="w-full px-4 py-3 rounded-xl bg-slate-100/50 border text-slate-900 placeholder-slate-500
                            focus:outline-none focus:ring-1 transition-all"
                     [class]="fieldErrors['password'] ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/25' : 'border-slate-200 focus:border-blue-500/50 focus:ring-blue-500/25'"
                     placeholder="********">
              @if (fieldErrors['password']) {
                <p class="mt-1 text-xs text-red-400">{{ fieldErrors['password'] }}</p>
              }
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
                  {{ lang.t('auth.login_btn') }}...
                </span>
              } @else {
                {{ lang.t('auth.login_btn') }}
              }
            </button>
          </form>

          <div class="mt-6 text-center space-y-3">
            <p class="text-sm text-slate-400">
              {{ lang.t('auth.no_account') }}
              <a routerLink="/register" class="text-blue-600 hover:text-blue-500 font-medium transition-colors">
                {{ lang.t('auth.register_link') }}
              </a>
            </p>
            <p class="text-sm">
              <a routerLink="/forgot-password"
                 class="text-slate-500 hover:text-slate-400 transition-colors">
                {{ lang.t('auth.forgot_password') }}
              </a>
            </p>
          </div>

          }
        </div>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  error = '';
  loading = false;
  shakeForm = false;
  fieldErrors: Record<string, string> = {};
  requires2fa = false;
  totpCode = '';
  private twoFaEmail = '';

  constructor(public lang: LangService, private auth: AuthService, private api: ApiService, private router: Router, private titleService: Title) {}

  ngOnInit(): void {
    this.titleService.setTitle(this.lang.t('title.login'));
  }

  private triggerShake() {
    this.shakeForm = true;
    setTimeout(() => this.shakeForm = false, 500);
  }

  onLogin() {
    this.error = '';
    this.fieldErrors = {};
    let hasErrors = false;
    if (!this.email.trim()) {
      this.fieldErrors['email'] = this.lang.t('auth.error_email_required');
      hasErrors = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.fieldErrors['email'] = this.lang.t('auth.error_email_invalid');
      hasErrors = true;
    }
    if (!this.password.trim()) {
      this.fieldErrors['password'] = this.lang.t('auth.error_password_required');
      hasErrors = true;
    }
    if (hasErrors) {
      this.triggerShake();
      return;
    }
    this.loading = true;
    this.auth.login({ email: this.email, password: this.password }).pipe(
      timeout(15000), // 15 second timeout
      catchError((err) => {
        if (err.name === 'TimeoutError') {
          return throwError(() => ({ status: 0, timeout: true }));
        }
        return throwError(() => err);
      })
    ).subscribe({
      next: (res: any) => {
        this.loading = false;
        // Check if 2FA is required
        if (res && res.requiresTwoFactor) {
          this.requires2fa = true;
          this.twoFaEmail = res.email || this.email;
          return;
        }
        const returnUrl = sessionStorage.getItem('dora_returnUrl');
        sessionStorage.removeItem('dora_returnUrl');
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
        } else {
          const history = JSON.parse(localStorage.getItem('dora_history') || '[]');
          this.router.navigateByUrl(history.length > 0 ? '/dashboard' : '/welcome');
        }
      },
      error: (err) => {
        this.loading = false;
        this.triggerShake();

        if (err.timeout || err.status === 0) {
          // Timeout or network error
          this.error = this.lang.t('auth.error_timeout');
        } else if (err.status === 401 || err.status === 403) {
          // Invalid credentials
          this.error = this.lang.t('auth.error_invalid');
        } else if (err.status >= 500) {
          // Server error
          this.error = this.lang.t('auth.error_server');
        } else {
          // Other errors (400, etc.)
          this.error = this.lang.t('auth.error_invalid');
        }
      }
    });
  }

  onVerify2fa() {
    if (!this.totpCode) return;
    this.loading = true;
    this.error = '';
    this.api.verify2faLogin(this.twoFaEmail || this.email, this.totpCode).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.token) {
          this.auth.completeAuth(res);
          const returnUrl = sessionStorage.getItem('dora_returnUrl');
          sessionStorage.removeItem('dora_returnUrl');
          this.router.navigateByUrl(returnUrl || '/dashboard');
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.triggerShake();
        this.error = this.lang.l('Vale 2FA kood', 'Invalid 2FA code');
      }
    });
  }
}
