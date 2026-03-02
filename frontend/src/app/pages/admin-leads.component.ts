import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, LeadCompany, LeadPage, LeadStats } from '../services/admin.service';

@Component({
  selector: 'app-admin-leads',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white">Lead Dashboard</h1>
          <p class="text-sm text-slate-400 mt-1">Baltic financial company leads for DORA outreach</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="exportCsv()"
                  class="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Export CSV
          </button>
          <button (click)="runCrawler()"
                  [disabled]="crawling()"
                  class="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2">
            @if (crawling()) {
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Crawling...
            } @else {
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Run Crawler
            }
          </button>
        </div>
      </div>

      <!-- Toast -->
      @if (toast()) {
        <div class="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-fade-in"
             [class]="toast()!.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'">
          {{ toast()!.message }}
        </div>
      }

      <!-- Stats Cards -->
      @if (stats()) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <p class="text-xs text-slate-400 uppercase tracking-wider">Total Leads</p>
            <p class="text-2xl font-bold text-white mt-1">{{ stats()!.total }}</p>
          </div>
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <p class="text-xs text-slate-400 uppercase tracking-wider">Estonia</p>
            <p class="text-2xl font-bold text-blue-400 mt-1">{{ stats()!.byCountry['EE'] || 0 }}</p>
          </div>
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <p class="text-xs text-slate-400 uppercase tracking-wider">Latvia</p>
            <p class="text-2xl font-bold text-red-400 mt-1">{{ stats()!.byCountry['LV'] || 0 }}</p>
          </div>
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <p class="text-xs text-slate-400 uppercase tracking-wider">Lithuania</p>
            <p class="text-2xl font-bold text-amber-400 mt-1">{{ stats()!.byCountry['LT'] || 0 }}</p>
          </div>
        </div>

        <!-- Status row -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <p class="text-xs text-slate-400 uppercase tracking-wider">New</p>
            <p class="text-xl font-bold text-emerald-400 mt-1">{{ stats()!.byStatus['NEW'] || 0 }}</p>
          </div>
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <p class="text-xs text-slate-400 uppercase tracking-wider">Contacted</p>
            <p class="text-xl font-bold text-blue-400 mt-1">{{ stats()!.byStatus['CONTACTED'] || 0 }}</p>
          </div>
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <p class="text-xs text-slate-400 uppercase tracking-wider">Qualified</p>
            <p class="text-xl font-bold text-violet-400 mt-1">{{ stats()!.byStatus['QUALIFIED'] || 0 }}</p>
          </div>
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <p class="text-xs text-slate-400 uppercase tracking-wider">Converted</p>
            <p class="text-xl font-bold text-amber-400 mt-1">{{ stats()!.byStatus['CONVERTED'] || 0 }}</p>
          </div>
        </div>
      }

      <!-- Filters -->
      <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-4">
        <div class="flex flex-wrap items-center gap-3">
          <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onFilterChange()"
                 placeholder="Search company name or registry code..."
                 class="flex-1 min-w-[200px] bg-slate-700 border border-slate-600 text-slate-300 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none" />

          <select [(ngModel)]="filterCountry" (ngModelChange)="onFilterChange()"
                  class="bg-slate-700 border border-slate-600 text-slate-300 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none cursor-pointer">
            <option value="">All Countries</option>
            <option value="EE">Estonia</option>
            <option value="LV">Latvia</option>
            <option value="LT">Lithuania</option>
          </select>

          <select [(ngModel)]="filterLicenseType" (ngModelChange)="onFilterChange()"
                  class="bg-slate-700 border border-slate-600 text-slate-300 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none cursor-pointer">
            <option value="">All License Types</option>
            <option value="BANK">Bank</option>
            <option value="INSURANCE">Insurance</option>
            <option value="PAYMENT_INSTITUTION">Payment Institution</option>
            <option value="EMONEY">E-Money</option>
            <option value="INVESTMENT_FIRM">Investment Firm</option>
            <option value="FUND_MANAGER">Fund Manager</option>
            <option value="FINTECH">Fintech</option>
          </select>

          <select [(ngModel)]="filterStatus" (ngModelChange)="onFilterChange()"
                  class="bg-slate-700 border border-slate-600 text-slate-300 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none cursor-pointer">
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="CONVERTED">Converted</option>
          </select>

          <select [(ngModel)]="filterSector" (ngModelChange)="onFilterChange()"
                  class="bg-slate-700 border border-slate-600 text-slate-300 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none cursor-pointer">
            <option value="">All Sectors</option>
            <option value="Banking">Banking</option>
            <option value="Insurance">Insurance</option>
            <option value="Payment">Payment</option>
            <option value="Investment">Investment</option>
            <option value="Fintech">Fintech</option>
          </select>

          @if (hasActiveFilters()) {
            <button (click)="clearFilters()"
                    class="px-3 py-2 text-xs text-slate-400 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg transition-colors">
              Clear Filters
            </button>
          }
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <div class="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (error()) {
        <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <p class="text-red-400">{{ error() }}</p>
          <button (click)="loadLeads()" class="mt-3 px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            Retry
          </button>
        </div>
      } @else {
        <!-- Table -->
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-700/50">
                  <th (click)="sortBy('companyName')" class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white">
                    Company {{ sortIcon('companyName') }}
                  </th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Country</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">License</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Sector</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Website</th>
                  <th (click)="sortBy('createdAt')" class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white">
                    Added {{ sortIcon('createdAt') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                @for (lead of leads(); track lead.id) {
                  <tr (click)="openLead(lead)" class="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors cursor-pointer">
                    <td class="px-4 py-3">
                      <div class="text-slate-200 font-medium">{{ lead.companyName }}</div>
                      @if (lead.registryCode) {
                        <div class="text-[10px] text-slate-500 font-mono">{{ lead.registryCode }}</div>
                      }
                    </td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-0.5 text-[10px] font-bold rounded-full"
                            [class]="lead.country === 'EE' ? 'bg-blue-500/20 text-blue-400' :
                                     lead.country === 'LV' ? 'bg-red-500/20 text-red-400' :
                                     'bg-amber-500/20 text-amber-400'">
                        {{ countryName(lead.country) }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-slate-400 text-xs">{{ formatLicense(lead.licenseType) }}</td>
                    <td class="px-4 py-3 text-slate-400 text-xs">{{ lead.sector || '—' }}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-0.5 text-[10px] font-bold rounded-full"
                            [class]="statusClass(lead.leadStatus)">
                        {{ lead.leadStatus }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      @if (lead.website) {
                        <a [href]="lead.website" target="_blank" (click)="$event.stopPropagation()"
                           class="text-emerald-400 hover:text-emerald-300 text-xs truncate max-w-[150px] block">
                          {{ shortenUrl(lead.website) }}
                        </a>
                      } @else {
                        <span class="text-slate-600">—</span>
                      }
                    </td>
                    <td class="px-4 py-3 text-xs text-slate-500">{{ formatDate(lead.createdAt) }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="px-4 py-12 text-center text-slate-500">
                      No leads found. Try adjusting filters or run the crawler.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="flex items-center justify-between px-4 py-3 border-t border-slate-700/50">
              <p class="text-xs text-slate-500">
                Showing {{ currentPage() * pageSize + 1 }}–{{ Math.min((currentPage() + 1) * pageSize, totalElements()) }} of {{ totalElements() }}
              </p>
              <div class="flex items-center gap-1">
                <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 0"
                        class="px-3 py-1 text-xs text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  Prev
                </button>
                @for (p of pageNumbers(); track p) {
                  <button (click)="goToPage(p)"
                          class="px-3 py-1 text-xs rounded transition-colors"
                          [class]="p === currentPage() ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700'">
                    {{ p + 1 }}
                  </button>
                }
                <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() >= totalPages() - 1"
                        class="px-3 py-1 text-xs text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  Next
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Bulk actions -->
      @if (selectedIds().length > 0) {
        <div class="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-600 rounded-xl px-6 py-3 shadow-2xl flex items-center gap-4 z-50">
          <span class="text-sm text-slate-300">{{ selectedIds().length }} selected</span>
          <select [(ngModel)]="bulkStatus" class="bg-slate-700 border border-slate-600 text-slate-300 text-xs rounded-lg px-2 py-1">
            <option value="">Change status...</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="CONVERTED">Converted</option>
          </select>
          <button (click)="applyBulkStatus()" [disabled]="!bulkStatus"
                  class="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white rounded-lg transition-colors">
            Apply
          </button>
          <button (click)="clearSelection()" class="text-xs text-slate-500 hover:text-white transition-colors">Cancel</button>
        </div>
      }
    </div>
  `
})
export class AdminLeadsComponent implements OnInit {
  Math = Math;

  leads = signal<LeadCompany[]>([]);
  stats = signal<LeadStats | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  crawling = signal(false);
  toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filters
  searchQuery = '';
  filterCountry = '';
  filterLicenseType = '';
  filterStatus = '';
  filterSector = '';

  // Sorting
  currentSort = 'companyName';
  currentSortDir = 'asc';

  // Pagination
  currentPage = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  pageSize = 25;

  // Bulk
  selectedIds = signal<string[]>([]);
  bulkStatus = '';

  private filterTimeout: any;

  constructor(private adminService: AdminService, private router: Router) {}

  hasActiveFilters = computed(() =>
    !!(this.searchQuery || this.filterCountry || this.filterLicenseType || this.filterStatus || this.filterSector)
  );

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(0, current - 2);
    const end = Math.min(total, current + 3);
    for (let i = start; i < end; i++) pages.push(i);
    return pages;
  });

  ngOnInit() {
    this.loadLeads();
    this.loadStats();
  }

  loadLeads() {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.getLeads({
      country: this.filterCountry || undefined,
      licenseType: this.filterLicenseType || undefined,
      leadStatus: this.filterStatus || undefined,
      sector: this.filterSector || undefined,
      search: this.searchQuery || undefined,
      page: this.currentPage(),
      size: this.pageSize,
      sortBy: this.currentSort,
      sortDir: this.currentSortDir
    }).subscribe({
      next: (page) => {
        this.leads.set(page.content);
        this.totalPages.set(page.totalPages);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.status === 403 ? 'Access denied — admin role required' : 'Failed to load leads');
        this.loading.set(false);
      }
    });
  }

  loadStats() {
    this.adminService.getLeadStats().subscribe({
      next: (s) => this.stats.set(s),
      error: (e: unknown) => console.error('Failed to load lead stats:', e)
    });
  }

  onFilterChange() {
    clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => {
      this.currentPage.set(0);
      this.loadLeads();
    }, 300);
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterCountry = '';
    this.filterLicenseType = '';
    this.filterStatus = '';
    this.filterSector = '';
    this.currentPage.set(0);
    this.loadLeads();
  }

  sortBy(field: string) {
    if (this.currentSort === field) {
      this.currentSortDir = this.currentSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSort = field;
      this.currentSortDir = 'asc';
    }
    this.loadLeads();
  }

  sortIcon(field: string): string {
    if (this.currentSort !== field) return '';
    return this.currentSortDir === 'asc' ? '\u25B2' : '\u25BC';
  }

  goToPage(page: number) {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
    this.loadLeads();
  }

  openLead(lead: LeadCompany) {
    this.router.navigate(['/admin/leads', lead.id]);
  }

  runCrawler() {
    this.crawling.set(true);
    this.adminService.runLeadCrawler().subscribe({
      next: (res) => {
        this.crawling.set(false);
        this.showToast(`Crawler finished — ${res.newLeads || 0} new, ${res.updatedLeads || 0} updated`, 'success');
        this.loadLeads();
        this.loadStats();
      },
      error: () => {
        this.crawling.set(false);
        this.showToast('Crawler failed', 'error');
      }
    });
  }

  exportCsv() {
    this.adminService.exportLeadsCsv({
      country: this.filterCountry || undefined,
      licenseType: this.filterLicenseType || undefined,
      leadStatus: this.filterStatus || undefined,
      sector: this.filterSector || undefined,
      search: this.searchQuery || undefined
    }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('CSV exported', 'success');
      },
      error: () => this.showToast('Export failed', 'error')
    });
  }

  applyBulkStatus() {
    if (!this.bulkStatus || this.selectedIds().length === 0) return;
    const ids = this.selectedIds();
    let completed = 0;
    ids.forEach(id => {
      this.adminService.updateLead(id, { leadStatus: this.bulkStatus } as any).subscribe({
        next: () => {
          completed++;
          if (completed === ids.length) {
            this.showToast(`Updated ${ids.length} leads to ${this.bulkStatus}`, 'success');
            this.clearSelection();
            this.loadLeads();
            this.loadStats();
          }
        }
      });
    });
  }

  clearSelection() {
    this.selectedIds.set([]);
    this.bulkStatus = '';
  }

  // Helpers
  countryName(code: string): string {
    const map: Record<string, string> = { EE: 'Estonia', LV: 'Latvia', LT: 'Lithuania' };
    return map[code] || code;
  }

  formatLicense(type: string): string {
    if (!type) return '—';
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      NEW: 'bg-emerald-500/20 text-emerald-400',
      CONTACTED: 'bg-blue-500/20 text-blue-400',
      QUALIFIED: 'bg-violet-500/20 text-violet-400',
      CONVERTED: 'bg-amber-500/20 text-amber-400'
    };
    return map[status] || 'bg-slate-600/50 text-slate-400';
  }

  shortenUrl(url: string): string {
    return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('et-EE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private showToast(message: string, type: 'success' | 'error') {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 4000);
  }
}
