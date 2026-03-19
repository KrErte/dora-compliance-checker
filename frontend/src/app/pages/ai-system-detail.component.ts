import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { LangService } from '../lang.service';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-ai-system-detail',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto">
      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <svg class="w-8 h-8 animate-spin text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
          </svg>
        </div>
      } @else if (system()) {
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <div class="flex items-center gap-3 mb-1">
              <a routerLink="/ai-systems" class="text-slate-400 hover:text-blue-400 transition-colors">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
              </a>
              <h1 class="text-2xl font-bold text-white">{{ system()!.name }}</h1>
              <span class="px-2 py-0.5 rounded-full text-xs font-bold" [class]="riskBadgeClass(system()!.riskLevel)">
                {{ system()!.riskLevel || lang.l('Klassifitseerimata', 'Not Classified') }}
              </span>
            </div>
            <p class="text-sm text-slate-400 ml-8">{{ system()!.vendor }} {{ system()!.version ? 'v' + system()!.version : '' }}</p>
          </div>
          <div class="flex items-center gap-3">
            <a [routerLink]="'/ai-systems/' + system()!.id + '/classify'"
               class="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-400 hover:to-blue-400 transition-all flex items-center gap-2">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
              {{ lang.l('Klassifitseeri', 'Classify') }}
            </a>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex items-center gap-1 mb-6 border-b border-slate-700/50">
          @for (t of tabs; track t.key) {
            <button type="button" (click)="activeTab.set(t.key)"
                    class="px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px"
                    [class]="activeTab() === t.key ? 'text-blue-400 border-blue-400' : 'text-slate-400 border-transparent hover:text-white hover:border-slate-600'">
              {{ lang.l(t.labelEt, t.labelEn) }}
            </button>
          }
        </div>

        <!-- Overview Tab -->
        @if (activeTab() === 'overview') {
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-4">
              @if (system()!.description) {
                <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                  <h3 class="text-sm font-semibold text-slate-300 mb-2">{{ lang.l('Kirjeldus', 'Description') }}</h3>
                  <p class="text-sm text-slate-400">{{ system()!.description }}</p>
                </div>
              }
              @if (system()!.purpose) {
                <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                  <h3 class="text-sm font-semibold text-slate-300 mb-2">{{ lang.l('Eesmärk', 'Purpose') }}</h3>
                  <p class="text-sm text-slate-400">{{ system()!.purpose }}</p>
                </div>
              }
            </div>
            <div class="space-y-4">
              <!-- Info Card -->
              <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-3">
                <div>
                  <p class="text-[10px] text-slate-500 uppercase tracking-wider">{{ lang.l('Staatus', 'Status') }}</p>
                  <p class="text-sm text-white font-medium">{{ system()!.status }}</p>
                </div>
                <div>
                  <p class="text-[10px] text-slate-500 uppercase tracking-wider">{{ lang.l('Juurutuskontekst', 'Deployment') }}</p>
                  <p class="text-sm text-white font-medium">{{ system()!.deploymentContext }}</p>
                </div>
                <div>
                  <p class="text-[10px] text-slate-500 uppercase tracking-wider">{{ lang.l('Organisatsiooni roll', 'Org Role') }}</p>
                  <p class="text-sm text-white font-medium">{{ system()!.organizationRole }}</p>
                </div>
                @if (system()!.complianceScore != null) {
                  <div>
                    <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{{ lang.l('Vastavusskoor', 'Compliance Score') }}</p>
                    <div class="flex items-center gap-2">
                      <div class="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-500"
                             [style.width.%]="system()!.complianceScore"
                             [class]="system()!.complianceScore >= 80 ? 'bg-emerald-500' : system()!.complianceScore >= 50 ? 'bg-amber-500' : 'bg-red-500'"></div>
                      </div>
                      <span class="text-sm font-bold" [class]="system()!.complianceScore >= 80 ? 'text-emerald-400' : system()!.complianceScore >= 50 ? 'text-amber-400' : 'text-red-400'">{{ system()!.complianceScore }}%</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <!-- Obligations Tab -->
        @if (activeTab() === 'obligations') {
          @if (obligations().length === 0) {
            <div class="text-center py-12">
              <p class="text-slate-500 mb-4">{{ lang.l('Kohustused puuduvad. Klassifitseerige süsteem kõigepealt.', 'No obligations yet. Classify the system first.') }}</p>
              <a [routerLink]="'/ai-systems/' + system()!.id + '/classify'"
                 class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-colors">
                {{ lang.l('Klassifitseeri', 'Classify') }}
              </a>
            </div>
          } @else {
            <div class="space-y-3">
              @for (ob of obligations(); track ob.id) {
                <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-start gap-4">
                  <button type="button" (click)="toggleObligationStatus(ob)"
                          class="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all"
                          [class]="ob.status === 'COMPLETED' ? 'border-emerald-500 bg-emerald-500/20' : ob.status === 'IN_PROGRESS' ? 'border-amber-500 bg-amber-500/10' : 'border-slate-600 hover:border-slate-500'">
                    @if (ob.status === 'COMPLETED') {
                      <svg class="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5L20 7"/></svg>
                    }
                  </button>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">{{ ob.articleRef }}</span>
                      <span class="text-sm font-medium text-white">{{ ob.articleTitle }}</span>
                    </div>
                    <p class="text-xs text-slate-400">{{ ob.description }}</p>
                  </div>
                  <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0"
                        [class]="ob.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : ob.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-400' : ob.status === 'NOT_APPLICABLE' ? 'bg-slate-700/50 text-slate-500' : 'bg-slate-700/50 text-slate-400'">
                    {{ ob.status }}
                  </span>
                </div>
              }
            </div>
          }
        }

        <!-- Documents Tab -->
        @if (activeTab() === 'documents') {
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-slate-300">{{ lang.l('Genereeritud dokumendid', 'Generated Documents') }}</h3>
            <a [routerLink]="'/ai-systems/' + system()!.id + '/documents'"
               class="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors">
              {{ lang.l('Halda dokumente', 'Manage Documents') }}
            </a>
          </div>
          @if (documents().length === 0) {
            <div class="text-center py-12">
              <p class="text-slate-500">{{ lang.l('Dokumendid puuduvad', 'No documents yet') }}</p>
            </div>
          } @else {
            <div class="space-y-2">
              @for (doc of documents(); track doc.id) {
                <div class="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-white">{{ doc.title }}</p>
                    <p class="text-xs text-slate-500">{{ doc.documentType }} &middot; {{ doc.status }}</p>
                  </div>
                  <span class="text-xs px-2 py-0.5 rounded-full font-bold"
                        [class]="doc.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : doc.status === 'GENERATING' ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-red-500/20 text-red-400'">
                    {{ doc.status }}
                  </span>
                </div>
              }
            </div>
          }
        }
      } @else {
        <div class="text-center py-20">
          <p class="text-slate-500">{{ lang.l('AI süsteemi ei leitud', 'AI system not found') }}</p>
          <a routerLink="/ai-systems" class="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">{{ lang.l('Tagasi nimekirja', 'Back to list') }}</a>
        </div>
      }
    </div>
  `
})
export class AiSystemDetailComponent implements OnInit {
  lang = inject(LangService);
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  system = signal<any>(null);
  obligations = signal<any[]>([]);
  documents = signal<any[]>([]);
  activeTab = signal('overview');

  tabs = [
    { key: 'overview', labelEt: 'Ülevaade', labelEn: 'Overview' },
    { key: 'obligations', labelEt: 'Kohustused', labelEn: 'Obligations' },
    { key: 'documents', labelEt: 'Dokumendid', labelEn: 'Documents' }
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loading.set(false); return; }

    this.apiService.getAiSystem(id).subscribe({
      next: (data: any) => {
        this.system.set(data);
        this.loading.set(false);
        this.loadObligations(id);
        this.loadDocuments(id);
      },
      error: () => this.loading.set(false)
    });
  }

  loadObligations(id: string) {
    this.apiService.getAiActObligations(id).subscribe({
      next: (data: any) => this.obligations.set(data || []),
      error: () => {}
    });
  }

  loadDocuments(id: string) {
    this.apiService.getAiActDocuments(id).subscribe({
      next: (data: any) => this.documents.set(data || []),
      error: () => {}
    });
  }

  toggleObligationStatus(ob: any) {
    const nextStatus = ob.status === 'NOT_STARTED' ? 'IN_PROGRESS' : ob.status === 'IN_PROGRESS' ? 'COMPLETED' : 'NOT_STARTED';
    this.apiService.updateAiActObligation(ob.aiSystemId || this.system()!.id, ob.id, { status: nextStatus }).subscribe({
      next: (updated: any) => {
        this.obligations.update(list => list.map(o => o.id === ob.id ? { ...o, status: nextStatus } : o));
      }
    });
  }

  riskBadgeClass(riskLevel: string): string {
    switch (riskLevel) {
      case 'UNACCEPTABLE': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      case 'LIMITED': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'MINIMAL': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      default: return 'bg-slate-700/50 text-slate-400 border border-slate-600/50';
    }
  }
}
