import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LangService } from '../lang.service';

interface PillarScore {
  key: string;
  name: string;
  nameEt: string;
  score: number;
  maxScore: number;
  percentage: number;
  articleRef: string;
}

interface EvidenceStats {
  total: number;
  uploaded: number;
  pending: number;
  coverage: number;
}

interface IncidentSummary {
  id: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  reportedAt: string;
}

interface VendorOverview {
  total: number;
  critical: number;
  highRisk: number;
  averageScore: number;
}

interface RemediationOverview {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
}

interface RegulatorPortalData {
  companyName: string;
  overallScore: number;
  overallPercentage: number;
  assessmentDate: string;
  pillars: PillarScore[];
  evidenceStats: EvidenceStats | null;
  incidents: IncidentSummary[] | null;
  vendorOverview: VendorOverview | null;
  remediation: RemediationOverview | null;
  permissions: string[];
  expiresAt: string;
  label: string;
}

@Component({
  selector: 'app-regulator-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex items-center justify-center min-h-screen">
          <div class="text-center">
            <div class="relative w-16 h-16 mx-auto mb-6">
              <div class="absolute inset-0 rounded-full border-4 border-slate-700"></div>
              <div class="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-400 animate-spin"></div>
            </div>
            <h2 class="text-lg font-semibold text-white mb-1">{{ lang.l('Laadimine...', 'Loading...') }}</h2>
            <p class="text-sm text-slate-500">{{ lang.l('Vastavusandmete laadimine', 'Retrieving compliance data') }}</p>
          </div>
        </div>
      }

      <!-- Error State -->
      @if (!loading() && error()) {
        <div class="flex items-center justify-center min-h-screen px-4">
          <div class="max-w-md w-full bg-white border border-red-500/20 rounded-2xl p-10 text-center">
            <div class="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <h2 class="text-xl font-bold text-white mb-2">
              {{ errorCode() === 404
                ? lang.l('Linki ei leitud', 'Link Not Found')
                : errorCode() === 410
                  ? lang.l('Link on aegunud', 'Link Expired')
                  : lang.l('Ligip\u00e4\u00e4s keelatud', 'Access Denied')
              }}
            </h2>
            <p class="text-sm text-slate-400 mb-6">
              {{ errorCode() === 404
                ? lang.l('See ligip\u00e4\u00e4sulink on vale v\u00f5i on t\u00fchistatud.', 'This access link is invalid or has been revoked.')
                : errorCode() === 410
                  ? lang.l('See ligip\u00e4\u00e4sulink on aegunud. Palun k\u00fcsige uut linki.', 'This access link has expired. Please request a new link.')
                  : lang.l('Midagi l\u00e4ks valesti. Palun proovige hiljem uuesti.', 'Something went wrong. Please try again later.')
              }}
            </p>
            <a href="https://doraaudit.eu" class="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
              DoraAudit.eu
            </a>
          </div>
        </div>
      }

      <!-- Data Loaded -->
      @if (!loading() && !error() && data()) {
        <div class="pt-8 pb-16 px-4">
          <div class="max-w-6xl mx-auto">

            <!-- Header Banner -->
            <div class="bg-gradient-to-r from-violet-500/10 via-slate-800/50 to-blue-500/10 border border-violet-500/20 rounded-2xl p-6 mb-8">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                  <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/20 flex-shrink-0">
                    <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                  </div>
                  <div>
                    <div class="text-[10px] uppercase tracking-widest text-violet-400 font-medium mb-0.5">
                      {{ lang.l('DORA vastavus\u00fclevaade', 'DORA Compliance Overview') }}
                    </div>
                    <h1 class="text-2xl md:text-3xl font-bold text-white">{{ data()!.companyName }}</h1>
                    <div class="flex items-center gap-3 mt-1">
                      <span class="text-xs text-slate-500">
                        {{ lang.l('Hinnatud', 'Assessed') }}: {{ data()!.assessmentDate | date:'dd.MM.yyyy' }}
                      </span>
                      <span class="text-xs text-slate-600">|</span>
                      <span class="text-xs text-slate-500">
                        {{ lang.l('Link', 'Link') }}: {{ data()!.label }}
                      </span>
                      <span class="text-xs text-slate-600">|</span>
                      <span class="text-xs text-slate-500">
                        {{ lang.l('Kehtiv kuni', 'Valid until') }}: {{ data()!.expiresAt | date:'dd.MM.yyyy' }}
                      </span>
                    </div>
                  </div>
                </div>
                <!-- Overall Score -->
                <div class="flex items-center gap-4">
                  <div class="relative w-20 h-20">
                    <svg class="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" stroke-width="6" class="text-slate-700"/>
                      <circle cx="40" cy="40" r="34" fill="none" stroke-width="6" stroke-linecap="round"
                              [attr.stroke-dasharray]="2 * 3.14159 * 34"
                              [attr.stroke-dashoffset]="2 * 3.14159 * 34 * (1 - data()!.overallPercentage / 100)"
                              [class]="getScoreColor(data()!.overallPercentage)"/>
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                      <span class="text-lg font-bold text-white">{{ data()!.overallPercentage }}%</span>
                    </div>
                  </div>
                  <div>
                    <div class="text-sm font-semibold text-white">{{ lang.l('\u00dcldskoor', 'Overall Score') }}</div>
                    <div class="text-xs mt-0.5"
                         [class]="data()!.overallPercentage >= 75 ? 'text-blue-600' : data()!.overallPercentage >= 50 ? 'text-amber-400' : 'text-red-400'">
                      {{ data()!.overallPercentage >= 75
                        ? lang.l('Hea vastavus', 'Good Compliance')
                        : data()!.overallPercentage >= 50
                          ? lang.l('Osaline vastavus', 'Partial Compliance')
                          : lang.l('Vajab t\u00e4helepanu', 'Needs Attention') }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 5 Pillar Score Cards -->
            @if (hasPermission('assessment_scores') && data()!.pillars?.length) {
              <div class="mb-8">
                <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                  {{ lang.l('DORA 5 sammast', 'DORA 5 Pillars') }}
                </h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  @for (pillar of data()!.pillars; track pillar.key) {
                    <div class="bg-white border border-slate-200 rounded-xl p-5 text-center hover:border-slate-200 transition-all">
                      <!-- Donut chart -->
                      <div class="relative w-20 h-20 mx-auto mb-3">
                        <svg class="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                          <circle cx="40" cy="40" r="30" fill="none" stroke="currentColor" stroke-width="5" class="text-slate-700/60"/>
                          <circle cx="40" cy="40" r="30" fill="none" stroke-width="5" stroke-linecap="round"
                                  [attr.stroke-dasharray]="2 * 3.14159 * 30"
                                  [attr.stroke-dashoffset]="2 * 3.14159 * 30 * (1 - pillar.percentage / 100)"
                                  [class]="getScoreColor(pillar.percentage)"/>
                        </svg>
                        <div class="absolute inset-0 flex items-center justify-center">
                          <span class="text-sm font-bold text-white">{{ pillar.percentage }}%</span>
                        </div>
                      </div>
                      <h3 class="text-xs font-semibold text-white mb-0.5">
                        {{ lang.l(pillar.nameEt, pillar.name) }}
                      </h3>
                      <p class="text-[10px] text-slate-500">{{ pillar.articleRef }}</p>
                      <div class="mt-2 text-xs font-medium"
                           [class]="pillar.percentage >= 75 ? 'text-blue-600' : pillar.percentage >= 50 ? 'text-amber-400' : 'text-red-400'">
                        {{ pillar.score }}/{{ pillar.maxScore }}
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <!-- Evidence Statistics -->
              @if (hasPermission('evidence_stats') && data()!.evidenceStats) {
                <div class="bg-white border border-slate-200 rounded-xl p-6">
                  <h2 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                      <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                    {{ lang.l('T\u00f5endite statistika', 'Evidence Statistics') }}
                  </h2>
                  <div class="space-y-4">
                    <!-- Coverage bar -->
                    <div>
                      <div class="flex justify-between text-xs mb-1.5">
                        <span class="text-slate-400">{{ lang.l('Katvus', 'Coverage') }}</span>
                        <span class="font-medium" [class]="data()!.evidenceStats!.coverage >= 75 ? 'text-blue-600' : data()!.evidenceStats!.coverage >= 50 ? 'text-amber-400' : 'text-red-400'">
                          {{ data()!.evidenceStats!.coverage }}%
                        </span>
                      </div>
                      <div class="w-full bg-slate-700/50 rounded-full h-2.5">
                        <div class="h-2.5 rounded-full transition-all"
                             [class]="data()!.evidenceStats!.coverage >= 75 ? 'bg-blue-600' : data()!.evidenceStats!.coverage >= 50 ? 'bg-amber-500' : 'bg-red-500'"
                             [style.width.%]="data()!.evidenceStats!.coverage"></div>
                      </div>
                    </div>
                    <!-- Stats grid -->
                    <div class="grid grid-cols-3 gap-3">
                      <div class="bg-slate-900/40 rounded-lg p-3 text-center">
                        <div class="text-lg font-bold text-white">{{ data()!.evidenceStats!.total }}</div>
                        <div class="text-[10px] text-slate-500">{{ lang.l('Kokku', 'Total') }}</div>
                      </div>
                      <div class="bg-slate-900/40 rounded-lg p-3 text-center">
                        <div class="text-lg font-bold text-blue-600">{{ data()!.evidenceStats!.uploaded }}</div>
                        <div class="text-[10px] text-slate-500">{{ lang.l('\u00dcles laetud', 'Uploaded') }}</div>
                      </div>
                      <div class="bg-slate-900/40 rounded-lg p-3 text-center">
                        <div class="text-lg font-bold text-amber-400">{{ data()!.evidenceStats!.pending }}</div>
                        <div class="text-[10px] text-slate-500">{{ lang.l('Ootel', 'Pending') }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              }

              <!-- Vendor Risk Overview -->
              @if (hasPermission('vendors') && data()!.vendorOverview) {
                <div class="bg-white border border-slate-200 rounded-xl p-6">
                  <h2 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                      <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                      </svg>
                    </div>
                    {{ lang.l('Tarnijate riski\u00fclevaade', 'Vendor Risk Overview') }}
                  </h2>
                  <div class="grid grid-cols-2 gap-3 mb-4">
                    <div class="bg-slate-900/40 rounded-lg p-4 text-center">
                      <div class="text-2xl font-bold text-white">{{ data()!.vendorOverview!.total }}</div>
                      <div class="text-[10px] text-slate-500">{{ lang.l('Kokku tarnijaid', 'Total Vendors') }}</div>
                    </div>
                    <div class="bg-slate-900/40 rounded-lg p-4 text-center">
                      <div class="text-2xl font-bold text-blue-500">{{ data()!.vendorOverview!.averageScore }}</div>
                      <div class="text-[10px] text-slate-500">{{ lang.l('Keskmine skoor', 'Average Score') }}</div>
                    </div>
                  </div>
                  <div class="flex gap-3">
                    <div class="flex-1 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                      <div class="text-lg font-bold text-red-400">{{ data()!.vendorOverview!.critical }}</div>
                      <div class="text-[10px] text-red-400/70">{{ lang.l('Kriitilised', 'Critical') }}</div>
                    </div>
                    <div class="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
                      <div class="text-lg font-bold text-amber-400">{{ data()!.vendorOverview!.highRisk }}</div>
                      <div class="text-[10px] text-amber-400/70">{{ lang.l('K\u00f5rge risk', 'High Risk') }}</div>
                    </div>
                  </div>
                </div>
              }
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <!-- Recent Incidents -->
              @if (hasPermission('incidents') && data()!.incidents) {
                <div class="bg-white border border-slate-200 rounded-xl p-6">
                  <h2 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                      <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                      </svg>
                    </div>
                    {{ lang.l('Hiljutised intsidendid', 'Recent Incidents') }}
                    @if (data()!.incidents!.length > 0) {
                      <span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-700/50 text-slate-400">{{ data()!.incidents!.length }}</span>
                    }
                  </h2>
                  @if (data()!.incidents!.length > 0) {
                    <div class="space-y-2.5">
                      @for (incident of data()!.incidents; track incident.id) {
                        <div class="flex items-center gap-3 p-3 rounded-lg bg-slate-900/40">
                          <div class="w-2 h-2 rounded-full flex-shrink-0"
                               [class]="incident.severity === 'CRITICAL' ? 'bg-red-500' : incident.severity === 'HIGH' ? 'bg-orange-500' : incident.severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'">
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="text-sm text-white truncate">{{ incident.title }}</p>
                            <div class="flex items-center gap-2 mt-0.5">
                              <span class="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                    [class]="incident.severity === 'CRITICAL' ? 'bg-red-500/15 text-red-400' : incident.severity === 'HIGH' ? 'bg-orange-500/15 text-orange-400' : incident.severity === 'MEDIUM' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'">
                                {{ incident.severity }}
                              </span>
                              <span class="text-[10px] text-slate-500">{{ incident.reportedAt | date:'dd.MM.yyyy' }}</span>
                              <span class="text-[10px] text-slate-500">{{ incident.status }}</span>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="text-center py-6">
                      <div class="text-3xl mb-2 opacity-30">&#9989;</div>
                      <p class="text-sm text-slate-400">{{ lang.l('Hiljutisi intsidente pole', 'No recent incidents') }}</p>
                    </div>
                  }
                </div>
              }

              <!-- Remediation Overview -->
              @if (hasPermission('remediation') && data()!.remediation) {
                <div class="bg-white border border-slate-200 rounded-xl p-6">
                  <h2 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                      </svg>
                    </div>
                    {{ lang.l('Parandust\u00f6\u00f6de \u00fclevaade', 'Remediation Overview') }}
                  </h2>
                  <!-- Progress bar -->
                  <div class="mb-4">
                    <div class="flex justify-between text-xs mb-1.5">
                      <span class="text-slate-400">{{ lang.l('Edenemne', 'Progress') }}</span>
                      <span class="font-medium text-blue-600">
                        {{ data()!.remediation!.total > 0 ? Math.round(data()!.remediation!.completed / data()!.remediation!.total * 100) : 0 }}%
                      </span>
                    </div>
                    <div class="w-full bg-slate-700/50 rounded-full h-2.5">
                      <div class="h-2.5 rounded-full bg-blue-600 transition-all"
                           [style.width.%]="data()!.remediation!.total > 0 ? (data()!.remediation!.completed / data()!.remediation!.total * 100) : 0"></div>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div class="bg-slate-900/40 rounded-lg p-3 text-center">
                      <div class="text-lg font-bold text-white">{{ data()!.remediation!.total }}</div>
                      <div class="text-[10px] text-slate-500">{{ lang.l('Kokku', 'Total') }}</div>
                    </div>
                    <div class="bg-slate-900/40 rounded-lg p-3 text-center">
                      <div class="text-lg font-bold text-blue-600">{{ data()!.remediation!.completed }}</div>
                      <div class="text-[10px] text-slate-500">{{ lang.l('Tehtud', 'Completed') }}</div>
                    </div>
                    <div class="bg-slate-900/40 rounded-lg p-3 text-center">
                      <div class="text-lg font-bold text-amber-400">{{ data()!.remediation!.inProgress }}</div>
                      <div class="text-[10px] text-slate-500">{{ lang.l('T\u00f6\u00f6s', 'In Progress') }}</div>
                    </div>
                    <div class="bg-slate-900/40 rounded-lg p-3 text-center">
                      <div class="text-lg font-bold text-red-400">{{ data()!.remediation!.overdue }}</div>
                      <div class="text-[10px] text-slate-500">{{ lang.l('Hilinenud', 'Overdue') }}</div>
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Disclaimer -->
            <div class="bg-slate-800/30 border border-slate-200 rounded-xl p-5 mb-8">
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div>
                  <p class="text-xs text-slate-400">
                    {{ lang.l(
                      'See on automaatselt genereeritud vastavus\u00fclevaade. Andmed p\u00e4rinevad organisatsiooni enda sisestatud hindamistulemustest DoraAudit platvormil. See dokument ei ole ametlik audit ega sertifitseerimine.',
                      'This is an automatically generated compliance overview. Data comes from the organization\'s self-assessment results on the DoraAudit platform. This document is not an official audit or certification.'
                    ) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Footer Branding -->
            <div class="text-center py-8 border-t border-slate-800/50">
              <div class="inline-flex items-center gap-3 mb-3">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-500 flex items-center justify-center">
                  <span class="text-white font-bold text-xs">DA</span>
                </div>
                <span class="text-sm font-semibold text-slate-400">
                  {{ lang.l('T\u00f6\u00f6tab', 'Powered by') }}
                  <a href="https://doraaudit.eu" class="text-violet-400 hover:text-violet-300 transition-colors" target="_blank">DoraAudit.eu</a>
                </span>
              </div>
              <p class="text-[10px] text-slate-600">
                {{ lang.l(
                  'DORA vastavuse hindamise ja j\u00e4lgimise platvorm Euroopa finantsasutustele',
                  'DORA compliance assessment and monitoring platform for European financial institutions'
                ) }}
              </p>
              <p class="text-[10px] text-slate-700 mt-1">
                {{ lang.l('Genereeritud', 'Generated') }} {{ today | date:'dd.MM.yyyy HH:mm' }}
              </p>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .gradient-text {
      background: linear-gradient(135deg, #a78bfa, #22d3ee);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  `]
})
export class RegulatorViewComponent implements OnInit {
  lang = inject(LangService);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  error = signal(false);
  errorCode = signal(0);
  data = signal<RegulatorPortalData | null>(null);

  today = new Date();
  Math = Math;

  private token = '';

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) {
      this.loading.set(false);
      this.error.set(true);
      this.errorCode.set(404);
      return;
    }

    this.http.get<RegulatorPortalData>(`/api/public/regulator/${this.token}`).subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(true);
        this.errorCode.set(err.status || 500);
      }
    });
  }

  hasPermission(perm: string): boolean {
    return this.data()?.permissions?.includes(perm) ?? false;
  }

  getScoreColor(percentage: number): string {
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 50) return 'text-amber-500';
    return 'text-red-500';
  }
}
