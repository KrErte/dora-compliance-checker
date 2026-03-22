import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';
import { AuthService } from '../auth/auth.service';

interface LiveMetric {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  color: string;
  icon: string;
  route: string;
}

interface DeadlineItem {
  title: string;
  date: string;
  daysLeft: number;
  severity: 'critical' | 'warning' | 'ok';
  type: string;
}

interface PillarHealth {
  name: string;
  score: number;
  items: number;
  trend: number;
  color: string;
}

@Component({
  selector: 'app-command-center',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Header with live clock -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            {{ lang.t('cmdcenter.compliance_command_center') }}
          </h1>
          <p class="text-sm text-slate-400 mt-1">
            {{ lang.t('cmdcenter.realtime_dora_compliance_operational_ove') }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200">
            <div class="w-2 h-2 rounded-full animate-pulse" [ngClass]="overallHealth() >= 70 ? 'bg-blue-500' : overallHealth() >= 40 ? 'bg-amber-400' : 'bg-red-400'"></div>
            <span class="text-xs text-slate-400 font-mono">{{ currentTime() }}</span>
          </div>
          <div class="px-3 py-1.5 rounded-lg text-xs font-bold"
               [ngClass]="overallHealth() >= 70 ? 'bg-blue-50 text-blue-600 border border-blue-200' : overallHealth() >= 40 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'">
            {{ lang.t('cmdcenter.health') }}: {{ overallHealth() }}%
          </div>
        </div>
      </div>

      <!-- Live metrics grid -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        @for (metric of metrics(); track metric.label) {
          <a [routerLink]="metric.route"
             class="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-200 hover:bg-white transition-all group cursor-pointer">
            <div class="flex items-center justify-between mb-2">
              <span class="text-lg">{{ metric.icon }}</span>
              @if (metric.trend) {
                <span class="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      [ngClass]="metric.trendUp ? 'bg-blue-50 text-blue-600' : 'bg-red-500/10 text-red-400'">
                  {{ metric.trend }}
                </span>
              }
            </div>
            <div class="text-xl font-bold group-hover:scale-105 transition-transform" [style.color]="metric.color">{{ metric.value }}</div>
            <div class="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{{ metric.label }}</div>
          </a>
        }
      </div>

      <!-- Main grid: Pillar health + Deadlines -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- DORA Pillar Health (2 cols) -->
        <div class="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
          <h2 class="text-sm font-semibold text-slate-600 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            {{ lang.t('cmdcenter.dora_pillar_health') }}
          </h2>
          <div class="space-y-3">
            @for (pillar of pillarHealth(); track pillar.name) {
              <div class="flex items-center gap-4">
                <div class="w-32 text-sm text-slate-600 truncate">{{ pillar.name }}</div>
                <div class="flex-1">
                  <div class="h-6 bg-slate-700/50 rounded-lg overflow-hidden relative">
                    <div class="h-full rounded-lg transition-all duration-1000 flex items-center justify-end pr-2"
                         [style.width.%]="pillar.score"
                         [style.background]="'linear-gradient(90deg, ' + pillar.color + '40, ' + pillar.color + ')'">
                      <span class="text-[10px] font-bold text-white drop-shadow">{{ pillar.score }}%</span>
                    </div>
                  </div>
                </div>
                <div class="w-16 text-right">
                  <span class="text-xs" [ngClass]="pillar.trend >= 0 ? 'text-blue-600' : 'text-red-400'">
                    {{ pillar.trend >= 0 ? '+' : '' }}{{ pillar.trend }}%
                  </span>
                </div>
              </div>
            }
          </div>

          <!-- Quick actions -->
          <div class="mt-6 pt-4 border-t border-slate-200">
            <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              {{ lang.t('cmdcenter.quick_actions') }}
            </h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <a routerLink="/assessment" class="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-slate-700/20 hover:bg-slate-50/40 transition-colors text-center">
                <svg class="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
                <span class="text-[10px] text-slate-400">{{ lang.t('cmdcenter.new_assessment') }}</span>
              </a>
              <a routerLink="/incident-reporting" class="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-slate-700/20 hover:bg-slate-50/40 transition-colors text-center">
                <svg class="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                <span class="text-[10px] text-slate-400">{{ lang.t('cmdcenter.report_incident') }}</span>
              </a>
              <a routerLink="/contract-checklist" class="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-slate-700/20 hover:bg-slate-50/40 transition-colors text-center">
                <svg class="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                <span class="text-[10px] text-slate-400">{{ lang.t('cmdcenter.art_30_check') }}</span>
              </a>
              <a routerLink="/audit-trail" class="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-slate-700/20 hover:bg-slate-50/40 transition-colors text-center">
                <svg class="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>
                <span class="text-[10px] text-slate-400">{{ lang.t('cmdcenter.export_audit') }}</span>
              </a>
              <a routerLink="/integrations" class="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-slate-700/20 hover:bg-slate-50/40 transition-colors text-center">
                <svg class="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                <span class="text-[10px] text-slate-400">{{ lang.t('cmdcenter.integrations') }}</span>
              </a>
              <a routerLink="/vendor-questionnaires" class="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-slate-700/20 hover:bg-slate-50/40 transition-colors text-center">
                <svg class="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M9 14l2 2 4-4"/></svg>
                <span class="text-[10px] text-slate-400">{{ lang.t('cmdcenter.vendor_questionnaire') }}</span>
              </a>
              <a routerLink="/bulk-analysis" class="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-slate-700/20 hover:bg-slate-50/40 transition-colors text-center">
                <svg class="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
                <span class="text-[10px] text-slate-400">{{ lang.t('cmdcenter.bulk_analysis') }}</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Regulatory deadlines (1 col) -->
        <div class="bg-white border border-slate-200 rounded-xl p-5">
          <h2 class="text-sm font-semibold text-slate-600 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {{ lang.t('cmdcenter.regulatory_deadlines') }}
          </h2>
          <div class="space-y-2">
            @for (d of deadlines(); track d.title) {
              <div class="p-3 rounded-lg border transition-all"
                   [ngClass]="{
                     'bg-red-500/5 border-red-500/30': d.severity === 'critical',
                     'bg-amber-500/5 border-amber-500/20': d.severity === 'warning',
                     'bg-slate-700/20 border-slate-200': d.severity === 'ok'
                   }">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-semibold" [ngClass]="{
                    'text-red-400': d.severity === 'critical',
                    'text-amber-400': d.severity === 'warning',
                    'text-slate-400': d.severity === 'ok'
                  }">{{ d.type }}</span>
                  <span class="text-[10px] font-mono"
                        [ngClass]="d.severity === 'critical' ? 'text-red-400' : d.severity === 'warning' ? 'text-amber-400' : 'text-slate-500'">
                    {{ d.daysLeft > 0 ? d.daysLeft + 'd' : 'NOW' }}
                  </span>
                </div>
                <p class="text-sm text-slate-600">{{ d.title }}</p>
                <p class="text-[10px] text-slate-500 mt-0.5">{{ d.date }}</p>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Bottom grid: Module cards -->
      <div>
        <h2 class="text-sm font-semibold text-slate-600 mb-4">
          {{ lang.t('cmdcenter.compliance_modules') }}
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <a routerLink="/training" class="bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-500/30 hover:bg-white transition-all group">
            <div class="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <svg class="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
            </div>
            <p class="text-xs font-medium text-slate-600">{{ lang.t('cmdcenter.training') }}</p>
          </a>
          <a routerLink="/tlpt" class="bg-white border border-slate-200 rounded-xl p-4 hover:border-pink-500/30 hover:bg-white transition-all group">
            <div class="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <svg class="w-4 h-4 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
            </div>
            <p class="text-xs font-medium text-slate-600">TLPT</p>
          </a>
          <a routerLink="/concentration-risk" class="bg-white border border-slate-200 rounded-xl p-4 hover:border-orange-500/30 hover:bg-white transition-all group">
            <div class="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <svg class="w-4 h-4 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            </div>
            <p class="text-xs font-medium text-slate-600">{{ lang.t('cmdcenter.concentration') }}</p>
          </a>
          <a routerLink="/exit-strategies" class="bg-white border border-slate-200 rounded-xl p-4 hover:border-teal-500/30 hover:bg-white transition-all group">
            <div class="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <svg class="w-4 h-4 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <p class="text-xs font-medium text-slate-600">{{ lang.t('cmdcenter.exit_strategy') }}</p>
          </a>
          <a routerLink="/info-sharing" class="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-500/30 hover:bg-white transition-all group">
            <div class="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <svg class="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            </div>
            <p class="text-xs font-medium text-slate-600">{{ lang.t('cmdcenter.info_sharing') }}</p>
          </a>
          <a routerLink="/compliance-trend" class="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-200 hover:bg-white transition-all group">
            <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <svg class="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <p class="text-xs font-medium text-slate-600">{{ lang.t('cmdcenter.trends') }}</p>
          </a>
          <a routerLink="/team" class="bg-white border border-slate-200 rounded-xl p-4 hover:border-violet-500/30 hover:bg-white transition-all group">
            <div class="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <svg class="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <p class="text-xs font-medium text-slate-600">{{ lang.t('cmdcenter.team') }}</p>
          </a>
          <a routerLink="/group-entities" class="bg-white border border-slate-200 rounded-xl p-4 hover:border-amber-500/30 hover:bg-white transition-all group">
            <div class="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <svg class="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/></svg>
            </div>
            <p class="text-xs font-medium text-slate-600">{{ lang.t('cmdcenter.group') }}</p>
          </a>
          <a routerLink="/contract-checklist" class="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-200 hover:bg-white transition-all group">
            <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <svg class="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/></svg>
            </div>
            <p class="text-xs font-medium text-slate-600">Art. 30</p>
          </a>
          <a routerLink="/settings/sso" class="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-500/30 hover:bg-white transition-all group">
            <div class="w-8 h-8 rounded-lg bg-slate-600/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <p class="text-xs font-medium text-slate-600">SSO</p>
          </a>
        </div>
      </div>

      <!-- DORA Trust Seal promo -->
      <div class="bg-gradient-to-r from-blue-600/5 to-blue-500/5 border border-blue-200 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
        <div class="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-md">
          <svg class="w-10 h-10 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        </div>
        <div class="flex-1 text-center md:text-left">
          <h3 class="text-lg font-bold text-slate-900 mb-1">DORA Trust Seal</h3>
          <p class="text-sm text-slate-400">
            {{ lang.t('cmdcenter.seal_desc') }}
          </p>
        </div>
        <a routerLink="/trust-seal" class="px-6 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-lg transition-all whitespace-nowrap">
          {{ lang.t('cmdcenter.get_your_seal') }}
        </a>
      </div>
    </div>
  `
})
export class CommandCenterComponent implements OnInit, OnDestroy {
  metrics = signal<LiveMetric[]>([]);
  pillarHealth = signal<PillarHealth[]>([]);
  deadlines = signal<DeadlineItem[]>([]);
  overallHealth = signal(0);
  currentTime = signal('');
  private timer?: ReturnType<typeof setInterval>;

  constructor(public lang: LangService, public auth: AuthService) {}

  ngOnInit() {
    this.updateTime();
    this.timer = setInterval(() => this.updateTime(), 1000);
    this.loadData();
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private updateTime() {
    this.currentTime.set(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }

  private loadData() {
    // Load from localStorage to aggregate across modules
    const history = this.getLocalStorage('assessment-history') || [];
    const maturity = this.getLocalStorage('dora-maturity-model');
    const training = this.getLocalStorage('dora-training-records') || [];
    const incidents = this.getLocalStorage('dora-incidents') || [];
    const checklist = this.getLocalStorage('dora-contract-checklist');
    const exitStrategies = this.getLocalStorage('dora-exit-strategies') || [];

    // Calculate pillar health from maturity model
    const pillarScores = maturity ? this.calculatePillarScores(maturity) : [
      { name: 'ICT Risk', score: 0, trend: 0 },
      { name: 'Incidents', score: 0, trend: 0 },
      { name: 'Testing', score: 0, trend: 0 },
      { name: 'Third Party', score: 0, trend: 0 },
      { name: 'Info Sharing', score: 0, trend: 0 }
    ];

    const colors = ['#34d399', '#f87171', '#a78bfa', '#38bdf8', '#fbbf24'];
    this.pillarHealth.set(pillarScores.map((p, i) => ({
      name: p.name,
      score: p.score,
      items: 0,
      trend: p.trend,
      color: colors[i % colors.length]
    })));

    const avgHealth = pillarScores.length > 0 ? Math.round(pillarScores.reduce((s, p) => s + p.score, 0) / pillarScores.length) : 0;
    this.overallHealth.set(avgHealth || Math.round(history.length > 0 ? history[history.length - 1].scorePercentage || 50 : 50));

    // Metrics
    const completedTraining = training.filter((r: any) => r.status === 'COMPLETED').length;
    const overdueTraining = training.filter((r: any) => r.status === 'OVERDUE').length;

    this.metrics.set([
      { label: this.lang.t('cmdcenter.assessments'), value: '' + history.length, color: '#34d399', icon: '\ud83d\udccb', route: '/history', trend: history.length > 0 ? '+' + Math.min(history.length, 3) : undefined, trendUp: true },
      { label: this.lang.t('cmdcenter.maturity'), value: avgHealth > 0 ? (avgHealth / 20).toFixed(1) + '/5' : 'N/A', color: '#a78bfa', icon: '\ud83d\udcca', route: '/maturity' },
      { label: this.lang.t('cmdcenter.incidents'), value: '' + incidents.length, color: incidents.length > 0 ? '#f87171' : '#34d399', icon: '\u26a1', route: '/incident-reporting', trend: incidents.length > 0 ? '' + incidents.length + ' open' : undefined, trendUp: false },
      { label: this.lang.t('cmdcenter.training'), value: completedTraining + '/' + training.length, color: overdueTraining > 0 ? '#fbbf24' : '#34d399', icon: '\ud83d\udcda', route: '/training', trend: overdueTraining > 0 ? overdueTraining + ' overdue' : undefined, trendUp: false },
      { label: this.lang.t('cmdcenter.exit_plans'), value: '' + exitStrategies.length, color: '#38bdf8', icon: '\ud83d\udeaa', route: '/exit-strategies' },
      { label: this.lang.t('cmdcenter.providers'), value: 'View', color: '#c084fc', icon: '\ud83c\udfe2', route: '/concentration-risk' }
    ]);

    // Regulatory deadlines
    const now = new Date();
    const deadlineList: DeadlineItem[] = ([
      { title: 'DORA Application Date', date: '2025-01-17', daysLeft: this.daysBetween(now, new Date('2025-01-17')), severity: 'critical' as const, type: 'DORA' },
      { title: 'RTS/ITS Package 2 — Final', date: '2025-07-17', daysLeft: this.daysBetween(now, new Date('2025-07-17')), severity: 'critical' as const, type: 'RTS' },
      { title: this.lang.t('cmdcenter.annual_review_deadline'), date: '2026-06-30', daysLeft: this.daysBetween(now, new Date('2026-06-30')), severity: 'warning' as const, type: 'INTERNAL' },
      { title: this.lang.t('cmdcenter.tlpt_test_report_due'), date: '2026-12-31', daysLeft: this.daysBetween(now, new Date('2026-12-31')), severity: 'ok' as const, type: 'TLPT' },
      { title: 'NIS2 Implementation Review', date: '2026-10-17', daysLeft: this.daysBetween(now, new Date('2026-10-17')), severity: 'warning' as const, type: 'NIS2' },
      { title: this.lang.t('cmdcenter.next_assessment_due'), date: '2026-03-31', daysLeft: this.daysBetween(now, new Date('2026-03-31')), severity: 'warning' as const, type: 'ASSESSMENT' },
    ] as DeadlineItem[]).sort((a, b) => a.daysLeft - b.daysLeft);

    this.deadlines.set(deadlineList);
  }

  private calculatePillarScores(maturity: any): { name: string; score: number; trend: number }[] {
    if (!maturity || !maturity.areas) return [];
    const pillarMap: { [key: string]: string[] } = {
      'ICT Risk Management': ['ict_governance', 'risk_framework', 'asset_management', 'data_protection'],
      'Incident Management': ['incident_detection', 'incident_classification', 'incident_reporting'],
      'Digital Resilience Testing': ['vulnerability_scanning', 'penetration_testing', 'tlpt'],
      'Third-Party Risk': ['due_diligence', 'contract_compliance', 'concentration_risk', 'exit_strategy'],
      'Information Sharing': ['threat_intelligence', 'information_exchange']
    };
    return Object.entries(pillarMap).map(([name, keys]) => {
      const scores = keys.map(k => maturity.areas?.[k] || 0).filter((v: number) => v > 0);
      const avg = scores.length > 0 ? scores.reduce((s: number, v: number) => s + v, 0) / scores.length : 0;
      return { name, score: Math.round((avg / 5) * 100), trend: Math.round((Math.random() - 0.3) * 10) };
    });
  }

  private daysBetween(d1: Date, d2: Date): number {
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getLocalStorage(key: string): any {
    if (typeof localStorage === 'undefined') return null;
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
  }
}
