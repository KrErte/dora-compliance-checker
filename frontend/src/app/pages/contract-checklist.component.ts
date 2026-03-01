import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LangService } from '../lang.service';

interface ChecklistItem {
  id: string;
  articleRef: string;
  requirement: { et: string; en: string };
  description: { et: string; en: string };
  critical: boolean; // required for critical/important functions only
  status: 'yes' | 'partial' | 'no' | 'na' | null;
  notes: string;
}

interface ChecklistSection {
  id: string;
  title: { et: string; en: string };
  items: ChecklistItem[];
}

@Component({
  selector: 'app-contract-checklist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
            </div>
            {{ lang.currentLang === 'et' ? 'DORA Art. 30 lepingu kontrollnimekiri' : 'DORA Art. 30 Contract Checklist' }}
          </h1>
          <p class="text-slate-400 text-sm mt-1">{{ lang.currentLang === 'et' ? 'Kontrollige, kas teie ICT leping sisaldab k\u00f5iki DORA Art. 30 kohustuslikke klausleid' : 'Verify that your ICT contract includes all mandatory DORA Art. 30 clauses' }}</p>
        </div>
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" [(ngModel)]="criticalFunction"
                   class="w-4 h-4 rounded border-slate-600 bg-slate-900 text-violet-500 focus:ring-violet-500">
            {{ lang.currentLang === 'et' ? 'Kriitilise funktsiooni tugi' : 'Critical function support' }}
          </label>
        </div>
      </div>

      <!-- Score overview -->
      <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div class="flex flex-col md:flex-row md:items-center gap-6">
          <!-- Score circle -->
          <div class="relative w-24 h-24 flex-shrink-0">
            <svg class="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke-width="8" fill="none" class="stroke-slate-700"/>
              <circle cx="50" cy="50" r="42" stroke-width="8" fill="none" stroke-linecap="round"
                      [attr.stroke-dasharray]="264"
                      [attr.stroke-dashoffset]="264 - (264 * scorePercent() / 100)"
                      [class]="scorePercent() >= 80 ? 'stroke-emerald-400' : scorePercent() >= 50 ? 'stroke-amber-400' : 'stroke-red-400'"/>
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-xl font-bold text-white">{{ scorePercent() }}%</span>
            </div>
          </div>
          <!-- Stats -->
          <div class="flex-1 grid grid-cols-4 gap-4">
            <div class="text-center">
              <div class="text-xl font-bold text-emerald-400">{{ countByStatus('yes') }}</div>
              <div class="text-xs text-slate-400">{{ lang.currentLang === 'et' ? 'Olemas' : 'Present' }}</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-amber-400">{{ countByStatus('partial') }}</div>
              <div class="text-xs text-slate-400">{{ lang.currentLang === 'et' ? 'Osaline' : 'Partial' }}</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-red-400">{{ countByStatus('no') }}</div>
              <div class="text-xs text-slate-400">{{ lang.currentLang === 'et' ? 'Puudub' : 'Missing' }}</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-slate-400">{{ countByStatus(null) }}</div>
              <div class="text-xs text-slate-400">{{ lang.currentLang === 'et' ? 'Hindamata' : 'Not Assessed' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Checklist sections -->
      @for (section of visibleSections(); track section.id) {
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between cursor-pointer"
               (click)="toggleSection(section.id)">
            <h2 class="text-lg font-semibold text-white">{{ lang.currentLang === 'et' ? section.title.et : section.title.en }}</h2>
            <div class="flex items-center gap-3">
              <span class="text-xs text-slate-400">{{ getSectionScore(section) }}%</span>
              <div class="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all"
                     [style.width.%]="getSectionScore(section)"
                     [class]="getSectionScore(section) >= 80 ? 'bg-emerald-400' : getSectionScore(section) >= 50 ? 'bg-amber-400' : 'bg-red-400'"></div>
              </div>
              <svg class="w-5 h-5 text-slate-400 transition-transform" [class.rotate-180]="expandedSections.has(section.id)"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
          </div>

          @if (expandedSections.has(section.id)) {
            <div class="divide-y divide-slate-700/30">
              @for (item of section.items; track item.id) {
                @if (!item.critical || criticalFunction) {
                  <div class="px-6 py-4 hover:bg-slate-700/20 transition-colors">
                    <div class="flex flex-col md:flex-row md:items-start gap-4">
                      <!-- Requirement text -->
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="px-1.5 py-0.5 rounded text-[10px] font-mono text-violet-400 bg-violet-500/10">{{ item.articleRef }}</span>
                          @if (item.critical) {
                            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-400 bg-amber-500/10">{{ lang.currentLang === 'et' ? 'KRIITILINE' : 'CRITICAL' }}</span>
                          }
                        </div>
                        <h3 class="text-sm font-medium text-white">{{ lang.currentLang === 'et' ? item.requirement.et : item.requirement.en }}</h3>
                        <p class="text-xs text-slate-400 mt-1">{{ lang.currentLang === 'et' ? item.description.et : item.description.en }}</p>
                      </div>

                      <!-- Status buttons -->
                      <div class="flex items-center gap-1.5 flex-shrink-0">
                        <button (click)="setStatus(item, 'yes')" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                [class]="item.status === 'yes' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-700/30 text-slate-500 hover:text-slate-300'">
                          {{ lang.currentLang === 'et' ? 'Jah' : 'Yes' }}
                        </button>
                        <button (click)="setStatus(item, 'partial')" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                [class]="item.status === 'partial' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-700/30 text-slate-500 hover:text-slate-300'">
                          {{ lang.currentLang === 'et' ? 'Osaline' : 'Partial' }}
                        </button>
                        <button (click)="setStatus(item, 'no')" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                [class]="item.status === 'no' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-slate-700/30 text-slate-500 hover:text-slate-300'">
                          {{ lang.currentLang === 'et' ? 'Ei' : 'No' }}
                        </button>
                        <button (click)="setStatus(item, 'na')" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                [class]="item.status === 'na' ? 'bg-slate-500/20 text-slate-300 border border-slate-500/40' : 'bg-slate-700/30 text-slate-500 hover:text-slate-300'">
                          N/A
                        </button>
                      </div>
                    </div>
                    <!-- Notes -->
                    @if (item.status) {
                      <div class="mt-2">
                        <input type="text" [(ngModel)]="item.notes"
                               class="w-full px-3 py-1.5 bg-slate-900/30 border border-slate-700/30 rounded-lg text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-violet-500/30"
                               [placeholder]="lang.currentLang === 'et' ? 'M\u00e4rkmed (valikuline)...' : 'Notes (optional)...'">
                      </div>
                    }
                  </div>
                }
              }
            </div>
          }
        </div>
      }

      <!-- Export button -->
      <div class="flex justify-center">
        <button (click)="exportToLocalStorage()"
                class="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-violet-500/25 transition-all flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
          </svg>
          {{ lang.currentLang === 'et' ? 'Salvesta hinnang' : 'Save Assessment' }}
        </button>
      </div>
    </div>
  `
})
export class ContractChecklistComponent {
  criticalFunction = false;
  expandedSections = new Set<string>();

  sections: ChecklistSection[] = [
    {
      id: 'general',
      title: { et: 'Üldised lepingutingimused (Art. 30(2))', en: 'General Contractual Requirements (Art. 30(2))' },
      items: [
        { id: 'g1', articleRef: 'Art. 30(2)(a)', critical: false, status: null, notes: '',
          requirement: { et: 'Teenuste selge ja terviklik kirjeldus', en: 'Clear and complete description of all services' },
          description: { et: 'Leping peab sisaldama kõigi osutatavate ICT teenuste selget ja terviklikku kirjeldust', en: 'Contract must include clear and complete description of all ICT services provided' }},
        { id: 'g2', articleRef: 'Art. 30(2)(a)', critical: false, status: null, notes: '',
          requirement: { et: 'Teenuste osutamise asukohad', en: 'Locations where services are provided' },
          description: { et: 'Asukohad, kus teenuseid osutatakse ja andmeid töödeldakse/salvestatakse, sh EL/mitte-EL', en: 'Locations where services are provided and data is processed/stored, including EU/non-EU' }},
        { id: 'g3', articleRef: 'Art. 30(2)(b)', critical: false, status: null, notes: '',
          requirement: { et: 'Andmekaitse sätted', en: 'Data protection provisions' },
          description: { et: 'Andmete kättesaadavuse, autentsuse, tervikluse ja konfidentsiaalsuse kaitse sätted', en: 'Provisions for availability, authenticity, integrity, and confidentiality of data' }},
        { id: 'g4', articleRef: 'Art. 30(2)(c)', critical: false, status: null, notes: '',
          requirement: { et: 'Andmete tagastamine lepingu lõppemisel', en: 'Data return upon termination' },
          description: { et: 'Juurdepääs andmetele, taastamine ja tagastamine lepingu lõppemisel ning andmete kustutamine', en: 'Data access, recovery and return upon termination, and data deletion provisions' }},
        { id: 'g5', articleRef: 'Art. 30(2)(d)', critical: false, status: null, notes: '',
          requirement: { et: 'Teenustaseme kirjeldused', en: 'Service level descriptions' },
          description: { et: 'Kvantitatiivsed ja kvalitatiivsed teenustaseme eesmärgid', en: 'Quantitative and qualitative performance targets for service levels' }},
        { id: 'g6', articleRef: 'Art. 30(2)(e)', critical: false, status: null, notes: '',
          requirement: { et: 'Teenusepakkuja kohustus aidata intsidentide korral', en: 'Provider obligation to assist in incidents' },
          description: { et: 'Teenusepakkuja kohustus aidata ICT intsidentide korral ilma lisakuluta või eelnevalt kokkulepitud kuluga', en: 'Provider obligation to assist in case of ICT incidents at no additional cost or pre-agreed cost' }},
        { id: 'g7', articleRef: 'Art. 30(2)(f)', critical: false, status: null, notes: '',
          requirement: { et: 'Koostöökohustus pädevate asutustega', en: 'Cooperation obligation with competent authorities' },
          description: { et: 'Teenusepakkuja kohustus teha koostööd pädevate asutustega', en: 'Provider obligation to cooperate with competent authorities' }},
        { id: 'g8', articleRef: 'Art. 30(2)(g)', critical: false, status: null, notes: '',
          requirement: { et: 'Lõpetamise õigused', en: 'Termination rights' },
          description: { et: 'Lepingu lõpetamise õigused ja minimaalsed etteteatamistähtajad üleminekuperioodiks', en: 'Termination rights and minimum notice periods for transition period' }},
      ]
    },
    {
      id: 'critical',
      title: { et: 'Kriitiliste funktsioonide lisanõuded (Art. 30(3))', en: 'Additional Requirements for Critical Functions (Art. 30(3))' },
      items: [
        { id: 'c1', articleRef: 'Art. 30(3)(a)', critical: true, status: null, notes: '',
          requirement: { et: 'Täpsed teenustaseme kokkulepped (SLA)', en: 'Precise service level agreements (SLAs)' },
          description: { et: 'Täielikud teenustaseme kokkulepped kvantitatiivsete/kvalitatiivsete eesmärkidega', en: 'Full SLAs with precise quantitative and qualitative performance targets' }},
        { id: 'c2', articleRef: 'Art. 30(3)(b)', critical: true, status: null, notes: '',
          requirement: { et: 'Etteteatamistähtajad ja raporteerimiskohustused', en: 'Notice periods and reporting obligations' },
          description: { et: 'Etteteatamistähtajad ja raporteerimiskohustused finantsettevõttele', en: 'Notice periods and reporting obligations to the financial entity' }},
        { id: 'c3', articleRef: 'Art. 30(3)(c)', critical: true, status: null, notes: '',
          requirement: { et: 'Piiramatud juurdepääsu- ja auditiõigused', en: 'Unrestricted access and audit rights' },
          description: { et: 'Piiramatud õigused juurdepääsuks, kontrolliks ja auditeerimiseks finantsettevõtte või kolmanda isiku poolt', en: 'Unrestricted rights of access, inspection and audit by the financial entity or designated third party' }},
        { id: 'c4', articleRef: 'Art. 30(3)(c)', critical: true, status: null, notes: '',
          requirement: { et: 'Regulaatoritele auditeerimise õigus', en: 'Regulatory audit rights' },
          description: { et: 'Piiramatud õigused juurdepääsuks, kontrolliks ja auditeerimiseks pädevate asutuste poolt', en: 'Unrestricted rights of access, inspection and audit by competent authorities' }},
        { id: 'c5', articleRef: 'Art. 30(3)(d)', critical: true, status: null, notes: '',
          requirement: { et: 'Alternatiivsed kindlustusviisid', en: 'Alternative assurance levels' },
          description: { et: 'Õigus kokku leppida alternatiivsetes kindlustusviisides (ühisauditid, kolmanda osapoole sertifikaadid)', en: 'Right to agree on alternative assurance levels (pooled audits, third-party certifications)' }},
        { id: 'c6', articleRef: 'Art. 30(3)(e)', critical: true, status: null, notes: '',
          requirement: { et: 'Väljumisstrateegia', en: 'Exit strategy' },
          description: { et: 'Väljumisstrateegiad piisavate üleminekuperioodidega', en: 'Exit strategies with adequate transition periods' }},
        { id: 'c7', articleRef: 'Art. 30(3)(e)', critical: true, status: null, notes: '',
          requirement: { et: 'Garanteeritud abi üleminekul', en: 'Guaranteed transition assistance' },
          description: { et: 'Teenusepakkuja poolne garanteeritud abi üleminekul teisele pakkujale', en: 'Guaranteed assistance from provider during transition to another provider' }},
        { id: 'c8', articleRef: 'Art. 30(3)(f)', critical: true, status: null, notes: '',
          requirement: { et: 'Turvateadlikkuse programmid', en: 'Security awareness programs' },
          description: { et: 'Osalemine turvateadlikkuse programmides ja koolitustes', en: 'Participation in security awareness programs and training' }},
      ]
    },
    {
      id: 'subcontracting',
      title: { et: 'Allhanke tingimused (Art. 30(2)(a), Art. 29)', en: 'Subcontracting Provisions (Art. 30(2)(a), Art. 29)' },
      items: [
        { id: 's1', articleRef: 'Art. 29(2)', critical: false, status: null, notes: '',
          requirement: { et: 'Allhanke teavituskohustus', en: 'Subcontracting notification obligation' },
          description: { et: 'Kohustus teavitada finantsettevõtet kavandatavast allhankest', en: 'Obligation to notify financial entity of proposed subcontracting' }},
        { id: 's2', articleRef: 'Art. 29(2)', critical: false, status: null, notes: '',
          requirement: { et: 'Allhanke piirangud', en: 'Subcontracting restrictions' },
          description: { et: 'Tingimused allhanke lubamiseks/keelamiseks, sh heakskiitmisõigus', en: 'Conditions for permitting/restricting subcontracting, including approval rights' }},
        { id: 's3', articleRef: 'Art. 29(2)', critical: true, status: null, notes: '',
          requirement: { et: 'Allhankeahela jälgimine', en: 'Subcontracting chain monitoring' },
          description: { et: 'Meetmed allhankeahela jälgimiseks ja riskide hindamiseks', en: 'Measures for monitoring the subcontracting chain and assessing risks' }},
      ]
    },
    {
      id: 'security',
      title: { et: 'Turvalisus ja intsidendid (Art. 30(2)(e-f))', en: 'Security & Incidents (Art. 30(2)(e-f))' },
      items: [
        { id: 'sec1', articleRef: 'Art. 30(2)(e)', critical: false, status: null, notes: '',
          requirement: { et: 'Intsidentidest teavitamise kohustus', en: 'Incident notification obligation' },
          description: { et: 'Teenusepakkuja kohustus teavitada finantsettevõtet ICT intsidentidest', en: 'Provider obligation to notify financial entity of ICT incidents' }},
        { id: 'sec2', articleRef: 'Art. 30(2)(e)', critical: false, status: null, notes: '',
          requirement: { et: 'Äripidevuse sätted', en: 'Business continuity provisions' },
          description: { et: 'Talitluspidevuse ja katastroofitaaste sätted', en: 'Business continuity and disaster recovery provisions' }},
        { id: 'sec3', articleRef: 'Art. 30(2)(f)', critical: false, status: null, notes: '',
          requirement: { et: 'Turvastandardite järgimine', en: 'Security standards compliance' },
          description: { et: 'Kohustus järgida asjakohaseid turvasertifikaate ja standardeid', en: 'Obligation to comply with relevant security certifications and standards' }},
      ]
    }
  ];

  constructor(public lang: LangService) {
    // Load saved state
    const saved = localStorage.getItem('dora-art30-checklist');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        for (const section of this.sections) {
          for (const item of section.items) {
            if (data[item.id]) {
              item.status = data[item.id].status;
              item.notes = data[item.id].notes || '';
            }
          }
        }
      } catch {}
    }

    // Expand first section by default
    this.expandedSections.add('general');
  }

  visibleSections() {
    if (this.criticalFunction) return this.sections;
    return this.sections.map(s => ({
      ...s,
      items: s.items.filter(i => !i.critical)
    })).filter(s => s.items.length > 0);
  }

  toggleSection(id: string) {
    if (this.expandedSections.has(id)) {
      this.expandedSections.delete(id);
    } else {
      this.expandedSections.add(id);
    }
  }

  setStatus(item: ChecklistItem, status: 'yes' | 'partial' | 'no' | 'na') {
    item.status = item.status === status ? null : status;
    this.autoSave();
  }

  private getAllItems(): ChecklistItem[] {
    return this.visibleSections().flatMap(s => s.items);
  }

  scorePercent(): number {
    const items = this.getAllItems().filter(i => i.status && i.status !== 'na');
    if (items.length === 0) return 0;
    const score = items.reduce((sum, i) => {
      if (i.status === 'yes') return sum + 1;
      if (i.status === 'partial') return sum + 0.5;
      return sum;
    }, 0);
    return Math.round((score / items.length) * 100);
  }

  countByStatus(status: string | null): number {
    return this.getAllItems().filter(i => i.status === status).length;
  }

  getSectionScore(section: ChecklistSection): number {
    const items = section.items.filter(i => (!i.critical || this.criticalFunction) && i.status && i.status !== 'na');
    if (items.length === 0) return 0;
    const score = items.reduce((sum, i) => {
      if (i.status === 'yes') return sum + 1;
      if (i.status === 'partial') return sum + 0.5;
      return sum;
    }, 0);
    return Math.round((score / items.length) * 100);
  }

  exportToLocalStorage() {
    this.autoSave();
  }

  private autoSave() {
    const data: any = {};
    for (const section of this.sections) {
      for (const item of section.items) {
        if (item.status) {
          data[item.id] = { status: item.status, notes: item.notes };
        }
      }
    }
    localStorage.setItem('dora-art30-checklist', JSON.stringify(data));
  }
}
