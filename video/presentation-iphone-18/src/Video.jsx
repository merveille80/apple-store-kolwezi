import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// Présentation iPhone 18 Pro Max · Apple Store Kolwezi
// Langage visuel de la référence : mots flous qui se posent, cascades à ressort, flou de bougé, curseur et puces UI.
export const DURATION = 35.5;
const FPS = 60;
const RATIO = 822 / 1726; // photo du dos (public/*-dos.png, page d’achat Apple 5120 px)
const FONT = "-apple-system, 'SF Pro Display', 'Inter Display', Inter, 'Helvetica Neue', sans-serif";
const INK = '#1d1d1f', GREY = '#86868b', LIGHT = '#f5f5f7', DARK = '#111113', BLUE = '#0071e3';
const COLORS = [['noir', 'Noir'], ['argent', 'Argent'], ['glacier', 'Glacier'], ['bordeaux', 'Bordeaux']];

// Instants (s) : scènes et repères calés sur la voix (VO = placement de chaque phrase, voir mix.py)
export const S = {s1: 0, s2: 3.6, s3: 7.0, s4: 12.6, s5: 21.6, s6: 26.2, s7: 29.6};
export const T = {
  iphone: 0.9, n18: 1.4, promax: 2.0,
  colors: [7.55, 8.8, 10.05, 11.3],
  f148: 18.45, f18: 20.2, f28: 20.5, f40: 20.8,
  a20: 22.0, h43: 24.35,
  to2: 27.3,
  store: 31.35,
};

const ease = Easing.bezier(0.22, 1, 0.36, 1);
const io = Easing.bezier(0.65, 0, 0.35, 1);
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const lerp = (t, a, b, from, to, e = ease) => interpolate(t, [a, b], [from, to], {...cl, easing: e});
const sp = (t, t0, cfg = {damping: 16, stiffness: 120, mass: 0.9}) =>
  t < t0 ? 0 : spring({frame: (t - t0) * FPS, fps: FPS, config: cfg});

// Flou de bougé horizontal (filtre SVG), proportionnel à la vitesse
let mbId = 0;
const MotionBlur = ({amount, children, style}) => {
  const id = React.useMemo(() => `mb${mbId++}`, []);
  const b = Math.min(60, Math.abs(amount));
  return (
    <div style={{...style, filter: b > 0.4 ? `url(#${id})` : undefined}}>
      {b > 0.4 && (
        <svg width="0" height="0" style={{position: 'absolute'}}>
          <filter id={id} x="-50%" y="-10%" width="200%" height="120%">
            <feGaussianBlur stdDeviation={`${b} 0`} />
          </filter>
        </svg>
      )}
      {children}
    </div>
  );
};

const Phone = ({c, cx, cy, h, op = 1, blur = 0, mb = 0, dark = false, scale = 1, rot = 0, z = 1}) => {
  const w = h * RATIO;
  return (
    <MotionBlur amount={mb} style={{position: 'absolute', left: cx - w / 2, top: cy - h / 2, width: w, height: h, opacity: op, zIndex: z,
      transform: `scale(${scale}) rotate(${rot}deg)`}}>
      <Img src={staticFile(`${c}-dos.png`)} style={{width: '100%', height: '100%',
        filter: `${blur > 0.3 ? `blur(${blur}px) ` : ''}drop-shadow(0 ${h * 0.035}px ${h * 0.055}px rgba(0,0,0,${dark ? 0.55 : 0.16}))`}} />
    </MotionBlur>
  );
};

// Mot qui arrive flou depuis la droite et se pose net
const Word = ({t, t0, children, color = INK, dx = 40}) => {
  const p = lerp(t, t0, t0 + 0.55, 0, 1);
  return (
    <span style={{display: 'inline-block', color, opacity: p, transform: `translateX(${(1 - p) * dx}px)`,
      filter: p < 1 ? `blur(${(1 - p) * 14}px)` : undefined, marginRight: '0.22em'}}>{children}</span>
  );
};

