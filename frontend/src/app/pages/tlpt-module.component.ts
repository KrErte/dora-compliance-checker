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
            {{ lang.currentLang === 'et' ? 'TLPT moodul (Art. 26-27)' : 'TLPT Module (Art. 26-27)' }}
          </h1>
          <p class="text-slate-400 text-sm mt-1">{{ lang.currentLang === 'et' ? 'Ohuteabel p\u00f5hinev l\u00e4bistusetestimine — planeerimine, j\u00e4lgimine, tulemused' : 'Threat-Led Penetration Testing — planning, tracking, results' }}</p>
        </div>
        <button (click)="showForm = true" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-sm hover:shadow-lg transition-all flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          {{ lang.currentLang === 'et' ? 'Planeeri test' : 'Plan Test' }}
        </button>
      </div>

      <!-- DORA requirements info -->
      <div class="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-5">
        <h3 class="text-sm font-semibold text-cyan-400 mb-2">{{ lang.currentLang === 'et' ? 'DORA Art. 26 n\u00f5uded' : 'DORA Art. 26 Requirements' }}</h3>
        <ul class="text-xs text-slate-300 space-y-1">
          <li>{{ lang.currentLang === 'et' ? '\u2022 TLPT tuleb l\u00e4bi viia v\u00e4hemalt iga 3 aasta tagant' : '\u2022 TLPT must be conducted at least every 3 years' }}</li>
          <li>{{ lang.currentLang === 'et' ? '\u2022 Testid peavad h\u00f5lmama reaalseid tootmiss\u00fcsteeme' : '\u2022 Tests must cover live production systems' }}</li>
          <li>{{ lang.currentLang === 'et' ? '\u2022 Iga kolmas ts\u00fckkel peab kasutama v\u00e4liseid testijaid' : '\u2022 Every third cycle must use external testers' }}</li>
          <li>{{ lang.currentLang === 'et' ? '\u2022 J\u00e4rgige TIBER-EU raamistikku' : '\u2022 Follow the TIBER-EU framework' }}</li>
        </ul>
      </div>

      <!-- Tests list -->
      @if (tests().length === 0 && !showForm) {
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
          <svg class="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          <p class="text-slate-400">{{ lang.currentLang === 'et' ? 'TLPT teste pole veel planeeritud' : 'No TLPT tests planned yet' }}</p>
        </div>
      }

      @for (test of tests(); track test.id) {
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-white font-semibold">{{ test.name }}</h3>
              <p class="text-xs text-slate-400 mt-0.5">{{ test.framework }} &bull; {{ test.testerType === 'EXTERNAL' ? (lang.currentLang === 'et' ? 'V\u00e4line testija' : 'External Tester') : (lang.currentLang === 'et' ? 'Sisene testija' : 'Internal Tester') }}: {{ test.testerName }}</p>
            </div>
            <span class="px-3 py-1 rounded-lg text-xs font-semibold"
                  [class]="test.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : test.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' : test.status === 'REMEDIATION' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700/50 text-slate-300'">
              {{ test.status }}
            </span>
          </div>
          <div class="flex gap-4 text-xs text-slate-400 mb-3">
            <span>{{ lang.currentLang === 'et' ? 'Algus' : 'Start' }}: {{ test.startDate }}</span>
            <span>{{ lang.currentLang === 'et' ? 'L\u00f5pp' : 'End' }}: {{ test.endDate }}</span>
            <span>{{ lang.currentLang === 'et' ? 'Leiud' : 'Findings' }}: {{ test.findings.length }}</span>
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
              + {{ lang.currentLang === 'et' ? 'Lisa leid' : 'Add Finding' }}
            </button>
          </div>
        </div>
      }

      <!-- Create form modal -->
      @if (showForm) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="showForm = false">
          <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg" (click)="$event.stopPropagation()">
            <h2 class="text-lg font-bold text-white mb-4">{{ lang.currentLang === 'et' ? 'Planeeri TLPT test' : 'Plan TLPT Test' }}</h2>
            <div class="space-y-4">
              <input [(ngModel)]="newTest.name" type="text" [placeholder]="lang.currentLang === 'et' ? 'Testi nimi' : 'Test Name'"
                     class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none">
              <textarea [(ngModel)]="newTest.scope" rows="2" [placeholder]="lang.currentLang === 'et' ? 'Ulatus (s\u00fcsteemid, protsessid)' : 'Scope (systems, processes)'"
                        class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none"></textarea>
              <div class="grid grid-cols-2 gap-4">
                <select [(ngModel)]="newTest.framework" class="px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none">
                  <option value="TIBER-EU">TIBER-EU</option>
                  <option value="CBEST">CBEST</option>
                  <option value="iCAST">iCAST</option>
                  <option value="OTHER">{{ lang.currentLang === 'et' ? 'Muu' : 'Other' }}</option>
                </select>
                <select [(ngModel)]="newTest.testerType" class="px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none">
                  <option value="EXTERNAL">{{ lang.currentLang === 'et' ? 'V\u00e4line' : 'External' }}</option>
                  <option value="INTERNAL">{{ lang.currentLang === 'et' ? 'Sisemine' : 'Internal' }}</option>
                </select>
              </div>
              <input [(ngModel)]="newTest.testerName" type="text" [placeholder]="lang.currentLang === 'et' ? 'Testija nimi/firma' : 'Tester Name/Firm'"
                     class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs text-slate-400 mb-1">{{ lang.currentLang === 'et' ? 'Algus' : 'Start' }}</label>
                  <input [(ngModel)]="newTest.startDate" type="date" class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none">
                </div>
                <div>
                  <label class="block text-xs text-slate-400 mb-1">{{ lang.currentLang === 'et' ? 'L\u00f5pp' : 'End' }}</label>
                  <input [(ngModel)]="newTest.endDate" type="date" class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none">
                </div>
              </div>
              <div class="flex justify-end gap-3">
                <button (click)="showForm = false" class="px-4 py-2 rounded-xl bg-slate-700/50 text-slate-300 text-sm">{{ lang.currentLang === 'et' ? 'T\u00fchista' : 'Cancel' }}</button>
                <button (click)="createTest()" [disabled]="!newTest.name" class="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold disabled:opacity-50">
                  {{ lang.currentLang === 'et' ? 'Loo test' : 'Create Test' }}
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
    const saved = localStorage.getItem('dora-tlpt-tests');
    if (saved) { try { this.tests.set(JSON.parse(saved)); } catch {} }
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
    const title = prompt(this.lang.currentLang === 'et' ? 'Leiu pealkiri:' : 'Finding title:');
    if (!title) return;
    test.findings.push({ id: crypto.randomUUID(), title, severity: 'MEDIUM', description: '', status: 'OPEN' });
    this.saveTests();
  }

  saveTests() {
    localStorage.setItem('dora-tlpt-tests', JSON.stringify(this.tests()));
  }
}
