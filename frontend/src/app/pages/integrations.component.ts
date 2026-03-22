import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IntegrationService, IntegrationConfig, EventType } from '../services/integration.service';
import { LangService } from '../lang.service';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 pt-24 pb-16 px-4">
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-8">
          <div>
            <a routerLink="/command-center" class="text-sm text-slate-500 hover:text-blue-600 transition-colors">&larr; {{ lang.t('intg.back') }}</a>
            <h1 class="text-2xl font-bold text-slate-900 mt-1">{{ lang.t('intg.title') }}</h1>
            <p class="text-sm text-slate-400 mt-1">{{ lang.t('intg.subtitle') }}</p>
          </div>
        </div>

        <!-- Existing integrations -->
        @if (integrations.length) {
          <div class="space-y-4 mb-8">
            @for (config of integrations; track config.id) {
              <div class="glass-card p-5">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                         [class]="config.type === 'SLACK' ? 'bg-purple-500/20 text-purple-400' : (config.type === 'TEAMS' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400')">
                      {{ config.type === 'SLACK' ? '#' : (config.type === 'TEAMS' ? 'T' : (config.type === 'WEBHOOK' ? '{}' : '@')) }}
                    </div>
                    <div>
                      <h3 class="font-medium text-slate-900">{{ config.name || config.type }}</h3>
                      <p class="text-xs text-slate-500 font-mono">{{ config.webhookUrl ? (config.webhookUrl.substring(0, 50) + '...') : lang.t('intg.no_url') }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button (click)="toggleDeliveryHistory(config.id)" class="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                            [class]="expandedDeliveryId === config.id ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-100/50 text-slate-400 hover:text-slate-600'">
                      {{ expandedDeliveryId === config.id ? 'Hide History' : 'Delivery History' }}
                    </button>
                    <button (click)="toggleEnabled(config)" class="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                            [class]="config.enabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-500/20 text-slate-500'">
                      {{ config.enabled ? lang.t('intg.active') : lang.t('intg.paused') }}
                    </button>
                    <button (click)="testIntegration(config)" class="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs"
                            [disabled]="testing === config.id">
                      {{ testing === config.id ? lang.t('intg.sending') : lang.t('intg.test') }}
                    </button>
                    <button (click)="deleteIntegration(config)" class="text-red-400 hover:text-red-300 text-sm px-2">&#10005;</button>
                  </div>
                </div>
                @if (config.lastTriggeredAt) {
                  <p class="text-[10px] text-slate-600 mt-2">{{ lang.t('intg.last_triggered') }}: {{ config.lastTriggeredAt | date:'medium' }}</p>
                }
                @if (testResults[config.id]) {
                  <p class="text-xs mt-2" [class]="testResults[config.id] === 'success' ? 'text-blue-600' : 'text-red-400'">
                    {{ testResults[config.id] === 'success' ? lang.t('intg.test_success') : lang.t('intg.test_failed') }}
                  </p>
                }

                <!-- Delivery History Section -->
                @if (expandedDeliveryId === config.id) {
                  <div class="mt-4 border-t border-slate-200 pt-4">
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Recent Deliveries</h4>
                      <button (click)="refreshDeliveries(config.id)" class="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">
                        Refresh
                      </button>
                    </div>
                    @if (loadingDeliveries[config.id]) {
                      <div class="flex items-center justify-center py-6">
                        <div class="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin"></div>
                        <span class="ml-2 text-xs text-slate-500">Loading deliveries...</span>
                      </div>
                    } @else if (deliveries[config.id]?.length) {
                      <div class="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                        @for (delivery of deliveries[config.id]; track delivery.id || $index) {
                          <div class="bg-white border border-slate-200 rounded-lg px-3 py-2.5">
                            <div class="flex items-center justify-between gap-2">
                              <div class="flex items-center gap-2 min-w-0">
                                <span class="text-xs font-medium text-slate-900 truncate">{{ delivery.eventType }}</span>
                                <!-- Status badge -->
                                @if (delivery.success) {
                                  <span class="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-600">
                                    Success
                                  </span>
                                } @else if (!delivery.success && delivery.attemptCount < 3) {
                                  <span class="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-400">
                                    Retrying
                                  </span>
                                } @else {
                                  <span class="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/20 text-red-400">
                                    Failed
                                  </span>
                                }
                              </div>
                              <div class="flex items-center gap-3 flex-shrink-0">
                                <span class="text-[10px] text-slate-500 font-mono">{{ delivery.responseCode || '---' }}</span>
                                <span class="text-[10px] text-slate-500">Attempt {{ delivery.attemptCount }}/3</span>
                              </div>
                            </div>
                            <div class="mt-1">
                              <span class="text-[10px] text-slate-600">{{ delivery.deliveredAt | date:'medium' }}</span>
                            </div>
                          </div>
                        }
                      </div>
                    } @else {
                      <div class="text-center py-6">
                        <div class="text-2xl opacity-20 mb-1">&#128229;</div>
                        <p class="text-xs text-slate-600">No deliveries recorded yet</p>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        } @else {
          <div class="glass-card p-8 text-center mb-8">
            <div class="text-4xl mb-3 opacity-30">&#128279;</div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">{{ lang.t('intg.empty_title') }}</h3>
            <p class="text-sm text-slate-400">{{ lang.t('intg.empty_desc') }}</p>
          </div>
        }

        <!-- Add new integration -->
        <div class="glass-card p-6">
          <h2 class="text-lg font-semibold text-slate-900 mb-4">{{ lang.t('intg.add') }}</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm text-slate-400 mb-1">{{ lang.t('intg.type') }}</label>
              <select [(ngModel)]="newConfig.type" class="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900">
                <option value="SLACK">Slack</option>
                <option value="TEAMS">Microsoft Teams</option>
                <option value="WEBHOOK">Custom Webhook</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-slate-400 mb-1">{{ lang.t('intg.name') }}</label>
              <input type="text" [(ngModel)]="newConfig.name" [placeholder]="lang.t('intg.name_placeholder')"
                     class="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900">
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-sm text-slate-400 mb-1">{{ lang.t('intg.webhook_url') }}</label>
            <input type="url" [(ngModel)]="newConfig.webhookUrl"
                   [placeholder]="newConfig.type === 'SLACK' ? 'https://hooks.slack.com/services/...' : (newConfig.type === 'TEAMS' ? 'https://outlook.office.com/webhook/...' : 'https://your-api.com/webhook')"
                   class="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 font-mono text-sm">
          </div>

          <!-- Event selection -->
          <div class="mb-4">
            <label class="block text-sm text-slate-400 mb-2">{{ lang.t('intg.events') }}</label>
            <div class="flex flex-wrap gap-2">
              @for (event of eventTypes; track event.code) {
                <label class="flex items-center gap-2 px-3 py-2 bg-slate-100/30 rounded-lg cursor-pointer hover:bg-white transition-colors">
                  <input type="checkbox" [checked]="isEventSelected(event.code)" (change)="toggleEvent(event.code)" class="w-4 h-4 accent-blue-600">
                  <span class="text-sm text-slate-600">{{ event.label }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Setup instructions -->
          <div class="bg-slate-100/30 rounded-lg p-4 mb-4">
            @if (newConfig.type === 'SLACK') {
              <h4 class="text-sm font-semibold text-slate-600 mb-2">{{ lang.t('intg.slack_setup') }}</h4>
              <ol class="text-xs text-slate-400 space-y-1 list-decimal list-inside">
                <li>{{ lang.t('intg.slack_step1') }}</li>
                <li>{{ lang.t('intg.slack_step2') }}</li>
                <li>{{ lang.t('intg.slack_step3') }}</li>
                <li>{{ lang.t('intg.slack_step4') }}</li>
              </ol>
            }
            @if (newConfig.type === 'TEAMS') {
              <h4 class="text-sm font-semibold text-slate-600 mb-2">{{ lang.t('intg.teams_setup') }}</h4>
              <ol class="text-xs text-slate-400 space-y-1 list-decimal list-inside">
                <li>{{ lang.t('intg.teams_step1') }}</li>
                <li>{{ lang.t('intg.teams_step2') }}</li>
                <li>{{ lang.t('intg.teams_step3') }}</li>
              </ol>
            }
            @if (newConfig.type === 'WEBHOOK') {
              <h4 class="text-sm font-semibold text-slate-600 mb-2">{{ lang.t('intg.custom_webhook') }}</h4>
              <p class="text-xs text-slate-400">{{ lang.t('intg.custom_desc') }}</p>
            }
          </div>

          <button (click)="addIntegration()" [disabled]="!newConfig.webhookUrl || !newConfig.name"
                  class="px-6 py-3 bg-blue-700 hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-30 disabled:cursor-not-allowed">
            {{ lang.t('intg.add') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .glass-card {
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 12px;
      backdrop-filter: blur(12px);
    }
    select option { background: #f1f5f9; color: #e2e8f0; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, 0.3); border-radius: 2px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(100, 116, 139, 0.5); }
  `]
})
export class IntegrationsComponent implements OnInit {
  integrations: IntegrationConfig[] = [];
  eventTypes: EventType[] = [];
  testing: string | null = null;
  testResults: Record<string, string> = {};

  // Delivery history state
  expandedDeliveryId: string | null = null;
  deliveries: Record<string, any[]> = {};
  loadingDeliveries: Record<string, boolean> = {};

  newConfig: any = {
    type: 'SLACK',
    name: '',
    webhookUrl: '',
    events: [] as string[]
  };

  selectedEvents: string[] = [];

  constructor(
    public lang: LangService,
    private integrationService: IntegrationService,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.loadIntegrations();
    this.integrationService.getEventTypes().subscribe(events => {
      this.eventTypes = events;
      this.selectedEvents = events.map(e => e.code); // all selected by default
    });
  }

  loadIntegrations() {
    this.integrationService.list().subscribe(list => this.integrations = list);
  }

  isEventSelected(code: string): boolean {
    return this.selectedEvents.includes(code);
  }

  toggleEvent(code: string) {
    const idx = this.selectedEvents.indexOf(code);
    if (idx >= 0) this.selectedEvents.splice(idx, 1);
    else this.selectedEvents.push(code);
  }

  addIntegration() {
    const payload = {
      type: this.newConfig.type,
      name: this.newConfig.name,
      webhookUrl: this.newConfig.webhookUrl,
      enabled: true,
      events: JSON.stringify(this.selectedEvents)
    };
    this.integrationService.create(payload).subscribe(() => {
      this.loadIntegrations();
      this.newConfig = { type: 'SLACK', name: '', webhookUrl: '', events: [] };
    });
  }

  toggleEnabled(config: IntegrationConfig) {
    this.integrationService.update(config.id, { enabled: !config.enabled } as any).subscribe(() => {
      this.loadIntegrations();
    });
  }

  testIntegration(config: IntegrationConfig) {
    this.testing = config.id;
    this.integrationService.test(config.id).subscribe({
      next: () => {
        this.testResults[config.id] = 'success';
        this.testing = null;
      },
      error: () => {
        this.testResults[config.id] = 'error';
        this.testing = null;
      }
    });
  }

  deleteIntegration(config: IntegrationConfig) {
    this.integrationService.delete(config.id).subscribe(() => {
      this.loadIntegrations();
    });
  }

  toggleDeliveryHistory(integrationId: string) {
    if (this.expandedDeliveryId === integrationId) {
      this.expandedDeliveryId = null;
    } else {
      this.expandedDeliveryId = integrationId;
      if (!this.deliveries[integrationId]) {
        this.loadDeliveries(integrationId);
      }
    }
  }

  refreshDeliveries(integrationId: string) {
    this.loadDeliveries(integrationId);
  }

  private loadDeliveries(integrationId: string) {
    this.loadingDeliveries[integrationId] = true;
    this.apiService.getWebhookDeliveries(integrationId).subscribe({
      next: (data) => {
        this.deliveries[integrationId] = data;
        this.loadingDeliveries[integrationId] = false;
      },
      error: () => {
        this.deliveries[integrationId] = [];
        this.loadingDeliveries[integrationId] = false;
      }
    });
  }
}
