import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LangService } from '../lang.service';

interface PillarInfo {
  id: string;
  icon: string;
  labelKey: string;
  articles: string;
  descEt: string;
  descEn: string;
  requirements: { et: string; en: string }[];
  links: { label: string; url: string }[];
}

@Component({
  selector: 'app-pillar-info',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-3xl mx-auto animate-fade-in-up" *ngIf="pillar">
      <!-- Back button -->
      <a routerLink="/" class="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors mb-8">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        {{ lang.t('pillar.back') }}
      </a>

      <!-- Header -->
      <div class="text-center mb-10">
        <div class="text-6xl mb-4">{{ pillar.icon }}</div>
        <h1 class="text-3xl font-bold text-white mb-2">{{ lang.t(pillar.labelKey) }}</h1>
        <p class="text-emerald-400 font-medium">{{ pillar.articles }}</p>
      </div>

      <!-- Description -->
      <div class="glass-card p-6 mb-6">
        <h2 class="text-sm font-semibold text-slate-300 mb-3">{{ lang.t('pillar.overview') }}</h2>
        <p class="text-slate-400 leading-relaxed">
          {{ lang.currentLang === 'et' ? pillar.descEt : pillar.descEn }}
        </p>
      </div>

      <!-- Key Requirements -->
      <div class="glass-card p-6 mb-6">
        <h2 class="text-sm font-semibold text-slate-300 mb-4">{{ lang.t('pillar.key_requirements') }}</h2>
        <ul class="space-y-3">
          <li *ngFor="let req of pillar.requirements" class="flex items-start gap-3">
            <svg class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-slate-400 text-sm">{{ lang.currentLang === 'et' ? req.et : req.en }}</span>
          </li>
        </ul>
      </div>

      <!-- Regulatory Links -->
      <div class="glass-card p-6 mb-8">
        <h2 class="text-sm font-semibold text-slate-300 mb-4">{{ lang.t('pillar.resources') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a *ngFor="let link of pillar.links" [href]="link.url" target="_blank" rel="noopener"
             class="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-emerald-500/30 transition-colors group">
            <span class="text-sm text-slate-300 group-hover:text-emerald-300">{{ link.label }}</span>
            <svg class="w-4 h-4 text-slate-600 group-hover:text-emerald-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- Context explanation -->
      <div class="glass-card p-6 mb-6 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
        <h3 class="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {{ lang.t('pillar.context_title') }}
        </h3>
        <p class="text-sm text-slate-400">
          {{ pillar.id === 'THIRD_PARTY' ? lang.t('pillar.context_third_party') : lang.t('pillar.context_other') }}
        </p>
      </div>

      <!-- CTA -->
      <div class="glass-card p-6 border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 text-center">
        <h3 class="text-lg font-semibold text-white mb-2">{{ lang.t('pillar.cta_title') }}</h3>
        <p class="text-sm text-slate-400 mb-4">{{ lang.t('pillar.cta_desc') }}</p>
        <a routerLink="/contract-analysis" [queryParams]="{sample: 'true'}"
           class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 hover:from-emerald-400 hover:to-cyan-400 transition-all">
          {{ lang.t('landing.cta_try_sample') }}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </a>
      </div>
    </div>

    <!-- Not found -->
    <div *ngIf="!pillar && !loading" class="text-center py-20">
      <p class="text-slate-400">{{ lang.t('pillar.not_found') }}</p>
      <a routerLink="/" class="text-emerald-400 hover:text-emerald-300 mt-4 inline-block">{{ lang.t('pillar.back') }}</a>
    </div>
  `
})
export class PillarInfoComponent implements OnInit {
  pillar: PillarInfo | null = null;
  loading = true;

  pillars: PillarInfo[] = [
    {
      id: 'ICT_RISK_MANAGEMENT',
      icon: '🛡️',
      labelKey: 'landing.pillar_risk',
      articles: 'Art. 5–16',
      descEt: 'IKT riskijuhtimise raamistik hõlmab riskide tuvastamist, hindamist ja maandamist. Finantsettevõtted peavad kehtestama tõhusa IKT riskijuhtimise süsteemi, mis tagab äritegevuse jätkuvuse ja andmete kaitse. See on DORA alustala, millele kõik teised sambad toetuvad.',
      descEn: 'The ICT risk management framework covers risk identification, assessment and mitigation. Financial entities must establish effective ICT risk management systems ensuring business continuity and data protection. This is the foundation of DORA on which all other pillars rest.',
      requirements: [
        { et: 'IKT riskijuhtimise raamistiku kehtestamine ja dokumenteerimine', en: 'Establish and document ICT risk management framework' },
        { et: 'Riskide regulaarne hindamine ja ülevaatamine', en: 'Regular risk assessment and review' },
        { et: 'Äritegevuse jätkuvuse plaan (BCP)', en: 'Business Continuity Plan (BCP)' },
        { et: 'Andmete varundamise ja taastamise protseduurid', en: 'Data backup and recovery procedures' },
        { et: 'IKT turvalisuse poliitikad ja protseduurid', en: 'ICT security policies and procedures' }
      ],
      links: [
        { label: 'EUR-Lex DORA Art. 5-16', url: 'https://eur-lex.europa.eu/legal-content/ET/TXT/?uri=CELEX:32022R2554' },
        { label: 'Finantsinspektsioon DORA', url: 'https://www.fi.ee/et/finantsinspektsioon/finantsinnovatsioon/dora' }
      ]
    },
    {
      id: 'INCIDENT_MANAGEMENT',
      icon: '📋',
      labelKey: 'landing.pillar_incident',
      articles: 'Art. 17–23',
      descEt: 'IKT intsidentide haldus nõuab intsidentide klassifitseerimist, jälgimist ja raporteerimist. Kriitilised intsidendid tuleb teavitada järelevalveasutustele kindlaksmääratud aja jooksul. Eesmärk on tagada kiire reageerimine ja õppida igast intsidendist.',
      descEn: 'ICT incident management requires incident classification, monitoring and reporting. Critical incidents must be reported to supervisory authorities within specified timeframes. The goal is to ensure rapid response and learn from each incident.',
      requirements: [
        { et: 'Intsidentide klassifitseerimise ja prioritiseerimise süsteem', en: 'Incident classification and prioritization system' },
        { et: 'Kriitiliste intsidentide teavitamine järelevalvele', en: 'Notification of critical incidents to supervisors' },
        { et: 'Intsidentide logide pidamine ja analüüs', en: 'Incident logging and analysis' },
        { et: 'Põhjuste analüüs (root cause analysis)', en: 'Root cause analysis' },
        { et: 'Intsidentidest õppimine ja protsesside parandamine', en: 'Learning from incidents and process improvement' }
      ],
      links: [
        { label: 'EUR-Lex DORA Art. 17-23', url: 'https://eur-lex.europa.eu/legal-content/ET/TXT/?uri=CELEX:32022R2554' },
        { label: 'ESA intsidentide raporteerimise juhend', url: 'https://www.eiopa.europa.eu/browse/regulation-and-policy/digital-operational-resilience-act-dora_en' }
      ]
    },
    {
      id: 'TESTING',
      icon: '🔍',
      labelKey: 'landing.pillar_testing',
      articles: 'Art. 24–27',
      descEt: 'Digitaalse vastupidavuse testimine hõlmab regulaarset testimist, sealhulgas läbistusteste kriitiliste süsteemide jaoks. Testimine peab toimuma vähemalt kord aastas ja tulemused dokumenteeritakse.',
      descEn: 'Digital resilience testing includes regular testing, including penetration tests for critical systems. Testing must occur at least annually and results must be documented.',
      requirements: [
        { et: 'Haavatavuse skaneerimised ja hindamised', en: 'Vulnerability scans and assessments' },
        { et: 'Läbistustestid (penetration testing)', en: 'Penetration testing' },
        { et: 'Stsenaariumipõhised testid', en: 'Scenario-based testing' },
        { et: 'Testimistulemuste dokumenteerimine', en: 'Documentation of test results' },
        { et: 'Leitud puuduste kõrvaldamine', en: 'Remediation of identified gaps' }
      ],
      links: [
        { label: 'EUR-Lex DORA Art. 24-27', url: 'https://eur-lex.europa.eu/legal-content/ET/TXT/?uri=CELEX:32022R2554' },
        { label: 'TLPT (Threat-Led Penetration Testing)', url: 'https://www.ecb.europa.eu/paym/cyber-resilience/tiber-eu/html/index.en.html' }
      ]
    },
    {
      id: 'THIRD_PARTY',
      icon: '🤝',
      labelKey: 'landing.pillar_thirdparty',
      articles: 'Art. 28–44',
      descEt: 'Kolmandate osapoolte riskijuhtimine reguleerib IKT-teenuste sisseostmist. Art. 30 sätestab kohustuslikud lepingutingimused IKT-teenuse pakkujatega. See on meie tööriista põhifookus - aitame kontrollida lepingute vastavust.',
      descEn: 'Third-party risk management regulates ICT service outsourcing. Art. 30 establishes mandatory contractual provisions with ICT service providers. This is the main focus of our tool - we help verify contract compliance.',
      requirements: [
        { et: 'IKT kolmandate osapoolte register', en: 'ICT third-party provider register' },
        { et: 'Lepingutingimused vastavalt Art. 30', en: 'Contractual provisions per Art. 30' },
        { et: 'Teenusepakkujate riskihindamine', en: 'Provider risk assessment' },
        { et: 'Väljumisstrateegia (exit strategy)', en: 'Exit strategy' },
        { et: 'Allhankijate juhtimine', en: 'Subcontractor management' }
      ],
      links: [
        { label: 'EUR-Lex DORA Art. 28-44', url: 'https://eur-lex.europa.eu/legal-content/ET/TXT/?uri=CELEX:32022R2554' },
        { label: 'Art. 30 nõuete kontrollnimekiri', url: '/contract-analysis' }
      ]
    },
    {
      id: 'INFORMATION_SHARING',
      icon: '📡',
      labelKey: 'landing.pillar_info',
      articles: 'Art. 45',
      descEt: 'Teabe jagamine sätestab küberohtude ja haavatavuste alase teabe jagamise finantsettevõtete vahel. See soodustab kollektiivset kaitset ja võimaldab kiiremini reageerida uutele ohtudele.',
      descEn: 'Information sharing establishes sharing of cyber threat and vulnerability information between financial entities. This promotes collective defense and enables faster response to emerging threats.',
      requirements: [
        { et: 'Küberohtude teabe jagamise võimekus', en: 'Cyber threat intelligence sharing capability' },
        { et: 'Osalemine teabevahetuse võrgustikes', en: 'Participation in information sharing networks' },
        { et: 'Konfidentsiaalsuse tagamine teabe jagamisel', en: 'Ensuring confidentiality in information sharing' },
        { et: 'Ohuteabe analüüs ja kasutamine', en: 'Threat intelligence analysis and utilization' }
      ],
      links: [
        { label: 'EUR-Lex DORA Art. 45', url: 'https://eur-lex.europa.eu/legal-content/ET/TXT/?uri=CELEX:32022R2554' },
        { label: 'FS-ISAC (Financial Services ISAC)', url: 'https://www.fsisac.com/' }
      ]
    }
  ];

  constructor(private route: ActivatedRoute, public lang: LangService) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      this.pillar = this.pillars.find(p => p.id === id) || null;
      this.loading = false;
    });
  }
}
