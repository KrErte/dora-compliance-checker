import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-two-factor-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-2xl mx-auto">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-white flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          Two-Factor Authentication
        </h1>
        <p class="text-slate-400 text-sm mt-1">
          Secure your account with TOTP-based two-factor authentication.
        </p>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="text-center py-16">
          <div class="w-10 h-10 mx-auto mb-3 rounded-full border-4 border-slate-700 border-t-emerald-400 animate-spin"></div>
          <p class="text-slate-400 text-sm">Loading 2FA status...</p>
        </div>
      }

      <!-- 2FA Enabled Status -->
      @if (!loading() && is2faEnabled() && !showDisableSection()) {
        <div class="bg-slate-800/50 border border-emerald-500/30 rounded-2xl p-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-white">2FA is Enabled</h3>
              <p class="text-sm text-slate-400">Your account is protected with two-factor authentication.</p>
            </div>
            <button (click)="showDisableSection.set(true)"
                    class="px-4 py-2 text-sm font-medium rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all">
              Disable 2FA
            </button>
          </div>
        </div>
      }

      <!-- Disable 2FA Section -->
      @if (showDisableSection()) {
        <div class="bg-slate-800/50 border border-red-500/30 rounded-2xl p-6 space-y-4">
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <h3 class="text-lg font-semibold text-white">Disable Two-Factor Authentication</h3>
          </div>
          <p class="text-sm text-slate-400">
            Enter your current 2FA code to disable two-factor authentication. This will make your account less secure.
          </p>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Verification Code</label>
            <input [(ngModel)]="disableCode" type="text" maxlength="6" placeholder="000000"
                   class="w-48 px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-center text-lg tracking-[0.5em] font-mono
                          placeholder-slate-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all">
          </div>
          @if (disableError()) {
            <p class="text-red-400 text-sm">{{ disableError() }}</p>
          }
          <div class="flex gap-3">
            <button (click)="disable2fa()" [disabled]="disabling()"
                    class="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-50">
              @if (disabling()) {
                <span class="flex items-center gap-2">
                  <span class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                  Disabling...
                </span>
              } @else {
                Confirm Disable
              }
            </button>
            <button (click)="showDisableSection.set(false); disableCode = ''; disableError.set('')"
                    class="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        </div>
      }

      <!-- Setup 2FA (when not enabled) -->
      @if (!loading() && !is2faEnabled()) {
        <!-- Step 1: Generate secret -->
        @if (step() === 'init') {
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 text-center space-y-4">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-white">Enable Two-Factor Authentication</h3>
            <p class="text-sm text-slate-400 max-w-md mx-auto">
              Add an extra layer of security to your account. You will need an authenticator app like Google Authenticator, Authy, or 1Password.
            </p>
            <button (click)="startSetup()" [disabled]="settingUp()"
                    class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-sm
                           hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50">
              @if (settingUp()) {
                <span class="flex items-center gap-2">
                  <span class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                  Generating...
                </span>
              } @else {
                Set Up 2FA
              }
            </button>
          </div>
        }

        <!-- Step 2: Show QR / secret -->
        @if (step() === 'scan') {
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-5">
            <div>
              <h3 class="text-lg font-semibold text-white mb-1">Step 1: Scan or Enter Secret</h3>
              <p class="text-sm text-slate-400">
                Open your authenticator app and scan the QR code, or manually enter the secret key below.
              </p>
            </div>

            <!-- QR URL link -->
            <div class="bg-slate-900/50 border border-slate-700/30 rounded-xl p-5 text-center">
              <p class="text-xs text-slate-500 uppercase tracking-wider mb-3">Authenticator Link</p>
              <a [href]="qrCodeUrl()" target="_blank" rel="noopener"
                 class="text-sm text-emerald-400 hover:text-emerald-300 underline underline-offset-4 break-all transition-colors">
                {{ qrCodeUrl() }}
              </a>
              <p class="text-xs text-slate-500 mt-3">Click to open in your authenticator app, or copy the link.</p>
            </div>

            <!-- Manual secret -->
            <div class="bg-slate-900/50 border border-slate-700/30 rounded-xl p-5">
              <p class="text-xs text-slate-500 uppercase tracking-wider mb-2">Secret Key (Manual Entry)</p>
              <div class="flex items-center gap-3">
                <code class="flex-1 text-lg font-mono text-white tracking-widest select-all bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-600/30">
                  {{ secret() }}
                </code>
                <button (click)="copySecret()" class="px-3 py-2 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/30 hover:bg-slate-600/50 transition-all">
                  {{ copied() ? 'Copied!' : 'Copy' }}
                </button>
              </div>
            </div>

            <!-- Verify code -->
            <div class="border-t border-slate-700/50 pt-5">
              <h3 class="text-lg font-semibold text-white mb-1">Step 2: Enter Verification Code</h3>
              <p class="text-sm text-slate-400 mb-3">
                Enter the 6-digit code from your authenticator app to verify the setup.
              </p>
              <div class="flex items-end gap-3">
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1.5">Verification Code</label>
                  <input [(ngModel)]="verifyCode" type="text" maxlength="6" placeholder="000000"
                         class="w-48 px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-center text-lg tracking-[0.5em] font-mono
                                placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all">
                </div>
                <button (click)="verifySetup()" [disabled]="verifying() || verifyCode.length !== 6"
                        class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-sm
                               hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50">
                  @if (verifying()) {
                    Verifying...
                  } @else {
                    Verify & Enable
                  }
                </button>
              </div>
              @if (verifyError()) {
                <p class="text-red-400 text-sm mt-2">{{ verifyError() }}</p>
              }
            </div>
          </div>
        }

        <!-- Step 3: Backup codes -->
        @if (step() === 'done') {
          <div class="bg-slate-800/50 border border-emerald-500/30 rounded-2xl p-6 space-y-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-white">2FA Enabled Successfully!</h3>
                <p class="text-sm text-slate-400">Your account is now protected with two-factor authentication.</p>
              </div>
            </div>

            <!-- Backup codes -->
            <div class="bg-slate-900/50 border border-amber-500/20 rounded-xl p-5">
              <div class="flex items-center gap-2 mb-3">
                <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <p class="text-sm font-semibold text-amber-400">Save Your Backup Codes</p>
              </div>
              <p class="text-xs text-slate-400 mb-4">
                Store these codes in a safe place. Each code can only be used once. If you lose access to your authenticator app, you can use these codes to sign in.
              </p>
              <div class="grid grid-cols-2 gap-2">
                @for (code of backupCodes(); track code) {
                  <div class="bg-slate-800/50 px-3 py-2 rounded-lg text-center">
                    <code class="text-sm font-mono text-white select-all">{{ code }}</code>
                  </div>
                }
              </div>
              <button (click)="copyBackupCodes()"
                      class="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-slate-700/50 text-slate-300 border border-slate-600/30 hover:bg-slate-600/50 transition-all w-full">
                {{ backupCopied() ? 'Copied to Clipboard!' : 'Copy All Codes' }}
              </button>
            </div>

            <button (click)="finishSetup()"
                    class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-sm
                           hover:shadow-lg hover:shadow-emerald-500/25 transition-all">
              Done
            </button>
          </div>
        }
      }

      @if (setupError()) {
        <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p class="text-sm text-red-400">{{ setupError() }}</p>
        </div>
      }
    </div>
  `
})
export class TwoFactorSetupComponent implements OnInit {
  loading = signal(true);
  is2faEnabled = signal(false);
  step = signal<'init' | 'scan' | 'done'>('init');

  // Setup
  secret = signal('');
  qrCodeUrl = signal('');
  settingUp = signal(false);
  setupError = signal('');

  // Verify
  verifyCode = '';
  verifying = signal(false);
  verifyError = signal('');
  copied = signal(false);

  // Backup codes
  backupCodes = signal<string[]>([]);
  backupCopied = signal(false);

  // Disable
  showDisableSection = signal(false);
  disableCode = '';
  disabling = signal(false);
  disableError = signal('');

  constructor(private api: ApiService, public lang: LangService) {}

  ngOnInit() {
    this.api.get2faStatus().subscribe({
      next: (res) => {
        this.is2faEnabled.set(res.enabled);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  startSetup() {
    this.settingUp.set(true);
    this.setupError.set('');
    this.api.setup2fa().subscribe({
      next: (res) => {
        this.secret.set(res.secret);
        this.qrCodeUrl.set(res.qrCodeUrl);
        this.step.set('scan');
        this.settingUp.set(false);
      },
      error: (err) => {
        this.setupError.set(err.error?.error || 'Failed to set up 2FA. Please try again.');
        this.settingUp.set(false);
      }
    });
  }

  verifySetup() {
    this.verifying.set(true);
    this.verifyError.set('');
    this.api.verify2fa(this.verifyCode).subscribe({
      next: (res) => {
        this.backupCodes.set(res.backupCodes || []);
        this.is2faEnabled.set(true);
        this.step.set('done');
        this.verifying.set(false);
      },
      error: (err) => {
        this.verifyError.set(err.error?.error || 'Invalid verification code. Please try again.');
        this.verifying.set(false);
      }
    });
  }

  disable2fa() {
    this.disabling.set(true);
    this.disableError.set('');
    this.api.disable2fa(this.disableCode).subscribe({
      next: () => {
        this.is2faEnabled.set(false);
        this.showDisableSection.set(false);
        this.disableCode = '';
        this.step.set('init');
        this.disabling.set(false);
      },
      error: (err) => {
        this.disableError.set(err.error?.error || 'Invalid code. Please try again.');
        this.disabling.set(false);
      }
    });
  }

  copySecret() {
    navigator.clipboard.writeText(this.secret());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  copyBackupCodes() {
    navigator.clipboard.writeText(this.backupCodes().join('\n'));
    this.backupCopied.set(true);
    setTimeout(() => this.backupCopied.set(false), 2000);
  }

  finishSetup() {
    this.step.set('init');
  }
}
