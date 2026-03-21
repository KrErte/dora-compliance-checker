import { Component, OnInit, OnDestroy, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';

const PILLAR_NAMES: Record<string, { et: string; en: string }> = {
  ICT_RISK_MANAGEMENT: { et: 'IKT riskihaldus', en: 'ICT Risk Management' },
  INCIDENT_MANAGEMENT: { et: 'Intsidendihaldus', en: 'Incident Management' },
  TESTING: { et: 'Testimine', en: 'Digital Operational Resilience Testing' },
  THIRD_PARTY: { et: 'Kolmandad osapooled', en: 'Third-Party Risk Management' },
  INFORMATION_SHARING: { et: 'Teabe jagamine', en: 'Information Sharing' },
};

const PILLAR_ARTICLES: Record<string, string> = {
  ICT_RISK_MANAGEMENT: 'Art. 5–16',
  INCIDENT_MANAGEMENT: 'Art. 17–23',
  TESTING: 'Art. 24–27',
  THIRD_PARTY: 'Art. 28–44',
  INFORMATION_SHARING: 'Art. 45',
};

const MODULE_ICONS: Record<string, string> = {
  assessment: '📋',
  evidence: '📁',
  remediation: '🔧',
  incidents: '🚨',
  thirdParty: '🤝',
  roi: '📊',
};

const MODULE_NAMES: Record<string, { et: string; en: string }> = {
  assessment: { et: 'Hindamine', en: 'Assessment' },
  evidence: { et: 'Tõendusmaterjalid', en: 'Evidence Vault' },
  remediation: { et: 'Parandused', en: 'Remediation' },
  incidents: { et: 'Intsidendid', en: 'Incidents' },
  thirdParty: { et: 'Kolmandad osapooled', en: 'Third-Party' },
  roi: { et: 'Teaberegister', en: 'Register of Information' },
};

interface HistoryEntry {
  id: string;
  scorePercentage: number;
  assessmentDate: string;
  complianceLevel: string;
}

interface MaturityData {
  [areaId: string]: number;
}

const MATURITY_AREAS = [
  { id: 'a1', pillar: 'P1', articleRef: 'Art. 5', name: { et: 'Juhtimine', en: 'Governance' }},
  { id: 'a2', pillar: 'P1', articleRef: 'Art. 6', name: { et: 'Riskihaldus', en: 'Risk Mgmt Framework' }},
  { id: 'a3', pillar: 'P1', articleRef: 'Art. 7', name: { et: 'ICT süsteemid', en: 'ICT Systems' }},
  { id: 'a4', pillar: 'P1', articleRef: 'Art. 8', name: { et: 'Kaardistamine', en: 'Identification' }},
  { id: 'a5', pillar: 'P1', articleRef: 'Art. 9', name: { et: 'Kaitse', en: 'Protection' }},
  { id: 'a6', pillar: 'P1', articleRef: 'Art. 10', name: { et: 'Tuvastamine', en: 'Detection' }},
  { id: 'a7', pillar: 'P1', articleRef: 'Art. 11-12', name: { et: 'Taastamine', en: 'Recovery' }},
  { id: 'a8', pillar: 'P1', articleRef: 'Art. 13', name: { et: 'Õppimine', en: 'Learning' }},
  { id: 'b1', pillar: 'P2', articleRef: 'Art. 17', name: { et: 'Protsess', en: 'Process' }},
  { id: 'b2', pillar: 'P2', articleRef: 'Art. 18', name: { et: 'Klassifitseerimine', en: 'Classification' }},
  { id: 'b3', pillar: 'P2', articleRef: 'Art. 19', name: { et: 'Raporteerimne', en: 'Reporting' }},
  { id: 'c1', pillar: 'P3', articleRef: 'Art. 24-25', name: { et: 'Testimine', en: 'Testing' }},
  { id: 'c2', pillar: 'P3', articleRef: 'Art. 26-27', name: { et: 'TLPT', en: 'TLPT' }},
  { id: 'd1', pillar: 'P4', articleRef: 'Art. 28', name: { et: 'Strateegia', en: 'Strategy' }},
  { id: 'd2', pillar: 'P4', articleRef: 'Art. 29', name: { et: 'Kontsentratsiooni risk', en: 'Concentration Risk' }},
  { id: 'd3', pillar: 'P4', articleRef: 'Art. 30', name: { et: 'Lepingud', en: 'Contracts' }},
  { id: 'e1', pillar: 'P5', articleRef: 'Art. 45', name: { et: 'Teabe jagamine', en: 'Info Sharing' }},
];

const PILLAR_ID_MAP: Record<string, string> = {
  P1: 'ICT_RISK_MANAGEMENT',
  P2: 'INCIDENT_MANAGEMENT',
  P3: 'TESTING',
  P4: 'THIRD_PARTY',
  P5: 'INFORMATION_SHARING',
};

@Component({
  selector: 'app-board-presentation',
  standalone: true,
  imports: [CommonModule],
  template: `
<!-- Loading -->
@if (loading()) {
  <div class="bp-loading">
    <div class="bp-spinner"></div>
    <p>{{ t('bp.loading') }}</p>
  </div>
}

<!-- No data -->
@if (!loading() && !data()) {
  <div class="bp-loading">
    <p style="font-size:1.5rem">{{ t('bp.no_data') }}</p>
    <button class="bp-btn" (click)="exit()">{{ t('bp.exit') }}</button>
  </div>
}

<!-- Presentation -->
@if (!loading() && data()) {
  <div class="bp-container" [class.bp-fullscreen]="isFullscreen()">

    <!-- Top bar -->
    <div class="bp-topbar">
      <span class="bp-counter">{{ currentSlide() + 1 }} / {{ totalSlides }}</span>
      <div class="bp-topbar-actions">
        <button class="bp-btn-sm" (click)="toggleAutoplay()" [title]="t('bp.autoplay')">
          {{ autoplay() ? '⏸' : '▶' }}
        </button>
        <button class="bp-btn-sm" (click)="toggleFullscreen()" [title]="t('bp.fullscreen')">⛶</button>
        <button class="bp-btn-sm" (click)="exit()" [title]="t('bp.exit')">✕</button>
      </div>
    </div>

    <!-- Slides -->
    <div class="bp-stage">

      <!-- Slide 0: Title -->
      @if (currentSlide() === 0) {
        <div class="bp-slide bp-slide-enter">
          <div class="bp-title-slide">
            <div class="bp-logo">DoraAudit</div>
            <h1 class="bp-main-title">{{ t('bp.title') }}</h1>
            <p class="bp-subtitle">{{ t('bp.subtitle') }}</p>
            <p class="bp-date">{{ today }}</p>
          </div>
        </div>
      }

      <!-- Slide 1: Overall Score -->
      @if (currentSlide() === 1) {
        <div class="bp-slide bp-slide-enter">
          <h2 class="bp-slide-title">{{ t('bp.slide_score') }}</h2>
          <div class="bp-score-wrap">
            <svg class="bp-gauge" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="85" fill="none" stroke="#e2e8f0" stroke-width="12"/>
              <circle cx="100" cy="100" r="85" fill="none"
                [attr.stroke]="levelColor()"
                stroke-width="12"
                stroke-linecap="round"
                [attr.stroke-dasharray]="gaugeDash()"
                stroke-dashoffset="534"
                transform="rotate(-90 100 100)"
                class="bp-gauge-fill"/>
            </svg>
            <div class="bp-gauge-text">
              <span class="bp-gauge-number">{{ animatedScore() }}</span>
              <span class="bp-gauge-pct">%</span>
            </div>
          </div>
          <div class="bp-level-badge" [style.background]="levelColor()">
            {{ data().level }}
          </div>
        </div>
      }

      <!-- Slide 2: DORA Pillars -->
      @if (currentSlide() === 2) {
        <div class="bp-slide bp-slide-enter">
          <h2 class="bp-slide-title">{{ t('bp.slide_pillars') }}</h2>
          <div class="bp-pillars">
            @for (p of pillarList(); track p.key; let i = $index) {
              <div class="bp-pillar-row" [style.animation-delay]="(i * 150) + 'ms'">
                <div class="bp-pillar-label">
                  <span class="bp-pillar-name">{{ pillarName(p.key) }}</span>
                  <span class="bp-pillar-ref">{{ pillarArticle(p.key) }}</span>
                </div>
                <div class="bp-bar-track">
                  <div class="bp-bar-fill" [style.width.%]="p.score" [style.background]="barColor(p.score)" [style.animation-delay]="(i * 150 + 300) + 'ms'"></div>
                </div>
                <span class="bp-pillar-score">{{ p.score }}%</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Slide 3: Module Health -->
      @if (currentSlide() === 3) {
        <div class="bp-slide bp-slide-enter">
          <h2 class="bp-slide-title">{{ t('bp.slide_modules') }}</h2>
          <div class="bp-modules-grid">
            @for (m of moduleList(); track m.key; let i = $index) {
              <div class="bp-module-card" [style.animation-delay]="(i * 120) + 'ms'">
                <div class="bp-module-icon">{{ moduleIcon(m.key) }}</div>
                <div class="bp-module-name">{{ moduleName(m.key) }}</div>
                <div class="bp-module-score" [style.color]="barColor(m.score)">{{ m.score }}%</div>
                <div class="bp-module-label">{{ m.label }}</div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Slide 4: Risk Overview -->
      @if (currentSlide() === 4) {
        <div class="bp-slide bp-slide-enter">
          <h2 class="bp-slide-title">{{ t('bp.slide_risks') }}</h2>
          <div class="bp-risk-grid">
            <div class="bp-risk-card bp-risk-anim" style="animation-delay:0ms">
              <div class="bp-risk-number" [style.color]="levelColor()">{{ data().level }}</div>
              <div class="bp-risk-label">{{ t('bp.risk_level') }}</div>
            </div>
            <div class="bp-risk-card bp-risk-anim" style="animation-delay:150ms">
              <div class="bp-risk-number bp-countup" [attr.data-target]="criticalActions()">{{ criticalActions() }}</div>
              <div class="bp-risk-label">{{ t('bp.critical_actions') }}</div>
            </div>
            <div class="bp-risk-card bp-risk-anim" style="animation-delay:300ms">
              <div class="bp-risk-number bp-countup">{{ thirdPartyCount() }}</div>
              <div class="bp-risk-label">{{ t('bp.third_party_providers') }}</div>
            </div>
            <div class="bp-risk-card bp-risk-anim" style="animation-delay:450ms">
              <div class="bp-risk-number bp-countup">{{ overdueCount() }}</div>
              <div class="bp-risk-label">{{ t('bp.overdue_items') }}</div>
            </div>
          </div>
        </div>
      }

      <!-- Slide 5: Trend -->
      @if (currentSlide() === 5) {
        <div class="bp-slide bp-slide-enter">
          <h2 class="bp-slide-title">{{ t('bp.slide_trend') }}</h2>
          @if (historyEntries().length === 0) {
            <p class="bp-empty">{{ t('bp.no_history') }}</p>
          } @else {
            <div class="bp-trend-chart">
              @for (h of historyEntries(); track h.id; let i = $index) {
                <div class="bp-trend-col" [style.animation-delay]="(i * 100) + 'ms'">
                  <div class="bp-trend-value">{{ h.scorePercentage }}%</div>
                  <div class="bp-trend-bar-wrap">
                    <div class="bp-trend-bar" [style.height.%]="h.scorePercentage" [style.background]="barColor(h.scorePercentage)" [style.animation-delay]="(i * 100 + 200) + 'ms'"></div>
                  </div>
                  <div class="bp-trend-date">{{ formatDate(h.assessmentDate) }}</div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Slide 6: Maturity -->
      @if (currentSlide() === 6) {
        <div class="bp-slide bp-slide-enter">
          <h2 class="bp-slide-title">{{ t('bp.slide_maturity') }}</h2>
          @if (maturityPillars().length === 0) {
            <p class="bp-empty">{{ t('bp.no_maturity') }}</p>
          } @else {
            <div class="bp-maturity">
              @for (mp of maturityPillars(); track mp.key; let i = $index) {
                <div class="bp-maturity-row" [style.animation-delay]="(i * 150) + 'ms'">
                  <div class="bp-maturity-label">{{ mp.name }}</div>
                  <div class="bp-bar-track">
                    <div class="bp-bar-fill bp-maturity-fill" [style.width.%]="(mp.avg / 5) * 100" [style.background]="maturityColor(mp.avg)" [style.animation-delay]="(i * 150 + 300) + 'ms'"></div>
                  </div>
                  <span class="bp-maturity-score">{{ mp.avg.toFixed(1) }} / 5</span>
                </div>
              }
            </div>
            <div class="bp-maturity-legend">
              <span>0 — {{ t('bp.mat_nonexistent') }}</span>
              <span>1 — {{ t('bp.mat_initial') }}</span>
              <span>2 — {{ t('bp.mat_developing') }}</span>
              <span>3 — {{ t('bp.mat_defined') }}</span>
              <span>4 — {{ t('bp.mat_managed') }}</span>
              <span>5 — {{ t('bp.mat_optimised') }}</span>
            </div>
          }
        </div>
      }

      <!-- Slide 7: Action Items -->
      @if (currentSlide() === 7) {
        <div class="bp-slide bp-slide-enter">
          <h2 class="bp-slide-title">{{ t('bp.slide_actions') }}</h2>
          @if (!data().actions || data().actions.length === 0) {
            <p class="bp-empty">{{ t('bp.no_actions') }}</p>
          } @else {
            <div class="bp-actions">
              @for (a of data().actions; track $index; let i = $index) {
                <div class="bp-action-row bp-action-anim" [style.animation-delay]="(i * 150) + 'ms'">
                  <span class="bp-action-badge" [style.background]="priorityColor(a.priority)">{{ a.priority }}</span>
                  <span class="bp-action-text">{{ a.action }}</span>
                  <span class="bp-action-impact">{{ a.impact }}</span>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Slide 8: Summary -->
      @if (currentSlide() === 8) {
        <div class="bp-slide bp-slide-enter">
          <div class="bp-summary-slide">
            <h2 class="bp-slide-title">{{ t('bp.slide_summary') }}</h2>
            <div class="bp-summary-grid">
              <div class="bp-summary-item bp-summary-anim" style="animation-delay:0ms">
                <div class="bp-summary-num" [style.color]="levelColor()">{{ data().overallScore }}%</div>
                <div class="bp-summary-lbl">{{ t('bp.overall_score') }}</div>
              </div>
              <div class="bp-summary-item bp-summary-anim" style="animation-delay:150ms">
                <div class="bp-summary-num">{{ moduleList().length }}</div>
                <div class="bp-summary-lbl">{{ t('bp.modules_tracked') }}</div>
              </div>
              <div class="bp-summary-item bp-summary-anim" style="animation-delay:300ms">
                <div class="bp-summary-num">{{ data().actions?.length || 0 }}</div>
                <div class="bp-summary-lbl">{{ t('bp.priority_actions') }}</div>
              </div>
              <div class="bp-summary-item bp-summary-anim" style="animation-delay:450ms">
                <div class="bp-summary-num">{{ historyEntries().length }}</div>
                <div class="bp-summary-lbl">{{ t('bp.assessments_completed') }}</div>
              </div>
            </div>
            <p class="bp-thank-you">{{ t('bp.thank_you') }}</p>
            <p class="bp-powered">Powered by DoraAudit.eu</p>
          </div>
        </div>
      }

    </div>

    <!-- Bottom dots -->
    <div class="bp-dots">
      @for (s of slides; track $index; let i = $index) {
        <button class="bp-dot" [class.bp-dot-active]="currentSlide() === i" (click)="goTo(i)"></button>
      }
    </div>

    <!-- Nav arrows -->
    <button class="bp-arrow bp-arrow-left" (click)="prev()" [class.bp-hidden]="currentSlide() === 0">‹</button>
    <button class="bp-arrow bp-arrow-right" (click)="next()" [class.bp-hidden]="currentSlide() === totalSlides - 1">›</button>

  </div>
}
  `,
  styles: [`
    :host { display: block; }

    /* Loading */
    .bp-loading {
      position: fixed; inset: 0; z-index: 10000;
      background: linear-gradient(135deg, #0f172a 0%, #020617 100%);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      color: #e2e8f0; font-family: 'Inter', system-ui, sans-serif;
    }
    .bp-spinner {
      width: 48px; height: 48px; border: 4px solid #334155; border-top-color: #3b82f6;
      border-radius: 50%; animation: bp-spin 0.8s linear infinite;
    }
    @keyframes bp-spin { to { transform: rotate(360deg); } }

    /* Container */
    .bp-container {
      position: fixed; inset: 0; z-index: 9999;
      background: linear-gradient(135deg, #0f172a 0%, #020617 100%);
      color: #e2e8f0; font-family: 'Inter', system-ui, sans-serif;
      display: flex; flex-direction: column; overflow: hidden;
      user-select: none;
    }

    /* Top bar */
    .bp-topbar {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 32px; z-index: 10;
    }
    .bp-counter { font-size: 0.875rem; color: #94a3b8; font-variant-numeric: tabular-nums; }
    .bp-topbar-actions { display: flex; gap: 8px; }
    .bp-btn-sm {
      background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1);
      color: #cbd5e1; border-radius: 8px; padding: 6px 14px; cursor: pointer;
      font-size: 1rem; transition: background 0.2s;
    }
    .bp-btn-sm:hover { background: rgba(255,255,255,0.15); }
    .bp-btn {
      background: #3b82f6; color: #fff; border: none; border-radius: 8px;
      padding: 12px 32px; font-size: 1rem; cursor: pointer; margin-top: 24px;
    }

    /* Stage */
    .bp-stage {
      flex: 1; display: flex; align-items: center; justify-content: center;
      padding: 0 64px; min-height: 0;
    }

    /* Slide */
    .bp-slide {
      width: 100%; max-width: 1100px; display: flex; flex-direction: column;
      align-items: center; text-align: center;
    }
    .bp-slide-enter { animation: bp-fadeIn 0.5s ease-out both; }
    @keyframes bp-fadeIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }

    .bp-slide-title {
      font-size: 2rem; font-weight: 700; margin-bottom: 40px; color: #f1f5f9;
      letter-spacing: -0.02em;
    }

    /* === Slide 0: Title === */
    .bp-title-slide { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .bp-logo { font-size: 1.125rem; font-weight: 600; color: #3b82f6; letter-spacing: 0.05em; text-transform: uppercase; }
    .bp-main-title { font-size: 3rem; font-weight: 800; line-height: 1.1; color: #f8fafc; margin: 0; letter-spacing: -0.03em; }
    .bp-subtitle { font-size: 1.5rem; color: #94a3b8; margin: 0; font-weight: 400; }
    .bp-date { font-size: 1rem; color: #64748b; margin-top: 24px; }

    /* === Slide 1: Gauge === */
    .bp-score-wrap { position: relative; width: 260px; height: 260px; margin-bottom: 32px; }
    .bp-gauge { width: 100%; height: 100%; }
    .bp-gauge-fill { transition: stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1); }
    .bp-gauge-text {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    }
    .bp-gauge-number { font-size: 4.5rem; font-weight: 800; font-variant-numeric: tabular-nums; }
    .bp-gauge-pct { font-size: 2rem; color: #94a3b8; margin-left: 2px; }
    .bp-level-badge {
      display: inline-block; padding: 8px 28px; border-radius: 100px;
      font-size: 1.125rem; font-weight: 700; letter-spacing: 0.08em; color: #fff;
    }

    /* === Slide 2: Pillars === */
    .bp-pillars { width: 100%; max-width: 800px; display: flex; flex-direction: column; gap: 20px; }
    .bp-pillar-row {
      display: grid; grid-template-columns: 260px 1fr 64px; align-items: center; gap: 16px;
      animation: bp-fadeIn 0.5s ease-out both;
    }
    .bp-pillar-label { text-align: left; }
    .bp-pillar-name { font-size: 1.125rem; font-weight: 600; display: block; }
    .bp-pillar-ref { font-size: 0.8rem; color: #64748b; }
    .bp-bar-track { height: 28px; background: #1e293b; border-radius: 14px; overflow: hidden; position: relative; }
    .bp-bar-fill {
      height: 100%; border-radius: 14px; width: 0;
      animation: bp-barGrow 1s cubic-bezier(0.4,0,0.2,1) forwards;
    }
    @keyframes bp-barGrow { from { width: 0; } }
    .bp-pillar-score { font-size: 1.25rem; font-weight: 700; font-variant-numeric: tabular-nums; text-align: right; }

    /* === Slide 3: Modules === */
    .bp-modules-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
      width: 100%; max-width: 800px;
    }
    .bp-module-card {
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px; padding: 28px 20px; text-align: center;
      animation: bp-cardIn 0.5s ease-out both;
    }
    @keyframes bp-cardIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
    .bp-module-icon { font-size: 2.25rem; margin-bottom: 8px; }
    .bp-module-name { font-size: 1rem; font-weight: 600; margin-bottom: 8px; }
    .bp-module-score { font-size: 2rem; font-weight: 800; }
    .bp-module-label { font-size: 0.8rem; color: #94a3b8; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }

    /* === Slide 4: Risk === */
    .bp-risk-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; max-width: 700px; width: 100%; }
    .bp-risk-card {
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px; padding: 36px 24px; text-align: center;
    }
    .bp-risk-anim { animation: bp-cardIn 0.5s ease-out both; }
    .bp-risk-number { font-size: 3rem; font-weight: 800; }
    .bp-risk-label { font-size: 1rem; color: #94a3b8; margin-top: 8px; }

    /* === Slide 5: Trend === */
    .bp-trend-chart {
      display: flex; align-items: flex-end; justify-content: center;
      gap: 16px; height: 340px; width: 100%; max-width: 900px;
      padding-bottom: 32px;
    }
    .bp-trend-col {
      display: flex; flex-direction: column; align-items: center; flex: 1; max-width: 80px;
      animation: bp-fadeIn 0.5s ease-out both;
    }
    .bp-trend-value { font-size: 0.875rem; font-weight: 700; margin-bottom: 8px; font-variant-numeric: tabular-nums; }
    .bp-trend-bar-wrap { width: 100%; height: 240px; background: #1e293b; border-radius: 8px; overflow: hidden; display: flex; align-items: flex-end; }
    .bp-trend-bar {
      width: 100%; border-radius: 8px 8px 0 0; height: 0;
      animation: bp-trendGrow 0.8s cubic-bezier(0.4,0,0.2,1) forwards;
    }
    @keyframes bp-trendGrow { from { height: 0; } }
    .bp-trend-date { font-size: 0.75rem; color: #64748b; margin-top: 8px; white-space: nowrap; }

    /* === Slide 6: Maturity === */
    .bp-maturity { width: 100%; max-width: 800px; display: flex; flex-direction: column; gap: 18px; }
    .bp-maturity-row {
      display: grid; grid-template-columns: 200px 1fr 80px; align-items: center; gap: 16px;
      animation: bp-fadeIn 0.5s ease-out both;
    }
    .bp-maturity-label { font-size: 1rem; font-weight: 600; text-align: left; }
    .bp-maturity-fill { animation: bp-barGrow 1s cubic-bezier(0.4,0,0.2,1) forwards; }
    .bp-maturity-score { font-size: 1.125rem; font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; }
    .bp-maturity-legend {
      display: flex; flex-wrap: wrap; justify-content: center; gap: 16px;
      margin-top: 28px; font-size: 0.8rem; color: #64748b;
    }

    /* === Slide 7: Actions === */
    .bp-actions { width: 100%; max-width: 800px; display: flex; flex-direction: column; gap: 16px; }
    .bp-action-row {
      display: flex; align-items: center; gap: 16px;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px; padding: 20px 24px; text-align: left;
    }
    .bp-action-anim { animation: bp-slideIn 0.5s ease-out both; }
    @keyframes bp-slideIn { from { opacity: 0; transform: translateX(-32px); } to { opacity: 1; transform: translateX(0); } }
    .bp-action-badge {
      display: inline-block; padding: 4px 12px; border-radius: 6px;
      font-size: 0.75rem; font-weight: 700; color: #fff; flex-shrink: 0;
      letter-spacing: 0.05em;
    }
    .bp-action-text { flex: 1; font-size: 1rem; }
    .bp-action-impact { font-size: 0.875rem; color: #22c55e; font-weight: 600; flex-shrink: 0; }

    /* === Slide 8: Summary === */
    .bp-summary-slide { display: flex; flex-direction: column; align-items: center; }
    .bp-summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; margin-bottom: 48px; max-width: 800px; width: 100%; }
    .bp-summary-item {
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px; padding: 28px 16px; text-align: center;
    }
    .bp-summary-anim { animation: bp-cardIn 0.5s ease-out both; }
    .bp-summary-num { font-size: 2.5rem; font-weight: 800; }
    .bp-summary-lbl { font-size: 0.875rem; color: #94a3b8; margin-top: 8px; }
    .bp-thank-you { font-size: 2rem; font-weight: 700; color: #f8fafc; margin: 0; }
    .bp-powered { font-size: 0.875rem; color: #475569; margin-top: 12px; }

    /* Nav dots */
    .bp-dots {
      display: flex; justify-content: center; gap: 8px; padding: 20px 0;
    }
    .bp-dot {
      width: 10px; height: 10px; border-radius: 50%; border: none;
      background: #334155; cursor: pointer; transition: all 0.2s; padding: 0;
    }
    .bp-dot-active { background: #3b82f6; transform: scale(1.3); }

    /* Arrows */
    .bp-arrow {
      position: fixed; top: 50%; transform: translateY(-50%);
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
      color: #e2e8f0; font-size: 2.5rem; width: 52px; height: 52px;
      border-radius: 50%; cursor: pointer; transition: background 0.2s;
      display: flex; align-items: center; justify-content: center; z-index: 20;
      line-height: 1;
    }
    .bp-arrow:hover { background: rgba(255,255,255,0.12); }
    .bp-arrow-left { left: 20px; }
    .bp-arrow-right { right: 20px; }
    .bp-hidden { opacity: 0; pointer-events: none; }

    .bp-empty { font-size: 1.25rem; color: #64748b; }

    /* Responsive */
    @media (max-width: 768px) {
      .bp-main-title { font-size: 2rem; }
      .bp-modules-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
      .bp-summary-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
      .bp-pillar-row { grid-template-columns: 140px 1fr 48px; }
      .bp-maturity-row { grid-template-columns: 120px 1fr 64px; }
      .bp-stage { padding: 0 32px; }
    }
  `]
})
export class BoardPresentationComponent implements OnInit, OnDestroy {
  readonly totalSlides = 9;
  readonly slides = Array.from({ length: 9 });
  readonly today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  loading = signal(true);
  data = signal<any>(null);
  currentSlide = signal(0);
  animatedScore = signal(0);
  isFullscreen = signal(false);
  autoplay = signal(false);

  historyEntries = signal<HistoryEntry[]>([]);
  maturityData = signal<MaturityData>({});

  private autoplayInterval: any = null;
  private scoreInterval: any = null;

  levelColor = computed(() => {
    const d = this.data();
    if (!d) return '#64748b';
    switch (d.level) {
      case 'EXCELLENT': return '#22c55e';
      case 'GOOD': return '#3b82f6';
      case 'AT_RISK': return '#f59e0b';
      case 'CRITICAL': return '#ef4444';
      default: return '#64748b';
    }
  });

  gaugeDash = computed(() => {
    const circumference = 2 * Math.PI * 85; // ~534
    const score = this.animatedScore();
    const offset = circumference - (score / 100) * circumference;
    return `${circumference} ${circumference}`;
  });

  maturityPillars = computed(() => {
    const md = this.maturityData();
    if (!md || Object.keys(md).length === 0) return [];

    const pillarGroups: Record<string, { levels: number[]; name: string }> = {};
    for (const area of MATURITY_AREAS) {
      const pillarKey = PILLAR_ID_MAP[area.pillar] || area.pillar;
      if (!pillarGroups[area.pillar]) {
        const pName = PILLAR_NAMES[pillarKey];
        pillarGroups[area.pillar] = { levels: [], name: pName ? (pName as any)[this.lang.lang()] || pName.en : area.pillar };
      }
      pillarGroups[area.pillar].levels.push(md[area.id] ?? 0);
    }

    return Object.entries(pillarGroups).map(([key, g]) => ({
      key,
      name: g.name,
      avg: g.levels.reduce((a, b) => a + b, 0) / g.levels.length,
    }));
  });

  constructor(private api: ApiService, public lang: LangService) {}

  ngOnInit() {
    // Load localStorage data
    try {
      const h = JSON.parse(localStorage.getItem('dora_history') || '[]');
      this.historyEntries.set((h as HistoryEntry[]).slice(0, 10));
    } catch { /* empty */ }

    try {
      const m = JSON.parse(localStorage.getItem('dora-maturity-model') || '{}');
      this.maturityData.set(m);
    } catch { /* empty */ }

    // Load API data
    this.api.getAuditReadiness().subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    // Try entering fullscreen
    this.requestFullscreen();
  }

  ngOnDestroy() {
    this.clearAutoplay();
    if (this.scoreInterval) clearInterval(this.scoreInterval);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  t(key: string): string {
    return this.lang.t(key);
  }

  // --- Navigation ---

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); this.next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); this.prev(); }
    else if (e.key === 'Escape') { this.exit(); }
  }

  next() {
    const cur = this.currentSlide();
    if (cur < this.totalSlides - 1) {
      this.currentSlide.set(cur + 1);
      this.onSlideChange();
    }
  }

  prev() {
    const cur = this.currentSlide();
    if (cur > 0) {
      this.currentSlide.set(cur - 1);
      this.onSlideChange();
    }
  }

  goTo(i: number) {
    this.currentSlide.set(i);
    this.onSlideChange();
  }

  private onSlideChange() {
    // Animate score gauge when entering slide 1
    if (this.currentSlide() === 1 && this.data()) {
      this.startScoreAnimation(this.data().overallScore);
    }
  }

  // --- Autoplay ---

  toggleAutoplay() {
    if (this.autoplay()) {
      this.clearAutoplay();
    } else {
      this.autoplay.set(true);
      this.autoplayInterval = setInterval(() => {
        if (this.currentSlide() < this.totalSlides - 1) {
          this.next();
        } else {
          this.clearAutoplay();
        }
      }, 15000);
    }
  }

  private clearAutoplay() {
    this.autoplay.set(false);
    if (this.autoplayInterval) { clearInterval(this.autoplayInterval); this.autoplayInterval = null; }
  }

  // --- Fullscreen ---

  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      this.isFullscreen.set(false);
    } else {
      this.requestFullscreen();
    }
  }

  private requestFullscreen() {
    document.documentElement.requestFullscreen?.().then(() => {
      this.isFullscreen.set(true);
    }).catch(() => {});

    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen.set(!!document.fullscreenElement);
    }, { once: false });
  }

  exit() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    window.history.back();
  }

  // --- Score animation ---

  private startScoreAnimation(target: number) {
    this.animatedScore.set(0);
    if (this.scoreInterval) clearInterval(this.scoreInterval);
    this.scoreInterval = setInterval(() => {
      const cur = this.animatedScore();
      if (cur < target) {
        this.animatedScore.set(Math.min(cur + 1, target));
      } else {
        clearInterval(this.scoreInterval);
        this.scoreInterval = null;
      }
    }, 20);
  }

  // --- Data helpers ---

  pillarList(): any[] {
    const d = this.data();
    if (!d?.pillars) return [];
    return Object.entries(d.pillars).map(([key, val]: any) => ({ key, ...val }));
  }

  moduleList(): any[] {
    const d = this.data();
    if (!d?.modules) return [];
    return [
      { key: 'assessment', ...d.modules.assessment },
      { key: 'evidence', ...d.modules.evidence },
      { key: 'remediation', ...d.modules.remediation },
      { key: 'incidents', ...d.modules.incidents },
      { key: 'thirdParty', ...d.modules.thirdParty },
      { key: 'roi', ...d.modules.roi },
    ];
  }

  pillarName(key: string): string {
    const p = PILLAR_NAMES[key];
    return p ? (p as any)[this.lang.lang()] || p.en : key;
  }

  pillarArticle(key: string): string {
    return PILLAR_ARTICLES[key] || '';
  }

  moduleName(key: string): string {
    const m = MODULE_NAMES[key];
    return m ? (m as any)[this.lang.lang()] || m.en : key;
  }

  moduleIcon(key: string): string {
    return MODULE_ICONS[key] || '📄';
  }

  criticalActions(): number {
    const d = this.data();
    return d?.actions?.filter((a: any) => a.priority === 'CRITICAL').length || 0;
  }

  thirdPartyCount(): number {
    const d = this.data();
    return d?.modules?.thirdParty?.total || 0;
  }

  overdueCount(): number {
    const d = this.data();
    const incOverdue = d?.modules?.incidents?.overdue || 0;
    const remOpen = d?.modules?.remediation?.open || 0;
    return incOverdue + remOpen;
  }

  barColor(score: number): string {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }

  maturityColor(avg: number): string {
    if (avg >= 4) return '#22c55e';
    if (avg >= 3) return '#3b82f6';
    if (avg >= 2) return '#f59e0b';
    return '#ef4444';
  }

  priorityColor(p: string): string {
    switch (p) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f59e0b';
      case 'MEDIUM': return '#3b82f6';
      default: return '#64748b';
    }
  }

  formatDate(d: string): string {
    try {
      return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    } catch { return d; }
  }
}
