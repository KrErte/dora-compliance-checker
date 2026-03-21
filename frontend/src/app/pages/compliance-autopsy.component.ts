import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';
import { ApiService } from '../api.service';
import { SubscriptionService } from '../services/subscription.service';

@Component({
  selector: 'app-compliance-autopsy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [`
    @keyframes severityPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    .severity-pulse {
      animation: severityPulse 2s ease-in-out infinite;
    }
    @keyframes flatline {
      0% { width: 0; }
      100% { width: 100%; }
    }
    .flatline-anim {
      animation: flatline 1.5s ease-out forwards;
    }
    .section-collapse {
      overflow: hidden;
      transition: max-height 0.4s ease, opacity 0.3s ease;
    }
    .section-open {
      max-height: 3000px;
      opacity: 1;
    }
    .section-closed {
      max-height: 0;
      opacity: 0;
    }
    .prescription-pad {
      background: repeating-linear-gradient(
        transparent,
        transparent 27px,
        rgba(148, 163, 184, 0.08) 27px,
        rgba(148, 163, 184, 0.08) 28px
      );
    }
    .medical-font {
      font-family: 'Courier New', Courier, monospace;
      letter-spacing: 0.02em;
    }
    .organ-card:hover {
      transform: translateY(-2px);
      transition: transform 0.2s ease;
    }
    .timeline-dot::before {
      content: '';
      position: absolute;
      top: 50%;
      left: -16px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: currentColor;
      transform: translateY(-50%);
    }
  `],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-700">
      <!-- Header -->
      <div class="bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-b border-red-900/30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div class="flex items-center gap-4 mb-2">
            <div class="w-12 h-12 rounded-lg bg-red-900/30 border border-red-800/40 flex items-center justify-center">
              <svg class="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
              </svg>
            </div>
            <div>
              <h1 class="text-3xl font-bold text-white tracking-tight">
                {{ lang.lang() === 'et' ? 'Vastavuse Lahkamine' : 'Compliance Autopsy' }}
              </h1>
              <p class="text-slate-400 text-sm mt-1">
                {{ lang.lang() === 'et'
                  ? 'Kohtumeditsiiniline vahend, mis jälitab vastavuse tõrkeid nende algpõhjusteni'
                  : 'Forensic post-mortem tool that traces compliance failures to root causes' }}
              </p>
            </div>
          </div>

          <!-- Tab Bar -->
          <div class="flex gap-1 mt-6">
            <button (click)="activeTab.set('events')"
              [class]="activeTab() === 'events'
                ? 'px-5 py-2.5 rounded-t-lg text-sm font-medium bg-slate-800 text-red-400 border border-b-0 border-red-900/40'
                : 'px-5 py-2.5 rounded-t-lg text-sm font-medium text-slate-400 hover:text-slate-600 border border-b-0 border-transparent hover:border-slate-200'">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                {{ lang.lang() === 'et' ? 'Juhtumid' : 'Cases' }} ({{ events().length }})
              </span>
            </button>
            <button (click)="activeTab.set('report')"
              [class]="activeTab() === 'report'
                ? 'px-5 py-2.5 rounded-t-lg text-sm font-medium bg-slate-800 text-red-400 border border-b-0 border-red-900/40'
                : 'px-5 py-2.5 rounded-t-lg text-sm font-medium text-slate-400 hover:text-slate-600 border border-b-0 border-transparent hover:border-slate-200'"
              [disabled]="!report()">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                {{ lang.lang() === 'et' ? 'Lahkamisaruanne' : 'Autopsy Report' }}
              </span>
            </button>
            <button (click)="activeTab.set('history')"
              [class]="activeTab() === 'history'
                ? 'px-5 py-2.5 rounded-t-lg text-sm font-medium bg-slate-800 text-red-400 border border-b-0 border-red-900/40'
                : 'px-5 py-2.5 rounded-t-lg text-sm font-medium text-slate-400 hover:text-slate-600 border border-b-0 border-transparent hover:border-slate-200'">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {{ lang.lang() === 'et' ? 'Ajalugu' : 'History' }} ({{ history().length }})
              </span>
            </button>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        <!-- Loading -->
        @if (loading()) {
          <div class="flex flex-col items-center justify-center py-24 gap-4">
            <div class="w-16 h-16 rounded-full border-2 border-red-900/40 border-t-red-500 animate-spin"></div>
            <p class="text-slate-500 medical-font text-sm">
              {{ lang.lang() === 'et' ? 'Juhtumite laadimine...' : 'Loading case files...' }}
            </p>
          </div>
        }

        <!-- Performing Autopsy Overlay -->
        @if (performing()) {
          <div class="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center">
            <div class="text-center max-w-md">
              <div class="w-24 h-24 mx-auto mb-6 rounded-full border-2 border-red-800/60 bg-red-900/20 flex items-center justify-center">
                <svg class="w-12 h-12 text-red-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-red-400 medical-font mb-2">
                {{ lang.lang() === 'et' ? 'LAHKAMINE KÄIMAS' : 'AUTOPSY IN PROGRESS' }}
              </h3>
              <p class="text-slate-400 text-sm">
                {{ lang.lang() === 'et'
                  ? 'Analüüsitakse vastavuse tõrke algpõhjuseid...'
                  : 'Analyzing root causes of compliance failure...' }}
              </p>
              <div class="mt-6 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-red-600 rounded-full flatline-anim"></div>
              </div>
            </div>
          </div>
        }

        <!-- ============ TAB: EVENTS ============ -->
        @if (!loading() && activeTab() === 'events') {
          <div>
            @if (events().length === 0) {
              <div class="text-center py-20">
                <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                  <svg class="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 class="text-lg font-semibold text-slate-400 mb-1">
                  {{ lang.lang() === 'et' ? 'Kriitilisi juhtumeid ei leitud' : 'No Critical Cases Found' }}
                </h3>
                <p class="text-slate-500 text-sm max-w-md mx-auto">
                  {{ lang.lang() === 'et'
                    ? 'Vastavuse tõrkeid ei tuvastatud. Jätkake jälgimist.'
                    : 'No compliance failure events detected. Continue monitoring.' }}
                </p>
              </div>
            } @else {
              <div class="mb-6">
                <h2 class="text-lg font-semibold text-slate-600 medical-font">
                  {{ lang.lang() === 'et' ? 'JUHTUMID LAHKAMISEKS' : 'CASES AWAITING AUTOPSY' }}
                </h2>
                <p class="text-slate-500 text-sm mt-1">
                  {{ lang.lang() === 'et'
                    ? 'Valige juhtum kohtumeditsiiniliseks analüüsiks'
                    : 'Select a case for forensic compliance analysis' }}
                </p>
              </div>
              <div class="grid gap-4">
                @for (event of events(); track event.id) {
                  <div class="bg-white border rounded-lg overflow-hidden hover:bg-white transition-colors"
                    [class]="getSeverityBorderClass(event.severity)">
                    <div class="p-5">
                      <div class="flex items-start justify-between gap-4">
                        <div class="flex items-start gap-4 flex-1">
                          <!-- Type Icon -->
                          <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                            [class]="getSeverityBgClass(event.severity)">
                            <span [innerHTML]="getEventTypeIcon(event.type)"></span>
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-3 mb-1 flex-wrap">
                              <span class="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                                {{ lang.lang() === 'et' ? 'JUHTUM' : 'CASE' }} #{{ event.id?.substring(0, 8) }}
                              </span>
                              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                [class]="getSeverityBadgeClass(event.severity)">
                                {{ event.severity }}
                              </span>
                              <span class="text-[10px] text-slate-500 px-2 py-0.5 rounded-full bg-slate-700/50">
                                {{ getEventTypeLabel(event.type) }}
                              </span>
                            </div>
                            <h3 class="text-base font-semibold text-white mb-1">
                              {{ lang.lang() === 'et' ? (event.titleEt || event.title) : event.title }}
                            </h3>
                            <p class="text-sm text-slate-400 line-clamp-2 mb-2">
                              {{ lang.lang() === 'et' ? (event.descriptionEt || event.description) : event.description }}
                            </p>
                            <div class="flex items-center gap-4 text-xs text-slate-500">
                              <span class="flex items-center gap-1">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                                {{ event.date | date:'dd MMM yyyy' }}
                              </span>
                              @if (event.score != null) {
                                <span class="flex items-center gap-1">
                                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                                  </svg>
                                  {{ lang.lang() === 'et' ? 'Skoor' : 'Score' }}: {{ event.score }}%
                                </span>
                              }
                            </div>
                          </div>
                        </div>
                        <div class="shrink-0">
                          @if (sub.isPremium()) {
                            <button (click)="performAutopsy(event.id)"
                              class="px-4 py-2 bg-red-900/40 border border-red-800/50 text-red-300 text-sm font-medium rounded-lg hover:bg-red-900/60 transition-colors flex items-center gap-2">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
                              </svg>
                              {{ lang.lang() === 'et' ? 'Lahka' : 'Perform Autopsy' }}
                            </button>
                          } @else {
                            <a routerLink="/pricing"
                              class="px-4 py-2 bg-amber-900/30 border border-amber-800/40 text-amber-300 text-sm font-medium rounded-lg hover:bg-amber-900/50 transition-colors flex items-center gap-2">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                              </svg>
                              {{ lang.lang() === 'et' ? 'Uuenda plaani' : 'Upgrade Plan' }}
                            </a>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- ============ TAB: REPORT ============ -->
        @if (!loading() && activeTab() === 'report' && report()) {
          <div class="space-y-6">

            <!-- ---- Report Header ---- -->
            <div class="bg-white border border-red-900/30 rounded-xl p-6 relative overflow-hidden">
              <div class="absolute top-0 right-0 w-64 h-64 bg-red-900/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div class="relative">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-[10px] font-mono text-red-500/70 tracking-[0.3em] uppercase">
                    {{ lang.lang() === 'et' ? 'AMETLIK DOKUMENT' : 'OFFICIAL DOCUMENT' }}
                  </span>
                </div>
                <h2 class="text-2xl font-bold text-white medical-font tracking-wide mb-4">
                  {{ lang.lang() === 'et' ? 'LAHKAMISARUANNE' : 'AUTOPSY REPORT' }}
                </h2>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div>
                    <span class="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                      {{ lang.lang() === 'et' ? 'Aruande ID' : 'Report ID' }}
                    </span>
                    <span class="text-sm font-mono text-slate-600">{{ report().id?.substring(0, 12) }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                      {{ lang.lang() === 'et' ? 'Koostatud' : 'Performed' }}
                    </span>
                    <span class="text-sm text-slate-600">{{ report().performedAt | date:'dd MMM yyyy, HH:mm' }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                      {{ lang.lang() === 'et' ? 'Juhtumi ID' : 'Case ID' }}
                    </span>
                    <span class="text-sm font-mono text-slate-600">{{ report().failureEventId?.substring(0, 12) }}</span>
                  </div>
                </div>

                <!-- Verdict Badge & Score -->
                <div class="flex items-center gap-6 flex-wrap">
                  <div class="flex items-center gap-3">
                    <span class="text-[10px] text-slate-500 uppercase tracking-wider">
                      {{ lang.lang() === 'et' ? 'Otsus' : 'Verdict' }}
                    </span>
                    <span class="px-4 py-1.5 rounded-full text-sm font-bold tracking-wide"
                      [class]="getVerdictClass(report().verdict)">
                      {{ lang.lang() === 'et' ? (report().verdictEt || report().verdict) : report().verdict?.replace('_', ' ') }}
                    </span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-[10px] text-slate-500 uppercase tracking-wider">
                      {{ lang.lang() === 'et' ? 'Uldskoor' : 'Overall Score' }}
                    </span>
                    <div class="flex items-center gap-2">
                      <div class="w-32 h-3 bg-slate-800 rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-700"
                          [style.width.%]="report().overallScore"
                          [style.background]="getScoreColor(report().overallScore)">
                        </div>
                      </div>
                      <span class="text-lg font-bold" [style.color]="getScoreColor(report().overallScore)">
                        {{ report().overallScore }}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ---- 1. Cause of Death ---- -->
            <div class="bg-slate-900/60 border-l-4 border-red-600 rounded-r-xl overflow-hidden">
              <button (click)="toggleSection('causeOfDeath')"
                class="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                  </svg>
                  <h3 class="text-base font-bold text-red-400 medical-font tracking-wide uppercase">
                    {{ lang.lang() === 'et' ? 'SURMA POHJUS' : 'CAUSE OF DEATH' }}
                  </h3>
                </div>
                <svg class="w-5 h-5 text-slate-500 transition-transform" [class.rotate-180]="expandedSections().has('causeOfDeath')"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              <div class="section-collapse" [class.section-open]="expandedSections().has('causeOfDeath')" [class.section-closed]="!expandedSections().has('causeOfDeath')">
                @if (report().causeOfDeath) {
                  <div class="px-6 pb-6 space-y-4">
                    <div class="bg-red-950/30 border border-red-900/30 rounded-lg p-4">
                      <p class="text-base text-red-200 font-medium leading-relaxed">
                        {{ lang.lang() === 'et'
                          ? (report().causeOfDeath.primaryGapEt || report().causeOfDeath.primaryGap)
                          : report().causeOfDeath.primaryGap }}
                      </p>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <!-- Severity Meter -->
                      <div class="bg-white rounded-lg p-3">
                        <span class="text-[10px] text-slate-500 uppercase tracking-wider block mb-2">
                          {{ lang.lang() === 'et' ? 'Raskusaste' : 'Severity' }}
                        </span>
                        <div class="flex items-center gap-2">
                          <div class="flex-1 h-2.5 bg-slate-700 rounded-full overflow-hidden">
                            <div class="h-full rounded-full severity-pulse"
                              [style.width]="getSeverityWidth(report().causeOfDeath.severity)"
                              [style.background]="getSeverityBarColor(report().causeOfDeath.severity)">
                            </div>
                          </div>
                          <span class="text-xs font-bold" [style.color]="getSeverityBarColor(report().causeOfDeath.severity)">
                            {{ report().causeOfDeath.severity }}
                          </span>
                        </div>
                      </div>
                      <!-- Duration -->
                      <div class="bg-white rounded-lg p-3">
                        <span class="text-[10px] text-slate-500 uppercase tracking-wider block mb-2">
                          {{ lang.lang() === 'et' ? 'Kestus' : 'Duration' }}
                        </span>
                        <span class="text-lg font-bold text-red-400">
                          {{ report().causeOfDeath.durationDays }}
                          <span class="text-xs text-slate-400 font-normal">
                            {{ lang.lang() === 'et' ? 'paeva' : 'days' }}
                          </span>
                        </span>
                      </div>
                      <!-- Article -->
                      <div class="bg-white rounded-lg p-3">
                        <span class="text-[10px] text-slate-500 uppercase tracking-wider block mb-2">
                          {{ lang.lang() === 'et' ? 'Artikli viide' : 'Article Reference' }}
                        </span>
                        <span class="text-sm font-mono text-amber-400">
                          {{ report().causeOfDeath.articleRef }}
                        </span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- ---- 2. Contributing Factors ---- -->
            <div class="bg-slate-900/60 border border-slate-800/60 rounded-xl overflow-hidden">
              <button (click)="toggleSection('contributingFactors')"
                class="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                  </svg>
                  <h3 class="text-base font-bold text-amber-400 medical-font tracking-wide uppercase">
                    {{ lang.lang() === 'et' ? 'KAASNEVAD TEGURID' : 'CONTRIBUTING FACTORS' }}
                  </h3>
                  @if (report().contributingFactors?.length) {
                    <span class="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                      {{ report().contributingFactors.length }}
                    </span>
                  }
                </div>
                <svg class="w-5 h-5 text-slate-500 transition-transform" [class.rotate-180]="expandedSections().has('contributingFactors')"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              <div class="section-collapse" [class.section-open]="expandedSections().has('contributingFactors')" [class.section-closed]="!expandedSections().has('contributingFactors')">
                @if (report().contributingFactors?.length) {
                  <div class="px-6 pb-6 space-y-3">
                    @for (factor of report().contributingFactors; track $index) {
                      <div class="flex items-start gap-4 bg-white rounded-lg p-4 border border-slate-200">
                        <span class="text-lg font-bold text-slate-600 font-mono shrink-0 w-8 text-center">
                          {{ $index + 1 }}
                        </span>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2 mb-1 flex-wrap">
                            <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                              [class]="getImpactBadgeClass(factor.impact)">
                              {{ factor.impact }}
                            </span>
                            @if (factor.type) {
                              <span class="text-[10px] text-slate-500 px-2 py-0.5 rounded bg-slate-700/50">
                                {{ factor.type }}
                              </span>
                            }
                          </div>
                          <p class="text-sm text-slate-600 leading-relaxed">
                            {{ lang.lang() === 'et' ? (factor.factorEt || factor.factor) : factor.factor }}
                          </p>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            <!-- ---- 3. Timeline ("Time of Death") ---- -->
            <div class="bg-slate-900/60 border border-slate-800/60 rounded-xl overflow-hidden">
              <button (click)="toggleSection('timeline')"
                class="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <h3 class="text-base font-bold text-blue-400 medical-font tracking-wide uppercase">
                    {{ lang.lang() === 'et' ? 'SURMAHETK - AJAJOON' : 'TIME OF DEATH - TIMELINE' }}
                  </h3>
                </div>
                <svg class="w-5 h-5 text-slate-500 transition-transform" [class.rotate-180]="expandedSections().has('timeline')"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              <div class="section-collapse" [class.section-open]="expandedSections().has('timeline')" [class.section-closed]="!expandedSections().has('timeline')">
                @if (report().timeline?.length) {
                  <div class="px-6 pb-6">
                    <!-- Score trajectory -->
                    @if (hasTimelineScores()) {
                      <div class="mb-6 bg-white rounded-lg p-4 border border-slate-200">
                        <span class="text-[10px] text-slate-500 uppercase tracking-wider block mb-3">
                          {{ lang.lang() === 'et' ? 'Skoori trajektoor' : 'Score Trajectory' }}
                        </span>
                        <div class="flex items-end gap-1 h-20">
                          @for (point of report().timeline; track $index) {
                            @if (point.score != null) {
                              <div class="flex-1 flex flex-col items-center gap-1">
                                <span class="text-[9px] text-slate-500">{{ point.score }}%</span>
                                <div class="w-full rounded-t transition-all"
                                  [style.height.%]="point.score"
                                  [style.background]="getScoreColor(point.score)"
                                  [style.opacity]="0.7">
                                </div>
                              </div>
                            }
                          }
                        </div>
                      </div>
                    }
                    <!-- Timeline entries -->
                    <div class="relative pl-8 space-y-4">
                      <div class="absolute left-3 top-2 bottom-2 w-px bg-slate-700/60"></div>
                      @for (entry of report().timeline; track $index; let isFirst = $first; let isLast = $last) {
                        <div class="relative">
                          <div class="absolute left-[-25px] top-1 w-3 h-3 rounded-full border-2 z-10"
                            [class]="getTimelineTypeDotClass(entry.type)">
                          </div>
                          <div class="bg-white rounded-lg p-3 border border-slate-200 ml-2">
                            <div class="flex items-center justify-between gap-2 mb-1">
                              <span class="text-xs text-slate-500 font-mono">{{ entry.date | date:'dd MMM yyyy' }}</span>
                              @if (entry.score != null) {
                                <span class="text-xs font-bold" [style.color]="getScoreColor(entry.score)">
                                  {{ entry.score }}%
                                </span>
                              }
                            </div>
                            <p class="text-sm text-slate-600">{{ entry.event }}</p>
                            @if (entry.type === 'INFLECTION') {
                              <p class="text-[10px] text-blue-600/80 mt-1 italic">
                                {{ lang.lang() === 'et'
                                  ? '&#8618; Kui siin oleks ravitud, oleks ellujäämine olnud voimalik'
                                  : '&#8618; If treated here, survival was possible' }}
                              </p>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- ---- 4. Toxicology Report ---- -->
            <div class="bg-slate-900/60 border border-slate-800/60 rounded-xl overflow-hidden">
              <button (click)="toggleSection('toxicology')"
                class="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                  </svg>
                  <h3 class="text-base font-bold text-purple-400 medical-font tracking-wide uppercase">
                    {{ lang.lang() === 'et' ? 'TOKSIKOLOOGIA ARUANNE' : 'TOXICOLOGY REPORT' }}
                  </h3>
                </div>
                <svg class="w-5 h-5 text-slate-500 transition-transform" [class.rotate-180]="expandedSections().has('toxicology')"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              <div class="section-collapse" [class.section-open]="expandedSections().has('toxicology')" [class.section-closed]="!expandedSections().has('toxicology')">
                @if (report().toxicology?.length) {
                  <div class="px-6 pb-6">
                    <div class="flex flex-wrap gap-3">
                      @for (tox of report().toxicology; track $index) {
                        <div class="bg-amber-900/20 border border-amber-700/30 rounded-full px-4 py-2.5 flex items-center gap-3 max-w-sm">
                          <div class="shrink-0 w-2 h-2 rounded-full" [class]="getToxTypeClass(tox.type)"></div>
                          <div class="min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                              <span class="text-sm font-medium text-amber-200 truncate">{{ tox.factor }}</span>
                              <span class="text-[9px] px-1.5 py-0.5 rounded bg-amber-800/40 text-amber-400 uppercase">
                                {{ tox.type }}
                              </span>
                            </div>
                            <p class="text-[10px] text-slate-400 truncate">{{ tox.impact }}</p>
                            @if (tox.date) {
                              <span class="text-[9px] text-slate-500">{{ tox.date | date:'dd MMM yyyy' }}</span>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                } @else {
                  <div class="px-6 pb-6">
                    <p class="text-sm text-slate-500 italic">
                      {{ lang.lang() === 'et' ? 'Valistegureid ei tuvastatud.' : 'No external toxic factors identified.' }}
                    </p>
                  </div>
                }
              </div>
            </div>

            <!-- ---- 5. Organ Analysis (5 DORA Pillars) ---- -->
            <div class="bg-slate-900/60 border border-slate-800/60 rounded-xl overflow-hidden">
              <button (click)="toggleSection('organAnalysis')"
                class="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                  <h3 class="text-base font-bold text-blue-600 medical-font tracking-wide uppercase">
                    {{ lang.lang() === 'et' ? 'ELUNDIANALUUS' : 'ORGAN ANALYSIS' }}
                  </h3>
                </div>
                <svg class="w-5 h-5 text-slate-500 transition-transform" [class.rotate-180]="expandedSections().has('organAnalysis')"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              <div class="section-collapse" [class.section-open]="expandedSections().has('organAnalysis')" [class.section-closed]="!expandedSections().has('organAnalysis')">
                @if (report().organAnalysis?.length) {
                  <div class="px-6 pb-6">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      @for (organ of report().organAnalysis; track organ.pillar) {
                        <div class="organ-card bg-white rounded-xl p-4 border transition-colors relative overflow-hidden"
                          [style.border-color]="getConditionColor(organ.condition) + '40'">
                          <!-- Condition gradient bg -->
                          <div class="absolute inset-0 opacity-5"
                            [style.background]="'linear-gradient(135deg, ' + getConditionColor(organ.condition) + ', transparent)'">
                          </div>
                          <div class="relative">
                            <div class="flex items-center justify-between mb-3">
                              <span class="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                                {{ lang.lang() === 'et' ? 'SAMMAS' : 'PILLAR' }} {{ organ.pillar }}
                              </span>
                              <span class="text-xl font-bold" [style.color]="getConditionColor(organ.condition)">
                                {{ organ.score }}
                              </span>
                            </div>
                            <h4 class="text-sm font-semibold text-slate-700 mb-2 leading-tight">
                              {{ lang.lang() === 'et' ? (organ.nameEt || organ.name) : organ.name }}
                            </h4>
                            <span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-3"
                              [style.background]="getConditionColor(organ.condition) + '20'"
                              [style.color]="getConditionColor(organ.condition)">
                              {{ organ.condition }}
                            </span>
                            @if (organ.findings?.length) {
                              <ul class="space-y-1">
                                @for (finding of organ.findings; track $index) {
                                  <li class="text-[10px] text-slate-400 flex items-start gap-1.5">
                                    <span class="shrink-0 mt-1 w-1 h-1 rounded-full bg-slate-600"></span>
                                    {{ finding }}
                                  </li>
                                }
                              </ul>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- ---- 6. Prevention Rx (Recommendations) ---- -->
            <div class="bg-slate-900/60 border border-slate-800/60 rounded-xl overflow-hidden">
              <button (click)="toggleSection('recommendations')"
                class="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div class="flex items-center gap-3">
                  <span class="text-xl font-bold text-blue-500 medical-font">Rx</span>
                  <h3 class="text-base font-bold text-blue-500 medical-font tracking-wide uppercase">
                    {{ lang.lang() === 'et' ? 'ENNETAV RETSEPT' : 'PREVENTION Rx' }}
                  </h3>
                </div>
                <svg class="w-5 h-5 text-slate-500 transition-transform" [class.rotate-180]="expandedSections().has('recommendations')"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              <div class="section-collapse" [class.section-open]="expandedSections().has('recommendations')" [class.section-closed]="!expandedSections().has('recommendations')">
                @if (report().recommendations?.length) {
                  <div class="px-6 pb-6 prescription-pad">
                    <div class="space-y-4">
                      @for (rx of report().recommendations; track $index) {
                        <div class="bg-white border border-dashed border-slate-200 rounded-lg p-4">
                          <div class="flex items-start justify-between gap-4">
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center gap-2 mb-2 flex-wrap">
                                <span class="text-lg font-bold text-blue-500/60 medical-font">Rx{{ $index + 1 }}</span>
                                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                  [class]="getPriorityBadgeClass(rx.priority)">
                                  {{ rx.priority }}
                                </span>
                              </div>
                              <p class="text-sm text-slate-700 leading-relaxed mb-3">
                                {{ lang.lang() === 'et' ? (rx.actionEt || rx.action) : rx.action }}
                              </p>
                              <div class="flex items-center gap-4 flex-wrap">
                                <span class="text-xs text-slate-400 flex items-center gap-1">
                                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                  </svg>
                                  {{ lang.lang() === 'et' ? 'Panus' : 'Effort' }}: {{ rx.effortDays }}
                                  {{ lang.lang() === 'et' ? 'paeva' : 'days' }}
                                </span>
                                <span class="text-xs text-blue-600 flex items-center gap-1">
                                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                                  </svg>
                                  {{ lang.lang() === 'et' ? 'Oodatav moju' : 'Expected Impact' }}: +{{ rx.estimatedScoreImpact }}
                                  {{ lang.lang() === 'et' ? 'punkti' : 'pts' }}
                                </span>
                              </div>
                            </div>
                            <a [routerLink]="['/remediation']" [queryParams]="{ action: rx.action, priority: rx.priority, effort: rx.effortDays }"
                              class="shrink-0 px-3 py-1.5 bg-blue-50 border border-blue-800/40 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors">
                              {{ lang.lang() === 'et' ? 'Loo parandus' : 'Create Remediation' }}
                            </a>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- ---- 7. Evidence Chain (Lab Results) ---- -->
            <div class="bg-slate-900/60 border border-slate-800/60 rounded-xl overflow-hidden">
              <button (click)="toggleSection('evidenceChain')"
                class="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                  </svg>
                  <h3 class="text-base font-bold text-slate-600 medical-font tracking-wide uppercase">
                    {{ lang.lang() === 'et' ? 'TOENDITE AHEL - LABORI TULEMUSED' : 'EVIDENCE CHAIN - LAB RESULTS' }}
                  </h3>
                </div>
                <svg class="w-5 h-5 text-slate-500 transition-transform" [class.rotate-180]="expandedSections().has('evidenceChain')"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              <div class="section-collapse" [class.section-open]="expandedSections().has('evidenceChain')" [class.section-closed]="!expandedSections().has('evidenceChain')">
                @if (report().evidenceChain?.length) {
                  <div class="px-6 pb-6">
                    <div class="bg-slate-800/30 rounded-lg border border-slate-200 overflow-hidden">
                      <!-- Table Header -->
                      <div class="grid grid-cols-12 gap-2 px-4 py-3 bg-white border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                        <div class="col-span-2">{{ lang.lang() === 'et' ? 'Sammas' : 'Pillar' }}</div>
                        <div class="col-span-3">{{ lang.lang() === 'et' ? 'Nimi' : 'Name' }}</div>
                        <div class="col-span-3">{{ lang.lang() === 'et' ? 'Artiklid' : 'Articles' }}</div>
                        <div class="col-span-2 text-center">{{ lang.lang() === 'et' ? 'Toendeid' : 'Evidence' }}</div>
                        <div class="col-span-2 text-center">{{ lang.lang() === 'et' ? 'Staatus' : 'Status' }}</div>
                      </div>
                      @for (chain of report().evidenceChain; track $index) {
                        <div class="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-800/40 items-center hover:bg-slate-800/20">
                          <div class="col-span-2">
                            <span class="text-xs font-mono text-slate-400">{{ chain.pillar }}</span>
                          </div>
                          <div class="col-span-3">
                            <span class="text-xs text-slate-600">{{ chain.name }}</span>
                          </div>
                          <div class="col-span-3">
                            <div class="flex flex-wrap gap-1">
                              @for (article of chain.articles; track article) {
                                <span class="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400 font-mono">
                                  {{ article }}
                                </span>
                              }
                            </div>
                          </div>
                          <div class="col-span-2 text-center">
                            <span class="text-sm font-bold text-slate-600">{{ chain.evidenceCount }}</span>
                          </div>
                          <div class="col-span-2 text-center">
                            <span class="text-[10px] font-bold px-2 py-1 rounded-full"
                              [class]="getEvidenceStatusClass(chain.status)">
                              {{ chain.status }}
                            </span>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

          </div>
        }

        <!-- No report selected -->
        @if (!loading() && activeTab() === 'report' && !report()) {
          <div class="text-center py-20">
            <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-white border border-slate-200 flex items-center justify-center">
              <svg class="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-slate-400 mb-1">
              {{ lang.lang() === 'et' ? 'Aruannet pole valitud' : 'No Report Selected' }}
            </h3>
            <p class="text-slate-500 text-sm max-w-md mx-auto">
              {{ lang.lang() === 'et'
                ? 'Valige juhtum lahkamiseks voi vaadake varasemat aruannet ajaloost.'
                : 'Select a case to perform autopsy or view a past report from history.' }}
            </p>
          </div>
        }

        <!-- ============ TAB: HISTORY ============ -->
        @if (!loading() && activeTab() === 'history') {
          <div>
            @if (history().length === 0) {
              <div class="text-center py-20">
                <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                  <svg class="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 class="text-lg font-semibold text-slate-400 mb-1">
                  {{ lang.lang() === 'et' ? 'Lahkamiste ajalugu puudub' : 'No Autopsy History' }}
                </h3>
                <p class="text-slate-500 text-sm">
                  {{ lang.lang() === 'et'
                    ? 'Siit leiate kõik varasemad lahkamisaruanded.'
                    : 'Past autopsy reports will appear here.' }}
                </p>
              </div>
            } @else {
              <div class="mb-6">
                <h2 class="text-lg font-semibold text-slate-600 medical-font">
                  {{ lang.lang() === 'et' ? 'LAHKAMISTE ARHIIV' : 'AUTOPSY ARCHIVE' }}
                </h2>
              </div>
              <div class="space-y-3">
                @for (entry of history(); track entry.id) {
                  <button (click)="loadReport(entry.id)"
                    class="w-full text-left bg-white border border-slate-200 rounded-lg p-5 hover:bg-slate-800/90 hover:border-slate-200 transition-colors group">
                    <div class="flex items-center justify-between gap-4 flex-wrap">
                      <div class="flex items-center gap-4 flex-1 min-w-0">
                        <div class="w-10 h-10 rounded-lg bg-slate-700/50 border border-slate-600/30 flex items-center justify-center shrink-0">
                          <svg class="w-5 h-5 text-slate-400 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                          </svg>
                        </div>
                        <div class="min-w-0">
                          <div class="flex items-center gap-2 mb-1 flex-wrap">
                            <span class="text-sm font-mono text-slate-400">
                              {{ entry.performedAt | date:'dd MMM yyyy, HH:mm' }}
                            </span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              [class]="getVerdictClass(entry.verdict)">
                              {{ entry.verdict?.replace('_', ' ') }}
                            </span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              [class]="getSeverityBadgeClass(entry.severity)">
                              {{ entry.severity }}
                            </span>
                          </div>
                          <p class="text-sm text-slate-600 truncate">
                            {{ entry.causeOfDeath }}
                          </p>
                        </div>
                      </div>
                      <div class="flex items-center gap-4 shrink-0">
                        <div class="text-right">
                          <span class="text-[10px] text-slate-500 uppercase tracking-wider block">
                            {{ lang.lang() === 'et' ? 'Skoor' : 'Score' }}
                          </span>
                          <span class="text-lg font-bold" [style.color]="getScoreColor(entry.overallScore)">
                            {{ entry.overallScore }}%
                          </span>
                        </div>
                        <svg class="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </div>
                  </button>
                }
              </div>
            }
          </div>
        }

      </div>
    </div>
  `
})
export class ComplianceAutopsyComponent implements OnInit {
  lang = inject(LangService);
  api = inject(ApiService);
  sub = inject(SubscriptionService);

