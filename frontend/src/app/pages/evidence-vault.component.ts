import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';
import { SubscriptionService } from '../services/subscription.service';
import { EvidenceItem, EvidenceStats, EvidenceCoverage } from '../models';

@Component({
  selector: 'app-evidence-vault',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
              </svg>
            </div>
            {{ lang.t('evidence.title') }}
          </h1>
          <p class="text-slate-400 text-sm mt-1">{{ lang.t('evidence.subtitle') }}</p>
        </div>
        <div class="flex items-center gap-3">
          @if (!subscriptionService.isPremium()) {
            <span class="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {{ docCount() }}/10 {{ lang.t('evidence.documents') }}
            </span>
          }
          <button (click)="exportZip()" [disabled]="items().length === 0"
                  class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-40">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            {{ lang.t('evidence.export_zip') }}
          </button>
          <button (click)="showUpload = true"
                  [disabled]="!subscriptionService.isPremium() && docCount() >= 10"
                  class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold text-sm hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-40">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            {{ lang.t('evidence.upload') }}
          </button>
        </div>
      </div>

      <!-- Stats bar -->
      @if (stats()) {
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div class="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-slate-900">{{ stats()!.total }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('evidence.total') }}</div>
          </div>
          <div class="bg-white border border-amber-500/30 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-amber-400">{{ stats()!.pending }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('evidence.pending') }}</div>
          </div>
          <div class="bg-white border border-blue-200 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-blue-600">{{ stats()!.verified }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('evidence.verified') }}</div>
          </div>
          <div class="bg-white border border-red-500/30 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-red-400">{{ stats()!.expired }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('evidence.expired') }}</div>
          </div>
          @if (coverage()) {
            <div class="bg-white border border-indigo-500/30 rounded-xl p-4 text-center">
              <div class="text-2xl font-bold text-indigo-400">{{ coverage()!.percentage }}%</div>
              <div class="text-xs text-slate-400 mt-1">{{ lang.t('evidence.coverage') }}</div>
            </div>
          }
        </div>
      }

      <!-- Filters + view toggle -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div class="flex gap-2 flex-wrap">
          @for (f of statusFilters; track f.value) {
            <button (click)="activeStatus = f.value; loadData()"
                    class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    [class]="activeStatus === f.value ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40' : 'bg-slate-100 text-slate-400 hover:text-slate-700'">
              {{ lang.l(f.et, f.en) }}
            </button>
          }
        </div>
        <div class="flex items-center gap-2">
          <select [(ngModel)]="activePillar" (ngModelChange)="loadData()"
                  class="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none">
            <option value="">{{ lang.t('evidence.all_pillars') }}</option>
            @for (p of pillars; track p.value) {
              <option [value]="p.value">{{ p.label }}</option>
            }
          </select>
          <select [(ngModel)]="activeCategory" (ngModelChange)="applyFilters()"
                  class="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none">
            <option value="">{{ lang.t('evidence.all_categories') }}</option>
            @for (c of categories; track c.value) {
              <option [value]="c.value">{{ lang.l(c.et, c.en) }}</option>
            }
          </select>
          <div class="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
            <button (click)="viewMode = 'list'" class="px-3 py-1.5 text-xs font-medium transition-all"
                    [class]="viewMode === 'list' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-slate-900'">
              {{ lang.t('evidence.list_view') }}
            </button>
            <button (click)="viewMode = 'coverage'" class="px-3 py-1.5 text-xs font-medium transition-all"
                    [class]="viewMode === 'coverage' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-slate-900'">
              {{ lang.t('evidence.coverage_map') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Upload Modal -->
      @if (showUpload) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="showUpload = false">
          <div class="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <h2 class="text-lg font-bold text-slate-900 mb-4">{{ lang.t('evidence.upload_evidence') }}</h2>
            <div class="space-y-4">
              <!-- Drop zone -->
              <div class="border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer"
                   [class]="dragOver ? 'border-indigo-400 bg-indigo-500/10' : 'border-slate-300 hover:border-indigo-500/50'"
                   (dragover)="onDragOver($event)" (dragleave)="dragOver = false" (drop)="onDrop($event)"
                   (click)="fileInput.click()">
                <input #fileInput type="file" class="hidden" (change)="onFileSelected($event)"
                       accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg">
                @if (selectedFile) {
                  <div class="flex items-center justify-center gap-2 text-indigo-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span class="text-sm font-medium">{{ selectedFile.name }}</span>
                    <span class="text-xs text-slate-500">({{ formatSize(selectedFile.size) }})</span>
                  </div>
                } @else {
                  <svg class="w-8 h-8 mx-auto mb-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                  <p class="text-sm text-slate-400">{{ lang.t('evidence.drag_drop') }}</p>
                  <p class="text-xs text-slate-500 mt-1">PDF, DOCX, XLSX, PNG, JPG (max 10MB)</p>
                }
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1">{{ lang.t('evidence.doc_title') }}</label>
                <input [(ngModel)]="uploadForm.title" type="text"
                       class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500/50">
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs text-slate-400 mb-1">{{ lang.t('evidence.category') }}</label>
                  <select [(ngModel)]="uploadForm.category" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none">
                    @for (c of categories; track c.value) {
                      <option [value]="c.value">{{ lang.l(c.et, c.en) }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-xs text-slate-400 mb-1">{{ lang.t('evidence.pillar') }}</label>
                  <select [(ngModel)]="uploadForm.pillar" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none">
                    @for (p of pillars; track p.value) {
                      <option [value]="p.value">{{ p.label }}</option>
                    }
                  </select>
                </div>
              </div>
              <!-- Article checkboxes -->
              <div>
                <label class="block text-xs text-slate-400 mb-2">{{ lang.t('evidence.linked_articles') }}</label>
                <div class="grid grid-cols-6 gap-1.5 max-h-28 overflow-y-auto">
                  @for (art of doraArticles; track art) {
                    <label class="flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer transition-all"
                           [class]="selectedArticles.has(art) ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40' : 'bg-slate-100 text-slate-400 hover:text-slate-900'">
                      <input type="checkbox" class="hidden" [checked]="selectedArticles.has(art)" (change)="toggleArticle(art)">
                      Art.{{ art }}
                    </label>
                  }
                </div>
              </div>
              <div>
                <label class="block text-xs text-slate-400 mb-1">{{ lang.t('evidence.description') }}</label>
                <textarea [(ngModel)]="uploadForm.description" rows="2"
                          class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500/50"></textarea>
              </div>
              <div>
                <label class="block text-xs text-slate-400 mb-1">{{ lang.t('evidence.expiry_date') }}</label>
                <input [(ngModel)]="uploadForm.expiryDate" type="date"
                       class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none">
              </div>
              <!-- Upload progress -->
              @if (uploading()) {
                <div class="w-full bg-slate-200 rounded-full h-2">
                  <div class="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full animate-pulse" style="width: 60%"></div>
                </div>
              }
              <div class="flex justify-end gap-3 pt-2">
                <button (click)="showUpload = false" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm">{{ lang.t('evidence.cancel') }}</button>
                <button (click)="doUpload()" [disabled]="!selectedFile || !uploadForm.title || uploading()"
                        class="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold disabled:opacity-50">
                  {{ lang.t('evidence.upload_btn') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Verify Modal -->
      @if (showVerify) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="showVerify = false">
          <div class="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm" (click)="$event.stopPropagation()">
            <h2 class="text-lg font-bold text-slate-900 mb-4">{{ lang.t('evidence.verify_evidence') }}</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-xs text-slate-400 mb-1">{{ lang.t('evidence.verified_by') }}</label>
                <input [(ngModel)]="verifyName" type="text" placeholder="e.g. John Smith, CISO"
                       class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500/50">
              </div>
              <div class="flex justify-end gap-3">
                <button (click)="showVerify = false" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm">{{ lang.t('evidence.cancel') }}</button>
                <button (click)="confirmVerify()" [disabled]="!verifyName"
                        class="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 text-white text-sm font-semibold disabled:opacity-50">
                  {{ lang.t('evidence.confirm_verify') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="text-center py-16">
          <div class="w-10 h-10 mx-auto mb-3 rounded-full border-4 border-slate-200 border-t-indigo-400 animate-spin"></div>
        </div>
      }

      <!-- LIST VIEW -->
      @if (!loading() && viewMode === 'list') {
        @if (filteredItems().length === 0) {
          <div class="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <svg class="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
            </svg>
            <p class="text-slate-400">{{ lang.t('evidence.no_evidence') }}</p>
          </div>
        }

        <div class="space-y-2">
          @for (item of filteredItems(); track item.id) {
            <div class="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-200 transition-all">
              <div class="flex flex-col md:flex-row md:items-center gap-3">
                <!-- File icon -->
                <div class="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
                     [class]="getFileIconClass(item.mimeType)">
                  <span class="text-xs font-bold uppercase">{{ getFileExt(item.fileName) }}</span>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="text-sm font-medium text-slate-900 truncate">{{ item.title }}</h3>
                    <!-- Category badge -->
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">{{ getCategoryLabel(item.category) }}</span>
                    <!-- Pillar badge -->
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-400">{{ getPillarLabel(item.pillar) }}</span>
                    <!-- Status badge -->
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold"
                          [class]="item.status === 'VERIFIED' ? 'bg-blue-50 text-blue-600' : item.status === 'EXPIRED' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'">
                      {{ item.status }}
                    </span>
                  </div>
                  <!-- Article badges -->
                  @if (item.articleNumbers) {
                    <div class="flex gap-1 mt-1 flex-wrap">
                      @for (art of item.articleNumbers.split(','); track art) {
                        <span class="px-1 py-0.5 rounded text-[9px] font-mono text-violet-400 bg-violet-500/10">Art.{{ art.trim() }}</span>
                      }
                    </div>
                  }
                  <div class="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                    <span>v{{ item.version }}</span>
                    <span>{{ formatSize(item.fileSize) }}</span>
                    @if (item.expiryDate) {
                      <span [class]="isExpiringSoon(item.expiryDate) ? 'text-amber-400' : ''">
                        {{ lang.t('evidence.expires') }}: {{ item.expiryDate }}
                      </span>
                    }
                    @if (item.verifiedBy) {
                      <span class="text-blue-600">{{ lang.t('evidence.by') }} {{ item.verifiedBy }}</span>
                    }
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-1">
                  <button (click)="downloadFile(item)" title="Download"
                          class="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-100 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3"/>
                    </svg>
                  </button>
                  @if (item.status !== 'VERIFIED') {
                    <button (click)="startVerify(item)" title="Verify"
                            class="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </button>
                  }
                  <button (click)="startNewVersion(item)" title="Upload new version"
                          class="p-2 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-slate-100 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                    </svg>
                  </button>
                  <button (click)="deleteItem(item.id)" title="Delete"
                          class="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-100 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- COVERAGE MAP VIEW -->
      @if (!loading() && viewMode === 'coverage' && coverage()) {
        <div class="space-y-6">
          @for (group of pillarArticleGroups; track group.pillar) {
            <div class="bg-white border border-slate-200 rounded-xl p-4">
              <h3 class="text-sm font-semibold text-slate-900 mb-3">{{ group.label }}</h3>
              <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                @for (art of group.articles; track art) {
                  <div class="p-2 rounded-lg text-center text-xs font-medium transition-all"
                       [class]="getArticleCoverage(art) > 0 ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-slate-100 text-slate-500 border border-slate-300/30'">
                    <div class="font-bold">Art. {{ art }}</div>
                    <div class="text-[10px] mt-0.5">{{ getArticleCoverage(art) }} {{ lang.t('evidence.docs_short') }}</div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Hidden file input for new version -->
      <input #versionInput type="file" class="hidden" (change)="onVersionFileSelected($event)"
             accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg">
    </div>
  `
})
export class EvidenceVaultComponent implements OnInit {
  loading = signal(true);
  uploading = signal(false);
  items = signal<EvidenceItem[]>([]);
  stats = signal<EvidenceStats | null>(null);
  coverage = signal<EvidenceCoverage | null>(null);
  docCount = signal(0);

  showUpload = false;
  showVerify = false;
  viewMode: 'list' | 'coverage' = 'list';
  activeStatus = '';
  activePillar = '';
  activeCategory = '';
  dragOver = false;
  selectedFile: File | null = null;
  verifyName = '';
  verifyItemId = '';
  versionItemId = '';

  uploadForm = {
    title: '', category: 'POLICY', pillar: 'ICT_RISK_MANAGEMENT',
    description: '', expiryDate: ''
  };

  selectedArticles = new Set<number>();

  doraArticles = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 45];

  statusFilters = [
    { value: '', et: 'Kõik', en: 'All' },
    { value: 'PENDING', et: 'Ootel', en: 'Pending' },
    { value: 'VERIFIED', et: 'Kinnitatud', en: 'Verified' },
    { value: 'EXPIRED', et: 'Aegunud', en: 'Expired' }
  ];

  categories = [
    { value: 'POLICY', et: 'Poliitika', en: 'Policy' },
    { value: 'PROCEDURE', et: 'Protseduur', en: 'Procedure' },
    { value: 'TEST_REPORT', et: 'Testiraport', en: 'Test Report' },
    { value: 'TRAINING_CERTIFICATE', et: 'Koolitustunnistus', en: 'Training Certificate' },
    { value: 'CONTRACT', et: 'Leping', en: 'Contract' },
    { value: 'MEETING_MINUTES', et: 'Koosoleku protokoll', en: 'Meeting Minutes' },
    { value: 'AUDIT_REPORT', et: 'Auditiraport', en: 'Audit Report' },
    { value: 'RISK_ASSESSMENT', et: 'Riskihinnang', en: 'Risk Assessment' },
    { value: 'OTHER', et: 'Muu', en: 'Other' }
  ];

  pillars = [
    { value: 'ICT_RISK_MANAGEMENT', label: 'ICT Risk Management' },
    { value: 'INCIDENT_MANAGEMENT', label: 'Incident Management' },
    { value: 'TESTING', label: 'Resilience Testing' },
    { value: 'THIRD_PARTY', label: 'Third-Party Risk' },
    { value: 'INFORMATION_SHARING', label: 'Information Sharing' }
  ];

  pillarArticleGroups = [
    { pillar: 'ICT_RISK_MANAGEMENT', label: 'ICT Risk Management (Art. 6-16)', articles: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] },
    { pillar: 'INCIDENT_MANAGEMENT', label: 'Incident Management (Art. 17-23)', articles: [17, 18, 19, 20, 21, 22, 23] },
    { pillar: 'TESTING', label: 'Resilience Testing (Art. 24-27)', articles: [24, 25, 26, 27] },
    { pillar: 'THIRD_PARTY', label: 'Third-Party Risk (Art. 28-30)', articles: [28, 29, 30] },
    { pillar: 'INFORMATION_SHARING', label: 'Information Sharing (Art. 45)', articles: [45] }
  ];

  constructor(private api: ApiService, public lang: LangService, public subscriptionService: SubscriptionService) {}

  ngOnInit() { this.loadData(); }

  loadData() {
    this.loading.set(true);
    const params: any = {};
    if (this.activePillar) params.pillar = this.activePillar;
    if (this.activeStatus) params.status = this.activeStatus;

    this.api.getEvidence(params).subscribe({
      next: (data) => { this.items.set(data); this.docCount.set(data.length); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.api.getEvidenceStats().subscribe({ next: (s) => this.stats.set(s) });
    this.api.getEvidenceCoverage().subscribe({ next: (c) => this.coverage.set(c) });
  }

  filteredItems(): EvidenceItem[] {
    let result = this.items();
    if (this.activeCategory) {
      result = result.filter(i => i.category === this.activeCategory);
    }
    return result;
  }

  applyFilters() {
    // Category is filtered client-side
  }

  onDragOver(e: DragEvent) { e.preventDefault(); this.dragOver = true; }
  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragOver = false;
    if (e.dataTransfer?.files?.length) {
      this.selectedFile = e.dataTransfer.files[0];
      if (!this.uploadForm.title) {
        this.uploadForm.title = this.selectedFile.name.replace(/\.[^.]+$/, '');
      }
    }
  }
  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      if (!this.uploadForm.title) {
        this.uploadForm.title = this.selectedFile.name.replace(/\.[^.]+$/, '');
      }
    }
  }

  toggleArticle(art: number) {
    if (this.selectedArticles.has(art)) this.selectedArticles.delete(art);
    else this.selectedArticles.add(art);
  }

  doUpload() {
    if (!this.selectedFile || !this.uploadForm.title) return;
    this.uploading.set(true);

    const fd = new FormData();
    fd.append('file', this.selectedFile);
    fd.append('title', this.uploadForm.title);
    fd.append('category', this.uploadForm.category);
    fd.append('pillar', this.uploadForm.pillar);
    if (this.uploadForm.description) fd.append('description', this.uploadForm.description);
    if (this.uploadForm.expiryDate) fd.append('expiryDate', this.uploadForm.expiryDate);
    if (this.selectedArticles.size > 0) {
      fd.append('articleNumbers', Array.from(this.selectedArticles).sort((a, b) => a - b).join(','));
    }

    this.api.uploadEvidence(fd).subscribe({
      next: () => {
        this.uploading.set(false);
        this.showUpload = false;
        this.resetUploadForm();
        this.loadData();
      },
      error: () => this.uploading.set(false)
    });
  }

  resetUploadForm() {
    this.selectedFile = null;
    this.uploadForm = { title: '', category: 'POLICY', pillar: 'ICT_RISK_MANAGEMENT', description: '', expiryDate: '' };
    this.selectedArticles.clear();
  }

  downloadFile(item: EvidenceItem) {
    this.api.downloadEvidence(item.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.fileName;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => console.warn('Failed to download file:', item.fileName)
    });
  }

  startVerify(item: EvidenceItem) {
    this.verifyItemId = item.id;
    this.verifyName = '';
    this.showVerify = true;
  }

  confirmVerify() {
    if (!this.verifyName) return;
    this.api.verifyEvidence(this.verifyItemId, this.verifyName).subscribe({
      next: () => { this.showVerify = false; this.loadData(); },
      error: () => { this.showVerify = false; }
    });
  }

  startNewVersion(item: EvidenceItem) {
    this.versionItemId = item.id;
    const input = document.querySelector('input[type="file"].hidden:last-of-type') as HTMLInputElement;
    if (input) input.click();
  }

  onVersionFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.length && this.versionItemId) {
      const fd = new FormData();
      fd.append('file', input.files[0]);
      this.api.uploadEvidenceVersion(this.versionItemId, fd).subscribe({
        next: () => { this.loadData(); input.value = ''; },
        error: () => { input.value = ''; }
      });
    }
  }

  deleteItem(id: string) {
    this.api.deleteEvidence(id).subscribe({
      next: () => this.loadData(),
      error: () => console.warn('Failed to delete evidence item:', id)
    });
  }

  exportZip() {
    this.api.exportEvidenceZip().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'evidence-vault-export.zip';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => console.warn('Failed to export evidence ZIP')
    });
  }

  getArticleCoverage(art: number): number {
    const c = this.coverage();
    if (!c?.articles) return 0;
    return c.articles[art] || 0;
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getFileExt(name: string): string {
    return name.split('.').pop()?.toUpperCase() || '?';
  }

  getFileIconClass(mime: string): string {
    if (mime?.includes('pdf')) return 'bg-red-500/10 text-red-400';
    if (mime?.includes('word') || mime?.includes('document')) return 'bg-blue-500/10 text-blue-400';
    if (mime?.includes('sheet') || mime?.includes('excel')) return 'bg-green-500/10 text-green-400';
    if (mime?.includes('image')) return 'bg-violet-500/10 text-violet-400';
    return 'bg-slate-50 text-slate-400';
  }

  getCategoryLabel(cat: string): string {
    const found = this.categories.find(c => c.value === cat);
    return found ? this.lang.l(found.et, found.en) : cat;
  }

  getPillarLabel(pillar: string): string {
    const found = this.pillars.find(p => p.value === pillar);
    return found ? found.label : pillar;
  }

  isExpiringSoon(dateStr: string): boolean {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000; // within 30 days
  }
}
