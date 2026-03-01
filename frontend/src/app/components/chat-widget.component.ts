import { Component, HostListener, Inject, PLATFORM_ID, signal, computed, DestroyRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { LangService } from '../lang.service';
import { MarkdownPipe } from '../pipes/markdown.pipe';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedTool?: string;
  suggestedToolName?: string;
}

interface ChatApiResponse {
  reply: string;
  rateLimited: boolean;
  messagesUsed: number;
  messagesLimit: number;
  suggestedTool: string | null;
  suggestedToolName: string | null;
  followups: string[];
}

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownPipe],
  template: `
    @if (isBrowser && !onChatPage()) {
      <!-- Floating bubble -->
      @if (!isOpen()) {
        <button (click)="toggle()" [attr.aria-label]="lang.t('chat.open')"
                class="fixed bottom-5 right-5 z-[9999] w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-110 transition-all duration-300 flex items-center justify-center group">
          <svg class="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          @if (messages().length === 0) {
            <span class="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse"></span>
          }
        </button>
      }

      <!-- Chat panel -->
      @if (isOpen()) {
        <div class="fixed bottom-5 right-5 z-[9999] w-[360px] h-[520px] max-h-[80vh] bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/40 flex flex-col overflow-hidden animate-scale-in">
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 border-b border-slate-700/50">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 font-bold text-xs">AI</div>
              <div>
                <div class="text-sm font-semibold text-white">DoraBot</div>
                <div class="text-[10px] text-emerald-400">{{ lang.t('chat.subtitle') }}</div>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button (click)="exportChat()" [disabled]="messages().length === 0"
                      class="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed"
                      [attr.aria-label]="lang.t('chat.export')">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
              <button (click)="openFullPage()" class="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50" [attr.aria-label]="lang.t('chat.fullpage')">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
              </button>
              <button (click)="toggle()" class="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50" [attr.aria-label]="lang.t('chat.close')">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Messages -->
          <div class="flex-1 overflow-y-auto px-3 py-3 space-y-3 scroll-smooth" #scrollContainer>
            <!-- Welcome message -->
            @if (messages().length === 0) {
              <div class="text-center py-6 space-y-4">
                <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <svg class="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-white">{{ lang.t('chat.welcome_title') }}</p>
                  <p class="text-xs text-slate-400 mt-1">{{ contextGreeting() || lang.t('chat.welcome_desc') }}</p>
                </div>
                <div class="space-y-2">
                  @for (q of quickQuestions(); track q) {
                    <button (click)="sendQuickQuestion(q)" class="w-full text-left text-xs px-3 py-2 rounded-lg bg-slate-800 border border-slate-700/50 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-all">
                      {{ q }}
                    </button>
                  }
                </div>
              </div>
            }

            @for (msg of messages(); track $index) {
              <div class="flex" [class.justify-end]="msg.role === 'user'">
                <div class="max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed"
                     [class.whitespace-pre-wrap]="msg.role === 'user'"
                     [ngClass]="msg.role === 'user'
                       ? 'bg-emerald-600/20 text-emerald-100 border border-emerald-500/20 rounded-br-sm'
                       : 'bg-slate-800 text-slate-200 border border-slate-700/50 rounded-bl-sm'">
                  @if (msg.role === 'user') { {{ msg.content }} }
                  @else {
                    <div [innerHTML]="msg.content | markdown"></div>
                    <div class="flex items-center gap-1 mt-1.5 -mb-0.5">
                      <button (click)="copyMessage(msg.content)" class="p-1 text-slate-600 hover:text-emerald-400 transition-colors rounded" [attr.aria-label]="lang.t('chat.copy')">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          @if (copiedIndex() === $index) {
                            <polyline points="20 6 9 17 4 12"/>
                          } @else {
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          }
                        </svg>
                      </button>
                    </div>
                  }
                  @if (msg.suggestedTool) {
                    <button (click)="navigateToTool(msg.suggestedTool!)"
                            class="mt-2 flex items-center gap-1.5 w-full px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-colors">
                      <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      {{ msg.suggestedToolName || msg.suggestedTool }}
                    </button>
                  }
                </div>
              </div>
            }

            <!-- Typing indicator -->
            @if (loading()) {
              <div class="flex">
                <div class="bg-slate-800 border border-slate-700/50 rounded-xl rounded-bl-sm px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="flex gap-1">
                      <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0ms]"></span>
                      <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:150ms]"></span>
                      <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
                    </div>
                    <span class="text-[10px] text-slate-500 animate-pulse">{{ typingStatus() }}</span>
                  </div>
                </div>
              </div>
            }

            <!-- Follow-up suggestions -->
            @if (followups().length > 0 && !loading()) {
              <div class="flex flex-wrap gap-1.5 pl-1">
                @for (q of followups(); track q) {
                  <button (click)="sendFollowup(q)"
                          class="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all truncate max-w-[95%]">
                    {{ q }}
                  </button>
                }
              </div>
            }

            <!-- Rate limit warning -->
            @if (rateLimited()) {
              <div class="text-center px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
                {{ lang.t('chat.rate_limit') }}
              </div>
            }
          </div>

          <!-- Rate limit counter -->
          @if (messagesUsed() > 0 && messagesLimit() > 0) {
            <div class="px-3 py-1.5 border-t border-slate-800 flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <div class="flex gap-0.5">
                  @for (i of limitDots(); track i) {
                    <span class="w-1.5 h-1.5 rounded-full" [ngClass]="i < messagesUsed() ? 'bg-emerald-400' : 'bg-slate-700'"></span>
                  }
                </div>
                <span class="text-[10px] text-slate-500">{{ messagesUsed() }}/{{ messagesLimit() }}</span>
              </div>
              <button (click)="clearHistory()" class="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
                {{ lang.t('chat.clear') }}
              </button>
            </div>
          }

          <!-- Input -->
          <div class="px-3 py-3 border-t border-slate-700/50 bg-slate-900/80">
            <form (submit)="send($event)" class="flex gap-2 items-end">
              <textarea
                #chatInput
                [(ngModel)]="inputText"
                name="chatInput"
                [placeholder]="lang.t('chat.placeholder')"
                [disabled]="loading()"
                (keydown)="onKeydown($event)"
                rows="1"
                class="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 disabled:opacity-50 resize-none max-h-24 overflow-y-auto"
                autocomplete="off"
              ></textarea>
              <button type="submit" [disabled]="loading() || !inputText.trim()"
                      class="px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
            <div class="text-[10px] text-slate-600 mt-1 text-center">Ctrl+K</div>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    @keyframes scale-in {
      from { transform: scale(0.9) translateY(10px); opacity: 0; }
      to { transform: scale(1) translateY(0); opacity: 1; }
    }
    .animate-scale-in { animation: scale-in 0.2s ease-out; }
    textarea { field-sizing: content; }
  `]
})
export class ChatWidgetComponent {
  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('chatInput') chatInputEl?: ElementRef<HTMLTextAreaElement>;