const Chip = ({x, y, w, h, label, sel = 0, hover = 0, fs}) => {
  const bg = `rgb(${interpolate(sel, [0, 1], [255, 0])},${interpolate(sel, [0, 1], [255, 113])},${interpolate(sel, [0, 1], [255, 227])})`;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: h * 0.32, background: bg,
      color: sel > 0.5 ? '#fff' : INK, fontSize: fs, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center',
      justifyContent: 'center', letterSpacing: '-0.01em', transform: `scale(${1 + hover * 0.06 - sel * 0})`,
      boxShadow: `0 ${h * 0.1}px ${h * 0.35}px rgba(0,0,0,${0.07 + hover * 0.1 + sel * 0.12}), inset 0 0 0 1px rgba(0,0,0,${0.06 * (1 - sel)})`}}>
      {label}
    </div>
  );
};

const Cursor = ({x, y, s, press = 0, op = 1}) => (
  <svg style={{position: 'absolute', left: x, top: y, width: s, height: s * 1.4, zIndex: 30, opacity: op,
    transform: `scale(${1 - press * 0.15})`, transformOrigin: '10% 5%', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.3))'}} viewBox="0 0 20 28">
    <path d="M2 2 L2 22 L7 17 L10.5 25 L14 23.5 L10.5 15.8 L17 15.5 Z" fill="#111" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

// Diaphragme à 9 lamelles ; r = ouverture relative (1 = grand ouvert)
const Iris = ({cx, cy, R, r, rot = 0}) => {
  const n = 9;
  const blades = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rot;
    const a2 = a + (Math.PI * 2) / n;
    const p1 = [cx + Math.cos(a) * R * r, cy + Math.sin(a) * R * r];
    const p2 = [cx + Math.cos(a2) * R * r, cy + Math.sin(a2) * R * r];
    const o1 = [cx + Math.cos(a + 0.9) * R * 1.05, cy + Math.sin(a + 0.9) * R * 1.05];
    const o2 = [cx + Math.cos(a - 0.4) * R * 1.05, cy + Math.sin(a - 0.4) * R * 1.05];
    blades.push(<path key={i} d={`M${p1} L${p2} L${o1} L${o2} Z`} fill={i % 2 ? '#2a2a2d' : '#232326'} stroke="#3a3a3e" strokeWidth="1" />);
  }
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible'}}>
      <defs>
        <clipPath id="irisclip"><circle cx={cx} cy={cy} r={R} /></clipPath>
        <radialGradient id="irislight"><stop offset="0" stopColor="#c9d6ff" stopOpacity=".7" /><stop offset=".55" stopColor="#5b6a9a" stopOpacity=".35" /><stop offset="1" stopColor="#0b0b0c" /></radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={R * 1.17} fill="#e8e8ed" />
      <circle cx={cx} cy={cy} r={R * 1.1} fill={INK} />
      <circle cx={cx} cy={cy} r={R} fill="url(#irislight)" />
      <g clipPath="url(#irisclip)">{blades}</g>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#000" strokeWidth={R * 0.04} />
    </svg>
  );
};

const Txt = ({x, y, size, children, color = INK, weight = 600, anchor = 'left', op = 1, blur = 0, dy = 0, ls = -0.02}) => (
  <div style={{position: 'absolute', left: x, top: y, fontFamily: FONT, fontSize: size, fontWeight: weight, color, letterSpacing: `${ls}em`,
    whiteSpace: 'nowrap', opacity: op, filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
    transform: `translate(${anchor === 'center' ? '-50%' : anchor === 'right' ? '-100%' : '0'}, ${dy}px)`}}>{children}</div>
);

// Entrée et sortie d'une scène : fondu, léger flou et zoom
const sceneEnv = (t, a, b, k = 0.35) => {
  const i = lerp(t, a - 0.05, a + k, 0, 1);
  const o = lerp(t, b - k, b + 0.05, 0, 1, io);
  return {op: Math.min(i, 1 - o), blur: (1 - i) * 10 + o * 12, scale: 1 + (1 - i) * 0.03 - o * 0.03};
};
const Layer = ({env, children}) => (
  <AbsoluteFill style={{opacity: env.op, filter: env.blur > 0.3 ? `blur(${env.blur}px)` : undefined, transform: `scale(${env.scale})`}}>{children}</AbsoluteFill>
);

