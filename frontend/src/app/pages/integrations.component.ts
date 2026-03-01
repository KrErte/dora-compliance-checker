import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IntegrationService, IntegrationConfig, EventType } from '../services/integration.service';

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-24 pb-16 px-4">
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-8">
          <div>
            <a routerLink="/command-center" class="text-sm text-slate-500 hover:text-emerald-400 transition-colors">&larr; Command Center</a>
            <h1 class="text-2xl font-bold text-white mt-1">Integrations</h1>
            <p class="text-sm text-slate-400 mt-1">Connect Slack, Microsoft Teams, or custom webhooks to receive compliance notifications</p>
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
                      <h3 class="font-medium text-white">{{ config.name || config.type }}</h3>
                      <p class="text-xs text-slate-500 font-mono">{{ config.webhookUrl ? (config.webhookUrl.substring(0, 50) + '...') : 'No URL' }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button (click)="toggleEnabled(config)" class="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                            [class]="config.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-500'">
                      {{ config.enabled ? 'Active' : 'Paused' }}
                    </button>
                    <button (click)="testIntegration(config)" class="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs"
                            [disabled]="testing === config.id">
                      {{ testing === config.id ? 'Sending...' : 'Test' }}
                    </button>
                    <button (click)="deleteIntegration(config)" class="text-red-400 hover:text-red-300 text-sm px-2">&#10005;</button>
                  </div>
                </div>
                @if (config.lastTriggeredAt) {
                  <p class="text-[10px] text-slate-600 mt-2">Last triggered: {{ config.lastTriggeredAt | date:'medium' }}</p>
                }
                @if (testResults[config.id]) {
                  <p class="text-xs mt-2" [class]="testResults[config.id] === 'success' ? 'text-emerald-400' : 'text-red-400'">
                    {{ testResults[config.id] === 'success' ? 'Test message sent successfully!' : 'Test failed. Check your webhook URL.' }}
                  </p>
                }
              </div>
            }
          </div>
        } @else {
          <div class="glass-card p-8 text-center mb-8">
            <div class="text-4xl mb-3 opacity-30">&#128279;</div>
            <h3 class="text-lg font-semibold text-white mb-2">No integrations configured</h3>
            <p class="text-sm text-slate-400">Add your first integration below to receive real-time compliance notifications</p>
          </div>
        }

        <!-- Add new integration -->
        <div class="glass-card p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Add Integration</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm text-slate-400 mb-1">Type</label>
              <select [(ngModel)]="newConfig.type" class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
                <option value="SLACK">Slack</option>
                <option value="TEAMS">Microsoft Teams</option>
                <option value="WEBHOOK">Custom Webhook</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-slate-400 mb-1">Name</label>
              <input type="text" [(ngModel)]="newConfig.name" placeholder="e.g. #compliance-alerts"
                     class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white">
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-sm text-slate-400 mb-1">Webhook URL</label>
            <input type="url" [(ngModel)]="newConfig.webhookUrl"
                   [placeholder]="newConfig.type === 'SLACK' ? 'https://hooks.slack.com/services/...' : (newConfig.type === 'TEAMS' ? 'https://outlook.office.com/webhook/...' : 'https://your-api.com/webhook')"
                   class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white font-mono text-sm">
          </div>

          <!-- Event selection -->
          <div class="mb-4">
            <label class="block text-sm text-slate-400 mb-2">Events to receive</label>
            <div class="flex flex-wrap gap-2">
              @for (event of eventTypes; track event.code) {
                <label class="flex items-center gap-2 px-3 py-2 bg-slate-800/30 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors">
                  <input type="checkbox" [checked]="isEventSelected(event.code)" (change)="toggleEvent(event.code)" class="w-4 h-4 accent-emerald-500">
                  <span class="text-sm text-slate-300">{{ event.label }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Setup instructions -->
          <div class="bg-slate-800/30 rounded-lg p-4 mb-4">
            @if (newConfig.type === 'SLACK') {
              <h4 class="text-sm font-semibold text-slate-300 mb-2">Slack Setup</h4>
              <ol class="text-xs text-slate-400 space-y-1 list-decimal list-inside">
                <li>Go to <span class="text-emerald-400">api.slack.com/apps</span> and create a new app</li>
                <li>Enable "Incoming Webhooks" feature</li>
                <li>Click "Add New Webhook to Workspace"</li>
                <li>Select the channel and copy the webhook URL</li>
              </ol>
            }
            @if (newConfig.type === 'TEAMS') {
              <h4 class="text-sm font-semibold text-slate-300 mb-2">Microsoft Teams Setup</h4>
              <ol class="text-xs text-slate-400 space-y-1 list-decimal list-inside">
                <li>In Teams, go to the channel &rarr; Connectors &rarr; Incoming Webhook</li>
                <li>Name it "DoraAudit" and optionally upload a logo</li>
                <li>Copy the webhook URL provided</li>
              </ol>
            }
            @if (newConfig.type === 'WEBHOOK') {
              <h4 class="text-sm font-semibold text-slate-300 mb-2">Custom Webhook</h4>
              <p class="text-xs text-slate-400">We'll send POST requests with JSON body containing: event, title, message, timestamp, source</p>
            }
          </div>

          <button (click)="addIntegration()" [disabled]="!newConfig.webhookUrl || !newConfig.name"
                  class="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold disabled:opacity-30 disabled:cursor-not-allowed">
            Add Integration
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .glass-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 12px;
      backdrop-filter: blur(12px);
    }
    select option { background: #1e293b; color: #e2e8f0; }
  `]
})
export class IntegrationsComponent implements OnInit {
  integrations: IntegrationConfig[] = [];
  eventTypes: EventType[] = [];
  testing: string | null = null;
  testResults: Record<string, string> = {};

  newConfig: any = {
    type: 'SLACK',
    name: '',
    webhookUrl: '',
    events: [] as string[]
  };

  selectedEvents: string[] = [];

  constructor(private integrationService: IntegrationService) {}

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
}
