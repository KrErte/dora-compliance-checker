import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LangService } from '../lang.service';
import { ChecklistService } from '../services/checklist.service';

interface DoraArticle {
  number: string;
  title: { et: string; en: string };
  summary: { et: string; en: string };
  keyPoints: { et: string[]; en: string[] };
  severity: 'critical' | 'important' | 'informational';
  chapter: string;
  toolLink?: string;
  toolName?: { et: string; en: string };
}

interface DoraChapter {
  id: string;
  name: { et: string; en: string };
  articles: string;
  icon: string;
}

interface GlossaryTerm {
  term: { et: string; en: string };
  definition: { et: string; en: string };
}

@Component({
  selector: 'app-dora-explorer',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto animate-fade-in-up">
      <!-- Hero Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
          EU 2022/2554
        </div>
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-3">
          {{ lang.t('explorer.dora_regulation_explorer') }}
        </h1>
        <p class="text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
          {{ lang.t('explorer.browse_and_search_dora_digital_operation') }}
        </p>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div class="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-emerald-400">{{ articles.length }}</div>
          <div class="text-xs text-slate-400 mt-1">{{ lang.t('explorer.articles_covered') }}</div>
        </div>
        <div class="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-red-400">{{ criticalCount }}</div>
          <div class="text-xs text-slate-400 mt-1">{{ lang.t('explorer.critical_requirements') }}</div>
        </div>
        <div class="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-cyan-400">7</div>
          <div class="text-xs text-slate-400 mt-1">{{ lang.t('explorer.chapters') }}</div>
        </div>
        <div class="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-violet-400">{{ mockCoverage }}%</div>
          <div class="text-xs text-slate-400 mt-1">{{ lang.t('explorer.your_coverage') }}</div>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="relative mb-8">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        <input
          type="text"
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearch()"
          [placeholder]="lang.t('explorer.search_placeholder')"
          class="w-full pl-12 pr-4 py-3.5 bg-slate-800/80 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all text-sm"
        />
        <div *ngIf="searchQuery" class="absolute inset-y-0 right-0 pr-4 flex items-center">
          <button (click)="searchQuery = ''; onSearch()" class="text-slate-400 hover:text-white transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      <!-- Severity Filter Pills -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button (click)="filterSeverity = null; onSearch()"
                [class]="'px-3 py-1.5 rounded-lg text-xs font-medium transition-all ' + (!filterSeverity ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600')">
          {{ lang.t('explorer.all') }} ({{ articles.length }})
        </button>
        <button (click)="filterSeverity = 'critical'; onSearch()"
                [class]="'px-3 py-1.5 rounded-lg text-xs font-medium transition-all ' + (filterSeverity === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600')">
          <span class="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>
          {{ lang.t('explorer.critical') }} ({{ criticalCount }})
        </button>
        <button (click)="filterSeverity = 'important'; onSearch()"
                [class]="'px-3 py-1.5 rounded-lg text-xs font-medium transition-all ' + (filterSeverity === 'important' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600')">
          <span class="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1"></span>
          {{ lang.t('explorer.important') }} ({{ importantCount }})
        </button>
        <button (click)="filterSeverity = 'informational'; onSearch()"
                [class]="'px-3 py-1.5 rounded-lg text-xs font-medium transition-all ' + (filterSeverity === 'informational' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600')">
          <span class="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
          {{ lang.t('explorer.informational') }} ({{ informationalCount }})
        </button>
      </div>

      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Chapter Sidebar -->
        <div class="lg:w-72 shrink-0">
          <div class="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl p-4 lg:sticky lg:top-24">
            <h3 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
              {{ lang.t('explorer.chapters') }}
            </h3>
            <nav class="space-y-1">
              <button *ngFor="let ch of chapters"
                      (click)="selectChapter(ch.id)"
                      [class]="'w-full text-left px-3 py-2.5 rounded-lg transition-all text-sm flex items-start gap-2.5 ' +
                        (selectedChapter === ch.id
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border border-transparent')">
                <span class="text-base mt-0.5 shrink-0" [innerHTML]="ch.icon"></span>
                <div>
                  <div class="font-medium text-xs">{{ ch.id }}</div>
                  <div class="text-xs opacity-75">{{ l(ch.name.et, ch.name.en) }}</div>
                </div>
              </button>
              <button (click)="selectChapter(null)"
                      [class]="'w-full text-left px-3 py-2.5 rounded-lg transition-all text-sm flex items-center gap-2.5 ' +
                        (!selectedChapter
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border border-transparent')">
                <span class="text-base shrink-0">&#128218;</span>
                <span class="font-medium text-xs">{{ lang.t('explorer.show_all') }}</span>
              </button>
            </nav>

            <!-- Glossary Section -->
            <div class="mt-6 pt-4 border-t border-slate-700/50">
              <h3 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
                {{ lang.t('explorer.glossary') }}
              </h3>
              <div class="space-y-2">
                <div *ngFor="let term of glossaryTerms"
                     class="group relative">
                  <div class="px-2 py-1.5 rounded text-xs text-cyan-400 cursor-help hover:bg-cyan-500/10 transition-colors">
                    {{ l(term.term.et, term.term.en) }}
                  </div>
                  <div class="absolute left-0 bottom-full mb-1 w-64 p-3 bg-slate-900 border border-slate-600 rounded-lg shadow-xl text-xs text-slate-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                    <div class="font-semibold text-white mb-1">{{ l(term.term.et, term.term.en) }}</div>
                    {{ l(term.definition.et, term.definition.en) }}
                    <div class="absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-600"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content: Article Cards -->
        <div class="flex-1 min-w-0">
          <!-- Results count -->
          <div class="flex items-center justify-between mb-4">
            <p class="text-sm text-slate-400">
              {{ filteredArticles.length }} {{ l('artiklit leitud', 'articles found') }}
              <span *ngIf="selectedChapter" class="text-emerald-400"> &mdash; {{ selectedChapter }}</span>
            </p>
            <button *ngIf="expandedArticles.size > 0" (click)="collapseAll()"
                    class="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              {{ lang.t('explorer.collapse_all') }}
            </button>
          </div>

          <!-- No results -->
          <div *ngIf="filteredArticles.length === 0" class="bg-slate-800/60 border border-slate-700/50 rounded-xl p-12 text-center">
            <svg class="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p class="text-slate-400 text-sm">
              {{ lang.t('explorer.no_articles_found') }}
            </p>
          </div>

          <!-- Chapter groups -->
          <div *ngFor="let ch of getVisibleChapters()" class="mb-8">
            <div class="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700/40">
              <span class="text-lg" [innerHTML]="ch.icon"></span>
              <h2 class="text-base font-semibold text-white">{{ ch.id }}: {{ l(ch.name.et, ch.name.en) }}</h2>
              <span class="text-xs text-slate-500 ml-1">({{ ch.articles }})</span>
            </div>

            <div class="space-y-3">
              <div *ngFor="let article of getChapterArticles(ch.id)"
                   class="bg-slate-800/60 backdrop-blur border rounded-xl overflow-hidden transition-all duration-200 hover:border-slate-600/80"
                   [class]="'bg-slate-800/60 backdrop-blur border rounded-xl overflow-hidden transition-all duration-200 hover:border-slate-600/80 ' + getSeverityBorder(article.severity)">

                <!-- Card Header (always visible) -->
                <button (click)="toggleArticle(article.number)"
                        class="w-full text-left px-5 py-4 flex items-start gap-4">
                  <!-- Severity dot -->
                  <div class="mt-1.5 shrink-0">
                    <span [class]="'inline-block w-2.5 h-2.5 rounded-full ' + getSeverityDot(article.severity)"
                          [title]="getSeverityLabel(article.severity)"></span>
                  </div>

                  <!-- Article info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-xs font-mono px-2 py-0.5 rounded bg-slate-700/60 text-slate-300">
                        Art. {{ article.number }}
                      </span>
                      <span [class]="'text-xs px-2 py-0.5 rounded-full font-medium ' + getSeverityBadge(article.severity)">
                        {{ getSeverityLabel(article.severity) }}
                      </span>
                    </div>
                    <h3 class="text-sm font-semibold text-white mt-1.5">
                      {{ l(article.title.et, article.title.en) }}
                    </h3>
                    <p *ngIf="!expandedArticles.has(article.number)" class="text-xs text-slate-400 mt-1 line-clamp-2">
                      {{ l(article.summary.et, article.summary.en) }}
                    </p>
                  </div>

                  <!-- Expand icon -->
                  <div class="mt-1 shrink-0 text-slate-500">
                    <svg [class]="'w-5 h-5 transition-transform duration-200 ' + (expandedArticles.has(article.number) ? 'rotate-180' : '')"
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </button>

                <!-- Expanded Content -->
                <div *ngIf="expandedArticles.has(article.number)" class="px-5 pb-5 pt-0 border-t border-slate-700/30">
                  <!-- Summary -->
                  <div class="mt-4 mb-4">
                    <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      {{ lang.t('explorer.plainlanguage_explanation') }}
                    </h4>
                    <p class="text-sm text-slate-300 leading-relaxed">
                      {{ l(article.summary.et, article.summary.en) }}
                    </p>
                  </div>

                  <!-- Key Requirements -->
                  <div class="mb-4">
                    <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      {{ lang.t('explorer.key_requirements') }}
                    </h4>
                    <ul class="space-y-1.5">
                      <li *ngFor="let point of la(article.keyPoints.et, article.keyPoints.en)"
                          class="flex items-start gap-2 text-sm text-slate-300">
                        <svg class="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/>
                        </svg>
                        <span>{{ point }}</span>
                      </li>
                    </ul>
                  </div>

                  <!-- Compliance Tip / Tool Link -->
                  <div *ngIf="article.toolLink" class="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                    <div class="flex items-center gap-2">
                      <svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                      </svg>
                      <span class="text-xs text-slate-400">
                        {{ lang.t('explorer.compliance_tip') }}
                      </span>
                    </div>
                    <p class="text-sm text-emerald-300 mt-1">
                      <a [routerLink]="article.toolLink" class="hover:text-emerald-200 underline underline-offset-2 transition-colors">
                        {{ l(article.toolName!.et, article.toolName!.en) }}
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- CTA Footer -->
          <div class="mt-10 bg-gradient-to-br from-emerald-900/20 to-cyan-900/20 border border-emerald-500/20 rounded-xl p-6 text-center">
            <h3 class="text-lg font-semibold text-white mb-2">
              {{ lang.t('explorer.ready_to_check_your_compliance') }}
            </h3>
            <p class="text-sm text-slate-400 mb-4 max-w-lg mx-auto">
              {{ lang.t('explorer.use_our_free_selfassessment_tool') }}
            </p>
            <div class="flex flex-wrap justify-center gap-3">
              <a routerLink="/assessment"
                 class="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                {{ lang.t('explorer.start_assessment') }}
              </a>
              <a routerLink="/contract-analysis"
                 class="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                {{ lang.t('explorer.analyze_contract') }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DoraExplorerComponent implements OnInit {
  public lang = inject(LangService);
  private checklist = inject(ChecklistService);

  ngOnInit() {
    this.checklist.markComplete('explore_dora');
  }

  l(et: string, en: string): string {
    return this.lang.l(et, en);
  }

  la(et: any[], en: any[]): any[] {
    return this.lang.currentLang === 'et' ? et : en;
  }

  searchQuery = '';
  selectedChapter: string | null = null;
  filterSeverity: 'critical' | 'important' | 'informational' | null = null;
  expandedArticles = new Set<string>();
  filteredArticles: DoraArticle[] = [];
  mockCoverage = 68;

  chapters: DoraChapter[] = [
    { id: 'Chapter I', name: { et: 'Üldsätted', en: 'General Provisions' }, articles: 'Art. 1-4', icon: '&#9878;' },
    { id: 'Chapter II', name: { et: 'IKT riskijuhtimine', en: 'ICT Risk Management' }, articles: 'Art. 5-16', icon: '&#128737;' },
    { id: 'Chapter III', name: { et: 'IKT intsidentide haldus', en: 'ICT Incident Management' }, articles: 'Art. 17-23', icon: '&#9888;' },
    { id: 'Chapter IV', name: { et: 'Vastupidavuse testimine', en: 'Resilience Testing' }, articles: 'Art. 24-27', icon: '&#128269;' },
    { id: 'Chapter V', name: { et: 'Kolmandate osapoolte risk', en: 'Third-Party Risk' }, articles: 'Art. 28-44', icon: '&#127760;' },
    { id: 'Chapter VI', name: { et: 'Teabe jagamine', en: 'Information Sharing' }, articles: 'Art. 45', icon: '&#128101;' },
    { id: 'Chapter VII', name: { et: 'Pädevad asutused', en: 'Competent Authorities' }, articles: 'Art. 46-56', icon: '&#127963;' },
  ];

  glossaryTerms: GlossaryTerm[] = [
    {
      term: { et: 'IKT risk', en: 'ICT Risk' },
      definition: { et: 'Igasugune mõistlikult tuvastatav asjaolu, mis on seotud info- ja kommunikatsioonitehnoloogia kasutamisega ning mis võib ohustada finantsüksuse turvalisust.', en: 'Any reasonably identifiable circumstance related to the use of ICT which, if materialised, may compromise the security of a financial entity.' }
    },
    {
      term: { et: 'Digitaalne tegevuslik vastupidavus', en: 'Digital Operational Resilience' },
      definition: { et: 'Finantsüksuse võime luua, tagada ja üle vaadata oma tegevuslik terviklikkus ja usaldusväärsus IKT-ga seotud häirete korral.', en: 'The ability of a financial entity to build, assure and review its operational integrity and reliability with respect to ICT-related disruptions.' }
    },
    {
      term: { et: 'TLPT', en: 'TLPT' },
      definition: { et: 'Threat-Led Penetration Testing ehk ohuinfo-põhine läbistustestimine, mis simuleerib reaalseid küberründeid finantsüksuse kriitiliste funktsioonide vastu.', en: 'Threat-Led Penetration Testing — tests that mimic real-world cyber attacks against a financial entity\'s critical functions using threat intelligence.' }
    },
    {
      term: { et: 'Kriitiline IKT teenusepakkuja', en: 'Critical ICT Provider' },
      definition: { et: 'Kolmanda osapoole IKT teenusepakkuja, kelle häire võib süsteemselt mõjutada finantsstabiilsust.', en: 'A third-party ICT service provider whose disruption could systemically impact financial stability.' }
    },
    {
      term: { et: 'RTS', en: 'RTS' },
      definition: { et: 'Regulatiivsed tehnilised standardid — ESA-de poolt koostatud detailsed reeglid DORA rakendamiseks.', en: 'Regulatory Technical Standards — detailed rules drafted by ESAs for implementing DORA requirements.' }
    },
    {
      term: { et: 'Kontsentratsioonirisk', en: 'Concentration Risk' },
      definition: { et: 'Risk, mis tuleneb liigsest sõltuvusest ühest IKT teenusepakkujast kriitiliste funktsioonide jaoks.', en: 'Risk arising from over-reliance on a single ICT service provider for critical or important functions.' }
    },
    {
      term: { et: 'Teabe register', en: 'Register of Information' },
      definition: { et: 'DORA artikli 28(3) kohustuslik register kõigist kolmandate osapoolte IKT lepingutest.', en: 'The mandatory register under DORA Art. 28(3) documenting all third-party ICT contractual arrangements.' }
    },
    {
      term: { et: 'ITS', en: 'ITS' },
      definition: { et: 'Rakenduslikud tehnilised standardid — ESA-de poolt koostatud standardvormid ja -mallid.', en: 'Implementing Technical Standards — standard forms and templates drafted by ESAs for DORA compliance.' }
    },
  ];

  articles: DoraArticle[] = [
    // Chapter I: General Provisions
    {
      number: '1',
      title: { et: 'Reguleerimisese', en: 'Subject Matter' },
      summary: {
        et: 'Kehtestab ühtsed nõuded finantsüksuste digitaalse tegevusliku vastupidavuse tagamiseks. Hõlmab IKT riskijuhtimist, intsidentide raporteerimist, vastupidavuse testimist ja kolmandate osapoolte riski haldust.',
        en: 'Establishes uniform requirements for ensuring the digital operational resilience of financial entities. Covers ICT risk management, incident reporting, resilience testing, and third-party risk management.'
      },
      keyPoints: {
        et: ['Kehtib kõigile EL finantsüksustele alates 17. jaanuarist 2025', 'Viis peamist sammast: riskijuhtimine, intsidendid, testimine, kolmandad osapooled, teabe jagamine', 'Proportsionaalsuse põhimõte: nõuded vastavad üksuse suurusele ja riskiprofiilile'],
        en: ['Applies to all EU financial entities from 17 January 2025', 'Five key pillars: risk management, incidents, testing, third parties, information sharing', 'Proportionality principle: requirements scale with entity size and risk profile']
      },
      severity: 'informational' as const,
      chapter: 'Chapter I',
      toolLink: '/assessment',
      toolName: { et: 'Alusta DORA enesehindamist kõigi sammaste kohta', en: 'Start DORA self-assessment across all pillars' }
    },
    {
      number: '2',
      title: { et: 'Kohaldamisala', en: 'Scope' },
      summary: {
        et: 'Määratleb, millised finantsüksused peavad DORA-t järgima: krediidiasutused, investeerimisühingud, kindlustusandjad, makseasutused, krüptovarade teenusepakkujad ja paljud teised.',
        en: 'Defines which financial entities must comply with DORA: credit institutions, investment firms, insurers, payment institutions, crypto-asset service providers, and many others.'
      },
      keyPoints: {
        et: ['21 kategooriat finantsüksusi on hõlmatud', 'Sisaldab ka krüptovarade teenusepakkujaid (MiCA)', 'Väiksematel üksustel on lihtsustatud nõuded', 'IKT teenusepakkujad kuuluvad järelevalveraamistiku alla'],
        en: ['21 categories of financial entities are covered', 'Includes crypto-asset service providers (MiCA)', 'Smaller entities have simplified requirements', 'ICT service providers fall under the oversight framework']
      },
      severity: 'informational' as const,
      chapter: 'Chapter I',
      toolLink: '/nis2/scope-check',
      toolName: { et: 'Kontrolli oma organisatsiooni kohaldumist', en: 'Check your organization\'s applicability' }
    },
    {
      number: '4',
      title: { et: 'Mõisted', en: 'Definitions' },
      summary: {
        et: 'Defineerib DORA peamised mõisted nagu "digitaalne tegevuslik vastupidavus", "IKT risk", "kriitiline funktsioon", "kolmanda osapoole IKT teenusepakkuja" jne.',
        en: 'Defines key DORA concepts such as "digital operational resilience", "ICT risk", "critical function", "third-party ICT service provider", and more.'
      },
      keyPoints: {
        et: ['Üle 40 ametliku definitsiooni', '"IKT risk" on lai mõiste, mis hõlmab küberohte ja süsteemitõrkeid', '"Kriitiline funktsioon" määrab kõrgendatud nõuded'],
        en: ['Over 40 official definitions', '"ICT risk" is broad — covers cyber threats and system failures', '"Critical function" triggers heightened requirements']
      },
      severity: 'informational' as const,
      chapter: 'Chapter I'
    },

    // Chapter II: ICT Risk Management
    {
      number: '5',
      title: { et: 'Juhtimis- ja kontrolliraamistik', en: 'Governance and Organisation' },
      summary: {
        et: 'Juhatus kannab lõplikku vastutust IKT riskijuhtimise eest. Peab kinnitama IKT riskijuhtimise raamistiku ja tagama piisavad ressursid.',
        en: 'The management body bears ultimate responsibility for ICT risk management. Must approve the ICT risk management framework and ensure adequate resources.'
      },
      keyPoints: {
        et: ['Juhatus peab kinnitama IKT riskijuhtimise strateegia', 'Piisav eelarve IKT turvalisusele ja koolitusele', 'Juhatuse liikmed peavad läbima IKT riskikoolituse', 'IKT riskijuhi roll peab olema määratud'],
        en: ['Board must approve ICT risk management strategy', 'Adequate budget for ICT security and training', 'Board members must undergo ICT risk training', 'ICT risk officer role must be assigned']
      },
      severity: 'critical' as const,
      chapter: 'Chapter II',
      toolLink: '/board-risk',
      toolName: { et: 'Kasuta juhatuse riskiaruandluse tööriista', en: 'Use the Board Risk Dashboard tool' }
    },
    {
      number: '6',
      title: { et: 'IKT riskijuhtimise raamistik', en: 'ICT Risk Management Framework' },
      summary: {
        et: 'Finantsüksused peavad kehtestama tervikliku IKT riskijuhtimise raamistiku, mis sisaldab strateegiaid, poliitikaid, protseduure ja tööriistu digitaalse vastupidavuse tagamiseks.',
        en: 'Financial entities must establish a comprehensive ICT risk management framework including strategies, policies, procedures, and tools to ensure digital resilience.'
      },
      keyPoints: {
        et: ['Dokumenteeritud IKT riskijuhtimise raamistik nõutud', 'Peab sisaldama tuvastamise, kaitse, avastamise, reageerimise ja taastamise meetmeid', 'Vähemalt kord aastas üle vaadata', 'Sõltumatu audit nõutud'],
        en: ['Documented ICT risk management framework required', 'Must include identification, protection, detection, response and recovery measures', 'Review at least annually', 'Independent audit required']
      },
      severity: 'critical' as const,
      chapter: 'Chapter II',
      toolLink: '/assessment',
      toolName: { et: 'Hinda oma IKT riskijuhtimise raamistikku', en: 'Assess your ICT risk management framework' }
    },
    {
      number: '8',
      title: { et: 'Tuvastamine', en: 'Identification' },
      summary: {
        et: 'Finantsüksused peavad tuvastama, klassifitseerima ja dokumenteerima kõik IKT varad, süsteemid, protsessid ja nende vastastikused sõltuvused.',
        en: 'Financial entities must identify, classify, and document all ICT assets, systems, processes, and their interdependencies.'
      },
      keyPoints: {
        et: ['Kõigi IKT varade ja süsteemide inventar', 'Kriitiliste funktsioonide tuvastamine ja kaardistamine', 'IKT varade vastastikuste sõltuvuste dokumenteerimine', 'Regulaarne ülevaatus ja uuendamine'],
        en: ['Inventory of all ICT assets and systems', 'Identification and mapping of critical functions', 'Documentation of ICT asset interdependencies', 'Regular review and update']
      },
      severity: 'critical' as const,
      chapter: 'Chapter II',
      toolLink: '/maturity',
      toolName: { et: 'Hinda oma IKT varade halduse küpsust', en: 'Assess your ICT asset management maturity' }
    },
    {
      number: '9',
      title: { et: 'Kaitse ja ennetamine', en: 'Protection and Prevention' },
      summary: {
        et: 'Nõuab IKT süsteemide kaitsemeetmete rakendamist: juurdepääsukontroll, krüpteerimine, võrguturve ja paikamine.',
        en: 'Requires implementation of ICT system protection measures: access control, encryption, network security, and patching.'
      },
      keyPoints: {
        et: ['Tugevad juurdepääsukontrolli poliitikad', 'Andmete krüpteerimine edastamisel ja salvestamisel', 'Regulaarne paikamine ja haavatavuste haldus', 'Võrgu segmenteerimine ja tulemüürid'],
        en: ['Strong access control policies', 'Data encryption in transit and at rest', 'Regular patching and vulnerability management', 'Network segmentation and firewalls']
      },
      severity: 'critical' as const,
      chapter: 'Chapter II'
    },
    {
      number: '11',
      title: { et: 'Reageerimis- ja taastamisplaanid', en: 'Response and Recovery Plans' },
      summary: {
        et: 'Finantsüksused peavad kehtestama IKT talitluspidevuse poliitika ja taastamisplaanid, mida testitakse regulaarselt.',
        en: 'Financial entities must establish ICT business continuity policy and recovery plans that are tested regularly.'
      },
      keyPoints: {
        et: ['IKT talitluspidevuse poliitika nõutud', 'Taastamisaja ja -punkti eesmärgid (RTO/RPO) määratud', 'Regulaarne testimine ja stsenaariumide harjutamine', 'Kriisikommunikatsiooni plaan'],
        en: ['ICT business continuity policy required', 'Recovery time and point objectives (RTO/RPO) defined', 'Regular testing and scenario exercises', 'Crisis communication plan']
      },
      severity: 'critical' as const,
      chapter: 'Chapter II',
      toolLink: '/incident-reporting',
      toolName: { et: 'Halda IKT intsidentide reageerimist', en: 'Manage ICT incident response' }
    },
    {
      number: '13',
      title: { et: 'Õppimine ja areng', en: 'Learning and Evolving' },
      summary: {
        et: 'Pärast IKT intsidente tuleb analüüsida juurpõhjuseid, dokumenteerida õppetunnid ja ajakohastada riskijuhtimise raamistikku.',
        en: 'After ICT incidents, root causes must be analyzed, lessons learned documented, and the risk management framework updated.'
      },
      keyPoints: {
        et: ['Intsidentijärgne analüüs kohustuslik', 'Juurpõhjuste analüüs ja dokumenteerimine', 'Raamistiku uuendamine õppetundide põhjal', 'Teabe jagamine tööstussektori tasandil'],
        en: ['Post-incident review mandatory', 'Root cause analysis and documentation', 'Update framework based on lessons learned', 'Industry-level information sharing']
      },
      severity: 'important' as const,
      chapter: 'Chapter II',
      toolLink: '/remediation',
      toolName: { et: 'Jälgi parandusmeetmeid', en: 'Track remediation actions' }
    },

    // Chapter III: ICT Incident Management
    {
      number: '17',
      title: { et: 'IKT intsidentide haldusprotsess', en: 'ICT Incident Management Process' },
      summary: {
        et: 'Finantsüksused peavad kehtestama IKT intsidentide haldusprotsessi intsidentide tuvastamiseks, haldamiseks ja teavitamiseks.',
        en: 'Financial entities must establish an ICT incident management process for detecting, managing, and notifying incidents.'
      },
      keyPoints: {
        et: ['Intsidentide klassifitseerimise ja eskaleerimise protseduurid', 'Varajase hoiatamise süsteemid', 'Dokumenteeritud rollijaotus intsidentide halduses', 'Intsidentide logide säilitamine'],
        en: ['Incident classification and escalation procedures', 'Early warning systems', 'Documented roles and responsibilities for incident management', 'Retention of incident logs']
      },
      severity: 'critical' as const,
      chapter: 'Chapter III',
      toolLink: '/incident-reporting',
      toolName: { et: 'Kasuta IKT intsidentide raporteerimise tööriista', en: 'Use the ICT Incident Reporting tool' }
    },
    {
      number: '18',
      title: { et: 'IKT intsidentide klassifitseerimine', en: 'Classification of ICT Incidents' },
      summary: {
        et: 'Määratleb kriteeriumid IKT intsidentide klassifitseerimiseks ja oluliste intsidentide eristamiseks tavapärastest.',
        en: 'Defines criteria for classifying ICT incidents and distinguishing major incidents from regular ones.'
      },
      keyPoints: {
        et: ['Seitse klassifitseerimiskriteeriumit: mõjutatud klientide arv, kestus, geograafiline ulatus jne', 'Oluline intsident käivitab kohustusliku teavitamise', 'Küberrünne eraldi kategooriana', 'Kriteeriumid peavad olema eelnevalt dokumenteeritud'],
        en: ['Seven classification criteria: affected clients, duration, geographic spread, etc.', 'Major incident triggers mandatory notification', 'Cyber attack as separate category', 'Criteria must be pre-documented']
      },
      severity: 'critical' as const,
      chapter: 'Chapter III',
      toolLink: '/incident-reporting',
      toolName: { et: 'Klassifitseeri intsidente automaatselt', en: 'Classify incidents automatically' }
    },
    {
      number: '19',
      title: { et: 'Oluliste IKT intsidentide raporteerimine', en: 'Reporting of Major ICT Incidents' },
      summary: {
        et: 'Kohustab finantsüksusi esitama pädevale asutusele alg-, vahe- ja lõpparuanded oluliste IKT intsidentide kohta kindlate tähtaegade jooksul.',
        en: 'Requires financial entities to submit initial, intermediate, and final reports on major ICT incidents to competent authorities within specified deadlines.'
      },
      keyPoints: {
        et: ['Algaanne 4 tunni jooksul pärast klassifitseerimist', 'Vahearuanne 72 tunni jooksul', 'Lõpparuanne 1 kuu jooksul', 'Standardvormid (ITS) raporteerimiseks'],
        en: ['Initial notification within 4 hours of classification', 'Intermediate report within 72 hours', 'Final report within 1 month', 'Standard forms (ITS) for reporting']
      },
      severity: 'critical' as const,
      chapter: 'Chapter III',
      toolLink: '/incident-reporting',
      toolName: { et: 'Halda intsidentide raporteerimise tähtaegu', en: 'Manage incident reporting deadlines' }
    },

    // Chapter IV: Resilience Testing
    {
      number: '24',
      title: { et: 'Digitaalse tegevusliku vastupidavuse testimise üldnõuded', en: 'General Requirements for Digital Operational Resilience Testing' },
      summary: {
        et: 'Finantsüksused peavad kehtestama vastupidavuse testimise programmi, mis sisaldab haavatavuste hindamist, penetratsiooniteste ja stsenaariumide testimist.',
        en: 'Financial entities must establish a resilience testing programme including vulnerability assessments, penetration tests, and scenario-based testing.'
      },
      keyPoints: {
        et: ['Testimisprogramm vastavalt suurusele ja riskiprofiilile', 'Haavatavuste skanneerimine ja hindamine', 'Võrgu turvalisuse testimine', 'Lähtekoodide ülevaatused, kui see on asjakohane'],
        en: ['Testing programme proportional to size and risk profile', 'Vulnerability scanning and assessment', 'Network security testing', 'Source code reviews where appropriate']
      },
      severity: 'important' as const,
      chapter: 'Chapter IV',
      toolLink: '/tlpt',
      toolName: { et: 'Halda TLPT teste DoraAudit TLPT mooduliga', en: 'Manage TLPT tests with DoraAudit TLPT module' }
    },
    {
      number: '26',
      title: { et: 'Ohuinfo-põhine läbistustestimine (TLPT)', en: 'Threat-Led Penetration Testing (TLPT)' },
      summary: {
        et: 'Olulised finantsüksused peavad läbi viima TLPT teste vähemalt iga kolme aasta tagant. Testid peavad katma kriitilisi funktsioone ja olema teostatud kvalifitseeritud testijate poolt.',
        en: 'Significant financial entities must conduct TLPT tests at least every three years. Tests must cover critical functions and be performed by qualified testers.'
      },
      keyPoints: {
        et: ['Kohustuslik olulistele finantsüksustele', 'Vähemalt iga 3 aasta tagant', 'Peab katma kriitilisi ja olulisi funktsioone', 'TIBER-EU raamistiku järgimine', 'Kvalifitseeritud ja sõltumatud testijad'],
        en: ['Mandatory for significant financial entities', 'At least every 3 years', 'Must cover critical and important functions', 'Follow TIBER-EU framework', 'Qualified and independent testers']
      },
      severity: 'critical' as const,
      chapter: 'Chapter IV',
      toolLink: '/tlpt',
      toolName: { et: 'Planeeri ja halda TLPT teste', en: 'Plan and manage TLPT tests' }
    },

    // Chapter V: Third-Party Risk
    {
      number: '28',
      title: { et: 'Kolmandate osapoolte IKT riski üldpõhimõtted', en: 'General Principles on Third-Party ICT Risk' },
      summary: {
        et: 'Finantsüksused jäävad täielikult vastutavaks kõigi kolmandate osapoolte IKT teenusepakkujate kasutamisest tulenevate kohustuste täitmise eest. Peavad pidama teabe registrit kõigist kolmandate osapoolte IKT lepingutest.',
        en: 'Financial entities remain fully responsible for compliance with all obligations arising from the use of third-party ICT service providers. Must maintain a register of information on all third-party ICT arrangements.'
      },
      keyPoints: {
        et: ['Täielik vastutus säilib ka allhanke korral', 'Teabe register (RoI) kõigist IKT lepingutest', 'Vähemalt kord aastas register pädevale asutusele esitada', 'Kontsentratsiooniriski jälgimine', 'Eelhinnang enne uue IKT teenusepakkuja kasutuselevõttu'],
        en: ['Full responsibility retained even when outsourcing', 'Register of Information (RoI) on all ICT arrangements', 'Submit register to competent authority at least annually', 'Monitor concentration risk', 'Pre-assessment before engaging new ICT providers']
      },
      severity: 'critical' as const,
      chapter: 'Chapter V',
      toolLink: '/roi',
      toolName: { et: 'Halda teabe registrit (RoI)', en: 'Manage your Register of Information (RoI)' }
    },
    {
      number: '29',
      title: { et: 'IKT riskikontsentratsiooni esialgne hindamine', en: 'Preliminary Assessment of ICT Concentration Risk' },
      summary: {
        et: 'Enne kolmanda osapoole IKT teenusepakkuja kasutuselevõttu tuleb hinnata kontsentratsiooniriski ja allhanke ahelaid.',
        en: 'Before engaging a third-party ICT provider, concentration risk and sub-outsourcing chains must be assessed.'
      },
      keyPoints: {
        et: ['Kontsentratsiooniriski hindamine enne lepingu sõlmimist', 'Allhanke ahelate kaardistamine', 'Alternatiivide kaalumine', 'Väljumisstrateegia planeerimine'],
        en: ['Concentration risk assessment before contracting', 'Map sub-outsourcing chains', 'Consider alternatives', 'Plan exit strategies']
      },
      severity: 'important' as const,
      chapter: 'Chapter V',
      toolLink: '/concentration-risk',
      toolName: { et: 'Analüüsi kontsentratsiooniriski', en: 'Analyze concentration risk' }
    },
    {
      number: '30',
      title: { et: 'Lepinguliste kokkulepete olulised sätted', en: 'Key Contractual Provisions' },
      summary: {
        et: 'Kõik IKT lepingud peavad sisaldama kohustuslikke klausleid: teenustaseme kokkulepped, auditõigused, andmekaitse, asukohanõuded, lõpetamise tingimused ja väljumisstrateegiad.',
        en: 'All ICT contracts must include mandatory clauses: service level agreements, audit rights, data protection, location requirements, termination conditions, and exit strategies.'
      },
      keyPoints: {
        et: ['Teenustaseme kokkulepped (SLA) koos trahvidega', 'Täielikud auditõigused ja juurdepääs', 'Andmete töötlemise asukoha läbipaistvus', 'Lõpetamise ja väljumise sätted', 'Allhanke piirangud ja teavituskohustus', 'Intsidentide teavitamise klauslid'],
        en: ['Service level agreements (SLA) with penalties', 'Full audit rights and access', 'Transparency on data processing locations', 'Termination and exit provisions', 'Sub-outsourcing restrictions and notification', 'Incident notification clauses']
      },
      severity: 'critical' as const,
      chapter: 'Chapter V',
      toolLink: '/contract-analysis',
      toolName: { et: 'Analüüsi lepingut Art. 30 nõuete vastu', en: 'Analyze contract against Art. 30 requirements' }
    },
    {
      number: '31',
      title: { et: 'Kriitiliste funktsioonide tugiteenuste järelevalve', en: 'Oversight of Critical Functions' },
      summary: {
        et: 'Kriitiliste funktsioonide toetamiseks kasutatavate IKT teenuste puhul kehtivad kõrgendatud nõuded lepingutele ja pidevale järelevalvele.',
        en: 'ICT services supporting critical functions are subject to heightened contractual requirements and ongoing oversight.'
      },
      keyPoints: {
        et: ['Kõrgendatud lepingutingimused kriitiliste funktsioonide jaoks', 'Pidev jõudluse ja riski jälgimine', 'Kohapealsete ja virtuaalsete auditide õigus', 'Tegevuse üleandmise plaan'],
        en: ['Enhanced contractual terms for critical functions', 'Ongoing performance and risk monitoring', 'Right to on-site and virtual audits', 'Transition plan requirements']
      },
      severity: 'important' as const,
      chapter: 'Chapter V',
      toolLink: '/contract-checklist',
      toolName: { et: 'Kontrolli lepingu vastavust kontroll-lehega', en: 'Check contract compliance with checklist' }
    },
    {
      number: '33',
      title: { et: 'Kriitiliste IKT teenusepakkujate määramine', en: 'Designation of Critical ICT Providers' },
      summary: {
        et: 'Euroopa järelevalveasutused (ESA-d) määravad kriitilised kolmandate osapoolte IKT teenusepakkujad, kes kuuluvad otsese järelevalve alla.',
        en: 'European Supervisory Authorities (ESAs) designate critical third-party ICT service providers subject to direct oversight.'
      },
      keyPoints: {
        et: ['ESA-d määravad kriitilised teenusepakkujad', 'Kriteeriumid: süsteemsus, asendatavus, sõltuvuste arv', 'Juhtiv järelevalveametnik igale kriitilisele teenusepakkujale', 'Järelevalvehindamine ja soovitused'],
        en: ['ESAs designate critical providers', 'Criteria: systemic importance, substitutability, number of dependencies', 'Lead overseer appointed for each critical provider', 'Oversight assessment and recommendations']
      },
      severity: 'important' as const,
      chapter: 'Chapter V',
      toolLink: '/vendors',
      toolName: { et: 'Sirvi IKT teenusepakkujate andmebaasi', en: 'Browse the ICT Provider Database' }
    },

    // Chapter VI: Information Sharing
    {
      number: '45',
      title: { et: 'Küberohuteabe jagamise kokkulepped', en: 'Cyber Threat Intelligence Sharing Arrangements' },
      summary: {
        et: 'Finantsüksused võivad omavahel vahetada küberohuinfot, sealhulgas taktikaid, tehnikaid, protseduure ja hoiatusi, tingimusel et see toimub usaldusväärses raamistikus.',
        en: 'Financial entities may exchange cyber threat intelligence among themselves, including tactics, techniques, procedures, and alerts, provided this occurs within a trusted framework.'
      },
      keyPoints: {
        et: ['Vabatahtlik, kuid soovitatav ohuteabe jagamine', 'Peab toimuma usaldusväärses raamistikus', 'Andmekaitse nõuded kehtivad', 'ISAC-id ja CERT-id kui jagamisplatvormid', 'Pädevatele asutustele teavitamine jagamiskokkulepetest'],
        en: ['Voluntary but encouraged threat intelligence sharing', 'Must occur within a trusted framework', 'Data protection requirements apply', 'ISACs and CERTs as sharing platforms', 'Notify competent authorities of sharing arrangements']
      },
      severity: 'informational' as const,
      chapter: 'Chapter VI',
      toolLink: '/info-sharing',
      toolName: { et: 'Halda teabe jagamise kokkuleppeid', en: 'Manage information sharing arrangements' }
    },

    // Chapter VII: Competent Authorities
    {
      number: '46',
      title: { et: 'Pädevad asutused', en: 'Competent Authorities' },
      summary: {
        et: 'Iga liikmesriik määrab pädeva asutuse, kes vastutab DORA järelevalve eest. Asutused teevad koostööd riiklikul ja EL tasandil.',
        en: 'Each Member State designates the competent authority responsible for DORA supervision. Authorities cooperate at national and EU level.'
      },
      keyPoints: {
        et: ['Riiklikud pädevad asutused määratud igale liikmesriigile', 'EL-ülene koostöö ESA-de kaudu', 'Järelevalve- ja uurimispädevused', 'Sanktsioonide määramise õigus'],
        en: ['National competent authorities designated per Member State', 'EU-wide cooperation through ESAs', 'Supervisory and investigatory powers', 'Right to impose sanctions']
      },
      severity: 'informational' as const,
      chapter: 'Chapter VII'
    },
    {
      number: '50',
      title: { et: 'Halduskaristused ja parandusmeetmed', en: 'Administrative Penalties and Remedial Measures' },
      summary: {
        et: 'Pädevad asutused saavad määrata halduskaristusi ja parandusmeetmeid DORA rikkumiste eest, sealhulgas trahve ja tegevuslube piiravaid meetmeid.',
        en: 'Competent authorities may impose administrative penalties and remedial measures for DORA violations, including fines and activity-restricting measures.'
      },
      keyPoints: {
        et: ['Rahalised trahvid kuni 2% aastakäibest (või 1% päevas kuni 6 kuud)', 'Tegevust piiravad meetmed', 'Avalik hoiatus ja tegevusloa tühistamine tõsistel juhtudel', 'Proportsionaalsuse põhimõte karistuste määramisel'],
        en: ['Financial penalties up to 2% of annual turnover (or 1% per day for up to 6 months)', 'Activity-restricting measures', 'Public censure and license revocation in severe cases', 'Proportionality principle in imposing penalties']
      },
      severity: 'important' as const,
      chapter: 'Chapter VII',
      toolLink: '/fine-calculator',
      toolName: { et: 'Arvuta võimalikke DORA trahve', en: 'Calculate potential DORA fines' }
    },
  ];

  get criticalCount(): number {
    return this.articles.filter(a => a.severity === 'critical').length;
  }

  get importantCount(): number {
    return this.articles.filter(a => a.severity === 'important').length;
  }

  get informationalCount(): number {
    return this.articles.filter(a => a.severity === 'informational').length;
  }

  constructor() {
    this.filteredArticles = [...this.articles];
  }

  onSearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredArticles = this.articles.filter(a => {
      // Severity filter
      if (this.filterSeverity && a.severity !== this.filterSeverity) return false;

      // Chapter filter
      if (this.selectedChapter && a.chapter !== this.selectedChapter) return false;

      // Text search
      if (!q) return true;
      const lang = this.lang.t('explorer.en') as 'et' | 'en';
      return (
        a.number.includes(q) ||
        a.title[lang].toLowerCase().includes(q) ||
        a.summary[lang].toLowerCase().includes(q) ||
        a.keyPoints[lang].some((kp: string) => kp.toLowerCase().includes(q)) ||
        a.chapter.toLowerCase().includes(q) ||
        ('art. ' + a.number).includes(q) ||
        ('article ' + a.number).includes(q) ||
        ('artikkel ' + a.number).includes(q)
      );
    });
  }

  selectChapter(chapterId: string | null): void {
    this.selectedChapter = chapterId;
    this.onSearch();
  }

  toggleArticle(articleNumber: string): void {
    if (this.expandedArticles.has(articleNumber)) {
      this.expandedArticles.delete(articleNumber);
    } else {
      this.expandedArticles.add(articleNumber);
    }
  }

  collapseAll(): void {
    this.expandedArticles.clear();
  }

  getVisibleChapters(): DoraChapter[] {
    if (this.selectedChapter) {
      return this.chapters.filter(ch => ch.id === this.selectedChapter);
    }
    return this.chapters.filter(ch =>
      this.filteredArticles.some(a => a.chapter === ch.id)
    );
  }

  getChapterArticles(chapterId: string): DoraArticle[] {
    return this.filteredArticles.filter(a => a.chapter === chapterId);
  }

  getSeverityBorder(severity: string): string {
    switch (severity) {
      case 'critical': return 'border-red-500/20';
      case 'important': return 'border-amber-500/20';
      default: return 'border-slate-700/50';
    }
  }

  getSeverityDot(severity: string): string {
    switch (severity) {
      case 'critical': return 'bg-red-500 shadow-red-500/50 shadow-sm';
      case 'important': return 'bg-amber-500 shadow-amber-500/50 shadow-sm';
      default: return 'bg-blue-500';
    }
  }

  getSeverityBadge(severity: string): string {
    switch (severity) {
      case 'critical': return 'bg-red-500/15 text-red-400';
      case 'important': return 'bg-amber-500/15 text-amber-400';
      default: return 'bg-blue-500/15 text-blue-400';
    }
  }

  getSeverityLabel(severity: string): string {
    const keyMap: Record<string, string> = {
      critical: 'explorer.severity_critical', important: 'explorer.severity_important'
    };
    return this.lang.t(keyMap[severity] || 'explorer.severity_informational');
  }
}

