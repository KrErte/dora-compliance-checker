import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';

interface ScheduledReport {
  id: string;
  reportType: 'COMPLIANCE' | 'EXECUTIVE';
  frequency: 'WEEKLY' | 'MONTHLY';
  dayOfWeek?: number;
  dayOfMonth?: number;
  recipients: string[];
  enabled: boolean;
  lastSentAt?: string;
  nextSendAt?: string;
  createdAt: string;
}

@Component({
  selector: 'app-scheduled-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-3xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            Scheduled Reports
          </h1>
          <p class="text-slate-400 text-sm mt-1">
            Automate compliance report delivery to your team.
          </p>
        </div>
        <button (click)="showCreateForm.set(true)"
                class="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white
                       hover:from-emerald-400 hover:to-cyan-400 transition-all">
          + New Schedule
        </button>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="text-center py-16">
          <div class="w-10 h-10 mx-auto mb-3 rounded-full border-4 border-slate-700 border-t-blue-400 animate-spin"></div>
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && reports().length === 0 && !showCreateForm()) {
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
          <svg class="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <h3 class="text-lg font-semibold text-white mb-2">No Scheduled Reports</h3>
          <p class="text-sm text-slate-400 mb-4">Create your first scheduled report to automatically receive compliance summaries.</p>
          <button (click)="showCreateForm.set(true)"
                  class="px-5 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white
                         hover:from-emerald-400 hover:to-cyan-400 transition-all">
            Create Schedule
          </button>
        </div>
      }

      <!-- Create/Edit Form -->
      @if (showCreateForm()) {
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
          <h3 class="text-lg font-semibold text-white">
            {{ editingId ? 'Edit Schedule' : 'New Scheduled Report' }}
          </h3>

          <!-- Report Type -->
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Report Type</label>
            <div class="flex gap-2">
              <button (click)="form.reportType = 'COMPLIANCE'"
                      class="flex-1 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all"
                      [ngClass]="form.reportType === 'COMPLIANCE'
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                        : 'border-slate-600/50 text-slate-400 hover:border-slate-500/50'">
                <span class="block font-bold">Compliance Report</span>
                <span class="text-xs opacity-70">Full assessment status & gaps</span>
              </button>
              <button (click)="form.reportType = 'EXECUTIVE'"
                      class="flex-1 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all"
                      [ngClass]="form.reportType === 'EXECUTIVE'
                        ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                        : 'border-slate-600/50 text-slate-400 hover:border-slate-500/50'">
                <span class="block font-bold">Executive Summary</span>
                <span class="text-xs opacity-70">Board-level overview</span>
              </button>
            </div>
          </div>

          <!-- Frequency -->
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Frequency</label>
            <div class="flex gap-2">
              <button (click)="form.frequency = 'WEEKLY'; form.dayOfMonth = 1"
                      class="flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all"
                      [ngClass]="form.frequency === 'WEEKLY'
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                        : 'border-slate-600/50 text-slate-400 hover:border-slate-500/50'">
                Weekly
              </button>
              <button (click)="form.frequency = 'MONTHLY'; form.dayOfWeek = 1"
                      class="flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all"
                      [ngClass]="form.frequency === 'MONTHLY'
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                        : 'border-slate-600/50 text-slate-400 hover:border-slate-500/50'">
                Monthly
              </button>
            </div>
          </div>

          <!-- Day selector -->
          @if (form.frequency === 'WEEKLY') {
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5">Day of Week</label>
              <select [(ngModel)]="form.dayOfWeek"
                      class="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50">
                <option [value]="1">Monday</option>
                <option [value]="2">Tuesday</option>
                <option [value]="3">Wednesday</option>
                <option [value]="4">Thursday</option>
                <option [value]="5">Friday</option>
                <option [value]="6">Saturday</option>
                <option [value]="7">Sunday</option>
              </select>
            </div>
          }
          @if (form.frequency === 'MONTHLY') {
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5">Day of Month</label>
              <select [(ngModel)]="form.dayOfMonth"
                      class="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50">
                @for (d of daysOfMonth; track d) {
                  <option [value]="d">{{ d }}</option>
                }
              </select>
            </div>
          }

          <!-- Recipients -->
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Recipients (comma-separated emails)</label>
            <input [(ngModel)]="recipientsStr" type="text" placeholder="cto@company.com, compliance@company.com"
                   class="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-white
                          placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all">
            <p class="text-[10px] text-slate-500 mt-1">Separate multiple email addresses with commas.</p>
          </div>

          @if (formError()) {
            <p class="text-red-400 text-sm">{{ formError() }}</p>
          }

          <div class="flex justify-end gap-2 pt-2">
            <button (click)="cancelForm()"
                    class="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button (click)="saveReport()" [disabled]="saving()"
                    class="px-5 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white
                           hover:from-emerald-400 hover:to-cyan-400 transition-all disabled:opacity-50">
              @if (saving()) {
                <span class="flex items-center gap-2">
                  <span class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                  Saving...
                </span>
              } @else {
                {{ editingId ? 'Update' : 'Create' }}
              }
            </button>
          </div>
        </div>
      }

      <!-- Report list -->
      @if (!loading() && reports().length > 0) {
        <div class="space-y-3">
          @for (report of reports(); track report.id) {
            <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-all">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                       [ngClass]="report.reportType === 'COMPLIANCE'
                         ? 'bg-gradient-to-br from-emerald-400 to-cyan-500'
                         : 'bg-gradient-to-br from-blue-400 to-indigo-500'">
                    {{ report.reportType === 'COMPLIANCE' ? 'CR' : 'EX' }}
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-white">
                      {{ report.reportType === 'COMPLIANCE' ? 'Compliance Report' : 'Executive Summary' }}
                    </h3>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span class="text-xs text-slate-500">
                        {{ report.frequency === 'WEEKLY' ? 'Weekly' : 'Monthly' }}
                        &middot;
                        {{ getScheduleLabel(report) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <!-- Toggle -->
                  <button (click)="toggleReport(report)"
                          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                          [ngClass]="report.enabled ? 'bg-emerald-500' : 'bg-slate-600'">
                    <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                          [ngClass]="report.enabled ? 'translate-x-6' : 'translate-x-1'"></span>
                  </button>
                  <!-- Edit -->
                  <button (click)="editReport(report)"
                          class="px-2 py-1 text-xs rounded bg-slate-600/30 text-slate-300 hover:bg-slate-600/50 transition-colors">
                    Edit
                  </button>
                  <!-- Delete -->
                  <button (click)="deleteReport(report.id)"
                          class="px-2 py-1 text-xs rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                    Delete
                  </button>
                </div>
              </div>

              <!-- Recipients & last sent -->
              <div class="mt-3 flex flex-wrap gap-1.5">
                @for (email of report.recipients; track email) {
                  <span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-700/50 text-slate-400 border border-slate-600/30">
                    {{ email }}
                  </span>
                }
              </div>
              <div class="mt-2 flex gap-4 text-[10px] text-slate-500">
                @if (report.lastSentAt) {
                  <span>Last sent: {{ report.lastSentAt | date:'dd.MM.yyyy HH:mm' }}</span>
                }
                @if (report.nextSendAt) {
                  <span>Next: {{ report.nextSendAt | date:'dd.MM.yyyy' }}</span>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Toast -->
      @if (toast()) {
        <div class="fixed bottom-6 right-6 bg-emerald-500/90 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium z-50">
          {{ toast() }}
        </div>
      }
    </div>
  `
})
export class ScheduledReportsComponent implements OnInit {
  loading = signal(true);
  reports = signal<ScheduledReport[]>([]);
  showCreateForm = signal(false);
  saving = signal(false);
  formError = signal('');
  toast = signal('');
  editingId = '';
  recipientsStr = '';
  daysOfMonth = Array.from({ length: 28 }, (_, i) => i + 1);

  form: {
    reportType: 'COMPLIANCE' | 'EXECUTIVE';
    frequency: 'WEEKLY' | 'MONTHLY';
    dayOfWeek: number;
    dayOfMonth: number;
  } = {
    reportType: 'COMPLIANCE',
    frequency: 'WEEKLY',
    dayOfWeek: 1,
    dayOfMonth: 1
  };

  constructor(private api: ApiService, public lang: LangService) {}

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.api.getScheduledReports().subscribe({
      next: (reports) => {
        this.reports.set(reports);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getScheduleLabel(report: ScheduledReport): string {
    if (report.frequency === 'WEEKLY') {
      const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return days[report.dayOfWeek || 1] || 'Monday';
    }
    return 'Day ' + (report.dayOfMonth || 1);
  }

  editReport(report: ScheduledReport) {
    this.editingId = report.id;
    this.form.reportType = report.reportType;
    this.form.frequency = report.frequency;
    this.form.dayOfWeek = report.dayOfWeek || 1;
    this.form.dayOfMonth = report.dayOfMonth || 1;
    this.recipientsStr = (report.recipients || []).join(', ');
    this.showCreateForm.set(true);
  }

  cancelForm() {
    this.showCreateForm.set(false);
    this.editingId = '';
    this.recipientsStr = '';
    this.formError.set('');
    this.form = { reportType: 'COMPLIANCE', frequency: 'WEEKLY', dayOfWeek: 1, dayOfMonth: 1 };
  }

  saveReport() {
    const recipients = this.recipientsStr.split(',').map(e => e.trim()).filter(e => e.length > 0);
    if (recipients.length === 0) {
      this.formError.set('Please enter at least one recipient email.');
      return;
    }

    const data: any = {
      reportType: this.form.reportType,
      frequency: this.form.frequency,
      recipients
    };
    if (this.form.frequency === 'WEEKLY') {
      data.dayOfWeek = Number(this.form.dayOfWeek);
    } else {
      data.dayOfMonth = Number(this.form.dayOfMonth);
    }

    this.saving.set(true);
    this.formError.set('');

    const obs = this.editingId
      ? this.api.updateScheduledReport(this.editingId, data)
      : this.api.createScheduledReport(data);

    obs.subscribe({
      next: () => {
        this.cancelForm();
        this.loadReports();
        this.saving.set(false);
        this.showToast(this.editingId ? 'Schedule updated.' : 'Schedule created.');
      },
      error: (err) => {
        this.formError.set(err.error?.error || 'Failed to save schedule.');
        this.saving.set(false);
      }
    });
  }

  toggleReport(report: ScheduledReport) {
    this.api.updateScheduledReport(report.id, { enabled: !report.enabled }).subscribe({
      next: () => {
        report.enabled = !report.enabled;
        this.showToast(report.enabled ? 'Schedule enabled.' : 'Schedule paused.');
      }
    });
  }

  deleteReport(id: string) {
    this.api.deleteScheduledReport(id).subscribe({
      next: () => {
        this.reports.set(this.reports().filter(r => r.id !== id));
        this.showToast('Schedule deleted.');
      }
    });
  }

  private showToast(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3000);
  }
}
