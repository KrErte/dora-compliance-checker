import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';
import { BrandingService, BrandingSettings } from '../services/branding.service';
import { SubscriptionService } from '../services/subscription.service';

@Component({
  selector: 'app-branding-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-8 max-w-3xl mx-auto">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-white flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
            </svg>
          </div>
          {{ lang.t('branding.branding_settings') }}
        </h1>
        <p class="text-slate-400 text-sm mt-1">
          {{ lang.t('branding.customize_your_company_logo_name_and_col') }}
        </p>
      </div>

      <!-- Upgrade prompt for free users -->
      <div *ngIf="!subscriptionService.isPremium()" class="bg-slate-800/50 border border-amber-500/30 rounded-2xl p-8 text-center">
        <svg class="w-16 h-16 mx-auto mb-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        <h2 class="text-lg font-bold text-white mb-2">
          {{ lang.t('branding.premium_feature') }}
        </h2>
        <p class="text-slate-400 text-sm mb-4">
          {{ lang.t('branding.branding_customization_is_available_with') }}
        </p>
        <a routerLink="/pricing"
           class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm hover:shadow-lg transition-all">
          {{ lang.t('branding.upgrade_plan') }}
        </a>
      </div>

      <!-- Branding form (premium users only) -->
      <div *ngIf="subscriptionService.isPremium()" class="space-y-6">
        <!-- Logo Section -->
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 class="text-lg font-semibold text-white mb-4">
            {{ lang.t('branding.company_logo') }}
          </h2>

          <!-- Current logo -->
          <div *ngIf="settings.hasLogo" class="flex items-center gap-4 mb-4">
            <img [src]="logoUrl" alt="Company logo"
                 class="w-20 h-20 rounded-xl border border-slate-600/50 object-contain bg-white/5 p-2">
            <button type="button" (click)="deleteLogo()"
                    class="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all">
              {{ lang.t('branding.delete_logo') }}
            </button>
          </div>

          <!-- Upload dropzone -->
          <div (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)" (drop)="onDrop($event)"
               (click)="fileInput.click()"
               [class]="'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ' +
                         (dragOver ? 'border-violet-400 bg-violet-500/5' : 'border-slate-600/50 hover:border-slate-500/50 hover:bg-slate-700/20')">
            <svg class="w-10 h-10 mx-auto mb-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <p class="text-sm text-slate-400 mb-1">
              {{ lang.t('branding.drag_logo_here_or_click_to_upload') }}
            </p>
            <p class="text-xs text-slate-500">PNG, JPG, SVG &middot; max 2MB</p>
          </div>
          <input #fileInput type="file" accept="image/png,image/jpeg,image/svg+xml" class="hidden" (change)="onFileSelected($event)">
          <p *ngIf="logoError" class="text-red-400 text-xs mt-2">{{ logoError }}</p>
          <p *ngIf="logoSuccess" class="text-emerald-400 text-xs mt-2">{{ logoSuccess }}</p>
        </div>

        <!-- Company Name & Color -->
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 class="text-lg font-semibold text-white mb-4">
            {{ lang.t('branding.company_details') }}
          </h2>

          <div class="space-y-4">
            <!-- Company name -->
            <div>
              <label class="block text-sm text-slate-400 mb-1.5">
                {{ lang.t('branding.company_name') }} *
              </label>
              <input type="text" [(ngModel)]="companyName"
                     [placeholder]="lang.t('branding.your_company_name')"
                     class="w-full px-4 py-2.5 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white text-sm
                            placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all">
              <p *ngIf="nameError" class="text-red-400 text-xs mt-1">{{ nameError }}</p>
            </div>

            <!-- Primary color -->
            <div>
              <label class="block text-sm text-slate-400 mb-1.5">
                {{ lang.t('branding.primary_brand_color') }}
              </label>
              <div class="flex items-center gap-3">
                <input type="color" [(ngModel)]="primaryColor"
                       class="w-10 h-10 rounded-lg border border-slate-600/50 bg-transparent cursor-pointer">
                <input type="text" [(ngModel)]="primaryColor"
                       placeholder="#22c55e" maxlength="7"
                       class="w-32 px-4 py-2.5 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white text-sm font-mono
                              placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all">
                <div class="w-8 h-8 rounded-lg border border-slate-600/50" [style.background-color]="primaryColor"></div>
              </div>
              <p *ngIf="colorError" class="text-red-400 text-xs mt-1">{{ colorError }}</p>
            </div>
          </div>
        </div>

        <!-- Preview -->
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 class="text-lg font-semibold text-white mb-4">
            {{ lang.t('branding.pdf_preview') }}
          </h2>
          <div class="bg-white rounded-xl p-6 shadow-lg">
            <div class="flex items-center gap-4 mb-4 pb-4 border-b-2" [style.border-color]="primaryColor">
              <img *ngIf="settings.hasLogo" [src]="logoUrl" alt="Logo" class="w-12 h-12 object-contain">
              <div *ngIf="!settings.hasLogo" class="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                   [style.background-color]="primaryColor">
                {{ (companyName || 'DA').substring(0, 2).toUpperCase() }}
              </div>
              <div>
                <p class="text-gray-900 font-bold text-lg">{{ companyName || 'DoraAudit.eu' }}</p>
                <p class="text-gray-500 text-xs">Register of Information &middot; ICT Third-Party Summary</p>
              </div>
            </div>
            <div class="h-2 rounded-full mb-2" [style.background-color]="primaryColor" style="opacity: 0.2"></div>
            <div class="h-2 rounded-full w-3/4 mb-2" [style.background-color]="primaryColor" style="opacity: 0.15"></div>
            <div class="h-2 rounded-full w-1/2" [style.background-color]="primaryColor" style="opacity: 0.1"></div>
            <p class="text-gray-400 text-[10px] mt-4 text-right">
              {{ lang.t('branding.generated_by') }} {{ companyName || 'DoraAudit.eu' }} | {{ today }}
            </p>
          </div>
        </div>

        <!-- Save button -->
        <div class="flex justify-end">
          <button type="button" (click)="save()" [disabled]="saving"
                  class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold text-sm
                         hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-50 flex items-center gap-2">
            <span *ngIf="saving" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
            {{ saving
                 ? (lang.t('branding.saving'))
                 : (lang.t('branding.save_changes')) }}
          </button>
        </div>

        <!-- Toast notifications -->
        <div *ngIf="saveSuccess" class="fixed bottom-6 right-6 bg-emerald-500/90 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 z-50 animate-fade-in">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          {{ lang.t('branding.branding_settings_saved') }}
        </div>
        <div *ngIf="saveError" class="fixed bottom-6 right-6 bg-red-500/90 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 z-50 animate-fade-in">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
          {{ saveError }}
        </div>
      </div>
    </div>
  `
})
export class BrandingSettingsComponent implements OnInit, OnDestroy {
  settings: BrandingSettings = { companyName: '', primaryColorHex: '#22c55e', hasLogo: false };
  companyName = '';
  primaryColor = '#22c55e';
  today = new Date().toISOString().split('T')[0];

  loading = true;
  saving = false;
  dragOver = false;

  logoError = '';
  logoSuccess = '';
  nameError = '';
  colorError = '';
  saveSuccess = false;
  saveError = '';

  logoUrl = '';
  private logoBlobUrl = '';

  constructor(
    public lang: LangService,
    public subscriptionService: SubscriptionService,
    private brandingService: BrandingService
  ) {}

  ngOnInit() {
    if (!this.subscriptionService.isPremium()) {
      this.loading = false;
      return;
    }
    this.brandingService.loadBranding().subscribe({
      next: (settings) => {
        this.settings = settings;
        this.companyName = settings.companyName || '';
        this.primaryColor = settings.primaryColorHex || '#22c55e';
        if (settings.hasLogo) {
          this.loadLogoBlob();
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.logoBlobUrl) {
      URL.revokeObjectURL(this.logoBlobUrl);
    }
  }

  private loadLogoBlob() {
    this.brandingService.getLogoBlob().subscribe({
      next: (blob) => {
        if (this.logoBlobUrl) {
          URL.revokeObjectURL(this.logoBlobUrl);
        }
        this.logoBlobUrl = URL.createObjectURL(blob);
        this.logoUrl = this.logoBlobUrl;
      },
      error: () => {}
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFile(input.files[0]);
      input.value = '';
    }
  }

  uploadFile(file: File) {
    this.logoError = '';
    this.logoSuccess = '';

    if (file.size > 2 * 1024 * 1024) {
      this.logoError = this.lang.t('branding.file_is_too_large_max_2mb');
      return;
    }

    const allowed = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      this.logoError = this.lang.t('branding.only_png_jpg_and_svg_files_are_allowed');
      return;
    }

    this.brandingService.uploadLogo(file).subscribe({
      next: () => {
        this.logoSuccess = this.lang.t('branding.logo_uploaded_successfully');
        this.settings.hasLogo = true;
        this.loadLogoBlob();
      },
      error: (err) => {
        this.logoError = err.error?.error || (this.lang.t('branding.failed_to_upload_logo'));
      }
    });
  }

  deleteLogo() {
    this.brandingService.deleteLogo().subscribe({
      next: () => {
        this.settings.hasLogo = false;
        this.logoSuccess = this.lang.t('branding.logo_deleted');
      },
      error: () => {
        this.logoError = this.lang.t('branding.failed_to_delete_logo');
      }
    });
  }

  save() {
    this.nameError = '';
    this.colorError = '';
    this.saveSuccess = false;
    this.saveError = '';

    if (!this.companyName.trim()) {
      this.nameError = this.lang.t('branding.company_name_is_required');
      return;
    }

    if (this.primaryColor && !this.primaryColor.match(/^#[0-9a-fA-F]{6}$/)) {
      this.colorError = this.lang.t('branding.invalid_color_hex_eg_22c55e');
      return;
    }

    this.saving = true;
    this.brandingService.updateBranding(this.companyName.trim(), this.primaryColor).subscribe({
      next: (settings) => {
        this.settings = settings;
        this.saving = false;
        this.saveSuccess = true;
        setTimeout(() => this.saveSuccess = false, 3000);
      },
      error: (err) => {
        this.saving = false;
        this.saveError = err.error?.error || (this.lang.t('branding.failed_to_save'));
        setTimeout(() => this.saveError = '', 4000);
      }
    });
  }
}
