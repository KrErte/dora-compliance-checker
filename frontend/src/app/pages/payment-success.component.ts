import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Confetti background -->
    <div class="confetti-container">
      @for (i of confettiPieces; track i) {
        <div class="confetti" [style.left.%]="i * 5" [style.animation-delay.s]="i * 0.1"></div>
      }
    </div>

    <div class="max-w-2xl mx-auto text-center relative z-10">
      <!-- Success Icon -->
      <div class="mb-8">
        <div class="success-icon mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20
                    border-2 border-emerald-500/50 flex items-center justify-center">
          <svg class="w-12 h-12 text-emerald-400 checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path class="checkmark-path" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
      </div>

      <!-- Title -->
      <h1 class="text-3xl md:text-4xl font-bold gradient-text mb-4 animate-fade-in">
        {{ lang.t('payment.success_title') }}
      </h1>

      <!-- Subtitle -->
      <p class="text-lg text-slate-300 mb-10 animate-fade-in-delay">
        {{ lang.t('payment.license_activated') }}
      </p>

      <!-- Action Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <!-- DORA Assessment -->
        <a routerLink="/assessment"
           class="glass-card p-5 rounded-xl border border-slate-700/50
                  hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10
                  transition-all duration-300 group">
          <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20
                      flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
            <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <span class="text-slate-200 font-medium text-sm group-hover:text-emerald-400 transition-colors">
            {{ lang.t('payment.start_dora') }}
          </span>
        </a>

        <!-- NIS2 Assessment -->
        <a routerLink="/nis2/assessment"
           class="glass-card p-5 rounded-xl border border-slate-700/50
                  hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10
                  transition-all duration-300 group">
          <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20
                      flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
            <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <span class="text-slate-200 font-medium text-sm group-hover:text-cyan-400 transition-colors">
            {{ lang.t('payment.start_nis2') }}
          </span>
        </a>

        <!-- Contract Analysis -->
        <a routerLink="/contract-analysis"
           class="glass-card p-5 rounded-xl border border-slate-700/50
                  hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10
                  transition-all duration-300 group">
          <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20
                      flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
            <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <span class="text-slate-200 font-medium text-sm group-hover:text-amber-400 transition-colors">
            {{ lang.t('payment.analyze_contract') }}
          </span>
        </a>
      </div>

      <!-- Invoice note -->
      <p class="text-slate-500 text-sm flex items-center justify-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
        {{ lang.t('payment.invoice_sent') }}
      </p>
    </div>
  `,
  styles: [`
    .confetti-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
      z-index: 0;
    }

    .confetti {
      position: absolute;
      width: 10px;
      height: 10px;
      top: -10px;
      opacity: 0;
      animation: confetti-fall 4s ease-in-out forwards;
    }

    .confetti:nth-child(odd) {
      background: linear-gradient(135deg, #10b981, #06b6d4);
      border-radius: 50%;
    }

    .confetti:nth-child(even) {
      background: linear-gradient(135deg, #f59e0b, #ef4444);
      clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
    }

    .confetti:nth-child(3n) {
      background: linear-gradient(135deg, #8b5cf6, #ec4899);
      border-radius: 2px;
    }

    @keyframes confetti-fall {
      0% {
        transform: translateY(0) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
      }
    }

    .success-icon {
      animation: success-pop 0.5s ease-out forwards;
    }

    @keyframes success-pop {
      0% {
        transform: scale(0);
        opacity: 0;
      }
      50% {
        transform: scale(1.2);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    .checkmark-path {
      stroke-dasharray: 30;
      stroke-dashoffset: 30;
      animation: checkmark-draw 0.5s ease-out 0.3s forwards;
    }

    @keyframes checkmark-draw {
      to {
        stroke-dashoffset: 0;
      }
    }

    .animate-fade-in {
      animation: fade-in 0.5s ease-out 0.5s forwards;
      opacity: 0;
    }

    .animate-fade-in-delay {
      animation: fade-in 0.5s ease-out 0.7s forwards;
      opacity: 0;
    }

    @keyframes fade-in {
      to {
        opacity: 1;
      }
    }

    .gradient-text {
      background: linear-gradient(135deg, #10b981, #06b6d4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .glass-card {
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(12px);
    }
  `]
})
export class PaymentSuccessComponent implements OnInit {
  confettiPieces = Array.from({ length: 20 }, (_, i) => i);

  constructor(
    public lang: LangService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const checkoutId = this.route.snapshot.queryParamMap.get('checkout_id');

    if (checkoutId) {
      localStorage.setItem('paymentCompleted', JSON.stringify({
        checkoutId: checkoutId,
        timestamp: new Date().toISOString(),
        products: ['all']
      }));
    }
  }
}
