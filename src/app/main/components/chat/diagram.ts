/**
 * Рисует flowchart из ```mermaid без библиотеки mermaid (SVG строкой).
 *
 * Две раскладки:
 *  - «звезда» — одна система связана почти со всеми (интеграции META): она в центре, кто передаёт ей —
 *    слева, кому передаёт она — справа, обмен в обе стороны — отдельной группой; короткие плавные линии;
 *  - «уровни» — остальное: сверху вниз, большой уровень переносится на несколько строк (узкий чат).
 * Клик по схеме открывает её крупно (увеличение, перетаскивание, «Скачать SVG») — см. виджет / админку.
 *
 * Этот же файл собирается в ES5 для админки (admin/.../util/Diagram.js) — без зависимостей от Angular.
 */
export function renderDiagram(code: string, lang?: string): string | null {
  const src = (code || '').trim();
  if (!src) return null;
  const info = (lang || '').trim().split(/\s+/)[0].toLowerCase();
  if (info === 'mermaid' || looksLikeMermaid(src)) {
    const svg = mermaidToSvg(src);
    if (svg) {
      return '<figure class="sk-flow" title="Нажмите, чтобы увеличить">' + svg
        + '<span class="sk-flow-zoom" aria-hidden="true">⤢</span></figure>';
    }
  }
  if (looksLikeAsciiScheme(src)) {
    return '<pre class="sk-ascii">' + escapeHtml(src) + '</pre>';
  }
  return null;
}

export function looksLikeMermaid(src: string): boolean {
  return /^(flowchart|graph|sequenceDiagram)\b/im.test(src.trim());
}

