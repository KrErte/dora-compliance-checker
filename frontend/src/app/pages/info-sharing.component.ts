import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LangService } from '../lang.service';

interface SharingArrangement {
  id: string;
  communityName: string;
  communityType: string;
  joinedDate: string;
  status: 'ACTIVE' | 'PENDING' | 'LEFT';
  contactPerson: string;
  dataTypes: string;
  notifiedAuthority: boolean;
}

@Component({
  selector: 'app-info-sharing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
              </svg>
            </div>
            {{ lang.t('infoshare.information_sharing_module') }}
          </h1>
          <p class="text-slate-400 text-sm mt-1">{{ lang.t('infoshare.dora_art_45_manage_cyber_threat_intellig') }}</p>
        </div>
        <button (click)="showForm = true" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold text-sm hover:shadow-lg transition-all flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          {{ lang.t('infoshare.add_arrangement') }}
        </button>
      </div>

      <!-- DORA requirements info -->
      <div class="bg-teal-500/5 border border-teal-500/20 rounded-xl p-5">
        <h3 class="text-sm font-semibold text-teal-400 mb-2">{{ lang.t('infoshare.dora_art_45_requirements') }}</h3>
        <ul class="text-xs text-slate-300 space-y-1">
          <li>{{ lang.t('infoshare.u2022_voluntary_participation_in_cyber_t') }}</li>
          <li>{{ lang.t('infoshare.u2022_notify_competent_authority_upon_jo') }}</li>
          <li>{{ lang.t('infoshare.u2022_shared_info_ioc_ttps_security_aler') }}</li>
          <li>{{ lang.t('infoshare.u2022_ensure_gdpr_and_competition_law_co') }}</li>
        </ul>
      </div>

      @for (arr of arrangements(); track arr.id) {
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div class="flex items-start justify-between mb-2">
            <div>
              <h3 class="text-white font-semibold">{{ arr.communityName }}</h3>
              <p class="text-xs text-slate-400">{{ arr.communityType }} &bull; {{ lang.t('infoshare.joined') }}: {{ arr.joinedDate }}</p>
            </div>
            <div class="flex gap-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                    [class]="arr.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : arr.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-600/50 text-slate-400'">
                {{ arr.status }}
              </span>
              @if (!arr.notifiedAuthority) {
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                  {{ lang.t('infoshare.not_notified') }}
                </span>
              }
            </div>
          </div>
          <div class="text-xs text-slate-400 mb-2">{{ lang.t('infoshare.contact') }}: {{ arr.contactPerson }}</div>
          @if (arr.dataTypes) {
            <div class="text-xs text-slate-400">{{ lang.t('infoshare.shared_data_types') }}: {{ arr.dataTypes }}</div>
          }
          <div class="flex gap-2 mt-3">
            @if (!arr.notifiedAuthority) {
              <button (click)="arr.notifiedAuthority = true; save()" class="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/30">
                {{ lang.t('infoshare.mark_notified') }}
              </button>
            }
            <button (click)="deleteArrangement(arr.id)" class="text-slate-500 hover:text-red-400 text-xs">{{ lang.t('infoshare.delete') }}</button>
          </div>
        </div>
      }

      @if (arrangements().length === 0 && !showForm) {
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
          <p class="text-slate-400">{{ lang.t('infoshare.no_information_sharing_arrangements_adde') }}</p>
        </div>
      }

      @if (showForm) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="showForm = false">
          <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg" (click)="$event.stopPropagation()">
            <h2 class="text-lg font-bold text-white mb-4">{{ lang.t('infoshare.new_sharing_arrangement') }}</h2>
            <div class="space-y-4">
              <input [(ngModel)]="newArr.communityName" type="text" [placeholder]="lang.t('infoshare.community_name')" class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none">
              <select [(ngModel)]="newArr.communityType" class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none">
                <option value="ISAC">ISAC</option>
                <option value="CERT">CERT/CSIRT</option>
                <option value="INDUSTRY_GROUP">{{ lang.t('infoshare.industry_group') }}</option>
                <option value="BILATERAL">{{ lang.t('infoshare.bilateral') }}</option>
                <option value="OTHER">{{ lang.t('infoshare.other') }}</option>
              </select>
              <input [(ngModel)]="newArr.contactPerson" type="text" [placeholder]="lang.t('infoshare.contact_person')" class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none">
              <input [(ngModel)]="newArr.dataTypes" type="text" [placeholder]="lang.t('infoshare.shared_data_types_ioc_ttp')" class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none">
              <input [(ngModel)]="newArr.joinedDate" type="date" class="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none">
              <div class="flex justify-end gap-3">
                <button (click)="showForm = false" class="px-4 py-2 rounded-xl bg-slate-700/50 text-slate-300 text-sm">{{ lang.t('infoshare.cancel') }}</button>
                <button (click)="addArrangement()" [disabled]="!newArr.communityName" class="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-semibold disabled:opacity-50">
                  {{ lang.t('infoshare.add') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class InfoSharingComponent {
  arrangements = signal<SharingArrangement[]>([]);
  showForm = false;
  newArr: any = { communityName: '', communityType: 'ISAC', contactPerson: '', dataTypes: '', joinedDate: '' };

  constructor(public lang: LangService) {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('dora-info-sharing');
      if (saved) { try { this.arrangements.set(JSON.parse(saved)); } catch {} }
    }
  }

  addArrangement() {
    const arr: SharingArrangement = { id: crypto.randomUUID(), ...this.newArr, status: 'ACTIVE', notifiedAuthority: false };
    this.arrangements.update(a => [arr, ...a]);
    this.save();
    this.showForm = false;
    this.newArr = { communityName: '', communityType: 'ISAC', contactPerson: '', dataTypes: '', joinedDate: '' };
  }

  deleteArrangement(id: string) {
    this.arrangements.update(a => a.filter(x => x.id !== id));
    this.save();
  }

  save() { if (typeof localStorage !== 'undefined') localStorage.setItem('dora-info-sharing', JSON.stringify(this.arrangements())); }
}
