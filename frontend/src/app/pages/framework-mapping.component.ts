import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LangService } from '../lang.service';

interface FrameworkMapping {
  doraArticle: string;
  doraRequirement: { et: string; en: string };
  pillar: number;
  iso27001?: string;
  iso27001Match: 'full' | 'partial' | 'none' | 'na';
  iso27001Detail?: { et: string; en: string };
  nis2?: string;
  nis2Match: 'full' | 'partial' | 'none' | 'na';
  nis2Detail?: { et: string; en: string };
  gdpr?: string;
  gdprMatch: 'full' | 'partial' | 'none' | 'na';
  gdprDetail?: { et: string; en: string };
  cobit?: string;
  cobitMatch: 'full' | 'partial' | 'none' | 'na';
  cobitDetail?: { et: string; en: string };
}

@Component({
  selector: 'app-framework-mapping',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto space-y-8 pb-16">

      <!-- Header -->
      <div class="text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-4">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
          </svg>
          {{ lang.t('fwmap.free_tool') }}
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">
          {{ lang.t('fwmap.multiframework_compliance_mapping') }}
        </h1>
        <p class="text-slate-400 max-w-3xl mx-auto">
          {{ lang.t('fwmap.see_how_dora_maps_to_iso_27001_nis2_gdpr') }}
        </p>
      </div>

      <!-- Summary Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-2xl p-5 text-center">
          <div class="text-3xl font-bold text-white mb-1">{{ mappings.length }}</div>
          <div class="text-xs text-slate-400">
            {{ lang.t('fwmap.dora_requirements_mapped') }}
          </div>
        </div>
        <div class="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-2xl p-5 text-center">
          <div class="text-3xl font-bold text-emerald-400 mb-1">{{ isoOverlapPercent }}%</div>
          <div class="text-xs text-slate-400">
            {{ lang.t('fwmap.iso_27001_overlap') }}
          </div>
        </div>
        <div class="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-2xl p-5 text-center">
          <div class="text-3xl font-bold text-cyan-400 mb-1">{{ nis2OverlapPercent }}%</div>
          <div class="text-xs text-slate-400">
            {{ lang.t('fwmap.nis2_overlap') }}
          </div>
        </div>
        <div class="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-2xl p-5 text-center">
          <div class="text-3xl font-bold text-amber-400 mb-1">{{ doraOnlyCount }}</div>
          <div class="text-xs text-slate-400">
            {{ lang.t('fwmap.doraunique_requirements') }}
          </div>
        </div>
      </div>

      <!-- Framework Selector -->
      <div class="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
        <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
          </svg>
          {{ lang.t('fwmap.select_frameworks') }}
        </h2>
        <div class="flex flex-wrap gap-3">
          <label class="flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all"
                 [class]="showIso ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-700/30 border-slate-600/30 text-slate-400 hover:border-slate-500/50'">
            <input type="checkbox" [(ngModel)]="showIso" class="sr-only">
            <span class="w-4 h-4 rounded border flex items-center justify-center text-xs"
                  [class]="showIso ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-500'">
              <span *ngIf="showIso">&#10003;</span>
            </span>
            ISO 27001:2022
          </label>
          <label class="flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all"
                 [class]="showNis2 ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' : 'bg-slate-700/30 border-slate-600/30 text-slate-400 hover:border-slate-500/50'">
            <input type="checkbox" [(ngModel)]="showNis2" class="sr-only">
            <span class="w-4 h-4 rounded border flex items-center justify-center text-xs"
                  [class]="showNis2 ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-slate-500'">
              <span *ngIf="showNis2">&#10003;</span>
            </span>
            NIS2 Directive
          </label>
          <label class="flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all"
                 [class]="showGdpr ? 'bg-violet-500/10 border-violet-500/30 text-violet-300' : 'bg-slate-700/30 border-slate-600/30 text-slate-400 hover:border-slate-500/50'">
            <input type="checkbox" [(ngModel)]="showGdpr" class="sr-only">
            <span class="w-4 h-4 rounded border flex items-center justify-center text-xs"
                  [class]="showGdpr ? 'bg-violet-500 border-violet-500 text-white' : 'border-slate-500'">
              <span *ngIf="showGdpr">&#10003;</span>
            </span>
            GDPR
          </label>
          <label class="flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all"
                 [class]="showCobit ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-slate-700/30 border-slate-600/30 text-slate-400 hover:border-slate-500/50'">
            <input type="checkbox" [(ngModel)]="showCobit" class="sr-only">
            <span class="w-4 h-4 rounded border flex items-center justify-center text-xs"
                  [class]="showCobit ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-500'">
              <span *ngIf="showCobit">&#10003;</span>
            </span>
            COBIT 2019
          </label>
        </div>
      </div>

      <!-- Coverage Calculator -->
      <div class="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
        <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          {{ lang.t('fwmap.coverage_calculator') }}
        </h2>
        <p class="text-sm text-slate-400 mb-5">
          {{ lang.t('fwmap.select_frameworks_your_organization_alre') }}
        </p>

        <div class="flex flex-wrap gap-3 mb-6">
          <button type="button" (click)="toggleCompliance('iso')"
                  class="px-4 py-2 rounded-xl border text-sm font-medium transition-all"
                  [class]="complyIso ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-700/30 border-slate-600/30 text-slate-400 hover:border-slate-500/50'">
            <span *ngIf="complyIso" class="mr-1">&#10003;</span> ISO 27001:2022
          </button>
          <button type="button" (click)="toggleCompliance('nis2')"
                  class="px-4 py-2 rounded-xl border text-sm font-medium transition-all"
                  [class]="complyNis2 ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-slate-700/30 border-slate-600/30 text-slate-400 hover:border-slate-500/50'">
            <span *ngIf="complyNis2" class="mr-1">&#10003;</span> NIS2 Directive
          </button>
          <button type="button" (click)="toggleCompliance('gdpr')"
                  class="px-4 py-2 rounded-xl border text-sm font-medium transition-all"
                  [class]="complyGdpr ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'bg-slate-700/30 border-slate-600/30 text-slate-400 hover:border-slate-500/50'">
            <span *ngIf="complyGdpr" class="mr-1">&#10003;</span> GDPR
          </button>
          <button type="button" (click)="toggleCompliance('cobit')"
                  class="px-4 py-2 rounded-xl border text-sm font-medium transition-all"
                  [class]="complyCobit ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-slate-700/30 border-slate-600/30 text-slate-400 hover:border-slate-500/50'">
            <span *ngIf="complyCobit" class="mr-1">&#10003;</span> COBIT 2019
          </button>
        </div>

        <!-- Coverage result -->
        <div *ngIf="anyComplianceSelected" class="space-y-4">
          <div class="bg-slate-900/60 rounded-xl p-5 border border-slate-700/30">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm text-slate-300">
                {{ lang.t('fwmap.dora_coverage_from_existing_certificatio') }}
              </span>
              <span class="text-2xl font-bold" [class]="coveragePercent >= 70 ? 'text-emerald-400' : coveragePercent >= 40 ? 'text-amber-400' : 'text-red-400'">
                {{ coveragePercent }}%
              </span>
            </div>
            <div class="h-3 bg-slate-700 rounded-full overflow-hidden mb-3">
              <div class="h-full rounded-full transition-all duration-700 ease-out"
                   [class]="coveragePercent >= 70 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : coveragePercent >= 40 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-red-500 to-red-400'"
                   [style.width.%]="coveragePercent">
              </div>
            </div>
            <p class="text-sm text-slate-400">
              {{ getCoverageMessage() }}
            </p>
          </div>

          <!-- Per-framework breakdown -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3" *ngIf="anyComplianceSelected">
            <div *ngIf="complyIso" class="bg-slate-900/40 rounded-xl p-4 border border-emerald-500/20">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-emerald-300 font-medium">ISO 27001:2022</span>
                <span class="text-sm font-bold text-emerald-400">{{ isoOverlapPercent }}%</span>
              </div>
              <div class="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full bg-emerald-500 rounded-full transition-all duration-500" [style.width.%]="isoOverlapPercent"></div>
              </div>
            </div>
            <div *ngIf="complyNis2" class="bg-slate-900/40 rounded-xl p-4 border border-cyan-500/20">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-cyan-300 font-medium">NIS2 Directive</span>
                <span class="text-sm font-bold text-cyan-400">{{ nis2OverlapPercent }}%</span>
              </div>
              <div class="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full bg-cyan-500 rounded-full transition-all duration-500" [style.width.%]="nis2OverlapPercent"></div>
              </div>
            </div>
            <div *ngIf="complyGdpr" class="bg-slate-900/40 rounded-xl p-4 border border-violet-500/20">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-violet-300 font-medium">GDPR</span>
                <span class="text-sm font-bold text-violet-400">{{ gdprOverlapPercent }}%</span>
              </div>
              <div class="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full bg-violet-500 rounded-full transition-all duration-500" [style.width.%]="gdprOverlapPercent"></div>
              </div>
            </div>
            <div *ngIf="complyCobit" class="bg-slate-900/40 rounded-xl p-4 border border-amber-500/20">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-amber-300 font-medium">COBIT 2019</span>
                <span class="text-sm font-bold text-amber-400">{{ cobitOverlapPercent }}%</span>
              </div>
              <div class="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full bg-amber-500 rounded-full transition-all duration-500" [style.width.%]="cobitOverlapPercent"></div>
              </div>
            </div>
          </div>

          <!-- Remaining gaps -->
          <div *ngIf="remainingGaps.length > 0" class="bg-slate-900/40 rounded-xl p-5 border border-red-500/20">
            <h3 class="text-sm font-semibold text-red-300 mb-3 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
              {{ lang.t('fwmap.remaining_gaps') }} ({{ remainingGaps.length }})
            </h3>
            <ul class="space-y-2">
              <li *ngFor="let gap of remainingGaps" class="flex items-start gap-2 text-sm">
                <span class="text-red-400 shrink-0 mt-0.5">&#9679;</span>
                <span class="text-slate-400">
                  <span class="text-red-300 font-medium">{{ gap.doraArticle }}</span> &mdash;
                  {{ l(gap.doraRequirement.et, gap.doraRequirement.en) }}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div *ngIf="!anyComplianceSelected" class="bg-slate-900/40 rounded-xl p-8 border border-slate-700/30 text-center">
          <svg class="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <p class="text-slate-500 text-sm">
            {{ lang.t('fwmap.select_frameworks_above_to_see_the_cover') }}
          </p>
        </div>
      </div>

      <!-- Pillar filter -->
      <div class="flex flex-wrap gap-2">
        <button type="button" (click)="selectedPillar = 0"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                [class]="selectedPillar === 0 ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300' : 'bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-300'">
          {{ lang.t('fwmap.all_pillars') }}
        </button>
        <button *ngFor="let p of pillarNames" type="button" (click)="selectedPillar = p.id"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                [class]="selectedPillar === p.id ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300' : 'bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-300'">
          {{ l(p.et, p.en) }}
        </button>
      </div>

      <!-- Mapping Table per Pillar -->
      <div *ngFor="let pillar of getVisiblePillars()" class="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-700/50 bg-slate-800/80">
          <h3 class="text-base font-semibold text-white flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                  [class]="'bg-' + getPillarColor(pillar.id) + '-500/20 text-' + getPillarColor(pillar.id) + '-400'">
              {{ pillar.id }}
            </span>
            {{ l(pillar.et, pillar.en) }}
          </h3>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-700/50">
                <th class="text-left px-4 py-3 text-slate-400 font-medium whitespace-nowrap">
                  {{ lang.t('fwmap.dora_article') }}
                </th>
                <th class="text-left px-4 py-3 text-slate-400 font-medium min-w-[200px]">
                  {{ lang.t('fwmap.requirement') }}
                </th>
                <th *ngIf="showIso" class="text-center px-4 py-3 text-emerald-400 font-medium whitespace-nowrap">ISO 27001</th>
                <th *ngIf="showNis2" class="text-center px-4 py-3 text-cyan-400 font-medium whitespace-nowrap">NIS2</th>
                <th *ngIf="showGdpr" class="text-center px-4 py-3 text-violet-400 font-medium whitespace-nowrap">GDPR</th>
                <th *ngIf="showCobit" class="text-center px-4 py-3 text-amber-400 font-medium whitespace-nowrap">COBIT</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let m of getMappingsForPillar(pillar.id); let i = index">
                <tr class="border-b border-slate-700/30 hover:bg-slate-700/20 cursor-pointer transition-colors"
                    (click)="toggleRow(m.doraArticle)">
                  <td class="px-4 py-3 text-cyan-300 font-mono text-xs whitespace-nowrap">{{ m.doraArticle }}</td>
                  <td class="px-4 py-3 text-slate-300">{{ l(m.doraRequirement.et, m.doraRequirement.en) }}</td>
                  <td *ngIf="showIso" class="px-4 py-3 text-center">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          [class]="getMatchClass(m.iso27001Match)">
                      {{ getMatchIcon(m.iso27001Match) }} {{ getMatchLabel(m.iso27001Match) }}
                    </span>
                  </td>
                  <td *ngIf="showNis2" class="px-4 py-3 text-center">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          [class]="getMatchClass(m.nis2Match)">
                      {{ getMatchIcon(m.nis2Match) }} {{ getMatchLabel(m.nis2Match) }}
                    </span>
                  </td>
                  <td *ngIf="showGdpr" class="px-4 py-3 text-center">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          [class]="getMatchClass(m.gdprMatch)">
                      {{ getMatchIcon(m.gdprMatch) }} {{ getMatchLabel(m.gdprMatch) }}
                    </span>
                  </td>
                  <td *ngIf="showCobit" class="px-4 py-3 text-center">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          [class]="getMatchClass(m.cobitMatch)">
                      {{ getMatchIcon(m.cobitMatch) }} {{ getMatchLabel(m.cobitMatch) }}
                    </span>
                  </td>
                </tr>
                <!-- Expanded detail row -->
                <tr *ngIf="expandedRow === m.doraArticle" class="bg-slate-900/40">
                  <td [attr.colspan]="getColspan()" class="px-4 py-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div *ngIf="showIso && m.iso27001" class="bg-slate-800/60 rounded-lg p-3 border border-emerald-500/20">
                        <div class="text-xs font-semibold text-emerald-400 mb-1">ISO 27001:2022</div>
                        <div class="text-xs text-slate-300 font-mono mb-1">{{ m.iso27001 }}</div>
                        <div *ngIf="m.iso27001Detail" class="text-xs text-slate-400">
                          {{ l(m.iso27001Detail?.et, m.iso27001Detail?.en) }}
                        </div>
                      </div>
                      <div *ngIf="showNis2 && m.nis2" class="bg-slate-800/60 rounded-lg p-3 border border-cyan-500/20">
                        <div class="text-xs font-semibold text-cyan-400 mb-1">NIS2 Directive</div>
                        <div class="text-xs text-slate-300 font-mono mb-1">{{ m.nis2 }}</div>
                        <div *ngIf="m.nis2Detail" class="text-xs text-slate-400">
                          {{ l(m.nis2Detail?.et, m.nis2Detail?.en) }}
                        </div>
                      </div>
                      <div *ngIf="showGdpr && m.gdpr" class="bg-slate-800/60 rounded-lg p-3 border border-violet-500/20">
                        <div class="text-xs font-semibold text-violet-400 mb-1">GDPR</div>
                        <div class="text-xs text-slate-300 font-mono mb-1">{{ m.gdpr }}</div>
                        <div *ngIf="m.gdprDetail" class="text-xs text-slate-400">
                          {{ l(m.gdprDetail?.et, m.gdprDetail?.en) }}
                        </div>
                      </div>
                      <div *ngIf="showCobit && m.cobit" class="bg-slate-800/60 rounded-lg p-3 border border-amber-500/20">
                        <div class="text-xs font-semibold text-amber-400 mb-1">COBIT 2019</div>
                        <div class="text-xs text-slate-300 font-mono mb-1">{{ m.cobit }}</div>
                        <div *ngIf="m.cobitDetail" class="text-xs text-slate-400">
                          {{ l(m.cobitDetail?.et, m.cobitDetail?.en) }}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Legend -->
      <div class="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
        <h3 class="text-sm font-semibold text-white mb-3">
          {{ lang.t('fwmap.legend') }}
        </h3>
        <div class="flex flex-wrap gap-4 text-xs">
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/50"></span>
            <span class="text-slate-400">{{ lang.t('fwmap.full_match') }}</span>
          </span>
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded-full bg-amber-500/30 border border-amber-500/50"></span>
            <span class="text-slate-400">{{ lang.t('fwmap.partial_match') }}</span>
          </span>
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded-full bg-red-500/30 border border-red-500/50"></span>
            <span class="text-slate-400">{{ lang.t('fwmap.no_match') }}</span>
          </span>
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded-full bg-slate-500/30 border border-slate-500/50"></span>
            <span class="text-slate-400">{{ lang.t('fwmap.na') }}</span>
          </span>
        </div>
      </div>

      <!-- CTA -->
      <div class="bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 border border-emerald-500/20 rounded-2xl p-8 text-center">
        <h2 class="text-xl font-bold text-white mb-2">
          {{ lang.t('fwmap.start_your_dora_compliance_assessment') }}
        </h2>
        <p class="text-slate-400 text-sm mb-5 max-w-xl mx-auto">
          {{ lang.t('fwmap.now_that_you_know_your_gaps_run_a_full_d') }}
        </p>
        <a routerLink="/assessment" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors">
          {{ lang.t('fwmap.start_assessment') }}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </a>
      </div>
    </div>
  `
})
export class FrameworkMappingComponent {
  // Framework visibility toggles
  showIso = true;
  showNis2 = true;
  showGdpr = false;
  showCobit = false;

  // Compliance selection for coverage calculator
  complyIso = false;
  complyNis2 = false;
  complyGdpr = false;
  complyCobit = false;

  // Pillar filter
  selectedPillar = 0;

  // Expanded row
  expandedRow: string | null = null;

  pillarNames = [
    { id: 1, et: 'IKT riskijuhtimine', en: 'ICT Risk Management' },
    { id: 2, et: 'Intsidentide haldus', en: 'Incident Management' },
    { id: 3, et: 'Vastupidavuse testimine', en: 'Resilience Testing' },
    { id: 4, et: 'Kolmanda osapoole risk', en: 'Third-Party Risk' },
    { id: 5, et: 'Teabe jagamine', en: 'Information Sharing' }
  ];

  mappings: FrameworkMapping[] = [
    // ===== PILLAR 1: ICT Risk Management =====
    {
      doraArticle: 'Art. 5',
      doraRequirement: {
        et: 'IKT riskijuhtimise raamistik ja juhtimine',
        en: 'ICT risk management framework and governance'
      },
      pillar: 1,
      iso27001: 'A.5.1, A.5.2',
      iso27001Match: 'full',
      iso27001Detail: {
        et: 'Infoturbepoliitikad ja rollide/vastutuste jaotus',
        en: 'Information security policies and assignment of roles/responsibilities'
      },
      nis2: 'Art. 21(1)',
      nis2Match: 'full',
      nis2Detail: {
        et: 'Riskijuhtimise meetmed kõigi ohtude jaoks',
        en: 'Risk management measures addressing all hazards'
      },
      gdpr: 'Art. 24',
      gdprMatch: 'partial',
      gdprDetail: {
        et: 'Vastutava töötleja kohustused (piiratud IKT-ga)',
        en: 'Controller responsibility (limited to ICT scope)'
      },
      cobit: 'APO12, APO13',
      cobitMatch: 'full',
      cobitDetail: {
        et: 'Riskide haldamine ja turbe haldamine',
        en: 'Manage risk, Manage security'
      }
    },
    {
      doraArticle: 'Art. 6(1)',
      doraRequirement: {
        et: 'IKT süsteemide, protokollide ja tööriistade tuvastamine ja klassifitseerimine',
        en: 'Identification and classification of ICT systems, protocols and tools'
      },
      pillar: 1,
      iso27001: 'A.5.9, A.5.12',
      iso27001Match: 'full',
      iso27001Detail: {
        et: 'Varade inventuur ja teabe klassifitseerimine',
        en: 'Inventory of assets and classification of information'
      },
      nis2: 'Art. 21(2)(a)',
      nis2Match: 'partial',
      nis2Detail: {
        et: 'Riskianalüüsi poliitikad (kaudne nõue)',
        en: 'Risk analysis policies (implicit requirement)'
      },
      gdpr: undefined,
      gdprMatch: 'na',
      cobit: 'BAI09',
      cobitMatch: 'full',
      cobitDetail: {
        et: 'Varade haldamine',
        en: 'Manage assets'
      }
    },
    {
      doraArticle: 'Art. 6(8)',
      doraRequirement: {
        et: 'IKT riskijuhtimise raamistiku regulaarne ülevaatamine ja audit',
        en: 'Regular review and audit of ICT risk management framework'
      },
      pillar: 1,
      iso27001: 'A.5.35, A.5.36',
      iso27001Match: 'full',
      iso27001Detail: {
        et: 'Sõltumatu infoturbe ülevaatus ja vastavus poliitikate/standarditega',
        en: 'Independent review of information security and compliance with policies/standards'
      },
      nis2: 'Art. 21(1)',
      nis2Match: 'partial',
      nis2Detail: {
        et: 'Raamistiku perioodiline ülevaatamine on kaudselt nõutud',
        en: 'Periodic review of framework implicitly required'
      },
      gdpr: 'Art. 32(1)(d)',
      gdprMatch: 'partial',
      gdprDetail: {
        et: 'Regulaarne turvaprotsesside tõhususe hindamine',
        en: 'Regular testing and evaluating effectiveness of security measures'
      },
      cobit: 'MEA01, MEA02',
      cobitMatch: 'full',
      cobitDetail: {
        et: 'Jõudluse ja vastavuse seire',
        en: 'Monitor performance and conformance'
      }
    },
    {
      doraArticle: 'Art. 7',
      doraRequirement: {
        et: 'IKT süsteemid, protokollid ja tööriistad peavad olema ajakohased ja turvalised',
        en: 'ICT systems, protocols and tools must be kept up to date and secure'
      },
      pillar: 1,
      iso27001: 'A.8.8, A.8.9',
      iso27001Match: 'full',
      iso27001Detail: {
        et: 'Tehniliste haavatavuste haldamine ja konfiguratsioonide haldamine',
        en: 'Management of technical vulnerabilities and configuration management'
      },
      nis2: 'Art. 21(2)(e)',
      nis2Match: 'partial',
      nis2Detail: {
        et: 'Haavatavuste avastamine ja parandamine',
        en: 'Vulnerability disclosure and remediation'
      },
      gdpr: 'Art. 32(1)(a)',
      gdprMatch: 'partial',
      gdprDetail: {
        et: 'Asjakohased tehnilised meetmed',
        en: 'Appropriate technical measures'
      },
      cobit: 'BAI06, DSS05',
      cobitMatch: 'full',
      cobitDetail: {
        et: 'Muudatuste haldamine ja turbeteenuste haldamine',
        en: 'Manage changes and manage security services'
      }
    },
    {
      doraArticle: 'Art. 8',
      doraRequirement: {
        et: 'IKT äriprotsesside mõjuanalüüs ja riskihindamine',
        en: 'ICT business impact analysis and risk assessment'
      },
      pillar: 1,
      iso27001: 'A.5.29, A.5.30',
      iso27001Match: 'full',
      iso27001Detail: {
        et: 'Infoturve häirete ajal ja IKT valmisolek talitluspidevuseks',
        en: 'Information security during disruption and ICT readiness for business continuity'
      },
      nis2: 'Art. 21(2)(c)',
      nis2Match: 'full',
      nis2Detail: {
        et: 'Talitluspidevus ja kriisijuhtimine',
        en: 'Business continuity and crisis management'
      },
      gdpr: undefined,
      gdprMatch: 'na',
      cobit: 'APO12.03',
      cobitMatch: 'full',
      cobitDetail: {
        et: 'Riskiprofiili hoidmine',
        en: 'Maintain a risk profile'
      }
    },
    {
      doraArticle: 'Art. 9',
      doraRequirement: {
        et: 'IKT süsteemide kaitse ja ennetus',
        en: 'Protection and prevention measures for ICT systems'
      },
      pillar: 1,
      iso27001: 'A.8.1-A.8.4',
      iso27001Match: 'full',
      iso27001Detail: {
        et: 'Kasutajaseadmete turvalisus, privilegeeritud juurdepääs, teabele juurdepääsu piiramine',
        en: 'User endpoint devices, privileged access, information access restriction'
      },
      nis2: 'Art. 21(2)(a)',
      nis2Match: 'full',
      nis2Detail: {
        et: 'Riskianalüüsi poliitikad ja infosüsteemide turvalisus',
        en: 'Risk analysis policies and information systems security'
      },
      gdpr: 'Art. 32(1)(a-b)',
      gdprMatch: 'partial',
      gdprDetail: {
        et: 'Krüpteerimine ja pseudonümiseerimine',
        en: 'Encryption and pseudonymisation'
      },
      cobit: 'DSS05',
      cobitMatch: 'full',
      cobitDetail: {
        et: 'Turbeteenuste haldamine',
        en: 'Manage security services'
      }
    },

    // ===== PILLAR 2: Incident Management =====
    {
      doraArticle: 'Art. 17',
      doraRequirement: {
        et: 'IKT intsidentide haldamise protsess',
        en: 'ICT incident management process'
      },
      pillar: 2,
      iso27001: 'A.5.24, A.5.25',
      iso27001Match: 'full',
      iso27001Detail: {
        et: 'Intsidentide haldamise planeerimine ja ettevalmistus; infoturbe sündmuste hindamine',
        en: 'Incident management planning and preparation; assessment of information security events'
      },
      nis2: 'Art. 23(1)',
      nis2Match: 'full',
      nis2Detail: {
        et: 'Oluliste intsidentide teavitamiskohustus',
        en: 'Notification obligation for significant incidents'
      },
      gdpr: 'Art. 33',
      gdprMatch: 'partial',
      gdprDetail: {
        et: 'Isikuandmetega seotud rikkumisest teavitamine (ainult andmekaitse)',
        en: 'Personal data breach notification (data protection scope only)'
      },
      cobit: 'DSS02',
      cobitMatch: 'full',
      cobitDetail: {
        et: 'Teenuse taotluste ja intsidentide haldamine',
        en: 'Manage service requests and incidents'
      }
    },
    {
      doraArticle: 'Art. 18',
      doraRequirement: {
        et: 'IKT intsidentide klassifitseerimine',
        en: 'Classification of ICT incidents'
      },
      pillar: 2,
      iso27001: 'A.5.25',
      iso27001Match: 'partial',
      iso27001Detail: {
        et: 'Sündmuste hindamine ja otsustamine (vähem detailne kui DORA)',
        en: 'Assessment and decision on events (less detailed than DORA)'
      },
      nis2: 'Art. 23(3)',
      nis2Match: 'full',
      nis2Detail: {
        et: 'Oluliste intsidentide kriteeriumid',
        en: 'Criteria for significant incidents'
      },
      gdpr: undefined,
      gdprMatch: 'na',
      cobit: 'DSS02.02',
      cobitMatch: 'partial',
      cobitDetail: {
        et: 'Intsidentide registreerimine ja klassifitseerimine',
        en: 'Record and classify incidents'
      }
    },
    {
      doraArticle: 'Art. 19',
      doraRequirement: {
        et: 'Suurematest IKT intsidentidest teavitamine pädevatele asutustele',
        en: 'Reporting major ICT incidents to competent authorities'
      },
      pillar: 2,
      iso27001: 'A.5.26',
      iso27001Match: 'partial',
      iso27001Detail: {
        et: 'Infoturbe intsidentidele reageerimine (ei nõua regulatiivselt teavitamist)',
        en: 'Response to information security incidents (does not require regulatory reporting)'
      },
      nis2: 'Art. 23(1-4)',
      nis2Match: 'full',
      nis2Detail: {
        et: 'Mitmeetapiline teavitamiskohustus: 24h varajane hoiatus, 72h intsident, 1 kuu lõpparuanne',
        en: 'Multi-phase reporting: 24h early warning, 72h incident, 1 month final report'
      },
      gdpr: 'Art. 33, Art. 34',
      gdprMatch: 'partial',
      gdprDetail: {
        et: 'Teavitamine järelevalveasutusele (72h) ja andmesubjektile',
        en: 'Notification to supervisory authority (72h) and data subjects'
      },
      cobit: 'MEA03',
      cobitMatch: 'partial',
      cobitDetail: {
        et: 'Väliste nõuete vastavuse haldamine',
        en: 'Manage compliance with external requirements'
      }
    },
    {
      doraArticle: 'Art. 20',
      doraRequirement: {
        et: 'Intsidentide teavitamise sisu ja vormid',
        en: 'Content and templates for incident reporting'
      },
      pillar: 2,
      iso27001: undefined,
      iso27001Match: 'none',
      iso27001Detail: {
        et: 'ISO 27001 ei nõua spetsiifilist aruandlusvormingut',
        en: 'ISO 27001 does not require specific reporting formats'
      },
      nis2: 'Art. 23(4)',
      nis2Match: 'full',
      nis2Detail: {
        et: 'Komisjoni rakendusaktiga kehtestatud aruandlusvormid',
        en: 'Reporting formats established by Commission implementing acts'
      },
      gdpr: undefined,
      gdprMatch: 'na',
      cobit: undefined,
      cobitMatch: 'na'
    },

    // ===== PILLAR 3: Resilience Testing =====
    {
      doraArticle: 'Art. 24',
      doraRequirement: {
        et: 'Digitaalse tegevuskerksuse testimise üldnõuded',
        en: 'General requirements for digital operational resilience testing'
      },
      pillar: 3,
      iso27001: 'A.8.8',
      iso27001Match: 'partial',
      iso27001Detail: {
        et: 'Tehniliste haavatavuste haldamine (kitsam ulatus kui DORA)',
        en: 'Management of technical vulnerabilities (narrower scope than DORA)'
      },
      nis2: 'Art. 21(2)(e)',
      nis2Match: 'partial',
      nis2Detail: {
        et: 'Haavatavuste avastamine ja parandamine (üldisem)',
        en: 'Vulnerability handling and disclosure (more general)'
      },
      gdpr: 'Art. 32(1)(d)',
      gdprMatch: 'partial',
      gdprDetail: {
        et: 'Regulaarne tõhususe testimine ja hindamine',
        en: 'Regular testing and evaluating effectiveness'
      },
      cobit: 'BAI03.05',
      cobitMatch: 'partial',
      cobitDetail: {
        et: 'Lahenduste ehitamine ja testimine',
        en: 'Build and test solutions'
      }
    },
    {
      doraArticle: 'Art. 25',
      doraRequirement: {
        et: 'IKT tööriistade ja süsteemide testimine',
        en: 'Testing of ICT tools and systems'
      },
      pillar: 3,
      iso27001: 'A.8.8',
      iso27001Match: 'partial',
      iso27001Detail: {
        et: 'Haavatavuste skaneerimised ja paigahaldus',
        en: 'Vulnerability scans and patch management'
      },
      nis2: 'Art. 21(2)(e)',
      nis2Match: 'partial',
      nis2Detail: {
        et: 'Turvasüsteemide testimine',
        en: 'Security system testing'
      },
      gdpr: undefined,
      gdprMatch: 'na',
      cobit: 'DSS05.01',
      cobitMatch: 'partial',
      cobitDetail: {
        et: 'Kaitse pahavara eest',
        en: 'Protect against malware'
      }
    },
    {
      doraArticle: 'Art. 26',
      doraRequirement: {
        et: 'Täiustatud ohupõhine läbistustestimine (TLPT)',
        en: 'Advanced threat-led penetration testing (TLPT)'
      },
      pillar: 3,
      iso27001: undefined,
      iso27001Match: 'none',
      iso27001Detail: {
        et: 'ISO 27001 ei nõua TLPT/TIBER-EU tüüpi teste',
        en: 'ISO 27001 does not require TLPT/TIBER-EU type testing'
      },
      nis2: undefined,
      nis2Match: 'none',
      nis2Detail: {
        et: 'NIS2 ei nõua ohupõhist läbistustestimist',
        en: 'NIS2 does not require threat-led penetration testing'
      },
      gdpr: undefined,
      gdprMatch: 'na',
      cobit: undefined,
      cobitMatch: 'none',
      cobitDetail: {
        et: 'COBIT ei käsitle TLPT-d',
        en: 'COBIT does not address TLPT'
      }
    },
    {
      doraArticle: 'Art. 27',
      doraRequirement: {
        et: 'TLPT testijate nõuded',
        en: 'Requirements for TLPT testers'
      },
      pillar: 3,
      iso27001: undefined,
      iso27001Match: 'none',
      iso27001Detail: {
        et: 'Testijatele spetsiifilisi nõudeid ei ole',
        en: 'No specific tester requirements exist'
      },
      nis2: undefined,
      nis2Match: 'na',
      gdpr: undefined,
      gdprMatch: 'na',
      cobit: undefined,
      cobitMatch: 'na'
    },

    // ===== PILLAR 4: Third-Party Risk =====
    {
      doraArticle: 'Art. 28',
      doraRequirement: {
        et: 'IKT kolmanda osapoole riski haldamise üldpõhimõtted',
        en: 'General principles for managing ICT third-party risk'
      },
      pillar: 4,
      iso27001: 'A.5.19, A.5.20',
      iso27001Match: 'full',
      iso27001Detail: {
        et: 'Infoturve tarneahelas ja IKT teenustele turvanõuete kehtestamine',
        en: 'Information security in supplier relationships and addressing security within supplier agreements'
      },
      nis2: 'Art. 21(2)(d)',
      nis2Match: 'full',
      nis2Detail: {
        et: 'Tarneahela turvalisus',
        en: 'Supply chain security'
      },
      gdpr: 'Art. 28',
      gdprMatch: 'partial',
      gdprDetail: {
        et: 'Volitatud töötleja nõuded (piiratud isikuandmetega)',
        en: 'Processor requirements (limited to personal data)'
      },
      cobit: 'APO10',
      cobitMatch: 'full',
      cobitDetail: {
        et: 'Tarnijate haldamine',
        en: 'Manage suppliers'
      }
    },
    {
      doraArticle: 'Art. 29',
      doraRequirement: {
        et: 'IKT teenuslepingute lepingulised sätted',
        en: 'Contractual arrangements for ICT services'
      },
      pillar: 4,
      iso27001: 'A.5.20, A.5.21',
      iso27001Match: 'partial',
      iso27001Detail: {
        et: 'Turvanõuded tarnija lepingutes (DORA on spetsiifilisem)',
        en: 'Security in supplier agreements (DORA is more specific)'
      },
      nis2: 'Art. 21(2)(d)',
      nis2Match: 'partial',
      nis2Detail: {
        et: 'Tarneahela turvalisus (üldisem kui DORA)',
        en: 'Supply chain security (more general than DORA)'
      },
      gdpr: 'Art. 28(3)',
      gdprMatch: 'partial',
      gdprDetail: {
        et: 'Volitatud töötleja lepingu kohustuslikud klauslid',
        en: 'Mandatory processor contract clauses'
      },
      cobit: 'APO10.03',
      cobitMatch: 'partial',
      cobitDetail: {
        et: 'Tarnija riskide ja vastavuse haldamine',
        en: 'Manage supplier risk and compliance'
      }
    },
    {
      doraArticle: 'Art. 30',
      doraRequirement: {
        et: 'Kriitilised lepingutingimused IKT teenuste jaoks',
        en: 'Critical contractual provisions for ICT services'
      },
      pillar: 4,
      iso27001: 'A.5.22, A.5.23',
      iso27001Match: 'partial',
      iso27001Detail: {
        et: 'Tarnijate jälgimine ja muudatuste haldamine (vähem detailne)',
        en: 'Monitoring of suppliers and managing changes (less detailed)'
      },
      nis2: undefined,
      nis2Match: 'none',
      nis2Detail: {
        et: 'NIS2 ei defineeri spetsiifilisi lepingutingimusi',
        en: 'NIS2 does not define specific contract provisions'
      },
      gdpr: 'Art. 28(3)',
      gdprMatch: 'partial',
      gdprDetail: {
        et: 'Alamtöötlemine, auditid, andmete tagastamine',
        en: 'Sub-processing, audits, data return'
      },
      cobit: 'APO10.04',
      cobitMatch: 'partial',
      cobitDetail: {
        et: 'Tarnija teenustaseme haldamine',
        en: 'Manage supplier service delivery'
      }
    },
    {
      doraArticle: 'Art. 31',
      doraRequirement: {
        et: 'Kriitiliste IKT kolmanda osapoole teenuseosutajate järelevalveraamistik',
        en: 'Oversight framework for critical ICT third-party service providers'
      },
      pillar: 4,
      iso27001: undefined,
      iso27001Match: 'none',
      iso27001Detail: {
        et: 'ISO 27001 ei käsitle regulatiivset järelevalveraamistikku',
        en: 'ISO 27001 does not address regulatory oversight framework'
      },
      nis2: undefined,
      nis2Match: 'none',
      nis2Detail: {
        et: 'NIS2-l puudub sarnane järelevalveraamistik',
        en: 'NIS2 lacks a comparable oversight framework'
      },
      gdpr: undefined,
      gdprMatch: 'na',
      cobit: undefined,
      cobitMatch: 'na'
    },

    // ===== PILLAR 5: Information Sharing =====
    {
      doraArticle: 'Art. 45',
      doraRequirement: {
        et: 'Küberohualase teabe jagamise kokkulepped',
        en: 'Cyber threat intelligence sharing arrangements'
      },
      pillar: 5,
      iso27001: 'A.5.6',
      iso27001Match: 'partial',
      iso27001Detail: {
        et: 'Kontakt erihuvigrupidega (vabatahtlik)',
        en: 'Contact with special interest groups (voluntary)'
      },
      nis2: 'Art. 29',
      nis2Match: 'full',
      nis2Detail: {
        et: 'Vabatahtlik küberturvalisuse alase teabe jagamine',
        en: 'Voluntary cybersecurity information sharing'
      },
      gdpr: undefined,
      gdprMatch: 'na',
      cobit: 'EDM03',
      cobitMatch: 'partial',
      cobitDetail: {
        et: 'Riskide optimeerimise tagamine',
        en: 'Ensure risk optimization'
      }
    },
    {
      doraArticle: 'Art. 45(2)',
      doraRequirement: {
        et: 'Teabevahetus usaldusväärsete kogukondade kaudu',
        en: 'Information exchange through trusted communities'
      },
      pillar: 5,
      iso27001: 'A.5.6',
      iso27001Match: 'partial',
      iso27001Detail: {
        et: 'Professionaalsete ühingute ja foorumitega suhtlemine',
        en: 'Engagement with professional associations and forums'
      },
      nis2: 'Art. 29(2)',
      nis2Match: 'full',
      nis2Detail: {
        et: 'Asjakohane küberturvateabe jagamine usalduskogukondade vahel',
        en: 'Relevant cyber intelligence sharing between trusted communities'
      },
      gdpr: 'Art. 36',
      gdprMatch: 'partial',
      gdprDetail: {
        et: 'Eelnev konsulteerimine (piiratud kontekst)',
        en: 'Prior consultation (limited context)'
      },
      cobit: undefined,
      cobitMatch: 'na'
    },
    {
      doraArticle: 'Art. 10',
      doraRequirement: {
        et: 'IKT intsidentide tuvastamine ja avastamine',
        en: 'ICT incident detection and discovery'
      },
      pillar: 1,
      iso27001: 'A.8.15, A.8.16',
      iso27001Match: 'full',
      iso27001Detail: {
        et: 'Logimine ja jälgimine; turvaintsidentide seire',
        en: 'Logging and monitoring; security event monitoring'
      },
      nis2: 'Art. 21(2)(b)',
      nis2Match: 'full',
      nis2Detail: {
        et: 'Intsidentide käsitlemine',
        en: 'Incident handling'
      },
      gdpr: 'Art. 32(1)(d)',
      gdprMatch: 'partial',
      gdprDetail: {
        et: 'Tõhususe regulaarne testimine ja hindamine',
        en: 'Regular testing and evaluation of effectiveness'
      },
      cobit: 'DSS02.01',
      cobitMatch: 'full',
      cobitDetail: {
        et: 'Intsidentide ja teenusepäringute klassifitseerimisskeemi määratlemine',
        en: 'Define incident and service request classification schemes'
      }
    },
    {
      doraArticle: 'Art. 11',
      doraRequirement: {
        et: 'IKT talitluspidevuse poliitika ja plaanid',
        en: 'ICT business continuity policy and plans'
      },
      pillar: 1,
      iso27001: 'A.5.29, A.5.30',
      iso27001Match: 'full',
      iso27001Detail: {
        et: 'IKT valmisolek äritegevuse jätkamiseks ja tegevuse taaste planeerimine',
        en: 'ICT readiness for business continuity and recovery planning'
      },
      nis2: 'Art. 21(2)(c)',
      nis2Match: 'full',
      nis2Detail: {
        et: 'Talitluspidevus, varukoopiate haldamine ja taaste',
        en: 'Business continuity, backup management and recovery'
      },
      gdpr: 'Art. 32(1)(c)',
      gdprMatch: 'partial',
      gdprDetail: {
        et: 'Andmete kättesaadavuse ja juurdepääsu taastamine',
        en: 'Ability to restore availability and access to personal data'
      },
      cobit: 'DSS04',
      cobitMatch: 'full',
      cobitDetail: {
        et: 'Talitluspidevuse haldamine',
        en: 'Manage continuity'
      }
    },
    {
      doraArticle: 'Art. 12',
      doraRequirement: {
        et: 'IKT teenuste varundus- ja taastepoliitikad',
        en: 'Backup and restoration policies for ICT services'
      },
      pillar: 1,
      iso27001: 'A.8.13',
      iso27001Match: 'full',
      iso27001Detail: {
        et: 'Varukoopiad',
        en: 'Information backup'
      },
      nis2: 'Art. 21(2)(c)',
      nis2Match: 'full',
      nis2Detail: {
        et: 'Varukoopiate haldamine ja taaste',
        en: 'Backup management and recovery'
      },
      gdpr: 'Art. 32(1)(c)',
      gdprMatch: 'full',
      gdprDetail: {
        et: 'Andmete kättesaadavuse ja juurdepääsu õigeaegne taastamine',
        en: 'Ability to restore availability and access in a timely manner'
      },
      cobit: 'DSS04.07',
      cobitMatch: 'full',
      cobitDetail: {
        et: 'Varundusmeetmete haldamine',
        en: 'Manage backup arrangements'
      }
    },
    {
      doraArticle: 'Art. 13',
      doraRequirement: {
        et: 'IKT intsidentidest õppimine ja arendustegevus',
        en: 'Learning and evolving from ICT incidents'
      },
      pillar: 2,
      iso27001: 'A.5.27',
      iso27001Match: 'full',
      iso27001Detail: {
        et: 'Infoturbe intsidentidest õppimine',
        en: 'Learning from information security incidents'
      },
      nis2: 'Art. 21(3)',
      nis2Match: 'partial',
      nis2Detail: {
        et: 'Meetmete ajakohastamine vastavalt vajadusele',
        en: 'Update measures as necessary'
      },
      gdpr: undefined,
      gdprMatch: 'na',
      cobit: 'DSS02.07',
      cobitMatch: 'full',
      cobitDetail: {
        et: 'Intsidentide jälgimine ja probleemide eskaleerumine',
        en: 'Track incidents and produce escalations'
      }
    },
    {
      doraArticle: 'Art. 14',
      doraRequirement: {
        et: 'IKT intsidentidest teavitamine ja suhtlemine',
        en: 'Communication about ICT incidents'
      },
      pillar: 2,
      iso27001: 'A.5.24',
      iso27001Match: 'partial',
      iso27001Detail: {
        et: 'Intsidentide haldamise planeerimine (kommunikatsioon on kaudne)',
        en: 'Incident management planning (communication is implicit)'
      },
      nis2: 'Art. 23(1)',
      nis2Match: 'full',
      nis2Detail: {
        et: 'Kohustuslik intsidentidest teavitamine',
        en: 'Mandatory incident notification'
      },
      gdpr: 'Art. 34',
      gdprMatch: 'partial',
      gdprDetail: {
        et: 'Andmesubjekti teavitamine kõrge riskiga rikkumisest',
        en: 'Notification to data subject about high-risk breach'
      },
      cobit: 'DSS02.05',
      cobitMatch: 'partial',
      cobitDetail: {
        et: 'Intsidentide lahendamine ja taaste',
        en: 'Resolve and recover from incidents'
      }
    }
  ];

  constructor(public lang: LangService) {}

  l(et: string | undefined, en: string | undefined): string {
    return this.lang.currentLang === 'et' ? (et || en || '') : (en || et || '');
  }

  // --- Computed stats ---

  get isoOverlapPercent(): number {
    const relevant = this.mappings.filter(m => m.iso27001Match !== 'na');
    const full = relevant.filter(m => m.iso27001Match === 'full').length;
    const partial = relevant.filter(m => m.iso27001Match === 'partial').length;
    return relevant.length ? Math.round(((full + partial * 0.5) / relevant.length) * 100) : 0;
  }

  get nis2OverlapPercent(): number {
    const relevant = this.mappings.filter(m => m.nis2Match !== 'na');
    const full = relevant.filter(m => m.nis2Match === 'full').length;
    const partial = relevant.filter(m => m.nis2Match === 'partial').length;
    return relevant.length ? Math.round(((full + partial * 0.5) / relevant.length) * 100) : 0;
  }

  get gdprOverlapPercent(): number {
    const relevant = this.mappings.filter(m => m.gdprMatch !== 'na');
    const full = relevant.filter(m => m.gdprMatch === 'full').length;
    const partial = relevant.filter(m => m.gdprMatch === 'partial').length;
    return relevant.length ? Math.round(((full + partial * 0.5) / relevant.length) * 100) : 0;
  }

  get cobitOverlapPercent(): number {
    const relevant = this.mappings.filter(m => m.cobitMatch !== 'na');
    const full = relevant.filter(m => m.cobitMatch === 'full').length;
    const partial = relevant.filter(m => m.cobitMatch === 'partial').length;
    return relevant.length ? Math.round(((full + partial * 0.5) / relevant.length) * 100) : 0;
  }

  get doraOnlyCount(): number {
    return this.mappings.filter(m =>
      m.iso27001Match === 'none' && m.nis2Match === 'none' && m.gdprMatch === 'na' && m.cobitMatch === 'none'
      || (m.iso27001Match === 'none' && m.nis2Match === 'none' && m.gdprMatch === 'none' && m.cobitMatch === 'none')
      || (m.iso27001Match === 'none' && m.nis2Match === 'na' && m.gdprMatch === 'na' && m.cobitMatch === 'na')
      || (m.iso27001Match === 'none' && m.nis2Match === 'none' && (m.gdprMatch === 'na' || m.gdprMatch === 'none') && (m.cobitMatch === 'na' || m.cobitMatch === 'none'))
    ).length;
  }

  get anyComplianceSelected(): boolean {
    return this.complyIso || this.complyNis2 || this.complyGdpr || this.complyCobit;
  }

  get coveragePercent(): number {
    let covered = 0;
    for (const m of this.mappings) {
      let best = 0;
      if (this.complyIso) {
        if (m.iso27001Match === 'full') best = Math.max(best, 1);
        else if (m.iso27001Match === 'partial') best = Math.max(best, 0.5);
      }
      if (this.complyNis2) {
        if (m.nis2Match === 'full') best = Math.max(best, 1);
        else if (m.nis2Match === 'partial') best = Math.max(best, 0.5);
      }
      if (this.complyGdpr) {
        if (m.gdprMatch === 'full') best = Math.max(best, 1);
        else if (m.gdprMatch === 'partial') best = Math.max(best, 0.5);
      }
      if (this.complyCobit) {
        if (m.cobitMatch === 'full') best = Math.max(best, 1);
        else if (m.cobitMatch === 'partial') best = Math.max(best, 0.5);
      }
      covered += best;
    }
    return Math.round((covered / this.mappings.length) * 100);
  }

  get remainingGaps(): FrameworkMapping[] {
    return this.mappings.filter(m => {
      let best = 0;
      if (this.complyIso) {
        if (m.iso27001Match === 'full') best = Math.max(best, 1);
        else if (m.iso27001Match === 'partial') best = Math.max(best, 0.5);
      }
      if (this.complyNis2) {
        if (m.nis2Match === 'full') best = Math.max(best, 1);
        else if (m.nis2Match === 'partial') best = Math.max(best, 0.5);
      }
      if (this.complyGdpr) {
        if (m.gdprMatch === 'full') best = Math.max(best, 1);
        else if (m.gdprMatch === 'partial') best = Math.max(best, 0.5);
      }
      if (this.complyCobit) {
        if (m.cobitMatch === 'full') best = Math.max(best, 1);
        else if (m.cobitMatch === 'partial') best = Math.max(best, 0.5);
      }
      return best < 1;
    });
  }

  // --- Methods ---

  toggleCompliance(fw: string): void {
    if (fw === 'iso') this.complyIso = !this.complyIso;
    if (fw === 'nis2') this.complyNis2 = !this.complyNis2;
    if (fw === 'gdpr') this.complyGdpr = !this.complyGdpr;
    if (fw === 'cobit') this.complyCobit = !this.complyCobit;
  }

  toggleRow(article: string): void {
    this.expandedRow = this.expandedRow === article ? null : article;
  }

  getCoverageMessage(): string {
    const parts: string[] = [];
    if (this.complyIso) parts.push('ISO 27001');
    if (this.complyNis2) parts.push('NIS2');
    if (this.complyGdpr) parts.push('GDPR');
    if (this.complyCobit) parts.push('COBIT');
    const frameworks = parts.join(', ');
    if (this.lang.currentLang === 'et') {
      return `Teie olemasolev ${frameworks} vastavus katab ${this.coveragePercent}% DORA nõuetest. ${this.remainingGaps.length} nõuet vajavad täiendavat tähelepanu.`;
    }
    return `Your existing ${frameworks} compliance covers ${this.coveragePercent}% of DORA requirements. ${this.remainingGaps.length} requirements need additional attention.`;
  }

  getVisiblePillars(): { id: number; et: string; en: string }[] {
    if (this.selectedPillar === 0) return this.pillarNames;
    return this.pillarNames.filter(p => p.id === this.selectedPillar);
  }

  getMappingsForPillar(pillarId: number): FrameworkMapping[] {
    return this.mappings.filter(m => m.pillar === pillarId);
  }

  getPillarColor(pillarId: number): string {
    const colors: Record<number, string> = { 1: 'emerald', 2: 'cyan', 3: 'violet', 4: 'amber', 5: 'blue' };
    return colors[pillarId] || 'slate';
  }

  getColspan(): number {
    let cols = 2; // article + requirement
    if (this.showIso) cols++;
    if (this.showNis2) cols++;
    if (this.showGdpr) cols++;
    if (this.showCobit) cols++;
    return cols;
  }

  getMatchClass(match: 'full' | 'partial' | 'none' | 'na'): string {
    switch (match) {
      case 'full': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case 'partial': return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      case 'none': return 'bg-red-500/20 text-red-300 border border-red-500/30';
      case 'na': return 'bg-slate-600/20 text-slate-500 border border-slate-600/30';
    }
  }

  getMatchIcon(match: 'full' | 'partial' | 'none' | 'na'): string {
    switch (match) {
      case 'full': return '\u2713';
      case 'partial': return '\u25D0';
      case 'none': return '\u2717';
      case 'na': return '\u2014';
    }
  }

  getMatchLabel(match: 'full' | 'partial' | 'none' | 'na'): string {
    if (this.lang.currentLang === 'et') {
      switch (match) {
        case 'full': return 'T\u00e4is';
        case 'partial': return 'Osaline';
        case 'none': return 'Puudub';
        case 'na': return 'N/A';
      }
    }
    switch (match) {
      case 'full': return 'Full';
      case 'partial': return 'Partial';
      case 'none': return 'None';
      case 'na': return 'N/A';
    }
  }
}
