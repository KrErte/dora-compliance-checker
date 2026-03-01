import { Component, Inject, PLATFORM_ID, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownPipe],
  template: `
    <div class="min-h-screen bg-slate-950 pt-20 pb-12">
      <div class="max-w-3xl mx-auto px-4">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium mb-4">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            AI {{ lang.t('chat.badge') }}
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">DoraBot</h1>
          <p class="text-slate-400 text-sm">{{ lang.t('chat.page_desc') }}</p>
        </div>

        <!-- Chat container -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden min-h-[60vh] flex flex-col">
          <!-- Messages area -->
          <div class="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4" #scrollArea>
            @if (messages().length === 0) {
              <!-- Suggested questions grid -->
              <div class="py-8 space-y-6">
                <div class="text-center">
                  <div class="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center mb-4">
                    <svg class="w-10 h-10 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <h2 class="text-lg font-semibold text-white">{{ lang.t('chat.welcome_title') }}</h2>
                  <p class="text-sm text-slate-400 mt-1 max-w-md mx-auto">{{ lang.t('chat.welcome_desc') }}</p>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                  @for (q of suggestedQuestions(); track q) {
                    <button (click)="sendQuickQuestion(q)"
                            class="text-left px-4 py-3 rounded-xl bg-slate-800 border border-slate-700/50 text-sm text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-all hover:bg-slate-800/80">
                      {{ q }}
                    </button>
                  }
                </div>
              </div>
            }

            @for (msg of messages(); track $index) {
              <div class="flex" [class.justify-end]="msg.role === 'user'">
                <div class="flex gap-3 max-w-[85%]" [class.flex-row-reverse]="msg.role === 'user'">
                  <!-- Avatar -->
                  <div class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                       [ngClass]="msg.role === 'user' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-900'">
                    {{ msg.role === 'user' ? '?' : 'AI' }}
                  </div>
                  <div>
                    <div class="px-4 py-3 rounded-xl text-sm leading-relaxed"
                         [class.whitespace-pre-wrap]="msg.role === 'user'"
                         [ngClass]="msg.role === 'user'
                           ? 'bg-emerald-600/20 text-emerald-100 border border-emerald-500/20 rounded-tr-sm'
                           : 'bg-slate-800 text-slate-200 border border-slate-700/50 rounded-tl-sm'">
                      @if (msg.role === 'user') { {{ msg.content }} }
                      @else { <div [innerHTML]="msg.content | markdown"></div> }
                      @if (msg.suggestedTool) {
                        <button (click)="navigateToTool(msg.suggestedTool!)"
                                class="mt-3 flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-colors">
                          <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                          {{ lang.t('chat.try_tool') }}: {{ msg.suggestedToolName || msg.suggestedTool }}
                        </button>
                      }
                    </div>
                    <div class="text-[10px] text-slate-600 mt-1" [class.text-right]="msg.role === 'user'">
                      {{ msg.timestamp | date:'HH:mm' }}
                    </div>
                  </div>
                </div>
              </div>
            }

            @if (loading()) {
              <div class="flex gap-3">
                <div class="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-xs font-bold text-slate-900">AI</div>
                <div class="bg-slate-800 border border-slate-700/50 rounded-xl rounded-tl-sm px-4 py-3">
                  <div class="flex gap-1.5">
                    <span class="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0ms]"></span>
                    <span class="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:150ms]"></span>
                    <span class="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
                  </div>
                </div>
              </div>
            }

            @if (rateLimited()) {
              <div class="text-center px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
                {{ lang.t('chat.rate_limit') }}
              </div>
            }
          </div>

          <!-- Actions bar -->
          @if (messages().length > 0) {
            <div class="px-4 py-2 border-t border-slate-800 flex items-center justify-between">
              @if (messagesLimit() > 0) {
                <div class="flex items-center gap-2">
                  <div class="flex gap-0.5">
                    @for (i of limitDots(); track i) {
                      <span class="w-2 h-2 rounded-full" [ngClass]="i < messagesUsed() ? 'bg-emerald-400' : 'bg-slate-700'"></span>
                    }
                  </div>
                  <span class="text-xs text-slate-500">{{ messagesUsed() }}/{{ messagesLimit() }} {{ lang.t('chat.msgs_used') }}</span>
                </div>
              } @else {
                <div></div>
              }
              <button (click)="clearHistory()" class="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                {{ lang.t('chat.clear') }}
              </button>
            </div>
          }

          <!-- Input -->
          <div class="px-4 sm:px-6 py-4 border-t border-slate-800 bg-slate-900/80">
            <form (submit)="send($event)" class="flex gap-3 items-end">
              <textarea
                [(ngModel)]="inputText"
                name="chatInput"
                [placeholder]="lang.t('chat.placeholder')"
                [disabled]="loading()"
                (keydown)="onKeydown($event)"
                rows="1"
                class="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 disabled:opacity-50 resize-none max-h-32 overflow-y-auto"
                autocomplete="off"
              ></textarea>
              <button type="submit" [disabled]="loading() || !inputText.trim()"
                      class="px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                {{ lang.t('chat.send') }}
              </button>
            </form>
            <div class="text-[10px] text-slate-600 mt-1.5 text-center">{{ lang.t('chat.enter_hint') }}</div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ChatComponent {
  @ViewChild('scrollArea') scrollArea?: ElementRef<HTMLDivElement>;

  isBrowser: boolean;
  messages = signal<ChatMessage[]>([]);
  loading = signal(false);
  rateLimited = signal(false);
  messagesUsed = signal(0);
  messagesLimit = signal(0);
  inputText = '';

  limitDots = computed(() => Array.from({ length: this.messagesLimit() }, (_, i) => i));

  suggestedQuestions = computed(() => {
    const l = this.lang.lang();
    const qs: Record<string, string[]> = {
      en: [
        'What is DORA and who does it apply to?',
        'What must ICT contracts include under Art. 30?',
        'How do I report a major ICT incident?',
        'What are the 5 DORA pillars?',
        'What is TLPT and when is it required?',
        'What tools does DoraAudit offer?'
      ],
      et: [
        'Mis on DORA ja kellele see kehtib?',
        'Mida peavad IKT-lepingud sisaldama Art. 30 alusel?',
        'Kuidas raporteerida suurt IKT-intsidenti?',
        'Millised on DORA 5 sammast?',
        'Mis on TLPT ja millal see on kohustuslik?',
        'Milliseid tööriistu DoraAudit pakub?'
      ],
      lv: [
        'Kas ir DORA un kam t\u0101 attiecas?',
        'Ko IKT l\u012bgumiem j\u0101ietver saska\u0146\u0101 ar 30. pantu?',
        'K\u0101 zi\u0146ot par nopietnu IKT incidentu?',
        'K\u0101di ir DORA 5 p\u012bl\u0101ri?',
        'Kas ir TLPT un kad tas ir nepiecie\u0161ams?',
        'K\u0101dus r\u012bkus pied\u0101v\u0101 DoraAudit?'
      ],
      lt: [
        'Kas yra DORA ir kam ji taikoma?',
        'K\u0105 IKT sutartys turi apimti pagal 30 straipsn\u012f?',
        'Kaip prane\u0161ti apie didel\u012f IKT incident\u0105?',
        'Kokie yra 5 DORA rams\u010diai?',
        'Kas yra TLPT ir kada jis reikalingas?',
        'Kokius \u012frankius si\u016blo DoraAudit?'
      ]
    };
    return qs[l] || qs['en'];
  });

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private http: HttpClient,
    private router: Router,
    public lang: LangService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    // Restore messages from localStorage
    if (this.isBrowser) {
      try {
        const saved = localStorage.getItem('dorabot_page_msgs');
        if (saved) {
          const parsed = JSON.parse(saved) as ChatMessage[];
          this.messages.set(parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
        }
      } catch {}
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

  clearHistory() {
    this.messages.set([]);
    this.rateLimited.set(false);
    this.messagesUsed.set(0);
    if (this.isBrowser) localStorage.removeItem('dorabot_page_msgs');
  }

  private sendMessage(text: string) {
    this.messages.update(msgs => [...msgs, { role: 'user', content: text, timestamp: new Date() }]);
    this.loading.set(true);
    this.rateLimited.set(false);

    const sessionId = this.isBrowser ? (localStorage.getItem('dora_session_id') || 'anon-' + Math.random().toString(36).substring(2)) : 'ssr';

    this.http.post<ChatApiResponse>('/api/chat/message', {
      message: text,
      sessionId,
      language: this.lang.lang(),
      currentPage: this.isBrowser ? window.location.pathname : '/chat'
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
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
        this.persistMessages();
        this.scrollToBottom();
      },
      error: () => {
        this.loading.set(false);
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
      case 'lv': return 'Atvainojiet, tehniska k\u013C\u016Bda. M\u0113\u0123iniet v\u0113lreiz.';
      case 'lt': return 'Atsipra\u0161ome, technin\u0117 klaida. Bandykite dar kart\u0105.';
      default: return 'Sorry, an error occurred. Please try again.';
    }
  }

  private persistMessages() {
    if (!this.isBrowser) return;
    try {
      const msgs = this.messages().slice(-30);
      localStorage.setItem('dorabot_page_msgs', JSON.stringify(msgs));
    } catch {}
  }

  navigateToTool(path: string) {
    const prefix = this.lang.lang() === 'en' ? '' : '/' + this.lang.lang();
    this.router.navigateByUrl(prefix + path);
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.scrollArea?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }
}
