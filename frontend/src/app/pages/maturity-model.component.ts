import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LangService } from '../lang.service';

interface MaturityArea {
  id: string;
  pillar: string;
  name: { et: string; en: string };
  articleRef: string;
  level: number; // 0-5
}

@Component({
  selector: 'app-maturity-model',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <div>
        <h1 class="text-2xl font-bold text-white flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          {{ lang.t('maturity.maturity_model_assessment') }}
        </h1>
        <p class="text-slate-400 text-sm mt-1">{{ lang.t('maturity.assess_your_dora_compliance_maturity_on') }}</p>
      </div>

      <!-- Overall maturity -->
      <div class="bg-white border border-slate-200 rounded-2xl p-6">
        <div class="flex items-center gap-6">
          <div class="relative w-28 h-28 flex-shrink-0">
            <svg class="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke-width="6" fill="none" class="stroke-slate-700"/>
              <circle cx="50" cy="50" r="42" stroke-width="6" fill="none" stroke-linecap="round"
                      [attr.stroke-dasharray]="264"
                      [attr.stroke-dashoffset]="264 - (264 * averageLevel() / 5)"
                      [class]="averageLevel() >= 4 ? 'stroke-blue-500' : averageLevel() >= 2.5 ? 'stroke-amber-400' : 'stroke-red-400'"/>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-2xl font-bold text-white">{{ averageLevel().toFixed(1) }}</span>
              <span class="text-[10px] text-slate-400">/ 5</span>
            </div>
          </div>
          <div class="flex-1">
            <h2 class="text-white font-semibold mb-2">{{ getMaturityLabel(averageLevel()) }}</h2>
            <div class="flex gap-1">
              @for (level of [0,1,2,3,4,5]; track level) {
                <div class="flex-1 text-center">
                  <div class="h-2 rounded-full mb-1"
                       [class]="level <= averageLevel() ? (level >= 4 ? 'bg-blue-500' : level >= 2 ? 'bg-amber-400' : 'bg-red-400') : 'bg-slate-700'"></div>
                  <span class="text-[9px] text-slate-500">{{ level }}</span>
                </div>
              }
            </div>
            <div class="mt-2 text-xs text-slate-400">
              0={{ lang.t('maturity.nonexistent') }},
              1={{ lang.t('maturity.initial') }},
              2={{ lang.t('maturity.developing') }},
              3={{ lang.t('maturity.defined') }},
              4={{ lang.t('maturity.managed') }},
              5={{ lang.t('maturity.optimised') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Pillar breakdown -->
      @for (pillar of pillars; track pillar.id) {
        <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between cursor-pointer"
               (click)="togglePillar(pillar.id)">
            <h2 class="text-lg font-semibold text-white">{{ lang.l(pillar.nameEt, pillar.nameEn) }}</h2>
            <div class="flex items-center gap-3">
              <span class="text-sm font-bold" [class]="getPillarAverage(pillar.id) >= 4 ? 'text-blue-600' : getPillarAverage(pillar.id) >= 2.5 ? 'text-amber-400' : 'text-red-400'">
                {{ getPillarAverage(pillar.id).toFixed(1) }}/5
              </span>
              <svg class="w-5 h-5 text-slate-400 transition-transform" [class.rotate-180]="expandedPillars.has(pillar.id)"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
          </div>
          @if (expandedPillars.has(pillar.id)) {
            <div class="divide-y divide-slate-700/30">
              @for (area of getAreasForPillar(pillar.id); track area.id) {
                <div class="px-6 py-3 flex items-center gap-4">
                  <div class="flex-1 min-w-0">
                    <div class="text-sm text-white">{{ lang.l(area.name.et, area.name.en) }}</div>
                    <div class="text-[10px] text-slate-500">{{ area.articleRef }}</div>
                  </div>
                  <div class="flex gap-1">
                    @for (lvl of [0,1,2,3,4,5]; track lvl) {
                      <button (click)="setLevel(area, lvl)"
                              class="w-8 h-8 rounded-lg text-xs font-bold transition-all"
                              [class]="area.level === lvl ? (lvl >= 4 ? 'bg-blue-600/30 text-blue-600 border border-blue-500/40' : lvl >= 2 ? 'bg-amber-500/30 text-amber-400 border border-amber-500/40' : 'bg-red-500/30 text-red-400 border border-red-500/40') : 'bg-slate-700/30 text-slate-500 hover:text-slate-600'">
                        {{ lvl }}
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <div class="flex justify-center">
        <button (click)="save()" class="px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-semibold text-sm hover:shadow-lg transition-all">
          {{ lang.t('maturity.save_assessment') }}
        </button>
      </div>
    </div>
  `
})
export class MaturityModelComponent {
  expandedPillars = new Set<string>(['P1']);

  pillars = [
    { id: 'P1', nameEt: 'I sammas: ICT riskihaldus', nameEn: 'Pillar 1: ICT Risk Management' },
    { id: 'P2', nameEt: 'II sammas: Intsidentide haldus', nameEn: 'Pillar 2: Incident Management' },
    { id: 'P3', nameEt: 'III sammas: Testimine', nameEn: 'Pillar 3: Digital Resilience Testing' },
    { id: 'P4', nameEt: 'IV sammas: Kolmandate osapoolte risk', nameEn: 'Pillar 4: Third-Party Risk' },
    { id: 'P5', nameEt: 'V sammas: Info jagamine', nameEn: 'Pillar 5: Information Sharing' }
  ];

  areas: MaturityArea[] = [
    { id: 'a1', pillar: 'P1', articleRef: 'Art. 5', level: 0, name: { et: 'Juhtimine ja organisatsioon', en: 'Governance & Organisation' }},
    { id: 'a2', pillar: 'P1', articleRef: 'Art. 6', level: 0, name: { et: 'ICT riskihalduse raamistik', en: 'ICT Risk Management Framework' }},
    { id: 'a3', pillar: 'P1', articleRef: 'Art. 7', level: 0, name: { et: 'ICT s\u00fcsteemid ja t\u00f6\u00f6riistad', en: 'ICT Systems & Tools' }},
    { id: 'a4', pillar: 'P1', articleRef: 'Art. 8', level: 0, name: { et: 'Tuvastamine ja kaardistamine', en: 'Identification & Mapping' }},
    { id: 'a5', pillar: 'P1', articleRef: 'Art. 9', level: 0, name: { et: 'Kaitse ja ennetamine', en: 'Protection & Prevention' }},
    { id: 'a6', pillar: 'P1', articleRef: 'Art. 10', level: 0, name: { et: 'Tuvastamine (detekteerimine)', en: 'Detection' }},
    { id: 'a7', pillar: 'P1', articleRef: 'Art. 11-12', level: 0, name: { et: 'Reageerimine ja taastamine', en: 'Response & Recovery' }},
    { id: 'a8', pillar: 'P1', articleRef: 'Art. 13', level: 0, name: { et: '\u00d5ppimine ja areng', en: 'Learning & Evolving' }},
    { id: 'b1', pillar: 'P2', articleRef: 'Art. 17', level: 0, name: { et: 'Intsidendihalduse protsess', en: 'Incident Management Process' }},
    { id: 'b2', pillar: 'P2', articleRef: 'Art. 18', level: 0, name: { et: 'Intsidentide klassifitseerimine', en: 'Incident Classification' }},
    { id: 'b3', pillar: 'P2', articleRef: 'Art. 19', level: 0, name: { et: 'Intsidentide raporteerimise t\u00f6\u00f6voog', en: 'Incident Reporting Workflow' }},
    { id: 'c1', pillar: 'P3', articleRef: 'Art. 24-25', level: 0, name: { et: '\u00dcldine testimisprogramm', en: 'General Testing Programme' }},
    { id: 'c2', pillar: 'P3', articleRef: 'Art. 26-27', level: 0, name: { et: 'TLPT (ohup\u00f5hine l\u00e4bistustest)', en: 'TLPT (Threat-Led Penetration Testing)' }},
    { id: 'd1', pillar: 'P4', articleRef: 'Art. 28', level: 0, name: { et: 'ICT kolmandate osapoolte strateegia', en: 'ICT Third-Party Strategy' }},
    { id: 'd2', pillar: 'P4', articleRef: 'Art. 29', level: 0, name: { et: 'Kontsentratsiooniriski haldamine', en: 'Concentration Risk Management' }},
    { id: 'd3', pillar: 'P4', articleRef: 'Art. 30', level: 0, name: { et: 'Lepingutingimused', en: 'Contractual Requirements' }},
    { id: 'e1', pillar: 'P5', articleRef: 'Art. 45', level: 0, name: { et: 'K\u00fcberohuteavet jagamine', en: 'Cyber Threat Intelligence Sharing' }},
  ];

  constructor(public lang: LangService) {
    if (typeof localStorage === 'undefined') return;
    const saved = localStorage.getItem('dora-maturity-model');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        for (const area of this.areas) {
          if (data[area.id] !== undefined) area.level = data[area.id];
        }
      } catch {}
    }
  }

  togglePillar(id: string) {
    if (this.expandedPillars.has(id)) this.expandedPillars.delete(id);
    else this.expandedPillars.add(id);
  }

  getAreasForPillar(pillarId: string): MaturityArea[] {
    return this.areas.filter(a => a.pillar === pillarId);
  }

  setLevel(area: MaturityArea, level: number) {
    area.level = level;
    this.save();
  }

  averageLevel(): number {
    const sum = this.areas.reduce((s, a) => s + a.level, 0);
    return this.areas.length ? sum / this.areas.length : 0;
  }

  getPillarAverage(pillarId: string): number {
    const areas = this.getAreasForPillar(pillarId);
    const sum = areas.reduce((s, a) => s + a.level, 0);
    return areas.length ? sum / areas.length : 0;
  }

  getMaturityLabel(level: number): string {
    if (level >= 4.5) return this.lang.t('maturity.optimised');
    if (level >= 3.5) return this.lang.t('maturity.managed');
    if (level >= 2.5) return this.lang.t('maturity.defined');
    if (level >= 1.5) return this.lang.t('maturity.developing');
    if (level >= 0.5) return this.lang.t('maturity.initial');
    return this.lang.t('maturity.non_existent');
  }

  save() {
    const data: Record<string, number> = {};
    for (const area of this.areas) data[area.id] = area.level;
    if (typeof localStorage !== 'undefined') localStorage.setItem('dora-maturity-model', JSON.stringify(data));
  }
}
