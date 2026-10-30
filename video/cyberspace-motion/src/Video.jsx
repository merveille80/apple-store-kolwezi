import React from 'react';
import {AbsoluteFill, Audio, interpolate, Easing, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {MARK} from './mark';
import {WORD} from './word';

// CyberSpace SARL · « Construis ton prochain projet »
// Chaque animation est calée sur un coup de la piste fournie (Cyberspace-sound.mp3, ~140 BPM).
// Les instants E.* sont ceux mesurés dans la piste (attaques), au centième de seconde.
export const DURATION = 19.6;

export const E = {
  // 1 · Accroche (fond noir)
  construis: 0.05, ton: 0.42, morph: 1.0, hit1: 1.79, logo: 2.36, projet: 2.44, outTxt: 3.51, cube: 3.8, cubeFill: 4.16,
  // 2 · Idée / digital (la boîte blanche s'ouvre en 3 temps sur le drop)
  open1: 4.37, open2: 4.69, open3: 5.02, idee: 5.06, cubePop: 5.25, digital: 5.46,
  // 3 · Services connectés
  cercles: 6.44, pills: [6.76, 6.97, 7.19, 7.41, 7.62, 7.83], trame: 7.83,
  // 4 · Typo mono
  tout: 8.15, enun: 8.68, endroit: 9.45, blocs: 10.19, blanc: 10.63,
  // 5 · Flowchart
  node1: 10.84, trait: 11.05, n2: 11.49, n3: 11.94, n4: 12.14, au: 12.79, lanc: 13.05, fusee: 13.33, pan: 13.65,
  // 6 · Accompagnement
  pense: [14.3, 14.52, 14.74, 15.07], wipe: 15.39, orange: 15.6, on: 15.8, acc: 16.05, bout: 16.46,
  // 7 · Logo
  outro: 17.11, lock: 17.32, sous: 17.55, cta: 17.9,
};

const C = {papier: '#FAFAFA', noir: '#000000', blanc: '#FFFFFF', orange: '#FF5A00', peach: '#F5C4A0', grille: '#E8E8E8', fond: '#F2F2F2', beige: '#EDE6D9', encre: '#111111', gris: '#8A8A8A'};
const SANS = 'InterCS';
const MONO = 'JBMono';

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const easeIn = Easing.bezier(0.7, 0, 0.84, 0);
const io = Easing.bezier(0.76, 0, 0.24, 1);
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const lerp = (t, a, b, from, to, e = ease) => interpolate(t, [a, b], [from, to], {...cl, easing: e});
const between = (t, a, b) => t >= a && t < b;

// Ressort sec (petit dépassement puis stabilisation), la signature « snappy » de la référence
const pop = (t, t0, d = 0.32, over = 0.16) => {
  if (t <= t0) return 0;
  const x = (t - t0) / d;
  if (x >= 1.4) return 1;
  return 1 - Math.exp(-5.5 * x) * Math.cos(x * Math.PI * (0.5 + over * 4));
};

// Entrée douce : léger flou qui se dissipe pendant le pop (rendu plus « premium »)
const soft = (p, px = 10) => (p < 0.98 ? {filter: `blur(${(1 - Math.min(1, p)) * px}px)`} : {});

// Générateur pseudo-aléatoire stable
const rnd = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const Fonts = () => (
  <style>{`
  @font-face{font-family:${SANS};font-weight:400;src:url(${staticFile('Inter-Regular.otf')})}
  @font-face{font-family:${SANS};font-weight:500;src:url(${staticFile('Inter-Medium.otf')})}
  @font-face{font-family:${SANS};font-weight:600;src:url(${staticFile('Inter-SemiBold.otf')})}
  @font-face{font-family:${SANS};font-weight:700;src:url(${staticFile('Inter-Bold.otf')})}
  @font-face{font-family:${MONO};font-weight:500;src:url(${staticFile('jetbrains-mono-latin-500-normal.woff2')})}
  @font-face{font-family:${MONO};font-weight:700;src:url(${staticFile('jetbrains-mono-latin-700-normal.woff2')})}
  @font-face{font-family:${MONO};font-weight:800;src:url(${staticFile('jetbrains-mono-latin-800-normal.woff2')})}`}</style>
);

const Txt = ({children, size, w = 500, color = C.encre, ls = -0.02, font = SANS, style}) => (
  <div style={{fontFamily: font, fontSize: size, fontWeight: w, color, letterSpacing: `${ls}em`, whiteSpace: 'pre', lineHeight: 1.15, ...style}}>{children}</div>
);

// Logo : 3 pièces vectorisées depuis le PNG fourni (0 = S, 1 = éclat du C, 2 = arc du C)
const PIECES = MARK.d.split('Z').filter(Boolean).map((p) => {
  const n = p.match(/-?[\d.]+/g).map(Number);
  const xs = n.filter((_, j) => j % 2 === 0), ys = n.filter((_, j) => j % 2 === 1);
  const b = {x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys)};
  return {d: p + 'Z', cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, w: b.x1 - b.x0, h: b.y1 - b.y0};
});

const Mark = ({h, color = C.noir, pieces = [{}, {}, {}], stroke, sw = 2}) => (
  <svg viewBox={`-20 -20 ${MARK.w + 40} ${MARK.h + 40}`} style={{height: h, width: (h * (MARK.w + 40)) / (MARK.h + 40), overflow: 'visible', display: 'block'}}>
    {PIECES.map((p, i) => {
      const o = pieces[i] || {};
      return (
        <path key={i} d={p.d} fillRule="evenodd" fill={o.fill ?? (stroke ? 'none' : color)} stroke={stroke} strokeWidth={stroke ? sw : 0} vectorEffect="non-scaling-stroke"
          opacity={o.op ?? 1} style={{transformBox: 'fill-box', transformOrigin: 'center', transform: `translate(${o.x || 0}px, ${o.y || 0}px) rotate(${o.r || 0}deg) scale(${o.s ?? 1})`}} />
      );
    })}
  </svg>
);

