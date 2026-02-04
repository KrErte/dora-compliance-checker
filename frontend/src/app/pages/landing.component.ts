import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LangService } from '../lang.service';
import { timer, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface DoraRequirement {
  id: string;
  name: string;
  description: string;
  checked: boolean;
  expanded: boolean;
}

interface Stat {
  value: number;
  suffix: string;
  label: string;
  current: number;
}

@Component({
  selector: 'app-landing',
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <!-- Hero section -->
    <div class="relative overflow-hidden animate-fade-in">
      <div class="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>

      <div class="relative flex flex-col items-center justify-center min-h-[70vh] text-center z-10">
        <h1 class="text-4xl md:text-6xl font-extrabold mb-6 animate-slide-in">
          <span class="gradient-text">DORA Art. 30</span>
          <br/>
          <span class="text-slate-100">{{ lang.t('landing.subtitle') }}</span>
        </h1>

        <p class="text-lg text-slate-400 max-w-xl mb-10 leading-relaxed animate-slide-in delay-100">
          {{ lang.t('landing.hero_desc') }}
        </p>

        <!-- CTA buttons -->
        <div class="flex flex-col sm:flex-row gap-4 animate-slide-in delay-200">
          <a routerLink="/contract-analysis" [queryParams]="{sample: 'true'}"
             class="cta-button group inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400
                    text-slate-900 font-semibold px-8 py-3.5 rounded-xl text-lg
                    hover:shadow-lg hover:shadow-emerald-500/25">
            {{ lang.t('landing.cta_try_sample') }}
            <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </a>
          <a routerLink="/contract-generator"
             class="cta-button group inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400
                    text-white font-semibold px-8 py-3.5 rounded-xl text-lg
                    hover:shadow-lg hover:shadow-violet-500/25">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            {{ lang.t('landing.cta_generate') }}
          </a>
        </div>

        <!-- Secondary CTA -->
        <div class="mt-4">
          <a routerLink="/assessment"
             class="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors text-sm hover-underline">
            {{ lang.t('landing.cta_assessment') }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </div>
    </div>

    <!-- Stats Counter Section -->
    <div class="py-12 max-w-4xl mx-auto px-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div *ngFor="let stat of stats; let i = index"
             class="stat-card text-center p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-teal-500/30 transition-all duration-300"
             [style.animation-delay]="i * 100 + 'ms'">
          <div class="text-4xl mb-2">{{ stat.icon }}</div>
          <div class="text-4xl font-bold text-teal-400 mb-1 tabular-nums">{{ stat.current }}{{ stat.suffix }}</div>
          <div class="text-slate-400 text-sm">{{ lang.t(stat.labelKey) }}</div>
        </div>
      </div>
    </div>

    <!-- File Upload Preview -->
    <div class="py-8 max-w-2xl mx-auto px-4">
      <div class="upload-zone border-2 border-dashed border-slate-600 hover:border-teal-500/50 rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 hover:bg-slate-800/30"
           (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)" (drop)="onDrop($event)"
           [class.drag-over]="isDragging">
        <div class="text-4xl mb-4">📄</div>
        <p class="text-slate-300 font-medium mb-2">{{ lang.t('landing.upload_drag') }}</p>
        <p class="text-slate-500 text-sm mb-4">{{ lang.t('landing.upload_click') }}</p>
        <div class="flex justify-center gap-4 text-xs text-slate-600">
          <span>Max 10MB</span>
          <span>•</span>
          <span>PDF, DOCX</span>
        </div>
      </div>
    </div>

    <!-- Interactive DORA Requirements Table -->
    <div class="py-16 max-w-4xl mx-auto px-4">
      <div class="text-center mb-10">
        <p class="text-xs font-medium text-teal-400 uppercase tracking-wider mb-2">{{ lang.t('landing.interactive_label') }}</p>
        <h2 class="text-2xl font-bold text-slate-100">{{ lang.t('landing.interactive_title') }}</h2>
        <p class="text-slate-500 text-sm mt-2">{{ lang.t('landing.interactive_desc') }}</p>
      </div>

      <div class="requirements-table rounded-xl overflow-hidden border border-slate-700/50">
        <table class="w-full">
          <thead class="bg-slate-800/80">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-12">{{ lang.t('landing.table_check') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{{ lang.t('landing.table_requirement') }}</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider w-20">{{ lang.t('landing.table_status') }}</th>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngFor="let req of requirements; let i = index">
              <tr class="requirement-row border-t border-slate-700/50 cursor-pointer hover:bg-slate-800/50 transition-colors"
                  (click)="toggleRequirement(req)" [class.expanded]="req.expanded">
                <td class="px-4 py-4">
                  <input type="checkbox" [(ngModel)]="req.checked" (click)="$event.stopPropagation()"
                         class="w-5 h-5 rounded border-slate-600 bg-slate-700 text-teal-500 focus:ring-teal-500 cursor-pointer">
                </td>
                <td class="px-4 py-4">
                  <span class="text-slate-200 font-medium">{{ req.name }}</span>
                </td>
                <td class="px-4 py-4 text-right">
                  <span *ngIf="req.checked" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-500/20 text-teal-400">
                    {{ lang.t('landing.table_ok') }}
                  </span>
                  <span *ngIf="!req.checked" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
                    {{ lang.t('landing.table_missing') }}
                  </span>
                </td>
              </tr>
              <tr *ngIf="req.expanded" class="bg-slate-800/30">
                <td colspan="3" class="px-4 py-4">
                  <div class="text-sm text-slate-400 pl-9">
                    <p class="mb-2">{{ req.description }}</p>
                    <a routerLink="/contract-analysis" class="text-teal-400 hover:text-teal-300 text-xs font-medium">
                      → {{ lang.t('landing.table_check_contract') }}
                    </a>
                  </div>
                </td>
              </tr>
            </ng-container>
          </tbody>
        </table>
      </div>

      <div class="mt-4 text-center">
        <p class="text-slate-500 text-sm">
          {{ lang.t('landing.table_checked') }}: <span class="text-teal-400 font-medium">{{ checkedCount }}</span> / {{ requirements.length }}
        </p>
      </div>
    </div>

    <!-- Process steps -->
    <div class="py-16">
      <div class="text-center mb-10">
        <h2 class="text-2xl font-bold text-slate-100">{{ lang.t('landing.steps_title') }}</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto px-4">
        <div *ngFor="let step of steps; let i = index"
             class="glass-card p-6 text-left relative step-card"
             [style.animation-delay]="i * 150 + 'ms'">
          <div class="absolute -top-3 -right-3 text-6xl font-extrabold text-slate-700/20">{{ i + 1 }}</div>
          <div class="relative z-10">
            <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold mb-3">{{ i + 1 }}</div>
            <h3 class="font-semibold text-slate-200 mb-1">{{ lang.t(step.titleKey) }}</h3>
            <p class="text-sm text-slate-500">{{ lang.t(step.descKey) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- DORA 5 Pillars -->
    <div class="py-16">
      <div class="text-center mb-10">
        <p class="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-2">{{ lang.t('landing.pillars_label') }}</p>
        <h2 class="text-2xl font-bold text-slate-100">{{ lang.t('landing.pillars_title') }}</h2>
        <p class="text-slate-500 text-sm mt-2">{{ lang.t('landing.pillars_desc') }}</p>
      </div>

      <p class="text-center text-xs text-slate-500 mb-4">{{ lang.t('landing.pillars_hint') }}</p>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto px-4">
        <a *ngFor="let pillar of pillars" [routerLink]="'/pillar/' + pillar.id"
           [title]="lang.t('landing.pillar_tooltip')"
           class="glass-card p-4 text-center group hover:border-emerald-500/30 transition-all duration-300 cursor-pointer">
          <div class="text-3xl mb-2">{{ pillar.icon }}</div>
          <h3 class="text-sm font-medium text-slate-300 group-hover:text-emerald-300 transition-colors">{{ lang.t(pillar.labelKey) }}</h3>
          <p class="text-xs text-slate-600 mt-1">{{ pillar.articles }}</p>
          <span *ngIf="pillar.id === 'THIRD_PARTY'" class="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400">
            {{ lang.t('landing.active') }}
          </span>
        </a>
      </div>
    </div>

    <!-- Testimonials -->
    <div class="py-16 bg-slate-900/50">
      <div class="max-w-4xl mx-auto px-4">
        <div class="text-center mb-10">
          <p class="text-xs font-medium text-teal-400 uppercase tracking-wider mb-2">{{ lang.t('landing.reviews_label') }}</p>
          <h2 class="text-2xl font-bold text-slate-100">{{ lang.t('landing.reviews_title') }}</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div *ngFor="let testimonial of testimonials" class="testimonial-card p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-teal-500/20 transition-all duration-300">
            <div class="text-2xl mb-4 text-teal-400">{{ testimonial.stars }}</div>
            <p class="text-slate-300 mb-4 italic">"{{ lang.t(testimonial.textKey) }}"</p>
            <div>
              <p class="text-slate-300 text-sm font-semibold">{{ lang.t(testimonial.authorKey) }}</p>
              <p class="text-slate-500 text-xs">{{ lang.t(testimonial.roleKey) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Scope clarification -->
    <div class="py-12">
      <div class="max-w-2xl mx-auto glass-card p-6">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">{{ lang.t('landing.scope_title') }}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-emerald-400 font-medium mb-2">{{ lang.t('landing.scope_does') }}</p>
            <ul class="text-slate-400 space-y-1">
              <li>• {{ lang.t('landing.scope_does_1') }}</li>
              <li>• {{ lang.t('landing.scope_does_2') }}</li>
              <li>• {{ lang.t('landing.scope_does_3') }}</li>
            </ul>
          </div>
          <div>
            <p class="text-slate-500 font-medium mb-2">{{ lang.t('landing.scope_not') }}</p>
            <ul class="text-slate-500 space-y-1">
              <li>• {{ lang.t('landing.scope_not_1') }}</li>
              <li>• {{ lang.t('landing.scope_not_2') }}</li>
              <li>• {{ lang.t('landing.scope_not_3') }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Trust Badges -->
    <div class="py-8">
      <div class="max-w-2xl mx-auto px-4">
        <div class="grid grid-cols-3 gap-4 text-center">
          <div *ngFor="let badge of trustBadges" class="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-800/30">
            <span class="text-2xl">{{ badge.icon }}</span>
            <span class="text-xs text-slate-500 font-medium">{{ badge.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Contact Form -->
    <div id="contact" class="py-16 bg-slate-900/50">
      <div class="max-w-lg mx-auto px-4">
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-slate-100 mb-2">{{ lang.t('landing.contact_title') }}</h2>
          <p class="text-slate-400 text-sm">{{ lang.t('landing.contact_subtitle') }}</p>
        </div>

        <form (submit)="submitContact($event)" class="glass-card p-6">
          <div class="flex flex-col gap-4">
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5">{{ lang.t('auth.full_name') }}</label>
              <input type="text" [(ngModel)]="contactName" name="name"
                     class="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                     [placeholder]="lang.currentLang === 'et' ? 'Teie nimi' : 'Your name'">
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5">{{ lang.t('auth.email') }}</label>
              <input type="email" [(ngModel)]="contactEmail" name="email" [placeholder]="lang.t('landing.contact_email_placeholder')"
                     [class]="'w-full px-4 py-3 rounded-xl bg-slate-800 border text-slate-200 placeholder-slate-500 focus:outline-none transition-colors ' +
                              (contactError ? 'border-red-500 focus:border-red-400' : 'border-slate-700 focus:border-teal-500')"
                     required>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5">{{ lang.currentLang === 'et' ? 'Sõnum' : 'Message' }}</label>
              <textarea [(ngModel)]="contactMessage" name="message" rows="3"
                        class="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors resize-none"
                        [placeholder]="lang.currentLang === 'et' ? 'Kirjeldage oma vajadust...' : 'Describe your needs...'"></textarea>
            </div>
            <button type="submit"
                    class="cta-button w-full px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-900 font-semibold">
              {{ lang.t('landing.contact_btn') }}
            </button>
            <p *ngIf="contactError" class="text-red-400 text-sm text-center animate-fade-in">
              {{ lang.t('landing.contact_error') }}
            </p>
          </div>
        </form>

        <p *ngIf="contactSubmitted" class="mt-4 text-teal-400 text-sm text-center animate-fade-in">
          {{ lang.t('landing.contact_success') }}
        </p>
      </div>
    </div>

    <!-- Final CTA -->
    <div class="py-16 text-center">
      <h2 class="text-2xl font-bold text-slate-100 mb-4">{{ lang.t('landing.final_cta_title') }}</h2>
      <p class="text-slate-400 mb-8 max-w-lg mx-auto">{{ lang.t('landing.final_cta_desc') }}</p>
      <a routerLink="/contract-analysis"
         class="cta-button inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400
                text-slate-900 font-semibold px-10 py-4 rounded-xl text-lg
                hover:shadow-xl hover:shadow-emerald-500/30">
        {{ lang.t('landing.cta_check') }}
      </a>
    </div>
  `,
  styles: [`
    .cta-button {
      transition: all 0.3s ease;
    }

    .hover-underline {
      position: relative;
    }
    .hover-underline::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 0;
      height: 1px;
      background: currentColor;
      transition: width 0.3s ease;
    }
    .hover-underline:hover::after {
      width: 100%;
    }

    .stat-card {
      animation: fadeInUp 0.6s ease-out both;
    }

    .upload-zone.drag-over {
      border-color: #14b8a6;
      background: rgba(20, 184, 166, 0.1);
    }

    .requirements-table {
      background: rgba(30, 41, 59, 0.5);
    }

    .requirement-row.expanded {
      background: rgba(30, 41, 59, 0.8);
    }

    .step-card {
      animation: slideInUp 0.6s ease-out both;
    }

    .testimonial-card {
      transition: transform 0.3s ease;
    }
    .testimonial-card:hover {
      transform: translateY(-4px);
    }

    .tabular-nums {
      font-variant-numeric: tabular-nums;
    }

    .animate-fade-in {
      animation: fadeIn 0.8s ease-out both;
    }

    .animate-slide-in {
      animation: slideIn 0.6s ease-out both;
    }

    .delay-100 { animation-delay: 100ms; }
    .delay-200 { animation-delay: 200ms; }
    .delay-300 { animation-delay: 300ms; }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class LandingComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  steps = [
    { titleKey: 'landing.step1_title', descKey: 'landing.step1_desc' },
    { titleKey: 'landing.step2_title', descKey: 'landing.step2_desc' },
    { titleKey: 'landing.step3_title', descKey: 'landing.step3_desc' }
  ];

  pillars = [
    { id: 'ICT_RISK_MANAGEMENT', icon: '🛡️', labelKey: 'landing.pillar_risk', articles: 'Art. 5–16' },
    { id: 'INCIDENT_MANAGEMENT', icon: '📋', labelKey: 'landing.pillar_incident', articles: 'Art. 17–23' },
    { id: 'TESTING', icon: '🔍', labelKey: 'landing.pillar_testing', articles: 'Art. 24–27' },
    { id: 'THIRD_PARTY', icon: '🤝', labelKey: 'landing.pillar_thirdparty', articles: 'Art. 28–44' },
    { id: 'INFORMATION_SHARING', icon: '📡', labelKey: 'landing.pillar_info', articles: 'Art. 45' }
  ];

  stats: (Stat & { icon: string; labelKey: string })[] = [
    { value: 2500, suffix: '+', label: '', labelKey: 'landing.stat_contracts', current: 0, icon: '📄' },
    { value: 500, suffix: '+', label: '', labelKey: 'landing.stat_orgs', current: 0, icon: '📊' },
    { value: 98, suffix: '%', label: '', labelKey: 'landing.stat_satisfaction', current: 0, icon: '⭐' }
  ];

  requirements: DoraRequirement[] = [
    { id: '1', name: 'Teenuse kirjeldus ja kvaliteedinõuded', description: 'Leping peab sisaldama selget teenuse kirjeldust, sh funktsionaalsust, jõudlusnõudeid ja kvaliteedistandardeid.', checked: true, expanded: false },
    { id: '2', name: 'SLA määratlused', description: 'Teenustaseme kokkulepped peavad sisaldama mõõdetavaid KPI-sid, reageerimisaegu ja kättesaadavuse garantiisid.', checked: true, expanded: false },
    { id: '3', name: 'Andmete asukoht ja töötlemine', description: 'Leping peab määratlema andmete geograafilise asukoha ja töötlemise tingimused.', checked: false, expanded: false },
    { id: '4', name: 'Auditeerimisõigused', description: 'Finantsasutusel peab olema õigus teostada auditeid ja saada juurdepääs teenuseosutaja dokumentatsioonile.', checked: false, expanded: false },
    { id: '5', name: 'Alltöövõtjate kasutamine', description: 'Alltöövõtjate kasutamise tingimused ja piirangud peavad olema selgelt määratletud.', checked: true, expanded: false },
    { id: '6', name: 'Intsidentidest teavitamine', description: 'Leping peab sisaldama kohustust teavitada turvaintsidentidest ja nende lahendamise protseduure.', checked: false, expanded: false },
    { id: '7', name: 'Lepingu lõpetamise tingimused', description: 'Väljumisstrateegiad ja andmete tagastamise protseduurid peavad olema dokumenteeritud.', checked: true, expanded: false },
    { id: '8', name: 'Talitluspidevuse tagamine', description: 'Äriprotsesside jätkusuutlikkuse ja taastekavade nõuded peavad olema kaetud.', checked: false, expanded: false }
  ];

  testimonials = [
    { stars: '⭐⭐⭐⭐⭐', textKey: 'landing.testimonial1_text', authorKey: 'landing.testimonial1_author', roleKey: 'landing.testimonial1_role' },
    { stars: '⭐⭐⭐⭐⭐', textKey: 'landing.testimonial2_text', authorKey: 'landing.testimonial2_author', roleKey: 'landing.testimonial2_role' },
    { stars: '⭐⭐⭐⭐⭐', textKey: 'landing.testimonial3_text', authorKey: 'landing.testimonial3_author', roleKey: 'landing.testimonial3_role' }
  ];

  trustBadges = [
    { icon: '🔒', text: 'GDPR Compliant' },
    { icon: '🏅', text: 'ISO 27001 Compatible' },
    { icon: '✔️', text: 'EU Standardiga' }
  ];

  isDragging = false;
  contactName = '';
  contactEmail = '';
  contactMessage = '';
  contactSubmitted = false;
  contactError = false;

  constructor(public lang: LangService) {}

  ngOnInit(): void {
    this.animateStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  animateStats(): void {
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;

    this.stats.forEach((stat, index) => {
      timer(index * 150, stepDuration)
        .pipe(takeUntil(this.destroy$))
        .subscribe((step) => {
          if (step < steps) {
            const progress = this.easeOutQuad(step / steps);
            stat.current = Math.floor(stat.value * progress);
          } else {
            stat.current = stat.value;
          }
        });
    });
  }

  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  get checkedCount(): number {
    return this.requirements.filter(r => r.checked).length;
  }

  toggleRequirement(req: DoraRequirement): void {
    req.expanded = !req.expanded;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  submitContact(event: Event): void {
    event.preventDefault();
    this.contactError = false;
    this.contactSubmitted = false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.contactEmail || !emailRegex.test(this.contactEmail)) {
      this.contactError = true;
      setTimeout(() => this.contactError = false, 5000);
      return;
    }

    // Save to localStorage (in real app would send to backend)
    const contacts = JSON.parse(localStorage.getItem('dora_contacts') || '[]');
    contacts.push({ name: this.contactName, email: this.contactEmail, message: this.contactMessage, date: new Date().toISOString() });
    localStorage.setItem('dora_contacts', JSON.stringify(contacts));

    this.contactSubmitted = true;
    this.contactEmail = '';
    this.contactName = '';
    this.contactMessage = '';
    setTimeout(() => this.contactSubmitted = false, 5000);
  }
}
