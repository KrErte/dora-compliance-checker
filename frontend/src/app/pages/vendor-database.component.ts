import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LangService } from '../lang.service';

interface Vendor {
  id: string;
  vendorName: string;
  vendorCategory: string;
  assessmentCount: number;
  averageScore: number;
  auditClauseScore: number;
  exitStrategyScore: number;
  incidentScore: number;
  dataProtectionScore: number;
  subcontractingScore: number;
  commonGaps: string;
  riskLevel: string;
  lastUpdated: string;
}

interface VendorStats {
  totalVendors: number;
  totalAssessments: number;
  averageScore: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  topCategories: { name: string; count: number }[];
  isDemo?: boolean;
}

@Component({
  selector: 'app-vendor-database',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-6xl mx-auto space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-4">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          {{ lang.t('vendor.crowdsourced_data') }}
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">
          {{ lang.t('vendor.ict_vendor_risk_database') }}
        </h1>
        <p class="text-slate-400 max-w-2xl mx-auto">
          {{ lang.t('vendor.anonymized_dora_compliance_data_for_ict') }}
        </p>
      </div>

      <!-- Stats cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4 text-center">
          <p class="text-3xl font-bold text-white">{{ stats?.totalVendors || 0 }}</p>
          <p class="text-xs text-slate-500">{{ lang.t('vendor.vendors') }}</p>
        </div>
        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4 text-center">
          <p class="text-3xl font-bold text-cyan-400">{{ stats?.totalAssessments || 0 }}</p>
          <p class="text-xs text-slate-500">{{ lang.t('vendor.assessments') }}</p>
        </div>
        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4 text-center">
          <p class="text-3xl font-bold" [class]="(stats?.averageScore || 0) >= 70 ? 'text-emerald-400' : (stats?.averageScore || 0) >= 50 ? 'text-amber-400' : 'text-red-400'">
            {{ stats?.averageScore | number:'1.1-1' }}%
          </p>
          <p class="text-xs text-slate-500">{{ lang.t('vendor.avg_score') }}</p>
        </div>
        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4 text-center">
          <p class="text-3xl font-bold text-red-400">{{ stats?.highRiskCount || 0 }}</p>
          <p class="text-xs text-slate-500">{{ lang.t('vendor.high_risk') }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4">
        <div class="flex flex-wrap gap-4">
          <!-- Search -->
          <div class="flex-1 min-w-[200px]">
            <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="filterVendors()"
                   [placeholder]="lang.t('vendor.search_vendor')"
                   class="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500
                          focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 transition-all">
          </div>
          <!-- Category filter -->
          <select [(ngModel)]="selectedCategory" (ngModelChange)="filterVendors()"
                  class="px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white
                         focus:outline-none focus:border-violet-500/50 transition-all">
            <option value="ALL">{{ lang.t('vendor.all_categories') }}</option>
            <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
          </select>
          <!-- Risk level filter -->
          <select [(ngModel)]="selectedRisk" (ngModelChange)="filterVendors()"
                  class="px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white
                         focus:outline-none focus:border-violet-500/50 transition-all">
            <option value="ALL">{{ lang.t('vendor.all_risk_levels') }}</option>
            <option value="LOW">{{ lang.t('vendor.low_risk') }}</option>
            <option value="MEDIUM">{{ lang.t('vendor.medium_risk') }}</option>
            <option value="HIGH">{{ lang.t('vendor.high_risk_12') }}</option>
          </select>
          <!-- Sort -->
          <select [(ngModel)]="sortBy" (ngModelChange)="filterVendors()"
                  class="px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white
                         focus:outline-none focus:border-violet-500/50 transition-all">
            <option value="score">{{ lang.t('vendor.by_score') }}</option>
            <option value="assessments">{{ lang.t('vendor.by_assessments') }}</option>
            <option value="name">{{ lang.t('vendor.by_name') }}</option>
          </select>
        </div>
      </div>

      <!-- Vendor list -->
      <div class="space-y-3">
        <div *ngIf="loading" class="text-center py-12">
          <div class="w-10 h-10 mx-auto mb-3 rounded-full border-4 border-slate-700 border-t-violet-400 animate-spin"></div>
          <p class="text-slate-400">{{ lang.t('vendor.loading') }}</p>
        </div>

        <div *ngIf="!loading && filteredVendors.length === 0" class="text-center py-12 text-slate-400">
          {{ lang.t('vendor.no_vendors_found') }}
        </div>

        <div *ngFor="let vendor of filteredVendors; let i = index"
             class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-all cursor-pointer"
             [class.animate-fade-in-up]="true"
             [style.animation-delay]="(i * 50) + 'ms'"
             (click)="toggleVendorDetail(vendor)">
          <div class="flex items-start justify-between gap-4">
            <!-- Vendor info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-semibold text-white">{{ vendor.vendorName }}</h3>
                <span [class]="getRiskBadgeClass(vendor.riskLevel)">
                  {{ vendor.riskLevel === 'HIGH' ? lang.t('vendor.high')
                   : vendor.riskLevel === 'MEDIUM' ? lang.t('vendor.medium')
                   : lang.t('vendor.low') }}
                </span>
                <span class="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400">
                  {{ vendor.vendorCategory }}
                </span>
              </div>
              <div class="flex items-center gap-4 text-sm text-slate-400">
                <span>{{ vendor.assessmentCount }} {{ lang.t('vendor.assessments_18') }}</span>
                <span class="text-slate-600">|</span>
                <span>{{ lang.t('vendor.last_updated') }}: {{ vendor.lastUpdated | date:'dd.MM.yyyy' }}</span>
              </div>
            </div>

            <!-- Score circle -->
            <div class="relative w-16 h-16 shrink-0">
              <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" stroke-width="8"/>
                <circle cx="50" cy="50" r="40" fill="none"
                        [attr.stroke]="getScoreColor(vendor.averageScore)"
                        stroke-width="8"
                        stroke-linecap="round"
                        [attr.stroke-dasharray]="251.33"
                        [attr.stroke-dashoffset]="251.33 - (251.33 * vendor.averageScore / 100)"/>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-sm font-bold" [style.color]="getScoreColor(vendor.averageScore)">
                  {{ vendor.averageScore | number:'1.0-0' }}%
                </span>
              </div>
            </div>
          </div>

          <!-- Expanded detail -->
          <div *ngIf="expandedVendor === vendor.id" class="mt-4 pt-4 border-t border-slate-700/50 animate-fade-in">
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div class="text-center p-3 bg-slate-900/30 rounded-lg">
                <p class="text-xs text-slate-500 mb-1">{{ lang.t('vendor.audit') }}</p>
                <p class="text-lg font-semibold" [style.color]="getScoreColor(vendor.auditClauseScore)">
                  {{ vendor.auditClauseScore | number:'1.0-0' }}%
                </p>
              </div>
              <div class="text-center p-3 bg-slate-900/30 rounded-lg">
                <p class="text-xs text-slate-500 mb-1">{{ lang.t('vendor.exit') }}</p>
                <p class="text-lg font-semibold" [style.color]="getScoreColor(vendor.exitStrategyScore)">
                  {{ vendor.exitStrategyScore | number:'1.0-0' }}%
                </p>
              </div>
              <div class="text-center p-3 bg-slate-900/30 rounded-lg">
                <p class="text-xs text-slate-500 mb-1">{{ lang.t('vendor.incidents') }}</p>
                <p class="text-lg font-semibold" [style.color]="getScoreColor(vendor.incidentScore)">
                  {{ vendor.incidentScore | number:'1.0-0' }}%
                </p>
              </div>
              <div class="text-center p-3 bg-slate-900/30 rounded-lg">
                <p class="text-xs text-slate-500 mb-1">{{ lang.t('vendor.data') }}</p>
                <p class="text-lg font-semibold" [style.color]="getScoreColor(vendor.dataProtectionScore)">
                  {{ vendor.dataProtectionScore | number:'1.0-0' }}%
                </p>
              </div>
              <div class="text-center p-3 bg-slate-900/30 rounded-lg">
                <p class="text-xs text-slate-500 mb-1">{{ lang.t('vendor.subcontr') }}</p>
                <p class="text-lg font-semibold" [style.color]="getScoreColor(vendor.subcontractingScore)">
                  {{ vendor.subcontractingScore | number:'1.0-0' }}%
                </p>
              </div>
            </div>

            <div class="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <p class="text-xs text-amber-400 font-semibold mb-1">
                {{ lang.t('vendor.common_gaps') }}
              </p>
              <p class="text-sm text-slate-300">{{ vendor.commonGaps }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Contribute CTA -->
      <div class="bg-gradient-to-r from-violet-900/30 to-purple-900/30 border border-violet-500/20 rounded-2xl p-8 text-center">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/20 flex items-center justify-center">
          <svg class="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-2">
          {{ lang.t('vendor.contribute_to_the_database') }}
        </h3>
        <p class="text-slate-400 mb-6 max-w-lg mx-auto">
          {{ lang.t('vendor.your_contract_analyses_help_other_organi') }}
        </p>
        <a routerLink="/contract-analysis"
           class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500
                  text-white font-semibold hover:from-violet-400 hover:to-purple-400 hover:shadow-lg hover:shadow-violet-500/25 transition-all">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          {{ lang.t('vendor.analyze_contract') }}
        </a>
      </div>
    </div>
  `
})
export class VendorDatabaseComponent implements OnInit {
  vendors: Vendor[] = [];
  filteredVendors: Vendor[] = [];
  stats: VendorStats | null = null;
  categories: string[] = [];
  loading = true;

  searchQuery = '';
  selectedCategory = 'ALL';
  selectedRisk = 'ALL';
  sortBy = 'score';
  expandedVendor: string | null = null;

  constructor(public lang: LangService, private http: HttpClient) {}

  ngOnInit() {
    this.loadVendors();
    this.loadStats();
  }

  loadVendors() {
    this.loading = true;
    this.http.get<{ vendors: Vendor[]; categories: string[]; isDemo: boolean }>('/api/vendors').subscribe({
      next: (data) => {
        this.vendors = data.vendors;
        this.filteredVendors = data.vendors;
        this.categories = data.categories;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadStats() {
    this.http.get<VendorStats>('/api/vendors/stats').subscribe({
      next: (data) => {
        this.stats = data;
      }
    });
  }

  filterVendors() {
    let result = [...this.vendors];

    // Filter by search
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(v => v.vendorName.toLowerCase().includes(query));
    }

    // Filter by category
    if (this.selectedCategory !== 'ALL') {
      result = result.filter(v => v.vendorCategory === this.selectedCategory);
    }

    // Filter by risk
    if (this.selectedRisk !== 'ALL') {
      result = result.filter(v => v.riskLevel === this.selectedRisk);
    }

    // Sort
    switch (this.sortBy) {
      case 'name':
        result.sort((a, b) => a.vendorName.localeCompare(b.vendorName));
        break;
      case 'assessments':
        result.sort((a, b) => b.assessmentCount - a.assessmentCount);
        break;
      default:
        result.sort((a, b) => b.averageScore - a.averageScore);
    }

    this.filteredVendors = result;
  }

  toggleVendorDetail(vendor: Vendor) {
    this.expandedVendor = this.expandedVendor === vendor.id ? null : vendor.id;
  }

  getScoreColor(score: number): string {
    if (score >= 70) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  }

  getRiskBadgeClass(risk: string): string {
    const base = 'text-xs font-bold px-2 py-0.5 rounded-full';
    switch (risk) {
      case 'HIGH': return base + ' bg-red-500/20 text-red-400 border border-red-500/30';
      case 'MEDIUM': return base + ' bg-amber-500/20 text-amber-400 border border-amber-500/30';
      default: return base + ' bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    }
  }
}