const Wordmark = ({h, color = C.encre}) => (
  <svg viewBox={`0 0 ${WORD.w} ${WORD.h}`} style={{height: h, width: (h * WORD.w) / WORD.h, display: 'block'}}>
    <path d={WORD.d} fillRule="evenodd" fill={color} />
  </svg>
);

// Cube isométrique (trait)
const Cube = ({s, color = C.encre, sw = 1.6, fill = 'none', top}) => (
  <svg viewBox="-12 -12 24 24" style={{width: s, height: s, display: 'block', overflow: 'visible'}}>
    <path d="M0,-10 L8.66,-5 L8.66,5 L0,10 L-8.66,5 L-8.66,-5 Z" fill={fill} stroke={color} strokeWidth={sw} strokeLinejoin="round" />
    {top && <path d="M0,-10 L8.66,-5 L0,0 L-8.66,-5 Z" fill={top} />}
    <path d="M-8.66,-5 L0,0 L8.66,-5 M0,0 L0,10" fill="none" stroke={fill !== 'none' ? '#d8d8d8' : color} strokeWidth={sw} strokeLinejoin="round" />
  </svg>
);

// Icônes des services (traits blancs)
const ICONS = {
  Web: <><circle cx="12" cy="12" r="7.5" /><path d="M4.5 12h15M12 4.5c2.6 2.4 2.6 12.6 0 15M12 4.5c-2.6 2.4-2.6 12.6 0 15" /></>,
  App: <><rect x="7.5" y="3.8" width="9" height="16.4" rx="2.2" /><path d="M10.8 17.2h2.4" /></>,
  Cloud: <path d="M7.6 17.5h9.2a3.6 3.6 0 0 0 .4-7.2 5.2 5.2 0 0 0-10-1.1A4.2 4.2 0 0 0 7.6 17.5z" />,
  SEO: <><circle cx="10.5" cy="10.5" r="5.5" /><path d="M14.6 14.6l4.8 4.8" /></>,
  Design: <><path d="M5 19l3.2-.8L18.4 8a2 2 0 0 0-2.8-2.8L5.4 15.4z" /><path d="M14.2 6.6l2.8 2.8" /></>,
  Support: <><path d="M5.5 13v-1a6.5 6.5 0 0 1 13 0v1" /><rect x="4.5" y="12.5" width="3.4" height="5" rx="1.2" /><rect x="16.1" y="12.5" width="3.4" height="5" rx="1.2" /></>,
};
const Icon = ({name, s, color = '#fff', sw = 1.8}) => (
  <svg viewBox="0 0 24 24" style={{width: s, height: s, display: 'block'}} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{ICONS[name]}</svg>
);

const Rocket = ({s, color = C.encre}) => (
  <svg viewBox="0 0 24 24" style={{width: s, height: s, display: 'inline-block'}} fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3c3 2.2 4.4 5.6 4 10l-2 3h-4l-2-3c-.4-4.4 1-7.8 4-10z" /><circle cx="12" cy="9.5" r="1.6" />
    <path d="M8.2 12.5L6 15.5l2.6.4M15.8 12.5l2.2 3-2.6.4M10.6 18.6c.2 1.2.7 2 1.4 2.4.7-.4 1.2-1.2 1.4-2.4" />
  </svg>
);

