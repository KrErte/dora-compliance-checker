import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Title, Meta } from '@angular/platform-browser';
import { LangService } from '../lang.service';

interface RegulationCheck {
  id: string;
  name: string;
  description: string;
  reference: string;
  status?: 'passed' | 'failed' | 'partial' | 'not_checked';
  evidence?: string;
}

interface GapResult {
  regulation: string;
  totalChecks: number;
  passed: number;
  failed: number;
  partial: number;
  compliancePercentage: number;
  details?: RegulationCheck[];
}

interface Review {
  role: string;
  status: string;
  reviewedAt?: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  documents: { id: string; filename: string; uploadedAt: string; processed: boolean }[];
  gapResults: GapResult[];
  reviews: Review[];
  reviewProgress: number;
}

type ViewRole = 'overview' | 'technical' | 'business' | 'legal';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="text-center space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20">
          <span class="text-base">🔒</span>
          <span class="text-xs font-medium text-violet-400">{{ lang.t('workspace.badge') }}</span>
        </div>
        <h1 class="text-3xl md:text-4xl font-bold gradient-text">{{ lang.t('workspace.title') }}</h1>
        <p class="text-slate-400 max-w-2xl mx-auto leading-relaxed">{{ lang.t('workspace.subtitle') }}</p>
      </div>

      <!-- Security Banner -->
      <div class="max-w-4xl mx-auto p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <span class="text-emerald-400">🔐</span>
            <span class="text-sm text-emerald-400 font-medium">{{ lang.t('workspace.security_eu') }}</span>
          </div>
          <span class="text-slate-600">•</span>
          <span class="text-xs text-slate-500">{{ lang.t('workspace.security_delete') }}</span>
          <span class="text-slate-600">•</span>
          <span class="text-xs text-slate-500">{{ lang.t('workspace.security_encrypt') }}</span>
        </div>
      </div>

      <!-- Step 1: Create Project or Upload -->
      <div *ngIf="!project" class="max-w-2xl mx-auto space-y-6">
        <div class="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 md:p-8">
          <h2 class="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold">1</span>
            {{ lang.t('workspace.step1_title') }}
          </h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">{{ lang.t('workspace.project_name') }}</label>
              <input type="text" [(ngModel)]="projectName" [placeholder]="lang.t('workspace.project_name_placeholder')"
                     class="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white
                            focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all" />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">{{ lang.t('workspace.your_email') }}</label>
              <input type="email" [(ngModel)]="userEmail" placeholder="your@email.com"
                     class="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white
                            focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all" />
            </div>

            <!-- Regulation Selection -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-3">{{ lang.t('workspace.select_regulations') }}</label>
              <div class="grid grid-cols-2 gap-3">
                <label *ngFor="let reg of availableRegulations"
                       class="relative flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all"
                       [class]="selectedRegulations.includes(reg.id)
                         ? 'bg-violet-500/10 border-2 border-violet-500/40'
                         : 'bg-slate-900/30 border border-slate-700/50 hover:border-slate-600'">
                  <input type="checkbox" [checked]="selectedRegulations.includes(reg.id)"
                         (change)="toggleRegulation(reg.id)"
                         class="mt-1 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500/20" />
                  <div>
                    <span class="text-sm font-medium text-white">{{ reg.name }}</span>
                    <p class="text-xs text-slate-500 mt-0.5">{{ reg.checks }} {{ lang.t('workspace.checks') }}</p>
                  </div>
                </label>
              </div>
            </div>

            <!-- File Upload -->
            <div class="pt-4">
              <label class="block text-sm font-medium text-slate-300 mb-2">{{ lang.t('workspace.upload_contract') }}</label>
              <div class="border-2 border-dashed border-slate-700/50 rounded-xl p-8 text-center hover:border-violet-500/50 transition-colors cursor-pointer"
                   (click)="fileInput.click()"
                   (dragover)="onDragOver($event)"
                   (drop)="onDrop($event)">
                <input #fileInput type="file" (change)="onFileSelect($event)" accept=".pdf,.docx,.doc" class="hidden" />
                <div class="text-4xl mb-3">📄</div>
                <p class="text-slate-400 mb-2">{{ lang.t('workspace.drag_drop') }}</p>
                <p class="text-xs text-slate-500">PDF, DOCX (max 10MB)</p>
              </div>

              <div *ngIf="selectedFile" class="mt-4 p-4 rounded-xl bg-slate-900/30 border border-slate-700/50">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="text-2xl">📎</span>
                    <div>
                      <p class="text-sm font-medium text-white">{{ selectedFile.name }}</p>
                      <p class="text-xs text-slate-500">{{ formatFileSize(selectedFile.size) }}</p>
                    </div>
                  </div>
                  <button (click)="selectedFile = null" class="p-2 text-slate-500 hover:text-red-400 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Analyze Button -->
            <button (click)="createAndAnalyze()"
                    [disabled]="!projectName || !userEmail || !selectedFile || selectedRegulations.length === 0 || analyzing"
                    class="w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2
                           disabled:opacity-50 disabled:cursor-not-allowed
                           bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400
                           text-white hover:shadow-lg hover:shadow-violet-500/25">
              <svg *ngIf="analyzing" class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ analyzing ? lang.t('workspace.analyzing') : lang.t('workspace.analyze_btn') }}
            </button>

            <!-- Upload Progress -->
            <div *ngIf="uploadProgress > 0 && uploadProgress < 100" class="space-y-2">
              <div class="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300 rounded-full"
                     [style.width.%]="uploadProgress"></div>
              </div>
              <p class="text-xs text-slate-500 text-center">{{ lang.t('workspace.uploading') }} {{ uploadProgress }}%</p>
            </div>
          </div>
        </div>

        <!-- Free vs Pro Info -->
        <div class="grid md:grid-cols-2 gap-4">
          <div class="p-5 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-lg">🆓</span>
              <span class="text-sm font-semibold text-white">{{ lang.t('workspace.free_tier') }}</span>
            </div>
            <ul class="space-y-1.5 text-sm text-slate-400">
              <li>• {{ lang.t('workspace.free_1') }}</li>
              <li>• {{ lang.t('workspace.free_2') }}</li>
              <li>• {{ lang.t('workspace.free_3') }}</li>
            </ul>
          </div>
          <div class="p-5 rounded-xl bg-violet-500/5 border border-violet-500/20">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-lg">⭐</span>
              <span class="text-sm font-semibold text-violet-400">{{ lang.t('workspace.pro_tier') }}</span>
            </div>
            <ul class="space-y-1.5 text-sm text-slate-400">
              <li>• {{ lang.t('workspace.pro_1') }}</li>
              <li>• {{ lang.t('workspace.pro_2') }}</li>
              <li>• {{ lang.t('workspace.pro_3') }}</li>
            </ul>
            <a routerLink="/pricing" class="inline-block mt-3 text-sm text-violet-400 hover:text-violet-300">
              {{ lang.t('workspace.upgrade') }} →
            </a>
          </div>
        </div>
      </div>

      <!-- Project View (after analysis) -->
      <div *ngIf="project" class="max-w-5xl mx-auto space-y-6">

        <!-- Project Header -->
        <div class="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div>
            <h2 class="text-lg font-semibold text-white">{{ project.name }}</h2>
            <p class="text-xs text-slate-500">{{ lang.t('workspace.expires') }}: {{ formatDate(project.expiresAt) }}</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 rounded-full text-xs font-medium"
                  [ngClass]="getStatusClass(project.status)">
              {{ lang.t('workspace.status_' + project.status) }}
            </span>
          </div>
        </div>

        <!-- Role View Selector -->
        <div class="flex flex-wrap gap-2 p-1 rounded-xl bg-slate-800/50">
          <button *ngFor="let role of viewRoles"
                  (click)="currentRole = role.id"
                  class="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all"
                  [class]="currentRole === role.id
                    ? 'bg-violet-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'">
            <span class="mr-2">{{ role.icon }}</span>
            {{ lang.t('workspace.role_' + role.id) }}
          </button>
        </div>

        <!-- Review Progress -->
        <div class="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-slate-400">{{ lang.t('workspace.review_progress') }}</span>
            <span class="text-sm font-medium text-white">{{ project.reviewProgress }}%</span>
          </div>
          <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                 [style.width.%]="project.reviewProgress"></div>
          </div>
        </div>

        <!-- Gap Results Summary -->
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div *ngFor="let gap of project.gapResults"
               class="p-4 rounded-xl border transition-all cursor-pointer"
               [ngClass]="getGapCardClass(gap.compliancePercentage)"
               (click)="selectedGap = gap; loadGapDetails(gap.regulation)">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-white">{{ getRegulationName(gap.regulation) }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full"
                    [ngClass]="getComplianceBadgeClass(gap.compliancePercentage)">
                {{ gap.compliancePercentage | number:'1.0-0' }}%
              </span>
            </div>
            <div class="flex items-center gap-4 text-xs">
              <span class="text-emerald-400">✓ {{ gap.passed }}</span>
              <span class="text-red-400">✗ {{ gap.failed }}</span>
              <span class="text-amber-400">◐ {{ gap.partial }}</span>
            </div>
          </div>
        </div>

        <!-- Gap Details Panel -->
        <div *ngIf="selectedGap && gapDetails" class="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-white">{{ getRegulationName(selectedGap.regulation) }} {{ lang.t('workspace.gap_details') }}</h3>
            <button (click)="selectedGap = null" class="p-2 text-slate-500 hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Filter by Role View -->
          <div *ngIf="currentRole === 'technical'" class="text-sm text-slate-500 italic">
            {{ lang.t('workspace.technical_view_hint') }}
          </div>
          <div *ngIf="currentRole === 'business'" class="text-sm text-slate-500 italic">
            {{ lang.t('workspace.business_view_hint') }}
          </div>
          <div *ngIf="currentRole === 'legal'" class="text-sm text-slate-500 italic">
            {{ lang.t('workspace.legal_view_hint') }}
          </div>

          <!-- Checks List -->
          <div class="space-y-3 max-h-96 overflow-y-auto">
            <div *ngFor="let check of getFilteredChecks()"
                 class="p-4 rounded-lg border"
                 [ngClass]="getCheckCardClass(check.status)">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-lg">{{ getStatusIcon(check.status) }}</span>
                    <span class="text-sm font-medium text-white">{{ check.name }}</span>
                  </div>
                  <p class="text-xs text-slate-400 mb-2">{{ check.description }}</p>
                  <p class="text-xs text-slate-500">{{ check.reference }}</p>
                  <p *ngIf="check.evidence" class="text-xs text-slate-400 mt-2 italic border-l-2 border-slate-600 pl-2">
                    "{{ check.evidence }}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Submit Review Section -->
        <div class="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-4">
          <h3 class="text-lg font-semibold text-white">{{ lang.t('workspace.submit_review') }}</h3>

          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">{{ lang.t('workspace.your_role') }}</label>
              <select [(ngModel)]="reviewRole"
                      class="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white">
                <option value="">{{ lang.t('workspace.select_role') }}</option>
                <option value="account_manager">{{ lang.t('workspace.role_account_manager') }}</option>
                <option value="technical_lead">{{ lang.t('workspace.role_technical_lead') }}</option>
                <option value="ceo">{{ lang.t('workspace.role_ceo') }}</option>
                <option value="legal_counsel">{{ lang.t('workspace.role_legal_counsel') }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">{{ lang.t('workspace.review_status') }}</label>
              <select [(ngModel)]="reviewStatus"
                      class="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white">
                <option value="">{{ lang.t('workspace.select_status') }}</option>
                <option value="reviewed">{{ lang.t('workspace.status_reviewed') }}</option>
                <option value="needs_attention">{{ lang.t('workspace.status_needs_attention') }}</option>
                <option value="accepted_risk">{{ lang.t('workspace.status_accepted_risk') }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">{{ lang.t('workspace.comments') }}</label>
            <textarea [(ngModel)]="reviewComments" rows="3"
                      class="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white resize-none"></textarea>
          </div>

          <button (click)="submitReview()"
                  [disabled]="!reviewRole || !reviewStatus || submittingReview"
                  class="px-6 py-3 rounded-xl font-semibold transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed
                         bg-violet-500 hover:bg-violet-400 text-white">
            {{ submittingReview ? lang.t('workspace.submitting') : lang.t('workspace.submit_review_btn') }}
          </button>
        </div>

        <!-- Audit Trail -->
        <div class="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-white">{{ lang.t('workspace.audit_trail') }}</h3>
            <button (click)="exportReport()" class="text-sm text-violet-400 hover:text-violet-300">
              {{ lang.t('workspace.export_pdf') }}
            </button>
          </div>

          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div *ngFor="let log of auditLogs"
                 class="flex items-start gap-3 p-3 rounded-lg bg-slate-900/30">
              <div class="w-2 h-2 rounded-full mt-2" [ngClass]="getAuditDotClass(log.action)"></div>
              <div class="flex-1">
                <div class="flex items-center gap-2 text-sm">
                  <span class="font-medium text-white">{{ log.user }}</span>
                  <span class="text-slate-500">{{ log.action }}</span>
                </div>
                <p *ngIf="log.details" class="text-xs text-slate-500 mt-0.5">{{ log.details }}</p>
                <p class="text-xs text-slate-600 mt-1">{{ formatDateTime(log.timestamp) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class WorkspaceComponent implements OnInit {
  projectName = '';
  userEmail = '';
  selectedFile: File | null = null;
  selectedRegulations: string[] = ['DORA_ART30'];
  analyzing = false;
  uploadProgress = 0;

  project: Project | null = null;
  currentRole: ViewRole = 'overview';
  selectedGap: GapResult | null = null;
  gapDetails: RegulationCheck[] = [];

  reviewRole = '';
  reviewStatus = '';
  reviewComments = '';
  submittingReview = false;

  auditLogs: any[] = [];

  availableRegulations = [
    { id: 'DORA_ART30', name: 'DORA Art. 30', checks: 18 },
    { id: 'GDPR_ART28', name: 'GDPR Art. 28', checks: 10 },
    { id: 'SLA', name: 'SLA Best Practices', checks: 10 },
    { id: 'NIS2', name: 'NIS2 Supply Chain', checks: 8 }
  ];

  viewRoles: { id: ViewRole; icon: string }[] = [
    { id: 'overview', icon: '📊' },
    { id: 'technical', icon: '⚙️' },
    { id: 'business', icon: '💼' },
    { id: 'legal', icon: '⚖️' }
  ];

  constructor(
    public lang: LangService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private titleService: Title,
    private meta: Meta
  ) {}

  ngOnInit(): void {
    this.updateMeta();

    // Check if we have a project ID in URL
    const projectId = this.route.snapshot.paramMap.get('id');
    if (projectId) {
      this.loadProject(projectId);
    }
  }

  private updateMeta(): void {
    const title = this.lang.currentLang === 'et'
      ? 'ICT Lepingu Töölaud — Multi-regulatsiooni vastavuse kontroll | DoraAudit.eu'
      : 'ICT Contract Workspace — Multi-Regulation Compliance Check | DoraAudit.eu';
    this.titleService.setTitle(title);
  }

  toggleRegulation(id: string): void {
    const index = this.selectedRegulations.indexOf(id);
    if (index > -1) {
      this.selectedRegulations.splice(index, 1);
    } else {
      this.selectedRegulations.push(id);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  createAndAnalyze(): void {
    if (!this.projectName || !this.userEmail || !this.selectedFile) return;

    this.analyzing = true;

    // First create project
    this.http.post<{ id: string }>('/api/workspace/projects', {
      name: this.projectName,
      email: this.userEmail
    }).subscribe({
      next: (result) => {
        // Then upload and analyze
        const formData = new FormData();
        formData.append('file', this.selectedFile!);
        formData.append('regulations', this.selectedRegulations.join(','));
        formData.append('email', this.userEmail);

        this.http.post(`/api/workspace/projects/${result.id}/analyze`, formData, {
          reportProgress: true,
          observe: 'events'
        }).subscribe({
          next: (event) => {
            if (event.type === HttpEventType.UploadProgress && event.total) {
              this.uploadProgress = Math.round(100 * event.loaded / event.total);
            } else if (event.type === HttpEventType.Response) {
              this.loadProject(result.id);
              this.analyzing = false;
              this.uploadProgress = 0;
            }
          },
          error: (err) => {
            console.error('Analysis failed', err);
            this.analyzing = false;
            this.uploadProgress = 0;
          }
        });
      },
      error: (err) => {
        console.error('Failed to create project', err);
        this.analyzing = false;
      }
    });
  }

  loadProject(id: string): void {
    this.http.get<Project>(`/api/workspace/projects/${id}`).subscribe({
      next: (project) => {
        this.project = project;
        this.loadAuditLogs(id);
      },
      error: (err) => console.error('Failed to load project', err)
    });
  }

  loadGapDetails(regulation: string): void {
    if (!this.project) return;

    this.http.get<GapResult[]>(`/api/workspace/projects/${this.project.id}/gap-report`).subscribe({
      next: (results) => {
        const gap = results.find(r => r.regulation === regulation);
        if (gap && gap.details) {
          this.gapDetails = gap.details;
        }
      },
      error: (err) => console.error('Failed to load gap details', err)
    });
  }

  loadAuditLogs(projectId: string): void {
    this.http.get<any[]>(`/api/workspace/projects/${projectId}/audit-trail`).subscribe({
      next: (logs) => this.auditLogs = logs,
      error: (err) => console.error('Failed to load audit logs', err)
    });
  }

  submitReview(): void {
    if (!this.project || !this.reviewRole || !this.reviewStatus) return;

    this.submittingReview = true;

    this.http.post(`/api/workspace/projects/${this.project.id}/review`, {
      email: this.userEmail,
      role: this.reviewRole,
      status: this.reviewStatus,
      comments: this.reviewComments
    }).subscribe({
      next: () => {
        this.loadProject(this.project!.id);
        this.reviewRole = '';
        this.reviewStatus = '';
        this.reviewComments = '';
        this.submittingReview = false;
      },
      error: (err) => {
        console.error('Failed to submit review', err);
        this.submittingReview = false;
      }
    });
  }

  exportReport(): void {
    // TODO: Implement PDF export
    alert(this.lang.currentLang === 'et' ? 'PDF eksport tuleb varsti!' : 'PDF export coming soon!');
  }

  getFilteredChecks(): RegulationCheck[] {
    if (!this.gapDetails.length) return [];

    // Filter based on current role view
    if (this.currentRole === 'technical') {
      // Show SLA, BCM/DR, security related
      return this.gapDetails.filter(c =>
        c.id.includes('sla') || c.id.includes('bcm') || c.id.includes('security') ||
        c.id.includes('rto') || c.id.includes('rpo') || c.id.includes('incident') ||
        c.name.toLowerCase().includes('technical') || c.name.toLowerCase().includes('security')
      );
    }

    if (this.currentRole === 'business') {
      // Show liability, termination, costs related
      return this.gapDetails.filter(c =>
        c.id.includes('liability') || c.id.includes('termination') || c.id.includes('exit') ||
        c.id.includes('sla') || c.name.toLowerCase().includes('service')
      );
    }

    // Overview and Legal show all
    return this.gapDetails;
  }

  // UI Helper methods
  getStatusClass(status: string): string {
    switch (status) {
      case 'draft': return 'bg-slate-700/50 text-slate-400';
      case 'analyzed': return 'bg-blue-500/20 text-blue-400';
      case 'in_review': return 'bg-amber-500/20 text-amber-400';
      case 'completed': return 'bg-emerald-500/20 text-emerald-400';
      default: return 'bg-slate-700/50 text-slate-400';
    }
  }

  getGapCardClass(percentage: number): string {
    if (percentage >= 80) return 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50';
    if (percentage >= 50) return 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50';
    return 'bg-red-500/5 border-red-500/30 hover:border-red-500/50';
  }

  getComplianceBadgeClass(percentage: number): string {
    if (percentage >= 80) return 'bg-emerald-500/20 text-emerald-400';
    if (percentage >= 50) return 'bg-amber-500/20 text-amber-400';
    return 'bg-red-500/20 text-red-400';
  }

  getCheckCardClass(status?: string): string {
    switch (status) {
      case 'passed': return 'bg-emerald-500/5 border-emerald-500/30';
      case 'partial': return 'bg-amber-500/5 border-amber-500/30';
      case 'failed': return 'bg-red-500/5 border-red-500/30';
      default: return 'bg-slate-800/50 border-slate-700/50';
    }
  }

  getStatusIcon(status?: string): string {
    switch (status) {
      case 'passed': return '✅';
      case 'partial': return '⚠️';
      case 'failed': return '❌';
      default: return '❓';
    }
  }

  getAuditDotClass(action: string): string {
    switch (action) {
      case 'created': return 'bg-violet-400';
      case 'uploaded': return 'bg-blue-400';
      case 'analyzed': return 'bg-cyan-400';
      case 'reviewed': return 'bg-emerald-400';
      case 'exported': return 'bg-amber-400';
      default: return 'bg-slate-400';
    }
  }

  getRegulationName(id: string): string {
    const reg = this.availableRegulations.find(r => r.id === id);
    return reg?.name || id;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString(this.lang.currentLang === 'et' ? 'et-EE' : 'en-US');
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleString(this.lang.currentLang === 'et' ? 'et-EE' : 'en-US');
  }
}
