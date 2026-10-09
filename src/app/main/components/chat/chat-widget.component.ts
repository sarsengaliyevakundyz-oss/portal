import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml, SafeUrl } from '@angular/platform-browser';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { markdownToHtml, markdownToPlain, stripCiteRefs } from './markdown';
import { buildXlsx } from './xlsx';
import {
  AnswerResponse,
  ApiCheck,
  AskExtra,
  DocumentText,
  NewsItem,
  ChatFigure,
  ChatService,
  ChatSource,
  ChatSummary,
  ChatSystem,
  NoteItem,
  Notebook,
  ToolTable,
} from '../../../shared/services/chat.service';

/** Текст со скриншота дописывается к вопросу под этой строкой (так же он лежит в истории). */
export const SHOT_MARK = '\n\n[Текст со скриншота]\n';

/** Прикреплённый к вопросу скриншот: картинка только в браузере, в rag уходит распознанный текст. */
export interface ShotDraft {
  dataUrl: string;
  status: 'ocr' | 'ok' | 'error';
  text: string;
  error?: string;
  open?: boolean;
  /** на скриншоте не нашлось текста ошибки (пустая страница, окно входа) */
  noError?: boolean;
}

/** Окно «Открыть документ». */
export interface DocView {
  loading: boolean;
  error?: boolean;
  doc?: DocumentText;
  blocks: DocBlock[];
  focus: number | null;
  title: string;
  fileBusy?: boolean;
}

/** Раздел в окне «Открыть документ». */
export interface DocBlock {
  chunkNo: number;
  heading?: string;
  path?: string;
  html: SafeHtml;
}

