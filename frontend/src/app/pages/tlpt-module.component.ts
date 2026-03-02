import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LangService } from '../lang.service';

interface TlptTest {
  id: string;
  name: string;
  scope: string;
  framework: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'REMEDIATION';
  startDate: string;
  endDate: string;
  testerType: 'INTERNAL' | 'EXTERNAL';
  testerName: string;
  findings: TlptFinding[];
  createdAt: string;
}

interface TlptFinding {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  status: 'OPEN' | 'REMEDIATED';
}

@Component({
  selector: 'app-tlpt-module',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            {{ lang.t('tlpt.tlpt_module_art_2627') }}
          </h1>
          <p class="text-slate-400 text-sm mt-1">{{ lang.t('tlpt.threatled_penetration_testing_planning_t') }}</p>
        </div>
        <button (click)="showForm = true" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-sm hover:shadow-lg transition-all flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          {{ lang.t('tlpt.plan_test') }}
        </button>
      </div>

      <!-- DORA requirements info -->
      <div class="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-5">
        <h3 class="text-sm font-semibold text-cyan-400 mb-2">{{ lang.t('tlpt.dora_art_26_requirements') }}</h3>
        <ul class="text-xs text-slate-300 space-y-1">
          <li>{{ lang.t('tlpt.u2022_tlpt_must_be_conducted_at_least_ev') }}</li>
          <li>{{ lang.t('tlpt.u2022_tests_must_cover_live_production_s') }}</li>
          <li>{{ lang.t('tlpt.u2022_every_third_cycle_must_use_externa') }}</li>
          <li>{{ lang.t('tlpt.u2022_follow_the_tibereu_framework') }}</li>
        </ul>
      </div>

      <!-- Tests list -->
      @if (tests().length === 0 && !showForm) {
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
          <svg class="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          <p class="text-slate-400">{{ lang.t('tlpt.no_tlpt_tests_planned_yet') }}</p>
        </div>
      }

      @for (test of tests(); track test.id) {
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-white font-semibold">{{ test.name }}</h3>
              <p class="text-xs text-slate-400 mt-0.5">{{ test.framework }} &bull; {{ test.testerType === 'EXTERNAL' ? (lang.t('tlpt.external_tester')) : (lang.t('tlpt.internal_tester')) }}: {{ test.testerName }}</p>
            </div>
            <span class="px-3 py-1 rounded-lg text-xs font-semibold"
                  [class]="test.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : test.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' : test.status === 'REMEDIATION' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700/50 text-slate-300'">
              {{ test.status }}
            </span>
          </div>
          <div class="flex gap-4 text-xs text-slate-400 mb-3">
            <span>{{ lang.t('tlpt.start') }}: {{ test.startDate }}</span>
            <span>{{ lang.t('tlpt.end') }}: {{ test.endDate }}</span>
            <span>{{ lang.t('tlpt.findings') }}: {{ test.findings.length }}</span>
          </div>
          @if (test.findings.length > 0) {
            <div class="flex gap-2 flex-wrap">
              @for (f of test.findings; track f.id) {
                <span class="px-2 py-1 rounded text-[10px] font-medium"
                      [class]="f.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : f.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' : f.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'">
                  {{ f.title }} ({{ f.status }})
                </span>
              }
            </div>
          }
          <div class="flex gap-2 mt-3">
            <select [(ngModel)]="test.status" (ngModelChange)="saveTests()"
                    class="px-2 py-1 bg-slate-900/50 border border-slate-600/50 rounded-lg text-xs text-white focus:outline-none">
              <option value="PLANNED">Planned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="REMEDIATION">Remediation</option>
            </select>
            <button (click)="addFinding(test)" class="px-2 py-1 rounded-lg bg-slate-700/30 text-xs text-slate-300 hover:bg-slate-600/30">
              + {{ lang.t('tlpt.add_finding') }}
            </button>
          </div>
        </div>
      }

      <!-- Create form modal -->
      @if (showForm) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="showForm = false">
          <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg" (click)="$event.stopPropagation()">
            <h2 class="text-lg font-bold text-white mb-4">{{ lang.t('tlpt.plan_tlpt_test') }}</h2>
            <div class="space-y-4">
              <input [(ngModel)]="newTest.name" type="text" [placeholder]="lang.t('tlpt.test_name')"
                     class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none">
              <textarea [(ngModel)]="newTest.scope" rows="2" [placeholder]="lang.t('tlpt.scope_systems_processes')"
                        class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none"></textarea>
              <div class="grid grid-cols-2 gap-4">
                <select [(ngModel)]="newTest.framework" class="px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none">
                  <option value="TIBER-EU">TIBER-EU</option>
                  <option value="CBEST">CBEST</option>
                  <option value="iCAST">iCAST</option>
                  <option value="OTHER">{{ lang.t('tlpt.other') }}</option>
                </select>
                <select [(ngModel)]="newTest.testerType" class="px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none">
                  <option value="EXTERNAL">{{ lang.t('tlpt.external') }}</option>
                  <option value="INTERNAL">{{ lang.t('tlpt.internal') }}</option>
                </select>
              </div>
              <input [(ngModel)]="newTest.testerName" type="text" [placeholder]="lang.t('tlpt.tester_namefirm')"
                     class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs text-slate-400 mb-1">{{ lang.t('tlpt.start') }}</label>
                  <input [(ngModel)]="newTest.startDate" type="date" class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none">
                </div>
                <div>
                  <label class="block text-xs text-slate-400 mb-1">{{ lang.t('tlpt.end') }}</label>
                  <input [(ngModel)]="newTest.endDate" type="date" class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none">
                </div>
              </div>
              <div class="flex justify-end gap-3">
                <button (click)="showForm = false" class="px-4 py-2 rounded-xl bg-slate-700/50 text-slate-300 text-sm">{{ lang.t('tlpt.cancel') }}</button>
                <button (click)="createTest()" [disabled]="!newTest.name" class="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold disabled:opacity-50">
                  {{ lang.t('tlpt.create_test') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class TlptModuleComponent {
  tests = signal<TlptTest[]>([]);
  showForm = false;
  newTest: any = { name: '', scope: '', framework: 'TIBER-EU', testerType: 'EXTERNAL', testerName: '', startDate: '', endDate: '' };

  constructor(public lang: LangService) {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('dora-tlpt-tests');
      if (saved) { try { this.tests.set(JSON.parse(saved)); } catch {} }
    }
  }

  createTest() {
    const test: TlptTest = {
      id: crypto.randomUUID(), ...this.newTest,
      status: 'PLANNED', findings: [], createdAt: new Date().toISOString()
    };
    this.tests.update(t => [test, ...t]);
    this.saveTests();
    this.showForm = false;
    this.newTest = { name: '', scope: '', framework: 'TIBER-EU', testerType: 'EXTERNAL', testerName: '', startDate: '', endDate: '' };
  }

  addFinding(test: TlptTest) {
    const title = prompt(this.lang.t('tlpt.finding_title'));
    if (!title) return;
    test.findings.push({ id: crypto.randomUUID(), title, severity: 'MEDIUM', description: '', status: 'OPEN' });
    this.saveTests();
  }

  saveTests() {
    if (typeof localStorage !== 'undefined') localStorage.setItem('dora-tlpt-tests', JSON.stringify(this.tests()));
  }
}
