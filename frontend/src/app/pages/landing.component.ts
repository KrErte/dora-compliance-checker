import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-landing',
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Hero section with gradient mesh background -->
    <div class="relative overflow-hidden gradient-mesh">
      <!-- Particle canvas -->
      <canvas #particleCanvas class="particle-canvas"></canvas>

      <!-- Glow orbs -->
      <div class="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-glow-pulse"></div>
      <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-glow-pulse delay-500"></div>
      <div class="absolute top-1/3 right-1/4 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl animate-glow-pulse delay-300"></div>
      <div class="absolute top-2/3 left-1/3 w-48 h-48 bg-red-500/5 rounded-full blur-3xl animate-glow-pulse delay-700"></div>

      <div class="relative flex flex-col items-center justify-center min-h-[85vh] text-center z-10">
        <!-- Urgency badge -->
        <div class="animate-fade-in-up">
          <div class="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5 mb-8 text-sm text-red-400 animate-border-glow">
            <span class="w-2 h-2 rounded-full bg-red-400 animate-pulse relative pulse-ring"></span>
            {{ lang.t('landing.badge') }}
          </div>
        </div>

        <!-- Title with typing effect -->
        <h1 class="text-5xl md:text-7xl font-extrabold mb-6 animate-fade-in-up delay-100">
          <span class="gradient-text glow-text">DORA</span>
          <br/>
          <span class="text-slate-100">{{ displayedTitle }}</span>
          <span class="text-emerald-400 animate-pulse" *ngIf="isTyping">|</span>
        </h1>

        <p class="text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed animate-fade-in-up delay-200">
          {{ lang.t('landing.hero_desc') }}
        </p>

        <!-- CTA buttons -->
        <div class="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-300">
          <a routerLink="/contract-analysis" [queryParams]="{sample: 'true'}"
             class="group inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400
                    text-slate-900 font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 text-lg
                    hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 btn-ripple">
            {{ lang.t('landing.cta_try_sample') }}
            <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </a>
          <a routerLink="/assessment"
             class="inline-flex items-center gap-2 bg-slate-800/50 backdrop-blur border border-slate-700/50
                    text-slate-200 font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 text-lg
                    hover:border-emerald-500/30 hover:bg-slate-800/80">
            <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            {{ lang.t('landing.cta_assessment') }}
          </a>
        </div>

        <!-- Urgency stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 w-full max-w-2xl">
          <div class="animate-fade-in-up delay-400 text-center card-3d">
            <div class="card-3d-inner glass-card p-4">
              <div class="text-3xl font-extrabold text-red-400">2%</div>
              <p class="text-xs text-slate-500 mt-1">{{ lang.t('landing.stat_fine') }}</p>
            </div>
          </div>
          <div class="animate-fade-in-up delay-500 text-center card-3d">
            <div class="card-3d-inner glass-card p-4">
              <div class="text-3xl font-extrabold text-amber-400">38%</div>
              <p class="text-xs text-slate-500 mt-1">{{ lang.t('landing.stat_noncompliant') }}</p>
            </div>
          </div>
          <div class="animate-fade-in-up delay-600 text-center card-3d">
            <div class="card-3d-inner glass-card p-4">
              <div class="text-3xl font-extrabold text-emerald-400">8</div>
              <p class="text-xs text-slate-500 mt-1">{{ lang.t('landing.stat_requirements') }}</p>
            </div>
          </div>
          <div class="animate-fade-in-up delay-700 text-center card-3d">
            <div class="card-3d-inner glass-card p-4">
              <div class="text-3xl font-extrabold text-cyan-400">&lt;5 min</div>
              <p class="text-xs text-slate-500 mt-1">{{ lang.t('landing.stat_time') }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Who needs this -->
    <div class="py-20 relative">
      <div class="absolute inset-0 gradient-mesh opacity-50"></div>
      <div class="relative z-10 max-w-4xl mx-auto">
        <div class="text-center mb-12 animate-fade-in-up">
          <p class="text-xs uppercase tracking-[0.2em] text-red-400 mb-3">{{ lang.t('landing.who_label') }}</p>
          <h2 class="text-3xl font-bold text-slate-100">{{ lang.t('landing.who_title') }}</h2>
          <p class="text-slate-500 text-sm mt-2">{{ lang.t('landing.who_subtitle') }}</p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div *ngFor="let sector of sectors; let i = index"
               class="card-3d animate-fade-in-up"
               [style.animation-delay]="(i * 100 + 200) + 'ms'">
            <div class="card-3d-inner glass-card p-5 h-full card-hover-glow">
              <div class="text-3xl mb-3">{{ sector.icon }}</div>
              <h3 class="font-semibold text-slate-200 mb-1 text-sm">{{ lang.t(sector.titleKey) }}</h3>
              <p class="text-xs text-slate-500 mb-2">{{ lang.t(sector.examplesKey) }}</p>
              <p class="text-xs text-slate-400 leading-relaxed">{{ lang.t(sector.painKey) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Feature showcase -->
    <div class="py-20 relative">
      <div class="relative z-10 max-w-4xl mx-auto">
        <div class="text-center mb-12 animate-fade-in-up">
          <p class="text-xs uppercase tracking-[0.2em] text-emerald-400 mb-3">{{ lang.t('landing.features_label') }}</p>
          <h2 class="text-3xl font-bold text-slate-100">{{ lang.t('landing.features_title') }}</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div *ngFor="let feature of features; let i = index"
               class="card-3d animate-fade-in-up"
               [style.animation-delay]="(i * 100 + 200) + 'ms'">
            <div class="card-3d-inner glass-card p-6 h-full card-hover-glow">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 animate-bounce-subtle"
                   [style.animation-delay]="(i * 200) + 'ms'"
                   [class]="feature.bgClass">
                {{ feature.icon }}
              </div>
              <h3 class="font-semibold text-slate-200 mb-2">{{ lang.t(feature.titleKey) }}</h3>
              <p class="text-sm text-slate-500 leading-relaxed">{{ lang.t(feature.descKey) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Process steps -->
    <div class="py-16">
      <div class="text-center mb-12 animate-fade-in-up">
        <p class="text-xs uppercase tracking-[0.2em] text-cyan-400 mb-3">{{ lang.t('landing.steps_label') }}</p>
        <h2 class="text-3xl font-bold text-slate-100">{{ lang.t('landing.steps_title') }}</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        <div *ngFor="let step of steps; let i = index"
             class="animate-fade-in-up card-3d"
             [style.animation-delay]="(i * 150 + 300) + 'ms'">
          <div class="card-3d-inner glass-card p-6 text-left relative overflow-hidden">
            <div class="absolute -top-4 -right-4 text-8xl font-extrabold text-slate-700/20">{{ i + 1 }}</div>
            <div class="relative z-10">
              <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold mb-3 animate-float"
                   [style.animation-delay]="(i * 500) + 'ms'">{{ i + 1 }}</div>
              <h3 class="font-semibold text-slate-200 mb-1">{{ lang.t(step.titleKey) }}</h3>
              <p class="text-sm text-slate-500">{{ lang.t(step.descKey) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- DORA 5 Pillars -->
    <div class="py-16">
      <div class="text-center mb-10 animate-fade-in-up">
        <p class="text-xs uppercase tracking-[0.2em] text-violet-400 mb-3">{{ lang.t('landing.pillars_label') }}</p>
        <h2 class="text-3xl font-bold text-slate-100">{{ lang.t('landing.pillars_title') }}</h2>
        <p class="text-slate-500 text-sm mt-2 max-w-lg mx-auto">{{ lang.t('landing.pillars_desc') }}</p>
      </div>

      <div class="grid grid-cols-5 gap-3 max-w-3xl mx-auto">
        <div *ngFor="let pillar of pillars; let i = index"
             class="text-center glass-card p-4 card-hover-glow cursor-pointer animate-fade-in-up"
             [style.animation-delay]="(i * 100 + 400) + 'ms'"
             (click)="navigateToPillar(pillar.id)">
          <div class="text-3xl mb-2 animate-bounce-subtle" [style.animation-delay]="(i * 300) + 'ms'">{{ pillar.icon }}</div>
          <p class="text-xs font-medium text-emerald-400">{{ lang.t(pillar.labelKey) }}</p>
          <p class="text-xs mt-1 text-emerald-500/70">{{ pillar.articles }}</p>
          <div class="mt-2">
            <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">{{ lang.t('landing.active') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- DORA Timeline -->
    <div class="py-16">
      <div class="text-center mb-10 animate-fade-in-up">
        <p class="text-xs uppercase tracking-[0.2em] text-amber-400 mb-3">{{ lang.t('landing.timeline_label') }}</p>
        <h2 class="text-3xl font-bold text-slate-100">{{ lang.t('landing.timeline_title') }}</h2>
      </div>

      <div class="max-w-3xl mx-auto relative">
        <div class="absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-cyan-500 to-red-500 opacity-30"></div>

        <div *ngFor="let event of timelineEvents; let i = index"
             class="relative flex items-center gap-6 mb-8 animate-fade-in-up"
             [class]="i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'"
             [style.animation-delay]="(i * 150 + 300) + 'ms'">
          <div class="flex-1" [class]="i % 2 === 0 ? 'text-right' : 'text-left'">
            <div class="glass-card p-4 inline-block card-hover" [class]="event.active ? 'animate-border-glow border-red-500/30' : ''">
              <p class="text-xs font-bold" [class]="event.active ? 'text-red-400' : 'text-slate-500'">{{ event.date }}</p>
              <p class="text-sm text-slate-200 font-medium">{{ lang.t(event.titleKey) }}</p>
              <p class="text-xs text-slate-500 mt-1">{{ lang.t(event.descKey) }}</p>
            </div>
          </div>
          <div class="relative z-10 w-4 h-4 rounded-full border-2 shrink-0"
               [class]="event.active ? 'bg-red-400 border-red-400 shadow-lg shadow-red-500/50' : 'bg-slate-700 border-slate-600'">
          </div>
          <div class="flex-1"></div>
        </div>
      </div>
    </div>

    <!-- Marquee -->
    <div class="py-16">
      <div class="text-center mb-8 animate-fade-in-up">
        <p class="text-xs uppercase tracking-[0.2em] text-slate-600 mb-3">{{ lang.t('landing.marquee_label') }}</p>
      </div>
      <div class="marquee-container">
        <div class="marquee-track">
          <div *ngFor="let logo of marqueeLogos"
               class="flex items-center gap-2 px-8 py-3 mx-2 bg-slate-800/30 rounded-lg border border-slate-700/30">
            <span class="text-lg">{{ logo.icon }}</span>
            <span class="text-sm text-slate-500 whitespace-nowrap">{{ lang.t(logo.nameKey) }}</span>
          </div>
          <div *ngFor="let logo of marqueeLogos"
               class="flex items-center gap-2 px-8 py-3 mx-2 bg-slate-800/30 rounded-lg border border-slate-700/30">
            <span class="text-lg">{{ logo.icon }}</span>
            <span class="text-sm text-slate-500 whitespace-nowrap">{{ lang.t(logo.nameKey) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Testimonials -->
    <div class="py-16">
      <div class="text-center mb-10 animate-fade-in-up">
        <p class="text-xs uppercase tracking-[0.2em] text-emerald-400 mb-3">{{ lang.t('landing.reviews_label') }}</p>
        <h2 class="text-3xl font-bold text-slate-100">{{ lang.t('landing.reviews_title') }}</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <div *ngFor="let review of reviews; let i = index"
             class="glass-card p-6 card-hover animate-fade-in-up"
             [style.animation-delay]="(i * 150 + 300) + 'ms'">
          <div class="flex gap-1 mb-3">
            <svg *ngFor="let s of [1,2,3,4,5]" class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </div>
          <p class="text-sm text-slate-300 leading-relaxed italic mb-4">"{{ lang.t(review.textKey) }}"</p>
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold"
                 [class]="review.avatarClass">
              {{ review.initials }}
            </div>
            <div>
              <p class="text-sm font-medium text-slate-200">{{ review.name }}</p>
              <p class="text-xs text-slate-500">{{ lang.t(review.roleKey) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Trust signals -->
    <div class="py-10">
      <div class="max-w-3xl mx-auto animate-fade-in-up">
        <div class="glass-card-strong p-6">
          <div class="flex flex-col md:flex-row items-center gap-6">
            <div class="flex gap-3 shrink-0">
              <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-rotate-slow">
                <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <div class="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
            <div class="text-center md:text-left flex-1">
              <h3 class="text-base font-semibold text-slate-200 mb-1">{{ lang.t('landing.trust_title') }}</h3>
              <p class="text-sm text-slate-400">{{ lang.t('landing.trust_desc') }}</p>
            </div>
            <div class="flex flex-wrap gap-2 shrink-0">
              <span class="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400 font-medium">DORA 2022/2554</span>
              <span class="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs text-cyan-400 font-medium">Claude AI</span>
              <span class="px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-xs text-violet-400 font-medium">{{ lang.t('landing.trust_eu_data') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Category badges -->
    <div class="py-10 animate-fade-in">
      <p class="text-xs uppercase tracking-wider text-slate-600 mb-4 text-center">{{ lang.t('landing.categories') }}</p>
      <div class="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
        <span *ngFor="let cat of categories; let i = index"
              class="px-3 py-1 glass-card text-xs text-slate-400 card-hover cursor-default"
              [style.animation-delay]="(i * 50 + 700) + 'ms'">
          {{ lang.t(cat) }}
        </span>
      </div>
    </div>

    <!-- Final CTA -->
    <div class="py-20 relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-red-500/5"></div>
      <div class="relative z-10 text-center max-w-2xl mx-auto animate-fade-in-up">
        <h2 class="text-3xl font-bold text-slate-100 mb-4">{{ lang.t('landing.final_cta_title') }}</h2>
        <p class="text-slate-400 mb-8">{{ lang.t('landing.final_cta_desc') }}</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a routerLink="/contract-analysis" [queryParams]="{sample: 'true'}"
             class="group inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400
                    text-slate-900 font-semibold px-10 py-4 rounded-xl transition-all duration-300 text-lg
                    hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1">
            {{ lang.t('landing.cta_try_sample') }}
            <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </a>
          <a routerLink="/assessment"
             class="inline-flex items-center gap-2 bg-slate-800/50 backdrop-blur border border-slate-700/50
                    text-slate-200 font-semibold px-8 py-4 rounded-xl transition-all duration-300 text-lg
                    hover:border-emerald-500/30 hover:bg-slate-800/80">
            <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            {{ lang.t('landing.cta_assessment') }}
          </a>
        </div>
      </div>
    </div>
  `
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('particleCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  displayedTitle = '';
  isTyping = true;
  private typeInterval: any;

  private animationFrame = 0;
  private particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];

  sectors = [
    { icon: '\u{1F3E6}', titleKey: 'landing.sector_banks', examplesKey: 'landing.sector_banks_ex', painKey: 'landing.sector_banks_pain' },
    { icon: '\u{1F6E1}\uFE0F', titleKey: 'landing.sector_insurance', examplesKey: 'landing.sector_insurance_ex', painKey: 'landing.sector_insurance_pain' },
    { icon: '\u{1F4B3}', titleKey: 'landing.sector_payments', examplesKey: 'landing.sector_payments_ex', painKey: 'landing.sector_payments_pain' },
    { icon: '\u20BF', titleKey: 'landing.sector_crypto', examplesKey: 'landing.sector_crypto_ex', painKey: 'landing.sector_crypto_pain' },
    { icon: '\u{1F4B0}', titleKey: 'landing.sector_funds', examplesKey: 'landing.sector_funds_ex', painKey: 'landing.sector_funds_pain' },
    { icon: '\u{1F4BB}', titleKey: 'landing.sector_ict', examplesKey: 'landing.sector_ict_ex', painKey: 'landing.sector_ict_pain' }
  ];

  categories = [
    'landing.cat_service', 'landing.cat_exit', 'landing.cat_audit', 'landing.cat_incident',
    'landing.cat_data', 'landing.cat_subcontracting', 'landing.cat_risk', 'landing.cat_legal',
    'landing.cat_continuity', 'landing.cat_recruitment', 'landing.cat_financial',
    'landing.cat_ict_risk', 'landing.cat_incident_ext', 'landing.cat_testing', 'landing.cat_info'
  ];

  pillars = [
    { id: 'ICT_RISK_MANAGEMENT', icon: '\u{1F6E1}\uFE0F', labelKey: 'landing.pillar_risk', articles: 'Art. 5\u201316' },
    { id: 'INCIDENT_MANAGEMENT', icon: '\u{1F4CB}', labelKey: 'landing.pillar_incident', articles: 'Art. 17\u201323' },
    { id: 'TESTING', icon: '\u{1F50D}', labelKey: 'landing.pillar_testing', articles: 'Art. 24\u201327' },
    { id: 'THIRD_PARTY', icon: '\u{1F91D}', labelKey: 'landing.pillar_thirdparty', articles: 'Art. 28\u201344' },
    { id: 'INFORMATION_SHARING', icon: '\u{1F4E1}', labelKey: 'landing.pillar_info', articles: 'Art. 45' }
  ];

  features = [
    { icon: '\u{1F916}', titleKey: 'landing.feat_ai_title', descKey: 'landing.feat_ai_desc', bgClass: 'bg-emerald-500/10' },
    { icon: '\u26A1', titleKey: 'landing.feat_fast_title', descKey: 'landing.feat_fast_desc', bgClass: 'bg-cyan-500/10' },
    { icon: '\u{1F4CA}', titleKey: 'landing.feat_radar_title', descKey: 'landing.feat_radar_desc', bgClass: 'bg-violet-500/10' },
    { icon: '\u{1F525}', titleKey: 'landing.feat_risk_title', descKey: 'landing.feat_risk_desc', bgClass: 'bg-red-500/10' },
    { icon: '\u{1F4C4}', titleKey: 'landing.feat_pdf_title', descKey: 'landing.feat_pdf_desc', bgClass: 'bg-amber-500/10' },
    { icon: '\u{1F3C6}', titleKey: 'landing.feat_cert_title', descKey: 'landing.feat_cert_desc', bgClass: 'bg-pink-500/10' }
  ];

  steps = [
    { titleKey: 'landing.step1_title', descKey: 'landing.step1_desc' },
    { titleKey: 'landing.step2_title', descKey: 'landing.step2_desc' },
    { titleKey: 'landing.step3_title', descKey: 'landing.step3_desc' }
  ];

  timelineEvents = [
    { date: 'Sept 2020', titleKey: 'landing.tl_proposal_title', descKey: 'landing.tl_proposal_desc', active: false },
    { date: 'Nov 2022', titleKey: 'landing.tl_adoption_title', descKey: 'landing.tl_adoption_desc', active: false },
    { date: 'Jan 2023', titleKey: 'landing.tl_force_title', descKey: 'landing.tl_force_desc', active: false },
    { date: 'Jan 2025', titleKey: 'landing.tl_apply_title', descKey: 'landing.tl_apply_desc', active: false },
    { date: '2026', titleKey: 'landing.tl_enforce_title', descKey: 'landing.tl_enforce_desc', active: true }
  ];

  marqueeLogos = [
    { icon: '\u{1F3E6}', nameKey: 'landing.m_banks' },
    { icon: '\u{1F4B3}', nameKey: 'landing.m_payments' },
    { icon: '\u{1F4CA}', nameKey: 'landing.m_investment' },
    { icon: '\u{1F6E1}\uFE0F', nameKey: 'landing.m_insurance' },
    { icon: '\u{1F4B0}', nameKey: 'landing.m_funds' },
    { icon: '\u2696\uFE0F', nameKey: 'landing.m_audit' },
    { icon: '\u{1F4BB}', nameKey: 'landing.m_ict' },
    { icon: '\u{1F310}', nameKey: 'landing.m_cloud' },
    { icon: '\u{1F512}', nameKey: 'landing.m_cyber' },
    { icon: '\u{1F4C8}', nameKey: 'landing.m_fintech' }
  ];

  reviews = [
    {
      textKey: 'landing.review1_text',
      name: 'Martin Kask',
      roleKey: 'landing.review1_role',
      initials: 'MK',
      avatarClass: 'from-emerald-500 to-cyan-500'
    },
    {
      textKey: 'landing.review2_text',
      name: 'Katrin Tamm',
      roleKey: 'landing.review2_role',
      initials: 'KT',
      avatarClass: 'from-violet-500 to-purple-500'
    },
    {
      textKey: 'landing.review3_text',
      name: 'Andres V\u00e4ljas',
      roleKey: 'landing.review3_role',
      initials: 'AV',
      avatarClass: 'from-amber-500 to-orange-500'
    }
  ];

  constructor(private router: Router, public lang: LangService) {}

  navigateToPillar(pillarId: string) {
    this.router.navigate(['/assessment'], { queryParams: { pillar: pillarId } });
  }

  ngOnInit() {
    this.startTyping();
  }

  ngAfterViewInit() {
    this.initParticles();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationFrame);
    if (this.typeInterval) clearTimeout(this.typeInterval);
  }

  startTyping() {
    const title = this.lang.t('landing.subtitle');
    let i = 0;
    const type = () => {
      if (i < title.length) {
        this.displayedTitle += title[i];
        i++;
        this.typeInterval = setTimeout(type, 80);
      } else {
        this.isTyping = false;
      }
    };
    setTimeout(type, 600);
  }

  initParticles() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const count = 80;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.2
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of this.particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52, 211, 153, ${p.opacity})`;
        ctx.fill();
      }

      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const dx = this.particles[i].x - this.particles[j].x;
          const dy = this.particles[i].y - this.particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(this.particles[i].x, this.particles[i].y);
            ctx.lineTo(this.particles[j].x, this.particles[j].y);
            ctx.strokeStyle = `rgba(52, 211, 153, ${0.12 * (1 - dist / 140)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      this.animationFrame = requestAnimationFrame(draw);
    };
    draw();
  }
}
