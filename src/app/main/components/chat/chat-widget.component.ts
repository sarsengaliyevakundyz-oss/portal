import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChatMessage, ChatService } from '../../../shared/services/chat.service';
import { marked } from 'marked';
import mermaid from 'mermaid';
import { Component, ViewChild, ElementRef, AfterViewChecked, AfterViewInit,
  Renderer2, NgZone, HostListener, OnDestroy } from '@angular/core';

export interface ChatMessageEx extends ChatMessage {
  html?: SafeHtml;
  copied?: boolean;
  typing?: boolean;
  displayText?: string;
}

const KEYWORDS = ['КСП', 'форма', 'период', 'разрезность', 'акроним', 'ТЗК', 'ТАЛДАУ', 'БДАП', 'СБОР', 'календарь', 'показатель', 'версия', 'классификатор', 'атрибут', 'публикация', 'метаданные'];

@Component({
  selector: 'app-chat-widget',
  templateUrl: './chat-widget.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  styleUrls: ['./chat-widget.component.scss']
})
export class ChatWidgetComponent implements AfterViewChecked, AfterViewInit {
  @ViewChild('chatBody') chatBody: ElementRef | undefined;
  @ViewChild('inputEl') inputEl: ElementRef | undefined;
  @ViewChild('robotWrap') robotWrap?: ElementRef<HTMLElement>;
  @ViewChild('robotBubble') robotBubble?: ElementRef<HTMLElement>;
  @ViewChild('mouth') mouthEl?: ElementRef<SVGPathElement>;
  @ViewChild('irisL') irisL?: ElementRef<SVGCircleElement>;
  @ViewChild('irisR') irisR?: ElementRef<SVGCircleElement>;
  @ViewChild('glintL') glintL?: ElementRef<SVGCircleElement>;
  @ViewChild('glintR') glintR?: ElementRef<SVGCircleElement>;

  isOpen = false;
  loading = false;
  question = '';
  docCount = '—';
  segCount = '—';
  mode: 'user' | 'analyst' = 'user';
  private mermaidReady = false;
  private typingIntervals: any[] = [];
  // Origin бэка — отсюда отдаются скриншоты /images/**. Совпадает с ChatService.BASE.
  private readonly API_ORIGIN = 'http://localhost:8090';
  hearts: { id: number; x: number; y: number; size: number; dur: number }[] = [];
  private heartTimer: any = null;
  private heartId = 0;
  private prevMsgCount = 0;
  private prevTypingLen = 0;
  messages: ChatMessageEx[] = [{
    role: 'bot',
    text: 'Привет! 👋 Я StatIQ — AI-методолог БНС.\nЯ помогу разобраться в системе Метаданных — формах, показателях, периодах и разрезностях. Задайте любой вопрос!',
    html: undefined,
    copied: false,
    timestamp: new Date()
  }];

  constructor(
    private chatService: ChatService,
    private sanitizer: DomSanitizer,
    private zone: NgZone   // <-- добавить, если конструктор уже есть, просто допиши этот параметр
  ) {
    this.loadHistory();
    this.loadStatus();
  }

  setMode(m: 'user' | 'analyst') { this.mode = m; }

  get userInitials(): string {
    try {
      const token = localStorage.getItem('access_token') || '';
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      const name = payload.name || payload.preferred_username || '';
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
    } catch {}
    return 'АБ';
  }

