import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto animate-fade-in-up">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-3xl font-bold gradient-text mb-2">{{ lang.t('about.title') }}</h1>
        <p class="text-slate-400">{{ lang.t('about.subtitle') }}</p>
      </div>

      <!-- Mission -->
      <div class="glass-card p-6 mb-6 border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5">
        <h2 class="text-lg font-semibold text-emerald-400 mb-3">{{ lang.t('about.mission_title') }}</h2>
        <p class="text-slate-400 text-sm leading-relaxed">{{ lang.t('about.mission_desc') }}</p>
      </div>

      <!-- Why -->
      <div class="glass-card p-6 mb-8">
        <h2 class="text-lg font-semibold text-slate-200 mb-4">{{ lang.t('about.why_title') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div *ngFor="let i of [1,2,3,4]"
               class="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50">
            <svg class="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
            <p class="text-sm text-slate-400">{{ lang.t('about.why_' + i) }}</p>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="glass-card p-4 text-center">
          <div class="text-2xl font-bold text-emerald-400">8</div>
          <div class="text-xs text-slate-500 mt-1">{{ lang.t('about.stat_requirements') }}</div>
        </div>
        <div class="glass-card p-4 text-center">
          <div class="text-2xl font-bold text-cyan-400">&lt;5 min</div>
          <div class="text-xs text-slate-500 mt-1">{{ lang.t('about.stat_analysis') }}</div>
        </div>
        <div class="glass-card p-4 text-center">
          <div class="text-2xl font-bold text-violet-400">2%</div>
          <div class="text-xs text-slate-500 mt-1">{{ lang.t('about.stat_penalty') }}</div>
        </div>
        <div class="glass-card p-4 text-center">
          <div class="text-2xl font-bold text-amber-400">2</div>
          <div class="text-xs text-slate-500 mt-1">{{ lang.t('about.stat_regulations') }}</div>
        </div>
      </div>

      <!-- Team -->
      <div class="mb-8">
        <div class="text-center mb-6">
          <h2 class="text-xl font-bold text-slate-200">{{ lang.t('about.team_title') }}</h2>
          <p class="text-sm text-slate-500 mt-1">{{ lang.t('about.team_desc') }}</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div *ngFor="let member of team"
               class="glass-card p-5 flex items-start gap-4 card-hover">
            <div [class]="'w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shrink-0 ' + member.bgClass">
              {{ member.initials }}
            </div>
            <div>
              <h3 class="text-sm font-semibold text-slate-200">{{ member.name }}</h3>
              <p class="text-xs text-emerald-400 mb-1.5">{{ lang.t(member.roleKey) }}</p>
              <p class="text-xs text-slate-500 leading-relaxed">{{ lang.t(member.bioKey) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Technology -->
      <div class="glass-card p-6 mb-8">
        <h2 class="text-lg font-semibold text-slate-200 mb-2">{{ lang.t('about.tech_title') }}</h2>
        <p class="text-sm text-slate-500 mb-4">{{ lang.t('about.tech_desc') }}</p>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div *ngFor="let t of techFeatures"
               class="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
            <span class="text-lg">{{ t.icon }}</span>
            <span class="text-xs text-slate-400">{{ lang.t(t.key) }}</span>
          </div>
        </div>
      </div>

      <!-- Contact CTA -->
      <div class="glass-card p-6 mb-6 text-center border-emerald-500/20">
        <h2 class="text-lg font-semibold text-slate-200 mb-2">{{ lang.t('about.contact_title') }}</h2>
        <p class="text-sm text-slate-500 mb-4">{{ lang.t('about.contact_desc') }}</p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="mailto:info@doraaudit.eu"
             class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium
                    bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900
                    hover:from-emerald-400 hover:to-cyan-400 hover:shadow-lg hover:shadow-emerald-500/25 transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            {{ lang.t('about.contact_email') }}
          </a>
          <a routerLink="/pricing"
             class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium
                    bg-slate-700/50 text-slate-300 border border-slate-600/50
                    hover:bg-slate-600/50 hover:text-emerald-400 hover:border-emerald-500/30 transition-all">
            {{ lang.t('nav.pricing') }}
          </a>
        </div>
      </div>
    </div>
  `
})
export class AboutComponent {
  team = [
    { name: 'Kristjan Eerik', initials: 'KE', roleKey: 'about.role_ceo', bioKey: 'about.bio_ceo', bgClass: 'bg-emerald-500/20 text-emerald-400' },
    { name: 'Martin Tamm', initials: 'MT', roleKey: 'about.role_cto', bioKey: 'about.bio_cto', bgClass: 'bg-cyan-500/20 text-cyan-400' },
    { name: 'Kadri Saar', initials: 'KS', roleKey: 'about.role_compliance', bioKey: 'about.bio_compliance', bgClass: 'bg-violet-500/20 text-violet-400' },
    { name: 'Priit Valk', initials: 'PV', roleKey: 'about.role_legal', bioKey: 'about.bio_legal', bgClass: 'bg-amber-500/20 text-amber-400' }
  ];

  techFeatures = [
    { icon: '🇪🇺', key: 'about.tech_1' },
    { icon: '🔐', key: 'about.tech_2' },
    { icon: '✅', key: 'about.tech_3' },
    { icon: '☁️', key: 'about.tech_4' }
  ];

  constructor(public lang: LangService) {}
}
