// Générateur des projets After Effects de la vidéo CyberSpace.
// Reprend exactement les calculs de src/Video.jsx (mêmes instants E, mêmes courbes) et produit
// data-9x16.js / data-16x9.js : la description de chaque composition, calque, forme et image clé.
// CyberSpace-AE.jsx lit ces fichiers dans After Effects et construit des calques natifs éditables.
//
// Usage : node after-effects/gen.mjs            (les deux formats)
//         node after-effects/gen.mjs 9x16       (un seul)
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {interpolate, Easing} from 'remotion';
import svgpath from 'svgpath';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'src/Video.jsx'), 'utf8');
const E = Function('return ' + SRC.match(/export const E = (\{[\s\S]*?\n\});/)[1])();
const DUR = +SRC.match(/export const DURATION = ([\d.]+)/)[1];
const loadConst = (f) => Function('return ' + fs.readFileSync(path.join(ROOT, 'src', f), 'utf8').replace(/^export const \w+ = /, '').replace(/;\s*$/, ''))();
const MARK = loadConst('mark.js');
const WORD = loadConst('word.js');

const FPS = 60;
const NF = Math.round(DUR * FPS);
const S = 2; // 1080 → 2160 (4K)

// ─────────── Courbes : copie conforme de Video.jsx ───────────
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const easeIn = Easing.bezier(0.7, 0, 0.84, 0);
const io = Easing.bezier(0.76, 0, 0.24, 1);
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const lerp = (t, a, b, from, to, e = ease) => interpolate(t, [a, b], [from, to], {...cl, easing: e});
const pop = (t, t0, d = 0.32, over = 0.16) => {
  if (t <= t0) return 0;
  const x = (t - t0) / d;
  if (x >= 1.4) return 1;
  return 1 - Math.exp(-5.5 * x) * Math.cos(x * Math.PI * (0.5 + over * 4));
};
const softPx = (p, px = 10) => (p < 0.98 ? (1 - Math.min(1, p)) * px : 0);
const rnd = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const clamp01 = (x) => Math.max(0, Math.min(1, x));

const C = {papier: '#FAFAFA', noir: '#000000', blanc: '#FFFFFF', orange: '#FF5A00', peach: '#F5C4A0', grille: '#E8E8E8', fond: '#F2F2F2', beige: '#EDE6D9', encre: '#111111', gris: '#8A8A8A'};
const hex = (h) => [1, 3, 5].map((i) => +(parseInt(h.slice(i, i + 2), 16) / 255).toFixed(4));

// Polices (noms PostScript) et demi-hauteur ligne de base → centre de la boîte de texte (en em)
const FONT = {
  sans: {400: 'Inter-Regular', 500: 'Inter-Medium', 600: 'Inter-SemiBold', 700: 'Inter-Bold'},
  mono: {500: 'JetBrainsMono-Medium', 600: 'JetBrainsMono-SemiBold', 700: 'JetBrainsMono-Bold'},
};
const BASE = {sans: (1984 - 494) / 2 / 2048, mono: (1020 - 300) / 2 / 1000};
const CSSFAM = {sans: 'InterAE', mono: 'MonoAE'};

// ─────────── Mesure des textes (Chromium, mêmes polices) ───────────
const measures = new Map();
const pending = [];
const mkey = (text, fam, w, size, ls) => [text, fam, w, size, ls].join('|');
const M = (text, fam, w, size, ls) => {
  const k = mkey(text, fam, w, size, ls);
  if (measures.has(k)) return measures.get(k);
  pending.push({k, text, fam: CSSFAM[fam], w, size, ls});
  return text.length * size * 0.55;
};
async function measureAll() {
  if (!pending.length) return;
  const {chromium} = require('playwright');
  const fdir = path.join(HERE, 'fonts');
  const faces = [
    ['sans', 400, 'Inter-Regular.otf'], ['sans', 500, 'Inter-Medium.otf'], ['sans', 600, 'Inter-SemiBold.otf'], ['sans', 700, 'Inter-Bold.otf'],
    ['mono', 500, 'JetBrainsMono-Medium.ttf'], ['mono', 600, 'JetBrainsMono-SemiBold.ttf'], ['mono', 700, 'JetBrainsMono-Bold.ttf'],
  ].map(([f, w, file]) => `@font-face{font-family:${CSSFAM[f]};font-weight:${w};src:url(${file})}`).join('\n');
  const html = path.join(fdir, '_mesure.html');
  fs.writeFileSync(html, `<!doctype html><html><head><meta charset="utf-8"><style>${faces}</style></head><body></body></html>`);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + html);
  const res = await page.evaluate(async (reqs) => {
    const loads = [];
    for (const r of reqs) loads.push(document.fonts.load(`${r.w} ${r.size}px ${r.fam}`, r.text));
    await Promise.all(loads);
    return reqs.map((r) => {
      const s = document.createElement('span');
      s.style.cssText = `font-family:${r.fam};font-weight:${r.w};font-size:${r.size}px;letter-spacing:${r.ls}em;white-space:pre;position:absolute;left:0;top:0`;
      s.textContent = r.text;
      document.body.appendChild(s);
      const w = s.getBoundingClientRect().width;
      s.remove();
      return w;
    });
  }, pending);
  await browser.close();
  fs.unlinkSync(html);
  pending.forEach((r, i) => measures.set(r.k, res[i]));
  pending.length = 0;
}

// ─────────── Logo : chemins SVG → tracés After Effects ───────────
const K4 = 0.5523;
function svgToPaths(d) {
  const paths = [];
  let cur = null;
  const push = (x, y, inT = [0, 0]) => cur.v.push([x, y]) && cur.i.push(inT) && cur.o.push([0, 0]);
  let px = 0, py = 0;
  svgpath(d).abs().unarc().unshort().iterate((seg, idx, x, y) => {
    const c = seg[0];
    if (c === 'M') {
      cur = {v: [], i: [], o: [], c: false};
      paths.push(cur);
      push(seg[1], seg[2]);
      px = seg[1]; py = seg[2];
    } else if (c === 'L' || c === 'H' || c === 'V') {
      const nx = c === 'V' ? px : seg[1], ny = c === 'H' ? py : c === 'V' ? seg[1] : seg[2];
      push(nx, ny);
      px = nx; py = ny;
    } else if (c === 'C') {
      cur.o[cur.o.length - 1] = [seg[1] - px, seg[2] - py];
      push(seg[5], seg[6], [seg[3] - seg[5], seg[4] - seg[6]]);
      px = seg[5]; py = seg[6];
    } else if (c === 'Q') {
      const c1 = [px + (2 / 3) * (seg[1] - px), py + (2 / 3) * (seg[2] - py)];
      const c2 = [seg[3] + (2 / 3) * (seg[1] - seg[3]), seg[4] + (2 / 3) * (seg[2] - seg[4])];
      cur.o[cur.o.length - 1] = [c1[0] - px, c1[1] - py];
      push(seg[3], seg[4], [c2[0] - seg[3], c2[1] - seg[4]]);
      px = seg[3]; py = seg[4];
    } else if (c === 'Z' || c === 'z') {
      cur.c = true;
      const n = cur.v.length;
      if (n > 1 && Math.hypot(cur.v[n - 1][0] - cur.v[0][0], cur.v[n - 1][1] - cur.v[0][1]) < 0.01) {
        cur.i[0] = cur.i[n - 1];
        cur.v.pop(); cur.i.pop(); cur.o.pop();
      }
      px = cur.v[0][0]; py = cur.v[0][1];
    }
  });
  return paths;
}
// Pièces du logo (même découpage et mêmes centres que Video.jsx)
const PIECES = MARK.d.split('Z').filter(Boolean).map((p) => {
  const n = p.match(/-?[\d.]+/g).map(Number);
  const xs = n.filter((_, j) => j % 2 === 0), ys = n.filter((_, j) => j % 2 === 1);
  const b = {x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys)};
  return {paths: svgToPaths(p + 'Z'), cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2};
});
const WORD_PATHS = svgToPaths(WORD.d);

// Icônes (viewBox 24) converties en tracés
const circ = (cx, cy, r) => `M${cx - r},${cy}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0z`;
const rrect = (x, y, w, h, r) => `M${x + r},${y}h${w - 2 * r}a${r},${r} 0 0 1 ${r},${r}v${h - 2 * r}a${r},${r} 0 0 1 ${-r},${r}h${-(w - 2 * r)}a${r},${r} 0 0 1 ${-r},${-r}v${-(h - 2 * r)}a${r},${r} 0 0 1 ${r},${-r}z`;
const ICONS = {
  Web: [circ(12, 12, 7.5), 'M4.5 12h15M12 4.5c2.6 2.4 2.6 12.6 0 15M12 4.5c-2.6 2.4-2.6 12.6 0 15'],
  App: [rrect(7.5, 3.8, 9, 16.4, 2.2), 'M10.8 17.2h2.4'],
  Cloud: ['M7.6 17.5h9.2a3.6 3.6 0 0 0 .4-7.2 5.2 5.2 0 0 0-10-1.1A4.2 4.2 0 0 0 7.6 17.5z'],
  SEO: [circ(10.5, 10.5, 5.5), 'M14.6 14.6l4.8 4.8'],
  Design: ['M5 19l3.2-.8L18.4 8a2 2 0 0 0-2.8-2.8L5.4 15.4z', 'M14.2 6.6l2.8 2.8'],
  Support: ['M5.5 13v-1a6.5 6.5 0 0 1 13 0v1', rrect(4.5, 12.5, 3.4, 5, 1.2), rrect(16.1, 12.5, 3.4, 5, 1.2)],
};
const ROCKET = ['M12 3c3 2.2 4.4 5.6 4 10l-2 3h-4l-2-3c-.4-4.4 1-7.8 4-10z', circ(12, 9.5, 1.6), 'M8.2 12.5L6 15.5l2.6.4M15.8 12.5l2.2 3-2.6.4M10.6 18.6c.2 1.2.7 2 1.4 2.4.7-.4 1.2-1.2 1.4-2.4'];
const CUBE_HEX = 'M0,-10 L8.66,-5 L8.66,5 L0,10 L-8.66,5 L-8.66,-5 Z';
const CUBE_TOP = 'M0,-10 L8.66,-5 L0,0 L-8.66,-5 Z';
const CUBE_IN = 'M-8.66,-5 L0,0 L8.66,-5 M0,0 L0,10';
const iconPaths = (list, tx = 0, ty = 0, k = 1) => list.flatMap((d) => svgToPaths(svgpath(d).abs().unarc().scale(k).translate(tx, ty).toString()));

