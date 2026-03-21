import { Component, OnInit, OnDestroy, signal, computed, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LangService } from '../lang.service';
import { ApiService } from '../api.service';
import { IncidentReport } from '../models';

const PHASES = ['TRIAGE', 'CONTAINMENT', 'INVESTIGATION', 'REMEDIATION', 'RECOVERY', 'REVIEW'];

@Component({
  selector: 'app-incident-war-room',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto space-y-6">
      @if (loading()) {
        <div class="text-center py-12">
          <svg class="w-8 h-8 animate-spin text-red-400 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      } @else if (incident()) {
        <!-- Header with live status -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-1">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
              </div>
              <div>
                <h1 class="text-2xl font-bold text-white">{{ lang.t('warroom.title') }}</h1>
                <p class="text-sm text-slate-400">{{ incident()!.incidentTitle }}</p>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            @if (incident()!.warRoomActive) {
              <span class="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                {{ lang.t('warroom.active') }}
              </span>
              <button (click)="closeWarRoom()"
                      class="px-4 py-2 rounded-xl bg-slate-700/50 text-slate-600 text-sm hover:bg-slate-700 transition-colors">
                {{ lang.t('warroom.close_room') }}
              </button>
            } @else {
              <button (click)="activateWarRoom()"
                      class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold text-sm hover:shadow-lg transition-all">
                {{ lang.t('warroom.activate') }}
              </button>
            }
          </div>
        </div>

        @if (incident()!.warRoomActive) {
          <!-- Countdown Timers -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            @if (incident()!.initialReportDueAt && !incident()!.initialReportSentAt) {
              <div class="bg-white border border-red-500/30 rounded-xl p-4">
                <div class="text-xs text-slate-400 mb-1">{{ lang.t('warroom.initial_report_due') }}</div>
                <div class="text-xl font-mono font-bold" [class]="isOverdue(incident()!.initialReportDueAt) ? 'text-red-400' : 'text-white'">
                  {{ getCountdown(incident()!.initialReportDueAt) }}
                </div>
              </div>
            }
            @if (incident()!.intermediateReportDueAt && !incident()!.intermediateReportSentAt) {
              <div class="bg-white border border-amber-500/30 rounded-xl p-4">
                <div class="text-xs text-slate-400 mb-1">{{ lang.t('warroom.intermediate_due') }}</div>
                <div class="text-xl font-mono font-bold" [class]="isOverdue(incident()!.intermediateReportDueAt) ? 'text-red-400' : 'text-white'">
                  {{ getCountdown(incident()!.intermediateReportDueAt) }}
                </div>
              </div>
            }
            @if (incident()!.finalReportDueAt && !incident()!.finalReportSentAt) {
              <div class="bg-white border border-blue-500/30 rounded-xl p-4">
                <div class="text-xs text-slate-400 mb-1">{{ lang.t('warroom.final_due') }}</div>
                <div class="text-xl font-mono font-bold" [class]="isOverdue(incident()!.finalReportDueAt) ? 'text-red-400' : 'text-white'">
                  {{ getCountdown(incident()!.finalReportDueAt) }}
                </div>
              </div>
            }
          </div>

          <!-- Phase Timeline Stepper -->
          <div class="bg-white border border-slate-200 rounded-xl p-5">
            <h3 class="text-white font-semibold text-sm mb-4">{{ lang.t('warroom.phase_timeline') }}</h3>
            <div class="flex items-center gap-0 overflow-x-auto">
              @for (phase of phases; track phase; let i = $index) {
                <div class="flex items-center flex-shrink-0">
                  <button (click)="updatePhase(phase)"
                          class="flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg transition-all"
                          [class]="getCurrentPhaseIndex() >= i ? 'bg-red-500/10 border border-red-500/30' : 'opacity-40'">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                         [class]="getCurrentPhaseIndex() >= i ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-500'">
                      {{ i + 1 }}
                    </div>
                    <span class="text-xs" [class]="getCurrentPhaseIndex() >= i ? 'text-red-400' : 'text-slate-500'">
                      {{ getPhaseLabel(phase) }}
                    </span>
                  </button>
                  @if (i < phases.length - 1) {
                    <div class="w-6 h-px mx-1" [class]="getCurrentPhaseIndex() > i ? 'bg-red-500' : 'bg-slate-700'"></div>
                  }
                </div>
              }
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Main Content: Communication & Decision Logs -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Communication Log -->
              <div class="bg-white border border-slate-200 rounded-xl p-5">
                <h3 class="text-white font-semibold text-sm mb-3">{{ lang.t('warroom.comms_log') }}</h3>
                <div class="space-y-3 max-h-64 overflow-y-auto mb-3">
                  @for (entry of commLog(); track $index) {
                    <div class="bg-white rounded-lg p-3">
                      <div class="flex items-center justify-between mb-1">
                        <span class="text-xs font-medium text-blue-400">{{ entry.author || 'Team' }}</span>
                        <span class="text-xs text-slate-500">{{ formatTimestamp(entry.timestamp) }}</span>
                      </div>
                      <p class="text-sm text-slate-600">{{ entry.message }}</p>
                      @if (entry.channel) {
                        <span class="text-xs text-slate-500 mt-1 inline-block">via {{ entry.channel }}</span>
                      }
                    </div>
                  }
                  @if (commLog().length === 0) {
                    <p class="text-sm text-slate-500 text-center py-4">{{ lang.t('warroom.no_comms') }}</p>
                  }
                </div>
                <div class="flex gap-2">
                  <input [(ngModel)]="newCommMessage" (keyup.enter)="addCommunication()"
                         class="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                         [placeholder]="lang.t('warroom.type_message')"/>
                  <select [(ngModel)]="commChannel" class="bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs text-white focus:outline-none">
                    <option value="internal">Internal</option>
                    <option value="regulator">Regulator</option>
                    <option value="vendor">Vendor</option>
                    <option value="client">Client</option>
                  </select>
                  <button (click)="addCommunication()" [disabled]="!newCommMessage.trim()"
                          class="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium disabled:opacity-50">
                    {{ lang.t('warroom.send') }}
                  </button>
                </div>
              </div>

              <!-- Decision Log -->
              <div class="bg-white border border-slate-200 rounded-xl p-5">
                <h3 class="text-white font-semibold text-sm mb-3">{{ lang.t('warroom.decision_log') }}</h3>
                <div class="space-y-3 max-h-48 overflow-y-auto mb-3">
                  @for (entry of decisionLog(); track $index) {
                    <div class="bg-white rounded-lg p-3 border-l-2 border-amber-500">
                      <div class="flex items-center justify-between mb-1">
                        <span class="text-xs font-medium text-amber-400">{{ entry.decidedBy || 'Team' }}</span>
                        <span class="text-xs text-slate-500">{{ formatTimestamp(entry.timestamp) }}</span>
                      </div>
                      <p class="text-sm text-white font-medium">{{ entry.decision }}</p>
                      @if (entry.rationale) {
                        <p class="text-xs text-slate-400 mt-1">{{ entry.rationale }}</p>
                      }
                    </div>
                  }
                  @if (decisionLog().length === 0) {
                    <p class="text-sm text-slate-500 text-center py-4">{{ lang.t('warroom.no_decisions') }}</p>
                  }
                </div>
                <div class="space-y-2">
                  <input [(ngModel)]="newDecision" [placeholder]="lang.t('warroom.decision_placeholder')"
                         class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"/>
                  <div class="flex gap-2">
                    <input [(ngModel)]="decisionRationale" [placeholder]="lang.t('warroom.rationale_placeholder')"
                           class="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"/>
                    <button (click)="addDecision()" [disabled]="!newDecision.trim()"
                            class="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium disabled:opacity-50">
                      {{ lang.t('warroom.log_decision') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sidebar -->
            <div class="space-y-4">
              <!-- Status Board -->
              <div class="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 class="text-white font-semibold text-sm">{{ lang.t('warroom.status_board') }}</h3>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-slate-400">{{ lang.t('warroom.severity') }}</span>
                    <span class="font-medium" [class]="incident()!.severityLevel === 'CRITICAL' ? 'text-red-400' : incident()!.severityLevel === 'HIGH' ? 'text-orange-400' : 'text-amber-400'">
                      {{ incident()!.severityLevel }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">{{ lang.t('warroom.type') }}</span>
                    <span class="text-white">{{ incident()!.incidentType }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">{{ lang.t('warroom.major') }}</span>
                    <span [class]="incident()!.isMajor ? 'text-red-400' : 'text-blue-600'">
                      {{ incident()!.isMajor ? 'Yes' : 'No' }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">{{ lang.t('warroom.phase') }}</span>
                    <span class="text-white">{{ incident()!.warRoomPhase || 'N/A' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">{{ lang.t('warroom.status') }}</span>
                    <span class="text-white">{{ incident()!.reportingStatus }}</span>
                  </div>
                </div>
              </div>

              <!-- Role Assignment -->
              <div class="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 class="text-white font-semibold text-sm">{{ lang.t('warroom.roles') }}</h3>
                @for (role of roleKeys; track role) {
                  <div>
                    <label class="text-xs text-slate-400 mb-0.5 block">{{ getRoleLabel(role) }}</label>
                    <input [(ngModel)]="roles[role]" (blur)="saveRoles()"
                           class="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-slate-500/50"
                           placeholder="Name"/>
                  </div>
                }
              </div>

              <!-- Quick Actions -->
              <div class="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                <h3 class="text-white font-semibold text-sm mb-1">{{ lang.t('warroom.quick_actions') }}</h3>
                <a routerLink="/incident-reporting" class="block px-3 py-2 rounded-lg bg-slate-700/30 text-slate-600 text-xs hover:bg-slate-100 transition-colors">
                  {{ lang.t('warroom.submit_fsa_report') }}
                </a>
                <button (click)="exportPdf()" class="w-full text-left px-3 py-2 rounded-lg bg-slate-700/30 text-slate-600 text-xs hover:bg-slate-100 transition-colors">
                  {{ lang.t('warroom.export_pdf') }}
                </button>
              </div>
            </div>
          </div>
        } @else {
          <!-- War room not active -->
          <div class="text-center py-12 bg-slate-800/30 border border-slate-200 rounded-xl">
            <svg class="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
            <h3 class="text-white font-semibold mb-2">{{ lang.t('warroom.inactive_title') }}</h3>
            <p class="text-slate-400 text-sm mb-4">{{ lang.t('warroom.inactive_desc') }}</p>
            <button (click)="activateWarRoom()"
                    class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold text-sm hover:shadow-lg transition-all">
              {{ lang.t('warroom.activate') }}
            </button>
          </div>
        }
      }
    </div>
  `
})
export class IncidentWarRoomComponent implements OnInit, OnDestroy {
  incident = signal<any>(null);
  loading = signal(true);
  commLog = signal<any[]>([]);
  decisionLog = signal<any[]>([]);
  phases = PHASES;
  roleKeys = ['commandLead', 'techLead', 'commsLead', 'legalAdvisor'];
  roles: Record<string, string> = { commandLead: '', techLead: '', commsLead: '', legalAdvisor: '' };

  newCommMessage = '';
  commChannel = 'internal';
  newDecision = '';
  decisionRationale = '';

  private tickInterval: any;
  tickCounter = signal(0);

  constructor(
    public lang: LangService,
    private api: ApiService,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadIncident(id);

    if (isPlatformBrowser(this.platformId)) {
      this.tickInterval = setInterval(() => {
        this.tickCounter.update(v => v + 1);
      }, 1000);
    }
  }

  ngOnDestroy() {
    if (this.tickInterval) clearInterval(this.tickInterval);
  }

  loadIncident(id: string) {
    this.api.getIncident(id).subscribe({
      next: (inc: any) => {
        this.incident.set(inc);
        this.loading.set(false);
        this.parseWarRoomData(inc);
      },
      error: () => this.loading.set(false)
    });
  }

  parseWarRoomData(inc: any) {
    try { this.commLog.set(JSON.parse(inc.communicationLog || '[]')); } catch { this.commLog.set([]); }
    try { this.decisionLog.set(JSON.parse(inc.decisionLog || '[]')); } catch { this.decisionLog.set([]); }
    try {
      const r = JSON.parse(inc.warRoomRoles || '{}');
      this.roles = { commandLead: r.commandLead || '', techLead: r.techLead || '', commsLead: r.commsLead || '', legalAdvisor: r.legalAdvisor || '' };
    } catch { /* keep defaults */ }
  }

  activateWarRoom() {
    const id = this.incident()?.id;
    if (!id) return;
    this.api.activateWarRoom(id).subscribe({
      next: (inc: any) => {
        this.incident.set(inc);
        this.parseWarRoomData(inc);
      }
    });
  }

  closeWarRoom() {
    const id = this.incident()?.id;
    if (!id) return;
    this.api.closeWarRoom(id).subscribe({
      next: (inc: any) => {
        this.incident.set(inc);
        this.parseWarRoomData(inc);
      }
    });
  }

  updatePhase(phase: string) {
    const id = this.incident()?.id;
    if (!id) return;
    this.api.updateWarRoomPhase(id, phase).subscribe({
      next: (inc: any) => this.incident.set(inc)
    });
  }

  addCommunication() {
    if (!this.newCommMessage.trim()) return;
    const id = this.incident()?.id;
    if (!id) return;
    this.api.addWarRoomCommunication(id, { message: this.newCommMessage, channel: this.commChannel, author: 'User' }).subscribe({
      next: (inc: any) => {
        this.incident.set(inc);
        this.parseWarRoomData(inc);
        this.newCommMessage = '';
      }
    });
  }

  addDecision() {
    if (!this.newDecision.trim()) return;
    const id = this.incident()?.id;
    if (!id) return;
    this.api.addWarRoomDecision(id, { decision: this.newDecision, rationale: this.decisionRationale, decidedBy: 'User' }).subscribe({
      next: (inc: any) => {
        this.incident.set(inc);
        this.parseWarRoomData(inc);
        this.newDecision = '';
        this.decisionRationale = '';
      }
    });
  }

  saveRoles() {
    const id = this.incident()?.id;
    if (!id) return;
    this.api.updateWarRoomRoles(id, this.roles).subscribe({
      next: (inc: any) => this.incident.set(inc)
    });
  }

  getCurrentPhaseIndex(): number {
    const phase = this.incident()?.warRoomPhase;
    return phase ? PHASES.indexOf(phase) : -1;
  }

  getPhaseLabel(phase: string): string {
    return this.lang.t('warroom.phase_' + phase.toLowerCase());
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      commandLead: this.lang.t('warroom.role_command'),
      techLead: this.lang.t('warroom.role_tech'),
      commsLead: this.lang.t('warroom.role_comms'),
      legalAdvisor: this.lang.t('warroom.role_legal')
    };
    return labels[role] || role;
  }

  getCountdown(dateStr: string): string {
    void this.tickCounter(); // trigger reactivity
    if (!dateStr) return '--:--:--';
    const target = new Date(dateStr).getTime();
    const now = Date.now();
    const diff = target - now;
    if (diff <= 0) return 'OVERDUE';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  isOverdue(dateStr: string): boolean {
    void this.tickCounter();
    return dateStr ? new Date(dateStr).getTime() < Date.now() : false;
  }

  formatTimestamp(ts: string): string {
    if (!ts) return '';
    try { return new Date(ts).toLocaleString(); } catch { return ts; }
  }

  exportPdf() {
    const id = this.incident()?.id;
    if (!id) return;
    this.api.exportIncidentPdf(id).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `war-room-${id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }
}
