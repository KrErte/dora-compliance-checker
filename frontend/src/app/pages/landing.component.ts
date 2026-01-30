import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Hero section with gradient background -->
    <div class="relative overflow-hidden">
      <!-- Particle canvas -->
      <canvas #particleCanvas class="particle-canvas"></canvas>

      <!-- Glow orbs -->
      <div class="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-glow-pulse"></div>
      <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-glow-pulse delay-500"></div>
      <div class="absolute top-1/3 right-1/4 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl animate-glow-pulse delay-300"></div>

      <div class="relative flex flex-col items-center justify-center min-h-[80vh] text-center z-10">
        <!-- Main hero card -->
        <div class="animate-fade-in-up">
          <div class="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-8 text-sm text-emerald-400">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse relative pulse-ring"></span>
            EU m&auml;&auml;rus 2022/2554
          </div>
        </div>

        <h1 class="text-5xl md:text-7xl font-extrabold mb-6 animate-fade-in-up delay-100">
          <span class="gradient-text glow-text">DORA</span>
          <br/>
          <span class="text-slate-100">Vastavuskontroll</span>
        </h1>

        <p class="text-lg text-slate-400 max-w-xl mb-10 leading-relaxed animate-fade-in-up delay-200">
          Kontrollige oma IKT-teenuste lepingute vastavust digitaalse tegevuskerksuse
          m&auml;&auml;ruse (DORA) artiklite 28&ndash;30 n&otilde;uetele.
        </p>

        <!-- CTA buttons -->
        <div class="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-300">
          <a routerLink="/assessment"
             class="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400
                    text-slate-900 font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 text-lg
                    hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 group">
            Alusta hindamist
            <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </a>
          <a routerLink="/history"
             class="inline-flex items-center gap-2 bg-slate-800/50 backdrop-blur border border-slate-700/50
                    text-slate-200 font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 text-lg
                    hover:border-emerald-500/30 hover:bg-slate-800/80">
            <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Vaata ajalugu
          </a>
        </div>

        <!-- Animated stats counters -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 w-full max-w-2xl">
          <div class="animate-fade-in-up delay-400 text-center">
            <div class="text-3xl font-extrabold gradient-text animate-count-up">{{ animatedArticles }}</div>
            <p class="text-xs text-slate-500 mt-1">DORA artiklid</p>
          </div>
          <div class="animate-fade-in-up delay-500 text-center">
            <div class="text-3xl font-extrabold text-emerald-400 animate-count-up">{{ animatedQuestions }}</div>
            <p class="text-xs text-slate-500 mt-1">kontrollk&uuml;simust</p>
          </div>
          <div class="animate-fade-in-up delay-600 text-center">
            <div class="text-3xl font-extrabold text-cyan-400 animate-count-up">{{ animatedCategories }}</div>
            <p class="text-xs text-slate-500 mt-1">valdkonda</p>
          </div>
          <div class="animate-fade-in-up delay-700 text-center">
            <div class="text-3xl font-extrabold text-violet-400 animate-count-up">{{ animatedAssessments }}</div>
            <p class="text-xs text-slate-500 mt-1">hindamist tehtud</p>
          </div>
        </div>

        <!-- Process steps -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full max-w-3xl">
          <div class="animate-fade-in-up delay-400 card-3d">
            <div class="card-3d-inner bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 text-left animate-shimmer">
              <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold mb-3 animate-float">1</div>
              <h3 class="font-semibold text-slate-200 mb-1">Sisesta andmed</h3>
              <p class="text-sm text-slate-500">Ettev&otilde;tte nimi ja IKT-lepingu nimetus</p>
            </div>
          </div>
          <div class="animate-fade-in-up delay-500 card-3d">
            <div class="card-3d-inner bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 text-left animate-shimmer" style="animation-delay:1s">
              <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold mb-3 animate-float" style="animation-delay:0.5s">2</div>
              <h3 class="font-semibold text-slate-200 mb-1">Vasta k&uuml;simustele</h3>
              <p class="text-sm text-slate-500">37 k&uuml;simust 15 DORA kategooriast</p>
            </div>
          </div>
          <div class="animate-fade-in-up delay-600 card-3d">
            <div class="card-3d-inner bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 text-left animate-shimmer" style="animation-delay:2s">
              <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold mb-3 animate-float" style="animation-delay:1s">3</div>
              <h3 class="font-semibold text-slate-200 mb-1">Saa tulemused</h3>
              <p class="text-sm text-slate-500">Radardiagramm, riskimaatriks ja PDF aruanne</p>
            </div>
          </div>
        </div>

        <!-- Category badges -->
        <div class="mt-16 animate-fade-in delay-700">
          <p class="text-xs uppercase tracking-wider text-slate-600 mb-4">Hindamise valdkonnad</p>
          <div class="flex flex-wrap justify-center gap-2">
            <span *ngFor="let cat of categories; let i = index"
                  class="px-3 py-1 bg-slate-800/80 border border-slate-700/50 rounded-full text-xs text-slate-400
                         hover:border-emerald-500/30 hover:text-emerald-400 transition-all duration-300 cursor-default"
                  [style.animation-delay]="(i * 50 + 700) + 'ms'">
              {{ cat }}
            </span>
          </div>
        </div>

        <!-- DORA 5 Pillars -->
        <div class="mt-16 w-full max-w-3xl animate-fade-in-up delay-800">
          <p class="text-xs uppercase tracking-wider text-slate-600 mb-6 text-center">DORA 5 sammast</p>
          <div class="grid grid-cols-5 gap-2">
            <div *ngFor="let pillar of pillars; let i = index"
                 class="text-center p-4 rounded-xl border card-hover animate-fade-in-up"
                 [class]="pillar.active
                   ? 'bg-emerald-500/5 border-emerald-500/20'
                   : 'bg-slate-800/30 border-slate-700/30'"
                 [style.animation-delay]="(i * 100 + 800) + 'ms'">
              <div class="text-2xl mb-2">{{ pillar.icon }}</div>
              <p class="text-xs font-medium" [class]="pillar.active ? 'text-emerald-400' : 'text-slate-500'">{{ pillar.label }}</p>
              <p class="text-xs mt-1" [class]="pillar.active ? 'text-emerald-500/70' : 'text-slate-600'">{{ pillar.articles }}</p>
              <div class="mt-2">
                <span *ngIf="pillar.active" class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Aktiivne</span>
                <span *ngIf="!pillar.active" class="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-600 border border-slate-700/30">Peagi</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tech stack -->
        <div class="mt-10 w-full max-w-3xl animate-fade-in-up delay-800">
          <div class="bg-gradient-to-r from-slate-800/80 to-slate-800/40 backdrop-blur border border-slate-700/50 rounded-xl p-6">
            <div class="flex flex-col md:flex-row items-center gap-6">
              <div class="flex gap-3 shrink-0">
                <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
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

        <!-- Built with -->
        <div class="mt-10 animate-fade-in delay-800">
          <p class="text-xs text-slate-600 mb-3">Ehitatud</p>
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

  private animationFrame = 0;
  private particles: { x: number; y: number; vx: number; vy: number; size: number }[] = [];

  categories = ['Teenustase', 'V\u00e4ljumisstrateegia', 'Audit', 'Intsidendid', 'Andmekaitse', 'Allhange', 'Risk', '\u00d5igus', 'Pidevus', 'V\u00e4rbamine', 'Finantsaruandlus', 'IKT riskihaldus', 'Intsidendid (laiendatud)', 'Testimine', 'Info jagamine'];

  pillars = [
    { icon: '\u{1F6E1}\uFE0F', label: 'IKT riskihaldus', articles: 'Art. 5\u201316', active: true },
    { icon: '\u{1F4CB}', label: 'Intsidendid', articles: 'Art. 17\u201323', active: true },
    { icon: '\u{1F50D}', label: 'Testimine', articles: 'Art. 24\u201327', active: true },
    { icon: '\u{1F91D}', label: 'Kolmandad osapooled', articles: 'Art. 28\u201344', active: true },
    { icon: '\u{1F4E1}', label: 'Info jagamine', articles: 'Art. 45', active: true }
  ];

  ngOnInit() {
    this.countUp();
  }

  ngAfterViewInit() {
    this.initParticles();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationFrame);
  }

  countUp() {
    const targets = { articles: 79, questions: 37, categories: 15, assessments: this.getHistoryCount() };
    const duration = 2000;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // cubic ease-out

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

    // Create particles
    const count = 60;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      for (const p of this.particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(52, 211, 153, 0.3)';
        ctx.fill();
      }

      // Draw connections
      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const dx = this.particles[i].x - this.particles[j].x;
          const dy = this.particles[i].y - this.particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(this.particles[i].x, this.particles[i].y);
            ctx.lineTo(this.particles[j].x, this.particles[j].y);
            ctx.strokeStyle = `rgba(52, 211, 153, ${0.15 * (1 - dist / 120)})`;
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
