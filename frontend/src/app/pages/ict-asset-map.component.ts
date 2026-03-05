import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { LangService } from '../lang.service';
import { FormsModule } from '@angular/forms';

interface BusinessFunction {
  id: string;
  name: string;
  description: string;
  criticality: string;
  type: string;
}

interface IctAsset {
  id: string;
  name: string;
  description: string;
  assetType: string;
  rtoHours: number;
  rpoHours: number;
  type: string;
}

interface Provider {
  id: string;
  name: string;
  type: string;
  serviceType: string;
  criticality: string;
  country: string;
  riskScore: number;
}

interface MapLink {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  dependency: string;
}

interface RiskItem {
  function?: string;
  provider?: string;
  risk: string;
  severity: string;
  criticality?: string;
  dependencyCount?: number;
}

@Component({
  selector: 'app-ict-asset-map',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="max-w-7xl mx-auto space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-4">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
          </svg>
          DORA Art. 8
        </div>
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">ICT Asset & Dependency Map</h1>
        <p class="text-slate-400 max-w-2xl mx-auto">
          Map critical business functions to ICT assets and third-party providers. Identify single points of failure and concentration risks as required by DORA Article 8.
        </p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-4 text-center">
          <div class="text-2xl font-bold text-white">{{ functions().length }}</div>
          <div class="text-xs text-slate-400 mt-1">Business Functions</div>
        </div>
        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-4 text-center">
          <div class="text-2xl font-bold text-cyan-400">{{ assets().length }}</div>
          <div class="text-xs text-slate-400 mt-1">ICT Assets</div>
        </div>
        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-4 text-center">
          <div class="text-2xl font-bold text-violet-400">{{ providers().length }}</div>
          <div class="text-xs text-slate-400 mt-1">Providers</div>
        </div>
        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-4 text-center">
          <div class="text-2xl font-bold text-emerald-400">{{ links().length }}</div>
          <div class="text-xs text-slate-400 mt-1">Dependencies</div>
        </div>
        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-4 text-center"
             [class]="'bg-slate-800/50 backdrop-blur border rounded-2xl p-4 text-center ' + riskBorderClass()">
          <div class="text-2xl font-bold" [class]="riskColorClass()">{{ riskAnalysis()?.riskLevel || 'N/A' }}</div>
          <div class="text-xs text-slate-400 mt-1">Risk Level</div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-3 justify-center">
        <button (click)="showAddFunction = true"
                class="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-all">
          + Add Business Function
        </button>
        <button (click)="showAddAsset = true"
                class="px-4 py-2 bg-violet-500/20 border border-violet-500/30 rounded-xl text-violet-400 text-sm font-medium hover:bg-violet-500/30 transition-all">
          + Add ICT Asset
        </button>
        <button (click)="showAddLink = true"
                class="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-all"
                [disabled]="functions().length === 0 && assets().length === 0">
          + Add Dependency Link
        </button>
        <button (click)="loadRiskAnalysis()"
                class="px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-all">
          Analyze Risks
        </button>
      </div>

      <!-- Add Function Modal -->
      @if (showAddFunction) {
      <div class="bg-slate-800/80 backdrop-blur border border-cyan-500/30 rounded-2xl p-6 space-y-4">
        <h3 class="text-lg font-semibold text-white">Add Business Function</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-xs text-slate-400 mb-1 block">Function Name</label>
            <input [(ngModel)]="newFunction.name" placeholder="e.g. Payment Processing"
                   class="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white text-sm focus:border-cyan-500/50 focus:outline-none">
          </div>
          <div>
            <label class="text-xs text-slate-400 mb-1 block">Criticality</label>
            <select [(ngModel)]="newFunction.criticality"
                    class="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white text-sm focus:border-cyan-500/50 focus:outline-none">
              <option value="CRITICAL">Critical</option>
              <option value="IMPORTANT">Important</option>
              <option value="NORMAL">Normal</option>
            </select>
          </div>
        </div>
        <div>
          <label class="text-xs text-slate-400 mb-1 block">Description</label>
          <input [(ngModel)]="newFunction.description" placeholder="Brief description..."
                 class="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white text-sm focus:border-cyan-500/50 focus:outline-none">
        </div>
        <div class="flex gap-3 justify-end">
          <button (click)="showAddFunction = false" class="px-4 py-2 text-slate-400 text-sm hover:text-white">Cancel</button>
          <button (click)="addFunction()" class="px-4 py-2 bg-cyan-500 text-white text-sm rounded-lg hover:bg-cyan-600">Add Function</button>
        </div>
      </div>
      }

      <!-- Add Asset Modal -->
      @if (showAddAsset) {
      <div class="bg-slate-800/80 backdrop-blur border border-violet-500/30 rounded-2xl p-6 space-y-4">
        <h3 class="text-lg font-semibold text-white">Add ICT Asset</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-xs text-slate-400 mb-1 block">Asset Name</label>
            <input [(ngModel)]="newAsset.name" placeholder="e.g. Core Banking System"
                   class="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white text-sm focus:border-violet-500/50 focus:outline-none">
          </div>
          <div>
            <label class="text-xs text-slate-400 mb-1 block">Asset Type</label>
            <select [(ngModel)]="newAsset.assetType"
                    class="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white text-sm focus:border-violet-500/50 focus:outline-none">
              <option value="APPLICATION">Application</option>
              <option value="DATABASE">Database</option>
              <option value="NETWORK">Network Infrastructure</option>
              <option value="SERVER">Server / VM</option>
              <option value="CLOUD_SERVICE">Cloud Service</option>
              <option value="API">API / Integration</option>
              <option value="SECURITY">Security System</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-slate-400 mb-1 block">RTO (hours)</label>
            <input type="number" [(ngModel)]="newAsset.rtoHours" placeholder="24"
                   class="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white text-sm focus:border-violet-500/50 focus:outline-none">
          </div>
          <div>
            <label class="text-xs text-slate-400 mb-1 block">RPO (hours)</label>
            <input type="number" [(ngModel)]="newAsset.rpoHours" placeholder="4"
                   class="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white text-sm focus:border-violet-500/50 focus:outline-none">
          </div>
        </div>
        <div>
          <label class="text-xs text-slate-400 mb-1 block">Description</label>
          <input [(ngModel)]="newAsset.description" placeholder="Brief description..."
                 class="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white text-sm focus:border-violet-500/50 focus:outline-none">
        </div>
        <div class="flex gap-3 justify-end">
          <button (click)="showAddAsset = false" class="px-4 py-2 text-slate-400 text-sm hover:text-white">Cancel</button>
          <button (click)="addAsset()" class="px-4 py-2 bg-violet-500 text-white text-sm rounded-lg hover:bg-violet-600">Add Asset</button>
        </div>
      </div>
      }

      <!-- Add Link Modal -->
      @if (showAddLink) {
      <div class="bg-slate-800/80 backdrop-blur border border-emerald-500/30 rounded-2xl p-6 space-y-4">
        <h3 class="text-lg font-semibold text-white">Add Dependency Link</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-xs text-slate-400 mb-1 block">Source (Function or Asset)</label>
            <select [(ngModel)]="newLink.sourceId"
                    class="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white text-sm focus:border-emerald-500/50 focus:outline-none">
              <option value="">-- Select Source --</option>
              @for (f of functions(); track f.id) {
                <option [value]="f.id">Function: {{ f.name }}</option>
              }
              @for (a of assets(); track a.id) {
                <option [value]="a.id">Asset: {{ a.name }}</option>
              }
            </select>
          </div>
          <div>
            <label class="text-xs text-slate-400 mb-1 block">Target (Asset or Provider)</label>
            <select [(ngModel)]="newLink.targetId"
                    class="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white text-sm focus:border-emerald-500/50 focus:outline-none">
              <option value="">-- Select Target --</option>
              @for (a of assets(); track a.id) {
                <option [value]="a.id">Asset: {{ a.name }}</option>
              }
              @for (p of providers(); track p.id) {
                <option [value]="p.id">Provider: {{ p.name }}</option>
              }
            </select>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-xs text-slate-400 mb-1 block">Dependency Type</label>
            <select [(ngModel)]="newLink.dependency"
                    class="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white text-sm focus:border-emerald-500/50 focus:outline-none">
              <option value="REQUIRED">Required (cannot function without)</option>
              <option value="OPTIONAL">Optional (degraded operation possible)</option>
              <option value="BACKUP">Backup (failover target)</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-slate-400 mb-1 block">Label (optional)</label>
            <input [(ngModel)]="newLink.label" placeholder="e.g. Primary DB connection"
                   class="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white text-sm focus:border-emerald-500/50 focus:outline-none">
          </div>
        </div>
        <div class="flex gap-3 justify-end">
          <button (click)="showAddLink = false" class="px-4 py-2 text-slate-400 text-sm hover:text-white">Cancel</button>
          <button (click)="addLink()" class="px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600">Add Link</button>
        </div>
      </div>
      }

      <!-- Dependency Map Visualization -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Business Functions Column -->
        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-cyan-500"></div>
            Business Functions ({{ functions().length }})
          </h3>
          @for (func of functions(); track func.id) {
          <div class="bg-slate-800/50 backdrop-blur border border-cyan-500/20 rounded-xl p-4 hover:border-cyan-500/40 transition-all group">
            <div class="flex items-start justify-between">
              <div>
                <h4 class="text-sm font-medium text-white">{{ func.name }}</h4>
                @if (func.description) {
                  <p class="text-xs text-slate-400 mt-1">{{ func.description }}</p>
                }
              </div>
              <button (click)="deleteFunction(func.id)" class="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="mt-2 flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    [class]="func.criticality === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                           : func.criticality === 'IMPORTANT' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                           : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'">
                {{ func.criticality }}
              </span>
              <span class="text-[10px] text-slate-500">{{ getLinksFrom(func.id).length }} dependencies</span>
            </div>
          </div>
          } @empty {
          <div class="text-center py-8 text-slate-500 text-sm">
            No business functions yet.<br>Add your critical and important functions.
          </div>
          }
        </div>

        <!-- ICT Assets Column -->
        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-violet-400 uppercase tracking-wider flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-violet-500"></div>
            ICT Assets ({{ assets().length }})
          </h3>
          @for (asset of assets(); track asset.id) {
          <div class="bg-slate-800/50 backdrop-blur border border-violet-500/20 rounded-xl p-4 hover:border-violet-500/40 transition-all group">
            <div class="flex items-start justify-between">
              <div>
                <h4 class="text-sm font-medium text-white">{{ asset.name }}</h4>
                @if (asset.description) {
                  <p class="text-xs text-slate-400 mt-1">{{ asset.description }}</p>
                }
              </div>
              <button (click)="deleteAsset(asset.id)" class="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <span class="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] text-violet-400">
                {{ asset.assetType }}
              </span>
              <span class="text-[10px] text-slate-500">RTO: {{ asset.rtoHours }}h | RPO: {{ asset.rpoHours }}h</span>
            </div>
          </div>
          } @empty {
          <div class="text-center py-8 text-slate-500 text-sm">
            No ICT assets yet.<br>Add your applications, databases, and systems.
          </div>
          }
        </div>

        <!-- Providers Column -->
        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
            ICT Providers ({{ providers().length }})
          </h3>
          @for (provider of providers(); track provider.id) {
          <div class="bg-slate-800/50 backdrop-blur border border-emerald-500/20 rounded-xl p-4 hover:border-emerald-500/40 transition-all">
            <div>
              <h4 class="text-sm font-medium text-white">{{ provider.name }}</h4>
              <p class="text-xs text-slate-400 mt-1">{{ provider.serviceType }} {{ provider.country ? '(' + provider.country + ')' : '' }}</p>
            </div>
            <div class="mt-2 flex items-center gap-2">
              @if (provider.criticality) {
              <span class="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    [class]="provider.criticality === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                           : provider.criticality === 'IMPORTANT' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                           : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'">
                {{ provider.criticality }}
              </span>
              }
              @if (provider.riskScore != null) {
              <span class="text-[10px] text-slate-500">Risk: {{ provider.riskScore }}/100</span>
              }
            </div>
          </div>
          } @empty {
          <div class="text-center py-8 text-slate-500 text-sm">
            No ICT providers registered.<br>
            <a href="/supply-chain" class="text-cyan-400 hover:underline">Add providers in Supply Chain</a>
          </div>
          }
        </div>
      </div>

      <!-- Dependency Links -->
      @if (links().length > 0) {
      <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
        <h3 class="text-sm font-semibold text-white mb-4">Dependency Links ({{ links().length }})</h3>
        <div class="space-y-2">
          @for (link of links(); track link.id) {
          <div class="flex items-center gap-3 py-2 px-3 bg-slate-900/30 rounded-lg group">
            <span class="text-sm text-white flex-shrink-0">{{ getNodeName(link.sourceId) }}</span>
            <div class="flex-1 flex items-center gap-2">
              <div class="flex-1 h-px" [class]="link.dependency === 'REQUIRED' ? 'bg-red-500/30' : link.dependency === 'BACKUP' ? 'bg-emerald-500/30' : 'bg-slate-600'"></div>
              <span class="px-2 py-0.5 rounded text-[10px]"
                    [class]="link.dependency === 'REQUIRED' ? 'bg-red-500/10 text-red-400'
                           : link.dependency === 'BACKUP' ? 'bg-emerald-500/10 text-emerald-400'
                           : 'bg-slate-700/50 text-slate-400'">
                {{ link.dependency }}
              </span>
              <div class="flex-1 h-px" [class]="link.dependency === 'REQUIRED' ? 'bg-red-500/30' : link.dependency === 'BACKUP' ? 'bg-emerald-500/30' : 'bg-slate-600'"></div>
              <svg class="w-3 h-3 text-slate-500" fill="currentColor" viewBox="0 0 24 24"><path d="M5 12h14m-4-4l4 4-4 4"/></svg>
            </div>
            <span class="text-sm text-white flex-shrink-0">{{ getNodeName(link.targetId) }}</span>
            <button (click)="deleteLink(link.id)" class="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all ml-2">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          }
        </div>
      </div>
      }

      <!-- Risk Analysis -->
      @if (riskAnalysis()) {
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-white">Risk Analysis</h3>

        @if (riskAnalysis()!.singlePointsOfFailure.length > 0) {
        <div class="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
          <h4 class="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
            Single Points of Failure ({{ riskAnalysis()!.singlePointsOfFailure.length }})
          </h4>
          @for (risk of riskAnalysis()!.singlePointsOfFailure; track $index) {
          <div class="flex items-start gap-3 py-2 border-t border-red-500/10 first:border-0">
            <span class="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400">{{ risk.severity }}</span>
            <div>
              <div class="text-sm text-white">{{ risk.function }}</div>
              <div class="text-xs text-slate-400 mt-0.5">{{ risk.risk }}</div>
            </div>
          </div>
          }
        </div>
        }

        @if (riskAnalysis()!.concentrationRisks.length > 0) {
        <div class="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
          <h4 class="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            Concentration Risks ({{ riskAnalysis()!.concentrationRisks.length }})
          </h4>
          @for (risk of riskAnalysis()!.concentrationRisks; track $index) {
          <div class="flex items-start gap-3 py-2 border-t border-amber-500/10 first:border-0">
            <span class="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400">{{ risk.severity }}</span>
            <div>
              <div class="text-sm text-white">{{ risk.provider }}</div>
              <div class="text-xs text-slate-400 mt-0.5">{{ risk.risk }}</div>
            </div>
          </div>
          }
        </div>
        }

        @if (riskAnalysis()!.unmappedFunctions.length > 0) {
        <div class="bg-slate-700/30 border border-slate-600/30 rounded-2xl p-5">
          <h4 class="text-sm font-semibold text-slate-300 mb-3">
            Unmapped Functions ({{ riskAnalysis()!.unmappedFunctions.length }})
          </h4>
          @for (risk of riskAnalysis()!.unmappedFunctions; track $index) {
          <div class="flex items-start gap-3 py-2 border-t border-slate-700/30 first:border-0">
            <span class="px-2 py-0.5 rounded text-[10px] bg-slate-600/50 text-slate-300">{{ risk.severity }}</span>
            <div>
              <div class="text-sm text-white">{{ risk.function }}</div>
              <div class="text-xs text-slate-400 mt-0.5">{{ risk.risk }}</div>
            </div>
          </div>
          }
        </div>
        }

        @if (riskAnalysis()!.totalRisks === 0) {
        <div class="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 text-center">
          <div class="text-emerald-400 text-lg font-semibold mb-1">No Risks Detected</div>
          <div class="text-sm text-slate-400">Your ICT asset mapping looks well-structured. Continue to maintain and update it regularly.</div>
        </div>
        }
      </div>
      }

      <!-- Loading State -->
      @if (loading()) {
      <div class="flex flex-col items-center gap-3 py-16">
        <svg class="w-8 h-8 text-cyan-400 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <span class="text-slate-400 text-sm">Loading dependency map...</span>
      </div>
      }
    </div>
  `
})
export class IctAssetMapComponent implements OnInit {
  functions = signal<BusinessFunction[]>([]);
  assets = signal<IctAsset[]>([]);
  providers = signal<Provider[]>([]);
  links = signal<MapLink[]>([]);
  riskAnalysis = signal<{ singlePointsOfFailure: RiskItem[]; concentrationRisks: RiskItem[]; unmappedFunctions: RiskItem[]; totalRisks: number; riskLevel: string } | null>(null);
  loading = signal(false);

  showAddFunction = false;
  showAddAsset = false;
  showAddLink = false;

  newFunction = { name: '', description: '', criticality: 'NORMAL' };
  newAsset = { name: '', description: '', assetType: 'APPLICATION', rtoHours: 24, rpoHours: 4 };
  newLink = { sourceId: '', targetId: '', label: '', dependency: 'REQUIRED' };

  riskBorderClass = computed(() => {
    const level = this.riskAnalysis()?.riskLevel;
    if (level === 'CRITICAL') return 'border-red-500/40';
    if (level === 'HIGH') return 'border-amber-500/40';
    if (level === 'MEDIUM') return 'border-yellow-500/40';
    return 'border-emerald-500/40';
  });

  riskColorClass = computed(() => {
    const level = this.riskAnalysis()?.riskLevel;
    if (level === 'CRITICAL') return 'text-red-400';
    if (level === 'HIGH') return 'text-amber-400';
    if (level === 'MEDIUM') return 'text-yellow-400';
    return 'text-emerald-400';
  });

  private readonly destroyRef = inject(DestroyRef);

  constructor(public lang: LangService, private http: HttpClient) {}

  ngOnInit() {
    this.loadMap();
  }

  loadMap() {
    this.loading.set(true);
    this.http.get<any>('/api/ict-asset-map').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.functions.set(data.functions || []);
        this.assets.set(data.assets || []);
        this.providers.set(data.providers || []);
        this.links.set(data.links || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  addFunction() {
    if (!this.newFunction.name.trim()) return;
    this.http.post<any>('/api/ict-asset-map/functions', this.newFunction).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res.function) {
          this.functions.update(fns => [...fns, res.function]);
        }
        this.showAddFunction = false;
        this.newFunction = { name: '', description: '', criticality: 'NORMAL' };
      },
      error: () => {}
    });
  }

  addAsset() {
    if (!this.newAsset.name.trim()) return;
    this.http.post<any>('/api/ict-asset-map/assets', this.newAsset).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res.asset) {
          this.assets.update(a => [...a, res.asset]);
        }
        this.showAddAsset = false;
        this.newAsset = { name: '', description: '', assetType: 'APPLICATION', rtoHours: 24, rpoHours: 4 };
      },
      error: () => {}
    });
  }

  addLink() {
    if (!this.newLink.sourceId || !this.newLink.targetId || this.newLink.sourceId === this.newLink.targetId) return;
    this.http.post<any>('/api/ict-asset-map/links', this.newLink).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res.link) {
          this.links.update(l => [...l, res.link]);
        }
        this.showAddLink = false;
        this.newLink = { sourceId: '', targetId: '', label: '', dependency: 'REQUIRED' };
      },
      error: () => {}
    });
  }

  deleteFunction(id: string) {
    this.http.delete<any>(`/api/ict-asset-map/functions/${id}`).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.functions.update(fns => fns.filter(f => f.id !== id));
        this.links.update(ls => ls.filter(l => l.sourceId !== id && l.targetId !== id));
      },
      error: () => {}
    });
  }

  deleteAsset(id: string) {
    this.http.delete<any>(`/api/ict-asset-map/assets/${id}`).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.assets.update(a => a.filter(x => x.id !== id));
        this.links.update(ls => ls.filter(l => l.sourceId !== id && l.targetId !== id));
      },
      error: () => {}
    });
  }

  deleteLink(id: string) {
    this.http.delete<any>(`/api/ict-asset-map/links/${id}`).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.links.update(ls => ls.filter(l => l.id !== id)),
      error: () => {}
    });
  }

  loadRiskAnalysis() {
    this.http.get<any>('/api/ict-asset-map/risk-analysis').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.riskAnalysis.set(data),
      error: () => {}
    });
  }

  getLinksFrom(nodeId: string): MapLink[] {
    return this.links().filter(l => l.sourceId === nodeId);
  }

  getNodeName(id: string): string {
    const func = this.functions().find(f => f.id === id);
    if (func) return func.name;
    const asset = this.assets().find(a => a.id === id);
    if (asset) return asset.name;
    const provider = this.providers().find(p => p.id === id);
    if (provider) return provider.name;
    return id;
  }
}
