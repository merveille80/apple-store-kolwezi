// Génère data-9x16.js et data-16x9.js pour AirPods-AE.jsx : mêmes positions, tailles
// et courbes d'animation que scene.js (typographie, logo, fondu du fond gris),
// échantillonnées en images clés linéaires à 60 i/s.
//   node after-effects/gen.mjs [dossier_sortie]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APPLE_PATH } from '../apple-logo.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.argv[2] || HERE;
const FPS = 60;
const B = { A: 0, B: 1.4, C: 1.9, D: 2.4, E: 3.8, F: 4.4, G: 5.8, H: 7.0, I: 8.8, J: 10.0, END: 11.1 };

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eout = (x) => 1 - Math.pow(1 - x, 3);
const eexpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const r4 = (x) => Math.round(x * 1e4) / 1e4;

// flou CSS (écart type en px) → « Flou gaussien » d'After Effects
const BLUR_AE = 2.0;

// échantillonne f(t) sur [t0, t1] à 60 i/s ; supprime les clés redondantes
function keys(f, t0, t1) {
  const k = [];
  const n0 = Math.round(t0 * FPS), n1 = Math.round(t1 * FPS);
  for (let n = n0; n <= n1; n++) {
    const t = n / FPS;
    const v = f(t);
    k.push([r4(t), Array.isArray(v) ? v.map(r4) : r4(v)]);
  }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const out = [];
  for (let i = 0; i < k.length; i++) {
    if (i > 0 && i < k.length - 1 && same(k[i - 1][1], k[i][1]) && same(k[i][1], k[i + 1][1])) continue;
    out.push(k[i]);
  }
  if (out.every((x) => same(x[1], out[0][1]))) return { v: out[0][1] };
  return { k: out };
}

function blurIn(t, t0, dur, dist, M) {
  const k = eexpo(prog(t, t0, t0 + dur));
  return { opacity: clamp(k * 1.4), blur: (1 - k) * M * 0.02, dy: (1 - k) * M * dist };
}

// ---------- logo Apple : chemin SVG → formes AE ----------
function svgToShapes(d) {
  const tok = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g);
  let i = 0, cmd = '', x = 0, y = 0;
  const shapes = [];
  let cur = null;
  const num = () => parseFloat(tok[i++]);
  while (i < tok.length) {
    if (/[a-zA-Z]/.test(tok[i])) cmd = tok[i++];
    if (cmd === 'M' || cmd === 'm') {
      const nx = num(), ny = num();
      x = cmd === 'm' ? x + nx : nx; y = cmd === 'm' ? y + ny : ny;
      cur = { v: [[x, y]], i: [[0, 0]], o: [[0, 0]], c: true };
      shapes.push(cur);
      cmd = cmd === 'm' ? 'l' : 'L';
    } else if (cmd === 'c' || cmd === 'C') {
      const rel = cmd === 'c';
      const p = [num(), num(), num(), num(), num(), num()];
      const c1 = rel ? [x + p[0], y + p[1]] : [p[0], p[1]];
      const c2 = rel ? [x + p[2], y + p[3]] : [p[2], p[3]];
      const e = rel ? [x + p[4], y + p[5]] : [p[4], p[5]];
      const last = cur.v.length - 1;
      cur.o[last] = [c1[0] - cur.v[last][0], c1[1] - cur.v[last][1]];
      cur.v.push(e); cur.i.push([c2[0] - e[0], c2[1] - e[1]]); cur.o.push([0, 0]);
      x = e[0]; y = e[1];
    } else if (cmd === 'l' || cmd === 'L') {
      const nx = num(), ny = num();
      x = cmd === 'l' ? x + nx : nx; y = cmd === 'l' ? y + ny : ny;
      cur.v.push([x, y]); cur.i.push([0, 0]); cur.o.push([0, 0]);
    } else if (cmd === 'z' || cmd === 'Z') {
      i += 0; cmd = '';
      // fermeture : si le dernier point = le premier, on fusionne
      const n = cur.v.length - 1;
      if (Math.hypot(cur.v[n][0] - cur.v[0][0], cur.v[n][1] - cur.v[0][1]) < 1e-3) {
        cur.i[0] = cur.i[n]; cur.v.pop(); cur.i.pop(); cur.o.pop();
      }
    } else { i++; }
  }
  for (const s of shapes) { // centre (repère 24×24 du SVG → centré sur 0)
    s.v = s.v.map(([a, b]) => [r4(a - 12), r4(b - 12)]);
    s.i = s.i.map((p) => p.map(r4)); s.o = s.o.map((p) => p.map(r4));
  }
  return shapes;
}

