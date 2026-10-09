import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CurrentUserService } from '../../shared/services/current-user.service';

export interface ChatSource {
  chunkId?: number;
  documentId?: number;
  chunkNo?: number;
  sourceFile?: string;
  systemId?: number;
  systemCode?: string;
  score?: number;
  cited?: boolean;
  /** номер ссылки [n] в тексте ответа (rag ставит, если модель сослалась на фрагмент) */
  ref?: number | null;
  /** раздел документа: «Модуль «Показатели» › 3.2 Создание» */
  sectionPath?: string | null;
  /** скриншоты из этого куска документа */
  figures?: ChatFigure[];
  text?: string;
}

export interface ChatFigure {
  id: number;
  caption?: string | null;
}

/** События потокового ответа /ask/stream. */
export type StreamEvent =
  | { type: 'status'; stage: string; found: number; system?: string | null; tool?: string | null; count?: number }
  | { type: 'delta'; text: string }
  | { type: 'done'; data: AnswerResponse }
  | { type: 'error'; message: string };

export interface AnswerResponse {
  answer: string;
  found: boolean;
  confidence: number;
  chatId: number;
  messageId?: number;
  questionId?: number;
  answerSource?: string;
  responseMs?: number;
  sources?: ChatSource[] | string[];
  sourceTexts?: string[];
  suggestions?: string[];
  /** следующие вопросы — кнопки под ответом */
  followUps?: string[];
  clarify?: boolean;
  /** "draft" — черновик требований (помощник по требованиям) */
  mode?: string;
  /** сверка методов API из черновика с описанием API системы */
  apiCheck?: ApiCheck[];
  draftId?: number;
  /** режим требований: пришёл вопрос, черновик не менялся */
  draftSkipped?: boolean;
  /** черновик — доработка прошлого */
  revision?: boolean;
  /** mode = "tool": данные из системы через MCP-шлюз — таблица для «Скачать Excel» */
  table?: ToolTable;
}

/** Ответ из системы (META и др.) по списку id: вся таблица, в тексте ответа — только первые строки. */
export interface ToolTable {
  tool: string;
  title: string;
  system?: string;
  columns: string[];
  rows: unknown[][];
  total: number;
  found: number;
  notFound?: unknown[];
  truncated?: boolean;
}

export interface ApiCheck {
  method: string;
  path: string;
  /** exists — есть в API; new — помечен как новый; not_found — выдан за существующий, а его нет; unverified — API не загружено */
  status: 'exists' | 'new' | 'not_found' | 'unverified';
}

export interface ChatSystem {
  id: number;
  code: string;
  name: string;
  nameRu?: string;
  nameKk?: string;
  description?: string;
  descriptionRu?: string;
  descriptionKk?: string;
}
export interface ChatSummary {
  id: number;
  title: string;
  started_at?: string;
  startedAt?: string;
  system_code?: string;
  systemCode?: string;
  systemId?: number;
  systemName?: string;
  systemNameRu?: string;
  systemNameKk?: string;
  firstQuestion?: string;
  first_question?: string;
  /** поиск по истории: кусок текста с найденным словом */
  match?: string;
}

export interface ChatConfig {
  greeting: string;
  greetingRu?: string;
  greetingKk?: string;
  noAnswerText: string;
  noAnswerTextKk?: string;
  feedbackEnabled: boolean;
  /** кнопка «Помочь написать требование» (настройка draft.enabled) */
  draftEnabled?: boolean;
  /** запросы в системы через MCP-шлюз (mcp.enabled) */
  toolsEnabled?: boolean;
  /** ★ «В памятку» и «Мои памятки» (notes.enabled) */
  notesEnabled?: boolean;
  /** кнопка «Скриншот» (chat.screenshot.enabled) */
  screenshotEnabled?: boolean;
  /** «Новое в базе» (chat.news.enabled) */
  newsEnabled?: boolean;
  /** популярные вопросы в новом чате (chat.popular.enabled) */
  popularEnabled?: boolean;
  /** Кнопка «Глубокий анализ» этому сотруднику (админка: всем / тестировщикам / выкл.). */
  deepEnabled?: boolean;
  /** Показывать ли кнопку чата этому сотруднику (админка: всем / только тестировщикам / никому). */
  widgetVisible?: boolean;
}

