// Supply Chain Nerve Center - Premium Feature
// Real-time Nth-Party Intelligence & CTPP Impact Simulation
// Style: NASA Mission Control + Bloomberg Terminal

import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Interfaces
interface Vendor {
  id: string;
  name: string;
  tier: number;
  country: string;
  countryCode: string;
  riskScore: number;
  isCTPP: boolean;
  status: 'operational' | 'degraded' | 'critical' | 'offline';
  services: string[];
  subcontractors: string[];
  lastAssessment: string;
  geopoliticalRisk: 'low' | 'medium' | 'high' | 'critical';
  concentration: number;
}

interface Incident {
  id: string;
  severity: 'P1' | 'P2' | 'P3' | 'P4';
  title: string;
  vendor: string;
  detectedAt: Date;
  classifiedAt: Date | null;
  reportedAt: Date | null;
  status: 'detected' | 'classifying' | 'classified' | 'reported';
  aiConfidence: number;
  timeRemaining: number;
}

interface ROIMetric {
  category: string;
  completeness: number;
  gaps: number;
  trend: 'up' | 'down' | 'stable';
}

interface GeoRiskData {
  country: string;
  vendors: number;
  risk: string;
  flag: string;
}

interface ImpactMetrics {
  affectedServices: number;
  downstreamVendors: number;
  financialImpact: string;
  rto: string;
}