function build(W, H) {
  const P = W / H < 1, M = Math.min(W, H);
  const INK = [29 / 255, 29 / 255, 31 / 255];
  const texts = [];

  // A : « All new » + « AirPods Pro 3 » (respiration sur la grosse caisse, 128 BPM)
  const beat = 60 / 128;
  const breathe = (t) => 1 + 0.012 * Math.exp(-((t % beat) / beat) * 5);
  const out = (t) => 1 - prog(t, B.B - 0.12, B.B);
  for (const [name, text, weight, size, y, t0, dur, dist] of [
    ['Titre · All new', 'All new', 500, M * 0.05, H / 2 - M * 0.085, 0.05, 0.4, 0.025],
    ['Titre · AirPods Pro 3', 'AirPods Pro 3', 700, M * 0.125, H / 2, 0.15, 0.45, 0.035],
  ]) {
    texts.push({
      name, text, weight, size: r4(size), color: INK, align: 'center', x: W / 2, y: r4(y), in: 0, out: B.B,
      o: keys((t) => blurIn(t, t0, dur, dist, M).opacity * out(t) * 100, 0, B.B),
      blur: keys((t) => blurIn(t, t0, dur, dist, M).blur * BLUR_AE, 0, B.B),
      dy: keys((t) => blurIn(t, t0, dur, dist, M).dy, 0, B.B),
      s: keys((t) => breathe(t) * 100, 0, B.B),
    });
  }

  // E : « Rebuilt from the ground up », mot par mot ; « up » monte avec un flou vertical
  const words = ['Rebuilt', 'from', 'the', 'ground', 'up'];
  const eSize = P ? M * 0.105 : M * 0.085;
  const phrase = {
    name: 'Rebuilt from the ground up', size: r4(eSize), weight: 700, color: INK, in: B.E, out: B.F,
    lines: P ? [[0, 1], [2, 3, 4]] : [[0, 1, 2, 3, 4]], lineHeight: 1.04, x: W / 2, y: H / 2,
    words: words.map((w, i) => {
      const t0 = B.E + 0.02 + i * 0.07;
      if (i < 4) {
        const k = (t) => eexpo(prog(t, t0, t0 + 0.22));
        return {
          text: w,
          o: keys((t) => clamp(k(t) * 1.5) * 100, B.E, B.F),
          blur: keys((t) => (1 - k(t)) * M * 0.012 * BLUR_AE, B.E, B.F),
          dy: keys((t) => (1 - k(t)) * M * 0.03, B.E, B.F),
        };
      }
      const k = (t) => eexpo(prog(t, t0 + 0.05, t0 + 0.4));
      return {
        text: w, vblur: true,
        o: keys((t) => clamp(k(t) * 1.6) * 100, B.E, B.F),
        blur: keys((t) => ((1 - k(t)) * M * 0.02 + 0.6) * BLUR_AE, B.E, B.F),
        dy: keys((t) => (1 - k(t)) * M * 0.12, B.E, B.F),
        sy: keys((t) => (1 + (1 - k(t)) * 0.5) * 100, B.E, B.F),
      };
    }),
  };

  // G : « Fit, finally figured out. »
  {
    const k = (t) => blurIn(t, B.G + 0.2, 0.4, 0.02, M);
    const o = (t) => 1 - prog(t, B.H - 0.08, B.H);
    texts.push({
      name: 'Fit, finally figured out.', text: 'Fit, finally figured out.', weight: 700, color: INK, align: 'right',
      size: r4(P ? M * 0.068 : M * 0.06), x: r4(P ? W * 0.92 : W * 0.93), y: r4(P ? H * 0.7 : H * 0.84), in: B.G, out: B.H,
      o: keys((t) => k(t).opacity * o(t) * 100, B.G, B.H),
      blur: keys((t) => k(t).blur * BLUR_AE, B.G, B.H),
      dy: keys((t) => k(t).dy, B.G, B.H),
    });
  }

  // H : « Touch » puis « control » (glissé depuis la gauche)
  const touch = {
    size: r4(P ? M * 0.074 : M * 0.08), x: r4(P ? W * 0.93 : W * 0.9), y: r4(H * 0.5), in: B.H, out: B.I, color: INK, weight: 700,
    o: keys((t) => blurIn(t, B.H + 0.3, 0.35, 0, M).opacity * (1 - prog(t, B.I - 0.08, B.I)) * 100, B.H, B.I),
    blur: keys((t) => blurIn(t, B.H + 0.3, 0.35, 0, M).blur * BLUR_AE, B.H, B.I),
    control: {
      o: keys((t) => clamp(eexpo(prog(t, B.H + 0.75, B.H + 1.1)) * 1.4) * 100, B.H, B.I),
      blur: keys((t) => (1 - eexpo(prog(t, B.H + 0.75, B.H + 1.1))) * M * 0.018 * BLUR_AE, B.H, B.I),
      dx: keys((t) => (1 - eexpo(prog(t, B.H + 0.75, B.H + 1.1))) * -M * 0.05, B.H, B.I),
    },
  };

  // J : logo + mention légale
  const kL = (t) => eout(prog(t, B.J + 0.05, B.J + 0.4));
  const logo = {
    size: r4(M * (P ? 0.16 : 0.13)), x: W / 2, y: r4(H / 2 - M * 0.02), in: B.J, out: B.END,
    shapes: svgToShapes(APPLE_PATH),
    o: keys((t) => kL(t) * 100, B.J, B.J + 0.5),
    s: keys((t) => lerp(0.94, 1, kL(t)) * 100, B.J, B.J + 0.5),
    blur: keys((t) => (1 - kL(t)) * 6 * BLUR_AE, B.J, B.J + 0.5),
  };
  const disc = {
    name: 'Mention légale', weight: 400, color: [1, 1, 1], opacity: 78, align: 'center',
    lines: ['This spec ad is not commissioned by Apple and is in no way associated with Apple.', 'Spec ad by @Dgit'],
    size: r4(M * (P ? 0.024 : 0.021)), lineHeight: 1.45, x: W / 2, y: r4(P ? H * 0.75 : H * 0.86), in: B.J, out: B.END,
    o: keys((t) => eout(prog(t, B.J + 0.15, B.J + 0.5)) * 78, B.J, B.J + 0.6),
  };

  // fond gris : fondu entrant pendant D (comme scene.js)
  const gray = { color: [232 / 255, 232 / 255, 237 / 255], in: B.D, out: B.J,
    o: keys((t) => eio(prog(t, B.D + 0.1, B.D + 0.55)) * 100, B.D, B.D + 0.6) };

  return { w: W, h: H, fps: FPS, dur: B.END, beats: B, texts, phrase, touch, logo, disc, gray,
    fonts: { 400: 'HelveticaNeue', 500: 'HelveticaNeue-Medium', 700: 'HelveticaNeue-Bold' } };
}

for (const [fmt, W, H] of [['9x16', 2160, 3840], ['16x9', 3840, 2160]]) {
  const d = build(W, H);
  d.main = `AirPods Pro 3 ${fmt.replace('x', ':')}`;
  fs.writeFileSync(path.join(OUT, `data-${fmt}.js`), '// généré par gen.mjs — ne pas éditer\nDATA = ' + JSON.stringify(d) + ';\n');
  console.log('écrit', path.join(OUT, `data-${fmt}.js`));
}
