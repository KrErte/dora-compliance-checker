import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LangService } from '../lang.service';

type Role = 'compliance' | 'cto' | 'risk';
type OrgType = 'bank' | 'insurance' | 'ict' | 'other';

interface Recommendation {
  primary: { key: string; descKey: string; route: string };
  secondary: { key: string; descKey: string; route: string };
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 onb-bg"></div>

      <!-- Modal -->
      <div class="relative w-full max-w-3xl onb-card rounded-2xl shadow-2xl overflow-hidden">

        <!-- Progress bar -->
        <div class="h-1.5 bg-[#1a1a2e]">
          <div class="h-full onb-gradient transition-all duration-500 rounded-r-full"
               [style.width.%]="(step / totalSteps) * 100"></div>
        </div>

        <!-- Header -->
        <div class="px-6 md:px-8 pt-6 pb-2">
          <div class="flex items-center justify-between">
            <button *ngIf="step > 1" (click)="step = step - 1"
                    class="text-sm text-slate-500 hover:text-white transition-colors flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              {{ lang.t('onboarding.back') }}
            </button>
            <span *ngIf="step === 1"></span>
            <span class="text-xs text-slate-600 tabular-nums">{{ step }} / {{ totalSteps }}</span>
            <button (click)="skipOnboarding()"
                    class="text-sm text-slate-500 hover:text-white transition-colors">
              {{ lang.t('onboarding.skip') }}
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="px-6 md:px-8 pb-8">

          <!-- ═══ STEP 1: How It Works ═══ -->
          <div *ngIf="step === 1" class="space-y-6">
            <div class="text-center space-y-2 pt-2">
              <h1 class="text-2xl md:text-3xl font-bold text-white">{{ lang.t('onboarding.title') }}</h1>
              <p class="text-slate-400 text-sm">{{ lang.t('onboarding.how_subtitle') }}</p>
            </div>

            <!-- 3 How-it-works cards -->
            <div class="grid md:grid-cols-3 gap-4">

              <!-- Card 1: Assess -->
              <div class="onb-hiw-card group">
                <div class="flex items-center gap-2 mb-3">
                  <span class="onb-step-badge">1</span>
                  <span class="text-lg">&#128203;</span>
                </div>
                <h3 class="text-sm font-bold text-white mb-1">{{ lang.t('onboarding.how_card1_title') }}</h3>
                <p class="text-xs text-slate-400 leading-relaxed mb-3">{{ lang.t('onboarding.how_card1_desc') }}</p>
                <!-- Mini mockup: Assessment form -->
                <div class="onb-preview">
                  <div class="flex items-center justify-between mb-1.5">
                    <div class="h-1.5 w-16 rounded bg-slate-600"></div>
                    <div class="flex gap-1">
                      <div class="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/20 text-emerald-400">YES</div>
                      <div class="px-2 py-0.5 rounded text-[8px] font-bold bg-slate-700 text-slate-500">NO</div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between mb-1.5">
                    <div class="h-1.5 w-20 rounded bg-slate-600"></div>
                    <div class="flex gap-1">
                      <div class="px-2 py-0.5 rounded text-[8px] font-bold bg-slate-700 text-slate-500">YES</div>
                      <div class="px-2 py-0.5 rounded text-[8px] font-bold bg-red-500/20 text-red-400">NO</div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="h-1.5 w-14 rounded bg-slate-600"></div>
                    <div class="flex gap-1">
                      <div class="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/20 text-emerald-400">YES</div>
                      <div class="px-2 py-0.5 rounded text-[8px] font-bold bg-slate-700 text-slate-500">NO</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Card 2: Analyse -->
              <div class="onb-hiw-card group">
                <div class="flex items-center gap-2 mb-3">
                  <span class="onb-step-badge">2</span>
                  <span class="text-lg">&#9889;</span>
                </div>
                <h3 class="text-sm font-bold text-white mb-1">{{ lang.t('onboarding.how_card2_title') }}</h3>
                <p class="text-xs text-slate-400 leading-relaxed mb-3">{{ lang.t('onboarding.how_card2_desc') }}</p>
                <!-- Mini mockup: Risk score -->
                <div class="onb-preview flex flex-col items-center gap-2">
                  <div class="relative w-14 h-14">
                    <svg class="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="24" fill="none" stroke="#1e293b" stroke-width="4"/>
                      <circle cx="28" cy="28" r="24" fill="none" stroke="#7c3aed" stroke-width="4"
                              stroke-dasharray="150.8" stroke-dashoffset="45" stroke-linecap="round"/>
                    </svg>
                    <span class="absolute inset-0 flex items-center justify-center text-xs font-bold text-purple-400">72</span>
                  </div>
                  <div class="flex gap-1">
                    <span class="px-1.5 py-0.5 rounded text-[7px] font-bold bg-orange-500/20 text-orange-400">HIGH RISK</span>
                  </div>
                </div>
              </div>