  formatTime(date?: Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  private loadStatus() {
    this.chatService.getStatus().subscribe({
      next: (res) => {
        this.docCount = String(res.documentsLoaded);
        this.segCount = String(res.segmentsIndexed);
      },
      error: () => {
        this.docCount = '—';
        this.segCount = '—';
      }
    });
  }

  ngAfterViewInit() {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: '#dbeafe',
        primaryTextColor: '#1e3a5f',
        primaryBorderColor: '#063971',
        lineColor: '#063971',
        secondaryColor: '#eff6ff',
        tertiaryColor: '#f0fdf4',
        background: '#ffffff',
        nodeBorder: '#063971',
        clusterBkg: '#f8fafc',
        titleColor: '#063971',
        edgeLabelBackground: '#ffffff',
        fontFamily: 'Nunito Sans, Arial, sans-serif',
        fontSize: '14px',
      },
      flowchart: { htmlLabels: true, curve: 'basis', padding: 20 }
    });
    this.mermaidReady = true;
  }

  ngAfterViewChecked() {
    // Скроллим вниз ТОЛЬКО когда реально что-то изменилось:
    // появилось новое сообщение, идёт печать, или включился лоадер.
    // Раньше scrollTop сбрасывался на КАЖДЫЙ цикл change detection —
    // поэтому скролл постоянно «тянуло» вниз при любом действии (ховер, ввод).
    const count = this.messages.length;
    const typingLen = this.messages.reduce((n, m) => n + (m.displayText?.length || 0), 0);

    if (count !== this.prevMsgCount || typingLen !== this.prevTypingLen || this.loading) {
      this.scrollToBottom();
      this.prevMsgCount = count;
      this.prevTypingLen = typingLen;
    }

    this.renderMermaid();
    this.addImageHandlers();
  }

  private scrollToBottom() {
    if (this.chatBody) {
      const el = this.chatBody.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }


  /** Клик по скриншоту в ответе бота — открыть его на весь экран (лайтбокс). */
  private addImageHandlers() {
    document.querySelectorAll('.chat-img:not(.zoomable)').forEach(el => {
      const img = el as HTMLImageElement;
      img.classList.add('zoomable');
      img.addEventListener('click', () => {
        const overlay = document.createElement('div');
        overlay.className = 'mermaid-modal-overlay';
        overlay.innerHTML =
          `<div class="mermaid-modal-content" onclick="event.stopPropagation()">` +
          `<img src="${img.src}" style="max-width:92vw;max-height:88vh;border-radius:8px;display:block;"/>` +
          `</div>`;
        overlay.addEventListener('click', () => overlay.remove());
        document.body.appendChild(overlay);
      });
    });
  }

  private typeMessage(msg: ChatMessageEx) {
    const fullText = msg.text;
    msg.displayText = '';
    msg.typing = true;
    let i = 0;
    const speed = fullText.length > 500 ? 60 : fullText.length > 200 ? 80 : 100;
    const interval = setInterval(() => {
      if (i < fullText.length) {
        msg.displayText += fullText[i];
        i++;
      } else {
        clearInterval(interval);
        msg.typing = false;
        msg.html = this.toHtml(fullText);
        msg.displayText = undefined;
      }
    }, 1000 / speed);
    this.typingIntervals.push(interval);
  }

  highlightKeywords(text: string): string {
    if (!text) return '';
    let result = text;
    KEYWORDS.forEach(kw => {
      result = result.replace(new RegExp(`\\b(${kw})\\b`, 'g'), `<mark class="kw">$1</mark>`);
    });
    return result;
  }

  copyMessage(msg: ChatMessageEx) {
    navigator.clipboard.writeText(msg.text).then(() => {
      msg.copied = true;
      setTimeout(() => (msg.copied = false), 2000);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = msg.text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      msg.copied = true;
      setTimeout(() => (msg.copied = false), 2000);
    });
  }

  private saveHistory() {
    const toSave = this.messages.map(m => ({ role: m.role, text: m.text, timestamp: m.timestamp }));
    try { localStorage.setItem('statiq_chat', JSON.stringify(toSave)); } catch (e) {}
  }

  private loadHistory() {
    try {
      const saved = localStorage.getItem('statiq_chat');
      if (saved) {
        const msgs = JSON.parse(saved);
        if (msgs && msgs.length > 0) {
          this.messages = msgs.map((m: any) => ({
            role: m.role,
            text: m.text,
            timestamp: new Date(m.timestamp),
            html: m.role === 'bot' ? this.toHtml(m.text) : undefined,
            copied: false
          }));
        }
      }
    } catch (e) {}
  }

  private addClickHandlers() {
    document.querySelectorAll('.mermaid-diagram:not(.clickable)').forEach(el => {
      (el as HTMLElement).classList.add('clickable');
      (el as HTMLElement).addEventListener('click', () => {
        const svg = el.querySelector('svg');
        if (!svg) return;
        const overlay = document.createElement('div');
        overlay.className = 'mermaid-modal-overlay';
        overlay.innerHTML = `
          <div class="mermaid-modal-content" onclick="event.stopPropagation()">
            <div style="position:fixed;top:16px;right:16px;display:flex;gap:8px;z-index:10001;">
              <button style="background:#063971;border:none;color:white;padding:8px 18px;border-radius:8px;cursor:pointer;font-size:13px;">📋 Копировать</button>
              <button onclick="this.closest('.mermaid-modal-overlay').remove()" style="background:#455a64;border:none;color:white;padding:8px 18px;border-radius:8px;cursor:pointer;font-size:13px;">✕ Закрыть</button>
            </div>
            ${svg.outerHTML}
          </div>`;
        overlay.addEventListener('click', () => overlay.remove());
        document.body.appendChild(overlay);
      });
    });
  }

  private normalizeMermaidCode(raw: string): string {
    let code = raw
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .trim();

    // Убираем случайно попавшие внутрь ```mermaid / ``` и строки-заголовки **...**
    code = code.replace(/```mermaid/g, '').replace(/```/g, '');
    code = code.replace(/^\s*\*\*[^\n]*\*\*\s*$/gm, '');

    // Перенос после направления графа, если к нему приклеен первый узел:
    // "graph TD A[Старт]" -> "graph TD\n    A[Старт]"
    code = code.replace(/\b((?:graph|flowchart)\s+(?:TD|TB|BT|RL|LR))\s+(?=\S)/g, '$1\n    ');

    // Слипшийся subgraph / end
    code = code.replace(/endsubgraph/g, 'end\nsubgraph');
    code = code.replace(/([}\]])\s*subgraph/g, '$1\nsubgraph');

    // Фикс слипшихся узлов: }Main --> или ]Auth -->
    code = code.replace(/([}\]])([ \t]*)([A-Za-z])/g, '$1\n    $3');

    // Схлопываем лишние пустые строки
    code = code.replace(/\n{3,}/g, '\n\n').trim();

    return code;
  }

  private renderMermaid() {
    if (!this.mermaidReady) return;
    const elements = document.querySelectorAll('.mermaid-source:not(.rendered)');
    elements.forEach(async (el: Element) => {
      (el as HTMLElement).classList.add('rendered');
      const rawCode = (el.textContent || '').trim();
      const code = this.normalizeMermaidCode(rawCode);
      const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
      try {
        const { svg } = await mermaid.render(id, code);
        const container = el.parentElement;
        if (container) {
          container.innerHTML = `<div class="mermaid-diagram">${svg}</div>`;
          setTimeout(() => this.addClickHandlers(), 100);
        }
      } catch (e) {
        const container = el.parentElement;
        if (container) {
          container.innerHTML = `<div style="background:#fff3e0;border:1px solid #ffb74d;border-radius:8px;padding:12px;"><div style="color:#e65100;font-size:11px;">⚠️ Не удалось отрисовать схему.</div></div>`;
        }
      }
    });
  }

  private toHtml(text: string): SafeHtml {
    const withMermaid = text.replace(/```mermaid\n?([\s\S]*?)```/g, (_match, code) => {
      const escaped = code.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;');
      return `<div class="mermaid-wrap"><pre class="mermaid-source">${escaped}</pre></div>`;
    });
    let html = marked(withMermaid) as string;

    // Картинки из ответа бота: ![desc](/images/x.png). Бэк отдаёт их с localhost:8090,
    // поэтому относительный путь /images/... переписываем на origin API и оформляем.
    html = html.replace(
      /<img([^>]*?)src="(\/(meta|bdap)?\/images\/[^"]+)"([^>]*?)>/g,
      (_m, pre, path, _sys, post) =>
        `<img${pre}src="${this.API_ORIGIN}${path}"${post} class="chat-img" loading="lazy" ` +
        `style="max-width:100%;border:1px solid #d6e3f0;border-radius:10px;margin:10px 0;` +
        `display:block;cursor:zoom-in;box-shadow:0 2px 8px rgba(6,57,113,.08);">`
    );

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  toggle() { this.isOpen = !this.isOpen; }

  newChat() {
    this.typingIntervals.forEach(i => clearInterval(i));
    this.typingIntervals = [];
    this.messages = [{
      role: 'bot',
      text: 'Привет! 👋 Я StatIQ — AI-методолог БНС.\nЗадайте любой вопрос по системе Метаданных!',
      html: undefined,
      copied: false,
      timestamp: new Date()
    }];
    localStorage.removeItem('statiq_chat');
  }

  askQuick(q: string) { this.question = q; this.send(); }

  send() {
    const q = this.question.trim();
    if (!q || this.loading) return;
    this.messages.push({ role: 'user', text: q, timestamp: new Date() });
    this.question = '';
    this.loading = true;
    this.saveHistory();
    this.chatService.ask(q, this.mode).subscribe({
      next: (res) => {
        const msg: ChatMessageEx = {
          role: 'bot',
          text: res.answer,
          html: undefined,
          copied: false,
          timestamp: new Date()
        };
        this.messages.push(msg);
        this.loading = false;
        this.typeMessage(msg);
        this.saveHistory();
      },
      error: () => {
        const errText = '⚠️ Ошибка подключения. AI-сервис недоступен.';
        this.messages.push({ role: 'bot', text: errText, html: this.toHtml(errText), copied: false, timestamp: new Date() });
        this.loading = false;
        this.saveHistory();
      }
    });
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
  }
