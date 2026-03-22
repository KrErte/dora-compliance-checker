import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';

interface TenantBranding {
  id?: string;
  companyName: string;
  primaryColor: string;
  accentColor: string;
  logoUrl?: string;
  hasLogo: boolean;
}

@Component({
  selector: 'app-white-label-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-3xl mx-auto">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
            </svg>
          </div>
          White-Label Settings
        </h1>
        <p class="text-slate-500 text-sm mt-1">
          Customize the platform appearance for your organization. Changes apply across all exports and dashboards.
        </p>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="text-center py-16">
          <div class="w-10 h-10 mx-auto mb-3 rounded-full border-4 border-slate-200 border-t-violet-400 animate-spin"></div>
        </div>
      }

      @if (!loading()) {
        <!-- Company Name -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h2 class="text-lg font-semibold text-slate-900">Company Identity</h2>

          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1.5">Company Name</label>
            <input [(ngModel)]="companyName" type="text" placeholder="Your Company Name"
                   class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900
                          placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all">
          </div>

          <!-- Logo Upload -->
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1.5">Company Logo</label>

            @if (logoPreviewUrl()) {
              <div class="flex items-center gap-4 mb-3">
                <img [src]="logoPreviewUrl()" alt="Logo preview"
                     class="w-16 h-16 rounded-xl border border-slate-200 object-contain bg-white/5 p-2">
                <button (click)="removeLogo()"
                        class="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all">
                  Remove
                </button>
              </div>
            }

            <div (click)="fileInput.click()"
                 class="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-violet-500/30 hover:bg-slate-50/20 transition-all">
              <svg class="w-8 h-8 mx-auto mb-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <p class="text-sm text-slate-500">Click to upload logo</p>
              <p class="text-xs text-slate-500 mt-1">PNG, JPG, SVG &middot; max 2MB</p>
            </div>
            <input #fileInput type="file" accept="image/png,image/jpeg,image/svg+xml" class="hidden" (change)="onFileSelected($event)">
            @if (logoError()) {
              <p class="text-red-400 text-xs mt-2">{{ logoError() }}</p>
            }
          </div>
        </div>

        <!-- Colors -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h2 class="text-lg font-semibold text-slate-900">Brand Colors</h2>

          <!-- Primary Color -->
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1.5">Primary Color</label>
            <div class="flex items-center gap-3">
              <input type="color" [(ngModel)]="primaryColor"
                     class="w-10 h-10 rounded-lg border border-slate-200 bg-transparent cursor-pointer">
              <input type="text" [(ngModel)]="primaryColor" maxlength="7" placeholder="#10b981"
                     class="w-32 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono
                            placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all">
              <div class="w-8 h-8 rounded-lg border border-slate-200" [style.background-color]="primaryColor"></div>
              <span class="text-xs text-slate-500">Used for buttons, links, key UI elements</span>
            </div>
          </div>

          <!-- Accent Color -->
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1.5">Accent Color</label>
            <div class="flex items-center gap-3">
              <input type="color" [(ngModel)]="accentColor"
                     class="w-10 h-10 rounded-lg border border-slate-200 bg-transparent cursor-pointer">
              <input type="text" [(ngModel)]="accentColor" maxlength="7" placeholder="#06b6d4"
                     class="w-32 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono
                            placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all">
              <div class="w-8 h-8 rounded-lg border border-slate-200" [style.background-color]="accentColor"></div>
              <span class="text-xs text-slate-500">Used for gradients, highlights, badges</span>
            </div>
          </div>
        </div>

        <!-- Live Preview -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 class="text-lg font-semibold text-slate-900 mb-4">Live Preview</h2>

          <div class="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <!-- Preview navbar -->
            <div class="px-5 py-3 border-b border-slate-200 flex items-center justify-between"
                 [style.background]="'linear-gradient(135deg, ' + primaryColor + '10, ' + accentColor + '10)'">
              <div class="flex items-center gap-3">
                @if (logoPreviewUrl()) {
                  <img [src]="logoPreviewUrl()" alt="Logo" class="w-8 h-8 object-contain rounded">
                } @else {
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                       [style.background]="'linear-gradient(135deg, ' + primaryColor + ', ' + accentColor + ')'">
                    {{ (companyName || 'WL').substring(0, 2).toUpperCase() }}
                  </div>
                }
                <span class="text-sm font-semibold text-slate-900">{{ companyName || 'Your Company' }}</span>
              </div>
              <div class="flex gap-2">
                <span class="px-2 py-1 rounded text-[10px] font-medium text-white"
                      [style.background-color]="primaryColor">Dashboard</span>
                <span class="px-2 py-1 rounded text-[10px] text-slate-500">Reports</span>
              </div>
            </div>

            <!-- Preview body -->
            <div class="p-5 space-y-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                     [style.background]="'linear-gradient(135deg, ' + primaryColor + ', ' + accentColor + ')'">
                  85
                </div>
                <div>
                  <p class="text-sm font-semibold text-slate-900">Compliance Score</p>
                  <p class="text-xs text-slate-500">Last updated today</p>
                </div>
              </div>

              <div class="h-2 rounded-full bg-slate-50 overflow-hidden">
                <div class="h-full rounded-full transition-all" style="width: 85%"
                     [style.background]="'linear-gradient(90deg, ' + primaryColor + ', ' + accentColor + ')'"></div>
              </div>

              <div class="flex gap-2">
                <button class="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all"
                        [style.background]="'linear-gradient(135deg, ' + primaryColor + ', ' + accentColor + ')'">
                  Export Report
                </button>
                <button class="px-3 py-1.5 rounded-lg text-xs font-medium border text-slate-600"
                        [style.border-color]="primaryColor + '50'"
                        [style.color]="primaryColor">
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Save -->
        @if (saveError()) {
          <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <p class="text-sm text-red-400">{{ saveError() }}</p>
          </div>
        }

        <div class="flex justify-end">
          <button (click)="save()" [disabled]="saving()"
                  class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold text-sm
                         hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-50 flex items-center gap-2">
            @if (saving()) {
              <span class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
              Saving...
            } @else {
              Save Branding
            }
          </button>
        </div>
      }

      <!-- Toast -->
      @if (toast()) {
        <div class="fixed bottom-6 right-6 bg-blue-600/90 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium z-50 flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          {{ toast() }}
        </div>
      }
    </div>
  `
})
export class WhiteLabelSettingsComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  saveError = signal('');
  logoError = signal('');
  toast = signal('');

  companyName = '';
  primaryColor = '#10b981';
  accentColor = '#06b6d4';
  logoFile: File | null = null;
  logoPreviewUrl = signal('');

  constructor(private api: ApiService, public lang: LangService) {}

  ngOnInit() {
    this.api.getTenantBranding().subscribe({
      next: (branding) => {
        if (branding) {
          this.companyName = branding.companyName || '';
          this.primaryColor = branding.primaryColor || '#10b981';
          this.accentColor = branding.accentColor || '#06b6d4';
          if (branding.logoUrl) {
            this.logoPreviewUrl.set(branding.logoUrl);
          }
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (file.size > 2 * 1024 * 1024) {
        this.logoError.set('File is too large. Maximum size is 2MB.');
        return;
      }

      const allowed = ['image/png', 'image/jpeg', 'image/svg+xml'];
      if (!allowed.includes(file.type)) {
        this.logoError.set('Only PNG, JPG, and SVG files are allowed.');
        return;
      }

      this.logoFile = file;
      this.logoError.set('');

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoPreviewUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      input.value = '';
    }
  }

  removeLogo() {
    this.logoFile = null;
    this.logoPreviewUrl.set('');
  }

  save() {
    if (!this.companyName.trim()) {
      this.saveError.set('Company name is required.');
      return;
    }

    if (this.primaryColor && !this.primaryColor.match(/^#[0-9a-fA-F]{6}$/)) {
      this.saveError.set('Primary color must be a valid hex color (e.g., #10b981).');
      return;
    }

    if (this.accentColor && !this.accentColor.match(/^#[0-9a-fA-F]{6}$/)) {
      this.saveError.set('Accent color must be a valid hex color (e.g., #06b6d4).');
      return;
    }

    this.saving.set(true);
    this.saveError.set('');

    const formData = new FormData();
    formData.append('companyName', this.companyName.trim());
    formData.append('primaryColor', this.primaryColor);
    formData.append('accentColor', this.accentColor);
    if (this.logoFile) {
      formData.append('logo', this.logoFile);
    }

    this.api.updateTenantBranding(formData).subscribe({
      next: () => {
        this.saving.set(false);
        this.logoFile = null;
        this.showToast('Branding settings saved successfully.');
      },
      error: (err) => {
        this.saveError.set(err.error?.error || 'Failed to save branding settings.');
        this.saving.set(false);
      }
    });
  }

  private showToast(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3000);
  }
}
