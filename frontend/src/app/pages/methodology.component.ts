import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-methodology',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-3xl font-bold text-slate-100 mb-4">{{ lang.t('methodology.title') }}</h1>
        <p class="text-slate-400">{{ lang.t('methodology.subtitle') }}</p>
      </div>

      <!-- DORA Article 30 Overview -->
      <div class="glass-card p-5 sm:p-8 mb-8">
        <h2 class="text-xl font-bold text-emerald-400 mb-4">{{ lang.t('methodology.art30_title') }}</h2>
        <p class="text-slate-300 mb-6 leading-relaxed">{{ lang.t('methodology.art30_desc') }}</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div *ngFor="let req of requirements" class="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
            <div class="flex items-start gap-3">
              <span class="text-emerald-400 text-lg">{{ req.icon }}</span>
              <div>
                <h3 class="font-medium text-slate-200 mb-1">{{ lang.t(req.titleKey) }}</h3>
                <p class="text-sm text-slate-400">{{ lang.t(req.descKey) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Assessment Process -->
      <div class="glass-card p-5 sm:p-8 mb-8">
        <h2 class="text-xl font-bold text-cyan-400 mb-4">{{ lang.t('methodology.process_title') }}</h2>

        <div class="space-y-6">
          <div *ngFor="let step of steps; let i = index" class="flex gap-4">
            <div class="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold shrink-0">
              {{ i + 1 }}
            </div>
            <div>
              <h3 class="font-medium text-slate-200 mb-1">{{ lang.t(step.titleKey) }}</h3>
              <p class="text-sm text-slate-400">{{ lang.t(step.descKey) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Scoring Methodology -->
      <div class="glass-card p-5 sm:p-8 mb-8">
        <h2 class="text-xl font-bold text-violet-400 mb-4">{{ lang.t('methodology.scoring_title') }}</h2>
        <p class="text-slate-300 mb-6">{{ lang.t('methodology.scoring_desc') }}</p>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div class="text-center p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div class="text-2xl font-bold text-emerald-400 mb-1">80-100%</div>
            <p class="text-sm text-slate-400">{{ lang.t('methodology.compliant') }}</p>
          </div>
          <div class="text-center p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div class="text-2xl font-bold text-amber-400 mb-1">50-79%</div>
            <p class="text-sm text-slate-400">{{ lang.t('methodology.partial') }}</p>
          </div>
          <div class="text-center p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <div class="text-2xl font-bold text-red-400 mb-1">0-49%</div>
            <p class="text-sm text-slate-400">{{ lang.t('methodology.non_compliant') }}</p>
          </div>
        </div>
      </div>

      <!-- Regulatory References -->
      <div class="glass-card p-5 sm:p-8 mb-8">
        <h2 class="text-xl font-bold text-amber-400 mb-4">{{ lang.t('methodology.references_title') }}</h2>

        <div class="space-y-4">
          <a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022R2554" target="_blank" rel="noopener"
             class="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/30 transition-colors">
            <span class="text-2xl">📜</span>
            <div>
              <h3 class="font-medium text-slate-200">DORA Regulation (EU) 2022/2554</h3>
              <p class="text-sm text-slate-500">Official Journal of the European Union</p>
            </div>
            <svg class="w-5 h-5 text-slate-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
          </a>

          <a href="https://www.eba.europa.eu/regulation-and-policy/operational-resilience" target="_blank" rel="noopener"
             class="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/30 transition-colors">
            <span class="text-2xl">🏛️</span>
            <div>
              <h3 class="font-medium text-slate-200">EBA DORA Guidelines</h3>
              <p class="text-sm text-slate-500">European Banking Authority</p>
            </div>
            <svg class="w-5 h-5 text-slate-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
          </a>

          <a href="https://www.fi.ee/en/supervision/cross-sectoral-supervision/digital-operational-resilience-dora" target="_blank" rel="noopener"
             class="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/30 transition-colors">
            <span class="text-2xl">🇪🇪</span>
            <div>
              <h3 class="font-medium text-slate-200">Finantsinspektsioon DORA</h3>
              <p class="text-sm text-slate-500">Estonian Financial Supervision Authority</p>
            </div>
            <svg class="w-5 h-5 text-slate-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- CTA -->
      <div class="text-center">
        <a routerLink="/assessment"
           class="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-semibold px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all">
          {{ lang.t('methodology.start_assessment') }}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </a>
      </div>
    </div>
  `
})
export class MethodologyComponent {
  requirements = [
    { icon: '📋', titleKey: 'methodology.req_sla', descKey: 'methodology.req_sla_desc' },
    { icon: '🚪', titleKey: 'methodology.req_exit', descKey: 'methodology.req_exit_desc' },
    { icon: '🔍', titleKey: 'methodology.req_audit', descKey: 'methodology.req_audit_desc' },
    { icon: '🚨', titleKey: 'methodology.req_incident', descKey: 'methodology.req_incident_desc' },
    { icon: '🔒', titleKey: 'methodology.req_data', descKey: 'methodology.req_data_desc' },
    { icon: '🔗', titleKey: 'methodology.req_subcontracting', descKey: 'methodology.req_subcontracting_desc' },
    { icon: '📍', titleKey: 'methodology.req_location', descKey: 'methodology.req_location_desc' },
    { icon: '⚖️', titleKey: 'methodology.req_termination', descKey: 'methodology.req_termination_desc' }
  ];

  steps = [
    { titleKey: 'methodology.step1_title', descKey: 'methodology.step1_desc' },
    { titleKey: 'methodology.step2_title', descKey: 'methodology.step2_desc' },
    { titleKey: 'methodology.step3_title', descKey: 'methodology.step3_desc' },
    { titleKey: 'methodology.step4_title', descKey: 'methodology.step4_desc' }
  ];

  constructor(public lang: LangService) {}
}
