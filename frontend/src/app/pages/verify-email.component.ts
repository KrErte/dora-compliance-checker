import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div class="max-w-md w-full">
        <div class="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 text-center">

          <!-- Loading -->
          <div *ngIf="state === 'loading'">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700 animate-pulse"></div>
            <p class="text-slate-400">{{ lang.t('verify.verifying_email') }}</p>
          </div>

          <!-- Success -->
          <div *ngIf="state === 'success'">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h2 class="text-xl font-bold text-white mb-2">
              {{ lang.t('verify.email_verified') }}
            </h2>
            <p class="text-slate-400 mb-6">
              {{ lang.t('verify.your_email_address_has_been_successfully') }}
            </p>
            <a routerLink="/dashboard" class="inline-block px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all">
              {{ lang.t('verify.go_to_dashboard') }}
            </a>
          </div>

          <!-- Error -->
          <div *ngIf="state === 'error'">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <h2 class="text-xl font-bold text-white mb-2">
              {{ lang.t('verify.verification_failed') }}
            </h2>
            <p class="text-slate-400 mb-6">
              {{ lang.t('verify.invalid_or_expired_verification_link_ple') }}
            </p>
            <a routerLink="/login" class="inline-block px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all">
              {{ lang.t('verify.log_in') }}
            </a>
          </div>

        </div>
      </div>
    </div>
  `
})
export class VerifyEmailComponent implements OnInit {
  state: 'loading' | 'success' | 'error' = 'loading';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    public lang: LangService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state = 'error';
      return;
    }

    this.http.get<any>(`/api/auth/verify-email?token=${token}`).subscribe({
      next: () => this.state = 'success',
      error: () => this.state = 'error'
    });
  }
}