  events = signal<any[]>([]);
  report = signal<any>(null);
  history = signal<any[]>([]);
  loading = signal(true);
  performing = signal(false);
  activeTab = signal<'events' | 'report' | 'history'>('events');
  expandedSections = signal<Set<string>>(new Set(['causeOfDeath', 'contributingFactors', 'organAnalysis']));

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.api.getAutopsyEvents().subscribe({
      next: (data: any) => {
        this.events.set(data.events || []);
        this.loading.set(false);
      },
      error: () => {
        this.events.set([]);
        this.loading.set(false);
      }
    });
    this.api.getAutopsyHistory().subscribe({
      next: (data: any) => {
        this.history.set(data.reports || []);
      },
      error: () => this.history.set([])
    });
  }

  performAutopsy(failureEventId: string): void {
    this.performing.set(true);
    this.api.performAutopsy(failureEventId).subscribe({
      next: (data: any) => {
        this.report.set(data);
        this.performing.set(false);
        this.activeTab.set('report');
      },
      error: () => this.performing.set(false)
    });
  }

  loadReport(id: string): void {
    this.loading.set(true);
    this.api.getAutopsyReport(id).subscribe({
      next: (data: any) => {
        this.report.set(data);
        this.loading.set(false);
        this.activeTab.set('report');
      },
      error: () => this.loading.set(false)
    });
  }

  toggleSection(section: string): void {
    this.expandedSections.update(set => {
      const newSet = new Set(set);
      if (newSet.has(section)) newSet.delete(section);
      else newSet.add(section);
      return newSet;
    });
  }

  hasTimelineScores(): boolean {
    return this.report()?.timeline?.some((t: any) => t.score != null) ?? false;
  }

  // ─── Condition / Score helpers ──────────────────────────

  getConditionColor(condition: string): string {
    switch (condition) {
      case 'HEALTHY': return '#10b981';
      case 'IMPAIRED': return '#f59e0b';
      case 'CRITICAL': return '#f97316';
      case 'FAILED': return '#ef4444';
      default: return '#64748b';
    }
  }

  getScoreColor(score: number): string {
    if (score >= 75) return '#10b981';
    if (score >= 50) return '#f59e0b';
    if (score >= 25) return '#f97316';
    return '#ef4444';
  }

  // ─── Severity helpers ──────────────────────────────────

  getSeverityBorderClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'border-red-800/40 bg-white';
      case 'HIGH': return 'border-orange-800/40 bg-white';
      case 'MEDIUM': return 'border-amber-800/30 bg-white';
      default: return 'border-slate-200 bg-white';
    }
  }

  getSeverityBgClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-900/40';
      case 'HIGH': return 'bg-orange-900/40';
      case 'MEDIUM': return 'bg-amber-900/40';
      default: return 'bg-slate-700/40';
    }
  }

  getSeverityBadgeClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-900/60 text-red-300 border border-red-800/40';
      case 'HIGH': return 'bg-orange-900/60 text-orange-300 border border-orange-800/40';
      case 'MEDIUM': return 'bg-amber-900/60 text-amber-300 border border-amber-800/40';
      default: return 'bg-slate-700/60 text-slate-600 border border-slate-200';
    }
  }

  getSeverityWidth(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return '100%';
      case 'HIGH': return '75%';
      case 'MEDIUM': return '50%';
      case 'LOW': return '25%';
      default: return '50%';
    }
  }

  getSeverityBarColor(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#64748b';
    }
  }

  // ─── Verdict helpers ───────────────────────────────────

  getVerdictClass(verdict: string): string {
    switch (verdict) {
      case 'SURVIVABLE': return 'bg-blue-950/60 text-blue-500 border border-blue-900/40';
      case 'CRITICAL_CONDITION': return 'bg-amber-900/60 text-amber-300 border border-amber-800/40';
      case 'TERMINAL': return 'bg-red-900/60 text-red-300 border border-red-800/40';
      default: return 'bg-slate-700/60 text-slate-600 border border-slate-200';
    }
  }

  // ─── Impact / Priority helpers ─────────────────────────

  getImpactBadgeClass(impact: string): string {
    switch (impact) {
      case 'HIGH': return 'bg-red-900/60 text-red-300';
      case 'MEDIUM': return 'bg-amber-900/60 text-amber-300';
      case 'LOW': return 'bg-blue-950/60 text-blue-500';
      default: return 'bg-slate-700/60 text-slate-600';
    }
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'CRITICAL':
      case 'URGENT': return 'bg-red-900/60 text-red-300 border border-red-800/40';
      case 'HIGH': return 'bg-orange-900/60 text-orange-300 border border-orange-800/40';
      case 'MEDIUM': return 'bg-amber-900/60 text-amber-300 border border-amber-800/40';
      case 'LOW': return 'bg-slate-700/60 text-slate-600 border border-slate-200';
      default: return 'bg-slate-700/60 text-slate-600 border border-slate-200';
    }
  }

  // ─── Evidence status helper ────────────────────────────

  getEvidenceStatusClass(status: string): string {
    switch (status) {
      case 'ADEQUATE': return 'bg-blue-950/60 text-blue-500';
      case 'PARTIAL': return 'bg-amber-900/60 text-amber-300';
      case 'MISSING': return 'bg-red-900/60 text-red-300';
      default: return 'bg-slate-700/60 text-slate-600';
    }
  }

  // ─── Timeline helpers ──────────────────────────────────

  getTimelineTypeDotClass(type: string): string {
    switch (type) {
      case 'FAILURE': return 'bg-red-500 border-red-400';
      case 'DEGRADATION': return 'bg-orange-500 border-orange-400';
      case 'INFLECTION': return 'bg-blue-600 border-blue-400';
      case 'WARNING': return 'bg-amber-500 border-amber-400';
      case 'INCIDENT': return 'bg-red-600 border-red-500';
      default: return 'bg-slate-500 border-slate-400';
    }
  }

  // ─── Toxicology helpers ────────────────────────────────

  getToxTypeClass(type: string): string {
    switch (type) {
      case 'REGULATORY': return 'bg-red-500';
      case 'VENDOR': return 'bg-orange-500';
      case 'INTERNAL': return 'bg-amber-500';
      case 'MARKET': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  }

  // ─── Event type helpers ────────────────────────────────

  getEventTypeLabel(type: string): string {
    switch (type) {
      case 'LOW_SCORE': return this.lang.lang() === 'et' ? 'Madal skoor' : 'Low Score';
      case 'SCORE_DROP': return this.lang.lang() === 'et' ? 'Skoori langus' : 'Score Drop';
      case 'INCIDENT': return this.lang.lang() === 'et' ? 'Intsident' : 'Incident';
      case 'EXPIRED_EVIDENCE': return this.lang.lang() === 'et' ? 'Aegunud toend' : 'Expired Evidence';
      case 'OVERDUE_REMEDIATION': return this.lang.lang() === 'et' ? 'Hilinenud parandus' : 'Overdue Remediation';
      case 'GENERAL_GAPS': return this.lang.lang() === 'et' ? 'Uldised puudused' : 'General Gaps';
      default: return type;
    }
  }

  getEventTypeIcon(type: string): string {
    switch (type) {
      case 'LOW_SCORE':
        return '<svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>';
      case 'SCORE_DROP':
        return '<svg class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/></svg>';
      case 'INCIDENT':
        return '<svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>';
      case 'EXPIRED_EVIDENCE':
        return '<svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
      case 'OVERDUE_REMEDIATION':
        return '<svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
      case 'GENERAL_GAPS':
        return '<svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>';
      default:
        return '<svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    }
  }
}
