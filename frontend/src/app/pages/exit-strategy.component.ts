import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LangService } from '../lang.service';

interface ExitStrategy {
  id: string;
  providerName: string;
  serviceType: string;
  criticality: 'CRITICAL' | 'IMPORTANT' | 'STANDARD';
  transitionPeriodMonths: number;
  alternativeProviders: string;
  keyRisks: string;
  dataReturnPlan: string;
  status: 'DRAFT' | 'APPROVED' | 'TESTED';
  lastReviewDate: string;
}

@Component({
  selector: 'app-exit-strategy',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </div>
            {{ lang.t('exitstrat.exit_strategies') }}
          </h1>
          <p class="text-slate-400 text-sm mt-1">{{ lang.t('exitstrat.dora_art_28_30_exit_plans_for_critical_i') }}</p>
        </div>
        <button (click)="showForm = true" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold text-sm hover:shadow-lg transition-all flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          {{ lang.t('exitstrat.add_strategy') }}
        </button>
      </div>

      @for (strategy of strategies(); track strategy.id) {
        <div class="bg-white border border-slate-200 rounded-xl p-5">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-white font-semibold">{{ strategy.providerName }}</h3>
              <p class="text-xs text-slate-400">{{ strategy.serviceType }} &bull; {{ lang.t('exitstrat.transition') }}: {{ strategy.transitionPeriodMonths }} {{ lang.t('exitstrat.months') }}</p>
            </div>
            <div class="flex gap-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                    [class]="strategy.criticality === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : strategy.criticality === 'IMPORTANT' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'">
                {{ strategy.criticality }}
              </span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                    [class]="strategy.status === 'TESTED' ? 'bg-blue-100 text-blue-600' : strategy.status === 'APPROVED' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-600'">
                {{ strategy.status }}
              </span>
            </div>
          </div>
          @if (strategy.alternativeProviders) {
            <div class="text-xs text-slate-400 mb-1"><span class="text-slate-500">{{ lang.t('exitstrat.alternative_providers') }}:</span> {{ strategy.alternativeProviders }}</div>
          }
          @if (strategy.keyRisks) {
            <div class="text-xs text-slate-400 mb-1"><span class="text-slate-500">{{ lang.t('exitstrat.key_risks') }}:</span> {{ strategy.keyRisks }}</div>
          }
          <div class="flex gap-2 mt-3">
            <select [(ngModel)]="strategy.status" (ngModelChange)="save()" class="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-white focus:outline-none">
              <option value="DRAFT">Draft</option>
              <option value="APPROVED">Approved</option>
              <option value="TESTED">Tested</option>
            </select>
            <button (click)="deleteStrategy(strategy.id)" class="text-slate-500 hover:text-red-400 text-xs">{{ lang.t('exitstrat.delete') }}</button>
          </div>
        </div>
      }

      @if (strategies().length === 0 && !showForm) {
        <div class="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <p class="text-slate-400">{{ lang.t('exitstrat.no_exit_strategies_added') }}</p>
        </div>
      }

      @if (showForm) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="showForm = false">
          <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg" (click)="$event.stopPropagation()">
            <h2 class="text-lg font-bold text-white mb-4">{{ lang.t('exitstrat.new_exit_strategy') }}</h2>
            <div class="space-y-4">
              <input [(ngModel)]="newStrategy.providerName" type="text" [placeholder]="lang.t('exitstrat.provider_name')" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-white focus:outline-none">
              <div class="grid grid-cols-2 gap-4">
                <input [(ngModel)]="newStrategy.serviceType" type="text" [placeholder]="lang.t('exitstrat.service_type')" class="px-3 py-2 bg-white border border-slate-200 rounded-lg text-white text-sm focus:outline-none">
                <select [(ngModel)]="newStrategy.criticality" class="px-3 py-2 bg-white border border-slate-200 rounded-lg text-white text-sm focus:outline-none">
                  <option value="CRITICAL">Critical</option>
                  <option value="IMPORTANT">Important</option>
                  <option value="STANDARD">Standard</option>
                </select>
              </div>
              <input [(ngModel)]="newStrategy.transitionPeriodMonths" type="number" [placeholder]="lang.t('exitstrat.transition_period_months')" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-white text-sm focus:outline-none">
              <textarea [(ngModel)]="newStrategy.alternativeProviders" rows="2" [placeholder]="lang.t('exitstrat.alternative_providers_15')" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-white text-sm focus:outline-none"></textarea>
              <textarea [(ngModel)]="newStrategy.keyRisks" rows="2" [placeholder]="lang.t('exitstrat.key_risks_16')" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-white text-sm focus:outline-none"></textarea>
              <textarea [(ngModel)]="newStrategy.dataReturnPlan" rows="2" [placeholder]="lang.t('exitstrat.data_return_plan')" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-white text-sm focus:outline-none"></textarea>
              <div class="flex justify-end gap-3">
                <button (click)="showForm = false" class="px-4 py-2 rounded-xl bg-slate-700/50 text-slate-600 text-sm">{{ lang.t('exitstrat.cancel') }}</button>
                <button (click)="addStrategy()" [disabled]="!newStrategy.providerName" class="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-semibold disabled:opacity-50">
                  {{ lang.t('exitstrat.add') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ExitStrategyComponent {
  strategies = signal<ExitStrategy[]>([]);
  showForm = false;
  newStrategy: any = { providerName: '', serviceType: '', criticality: 'CRITICAL', transitionPeriodMonths: 6, alternativeProviders: '', keyRisks: '', dataReturnPlan: '' };

  constructor(public lang: LangService) {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('dora-exit-strategies');
      if (saved) { try { this.strategies.set(JSON.parse(saved)); } catch {} }
    }
  }

  addStrategy() {
    const strategy: ExitStrategy = { id: crypto.randomUUID(), ...this.newStrategy, status: 'DRAFT', lastReviewDate: new Date().toISOString().slice(0, 10) };
    this.strategies.update(s => [strategy, ...s]);
    this.save();
    this.showForm = false;
    this.newStrategy = { providerName: '', serviceType: '', criticality: 'CRITICAL', transitionPeriodMonths: 6, alternativeProviders: '', keyRisks: '', dataReturnPlan: '' };
  }

  deleteStrategy(id: string) {
    this.strategies.update(s => s.filter(x => x.id !== id));
    this.save();
  }

  save() { if (typeof localStorage !== 'undefined') localStorage.setItem('dora-exit-strategies', JSON.stringify(this.strategies())); }
}
