import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LangService } from '../lang.service';
import { SubscriptionService } from '../services/subscription.service';

interface Trigger {
  id: string;
  title: string;
  titleEt: string;
  description: string;
  descriptionEt: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  category: string;
  icon: string;
}

interface CascadeStep {
  stepNumber: number;
  name: string;
  nameEt: string;
  affectedPillar: string;
  impactPercent: number;
  delayDays: number;
  description: string;
  descriptionEt: string;
}

interface RemediationStep {
  priority: number;
  action: string;
  actionEt: string;
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  timelineDays: number;
  article: string;
}

interface SimulationResult {
  triggerId: string;
  triggerName: string;
  triggerNameEt: string;
  scoreBefore: number;
  scoreAfter: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  affectedPillars: string[];
  cascadeSteps: CascadeStep[];
  remediationSteps: RemediationStep[];
  totalDegradation: number;
  estimatedRecoveryDays: number;
}

@Component({
  selector: 'app-chain-reaction',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8">

      <!-- Premium Gate -->
      @if (!subService.isPremium()) {
        <div class="animate-fade-in">
          <div class="text-center py-16">
            <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
              <svg class="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <h1 class="text-3xl font-bold gradient-text mb-3">
              {{ lang.l('Doominoefekti mootor', 'Chain Reaction Engine') }}
            </h1>
            <p class="text-slate-400 max-w-xl mx-auto mb-6">
              {{ lang.l(
                'Simuleeri, mis juhtub kui midagi läheb valesti. Visualiseeri kaskaadmõjusid ja saa tegevuskava riskide maandamiseks.',
                'Simulate what happens when something goes wrong. Visualize cascade impacts and get an action plan to mitigate risks.'
              ) }}
            </p>
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm mb-6">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364A9 9 0 1112 3a9 9 0 017.364 7.636z"/>
              </svg>
              {{ lang.l('Premium funktsioon — uuendage ligipääsuks', 'Premium feature — upgrade to access') }}
            </div>
            <div>
              <a routerLink="/pricing" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold hover:from-red-400 hover:to-orange-400 transition-all shadow-lg shadow-red-500/20">
                {{ lang.l('Vaata plaane', 'View Plans') }}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </a>
            </div>
          </div>
        </div>
      }

      @if (subService.isPremium()) {

        <!-- Hero Section -->
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 via-orange-500/10 to-amber-500/10 border border-red-500/20 p-8 mb-8">
          <div class="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-red-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div class="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-500/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <!-- Animated domino particles -->
          <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <div class="absolute top-8 left-[15%] w-3 h-8 bg-red-500/10 rounded-sm rotate-12 animate-pulse"></div>
            <div class="absolute top-12 left-[25%] w-3 h-8 bg-orange-500/10 rounded-sm rotate-[25deg] animate-pulse" style="animation-delay: 0.2s"></div>
            <div class="absolute top-16 left-[35%] w-3 h-8 bg-amber-500/10 rounded-sm rotate-[40deg] animate-pulse" style="animation-delay: 0.4s"></div>
            <div class="absolute top-20 left-[45%] w-3 h-8 bg-yellow-500/10 rounded-sm rotate-[55deg] animate-pulse" style="animation-delay: 0.6s"></div>
            <div class="absolute top-24 left-[55%] w-3 h-8 bg-red-500/8 rounded-sm rotate-[70deg] animate-pulse" style="animation-delay: 0.8s"></div>
          </div>

          <div class="relative">
            <div class="flex items-center gap-2 mb-3">
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
                {{ lang.l('Kaskaadmootor', 'Cascade Engine') }}
              </span>
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse">
                {{ lang.l('Reaalajas simulatsioon', 'Live Simulation') }}
              </span>
            </div>
            <h1 class="text-3xl font-bold text-white mb-2">
              {{ lang.l('Doominoefekti mootor', 'Chain Reaction Engine') }}
            </h1>
            <p class="text-slate-400 max-w-2xl">
              {{ lang.l(
                'Vali triggeristsenaarium ja vaata reaalajas, kuidas see mõjutab sinu DORA vastavust. Iga domino langedes näed mõju skoorile, sambale ja taastumisajale.',
                'Select a trigger scenario and watch in real-time how it impacts your DORA compliance. As each domino falls, see the effect on your score, pillars, and recovery timeline.'
              ) }}
            </p>
          </div>
        </div>

        <!-- Quick Scenarios -->
        <div class="mb-8">
          <h2 class="text-lg font-semibold text-slate-200 mb-4">
            {{ lang.l('Kiirstsenaariumid', 'Quick Scenarios') }}
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <!-- Worst Case -->
            <button (click)="runQuickScenario('worst-case')" [disabled]="simulating()"
              class="group relative overflow-hidden text-left p-5 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed">
              <div class="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div class="relative">
                <div class="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center mb-3">
                  <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                  </svg>
                </div>
                <h3 class="text-sm font-bold text-red-300 mb-1">{{ lang.l('Halvim stsenaarium', 'Worst Case') }}</h3>
                <p class="text-xs text-slate-500">{{ lang.l('Kriitiline pakkuja langeb ja andmeleke samal ajal', 'Critical provider goes down with simultaneous data breach') }}</p>
              </div>
            </button>

            <!-- Evidence Gap -->
            <button (click)="runQuickScenario('evidence-gap')" [disabled]="simulating()"
              class="group relative overflow-hidden text-left p-5 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed">
              <div class="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div class="relative">
                <div class="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3">
                  <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <h3 class="text-sm font-bold text-amber-300 mb-1">{{ lang.l('Toenduslünk', 'Evidence Gap') }}</h3>
                <p class="text-xs text-slate-500">{{ lang.l('Audit leiab puuduvad poliitikad ja protseduurid', 'Audit discovers missing policies and procedures') }}</p>
              </div>
            </button>

            <!-- Regulatory Storm -->
            <button (click)="runQuickScenario('regulatory-storm')" [disabled]="simulating()"
              class="group relative overflow-hidden text-left p-5 rounded-xl border border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/50 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed">
              <div class="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div class="relative">
                <div class="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center mb-3">
                  <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <h3 class="text-sm font-bold text-violet-300 mb-1">{{ lang.l('Regulatiivne torm', 'Regulatory Storm') }}</h3>
                <p class="text-xs text-slate-500">{{ lang.l('Mitu regulatiivset nõuet jõustub korraga', 'Multiple regulatory requirements hit simultaneously') }}</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Trigger Selector Grid -->
        @if (!simulationResult() && !simulating()) {
          <div class="mb-8">
            <h2 class="text-lg font-semibold text-slate-200 mb-1">
              {{ lang.l('Vali trigger', 'Select Trigger') }}
            </h2>
            <p class="text-sm text-slate-400 mb-5">
              {{ lang.l('Kliki triggeril, et alustada kaskaadsimulatsiooniga', 'Click on a trigger to start the cascade simulation') }}
            </p>

            @if (loadingTriggers()) {
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                @for (i of [1,2,3,4,5,6]; track i) {
                  <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 animate-pulse">
                    <div class="flex items-start gap-3">
                      <div class="w-10 h-10 rounded-lg bg-slate-700/50"></div>
                      <div class="flex-1 space-y-2">
                        <div class="h-4 bg-slate-700/50 rounded w-3/4"></div>
                        <div class="h-3 bg-slate-700/30 rounded w-full"></div>
                        <div class="h-3 bg-slate-700/30 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }

            @if (!loadingTriggers() && triggers().length > 0) {
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                @for (trigger of triggers(); track trigger.id) {
                  <button (click)="runSimulation(trigger.id)" [disabled]="simulating()"
                    class="group text-left relative overflow-hidden rounded-xl border transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    [class]="getTriggerCardClass(trigger.severity)">
                    <div class="p-5">
                      <div class="flex items-start gap-3">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                             [class]="getTriggerIconClass(trigger.severity)">
                          @switch (trigger.icon) {
                            @case ('server') {
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/></svg>
                            }
                            @case ('shield') {
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                            }
                            @case ('users') {
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/></svg>
                            }
                            @case ('lock') {
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                            }
                            @case ('cloud') {
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/></svg>
                            }
                            @case ('document') {
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                            }
                            @default {
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                            }
                          }
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2 mb-1">
                            <h3 class="text-sm font-bold text-slate-200 truncate">
                              {{ lang.l(trigger.titleEt, trigger.title) }}
                            </h3>
                            <span class="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                                  [class]="getSeverityBadgeClass(trigger.severity)">
                              {{ trigger.severity }}
                            </span>
                          </div>
                          <p class="text-xs text-slate-500 line-clamp-2">
                            {{ lang.l(trigger.descriptionEt, trigger.description) }}
                          </p>
                        </div>
                      </div>
                    </div>
                    <!-- Hover glow -->
                    <div class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                         [class]="getTriggerGlowClass(trigger.severity)"></div>
                  </button>
                }
              </div>
            }

            @if (!loadingTriggers() && triggers().length === 0) {
              <div class="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                <div class="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                </div>
                <h3 class="text-lg font-semibold text-white mb-2">
                  {{ lang.l('Triggereid pole veel', 'No Triggers Available Yet') }}
                </h3>
                <p class="text-slate-400 text-sm mb-6">
                  {{ lang.l('Lae esmalt hindamine, et saada personaalseid triggereid', 'Complete an assessment first to get personalized triggers') }}
                </p>
                <a routerLink="/assessment" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium text-sm hover:from-emerald-400 hover:to-cyan-400 transition-all">
                  {{ lang.l('Alusta hindamist', 'Start Assessment') }}
                </a>
              </div>
            }
          </div>
        }

        <!-- Loading / Simulating State -->
        @if (simulating()) {
          <div class="my-12">
            <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-12 text-center">
              <!-- Animated dominoes falling -->
              <div class="flex items-end justify-center gap-3 mb-8 h-20">
                <div class="w-4 h-16 bg-gradient-to-t from-red-500 to-red-400 rounded-sm origin-bottom animate-domino-1"></div>
                <div class="w-4 h-16 bg-gradient-to-t from-orange-500 to-orange-400 rounded-sm origin-bottom animate-domino-2"></div>
                <div class="w-4 h-16 bg-gradient-to-t from-amber-500 to-amber-400 rounded-sm origin-bottom animate-domino-3"></div>
                <div class="w-4 h-16 bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-sm origin-bottom animate-domino-4"></div>
                <div class="w-4 h-16 bg-gradient-to-t from-red-500 to-red-400 rounded-sm origin-bottom animate-domino-5"></div>
                <div class="w-4 h-16 bg-gradient-to-t from-orange-500 to-orange-400 rounded-sm origin-bottom animate-pulse"></div>
                <div class="w-4 h-16 bg-gradient-to-t from-amber-500 to-amber-400 rounded-sm origin-bottom"></div>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">
                {{ lang.l('Simuleerin kaskaadmõjusid...', 'Simulating cascade impacts...') }}
              </h3>
              <p class="text-slate-400 text-sm">
                {{ lang.l('Analüüsime, kuidas trigger levib läbi sinu DORA sambaste', 'Analyzing how the trigger propagates through your DORA pillars') }}
              </p>
              <div class="mt-6 flex justify-center">
                <div class="flex gap-1">
                  <div class="w-2 h-2 rounded-full bg-red-500 animate-bounce" style="animation-delay: 0s"></div>
                  <div class="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style="animation-delay: 0.15s"></div>
                  <div class="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style="animation-delay: 0.3s"></div>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Simulation Result -->
        @if (simulationResult() && !simulating()) {
          <div class="space-y-6 animate-fade-in">

            <!-- Back / Reset button -->
            <div class="flex items-center justify-between">
              <button (click)="resetSimulation()"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                {{ lang.l('Tagasi', 'Back to Triggers') }}
              </button>
              <span class="px-3 py-1.5 rounded-full text-xs font-bold uppercase"
                    [class]="getRiskLevelClass(simulationResult()!.riskLevel)">
                {{ lang.l(getRiskLevelTextEt(simulationResult()!.riskLevel), getRiskLevelTextEn(simulationResult()!.riskLevel)) }}
              </span>
            </div>

            <!-- Trigger Summary Header -->
            <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-5">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <div>
                  <h2 class="text-lg font-bold text-slate-100">
                    {{ lang.l(simulationResult()!.triggerNameEt, simulationResult()!.triggerName) }}
                  </h2>
                  <p class="text-xs text-slate-500">
                    {{ lang.l('Kaskaadsimulatsiooni tulemused', 'Cascade simulation results') }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Before / After Score Comparison -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Before Score -->
              <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 text-center">
                <p class="text-xs text-slate-500 uppercase tracking-wider mb-4">
                  {{ lang.l('Enne', 'Before') }}
                </p>
                <div class="relative w-36 h-36 mx-auto mb-4">
                  <svg class="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" stroke-width="8" class="text-slate-700/50"/>
                    <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" stroke-width="8"
                            class="text-emerald-500 transition-all duration-1000"
                            [attr.stroke-dasharray]="2 * 3.14159 * 52"
                            [attr.stroke-dashoffset]="2 * 3.14159 * 52 * (1 - simulationResult()!.scoreBefore / 100)"
                            stroke-linecap="round"/>
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <span class="text-3xl font-bold text-emerald-400">{{ simulationResult()!.scoreBefore }}%</span>
                  </div>
                </div>
                <p class="text-sm text-slate-400">{{ lang.l('Praegune skoor', 'Current Score') }}</p>
              </div>

              <!-- After Score -->
              <div class="bg-slate-800/50 backdrop-blur border border-red-500/30 rounded-xl p-6 text-center">
                <p class="text-xs text-slate-500 uppercase tracking-wider mb-4">
                  {{ lang.l('Pärast', 'After') }}
                </p>
                <div class="relative w-36 h-36 mx-auto mb-4">
                  <svg class="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" stroke-width="8" class="text-slate-700/50"/>
                    <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" stroke-width="8"
                            class="text-red-500 transition-all duration-1000"
                            [attr.stroke-dasharray]="2 * 3.14159 * 52"
                            [attr.stroke-dashoffset]="2 * 3.14159 * 52 * (1 - simulationResult()!.scoreAfter / 100)"
                            stroke-linecap="round"/>
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <span class="text-3xl font-bold text-red-400">{{ simulationResult()!.scoreAfter }}%</span>
                  </div>
                </div>
                <div class="flex items-center justify-center gap-1 text-sm">
                  <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
                  <span class="text-red-400 font-bold">-{{ simulationResult()!.totalDegradation }}%</span>
                  <span class="text-slate-500">{{ lang.l('langus', 'degradation') }}</span>
                </div>
              </div>
            </div>

            <!-- Impact Summary Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4">
                <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">{{ lang.l('Riskitase', 'Risk Level') }}</p>
                <span class="text-lg font-bold" [class]="getRiskTextColor(simulationResult()!.riskLevel)">
                  {{ simulationResult()!.riskLevel }}
                </span>
              </div>
              <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4">
                <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">{{ lang.l('Mõjutatud sambad', 'Affected Pillars') }}</p>
                <span class="text-lg font-bold text-slate-100">{{ simulationResult()!.affectedPillars.length }}</span>
              </div>
              <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4">
                <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">{{ lang.l('Taastumisaeg', 'Recovery Time') }}</p>
                <span class="text-lg font-bold text-amber-400">{{ simulationResult()!.estimatedRecoveryDays }} {{ lang.l('päeva', 'days') }}</span>
              </div>
            </div>

            <!-- Affected Pillars -->
            <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-5">
              <h3 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
                {{ lang.l('Mõjutatud sambad', 'Affected Pillars') }}
              </h3>
              <div class="flex flex-wrap gap-2">
                @for (pillar of simulationResult()!.affectedPillars; track pillar) {
                  <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 border border-red-500/30 text-red-300">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                    {{ pillar }}
                  </span>
                }
              </div>
            </div>

            <!-- Cascade Visualization Timeline -->
            <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
              <h3 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6">
                {{ lang.l('Kaskaadi ajakava', 'Cascade Timeline') }}
              </h3>

              <div class="relative">
                <!-- Vertical connecting line -->
                <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500/50 via-orange-500/50 to-amber-500/50"></div>

                <div class="space-y-0">
                  @for (step of simulationResult()!.cascadeSteps; track step.stepNumber; let i = $index) {
                    <div class="relative pl-16 pb-8 cascade-step"
                         [style.animation-delay]="(i * 300) + 'ms'">

                      <!-- Node circle on the line -->
                      <div class="absolute left-3.5 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center cascade-node"
                           [class]="getStepNodeClass(step.impactPercent)"
                           [style.animation-delay]="(i * 300) + 'ms'">
                        <div class="w-2 h-2 rounded-full" [class]="getStepDotClass(step.impactPercent)"></div>
                      </div>

                      <!-- Pulse ring animation -->
                      <div class="absolute left-3.5 top-1 w-5 h-5 rounded-full cascade-pulse"
                           [class]="getStepPulseClass(step.impactPercent)"
                           [style.animation-delay]="(i * 300 + 150) + 'ms'"></div>

                      <!-- Step content -->
                      <div class="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4 hover:border-slate-600/50 transition-colors">
                        <div class="flex items-start justify-between gap-4 mb-2">
                          <div class="flex items-center gap-2">
                            <span class="w-6 h-6 rounded-full bg-slate-700/50 flex items-center justify-center text-[10px] font-bold text-slate-400">
                              {{ step.stepNumber }}
                            </span>
                            <h4 class="text-sm font-bold text-slate-200">
                              {{ lang.l(step.nameEt, step.name) }}
                            </h4>
                          </div>
                          <div class="flex items-center gap-2 shrink-0">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold text-red-300 bg-red-500/15 border border-red-500/20">
                              -{{ step.impactPercent }}%
                            </span>
                            <span class="px-2 py-0.5 rounded text-[10px] font-medium text-slate-500 bg-slate-700/30">
                              +{{ step.delayDays }}{{ lang.l('p', 'd') }}
                            </span>
                          </div>
                        </div>
                        <p class="text-xs text-slate-500 mb-2">
                          {{ lang.l(step.descriptionEt, step.description) }}
                        </p>
                        <div class="flex items-center gap-2">
                          <span class="text-[10px] font-medium text-slate-600 uppercase tracking-wider">{{ lang.l('Sammas', 'Pillar') }}:</span>
                          <span class="text-[10px] font-semibold text-orange-300 bg-orange-500/10 px-1.5 py-0.5 rounded">{{ step.affectedPillar }}</span>
                        </div>

                        <!-- Impact bar -->
                        <div class="mt-3 h-1.5 bg-slate-700/30 rounded-full overflow-hidden">
                          <div class="h-full rounded-full transition-all duration-1000 cascade-bar"
                               [class]="getImpactBarClass(step.impactPercent)"
                               [style.width.%]="step.impactPercent"
                               [style.animation-delay]="(i * 300 + 200) + 'ms'">
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                </div>

                <!-- Final impact node -->
                <div class="relative pl-16">
                  <div class="absolute left-3 top-1 w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                    <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01"/></svg>
                  </div>
                  <div class="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-lg p-4">
                    <div class="flex items-center justify-between">
                      <div>
                        <h4 class="text-sm font-bold text-red-300">
                          {{ lang.l('Kogu kaskaadmõju', 'Total Cascade Impact') }}
                        </h4>
                        <p class="text-xs text-slate-500">
                          {{ lang.l('Kumulatiivne skoorilangus', 'Cumulative score degradation') }}
                        </p>
                      </div>
                      <span class="text-2xl font-bold text-red-400">-{{ simulationResult()!.totalDegradation }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Score Degradation Visualization -->
            <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
              <h3 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
                {{ lang.l('Skoori lagunemine sambakaupa', 'Score Degradation by Pillar') }}
              </h3>
              <div class="space-y-3">
                @for (pillar of simulationResult()!.affectedPillars; track pillar; let i = $index) {
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs text-slate-400">{{ pillar }}</span>
                      <span class="text-xs font-bold text-red-400">-{{ getPillarImpact(pillar) }}%</span>
                    </div>
                    <div class="h-2 bg-slate-700/30 rounded-full overflow-hidden">
                      <div class="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-1000"
                           [style.width.%]="getPillarImpact(pillar)"
                           [style.animation-delay]="(i * 150) + 'ms'">
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Remediation Steps -->
            @if (simulationResult()!.remediationSteps.length > 0) {
              <div class="bg-slate-800/50 backdrop-blur border border-emerald-500/20 rounded-xl p-6">
                <div class="flex items-center gap-2 mb-5">
                  <div class="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <h3 class="text-sm font-semibold text-emerald-300 uppercase tracking-wider">
                    {{ lang.l('Parandusmeetmed', 'Remediation Steps') }}
                  </h3>
                </div>

                <div class="space-y-3">
                  @for (remedy of simulationResult()!.remediationSteps; track remedy.priority) {
                    <div class="flex items-start gap-4 p-4 bg-slate-900/50 border border-slate-700/30 rounded-lg hover:border-emerald-500/20 transition-colors">
                      <div class="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                        {{ remedy.priority }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between gap-3 mb-1">
                          <p class="text-sm font-medium text-slate-200">
                            {{ lang.l(remedy.actionEt, remedy.action) }}
                          </p>
                          <span class="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                                [class]="getEffortBadgeClass(remedy.effort)">
                            {{ remedy.effort }}
                          </span>
                        </div>
                        <div class="flex items-center gap-3 text-[10px] text-slate-500">
                          <span class="flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            {{ remedy.timelineDays }} {{ lang.l('päeva', 'days') }}
                          </span>
                          <span class="flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                            {{ remedy.article }}
                          </span>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

          </div>
        }
      }
    </div>
  `,
  styles: [`
    .gradient-text {
      background: linear-gradient(135deg, #f87171, #fb923c, #fbbf24);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .cascade-step {
      animation: cascade-slide-in 0.5s ease-out both;
    }

    .cascade-node {
      animation: cascade-node-appear 0.3s ease-out both;
    }

    .cascade-pulse {
      animation: cascade-ring-pulse 1.5s ease-out both;
    }

    .cascade-bar {
      animation: cascade-bar-fill 0.8s ease-out both;
    }

    @keyframes cascade-slide-in {
      0% {
        opacity: 0;
        transform: translateX(-20px);
      }
      100% {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes cascade-node-appear {
      0% {
        opacity: 0;
        transform: scale(0);
      }
      60% {
        transform: scale(1.3);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes cascade-ring-pulse {
      0% {
        opacity: 0.6;
        transform: scale(1);
        box-shadow: 0 0 0 0 currentColor;
      }
      100% {
        opacity: 0;
        transform: scale(2.5);
        box-shadow: 0 0 0 4px transparent;
      }
    }

    @keyframes cascade-bar-fill {
      0% {
        width: 0% !important;
      }
    }

    @keyframes domino-fall {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(80deg); }
    }

    .animate-domino-1 {
      animation: domino-fall 0.4s ease-in 0.0s both;
    }
    .animate-domino-2 {
      animation: domino-fall 0.4s ease-in 0.3s both;
    }
    .animate-domino-3 {
      animation: domino-fall 0.4s ease-in 0.6s both;
    }
    .animate-domino-4 {
      animation: domino-fall 0.4s ease-in 0.9s both;
    }
    .animate-domino-5 {
      animation: domino-fall 0.4s ease-in 1.2s both;
    }

    .animate-fade-in {
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      0% { opacity: 0; transform: translateY(10px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class ChainReactionComponent implements OnInit {
  lang = inject(LangService);
  private http = inject(HttpClient);
  subService = inject(SubscriptionService);

  triggers = signal<Trigger[]>([]);
  loadingTriggers = signal(false);
  simulating = signal(false);
  simulationResult = signal<SimulationResult | null>(null);

  ngOnInit(): void {
    if (this.subService.isPremium()) {
      this.loadTriggers();
    }
  }

  loadTriggers(): void {
    this.loadingTriggers.set(true);
    this.http.get<Trigger[]>('/api/chain-reaction/triggers').subscribe({
      next: (data) => {
        this.triggers.set(data);
        this.loadingTriggers.set(false);
      },
      error: () => {
        this.triggers.set(this.getFallbackTriggers());
        this.loadingTriggers.set(false);
      }
    });
  }

  runSimulation(triggerId: string): void {
    this.simulating.set(true);
    this.simulationResult.set(null);
    this.http.post<SimulationResult>('/api/chain-reaction/simulate', { triggerId }).subscribe({
      next: (result) => {
        setTimeout(() => {
          this.simulationResult.set(result);
          this.simulating.set(false);
        }, 2000);
      },
      error: () => {
        setTimeout(() => {
          this.simulationResult.set(this.getFallbackResult(triggerId));
          this.simulating.set(false);
        }, 2000);
      }
    });
  }

  runQuickScenario(scenario: string): void {
    this.simulating.set(true);
    this.simulationResult.set(null);
    this.http.post<SimulationResult>('/api/chain-reaction/simulate/scenario', { scenario }).subscribe({
      next: (result) => {
        setTimeout(() => {
          this.simulationResult.set(result);
          this.simulating.set(false);
        }, 2000);
      },
      error: () => {
        setTimeout(() => {
          this.simulationResult.set(this.getFallbackScenarioResult(scenario));
          this.simulating.set(false);
        }, 2000);
      }
    });
  }

  resetSimulation(): void {
    this.simulationResult.set(null);
  }

  getTriggerCardClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/5 border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10';
      case 'HIGH': return 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/10';
      case 'MEDIUM': return 'bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/40 hover:bg-yellow-500/10';
      default: return 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50';
    }
  }

  getTriggerIconClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400';
      case 'HIGH': return 'bg-amber-500/20 text-amber-400';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-slate-700/50 text-slate-400';
    }
  }

  getTriggerGlowClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'shadow-[inset_0_0_30px_rgba(239,68,68,0.05)]';
      case 'HIGH': return 'shadow-[inset_0_0_30px_rgba(245,158,11,0.05)]';
      case 'MEDIUM': return 'shadow-[inset_0_0_30px_rgba(234,179,8,0.05)]';
      default: return '';
    }
  }

  getSeverityBadgeClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'HIGH': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      default: return 'bg-slate-700/50 text-slate-400';
    }
  }

  getRiskLevelClass(level: string): string {
    switch (level) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'HIGH': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      default: return 'bg-slate-700/50 text-slate-400';
    }
  }

  getRiskTextColor(level: string): string {
    switch (level) {
      case 'CRITICAL': return 'text-red-400';
      case 'HIGH': return 'text-amber-400';
      case 'MEDIUM': return 'text-yellow-400';
      default: return 'text-slate-400';
    }
  }

  getRiskLevelTextEt(level: string): string {
    switch (level) {
      case 'CRITICAL': return 'Kriitiline risk';
      case 'HIGH': return 'Kõrge risk';
      case 'MEDIUM': return 'Keskmine risk';
      default: return 'Madal risk';
    }
  }

  getRiskLevelTextEn(level: string): string {
    switch (level) {
      case 'CRITICAL': return 'Critical Risk';
      case 'HIGH': return 'High Risk';
      case 'MEDIUM': return 'Medium Risk';
      default: return 'Low Risk';
    }
  }

  getStepNodeClass(impact: number): string {
    if (impact >= 15) return 'border-red-500 bg-slate-900';
    if (impact >= 8) return 'border-orange-500 bg-slate-900';
    return 'border-amber-500 bg-slate-900';
  }

  getStepDotClass(impact: number): string {
    if (impact >= 15) return 'bg-red-500';
    if (impact >= 8) return 'bg-orange-500';
    return 'bg-amber-500';
  }

  getStepPulseClass(impact: number): string {
    if (impact >= 15) return 'border-2 border-red-500/40';
    if (impact >= 8) return 'border-2 border-orange-500/40';
    return 'border-2 border-amber-500/40';
  }

  getImpactBarClass(impact: number): string {
    if (impact >= 15) return 'bg-gradient-to-r from-red-600 to-red-400';
    if (impact >= 8) return 'bg-gradient-to-r from-orange-600 to-orange-400';
    return 'bg-gradient-to-r from-amber-600 to-amber-400';
  }

  getEffortBadgeClass(effort: string): string {
    switch (effort) {
      case 'LOW': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'HIGH': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default: return 'bg-slate-700/50 text-slate-400';
    }
  }

  getPillarImpact(pillar: string): number {
    const result = this.simulationResult();
    if (!result) return 0;
    const steps = result.cascadeSteps.filter(s => s.affectedPillar === pillar);
    return steps.reduce((sum, s) => sum + s.impactPercent, 0);
  }

  private getFallbackTriggers(): Trigger[] {
    return [
      {
        id: 'critical-provider-failure',
        title: 'Critical ICT Provider Failure',
        titleEt: 'Kriitilise IKT pakkuja rike',
        description: 'A critical third-party ICT provider experiences a major outage affecting your core business functions.',
        descriptionEt: 'Kriitiline kolmanda osapoole IKT pakkuja kogeb suurt katkestust, mis mõjutab teie põhilisi ärifunktsioone.',
        severity: 'CRITICAL',
        category: 'Third-Party Risk',
        icon: 'server'
      },
      {
        id: 'ransomware-attack',
        title: 'Ransomware Attack',
        titleEt: 'Lunavararünnak',
        description: 'A ransomware attack encrypts critical systems and data, demanding payment for decryption.',
        descriptionEt: 'Lunavararünnak krüpteerib kriitilised süsteemid ja andmed, nõudes deskripteerimise eest tasu.',
        severity: 'CRITICAL',
        category: 'Cyber Threat',
        icon: 'lock'
      },
      {
        id: 'data-breach',
        title: 'Customer Data Breach',
        titleEt: 'Klientide andmeleke',
        description: 'Sensitive customer data is exposed due to a security vulnerability in a vendor system.',
        descriptionEt: 'Tundlikud klientide andmed lekivad pakkuja süsteemis oleva turvanõrkuse tõttu.',
        severity: 'CRITICAL',
        category: 'Data Protection',
        icon: 'shield'
      },
      {
        id: 'cloud-provider-outage',
        title: 'Cloud Infrastructure Outage',
        titleEt: 'Pilveinfrastruktuuri katkestus',
        description: 'Major cloud provider experiences a regional outage affecting multiple services.',
        descriptionEt: 'Suur pilveteenuse pakkuja kogeb regionaalset katkestust, mis mõjutab mitut teenust.',
        severity: 'HIGH',
        category: 'Infrastructure',
        icon: 'cloud'
      },
      {
        id: 'key-personnel-loss',
        title: 'Key Personnel Loss',
        titleEt: 'Võtmeisiku kaotus',
        description: 'Critical ICT security personnel leave the organization simultaneously, creating a knowledge gap.',
        descriptionEt: 'Kriitilised IKT turbetöötajad lahkuvad organisatsioonist samaaegselt, tekitades teadmislünga.',
        severity: 'HIGH',
        category: 'Operational',
        icon: 'users'
      },
      {
        id: 'compliance-gap-discovery',
        title: 'Compliance Gap Discovery',
        titleEt: 'Vastavuslünga avastamine',
        description: 'Internal audit reveals significant gaps in DORA compliance documentation and processes.',
        descriptionEt: 'Siseaudit paljastab olulised lüngad DORA vastavusdokumentatsioonis ja protsessides.',
        severity: 'MEDIUM',
        category: 'Compliance',
        icon: 'document'
      }
    ];
  }

  private getFallbackResult(triggerId: string): SimulationResult {
    const trigger = this.triggers().find(t => t.id === triggerId) || this.getFallbackTriggers()[0];
    return {
      triggerId: trigger.id,
      triggerName: trigger.title,
      triggerNameEt: trigger.titleEt,
      scoreBefore: 72,
      scoreAfter: 41,
      riskLevel: trigger.severity,
      affectedPillars: ['ICT Risk Management', 'ICT Third-Party Risk', 'Digital Operational Resilience Testing', 'ICT Incident Management'],
      cascadeSteps: [
        {
          stepNumber: 1, name: 'Initial Impact', nameEt: 'Esmane mõju',
          affectedPillar: 'ICT Risk Management', impactPercent: 12, delayDays: 0,
          description: 'Risk management framework fails to contain the initial trigger event.',
          descriptionEt: 'Riskijuhtimise raamistik ei suuda esialgset triggeri sündmust ohjata.'
        },
        {
          stepNumber: 2, name: 'Incident Response Failure', nameEt: 'Intsidentide vastuse tõrge',
          affectedPillar: 'ICT Incident Management', impactPercent: 9, delayDays: 1,
          description: 'Incident management processes are overwhelmed, response times exceed SLA.',
          descriptionEt: 'Intsidentide haldusprotsessid on ülekoormatud, reageerimisajad ületavad SLA-d.'
        },
        {
          stepNumber: 3, name: 'Third-Party Cascade', nameEt: 'Kolmanda osapoole kaskaad',
          affectedPillar: 'ICT Third-Party Risk', impactPercent: 8, delayDays: 3,
          description: 'Impact propagates to dependent third-party service providers.',
          descriptionEt: 'Mõju levib sõltuvatele kolmanda osapoole teenusepakkujatele.'
        },
        {
          stepNumber: 4, name: 'Testing Gap Exposed', nameEt: 'Testimislünk paljastatud',
          affectedPillar: 'Digital Operational Resilience Testing', impactPercent: 2, delayDays: 7,
          description: 'Untested recovery procedures fail during execution, extending downtime.',
          descriptionEt: 'Testimata taastamisprotseduurid ebaõnnestuvad täitmise ajal, pikendades seisakut.'
        }
      ],
      remediationSteps: [
        {
          priority: 1, action: 'Activate incident response team and initiate containment procedures',
          actionEt: 'Aktiveeri intsidentide meeskond ja alusta ohjamisprotseduure',
          effort: 'LOW', timelineDays: 1, article: 'Art. 17'
        },
        {
          priority: 2, action: 'Execute business continuity plan and switch to backup systems',
          actionEt: 'Käivita talitluspidevuse plaan ja lülitu varususteemidele',
          effort: 'MEDIUM', timelineDays: 3, article: 'Art. 11'
        },
        {
          priority: 3, action: 'Notify competent authorities within regulatory timeframe',
          actionEt: 'Teavita pädevaid asutusi regulatiivse ajaraami jooksul',
          effort: 'LOW', timelineDays: 1, article: 'Art. 19'
        },
        {
          priority: 4, action: 'Conduct root cause analysis and update risk register',
          actionEt: 'Vii läbi algpõhjuse analüüs ja uuenda riskide registrit',
          effort: 'MEDIUM', timelineDays: 14, article: 'Art. 6'
        },
        {
          priority: 5, action: 'Review and update third-party contracts with enhanced resilience requirements',
          actionEt: 'Vaata üle ja uuenda kolmandate osapoolte lepinguid tugevdatud vastupidavusnõuetega',
          effort: 'HIGH', timelineDays: 30, article: 'Art. 28'
        },
        {
          priority: 6, action: 'Schedule comprehensive TLPT testing covering the failure scenario',
          actionEt: 'Planeeri põhjalik TLPT testimine, mis hõlmab rikke stsenaariumi',
          effort: 'HIGH', timelineDays: 60, article: 'Art. 26'
        }
      ],
      totalDegradation: 31,
      estimatedRecoveryDays: 45
    };
  }

  private getFallbackScenarioResult(scenario: string): SimulationResult {
    switch (scenario) {
      case 'worst-case':
        return {
          triggerId: 'worst-case',
          triggerName: 'Worst Case: Provider Down + Data Breach',
          triggerNameEt: 'Halvim stsenaarium: pakkuja maas + andmeleke',
          scoreBefore: 72,
          scoreAfter: 28,
          riskLevel: 'CRITICAL',
          affectedPillars: ['ICT Risk Management', 'ICT Third-Party Risk', 'Digital Operational Resilience Testing', 'ICT Incident Management', 'Information Sharing'],
          cascadeSteps: [
            {
              stepNumber: 1, name: 'Critical Provider Failure', nameEt: 'Kriitilise pakkuja rike',
              affectedPillar: 'ICT Third-Party Risk', impactPercent: 15, delayDays: 0,
              description: 'Critical cloud provider goes completely offline, all dependent services fail.',
              descriptionEt: 'Kriitiline pilvepakkuja läheb täielikult maha, kõik sõltuvad teenused ebaõnnestuvad.'
            },
            {
              stepNumber: 2, name: 'Data Exposure Detected', nameEt: 'Andmeleke tuvastatud',
              affectedPillar: 'ICT Risk Management', impactPercent: 12, delayDays: 0,
              description: 'Simultaneously, a data breach is detected in the same provider infrastructure.',
              descriptionEt: 'Samal ajal tuvastatakse andmeleke samas pakkuja infrastruktuuris.'
            },
            {
              stepNumber: 3, name: 'Incident Overload', nameEt: 'Intsidentide ülekoormus',
              affectedPillar: 'ICT Incident Management', impactPercent: 10, delayDays: 1,
              description: 'Dual incidents overwhelm the incident response team, causing delayed reactions.',
              descriptionEt: 'Kahe intsidendi samaaegne haldamine koormab meeskonda üle, põhjustades hilinenud reageerimist.'
            },
            {
              stepNumber: 4, name: 'Communication Breakdown', nameEt: 'Kommunikatsiooni kokkuvarisemine',
              affectedPillar: 'Information Sharing', impactPercent: 4, delayDays: 2,
              description: 'Information sharing channels fail to properly alert stakeholders.',
              descriptionEt: 'Info jagamise kanalid ei suuda sidusrühmi nõuetekohaselt hoiatada.'
            },
            {
              stepNumber: 5, name: 'Recovery Failure', nameEt: 'Taastamise ebaõnnestumine',
              affectedPillar: 'Digital Operational Resilience Testing', impactPercent: 3, delayDays: 5,
              description: 'Untested disaster recovery plans fail during execution.',
              descriptionEt: 'Testimata avariitaastamise plaanid ebaõnnestuvad täitmise ajal.'
            }
          ],
          remediationSteps: [
            {
              priority: 1, action: 'Activate crisis management team with dual-incident protocol',
              actionEt: 'Aktiveeri kriisijuhtimise meeskond kahe intsidendi protokolliga',
              effort: 'LOW', timelineDays: 1, article: 'Art. 17'
            },
            {
              priority: 2, action: 'Engage backup ICT service providers and failover systems',
              actionEt: 'Kaasa varuteenuste pakkujad ja lülitu üle varusüsteemidele',
              effort: 'HIGH', timelineDays: 3, article: 'Art. 28'
            },
            {
              priority: 3, action: 'Report major incident to competent authorities within 4 hours',
              actionEt: 'Teata suurest intsidendist pädevatele asutustele 4 tunni jooksul',
              effort: 'LOW', timelineDays: 1, article: 'Art. 19'
            },
            {
              priority: 4, action: 'Conduct forensic analysis of data breach scope and impact',
              actionEt: 'Vii läbi andmelekke ulatuse ja mõju kohtuekspertiisi analüüs',
              effort: 'HIGH', timelineDays: 14, article: 'Art. 17'
            },
            {
              priority: 5, action: 'Implement enhanced monitoring and backup verification procedures',
              actionEt: 'Rakenda tugevdatud monitooringut ja varunduse kontrollprotseduure',
              effort: 'MEDIUM', timelineDays: 30, article: 'Art. 12'
            }
          ],
          totalDegradation: 44,
          estimatedRecoveryDays: 60
        };

      case 'evidence-gap':
        return {
          triggerId: 'evidence-gap',
          triggerName: 'Evidence Gap: Audit Findings',
          triggerNameEt: 'Toenduslünk: auditi leiud',
          scoreBefore: 72,
          scoreAfter: 52,
          riskLevel: 'HIGH',
          affectedPillars: ['ICT Risk Management', 'Digital Operational Resilience Testing', 'ICT Third-Party Risk'],
          cascadeSteps: [
            {
              stepNumber: 1, name: 'Missing Policies Discovered', nameEt: 'Puuduvad poliitikad avastatud',
              affectedPillar: 'ICT Risk Management', impactPercent: 8, delayDays: 0,
              description: 'Auditors discover critical ICT risk management policies are missing or outdated.',
              descriptionEt: 'Audiitorid avastavad, et kriitilised IKT riskijuhtimise poliitikad puuduvad või on aegunud.'
            },
            {
              stepNumber: 2, name: 'Testing Evidence Gaps', nameEt: 'Testimise tõenduslüngad',
              affectedPillar: 'Digital Operational Resilience Testing', impactPercent: 7, delayDays: 0,
              description: 'No evidence of required TLPT testing or DR drills in the past 12 months.',
              descriptionEt: 'Puuduvad tõendid nõutud TLPT testimise või DR harjutuste kohta viimase 12 kuu jooksul.'
            },
            {
              stepNumber: 3, name: 'Vendor Contract Gaps', nameEt: 'Pakkuja lepingulüngad',
              affectedPillar: 'ICT Third-Party Risk', impactPercent: 5, delayDays: 7,
              description: 'Third-party contracts lack required DORA clauses for audit rights and exit strategies.',
              descriptionEt: 'Kolmandate osapoolte lepingutest puuduvad nõutud DORA klauslid auditõiguste ja väljumisstrateegiate kohta.'
            }
          ],
          remediationSteps: [
            {
              priority: 1, action: 'Create and approve missing ICT risk management policies',
              actionEt: 'Koosta ja kinnita puuduvad IKT riskijuhtimise poliitikad',
              effort: 'MEDIUM', timelineDays: 14, article: 'Art. 6'
            },
            {
              priority: 2, action: 'Schedule and execute TLPT testing program',
              actionEt: 'Planeeri ja vii läbi TLPT testimise programm',
              effort: 'HIGH', timelineDays: 45, article: 'Art. 26'
            },
            {
              priority: 3, action: 'Renegotiate vendor contracts to include DORA-required clauses',
              actionEt: 'Läbiräägi pakkuja lepingud ümber, et lisada DORA nõutud klauslid',
              effort: 'HIGH', timelineDays: 60, article: 'Art. 30'
            }
          ],
          totalDegradation: 20,
          estimatedRecoveryDays: 60
        };

      case 'regulatory-storm':
      default:
        return {
          triggerId: 'regulatory-storm',
          triggerName: 'Regulatory Storm: Multiple Deadlines',
          triggerNameEt: 'Regulatiivne torm: mitu tähtaega',
          scoreBefore: 72,
          scoreAfter: 48,
          riskLevel: 'HIGH',
          affectedPillars: ['ICT Risk Management', 'ICT Third-Party Risk', 'ICT Incident Management', 'Information Sharing'],
          cascadeSteps: [
            {
              stepNumber: 1, name: 'DORA Enforcement Deadline', nameEt: 'DORA jõustumise tähtaeg',
              affectedPillar: 'ICT Risk Management', impactPercent: 10, delayDays: 0,
              description: 'Multiple DORA regulatory requirements become enforceable simultaneously.',
              descriptionEt: 'Mitu DORA regulatiivset nõuet muutub samaaegselt jõustatavaks.'
            },
            {
              stepNumber: 2, name: 'Register of Information Mandate', nameEt: 'Infoteabe registri kohustus',
              affectedPillar: 'ICT Third-Party Risk', impactPercent: 7, delayDays: 0,
              description: 'Mandatory ROI submission deadline arrives with incomplete data.',
              descriptionEt: 'ROI kohustusliku esitamise tähtaeg saabub puudulike andmetega.'
            },
            {
              stepNumber: 3, name: 'Incident Reporting Rules', nameEt: 'Intsidentide raporteerimise reeglid',
              affectedPillar: 'ICT Incident Management', impactPercent: 4, delayDays: 3,
              description: 'New incident classification and reporting requirements take effect.',
              descriptionEt: 'Uued intsidentide klassifitseerimise ja raporteerimise nõuded jõustuvad.'
            },
            {
              stepNumber: 4, name: 'Information Sharing Framework', nameEt: 'Info jagamise raamistik',
              affectedPillar: 'Information Sharing', impactPercent: 3, delayDays: 7,
              description: 'Mandatory threat intelligence sharing arrangements must be in place.',
              descriptionEt: 'Kohustuslikud ohuteabe jagamise kokkulepped peavad olema paigas.'
            }
          ],
          remediationSteps: [
            {
              priority: 1, action: 'Prioritize and complete ICT risk management framework gaps',
              actionEt: 'Prioriseeri ja täida IKT riskijuhtimise raamistiku lüngad',
              effort: 'MEDIUM', timelineDays: 21, article: 'Art. 6'
            },
            {
              priority: 2, action: 'Complete Register of Information with all required provider data',
              actionEt: 'Täida infoteabe register kõigi nõutud pakkujate andmetega',
              effort: 'HIGH', timelineDays: 14, article: 'Art. 28'
            },
            {
              priority: 3, action: 'Establish incident classification and reporting procedures',
              actionEt: 'Kehtesta intsidentide klassifitseerimise ja raporteerimise protseduurid',
              effort: 'MEDIUM', timelineDays: 7, article: 'Art. 17'
            },
            {
              priority: 4, action: 'Join or establish threat intelligence sharing arrangements',
              actionEt: 'Liitu või loo ohuteabe jagamise kokkulepped',
              effort: 'LOW', timelineDays: 30, article: 'Art. 45'
            }
          ],
          totalDegradation: 24,
          estimatedRecoveryDays: 45
        };
    }
  }
}
