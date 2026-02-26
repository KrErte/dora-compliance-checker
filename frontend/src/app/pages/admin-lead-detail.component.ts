import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService, LeadCompany } from '../services/admin.service';

@Component({
  selector: 'app-admin-lead-detail',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto">
      <!-- Back + Header -->
      <div class="flex items-center gap-4 mb-6">
        <button (click)="goBack()" class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div class="flex-1">
          <h1 class="text-2xl font-bold text-white">{{ lead()?.companyName || 'Loading...' }}</h1>
          @if (lead()?.registryCode) {
            <p class="text-sm text-slate-400 mt-0.5 font-mono">{{ lead()?.registryCode }} &middot; {{ countryName(lead()?.country || '') }}</p>
          }
        </div>
        @if (lead()) {
          <span class="px-3 py-1 text-xs font-bold rounded-full" [class]="statusClass(lead()!.leadStatus)">
            {{ lead()!.leadStatus }}
          </span>
        }
      </div>

      <!-- Toast -->
      @if (toast()) {
        <div class="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-fade-in"
             [class]="toast()!.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'">
          {{ toast()!.message }}
        </div>
      }

      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <div class="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (error()) {
        <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <p class="text-red-400">{{ error() }}</p>
        </div>
      } @else if (lead()) {
        <div class="space-y-6">

          <!-- Company Info -->
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Company Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-slate-500 mb-1">Company Name</label>
                <input type="text" [(ngModel)]="edit.companyName" class="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">Registry Code</label>
                <input type="text" [(ngModel)]="edit.registryCode" class="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">Country</label>
                <select [(ngModel)]="edit.country" class="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none cursor-pointer">
                  <option value="EE">Estonia</option>
                  <option value="LV">Latvia</option>
                  <option value="LT">Lithuania</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">License Type</label>
                <select [(ngModel)]="edit.licenseType" class="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none cursor-pointer">
                  <option value="">—</option>
                  <option value="BANK">Bank</option>
                  <option value="INSURANCE">Insurance</option>
                  <option value="PAYMENT_INSTITUTION">Payment Institution</option>
                  <option value="EMONEY">E-Money</option>
                  <option value="INVESTMENT_FIRM">Investment Firm</option>
                  <option value="FUND_MANAGER">Fund Manager</option>
                  <option value="FINTECH">Fintech</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">Sector</label>
                <select [(ngModel)]="edit.sector" class="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none cursor-pointer">
                  <option value="">—</option>
                  <option value="Banking">Banking</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Payment">Payment</option>
                  <option value="Investment">Investment</option>
                  <option value="Fintech">Fintech</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">Company Size</label>
                <select [(ngModel)]="edit.companySize" class="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none cursor-pointer">
                  <option value="">Unknown</option>
                  <option value="MICRO">Micro</option>
                  <option value="SMALL">Small</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LARGE">Large</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">Website</label>
                <input type="url" [(ngModel)]="edit.website" class="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">Email</label>
                <input type="email" [(ngModel)]="edit.email" class="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">Phone</label>
                <input type="text" [(ngModel)]="edit.phone" class="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">City</label>
                <input type="text" [(ngModel)]="edit.city" class="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-xs text-slate-500 mb-1">Address</label>
                <input type="text" [(ngModel)]="edit.address" class="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-xs text-slate-500 mb-1">LinkedIn Company URL</label>
                <input type="url" [(ngModel)]="edit.linkedinUrl" class="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>

            <!-- DORA/NIS2 flags -->
            <div class="flex items-center gap-6 mt-4 pt-4 border-t border-slate-700/50">
              <label class="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" [(ngModel)]="edit.doraApplicable" class="rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500" />
                DORA Applicable
              </label>
              <label class="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" [(ngModel)]="edit.nis2Applicable" class="rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500" />
                NIS2 Applicable
              </label>
            </div>
          </div>

          <!-- Contact Persons -->
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Contact Persons</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-slate-500 mb-1">CTO / Tech Lead Name</label>
                <input type="text" [(ngModel)]="edit.ctoName" class="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">CTO LinkedIn</label>
                <input type="url" [(ngModel)]="edit.ctoLinkedin" class="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">Compliance Officer Name</label>
                <input type="text" [(ngModel)]="edit.complianceOfficerName" class="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">Compliance Officer LinkedIn</label>
                <input type="url" [(ngModel)]="edit.complianceOfficerLinkedin" class="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>
          </div>

          <!-- Lead Status & Notes -->
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Lead Management</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-slate-500 mb-1">Lead Status</label>
                <select [(ngModel)]="edit.leadStatus" class="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none cursor-pointer">
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="CONVERTED">Converted</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">Last Contacted</label>
                <input type="date" [(ngModel)]="editLastContactedDate" class="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-xs text-slate-500 mb-1">Notes</label>
                <textarea [(ngModel)]="edit.notes" rows="4"
                          class="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none resize-none"></textarea>
              </div>
            </div>
          </div>

          <!-- Save Button -->
          <div class="flex items-center justify-between">
            <div class="text-xs text-slate-600">
              Source: {{ lead()?.sourceUrl || 'Manual entry' }}
              @if (lead()?.scrapedAt) {
                &middot; Scraped {{ formatDate(lead()!.scrapedAt) }}
              }
            </div>
            <button (click)="save()" [disabled]="saving()"
                    class="px-6 py-2.5 text-sm bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
              @if (saving()) {
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              }
              Save Changes
            </button>
          </div>

          <!-- LinkedIn Outreach Generator -->
          <div class="bg-slate-800/50 border border-emerald-500/20 rounded-xl p-6">
            <h2 class="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4">LinkedIn Outreach Generator</h2>

            <div class="flex items-center gap-4 mb-4">
              <label class="text-xs text-slate-400">Language:</label>
              <button (click)="outreachLang = 'ET'" class="px-3 py-1 text-xs rounded-lg transition-colors"
                      [class]="outreachLang === 'ET' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'">
                Estonian
              </button>
              <button (click)="outreachLang = 'EN'" class="px-3 py-1 text-xs rounded-lg transition-colors"
                      [class]="outreachLang === 'EN' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'">
                English
              </button>
              <div class="flex-1"></div>
              <label class="text-xs text-slate-400">Contact name:</label>
              <input type="text" [(ngModel)]="outreachName" placeholder="Name"
                     class="w-40 bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:border-emerald-500 focus:outline-none" />
            </div>

            <div class="bg-slate-900/50 rounded-lg p-4 font-mono text-sm text-slate-300 relative">
              {{ generatedMessage() }}
              <div class="absolute top-2 right-2 flex items-center gap-2">
                <span class="text-[10px] font-mono" [class]="messageLength() > 300 ? 'text-red-400' : 'text-slate-500'">
                  {{ messageLength() }}/300
                </span>
                <button (click)="copyMessage()" class="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors">
                  {{ copied() ? 'Copied!' : 'Copy' }}
                </button>
              </div>
            </div>
          </div>

        </div>
      }
    </div>
  `
})
export class AdminLeadDetailComponent implements OnInit {
  lead = signal<LeadCompany | null>(null);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);
  copied = signal(false);

  edit: any = {};
  editLastContactedDate = '';
  outreachLang: 'ET' | 'EN' = 'EN';
  outreachName = '';

  private id = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService
  ) {}

  generatedMessage = computed(() => {
    const l = this.lead();
    if (!l) return '';
    const name = this.outreachName || '[NAME]';
    const company = l.companyName || '[COMPANY]';
    const license = this.formatLicense(l.licenseType) || 'financial entity';

    if (this.outreachLang === 'ET') {
      return `Tere ${name}! ${company} kui ${license} peab vastama DORA n\u00F5uetele. L\u00F5ime platvormi mis aitab vastavust hinnata 5 min \u2014 https://doraaudit.eu/ Kristo, DoraAudit`;
    }
    return `Hi ${name}! As a ${license}, ${company} needs DORA compliance. We built a tool that assesses your readiness in 5 min \u2014 https://doraaudit.eu/ Kristo, DoraAudit`;
  });

  messageLength = computed(() => this.generatedMessage().length);

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    this.loadLead();
  }

  loadLead() {
    this.loading.set(true);
    this.adminService.getLead(this.id).subscribe({
      next: (lead) => {
        this.lead.set(lead);
        this.edit = { ...lead };
        this.editLastContactedDate = lead.lastContactedAt ? lead.lastContactedAt.slice(0, 10) : '';
        this.outreachName = lead.ctoName || lead.complianceOfficerName || '';
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.status === 404 ? 'Lead not found' : 'Failed to load lead');
        this.loading.set(false);
      }
    });
  }

  save() {
    this.saving.set(true);
    const updates: any = { ...this.edit };
    delete updates.id;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.scrapedAt;
    delete updates.lastVerifiedAt;
    if (this.editLastContactedDate) {
      updates.lastContactedAt = this.editLastContactedDate + 'T00:00:00';
    }

    this.adminService.updateLead(this.id, updates).subscribe({
      next: (updated) => {
        this.lead.set(updated);
        this.edit = { ...updated };
        this.saving.set(false);
        this.showToast('Lead saved successfully', 'success');
      },
      error: () => {
        this.saving.set(false);
        this.showToast('Failed to save lead', 'error');
      }
    });
  }

  copyMessage() {
    navigator.clipboard.writeText(this.generatedMessage()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  goBack() {
    this.router.navigate(['/admin/leads']);
  }

  // Helpers
  countryName(code: string): string {
    const map: Record<string, string> = { EE: 'Estonia', LV: 'Latvia', LT: 'Lithuania' };
    return map[code] || code;
  }

  formatLicense(type: string): string {
    if (!type) return '';
    return type.replace(/_/g, ' ').toLowerCase();
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
