import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LangService } from '../lang.service';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../api.service';
import { Organization } from '../models';

interface SsoConfig {
  id?: string;
  organizationId: string;
  type: 'SAML2' | 'OIDC';
  status: 'DRAFT' | 'ACTIVE' | 'DISABLED';
  entityId?: string;
  metadataUrl?: string;
  ssoUrl?: string;
  certificate?: string;
  nameIdFormat?: string;
  issuerUrl?: string;
  clientId?: string;
  clientSecret?: string;
  scopes?: string;
  emailAttribute?: string;
  nameAttribute?: string;
  defaultRole?: string;
  autoProvision: boolean;
  allowedDomains?: string;
}

@Component({
  selector: 'app-sso-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-white">
          {{ lang.currentLang === 'et' ? 'SSO seaded' : 'SSO Settings' }}
        </h1>
        <p class="text-sm text-slate-400 mt-1">
          {{ lang.currentLang === 'et' ? 'Seadista SAML2 või OIDC ühekordne sisselogimine oma organisatsioonile' : 'Configure SAML2 or OIDC Single Sign-On for your organization' }}
        </p>
      </div>

      <!-- Enterprise gate -->
      @if (!hasEnterprise()) {
        <div class="bg-slate-800/50 rounded-xl border border-amber-500/30 p-8 text-center">
          <div class="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-white mb-2">Enterprise</h3>
          <p class="text-sm text-slate-400 mb-4">
            {{ lang.currentLang === 'et' ? 'SSO/SAML tugi on saadaval Enterprise plaaniga' : 'SSO/SAML support is available with the Enterprise plan' }}
          </p>
          <a routerLink="/pricing" class="inline-block px-6 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 transition-all">
            {{ lang.currentLang === 'et' ? 'Uuenda plaani' : 'Upgrade Plan' }}
          </a>
        </div>
      } @else {
        <!-- Org selector -->
        @if (organizations().length === 0) {
          <div class="bg-slate-800/50 rounded-xl border border-slate-700/50 p-8 text-center">
            <p class="text-sm text-slate-400">
              {{ lang.currentLang === 'et' ? 'Esmalt loo organisatsioon Meeskonna halduses' : 'First create an organization in Team Management' }}
            </p>
          </div>
        } @else {
          <div class="flex items-center gap-3">
            <label class="text-sm text-slate-400">
              {{ lang.currentLang === 'et' ? 'Organisatsioon' : 'Organization' }}:
            </label>
            <select [(ngModel)]="selectedOrgId" (ngModelChange)="onOrgChange()"
                    class="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50">
              @for (org of organizations(); track org.id) {
                <option [value]="org.id">{{ org.name }}</option>
              }
            </select>
          </div>

          <!-- Existing SSO configs -->
          @for (config of configs(); track config.id) {
            <div class="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                       [ngClass]="config.type === 'SAML2' ? 'bg-gradient-to-br from-blue-400 to-indigo-500' : 'bg-gradient-to-br from-emerald-400 to-cyan-500'">
                    {{ config.type === 'SAML2' ? 'SA' : 'OI' }}
                  </div>
                  <div>
                    <h3 class="text-base font-semibold text-white">{{ config.type }}</h3>
                    <p class="text-xs text-slate-500">{{ config.entityId || config.issuerUrl || 'Not configured' }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 text-[10px] font-bold rounded"
                        [ngClass]="{
                          'bg-emerald-500/20 text-emerald-400': config.status === 'ACTIVE',
                          'bg-slate-600/30 text-slate-400': config.status === 'DRAFT',
                          'bg-red-500/20 text-red-400': config.status === 'DISABLED'
                        }">
                    {{ config.status }}
                  </span>
                  <button (click)="editConfig(config)"
                          class="px-2 py-1 text-xs rounded bg-slate-600/30 text-slate-300 hover:bg-slate-600/50 transition-colors">
                    {{ lang.currentLang === 'et' ? 'Muuda' : 'Edit' }}
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3 text-sm">
                @if (config.type === 'SAML2') {
                  <div>
                    <p class="text-[10px] text-slate-500 uppercase">Entity ID</p>
                    <p class="text-slate-300 truncate">{{ config.entityId || '-' }}</p>
                  </div>
                  <div>
                    <p class="text-[10px] text-slate-500 uppercase">SSO URL</p>
                    <p class="text-slate-300 truncate">{{ config.ssoUrl || '-' }}</p>
                  </div>
                } @else {
                  <div>
                    <p class="text-[10px] text-slate-500 uppercase">Issuer URL</p>
                    <p class="text-slate-300 truncate">{{ config.issuerUrl || '-' }}</p>
                  </div>
                  <div>
                    <p class="text-[10px] text-slate-500 uppercase">Client ID</p>
                    <p class="text-slate-300 truncate">{{ config.clientId || '-' }}</p>
                  </div>
                }
                <div>
                  <p class="text-[10px] text-slate-500 uppercase">
                    {{ lang.currentLang === 'et' ? 'Lubatud domeenid' : 'Allowed Domains' }}
                  </p>
                  <p class="text-slate-300">{{ config.allowedDomains || '-' }}</p>
                </div>
                <div>
                  <p class="text-[10px] text-slate-500 uppercase">Auto-provision</p>
                  <p class="text-slate-300">{{ config.autoProvision ? 'Yes' : 'No' }}</p>
                </div>
              </div>
            </div>
          }

          <!-- Add new config -->
          @if (configs().length === 0) {
            <div class="bg-slate-800/50 rounded-xl border border-dashed border-slate-600/50 p-8 text-center">
              <h3 class="text-lg font-semibold text-white mb-3">
                {{ lang.currentLang === 'et' ? 'Seadista SSO' : 'Configure SSO' }}
              </h3>
              <p class="text-sm text-slate-400 mb-5">
                {{ lang.currentLang === 'et' ? 'Vali oma identiteedipakkuja protokoll' : 'Choose your identity provider protocol' }}
              </p>
              <div class="flex justify-center gap-4">
                <button (click)="startNewConfig('SAML2')"
                        class="px-6 py-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all">
                  <span class="text-lg font-bold block">SAML 2.0</span>
                  <span class="text-xs text-slate-500">Okta, Azure AD, ADFS</span>
                </button>
                <button (click)="startNewConfig('OIDC')"
                        class="px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                  <span class="text-lg font-bold block">OIDC</span>
                  <span class="text-xs text-slate-500">Auth0, Keycloak, Cognito</span>
                </button>
              </div>
            </div>
          } @else {
            <button (click)="startNewConfig('SAML2')"
                    class="px-4 py-2 text-sm rounded-lg bg-slate-700/30 text-slate-300 hover:bg-slate-700/50 transition-colors">
              + {{ lang.currentLang === 'et' ? 'Lisa SSO konfiguratsioon' : 'Add SSO Configuration' }}
            </button>
          }

          <!-- SP metadata info -->
          <div class="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
            <h3 class="text-sm font-semibold text-slate-300 mb-3">
              {{ lang.currentLang === 'et' ? 'Teenusepakkuja andmed (SP)' : 'Service Provider Details (SP)' }}
            </h3>
            <p class="text-xs text-slate-400 mb-3">
              {{ lang.currentLang === 'et' ? 'Kasuta neid andmeid oma identiteedipakkuja seadistamiseks' : 'Use these details to configure your identity provider' }}
            </p>
            <div class="space-y-2">
              <div class="flex items-center justify-between py-2 px-3 rounded bg-slate-700/20">
                <span class="text-xs text-slate-500">ACS URL</span>
                <code class="text-xs text-emerald-400">https://doraaudit.eu/api/auth/sso/callback</code>
              </div>
              <div class="flex items-center justify-between py-2 px-3 rounded bg-slate-700/20">
                <span class="text-xs text-slate-500">Entity ID</span>
                <code class="text-xs text-emerald-400">https://doraaudit.eu</code>
              </div>
              <div class="flex items-center justify-between py-2 px-3 rounded bg-slate-700/20">
                <span class="text-xs text-slate-500">NameID Format</span>
                <code class="text-xs text-emerald-400">urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</code>
              </div>
            </div>
          </div>
        }
      }

      <!-- Edit/Create modal -->
      @if (showModal) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="showModal = false">
          <div class="bg-slate-800 rounded-xl border border-slate-700/50 shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="p-5 border-b border-slate-700/50">
              <h3 class="text-lg font-semibold text-white">
                {{ form.type === 'SAML2' ? 'SAML 2.0' : 'OIDC' }}
                {{ lang.currentLang === 'et' ? 'seaded' : 'Configuration' }}
              </h3>
            </div>
            <div class="p-5 space-y-4">
              <!-- Type selector -->
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">
                  {{ lang.currentLang === 'et' ? 'Protokoll' : 'Protocol' }}
                </label>
                <div class="flex gap-2">
                  <button (click)="form.type = 'SAML2'" class="flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all"
                          [ngClass]="form.type === 'SAML2' ? 'border-blue-500/50 bg-blue-500/10 text-blue-400' : 'border-slate-600/50 text-slate-400 hover:border-slate-500/50'">
                    SAML 2.0
                  </button>
                  <button (click)="form.type = 'OIDC'" class="flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all"
                          [ngClass]="form.type === 'OIDC' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-slate-600/50 text-slate-400 hover:border-slate-500/50'">
                    OpenID Connect
                  </button>
                </div>
              </div>

              @if (form.type === 'SAML2') {
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">IdP Entity ID *</label>
                  <input [(ngModel)]="form.entityId" type="text"
                         class="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
                         placeholder="https://idp.example.com/metadata">
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">IdP SSO URL *</label>
                  <input [(ngModel)]="form.ssoUrl" type="text"
                         class="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
                         placeholder="https://idp.example.com/sso/saml">
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">IdP Metadata URL</label>
                  <input [(ngModel)]="form.metadataUrl" type="text"
                         class="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
                         placeholder="https://idp.example.com/metadata.xml">
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">
                    {{ lang.currentLang === 'et' ? 'IdP X.509 sertifikaat' : 'IdP X.509 Certificate' }} *
                  </label>
                  <textarea [(ngModel)]="form.certificate" rows="4"
                            class="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500/50"
                            placeholder="-----BEGIN CERTIFICATE-----&#10;MIICpDCCA...&#10;-----END CERTIFICATE-----"></textarea>
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">NameID Format</label>
                  <select [(ngModel)]="form.nameIdFormat"
                          class="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50">
                    <option value="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">Email Address</option>
                    <option value="urn:oasis:names:tc:SAML:2.0:nameid-format:persistent">Persistent</option>
                    <option value="urn:oasis:names:tc:SAML:2.0:nameid-format:transient">Transient</option>
                    <option value="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">Unspecified</option>
                  </select>
                </div>
              } @else {
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">Issuer URL *</label>
                  <input [(ngModel)]="form.issuerUrl" type="text"
                         class="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                         placeholder="https://auth.example.com">
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">Client ID *</label>
                  <input [(ngModel)]="form.clientId" type="text"
                         class="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50">
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">Client Secret *</label>
                  <input [(ngModel)]="form.clientSecret" type="password"
                         class="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50">
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">Scopes</label>
                  <input [(ngModel)]="form.scopes" type="text"
                         class="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                         placeholder="openid email profile">
                </div>
              }

              <div class="border-t border-slate-700/50 pt-4">
                <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  {{ lang.currentLang === 'et' ? 'Atribuutide kaardistus' : 'Attribute Mapping' }}
                </h4>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1">
                      {{ lang.currentLang === 'et' ? 'E-posti atribuut' : 'Email Attribute' }}
                    </label>
                    <input [(ngModel)]="form.emailAttribute" type="text"
                           class="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-slate-500/50"
                           placeholder="email">
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1">
                      {{ lang.currentLang === 'et' ? 'Nime atribuut' : 'Name Attribute' }}
                    </label>
                    <input [(ngModel)]="form.nameAttribute" type="text"
                           class="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-slate-500/50"
                           placeholder="displayName">
                  </div>
                </div>
              </div>

              <div class="border-t border-slate-700/50 pt-4">
                <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  {{ lang.currentLang === 'et' ? 'Provisioning' : 'Provisioning' }}
                </h4>
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">
                    {{ lang.currentLang === 'et' ? 'Lubatud domeenid' : 'Allowed Domains' }}
                  </label>
                  <input [(ngModel)]="form.allowedDomains" type="text"
                         class="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-slate-500/50"
                         placeholder="example.com, company.eu">
                  <p class="text-[10px] text-slate-500 mt-1">
                    {{ lang.currentLang === 'et' ? 'Komaga eraldatud domeenid' : 'Comma-separated domains' }}
                  </p>
                </div>
                <label class="flex items-center gap-2 cursor-pointer mt-3">
                  <input [(ngModel)]="form.autoProvision" type="checkbox"
                         class="rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500/30">
                  <span class="text-sm text-slate-300">
                    {{ lang.currentLang === 'et' ? 'Automaatne kasutajate loomine' : 'Auto-provision users' }}
                  </span>
                </label>
              </div>
            </div>
            <div class="p-5 border-t border-slate-700/50 flex justify-end gap-2">
              <button (click)="showModal = false"
                      class="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
                {{ lang.currentLang === 'et' ? 'Tühista' : 'Cancel' }}
              </button>
              <button (click)="saveConfig()"
                      class="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white
                             hover:from-emerald-400 hover:to-cyan-400 transition-all">
                {{ lang.currentLang === 'et' ? 'Salvesta' : 'Save' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class SsoSettingsComponent implements OnInit {
  organizations = signal<Organization[]>([]);
  configs = signal<SsoConfig[]>([]);
  selectedOrgId = '';
  showModal = false;
  form: SsoConfig = this.getEmptyForm();

  constructor(
    public lang: LangService,
    public auth: AuthService,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.api.getOrganizations().subscribe({
      next: (orgs) => {
        this.organizations.set(orgs);
        if (orgs.length > 0) {
          this.selectedOrgId = orgs[0].id;
          this.loadConfigs();
        }
      }
    });
  }

  hasEnterprise(): boolean {
    return true; // Gate this with subscription check in production
  }

  onOrgChange() {
    this.loadConfigs();
  }

  loadConfigs() {
    if (!this.selectedOrgId) return;
    this.api.getSsoConfigs(this.selectedOrgId).subscribe({
      next: (configs) => this.configs.set(configs),
      error: () => this.configs.set([])
    });
  }

  getEmptyForm(): SsoConfig {
    return {
      organizationId: '', type: 'SAML2', status: 'DRAFT',
      autoProvision: true, nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
      scopes: 'openid email profile', emailAttribute: 'email', nameAttribute: 'displayName'
    };
  }

  startNewConfig(type: 'SAML2' | 'OIDC') {
    this.form = this.getEmptyForm();
    this.form.type = type;
    this.form.organizationId = this.selectedOrgId;
    this.showModal = true;
  }

  editConfig(config: SsoConfig) {
    this.form = { ...config };
    this.showModal = true;
  }

  saveConfig() {
    this.form.organizationId = this.selectedOrgId;
    if (this.form.id) {
      this.api.updateSsoConfig(this.selectedOrgId, this.form.id, this.form).subscribe({
        next: () => { this.showModal = false; this.loadConfigs(); }
      });
    } else {
      this.api.createSsoConfig(this.selectedOrgId, this.form).subscribe({
        next: () => { this.showModal = false; this.loadConfigs(); }
      });
    }
  }
}
