import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LangService } from '../lang.service';

interface CompanyProfile {
  id: number;
  name: string;
  registryCode: string;
  legalAddress: string;
  emtakCode: string;
  emtakDescription: string;
  employeeCount: number;
  websiteDomain: string;
  fiLicenseType: string;
  fiLicenseDate: string;
  fiLicenseStatus: string;
  doraTier: number;
  sslValidDays: number;
  sslIssuer: string;
  tlsVersion: string;
  securityHeadersScore: number;
  securityHeadersDetails: string;
  spfRecordExists: boolean;
  dmarcRecordExists: boolean;
  dnssecEnabled: boolean;
  httpsRedirect: boolean;
  digitalRiskScore: number;
  boardMembers: string;
  lastCrawledAt: string;
}

interface SearchResult {
  id: number;
  name: string;
  registryCode: string;
  fiLicenseType: string;
  doraTier: number;
}

@Component({
  selector: 'app-company-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto animate-fade-in-up">

      <!-- Search Section (when no company selected) -->
      <div *ngIf="!selectedProfile()" class="text-center py-12">
        <div class="mb-8">
          <h1 class="text-3xl md:text-4xl font-extrabold mb-3">
            <span class="gradient-text">{{ lang.t('company.title') }}</span>
          </h1>
          <p class="text-slate-400 max-w-xl mx-auto">{{ lang.t('company.subtitle') }}</p>
        </div>

        <!-- Search Box -->
        <div class="max-w-lg mx-auto mb-8">
          <div class="relative">
            <input type="text"
                   [(ngModel)]="searchQuery"
                   (input)="onSearch()"
                   [placeholder]="lang.t('company.search_placeholder')"
                   class="w-full px-5 py-4 pl-12 bg-slate-800/50 border border-slate-700/50 rounded-xl
                          text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50
                          focus:ring-2 focus:ring-emerald-500/20 transition-all">
            <svg class="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <div *ngIf="isSearching()" class="absolute right-4 top-1/2 -translate-y-1/2">
              <div class="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
          </div>
        </div>

        <!-- Search Results -->
        <div *ngIf="searchResults().length > 0" class="max-w-lg mx-auto">
          <div class="glass-card divide-y divide-slate-700/50">
            <button *ngFor="let result of searchResults()"
                    (click)="selectCompany(result.registryCode)"
                    class="w-full px-4 py-3 text-left hover:bg-slate-700/30 transition-colors flex items-center justify-between group">
              <div>
                <p class="text-white font-medium group-hover:text-emerald-400 transition-colors">{{ result.name }}</p>
                <p class="text-xs text-slate-500">{{ result.registryCode }} · {{ result.fiLicenseType || 'N/A' }}</p>
              </div>
              <span *ngIf="result.doraTier" class="px-2 py-1 text-xs font-bold rounded"
                    [class]="getDoraTierClass(result.doraTier)">
                DORA T{{ result.doraTier }}
              </span>
            </button>
          </div>
        </div>

        <!-- FI Licensed Companies -->
        <div class="mt-12">
          <h2 class="text-lg font-semibold text-slate-300 mb-4">{{ lang.t('company.fi_licensed_title') }}</h2>
          <div *ngIf="fiLoadingState() === 'loading'" class="text-slate-500 flex items-center gap-2">
            <div class="w-4 h-4 border-2 border-slate-500/30 border-t-emerald-400 rounded-full animate-spin"></div>
            {{ lang.t('company.loading') }}
          </div>
          <div *ngIf="fiLoadingState() === 'error'" class="text-amber-400 text-sm p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            {{ lang.t('company.load_error') }}
            <button (click)="loadFiLicensedCompanies()" class="ml-2 text-emerald-400 hover:text-emerald-300 underline">
              {{ lang.t('company.retry') }}
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <button *ngFor="let company of fiLicensedCompanies().slice(0, 12)"
                    (click)="selectCompany(company.registryCode)"
                    class="glass-card p-4 text-left hover:border-emerald-500/30 transition-all group">
              <p class="text-white font-medium text-sm group-hover:text-emerald-400 transition-colors truncate">{{ company.name }}</p>
              <div class="flex items-center justify-between mt-2">
                <span class="text-xs text-slate-500">{{ company.fiLicenseType }}</span>
                <span class="px-1.5 py-0.5 text-[10px] font-bold rounded" [class]="getDoraTierClass(company.doraTier)">
                  T{{ company.doraTier }}
                </span>
              </div>
            </button>
          </div>
          <button *ngIf="fiLicensedCompanies().length > 12"
                  (click)="showAllFiLicensed = !showAllFiLicensed"
                  class="mt-4 text-emerald-400 text-sm hover:text-emerald-300 transition-colors">
            {{ showAllFiLicensed ? lang.t('company.show_less') : lang.t('company.show_all') }} ({{ fiLicensedCompanies().length }})
          </button>
        </div>
      </div>

      <!-- Company Profile Dashboard (when company selected) -->
      <div *ngIf="selectedProfile()" class="space-y-6">

        <!-- Back Button & Header -->
        <div class="flex items-start justify-between">
          <div>
            <button (click)="clearSelection()" class="text-slate-400 hover:text-emerald-400 transition-colors text-sm mb-2 flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              {{ lang.t('company.back_to_search') }}
            </button>
            <h1 class="text-2xl md:text-3xl font-extrabold text-white">{{ selectedProfile()!.name }}</h1>
            <p class="text-slate-400 mt-1">
              {{ selectedProfile()!.registryCode }}
              <span *ngIf="selectedProfile()!.legalAddress" class="text-slate-600 mx-2">·</span>
              <span *ngIf="selectedProfile()!.legalAddress" class="text-slate-500">{{ selectedProfile()!.legalAddress }}</span>
            </p>
          </div>
          <div class="flex items-center gap-3">
            <span class="px-3 py-1.5 text-sm font-bold rounded-lg" [class]="getDoraTierClass(selectedProfile()!.doraTier)">
              DORA Tier {{ selectedProfile()!.doraTier }}
            </span>
            <button (click)="refreshProfile()" [disabled]="isRefreshing()"
                    class="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 transition-all disabled:opacity-50">
              <svg class="w-5 h-5" [class.animate-spin]="isRefreshing()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- License & DORA Info -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="glass-card p-5">
            <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">{{ lang.t('company.license_type') }}</p>
            <p class="text-lg font-semibold text-white capitalize">{{ selectedProfile()!.fiLicenseType || 'N/A' }}</p>
            <p class="text-xs text-slate-500 mt-1">
              <span class="inline-block w-2 h-2 rounded-full mr-1"
                    [class.bg-emerald-500]="selectedProfile()!.fiLicenseStatus === 'active'"
                    [class.bg-amber-500]="selectedProfile()!.fiLicenseStatus === 'suspended'"
                    [class.bg-red-500]="selectedProfile()!.fiLicenseStatus === 'revoked'"></span>
              {{ selectedProfile()!.fiLicenseStatus || 'active' }}
            </p>
          </div>
          <div class="glass-card p-5">
            <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">{{ lang.t('company.dora_tier') }}</p>
            <p class="text-lg font-semibold" [class]="getDoraTierTextClass(selectedProfile()!.doraTier)">
              Tier {{ selectedProfile()!.doraTier }} — {{ getDoraTierLabel(selectedProfile()!.doraTier) }}
            </p>
            <p class="text-xs text-slate-500 mt-1">{{ lang.t('company.full_dora_applies') }}</p>
          </div>
          <div class="glass-card p-5">
            <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">{{ lang.t('company.last_updated') }}</p>
            <p class="text-lg font-semibold text-white">{{ formatDate(selectedProfile()!.lastCrawledAt) }}</p>
            <p class="text-xs text-slate-500 mt-1">{{ lang.t('company.auto_updated') }}</p>
          </div>
        </div>

        <!-- Digital Risk Score -->
        <div class="glass-card p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              {{ lang.t('company.digital_risk_title') }}
            </h2>
            <div class="text-right">
              <p class="text-3xl font-bold" [class]="getRiskScoreClass(selectedProfile()!.digitalRiskScore)">
                {{ selectedProfile()!.digitalRiskScore ?? 'N/A' }}
              </p>
              <p class="text-xs text-slate-500">/ 100 ({{ lang.t('company.lower_is_better') }})</p>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <!-- SSL Status -->
            <div class="bg-slate-800/50 rounded-lg p-4">
              <p class="text-xs text-slate-500 mb-2">SSL/TLS</p>
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full" [class]="getSslStatusClass(selectedProfile()!.sslValidDays)"></span>
                <span class="text-white font-medium">
                  {{ selectedProfile()!.sslValidDays !== null ? selectedProfile()!.sslValidDays + ' ' + lang.t('company.days') : 'N/A' }}
                </span>
              </div>
              <p class="text-[10px] text-slate-600 mt-1">{{ selectedProfile()!.tlsVersion || 'Unknown' }}</p>
            </div>

            <!-- Security Headers -->
            <div class="bg-slate-800/50 rounded-lg p-4">
              <p class="text-xs text-slate-500 mb-2">{{ lang.t('company.security_headers') }}</p>
              <div class="flex items-center gap-2">
                <span class="text-white font-medium">{{ selectedProfile()!.securityHeadersScore ?? 0 }}/7</span>
              </div>
              <div class="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                <div class="h-1.5 rounded-full transition-all"
                     [style.width.%]="(selectedProfile()!.securityHeadersScore ?? 0) / 7 * 100"
                     [class]="getHeadersBarClass(selectedProfile()!.securityHeadersScore)"></div>
              </div>
            </div>

            <!-- SPF/DMARC -->
            <div class="bg-slate-800/50 rounded-lg p-4">
              <p class="text-xs text-slate-500 mb-2">{{ lang.t('company.email_security') }}</p>
              <div class="flex gap-2">
                <span class="px-2 py-0.5 text-[10px] font-medium rounded"
                      [class]="selectedProfile()!.spfRecordExists ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'">
                  SPF {{ selectedProfile()!.spfRecordExists ? '✓' : '✗' }}
                </span>
                <span class="px-2 py-0.5 text-[10px] font-medium rounded"
                      [class]="selectedProfile()!.dmarcRecordExists ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'">
                  DMARC {{ selectedProfile()!.dmarcRecordExists ? '✓' : '✗' }}
                </span>
              </div>
            </div>

            <!-- HTTPS -->
            <div class="bg-slate-800/50 rounded-lg p-4">
              <p class="text-xs text-slate-500 mb-2">HTTPS</p>
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full" [class]="selectedProfile()!.httpsRedirect ? 'bg-emerald-500' : 'bg-red-500'"></span>
                <span class="text-white font-medium">{{ selectedProfile()!.httpsRedirect ? lang.t('company.enabled') : lang.t('company.disabled') }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Board Members -->
        <div *ngIf="parsedBoardMembers().length > 0" class="glass-card p-6">
          <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            {{ lang.t('company.board_members') }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div *ngFor="let member of parsedBoardMembers()" class="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {{ getInitials(member.name) }}
              </div>
              <div>
                <p class="text-white font-medium">{{ member.name }}</p>
                <p class="text-xs text-slate-500">{{ member.role || lang.t('company.board_member') }}</p>
              </div>
            </div>
          </div>
          <a routerLink="/board-risk" class="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm mt-4 transition-colors">
            {{ lang.t('company.calculate_board_risk') }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </a>
        </div>

        <!-- Next Steps CTAs -->
        <div class="glass-card p-6">
          <h2 class="text-lg font-semibold text-white mb-4">{{ lang.t('company.next_steps') }}</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a routerLink="/contract-analysis" class="flex items-center gap-4 p-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors group">
              <div class="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <div>
                <p class="text-white font-medium group-hover:text-emerald-400 transition-colors">{{ lang.t('company.cta_contracts') }}</p>
                <p class="text-xs text-slate-500">{{ lang.t('company.cta_contracts_desc') }}</p>
              </div>
            </a>
            <a routerLink="/assessment" class="flex items-center gap-4 p-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors group">
              <div class="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
              </div>
              <div>
                <p class="text-white font-medium group-hover:text-cyan-400 transition-colors">{{ lang.t('company.cta_assessment') }}</p>
                <p class="text-xs text-slate-500">{{ lang.t('company.cta_assessment_desc') }}</p>
              </div>
            </a>
            <a routerLink="/supply-chain" class="flex items-center gap-4 p-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors group">
              <div class="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <svg class="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <div>
                <p class="text-white font-medium group-hover:text-amber-400 transition-colors">{{ lang.t('company.cta_supply_chain') }}</p>
                <p class="text-xs text-slate-500">{{ lang.t('company.cta_supply_chain_desc') }}</p>
              </div>
            </a>
            <a routerLink="/board-risk" class="flex items-center gap-4 p-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors group">
              <div class="w-12 h-12 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div>
                <p class="text-white font-medium group-hover:text-violet-400 transition-colors">{{ lang.t('company.cta_board_risk') }}</p>
                <p class="text-xs text-slate-500">{{ lang.t('company.cta_board_risk_desc') }}</p>
              </div>
            </a>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .glass-card {
      @apply bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl;
    }
  `]
})
export class CompanyProfileComponent implements OnInit {
  searchQuery = '';
  showAllFiLicensed = false;

  searchResults = signal<SearchResult[]>([]);
  fiLicensedCompanies = signal<SearchResult[]>([]);
  selectedProfile = signal<CompanyProfile | null>(null);
  isSearching = signal(false);
  isRefreshing = signal(false);
  fiLoadingState = signal<'loading' | 'loaded' | 'error'>('loading');

  parsedBoardMembers = computed(() => {
    const profile = this.selectedProfile();
    if (!profile?.boardMembers) return [];
    try {
      return JSON.parse(profile.boardMembers);
    } catch {
      return [];
    }
  });

  constructor(
    private http: HttpClient,
    public lang: LangService
  ) {}

  ngOnInit() {
    this.loadFiLicensedCompanies();
  }

  loadFiLicensedCompanies() {
    this.fiLoadingState.set('loading');
    const timeout$ = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 5000)
    );
    const fetch$ = this.http.get<SearchResult[]>(`/api/companies/fi-licensed`).toPromise();
    Promise.race([fetch$, timeout$])
      .then((companies) => {
        this.fiLicensedCompanies.set(companies || []);
        this.fiLoadingState.set('loaded');
      })
      .catch((err) => {
        this.fiLoadingState.set('error');
      });
  }

  onSearch() {
    const query = this.searchQuery.trim();
    if (query.length < 2) {
      this.searchResults.set([]);
      return;
    }

    this.isSearching.set(true);
    this.http.get<SearchResult[]>(`/api/companies/search?q=${encodeURIComponent(query)}`)
      .subscribe({
        next: (results) => {
          this.searchResults.set(results);
          this.isSearching.set(false);
        },
        error: () => this.isSearching.set(false)
      });
  }

  selectCompany(registryCode: string) {
    this.http.get<CompanyProfile>(`/api/companies/${registryCode}`)
      .subscribe({
        next: (profile) => {
          this.selectedProfile.set(profile);
          this.searchResults.set([]);
          this.searchQuery = '';
        },
        error: () => {}
      });
  }

  clearSelection() {
    this.selectedProfile.set(null);
  }

  refreshProfile() {
    const profile = this.selectedProfile();
    if (!profile) return;

    this.isRefreshing.set(true);
    this.http.post<CompanyProfile>(`/api/companies/${profile.registryCode}/refresh`, {})
      .subscribe({
        next: (updated) => {
          this.selectedProfile.set(updated);
          this.isRefreshing.set(false);
        },
        error: () => this.isRefreshing.set(false)
      });
  }

  // Utility methods
  getDoraTierClass(tier: number): string {
    switch (tier) {
      case 1: return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 2: return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 3: return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  }

  getDoraTierTextClass(tier: number): string {
    switch (tier) {
      case 1: return 'text-red-400';
      case 2: return 'text-amber-400';
      case 3: return 'text-cyan-400';
      default: return 'text-slate-400';
    }
  }

  getDoraTierLabel(tier: number): string {
    switch (tier) {
      case 1: return this.lang.t('company.tier1_label');
      case 2: return this.lang.t('company.tier2_label');
      case 3: return this.lang.t('company.tier3_label');
      default: return this.lang.t('company.tier4_label');
    }
  }

  getRiskScoreClass(score: number | null): string {
    if (score === null) return 'text-slate-400';
    if (score <= 30) return 'text-emerald-400';
    if (score <= 60) return 'text-amber-400';
    return 'text-red-400';
  }

  getSslStatusClass(days: number | null): string {
    if (days === null || days < 0) return 'bg-red-500';
    if (days < 30) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  getHeadersBarClass(score: number | null): string {
    if (!score) return 'bg-red-500';
    if (score <= 2) return 'bg-red-500';
    if (score <= 4) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('et-EE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}
