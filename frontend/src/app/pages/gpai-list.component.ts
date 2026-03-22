import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LangService } from '../lang.service';

interface GpaiModel {
  id: string;
  name: string;
  provider: string;
  modelType: 'GENERAL' | 'FOUNDATION' | 'OPEN_SOURCE';
  hasSystemicRisk: boolean;
  trainingComputeFlops: number | null;
  description: string;
  version: string;
  openSource: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GpaiObligation {
  id: string;
  gpaiModelId: string;
  title: string;
  description: string;
  articleReference: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_APPLICABLE';
  createdAt: string;
  updatedAt: string;
}

interface NewGpaiModel {
  name: string;
  provider: string;
  modelType: 'GENERAL' | 'FOUNDATION' | 'OPEN_SOURCE';
  hasSystemicRisk: boolean;
  trainingComputeFlops: number | null;
  description: string;
  version: string;
  openSource: boolean;
}

@Component({
  selector: 'app-gpai-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in-up">
        <div>
          <h1 class="text-3xl font-bold mb-1">
            <span class="gradient-text">{{ lang.l('GPAI mudelid', 'GPAI Models') }}</span>
          </h1>
          <p class="text-slate-400 text-sm">
            {{ lang.l('Halda oma uldotstarbelise tehisintellekti mudeleid ja nende kohustusi', 'Manage your general-purpose AI models and their obligations') }}
          </p>
        </div>
        <button type="button" (click)="toggleForm()"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                       bg-blue-600 hover:bg-blue-700
                       text-slate-900 hover:shadow-lg hover:shadow-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          {{ lang.l('Lisa uus mudel', 'Add New Model') }}
        </button>
      </div>

      <!-- Inline Create Form -->
      @if (showForm()) {
        <div class="bg-white border border-slate-200 rounded-xl p-6 mb-8 animate-fade-in-up">
          <h2 class="text-lg font-semibold text-slate-900 mb-5">{{ lang.l('Uue mudeli lisamine', 'Add New GPAI Model') }}</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <!-- Name -->
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">{{ lang.l('Nimi', 'Name') }} *</label>
              <input type="text" [(ngModel)]="formData.name"
                     class="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm
                            placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                     [placeholder]="lang.l('nt. GPT-4o', 'e.g. GPT-4o')"/>
            </div>

            <!-- Provider -->
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">{{ lang.l('Pakkuja', 'Provider') }} *</label>
              <input type="text" [(ngModel)]="formData.provider"
                     class="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm
                            placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                     [placeholder]="lang.l('nt. OpenAI', 'e.g. OpenAI')"/>
            </div>

            <!-- Model Type -->
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">{{ lang.l('Mudeli tuup', 'Model Type') }}</label>
              <select [(ngModel)]="formData.modelType"
                      class="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all">
                <option value="GENERAL">{{ lang.l('Uldotstarbeline', 'General') }}</option>
                <option value="FOUNDATION">{{ lang.l('Alusmudel', 'Foundation') }}</option>
                <option value="OPEN_SOURCE">{{ lang.l('Avatud lahtekood', 'Open Source') }}</option>
              </select>
            </div>

            <!-- Version -->
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">{{ lang.l('Versioon', 'Version') }}</label>
              <input type="text" [(ngModel)]="formData.version"
                     class="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm
                            placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                     [placeholder]="lang.l('nt. 1.0', 'e.g. 1.0')"/>
            </div>

            <!-- Training Compute FLOPS -->
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">{{ lang.l('Treeningu arvutus (FLOPS)', 'Training Compute (FLOPS)') }}</label>
              <input type="number" [(ngModel)]="formData.trainingComputeFlops"
                     class="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm
                            placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                     [placeholder]="lang.l('nt. 1e25', 'e.g. 1e25')"/>
            </div>

            <!-- Description -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-slate-600 mb-1.5">{{ lang.l('Kirjeldus', 'Description') }}</label>
              <textarea [(ngModel)]="formData.description" rows="3"
                        class="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm
                               placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
                        [placeholder]="lang.l('Mudeli kirjeldus...', 'Model description...')"></textarea>
            </div>

            <!-- Checkboxes row -->
            <div class="md:col-span-2 flex flex-wrap gap-6">
              <!-- Systemic Risk -->
              <label class="flex items-center gap-2.5 cursor-pointer group">
                <input type="checkbox" [(ngModel)]="formData.hasSystemicRisk"
                       class="w-4.5 h-4.5 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500/50 focus:ring-offset-0 cursor-pointer"/>
                <span class="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                  {{ lang.l('Susteemne risk', 'Systemic Risk') }}
                </span>
              </label>

              <!-- Open Source -->
              <label class="flex items-center gap-2.5 cursor-pointer group">
                <input type="checkbox" [(ngModel)]="formData.openSource"
                       class="w-4.5 h-4.5 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500/50 focus:ring-offset-0 cursor-pointer"/>
                <span class="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                  {{ lang.l('Avatud lahtekood', 'Open Source') }}
                </span>
              </label>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-slate-200">
            <button type="button" (click)="toggleForm()"
                    class="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">
              {{ lang.l('Tuhista', 'Cancel') }}
            </button>
            <button type="button" (click)="createModel()" [disabled]="saving() || !formData.name || !formData.provider"
                    class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                           bg-blue-600 hover:bg-blue-700
                           text-slate-900 hover:shadow-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
              @if (saving()) {
                <div class="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
              }
              {{ lang.l('Salvesta', 'Save Model') }}
            </button>
          </div>
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="text-center py-20 animate-fade-in">
          <div class="inline-block w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p class="text-slate-500 text-sm mt-4">{{ lang.l('Laadin mudeleid...', 'Loading models...') }}</p>
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
      @if (!loading() && !error() && models().length === 0) {
        <div class="text-center py-20 animate-fade-in-up">
          <div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
            <svg class="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-slate-900 mb-2">{{ lang.l('GPAI mudeleid ei leitud', 'No GPAI Models Found') }}</h3>
          <p class="text-slate-400 text-sm max-w-md mx-auto mb-6">
            {{ lang.l('Alustage oma uldotstarbelise tehisintellekti mudelite haldamist, lisades oma esimese mudeli.',
                       'Start managing your general-purpose AI models by adding your first model.') }}
          </p>
          <button type="button" (click)="toggleForm()"
                  class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold
                         bg-blue-600 hover:bg-blue-700
                         text-slate-900 hover:shadow-lg hover:shadow-lg transition-all duration-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            {{ lang.l('Lisa esimene mudel', 'Add Your First Model') }}
          </button>
        </div>
      }

      <!-- Models Grid -->
      @if (!loading() && models().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          @for (model of models(); track model.id) {
            <div class="bg-white border border-slate-200 rounded-xl transition-all duration-200 hover:border-slate-200 hover:shadow-lg hover:shadow-black/10"
                 [ngClass]="expandedId() === model.id ? 'ring-2 ring-blue-600/30' : ''">
              <!-- Card Header -->
              <div class="p-5 cursor-pointer" (click)="toggleExpand(model.id)">
                <div class="flex items-start justify-between gap-3 mb-3">
                  <div class="min-w-0">
                    <h3 class="text-base font-semibold text-slate-900 truncate">{{ model.name }}</h3>
                    <p class="text-xs text-slate-500 mt-0.5">{{ model.provider }}</p>
                  </div>
                  <button type="button" (click)="deleteModel(model.id, $event)"
                          class="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                          [title]="lang.l('Kustuta', 'Delete')">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>

                <!-- Badges -->
                <div class="flex flex-wrap gap-1.5 mb-3">
                  <!-- Model Type Badge -->
                  <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium"
                        [class]="getModelTypeBadgeClass(model.modelType)">
                    {{ getModelTypeLabel(model.modelType) }}
                  </span>

                  <!-- Systemic Risk Badge -->
                  @if (model.hasSystemicRisk) {
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-red-500/15 text-red-400 border border-red-500/20">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                      </svg>
                      {{ lang.l('Susteemne risk', 'Systemic Risk') }}
                    </span>
                  }

                  <!-- Open Source Badge -->
                  @if (model.openSource) {
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-600/15 text-blue-500 border border-blue-500/20">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                      </svg>
                      {{ lang.l('Avatud', 'Open Source') }}
                    </span>
                  }
                </div>

                @if (model.version) {
                  <p class="text-xs text-slate-500">
                    {{ lang.l('Versioon', 'Version') }}: {{ model.version }}
                  </p>
                }

                <!-- Expand indicator -->
                <div class="flex items-center justify-center mt-3 pt-3 border-t border-slate-200">
                  <svg class="w-4 h-4 text-slate-500 transition-transform duration-200"
                       [class.rotate-180]="expandedId() === model.id"
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                  <span class="text-xs text-slate-500 ml-1.5">
                    {{ expandedId() === model.id
                      ? lang.l('Peida kohustused', 'Hide obligations')
                      : lang.l('Naita kohustusi', 'Show obligations') }}
                  </span>
                </div>
              </div>

              <!-- Expanded Obligations Section -->
              @if (expandedId() === model.id) {
                <div class="border-t border-slate-200 px-5 pb-5 pt-4 animate-fade-in">
                  @if (obligationsLoading()) {
                    <div class="flex items-center justify-center py-6">
                      <div class="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                  } @else if (obligations().length === 0) {
                    <p class="text-sm text-slate-500 text-center py-4">
                      {{ lang.l('Kohustusi ei leitud', 'No obligations found') }}
                    </p>
                  } @else {
                    <h4 class="text-xs uppercase tracking-wider text-slate-500 font-medium mb-3">
                      {{ lang.l('Kohustused', 'Obligations') }} ({{ obligations().length }})
                    </h4>
                    <div class="space-y-2.5">
                      @for (obligation of obligations(); track obligation.id) {
                        <div class="bg-white border border-slate-200 rounded-lg p-3.5">
                          <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0 flex-1">
                              <p class="text-sm font-medium text-slate-900">{{ obligation.title }}</p>
                              @if (obligation.articleReference) {
                                <p class="text-[11px] text-slate-500 mt-0.5">{{ obligation.articleReference }}</p>
                              }
                              @if (obligation.description) {
                                <p class="text-xs text-slate-400 mt-1.5 line-clamp-2">{{ obligation.description }}</p>
                              }
                            </div>
                            <!-- Status Dropdown -->
                            <select [ngModel]="obligation.status"
                                    (ngModelChange)="updateObligationStatus(model.id, obligation.id, $event)"
                                    class="text-[11px] font-medium rounded-md px-2 py-1 border cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500/50 shrink-0"
                                    [class]="getStatusSelectClass(obligation.status)">
                              <option value="NOT_STARTED">{{ lang.l('Alustamata', 'Not Started') }}</option>
                              <option value="IN_PROGRESS">{{ lang.l('Pooleli', 'In Progress') }}</option>
                              <option value="COMPLETED">{{ lang.l('Valmis', 'Completed') }}</option>
                              <option value="NOT_APPLICABLE">{{ lang.l('Ei kohaldu', 'N/A') }}</option>
                            </select>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `
})
export class GpaiListComponent implements OnInit {
  lang = inject(LangService);
  private http = inject(HttpClient);

  models = signal<GpaiModel[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  saving = signal(false);
  showForm = signal(false);
  expandedId = signal<string | null>(null);
  obligations = signal<GpaiObligation[]>([]);
  obligationsLoading = signal(false);

  formData: NewGpaiModel = this.getEmptyForm();

  ngOnInit(): void {
    this.loadModels();
  }

  private getEmptyForm(): NewGpaiModel {
    return {
      name: '',
      provider: '',
      modelType: 'GENERAL',
      hasSystemicRisk: false,
      trainingComputeFlops: null,
      description: '',
      version: '',
      openSource: false
    };
  }

  toggleForm(): void {
    this.showForm.update(v => !v);
    if (!this.showForm()) {
      this.formData = this.getEmptyForm();
    }
  }

  loadModels(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<GpaiModel[]>('/api/gpai-models').subscribe({
      next: (data) => {
        this.models.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || this.lang.l('Mudelite laadimine ebaonnestus', 'Failed to load models'));
        this.loading.set(false);
      }
    });
  }

  createModel(): void {
    if (!this.formData.name || !this.formData.provider) return;
    this.saving.set(true);
    this.http.post<GpaiModel>('/api/gpai-models', this.formData).subscribe({
      next: (created) => {
        this.models.update(list => [created, ...list]);
        this.formData = this.getEmptyForm();
        this.showForm.set(false);
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || this.lang.l('Mudeli loomine ebaonnestus', 'Failed to create model'));
        this.saving.set(false);
      }
    });
  }

  deleteModel(id: string, event: Event): void {
    event.stopPropagation();
    const confirmMsg = this.lang.l('Kas oled kindel, et soovid selle mudeli kustutada?', 'Are you sure you want to delete this model?');
    if (!confirm(confirmMsg)) return;

    this.http.delete(`/api/gpai-models/${id}`).subscribe({
      next: () => {
        this.models.update(list => list.filter(m => m.id !== id));
        if (this.expandedId() === id) {
          this.expandedId.set(null);
          this.obligations.set([]);
        }
      },
      error: (err) => {
        this.error.set(err?.error?.message || this.lang.l('Kustutamine ebaonnestus', 'Failed to delete model'));
      }
    });
  }

  toggleExpand(modelId: string): void {
    if (this.expandedId() === modelId) {
      this.expandedId.set(null);
      this.obligations.set([]);
    } else {
      this.expandedId.set(modelId);
      this.loadObligations(modelId);
    }
  }

  loadObligations(modelId: string): void {
    this.obligationsLoading.set(true);
    this.obligations.set([]);
    this.http.get<GpaiObligation[]>(`/api/gpai-models/${modelId}/obligations`).subscribe({
      next: (data) => {
        this.obligations.set(data);
        this.obligationsLoading.set(false);
      },
      error: () => {
        this.obligations.set([]);
        this.obligationsLoading.set(false);
      }
    });
  }

  updateObligationStatus(modelId: string, obligationId: string, status: string): void {
    this.http.patch<GpaiObligation>(`/api/gpai-models/${modelId}/obligations/${obligationId}`, { status }).subscribe({
      next: (updated) => {
        this.obligations.update(list =>
          list.map(o => o.id === obligationId ? { ...o, status: status as GpaiObligation['status'] } : o)
        );
      },
      error: (err) => {
        this.error.set(err?.error?.message || this.lang.l('Staatuse uuendamine ebaonnestus', 'Failed to update status'));
      }
    });
  }

  getModelTypeBadgeClass(type: string): string {
    switch (type) {
      case 'FOUNDATION':
        return 'bg-purple-500/15 text-purple-400 border border-purple-500/20';
      case 'OPEN_SOURCE':
        return 'bg-blue-600/15 text-blue-500 border border-blue-500/20';
      default:
        return 'bg-slate-100 text-slate-600 border border-slate-300/30';
    }
  }

  getModelTypeLabel(type: string): string {
    switch (type) {
      case 'FOUNDATION': return this.lang.l('Alusmudel', 'Foundation');
      case 'OPEN_SOURCE': return this.lang.l('Avatud lahtekood', 'Open Source');
      default: return this.lang.l('Uldotstarbeline', 'General');
    }
  }

  getStatusSelectClass(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
      case 'NOT_APPLICABLE':
        return 'bg-slate-100 text-slate-400 border-slate-300/30';
      default:
        return 'bg-white text-slate-400 border-slate-200';
    }
  }
}
