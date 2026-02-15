// Supply Chain Nerve Center - Premium Feature
// Simplified for non-technical compliance managers
// Rule: One screen = one clear answer

import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Vendor {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  type: string;
  riskScore: number;
  subcontractors: SubVendor[];
}

interface SubVendor {
  name: string;
  country: string;
  type: string;
  riskScore: number;
}

interface ROICategory {
  name: string;
  completeness: number;
  gaps: string[];
}

interface Incident {
  id: string;
  severity: 'P1' | 'P2' | 'P3';
  title: string;
  vendor: string;
  timeAgo: string;
  timeRemaining: number;
  status: 'active' | 'resolved';
}

type ViewType = 'main' | 'vendors' | 'roi' | 'incidents';

@Component({
  selector: 'app-supply-chain-nerve-center',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="nerve-center">
      <!-- Header -->
      <header class="header">
        <div class="header-left">
          <a routerLink="/" class="back-btn">← Back</a>
          <div class="title-section">
            <h1 class="title">Supply Chain Nerve Center</h1>
            <span class="premium-badge">PREMIUM</span>
          </div>
        </div>
        <div class="header-right">
          <div class="live-indicator">
            <span class="pulse"></span>
            <span>Live</span>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="content">
        @if (currentView() === 'main') {
          <!-- MAIN VIEW: 3 Summary Cards -->
          <div class="summary-cards">
            <!-- Vendors Card -->
            <div class="summary-card" [class.has-risk]="highRiskCount() > 0" (click)="openView('vendors')">
              <div class="card-icon">🏢</div>
              <div class="card-main">
                <span class="big-number">{{ vendors().length }}</span>
                <span class="card-label">ICT providers</span>
              </div>
              <div class="card-divider">│</div>
              <div class="card-secondary" [class.danger]="highRiskCount() > 0">
                <span class="secondary-number">{{ highRiskCount() }}</span>
                <span class="secondary-label">high risk</span>
              </div>
              <div class="card-arrow">→</div>
            </div>

            <!-- ROI Card -->
            <div class="summary-card" [class.has-warning]="worstCategory().completeness < 50" (click)="openView('roi')">
              <div class="card-icon">
                <svg class="progress-ring" viewBox="0 0 36 36">
                  <circle class="ring-bg" cx="18" cy="18" r="15.9"/>
                  <circle
                    class="ring-fill"
                    cx="18" cy="18" r="15.9"
                    [attr.stroke-dasharray]="roiDashArray()"
                    [class.good]="overallROI() >= 80"
                    [class.warning]="overallROI() >= 50 && overallROI() < 80"
                    [class.danger]="overallROI() < 50"
                  />
                </svg>
              </div>
              <div class="card-main">
                <span class="big-number">{{ overallROI() }}%</span>
                <span class="card-label">RoI complete</span>
              </div>
              <div class="card-divider">│</div>
              <div class="card-secondary warning">
                <span class="secondary-label">{{ worstCategory().name }}</span>
                <span class="secondary-note">missing</span>
              </div>
              <div class="card-arrow">→</div>
            </div>

            <!-- Incidents Card -->
            <div class="summary-card" [class.has-incident]="activeIncidentCount() > 0" (click)="openView('incidents')">
              <div class="card-icon" [class.ok]="activeIncidentCount() === 0">
                {{ activeIncidentCount() === 0 ? '✓' : '⚠' }}
              </div>
              <div class="card-main">
                <span class="big-number">{{ activeIncidentCount() }}</span>
                <span class="card-label">active incidents</span>
              </div>
              <div class="card-divider">│</div>
              <div class="card-secondary ok">
                <span class="secondary-label">Last resolved</span>
                <span class="secondary-note">{{ lastIncidentTime() }}</span>
              </div>
              <div class="card-arrow">→</div>
            </div>
          </div>

          <!-- Quick Info -->
          <div class="quick-info">
            <p>Click a card to see details.</p>
          </div>
        }

        @if (currentView() === 'vendors') {
          <!-- VENDORS DETAIL VIEW -->
          <div class="detail-view">
            <div class="detail-header">
              <button class="back-to-main" (click)="openView('main')">← Back to overview</button>
              <h2>ICT Service Providers</h2>
              <span class="detail-count">{{ vendors().length }} providers</span>
            </div>

            <div class="vendor-table">
              <div class="table-header">
                <span class="col-name">Name</span>
                <span class="col-country">Country</span>
                <span class="col-type">Type</span>
                <span class="col-risk">Risk</span>
              </div>
              @for (vendor of sortedVendors(); track vendor.id) {
                <div
                  class="table-row"
                  [class.selected]="selectedVendor()?.id === vendor.id"
                  [class.high-risk]="vendor.riskScore >= 60"
                  (click)="selectVendor(vendor)"
                >
                  <span class="col-name">{{ vendor.name }}</span>
                  <span class="col-country">{{ getFlag(vendor.countryCode) }} {{ vendor.country }}</span>
                  <span class="col-type">{{ vendor.type }}</span>
                  <span class="col-risk">
                    <span class="risk-badge" [class]="getRiskClass(vendor.riskScore)">
                      {{ vendor.riskScore }}
                    </span>
                  </span>
                </div>
              }
            </div>
          </div>

          <!-- Vendor Slide-out Panel -->
          @if (selectedVendor()) {
            <div class="slide-panel" (click)="closeVendorPanel($event)">
              <div class="panel-content" (click)="$event.stopPropagation()">
                <div class="panel-header">
                  <h3>{{ selectedVendor()!.name }}</h3>
                  <button class="close-btn" (click)="selectedVendor.set(null)">✕</button>
                </div>
                <div class="panel-body">
                  <div class="vendor-detail">
                    <span class="detail-label">Country:</span>
                    <span>{{ getFlag(selectedVendor()!.countryCode) }} {{ selectedVendor()!.country }}</span>
                  </div>
                  <div class="vendor-detail">
                    <span class="detail-label">Type:</span>
                    <span>{{ selectedVendor()!.type }}</span>
                  </div>
                  <div class="vendor-detail">
                    <span class="detail-label">Risk score:</span>
                    <span class="risk-badge large" [class]="getRiskClass(selectedVendor()!.riskScore)">
                      {{ selectedVendor()!.riskScore }}
                    </span>
                  </div>

                  <div class="subcontractors-section">
                    <h4>Subcontractor chain ({{ selectedVendor()!.subcontractors.length }})</h4>
                    @if (selectedVendor()!.subcontractors.length === 0) {
                      <p class="no-subs">No subcontractors registered.</p>
                    } @else {
                      <div class="sub-chain">
                        @for (sub of selectedVendor()!.subcontractors; track sub.name; let i = $index) {
                          <div class="sub-item">
                            <div class="chain-line"></div>
                            <div class="sub-card" [class.high-risk]="sub.riskScore >= 60">
                              <div class="sub-name">{{ sub.name }}</div>
                              <div class="sub-meta">
                                <span>{{ sub.country }}</span>
                                <span>{{ sub.type }}</span>
                              </div>
                              <span class="risk-badge small" [class]="getRiskClass(sub.riskScore)">
                                {{ sub.riskScore }}
                              </span>
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          }
        }

        @if (currentView() === 'roi') {
          <!-- ROI DETAIL VIEW -->
          <div class="detail-view">
            <div class="detail-header">
              <button class="back-to-main" (click)="openView('main')">← Back to overview</button>
              <h2>Register of Information (RoI)</h2>
              <span class="detail-count">{{ overallROI() }}% complete</span>
            </div>

            <div class="roi-list">
              @for (category of sortedROICategories(); track category.name) {
                <div
                  class="roi-item"
                  [class.expanded]="expandedCategory() === category.name"
                  [class.danger]="category.completeness < 50"
                  (click)="toggleCategory(category.name)"
                >
                  <div class="roi-main">
                    <span class="roi-name">{{ category.name }}</span>
                    <div class="roi-bar-container">
                      <div class="roi-bar">
                        <div
                          class="roi-fill"
                          [style.width.%]="category.completeness"
                          [class]="getROIClass(category.completeness)"
                        ></div>
                      </div>
                      <span class="roi-percent" [class]="getROIClass(category.completeness)">
                        {{ category.completeness }}%
                      </span>
                    </div>
                    <span class="expand-icon">{{ expandedCategory() === category.name ? '▼' : '▶' }}</span>
                  </div>

                  @if (expandedCategory() === category.name) {
                    <div class="roi-gaps">
                      <div class="gaps-header">Missing elements ({{ category.gaps.length }}):</div>
                      <ul class="gaps-list">
                        @for (gap of category.gaps; track gap) {
                          <li>{{ gap }}</li>
                        }
                      </ul>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }

        @if (currentView() === 'incidents') {
          <!-- INCIDENTS DETAIL VIEW -->
          <div class="detail-view">
            <div class="detail-header">
              <button class="back-to-main" (click)="openView('main')">← Back to overview</button>
              <h2>Incidents</h2>
              <span class="detail-count">{{ activeIncidentCount() }} active</span>
            </div>

            @if (activeIncidentCount() === 0) {
              <div class="no-incidents">
                <div class="no-incidents-icon">✓</div>
                <h3>No active incidents</h3>
                <p>All systems operating normally.</p>
              </div>
            } @else {
              <div class="incidents-list">
                @for (incident of activeIncidents(); track incident.id) {
                  <div class="incident-card" [class]="incident.severity.toLowerCase()">
                    <div class="incident-severity">{{ incident.severity }}</div>
                    <div class="incident-info">
                      <div class="incident-title">{{ incident.title }}</div>
                      <div class="incident-vendor">{{ incident.vendor }}</div>
                    </div>
                    <div class="incident-time">
                      <div class="countdown" [class]="getCountdownClass(incident.timeRemaining)">
                        {{ formatCountdown(incident.timeRemaining) }}
                      </div>
                      <div class="time-label">to classify</div>
                    </div>
                  </div>
                }
              </div>
            }

            <div class="incidents-history">
              <h3>Recently resolved</h3>
              @for (incident of resolvedIncidents(); track incident.id) {
                <div class="history-item">
                  <span class="history-severity" [class]="incident.severity.toLowerCase()">{{ incident.severity }}</span>
                  <span class="history-title">{{ incident.title }}</span>
                  <span class="history-time">{{ incident.timeAgo }}</span>
                </div>
              }
            </div>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .nerve-center {
      font-family: 'Outfit', sans-serif;
      background: #0a0e1a;
      min-height: 100vh;
      color: #e6edf3;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 32px;
      background: rgba(10, 14, 26, 0.95);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .back-btn {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: #7d8590;
      text-decoration: none;
      padding: 10px 16px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      transition: all 0.2s;
    }

    .back-btn:hover {
      border-color: #00E5FF;
      color: #00E5FF;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .title {
      font-size: 20px;
      font-weight: 600;
      margin: 0;
    }

    .premium-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      padding: 6px 12px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #0a0e1a;
      border-radius: 4px;
      letter-spacing: 1px;
    }

    .live-indicator {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: #22C55E;
    }

    .pulse {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #22C55E;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
      50% { opacity: 0.7; box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
    }

    /* Content */
    .content {
      padding: 40px 32px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Summary Cards */
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .summary-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 32px;
      display: flex;
      align-items: center;
      gap: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .summary-card:hover {
      border-color: rgba(0, 229, 255, 0.4);
      background: rgba(0, 229, 255, 0.03);
      transform: translateY(-2px);
    }

    .summary-card.has-risk {
      border-color: rgba(239, 68, 68, 0.4);
    }

    .summary-card.has-warning {
      border-color: rgba(245, 158, 11, 0.3);
    }

    .summary-card.has-incident {
      border-color: rgba(239, 68, 68, 0.4);
      animation: incident-pulse 2s infinite;
    }

    @keyframes incident-pulse {
      0%, 100% { background: rgba(239, 68, 68, 0.03); }
      50% { background: rgba(239, 68, 68, 0.08); }
    }

    .card-icon {
      font-size: 32px;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-icon.ok {
      color: #22C55E;
      font-size: 28px;
    }

    .progress-ring {
      width: 48px;
      height: 48px;
      transform: rotate(-90deg);
    }

    .ring-bg {
      fill: none;
      stroke: rgba(255, 255, 255, 0.1);
      stroke-width: 3;
    }

    .ring-fill {
      fill: none;
      stroke-width: 3;
      stroke-linecap: round;
      transition: stroke-dasharray 0.5s;
    }

    .ring-fill.good { stroke: #22C55E; }
    .ring-fill.warning { stroke: #f59e0b; }
    .ring-fill.danger { stroke: #ef4444; }

    .card-main {
      display: flex;
      flex-direction: column;
    }

    .big-number {
      font-family: 'JetBrains Mono', monospace;
      font-size: 36px;
      font-weight: 700;
      color: #00E5FF;
      line-height: 1;
    }

    .card-label {
      font-size: 14px;
      color: #7d8590;
      margin-top: 4px;
    }

    .card-divider {
      color: rgba(255, 255, 255, 0.15);
      font-size: 24px;
    }

    .card-secondary {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .secondary-number {
      font-family: 'JetBrains Mono', monospace;
      font-size: 20px;
      font-weight: 600;
    }

    .card-secondary.danger .secondary-number {
      color: #ef4444;
    }

    .card-secondary.warning .secondary-label {
      color: #f59e0b;
    }

    .card-secondary.ok .secondary-note {
      color: #22C55E;
    }

    .secondary-label {
      font-size: 13px;
      color: #a0a0a0;
    }

    .secondary-note {
      font-size: 12px;
      color: #7d8590;
    }

    .card-arrow {
      font-size: 20px;
      color: #7d8590;
      transition: transform 0.2s;
    }

    .summary-card:hover .card-arrow {
      transform: translateX(4px);
      color: #00E5FF;
    }

    .quick-info {
      text-align: center;
      margin-top: 32px;
      color: #7d8590;
      font-size: 14px;
    }

    /* Detail Views */
    .detail-view {
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .detail-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 32px;
    }

    .back-to-main {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #00E5FF;
      background: none;
      border: 1px solid rgba(0, 229, 255, 0.3);
      padding: 10px 16px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .back-to-main:hover {
      background: rgba(0, 229, 255, 0.1);
    }

    .detail-header h2 {
      font-size: 24px;
      font-weight: 600;
      margin: 0;
      flex: 1;
    }

    .detail-count {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      color: #7d8590;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 20px;
    }

    /* Vendor Table */
    .vendor-table {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      overflow: hidden;
    }

    .table-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 80px;
      padding: 16px 24px;
      background: rgba(0, 0, 0, 0.3);
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #7d8590;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .table-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 80px;
      padding: 16px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      cursor: pointer;
      transition: all 0.2s;
    }

    .table-row:hover {
      background: rgba(0, 229, 255, 0.03);
    }

    .table-row.selected {
      background: rgba(0, 229, 255, 0.08);
      border-left: 3px solid #00E5FF;
    }

    .table-row.high-risk {
      background: rgba(239, 68, 68, 0.03);
    }

    .table-row.high-risk.selected {
      background: rgba(239, 68, 68, 0.08);
      border-left-color: #ef4444;
    }

    .col-name { font-weight: 500; }
    .col-country { color: #a0a0a0; }
    .col-type { color: #7d8590; font-size: 13px; }
    .col-risk { text-align: right; }

    .risk-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 4px;
    }

    .risk-badge.large {
      font-size: 16px;
      padding: 8px 16px;
    }

    .risk-badge.small {
      font-size: 10px;
      padding: 3px 8px;
    }

    .risk-badge.low { background: rgba(34, 197, 94, 0.15); color: #22C55E; }
    .risk-badge.medium { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .risk-badge.high { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

    /* Slide Panel */
    .slide-panel {
      position: fixed;
      top: 0; right: 0; bottom: 0; left: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: flex-end;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    .panel-content {
      width: 400px;
      background: #12161f;
      border-left: 1px solid rgba(255, 255, 255, 0.08);
      animation: slideIn 0.3s ease;
      overflow-y: auto;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .panel-header h3 {
      font-size: 18px;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      color: #7d8590;
      font-size: 20px;
      cursor: pointer;
      padding: 8px;
      transition: color 0.2s;
    }

    .close-btn:hover { color: #e6edf3; }

    .panel-body { padding: 24px; }

    .vendor-detail {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .detail-label { color: #7d8590; }

    .subcontractors-section {
      margin-top: 32px;
    }

    .subcontractors-section h4 {
      font-size: 14px;
      color: #7d8590;
      margin: 0 0 16px 0;
      font-weight: 500;
    }

    .no-subs {
      color: #7d8590;
      font-size: 13px;
      padding: 24px;
      text-align: center;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 8px;
    }

    .sub-chain {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .sub-item {
      position: relative;
      padding-left: 24px;
    }

    .chain-line {
      position: absolute;
      left: 8px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: rgba(0, 229, 255, 0.3);
    }

    .sub-item:last-child .chain-line {
      height: 50%;
    }

    .sub-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .sub-card.high-risk {
      border-color: rgba(239, 68, 68, 0.3);
      background: rgba(239, 68, 68, 0.03);
    }

    .sub-name { font-size: 14px; font-weight: 500; flex: 1; }

    .sub-meta {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: #7d8590;
    }

    /* ROI List */
    .roi-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .roi-item {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s;
    }

    .roi-item:hover {
      border-color: rgba(0, 229, 255, 0.3);
    }

    .roi-item.danger {
      border-color: rgba(239, 68, 68, 0.3);
      background: rgba(239, 68, 68, 0.02);
    }

    .roi-item.expanded {
      border-color: rgba(0, 229, 255, 0.5);
    }

    .roi-main {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 20px 24px;
    }

    .roi-name {
      font-size: 15px;
      font-weight: 500;
      min-width: 180px;
    }

    .roi-bar-container {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .roi-bar {
      flex: 1;
      height: 8px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 4px;
      overflow: hidden;
    }

    .roi-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .roi-fill.high { background: linear-gradient(90deg, #22C55E, #10b981); }
    .roi-fill.medium { background: linear-gradient(90deg, #f59e0b, #d97706); }
    .roi-fill.low { background: linear-gradient(90deg, #ef4444, #dc2626); }

    .roi-percent {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 600;
      min-width: 50px;
      text-align: right;
    }

    .roi-percent.high { color: #22C55E; }
    .roi-percent.medium { color: #f59e0b; }
    .roi-percent.low { color: #ef4444; }

    .expand-icon {
      color: #7d8590;
      font-size: 12px;
      transition: transform 0.2s;
    }

    .roi-gaps {
      padding: 0 24px 24px;
      animation: fadeIn 0.2s ease;
    }

    .gaps-header {
      font-size: 13px;
      color: #7d8590;
      margin-bottom: 12px;
    }

    .gaps-list {
      margin: 0;
      padding-left: 20px;
      color: #a0a0a0;
      font-size: 14px;
    }

    .gaps-list li {
      margin-bottom: 8px;
    }

    /* Incidents */
    .no-incidents {
      text-align: center;
      padding: 80px 40px;
      background: rgba(34, 197, 94, 0.03);
      border: 1px solid rgba(34, 197, 94, 0.2);
      border-radius: 16px;
    }

    .no-incidents-icon {
      font-size: 48px;
      color: #22C55E;
      margin-bottom: 16px;
    }

    .no-incidents h3 {
      font-size: 20px;
      margin: 0 0 8px 0;
      color: #22C55E;
    }

    .no-incidents p {
      color: #7d8590;
      margin: 0;
    }

    .incidents-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .incident-card {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 20px 24px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
    }

    .incident-card.p1 {
      border-color: rgba(239, 68, 68, 0.4);
      background: rgba(239, 68, 68, 0.03);
    }

    .incident-card.p2 {
      border-color: rgba(245, 158, 11, 0.3);
      background: rgba(245, 158, 11, 0.02);
    }

    .incident-severity {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 700;
      padding: 8px 14px;
      border-radius: 6px;
    }

    .incident-card.p1 .incident-severity {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }

    .incident-card.p2 .incident-severity {
      background: rgba(245, 158, 11, 0.2);
      color: #f59e0b;
    }

    .incident-info { flex: 1; }

    .incident-title {
      font-size: 15px;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .incident-vendor {
      font-size: 13px;
      color: #7d8590;
    }

    .incident-time { text-align: right; }

    .countdown {
      font-family: 'JetBrains Mono', monospace;
      font-size: 22px;
      font-weight: 700;
    }

    .countdown.ok { color: #22C55E; }
    .countdown.warning { color: #f59e0b; }
    .countdown.urgent { color: #ef4444; }

    .time-label {
      font-size: 11px;
      color: #7d8590;
      margin-top: 4px;
    }

    .incidents-history {
      margin-top: 40px;
    }

    .incidents-history h3 {
      font-size: 16px;
      font-weight: 500;
      color: #7d8590;
      margin: 0 0 16px 0;
    }

    .history-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 20px;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 8px;
      margin-bottom: 8px;
    }

    .history-severity {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .history-severity.p1 { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .history-severity.p2 { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .history-severity.p3 { background: rgba(139, 148, 158, 0.15); color: #8b949e; }

    .history-title {
      flex: 1;
      font-size: 14px;
      color: #a0a0a0;
    }

    .history-time {
      font-size: 13px;
      color: #7d8590;
    }

    /* Responsive */
    @media (max-width: 1100px) {
      .summary-cards {
        grid-template-columns: 1fr;
      }

      .summary-card {
        padding: 24px;
      }
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
        padding: 16px 20px;
      }

      .content {
        padding: 24px 20px;
      }

      .detail-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .table-header, .table-row {
        grid-template-columns: 1fr 80px;
      }

      .col-country, .col-type {
        display: none;
      }

      .panel-content {
        width: 100%;
      }

      .roi-main {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .roi-bar-container {
        width: 100%;
      }
    }
  `]
})
export class SupplyChainNerveCenterComponent implements OnInit, OnDestroy {
  // State
  readonly currentView = signal<ViewType>('main');
  readonly selectedVendor = signal<Vendor | null>(null);
  readonly expandedCategory = signal<string | null>(null);

  // Mock Data - European companies
  readonly vendors = signal<Vendor[]>([
    {
      id: 'v1', name: 'AWS Europe (Frankfurt)', country: 'Germany', countryCode: 'DE',
      type: 'Cloud Hosting', riskScore: 23,
      subcontractors: [
        { name: 'Equinix Frankfurt', country: 'Germany', type: 'Colocation', riskScore: 15 },
        { name: 'Level 3 Communications', country: 'USA', type: 'Network', riskScore: 28 }
      ]
    },
    {
      id: 'v2', name: 'Microsoft Azure (Dublin)', country: 'Ireland', countryCode: 'IE',
      type: 'Identity & Auth', riskScore: 21,
      subcontractors: [
        { name: 'Akamai Technologies', country: 'USA', type: 'CDN', riskScore: 19 }
      ]
    },
    {
      id: 'v3', name: 'Deutsche Telekom AG', country: 'Germany', countryCode: 'DE',
      type: 'Network', riskScore: 18,
      subcontractors: []
    },
    {
      id: 'v4', name: 'Onfido Ltd', country: 'UK', countryCode: 'GB',
      type: 'KYC', riskScore: 31,
      subcontractors: [
        { name: 'Jumio Corp', country: 'USA', type: 'AI/ML', riskScore: 42 }
      ]
    },
    {
      id: 'v5', name: 'CloudFlare Inc', country: 'USA', countryCode: 'US',
      type: 'CDN / WAF', riskScore: 28,
      subcontractors: [
        { name: 'Zayo Group', country: 'USA', type: 'Fiber', riskScore: 24 },
        { name: 'China Telecom', country: 'China', type: 'Transit', riskScore: 78 }
      ]
    },
    {
      id: 'v6', name: 'GlobalSign NV', country: 'Belgium', countryCode: 'BE',
      type: 'SSL Certificates', riskScore: 22,
      subcontractors: [
        { name: 'DigiCert Inc', country: 'USA', type: 'Root CA', riskScore: 19 }
      ]
    },
    {
      id: 'v7', name: 'Splunk Inc', country: 'USA', countryCode: 'US',
      type: 'SIEM', riskScore: 25,
      subcontractors: []
    },
    {
      id: 'v8', name: 'China Telecom Europe', country: 'China', countryCode: 'CN',
      type: 'Transit', riskScore: 78,
      subcontractors: [
        { name: 'Huawei Marine', country: 'China', type: 'Subsea Cable', riskScore: 82 }
      ]
    },
  ]);

  readonly roiCategories = signal<ROICategory[]>([
    { name: 'Exit strategies', completeness: 45, gaps: ['AWS exit plan missing', 'Azure alternatives not defined', 'Data migration procedure missing'] },
    { name: 'Subcontractors', completeness: 67, gaps: ['Tier 3+ vendors not mapped', '4 vendor subcontractors unknown'] },
    { name: 'Risk assessments', completeness: 78, gaps: ['3 vendor risk assessments outdated', 'Geopolitical risk not assessed'] },
    { name: 'Contracts', completeness: 89, gaps: ['2 contracts missing audit clause'] },
    { name: 'ICT providers', completeness: 94, gaps: ['1 vendor data incomplete'] },
    { name: 'Incidents', completeness: 96, gaps: ['Auto-classification not configured'] },
  ]);

  readonly incidents = signal<Incident[]>([
    { id: 'INC-001', severity: 'P1', title: 'Azure AD latency spike', vendor: 'Microsoft Azure', timeAgo: '', timeRemaining: 47, status: 'active' },
    { id: 'INC-002', severity: 'P2', title: 'CloudFlare WAF rule conflict', vendor: 'CloudFlare Inc', timeAgo: '', timeRemaining: 156, status: 'active' },
    { id: 'INC-003', severity: 'P2', title: 'SSL certificate expiring', vendor: 'GlobalSign NV', timeAgo: '12h ago', timeRemaining: 0, status: 'resolved' },
    { id: 'INC-004', severity: 'P3', title: 'API rate limit exceeded', vendor: 'Onfido Ltd', timeAgo: '2d ago', timeRemaining: 0, status: 'resolved' },
  ]);

  // Computed
  readonly highRiskCount = computed(() =>
    this.vendors().filter(v => v.riskScore >= 60).length
  );

  readonly overallROI = computed(() => {
    const cats = this.roiCategories();
    return Math.round(cats.reduce((acc, c) => acc + c.completeness, 0) / cats.length);
  });

  readonly roiDashArray = computed(() => {
    const pct = this.overallROI();
    const circumference = 2 * Math.PI * 15.9;
    return `${(pct / 100) * circumference} ${circumference}`;
  });

  readonly worstCategory = computed(() => {
    const sorted = [...this.roiCategories()].sort((a, b) => a.completeness - b.completeness);
    return sorted[0];
  });

  readonly activeIncidentCount = computed(() =>
    this.incidents().filter(i => i.status === 'active').length
  );

  readonly activeIncidents = computed(() =>
    this.incidents().filter(i => i.status === 'active')
  );

  readonly resolvedIncidents = computed(() =>
    this.incidents().filter(i => i.status === 'resolved')
  );

  readonly lastIncidentTime = computed(() => {
    const resolved = this.resolvedIncidents();
    return resolved.length > 0 ? resolved[0].timeAgo : 'none';
  });

  readonly sortedVendors = computed(() =>
    [...this.vendors()].sort((a, b) => b.riskScore - a.riskScore)
  );

  readonly sortedROICategories = computed(() =>
    [...this.roiCategories()].sort((a, b) => a.completeness - b.completeness)
  );

  private timeInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.timeInterval = setInterval(() => {
      this.incidents.update(incidents =>
        incidents.map(inc =>
          inc.status === 'active'
            ? { ...inc, timeRemaining: Math.max(0, inc.timeRemaining - 1) }
            : inc
        )
      );
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.timeInterval) clearInterval(this.timeInterval);
  }

  openView(view: ViewType): void {
    this.currentView.set(view);
    this.selectedVendor.set(null);
    this.expandedCategory.set(null);
  }

  selectVendor(vendor: Vendor): void {
    this.selectedVendor.set(vendor);
  }

  closeVendorPanel(event: MouseEvent): void {
    this.selectedVendor.set(null);
  }

  toggleCategory(name: string): void {
    this.expandedCategory.update(current =>
      current === name ? null : name
    );
  }

  getFlag(countryCode: string): string {
    const flags: Record<string, string> = {
      'DE': '🇩🇪', 'EE': '🇪🇪', 'IE': '🇮🇪', 'BE': '🇧🇪', 'SE': '🇸🇪',
      'US': '🇺🇸', 'GB': '🇬🇧', 'CN': '🇨🇳', 'FR': '🇫🇷', 'NL': '🇳🇱',
      'ES': '🇪🇸', 'IT': '🇮🇹', 'AT': '🇦🇹', 'CH': '🇨🇭', 'PL': '🇵🇱'
    };
    return flags[countryCode] || '🏳️';
  }

  getRiskClass(score: number): string {
    if (score < 30) return 'low';
    if (score < 60) return 'medium';
    return 'high';
  }

  getROIClass(completeness: number): string {
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
}
