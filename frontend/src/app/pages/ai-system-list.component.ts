import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { LangService } from '../lang.service';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../auth/toast.service';

interface AiSystem {
  id: string;
  name: string;
  vendor: string;
  version: string;
  riskLevel: 'MINIMAL' | 'LIMITED' | 'HIGH' | 'UNACCEPTABLE';
  status: 'DRAFT' | 'ACTIVE' | 'RETIRED';
  complianceScore: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface PagedResult {
  content: AiSystem[];
  totalElements: number;
  totalPages: number;
}

@Component({
  selector: 'app-ai-system-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            {{ lang.l('AI-suesteemid (AI Act)', 'AI Systems (AI Act)') }}
          </h1>
          <p class="text-slate-400 text-sm mt-1">{{ lang.l('Hallake oma AI-suesteemide vastavust EU AI Actile', 'Manage your AI systems compliance with the EU AI Act') }}</p>
        </div>
        <button (click)="navigateToNew()"
                class="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-lg transition-all flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          {{ lang.l('Lisa uus suesteem', 'Add New System') }}
        </button>
      </div>

      <!-- Filter Bar -->
      <div class="bg-white border border-slate-200 rounded-2xl p-4">
        <div class="flex flex-col md:flex-row gap-3">
          <!-- Search -->
          <div class="flex-1 relative">
            <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onFilterChange()"
                   [placeholder]="lang.l('Otsi suesteeme...', 'Search systems...')"
                   class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 text-sm">
          </div>

          <!-- Risk Level Filter -->
          <select [(ngModel)]="filterRiskLevel" (ngModelChange)="onFilterChange()"
                  class="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500/50 text-sm min-w-[160px]">
            <option value="">{{ lang.l('Koik riskitasemed', 'All Risk Levels') }}</option>
            <option value="MINIMAL">{{ lang.l('Minimaalne', 'Minimal') }}</option>
            <option value="LIMITED">{{ lang.l('Piiratud', 'Limited') }}</option>
            <option value="HIGH">{{ lang.l('Kорge', 'High') }}</option>
            <option value="UNACCEPTABLE">{{ lang.l('Vastuvotmatu', 'Unacceptable') }}</option>
          </select>

          <!-- Status Filter -->
          <select [(ngModel)]="filterStatus" (ngModelChange)="onFilterChange()"
                  class="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500/50 text-sm min-w-[140px]">
            <option value="">{{ lang.l('Koik staatused', 'All Statuses') }}</option>
            <option value="DRAFT">{{ lang.l('Mustand', 'Draft') }}</option>
            <option value="ACTIVE">{{ lang.l('Aktiivne', 'Active') }}</option>
            <option value="RETIRED">{{ lang.l('Kasutuselt maas', 'Retired') }}</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex justify-center py-16">
          <div class="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      }

      <!-- Systems Table -->
      @if (!loading() && systems().length > 0) {
        <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-slate-200">
                  <th class="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{{ lang.l('Nimi', 'Name') }}</th>
                  <th class="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{{ lang.l('Tarnija', 'Vendor') }}</th>
                  <th class="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{{ lang.l('Riskitase', 'Risk Level') }}</th>
                  <th class="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{{ lang.l('Staatus', 'Status') }}</th>
                  <th class="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{{ lang.l('Vastavus', 'Compliance') }}</th>
                  <th class="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{{ lang.l('Tegevused', 'Actions') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                @for (system of systems(); track system.id) {
                  <tr class="hover:bg-slate-50/20 transition-colors cursor-pointer" (click)="navigateToDetail(system.id)">
                    <!-- Name -->
                    <td class="px-6 py-4">
                      <div class="text-sm font-medium text-slate-900">{{ system.name }}</div>
                      @if (system.version) {
                        <div class="text-xs text-slate-500 mt-0.5">v{{ system.version }}</div>
                      }
                    </td>

                    <!-- Vendor -->
                    <td class="px-6 py-4">
                      <span class="text-sm text-slate-600">{{ system.vendor || '-' }}</span>
                    </td>

                    <!-- Risk Level Badge -->
                    <td class="px-6 py-4">
                      <span class="px-2.5 py-1 rounded-full text-xs font-semibold"
                            [class]="getRiskBadgeClass(system.riskLevel)">
                        {{ getRiskLabel(system.riskLevel) }}
                      </span>
                    </td>

                    <!-- Status -->
                    <td class="px-6 py-4">
                      <span class="px-2.5 py-1 rounded-full text-xs font-semibold"
                            [class]="getStatusBadgeClass(system.status)">
                        {{ getStatusLabel(system.status) }}
                      </span>
                    </td>

                    <!-- Compliance Score Progress Bar -->
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="flex-1 h-2 bg-slate-100/50 rounded-full overflow-hidden max-w-[120px]">
                          <div class="h-full rounded-full transition-all duration-500"
                               [class]="getScoreBarClass(system.complianceScore)"
                               [style.width.%]="system.complianceScore">
                          </div>
                        </div>
                        <span class="text-xs font-semibold min-w-[36px] text-right"
                              [class]="getScoreTextClass(system.complianceScore)">
                          {{ system.complianceScore }}%
                        </span>
                      </div>
                    </td>

                    <!-- Actions -->
                    <td class="px-6 py-4 text-right">
                      <div class="flex items-center justify-end gap-2" (click)="$event.stopPropagation()">
                        <button (click)="navigateToDetail(system.id)"
                                class="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-500 transition-colors"
                                [title]="lang.l('Vaata', 'View')">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                        </button>
                        <button (click)="confirmDelete(system)"
                                class="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                                [title]="lang.l('Kustuta', 'Delete')">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="flex items-center justify-between px-6 py-4 border-t border-slate-200">
              <div class="text-sm text-slate-400">
                {{ lang.l('Kokku', 'Total') }}: {{ totalElements() }} {{ lang.l('suesteemi', 'systems') }}
              </div>
              <div class="flex items-center gap-1">
                <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 0"
                        class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-slate-400 hover:text-slate-900 hover:bg-slate-100">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                @for (p of pageNumbers(); track p) {
                  <button (click)="goToPage(p)" class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                          [class]="p === currentPage() ? 'bg-blue-600/20 text-blue-500 border border-blue-500/30' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'">
                    {{ p + 1 }}
                  </button>
                }
                <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() >= totalPages() - 1"
                        class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-slate-400 hover:text-slate-900 hover:bg-slate-100">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && systems().length === 0) {
        <div class="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div class="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-6">
            <svg class="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-slate-900 mb-2">{{ lang.l('AI-suesteeme ei leitud', 'No AI Systems Found') }}</h3>
          <p class="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            {{ lang.l('Alustage oma AI-suesteemide registreerimist, et jalgida EU AI Act vastavust.', 'Start registering your AI systems to track EU AI Act compliance.') }}
          </p>
          <button (click)="navigateToNew()"
                  class="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-lg transition-all inline-flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            {{ lang.l('Lisa esimene suesteem', 'Add Your First System') }}
          </button>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (systemToDelete()) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="systemToDelete.set(null)">
          <div class="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl" (click)="$event.stopPropagation()">
            <div class="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-slate-900 text-center mb-2">{{ lang.l('Kustuta suesteem', 'Delete System') }}</h3>
            <p class="text-slate-400 text-sm text-center mb-6">
              {{ lang.l('Kas olete kindel, et soovite kustutada', 'Are you sure you want to delete') }}
              <strong class="text-slate-900">{{ systemToDelete()!.name }}</strong>?
              {{ lang.l('Seda toimingut ei saa tagasi votta.', 'This action cannot be undone.') }}
            </p>
            <div class="flex gap-3">
              <button (click)="systemToDelete.set(null)"
                      class="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 text-slate-600 font-medium text-sm hover:bg-slate-600 transition-colors">
                {{ lang.l('Tuehista', 'Cancel') }}
              </button>
              <button (click)="deleteSystem()" [disabled]="deleting()"
                      class="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 font-medium text-sm hover:bg-red-500/30 transition-colors disabled:opacity-50">
                @if (deleting()) {
                  <span class="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin inline-block mr-2"></span>
                }
                {{ lang.l('Kustuta', 'Delete') }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AiSystemListComponent implements OnInit {
  lang = inject(LangService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  systems = signal<AiSystem[]>([]);
  loading = signal(true);
  totalElements = signal(0);
  totalPages = signal(0);
  currentPage = signal(0);
  pageSize = 20;

  searchQuery = '';
  filterRiskLevel = '';
  filterStatus = '';

  systemToDelete = signal<AiSystem | null>(null);
  deleting = signal(false);

  private searchTimeout: any;

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(0, current - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible);
    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible);
    }
    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
  });

  ngOnInit(): void {
    this.loadSystems();
  }

  onFilterChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(0);
      this.loadSystems();
    }, 300);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
    this.loadSystems();
  }

  loadSystems(): void {
    this.loading.set(true);
    const params: any = {
      page: this.currentPage().toString(),
      size: this.pageSize.toString()
    };
    if (this.searchQuery.trim()) params.search = this.searchQuery.trim();
    if (this.filterRiskLevel) params.riskLevel = this.filterRiskLevel;
    if (this.filterStatus) params.status = this.filterStatus;

    const query = new URLSearchParams(params).toString();
    this.http.get<PagedResult>(`/api/ai-systems?${query}`).subscribe({
      next: (res) => {
        this.systems.set(res.content);
        this.totalElements.set(res.totalElements);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.show(this.lang.l('Suesteemide laadimine ebaonnestus', 'Failed to load systems'), 'error');
      }
    });
  }

  navigateToNew(): void {
    this.router.navigate(['/ai-systems', 'new']);
  }

  navigateToDetail(id: string): void {
    this.router.navigate(['/ai-systems', id]);
  }

  confirmDelete(system: AiSystem): void {
    this.systemToDelete.set(system);
  }

  deleteSystem(): void {
    const system = this.systemToDelete();
    if (!system) return;
    this.deleting.set(true);
    this.http.delete(`/api/ai-systems/${system.id}`).subscribe({
      next: () => {
        this.deleting.set(false);
        this.systemToDelete.set(null);
        this.toast.show(this.lang.l('Suesteem kustutatud', 'System deleted successfully'), 'success');
        this.loadSystems();
      },
      error: () => {
        this.deleting.set(false);
        this.toast.show(this.lang.l('Kustutamine ebaonnestus', 'Failed to delete system'), 'error');
      }
    });
  }

  getRiskBadgeClass(level: string): string {
    switch (level) {
      case 'UNACCEPTABLE': return 'bg-red-500/15 text-red-400 border border-red-500/25';
      case 'HIGH': return 'bg-orange-500/15 text-orange-400 border border-orange-500/25';
      case 'LIMITED': return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25';
      case 'MINIMAL': return 'bg-blue-50 text-blue-600 border border-blue-500/25';
      default: return 'bg-slate-500/15 text-slate-400 border border-slate-500/25';
    }
  }

  getRiskLabel(level: string): string {
    switch (level) {
      case 'UNACCEPTABLE': return this.lang.l('Vastuvotmatu', 'Unacceptable');
      case 'HIGH': return this.lang.l('Korge', 'High');
      case 'LIMITED': return this.lang.l('Piiratud', 'Limited');
      case 'MINIMAL': return this.lang.l('Minimaalne', 'Minimal');
      default: return level;
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'bg-blue-50 text-blue-600 border border-blue-500/25';
      case 'DRAFT': return 'bg-slate-500/15 text-slate-400 border border-slate-500/25';
      case 'RETIRED': return 'bg-amber-500/15 text-amber-400 border border-amber-500/25';
      default: return 'bg-slate-500/15 text-slate-400 border border-slate-500/25';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'ACTIVE': return this.lang.l('Aktiivne', 'Active');
      case 'DRAFT': return this.lang.l('Mustand', 'Draft');
      case 'RETIRED': return this.lang.l('Kasutuselt maas', 'Retired');
      default: return status;
    }
  }

  getScoreBarClass(score: number): string {
    if (score >= 80) return 'bg-blue-600';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  getScoreTextClass(score: number): string {
    if (score >= 80) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  }
}