// ─────────── Images clés : échantillonnage image par image puis simplification ───────────
const r3 = (x) => Math.round(x * 1000) / 1000;
function rdp(ts, vs, tol) {
  const n = ts.length;
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack = [[0, n - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let worst = -1, wi = -1;
    for (let i = a + 1; i < b; i++) {
      const u = (ts[i] - ts[a]) / (ts[b] - ts[a]);
      let d = 0;
      for (let j = 0; j < vs[i].length; j++) d = Math.max(d, Math.abs(vs[a][j] + (vs[b][j] - vs[a][j]) * u - vs[i][j]));
      if (d > worst) { worst = d; wi = i; }
    }
    if (worst > tol) {
      keep[wi] = 1;
      stack.push([a, wi], [wi, b]);
    }
  }
  const out = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(i);
  return out;
}
// spec : valeur | fonction(t) | {hold: fonction} | {x: 'expression', v?}
function P(spec, ctx, o = {}) {
  if (spec === undefined || spec === null) return undefined;
  const mul = o.mul ?? 1;
  const conv = (val) => {
    if (o.color) return hex(val);
    let r = Array.isArray(val) ? val.map((x) => x * mul) : val * mul;
    if (o.clamp) r = Array.isArray(r) ? r.map((x) => Math.max(o.clamp[0], Math.min(o.clamp[1], x))) : Math.max(o.clamp[0], Math.min(o.clamp[1], r));
    return Array.isArray(r) ? r.map(r3) : r3(r);
  };
  if (typeof spec === 'object' && !Array.isArray(spec)) {
    if (spec.x) return {x: spec.x, v: spec.v !== undefined ? conv(spec.v) : undefined};
    if (spec.hold) {
      const keys = [];
      let prev;
      for (let f = ctx.fa; f <= ctx.fb; f++) {
        const val = conv(spec.hold(f / FPS));
        if (JSON.stringify(val) !== JSON.stringify(prev)) keys.push([r3(f / FPS), val]);
        prev = val;
      }
      return keys.length === 1 ? {v: keys[0][1]} : {k: keys, h: 1};
    }
  }
  if (typeof spec === 'function') {
    const ts = [], vs = [];
    for (let f = ctx.fa; f <= ctx.fb; f++) {
      const t = f / FPS;
      const val = conv(spec(t));
      ts.push(t);
      vs.push(Array.isArray(val) ? val : [val]);
    }
    const tol = o.tol ?? (mul !== 1 ? 0.12 : 0.02);
    const idx = rdp(ts, vs, tol);
    if (idx.length === 2 && vs.every((x) => x.every((y, j) => Math.abs(y - vs[0][j]) <= tol))) return {v: Array.isArray(spec(ts[0])) ? vs[0] : vs[0][0]};
    const arr = Array.isArray(spec(ts[0]));
    return {k: idx.map((i) => [r3(ts[i]), arr ? vs[i] : vs[i][0]])};
  }
  return {v: conv(spec)};
}

// ─────────── Compositions, calques, formes ───────────
const FORMAT_LIST = process.argv[2] ? [process.argv[2]] : ['9x16', '16x9'];
let v, W, H, comps, CUR;

const rangeOf = (pred) => {
  let a = -1, b = -1;
  for (let f = 0; f < NF; f++) if (pred(f / FPS)) { if (a < 0) a = f; b = f; }
  return [a, b];
};
function comp(name, range, bg, fn) {
  CUR = {name, range, layers: []};
  if (bg) lay({type: 'solid', name: 'Fond', color: bg});
  fn();
  comps.push(CUR);
}
const lay = (o) => (CUR.layers.push(o), o);

// Formes (dans l'ordre de la pile After Effects : le premier élément est au premier plan)
const gr = (nm, it, tr) => ({ty: 'gr', nm, it, tr});
const rect = (size, pos = [0, 0], r = 0, nm) => ({ty: 'rect', size, pos, r, nm});
const ell = (size, pos = [0, 0], nm) => ({ty: 'el', size, pos, nm});
const pth = (path, nm) => ({ty: 'sh', path, nm});
const pthx = (x, nm) => ({ty: 'sh', x, nm});
const fill = (color, op = 100, rule) => ({ty: 'fl', color, op, rule});
const stroke = (color, w, o = {}) => ({ty: 'st', color, w, ...o});
const trim = (s, e, off, m) => ({ty: 'tm', s, e, o: off, m});
const rep = (n, pos) => ({ty: 'rp', n, pos});
const line = (x0, y0, x1, y1) => ({v: [[x0, y0], [x1, y1]], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]], c: false});
const poly = (pts, c = false) => ({v: pts, i: pts.map(() => [0, 0]), o: pts.map(() => [0, 0]), c});
const shape = (name, contents, o = {}) => lay({type: 'shape', name, contents, ...o});
const nul = (name, o = {}) => lay({type: 'null', name, ...o});

// Texte : position = point d'ancrage ; ax = 'L' (bord gauche), 'C' (centre), 'R' (bord droit) ou décalage depuis le bord gauche.
// Verticalement, l'ancre est au centre de la boîte de texte (comme le centrage CSS), ou sur la ligne de base (base: true).
function text(name, str, o) {
  const fam = o.fam || 'sans', w = o.w || 500, ls = o.ls ?? -0.02;
  const width = M(str, fam, w, o.size, ls);
  const ax = o.ax === undefined || o.ax === 'L' ? 0 : o.ax === 'C' ? width / 2 : o.ax === 'R' ? width : o.ax;
  const ay = o.base ? 0 : -BASE[fam] * o.size;
  return lay({type: 'text', name, text: str, font: FONT[fam][w], size: o.size, color: o.color || C.encre, ls, colorKeys: o.colorKeys, decode: o.decode, appear: o.appear,
    vis: o.vis, parent: o.parent, matte: o.matte, fx: o.fx, mb: o.mb, tr: {anchor: o.anchorY !== undefined ? [ax, o.anchorY] : [ax, ay], pos: o.pos, scale: o.scale, rot: o.rot, op: o.op}, width});
}
const dec = (t0, o = {}) => ({t0, stagger: 0.016, dur: 0.14, color: C.orange, ...o});
const blur = (fn) => ({t: 'blur', v: fn});
const glow = (color, op, soft, o = {}) => ({t: 'glow', color, op, soft, dist: o.dist ?? 0, dir: o.dir ?? 180});

// Grille (lignes) : un trait vertical + répétiteur, un trait horizontal + répétiteur
function gridShape(name, {x0 = 0, y0 = 0, w, h, step, ox = 0, oy = 0, color, sw = 1.4}, o = {}) {
  const fx = ((ox % step) + step) % step, fy = ((oy % step) + step) % step;
  const nx = Math.max(1, Math.ceil((w - fx) / step)), ny = Math.max(1, Math.ceil((h - fy) / step));
  return shape(name, [
    gr('Verticales', [pth(line(x0 + fx, y0, x0 + fx, y0 + h)), stroke(color, sw), rep(nx, [step, 0])]),
    gr('Horizontales', [pth(line(x0, y0 + fy, x0 + w, y0 + fy)), stroke(color, sw), rep(ny, [0, step])]),
  ], o);
}

// Logo (unités du tracé ; calque « raw » : l'échelle convertit en pixels)
const markGroups = (pieceTr, look) => PIECES.map((p, i) => {
  const t = pieceTr[i] || {};
  return gr(['S', 'Éclat du C', 'Arc du C'][i], [...p.paths.map((q) => pth(q)), ...look], {anchor: [p.cx, p.cy], pos: t.pos || [p.cx, p.cy], rot: t.rot, scale: t.scale, op: t.op});
}).reverse();

