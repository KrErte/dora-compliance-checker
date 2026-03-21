import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LangService } from '../lang.service';
import { AuthService } from '../auth/auth.service';

interface GroupEntity {
  id: string;
  name: string;
  type: 'PARENT' | 'SUBSIDIARY' | 'BRANCH' | 'JOINT_VENTURE';
  country: string;
  registryCode: string;
  sector: string;
  doraApplicable: boolean;
  nis2Applicable: boolean;
  maturityScore?: number;
  lastAssessment?: string;
  contactPerson?: string;
  contactEmail?: string;
  notes?: string;
}

interface ConsolidatedView {
  totalEntities: number;
  doraApplicable: number;
  nis2Applicable: number;
  avgMaturity: number;
  entitiesByCountry: { [key: string]: number };
  entitiesByType: { [key: string]: number };
}

@Component({
  selector: 'app-group-entity',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white">
            {{ lang.t('group.group_entity_management') }}
          </h1>
          <p class="text-sm text-slate-400 mt-1">DORA Art. 11 —
            {{ lang.t('group.consolidated_digital_operational_resilie') }}
          </p>
        </div>
        <button (click)="showModal = true; resetForm()"
                class="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-500 text-white
                       hover:from-violet-400 hover:to-purple-400 hover:shadow-lg hover:shadow-violet-500/25 transition-all">
          + {{ lang.t('group.add_entity') }}
        </button>
      </div>

      <!-- Consolidated overview -->
      @if (entities().length > 0) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p class="text-2xl font-bold text-white">{{ consolidated().totalEntities }}</p>
            <p class="text-xs text-slate-400 mt-1">
              {{ lang.t('group.total_entities') }}
            </p>
          </div>
          <div class="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p class="text-2xl font-bold text-blue-600">{{ consolidated().doraApplicable }}</p>
            <p class="text-xs text-slate-400 mt-1">DORA</p>
          </div>
          <div class="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p class="text-2xl font-bold text-amber-400">{{ consolidated().nis2Applicable }}</p>
            <p class="text-xs text-slate-400 mt-1">NIS2</p>
          </div>
          <div class="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p class="text-2xl font-bold" [ngClass]="{
              'text-red-400': consolidated().avgMaturity < 2,
              'text-amber-400': consolidated().avgMaturity >= 2 && consolidated().avgMaturity < 3.5,
              'text-blue-600': consolidated().avgMaturity >= 3.5
            }">{{ consolidated().avgMaturity.toFixed(1) }}</p>
            <p class="text-xs text-slate-400 mt-1">
              {{ lang.t('group.avg_maturity') }}
            </p>
          </div>
        </div>

        <!-- Country distribution -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white rounded-xl border border-slate-200 p-4">
            <h3 class="text-sm font-semibold text-slate-600 mb-3">
              {{ lang.t('group.by_country') }}
            </h3>
            @for (entry of getCountryEntries(); track entry[0]) {
              <div class="flex items-center justify-between py-1.5">
                <span class="text-sm text-slate-600">{{ entry[0] }}</span>
                <div class="flex items-center gap-2">
                  <div class="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-violet-400 to-purple-400 rounded-full"
                         [style.width.%]="(entry[1] / consolidated().totalEntities) * 100"></div>
                  </div>
                  <span class="text-xs text-slate-500 w-6 text-right">{{ entry[1] }}</span>
                </div>
              </div>
            }
          </div>
          <div class="bg-white rounded-xl border border-slate-200 p-4">
            <h3 class="text-sm font-semibold text-slate-600 mb-3">
              {{ lang.t('group.by_type') }}
            </h3>
            @for (entry of getTypeEntries(); track entry[0]) {
              <div class="flex items-center justify-between py-1.5">
                <span class="text-sm text-slate-600">{{ getTypeLabel(entry[0]) }}</span>
                <span class="text-xs text-slate-500">{{ entry[1] }}</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Entities list -->
      @if (entities().length === 0) {
        <div class="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <svg class="w-16 h-16 text-slate-600 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
          </svg>
          <h3 class="text-lg font-semibold text-white mb-2">
            {{ lang.t('group.no_entities_added') }}
          </h3>
          <p class="text-sm text-slate-400">
            {{ lang.t('group.add_group_entities_for_consolidated_over') }}
          </p>
        </div>
      }

      @for (entity of entities(); track entity.id) {
        <div class="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                   [ngClass]="{
                     'bg-blue-600': entity.type === 'PARENT',
                     'bg-gradient-to-br from-violet-400 to-purple-400': entity.type === 'SUBSIDIARY',
                     'bg-gradient-to-br from-amber-400 to-orange-400': entity.type === 'BRANCH',
                     'bg-gradient-to-br from-blue-400 to-indigo-400': entity.type === 'JOINT_VENTURE'
                   }">
                {{ entity.name.substring(0, 2).toUpperCase() }}
              </div>
              <div>
                <h3 class="text-base font-semibold text-white">{{ entity.name }}</h3>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-xs text-slate-500">{{ entity.country }}</span>
                  <span class="text-xs text-slate-600">|</span>
                  <span class="text-xs text-slate-500">{{ entity.registryCode }}</span>
                  <span class="text-xs text-slate-600">|</span>
                  <span class="text-xs text-slate-500">{{ entity.sector }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              @if (entity.doraApplicable) {
                <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-600">DORA</span>
              }
              @if (entity.nis2Applicable) {
                <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400">NIS2</span>
              }
              <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-600/30 text-slate-400">{{ getTypeLabel(entity.type) }}</span>
            </div>
          </div>

          <div class="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p class="text-[10px] text-slate-500 uppercase">
                {{ lang.t('group.maturity') }}
              </p>
              <p class="text-sm font-semibold" [ngClass]="{
                'text-red-400': (entity.maturityScore || 0) < 2,
                'text-amber-400': (entity.maturityScore || 0) >= 2 && (entity.maturityScore || 0) < 3.5,
                'text-blue-600': (entity.maturityScore || 0) >= 3.5,
                'text-slate-500': !entity.maturityScore
              }">{{ entity.maturityScore ? entity.maturityScore.toFixed(1) + ' / 5.0' : 'N/A' }}</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-500 uppercase">
                {{ lang.t('group.last_assessment') }}
              </p>
              <p class="text-sm text-slate-600">{{ entity.lastAssessment || 'N/A' }}</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-500 uppercase">
                {{ lang.t('group.contact') }}
              </p>
              <p class="text-sm text-slate-600">{{ entity.contactPerson || 'N/A' }}</p>
            </div>
            <div class="flex items-end justify-end gap-1">
              <button (click)="editEntity(entity)"
                      class="px-2 py-1 text-xs rounded bg-slate-600/30 text-slate-600 hover:bg-slate-100 transition-colors">
                {{ lang.t('group.edit') }}
              </button>
              <button (click)="deleteEntity(entity.id)"
                      class="px-2 py-1 text-xs rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                {{ lang.t('group.delete') }}
              </button>
            </div>
          </div>

          @if (entity.notes) {
            <p class="mt-2 text-xs text-slate-500 italic">{{ entity.notes }}</p>
          }
        </div>
      }

      <!-- Add/Edit modal -->
      @if (showModal) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="showModal = false">
          <div class="bg-slate-800 rounded-xl border border-slate-200 shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="p-5 border-b border-slate-200">
              <h3 class="text-lg font-semibold text-white">
                {{ editingId ? lang.t('group.edit_entity') : lang.t('group.add_entity_37') }}
              </h3>
            </div>
            <div class="p-5 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <label class="block text-xs font-medium text-slate-400 mb-1">
                    {{ lang.t('group.name') }} *
                  </label>
                  <input [(ngModel)]="form.name" type="text"
                         class="w-full px-3 py-2 bg-slate-700/50 border border-slate-200 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50">
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">
                    {{ lang.t('group.type') }}
                  </label>
                  <select [(ngModel)]="form.type"
                          class="w-full px-3 py-2 bg-slate-700/50 border border-slate-200 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50">
                    <option value="PARENT">{{ lang.t('group.parent_company') }}</option>
                    <option value="SUBSIDIARY">{{ lang.t('group.subsidiary') }}</option>
                    <option value="BRANCH">{{ lang.t('group.branch') }}</option>
                    <option value="JOINT_VENTURE">{{ lang.t('group.joint_venture') }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">
                    {{ lang.t('group.country') }}
                  </label>
                  <input [(ngModel)]="form.country" type="text"
                         class="w-full px-3 py-2 bg-slate-700/50 border border-slate-200 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50"
                         placeholder="EE, LV, LT, FI...">
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">
                    {{ lang.t('group.registry_code') }}
                  </label>
                  <input [(ngModel)]="form.registryCode" type="text"
                         class="w-full px-3 py-2 bg-slate-700/50 border border-slate-200 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50">
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">
                    {{ lang.t('group.sector') }}
                  </label>
                  <select [(ngModel)]="form.sector"
                          class="w-full px-3 py-2 bg-slate-700/50 border border-slate-200 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50">
                    <option value="Banking">{{ lang.t('group.banking') }}</option>
                    <option value="Insurance">{{ lang.t('group.insurance') }}</option>
                    <option value="Investment">{{ lang.t('group.investment') }}</option>
                    <option value="Payment">{{ lang.t('group.payment_services') }}</option>
                    <option value="Crypto">{{ lang.t('group.crypto_assets') }}</option>
                    <option value="Other">{{ lang.t('group.other') }}</option>
                  </select>
                </div>
                <div class="flex items-center gap-4 col-span-2">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input [(ngModel)]="form.doraApplicable" type="checkbox"
                           class="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500/30">
                    <span class="text-sm text-slate-600">DORA</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input [(ngModel)]="form.nis2Applicable" type="checkbox"
                           class="rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500/30">
                    <span class="text-sm text-slate-600">NIS2</span>
                  </label>
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">
                    {{ lang.t('group.maturity_score') }} (0-5)
                  </label>
                  <input [(ngModel)]="form.maturityScore" type="number" min="0" max="5" step="0.1"
                         class="w-full px-3 py-2 bg-slate-700/50 border border-slate-200 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50">
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">
                    {{ lang.t('group.last_assessment_30') }}
                  </label>
                  <input [(ngModel)]="form.lastAssessment" type="date"
                         class="w-full px-3 py-2 bg-slate-700/50 border border-slate-200 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50">
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">
                    {{ lang.t('group.contact_person') }}
                  </label>
                  <input [(ngModel)]="form.contactPerson" type="text"
                         class="w-full px-3 py-2 bg-slate-700/50 border border-slate-200 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50">
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">
                    {{ lang.t('group.contact_email') }}
                  </label>
                  <input [(ngModel)]="form.contactEmail" type="email"
                         class="w-full px-3 py-2 bg-slate-700/50 border border-slate-200 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50">
                </div>
                <div class="col-span-2">
                  <label class="block text-xs font-medium text-slate-400 mb-1">
                    {{ lang.t('group.notes') }}
                  </label>
                  <textarea [(ngModel)]="form.notes" rows="2"
                            class="w-full px-3 py-2 bg-slate-700/50 border border-slate-200 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50"></textarea>
                </div>
              </div>
            </div>
            <div class="p-5 border-t border-slate-200 flex justify-end gap-2">
              <button (click)="showModal = false"
                      class="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
                {{ lang.t('group.cancel') }}
              </button>
              <button (click)="saveEntity()" [disabled]="!form.name.trim()"
                      class="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 text-white
                             hover:from-violet-400 hover:to-purple-400 disabled:opacity-50 transition-all">
                {{ lang.t('group.save') }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class GroupEntityComponent implements OnInit {
  entities = signal<GroupEntity[]>([]);
  showModal = false;
  editingId: string | null = null;

  form: GroupEntity = this.getEmptyForm();

  constructor(
    public lang: LangService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    this.loadEntities();
  }

  private getEmptyForm(): GroupEntity {
    return {
      id: '', name: '', type: 'SUBSIDIARY', country: '', registryCode: '',
      sector: 'Banking', doraApplicable: true, nis2Applicable: false,
      maturityScore: undefined, lastAssessment: undefined,
      contactPerson: undefined, contactEmail: undefined, notes: undefined
    };
  }

  resetForm() {
    this.form = this.getEmptyForm();
    this.editingId = null;
  }

  private loadEntities() {
    if (typeof localStorage === 'undefined') return;
    const stored = localStorage.getItem('group_entities');
    if (stored) this.entities.set(JSON.parse(stored));
  }

  private saveToStorage() {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('group_entities', JSON.stringify(this.entities()));
  }

  saveEntity() {
    if (!this.form.name.trim()) return;
    const list = [...this.entities()];
    if (this.editingId) {
      const idx = list.findIndex(e => e.id === this.editingId);
      if (idx >= 0) list[idx] = { ...this.form, id: this.editingId };
    } else {
      list.push({ ...this.form, id: crypto.randomUUID() });
    }
    this.entities.set(list);
    this.saveToStorage();
    this.showModal = false;
    this.resetForm();
  }

  editEntity(entity: GroupEntity) {
    this.form = { ...entity };
    this.editingId = entity.id;
    this.showModal = true;
  }

  deleteEntity(id: string) {
    this.entities.set(this.entities().filter(e => e.id !== id));
    this.saveToStorage();
  }

  consolidated(): ConsolidatedView {
    const ents = this.entities();
    const byCountry: { [k: string]: number } = {};
    const byType: { [k: string]: number } = {};
    let maturitySum = 0, maturityCount = 0;
    for (const e of ents) {
      byCountry[e.country] = (byCountry[e.country] || 0) + 1;
      byType[e.type] = (byType[e.type] || 0) + 1;
      if (e.maturityScore != null) { maturitySum += e.maturityScore; maturityCount++; }
    }
    return {
      totalEntities: ents.length,
      doraApplicable: ents.filter(e => e.doraApplicable).length,
      nis2Applicable: ents.filter(e => e.nis2Applicable).length,
      avgMaturity: maturityCount > 0 ? maturitySum / maturityCount : 0,
      entitiesByCountry: byCountry,
      entitiesByType: byType
    };
  }

  getCountryEntries(): [string, number][] {
    return Object.entries(this.consolidated().entitiesByCountry).sort((a, b) => b[1] - a[1]);
  }

  getTypeEntries(): [string, number][] {
    return Object.entries(this.consolidated().entitiesByType);
  }

  getTypeLabel(type: string): string {
    const map: { [k: string]: string } = {
      PARENT: this.lang.t('group.parent'),
      SUBSIDIARY: this.lang.t('group.subsidiary_39'),
      BRANCH: this.lang.t('group.branch_40'),
      JOINT_VENTURE: this.lang.t('group.joint_venture_41')
    };
    return map[type] || type;
  }
}
