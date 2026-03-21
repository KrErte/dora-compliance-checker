import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-[60vh] flex items-center justify-center p-4">
      @if (loading()) {
        <div class="text-center">
          <div class="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin"></div>
          <p class="text-slate-400">{{ lang.l('Kontrollimine...', 'Verifying...') }}</p>
        </div>
      }

      @if (!loading() && verified()) {
        <div class="max-w-md w-full">
          <div class="bg-white border border-blue-200 rounded-2xl overflow-hidden">
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-600/20 to-blue-500/20 border-b border-blue-200 p-6 text-center">
              <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center">
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <h1 class="text-xl font-bold text-white">DORA Compliance Verified</h1>
              <p class="text-sm text-blue-600 mt-1">Verified by DoraAudit.eu</p>
            </div>

            <!-- Details -->
            <div class="p-6 space-y-4">
              <div class="flex justify-between items-center py-2 border-b border-slate-200">
                <span class="text-sm text-slate-400">{{ lang.l('Ettevõte', 'Company') }}</span>
                <span class="text-sm font-medium text-white">{{ data()?.companyName || '—' }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-slate-200">
                <span class="text-sm text-slate-400">{{ lang.l('Vastavusskoor', 'Compliance Score') }}</span>
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                       [class]="(data()?.score || 0) >= 80 ? 'bg-blue-100 text-blue-600' : (data()?.score || 0) >= 60 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'">
                    {{ data()?.score }}%
                  </div>
                </div>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-slate-200">
                <span class="text-sm text-slate-400">{{ lang.l('Hindamise kuupäev', 'Assessment Date') }}</span>
                <span class="text-sm text-slate-600">{{ data()?.assessmentDate }}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-sm text-slate-400">{{ lang.l('Kehtiv kuni', 'Valid Until') }}</span>
                <span class="text-sm font-medium" [class]="data()?.expired ? 'text-red-400' : 'text-blue-600'">
                  {{ data()?.validUntil }}
                  @if (data()?.expired) {
                    <span class="ml-1 text-xs">({{ lang.l('Aegunud', 'Expired') }})</span>
                  }
                </span>
              </div>
            </div>

            <!-- Footer -->
            <div class="bg-white border-t border-slate-200 p-4 text-center">
              <a href="https://doraaudit.eu" target="_blank" class="text-xs text-slate-500 hover:text-blue-500 transition-colors">
                Powered by DoraAudit.eu — DORA Compliance Platform
              </a>
            </div>
          </div>
        </div>
      }

      @if (!loading() && !verified()) {
        <div class="max-w-md w-full text-center">
          <div class="bg-white border border-red-500/30 rounded-2xl p-8">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
              <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <h1 class="text-xl font-bold text-white mb-2">{{ lang.l('Kinnitust ei leitud', 'Verification Not Found') }}</h1>
            <p class="text-sm text-slate-400 mb-6">{{ lang.l('Seda kinnitustunnust ei leitud või see on aegunud.', 'This verification seal was not found or has expired.') }}</p>
            <a routerLink="/" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-700 text-slate-600 text-sm hover:bg-slate-600 transition-colors">
              {{ lang.l('Tagasi avalehele', 'Back to Home') }}
            </a>
          </div>
        </div>
      }
    </div>
  `
})
export class VerifyComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  readonly lang = inject(LangService);

  loading = signal(true);
  verified = signal(false);
  data = signal<any>(null);

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token') || '';
    this.api.verifyTrustSeal(token).subscribe({
      next: (result) => {
        this.data.set(result);
        this.verified.set(result.verified);
        this.loading.set(false);
      },
      error: () => {
        this.verified.set(false);
        this.loading.set(false);
      }
    });
  }
}
