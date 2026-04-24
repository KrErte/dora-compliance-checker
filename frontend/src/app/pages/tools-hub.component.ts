import { Component, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';

interface ToolCard {
  icon: string;
  titleEt: string;
  titleEn: string;
  descEt: string;
  descEn: string;
  link: string;
  essential?: boolean;
}

interface ToolCategory {
  titleEt: string;
  titleEn: string;
  icon: string;
  color: string;
  tools: ToolCard[];
}

@Component({
  selector: 'app-tools-hub',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-6xl mx-auto">
      <div class="mb-6 animate-fade-in-up">
        <h1 class="text-3xl font-bold mb-2">
          <span class="gradient-text">{{ showAll() ? lang.t('tools.all_tools_count') : lang.t('tools.essential') }}</span>
        </h1>
        <p class="text-slate-400 text-sm max-w-2xl">
          {{ showAll()
            ? lang.l('Avasta k\u00f5ik DORA vastavuse t\u00f6\u00f6riistad \u00fchest kohast. Vali kategooria ja alusta.', 'Discover all DORA compliance tools in one place. Pick a category and get started.')
            : lang.l('Alusta siit \u2014 need 5 t\u00f6\u00f6riista katavad DORA vastavuse tuuma.', 'Start here \u2014 these 5 tools cover the core of DORA compliance.') }}
        </p>
      </div>

      <!-- Essential / All toggle tabs -->
      <div class="flex items-center gap-1 mb-8 animate-fade-in-up">
        <button type="button" (click)="setShowAll(false)"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                [class]="!showAll() ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'">
          {{ lang.t('tools.essential') }}
        </button>
        <button type="button" (click)="setShowAll(true)"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                [class]="showAll() ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'">
          {{ lang.t('tools.all_tools_count') }} ({{ totalToolCount }})
        </button>
      </div>

      @for (cat of visibleCategories(); track cat.titleEn) {
        <div class="mb-10 animate-fade-in-up">
          <div class="flex items-center gap-2.5 mb-4">
            <span class="text-xl">{{ cat.icon }}</span>
            <h2 class="text-lg font-semibold text-white">{{ lang.l(cat.titleEt, cat.titleEn) }}</h2>
            <span class="text-xs text-slate-500 ml-1">{{ cat.tools.length }}</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            @for (tool of cat.tools; track tool.link) {
              <a [routerLink]="tool.link"
                 class="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600/50
                        rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-black/10 hover:-translate-y-0.5">
                <div class="flex items-start gap-3">
                  <span class="text-lg shrink-0 mt-0.5">{{ tool.icon }}</span>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors truncate">
                      {{ lang.l(tool.titleEt, tool.titleEn) }}
                    </p>
                    <p class="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                      {{ lang.l(tool.descEt, tool.descEn) }}
                    </p>
                  </div>
                </div>
              </a>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class ToolsHubComponent {
  lang = inject(LangService);
  private platformId = inject(PLATFORM_ID);

  showAll = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.showAll.set(localStorage.getItem('tools_hub_show_all') === 'true');
    }
  }

  setShowAll(val: boolean) {
    this.showAll.set(val);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('tools_hub_show_all', String(val));
    }
  }

  visibleCategories = computed(() => {
    if (this.showAll()) return this.categories;
    // Filter to only categories that have essential tools, and within those only essential tools
    return this.categories
      .map(cat => ({ ...cat, tools: cat.tools.filter(t => t.essential) }))
      .filter(cat => cat.tools.length > 0);
  });

  get totalToolCount(): number {
    return this.categories.reduce((sum, cat) => sum + cat.tools.length, 0);
  }

  categories: ToolCategory[] = [
    {
      titleEt: 'P\u00f5hivastavus', titleEn: 'Core Compliance', icon: '\u{1F3AF}', color: 'emerald',
      tools: [
        { icon: '\u{1F4CB}', titleEt: 'DORA hindamine', titleEn: 'DORA Assessment', descEt: 'T\u00e4ishindamine 37 k\u00fcsimusega', descEn: 'Full assessment with 37 questions', link: '/assessment', essential: true },
        { icon: '\u{1F4C4}', titleEt: 'Lepingu anal\u00fc\u00fcs', titleEn: 'Contract Analysis', descEt: 'AI-p\u00f5hine DORA Art. 30 anal\u00fc\u00fcs', descEn: 'AI-powered DORA Art. 30 analysis', link: '/contract-analysis', essential: true },
        { icon: '\u{1F4DA}', titleEt: 'DORA Explorer', titleEn: 'DORA Explorer', descEt: 'Interaktiivne regulatsiooni sirvija', descEn: 'Interactive regulation browser', link: '/dora-explorer' },
        { icon: '\u2696\uFE0F', titleEt: 'Proportsionaalsus', titleEn: 'Proportionality', descEt: 'DORA Art. 4 proportsionaalsuse hindamine', descEn: 'DORA Art. 4 proportionality assessment', link: '/proportionality' },
      ]
    },
    {
      titleEt: 'AI t\u00f6\u00f6riistad', titleEn: 'AI Tools', icon: '\u{1F916}', color: 'violet',
      tools: [
        { icon: '\u{1F4AC}', titleEt: 'DoraBot', titleEn: 'DoraBot', descEt: 'AI assistent DORA k\u00fcsimustele', descEn: 'AI assistant for DORA questions', link: '/chat', essential: true },
        { icon: '\u{1F52E}', titleEt: 'Autopilot', titleEn: 'Autopilot', descEt: 'AI-p\u00f5hine vastavuse autopiloot', descEn: 'AI-powered compliance autopilot', link: '/autopilot' },
        { icon: '\u{1F4DD}', titleEt: 'AI poliitika kirjutaja', titleEn: 'AI Policy Writer', descEt: 'Genereeri ettev\u00f5ttespetsiifilisi poliitikaid', descEn: 'Generate company-specific policies', link: '/ai-policy-writer' },
        { icon: '\u270D\uFE0F', titleEt: 'Klausli \u00fcmberkirjutaja', titleEn: 'Clause Rewriter', descEt: 'AI-p\u00f5hine lepinguklauslite parandamine', descEn: 'AI-powered contract clause fixing', link: '/clause-rewriter' },
      ]
    },
    {
      titleEt: 'Monitooring ja hoiatused', titleEn: 'Monitoring & Alerts', icon: '\u{1F514}', color: 'amber',
      tools: [
        { icon: '\u{1F6E1}\uFE0F', titleEt: 'Auditiks valmisolek', titleEn: 'Audit Readiness', descEt: 'Reaalajas auditiks valmiduse skoor', descEn: 'Real-time audit readiness score', link: '/audit-readiness' },
        { icon: '\u26A0\uFE0F', titleEt: 'Regulatiivsed hoiatused', titleEn: 'Regulatory Alerts', descEt: 'Personaalsed vastavushoiatused', descEn: 'Personalized compliance alerts', link: '/alerts' },
        { icon: '\u{1F4E1}', titleEt: 'Regulatiivne radar', titleEn: 'Regulatory Radar', descEt: 'Regulatiivse muutuste j\u00e4lgimine', descEn: 'Live regulatory change feed', link: '/regulatory-radar' },
        { icon: '\u{1F50D}', titleEt: 'Kolmanda osapoole monitor', titleEn: 'Third-Party Monitor', descEt: 'Tarnijate riski monitooring', descEn: 'Vendor risk monitoring dashboard', link: '/third-party-monitor' },
        { icon: '\u{1F4C8}', titleEt: 'Vastavuse prognoos', titleEn: 'Compliance Forecast', descEt: 'Vastavuse aegumise ennustamine', descEn: 'Predict compliance decay over time', link: '/compliance-forecast' },
        { icon: '\u{1F4F1}', titleEt: 'Teavituskeskus', titleEn: 'Notification Center', descEt: 'K\u00f5ik teavitused \u00fches kohas', descEn: 'All notifications in one place', link: '/notifications' },
      ]
    },
    {
      titleEt: 'Anal\u00fc\u00fcs ja testimine', titleEn: 'Analysis & Testing', icon: '\u{1F9EA}', color: 'cyan',
      tools: [
        { icon: '\u{1F525}', titleEt: 'Riski soojuskaart', titleEn: 'Risk Heatmap', descEt: 'Visuaalne riskide kaardistus', descEn: 'Visual risk mapping by pillar', link: '/risk-heatmap' },
        { icon: '\u{1F4CA}', titleEt: 'K\u00fcpsusmudel', titleEn: 'Maturity Model', descEt: 'Vastavuse k\u00fcpsuse hindamine 0-5', descEn: 'Compliance maturity assessment 0-5', link: '/maturity' },
        { icon: '\u{1F50E}', titleEt: 'Kontsentratsiooni risk', titleEn: 'Concentration Risk', descEt: 'IKT teenusepakkujate kontsentratsioonianalüüs', descEn: 'ICT provider concentration analysis', link: '/concentration-risk' },
        { icon: '\u{1F3AE}', titleEt: 'Stressitest', titleEn: 'Stress Test', descEt: '5-minutiline kriisisimulaator', descEn: '5-minute crisis simulator', link: '/stress-test' },
        { icon: '\u26A1', titleEt: 'Doominoefekt', titleEn: 'Chain Reaction', descEt: 'Vastavuse kaskaadefektide simulatsioon', descEn: 'Compliance cascade effect simulation', link: '/chain-reaction' },
        { icon: '\u{1F52C}', titleEt: 'Vastavuse lahkamine', titleEn: 'Compliance Autopsy', descEt: 'Kohtumeditsiiniline algp\u00f5hjuste anal\u00fc\u00fcs', descEn: 'Forensic root cause analysis', link: '/autopsy' },
      ]
    },
    {
      titleEt: 'T\u00f5endid ja aruanded', titleEn: 'Evidence & Reports', icon: '\u{1F4C2}', color: 'indigo',
      tools: [
        { icon: '\u{1F4E6}', titleEt: 'T\u00f5endite hoidla', titleEn: 'Evidence Vault', descEt: 'T\u00f5endite \u00fcleslaadimine ja haldamine', descEn: 'Upload and manage compliance evidence', link: '/evidence-vault', essential: true },
        { icon: '\u{1F50D}', titleEt: 'T\u00f5endite puuduste anal\u00fc\u00fcs', titleEn: 'Evidence Gap Analyzer', descEt: 'AI-p\u00f5hine t\u00f5endite puuduste tuvastamine', descEn: 'AI-powered evidence gap detection', link: '/evidence-gap-analyzer' },
        { icon: '\u{1F4E5}', titleEt: 'T\u00f5endite koguja', titleEn: 'Evidence Harvester', descEt: 'Automaatne t\u00f5endite kogumine Jira, GitHub jm', descEn: 'Auto-harvest from Jira, GitHub etc', link: '/evidence-harvester' },
        { icon: '\u{1F4D1}', titleEt: 'Juhatuse raport', titleEn: 'Board Report', descEt: 'Professionaalne raport juhatusele', descEn: 'Professional board compliance report', link: '/board-report', essential: true },
        { icon: '\u{1F4C5}', titleEt: 'Ajastatud aruanded', titleEn: 'Scheduled Reports', descEt: 'Automaatsed perioodilised raportid', descEn: 'Automated periodic reports', link: '/scheduled-reports' },
        { icon: '\u{1F3AC}', titleEt: 'Juhatuse esitlus', titleEn: 'Board Presentation', descEt: 'Kinemaatiline t\u00e4isekraan esitlus', descEn: 'Cinematic fullscreen presentation', link: '/board-presentation' },
      ]
    },
    {
      titleEt: 'Intsidentide haldus', titleEn: 'Incident Management', icon: '\u{1F6A8}', color: 'red',
      tools: [
        { icon: '\u{1F4CB}', titleEt: 'Intsidentidest teavitamine', titleEn: 'Incident Reporting', descEt: 'DORA Art. 19 intsidendi t\u00f6\u00f6voog', descEn: 'DORA Art. 19 incident workflow', link: '/incident-reporting' },
        { icon: '\u{1F333}', titleEt: 'Intsidendi klassifikaator', titleEn: 'Incident Classifier', descEt: 'Interaktiivne otsustuspuu', descEn: 'Interactive decision tree', link: '/incident-decision-tree' },
        { icon: '\u{1F3AF}', titleEt: 'Intsidendi s\u00f5jaruum', titleEn: 'Incident War Room', descEt: 'Reaalajas intsidendi halduskeskus', descEn: 'Real-time incident command center', link: '/war-room' },
      ]
    },
    {
      titleEt: 'Juhtimine', titleEn: 'Governance', icon: '\u{1F3DB}\uFE0F', color: 'sky',
      tools: [
        { icon: '\u{1F4C4}', titleEt: 'Artiklite j\u00e4lgimine', titleEn: 'Article Tracker', descEt: 'Artikli-kaupa DORA vastavuse j\u00e4lgimine', descEn: 'Article-by-article DORA tracking', link: '/article-tracker' },
        { icon: '\u{1F5FA}\uFE0F', titleEt: 'IKT varade kaart', titleEn: 'ICT Asset Map', descEt: 'DORA Art. 8 varade inventuur', descEn: 'DORA Art. 8 asset inventory', link: '/ict-asset-map' },
        { icon: '\u{1F4CA}', titleEt: 'Teaberegister', titleEn: 'Register of Information', descEt: 'DORA Art. 28(3) teaberegister', descEn: 'DORA Art. 28(3) register', link: '/roi' },
        { icon: '\u{1F91D}', titleEt: 'Tarnija k\u00fcsimustikud', titleEn: 'Vendor Questionnaires', descEt: 'DORA enesehindamise k\u00fcsimustikud tarnijatele', descEn: 'Self-assessment questionnaires for vendors', link: '/vendor-questionnaires' },
        { icon: '\u{1F3E2}', titleEt: 'Regulaatori portaal', titleEn: 'Regulator Portal', descEt: 'Turvaline portaal regulaatoritele', descEn: 'Secure portal for regulators', link: '/regulator-portal' },
      ]
    },
    {
      titleEt: 'NIS2', titleEn: 'NIS2', icon: '\u{1F6E1}\uFE0F', color: 'orange',
      tools: [
        { icon: '\u2705', titleEt: 'NIS2 ulatuse kontroll', titleEn: 'NIS2 Scope Check', descEt: 'Kontrolli kas NIS2 kohaldub sulle', descEn: 'Check if NIS2 applies to you', link: '/nis2/scope-check' },
        { icon: '\u{1F4CB}', titleEt: 'NIS2 hindamine', titleEn: 'NIS2 Assessment', descEt: 'Terviklik NIS2 vastavushindamine', descEn: 'Comprehensive NIS2 assessment', link: '/nis2/assessment' },
      ]
    },
    {
      titleEt: '\u00d5ppimine', titleEn: 'Learning', icon: '\u{1F393}', color: 'pink',
      tools: [
        { icon: '\u{1F4DD}', titleEt: 'Koolitustest', titleEn: 'Training Quiz', descEt: 'Interaktiivne DORA koolitustest', descEn: 'Interactive DORA training quiz', link: '/training-quiz' },
        { icon: '\u{1F3AD}', titleEt: 'Eksami simulaator', titleEn: 'Exam Simulator', descEt: 'AI-p\u00f5hine regulatiivne eksam', descEn: 'AI-powered regulatory examination', link: '/exam-simulator' },
        { icon: '\u2696\uFE0F', titleEt: 'AI prokur\u00f6r', titleEn: 'AI Prosecutor', descEt: 'AI regulaator k\u00fcsitleb sind', descEn: 'AI regulator interrogates you', link: '/prosecutor' },
        { icon: '\u{1F5FA}\uFE0F', titleEt: 'Raamistike kaardistus', titleEn: 'Framework Mapping', descEt: 'DORA vs ISO 27001, NIS2, GDPR', descEn: 'DORA vs ISO 27001, NIS2, GDPR', link: '/framework-mapping' },
      ]
    },
  ];
}
