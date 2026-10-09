/** Рисует формулу как в методике: дробь, корень, индексы. Без CDN. */
export function wrapBareTex(source: string): string {
  return (source ?? '')
    .split('\n')
    .map((line) => {
      const t = line.trim();
      if (!t || t.includes('$')) return line;
      if (/\\frac|\\sqrt|\\sum|\\prod|\\left/.test(t)) {
        return '$$' + t + '$$';
      }
      return line;
    })
    .join('\n');
}
function stripProseTex(source: string): string {
  return (source ?? '').split(/(```[\s\S]*?```|\$\$[\s\S]+?\$\$|\$[^$\n]+\$)/).map((part) => {
    if (part.startsWith('```') || part.startsWith('$')) return part;
    return part
      .replace(/\\text(?:rm|it|bf)?\s*\{([^{}]*)\}/g, '$1')
      .replace(/I_\{([^{}]+)\}/g, 'I_$1');
  }).join('');
}
export function extractMath(source: string): { text: string; slots: string[] } {
  const slots: string[] = [];
  let t = wrapBareTex(stripProseTex(source ?? ''));
  t = t.replace(/\$\$([\s\S]+?)\$\$/g, (_, body) => {
    slots.push(texToHtml(String(body), true));
    return `%%MATH${slots.length - 1}%%`;
  });
  t = t.replace(/\$([^$\n]+)\$/g, (_, body) => {
    slots.push(texToHtml(String(body), false));
    return `%%MATH${slots.length - 1}%%`;
  });
  return { text: t, slots };
}
export function restoreMath(html: string, slots: string[]): string {
  return html.replace(/%%MATH(\d+)%%/g, (_, i) => slots[Number(i)] ?? '');
}
export function texToHtml(src: string, display = false): string {
  const inner = renderSeq(normalizeTex(src));
  const cls = display ? 'sk-math sk-math-block' : 'sk-math';
  return `<span class="${cls}">${inner}</span>`;
}
function normalizeTex(s: string): string {
  return String(s || '')
    .replace(/\\left|\\right/g, '')
    .replace(/\\,/g, ' ')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\ldots|\\cdots|\\dots/g, '⋯')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/~/g, ' ')
    .trim();
}
function renderSeq(s: string): string {
  const atoms: string[] = [];
  let i = 0;
  while (i < s.length) {
    const one = nextAtom(s, i);
    atoms.push(one.html);
    i = one.i;
  }
  return atoms.join('');
}
function nextAtom(s: string, i: number): { html: string; i: number } {
  while (i < s.length && s[i] === ' ') i++;
  if (i >= s.length) return { html: '', i };
  let atom: { html: string; i: number };
  if (s.startsWith('\\frac', i) || s.startsWith('\\dfrac', i) || s.startsWith('\\tfrac', i)) {
    atom = readFrac(s, i);
  } else if (s.startsWith('\\sqrt', i)) {
    atom = readSqrt(s, i);
  } else if (s.startsWith('\\sum', i) || s.startsWith('\\prod', i)) {
    atom = readBig(s, i);
  } else if (s.startsWith('\\text', i) || s.startsWith('\\mathrm', i)) {
    atom = readText(s, i);
  } else if (s[i] === '{') {
    const b = readBrace(s, i);
    atom = { html: renderSeq(b.inner), i: b.end };
  } else if (s[i] === '(' || s[i] === ')') {
    atom = { html: escapeHtml(s[i]), i: i + 1 };
  } else if (/[A-Za-zА-Яа-яЁё]/.test(s[i])) {
    atom = { html: `<em>${escapeHtml(s[i])}</em>`, i: i + 1 };
  } else {
    atom = { html: escapeHtml(s[i]), i: i + 1 };
  }
  while (atom.i < s.length && (s[atom.i] === '_' || s[atom.i] === '^')) {
    const mark = s[atom.i];
    const body = readScript(s, atom.i + 1);
    const cls = mark === '_' ? 'sk-sub' : 'sk-sup';
    atom = {
      html: `<span class="sk-atom">${atom.html}<span class="${cls}">${renderSeq(body.inner)}</span></span>`,
      i: body.end,
    };
  }
  return atom;
}
function readFrac(s: string, i: number): { html: string; i: number } {
  if (s.startsWith('\\dfrac', i) || s.startsWith('\\tfrac', i)) i += 6;
  else i += 5;
  i = skipWs(s, i);
  const num = readBrace(s, i);
  const den = readBrace(s, skipWs(s, num.end));
  return {
    html: `<span class="sk-frac"><span class="sk-num">${renderSeq(num.inner)}</span>`
      + `<span class="sk-den">${renderSeq(den.inner)}</span></span>`,
    i: den.end,
  };
}
function readSqrt(s: string, start: number): { html: string; i: number } {
  let i = skipWs(s, start + 5);
  let deg = '';
  if (s[i] === '[') {
    const close = s.indexOf(']', i + 1);
    if (close > 0) {
      deg = s.slice(i + 1, close);
      i = skipWs(s, close + 1);
    }
  }
  const body = readBrace(s, i);
  const degHtml = deg ? `<span class="sk-root-deg">${renderSeq(deg)}</span>` : '';
  return {
    html: `<span class="sk-root">${degHtml}<span class="sk-root-sym">√</span>`
      + `<span class="sk-root-body">${renderSeq(body.inner)}</span></span>`,
    i: body.end,
  };
}
function readBig(s: string, start: number): { html: string; i: number } {
  const prod = s.startsWith('\\prod', start);
  let i = start + (prod ? 5 : 4);
  let low = '';
  let high = '';
  i = skipWs(s, i);
  if (s[i] === '_') {
    const sc = readScript(s, i + 1);
    low = sc.inner;
    i = skipWs(s, sc.end);
  }
  if (s[i] === '^') {
    const sc = readScript(s, i + 1);
    high = sc.inner;
    i = sc.end;
  }
  const sym = prod ? '∏' : '∑';
  return {
    html: `<span class="sk-big"><span class="sk-big-hi">${renderSeq(high)}</span>`
      + `<span class="sk-big-sym">${sym}</span>`
      + `<span class="sk-big-lo">${renderSeq(low)}</span></span>`,
    i,
  };
}
function readText(s: string, start: number): { html: string; i: number } {
  let i = start;
  while (i < s.length && s[i] !== '{') i++;
  const b = readBrace(s, i);
  return { html: `<span class="sk-text">${escapeHtml(b.inner)}</span>`, i: b.end };
}
function readScript(s: string, i: number): { inner: string; end: number } {
  i = skipWs(s, i);
  if (s[i] === '{') return readBrace(s, i);
  return { inner: s[i] || '', end: Math.min(i + 1, s.length) };
}
function readBrace(s: string, open: number): { inner: string; end: number } {
  if (s[open] !== '{') return { inner: '', end: open };
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') {
      depth--;
      if (depth === 0) return { inner: s.slice(open + 1, i), end: i + 1 };
    }
  }
  return { inner: s.slice(open + 1), end: s.length };
}
function skipWs(s: string, i: number): number {
  while (i < s.length && s[i] === ' ') i++;
  return i;
}
function escapeHtml(ch: string): string {
  return String(ch)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
