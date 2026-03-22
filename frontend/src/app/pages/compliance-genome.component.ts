import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';
import { ApiService } from '../api.service';
import { SubscriptionService } from '../services/subscription.service';

@Component({
  selector: 'app-compliance-genome',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-[1400px] mx-auto px-4 pb-16">

      <!-- Page Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 mb-4">
          <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          <span class="text-sm font-medium text-blue-500">{{ lang.l('Genoomivaade', 'Genome View') }}</span>
        </div>
        <h1 class="text-3xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-3">
          <svg class="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 3c-1.5 2-3 4-3 6s1.5 3 3 3 3-1 3-3-1.5-4-3-6z" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 12c-1.5 2-3 4-3 6s1.5 3 3 3 3-1 3-3-1.5-4-3-6z" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 6.5C6.5 7 5 8 5 10s2 3 4 2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 6.5c1.5.5 3 1.5 3 3.5s-2 3-4 2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 15.5C6.5 16 5 17 5 19s2 3 4 2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 15.5c1.5.5 3 1.5 3 3.5s-2 3-4 2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ lang.l('Vastavuse Genoom', 'Compliance Genome') }}
        </h1>
        <p class="text-slate-400 max-w-2xl mx-auto">
          {{ lang.l(
            'Teie organisatsiooni vastavusseisundi unikaalne geneetiline sormejälg. Iga geen esindab regulatiivset nõuet, kromosoomi kaared näitavad sambaid ja tuumik pulseerib teie üldist tervist.',
            'Your organization\\'s unique genetic fingerprint of compliance state. Each gene represents a regulatory requirement, chromosome arcs show pillars, and the nucleus pulses your overall health.'
          ) }}
        </p>
      </div>

      <!-- Tabs -->
      <div class="flex justify-center gap-1 mb-8 bg-white rounded-xl p-1 max-w-md mx-auto border border-slate-200">
        <button (click)="activeTab.set('genome')"
          [class]="activeTab() === 'genome'
            ? 'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-500 border border-blue-200'
            : 'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-900 transition-colors'">
          {{ lang.l('Genoom', 'Genome') }}
        </button>
        <button (click)="activeTab.set('history')"
          [class]="activeTab() === 'history'
            ? 'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-500 border border-blue-200'
            : 'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-900 transition-colors'">
          {{ lang.l('Ajalugu', 'History') }}
        </button>
        <button (click)="activeTab.set('comparison')"
          class="flex-1 relative"
          [class]="activeTab() === 'comparison'
            ? 'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-500 border border-blue-200'
            : 'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-900 transition-colors'">
          {{ lang.l('Voordlus', 'Comparison') }}
          @if (!sub.isPremium()) {
            <svg class="w-3.5 h-3.5 inline ml-1 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
            </svg>
          }
        </button>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-32">
          <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p class="text-slate-400 text-sm">{{ lang.l('Genoomi dekodeerimine...', 'Decoding genome...') }}</p>
        </div>
      }

      <!-- No data -->
      @if (!loading() && !genome()) {
        <div class="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div class="w-20 h-20 rounded-2xl bg-white flex items-center justify-center mx-auto mb-6 border border-slate-200">
            <svg class="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <h2 class="text-xl font-bold text-slate-700 mb-2">{{ lang.l('Genoomi pole veel', 'No Genome Yet') }}</h2>
          <p class="text-slate-400 mb-6">{{ lang.l('Tehke esmalt hindamine, et genereerida oma vastavuse genoom.', 'Complete an assessment first to generate your compliance genome.') }}</p>
          <a routerLink="/assessment" class="inline-flex items-center gap-2 bg-blue-600 text-slate-900 font-semibold px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-lg transition-all">
            {{ lang.l('Alusta hindamist', 'Start Assessment') }}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
          </a>
        </div>
      }

      <!-- ========== TAB: GENOME ========== -->
      @if (!loading() && genome() && activeTab() === 'genome') {
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">

          <!-- SVG Visualization -->
          <div class="xl:col-span-8">
            <div class="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-blue-500/5 pointer-events-none"></div>

              <div class="flex justify-center relative">
                <svg [attr.viewBox]="'0 0 700 700'" class="w-full max-w-[700px] h-auto genome-svg">
                  <defs>
                    <!-- Glow filters -->
                    <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="blur"/>
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                    <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2.5" result="blur"/>
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                    <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="blur"/>
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                    <filter id="nucleus-glow" x="-100%" y="-100%" width="300%" height="300%">
                      <feGaussianBlur stdDeviation="8" result="blur"/>
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                    <!-- Radial gradient for background -->
                    <radialGradient id="bg-gradient" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stop-color="#10b981" stop-opacity="0.03"/>
                      <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
                    </radialGradient>
                  </defs>

                  <!-- Background circle -->
                  <circle cx="350" cy="350" r="340" fill="url(#bg-gradient)" stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="4 4" opacity="0.4"/>

                  <!-- Reference circles (faint grid) -->
                  <circle cx="350" cy="350" r="320" fill="none" stroke="#e2e8f0" stroke-width="0.3" stroke-dasharray="2 6" opacity="0.3"/>
                  <circle cx="350" cy="350" r="260" fill="none" stroke="#e2e8f0" stroke-width="0.3" stroke-dasharray="2 6" opacity="0.3"/>
                  <circle cx="350" cy="350" r="200" fill="none" stroke="#e2e8f0" stroke-width="0.3" stroke-dasharray="2 6" opacity="0.3"/>

                  <!-- Outer Ring: Chromosomes (Pillar Arcs) -->
                  @for (chr of genome().chromosomes; track chr.id; let i = $index) {
                    <g class="chromosome-group" [attr.data-chr]="chr.id">
                      <!-- Chromosome arc background (thick) -->
                      <path
                        [attr.d]="describeArc(350, 350, 320, chr.startAngle + 1, chr.endAngle - 1)"
                        fill="none"
                        [attr.stroke]="chr.color + '30'"
                        stroke-width="28"
                        stroke-linecap="round"
                        class="chromosome-arc-bg"/>
                      <!-- Chromosome arc fill (based on score) -->
                      <path
                        [attr.d]="describeArc(350, 350, 320, chr.startAngle + 1, chr.startAngle + 1 + (chr.endAngle - chr.startAngle - 2) * (chr.score / 100))"
                        fill="none"
                        [attr.stroke]="chr.color"
                        stroke-width="28"
                        stroke-linecap="round"
                        [attr.opacity]="0.7"
                        class="chromosome-arc-fill"/>
                      <!-- Chromosome label -->
                      <text
                        [attr.x]="getLabelPosition(chr.startAngle, chr.endAngle, 320).x"
                        [attr.y]="getLabelPosition(chr.startAngle, chr.endAngle, 320).y"
                        text-anchor="middle"
                        dominant-baseline="central"
                        fill="#94a3b8"
                        font-size="9"
                        font-weight="500"
                        class="select-none">
                        {{ chr.shortLabel || chr.label }}
                      </text>
                    </g>
                  }

                  <!-- Middle Ring: Genes -->
                  @for (gene of genome().genes; track gene.id; let gi = $index) {
                    <g class="gene-node" (click)="selectGene(gene)" style="cursor:pointer">
                      <!-- Gene segment -->
                      <path
                        [attr.d]="describeArc(350, 350, 260, gene.startAngle, gene.endAngle)"
                        fill="none"
                        [attr.stroke]="gene.color"
                        stroke-width="16"
                        stroke-linecap="butt"
                        [attr.opacity]="selectedGene()?.id === gene.id ? 1 : 0.65"
                        [attr.filter]="selectedGene()?.id === gene.id ? 'url(#glow-green)' : ''"
                        class="gene-segment"/>
                      <!-- Gene tick mark -->
                      <line
                        [attr.x1]="polarToCartesian(350, 350, 250, (gene.startAngle + gene.endAngle) / 2).x"
                        [attr.y1]="polarToCartesian(350, 350, 250, (gene.startAngle + gene.endAngle) / 2).y"
                        [attr.x2]="polarToCartesian(350, 350, 270, (gene.startAngle + gene.endAngle) / 2).x"
                        [attr.y2]="polarToCartesian(350, 350, 270, (gene.startAngle + gene.endAngle) / 2).y"
                        [attr.stroke]="gene.color"
                        stroke-width="1"
                        opacity="0.3"/>
                    </g>
                  }

                  <!-- Inner Ring: Protein Links (Bezier curves between connected genes) -->
                  @for (protein of genome().proteins; track protein.id) {
                    <path
                      [attr.d]="getProteinPath(protein)"
                      fill="none"
                      [attr.stroke]="protein.color || '#06b6d4'"
                      stroke-width="1"
                      opacity="0.2"
                      stroke-linecap="round"
                      class="protein-link"/>
                  }

                  <!-- Mutation Markers -->
                  @for (mutation of genome().mutations; track mutation.id) {
                    <g class="mutation-marker">
                      <polygon
                        [attr.points]="getMutationDiamond(mutation)"
                        fill="#ef4444"
                        opacity="0.8"
                        filter="url(#glow-red)"
                        class="mutation-diamond"/>
                      <!-- Mutation pulse ring -->
                      <circle
                        [attr.cx]="getMutationPosition(mutation).x"
                        [attr.cy]="getMutationPosition(mutation).y"
                        r="8"
                        fill="none"
                        stroke="#ef4444"
                        stroke-width="1"
                        opacity="0.4"
                        class="mutation-pulse"/>
                    </g>
                  }

                  <!-- Center Nucleus -->
                  <g class="nucleus-group">
                    <!-- Outer glow ring -->
                    <circle cx="350" cy="350" r="90"
                      fill="none"
                      [attr.stroke]="genome().nucleus.color + '20'"
                      stroke-width="2"
                      class="nucleus-outer-ring"/>
                    <!-- Nucleus background -->
                    <circle cx="350" cy="350" r="80"
                      [attr.fill]="genome().nucleus.color + '15'"
                      [attr.stroke]="genome().nucleus.color + '40'"
                      stroke-width="1.5"
                      filter="url(#nucleus-glow)"
                      class="nucleus-bg"/>
                    <!-- Nucleus pulse circle -->
                    <circle cx="350" cy="350" r="65"
                      [attr.fill]="genome().nucleus.color + '25'"
                      class="nucleus-pulse"/>
                    <!-- Inner core -->
                    <circle cx="350" cy="350" r="50"
                      [attr.fill]="genome().nucleus.color + '30'"
                      [attr.stroke]="genome().nucleus.color + '60'"
                      stroke-width="1"/>
                    <!-- Score text -->
                    <text x="350" y="342" text-anchor="middle" dominant-baseline="central"
                      [attr.fill]="genome().nucleus.color" font-size="32" font-weight="700" class="select-none">
                      {{ genome().nucleus.score }}
                    </text>
                    <!-- Label -->
                    <text x="350" y="370" text-anchor="middle" fill="#94a3b8" font-size="10" class="select-none">
                      {{ genome().nucleus.label }}
                    </text>
                  </g>

                  <!-- Decorative: Orbital dots -->
                  @for (dot of orbitalDots; track dot.angle) {
                    <circle
                      [attr.cx]="polarToCartesian(350, 350, dot.radius, dot.angle).x"
                      [attr.cy]="polarToCartesian(350, 350, dot.radius, dot.angle).y"
                      [attr.r]="dot.size"
                      [attr.fill]="dot.color"
                      [attr.opacity]="dot.opacity"
                      class="orbital-dot"/>
                  }
                </svg>
              </div>

              <!-- Stats Bar -->
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-6 relative">
                @if (genome().stats) {
                  <div class="bg-white/60 border border-slate-200 rounded-xl p-3 text-center">
                    <div class="text-lg font-bold text-slate-900">{{ genome().stats.totalGenes }}</div>
                    <div class="text-xs text-slate-500">{{ lang.l('Geenid', 'Genes') }}</div>
                  </div>
                  <div class="bg-white/60 border border-blue-200 rounded-xl p-3 text-center">
                    <div class="text-lg font-bold text-blue-600">{{ genome().stats.healthyGenes }}</div>
                    <div class="text-xs text-slate-500">{{ lang.l('Terved', 'Healthy') }}</div>
                  </div>
                  <div class="bg-white/60 border border-amber-500/20 rounded-xl p-3 text-center">
                    <div class="text-lg font-bold text-amber-400">{{ genome().stats.impairedGenes }}</div>
                    <div class="text-xs text-slate-500">{{ lang.l('Kahjustatud', 'Impaired') }}</div>
                  </div>
                  <div class="bg-white/60 border border-red-500/20 rounded-xl p-3 text-center">
                    <div class="text-lg font-bold text-red-400">{{ genome().stats.criticalGenes }}</div>
                    <div class="text-xs text-slate-500">{{ lang.l('Kriitilised', 'Critical') }}</div>
                  </div>
                  <div class="bg-white/60 border border-blue-500/20 rounded-xl p-3 text-center">
                    <div class="text-lg font-bold text-blue-500">{{ genome().stats.proteinLinks }}</div>
                    <div class="text-xs text-slate-500">{{ lang.l('Seosed', 'Links') }}</div>
                  </div>
                  <div class="bg-white/60 border border-rose-500/20 rounded-xl p-3 text-center">
                    <div class="text-lg font-bold text-rose-400">{{ genome().stats.mutations }}</div>
                    <div class="text-xs text-slate-500">{{ lang.l('Mutatsioonid', 'Mutations') }}</div>
                  </div>
                }
              </div>
            </div>

            <!-- Legend -->
            <div class="bg-white border border-slate-200 rounded-2xl p-5 mt-4">
              <h3 class="text-sm font-semibold text-slate-600 mb-3">{{ lang.l('Legend', 'Legend') }}</h3>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-3 rounded-full bg-blue-600/60"></div>
                  <span class="text-slate-400">{{ lang.l('Terve geen (80%+)', 'Healthy gene (80%+)') }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-8 h-3 rounded-full bg-amber-500/60"></div>
                  <span class="text-slate-400">{{ lang.l('Kahjustatud geen (50-79%)', 'Impaired gene (50-79%)') }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-8 h-3 rounded-full bg-red-500/60"></div>
                  <span class="text-slate-400">{{ lang.l('Kriitiline geen (<50%)', 'Critical gene (<50%)') }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-red-400" viewBox="0 0 16 16"><polygon points="8,2 14,8 8,14 2,8" fill="currentColor"/></svg>
                  <span class="text-slate-400">{{ lang.l('Mutatsioon (risk)', 'Mutation (risk)') }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Gene Detail Side Panel -->
          <div class="xl:col-span-4 space-y-4">
            @if (selectedGene()) {
              <div class="bg-white border border-slate-200 rounded-2xl p-5 relative gene-detail-panel">
                <!-- Close button -->
                <button (click)="selectedGene.set(null)"
                  class="absolute top-3 right-3 w-8 h-8 rounded-lg bg-slate-200/50 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>

                <!-- Gene name -->
                <div class="mb-4 pr-8">
                  <div class="text-xs font-mono text-slate-500 mb-1">{{ selectedGene().articleRef }}</div>
                  <h3 class="text-lg font-bold text-slate-900">{{ selectedGene().name }}</h3>
                  <p class="text-xs text-slate-400 mt-1">{{ selectedGene().description }}</p>
                </div>

                <!-- Score gauge (circular progress) -->
                <div class="flex justify-center mb-5">
                  <div class="relative w-28 h-28">
                    <svg viewBox="0 0 120 120" class="w-full h-full">
                      <!-- Track -->
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" stroke-width="8" stroke-linecap="round"/>
                      <!-- Progress -->
                      <circle cx="60" cy="60" r="50" fill="none"
                        [attr.stroke]="selectedGene().color"
                        stroke-width="8"
                        stroke-linecap="round"
                        [attr.stroke-dasharray]="2 * 3.14159 * 50"
                        [attr.stroke-dashoffset]="2 * 3.14159 * 50 * (1 - selectedGene().score / 100)"
                        transform="rotate(-90 60 60)"
                        class="transition-all duration-700"/>
                      <!-- Score number -->
                      <text x="60" y="56" text-anchor="middle" dominant-baseline="central"
                        [attr.fill]="selectedGene().color" font-size="22" font-weight="700">
                        {{ selectedGene().score }}
                      </text>
                      <text x="60" y="74" text-anchor="middle" fill="#64748b" font-size="9">
                        {{ lang.l('skoor', 'score') }}
                      </text>
                    </svg>
                  </div>
                </div>

                <!-- Gene details grid -->
                <div class="space-y-3">
                  <!-- Pillar -->
                  <div class="flex items-center justify-between bg-white/40 rounded-lg px-3 py-2">
                    <span class="text-xs text-slate-500">{{ lang.l('Sammas', 'Pillar') }}</span>
                    <span class="text-sm font-medium text-slate-600">{{ selectedGene().pillarName }}</span>
                  </div>
                  <!-- Evidence -->
                  <div class="flex items-center justify-between bg-white/40 rounded-lg px-3 py-2">
                    <span class="text-xs text-slate-500">{{ lang.l('Toeendid', 'Evidence') }}</span>
                    <span class="text-sm font-medium text-blue-500">{{ selectedGene().evidenceCount || 0 }}</span>
                  </div>
                  <!-- Remediations -->
                  <div class="flex items-center justify-between bg-white/40 rounded-lg px-3 py-2">
                    <span class="text-xs text-slate-500">{{ lang.l('Parandusmeetmed', 'Remediations') }}</span>
                    <span class="text-sm font-medium text-violet-400">{{ selectedGene().remediationCount || 0 }}</span>
                  </div>
                  <!-- Status -->
                  <div class="flex items-center justify-between bg-white/40 rounded-lg px-3 py-2">
                    <span class="text-xs text-slate-500">{{ lang.l('Staatus', 'Status') }}</span>
                    <span class="text-xs font-semibold px-2 py-0.5 rounded-full"
                      [class]="selectedGene().score >= 80
                        ? 'bg-blue-100 text-blue-600'
                        : selectedGene().score >= 50
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'">
                      {{ selectedGene().score >= 80
                        ? lang.l('Terve', 'Healthy')
                        : selectedGene().score >= 50
                          ? lang.l('Kahjustatud', 'Impaired')
                          : lang.l('Kriitiline', 'Critical') }}
                    </span>
                  </div>
                </div>

                <!-- Score breakdown -->
                @if (selectedGene().breakdown) {
                  <div class="mt-5 space-y-2">
                    <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">{{ lang.l('Skoori jaotus', 'Score Breakdown') }}</h4>
                    @for (item of selectedGene().breakdown; track item.label) {
                      <div>
                        <div class="flex justify-between text-xs mb-1">
                          <span class="text-slate-400">{{ item.label }}</span>
                          <span class="text-slate-600 font-medium">{{ item.value }}%</span>
                        </div>
                        <div class="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div class="h-full rounded-full transition-all duration-500"
                            [style.width.%]="item.value"
                            [class]="item.value >= 80 ? 'bg-blue-600' : item.value >= 50 ? 'bg-amber-500' : 'bg-red-500'">
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }

                <!-- Linked genes -->
                @if (selectedGene().linkedGenes && selectedGene().linkedGenes.length > 0) {
                  <div class="mt-5">
                    <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{{ lang.l('Seotud geenid', 'Linked Genes') }}</h4>
                    <div class="flex flex-wrap gap-1.5">
                      @for (linked of selectedGene().linkedGenes; track linked) {
                        <span class="text-xs bg-blue-50 text-blue-500 border border-blue-500/20 rounded-md px-2 py-0.5">{{ linked }}</span>
                      }
                    </div>
                  </div>
                }
              </div>
            } @else {
              <!-- Placeholder when no gene selected -->
              <div class="bg-white border border-slate-200 rounded-2xl p-8 text-center">
                <div class="w-16 h-16 rounded-2xl bg-slate-200/30 flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/>
                  </svg>
                </div>
                <h3 class="text-sm font-semibold text-slate-400 mb-1">{{ lang.l('Vali geen', 'Select a Gene') }}</h3>
                <p class="text-xs text-slate-500">{{ lang.l('Kliki genoomil geeni detailide vaatamiseks', 'Click on a gene in the genome to view its details') }}</p>
              </div>
            }

            <!-- Quick overview stats -->
            <div class="bg-white border border-slate-200 rounded-2xl p-5">
              <h3 class="text-sm font-semibold text-slate-600 mb-3">{{ lang.l('Kiire ulevaade', 'Quick Overview') }}</h3>
              @if (genome().stats) {
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-slate-500">{{ lang.l('Toeendid kokku', 'Total Evidence') }}</span>
                    <span class="text-sm font-bold text-slate-900">{{ genome().stats.totalEvidence }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-slate-500">{{ lang.l('Parandusmeetmed', 'Remediations') }}</span>
                    <span class="text-sm font-bold text-slate-900">{{ genome().stats.totalRemediations }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-slate-500">{{ lang.l('Intsidendid', 'Incidents') }}</span>
                    <span class="text-sm font-bold text-slate-900">{{ genome().stats.totalIncidents }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-slate-500">{{ lang.l('IKT pakkujad', 'ICT Providers') }}</span>
                    <span class="text-sm font-bold text-slate-900">{{ genome().stats.totalProviders }}</span>
                  </div>
                </div>
              }
            </div>

            <!-- Chromosome breakdown -->
            <div class="bg-white border border-slate-200 rounded-2xl p-5">
              <h3 class="text-sm font-semibold text-slate-600 mb-3">{{ lang.l('Kromosoomid', 'Chromosomes') }}</h3>
              <div class="space-y-2">
                @for (chr of genome().chromosomes; track chr.id) {
                  <div class="bg-white/40 rounded-lg px-3 py-2">
                    <div class="flex items-center justify-between mb-1">
                      <div class="flex items-center gap-2">
                        <div class="w-2.5 h-2.5 rounded-full" [style.background]="chr.color"></div>
                        <span class="text-xs font-medium text-slate-600">{{ chr.label }}</span>
                      </div>
                      <span class="text-xs font-bold" [style.color]="chr.color">{{ chr.score }}%</span>
                    </div>
                    <div class="h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-700"
                        [style.width.%]="chr.score"
                        [style.background]="chr.color">
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ========== TAB: HISTORY ========== -->
      @if (!loading() && genome() && activeTab() === 'history') {
        <div class="space-y-6">
          @if (history().length === 0) {
            <div class="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <p class="text-slate-400">{{ lang.l('Ajalugu pole veel saadaval. Tehke mitu hindamist, et naha genoomi arengut.', 'No history available yet. Complete multiple assessments to see genome evolution.') }}</p>
            </div>
          } @else {
            <!-- Timeline header -->
            <div class="bg-white border border-slate-200 rounded-2xl p-5">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-slate-900">{{ lang.l('Genoomi evolutsioon', 'Genome Evolution') }}</h2>
                <span class="text-xs text-slate-500">{{ history().length }} {{ lang.l('hetkeseisu', 'snapshots') }}</span>
              </div>

              <!-- Timeline -->
              <div class="relative">
                <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200/50"></div>
                <div class="space-y-4">
                  @for (snap of history(); track snap.assessmentId; let si = $index) {
                    <div class="flex gap-4 relative">
                      <!-- Timeline dot -->
                      <div class="relative z-10 flex-shrink-0">
                        <button
                          (click)="toggleSnapshotSelection(snap.assessmentId)"
                          class="w-12 h-12 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all"
                          [class]="isSnapshotSelected(snap.assessmentId)
                            ? 'border-blue-400 bg-blue-100 text-blue-500'
                            : 'border-slate-300 bg-white text-slate-400 hover:border-slate-500'">
                          {{ snap.overallScore }}
                        </button>
                      </div>

                      <!-- Snapshot card -->
                      <div class="flex-1 bg-white/40 border border-slate-200 rounded-xl p-4"
                        [ngClass]="{'ring-1 ring-blue-600/40': isSnapshotSelected(snap.assessmentId)}">
                        <div class="flex items-center justify-between mb-3">
                          <div>
                            <div class="text-sm font-semibold text-slate-900">
                              {{ lang.l('Hindamine', 'Assessment') }} #{{ history().length - si }}
                            </div>
                            <div class="text-xs text-slate-500">{{ snap.date | date:'dd.MM.yyyy HH:mm' }}</div>
                          </div>
                          <div class="text-right">
                            <div class="text-lg font-bold"
                              [class]="snap.overallScore >= 80 ? 'text-blue-600' : snap.overallScore >= 50 ? 'text-amber-400' : 'text-red-400'">
                              {{ snap.overallScore }}%
                            </div>
                          </div>
                        </div>

                        <!-- Mini pillar bars -->
                        <div class="grid grid-cols-5 gap-1.5">
                          @for (pillar of snap.pillarScores; track pillar.pillarId) {
                            <div>
                              <div class="h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div class="h-full rounded-full transition-all"
                                  [style.width.%]="pillar.score"
                                  [class]="pillar.score >= 80 ? 'bg-blue-600' : pillar.score >= 50 ? 'bg-amber-500' : 'bg-red-500'">
                                </div>
                              </div>
                              <div class="text-[8px] text-slate-600 text-center mt-0.5">P{{ pillar.pillarId }}</div>
                            </div>
                          }
                        </div>

                        <!-- Mini genome preview SVG -->
                        <div class="flex justify-center mt-3">
                          <svg viewBox="0 0 80 80" class="w-16 h-16">
                            <circle cx="40" cy="40" r="35" fill="none" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="2 3"/>
                            @for (ps of snap.pillarScores; track ps.pillarId; let pi = $index) {
                              <path
                                [attr.d]="describeArc(40, 40, 30, pi * 72 + 2, pi * 72 + 70)"
                                fill="none"
                                [attr.stroke]="ps.score >= 80 ? '#10b981' : ps.score >= 50 ? '#f59e0b' : '#ef4444'"
                                stroke-width="4"
                                stroke-linecap="round"
                                [attr.opacity]="0.6"/>
                            }
                            <circle cx="40" cy="40" r="12"
                              [attr.fill]="snap.overallScore >= 80 ? '#10b98130' : snap.overallScore >= 50 ? '#f59e0b30' : '#ef444430'"/>
                            <text x="40" y="42" text-anchor="middle" dominant-baseline="central" fill="#e2e8f0" font-size="8" font-weight="700">
                              {{ snap.overallScore }}
                            </text>
                          </svg>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Compare button -->
            @if (selectedSnapshots().length === 2) {
              <div class="flex justify-center">
                <button (click)="compareSnapshots()"
                  class="px-6 py-3 bg-blue-600 text-slate-900 font-semibold rounded-xl hover:shadow-lg hover:shadow-lg transition-all flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                  {{ lang.l('Voorrdle valitud hetkeseise', 'Compare Selected Snapshots') }}
                </button>
              </div>
            } @else {
              <div class="text-center">
                <p class="text-xs text-slate-500">{{ lang.l('Vali 2 hetkeseisu voordlemiseks', 'Select 2 snapshots to compare') }} ({{ selectedSnapshots().length }}/2)</p>
              </div>
            }
          }
        </div>
      }

      <!-- ========== TAB: COMPARISON ========== -->
      @if (!loading() && genome() && activeTab() === 'comparison') {
        <div class="relative">
          <!-- Premium gate overlay -->
          @if (!sub.isPremium()) {
            <div class="absolute inset-0 z-20 bg-white backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center">
              <div class="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-slate-900 mb-2">{{ lang.l('Premium funktsioon', 'Premium Feature') }}</h3>
              <p class="text-slate-400 text-sm mb-6 max-w-sm text-center">
                {{ lang.l('Genoomi voordlus on saadaval Standard ja Enterprise pakettidega.', 'Genome comparison is available with Standard and Enterprise plans.') }}
              </p>
              <a routerLink="/pricing" class="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all">
                {{ lang.l('Uuenda paketti', 'Upgrade Plan') }}
              </a>
            </div>
          }

          <div class="space-y-6" [class.blur-sm]="!sub.isPremium()" [class.pointer-events-none]="!sub.isPremium()">
            @if (!comparison()) {
              <div class="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                <div class="w-16 h-16 rounded-2xl bg-slate-200/30 flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                </div>
                <h3 class="text-lg font-semibold text-slate-600 mb-2">{{ lang.l('Voordlust pole veel', 'No Comparison Yet') }}</h3>
                <p class="text-sm text-slate-500">{{ lang.l('Mine Ajaloo vahelehele ja vali 2 hetkeseisu voordlemiseks.', 'Go to the History tab and select 2 snapshots to compare.') }}</p>
              </div>
            } @else {
              <!-- Comparison header: Side by side scores -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-white border border-slate-200 rounded-2xl p-5 text-center">
                  <div class="text-xs text-slate-500 mb-1">{{ lang.l('Vanem', 'From') }}</div>
                  <div class="text-3xl font-bold"
                    [class]="comparison().from.score >= 80 ? 'text-blue-600' : comparison().from.score >= 50 ? 'text-amber-400' : 'text-red-400'">
                    {{ comparison().from.score }}%
                  </div>
                  <div class="text-xs text-slate-500 mt-1">{{ comparison().from.date | date:'dd.MM.yyyy' }}</div>
                </div>
                <div class="bg-white border border-slate-200 rounded-2xl p-5 text-center">
                  <div class="text-xs text-slate-500 mb-1">{{ lang.l('Uuem', 'To') }}</div>
                  <div class="text-3xl font-bold"
                    [class]="comparison().to.score >= 80 ? 'text-blue-600' : comparison().to.score >= 50 ? 'text-amber-400' : 'text-red-400'">
                    {{ comparison().to.score }}%
                  </div>
                  <div class="text-xs text-slate-500 mt-1">{{ comparison().to.date | date:'dd.MM.yyyy' }}</div>
                </div>
              </div>

              <!-- Summary cards -->
              <div class="grid grid-cols-3 gap-4">
                <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <div class="text-2xl font-bold text-blue-600">{{ comparison().summary.improved }}</div>
                  <div class="text-xs text-blue-500/70">{{ lang.l('Paranenud', 'Improved') }}</div>
                </div>
                <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                  <div class="text-2xl font-bold text-red-400">{{ comparison().summary.worsened }}</div>
                  <div class="text-xs text-red-300/70">{{ lang.l('Halvenenud', 'Worsened') }}</div>
                </div>
                <div class="bg-slate-500/10 border border-slate-500/20 rounded-xl p-4 text-center">
                  <div class="text-2xl font-bold text-slate-400">{{ comparison().summary.unchanged }}</div>
                  <div class="text-xs text-slate-400/70">{{ lang.l('Muutumata', 'Unchanged') }}</div>
                </div>
              </div>

              <!-- Changes table -->
              <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div class="px-5 py-4 border-b border-slate-200">
                  <h3 class="text-sm font-semibold text-slate-900">{{ lang.l('Muutused', 'Changes') }}</h3>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="text-xs text-slate-500 border-b border-slate-200">
                        <th class="text-left px-4 py-3 font-medium">{{ lang.l('Artikkel', 'Article') }}</th>
                        <th class="text-left px-4 py-3 font-medium">{{ lang.l('Sammas', 'Pillar') }}</th>
                        <th class="text-center px-4 py-3 font-medium">{{ lang.l('Vana', 'From') }}</th>
                        <th class="text-center px-4 py-3 font-medium">{{ lang.l('Uus', 'To') }}</th>
                        <th class="text-center px-4 py-3 font-medium">{{ lang.l('Muutus', 'Delta') }}</th>
                        <th class="text-center px-4 py-3 font-medium">{{ lang.l('Trend', 'Trend') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (change of comparison().changes; track change.article) {
                        <tr class="border-b border-slate-200 hover:bg-slate-50/10 transition-colors">
                          <td class="px-4 py-3 font-medium text-slate-600 font-mono text-xs">{{ change.article }}</td>
                          <td class="px-4 py-3 text-slate-400">{{ change.pillar }}</td>
                          <td class="text-center px-4 py-3">
                            <span class="font-mono text-xs"
                              [class]="change.fromScore >= 80 ? 'text-blue-600' : change.fromScore >= 50 ? 'text-amber-400' : 'text-red-400'">
                              {{ change.fromScore }}%
                            </span>
                          </td>
                          <td class="text-center px-4 py-3">
                            <span class="font-mono text-xs"
                              [class]="change.toScore >= 80 ? 'text-blue-600' : change.toScore >= 50 ? 'text-amber-400' : 'text-red-400'">
                              {{ change.toScore }}%
                            </span>
                          </td>
                          <td class="text-center px-4 py-3">
                            <span class="font-mono text-xs font-bold"
                              [class]="change.delta > 0 ? 'text-blue-600' : change.delta < 0 ? 'text-red-400' : 'text-slate-500'">
                              {{ change.delta > 0 ? '+' : '' }}{{ change.delta }}%
                            </span>
                          </td>
                          <td class="text-center px-4 py-3">
                            <span class="text-xs font-semibold px-2 py-0.5 rounded-full"
                              [class]="change.trend === 'IMPROVED'
                                ? 'bg-blue-50 text-blue-600'
                                : change.trend === 'WORSENED'
                                  ? 'bg-red-500/15 text-red-400'
                                  : 'bg-slate-500/15 text-slate-400'">
                              @if (change.trend === 'IMPROVED') {
                                <svg class="w-3 h-3 inline mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                              }
                              @if (change.trend === 'WORSENED') {
                                <svg class="w-3 h-3 inline mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
                              }
                              {{ change.trend === 'IMPROVED'
                                ? lang.l('Paranenud', 'Improved')
                                : change.trend === 'WORSENED'
                                  ? lang.l('Halvenenud', 'Worsened')
                                  : lang.l('Stabiilne', 'Stable') }}
                            </span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* Nucleus pulse animation */
    .nucleus-pulse {
      animation: nucleusPulse 2.5s ease-in-out infinite;
    }
    @keyframes nucleusPulse {
      0%, 100% { opacity: 0.3; transform-origin: 350px 350px; transform: scale(1); }
      50% { opacity: 0.6; transform-origin: 350px 350px; transform: scale(1.08); }
    }

    .nucleus-outer-ring {
      animation: outerRingPulse 3s ease-in-out infinite;
    }
    @keyframes outerRingPulse {
      0%, 100% { opacity: 0.15; }
      50% { opacity: 0.4; }
    }

    /* Gene segment hover */
    .gene-segment {
      transition: opacity 0.2s ease, stroke-width 0.2s ease;
    }
    .gene-node:hover .gene-segment {
      opacity: 1 !important;
      stroke-width: 20;
    }

    /* Gene fade-in */
    .gene-node {
      animation: geneFadeIn 0.6s ease-out both;
    }
    @for $i from 1 through 80 {
      .gene-node:nth-child(#{$i}) {
        animation-delay: $i * 20ms;
      }
    }
    @keyframes geneFadeIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }

    /* Chromosome arc entrance */
    .chromosome-arc-fill {
      animation: arcGrow 1.2s ease-out both;
    }
    @keyframes arcGrow {
      from { stroke-dasharray: 0 2000; }
      to { stroke-dasharray: 2000 0; }
    }

    /* Protein link fade */
    .protein-link {
      animation: linkFade 1.5s ease-out both;
    }
    @keyframes linkFade {
      from { opacity: 0; }
      to { opacity: 0.2; }
    }

    /* Mutation diamond pulse */
    .mutation-diamond {
      animation: mutationPulse 1.8s ease-in-out infinite;
    }
    @keyframes mutationPulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }

    .mutation-pulse {
      animation: mutationRingPulse 2s ease-out infinite;
    }
    @keyframes mutationRingPulse {
      0% { r: 6; opacity: 0.5; }
      100% { r: 16; opacity: 0; }
    }

    /* Orbital dots float */
    .orbital-dot {
      animation: orbitalFloat 6s ease-in-out infinite;
    }
    .orbital-dot:nth-child(odd) {
      animation-duration: 8s;
      animation-direction: reverse;
    }
    @keyframes orbitalFloat {
      0%, 100% { opacity: 0.2; }
      50% { opacity: 0.5; }
    }

    /* Gene detail panel entrance */
    .gene-detail-panel {
      animation: panelSlideIn 0.3s ease-out;
    }
    @keyframes panelSlideIn {
      from { opacity: 0; transform: translateX(10px); }
      to { opacity: 1; transform: translateX(0); }
    }

    /* Genome SVG container */
    .genome-svg {
      filter: drop-shadow(0 0 40px rgba(16, 185, 129, 0.05));
    }

    /* Scrollbar styling for comparison table */
    .overflow-x-auto::-webkit-scrollbar {
      height: 6px;
    }
    .overflow-x-auto::-webkit-scrollbar-track {
      background: #1e293b;
    }
    .overflow-x-auto::-webkit-scrollbar-thumb {
      background: #475569;
      border-radius: 3px;
    }
  `]
})
export class ComplianceGenomeComponent implements OnInit {
  lang = inject(LangService);
  private api = inject(ApiService);
  sub = inject(SubscriptionService);

  // Signals
  genome = signal<any>(null);
  history = signal<any[]>([]);
  comparison = signal<any>(null);
  loading = signal(true);
  selectedGene = signal<any>(null);
  activeTab = signal<'genome' | 'history' | 'comparison'>('genome');
  selectedSnapshots = signal<string[]>([]);

  // Decorative orbital dots
  orbitalDots = this.generateOrbitalDots();

  ngOnInit(): void {
    this.api.getGenome().subscribe({
      next: (data) => {
        this.genome.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
    this.api.getGenomeHistory().subscribe({
      next: (data) => this.history.set(data.snapshots || [])
    });
  }

  // ==================== SVG HELPERS ====================

  /**
   * Convert polar coordinates (angle in degrees) to cartesian (x, y).
   * 0 degrees is at the top (12 o'clock position).
   */
  polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad)
    };
  }

  /**
   * Generate an SVG arc path from startAngle to endAngle.
   */
  describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
    if (endAngle <= startAngle) return '';
    const start = this.polarToCartesian(cx, cy, r, endAngle);
    const end = this.polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  }

  /**
   * Get label position for a chromosome arc (midpoint of the arc, offset outward).
   */
  getLabelPosition(startAngle: number, endAngle: number, radius: number): { x: number; y: number } {
    const midAngle = (startAngle + endAngle) / 2;
    return this.polarToCartesian(350, 350, radius + 22, midAngle);
  }

  /**
   * Build a quadratic Bezier curve path for a protein link between two genes.
   * The curve passes through the center region for a nice curved look.
   */
  getProteinPath(protein: any): string {
    if (!protein.fromAngle || !protein.toAngle) return '';
    const r = 200; // inner ring radius
    const from = this.polarToCartesian(350, 350, r, protein.fromAngle);
    const to = this.polarToCartesian(350, 350, r, protein.toAngle);
    // Control point pulled toward center for a nice curve
    const angleDiff = Math.abs(protein.toAngle - protein.fromAngle);
    const pullFactor = Math.min(0.6, angleDiff / 360);
    const midAngle = (protein.fromAngle + protein.toAngle) / 2;
    const controlR = r * (1 - pullFactor);
    const control = this.polarToCartesian(350, 350, controlR, midAngle);
    return `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`;
  }

  /**
   * Get position for a mutation marker (on its affected gene's angle).
   */
  getMutationPosition(mutation: any): { x: number; y: number } {
    const angle = mutation.angle || 0;
    return this.polarToCartesian(350, 350, 260, angle);
  }

  /**
   * Get SVG polygon points for a diamond shape at the mutation position.
   */
  getMutationDiamond(mutation: any): string {
    const pos = this.getMutationPosition(mutation);
    const size = 6;
    return `${pos.x},${pos.y - size} ${pos.x + size},${pos.y} ${pos.x},${pos.y + size} ${pos.x - size},${pos.y}`;
  }

  /**
   * Generate decorative orbital dot data.
   */
  private generateOrbitalDots(): Array<{ angle: number; radius: number; size: number; color: string; opacity: number }> {
    const dots: Array<{ angle: number; radius: number; size: number; color: string; opacity: number }> = [];
    const colors = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899'];
    for (let i = 0; i < 24; i++) {
      dots.push({
        angle: (i * 15) + Math.random() * 10,
        radius: 140 + Math.random() * 40,
        size: 1 + Math.random() * 1.5,
        color: colors[i % colors.length],
        opacity: 0.15 + Math.random() * 0.25
      });
    }
    return dots;
  }

  // ==================== GENE SELECTION ====================

  selectGene(gene: any): void {
    if (this.selectedGene()?.id === gene.id) {
      this.selectedGene.set(null);
    } else {
      this.selectedGene.set(gene);
    }
  }

  // ==================== HISTORY & COMPARISON ====================

  toggleSnapshotSelection(assessmentId: string): void {
    const current = this.selectedSnapshots();
    if (current.includes(assessmentId)) {
      this.selectedSnapshots.set(current.filter(id => id !== assessmentId));
    } else if (current.length < 2) {
      this.selectedSnapshots.set([...current, assessmentId]);
    } else {
      // Replace oldest selection
      this.selectedSnapshots.set([current[1], assessmentId]);
    }
  }

  isSnapshotSelected(assessmentId: string): boolean {
    return this.selectedSnapshots().includes(assessmentId);
  }

  compareSnapshots(): void {
    const ids = this.selectedSnapshots();
    if (ids.length !== 2) return;

    // Sort so earlier snapshot is "from"
    const snapA = this.history().find(s => s.assessmentId === ids[0]);
    const snapB = this.history().find(s => s.assessmentId === ids[1]);
    if (!snapA || !snapB) return;

    const fromId = new Date(snapA.date) <= new Date(snapB.date) ? ids[0] : ids[1];
    const toId = fromId === ids[0] ? ids[1] : ids[0];

    this.api.getGenomeComparison(fromId, toId).subscribe({
      next: (data) => {
        this.comparison.set(data);
        this.activeTab.set('comparison');
      }
    });
  }
}