// Police pixel 5×7 pour les « fantômes » orange de la séquence mono
const PIX = {
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  N: ['10001', '11001', '10101', '10101', '10011', '10001', '10001'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
};
const PixelWord = ({word, px, color = C.orange, reveal = 1}) => {
  const cells = [];
  [...word].forEach((ch, k) => (PIX[ch] || []).forEach((row, y) => [...row].forEach((b, x) => {
    if (b === '1') cells.push({x: k * 6 + x, y});
  })));
  return (
    <div style={{position: 'relative', width: (word.length * 6 - 1) * px, height: 7 * px}}>
      {cells.map((c, i) => (rnd(i + word.length * 31) < reveal ? <div key={i} style={{position: 'absolute', left: c.x * px, top: c.y * px, width: px, height: px, background: color}} /> : null))}
    </div>
  );
};

// Petits libellés de marque dans les coins (scènes sombres, comme la référence)
const Corners = ({W, H, color = 'rgba(255,255,255,.55)', op = 1}) => (
  <>
    <Txt size={20} w={500} color={color} ls={0.01} style={{position: 'absolute', left: 44, top: 44, opacity: op}}>CyberSpace</Txt>
    <Txt size={20} w={400} color={color} ls={0.01} style={{position: 'absolute', right: 44, bottom: 44, opacity: op}}>solutions digitales</Txt>
  </>
);

const Grid = ({W, H, step, color = C.grille, ox = 0, oy = 0, dots}) => {
  const lines = [];
  for (let x = ((ox % step) + step) % step; x < W; x += step) lines.push(<line key={'x' + x} x1={x} y1={0} x2={x} y2={H} />);
  for (let y = ((oy % step) + step) % step; y < H; y += step) lines.push(<line key={'y' + y} x1={0} y1={y} x2={W} y2={y} />);
  return <svg width={W} height={H} style={{position: 'absolute', inset: 0}} stroke={color} strokeWidth={1.4}>{lines}</svg>;
};

// ───────────────────────── 1 · Accroche ─────────────────────────
const S1 = ({t, W, H, v}) => {
  const cx = W / 2, cy = H / 2;
  const size = v ? 96 : 76;
  // « Construis » : flash orange puis blanc (comme « Build » dans la référence)
  const cIn = pop(t, E.construis, 0.28);
  const cColor = t < E.construis + 0.13 ? C.orange : C.encre;
  // « Construis » se replie quand le logo apparaît ; « prochain projet » se déplie
  const cW = lerp(t, E.logo - 0.08, E.logo + 0.22, 1, 0, io);
  const pW = lerp(t, E.projet - 0.02, E.projet + 0.36, 0, 1, ease);
  const slot = size * 1.45; // case qui contient « ton », puis les formes, puis le logo
  const gap = size * 0.28;
  // Sortie du texte sur le coup de 3,51 s : le texte se replie, le logo se recentre
  const pOut = lerp(t, E.outTxt, E.outTxt + 0.24, 0, 1, io);

  // « ton » : lettres blanches puis cassées en formes pêche
  const tonIn = pop(t, E.ton, 0.26);
  const toShapes = t >= E.morph;
  const m = lerp(t, E.morph, E.morph + 0.22, 0, 1); // lettres → formes
  const swap = lerp(t, E.hit1 - 0.05, E.hit1 + 0.18, 0, 1, io); // formes qui s'échangent sur le coup
  const gather = lerp(t, E.logo - 0.3, E.logo, 0, 1, easeIn); // formes qui se rassemblent en logo
  const showMark = t >= E.logo;
  const lk = pop(t, E.logo, 0.3, 0.25);

  // Logo → cube : le logo tourne et rétrécit, le cube orange se dessine
  const toCube = lerp(t, E.cube - 0.1, E.cube + 0.12, 0, 1, easeIn);
  const cubeIn = pop(t, E.cube, 0.3, 0.2);
  const filled = t >= E.cubeFill;

  const shapes = [
    // t : barre verticale + traverse ; o : disque ; n : arche
    {kind: 'bar', x: -slot * 0.3, y: 0, w: size * 0.16, h: size * 0.72},
    {kind: 'disc', x: 0, y: size * 0.1, w: size * 0.5, h: size * 0.5},
    {kind: 'arch', x: slot * 0.32, y: size * 0.1, w: size * 0.46, h: size * 0.5},
  ];
  // Positions « éclatées » (entre le morph et le coup 1,79 s), puis échangées
  const burst = [
    {x: -slot * 0.5, y: -size * 0.3, r: -18, sx: 2.6, sy: 0.7},
    {x: slot * 0.1, y: size * 0.28, r: 0, sx: 1.9, sy: 1.9},
    {x: slot * 0.62, y: -size * 0.26, r: 90, sx: 1.9, sy: 1.9},
  ];
  const burst2 = [
    {x: slot * 0.5, y: size * 0.3, r: 0, sx: 3.4, sy: 0.5},
    {x: -slot * 0.46, y: -size * 0.16, r: 0, sx: 1.5, sy: 1.5},
    {x: slot * 0.04, y: -size * 0.3, r: 180, sx: 1.8, sy: 1.8},
  ];
  const markH = size * 1.0;

  return (
    <AbsoluteFill style={{background: C.papier}}>
      <Grid W={W} H={H} step={v ? 180 : 160} ox={W / 2 % (v ? 180 : 160)} oy={H / 2 % (v ? 180 : 160)} color="#EFEFEF" />
      <AbsoluteFill style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{display: 'flex', alignItems: 'center', transform: `translateY(${-size * 0.04}px)`}}>
          {/* Construis */}
          <div style={{width: cW * size * 4.6, overflow: 'hidden', display: 'flex', justifyContent: 'flex-end'}}>
            <Txt size={size} w={500} color={cColor} style={{...soft(cIn, 14), transform: `scale(${0.82 + 0.18 * cIn})`, opacity: t >= E.construis ? 1 : 0, paddingRight: gap}}>Construis</Txt>
          </div>
          {/* Case : ton → formes → logo → cube */}
          <div style={{width: lerp(t, E.outTxt, E.outTxt + 0.24, slot, slot * 1.1, io), height: size * 1.2, position: 'relative', flexShrink: 0}}>
            {!toShapes && t >= E.ton && (
              <Txt size={size} w={500} color={C.encre} style={{...soft(tonIn, 12), position: 'absolute', left: 0, top: '50%', transform: `translateY(-55%) scale(${0.8 + 0.2 * tonIn})`, transformOrigin: 'left center'}}>ton</Txt>
            )}
            {toShapes && !showMark && shapes.map((s, i) => {
              const b1 = burst[i], b2 = burst2[i];
              const bx = b1.x + (b2.x - b1.x) * swap, by = b1.y + (b2.y - b1.y) * swap;
              const br = b1.r + (b2.r - b1.r) * swap, bsx = b1.sx + (b2.sx - b1.sx) * swap, bsy = b1.sy + (b2.sy - b1.sy) * swap;
              const x0 = s.x + (bx - s.x) * m, y0 = s.y + (by - s.y) * m;
              // Vers la pièce du logo correspondante
              const piece = PIECES[[1, 2, 0][i]];
              const k = markH / MARK.h;
              const tx = (piece.cx - MARK.w / 2) * k, ty = (piece.cy - MARK.h / 2) * k;
              const x = x0 + (tx - x0) * gather, y = y0 + (ty - y0) * gather;
              const sx = (1 + (bsx - 1) * m) * (1 - gather * 0.65), sy = (1 + (bsy - 1) * m) * (1 - gather * 0.65);
              const r = br * m * (1 - gather);
              const color = m < 0.5 ? C.encre : gather > 0.6 ? C.noir : gather > 0.2 ? C.orange : C.peach;
              const common = {position: 'absolute', left: slot / 2 + x - s.w / 2, top: size * 0.6 + y - s.h / 2, width: s.w, height: s.h, transform: `rotate(${r}deg) scale(${sx}, ${sy})`};
              if (s.kind === 'bar') return <div key={i} style={{...common, background: color, borderRadius: 2}} />;
              if (s.kind === 'disc') return <div key={i} style={{...common, background: color, borderRadius: '50%'}} />;
              return <div key={i} style={{...common, border: `${s.w * 0.24}px solid ${color}`, borderBottom: 'none', borderRadius: `${s.w}px ${s.w}px 0 0`, boxSizing: 'border-box'}} />;
            })}
            {showMark && t < E.cube + 0.12 && (
              <div style={{position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%,-50%) rotate(${toCube * 120}deg) scale(${(0.7 + 0.3 * lk) * (1 - toCube)})`}}>
                <Mark h={markH} pieces={[{s: 0.6 + 0.4 * pop(t, E.logo + 0.04, 0.3)}, {r: (1 - lk) * -40}, {}]} />
              </div>
            )}
            {t >= E.cube && (
              <div style={{position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%,-50%) scale(${cubeIn * (filled ? 1 + 0.12 * pop(t, E.cubeFill, 0.22) - 0.12 * (t > E.cubeFill + 0.05 ? 1 : 0) * pop(t, E.cubeFill + 0.05, 0.2) : 1)})`}}>
                <Cube s={size * 0.78} color={C.noir} sw={1.9} fill={filled ? C.noir : 'none'} top={filled ? '#3a3a3a' : undefined} />
              </div>
            )}
          </div>
          {/* prochain projet */}
          <div style={{width: pW * (1 - pOut) * size * 7.4, overflow: 'hidden'}}>
            <Txt size={size} w={500} color={C.encre} style={{...soft(pW, 12), paddingLeft: gap * 0.6, transform: `translateX(${(1 - pW) * -size * 0.6}px)`}}>prochain projet</Txt>
          </div>
        </div>
      </AbsoluteFill>
      <Corners W={W} H={H} color="rgba(0,0,0,.45)" op={lerp(t, 0.2, 0.6, 0, 1)} />
    </AbsoluteFill>
  );
};