  isBrowser: boolean;
  isOpen = signal(false);
  onChatPage = signal(false);
  messages = signal<ChatMessage[]>([]);
  loading = signal(false);
  rateLimited = signal(false);
  messagesUsed = signal(0);
  messagesLimit = signal(0);
  copiedIndex = signal<number | null>(null);
  typingStatus = signal('');
  followups = signal<string[]>([]);
  inputText = '';
  private currentPath = '';
  private typingInterval: any;

  limitDots = computed(() => Array.from({ length: this.messagesLimit() }, (_, i) => i));

  /** Page-aware contextual greeting shown when widget opens on specific pages */
  contextGreeting = computed(() => {
    const clean = this.currentPath.replace(/^\/(en|et|lv|lt)\//, '/').replace(/^\/(en|et|lv|lt)$/, '/');
    const l = this.lang.lang();
    const greetings: Record<string, Record<string, string>> = {
      '/assessment': {
        en: 'I see you\'re checking compliance. I can help explain any assessment question or DORA requirement.',
        et: 'N\u00e4en, et kontrollid vastavust. Saan aidata selgitada hindamisk\u00fcsimusi v\u00f5i DORA n\u00f5udeid.',
        lv: 'Redzu, ka p\u0101rbaud\u0101t atbilst\u012bbu. Varu pal\u012bdz\u0113t izskaidrot nov\u0113rt\u0113juma jaut\u0101jumus.',
        lt: 'Matau, kad tikrinate atitikt\u012f. Galiu pad\u0117ti paai\u0161kinti vertinimo klausimus.'
      },
      '/contract-analysis': {
        en: 'Need help with your ICT contract? I know Art. 30 requirements inside out.',
        et: 'Vajad abi IKT-lepinguga? Tunnen Art. 30 n\u00f5udeid p\u00f5hjalikult.',
        lv: 'Vajadz\u012bga pal\u012bdz\u012bba ar IKT l\u012bgumu? Es labi p\u0101rzinu 30. panta pras\u012bbas.',
        lt: 'Reikia pagalbos su IKT sutartimi? Puikiai \u017einau 30 str. reikalavimus.'
      },
      '/incident-reporting': {
        en: 'Reporting an incident? I can guide you through classification and reporting timeline.',
        et: 'Raporteerid intsidenti? Saan juhendada klassifitseerimise ja ajakava osas.',
        lv: 'Zi\u0146ojat par incidentu? Varu pal\u012bdz\u0113t ar klasifik\u0101ciju un termi\u0146iem.',
        lt: 'Prane\u0161ate apie incident\u0105? Galiu pad\u0117ti su klasifikavimu ir terminais.'
      },
      '/tlpt': {
        en: 'Working on TLPT? I can explain threat-led penetration testing under Art. 26-27.',
        et: 'T\u00f6\u00f6tad TLPT-ga? Saan selgitada Art. 26-27 l\u00e4bistustestimise n\u00f5udeid.',
        lv: 'Str\u0101d\u0101jat ar TLPT? Varu izskaidrot 26.-27. panta test\u0113\u0161anas pras\u012bbas.',
        lt: 'Dirbate su TLPT? Galiu paai\u0161kinti 26-27 str. testavimo reikalavimus.'
      },
      '/roi': {
        en: 'Building your Register of Information? I can help with Art. 28 and XBRL templates.',
        et: 'Koostad teaberegistrit? Saan aidata Art. 28 ja XBRL mallidega.',
        lv: 'Veidojat inform\u0101cijas re\u0123istru? Varu pal\u012bdz\u0113t ar 28. pantu un XBRL.',
        lt: 'Kuriate informacijos registr\u0105? Galiu pad\u0117ti su 28 str. ir XBRL.'
      },
      '/dora-explorer': {
        en: 'Exploring DORA articles? Ask me about any specific article or requirement.',
        et: 'Uurid DORA artikleid? K\u00fcsi konkreetse artikli v\u00f5i n\u00f5ude kohta.',
        lv: 'P\u0113t\u0101t DORA pantus? Jaut\u0101jiet par jebkuru pantu vai pras\u012bbu.',
        lt: 'Nar\u0161ote DORA straipsnius? Klauskite apie bet kur\u012f straipsn\u012f.'
      },
      '/training-quiz': {
        en: 'Taking the training quiz? I can explain any DORA concept you find tricky.',
        et: 'Teed koolitustesti? Saan selgitada keerulisi DORA m\u00f5isteid.',
        lv: 'K\u0101rtojat viktor\u012bnu? Varu izskaidrot sare\u017e\u0123\u012btus j\u0113dzienus.',
        lt: 'Laikote viktorin\u0105? Galiu paai\u0161kinti sud\u0117tingas s\u0105vokas.'
      },
      '/concentration-risk': {
        en: 'Analyzing concentration risk? I can help with Art. 29 provider dependency assessment.',
        et: 'Anal\u00fc\u00fcsid kontsentreerumisriski? Saan aidata Art. 29 s\u00f5ltuvuse hindamisega.',
        lv: 'Analiz\u0113jat koncentr\u0101cijas risku? Varu pal\u012bdz\u0113t ar 29. panta nov\u0113rt\u0113jumu.',
        lt: 'Analizuojate koncentracijos rizik\u0105? Galiu pad\u0117ti su 29 str. vertinimu.'
      },
      '/framework-mapping': {
        en: 'Mapping frameworks? I can explain how DORA relates to ISO 27001, NIS2, and GDPR.',
        et: 'Kaardistad raamistikke? Saan selgitada DORA seost ISO 27001, NIS2 ja GDPR-iga.',
        lv: 'Kart\u0113jat ietvarus? Varu izskaidrot DORA saist\u012bbu ar ISO 27001, NIS2 un GDPR.',
        lt: 'Lyginate sistemas? Galiu paai\u0161kinti DORA ry\u0161\u012f su ISO 27001, NIS2 ir GDPR.'
      }
    };
    const g = greetings[clean];
    if (!g) return null;
    return g[l] || g['en'];
  });

  /** Page-aware quick questions — changes based on which page user is on */
  quickQuestions = computed(() => {
    const l = this.lang.lang();
    const clean = this.currentPath.replace(/^\/(en|et|lv|lt)\//, '/').replace(/^\/(en|et|lv|lt)$/, '/');

    const pageQs: Record<string, Record<string, string[]>> = {
      '/assessment': {
        en: ['What are the 5 DORA pillars?', 'How is compliance scored?', 'Which articles cover ICT risk?', 'What does proportionality mean?'],
        et: ['Millised on DORA 5 sammast?', 'Kuidas vastavust hinnatakse?', 'Millised artiklid k\u00e4sitlevad IKT-riski?', 'Mida t\u00e4hendab proportsionaalsus?'],
        lv: ['K\u0101di ir DORA 5 p\u012bl\u0101ri?', 'K\u0101 tiek v\u0113rt\u0113ta atbilst\u012bba?', 'Kuri panti aptver IKT risku?', 'Ko noz\u012bm\u0113 proporcionalit\u0101te?'],
        lt: ['Kokie yra 5 DORA rams\u010diai?', 'Kaip vertinama atitiktis?', 'Kurie straipsniai apima IKT rizik\u0105?', 'K\u0105 rei\u0161kia proporcingumas?']
      },
      '/contract-analysis': {
        en: ['What must Art. 30 contracts include?', 'Subcontracting rules?', 'Exit strategy requirements?', 'Audit rights in ICT contracts?'],
        et: ['Mida peavad Art. 30 lepingud sisaldama?', 'Allhanke reeglid?', 'V\u00e4ljumisstrateegia n\u00f5uded?', 'Auditi\u00f5igused IKT-lepingutes?'],
        lv: ['Ko 30. panta l\u012bgumiem j\u0101ietver?', 'Apak\u0161l\u012bgumu noteikumi?', 'Izejas strat\u0113\u0123ijas pras\u012bbas?', 'Audita ties\u012bbas IKT l\u012bgumos?'],
        lt: ['K\u0105 turi apimti 30 str. sutartys?', 'Subrangos taisykl\u0117s?', 'I\u0161\u0117jimo strategijos reikalavimai?', 'Audito teis\u0117s IKT sutartyse?']
      },
      '/incident-reporting': {
        en: ['What is a major ICT incident?', 'Reporting timeline under Art. 19?', 'Who to report incidents to?', 'Classification criteria?'],
        et: ['Mis on suur IKT-intsident?', 'Raporteerimise ajakava Art. 19?', 'Kellele intsidente raporteerida?', 'Klassifitseerimise kriteeriumid?'],
        lv: ['Kas ir nopietns IKT incidents?', 'Zi\u0146o\u0161anas termi\u0146i 19. pants?', 'Kam zi\u0146ot par incidentiem?', 'Klasifik\u0101cijas krit\u0113riji?'],
        lt: ['Kas yra didelis IKT incidentas?', 'Prane\u0161imo terminai 19 str.?', 'Kam prane\u0161ti apie incidentus?', 'Klasifikavimo kriterijai?']
      },
      '/tlpt': {
        en: ['When is TLPT mandatory?', 'What is TIBER-EU?', 'Who performs TLPT tests?', 'How often must TLPT be done?'],
        et: ['Millal on TLPT kohustuslik?', 'Mis on TIBER-EU?', 'Kes teostab TLPT teste?', 'Kui tihti tuleb TLPT-d teha?'],
        lv: ['Kad TLPT ir oblig\u0101ts?', 'Kas ir TIBER-EU?', 'Kas veic TLPT testus?', 'Cik bie\u017ei j\u0101veic TLPT?'],
        lt: ['Kada TLPT privalomas?', 'Kas yra TIBER-EU?', 'Kas atlieka TLPT testus?', 'Kaip da\u017enai reikia TLPT?']
      },
      '/concentration-risk': {
        en: ['What is ICT concentration risk?', 'Art. 29 requirements?', 'How to assess provider dependency?', 'Multi-vendor strategies?'],
        et: ['Mis on IKT kontsentreerumisrisk?', 'Art. 29 n\u00f5uded?', 'Kuidas hinnata teenusepakkuja s\u00f5ltuvust?', 'Mitmepakkuja strateegiad?'],
        lv: ['Kas ir IKT koncentr\u0101cijas risks?', '29. panta pras\u012bbas?', 'K\u0101 nov\u0113rt\u0113t pakalpojumu sniedz\u0113ja atkar\u012bbu?', 'Daudzu pieg\u0101d\u0101t\u0101ju strat\u0113\u0123ijas?'],
        lt: ['Kas yra IKT koncentracijos rizika?', '29 str. reikalavimai?', 'Kaip vertinti tiek\u0117jo priklausomyb\u0119?', 'Daugialyp\u0117s tiek\u0117j\u0173 strategijos?']
      }
    };

    const specific = pageQs[clean];
    if (specific) return specific[l] || specific['en'];

    const defaults: Record<string, string[]> = {
      en: ['What is DORA and who does it apply to?', 'What must ICT contracts include under Art. 30?', 'How do I report a major ICT incident?', 'What tools does DoraAudit offer?'],
      et: ['Mis on DORA ja kellele see kehtib?', 'Mida peavad IKT-lepingud sisaldama Art. 30 alusel?', 'Kuidas raporteerida suurt IKT-intsidenti?', 'Milliseid t\u00f6\u00f6riistu DoraAudit pakub?'],
      lv: ['Kas ir DORA un kam t\u0101 attiecas?', 'Ko IKT l\u012bgumiem j\u0101ietver saska\u0146\u0101 ar 30. pantu?', 'K\u0101 zi\u0146ot par nopietnu IKT incidentu?', 'K\u0101dus r\u012bkus pied\u0101v\u0101 DoraAudit?'],
      lt: ['Kas yra DORA ir kam ji taikoma?', 'K\u0105 IKT sutartys turi apimti pagal 30 straipsn\u012f?', 'Kaip prane\u0161ti apie didel\u012f IKT incident\u0105?', 'Kokius \u012frankius si\u016blo DoraAudit?']
    };
    return defaults[l] || defaults['en'];
  });

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private http: HttpClient,
    private router: Router,
    public lang: LangService,
    private destroyRef: DestroyRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.currentPath = this.router.url;
    this.onChatPage.set(this.isChatRoute(this.router.url));
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((e: any) => {
      this.currentPath = e.urlAfterRedirects || e.url;
      this.onChatPage.set(this.isChatRoute(this.currentPath));
    });

    if (this.isBrowser) {
      try {
        const saved = localStorage.getItem('dorabot_widget_msgs');
        if (saved) {
          const parsed = JSON.parse(saved) as ChatMessage[];
          this.messages.set(parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
        }
      } catch {}
    }
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent) {
    if (!this.isBrowser || this.onChatPage()) return;
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.toggle();
    }
    if (event.key === 'Escape' && this.isOpen()) {
      this.isOpen.set(false);
    }
  }

  private isChatRoute(url: string): boolean {
    return /\/(chat|en\/chat|et\/chat|lv\/chat|lt\/chat)(\/|$|\?)/.test(url);
  }

  toggle() {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      setTimeout(() => this.chatInputEl?.nativeElement?.focus(), 100);
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send(event);
    }
  }