/** Кнопки под ответом: rewrite — «Короче/Подробнее/Простыми словами», retryOf — «Спросить заново». */
export interface AskExtra {
  rewrite?: 'short' | 'detail' | 'simple';
  retryOf?: number;
  /** «Глубокий анализ»: шире поиск, разделы целиком, обзоры документов, разбор с выводом. */
  deep?: boolean;
  /** «Совет»: сначала читает документы по подвопросам, потом советует (доступ как у глубокого анализа). */
  advise?: boolean;
}

interface AskBody extends AskExtra {
  question: string;
  systemId?: number;
  chatId?: number;
  lang?: string;
}

/** «Новое в базе». */
export interface NewsItem {
  documentId: number;
  sourceFile: string;
  description?: string | null;
  version?: number;
  updated?: boolean;
  systemId?: number;
  systemCode?: string;
  changedAt?: string;
}

/** Текст документа для «Открыть документ». */
export interface DocumentText {
  documentId: number;
  sourceFile: string;
  systemCode?: string;
  version?: number;
  changedAt?: string;
  hasFile?: boolean;
  truncated?: boolean;
  chunks: { chunkNo: number; sectionPath?: string | null; text: string }[];
}

/** «Мои памятки»: папка сотрудника с сохранёнными ответами. */
export interface Notebook {
  id: number;
  title: string;
  count: number;
  updatedAt?: string;
}

/** Сохранённый вопрос+ответ (копия на момент сохранения). */
export interface NoteItem {
  id: number;
  notebookId: number;
  notebookTitle?: string;
  chatId?: number | null;
  /** исходный чат ещё есть в истории сотрудника */
  chatOpen?: boolean;
  messageId?: number | null;
  systemCode?: string | null;
  question?: string | null;
  answer: string;
  sources?: ChatSource[];
  table?: ToolTable;
  userNote?: string | null;
  createdAt?: string;
}

export interface NotebookList {
  success: boolean;
  notebooks: Notebook[];
  total: number;
  savedMessageIds: number[];
  error?: string;
}

export interface NotebookResult {
  success: boolean;
  error?: string;
  duplicate?: boolean;
  noteId?: number;
  title?: string;
  userNote?: string | null;
  notebook?: { id: number; title: string };
  notes?: NoteItem[];
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly BASE = '/internalportal/api/chat';

  constructor(private http: HttpClient, private currentUser: CurrentUserService) {}

