import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-[60vh] flex items-center justify-center">
      <div class="text-center">
        @if (loading) {
          <div class="w-16 h-16 border-4 border-slate-700 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-slate-300">{{ lang.t('auth.oauth_loading') }}</p>
        }
        @if (error) {
          <div class="text-red-400">
            <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-lg font-medium mb-2">{{ lang.t('auth.oauth_error') }}</p>
            <a routerLink="/login" class="text-emerald-400 hover:text-emerald-300">{{ lang.t('auth.login') }}</a>
          </div>
        }
      </div>
    </div>
  `
})
export class OAuthCallbackComponent implements OnInit {
  loading = true;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    public lang: LangService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const errorParam = params['error'];

      if (errorParam) {
        this.loading = false;
        this.error = true;
        return;
      }

      if (token) {
        const refreshToken = params['refreshToken'];
        // Store token and fetch user info
        this.auth.handleOAuthCallback(token, refreshToken).subscribe({
          next: () => {
            this.loading = false;
            const returnUrl = sessionStorage.getItem('dora_returnUrl');
            sessionStorage.removeItem('dora_returnUrl');
            this.router.navigateByUrl(returnUrl || '/assessment');
          },
          error: () => {
            this.loading = false;
            this.error = true;
          }
        });
      } else {
        this.loading = false;
        this.error = true;
      }
    });
  }
}
