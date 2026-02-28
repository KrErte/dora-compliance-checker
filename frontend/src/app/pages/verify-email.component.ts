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
            <p class="text-slate-400">{{ lang.currentLang === 'et' ? 'Kinnitan e-posti...' : 'Verifying email...' }}</p>
          </div>

          <!-- Success -->
          <div *ngIf="state === 'success'">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h2 class="text-xl font-bold text-white mb-2">
              {{ lang.currentLang === 'et' ? 'E-post kinnitatud!' : 'Email verified!' }}
            </h2>
            <p class="text-slate-400 mb-6">
              {{ lang.currentLang === 'et' ? 'Sinu e-posti aadress on edukalt kinnitatud. Nüüd saad platvormi täisfunktsionaalsust kasutada.' : 'Your email address has been successfully verified. You can now use all platform features.' }}
            </p>
            <a routerLink="/dashboard" class="inline-block px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all">
              {{ lang.currentLang === 'et' ? 'Mine töölauale' : 'Go to Dashboard' }}
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
              {{ lang.currentLang === 'et' ? 'Kinnitamine ebaõnnestus' : 'Verification failed' }}
            </h2>
            <p class="text-slate-400 mb-6">
              {{ lang.currentLang === 'et' ? 'Vigane või aegunud kinnituslink. Palun logi sisse ja küsi uus kinnituskiri.' : 'Invalid or expired verification link. Please log in and request a new verification email.' }}
            </p>
            <a routerLink="/login" class="inline-block px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all">
              {{ lang.currentLang === 'et' ? 'Logi sisse' : 'Log in' }}
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