  /** Текущий токен портала ('' — сотрудник ещё не вошёл). Виджет по смене токена перечитывает настройки и историю. */
  tokenNow(): string {
    return this.currentUser.getToken() || '';
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + (this.currentUser.getToken() || ''),
    });
  }

  /** Юзера в теле нет — портал сам достаёт employeeId/fullName из токена. */
  ask(question: string, systemId?: number, chatId?: number, lang?: string, extra?: AskExtra | null): Observable<AnswerResponse> {
    const body: AskBody = { question };
    if (systemId != null) body.systemId = systemId;
    if (chatId != null) body.chatId = chatId;
    if (lang) body.lang = lang;
    Object.assign(body, extra || {});
    return this.http.post<AnswerResponse>(`${this.BASE}/ask`, body, { headers: this.headers() });
  }

  /** Потоковый ответ: текст приходит кусками (delta), в конце — полный ответ (done). fetch, т.к. HttpClient не стримит. */
  askStream(question: string, systemId?: number, chatId?: number, lang?: string, extra?: AskExtra | null): Observable<StreamEvent> {
    const body: AskBody = { question };
    if (systemId != null) body.systemId = systemId;
    if (chatId != null) body.chatId = chatId;
    if (lang) body.lang = lang;
    Object.assign(body, extra || {});
    return this.streamPost('/ask/stream', body);
  }

  /**
   * Помощник по требованиям: черновик «Требования к задаче» потоком.
   * previousDraft — прошлый черновик, если сотрудник просит его доработать.
   */
  draftStream(task: string, systemId?: number, previousDraft?: string, chatId?: number): Observable<StreamEvent> {
    const body: { task: string; systemId?: number; previousDraft?: string; chatId?: number } = { task };
    if (systemId != null) body.systemId = systemId;
    if (previousDraft) body.previousDraft = previousDraft;
    if (chatId != null) body.chatId = chatId;
    return this.streamPost('/draft/stream', body);
  }

  private streamPost(path: string, body: object): Observable<StreamEvent> {
    return new Observable<StreamEvent>((sub) => {
      const ctrl = new AbortController();
      let finished = false;
      fetch(`${this.BASE}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          Authorization: 'Bearer ' + (this.currentUser.getToken() || ''),
        },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      })
        .then(async (res) => {
          if (!res.ok || !res.body) { throw new Error('HTTP ' + res.status); }
          const reader = res.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buf = '';
          for (;;) {
            const { value, done } = await reader.read();
            if (done) { break; }
            buf += decoder.decode(value, { stream: true });
            let m: RegExpExecArray | null;
            while ((m = /\r?\n\r?\n/.exec(buf)) !== null) {
              const raw = buf.slice(0, m.index);
              buf = buf.slice(m.index + m[0].length);
              const ev = parseSseEvent(raw);
              if (!ev) { continue; }
              if (ev.type === 'done' || ev.type === 'error') { finished = true; }
              sub.next(ev);
            }
          }
          if (!finished) { throw new Error('stream closed before done'); }
          sub.complete();
        })
        .catch((e) => { if (!ctrl.signal.aborted) { sub.error(e); } });
      return () => ctrl.abort();
    });
  }

  /** Скриншот из документа (Authorization нужен, поэтому blob, а не <img src>). */
  getAsset(id: number): Observable<Blob> {
    return this.http.get(`${this.BASE}/asset/${id}`, {
      headers: new HttpHeaders({ Authorization: 'Bearer ' + (this.currentUser.getToken() || '') }),
      responseType: 'blob',
    });
  }

  /** 👍 = 1, 👎 = -1, null — снять оценку. comment — что не так (к 👎). */
  feedback(messageId: number, value: 1 | -1 | null, comment?: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.BASE}/feedback`,
      { messageId, value, comment: comment || null },
      { headers: this.headers() },
    );
  }

  getConfig(): Observable<ChatConfig> {
    return this.http.get<ChatConfig>(`${this.BASE}/config`, { headers: this.headers() });
  }

  getSystems(): Observable<ChatSystem[]> {
    return this.http.get<ChatSystem[]>(`${this.BASE}/systems`, { headers: this.headers() });
  }

  /** q — поиск по своей истории (название, вопросы, ответы). */
  getChats(q?: string): Observable<ChatSummary[]> {
    const query = q && q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
    return this.http.get<ChatSummary[]>(`${this.BASE}/chats${query}`, { headers: this.headers() });
  }

  getChatMessages(chatId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/chats/${chatId}/messages`, { headers: this.headers() });
  }

  /** Чат пропадает у сотрудника, сообщения остаются в админке. */
  hideChat(chatId: number): Observable<{ success: boolean; hidden?: number }> {
    return this.http.post<{ success: boolean; hidden?: number }>(
      `${this.BASE}/chats/${chatId}/hide`,
      {},
      { headers: this.headers() },
    );
  }

  hideAllChats(): Observable<{ success: boolean; hidden?: number }> {
    return this.http.post<{ success: boolean; hidden?: number }>(
      `${this.BASE}/chats/hide-all`,
      {},
      { headers: this.headers() },
    );
  }

  /** Популярные вопросы для нового чата (по системе или по всем). */
  getPopular(systemId?: number | null, lang?: string): Observable<string[]> {
    const params: string[] = [];
    if (systemId != null) { params.push(`systemId=${systemId}`); }
    if (lang) { params.push(`lang=${encodeURIComponent(lang)}`); }
    const query = params.length ? `?${params.join('&')}` : '';
    return this.http.get<string[]>(`${this.BASE}/popular${query}`, { headers: this.headers(), observe: 'response' }).pipe(
      map((r) => {
        const err = r.headers.get('X-StatKomek-Error');
        if (err) { console.warn('[StatKomek] популярные вопросы: ' + err); }
        return r.body || [];
      }),
    );
  }

  /** «Новое в базе»: недавно загруженные / обновлённые документы. */
  getNews(): Observable<NewsItem[]> {
    return this.http.get<NewsItem[]>(`${this.BASE}/news`, { headers: this.headers() });
  }

  /** «Открыть документ»: текст документа по разделам. */
  getDocumentText(id: number): Observable<DocumentText> {
    return this.http.get<DocumentText>(`${this.BASE}/documents/${id}/text`, { headers: this.headers() });
  }

  /** «Скачать оригинал» (blob — нужен Authorization). */
  getDocumentFile(id: number): Observable<Blob> {
    return this.http.get(`${this.BASE}/documents/${id}/file`, {
      headers: new HttpHeaders({ Authorization: 'Bearer ' + (this.currentUser.getToken() || '') }),
      responseType: 'blob',
    });
  }

  /** Скриншот → текст (OCR). image — data:image/png;base64,… */
  ocr(image: string): Observable<{ success: boolean; text?: string; error?: string; hasError?: boolean }> {
    return this.http.post<{ success: boolean; text?: string; error?: string; hasError?: boolean }>(
      `${this.BASE}/ocr`, { image }, { headers: this.headers() });
  }

  /** «Мои памятки»: сотрудника портал берёт из токена. */
  notebooks(): Observable<NotebookList> {
    return this.http.post<NotebookList>(`${this.BASE}/notebooks/list`, {}, { headers: this.headers() });
  }

  notebookCall(op: 'create' | 'rename' | 'delete' | 'notes' | 'save' | 'note/update' | 'note/delete',
               body: Record<string, unknown>): Observable<NotebookResult> {
    return this.http.post<NotebookResult>(`${this.BASE}/notebooks/${op}`, body, { headers: this.headers() });
  }

  renameChat(chatId: number, title: string): Observable<{ success: boolean; title?: string }> {
    return this.http.post<{ success: boolean; title?: string }>(
      `${this.BASE}/chats/${chatId}/title`,
      { title },
      { headers: this.headers() },
    );
  }
}

/** «event:delta\ndata:{"text":"…"}» → StreamEvent. */
export function parseSseEvent(raw: string): StreamEvent | null {
  let event = 'message';
  const data: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith('event:')) { event = line.slice(6).trim(); }
    else if (line.startsWith('data:')) { data.push(line.slice(5).replace(/^ /, '')); }
  }
  if (!data.length) { return null; }
  let payload: any;
  try { payload = JSON.parse(data.join('\n')); } catch { return null; }
  if (event === 'status') {
    return {
      type: 'status', stage: String(payload?.stage ?? ''), found: Number(payload?.found ?? 0), system: payload?.system ?? null,
      tool: payload?.tool ?? null, count: Number(payload?.count ?? 0),
    };
  }
  if (event === 'delta') { return { type: 'delta', text: String(payload?.text ?? '') }; }
  if (event === 'done') { return { type: 'done', data: payload as AnswerResponse }; }
  if (event === 'error') { return { type: 'error', message: String(payload?.message ?? 'error') }; }
  return null;
}