              <!-- Card 3: Report -->
              <div class="onb-hiw-card group">
                <div class="flex items-center gap-2 mb-3">
                  <span class="onb-step-badge">3</span>
                  <span class="text-lg">&#9989;</span>
                </div>
                <h3 class="text-sm font-bold text-white mb-1">{{ lang.t('onboarding.how_card3_title') }}</h3>
                <p class="text-xs text-slate-400 leading-relaxed mb-3">{{ lang.t('onboarding.how_card3_desc') }}</p>
                <!-- Mini mockup: PDF export -->
                <div class="onb-preview flex flex-col items-center gap-2">
                  <div class="flex items-center gap-2">
                    <svg class="w-8 h-10 text-slate-500" viewBox="0 0 32 40" fill="none">
                      <rect x="1" y="1" width="30" height="38" rx="3" stroke="currentColor" stroke-width="1.5"/>
                      <path d="M8 12h16M8 17h16M8 22h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                      <rect x="20" y="28" width="8" height="6" rx="1.5" fill="#7c3aed" opacity="0.3"/>
                      <text x="24" y="33" text-anchor="middle" fill="#a78bfa" font-size="4" font-weight="bold">PDF</text>
                    </svg>
                  </div>
                  <div class="px-3 py-1 rounded-md bg-purple-500/20 border border-purple-500/30">
                    <span class="text-[8px] font-bold text-purple-400">&#11015; Export PDF</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- CTA -->
            <button (click)="step = 2"
                    class="w-full py-3.5 px-6 rounded-xl font-semibold transition-all onb-btn-primary
                           flex items-center justify-center gap-2">
              {{ lang.t('onboarding.how_cta') }}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </button>
          </div>

          <!-- ═══ STEP 2: Role Selection ═══ -->
          <div *ngIf="step === 2" class="space-y-4">
            <div class="text-center space-y-1 pt-2">
              <h2 class="text-xl font-bold text-white">{{ lang.t('onboarding.step1_title') }}</h2>
              <p class="text-sm text-slate-500">{{ lang.t('onboarding.step1_desc') }}</p>
            </div>
            <div class="grid gap-3">
              <button (click)="selectRole('compliance')"
                      [class]="roleCardClass('compliance')">
                <span class="text-3xl shrink-0">&#127974;</span>
                <div class="text-left">
                  <p class="font-semibold text-white">{{ lang.t('onboarding.role_compliance') }}</p>
                  <p class="text-sm text-slate-400">{{ lang.t('onboarding.role_compliance_desc') }}</p>
                </div>
              </button>
              <button (click)="selectRole('cto')"
                      [class]="roleCardClass('cto')">
                <span class="text-3xl shrink-0">&#128187;</span>
                <div class="text-left">
                  <p class="font-semibold text-white">{{ lang.t('onboarding.role_cto') }}</p>
                  <p class="text-sm text-slate-400">{{ lang.t('onboarding.role_cto_desc') }}</p>
                </div>
              </button>
              <button (click)="selectRole('risk')"
                      [class]="roleCardClass('risk')">
                <span class="text-3xl shrink-0">&#9878;&#65039;</span>
                <div class="text-left">
                  <p class="font-semibold text-white">{{ lang.t('onboarding.role_risk') }}</p>
                  <p class="text-sm text-slate-400">{{ lang.t('onboarding.role_risk_desc') }}</p>
                </div>
              </button>
            </div>
          </div>

