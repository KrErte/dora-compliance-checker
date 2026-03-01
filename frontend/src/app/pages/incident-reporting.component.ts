import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';
import { IncidentReport, IncidentStats } from '../models';

@Component({
  selector: 'app-incident-reporting',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            {{ lang.currentLang === 'et' ? 'Intsidentide raporteerimiskeskus' : 'Incident Reporting Centre' }}
          </h1>
          <p class="text-slate-400 text-sm mt-1">{{ lang.currentLang === 'et' ? 'DORA Art. 19 — ICT intsidentide haldamine ja raporteerimise t\u00f6\u00f6voog' : 'DORA Art. 19 — ICT incident management and reporting workflow' }}</p>
        </div>
        <button (click)="showCreateForm = true"
                class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-red-500/25 transition-all flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          {{ lang.currentLang === 'et' ? 'Registreeri intsident' : 'Report Incident' }}
        </button>
      </div>

      <!-- Stats cards -->
      @if (stats()) {
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-white">{{ stats()!.total }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.currentLang === 'et' ? 'Kokku' : 'Total' }}</div>
          </div>
          <div class="bg-slate-800/50 border border-red-500/30 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-red-400">{{ stats()!.major }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.currentLang === 'et' ? 'Olulised' : 'Major' }}</div>
          </div>
          <div class="bg-slate-800/50 border border-amber-500/30 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-amber-400">{{ stats()!.open }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.currentLang === 'et' ? 'Avatud' : 'Open' }}</div>
          </div>
          <div class="bg-slate-800/50 border border-emerald-500/30 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-emerald-400">{{ stats()!.closed }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.currentLang === 'et' ? 'Suletud' : 'Closed' }}</div>
          </div>
          <div class="bg-slate-800/50 border rounded-xl p-4 text-center"
               [class]="stats()!.overdue > 0 ? 'border-red-500/50 bg-red-500/5' : 'border-slate-700/50'">
            <div class="text-2xl font-bold" [class]="stats()!.overdue > 0 ? 'text-red-400' : 'text-slate-400'">{{ stats()!.overdue }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ lang.currentLang === 'et' ? 'T\u00e4htaja \u00fcletanud' : 'Overdue' }}</div>
          </div>
        </div>
      }

      <!-- Create form modal -->
      @if (showCreateForm) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="showCreateForm = false">
          <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <h2 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
              {{ lang.currentLang === 'et' ? 'Registreeri uus intsident' : 'Report New Incident' }}
            </h2>

            <div class="space-y-4">
              <!-- Title -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1">{{ lang.currentLang === 'et' ? 'Intsidendi pealkiri *' : 'Incident Title *' }}</label>
                <input [(ngModel)]="newIncident.incidentTitle" type="text"
                       class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                       [placeholder]="lang.currentLang === 'et' ? 'nt. Lunavara r\u00fcnnak p\u00f5his\u00fcsteemile' : 'e.g. Ransomware attack on core system'">
              </div>

              <!-- Type + Severity -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-1">{{ lang.currentLang === 'et' ? 'Intsidendi t\u00fc\u00fcp' : 'Incident Type' }}</label>
                  <select [(ngModel)]="newIncident.incidentType"
                          class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50">
                    <option value="CYBERATTACK">{{ lang.currentLang === 'et' ? 'K\u00fcberr\u00fcnnak' : 'Cyberattack' }}</option>
                    <option value="SYSTEM_FAILURE">{{ lang.currentLang === 'et' ? 'S\u00fcsteemi rike' : 'System Failure' }}</option>
                    <option value="DATA_BREACH">{{ lang.currentLang === 'et' ? 'Andmeleke' : 'Data Breach' }}</option>
                    <option value="THIRD_PARTY_FAILURE">{{ lang.currentLang === 'et' ? 'Kolmanda osapoole rike' : 'Third-Party Failure' }}</option>
                    <option value="NATURAL_DISASTER">{{ lang.currentLang === 'et' ? 'Looduskatastroof' : 'Natural Disaster' }}</option>
                    <option value="OTHER">{{ lang.currentLang === 'et' ? 'Muu' : 'Other' }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-1">{{ lang.currentLang === 'et' ? 'Raskusaste' : 'Severity' }}</label>
                  <select [(ngModel)]="newIncident.severityLevel"
                          class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50">
                    <option value="CRITICAL">{{ lang.currentLang === 'et' ? 'Kriitiline' : 'Critical' }}</option>
                    <option value="HIGH">{{ lang.currentLang === 'et' ? 'K\u00f5rge' : 'High' }}</option>
                    <option value="MEDIUM">{{ lang.currentLang === 'et' ? 'Keskmine' : 'Medium' }}</option>
                    <option value="LOW">{{ lang.currentLang === 'et' ? 'Madal' : 'Low' }}</option>
                  </select>
                </div>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1">{{ lang.currentLang === 'et' ? 'Kirjeldus' : 'Description' }}</label>
                <textarea [(ngModel)]="newIncident.description" rows="3"
                          class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                          [placeholder]="lang.currentLang === 'et' ? 'Kirjeldage intsidenti...' : 'Describe the incident...'"></textarea>
              </div>

              <!-- Detection time -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1">{{ lang.currentLang === 'et' ? 'Avastamise aeg' : 'Detection Time' }}</label>
                <input [(ngModel)]="newIncident.detectedAt" type="datetime-local"
                       class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50">
              </div>

              <!-- Art. 18 Classification Criteria -->
              <div class="border-t border-slate-700/50 pt-4">
                <h3 class="text-sm font-semibold text-slate-300 mb-3">{{ lang.currentLang === 'et' ? 'DORA Art. 18 klassifitseerimiskriteeriumid' : 'DORA Art. 18 Classification Criteria' }}</h3>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs text-slate-400 mb-1">{{ lang.currentLang === 'et' ? 'M\u00f5jutatud kliendid' : 'Clients Affected' }}</label>
                    <input [(ngModel)]="newIncident.clientsAffected" type="number"
                           class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50">
                  </div>
                  <div>
                    <label class="block text-xs text-slate-400 mb-1">{{ lang.currentLang === 'et' ? 'M\u00f5jutatud tehingud' : 'Transactions Affected' }}</label>
                    <input [(ngModel)]="newIncident.transactionsAffected" type="number"
                           class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50">
                  </div>
                  <div>
                    <label class="block text-xs text-slate-400 mb-1">{{ lang.currentLang === 'et' ? 'Majanduslik m\u00f5ju (\u20ac)' : 'Economic Impact (\u20ac)' }}</label>
                    <input [(ngModel)]="newIncident.economicImpact" type="number"
                           class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50">
                  </div>
                  <div>
                    <label class="block text-xs text-slate-400 mb-1">{{ lang.currentLang === 'et' ? 'Kestus (minutid)' : 'Duration (minutes)' }}</label>
                    <input [(ngModel)]="newIncident.durationMinutes" type="number"
                           class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50">
                  </div>
                  <div>
                    <label class="block text-xs text-slate-400 mb-1">{{ lang.currentLang === 'et' ? 'Andmekadu t\u00fc\u00fcp' : 'Data Loss Type' }}</label>
                    <select [(ngModel)]="newIncident.dataLossType"
                            class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50">
                      <option value="NONE">{{ lang.currentLang === 'et' ? 'Puudub' : 'None' }}</option>
                      <option value="AVAILABILITY">{{ lang.currentLang === 'et' ? 'K\u00e4ttesaadavus' : 'Availability' }}</option>
                      <option value="AUTHENTICITY">{{ lang.currentLang === 'et' ? 'Autentsus' : 'Authenticity' }}</option>
                      <option value="INTEGRITY">{{ lang.currentLang === 'et' ? 'Terviklus' : 'Integrity' }}</option>
                      <option value="CONFIDENTIALITY">{{ lang.currentLang === 'et' ? 'Konfidentsiaalsus' : 'Confidentiality' }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs text-slate-400 mb-1">{{ lang.currentLang === 'et' ? 'Mainega seotud m\u00f5ju' : 'Reputational Impact' }}</label>
                    <select [(ngModel)]="newIncident.reputationalImpact"
                            class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50">
                      <option value="NONE">{{ lang.currentLang === 'et' ? 'Puudub' : 'None' }}</option>
                      <option value="LOW">{{ lang.currentLang === 'et' ? 'Madal' : 'Low' }}</option>
                      <option value="MEDIUM">{{ lang.currentLang === 'et' ? 'Keskmine' : 'Medium' }}</option>
                      <option value="HIGH">{{ lang.currentLang === 'et' ? 'K\u00f5rge' : 'High' }}</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Competent Authority -->
              <div class="border-t border-slate-700/50 pt-4">
                <h3 class="text-sm font-semibold text-slate-300 mb-3">{{ lang.currentLang === 'et' ? 'P\u00e4dev asutus' : 'Competent Authority' }}</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-xs text-slate-400 mb-1">{{ lang.currentLang === 'et' ? 'Asutus' : 'Authority' }}</label>
                    <select [(ngModel)]="newIncident.competentAuthority"
                            class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50">
                      <option value="">{{ lang.currentLang === 'et' ? 'Vali...' : 'Select...' }}</option>
                      <option value="Finantsinspektsioon">Finantsinspektsioon (EE)</option>
                      <option value="FKTK">FKTK (LV)</option>
                      <option value="Bank of Lithuania">Bank of Lithuania (LT)</option>
                      <option value="Other">{{ lang.currentLang === 'et' ? 'Muu' : 'Other' }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs text-slate-400 mb-1">{{ lang.currentLang === 'et' ? 'Kontaktisiku nimi' : 'Contact Name' }}</label>
                    <input [(ngModel)]="newIncident.reportingContactName" type="text"
                           class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50">
                  </div>
                  <div>
                    <label class="block text-xs text-slate-400 mb-1">{{ lang.currentLang === 'et' ? 'Kontaktisiku e-post' : 'Contact Email' }}</label>
                    <input [(ngModel)]="newIncident.reportingContactEmail" type="email"
                           class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50">
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex justify-end gap-3 pt-4">
                <button (click)="showCreateForm = false"
                        class="px-5 py-2.5 rounded-xl bg-slate-700/50 border border-slate-600/50 text-slate-300 text-sm hover:bg-slate-600/50 transition-all">
                  {{ lang.currentLang === 'et' ? 'T\u00fchista' : 'Cancel' }}
                </button>
                <button (click)="createIncident()"
                        [disabled]="!newIncident.incidentTitle"
                        class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {{ lang.currentLang === 'et' ? 'Registreeri' : 'Submit' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="text-center py-16">
          <div class="w-10 h-10 mx-auto mb-3 rounded-full border-4 border-slate-700 border-t-red-400 animate-spin"></div>
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && incidents().length === 0 && !showCreateForm) {
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
          <svg class="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
          <h3 class="text-white font-semibold mb-2">{{ lang.currentLang === 'et' ? '\u00dchtegi intsidenti pole registreeritud' : 'No incidents reported' }}</h3>
          <p class="text-slate-400 text-sm mb-4">{{ lang.currentLang === 'et' ? 'Registreerige ICT intsidente ja j\u00e4lgige DORA Art. 19 raporteerimise t\u00e4htaegu' : 'Register ICT incidents and track DORA Art. 19 reporting deadlines' }}</p>
        </div>
      }

      <!-- Incident list -->
      @if (!loading() && incidents().length > 0) {
        <div class="space-y-3">
          @for (incident of incidents(); track incident.id) {
            <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-all cursor-pointer"
                 (click)="selectIncident(incident)">
              <div class="flex flex-col md:flex-row md:items-center gap-4">
                <!-- Left: Status & info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <!-- Severity badge -->
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                          [class]="getSeverityClass(incident.severityLevel)">
                      {{ incident.severityLevel }}
                    </span>
                    <!-- Major badge -->
                    @if (incident.isMajor) {
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                        {{ lang.currentLang === 'et' ? 'OLULINE' : 'MAJOR' }}
                      </span>
                    }
                    <!-- Type badge -->
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-700/50 text-slate-300">
                      {{ getTypeLabel(incident.incidentType) }}
                    </span>
                  </div>
                  <h3 class="text-white font-semibold truncate">{{ incident.incidentTitle }}</h3>
                  <p class="text-slate-400 text-xs mt-1">
                    {{ lang.currentLang === 'et' ? 'Avastatud' : 'Detected' }}: {{ incident.detectedAt | date:'dd.MM.yyyy HH:mm' }}
                  </p>
                </div>

                <!-- Right: Workflow status -->
                <div class="flex items-center gap-3">
                  <!-- Reporting timeline -->
                  <div class="flex items-center gap-1">
                    <div class="flex flex-col items-center">
                      <div class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                           [class]="getStepClass(incident, 'DETECTED')">1</div>
                      <span class="text-[8px] text-slate-500 mt-0.5">{{ lang.currentLang === 'et' ? 'Tuv.' : 'Det.' }}</span>
                    </div>
                    <div class="w-4 h-0.5 bg-slate-700"></div>
                    <div class="flex flex-col items-center">
                      <div class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                           [class]="getStepClass(incident, 'INITIAL_SENT')">2</div>
                      <span class="text-[8px] text-slate-500 mt-0.5">4h</span>
                    </div>
                    <div class="w-4 h-0.5 bg-slate-700"></div>
                    <div class="flex flex-col items-center">
                      <div class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                           [class]="getStepClass(incident, 'INTERMEDIATE_SENT')">3</div>
                      <span class="text-[8px] text-slate-500 mt-0.5">72h</span>
                    </div>
                    <div class="w-4 h-0.5 bg-slate-700"></div>
                    <div class="flex flex-col items-center">
                      <div class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                           [class]="getStepClass(incident, 'FINAL_SENT')">4</div>
                      <span class="text-[8px] text-slate-500 mt-0.5">1{{ lang.currentLang === 'et' ? 'k' : 'mo' }}</span>
                    </div>
                  </div>

                  <!-- Status badge -->
                  <span class="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
                        [class]="getStatusClass(incident.reportingStatus)">
                    {{ getStatusLabel(incident.reportingStatus) }}
                  </span>
                </div>
              </div>

              <!-- Deadline warning -->
              @if (getNextDeadline(incident)) {
                <div class="mt-3 px-3 py-2 rounded-lg text-xs flex items-center gap-2"
                     [class]="isOverdue(incident) ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'">
                  <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {{ isOverdue(incident) ? (lang.currentLang === 'et' ? 'T\u00c4HTAEG \u00dcLETATUD: ' : 'OVERDUE: ') : '' }}
                  {{ getNextDeadline(incident) }}
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Incident detail modal -->
      @if (selectedIncident()) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="selectedIncident.set(null)">
          <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="flex items-start justify-between mb-6">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                        [class]="getSeverityClass(selectedIncident()!.severityLevel)">
                    {{ selectedIncident()!.severityLevel }}
                  </span>
                  @if (selectedIncident()!.isMajor) {
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">MAJOR</span>
                  }
                </div>
                <h2 class="text-xl font-bold text-white">{{ selectedIncident()!.incidentTitle }}</h2>
              </div>
              <button (click)="selectedIncident.set(null)" class="text-slate-400 hover:text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Reporting timeline -->
            <div class="bg-slate-900/50 rounded-xl p-4 mb-6">
              <h3 class="text-sm font-semibold text-slate-300 mb-3">{{ lang.currentLang === 'et' ? 'Raporteerimise ajajoon' : 'Reporting Timeline' }}</h3>
              <div class="space-y-3">
                <!-- Step 1: Detection -->
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                       [class]="selectedIncident()!.classifiedAt ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400 border border-slate-600'">1</div>
                  <div class="flex-1">
                    <div class="text-sm font-medium text-white">{{ lang.currentLang === 'et' ? 'Tuvastamine ja klassifitseerimine' : 'Detection & Classification' }}</div>
                    <div class="text-xs text-slate-400">
                      {{ lang.currentLang === 'et' ? 'Avastatud' : 'Detected' }}: {{ selectedIncident()!.detectedAt | date:'dd.MM.yyyy HH:mm' }}
                      @if (selectedIncident()!.classifiedAt) {
                        <span class="text-emerald-400"> &mdash; {{ lang.currentLang === 'et' ? 'Klassifitseeritud' : 'Classified' }}: {{ selectedIncident()!.classifiedAt | date:'dd.MM.yyyy HH:mm' }}</span>
                      }
                    </div>
                  </div>
                  @if (!selectedIncident()!.classifiedAt && selectedIncident()!.reportingStatus === 'DRAFT') {
                    <button (click)="classify()" class="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-semibold hover:bg-blue-500/30 transition-all">
                      {{ lang.currentLang === 'et' ? 'Klassifitseeri' : 'Classify' }}
                    </button>
                  }
                </div>

                <!-- Step 2: Initial report (4h) -->
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                       [class]="selectedIncident()!.initialReportSentAt ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400 border border-slate-600'">2</div>
                  <div class="flex-1">
                    <div class="text-sm font-medium text-white">{{ lang.currentLang === 'et' ? 'Esialgne teade (4h)' : 'Initial Notification (4h)' }}</div>
                    <div class="text-xs text-slate-400">
                      @if (selectedIncident()!.initialReportDueAt) {
                        {{ lang.currentLang === 'et' ? 'T\u00e4htaeg' : 'Due' }}: {{ selectedIncident()!.initialReportDueAt | date:'dd.MM.yyyy HH:mm' }}
                      }
                      @if (selectedIncident()!.initialReportSentAt) {
                        <span class="text-emerald-400"> &mdash; {{ lang.currentLang === 'et' ? 'Saadetud' : 'Sent' }}: {{ selectedIncident()!.initialReportSentAt | date:'dd.MM.yyyy HH:mm' }}</span>
                      }
                    </div>
                  </div>
                  @if (selectedIncident()!.classifiedAt && !selectedIncident()!.initialReportSentAt) {
                    <button (click)="submitReport('initial')" class="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/30 transition-all">
                      {{ lang.currentLang === 'et' ? 'Esita teade' : 'Submit Report' }}
                    </button>
                  }
                </div>

                <!-- Step 3: Intermediate report (72h) -->
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                       [class]="selectedIncident()!.intermediateReportSentAt ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400 border border-slate-600'">3</div>
                  <div class="flex-1">
                    <div class="text-sm font-medium text-white">{{ lang.currentLang === 'et' ? 'Vahearuanne (72h)' : 'Intermediate Report (72h)' }}</div>
                    <div class="text-xs text-slate-400">
                      @if (selectedIncident()!.intermediateReportDueAt) {
                        {{ lang.currentLang === 'et' ? 'T\u00e4htaeg' : 'Due' }}: {{ selectedIncident()!.intermediateReportDueAt | date:'dd.MM.yyyy HH:mm' }}
                      }
                      @if (selectedIncident()!.intermediateReportSentAt) {
                        <span class="text-emerald-400"> &mdash; {{ lang.currentLang === 'et' ? 'Saadetud' : 'Sent' }}: {{ selectedIncident()!.intermediateReportSentAt | date:'dd.MM.yyyy HH:mm' }}</span>
                      }
                    </div>
                  </div>
                  @if (selectedIncident()!.initialReportSentAt && !selectedIncident()!.intermediateReportSentAt) {
                    <button (click)="submitReport('intermediate')" class="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/30 transition-all">
                      {{ lang.currentLang === 'et' ? 'Esita aruanne' : 'Submit Report' }}
                    </button>
                  }
                </div>

                <!-- Step 4: Final report (1 month) -->
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                       [class]="selectedIncident()!.finalReportSentAt ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400 border border-slate-600'">4</div>
                  <div class="flex-1">
                    <div class="text-sm font-medium text-white">{{ lang.currentLang === 'et' ? 'L\u00f5pparuanne (1 kuu)' : 'Final Report (1 month)' }}</div>
                    <div class="text-xs text-slate-400">
                      @if (selectedIncident()!.finalReportDueAt) {
                        {{ lang.currentLang === 'et' ? 'T\u00e4htaeg' : 'Due' }}: {{ selectedIncident()!.finalReportDueAt | date:'dd.MM.yyyy HH:mm' }}
                      }
                      @if (selectedIncident()!.finalReportSentAt) {
                        <span class="text-emerald-400"> &mdash; {{ lang.currentLang === 'et' ? 'Saadetud' : 'Sent' }}: {{ selectedIncident()!.finalReportSentAt | date:'dd.MM.yyyy HH:mm' }}</span>
                      }
                    </div>
                  </div>
                  @if (selectedIncident()!.resolvedAt && !selectedIncident()!.finalReportSentAt) {
                    <button (click)="submitReport('final')" class="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/30 transition-all">
                      {{ lang.currentLang === 'et' ? 'Esita aruanne' : 'Submit Report' }}
                    </button>
                  }
                </div>
              </div>
            </div>

            <!-- Incident details -->
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="bg-slate-900/50 rounded-lg p-3">
                <div class="text-xs text-slate-400 mb-1">{{ lang.currentLang === 'et' ? 'T\u00fc\u00fcp' : 'Type' }}</div>
                <div class="text-sm text-white">{{ getTypeLabel(selectedIncident()!.incidentType) }}</div>
              </div>
              <div class="bg-slate-900/50 rounded-lg p-3">
                <div class="text-xs text-slate-400 mb-1">{{ lang.currentLang === 'et' ? 'M\u00f5jutatud kliendid' : 'Clients Affected' }}</div>
                <div class="text-sm text-white">{{ selectedIncident()!.clientsAffected || '-' }}</div>
              </div>
              <div class="bg-slate-900/50 rounded-lg p-3">
                <div class="text-xs text-slate-400 mb-1">{{ lang.currentLang === 'et' ? 'Majanduslik m\u00f5ju' : 'Economic Impact' }}</div>
                <div class="text-sm text-white">{{ selectedIncident()!.economicImpact ? '\u20ac' + (selectedIncident()!.economicImpact | number) : '-' }}</div>
              </div>
              <div class="bg-slate-900/50 rounded-lg p-3">
                <div class="text-xs text-slate-400 mb-1">{{ lang.currentLang === 'et' ? 'Kestus' : 'Duration' }}</div>
                <div class="text-sm text-white">{{ selectedIncident()!.durationMinutes ? selectedIncident()!.durationMinutes + ' min' : '-' }}</div>
              </div>
            </div>

            @if (selectedIncident()!.description) {
              <div class="bg-slate-900/50 rounded-xl p-4 mb-6">
                <div class="text-xs text-slate-400 mb-1">{{ lang.currentLang === 'et' ? 'Kirjeldus' : 'Description' }}</div>
                <div class="text-sm text-slate-300 whitespace-pre-wrap">{{ selectedIncident()!.description }}</div>
              </div>
            }

            <!-- Actions -->
            <div class="flex flex-wrap gap-2">
              @if (!selectedIncident()!.resolvedAt && selectedIncident()!.reportingStatus !== 'CLOSED') {
                <button (click)="resolveIncident()" class="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/30 transition-all">
                  {{ lang.currentLang === 'et' ? 'M\u00e4rgi lahendatuks' : 'Mark Resolved' }}
                </button>
              }
              @if (selectedIncident()!.reportingStatus === 'FINAL_SENT') {
                <button (click)="closeIncident()" class="px-4 py-2 rounded-xl bg-slate-700/50 text-slate-300 text-sm font-semibold hover:bg-slate-600/50 transition-all">
                  {{ lang.currentLang === 'et' ? 'Sulge intsident' : 'Close Incident' }}
                </button>
              }
            </div>
          </div>
        </div>
      }

      <!-- Report submission modal -->
      @if (showReportForm()) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" (click)="showReportForm.set(null)">
          <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <h2 class="text-lg font-bold text-white mb-4">
              {{ showReportForm() === 'initial' ? (lang.currentLang === 'et' ? 'Esialgne teade p\u00e4devale asutusele' : 'Initial Notification to Competent Authority') :
                 showReportForm() === 'intermediate' ? (lang.currentLang === 'et' ? 'Vahearuanne' : 'Intermediate Report') :
                 (lang.currentLang === 'et' ? 'L\u00f5pparuanne' : 'Final Report') }}
            </h2>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1">{{ lang.currentLang === 'et' ? 'Kokkuv\u00f5te' : 'Summary' }}</label>
                <textarea [(ngModel)]="reportForm.summary" rows="3"
                          class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1">{{ lang.currentLang === 'et' ? 'V\u00f5etud meetmed' : 'Actions Taken' }}</label>
                <textarea [(ngModel)]="reportForm.actionsTaken" rows="3"
                          class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"></textarea>
              </div>
              @if (showReportForm() === 'final') {
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-1">{{ lang.currentLang === 'et' ? 'Juurp\u00f5hjus' : 'Root Cause' }}</label>
                  <textarea [(ngModel)]="reportForm.rootCause" rows="2"
                            class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"></textarea>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-1">{{ lang.currentLang === 'et' ? '\u00d5pitunnid' : 'Lessons Learned' }}</label>
                  <textarea [(ngModel)]="reportForm.lessonsLearned" rows="2"
                            class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"></textarea>
                </div>
              }
              <div class="flex justify-end gap-3 pt-2">
                <button (click)="showReportForm.set(null)" class="px-4 py-2 rounded-xl bg-slate-700/50 text-slate-300 text-sm">
                  {{ lang.currentLang === 'et' ? 'T\u00fchista' : 'Cancel' }}
                </button>
                <button (click)="sendReport()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold hover:shadow-lg transition-all">
                  {{ lang.currentLang === 'et' ? 'Esita aruanne' : 'Submit Report' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class IncidentReportingComponent implements OnInit {
  loading = signal(true);
  incidents = signal<IncidentReport[]>([]);
  stats = signal<IncidentStats | null>(null);
  selectedIncident = signal<IncidentReport | null>(null);
  showReportForm = signal<'initial' | 'intermediate' | 'final' | null>(null);
  showCreateForm = false;

  newIncident: any = {
    incidentTitle: '',
    incidentType: 'CYBERATTACK',
    severityLevel: 'MEDIUM',
    description: '',
    detectedAt: '',
    clientsAffected: null,
    transactionsAffected: null,
    economicImpact: null,
    durationMinutes: null,
    dataLossType: 'NONE',
    reputationalImpact: 'NONE',
    competentAuthority: '',
    reportingContactName: '',
    reportingContactEmail: ''
  };

  reportForm: any = { summary: '', actionsTaken: '', rootCause: '', lessonsLearned: '' };

  constructor(private api: ApiService, public lang: LangService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.api.getIncidents().subscribe({
      next: (data) => { this.incidents.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
    this.api.getIncidentStats().subscribe({
      next: (data) => this.stats.set(data)
    });
  }

  createIncident() {
    this.api.createIncident(this.newIncident).subscribe({
      next: () => {
        this.showCreateForm = false;
        this.resetForm();
        this.loadData();
      }
    });
  }

  selectIncident(incident: IncidentReport) {
    this.selectedIncident.set(incident);
  }

  classify() {
    const id = this.selectedIncident()?.id;
    if (!id) return;
    this.api.classifyIncident(id).subscribe({
      next: (updated) => { this.selectedIncident.set(updated); this.loadData(); }
    });
  }

  submitReport(type: 'initial' | 'intermediate' | 'final') {
    this.reportForm = { summary: '', actionsTaken: '', rootCause: '', lessonsLearned: '' };
    this.showReportForm.set(type);
  }

  sendReport() {
    const id = this.selectedIncident()?.id;
    const type = this.showReportForm();
    if (!id || !type) return;

    const handler = {
      initial: () => this.api.submitInitialReport(id, this.reportForm),
      intermediate: () => this.api.submitIntermediateReport(id, this.reportForm),
      final: () => this.api.submitFinalReport(id, this.reportForm)
    }[type];

    handler().subscribe({
      next: (updated) => {
        this.selectedIncident.set(updated);
        this.showReportForm.set(null);
        this.loadData();
      }
    });
  }

  resolveIncident() {
    const id = this.selectedIncident()?.id;
    if (!id) return;
    this.api.resolveIncident(id, {}).subscribe({
      next: (updated) => { this.selectedIncident.set(updated); this.loadData(); }
    });
  }

  closeIncident() {
    const id = this.selectedIncident()?.id;
    if (!id) return;
    this.api.closeIncident(id).subscribe({
      next: (updated) => { this.selectedIncident.set(updated); this.loadData(); }
    });
  }

  getSeverityClass(level: string): string {
    const classes: Record<string, string> = {
      CRITICAL: 'bg-red-500/20 text-red-400 border border-red-500/30',
      HIGH: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      MEDIUM: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      LOW: 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
    };
    return classes[level] || classes['MEDIUM'];
  }

  getTypeLabel(type: string): string {
    const et = this.lang.currentLang === 'et';
    const labels: Record<string, string> = {
      CYBERATTACK: et ? 'Küberrünnak' : 'Cyberattack',
      SYSTEM_FAILURE: et ? 'Süsteemi rike' : 'System Failure',
      DATA_BREACH: et ? 'Andmeleke' : 'Data Breach',
      THIRD_PARTY_FAILURE: et ? '3. osapoole rike' : 'Third-Party Failure',
      NATURAL_DISASTER: et ? 'Looduskatastroof' : 'Natural Disaster',
      OTHER: et ? 'Muu' : 'Other'
    };
    return labels[type] || type;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      DRAFT: 'bg-slate-700/50 text-slate-300',
      DETECTED: 'bg-amber-500/20 text-amber-400',
      INITIAL_SENT: 'bg-blue-500/20 text-blue-400',
      INTERMEDIATE_SENT: 'bg-indigo-500/20 text-indigo-400',
      FINAL_SENT: 'bg-emerald-500/20 text-emerald-400',
      CLOSED: 'bg-slate-600/50 text-slate-400'
    };
    return classes[status] || '';
  }

  getStatusLabel(status: string): string {
    const et = this.lang.currentLang === 'et';
    const labels: Record<string, string> = {
      DRAFT: et ? 'Mustand' : 'Draft',
      DETECTED: et ? 'Tuvastatud' : 'Detected',
      INITIAL_SENT: et ? 'Esialgne saadetud' : 'Initial Sent',
      INTERMEDIATE_SENT: et ? 'Vahearuanne saadetud' : 'Intermediate Sent',
      FINAL_SENT: et ? 'Lõpparuanne saadetud' : 'Final Sent',
      CLOSED: et ? 'Suletud' : 'Closed'
    };
    return labels[status] || status;
  }

  getStepClass(incident: IncidentReport, step: string): string {
    const statusOrder = ['DRAFT', 'DETECTED', 'INITIAL_SENT', 'INTERMEDIATE_SENT', 'FINAL_SENT', 'CLOSED'];
    const currentIdx = statusOrder.indexOf(incident.reportingStatus);
    const stepIdx = statusOrder.indexOf(step);
    if (currentIdx >= stepIdx) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    if (currentIdx === stepIdx - 1) return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    return 'bg-slate-700 text-slate-500 border border-slate-600';
  }

  getNextDeadline(incident: IncidentReport): string | null {
    const et = this.lang.currentLang === 'et';
    const now = new Date();

    if (!incident.initialReportSentAt && incident.initialReportDueAt) {
      const due = new Date(incident.initialReportDueAt);
      const hoursLeft = Math.round((due.getTime() - now.getTime()) / 3600000);
      return (et ? 'Esialgne teade: ' : 'Initial report: ') +
        (hoursLeft > 0 ? `${hoursLeft}h ${et ? 'jäänud' : 'remaining'}` : (et ? 'TÄHTAEG ÜLETATUD' : 'OVERDUE'));
    }
    if (!incident.intermediateReportSentAt && incident.intermediateReportDueAt) {
      const due = new Date(incident.intermediateReportDueAt);
      const hoursLeft = Math.round((due.getTime() - now.getTime()) / 3600000);
      return (et ? 'Vahearuanne: ' : 'Intermediate report: ') +
        (hoursLeft > 0 ? `${hoursLeft}h ${et ? 'jäänud' : 'remaining'}` : (et ? 'TÄHTAEG ÜLETATUD' : 'OVERDUE'));
    }
    if (!incident.finalReportSentAt && incident.finalReportDueAt) {
      const due = new Date(incident.finalReportDueAt);
      const daysLeft = Math.round((due.getTime() - now.getTime()) / 86400000);
      return (et ? 'Lõpparuanne: ' : 'Final report: ') +
        (daysLeft > 0 ? `${daysLeft}d ${et ? 'jäänud' : 'remaining'}` : (et ? 'TÄHTAEG ÜLETATUD' : 'OVERDUE'));
    }
    return null;
  }

  isOverdue(incident: IncidentReport): boolean {
    const now = new Date();
    if (!incident.initialReportSentAt && incident.initialReportDueAt && new Date(incident.initialReportDueAt) < now) return true;
    if (!incident.intermediateReportSentAt && incident.intermediateReportDueAt && new Date(incident.intermediateReportDueAt) < now) return true;
    if (!incident.finalReportSentAt && incident.finalReportDueAt && new Date(incident.finalReportDueAt) < now) return true;
    return false;
  }

  private resetForm() {
    this.newIncident = {
      incidentTitle: '', incidentType: 'CYBERATTACK', severityLevel: 'MEDIUM',
      description: '', detectedAt: '', clientsAffected: null, transactionsAffected: null,
      economicImpact: null, durationMinutes: null, dataLossType: 'NONE',
      reputationalImpact: 'NONE', competentAuthority: '', reportingContactName: '', reportingContactEmail: ''
    };
  }
}