export const Video = ({vertical}) => {
  const f = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const t = f / FPS;
  const V = vertical;
  const u = Math.min(W, H) / 100;
  const cx = W / 2, cy = H / 2;

  // Fond : blanc, sombre pendant les couleurs (comme la référence)
  const dark = Math.min(lerp(t, S.s3 - 0.35, S.s3 + 0.15, 0, 1, io), 1 - lerp(t, S.s4 - 0.4, S.s4 + 0.05, 0, 1, io));
  const bgv = Math.round(interpolate(dark, [0, 1], [245, 17]));
  const bg = `rgb(${bgv},${bgv},${bgv + (dark > 0 ? 2 * dark : 2)})`;

  return (
    <AbsoluteFill style={{background: bg, fontFamily: FONT, overflow: 'hidden'}}>
      {t < S.s3 + 0.2 && <Intro t={t} V={V} u={u} W={W} H={H} cx={cx} cy={cy} />}
      {t > S.s3 - 0.6 && t < S.s4 + 0.3 && <Colors t={t} V={V} u={u} W={W} H={H} cx={cx} cy={cy} />}
      {t > S.s4 - 0.3 && t < S.s5 + 0.3 && <Camera t={t} V={V} u={u} W={W} H={H} cx={cx} cy={cy} />}
      {t > S.s5 - 0.3 && t < S.s6 + 0.3 && <ChipBattery t={t} V={V} u={u} W={W} H={H} cx={cx} cy={cy} />}
      {t > S.s6 - 0.3 && t < S.s7 + 0.3 && <Storage t={t} V={V} u={u} W={W} H={H} cx={cx} cy={cy} />}
      {t > S.s7 - 0.3 && <Outro t={t} V={V} u={u} W={W} H={H} cx={cx} cy={cy} />}
      <Audio src={staticFile('mix.wav')} />
    </AbsoluteFill>
  );
};

// Scènes 1 et 2 : titre mot par mot, puis les 4 iPhone en cascade
const Intro = ({t, V, u, W, H, cx, cy}) => {
  const zoom = lerp(t, 0, S.s2, 1.08, 1, Easing.out(Easing.quad));
  const m = sp(t, S.s2, {damping: 20, stiffness: 110}); // le titre se range
  const size0 = V ? 10.5 * u : 8.6 * u;
  const size1 = V ? 7.2 * u : 4.4 * u;
  const size = interpolate(m, [0, 1], [size0, size1]);
  const tx = V ? cx : interpolate(m, [0, 1], [cx, 7 * u]);
  const ty = V ? interpolate(m, [0, 1], [cy - size0 * 0.6, 20 * u]) : cy - size * 0.62;
  const leave = lerp(t, S.s3 - 0.55, S.s3 - 0.1, 0, 1, io);
  const phones = [];
  const h = V ? 52 * u : 56 * u;
  COLORS.forEach(([c], i) => {
    const t0 = S.s2 + 0.3 + i * 0.25;
    const p = sp(t, t0, {damping: 13, stiffness: 120, mass: 0.8});
    const pPrev = sp(t - 1 / FPS, t0, {damping: 13, stiffness: 120, mass: 0.8});
    let x, y;
    if (!V) { x = (50 + i * 27.5) * u + RATIO * h / 2; y = cy; } else { x = (30 + (i % 2) * 40) * u; y = (62 + Math.floor(i / 2) * 58) * u; }
    const off = (1 - p) * W * 0.8;
    const vel = (pPrev - p) * W * 0.8 * FPS;
    phones.push(<Phone key={c} c={c} cx={x + off} cy={y - leave * 4 * u} h={h} mb={vel * 0.012 + leave * 25} op={Math.min(1, p * 3) * (1 - leave)} />);
  });
  return (
    <AbsoluteFill style={{transform: `scale(${zoom})`}}>
      <div style={{position: 'absolute', left: tx, top: ty, fontSize: size, fontWeight: 650, letterSpacing: '-0.03em', whiteSpace: 'nowrap',
        transform: `translateX(${V || m < 0.001 ? '-50%' : `${-50 * (1 - m)}%`})`, opacity: 1 - leave, filter: leave > 0 ? `blur(${leave * 10}px)` : undefined}}>
        <Word t={t} t0={T.iphone}>iPhone</Word>
        <Word t={t} t0={T.n18}>18</Word>
        <Word t={t} t0={T.promax} color={GREY}>Pro Max</Word>
      </div>
      {phones}
    </AbsoluteFill>
  );
};