// ============ РОБОТ-КНОПКА: интерактив ============
  // массив сердечек для *ngFor

  // глаза следят за курсором (вне Angular — без лишних проверок изменений)
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (this.isOpen || !this.robotWrap) return;
    const r = this.robotWrap.nativeElement.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height * 0.3;
    const dx = Math.max(-2, Math.min(2, (e.clientX - cx) / 40));
    const dy = Math.max(-1.5, Math.min(1.5, (e.clientY - cy) / 40));
    const t = `translate(${dx}px, ${dy}px)`;
    [this.irisL, this.irisR, this.glintL, this.glintR].forEach(ref => {
      if (ref) {
        ref.nativeElement.style.transition = 'transform 0.12s ease-out';
        ref.nativeElement.style.transform = t;
      }
    });
  }

  onRobotEnter() {
    // улыбка
    if (this.mouthEl) {
      this.mouthEl.nativeElement.setAttribute('d', 'M27 39 Q36 49 45 39');
    }
  }

  onRobotLeave() {
    if (this.mouthEl) {
      this.mouthEl.nativeElement.setAttribute('d', 'M28 40 Q36 46 44 40');
    }
    if (this.heartTimer) { clearInterval(this.heartTimer); this.heartTimer = null; }
  }




  // squash при клике + залп сердечек (вызывается из шаблона рядом с toggle)
  pressRobot() {
    if (!this.robotWrap) return;
    const el = this.robotWrap.nativeElement;
    el.classList.add('is-pressed');
    setTimeout(() => el.classList.remove('is-pressed'), 150);
    if (this.robotBubble) {
      this.robotBubble.nativeElement.style.transform = 'scale(1.05)';
      setTimeout(() => {
        if (this.robotBubble) this.robotBubble.nativeElement.style.transform = '';
      }, 200);
    }
  }

  ngOnDestroy() {
    if (this.heartTimer) clearInterval(this.heartTimer);
  }
}
