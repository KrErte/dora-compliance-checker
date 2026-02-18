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
    <div class="fixed inset-0 z-[9998] flex items-center justify-center p-4"
         [@.disabled]="true">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-slate-950/90 backdrop-blur-md"></div>

      <!-- Modal -->
      <div class="relative w-full max-w-2xl bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">

        <!-- Progress bar -->
        <div class="h-1 bg-slate-800">
          <div class="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500"
               [style.width.%]="(step / 3) * 100"></div>
        </div>

        <!-- Header -->
        <div class="px-6 pt-6 pb-4 text-center">
          <div *ngIf="step === 1" class="space-y-2">
            <h1 class="text-2xl md:text-3xl font-bold text-white">{{ lang.t('onboarding.title') }}</h1>
            <p class="text-slate-400">{{ lang.t('onboarding.subtitle') }}</p>
          </div>
          <div class="flex items-center justify-between mt-4">
            <button *ngIf="step > 1" (click)="step = step - 1"
                    class="text-sm text-slate-500 hover:text-white transition-colors flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              {{ lang.t('onboarding.back') }}
            </button>
            <span *ngIf="step === 1"></span>
            <span class="text-xs text-slate-600">{{ lang.t('onboarding.step') }} {{ step }} {{ lang.t('onboarding.of') }} 3</span>
            <button (click)="skipOnboarding()"
                    class="text-sm text-slate-500 hover:text-white transition-colors">
              {{ lang.t('onboarding.skip') }}
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="px-6 pb-8">

          <!-- STEP 1: Role Selection -->
          <div *ngIf="step === 1" class="space-y-4">
            <div class="text-center mb-2">
              <h2 class="text-lg font-semibold text-white">{{ lang.t('onboarding.step1_title') }}</h2>
              <p class="text-sm text-slate-500">{{ lang.t('onboarding.step1_desc') }}</p>
            </div>
            <div class="grid gap-3">
              <button (click)="selectRole('compliance')"
                      [class]="roleCardClass('compliance')">
                <span class="text-3xl">&#127974;</span>
                <div class="text-left">
                  <p class="font-semibold text-white">{{ lang.t('onboarding.role_compliance') }}</p>
                  <p class="text-sm text-slate-400">{{ lang.t('onboarding.role_compliance_desc') }}</p>
                </div>
              </button>
              <button (click)="selectRole('cto')"
                      [class]="roleCardClass('cto')">
                <span class="text-3xl">&#128187;</span>
                <div class="text-left">
                  <p class="font-semibold text-white">{{ lang.t('onboarding.role_cto') }}</p>
                  <p class="text-sm text-slate-400">{{ lang.t('onboarding.role_cto_desc') }}</p>
                </div>
              </button>
              <button (click)="selectRole('risk')"
                      [class]="roleCardClass('risk')">
                <span class="text-3xl">&#9878;&#65039;</span>
                <div class="text-left">
                  <p class="font-semibold text-white">{{ lang.t('onboarding.role_risk') }}</p>
                  <p class="text-sm text-slate-400">{{ lang.t('onboarding.role_risk_desc') }}</p>
                </div>
              </button>
            </div>
          </div>

          <!-- STEP 2: Organisation Type -->
          <div *ngIf="step === 2" class="space-y-4">
            <div class="text-center mb-2">
              <h2 class="text-lg font-semibold text-white">{{ lang.t('onboarding.step2_title') }}</h2>
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

          <!-- STEP 3: Recommendation -->
          <div *ngIf="step === 3" class="space-y-6">
            <div class="text-center mb-2">
              <h2 class="text-lg font-semibold text-white">{{ lang.t('onboarding.step3_title') }}</h2>
              <p class="text-sm text-slate-500">{{ lang.t('onboarding.step3_desc') }}</p>
            </div>

            <!-- Primary recommendation -->
            <div class="p-5 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/30">
              <div class="flex items-center gap-2 mb-3">
                <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">{{ lang.t('onboarding.rec_start_with') }}</span>
              </div>
              <h3 class="text-xl font-bold text-white mb-1">{{ lang.t(recommendation.primary.key) }}</h3>
              <p class="text-sm text-slate-400">{{ lang.t(recommendation.primary.descKey) }}</p>
            </div>

            <!-- Arrow -->
            <div class="flex justify-center">
              <svg class="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
            </div>

            <!-- Secondary recommendation -->
            <div class="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div class="flex items-center gap-2 mb-2">
                <span class="px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 text-xs font-bold uppercase tracking-wider">{{ lang.t('onboarding.rec_then') }}</span>
              </div>
              <h3 class="text-lg font-semibold text-white mb-1">{{ lang.t(recommendation.secondary.key) }}</h3>
              <p class="text-sm text-slate-500">{{ lang.t(recommendation.secondary.descKey) }}</p>
            </div>

            <!-- CTA Button -->
            <button (click)="completeOnboarding()"
                    class="w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all
                           bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400
                           text-white hover:shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2">
              {{ lang.t('onboarding.start_btn') }}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class OnboardingComponent {
  @Input() isOverlay = false;
  @Output() completed = new EventEmitter<void>();

  step = 1;
  selectedRole: Role | null = null;
  selectedOrg: OrgType | null = null;

  constructor(
    public lang: LangService,
    private router: Router
  ) {}

  selectRole(role: Role): void {
    this.selectedRole = role;
    this.step = 2;
  }

  selectOrg(org: OrgType): void {
    this.selectedOrg = org;
    this.step = 3;
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
    // Default: Compliance Officer (any org type)
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
      this.router.navigate([route]);
    } else {
      this.router.navigate([route]);
    }
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
    const base = 'w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left cursor-pointer';
    if (this.selectedRole === role) {
      return base + ' bg-emerald-500/10 border-emerald-500/40 ring-2 ring-emerald-500/20';
    }
    return base + ' bg-slate-800/50 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800';
  }

  orgCardClass(org: OrgType): string {
    const base = 'flex flex-col items-center gap-2 p-5 rounded-xl border transition-all cursor-pointer';
    if (this.selectedOrg === org) {
      return base + ' bg-emerald-500/10 border-emerald-500/40 ring-2 ring-emerald-500/20';
    }
    return base + ' bg-slate-800/50 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800';
  }
}