          <!-- ═══ STEP 3: Organisation Type ═══ -->
          <div *ngIf="step === 3" class="space-y-4">
            <div class="text-center space-y-1 pt-2">
              <h2 class="text-xl font-bold text-white">{{ lang.t('onboarding.step2_title') }}</h2>
              <p class="text-sm text-slate-500">{{ lang.t('onboarding.step2_desc') }}</p>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <button (click)="selectOrg('bank')"
                      [class]="orgCardClass('bank')">
                <span class="text-2xl">&#127974;</span>
                <p class="text-sm font-medium text-white">{{ lang.t('onboarding.org_bank') }}</p>
              </button>
              <button (click)="selectOrg('insurance')"
                      [class]="orgCardClass('insurance')">
                <span class="text-2xl">&#128737;&#65039;</span>
                <p class="text-sm font-medium text-white">{{ lang.t('onboarding.org_insurance') }}</p>
              </button>
              <button (click)="selectOrg('ict')"
                      [class]="orgCardClass('ict')">
                <span class="text-2xl">&#128421;&#65039;</span>
                <p class="text-sm font-medium text-white">{{ lang.t('onboarding.org_ict') }}</p>
              </button>
              <button (click)="selectOrg('other')"
                      [class]="orgCardClass('other')">
                <span class="text-2xl">&#127970;</span>
                <p class="text-sm font-medium text-white">{{ lang.t('onboarding.org_other') }}</p>
              </button>
            </div>
          </div>

          <!-- ═══ STEP 4: Recommendation ═══ -->
          <div *ngIf="step === 4" class="space-y-5">
            <div class="text-center space-y-1 pt-2">
              <h2 class="text-xl font-bold text-white">{{ lang.t('onboarding.step3_title') }}</h2>
              <p class="text-sm text-slate-500">{{ lang.t('onboarding.step3_desc') }}</p>
            </div>

            <!-- Primary -->
            <div class="p-5 rounded-2xl bg-purple-500/10 border-2 border-purple-500/30 onb-glow-purple">
              <div class="flex items-center gap-2 mb-3">
                <span class="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider">{{ lang.t('onboarding.rec_start_with') }}</span>
              </div>
              <h3 class="text-xl font-bold text-white mb-1">{{ lang.t(recommendation.primary.key) }}</h3>
              <p class="text-sm text-slate-400">{{ lang.t(recommendation.primary.descKey) }}</p>
            </div>

            <!-- Arrow -->
            <div class="flex justify-center">
              <svg class="w-6 h-6 text-purple-500/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
            </div>

            <!-- Secondary -->
            <div class="p-4 rounded-2xl bg-[#12121f] border border-slate-700/50">
              <div class="flex items-center gap-2 mb-2">
                <span class="px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-400 text-xs font-bold uppercase tracking-wider">{{ lang.t('onboarding.rec_then') }}</span>
              </div>
              <h3 class="text-lg font-semibold text-white mb-1">{{ lang.t(recommendation.secondary.key) }}</h3>
              <p class="text-sm text-slate-500">{{ lang.t(recommendation.secondary.descKey) }}</p>
            </div>

