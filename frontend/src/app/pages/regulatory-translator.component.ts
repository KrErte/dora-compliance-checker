import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';
import { ApiService } from '../api.service';
import { SubscriptionService } from '../services/subscription.service';

@Component({
  selector: 'app-regulatory-translator',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [`
    @keyframes translatePulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(0.98); }
    }
    .translate-pulse { animation: translatePulse 1.5s ease-in-out infinite; }
    @keyframes impactGlow {
      0%, 100% { box-shadow: 0 0 8px rgba(139, 92, 246, 0.3); }
      50% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.6); }
    }
    .impact-glow { animation: impactGlow 2s ease-in-out infinite; }
    .tab-active { border-bottom: 2px solid #a78bfa; color: #a78bfa; }
    .tab-inactive { border-bottom: 2px solid transparent; color: #94a3b8; }
    .section-collapse { overflow: hidden; transition: max-height 0.4s ease, opacity 0.3s ease; }
    .section-open { max-height: 3000px; opacity: 1; }
    .section-closed { max-height: 0; opacity: 0; }
  `],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-200">
      <!-- Header -->
      <div class="bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-b border-purple-900/30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div class="flex items-center gap-4 mb-2">
            <div class="w-12 h-12 rounded-lg bg-purple-900/30 border border-purple-800/40 flex items-center justify-center">
              <svg class="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
              </svg>
            </div>
            <div>
              <h1 class="text-3xl font-bold text-white tracking-tight">
                {{ lang.l('Regulatiivne tõlkija', 'Live Regulatory Translator') }}
              </h1>
              <p class="text-slate-400 text-sm mt-1">
                {{ lang.l('AI tõlgib regulatiivsed uuendused sinu organisatsiooni spetsiifilisteks tegevusteks', 'AI translates regulatory updates into personalized action items for your organization') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        <!-- Premium Overlay -->
        @if (!sub.isPremium()) {
          <div class="bg-gradient-to-br from-purple-900/20 via-slate-800/50 to-indigo-900/20 border border-purple-700/30 rounded-2xl p-8 text-center mb-8">
            <div class="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h2 class="text-xl font-bold text-white mb-2">{{ lang.l('Premium funktsioon', 'Premium Feature') }}</h2>
            <p class="text-slate-400 mb-6 max-w-lg mx-auto">
              {{ lang.l('Regulatiivne tõlkija on saadaval Standard ja Enterprise tellijatele. Uuenda oma paketti personaalsete regulatiivsete tõlgete saamiseks.',
                         'Live Regulatory Translator is available for Standard and Enterprise subscribers. Upgrade to get personalized regulatory translations.') }}
            </p>
            <a routerLink="/pricing" class="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors">
              {{ lang.l('Uuenda paketti', 'Upgrade Now') }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </a>
          </div>
        }

        <!-- Stats Bar -->
        @if (sub.isPremium()) {
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-slate-800/50 border border-slate-700/30 rounded-xl p-4">
              <div class="text-xs text-slate-500 uppercase tracking-wider mb-1">{{ lang.l('Kokku tõlkeid', 'Total Translations') }}</div>
              <div class="text-2xl font-bold text-white">{{ stats()?.total || 0 }}</div>
            </div>
            <div class="bg-slate-800/50 border border-slate-700/30 rounded-xl p-4">
              <div class="text-xs text-slate-500 uppercase tracking-wider mb-1">{{ lang.l('Keskm. mõjuskoor', 'Avg Impact Score') }}</div>
              <div class="text-2xl font-bold" [class]="getImpactColor(stats()?.avgImpactScore || 0)">{{ stats()?.avgImpactScore || 0 }}</div>
            </div>
            <div class="bg-slate-800/50 border border-slate-700/30 rounded-xl p-4">
              <div class="text-xs text-slate-500 uppercase tracking-wider mb-1">{{ lang.l('Rakendatud tegevused', 'Applied Actions') }}</div>
              <div class="text-2xl font-bold text-emerald-400">{{ stats()?.appliedActionItems || 0 }}/{{ stats()?.totalActionItems || 0 }}</div>
            </div>
            <div class="bg-slate-800/50 border border-slate-700/30 rounded-xl p-4">
              <div class="text-xs text-slate-500 uppercase tracking-wider mb-1">{{ lang.l('Ootel', 'Pending') }}</div>
              <div class="text-2xl font-bold text-amber-400">{{ (stats()?.total || 0) - (stats()?.fullyApplied || 0) - (stats()?.dismissed || 0) }}</div>
            </div>
          </div>
        }

        <!-- Tabs -->
        <div class="flex gap-6 border-b border-slate-700/30 mb-8">
          <button (click)="activeTab.set('updates')"
                  [class]="activeTab() === 'updates' ? 'tab-active' : 'tab-inactive'"
                  class="pb-3 text-sm font-medium transition-colors">
            {{ lang.l('Uuendused', 'Updates') }}
          </button>
          <button (click)="activeTab.set('translations')"
                  [class]="activeTab() === 'translations' ? 'tab-active' : 'tab-inactive'"
                  class="pb-3 text-sm font-medium transition-colors">
            {{ lang.l('Minu tõlked', 'My Translations') }}
            @if ((translations().length || 0) > 0) {
              <span class="ml-2 px-2 py-0.5 text-[10px] bg-purple-500/20 text-purple-400 rounded-full">{{ translations().length }}</span>
            }
          </button>
        </div>

        <!-- TAB 1: Updates -->
        @if (activeTab() === 'updates') {
          @if (loadingUpdates()) {
            <div class="flex items-center justify-center py-20">
              <div class="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
              <span class="ml-3 text-slate-400">{{ lang.l('Laadin uuendusi...', 'Loading updates...') }}</span>
            </div>
          } @else if (updates()?.content?.length === 0) {
            <div class="text-center py-20 text-slate-500">
              {{ lang.l('Regulatiivseid uuendusi pole', 'No regulatory updates found') }}
            </div>
          } @else {
            <div class="space-y-4">
              @for (update of updates()?.content || []; track update.id) {
                <div class="bg-slate-800/40 border border-slate-700/30 rounded-xl p-5 hover:border-slate-600/40 transition-colors">
                  <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-2 flex-wrap">
                        <span class="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase"
                              [class]="getSeverityClass(update.severity)">
                          {{ update.severity }}
                        </span>
                        @if (update.source) {
                          <span class="text-[10px] text-slate-500">{{ update.source }}</span>
                        }
                        @if (update.publishedDate) {
                          <span class="text-[10px] text-slate-500">{{ update.publishedDate }}</span>
                        }
                        @if (update.translated && update.impactScore != null) {
                          <span class="px-2 py-0.5 text-[10px] font-bold rounded-full"
                                [class]="getImpactBadgeClass(update.impactScore)">
                            {{ lang.l('Mõju', 'Impact') }}: {{ update.impactScore }}
                          </span>
                        }
                      </div>
                      <h3 class="text-white font-medium text-sm mb-1 break-words">{{ update.title }}</h3>
                      @if (update.summary) {
                        <p class="text-slate-400 text-xs line-clamp-2">{{ update.summary }}</p>
                      }
                    </div>
                    <div class="shrink-0 flex items-center gap-2">
                      @if (update.translated) {
                        <button (click)="viewTranslation(update.translationId)"
                                class="px-4 py-2 text-xs font-medium bg-purple-600/20 text-purple-400 border border-purple-700/30 rounded-lg hover:bg-purple-600/30 transition-colors whitespace-nowrap">
                          {{ lang.l('Vaata tõlget', 'View Translation') }}
                        </button>
                      } @else {
                        <button (click)="translateUpdate(update)"
                                [disabled]="translatingId() === update.id || !sub.isPremium()"
                                class="px-4 py-2 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2">
                          @if (translatingId() === update.id) {
                            <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            {{ lang.l('Tõlgin...', 'Translating...') }}
                          } @else {
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
                            </svg>
                            {{ lang.l('Tõlgi minu organisatsioonile', 'Translate for My Organization') }}
                          }
                        </button>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Pagination -->
            @if ((updates()?.totalElements || 0) > 20) {
              <div class="flex justify-center gap-2 mt-8">
                <button (click)="loadUpdates(currentPage() - 1)" [disabled]="currentPage() === 0"
                        class="px-3 py-1.5 text-xs bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 disabled:opacity-30">
                  {{ lang.l('Eelmine', 'Previous') }}
                </button>
                <span class="px-3 py-1.5 text-xs text-slate-500">
                  {{ currentPage() + 1 }} / {{ Math.ceil((updates()?.totalElements || 1) / 20) }}
                </span>
                <button (click)="loadUpdates(currentPage() + 1)"
                        [disabled]="(currentPage() + 1) * 20 >= (updates()?.totalElements || 0)"
                        class="px-3 py-1.5 text-xs bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 disabled:opacity-30">
                  {{ lang.l('Järgmine', 'Next') }}
                </button>
              </div>
            }
          }
        }

        <!-- TAB 2: My Translations -->
        @if (activeTab() === 'translations') {
          @if (loadingTranslations()) {
            <div class="flex items-center justify-center py-20">
              <div class="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          } @else if ((translations().length || 0) === 0) {
            <div class="text-center py-20">
              <div class="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
                </svg>
              </div>
              <p class="text-slate-500">{{ lang.l('Teil pole veel tõlkeid. Minge Uuenduste vahelehele, et tõlkida regulatiivsed uuendused.', 'No translations yet. Go to the Updates tab to translate regulatory updates.') }}</p>
            </div>
          } @else {
            <div class="space-y-4">
              @for (t of translations(); track t.id) {
                <div class="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden transition-colors"
                     [ngClass]="{'border-purple-700': expandedId() === t.id}">
                  <!-- Summary row -->
                  <div class="p-5 cursor-pointer hover:bg-slate-800/60" (click)="toggleExpand(t.id)">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span class="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase"
                                [class]="getRiskBadgeClass(t.riskLevel)">
                            {{ t.riskLevel }}
                          </span>
                          <span class="px-2 py-0.5 text-[10px] font-bold rounded-full"
                                [class]="getStatusBadgeClass(t.status)">
                            {{ t.status?.replace('_', ' ') }}
                          </span>
                          <span class="text-[10px] text-slate-500">{{ t.createdAt | date:'dd.MM.yyyy HH:mm' }}</span>
                        </div>
                        <h3 class="text-white font-medium text-sm break-words">{{ t.updateTitle }}</h3>
                      </div>
                      <div class="flex items-center gap-4 shrink-0">
                        <!-- Impact gauge -->
                        <div class="text-center">
                          <div class="w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-bold"
                               [class]="getImpactGaugeClass(t.personalImpactScore)">
                            {{ t.personalImpactScore }}
                          </div>
                          <div class="text-[9px] text-slate-500 mt-0.5">{{ lang.l('Mõju', 'Impact') }}</div>
                        </div>
                        <!-- Action items progress -->
                        <div class="text-center">
                          <div class="text-sm font-bold text-emerald-400">{{ t.appliedActionItems }}/{{ t.totalActionItems }}</div>
                          <div class="text-[9px] text-slate-500">{{ lang.l('Tegevused', 'Actions') }}</div>
                        </div>
                        <!-- Expand arrow -->
                        <svg class="w-5 h-5 text-slate-500 transition-transform" [class.rotate-180]="expandedId() === t.id" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <!-- Expanded detail -->
                  <div class="section-collapse" [class.section-open]="expandedId() === t.id" [class.section-closed]="expandedId() !== t.id">
                    @if (expandedId() === t.id && expandedDetail()) {
                      <div class="border-t border-slate-700/30 p-5 space-y-6">

                        <!-- Plain summary -->
                        <div>
                          <h4 class="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">{{ lang.l('Kokkuvõte', 'Summary') }}</h4>
                          <p class="text-slate-300 text-sm leading-relaxed">{{ expandedDetail()?.plainSummary }}</p>
                        </div>

                        <!-- Impact score visual -->
                        <div class="flex items-center gap-4">
                          <div class="w-16 h-16 rounded-full border-3 flex items-center justify-center text-lg font-bold impact-glow"
                               [class]="getImpactGaugeClass(expandedDetail()?.personalImpactScore)">
                            {{ expandedDetail()?.personalImpactScore }}
                          </div>
                          <div>
                            <div class="text-sm font-medium text-white">{{ lang.l('Isiklik mõjuskoor', 'Personal Impact Score') }}</div>
                            <div class="text-xs text-slate-400">
                              {{ lang.l('Hindamisskoor tõlke ajal', 'Assessment score at time of translation') }}: {{ expandedDetail()?.assessmentScoreAtTime | number:'1.0-0' }}%
                            </div>
                          </div>
                        </div>

                        <!-- Affected areas: 4 panels -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <!-- Assessment gaps -->
                          <div class="bg-slate-900/50 border border-red-900/20 rounded-lg p-4">
                            <h5 class="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                              {{ lang.l('Hindamise lüngad', 'Assessment Gaps') }}
                            </h5>
                            @if (expandedDetail()?.affectedAreas?.assessmentGaps?.length) {
                              <ul class="space-y-1">
                                @for (gap of expandedDetail()?.affectedAreas?.assessmentGaps; track $index) {
                                  <li class="text-xs text-slate-400 flex items-start gap-1.5">
                                    <span class="text-red-400 mt-0.5">&#x2022;</span> {{ gap }}
                                  </li>
                                }
                              </ul>
                            } @else {
                              <p class="text-xs text-slate-500 italic">{{ lang.l('Puuduvad', 'None identified') }}</p>
                            }
                          </div>

                          <!-- Evidence gaps -->
                          <div class="bg-slate-900/50 border border-amber-900/20 rounded-lg p-4">
                            <h5 class="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                              {{ lang.l('Tõendite lüngad', 'Evidence Gaps') }}
                            </h5>
                            @if (expandedDetail()?.affectedAreas?.evidenceGaps?.length) {
                              <ul class="space-y-1">
                                @for (gap of expandedDetail()?.affectedAreas?.evidenceGaps; track $index) {
                                  <li class="text-xs text-slate-400 flex items-start gap-1.5">
                                    <span class="text-amber-400 mt-0.5">&#x2022;</span> {{ gap }}
                                  </li>
                                }
                              </ul>
                            } @else {
                              <p class="text-xs text-slate-500 italic">{{ lang.l('Puuduvad', 'None identified') }}</p>
                            }
                          </div>

                          <!-- Affected providers -->
                          <div class="bg-slate-900/50 border border-blue-900/20 rounded-lg p-4">
                            <h5 class="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                              {{ lang.l('Mõjutatud teenusepakkujad', 'Affected Providers') }}
                            </h5>
                            @if (expandedDetail()?.affectedAreas?.affectedProviders?.length) {
                              <ul class="space-y-1">
                                @for (p of expandedDetail()?.affectedAreas?.affectedProviders; track $index) {
                                  <li class="text-xs text-slate-400 flex items-start gap-1.5">
                                    <span class="text-blue-400 mt-0.5">&#x2022;</span> {{ p }}
                                  </li>
                                }
                              </ul>
                            } @else {
                              <p class="text-xs text-slate-500 italic">{{ lang.l('Puuduvad', 'None identified') }}</p>
                            }
                          </div>

                          <!-- Contract clauses -->
                          <div class="bg-slate-900/50 border border-emerald-900/20 rounded-lg p-4">
                            <h5 class="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                              {{ lang.l('Lepinguklauslid', 'Contract Clauses') }}
                            </h5>
                            @if (expandedDetail()?.affectedAreas?.contractClauses?.length) {
                              <ul class="space-y-1">
                                @for (c of expandedDetail()?.affectedAreas?.contractClauses; track $index) {
                                  <li class="text-xs text-slate-400 flex items-start gap-1.5">
                                    <span class="text-emerald-400 mt-0.5">&#x2022;</span> {{ c }}
                                  </li>
                                }
                              </ul>
                            } @else {
                              <p class="text-xs text-slate-500 italic">{{ lang.l('Puuduvad', 'None identified') }}</p>
                            }
                          </div>
                        </div>

                        <!-- Action Items Table -->
                        <div>
                          <div class="flex items-center justify-between mb-3">
                            <h4 class="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                              {{ lang.l('Tegevused', 'Action Items') }} ({{ expandedDetail()?.actionItems?.length || 0 }})
                            </h4>
                            @if (selectedIndices().length > 0 && expandedDetail()?.status !== 'FULLY_APPLIED') {
                              <button (click)="applySelected()"
                                      [disabled]="applying()"
                                      class="px-4 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center gap-2">
                                @if (applying()) {
                                  <div class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                }
                                {{ lang.l('Rakenda valitud paranduskavasse', 'Apply Selected to Remediation') }} ({{ selectedIndices().length }})
                              </button>
                            }
                          </div>
                          <div class="space-y-2">
                            @for (item of expandedDetail()?.actionItems || []; track $index) {
                              <div class="bg-slate-900/40 border border-slate-700/20 rounded-lg p-3 flex items-start gap-3">
                                @if (expandedDetail()?.status !== 'FULLY_APPLIED') {
                                  <input type="checkbox"
                                         [checked]="selectedIndices().includes($index)"
                                         (change)="toggleIndex($index)"
                                         class="mt-1 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500">
                                }
                                <div class="flex-1 min-w-0">
                                  <div class="flex items-center gap-2 mb-1 flex-wrap">
                                    <span class="text-sm font-medium text-white">{{ item.title }}</span>
                                    <span class="px-1.5 py-0.5 text-[9px] font-bold rounded-full uppercase"
                                          [class]="getRiskBadgeClass(item.priority)">
                                      {{ item.priority }}
                                    </span>
                                    @if (item.pillar) {
                                      <span class="text-[9px] text-slate-500 bg-slate-700/30 px-1.5 py-0.5 rounded">{{ item.pillar?.replace('_', ' ') }}</span>
                                    }
                                    @if (item.articleReference) {
                                      <span class="text-[9px] text-purple-400">{{ item.articleReference }}</span>
                                    }
                                  </div>
                                  <p class="text-xs text-slate-400 leading-relaxed">{{ item.description }}</p>
                                  <div class="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                                    @if (item.suggestedDeadlineDays) {
                                      <span>{{ lang.l('Tähtaeg', 'Deadline') }}: {{ item.suggestedDeadlineDays }} {{ lang.l('päeva', 'days') }}</span>
                                    }
                                    @if (item.overlapsWithExisting) {
                                      <span class="text-amber-400">{{ lang.l('Kattub olemasolevaga', 'Overlaps with existing') }}</span>
                                    }
                                  </div>
                                </div>
                              </div>
                            }
                          </div>
                        </div>

                        <!-- Risk if ignored -->
                        @if (expandedDetail()?.riskIfIgnored) {
                          <div class="bg-red-950/20 border border-red-900/30 rounded-lg p-4">
                            <h4 class="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                              {{ lang.l('Risk ignoreerimise korral', 'Risk If Ignored') }}
                            </h4>
                            <p class="text-sm text-red-300/80 leading-relaxed">{{ expandedDetail()?.riskIfIgnored }}</p>
                          </div>
                        }

                        <!-- Dismiss button -->
                        @if (expandedDetail()?.status !== 'DISMISSED' && expandedDetail()?.status !== 'FULLY_APPLIED') {
                          <div class="flex justify-end">
                            <button (click)="dismissTranslation(expandedDetail()?.id); $event.stopPropagation()"
                                    class="px-4 py-1.5 text-xs text-slate-500 hover:text-slate-300 border border-slate-700/30 rounded-lg hover:bg-slate-800/50 transition-colors">
                              {{ lang.l('Lükka tagasi', 'Dismiss') }}
                            </button>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        }

      </div>
    </div>
  `
})
export class RegulatoryTranslatorComponent implements OnInit {
  readonly lang = inject(LangService);
  readonly sub = inject(SubscriptionService);
  private readonly api = inject(ApiService);

  readonly activeTab = signal<'updates' | 'translations'>('updates');
  readonly loadingUpdates = signal(false);
  readonly loadingTranslations = signal(false);
  readonly updates = signal<any>(null);
  readonly translations = signal<any[]>([]);
  readonly stats = signal<any>(null);
  readonly currentPage = signal(0);
  readonly translatingId = signal<string | null>(null);
  readonly expandedId = signal<string | null>(null);
  readonly expandedDetail = signal<any>(null);
  readonly selectedIndices = signal<number[]>([]);
  readonly applying = signal(false);

  Math = Math;

  ngOnInit() {
    this.loadUpdates(0);
    this.loadTranslations();
    this.loadStats();
  }

  loadUpdates(page: number) {
    this.currentPage.set(page);
    this.loadingUpdates.set(true);
    this.api.getTranslatorUpdates(page).subscribe({
      next: data => { this.updates.set(data); this.loadingUpdates.set(false); },
      error: () => this.loadingUpdates.set(false)
    });
  }

  loadTranslations() {
    this.loadingTranslations.set(true);
    this.api.getTranslations().subscribe({
      next: data => { this.translations.set(data || []); this.loadingTranslations.set(false); },
      error: () => this.loadingTranslations.set(false)
    });
  }

  loadStats() {
    this.api.getTranslatorStats().subscribe({
      next: data => this.stats.set(data),
      error: () => {}
    });
  }

  translateUpdate(update: any) {
    this.translatingId.set(update.id);
    this.api.translateUpdate(update.id).subscribe({
      next: result => {
        this.translatingId.set(null);
        if (!result.error) {
          // Refresh both tabs
          this.loadUpdates(this.currentPage());
          this.loadTranslations();
          this.loadStats();
        }
      },
      error: () => this.translatingId.set(null)
    });
  }

  viewTranslation(id: string) {
    this.activeTab.set('translations');
    this.toggleExpand(id);
  }

  toggleExpand(id: string) {
    if (this.expandedId() === id) {
      this.expandedId.set(null);
      this.expandedDetail.set(null);
      this.selectedIndices.set([]);
    } else {
      this.expandedId.set(id);
      this.expandedDetail.set(null);
      this.selectedIndices.set([]);
      this.api.getTranslation(id).subscribe({
        next: data => this.expandedDetail.set(data),
        error: () => {}
      });
    }
  }

  toggleIndex(idx: number) {
    const current = [...this.selectedIndices()];
    const pos = current.indexOf(idx);
    if (pos >= 0) {
      current.splice(pos, 1);
    } else {
      current.push(idx);
    }
    this.selectedIndices.set(current);
  }

  applySelected() {
    const id = this.expandedId();
    if (!id) return;
    this.applying.set(true);
    this.api.applyTranslationItems(id, this.selectedIndices()).subscribe({
      next: () => {
        this.applying.set(false);
        this.selectedIndices.set([]);
        // Refresh detail
        this.api.getTranslation(id).subscribe({
          next: data => this.expandedDetail.set(data)
        });
        this.loadTranslations();
        this.loadStats();
      },
      error: () => this.applying.set(false)
    });
  }

  dismissTranslation(id: string) {
    if (!id) return;
    this.api.dismissTranslation(id).subscribe({
      next: () => {
        this.expandedId.set(null);
        this.expandedDetail.set(null);
        this.loadTranslations();
        this.loadStats();
      }
    });
  }

  // ─── Style helpers ──────────────────────────────

  getSeverityClass(severity: string): string {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-400';
      case 'LOW': return 'bg-green-500/20 text-green-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  }

  getImpactColor(score: number): string {
    if (score >= 70) return 'text-red-400';
    if (score >= 30) return 'text-amber-400';
    return 'text-emerald-400';
  }

  getImpactBadgeClass(score: number): string {
    if (score >= 70) return 'bg-red-500/20 text-red-400';
    if (score >= 30) return 'bg-amber-500/20 text-amber-400';
    return 'bg-emerald-500/20 text-emerald-400';
  }

  getImpactGaugeClass(score: number): string {
    if (score >= 70) return 'border-red-500 text-red-400 bg-red-500/10';
    if (score >= 30) return 'border-amber-500 text-amber-400 bg-amber-500/10';
    return 'border-emerald-500 text-emerald-400 bg-emerald-500/10';
  }

  getRiskBadgeClass(level: string): string {
    switch (level?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-400';
      case 'LOW': return 'bg-green-500/20 text-green-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'FULLY_APPLIED': return 'bg-emerald-500/20 text-emerald-400';
      case 'PARTIALLY_APPLIED': return 'bg-blue-500/20 text-blue-400';
      case 'DISMISSED': return 'bg-slate-500/20 text-slate-500';
      default: return 'bg-purple-500/20 text-purple-400';
    }
  }
}