// ───────────────────────── Scènes ─────────────────────────
function buildScenes() {
  const t2r = {};
  const sc = (k) => t2r[k];
  t2r.S1 = rangeOf((t) => t < E.open1);
  t2r.S2 = rangeOf((t) => t >= E.open1 && t < E.cercles);
  t2r.S3 = rangeOf((t) => t >= E.cercles && t < E.tout);
  t2r.S4 = rangeOf((t) => t >= E.tout && t < E.blanc);
  t2r.S5 = rangeOf((t) => t >= E.blanc && t < E.orange);
  t2r.S6 = rangeOf((t) => t >= E.orange && t < E.outro);
  t2r.S7 = rangeOf((t) => t >= E.outro);
  const cx = W / 2, cy = H / 2;

  // ── 1 · Accroche ──
  comp('S1 · Accroche', sc('S1'), C.papier, () => {
    const size = v ? 96 : 76, slot = size * 1.45, gap = size * 0.28;
    const step = v ? 180 : 160;
    gridShape('Grille', {w: W, h: H, step, ox: (W / 2) % step, oy: (H / 2) % step, color: '#EFEFEF'});
    const A = (t) => lerp(t, E.logo - 0.08, E.logo + 0.22, 1, 0, io) * size * 5.4;
    const B = (t) => lerp(t, E.outTxt, E.outTxt + 0.24, slot, slot * 1.1, io);
    const pW = (t) => lerp(t, E.projet - 0.02, E.projet + 0.36, 0, 1, ease);
    const Cw = (t) => pW(t) * (1 - lerp(t, E.outTxt, E.outTxt + 0.24, 0, 1, io)) * size * 7.4;
    const rowL = (t) => W / 2 - (A(t) + B(t) + Cw(t)) / 2;
    const rowY = H / 2 - size * 0.04;
    const slotL = (t) => rowL(t) + A(t);
    const slotC = (t) => slotL(t) + B(t) / 2;

    // Construis (case qui se replie, texte calé à droite)
    const wC = M('Construis', 'sans', 500, size, -0.02);
    const cIn = (t) => pop(t, E.construis, 0.28);
    shape('Cache Construis', [gr('Cache', [rect((t) => [Math.max(0.01, A(t)), size * 2], (t) => [rowL(t) + A(t) / 2, rowY]), fill(C.blanc)])], {matteOnly: true, vis: (t) => t >= E.construis});
    text('Construis', 'Construis', {size, vis: (t) => t >= E.construis, ax: (wC + gap) / 2, pos: (t) => [rowL(t) + A(t) - (wC + gap) / 2, rowY], scale: (t) => 100 * (0.82 + 0.18 * cIn(t)),
      colorKeys: [[0, C.orange], [E.construis + 0.13, C.encre]], decode: dec(E.construis), fx: [blur((t) => softPx(cIn(t), 14))], matte: 'Cache Construis', mb: true});

    // ton
    const tonIn = (t) => pop(t, E.ton, 0.26);
    text('ton', 'ton', {size, vis: (t) => t >= E.ton && t < E.morph, ax: 0, pos: (t) => [slotL(t), rowY - size * 0.0575], scale: (t) => 100 * (0.8 + 0.2 * tonIn(t)), fx: [blur((t) => softPx(tonIn(t), 12))], mb: true});

    // Formes du morph (t → barre, o → disque, n → arche), puis rassemblement en logo
    const m = (t) => lerp(t, E.morph, E.morph + 0.22, 0, 1);
    const swap = (t) => lerp(t, E.hit1 - 0.05, E.hit1 + 0.18, 0, 1, io);
    const gather = (t) => lerp(t, E.logo - 0.3, E.logo, 0, 1, easeIn);
    const markH = size;
    const shapes = [
      {kind: 'bar', x: -slot * 0.3, y: 0, w: size * 0.16, h: size * 0.72},
      {kind: 'disc', x: 0, y: size * 0.1, w: size * 0.5, h: size * 0.5},
      {kind: 'arch', x: slot * 0.32, y: size * 0.1, w: size * 0.46, h: size * 0.5},
    ];
    const burst = [{x: -slot * 0.5, y: -size * 0.3, r: -18, sx: 2.6, sy: 0.7}, {x: slot * 0.1, y: size * 0.28, r: 0, sx: 1.9, sy: 1.9}, {x: slot * 0.62, y: -size * 0.26, r: 90, sx: 1.9, sy: 1.9}];
    const burst2 = [{x: slot * 0.5, y: size * 0.3, r: 0, sx: 3.4, sy: 0.5}, {x: -slot * 0.46, y: -size * 0.16, r: 0, sx: 1.5, sy: 1.5}, {x: slot * 0.04, y: -size * 0.3, r: 180, sx: 1.8, sy: 1.8}];
    const archPath = (w, h) => {
      const R = w / 2, b = w * 0.24, r = R - b, k = K4;
      const pts = [[0, h], [0, R], [R, 0], [w, R], [w, h], [w - b, h], [w - b, R], [R, b], [b, R], [b, h]];
      const ins = [[0, 0], [0, 0], [-k * R, 0], [0, -k * R], [0, 0], [0, 0], [0, 0], [k * r, 0], [0, -k * r], [0, 0]];
      const outs = [[0, 0], [0, -k * R], [k * R, 0], [0, 0], [0, 0], [0, 0], [0, -k * r], [-k * r, 0], [0, 0], [0, 0]];
      return {v: pts.map(([x, y]) => [x - w / 2, y - h / 2]), i: ins, o: outs, c: true};
    };
    shapes.forEach((s, i) => {
      const b1 = burst[i], b2 = burst2[i];
      const piece = PIECES[[1, 2, 0][i]];
      const kk = markH / MARK.h;
      const tx = (piece.cx - MARK.w / 2) * kk, ty = (piece.cy - MARK.h / 2) * kk;
      const st = (t) => {
        const sw = swap(t), mm = m(t), g = gather(t);
        const bx = b1.x + (b2.x - b1.x) * sw, by = b1.y + (b2.y - b1.y) * sw;
        const br = b1.r + (b2.r - b1.r) * sw, bsx = b1.sx + (b2.sx - b1.sx) * sw, bsy = b1.sy + (b2.sy - b1.sy) * sw;
        const x0 = s.x + (bx - s.x) * mm, y0 = s.y + (by - s.y) * mm;
        return {x: x0 + (tx - x0) * g, y: y0 + (ty - y0) * g, sx: (1 + (bsx - 1) * mm) * (1 - g * 0.65), sy: (1 + (bsy - 1) * mm) * (1 - g * 0.65), r: br * mm * (1 - g)};
      };
      const color = {hold: (t) => (m(t) < 0.5 ? C.encre : gather(t) > 0.6 ? C.noir : gather(t) > 0.2 ? C.orange : C.peach)};
      const geo = s.kind === 'bar' ? rect([s.w, s.h], [0, 0], 2) : s.kind === 'disc' ? ell([s.w, s.h]) : pth(archPath(s.w, s.h));
      shape(['Forme barre', 'Forme disque', 'Forme arche'][i], [gr('Forme', [geo, fill(color)])], {
        vis: (t) => t >= E.morph && t < E.logo, mb: true,
        tr: {pos: (t) => [slotL(t) + slot / 2 + st(t).x, rowY + st(t).y], rot: (t) => st(t).r, scale: (t) => [100 * st(t).sx, 100 * st(t).sy]},
      });
    });

    // Logo noir, puis rotation → cube
    const lk = (t) => pop(t, E.logo, 0.3, 0.25);
    const toCube = (t) => lerp(t, E.cube - 0.1, E.cube + 0.12, 0, 1, easeIn);
    const kMark = markH / (MARK.h + 40);
    shape('Logo', markGroups([
      {scale: (t) => 100 * (0.6 + 0.4 * pop(t, E.logo + 0.04, 0.3))},
      {rot: (t) => (1 - lk(t)) * -40},
      {},
    ], [fill(C.noir, 100, 2)]), {
      raw: true, vis: (t) => t >= E.logo && t < E.cube + 0.12, mb: true,
      tr: {anchor: [MARK.w / 2, MARK.h / 2], pos: (t) => [slotC(t), rowY], rot: (t) => toCube(t) * 120, scale: (t) => 100 * kMark * (0.7 + 0.3 * lk(t)) * (1 - toCube(t))},
    });
    const cubeIn = (t) => pop(t, E.cube, 0.3, 0.2);
    const filled = (t) => t >= E.cubeFill;
    const cubeS = (t) => cubeIn(t) * (filled(t) ? 1 + 0.12 * pop(t, E.cubeFill, 0.22) - 0.12 * (t > E.cubeFill + 0.05 ? 1 : 0) * pop(t, E.cubeFill + 0.05, 0.2) : 1);
    shape('Cube', [
      gr('Arêtes', [...svgToPaths(CUBE_IN).map((q) => pth(q)), stroke({hold: (t) => (filled(t) ? '#D8D8D8' : C.noir)}, 1.9, {join: 2})]),
      gr('Face haute', [pth(svgToPaths(CUBE_TOP)[0]), fill('#3A3A3A')], {op: {hold: (t) => (filled(t) ? 100 : 0)}}),
      gr('Hexagone', [pth(svgToPaths(CUBE_HEX)[0]), stroke(C.noir, 1.9, {join: 2}), fill(C.noir, {hold: (t) => (filled(t) ? 100 : 0)})]),
    ], {raw: true, vis: (t) => t >= E.cube, mb: true, tr: {pos: (t) => [slotC(t), rowY], scale: (t) => 100 * (size * 0.78 / 24) * cubeS(t)}});

    // prochain projet (case qui se déplie, texte calé à gauche)
    shape('Cache projet', [gr('Cache', [rect((t) => [Math.max(0.01, Cw(t)), size * 2], (t) => [slotL(t) + B(t) + Cw(t) / 2, rowY]), fill(C.blanc)])], {matteOnly: true, vis: (t) => Cw(t) > 0.01});
    text('prochain projet', 'prochain projet', {size, vis: (t) => Cw(t) > 0.01, ax: 0, pos: (t) => [slotL(t) + B(t) + gap * 0.6 + (1 - pW(t)) * -size * 0.6, rowY],
      decode: dec(E.projet), fx: [blur((t) => softPx(pW(t), 12))], matte: 'Cache projet', mb: true});
  });

  // ── 2 · La boîte s'ouvre : « Ton idée ⬡ Ton digital » ──
  comp('S2 · Idée → digital', sc('S2'), C.papier, () => {
    const s1 = (t) => pop(t, E.open1, 0.24, 0.1), s2 = (t) => pop(t, E.open2, 0.26, 0.1), s3 = (t) => pop(t, E.open3, 0.3, 0.06);
    const bw = (t) => 90 + (v ? 520 : 760) * s1(t) + (v ? 470 : 1170) * s2(t) + 400 * s3(t);
    const bh = (t) => 90 + (v ? 200 : 180) * s1(t) + (v ? 300 : 120) * s2(t) + (H - 200) * s3(t);
    const ow = (t) => Math.max(0, 2 * (1 - s3(t)));
    const cardW = v ? 940 : 1080, cardH = v ? 320 : 260;
    const size = v ? 60 : 54;
    const step = v ? 180 : 160;
    shape('Boîte', [
      gr('Contour', [rect((t) => [bw(t) + ow(t), bh(t) + ow(t)]), stroke(C.noir, ow)]),
      gr('Fond', [rect((t) => [bw(t), bh(t)]), fill(C.fond)]),
    ], {tr: {pos: [cx, cy]}, mb: true});
    shape('Cache boîte', [gr('Cache', [rect((t) => [bw(t), bh(t)]), fill(C.blanc)])], {matteOnly: true, tr: {pos: [cx, cy]}});
    const gx0 = cx - Math.ceil(cx / step + 1) * step, gy0 = cy - Math.ceil(cy / step + 1) * step;
    gridShape('Grille', {x0: gx0, y0: gy0, w: W - gx0 + step, h: H - gy0 + step, step, color: '#E4E4E4'}, {matte: 'Cache boîte', tr: {pos: (t) => [(t - E.open3) * 14, 0]}});
    const corners = [[0, 0], [1, 0], [0, 1], [1, 1]];
    shape('Carte', [
      ...corners.map(([i, j]) => gr('Coin', [rect([8, 8], [(i - 0.5) * cardW, (j - 0.5) * cardH]), fill('#BDBDBD')])),
      gr('Carte', [rect([cardW + 1.4, cardH + 1.4]), stroke('#DCDCDC', 1.4), rect([cardW, cardH]), fill(C.blanc)]),
    ], {tr: {pos: [cx, cy], op: (t) => 100 * Math.min(1, s2(t))}, matte: 'Cache boîte'});
    const fsl = v ? 17 : 15;
    text('Repère idée → digital', 'IDÉE → DIGITAL', {fam: 'mono', size: fsl, ls: 0.1, color: '#9A9A9A', ax: 'L', pos: [cx - cardW / 2, cy - cardH / 2 - 34 + 0.575 * fsl], op: (t) => 100 * Math.min(1, s3(t)), decode: dec(E.open3 + 0.05, {color: '#9A9A9A'}), matte: 'Cache boîte'});
    text('Repère coordonnées', 'X 540 · Y 960', {fam: 'mono', size: fsl, ls: 0.1, color: '#9A9A9A', ax: 'R', pos: [cx + cardW / 2, cy + cardH / 2 + 16 + 0.575 * fsl], op: (t) => 100 * Math.min(1, s3(t)), decode: dec(E.open3 + 0.12, {color: '#9A9A9A'}), matte: 'Cache boîte'});
    shape('Ligne de scan', [gr('Scan', [rect((t) => [bw(t), 2]), fill(C.orange)])], {
      vis: (t) => t >= E.open3 && t < E.open3 + 0.42, fx: [glow(C.orange, 0.55, 14)], mb: true,
      tr: {pos: (t) => [cx, cy - bh(t) / 2 + lerp(t, E.open3, E.open3 + 0.4, 0, bh(t), Easing.inOut(Easing.quad))], op: (t) => 100 * (1 - lerp(t, E.open3 + 0.3, E.open3 + 0.42, 0, 1))},
    });
    const a1 = (t) => pop(t, E.idee, 0.3), a2 = (t) => pop(t, E.cubePop, 0.32, 0.25), a3 = (t) => pop(t, E.digital, 0.3);
    const w1 = M('Ton idée', 'sans', 500, size, -0.02), w2 = M('Ton digital', 'sans', 500, size, -0.02);
    const rowL = cx - (w1 + w2 + 1.05 * size + size) / 2;
    text('Ton idée', 'Ton idée', {size, vis: (t) => a1(t) > 0, ax: 'L', pos: (t) => [rowL + (1 - a1(t)) * 30, cy], decode: dec(E.idee), fx: [blur((t) => softPx(a1(t)))], mb: true});
    const cubeK = (size * 1.05) / 24;
    shape('Cube idée', [gr('Cube', [...svgToPaths(CUBE_IN).map((q) => pth(q)), pth(svgToPaths(CUBE_HEX)[0]), stroke(C.encre, 1.5, {join: 2})])], {
      raw: true, vis: (t) => a2(t) > 0, mb: true, tr: {pos: [rowL + w1 + 0.5 * size + 0.525 * size, cy], scale: (t) => 100 * cubeK * a2(t), rot: (t) => (1 - a2(t)) * -60},
    });
    text('Ton digital', 'Ton digital', {size, vis: (t) => a3(t) > 0, ax: 'L', pos: (t) => [rowL + w1 + 2.05 * size + (1 - a3(t)) * -30, cy], decode: dec(E.digital), fx: [blur((t) => softPx(a3(t)))], mb: true});
    // petits carrés noirs tirés par la boîte
    const sq = (k) => (t) => pop(t, E.open1 + k * 0.08, 0.2) * (1 - lerp(t, E.open3, E.open3 + 0.25, 0, 1, io));
    [-1, 1].forEach((side) => shape(side < 0 ? 'Carrés gauche' : 'Carrés droite', [0, 1, 2, 3, 4].map((k) => {
      const yy = cy + (k - 2) * (v ? 300 : 190);
      const x = (t) => (side < 0 ? (W - bw(t)) / 2 + 2 - 22 - (k % 2) * 30 - 16 : W - ((W - bw(t)) / 2 + 2) + 22 + (k % 2) * 30 + 16);
      return gr('Carré ' + (k + 1), [rect([32, 32]), fill(C.noir)], {pos: (t) => [x(t), yy], scale: (t) => 100 * sq(k)(t)});
    }), {vis: (t) => t < E.open3 + 0.3, mb: true}));
  });

  // ── 3 · Cercles concentriques et services en orbite ──
  comp('S3 · Services connectés', sc('S3'), '#F7F7F8', () => {
    const R = v ? [260, 430, 600] : [220, 340, 470];
    const fx = v ? 0.62 : 1.25, fy = v ? 1.2 : 0.82;
    const size = v ? 60 : 52;
    const SERV = ['Web', 'App', 'Cloud', 'SEO', 'Design', 'Support'];
    const place = v ? [[-115, 1], [-65, 2], [-28, 2], [32, 2], [112, 1], [152, 2]] : [[-150, 1], [-70, 2], [-12, 1], [40, 2], [118, 1], [190, 2]];
    const X = (n) => r3(n * S);
    const orbitExpr = (i) => `var a=(${place[i][0]}+(time-${E.cercles})*7)*Math.PI/180;`
      + `var qx=${X(cx)}+Math.cos(a)*${X(R[place[i][1]] * fx)}, qy=${X(cy)}+Math.sin(a)*${X(R[place[i][1]] * fy)};`;
    R.forEach((r, i) => shape('Cercle ' + (i + 1), [gr('Cercle', [
      ell((t) => { const rr = r * (0.82 + 0.18 * lerp(t, E.cercles + i * 0.06, E.cercles + i * 0.06 + 0.5, 0, 1)); return [2 * rr * fx, 2 * rr * fy]; }),
      stroke('#CFCFD4', 2.2, {dash: i === 1 ? [2, 10] : [14, 8], doff: {x: `(time-${E.cercles})*${(i % 2 ? 60 : -40) * S}`}}),
    ])], {tr: {pos: [cx, cy], op: (t) => 100 * lerp(t, E.cercles, E.cercles + 0.6, 0, 1)}}));
    SERV.forEach((n, i) => {
      const t0 = E.pills[i];
      const kExpr = `var s=Math.min(Math.max((time-${t0 - 0.14})/0.14,0),1), k=s*s;`;
      shape('Liaison ' + n, [gr('Liaison', [pthx(`${orbitExpr(i)}${kExpr}createPath([[${X(cx)},${X(cy)}],[${X(cx)}+(qx-${X(cx)})*k,${X(cy)}+(qy-${X(cy)})*k]],[],[],false);`), stroke('#C9C9CE', 1.6, {dash: [5, 7]})])], {vis: (t) => t >= t0 - 0.14});
      shape('Impulsion ' + n, [gr('Point', [ell([14, 14]), fill(C.orange)])], {vis: (t) => t >= t0 - 0.14 && t < t0, fx: [glow(C.orange, 0.9, 6)], mb: true,
        tr: {pos: {x: `${orbitExpr(i)}${kExpr}[${X(cx)}+(qx-${X(cx)})*k,${X(cy)}+(qy-${X(cy)})*k];`}}});
      const loop = `var l=((time-${t0})*1.1+${r3(i * 0.17)})%1;`;
      shape('Impulsion boucle ' + n, [gr('Point', [ell([8, 8]), fill(C.orange)])], {vis: (t) => t > t0 + 0.2, mb: true,
        tr: {pos: {x: `${orbitExpr(i)}${loop}[${X(cx)}+(qx-${X(cx)})*l,${X(cy)}+(qy-${X(cy)})*l];`}, op: {x: `${loop}85*Math.sin(l*Math.PI);`}}});
    });
    E.pills.forEach((p, i) => {
      const k = (t) => lerp(t, p, p + 0.7, 0, 1, Easing.out(Easing.quad));
      shape('Onde ' + (i + 1), [gr('Onde', [ell((t) => [2 * (120 + k(t) * 520), 2 * (120 + k(t) * 520)]), stroke(C.peach, 2)])], {vis: (t) => t >= p && t < p + 0.7, tr: {pos: [cx, cy], op: (t) => 50 * (1 - k(t))}});
    });
    // Titre sur fond (masque les liaisons)
    const wT = M('Chaque besoin, connecté', 'sans', 500, size, -0.02);
    nul('Titre', {tr: {pos: [cx, cy], scale: (t) => 100 * (0.9 + 0.1 * pop(t, E.cercles, 0.3))}, mb: true});
    shape('Titre · fond', [gr('Fond', [rect([wT + 56, 1.15 * size + 28]), fill('#F7F7F8')])], {parent: 'Titre', mb: true});
    text('Titre · texte', 'Chaque besoin, connecté', {size, ax: 'L', pos: [-wT / 2, 0], parent: 'Titre', decode: dec(E.cercles), mb: true});
    // Pastilles
    SERV.forEach((n, i) => {
      const hl = i === 2;
      const ps = v ? 1.75 : 1.45;
      const tw = M(n, 'sans', 500, 22, -0.02);
      const pw = 72 + tw;
      nul('Pastille ' + n, {mb: true, tr: {pos: {x: `${orbitExpr(i)}[qx,qy];`}, scale: (t) => 100 * ps * pop(t, E.pills[i], 0.3, 0.3)}});
      const iconX = -pw / 2 + 26;
      const ip = iconPaths(ICONS[n], iconX - 11, -11, 22 / 24);
      shape('Pastille ' + n + ' · forme', [
        gr('Icône', [...ip.map((q) => pth(q)), stroke(C.blanc, 1.8 * 22 / 24, {cap: 2, join: 2})]),
        gr('Rond', [ell([36, 36], [iconX, 0]), fill(hl ? C.orange : C.encre)]),
        ...(hl ? [] : [gr('Contour', [rect([pw + 1.2, 53.2], [0, 0], 26.6), stroke('#E6E6E6', 1.2)])]),
        gr('Pastille', [rect([pw, 52], [0, 0], 26), fill(hl ? C.peach : C.blanc)]),
      ], {parent: 'Pastille ' + n, fx: [glow('#000000', 0.06, 14, {dist: 4, dir: 180})], mb: true});
      text('Pastille ' + n + ' · texte', n, {size: 22, ax: 'L', pos: [-pw / 2 + 54, 0], parent: 'Pastille ' + n, mb: true});
    });
    // Trame noire qui envahit depuis la droite
    const cell = v ? 60 : 54;
    const cols = Math.ceil(W / cell) + 1, rows = Math.ceil(H / cell) + 1;
    const tr = (t) => lerp(t, E.trame, E.tout, 0, 1, Easing.bezier(0.5, 0, 0.9, 0.6));
    shape('Trame', Array.from({length: cols}, (_, i) => {
      const fromRight = (cols - 1 - i) / cols;
      const kk = (t) => clamp01((tr(t) * 1.6 - fromRight) * 2.4);
      return gr('Colonne ' + (i + 1), [rect((t) => [kk(t) * cell * 0.98, kk(t) * cell * 0.98], [i * cell + cell / 2, cell / 2]), fill(C.noir), rep(rows, [0, cell])]);
    }).reverse(), {vis: (t) => t >= E.trame});
  });

  // ── 4 · Typo mono « Tout / en un / endroit » ──
  comp('S4 · Tout en un endroit', sc('S4'), C.noir, () => {
    const size = v ? 236 : 300, adv = size * 0.6;
    const words = [{s: 'Tout', t: E.tout}, {s: 'en un', t: E.enun}, {s: 'endroit', t: E.endroit}];
    let col = 0;
    const lay2 = words.map((w) => { const o = {...w, col}; col += w.s.length + 1; return o; });
    const margin = v ? 36 : 120;
    const targetFor = (i) => Math.min(margin, W - margin - (lay2[i].col + lay2[i].s.length) * adv);
    const lineX = (t) => {
      let x = targetFor(0);
      for (let i = 1; i < lay2.length; i++) x += (targetFor(i) - targetFor(i - 1)) * lerp(t, lay2[i].t - 0.02, lay2[i].t + 0.2, 0, 1, io);
      return x - (t > E.endroit + 0.2 ? (t - E.endroit - 0.2) * (v ? 30 : 90) : 0);
    };
    // micro-grille en contour
    const gTop = H - (v ? 260 : 60) - 144;
    shape('Micro-grille', Array.from({length: 12}, (_, i) => gr('Case ' + (i + 1), [rect([37.2, 37.2]), stroke(C.blanc, 1.2, {op: 55})], {
      pos: [(i % 3) * 36 + 18, gTop + Math.floor(i / 3) * 36 + 18], scale: (t) => 100 * pop(t, E.tout + (i % 4) * 0.05, 0.2),
    })).reverse(), {tr: {op: 80}});
    // fantômes pixel orange
    const PIX = {
      T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'], O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
      U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'], E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
      N: ['10001', '11001', '10101', '10101', '10011', '10001', '10001'], D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
      R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'], I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    };
    const ghosts = [{w: 'TOUT', t: E.tout, x: v ? 0.52 : 0.62, y: v ? 0.68 : 0.72}, {w: 'EN', t: E.enun, x: v ? 0.12 : 0.2, y: v ? 0.27 : 0.12}, {w: 'ENDROIT', t: E.endroit, x: v ? 0.2 : 0.42, y: v ? 0.76 : 0.8}];
    const px = v ? 16 : 14;
    ghosts.forEach((g) => {
      const cells = [];
      [...g.w].forEach((ch, kk) => PIX[ch].forEach((row, y) => [...row].forEach((b, x) => { if (b === '1') cells.push({x: kk * 6 + x, y}); })));
      const reveal = (t) => lerp(t, g.t, g.t + 0.1, 0.3, 1, Easing.linear) * (1 - lerp(t, g.t + 0.22, g.t + 0.32, 0, 1, Easing.linear));
      const f0 = Math.ceil(g.t * FPS - 1e-6), f1 = Math.ceil((g.t + 0.32) * FPS - 1e-6) - 1;
      const buckets = new Map();
      cells.forEach((c, i) => {
        const r = rnd(i + g.w.length * 31);
        let a = -1, b = -1;
        for (let f = f0; f <= f1; f++) if (r < reveal(f / FPS)) { if (a < 0) a = f; b = f; }
        if (a < 0) return;
        const key = a + '-' + b;
        if (!buckets.has(key)) buckets.set(key, {a, b, cells: []});
        buckets.get(key).cells.push(c);
      });
      shape('Fantôme ' + g.w, [...buckets.values()].map((bk, j) => gr('Pixels ' + (j + 1), [
        ...bk.cells.map((c) => rect([px, px], [W * g.x + c.x * px + px / 2, H * g.y + c.y * px + px / 2])), fill(C.orange),
      ], {op: {hold: (t) => (t >= bk.a / FPS - 1e-6 && t < (bk.b + 1) / FPS - 1e-6 ? 100 : 0)}})), {vis: (t) => t >= g.t && t < g.t + 0.32});
    });
    // la ligne mono qui défile
    nul('Ligne mono', {tr: {pos: (t) => [lineX(t), H / 2]}, mb: true});
    const typed = (w) => (t) => Math.max(1, Math.ceil(lerp(t, w.t, w.t + 0.03 * w.s.length, 1, w.s.length, Easing.linear)));
    lay2.forEach((w) => {
      const p = (t) => pop(t, w.t, 0.18, 0.12);
      text('Mot « ' + w.s + ' »', w.s, {fam: 'mono', size, ls: 0, color: C.blanc, base: true, parent: 'Ligne mono', vis: (t) => t >= w.t, mb: true,
        pos: (t) => [w.col * adv, 0.86 * size + (1 - p(t)) * 40], appear: {hold: typed(w)}});
    });
    text('Invite', '> cyberspace --tout-en-un', {fam: 'mono', size: v ? 26 : 24, ls: 0.04, color: '#8C8C8C', ax: 'L', pos: [v ? 70 : 120, H / 2 - size * 0.95 + 0.575 * (v ? 26 : 24)], decode: dec(E.tout, {stagger: 0.012})});
    // curseur bloc orange (aligné sur les capitales)
    const curState = (t) => {
      let cur = null;
      lay2.forEach((w) => { if (t >= w.t) cur = w; });
      if (!cur) return null;
      const n = typed(cur)(t);
      const typing = t < cur.t + 0.03 * cur.s.length + 0.05;
      return {x: (cur.col + n) * adv + adv * 0.12 + adv * 0.25, show: typing || Math.floor(t * 3.2) % 2 === 0};
    };
    shape('Curseur', [gr('Curseur', [rect([adv * 0.5, size * 0.73]), fill(C.orange)])], {parent: 'Ligne mono', vis: (t) => t >= E.tout, fx: [glow(C.orange, 0.6, 18)],
      tr: {pos: {hold: (t) => [curState(t).x, 0.86 * size - 0.365 * size]}, op: {hold: (t) => (curState(t).show ? 100 : 0)}}});
    // blocs blancs en 3 vagues
    const bs = v ? 135 : 120;
    const bc = Math.ceil(W / bs), br = Math.ceil(H / bs);
    const waves = [E.blocs, 10.43, E.blanc - 0.03];
    waves.forEach((wt, k) => {
      const list = [];
      for (let i = 0; i < bc; i++) for (let j = 0; j < br; j++) {
        const r = rnd(i * 31 + j * 7 + 3);
        if ((r < 0.33 ? 0 : r < 0.7 ? 1 : 2) === k) list.push(rect([bs + 1, bs + 1], [i * bs + (bs + 1) / 2, j * bs + (bs + 1) / 2]));
      }
      shape('Blocs vague ' + (k + 1), [gr('Blocs', [...list, fill(C.blanc)])], {vis: (t) => t >= wt});
    });
  });

  // ── 5 · Flowchart « De la première idée → au lancement » + volet orange ──
  comp('S5 · De l\'idée au lancement', sc('S5'), '#F7F7F8', () => {
    const panY = (t) => lerp(t, E.pan, E.pense[0] - 0.02, 0, v ? -H * 0.62 : -H * 0.7, io);
    const panX = (t) => lerp(t, E.pan, E.pense[0] - 0.02, 0, v ? -W * 0.18 : -W * 0.22, io);
    const drift = (t) => (t - E.blanc) * (v ? -10 : -14);
    nul('Caméra', {tr: {pos: (t) => [panX(t), panY(t) + drift(t)]}, mb: true});
    const par = {parent: 'Caméra', mb: true};
    gridShape('Grille', {w: W * 1.6, h: H * 2.2, step: v ? 120 : 110, color: '#ECECEE'}, par);
    const N1 = v ? {x: W * 0.5, y: H * 0.34} : {x: W * 0.5, y: H * 0.24};
    const nodeW = v ? 720 : 560, nodeH = v ? 140 : 104;
    const fs = v ? 52 : 40;
    const stepY = N1.y + (v ? 380 : 240);
    const stepX = (i) => (v ? W * (0.2 + i * 0.3) : N1.x - 280 + i * 320);
    const finY = stepY + (v ? 320 : 200);
    const draw1 = (t) => lerp(t, E.node1 - 0.1, E.node1 + 0.25, 0, 1, io);
    const draw2 = (t) => lerp(t, E.trait, E.n4, 0, 1, Easing.inOut(Easing.quad));
    const draw3 = (t) => lerp(t, E.n4 + 0.1, E.au, 0, 1, io);
    const p1 = [poly([[N1.x - nodeW * 0.25, -40], [N1.x - nodeW * 0.25, N1.y - nodeH / 2 - 60], [N1.x + nodeW * 0.3, N1.y - nodeH / 2 - 60], [N1.x + nodeW * 0.3, N1.y - nodeH / 2]])];
    const p2 = [poly([[N1.x, N1.y + nodeH / 2], [N1.x, stepY - 90], [stepX(0), stepY - 90], [stepX(0), stepY - 34]]), poly([[stepX(0), stepY - 90], [stepX(2), stepY - 90], [stepX(2), stepY - 34]])];
    const p3 = [poly([[stepX(2), stepY + 34], [stepX(2), finY - 70], [N1.x - (v ? 150 : 100), finY - 70], [N1.x - (v ? 150 : 100), finY - 30]])];
    // Comme en SVG (pathLength = 1), chaque branche se dessine à la même vitesse depuis son départ :
    // la part visible d'une branche = avancement × longueur totale du tracé
    const plen = (q) => q.v.reduce((a, p, j) => (j ? a + Math.hypot(p[0] - q.v[j - 1][0], p[1] - q.v[j - 1][1]) : 0), 0);
    [[p1, draw1], [p2, draw2], [p3, draw3]].forEach(([ps, dr], i) => {
      const tot = ps.reduce((a, q) => a + plen(q), 0);
      shape('Tracé ' + (i + 1), ps.map((q, j) => gr('Branche ' + (j + 1), [pth(q), trim(0, (t) => 100 * Math.min(1, (dr(t) * tot) / plen(q)), 0, 1), stroke('#2A2A2A', 2)])).reverse(), par);
    });
    [[p2, E.n4, 0], [p3, E.au, 0.4]].forEach(([ps, t0, ph], i) => {
      const tot = ps.reduce((a, q) => a + plen(q), 0);
      shape('Impulsions tracé ' + (i + 2), ps.map((q, j) => {
        const r = r3(tot / plen(q));
        const pos = `var p=((time*0.8+${ph})%1)*${r};`;
        return gr('Impulsion ' + (j + 1), [pth(q), trim({x: `${pos}Math.min(p,1)*100;`}, {x: `${pos}Math.min(p+${r3(0.05 * r)},1)*100;`}, 0, 1), stroke(C.orange, 4, {cap: 2})]);
      }).reverse(), {...par, vis: (t) => t >= t0, fx: [glow(C.orange, 0.9, 6)]});
    });
    // nœud principal
    const n1 = (t) => pop(t, E.node1, 0.3, 0.2);
    nul('Nœud 1', {parent: 'Caméra', tr: {pos: [N1.x, N1.y], scale: (t) => 100 * n1(t)}, mb: true});
    shape('Nœud 1 · forme', [
      ...[[0, 0], [1, 0], [0, 1], [1, 1]].map(([i, j]) => gr('Coin', [rect([8, 8], [(i - 0.5) * nodeW, (j - 0.5) * nodeH]), fill(C.orange)])),
      gr('Nœud', [rect([nodeW, nodeH]), fill(C.peach)]),
    ], {parent: 'Nœud 1', mb: true});
    text('Nœud 1 · texte', 'De la première idée', {size: fs, ax: 'C', pos: [0, 0], parent: 'Nœud 1', decode: dec(E.node1 + 0.04, {color: C.encre}), mb: true});
    const fsl = v ? 17 : 14;
    text('Nœud 1 · repère', 'NODE_01 · IDÉE', {fam: 'mono', size: fsl, ls: 0.1, color: C.orange, ax: 'R', pos: [nodeW / 2, -nodeH / 2 + (v ? -30 : -24) + 0.575 * fsl], parent: 'Nœud 1', decode: dec(E.node1 + 0.1), mb: true});
    const sq = (t) => lerp(t, E.node1 - 0.15, E.node1 + 0.25, 0, 1, io);
    shape('Carré orange', [gr('Carré', [rect([70, 70]), fill(C.orange)])], {...par, vis: (t) => t >= E.node1 - 0.15 && t < E.n2,
      tr: {pos: (t) => [N1.x - nodeW / 2 - 70 + (1 - sq(t)) * -W * 0.4 + 35, N1.y - nodeH / 2 - 70 + 35]}});
    // étapes
    const fsS = v ? 40 : 34, padX = v ? 30 : 28, padY = v ? 20 : 16;
    [{s: 'Brief', t: E.n2}, {s: 'Build', t: E.n3}, {s: 'Launch', t: E.n4}].forEach((st, i) => {
      const wS = M(st.s, 'mono', 600, fsS, 0);
      const bw = 2 * padX + 24 + wS, bh = 2 * padY + 1.15 * fsS;
      const last = i === 2;
      const nm = 'Étape ' + st.s;
      nul(nm, {parent: 'Caméra', tr: {pos: [stepX(i), stepY], scale: (t) => 100 * pop(t, st.t, 0.28, 0.25)}, mb: true});
      shape(nm + ' · forme', [
        gr('Repère', [rect([12, 12], [-bw / 2 + padX + 6, 0]), fill(last ? C.blanc : C.orange)]),
        ...(last ? [] : [gr('Contour', [rect([bw + 1.6, bh + 1.6]), stroke('#2A2A2A', 1.6)])]),
        gr('Fond', [rect([bw, bh]), fill(last ? C.orange : C.blanc)]),
      ], {parent: nm, fx: last ? [glow(C.orange, 0.45, 26)] : undefined, mb: true});
      text(nm + ' · texte', st.s, {fam: 'mono', w: 600, size: fsS, ls: 0, color: last ? C.blanc : C.encre, ax: 'L', pos: [-bw / 2 + padX + 24, 0], parent: nm, mb: true});
      const fsn = v ? 16 : 13;
      text(nm + ' · numéro', `0${i + 1}`, {fam: 'mono', size: fsn, ls: 0.1, color: '#8A8A8A', ax: 'L', pos: [-bw / 2, -bh / 2 + (v ? -28 : -22) + 0.575 * fsn], parent: nm, mb: true});
    });
    // « au lancement » + fusée (mise en page finale fixe)
    const fsF = fs * 1.15, g = fs * 0.3;
    const wAu = M('au', 'sans', 500, fsF, -0.02), wL = M('lancement', 'sans', 500, fsF, -0.02);
    const Wf = wAu + g + wL + g + fs * 1.3;
    const x0 = N1.x - (v ? 150 : 100) - 0.12 * Wf;
    const yF = finY + (1.15 * fsF) / 2;
    [{s: 'au', t: E.au, x: x0}, {s: 'lancement', t: E.lanc, x: x0 + wAu + g}].forEach((w) => {
      const p = (t) => pop(t, w.t, 0.26);
      text('Mot « ' + w.s + ' »', w.s, {size: fsF, ax: 'L', parent: 'Caméra', vis: (t) => t >= w.t, mb: true,
        pos: (t) => [w.x, yF + (1 - p(t)) * 20], op: (t) => 100 * Math.min(1, p(t) * 2), fx: [blur((t) => softPx(p(t)))]});
    });
    const pf = (t) => pop(t, E.fusee, 0.3);
    const rk = fs * 1.3;
    shape('Fusée', [gr('Fusée', [...iconPaths(ROCKET, -12, -12).map((q) => pth(q)), stroke(C.orange, 1.7, {cap: 2, join: 2})])], {
      raw: true, parent: 'Caméra', vis: (t) => t >= E.fusee, mb: true,
      tr: {pos: (t) => [x0 + wAu + g + wL + g + rk / 2 + (1 - pf(t)) * -30, yF + (1 - pf(t)) * 30], scale: (t) => 100 * (rk / 24) * pop(t, E.fusee, 0.3, 0.3)},
    });
    // « Pensé pour ton business » (plus bas sur la feuille, atteint par le panoramique)
    const sP = v ? 74 : 64, gP = fs * 0.32;
    const PW = ['Pensé', 'pour', 'ton', 'business'];
    const wsP = PW.map((w) => M(w, 'sans', 500, sP, -0.02));
    const totP = wsP.reduce((a, b) => a + b, 0) + gP * 3;
    const PX = W / 2 + (v ? W * 0.18 : W * 0.22), PY = H / 2 + (v ? H * 0.62 : H * 0.7);
    let xx = PX - totP / 2;
    PW.forEach((w, i) => {
      const x = xx;
      xx += wsP[i] + gP;
      const p = (t) => pop(t, E.pense[i], 0.24);
      text('Mot « ' + w + ' »', w, {size: sP, color: i === 3 ? C.orange : C.encre, ax: 'L', parent: 'Caméra', vis: (t) => t >= E.pense[i], mb: true,
        pos: (t) => [x, PY + (1 - p(t)) * 24], op: (t) => 100 * Math.min(1, p(t) * 2), fx: [blur((t) => softPx(p(t)))]});
    });
    // volet orange en colonnes
    shape('Volet orange', Array.from({length: 6}, (_, i) => {
      const p = (t) => lerp(t, E.wipe + i * 0.025, E.orange, 0, 1, Easing.bezier(0.7, 0, 0.3, 1));
      return gr('Colonne ' + (i + 1), [rect((t) => [W / 6 + 2, H * p(t)], (t) => [(i * W) / 6 - 1 + (W / 6 + 2) / 2, H - (H * p(t)) / 2]), fill(C.orange)]);
    }), {vis: (t) => t >= E.wipe, mb: true});
  });

  // ── 6 · Plein orange : « On t'accompagne jusqu'au bout. » ──
  comp('S6 · On t\'accompagne', sc('S6'), C.orange, () => {
    const size = v ? 104 : 96;
    const up = (t) => lerp(t, E.bout - 0.02, E.bout + 0.24, 0, 1, io);
    const Y0 = H * (v ? 0.5 : 0.52), x0 = v ? 90 : 220;
    const row1 = (t) => (t < E.bout ? Y0 : Y0 - 0.575 * size - 1.38 * size * up(t));
    const wOn = M('On', 'sans', 600, size, -0.03);
    [['On', E.on, x0], ["t'accompagne", E.acc, x0 + wOn + size * 0.26]].forEach(([w, t0, x]) => {
      const p = (t) => pop(t, t0, 0.26);
      text('Mot « ' + w + ' »', w, {w: 600, size, ls: -0.03, color: C.blanc, ax: 'L', vis: (t) => t >= t0, mb: true,
        pos: (t) => [x, row1(t) + (1 - p(t)) * 30], op: (t) => 100 * (1 - up(t) * 0.55), decode: dec(t0, {stagger: 0.02, color: C.noir})});
    });
    const pb = (t) => pop(t, E.bout, 0.28);
    text("jusqu'au bout.", "jusqu'au bout.", {w: 600, size, ls: -0.03, color: C.blanc, ax: 'L', vis: (t) => t >= E.bout, mb: true,
      pos: (t) => [x0, Y0 + 0.575 * size - 1.38 * size * up(t) + (1 - pb(t)) * 60], decode: dec(E.bout, {stagger: 0.02, color: C.noir})});
  });

  // ── 7 · Plan beige : le logo s'assemble ──
  comp('S7 · Logo', sc('S7'), C.beige, () => {
    const lcx = W / 2, lcy = H * (v ? 0.45 : 0.44);
    const markH = v ? 330 : 260;
    const ink = '#2B2621';
    const slide = (t) => lerp(t, E.outro, E.lock, 0, 1, Easing.bezier(0.5, 0, 0.1, 1));
    const kick = (t) => pop(t, E.lock, 0.3, 0.3);
    const reveal = (t) => lerp(t, E.lock, E.lock + 0.3, 0, 1, io);
    const fillK = (t) => lerp(t, E.lock + 0.2, E.lock + 0.4, 0, 1, Easing.linear);
    const dim = (t) => lerp(t, E.outro + 0.08, E.outro + 0.3, 0, 1) * (1 - 0.65 * lerp(t, E.lock + 0.5, E.lock + 0.9, 0, 1));
    const wIn = (t) => pop(t, E.lock + 0.08, 0.34, 0.15);
    const ctaIn = (t) => pop(t, E.cta, 0.3, 0.25);
    const kM = markH / (MARK.h + 40);
    const markW = (markH * (MARK.w + 40)) / (MARK.h + 40);
    const wordH = markH * 0.62, wordW = (wordH * WORD.w) / WORD.h;
    const subS = v ? 34 : 28;
    const wSub = M('SOLUTIONS DIGITALES', 'sans', 500, subS, 0.32);
    shape('Lignes de construction', [gr('Plan', [
      pth(line(0, lcy - markH / 2, W, lcy - markH / 2)), pth(line(0, lcy + markH / 2, W, lcy + markH / 2)), pth(line(lcx, 0, lcx, H)),
      ell([markH * 1.9, markH * 1.9], [lcx, lcy]), rect([markH * 2.6, markH * 1.9], [lcx, lcy]), stroke(ink, 1.2),
    ])], {tr: {op: (t) => 22 * lerp(t, E.outro, E.outro + 0.2, 0, 1) * (1 - 0.6 * lerp(t, E.lock + 0.2, E.lock + 0.8, 0, 1))}});
    // mise en page du bloc logo (colonne en 9:16, ligne en 16:9), relative au centre du bloc
    const colH = wordH + 18 + 1.15 * subS, colW = Math.max(wordW, wSub);
    let mark0, word0, sub0;
    if (v) {
      const totH = markH + 40 + colH;
      mark0 = [-markW / 2, -totH / 2];
      const colTop = -totH / 2 + markH + 40;
      word0 = [-wordW / 2, colTop];
      sub0 = [-wSub / 2, colTop + wordH + 18 + 0.575 * subS];
    } else {
      const totW = markW + 56 + colW;
      mark0 = [-totW / 2, -markH / 2];
      const colL = -totW / 2 + markW + 56;
      word0 = [colL, -colH / 2];
      sub0 = [colL, -colH / 2 + wordH + 18 + 0.575 * subS];
    }
    nul('Bloc logo', {tr: {pos: [lcx, lcy], scale: (t) => 100 * (t >= E.lock ? 1 + 0.06 * (1 - kick(t)) : 1)}, mb: true});
    nul('Boîte logo', {parent: 'Bloc logo', tr: {pos: mark0}});
    const from = [{x: 900, y: -300, r: 90}, {x: -700, y: 500, r: -90}, {x: -500, y: -700, r: 45}];
    shape('Logo contour', markGroups(from.map((f, i) => ({pos: (t) => [PIECES[i].cx + f.x * (1 - slide(t)), PIECES[i].cy + f.y * (1 - slide(t))], rot: (t) => f.r * (1 - slide(t))})), [stroke(ink, 2 / kM)]),
      {raw: true, parent: 'Boîte logo', vis: (t) => fillK(t) < 1, mb: true, tr: {anchor: [-20, -20], pos: [0, 0], scale: 100 * kM, op: (t) => 100 * (1 - fillK(t))}});
    shape('Cache logo', [gr('Cache', [rect((t) => [markW, Math.max(0.01, reveal(t) * markH)], (t) => [markW / 2, (reveal(t) * markH) / 2]), fill(C.blanc)])], {matteOnly: true, parent: 'Boîte logo', vis: (t) => t >= E.lock});
    shape('Logo', markGroups([{}, {}, {}], [fill(C.noir, 100, 2)]), {raw: true, parent: 'Boîte logo', vis: (t) => t >= E.lock, matte: 'Cache logo', tr: {anchor: [-20, -20], pos: [0, 0], scale: 100 * kM}});
    shape('Scan logo', [gr('Scan', [rect([markW * 1.3, 2]), fill(C.orange)])], {parent: 'Boîte logo', vis: (t) => t >= E.lock && reveal(t) < 1, fx: [glow(C.orange, 0.55, 14)], mb: true,
      tr: {pos: (t) => [markW * 0.5, reveal(t) * markH]}});
    shape('Cotes', [
      gr('Centre', [pth(line(markW / 2 - 14, markH / 2, markW / 2 + 14, markH / 2)), pth(line(markW / 2, markH / 2 - 14, markW / 2, markH / 2 + 14)), stroke(C.orange, 2)]),
      gr('Cotes', [pth(line(0, -40, markW, -40)), pth(line(0, -50, 0, -30)), pth(line(markW, -50, markW, -30)), pth(line(-40, 0, -40, markH)), pth(line(-50, 0, -30, 0)), pth(line(-50, markH, -30, markH)), stroke(ink, 1.4)]),
    ], {parent: 'Boîte logo', tr: {op: (t) => 100 * dim(t)}});
    const fsd = v ? 16 : 14;
    text('Cote largeur', 'W 1317 PX', {fam: 'mono', size: fsd, ls: 0.1, color: ink, ax: 'C', pos: [markW / 2, -72 + 0.575 * fsd], parent: 'Boîte logo', op: (t) => 100 * dim(t), decode: dec(E.outro + 0.1)});
    text('Cote hauteur', 'H 1058 PX', {fam: 'mono', size: fsd, ls: 0.1, color: ink, ax: 'C', pos: [-62, markH / 2], rot: -90, parent: 'Boîte logo', op: (t) => 100 * dim(t), decode: dec(E.outro + 0.14)});
    // nom CyberSpace (révélé de gauche à droite)
    const wordY = (t) => word0[1] + (1 - wIn(t)) * 30;
    shape('Cache nom', [gr('Cache', [rect((t) => [Math.max(0.01, Math.min(1, wIn(t)) * wordW), wordH], (t) => [word0[0] + (Math.min(1, wIn(t)) * wordW) / 2, wordY(t) + wordH / 2]), fill(C.blanc)])],
      {matteOnly: true, parent: 'Bloc logo', vis: (t) => t >= E.lock});
    shape('Nom CyberSpace', [gr('Cyber Space', [...WORD_PATHS.map((q) => pth(q)), fill(C.encre, 100, 2)])], {raw: true, parent: 'Bloc logo', vis: (t) => t >= E.lock, matte: 'Cache nom', mb: true,
      tr: {pos: (t) => [word0[0], wordY(t)], scale: (100 * wordH) / WORD.h}});
    text('Solutions digitales', 'SOLUTIONS DIGITALES', {size: subS, ls: 0.32, ax: 'L', pos: sub0, parent: 'Bloc logo', vis: (t) => pop(t, E.sous, 0.3) > 0, decode: dec(E.sous, {stagger: 0.012})});
    // site de l'entreprise
    const ctaS = v ? 32 : 26;
    const wSite = M('cyberspacesarl.com', 'mono', 500, ctaS, 0.02);
    const yS = H - (v ? 250 : 96) - 0.575 * ctaS;
    text('Site', 'cyberspacesarl.com', {fam: 'mono', size: ctaS, ls: 0.02, ax: 'L', vis: (t) => ctaIn(t) > 0, mb: true, pos: (t) => [lcx - wSite / 2, yS + (1 - ctaIn(t)) * 16],
      decode: dec(E.cta, {stagger: 0.012}), fx: [blur((t) => softPx(ctaIn(t), 8))]});
    const lw = (t) => 60 * Math.min(1, ctaIn(t));
    shape('Filets du site', [
      gr('Filet droit', [rect((t) => [Math.max(0.01, lw(t)), 1.6], (t) => [lcx + wSite / 2 + 18 + lw(t) / 2, yS]), fill(C.encre)]),
      gr('Filet gauche', [rect((t) => [Math.max(0.01, lw(t)), 1.6], (t) => [lcx - wSite / 2 - 18 - lw(t) / 2, yS]), fill(C.encre)]),
    ], {vis: (t) => ctaIn(t) > 0});
  });
}

// ─────────── HUD (interface tête haute) ───────────
function buildHud(light) {
  comp(light ? 'HUD clair' : 'HUD sombre', [0, NF - 1], null, () => {
    const inkC = light ? C.blanc : C.noir, inkO = light ? 85 : 62, faintO = light ? 30 : 16;
    const m = v ? 46 : 40, L = v ? 40 : 32, fs = v ? 18 : 16;
    const k = (t) => lerp(t, 0.05, 0.45, 0, 1, io);
    const corner = (x, y, sx, sy) => pth(poly([[x, y + sy * L], [x, y], [x + sx * L, y]]));
    shape('Coins de visée', [gr('Coins', [corner(m, m, 1, 1), corner(W - m, m, -1, 1), corner(m, H - m, 1, -1), corner(W - m, H - m, -1, -1),
      trim((t) => 50 - 50 * k(t), (t) => 50 + 50 * k(t), 0, 1), stroke(inkC, 2, {op: inkO})])]);
    const ticks = [];
    for (let y = m + 90, n = 0; y < H - m - 90; y += 24, n++) ticks.push(pth(line(m * 0.4, y, m * 0.4 + (n % 5 === 0 ? 12 : 6), y)));
    shape('Graduations', [gr('Graduations', [...ticks, stroke(inkC, 1.4, {op: faintO})])], {tr: {op: (t) => 100 * k(t)}});
    const lab = {fam: 'mono', size: fs, ls: 0.08, color: inkC};
    const op = (t) => inkO * k(t);
    const left = m + L + 14, right = W - (m + L + 14);
    text('CYBERSPACE SARL', 'CYBERSPACE SARL', {...lab, ax: 'L', pos: [left, m], op});
    const wTc = M('TC 00:00:00', 'mono', 500, fs, 0.08);
    const tc = text('Time code', 'TC 00:00:00', {...lab, ax: 'L', pos: [right - wTc, m], op});
    tc.sourceExpr = 'var f=Math.round(time*60);function p(n){return (n<10?"0":"")+n;}"TC "+p(Math.floor(f/3600))+":"+p(Math.floor(f/60)%60)+":"+p(f%60);';
    text('SOLUTIONS DIGITALES', 'SOLUTIONS DIGITALES', {...lab, ax: 'L', pos: [left + fs * 0.55 + 10, H - m], op});
    shape('Point', [gr('Point', [ell([fs * 0.55, fs * 0.55], [left + fs * 0.275, H - m]), fill(C.orange)], {op: {x: 'Math.floor(time*2.4)%2==0?100:25;'}})], {tr: {op: (t) => 100 * k(t)}, fx: [glow(C.orange, 0.8, 8)]});
    const wIdx = M('01 / 07', 'mono', 500, fs, 0.08);
    const idx = text('Index du bloc', '01 / 07', {...lab, ax: 'L', pos: [right - wIdx, H - m], op});
    const th = [E.open1, E.cercles, E.tout, E.blanc, E.pense[0], E.outro].map((x) => Math.ceil(x * FPS - 1e-6));
    idx.sourceExpr = `var f=Math.round(time*60),th=[${th.join(',')}],i=1;for(var j=0;j<th.length;j++){if(f>=th[j])i=j+2;}"0"+i+" / 07";`;
  });
}

// ─────────── Sérialisation ───────────
function serLayer(L, cm) {
  let [fa, fb] = cm.range;
  if (L.vis) {
    let a = -1, b = -1;
    for (let f = fa; f <= fb; f++) if (L.vis(f / FPS)) { if (a < 0) a = f; b = f; }
    if (a < 0) { console.warn('  calque jamais visible :', cm.name, '›', L.name); return null; }
    fa = a; fb = b;
  }
  const ctx = {fa, fb};
  const k = L.raw ? 1 : S;
  const tr = L.tr || {};
  const o = {type: L.type, name: L.name, in: r3(fa / FPS), out: r3((fb + 1) / FPS)};
  if (L.parent) o.parent = L.parent;
  if (L.matte) o.matte = L.matte;
  if (L.matteOnly) o.matteOnly = 1;
  if (L.mb) o.mb = 1;
  o.tr = {
    a: P(tr.anchor || [0, 0], ctx, {mul: k}),
    p: P(tr.pos || [0, 0], ctx, {mul: S}),
    s: P(tr.scale ?? 100, ctx, {mul: L.raw ? S : 1, tol: 0.02}),
    r: P(tr.rot ?? 0, ctx, {tol: 0.02}),
    o: P(tr.op ?? 100, ctx, {clamp: [0, 100], tol: 0.15}),
  };
  if (L.fx) o.fx = L.fx.map((f) => (f.t === 'blur' ? {t: 'blur', v: P(f.v, ctx, {mul: S * 2, tol: 0.05})} : {t: 'glow', c: hex(f.color), o: f.op, soft: f.soft * S, dist: f.dist * S, dir: f.dir}));
  if (L.type === 'solid') o.color = hex(L.color);
  if (L.type === 'shape') o.c = serShapes(L.contents, ctx, k);
  if (L.type === 'text') {
    Object.assign(o, {text: L.text, font: L.font, size: r3(L.size * S), color: hex(L.color), tracking: Math.round(L.ls * 1000)});
    if (L.colorKeys) o.colorKeys = L.colorKeys.map(([t, c]) => [r3(t), hex(c)]);
    if (L.decode) {
      const d = L.decode;
      o.decode = {t0: d.t0, st: d.stagger, d: d.dur, n: [...L.text].length};
      if (d.color.toUpperCase() !== L.color.toUpperCase()) o.decode.c = hex(d.color);
    }
    if (L.appear) o.appear = P(L.appear, ctx);
    if (L.sourceExpr) o.srcx = L.sourceExpr;
  }
  if (L.type === 'comp') { o.ref = L.ref; }
  if (L.type === 'audio') { Object.assign(o, {file: L.file, start: L.start, db: L.db}, L.sfx ? {sfx: 1} : {}); }
  return o;
}
function serShapes(items, ctx, k) {
  return items.map((it) => {
    const nm = it.nm;
    switch (it.ty) {
      case 'gr': return {ty: 'gr', nm, it: serShapes(it.it, ctx, k), tr: it.tr && {
        a: P(it.tr.anchor, ctx, {mul: k}), p: P(it.tr.pos, ctx, {mul: k}), s: P(it.tr.scale, ctx, {tol: 0.02}), r: P(it.tr.rot, ctx, {tol: 0.02}), o: P(it.tr.op, ctx, {clamp: [0, 100], tol: 0.15})}};
      case 'rect': return {ty: 'rect', nm, s: P(it.size, ctx, {mul: k}), p: P(it.pos, ctx, {mul: k}), r: P(it.r, ctx, {mul: k})};
      case 'el': return {ty: 'el', nm, s: P(it.size, ctx, {mul: k}), p: P(it.pos, ctx, {mul: k})};
      case 'sh': return it.x ? {ty: 'sh', nm, x: it.x} : {ty: 'sh', nm, v: it.path.v.map((q) => q.map((x) => r3(x * k))), i: it.path.i.map((q) => q.map((x) => r3(x * k))), o: it.path.o.map((q) => q.map((x) => r3(x * k))), c: it.path.c ? 1 : 0};
      case 'fl': return {ty: 'fl', c: P(it.color, ctx, {color: true}), o: P(it.op, ctx, {clamp: [0, 100]}), rule: it.rule};
      case 'st': return {ty: 'st', c: P(it.color, ctx, {color: true}), o: P(it.op ?? 100, ctx, {clamp: [0, 100]}), w: P(it.w, ctx, {mul: k, tol: 0.02}), cap: it.cap, join: it.join,
        dash: it.dash && it.dash.map((x) => r3(x * k)), doff: P(it.doff, ctx, {mul: k})};
      case 'tm': return {ty: 'tm', s: P(it.s, ctx, {tol: 0.05}), e: P(it.e, ctx, {tol: 0.05}), o: P(it.o, ctx), m: it.m};
      case 'rp': return {ty: 'rp', n: it.n, p: P(it.pos, ctx, {mul: k})};
    }
    throw new Error('forme inconnue ' + it.ty);
  });
}

// ─────────── Composition principale ───────────
function buildMain(name, audio) {
  const scenes = comps.filter((c) => c.name.startsWith('S'));
  CUR = {name, range: [0, NF - 1], layers: [], main: true};
  lay({type: 'solid', name: 'Fond noir', color: C.noir});
  scenes.forEach((c) => lay({type: 'comp', name: c.name, ref: c.name, vis: (t) => { const f = Math.round(t * FPS); return f >= c.range[0] && f <= c.range[1]; }}));
  const light = (t) => (t >= E.tout && t < E.blanc) || (t >= E.orange && t < E.outro);
  lay({type: 'comp', name: 'HUD sombre', ref: 'HUD sombre', tr: {op: {hold: (t) => (light(t) ? 0 : 100)}}});
  lay({type: 'comp', name: 'HUD clair', ref: 'HUD clair', tr: {op: {hold: (t) => (light(t) ? 100 : 0)}}});
  (audio || []).forEach((a) => lay({type: 'audio', ...a}));
  comps.push(CUR);
}

async function run() {
  // Les deux passes : la 1re collecte les textes à mesurer, la 2e utilise les vraies largeurs
  let cues = null;
  try { cues = JSON.parse(fs.readFileSync(path.join(HERE, 'sons.json'), 'utf8')); } catch (e) { /* pas encore de plan son */ }
  for (const FORMAT of FORMAT_LIST) {
    v = FORMAT === '9x16';
    W = v ? 1080 : 1920;
    H = v ? 1920 : 1080;
    for (let pass = 0; pass < 2; pass++) {
      comps = [];
      buildScenes();
      buildHud(false);
      buildHud(true);
      if (pending.length) { await measureAll(); continue; }
      break;
    }
    const mainName = 'CyberSpace ' + FORMAT.replace('x', ':');
    buildMain(mainName, cues && cues.layers);
    const data = {format: FORMAT, w: W * S, h: H * S, fps: FPS, dur: DUR, main: mainName,
      comps: comps.map((cm) => ({name: cm.name, main: cm.main ? 1 : 0, layers: cm.layers.map((L) => serLayer(L, cm)).filter(Boolean)}))};
    let json = JSON.stringify(data);
    json = json.replace(/[\u007f-￿]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
    const out = path.join(HERE, `data-${FORMAT}.js`);
    fs.writeFileSync(out, '// Généré par gen.mjs, ne pas modifier à la main.\nvar DATA = ' + json + ';\n');
    let nk = 0;
    json.replace(/"k":\[/g, () => nk++);
    console.log(`${FORMAT} : ${data.comps.length} compositions, ${data.comps.reduce((a, c) => a + c.layers.length, 0)} calques, ${nk} propriétés animées, ${(json.length / 1024).toFixed(0)} Ko → ${path.relative(ROOT, out)}`);
  }
}
run();