@Component({
  selector: 'app-supply-chain-nerve-center',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="nerve-center">
      <!-- Header -->
      <header class="header">
        <div class="header-left">
          <a routerLink="/" class="back-link">← Tagasi</a>
          <div>
            <div class="logo">DoraAudit.eu</div>
            <div class="logo-sub">Supply Chain Nerve Center</div>
          </div>
          <div class="status-badge">
            <div class="status-dot"></div>
            <span>LIVE MONITORING</span>
          </div>
        </div>
        <div class="header-right">
          <div class="premium-badge">PREMIUM</div>
          <div class="time-display">{{ formattedTime() }}</div>
        </div>
      </header>

      <!-- Main Grid -->
      <main class="main-grid">
        <!-- Supply Chain Visualization -->
        <div class="panel chain-viz glass">
          <div class="panel-header">
            <span class="panel-title">Nth-Party Chain</span>
            <span class="panel-badge">{{ vendors().length }} vendors</span>
          </div>
          <div class="panel-content scrollable">
            @for (tier of [1, 2, 3, 4]; track tier) {
              <div class="tier-section animate-in" [style.animation-delay]="tier * 0.1 + 's'">
                <div class="tier-label">
                  TIER {{ tier }}
                  @if (tier === 1) { (Direct) }
                  @else if (tier === 4) { (Deep Chain) }
                </div>
                @for (vendor of getVendorsByTier(tier); track vendor.id) {
                  <div
                    class="vendor-node"
                    [class.ctpp]="vendor.isCTPP"
                    [class.critical]="vendor.status === 'critical'"
                    [class.selected]="selectedVendor() === vendor.id"
                    (click)="selectVendor(vendor.id)"
                  >
                    <div class="vendor-status-indicator" [class]="vendor.status"></div>
                    <div class="vendor-info">
                      <div class="vendor-name">{{ vendor.name }}</div>
                      <div class="vendor-meta">
                        <span>{{ getFlag(vendor.countryCode) }}</span>
                        <span>{{ vendor.services[0] }}</span>
                        @if (vendor.isCTPP) {
                          <span class="ctpp-label">CTPP</span>
                        }
                      </div>
                    </div>
                    <div class="vendor-risk" [class]="getRiskClass(vendor.riskScore)">
                      {{ vendor.riskScore }}
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- CTPP Impact Simulation -->
        <div class="panel ctpp-simulation glass">
          <div class="panel-header">
            <span class="panel-title">CTPP Failure Simulation</span>
            <span class="panel-badge">ESA Oversight</span>
          </div>
          <div class="panel-content">
            <div class="simulation-controls">
              @for (ctpp of ctpps(); track ctpp.id) {
                <button
                  class="sim-btn"
                  [class.active]="simulatingCTPP() === ctpp.id"
                  (click)="handleSimulation(ctpp.id)"
                >
                  <span class="sim-btn-icon">⚡</span>
                  <span>{{ ctpp.name.split(' ')[0] }}</span>
                  <span class="sim-btn-label">Simulate Failure</span>
                </button>
              }
            </div>
            <div class="impact-metrics">
              <div class="impact-card" [class.simulating]="simulatingCTPP()">
                <div class="impact-value" [class.critical]="simulatingCTPP()">
                  {{ impactMetrics().affectedServices }}
                </div>
                <div class="impact-label">Affected Services</div>
                @if (simulatingCTPP()) {
                  <div class="impact-change negative">+{{ impactMetrics().affectedServices }} at risk</div>
                }
              </div>
              <div class="impact-card" [class.simulating]="simulatingCTPP()">
                <div class="impact-value" [class.critical]="simulatingCTPP()">
                  {{ impactMetrics().downstreamVendors }}
                </div>
                <div class="impact-label">Downstream Vendors</div>
                @if (simulatingCTPP()) {
                  <div class="impact-change negative">Chain reaction</div>
                }
              </div>
              <div class="impact-card" [class.simulating]="simulatingCTPP()">
                <div class="impact-value" [class.critical]="simulatingCTPP()">
                  €{{ impactMetrics().financialImpact }}
                </div>
                <div class="impact-label">Est. Daily Impact</div>
                @if (simulatingCTPP()) {
                  <div class="impact-change negative">EUR / day</div>
                }
              </div>
              <div class="impact-card" [class.simulating]="simulatingCTPP()">
                <div class="impact-value" [class.critical]="simulatingCTPP()">
                  {{ impactMetrics().rto }}
                </div>
                <div class="impact-label">Recovery Time</div>
                @if (simulatingCTPP()) {
                  <div class="impact-change negative">Best case</div>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Incident Command Center -->
        <div class="panel incident-center glass">
          <div class="panel-header">
            <span class="panel-title">4H Incident Command</span>
            <span class="panel-badge">{{ activeIncidents() }} active</span>
          </div>
          <div class="panel-content scrollable-short">
            <div class="incident-timeline">
              @for (incident of incidents(); track incident.id; let idx = $index) {
                <div
                  class="incident-item animate-in"
                  [class.classifying]="incident.status === 'classifying'"
                  [style.animation-delay]="idx * 0.1 + 's'"
                >
                  <span class="incident-severity" [class]="incident.severity">{{ incident.severity }}</span>
                  <div class="incident-details">
                    <div class="incident-title">{{ incident.title }}</div>
                    <div class="incident-vendor">{{ incident.vendor }}</div>
                    <div class="ai-confidence">
                      <span class="ai-label">AI Classification:</span>
                      <div class="ai-confidence-bar">
                        <div class="ai-confidence-fill" [style.width.%]="incident.aiConfidence"></div>
                      </div>
                      <span class="ai-confidence-value">{{ incident.aiConfidence }}%</span>
                    </div>
                  </div>
                  <div class="incident-timing">
                    @if (incident.status !== 'reported') {
                      <div class="incident-countdown" [class]="getCountdownClass(incident.timeRemaining)">
                        {{ formatCountdown(incident.timeRemaining) }}
                      </div>
                      <div class="incident-countdown-label">
                        {{ incident.status === 'classifying' ? 'to classify' : 'to report' }}
                      </div>
                    } @else {
                      <div class="incident-countdown ok">✓</div>
                      <div class="incident-countdown-label">Reported</div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- ROI Intelligence -->
        <div class="panel roi-intel glass">
          <div class="panel-header">
            <span class="panel-title">ROI Intelligence</span>
            <span class="panel-badge">Predictive</span>
          </div>
          <div class="panel-content">
            <div class="roi-score">
              <div class="roi-score-value">{{ overallROI() }}%</div>
              <div class="roi-score-label">Overall Completeness</div>
            </div>
            <div class="roi-categories">
              @for (metric of roiMetrics(); track metric.category; let idx = $index) {
                <div class="roi-category animate-in" [style.animation-delay]="idx * 0.05 + 's'">
                  <div class="roi-category-header">
                    <span class="roi-category-name">{{ metric.category }}</span>
                    <span
                      class="roi-category-value"
                      [style.color]="metric.completeness >= 80 ? '#3fb950' : metric.completeness >= 60 ? '#f0883e' : '#f85149'"
                    >
                      {{ metric.completeness }}%
                    </span>
                  </div>
                  <div class="roi-bar">
                    <div
                      class="roi-bar-fill"
                      [class]="getROIFillClass(metric.completeness)"
                      [style.width.%]="metric.completeness"
                    ></div>
                  </div>
                  <div class="roi-gaps">
                    <span>{{ metric.gaps }} gaps detected</span>
                    <span class="roi-trend" [class]="metric.trend">
                      {{ metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→' }} {{ metric.trend }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Geopolitical Risk -->
        <div class="panel geo-risk glass">
          <div class="panel-header">
            <span class="panel-title">Geopolitical Risk Map</span>
            <span class="panel-badge">2025/532</span>
          </div>
          <div class="panel-content scrollable-short">
            <div class="geo-list">
              @for (geo of geoRiskData(); track geo.country; let idx = $index) {
                <div
                  class="geo-item animate-in"
                  [class.critical]="geo.risk === 'critical'"
                  [style.animation-delay]="idx * 0.05 + 's'"
                >
                  <span class="geo-flag">{{ geo.flag }}</span>
                  <div class="geo-info">
                    <div class="geo-country">{{ geo.country }}</div>
                    <div class="geo-vendors">{{ geo.vendors }} vendor{{ geo.vendors > 1 ? 's' : '' }}</div>
                  </div>
                  <span class="geo-risk-badge" [class]="geo.risk">{{ geo.risk.toUpperCase() }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </main>

      <!-- Resilience Testing Panel -->
      <div class="resilience-panel" [class.expanded]="resilienceExpanded()">
        <div class="resilience-toggle" (click)="toggleResilience()">
          <span class="resilience-title">
            <span>⚡</span>
            Resilience Testing Orchestration
            <span class="resilience-date">— Last TLPT: 2025-12-01</span>
          </span>
          <span class="resilience-arrow">▲</span>
        </div>
        @if (resilienceExpanded()) {
          <div class="resilience-content">
            <div class="resilience-metric">
              <div class="resilience-value">99.7%</div>
              <div class="resilience-label">Availability SLA</div>
              <span class="resilience-status pass">PASS</span>
            </div>
            <div class="resilience-metric">
              <div class="resilience-value">4h 12m</div>
              <div class="resilience-label">Mean RTO</div>
              <span class="resilience-status pass">PASS</span>
            </div>
            <div class="resilience-metric">
              <div class="resilience-value warning">23m</div>
              <div class="resilience-label">Mean RPO</div>
              <span class="resilience-status pass">PASS</span>
            </div>
            <div class="resilience-metric">
              <div class="resilience-value">8/8</div>
              <div class="resilience-label">Scenario Tests</div>
              <span class="resilience-status pass">PASS</span>
            </div>
            <div class="resilience-metric">
              <div class="resilience-value critical">2/5</div>
              <div class="resilience-label">Exit Strategies</div>
              <span class="resilience-status fail">FAIL</span>
            </div>
            <div class="resilience-metric">
              <div class="resilience-value">12</div>
              <div class="resilience-label">TLPT Findings</div>
              <span class="resilience-status pass">REMEDIATED</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap');

    :host { display: block; }

    .nerve-center {
      font-family: 'Outfit', sans-serif;
      background: linear-gradient(135deg, #0a0a0f 0%, #0d1117 50%, #0a0a0f 100%);
      min-height: 100vh;
      color: #e6edf3;
      position: relative;
      overflow-x: hidden;
    }

    .nerve-center::before {
      content: '';
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 136, 0.03) 2px, rgba(0, 255, 136, 0.03) 4px);
      pointer-events: none;
      z-index: 1000;
      animation: scanlines 8s linear infinite;
    }

    @keyframes scanlines { 0% { transform: translateY(0); } 100% { transform: translateY(4px); } }

    .header {
      background: rgba(13, 17, 23, 0.95);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(0, 255, 136, 0.2);
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-left { display: flex; align-items: center; gap: 16px; }

    .back-link {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #7d8590;
      text-decoration: none;
      padding: 6px 12px;
      border: 1px solid rgba(48, 54, 61, 0.8);
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .back-link:hover { border-color: #00ff88; color: #00ff88; }

    .logo {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px; font-weight: 600;
      color: #00ff88;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .logo-sub { font-size: 10px; color: #7d8590; letter-spacing: 3px; }

    .status-badge {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 12px;
      background: rgba(0, 255, 136, 0.1);
      border: 1px solid rgba(0, 255, 136, 0.3);
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
    }

    .status-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #00ff88;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.7); }
      50% { opacity: 0.8; box-shadow: 0 0 0 6px rgba(0, 255, 136, 0); }
    }

    .header-right { display: flex; align-items: center; gap: 16px; }

    .premium-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px; font-weight: 700;
      padding: 4px 10px;
      background: linear-gradient(135deg, #f0883e 0%, #d2a841 100%);
      color: #0d1117;
      border-radius: 4px;
      letter-spacing: 1px;
    }

    .time-display {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px; color: #00ff88; letter-spacing: 1px;
    }

    .main-grid {
      display: grid;
      grid-template-columns: 300px 1fr 320px;
      grid-template-rows: auto 1fr;
      gap: 16px;
      padding: 16px 24px;
      min-height: calc(100vh - 72px);
    }

    .panel {
      background: rgba(22, 27, 34, 0.8);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(48, 54, 61, 0.8);
      border-radius: 8px;
      overflow: hidden;
    }

    .panel-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.3);
      border-bottom: 1px solid rgba(48, 54, 61, 0.8);
    }

    .panel-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px; font-weight: 600;
      color: #7d8590;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }

    .panel-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      padding: 3px 8px;
      background: rgba(0, 255, 136, 0.15);
      color: #00ff88;
      border-radius: 3px;
    }

    .panel-content { padding: 16px; }
    .scrollable { max-height: calc(100vh - 180px); overflow-y: auto; }
    .scrollable-short { max-height: calc(100vh - 420px); overflow-y: auto; }

    .chain-viz { grid-column: 1 / 2; grid-row: 1 / 3; }
    .tier-section { margin-bottom: 16px; }

    .tier-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px; color: #7d8590;
      margin-bottom: 8px; padding-left: 4px;
      letter-spacing: 1px;
    }

    .vendor-node {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(48, 54, 61, 0.8);
      border-radius: 6px;
      margin-bottom: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .vendor-node:hover { border-color: rgba(0, 255, 136, 0.5); background: rgba(0, 255, 136, 0.05); }
    .vendor-node.selected { border-color: #00ff88; background: rgba(0, 255, 136, 0.1); }
    .vendor-node.ctpp { border-left: 3px solid #f0883e; }
    .vendor-node.critical { border-left: 3px solid #f85149; animation: critical-pulse 1.5s infinite; }

    @keyframes critical-pulse {
      0%, 100% { background: rgba(248, 81, 73, 0.05); }
      50% { background: rgba(248, 81, 73, 0.15); }
    }

    .vendor-status-indicator { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .vendor-status-indicator.operational { background: #3fb950; }
    .vendor-status-indicator.degraded { background: #f0883e; }
    .vendor-status-indicator.critical { background: #f85149; }
    .vendor-status-indicator.offline { background: #8b949e; }

    .vendor-info { flex: 1; min-width: 0; }
    .vendor-name { font-size: 12px; font-weight: 500; color: #e6edf3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .vendor-meta { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #7d8590; display: flex; gap: 8px; margin-top: 2px; }
    .ctpp-label { color: #f0883e; }

    .vendor-risk { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 3px; }
    .vendor-risk.low { background: rgba(63, 185, 80, 0.2); color: #3fb950; }
    .vendor-risk.medium { background: rgba(240, 136, 62, 0.2); color: #f0883e; }
    .vendor-risk.high { background: rgba(248, 81, 73, 0.2); color: #f85149; }

    .ctpp-simulation { grid-column: 2 / 3; grid-row: 1 / 2; }
    .simulation-controls { display: flex; gap: 12px; margin-bottom: 16px; }

    .sim-btn {
      flex: 1;
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(48, 54, 61, 0.8);
      border-radius: 6px;
      color: #e6edf3;
      font-family: 'Outfit', sans-serif;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .sim-btn:hover { border-color: rgba(0, 255, 136, 0.5); background: rgba(0, 255, 136, 0.05); }
    .sim-btn.active { border-color: #f85149; background: rgba(248, 81, 73, 0.1); }
    .sim-btn-icon { font-size: 20px; }
    .sim-btn-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #7d8590; }

    .impact-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }

    .impact-card {
      padding: 16px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(48, 54, 61, 0.8);
      border-radius: 6px;
      text-align: center;
      transition: all 0.3s ease;
    }

    .impact-card.simulating { border-color: rgba(248, 81, 73, 0.5); background: rgba(248, 81, 73, 0.05); }

    .impact-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 28px; font-weight: 700;
      color: #00ff88;
      line-height: 1;
      transition: color 0.3s ease;
    }

    .impact-value.critical { color: #f85149; }
    .impact-label { font-size: 11px; color: #7d8590; margin-top: 6px; }
    .impact-change { font-family: 'JetBrains Mono', monospace; font-size: 10px; margin-top: 4px; }
    .impact-change.negative { color: #f85149; }

    .incident-center { grid-column: 2 / 3; grid-row: 2 / 3; }

    .incident-item {
      display: flex; gap: 16px;
      padding: 14px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(48, 54, 61, 0.8);
      border-radius: 6px;
      margin-bottom: 10px;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .incident-item:hover { border-color: rgba(0, 255, 136, 0.4); }
    .incident-item.classifying { border-left: 3px solid #f0883e; animation: classifying-pulse 2s infinite; }

    @keyframes classifying-pulse {
      0%, 100% { background: rgba(240, 136, 62, 0.05); }
      50% { background: rgba(240, 136, 62, 0.12); }
    }

    .incident-severity { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700; padding: 4px 8px; border-radius: 4px; flex-shrink: 0; height: fit-content; }
    .incident-severity.P1 { background: rgba(248, 81, 73, 0.2); color: #f85149; }
    .incident-severity.P2 { background: rgba(240, 136, 62, 0.2); color: #f0883e; }
    .incident-severity.P3 { background: rgba(210, 168, 65, 0.2); color: #d2a841; }
    .incident-severity.P4 { background: rgba(139, 148, 158, 0.2); color: #8b949e; }

    .incident-details { flex: 1; }
    .incident-title { font-size: 13px; font-weight: 500; color: #e6edf3; margin-bottom: 4px; }
    .incident-vendor { font-size: 11px; color: #7d8590; }
    .incident-timing { text-align: right; }

    .incident-countdown { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 600; }
    .incident-countdown.urgent { color: #f85149; }
    .incident-countdown.warning { color: #f0883e; }
    .incident-countdown.ok { color: #3fb950; }
    .incident-countdown-label { font-size: 10px; color: #7d8590; margin-top: 2px; }

    .ai-confidence { display: flex; align-items: center; gap: 6px; margin-top: 8px; }
    .ai-label { font-size: 10px; color: #7d8590; }
    .ai-confidence-bar { flex: 1; height: 4px; background: rgba(48, 54, 61, 0.8); border-radius: 2px; overflow: hidden; }
    .ai-confidence-fill { height: 100%; background: linear-gradient(90deg, #00ff88, #00d4ff); border-radius: 2px; transition: width 0.3s ease; }
    .ai-confidence-value { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #00ff88; }

    .roi-intel { grid-column: 3 / 4; grid-row: 1 / 2; }

    .roi-score { text-align: center; padding: 20px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; margin-bottom: 16px; }
    .roi-score-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 48px; font-weight: 700;
      background: linear-gradient(135deg, #00ff88 0%, #00d4ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .roi-score-label { font-size: 12px; color: #7d8590; margin-top: 4px; }

    .roi-categories { display: flex; flex-direction: column; gap: 10px; }

    .roi-category {
      padding: 10px 12px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(48, 54, 61, 0.8);
      border-radius: 6px;
    }

    .roi-category-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .roi-category-name { font-size: 12px; color: #e6edf3; }
    .roi-category-value { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; }

    .roi-bar { height: 4px; background: rgba(48, 54, 61, 0.8); border-radius: 2px; overflow: hidden; }
    .roi-bar-fill { height: 100%; border-radius: 2px; transition: width 0.5s ease; }
    .roi-bar-fill.high { background: linear-gradient(90deg, #3fb950, #00ff88); }
    .roi-bar-fill.medium { background: linear-gradient(90deg, #f0883e, #d2a841); }
    .roi-bar-fill.low { background: linear-gradient(90deg, #f85149, #f0883e); }

    .roi-gaps { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #7d8590; margin-top: 4px; display: flex; justify-content: space-between; }
    .roi-trend { display: flex; align-items: center; gap: 4px; }
    .roi-trend.up { color: #3fb950; }
    .roi-trend.down { color: #f85149; }
    .roi-trend.stable { color: #7d8590; }

    .geo-risk { grid-column: 3 / 4; grid-row: 2 / 3; }
    .geo-list { display: flex; flex-direction: column; gap: 8px; }

    .geo-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(48, 54, 61, 0.8);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .geo-item:hover { border-color: rgba(0, 255, 136, 0.4); }
    .geo-item.critical { border-color: rgba(248, 81, 73, 0.5); background: rgba(248, 81, 73, 0.05); }

    .geo-flag { font-size: 20px; }
    .geo-info { flex: 1; }
    .geo-country { font-size: 12px; font-weight: 500; color: #e6edf3; }
    .geo-vendors { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #7d8590; }

    .geo-risk-badge { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 3px; }
    .geo-risk-badge.low { background: rgba(63, 185, 80, 0.2); color: #3fb950; }
    .geo-risk-badge.medium { background: rgba(240, 136, 62, 0.2); color: #f0883e; }
    .geo-risk-badge.high { background: rgba(248, 81, 73, 0.2); color: #f85149; }
    .geo-risk-badge.critical { background: rgba(248, 81, 73, 0.3); color: #f85149; }

    .resilience-panel {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      background: rgba(13, 17, 23, 0.98);
      backdrop-filter: blur(20px);
      border-top: 1px solid rgba(0, 255, 136, 0.2);
      padding: 16px 24px;
      transform: translateY(calc(100% - 48px));
      transition: transform 0.3s ease;
      z-index: 50;
    }

    .resilience-panel.expanded { transform: translateY(0); }

    .resilience-toggle { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }

    .resilience-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px; font-weight: 600;
      color: #00ff88;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      display: flex; align-items: center; gap: 8px;
    }

    .resilience-date { font-size: 10px; color: #7d8590; font-weight: 400; }
    .resilience-arrow { transition: transform 0.3s ease; color: #7d8590; }
    .resilience-panel.expanded .resilience-arrow { transform: rotate(180deg); }

    .resilience-content { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; margin-top: 16px; }

    .resilience-metric {
      padding: 16px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(48, 54, 61, 0.8);
      border-radius: 6px;
      text-align: center;
    }

    .resilience-value { font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 700; color: #00ff88; }
    .resilience-value.warning { color: #f0883e; }
    .resilience-value.critical { color: #f85149; }
    .resilience-label { font-size: 10px; color: #7d8590; margin-top: 4px; }

    .resilience-status {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px; margin-top: 8px;
      padding: 3px 6px; border-radius: 3px;
      display: inline-block;
    }

    .resilience-status.pass { background: rgba(63, 185, 80, 0.2); color: #3fb950; }
    .resilience-status.fail { background: rgba(248, 81, 73, 0.2); color: #f85149; }

    .glass { background: rgba(22, 27, 34, 0.6); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-in { animation: fadeIn 0.4s ease forwards; }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
    ::-webkit-scrollbar-thumb { background: rgba(0, 255, 136, 0.3); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(0, 255, 136, 0.5); }

    @media (max-width: 1400px) {
      .main-grid { grid-template-columns: 280px 1fr 300px; }
    }

    @media (max-width: 1200px) {
      .main-grid {
        grid-template-columns: 1fr 1fr;
        grid-template-rows: auto auto auto;
      }
      .chain-viz { grid-column: 1 / 2; grid-row: 1 / 3; }
      .ctpp-simulation { grid-column: 2 / 3; grid-row: 1 / 2; }
      .incident-center { grid-column: 2 / 3; grid-row: 2 / 3; }
      .roi-intel { grid-column: 1 / 2; grid-row: 3 / 4; }
      .geo-risk { grid-column: 2 / 3; grid-row: 3 / 4; }
      .resilience-content { grid-template-columns: repeat(3, 1fr); }
    }

    @media (max-width: 768px) {
      .main-grid {
        grid-template-columns: 1fr;
        padding: 12px;
      }
      .chain-viz, .ctpp-simulation, .incident-center, .roi-intel, .geo-risk {
        grid-column: 1 / 2;
        grid-row: auto;
      }
      .impact-metrics { grid-template-columns: repeat(2, 1fr); }
      .resilience-content { grid-template-columns: repeat(2, 1fr); }
      .header { flex-direction: column; gap: 12px; align-items: flex-start; }
      .header-right { width: 100%; justify-content: space-between; }
    }
  `]
})
export class SupplyChainNerveCenterComponent implements OnInit, OnDestroy {
  // Signals
  readonly vendors = signal<Vendor[]>([
    { id: 'v1', name: 'AWS Europe (Frankfurt)', tier: 1, country: 'Saksamaa', countryCode: 'DE', riskScore: 23, isCTPP: true, status: 'operational', services: ['Cloud Hosting', 'S3 Storage', 'Lambda'], subcontractors: ['v5', 'v6'], lastAssessment: '2025-12-15', geopoliticalRisk: 'low', concentration: 34 },
    { id: 'v2', name: 'Telia Eesti AS', tier: 1, country: 'Eesti', countryCode: 'EE', riskScore: 18, isCTPP: false, status: 'operational', services: ['Network', 'Data Center', 'DDoS Protection'], subcontractors: ['v7'], lastAssessment: '2025-11-28', geopoliticalRisk: 'low', concentration: 12 },
    { id: 'v3', name: 'Microsoft Azure', tier: 1, country: 'Iirimaa', countryCode: 'IE', riskScore: 21, isCTPP: true, status: 'degraded', services: ['Azure AD', 'Key Vault', 'SQL'], subcontractors: ['v8', 'v9'], lastAssessment: '2025-12-01', geopoliticalRisk: 'low', concentration: 28 },
    { id: 'v4', name: 'Veriff OÜ', tier: 1, country: 'Eesti', countryCode: 'EE', riskScore: 31, isCTPP: false, status: 'operational', services: ['KYC', 'Identity Verification'], subcontractors: ['v10'], lastAssessment: '2025-10-20', geopoliticalRisk: 'low', concentration: 8 },
    { id: 'v5', name: 'Equinix Frankfurt', tier: 2, country: 'Saksamaa', countryCode: 'DE', riskScore: 15, isCTPP: false, status: 'operational', services: ['Colocation'], subcontractors: [], lastAssessment: '2025-09-15', geopoliticalRisk: 'low', concentration: 5 },
    { id: 'v6', name: 'GlobalSign NV', tier: 2, country: 'Belgia', countryCode: 'BE', riskScore: 22, isCTPP: false, status: 'operational', services: ['SSL/TLS Certificates'], subcontractors: ['v11'], lastAssessment: '2025-08-30', geopoliticalRisk: 'low', concentration: 3 },
    { id: 'v7', name: 'Netnod AB', tier: 2, country: 'Rootsi', countryCode: 'SE', riskScore: 12, isCTPP: false, status: 'operational', services: ['DNS', 'IX Peering'], subcontractors: [], lastAssessment: '2025-11-10', geopoliticalRisk: 'low', concentration: 2 },
    { id: 'v8', name: 'CloudFlare Inc', tier: 2, country: 'USA', countryCode: 'US', riskScore: 28, isCTPP: false, status: 'operational', services: ['CDN', 'WAF'], subcontractors: ['v12'], lastAssessment: '2025-10-05', geopoliticalRisk: 'medium', concentration: 15 },
    { id: 'v9', name: 'Splunk Inc', tier: 2, country: 'USA', countryCode: 'US', riskScore: 25, isCTPP: false, status: 'operational', services: ['SIEM', 'Log Analytics'], subcontractors: [], lastAssessment: '2025-09-22', geopoliticalRisk: 'medium', concentration: 4 },
    { id: 'v10', name: 'Onfido Ltd', tier: 2, country: 'UK', countryCode: 'GB', riskScore: 35, isCTPP: false, status: 'operational', services: ['Document Verification'], subcontractors: ['v13'], lastAssessment: '2025-07-18', geopoliticalRisk: 'medium', concentration: 2 },
    { id: 'v11', name: 'DigiCert Inc', tier: 3, country: 'USA', countryCode: 'US', riskScore: 19, isCTPP: false, status: 'operational', services: ['Root CA'], subcontractors: [], lastAssessment: '2025-06-30', geopoliticalRisk: 'medium', concentration: 1 },
    { id: 'v12', name: 'Zayo Group', tier: 3, country: 'USA', countryCode: 'US', riskScore: 24, isCTPP: false, status: 'operational', services: ['Fiber Backbone'], subcontractors: ['v14'], lastAssessment: '2025-05-15', geopoliticalRisk: 'medium', concentration: 1 },
    { id: 'v13', name: 'Jumio Corp', tier: 3, country: 'USA', countryCode: 'US', riskScore: 42, isCTPP: false, status: 'critical', services: ['AI/ML Processing'], subcontractors: [], lastAssessment: '2025-04-20', geopoliticalRisk: 'high', concentration: 1 },
    { id: 'v14', name: 'China Telecom', tier: 4, country: 'Hiina', countryCode: 'CN', riskScore: 78, isCTPP: false, status: 'operational', services: ['Transit'], subcontractors: [], lastAssessment: '2025-03-10', geopoliticalRisk: 'critical', concentration: 0.5 },
  ]);

  readonly incidents = signal<Incident[]>([
    { id: 'INC-2026-0215-001', severity: 'P2', title: 'Azure AD latentsus tõus', vendor: 'Microsoft Azure', detectedAt: new Date(Date.now() - 45 * 60000), classifiedAt: null, reportedAt: null, status: 'classifying', aiConfidence: 87, timeRemaining: 195 },
    { id: 'INC-2026-0215-002', severity: 'P3', title: 'Veriff API timeout', vendor: 'Veriff OÜ', detectedAt: new Date(Date.now() - 120 * 60000), classifiedAt: new Date(Date.now() - 90 * 60000), reportedAt: null, status: 'classified', aiConfidence: 94, timeRemaining: 1350 },
    { id: 'INC-2026-0214-003', severity: 'P1', title: 'Jumio ML mudeli drift', vendor: 'Jumio Corp', detectedAt: new Date(Date.now() - 180 * 60000), classifiedAt: new Date(Date.now() - 150 * 60000), reportedAt: new Date(Date.now() - 140 * 60000), status: 'reported', aiConfidence: 92, timeRemaining: 0 },
  ]);

  readonly roiMetrics = signal<ROIMetric[]>([
    { category: 'ICT teenusepakkujad', completeness: 94, gaps: 3, trend: 'up' },
    { category: 'Subkontraktorid', completeness: 67, gaps: 12, trend: 'down' },
    { category: 'Lepingud', completeness: 89, gaps: 5, trend: 'stable' },
    { category: 'Riskihinnangud', completeness: 78, gaps: 8, trend: 'up' },
    { category: 'Intsidendid', completeness: 96, gaps: 1, trend: 'up' },
    { category: 'Exit strateegiad', completeness: 45, gaps: 18, trend: 'down' },
  ]);

  readonly selectedVendor = signal<string | null>(null);
  readonly simulatingCTPP = signal<string | null>(null);
  readonly currentTime = signal(new Date());
  readonly resilienceExpanded = signal(false);

  // Computed
  readonly ctpps = computed(() => this.vendors().filter(v => v.isCTPP));
  readonly activeIncidents = computed(() => this.incidents().filter(i => i.status !== 'reported').length);
  readonly overallROI = computed(() => {
    const metrics = this.roiMetrics();
    const total = metrics.reduce((acc, m) => acc + m.completeness, 0);
    return Math.round(total / metrics.length);
  });

  readonly formattedTime = computed(() => {
    return this.currentTime().toLocaleTimeString('et-EE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  readonly impactMetrics = computed<ImpactMetrics>(() => {
    const ctpp = this.simulatingCTPP();
    if (!ctpp) {
      return { affectedServices: 0, downstreamVendors: 0, financialImpact: '0', rto: '0h' };
    }
    const impacts: Record<string, ImpactMetrics> = {
      'v1': { affectedServices: 12, downstreamVendors: 4, financialImpact: '2.4M', rto: '4h' },
      'v3': { affectedServices: 8, downstreamVendors: 3, financialImpact: '1.8M', rto: '6h' }
    };
    return impacts[ctpp] || { affectedServices: 0, downstreamVendors: 0, financialImpact: '0', rto: '0h' };
  });

  readonly geoRiskData = computed<GeoRiskData[]>(() => {
    const countries: Record<string, { vendors: number; risk: string }> = {};
    const flagMap: Record<string, string> = {
      'DE': '🇩🇪', 'EE': '🇪🇪', 'IE': '🇮🇪', 'BE': '🇧🇪', 'SE': '🇸🇪',
      'US': '🇺🇸', 'GB': '🇬🇧', 'CN': '🇨🇳', 'LV': '🇱🇻', 'LT': '🇱🇹'
    };

    this.vendors().forEach(v => {
      if (!countries[v.country]) {
        countries[v.country] = { vendors: 0, risk: v.geopoliticalRisk };
      }
      countries[v.country].vendors++;
      if (v.geopoliticalRisk === 'critical' ||
          (v.geopoliticalRisk === 'high' && countries[v.country].risk !== 'critical')) {
        countries[v.country].risk = v.geopoliticalRisk;
      }
    });

    return Object.entries(countries).map(([country, data]) => ({
      country,
      ...data,
      flag: flagMap[this.vendors().find(v => v.country === country)?.countryCode || ''] || '🏳️'
    })).sort((a, b) => {
      const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (riskOrder[a.risk] || 3) - (riskOrder[b.risk] || 3);
    });
  });

  private timeInterval: ReturnType<typeof setInterval> | null = null;
  private incidentInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.timeInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);

    this.incidentInterval = setInterval(() => {
      this.incidents.update(incidents =>
        incidents.map(inc => ({
          ...inc,
          timeRemaining: Math.max(0, inc.timeRemaining - 1)
        }))
      );
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.timeInterval) clearInterval(this.timeInterval);
    if (this.incidentInterval) clearInterval(this.incidentInterval);
  }

  getVendorsByTier(tier: number): Vendor[] {
    return this.vendors().filter(v => v.tier === tier);
  }

  getFlag(countryCode: string): string {
    const flags: Record<string, string> = {
      'DE': '🇩🇪', 'EE': '🇪🇪', 'IE': '🇮🇪', 'BE': '🇧🇪', 'SE': '🇸🇪',
      'US': '🇺🇸', 'GB': '🇬🇧', 'CN': '🇨🇳', 'LV': '🇱🇻', 'LT': '🇱🇹'
    };
    return flags[countryCode] || '🏳️';
  }

  getRiskClass(score: number): string {
    if (score < 25) return 'low';
    if (score < 50) return 'medium';
    return 'high';
  }

  getROIFillClass(completeness: number): string {
    if (completeness >= 80) return 'high';
    if (completeness >= 60) return 'medium';
    return 'low';
  }

  getCountdownClass(minutes: number): string {
    if (minutes < 60) return 'urgent';
    if (minutes < 180) return 'warning';
    return 'ok';
  }

  formatCountdown(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  selectVendor(id: string): void {
    this.selectedVendor.update(current => current === id ? null : id);
  }

  handleSimulation(ctppId: string): void {
    this.simulatingCTPP.update(current => current === ctppId ? null : ctppId);
  }

  toggleResilience(): void {
    this.resilienceExpanded.update(expanded => !expanded);
  }
}
