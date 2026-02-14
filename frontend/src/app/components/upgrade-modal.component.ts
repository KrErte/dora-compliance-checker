import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SubscriptionService, PremiumFeature } from '../services/subscription.service';
import { LangService } from '../lang.service';
import { PAYMENT_CONFIG } from '../config/payment.config';

@Component({
  selector: 'app-upgrade-modal',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div *ngIf="isVisible()" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-fade-in"
           (click)="close()"></div>

      <!-- Modal -->
      <div class="relative bg-slate-800/95 backdrop-blur border border-slate-700/50 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-emerald-500/10 animate-scale-in">
        <!-- Close button -->
        <button (click)="close()"
                class="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <!-- Lock icon with animation -->
        <div class="flex justify-center mb-6">
          <div class="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center animate-pulse-slow">
            <svg class="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
        </div>

        <!-- Title -->
        <h2 class="text-xl font-bold text-center text-slate-100 mb-2">
          {{ featureMessage().title }}
        </h2>

        <!-- Description -->
        <p class="text-sm text-slate-400 text-center mb-4">
          {{ featureMessage().description }}
        </p>

        <!-- Price badge -->
        <div class="flex justify-center mb-6">
          <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span class="text-lg font-bold text-emerald-400">{{ featureMessage().price }}</span>
          </span>
        </div>

        <!-- Data saved notice -->
        <div class="bg-slate-700/30 rounded-xl p-4 mb-6 border border-slate-600/30">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
              <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-200">{{ lang.t('paywall.data_saved_title') }}</p>
              <p class="text-xs text-slate-500 mt-1">{{ lang.t('paywall.data_saved_desc') }}</p>
            </div>
          </div>
        </div>

        <!-- Features list -->
        <div class="space-y-2 mb-6">
          <div class="flex items-center gap-2 text-sm">
            <svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span class="text-slate-300">{{ lang.t('paywall.feature_pdf') }}</span>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span class="text-slate-300">{{ lang.t('paywall.feature_excel') }}</span>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span class="text-slate-300">{{ lang.t('paywall.feature_certificate') }}</span>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span class="text-slate-300">{{ lang.t('paywall.feature_action_plan') }}</span>
          </div>
        </div>

        <!-- CTA Buttons -->
        <div class="space-y-3">
          <a [href]="paymentConfig.lemonsqueezy.products.standard?.checkoutUrl || paymentConfig.lemonsqueezy.products.doraAssessment.checkoutUrl"
             target="_blank"
             (click)="onUpgrade()"
             class="w-full py-3.5 px-4 rounded-xl text-center font-bold text-sm block
                    bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900
                    hover:from-emerald-400 hover:to-cyan-400 hover:shadow-lg hover:shadow-emerald-500/30
                    transition-all duration-300">
            {{ lang.t('paywall.upgrade_cta') }}
            <svg class="w-4 h-4 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </a>

          <a routerLink="/pricing"
             (click)="close()"
             class="w-full py-3 px-4 rounded-xl text-center font-medium text-sm block
                    bg-slate-700/50 text-slate-300 border border-slate-600/50
                    hover:bg-slate-600/50 hover:text-slate-200 transition-all">
            {{ lang.t('paywall.view_plans') }}
          </a>
        </div>

        <!-- Footer note -->
        <p class="text-xs text-slate-500 text-center mt-4">
          {{ lang.t('paywall.footer_note') }}
        </p>
      </div>
    </div>
  `,
  styles: [`
    @keyframes pulse-slow {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.05); }
    }
    .animate-pulse-slow {
      animation: pulse-slow 2s ease-in-out infinite;
    }
  `]
})
export class UpgradeModalComponent {
  paymentConfig = PAYMENT_CONFIG;

  isVisible = this.subscriptionService.showUpgradeModal;
  feature = this.subscriptionService.upgradeFeature;

  featureMessage = computed(() => {
    const feat = this.feature();
    if (!feat) {
      return { title: '', description: '', price: '' };
    }
    return this.subscriptionService.getUpgradeMessage(feat);
  });

  constructor(
    private subscriptionService: SubscriptionService,
    public lang: LangService
  ) {}

  close(): void {
    this.subscriptionService.closeUpgradeModal();
  }

  onUpgrade(): void {
    this.subscriptionService.onUpgradeClick();
  }
}
