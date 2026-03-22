import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LangService } from '../../lang.service';
import { RoiService, RoiRegister } from '../../services/roi.service';

@Component({
  selector: 'app-roi-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white pt-24 pb-16 px-4">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-3xl font-bold text-slate-900">{{ lang.t('roi.page_title') }}</h1>
            <p class="text-slate-400 mt-1">{{ lang.t('roi.page_subtitle') }}</p>
          </div>
          <a routerLink="/roi/new"
             class="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all">
            + {{ lang.t('roi.new_register') }}
          </a>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div class="glass-card p-5 text-center">
            <div class="text-3xl font-bold text-blue-600">{{ registers.length }}</div>
            <div class="text-sm text-slate-400 mt-1">{{ lang.t('roi.total_registers') }}</div>
          </div>
          <div class="glass-card p-5 text-center">
            <div class="text-3xl font-bold text-blue-400">{{ getTotalContracts() }}</div>
            <div class="text-sm text-slate-400 mt-1">{{ lang.t('roi.total_contracts') }}</div>
          </div>
          <div class="glass-card p-5 text-center">
            <div class="text-3xl font-bold text-purple-400">{{ getTotalProviders() }}</div>
            <div class="text-sm text-slate-400 mt-1">{{ lang.t('roi.total_providers') }}</div>
          </div>
        </div>

        <!-- ESA Dry Run Banner -->
        <div class="glass-card p-6 mb-8 border-l-4 border-amber-500">
          <div class="flex items-start gap-4">
            <div class="text-3xl">&#9888;</div>
            <div>
              <h3 class="text-lg font-semibold text-amber-400">93.5% {{ lang.t('roi.dry_run_failed') }}</h3>
              <p class="text-slate-400 text-sm mt-1">{{ lang.t('roi.dry_run_desc') }}</p>
            </div>
          </div>
        </div>

        <!-- Registers List -->
        @if (loading) {
          <div class="text-center py-16">
            <div class="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto"></div>
            <p class="text-slate-400 mt-4">{{ lang.t('roi.loading') }}</p>
          </div>
        } @else if (registers.length === 0) {
          <div class="glass-card p-12 text-center">
            <div class="text-6xl mb-4">&#128203;</div>
            <h2 class="text-xl font-semibold text-slate-900 mb-2">{{ lang.t('roi.empty_title') }}</h2>
            <p class="text-slate-400 mb-6">{{ lang.t('roi.empty_desc') }}</p>
            <a routerLink="/roi/new"
               class="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all">
              {{ lang.t('roi.create_first') }}
            </a>
          </div>
        } @else {
          <div class="space-y-4">
            @for (reg of registers; track reg.id) {
              <a [routerLink]="['/roi', reg.id, 'edit']"
                 class="glass-card p-6 block hover:border-blue-500/50 transition-all cursor-pointer">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-lg font-semibold text-slate-900">{{ reg.entityName }}</h3>
                    <p class="text-sm text-slate-400 mt-1">
                      LEI: {{ reg.entityLei || '—' }} &middot;
                      {{ reg.country }} &middot;
                      {{ reg.consolidationScope }}
                    </p>
                  </div>
                  <div class="flex items-center gap-4">
                    <span class="text-xs px-3 py-1 rounded-full"
                          [class]="getStatusClass(reg.status)">
                      {{ lang.t('roi.status_' + reg.status.toLowerCase()) }}
                    </span>
                    <div class="text-right">
                      <div class="text-xs text-slate-500">{{ lang.t('roi.updated') }}</div>
                      <div class="text-sm text-slate-400">{{ reg.updatedAt | date:'dd.MM.yyyy HH:mm' }}</div>
                    </div>
                  </div>
                </div>
                <div class="flex gap-6 mt-3 text-xs text-slate-500">
                  <span>{{ reg.contracts?.length || 0 }} {{ lang.t('roi.contracts_label') }}</span>
                  <span>{{ reg.providers?.length || 0 }} {{ lang.t('roi.providers_label') }}</span>
                  <span>{{ reg.functions?.length || 0 }} {{ lang.t('roi.functions_label') }}</span>
                </div>
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .glass-card {
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(226, 232, 240, 1);
      border-radius: 12px;
      backdrop-filter: blur(12px);
    }
  `]
})
export class RoiDashboardComponent implements OnInit {
  registers: RoiRegister[] = [];
  loading = true;

  constructor(public lang: LangService, private roiService: RoiService) {}

  ngOnInit() {
    this.roiService.getRegisters().subscribe({
      next: (data) => { this.registers = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  getTotalContracts(): number {
    return this.registers.reduce((sum, r) => sum + (r.contracts?.length || 0), 0);
  }

  getTotalProviders(): number {
    return this.registers.reduce((sum, r) => sum + (r.providers?.length || 0), 0);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'VALID': return 'bg-blue-100 text-blue-600';
      case 'EXPORTED': return 'bg-blue-500/20 text-blue-400';
      case 'VALIDATING': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  }
}
