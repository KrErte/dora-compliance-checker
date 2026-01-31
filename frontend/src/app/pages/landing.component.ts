import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

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
      <div class="absolute top-2/3 left-1/3 w-48 h-48 bg-pink-500/5 rounded-full blur-3xl animate-glow-pulse delay-700"></div>

      <div class="relative flex flex-col items-center justify-center min-h-[85vh] text-center z-10">
        <!-- Badge -->
        <div class="animate-fade-in-up">
          <div class="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-8 text-sm text-emerald-400 animate-border-glow">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse relative pulse-ring"></span>
            EU m&auml;&auml;rus 2022/2554 &middot; Kehtib alates 17.01.2025
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
          Kontrollige oma IKT-teenuste lepingute vastavust digitaalse tegevuskerksuse
          m&auml;&auml;ruse (DORA) n&otilde;uetele. Professionaalne hindamine 37 k&uuml;simuse p&otilde;hjal
          k&otilde;igis 5 DORA sambas.
        </p>

        <!-- CTA buttons -->
        <div class="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-300">
          <a routerLink="/assessment"
             class="group inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400
                    text-slate-900 font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 text-lg
                    hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 btn-ripple">
            Alusta hindamist
            <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </a>
          <a routerLink="/dashboard"
             class="inline-flex items-center gap-2 bg-slate-800/50 backdrop-blur border border-slate-700/50
                    text-slate-200 font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 text-lg
                    hover:border-emerald-500/30 hover:bg-slate-800/80">
            <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            Juhtpaneel
          </a>
        </div>

        <!-- Animated stats counters -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 w-full max-w-2xl">
          <div class="animate-fade-in-up delay-400 text-center card-3d">
            <div class="card-3d-inner glass-card p-4">
              <div class="text-3xl font-extrabold gradient-text animate-count-up">{{ animatedArticles }}</div>
              <p class="text-xs text-slate-500 mt-1">DORA artiklid</p>
            </div>
          </div>
          <div class="animate-fade-in-up delay-500 text-center card-3d">
            <div class="card-3d-inner glass-card p-4">
              <div class="text-3xl font-extrabold text-emerald-400 animate-count-up">{{ animatedQuestions }}</div>
              <p class="text-xs text-slate-500 mt-1">kontrollk&uuml;simust</p>
            </div>
          </div>
          <div class="animate-fade-in-up delay-600 text-center card-3d">
            <div class="card-3d-inner glass-card p-4">
              <div class="text-3xl font-extrabold text-cyan-400 animate-count-up">{{ animatedCategories }}</div>
              <p class="text-xs text-slate-500 mt-1">valdkonda</p>
            </div>
          </div>
          <div class="animate-fade-in-up delay-700 text-center card-3d">
            <div class="card-3d-inner glass-card p-4">
              <div class="text-3xl font-extrabold text-violet-400 animate-count-up">{{ animatedAssessments }}</div>
              <p class="text-xs text-slate-500 mt-1">hindamist tehtud</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Feature showcase -->
    <div class="py-20 relative">
      <div class="absolute inset-0 gradient-mesh opacity-50"></div>
      <div class="relative z-10 max-w-4xl mx-auto">
        <div class="text-center mb-12 animate-fade-in-up">
          <p class="text-xs uppercase tracking-[0.2em] text-emerald-400 mb-3">Platvormi v&otilde;imalused</p>
          <h2 class="text-3xl font-bold text-slate-100">K&otilde;ik, mida vajate DORA vastavuseks</h2>
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
              <h3 class="font-semibold text-slate-200 mb-2">{{ feature.title }}</h3>
              <p class="text-sm text-slate-500 leading-relaxed">{{ feature.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Process steps -->
    <div class="py-16">
      <div class="text-center mb-12 animate-fade-in-up">
        <p class="text-xs uppercase tracking-[0.2em] text-cyan-400 mb-3">Kuidas see t&ouml;&ouml;tab</p>
        <h2 class="text-3xl font-bold text-slate-100">Kolm lihtsat sammu</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        <div *ngFor="let step of steps; let i = index"
             class="animate-fade-in-up card-3d"
             [style.animation-delay]="(i * 150 + 300) + 'ms'">
          <div class="card-3d-inner glass-card p-6 text-left relative overflow-hidden">
            <!-- Step number background -->
            <div class="absolute -top-4 -right-4 text-8xl font-extrabold text-slate-700/20">{{ i + 1 }}</div>
            <div class="relative z-10">
              <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold mb-3 animate-float"
                   [style.animation-delay]="(i * 500) + 'ms'">{{ i + 1 }}</div>
              <h3 class="font-semibold text-slate-200 mb-1">{{ step.title }}</h3>
              <p class="text-sm text-slate-500">{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- DORA 5 Pillars -->
    <div class="py-16">
      <div class="text-center mb-10 animate-fade-in-up">
        <p class="text-xs uppercase tracking-[0.2em] text-violet-400 mb-3">DORA raamistik</p>
        <h2 class="text-3xl font-bold text-slate-100">5 sammast</h2>
        <p class="text-slate-500 text-sm mt-2 max-w-lg mx-auto">Digitaalse tegevuskerksuse m&auml;&auml;ruse viis p&otilde;hisammast, mis katavad kogu IKT riskihalduse</p>
      </div>

      <div class="grid grid-cols-5 gap-3 max-w-3xl mx-auto">
        <div *ngFor="let pillar of pillars; let i = index"
             class="text-center glass-card p-4 card-hover-glow cursor-pointer animate-fade-in-up"
             [style.animation-delay]="(i * 100 + 400) + 'ms'"
             (click)="navigateToPillar(pillar.id)">
          <div class="text-3xl mb-2 animate-bounce-subtle" [style.animation-delay]="(i * 300) + 'ms'">{{ pillar.icon }}</div>
          <p class="text-xs font-medium text-emerald-400">{{ pillar.label }}</p>
          <p class="text-xs mt-1 text-emerald-500/70">{{ pillar.articles }}</p>
          <div class="mt-2">
            <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Aktiivne</span>
          </div>
        </div>
      </div>
    </div>

    <!-- DORA Timeline -->
    <div class="py-16">
      <div class="text-center mb-10 animate-fade-in-up">
        <p class="text-xs uppercase tracking-[0.2em] text-amber-400 mb-3">Regulatsiooni ajajoon</p>
        <h2 class="text-3xl font-bold text-slate-100">DORA t&auml;htp&auml;evad</h2>
      </div>

      <div class="max-w-3xl mx-auto relative">
        <!-- Timeline line -->
        <div class="absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-cyan-500 to-violet-500 opacity-30"></div>

        <div *ngFor="let event of timelineEvents; let i = index"
             class="relative flex items-center gap-6 mb-8 animate-fade-in-up"
             [class]="i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'"
             [style.animation-delay]="(i * 150 + 300) + 'ms'">
          <div class="flex-1" [class]="i % 2 === 0 ? 'text-right' : 'text-left'">
            <div class="glass-card p-4 inline-block card-hover" [class]="event.active ? 'animate-border-glow' : ''">
              <p class="text-xs font-bold" [class]="event.active ? 'text-emerald-400' : 'text-slate-500'">{{ event.date }}</p>
              <p class="text-sm text-slate-200 font-medium">{{ event.title }}</p>
              <p class="text-xs text-slate-500 mt-1">{{ event.desc }}</p>
            </div>
          </div>
          <div class="relative z-10 w-4 h-4 rounded-full border-2 shrink-0"
               [class]="event.active ? 'bg-emerald-400 border-emerald-400 shadow-lg shadow-emerald-500/50' : 'bg-slate-700 border-slate-600'">
          </div>
          <div class="flex-1"></div>
        </div>
      </div>
    </div>

    <!-- Trusted by (marquee logos) -->
    <div class="py-16">
      <div class="text-center mb-8 animate-fade-in-up">
        <p class="text-xs uppercase tracking-[0.2em] text-slate-600 mb-3">Sobib igale finantssektori ettev&otilde;ttele</p>
      </div>
      <div class="marquee-container">
        <div class="marquee-track">
          <div *ngFor="let logo of marqueeLogos"
               class="flex items-center gap-2 px-8 py-3 mx-2 bg-slate-800/30 rounded-lg border border-slate-700/30">
            <span class="text-lg">{{ logo.icon }}</span>
            <span class="text-sm text-slate-500 whitespace-nowrap">{{ logo.name }}</span>
          </div>
          <div *ngFor="let logo of marqueeLogos"
               class="flex items-center gap-2 px-8 py-3 mx-2 bg-slate-800/30 rounded-lg border border-slate-700/30">
            <span class="text-lg">{{ logo.icon }}</span>
            <span class="text-sm text-slate-500 whitespace-nowrap">{{ logo.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Social proof / testimonials -->
    <div class="py-16">
      <div class="text-center mb-10 animate-fade-in-up">
        <p class="text-xs uppercase tracking-[0.2em] text-emerald-400 mb-3">Tagasiside</p>
        <h2 class="text-3xl font-bold text-slate-100">Mida kliendid &uuml;tlevad</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <div *ngFor="let review of reviews; let i = index"
             class="glass-card p-6 card-hover animate-fade-in-up"
             [style.animation-delay]="(i * 150 + 300) + 'ms'">
          <!-- Stars -->
          <div class="flex gap-1 mb-3">
            <svg *ngFor="let s of [1,2,3,4,5]" class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </div>
          <p class="text-sm text-slate-300 leading-relaxed italic mb-4">"{{ review.text }}"</p>
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold"
                 [class]="review.avatarClass">
              {{ review.initials }}
            </div>
            <div>
              <p class="text-sm font-medium text-slate-200">{{ review.name }}</p>
              <p class="text-xs text-slate-500">{{ review.role }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- EU Regulation card -->
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
              <h3 class="text-base font-semibold text-slate-200 mb-1">EU regulatsioonide vastavus</h3>
              <p class="text-sm text-slate-400">
                Toetab <span class="text-emerald-400 font-medium">DORA</span> (2022/2554) hindamist.
                <span class="text-cyan-400 font-medium">NIS2</span> (2022/2555) tugi on tulemas.
              </p>
            </div>
            <div class="flex gap-2 shrink-0">
              <span class="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400 font-medium">DORA &#10003;</span>
              <span class="px-3 py-1 bg-slate-700/50 border border-slate-600/30 rounded-full text-xs text-slate-500">NIS2 &middot; Peagi</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Category badges -->
    <div class="py-10 animate-fade-in">
      <p class="text-xs uppercase tracking-wider text-slate-600 mb-4 text-center">Hindamise valdkonnad</p>
      <div class="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
        <span *ngFor="let cat of categories; let i = index"
              class="px-3 py-1 glass-card text-xs text-slate-400 card-hover cursor-default"
              [style.animation-delay]="(i * 50 + 700) + 'ms'">
          {{ cat }}
        </span>
      </div>
    </div>

    <!-- Final CTA -->
    <div class="py-20 relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-violet-500/5"></div>
      <div class="relative z-10 text-center max-w-2xl mx-auto animate-fade-in-up">
        <h2 class="text-3xl font-bold text-slate-100 mb-4">Valmis alustama?</h2>
        <p class="text-slate-400 mb-8">Tehke esimene DORA vastavushindamine ja saage selge &uuml;levaade oma IKT-lepingute vastavusest.</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a routerLink="/assessment"
             class="group inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400
                    text-slate-900 font-semibold px-10 py-4 rounded-xl transition-all duration-300 text-lg
                    hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1">
            Alusta tasuta hindamist
            <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </a>
          <a routerLink="/history"
             class="inline-flex items-center gap-2 bg-slate-800/50 backdrop-blur border border-slate-700/50
                    text-slate-200 font-semibold px-8 py-4 rounded-xl transition-all duration-300 text-lg
                    hover:border-emerald-500/30 hover:bg-slate-800/80">
            <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Vaata ajalugu
          </a>
        </div>
      </div>
    </div>

    <!-- Built with -->
    <div class="py-8 animate-fade-in">
      <p class="text-xs text-slate-600 mb-3 text-center">Ehitatud</p>
      <div class="flex items-center justify-center gap-4">
        <span class="px-3 py-1.5 bg-slate-800/60 border border-slate-700/30 rounded-lg text-xs text-slate-400 flex items-center gap-1.5">
          <span class="text-red-400 font-bold">A</span> Angular 19
        </span>
        <span class="px-3 py-1.5 bg-slate-800/60 border border-slate-700/30 rounded-lg text-xs text-slate-400 flex items-center gap-1.5">
          <span class="text-emerald-400 font-bold">S</span> Spring Boot
        </span>
        <span class="px-3 py-1.5 bg-slate-800/60 border border-slate-700/30 rounded-lg text-xs text-slate-400 flex items-center gap-1.5">
          <span class="text-cyan-400 font-bold">T</span> Tailwind CSS
        </span>
        <span class="px-3 py-1.5 bg-slate-800/60 border border-slate-700/30 rounded-lg text-xs text-slate-400 flex items-center gap-1.5">
          <span class="text-blue-400 font-bold">D</span> Docker
        </span>
      </div>
    </div>
  `
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('particleCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  animatedArticles = 0;
  animatedQuestions = 0;
  animatedCategories = 0;
  animatedAssessments = 0;

  displayedTitle = '';
  isTyping = true;
  private fullTitle = 'Vastavuskontroll';
  private typeInterval: any;

  private animationFrame = 0;
  private particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];

  categories = ['Teenustase', 'V\u00e4ljumisstrateegia', 'Audit', 'Intsidendid', 'Andmekaitse', 'Allhange', 'Risk', '\u00d5igus', 'Pidevus', 'V\u00e4rbamine', 'Finantsaruandlus', 'IKT riskihaldus', 'Intsidendid (laiendatud)', 'Testimine', 'Info jagamine'];

  pillars = [
    { id: 'ICT_RISK_MANAGEMENT', icon: '\u{1F6E1}\uFE0F', label: 'IKT riskihaldus', articles: 'Art. 5\u201316' },
    { id: 'INCIDENT_MANAGEMENT', icon: '\u{1F4CB}', label: 'Intsidendid', articles: 'Art. 17\u201323' },
    { id: 'TESTING', icon: '\u{1F50D}', label: 'Testimine', articles: 'Art. 24\u201327' },
    { id: 'THIRD_PARTY', icon: '\u{1F91D}', label: 'Kolmandad osapooled', articles: 'Art. 28\u201344' },
    { id: 'INFORMATION_SHARING', icon: '\u{1F4E1}', label: 'Info jagamine', articles: 'Art. 45' }
  ];

  features = [
    { icon: '\u26A1', title: 'Kiire hindamine', desc: '37 k\u00fcsimust, tulemused koheselt. Valmis 5 minutiga.', bgClass: 'bg-emerald-500/10' },
    { icon: '\u{1F4CA}', title: 'Radardiagramm', desc: 'Visuaalne vastavusprofiil 15 kategooria l\u00f5ikes.', bgClass: 'bg-cyan-500/10' },
    { icon: '\u{1F525}', title: 'Riskimaatriks', desc: 'Likelihood vs Impact 3x3 heatmap riskide visualiseerimiseks.', bgClass: 'bg-red-500/10' },
    { icon: '\u{1F4C4}', title: 'PDF aruanne', desc: 'Professionaalne aruanne printimisel v\u00f5i PDF ekspordiks.', bgClass: 'bg-violet-500/10' },
    { icon: '\u{1F3C6}', title: 'Vastavustunnistus', desc: 'Ilus sertifikaat ettev\u00f5tte vastavustaseme kinnitamiseks.', bgClass: 'bg-amber-500/10' },
    { icon: '\u{1F4C8}', title: 'Ajaloo j\u00e4lgimine', desc: 'Vaadake eelmisi hindamisi ja j\u00e4lgige trendi.', bgClass: 'bg-pink-500/10' }
  ];

  steps = [
    { title: 'Sisesta andmed', desc: 'Ettev\u00f5tte nimi ja IKT-lepingu nimetus' },
    { title: 'Vasta k\u00fcsimustele', desc: '37 k\u00fcsimust 15 DORA kategooriast' },
    { title: 'Saa tulemused', desc: 'Radardiagramm, riskimaatriks ja PDF aruanne' }
  ];

  timelineEvents = [
    { date: 'Sept 2020', title: 'DORA ettepanek', desc: 'Euroopa Komisjon avaldab DORA m\u00e4\u00e4ruse ettepaneku', active: false },
    { date: 'Nov 2022', title: 'DORA vastuv\u00f5tmine', desc: 'Euroopa Parlament kiidab m\u00e4\u00e4ruse heaks', active: false },
    { date: 'Jan 2023', title: 'J\u00f5ustumine', desc: 'DORA m\u00e4\u00e4rus j\u00f5ustub ametlikult', active: false },
    { date: 'Jan 2025', title: 'Kohaldamine', desc: 'T\u00e4ielik kohaldamine k\u00f5igile finantssektori ettev\u00f5tetele', active: true },
    { date: '2025+', title: 'J\u00e4relevalve', desc: 'ESA-d alustavad aktiivset j\u00e4relevalvet ja auditeid', active: false }
  ];

  marqueeLogos = [
    { icon: '\u{1F3E6}', name: 'Pangad' },
    { icon: '\u{1F4B3}', name: 'Makseasutused' },
    { icon: '\u{1F4CA}', name: 'Investeerimis\u00fchingud' },
    { icon: '\u{1F6E1}\uFE0F', name: 'Kindlustusseltsid' },
    { icon: '\u{1F4B0}', name: 'Fondivalitsejad' },
    { icon: '\u2696\uFE0F', name: 'Auditifirmad' },
    { icon: '\u{1F4BB}', name: 'IKT-teenusepakkujad' },
    { icon: '\u{1F310}', name: 'Pilveteenused' },
    { icon: '\u{1F512}', name: 'K\u00fcberturbe ettev\u00f5tted' },
    { icon: '\u{1F4C8}', name: 'Fintech startupid' }
  ];

  reviews = [
    {
      text: 'V\u00e4ga hea t\u00f6\u00f6riist DORA vastavuse kiireks kontrollimiseks. S\u00e4\u00e4stis meile n\u00e4dalaid konsultandi tasu.',
      name: 'Martin Kask',
      role: 'IT-juht, AS Finantsteenused',
      initials: 'MK',
      avatarClass: 'from-emerald-500 to-cyan-500'
    },
    {
      text: 'Radardiagramm annab suurep\u00e4rase \u00fclevaate. N\u00fc\u00fcd teame t\u00e4pselt, kus peame parandusi tegema.',
      name: 'Katrin Tamm',
      role: 'Vastavusjuht, O\u00dc Pangateenused',
      initials: 'KT',
      avatarClass: 'from-violet-500 to-purple-500'
    },
    {
      text: 'Kasutame seda regulaarselt k\u00f5igi oma IKT-lepingute kontrollimiseks. V\u00e4ga professionaalne.',
      name: 'Andres V\u00e4ljas',
      role: 'Riskijuht, AS Kindlustus',
      initials: 'AV',
      avatarClass: 'from-amber-500 to-orange-500'
    }
  ];

  constructor(private router: Router) {}

  navigateToPillar(pillarId: string) {
    this.router.navigate(['/assessment'], { queryParams: { pillar: pillarId } });
  }

  ngOnInit() {
    this.countUp();
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
    let i = 0;
    const type = () => {
      if (i < this.fullTitle.length) {
        this.displayedTitle += this.fullTitle[i];
        i++;
        this.typeInterval = setTimeout(type, 80);
      } else {
        this.isTyping = false;
      }
    };
    setTimeout(type, 600);
  }

  countUp() {
    const targets = { articles: 79, questions: 37, categories: 15, assessments: this.getHistoryCount() };
    const duration = 2000;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      this.animatedArticles = Math.round(targets.articles * ease);
      this.animatedQuestions = Math.round(targets.questions * ease);
      this.animatedCategories = Math.round(targets.categories * ease);
      this.animatedAssessments = Math.round(targets.assessments * ease);

      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  getHistoryCount(): number {
    try {
      return JSON.parse(localStorage.getItem('dora_history') || '[]').length;
    } catch { return 0; }
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
