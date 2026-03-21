import { Component, OnInit, OnDestroy, inject, signal, computed, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { LangService } from '../lang.service';

// vis-network imports
import { Network, DataSet, Options } from 'vis-network/standalone';

interface GraphNode {
  id: string; label: string;
  type: 'function' | 'asset' | 'provider';
  criticality?: string; riskScore?: number;
  assetType?: string; serviceType?: string;
  country?: string; hasExitStrategy?: boolean;
  contractEndDate?: string; description?: string;
}
interface GraphEdge {
  id: string; from: string; to: string;
  dependency: 'REQUIRED' | 'OPTIONAL' | 'BACKUP';
}
interface DigitalTwinData {
  nodes: GraphNode[]; edges: GraphEdge[];
  riskAnalysis: { singlePointsOfFailure: any[]; concentrationRisks: any[]; unmappedFunctions: any[]; totalRisks: number; riskLevel: string };
  complianceGaps: { nodeId: string; nodeName: string; gaps: string[] }[];
  stats: { totalFunctions: number; totalAssets: number; totalProviders: number; totalLinks: number; criticalFunctions: number; complianceCoverage: number };
}
interface SimulationResult {
  removedNodeId: string; removedNodeName: string;
  severity: string; affectedFunctions: string[];
  affectedAssets: string[]; affectedNodeIds: string[];
  criticalFunctionsAffected: number; estimatedRecoveryHours: number;
}

@Component({
  selector: 'app-digital-twin',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-[1600px] mx-auto px-4">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4">
          <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
          <span class="text-sm font-medium text-violet-300">{{ lang.t('dt.badge') }}</span>
        </div>
        <h1 class="text-3xl font-bold text-slate-900 mb-2">{{ lang.t('dt.title') }}</h1>
        <p class="text-slate-400">{{ lang.t('dt.subtitle') }}</p>
      </div>

      <!-- Empty State -->
      @if (!loading() && data() && data()!.nodes.length === 0) {
        <div class="glass-card p-12 text-center">
          <div class="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-6 border border-slate-200">
            <svg class="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z"/></svg>
          </div>
          <h2 class="text-xl font-bold text-slate-700 mb-2">{{ lang.t('dt.empty_title') }}</h2>
          <p class="text-slate-400 mb-6">{{ lang.t('dt.empty_desc') }}</p>
          <a routerLink="/ict-asset-map" class="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-blue-500 text-slate-900 font-semibold px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all">
            {{ lang.t('dt.empty_cta') }}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
          </a>
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="flex items-center justify-center py-32">
          <div class="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
        </div>
      }

      <!-- Main Content -->
      @if (!loading() && data() && data()!.nodes.length > 0) {
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">

          <!-- Left Panel: Stats -->
          <div class="lg:col-span-3 space-y-4">
            <!-- Stats Card -->
            <div class="glass-card p-4">
              <h3 class="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">{{ lang.t('dt.stats_title') }}</h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-slate-400 text-sm">{{ lang.t('dt.stats_functions') }}</span>
                  <span class="text-slate-900 font-bold">{{ data()!.stats.totalFunctions }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-400 text-sm">{{ lang.t('dt.stats_assets') }}</span>
                  <span class="text-slate-900 font-bold">{{ data()!.stats.totalAssets }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-400 text-sm">{{ lang.t('dt.stats_providers') }}</span>
                  <span class="text-slate-900 font-bold">{{ data()!.stats.totalProviders }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-400 text-sm">{{ lang.t('dt.stats_links') }}</span>
                  <span class="text-slate-900 font-bold">{{ data()!.stats.totalLinks }}</span>
                </div>
                <div class="border-t border-slate-200 pt-3">
                  <div class="flex items-center justify-between">
                    <span class="text-slate-400 text-sm">{{ lang.t('dt.stats_critical') }}</span>
                    <span class="text-red-400 font-bold">{{ data()!.stats.criticalFunctions }}</span>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-400 text-sm">{{ lang.t('dt.stats_coverage') }}</span>
                  <span class="font-bold" [class]="data()!.stats.complianceCoverage >= 80 ? 'text-blue-600' : data()!.stats.complianceCoverage >= 50 ? 'text-amber-400' : 'text-red-400'">{{ data()!.stats.complianceCoverage }}%</span>
                </div>
              </div>
            </div>

            <!-- Risk Distribution -->
            <div class="glass-card p-4">
              <h3 class="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">{{ lang.t('dt.risk_title') }}</h3>
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-red-500"></div>
                  <span class="text-sm text-slate-400">{{ lang.t('dt.risk_spof') }}</span>
                  <span class="ml-auto text-sm font-bold text-slate-700">{{ data()!.riskAnalysis.singlePointsOfFailure.length }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span class="text-sm text-slate-400">{{ lang.t('dt.risk_concentration') }}</span>
                  <span class="ml-auto text-sm font-bold text-slate-700">{{ data()!.riskAnalysis.concentrationRisks.length }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-blue-600"></div>
                  <span class="text-sm text-slate-400">{{ lang.t('dt.risk_unmapped') }}</span>
                  <span class="ml-auto text-sm font-bold text-slate-700">{{ data()!.riskAnalysis.unmappedFunctions.length }}</span>
                </div>
              </div>
              @if (data()!.complianceGaps.length > 0) {
                <div class="mt-3 pt-3 border-t border-slate-200">
                  <h4 class="text-xs font-semibold text-amber-400 mb-2 uppercase">{{ lang.t('dt.compliance_gaps') }}</h4>
                  @for (gap of data()!.complianceGaps.slice(0, 5); track gap.nodeId) {
                    <div class="text-xs text-slate-400 mb-1">
                      <span class="text-slate-600">{{ gap.nodeName }}</span>: {{ gap.gaps[0] }}
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Center: Graph Canvas -->
          <div class="lg:col-span-6 space-y-3">
            <!-- Toolbar -->
            <div class="glass-card p-3 flex flex-wrap items-center gap-2">
              <!-- Simulation Toggle -->
              <button (click)="toggleSimulation()"
                [class]="simulationMode() ? 'bg-red-500/20 border-red-500/50 text-red-300' : 'bg-slate-700/50 border-slate-200 text-slate-600 hover:bg-slate-100'"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                {{ lang.t('dt.simulation_mode') }}
              </button>

              <div class="w-px h-6 bg-slate-700"></div>

              <!-- Overlay Buttons -->
              <button (click)="toggleOverlay('concentration')"
                [class]="activeOverlay() === 'concentration' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-slate-700/50 border-slate-200 text-slate-400 hover:text-slate-600'"
                class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all">
                {{ lang.t('dt.overlay_concentration') }}
              </button>
              <button (click)="toggleOverlay('spof')"
                [class]="activeOverlay() === 'spof' ? 'bg-red-500/20 border-red-500/50 text-red-300' : 'bg-slate-700/50 border-slate-200 text-slate-400 hover:text-slate-600'"
                class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all">
                {{ lang.t('dt.overlay_spof') }}
              </button>
              <button (click)="toggleOverlay('compliance')"
                [class]="activeOverlay() === 'compliance' ? 'bg-violet-500/20 border-violet-500/50 text-violet-300' : 'bg-slate-700/50 border-slate-200 text-slate-400 hover:text-slate-600'"
                class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all">
                {{ lang.t('dt.overlay_compliance') }}
              </button>

              <div class="ml-auto flex items-center gap-1.5">
                <button (click)="zoomIn()" class="p-1.5 rounded-lg bg-slate-700/50 border border-slate-200 text-slate-400 hover:text-slate-700 transition-all">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/></svg>
                </button>
                <button (click)="zoomOut()" class="p-1.5 rounded-lg bg-slate-700/50 border border-slate-200 text-slate-400 hover:text-slate-700 transition-all">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"/></svg>
                </button>
                <button (click)="fitGraph()" class="p-1.5 rounded-lg bg-slate-700/50 border border-slate-200 text-slate-400 hover:text-slate-700 transition-all">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
                </button>
              </div>
            </div>

            <!-- Simulation Banner -->
            @if (simulationMode()) {
              <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-red-300">{{ lang.t('dt.simulate_active') }}</p>
                  <p class="text-xs text-red-400/70">{{ lang.t('dt.simulate_hint') }}</p>
                </div>
                @if (simulation()) {
                  <button (click)="clearSimulation()" class="text-xs text-red-400 hover:text-red-300 underline flex-shrink-0">{{ lang.t('dt.simulate_reset') }}</button>
                }
              </div>
            }

            <!-- Impact Banner -->
            @if (simulation()) {
              <div class="rounded-xl p-4 border"
                [class]="simulation()!.severity === 'CRITICAL' ? 'bg-red-500/10 border-red-500/30' : simulation()!.severity === 'HIGH' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-blue-50 border-blue-500/30'">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-sm font-semibold" [class]="simulation()!.severity === 'CRITICAL' ? 'text-red-300' : simulation()!.severity === 'HIGH' ? 'text-amber-300' : 'text-blue-400'">
                    {{ lang.t('dt.simulate_impact') }}: {{ simulation()!.removedNodeName }}
                  </h4>
                  <span class="px-2 py-0.5 rounded-full text-xs font-bold"
                    [class]="simulation()!.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-300' : simulation()!.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300' : simulation()!.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-100 text-blue-500'">
                    {{ simulation()!.severity }}
                  </span>
                </div>
                <div class="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div class="text-lg font-bold text-slate-900">{{ simulation()!.affectedFunctions.length }}</div>
                    <div class="text-xs text-slate-400">{{ lang.t('dt.simulate_functions') }}</div>
                  </div>
                  <div>
                    <div class="text-lg font-bold text-slate-900">{{ simulation()!.affectedAssets.length }}</div>
                    <div class="text-xs text-slate-400">{{ lang.t('dt.simulate_assets') }}</div>
                  </div>
                  <div>
                    <div class="text-lg font-bold text-slate-900">{{ simulation()!.estimatedRecoveryHours }}h</div>
                    <div class="text-xs text-slate-400">{{ lang.t('dt.simulate_recovery') }}</div>
                  </div>
                </div>
              </div>
            }

            <!-- Graph Canvas -->
            <div class="glass-card p-0 overflow-hidden relative" style="min-height: 520px">
              <div #graphContainer style="width: 100%; height: 520px;"></div>
            </div>

            <!-- Legend -->
            <div class="glass-card p-3">
              <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                <span class="text-slate-500 font-semibold uppercase tracking-wider mr-1">{{ lang.t('dt.legend') }}</span>
                <span class="flex items-center gap-1.5"><span class="w-4 h-4 rounded bg-violet-500/60 inline-block" style="clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"></span> <span class="text-slate-400">{{ lang.t('dt.legend_function') }}</span></span>
                <span class="flex items-center gap-1.5"><span class="w-3.5 h-3.5 rounded-full bg-blue-500/60 inline-block"></span> <span class="text-slate-400">{{ lang.t('dt.legend_asset') }}</span></span>
                <span class="flex items-center gap-1.5"><span class="w-3.5 h-3.5 rounded-sm bg-blue-600/60 inline-block"></span> <span class="text-slate-400">{{ lang.t('dt.legend_provider') }}</span></span>
                <span class="w-px h-4 bg-slate-700"></span>
                <span class="flex items-center gap-1.5"><span class="w-5 h-0.5 bg-red-400 inline-block"></span> <span class="text-slate-400">{{ lang.t('dt.legend_required') }}</span></span>
                <span class="flex items-center gap-1.5"><span class="w-5 h-0.5 bg-slate-500 inline-block" style="border-top: 2px dashed"></span> <span class="text-slate-400">{{ lang.t('dt.legend_optional') }}</span></span>
                <span class="flex items-center gap-1.5"><span class="w-5 h-0.5 bg-blue-500 inline-block" style="border-top: 2px dotted"></span> <span class="text-slate-400">{{ lang.t('dt.legend_backup') }}</span></span>
              </div>
            </div>
          </div>

          <!-- Right Panel: Details -->
          <div class="lg:col-span-3 space-y-4">
            @if (selectedNode()) {
              <div class="glass-card p-4">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                    [class]="selectedNode()!.type === 'function' ? 'bg-violet-500/20' : selectedNode()!.type === 'asset' ? 'bg-blue-500/20' : 'bg-blue-100'">
                    @if (selectedNode()!.type === 'function') {
                      <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                    } @else if (selectedNode()!.type === 'asset') {
                      <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    } @else {
                      <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                    }
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-bold text-slate-900 truncate">{{ selectedNode()!.label }}</h3>
                    <span class="text-xs px-1.5 py-0.5 rounded-full"
                      [class]="selectedNode()!.type === 'function' ? 'bg-violet-500/20 text-violet-300' : selectedNode()!.type === 'asset' ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-500'">
                      {{ selectedNode()!.type | titlecase }}
                    </span>
                  </div>
                </div>

                <div class="space-y-2 text-sm">
                  @if (selectedNode()!.criticality) {
                    <div class="flex items-center justify-between">
                      <span class="text-slate-400">{{ lang.t('dt.detail_criticality') }}</span>
                      <span class="font-medium" [class]="selectedNode()!.criticality === 'CRITICAL' ? 'text-red-400' : selectedNode()!.criticality === 'HIGH' || selectedNode()!.criticality === 'IMPORTANT' ? 'text-amber-400' : 'text-blue-500'">{{ selectedNode()!.criticality }}</span>
                    </div>
                  }
                  @if (selectedNode()!.riskScore != null) {
                    <div class="flex items-center justify-between">
                      <span class="text-slate-400">{{ lang.t('dt.detail_risk_score') }}</span>
                      <span class="font-medium" [class]="selectedNode()!.riskScore! >= 70 ? 'text-red-400' : selectedNode()!.riskScore! >= 40 ? 'text-amber-400' : 'text-blue-600'">{{ selectedNode()!.riskScore }}</span>
                    </div>
                  }
                  @if (selectedNode()!.assetType) {
                    <div class="flex items-center justify-between">
                      <span class="text-slate-400">{{ lang.t('dt.detail_type') }}</span>
                      <span class="text-slate-700">{{ selectedNode()!.assetType }}</span>
                    </div>
                  }
                  @if (selectedNode()!.serviceType) {
                    <div class="flex items-center justify-between">
                      <span class="text-slate-400">{{ lang.t('dt.detail_service') }}</span>
                      <span class="text-slate-700">{{ selectedNode()!.serviceType }}</span>
                    </div>
                  }
                  @if (selectedNode()!.country) {
                    <div class="flex items-center justify-between">
                      <span class="text-slate-400">{{ lang.t('dt.detail_country') }}</span>
                      <span class="text-slate-700">{{ selectedNode()!.country }}</span>
                    </div>
                  }
                  @if (selectedNode()!.hasExitStrategy != null) {
                    <div class="flex items-center justify-between">
                      <span class="text-slate-400">{{ lang.t('dt.detail_exit') }}</span>
                      <span [class]="selectedNode()!.hasExitStrategy ? 'text-blue-600' : 'text-red-400'">{{ selectedNode()!.hasExitStrategy ? 'Yes' : 'No' }}</span>
                    </div>
                  }
                  @if (selectedNode()!.contractEndDate) {
                    <div class="flex items-center justify-between">
                      <span class="text-slate-400">{{ lang.t('dt.detail_contract') }}</span>
                      <span class="text-slate-700">{{ selectedNode()!.contractEndDate }}</span>
                    </div>
                  }
                  @if (selectedNode()!.description) {
                    <div class="pt-2 border-t border-slate-200">
                      <span class="text-slate-400 text-xs">{{ selectedNode()!.description }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Connected Nodes -->
              @if (connectedNodes().length > 0) {
                <div class="glass-card p-4">
                  <h3 class="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">{{ lang.t('dt.detail_connected') }}</h3>
                  <div class="space-y-1.5 max-h-48 overflow-y-auto">
                    @for (cn of connectedNodes(); track cn.id) {
                      <button (click)="selectNodeById(cn.id)" class="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors group">
                        <div class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          [class]="cn.type === 'function' ? 'bg-violet-400' : cn.type === 'asset' ? 'bg-blue-400' : 'bg-blue-500'"></div>
                        <span class="text-sm text-slate-600 group-hover:text-slate-900 truncate">{{ cn.label }}</span>
                        <span class="text-[10px] ml-auto flex-shrink-0 px-1.5 rounded"
                          [class]="cn.edgeDep === 'REQUIRED' ? 'bg-red-500/20 text-red-400' : cn.edgeDep === 'BACKUP' ? 'bg-blue-100 text-blue-600' : 'bg-slate-600/50 text-slate-400'">{{ cn.edgeDep }}</span>
                      </button>
                    }
                  </div>
                </div>
              }
            } @else {
              <div class="glass-card p-6 text-center">
                <svg class="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/></svg>
                <p class="text-sm text-slate-400">{{ lang.t('dt.detail_select') }}</p>
              </div>
            }

            <!-- Simulation Impact Detail -->
            @if (simulation() && simulation()!.affectedFunctions.length > 0) {
              <div class="glass-card p-4">
                <h3 class="text-sm font-semibold text-red-300 mb-3 uppercase tracking-wider">{{ lang.t('dt.simulate_cascade') }}</h3>
                <div class="space-y-2">
                  <div>
                    <h4 class="text-xs text-slate-400 mb-1">{{ lang.t('dt.simulate_functions') }}</h4>
                    @for (fn of simulation()!.affectedFunctions; track fn) {
                      <div class="text-sm text-red-300 flex items-center gap-1.5 mb-0.5">
                        <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                        {{ fn }}
                      </div>
                    }
                  </div>
                  @if (simulation()!.affectedAssets.length > 0) {
                    <div class="pt-2 border-t border-slate-200">
                      <h4 class="text-xs text-slate-400 mb-1">{{ lang.t('dt.simulate_assets') }}</h4>
                      @for (a of simulation()!.affectedAssets; track a) {
                        <div class="text-sm text-amber-300 flex items-center gap-1.5 mb-0.5">
                          <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          {{ a }}
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .glass-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(51, 65, 85, 0.5);
      border-radius: 1rem;
      backdrop-filter: blur(12px);
    }
  `]
})
export class DigitalTwinComponent implements OnInit, AfterViewInit, OnDestroy {
  private http = inject(HttpClient);
  private titleService = inject(Title);
  lang = inject(LangService);

  @ViewChild('graphContainer', { static: false }) graphContainer!: ElementRef<HTMLDivElement>;

  loading = signal(true);
  data = signal<DigitalTwinData | null>(null);
  selectedNode = signal<GraphNode | null>(null);
  simulationMode = signal(false);
  simulation = signal<SimulationResult | null>(null);
  activeOverlay = signal<string | null>(null);

  private network: Network | null = null;
  private visNodes: DataSet<any> | null = null;
  private visEdges: DataSet<any> | null = null;
  private originalNodeStyles: Map<string, any> = new Map();

  connectedNodes = computed(() => {
    const sel = this.selectedNode();
    const d = this.data();
    if (!sel || !d) return [];
    const connected: { id: string; label: string; type: string; edgeDep: string }[] = [];
    for (const edge of d.edges) {
      if (edge.from === sel.id) {
        const node = d.nodes.find(n => n.id === edge.to);
        if (node) connected.push({ id: node.id, label: node.label, type: node.type, edgeDep: edge.dependency });
      }
      if (edge.to === sel.id) {
        const node = d.nodes.find(n => n.id === edge.from);
        if (node) connected.push({ id: node.id, label: node.label, type: node.type, edgeDep: edge.dependency });
      }
    }
    return connected;
  });

  ngOnInit() {
    this.titleService.setTitle(this.lang.t('dt.title') + ' | DoraAudit');
    this.loadData();
  }

  ngAfterViewInit() {
    // Network will be initialized after data loads
  }

  ngOnDestroy() {
    if (this.network) {
      this.network.destroy();
      this.network = null;
    }
  }

  loadData() {
    this.loading.set(true);
    this.http.get<DigitalTwinData>('/api/digital-twin').subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
        if (data.nodes.length > 0) {
          setTimeout(() => this.initNetwork(), 50);
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private initNetwork() {
    if (!this.graphContainer) return;
    const container = this.graphContainer.nativeElement;
    const d = this.data()!;

    // Build vis nodes
    const nodeData = d.nodes.map(n => {
      const visNode: any = {
        id: n.id,
        label: n.label,
        title: this.buildTooltip(n),
        ...this.getNodeStyle(n)
      };
      this.originalNodeStyles.set(n.id, { ...visNode });
      return visNode;
    });

    // Build vis edges
    const edgeData = d.edges.map(e => ({
      id: e.id,
      from: e.from,
      to: e.to,
      ...this.getEdgeStyle(e.dependency)
    }));

    this.visNodes = new DataSet(nodeData);
    this.visEdges = new DataSet(edgeData);

    const options: Options = {
      nodes: {
        font: { color: '#e2e8f0', size: 12, face: 'Inter, system-ui, sans-serif' },
        borderWidth: 2,
        shadow: { enabled: true, color: 'rgba(0,0,0,0.3)', size: 8, x: 0, y: 2 }
      },
      edges: {
        smooth: { enabled: true, type: 'continuous', roundness: 0.2 },
        font: { color: '#64748b', size: 9, face: 'Inter, system-ui, sans-serif', strokeWidth: 3, strokeColor: '#0f172a' }
      },
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -60,
          centralGravity: 0.008,
          springLength: 160,
          springConstant: 0.06,
          damping: 0.4
        },
        stabilization: { iterations: 150, fit: true }
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        navigationButtons: false,
        keyboard: false
      },
      layout: { improvedLayout: true }
    };

    this.network = new Network(container, { nodes: this.visNodes, edges: this.visEdges }, options);

    // Click handler
    this.network.on('click', (params: any) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = d.nodes.find(n => n.id === nodeId);
        this.selectedNode.set(node || null);

        if (this.simulationMode() && node) {
          this.runSimulation(nodeId);
        }
      } else {
        this.selectedNode.set(null);
      }
    });

    // Style background
    container.style.background = 'radial-gradient(ellipse at center, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.95) 70%)';
  }

  private getNodeStyle(node: GraphNode): any {
    if (node.type === 'function') {
      const color = node.criticality === 'CRITICAL' ? '#ef4444' : node.criticality === 'IMPORTANT' ? '#f59e0b' : '#06b6d4';
      return {
        shape: 'hexagon',
        color: { background: color + '33', border: color, highlight: { background: color + '55', border: color }, hover: { background: color + '44', border: color } },
        size: 22
      };
    }
    if (node.type === 'asset') {
      const typeColors: Record<string, string> = { APPLICATION: '#8b5cf6', DATABASE: '#3b82f6', INFRASTRUCTURE: '#14b8a6', NETWORK: '#06b6d4' };
      const color = typeColors[node.assetType || 'APPLICATION'] || '#8b5cf6';
      return {
        shape: 'dot',
        color: { background: color + '33', border: color, highlight: { background: color + '55', border: color }, hover: { background: color + '44', border: color } },
        size: 18
      };
    }
    // provider
    const score = node.riskScore || 0;
    const color = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#10b981';
    return {
      shape: 'square',
      color: { background: color + '33', border: color, highlight: { background: color + '55', border: color }, hover: { background: color + '44', border: color } },
      size: 20
    };
  }

  private getEdgeStyle(dep: string): any {
    if (dep === 'REQUIRED') {
      return { color: { color: '#ef4444', highlight: '#f87171', hover: '#f87171' }, width: 2, dashes: false };
    }
    if (dep === 'BACKUP') {
      return { color: { color: '#10b981', highlight: '#34d399', hover: '#34d399' }, width: 1.5, dashes: [4, 4] };
    }
    // OPTIONAL
    return { color: { color: '#64748b', highlight: '#94a3b8', hover: '#94a3b8' }, width: 1, dashes: [6, 4] };
  }

  private buildTooltip(node: GraphNode): string {
    let tip = `<b>${node.label}</b><br>Type: ${node.type}`;
    if (node.criticality) tip += `<br>Criticality: ${node.criticality}`;
    if (node.riskScore != null) tip += `<br>Risk Score: ${node.riskScore}`;
    if (node.serviceType) tip += `<br>Service: ${node.serviceType}`;
    if (node.country) tip += `<br>Country: ${node.country}`;
    return tip;
  }

  toggleSimulation() {
    const newVal = !this.simulationMode();
    this.simulationMode.set(newVal);
    if (!newVal) {
      this.clearSimulation();
    }
  }

  clearSimulation() {
    this.simulation.set(null);
    this.resetNodeStyles();
  }

  private runSimulation(nodeId: string) {
    this.http.post<SimulationResult>('/api/digital-twin/simulate', { removedNodeId: nodeId }).subscribe({
      next: (result) => {
        this.simulation.set(result);
        this.applySimulationVisuals(result);
      }
    });
  }

  private applySimulationVisuals(result: SimulationResult) {
    if (!this.visNodes) return;
    this.resetNodeStyles();

    // Removed node: fade to 30% opacity
    this.visNodes.update({ id: result.removedNodeId, opacity: 0.3, color: { background: '#374151', border: '#4b5563' } });

    // Affected assets: orange
    for (const nodeId of result.affectedNodeIds) {
      const d = this.data()!;
      const node = d.nodes.find(n => n.id === nodeId);
      if (node?.type === 'asset') {
        this.visNodes.update({ id: nodeId, color: { background: '#f59e0b44', border: '#f59e0b' } });
      } else if (node?.type === 'function') {
        this.visNodes.update({ id: nodeId, color: { background: '#ef444444', border: '#ef4444' }, borderWidth: 4 });
      }
    }
  }

  private resetNodeStyles() {
    if (!this.visNodes || !this.data()) return;
    for (const node of this.data()!.nodes) {
      const style = this.getNodeStyle(node);
      this.visNodes.update({ id: node.id, ...style, opacity: 1, borderWidth: 2 });
    }
  }

  toggleOverlay(overlay: string) {
    if (this.activeOverlay() === overlay) {
      this.activeOverlay.set(null);
      this.resetNodeStyles();
      return;
    }
    this.activeOverlay.set(overlay);
    this.applyOverlay(overlay);
  }

  private applyOverlay(overlay: string) {
    if (!this.visNodes || !this.data()) return;
    this.resetNodeStyles();
    const d = this.data()!;

    if (overlay === 'concentration') {
      for (const cr of d.riskAnalysis.concentrationRisks) {
        const providerName = cr.provider;
        const node = d.nodes.find(n => n.label === providerName && n.type === 'provider');
        if (node) {
          this.visNodes.update({ id: node.id, borderWidth: 5, color: { background: '#f59e0b44', border: '#f59e0b' }, shadow: { enabled: true, color: '#f59e0b55', size: 20 } });
        }
      }
    } else if (overlay === 'spof') {
      for (const spof of d.riskAnalysis.singlePointsOfFailure) {
        const funcName = spof.function;
        const node = d.nodes.find(n => n.label === funcName && n.type === 'function');
        if (node) {
          this.visNodes.update({ id: node.id, borderWidth: 5, color: { background: '#ef444444', border: '#ef4444' }, shadow: { enabled: true, color: '#ef444455', size: 20 } });
        }
      }
      // Also highlight unmapped functions
      for (const um of d.riskAnalysis.unmappedFunctions) {
        const funcName = um.function;
        const node = d.nodes.find(n => n.label === funcName && n.type === 'function');
        if (node) {
          this.visNodes.update({ id: node.id, borderWidth: 4, color: { background: '#f59e0b44', border: '#f59e0b' } });
        }
      }
    } else if (overlay === 'compliance') {
      for (const gap of d.complianceGaps) {
        this.visNodes.update({ id: gap.nodeId, borderWidth: 5, color: { background: '#a855f744', border: '#a855f7' }, shadow: { enabled: true, color: '#a855f755', size: 20 } });
      }
    }
  }

  selectNodeById(id: string) {
    const d = this.data();
    if (!d) return;
    const node = d.nodes.find(n => n.id === id);
    this.selectedNode.set(node || null);
    if (this.network) {
      this.network.selectNodes([id]);
      this.network.focus(id, { scale: 1.2, animation: { duration: 400, easingFunction: 'easeInOutQuad' } });
    }
  }

  zoomIn() {
    if (!this.network) return;
    const scale = this.network.getScale();
    this.network.moveTo({ scale: scale * 1.3, animation: { duration: 300, easingFunction: 'easeInOutQuad' } });
  }

  zoomOut() {
    if (!this.network) return;
    const scale = this.network.getScale();
    this.network.moveTo({ scale: scale / 1.3, animation: { duration: 300, easingFunction: 'easeInOutQuad' } });
  }

  fitGraph() {
    if (!this.network) return;
    this.network.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
  }
}