  send(event: Event) {
    event.preventDefault();
    const text = this.inputText.trim();
    if (!text || this.loading()) return;
    this.inputText = '';
    this.sendMessage(text);
  }

  sendQuickQuestion(q: string) {
    this.sendMessage(q);
  }

  sendFollowup(q: string) {
    this.followups.set([]);
    this.sendMessage(q);
  }

  clearHistory() {
    this.messages.set([]);
    this.rateLimited.set(false);
    this.messagesUsed.set(0);
    this.followups.set([]);
    if (this.isBrowser) localStorage.removeItem('dorabot_widget_msgs');
  }

  copyMessage(content: string) {
    if (!this.isBrowser) return;
    navigator.clipboard.writeText(content).then(() => {
      const idx = this.messages().findIndex(m => m.content === content && m.role === 'assistant');
      this.copiedIndex.set(idx);
      setTimeout(() => this.copiedIndex.set(null), 2000);
    });
  }

  exportChat() {
    if (!this.isBrowser || this.messages().length === 0) return;
    const lines = this.messages().map(m => {
      const time = new Date(m.timestamp).toLocaleTimeString();
      const role = m.role === 'user' ? 'You' : 'DoraBot';
      return `[${time}] ${role}:\n${m.content}\n`;
    });
    const text = `DoraBot Chat Export \u2014 ${new Date().toLocaleDateString()}\n${'='.repeat(40)}\n\n${lines.join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dorabot-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private startTypingAnimation() {
    const statuses = this.getTypingStatuses();
    let i = 0;
    this.typingStatus.set(statuses[0]);
    this.typingInterval = setInterval(() => {
      i = (i + 1) % statuses.length;
      this.typingStatus.set(statuses[i]);
    }, 2500);
  }

  private stopTypingAnimation() {
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
      this.typingInterval = null;
    }
  }

  private getTypingStatuses(): string[] {
    switch (this.lang.lang()) {
      case 'et': return ['Anal\u00fc\u00fcsin...', 'Kontrollin regulatsiooni...', 'Koostan vastust...'];
      case 'lv': return ['Analiz\u0113ju...', 'P\u0101rbaudu regul\u0113jumu...', 'Veido atbildi...'];
      case 'lt': return ['Analizuoju...', 'Tikrinti reglament\u0105...', 'Ruo\u0161iu atsakym\u0105...'];
      default: return ['Analyzing...', 'Checking regulation...', 'Composing answer...'];
    }
  }

  private sendMessage(text: string) {
    this.messages.update(msgs => [...msgs, { role: 'user', content: text, timestamp: new Date() }]);
    this.loading.set(true);
    this.rateLimited.set(false);
    this.followups.set([]);
    this.startTypingAnimation();

    const sessionId = this.isBrowser ? (localStorage.getItem('dora_session_id') || 'anon-' + Math.random().toString(36).substring(2)) : 'ssr';

    this.http.post<ChatApiResponse>('/api/chat/message', {
      message: text,
      sessionId,
      language: this.lang.lang(),
      currentPage: this.currentPath
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.stopTypingAnimation();
        if (res.messagesLimit > 0) {
          this.messagesUsed.set(res.messagesUsed);
          this.messagesLimit.set(res.messagesLimit);
        }
        if (res.rateLimited) {
          this.rateLimited.set(true);
          return;
        }
        this.messages.update(msgs => [...msgs, {
          role: 'assistant',
          content: res.reply,
          timestamp: new Date(),
          suggestedTool: res.suggestedTool || undefined,
          suggestedToolName: res.suggestedToolName || undefined
        }]);
        this.followups.set(res.followups || []);
        this.persistMessages();
        this.scrollToBottom();
      },
      error: () => {
        this.loading.set(false);
        this.stopTypingAnimation();
        const errMsg = this.getErrorMessage();
        this.messages.update(msgs => [...msgs, {
          role: 'assistant',
          content: errMsg,
          timestamp: new Date()
        }]);
        this.persistMessages();
      }
    });

    setTimeout(() => this.scrollToBottom(), 50);
  }

  private getErrorMessage(): string {
    switch (this.lang.lang()) {
      case 'et': return 'Vabandust, tehniline viga. Proovige uuesti.';
      case 'lv': return 'Atvainojiet, tehniska k\u013c\u016bda. M\u0113\u0123iniet v\u0113lreiz.';
      case 'lt': return 'Atsipra\u0161ome, technin\u0117 klaida. Bandykite dar kart\u0105.';
      default: return 'Sorry, an error occurred. Please try again.';
    }
  }

  private persistMessages() {
    if (!this.isBrowser) return;
    try {
      const msgs = this.messages().slice(-20);
      localStorage.setItem('dorabot_widget_msgs', JSON.stringify(msgs));
    } catch {}
  }

  navigateToTool(path: string) {
    const prefix = this.lang.lang() === 'en' ? '' : '/' + this.lang.lang();
    this.router.navigateByUrl(prefix + path);
    this.isOpen.set(false);
  }

  openFullPage() {
    const prefix = this.lang.lang() === 'en' ? '' : '/' + this.lang.lang();
    this.router.navigateByUrl(prefix + '/chat');
    this.isOpen.set(false);
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.scrollContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }
}