// Scène 3 : carrousel sombre, l'iPhone nommé se soulève
const Colors = ({t, V, u, W, H, cx, cy}) => {
  const h = V ? 58 * u : 46 * u;
  const gap = V ? 62 * u : 30 * u;
  const steps = T.colors;
  const pos = (tt) => steps.reduce((acc, s, i) => acc + (i === 0 ? 0 : sp(tt, s - 0.12, {damping: 18, stiffness: 140})), 0);
  const k = pos(t), kPrev = pos(t - 1 / FPS);
  const enter = sp(t, S.s3 - 0.3, {damping: 18, stiffness: 100});
  const enterPrev = sp(t - 1 / FPS, S.s3 - 0.3, {damping: 18, stiffness: 100});
  const exit = lerp(t, S.s4 - 0.45, S.s4 + 0.1, 0, 1, Easing.in(Easing.cubic));
  const exitPrev = lerp(t - 1 / FPS, S.s4 - 0.45, S.s4 + 0.1, 0, 1, Easing.in(Easing.cubic));
  const baseX = V ? cx : cx - 1.5 * gap;
  const shift = V ? -k * gap : -(k - 1.5) * gap * 0.35; // en 16:9 la rangée glisse un peu, en 9:16 elle défile
  const shiftPrev = V ? -kPrev * gap : -(kPrev - 1.5) * gap * 0.35;
  const ox = (1 - enter) * W * 0.6 - exit * W * 1.2;
  const oxPrev = (1 - enterPrev) * W * 0.6 - exitPrev * W * 1.2;
  const vel = (shift + ox - shiftPrev - oxPrev) * FPS;
  const active = Math.round(k);
  return (
    <AbsoluteFill>
      {COLORS.map(([c, name], i) => {
        const d = Math.max(0, 1 - Math.abs(k - i));
        const x = baseX + i * gap + shift + ox;
        return (
          <React.Fragment key={c}>
            <Phone c={c} cx={x} cy={cy + (V ? 6 * u : 3 * u) - d * 5 * u} h={h * (1 + d * 0.06)} op={0.42 + d * 0.58} dark mb={vel * 0.01} />
            <Txt x={x} y={cy - h / 2 - (V ? 12 : 10) * u - d * 2 * u} size={(V ? 4.4 : 2.8) * u} color="#f5f5f7" anchor="center"
              op={d * (1 - exit)} blur={(1 - d) * 8}>{name}</Txt>
          </React.Fragment>
        );
      })}
      <div style={{position: 'absolute', left: cx, top: H - (V ? 20 : 11) * u, transform: 'translateX(-50%)', display: 'flex', gap: 1.6 * u,
        fontSize: (V ? 3.2 : 2.4) * u, fontWeight: 500, opacity: enter * (1 - exit)}}>
        {COLORS.map(([c, name], i) => (
          <span key={c} style={{color: i === active ? '#fff' : '#6e6e73', transition: 'none'}}>{name}</span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Scène 4 : zoom sur le bloc caméra, puis diaphragme et sélecteur d'ouverture
const Camera = ({t, V, u, W, H, cx, cy}) => {
  const env = sceneEnv(t, S.s4, S.s5);
  const z = lerp(t, S.s4 + 0.1, S.s4 + 1.3, 0, 1, io); // zoom vers le bloc caméra
  const side = sp(t, S.s4 + 1.4, {damping: 20, stiffness: 100}); // le bloc se range, le diaphragme arrive
  const ph = V ? 70 * u : 62 * u; // hauteur de l'iPhone avant zoom
  const zs = interpolate(z, [0, 1], [1, V ? 2.05 : 2.2]) * (V ? interpolate(side, [0, 1], [1, 0.5]) : 1);
  // centre du bloc caméra dans la photo : 50 % en largeur, 15 % en hauteur
  const finalX = V ? cx : interpolate(side, [0, 1], [cx, 36 * u]);
  const finalY = V ? interpolate(side, [0, 1], [cy, 26 * u]) : cy;
  const steps = [T.f148, T.f18, T.f28, T.f40];
  const radius = [0.86, 0.68, 0.48, 0.3];
  let sel = -1;
  steps.forEach((s, i) => { if (t >= s) sel = i; });
  let r = radius[0];
  steps.forEach((s, i) => { if (i > 0) r += (radius[i] - radius[i - 1]) * sp(t, s, {damping: 14, stiffness: 160}); });
  const ix = V ? cx : 112 * u, iy = V ? 130 * u : cy - 6 * u, R = V ? 17 * u : 14 * u;
  const ui = lerp(t, S.s4 + 1.7, S.s4 + 2.4, 0, 1);
  const labels = ['ƒ/1,48', 'ƒ/1,8', 'ƒ/2,8', 'ƒ/4,0'];
  const cw = V ? 19 * u : 12 * u, ch = V ? 7 * u : 5.6 * u, fs = V ? 3 * u : 2.4 * u;
  const y0 = iy + R * 1.5;
  const chipX = (i) => ix - 2 * cw - 1.5 * u + i * (cw + 1 * u);
  // le curseur va de puce en puce
  const target = Math.max(0, sel);
  let curX = chipX(0) + cw * 0.55;
  steps.forEach((s, i) => { if (i > 0) curX += (chipX(i) - chipX(i - 1)) * sp(t, s - 0.25, {damping: 22, stiffness: 180}); });
  const press = steps.reduce((a, s) => a + Math.max(0, 1 - Math.abs(t - s) / 0.08) , 0);
  const curIn = lerp(t, steps[0] - 0.9, steps[0] - 0.3, 0, 1);
  return (
    <Layer env={env}>
      <div style={{position: 'absolute', left: finalX, top: finalY, width: 0, height: 0}}>
        <div style={{position: 'absolute', left: 0, top: 0, transform: `scale(${zs}) translateY(${ph * 0.35 * z}px)`, transformOrigin: '0 0'}}>
          <Phone c="bordeaux" cx={0} cy={0} h={ph} />
        </div>
      </div>
      <AbsoluteFill style={{opacity: ui, transform: `translateY(${(1 - ui) * 3 * u}px)`}}>
        <Txt x={ix} y={iy - R * 1.95} size={(V ? 4.6 : 4.2) * u} anchor="center">Ouverture variable</Txt>
        <Txt x={ix} y={iy - R * 1.95 + (V ? 6.2 : 5.4) * u} size={(V ? 2.8 : 2.4) * u} color={GREY} weight={500} anchor="center" ls={0}>Caméra Fusion 48 Mpx</Txt>
        <Iris cx={ix} cy={iy} R={R} r={r} rot={(0.86 - r) * 1.2} />
        {labels.map((l, i) => (
          <Chip key={l} x={chipX(i)} y={y0} w={cw} h={ch} label={l} fs={fs} sel={i === sel ? sp(t, steps[i], {damping: 20, stiffness: 200}) : 0}
            hover={Math.max(0, 1 - Math.abs(t - steps[i] + 0.1) / 0.3)} />
        ))}
        <Cursor x={curX} y={y0 + ch * 0.5} s={V ? 4 * u : 2.6 * u} press={Math.min(1, press)} op={curIn * (1 - lerp(t, S.s5 - 0.8, S.s5 - 0.4, 0, 1))} />
      </AbsoluteFill>
    </Layer>
  );
};

// Scène 5 : puce A20 Pro et 43 h
const ChipBattery = ({t, V, u, W, H, cx, cy}) => {
  const env = sceneEnv(t, S.s5, S.s6);
  const h = V ? 70 * u : 52 * u;
  const rise = sp(t, S.s5, {damping: 17, stiffness: 90});
  const py = (V ? 14 * u + h / 2 : cy) + (1 - rise) * H * 0.6;
  const c1 = sp(t, T.a20 - 0.1, {damping: 15, stiffness: 120});
  const c2 = sp(t, T.h43 - 0.1, {damping: 15, stiffness: 120});
  const n = Math.round(lerp(t, T.h43, T.h43 + 1.0, 0, 43, Easing.out(Easing.cubic)));
  const card = (x, y, w, hh, p, from, inner) => (
    <div style={{position: 'absolute', left: x + (1 - p) * from, top: y, width: w, height: hh, background: '#fff', borderRadius: 3 * u, opacity: Math.min(1, p * 2),
      boxShadow: `0 ${1.5 * u}px ${5 * u}px rgba(0,0,0,.10)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 * u,
      transform: `scale(${0.92 + 0.08 * p})`}}>{inner}</div>
  );
  const k = V ? 1.35 : 1;
  const chip = (
    <>
      <div style={{width: 12 * u * k, height: 12 * u * k, borderRadius: 2.4 * u * k, background: INK, color: '#fff', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 2.8 * u * k, boxShadow: `inset 0 0 0 ${0.5 * u}px #3a3a3c`, lineHeight: 1.05}}>
        A20<span style={{fontSize: 1.5 * u * k, color: '#a1a1a6', fontWeight: 600}}>PRO</span>
      </div>
      <div style={{fontSize: 1.9 * u * k, color: '#6e6e73', fontWeight: 500}}>Puce A20 Pro</div>
    </>
  );
  const bat = (
    <>
      <div style={{fontSize: 8 * u * k, fontWeight: 700, letterSpacing: '-0.03em', color: INK, fontVariantNumeric: 'tabular-nums'}}>{n} h</div>
      <div style={{fontSize: 1.9 * u * k, color: '#6e6e73', fontWeight: 500}}>de lecture vidéo</div>
    </>
  );
  return (
    <Layer env={env}>
      <Phone c="noir" cx={cx} cy={py} h={h} />
      {!V ? (
        <>
          {card(cx - 50 * u, cy - 13 * u, 32 * u, 26 * u, c1, -20 * u, chip)}
          {card(cx + 18 * u, cy - 13 * u, 32 * u, 26 * u, c2, 20 * u, bat)}
        </>
      ) : (
        <>
          {card(6 * u, 100 * u, 42 * u, 30 * u, c1, -20 * u, chip)}
          {card(52 * u, 100 * u, 42 * u, 30 * u, c2, 20 * u, bat)}
        </>
      )}
    </Layer>
  );
};

// Scène 6 : sélecteur de capacité, le curseur clique 2 To
const Storage = ({t, V, u, W, H, cx, cy}) => {
  const env = sceneEnv(t, S.s6, S.s7);
  const L = ['256 Go', '512 Go', '1 To', '2 To'];
  const cw = V ? 36 * u : 18 * u, ch = V ? 11 * u : 7 * u, fs = V ? 4.6 * u : 2.8 * u, gapY = 2 * u;
  const h = V ? 88 * u : 66 * u;
  const pin = sp(t, S.s6, {damping: 17, stiffness: 100});
  const px = (V ? 50 * u + h * RATIO / 2 : cx + 2 * u + h * RATIO / 2) + (1 - pin) * W * 0.5;
  const py = V ? 42 * u + h / 2 : cy;
  const x0 = V ? 7 * u : cx - 26 * u, y0 = V ? 60 * u : cy - 2 * ch - 3 * u;
  const curStart = S.s6 + 0.6;
  const cy0 = y0 + ch * 0.5;
  const curY = interpolate(t, [curStart, T.to2 - 0.1], [cy0, cy0 + 3 * (ch + gapY)], {...cl, easing: io});
  const rowAt = (curY - cy0) / (ch + gapY);
  const press = Math.max(0, 1 - Math.abs(t - T.to2) / 0.09);
  const selP = sp(t, T.to2, {damping: 18, stiffness: 200});
  return (
    <Layer env={env}>
      <Phone c="bordeaux" cx={px} cy={py} h={h} />
      <Txt x={x0} y={y0 - (V ? 9 : 6) * u} size={(V ? 4.2 : 2.8) * u} color="#6e6e73" weight={500} ls={0} op={lerp(t, S.s6 + 0.1, S.s6 + 0.5, 0, 1)}>Stockage</Txt>
      {L.map((l, i) => {
        const p = sp(t, S.s6 + 0.15 + i * 0.09, {damping: 15, stiffness: 160});
        return (
          <div key={l} style={{opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 3 * u}px)`}}>
            <Chip x={x0} y={y0 + i * (ch + gapY)} w={cw} h={ch} label={l} fs={fs} sel={i === 3 ? selP : 0}
              hover={i === 3 ? 0 : Math.max(0, 1 - Math.abs(rowAt - i) * 1.6) * (t < T.to2 ? 1 : 0)} />
          </div>
        );
      })}
      <Cursor x={x0 + cw * 0.55} y={curY} s={V ? 4.5 * u : 2.8 * u} press={press} op={lerp(t, curStart - 0.4, curStart, 0, 1) * (1 - lerp(t, S.s7 - 0.6, S.s7 - 0.3, 0, 1))} />
    </Layer>
  );
};

// Scène 7 : trois iPhone montent, « Apple Store Kolwezi » se dévoile lettre par lettre
const Outro = ({t, V, u, W, H, cx, cy}) => {
  const env = sceneEnv(t, S.s7, DURATION + 1);
  const h = V ? 95 * u : 60 * u;
  const yBase = V ? H - h * 0.72 + h / 2 : H - h * 0.55 + h / 2;
  const ph = [['glacier', -1.25 * RATIO * h + RATIO * h * 0.46, 0.92, 0.2], ['noir', 0.25 * RATIO * h + RATIO * h * 0.46, 0.92, 0.3], ['bordeaux', 0, 1, 0]];
  const ty = V ? 43 * u : 16 * u, ts = (V ? 6.4 : 4.6) * u;
  const intro = lerp(t, S.s7 + 0.4, S.s7 + 0.9, 0, 1);
  const letters = (word, t0, color) => word.split('').map((ch, i) => {
    const p = lerp(t, t0 + i * 0.04, t0 + i * 0.04 + 0.6, 0, 1, ease);
    return (
      <span key={i} style={{display: 'inline-block', color, opacity: p, transform: `translateY(${(1 - p) * 0.45}em)`,
        filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined, whiteSpace: 'pre'}}>{ch}</span>
    );
  });
  const line = lerp(t, T.store + 1.0, T.store + 1.7, 0, 1, io);
  const shimmer = lerp(t, T.store + 1.2, T.store + 2.2, -30, 130, io);
  return (
    <Layer env={env}>
      {ph.map(([c, dx, s, d]) => {
        const p = sp(t, S.s7 + d, {damping: 16, stiffness: 80});
        return <Phone key={c} c={c} cx={cx + dx} cy={yBase + (s < 1 ? 4 * u : 0) + (1 - p) * H * 0.7} h={h * s} z={s < 1 ? 1 : 3} />;
      })}
      <Txt x={cx} y={ty - (V ? 7.5 : 5) * u} size={(V ? 3.6 : 2.8) * u} color="#6e6e73" weight={500} anchor="center" ls={0} op={intro} dy={(1 - intro) * 10}>
        Disponible maintenant chez
      </Txt>
      <div style={{position: 'absolute', left: cx, top: ty, transform: 'translateX(-50%)', fontSize: ts, fontWeight: 600, letterSpacing: '-0.025em', whiteSpace: 'nowrap',
        WebkitMaskImage: line > 0 && line < 1 ? undefined : undefined}}>
        {letters('Apple Store ', T.store, INK)}
        {letters('Kolwezi', T.store + 0.7, GREY)}
        <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', background: `linear-gradient(100deg, transparent ${shimmer - 12}%, rgba(255,255,255,.75) ${shimmer}%, transparent ${shimmer + 12}%)`,
          mixBlendMode: 'screen'}} />
      </div>
      <div style={{position: 'absolute', left: cx - (V ? 9 : 6) * u * line, top: ty + ts * 1.45, width: (V ? 18 : 12) * u * line, height: Math.max(2, 0.25 * u),
        borderRadius: 2, background: INK, opacity: 0.85}} />
    </Layer>
  );
};
