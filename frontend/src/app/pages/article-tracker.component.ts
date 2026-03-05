import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LangService } from '../lang.service';

interface Article {
  id: string;
  number: string;
  title: string;
  pillar: string;
  status: 'compliant' | 'partial' | 'non_compliant';
  evidenceCount: number;
  notes: string;
  responsiblePerson?: string;
  targetDate?: string;
}

interface Chapter {
  number: string;
  title: string;
  articleRange: string;
  progress: number;
  articles: Article[];
}

interface TrackerData {
  chapters: Chapter[];
  totalArticles: number;
  compliant: number;
  partial: number;
  nonCompliant: number;
  overallPercentage: number;
}

@Component({
  selector: 'app-article-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            DORA Article Compliance Tracker
          </h1>
          <p class="text-slate-400 text-sm mt-1">Article-by-article compliance status for Regulation (EU) 2022/2554</p>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="text-center py-24">
          <div class="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-slate-700 border-t-violet-400 animate-spin"></div>
          <p class="text-slate-400 text-sm">Loading article tracker...</p>
        </div>
      }

      @if (!loading() && data()) {
        <!-- Overview Section -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Circular Progress Indicator -->
          <div class="lg:col-span-1 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-8 text-center relative overflow-hidden">
            <div class="absolute inset-0 opacity-15"
                 [style.background]="'radial-gradient(circle at 50% 50%, ' + getOverallColor() + ' 0%, transparent 60%)'"></div>
            <div class="relative">
              <div class="relative w-44 h-44 mx-auto mb-4">
                <svg class="w-full h-full -rotate-90" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="70" fill="none" stroke="#1e293b" stroke-width="12"/>
                  <circle cx="80" cy="80" r="70" fill="none"
                          [attr.stroke]="getOverallColor()"
                          stroke-width="12" stroke-linecap="round"
                          [attr.stroke-dasharray]="440"
                          [attr.stroke-dashoffset]="440 - (440 * data()!.overallPercentage / 100)"
                          class="transition-all duration-[2000ms] ease-out"/>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="text-5xl font-black text-white">{{ data()!.overallPercentage }}</span>
                  <span class="text-sm text-slate-400 mt-1">% compliant</span>
                </div>
              </div>
              <p class="text-xs text-slate-500">{{ data()!.totalArticles }} articles assessed</p>
            </div>
          </div>

          <!-- Status Count Cards -->
          <div class="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <!-- Compliant -->
            <div class="bg-slate-800/50 border border-emerald-500/30 rounded-2xl p-6 text-center relative overflow-hidden group hover:border-emerald-500/50 transition-all">
              <div class="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-bl-full"></div>
              <div class="relative">
                <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div class="text-4xl font-black text-emerald-400 mb-1">{{ data()!.compliant }}</div>
                <div class="text-xs text-slate-400 font-medium uppercase tracking-wider">Compliant</div>
              </div>
            </div>

            <!-- Partial -->
            <div class="bg-slate-800/50 border border-amber-500/30 rounded-2xl p-6 text-center relative overflow-hidden group hover:border-amber-500/50 transition-all">
              <div class="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-bl-full"></div>
              <div class="relative">
                <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <svg class="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <div class="text-4xl font-black text-amber-400 mb-1">{{ data()!.partial }}</div>
                <div class="text-xs text-slate-400 font-medium uppercase tracking-wider">Partial</div>
              </div>
            </div>

            <!-- Non-Compliant -->
            <div class="bg-slate-800/50 border border-red-500/30 rounded-2xl p-6 text-center relative overflow-hidden group hover:border-red-500/50 transition-all">
              <div class="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-bl-full"></div>
              <div class="relative">
                <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-red-500/15 flex items-center justify-center">
                  <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div class="text-4xl font-black text-red-400 mb-1">{{ data()!.nonCompliant }}</div>
                <div class="text-xs text-slate-400 font-medium uppercase tracking-wider">Non-Compliant</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Status Legend -->
        <div class="bg-slate-800/30 border border-slate-700/30 rounded-xl px-6 py-3 flex flex-wrap items-center gap-6">
          <span class="text-xs text-slate-500 font-medium uppercase tracking-wider">Legend:</span>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-emerald-400"></div>
            <span class="text-xs text-slate-400">Compliant - Fully meets DORA requirements</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-amber-400"></div>
            <span class="text-xs text-slate-400">Partial - Partially meets requirements, action needed</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-red-400"></div>
            <span class="text-xs text-slate-400">Non-Compliant - Does not meet requirements</span>
          </div>
        </div>

        <!-- Chapter Accordion -->
        <div class="space-y-3">
          @for (chapter of data()!.chapters; track chapter.number) {
            <div [class]="'bg-slate-800/50 border rounded-2xl overflow-hidden transition-all ' + (expandedChapters.has(chapter.number) ? 'border-violet-500/30' : 'border-slate-700/50')">
              <!-- Chapter Header -->
              <div class="px-6 py-5 cursor-pointer flex items-center justify-between gap-4 hover:bg-slate-800/80 transition-colors"
                   (click)="toggleChapter(chapter.number)">
                <div class="flex items-center gap-4 min-w-0">
                  <div class="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <span class="text-sm font-bold text-violet-400">{{ chapter.number }}</span>
                  </div>
                  <div class="min-w-0">
                    <h2 class="text-lg font-semibold text-white truncate">{{ chapter.title }}</h2>
                    <p class="text-xs text-slate-500 mt-0.5">{{ chapter.articleRange }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-4 flex-shrink-0">
                  <!-- Chapter progress bar -->
                  <div class="hidden sm:flex items-center gap-3">
                    <div class="w-32 h-2 rounded-full bg-slate-700/50 overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-500"
                           [style.width.%]="chapter.progress"
                           [class]="chapter.progress >= 80 ? 'bg-emerald-400' : chapter.progress >= 40 ? 'bg-amber-400' : 'bg-red-400'"></div>
                    </div>
                    <span class="text-sm font-bold min-w-[3rem] text-right"
                          [class]="chapter.progress >= 80 ? 'text-emerald-400' : chapter.progress >= 40 ? 'text-amber-400' : 'text-red-400'">
                      {{ chapter.progress }}%
                    </span>
                  </div>
                  <svg class="w-5 h-5 text-slate-400 transition-transform duration-200"
                       [class.rotate-180]="expandedChapters.has(chapter.number)"
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>
              </div>

              <!-- Mobile progress (shown below header on small screens) -->
              <div class="sm:hidden px-6 pb-3 -mt-2">
                <div class="flex items-center gap-3">
                  <div class="flex-1 h-2 rounded-full bg-slate-700/50 overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500"
                         [style.width.%]="chapter.progress"
                         [class]="chapter.progress >= 80 ? 'bg-emerald-400' : chapter.progress >= 40 ? 'bg-amber-400' : 'bg-red-400'"></div>
                  </div>
                  <span class="text-sm font-bold"
                        [class]="chapter.progress >= 80 ? 'text-emerald-400' : chapter.progress >= 40 ? 'text-amber-400' : 'text-red-400'">
                    {{ chapter.progress }}%
                  </span>
                </div>
              </div>

              <!-- Expanded Chapter Content: Article Cards -->
              @if (expandedChapters.has(chapter.number)) {
                <div class="border-t border-slate-700/30">
                  <div class="p-4 space-y-2">
                    @for (article of chapter.articles; track article.id) {
                      <div [class]="'border rounded-xl transition-all hover:border-slate-600/50 ' + (expandedArticle === article.id ? 'bg-slate-900/60 border-violet-500/30' : 'bg-slate-900/40 border-slate-700/30')">

                        <!-- Article Row -->
                        <div class="px-5 py-4 cursor-pointer flex items-center gap-4"
                             (click)="toggleArticle(article.id, article)">
                          <!-- Article Number -->
                          <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-mono font-bold"
                               [class]="article.status === 'compliant' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                                         article.status === 'partial' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                                         'bg-red-500/15 text-red-400 border border-red-500/20'">
                            {{ article.number }}
                          </div>

                          <!-- Article Title & Pillar -->
                          <div class="flex-1 min-w-0">
                            <h3 class="text-sm font-medium text-white truncate">{{ article.title }}</h3>
                            <div class="flex items-center gap-2 mt-1">
                              <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                {{ formatPillar(article.pillar) }}
                              </span>
                            </div>
                          </div>

                          <!-- Status Badge -->
                          <div class="flex items-center gap-3 flex-shrink-0">
                            <span class="hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-semibold"
                                  [class]="article.status === 'compliant' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                                           article.status === 'partial' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                                           'bg-red-500/15 text-red-400 border border-red-500/30'">
                              {{ article.status === 'compliant' ? 'Compliant' : article.status === 'partial' ? 'Partial' : 'Non-Compliant' }}
                            </span>

                            <!-- Evidence Count -->
                            <div class="flex items-center gap-1 text-slate-500" title="Evidence documents">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                              </svg>
                              <span class="text-xs font-medium">{{ article.evidenceCount }}</span>
                            </div>

                            <!-- Expand icon -->
                            <svg class="w-4 h-4 text-slate-500 transition-transform duration-200"
                                 [class.rotate-180]="expandedArticle === article.id"
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                          </div>
                        </div>

                        <!-- Expanded Article Detail -->
                        @if (expandedArticle === article.id) {
                          <div class="px-5 pb-5 border-t border-slate-700/30 pt-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <!-- Notes -->
                              <div class="md:col-span-2">
                                <label class="block text-xs font-medium text-slate-400 mb-1.5">Notes</label>
                                <textarea [(ngModel)]="article.notes"
                                          rows="3"
                                          placeholder="Add compliance notes, observations, or action items..."
                                          class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 resize-none"></textarea>
                              </div>

                              <!-- Responsible Person -->
                              <div>
                                <label class="block text-xs font-medium text-slate-400 mb-1.5">Responsible Person</label>
                                <input [(ngModel)]="article.responsiblePerson"
                                       type="text"
                                       placeholder="e.g. John Smith, CISO"
                                       class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50">
                              </div>

                              <!-- Target Date -->
                              <div>
                                <label class="block text-xs font-medium text-slate-400 mb-1.5">Target Compliance Date</label>
                                <input [(ngModel)]="article.targetDate"
                                       type="date"
                                       class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500/50">
                              </div>

                              <!-- Status Override -->
                              <div>
                                <label class="block text-xs font-medium text-slate-400 mb-1.5">Override Status</label>
                                <select [(ngModel)]="article.status"
                                        class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500/50">
                                  <option value="compliant">Compliant</option>
                                  <option value="partial">Partial</option>
                                  <option value="non_compliant">Non-Compliant</option>
                                </select>
                              </div>

                              <!-- Evidence Count (read-only info) -->
                              <div>
                                <label class="block text-xs font-medium text-slate-400 mb-1.5">Evidence Documents</label>
                                <div class="flex items-center gap-3 px-4 py-2.5 bg-slate-900/30 border border-slate-700/30 rounded-xl">
                                  <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
                                  </svg>
                                  <span class="text-sm text-white font-medium">{{ article.evidenceCount }} document{{ article.evidenceCount !== 1 ? 's' : '' }} attached</span>
                                </div>
                              </div>
                            </div>

                            <!-- Action Buttons -->
                            <div class="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-700/30">
                              <button (click)="cancelArticleEdit(article); $event.stopPropagation()"
                                      class="px-4 py-2 rounded-xl bg-slate-700/50 text-slate-300 text-sm hover:bg-slate-700 transition-all">
                                Cancel
                              </button>
                              <button (click)="saveArticle(article); $event.stopPropagation()"
                                      class="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all flex items-center gap-2"
                                      [disabled]="saving()">
                                @if (saving()) {
                                  <div class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                }
                                @if (!saving()) {
                                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                  </svg>
                                }
                                {{ saving() ? 'Saving...' : 'Save Changes' }}
                              </button>
                            </div>

                            <!-- Save Success Message -->
                            @if (saveSuccess() === article.id) {
                              <div class="mt-3 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                Changes saved successfully
                              </div>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Summary Footer -->
        <div class="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 class="text-sm font-semibold text-white mb-1">Regulation (EU) 2022/2554 — DORA</h3>
              <p class="text-xs text-slate-500">Digital Operational Resilience Act. Covering {{ data()!.totalArticles }} articles across {{ data()!.chapters.length }} chapters.</p>
            </div>
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-6 text-xs text-slate-400">
                <span class="flex items-center gap-1.5">
                  <div class="w-2 h-2 rounded-full bg-emerald-400"></div>
                  {{ data()!.compliant }} compliant
                </span>
                <span class="flex items-center gap-1.5">
                  <div class="w-2 h-2 rounded-full bg-amber-400"></div>
                  {{ data()!.partial }} partial
                </span>
                <span class="flex items-center gap-1.5">
                  <div class="w-2 h-2 rounded-full bg-red-400"></div>
                  {{ data()!.nonCompliant }} gaps
                </span>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Error State -->
      @if (!loading() && error()) {
        <div class="bg-slate-800/50 border border-red-500/30 rounded-2xl p-12 text-center">
          <div class="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-white mb-2">Unable to load article tracker</h3>
          <p class="text-sm text-slate-400 mb-4">{{ error() }}</p>
          <button (click)="loadData()"
                  class="px-5 py-2.5 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30 text-sm font-medium hover:bg-violet-500/30 transition-all">
            Try Again
          </button>
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && !error() && !data()) {
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
          <div class="w-16 h-16 mx-auto rounded-2xl bg-slate-700/50 flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-white mb-2">No compliance data available</h3>
          <p class="text-sm text-slate-400">Complete a DORA assessment first to populate article-level compliance tracking.</p>
        </div>
      }
    </div>
  `
})
export class ArticleTrackerComponent implements OnInit {
  readonly lang = inject(LangService);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  loading = signal(true);
  data = signal<TrackerData | null>(null);
  error = signal<string | null>(null);
  saving = signal(false);
  saveSuccess = signal<string | null>(null);

  expandedChapters = new Set<string>();
  expandedArticle: string | null = null;
  private articleSnapshot: Partial<Article> | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<TrackerData>('/api/article-tracker').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.data.set(result);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load compliance data. Please try again.');
        this.loading.set(false);
      }
    });
  }

  toggleChapter(chapterNumber: string): void {
    if (this.expandedChapters.has(chapterNumber)) {
      this.expandedChapters.delete(chapterNumber);
    } else {
      this.expandedChapters.add(chapterNumber);
    }
  }

  toggleArticle(articleId: string, article?: Article): void {
    if (this.expandedArticle === articleId) {
      this.expandedArticle = null;
      this.articleSnapshot = null;
    } else {
      if (article) {
        this.articleSnapshot = { status: article.status, notes: article.notes, responsiblePerson: article.responsiblePerson, targetDate: article.targetDate };
      }
      this.expandedArticle = articleId;
    }
    this.saveSuccess.set(null);
  }

  cancelArticleEdit(article: Article): void {
    if (this.articleSnapshot) {
      article.status = this.articleSnapshot.status as Article['status'] ?? article.status;
      article.notes = this.articleSnapshot.notes ?? article.notes;
      article.responsiblePerson = this.articleSnapshot.responsiblePerson;
      article.targetDate = this.articleSnapshot.targetDate;
    }
    this.expandedArticle = null;
    this.articleSnapshot = null;
    this.saveSuccess.set(null);
  }

  saveArticle(article: Article): void {
    this.saving.set(true);
    this.saveSuccess.set(null);
    this.http.put(`/api/article-tracker/${article.id}`, {
      status: article.status,
      notes: article.notes,
      responsiblePerson: article.responsiblePerson,
      targetDate: article.targetDate
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.saveSuccess.set(article.id);
        // Update snapshot to match saved values so cancel doesn't revert to stale data
        this.articleSnapshot = { status: article.status, notes: article.notes, responsiblePerson: article.responsiblePerson, targetDate: article.targetDate };
        this.loadData();
        setTimeout(() => this.saveSuccess.set(null), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Failed to save article. Please try again.');
      }
    });
  }

  getOverallColor(): string {
    const pct = this.data()?.overallPercentage ?? 0;
    if (pct >= 75) return '#34d399';
    if (pct >= 40) return '#fbbf24';
    return '#f87171';
  }

  formatPillar(pillar: string): string {
    const labels: { [key: string]: string } = {
      ICT_RISK_MANAGEMENT: 'ICT Risk Management',
      INCIDENT_MANAGEMENT: 'Incident Management',
      TESTING: 'Digital Resilience Testing',
      THIRD_PARTY: 'Third-Party Risk',
      INFORMATION_SHARING: 'Information Sharing',
      GENERAL: 'General Provisions',
      GOVERNANCE: 'Governance',
      OVERSIGHT: 'Oversight Framework',
      PENALTIES: 'Penalties & Enforcement',
      TRANSITIONAL: 'Transitional Provisions'
    };
    return labels[pillar] || pillar.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
