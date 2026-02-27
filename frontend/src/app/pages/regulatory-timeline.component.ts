import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';

interface TimelineEvent {
  id: string;
  date: Date;
  title: string;
  titleEt: string;
  description: string;
  descriptionEt: string;
  type: 'deadline' | 'milestone' | 'update' | 'enforcement';
  regulation: 'DORA' | 'NIS2' | 'RTS' | 'ITS';
  status: 'past' | 'upcoming' | 'critical';
  link?: string;
}

@Component({
  selector: 'app-regulatory-timeline',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h1 class="text-3xl font-bold text-white mb-2">
          {{ lang.currentLang === 'et' ? 'Regulatiivne ajakava' : 'Regulatory Timeline' }}
        </h1>
        <p class="text-slate-400">
          {{ lang.currentLang === 'et' ? 'DORA ja NIS2 olulised t&auml;htajad ja verstapostid' : 'Key DORA and NIS2 deadlines and milestones' }}
        </p>
      </div>

      <!-- Countdown Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let countdown of countdowns"
             class="bg-gradient-to-br rounded-2xl p-6 border animate-fade-in"
             [class]="countdown.urgent
               ? 'from-red-900/30 to-slate-800/50 border-red-500/30'
               : countdown.soon
                 ? 'from-amber-900/20 to-slate-800/50 border-amber-500/30'
                 : 'from-slate-800/50 to-slate-800/30 border-slate-700/50'">
          <div class="flex items-start justify-between mb-4">
            <span [class]="'text-xs font-bold px-2 py-1 rounded-full ' + getRegulationClass(countdown.regulation)">
              {{ countdown.regulation }}
            </span>
            <span *ngIf="countdown.urgent" class="flex items-center gap-1 text-xs text-red-400">
              <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              {{ lang.currentLang === 'et' ? 'Kriitiline' : 'Critical' }}
            </span>
          </div>
          <h3 class="text-lg font-semibold text-white mb-2">
            {{ lang.currentLang === 'et' ? countdown.titleEt : countdown.title }}
          </h3>
          <p class="text-sm text-slate-400 mb-4">
            {{ lang.currentLang === 'et' ? countdown.descriptionEt : countdown.description }}
          </p>
          <div class="flex items-end justify-between">
            <div>
              <p class="text-xs text-slate-500 mb-1">{{ countdown.date | date:'dd.MM.yyyy' }}</p>
              <div class="flex items-baseline gap-1">
                <span class="text-3xl font-bold" [class]="countdown.urgent ? 'text-red-400' : countdown.soon ? 'text-amber-400' : 'text-emerald-400'">
                  {{ countdown.daysLeft }}
                </span>
                <span class="text-sm text-slate-500">{{ lang.currentLang === 'et' ? 'p&auml;eva' : 'days' }}</span>
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs text-slate-500">{{ countdown.hoursLeft }}h {{ countdown.minutesLeft }}m</div>
            </div>
          </div>
          <!-- Progress bar to deadline -->
          <div class="mt-4 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500"
                 [class]="countdown.urgent ? 'bg-red-500' : countdown.soon ? 'bg-amber-500' : 'bg-emerald-500'"
                 [style.width.%]="countdown.progress">
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
        <h2 class="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          {{ lang.currentLang === 'et' ? 'T&auml;ielik ajakava' : 'Complete Timeline' }}
        </h2>

        <!-- Filter buttons -->
        <div class="flex flex-wrap gap-2 mb-6">
          <button type="button" (click)="filterRegulation = 'ALL'" [class]="filterClass('ALL')">
            {{ lang.currentLang === 'et' ? 'K&otilde;ik' : 'All' }}
          </button>
          <button type="button" (click)="filterRegulation = 'DORA'" [class]="filterClass('DORA')">DORA</button>
          <button type="button" (click)="filterRegulation = 'NIS2'" [class]="filterClass('NIS2')">NIS2</button>
          <button type="button" (click)="filterRegulation = 'RTS'" [class]="filterClass('RTS')">RTS/ITS</button>
        </div>

        <!-- Timeline items -->
        <div class="relative">
          <!-- Vertical line -->
          <div class="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-cyan-500 to-slate-700"></div>

          <div *ngFor="let event of filteredEvents; let i = index"
               class="relative pl-12 pb-8 last:pb-0 animate-fade-in-up"
               [style.animation-delay]="(i * 50) + 'ms'">
            <!-- Timeline dot -->
            <div class="absolute left-[11px] top-1 w-[18px] h-[18px] rounded-full flex items-center justify-center"
                 [class]="event.status === 'past'
                   ? 'bg-slate-700 border-2 border-slate-600'
                   : event.status === 'critical'
                     ? 'bg-red-500/20 border-2 border-red-400'
                     : 'bg-emerald-500/20 border-2 border-emerald-400'">
              <div class="w-2 h-2 rounded-full"
                   [class]="event.status === 'past' ? 'bg-slate-500' : event.status === 'critical' ? 'bg-red-400' : 'bg-emerald-400'">
              </div>
            </div>

            <!-- Event card -->
            <div class="bg-slate-800/50 border rounded-xl p-4 transition-all hover:border-slate-600/50"
                 [class]="event.status === 'past' ? 'border-slate-700/30 opacity-60' : 'border-slate-700/50'">
              <div class="flex items-start justify-between gap-4 mb-2">
                <div class="flex items-center gap-2 flex-wrap">
                  <span [class]="'text-xs font-bold px-2 py-0.5 rounded-full ' + getRegulationClass(event.regulation)">
                    {{ event.regulation }}
                  </span>
                  <span [class]="'text-xs px-2 py-0.5 rounded-full ' + getTypeClass(event.type)">
                    {{ getTypeLabel(event.type) }}
                  </span>
                </div>
                <span class="text-xs text-slate-500 whitespace-nowrap">{{ event.date | date:'dd.MM.yyyy' }}</span>
              </div>
              <h3 class="text-sm font-semibold text-white mb-1">
                {{ lang.currentLang === 'et' ? event.titleEt : event.title }}
              </h3>
              <p class="text-xs text-slate-400">
                {{ lang.currentLang === 'et' ? event.descriptionEt : event.description }}
              </p>
              <a *ngIf="event.link" [href]="event.link" target="_blank" rel="noopener"
                 class="inline-flex items-center gap-1 mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                {{ lang.currentLang === 'et' ? 'Loe rohkem' : 'Learn more' }}
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick links -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href="https://eur-lex.europa.eu/legal-content/ET/TXT/?uri=CELEX:32022R2554" target="_blank" rel="noopener"
           class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-emerald-500/30 transition-all group">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">DORA {{ lang.currentLang === 'et' ? 'T&auml;istekst' : 'Full Text' }}</p>
              <p class="text-xs text-slate-500">EUR-Lex</p>
            </div>
          </div>
        </a>
        <a href="https://eur-lex.europa.eu/legal-content/ET/TXT/?uri=CELEX:32022L2555" target="_blank" rel="noopener"
           class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-blue-500/30 transition-all group">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">NIS2 {{ lang.currentLang === 'et' ? 'Direktiiv' : 'Directive' }}</p>
              <p class="text-xs text-slate-500">EUR-Lex</p>
            </div>
          </div>
        </a>
        <a routerLink="/regulatory-updates"
           class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-amber-500/30 transition-all group">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">{{ lang.currentLang === 'et' ? 'V&auml;rsked uuendused' : 'Latest Updates' }}</p>
              <p class="text-xs text-slate-500">{{ lang.currentLang === 'et' ? 'Regulatiivsed muudatused' : 'Regulatory changes' }}</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  `
})
export class RegulatoryTimelineComponent implements OnInit, OnDestroy {
  events: TimelineEvent[] = [];
  countdowns: any[] = [];
  filterRegulation = 'ALL';
  private intervalId: any;
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor(public lang: LangService) {}

  ngOnInit() {
    this.initializeEvents();
    this.calculateCountdowns();
    // Update countdowns every minute (browser only — setInterval blocks SSR stability)
    if (this.isBrowser) {
      this.intervalId = setInterval(() => this.calculateCountdowns(), 60000);
    }
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  initializeEvents() {
    const now = new Date();

    this.events = [
      // Past events
      {
        id: '1',
        date: new Date('2022-12-27'),
        title: 'DORA Published in Official Journal',
        titleEt: 'DORA avaldatud Euroopa Liidu Teatajas',
        description: 'Regulation (EU) 2022/2554 officially published.',
        descriptionEt: 'M\u00e4\u00e4rus (EL) 2022/2554 ametlikult avaldatud.',
        type: 'milestone',
        regulation: 'DORA',
        status: 'past'
      },
      {
        id: '2',
        date: new Date('2023-01-16'),
        title: 'DORA Entry into Force',
        titleEt: 'DORA j\u00f5ustumine',
        description: 'DORA regulation entered into force, starting the 24-month implementation period.',
        descriptionEt: 'DORA m\u00e4\u00e4rus j\u00f5ustus, alustades 24-kuulist rakendusperioodi.',
        type: 'enforcement',
        regulation: 'DORA',
        status: 'past'
      },
      {
        id: '3',
        date: new Date('2024-01-17'),
        title: 'First RTS/ITS Batch Published',
        titleEt: 'Esimene RTS/ITS pakett avaldatud',
        description: 'First batch of regulatory and implementing technical standards published by ESAs.',
        descriptionEt: 'Esimene regulatiivsete ja rakendusstandardite pakett ESA-de poolt avaldatud.',
        type: 'milestone',
        regulation: 'RTS',
        status: 'past'
      },
      {
        id: '4',
        date: new Date('2024-07-17'),
        title: 'Second RTS/ITS Batch Published',
        titleEt: 'Teine RTS/ITS pakett avaldatud',
        description: 'Second batch including ICT third-party risk management standards.',
        descriptionEt: 'Teine pakett, sealhulgas IKT kolmandate osapoolte riskijuhtimise standardid.',
        type: 'milestone',
        regulation: 'RTS',
        status: 'past'
      },
      {
        id: '5',
        date: new Date('2024-10-17'),
        title: 'NIS2 National Transposition Deadline',
        titleEt: 'NIS2 riigisisese \u00fclevotmise t\u00e4htaeg',
        description: 'Deadline for EU member states to transpose NIS2 into national law.',
        descriptionEt: 'T\u00e4htaeg EL liikmesriikidel NIS2 riigisisesesse \u00f5igusesse \u00fcle v\u00f5tta.',
        type: 'deadline',
        regulation: 'NIS2',
        status: 'past'
      },
      {
        id: '6',
        date: new Date('2025-01-17'),
        title: 'DORA Full Application',
        titleEt: 'DORA t\u00e4ielik kohaldamine',
        description: 'DORA becomes fully applicable. All financial entities must comply.',
        descriptionEt: 'DORA muutub t\u00e4ielikult kohaldatavaks. K\u00f5ik finantsettev\u00f5tjad peavad n\u00f5udeid t\u00e4itma.',
        type: 'enforcement',
        regulation: 'DORA',
        status: 'past',
        link: 'https://www.eiopa.europa.eu/browse/regulation-and-policy/digital-operational-resilience-act-dora_en'
      },
      // Upcoming events
      {
        id: '7',
        date: new Date('2025-04-30'),
        title: 'Register of ICT Third-Party Providers',
        titleEt: 'IKT kolmandate osapoolte teenusepakkujate register',
        description: 'Deadline for submitting information to the register of ICT third-party service providers.',
        descriptionEt: 'T\u00e4htaeg IKT kolmandate osapoolte teenusepakkujate registrisse teabe esitamiseks.',
        type: 'deadline',
        regulation: 'DORA',
        status: this.getEventStatus(new Date('2025-04-30'))
      },
      {
        id: '8',
        date: new Date('2025-06-30'),
        title: 'First TLPT Reports Due',
        titleEt: 'Esimesed TLPT aruanded',
        description: 'First Threat-Led Penetration Testing reports due for significant entities.',
        descriptionEt: 'Esimesed ohup\u00f5hise l\u00e4bistustestimise aruanded oluliste \u00fcksuste jaoks.',
        type: 'deadline',
        regulation: 'DORA',
        status: this.getEventStatus(new Date('2025-06-30'))
      },
      {
        id: '9',
        date: new Date('2025-12-31'),
        title: 'Legacy Contract Review Deadline',
        titleEt: 'Vanade lepingute \u00fclevaatuse t\u00e4htaeg',
        description: 'Deadline for reviewing and updating existing ICT third-party contracts.',
        descriptionEt: 'T\u00e4htaeg olemasolevate IKT kolmandate osapoolte lepingute \u00fclevaatamiseks ja uuendamiseks.',
        type: 'deadline',
        regulation: 'DORA',
        status: this.getEventStatus(new Date('2025-12-31'))
      },
      {
        id: '10',
        date: new Date('2026-01-17'),
        title: 'First Annual DORA Compliance Report',
        titleEt: 'Esimene iga-aastane DORA vastavusaruanne',
        description: 'First annual report on ICT risk management framework to competent authorities.',
        descriptionEt: 'Esimene iga-aastane aruanne IKT riskijuhtimise raamistiku kohta p\u00e4devatele asutustele.',
        type: 'deadline',
        regulation: 'DORA',
        status: this.getEventStatus(new Date('2026-01-17'))
      },
      {
        id: '11',
        date: new Date('2026-04-17'),
        title: 'Critical ICT Provider Designation',
        titleEt: 'Kriitiliste IKT teenusepakkujate m\u00e4\u00e4ramine',
        description: 'ESAs to designate critical ICT third-party service providers subject to oversight.',
        descriptionEt: 'ESA-d m\u00e4\u00e4ravad kriitilised IKT kolmandate osapoolte teenusepakkujad, kes kuuluvad j\u00e4relevalve alla.',
        type: 'milestone',
        regulation: 'DORA',
        status: this.getEventStatus(new Date('2026-04-17'))
      },
      {
        id: '12',
        date: new Date('2027-01-17'),
        title: 'DORA Review Report',
        titleEt: 'DORA \u00fclevaatamisaruanne',
        description: 'European Commission to submit report on DORA implementation and potential amendments.',
        descriptionEt: 'Euroopa Komisjon esitab aruande DORA rakendamise ja v\u00f5imalike muudatuste kohta.',
        type: 'milestone',
        regulation: 'DORA',
        status: this.getEventStatus(new Date('2027-01-17'))
      }
    ];

    // Sort by date
    this.events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  getEventStatus(date: Date): 'past' | 'upcoming' | 'critical' {
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'past';
    if (diffDays <= 90) return 'critical';
    return 'upcoming';
  }

  calculateCountdowns() {
    const now = new Date();

    // Key upcoming deadlines for countdown cards
    const keyDeadlines = this.events
      .filter(e => e.status !== 'past' && e.type === 'deadline')
      .slice(0, 3);

    this.countdowns = keyDeadlines.map(event => {
      const diff = event.date.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      // Calculate progress (assume 1 year lead time for visualization)
      const totalDays = 365;
      const progress = Math.max(0, Math.min(100, ((totalDays - days) / totalDays) * 100));

      return {
        ...event,
        daysLeft: Math.max(0, days),
        hoursLeft: Math.max(0, hours),
        minutesLeft: Math.max(0, minutes),
        urgent: days <= 30,
        soon: days <= 90,
        progress
      };
    });
  }

  get filteredEvents(): TimelineEvent[] {
    if (this.filterRegulation === 'ALL') return this.events;
    if (this.filterRegulation === 'RTS') {
      return this.events.filter(e => e.regulation === 'RTS' || e.regulation === 'ITS');
    }
    return this.events.filter(e => e.regulation === this.filterRegulation);
  }

  filterClass(filter: string): string {
    const base = 'px-3 py-1.5 rounded-lg text-xs font-medium transition-all';
    return filter === this.filterRegulation
      ? base + ' bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
      : base + ' bg-slate-700/30 text-slate-400 border border-slate-600/30 hover:text-white';
  }

  getRegulationClass(regulation: string): string {
    switch (regulation) {
      case 'DORA': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'NIS2': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'RTS':
      case 'ITS': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'deadline': return 'bg-red-500/10 text-red-400';
      case 'enforcement': return 'bg-amber-500/10 text-amber-400';
      case 'milestone': return 'bg-cyan-500/10 text-cyan-400';
      case 'update': return 'bg-slate-500/10 text-slate-400';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  }

  getTypeLabel(type: string): string {
    const et = this.lang.currentLang === 'et';
    switch (type) {
      case 'deadline': return et ? 'T\u00e4htaeg' : 'Deadline';
      case 'enforcement': return et ? 'J\u00f5ustumine' : 'Enforcement';
      case 'milestone': return et ? 'Verstapost' : 'Milestone';
      case 'update': return et ? 'Uuendus' : 'Update';
      default: return type;
    }
  }
}
