import { Component, Inject, PLATFORM_ID, signal, computed, DestroyRef } from '@angular/core';
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
          <span class="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse"></span>
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
                  <p class="text-xs text-slate-400 mt-1">{{ lang.t('chat.welcome_desc') }}</p>
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
                  @else { <div [innerHTML]="msg.content | markdown"></div> }
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
                  <div class="flex gap-1.5">
                    <span class="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0ms]"></span>
                    <span class="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:150ms]"></span>
                    <span class="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
                  </div>
                </div>
              </div>
            }

            <!-- Rate limit warning -->
            @if (rateLimited()) {
              <div class="text-center px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
                {{ lang.t('chat.rate_limit') }}
              </div>
            }
          </div>

          <!-- Input -->
          <div class="px-3 py-3 border-t border-slate-700/50 bg-slate-900/80">
            <form (submit)="send($event)" class="flex gap-2">
              <input
                [(ngModel)]="inputText"
                name="chatInput"
                type="text"
                [placeholder]="lang.t('chat.placeholder')"
                [disabled]="loading()"
                class="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 disabled:opacity-50"
                autocomplete="off"
              />
              <button type="submit" [disabled]="loading() || !inputText.trim()"
                      class="px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
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
  `]
})
export class ChatWidgetComponent {
  isBrowser: boolean;
  isOpen = signal(false);
  onChatPage = signal(false);
  messages = signal<ChatMessage[]>([]);
  loading = signal(false);
  rateLimited = signal(false);
  inputText = '';

  quickQuestions = computed(() => {
    const l = this.lang.lang();
    const qs: Record<string, string[]> = {
      en: [
        'What is DORA and who does it apply to?',
        'What must ICT contracts include under Art. 30?',
        'How do I report a major ICT incident?',
        'What tools does DoraAudit offer?'
      ],
      et: [
        'Mis on DORA ja kellele see kehtib?',
        'Mida peavad IKT-lepingud sisaldama Art. 30 alusel?',
        'Kuidas raporteerida suurt IKT-intsidenti?',
        'Milliseid tööriistu DoraAudit pakub?'
      ],
      lv: [
        'Kas ir DORA un kam t\u0101 attiecas?',
        'Ko IKT l\u012bgumiem j\u0101ietver saska\u0146\u0101 ar 30. pantu?',
        'K\u0101 zi\u0146ot par nopietnu IKT incidentu?',
        'K\u0101dus r\u012bkus pied\u0101v\u0101 DoraAudit?'
      ],
      lt: [
        'Kas yra DORA ir kam ji taikoma?',
        'K\u0105 IKT sutartys turi apimti pagal 30 straipsn\u012f?',
        'Kaip prane\u0161ti apie didel\u012f IKT incident\u0105?',
        'Kokius \u012frankius si\u016blo DoraAudit?'
      ]
    };
    return qs[l] || qs['en'];
  });

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private http: HttpClient,
    private router: Router,
    public lang: LangService,
    private destroyRef: DestroyRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.onChatPage.set(this.isChatRoute(this.router.url));
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((e: any) => {
      this.onChatPage.set(this.isChatRoute(e.urlAfterRedirects || e.url));
    });
  }

  private isChatRoute(url: string): boolean {
    return /\/(chat|en\/chat|et\/chat|lv\/chat|lt\/chat)(\/|$|\?)/.test(url);
  }

  toggle() {
    this.isOpen.update(v => !v);
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

  private sendMessage(text: string) {
    this.messages.update(msgs => [...msgs, { role: 'user', content: text, timestamp: new Date() }]);
    this.loading.set(true);
    this.rateLimited.set(false);

    const sessionId = this.isBrowser ? (localStorage.getItem('dora_session_id') || 'anon-' + Math.random().toString(36).substring(2)) : 'ssr';

    this.http.post<ChatApiResponse>('/api/chat/message', {
      message: text,
      sessionId,
      language: this.lang.lang()
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
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
        this.scrollToBottom();
      },
      error: () => {
        this.loading.set(false);
        this.messages.update(msgs => [...msgs, {
          role: 'assistant',
          content: this.lang.lang() === 'et' ? 'Vabandust, tehniline viga. Proovige uuesti.' : 'Sorry, an error occurred. Please try again.',
          timestamp: new Date()
        }]);
      }
    });

    setTimeout(() => this.scrollToBottom(), 50);
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
      const container = document.querySelector('.overflow-y-auto');
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);
  }
}
