import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { LangService } from '../lang.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-[60vh] flex items-center justify-center">
      <div class="w-full max-w-md">
        <!-- Trial Banner -->
        <div class="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-emerald-300">{{ lang.l('14 päeva tasuta prooviaeg', '14-day free trial') }}</p>
              <p class="text-xs text-slate-400">{{ lang.l('Krediitkaarti pole vaja', 'No credit card required') }}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs text-slate-400">
            <div class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              {{ lang.l('AI lepinguanalüüs', 'AI contract analysis') }}
            </div>
            <div class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              {{ lang.l('PDF/Excel eksport', 'PDF/Excel export') }}
            </div>
            <div class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              {{ lang.l('Vastavussertifikaat', 'Compliance certificate') }}
            </div>
            <div class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              {{ lang.l('Tegevuskava', 'Action plan') }}
            </div>
          </div>
        </div>

        <div class="text-center mb-8">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 font-bold text-2xl mx-auto mb-4">
            D
          </div>
          <h1 class="text-2xl font-bold text-white mb-2">{{ lang.t('auth.register') }}</h1>
          <p class="text-slate-400 text-sm">{{ lang.t('nav.brand') }}</p>
        </div>

        <!-- Success state -->
        <div *ngIf="registrationSuccess" class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-emerald-500/30 p-8 text-center">
          <div class="text-6xl mb-4">✅</div>
          <h2 class="text-2xl font-bold text-emerald-300 mb-2">{{ lang.t('register.success_title') }}</h2>
          <p class="text-slate-300 mb-6">{{ lang.t('register.success_desc') }}</p>
          <a routerLink="/assessment"
             class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold
                    bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900
                    hover:from-emerald-400 hover:to-cyan-400 transition-all">
            {{ lang.t('register.start_now') }}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </a>
        </div>

        <!-- Registration form -->
        <div *ngIf="!registrationSuccess" class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
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
              {{ lang.t('auth.register_google') }}
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
              {{ lang.t('auth.register_microsoft') }}
            </a>
          </div>

          <!-- Separator -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-600/50"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-slate-800/50 text-slate-500">{{ lang.t('auth.or') }}</span>
            </div>
          </div>

          <form (ngSubmit)="onRegister()">
            <div class="mb-5">
              <label for="reg-fullname" class="block text-sm font-medium text-slate-300 mb-2">{{ lang.t('auth.full_name') }}</label>
              <input type="text" [(ngModel)]="fullName" name="fullName" id="reg-fullname" required
                     (blur)="touched['fullName'] = true"
                     class="w-full px-4 py-3 rounded-xl bg-slate-700/50 border text-white placeholder-slate-500
                            focus:outline-none focus:ring-1 transition-all"
                     [class]="fieldErrors['fullName'] ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/25' : 'border-slate-600/50 focus:border-emerald-500/50 focus:ring-emerald-500/25'"
                     placeholder="Jaan Tamm">
              @if (fieldErrors['fullName']) {
                <p class="mt-1 text-xs text-red-400">{{ fieldErrors['fullName'] }}</p>
              }
            </div>

            <div class="mb-5">
              <label for="reg-email" class="block text-sm font-medium text-slate-300 mb-2">{{ lang.t('auth.email') }}</label>
              <input type="email" [(ngModel)]="email" name="email" id="reg-email" required
                     (blur)="touched['email'] = true"
                     class="w-full px-4 py-3 rounded-xl bg-slate-700/50 border text-white placeholder-slate-500
                            focus:outline-none focus:ring-1 transition-all"
                     [class]="fieldErrors['email'] ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/25' : 'border-slate-600/50 focus:border-emerald-500/50 focus:ring-emerald-500/25'"
                     placeholder="teie@ettevote.ee">
              @if (fieldErrors['email']) {
                <p class="mt-1 text-xs text-red-400">{{ fieldErrors['email'] }}</p>
              }
            </div>

            <div class="mb-5">
              <label for="reg-password" class="block text-sm font-medium text-slate-300 mb-2">{{ lang.t('auth.password') }}</label>
              <input type="password" [(ngModel)]="password" name="password" id="reg-password" required minlength="6"
                     (blur)="touched['password'] = true"
                     class="w-full px-4 py-3 rounded-xl bg-slate-700/50 border text-white placeholder-slate-500
                            focus:outline-none focus:ring-1 transition-all"
                     [class]="fieldErrors['password'] ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/25' : 'border-slate-600/50 focus:border-emerald-500/50 focus:ring-emerald-500/25'"
                     placeholder="********">
              @if (fieldErrors['password']) {
                <p class="mt-1 text-xs text-red-400">{{ fieldErrors['password'] }}</p>
              }
            </div>

            <div class="mb-6">
              <label for="reg-confirm-password" class="block text-sm font-medium text-slate-300 mb-2">{{ lang.t('auth.confirm_password') }}</label>
              <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" id="reg-confirm-password" required
                     (blur)="touched['confirmPassword'] = true"
                     class="w-full px-4 py-3 rounded-xl bg-slate-700/50 border text-white placeholder-slate-500
                            focus:outline-none focus:ring-1 transition-all"
                     [class]="fieldErrors['confirmPassword'] ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/25' : 'border-slate-600/50 focus:border-emerald-500/50 focus:ring-emerald-500/25'"
                     placeholder="********">
              @if (fieldErrors['confirmPassword']) {
                <p class="mt-1 text-xs text-red-400">{{ fieldErrors['confirmPassword'] }}</p>
              }
            </div>

            <!-- Terms & Privacy checkbox -->
            <div class="mb-6">
              <label class="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" [(ngModel)]="agreeTerms" name="agreeTerms"
                       [attr.aria-label]="lang.l('Nõustun kasutustingimuste ja privaatsuspoliitikaga', 'I agree to the Terms of Service and Privacy Policy')"
                       class="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500
                              focus:ring-emerald-500/25 focus:ring-offset-0 cursor-pointer">
                <span class="text-sm text-slate-400 leading-relaxed" aria-hidden="true">
                  {{ lang.t('auth.terms_agree') }}
                  <a routerLink="/terms" target="_blank" class="text-emerald-400 hover:text-emerald-300 underline">{{ lang.t('auth.terms_link') }}</a>
                  {{ lang.t('auth.terms_and') }}
                  <a routerLink="/privacy" target="_blank" class="text-emerald-400 hover:text-emerald-300 underline">{{ lang.t('auth.privacy_link') }}</a>
                </span>
              </label>
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
export class RegisterComponent implements OnInit {
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  agreeTerms = false;
  error = '';
  loading = false;
  registrationSuccess = false;
  touched: Record<string, boolean> = {};
  fieldErrors: Record<string, string> = {};