            <!-- CTA -->
            <button (click)="completeOnboarding()"
                    class="w-full py-3.5 px-6 rounded-xl font-semibold transition-all onb-btn-primary
                           flex items-center justify-center gap-2">
              {{ lang.t('onboarding.start_btn') }}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .onb-bg {
      background: #0d0d1a;
      background-image: radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 60%);
    }

    .onb-card {
      background: #111127;
      border: 1px solid rgba(124,58,237,0.15);
    }

    .onb-gradient {
      background: linear-gradient(90deg, #7c3aed, #a78bfa);
    }

    .onb-btn-primary {
      background: linear-gradient(135deg, #7c3aed, #6d28d9);
      color: white;
      font-size: 1rem;
    }
    .onb-btn-primary:hover {
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      box-shadow: 0 8px 32px rgba(124,58,237,0.3);
    }

    .onb-step-badge {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: rgba(124,58,237,0.2);
      border: 1.5px solid rgba(124,58,237,0.4);
      color: #a78bfa;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .onb-hiw-card {
      background: #12121f;
      border: 1px solid rgba(124,58,237,0.1);
      border-radius: 16px;
      padding: 1.25rem;
      transition: all 0.3s;
    }
    .onb-hiw-card:hover {
      border-color: rgba(124,58,237,0.3);
      box-shadow: 0 0 24px rgba(124,58,237,0.08);
    }

    .onb-preview {
      background: #0d0d1a;
      border: 1px solid #1e1e35;
      border-radius: 10px;
      padding: 0.75rem;
    }

    .onb-glow-purple {
      box-shadow: 0 0 30px rgba(124,58,237,0.1);
    }

    .tabular-nums {
      font-variant-numeric: tabular-nums;
    }
  `]
})
export class OnboardingComponent {
  @Input() isOverlay = false;
  @Output() completed = new EventEmitter<void>();

  step = 1;
  totalSteps = 4;
  selectedRole: Role | null = null;
  selectedOrg: OrgType | null = null;

  constructor(
    public lang: LangService,
    private router: Router
  ) {}

  selectRole(role: Role): void {
    this.selectedRole = role;
    this.step = 3;
  }

  selectOrg(org: OrgType): void {
    this.selectedOrg = org;
    this.step = 4;
  }

  get recommendation(): Recommendation {
    if (this.selectedRole === 'cto' && this.selectedOrg === 'ict') {
      return {
        primary: { key: 'onboarding.rec_nis2', descKey: 'onboarding.rec_nis2_desc', route: '/nis2/scope-check' },
        secondary: { key: 'onboarding.rec_supply', descKey: 'onboarding.rec_supply_desc', route: '/supply-chain' }
      };
    }
    if (this.selectedRole === 'cto') {
      return {
        primary: { key: 'onboarding.rec_supply', descKey: 'onboarding.rec_supply_desc', route: '/supply-chain' },
        secondary: { key: 'onboarding.rec_nis2', descKey: 'onboarding.rec_nis2_desc', route: '/nis2/scope-check' }
      };
    }
    if (this.selectedRole === 'risk') {
      return {
        primary: { key: 'onboarding.rec_board', descKey: 'onboarding.rec_board_desc', route: '/board-risk' },
        secondary: { key: 'onboarding.rec_assessment', descKey: 'onboarding.rec_assessment_desc', route: '/assessment' }
      };
    }
    return {
      primary: { key: 'onboarding.rec_assessment', descKey: 'onboarding.rec_assessment_desc', route: '/assessment' },
      secondary: { key: 'onboarding.rec_fine', descKey: 'onboarding.rec_fine_desc', route: '/fine-calculator' }
    };
  }

  completeOnboarding(): void {
    localStorage.setItem('onboarding_complete', 'true');
    localStorage.setItem('onboarding_role', this.selectedRole || '');
    localStorage.setItem('onboarding_org', this.selectedOrg || '');

    const route = this.recommendation.primary.route;

    if (this.isOverlay) {
      this.completed.emit();
    }
    this.router.navigate([route]);
  }

  skipOnboarding(): void {
    localStorage.setItem('onboarding_complete', 'true');
    if (this.isOverlay) {
      this.completed.emit();
    } else {
      this.router.navigate(['/']);
    }
  }

  roleCardClass(role: Role): string {
    const base = 'w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left cursor-pointer';
    if (this.selectedRole === role) {
      return base + ' bg-purple-500/10 border-purple-500/40 ring-2 ring-purple-500/20';
    }
    return base + ' bg-[#12121f] border-[#1e1e35] hover:border-purple-500/30 hover:bg-[#16162a]';
  }

  orgCardClass(org: OrgType): string {
    const base = 'flex flex-col items-center gap-2 p-5 rounded-2xl border transition-all cursor-pointer';
    if (this.selectedOrg === org) {
      return base + ' bg-purple-500/10 border-purple-500/40 ring-2 ring-purple-500/20';
    }
    return base + ' bg-[#12121f] border-[#1e1e35] hover:border-purple-500/30 hover:bg-[#16162a]';
  }
}
