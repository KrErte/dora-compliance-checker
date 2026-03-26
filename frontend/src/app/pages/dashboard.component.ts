import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LangService } from '../lang.service';
import { ApiService } from '../api.service';
import { SubscriptionService } from '../services/subscription.service';
import { AuthService } from '../auth/auth.service';
import { ChecklistService } from '../services/checklist.service';
import { GettingStartedChecklistComponent } from '../components/getting-started-checklist.component';
import { AutopilotInsight, AutopilotCounts } from '../models';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface HistoryEntry {
  id: string;
  companyName: string;
  contractName: string;
  scorePercentage: number;
  complianceLevel: 'GREEN' | 'YELLOW' | 'RED';
  assessmentDate: string;
  compliantCount: number;
  partialCount?: number;
  nonCompliantCount?: number;
  totalQuestions: number;
  pillarScores?: { [id: string]: number };
}

interface LeaderboardEntry extends HistoryEntry {
  rank: number;
}

interface PillarData {
  icon: string;
  labelKey: string;
  percentage: number;
  color: string;
  dashOffset: number;
}

interface ChartPoint {
  x: number;
  y: number;
  color: string;
  score: number;
  dateLabel: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, GettingStartedChecklistComponent],
  template: `
    <div class="max-w-6xl mx-auto">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6 animate-fade-in-up">
        <div>
          <h1 class="text-3xl md:text-4xl font-extrabold">
            <span class="gradient-text">{{ greeting() }}</span>
          </h1>
          @if (history.length === 0) {
            <p class="text-slate-500 text-sm mt-1">Your DORA compliance journey starts here 🚀</p>
          } @else {
            <p class="text-slate-500 text-sm mt-1">{{ history.length }} {{ lang.t('dashboard.assessments_total') }} &middot; {{ lang.t('dashboard.last_updated') }}: {{ lastUpdated }}</p>
          }
        </div>
        <div class="flex gap-3">
          @if (subService.canAccess('COMPLIANCE_REPORT')) {
            <button (click)="generateComplianceReport()" [disabled]="generatingReport()"
              class="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500
                     text-white font-semibold px-5 py-2.5 rounded-lg transition-all duration-300
                     hover:shadow-lg hover:shadow-violet-500/25 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              @if (generatingReport()) {
                <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>
                {{ lang.t('dashboard.generating_report') }}
              } @else {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                {{ lang.t('dashboard.generate_report') }}
              }
            </button>
          } @else {
            <button (click)="subService.showUpgrade('COMPLIANCE_REPORT')"
              class="bg-white backdrop-blur border border-violet-500/30 text-slate-400 font-semibold
                     px-5 py-2.5 rounded-lg transition-all duration-300 hover:border-violet-500/50
                     hover:bg-white flex items-center gap-2 text-sm">
              <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke-width="2"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              {{ lang.t('dashboard.generate_report') }}
            </button>
          }
          <button (click)="downloadDashboardPdf()" [disabled]="generatingDashPdf()"
            class="bg-slate-200/50 border border-slate-200 text-slate-600 font-semibold px-5 py-2.5 rounded-lg transition-all hover:border-blue-500/30 hover:bg-white flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            @if (generatingDashPdf()) {
              <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>
              Generating...
            } @else {
              <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Download PDF
            }
          </button>
          <a routerLink="/history"
             class="bg-white backdrop-blur border border-slate-200 text-slate-600 font-semibold
                    px-5 py-2.5 rounded-lg transition-all duration-300 hover:border-blue-200
                    hover:bg-white flex items-center gap-2 text-sm">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ lang.t('dashboard.history') }}
          </a>
          <a routerLink="/assessment"
             class="bg-blue-600 hover:bg-blue-700
                    text-slate-900 font-semibold px-5 py-2.5 rounded-lg transition-all duration-300
                    hover:shadow-lg hover:shadow-lg flex items-center gap-2 text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            {{ lang.t('dashboard.new_assessment') }}
          </a>
        </div>
      </div>

      <!-- Trial Banner -->
      <div *ngIf="subService.isTrialActive()" class="mb-6 animate-fade-in-up">
        <div class="bg-gradient-to-r from-blue-600/10 to-blue-500/10 border border-blue-200
                    rounded-xl px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-blue-500">{{ lang.t('trial.banner_title') }}</p>
              <p class="text-xs text-slate-400">{{ subService.trialDaysLeft() }} {{ lang.t('trial.banner_days_left') }} &middot; {{ lang.t('trial.banner_features_active') }}</p>
            </div>
          </div>
          <a routerLink="/pricing"
             class="bg-blue-600 hover:bg-blue-700
                    text-slate-900 font-semibold px-5 py-2 rounded-lg transition-all duration-300
                    hover:shadow-lg hover:shadow-lg text-sm flex items-center gap-2 whitespace-nowrap">
            {{ lang.t('trial.banner_upgrade') }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- Getting Started Checklist -->
      <app-getting-started-checklist />

      <!-- Compliance Score Widget -->
      @if (auditReadiness() && history.length > 0) {
        <div class="mb-6 animate-fade-in-up">
          <div class="bg-white backdrop-blur border border-slate-200 rounded-xl p-5">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600/20 to-blue-500/20 border border-blue-200 flex items-center justify-center">
                  <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-slate-900">{{ lang.l('Vastavuse koondskoor', 'Compliance Score') }}</h3>
                  <p class="text-[11px] text-slate-500">{{ lang.l('Auditiks valmisolek', 'Audit Readiness Overview') }}</p>
                </div>
              </div>
              <a routerLink="/audit-readiness" class="text-xs text-blue-600 hover:text-blue-500 font-medium flex items-center gap-1 transition-colors">
                {{ lang.l('Vaata detaile', 'View Details') }}
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </a>
            </div>
            <div class="flex items-center gap-6">
              <!-- Circular progress ring -->
              <div class="relative flex-shrink-0">
                <svg viewBox="0 0 80 80" class="w-20 h-20">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgb(51 65 85)" stroke-width="6"/>
                  <circle cx="40" cy="40" r="34" fill="none"
                          [attr.stroke]="auditReadiness().overallScore >= 80 ? '#34d399' : auditReadiness().overallScore >= 60 ? '#fbbf24' : auditReadiness().overallScore >= 40 ? '#f97316' : '#ef4444'"
                          stroke-width="6" stroke-linecap="round"
                          [attr.stroke-dasharray]="(auditReadiness().overallScore / 100 * 213.6) + ' 213.6'"
                          transform="rotate(-90 40 40)"/>
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-lg font-bold"
                        [class]="auditReadiness().overallScore >= 80 ? 'text-blue-600' : auditReadiness().overallScore >= 60 ? 'text-amber-400' : auditReadiness().overallScore >= 40 ? 'text-orange-400' : 'text-red-400'">
                    {{ auditReadiness().overallScore }}%
                  </span>
                </div>
              </div>
              <!-- Module breakdown bars -->
              <div class="flex-1 space-y-2">
                @for (mod of auditModules(); track mod.key) {
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] text-slate-400 w-24 truncate">{{ mod.label }}</span>
                    <div class="flex-1 h-2 bg-slate-200/50 rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-500"
                           [style.width.%]="mod.score"
                           [class]="mod.score >= 80 ? 'bg-blue-600' : mod.score >= 60 ? 'bg-amber-500' : mod.score >= 40 ? 'bg-orange-500' : 'bg-red-500'"></div>
                    </div>
                    <span class="text-[10px] font-medium w-8 text-right"
                          [class]="mod.score >= 80 ? 'text-blue-600' : mod.score >= 60 ? 'text-amber-400' : mod.score >= 40 ? 'text-orange-400' : 'text-red-400'">{{ mod.score }}%</span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Achievement Badges Widget -->
      @if (history.length > 0 && achievements().length > 0) {
        <div class="mb-6 animate-fade-in-up">
          <div class="bg-white backdrop-blur border border-slate-200 rounded-xl p-5">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
                  <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    {{ lang.l('Saavutused', 'Achievements') }}
                    @if (newAchievementCount() > 0) {
                      <span class="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-amber-500 text-white animate-pulse">{{ newAchievementCount() }} {{ lang.l('uut', 'new') }}</span>
                    }
                  </h3>
                  <p class="text-[11px] text-slate-500">{{ unlockedCount() }}/{{ achievements().length }} {{ lang.l('avatud', 'unlocked') }}</p>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-5 sm:grid-cols-10 gap-2">
              @for (badge of achievements(); track badge.key) {
                <div class="group relative flex flex-col items-center"
                     (click)="badge.unlocked && !badge.seen && markAchievementSeen(badge.key)">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all"
                       [class]="badge.unlocked ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 shadow-lg shadow-amber-500/10' : 'bg-slate-200/30 border border-slate-200 opacity-40'">
                    {{ getAchievementEmoji(badge.icon) }}
                  </div>
                  @if (badge.unlocked && !badge.seen) {
                    <div class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
                  }
                  <!-- Tooltip -->
                  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-700 rounded text-[9px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                    {{ lang.lang() === 'et' ? badge.titleEt : badge.titleEn }}
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Autopilot Widget (premium only) -->
      @if (subService.isPremium() && autopilotCounts() && (autopilotCounts()!.total > 0)) {
        <div class="mb-6 animate-fade-in-up">
          <div class="bg-white backdrop-blur border border-violet-500/20 rounded-xl p-5">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center">
                  <svg class="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    {{ lang.t('autopilot.title') }}
                    @if (autopilotCounts()!.new > 0) {
                      <span class="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-violet-500 text-white animate-pulse">{{ autopilotCounts()!.new }} {{ lang.t('autopilot.widget_new') }}</span>
                    }
                  </h3>
                  <p class="text-[11px] text-slate-500">{{ autopilotCounts()!.total }} {{ lang.t('autopilot.widget_active') }} · {{ autopilotCounts()!.critical }} {{ lang.t('autopilot.widget_critical') }}</p>
                </div>
              </div>
              <a routerLink="/autopilot" class="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 transition-colors">
                {{ lang.t('autopilot.widget_view_all') }}
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </a>
            </div>
            @if (autopilotTop().length > 0) {
              <div class="space-y-2">
                @for (insight of autopilotTop(); track insight.id) {
                  <a [routerLink]="insight.actionLink || '/autopilot'" class="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/40 hover:bg-slate-50/60 border border-slate-200 transition-colors group">
                    <div class="w-1.5 h-8 rounded-full shrink-0" [class]="insight.severity === 'CRITICAL' ? 'bg-red-500' : insight.severity === 'HIGH' ? 'bg-orange-500' : insight.severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'"></div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-medium text-slate-700 truncate group-hover:text-slate-900">{{ insight.title }}</p>
                      <p class="text-[10px] text-slate-500 truncate">{{ insight.recommendedAction }}</p>
                    </div>
                    <span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
                      [class]="insight.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : insight.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' : insight.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'">
                      {{ insight.severity }}
                    </span>
                  </a>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- AI Act Systems Widget -->
      @if (auth.isLoggedIn() && aiSystemStats()) {
        <div class="mb-6 animate-fade-in-up">
          <div class="bg-white backdrop-blur border border-blue-500/20 rounded-xl p-5">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center">
                  <svg class="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-slate-900">{{ lang.t('dashboard.ai_systems') }}</h3>
                  <p class="text-[11px] text-slate-500">{{ aiSystemStats()!.total }} {{ lang.t('dashboard.ai_systems_total') }}</p>
                </div>
              </div>
              <a routerLink="/ai-systems" class="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors">
                {{ lang.t('dashboard.manage_ai_systems') }}
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </a>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div class="bg-white/40 rounded-lg px-3 py-2 border border-slate-200">
                <p class="text-[10px] text-red-400 uppercase tracking-wider font-semibold">{{ lang.t('dashboard.risk_unacceptable') }}</p>
                <p class="text-lg font-bold text-red-400">{{ aiSystemStats()!.unacceptable || 0 }}</p>
              </div>
              <div class="bg-white/40 rounded-lg px-3 py-2 border border-slate-200">
                <p class="text-[10px] text-orange-400 uppercase tracking-wider font-semibold">{{ lang.t('dashboard.risk_high') }}</p>
                <p class="text-lg font-bold text-orange-400">{{ aiSystemStats()!.high || 0 }}</p>
              </div>
              <div class="bg-white/40 rounded-lg px-3 py-2 border border-slate-200">
                <p class="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">{{ lang.t('dashboard.risk_limited') }}</p>
                <p class="text-lg font-bold text-amber-400">{{ aiSystemStats()!.limited || 0 }}</p>
              </div>
              <div class="bg-white/40 rounded-lg px-3 py-2 border border-slate-200">
                <p class="text-[10px] text-blue-600 uppercase tracking-wider font-semibold">{{ lang.t('dashboard.risk_minimal') }}</p>
                <p class="text-lg font-bold text-blue-600">{{ aiSystemStats()!.minimal || 0 }}</p>
              </div>
              <div class="bg-white/40 rounded-lg px-3 py-2 border border-slate-200">
                <p class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{{ lang.t('dashboard.risk_not_classified') }}</p>
                <p class="text-lg font-bold text-slate-600">{{ aiSystemStats()!.notClassified || 0 }}</p>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Empty state -->
      <div *ngIf="history.length === 0" class="text-center py-20 animate-scale-in">
        <div class="w-20 h-20 rounded-2xl bg-white flex items-center justify-center mx-auto mb-6 border border-slate-200">
          <svg class="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-slate-600 mb-2">Nothing to show yet — let's fix that</h2>
        <p class="text-slate-500 mb-8 max-w-md mx-auto">Run your first DORA assessment and your compliance data will appear here automatically.</p>
        <a routerLink="/assessment"
           class="inline-flex items-center gap-2 bg-blue-600 text-slate-900
                  font-semibold px-8 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-lg text-lg">
          {{ lang.t('dashboard.start_assessment') }}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </a>
      </div>

      <!-- Dashboard content (only when data exists) -->
      <ng-container *ngIf="history.length > 0">

        <!-- Proportionality Scope Card -->
        <div *ngIf="proportionalityScope()" class="mb-6 bg-gradient-to-r from-blue-500/10 via-blue-600/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-5 animate-fade-in-up">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm text-slate-400 mb-1">{{ lang.t('prop.title') }}</h3>
              <div class="flex items-center gap-3">
                <span class="text-slate-900 font-semibold">{{ proportionalityScope().entityType }}</span>
                <span class="px-2 py-0.5 rounded-full text-xs font-bold"
                      [class]="proportionalityScope().sizeCategory === 'MICRO' ? 'bg-blue-500/20 text-blue-400' :
                               (proportionalityScope().sizeCategory === 'SMALL' ? 'bg-blue-600/20 text-blue-500' :
                               (proportionalityScope().sizeCategory === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'))">
                  {{ proportionalityScope().sizeCategory }}
                </span>
                <span *ngIf="proportionalityScope().simplifiedRegime" class="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400">Art. 16</span>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                {{ proportionalityScope().fullApply }} full &middot;
                {{ proportionalityScope().simplified }} simplified &middot;
                {{ proportionalityScope().exempted }} exempt
                <span *ngIf="proportionalityScope().reductionPercentage > 0" class="text-blue-600 ml-1">
                  (-{{ proportionalityScope().reductionPercentage }}%)
                </span>
              </p>
            </div>
            <a routerLink="/proportionality" class="px-4 py-2 bg-slate-200/50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm transition-colors">
              {{ lang.t('roi.step_export') === 'Export' ? 'View' : 'Vaata' }}
            </a>
          </div>
        </div>

        <!-- KPI Cards Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          <!-- Total assessments -->
          <div class="bg-white backdrop-blur border border-slate-200 rounded-xl p-5 animate-fade-in-up delay-100 card-hover">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-xs text-slate-500 uppercase tracking-wider mb-2">{{ lang.t('dashboard.total_assessments') }}</p>
                <span class="text-4xl font-extrabold text-slate-900">{{ history.length }}</span>
                <p class="text-xs text-slate-500 mt-1">+{{ recentCount }} {{ lang.t('dashboard.last_30_days') }}</p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
            </div>
            <div class="mt-3">
              <svg class="w-full h-8" viewBox="0 0 120 32" preserveAspectRatio="none">
                <path [attr.d]="sparklineTotalPath" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
                <path [attr.d]="sparklineTotalArea" fill="#2563eb" opacity="0.08"/>
              </svg>
            </div>
          </div>

          <!-- Average score -->
          <div class="bg-white backdrop-blur border border-slate-200 rounded-xl p-5 animate-fade-in-up delay-200 card-hover">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-xs text-slate-500 uppercase tracking-wider mb-2">{{ lang.t('dashboard.avg_score') }}</p>
                <span class="text-4xl font-extrabold" [style.color]="avgScoreColor">{{ avgScore | number:'1.0-0' }}%</span>
                <p class="text-xs mt-1" [class]="scoreTrend >= 0 ? 'text-blue-600' : 'text-red-400'">
                  {{ scoreTrend >= 0 ? '+' : '' }}{{ scoreTrend | number:'1.1-1' }}% {{ lang.t('dashboard.trend') }}
                </p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-blue-50 border border-blue-500/20 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              </div>
            </div>
            <div class="mt-3">
              <svg class="w-full h-8" viewBox="0 0 120 32" preserveAspectRatio="none">
                <path [attr.d]="sparklineScorePath" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
                <path [attr.d]="sparklineScoreArea" fill="#3b82f6" opacity="0.08"/>
              </svg>
            </div>
          </div>

          <!-- Compliant companies -->
          <div class="bg-white backdrop-blur border border-slate-200 rounded-xl p-5 animate-fade-in-up delay-300 card-hover">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-xs text-slate-500 uppercase tracking-wider mb-2">{{ lang.t('dashboard.compliant_companies') }}</p>
                <span class="text-4xl font-extrabold text-blue-600">{{ greenCount }}</span>
                <p class="text-xs text-slate-500 mt-1">{{ history.length }} {{ lang.t('dashboard.of_assessments') }}</p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
            </div>
            <div class="mt-3">
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-slate-200/50 rounded-full h-2.5 overflow-hidden">
                  <div class="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1000"
                       [style.width.%]="history.length > 0 ? (greenCount / history.length) * 100 : 0"></div>
                </div>
                <span class="text-xs text-slate-400 font-medium">{{ history.length > 0 ? ((greenCount / history.length) * 100 | number:'1.0-0') : 0 }}%</span>
              </div>
              <div class="flex gap-1 mt-2">
                <div class="flex-1 bg-slate-200/50 rounded-full h-1.5 overflow-hidden">
                  <div class="h-full rounded-full bg-blue-600" [style.width.%]="history.length > 0 ? (greenCount / history.length) * 100 : 0"></div>
                </div>
                <div class="flex-1 bg-slate-200/50 rounded-full h-1.5 overflow-hidden">
                  <div class="h-full rounded-full bg-amber-500" [style.width.%]="history.length > 0 ? (yellowCount / history.length) * 100 : 0"></div>
                </div>
                <div class="flex-1 bg-slate-200/50 rounded-full h-1.5 overflow-hidden">
                  <div class="h-full rounded-full bg-red-500" [style.width.%]="history.length > 0 ? (redCount / history.length) * 100 : 0"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Critical gaps -->
          <div class="bg-white backdrop-blur border border-slate-200 rounded-xl p-5 animate-fade-in-up delay-400 card-hover">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-xs text-slate-500 uppercase tracking-wider mb-2">{{ lang.t('dashboard.critical_gaps') }}</p>
                <span class="text-4xl font-extrabold" [class]="criticalGapsCount > 0 ? 'text-red-400' : 'text-blue-600'">{{ criticalGapsCount }}</span>
                <p class="text-xs mt-1" [class]="criticalGapsCount > 0 ? 'text-red-400/70' : 'text-blue-600/70'">
                  {{ criticalGapsCount > 0 ? lang.t('dashboard.needs_attention') : lang.t('dashboard.no_gaps') }}
                </p>
              </div>
              <div class="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
                   [class]="criticalGapsCount > 0 ? 'bg-red-500/10 border border-red-500/20' : 'bg-blue-50 border border-blue-200'">
                <svg class="w-5 h-5" [class]="criticalGapsCount > 0 ? 'text-red-400' : 'text-blue-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
              </div>
            </div>
            <div class="mt-3">
              <svg class="w-full h-8" viewBox="0 0 120 32" preserveAspectRatio="none">
                <path [attr.d]="sparklineGapsPath" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
                <path [attr.d]="sparklineGapsArea" fill="#f87171" opacity="0.08"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Main content grid: Leaderboard + Pillars -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          <!-- Company leaderboard (2 cols) -->
          <div class="lg:col-span-2 bg-white backdrop-blur border border-slate-200 rounded-xl p-6 animate-fade-in-up delay-300">
            <h2 class="text-sm font-semibold text-slate-600 mb-5 flex items-center gap-2">
              <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
              </svg>
              {{ lang.t('dashboard.leaderboard') }}
              <span class="text-xs text-slate-500 font-normal ml-auto">{{ leaderboard.length }} {{ lang.t('dashboard.companies') }}</span>
            </h2>

            <!-- Table header -->
            <div class="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200 mb-2">
              <div class="col-span-1">#</div>
              <div class="col-span-4">{{ lang.t('dashboard.col_company') }}</div>
              <div class="col-span-3">{{ lang.t('dashboard.col_contract') }}</div>
              <div class="col-span-2 text-center">{{ lang.t('dashboard.col_score') }}</div>
              <div class="col-span-2 text-center">{{ lang.t('dashboard.col_status') }}</div>
            </div>

            <!-- Table rows -->
            <div *ngFor="let entry of leaderboard; let i = index"
                 class="grid grid-cols-12 gap-2 px-3 py-3 rounded-lg items-center transition-all duration-200
                        hover:bg-slate-100 cursor-default animate-slide-in-right"
                 [style.animation-delay]="(i * 60 + 400) + 'ms'"
                 [ngClass]="{'border-b border-slate-200': i !== leaderboard.length - 1}">

              <!-- Rank -->
              <div class="col-span-1">
                <span *ngIf="entry.rank === 1" class="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs font-bold">1</span>
                <span *ngIf="entry.rank === 2" class="w-7 h-7 rounded-full bg-slate-400/20 text-slate-600 border border-slate-400/30 flex items-center justify-center text-xs font-bold">2</span>
                <span *ngIf="entry.rank === 3" class="w-7 h-7 rounded-full bg-orange-600/20 text-orange-400 border border-orange-600/30 flex items-center justify-center text-xs font-bold">3</span>
                <span *ngIf="entry.rank > 3" class="w-7 h-7 rounded-full bg-slate-200/50 text-slate-500 flex items-center justify-center text-xs font-medium">{{ entry.rank }}</span>
              </div>

              <!-- Company -->
              <div class="col-span-4">
                <p class="text-sm text-slate-700 font-medium truncate">{{ entry.companyName }}</p>
              </div>

              <!-- Contract -->
              <div class="col-span-3">
                <p class="text-sm text-slate-500 truncate">{{ entry.contractName }}</p>
              </div>

              <!-- Score circle -->
              <div class="col-span-2 flex justify-center">
                <div class="relative w-10 h-10">
                  <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" stroke-width="6"/>
                    <circle cx="50" cy="50" r="40" fill="none"
                            [attr.stroke]="getLevelColor(entry.complianceLevel)"
                            stroke-width="6" stroke-linecap="round"
                            stroke-dasharray="251.33"
                            [attr.stroke-dashoffset]="251.33 - (251.33 * entry.scorePercentage / 100)"
                            class="animate-draw-circle"/>
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <span class="text-xs font-bold" [style.color]="getLevelColor(entry.complianceLevel)">{{ entry.scorePercentage | number:'1.0-0' }}</span>
                  </div>
                </div>
              </div>

              <!-- Badge -->
              <div class="col-span-2 flex justify-center">
                <span [class]="getBadgeClass(entry.complianceLevel)">
                  {{ getBadgeLabel(entry.complianceLevel) }}
                </span>
              </div>
            </div>

            <div *ngIf="leaderboard.length === 0" class="text-center py-8 text-slate-500 text-sm">
              {{ lang.t('dashboard.no_data') }}
            </div>
          </div>

          <!-- DORA 5 Pillars Overview (1 col) -->
          <div class="bg-white backdrop-blur border border-slate-200 rounded-xl p-6 animate-fade-in-up delay-400">
            <h2 class="text-sm font-semibold text-slate-600 mb-5 flex items-center gap-2">
              <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
              {{ lang.t('dashboard.dora_pillars') }}
            </h2>

            <div class="space-y-5">
              <div *ngFor="let pillar of pillarData; let i = index"
                   class="animate-fade-in-up"
                   [style.animation-delay]="(i * 100 + 500) + 'ms'">
                <div class="flex items-center gap-3 mb-2">
                  <!-- Donut chart -->
                  <div class="relative w-14 h-14 shrink-0">
                    <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" stroke-width="8"/>
                      <circle cx="50" cy="50" r="38" fill="none"
                              [attr.stroke]="pillar.color"
                              stroke-width="8" stroke-linecap="round"
                              stroke-dasharray="238.76"
                              [attr.stroke-dashoffset]="pillar.dashOffset"
                              style="transition: stroke-dashoffset 1.5s ease-out;"/>
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                      <span class="text-xs font-bold" [style.color]="pillar.color">{{ pillar.percentage | number:'1.0-0' }}%</span>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-lg">{{ pillar.icon }}</span>
                      <p class="text-sm font-medium text-slate-700 truncate">{{ lang.t(pillar.labelKey) }}</p>
                    </div>
                    <div class="w-full bg-slate-200/50 rounded-full h-1.5 mt-1.5">
                      <div class="h-full rounded-full transition-all duration-1000"
                           [style.width.%]="pillar.percentage"
                           [style.background]="pillar.color"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Trend Chart (full width) -->
        <div *ngIf="history.length >= 2" class="bg-white backdrop-blur border border-slate-200 rounded-xl p-6 mb-8 animate-fade-in-up delay-500">
          <h2 class="text-sm font-semibold text-slate-600 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
            {{ lang.t('dashboard.score_trend') }}
            <span class="text-xs text-slate-500 font-normal ml-auto">{{ lang.t('dashboard.last_n_assessments') }} {{ trendPoints.length }} {{ lang.t('dashboard.assessments') }}</span>
          </h2>
          <div class="relative" style="height: 240px;">
            <svg class="w-full h-full" [attr.viewBox]="'0 0 ' + trendChartWidth + ' 240'" preserveAspectRatio="none">
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#2563eb" stop-opacity="0.3"/>
                  <stop offset="100%" stop-color="#2563eb" stop-opacity="0"/>
                </linearGradient>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#2563eb"/>
                  <stop offset="100%" stop-color="#3b82f6"/>
                </linearGradient>
              </defs>

              <!-- Grid lines -->
              <line x1="50" [attr.y1]="trendYForPercent(100)" [attr.x2]="trendChartWidth - 10" [attr.y2]="trendYForPercent(100)" stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="4"/>
              <line x1="50" [attr.y1]="trendYForPercent(75)" [attr.x2]="trendChartWidth - 10" [attr.y2]="trendYForPercent(75)" stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="4"/>
              <line x1="50" [attr.y1]="trendYForPercent(50)" [attr.x2]="trendChartWidth - 10" [attr.y2]="trendYForPercent(50)" stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="4"/>
              <line x1="50" [attr.y1]="trendYForPercent(25)" [attr.x2]="trendChartWidth - 10" [attr.y2]="trendYForPercent(25)" stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="4"/>
              <line x1="50" [attr.y1]="trendYForPercent(0)" [attr.x2]="trendChartWidth - 10" [attr.y2]="trendYForPercent(0)" stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="4"/>

              <!-- Y-axis labels -->
              <text x="40" [attr.y]="trendYForPercent(100) + 4" text-anchor="end" font-size="10" class="fill-slate-500">100%</text>
              <text x="40" [attr.y]="trendYForPercent(75) + 4" text-anchor="end" font-size="10" class="fill-slate-500">75%</text>
              <text x="40" [attr.y]="trendYForPercent(50) + 4" text-anchor="end" font-size="10" class="fill-slate-500">50%</text>
              <text x="40" [attr.y]="trendYForPercent(25) + 4" text-anchor="end" font-size="10" class="fill-slate-500">25%</text>
              <text x="40" [attr.y]="trendYForPercent(0) + 4" text-anchor="end" font-size="10" class="fill-slate-500">0%</text>

              <!-- Danger zone background -->
              <rect x="50" [attr.y]="trendYForPercent(50)" [attr.width]="trendChartWidth - 60"
                    [attr.height]="trendYForPercent(0) - trendYForPercent(50)"
                    fill="#f87171" opacity="0.03" rx="4"/>

              <!-- Area fill -->
              <path [attr.d]="trendAreaPath" fill="url(#trendGradient)"/>

              <!-- Line -->
              <path [attr.d]="trendLinePath" fill="none" stroke="url(#lineGradient)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="animate-sparkline"/>

              <!-- Dots -->
              <circle *ngFor="let point of trendPoints; let i = index"
                      [attr.cx]="point.x" [attr.cy]="point.y" r="5"
                      [attr.fill]="point.color" stroke="#e2e8f0" stroke-width="2.5"
                      class="animate-scale-in" [style.animation-delay]="(i * 80 + 700) + 'ms'"/>

              <!-- X-axis date labels -->
              <text *ngFor="let point of trendXLabels"
                    [attr.x]="point.x" [attr.y]="232"
                    text-anchor="middle" font-size="9" class="fill-slate-500">{{ point.dateLabel }}</text>
            </svg>
          </div>
        </div>

        <!-- Bottom row: Deficiencies + Distribution -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          <!-- Top Deficiencies -->
          <div class="bg-white backdrop-blur border border-slate-200 rounded-xl p-6 animate-fade-in-up delay-600">
            <h2 class="text-sm font-semibold text-slate-600 mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
              {{ lang.t('dashboard.top_deficiencies') }}
            </h2>

            <div *ngIf="deficiencies.length === 0" class="text-center py-10">
              <div class="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-3">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <p class="text-sm text-slate-400">{{ lang.t('dashboard.all_compliant') }}</p>
            </div>

            <div *ngIf="deficiencies.length > 0" class="space-y-2">
              <div *ngFor="let def of deficiencies; let i = index"
                   class="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 animate-slide-in-right"
                   [style.animation-delay]="(i * 80 + 700) + 'ms'">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                     [class]="3 > i ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'">
                  {{ i + 1 }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-slate-700 truncate">{{ def.companyName }}</p>
                  <p class="text-xs text-slate-500">{{ def.contractName }} &middot; {{ def.scorePercentage | number:'1.0-0' }}%</p>
                </div>
                <div class="shrink-0">
                  <span class="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                    {{ def.totalQuestions - def.compliantCount }} {{ lang.t('dashboard.deficiency_count') }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Score Distribution -->
          <div class="bg-white backdrop-blur border border-slate-200 rounded-xl p-6 animate-fade-in-up delay-700">
            <h2 class="text-sm font-semibold text-slate-600 mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>
              </svg>
              {{ lang.t('dashboard.score_distribution') }}
            </h2>

            <div class="flex justify-center mb-4">
              <svg viewBox="0 0 200 200" class="w-48 h-48">
                <!-- Donut segments -->
                <circle cx="100" cy="100" r="70" fill="none" stroke="#e2e8f0" stroke-width="30"/>
                <circle cx="100" cy="100" r="70" fill="none"
                        stroke="#2563eb" stroke-width="30"
                        stroke-dasharray="439.82"
                        [attr.stroke-dashoffset]="439.82 - (439.82 * greenRatio)"
                        transform="rotate(-90 100 100)"
                        class="animate-draw-circle"/>
                <circle cx="100" cy="100" r="70" fill="none"
                        stroke="#fbbf24" stroke-width="30"
                        stroke-dasharray="439.82"
                        [attr.stroke-dashoffset]="439.82 - (439.82 * yellowRatio)"
                        [attr.transform]="'rotate(' + (greenRatio * 360 - 90) + ' 100 100)'"
                        class="animate-draw-circle" style="animation-delay: 200ms;"/>
                <circle cx="100" cy="100" r="70" fill="none"
                        stroke="#f87171" stroke-width="30"
                        stroke-dasharray="439.82"
                        [attr.stroke-dashoffset]="439.82 - (439.82 * redRatio)"
                        [attr.transform]="'rotate(' + ((greenRatio + yellowRatio) * 360 - 90) + ' 100 100)'"
                        class="animate-draw-circle" style="animation-delay: 400ms;"/>
                <!-- Center text -->
                <text x="100" y="95" text-anchor="middle" font-size="22" font-weight="bold" class="fill-slate-900">{{ history.length }}</text>
                <text x="100" y="115" text-anchor="middle" font-size="10" class="fill-slate-500">{{ lang.t('dashboard.donut_assessments') }}</text>
              </svg>
            </div>

            <!-- Legend -->
            <div class="space-y-2">
              <div class="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50/20 transition-colors">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span class="text-sm text-slate-600">{{ lang.t('dashboard.level_green') }}</span>
                </div>
                <span class="text-sm font-semibold text-blue-600">{{ greenCount }} ({{ history.length > 0 ? (greenRatio * 100 | number:'1.0-0') : 0 }}%)</span>
              </div>
              <div class="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50/20 transition-colors">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-amber-400"></div>
                  <span class="text-sm text-slate-600">{{ lang.t('dashboard.level_yellow') }}</span>
                </div>
                <span class="text-sm font-semibold text-amber-400">{{ yellowCount }} ({{ history.length > 0 ? (yellowRatio * 100 | number:'1.0-0') : 0 }}%)</span>
              </div>
              <div class="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50/20 transition-colors">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-red-400"></div>
                  <span class="text-sm text-slate-600">{{ lang.t('dashboard.level_red') }}</span>
                </div>
                <span class="text-sm font-semibold text-red-400">{{ redCount }} ({{ history.length > 0 ? (redRatio * 100 | number:'1.0-0') : 0 }}%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer actions -->
        <div class="text-center animate-fade-in delay-800 mb-8">
          <div class="flex flex-wrap justify-center gap-3">
            <a routerLink="/assessment"
               class="bg-blue-600 hover:bg-blue-700
                      text-slate-900 font-semibold px-6 py-2.5 rounded-lg transition-all duration-300
                      hover:shadow-lg hover:shadow-lg flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              {{ lang.t('dashboard.new_assessment') }}
            </a>
            <a routerLink="/history"
               class="bg-slate-200/50 hover:bg-slate-100 text-slate-700 font-semibold px-6 py-2.5 rounded-lg
                      transition-all duration-300 border border-slate-200 hover:border-slate-500/50 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ lang.t('dashboard.view_history') }}
            </a>
          </div>
        </div>

      </ng-container>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  lang = inject(LangService);
  private api = inject(ApiService);
  subService = inject(SubscriptionService);
  checklist = inject(ChecklistService);
  auth = inject(AuthService);

  private http = inject(HttpClient);
  aiSystemStats = signal<any>(null);
  autopilotCounts = signal<AutopilotCounts | null>(null);
  autopilotTop = signal<AutopilotInsight[]>([]);
  proportionalityScope = signal<any>(null);
  generatingReport = signal(false);
  generatingDashPdf = signal(false);
  // Compliance score widget
  auditReadiness = signal<any>(null);
  auditModules = signal<{ key: string; label: string; score: number }[]>([]);

  greeting(): string {
    const name = this.auth.user()?.fullName?.split(' ')[0];
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return name ? `${timeGreeting}, ${name}` : 'Dashboard';
  }

  // Achievement badges
  achievements = signal<any[]>([]);
  newAchievementCount = signal(0);
  unlockedCount = signal(0);

  history: HistoryEntry[] = [];
  leaderboard: LeaderboardEntry[] = [];
  pillarData: PillarData[] = [];
  deficiencies: HistoryEntry[] = [];

  // Trend chart
  trendPoints: ChartPoint[] = [];
  trendLinePath = '';
  trendAreaPath = '';
  trendXLabels: { x: number; dateLabel: string }[] = [];
  trendChartWidth = 800;

  // Sparklines
  sparklineTotalPath = '';
  sparklineTotalArea = '';
  sparklineScorePath = '';
  sparklineScoreArea = '';
  sparklineGapsPath = '';
  sparklineGapsArea = '';

  lastUpdated = '';

  ngOnInit() {
    this.loadHistory();
    this.checklist.detectExistingProgress();
    this.buildLeaderboard();
    this.buildPillarData();
    this.buildTrendChart();
    this.buildSparklines();
    this.buildDeficiencies();
    this.lastUpdated = this.formatDate(new Date().toISOString());
    this.loadAutopilotWidget();
    this.loadAuditReadiness();
    this.loadAchievements();
    this.loadProportionalityScope();

    // Load AI system stats
    if (this.auth.isLoggedIn()) {
      this.api.getAiSystemStats().subscribe({
        next: (data: any) => this.aiSystemStats.set(data),
        error: () => {} // silently fail if user has no AI systems
      });
    }
  }

  private loadProportionalityScope() {
    this.http.get<any>('/api/proportionality/scope').subscribe({
      next: scope => this.proportionalityScope.set(scope),
      error: () => {}
    });
  }

  private loadAutopilotWidget() {
    if (!this.subService.isPremium()) return;
    this.api.getAutopilotCounts().subscribe({
      next: counts => this.autopilotCounts.set(counts),
      error: () => {}
    });
    this.api.getAutopilotInsights().subscribe({
      next: insights => {
        const active = insights
          .filter(i => i.status === 'NEW' || i.status === 'ACCEPTED')
          .sort((a, b) => {
            const order: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
            return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
          })
          .slice(0, 3);
        this.autopilotTop.set(active);
      },
      error: () => {}
    });
  }

  generateComplianceReport() {
    this.generatingReport.set(true);
    this.api.exportComplianceReport(this.lang.lang()).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dora-compliance-report.pdf';
        a.click();
        URL.revokeObjectURL(url);
        this.generatingReport.set(false);
      },
      error: () => {
        this.generatingReport.set(false);
      }
    });
  }

  downloadDashboardPdf() {
    this.generatingDashPdf.set(true);
    try {
      const doc = new jsPDF();
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      // Title
      doc.setFontSize(20);
      doc.setTextColor(30, 41, 59);
      doc.text('DORA Compliance Dashboard Snapshot', 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${dateStr}`, 14, 30);

      // Divider
      doc.setDrawColor(203, 213, 225);
      doc.line(14, 34, 196, 34);

      // Summary Stats
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text('Summary Statistics', 14, 44);

      const compliantCount = this.greenCount;
      const critGaps = this.criticalGapsCount;
      const avgScoreVal = this.avgScore;

      autoTable(doc, {
        startY: 48,
        head: [['Metric', 'Value']],
        body: [
          ['Total Assessments', String(this.history.length)],
          ['Average Score', `${avgScoreVal.toFixed(1)}%`],
          ['Compliant Companies (GREEN)', String(compliantCount)],
          ['Critical Gaps (latest)', String(critGaps)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 60, halign: 'center' } },
      });

      // Pillar Breakdown
      const pillarEndY = (doc as any).lastAutoTable?.finalY ?? 90;
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text('DORA Pillar Breakdown', 14, pillarEndY + 12);

      const pillarNames: Record<string, string> = {
        'dashboard.pillar_risk': 'ICT Risk Management',
        'dashboard.pillar_incidents': 'Incident Management',
        'dashboard.pillar_testing': 'Digital Operational Resilience Testing',
        'dashboard.pillar_third_party': 'Third-Party Risk Management',
        'dashboard.pillar_info': 'Information Sharing',
      };

      const pillarRows = this.pillarData.map(p => [
        pillarNames[p.labelKey] || p.labelKey,
        `${p.percentage.toFixed(1)}%`,
        p.percentage >= 75 ? 'Compliant' : (p.percentage >= 50 ? 'Partial' : 'Non-Compliant'),
      ]);

      autoTable(doc, {
        startY: pillarEndY + 16,
        head: [['Pillar', 'Score', 'Status']],
        body: pillarRows,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 30, halign: 'center' }, 2: { cellWidth: 42, halign: 'center' } },
      });

      // Top Deficiencies
      const defEndY = (doc as any).lastAutoTable?.finalY ?? 160;
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text('Top Deficiencies', 14, defEndY + 12);

      if (this.deficiencies.length === 0) {
        doc.setFontSize(10);
        doc.setTextColor(52, 211, 153);
        doc.text('All companies are fully compliant. No deficiencies found.', 14, defEndY + 20);
      } else {
        const defRows = this.deficiencies.map((d, i) => [
          String(i + 1),
          d.companyName,
          d.contractName,
          `${d.scorePercentage.toFixed(0)}%`,
          String(d.totalQuestions - d.compliantCount) + ' gaps',
        ]);

        autoTable(doc, {
          startY: defEndY + 16,
          head: [['#', 'Company', 'Contract', 'Score', 'Gaps']],
          body: defRows,
          theme: 'grid',
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 9, cellPadding: 3 },
        });
      }

      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Generated by DoraAudit.eu - DORA Compliance Platform', 14, pageHeight - 10);
      doc.text(dateStr, 196, pageHeight - 10, { align: 'right' });

      doc.save(`dora-dashboard-snapshot-${now.toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error('Dashboard PDF generation failed', e);
    } finally {
      this.generatingDashPdf.set(false);
    }
  }

  loadHistory() {
    if (typeof localStorage === 'undefined') return;
    try {
      this.history = JSON.parse(localStorage.getItem('dora_history') || '[]');
    } catch {
      this.history = [];
    }
  }

  // --- KPI getters ---

  get avgScore(): number {
    if (this.history.length === 0) return 0;
    return this.history.reduce((sum, h) => sum + h.scorePercentage, 0) / this.history.length;
  }

  get avgScoreColor(): string {
    const avg = this.avgScore;
    if (avg >= 75) return '#34d399';
    if (avg >= 50) return '#fbbf24';
    return '#f87171';
  }

  get scoreTrend(): number {
    if (this.history.length < 2) return 0;
    const recent = this.history.slice(0, Math.min(5, this.history.length));
    const older = this.history.slice(Math.min(5, this.history.length));
    if (older.length === 0) return 0;
    const recentAvg = recent.reduce((s, h) => s + h.scorePercentage, 0) / recent.length;
    const olderAvg = older.reduce((s, h) => s + h.scorePercentage, 0) / older.length;
    return recentAvg - olderAvg;
  }

  get greenCount(): number { return this.history.filter(h => h.complianceLevel === 'GREEN').length; }
  get yellowCount(): number { return this.history.filter(h => h.complianceLevel === 'YELLOW').length; }
  get redCount(): number { return this.history.filter(h => h.complianceLevel === 'RED').length; }

  get criticalGapsCount(): number {
    if (this.history.length === 0) return 0;
    const latest = this.history[0]; // history is newest-first
    return this.getGapsForEntry(latest);
  }

  getGapsForEntry(entry: HistoryEntry): number {
    // Use nonCompliantCount + partialCount if saved (new format)
    if (entry.nonCompliantCount != null) {
      return entry.nonCompliantCount + (entry.partialCount ?? 0);
    }
    // Fallback: recalculate from totalQuestions - compliantCount
    return Math.max(0, entry.totalQuestions - entry.compliantCount);
  }

  get recentCount(): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.history.filter(h => new Date(h.assessmentDate) >= thirtyDaysAgo).length;
  }

  get greenRatio(): number {
    return this.history.length > 0 ? this.greenCount / this.history.length : 0;
  }
  get yellowRatio(): number {
    return this.history.length > 0 ? this.yellowCount / this.history.length : 0;
  }
  get redRatio(): number {
    return this.history.length > 0 ? this.redCount / this.history.length : 0;
  }

  // --- Leaderboard ---

  buildLeaderboard() {
    this.leaderboard = [...this.history]
      .sort((a, b) => b.scorePercentage - a.scorePercentage)
      .slice(0, 10)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  // --- DORA 5 Pillars ---

  buildPillarData() {
    const latest = this.history.length > 0 ? this.history[0] : null;
    const avgPct = this.avgScore;
    const pillars = [
      { id: 'ICT_RISK_MANAGEMENT', icon: '\u{1F6E1}\uFE0F', labelKey: 'dashboard.pillar_risk', fallback: 0.90 },
      { id: 'INCIDENT_MANAGEMENT', icon: '\u{1F4CB}', labelKey: 'dashboard.pillar_incidents', fallback: 0.85 },
      { id: 'TESTING', icon: '\u{1F50D}', labelKey: 'dashboard.pillar_testing', fallback: 0.80 },
      { id: 'THIRD_PARTY', icon: '\u{1F91D}', labelKey: 'dashboard.pillar_third_party', fallback: 1.0 },
      { id: 'INFORMATION_SHARING', icon: '\u{1F4E1}', labelKey: 'dashboard.pillar_info', fallback: 0.75 }
    ];

    this.pillarData = pillars.map(p => {
      // Use real per-pillar scores from latest assessment if available
      const pct = latest?.pillarScores?.[p.id] ?? Math.min(100, Math.max(0, avgPct * p.fallback));
      const circumference = 238.76;
      const color = pct >= 75 ? '#34d399' : (pct >= 50 ? '#fbbf24' : '#f87171');
      return {
        icon: p.icon,
        labelKey: p.labelKey,
        percentage: pct,
        color,
        dashOffset: circumference - (circumference * pct / 100)
      };
    });
  }

  // --- Trend Chart ---

  buildTrendChart() {
    const entries = [...this.history].reverse().slice(-15);
    if (entries.length < 2) return;

    const padLeft = 60;
    const padRight = 20;
    const padTop = 15;
    const padBottom = 30;
    const w = this.trendChartWidth - padLeft - padRight;
    const h = 240 - padTop - padBottom;

    this.trendPoints = entries.map((e, i) => ({
      x: padLeft + (i / (entries.length - 1)) * w,
      y: padTop + (1 - e.scorePercentage / 100) * h,
      color: this.getLevelColor(e.complianceLevel),
      score: e.scorePercentage,
      dateLabel: this.formatShortDate(e.assessmentDate)
    }));

    this.trendLinePath = this.trendPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

    const bottomY = padTop + h;
    const lastX = this.trendPoints[this.trendPoints.length - 1].x;
    const firstX = this.trendPoints[0].x;
    this.trendAreaPath = `${this.trendLinePath} L${lastX},${bottomY} L${firstX},${bottomY} Z`;

    // X-axis labels (show every few)
    const step = Math.max(1, Math.floor(entries.length / 6));
    this.trendXLabels = this.trendPoints.filter((_, i) => i % step === 0 || i === entries.length - 1);
  }

  trendYForPercent(pct: number): number {
    const padTop = 15;
    const h = 240 - 15 - 30;
    return padTop + (1 - pct / 100) * h;
  }

  // --- Sparklines ---

  buildSparklines() {
    const entries = [...this.history].reverse().slice(-10);
    if (entries.length < 2) {
      this.sparklineTotalPath = 'M0,16 L120,16';
      this.sparklineTotalArea = 'M0,16 L120,16 L120,32 L0,32 Z';
      this.sparklineScorePath = 'M0,16 L120,16';
      this.sparklineScoreArea = 'M0,16 L120,16 L120,32 L0,32 Z';
      this.sparklineGapsPath = 'M0,28 L120,28';
      this.sparklineGapsArea = 'M0,28 L120,28 L120,32 L0,32 Z';
      return;
    }

    // Total count sparkline (cumulative)
    const totalPoints = entries.map((_, i) => {
      const x = (i / (entries.length - 1)) * 120;
      const y = 28 - ((i + 1) / entries.length) * 24;
      return { x, y };
    });
    this.sparklineTotalPath = totalPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    this.sparklineTotalArea = `${this.sparklineTotalPath} L120,32 L0,32 Z`;

    // Score sparkline
    const scorePoints = entries.map((e, i) => ({
      x: (i / (entries.length - 1)) * 120,
      y: 28 - (e.scorePercentage / 100) * 24
    }));
    this.sparklineScorePath = scorePoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    this.sparklineScoreArea = `${this.sparklineScorePath} L120,32 L0,32 Z`;

    // Gaps sparkline — gap count per assessment over time
    const gapCounts = entries.map(e => this.getGapsForEntry(e));
    const maxGaps = Math.max(1, ...gapCounts);
    const gapPoints = gapCounts.map((g, i) => ({
      x: (i / (entries.length - 1)) * 120,
      y: 28 - (g / maxGaps) * 24
    }));
    this.sparklineGapsPath = gapPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    this.sparklineGapsArea = `${this.sparklineGapsPath} L120,32 L0,32 Z`;
  }

  // --- Deficiencies ---

  buildDeficiencies() {
    this.deficiencies = [...this.history]
      .filter(h => h.complianceLevel === 'RED' || h.compliantCount < h.totalQuestions)
      .sort((a, b) => a.scorePercentage - b.scorePercentage)
      .slice(0, 5);
  }

  // --- Helpers ---

  getLevelColor(level: string): string {
    switch (level) {
      case 'GREEN': return '#34d399';
      case 'YELLOW': return '#fbbf24';
      case 'RED': return '#f87171';
      default: return '#64748b';
    }
  }

  getBadgeClass(level: string): string {
    const base = 'text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap';
    switch (level) {
      case 'GREEN': return `${base} bg-blue-50 text-blue-600 border border-blue-200`;
      case 'YELLOW': return `${base} bg-amber-500/15 text-amber-400 border border-amber-500/20`;
      case 'RED': return `${base} bg-red-500/15 text-red-400 border border-red-500/20`;
      default: return base;
    }
  }

  getBadgeLabel(level: string): string {
    switch (level) {
      case 'GREEN': return this.lang.t('dashboard.badge_green');
      case 'YELLOW': return this.lang.t('dashboard.badge_yellow');
      case 'RED': return this.lang.t('dashboard.badge_red');
      default: return '';
    }
  }

  private loadAuditReadiness() {
    this.api.getAuditReadiness().subscribe({
      next: (data) => {
        this.auditReadiness.set(data);
        if (data.modules) {
          const mods = [
            { key: 'assessment', label: this.lang.l('Hindamine', 'Assessment'), score: data.modules.assessment?.score ?? 0 },
            { key: 'evidence', label: this.lang.l('Tõendid', 'Evidence'), score: data.modules.evidence?.score ?? 0 },
            { key: 'remediation', label: this.lang.l('Parandused', 'Remediation'), score: data.modules.remediation?.score ?? 0 },
            { key: 'incidents', label: this.lang.l('Intsidendid', 'Incidents'), score: data.modules.incidents?.score ?? 0 },
            { key: 'thirdParty', label: this.lang.l('Kolmandad', 'Third-Party'), score: data.modules.thirdParty?.score ?? 0 },
          ];
          this.auditModules.set(mods);
        }
      },
      error: () => {}
    });
  }

  private loadAchievements() {
    // Trigger check first, then load
    this.api.checkAchievements().subscribe({
      next: () => {
        this.api.getAchievements().subscribe({
          next: (badges) => {
            this.achievements.set(badges);
            this.unlockedCount.set(badges.filter((b: any) => b.unlocked).length);
            this.newAchievementCount.set(badges.filter((b: any) => b.unlocked && !b.seen).length);
          },
          error: () => {}
        });
      },
      error: () => {}
    });
  }

  markAchievementSeen(key: string) {
    this.api.markAchievementSeen(key).subscribe({
      next: () => {
        const updated = this.achievements().map(b =>
          b.key === key ? { ...b, seen: true } : b
        );
        this.achievements.set(updated);
        this.newAchievementCount.set(updated.filter((b: any) => b.unlocked && !b.seen).length);
      }
    });
  }

  getAchievementEmoji(icon: string): string {
    const map: Record<string, string> = {
      'clipboard-check': '\u{1F4CB}',
      'file-text': '\u{1F4C4}',
      'upload': '\u{1F4E4}',
      'archive': '\u{1F4E6}',
      'award': '\u{1F3C6}',
      'shield': '\u{1F6E1}',
      'check-circle': '\u{2705}',
      'alert-triangle': '\u{26A0}',
      'database': '\u{1F5C4}',
      'star': '\u{2B50}'
    };
    return map[icon] || '\u{1F3C5}';
  }

  private get dateLocale(): string {
    return this.lang.lang() === 'et' ? 'et-EE' : 'en-GB';
  }

  formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(this.dateLocale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  }

  formatShortDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(this.dateLocale, { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  }
}
