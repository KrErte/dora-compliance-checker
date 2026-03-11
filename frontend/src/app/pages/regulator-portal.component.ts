import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LangService } from '../lang.service';
import { SubscriptionService } from '../services/subscription.service';

interface RegulatorToken {
  id: string;
  label: string;
  token: string;
  permissions: string[];
  expiresAt: string;
  createdAt: string;
  accessCount: number;
  lastAccessedAt: string | null;
  active: boolean;
}

@Component({
  selector: 'app-regulator-portal',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-24 pb-16 px-4">
      <div class="max-w-5xl mx-auto">

        <!-- Back link -->
        <a routerLink="/command-center" class="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-400 transition-colors mb-6">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m15 18-6-6 6-6"/></svg>
          {{ lang.l('Juhtimiskeskus', 'Command Center') }}
        </a>

        <!-- Hero Section -->
        <div class="text-center mb-10">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-4">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            {{ lang.l('Regulaatori portaal', 'Regulator Portal') }}
          </div>
          <h1 class="text-3xl md:text-4xl font-bold gradient-text mb-3">
            {{ lang.l('Regulaatori portaal', 'Regulator Portal') }}
          </h1>
          <p class="text-slate-400 max-w-2xl mx-auto">
            {{ lang.l(
              'Loo turvalised, ainult lugemiseks ligip\u00e4\u00e4sulingid regulaatoritele ja audiitoritele oma vastavusandmete jagamiseks. Iga link on ajaliselt piiratud ja j\u00e4lgitav.',
              'Create secure, read-only shareable links for regulators and auditors to view your compliance data. Each link is time-limited and trackable.'
            ) }}
          </p>
        </div>

        <!-- Premium Gate -->
        @if (!subService.isPremium()) {
          <div class="bg-gradient-to-br from-violet-500/10 via-slate-800/50 to-cyan-500/10 border border-violet-500/20 rounded-2xl p-8 text-center mb-10">
            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h2 class="text-xl font-bold text-white mb-2">
              {{ lang.l('Premium funktsioon', 'Premium Feature') }}
            </h2>
            <p class="text-slate-400 mb-6 max-w-md mx-auto">
              {{ lang.l(
                'Regulaatori portaal on saadaval Standard ja Enterprise plaanidega. Uuenda plaani, et jagada vastavusandmeid turvaliselt.',
                'The Regulator Portal is available with Standard and Enterprise plans. Upgrade to securely share compliance data with regulators.'
              ) }}
            </p>
            <a routerLink="/pricing"
               class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-semibold hover:from-violet-400 hover:to-cyan-400 transition-all shadow-lg shadow-violet-500/25">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
              {{ lang.l('Uuenda plaani', 'Upgrade Plan') }}
            </a>
          </div>
        }

        @if (subService.isPremium()) {
          <!-- Stats Row -->
          <div class="grid grid-cols-3 gap-4 mb-8">
            <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 text-center">
              <div class="text-3xl font-bold text-violet-400">{{ totalTokens() }}</div>
              <div class="text-xs text-slate-400 mt-1">{{ lang.l('Kokku linke', 'Total Links') }}</div>
            </div>
            <div class="bg-slate-800/50 border border-emerald-500/20 rounded-xl p-5 text-center">
              <div class="text-3xl font-bold text-emerald-400">{{ activeTokens() }}</div>
              <div class="text-xs text-slate-400 mt-1">{{ lang.l('Aktiivsed', 'Active') }}</div>
            </div>
            <div class="bg-slate-800/50 border border-cyan-500/20 rounded-xl p-5 text-center">
              <div class="text-3xl font-bold text-cyan-400">{{ totalViews() }}</div>
              <div class="text-xs text-slate-400 mt-1">{{ lang.l('Kokku vaatamisi', 'Total Views') }}</div>
            </div>
          </div>

          <!-- Create Token Form -->
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-8">
            <div class="flex items-center gap-3 mb-5">
              <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                <svg class="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
              </div>
              <h2 class="text-lg font-semibold text-white">
                {{ lang.l('Loo uus ligip\u00e4\u00e4sulink', 'Create New Access Link') }}
              </h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <!-- Label -->
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1.5">
                  {{ lang.l('Silt', 'Label') }}
                </label>
                <input type="text" [(ngModel)]="formLabel"
                       [placeholder]="lang.l('nt. Finantsinspektsioon 2026', 'e.g. Financial Authority 2026')"
                       class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white text-sm
                              placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all">
              </div>
              <!-- Expiry -->
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1.5">
                  {{ lang.l('Aegumiskuup\u00e4ev', 'Expiry Date') }}
                </label>
                <input type="date" [(ngModel)]="formExpiry"
                       [min]="minDate"
                       class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white text-sm
                              focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all">
              </div>
            </div>

            <!-- Permissions -->
            <div class="mb-5">
              <label class="block text-xs font-medium text-slate-400 mb-2.5">
                {{ lang.l('\u00d5igused', 'Permissions') }}
              </label>
              <div class="flex flex-wrap gap-2">
                @for (perm of allPermissions; track perm.key) {
                  <button (click)="togglePermission(perm.key)"
                          class="px-3.5 py-2 rounded-lg text-xs font-medium border transition-all flex items-center gap-2"
                          [class]="formPermissions().includes(perm.key)
                            ? 'bg-violet-500/15 border-violet-500/40 text-violet-300'
                            : 'bg-slate-700/20 border-slate-700/50 text-slate-400 hover:border-slate-600'">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      @if (formPermissions().includes(perm.key)) {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                      } @else {
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="1.5"/>
                      }
                    </svg>
                    {{ lang.l(perm.labelEt, perm.labelEn) }}
                  </button>
                }
              </div>
            </div>

            @if (formError()) {
              <p class="text-red-400 text-sm mb-3">{{ formError() }}</p>
            }

            <button (click)="createToken()" [disabled]="creating()"
                    class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold text-sm
                           hover:from-violet-400 hover:to-indigo-400 transition-all shadow-lg shadow-violet-500/20
                           disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
              @if (creating()) {
                <span class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                {{ lang.l('Loomine...', 'Creating...') }}
              } @else {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                </svg>
                {{ lang.l('Loo ligip\u00e4\u00e4sulink', 'Create Access Link') }}
              }
            </button>
          </div>

          <!-- Success banner -->
          @if (createdToken()) {
            <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 mb-8">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-sm font-semibold text-emerald-400 mb-1">
                    {{ lang.l('Link loodud!', 'Link Created!') }}
                  </h3>
                  <p class="text-xs text-slate-400 mb-2">
                    {{ lang.l('Kopeeri see link ja jaga seda regulaatoriga:', 'Copy this link and share it with the regulator:') }}
                  </p>
                  <div class="flex items-center gap-2">
                    <div class="flex-1 bg-slate-900/60 rounded-lg px-3 py-2 font-mono text-xs text-cyan-400 truncate border border-slate-700/50">
                      {{ getShareUrl(createdToken()!) }}
                    </div>
                    <button (click)="copyToClipboard(getShareUrl(createdToken()!))"
                            class="px-3 py-2 rounded-lg text-xs font-medium transition-all flex-shrink-0"
                            [class]="copiedId() === 'new' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'">
                      {{ copiedId() === 'new' ? lang.l('Kopeeritud!', 'Copied!') : lang.l('Kopeeri', 'Copy') }}
                    </button>
                  </div>
                </div>
                <button (click)="createdToken.set(null)" class="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
          }

          <!-- Loading -->
          @if (loading()) {
            <div class="text-center py-16">
              <div class="w-10 h-10 mx-auto mb-3 rounded-full border-4 border-slate-700 border-t-violet-400 animate-spin"></div>
              <p class="text-sm text-slate-500">{{ lang.l('Laadimine...', 'Loading...') }}</p>
            </div>
          }

          <!-- Empty state -->
          @if (!loading() && tokens().length === 0) {
            <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
              <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-700/30 flex items-center justify-center">
                <svg class="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-white mb-2">
                {{ lang.l('\u00dchtegi linki pole loodud', 'No Links Created Yet') }}
              </h3>
              <p class="text-sm text-slate-400 max-w-sm mx-auto">
                {{ lang.l(
                  'Loo oma esimene ligip\u00e4\u00e4sulink, et jagada vastavusandmeid regulaatorite ja audiitoritega.',
                  'Create your first access link to share compliance data with regulators and auditors.'
                ) }}
              </p>
            </div>
          }

          <!-- Active Tokens Grid -->
          @if (!loading() && tokens().length > 0) {
            <div class="space-y-4">
              <h2 class="text-lg font-semibold text-white flex items-center gap-2">
                <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                </svg>
                {{ lang.l('Ligip\u00e4\u00e4sulingid', 'Access Links') }}
                <span class="text-xs font-normal text-slate-500">({{ tokens().length }})</span>
              </h2>

              @for (t of tokens(); track t.id) {
                <div class="bg-slate-800/50 border rounded-xl p-5 transition-all hover:border-slate-600/50"
                     [class]="t.active && !isExpired(t) ? 'border-slate-700/50' : 'border-red-500/20 opacity-70'">

                  <!-- Token header -->
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-lg flex items-center justify-center"
                           [class]="t.active && !isExpired(t) ? 'bg-violet-500/15 text-violet-400' : 'bg-red-500/10 text-red-400'">
                        @if (t.active && !isExpired(t)) {
                          <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                          </svg>
                        } @else {
                          <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                          </svg>
                        }
                      </div>
                      <div>
                        <h3 class="text-sm font-semibold text-white">{{ t.label }}</h3>
                        <div class="flex items-center gap-2 mt-0.5">
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-medium"
                                [class]="t.active && !isExpired(t) ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/10 text-red-400'">
                            {{ t.active && !isExpired(t) ? lang.l('Aktiivne', 'Active') : (isExpired(t) ? lang.l('Aegunud', 'Expired') : lang.l('T\u00fchistatud', 'Revoked')) }}
                          </span>
                          <span class="text-[10px] text-slate-500">
                            {{ lang.l('Loodud', 'Created') }} {{ t.createdAt | date:'dd.MM.yyyy' }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center gap-4">
                      <!-- Access count -->
                      <div class="text-center">
                        <div class="text-lg font-bold text-cyan-400">{{ t.accessCount }}</div>
                        <div class="text-[10px] text-slate-500">{{ lang.l('Vaatamisi', 'Views') }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- Share URL -->
                  <div class="flex items-center gap-2 mb-3">
                    <div class="flex-1 bg-slate-900/60 rounded-lg px-3 py-2 font-mono text-xs text-cyan-400/80 truncate border border-slate-700/40">
                      {{ getShareUrl(t.token) }}
                    </div>
                    <button (click)="copyToClipboard(getShareUrl(t.token), t.id)"
                            [disabled]="!t.active || isExpired(t)"
                            class="px-3 py-2 rounded-lg text-xs font-medium transition-all flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                            [class]="copiedId() === t.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'">
                      {{ copiedId() === t.id ? lang.l('Kopeeritud!', 'Copied!') : lang.l('Kopeeri', 'Copy') }}
                    </button>
                  </div>

                  <!-- Permissions & expiry row -->
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex flex-wrap gap-1.5">
                      @for (p of t.permissions; track p) {
                        <span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-700/40 text-slate-400 border border-slate-600/30">
                          {{ getPermissionLabel(p) }}
                        </span>
                      }
                    </div>
                    <div class="flex items-center gap-3">
                      <span class="text-[10px] text-slate-500">
                        {{ lang.l('Aegub', 'Expires') }} {{ t.expiresAt | date:'dd.MM.yyyy' }}
                      </span>
                      @if (t.lastAccessedAt) {
                        <span class="text-[10px] text-slate-500">
                          {{ lang.l('Viimati vaadatud', 'Last viewed') }} {{ t.lastAccessedAt | date:'dd.MM.yyyy HH:mm' }}
                        </span>
                      }
                    </div>
                  </div>

                  <!-- Revoke button -->
                  @if (t.active && !isExpired(t)) {
                    <div class="mt-3 pt-3 border-t border-slate-700/30 flex justify-end">
                      @if (confirmRevokeId() === t.id) {
                        <div class="flex items-center gap-2">
                          <span class="text-xs text-red-400">{{ lang.l('Oled kindel?', 'Are you sure?') }}</span>
                          <button (click)="revokeToken(t.id)"
                                  class="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all">
                            {{ lang.l('Jah, t\u00fchista', 'Yes, Revoke') }}
                          </button>
                          <button (click)="confirmRevokeId.set(null)"
                                  class="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-colors">
                            {{ lang.l('Loobu', 'Cancel') }}
                          </button>
                        </div>
                      } @else {
                        <button (click)="confirmRevokeId.set(t.id)"
                                class="px-3 py-1.5 rounded-lg text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          {{ lang.l('T\u00fchista link', 'Revoke Link') }}
                        </button>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }

          <!-- Info section -->
          <div class="mt-10 bg-gradient-to-br from-violet-500/5 to-indigo-500/5 border border-violet-500/15 rounded-xl p-6">
            <h3 class="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ lang.l('Kuidas see t\u00f6\u00f6tab', 'How It Works') }}
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="flex items-start gap-3">
                <div class="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center flex-shrink-0 text-violet-400 font-bold text-xs">1</div>
                <div>
                  <p class="text-sm font-medium text-slate-300">{{ lang.l('Loo link', 'Create a Link') }}</p>
                  <p class="text-xs text-slate-500 mt-0.5">{{ lang.l('M\u00e4\u00e4ra silt, \u00f5igused ja aegumiskuup\u00e4ev', 'Set a label, permissions, and expiry date') }}</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <div class="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center flex-shrink-0 text-violet-400 font-bold text-xs">2</div>
                <div>
                  <p class="text-sm font-medium text-slate-300">{{ lang.l('Jaga regulaatoriga', 'Share with Regulator') }}</p>
                  <p class="text-xs text-slate-500 mt-0.5">{{ lang.l('Saada link turvaliselt e-posti v\u00f5i muul viisil', 'Send the link securely via email or other channel') }}</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <div class="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center flex-shrink-0 text-violet-400 font-bold text-xs">3</div>
                <div>
                  <p class="text-sm font-medium text-slate-300">{{ lang.l('J\u00e4lgi ligip\u00e4\u00e4su', 'Track Access') }}</p>
                  <p class="text-xs text-slate-500 mt-0.5">{{ lang.l('N\u00e4e, millal ja kui tihti regulaator andmeid vaatas', 'See when and how often the regulator viewed data') }}</p>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Toast -->
        @if (toast()) {
          <div class="fixed bottom-6 right-6 bg-emerald-500/90 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium z-50
                      animate-[fadeIn_0.3s_ease-out]">
            {{ toast() }}
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .gradient-text {
      background: linear-gradient(135deg, #a78bfa, #22d3ee);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  `]
})
export class RegulatorPortalComponent implements OnInit {
  lang = inject(LangService);
  subService = inject(SubscriptionService);
  private http = inject(HttpClient);

  // State
  loading = signal(false);
  tokens = signal<RegulatorToken[]>([]);
  creating = signal(false);
  createdToken = signal<string | null>(null);
  formError = signal('');
  copiedId = signal<string | null>(null);
  confirmRevokeId = signal<string | null>(null);
  toast = signal('');

  // Form
  formLabel = '';
  formExpiry = '';
  formPermissions = signal<string[]>(['assessment_scores', 'evidence_stats']);
  minDate = new Date().toISOString().split('T')[0];

  // Permission options
  allPermissions = [
    { key: 'assessment_scores', labelEt: 'Hindamisskoorid', labelEn: 'Assessment Scores' },
    { key: 'evidence_stats', labelEt: 'T\u00f5endite statistika', labelEn: 'Evidence Statistics' },
    { key: 'incidents', labelEt: 'Intsidendid', labelEn: 'Incidents' },
    { key: 'vendors', labelEt: 'Tarnijad', labelEn: 'Vendors' },
    { key: 'remediation', labelEt: 'Parandust\u00f6\u00f6d', labelEn: 'Remediation' }
  ];

  // Computed stats
  totalTokens = computed(() => this.tokens().length);
  activeTokens = computed(() => this.tokens().filter(t => t.active && !this.isExpired(t)).length);
  totalViews = computed(() => this.tokens().reduce((sum, t) => sum + t.accessCount, 0));

  ngOnInit(): void {
    if (this.subService.isPremium()) {
      this.loadTokens();
    }
    // Set default expiry to 30 days from now
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 30);
    this.formExpiry = defaultExpiry.toISOString().split('T')[0];
  }

  loadTokens(): void {
    this.loading.set(true);
    this.http.get<RegulatorToken[]>('/api/regulator-portal').subscribe({
      next: (data) => {
        this.tokens.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  togglePermission(key: string): void {
    const current = this.formPermissions();
    if (current.includes(key)) {
      this.formPermissions.set(current.filter(p => p !== key));
    } else {
      this.formPermissions.set([...current, key]);
    }
  }

  createToken(): void {
    // Validation
    if (!this.formLabel.trim()) {
      this.formError.set(this.lang.l('Palun sisesta silt', 'Please enter a label'));
      return;
    }
    if (!this.formExpiry) {
      this.formError.set(this.lang.l('Palun vali aegumiskuup\u00e4ev', 'Please select an expiry date'));
      return;
    }
    if (this.formPermissions().length === 0) {
      this.formError.set(this.lang.l('Palun vali v\u00e4hemalt \u00fcks \u00f5igus', 'Please select at least one permission'));
      return;
    }

    this.creating.set(true);
    this.formError.set('');

    this.http.post<RegulatorToken>('/api/regulator-portal', {
      label: this.formLabel.trim(),
      expiresAt: this.formExpiry,
      permissions: this.formPermissions()
    }).subscribe({
      next: (token) => {
        this.creating.set(false);
        this.createdToken.set(token.token);
        this.formLabel = '';
        const defaultExpiry = new Date();
        defaultExpiry.setDate(defaultExpiry.getDate() + 30);
        this.formExpiry = defaultExpiry.toISOString().split('T')[0];
        this.formPermissions.set(['assessment_scores', 'evidence_stats']);
        this.loadTokens();
        this.showToast(this.lang.l('Link edukalt loodud!', 'Link created successfully!'));
      },
      error: (err) => {
        this.creating.set(false);
        this.formError.set(err.error?.error || this.lang.l('Lingi loomine eba\u00f5nnestus', 'Failed to create link'));
      }
    });
  }

  revokeToken(id: string): void {
    this.http.delete(`/api/regulator-portal/${id}`).subscribe({
      next: () => {
        this.confirmRevokeId.set(null);
        this.loadTokens();
        this.showToast(this.lang.l('Link t\u00fchistatud', 'Link revoked'));
      },
      error: () => {
        this.showToast(this.lang.l('T\u00fchistamine eba\u00f5nnestus', 'Failed to revoke link'));
      }
    });
  }

  copyToClipboard(url: string, id?: string): void {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(url);
      this.copiedId.set(id || 'new');
      setTimeout(() => this.copiedId.set(null), 2000);
    }
  }

  getShareUrl(token: string): string {
    const langPrefix = this.lang.l('et', 'en');
    return `https://doraaudit.eu/${langPrefix}/regulator-view/${token}`;
  }

  getPermissionLabel(key: string): string {
    const perm = this.allPermissions.find(p => p.key === key);
    return perm ? this.lang.l(perm.labelEt, perm.labelEn) : key;
  }

  isExpired(token: RegulatorToken): boolean {
    return new Date(token.expiresAt) < new Date();
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3000);
  }
}