// ───────────────── 2 · La boîte blanche s'ouvre : « Ton idée ⬡ Ton digital » ─────────────────
const S2 = ({t, W, H, v}) => {
  const cx = W / 2, cy = H / 2;
  // Ouverture en 3 temps sur le drop (4,37 · 4,69 · 5,02)
  const s1 = pop(t, E.open1, 0.24, 0.1), s2 = pop(t, E.open2, 0.26, 0.1), s3 = pop(t, E.open3, 0.3, 0.06);
  const bw = 90 + (v ? 520 : 760) * s1 + (v ? 470 : 1170) * s2 + 400 * s3;
  const bh = 90 + (v ? 200 : 180) * s1 + (v ? 300 : 120) * s2 + (H - 200) * s3;
  const cardW = v ? 940 : 1080, cardH = v ? 320 : 260;
  const size = v ? 60 : 54;
  const drift = (t - E.open3) * 14; // micro-parallaxe de la grille
  const a1 = pop(t, E.idee, 0.3), a2 = pop(t, E.cubePop, 0.32, 0.25), a3 = pop(t, E.digital, 0.3);
  // Carrés blancs des barres latérales (la boîte « tire » des petits carrés)
  const sq = (k) => pop(t, E.open1 + k * 0.08, 0.2);
  return (
    <AbsoluteFill style={{background: C.papier}}>
      <div style={{position: 'absolute', left: cx - bw / 2, top: cy - bh / 2, width: bw, height: bh, background: C.fond, overflow: 'hidden', outline: `${2 * (1 - s3)}px solid ${C.noir}`}}>
        <Grid W={bw} H={bh} step={v ? 180 : 160} ox={(bw / 2) % 180 + drift} oy={(bh / 2) % 180} color="#E4E4E4" />
        {/* carte centrale */}
        <div style={{position: 'absolute', left: bw / 2 - cardW / 2, top: bh / 2 - cardH / 2, width: cardW, height: cardH, background: C.blanc, outline: '1.4px solid #DCDCDC', opacity: s2}}>
          {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([i, j]) => (
            <div key={i + '' + j} style={{position: 'absolute', left: i * cardW - 4, top: j * cardH - 4, width: 8, height: 8, background: '#BDBDBD'}} />
          ))}
        </div>
        <div style={{position: 'absolute', left: bw / 2, top: bh / 2, transform: 'translate(-50%,-50%)', display: 'flex', alignItems: 'center', gap: size * 0.5}}>
          <Txt size={size} w={500} style={{...soft(a1), opacity: a1 > 0 ? 1 : 0, transform: `translateX(${(1 - a1) * 30}px)`}}>Ton idée</Txt>
          <div style={{transform: `scale(${a2}) rotate(${(1 - a2) * -60}deg)`}}><Cube s={size * 1.05} color={C.encre} sw={1.5} /></div>
          <Txt size={size} w={500} style={{...soft(a3), opacity: a3 > 0 ? 1 : 0, transform: `translateX(${(1 - a3) * -30}px)`}}>Ton digital</Txt>
        </div>
      </div>
      {/* barres noires latérales avec petits carrés blancs */}
      {[-1, 1].map((side) => (
        <div key={side} style={{position: 'absolute', top: 0, height: H, width: (W - bw) / 2 + 2, [side < 0 ? 'left' : 'right']: 0}}>
          {[0, 1, 2, 3, 4].map((k) => {
            const yy = cy + (k - 2) * (v ? 300 : 190);
            const s = sq(k) * (1 - lerp(t, E.open3, E.open3 + 0.25, 0, 1, io));
            return <div key={k} style={{position: 'absolute', [side < 0 ? 'right' : 'left']: 22 + (k % 2) * 30, top: yy - 16, width: 32, height: 32, background: C.noir, transform: `scale(${s})`}} />;
          })}
        </div>
      ))}
    </AbsoluteFill>
  );
};