/** Запись памятки на экране: ответ уже разобран в HTML. */
export interface NoteView extends NoteItem {
  html: SafeHtml;
  openSource?: number | null;
  noteDraft: string;
  noteSaved?: boolean;
  confirmDel?: boolean;
  moveOpen?: boolean;
  copied?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  html?: SafeHtml | null;
  timestamp: Date;
  copied?: boolean;
  messageId?: number;
  confidence?: number;
  sources?: ChatSource[];
  feedback?: number | null;
  commentDraft?: string;
  commentSent?: boolean;
  ratingBusy?: boolean;
  openSource?: number | null;
  answerSource?: string;
  suggestions?: string[];
  /** следующие вопросы после ответа */
  followUps?: string[];
  /** ответ ещё печатается (потоковый режим) */
  streaming?: boolean;
  letterCopied?: boolean;
  /** черновик требований (помощник по требованиям) */
  isDraft?: boolean;
  /** исходный markdown черновика — для доработки и выгрузки в Word */
  markdown?: string;
  apiCheck?: ApiCheck[];
  /** вопрос отправлен в помощник по требованиям */
  draftRequest?: boolean;
  /** skipped — в режиме требований пришёл вопрос, черновик не менялся; revision — обновлённая версия черновика */
  draftNote?: 'skipped' | 'revision';
  /** данные из системы (META и др.) по списку id — кнопка «Скачать Excel» */
  table?: ToolTable;
  /** «Сохранено в «…»» — короткая подсказка после ★ */
  pinnedTo?: string;
  /** вопрос со скриншотом: распознанный текст и картинка (картинка — только в этой сессии) */
  shotText?: string;
  shotUrl?: string;
  shotOpen?: boolean;
  /** вопрос-кнопка «Короче / Подробнее / Простыми словами» */
  rewriteKind?: 'short' | 'detail' | 'simple';
}

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.scss',
})
export class ChatWidgetComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('chatBody') chatBody?: ElementRef<HTMLDivElement>;
  @ViewChild('inputEl') inputEl?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('dislikeArea') dislikeArea?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('renameEl') renameEl?: ElementRef<HTMLInputElement>;
  @ViewChild('systemWrap') systemWrap?: ElementRef<HTMLElement>;

  isOpen = false;
  isNavCollapsed = false;
  loading = false;
  systemLocked = false;
  systemMenuOpen = false;
  question = '';
  /** 0 = поиск по всем системам (systemId на бэк не шлём). */
  readonly allSystemsId = 0;
  selectedSystemId: number | null = this.allSystemsId;
  chatId: number | null = null;
  userInitials = 'АС';
  greetingRu = '';
  greetingKk = '';
  greeting = '';

  systems: ChatSystem[] = [];
  chatList: ChatSummary[] = [];
  messages: ChatMessage[] = [];
  dislikeMsg: ChatMessage | null = null;
  hideBusy = false;
  confirmHide: { mode: 'one' | 'all'; chat?: ChatSummary } | null = null;
  renamingId: number | null = null;
  renameDraft = '';
  renameBusy = false;
  histTip: { text: string; x: number; y: number; label?: string } | null = null;

  /** увеличенный скриншот */
  lightbox: ChatFigure | null = null;
  /** схема крупно: svg, масштаб, сдвиг */
  flowView: { svg: SafeHtml; raw: string; w: number; h: number } | null = null;
  flowScale = 1;
  flowX = 0;
  flowY = 0;
  private flowDrag: { x: number; y: number; fx: number; fy: number } | null = null;
  @ViewChild('flowStage') flowStage?: ElementRef<HTMLDivElement>;
  @ViewChild('docBody') docBody?: ElementRef<HTMLDivElement>;
  @ViewChild('shotInput') shotInput?: ElementRef<HTMLInputElement>;
  /** чат на весь экран */
  isWide = false;
  /** режим «Помочь написать требование»: сообщения идут в /draft/stream */
  draftMode = false;
  /** кнопку «Помочь написать требование» можно спрятать настройкой draft.enabled (приходит в /config) */
  draftEnabled = true;
  /** последний черновик — следующие сообщения в режиме требований дорабатывают его */
  private lastDraft: ChatMessage | null = null;
  /** этап до первого слова: «Нашёл 6 фрагментов в META, пишу ответ…» */
  statusText: string | null = null;

  // ---- поиск по истории ----
  histQuery = '';
  private histTimer?: ReturnType<typeof setTimeout>;

  // ---- популярные вопросы в новом чате ----
  popularEnabled = true;
  /** «Глубокий анализ»: доступен ли сотруднику и включён ли для следующих вопросов. */
  deepEnabled = false;
  deepMode = false;
  /** «Совет»: читает документы по подвопросам и советует. Доступ — как у глубокого анализа. */
  adviseMode = false;
  /** Кнопка чата: скрыта, пока не пришли настройки; админка может показать её всем, только тестировщикам или никому. */
  widgetVisible = false;
  popular: string[] = [];

  // ---- «Изменить вопрос»: id ответа, который заменит новый вопрос ----
  editingRetryOf: number | null = null;
  /** доп. поля к следующему вопросу (кнопки под ответом) */
  private nextExtra: AskExtra | null = null;

  // ---- скриншот ошибки ----
  screenshotEnabled = true;
  shot: ShotDraft | null = null;
  dragOver = false;

  // ---- «Открыть документ» ----
  docView: DocView | null = null;

  // ---- «Новое в базе» ----
  newsEnabled = true;
  news: NewsItem[] = [];
  newsOpen = false;
  private newsSeenAt = 0;

  // ---- «Мои памятки» ----
  notesEnabled = true;
  notebooks: Notebook[] = [];
  notesTotal = 0;
  /** id ответов, которые уже лежат в какой-то памятке (★ закрашена) */
  savedIds = new Set<number>();
  /** ответ, под которым открыт выбор памятки */
  pinMsg: ChatMessage | null = null;
  pinNewTitle = '';
  pinBusy = false;
  notesOpen = false;
  /** null — все памятки */
  notesBook: number | null = null;
  notes: NoteView[] = [];
  notesQuery = '';
  notesLoading = false;
  newBookTitle = '';
  bookRenaming = false;
  bookRenameDraft = '';
  bookDeleteAsk = false;
  /** после «Открыть чат» из памятки — прокрутить к этому ответу */
  private focusMessageId: number | null = null;
  private notesSearchTimer?: ReturnType<typeof setTimeout>;
  /** сообщение, которое сейчас печатается (для «Остановить») */
  private streamingMsg: ChatMessage | null = null;

  private shouldScroll = false;
  private copyTimer?: ReturnType<typeof setTimeout>;
  private langSub?: Subscription;
  private streamSub?: Subscription;
  private renderTimer?: ReturnType<typeof setTimeout>;
  /** id скриншота → blob-URL (null — грузится / не загрузился) */
  private figureUrls = new Map<number, SafeUrl | null>();
  private figureFailed = new Set<number>();
  private objectUrls: string[] = [];

  constructor(
    private sanitizer: DomSanitizer,
    private chatService: ChatService,
    private translate: TranslateService,
  ) {
    this.refreshGreeting();
    this.resetWelcome();
  }

  ngOnInit(): void {
    this.refreshGreeting();
    this.resetWelcome();
    this.langSub = this.translate.onLangChange.subscribe(() => {
      this.refreshGreeting();
      if (this.messages.length === 1 && this.messages[0].role === 'bot' && !this.messages[0].messageId) {
        this.resetWelcome();
      }
      this.loadPopular(); // «Часто спрашивают» — на языке интерфейса
    });
    this.newsSeenAt = this.readNewsSeen();
    this.lastToken = this.chatService.tokenNow();
    this.reloadForUser();
    // виджет создаётся до входа в портал: после авторизации токен появляется позже — перечитываем всё под сотрудника
    this.tokenTimer = setInterval(() => {
      const t = this.chatService.tokenNow();
      if (t !== this.lastToken) {
        this.lastToken = t;
        this.reloadForUser();
      }
    }, 1500);
  }

  private lastToken = '';
  private tokenTimer: any = null;

  /** Настройки (видимость кнопки), системы, история, памятки, «Новое в базе», «Часто спрашивают» — под текущего сотрудника. */
  private reloadForUser(): void {
    if (!this.lastToken) {
      this.widgetVisible = false;   // не вошёл — кнопку не показываем, запросы не шлём
      return;
    }
    this.loadConfig();
    this.loadSystems();
    this.loadChats();
    this.loadNotebooks();
    this.loadNews();
    this.loadPopular();
  }

  ngOnDestroy(): void {
    if (this.tokenTimer) clearInterval(this.tokenTimer);
    this.langSub?.unsubscribe();
    this.streamSub?.unsubscribe();
    if (this.copyTimer) clearTimeout(this.copyTimer);
    if (this.renderTimer) clearTimeout(this.renderTimer);
    if (this.notesSearchTimer) clearTimeout(this.notesSearchTimer);
    if (this.histTimer) clearTimeout(this.histTimer);
    this.objectUrls.forEach((u) => URL.revokeObjectURL(u));
  }

  /** Язык портала: ru | kz | en — как у ngx-translate / public/i18n. */
  get portalLang(): string {
    const raw = (this.translate.currentLang || this.translate.defaultLang || 'ru').toLowerCase();
    if (raw.startsWith('kz') || raw.startsWith('kk')) return 'kz';
    if (raw.startsWith('en')) return 'en';
    return 'ru';
  }

  get isKazakh(): boolean {
    return this.portalLang === 'kz';
  }

  get isAllSystems(): boolean {
    return this.selectedSystemId === this.allSystemsId;
  }

  get hasScope(): boolean {
    return this.selectedSystemId != null;
  }

  systemName(system?: ChatSystem | null): string {
    if (!system) return '';
    if (this.isKazakh) return system.nameKk || system.nameRu || system.name || system.code;
    return system.nameRu || system.name || system.code;
  }

  systemOption(system: ChatSystem): string {
    const n = this.systemName(system);
    return n && n !== system.code ? `${system.code} — ${n}` : system.code;
  }

  knowledgeLabel(): string {
    const base = this.translate.instant('statkomek.knowledgeBase');
    if (this.isAllSystems) {
      return `${base}: ${this.translate.instant('statkomek.allSystems')}`;
    }
    const s = this.selectedSystem;
    if (!s) return base;
    const n = this.systemName(s);
    return n && n !== s.code ? `${base}: ${s.code} — ${n}` : `${base}: ${s.code}`;
  }

  get selectedSystem(): ChatSystem | null {
    return this.systems.find((s) => s.id === this.selectedSystemId) ?? null;
  }

  systemTriggerLabel(): string {
    if (this.isAllSystems) {
      return this.allSystemsLabel();
    }
    const s = this.selectedSystem;
    if (s) { return this.systemOption(s); }
    return this.translate.instant('statkomek.selectSystem');
  }

  allSystemsLabel(): string {
    return this.translate.instant('statkomek.allSystems');
  }

  toggleSystemMenu(event?: Event): void {
    event?.stopPropagation();
    if (this.systemLocked || this.loading) { return; }
    this.systemMenuOpen = !this.systemMenuOpen;
  }

  pickSystem(id: number, event?: Event): void {
    event?.stopPropagation();
    if (this.systemLocked || this.loading) { return; }
    this.selectedSystemId = id;
    this.systemMenuOpen = false;
    this.hideChatTip();
    this.loadPopular();
  }

  closeSystemMenu(): void {
    this.systemMenuOpen = false;
    this.hideChatTip();
  }

  onShellClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.pinMsg && !(event.target as HTMLElement | null)?.closest?.('.pin-wrap')) {
      this.pinMsg = null;
    }
    if (!this.systemMenuOpen) { return; }
    const root = this.systemWrap?.nativeElement;
    if (root && !root.contains(event.target as Node)) {
      this.closeSystemMenu();
    }
  }

  loadConfig(): void {
    this.chatService.getConfig().subscribe({
      next: (c) => {
        if (c?.greetingRu || c?.greeting) {
          this.greetingRu = c.greetingRu || c.greeting;
        }
        if (c?.greetingKk) {
          this.greetingKk = c.greetingKk;
        }
        if (c && c.draftEnabled === false) { this.draftEnabled = false; this.draftMode = false; }
        if (c && c.notesEnabled === false) { this.notesEnabled = false; this.notesOpen = false; }
        if (c && c.screenshotEnabled === false) { this.screenshotEnabled = false; this.shot = null; }
        if (c && c.newsEnabled === false) { this.newsEnabled = false; this.newsOpen = false; this.news = []; }
        if (c && c.popularEnabled === false) { this.popularEnabled = false; this.popular = []; }
        this.deepEnabled = !!(c && c.deepEnabled);
        if (!this.deepEnabled) { this.deepMode = false; this.adviseMode = false; }
        // старый rag без флага — показываем как раньше
        this.widgetVisible = !c || c.widgetVisible !== false;
        if (!this.widgetVisible && this.isOpen) { this.isOpen = false; }
        this.refreshGreeting();
        if (this.messages.length === 1 && this.messages[0].role === 'bot' && !this.messages[0].messageId) {
          this.resetWelcome();
        }
      },
      error: (e) => {
        console.error('config error', e);
        this.widgetVisible = true; // настройки недоступны — не прячем чат, пусть покажет свою ошибку
      },
    });
  }

  loadSystems(): void {
    this.chatService.getSystems().subscribe({
      next: (list) => {
        this.systems = list || [];
        if (this.selectedSystemId == null) {
          this.selectedSystemId = this.allSystemsId;
        }
        // система могла определиться только сейчас — список «Часто спрашивают» под неё
        this.loadPopular();
      },
      error: (e) => console.error('systems error', e),
    });
  }

  loadChats(): void {
    this.chatService.getChats(this.histQuery).subscribe({
      next: (list) => {
        this.chatList = (list || []).map((c) => ({
          ...c,
          firstQuestion: c.firstQuestion || c.first_question || '',
        }));
      },
      error: (e) => console.error('chats error', e),
    });
  }

  chatHint(c: ChatSummary): string {
    const first = (c.firstQuestion || c.first_question || '').replace(/\s+/g, ' ').trim();
    const title = (c.title || '').replace(/\s+/g, ' ').trim();
    return first || title;
  }

  showChatTip(event: MouseEvent, c: ChatSummary): void {
    if (this.renamingId === c.id) {
      this.hideChatTip();
      return;
    }
    this.showHoverTip(
      event.currentTarget as HTMLElement,
      this.chatHint(c),
      this.i18n('statkomek.firstQuestion', 'Первый вопрос', 'Алғашқы сұрақ', 'First question'),
    );
  }

  showNameTip(event: MouseEvent, text: string): void {
    const host = event.currentTarget as HTMLElement;
    const measure = (host.querySelector('.system-select-label') as HTMLElement) || host;
    this.showHoverTip(
      host,
      text,
      this.i18n('statkomek.fullName', 'Название', 'Атауы', 'Name'),
      measure,
    );
  }

  hideChatTip(): void {
    this.histTip = null;
  }

  private showHoverTip(
    anchor: HTMLElement,
    raw: string,
    label?: string,
    measure?: HTMLElement,
  ): void {
    const text = (raw || '').replace(/\s+/g, ' ').trim();
    if (!text) {
      this.hideChatTip();
      return;
    }
    if (measure && measure.scrollWidth <= measure.clientWidth + 1) {
      this.hideChatTip();
      return;
    }
    const r = anchor.getBoundingClientRect();
    const maxLeft = Math.max(8, window.innerWidth - 336);
    this.histTip = {
      text,
      label,
      x: Math.min(r.right + 10, maxLeft),
      y: Math.min(Math.max(r.top + r.height / 2, 28), window.innerHeight - 28),
    };
  }

  startRename(c: ChatSummary, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.hideChatTip();
    this.renamingId = c.id;
    this.renameDraft = (c.title || '').trim();
    setTimeout(() => {
      const el = this.renameEl?.nativeElement;
      if (!el) { return; }
      el.focus();
      el.select();
    }, 0);
  }

  onRenameKey(event: KeyboardEvent, c: ChatSummary): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commitRename(c);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelRename();
    }
  }

  cancelRename(): void {
    this.renamingId = null;
    this.renameDraft = '';
    this.renameBusy = false;
  }

  commitRename(c: ChatSummary): void {
    if (this.renamingId !== c.id) { return; }
    const next = (this.renameDraft || '').replace(/\s+/g, ' ').trim();
    if (!next || next === (c.title || '').trim()) {
      this.cancelRename();
      return;
    }
    if (this.renameBusy) { return; }
    this.renameBusy = true;
    this.chatService.renameChat(c.id, next).subscribe({
      next: (res) => {
        c.title = res?.title || next;
        this.cancelRename();
      },
      error: (e) => {
        this.renameBusy = false;
        console.error('rename chat error', e);
        this.cancelRename();
      },
    });
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.loadChats();
      this.loadNews();
      setTimeout(() => this.inputEl?.nativeElement.focus(), 280);
    } else {
      this.hideChatTip();
      this.cancelRename();
      this.closeSystemMenu();
      // «на весь экран» — только пока окно открыто; следующий раз откроется обычным
      this.isWide = false;
      this.docView = null;
    }
  }

  toggleNav(): void {
    this.isNavCollapsed = !this.isNavCollapsed;
    this.closeSystemMenu();
  }

  newChat(): void {
    this.notesOpen = false;
    this.newsOpen = false;
    this.pinMsg = null;
    this.editingRetryOf = null;
    this.shot = null;
    this.streamSub?.unsubscribe();
    this.lastDraft = null;
    this.chatId = null;
    this.systemLocked = false;
    this.loading = false;
    this.question = '';
    this.dislikeMsg = null;
    this.confirmHide = null;
    this.cancelRename();
    this.hideChatTip();
    this.closeSystemMenu();
    this.resetWelcome();
    this.loadPopular();
    this.shouldScroll = true;
  }

  openChat(chat: ChatSummary): void {
    this.notesOpen = false;
    this.newsOpen = false;
    this.pinMsg = null;
    this.editingRetryOf = null;
    this.streamSub?.unsubscribe();
    this.lastDraft = null;
    this.loading = false;
    this.chatId = chat.id;
    this.systemLocked = true;
    this.closeSystemMenu();
    this.selectedSystemId = chat.systemId != null ? chat.systemId : this.allSystemsId;
    this.chatService.getChatMessages(chat.id).subscribe({
      next: (msgs) => {
        this.messages = (msgs || []).map((m: any) => this.fromStored(m));
        if (!this.messages.length) { this.resetWelcome(); }
        // чат с черновиком требований: последний черновик можно дорабатывать дальше
        const drafts = this.messages.filter((x) => x.isDraft);
        drafts.forEach((d, i) => { if (i > 0) { d.draftNote = 'revision'; } });
        this.lastDraft = drafts.length ? drafts[drafts.length - 1] : null;
        const lastBot = [...this.messages].reverse().find((x) => x.role === 'bot');
        this.draftMode = this.draftEnabled && !!lastBot?.isDraft;
        this.shouldScroll = true;
        if (this.focusMessageId != null) {
          const id = this.focusMessageId;
          this.focusMessageId = null;
          setTimeout(() => this.scrollToMessage(id), 60);
        }
      },
      error: (e) => { console.error('chat messages error', e); this.resetWelcome(); },
    });
  }

  onKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  get canSend(): boolean {
    if (this.loading || this.selectedSystemId == null) { return false; }
    if (this.shot && this.shot.status === 'ocr') { return false; }
    return !!(this.question || '').trim() || !!(this.shot && this.shot.status === 'ok' && !this.draftMode);
  }

  send(): void {
    if (!this.canSend) {
      return;
    }
    let text = (this.question || '').trim();
    const systemId = this.isAllSystems ? undefined : this.selectedSystemId as number;

    // скриншот: к вопросу дописываем распознанный текст (в режиме требований — не прикрепляем)
    const shot = !this.draftMode && this.shot && this.shot.status === 'ok' ? this.shot : null;
    const userMsg: ChatMessage = { role: 'user', text, timestamp: new Date(), draftRequest: this.draftMode };
    if (shot) {
      if (!text) {
        text = this.i18n('statkomek.shotDefaultQ', 'Что означает эта ошибка на скриншоте и как её исправить?',
          'Скриншоттағы қате нені білдіреді және оны қалай түзетуге болады?', 'What does this error mean and how do I fix it?');
        userMsg.text = text;
      }
      userMsg.shotText = shot.text;
      userMsg.shotUrl = shot.dataUrl;
      text = text + SHOT_MARK + shot.text;
      this.shot = null;
    }
    // «Изменить вопрос»: прошлая пара уходит, новый вопрос заменяет её
    if (this.editingRetryOf != null && !this.draftMode) {
      this.dropLastPair();
      this.nextExtra = { retryOf: this.editingRetryOf };
    }
    this.editingRetryOf = null;

    // включён «Требование», черновик уже есть, а сотрудник задал обычный вопрос («…как будет?») —
    // не переписываем черновик под вопрос, а отвечаем как на вопрос. Черновик остаётся, к нему можно вернуться.
    if (this.draftMode && this.lastDraft && looksLikeQuestionNotEdit(text)) {
      this.draftMode = false;
      userMsg.draftRequest = false;
    }

    this.messages.push(userMsg);
    this.question = '';
    this.systemLocked = true;
    this.loading = true;
    this.shouldScroll = true;
    this.resizeInput();

    if (this.draftMode) {
      this.nextExtra = null;
      this.sendDraft(text, systemId);
    } else {
      if (this.adviseMode && this.deepEnabled) {
        this.nextExtra = { ...(this.nextExtra || {}), advise: true };
        if (!this.isWide) { this.isWide = true; }
      } else if (this.deepMode && this.deepEnabled) {
        this.nextExtra = { ...(this.nextExtra || {}), deep: true };
        if (!this.isWide) { this.isWide = true; }   // разбор длинный — шире окно
      }
      this.sendStream(text, systemId);
    }
  }

  toggleDeepMode(): void {
    this.deepMode = !this.deepMode;
    if (this.deepMode) { this.draftMode = false; this.adviseMode = false; }
    setTimeout(() => this.inputEl?.nativeElement.focus(), 0);
  }

  // ------------------------------------------------------------------ помощник по требованиям

  /** Включить / выключить «Помочь написать требование». Черновик длинный — разворачиваем окно. */
  /** «Совет» — отдельно от глубокого анализа и требований: включение выключает их. */
  toggleAdviseMode(): void {
    this.adviseMode = !this.adviseMode;
    if (this.adviseMode) { this.deepMode = false; this.draftMode = false; }
    setTimeout(() => this.inputEl?.nativeElement.focus(), 0);
  }

  toggleDraftMode(): void {
    this.draftMode = !this.draftMode;
    if (this.draftMode) { this.deepMode = false; this.adviseMode = false; }
    if (this.draftMode && !this.isWide) { this.isWide = true; }
    setTimeout(() => this.inputEl?.nativeElement.focus(), 0);
  }

  /** Новый черновик с нуля (следующее сообщение не доработка прошлого). */
  startNewDraft(): void {
    this.lastDraft = null;
    this.draftMode = true;
    this.deepMode = false;
    this.adviseMode = false;
    setTimeout(() => this.inputEl?.nativeElement.focus(), 0);
  }

  get revisingDraft(): boolean {
    return this.draftMode && !!this.lastDraft;
  }

  /**
   * Черновик «Требования к задаче» потоком. Если в этом чате уже есть черновик — сообщение считается
   * просьбой его доработать («добавь поле автор», «убери выгрузку»).
   */
  private sendDraft(text: string, systemId?: number): void {
    const bot: ChatMessage = { role: 'bot', text: '', html: null, timestamp: new Date(), streaming: true, isDraft: true };
    let raw = '';
    let started = false;
    this.statusText = this.i18n('statkomek.draftPlan', 'Разбираю задачу…', 'Тапсырманы талдап жатырмын…', 'Analysing the task…');
    this.streamingMsg = bot;
    this.streamSub?.unsubscribe();
    const previous = this.lastDraft?.markdown;
    this.streamSub = this.chatService.draftStream(text, systemId, previous, this.chatId ?? undefined).subscribe({
      next: (ev) => {
        if (ev.type === 'status') {
          if (ev.stage === 'tool') {
            this.statusText = this.toolStatus(ev);
          } else if (ev.stage === 'think') {
            if (!started) {
              this.statusText = this.i18n('statkomek.statusThink', 'Модель обдумывает ответ…',
                'Модель жауапты ойластырып жатыр…', 'The model is thinking…');
            }
          } else if (ev.stage === 'write') {
            const where = ev.system ? ' ' + this.i18n('statkomek.statusIn', 'в', 'ішінен', 'in') + ' ' + ev.system : '';
            this.statusText = this.i18n('statkomek.statusFound', 'Нашёл', 'Табылды', 'Found') + ' ' + ev.found + ' '
              + this.fragmentsWord(ev.found) + where + ', '
              + this.i18n('statkomek.draftWriting', 'пишу черновик требования…', 'талап жобасын жазып жатырмын…', 'writing the draft…');
          }
        } else if (ev.type === 'delta') {
          if (!started) {
            started = true;
            this.loading = false;
            this.messages.push(bot);
          }
          raw += ev.text;
          this.renderStreaming(bot, raw);
        } else if (ev.type === 'done') {
          const isDraft = ev.data?.mode === 'draft' || ev.data?.answerSource === 'draft';
          if (!isDraft) {
            // «спасибо», «привет», запрос наименований по id — rag ответил как в обычном чате
            // «спасибо», «привет» в режиме требований — rag ответил как в обычном чате, черновик не трогаем
            const ask = [...this.messages].reverse().find((x) => x.role === 'user');
            if (ask) { ask.draftRequest = false; }
            bot.isDraft = false;
          }
          this.finishAnswer(ev.data, started ? bot : null);
          const msg = started ? bot : this.messages[this.messages.length - 1];
          if (msg) {
            if (ev.data?.draftSkipped) { msg.draftNote = 'skipped'; }
            else if (isDraft && ev.data?.revision) { msg.draftNote = 'revision'; }
          }
          if (msg && msg.isDraft) { this.lastDraft = msg; }
        } else if (ev.type === 'error') {
          if (!started) { this.messages.push(bot); }
          this.finishError(bot);
        }
      },
      error: (err) => {
        console.warn('draft stream failed', err);
        if (!started) { this.messages.push(bot); }
        this.finishError(bot);
      },
    });
  }

  /** Сколько методов API черновика не нашлось в описании системы — подсветка под черновиком. */
  apiMissing(msg: ChatMessage): number {
    return (msg.apiCheck || []).filter((c) => c.status === 'not_found').length;
  }

  apiNew(msg: ChatMessage): number {
    return (msg.apiCheck || []).filter((c) => c.status === 'new').length;
  }

  /** «Запрашиваю META: формы по id (120)…» — пока шлюз ходит в систему. */
  private toolStatus(ev: { system?: string | null; tool?: string | null; count?: number }): string {
    const what = ev.tool || ev.system || '';
    const n = ev.count ? ' (' + ev.count + ' id)' : '';
    return this.i18n('statkomek.toolAsking', 'Запрашиваю', 'Сұрау жіберіп жатырмын:', 'Requesting') + ' ' + what + n + '…';
  }

  /**
   * «Скачать Excel»: вся таблица из системы (в тексте ответа — только первые строки)
   * + лист «не найдены» строками в конце. Файл собирается в браузере, без библиотек.
   */
  downloadTable(msg: ChatMessage): void {
    const t = msg.table;
    if (!t) { return; }
    const rows: unknown[][] = (t.rows || []).map((r) => (Array.isArray(r) ? r : []));
    const missing = (t.notFound || []).map((id) => {
      const r: unknown[] = new Array(t.columns.length).fill('');
      r[0] = id;
      if (t.columns.length > 1) {
        r[1] = this.i18n('statkomek.toolNotFound', 'не найден', 'табылмады', 'not found');
      }
      return r;
    });
    const bytes = buildXlsx(t.title || 'StatKomek', t.columns, [...rows, ...missing]);
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const d = new Date();
    const pad = (n: number) => (n < 10 ? '0' : '') + n;
    const base = (t.system || 'StatKomek').replace(/[^\p{L}\p{N}_-]+/gu, '_');
    a.download = `${base}_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.xlsx`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  /**
   * «Скачать для Word»: HTML-документ с расширением .doc — Word открывает его как обычный документ,
   * без библиотек на портале. Ссылки [n] заменяются списком источников в конце.
   */
  downloadDraft(msg: ChatMessage): void {
    const md = msg.markdown || msg.text || '';
    const body = markdownToHtml(stripCiteRefs(md))
      .replace(/<span class="sk-cite"[^>]*>[^<]*<\/span>/g, '');
    const sources = this.citedSources(msg)
      .map((s) => `<li>${this.escape(s.sourceFile || '')}${s.sectionPath ? ' — ' + this.escape(s.sectionPath) : ''}</li>`)
      .join('');
    const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">'
      + '<head><meta charset="utf-8"><title>Требование к задаче</title>'
      + '<style>body{font-family:"Times New Roman",serif;font-size:14pt;line-height:1.3}'
      + 'table{border-collapse:collapse}td,th{border:1px solid #000;padding:4px 6px;font-size:12pt}'
      + 'h1,h2,h3{font-family:"Times New Roman",serif}code{font-family:"Courier New",monospace;font-size:12pt}</style></head><body>'
      + body
      + (sources ? '<h3>Источники (база знаний StatKomek)</h3><ol>' + sources + '</ol>' : '')
      + '</body></html>';
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const d = new Date();
    const pad = (n: number) => (n < 10 ? '0' : '') + n;
    a.download = `Требование_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.doc`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  private escape(s: string): string {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // =============================== поиск по истории ===============================

  onHistSearch(): void {
    if (this.histTimer) { clearTimeout(this.histTimer); }
    this.histTimer = setTimeout(() => this.loadChats(), 300);
  }

  clearHistSearch(): void {
    this.histQuery = '';
    this.loadChats();
  }

  // =============================== популярные вопросы ===============================

  loadPopular(): void {
    if (!this.popularEnabled) { return; }
    const sys = this.selectedSystemId == null || this.isAllSystems ? null : this.selectedSystemId;
    this.chatService.getPopular(sys, this.portalLang).subscribe({
      next: (list) => {
        this.popular = (list || []).filter((x) => typeof x === 'string' && x.trim());
        if (!this.popular.length) {
          console.info('[StatKomek] популярных вопросов нет (systemId=' + sys + '): закреплённых, частых и удачных вопросов не найдено');
        }
      },
      error: (e) => {
        this.popular = [];
        // 404 — в бэкенде портала нет /popular (не обновлены ChatController/ChatClient), 401 — токен, 5xx — rag
        console.warn('[StatKomek] не удалось загрузить популярные вопросы: ' + (e?.status ?? '') + ' ' + (e?.url ?? ''), e);
      },
    });
  }

  /** Показать популярные вопросы: новый чат, только приветствие. */
  get showPopular(): boolean {
    return this.popularEnabled && this.popular.length > 0 && !this.loading && !this.draftMode
      && this.messages.length === 1 && this.messages[0].role === 'bot' && !this.messages[0].messageId;
  }

  // ====================== «Короче / Подробнее / Простыми словами», «Спросить заново» ======================

  private lastBot(): ChatMessage | null {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      if (this.messages[i].role === 'bot') { return this.messages[i]; }
    }
    return null;
  }

  private lastUser(): ChatMessage | null {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      if (this.messages[i].role === 'user') { return this.messages[i]; }
    }
    return null;
  }

  /** Кнопки стиля и «Спросить заново» — только у последнего обычного ответа по документам. */
  canRestyle(msg: ChatMessage): boolean {
    const src = msg.answerSource || '';
    return !this.loading && !msg.streaming && !!msg.messageId && !msg.isDraft && !msg.table
      && msg === this.lastBot()
      && ['tool', 'clarify', 'chitchat', 'greeting', 'about', 'none', 'draft'].indexOf(src) < 0;
  }

  canRetry(msg: ChatMessage): boolean {
    return !this.loading && !msg.streaming && !!msg.messageId && !msg.isDraft && msg === this.lastBot()
      && !!this.lastUser() && !this.draftMode;
  }

  restyle(kind: 'short' | 'detail' | 'simple'): void {
    if (this.loading || this.chatId == null) { return; }
    const label = kind === 'short'
      ? this.i18n('statkomek.styleBrief', 'Кратко', 'Қысқаша', 'Brief')
      : kind === 'detail'
        ? this.i18n('statkomek.styleDetail', 'Подробнее', 'Толығырақ', 'More detail')
        : this.i18n('statkomek.styleSimple', 'Простыми словами', 'Қарапайым тілмен', 'In simple words');
    this.nextExtra = { rewrite: kind };
    this.messages.push({ role: 'user', text: label, timestamp: new Date(), rewriteKind: kind });
    this.loading = true;
    this.shouldScroll = true;
    this.sendStream(label, this.isAllSystems ? undefined : this.selectedSystemId as number);
  }

  /** «Спросить заново»: тот же вопрос, прошлый ответ уходит из чата и из диалога модели. */
  retry(msg: ChatMessage): void {
    const q = this.lastUser();
    if (!q || !msg.messageId || this.loading) { return; }
    const full = q.shotText ? q.text + SHOT_MARK + q.shotText : q.text;
    this.dropLastPair();
    this.messages.push({ ...q, timestamp: new Date() });
    this.nextExtra = q.rewriteKind ? { retryOf: msg.messageId, rewrite: q.rewriteKind } : { retryOf: msg.messageId };
    this.loading = true;
    this.shouldScroll = true;
    this.sendStream(full, this.isAllSystems ? undefined : this.selectedSystemId as number);
  }

  /** «Изменить вопрос» — у последнего вопроса, на который уже есть ответ. */
  canEditQuestion(msg: ChatMessage): boolean {
    if (this.loading || this.draftMode || msg.role !== 'user' || msg.rewriteKind || msg !== this.lastUser()) { return false; }
    const bot = this.lastBot();
    return !!bot && !!bot.messageId && this.messages.indexOf(bot) > this.messages.indexOf(msg);
  }

  editQuestion(msg: ChatMessage): void {
    const bot = this.lastBot();
    if (!bot || !bot.messageId) { return; }
    this.editingRetryOf = bot.messageId;
    this.question = msg.text;
    setTimeout(() => {
      this.resizeInput();
      const el = this.inputEl?.nativeElement;
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    }, 0);
  }

  cancelEdit(): void {
    this.editingRetryOf = null;
    this.question = '';
    this.resizeInput();
  }

  /** Убрать с экрана последний вопрос и ответ на него. */
  private dropLastPair(): void {
    const bot = this.lastBot();
    const user = this.lastUser();
    this.messages = this.messages.filter((m) => m !== bot && m !== user);
    if (!this.messages.length) { this.resetWelcome(); }
  }

  // =============================== скриншот ошибки ===============================

  pickShot(): void {
    this.shotInput?.nativeElement.click();
  }

  onShotFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (file) { this.attachImage(file); }
    input.value = '';
  }

  /** Ctrl+V картинки в поле вопроса. */
  onPaste(event: ClipboardEvent): void {
    if (!this.screenshotEnabled || this.draftMode) { return; }
    const items = event.clipboardData ? Array.from(event.clipboardData.items || []) : [];
    const img = items.find((i) => i.kind === 'file' && /^image\//.test(i.type));
    const file = img ? img.getAsFile() : null;
    if (file) {
      event.preventDefault();
      this.attachImage(file);
    }
  }

  onDragOver(event: DragEvent): void {
    if (!this.screenshotEnabled || this.draftMode) { return; }
    if (event.dataTransfer && Array.from(event.dataTransfer.types || []).indexOf('Files') >= 0) {
      event.preventDefault();
      this.dragOver = true;
    }
  }

  onDrop(event: DragEvent): void {
    this.dragOver = false;
    if (!this.screenshotEnabled || this.draftMode) { return; }
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (file && /^image\//.test(file.type)) {
      event.preventDefault();
      this.attachImage(file);
    }
  }

  attachImage(file: File): void {
    if (!/^image\/(png|jpe?g|webp|gif|bmp)$/i.test(file.type)) {
      this.shot = { dataUrl: '', status: 'error', text: '',
        error: this.i18n('statkomek.shotType', 'Нужна картинка: PNG или JPG', 'PNG немесе JPG сурет керек', 'PNG or JPG image needed') };
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      this.shot = { dataUrl: '', status: 'error', text: '',
        error: this.i18n('statkomek.shotBig', 'Картинка слишком большая', 'Сурет тым үлкен', 'Image is too large') };
      return;
    }
    this.prepareImage(file).then((dataUrl) => {
      const shot: ShotDraft = { dataUrl, status: 'ocr', text: '' };
      this.shot = shot;
      this.chatService.ocr(dataUrl).subscribe({
        next: (r) => {
          if (this.shot !== shot) { return; }
          if (r && r.success && r.text) {
            shot.status = 'ok';
            shot.text = r.text;
            shot.noError = r.hasError === false;
          } else {
            shot.status = 'error';
            shot.error = this.shotError(r?.error);
          }
        },
        error: () => {
          if (this.shot !== shot) { return; }
          shot.status = 'error';
          shot.error = this.shotError('');
        },
      });
    }).catch(() => {
      this.shot = { dataUrl: '', status: 'error', text: '', error: this.shotError('bad-image') };
    });
  }

  removeShot(): void {
    this.shot = null;
  }

  private shotError(code?: string): string {
    if (code === 'empty') {
      return this.i18n('statkomek.shotEmpty', 'На картинке не нашлось текста', 'Суретте мәтін табылмады', 'No text found in the image');
    }
    if (code === 'too-often') {
      return this.i18n('statkomek.shotOften', 'Слишком много скриншотов подряд — попробуйте через несколько минут',
        'Скриншоттар тым көп — бірнеше минуттан кейін', 'Too many screenshots — try again in a few minutes');
    }
    if (code === 'too-big') {
      return this.i18n('statkomek.shotBig', 'Картинка слишком большая', 'Сурет тым үлкен', 'Image is too large');
    }
    if (code === 'bad-type' || code === 'bad-image') {
      return this.i18n('statkomek.shotType', 'Нужна картинка: PNG или JPG', 'PNG немесе JPG сурет керек', 'PNG or JPG image needed');
    }
    return this.i18n('statkomek.shotFail', 'Не удалось распознать текст', 'Мәтін танылмады', 'Could not read the text');
  }

  /** Большие картинки уменьшаем в браузере (до 2000 px по длинной стороне), формат — PNG/JPEG. */
  private prepareImage(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read'));
      reader.onload = () => {
        const src = String(reader.result || '');
        const img = new Image();
        img.onerror = () => reject(new Error('decode'));
        img.onload = () => {
          const max = 2000;
          const k = Math.min(1, max / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
          const small = k >= 1 && file.size <= 4 * 1024 * 1024 && /^image\/(png|jpe?g)$/i.test(file.type);
          if (small) { resolve(src); return; }
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.naturalWidth * k));
          c.height = Math.max(1, Math.round(img.naturalHeight * k));
          const ctx = c.getContext('2d');
          if (!ctx) { resolve(src); return; }
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          let out = c.toDataURL('image/png');
          if (out.length > 5.5 * 1024 * 1024) { out = c.toDataURL('image/jpeg', 0.9); }
          resolve(out);
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    });
  }

  // =============================== «Открыть документ» ===============================

  /** Окно с текстом документа; chunkNo — прокрутить к фрагменту, на который сослался ответ. */
  openDoc(documentId?: number | null, chunkNo?: number | null, title?: string | null): void {
    if (documentId == null) { return; }
    const view: DocView = { loading: true, blocks: [], focus: chunkNo ?? null, title: title || '' };
    this.docView = view;
    this.chatService.getDocumentText(documentId).subscribe({
      next: (d) => {
        if (this.docView !== view) { return; }
        view.loading = false;
        if (!d || !Array.isArray(d.chunks)) { view.error = true; return; }
        view.doc = d;
        view.title = d.sourceFile || view.title;
        let prevPath = '';
        view.blocks = d.chunks.map((c) => {
          const path = (c.sectionPath || '').trim();
          const b: DocBlock = {
            chunkNo: c.chunkNo,
            html: this.sanitizer.bypassSecurityTrustHtml(markdownToHtml(c.text || '')),
          };
          if (path && path !== prevPath) {
            const parts = path.split('›').map((x) => x.trim()).filter(Boolean);
            b.heading = parts[parts.length - 1] || path;
            b.path = parts.length > 1 ? parts.slice(0, -1).join(' › ') : '';
          }
          prevPath = path || prevPath;
          return b;
        });
        setTimeout(() => this.scrollDocTo(view.focus), 30);
      },
      error: () => {
        if (this.docView !== view) { return; }
        view.loading = false;
        view.error = true;
      },
    });
  }

  private scrollDocTo(chunkNo: number | null): void {
    const body = this.docBody?.nativeElement;
    if (!body || chunkNo == null) { return; }
    const el = body.querySelector(`[data-chunk="${chunkNo}"]`) as HTMLElement | null;
    if (!el) { return; }
    body.scrollTop = Math.max(0, el.offsetTop - 24);
  }

  closeDoc(): void {
    this.docView = null;
  }

  downloadDocFile(): void {
    const v = this.docView;
    if (!v || !v.doc || v.fileBusy) { return; }
    v.fileBusy = true;
    const name = v.doc.sourceFile || 'document';
    this.chatService.getDocumentFile(v.doc.documentId).subscribe({
      next: (blob) => {
        v.fileBusy = false;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      },
      error: () => { v.fileBusy = false; },
    });
  }

  // =============================== «Новое в базе» ===============================

  loadNews(): void {
    if (!this.newsEnabled) { return; }
    this.chatService.getNews().subscribe({
      next: (list) => { this.news = list || []; },
      error: () => { this.news = []; },
    });
  }

  /** Сколько документов появилось с прошлого просмотра «Новое в базе». */
  get newsCount(): number {
    return this.news.filter((n) => this.newsTime(n) > this.newsSeenAt).length;
  }

  isNewsFresh(n: NewsItem): boolean {
    return this.newsTime(n) > this.newsSeenBefore;
  }

  /** время прошлого просмотра — чтобы в открытом списке подсветить новые */
  private newsSeenBefore = 0;

  private newsTime(n: NewsItem): number {
    const t = n.changedAt ? Date.parse(n.changedAt) : 0;
    return isNaN(t) ? 0 : t;
  }

  openNews(): void {
    this.newsOpen = true;
    this.notesOpen = false;
    this.pinMsg = null;
    this.closeSystemMenu();
    this.newsSeenBefore = this.newsSeenAt;
    this.loadNews();
    this.newsSeenAt = Date.now();
    this.writeNewsSeen(this.newsSeenAt);
  }

  closeNews(): void {
    this.newsOpen = false;
    this.shouldScroll = true;
  }

  newsDate(n: NewsItem): string {
    const t = this.newsTime(n);
    if (!t) { return ''; }
    const locale = this.portalLang === 'kz' ? 'kk-KZ' : this.portalLang === 'en' ? 'en-US' : 'ru-RU';
    try {
      return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(t));
    } catch {
      return '';
    }
  }

  /** «Что в нём главное?» — новый чат по системе документа, вопрос с названием документа. */
  askAboutDoc(n: NewsItem): void {
    this.newChat();
    if (n.systemId != null && this.systems.some((s) => s.id === n.systemId)) {
      this.selectedSystemId = n.systemId;
    }
    const name = (n.sourceFile || '').replace(/\.(docx?|pdf|md|txt|xlsx?|pptx?)$/i, '');
    this.question = this.i18n('statkomek.newsAskQ', 'Кратко: о чём документ', 'Қысқаша: құжат не туралы', 'Briefly: what is the document')
      + ' «' + name + '» ' + this.i18n('statkomek.newsAskQ2', 'и что в нём главное?', 'және ондағы ең маңыздысы?', 'about and what matters most?');
    this.send();
  }

  private readNewsSeen(): number {
    try {
      const v = Number(localStorage.getItem('statkomek.newsSeenAt') || 0);
      return isNaN(v) ? 0 : v;
    } catch {
      return 0;
    }
  }

  private writeNewsSeen(t: number): void {
    try {
      localStorage.setItem('statkomek.newsSeenAt', String(t));
    } catch {
      // приватный режим — просто не запоминаем
    }
  }

  // =============================== «Мои памятки» ===============================

  loadNotebooks(): void {
    if (!this.notesEnabled) { return; }
    this.chatService.notebooks().subscribe({
      next: (r) => {
        if (!r || !r.success) { return; }
        this.notebooks = r.notebooks || [];
        this.notesTotal = r.total || 0;
        this.savedIds = new Set<number>((r.savedMessageIds || []).map((x) => Number(x)));
        if (this.notesBook != null && !this.notebooks.some((b) => b.id === this.notesBook)) {
          this.notesBook = null;
        }
      },
      error: (e) => console.error('notebooks error', e),
    });
  }

  isSaved(msg: ChatMessage): boolean {
    return msg.messageId != null && this.savedIds.has(msg.messageId);
  }

  /** ★ под ответом: открыть/закрыть выбор памятки. */
  togglePin(msg: ChatMessage): void {
    if (this.pinMsg === msg) {
      this.pinMsg = null;
      return;
    }
    this.pinMsg = msg;
    this.pinNewTitle = '';
    this.loadNotebooks();
  }

  /** Сохранить ответ: в выбранную памятку или в новую с названием из поля. */
  saveToNotebook(msg: ChatMessage, bookId: number | null): void {
    if (!msg.messageId || this.pinBusy) { return; }
    const title = (this.pinNewTitle || '').trim();
    if (bookId == null && !title) { return; }
    this.pinBusy = true;
    const body: Record<string, unknown> = { messageId: msg.messageId };
    if (bookId != null) { body['notebookId'] = bookId; } else { body['newTitle'] = title; }
    this.chatService.notebookCall('save', body).subscribe({
      next: (r) => {
        this.pinBusy = false;
        if (!r?.success) {
          msg.pinnedTo = this.notesError(r?.error);
          setTimeout(() => { msg.pinnedTo = undefined; }, 3000);
          return;
        }
        this.savedIds.add(msg.messageId as number);
        const name = r.notebook?.title || title;
        msg.pinnedTo = (r.duplicate
          ? this.i18n('statkomek.notesAlready', 'Уже есть в', 'Бұрыннан бар:', 'Already in')
          : this.i18n('statkomek.notesSaved', 'Сохранено в', 'Сақталды:', 'Saved to')) + ' «' + name + '»';
        setTimeout(() => { msg.pinnedTo = undefined; }, 2600);
        this.pinMsg = null;
        this.pinNewTitle = '';
        this.loadNotebooks();
        if (this.notesOpen) { this.loadNotes(); }
      },
      error: () => {
        this.pinBusy = false;
        msg.pinnedTo = this.notesError('');
        setTimeout(() => { msg.pinnedTo = undefined; }, 3000);
      },
    });
  }

  onPinKey(event: KeyboardEvent, msg: ChatMessage): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveToNotebook(msg, null);
    }
  }

  private notesError(code?: string): string {
    if (code === 'too-many-notebooks') {
      return this.i18n('statkomek.notesTooManyBooks', 'Слишком много памяток — удалите ненужные', 'Жазбалар тым көп', 'Too many notebooks');
    }
    if (code === 'too-many-notes') {
      return this.i18n('statkomek.notesTooMany', 'Слишком много записей — удалите ненужные', 'Жазбалар тым көп', 'Too many notes');
    }
    if (code === 'duplicate-title') {
      return this.i18n('statkomek.notesDupTitle', 'Памятка с таким названием уже есть', 'Мұндай атау бар', 'This name is taken');
    }
    return this.i18n('statkomek.notesFail', 'Не удалось сохранить', 'Сақталмады', 'Could not save');
  }

  openNotes(bookId: number | null = null): void {
    this.notesOpen = true;
    this.newsOpen = false;
    this.notesBook = bookId;
    this.notesQuery = '';
    this.bookRenaming = false;
    this.bookDeleteAsk = false;
    this.pinMsg = null;
    this.closeSystemMenu();
    this.loadNotebooks();
    this.loadNotes();
  }

  closeNotes(): void {
    this.notesOpen = false;
    this.shouldScroll = true;
  }

  selectBook(id: number | null): void {
    this.notesBook = id;
    this.bookRenaming = false;
    this.bookDeleteAsk = false;
    this.loadNotes();
  }

  get currentBook(): Notebook | null {
    return this.notebooks.find((b) => b.id === this.notesBook) || null;
  }

  onNotesSearch(): void {
    if (this.notesSearchTimer) { clearTimeout(this.notesSearchTimer); }
    this.notesSearchTimer = setTimeout(() => this.loadNotes(), 300);
  }

  loadNotes(): void {
    this.notesLoading = true;
    const body: Record<string, unknown> = {};
    if (this.notesBook != null) { body['notebookId'] = this.notesBook; }
    if ((this.notesQuery || '').trim()) { body['q'] = this.notesQuery.trim(); }
    this.chatService.notebookCall('notes', body).subscribe({
      next: (r) => {
        this.notesLoading = false;
        this.notes = (r?.notes || []).map((n) => this.toNoteView(n));
      },
      error: (e) => { this.notesLoading = false; console.error('notes error', e); },
    });
  }

  private toNoteView(n: NoteItem): NoteView {
    return {
      ...n,
      sources: this.normalizeSources(n.sources as ChatSource[]),
      html: this.formatAnswer(n.answer || '').html,
      noteDraft: n.userNote || '',
      openSource: null,
    };
  }

  /** Источники записи — как под ответом в чате (ChatMessage-совместимый вид). */
  noteSources(n: NoteView): ChatSource[] {
    return this.citedSources({ role: 'bot', text: '', timestamp: new Date(), sources: n.sources });
  }

  createBook(): void {
    const title = (this.newBookTitle || '').trim();
    if (!title) { return; }
    this.chatService.notebookCall('create', { title }).subscribe({
      next: (r) => {
        if (r?.success && r.notebook) {
          this.newBookTitle = '';
          this.notesBook = r.notebook.id;
          this.loadNotebooks();
          this.loadNotes();
        }
      },
    });
  }

  startBookRename(): void {
    const b = this.currentBook;
    if (!b) { return; }
    this.bookRenaming = true;
    this.bookRenameDraft = b.title;
  }

  commitBookRename(): void {
    const b = this.currentBook;
    const title = (this.bookRenameDraft || '').trim();
    this.bookRenaming = false;
    if (!b || !title || title === b.title) { return; }
    this.chatService.notebookCall('rename', { id: b.id, title }).subscribe({
      next: (r) => {
        if (r?.success) { b.title = r.title || title; this.loadNotes(); }
      },
    });
  }

  onBookRenameKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') { event.preventDefault(); this.commitBookRename(); }
    if (event.key === 'Escape') { event.stopPropagation(); this.bookRenaming = false; }
  }

  deleteBook(): void {
    const b = this.currentBook;
    if (!b) { return; }
    if (!this.bookDeleteAsk) { this.bookDeleteAsk = true; return; }
    this.bookDeleteAsk = false;
    this.chatService.notebookCall('delete', { id: b.id }).subscribe({
      next: () => { this.notesBook = null; this.loadNotebooks(); this.loadNotes(); },
    });
  }

  saveUserNote(n: NoteView): void {
    const text = (n.noteDraft || '').trim();
    if (text === (n.userNote || '').trim()) { return; }
    this.chatService.notebookCall('note/update', { id: n.id, userNote: text }).subscribe({
      next: (r) => {
        if (r?.success) {
          n.userNote = text || null;
          n.noteSaved = true;
          setTimeout(() => { n.noteSaved = false; }, 1400);
        }
      },
    });
  }

  moveNote(n: NoteView, bookId: number): void {
    n.moveOpen = false;
    if (bookId === n.notebookId) { return; }
    this.chatService.notebookCall('note/update', { id: n.id, notebookId: bookId }).subscribe({
      next: (r) => {
        if (r?.success) { this.loadNotebooks(); this.loadNotes(); }
      },
    });
  }

  deleteNote(n: NoteView): void {
    if (!n.confirmDel) {
      n.confirmDel = true;
      setTimeout(() => { n.confirmDel = false; }, 3000);
      return;
    }
    this.chatService.notebookCall('note/delete', { id: n.id }).subscribe({
      next: (r) => {
        if (r?.success) {
          this.notes = this.notes.filter((x) => x !== n);
          this.loadNotebooks();
        }
      },
    });
  }

  copyNote(n: NoteView): void {
    const q = (n.question || '').trim();
    const body = (q ? q + '\n\n' : '') + (markdownToPlain(stripCiteRefs(n.answer || '')) || n.answer || '').trim()
      + (n.userNote ? '\n\n' + this.i18n('statkomek.notesMine', 'Моя заметка', 'Менің ескертпем', 'My note') + ': ' + n.userNote : '');
    navigator.clipboard.writeText(body).then(() => {
      n.copied = true;
      setTimeout(() => { n.copied = false; }, 1600);
    });
  }

  /** Перейти в чат, из которого запись, и показать сам ответ. */
  openNoteChat(n: NoteView): void {
    if (!n.chatId || !n.chatOpen) { return; }
    const known = this.chatList.find((c) => c.id === n.chatId);
    this.focusMessageId = n.messageId || null;
    this.openChat(known || { id: n.chatId, title: n.question || '' });
  }

  private scrollToMessage(id: number): void {
    const body = this.chatBody?.nativeElement;
    const el = body?.querySelector(`[data-mid="${id}"]`) as HTMLElement | null;
    if (!body || !el) { return; }
    body.scrollTop = Math.max(0, el.offsetTop - 16);
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 1800);
  }

  noteDate(n: NoteView): string {
    if (!n.createdAt) { return ''; }
    const locale = this.portalLang === 'kz' ? 'kk-KZ' : this.portalLang === 'en' ? 'en-US' : 'ru-RU';
    try {
      return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(n.createdAt));
    } catch {
      return '';
    }
  }

  /** «Скачать для Word»: вся открытая памятка (или найденное) одним документом. */
  downloadNotes(): void {
    if (!this.notes.length) { return; }
    const title = this.currentBook?.title || this.i18n('statkomek.notesAll', 'Все памятки', 'Барлық жазбалар', 'All notes');
    const parts = this.notes.map((n, i) => {
      const body = markdownToHtml(stripCiteRefs(n.answer || '')).replace(/<span class="sk-cite"[^>]*>[^<]*<\/span>/g, '');
      const src = this.noteSources(n)
        .map((s) => `<li>${this.escape((s.systemCode ? s.systemCode + ' · ' : '') + (s.sourceFile || ''))}`
          + `${s.sectionPath ? ' — ' + this.escape(s.sectionPath) : ''}</li>`)
        .join('');
      return `<h2>${i + 1}. ${this.escape(n.question || this.i18n('statkomek.notesNoQ', 'Ответ', 'Жауап', 'Answer'))}</h2>`
        + body
        + (n.userNote ? `<p class="mine"><b>${this.escape(this.i18n('statkomek.notesMine', 'Моя заметка', 'Менің ескертпем', 'My note'))}:</b> ${this.escape(n.userNote)}</p>` : '')
        + (src ? `<p class="src">${this.escape(this.i18n('statkomek.sources', 'Источники', 'Дереккөздер', 'Sources'))}:</p><ul class="src">${src}</ul>` : '');
    }).join('<hr>');
    const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">'
      + `<head><meta charset="utf-8"><title>${this.escape(title)}</title>`
      + '<style>body{font-family:"Times New Roman",serif;font-size:13pt;line-height:1.3}'
      + 'h1{font-size:18pt}h2{font-size:14pt;margin-top:14pt}'
      + 'table{border-collapse:collapse}td,th{border:1px solid #000;padding:4px 6px;font-size:11pt}'
      + '.mine{background:#fff8dc;padding:4pt}.src{font-size:10pt;color:#555}'
      + 'code{font-family:"Courier New",monospace;font-size:11pt}</style></head><body>'
      + `<h1>${this.escape(title)}</h1>` + parts + '</body></html>';
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const d = new Date();
    const pad = (x: number) => (x < 10 ? '0' : '') + x;
    const base = title.replace(/[^\p{L}\p{N}_-]+/gu, '_').replace(/^_+|_+$/g, '') || 'Памятка';
    a.download = `${base}_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.doc`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  downloadNoteTable(n: NoteView): void {
    this.downloadTable({ role: 'bot', text: '', timestamp: new Date(), table: n.table });
  }

  /**
   * Потоковый режим: ответ печатается по мере генерации. Если поток не поддерживается
   * (старый браузер, прокси режет SSE) и ни одного куска не пришло — обычный запрос.
   */
  private sendStream(text: string, systemId?: number): void {
    const extra = this.nextExtra;
    this.nextExtra = null;
    if (typeof fetch !== 'function' || typeof ReadableStream === 'undefined' || typeof TextDecoder === 'undefined') {
      this.sendClassic(text, systemId, extra);
      return;
    }
    const bot: ChatMessage = { role: 'bot', text: '', html: null, timestamp: new Date(), streaming: true };
    let raw = '';
    let started = false;
    // сервер уже прислал хоть одно событие — вопрос в работе: повторять его обычным запросом нельзя
    // (иначе rag отвечает дважды, как было с GLM-5.3), лучше честно показать ошибку
    let alive = false;
    const fail = () => {
      if (!alive) { this.sendClassic(text, systemId, extra); return; }
      if (!started) { this.loading = false; this.messages.push(bot); }
      this.finishError(bot);
    };
    this.statusText = null;
    this.streamingMsg = bot;
    this.streamSub?.unsubscribe();
    this.streamSub = this.chatService.askStream(text, systemId, this.chatId ?? undefined, this.portalLang, extra).subscribe({
      next: (ev) => {
        alive = true;
        if (ev.type === 'status') {
          if (ev.stage === 'tool') {
            this.statusText = this.toolStatus(ev);
          } else if (ev.stage === 'think') {
            if (!started) {
              this.statusText = this.i18n('statkomek.statusThink', 'Модель обдумывает ответ…',
                'Модель жауапты ойластырып жатыр…', 'The model is thinking…');
            }
          } else if (ev.stage === 'advise') {
            this.statusText = this.i18n('statkomek.statusAdvise', 'Совет: читаю документы по задаче — функции, интеграции, API, роли…',
              'Кеңес: тапсырма бойынша құжаттарды оқып жатырмын…', 'Advice: reading the docs around your task…');
          } else if (ev.stage === 'deep') {
            this.statusText = this.i18n('statkomek.statusDeep', 'Глубокий анализ: читаю разделы документов целиком…',
              'Терең талдау: құжат бөлімдерін толық оқып жатырмын…', 'Deep analysis: reading whole document sections…');
          } else if (ev.stage === 'write') {
            const where = ev.system ? ' ' + this.i18n('statkomek.statusIn', 'в', 'ішінен', 'in') + ' ' + ev.system : '';
            this.statusText = this.i18n('statkomek.statusFound', 'Нашёл', 'Табылды', 'Found') + ' ' + ev.found + ' '
              + this.fragmentsWord(ev.found) + where + ', ' + this.i18n('statkomek.statusWriting', 'пишу ответ…', 'жауап жазып жатырмын…', 'writing the answer…');
          }
        } else if (ev.type === 'delta') {
          if (!started) {
            started = true;
            this.loading = false;
            this.messages.push(bot);
          }
          raw += ev.text;
          this.renderStreaming(bot, raw);
        } else if (ev.type === 'done') {
          this.finishAnswer(ev.data, started ? bot : null);
        } else if (ev.type === 'error') {
          fail();
        }
      },
      error: (err) => {
        console.warn('stream failed', err);
        fail();
      },
    });
  }

  /** Перерисовка печатающегося ответа не чаще раза в 80 мс. Номера [n] прячем до финала. */
  private renderStreaming(bot: ChatMessage, raw: string): void {
    bot.text = raw;
    if (this.renderTimer) { return; }
    this.renderTimer = setTimeout(() => {
      this.renderTimer = undefined;
      bot.html = this.formatAnswer(stripCiteRefs(bot.text)).html;
      this.shouldScroll = true;
    }, 80);
  }

  private finishAnswer(res: AnswerResponse, streamed: ChatMessage | null): void {
    if (this.renderTimer) { clearTimeout(this.renderTimer); this.renderTimer = undefined; }
    this.loading = false;
    this.statusText = null;
    this.streamingMsg = null;
    this.chatId = res.chatId ?? this.chatId;
    const final = this.botFromResponse(res);
    if (streamed) {
      Object.assign(streamed, final, { streaming: false });
    } else {
      this.messages.push(final);
    }
    this.shouldScroll = true;
    this.loadChats();
  }

  private finishError(bot: ChatMessage): void {
    this.loading = false;
    this.statusText = null;
    this.streamingMsg = null;
    bot.streaming = false;
    const tail = this.translate.instant('statkomek.error');
    bot.text = (bot.text ? bot.text + '\n\n' : '') + tail;
    bot.html = this.formatAnswer(stripCiteRefs(bot.text)).html;
    this.shouldScroll = true;
  }

  /** Обычный (не потоковый) запрос — запасной путь. */
  private sendClassic(text: string, systemId?: number, extra?: AskExtra | null): void {
    this.loading = true;
    this.chatService.ask(text, systemId, this.chatId ?? undefined, this.portalLang, extra).subscribe({
      next: (res) => this.finishAnswer(res, null),
      error: (err) => {
        this.loading = false;
        this.messages.push({
          role: 'bot',
          text: this.translate.instant('statkomek.error'),
          timestamp: new Date(),
        });
        this.shouldScroll = true;
        console.error('Chat error:', err);
      },
    });
  }

  private botFromResponse(res: AnswerResponse): ChatMessage {
    const reply = this.formatAnswer(res.answer || this.translate.instant('statkomek.noAnswerFallback'));
    return {
      role: 'bot',
      text: reply.plain,
      html: reply.html,
      timestamp: new Date(),
      messageId: res.messageId,
      confidence: res.confidence,
      sources: this.normalizeSources(res.sources, res.sourceTexts),
      feedback: null,
      answerSource: res.answerSource,
      suggestions: res.answerSource === 'clarify'
        ? (res.suggestions && res.suggestions.length ? res.suggestions : this.parseSuggestions(reply.plain))
        : [],
      followUps: res.answerSource === 'clarify' ? [] : (res.followUps || []),
      isDraft: res.mode === 'draft' || res.answerSource === 'draft',
      markdown: res.mode === 'draft' || res.answerSource === 'draft' ? res.answer : undefined,
      apiCheck: res.apiCheck || [],
      table: res.table && Array.isArray(res.table.rows) ? res.table : undefined,
    };
  }

  /**
   * «Остановить»: перестаём ждать ответ. Напечатанное остаётся на экране;
   * rag всё равно досчитает и сохранит ответ в истории.
   */
  stopStreaming(): void {
    this.streamSub?.unsubscribe();
    this.streamSub = undefined;
    if (this.renderTimer) { clearTimeout(this.renderTimer); this.renderTimer = undefined; }
    const bot = this.streamingMsg;
    this.streamingMsg = null;
    this.loading = false;
    this.statusText = null;
    if (bot) {
      bot.streaming = false;
      if (bot.text) {
        bot.html = this.formatAnswer(stripCiteRefs(bot.text)).html;
      } else {
        const i = this.messages.indexOf(bot);
        if (i >= 0) { this.messages.splice(i, 1); }
      }
    }
    this.shouldScroll = true;
  }

  toggleWide(): void {
    this.isWide = !this.isWide;
  }

  /** ≥ 75% — без подсказки; 50–75% — «проверьте по источнику»; ниже — «нашлось немного». */
  confHint(msg: ChatMessage): 'check' | 'low' | null {
    if (msg.streaming || this.isClarify(msg) || !msg.messageId) { return null; }
    if (msg.answerSource === 'faq' || msg.answerSource === 'greeting' || msg.answerSource === 'chitchat'
      || msg.answerSource === 'tool') { return null; }
    const c = this.confScore(msg);
    if (c == null) { return null; }
    if (c >= 0.75) { return null; }
    return c >= 0.5 ? 'check' : 'low';
  }

  /** Главное в плашке источника — раздел (последний уровень), иначе файл. */
  sourceTitle(s: ChatSource): string {
    if (s.sectionPath) {
      const parts = s.sectionPath.split('›').map((x) => x.trim()).filter(Boolean);
      const last = parts[parts.length - 1] || s.sectionPath;
      return last.length > 60 ? last.slice(0, 60) + '…' : last;
    }
    return (s.systemCode ? s.systemCode + ' · ' : '') + (s.sourceFile || this.translate.instant('statkomek.chunk'));
  }

  /** Текст ответа без значков + список источников — чтобы вставить в письмо филиалу/респонденту. */
  copyAsLetter(msg: ChatMessage): void {
    const src = this.citedSources(msg).map((s) => {
      const file = s.sourceFile || '';
      const sec = s.sectionPath ? ', раздел «' + s.sectionPath.split('›').map((x) => x.trim()).pop() + '»' : '';
      return '— ' + (s.systemCode ? s.systemCode + ', ' : '') + file + sec;
    });
    const uniq = Array.from(new Set(src));
    const body = (msg.text || '').trim() + (uniq.length ? '\n\nИсточник:\n' + uniq.join('\n') : '');
    navigator.clipboard.writeText(body).then(() => {
      msg.letterCopied = true;
      setTimeout(() => { msg.letterCopied = false; }, 1600);
    });
  }

  private fragmentsWord(n: number): string {
    if (this.portalLang === 'kz') { return 'фрагмент'; }
    if (this.portalLang === 'en') { return n === 1 ? 'fragment' : 'fragments'; }
    const d10 = n % 10, d100 = n % 100;
    if (d10 === 1 && d100 !== 11) { return 'фрагмент'; }
    if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) { return 'фрагмента'; }
    return 'фрагментов';
  }

  /** Клик по значку ⁽ⁿ⁾ в тексте — открыть источник n. */
  onAnswerClick(msg: ChatMessage, event: MouseEvent): void {
    const flow = (event.target as HTMLElement | null)?.closest?.('.sk-flow') as HTMLElement | null;
    if (flow) {
      this.openFlow(flow);
      event.stopPropagation();
      return;
    }
    const el = (event.target as HTMLElement | null)?.closest?.('.sk-cite') as HTMLElement | null;
    if (!el) { return; }
    const ref = Number(el.getAttribute('data-ref'));
    const idx = this.citedSources(msg).findIndex((s) => s.ref === ref);
    if (idx >= 0) {
      msg.openSource = idx;
      event.stopPropagation();
    }
  }

  /**
   * Скриншоты и схемы под ответом (без повторов). Какие показать, решает rag: рисунки процитированных
   * кусков, а если сотрудник просил схему — и остальных найденных. Процитированные идут первыми.
   */
  figures(msg: ChatMessage): ChatFigure[] {
    if (msg.streaming || this.isClarify(msg)) { return []; }
    const seen = new Set<number>();
    const out: ChatFigure[] = [];
    const cited = this.citedSources(msg);
    const all = [...cited, ...(msg.sources || []).filter((s) => !cited.includes(s))];
    for (const s of all) {
      for (const f of s.figures || []) {
        // не загрузился (нет файла / скрыт) — не показываем пустую серую карточку
        if (f && f.id != null && !seen.has(f.id) && !this.figureFailed.has(f.id)) { seen.add(f.id); out.push(f); }
      }
    }
    return out;
  }

  /** blob-URL скриншота; при первом обращении — загрузка (картинка появится после неё). */
  figureUrl(id: number): SafeUrl | null {
    if (this.figureUrls.has(id)) { return this.figureUrls.get(id) || null; }
    this.figureUrls.set(id, null);
    this.chatService.getAsset(id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.objectUrls.push(url);
        this.figureUrls.set(id, this.sanitizer.bypassSecurityTrustUrl(url));
      },
      error: (e) => {
        this.figureFailed.add(id);
        // причина от портала / rag / ingestion: «asset 485 hidden: …», «minio …: NoSuchKey» и т.п.
        console.warn('[StatKomek] рисунок ' + id + ' не загрузился: ' + (e?.status ?? '') + ' '
          + (e?.headers?.get?.('X-StatKomek-Error') || ''), e);
      },
    });
    return null;
  }

  openFigure(f: ChatFigure): void {
    this.lightbox = f;
  }

  rate(msg: ChatMessage, value: 1 | -1): void {
    if (!msg.messageId || msg.ratingBusy) { return; }
    if (value === -1 && msg.feedback !== -1) {
      this.openDislike(msg);
      return;
    }
    this.sendRating(msg, msg.feedback === value ? null : value);
  }

  openDislike(msg: ChatMessage): void {
    this.dislikeMsg = msg;
    if (!msg.commentDraft) { msg.commentDraft = ''; }
    if (msg.feedback !== -1) {
      this.sendRating(msg, -1);
    }
    setTimeout(() => this.dislikeArea?.nativeElement.focus(), 40);
  }

  closeDislike(): void {
    this.dislikeMsg = null;
  }

  submitDislike(): void {
    const msg = this.dislikeMsg;
    if (!msg) { return; }
    this.sendComment(msg);
    this.dislikeMsg = null;
  }

  private sendRating(msg: ChatMessage, next: 1 | -1 | null): void {
    const prev = msg.feedback ?? null;
    const prevSent = !!msg.commentSent;
    msg.feedback = next;
    msg.ratingBusy = true;
    if (next !== -1) {
      msg.commentSent = false;
    }
    this.chatService.feedback(msg.messageId!, next, next === -1 ? msg.commentDraft : undefined).subscribe({
      next: () => { msg.ratingBusy = false; },
      error: (e) => {
        msg.feedback = prev;
        msg.commentSent = prevSent;
        msg.ratingBusy = false;
        if (next === -1) { this.dislikeMsg = null; }
        console.error('feedback error', e);
      },
    });
  }

  sendComment(msg: ChatMessage): void {
    if (!msg.messageId || msg.feedback !== -1 || msg.ratingBusy) { return; }
    msg.ratingBusy = true;
    this.chatService.feedback(msg.messageId, -1, (msg.commentDraft || '').trim()).subscribe({
      next: () => {
        msg.ratingBusy = false;
        msg.commentSent = true;
      },
      error: (e) => { msg.ratingBusy = false; console.error('feedback comment error', e); },
    });
  }

  showFbComment(_msg: ChatMessage): boolean {
    return false;
  }

  showFbThanks(msg: ChatMessage): boolean {
    if (this.dislikeMsg === msg) { return false; }
    return msg.feedback === 1 || msg.feedback === -1;
  }

  askHideChat(chat: ChatSummary, event: Event): void {
    event.stopPropagation();
    this.hideChatTip();
    this.confirmHide = { mode: 'one', chat };
  }

  askHideAll(): void {
    if (!this.chatList.length || this.hideBusy) { return; }
    this.confirmHide = { mode: 'all' };
  }

  closeHideConfirm(): void {
    if (this.hideBusy) { return; }
    this.confirmHide = null;
  }

  confirmHideRun(): void {
    const job = this.confirmHide;
    if (!job || this.hideBusy) { return; }
    this.hideBusy = true;
    const req = job.mode === 'all'
      ? this.chatService.hideAllChats()
      : this.chatService.hideChat(job.chat!.id);
    const hiddenId = job.mode === 'all' ? null : job.chat!.id;
    req.subscribe({
      next: () => {
        this.hideBusy = false;
        this.confirmHide = null;
        if (job.mode === 'all' || hiddenId === this.chatId) {
          this.newChat();
        }
        this.loadChats();
      },
      error: (e) => {
        this.hideBusy = false;
        console.error('hide chat error', e);
      },
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.systemMenuOpen) { return; }
    const root = this.systemWrap?.nativeElement;
    if (root && !root.contains(event.target as Node)) {
      this.closeSystemMenu();
    }
  }

  /** Схема из ответа — крупно: колёсико / кнопки — масштаб, мышь — сдвиг. */
  openFlow(fig: HTMLElement): void {
    const svg = fig.querySelector('svg');
    if (!svg) { return; }
    const vb = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
    const w = vb[2] || svg.clientWidth || 600;
    const h = vb[3] || svg.clientHeight || 400;
    const raw = svg.outerHTML;
    this.flowView = { svg: this.sanitizer.bypassSecurityTrustHtml(raw), raw, w, h };
    setTimeout(() => this.flowFit(), 0);
  }

  flowFit(): void {
    const st = this.flowStage?.nativeElement;
    if (!st || !this.flowView) { return; }
    const s = Math.min((st.clientWidth - 40) / this.flowView.w, (st.clientHeight - 40) / this.flowView.h, 2.5);
    this.flowScale = Math.max(0.2, s);
    this.flowX = (st.clientWidth - this.flowView.w * this.flowScale) / 2;
    this.flowY = (st.clientHeight - this.flowView.h * this.flowScale) / 2;
  }

  flowZoom(factor: number, cx?: number, cy?: number): void {
    const st = this.flowStage?.nativeElement;
    if (!st) { return; }
    const px = cx ?? st.clientWidth / 2, py = cy ?? st.clientHeight / 2;
    const next = Math.min(6, Math.max(0.2, this.flowScale * factor));
    const k = next / this.flowScale;
    this.flowX = px - (px - this.flowX) * k;
    this.flowY = py - (py - this.flowY) * k;
    this.flowScale = next;
  }

  onFlowWheel(e: WheelEvent): void {
    e.preventDefault();
    const r = this.flowStage?.nativeElement.getBoundingClientRect();
    this.flowZoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, r ? e.clientX - r.left : undefined, r ? e.clientY - r.top : undefined);
  }

  onFlowDown(e: MouseEvent): void {
    this.flowDrag = { x: e.clientX, y: e.clientY, fx: this.flowX, fy: this.flowY };
  }

  @HostListener('document:mousemove', ['$event'])
  onFlowMove(e: MouseEvent): void {
    if (!this.flowDrag) { return; }
    this.flowX = this.flowDrag.fx + e.clientX - this.flowDrag.x;
    this.flowY = this.flowDrag.fy + e.clientY - this.flowDrag.y;
  }

  @HostListener('document:mouseup')
  onFlowUp(): void {
    this.flowDrag = null;
  }

  downloadFlow(): void {
    if (!this.flowView) { return; }
    const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + this.flowView.raw], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Схема_StatKomek.svg';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.docView) {
      this.docView = null;
      return;
    }
    if (this.editingRetryOf != null) {
      this.cancelEdit();
      return;
    }
    if (this.pinMsg) {
      this.pinMsg = null;
      return;
    }
    if (this.flowView) {
      this.flowView = null;
      return;
    }
    if (this.lightbox) {
      this.lightbox = null;
      return;
    }
    if (this.systemMenuOpen) {
      this.closeSystemMenu();
      return;
    }
    if (this.renamingId != null) {
      this.cancelRename();
      return;
    }
    if (this.dislikeMsg) {
      this.closeDislike();
      return;
    }
    if (this.confirmHide) {
      this.closeHideConfirm();
    }
  }

  confScore(msg: ChatMessage): number | null {
    const c = msg.confidence;
    if (c == null || Number.isNaN(c)) { return null; }
    return c > 1 ? c / 100 : c;
  }

  confBand(msg: ChatMessage): 'hi' | 'mid' | 'lo' | null {
    const c = this.confScore(msg);
    if (c == null) { return null; }
    if (c < 0.5) { return 'lo'; }
    if (c < 0.75) { return 'mid'; }
    return 'hi';
  }

  toggleSrc(msg: ChatMessage, i: number): void {
    msg.openSource = msg.openSource === i ? null : i;
  }

  parseSuggestions(text: string): string[] {
    const out: string[] = [];
    const lines = (text || '').split(/\n/);
    for (const line of lines) {
      const m = line.trim().match(/^(?:\d+[.)]|[-*•])\s+(.+)$/);
      if (!m) { continue; }
      const s = m[1].replace(/\*\*/g, '').trim();
      if (s.length >= 8 && s.length <= 180) { out.push(s); }
      if (out.length >= 4) { break; }
    }
    return out;
  }

  askFollowUp(text: string): void {
    if (!text || this.loading) { return; }
    this.question = text;
    this.send();
  }

  isClarify(msg: ChatMessage): boolean {
    return msg.answerSource === 'clarify';
  }

  i18n(key: string, ru: string, kz?: string, en?: string): string {
    const t = this.translate.instant(key);
    if (t && t !== key) { return t; }
    if (this.portalLang === 'kz') { return kz || ru; }
    if (this.portalLang === 'en') { return en || ru; }
    return ru;
  }

  citedSources(msg: ChatMessage): ChatSource[] {
    const src = msg.sources || [];
    // Новый rag сам помечает, что модель реально процитировала: cited + ref ([1], [2] в тексте).
    if (src.some((s) => typeof s.cited === 'boolean')) {
      const withRef = src.filter((s) => s.cited && s.ref != null)
        .sort((a, b) => (a.ref as number) - (b.ref as number));
      if (withRef.length) { return withRef; }
      return src.filter((s) => s.cited).slice(0, 3);
    }
    // старые сообщения без поля cited — прежняя эвристика по score
    let max = 0;
    src.forEach((s) => { if ((s.score || 0) > max) { max = s.score || 0; } });
    const seen = new Set<number | string>();
    const out: ChatSource[] = [];
    for (const s of src) {
      const sc = s.score || 0;
      if (sc < 0.55 || sc < max - 0.08) { continue; }
      const key = s.documentId != null ? s.documentId : (s.sourceFile || out.length);
      if (seen.has(key)) { continue; }
      seen.add(key);
      out.push(s);
      if (out.length >= 3) { break; }
    }
    return out;
  }

  copyMessage(msg: ChatMessage): void {
    const value = msg.text || '';
    navigator.clipboard.writeText(value).then(() => {
      this.messages.forEach((item) => (item.copied = false));
      msg.copied = true;
      if (this.copyTimer) { clearTimeout(this.copyTimer); }
      this.copyTimer = setTimeout(() => { msg.copied = false; }, 1600);
    });
  }

  formatTime(date: Date): string {
    const locale = this.portalLang === 'kz' ? 'kk-KZ' : this.portalLang === 'en' ? 'en-US' : 'ru-RU';
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit', minute: '2-digit',
    }).format(date);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private refreshGreeting(): void {
    const fromJson = this.translate.instant('statkomek.greeting');
    const jsonOk = fromJson && fromJson !== 'statkomek.greeting';
    if (this.isKazakh) {
      this.greeting = this.greetingKk || (jsonOk ? fromJson : this.greetingRu);
    } else if (this.portalLang === 'en') {
      this.greeting = jsonOk ? fromJson : (this.greetingRu || fromJson);
    } else {
      this.greeting = this.greetingRu || (jsonOk ? fromJson : '');
    }
    if (!this.greeting) {
      this.greeting = jsonOk ? fromJson : '';
    }
  }

  private fromStored(m: any): ChatMessage {
    const ts = new Date(m.createdAt || m.created_at || Date.now());
    const source = m.answerSource || m.answer_source;
    if (m.role === 'assistant' || m.role === 'bot') {
      const r = this.formatAnswer(m.content || m.answer || '');
      const isDraft = source === 'draft';
      return {
        isDraft,
        markdown: isDraft ? (m.content || '') : undefined,
        apiCheck: isDraft ? (m.apiCheck || []) : undefined,
        table: m.table && Array.isArray(m.table.rows) ? m.table : undefined,
        role: 'bot',
        text: r.plain,
        html: r.html,
        timestamp: ts,
        messageId: m.id,
        confidence: m.confidence,
        feedback: m.feedback,
        commentDraft: m.feedbackComment || m.feedback_comment || '',
        commentSent: !!(m.feedbackComment || m.feedback_comment),
        sources: this.normalizeSources(m.sources, null, m.sourcesJson || m.sources_json),
        answerSource: m.answerSource || m.answer_source,
        suggestions: (m.answerSource || m.answer_source) === 'clarify' ? this.parseSuggestions(r.plain) : [],
      };
    }
    const content: string = m.content || m.text || '';
    const at = content.indexOf(SHOT_MARK);
    if (at >= 0) {
      return {
        role: 'user', text: content.slice(0, at), shotText: content.slice(at + SHOT_MARK.length),
        timestamp: ts, draftRequest: source === 'draft',
      };
    }
    return { role: 'user', text: content, timestamp: ts, draftRequest: source === 'draft' };
  }

  private normalizeSources(sources?: ChatSource[] | string[] | null, texts?: string[] | null, json?: any): ChatSource[] {
    // старый rag отдавал jsonb объектом драйвера { type: 'jsonb', value: '[…]' }
    if (json && typeof json === 'object' && !Array.isArray(json) && typeof json.value === 'string') {
      json = json.value;
    }
    if (typeof json === 'string') {
      try { json = JSON.parse(json); } catch { json = null; }
    }
    const raw = sources || json || (texts || []).map((t) => ({ text: t }));
    if (!Array.isArray(raw)) return [];
    return raw.map((s: any) => {
      if (typeof s === 'string') return { text: s };
      return {
        ...s,
        systemCode: s.systemCode || s.system_code,
      };
    });
  }

  private welcomeMessage(): ChatMessage {
    const html = markdownToHtml(this.greeting);
    return {
      role: 'bot',
      text: markdownToPlain(this.greeting) || this.greeting,
      html: this.sanitizer.bypassSecurityTrustHtml(html || `<p>${this.greeting}</p>`),
      timestamp: new Date(),
    };
  }

  private resetWelcome(): void {
    this.refreshGreeting();
    this.messages = [this.welcomeMessage()];
  }

  formatAnswer(markdown: string): { plain: string; html: SafeHtml } {
    const html = markdownToHtml(markdown);
    return {
      plain: markdownToPlain(markdown) || markdown,
      html: this.sanitizer.bypassSecurityTrustHtml(html),
    };
  }

  private scrollToBottom(): void {
    const el = this.chatBody?.nativeElement;
    if (el) { el.scrollTop = el.scrollHeight; }
  }

  resizeInput(): void {
    const el = this.inputEl?.nativeElement;
    if (!el) { return; }
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }
}

/**
 * Вопрос, а не правка черновика: есть «?» или вопросительное начало и нет глаголов правки
 * («добавь», «убери», «измени», «перепиши»…). «Добавь поле Автор?» — правка; «если одну сделать неактивной, как будет?» — вопрос.
 */
export function looksLikeQuestionNotEdit(text: string): boolean {
  const t = (text || '').trim().toLowerCase();
  if (!t) { return false; }
  const edit = /(^|[\s,.;:«(])(добав|убер|удали|измени|замени|перепиш|уточни|сделай|допиш|исправ|сократи|расширь|переимену|вставь|учти|укажи|добавить|убрать|изменить|заменить|переписать|не нужн|оставь|раздели|объедини|поменяй|қос|алып таста|өзгерт)/;
  if (edit.test(t)) { return false; }
  const question = /\?\s*$/.test(t)
    || /^(что|как|какой|какая|какие|каким|почему|зачем|где|когда|кто|чем|сколько|можно ли|нужно ли|есть ли|а если|если .*(как|что) будет|қалай|не үшін|қандай)(?=[\s,?!.]|$)/.test(t);
  return question;
}
