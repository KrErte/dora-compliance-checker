import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-audit-readiness',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            {{ lang.t('readiness.title') }}
          </h1>
          <p class="text-slate-400 text-sm mt-1">{{ lang.t('readiness.subtitle') }}</p>
        </div>
      </div>

      @if (loading()) {
        <div class="text-center py-24">
          <div class="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-slate-200 border-t-amber-400 animate-spin"></div>
          <p class="text-slate-400 text-sm">{{ lang.t('readiness.calculating') }}</p>
        </div>
      }

      @if (!loading() && data()) {
        <!-- Hero Score -->
        <div class="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-8 text-center relative overflow-hidden">
          <!-- Background glow -->
          <div class="absolute inset-0 opacity-20"
               [style.background]="'radial-gradient(circle at 50% 50%, ' + getLevelColor(data().level) + ' 0%, transparent 60%)'"></div>
          <div class="relative">
            <!-- Score ring -->
            <div class="relative w-44 h-44 mx-auto mb-6">
              <svg class="w-full h-full -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" fill="none" stroke="#e2e8f0" stroke-width="12"/>
                <circle cx="80" cy="80" r="70" fill="none"
                        [attr.stroke]="getLevelColor(data().level)"
                        stroke-width="12" stroke-linecap="round"
                        [attr.stroke-dasharray]="440"
                        [attr.stroke-dashoffset]="440 - (440 * animatedScore() / 100)"
                        class="transition-all duration-[2000ms] ease-out"/>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-5xl font-black text-slate-900">{{ animatedScore() }}</span>
                <span class="text-sm text-slate-400 mt-1">/100</span>
              </div>
            </div>
            <!-- Level badge -->
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
                 [class]="getLevelBadgeClass(data().level)">
              <div class="w-2 h-2 rounded-full animate-pulse" [class]="getLevelDotClass(data().level)"></div>
              {{ lang.t('readiness.level_' + data().level.toLowerCase()) }}
            </div>
            <p class="text-slate-400 text-sm mt-3 max-w-md mx-auto">{{ lang.t('readiness.level_desc_' + data().level.toLowerCase()) }}</p>
          </div>
        </div>

        <!-- Module Breakdown -->
        <div>
          <h2 class="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            {{ lang.t('readiness.module_breakdown') }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            @for (mod of moduleList(); track mod.key) {
              <div class="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-200 transition-all group">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                         [class]="getModuleIconClass(mod.key)">
                      <span class="text-xs font-bold">{{ getModuleEmoji(mod.key) }}</span>
                    </div>
                    <span class="text-sm font-medium text-slate-900">{{ mod.label }}</span>
                  </div>
                  <span class="text-lg font-bold" [class]="getScoreColor(mod.score)">{{ mod.score | number:'1.0-0' }}</span>
                </div>
                <!-- Progress bar -->
                <div class="w-full bg-slate-100/50 rounded-full h-2 mb-2">
                  <div class="h-2 rounded-full transition-all duration-1000 ease-out"
                       [class]="getBarColor(mod.score)"
                       [style.width.%]="mod.score"></div>
                </div>
                <p class="text-xs text-slate-500">{{ mod.detail }}</p>
              </div>
            }
          </div>
        </div>

        <!-- Pillar Radar -->
        <div>
          <h2 class="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            {{ lang.t('readiness.pillar_scores') }}
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            @for (p of pillarList(); track p.key) {
              <div class="bg-white border border-slate-200 rounded-xl p-4 text-center">
                <!-- Circular mini score -->
                <div class="relative w-16 h-16 mx-auto mb-2">
                  <svg class="w-full h-full -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" stroke-width="5"/>
                    <circle cx="32" cy="32" r="28" fill="none"
                            [attr.stroke]="getScoreHex(p.score)"
                            stroke-width="5" stroke-linecap="round"
                            [attr.stroke-dasharray]="176"
                            [attr.stroke-dashoffset]="176 - (176 * p.score / 100)"/>
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <span class="text-sm font-bold text-slate-900">{{ p.score }}</span>
                  </div>
                </div>
                <h3 class="text-xs font-medium text-slate-900 mb-1">{{ lang.t('readiness.pillar_' + p.key.toLowerCase()) }}</h3>
                <div class="text-[10px] text-slate-500">
                  {{ p.evidenceCount }} {{ lang.t('readiness.evidence_short') }} · {{ p.remediationCompleted }}/{{ p.remediationTotal }} {{ lang.t('readiness.fixed') }}
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Action Items -->
        @if (data().actions?.length > 0) {
          <div>
            <h2 class="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              {{ lang.t('readiness.top_actions') }}
            </h2>
            <div class="space-y-2">
              @for (action of data().actions; track action.action; let i = $index) {
                <div class="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:border-slate-200 transition-all">
                  <!-- Priority indicator -->
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
                       [class]="action.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : action.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' : 'bg-amber-500/20 text-amber-400'">
                    {{ i + 1 }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-slate-900 font-medium">{{ action.action }}</p>
                    <div class="flex items-center gap-3 mt-1">
                      <span class="text-[10px] px-1.5 py-0.5 rounded font-bold"
                            [class]="action.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-400' : action.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-400' : 'bg-amber-500/10 text-amber-400'">
                        {{ action.priority }}
                      </span>
                      <span class="text-[10px] text-slate-500">{{ getModuleLabelByKey(action.module) }}</span>
                    </div>
                  </div>
                  <span class="text-xs font-semibold text-blue-600 flex-shrink-0 bg-blue-50 px-2.5 py-1 rounded-lg">
                    {{ action.impact }}
                  </span>
                </div>
              }
            </div>
          </div>
        }

        <!-- Footer note -->
        <div class="text-center py-4">
          <p class="text-xs text-slate-600">{{ lang.t('readiness.footer_note') }}</p>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class AuditReadinessComponent implements OnInit, OnDestroy {
  private animationInterval: any = null;
  loading = signal(true);
  data = signal<any>(null);
  animatedScore = signal(0);

  constructor(private api: ApiService, public lang: LangService) {}

  ngOnInit() {
    this.api.getAuditReadiness().subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
        this.startScoreAnimation(d.overallScore);
      },
      error: () => this.loading.set(false)
    });
  }

  private startScoreAnimation(target: number) {
    this.animationInterval = setInterval(() => {
      const current = this.animatedScore();
      if (current < target) {
        this.animatedScore.set(Math.min(current + 1, target));
      } else {
        clearInterval(this.animationInterval);
        this.animationInterval = null;
      }
    }, 20);
  }

  ngOnDestroy() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
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
      { key: 'roi', ...d.modules.roi }
    ];
  }

  pillarList(): any[] {
    const d = this.data();
    if (!d?.pillars) return [];
    return Object.entries(d.pillars).map(([key, val]: any) => ({ key, ...val }));
  }

  getLevelColor(level: string): string {
    switch (level) {
      case 'EXCELLENT': return '#22c55e';
      case 'GOOD': return '#3b82f6';
      case 'AT_RISK': return '#f59e0b';
      case 'CRITICAL': return '#ef4444';
      default: return '#64748b';
    }
  }

  getLevelBadgeClass(level: string): string {
    switch (level) {
      case 'EXCELLENT': return 'bg-blue-50 text-blue-600 border border-blue-200';
      case 'GOOD': return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      case 'AT_RISK': return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'CRITICAL': return 'bg-red-500/10 text-red-400 border border-red-500/30';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  }

  getLevelDotClass(level: string): string {
    switch (level) {
      case 'EXCELLENT': return 'bg-blue-500';
      case 'GOOD': return 'bg-blue-400';
      case 'AT_RISK': return 'bg-amber-400';
      case 'CRITICAL': return 'bg-red-400';
      default: return 'bg-slate-400';
    }
  }

  getModuleIconClass(key: string): string {
    switch (key) {
      case 'assessment': return 'bg-blue-50 text-blue-500';
      case 'evidence': return 'bg-indigo-500/10 text-indigo-400';
      case 'remediation': return 'bg-blue-50 text-blue-600';
      case 'incidents': return 'bg-red-500/10 text-red-400';
      case 'thirdParty': return 'bg-violet-500/10 text-violet-400';
      case 'roi': return 'bg-amber-500/10 text-amber-400';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  }

  getModuleEmoji(key: string): string {
    switch (key) {
      case 'assessment': return 'SA';
      case 'evidence': return 'EV';
      case 'remediation': return 'RM';
      case 'incidents': return 'IR';
      case 'thirdParty': return 'TP';
      case 'roi': return 'RI';
      default: return '?';
    }
  }

  getModuleLabelByKey(key: string): string {
    const labels: Record<string, string> = {
      assessment: 'Assessment', evidence: 'Evidence Vault', remediation: 'Remediation',
      incidents: 'Incidents', thirdParty: 'Third-Party', roi: 'Register of Information'
    };
    return labels[key] || key;
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'text-blue-600';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-red-400';
  }

  getScoreHex(score: number): string {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }

  getBarColor(score: number): string {
    if (score >= 80) return 'bg-gradient-to-r from-blue-600 to-blue-400';
    if (score >= 60) return 'bg-gradient-to-r from-blue-500 to-blue-400';
    if (score >= 40) return 'bg-gradient-to-r from-amber-500 to-amber-400';
    return 'bg-gradient-to-r from-red-500 to-red-400';
  }
}
