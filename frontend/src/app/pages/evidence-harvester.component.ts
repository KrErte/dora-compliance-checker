import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LangService } from '../lang.service';
import { SubscriptionService } from '../services/subscription.service';

interface ConnectorDef {
  type: string;
  name: string;
  descEt: string;
  descEn: string;
  icon: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

interface Connector {
  id: number;
  connectorType: string;
  displayName: string;
  status: string;
  evidenceCount: number;
  lastSyncAt: string | null;
  configJson: any;
  mappingRulesJson: any;
}

interface HarvesterStats {
  connectedSources: number;
  totalEvidence: number;
  coveragePercent: number;
  lastHarvestAt: string | null;
}

interface HarvestEvent {
  id: number;
  connectorType: string;
  title: string;
  pillar: string;
  timestamp: string;
}

interface PillarCoverage {
  name: string;
  nameEt: string;
  key: string;
  percent: number;
  color: string;
}

@Component({
  selector: 'app-evidence-harvester',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <!-- Premium Gate -->
    @if (!sub.isPremium()) {
      <div class="max-w-4xl mx-auto px-4 py-16 animate-fade-in">
        <div class="bg-white backdrop-blur border border-slate-200 rounded-2xl p-10 text-center">
          <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600/20 to-teal-500/20 flex items-center justify-center mx-auto mb-6">
            <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
          </div>
          <h1 class="text-3xl font-bold gradient-text mb-3">
            {{ lang.l('Tõendite automaatne kogumine', 'Evidence Auto-Harvester') }}
          </h1>
          <p class="text-slate-400 max-w-xl mx-auto mb-6">
            {{ lang.l(
              'Ühendage oma tööriistad ja koguge automaatselt DORA vastavustõendeid Jirast, GitHubist, AWSist ja muudest allikatest.',
              'Connect your tools and automatically harvest DORA compliance evidence from Jira, GitHub, AWS, and other sources.'
            ) }}
          </p>
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm mb-6">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364A9 9 0 1112 3a9 9 0 017.364 7.636z"/>
            </svg>
            {{ lang.l('Premium funktsioon — uuendage ligipääsuks', 'Premium feature — upgrade to access') }}
          </div>
          <div>
            <a routerLink="/pricing" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 text-slate-900 font-semibold hover:from-blue-500 hover:to-teal-400 transition-all">
              {{ lang.l('Vaata plaane', 'View Plans') }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </a>
          </div>
        </div>
      </div>
    }

    <!-- Main Content -->
    @if (sub.isPremium()) {
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fade-in">

        <!-- Hero Section -->
        <div class="text-center mb-2">
          <div class="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 mb-4">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            <span class="text-sm font-medium text-blue-500">Evidence Auto-Harvester</span>
          </div>
          <h1 class="text-3xl font-bold gradient-text mb-3">
            {{ lang.l('Tõendite automaatne kogumine', 'Evidence Auto-Harvester') }}
          </h1>
          <p class="text-slate-400 max-w-2xl mx-auto">
            {{ lang.l(
              'Ühendage oma arendustööriistad, pilveplatvormid ja koostöökanalid, et automaatselt koguda DORA vastavustõendeid.',
              'Connect your dev tools, cloud platforms, and collaboration channels to automatically harvest DORA compliance evidence.'
            ) }}
          </p>
        </div>

        <!-- Stats Bar -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-blue-600">{{ stats().connectedSources }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.l('Ühendatud allikad', 'Connected Sources') }}</div>
          </div>
          <div class="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-teal-400">{{ stats().totalEvidence }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.l('Kogutud tõendeid', 'Evidence Harvested') }}</div>
          </div>
          <div class="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold" [class]="stats().coveragePercent >= 70 ? 'text-blue-600' : stats().coveragePercent >= 40 ? 'text-amber-400' : 'text-red-400'">
              {{ stats().coveragePercent }}%
            </div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.l('Katvus', 'Coverage') }}</div>
          </div>
          <div class="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <div class="text-sm font-semibold text-slate-700">{{ formatTime(stats().lastHarvestAt) }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.l('Viimane kogumine', 'Last Harvest') }}</div>
          </div>
        </div>

        <!-- Connector Grid -->
        <div>
          <h2 class="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
            </svg>
            {{ lang.l('Konnektorid', 'Connectors') }}
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            @for (def of connectorDefs; track def.type) {
              <div class="bg-white border rounded-xl p-5 transition-all hover:shadow-lg hover:shadow-slate-900/50 cursor-pointer group"
                   [class]="selectedConnector()?.type === def.type
                     ? 'border-blue-500/50 ring-1 ring-blue-100 ' + def.borderClass
                     : 'border-slate-200 hover:border-slate-200'"
                   (click)="selectConnector(def)">

                <!-- Header: Icon + Status -->
                <div class="flex items-start justify-between mb-3">
                  <div class="w-12 h-12 rounded-xl flex items-center justify-center" [class]="def.bgClass">
                    <span [innerHTML]="def.icon" class="w-6 h-6 flex items-center justify-center" [class]="def.textClass"></span>
                  </div>
                  @if (getConnectorByType(def.type); as conn) {
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                      {{ lang.l('Ühendatud', 'Connected') }}
                    </span>
                  } @else {
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700/50 text-slate-500 border border-slate-600/30">
                      {{ lang.l('Ühendamata', 'Disconnected') }}
                    </span>
                  }
                </div>

                <!-- Name & Description -->
                <h3 class="text-sm font-bold text-slate-900 mb-1">{{ def.name }}</h3>
                <p class="text-xs text-slate-400 mb-3 leading-relaxed">{{ lang.l(def.descEt, def.descEn) }}</p>

                <!-- Evidence Count & Last Sync -->
                @if (getConnectorByType(def.type); as conn) {
                  <div class="flex items-center justify-between text-xs text-slate-500 mb-3 border-t border-slate-200 pt-3">
                    <span class="flex items-center gap-1">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      {{ conn.evidenceCount }} {{ lang.l('tõendit', 'items') }}
                    </span>
                    <span class="flex items-center gap-1">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      {{ formatTime(conn.lastSyncAt) }}
                    </span>
                  </div>
                }

                <!-- Action Buttons -->
                <div class="flex gap-2">
                  @if (getConnectorByType(def.type); as conn) {
                    <button (click)="harvest(conn.id, $event)"
                            [disabled]="harvesting().has(conn.id)"
                            class="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 disabled:opacity-50">
                      @if (harvesting().has(conn.id)) {
                        <svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>
                      } @else {
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                      }
                      {{ lang.l('Kogu', 'Harvest') }}
                    </button>
                    <button (click)="disconnect(conn.id, $event)"
                            class="px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  } @else {
                    <button (click)="connect(def, $event)"
                            [disabled]="connecting()"
                            class="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 bg-slate-700/50 text-slate-600 border border-slate-600/30 hover:bg-slate-700 hover:text-white disabled:opacity-50">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                      {{ lang.l('Ühenda', 'Connect') }}
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Mapping Matrix Panel (shown when a connected connector is selected) -->
        @if (selectedConnector() && getConnectorByType(selectedConnector()!.type)) {
          <div class="bg-white border border-slate-200 rounded-xl p-6 animate-fade-in">
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-lg font-semibold text-slate-700 flex items-center gap-2">
                <svg class="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/>
                </svg>
                {{ lang.l('Vastendamise maatriks', 'Mapping Matrix') }} — {{ selectedConnector()!.name }}
              </h2>
              <button (click)="selectedConnector.set(null)" class="text-slate-500 hover:text-slate-600 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-slate-200">
                    <th class="text-left py-3 px-4 text-slate-400 font-medium">{{ lang.l('Tõendi tüüp', 'Evidence Type') }}</th>
                    @for (pillar of pillarNames; track pillar.key) {
                      <th class="text-center py-3 px-2 text-slate-400 font-medium text-xs">{{ lang.l(pillar.nameEt, pillar.nameEn) }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (rule of getMappingRules(selectedConnector()!.type); track rule.evidenceType) {
                    <tr class="border-b border-slate-200 hover:bg-slate-700/20 transition-colors">
                      <td class="py-3 px-4 text-slate-600 text-xs">{{ lang.l(rule.labelEt, rule.labelEn) }}</td>
                      @for (pillar of pillarNames; track pillar.key) {
                        <td class="text-center py-3 px-2">
                          <label class="inline-flex items-center justify-center cursor-pointer">
                            <input type="checkbox"
                                   [checked]="rule.pillars.includes(pillar.key)"
                                   (change)="toggleMapping(selectedConnector()!.type, rule.evidenceType, pillar.key)"
                                   class="w-4 h-4 rounded border-slate-600 bg-slate-700/50 text-blue-600 focus:ring-blue-500/30 focus:ring-offset-0 cursor-pointer">
                          </label>
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="mt-4 flex justify-end">
              <button (click)="saveMappings()" [disabled]="savingMappings()"
                      class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-400 text-slate-900 hover:from-blue-500 hover:to-teal-400 disabled:opacity-50">
                @if (savingMappings()) {
                  <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>
                } @else {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                }
                {{ lang.l('Salvesta vastendused', 'Save Mappings') }}
              </button>
            </div>
          </div>
        }

        <!-- Coverage Donuts + Harvest Feed -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <!-- Coverage Donuts -->
          <div class="bg-white border border-slate-200 rounded-xl p-6">
            <h2 class="text-lg font-semibold text-slate-700 mb-5 flex items-center gap-2">
              <svg class="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              {{ lang.l('Tõendite katvus sambati', 'Evidence Coverage by Pillar') }}
            </h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              @for (pillar of pillarCoverage(); track pillar.key) {
                <div class="text-center">
                  <div class="relative w-20 h-20 mx-auto mb-2">
                    <svg class="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-width="6" class="text-slate-700/50"/>
                      <circle cx="50" cy="50" r="42" fill="none"
                              [attr.stroke]="pillar.color"
                              stroke-width="6"
                              stroke-linecap="round"
                              [attr.stroke-dasharray]="263.89"
                              [attr.stroke-dashoffset]="263.89 - (263.89 * pillar.percent / 100)"/>
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                      <span class="text-sm font-bold text-slate-900">{{ pillar.percent }}%</span>
                    </div>
                  </div>
                  <div class="text-xs text-slate-400 leading-tight">{{ lang.l(pillar.nameEt, pillar.name) }}</div>
                </div>
              }
            </div>
          </div>

          <!-- Harvest Feed -->
          <div class="bg-white border border-slate-200 rounded-xl p-6">
            <h2 class="text-lg font-semibold text-slate-700 mb-5 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              {{ lang.l('Viimased kogumised', 'Recent Harvests') }}
            </h2>

            @if (harvestFeed().length === 0) {
              <div class="text-center py-8">
                <div class="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
                </div>
                <p class="text-slate-500 text-sm">{{ lang.l('Kogumisi pole veel. Ühendage konnektor ja alustage.', 'No harvests yet. Connect a source and start harvesting.') }}</p>
              </div>
            } @else {
              <div class="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                @for (event of harvestFeed(); track event.id) {
                  <div class="flex items-start gap-3 p-3 rounded-lg bg-slate-700/20 border border-slate-200 hover:bg-slate-100 transition-colors">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" [class]="getConnectorBg(event.connectorType)">
                      <span [innerHTML]="getConnectorIcon(event.connectorType)" class="w-4 h-4 flex items-center justify-center" [class]="getConnectorText(event.connectorType)"></span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-medium text-slate-700 truncate">{{ event.title }}</div>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-medium border"
                              [class]="getPillarBadge(event.pillar)">
                          {{ event.pillar }}
                        </span>
                        <span class="text-[10px] text-slate-500">{{ formatTime(event.timestamp) }}</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>

      </div>
    }
  `,
  styles: [`
    .gradient-text {
      background: linear-gradient(to right, #34d399, #2dd4bf, #22d3ee);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .animate-fade-in {
      animation: fadeIn 0.4s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, 0.3); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(100, 116, 139, 0.5); }
  `]
})
export class EvidenceHarvesterComponent implements OnInit {
  lang = inject(LangService);
  sub = inject(SubscriptionService);
  private http = inject(HttpClient);

  // State signals
  stats = signal<HarvesterStats>({ connectedSources: 0, totalEvidence: 0, coveragePercent: 0, lastHarvestAt: null });
  connectors = signal<Connector[]>([]);
  harvestFeed = signal<HarvestEvent[]>([]);
  selectedConnector = signal<ConnectorDef | null>(null);
  harvesting = signal<Set<number>>(new Set());
  connecting = signal(false);
  savingMappings = signal(false);
  loading = signal(true);

  pillarCoverage = signal<PillarCoverage[]>([
    { name: 'ICT Risk Management', nameEt: 'IKT riskijuhtimine', key: 'ICT_RISK', percent: 0, color: '#3b82f6' },
    { name: 'Incident Reporting', nameEt: 'Intsidendist teatamine', key: 'INCIDENT', percent: 0, color: '#f59e0b' },
    { name: 'Resilience Testing', nameEt: 'Vastupidavuse testimine', key: 'TESTING', percent: 0, color: '#10b981' },
    { name: 'Third-Party Risk', nameEt: 'Kolmanda osapoole risk', key: 'THIRD_PARTY', percent: 0, color: '#8b5cf6' },
    { name: 'Information Sharing', nameEt: 'Teabe jagamine', key: 'INFO_SHARING', percent: 0, color: '#06b6d4' }
  ]);

  // Local mapping state (for editing before save)
  mappingState: Record<string, { evidenceType: string; labelEt: string; labelEn: string; pillars: string[] }[]> = {};

  pillarNames = [
    { key: 'ICT_RISK', nameEt: 'IKT risk', nameEn: 'ICT Risk' },
    { key: 'INCIDENT', nameEt: 'Intsidendid', nameEn: 'Incidents' },
    { key: 'TESTING', nameEt: 'Testimine', nameEn: 'Testing' },
    { key: 'THIRD_PARTY', nameEt: '3. osapool', nameEn: '3rd Party' },
    { key: 'INFO_SHARING', nameEt: 'Teave', nameEn: 'Info Share' }
  ];

  // Connector definitions with brand colors and SVG icons
  connectorDefs: ConnectorDef[] = [
    {
      type: 'JIRA',
      name: 'Jira',
      descEt: 'Projektijuhtimise piletid vastavustõenditena',
      descEn: 'Project management tickets as compliance evidence',
      icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.94 4.34 4.34 4.35V2.84a.84.84 0 00-.84-.84H11.53zM6.77 6.8a4.362 4.362 0 004.34 4.34h1.8v1.72a4.362 4.362 0 004.34 4.34V7.63a.84.84 0 00-.84-.84H6.77zM2 11.6c0 2.4 1.95 4.34 4.35 4.34h1.78v1.72c0 2.4 1.94 4.34 4.34 4.34v-9.56a.84.84 0 00-.84-.84H2z"/></svg>',
      color: '#8B5CF6',
      bgClass: 'bg-purple-500/15',
      borderClass: 'border-purple-500/30',
      textClass: 'text-purple-400'
    },
    {
      type: 'GITHUB',
      name: 'GitHub',
      descEt: 'Hoidla commitid, PR-id, turvaskaneeringud',
      descEn: 'Repository commits, PRs, security scans',
      icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/></svg>',
      color: '#94A3B8',
      bgClass: 'bg-slate-600/20',
      borderClass: 'border-slate-500/30',
      textClass: 'text-slate-600'
    },
    {
      type: 'AZURE_DEVOPS',
      name: 'Azure DevOps',
      descEt: 'Pipeline\'id, tahvlid, testitulemused',
      descEn: 'Pipelines, boards, test results',
      icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 4v16l-6 2V2l-8 2.5v14.5L2 18V6l6-2V2l8 2.5V2l6 2v0zM10 6.5V18l8-2.5V4L10 6.5z"/></svg>',
      color: '#3B82F6',
      bgClass: 'bg-blue-500/15',
      borderClass: 'border-blue-500/30',
      textClass: 'text-blue-400'
    },
    {
      type: 'AWS_CLOUDTRAIL',
      name: 'AWS CloudTrail',
      descEt: 'Auditlogid, turvajuhtumid',
      descEn: 'Audit logs, security events',
      icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.75 11.35a4.32 4.32 0 00-3.02-4.08 5.21 5.21 0 00-10.2 1.1A3.45 3.45 0 002 11.65 3.5 3.5 0 005.5 15h12.13a3.12 3.12 0 001.12-6.03v2.38zM12 4.5a3.74 3.74 0 013.63 2.84l.14.55.57.1a2.82 2.82 0 012.1 2.73 2.62 2.62 0 01-2.63 2.63H5.5A1.97 1.97 0 013.5 11.4a1.97 1.97 0 011.93-1.97l.75-.05.06-.75A3.71 3.71 0 0112 4.5z"/></svg>',
      color: '#F97316',
      bgClass: 'bg-orange-500/15',
      borderClass: 'border-orange-500/30',
      textClass: 'text-orange-400'
    },
    {
      type: 'SLACK',
      name: 'Slack',
      descEt: 'Vastavuskanali sõnumid, kinnitused',
      descEn: 'Compliance channel messages, approvals',
      icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.271 0a2.527 2.527 0 01-2.521 2.521 2.528 2.528 0 01-2.522-2.521V2.522A2.528 2.528 0 0115.164 0a2.528 2.528 0 012.521 2.522v6.312zM15.164 18.956a2.528 2.528 0 012.521 2.522A2.528 2.528 0 0115.164 24a2.527 2.527 0 01-2.522-2.522v-2.522h2.522zm0-1.271a2.527 2.527 0 01-2.522-2.521 2.528 2.528 0 012.522-2.522h6.314A2.528 2.528 0 0124 15.164a2.528 2.528 0 01-2.522 2.521h-6.314z"/></svg>',
      color: '#22C55E',
      bgClass: 'bg-green-500/15',
      borderClass: 'border-green-500/30',
      textClass: 'text-green-400'
    },
    {
      type: 'CONFLUENCE',
      name: 'Confluence',
      descEt: 'Poliitikaadokumendid, koosolekuprotokollid',
      descEn: 'Policy documents, meeting notes',
      icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1.26 14.86c-.2.34-.38.71-.38.71a.64.64 0 00.24.86l3.85 2.39a.63.63 0 00.87-.21s.17-.28.41-.64c1.49-2.24 3-1.84 5.72-.56l3.48 1.62a.63.63 0 00.84-.32l1.76-4.04a.64.64 0 00-.32-.83c-.73-.34-2.37-1.1-3.88-1.8-4.5-2.1-8.83-2.32-12.59 2.82zM22.74 9.14c.2-.34.38-.71.38-.71a.64.64 0 00-.24-.86l-3.85-2.39a.63.63 0 00-.87.21s-.17.28-.41.64c-1.49 2.24-3 1.84-5.72.56L8.55 5a.63.63 0 00-.84.32L5.95 9.35a.64.64 0 00.32.83c.73.34 2.37 1.1 3.88 1.8 4.5 2.1 8.83 2.32 12.59-2.84z"/></svg>',
      color: '#3B82F6',
      bgClass: 'bg-blue-500/15',
      borderClass: 'border-blue-500/30',
      textClass: 'text-blue-400'
    },
    {
      type: 'GOOGLE_DRIVE',
      name: 'Google Drive',
      descEt: 'Jagatud dokumendid, tabelid',
      descEn: 'Shared documents, spreadsheets',
      icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.71 3.5L1.15 15l3.43 5.96 6.56-11.47L7.71 3.5zm1.81 0l6.56 11.47h6.56L16.08 3.5H9.52zm7.24 12.47H3.74l-2.59 4.5h13.02l2.59-4.5zM14.07 15l-2.6 4.53h13.02l2.59-4.53H14.07z"/></svg>',
      color: '#FBBF24',
      bgClass: 'bg-amber-500/15',
      borderClass: 'border-amber-500/30',
      textClass: 'text-amber-400'
    }
  ];

  // Default mapping rules per connector type
  private defaultMappings: Record<string, { evidenceType: string; labelEt: string; labelEn: string; pillars: string[] }[]> = {
    JIRA: [
      { evidenceType: 'compliance_tickets', labelEt: 'Jira piletid märgisega "compliance"', labelEn: 'Jira tickets tagged "compliance"', pillars: ['ICT_RISK'] },
      { evidenceType: 'incident_tickets', labelEt: 'Intsidentide piletid', labelEn: 'Incident tickets', pillars: ['INCIDENT'] },
      { evidenceType: 'risk_assessments', labelEt: 'Riskihindamise ülesanded', labelEn: 'Risk assessment tasks', pillars: ['ICT_RISK', 'THIRD_PARTY'] },
      { evidenceType: 'test_plans', labelEt: 'Testimise kavad', labelEn: 'Test plans', pillars: ['TESTING'] }
    ],
    GITHUB: [
      { evidenceType: 'security_scans', labelEt: 'Turvaskaneerimise tulemused', labelEn: 'Security scan results', pillars: ['TESTING', 'ICT_RISK'] },
      { evidenceType: 'pull_requests', labelEt: 'Koodi ülevaatused (PR)', labelEn: 'Code reviews (PRs)', pillars: ['ICT_RISK'] },
      { evidenceType: 'dependabot_alerts', labelEt: 'Sõltuvuste hoiatused', labelEn: 'Dependency alerts', pillars: ['THIRD_PARTY'] },
      { evidenceType: 'release_notes', labelEt: 'Väljalaskemärkmed', labelEn: 'Release notes', pillars: ['ICT_RISK', 'TESTING'] }
    ],
    AZURE_DEVOPS: [
      { evidenceType: 'pipeline_runs', labelEt: 'Pipeline käivitused', labelEn: 'Pipeline runs', pillars: ['TESTING'] },
      { evidenceType: 'test_results', labelEt: 'Testi tulemused', labelEn: 'Test results', pillars: ['TESTING'] },
      { evidenceType: 'work_items', labelEt: 'Tööüksused', labelEn: 'Work items', pillars: ['ICT_RISK'] },
      { evidenceType: 'board_approvals', labelEt: 'Tahvli kinnitused', labelEn: 'Board approvals', pillars: ['ICT_RISK', 'THIRD_PARTY'] }
    ],
    AWS_CLOUDTRAIL: [
      { evidenceType: 'api_calls', labelEt: 'API kõnede logid', labelEn: 'API call logs', pillars: ['ICT_RISK'] },
      { evidenceType: 'security_events', labelEt: 'Turvasündmused', labelEn: 'Security events', pillars: ['INCIDENT', 'ICT_RISK'] },
      { evidenceType: 'config_changes', labelEt: 'Konfiguratsiooni muudatused', labelEn: 'Configuration changes', pillars: ['ICT_RISK'] },
      { evidenceType: 'access_logs', labelEt: 'Ligipääsulogid', labelEn: 'Access logs', pillars: ['ICT_RISK', 'TESTING'] }
    ],
    SLACK: [
      { evidenceType: 'compliance_messages', labelEt: 'Vastavuskanali sõnumid', labelEn: 'Compliance channel messages', pillars: ['INFO_SHARING'] },
      { evidenceType: 'approval_threads', labelEt: 'Kinnituse lõimed', labelEn: 'Approval threads', pillars: ['ICT_RISK', 'THIRD_PARTY'] },
      { evidenceType: 'incident_threads', labelEt: 'Intsidendi lõimed', labelEn: 'Incident discussion threads', pillars: ['INCIDENT'] }
    ],
    CONFLUENCE: [
      { evidenceType: 'policy_docs', labelEt: 'Poliitikaadokumendid', labelEn: 'Policy documents', pillars: ['ICT_RISK'] },
      { evidenceType: 'meeting_notes', labelEt: 'Koosolekuprotokollid', labelEn: 'Meeting notes', pillars: ['ICT_RISK', 'INFO_SHARING'] },
      { evidenceType: 'runbooks', labelEt: 'Käivitusjuhendid', labelEn: 'Runbooks / procedures', pillars: ['INCIDENT', 'TESTING'] },
      { evidenceType: 'vendor_reviews', labelEt: 'Tarnija ülevaated', labelEn: 'Vendor review pages', pillars: ['THIRD_PARTY'] }
    ],
    GOOGLE_DRIVE: [
      { evidenceType: 'policy_files', labelEt: 'Poliitikaafailid', labelEn: 'Policy files', pillars: ['ICT_RISK'] },
      { evidenceType: 'spreadsheets', labelEt: 'Riskiregistri tabelid', labelEn: 'Risk register spreadsheets', pillars: ['ICT_RISK', 'THIRD_PARTY'] },
      { evidenceType: 'audit_reports', labelEt: 'Auditiaruanded', labelEn: 'Audit reports', pillars: ['TESTING'] },
      { evidenceType: 'shared_evidence', labelEt: 'Jagatud tõendid', labelEn: 'Shared evidence docs', pillars: ['INFO_SHARING'] }
    ]
  };

  ngOnInit(): void {
    if (this.sub.isPremium()) {
      this.loadData();
    }
    // Initialize mapping state with defaults
    for (const [type, rules] of Object.entries(this.defaultMappings)) {
      this.mappingState[type] = rules.map(r => ({ ...r, pillars: [...r.pillars] }));
    }
  }

  loadData(): void {
    this.loading.set(true);
    // Load connectors
    this.http.get<Connector[]>('/api/evidence-harvester/connectors').subscribe({
      next: (data) => {
        this.connectors.set(data);
        // Merge saved mapping rules into local state
        for (const conn of data) {
          if (conn.mappingRulesJson) {
            try {
              const saved = typeof conn.mappingRulesJson === 'string'
                ? JSON.parse(conn.mappingRulesJson)
                : conn.mappingRulesJson;
              if (Array.isArray(saved)) {
                this.mappingState[conn.connectorType] = saved;
              }
            } catch {}
          }
        }
        this.loading.set(false);
      },
      error: () => {
        this.connectors.set([]);
        this.loading.set(false);
      }
    });

    // Load stats
    this.http.get<HarvesterStats>('/api/evidence-harvester/stats').subscribe({
      next: (data) => {
        this.stats.set(data);
        // Derive pillar coverage from stats or use mock distribution
        this.updatePillarCoverage(data.coveragePercent);
      },
      error: () => {}
    });

    // Load harvest feed (recent events) - simulated from connectors
    this.loadHarvestFeed();
  }

  loadHarvestFeed(): void {
    // Try to load from connectors' recent evidence
    this.http.get<HarvestEvent[]>('/api/evidence-harvester/connectors').subscribe({
      next: (connectors: any) => {
        // Build feed from connector data
        const events: HarvestEvent[] = [];
        const conns = Array.isArray(connectors) ? connectors : [];
        for (const conn of conns) {
          if (conn.lastSyncAt && conn.evidenceCount > 0) {
            const rules = this.mappingState[conn.connectorType] || [];
            for (let i = 0; i < Math.min(conn.evidenceCount, 3); i++) {
              const rule = rules[i % rules.length];
              events.push({
                id: conn.id * 100 + i,
                connectorType: conn.connectorType,
                title: rule ? (rule.labelEn) : conn.displayName + ' evidence',
                pillar: rule && rule.pillars.length > 0 ? rule.pillars[0] : 'ICT_RISK',
                timestamp: conn.lastSyncAt
              });
            }
          }
        }
        this.harvestFeed.set(events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20));
      },
      error: () => this.harvestFeed.set([])
    });
  }

  updatePillarCoverage(overallPercent: number): void {
    // Distribute coverage across pillars with some variance
    const connectedTypes = new Set(this.connectors().map(c => c.connectorType));
    const pillarScores: Record<string, number> = {
      ICT_RISK: 0, INCIDENT: 0, TESTING: 0, THIRD_PARTY: 0, INFO_SHARING: 0
    };
    const pillarMax: Record<string, number> = {
      ICT_RISK: 0, INCIDENT: 0, TESTING: 0, THIRD_PARTY: 0, INFO_SHARING: 0
    };

    for (const [type, rules] of Object.entries(this.defaultMappings)) {
      for (const rule of rules) {
        for (const pillar of rule.pillars) {
          pillarMax[pillar] = (pillarMax[pillar] || 0) + 1;
          if (connectedTypes.has(type)) {
            pillarScores[pillar] = (pillarScores[pillar] || 0) + 1;
          }
        }
      }
    }

    const updated = this.pillarCoverage().map(p => ({
      ...p,
      percent: pillarMax[p.key] > 0 ? Math.round((pillarScores[p.key] / pillarMax[p.key]) * 100) : 0
    }));
    this.pillarCoverage.set(updated);
  }

  getConnectorByType(type: string): Connector | undefined {
    return this.connectors().find(c => c.connectorType === type);
  }

  selectConnector(def: ConnectorDef): void {
    if (this.selectedConnector()?.type === def.type) {
      this.selectedConnector.set(null);
    } else {
      this.selectedConnector.set(def);
    }
  }

  connect(def: ConnectorDef, event: Event): void {
    event.stopPropagation();
    this.connecting.set(true);

    const body = {
      connectorType: def.type,
      displayName: def.name,
      configJson: '{}',
      mappingRulesJson: JSON.stringify(this.mappingState[def.type] || [])
    };

    this.http.post<Connector>('/api/evidence-harvester/connectors', body).subscribe({
      next: (conn) => {
        this.connectors.update(list => [...list, conn]);
        this.stats.update(s => ({ ...s, connectedSources: s.connectedSources + 1 }));
        this.updatePillarCoverage(this.stats().coveragePercent);
        this.connecting.set(false);
      },
      error: () => {
        // Simulate connection for demo
        const mockConn: Connector = {
          id: Date.now(),
          connectorType: def.type,
          displayName: def.name,
          status: 'CONNECTED',
          evidenceCount: 0,
          lastSyncAt: null,
          configJson: {},
          mappingRulesJson: this.mappingState[def.type] || []
        };
        this.connectors.update(list => [...list, mockConn]);
        this.stats.update(s => ({ ...s, connectedSources: s.connectedSources + 1 }));
        this.updatePillarCoverage(this.stats().coveragePercent);
        this.connecting.set(false);
      }
    });
  }

  disconnect(id: number, event: Event): void {
    event.stopPropagation();
    this.http.delete(`/api/evidence-harvester/connectors/${id}`).subscribe({
      next: () => {
        this.connectors.update(list => list.filter(c => c.id !== id));
        this.stats.update(s => ({ ...s, connectedSources: Math.max(0, s.connectedSources - 1) }));
        this.updatePillarCoverage(this.stats().coveragePercent);
      },
      error: () => {
        // Remove locally on error for demo
        this.connectors.update(list => list.filter(c => c.id !== id));
        this.stats.update(s => ({ ...s, connectedSources: Math.max(0, s.connectedSources - 1) }));
        this.updatePillarCoverage(this.stats().coveragePercent);
      }
    });
  }

  harvest(connectorId: number, event: Event): void {
    event.stopPropagation();
    const current = new Set(this.harvesting());
    current.add(connectorId);
    this.harvesting.set(current);

    this.http.post<any>(`/api/evidence-harvester/connectors/${connectorId}/harvest`, {}).subscribe({
      next: (result) => {
        // Update connector evidence count
        this.connectors.update(list => list.map(c =>
          c.id === connectorId
            ? { ...c, evidenceCount: c.evidenceCount + (result?.harvestedCount || 5), lastSyncAt: new Date().toISOString() }
            : c
        ));
        this.stats.update(s => ({
          ...s,
          totalEvidence: s.totalEvidence + (result?.harvestedCount || 5),
          lastHarvestAt: new Date().toISOString()
        }));
        this.removeHarvesting(connectorId);
        this.loadHarvestFeed();
      },
      error: () => {
        // Simulate harvest for demo
        this.connectors.update(list => list.map(c =>
          c.id === connectorId
            ? { ...c, evidenceCount: c.evidenceCount + 3, lastSyncAt: new Date().toISOString() }
            : c
        ));
        this.stats.update(s => ({
          ...s,
          totalEvidence: s.totalEvidence + 3,
          lastHarvestAt: new Date().toISOString(),
          coveragePercent: Math.min(100, s.coveragePercent + 5)
        }));
        this.updatePillarCoverage(this.stats().coveragePercent);
        this.removeHarvesting(connectorId);

        // Add mock feed events
        const conn = this.connectors().find(c => c.id === connectorId);
        if (conn) {
          const rules = this.mappingState[conn.connectorType] || [];
          const newEvents: HarvestEvent[] = rules.slice(0, 3).map((r, i) => ({
            id: Date.now() + i,
            connectorType: conn.connectorType,
            title: r.labelEn,
            pillar: r.pillars[0] || 'ICT_RISK',
            timestamp: new Date().toISOString()
          }));
          this.harvestFeed.update(feed => [...newEvents, ...feed].slice(0, 20));
        }
      }
    });
  }

  private removeHarvesting(id: number): void {
    const current = new Set(this.harvesting());
    current.delete(id);
    this.harvesting.set(current);
  }

  getMappingRules(type: string): { evidenceType: string; labelEt: string; labelEn: string; pillars: string[] }[] {
    return this.mappingState[type] || this.defaultMappings[type] || [];
  }

  toggleMapping(connectorType: string, evidenceType: string, pillarKey: string): void {
    const rules = this.mappingState[connectorType];
    if (!rules) return;
    const rule = rules.find(r => r.evidenceType === evidenceType);
    if (!rule) return;

    if (rule.pillars.includes(pillarKey)) {
      rule.pillars = rule.pillars.filter(p => p !== pillarKey);
    } else {
      rule.pillars.push(pillarKey);
    }
  }

  saveMappings(): void {
    const sel = this.selectedConnector();
    if (!sel) return;
    const conn = this.getConnectorByType(sel.type);
    if (!conn) return;

    this.savingMappings.set(true);
    const body = {
      connectorType: conn.connectorType,
      displayName: conn.displayName,
      configJson: JSON.stringify(conn.configJson || {}),
      mappingRulesJson: JSON.stringify(this.mappingState[sel.type] || [])
    };

    this.http.post<Connector>('/api/evidence-harvester/connectors', body).subscribe({
      next: () => {
        this.savingMappings.set(false);
        this.updatePillarCoverage(this.stats().coveragePercent);
      },
      error: () => {
        this.savingMappings.set(false);
        this.updatePillarCoverage(this.stats().coveragePercent);
      }
    });
  }

  formatTime(dateStr: string | null): string {
    if (!dateStr) return this.lang.l('Mitte kunagi', 'Never');
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return this.lang.l('Just nüüd', 'Just now');
    if (diffMin < 60) return `${diffMin} ${this.lang.l('min tagasi', 'min ago')}`;
    if (diffHour < 24) return `${diffHour} ${this.lang.l('t tagasi', 'h ago')}`;
    if (diffDay < 7) return `${diffDay} ${this.lang.l('p tagasi', 'd ago')}`;
    return date.toLocaleDateString();
  }

  getConnectorBg(type: string): string {
    const def = this.connectorDefs.find(d => d.type === type);
    return def?.bgClass || 'bg-slate-700/50';
  }

  getConnectorText(type: string): string {
    const def = this.connectorDefs.find(d => d.type === type);
    return def?.textClass || 'text-slate-400';
  }

  getConnectorIcon(type: string): string {
    const def = this.connectorDefs.find(d => d.type === type);
    return def?.icon || '';
  }

  getPillarBadge(pillar: string): string {
    const map: Record<string, string> = {
      ICT_RISK: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      INCIDENT: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      TESTING: 'bg-blue-50 text-blue-600 border-blue-200',
      THIRD_PARTY: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      INFO_SHARING: 'bg-blue-50 text-blue-500 border-blue-500/30'
    };
    return map[pillar] || 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  }
}