  constructor(
    public lang: LangService,
    private auth: AuthService,
    private router: Router,
    private titleService: Title
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle(this.lang.t('title.register'));
  }

  onRegister() {
    this.error = '';
    this.fieldErrors = {};

    // Frontend field-level validation
    let hasErrors = false;

    if (!this.fullName.trim()) {
      this.fieldErrors['fullName'] = this.lang.t('auth.error_name_required');
      hasErrors = true;
    }

    if (!this.email.trim()) {
      this.fieldErrors['email'] = this.lang.t('auth.error_email_required');
      hasErrors = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.email)) {
        this.fieldErrors['email'] = this.lang.t('auth.error_email_invalid');
        hasErrors = true;
      }
    }

    if (!this.password) {
      this.fieldErrors['password'] = this.lang.t('auth.error_password_required');
      hasErrors = true;
    } else if (this.password.length < 8) {
      this.fieldErrors['password'] = this.lang.t('auth.error_password_short');
      hasErrors = true;
    }

    if (this.password && this.password !== this.confirmPassword) {
      this.fieldErrors['confirmPassword'] = this.lang.t('auth.error_mismatch');
      hasErrors = true;
    }

    if (!this.agreeTerms) {
      this.error = this.lang.t('auth.error_terms');
      hasErrors = true;
    }

    if (hasErrors) return;

    this.loading = true;
    this.auth.register({ email: this.email, password: this.password, fullName: this.fullName }).subscribe({
      next: () => {
        this.loading = false;
        this.registrationSuccess = true;
      },
      error: (err) => {
        this.loading = false;
        // Parse backend error message
        if (err.error?.error) {
          this.error = err.error.error;
        } else if (err.status === 400) {
          this.error = this.lang.t('auth.error_exists');
        } else {
          this.error = this.lang.t('auth.error_generic');
        }
      }
    });
  }
}
