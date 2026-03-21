import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LangService } from '../lang.service';

interface PlaybookSection {
  id: string;
  title: string;
  titleEt: string;
  items: PlaybookItem[];
}

interface PlaybookItem {
  id: string;
  text: string;
  textEt: string;
  timing?: string;
  timingEt?: string;
  responsible?: string;
  responsibleEt?: string;
  checked?: boolean;
}

@Component({
  selector: 'app-playbook-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium mb-4">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          DORA Art. 17-23
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">
          {{ lang.t('playbook.title') }}
        </h1>
        <p class="text-slate-400 max-w-2xl mx-auto">
          {{ lang.t('playbook.subtitle') }}
        </p>
      </div>

      <!-- Configuration -->
      <div class="bg-white backdrop-blur border border-slate-200 rounded-2xl p-6">
        <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          {{ lang.t('playbook.configuration') }}
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-slate-400 mb-2">{{ lang.t('playbook.org_name') }}</label>
            <input type="text" [(ngModel)]="orgName"
                   [placeholder]="lang.t('playbook.org_name_placeholder')"
                   class="w-full px-4 py-2 rounded-lg bg-white border border-slate-200 text-white placeholder-slate-500
                          focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all">
          </div>
          <div>
            <label class="block text-sm text-slate-400 mb-2">{{ lang.t('playbook.incident_type') }}</label>
            <select [(ngModel)]="incidentType"
                    class="w-full px-4 py-2 rounded-lg bg-white border border-slate-200 text-white
                           focus:outline-none focus:border-blue-500/50 transition-all">
              <option value="cyber">{{ lang.t('playbook.type_cyber') }}</option>
              <option value="data_breach">{{ lang.t('playbook.type_data_breach') }}</option>
              <option value="service_outage">{{ lang.t('playbook.type_service_outage') }}</option>
              <option value="third_party">{{ lang.t('playbook.type_third_party') }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-slate-400 mb-2">{{ lang.t('playbook.competent_authority') }}</label>
            <select [(ngModel)]="authority"
                    class="w-full px-4 py-2 rounded-lg bg-white border border-slate-200 text-white
                           focus:outline-none focus:border-blue-500/50 transition-all">
              <option value="fi">Finantsinspektsioon (Estonia)</option>
              <option value="bafin">BaFin (Germany)</option>
              <option value="fca">FCA (UK)</option>
              <option value="amf">AMF (France)</option>
              <option value="other">{{ lang.t('playbook.authority_other') }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-slate-400 mb-2">{{ lang.t('playbook.severity_level') }}</label>
            <select [(ngModel)]="severity"
                    class="w-full px-4 py-2 rounded-lg bg-white border border-slate-200 text-white
                           focus:outline-none focus:border-blue-500/50 transition-all">
              <option value="critical">{{ lang.t('playbook.severity_critical') }}</option>
              <option value="major">{{ lang.t('playbook.severity_major') }}</option>
              <option value="minor">{{ lang.t('playbook.severity_minor') }}</option>
            </select>
          </div>
        </div>

        <button type="button" (click)="generatePlaybook()"
                [disabled]="generating"
                class="mt-6 w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-red-500 to-orange-500 text-white
                       hover:from-red-400 hover:to-orange-400 hover:shadow-lg hover:shadow-red-500/25
                       disabled:opacity-50 transition-all flex items-center justify-center gap-2">
          <svg *ngIf="!generating" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <svg *ngIf="generating" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          {{ generating
            ? lang.t('playbook.generating')
            : lang.t('playbook.generate') }}
        </button>
      </div>

      <!-- Generated Playbook -->
      <div *ngIf="playbookGenerated" class="space-y-6 animate-fade-in">
        <!-- Download/Print buttons -->
        <div class="flex justify-end gap-3">
          <button type="button" (click)="printPlaybook()"
                  class="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-600 border border-slate-200
                         hover:bg-slate-100 transition-all flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
            </svg>
            {{ lang.t('playbook.print') }}
          </button>
          <button type="button" (click)="downloadPlaybook()"
                  class="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white
                         hover:shadow-lg hover:shadow-lg transition-all flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            {{ lang.t('playbook.download') }}
          </button>
        </div>

        <!-- Playbook Header -->
        <div class="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-2xl p-6">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-2xl font-bold text-white mb-1">
                {{ lang.t('playbook.playbook_title') }}
              </h2>
              <p class="text-slate-400">{{ orgName || lang.t('playbook.your_org') }}</p>
            </div>
            <div class="text-right">
              <span [class]="getSeverityClass(severity)">
                {{ getSeverityLabel(severity) }}
              </span>
              <p class="text-xs text-slate-500 mt-2">{{ getIncidentTypeLabel(incidentType) }}</p>
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="bg-white backdrop-blur border border-slate-200 rounded-2xl p-6">
          <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ lang.t('playbook.dora_deadlines') }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
              <p class="text-3xl font-bold text-red-400">4h</p>
              <p class="text-xs text-slate-400">{{ lang.t('playbook.initial_notification') }}</p>
            </div>
            <div class="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-center">
              <p class="text-3xl font-bold text-amber-400">24h</p>
              <p class="text-xs text-slate-400">{{ lang.t('playbook.intermediate_report') }}</p>
            </div>
            <div class="bg-blue-50 border border-blue-500/20 rounded-lg p-4 text-center">
              <p class="text-3xl font-bold text-blue-500">72h</p>
              <p class="text-xs text-slate-400">{{ lang.t('playbook.detailed_report') }}</p>
            </div>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p class="text-3xl font-bold text-blue-600">1kuu</p>
              <p class="text-xs text-slate-400">{{ lang.t('playbook.final_report') }}</p>
            </div>
          </div>
        </div>

        <!-- Playbook Sections -->
        <div *ngFor="let section of playbookSections; let i = index"
             class="bg-white backdrop-blur border border-slate-200 rounded-2xl overflow-hidden">
          <div class="px-6 py-4 bg-slate-700/30 flex items-center justify-between cursor-pointer"
               (click)="toggleSection(section.id)">
            <h3 class="text-lg font-semibold text-white flex items-center gap-2">
              <span class="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
                {{ i + 1 }}
              </span>
              {{ l(section.titleEt, section.title) }}
            </h3>
            <svg class="w-5 h-5 text-slate-400 transition-transform" [class.rotate-180]="expandedSections[section.id]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
          <div *ngIf="expandedSections[section.id]" class="p-6 space-y-3 animate-fade-in">
            <div *ngFor="let item of section.items"
                 class="flex items-start gap-3 p-3 rounded-lg bg-slate-900/30 hover:bg-white transition-colors">
              <input type="checkbox" [(ngModel)]="item.checked"
                     class="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500/25">
              <div class="flex-1">
                <p class="text-sm text-slate-700">{{ l(item.textEt, item.text) }}</p>
                <div class="flex items-center gap-4 mt-1">
                  <span *ngIf="item.timing" class="text-xs text-amber-400">
                    {{ l(item.timingEt, item.timing) }}
                  </span>
                  <span *ngIf="item.responsible" class="text-xs text-blue-500">
                    {{ l(item.responsibleEt, item.responsible) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Notification Template -->
        <div class="bg-white backdrop-blur border border-slate-200 rounded-2xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              {{ lang.t('playbook.notification_template') }}
            </h3>
            <button type="button" (click)="copyTemplate()"
                    class="text-xs px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1">
              <svg *ngIf="!templateCopied" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              <svg *ngIf="templateCopied" class="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              {{ templateCopied ? lang.t('playbook.copied') : lang.t('playbook.copy') }}
            </button>
          </div>
          <pre class="text-sm text-slate-700 whitespace-pre-wrap font-sans bg-white rounded-lg p-4 leading-relaxed">{{ getNotificationTemplate() }}</pre>
        </div>

        <!-- Contacts -->
        <div class="bg-white backdrop-blur border border-slate-200 rounded-2xl p-6">
          <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            {{ lang.t('playbook.contacts_escalation') }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-slate-900/30 rounded-lg p-4">
              <p class="text-xs text-slate-500 mb-2">{{ lang.t('playbook.competent_authority') }}</p>
              <p class="text-sm text-white font-medium">{{ getAuthorityName() }}</p>
              <p class="text-xs text-slate-400 mt-1">{{ getAuthorityContact() }}</p>
            </div>
            <div class="bg-slate-900/30 rounded-lg p-4">
              <p class="text-xs text-slate-500 mb-2">{{ lang.t('playbook.internal_escalation') }}</p>
              <p class="text-sm text-white font-medium">CISO \u2192 CRO \u2192 CEO \u2192 Board</p>
              <p class="text-xs text-slate-400 mt-1">{{ lang.t('playbook.based_on_severity') }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PlaybookGeneratorComponent implements OnInit {
  orgName = '';
  incidentType = 'cyber';
  authority = 'fi';
  severity = 'major';

  generating = false;
  playbookGenerated = false;
  templateCopied = false;

  expandedSections: { [key: string]: boolean } = {};
  playbookSections: PlaybookSection[] = [];

  constructor(public lang: LangService) {}

  ngOnInit() {
    this.initializeSections();
  }

  initializeSections() {
    this.playbookSections = [
      {
        id: 'detection',
        title: 'Detection & Initial Assessment',
        titleEt: 'Tuvastamine ja esialgne hindamine',
        items: [
          { id: '1', text: 'Confirm incident occurrence and initial impact assessment', textEt: 'Kinnita intsidendi toimumine ja esialgne m\u00f5juhinnang', timing: '0-15 min', timingEt: '0-15 min', responsible: 'SOC Team', responsibleEt: 'SOC meeskond' },
          { id: '2', text: 'Classify incident severity (Critical/Major/Minor)', textEt: 'M\u00e4\u00e4ra intsidendi kriitilisus (Kriitiline/Suur/V\u00e4ike)', timing: '15-30 min', timingEt: '15-30 min', responsible: 'Incident Manager', responsibleEt: 'Intsidendijuht' },
          { id: '3', text: 'Document initial indicators of compromise', textEt: 'Dokumenteeri esialgsed kompromiteerimise indikaatorid', timing: '30 min', timingEt: '30 min', responsible: 'SOC Analyst', responsibleEt: 'SOC anal\u00fc\u00fctik' },
          { id: '4', text: 'Activate incident response team', textEt: 'Aktiveeri intsidentidele reageerimise meeskond', timing: '30-60 min', timingEt: '30-60 min', responsible: 'CISO', responsibleEt: 'CISO' }
        ]
      },
      {
        id: 'containment',
        title: 'Containment & Isolation',
        titleEt: 'Piiramine ja isoleerimine',
        items: [
          { id: '5', text: 'Isolate affected systems from network', textEt: 'Isoleeri m\u00f5jutatud s\u00fcsteemid v\u00f5rgust', timing: '1-2h', timingEt: '1-2h', responsible: 'IT Security', responsibleEt: 'IT turvalisus' },
          { id: '6', text: 'Preserve forensic evidence', textEt: 'S\u00e4ilita kohtuekspertiisi t\u00f5endid', timing: '2h', timingEt: '2h', responsible: 'Forensics Team', responsibleEt: 'Ekspertiisimeeskond' },
          { id: '7', text: 'Block malicious IPs/domains', textEt: 'Blokeeri pahatahtlikud IP-d/domeenid', timing: '1h', timingEt: '1h', responsible: 'SOC Team', responsibleEt: 'SOC meeskond' },
          { id: '8', text: 'Disable compromised accounts', textEt: 'Keela kompromiteeritud kontod', timing: '1h', timingEt: '1h', responsible: 'IAM Team', responsibleEt: 'IAM meeskond' }
        ]
      },
      {
        id: 'notification',
        title: 'Regulatory Notification (DORA Art. 19)',
        titleEt: 'Regulatiivne teavitus (DORA Art. 19)',
        items: [
          { id: '9', text: 'Prepare initial incident notification form', textEt: 'Valmista ette esialgne intsidendi teavitusvorm', timing: '2-4h', timingEt: '2-4h', responsible: 'Compliance', responsibleEt: 'Vastavus' },
          { id: '10', text: 'Submit initial notification to competent authority', textEt: 'Esita esialgne teavitus p\u00e4devale asutusele', timing: '4h max', timingEt: 'max 4h', responsible: 'CISO', responsibleEt: 'CISO' },
          { id: '11', text: 'Notify affected ICT third-party providers', textEt: 'Teavita m\u00f5jutatud IKT kolmandaid osapooli', timing: '24h', timingEt: '24h', responsible: 'Vendor Management', responsibleEt: 'Tarnijate haldus' },
          { id: '12', text: 'Prepare intermediate report with root cause analysis', textEt: 'Valmista vahearuanne koos juurp\u00f5hjuse anal\u00fc\u00fcsiga', timing: '24h', timingEt: '24h', responsible: 'Incident Team', responsibleEt: 'Intsidendimeeskond' }
        ]
      },
      {
        id: 'recovery',
        title: 'Recovery & Restoration',
        titleEt: 'Taastamine',
        items: [
          { id: '13', text: 'Execute system restoration from clean backups', textEt: 'Teosta s\u00fcsteemi taastamine puhastest varukoopiatest', timing: '24-72h', timingEt: '24-72h', responsible: 'IT Operations', responsibleEt: 'IT operatsioonid' },
          { id: '14', text: 'Verify system integrity before reconnection', textEt: 'Kontrolli s\u00fcsteemi terviklikkust enne taas\u00fchendamist', timing: '72h', timingEt: '72h', responsible: 'Security Team', responsibleEt: 'Turvameeskond' },
          { id: '15', text: 'Implement additional security controls', textEt: 'Rakenda t\u00e4iendavad turvameetmed', timing: '1 week', timingEt: '1 n\u00e4dal', responsible: 'Security Team', responsibleEt: 'Turvameeskond' },
          { id: '16', text: 'Monitor for recurring indicators', textEt: 'J\u00e4lgi korduvaid indikaatoreid', timing: 'Ongoing', timingEt: 'Pidev', responsible: 'SOC Team', responsibleEt: 'SOC meeskond' }
        ]
      },
      {
        id: 'reporting',
        title: 'Final Reporting & Lessons Learned',
        titleEt: 'L\u00f5pparuandlus ja \u00f5pitunnid',
        items: [
          { id: '17', text: 'Complete detailed incident report', textEt: 'Koosta detailne intsidendi aruanne', timing: '72h', timingEt: '72h', responsible: 'Incident Manager', responsibleEt: 'Intsidendijuht' },
          { id: '18', text: 'Submit final report to competent authority', textEt: 'Esita l\u00f5pparuanne p\u00e4devale asutusele', timing: '1 month', timingEt: '1 kuu', responsible: 'CISO', responsibleEt: 'CISO' },
          { id: '19', text: 'Conduct lessons learned session', textEt: 'Vii l\u00e4bi \u00f5pitundide sessioon', timing: '2 weeks', timingEt: '2 n\u00e4dalat', responsible: 'All Teams', responsibleEt: 'K\u00f5ik meeskonnad' },
          { id: '20', text: 'Update incident response procedures', textEt: 'Uuenda intsidendile reageerimise protseduure', timing: '1 month', timingEt: '1 kuu', responsible: 'CISO', responsibleEt: 'CISO' }
        ]
      }
    ];

    // Expand first section by default
    this.expandedSections['detection'] = true;
  }

  generatePlaybook() {
    this.generating = true;
    setTimeout(() => {
      this.playbookGenerated = true;
      this.generating = false;
      // Expand all sections
      this.playbookSections.forEach(s => this.expandedSections[s.id] = true);
    }, 1500);
  }

  toggleSection(id: string) {
    this.expandedSections[id] = !this.expandedSections[id];
  }

  getSeverityClass(severity: string): string {
    const base = 'px-3 py-1 rounded-full text-xs font-bold';
    switch (severity) {
      case 'critical': return base + ' bg-red-500/20 text-red-400 border border-red-500/30';
      case 'major': return base + ' bg-amber-500/20 text-amber-400 border border-amber-500/30';
      default: return base + ' bg-blue-100 text-blue-600 border border-blue-200';
    }
  }

  getSeverityLabel(severity: string): string {
    switch (severity) {
      case 'critical': return this.lang.t('playbook.label_critical');
      case 'major': return this.lang.t('playbook.label_major');
      default: return this.lang.t('playbook.label_minor');
    }
  }

  getIncidentTypeLabel(type: string): string {
    switch (type) {
      case 'cyber': return this.lang.t('playbook.type_cyber');
      case 'data_breach': return this.lang.t('playbook.type_data_breach');
      case 'service_outage': return this.lang.t('playbook.type_service_outage');
      case 'third_party': return this.lang.t('playbook.type_third_party');
      default: return type;
    }
  }

  getAuthorityName(): string {
    switch (this.authority) {
      case 'fi': return 'Finantsinspektsioon';
      case 'bafin': return 'BaFin - Bundesanstalt f\u00fcr Finanzdienstleistungsaufsicht';
      case 'fca': return 'Financial Conduct Authority';
      case 'amf': return 'Autorit\u00e9 des march\u00e9s financiers';
      default: return this.lang.t('playbook.competent_authority');
    }
  }

  getAuthorityContact(): string {
    switch (this.authority) {
      case 'fi': return 'info@fi.ee | +372 668 0500';
      case 'bafin': return 'poststelle@bafin.de | +49 228 4108 0';
      case 'fca': return 'consumer.queries@fca.org.uk | +44 20 7066 1000';
      case 'amf': return 'amf-contact@amf-france.org | +33 1 53 45 60 00';
      default: return '';
    }
  }

  l(et: string | undefined, en: string | undefined): string {
    return this.lang.l(et || en || '', en || et || '');
  }

  getNotificationTemplate(): string {
    const org = this.orgName || this.lang.t('playbook.org_placeholder');

    const etTemplate = `ESIALGNE INTSIDENDI TEAVITUS
DORA Art. 19 kohaselt

Saaja: ${this.getAuthorityName()}
Kuupäev: [Täna]
Saatja: ${org}

1. INTSIDENDI ÜLEVAADE
Intsidendi tüüp: ${this.getIncidentTypeLabel(this.incidentType)}
Kriitilisus: ${this.getSeverityLabel(this.severity)}
Avastamise aeg: [Kuupäev ja kellaaeg]
Mõjutatud süsteemid: [Loetlege mõjutatud süsteemid]

2. ESIALGNE MÕJUHINNANG
Mõjutatud teenused: [Kirjeldage mõjutatud teenuseid]
Mõjutatud kliendid: [Arv või hinnang]
Andmete lekkimine: [Jah/Ei - kui jah, siis kirjeldage]

3. VÕETUD MEETMED
[Loetlege esialgsed piiramismeetmed]

4. JÄRGMISED SAMMUD
Vahearuanne esitatakse: [24h jooksul]
Kontaktisik: [Nimi, telefon, e-post]

---
See teavitus on esitatud DORA määruse (EU 2022/2554) artikli 19 kohaselt.`;

    const enTemplate = `INITIAL INCIDENT NOTIFICATION
Pursuant to DORA Art. 19

To: ${this.getAuthorityName()}
Date: [Today's Date]
From: ${org}

1. INCIDENT OVERVIEW
Incident Type: ${this.getIncidentTypeLabel(this.incidentType)}
Severity: ${this.getSeverityLabel(this.severity)}
Detection Time: [Date and Time]
Affected Systems: [List affected systems]

2. INITIAL IMPACT ASSESSMENT
Affected Services: [Describe affected services]
Affected Clients: [Number or estimate]
Data Breach: [Yes/No - if yes, describe]

3. CONTAINMENT MEASURES TAKEN
[List initial containment measures]

4. NEXT STEPS
Intermediate Report Due: [Within 24h]
Contact Person: [Name, Phone, Email]

---
This notification is submitted pursuant to DORA Regulation (EU 2022/2554) Article 19.`;

    return this.lang.l(etTemplate, enTemplate);
  }

  copyTemplate() {
    navigator.clipboard.writeText(this.getNotificationTemplate());
    this.templateCopied = true;
    setTimeout(() => this.templateCopied = false, 2000);
  }

  printPlaybook() {
    window.print();
  }

  downloadPlaybook() {
    const content = this.generateTextContent();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident-playbook-${this.orgName || 'template'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  generateTextContent(): string {
    const t = (key: string) => this.lang.t(key);
    let content = `${t('playbook.download_title')}\n`;
    content += `${t('playbook.org_label')}: ${this.orgName || 'N/A'}\n`;
    content += `${t('playbook.incident_type_label')}: ${this.getIncidentTypeLabel(this.incidentType)}\n`;
    content += `${t('playbook.severity_label')}: ${this.getSeverityLabel(this.severity)}\n`;
    content += `${t('playbook.generated_label')}: ${new Date().toISOString()}\n\n`;
    content += `${'='.repeat(60)}\n\n`;

    for (const section of this.playbookSections) {
      content += `## ${this.l(section.titleEt, section.title)}\n\n`;
      for (const item of section.items) {
        const text = this.l(item.textEt, item.text);
        const timing = this.l(item.timingEt, item.timing);
        const responsible = this.l(item.responsibleEt, item.responsible);
        content += `[ ] ${text}\n`;
        if (timing) content += `    ${t('playbook.timing_label')}: ${timing}\n`;
        if (responsible) content += `    ${t('playbook.responsible_label')}: ${responsible}\n`;
        content += `\n`;
      }
      content += `\n`;
    }

    content += `${'='.repeat(60)}\n\n`;
    content += `${t('playbook.notification_title')}\n\n`;
    content += this.getNotificationTemplate();

    return content;
  }
}
