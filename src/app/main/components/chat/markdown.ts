import { marked } from 'marked';
import { renderToString } from 'katex';
import { renderDiagram } from './diagram';

marked.setOptions({
  gfm: true,
  breaks: true,
});

marked.use({
  renderer: {
    code(arg: any, lang?: string) {
      const text = typeof arg === 'string' ? arg : (arg?.text ?? '');
      const info = typeof arg === 'string' ? lang : arg?.lang;
      const drawn = renderDiagram(text, info);
      if (drawn) return drawn;
      return `<pre><code>${escapeHtml(text)}</code></pre>`;
    },
  },
});

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** «Показатель (КСП)» — да; целое предложение с «Для создания…» — нет. */
export function looksLikeTerm(raw: string): boolean {
  const t = (raw || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (t.length < 2 || t.length > 42) return false;
  if (/[,;!?]/.test(t)) return false;
  const words = t.split(' ').filter(Boolean);
  if (words.length > 5) return false;
  if (/^(для создания|для работы|для полного|если |при |чтобы |после |обычно |таким |эти )/i.test(t)) {
    return false;
  }
  return true;
}

/**
 * Модель часто пишет «**Термин** – определение» одним абзацем.
 * Поднимаем только короткие имена, иначе заголовком становится целое предложение.
 */
export function liftGlossaryMarkdown(source: string): string {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  const termRe = /^(?:[-*•]\s+)?\*\*([^*]{1,80})\*\*\s*[–—−\-:.]\s+(.+)$/;
  for (const line of lines) {
    const m = termRe.exec(line.trim());
    if (m && looksLikeTerm(m[1]) && m[2].trim() && m[2].trim() !== ':') {
      if (out.length && out[out.length - 1] !== '') out.push('');
      out.push(`### ${m[1].trim()}`, '', m[2].trim());
      continue;
    }
    out.push(line);
  }
  return out.join('\n');
}

// ------------------------------------------------------------------ формулы (KaTeX)

export interface MathPart { tex: string; display: boolean; }

/**
 * $$…$$ и \[…\] — формула отдельной строкой, $…$ и \(…\) — в тексте.
 * Одиночный $ берём только вплотную к формуле («$x_1$»), чтобы «$5 и $10» не стали формулой.
 */
const MATH_RE = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|(?<![\\$\w])\$(?![\s$])([^$\n]{1,300}?)(?<![\s\\])\$(?![\w$])/g;
const CODE_RE = /(```[\s\S]*?(?:```|$)|`[^`\n]+`)/g;
const MATH_TOKEN = (i: number) => `KXMATH${i}KX`;

/**
 * Формулы → метки KXMATH0KX до markdown: иначе marked съедает «\», а «_» делает курсивом.
 * Внутри `кода` формулы не трогаем.
 */
export function extractMath(source: string): { text: string; math: MathPart[] } {
  const math: MathPart[] = [];
  const text = (source ?? '')
    .split(CODE_RE)
    .map((part) => (part.startsWith('`')
      ? part
      : part.replace(MATH_RE, (_all, dd, sq, rp, d) => {
        const display = dd !== undefined || sq !== undefined;
        const tex = String(dd ?? sq ?? rp ?? d ?? '').trim();
        math.push({ tex, display });
        return MATH_TOKEN(math.length - 1);
      })))
    .join('');
  return { text, math };
}

export function renderMath(part: MathPart): string {
  try {
    return renderToString(part.tex, {
      displayMode: part.display,
      throwOnError: false,
      strict: 'ignore',   // кириллица в \text{цена}
      output: 'htmlAndMathml',
    });
  } catch {
    return `<code>${escapeHtml(part.tex)}</code>`;
  }
}

function restoreMath(html: string, math: MathPart[]): string {
  if (!math.length) return html;
  return html.replace(/KXMATH(\d+)KX/g, (all, i) => {
    const m = math[Number(i)];
    return m ? renderMath(m) : all;
  });
}

/** Формула для письма / буфера обмена: «K = I_t12 ÷ (Σ(I_t1, …, I_t12))/(12)». */
export function latexToPlain(tex: string): string {
  let t = String(tex ?? '');
  const sym: Record<string, string> = {
    sum: 'Σ', prod: '∏', div: '÷', times: '×', cdot: '·', pm: '±', le: '≤', leq: '≤', ge: '≥', geq: '≥',
    ne: '≠', neq: '≠', approx: '≈', infty: '∞', dots: '…', ldots: '…', cdots: '…', to: '→', rightarrow: '→',
    alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', Delta: 'Δ', epsilon: 'ε', lambda: 'λ', mu: 'μ',
    pi: 'π', sigma: 'σ', Sigma: 'Σ', omega: 'ω', partial: '∂', in: '∈',
  };
  t = t.replace(/\\(left|right|big|Big|bigg|Bigg|displaystyle)\b/g, '');
  t = t.replace(/\\(quad|qquad)\b|\\[,;: !]/g, ' ');
  t = t.replace(/\\(?:text|mathrm|mathit|mathbf|operatorname)\{([^{}]*)\}/g, '$1');
  for (let k = 0; k < 5; k++) {
    const before = t;
    t = t.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
      .replace(/\\sqrt\[([^\]]*)\]\{([^{}]*)\}/g, '$1√($2)')
      .replace(/\\sqrt\{([^{}]*)\}/g, '√($1)')
      .replace(/([_^])\{([^{}]*)\}/g, '$1$2');
    if (t === before) break;
  }
  t = t.replace(/\\([A-Za-z]+)/g, (all, name) => sym[name] ?? name);
  return t.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
}

