import { Component, OnInit, signal } from '@angular/core';
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

      @if (!loading()) {
        <div class="space-y-2">
          @for (item of filteredItems(); track item.id) {
            <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/50 transition-all">
              <div class="flex flex-col md:flex-row md:items-center gap-3">
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
}
