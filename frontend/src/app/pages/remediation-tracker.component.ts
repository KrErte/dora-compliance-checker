import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';
import { RemediationItem, RemediationStats } from '../models';

@Component({
  selector: 'app-remediation-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
              </svg>
            </div>
            {{ lang.t('remediation.remediation_tracker') }}
          </h1>
          <p class="text-slate-400 text-sm mt-1">{{ lang.t('remediation.track_progress_of_dora_compliance_remedi') }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="exportIcal()"
                  class="px-4 py-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold text-sm hover:bg-cyan-500/20 transition-all flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            {{ lang.l('Ekspordi', 'Export iCal') }}
          </button>
          <button (click)="showImportModal.set(true)"
                  class="px-4 py-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/30 font-semibold text-sm hover:bg-violet-500/20 transition-all flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            {{ lang.l('Impordi CSV', 'Import CSV') }}
          </button>
          <button (click)="showForm = true"
                  class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm hover:shadow-lg transition-all flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            {{ lang.t('remediation.add_action') }}
          </button>
        </div>
      </div>

      <!-- Stats -->
      @if (stats()) {
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-white">{{ stats()!.total }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('remediation.total') }}</div>
          </div>
          <div class="bg-slate-800/50 border border-red-500/30 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-red-400">{{ stats()!.open }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('remediation.open') }}</div>
          </div>
          <div class="bg-slate-800/50 border border-amber-500/30 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-amber-400">{{ stats()!.inProgress }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('remediation.in_progress') }}</div>
          </div>
          <div class="bg-slate-800/50 border border-emerald-500/30 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-emerald-400">{{ stats()!.completed }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('remediation.completed') }}</div>
          </div>
          <div class="bg-slate-800/50 border border-slate-600/50 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-slate-400">{{ stats()!.deferred }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.t('remediation.deferred') }}</div>
          </div>
        </div>
      }

      <!-- Filter -->
      <div class="flex gap-2 flex-wrap">
        @for (f of filters; track f.value) {
          <button (click)="activeFilter = f.value"
                  class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  [class]="activeFilter === f.value ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-700/30 text-slate-400 hover:text-slate-200'">
            {{ lang.l(f.labelEt, f.labelEn) }}
          </button>
        }
      </div>

      <!-- Bulk Action Toolbar -->
      @if (selectedIds().size > 0) {
        <div class="bg-slate-800/80 border border-emerald-500/30 rounded-xl p-3 flex flex-wrap items-center gap-3 animate-in">
          <span class="text-sm text-emerald-400 font-medium">
            {{ selectedIds().size }} {{ lang.l('valitud', 'selected') }}
          </span>
          <div class="h-5 w-px bg-slate-600"></div>

          <!-- Mark Complete -->
          <button (click)="bulkSetStatus('COMPLETED')" [disabled]="bulkProcessing()"
                  class="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-medium hover:bg-emerald-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            {{ lang.l('Märgi valmis', 'Mark Complete') }}
          </button>

          <!-- Mark In Progress -->
          <button (click)="bulkSetStatus('IN_PROGRESS')" [disabled]="bulkProcessing()"
                  class="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-medium hover:bg-amber-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            {{ lang.l('Märgi töösse', 'Mark In Progress') }}
          </button>

          <!-- Set Priority Dropdown -->
          <div class="relative">
            <button (click)="showPriorityDropdown = !showPriorityDropdown" [disabled]="bulkProcessing()"
                    class="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-medium hover:bg-cyan-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/></svg>
              {{ lang.l('Määra prioriteet', 'Set Priority') }}
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </button>
            @if (showPriorityDropdown) {
              <div class="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-600/50 rounded-lg shadow-xl z-20 min-w-[140px] py-1">
                <button (click)="bulkSetPriority('CRITICAL')" class="w-full px-3 py-1.5 text-left text-xs text-red-400 hover:bg-slate-700/50 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-red-500"></span> {{ lang.t('remediation.critical') }}
                </button>
                <button (click)="bulkSetPriority('HIGH')" class="w-full px-3 py-1.5 text-left text-xs text-orange-400 hover:bg-slate-700/50 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-orange-500"></span> {{ lang.t('remediation.high') }}
                </button>
                <button (click)="bulkSetPriority('MEDIUM')" class="w-full px-3 py-1.5 text-left text-xs text-amber-400 hover:bg-slate-700/50 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-amber-500"></span> {{ lang.t('remediation.medium') }}
                </button>
                <button (click)="bulkSetPriority('LOW')" class="w-full px-3 py-1.5 text-left text-xs text-blue-400 hover:bg-slate-700/50 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-blue-500"></span> {{ lang.t('remediation.low') }}
                </button>
              </div>
            }
          </div>

          <!-- Delete Selected -->
          <button (click)="bulkDelete()" [disabled]="bulkProcessing()"
                  class="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-medium hover:bg-red-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            {{ lang.l('Kustuta valitud', 'Delete Selected') }}
          </button>

          <div class="flex-1"></div>

          <!-- Clear Selection -->
          <button (click)="clearSelection()"
                  class="px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-400 text-xs font-medium hover:text-slate-200 transition-all">
            {{ lang.l('Tühista valik', 'Clear Selection') }}
          </button>
        </div>
      }

      <!-- Create form -->
      @if (showForm) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="showForm = false">
          <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg" (click)="$event.stopPropagation()">
            <h2 class="text-lg font-bold text-white mb-4">{{ lang.t('remediation.new_remediation_action') }}</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1">{{ lang.t('remediation.title') }}</label>
                <input [(ngModel)]="newItem.title" type="text"
                       class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-emerald-500/50">
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1">{{ lang.t('remediation.description') }}</label>
                <textarea [(ngModel)]="newItem.description" rows="2"
                          class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"></textarea>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs text-slate-400 mb-1">{{ lang.t('remediation.pillar') }}</label>
                  <select [(ngModel)]="newItem.pillar" class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none">
                    <option value="ICT_RISK_MANAGEMENT">ICT Risk Management</option>
                    <option value="INCIDENT_MANAGEMENT">Incident Management</option>
                    <option value="TESTING">Testing</option>
                    <option value="THIRD_PARTY">Third-Party Risk</option>
                    <option value="INFORMATION_SHARING">Information Sharing</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs text-slate-400 mb-1">{{ lang.t('remediation.priority') }}</label>
                  <select [(ngModel)]="newItem.priority" class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none">
                    <option value="CRITICAL">{{ lang.t('remediation.critical') }}</option>
                    <option value="HIGH">{{ lang.t('remediation.high') }}</option>
                    <option value="MEDIUM">{{ lang.t('remediation.medium') }}</option>
                    <option value="LOW">{{ lang.t('remediation.low') }}</option>
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs text-slate-400 mb-1">{{ lang.t('remediation.assignee') }}</label>
                  <input [(ngModel)]="newItem.assignee" type="text" class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none">
                </div>
                <div>
                  <label class="block text-xs text-slate-400 mb-1">{{ lang.t('remediation.due_date') }}</label>
                  <input [(ngModel)]="newItem.dueDate" type="date" class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none">
                </div>
              </div>
              <div>
                <label class="block text-xs text-slate-400 mb-1">{{ lang.t('remediation.article_reference') }}</label>
                <input [(ngModel)]="newItem.articleReference" type="text" placeholder="e.g. Art. 6(1)"
                       class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none">
              </div>
              <div class="flex justify-end gap-3 pt-2">
                <button (click)="showForm = false" class="px-4 py-2 rounded-xl bg-slate-700/50 text-slate-300 text-sm">{{ lang.t('remediation.cancel') }}</button>
                <button (click)="createItem()" [disabled]="!newItem.title"
                        class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold disabled:opacity-50">
                  {{ lang.t('remediation.add') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- CSV Import Modal -->
      @if (showImportModal()) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="closeImportModal()">
          <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-lg font-bold text-white flex items-center gap-2">
                <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                {{ lang.l('Impordi CSV', 'Import CSV') }}
              </h2>
              <button (click)="closeImportModal()" class="text-slate-400 hover:text-white transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <!-- Download Template -->
            <div class="mb-5">
              <button (click)="downloadCsvTemplate()"
                      class="text-sm text-cyan-400 hover:text-cyan-300 underline underline-offset-2 flex items-center gap-1.5 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                {{ lang.l('Laadi malli alla', 'Download template') }}
              </button>
            </div>

            <!-- File Input -->
            @if (!importResult()) {
              <div class="mb-5">
                <label class="block text-sm font-medium text-slate-300 mb-2">{{ lang.l('Vali CSV fail', 'Select CSV file') }}</label>
                <div class="relative">
                  <input type="file" accept=".csv" (change)="onImportFileSelected($event)"
                         class="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 border-dashed rounded-xl text-slate-300 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-violet-500/20 file:text-violet-400 hover:file:bg-violet-500/30 file:cursor-pointer focus:outline-none focus:border-violet-500/50">
                </div>
              </div>

              <!-- Preview Table -->
              @if (importPreview().length > 0) {
                <div class="mb-5">
                  <h3 class="text-sm font-medium text-slate-300 mb-2">{{ lang.l('Eelvaade (esimesed 5 rida)', 'Preview (first 5 rows)') }}</h3>
                  <div class="overflow-x-auto rounded-lg border border-slate-700/50">
                    <table class="w-full text-xs">
                      <thead>
                        <tr class="bg-slate-900/50">
                          @for (header of importPreviewHeaders(); track header) {
                            <th class="px-3 py-2 text-left text-slate-400 font-medium border-b border-slate-700/50">{{ header }}</th>
                          }
                        </tr>
                      </thead>
                      <tbody>
                        @for (row of importPreview(); track $index) {
                          <tr class="border-b border-slate-700/30 last:border-0">
                            @for (header of importPreviewHeaders(); track header) {
                              <td class="px-3 py-2 text-slate-300 max-w-[150px] truncate">{{ row[header] || '-' }}</td>
                            }
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Import Button -->
                <div class="flex justify-end gap-3">
                  <button (click)="closeImportModal()" class="px-4 py-2 rounded-xl bg-slate-700/50 text-slate-300 text-sm">
                    {{ lang.t('remediation.cancel') }}
                  </button>
                  <button (click)="executeImport()" [disabled]="importing()"
                          class="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
                    @if (importing()) {
                      <div class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                      {{ lang.l('Importimine...', 'Importing...') }}
                    } @else {
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                      {{ lang.l('Impordi', 'Import') }}
                    }
                  </button>
                </div>
              }
            }

            <!-- Import Result -->
            @if (importResult()) {
              <div class="space-y-4">
                <!-- Success count -->
                <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
                  <svg class="w-6 h-6 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <div>
                    <div class="text-sm font-medium text-emerald-400">
                      {{ importResult()!.imported }} {{ lang.l('kirjet imporditud', 'items imported successfully') }}
                    </div>
                  </div>
                </div>

                <!-- Errors -->
                @if (importResult()!.errors && importResult()!.errors.length > 0) {
                  <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <div class="text-sm font-medium text-red-400 mb-2">
                      {{ importResult()!.errors.length }} {{ lang.l('viga', 'error(s)') }}
                    </div>
                    <div class="space-y-1 max-h-40 overflow-y-auto">
                      @for (err of importResult()!.errors; track $index) {
                        <div class="text-xs text-red-300/80 flex items-start gap-2">
                          <span class="text-red-500 mt-0.5">&#x2022;</span>
                          <span>{{ err.row ? (lang.l('Rida', 'Row') + ' ' + err.row + ': ') : '' }}{{ err.message || err }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }

                <div class="flex justify-end">
                  <button (click)="closeImportModal()"
                          class="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold">
                    {{ lang.l('Sulge', 'Close') }}
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Items list -->
      @if (loading()) {
        <div class="text-center py-16">
          <div class="w-10 h-10 mx-auto mb-3 rounded-full border-4 border-slate-700 border-t-emerald-400 animate-spin"></div>
        </div>
      }

      @if (!loading() && filteredItems().length === 0) {
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
          <svg class="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <p class="text-slate-400">{{ lang.t('remediation.no_remediation_items_found') }}</p>
        </div>
      }

      @if (!loading() && filteredItems().length > 0) {
        <div class="space-y-2">
          <!-- Select All Row -->
          <div class="flex items-center gap-3 px-4 py-2">
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" [checked]="allSelected()" (change)="toggleSelectAll()"
                     class="w-4 h-4 rounded border-slate-600 bg-slate-900/50 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0 cursor-pointer accent-emerald-500">
              <span class="text-xs text-slate-400 font-medium">
                {{ lang.l('Vali kõik', 'Select all') }} ({{ filteredItems().length }})
              </span>
            </label>
          </div>

          @for (item of filteredItems(); track item.id) {
            <div class="bg-slate-800/50 border rounded-xl p-4 hover:border-slate-600/50 transition-all"
                 [class]="isSelected(item.id) ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-slate-700/50'">
              <div class="flex flex-col md:flex-row md:items-center gap-3">
                <!-- Checkbox -->
                <input type="checkbox" [checked]="isSelected(item.id)" (change)="toggleSelect(item.id)"
                       class="w-4 h-4 rounded border-slate-600 bg-slate-900/50 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0 cursor-pointer flex-shrink-0 accent-emerald-500">

                <!-- Priority dot -->
                <div class="w-3 h-3 rounded-full flex-shrink-0"
                     [class]="item.priority === 'CRITICAL' ? 'bg-red-500' : item.priority === 'HIGH' ? 'bg-orange-500' : item.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'"></div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <h3 class="text-sm font-medium text-white truncate">{{ item.title }}</h3>
                    @if (item.articleReference) {
                      <span class="px-1.5 py-0.5 rounded text-[10px] font-mono text-violet-400 bg-violet-500/10 flex-shrink-0">{{ item.articleReference }}</span>
                    }
                  </div>
                  @if (item.description) {
                    <p class="text-xs text-slate-400 mt-0.5 truncate">{{ item.description }}</p>
                  }
                  <div class="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                    @if (item.assignee) { <span>{{ item.assignee }}</span> }
                    @if (item.dueDate) { <span>{{ lang.t('remediation.due') }}: {{ item.dueDate }}</span> }
                  </div>
                </div>

                <!-- Status selector -->
                <select [(ngModel)]="item.status" (ngModelChange)="updateStatus(item)"
                        class="px-3 py-1.5 bg-slate-900/50 border border-slate-600/50 rounded-lg text-xs text-white focus:outline-none">
                  <option value="OPEN">{{ lang.t('remediation.open_24') }}</option>
                  <option value="IN_PROGRESS">{{ lang.t('remediation.in_progress_25') }}</option>
                  <option value="COMPLETED">{{ lang.t('remediation.completed_26') }}</option>
                  <option value="DEFERRED">{{ lang.t('remediation.deferred_27') }}</option>
                </select>

                <!-- Delete -->
                <button (click)="deleteItem(item.id)" class="text-slate-500 hover:text-red-400 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class RemediationTrackerComponent implements OnInit {
  loading = signal(true);
  items = signal<RemediationItem[]>([]);
  stats = signal<RemediationStats | null>(null);
  showForm = false;
  activeFilter = 'ALL';

  // Bulk action state
  selectedIds = signal<Set<string>>(new Set());
  bulkProcessing = signal(false);
  showPriorityDropdown = false;

  // CSV Import state
  showImportModal = signal(false);
  importFile = signal<File | null>(null);
  importPreview = signal<Record<string, string>[]>([]);
  importPreviewHeaders = signal<string[]>([]);
  importing = signal(false);
  importResult = signal<{ imported: number; errors: any[] } | null>(null);

  filters = [
    { value: 'ALL', labelEt: 'Kõik', labelEn: 'All' },
    { value: 'OPEN', labelEt: 'Avatud', labelEn: 'Open' },
    { value: 'IN_PROGRESS', labelEt: 'Töös', labelEn: 'In Progress' },
    { value: 'COMPLETED', labelEt: 'Valmis', labelEn: 'Completed' },
    { value: 'DEFERRED', labelEt: 'Edasi lükatud', labelEn: 'Deferred' }
  ];

  newItem: any = {
    title: '', description: '', pillar: 'ICT_RISK_MANAGEMENT',
    priority: 'MEDIUM', assignee: '', dueDate: '', articleReference: ''
  };

  constructor(private api: ApiService, public lang: LangService) {}

  ngOnInit() { this.loadData(); }

  loadData() {
    this.loading.set(true);
    this.api.getRemediations().subscribe({
      next: (data) => { this.items.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.api.getRemediationStats().subscribe({
      next: (data) => this.stats.set(data)
    });
  }

  filteredItems(): RemediationItem[] {
    if (this.activeFilter === 'ALL') return this.items();
    return this.items().filter(i => i.status === this.activeFilter);
  }

  createItem() {
    this.api.createRemediation(this.newItem).subscribe({
      next: () => {
        this.showForm = false;
        this.newItem = { title: '', description: '', pillar: 'ICT_RISK_MANAGEMENT', priority: 'MEDIUM', assignee: '', dueDate: '', articleReference: '' };
        this.loadData();
      }
    });
  }

  updateStatus(item: RemediationItem) {
    this.api.updateRemediation(item.id, { status: item.status }).subscribe({
      next: () => this.loadData()
    });
  }

  deleteItem(id: string) {
    this.api.deleteRemediation(id).subscribe({
      next: () => this.loadData()
    });
  }

  exportIcal() {
    this.api.exportIcalDeadlines().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dora-deadlines.ics';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => {}
    });
  }

  // ─── Bulk Actions ─────────────────────────────────────

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  allSelected(): boolean {
    const filtered = this.filteredItems();
    if (filtered.length === 0) return false;
    return filtered.every(item => this.selectedIds().has(item.id));
  }

  toggleSelect(id: string) {
    const current = new Set(this.selectedIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedIds.set(current);
  }

  toggleSelectAll() {
    const filtered = this.filteredItems();
    if (this.allSelected()) {
      // Deselect all visible items
      const current = new Set(this.selectedIds());
      filtered.forEach(item => current.delete(item.id));
      this.selectedIds.set(current);
    } else {
      // Select all visible items
      const current = new Set(this.selectedIds());
      filtered.forEach(item => current.add(item.id));
      this.selectedIds.set(current);
    }
  }

  clearSelection() {
    this.selectedIds.set(new Set());
    this.showPriorityDropdown = false;
  }

  bulkSetStatus(status: string) {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;
    this.bulkProcessing.set(true);
    this.api.bulkUpdateRemediationStatus(ids, status).subscribe({
      next: () => {
        this.clearSelection();
        this.bulkProcessing.set(false);
        this.loadData();
      },
      error: () => this.bulkProcessing.set(false)
    });
  }

  bulkSetPriority(priority: string) {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;
    this.bulkProcessing.set(true);
    this.showPriorityDropdown = false;
    this.api.bulkUpdateRemediationPriority(ids, priority).subscribe({
      next: () => {
        this.clearSelection();
        this.bulkProcessing.set(false);
        this.loadData();
      },
      error: () => this.bulkProcessing.set(false)
    });
  }

  bulkDelete() {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;
    this.bulkProcessing.set(true);
    this.api.bulkDeleteRemediation(ids).subscribe({
      next: () => {
        this.clearSelection();
        this.bulkProcessing.set(false);
        this.loadData();
      },
      error: () => this.bulkProcessing.set(false)
    });
  }

  // ─── CSV Import ───────────────────────────────────────

  downloadCsvTemplate() {
    const headers = 'title,description,priority,status,dueDate,pillar,articleReference';
    const sample1 = 'Implement MFA for admin,Enable multi-factor authentication,HIGH,OPEN,2026-06-01,ICT_RISK_MANAGEMENT,Art. 9(4)';
    const sample2 = 'Update incident playbook,Review and update IR procedures,MEDIUM,IN_PROGRESS,2026-07-15,INCIDENT_MANAGEMENT,Art. 17(3)';
    const csv = [headers, sample1, sample2].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'remediation-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  onImportFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.importFile.set(file);
    this.importResult.set(null);

    // Parse CSV for preview
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        this.importPreview.set([]);
        this.importPreviewHeaders.set([]);
        return;
      }
      const headers = this.parseCsvLine(lines[0]);
      this.importPreviewHeaders.set(headers);
      const previewRows: Record<string, string>[] = [];
      const maxPreview = Math.min(lines.length, 6); // header + 5 data rows
      for (let i = 1; i < maxPreview; i++) {
        const values = this.parseCsvLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => row[h] = values[idx] || '');
        previewRows.push(row);
      }
      this.importPreview.set(previewRows);
    };
    reader.readAsText(file);
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
    }
    result.push(current.trim());
    return result;
  }

  executeImport() {
    const file = this.importFile();
    if (!file) return;
    this.importing.set(true);
    this.api.importRemediationCsv(file).subscribe({
      next: (result) => {
        this.importing.set(false);
        this.importResult.set(result);
        this.loadData();
      },
      error: (err) => {
        this.importing.set(false);
        this.importResult.set({
          imported: 0,
          errors: [{ message: err?.error?.message || 'Import failed. Please check your CSV format.' }]
        });
      }
    });
  }

  closeImportModal() {
    this.showImportModal.set(false);
    this.importFile.set(null);
    this.importPreview.set([]);
    this.importPreviewHeaders.set([]);
    this.importing.set(false);
    this.importResult.set(null);
  }
}