export function markdownToHtml(source: string): string {
  const { text: withTokens, math } = extractMath(normalizeCiteRefs((source ?? '').trim()));
  const text = liftGlossaryMarkdown(withTokens);
  if (!text) {
    return '';
  }
  let html = marked.parse(text, { async: false }) as string;
  html = html.replace(/<pre><code(?: class="language-([^"]+)")?>([\s\S]*?)<\/code><\/pre>/gi, (all, lang, inner) => {
    const raw = decodeEntities(inner);
    const drawn = renderDiagram(raw, lang || '');
    return drawn || all;
  });
  html = html.replace(/<p>\s*[:.–—-]\s*<\/p>/gi, '');
  html = splitBoldLeadBreaks(html);
  html = cardsFromBoldLead(html);
  html = wrapHeadingDefs(html);
  html = markMissing(html);
  html = citeBadges(html);
  html = restoreMath(html, math);
  return html;
}

/**
 * Ссылки [n] → плашка на строке текста. Соседние «[1][2]» склеиваются в одну «1, 2»,
 * пробел перед ссылкой убирается, чтобы плашка прижималась к слову. В <pre>/<code> не трогаем.
 */
export function citeBadges(html: string): string {
  return normalizeCiteRefs(html)
    .split(/(<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>)/gi)
    .map((part) => (/^<(pre|code)/i.test(part)
      ? part
      : part.replace(/[ \t\u00a0]*((?:\[\d{1,2}\])+)/g, (_m, group: string) => {
        const nums = Array.from(new Set((group.match(/\d{1,2}/g) || []).map(Number)));
        return `<span class="sk-cite" data-ref="${nums[0]}" title="Источник ${nums.join(', ')}">${nums.join(', ')}</span>`;
      })))
    .join('');
}

/**
 * gpt-oss иногда пишет ссылки как «【2】», «［2］» или «【2†L1-L4】» — приводим к [2].
 * Нужно для старых сообщений в истории: новые ответы сервер уже нормализует.
 */
export function normalizeCiteRefs(text: string): string {
  return (text || '').replace(/[【［〔]\s*(\d{1,2}(?:\s*[,;]\s*\d{1,2})*)(?:†[^】］〕]{0,40})?\s*[】］〕]/g, '[$1]');
}

/** Во время печати номера ещё не перенумерованы — прячем их, покажем в финальном ответе. */
export function stripCiteRefs(text: string): string {
  return normalizeCiteRefs(text).replace(/(?<!\\sqrt)\s?\[\d{1,2}(?:\s*[,;]\s*\d{1,2})*\]/g, '');
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

/** «**A** – …<br>**B** – …» в одном <p> — режем на абзацы. */
function splitBoldLeadBreaks(html: string): string {
  return html.replace(/<p>([\s\S]*?)<\/p>/gi, (all, inner: string) => {
    if (!/^[\s]*<strong>/i.test(inner) || !/<br\s*\/?>/i.test(inner)) return all;
    const chunks = inner.split(/<br\s*\/?>/i).map((s) => s.trim()).filter(Boolean);
    const terms = chunks.filter((c) => /^<strong>/i.test(c)).length;
    if (chunks.length < 2 || terms < 2) return all;
    return chunks.map((c) => `<p>${c}</p>`).join('');
  });
}

function cardsFromBoldLead(html: string): string {
  return html.replace(
    /<p>\s*<strong>([^<]{1,80})<\/strong>\s*[–—−\-:.]\s*([\s\S]*?)<\/p>/gi,
    (all, term, body) => {
      const b = String(body || '').replace(/<[^>]+>/g, '').trim();
      if (!looksLikeTerm(term) || !b || b === ':') return all;
      return `<div class="sk-def"><h3>${term}</h3><p>${body}</p></div>`;
    },
  );
}

function wrapHeadingDefs(html: string): string {
  return html.replace(
    /<h([34])([^>]*)>([\s\S]*?)<\/h\1>\s*((?:<(?:p|ul|ol|blockquote|table)[\s\S]*?<\/(?:p|ul|ol|blockquote|table)>\s*)*)/gi,
    (all, n, attrs, title, body, offset: number, full: string) => {
      const before = full.slice(Math.max(0, offset - 32), offset);
      if (before.includes('sk-def')) return all;
      const compact = String(body || '')
        .replace(/<p>\s*[:.–—-]\s*<\/p>/gi, '')
        .replace(/<p>\s*<\/p>/gi, '')
        .trim();
      if (!compact) {
        return `<h${n}${attrs}>${title}</h${n}>`;
      }
      return `<div class="sk-def"><h${n}${attrs}>${title}</h${n}>${body}</div>`;
    },
  );
}

function markMissing(html: string): string {
  return html.replace(
    /<p>([^<]*(?:не найден|отсутствует|в предоставленном контексте|определение невозможно|в загруженных документ)[^<]*)<\/p>/gi,
    '<p class="sk-miss">$1</p>',
  );
}

export function markdownToPlain(source: string): string {
  const { text, math } = extractMath(stripCiteRefs(source ?? ''));
  return plainMarkdown(text)
    .replace(/KXMATH(\d+)KX/g, (all, i) => (math[Number(i)] ? latexToPlain(math[Number(i)].tex) : all));
}

function plainMarkdown(source: string): string {
  return source
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}
