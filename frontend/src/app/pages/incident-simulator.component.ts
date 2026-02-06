import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';
import { AssessmentResult } from '../models';

interface IncidentScenario {
  id: string;
  icon: string;
  color: string;
  affectedCategories: string[];
  affectedQuestionIds: number[];
  regulatoryArticles: string[];
  maxFinePercent: number;
  cascadeRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  realWorldExample: { company: string; year: number; loss: string };
}

interface SimulationResult {
  scenario: IncidentScenario;
  vulnerableGaps: { question: string; category: string; articleReference: string }[];
  protectedAreas: { question: string; category: string }[];
  overallExposure: number;
  estimatedResponseTimeDays: number;
  regulatoryOutcome: 'FINE' | 'PRESCRIPTION' | 'WARNING' | 'COMPLIANT';
  timelineEvents: { phase: string; description: string; daysFromIncident: number; risk: string }[];
}

@Component({
  selector: 'app-incident-simulator',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 via-red-500/10 to-purple-500/10 border border-orange-500/20 p-8">
        <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div class="relative">
          <div class="flex items-center gap-2 mb-3">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
              {{ lang.t('sim.badge') }}
            </span>
          </div>
          <h1 class="text-3xl font-bold text-white mb-2">{{ lang.t('sim.title') }}</h1>
          <p class="text-slate-400 max-w-2xl">{{ lang.t('sim.subtitle') }}</p>
        </div>
      </div>

      @if (!hasAssessmentData()) {
        <!-- No data state -->
        <div class="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50">
          <div class="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-white mb-2">{{ lang.t('sim.no_data_title') }}</h3>
          <p class="text-slate-400 text-sm mb-6">{{ lang.t('sim.no_data_desc') }}</p>
          <a routerLink="/assessment"
             class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium text-sm
                    hover:from-emerald-400 hover:to-cyan-400 hover:shadow-lg hover:shadow-emerald-500/25 transition-all">
            {{ lang.t('sim.start_assessment') }}
          </a>
        </div>
      } @else {
        <!-- Scenario Selection -->
        @if (!activeSimulation()) {
          <div>
            <h2 class="text-lg font-semibold text-white mb-1">{{ lang.t('sim.choose_scenario') }}</h2>
            <p class="text-sm text-slate-400 mb-6">{{ lang.t('sim.choose_desc') }}</p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (scenario of scenarios; track scenario.id) {
                <button type="button" (click)="runSimulation(scenario)"
                        class="group text-left p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02]"
                        [class]="getScenarioCardClass(scenario)">
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                         [class]="getScenarioIconBg(scenario)">
                      {{ scenario.icon }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <h3 class="font-semibold text-white group-hover:text-white/90">{{ lang.t('sim.scenario_' + scenario.id) }}</h3>
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
                              [class]="getCascadeClass(scenario.cascadeRisk)">
                          {{ scenario.cascadeRisk }}
                        </span>
                      </div>
                      <p class="text-sm text-slate-400 mb-3">{{ lang.t('sim.scenario_' + scenario.id + '_desc') }}</p>
                      <div class="flex items-center gap-3 text-xs text-slate-500">
                        <span class="flex items-center gap-1">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                          </svg>
                          {{ scenario.affectedCategories.length }} {{ lang.t('sim.areas_affected') }}
                        </span>
                        <span class="flex items-center gap-1">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/>
                          </svg>
                          {{ scenario.realWorldExample.company }} ({{ scenario.realWorldExample.year }})
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              }
            </div>
          </div>

          <!-- Assessment context -->
          <div class="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center"
                   [class]="latestAssessment()!.complianceLevel === 'GREEN' ? 'bg-emerald-500/20 text-emerald-400' :
                            latestAssessment()!.complianceLevel === 'YELLOW' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'">
                <span class="text-lg font-bold">{{ latestAssessment()!.scorePercentage }}%</span>
              </div>
              <div>
                <p class="text-sm text-white font-medium">{{ lang.t('sim.using_assessment') }}: {{ latestAssessment()!.companyName }}</p>
                <p class="text-xs text-slate-500">{{ latestAssessment()!.contractName }} &middot; {{ latestAssessment()!.assessmentDate | date:'dd.MM.yyyy' }}</p>
              </div>
            </div>
          </div>
        }

        <!-- Simulation Results -->
        @if (activeSimulation(); as sim) {
          <div class="space-y-6">
            <!-- Back button -->
            <button type="button" (click)="clearSimulation()" class="flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              {{ lang.t('sim.back') }}
            </button>

            <!-- Scenario header -->
            <div class="flex items-center gap-4 p-6 rounded-2xl border"
                 [class]="getResultHeaderClass(sim)">
              <div class="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                   [class]="getScenarioIconBg(sim.scenario)">
                {{ sim.scenario.icon }}
              </div>
              <div>
                <h2 class="text-xl font-bold text-white">{{ lang.t('sim.scenario_' + sim.scenario.id) }}</h2>
                <p class="text-sm text-slate-400">{{ lang.t('sim.scenario_' + sim.scenario.id + '_desc') }}</p>
              </div>
            </div>

            <!-- KPI Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p class="text-xs text-slate-500 mb-1">{{ lang.t('sim.exposure') }}</p>
                <p class="text-2xl font-bold" [class]="sim.overallExposure > 60 ? 'text-red-400' : sim.overallExposure > 30 ? 'text-yellow-400' : 'text-emerald-400'">
                  {{ sim.overallExposure }}%
                </p>
              </div>
              <div class="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p class="text-xs text-slate-500 mb-1">{{ lang.t('sim.gaps_exploited') }}</p>
                <p class="text-2xl font-bold text-red-400">{{ sim.vulnerableGaps.length }}</p>
              </div>
              <div class="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p class="text-xs text-slate-500 mb-1">{{ lang.t('sim.protected') }}</p>
                <p class="text-2xl font-bold text-emerald-400">{{ sim.protectedAreas.length }}</p>
              </div>
              <div class="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p class="text-xs text-slate-500 mb-1">{{ lang.t('sim.response_time') }}</p>
                <p class="text-2xl font-bold text-white">{{ sim.estimatedResponseTimeDays }}{{ lang.t('sim.days') }}</p>
              </div>
            </div>

            <!-- Regulatory Outcome -->
            <div class="p-6 rounded-2xl border"
                 [class]="sim.regulatoryOutcome === 'FINE' ? 'bg-red-500/5 border-red-500/20' :
                          sim.regulatoryOutcome === 'PRESCRIPTION' ? 'bg-orange-500/5 border-orange-500/20' :
                          sim.regulatoryOutcome === 'WARNING' ? 'bg-yellow-500/5 border-yellow-500/20' :
                          'bg-emerald-500/5 border-emerald-500/20'">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center"
                     [class]="sim.regulatoryOutcome === 'FINE' ? 'bg-red-500/20' :
                              sim.regulatoryOutcome === 'PRESCRIPTION' ? 'bg-orange-500/20' :
                              sim.regulatoryOutcome === 'WARNING' ? 'bg-yellow-500/20' :
                              'bg-emerald-500/20'">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                       [class]="sim.regulatoryOutcome === 'FINE' ? 'text-red-400' :
                                sim.regulatoryOutcome === 'PRESCRIPTION' ? 'text-orange-400' :
                                sim.regulatoryOutcome === 'WARNING' ? 'text-yellow-400' :
                                'text-emerald-400'">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/>
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-white">{{ lang.t('sim.regulatory_outcome') }}</h3>
                  <p class="text-sm" [class]="sim.regulatoryOutcome === 'FINE' ? 'text-red-400' :
                              sim.regulatoryOutcome === 'PRESCRIPTION' ? 'text-orange-400' :
                              sim.regulatoryOutcome === 'WARNING' ? 'text-yellow-400' :
                              'text-emerald-400'">
                    {{ lang.t('sim.outcome_' + sim.regulatoryOutcome) }}
                  </p>
                </div>
              </div>
              <p class="text-sm text-slate-400">{{ lang.t('sim.outcome_' + sim.regulatoryOutcome + '_desc') }}</p>
              @if (sim.scenario.maxFinePercent > 0 && sim.regulatoryOutcome === 'FINE') {
                <div class="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p class="text-sm text-red-300 font-medium">{{ lang.t('sim.max_fine') }}: {{ sim.scenario.maxFinePercent }}% {{ lang.t('sim.of_turnover') }}</p>
                </div>
              }
            </div>

            <!-- Incident Timeline -->
            <div>
              <h3 class="text-lg font-semibold text-white mb-4">{{ lang.t('sim.timeline') }}</h3>
              <div class="relative pl-8 space-y-0">
                @for (event of sim.timelineEvents; track event.phase; let i = $index) {
                  <div class="relative pb-8" [class.pb-0]="i === sim.timelineEvents.length - 1">
                    <div class="absolute left-[-21px] top-1 w-3 h-3 rounded-full border-2"
                         [class]="event.risk === 'CRITICAL' ? 'bg-red-500 border-red-400' :
                                  event.risk === 'HIGH' ? 'bg-orange-500 border-orange-400' :
                                  event.risk === 'MEDIUM' ? 'bg-yellow-500 border-yellow-400' :
                                  'bg-emerald-500 border-emerald-400'"></div>
                    @if (i < sim.timelineEvents.length - 1) {
                      <div class="absolute left-[-16px] top-4 w-0.5 h-full bg-slate-700/50"></div>
                    }
                    <div class="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs font-mono text-slate-500">{{ lang.t('sim.day') }} {{ event.daysFromIncident }}</span>
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
                              [class]="event.risk === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                                       event.risk === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                                       event.risk === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                                       'bg-emerald-500/20 text-emerald-400'">
                          {{ event.risk }}
                        </span>
                      </div>
                      <h4 class="font-medium text-white text-sm">{{ lang.t('sim.tl_' + sim.scenario.id + '_' + event.phase) }}</h4>
                      <p class="text-xs text-slate-400 mt-1">{{ lang.t('sim.tl_' + sim.scenario.id + '_' + event.phase + '_desc') }}</p>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Vulnerable Gaps -->
            @if (sim.vulnerableGaps.length > 0) {
              <div>
                <h3 class="text-lg font-semibold text-white mb-4">
                  <span class="text-red-400">{{ sim.vulnerableGaps.length }}</span> {{ lang.t('sim.exploited_gaps') }}
                </h3>
                <div class="space-y-2">
                  @for (gap of sim.vulnerableGaps; track gap.question) {
                    <div class="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/15">
                      <div class="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                        <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm text-white">{{ gap.question }}</p>
                        <p class="text-xs text-slate-500">{{ gap.articleReference }} &middot; {{ gap.category }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Protected areas -->
            @if (sim.protectedAreas.length > 0) {
              <div>
                <h3 class="text-lg font-semibold text-white mb-4">
                  <span class="text-emerald-400">{{ sim.protectedAreas.length }}</span> {{ lang.t('sim.protected_areas') }}
                </h3>
                <div class="space-y-2">
                  @for (area of sim.protectedAreas; track area.question) {
                    <div class="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                      <div class="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm text-white">{{ area.question }}</p>
                        <p class="text-xs text-slate-500">{{ area.category }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Real world example -->
            <div class="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/30">
              <h3 class="text-sm font-semibold text-slate-300 mb-2">{{ lang.t('sim.real_world') }}</h3>
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-white font-medium">{{ sim.scenario.realWorldExample.company }} ({{ sim.scenario.realWorldExample.year }})</p>
                  <p class="text-sm text-slate-400">{{ lang.t('sim.loss') }}: {{ sim.scenario.realWorldExample.loss }}</p>
                </div>
              </div>
            </div>

            <!-- CTA -->
            <div class="flex flex-wrap gap-3">
              <button type="button" (click)="clearSimulation()"
                      class="px-6 py-3 rounded-xl bg-slate-700/50 text-white font-medium text-sm hover:bg-slate-700 transition-colors">
                {{ lang.t('sim.try_another') }}
              </button>
              <a routerLink="/assessment"
                 class="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium text-sm
                        hover:from-emerald-400 hover:to-cyan-400 hover:shadow-lg hover:shadow-emerald-500/25 transition-all">
                {{ lang.t('sim.improve_score') }}
              </a>
            </div>
          </div>
        }
      }
    </div>
  `
})
export class IncidentSimulatorComponent {
  activeSimulation = signal<SimulationResult | null>(null);

  scenarios: IncidentScenario[] = [
    {
      id: 'ransomware',
      icon: '\uD83D\uDD12',
      color: 'red',
      affectedCategories: ['INCIDENT', 'DATA', 'CONTINUITY', 'SERVICE_LEVEL'],
      affectedQuestionIds: [4, 5, 9, 10, 14, 15],
      regulatoryArticles: ['Art. 17', 'Art. 18', 'Art. 19'],
      maxFinePercent: 2,
      cascadeRisk: 'CRITICAL',
      realWorldExample: { company: 'Maersk / NotPetya', year: 2017, loss: '$300M' }
    },
    {
      id: 'cloud_outage',
      icon: '\u2601\uFE0F',
      color: 'orange',
      affectedCategories: ['SERVICE_LEVEL', 'CONTINUITY', 'EXIT_STRATEGY'],
      affectedQuestionIds: [1, 2, 9, 10, 11],
      regulatoryArticles: ['Art. 28', 'Art. 29', 'Art. 30'],
      maxFinePercent: 1,
      cascadeRisk: 'HIGH',
      realWorldExample: { company: 'AWS us-east-1', year: 2021, loss: '$150M+ (clients)' }
    },
    {
      id: 'data_breach',
      icon: '\uD83D\uDEA8',
      color: 'red',
      affectedCategories: ['DATA', 'INCIDENT', 'AUDIT', 'LEGAL'],
      affectedQuestionIds: [3, 4, 5, 6, 12, 13],
      regulatoryArticles: ['Art. 17', 'Art. 19', 'GDPR Art. 33'],
      maxFinePercent: 2,
      cascadeRisk: 'CRITICAL',
      realWorldExample: { company: 'Capital One', year: 2019, loss: '$190M' }
    },
    {
      id: 'supply_chain',
      icon: '\uD83D\uDD17',
      color: 'purple',
      affectedCategories: ['SUBCONTRACTING', 'SERVICE_LEVEL', 'AUDIT', 'RISK'],
      affectedQuestionIds: [1, 3, 6, 7, 8, 11],
      regulatoryArticles: ['Art. 28', 'Art. 29', 'Art. 30'],
      maxFinePercent: 1.5,
      cascadeRisk: 'HIGH',
      realWorldExample: { company: 'SolarWinds', year: 2020, loss: '$100M+' }
    },
    {
      id: 'insider_threat',
      icon: '\uD83D\uDC64',
      color: 'yellow',
      affectedCategories: ['AUDIT', 'DATA', 'RISK', 'LEGAL'],
      affectedQuestionIds: [3, 5, 6, 7, 12, 13],
      regulatoryArticles: ['Art. 9', 'Art. 10', 'Art. 30'],
      maxFinePercent: 1,
      cascadeRisk: 'MEDIUM',
      realWorldExample: { company: 'Tesla (insider)', year: 2023, loss: '$75K fine + reputation' }
    },
    {
      id: 'api_attack',
      icon: '\u26A1',
      color: 'cyan',
      affectedCategories: ['SERVICE_LEVEL', 'INCIDENT', 'DATA', 'CONTINUITY'],
      affectedQuestionIds: [1, 2, 4, 5, 9, 14],
      regulatoryArticles: ['Art. 17', 'Art. 25', 'Art. 30'],
      maxFinePercent: 1.5,
      cascadeRisk: 'HIGH',
      realWorldExample: { company: 'Optus Australia', year: 2022, loss: '$140M+' }
    }
  ];

  constructor(public lang: LangService) {}

  hasAssessmentData = computed(() => this.latestAssessment() !== null);

  latestAssessment = computed(() => {
    try {
      const history: AssessmentResult[] = JSON.parse(localStorage.getItem('dora_history') || '[]');
      if (history.length === 0) return null;
      return history[history.length - 1];
    } catch {
      return null;
    }
  });

  runSimulation(scenario: IncidentScenario) {
    const assessment = this.latestAssessment();
    if (!assessment) return;

    const vulnerableGaps: SimulationResult['vulnerableGaps'] = [];
    const protectedAreas: SimulationResult['protectedAreas'] = [];

    const qResults = assessment.questionResults || [];
    for (const qr of qResults) {
      const isAffected = scenario.affectedCategories.includes(qr.category) ||
                          scenario.affectedQuestionIds.includes(qr.questionId);
      if (isAffected) {
        if (!qr.compliant) {
          vulnerableGaps.push({
            question: qr.question,
            category: qr.category,
            articleReference: qr.articleReference
          });
        } else {
          protectedAreas.push({ question: qr.question, category: qr.category });
        }
      }
    }

    const totalAffected = vulnerableGaps.length + protectedAreas.length;
    const overallExposure = totalAffected > 0 ? Math.round((vulnerableGaps.length / totalAffected) * 100) : 0;

    const baseResponseDays = scenario.cascadeRisk === 'CRITICAL' ? 45 : scenario.cascadeRisk === 'HIGH' ? 30 : 20;
    const estimatedResponseTimeDays = baseResponseDays + (vulnerableGaps.length * 5);

    let regulatoryOutcome: SimulationResult['regulatoryOutcome'];
    if (overallExposure >= 60) regulatoryOutcome = 'FINE';
    else if (overallExposure >= 40) regulatoryOutcome = 'PRESCRIPTION';
    else if (overallExposure >= 20) regulatoryOutcome = 'WARNING';
    else regulatoryOutcome = 'COMPLIANT';

    const timelineEvents = this.generateTimeline(scenario, overallExposure);

    this.activeSimulation.set({
      scenario,
      vulnerableGaps,
      protectedAreas,
      overallExposure,
      estimatedResponseTimeDays,
      regulatoryOutcome,
      timelineEvents
    });
  }

  clearSimulation() {
    this.activeSimulation.set(null);
  }

  private generateTimeline(scenario: IncidentScenario, exposure: number): SimulationResult['timelineEvents'] {
    const phases = [
      { phase: 'detection', daysFromIncident: 0, risk: exposure > 50 ? 'CRITICAL' : 'HIGH' },
      { phase: 'containment', daysFromIncident: 1, risk: exposure > 60 ? 'CRITICAL' : 'HIGH' },
      { phase: 'notification', daysFromIncident: 3, risk: exposure > 40 ? 'HIGH' : 'MEDIUM' },
      { phase: 'investigation', daysFromIncident: 7, risk: 'MEDIUM' },
      { phase: 'recovery', daysFromIncident: 14, risk: exposure > 50 ? 'HIGH' : 'MEDIUM' },
      { phase: 'regulatory', daysFromIncident: 30, risk: exposure > 50 ? 'HIGH' : 'LOW' }
    ];
    return phases.map(p => ({ ...p, description: '' }));
  }

  getScenarioCardClass(s: IncidentScenario): string {
    const base = 'bg-slate-800/30 border-slate-700/50 hover:border-';
    const colorMap: Record<string, string> = {
      red: 'red-500/50 hover:bg-red-500/5',
      orange: 'orange-500/50 hover:bg-orange-500/5',
      purple: 'purple-500/50 hover:bg-purple-500/5',
      yellow: 'yellow-500/50 hover:bg-yellow-500/5',
      cyan: 'cyan-500/50 hover:bg-cyan-500/5'
    };
    return base + (colorMap[s.color] || colorMap['red']);
  }

  getScenarioIconBg(s: IncidentScenario): string {
    const map: Record<string, string> = {
      red: 'bg-red-500/20',
      orange: 'bg-orange-500/20',
      purple: 'bg-purple-500/20',
      yellow: 'bg-yellow-500/20',
      cyan: 'bg-cyan-500/20'
    };
    return map[s.color] || 'bg-red-500/20';
  }

  getCascadeClass(risk: string): string {
    const map: Record<string, string> = {
      CRITICAL: 'bg-red-500/20 text-red-400',
      HIGH: 'bg-orange-500/20 text-orange-400',
      MEDIUM: 'bg-yellow-500/20 text-yellow-400',
      LOW: 'bg-emerald-500/20 text-emerald-400'
    };
    return map[risk] || '';
  }

  getResultHeaderClass(sim: SimulationResult): string {
    if (sim.overallExposure >= 60) return 'bg-red-500/5 border-red-500/20';
    if (sim.overallExposure >= 30) return 'bg-orange-500/5 border-orange-500/20';
    return 'bg-emerald-500/5 border-emerald-500/20';
  }
}
