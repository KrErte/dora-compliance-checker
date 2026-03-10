import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LangService } from '../../lang.service';
import {
  RoiService, RoiRegister, RoiProvider, RoiFunction, RoiContract,
  RoiContractDetail, RoiAssessment, RoiSupplyChain, RoiGroupEntity,
  RoiValidationReport, RoiViolation, TemplateSummary, TemplateCompleteness,
  ValidationHistoryEntry, GleifResult,
  ENTITY_TYPES, CONTRACT_TYPES, ICT_SERVICE_TYPES, CRITICALITY_OPTIONS,
  RISK_LEVELS, PROVIDER_TYPES, COMMON_FUNCTIONS, PRESET_PROVIDERS
} from '../../services/roi.service';
import { SubscriptionService } from '../../services/subscription.service';

@Component({
  selector: 'app-roi-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-24 pb-16 px-4">
      <div class="max-w-5xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <a routerLink="/roi" class="text-sm text-slate-500 hover:text-emerald-400 transition-colors">&larr; {{ lang.t('roi.back_to_list') }}</a>
            <h1 class="text-2xl font-bold text-white mt-1">{{ register?.entityName || lang.t('roi.new_register') }}</h1>
          </div>
          <span class="text-xs px-3 py-1 rounded-full" [class]="register?.status === 'VALID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'">
            {{ register?.status ? lang.t('roi.status_' + register!.status.toLowerCase()) : lang.t('roi.status_draft') }}
          </span>
        </div>

        <!-- Stepper -->
        <div class="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          @for (s of steps; track s.num; let i = $index) {
            <button (click)="currentStep = s.num"
                    class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all relative"
                    [class]="currentStep === s.num ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : (s.num < currentStep ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-800/30 text-slate-500')">
              <span class="w-6 h-6 flex items-center justify-center rounded-full text-xs"
                    [class]="s.num < currentStep ? 'bg-emerald-500 text-white' : (currentStep === s.num ? 'bg-emerald-500/30 text-emerald-400' : 'bg-slate-700 text-slate-500')">
                {{ s.num < currentStep ? '&#10003;' : s.num }}
              </span>
              {{ s.label }}
              @if (getStepCompleteness(s.num) >= 0) {
                <span class="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                      [class]="getStepCompleteness(s.num) >= 80 ? 'bg-emerald-500/20 text-emerald-400' : (getStepCompleteness(s.num) >= 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400')">
                  {{ getStepCompleteness(s.num) }}%
                </span>
              }
              <!-- Step validation badge -->
              @if (stepValidationStatus[s.num]) {
                <span class="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900"
                      [class]="stepValidationStatus[s.num] === 'GREEN' ? 'bg-emerald-500' : (stepValidationStatus[s.num] === 'YELLOW' ? 'bg-amber-500' : 'bg-red-500')"></span>
              }
            </button>
          }
        </div>

        <!-- Step Content -->
        <div class="glass-card p-6 md:p-8">
          <!-- STEP 1: Entity -->
          @if (currentStep === 1) {
            <h2 class="text-xl font-semibold text-white mb-6">{{ lang.t('roi.step1_title') }}</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-slate-400 mb-1">{{ lang.t('roi.entity_name') }} *</label>
                <input type="text" [(ngModel)]="form.entityName" class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white" [placeholder]="lang.t('roi.entity_name_example')">
              </div>
              <div>
                <label class="block text-sm text-slate-400 mb-1">{{ lang.t('roi.lei_label') }}</label>
                <div class="flex gap-2">
                  <input type="text" [(ngModel)]="form.entityLei" maxlength="20" class="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white font-mono" placeholder="529900T8BM49AURSDO55">
                  <button (click)="lookupLei(form.entityLei)" class="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm">GLEIF</button>
                </div>
                @if (leiResult) {
                  <p class="text-xs text-emerald-400 mt-1">{{ leiResult.name }} ({{ leiResult.country }})</p>
                }
              </div>
              <div>
                <label class="block text-sm text-slate-400 mb-1">{{ lang.t('roi.country') }}</label>
                <input type="text" [(ngModel)]="form.country" maxlength="2" class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white" placeholder="EE">
              </div>
              <div>
                <label class="block text-sm text-slate-400 mb-1">{{ lang.t('roi.entity_type') }}</label>
                <select [(ngModel)]="form.entityType" class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                  <option value="">{{ lang.t('roi.select') }}...</option>
                  @for (t of entityTypes; track t.code) {
                    <option [value]="t.code">{{ t.label }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-sm text-slate-400 mb-1">{{ lang.t('roi.competent_authority') }}</label>
                <input type="text" [(ngModel)]="form.competentAuthority" class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white" [placeholder]="lang.t('roi.authority_example')">
              </div>
              <div>
                <label class="block text-sm text-slate-400 mb-1">{{ lang.t('roi.consolidation_scope') }}</label>
                <select [(ngModel)]="form.consolidationScope" class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                  <option value="IND">{{ lang.t('roi.scope_ind') }}</option>
                  <option value="CON">{{ lang.t('roi.scope_con') }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm text-slate-400 mb-1">{{ lang.t('roi.reporting_date') }}</label>
                <input type="date" [(ngModel)]="form.reportingDate" class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
              </div>
            </div>

            <div class="mt-6 pt-6 border-t border-slate-700/50">
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" [(ngModel)]="isGroup" class="w-4 h-4 accent-emerald-500">
                <span class="text-sm text-slate-300">{{ lang.t('roi.is_group') }}</span>
              </label>
            </div>

            @if (isGroup && register) {
              <div class="mt-4 space-y-3">
                <h3 class="text-sm font-semibold text-slate-300">{{ lang.t('roi.group_entities') }} (B_01.02)</h3>
                @for (ge of register.groupEntities; track ge.id) {
                  <div class="flex items-center justify-between bg-slate-800/30 rounded-lg p-3">
                    <span class="text-sm text-white">{{ ge.entityName }} <span class="text-slate-500">({{ ge.lei }})</span></span>
                    <button (click)="removeGroupEntity(ge.id)" class="text-red-400 hover:text-red-300 text-sm">&#10005;</button>
                  </div>
                }
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <input type="text" [(ngModel)]="newGroupEntity.entityName" placeholder="{{ lang.t('roi.entity_name') }}" class="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
                  <input type="text" [(ngModel)]="newGroupEntity.lei" placeholder="LEI" maxlength="20" class="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono">
                  <input type="text" [(ngModel)]="newGroupEntity.country" placeholder="{{ lang.t('roi.country') }}" maxlength="2" class="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
                  <button (click)="addGroupEntity()" class="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm">+ {{ lang.t('roi.add') }}</button>
                </div>
              </div>
            }
          }

          <!-- STEP 2: Providers -->
          @if (currentStep === 2) {
            <h2 class="text-xl font-semibold text-white mb-6">{{ lang.t('roi.step2_title') }}</h2>

            <div class="mb-6">
              <h3 class="text-sm font-semibold text-slate-400 mb-3">{{ lang.t('roi.preset_providers') }}</h3>
              <div class="flex flex-wrap gap-2">
                @for (preset of presetProviders; track preset.providerName) {
                  <button (click)="addPresetProvider(preset)"
                          class="px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400 transition-all"
                          [class.opacity-50]="isProviderAdded(preset.providerName!)">
                    + {{ preset.providerName }}
                  </button>
                }
              </div>
            </div>

            @if (register?.providers?.length) {
              <div class="space-y-3 mb-6">
                @for (p of register!.providers!; track p.id) {
                  <div class="bg-slate-800/30 rounded-lg p-4">
                    <div class="flex items-center justify-between">
                      <div>
                        <span class="font-medium text-white">{{ p.providerName }}</span>
                        <span class="text-xs text-slate-500 ml-2">{{ p.countryOfHq }} &middot; {{ p.providerIdentifier || '—' }}</span>
                      </div>
                      <button (click)="removeProvider(p.id)" class="text-red-400 hover:text-red-300 text-sm">&#10005;</button>
                    </div>
                    @if (p.ultimateParentName) {
                      <p class="text-xs text-slate-500 mt-1">{{ lang.t('roi.parent') }}: {{ p.ultimateParentName }} ({{ p.ultimateParentCountry }})</p>
                    }
                  </div>
                }
              </div>
            }

            <div class="border-t border-slate-700/50 pt-4">
              <h3 class="text-sm font-semibold text-slate-400 mb-3">{{ lang.t('roi.add_provider') }}</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" [(ngModel)]="newProvider.providerName" placeholder="{{ lang.t('roi.provider_name') }} *" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                <div class="flex gap-2">
                  <input type="text" [(ngModel)]="newProvider.providerIdentifier" [placeholder]="lang.t('roi.lei_identifier')" class="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white font-mono">
                  <button (click)="lookupProviderLei()" class="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm">GLEIF</button>
                </div>
                <select [(ngModel)]="newProvider.providerType" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                  <option value="">{{ lang.t('roi.provider_type') }}...</option>
                  @for (t of providerTypes; track t.code) {
                    <option [value]="t.code">{{ t.label }}</option>
                  }
                </select>
                <input type="text" [(ngModel)]="newProvider.countryOfHq" placeholder="{{ lang.t('roi.country') }} (EE)" maxlength="2" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                <input type="text" [(ngModel)]="newProvider.currencyOfContract" placeholder="{{ lang.t('roi.currency') }} (EUR)" maxlength="3" value="EUR" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                <input type="number" [(ngModel)]="newProvider.totalAnnualSpend" placeholder="{{ lang.t('roi.annual_spend') }}" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
              </div>
              <button (click)="addProvider()" class="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm" [disabled]="!newProvider.providerName">
                + {{ lang.t('roi.add_provider') }}
              </button>
            </div>
          }

          <!-- STEP 3: Functions -->
          @if (currentStep === 3) {
            <h2 class="text-xl font-semibold text-white mb-6">{{ lang.t('roi.step3_title') }}</h2>

            <div class="mb-6">
              <h3 class="text-sm font-semibold text-slate-400 mb-3">{{ lang.t('roi.common_functions') }}</h3>
              <div class="flex flex-wrap gap-2">
                @for (fn of commonFunctions; track fn) {
                  <button (click)="addCommonFunction(fn)"
                          class="px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400 transition-all">
                    + {{ fn }}
                  </button>
                }
              </div>
            </div>

            @if (register?.functions?.length) {
              <div class="space-y-3 mb-6">
                @for (f of register!.functions!; track f.id) {
                  <div class="bg-slate-800/30 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <span class="font-medium text-white">{{ f.functionName }}</span>
                      <span class="text-xs ml-2 px-2 py-0.5 rounded-full"
                            [class]="f.criticalityAssessment === 'Critical' ? 'bg-red-500/20 text-red-400' : (f.criticalityAssessment === 'Important' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400')">
                        {{ f.criticalityAssessment || lang.t('roi.neither') }}
                      </span>
                    </div>
                    <button (click)="removeFunction(f.id)" class="text-red-400 hover:text-red-300 text-sm">&#10005;</button>
                  </div>
                }
              </div>
            }

            <div class="border-t border-slate-700/50 pt-4">
              <h3 class="text-sm font-semibold text-slate-400 mb-3">{{ lang.t('roi.add_function') }}</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" [(ngModel)]="newFunction.functionName" placeholder="{{ lang.t('roi.function_name') }} *" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                <select [(ngModel)]="newFunction.criticalityAssessment" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                  @for (c of criticalityOptions; track c.code) {
                    <option [value]="c.code">{{ c.label }}</option>
                  }
                </select>
                <input type="text" [(ngModel)]="newFunction.licensedActivity" placeholder="{{ lang.t('roi.licensed_activity') }}" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
              </div>
              <button (click)="addFunction()" class="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm" [disabled]="!newFunction.functionName">
                + {{ lang.t('roi.add_function') }}
              </button>
            </div>
          }

          <!-- STEP 4: Contracts -->
          @if (currentStep === 4) {
            <h2 class="text-xl font-semibold text-white mb-6">{{ lang.t('roi.step4_title') }}</h2>

            @if (register?.contracts?.length) {
              <div class="space-y-3 mb-6">
                @for (c of register!.contracts!; track c.id) {
                  <div class="bg-slate-800/30 rounded-lg p-4">
                    <div class="flex items-center justify-between">
                      <div>
                        <span class="font-medium text-white">{{ c.contractRefNumber }}</span>
                        <span class="text-xs text-slate-500 ml-2">{{ c.contractType }} &middot; {{ c.currency }} {{ c.annualCost }}</span>
                      </div>
                      <button (click)="removeContract(c.id)" class="text-red-400 hover:text-red-300 text-sm">&#10005;</button>
                    </div>
                    <p class="text-xs text-slate-500 mt-1">{{ c.startDate }} — {{ c.endDate || lang.t('roi.indefinite') }}</p>
                  </div>
                }
              </div>
            }

            <div class="border-t border-slate-700/50 pt-4">
              <h3 class="text-sm font-semibold text-slate-400 mb-3">{{ lang.t('roi.add_contract') }}</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" [(ngModel)]="newContract.contractRefNumber" placeholder="{{ lang.t('roi.contract_ref') }} * ({{ lang.t('roi.example_short') }} ARR-0001)" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                <select [(ngModel)]="newContract.contractType" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                  <option value="">{{ lang.t('roi.contract_type') }}...</option>
                  @for (t of contractTypes; track t.code) {
                    <option [value]="t.code">{{ t.label }}</option>
                  }
                </select>
                <input type="text" [(ngModel)]="newContract.currency" placeholder="{{ lang.t('roi.currency') }}" value="EUR" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                <input type="number" [(ngModel)]="newContract.annualCost" placeholder="{{ lang.t('roi.annual_cost') }}" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                <input type="date" [(ngModel)]="newContract.startDate" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                <input type="date" [(ngModel)]="newContract.endDate" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                <input type="number" [(ngModel)]="newContract.noticePeriodDays" placeholder="{{ lang.t('roi.notice_period') }}" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                <textarea [(ngModel)]="newContract.reasonForCriticality" placeholder="{{ lang.t('roi.reason_criticality') }}" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white" rows="2"></textarea>
              </div>
              <button (click)="addContract()" class="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm" [disabled]="!newContract.contractRefNumber">
                + {{ lang.t('roi.add_contract') }}
              </button>
            </div>

            @if (register?.contracts?.length) {
              <div class="border-t border-slate-700/50 pt-6 mt-6">
                <h3 class="text-sm font-semibold text-slate-400 mb-3">{{ lang.t('roi.contract_details') }} (B_02.02)</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select [(ngModel)]="newContractDetail.contractRefNumber" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                    <option value="">{{ lang.t('roi.select_contract') }}...</option>
                    @for (c of register!.contracts!; track c.id) {
                      <option [value]="c.contractRefNumber">{{ c.contractRefNumber }}</option>
                    }
                  </select>
                  <select [(ngModel)]="newContractDetail.ictServiceType" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                    <option value="">{{ lang.t('roi.ict_service_type') }}...</option>
                    @for (t of ictServiceTypes; track t.code) {
                      <option [value]="t.code">{{ t.label }}</option>
                    }
                  </select>
                  <select [(ngModel)]="newContractDetail.functionIdentifier" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                    <option value="">{{ lang.t('roi.link_function') }}...</option>
                    @for (f of register!.functions!; track f.id) {
                      <option [value]="f.functionIdentifier">{{ f.functionName }}</option>
                    }
                  </select>
                  <input type="text" [(ngModel)]="newContractDetail.dataLocationStorage" placeholder="{{ lang.t('roi.data_location_storage') }} (EE)" maxlength="2" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                  <input type="text" [(ngModel)]="newContractDetail.dataLocationProcessing" placeholder="{{ lang.t('roi.data_location_processing') }} (EE)" maxlength="2" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                  <div class="flex items-center gap-3">
                    <label class="text-sm text-slate-400">{{ lang.t('roi.exit_plan') }}:</label>
                    <input type="checkbox" [(ngModel)]="newContractDetail.exitPlanExists" class="w-4 h-4 accent-emerald-500">
                  </div>
                </div>
                <button (click)="addContractDetail()" class="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm" [disabled]="!newContractDetail.contractRefNumber">
                  + {{ lang.t('roi.add_detail') }}
                </button>

                @if (register?.contractDetails?.length) {
                  <div class="mt-4 space-y-2">
                    @for (d of register!.contractDetails!; track d.id) {
                      <div class="flex items-center justify-between bg-slate-800/20 rounded-lg p-3 text-xs">
                        <span class="text-slate-300">{{ d.contractRefNumber }} &rarr; {{ d.ictServiceType }} &rarr; {{ d.functionIdentifier || '—' }}</span>
                        <button (click)="removeContractDetail(d.id)" class="text-red-400 hover:text-red-300">&#10005;</button>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          }

          <!-- STEP 5: Linking -->
          @if (currentStep === 5) {
            <h2 class="text-xl font-semibold text-white mb-4">{{ lang.t('roi.step5_title') }}</h2>
            <p class="text-slate-400 text-sm mb-6">{{ lang.t('roi.step5_desc') }}</p>

            <button (click)="runAutoFillLinking()" class="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold mb-6">
              {{ lang.t('roi.auto_fill') }}
            </button>

            @if (register) {
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-slate-800/30 rounded-lg p-4">
                  <h4 class="text-sm font-semibold text-slate-300 mb-2">B_03.01 — {{ lang.t('roi.recipients') }}</h4>
                  <p class="text-2xl font-bold text-emerald-400">{{ register.recipients?.length || 0 }}</p>
                </div>
                <div class="bg-slate-800/30 rounded-lg p-4">
                  <h4 class="text-sm font-semibold text-slate-300 mb-2">B_03.02 — {{ lang.t('roi.provider_signings') }}</h4>
                  <p class="text-2xl font-bold text-blue-400">{{ register.providerSignings?.length || 0 }}</p>
                </div>
                <div class="bg-slate-800/30 rounded-lg p-4">
                  <h4 class="text-sm font-semibold text-slate-300 mb-2">B_04.01 — {{ lang.t('roi.service_users') }}</h4>
                  <p class="text-2xl font-bold text-purple-400">{{ register.serviceUsers?.length || 0 }}</p>
                </div>
                <div class="bg-slate-800/30 rounded-lg p-4">
                  <h4 class="text-sm font-semibold text-slate-300 mb-2">B_03.03 — {{ lang.t('roi.internal_providers') }}</h4>
                  <p class="text-2xl font-bold text-amber-400">{{ register.internalProviders?.length || 0 }}</p>
                </div>
              </div>
            }
          }

          <!-- STEP 6: Assessment -->
          @if (currentStep === 6) {
            <h2 class="text-xl font-semibold text-white mb-6">{{ lang.t('roi.step6_title') }}</h2>

            @if (register?.assessments?.length) {
              <div class="space-y-3 mb-6">
                @for (a of register!.assessments!; track a.id) {
                  <div class="bg-slate-800/30 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <span class="font-medium text-white">{{ a.contractRefNumber }}</span>
                      <span class="text-xs ml-2 px-2 py-0.5 rounded-full"
                            [class]="a.riskLevel === 'Critical' ? 'bg-red-500/20 text-red-400' : (a.riskLevel === 'High' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400')">
                        {{ a.riskLevel }}
                      </span>
                      <span class="text-xs text-slate-500 ml-2">Exit: {{ a.exitStrategyExists ? lang.t('roi.yes') : lang.t('roi.no') }}</span>
                    </div>
                    <button (click)="removeAssessment(a.id)" class="text-red-400 hover:text-red-300 text-sm">&#10005;</button>
                  </div>
                }
              </div>
            }

            @if (register?.contracts?.length) {
              <div class="border-t border-slate-700/50 pt-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select [(ngModel)]="newAssessment.contractRefNumber" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                    <option value="">{{ lang.t('roi.select_contract') }}...</option>
                    @for (c of register!.contracts!; track c.id) {
                      <option [value]="c.contractRefNumber">{{ c.contractRefNumber }}</option>
                    }
                  </select>
                  <select [(ngModel)]="newAssessment.riskLevel" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                    @for (r of riskLevels; track r.code) {
                      <option [value]="r.code">{{ r.label }}</option>
                    }
                  </select>
                  <input type="date" [(ngModel)]="newAssessment.assessmentDate" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                  <input type="date" [(ngModel)]="newAssessment.lastAuditDate" placeholder="{{ lang.t('roi.last_audit') }}" class="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                  <div class="flex items-center gap-3">
                    <label class="text-sm text-slate-400">{{ lang.t('roi.exit_strategy') }}:</label>
                    <input type="checkbox" [(ngModel)]="newAssessment.exitStrategyExists" class="w-4 h-4 accent-emerald-500">
                  </div>
                  <div class="flex items-center gap-3">
                    <label class="text-sm text-slate-400">{{ lang.t('roi.alternatives') }}:</label>
                    <input type="checkbox" [(ngModel)]="newAssessment.alternativeProvidersIdentified" class="w-4 h-4 accent-emerald-500">
                  </div>
                </div>
                <button (click)="addAssessment()" class="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm" [disabled]="!newAssessment.contractRefNumber">
                  + {{ lang.t('roi.add_assessment') }}
                </button>
              </div>
            }
          }

          <!-- STEP 7: Validate & Export (REDESIGNED) -->
          @if (currentStep === 7) {
            <h2 class="text-xl font-semibold text-white mb-6">{{ lang.t('roi.step7_title') }}</h2>

            <button (click)="runValidation()" class="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold mb-6"
                    [disabled]="validating">
              {{ validating ? '...' : lang.t('roi.run_validation') }}
            </button>

            @if (validationReport) {
              <!-- Traffic Light Indicator -->
              <div class="flex items-center gap-4 mb-6 p-4 rounded-xl"
                   [class]="validationReport.status === 'GREEN' ? 'bg-emerald-500/10 border border-emerald-500/30' :
                            (validationReport.status === 'YELLOW' ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-red-500/10 border border-red-500/30')">
                <div class="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                     [class]="validationReport.status === 'GREEN' ? 'bg-emerald-500/20 text-emerald-400' :
                              (validationReport.status === 'YELLOW' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400')">
                  {{ validationReport.passRate | number:'1.0-0' }}%
                </div>
                <div>
                  <h3 class="text-lg font-bold"
                      [class]="validationReport.status === 'GREEN' ? 'text-emerald-400' :
                               (validationReport.status === 'YELLOW' ? 'text-amber-400' : 'text-red-400')">
                    {{ lang.t('roi.status_' + validationReport.status.toLowerCase()) }}
                  </h3>
                  <p class="text-sm text-slate-400">
                    {{ validationReport.passed }}/{{ validationReport.totalRules }} {{ lang.t('roi.rules_passed') }}
                    &middot; {{ validationReport.errors }} {{ lang.t('roi.errors_label') }}
                    &middot; {{ validationReport.warnings }} {{ lang.t('roi.warnings') }}
                    @if (validationReport.infos > 0) {
                      &middot; {{ validationReport.infos }} {{ lang.t('roi.infos_label') }}
                    }
                  </p>
                </div>
              </div>

              <!-- Summary Grid -->
              <div class="grid grid-cols-4 gap-3 mb-6">
                <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center">
                  <div class="text-xl font-bold text-emerald-400">{{ validationReport.passed }}</div>
                  <div class="text-[10px] text-slate-400">{{ lang.t('roi.passed') }}</div>
                </div>
                <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                  <div class="text-xl font-bold text-red-400">{{ validationReport.errors }}</div>
                  <div class="text-[10px] text-slate-400">{{ lang.t('roi.errors_label') }}</div>
                </div>
                <div class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center">
                  <div class="text-xl font-bold text-amber-400">{{ validationReport.warnings }}</div>
                  <div class="text-[10px] text-slate-400">{{ lang.t('roi.warnings') }}</div>
                </div>
                <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
                  <div class="text-xl font-bold text-blue-400">{{ validationReport.infos }}</div>
                  <div class="text-[10px] text-slate-400">{{ lang.t('roi.infos_label') }}</div>
                </div>
              </div>

              <!-- Template-grouped Expandable Sections -->
              <div class="space-y-2 mb-6">
                @for (ts of getTemplateSummaryEntries(); track ts.templateCode) {
                  <div class="border rounded-lg overflow-hidden"
                       [class]="ts.status === 'GREEN' ? 'border-emerald-500/20' : (ts.status === 'YELLOW' ? 'border-amber-500/20' : 'border-red-500/20')">
                    <button (click)="toggleTemplateSection(ts.templateCode)"
                            class="w-full flex items-center justify-between px-4 py-3 bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                      <div class="flex items-center gap-3">
                        <span class="w-3 h-3 rounded-full"
                              [class]="ts.status === 'GREEN' ? 'bg-emerald-500' : (ts.status === 'YELLOW' ? 'bg-amber-500' : 'bg-red-500')"></span>
                        <span class="font-mono text-xs text-slate-400">{{ ts.templateCode }}</span>
                        <span class="text-sm text-white">{{ ts.templateName }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        @if (ts.errors > 0) {
                          <span class="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">{{ ts.errors }} ERR</span>
                        }
                        @if (ts.warnings > 0) {
                          <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">{{ ts.warnings }} WARN</span>
                        }
                        @if (ts.errors === 0 && ts.warnings === 0) {
                          <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">PASS</span>
                        }
                        <span class="text-slate-500 text-sm">{{ expandedTemplates[ts.templateCode] ? '&#9660;' : '&#9654;' }}</span>
                      </div>
                    </button>
                    @if (expandedTemplates[ts.templateCode]) {
                      <div class="px-4 py-2 space-y-1.5 bg-slate-900/30">
                        @for (issue of getIssuesForTemplate(ts.templateCode); track $index) {
                          <div class="flex items-start gap-3 p-2 rounded-lg cursor-pointer hover:bg-slate-800/50 text-sm"
                               [class]="issue.severity === 'ERROR' ? 'bg-red-500/5' : (issue.severity === 'WARNING' ? 'bg-amber-500/5' : 'bg-blue-500/5')"
                               (click)="goToIssueFromReport(issue)">
                            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0"
                                  [class]="issue.severity === 'ERROR' ? 'bg-red-500/20 text-red-400' : (issue.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400')">
                              {{ issue.ruleId }}
                            </span>
                            <div class="flex-1 min-w-0">
                              <p class="text-slate-300 truncate">{{ lang.currentLang === 'et' ? issue.messageEt : issue.messageEn }}</p>
                              <p class="text-[10px] text-slate-500 mt-0.5">{{ issue.templateCode }}.{{ issue.field }}{{ issue.entityRef ? ' — ' + issue.entityRef : '' }}</p>
                            </div>
                          </div>
                        }
                        @if (getIssuesForTemplate(ts.templateCode).length === 0) {
                          <p class="text-xs text-emerald-400 py-2">&#10003; {{ lang.t('roi.passed') }}</p>
                        }
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- Template Completeness -->
              @if (validationReport.completeness) {
                <div class="mb-6">
                  <h3 class="text-sm font-semibold text-slate-400 mb-3">{{ lang.t('roi.template_completeness') }}</h3>
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                    @for (entry of getReportCompletenessEntries(); track entry.templateCode) {
                      <div class="bg-slate-800/30 rounded-lg p-3">
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs font-mono text-slate-400">{{ entry.templateCode }}</span>
                          <span class="text-xs font-bold" [class]="entry.percentage >= 80 ? 'text-emerald-400' : (entry.percentage >= 50 ? 'text-amber-400' : 'text-red-400')">
                            {{ entry.percentage }}%
                          </span>
                        </div>
                        <p class="text-sm text-white mb-1">{{ entry.templateName }}</p>
                        <div class="w-full bg-slate-700 rounded-full h-1.5">
                          <div class="h-1.5 rounded-full transition-all" [style.width.%]="entry.percentage"
                               [class]="entry.percentage >= 80 ? 'bg-emerald-500' : (entry.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500')"></div>
                        </div>
                        @if (entry.missingFields.length) {
                          <p class="text-[10px] text-slate-500 mt-1">{{ entry.missingFields.join(', ') }}</p>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            }

            <!-- Export buttons -->
            <div class="border-t border-slate-700/50 pt-6 mt-6">
              <h3 class="text-sm font-semibold text-slate-400 mb-4">{{ lang.t('roi.export_options') }}</h3>

              @if (validationReport?.status === 'RED') {
                <div class="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                  {{ lang.t('roi.export_blocked') }}
                </div>
              }
              @if (validationReport?.status === 'YELLOW') {
                <div class="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-400">
                  {{ lang.t('roi.export_warning') }}
                </div>
              }

              <div class="flex flex-wrap gap-3">
                <button (click)="exportExcel()" class="px-5 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold flex items-center gap-2"
                        [disabled]="validationReport?.status === 'RED'">
                  <span>&#128196;</span> {{ lang.t('roi.export_excel') }}
                </button>
                <button (click)="exportXbrlCsv()" class="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold flex items-center gap-2"
                        [disabled]="validationReport?.status === 'RED'">
                  <span>&#128230;</span> {{ lang.t('roi.export_xbrl') }}
                  <span class="text-xs bg-blue-500/30 px-2 py-0.5 rounded-full">{{ lang.t('roi.tier_enterprise') }}</span>
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Navigation -->
        <div class="flex justify-between mt-6">
          <button (click)="prevStep()" [disabled]="currentStep === 1"
                  class="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed">
            &larr; {{ lang.t('roi.prev') }}
          </button>
          <button (click)="nextStep()"
                  class="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg font-semibold">
            {{ currentStep === 7 ? lang.t('roi.finish') : lang.t('roi.next') + ' &rarr;' }}
          </button>
        </div>
      </div>

      <!-- Floating Pre-check Button (steps 2-6) -->
      @if (currentStep >= 2 && currentStep <= 6 && register) {
        <button (click)="runPreCheck()" class="fixed bottom-6 right-6 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 text-sm font-medium z-50 transition-all"
                [disabled]="preChecking">
          @if (preChecking) {
            <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          } @else {
            <span>&#9889;</span>
          }
          {{ lang.t('roi.run_precheck') }}
          @if (preCheckResult) {
            <span class="w-2.5 h-2.5 rounded-full ml-1"
                  [class]="preCheckResult.status === 'GREEN' ? 'bg-emerald-400' : (preCheckResult.status === 'YELLOW' ? 'bg-amber-400' : 'bg-red-400')"></span>
          }
        </button>
      }
    </div>
  `,
  styles: [`
    .glass-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 12px;
      backdrop-filter: blur(12px);
    }
    select option { background: #1e293b; color: #e2e8f0; }
  `]
})
export class RoiWizardComponent implements OnInit {
  register: RoiRegister | null = null;
  currentStep = 1;
  isGroup = false;
  leiResult: GleifResult | null = null;
  validationReport: RoiValidationReport | null = null;
  preCheckResult: RoiValidationReport | null = null;
  saving = false;
  validating = false;
  preChecking = false;
  expandedTemplates: { [key: string]: boolean } = {};
  stepValidationStatus: { [step: number]: string } = {};

  // DPM lists
  entityTypes = ENTITY_TYPES;
  contractTypes = CONTRACT_TYPES;
  ictServiceTypes = ICT_SERVICE_TYPES;
  criticalityOptions = CRITICALITY_OPTIONS;
  riskLevels = RISK_LEVELS;
  providerTypes = PROVIDER_TYPES;
  commonFunctions = COMMON_FUNCTIONS;
  presetProviders = PRESET_PROVIDERS;

  get steps() {
    return [
      { num: 1, label: this.lang.t('roi.step_entity') },
      { num: 2, label: this.lang.t('roi.step_providers') },
      { num: 3, label: this.lang.t('roi.step_functions') },
      { num: 4, label: this.lang.t('roi.step_contracts') },
      { num: 5, label: this.lang.t('roi.step_linking') },
      { num: 6, label: this.lang.t('roi.step_assessment') },
      { num: 7, label: this.lang.t('roi.step_export') }
    ];
  }

  form: any = {
    entityName: '', entityLei: '', country: 'EE', entityType: '',
    competentAuthority: 'Finantsinspektsioon', consolidationScope: 'IND', reportingDate: ''
  };

  newGroupEntity: any = { entityName: '', lei: '', country: '' };
  newProvider: Partial<RoiProvider> = { providerName: '', providerIdentifier: '', identificationCodeType: 'LEI', countryOfHq: '', providerType: '', currencyOfContract: 'EUR' };
  newFunction: Partial<RoiFunction> = { functionName: '', criticalityAssessment: 'Neither', licensedActivity: '' };
  newContract: Partial<RoiContract> = { contractRefNumber: '', contractType: '', currency: 'EUR' };
  newContractDetail: Partial<RoiContractDetail> = { contractRefNumber: '', ictServiceType: '', functionIdentifier: '', exitPlanExists: false };
  newAssessment: Partial<RoiAssessment> = { contractRefNumber: '', riskLevel: 'Medium', exitStrategyExists: false, alternativeProvidersIdentified: false };

  private stepTemplateMap: Record<number, string[]> = {
    1: ['B_01'],
    2: ['B_05'],
    3: ['B_06'],
    4: ['B_02'],
    5: ['B_03', 'B_04'],
    6: ['B_07']
  };

  constructor(
    public lang: LangService,
    private roiService: RoiService,
    private route: ActivatedRoute,
    private router: Router,
    public subscription: SubscriptionService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.roiService.getRegister(id).subscribe(reg => {
        this.register = reg;
        this.form = {
          entityName: reg.entityName, entityLei: reg.entityLei || '', country: reg.country || 'EE',
          entityType: reg.entityType || '', competentAuthority: reg.competentAuthority || '',
          consolidationScope: reg.consolidationScope || 'IND', reportingDate: reg.reportingDate || ''
        };
        this.isGroup = (reg.groupEntities?.length || 0) > 0;
      });
    }
  }

  // ── Navigation ──

  nextStep() {
    if (currentStepRequiresSave(this.currentStep) && !this.register) {
      this.createAndContinue();
      return;
    }
    if (this.currentStep === 1) {
      this.saveStep1();
    }
    // Auto-validate step on leaving
    this.validateStepOnLeave(this.currentStep);

    if (this.currentStep === 7) {
      this.router.navigate(['/roi']);
      return;
    }
    this.currentStep = Math.min(this.currentStep + 1, 7);
  }

  prevStep() {
    this.validateStepOnLeave(this.currentStep);
    this.currentStep = Math.max(this.currentStep - 1, 1);
  }

  private validateStepOnLeave(step: number) {
    if (!this.register) return;
    const templates = this.stepTemplateMap[step];
    if (!templates) return;
    for (const tmpl of templates) {
      this.roiService.validateTemplate(this.register.id, tmpl).subscribe(report => {
        this.stepValidationStatus[step] = report.status;
      });
    }
  }

  private createAndContinue() {
    this.roiService.createRegister(this.form).subscribe(reg => {
      this.register = reg;
      this.router.navigate(['/roi', reg.id, 'edit'], { replaceUrl: true });
      this.currentStep = 2;
    });
  }

  private saveStep1() {
    if (this.register) {
      this.roiService.updateRegister(this.register.id, this.form).subscribe(reg => {
        this.register = reg;
      });
    }
  }

  // ── GLEIF ──

  lookupLei(lei: string) {
    if (!lei) return;
    this.roiService.lookupLei(lei).subscribe(result => {
      this.leiResult = result;
      if (result.name && !this.form.entityName) this.form.entityName = result.name;
      if (result.country) this.form.country = result.country;
    });
  }

  lookupProviderLei() {
    if (!this.newProvider.providerIdentifier) return;
    this.roiService.lookupLei(this.newProvider.providerIdentifier).subscribe(result => {
      if (result.name) this.newProvider.providerName = result.name;
      if (result.country) this.newProvider.countryOfHq = result.country;
    });
  }

  // ── Group entities ──
  addGroupEntity() {
    if (!this.register || !this.newGroupEntity.entityName) return;
    this.newGroupEntity.parentEntityLei = this.form.entityLei;
    this.roiService.addGroupEntity(this.register.id, this.newGroupEntity).subscribe(reg => {
      this.register = reg;
      this.newGroupEntity = { entityName: '', lei: '', country: '' };
    });
  }

  removeGroupEntity(id: string) {
    if (!this.register) return;
    this.roiService.removeGroupEntity(this.register.id, id).subscribe(() => {
      this.register!.groupEntities = this.register!.groupEntities.filter(e => e.id !== id);
    });
  }

  // ── Providers ──
  addProvider() {
    if (!this.register || !this.newProvider.providerName) return;
    this.roiService.addProvider(this.register.id, this.newProvider).subscribe(reg => {
      this.register = reg;
      this.newProvider = { providerName: '', providerIdentifier: '', identificationCodeType: 'LEI', countryOfHq: '', providerType: '', currencyOfContract: 'EUR' };
    });
  }

  addPresetProvider(preset: Partial<RoiProvider>) {
    if (!this.register || this.isProviderAdded(preset.providerName!)) return;
    this.roiService.addProvider(this.register.id, { ...preset }).subscribe(reg => { this.register = reg; });
  }

  isProviderAdded(name: string): boolean {
    return this.register?.providers?.some(p => p.providerName === name) || false;
  }

  removeProvider(id: string) {
    if (!this.register) return;
    this.roiService.removeProvider(this.register.id, id).subscribe(() => {
      this.register!.providers = this.register!.providers.filter(p => p.id !== id);
    });
  }

  // ── Functions ──
  addFunction() {
    if (!this.register || !this.newFunction.functionName) return;
    const funcId = (this.form.entityLei || 'ENTITY') + '_' + this.newFunction.functionName!.replace(/\s+/g, '_').toUpperCase();
    this.roiService.addFunction(this.register.id, {
      ...this.newFunction, functionIdentifier: funcId, entityLei: this.form.entityLei
    }).subscribe(reg => {
      this.register = reg;
      this.newFunction = { functionName: '', criticalityAssessment: 'Neither', licensedActivity: '' };
    });
  }

  addCommonFunction(name: string) {
    this.newFunction.functionName = name;
    this.addFunction();
  }

  removeFunction(id: string) {
    if (!this.register) return;
    this.roiService.removeFunction(this.register.id, id).subscribe(() => {
      this.register!.functions = this.register!.functions.filter(f => f.id !== id);
    });
  }

  // ── Contracts ──
  addContract() {
    if (!this.register || !this.newContract.contractRefNumber) return;
    this.roiService.addContract(this.register.id, this.newContract).subscribe(reg => {
      this.register = reg;
      this.newContract = { contractRefNumber: '', contractType: '', currency: 'EUR' };
    });
  }

  removeContract(id: string) {
    if (!this.register) return;
    this.roiService.removeContract(this.register.id, id).subscribe(() => {
      this.register!.contracts = this.register!.contracts.filter(c => c.id !== id);
    });
  }

  addContractDetail() {
    if (!this.register || !this.newContractDetail.contractRefNumber) return;
    this.roiService.addContractDetail(this.register.id, this.newContractDetail).subscribe(reg => {
      this.register = reg;
      this.newContractDetail = { contractRefNumber: '', ictServiceType: '', functionIdentifier: '', exitPlanExists: false };
    });
  }

  removeContractDetail(id: string) {
    if (!this.register) return;
    this.roiService.removeContractDetail(this.register.id, id).subscribe(() => {
      this.register!.contractDetails = this.register!.contractDetails.filter(d => d.id !== id);
    });
  }

  // ── Linking ──
  runAutoFillLinking() {
    if (!this.register) return;
    this.roiService.autoFillLinking(this.register.id).subscribe(reg => { this.register = reg; });
  }

  // ── Assessments ──
  addAssessment() {
    if (!this.register || !this.newAssessment.contractRefNumber) return;
    if (!this.newAssessment.assessmentDate) {
      this.newAssessment.assessmentDate = new Date().toISOString().split('T')[0];
    }
    this.roiService.addAssessment(this.register.id, this.newAssessment).subscribe(reg => {
      this.register = reg;
      this.newAssessment = { contractRefNumber: '', riskLevel: 'Medium', exitStrategyExists: false, alternativeProvidersIdentified: false };
    });
  }

  removeAssessment(id: string) {
    if (!this.register) return;
    this.roiService.removeAssessment(this.register.id, id).subscribe(() => {
      this.register!.assessments = this.register!.assessments.filter(a => a.id !== id);
    });
  }

  // ── Validation (Step 7) ──

  runValidation() {
    if (!this.register) return;
    this.validating = true;
    this.roiService.validate(this.register.id).subscribe({
      next: report => {
        this.validationReport = report;
        this.validating = false;
        // Auto-expand sections with issues
        for (const ts of this.getTemplateSummaryEntries()) {
          if (ts.errors > 0 || ts.warnings > 0) {
            this.expandedTemplates[ts.templateCode] = true;
          }
        }
      },
      error: () => { this.validating = false; }
    });
  }

  runPreCheck() {
    if (!this.register) return;
    this.preChecking = true;
    const templates = this.stepTemplateMap[this.currentStep];
    if (!templates) { this.preChecking = false; return; }
    this.roiService.validateTemplate(this.register.id, templates[0]).subscribe({
      next: report => {
        this.preCheckResult = report;
        this.stepValidationStatus[this.currentStep] = report.status;
        this.preChecking = false;
      },
      error: () => { this.preChecking = false; }
    });
  }

  getTemplateSummaryEntries(): TemplateSummary[] {
    if (!this.validationReport?.templateSummaries) return [];
    return Object.values(this.validationReport.templateSummaries)
      .filter(ts => ts.ruleCount > 0 || ts.errors > 0 || ts.warnings > 0)
      .sort((a, b) => a.templateCode.localeCompare(b.templateCode));
  }

  getIssuesForTemplate(templateCode: string): RoiViolation[] {
    if (!this.validationReport?.issues) return [];
    return this.validationReport.issues.filter(i => i.templateCode === templateCode);
  }

  toggleTemplateSection(code: string) {
    this.expandedTemplates[code] = !this.expandedTemplates[code];
  }

  getReportCompletenessEntries(): TemplateCompleteness[] {
    if (!this.validationReport?.completeness) return [];
    return Object.values(this.validationReport.completeness);
  }

  getStepCompleteness(step: number): number {
    if (!this.validationReport?.completeness) return -1;
    const stepTemplateMap: Record<number, string[]> = {
      1: ['B_01.01'],
      2: ['B_05.01'],
      3: ['B_06.01'],
      4: ['B_02.01', 'B_02.02'],
      6: ['B_07.01']
    };
    const templates = stepTemplateMap[step];
    if (!templates) return -1;
    let totalPct = 0, count = 0;
    for (const code of templates) {
      const c = this.validationReport.completeness[code];
      if (c) { totalPct += c.percentage; count++; }
    }
    return count > 0 ? Math.round(totalPct / count) : -1;
  }

  goToIssueFromReport(issue: RoiViolation) {
    const templateStepMap: Record<string, number> = {
      'B_01.01': 1, 'B_01.02': 1, 'B_01.03': 1,
      'B_05.01': 2, 'B_05.02': 2,
      'B_06.01': 3,
      'B_02.01': 4, 'B_02.02': 4, 'B_02.03': 4,
      'B_03.01': 5, 'B_03.02': 5, 'B_03.03': 5, 'B_04.01': 5,
      'B_07.01': 6
    };
    const step = templateStepMap[issue.templateCode];
    if (step) this.currentStep = step;
  }

  // ── Exports ──
  exportExcel() {
    if (!this.register) return;
    this.roiService.exportExcel(this.register.id).subscribe(blob => {
      this.downloadBlob(blob, `RoI_${this.register!.entityName}.xlsx`);
    });
  }

  exportXbrlCsv() {
    if (!this.register) return;
    this.roiService.exportXbrlCsv(this.register.id).subscribe(blob => {
      this.downloadBlob(blob, `${this.register!.entityLei || 'RoI'}_DORA.zip`);
    });
  }

  private downloadBlob(blob: Blob, filename: string) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

function currentStepRequiresSave(step: number): boolean {
  return step === 1;
}
