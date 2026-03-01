import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LangService } from '../lang.service';

interface AuditEntry {
  timestamp: string;
  action: string;
  category: string;
  details: string;
}

@Component({
  selector: 'app-audit-trail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-zinc-500 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            {{ lang.currentLang === 'et' ? 'Auditirada' : 'Audit Trail' }}
          </h1>
          <p class="text-slate-400 text-sm mt-1">{{ lang.currentLang === 'et' ? 'Eksporditav tegevuslogi regulaatoritele' : 'Exportable activity log for regulators' }}</p>
        </div>
        <button (click)="exportCsv()" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-slate-500 to-zinc-500 text-white font-semibold text-sm hover:shadow-lg transition-all flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          {{ lang.currentLang === 'et' ? 'Ekspordi CSV' : 'Export CSV' }}
        </button>
      </div>

      <!-- Summary -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        @for (cat of categories; track cat.key) {
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-white">{{ countByCategory(cat.key) }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.currentLang === 'et' ? cat.labelEt : cat.labelEn }}</div>
          </div>
        }
      </div>

      <!-- Trail entries -->
      <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div class="divide-y divide-slate-700/30">
          @for (entry of entries(); track $index) {
            <div class="px-6 py-3 flex items-center gap-4">
              <div class="text-xs text-slate-500 w-36 flex-shrink-0 font-mono">{{ entry.timestamp }}</div>
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700/50 text-slate-300 flex-shrink-0">{{ entry.category }}</span>
              <div class="flex-1 text-sm text-white">{{ entry.action }}</div>
              <div class="text-xs text-slate-400 truncate max-w-[200px]">{{ entry.details }}</div>
            </div>
          }
          @if (entries().length === 0) {
            <div class="px-6 py-12 text-center text-slate-400">
              {{ lang.currentLang === 'et' ? 'Tegevusi pole registreeritud' : 'No activities recorded' }}
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class AuditTrailComponent implements OnInit {
  entries = signal<AuditEntry[]>([]);

  categories = [
    { key: 'ASSESSMENT', labelEt: 'Hindamised', labelEn: 'Assessments' },
    { key: 'CONTRACT', labelEt: 'Lepingud', labelEn: 'Contracts' },
    { key: 'EXPORT', labelEt: 'Ekspordid', labelEn: 'Exports' },
    { key: 'OTHER', labelEt: 'Muu', labelEn: 'Other' }
  ];

  constructor(public lang: LangService) {}

  ngOnInit() {
    if (typeof localStorage === 'undefined') return;
    // Build audit trail from localStorage activity
    const entries: AuditEntry[] = [];
    const now = new Date().toISOString();

    // Check assessments
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('assessment_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key)!);
          entries.push({ timestamp: data.assessmentDate || now, action: `Assessment completed: ${data.companyName}`, category: 'ASSESSMENT', details: `Score: ${data.scorePercentage}%` });
        } catch {}
      }
      if (key.startsWith('contract_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key)!);
          entries.push({ timestamp: data.analysisDate || now, action: `Contract analyzed: ${data.contractName}`, category: 'CONTRACT', details: `Score: ${data.scorePercentage}%` });
        } catch {}
      }
    }

    // Check other stored data
    if (localStorage.getItem('dora-art30-checklist')) entries.push({ timestamp: now, action: 'Art. 30 checklist saved', category: 'OTHER', details: 'Contract clause assessment' });
    if (localStorage.getItem('dora-maturity-model')) entries.push({ timestamp: now, action: 'Maturity model updated', category: 'OTHER', details: 'Maturity assessment' });
    if (localStorage.getItem('dora-training-records')) entries.push({ timestamp: now, action: 'Training records updated', category: 'OTHER', details: 'Training tracker' });
    if (localStorage.getItem('dora-exit-strategies')) entries.push({ timestamp: now, action: 'Exit strategies updated', category: 'OTHER', details: 'Exit strategy plans' });

    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    this.entries.set(entries);
  }

  countByCategory(category: string): number {
    return this.entries().filter(e => e.category === category).length;
  }

  exportCsv() {
    const header = 'Timestamp,Category,Action,Details\n';
    const rows = this.entries().map(e =>
      `"${e.timestamp}","${e.category}","${e.action}","${e.details}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dora-audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
