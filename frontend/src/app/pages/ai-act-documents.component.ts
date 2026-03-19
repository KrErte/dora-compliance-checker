import { Component, inject, signal, computed, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LangService } from '../lang.service';

interface AiActDocument {
  id: string;
  aiSystemId: string;
  title: string;
  documentType: string;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

type DocumentType =
  | 'FRIA'
  | 'TECHNICAL_DOC'
  | 'RISK_MANAGEMENT'
  | 'HUMAN_OVERSIGHT'
  | 'DATA_GOVERNANCE'
  | 'CONFORMITY_DECLARATION'
  | 'POST_MARKET_MONITORING'
  | 'TRANSPARENCY_NOTICE';

interface DocTypeOption {
  value: DocumentType;
  labelEt: string;
  labelEn: string;
  icon: string;
}

@Component({
  selector: 'app-ai-act-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in-up">
        <div>
          <h1 class="text-3xl font-bold mb-1">
            <span class="gradient-text">{{ lang.l('AI akti dokumendid', 'AI Act Documents') }}</span>
          </h1>
          <p class="text-slate-400 text-sm">
            {{ lang.l('Genereeri ja halda vastavusdokumente oma AI susteemile', 'Generate and manage compliance documents for your AI system') }}
          </p>
        </div>

        <!-- Generate New Button -->
        <div class="relative">
          <button type="button" (click)="toggleDropdown()"
                  class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                         bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400
                         text-slate-900 hover:shadow-lg hover:shadow-emerald-500/25">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            {{ lang.l('Genereeri uus', 'Generate New') }}
            <svg class="w-4 h-4 transition-transform duration-200" [class.rotate-180]="showDropdown()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          <!-- Document Type Dropdown -->
          @if (showDropdown()) {
            <div class="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700/50 rounded-xl shadow-2xl shadow-black/30 z-50 overflow-hidden animate-fade-in">
              <div class="p-2">
                <p class="text-xs uppercase tracking-wider text-slate-500 font-medium px-3 py-2">
                  {{ lang.l('Vali dokumendi tuup', 'Select Document Type') }}
                </p>
                @for (docType of documentTypes; track docType.value) {
                  <button type="button" (click)="selectDocType(docType.value)"
                          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all
                                 hover:bg-slate-700/50 text-slate-300 hover:text-white group">
                    <span class="text-lg shrink-0">{{ docType.icon }}</span>
                    <span class="font-medium">{{ lang.l(docType.labelEt, docType.labelEn) }}</span>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Generate Dialog (additional context) -->
      @if (selectedDocType()) {
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-8 animate-fade-in-up">
          <h2 class="text-lg font-semibold text-white mb-1">
            {{ lang.l('Genereeri dokument', 'Generate Document') }}
          </h2>
          <p class="text-xs text-slate-500 mb-5">
            {{ getDocTypeLabel(selectedDocType()!) }}
          </p>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1.5">
              {{ lang.l('Lisakontekst (valikuline)', 'Additional Context (optional)') }}
            </label>
            <textarea [(ngModel)]="additionalContext" rows="3"
                      class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm
                             placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all resize-none"
                      [placeholder]="lang.l('Lisa spetsiifilist konteksti dokumendi genereerimiseks...', 'Add specific context for document generation...')">
            </textarea>
          </div>

          <div class="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-slate-700/50">
            <button type="button" (click)="cancelGenerate()"
                    class="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all">
              {{ lang.l('Tuhista', 'Cancel') }}
            </button>
            <button type="button" (click)="generateDocument()" [disabled]="generating()"
                    class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                           bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400
                           text-slate-900 hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed">
              @if (generating()) {
                <div class="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
              }
              {{ lang.l('Genereeri', 'Generate') }}
            </button>
          </div>
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="text-center py-20 animate-fade-in">
          <div class="inline-block w-10 h-10 border-4 border-slate-700 border-t-emerald-400 rounded-full animate-spin"></div>
          <p class="text-slate-500 text-sm mt-4">{{ lang.l('Laadin dokumente...', 'Loading documents...') }}</p>
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-6 animate-fade-in">
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-sm text-red-300">{{ error() }}</p>
          </div>
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && !error() && documents().length === 0) {
        <div class="text-center py-20 animate-fade-in-up">
          <div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center">
            <svg class="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-white mb-2">{{ lang.l('Dokumente ei leitud', 'No Documents Found') }}</h3>
          <p class="text-slate-400 text-sm max-w-md mx-auto mb-6">
            {{ lang.l('Genereerige oma esimene vastavusdokument, vajutades nuppu "Genereeri uus".',
                       'Generate your first compliance document by clicking the "Generate New" button.') }}
          </p>
        </div>
      }

      <!-- Documents Table -->
      @if (!loading() && documents().length > 0) {
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden animate-fade-in-up">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-slate-700/50">
                  <th class="text-left text-xs uppercase tracking-wider text-slate-500 font-medium px-5 py-3.5">
                    {{ lang.l('Pealkiri', 'Title') }}
                  </th>
                  <th class="text-left text-xs uppercase tracking-wider text-slate-500 font-medium px-5 py-3.5">
                    {{ lang.l('Tuup', 'Type') }}
                  </th>
                  <th class="text-left text-xs uppercase tracking-wider text-slate-500 font-medium px-5 py-3.5">
                    {{ lang.l('Staatus', 'Status') }}
                  </th>
                  <th class="text-left text-xs uppercase tracking-wider text-slate-500 font-medium px-5 py-3.5">
                    {{ lang.l('Kuupaev', 'Date') }}
                  </th>
                  <th class="text-right text-xs uppercase tracking-wider text-slate-500 font-medium px-5 py-3.5">
                    {{ lang.l('Tegevused', 'Actions') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                @for (doc of documents(); track doc.id) {
                  <tr class="border-b border-slate-700/20 hover:bg-slate-700/20 transition-colors cursor-pointer"
                      (click)="toggleDocView(doc.id)">
                    <!-- Title -->
                    <td class="px-5 py-4">
                      <p class="text-sm font-medium text-white">{{ doc.title }}</p>
                    </td>

                    <!-- Type Badge -->
                    <td class="px-5 py-4">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium"
                            [class]="getDocTypeBadgeClass(doc.documentType)">
                        {{ getDocTypeLabel(doc.documentType) }}
                      </span>
                    </td>

                    <!-- Status -->
                    <td class="px-5 py-4">
                      @if (doc.status === 'GENERATING') {
                        <span class="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400">
                          <div class="w-3.5 h-3.5 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin"></div>
                          {{ lang.l('Genereerimine...', 'Generating...') }}
                        </span>
                      } @else if (doc.status === 'COMPLETED') {
                        <span class="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                          </svg>
                          {{ lang.l('Valmis', 'Completed') }}
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-1.5 text-xs font-medium text-red-400">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                          {{ lang.l('Ebaonnestunud', 'Failed') }}
                        </span>
                      }
                    </td>

                    <!-- Date -->
                    <td class="px-5 py-4">
                      <span class="text-xs text-slate-500">{{ formatDate(doc.createdAt) }}</span>
                    </td>

                    <!-- Actions -->
                    <td class="px-5 py-4">
                      <div class="flex items-center justify-end gap-1.5" (click)="$event.stopPropagation()">
                        @if (doc.status === 'COMPLETED') {
                          <button type="button" (click)="exportPdf(doc.id)"
                                  class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                  [title]="lang.l('Ekspordi PDF', 'Export PDF')">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                          </button>
                        }
                        <button type="button" (click)="deleteDocument(doc.id)"
                                class="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                [title]="lang.l('Kustuta', 'Delete')">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>

                  <!-- Expanded Content View -->
                  @if (viewingDocId() === doc.id && doc.status === 'COMPLETED' && doc.content) {
                    <tr>
                      <td colspan="5" class="px-5 py-0">
                        <div class="bg-slate-900/70 border border-slate-700/30 rounded-lg mb-4 animate-fade-in">
                          <div class="flex items-center justify-between px-4 py-3 border-b border-slate-700/30">
                            <h4 class="text-sm font-medium text-slate-300">
                              {{ lang.l('Dokumendi sisu', 'Document Content') }}
                            </h4>
                            <button type="button" (click)="toggleDocView(doc.id)"
                                    class="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-700/50 transition-all">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                            </button>
                          </div>
                          <div class="p-4 max-h-96 overflow-y-auto">
                            <pre class="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">{{ doc.content }}</pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>

    <!-- Backdrop for dropdown -->
    @if (showDropdown()) {
      <div class="fixed inset-0 z-40" (click)="showDropdown.set(false)"></div>
    }
  `
})
export class AiActDocumentsComponent implements OnInit, OnDestroy {
  lang = inject(LangService);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  documents = signal<AiActDocument[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  generating = signal(false);
  showDropdown = signal(false);
  selectedDocType = signal<DocumentType | null>(null);
  additionalContext = '';
  viewingDocId = signal<string | null>(null);
  exporting = signal(false);

  private aiSystemId = '';
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  documentTypes: DocTypeOption[] = [
    { value: 'FRIA', labelEt: 'Pohi oiguste mojuhinnang', labelEn: 'Fundamental Rights Impact Assessment', icon: '\u{1F3DB}' },
    { value: 'TECHNICAL_DOC', labelEt: 'Tehniline dokumentatsioon', labelEn: 'Technical Documentation', icon: '\u{1F4CB}' },
    { value: 'RISK_MANAGEMENT', labelEt: 'Riskijuhtimise susteem', labelEn: 'Risk Management System', icon: '\u{26A0}' },
    { value: 'HUMAN_OVERSIGHT', labelEt: 'Inimjarelevalve', labelEn: 'Human Oversight', icon: '\u{1F441}' },
    { value: 'DATA_GOVERNANCE', labelEt: 'Andmehaldus', labelEn: 'Data Governance', icon: '\u{1F4CA}' },
    { value: 'CONFORMITY_DECLARATION', labelEt: 'Vastavusdeklaratsioon', labelEn: 'Conformity Declaration', icon: '\u{2705}' },
    { value: 'POST_MARKET_MONITORING', labelEt: 'Turujargne jarelevale', labelEn: 'Post-Market Monitoring', icon: '\u{1F50D}' },
    { value: 'TRANSPARENCY_NOTICE', labelEt: 'Laipaistvusteade', labelEn: 'Transparency Notice', icon: '\u{1F4E2}' }
  ];

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.aiSystemId = params['id'];
        this.loadDocuments();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  loadDocuments(): void {
    if (!this.aiSystemId) return;
    this.loading.set(true);
    this.error.set(null);
    this.http.get<AiActDocument[]>(`/api/ai-systems/${this.aiSystemId}/documents`).subscribe({
      next: (data) => {
        this.documents.set(data);
        this.loading.set(false);
        this.checkAndStartPolling();
      },
      error: (err) => {
        this.error.set(err?.error?.message || this.lang.l('Dokumentide laadimine ebaonnestus', 'Failed to load documents'));
        this.loading.set(false);
      }
    });
  }

  toggleDropdown(): void {
    this.showDropdown.update(v => !v);
  }

  selectDocType(type: DocumentType): void {
    this.selectedDocType.set(type);
    this.showDropdown.set(false);
    this.additionalContext = '';
  }

  cancelGenerate(): void {
    this.selectedDocType.set(null);
    this.additionalContext = '';
  }

  generateDocument(): void {
    const docType = this.selectedDocType();
    if (!docType || !this.aiSystemId) return;

    this.generating.set(true);
    const body: any = { documentType: docType };
    if (this.additionalContext.trim()) {
      body.additionalContext = this.additionalContext.trim();
    }

    this.http.post<AiActDocument>(`/api/ai-systems/${this.aiSystemId}/documents/generate`, body).subscribe({
      next: (created) => {
        this.documents.update(list => [created, ...list]);
        this.selectedDocType.set(null);
        this.additionalContext = '';
        this.generating.set(false);
        this.checkAndStartPolling();
      },
      error: (err) => {
        this.error.set(err?.error?.message || this.lang.l('Dokumendi genereerimine ebaonnestus', 'Failed to generate document'));
        this.generating.set(false);
      }
    });
  }

  deleteDocument(docId: string): void {
    const confirmMsg = this.lang.l('Kas oled kindel, et soovid selle dokumendi kustutada?', 'Are you sure you want to delete this document?');
    if (!confirm(confirmMsg)) return;

    this.http.delete(`/api/ai-systems/${this.aiSystemId}/documents/${docId}`).subscribe({
      next: () => {
        this.documents.update(list => list.filter(d => d.id !== docId));
        if (this.viewingDocId() === docId) {
          this.viewingDocId.set(null);
        }
      },
      error: (err) => {
        this.error.set(err?.error?.message || this.lang.l('Kustutamine ebaonnestus', 'Failed to delete document'));
      }
    });
  }

  toggleDocView(docId: string): void {
    if (this.viewingDocId() === docId) {
      this.viewingDocId.set(null);
    } else {
      this.viewingDocId.set(docId);
    }
  }

  exportPdf(docId: string): void {
    this.exporting.set(true);
    this.http.get(`/api/ai-systems/${this.aiSystemId}/documents/${docId}/export/pdf`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `document-${docId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: (err) => {
        this.error.set(this.lang.l('PDF eksport ebaonnestus', 'PDF export failed'));
        this.exporting.set(false);
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getDocTypeLabel(type: string): string {
    const found = this.documentTypes.find(dt => dt.value === type);
    if (!found) return type;
    return this.lang.l(found.labelEt, found.labelEn);
  }

  getDocTypeBadgeClass(type: string): string {
    switch (type) {
      case 'FRIA':
        return 'bg-purple-500/15 text-purple-400 border border-purple-500/20';
      case 'TECHNICAL_DOC':
        return 'bg-blue-500/15 text-blue-400 border border-blue-500/20';
      case 'RISK_MANAGEMENT':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
      case 'HUMAN_OVERSIGHT':
        return 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20';
      case 'DATA_GOVERNANCE':
        return 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20';
      case 'CONFORMITY_DECLARATION':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
      case 'POST_MARKET_MONITORING':
        return 'bg-orange-500/15 text-orange-400 border border-orange-500/20';
      case 'TRANSPARENCY_NOTICE':
        return 'bg-pink-500/15 text-pink-400 border border-pink-500/20';
      default:
        return 'bg-slate-700/50 text-slate-300 border border-slate-600/30';
    }
  }

  // --- Polling for GENERATING documents ---

  private checkAndStartPolling(): void {
    const hasGenerating = this.documents().some(d => d.status === 'GENERATING');
    if (hasGenerating && !this.pollTimer) {
      this.startPolling();
    } else if (!hasGenerating && this.pollTimer) {
      this.stopPolling();
    }
  }

  private startPolling(): void {
    this.pollTimer = setInterval(() => {
      this.pollGeneratingDocuments();
    }, 5000);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private pollGeneratingDocuments(): void {
    if (!this.aiSystemId) return;
    this.http.get<AiActDocument[]>(`/api/ai-systems/${this.aiSystemId}/documents`).subscribe({
      next: (data) => {
        this.documents.set(data);
        this.checkAndStartPolling();
      },
      error: () => {
        // Silently ignore poll errors
      }
    });
  }
}
