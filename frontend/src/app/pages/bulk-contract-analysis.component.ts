import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LangService } from '../lang.service';
import { SubscriptionService } from '../services/subscription.service';
import { DocumentParserService } from '../services/document-parser.service';
import { ContractComplianceCheckerService } from '../services/contract-compliance-checker.service';
import { ApiService } from '../api.service';

interface BulkResult {
  id?: string;
  contractName?: string;
  fileName: string;
  scorePercentage?: number;
  complianceLevel?: string;
  foundCount?: number;
  partialCount?: number;
  missingCount?: number;
  totalRequirements?: number;
  summary?: string;
  status: string;
  error?: string;
}

interface BulkResponse {
  results: BulkResult[];
  totalContracts: number;
  successCount: number;
  averageScore: number;
  portfolioTotalFound: number;
  portfolioTotalPartial: number;
  portfolioTotalMissing: number;
  weakestContracts: { contractName: string; score: number; missingCount: number; id: string }[];
  portfolioLevel: string;
}

@Component({
  selector: 'app-bulk-contract-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-slate-950 via-slate-50 to-slate-950 pt-24 pb-16 px-4">
      <div class="max-w-5xl mx-auto">

        <!-- Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Bulk Analysis
          </div>
          <h1 class="text-3xl font-bold text-slate-900 mb-2">Bulk Contract Analysis</h1>
          <p class="text-slate-400 max-w-xl mx-auto">Upload up to 50 contracts at once. Get a portfolio-level DORA compliance overview and identify your weakest vendor contracts.</p>
        </div>

        <!-- Upload Section -->
        @if (!response) {
          <div class="glass-card p-8 mb-8">
            <div class="mb-6">
              <label class="block text-sm text-slate-400 mb-2">Company / Organization Name</label>
              <input type="text" [(ngModel)]="companyName" placeholder="e.g. My Financial Institution"
                     class="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none">
            </div>

            <!-- Drop Zone -->
            <div class="border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer"
                 [class]="files.length > 0 ? 'border-blue-500/50 bg-blue-50' : 'border-slate-200 hover:border-slate-500 bg-slate-100/30'"
                 (click)="fileInput.click()"
                 (drop)="onDrop($event)" (dragover)="$event.preventDefault()">
              <input #fileInput type="file" multiple accept=".pdf,.docx,.doc,.txt" (change)="onFilesSelected($event)" class="hidden">

              @if (files.length === 0) {
                <svg class="w-16 h-16 mx-auto mb-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                <p class="text-lg text-slate-600 mb-2">Drop contracts here or click to browse</p>
                <p class="text-sm text-slate-500">PDF, DOCX, DOC, TXT &middot; Up to 50 files</p>
              } @else {
                <div class="text-blue-600 mb-3">
                  <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <p class="text-lg text-slate-900 mb-1">{{ files.length }} contract{{ files.length > 1 ? 's' : '' }} selected</p>
                <p class="text-sm text-slate-400">Click to add more or drag additional files</p>
              }
            </div>

            <!-- File List -->
            @if (files.length > 0) {
              <div class="mt-6 space-y-2 max-h-60 overflow-y-auto">
                @for (file of files; track file.name; let i = $index) {
                  <div class="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-100/30">
                    <div class="flex items-center gap-3 min-w-0">
                      <svg class="w-5 h-5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      <span class="text-sm text-slate-600 truncate">{{ file.name }}</span>
                      <span class="text-xs text-slate-500">{{ formatSize(file.size) }}</span>
                    </div>
                    <button (click)="removeFile(i)" class="text-slate-500 hover:text-red-400 transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                }
              </div>

              <!-- Zero-Upload Badge + AI Toggle -->
              <div class="mt-6 flex items-center gap-3 mb-4">
                <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                  Zero-Upload
                </div>
                <label class="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-full border text-xs font-medium"
                       [class]="useAi ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500'">
                  <input type="checkbox" [(ngModel)]="useAi" class="sr-only">
                  <span class="w-3 h-3 rounded-full" [class]="useAi ? 'bg-blue-500' : 'bg-slate-300'" (click)="useAi = !useAi"></span>
                  {{ useAi ? 'AI Analysis (server)' : 'Rule-based (browser)' }}
                </label>
              </div>

              <div class="flex items-center gap-4">
                <button (click)="startAnalysis()" [disabled]="analyzing || !companyName"
                        class="flex-1 px-6 py-3 bg-blue-600 text-slate-900 rounded-xl font-semibold text-lg
                               hover:shadow-lg hover:shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  {{ analyzing ? 'Analyzing...' : 'Analyze ' + files.length + ' Contract' + (files.length > 1 ? 's' : '') }}
                </button>
                <button (click)="clearFiles()" class="px-4 py-3 bg-slate-700 text-slate-600 rounded-xl hover:bg-slate-600 transition-colors">
                  Clear
                </button>
              </div>
            }
          </div>
        }

        <!-- Progress -->
        @if (analyzing) {
          <div class="glass-card p-8 text-center mb-8">
            <div class="animate-spin w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p class="text-lg text-slate-900 mb-2">Analyzing contracts...</p>
            <p class="text-sm text-slate-400">{{ progressText }}</p>
            <div class="mt-4 w-full bg-white rounded-full h-2">
              <div class="h-2 rounded-full bg-blue-600 transition-all duration-500" [style.width.%]="progressPercent"></div>
            </div>
          </div>
        }

        <!-- Results -->
        @if (response) {
          <!-- Portfolio Summary -->
          <div class="glass-card p-6 mb-6">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-slate-900">Portfolio Summary</h2>
              <button (click)="resetAnalysis()" class="px-4 py-2 bg-slate-700 text-slate-600 rounded-lg hover:bg-slate-600 text-sm">
                New Analysis
              </button>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div class="text-center p-4 rounded-xl bg-white">
                <div class="text-3xl font-bold" [class]="response.portfolioLevel === 'GREEN' ? 'text-blue-600' : (response.portfolioLevel === 'YELLOW' ? 'text-amber-400' : 'text-red-400')">
                  {{ response.averageScore }}%
                </div>
                <div class="text-xs text-slate-400 mt-1">Avg. Score</div>
              </div>
              <div class="text-center p-4 rounded-xl bg-white">
                <div class="text-3xl font-bold text-blue-400">{{ response.successCount }}</div>
                <div class="text-xs text-slate-400 mt-1">Contracts Analyzed</div>
              </div>
              <div class="text-center p-4 rounded-xl bg-white">
                <div class="text-3xl font-bold text-blue-600">{{ response.portfolioTotalFound }}</div>
                <div class="text-xs text-slate-400 mt-1">Requirements Met</div>
              </div>
              <div class="text-center p-4 rounded-xl bg-white">
                <div class="text-3xl font-bold text-red-400">{{ response.portfolioTotalMissing }}</div>
                <div class="text-xs text-slate-400 mt-1">Gaps Found</div>
              </div>
            </div>

            <!-- Portfolio bar -->
            <div class="mb-2">
              <div class="flex justify-between text-xs text-slate-400 mb-1">
                <span>Portfolio Compliance</span>
                <span>{{ response.averageScore }}%</span>
              </div>
              <div class="w-full bg-white rounded-full h-3">
                <div class="h-3 rounded-full transition-all"
                     [style.width.%]="response.averageScore"
                     [class]="response.portfolioLevel === 'GREEN' ? 'bg-blue-600' : (response.portfolioLevel === 'YELLOW' ? 'bg-amber-500' : 'bg-red-500')">
                </div>
              </div>
            </div>
          </div>

          <!-- Weakest Contracts -->
          @if (response.weakestContracts.length > 0) {
            <div class="glass-card p-6 mb-6">
              <h3 class="text-lg font-semibold text-red-400 mb-4">Weakest Contracts (Below 60%)</h3>
              <div class="space-y-3">
                @for (weak of response.weakestContracts; track weak.id) {
                  <div class="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <span class="text-red-400 font-bold text-sm">{{ weak.score }}%</span>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-slate-900">{{ weak.contractName }}</p>
                        <p class="text-xs text-slate-500">{{ weak.missingCount }} missing requirements</p>
                      </div>
                    </div>
                    <a [routerLink]="'/contract-results/' + weak.id" class="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs">
                      View Details
                    </a>
                  </div>
                }
              </div>
            </div>
          }

          <!-- All Results -->
          <div class="glass-card p-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">All Contracts</h3>
            <div class="space-y-3">
              @for (r of response.results; track r.fileName) {
                <div class="flex items-center justify-between p-4 rounded-xl bg-slate-100/30 border border-slate-200">
                  <div class="flex items-center gap-4 min-w-0 flex-1">
                    @if (r.status === 'success') {
                      <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                           [class]="r.complianceLevel === 'GREEN' ? 'bg-blue-100' : (r.complianceLevel === 'YELLOW' ? 'bg-amber-500/20' : 'bg-red-500/20')">
                        <span class="font-bold text-sm"
                              [class]="r.complianceLevel === 'GREEN' ? 'text-blue-600' : (r.complianceLevel === 'YELLOW' ? 'text-amber-400' : 'text-red-400')">
                          {{ r.scorePercentage | number:'1.0-0' }}%
                        </span>
                      </div>
                      <div class="min-w-0">
                        <p class="text-sm font-medium text-slate-900 truncate">{{ r.contractName || r.fileName }}</p>
                        <p class="text-xs text-slate-500">
                          Found: {{ r.foundCount }} &middot; Partial: {{ r.partialCount }} &middot; Missing: {{ r.missingCount }}
                        </p>
                      </div>
                    } @else {
                      <div class="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                        <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                        </svg>
                      </div>
                      <div class="min-w-0">
                        <p class="text-sm font-medium text-slate-900 truncate">{{ r.fileName }}</p>
                        <p class="text-xs text-red-400">Analysis failed: {{ r.error }}</p>
                      </div>
                    }
                  </div>
                  @if (r.status === 'success' && r.id) {
                    <a [routerLink]="'/contract-results/' + r.id"
                       class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm shrink-0 ml-4">
                      Details
                    </a>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .glass-card {
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 12px;
      backdrop-filter: blur(12px);
    }
  `]
})
export class BulkContractAnalysisComponent {
  companyName = '';
  files: File[] = [];
  analyzing = false;
  progressText = '';
  progressPercent = 0;
  response: BulkResponse | null = null;

  private documentParser = inject(DocumentParserService);
  private contractChecker = inject(ContractComplianceCheckerService);
  private api = inject(ApiService);
  useAi = false;

  constructor(
    public lang: LangService,
    private http: HttpClient,
    private router: Router,
    private subscription: SubscriptionService
  ) {}

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  private addFiles(newFiles: File[]): void {
    const allowed = ['.pdf', '.docx', '.doc', '.txt'];
    for (const f of newFiles) {
      const ext = f.name.toLowerCase().substring(f.name.lastIndexOf('.'));
      if (allowed.includes(ext) && this.files.length < 50) {
        // Avoid duplicates
        if (!this.files.some(existing => existing.name === f.name && existing.size === f.size)) {
          this.files.push(f);
        }
      }
    }
  }

  removeFile(index: number): void {
    this.files.splice(index, 1);
  }

  clearFiles(): void {
    this.files = [];
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  async startAnalysis(): Promise<void> {
    if (this.files.length === 0 || !this.companyName) return;

    this.analyzing = true;
    this.progressText = `Parsing ${this.files.length} contracts in browser...`;
    this.progressPercent = 5;

    // Parse all files client-side
    const contracts: { text: string; contractName: string; fileName: string }[] = [];
    for (let i = 0; i < this.files.length; i++) {
      const file = this.files[i];
      this.progressText = `Parsing file ${i + 1} of ${this.files.length}...`;
      this.progressPercent = 5 + (i / this.files.length) * 30;
      try {
        const parsed = await this.documentParser.parseFile(file);
        const text = parsed.pages.map(p => p.text).join('\n');
        contracts.push({
          text: text.trim() ? text : '',
          contractName: file.name.replace(/\.[^.]+$/, ''),
          fileName: file.name
        });
      } catch (e) {
        contracts.push({ text: '', contractName: file.name, fileName: file.name });
      }
    }

    if (this.useAi) {
      // AI mode: send to server
      this.progressText = `Sending text for AI analysis...`;
      this.progressPercent = 35;

      const interval = setInterval(() => {
        if (this.progressPercent < 90) {
          this.progressPercent += Math.random() * 6;
          const count = Math.floor(((this.progressPercent - 35) / 55) * contracts.length);
          this.progressText = `AI analyzing contract ${Math.min(count + 1, contracts.length)} of ${contracts.length}...`;
        }
      }, 2000);

      this.api.analyzeBulkText(this.companyName, contracts).subscribe({
        next: (response: BulkResponse) => {
          clearInterval(interval);
          this.progressPercent = 100;
          this.analyzing = false;
          this.response = response;
        },
        error: () => {
          clearInterval(interval);
          this.analyzing = false;
          this.progressText = 'Analysis failed. Please try again.';
        }
      });
    } else {
      // Rule-based: 100% in browser
      const results: BulkResult[] = [];
      let totalFound = 0, totalPartial = 0, totalMissing = 0, scoreSum = 0, successCount = 0;
      const weakest: { contractName: string; score: number; missingCount: number; id: string }[] = [];

      for (let i = 0; i < contracts.length; i++) {
        this.progressText = `Analyzing contract ${i + 1} of ${contracts.length}...`;
        this.progressPercent = 35 + (i / contracts.length) * 60;

        const c = contracts[i];
        if (!c.text) {
          results.push({ fileName: c.fileName, status: 'error', error: 'Could not extract text' });
          continue;
        }

        const r = this.contractChecker.analyze(c.text);
        const id = 'local-' + Date.now() + '-' + i;
        results.push({
          id, contractName: c.contractName, fileName: c.fileName,
          scorePercentage: r.scorePercentage, complianceLevel: r.complianceLevel,
          foundCount: r.foundCount, partialCount: r.partialCount, missingCount: r.missingCount,
          totalRequirements: r.totalRequirements, summary: r.summary, status: 'success'
        });

        totalFound += r.foundCount;
        totalPartial += r.partialCount;
        totalMissing += r.missingCount;
        scoreSum += r.scorePercentage;
        successCount++;

        if (r.scorePercentage < 60) {
          weakest.push({ contractName: c.contractName, score: r.scorePercentage, missingCount: r.missingCount, id });
        }
      }

      weakest.sort((a, b) => a.score - b.score);

      this.progressPercent = 100;
      this.analyzing = false;
      this.response = {
        results,
        totalContracts: contracts.length,
        successCount,
        averageScore: successCount > 0 ? Math.round(scoreSum / successCount * 10) / 10 : 0,
        portfolioTotalFound: totalFound,
        portfolioTotalPartial: totalPartial,
        portfolioTotalMissing: totalMissing,
        weakestContracts: weakest,
        portfolioLevel: successCount > 0
          ? (scoreSum / successCount >= 80 ? 'GREEN' : (scoreSum / successCount >= 50 ? 'YELLOW' : 'RED'))
          : 'UNKNOWN'
      };
    }
  }

  resetAnalysis(): void {
    this.response = null;
    this.files = [];
    this.progressPercent = 0;
  }
}
