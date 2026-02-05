import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { AssessmentResult } from '../models';

@Component({
  selector: 'app-certificate',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-3xl mx-auto">
      <div *ngIf="loading" class="text-center py-16 animate-fade-in">
        <div class="inline-block w-10 h-10 border-4 border-slate-700 border-t-emerald-400 rounded-full animate-spin"></div>
      </div>

      <div *ngIf="result" class="animate-scale-in">
        <!-- Certificate -->
        <div class="certificate-border p-1">
          <div class="bg-slate-900 rounded-xl p-5 sm:p-10 text-center relative overflow-hidden">
            <!-- Background pattern -->
            <div class="absolute inset-0 opacity-5">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="cert-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                    <circle cx="20" cy="20" r="1" fill="#34d399"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#cert-pattern)"/>
              </svg>
            </div>

            <div class="relative z-10">
              <!-- Logo -->
              <div class="flex justify-center mb-6">
                <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 font-extrabold text-2xl shadow-lg shadow-emerald-500/20">
                  D
                </div>
              </div>

              <!-- Title -->
              <p class="text-xs uppercase tracking-[0.3em] text-emerald-400 mb-2">DORA Vastavuskontroll</p>
              <h1 class="text-3xl md:text-4xl font-extrabold mb-2">
                <span class="gradient-text">Vastavustunnistus</span>
              </h1>
              <p class="text-slate-500 text-sm mb-8">EU m&auml;&auml;rus 2022/2554 &middot; Artiklid 28&ndash;30</p>

              <!-- Divider -->
              <div class="flex items-center gap-4 mb-8">
                <div class="flex-1 h-px bg-gradient-to-r from-transparent to-emerald-500/30"></div>
                <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                <div class="flex-1 h-px bg-gradient-to-l from-transparent to-emerald-500/30"></div>
              </div>

              <!-- Certification text -->
              <p class="text-slate-400 mb-2">K&auml;esolevaga kinnitatakse, et</p>
              <h2 class="text-2xl font-bold text-slate-100 mb-1">{{ result.companyName }}</h2>
              <p class="text-slate-400 mb-6">on l&auml;binud DORA kolmanda osapoole riski hindamise</p>

              <!-- Contract -->
              <div class="inline-block bg-slate-800/50 border border-slate-700/50 rounded-xl px-6 py-3 mb-8">
                <p class="text-xs text-slate-500">Hinnatud leping</p>
                <p class="text-slate-200 font-medium">{{ result.contractName }}</p>
              </div>

              <!-- Score -->
              <div class="flex justify-center mb-8">
                <div class="relative w-32 h-32">
                  <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" stroke-width="4"/>
                    <circle cx="50" cy="50" r="45" fill="none"
                            [attr.stroke]="levelColor"
                            stroke-width="4"
                            stroke-linecap="round"
                            stroke-dasharray="282.74"
                            [attr.stroke-dashoffset]="282.74 - (282.74 * result.scorePercentage / 100)"
                            class="animate-draw-circle"/>
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-3xl font-extrabold" [style.color]="levelColor">{{ result.scorePercentage | number:'1.0-0' }}%</span>
                  </div>
                </div>
              </div>

              <!-- Badge -->
              <div class="mb-8">
                <span class="inline-block px-6 py-2 rounded-full text-sm font-bold"
                      [class]="badgeClass">
                  {{ badgeLabel }}
                </span>
              </div>

              <!-- Stats -->
              <div class="grid grid-cols-3 gap-2 sm:gap-4 mb-8 max-w-sm mx-auto">
                <div>
                  <div class="text-2xl font-bold text-emerald-400">{{ result.compliantCount }}</div>
                  <p class="text-xs text-slate-500">vastav</p>
                </div>
                <div>
                  <div class="text-2xl font-bold text-red-400">{{ result.nonCompliantCount }}</div>
                  <p class="text-xs text-slate-500">mittevastav</p>
                </div>
                <div>
                  <div class="text-2xl font-bold text-slate-300">{{ result.totalQuestions }}</div>
                  <p class="text-xs text-slate-500">kokku</p>
                </div>
              </div>

              <!-- Date & ID -->
              <div class="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs text-slate-600">
                <span>Kuup&auml;ev: {{ result.assessmentDate | date:'dd.MM.yyyy' }}</span>
                <span>&middot;</span>
                <span>ID: {{ result.id }}</span>
              </div>

              <!-- Signature line -->
              <div class="mt-8 pt-6 border-t border-slate-800">
                <div class="flex items-center justify-center gap-2 text-xs text-slate-600">
                  <div class="w-6 h-6 rounded bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 font-bold text-xs">D</div>
                  DORA Vastavuskontrolli T&ouml;&ouml;riist &middot; Automaatne hindamine
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row justify-center gap-3 mt-6 no-print">
          <button (click)="printCert()"
                  class="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400
                         text-white font-semibold px-6 py-2.5 rounded-lg transition-all duration-300
                         hover:shadow-lg hover:shadow-violet-500/25 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
            </svg>
            Prindi tunnistus
          </button>
          <a [routerLink]="['/results', result.id]"
             class="bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 font-semibold px-6 py-2.5 rounded-lg
                    transition-all duration-300 border border-slate-600/50 hover:border-slate-500/50 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Tagasi tulemuste juurde
          </a>
        </div>
      </div>
    </div>
  `
})
export class CertificateComponent implements OnInit {
  result: AssessmentResult | null = null;
  loading = true;

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getAssessment(id).subscribe({
      next: (result) => {
        this.result = result;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get levelColor(): string {
    switch (this.result?.complianceLevel) {
      case 'GREEN': return '#34d399';
      case 'YELLOW': return '#fbbf24';
      case 'RED': return '#f87171';
      default: return '#64748b';
    }
  }

  get badgeClass(): string {
    switch (this.result?.complianceLevel) {
      case 'GREEN': return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25';
      case 'YELLOW': return 'bg-amber-500/15 text-amber-400 border border-amber-500/25';
      case 'RED': return 'bg-red-500/15 text-red-400 border border-red-500/25';
      default: return '';
    }
  }

  get badgeLabel(): string {
    switch (this.result?.complianceLevel) {
      case 'GREEN': return '\u2713 T\u00e4ielikult vastav';
      case 'YELLOW': return '\u26a0 Osaliselt vastav';
      case 'RED': return '\u2717 Mittevastav';
      default: return '';
    }
  }

  printCert() {
    window.print();
  }
}
