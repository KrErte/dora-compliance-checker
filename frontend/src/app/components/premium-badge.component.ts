import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionService } from '../services/subscription.service';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-premium-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span *ngIf="!subscriptionService.canAccess(feature)"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                 bg-amber-500/10 text-amber-400 border border-amber-500/20 ml-2"
          [title]="lang.t('premium.tooltip')">
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
      </svg>
      <span>PRO</span>
    </span>
  `
})
export class PremiumBadgeComponent {
  @Input() feature: 'PDF_EXPORT' | 'EXCEL_EXPORT' | 'XBRL_EXPORT' | 'CERTIFICATE' | 'AI_REWRITER' | 'ACTION_PLAN_PDF' | 'PROFESSIONAL_REPORT' = 'PDF_EXPORT';
  lang = inject(LangService);

  constructor(public subscriptionService: SubscriptionService) {}
}
