import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LangService } from '../lang.service';
import { MODEL_CLAUSES, ModelClause } from '../data/model-clauses';

interface ClauseSelection {
  clause: ModelClause;
  selected: boolean;
}

@Component({
  selector: 'app-contract-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-4">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          {{ lang.t('generator.badge') }}
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">{{ lang.t('generator.title') }}</h1>
        <p class="text-slate-400 max-w-xl mx-auto">{{ lang.t('generator.subtitle') }}</p>
      </div>

      <!-- Main Content: Split View -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Left: Clause Selection -->
        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-white">{{ lang.t('generator.select_clauses') }}</h2>
            <div class="flex gap-2">
              <button type="button" (click)="selectAll()" class="text-xs text-emerald-400 hover:text-emerald-300">{{ lang.t('generator.select_all') }}</button>
              <span class="text-slate-600">|</span>
              <button type="button" (click)="selectNone()" class="text-xs text-slate-400 hover:text-slate-300">{{ lang.t('generator.select_none') }}</button>
            </div>
          </div>

          <div class="space-y-3">
            @for (item of clauseSelections; track item.clause.id) {
              <label class="flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all"
                     [class]="item.selected ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-700/30 border-slate-600/30 hover:border-slate-500/50'">
                <input type="checkbox" [(ngModel)]="item.selected" class="mt-1 w-5 h-5 rounded border-slate-500 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 bg-slate-700">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium" [class]="item.selected ? 'text-emerald-300' : 'text-slate-300'">
                      {{ item.clause.id }}. {{ lang.currentLang === 'et' ? item.clause.nameEt : item.clause.nameEn }}
                    </span>
                    <span class="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400">{{ item.clause.doraReference }}</span>
                  </div>
                  <p class="text-xs text-slate-500 mt-1 line-clamp-2">
                    {{ lang.currentLang === 'et' ? item.clause.clauseEt : item.clause.clauseEn }}
                  </p>
                </div>
              </label>
            }
          </div>

          <!-- Selection Summary -->
          <div class="mt-6 pt-4 border-t border-slate-700/50">
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-400">{{ lang.t('generator.selected') }}:</span>
              <span class="font-semibold" [class]="selectedCount === 8 ? 'text-emerald-400' : selectedCount > 0 ? 'text-yellow-400' : 'text-red-400'">
                {{ selectedCount }} / 8 {{ lang.t('generator.clauses') }}
              </span>
            </div>
            <div class="mt-2 h-2 rounded-full bg-slate-700 overflow-hidden">
              <div class="h-full rounded-full transition-all duration-300"
                   [style.width.%]="(selectedCount / 8) * 100"
                   [class]="selectedCount === 8 ? 'bg-emerald-500' : selectedCount > 0 ? 'bg-yellow-500' : 'bg-red-500'">
              </div>
            </div>
            <p class="text-xs mt-2" [class]="selectedCount === 8 ? 'text-emerald-400' : 'text-slate-500'">
              {{ selectedCount === 8 ? lang.t('generator.full_compliance') : lang.t('generator.partial_compliance') }}
            </p>
          </div>
        </div>

        <!-- Right: Preview -->
        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-white">{{ lang.t('generator.preview') }}</h2>
            <div class="flex gap-2">
              <button type="button" (click)="downloadPdf()" [disabled]="selectedCount === 0"
                      class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                             bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/25
                             disabled:opacity-50 disabled:cursor-not-allowed">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                {{ lang.t('generator.download_pdf') }}
              </button>
            </div>
          </div>

          <!-- Contract Preview -->
          <div id="contract-preview" class="bg-white rounded-xl p-6 text-slate-900 max-h-[600px] overflow-y-auto">
            @if (selectedCount === 0) {
              <div class="text-center py-12 text-slate-400">
                <svg class="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p class="text-sm">{{ lang.t('generator.empty_preview') }}</p>
              </div>
            } @else {
              <!-- Contract Header -->
              <div class="text-center mb-8 pb-6 border-b-2 border-slate-200">
                <h1 class="text-xl font-bold text-slate-900 uppercase tracking-wide">
                  {{ lang.currentLang === 'et' ? 'IKT TEENUSE OSUTAMISE LEPING' : 'ICT SERVICE PROVISION CONTRACT' }}
                </h1>
                <p class="text-sm text-slate-600 mt-2">
                  {{ lang.currentLang === 'et' ? 'DORA artikkel 30 nõuetele vastav' : 'DORA Article 30 Compliant' }}
                </p>
                <p class="text-xs text-slate-400 mt-1">{{ today }}</p>
              </div>

              <!-- Contract Clauses -->
              <div class="space-y-6">
                @for (item of selectedClauses; track item.clause.id; let idx = $index) {
                  <div class="pb-4" [class.border-b]="idx < selectedClauses.length - 1" [class.border-slate-200]="idx < selectedClauses.length - 1">
                    <h2 class="text-sm font-bold text-slate-900 uppercase mb-3">
                      {{ idx + 1 }}. {{ lang.currentLang === 'et' ? item.clause.nameEt : item.clause.nameEn }}
                      <span class="text-xs font-normal text-cyan-600 ml-2">{{ item.clause.doraReference }}</span>
                    </h2>
                    <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{{ lang.currentLang === 'et' ? item.clause.clauseEt : item.clause.clauseEn }}</p>
                  </div>
                }
              </div>

              <!-- Contract Footer -->
              <div class="mt-8 pt-6 border-t-2 border-slate-200">
                <div class="grid grid-cols-2 gap-8">
                  <div>
                    <p class="text-xs text-slate-500 uppercase mb-2">{{ lang.currentLang === 'et' ? 'Tellija' : 'Client' }}</p>
                    <div class="border-b border-slate-300 pb-8 mb-2"></div>
                    <p class="text-xs text-slate-400">{{ lang.currentLang === 'et' ? 'Nimi, allkiri, kuupäev' : 'Name, signature, date' }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-slate-500 uppercase mb-2">{{ lang.currentLang === 'et' ? 'Teenusepakkuja' : 'Service Provider' }}</p>
                    <div class="border-b border-slate-300 pb-8 mb-2"></div>
                    <p class="text-xs text-slate-400">{{ lang.currentLang === 'et' ? 'Nimi, allkiri, kuupäev' : 'Name, signature, date' }}</p>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Action Buttons -->
          <div class="mt-6 flex flex-wrap gap-3">
            <button type="button" (click)="analyzeContract()" [disabled]="selectedCount === 0 || analyzing"
                    class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all
                           bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 hover:shadow-lg hover:shadow-emerald-500/25
                           disabled:opacity-50 disabled:cursor-not-allowed">
              @if (analyzing) {
                <div class="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                {{ lang.t('generator.analyzing') }}
              } @else {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
                {{ lang.t('generator.analyze_contract') }}
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    input[type="checkbox"] {
      cursor: pointer;
    }
    input[type="checkbox"]:checked {
      background-color: #10b981;
      border-color: #10b981;
    }
  `]
})
export class ContractGeneratorComponent {
  clauseSelections: ClauseSelection[] = [];
  analyzing = false;
  today = new Date().toLocaleDateString('et-EE');

  constructor(public lang: LangService, private router: Router) {
    this.clauseSelections = MODEL_CLAUSES.map(clause => ({
      clause,
      selected: true // Default: all selected
    }));
  }

  get selectedCount(): number {
    return this.clauseSelections.filter(c => c.selected).length;
  }

  get selectedClauses(): ClauseSelection[] {
    return this.clauseSelections.filter(c => c.selected);
  }

  selectAll(): void {
    this.clauseSelections.forEach(c => c.selected = true);
  }

  selectNone(): void {
    this.clauseSelections.forEach(c => c.selected = false);
  }

  downloadPdf(): void {
    const isEt = this.lang.currentLang === 'et';

    let html = `<!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <title>${isEt ? 'IKT Teenuse Osutamise Leping' : 'ICT Service Provision Contract'}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', serif; padding: 50px; color: #1a1a1a; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #333; }
        .header h1 { font-size: 18px; letter-spacing: 2px; margin-bottom: 10px; }
        .header p { font-size: 12px; color: #666; }
        .clause { margin-bottom: 25px; }
        .clause h2 { font-size: 12px; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .clause h2 span { color: #0891b2; font-weight: normal; margin-left: 10px; }
        .clause p { font-size: 11px; text-align: justify; }
        .footer { margin-top: 50px; padding-top: 30px; border-top: 2px solid #333; }
        .signatures { display: flex; justify-content: space-between; margin-top: 20px; }
        .signature-box { width: 45%; }
        .signature-box p { font-size: 10px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
        .signature-line { border-bottom: 1px solid #333; height: 60px; margin-bottom: 5px; }
        .signature-note { font-size: 9px; color: #999; }
        @media print { body { padding: 20px; } }
      </style>
    </head><body>`;

    html += `<div class="header">
      <h1>${isEt ? 'IKT TEENUSE OSUTAMISE LEPING' : 'ICT SERVICE PROVISION CONTRACT'}</h1>
      <p>${isEt ? 'DORA artikkel 30 nõuetele vastav' : 'DORA Article 30 Compliant'}</p>
      <p>${this.today}</p>
    </div>`;

    this.selectedClauses.forEach((item, idx) => {
      html += `<div class="clause">
        <h2>${idx + 1}. ${isEt ? item.clause.nameEt : item.clause.nameEn} <span>${item.clause.doraReference}</span></h2>
        <p>${isEt ? item.clause.clauseEt : item.clause.clauseEn}</p>
      </div>`;
    });

    html += `<div class="footer">
      <div class="signatures">
        <div class="signature-box">
          <p>${isEt ? 'Tellija' : 'Client'}</p>
          <div class="signature-line"></div>
          <p class="signature-note">${isEt ? 'Nimi, allkiri, kuupäev' : 'Name, signature, date'}</p>
        </div>
        <div class="signature-box">
          <p>${isEt ? 'Teenusepakkuja' : 'Service Provider'}</p>
          <div class="signature-line"></div>
          <p class="signature-note">${isEt ? 'Nimi, allkiri, kuupäev' : 'Name, signature, date'}</p>
        </div>
      </div>
    </div>`;

    html += `</body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 300);
    }
  }

  analyzeContract(): void {
    this.analyzing = true;
    const isEt = this.lang.currentLang === 'et';

    // Generate contract text
    let contractText = `${isEt ? 'IKT TEENUSE OSUTAMISE LEPING\n\n' : 'ICT SERVICE PROVISION CONTRACT\n\n'}`;

    this.selectedClauses.forEach((item, idx) => {
      contractText += `${idx + 1}. ${isEt ? item.clause.nameEt : item.clause.nameEn}\n`;
      contractText += `${isEt ? item.clause.clauseEt : item.clause.clauseEn}\n\n`;
    });

    // Create a Blob and File from the contract text
    const blob = new Blob([contractText], { type: 'text/plain' });
    const file = new File([blob], 'generated-contract.txt', { type: 'text/plain' });

    // Store in sessionStorage for the analysis page to pick up
    sessionStorage.setItem('generatedContract', contractText);
    sessionStorage.setItem('generatedContractName', isEt ? 'Genereeritud DORA leping' : 'Generated DORA Contract');

    // Navigate to contract analysis with flag
    setTimeout(() => {
      this.router.navigate(['/contract-analysis'], { queryParams: { generated: 'true' } });
    }, 500);
  }
}
