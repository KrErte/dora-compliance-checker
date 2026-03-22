import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';

interface EntityOption {
  type: string;
  titleKey: string;
  descKey: string;
  icon: string;
  color: string;
}

interface ColumnMapping {
  csvColumn: string;
  targetField: string;
  options: string[];
}

interface ValidationError {
  row: number;
  column: string;
  message: string;
}

@Component({
  selector: 'app-bulk-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 max-w-4xl mx-auto">

      <!-- Header -->
      <div class="text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-4">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
          </svg>
          {{ lang.t('bulk.badge') }}
        </div>
        <h1 class="text-3xl font-bold text-slate-900 mb-3">{{ lang.t('bulk.title') }}</h1>
        <p class="text-slate-400 max-w-2xl mx-auto">{{ lang.t('bulk.subtitle') }}</p>
      </div>

      <!-- Step indicator -->
      <div class="flex items-center justify-center gap-2">
        @for (s of stepKeys; track s; let i = $index) {
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                 [class]="currentStep() > i ? 'bg-blue-100 text-blue-600 border border-blue-200' :
                          currentStep() === i ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' :
                          'bg-slate-700/50 text-slate-500 border border-slate-200'">
              @if (currentStep() > i) {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              } @else {
                {{ i + 1 }}
              }
            </div>
            <span class="text-xs hidden sm:block" [class]="currentStep() === i ? 'text-slate-900 font-medium' : 'text-slate-500'">{{ lang.t(s) }}</span>
            @if (i < stepKeys.length - 1) {
              <div class="w-8 h-0.5" [class]="currentStep() > i ? 'bg-blue-600/30' : 'bg-slate-700'"></div>
            }
          </div>
        }
      </div>

      <!-- Progress bar -->
      <div class="w-full bg-slate-700/50 rounded-full h-1.5">
        <div class="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
             [style.width.%]="((currentStep() + 1) / stepKeys.length) * 100"></div>
      </div>

      <!-- ═══════════════════════════════════════════════════ -->
      <!-- STEP 0: Select Entity Type                         -->
      <!-- ═══════════════════════════════════════════════════ -->
      @if (currentStep() === 0) {
        <div class="animate-fade-in-up">
          <h2 class="text-lg font-semibold text-slate-900 mb-6 text-center">{{ lang.t('bulk.step0_title') }}</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            @for (entity of entityOptions; track entity.type) {
              <button (click)="selectEntity(entity.type)"
                      class="group text-left bg-white border rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/5"
                      [class]="selectedEntity() === entity.type
                        ? 'border-violet-500/50 bg-violet-500/5 ring-1 ring-violet-500/20'
                        : 'border-slate-200 hover:border-slate-200'">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                       [class]="entity.color">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      @if (entity.icon === 'clipboard') {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                      }
                      @if (entity.icon === 'server') {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/>
                      }
                      @if (entity.icon === 'users') {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                      }
                      @if (entity.icon === 'document') {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      }
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-slate-900 font-semibold text-sm group-hover:text-violet-300 transition-colors">{{ lang.t(entity.titleKey) }}</h3>
                    <p class="text-slate-400 text-xs mt-1 leading-relaxed">{{ lang.t(entity.descKey) }}</p>
                  </div>
                </div>
                @if (selectedEntity() === entity.type) {
                  <div class="mt-3 flex justify-end">
                    <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                }
              </button>
            }
          </div>

          <div class="flex justify-end mt-8">
            <button (click)="goToStep(1)" [disabled]="!selectedEntity()"
                    class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
              {{ lang.t('bulk.next') }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      }

      <!-- ═══════════════════════════════════════════════════ -->
      <!-- STEP 1: Upload File                                -->
      <!-- ═══════════════════════════════════════════════════ -->
      @if (currentStep() === 1) {
        <div class="animate-fade-in-up">
          <div class="bg-white border border-slate-200 rounded-2xl p-8">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-semibold text-slate-900">{{ lang.t('bulk.step1_title') }}</h2>
              <button (click)="downloadTemplate()"
                      class="px-4 py-2 rounded-xl bg-slate-700/50 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-all flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                {{ lang.t('bulk.download_template') }}
              </button>
            </div>

            <!-- Drop zone -->
            <div class="relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer"
                 [class]="dragOver() ? 'border-violet-400 bg-violet-500/5' : 'border-slate-200 hover:border-slate-500/50'"
                 (dragover)="onDragOver($event)"
                 (dragleave)="onDragLeave($event)"
                 (drop)="onDrop($event)"
                 (click)="fileInput.click()">
              <input #fileInput type="file" class="hidden" accept=".csv,.xlsx,.xls"
                     (change)="onFileSelected($event)"/>

              @if (!selectedFile()) {
                <div class="space-y-4">
                  <div class="mx-auto w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center">
                    <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                  </div>
                  <div>
                    <p class="text-slate-900 font-medium">{{ lang.t('bulk.drop_files') }}</p>
                    <p class="text-slate-500 text-sm mt-1">{{ lang.t('bulk.drop_hint') }}</p>
                  </div>
                  <p class="text-slate-600 text-xs">{{ lang.t('bulk.max_size') }}</p>
                </div>
              } @else {
                <div class="space-y-3">
                  <div class="mx-auto w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <p class="text-slate-900 font-medium">{{ selectedFile()!.name }}</p>
                  <p class="text-slate-500 text-xs">{{ formatFileSize(selectedFile()!.size) }}</p>
                  <button (click)="clearFile($event)"
                          class="text-red-400 text-xs hover:text-red-300 underline transition-colors">
                    {{ lang.t('bulk.remove_file') }}
                  </button>
                </div>
              }
            </div>

            @if (fileError()) {
              <div class="mt-4 bg-red-900/20 border border-red-700/30 rounded-xl p-3 text-red-400 text-sm flex items-center gap-2">
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {{ fileError() }}
              </div>
            }
          </div>

          <div class="flex justify-between mt-8">
            <button (click)="goToStep(0)"
                    class="px-6 py-2.5 rounded-xl bg-slate-700/50 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-all flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              {{ lang.t('bulk.back') }}
            </button>
            <button (click)="uploadAndValidate()" [disabled]="!selectedFile() || uploading()"
                    class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
              @if (uploading()) {
                <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {{ lang.t('bulk.uploading') }}
              } @else {
                {{ lang.t('bulk.next') }}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              }
            </button>
          </div>
        </div>
      }

      <!-- ═══════════════════════════════════════════════════ -->
      <!-- STEP 2: Column Mapping                             -->
      <!-- ═══════════════════════════════════════════════════ -->
      @if (currentStep() === 2) {
        <div class="animate-fade-in-up">
          <div class="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 class="text-lg font-semibold text-slate-900 mb-2">{{ lang.t('bulk.step2_title') }}</h2>
            <p class="text-slate-400 text-sm mb-6">{{ lang.t('bulk.step2_desc') }}</p>

            <!-- Mapping table -->
            <div class="space-y-3">
              @for (mapping of columnMappings(); track mapping.csvColumn) {
                <div class="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-4">
                  <div class="flex-1">
                    <span class="text-xs text-slate-500 uppercase tracking-wider">{{ lang.t('bulk.csv_column') }}</span>
                    <p class="text-slate-900 font-medium text-sm mt-0.5">{{ mapping.csvColumn }}</p>
                  </div>
                  <div class="shrink-0">
                    <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                    </svg>
                  </div>
                  <div class="flex-1">
                    <span class="text-xs text-slate-500 uppercase tracking-wider">{{ lang.t('bulk.target_field') }}</span>
                    <select [(ngModel)]="mapping.targetField"
                            class="mt-0.5 w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-violet-500/50">
                      <option value="">-- {{ lang.t('bulk.skip_column') }} --</option>
                      @for (opt of mapping.options; track opt) {
                        <option [value]="opt">{{ opt }}</option>
                      }
                    </select>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Preview rows -->
          @if (previewRows().length > 0) {
            <div class="mt-6 bg-white border border-slate-200 rounded-2xl p-6 overflow-x-auto">
              <h3 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                {{ lang.t('bulk.preview') }}
              </h3>
              <table class="w-full text-xs">
                <thead>
                  <tr>
                    <th class="text-left text-slate-500 font-medium pb-2 pr-4 whitespace-nowrap">#</th>
                    @for (col of previewHeaders(); track col) {
                      <th class="text-left text-slate-500 font-medium pb-2 pr-4 whitespace-nowrap">{{ col }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (row of previewRows(); track $index; let i = $index) {
                    <tr class="border-t border-slate-200">
                      <td class="py-2 pr-4 text-slate-600">{{ i + 1 }}</td>
                      @for (col of previewHeaders(); track col) {
                        <td class="py-2 pr-4 text-slate-600 whitespace-nowrap max-w-[200px] truncate">{{ row[col] || '-' }}</td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <div class="flex justify-between mt-8">
            <button (click)="goToStep(1)"
                    class="px-6 py-2.5 rounded-xl bg-slate-700/50 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-all flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              {{ lang.t('bulk.back') }}
            </button>
            <button (click)="goToStep(3)"
                    class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-violet-500/25 transition-all flex items-center gap-2">
              {{ lang.t('bulk.next') }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      }

      <!-- ═══════════════════════════════════════════════════ -->
      <!-- STEP 3: Validation Results                         -->
      <!-- ═══════════════════════════════════════════════════ -->
      @if (currentStep() === 3) {
        <div class="animate-fade-in-up">
          <!-- Summary stats -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div class="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <div class="text-2xl font-bold text-slate-900">{{ totalRows() }}</div>
              <div class="text-xs text-slate-400 mt-1">{{ lang.t('bulk.total_rows') }}</div>
            </div>
            <div class="bg-white border border-blue-200 rounded-xl p-4 text-center">
              <div class="text-2xl font-bold text-blue-600">{{ validRows() }}</div>
              <div class="text-xs text-slate-400 mt-1">{{ lang.t('bulk.valid_rows') }}</div>
            </div>
            <div class="bg-white border border-red-500/30 rounded-xl p-4 text-center">
              <div class="text-2xl font-bold text-red-400">{{ errorRows() }}</div>
              <div class="text-xs text-slate-400 mt-1">{{ lang.t('bulk.error_rows') }}</div>
            </div>
            <div class="bg-white border border-amber-500/30 rounded-xl p-4 text-center">
              <div class="text-2xl font-bold text-amber-400">{{ warningCount() }}</div>
              <div class="text-xs text-slate-400 mt-1">{{ lang.t('bulk.warnings') }}</div>
            </div>
          </div>

          <!-- Validation progress bar -->
          <div class="bg-white border border-slate-200 rounded-xl p-4 mb-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-slate-600">{{ lang.t('bulk.validation_rate') }}</span>
              <span class="text-sm font-semibold" [class]="validRows() === totalRows() ? 'text-blue-600' : 'text-amber-400'">
                {{ totalRows() > 0 ? ((validRows() / totalRows()) * 100).toFixed(0) : 0 }}%
              </span>
            </div>
            <div class="w-full bg-slate-700/50 rounded-full h-2">
              <div class="h-2 rounded-full transition-all duration-500"
                   [class]="validRows() === totalRows() ? 'bg-blue-600' : 'bg-amber-500'"
                   [style.width.%]="totalRows() > 0 ? (validRows() / totalRows()) * 100 : 0"></div>
            </div>
          </div>

          <!-- Error list -->
          @if (validationErrors().length > 0) {
            <div class="bg-white border border-red-500/20 rounded-2xl p-6 mb-6">
              <h3 class="text-sm font-semibold text-red-400 mb-4 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {{ lang.t('bulk.errors_found') }}
              </h3>
              <div class="space-y-2 max-h-60 overflow-y-auto pr-2">
                @for (err of validationErrors(); track $index) {
                  <div class="flex items-start gap-3 bg-red-900/10 border border-red-800/20 rounded-lg p-3">
                    <span class="shrink-0 px-2 py-0.5 bg-red-500/10 text-red-400 text-xs font-mono rounded">
                      {{ lang.t('bulk.row') }} {{ err.row }}
                    </span>
                    <div class="min-w-0">
                      <span class="text-slate-400 text-xs">{{ err.column }}:</span>
                      <p class="text-red-300 text-sm">{{ err.message }}</p>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          @if (validRows() === totalRows() && totalRows() > 0) {
            <div class="bg-blue-950/10 border border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <svg class="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-blue-500 text-sm font-medium">{{ lang.t('bulk.all_valid') }}</p>
            </div>
          }

          <div class="flex justify-between mt-8">
            <button (click)="goToStep(2)"
                    class="px-6 py-2.5 rounded-xl bg-slate-700/50 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-all flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              {{ lang.t('bulk.back') }}
            </button>
            <button (click)="executeImport()" [disabled]="validRows() === 0 || importing()"
                    class="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
              @if (importing()) {
                <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {{ lang.t('bulk.importing') }}
              } @else {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
                {{ lang.t('bulk.import_now') }} ({{ validRows() }} {{ lang.t('bulk.rows_lc') }})
              }
            </button>
          </div>
        </div>
      }

      <!-- ═══════════════════════════════════════════════════ -->
      <!-- STEP 4: Import Summary                             -->
      <!-- ═══════════════════════════════════════════════════ -->
      @if (currentStep() === 4) {
        <div class="animate-fade-in-up">
          <div class="bg-white border border-slate-200 rounded-2xl p-8 text-center">
            @if (importSuccess()) {
              <!-- Success state -->
              <div class="mx-auto w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-6">
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h2 class="text-xl font-bold text-slate-900 mb-2">{{ lang.t('bulk.import_complete') }}</h2>
              <p class="text-slate-400 text-sm mb-8">{{ lang.t('bulk.import_complete_desc') }}</p>
            } @else {
              <!-- Partial / error state -->
              <div class="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6">
                <svg class="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
              </div>
              <h2 class="text-xl font-bold text-slate-900 mb-2">{{ lang.t('bulk.import_partial') }}</h2>
              <p class="text-slate-400 text-sm mb-8">{{ lang.t('bulk.import_partial_desc') }}</p>
            }

            <!-- Result stats -->
            <div class="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
              <div class="bg-white border border-blue-200 rounded-xl p-4">
                <div class="text-2xl font-bold text-blue-600">{{ importedCount() }}</div>
                <div class="text-xs text-slate-400 mt-1">{{ lang.t('bulk.imported') }}</div>
              </div>
              <div class="bg-white border border-red-500/20 rounded-xl p-4">
                <div class="text-2xl font-bold text-red-400">{{ failedCount() }}</div>
                <div class="text-xs text-slate-400 mt-1">{{ lang.t('bulk.failed') }}</div>
              </div>
              <div class="bg-white border border-amber-500/20 rounded-xl p-4">
                <div class="text-2xl font-bold text-amber-400">{{ skippedCount() }}</div>
                <div class="text-xs text-slate-400 mt-1">{{ lang.t('bulk.skipped') }}</div>
              </div>
            </div>

            <!-- Import errors -->
            @if (importErrors().length > 0) {
              <div class="text-left bg-red-900/10 border border-red-500/20 rounded-xl p-4 mb-8 max-w-lg mx-auto">
                <h4 class="text-sm font-semibold text-red-400 mb-3">{{ lang.t('bulk.import_errors') }}</h4>
                <div class="space-y-1.5 max-h-40 overflow-y-auto">
                  @for (err of importErrors(); track $index) {
                    <p class="text-red-300 text-xs flex items-start gap-2">
                      <span class="shrink-0 text-red-500">-</span>
                      {{ err }}
                    </p>
                  }
                </div>
              </div>
            }

            <!-- Actions -->
            <div class="flex items-center justify-center gap-4">
              <button (click)="resetWizard()"
                      class="px-6 py-2.5 rounded-xl bg-slate-700/50 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-all flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                {{ lang.t('bulk.import_another') }}
              </button>
              <button (click)="navigateToEntity()"
                      class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-violet-500/25 transition-all flex items-center gap-2">
                {{ lang.t('bulk.view_data') }}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class BulkImportComponent {
  private api = inject(ApiService);
  public lang = inject(LangService);
  private router = inject(Router);

  // Step state
  currentStep = signal(0);
  stepKeys = [
    'bulk.step_entity',
    'bulk.step_upload',
    'bulk.step_mapping',
    'bulk.step_validation',
    'bulk.step_summary'
  ];

  // Step 0: Entity selection
  selectedEntity = signal<string>('');
  entityOptions: EntityOption[] = [
    {
      type: 'remediation',
      titleKey: 'bulk.entity_remediation',
      descKey: 'bulk.entity_remediation_desc',
      icon: 'clipboard',
      color: 'bg-gradient-to-br from-blue-600 to-teal-600'
    },
    {
      type: 'ict_assets',
      titleKey: 'bulk.entity_ict',
      descKey: 'bulk.entity_ict_desc',
      icon: 'server',
      color: 'bg-gradient-to-br from-blue-500 to-indigo-600'
    },
    {
      type: 'vendors',
      titleKey: 'bulk.entity_vendors',
      descKey: 'bulk.entity_vendors_desc',
      icon: 'users',
      color: 'bg-gradient-to-br from-violet-500 to-purple-600'
    },
    {
      type: 'evidence',
      titleKey: 'bulk.entity_evidence',
      descKey: 'bulk.entity_evidence_desc',
      icon: 'document',
      color: 'bg-gradient-to-br from-amber-500 to-orange-600'
    }
  ];

  // Step 1: File upload
  selectedFile = signal<File | null>(null);
  fileError = signal('');
  dragOver = signal(false);
  uploading = signal(false);

  // Step 2: Column mapping
  columnMappings = signal<ColumnMapping[]>([]);
  previewRows = signal<Record<string, string>[]>([]);
  previewHeaders = signal<string[]>([]);

  // Step 3: Validation
  totalRows = signal(0);
  validRows = signal(0);
  errorRows = signal(0);
  warningCount = signal(0);
  validationErrors = signal<ValidationError[]>([]);

  // Step 4: Import summary
  importing = signal(false);
  importSuccess = signal(false);
  importedCount = signal(0);
  failedCount = signal(0);
  skippedCount = signal(0);
  importErrors = signal<string[]>([]);

  // Internal
  private validationResult: any = null;

  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  private readonly entityRoutes: Record<string, string> = {
    remediation: '/workspace',
    ict_assets: '/ict-asset-map',
    vendors: '/vendor-database',
    evidence: '/evidence-vault'
  };

  private readonly entityFields: Record<string, string[]> = {
    remediation: ['title', 'description', 'priority', 'status', 'dueDate', 'assignee', 'pillar', 'article'],
    ict_assets: ['name', 'type', 'vendor', 'criticality', 'location', 'owner', 'status', 'notes'],
    vendors: ['name', 'country', 'countryCode', 'serviceType', 'criticality', 'contractNumber', 'contractStart', 'contractEnd', 'riskScore'],
    evidence: ['title', 'description', 'category', 'pillar', 'status', 'expiryDate', 'tags']
  };

  selectEntity(type: string): void {
    this.selectedEntity.set(type);
  }

  goToStep(step: number): void {
    this.currentStep.set(step);
  }

  // ─── File handling ───────────────────────────────────

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File): void {
    this.fileError.set('');
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['csv', 'xlsx', 'xls'].includes(ext)) {
      this.fileError.set(this.lang.t('bulk.error_format'));
      return;
    }
    if (file.size > this.MAX_FILE_SIZE) {
      this.fileError.set(this.lang.t('bulk.error_size'));
      return;
    }
    this.selectedFile.set(file);
  }

  clearFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile.set(null);
    this.fileError.set('');
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ─── Template download ──────────────────────────────

  downloadTemplate(): void {
    const entity = this.selectedEntity();
    if (!entity) return;
    this.api.bulkImportTemplate(entity).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${entity}-template.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.fileError.set(this.lang.t('bulk.error_template'));
      }
    });
  }

  // ─── Upload & validate ──────────────────────────────

  uploadAndValidate(): void {
    const file = this.selectedFile();
    const entity = this.selectedEntity();
    if (!file || !entity) return;

    this.uploading.set(true);
    this.fileError.set('');

    this.api.bulkImportValidate(file, entity).subscribe({
      next: (result) => {
        this.validationResult = result;

        // Populate column mappings
        const detectedColumns: string[] = result.detectedColumns || [];
        const targetFields = this.entityFields[entity] || [];
        const mappings: ColumnMapping[] = detectedColumns.map((col: string) => {
          const autoMatch = targetFields.find(
            f => f.toLowerCase() === col.toLowerCase() ||
                 f.toLowerCase().replace(/[_\s]/g, '') === col.toLowerCase().replace(/[_\s]/g, '')
          ) || '';
          return {
            csvColumn: col,
            targetField: autoMatch,
            options: targetFields
          };
        });
        this.columnMappings.set(mappings);

        // Preview rows
        this.previewHeaders.set(detectedColumns);
        this.previewRows.set((result.previewRows || []).slice(0, 5));

        // Validation stats
        this.totalRows.set(result.totalRows || 0);
        this.validRows.set(result.validRows || 0);
        this.errorRows.set(result.errorRows || 0);
        this.warningCount.set(result.warnings || 0);
        this.validationErrors.set(result.errors || []);

        this.uploading.set(false);
        this.goToStep(2);
      },
      error: (err) => {
        this.uploading.set(false);
        this.fileError.set(err?.error?.message || this.lang.t('bulk.error_upload'));
      }
    });
  }

  // ─── Execute import ─────────────────────────────────

  executeImport(): void {
    if (this.importing()) return;
    this.importing.set(true);

    const mappings: Record<string, string> = {};
    for (const m of this.columnMappings()) {
      if (m.targetField) {
        mappings[m.csvColumn] = m.targetField;
      }
    }

    const body = {
      entityType: this.selectedEntity(),
      validationId: this.validationResult?.validationId,
      columnMappings: mappings,
      skipErrors: true
    };

    this.api.bulkImportExecute(body).subscribe({
      next: (result) => {
        this.importing.set(false);
        this.importedCount.set(result.imported || 0);
        this.failedCount.set(result.failed || 0);
        this.skippedCount.set(result.skipped || 0);
        this.importErrors.set(result.errors || []);
        this.importSuccess.set((result.failed || 0) === 0);
        this.goToStep(4);
      },
      error: (err) => {
        this.importing.set(false);
        this.importedCount.set(0);
        this.failedCount.set(this.validRows());
        this.skippedCount.set(0);
        this.importErrors.set([err?.error?.message || this.lang.t('bulk.error_import')]);
        this.importSuccess.set(false);
        this.goToStep(4);
      }
    });
  }

  // ─── Navigation ─────────────────────────────────────

  navigateToEntity(): void {
    const route = this.entityRoutes[this.selectedEntity()] || '/workspace';
    this.router.navigate([route]);
  }

  resetWizard(): void {
    this.currentStep.set(0);
    this.selectedEntity.set('');
    this.selectedFile.set(null);
    this.fileError.set('');
    this.dragOver.set(false);
    this.uploading.set(false);
    this.columnMappings.set([]);
    this.previewRows.set([]);
    this.previewHeaders.set([]);
    this.totalRows.set(0);
    this.validRows.set(0);
    this.errorRows.set(0);
    this.warningCount.set(0);
    this.validationErrors.set([]);
    this.importing.set(false);
    this.importSuccess.set(false);
    this.importedCount.set(0);
    this.failedCount.set(0);
    this.skippedCount.set(0);
    this.importErrors.set([]);
    this.validationResult = null;
  }
}
