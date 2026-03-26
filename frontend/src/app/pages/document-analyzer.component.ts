import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';
import { AuthService } from '../auth/auth.service';
import { SubscriptionService } from '../services/subscription.service';
import { DocumentParserService, UnsupportedFileTypeError, FileTooLargeError } from '../services/document-parser.service';
import { DoraComplianceCheckerService } from '../services/dora-compliance-checker.service';
import { NetworkMonitorService } from '../services/network-monitor.service';
import { AiAnalysisService } from '../services/ai-analysis.service';
import { ParsedDocument, DoraComplianceResult, DoraCheck, AiAnalysisResult, DoraAnalysisType } from '../models/parsed-document.model';

type State = 'upload' | 'parsing' | 'results';

@Component({
  selector: 'app-document-analyzer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Zero-Upload Badge (always visible) -->
    <div class="max-w-5xl mx-auto px-4 pt-6">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium cursor-help"
           [title]="lang.l('Teie dokumendid töödeldakse ainult teie brauseris. Me ei salvesta ega näe teie faile.',
                          'Your documents are processed only in your browser. We never store or see your files.')">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        Zero-Upload Architecture
      </div>
    </div>

    <!-- UPLOAD STATE -->
    <div *ngIf="state() === 'upload'" class="max-w-3xl mx-auto px-4 py-10 animate-fade-in">
      <div class="text-center mb-10">
        <h1 class="text-3xl font-bold text-slate-800 mb-3">
          {{ lang.l('DORA dokumendianalüüs', 'DORA Document Analysis') }}
        </h1>
        <p class="text-slate-500 max-w-xl mx-auto">
          {{ lang.l('Laadige üles oma DORA vastavusdokument. Analüüs toimub 100% teie brauseris — fail ei lahku teie seadmest.',
                     'Upload your DORA compliance document. Analysis runs 100% in your browser — the file never leaves your device.') }}
        </p>
      </div>

      <!-- Drop Zone -->
      <div class="border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer"
           [class]="dragOver() ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'"
           (dragover)="onDragOver($event)" (dragleave)="dragOver.set(false)"
           (drop)="onDrop($event)" (click)="fileInput.click()">
        <input #fileInput type="file" class="hidden"
               [accept]="supportedExtensions.join(',')"
               (change)="onFileSelected($event)">

        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
        </div>

        <p class="text-slate-700 font-medium mb-1">
          {{ lang.l('Lohistage fail siia või klõpsake', 'Drag & drop your file here or click to browse') }}
        </p>
        <p class="text-slate-400 text-sm">
          PDF, DOCX, XLSX, CSV, TXT — {{ lang.l('max 50 MB', 'max 50 MB') }}
        </p>
      </div>

      <!-- Error message -->
      <div *ngIf="error()" class="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
        <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {{ error() }}
      </div>

      <!-- How it works -->
      <div class="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white border border-slate-200 rounded-xl p-5 text-center">
          <div class="w-10 h-10 mx-auto mb-3 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
          <p class="text-sm font-medium text-slate-700">{{ lang.l('Laadige fail üles', 'Upload your file') }}</p>
          <p class="text-xs text-slate-400 mt-1">{{ lang.l('Fail jääb brauserisse', 'File stays in your browser') }}</p>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl p-5 text-center">
          <div class="w-10 h-10 mx-auto mb-3 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">2</div>
          <p class="text-sm font-medium text-slate-700">{{ lang.l('Automaatne analüüs', 'Automatic analysis') }}</p>
          <p class="text-xs text-slate-400 mt-1">{{ lang.l('10 DORA artiklit kontrollitakse', '10 DORA articles checked') }}</p>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl p-5 text-center">
          <div class="w-10 h-10 mx-auto mb-3 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">3</div>
          <p class="text-sm font-medium text-slate-700">{{ lang.l('Tulemused koheselt', 'Instant results') }}</p>
          <p class="text-xs text-slate-400 mt-1">{{ lang.l('Lüngad ja soovitused', 'Gaps & recommendations') }}</p>
        </div>
      </div>
    </div>

    <!-- PARSING STATE -->
    <div *ngIf="state() === 'parsing'" class="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
      <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-blue-50 flex items-center justify-center">
        <svg class="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <h2 class="text-xl font-bold text-slate-800 mb-2">
        {{ lang.l('Dokument töödeldakse teie brauseris...', 'Processing document in your browser...') }}
      </h2>
      <p class="text-slate-500 text-sm mb-4">{{ selectedFileName() }}</p>

      <!-- Progress bar -->
      <div class="w-full max-w-md mx-auto h-2 bg-slate-100 rounded-full overflow-hidden">
        <div class="h-full bg-blue-600 rounded-full transition-all duration-500"
             [style.width.%]="parseProgress()"></div>
      </div>
      <p class="text-xs text-slate-400 mt-2">{{ parseStage() }}</p>
    </div>

    <!-- RESULTS STATE -->
    <div *ngIf="state() === 'results' && complianceResult()" class="max-w-5xl mx-auto px-4 py-8 animate-fade-in">

      <!-- Success banner -->
      <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3">
        <svg class="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
        </svg>
        <div>
          <p class="text-sm font-medium text-emerald-800">
            {{ lang.l('Analüüs lõpetatud — dokument jäi teie seadmesse', 'Analysis complete — document stayed on your device') }}
          </p>
          <p class="text-xs text-emerald-600">{{ complianceResult()!.documentName }}</p>
        </div>
      </div>

      <!-- Network Monitor Widget -->
      <div class="bg-white border border-slate-200 rounded-xl p-4 mb-6">
        <div class="flex flex-wrap items-center gap-4 text-sm">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full" [class]="networkMonitor.isSafe() ? 'bg-emerald-500' : 'bg-amber-500'"></span>
            <span class="text-slate-600">
              {{ lang.l('Faile saadetud serverisse:', 'Files sent to server:') }}
              <strong class="text-slate-800">{{ networkMonitor.filesSent() }}</strong>
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-slate-600">
              {{ lang.l('Teksti saadetud AI-le:', 'Text sent to AI:') }}
              <strong class="text-slate-800">{{ networkMonitor.formatBytes(networkMonitor.textBytesSent()) }}</strong>
            </span>
          </div>
          <div *ngIf="networkMonitor.isSafe()" class="flex items-center gap-1.5 text-emerald-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            {{ lang.l('Teie dokument on ainult teie brauseris', 'Your document is only in your browser') }}
          </div>
        </div>
      </div>

      <!-- Score Overview -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white border border-slate-200 rounded-xl p-5 text-center">
          <div class="text-3xl font-bold" [class]="scoreColor()">{{ complianceResult()!.overallScore }}%</div>
          <p class="text-xs text-slate-500 mt-1">{{ lang.l('Üldskoor', 'Overall Score') }}</p>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl p-5 text-center">
          <div class="text-3xl font-bold text-emerald-600">{{ complianceResult()!.summary.passed }}</div>
          <p class="text-xs text-slate-500 mt-1">{{ lang.l('Läbitud', 'Passed') }}</p>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl p-5 text-center">
          <div class="text-3xl font-bold text-amber-600">{{ complianceResult()!.summary.partial }}</div>
          <p class="text-xs text-slate-500 mt-1">{{ lang.l('Osaline', 'Partial') }}</p>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl p-5 text-center">
          <div class="text-3xl font-bold text-red-600">{{ complianceResult()!.summary.failed }}</div>
          <p class="text-xs text-slate-500 mt-1">{{ lang.l('Puudub', 'Missing') }}</p>
        </div>
      </div>

      <!-- DORA Article Checks -->
      <div class="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6">
        <div class="px-5 py-4 border-b border-slate-100">
          <h3 class="font-semibold text-slate-800">{{ lang.l('DORA artiklite kontroll', 'DORA Article Checks') }}</h3>
        </div>
        <div class="divide-y divide-slate-100">
          <div *ngFor="let check of complianceResult()!.checks" class="px-5 py-4">
            <div class="flex items-start gap-3">
              <!-- Status icon -->
              <div class="mt-0.5 shrink-0">
                <div *ngIf="check.found && check.gaps.length === 0" class="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                </div>
                <div *ngIf="check.found && check.gaps.length > 0" class="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg class="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                </div>
                <div *ngIf="!check.found" class="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                  <svg class="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{{ check.article }}</span>
                  <span class="font-medium text-slate-800 text-sm">{{ check.title }}</span>
                </div>
                <div *ngIf="check.gaps.length > 0" class="mt-1">
                  <p class="text-xs text-slate-500 mb-1">{{ lang.l('Puuduvad elemendid:', 'Missing elements:') }}</p>
                  <div class="flex flex-wrap gap-1">
                    <span *ngFor="let gap of check.gaps" class="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                      {{ gap }}
                    </span>
                  </div>
                </div>
                <p *ngIf="check.found && check.gaps.length === 0" class="text-xs text-emerald-600 mt-1">
                  {{ lang.l('Kõik nõutud elemendid leitud', 'All required elements found') }}
                </p>
                <p *ngIf="!check.found" class="text-xs text-red-500 mt-1">
                  {{ lang.l('Seda valdkonda dokumendis ei käsitleta', 'This area is not addressed in the document') }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div *ngIf="complianceResult()!.recommendations.length > 0" class="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6">
        <div class="px-5 py-4 border-b border-slate-100">
          <h3 class="font-semibold text-slate-800">{{ lang.l('Soovitused', 'Recommendations') }}</h3>
        </div>
        <div class="p-5 space-y-3">
          <div *ngFor="let rec of complianceResult()!.recommendations" class="flex items-start gap-2 text-sm text-slate-600">
            <svg class="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ rec }}
          </div>
        </div>
      </div>

      <!-- AI Analysis Opt-in -->
      <div *ngIf="!aiResult() && !aiLoading()" class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 shrink-0 rounded-xl bg-blue-100 flex items-center justify-center">
            <span class="text-blue-700 font-bold text-xs">AI</span>
          </div>
          <div class="flex-1">
            <h3 class="font-semibold text-slate-800 mb-1">{{ lang.l('AI süvaanalüüs', 'AI Deep Analysis') }}</h3>
            <p class="text-sm text-slate-600 mb-3">
              {{ lang.l('Soovite AI süvaanalüüsi? Serverisse saadetakse ainult ekstraktitud tekst, mitte teie originaalfail.',
                         'Want AI-powered deep analysis? Only extracted text will be sent to the server, not your original file.') }}
            </p>
            <div class="bg-white/70 border border-blue-200 rounded-lg p-3 mb-3">
              <div class="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>{{ lang.l('Saadetav andmemaht:', 'Data to be sent:') }}</span>
                <span class="font-medium text-slate-700">{{ networkMonitor.formatBytes(aiPreviewBytes()) }}</span>
              </div>
              <div *ngIf="showTextPreview()" class="text-xs text-slate-500 max-h-24 overflow-y-auto font-mono bg-slate-50 rounded p-2">
                {{ aiPreviewText().substring(0, 500) }}{{ aiPreviewText().length > 500 ? '...' : '' }}
              </div>
              <button (click)="showTextPreview.set(!showTextPreview())" class="text-xs text-blue-600 hover:text-blue-700 mt-1">
                {{ showTextPreview() ? lang.l('Peida eelvaade', 'Hide preview') : lang.l('Näita mis saadetakse', 'Show what will be sent') }}
              </button>
            </div>
            <div class="flex gap-3">
              <button (click)="requestAiAnalysis()"
                      class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                {{ lang.l('Saada AI analüüsiks', 'Send for AI Analysis') }}
              </button>
              <button (click)="dismissAi.set(true)" *ngIf="!dismissAi()"
                      class="px-4 py-2 bg-white text-slate-600 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                {{ lang.l('Ei, ainult reeglipõhine', 'No, rule-based only') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Loading -->
      <div *ngIf="aiLoading()" class="bg-white border border-blue-200 rounded-xl p-6 mb-6 text-center">
        <svg class="w-8 h-8 mx-auto text-blue-600 animate-spin mb-3" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-sm text-slate-600">{{ lang.l('AI analüüsib teie dokumenti...', 'AI is analyzing your document...') }}</p>
      </div>

      <!-- AI Results -->
      <div *ngIf="aiResult()" class="bg-white border border-indigo-200 rounded-xl overflow-hidden mb-6">
        <div class="px-5 py-4 border-b border-indigo-100 bg-indigo-50/50 flex items-center gap-2">
          <span class="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded">AI</span>
          <h3 class="font-semibold text-slate-800">{{ lang.l('AI süvaanalüüsi tulemused', 'AI Deep Analysis Results') }}</h3>
          <span class="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
                [class]="aiResult()!.overallRiskLevel === 'LOW' ? 'bg-emerald-100 text-emerald-700' :
                         aiResult()!.overallRiskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                         aiResult()!.overallRiskLevel === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'">
            {{ aiResult()!.overallRiskLevel }}
          </span>
        </div>
        <div class="p-5">
          <p class="text-sm text-slate-600 mb-4">{{ aiResult()!.summary }}</p>
          <div class="space-y-3">
            <div *ngFor="let f of aiResult()!.detailedFindings" class="border border-slate-100 rounded-lg p-3">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-medium px-2 py-0.5 rounded-full"
                      [class]="f.status === 'COMPLIANT' ? 'bg-emerald-50 text-emerald-700' :
                               f.status === 'PARTIAL' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'">
                  {{ f.status }}
                </span>
                <span class="text-xs text-blue-600 font-medium">{{ f.article }}</span>
                <span class="text-sm font-medium text-slate-700">{{ f.title }}</span>
              </div>
              <p class="text-xs text-slate-500">{{ f.finding }}</p>
              <p *ngIf="f.recommendation" class="text-xs text-blue-600 mt-1">{{ f.recommendation }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Error -->
      <div *ngIf="aiError()" class="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
        {{ aiError() }}
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <button (click)="reset()"
                class="px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
          {{ lang.l('Analüüsi uut dokumenti', 'Analyze another document') }}
        </button>
      </div>
    </div>
  `
})
export class DocumentAnalyzerComponent {
  state = signal<State>('upload');
  dragOver = signal(false);
  error = signal('');
  selectedFileName = signal('');
  parseProgress = signal(0);
  parseStage = signal('');

  parsedDocument = signal<ParsedDocument | null>(null);
  complianceResult = signal<DoraComplianceResult | null>(null);

  aiResult = signal<AiAnalysisResult | null>(null);
  aiLoading = signal(false);
  aiError = signal('');
  showTextPreview = signal(false);
  dismissAi = signal(false);

  aiPreviewText = computed(() => {
    const doc = this.parsedDocument();
    return doc ? this.aiAnalysis.getPreviewText(doc.extractedText) : '';
  });

  aiPreviewBytes = computed(() => {
    const doc = this.parsedDocument();
    return doc ? this.aiAnalysis.getPreviewBytes(doc.extractedText) : 0;
  });

  scoreColor = computed(() => {
    const score = this.complianceResult()?.overallScore ?? 0;
    if (score >= 70) return 'text-emerald-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  });

  supportedExtensions: string[];

  constructor(
    public lang: LangService,
    public auth: AuthService,
    public subscriptionService: SubscriptionService,
    private parser: DocumentParserService,
    private complianceChecker: DoraComplianceCheckerService,
    public networkMonitor: NetworkMonitorService,
    private aiAnalysis: AiAnalysisService
  ) {
    this.supportedExtensions = this.parser.getSupportedExtensions();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.processFile(file);
    input.value = '';
  }

  async processFile(file: File): Promise<void> {
    this.error.set('');
    this.networkMonitor.reset();

    const type = this.parser.getFileType(file);
    if (!type) {
      this.error.set(this.lang.l(
        'Toetamata failiformaat. Toetatud: PDF, DOCX, XLSX, CSV, TXT',
        'Unsupported file format. Supported: PDF, DOCX, XLSX, CSV, TXT'
      ));
      return;
    }

    const validBytes = await this.parser.validateMagicBytes(file);
    if (!validBytes) {
      this.error.set(this.lang.l(
        'Faili sisu ei vasta laiendile. Palun kontrollige faili.',
        'File content does not match its extension. Please check the file.'
      ));
      return;
    }

    this.state.set('parsing');
    this.selectedFileName.set(file.name);
    this.parseProgress.set(10);
    this.parseStage.set(this.lang.l('Faili lugemine...', 'Reading file...'));

    try {
      this.parseProgress.set(30);
      this.parseStage.set(this.lang.l('Teksti ekstraheerimine...', 'Extracting text...'));

      const doc = await this.parser.parseFile(file);
      this.parsedDocument.set(doc);

      this.parseProgress.set(70);
      this.parseStage.set(this.lang.l('DORA vastavuse kontroll...', 'Checking DORA compliance...'));

      await new Promise(r => setTimeout(r, 300)); // small visual delay

      const result = this.complianceChecker.analyzeCompliance(doc);
      this.complianceResult.set(result);

      this.parseProgress.set(100);
      this.parseStage.set(this.lang.l('Valmis!', 'Done!'));

      await new Promise(r => setTimeout(r, 400));
      this.state.set('results');

    } catch (err) {
      this.state.set('upload');
      if (err instanceof FileTooLargeError) {
        this.error.set(this.lang.l('Fail on liiga suur.', 'File is too large.'));
      } else if (err instanceof UnsupportedFileTypeError) {
        this.error.set(this.lang.l('Toetamata failiformaat.', 'Unsupported file format.'));
      } else {
        this.error.set(this.lang.l(
          'Faili töötlemisel tekkis viga. Kontrollige, et fail ei ole kahjustatud.',
          'Error processing file. Please check that the file is not corrupted.'
        ));
      }
    }
  }

  async requestAiAnalysis(): Promise<void> {
    const doc = this.parsedDocument();
    if (!doc) return;

    this.aiLoading.set(true);
    this.aiError.set('');

    try {
      const result = await this.aiAnalysis.requestAiAnalysis(doc.extractedText, DoraAnalysisType.GAP_ANALYSIS);
      this.aiResult.set(result);
    } catch (err: any) {
      this.aiError.set(err?.error?.message || this.lang.l(
        'AI analüüs ebaõnnestus. Proovige hiljem uuesti.',
        'AI analysis failed. Please try again later.'
      ));
    } finally {
      this.aiLoading.set(false);
    }
  }

  reset(): void {
    this.state.set('upload');
    this.parsedDocument.set(null);
    this.complianceResult.set(null);
    this.aiResult.set(null);
    this.aiError.set('');
    this.aiLoading.set(false);
    this.showTextPreview.set(false);
    this.dismissAi.set(false);
    this.error.set('');
    this.networkMonitor.reset();
  }
}
