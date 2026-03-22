import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LangService } from '../lang.service';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-ai-system-wizard',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">
        <span class="gradient-text">{{ lang.l('Lisa AI s\u00fcsteem', 'Add AI System') }}</span>
      </h1>

      <!-- Progress Steps -->
      <div class="flex items-center gap-2 mb-8">
        @for (s of steps; track s.num; let i = $index) {
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                 [class]="step() >= s.num ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white' : 'bg-slate-100/50 text-slate-500 border border-slate-200'">
              {{ s.num }}
            </div>
            <span class="text-xs hidden sm:inline" [class]="step() >= s.num ? 'text-blue-400' : 'text-slate-500'">{{ lang.l(s.labelEt, s.labelEn) }}</span>
            @if (i < steps.length - 1) {
              <div class="w-8 h-px" [class]="step() > s.num ? 'bg-blue-500' : 'bg-slate-200'"></div>
            }
          </div>
        }
      </div>

      <div class="bg-white backdrop-blur border border-slate-200 rounded-xl p-6">

        <!-- Step 1: Basic Info -->
        @if (step() === 1) {
          <h2 class="text-lg font-semibold text-slate-900 mb-4">{{ lang.l('P\u00f5hiinfo', 'Basic Information') }}</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-slate-400 mb-1">{{ lang.l('Nimi', 'Name') }} *</label>
              <input type="text" [(ngModel)]="form.name" class="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:border-blue-500/50 focus:outline-none" [placeholder]="lang.l('AI s\u00fcsteemi nimi', 'AI system name')">
            </div>
            <div>
              <label class="block text-sm text-slate-400 mb-1">{{ lang.l('Kirjeldus', 'Description') }}</label>
              <textarea [(ngModel)]="form.description" rows="3" class="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:border-blue-500/50 focus:outline-none resize-none" [placeholder]="lang.l('Kirjeldage AI s\u00fcsteemi', 'Describe the AI system')"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-slate-400 mb-1">{{ lang.l('Tarnija', 'Vendor') }}</label>
                <input type="text" [(ngModel)]="form.vendor" class="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:border-blue-500/50 focus:outline-none" [placeholder]="lang.l('nt OpenAI', 'e.g. OpenAI')">
              </div>
              <div>
                <label class="block text-sm text-slate-400 mb-1">{{ lang.l('Versioon', 'Version') }}</label>
                <input type="text" [(ngModel)]="form.version" class="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:border-blue-500/50 focus:outline-none" placeholder="e.g. 1.0">
              </div>
            </div>
          </div>
        }

        <!-- Step 2: Use Context -->
        @if (step() === 2) {
          <h2 class="text-lg font-semibold text-slate-900 mb-4">{{ lang.l('Kasutuskontekst', 'Use Context') }}</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-slate-400 mb-1">{{ lang.l('Kasutuse eesm\u00e4rk', 'Purpose') }}</label>
              <textarea [(ngModel)]="form.purpose" rows="3" class="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:border-blue-500/50 focus:outline-none resize-none" [placeholder]="lang.l('Milleks AI s\u00fcsteemi kasutatakse?', 'What is the AI system used for?')"></textarea>
            </div>
            <div>
              <label class="block text-sm text-slate-400 mb-2">{{ lang.l('Juurutuskontekst', 'Deployment Context') }}</label>
              <div class="grid grid-cols-2 gap-3">
                @for (ctx of deploymentContexts; track ctx.value) {
                  <button type="button" (click)="form.deploymentContext = ctx.value"
                          class="p-3 rounded-lg border text-left text-sm transition-all"
                          [class]="form.deploymentContext === ctx.value ? 'border-blue-500/50 bg-blue-500/10 text-blue-300' : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300'">
                    <p class="font-medium">{{ lang.l(ctx.labelEt, ctx.labelEn) }}</p>
                    <p class="text-[10px] mt-0.5 opacity-70">{{ lang.l(ctx.descEt, ctx.descEn) }}</p>
                  </button>
                }
              </div>
            </div>
          </div>
        }

        <!-- Step 3: Role -->
        @if (step() === 3) {
          <h2 class="text-lg font-semibold text-slate-900 mb-4">{{ lang.l('Organisatsiooni roll', 'Organization Role') }}</h2>
          <p class="text-sm text-slate-400 mb-4">{{ lang.l('Milline on teie organisatsiooni roll AI s\u00fcsteemi suhtes?', 'What is your organization\\'s role regarding this AI system?') }}</p>
          <div class="space-y-3">
            @for (role of orgRoles; track role.value) {
              <button type="button" (click)="form.organizationRole = role.value"
                      class="w-full p-4 rounded-lg border text-left transition-all"
                      [class]="form.organizationRole === role.value ? 'border-blue-500/50 bg-blue-500/10 text-blue-300' : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300'">
                <p class="font-medium text-sm">{{ lang.l(role.labelEt, role.labelEn) }}</p>
                <p class="text-xs mt-1 opacity-70">{{ lang.l(role.descEt, role.descEn) }}</p>
              </button>
            }
          </div>
        }

        <!-- Step 4: Summary -->
        @if (step() === 4) {
          <h2 class="text-lg font-semibold text-slate-900 mb-4">{{ lang.l('Kokkuv\u00f5te', 'Summary') }}</h2>
          <div class="space-y-3">
            <div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{{ lang.l('Nimi', 'Name') }}</p>
              <p class="text-sm text-slate-900">{{ form.name }}</p>
            </div>
            @if (form.description) {
              <div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{{ lang.l('Kirjeldus', 'Description') }}</p>
                <p class="text-sm text-slate-600">{{ form.description }}</p>
              </div>
            }
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{{ lang.l('Tarnija', 'Vendor') }}</p>
                <p class="text-sm text-slate-900">{{ form.vendor || '-' }}</p>
              </div>
              <div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{{ lang.l('Versioon', 'Version') }}</p>
                <p class="text-sm text-slate-900">{{ form.version || '-' }}</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{{ lang.l('Kontekst', 'Context') }}</p>
                <p class="text-sm text-slate-900">{{ form.deploymentContext }}</p>
              </div>
              <div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{{ lang.l('Roll', 'Role') }}</p>
                <p class="text-sm text-slate-900">{{ form.organizationRole }}</p>
              </div>
            </div>
          </div>
        }

        <!-- Navigation Buttons -->
        <div class="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
          <button type="button" (click)="prevStep()"
                  class="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                  [class.invisible]="step() === 1">
            {{ lang.l('Tagasi', 'Back') }}
          </button>
          @if (step() < 4) {
            <button type="button" (click)="nextStep()" [disabled]="!canProceed()"
                    class="px-6 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-400 hover:to-purple-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              {{ lang.l('Edasi', 'Next') }}
            </button>
          } @else {
            <button type="button" (click)="submit()" [disabled]="saving()"
                    class="px-6 py-2 rounded-lg text-sm font-medium bg-blue-600 text-slate-900 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2">
              @if (saving()) {
                <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>
              }
              {{ lang.l('Loo s\u00fcsteem', 'Create System') }}
            </button>
          }
        </div>
      </div>
    </div>
  `
})
export class AiSystemWizardComponent {
  lang = inject(LangService);
  private apiService = inject(ApiService);
  private router = inject(Router);

  step = signal(1);
  saving = signal(false);

  form: any = {
    name: '',
    description: '',
    vendor: '',
    version: '',
    purpose: '',
    deploymentContext: 'INTERNAL',
    organizationRole: 'DEPLOYER'
  };

  steps = [
    { num: 1, labelEt: 'P\u00f5hiinfo', labelEn: 'Basic Info' },
    { num: 2, labelEt: 'Kontekst', labelEn: 'Context' },
    { num: 3, labelEt: 'Roll', labelEn: 'Role' },
    { num: 4, labelEt: 'Kokkuv\u00f5te', labelEn: 'Summary' }
  ];

  deploymentContexts = [
    { value: 'INTERNAL', labelEt: 'Sisemine', labelEn: 'Internal', descEt: 'Kasutatakse ainult organisatsiooni sees', descEn: 'Used only within the organization' },
    { value: 'CUSTOMER_FACING', labelEt: 'Kliendile suunatud', labelEn: 'Customer Facing', descEt: 'Otsene kokkupuude klientidega', descEn: 'Direct interaction with customers' },
    { value: 'EMBEDDED', labelEt: 'Manustatud', labelEn: 'Embedded', descEt: 'Osa suuremast s\u00fcsteemist', descEn: 'Part of a larger system' },
    { value: 'STANDALONE', labelEt: 'Iseseisev', labelEn: 'Standalone', descEt: 'Eraldiseisev rakendus', descEn: 'Independent application' }
  ];

  orgRoles = [
    { value: 'PROVIDER', labelEt: 'Pakkuja', labelEn: 'Provider', descEt: 'Arendate v\u00f5i treenite AI s\u00fcsteemi', descEn: 'You develop or train the AI system' },
    { value: 'DEPLOYER', labelEt: 'Juurutaja', labelEn: 'Deployer', descEt: 'Kasutate AI s\u00fcsteemi oma tegevuses', descEn: 'You use the AI system in your operations' },
    { value: 'BOTH', labelEt: 'M\u00f5lemad', labelEn: 'Both', descEt: 'Olete nii pakkuja kui juurutaja', descEn: 'You are both provider and deployer' }
  ];

  canProceed(): boolean {
    if (this.step() === 1) return !!this.form.name.trim();
    return true;
  }

  nextStep() { if (this.canProceed()) this.step.update(s => Math.min(s + 1, 4)); }
  prevStep() { this.step.update(s => Math.max(s - 1, 1)); }

  submit() {
    this.saving.set(true);
    this.apiService.createAiSystem(this.form).subscribe({
      next: (res: any) => {
        this.router.navigate(['/ai-systems', res.id]);
      },
      error: () => this.saving.set(false)
    });
  }
}