export function looksLikeAsciiScheme(src: string): boolean {
  const lines = src.split(/\n/).length;
  if (lines < 3) return false;
  const arrows = (src.match(/[→←↑↓↔⇐⇒]|-->|<--|Kafka/gi) || []).length;
  const boxes = (src.match(/[│┌┐└┘├┤┬┴┼╔╗╚╝║═+|]/g) || []).length;
  const named = (src.match(/[A-ZА-ЯӘІҢҒҮҰҚӨҺ]{2,}/g) || []).length;
  return boxes >= 4 || (arrows >= 1 && named >= 3 && lines >= 4);
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface FlowNode { id: string; label: string; }
interface FlowEdge { from: string; to: string; label?: string; both?: boolean; }
interface Box { x: number; y: number; w: number; h: number; }

// ------------------------------------------------------------------ цвета и размеры
const C = {
  node: '#ffffff', nodeStroke: '#cdd8e6', text: '#1c2736',
  hub: '#1f4e8c', hubText: '#ffffff',
  root: '#eef4fc', rootStroke: '#a9c4e6',
  edge: '#8ea2bb', label: '#52627a', labelBg: '#ffffff',
  head: '#6b7a90',
};
const FONT = 'Inter, Nunito Sans, Segoe UI, Arial, sans-serif';
const NODE_H = 40;

function parseNode(raw: string): FlowNode {
  const t = raw.trim();
  const m = t.match(/^(.+?)(?:\[([^\]]*)\]|\("([^"]*)"\)|\(([^)]*)\)|\{([^}]*)\})?$/);
  if (!m) return { id: t, label: t };
  const label = m[2] != null ? m[2] : m[3] != null ? m[3] : m[4] != null ? m[4] : m[5] != null ? m[5] : m[1];
  return { id: m[1].trim(), label: String(label).replace(/^["']|["']$/g, '').replace(/<br\s*\/?>/gi, ' ').trim() };
}

/** Разбор mermaid: узлы, связи (повторы убраны, A→B и B→A — одна двусторонняя). */
export function parseFlow(src: string): { nodes: Map<string, FlowNode>; edges: FlowEdge[]; dir: string } {
  const nodes = new Map<string, FlowNode>();
  const raw: FlowEdge[] = [];
  let dir = 'TB';
  const ensure = (n: FlowNode) => {
    const prev = nodes.get(n.id);
    if (!prev) nodes.set(n.id, n);
    else if (n.label && n.label !== n.id) prev.label = n.label;
  };
  for (let line of src.split(/\r?\n/)) {
    line = line.trim().replace(/;$/, '');
    if (!line || line.indexOf('%%') === 0) continue;
    const head = /^(flowchart|graph)\s+(LR|RL|TD|TB|BT)\b/i.exec(line);
    if (head) { dir = head[2].toUpperCase(); continue; }
    if (/^(flowchart|graph|subgraph|end|classDef|class|style|linkStyle|sequenceDiagram|direction)\b/i.test(line)) continue;
    // A -->|подпись| B ,  A -- подпись --> B ,  A <--> B ,  A -.-> B ,  A ==> B
    let em = line.match(/^(.+?)\s*(<-->|<-\.->|<==>|-->|-\.->|==>|---|<--)\s*(?:\|([^|]*)\|\s*)?(.+)$/);
    let label: string | undefined;
    if (!em) {
      const alt = line.match(/^(.+?)\s*--\s*([^->|][^>]*?)\s*-->\s*(.+)$/);
      if (alt) { em = [alt[0], alt[1], '-->', alt[2], alt[3]] as unknown as RegExpMatchArray; }
    }
    if (em) {
      const a = parseNode(em[1]);
      const b = parseNode(em[4]);
      ensure(a);
      ensure(b);
      label = em[3] ? em[3].trim().replace(/^["']|["']$/g, '') : undefined;
      const op = em[2];
      if (op === '<--') raw.push({ from: b.id, to: a.id, label });
      else raw.push({ from: a.id, to: b.id, label, both: op === '<-->' || op === '<-.->' || op === '<==>' });
      continue;
    }
    if (/[[({]/.test(line)) ensure(parseNode(line));
  }
  // повторы и встречные связи → одна связь
  const edges: FlowEdge[] = [];
  for (const e of raw) {
    if (e.from === e.to) continue;
    const same = edges.find((x) => x.from === e.from && x.to === e.to);
    if (same) { if (!same.label && e.label) same.label = e.label; same.both = same.both || e.both; continue; }
    const back = edges.find((x) => x.from === e.to && x.to === e.from);
    if (back) {
      back.both = true;
      if (e.label && back.label && e.label !== back.label) back.label = back.label + ' / ' + e.label;
      else if (!back.label) back.label = e.label;
      continue;
    }
    edges.push({ from: e.from, to: e.to, label: e.label, both: e.both });
  }
  return { nodes, edges, dir };
}

function mermaidToSvg(src: string): string | null {
  const g = parseFlow(src);
  if (!g.nodes.size || !g.edges.length) return null;
  const hub = findHub(g.nodes, g.edges);
  return hub ? starSvg(g.nodes, g.edges, hub, src) : layeredSvg(g.nodes, g.edges, g.dir, src);
}

/** Центр «звезды»: связан хотя бы с 4 узлами и с большинством связей. */
function findHub(nodes: Map<string, FlowNode>, edges: FlowEdge[]): string | null {
  if (nodes.size < 5) return null;
  const deg = new Map<string, number>();
  edges.forEach((e) => {
    deg.set(e.from, (deg.get(e.from) || 0) + 1);
    deg.set(e.to, (deg.get(e.to) || 0) + 1);
  });
  let best: string | null = null;
  deg.forEach((d, id) => { if (!best || d > (deg.get(best) || 0)) best = id; });
  if (!best) return null;
  const d = deg.get(best) || 0;
  const touching = edges.filter((e) => e.from === best || e.to === best).length;
  // остальные узлы — «листья»: все связаны с центром
  let leavesOk = true;
  nodes.forEach((_, id) => {
    if (id !== best && !edges.some((e) => (e.from === id && e.to === best) || (e.to === id && e.from === best))) leavesOk = false;
  });
  return d >= 4 && touching >= edges.length * 0.7 && leavesOk ? best : null;
}

// ------------------------------------------------------------------ звезда
function starSvg(nodes: Map<string, FlowNode>, edges: FlowEdge[], hub: string, src: string): string {
  const incoming: string[] = [], outgoing: string[] = [], both: string[] = [];
  const edgeOf = new Map<string, FlowEdge>();
  edges.forEach((e) => {
    if (e.from !== hub && e.to !== hub) return;
    const leaf = e.from === hub ? e.to : e.from;
    edgeOf.set(leaf, e);
    if (e.both) both.push(leaf);
    else if (e.to === hub) incoming.push(leaf);
    else outgoing.push(leaf);
  });
  const hubLabel = nodes.get(hub)!.label;
  type Group = { title: string; ids: string[] };
  let left: Group[] = [], right: Group[] = [];
  const gIn = { title: 'Передают в ' + hubLabel, ids: incoming };
  const gOut = { title: 'Получают от ' + hubLabel, ids: outgoing };
  const gBoth = { title: 'Обмен в обе стороны', ids: both };
  if (incoming.length) left.push(gIn);
  if (outgoing.length) right.push(gOut);
  if (both.length) (count(left) <= count(right) ? left : right).push(gBoth);
  // одна сторона пустая — делим пополам, чтобы схема не была длинной
  if (!left.length || !right.length) {
    const all = left.concat(right);
    const ids = all.reduce((a, g2) => a.concat(g2.ids), [] as string[]);
    const half = Math.ceil(ids.length / 2);
    const title = all.length === 1 ? all[0].title : 'Связанные системы';
    left = [{ title, ids: ids.slice(0, half) }];
    right = [{ title: '', ids: ids.slice(half) }];
  }

  const colW = Math.min(210, Math.max(150, maxLabel(nodes, hub) * 7 + 30));
  const hubW = Math.min(220, Math.max(140, hubLabel.length * 8 + 40));
  const gap = 110, rowGap = 12, headH = 22, groupGap = 18, pad = 18;
  const layout = (groups: Group[], x: number, pos: Map<string, Box>, heads: { x: number; y: number; t: string; anchor: string }[], anchor: string) => {
    let y = pad;
    groups.forEach((gr) => {
      if (gr.title) { heads.push({ x: anchor === 'start' ? x : x + colW, y: y + 13, t: gr.title, anchor }); y += headH; }
      gr.ids.forEach((id) => { pos.set(id, { x, y, w: colW, h: NODE_H }); y += NODE_H + rowGap; });
      y += groupGap - rowGap;
    });
    return y;
  };
  const pos = new Map<string, Box>();
  const heads: { x: number; y: number; t: string; anchor: string }[] = [];
  const leftX = pad, hubX = pad + colW + gap, rightX = hubX + hubW + gap;
  const hL = layout(left, leftX, pos, heads, 'start');
  const hR = layout(right, rightX, pos, heads, 'end');
  const height = Math.max(hL, hR, NODE_H * 2 + pad * 2) + pad - groupGap;
  const hubH = Math.max(56, Math.min(height - pad * 2, 44 + Math.max(0, Math.max(countIds(left), countIds(right)) - 2) * 6));
  const hubBox: Box = { x: hubX, y: (height - hubH) / 2, w: hubW, h: hubH };
  const W = rightX + colW + pad;

  const uid = 'sk' + Math.abs(hash(src)).toString(36);
  const out: string[] = [];
  out.push(svgOpen(W, height, uid));
  heads.forEach((h) => out.push(`<text x="${h.x}" y="${h.y}" text-anchor="${h.anchor}" font-size="11" font-weight="600" letter-spacing=".02em" fill="${C.head}" font-family="${FONT}">${escapeHtml(h.t.toUpperCase())}</text>`));

  // порты на сторонах центра, чтобы линии не сходились в одну точку
  const side = (ids: string[], isLeft: boolean) => {
    ids.forEach((id, i) => {
      const b = pos.get(id)!;
      const e = edgeOf.get(id)!;
      const py = hubBox.y + 12 + (hubBox.h - 24) * ((i + 1) / (ids.length + 1));
      const x1 = isLeft ? b.x + b.w : b.x, y1 = b.y + b.h / 2;
      const x2 = isLeft ? hubBox.x : hubBox.x + hubBox.w, y2 = py;
      const cx = (x1 + x2) / 2;
      const towardHub = e.to === hub;
      const startMarker = e.both ? `marker-start="url(#${uid}-s)"` : (!towardHub ? `marker-start="url(#${uid}-s)"` : '');
      const endMarker = e.both || towardHub ? `marker-end="url(#${uid}-e)"` : '';
      // стрелка всегда к получателю: к центру — на конце, от центра — в начале (у листа)
      out.push(`<path d="M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}" fill="none" stroke="${C.edge}" stroke-width="1.4" ${startMarker} ${endMarker}/>`);
      if (e.label) out.push(edgeLabel(isLeft ? x1 + 8 : x1 - 8, y1 - 7, e.label, isLeft ? 'start' : 'end'));
    });
  };
  const leftIds = left.reduce((a, g2) => a.concat(g2.ids), [] as string[]);
  const rightIds = right.reduce((a, g2) => a.concat(g2.ids), [] as string[]);
  side(leftIds, true);
  side(rightIds, false);

  pos.forEach((b, id) => out.push(nodeSvg(b, nodes.get(id)!.label, false, uid)));
  out.push(nodeSvg(hubBox, hubLabel, true, uid));
  out.push('</svg>');
  return out.join('');
}

function count(groups: { ids: string[] }[]): number { return groups.reduce((s, g) => s + g.ids.length, 0); }
function countIds(groups: { ids: string[] }[]): number { return count(groups); }
function maxLabel(nodes: Map<string, FlowNode>, skip?: string): number {
  let m = 0;
  nodes.forEach((n, id) => { if (id !== skip) m = Math.max(m, Math.min(26, n.label.length)); });
  return m;
}

// ------------------------------------------------------------------ уровни
function layeredSvg(nodes: Map<string, FlowNode>, edges: FlowEdge[], dir: string, src: string): string {
  const incoming = new Map<string, number>();
  nodes.forEach((_, id) => incoming.set(id, 0));
  edges.forEach((e) => incoming.set(e.to, (incoming.get(e.to) || 0) + 1));
  const level = new Map<string, number>();
  const q: string[] = [];
  nodes.forEach((_, id) => { if (!incoming.get(id)) { level.set(id, 0); q.push(id); } });
  const adj = new Map<string, string[]>();
  edges.forEach((e) => { if (!adj.has(e.from)) adj.set(e.from, []); adj.get(e.from)!.push(e.to); });
  let guard = 0;
  while (q.length && guard++ < 10000) {
    const id = q.shift()!;
    const lv = level.get(id) || 0;
    (adj.get(id) || []).forEach((to) => {
      level.set(to, Math.max(level.get(to) || 0, lv + 1));
      incoming.set(to, (incoming.get(to) || 1) - 1);
      if ((incoming.get(to) || 0) <= 0 && q.indexOf(to) < 0) q.push(to);
    });
  }
  nodes.forEach((_, id) => { if (!level.has(id)) level.set(id, 0); });

  const horizontal = (dir === 'LR' || dir === 'RL') && nodes.size <= 4;
  const byLevel = new Map<number, string[]>();
  level.forEach((lv, id) => { if (!byLevel.has(lv)) byLevel.set(lv, []); byLevel.get(lv)!.push(id); });
  const levels = Array.from(byLevel.keys()).sort((a, b) => a - b);

  const w = Math.min(200, Math.max(120, maxLabel(nodes) * 7 + 30));
  const gapX = 26, gapY = 46, pad = 18, perRow = horizontal ? 99 : 4;
  // строки: уровень, разбитый по perRow; перенесённые строки встают в промежутки между блоками первой
  const rows: { ids: string[]; cont: boolean }[] = [];
  levels.forEach((lv) => {
    const ids = byLevel.get(lv)!;
    const first = ids.slice(0, perRow);
    rows.push({ ids: first, cont: false });
    let rest = ids.slice(perRow);
    const slot = Math.max(1, first.length - 1);
    while (rest.length) { rows.push({ ids: rest.slice(0, slot), cont: true }); rest = rest.slice(slot); }
  });
  const pos = new Map<string, Box>();
  const levelTop = new Map<string, number>();   // y первой строки уровня узла — для обхода перенесённых
  if (horizontal) {
    rows.forEach((row, r) => row.ids.forEach((id, i) => pos.set(id, { x: pad + r * (w + 70), y: pad + i * (NODE_H + gapY / 2), w, h: NODE_H })));
  } else {
    const widest = rows.reduce((m, r) => Math.max(m, r.ids.length), 1);
    const canvas = widest * w + (widest - 1) * gapX;
    let prev: { left: number; n: number; y: number } = { left: pad, n: 1, y: pad };
    rows.forEach((row, r) => {
      const y = pad + r * (NODE_H + gapY);
      if (row.cont && prev.n > 1) {
        // центры промежутков первой строки уровня: линии пройдут между блоками, а не сквозь них
        const offset = Math.floor((prev.n - 1 - row.ids.length) / 2);   // целое: ровно в промежуток
        row.ids.forEach((id, i) => {
          const gx = prev.left + (i + offset + 1) * (w + gapX) - gapX / 2;
          pos.set(id, { x: gx - w / 2, y, w, h: NODE_H });
          levelTop.set(id, prev.y);
        });
        return;
      }
      const total = row.ids.length * w + (row.ids.length - 1) * gapX;
      const left = pad + (canvas - total) / 2;
      row.ids.forEach((id, i) => { pos.set(id, { x: left + i * (w + gapX), y, w, h: NODE_H }); levelTop.set(id, y); });
      prev = { left, n: row.ids.length, y };
    });
  }
  let W = 40, H = 40;
  pos.forEach((p) => { W = Math.max(W, p.x + p.w + pad); H = Math.max(H, p.y + p.h + pad); });

  const uid = 'sk' + Math.abs(hash(src)).toString(36);
  const out: string[] = [svgOpen(W, H, uid)];
  const labels: string[] = [];
  const placer = new LabelPlacer(Array.from(pos.values()));
  // веер с одинаковой подписью («GET» ко всем) — подпись один раз под источником
  const fanLabel = new Map<string, string>();
  const byFrom = new Map<string, FlowEdge[]>();
  edges.forEach((e) => { if (!byFrom.has(e.from)) byFrom.set(e.from, []); byFrom.get(e.from)!.push(e); });
  byFrom.forEach((list, from) => {
    const l = list[0].label;
    if (list.length >= 3 && l && list.every((x) => x.label === l)) {
      fanLabel.set(from, l);
      const a = pos.get(from);
      const at = a && !horizontal ? placer.place(l, [[a.x + a.w / 2, a.y + a.h + 14]]) : null;
      if (at) labels.push(edgeLabel(at[0], at[1], l, 'middle'));
    }
  });
  const hovers: string[] = [];
  // «Внутренние сервисы» от десятка систем в одну — подпись один раз над приёмником, а не на каждой линии
  const faninLabel = new Map<string, string>();
  const byTo = new Map<string, FlowEdge[]>();
  edges.forEach((e) => { if (!byTo.has(e.to)) byTo.set(e.to, []); byTo.get(e.to)!.push(e); });
  byTo.forEach((list, to) => {
    const same = new Map<string, number>();
    list.forEach((x) => { if (x.label) same.set(x.label, (same.get(x.label) || 0) + 1); });
    same.forEach((n, l) => {
      if (n < 3 || faninLabel.has(to)) return;
      faninLabel.set(to, l);
      const b = pos.get(to);
      const at = b && !horizontal ? placer.place(l + ' ×' + n, [[b.x + b.w / 2, b.y - 8], [b.x + b.w / 2, b.y + b.h + 16]]) : null;
      if (at) labels.push(edgeLabel(at[0], at[1], l + ' ×' + n, 'middle'));
    });
  });
  edges.forEach((e, i) => {
    const a = pos.get(e.from), b = pos.get(e.to);
    if (!a || !b) return;
    const top = levelTop.get(e.to);
    const p = top != null && top < b.y - 1 && a.y < top && !horizontal
      ? detour(a, b, top - gapY / 2)
      : curve(a, b, horizontal);
    out.push(`<path d="${p.d}" fill="none" stroke="${C.edge}" stroke-width="1.4" ${e.both ? `marker-start="url(#${uid}-s)"` : ''} marker-end="url(#${uid}-e)"/>`);
    const fan = (fanLabel.get(e.from) === e.label || faninLabel.get(e.to) === e.label) && !horizontal;
    const title = (nodes.get(e.from)!.label + (e.both ? ' ⇄ ' : ' → ') + nodes.get(e.to)!.label) + (e.label ? ': ' + e.label : '');
    let hoverLabel = '';
    if (e.label && !fan) {
      const at = placer.place(e.label, p.pts);
      if (at) labels.push(edgeLabel(at[0], at[1], e.label, 'middle'));
      else hoverLabel = edgeLabel(p.lx, p.ly, e.label, 'middle');
    }
    // наведение на линию: она подсвечивается, подпись (если не поместилась) появляется поверх
    hovers.push(`<g class="sk-e"><title>${escapeHtml(title)}</title>`
      + `<path d="${p.d}" fill="none" stroke="transparent" stroke-width="12"/>`
      + `<path class="sk-hi" d="${p.d}" fill="none" stroke="#2563eb" stroke-width="2.2"/>`
      + (hoverLabel ? `<g class="sk-hl">${hoverLabel}</g>` : '') + `</g>`);
  });
  const roots = new Set<string>();
  level.forEach((lv, id) => { if (lv === 0 && edges.some((e) => e.from === id)) roots.add(id); });
  pos.forEach((b, id) => out.push(nodeSvg(b, nodes.get(id)!.label, false, uid, roots.has(id))));
  out.push(...labels);
  out.push(...hovers);
  out.push('</svg>');
  return out.join('');
}

/** К перенесённой строке: вниз до коридора над уровнем, вбок к промежутку, вниз между блоками. */
function detour(a: Box, b: Box, corridorY: number): { d: string; lx: number; ly: number; pts: number[][] } {
  const x1 = a.x + a.w / 2, y1 = a.y + a.h, x2 = b.x + b.w / 2, y2 = b.y;
  const r = Math.min(10, Math.abs(x2 - x1) / 2);
  const dir = x2 > x1 ? 1 : -1;
  const pts = [0.5, 0.3, 0.7, 0.15, 0.85].map((t) => [x1 + (x2 - x1) * t, corridorY - 6]);
  pts.push([x1, (y1 + corridorY) / 2], [x2, (corridorY + y2) / 2]);
  if (r < 1) return { d: `M ${x1} ${y1} L ${x2} ${y2}`, lx: x2, ly: corridorY - 6, pts };
  return {
    d: `M ${x1} ${y1} L ${x1} ${corridorY - r} Q ${x1} ${corridorY}, ${x1 + dir * r} ${corridorY}`
      + ` L ${x2 - dir * r} ${corridorY} Q ${x2} ${corridorY}, ${x2} ${corridorY + r} L ${x2} ${y2}`,
    lx: (x1 + x2) / 2, ly: corridorY - 6, pts,
  };
}

/** Точки кубической кривой — куда можно поставить подпись (от середины к краям). */
function bezierPts(x1: number, y1: number, c1x: number, c1y: number, c2x: number, c2y: number, x2: number, y2: number): number[][] {
  return [0.5, 0.4, 0.6, 0.3, 0.7, 0.22, 0.78].map((t) => {
    const u = 1 - t;
    return [u * u * u * x1 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x2,
      u * u * u * y1 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y2 + 3];
  });
}

function curve(a: Box, b: Box, horizontal: boolean): { d: string; lx: number; ly: number; pts: number[][] } {
  const sameRow = Math.abs(a.y - b.y) < 8;
  if (horizontal || sameRow) {
    const ltr = a.x < b.x;
    const x1 = ltr ? a.x + a.w : a.x, x2 = ltr ? b.x : b.x + b.w;
    const y1 = a.y + a.h / 2, y2 = b.y + b.h / 2;
    if (sameRow && !horizontal && Math.abs(x2 - x1) > a.w) {
      // соседи через одного в одной строке — дугой сверху
      const ax = a.x + a.w / 2, bx = b.x + b.w / 2, top = Math.min(a.y, b.y);
      return { d: `M ${ax} ${top} C ${ax} ${top - 34}, ${bx} ${top - 34}, ${bx} ${top}`, lx: (ax + bx) / 2, ly: top - 26,
        pts: bezierPts(ax, top, ax, top - 34, bx, top - 34, bx, top).map((p) => [p[0], p[1] - 6]) };
    }
    const cx = (x1 + x2) / 2;
    return { d: `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`, lx: cx, ly: (y1 + y2) / 2 - 7,
      pts: bezierPts(x1, y1, cx, y1, cx, y2, x2, y2).map((p) => [p[0], p[1] - 10]) };
  }
  const down = a.y < b.y;
  const x1 = a.x + a.w / 2, x2 = b.x + b.w / 2;
  const y1 = down ? a.y + a.h : a.y, y2 = down ? b.y : b.y + b.h;
  const cy = (y1 + y2) / 2;
  return { d: `M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`, lx: (x1 + x2) / 2, ly: cy - 2,
    pts: bezierPts(x1, y1, x1, cy, x2, cy, x2, y2) };
}

/**
 * Раскладка подписей без наложений: подпись ставится в первую свободную точку линии — не на блок
 * и не на другую подпись. Не нашлось места — подпись видна при наведении на линию (и в подсказке).
 */
class LabelPlacer {
  private taken: Box[] = [];
  constructor(blocks: Box[]) { blocks.forEach((b) => this.taken.push({ x: b.x - 3, y: b.y - 3, w: b.w + 6, h: b.h + 6 })); }
  place(text: string, pts: number[][]): number[] | null {
    const t = labelText(text);
    const w = t.length * 5.9 + 10, h = 15;
    for (const p of pts) {
      const r = { x: p[0] - w / 2, y: p[1] - 10, w, h };
      if (!this.taken.some((o) => r.x < o.x + o.w && o.x < r.x + r.w && r.y < o.y + o.h && o.y < r.y + r.h)) {
        this.taken.push({ x: r.x - 2, y: r.y - 1, w: r.w + 4, h: r.h + 2 });
        return p;
      }
    }
    return null;
  }
}

function labelText(text: string): string { return text.length > 34 ? text.slice(0, 33) + '…' : text; }

// ------------------------------------------------------------------ общие куски
function svgOpen(w: number, h: number, uid: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(w)} ${Math.ceil(h)}" width="${Math.ceil(w)}" height="${Math.ceil(h)}" role="img" font-family="${FONT}">`
    + `<style>.sk-e .sk-hi,.sk-e .sk-hl{opacity:0;transition:opacity .12s}.sk-e:hover .sk-hi{opacity:.85}.sk-e:hover .sk-hl{opacity:1}.sk-e{cursor:help}</style>`
    + `<defs>`
    + `<marker id="${uid}-e" viewBox="0 0 10 10" markerWidth="7" markerHeight="7" refX="9" refY="5" orient="auto"><path d="M1,1 L9,5 L1,9" fill="none" stroke="${C.edge}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></marker>`
    + `<marker id="${uid}-s" viewBox="0 0 10 10" markerWidth="7" markerHeight="7" refX="1" refY="5" orient="auto"><path d="M9,1 L1,5 L9,9" fill="none" stroke="${C.edge}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></marker>`
    + `<filter id="${uid}-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.6" flood-color="#1c2736" flood-opacity=".10"/></filter>`
    + `</defs>`;
}

function nodeSvg(b: Box, label: string, hub: boolean, uid: string, root?: boolean): string {
  const fill = hub ? C.hub : root ? C.root : C.node;
  const stroke = hub ? C.hub : root ? C.rootStroke : C.nodeStroke;
  const color = hub ? C.hubText : C.text;
  const max = Math.max(10, Math.floor((b.w - 16) / 6.6));
  const lines = wrapLabel(label, max);
  const size = hub ? 14 : 12.5;
  const lh = size + 3;
  const y0 = b.y + b.h / 2 - ((lines.length - 1) * lh) / 2 + size * 0.35;
  let s = `<g><title>${escapeHtml(label)}</title><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="1.2" filter="url(#${uid}-sh)"/>`;
  lines.forEach((ln, i) => {
    s += `<text x="${b.x + b.w / 2}" y="${y0 + i * lh}" text-anchor="middle" font-size="${size}" font-weight="${hub ? 700 : 500}" fill="${color}">${escapeHtml(ln)}</text>`;
  });
  return s + '</g>';
}

function edgeLabel(x: number, y: number, text: string, anchor: string): string {
  const t = labelText(text);
  const w = t.length * 5.9 + 10;
  const rx = anchor === 'start' ? x - 4 : anchor === 'end' ? x - w + 4 : x - w / 2;
  return `<g><title>${escapeHtml(text)}</title><rect x="${rx}" y="${y - 10}" width="${w}" height="15" rx="7.5" fill="${C.labelBg}" fill-opacity=".92"/>`
    + `<text x="${x}" y="${y + 1}" text-anchor="${anchor}" font-size="10.5" fill="${C.label}">${escapeHtml(t)}</text></g>`;
}

function wrapLabel(s: string, max: number): string[] {
  if (s.length <= max) return [s];
  const cut1 = s.lastIndexOf(' ', max);
  const i = cut1 > 4 ? cut1 : max;
  const first = s.slice(0, i).trim();
  let rest = s.slice(i).trim();
  if (rest.length > max) rest = rest.slice(0, max - 1) + '…';
  return [first, rest].filter(Boolean);
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}