// ───────────────── 3 · Cercles concentriques et services en orbite ─────────────────
const SERVICES = ['Web', 'App', 'Cloud', 'SEO', 'Design', 'Support'];
const S3 = ({t, W, H, v}) => {
  const cx = W / 2, cy = H / 2;
  const R = v ? [260, 430, 600] : [220, 340, 470];
  const rip = lerp(t, E.cercles, E.cercles + 0.6, 0, 1);
  const size = v ? 60 : 52;
  const orbit = (t - E.cercles) * 7; // degrés : rotation lente
  // Position de chaque service sur les orbites (angle de départ, rayon)
  const place = v
    ? [[-115, 1], [-65, 2], [-28, 2], [32, 2], [112, 1], [152, 2]]
    : [[-150, 1], [-70, 2], [-12, 1], [40, 2], [118, 1], [190, 2]];
  // Trame de points qui envahit l'écran depuis la droite (7,83 → 8,15)
  const tr = lerp(t, E.trame, E.tout, 0, 1, Easing.bezier(0.5, 0, 0.9, 0.6));
  const cell = v ? 60 : 54;
  const cols = Math.ceil(W / cell) + 1, rows = Math.ceil(H / cell) + 1;
  const dots = [];
  if (t >= E.trame) {
    for (let i = 0; i < cols; i++) {
      const fromRight = (cols - 1 - i) / cols; // 0 à droite
      const k = Math.max(0, Math.min(1, (tr * 1.6 - fromRight) * 2.4));
      if (k <= 0) continue;
      for (let j = 0; j < rows; j++) {
        const s = k * cell * (0.96 + 0.04 * rnd(i * 97 + j));
        dots.push(<div key={i + '-' + j} style={{position: 'absolute', left: i * cell + (cell - s) / 2, top: j * cell + (cell - s) / 2, width: s, height: s, background: C.noir}} />);
      }
    }
  }
  return (
    <AbsoluteFill style={{background: '#F7F7F8'}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {R.map((r, i) => {
          const rr = r * (0.82 + 0.18 * lerp(t, E.cercles + i * 0.06, E.cercles + i * 0.06 + 0.5, 0, 1));
          return <ellipse key={i} cx={cx} cy={cy} rx={rr * (v ? 0.62 : 1.25)} ry={rr * (v ? 1.2 : 0.82)} fill="none" stroke="#DCDCDF" strokeWidth={2.4} opacity={rip} />;
        })}
        {/* onde qui part du centre à chaque service */}
        {E.pills.map((p, i) => {
          const k = lerp(t, p, p + 0.7, 0, 1, Easing.out(Easing.quad));
          return t >= p ? <circle key={'w' + i} cx={cx} cy={cy} r={120 + k * 520} fill="none" stroke={C.peach} strokeWidth={2} opacity={(1 - k) * 0.5} /> : null;
        })}
      </svg>
      <div style={{position: 'absolute', left: cx, top: cy, transform: `translate(-50%,-50%) scale(${0.9 + 0.1 * pop(t, E.cercles, 0.3)})`}}>
        <Txt size={size} w={500} style={soft(pop(t, E.cercles, 0.3), 12)}>Chaque besoin, connecté</Txt>
      </div>
      {SERVICES.map((name, i) => {
        const [a0, ri] = place[i];
        const a = ((a0 + orbit) * Math.PI) / 180;
        const r = R[ri];
        const x = cx + Math.cos(a) * r * (v ? 0.62 : 1.25), y = cy + Math.sin(a) * r * (v ? 1.2 : 0.82);
        const p = pop(t, E.pills[i], 0.3, 0.3);
        const hl = i === 2; // une pastille pêche, comme la référence
        const ps = v ? 1.75 : 1.45;
        return (
          <div key={name} style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${p * ps})`, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px 8px 8px', borderRadius: 40, background: hl ? C.peach : C.blanc, boxShadow: '0 4px 14px rgba(0,0,0,.06)', outline: hl ? 'none' : '1.2px solid #E6E6E6'}}>
            <div style={{width: 36, height: 36, borderRadius: 18, background: hl ? C.orange : C.encre, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Icon name={name} s={22} /></div>
            <Txt size={22} w={500}>{name}</Txt>
          </div>
        );
      })}
      {dots}
    </AbsoluteFill>
  );
};

// ───────────────── 4 · Typo mono « Tout en un endroit » ─────────────────
const S4 = ({t, W, H, v}) => {
  const size = v ? 236 : 300;
  const adv = size * 0.6; // chasse fixe JetBrains Mono
  const words = [{s: 'Tout', t: E.tout}, {s: 'en un', t: E.enun}, {s: 'endroit', t: E.endroit}];
  // Position de chaque mot sur la ligne
  let col = 0;
  const lay = words.map((w) => {
    const o = {...w, col};
    col += w.s.length + 1;
    return o;
  });
  // Défilement : le dernier mot apparu reste dans le cadre (comme « workspace » dans la référence)
  const margin = v ? 36 : 120;
  const targetFor = (i) => {
    const w = lay[i];
    const end = (w.col + w.s.length) * adv;
    return Math.min(margin, W - margin - end);
  };
  let x = targetFor(0);
  for (let i = 1; i < lay.length; i++) x += (targetFor(i) - targetFor(i - 1)) * lerp(t, lay[i].t - 0.02, lay[i].t + 0.2, 0, 1, io);
  // Après « endroit », lente dérive continue jusqu'aux blocs
  x -= (t > E.endroit + 0.2 ? (t - E.endroit - 0.2) * (v ? 30 : 90) : 0);
  // Blocs blancs qui recouvrent (10,19 → 10,63), en 3 vagues sur les coups
  const bs = v ? 135 : 120;
  const cols = Math.ceil(W / bs), rows = Math.ceil(H / bs);
  const blocks = [];
  if (t >= E.blocs - 0.02) {
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const r = rnd(i * 31 + j * 7 + 3);
      const wave = r < 0.33 ? E.blocs : r < 0.7 ? 10.43 : E.blanc - 0.03;
      if (t >= wave) blocks.push(<div key={i + '-' + j} style={{position: 'absolute', left: i * bs, top: j * bs, width: bs + 1, height: bs + 1, background: C.blanc}} />);
    }
  }
  const ghost = [{w: 'TOUT', t: E.tout, x: v ? 0.52 : 0.62, y: v ? 0.68 : 0.72}, {w: 'EN', t: E.enun, x: v ? 0.12 : 0.2, y: v ? 0.27 : 0.12}, {w: 'ENDROIT', t: E.endroit, x: v ? 0.2 : 0.42, y: v ? 0.76 : 0.8}];
  return (
    <AbsoluteFill style={{background: C.noir, overflow: 'hidden'}}>
      {/* micro-grille de carrés en contour, coin gauche */}
      <div style={{position: 'absolute', left: 0, bottom: v ? 260 : 60, display: 'grid', gridTemplateColumns: 'repeat(3, 36px)', gap: 0, opacity: 0.8}}>
        {Array.from({length: 12}).map((_, i) => <div key={i} style={{width: 36, height: 36, outline: '1.2px solid rgba(255,255,255,.55)', transform: `scale(${pop(t, E.tout + (i % 4) * 0.05, 0.2)})`}} />)}
      </div>
      {ghost.map((g, i) => {
        const on = between(t, g.t, g.t + 0.32);
        return on ? (
          <div key={i} style={{position: 'absolute', left: W * g.x, top: H * g.y}}>
            <PixelWord word={g.w} px={v ? 16 : 14} reveal={lerp(t, g.t, g.t + 0.1, 0.3, 1, Easing.linear) * (1 - lerp(t, g.t + 0.22, g.t + 0.32, 0, 1, Easing.linear))} />
          </div>
        ) : null;
      })}
      <div style={{position: 'absolute', left: x, top: H / 2, transform: 'translateY(-52%)', display: 'flex'}}>
        {lay.map((w, i) => {
          const p = pop(t, w.t, 0.18, 0.12);
          return t >= w.t ? (
            <div key={i} style={{position: 'absolute', left: w.col * adv, fontFamily: MONO, fontSize: size, fontWeight: 500, color: C.blanc, whiteSpace: 'pre', lineHeight: 1, letterSpacing: 0, transform: `translateY(${(1 - p) * 40}px)`, transformOrigin: 'left bottom'}}>
              {/* frappe lettre par lettre, très rapide */}
              {w.s.slice(0, Math.max(1, Math.ceil(lerp(t, w.t, w.t + 0.03 * w.s.length, 1, w.s.length, Easing.linear))))}
            </div>
          ) : null;
        })}
      </div>
      <Corners W={W} H={H} />
      {blocks}
    </AbsoluteFill>
  );
};

// ───────────────── 5 · Flowchart « De la première idée → au lancement » ─────────────────
const S5 = ({t, W, H, v}) => {
  // Caméra : léger travelling puis panoramique vers la scène 6
  const panY = lerp(t, E.pan, E.pense[0] - 0.02, 0, v ? -H * 0.62 : -H * 0.7, io);
  const panX = lerp(t, E.pan, E.pense[0] - 0.02, 0, v ? -W * 0.18 : -W * 0.22, io);
  const drift = (t - E.blanc) * (v ? -10 : -14);
  const n1 = pop(t, E.node1, 0.3, 0.2);
  // Carré orange qui glisse puis se cale dans le coin du nœud (référence 11,0 s)
  const sq = lerp(t, E.node1 - 0.15, E.node1 + 0.25, 0, 1, io);
  const N1 = v ? {x: W * 0.5, y: H * 0.34} : {x: W * 0.5, y: H * 0.24};
  const nodeW = v ? 720 : 560, nodeH = v ? 140 : 104;
  const fs = v ? 52 : 40;
  // Trait : du bord haut vers le nœud, puis du nœud vers les étapes
  const steps = [{s: 'Brief', t: E.n2}, {s: 'Build', t: E.n3}, {s: 'Launch', t: E.n4}];
  const stepY = N1.y + (v ? 380 : 240);
  const stepX = (i) => (v ? W * (0.2 + i * 0.3) : N1.x - 280 + i * 320);
  const draw1 = lerp(t, E.node1 - 0.1, E.node1 + 0.25, 0, 1, io);
  const draw2 = lerp(t, E.trait, E.n4, 0, 1, Easing.inOut(Easing.quad));
  const finY = stepY + (v ? 320 : 200);
  const draw3 = lerp(t, E.n4 + 0.1, E.au, 0, 1, io);
  // Chemins
  const p1 = `M ${N1.x - nodeW * 0.25} ${-40} L ${N1.x - nodeW * 0.25} ${N1.y - nodeH / 2 - 60} L ${N1.x + nodeW * 0.3} ${N1.y - nodeH / 2 - 60} L ${N1.x + nodeW * 0.3} ${N1.y - nodeH / 2}`;
  const p2 = `M ${N1.x} ${N1.y + nodeH / 2} L ${N1.x} ${stepY - 90} L ${stepX(0)} ${stepY - 90} L ${stepX(0)} ${stepY - 34} M ${stepX(0)} ${stepY - 90} L ${stepX(2)} ${stepY - 90} L ${stepX(2)} ${stepY - 34}`;
  const p3 = `M ${stepX(2)} ${stepY + 34} L ${stepX(2)} ${finY - 70} L ${N1.x - (v ? 150 : 100)} ${finY - 70} L ${N1.x - (v ? 150 : 100)} ${finY - 30}`;
  const fin = [{s: 'au', t: E.au}, {s: 'lancement', t: E.lanc}];
  return (
    <AbsoluteFill style={{background: '#F7F7F8', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${panX}px, ${panY + drift}px)`}}>
        <Grid W={W * 1.6} H={H * 2.2} step={v ? 120 : 110} color="#ECECEE" />
        <svg width={W * 1.6} height={H * 2.2} style={{position: 'absolute', inset: 0, overflow: 'visible'}} fill="none" stroke="#2A2A2A" strokeWidth={2}>
          <path d={p1} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw1} />
          <path d={p2} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw2} />
          <path d={p3} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw3} />
        </svg>
        {/* nœud principal pêche */}
        <div style={{position: 'absolute', left: N1.x, top: N1.y, transform: `translate(-50%,-50%) scale(${n1})`, width: nodeW, height: nodeH, background: C.peach, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Txt size={fs} w={500}>De la première idée</Txt>
          {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([i, j]) => <div key={i + '' + j} style={{position: 'absolute', left: i * nodeW - 4, top: j * nodeH - 4, width: 8, height: 8, background: C.orange}} />)}
        </div>
        <div style={{position: 'absolute', left: N1.x - nodeW / 2 - 70 + (1 - sq) * -W * 0.4, top: N1.y - nodeH / 2 - 70, width: 70, height: 70, background: C.orange, opacity: t >= E.node1 - 0.15 && t < E.n2 ? 1 : 0}} />
        {/* étapes */}
        {steps.map((s, i) => {
          const p = pop(t, s.t, 0.28, 0.25);
          return (
            <div key={s.s} style={{position: 'absolute', left: stepX(i), top: stepY, transform: `translate(-50%,-50%) scale(${p})`, padding: v ? '20px 30px' : '16px 28px', background: i === 2 ? C.orange : C.blanc, outline: i === 2 ? 'none' : '1.6px solid #2A2A2A', display: 'flex', alignItems: 'center', gap: 12}}>
              <div style={{width: 12, height: 12, background: i === 2 ? C.blanc : C.orange}} />
              <Txt size={v ? 40 : 34} w={600} font={MONO} ls={0} color={i === 2 ? C.blanc : C.encre}>{s.s}</Txt>
            </div>
          );
        })}
        {/* au lancement 🚀 */}
        <div style={{position: 'absolute', left: N1.x - (v ? 150 : 100), top: finY, transform: 'translate(-12%, 0)', display: 'flex', alignItems: 'center', gap: fs * 0.3}}>
          {fin.map((w) => {
            const p = pop(t, w.t, 0.26);
            return t >= w.t ? <Txt key={w.s} size={fs * 1.15} w={500} style={{...soft(p), transform: `translateY(${(1 - p) * 20}px)`, opacity: Math.min(1, p * 2)}}>{w.s}</Txt> : null;
          })}
          {t >= E.fusee && (
            <div style={{transform: `translate(${(1 - pop(t, E.fusee, 0.3)) * -30}px, ${(1 - pop(t, E.fusee, 0.3)) * 30}px) scale(${pop(t, E.fusee, 0.3, 0.3)})`}}><Rocket s={fs * 1.3} color={C.orange} /></div>
          )}
        </div>
        {/* 6a · « Pensé pour ton business » : plus bas sur la même feuille (panoramique) */}
        <div style={{position: 'absolute', left: W / 2 + (v ? W * 0.18 : W * 0.22), top: H / 2 + (v ? H * 0.62 : H * 0.7), transform: 'translate(-50%,-50%)', display: 'flex', gap: fs * 0.32}}>
          {['Pensé', 'pour', 'ton', 'business'].map((w, i) => {
            const p = pop(t, E.pense[i], 0.24);
            return t >= E.pense[i] ? <Txt key={w} size={v ? 74 : 64} w={500} color={i === 3 ? C.orange : C.encre} style={{...soft(p), transform: `translateY(${(1 - p) * 24}px)`, opacity: Math.min(1, p * 2)}}>{w}</Txt> : null;
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ───────────────── 6 · Volet orange : « On t'accompagne » ─────────────────
const S6 = ({t, W, H, v}) => {
  const size = v ? 104 : 96;
  const up = lerp(t, E.bout - 0.02, E.bout + 0.24, 0, 1, io);
  return (
    <AbsoluteFill style={{background: C.orange}}>
      <div style={{position: 'absolute', left: v ? 90 : 220, top: H * (v ? 0.5 : 0.52), transform: `translateY(${-50 - up * 60}%)`}}>
        <div style={{display: 'flex', gap: size * 0.26, opacity: 1 - up * 0.55}}>
          {[['On', E.on], ["t'accompagne", E.acc]].map(([w, t0]) => {
            const p = pop(t, t0, 0.26);
            return t >= t0 ? <Txt key={w} size={size} w={600} color={C.blanc} ls={-0.03} style={{...soft(p, 12), transform: `translateY(${(1 - p) * 30}px)`}}>{w}</Txt> : null;
          })}
        </div>
        {t >= E.bout && (
          <Txt size={size} w={600} color={C.blanc} ls={-0.03} style={{transform: `translateY(${(1 - pop(t, E.bout, 0.28)) * 60}px)`}}>jusqu'au bout.</Txt>
        )}
      </div>
      <Corners W={W} H={H} color="rgba(255,255,255,.75)" />
    </AbsoluteFill>
  );
};

// Volet géométrique orange (colonnes décalées qui montent), 15,39 → 15,6
const OrangeWipe = ({t, W, H}) => {
  const n = 6;
  return (
    <AbsoluteFill>
      {Array.from({length: n}).map((_, i) => {
        const p = lerp(t, E.wipe + i * 0.025, E.orange, 0, 1, Easing.bezier(0.7, 0, 0.3, 1));
        return <div key={i} style={{position: 'absolute', left: (i * W) / n - 1, width: W / n + 2, bottom: 0, height: H * p, background: C.orange}} />;
      })}
    </AbsoluteFill>
  );
};

// ───────────────── 7 · Plan beige : formes qui s'assemblent → logo ─────────────────
const S7 = ({t, W, H, v}) => {
  const cx = W / 2, cy = H * (v ? 0.45 : 0.44);
  const markH = v ? 330 : 260;
  const slide = lerp(t, E.outro, E.lock, 0, 1, Easing.bezier(0.5, 0, 0.1, 1));
  const lock = t >= E.lock;
  const kick = pop(t, E.lock, 0.3, 0.3);
  // Les trois pièces arrivent de directions différentes (contour), se verrouillent puis se remplissent
  const from = [{x: 900, y: -300, r: 90}, {x: -700, y: 500, r: -90}, {x: -500, y: -700, r: 45}];
  const pieces = from.map((f) => ({x: f.x * (1 - slide), y: f.y * (1 - slide), r: f.r * (1 - slide)}));
  const fill = lerp(t, E.lock, E.lock + 0.12, 0, 1, Easing.linear);
  const wIn = pop(t, E.lock + 0.08, 0.34, 0.15);
  const sIn = pop(t, E.sous, 0.3);
  const ctaIn = pop(t, E.cta, 0.3, 0.25);
  const ink = '#2B2621';
  const markW = (markH * (MARK.w + 40)) / (MARK.h + 40);
  const wordH = markH * 0.62;
  return (
    <AbsoluteFill style={{background: C.beige}}>
      {/* lignes de construction du plan */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}} stroke={ink} strokeWidth={1.2} opacity={0.22 * lerp(t, E.outro, E.outro + 0.2, 0, 1) * (1 - 0.6 * lerp(t, E.lock + 0.2, E.lock + 0.8, 0, 1))}>
        <line x1={0} y1={cy - markH / 2} x2={W} y2={cy - markH / 2} />
        <line x1={0} y1={cy + markH / 2} x2={W} y2={cy + markH / 2} />
        <line x1={cx} y1={0} x2={cx} y2={H} />
        <circle cx={cx} cy={cy} r={markH * 0.95} fill="none" />
        <rect x={cx - markH * 1.3} y={cy - markH * 0.95} width={markH * 2.6} height={markH * 1.9} fill="none" />
      </svg>
      <div style={{position: 'absolute', left: cx, top: cy, transform: `translate(-50%,-50%) scale(${lock ? 1 + 0.06 * (1 - kick) : 1})`, display: 'flex', flexDirection: v ? 'column' : 'row', alignItems: 'center', gap: v ? 40 : 56}}>
        <div style={{position: 'relative', width: markW, height: markH}}>
          <div style={{position: 'absolute', inset: 0}}><Mark h={markH} stroke={ink} sw={2} pieces={pieces.map((p) => ({...p, op: 1 - fill}))} /></div>
          <div style={{position: 'absolute', inset: 0, opacity: fill}}><Mark h={markH} color={C.noir} /></div>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: v ? 'center' : 'flex-start', gap: 18, opacity: lock ? 1 : 0}}>
          <div style={{transform: `translateY(${(1 - wIn) * 30}px)`, clipPath: `inset(0 ${(1 - wIn) * 100}% 0 0)`}}><Wordmark h={wordH} color={C.encre} /></div>
          <Txt size={v ? 34 : 28} w={500} ls={0.32} color={C.encre} style={{opacity: sIn > 0 ? 1 : 0, clipPath: `inset(0 ${(1 - Math.min(1, sIn)) * 100}% 0 0)`}}>SOLUTIONS DIGITALES</Txt>
        </div>
      </div>
      {/* site de l'entreprise, discret */}
      <div style={{position: 'absolute', left: cx, bottom: v ? 250 : 96, transform: 'translate(-50%,0)', display: 'flex', alignItems: 'center', gap: 18, opacity: ctaIn > 0 ? 1 : 0}}>
        <div style={{width: 60 * Math.min(1, ctaIn), height: 1.6, background: C.encre}} />
        <Txt size={v ? 32 : 26} w={500} font={MONO} ls={0.02} color={C.encre} style={{...soft(ctaIn, 8), transform: `translateY(${(1 - ctaIn) * 16}px)`}}>cyberspacesarl.com</Txt>
        <div style={{width: 60 * Math.min(1, ctaIn), height: 1.6, background: C.encre}} />
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── Montage ─────────────────────────
export const Video = ({vertical = true, audio = true}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  const t = frame / fps;
  const v = vertical;
  const p = {t, W, H, v};
  let scene;
  if (t < E.open1) scene = <S1 {...p} />;
  else if (t < E.cercles) scene = <S2 {...p} />;
  else if (t < E.tout) scene = <S3 {...p} />;
  else if (t < E.blanc) scene = <S4 {...p} />;
  else if (t < E.orange) scene = <><S5 {...p} />{t >= E.wipe && <OrangeWipe {...p} />}</>;
  else if (t < E.outro) scene = <S6 {...p} />;
  else scene = <S7 {...p} />;
  return (
    <AbsoluteFill style={{background: C.noir}}>
      <Fonts />
      {scene}
      {audio && <Audio src={staticFile('mix.wav')} />}
    </AbsoluteFill>
  );
};
