import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LangService } from '../lang.service';

interface TrainingRecord {
  id: string;
  personName: string;
  role: string;
  trainingTitle: string;
  trainingType: 'BOARD' | 'MANAGEMENT' | 'STAFF' | 'ICT_TEAM';
  completedDate: string;
  nextDueDate: string;
  status: 'COMPLETED' | 'OVERDUE' | 'UPCOMING';
}

@Component({
  selector: 'app-training-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
            {{ lang.currentLang === 'et' ? 'Koolituste j\u00e4lgija' : 'Training & Awareness Tracker' }}
          </h1>
          <p class="text-slate-400 text-sm mt-1">{{ lang.currentLang === 'et' ? 'DORA Art. 5, 13 — Juhatuse ja t\u00f6\u00f6tajate DORA koolituste j\u00e4lgimine' : 'DORA Art. 5, 13 — Track board and staff DORA training completion' }}</p>
        </div>
        <button (click)="showForm = true" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-sm hover:shadow-lg transition-all flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          {{ lang.currentLang === 'et' ? 'Lisa koolitus' : 'Add Training' }}
        </button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-white">{{ records().length }}</div>
          <div class="text-xs text-slate-400 mt-1">{{ lang.currentLang === 'et' ? 'Kokku' : 'Total' }}</div>
        </div>
        <div class="bg-slate-800/50 border border-emerald-500/30 rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-emerald-400">{{ countByStatus('COMPLETED') }}</div>
          <div class="text-xs text-slate-400 mt-1">{{ lang.currentLang === 'et' ? 'L\u00e4bitud' : 'Completed' }}</div>
        </div>
        <div class="bg-slate-800/50 border border-red-500/30 rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-red-400">{{ countByStatus('OVERDUE') }}</div>
          <div class="text-xs text-slate-400 mt-1">{{ lang.currentLang === 'et' ? 'T\u00e4htaja \u00fcletanud' : 'Overdue' }}</div>
        </div>
        <div class="bg-slate-800/50 border border-amber-500/30 rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-amber-400">{{ countByStatus('UPCOMING') }}</div>
          <div class="text-xs text-slate-400 mt-1">{{ lang.currentLang === 'et' ? 'Tulemas' : 'Upcoming' }}</div>
        </div>
      </div>

      <!-- Records list -->
      @for (record of records(); track record.id) {
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center gap-4">
          <div class="w-2 h-2 rounded-full flex-shrink-0"
               [class]="record.status === 'COMPLETED' ? 'bg-emerald-500' : record.status === 'OVERDUE' ? 'bg-red-500' : 'bg-amber-500'"></div>
          <div class="flex-1 min-w-0">
            <div class="text-sm text-white font-medium">{{ record.personName }}</div>
            <div class="text-xs text-slate-400">{{ record.trainingTitle }} &bull; {{ record.role }}</div>
          </div>
          <div class="text-xs text-slate-400">{{ record.completedDate || (lang.currentLang === 'et' ? 'Ei ole l\u00e4bitud' : 'Not completed') }}</div>
          <span class="px-2 py-1 rounded text-[10px] font-semibold"
                [class]="record.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : record.status === 'OVERDUE' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'">
            {{ record.status }}
          </span>
          <button (click)="deleteRecord(record.id)" class="text-slate-500 hover:text-red-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      }

      @if (records().length === 0 && !showForm) {
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
          <p class="text-slate-400">{{ lang.currentLang === 'et' ? 'Koolituste andmeid pole lisatud' : 'No training records added' }}</p>
        </div>
      }

      @if (showForm) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="showForm = false">
          <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg" (click)="$event.stopPropagation()">
            <h2 class="text-lg font-bold text-white mb-4">{{ lang.currentLang === 'et' ? 'Lisa koolitus' : 'Add Training Record' }}</h2>
            <div class="space-y-4">
              <input [(ngModel)]="newRecord.personName" type="text" [placeholder]="lang.currentLang === 'et' ? 'Isiku nimi' : 'Person Name'" class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none">
              <select [(ngModel)]="newRecord.role" class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none">
                <option value="Board Member">{{ lang.currentLang === 'et' ? 'Juhatuse liige' : 'Board Member' }}</option>
                <option value="CISO">CISO</option>
                <option value="Compliance Officer">{{ lang.currentLang === 'et' ? 'Vastavusametnik' : 'Compliance Officer' }}</option>
                <option value="ICT Staff">{{ lang.currentLang === 'et' ? 'ICT t\u00f6\u00f6taja' : 'ICT Staff' }}</option>
                <option value="Other">{{ lang.currentLang === 'et' ? 'Muu' : 'Other' }}</option>
              </select>
              <input [(ngModel)]="newRecord.trainingTitle" type="text" [placeholder]="lang.currentLang === 'et' ? 'Koolituse nimetus' : 'Training Title'" class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs text-slate-400 mb-1">{{ lang.currentLang === 'et' ? 'L\u00e4bimise kuup\u00e4ev' : 'Completed Date' }}</label>
                  <input [(ngModel)]="newRecord.completedDate" type="date" class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none">
                </div>
                <div>
                  <label class="block text-xs text-slate-400 mb-1">{{ lang.currentLang === 'et' ? 'J\u00e4rgmine t\u00e4htaeg' : 'Next Due Date' }}</label>
                  <input [(ngModel)]="newRecord.nextDueDate" type="date" class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none">
                </div>
              </div>
              <div class="flex justify-end gap-3">
                <button (click)="showForm = false" class="px-4 py-2 rounded-xl bg-slate-700/50 text-slate-300 text-sm">{{ lang.currentLang === 'et' ? 'T\u00fchista' : 'Cancel' }}</button>
                <button (click)="addRecord()" [disabled]="!newRecord.personName" class="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold disabled:opacity-50">
                  {{ lang.currentLang === 'et' ? 'Lisa' : 'Add' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class TrainingTrackerComponent {
  records = signal<TrainingRecord[]>([]);
  showForm = false;
  newRecord: any = { personName: '', role: 'Board Member', trainingTitle: '', completedDate: '', nextDueDate: '' };

  constructor(public lang: LangService) {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('dora-training-records');
      if (saved) { try { this.records.set(JSON.parse(saved)); } catch {} }
    }
  }

  addRecord() {
    const status = this.newRecord.completedDate ? 'COMPLETED' :
      (this.newRecord.nextDueDate && new Date(this.newRecord.nextDueDate) < new Date() ? 'OVERDUE' : 'UPCOMING');
    const record: TrainingRecord = { id: crypto.randomUUID(), ...this.newRecord, trainingType: 'STAFF', status };
    this.records.update(r => [record, ...r]);
    this.save();
    this.showForm = false;
    this.newRecord = { personName: '', role: 'Board Member', trainingTitle: '', completedDate: '', nextDueDate: '' };
  }

  countByStatus(status: string): number {
    return this.records().filter(r => r.status === status).length;
  }

  deleteRecord(id: string) {
    this.records.update(r => r.filter(x => x.id !== id));
    this.save();
  }

  private save() { if (typeof localStorage !== 'undefined') localStorage.setItem('dora-training-records', JSON.stringify(this.records())); }
}
