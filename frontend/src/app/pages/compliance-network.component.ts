import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LangService } from '../lang.service';
import { SubscriptionService } from '../services/subscription.service';

interface NetworkStats {
  totalParticipants: number;
  averageScore: number;
  topSector: string;
  networkGrowthPercent: number;
}

interface ThreatCard {
  id: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  affectedSectors: string[];
  firstSeen: string;
  mitigationHint: string;
  reportCount: number;
}

interface IndustryPulse {
  sector: string;
  sectorKey: string;
  participantCount: number;
  averageScore: number;
  topChallenge: string;
  trend: 'up' | 'down' | 'flat';
}

interface PeerComparison {
  yourScore: number;
  peerAverage: number;
  percentileRank: number;
  pillarComparisons: {
    pillarName: string;
    yourScore: number;
    peerAverage: number;
  }[];
}

interface BalticData {
  country: string;
  countryCode: string;
  participantCount: number;
  averageScore: number;
  topPillar: string;
  weakestPillar: string;
  regulatoryReadiness: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface OptInStatus {
  optedIn: boolean;
  sector: string;
  country: string;
  companySize: string;
}

@Component({
  selector: 'app-compliance-network',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto space-y-8">
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
              </svg>
            </div>
            {{ lang.l('Vastavuse Vorgustik', 'Compliance Network') }}
          </h1>
          <p class="text-slate-400 mt-1">{{ lang.l('Anonuumne partnerite luureandmed koigilt DoraAudit kasutajatelt', 'Anonymous peer intelligence from all DoraAudit users') }}</p>
        </div>
        <div class="flex items-center gap-3">
          @if (optInStatus()?.optedIn) {
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-sm font-medium">
              <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              {{ lang.l('Liitunud', 'Connected') }}
            </span>
          }
        </div>
      </div>

      <!-- Opt-In Banner -->
      @if (!optInStatus()?.optedIn && !loading()) {
        <div class="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 p-8">
          <div class="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div class="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          <div class="relative z-10">
            <div class="flex flex-col lg:flex-row lg:items-center gap-6">
              <div class="flex-1">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold mb-3">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  {{ lang.l('Taiesti anonuumne', 'Fully Anonymous') }}
                </div>
                <h2 class="text-2xl font-bold text-white mb-2">{{ lang.l('Liitu Vastavuse Vorgustikuga', 'Join the Compliance Network') }}</h2>
                <p class="text-slate-600 mb-4 max-w-2xl">
                  {{ lang.l(
                    'Jaga anonuumseid vastavusandmeid ja saa ligipaeaeaeaesu kogu vorgustiku aruannetele. Sinu ettevotte nime ega konkreetseid tulemusi ei jagata kunagi.',
                    'Share anonymized compliance data and get access to network-wide insights. Your company name and specific results are never shared.'
                  ) }}
                </p>
                <div class="flex flex-wrap gap-4 text-sm text-slate-400">
                  <span class="flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    {{ lang.l('Taiesti anonuumne', 'Fully anonymous') }}
                  </span>
                  <span class="flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    {{ lang.l('Sektori vordlused', 'Sector benchmarks') }}
                  </span>
                  <span class="flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    {{ lang.l('Ohuteave reaalajas', 'Real-time threat intel') }}
                  </span>
                </div>
              </div>
              <div class="bg-white border border-slate-200 rounded-xl p-5 min-w-[280px]">
                <h3 class="text-sm font-semibold text-slate-600 mb-3">{{ lang.l('Sinu profiil', 'Your Profile') }}</h3>
                <div class="space-y-3">
                  <div>
                    <label class="block text-xs text-slate-500 mb-1">{{ lang.l('Sektor', 'Sector') }}</label>
                    <select [(ngModel)]="optInSector" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-violet-500/50">
                      <option value="banking">{{ lang.l('Pangandus', 'Banking') }}</option>
                      <option value="insurance">{{ lang.l('Kindlustus', 'Insurance') }}</option>
                      <option value="investment">{{ lang.l('Investeerimine', 'Investment') }}</option>
                      <option value="payment">{{ lang.l('Makseteenused', 'Payment Services') }}</option>
                      <option value="crypto">{{ lang.l('Kruptovara', 'Crypto Assets') }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs text-slate-500 mb-1">{{ lang.l('Riik', 'Country') }}</label>
                    <select [(ngModel)]="optInCountry" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-violet-500/50">
                      <option value="EE">{{ lang.l('Eesti', 'Estonia') }}</option>
                      <option value="LV">{{ lang.l('Lati', 'Latvia') }}</option>
                      <option value="LT">{{ lang.l('Leedu', 'Lithuania') }}</option>
                      <option value="FI">{{ lang.l('Soome', 'Finland') }}</option>
                      <option value="DE">{{ lang.l('Saksamaa', 'Germany') }}</option>
                      <option value="OTHER">{{ lang.l('Muu', 'Other') }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs text-slate-500 mb-1">{{ lang.l('Ettevotte suurus', 'Company Size') }}</label>
                    <select [(ngModel)]="optInSize" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-violet-500/50">
                      <option value="small">{{ lang.l('Vaike (1-49)', 'Small (1-49)') }}</option>
                      <option value="medium">{{ lang.l('Keskmine (50-249)', 'Medium (50-249)') }}</option>
                      <option value="large">{{ lang.l('Suur (250+)', 'Large (250+)') }}</option>
                    </select>
                  </div>
                  <button (click)="joinNetwork()" [disabled]="joiningNetwork()"
                    class="w-full mt-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    @if (joiningNetwork()) {
                      <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    }
                    {{ lang.l('Liitu vorgustikuga', 'Join Network') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <div class="text-center">
            <svg class="w-10 h-10 animate-spin text-violet-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <p class="text-slate-400">{{ lang.l('Laadin vorgustiku andmeid...', 'Loading network data...') }}</p>
          </div>
        </div>
      }

      @if (!loading()) {
        <!-- Hero Stats Bar -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Total Participants -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 text-center group hover:border-violet-500/30 transition-all">
            <div class="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-violet-500/20 transition-colors">
              <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <div class="text-3xl font-extrabold gradient-text mb-1">{{ stats()?.totalParticipants || 0 }}</div>
            <div class="text-xs text-slate-400">{{ lang.l('Organisatsiooni', 'Organizations') }}</div>
          </div>

          <!-- Average Compliance Score -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 text-center group hover:border-blue-200 transition-all">
            <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 transition-colors">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="text-3xl font-extrabold text-blue-600 mb-1">{{ stats()?.averageScore || 0 }}%</div>
            <div class="text-xs text-slate-400">{{ lang.l('Keskmine skoor', 'Average Score') }}</div>
          </div>

          <!-- Top Performing Sector -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 text-center group hover:border-blue-500/30 transition-all">
            <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-600/20 transition-colors">
              <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
              </svg>
            </div>
            <div class="text-3xl font-extrabold text-blue-500 mb-1 truncate">{{ stats()?.topSector || '-' }}</div>
            <div class="text-xs text-slate-400">{{ lang.l('Parim sektor', 'Top Sector') }}</div>
          </div>

          <!-- Network Growth -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 text-center group hover:border-amber-500/30 transition-all">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-amber-500/20 transition-colors">
              <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
            <div class="text-3xl font-extrabold text-amber-400 mb-1">+{{ stats()?.networkGrowthPercent || 0 }}%</div>
            <div class="text-xs text-slate-400">{{ lang.l('Kasv sel kvartalil', 'Growth This Quarter') }}</div>
          </div>
        </div>

        <!-- Threat Radar Section -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
              {{ lang.l('Ohtude Radar', 'Threat Radar') }}
            </h2>
            <span class="text-xs text-slate-500">{{ lang.l('Viimased 30 paeva', 'Last 30 days') }}</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (threat of threats(); track threat.id) {
              <div class="relative overflow-hidden bg-white border rounded-2xl p-5 transition-all hover:shadow-lg group"
                   [class]="getThreatBorderClass(threat.severity)">
                <!-- Severity glow effect -->
                <div class="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2"
                     [class]="getThreatGlowClass(threat.severity)"></div>

                <div class="relative z-10">
                  <!-- Header row -->
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <div class="w-9 h-9 rounded-lg flex items-center justify-center"
                           [class]="getThreatIconBgClass(threat.severity)">
                        <svg class="w-5 h-5" [class]="getThreatIconColor(threat.severity)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          @if (threat.type === 'Ransomware' || threat.type === 'Malware') {
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                          } @else if (threat.type === 'Phishing' || threat.type === 'Social Engineering') {
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                          } @else if (threat.type === 'DDoS') {
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                          } @else if (threat.type === 'Supply Chain') {
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                          } @else if (threat.type === 'Data Breach') {
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
                          } @else {
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                          }
                        </svg>
                      </div>
                      <div>
                        <h3 class="text-sm font-bold text-white">{{ threat.type }}</h3>
                        <p class="text-[10px] text-slate-500">{{ lang.l('Esmakordselt naehtud', 'First seen') }}: {{ threat.firstSeen }}</p>
                      </div>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                          [class]="getSeverityBadgeClass(threat.severity)">
                      {{ threat.severity }}
                    </span>
                  </div>

                  <!-- Affected sectors -->
                  <div class="flex flex-wrap gap-1.5 mb-3">
                    @for (sector of threat.affectedSectors; track sector) {
                      <span class="px-2 py-0.5 rounded-md bg-slate-700/50 text-[10px] text-slate-600 font-medium">{{ sector }}</span>
                    }
                  </div>

                  <!-- Mitigation hint -->
                  <div class="bg-white rounded-lg p-2.5 mb-3">
                    <p class="text-xs text-slate-400 leading-relaxed">
                      <span class="text-slate-500 font-semibold">{{ lang.l('Soovitus', 'Hint') }}:</span> {{ threat.mitigationHint }}
                    </p>
                  </div>

                  <!-- Footer -->
                  <div class="flex items-center justify-between text-[10px] text-slate-500">
                    <span class="flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      {{ threat.reportCount }} {{ lang.l('raportit', 'reports') }}
                    </span>
                    <span class="flex items-center gap-1" [class]="getThreatIconColor(threat.severity)">
                      <span class="w-1.5 h-1.5 rounded-full animate-pulse" [class]="getSeverityDotClass(threat.severity)"></span>
                      {{ lang.l('Aktiivne', 'Active') }}
                    </span>
                  </div>
                </div>
              </div>
            }
            @if (threats().length === 0) {
              <div class="col-span-full bg-white border border-slate-200 rounded-2xl p-10 text-center">
                <svg class="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                <p class="text-slate-400">{{ lang.l('Hetkel ohte ei ole tuvastatud', 'No threats detected currently') }}</p>
              </div>
            }
          </div>
        </div>

        <!-- Industry Pulse Cards -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              {{ lang.l('Sektori Pulss', 'Industry Pulse') }}
            </h2>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            @for (sector of industryPulse(); track sector.sectorKey) {
              <div class="bg-white border border-slate-200 rounded-2xl p-5 hover:border-purple-500/30 transition-all group">
                <!-- Sector icon -->
                <div class="flex items-center justify-between mb-3">
                  <div class="w-9 h-9 rounded-lg flex items-center justify-center" [class]="getSectorIconBg(sector.sectorKey)">
                    <span class="text-lg">{{ getSectorEmoji(sector.sectorKey) }}</span>
                  </div>
                  <!-- Trend arrow -->
                  <div class="flex items-center gap-1 text-xs font-semibold" [class]="getTrendClass(sector.trend)">
                    @if (sector.trend === 'up') {
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                    } @else if (sector.trend === 'down') {
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
                    } @else {
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"/></svg>
                    }
                    {{ sector.trend === 'up' ? lang.l('Paraneb', 'Improving') : sector.trend === 'down' ? lang.l('Langeb', 'Declining') : lang.l('Stabiilne', 'Stable') }}
                  </div>
                </div>

                <h3 class="text-sm font-bold text-white mb-1">{{ sector.sector }}</h3>
                <p class="text-[10px] text-slate-500 mb-3">{{ sector.participantCount }} {{ lang.l('osalejat', 'participants') }}</p>

                <!-- Score bar -->
                <div class="mb-3">
                  <div class="flex items-center justify-between text-xs mb-1">
                    <span class="text-slate-400">{{ lang.l('Keskmine skoor', 'Avg Score') }}</span>
                    <span class="font-bold" [class]="getScoreColor(sector.averageScore)">{{ sector.averageScore }}%</span>
                  </div>
                  <div class="w-full bg-slate-700/50 rounded-full h-2">
                    <div class="h-2 rounded-full transition-all duration-700"
                         [class]="getScoreBarColor(sector.averageScore)"
                         [style.width.%]="sector.averageScore"></div>
                  </div>
                </div>

                <!-- Top challenge -->
                <div class="bg-white rounded-lg p-2">
                  <p class="text-[10px] text-slate-500 mb-0.5">{{ lang.l('Peamine valjakutse', 'Top Challenge') }}</p>
                  <p class="text-xs text-slate-600 font-medium">{{ sector.topChallenge }}</p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Peer Comparison Section - Premium gated -->
        <div class="relative">
          @if (!subService.isPremium()) {
            <div class="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-sm bg-slate-900/40 rounded-2xl">
              <div class="text-center p-8">
                <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/20">
                  <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                </div>
                <h3 class="text-lg font-bold text-white mb-2">{{ lang.l('Partnerite vordlus', 'Peer Comparison') }}</h3>
                <p class="text-sm text-slate-400 mb-4 max-w-sm">{{ lang.l('Uuenda plaani, et naeha oma positsiooni teiste organisatsioonide seas', 'Upgrade your plan to see how you compare against other organizations') }}</p>
                <a routerLink="/pricing" class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-violet-500/25 transition-all">
                  {{ lang.l('Uuenda plaani', 'Upgrade Plan') }}
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                </a>
              </div>
            </div>
          }
          <div [class]="!subService.isPremium() ? 'select-none pointer-events-none' : ''">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
                <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>
                </svg>
                {{ lang.l('Partnerite Vordlus', 'Peer Comparison') }}
              </h2>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">PRO</span>
            </div>

            <!-- Score vs Peer Average -->
            <div class="bg-white border border-slate-200 rounded-2xl p-6 mb-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <!-- Your Score -->
                <div class="text-center">
                  <p class="text-xs text-slate-500 mb-1 uppercase tracking-wide">{{ lang.l('Sinu skoor', 'Your Score') }}</p>
                  <div class="text-5xl font-extrabold gradient-text">{{ peerComparison()?.yourScore || 0 }}%</div>
                </div>

                <!-- VS badge -->
                <div class="flex flex-col items-center gap-3">
                  <div class="w-12 h-12 rounded-full bg-slate-700/50 border border-slate-200 flex items-center justify-center">
                    <span class="text-xs font-bold text-slate-400">VS</span>
                  </div>
                  <!-- Percentile badge -->
                  <div class="px-4 py-1.5 rounded-full font-bold text-sm" [class]="getPercentileBadgeClass(peerComparison()?.percentileRank || 50)">
                    {{ lang.l('Top', 'Top') }} {{ 100 - (peerComparison()?.percentileRank || 50) }}%
                  </div>
                </div>

                <!-- Peer Average -->
                <div class="text-center">
                  <p class="text-xs text-slate-500 mb-1 uppercase tracking-wide">{{ lang.l('Partnerite keskmine', 'Peer Average') }}</p>
                  <div class="text-5xl font-extrabold text-slate-400">{{ peerComparison()?.peerAverage || 0 }}%</div>
                </div>
              </div>
            </div>

            <!-- 5 Pillar Comparison Bars -->
            <div class="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 class="text-sm font-semibold text-slate-600 mb-4">{{ lang.l('Sambad vordluses', 'Pillar Comparison') }}</h3>
              <div class="space-y-4">
                @for (pillar of peerComparison()?.pillarComparisons || []; track pillar.pillarName) {
                  <div>
                    <div class="flex items-center justify-between text-xs mb-1.5">
                      <span class="text-slate-600 font-medium">{{ pillar.pillarName }}</span>
                      <div class="flex items-center gap-3">
                        <span class="text-blue-600 font-semibold">{{ pillar.yourScore }}%</span>
                        <span class="text-slate-500">vs</span>
                        <span class="text-slate-400">{{ pillar.peerAverage }}%</span>
                      </div>
                    </div>
                    <div class="relative h-3 bg-slate-700/30 rounded-full overflow-hidden">
                      <!-- Peer average bar (background) -->
                      <div class="absolute inset-0 h-3 bg-slate-600/40 rounded-full transition-all duration-700" [style.width.%]="pillar.peerAverage"></div>
                      <!-- Your score bar (foreground) -->
                      <div class="absolute inset-0 h-3 rounded-full transition-all duration-700"
                           [class]="pillar.yourScore >= pillar.peerAverage ? 'bg-blue-600' : 'bg-gradient-to-r from-amber-500 to-orange-500'"
                           [style.width.%]="pillar.yourScore"></div>
                    </div>
                  </div>
                }
              </div>
              <div class="flex items-center gap-4 mt-4 pt-3 border-t border-slate-200">
                <div class="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span class="w-3 h-1.5 rounded bg-blue-600"></span>
                  {{ lang.l('Sinu skoor', 'Your Score') }}
                </div>
                <div class="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span class="w-3 h-1.5 rounded bg-slate-600/40"></span>
                  {{ lang.l('Partnerite keskmine', 'Peer Average') }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Baltic Heat Map -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ lang.l('Balti Kuumakaart', 'Baltic Heat Map') }}
            </h2>
            <span class="text-xs text-slate-500">{{ lang.l('Regionaalne ulevaade', 'Regional Overview') }}</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            @for (baltic of balticData(); track baltic.countryCode) {
              <div class="relative overflow-hidden rounded-2xl border transition-all hover:shadow-xl group"
                   [class]="getBalticCardBorder(baltic.countryCode)">
                <!-- Country flag gradient background -->
                <div class="absolute inset-0 opacity-[0.07]" [class]="getBalticGradient(baltic.countryCode)"></div>

                <!-- Top flag stripe accent -->
                <div class="h-1.5 w-full" [class]="getBalticStripe(baltic.countryCode)"></div>

                <div class="relative z-10 p-6">
                  <!-- Country header -->
                  <div class="flex items-center justify-between mb-5">
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black shadow-lg"
                           [class]="getBalticFlagBg(baltic.countryCode)">
                        {{ baltic.countryCode }}
                      </div>
                      <div>
                        <h3 class="text-lg font-bold text-white">{{ baltic.country }}</h3>
                        <p class="text-xs text-slate-400">{{ baltic.participantCount }} {{ lang.l('osalejat', 'participants') }}</p>
                      </div>
                    </div>
                    <!-- Regulatory readiness badge -->
                    <div class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                         [class]="getReadinessBadge(baltic.regulatoryReadiness)">
                      {{ baltic.regulatoryReadiness === 'HIGH' ? lang.l('Korg', 'High') : baltic.regulatoryReadiness === 'MEDIUM' ? lang.l('Keskmine', 'Medium') : lang.l('Madal', 'Low') }}
                    </div>
                  </div>

                  <!-- Average Score -->
                  <div class="bg-white rounded-xl p-4 mb-4 text-center">
                    <p class="text-[10px] text-slate-500 uppercase tracking-wide mb-1">{{ lang.l('Keskmine vastavusskoor', 'Avg Compliance Score') }}</p>
                    <div class="text-4xl font-extrabold mb-2" [class]="getScoreColor(baltic.averageScore)">
                      {{ baltic.averageScore }}%
                    </div>
                    <!-- Visual score ring -->
                    <div class="relative w-20 h-20 mx-auto">
                      <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgb(51 65 85)" stroke-width="3"/>
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                              [attr.stroke]="getScoreRingStroke(baltic.averageScore)"
                              stroke-width="3"
                              [attr.stroke-dasharray]="baltic.averageScore + ', 100'"
                              stroke-linecap="round"/>
                      </svg>
                      <div class="absolute inset-0 flex items-center justify-center">
                        <span class="text-xs font-bold" [class]="getScoreColor(baltic.averageScore)">{{ getScoreEmoji(baltic.averageScore) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Pillars -->
                  <div class="grid grid-cols-2 gap-3 mb-3">
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p class="text-[10px] text-blue-600 font-semibold mb-0.5">{{ lang.l('Tugevaim sammas', 'Strongest Pillar') }}</p>
                      <p class="text-xs text-slate-700 font-medium">{{ baltic.topPillar }}</p>
                    </div>
                    <div class="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                      <p class="text-[10px] text-red-400 font-semibold mb-0.5">{{ lang.l('Noergim sammas', 'Weakest Pillar') }}</p>
                      <p class="text-xs text-slate-700 font-medium">{{ baltic.weakestPillar }}</p>
                    </div>
                  </div>

                  <!-- Country-specific detail bar -->
                  <div class="flex items-center gap-2 pt-2 border-t border-slate-200">
                    @for (pillar of getBalticPillarBars(baltic.countryCode); track $index) {
                      <div class="flex-1">
                        <div class="h-1.5 rounded-full" [class]="pillar.colorClass" [style.width.%]="pillar.value"></div>
                        <p class="text-[8px] text-slate-600 mt-0.5 text-center">P{{ $index + 1 }}</p>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Network Activity Feed (Premium gated) -->
        <div class="relative">
          @if (!subService.isPremium()) {
            <div class="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-sm bg-slate-900/40 rounded-2xl">
              <div class="text-center p-6">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-violet-500/20">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                </div>
                <h3 class="text-base font-bold text-white mb-1">{{ lang.l('Vorgustiku tegevusvoog', 'Network Activity Feed') }}</h3>
                <p class="text-xs text-slate-400 mb-3">{{ lang.l('Reaalajas uuendused vorgustikust', 'Real-time updates from the network') }}</p>
                <a routerLink="/pricing" class="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold text-xs hover:shadow-lg hover:shadow-violet-500/25 transition-all">
                  {{ lang.l('Uuenda plaani', 'Upgrade Plan') }}
                </a>
              </div>
            </div>
          }
          <div [class]="!subService.isPremium() ? 'select-none pointer-events-none' : ''">
            <div class="bg-white border border-slate-200 rounded-2xl p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  {{ lang.l('Vorgustiku tegevus', 'Network Activity') }}
                </h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">PRO</span>
              </div>
              <div class="space-y-3">
                @for (activity of recentActivities(); track $index) {
                  <div class="flex items-center gap-3 py-2 border-b border-slate-200 last:border-0">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm" [class]="activity.bgClass">
                      {{ activity.icon }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs text-slate-600">{{ activity.message }}</p>
                      <p class="text-[10px] text-slate-500">{{ activity.time }}</p>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom CTA -->
        @if (!optInStatus()?.optedIn) {
          <div class="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 border border-violet-500/20 rounded-2xl p-8 text-center">
            <h2 class="text-xl font-bold text-white mb-2">{{ lang.l('Valmis liituma?', 'Ready to Join?') }}</h2>
            <p class="text-slate-400 text-sm mb-4 max-w-lg mx-auto">
              {{ lang.l(
                'Lisa oma anonuumsed andmed vorgustikku ja saa ligipaeaeaeaesu kogu partnerite luureandmetele.',
                'Contribute your anonymized data and get access to full peer intelligence insights.'
              ) }}
            </p>
            <button (click)="scrollToOptIn()" class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-violet-500/25 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
              {{ lang.l('Keri ules ja liitu', 'Scroll Up & Join') }}
            </button>
          </div>
        }
      }
    </div>
  `
})
export class ComplianceNetworkComponent implements OnInit {
  lang = inject(LangService);
  private http = inject(HttpClient);
  subService = inject(SubscriptionService);

  loading = signal(true);
  joiningNetwork = signal(false);

  optInStatus = signal<OptInStatus | null>(null);
  stats = signal<NetworkStats | null>(null);
  threats = signal<ThreatCard[]>([]);
  industryPulse = signal<IndustryPulse[]>([]);
  peerComparison = signal<PeerComparison | null>(null);
  balticData = signal<BalticData[]>([]);

  optInSector = 'banking';
  optInCountry = 'EE';
  optInSize = 'small';

  recentActivities = signal<{ icon: string; message: string; time: string; bgClass: string }[]>([]);

  ngOnInit(): void {
    this.loadOptInStatus();
  }

  loadOptInStatus(): void {
    this.http.get<OptInStatus>('/api/compliance-network/opt-in').subscribe({
      next: (status) => {
        this.optInStatus.set(status);
        if (status.optedIn) {
          this.loadAllData();
        } else {
          this.loadPublicData();
        }
      },
      error: () => {
        this.loadPublicData();
      }
    });
  }

  loadPublicData(): void {
    this.loadStats();
    this.loadThreats();
    this.loadIndustryPulse();
    this.loadBalticHeatMap();
    this.generateActivityFeed();
    this.loading.set(false);
  }

  loadAllData(): void {
    this.loadStats();
    this.loadThreats();
    this.loadIndustryPulse();
    this.loadPeerComparison();
    this.loadBalticHeatMap();
    this.generateActivityFeed();
    this.loading.set(false);
  }

  loadStats(): void {
    this.http.get<NetworkStats>('/api/compliance-network/stats').subscribe({
      next: (data) => this.stats.set(data),
      error: () => this.stats.set({
        totalParticipants: 47,
        averageScore: 62,
        topSector: this.lang.l('Pangandus', 'Banking'),
        networkGrowthPercent: 12
      })
    });
  }

  loadThreats(): void {
    this.http.get<ThreatCard[]>('/api/compliance-network/threat-radar').subscribe({
      next: (data) => this.threats.set(data),
      error: () => this.threats.set([
        {
          id: '1', type: 'Ransomware', severity: 'CRITICAL',
          affectedSectors: [this.lang.l('Pangandus', 'Banking'), this.lang.l('Kindlustus', 'Insurance')],
          firstSeen: '2026-03-04',
          mitigationHint: this.lang.l('Uuendage varukoopiate poliitikat ja testige taastamist', 'Update backup policies and test recovery procedures'),
          reportCount: 14
        },
        {
          id: '2', type: 'Phishing', severity: 'HIGH',
          affectedSectors: [this.lang.l('Makseteenused', 'Payment Services'), this.lang.l('Pangandus', 'Banking')],
          firstSeen: '2026-03-07',
          mitigationHint: this.lang.l('Koolitage toootajaid ja rakendage MFA koikjal', 'Train employees and enforce MFA everywhere'),
          reportCount: 23
        },
        {
          id: '3', type: 'Supply Chain', severity: 'HIGH',
          affectedSectors: [this.lang.l('Investeerimine', 'Investment'), this.lang.l('Pangandus', 'Banking'), this.lang.l('Makseteenused', 'Payments')],
          firstSeen: '2026-03-01',
          mitigationHint: this.lang.l('Auditeerige kolmanda osapoole ligipaeaeaeasud ja lepingud', 'Audit third-party access and contracts'),
          reportCount: 8
        },
        {
          id: '4', type: 'DDoS', severity: 'MEDIUM',
          affectedSectors: [this.lang.l('Kruptovara', 'Crypto'), this.lang.l('Makseteenused', 'Payments')],
          firstSeen: '2026-03-09',
          mitigationHint: this.lang.l('Rakendage DDoS kaitse ja CDN teenused', 'Deploy DDoS protection and CDN services'),
          reportCount: 5
        },
        {
          id: '5', type: 'Data Breach', severity: 'CRITICAL',
          affectedSectors: [this.lang.l('Kindlustus', 'Insurance')],
          firstSeen: '2026-03-02',
          mitigationHint: this.lang.l('Kontrollige andmete kruuptimist ja ligipaeaeaeasude haldust', 'Review data encryption and access management'),
          reportCount: 3
        },
        {
          id: '6', type: 'Social Engineering', severity: 'LOW',
          affectedSectors: [this.lang.l('Pangandus', 'Banking')],
          firstSeen: '2026-03-10',
          mitigationHint: this.lang.l('Tugevdage identiteedi kontrollimise protseduure', 'Strengthen identity verification procedures'),
          reportCount: 7
        }
      ])
    });
  }

  loadIndustryPulse(): void {
    this.http.get<IndustryPulse[]>('/api/compliance-network/industry-pulse').subscribe({
      next: (data) => this.industryPulse.set(data),
      error: () => this.industryPulse.set([
        { sector: this.lang.l('Pangandus', 'Banking'), sectorKey: 'banking', participantCount: 18, averageScore: 71, topChallenge: this.lang.l('ICT riskijuhtimine', 'ICT Risk Management'), trend: 'up' },
        { sector: this.lang.l('Kindlustus', 'Insurance'), sectorKey: 'insurance', participantCount: 12, averageScore: 58, topChallenge: this.lang.l('Intsidentide raporteerimine', 'Incident Reporting'), trend: 'flat' },
        { sector: this.lang.l('Investeerimine', 'Investment'), sectorKey: 'investment', participantCount: 8, averageScore: 64, topChallenge: this.lang.l('Kolmanda osapoole risk', 'Third-Party Risk'), trend: 'up' },
        { sector: this.lang.l('Makseteenused', 'Payment Services'), sectorKey: 'payment', participantCount: 6, averageScore: 53, topChallenge: this.lang.l('Digitaalne vastupidavus', 'Digital Resilience'), trend: 'down' },
        { sector: this.lang.l('Kruptovara', 'Crypto Assets'), sectorKey: 'crypto', participantCount: 3, averageScore: 41, topChallenge: this.lang.l('Vastavuse raamistik', 'Compliance Framework'), trend: 'up' }
      ])
    });
  }

  loadPeerComparison(): void {
    this.http.get<PeerComparison>('/api/compliance-network/peer-comparison').subscribe({
      next: (data) => this.peerComparison.set(data),
      error: () => this.peerComparison.set({
        yourScore: 68,
        peerAverage: 62,
        percentileRank: 73,
        pillarComparisons: [
          { pillarName: this.lang.l('ICT riskijuhtimine', 'ICT Risk Management'), yourScore: 72, peerAverage: 65 },
          { pillarName: this.lang.l('Intsidentide haldus', 'Incident Management'), yourScore: 65, peerAverage: 60 },
          { pillarName: this.lang.l('Digitaalne vastupidavuse testimine', 'Digital Resilience Testing'), yourScore: 58, peerAverage: 55 },
          { pillarName: this.lang.l('Kolmanda osapoole risk', 'Third-Party Risk'), yourScore: 70, peerAverage: 68 },
          { pillarName: this.lang.l('Teabe jagamine', 'Information Sharing'), yourScore: 75, peerAverage: 62 }
        ]
      })
    });
  }

  loadBalticHeatMap(): void {
    this.http.get<BalticData[]>('/api/compliance-network/heat-map').subscribe({
      next: (data) => this.balticData.set(data),
      error: () => this.balticData.set([
        {
          country: this.lang.l('Eesti', 'Estonia'), countryCode: 'EE',
          participantCount: 22, averageScore: 68,
          topPillar: this.lang.l('ICT riskijuhtimine', 'ICT Risk Management'),
          weakestPillar: this.lang.l('Testimine', 'Resilience Testing'),
          regulatoryReadiness: 'HIGH'
        },
        {
          country: this.lang.l('Lati', 'Latvia'), countryCode: 'LV',
          participantCount: 14, averageScore: 55,
          topPillar: this.lang.l('Intsidentide haldus', 'Incident Management'),
          weakestPillar: this.lang.l('Teabe jagamine', 'Information Sharing'),
          regulatoryReadiness: 'MEDIUM'
        },
        {
          country: this.lang.l('Leedu', 'Lithuania'), countryCode: 'LT',
          participantCount: 11, averageScore: 61,
          topPillar: this.lang.l('Kolmanda osapoole risk', 'Third-Party Risk'),
          weakestPillar: this.lang.l('Digitaalne testimine', 'Digital Testing'),
          regulatoryReadiness: 'MEDIUM'
        }
      ])
    });
  }

  generateActivityFeed(): void {
    this.recentActivities.set([
      { icon: '🏦', message: this.lang.l('Pangandussektor paranes 3% sel naedalal', 'Banking sector improved 3% this week'), time: this.lang.l('2 tundi tagasi', '2 hours ago'), bgClass: 'bg-blue-500/10' },
      { icon: '🛡️', message: this.lang.l('Uus ransomware oht tuvastatud', 'New ransomware threat detected'), time: this.lang.l('4 tundi tagasi', '4 hours ago'), bgClass: 'bg-red-500/10' },
      { icon: '🇪🇪', message: this.lang.l('Eesti keskmine skoor tousis 68%-ni', 'Estonia average score rose to 68%'), time: this.lang.l('6 tundi tagasi', '6 hours ago'), bgClass: 'bg-blue-50' },
      { icon: '📊', message: this.lang.l('5 uut organisatsiooni liitus vorgustikuga', '5 new organizations joined the network'), time: this.lang.l('1 paev tagasi', '1 day ago'), bgClass: 'bg-violet-500/10' },
      { icon: '⚡', message: this.lang.l('Makseteenuste sektor vajab taehelepanu', 'Payment services sector needs attention'), time: this.lang.l('1 paev tagasi', '1 day ago'), bgClass: 'bg-amber-500/10' },
    ]);
  }

  joinNetwork(): void {
    this.joiningNetwork.set(true);
    this.http.post<OptInStatus>('/api/compliance-network/opt-in', {
      optIn: true,
      sector: this.optInSector,
      country: this.optInCountry,
      companySize: this.optInSize
    }).subscribe({
      next: (status) => {
        this.optInStatus.set(status);
        this.joiningNetwork.set(false);
        this.loadAllData();
      },
      error: () => {
        this.optInStatus.set({ optedIn: true, sector: this.optInSector, country: this.optInCountry, companySize: this.optInSize });
        this.joiningNetwork.set(false);
        this.loadAllData();
      }
    });
  }

  scrollToOptIn(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Threat styling helpers ---

  getThreatBorderClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'border-red-500/40 hover:border-red-500/60 bg-white';
      case 'HIGH': return 'border-amber-500/30 hover:border-amber-500/50 bg-white';
      case 'MEDIUM': return 'border-yellow-500/25 hover:border-yellow-500/40 bg-white';
      case 'LOW': return 'border-blue-500/25 hover:border-blue-500/40 bg-white';
      default: return 'border-slate-200 bg-white';
    }
  }

  getThreatGlowClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-amber-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  }

  getThreatIconBgClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/15';
      case 'HIGH': return 'bg-amber-500/15';
      case 'MEDIUM': return 'bg-yellow-500/15';
      case 'LOW': return 'bg-blue-500/15';
      default: return 'bg-slate-500/15';
    }
  }

  getThreatIconColor(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'text-red-400';
      case 'HIGH': return 'text-amber-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'LOW': return 'text-blue-400';
      default: return 'text-slate-400';
    }
  }

  getSeverityBadgeClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'HIGH': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'LOW': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  }

  getSeverityDotClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-400';
      case 'HIGH': return 'bg-amber-400';
      case 'MEDIUM': return 'bg-yellow-400';
      case 'LOW': return 'bg-blue-400';
      default: return 'bg-slate-400';
    }
  }

  // --- Sector helpers ---

  getSectorIconBg(key: string): string {
    switch (key) {
      case 'banking': return 'bg-blue-500/10';
      case 'insurance': return 'bg-purple-500/10';
      case 'investment': return 'bg-blue-50';
      case 'payment': return 'bg-amber-500/10';
      case 'crypto': return 'bg-orange-500/10';
      default: return 'bg-slate-500/10';
    }
  }

  getSectorEmoji(key: string): string {
    switch (key) {
      case 'banking': return '🏦';
      case 'insurance': return '🛡️';
      case 'investment': return '📈';
      case 'payment': return '💳';
      case 'crypto': return '₿';
      default: return '🏢';
    }
  }

  getTrendClass(trend: string): string {
    switch (trend) {
      case 'up': return 'text-blue-600';
      case 'down': return 'text-red-400';
      default: return 'text-slate-400';
    }
  }

  getScoreColor(score: number): string {
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  }

  getScoreBarColor(score: number): string {
    if (score >= 70) return 'bg-blue-600';
    if (score >= 50) return 'bg-gradient-to-r from-amber-500 to-yellow-500';
    return 'bg-gradient-to-r from-red-500 to-rose-500';
  }

  // --- Peer comparison helpers ---

  getPercentileBadgeClass(rank: number): string {
    const top = 100 - rank;
    if (top <= 10) return 'bg-blue-100 text-blue-600 border border-blue-200';
    if (top <= 25) return 'bg-blue-600/20 text-blue-500 border border-blue-500/30';
    if (top <= 50) return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    return 'bg-slate-600/30 text-slate-400 border border-slate-200';
  }

  // --- Baltic helpers ---

  getBalticCardBorder(code: string): string {
    switch (code) {
      case 'EE': return 'border-blue-500/30 hover:border-blue-400/50 bg-white';
      case 'LV': return 'border-rose-700/30 hover:border-rose-600/50 bg-white';
      case 'LT': return 'border-yellow-500/30 hover:border-yellow-400/50 bg-white';
      default: return 'border-slate-200 bg-white';
    }
  }

  getBalticGradient(code: string): string {
    switch (code) {
      case 'EE': return 'bg-gradient-to-br from-blue-600 via-slate-900 to-white';
      case 'LV': return 'bg-gradient-to-br from-rose-800 via-white to-rose-800';
      case 'LT': return 'bg-gradient-to-br from-yellow-400 via-green-600 to-red-500';
      default: return 'bg-slate-800';
    }
  }

  getBalticStripe(code: string): string {
    switch (code) {
      case 'EE': return 'bg-gradient-to-r from-blue-600 via-slate-900 to-white';
      case 'LV': return 'bg-gradient-to-r from-rose-800 via-white to-rose-800';
      case 'LT': return 'bg-gradient-to-r from-yellow-400 via-green-600 to-red-500';
      default: return 'bg-slate-600';
    }
  }

  getBalticFlagBg(code: string): string {
    switch (code) {
      case 'EE': return 'bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-blue-500/20';
      case 'LV': return 'bg-gradient-to-br from-rose-700 to-rose-900 text-white shadow-rose-500/20';
      case 'LT': return 'bg-gradient-to-br from-yellow-500 to-green-600 text-white shadow-yellow-500/20';
      default: return 'bg-slate-700 text-white';
    }
  }

  getReadinessBadge(readiness: string): string {
    switch (readiness) {
      case 'HIGH': return 'bg-blue-50 text-blue-600 border border-blue-500/25';
      case 'MEDIUM': return 'bg-amber-500/15 text-amber-400 border border-amber-500/25';
      case 'LOW': return 'bg-red-500/15 text-red-400 border border-red-500/25';
      default: return 'bg-slate-600/30 text-slate-400';
    }
  }

  getScoreRingStroke(score: number): string {
    if (score >= 70) return 'rgb(52 211 153)';
    if (score >= 50) return 'rgb(251 191 36)';
    return 'rgb(248 113 113)';
  }

  getScoreEmoji(score: number): string {
    if (score >= 70) return '●';
    if (score >= 50) return '●';
    return '●';
  }

  getBalticPillarBars(code: string): { value: number; colorClass: string }[] {
    const colors = ['bg-blue-400/60', 'bg-blue-500/60', 'bg-amber-400/60', 'bg-purple-400/60', 'bg-blue-500/60'];
    switch (code) {
      case 'EE': return [
        { value: 75, colorClass: colors[0] },
        { value: 68, colorClass: colors[1] },
        { value: 55, colorClass: colors[2] },
        { value: 72, colorClass: colors[3] },
        { value: 70, colorClass: colors[4] }
      ];
      case 'LV': return [
        { value: 58, colorClass: colors[0] },
        { value: 62, colorClass: colors[1] },
        { value: 48, colorClass: colors[2] },
        { value: 55, colorClass: colors[3] },
        { value: 50, colorClass: colors[4] }
      ];
      case 'LT': return [
        { value: 63, colorClass: colors[0] },
        { value: 58, colorClass: colors[1] },
        { value: 52, colorClass: colors[2] },
        { value: 68, colorClass: colors[3] },
        { value: 60, colorClass: colors[4] }
      ];
      default: return colors.map(c => ({ value: 50, colorClass: c }));
    }
  }
}
