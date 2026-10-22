import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Easing, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// Présentation iPhone 18 Pro Max sans voix · 9 scènes calées sur « Hotshot » (118 BPM)
// Tout est exprimé en temps (beats) : B(n) = n temps. Le drop de la musique tombe sur B(6).
export const BPM = 118;
export const T = 60 / BPM;
export const B = (n) => n * T;
export const DURATION = 26.0;

const BLUE = '#0071e3';
const INK = '#1d1d1f';
const GREY = '#86868b';
const PH = 1730 / 825; // hauteur / largeur des photos de dos
const FONT = 'InterDisplay';

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const easeIn = Easing.bezier(0.7, 0, 0.84, 0);
const io = Easing.bezier(0.65, 0, 0.35, 1);
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const lerp = (t, a, b, from, to, e = ease) => interpolate(t, [a, b], [from, to], {...cl, easing: e});

// Ressort amorti (petit rebond, réglé pour 60 i/s)
const spring = (t, t0, d = 0.55, bounce = 0.32) => {
  if (t <= t0) return 0;
  const x = (t - t0) / d;
  if (x >= 1.6) return 1;
  return 1 - Math.exp(-6 * x) * Math.cos(x * Math.PI * (1 + bounce * 2.2)) ;
};

// Entrée floue → nette (la signature de la référence) et sortie inverse
const blurIn = (t, t0, d = 0.42, {dy = 0, dx = 0, s0 = 0.86, blur = 26} = {}) => {
  const p = lerp(t, t0, t0 + d, 0, 1);
  return {p, op: lerp(t, t0, t0 + d * 0.6, 0, 1, Easing.linear), blur: (1 - p) * blur, s: s0 + (1 - s0) * p, x: dx * (1 - p), y: dy * (1 - p)};
};
const blurOut = (t, t0, d = 0.3, {dy = 0, dx = 0, s1 = 1.08, blur = 30} = {}) => {
  const p = lerp(t, t0, t0 + d, 0, 1, easeIn);
  return {p, op: 1 - p, blur: p * blur, s: 1 + (s1 - 1) * p, x: dx * p, y: dy * p};
};
const fx = (a, b = {op: 1, blur: 0, s: 1, x: 0, y: 0}) => ({
  opacity: a.op * b.op,
  filter: a.blur + b.blur > 0.2 ? `blur(${a.blur + b.blur}px)` : undefined,
  transform: `translate(${a.x + b.x}px, ${a.y + b.y}px) scale(${a.s * b.s})`,
});

const Font = () => (
  <style>{`
  @font-face{font-family:${FONT};font-weight:500;src:url(${staticFile('InterDisplay-Medium.otf')})}
  @font-face{font-family:${FONT};font-weight:600;src:url(${staticFile('InterDisplay-SemiBold.otf')})}
  @font-face{font-family:${FONT};font-weight:700;src:url(${staticFile('InterDisplay-Bold.otf')})}`}</style>
);

const Abs = ({x, y, w, h, children, style, center = true}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, ...(center ? {transform: 'translate(-50%,-50%)'} : {}), ...style}}>{children}</div>
);

const Phone = ({c, h, style}) => (
  <Img src={staticFile(`${c}-dos.png`)} style={{height: h, width: h / PH, display: 'block', filter: `drop-shadow(0 ${h * 0.04}px ${h * 0.05}px rgba(0,0,0,.16))`, ...style}} />
);

const Txt = ({children, size, w = 600, color = INK, ls = -0.025, style}) => (
  <div style={{fontFamily: FONT, fontSize: size, fontWeight: w, color, letterSpacing: `${ls}em`, whiteSpace: 'nowrap', lineHeight: 1.1, ...style}}>{children}</div>
);

// Mots qui arrivent un par un, flous → nets
const Words = ({t, words, size, w = 700, color = INK, gap = 0.28}) => (
  <div style={{display: 'flex', gap: size * 0.26, justifyContent: 'center'}}>
    {words.map((wd, i) => {
      const a = blurIn(t, wd.t, 0.4, {dy: size * 0.35, s0: 0.9, blur: 18});
      return <Txt key={i} size={size} w={w} color={wd.color || color} style={fx(a)}>{wd.s}</Txt>;
    })}
  </div>
);

const Hand = ({x, y, s, press = 0, op = 1}) => (
  <svg viewBox="0 0 32 32" style={{position: 'absolute', left: x - s * 0.36, top: y - s * 0.1, width: s, height: s, opacity: op, transform: `scale(${1 - press * 0.14})`, transformOrigin: '36% 10%', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.28))', zIndex: 50}}>
    <path d="M12 3.5c1.2 0 2 .9 2 2v8.2l.6-.1V11c0-1.1.9-2 2-2s2 .9 2 2v2.8l.5-.1v-1.6c0-1.1.9-2 2-2s2 .9 2 2v2.2l.4-.1c1.1 0 2 .9 2 2v6.5c0 4.2-3.1 7.3-7.2 7.3h-2.1c-2.4 0-4.4-1.1-5.7-3.1L5.6 19.4c-.6-.9-.4-2.1.5-2.7.9-.6 2-.4 2.7.4l1.2 1.4V5.5c0-1.1.9-2 2-2z" fill="#fff" stroke="#111" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

// Déplacement de la main entre des points datés, avec appui sur chaque clic
const handAt = (t, keys) => {
  let x = keys[0].x, y = keys[0].y;
  for (let i = 1; i < keys.length; i++) {
    const k0 = keys[i - 1], k1 = keys[i];
    if (t >= k0.t) {
      const p = lerp(t, k0.t, k1.t, 0, 1, io);
      x = k0.x + (k1.x - k0.x) * p; y = k0.y + (k1.y - k0.y) * p;
    }
  }
  const press = keys.filter((k) => k.click).reduce((m, k) => Math.max(m, interpolate(t, [k.t - 0.08, k.t, k.t + 0.14], [0, 1, 0], cl)), 0);
  return {x, y, press};
};

const Glow = ({x, y, r, color, op = 1}) => (
  <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: color, filter: `blur(${r * 0.45}px)`, opacity: op}} />
);

// ───────────────────────── Scènes ─────────────────────────

// 1 · Hook : point bleu → Dynamic Island
const S1 = ({t, W, H, v, u}) => {
  const cx = W / 2, cy = v ? H * 0.47 : H * 0.52;
  const grow = lerp(t, B(1), B(1) + 0.5, 0, 1);
  const dot = blurIn(t, 0.05, 0.45, {s0: 0.2, blur: 30});
  const pw = 70 * u + (760 - 70) * u * grow, ph = 70 * u + (150 - 70) * u * grow;
  const content = blurIn(t, B(1) + 0.25, 0.35, {blur: 14, s0: 0.95});
  const out = blurOut(t, B(5), 0.32, {s1: 0.4, dy: -H * 0.18, blur: 16});
  const title = blurOut(t, B(4.75), 0.28, {dy: -40 * u});
  return (
    <AbsoluteFill>
      <Abs x={cx} y={cy - 190 * u}><div style={fx(title)}><Words t={t} size={64 * u} w={600} color={GREY} words={[{s: 'Il est', t: B(2)}, {s: 'arrivé.', t: B(2.5)}]} /></div></Abs>
      <Abs x={cx} y={cy}><div style={fx(out)}>
        <div style={{...fx(dot), width: pw, height: ph, borderRadius: ph / 2, background: grow > 0.02 ? '#0b0b0c' : BLUE, boxShadow: `0 ${30 * u}px ${70 * u}px rgba(0,0,0,${0.25 * grow})`, display: 'flex', alignItems: 'center', padding: `0 ${26 * u}px`, gap: 26 * u, overflow: 'hidden'}}>
          <div style={{...fx(content), display: 'flex', alignItems: 'center', gap: 26 * u, width: '100%'}}>
            <Phone c="bordeaux" h={104 * u} style={{filter: 'none'}} />
            <div style={{flex: 1}}>
              <Txt size={30 * u} w={500} color="#8e8e93" ls={0}>Nouveau</Txt>
              <Txt size={46 * u} w={600} color="#fff" ls={-0.02}>iPhone 18 Pro Max</Txt>
            </div>
            <div style={{width: 64 * u, height: 64 * u, borderRadius: '50%', background: BLUE, boxShadow: `0 0 ${30 * u}px rgba(0,113,227,.85)`, transform: `scale(${1 + 0.08 * Math.sin(t * 9)})`}} />
          </div>
        </div>
      </div></Abs>
    </AbsoluteFill>
  );
};

// 2 · Révélation : riser, silence, impact sur le drop
const S2 = ({t, W, H, v, u}) => {
  const ph = v ? 1080 * u : 640 * u;
  const cx = W / 2, cy = v ? H * 0.43 : H * 0.42;
  const rise = lerp(t, B(6) - 0.06, B(6) + 0.75, 0, 1);
  const out = blurOut(t, B(9) - 0.05, 0.32, {dy: -120 * u, s1: 1.06});
  const settle = lerp(t, B(6) + 0.6, B(9), 0, 1, io);
  const shake = interpolate(t, [B(6), B(6) + 0.05, B(6) + 0.12, B(6) + 0.22], [0, 6, -3, 0], cl) * u;
  const glow = lerp(t, B(6), B(6) + 0.6, 0, 1);
  return (
    <AbsoluteFill style={{...fx(out), transform: `${fx(out).transform} translateY(${shake}px)`}}>
      <Glow x={cx} y={cy} r={ph * 0.48} color="rgba(120,120,135,.16)" op={glow} />
      <Abs x={cx} y={cy + (1 - rise) * H * 0.55} style={{opacity: lerp(t, B(6) - 0.06, B(6) + 0.2, 0, 1, Easing.linear), filter: rise < 0.98 ? `blur(${(1 - rise) * 40}px)` : undefined, transform: `translate(-50%,-50%) rotate(${-9 + 5 * rise + 2 * settle}deg) scale(${1.28 - 0.28 * rise - 0.03 * settle})`}}>
        <Phone c="bordeaux" h={ph} />
      </Abs>
      <Abs x={cx} y={v ? H * 0.8 : H * 0.88}>
        <Words t={t} size={(v ? 118 : 96) * u} words={[{s: 'iPhone', t: B(7)}, {s: '18', t: B(7.5)}, {s: 'Pro', t: B(8)}, {s: 'Max', t: B(8.5)}]} />
      </Abs>
    </AbsoluteFill>
  );
};

// 3 · Les 4 couleurs : un clic par temps
const COLS = [['noir', 'Noir', '#2b2b2d'], ['argent', 'Argent', '#e3e4e6'], ['glacier', 'Glacier', '#a9c3e0'], ['bordeaux', 'Bordeaux', '#5e1f2c']];
const CLICK3 = [B(10.5), B(11.5), B(12.5), B(13.5)];
const S3 = ({t, W, H, v, u}) => {
  const ph = v ? 960 * u : 720 * u;
  const pcx = v ? W / 2 : W * 0.36, pcy = v ? H * 0.38 : H * 0.5;
  const ui = {x: v ? W / 2 : W * 0.68, y: v ? H * 0.8 : H * 0.6};
  const enter = blurIn(t, B(9), 0.5, {dy: 140 * u, blur: 24});
  const card = blurIn(t, B(9.5), 0.45, {dy: 60 * u, s0: 0.8});
  // Sortie : zoom vers la caméra (enchaîne sur la scène 4)
  const zoom = lerp(t, B(15.3), B(16), 0, 1, easeIn);
  const uiOut = blurOut(t, B(15), 0.3, {dy: 60 * u});
  let idx = 0; CLICK3.forEach((c, i) => { if (t >= c) idx = i; });
  const dot = 92 * u, gap = 54 * u, padX = 46 * u;
  const cardW = 4 * dot + 3 * gap + 2 * padX;
  const dotX = (i) => ui.x - cardW / 2 + padX + dot / 2 + i * (dot + gap);
  const hk = handAt(t, [
    {t: B(9.6), x: ui.x + 300 * u, y: ui.y + 380 * u},
    {t: CLICK3[0], x: dotX(0) + 8 * u, y: ui.y + 10 * u, click: true},
    {t: CLICK3[1], x: dotX(1) + 8 * u, y: ui.y + 10 * u, click: true},
    {t: CLICK3[2], x: dotX(2) + 8 * u, y: ui.y + 10 * u, click: true},
    {t: CLICK3[3], x: dotX(3) + 8 * u, y: ui.y + 10 * u, click: true},
    {t: B(14.6), x: ui.x + 360 * u, y: ui.y + 420 * u},
  ]);
  const handOp = lerp(t, B(9.6), B(9.6) + 0.25, 0, 1) * lerp(t, B(14.3), B(14.6), 1, 0);
  // Téléphone courant : glisse avec flou de bougé à chaque clic
  const phones = COLS.map(([c], i) => {
    const tin = i === 0 ? -1 : CLICK3[i];
    const tout = i < 3 ? CLICK3[i + 1] : 1e9;
    const pin = i === 0 ? 1 : lerp(t, tin, tin + 0.38, 0, 1);
    const pout = lerp(t, tout, tout + 0.3, 0, 1, easeIn);
    if (t < tin - 0.01 || pout >= 1) return null;
    const x = (1 - pin) * 520 * u - pout * 520 * u;
    const vel = (i === 0 ? 0 : (1 - pin)) + pout;
    return (
      <Abs key={c} x={pcx + x} y={pcy} style={{opacity: Math.min(pin * 1.6, 1) * (1 - pout), filter: vel > 0.02 ? `blur(${vel * 22}px)` : undefined, transform: `translate(-50%,-50%) rotate(${(1 - pin) * 8 - pout * 8}deg)`}}>
        <Phone c={c} h={ph} />
      </Abs>
    );
  });
  const label = COLS[idx][1];
  const lab = idx === 0 ? blurIn(t, B(9.8), 0.35, {dy: 30 * u}) : blurIn(t, CLICK3[idx], 0.35, {dy: 30 * u});
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{...fx(enter), transformOrigin: `${pcx}px ${pcy - ph * 0.3}px`, transform: `${fx(enter).transform} scale(${1 + zoom * 2.2})`, opacity: enter.op * (1 - zoom * 0.9)}}>{phones}</AbsoluteFill>
      <AbsoluteFill style={fx(uiOut)}>
        <Abs x={ui.x} y={ui.y - (v ? 150 : 190) * u}><Txt size={(v ? 70 : 76) * u} style={fx(lab)}>{label}</Txt></Abs>
        <Abs x={ui.x} y={ui.y}>
          <div style={{...fx(card), display: 'flex', gap, padding: `${34 * u}px ${padX}px`, background: '#fff', borderRadius: 999, boxShadow: `0 ${20 * u}px ${60 * u}px rgba(0,0,0,.09), 0 0 0 1px rgba(0,0,0,.04)`}}>
            {COLS.map(([c, , col], i) => {
              const sel = i === idx && t >= CLICK3[0] - 0.02;
              const pop = sel ? interpolate(t, [CLICK3[i], CLICK3[i] + 0.1, CLICK3[i] + 0.25], [1, 1.14, 1], cl) : 1;
              return <div key={c} style={{width: dot, height: dot, borderRadius: '50%', background: col, transform: `scale(${pop})`, boxShadow: `inset 0 0 0 ${2 * u}px rgba(0,0,0,.08)${sel ? `, 0 0 0 ${8 * u}px #fff, 0 0 0 ${11 * u}px ${BLUE}` : ''}`}} />;
            })}
          </div>
        </Abs>
        <Hand x={hk.x} y={hk.y} s={90 * u} press={hk.press} op={handOp} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 4 · Caméra : ouverture variable ƒ/1,48 → ƒ/4,0
const STOPS = ['ƒ/1,48', 'ƒ/1,8', 'ƒ/2,8', 'ƒ/4,0'];
const STOP_T = [B(18), B(19), B(20), B(21)];
const S4 = ({t, W, H, v, u}) => {
  const enter = blurIn(t, B(15.8), 0.45, {s0: 1.25, blur: 30});
  const out = blurOut(t, B(22) - 0.05, 0.3, {s1: 1.1});
  const drift = lerp(t, B(16), B(22), 0, 1, Easing.linear);
  // Gros plan sur le bloc caméra (photo HD recadrée)
  const camH = v ? 2300 * u : 1500 * u;
  const camBox = v ? {x: 0, y: 0, w: W, h: H * 0.58} : {x: 0, y: 0, w: W * 0.52, h: H};
  const card = blurIn(t, B(16.5), 0.5, {dy: 160 * u, s0: 0.92});
  const cw = 900 * u, ch = 560 * u;
  const ccx = v ? W / 2 : W * 0.74, ccy = v ? H * 0.74 : H * 0.5;
  const draw = lerp(t, B(17), B(17.8), 0, 1);
  let k = 0; STOP_T.forEach((s, i) => { if (t >= s) k = i; });
  const pos = STOP_T.reduce((acc, s, i) => (i === 0 ? 0 : acc + lerp(t, s - 0.2, s, 0, 1, io) / 3), 0);
  const r = 250 * u, acx = cw / 2, acy = ch * 0.78;
  const a0 = Math.PI * 1.15, a1 = Math.PI * 1.85, ak = a0 + (a1 - a0) * pos;
  const P = (a) => [acx + Math.cos(a) * r, acy + Math.sin(a) * r];
  const [x0, y0] = P(a0), [x1, y1] = P(a1), [xk, yk] = P(ak);
  const val = blurIn(t, k === 0 ? B(17.6) : STOP_T[k], 0.25, {dy: 24 * u, blur: 10, s0: 0.96});
  const dark = pos * 0.22; // plus l'ouverture se ferme, plus l'image s'assombrit
  return (
    <AbsoluteFill style={fx(out)}>
      <div style={{position: 'absolute', left: camBox.x, top: camBox.y, width: camBox.w, height: camBox.h, overflow: 'hidden', ...fx(enter)}}>
        <Img src={staticFile('bordeaux-dos.png')} style={{position: 'absolute', height: camH, width: camH / PH, left: (v ? -0.04 : -0.08) * camBox.w - drift * 30 * u, top: -camH * 0.02 - drift * 20 * u, filter: `brightness(${1 - dark})`}} />
        <div style={{position: 'absolute', inset: 0, background: v ? 'linear-gradient(transparent 70%, #fff)' : 'linear-gradient(90deg, transparent 75%, #fff)'}} />
      </div>
      <Abs x={ccx} y={ccy} style={{width: cw, height: ch}}>
        <div style={{...fx(card), width: cw, height: ch, borderRadius: 56 * u, background: 'linear-gradient(#1c1c1e,#0b0b0c)', boxShadow: `0 ${30 * u}px ${80 * u}px rgba(0,0,0,.28)`, position: 'relative'}}>
          <Txt size={34 * u} w={500} color="#fff" ls={0} style={{position: 'absolute', left: 54 * u, top: 50 * u}}>Caméra Fusion 48 MP</Txt>
          <Txt size={34 * u} w={500} color="#5ab0ff" ls={0} style={{position: 'absolute', right: 54 * u, top: 50 * u}}>Ouverture variable</Txt>
          <svg width={cw} height={ch} style={{position: 'absolute', left: 0, top: 0}}>
            <path d={`M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`} stroke="#2c3e66" strokeWidth={22 * u} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
            {pos > 0.002 && <path d={`M${x0} ${y0} A${r} ${r} 0 0 1 ${xk} ${yk}`} stroke="#5ab0ff" strokeWidth={22 * u} fill="none" strokeLinecap="round" style={{filter: `drop-shadow(0 0 ${12 * u}px #5ab0ff)`}} />}
            <circle cx={xk} cy={yk} r={34 * u * draw} fill={BLUE} stroke="#fff" strokeWidth={9 * u} />
          </svg>
          <Txt size={96 * u} w={600} color="#fff" style={{position: 'absolute', left: '50%', top: ch * 0.47, transform: `translateX(-50%) ${fx(val).transform}`, opacity: val.op, filter: fx(val).filter}}>{STOPS[k]}</Txt>
          <Txt size={30 * u} w={500} color="#8e8e93" ls={0} style={{position: 'absolute', left: 70 * u, bottom: 40 * u, opacity: draw}}>ƒ/1,48</Txt>
          <Txt size={30 * u} w={500} color="#8e8e93" ls={0} style={{position: 'absolute', right: 70 * u, bottom: 40 * u, opacity: draw}}>ƒ/4,0</Txt>
        </div>
      </Abs>
    </AbsoluteFill>
  );
};

// 5 · Puce A20 Pro
const S5 = ({t, W, H, v, u}) => {
  const cx = W / 2, cy = v ? H * 0.4 : H * 0.36;
  const sq = spring(t, B(22.5), 0.6, 0.3);
  const out = blurOut(t, B(27) - 0.05, 0.3, {s1: 0.9, dy: -60 * u});
  const lines = lerp(t, B(23), B(23.8), 0, 1);
  const breath = 0.75 + 0.25 * Math.sin((t - B(22.5)) * 3.2);
  const s = 420 * u;
  const pins = [30, 42, 54, 66];
  return (
    <AbsoluteFill style={fx(out)}>
      <Glow x={cx} y={cy} r={340 * u} color="rgba(0,113,227,.22)" op={lerp(t, B(23), B(24), 0, 1) * breath} />
      <Abs x={cx} y={cy} style={{opacity: Math.min(1, sq * 1.5), filter: sq < 0.9 ? `blur(${(1 - Math.min(sq, 1)) * 20}px)` : undefined}}>
        <div style={{width: s, height: s, transform: `scale(${0.4 + 0.6 * sq})`, borderRadius: 96 * u, background: 'linear-gradient(#1c1c1e,#0b0b0c)', boxShadow: `0 ${30 * u}px ${80 * u}px rgba(0,0,0,.3)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 * u}}>
          <svg width={170 * u} height={170 * u} viewBox="0 0 100 100">
            <rect x="22" y="22" width="56" height="56" rx="10" fill="none" stroke="#5ab0ff" strokeWidth="4" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - lines} />
            {pins.map((p) => (
              <g key={p} stroke="#5ab0ff" strokeWidth="3" opacity={lines}>
                <line x1={p} y1="8" x2={p} y2="20" /><line x1={p} y1="80" x2={p} y2="92" /><line x1="8" y1={p} x2="20" y2={p} /><line x1="80" y1={p} x2="92" y2={p} />
              </g>
            ))}
            <text x="50" y="57" textAnchor="middle" fontFamily={FONT} fontWeight="700" fontSize="17" fill="#fff" opacity={lerp(t, B(23.5), B(23.5) + 0.3, 0, 1)}>A20</text>
          </svg>
          <Txt size={40 * u} color="#5ab0ff" style={{opacity: lerp(t, B(23.5), B(23.5) + 0.3, 0, 1)}}>A20 Pro</Txt>
        </div>
      </Abs>
      <Abs x={cx} y={v ? H * 0.62 : H * 0.72}><Words t={t} size={76 * u} words={[{s: 'Puce', t: B(24)}, {s: 'A20 Pro.', t: B(24.5)}]} /></Abs>
      <Abs x={cx} y={v ? H * 0.62 + 100 * u : H * 0.72 + 88 * u}><Txt size={50 * u} w={500} color={GREY} style={fx(blurIn(t, B(25), 0.4, {dy: 30 * u, blur: 14}))}>Chambre à vapeur nouvelle génération.</Txt></Abs>
    </AbsoluteFill>
  );
};

// 6 · Autonomie : ligne bleue qui se dessine + compteur 0 → 43 h
const S6 = ({t, W, H, v, u}) => {
  const draw = lerp(t, B(27), B(29), 0, 1, io);
  const out = blurOut(t, B(33) - 0.05, 0.3, {dx: -200 * u});
  const pill = blurIn(t, B(28), 0.45, {dy: -80 * u, s0: 0.6});
  const count = Math.round(lerp(t, B(28.5), B(30.5), 0, 43, Easing.bezier(0.3, 0, 0.2, 1)));
  const pop = interpolate(t, [B(30.5), B(30.5) + 0.1, B(30.5) + 0.3], [1, 1.12, 1], cl);
  const d = v
    ? `M-40 ${1180 * u} C${140 * u} ${1180 * u} ${160 * u} ${1060 * u} ${230 * u} ${980 * u} C${300 * u} ${900 * u} ${360 * u} ${1000 * u} ${380 * u} ${1120 * u} C${400 * u} ${1260 * u} ${520 * u} ${1300 * u} ${640 * u} ${1210 * u} C${760 * u} ${1120 * u} ${860 * u} ${1100 * u} ${W + 40} ${860 * u}`
    : `M-40 ${700 * u} C${300 * u} ${700 * u} ${330 * u} ${520 * u} ${460 * u} ${470 * u} C${600 * u} ${420 * u} ${640 * u} ${600 * u} ${700 * u} ${700 * u} C${780 * u} ${830 * u} ${1000 * u} ${820 * u} ${1150 * u} ${680 * u} C${1300 * u} ${540 * u} ${1500 * u} ${560 * u} ${W + 40} ${380 * u}`;
  const fill = lerp(t, B(28.5), B(30.5), 0.08, 1);
  return (
    <AbsoluteFill style={fx(out)}>
      <svg width={W} height={H} style={{position: 'absolute'}}>
        <path d={d} stroke={BLUE} strokeWidth={34 * u} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
      </svg>
      <Abs x={W / 2} y={v ? H * 0.31 : H * 0.17}>
        <div style={{...fx(pill), width: 700 * u, height: 130 * u, borderRadius: 999, background: '#0b0b0c', display: 'flex', alignItems: 'center', padding: `0 ${36 * u}px`, gap: 22 * u, boxShadow: `0 ${30 * u}px ${70 * u}px rgba(0,0,0,.25)`}}>
          <svg width={70 * u} height={40 * u} viewBox="0 0 70 40"><rect x="2" y="4" width="58" height="32" rx="9" fill="none" stroke="#8e8e93" strokeWidth="3" /><rect x="7" y="9" width={44 * fill} height="22" rx="5" fill="#30d158" /><rect x="63" y="14" width="5" height="12" rx="2" fill="#8e8e93" /></svg>
          <Txt size={30 * u} w={500} color="#5ab0ff" ls={0} style={{flex: 1}}>Lecture vidéo</Txt>
          <Txt size={84 * u} color="#5ab0ff" style={{transform: `scale(${pop})`, fontVariantNumeric: 'tabular-nums'}}>{count} h</Txt>
        </div>
      </Abs>
      <Abs x={W / 2} y={v ? H * 0.76 : H * 0.8}><Words t={t} size={(v ? 76 : 72) * u} words={[{s: 'Jusqu’à', t: B(30.5)}, {s: '43 heures', t: B(31)}]} /></Abs>
      <Abs x={W / 2} y={v ? H * 0.76 + 96 * u : H * 0.8 + 88 * u}><Txt size={(v ? 76 : 60) * u} w={700} color={GREY} style={fx(blurIn(t, B(31.5), 0.4, {dy: 30 * u, blur: 16}))}>d’autonomie en vidéo.</Txt></Abs>
    </AbsoluteFill>
  );
};

// 7 · Stockage : cascade + clic sur 2 To
const CAPS = ['256 Go', '512 Go', '1 To', '2 To'];
const S7 = ({t, W, H, v, u}) => {
  const out = blurOut(t, B(39) - 0.05, 0.3, {s1: 1.06, dy: -40 * u});
  const rowH = (v ? 140 : 112) * u, step = (v ? 175 : 136) * u, rowW = (v ? 760 : 700) * u;
  const top = v ? H * 0.42 : H * 0.33;
  const cx = W / 2;
  const click = B(37);
  const hk = handAt(t, [
    {t: B(35.6), x: cx + 420 * u, y: top + 4 * step + 200 * u},
    {t: click, x: cx + 220 * u, y: top + 3 * step + 10 * u, click: true},
    {t: B(38.4), x: cx + 460 * u, y: top + 4 * step + 260 * u},
  ]);
  const handOp = lerp(t, B(35.6), B(35.9), 0, 1) * lerp(t, B(38.1), B(38.4), 1, 0);
  const sel = lerp(t, click, click + 0.15, 0, 1, Easing.linear);
  return (
    <AbsoluteFill style={fx(out)}>
      <Abs x={cx} y={v ? H * 0.3 : H * 0.15}><Words t={t} size={(v ? 92 : 80) * u} words={[{s: 'Quelle', t: B(33.3)}, {s: 'capacité ?', t: B(33.8)}]} /></Abs>
      {CAPS.map((s, i) => {
        const a = blurIn(t, B(34.3 + i * 0.5), 0.42, {dy: -70 * u, blur: 22, s0: 0.94});
        const on = i === 3 ? sel : 0;
        const pop = i === 3 ? interpolate(t, [click, click + 0.1, click + 0.28], [1, 1.05, 1], cl) : 1;
        return (
          <Abs key={s} x={cx} y={top + i * step}>
            <div style={{...fx(a), transform: `${fx(a).transform} scale(${pop})`, width: rowW, height: rowH, borderRadius: 34 * u, display: 'flex', alignItems: 'center', gap: 30 * u, padding: `0 ${46 * u}px`, background: on ? `rgba(234,243,255,${on})` : '#fff', boxShadow: `0 ${20 * u}px ${60 * u}px rgba(0,${Math.round(113 * on)},${Math.round(227 * on)},${0.08 + 0.12 * on}), 0 0 0 ${(1 + 3 * on) * u}px ${on > 0.5 ? BLUE : 'rgba(0,0,0,.05)'}`}}>
              <div style={{width: 40 * u, height: 40 * u, borderRadius: '50%', border: on > 0.5 ? 'none' : `${3 * u}px solid #d2d2d7`, background: on > 0.5 ? BLUE : 'transparent'}} />
              <Txt size={(v ? 52 : 46) * u} color={on > 0.5 ? BLUE : INK}>{s}</Txt>
            </div>
          </Abs>
        );
      })}
      <Hand x={hk.x} y={hk.y} s={90 * u} press={hk.press} op={handOp} />
    </AbsoluteFill>
  );
};

// 8 · Les 4 ensemble, en éventail
const S8 = ({t, W, H, v, u}) => {
  const out = blurOut(t, B(44.4), 0.32, {s1: 0.92, blur: 26});
  const ph = v ? 820 * u : 560 * u;
  const cx = W / 2, cy = v ? H * 0.4 : H * 0.4;
  const sp = v ? 200 * u : 190 * u;
  const lay = [['noir', -1.5, -10, 40], ['argent', -0.5, -3, 0], ['glacier', 0.5, 3, 0], ['bordeaux', 1.5, 10, 40]];
  return (
    <AbsoluteFill style={fx(out)}>
      {lay.map(([c, k, rot, dy], i) => {
        const s = spring(t, B(39 + i * 0.5), 0.6, 0.28);
        return (
          <Abs key={c} x={cx + k * sp} y={cy + dy * u + (1 - s) * H * 0.5} style={{zIndex: i, opacity: Math.min(1, s * 2), filter: s < 0.85 ? `blur(${(1 - Math.min(1, s)) * 24}px)` : undefined, transform: `translate(-50%,-50%) rotate(${rot * s}deg)`}}>
            <Phone c={c} h={ph} />
          </Abs>
        );
      })}
      <Abs x={cx} y={v ? H * 0.77 : H * 0.83}><Words t={t} size={(v ? 104 : 84) * u} words={[{s: 'iPhone', t: B(41)}, {s: '18', t: B(41.25)}, {s: 'Pro', t: B(41.5)}, {s: 'Max', t: B(41.75)}]} /></Abs>
      <Abs x={cx} y={v ? H * 0.77 + 120 * u : H * 0.83 + 96 * u}><Txt size={(v ? 56 : 48) * u} w={500} color={GREY} style={fx(blurIn(t, B(42.5), 0.4, {dy: 26 * u, blur: 14}))}>Disponible maintenant.</Txt></Abs>
    </AbsoluteFill>
  );
};

// 9 · Signature : bulle bleue façon iMessage
const S9 = ({t, W, H, v, u}) => {
  const s = spring(t, B(45), 0.5, 0.35);
  const fade = lerp(t, DURATION - 0.6, DURATION, 1, 0, Easing.linear);
  const shine = lerp(t, B(45.6), B(46.8), -0.4, 1.4, io);
  return (
    <AbsoluteFill style={{opacity: fade}}>
      <Glow x={W / 2} y={H / 2} r={260 * u} color="rgba(0,113,227,.12)" op={Math.min(1, s)} />
      <Abs x={W / 2} y={H / 2} style={{opacity: Math.min(1, s * 2), filter: s < 0.85 ? `blur(${(1 - Math.min(1, s)) * 18}px)` : undefined}}>
        <div style={{position: 'relative', transform: `scale(${0.3 + 0.7 * s})`}}>
          <svg width={44 * u} height={26 * u} viewBox="0 0 44 26" style={{position: 'absolute', left: '50%', top: -22 * u, transform: 'translateX(-50%)'}}><path d="M0 26 L22 0 L44 26 Z" fill={BLUE} /></svg>
          <div style={{background: BLUE, borderRadius: 999, padding: `${30 * u}px ${58 * u}px`, boxShadow: `0 ${20 * u}px ${50 * u}px rgba(0,113,227,.3)`, overflow: 'hidden', position: 'relative'}}>
            <Txt size={56 * u} color="#fff" ls={-0.01}>apple store kolwezi</Txt>
            <div style={{position: 'absolute', top: 0, bottom: 0, width: '30%', left: `${shine * 100}%`, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent)', transform: 'skewX(-20deg)'}} />
          </div>
        </div>
      </Abs>
    </AbsoluteFill>
  );
};

// Fenêtres d'affichage de chaque scène (en secondes)
export const SCENES = [
  [S1, 0, B(5) + 0.4], [S2, B(5.9), B(9) + 0.35], [S3, B(9), B(16)], [S4, B(15.8), B(22) + 0.3],
  [S5, B(22.3), B(27) + 0.3], [S6, B(27), B(33) + 0.3], [S7, B(33), B(39) + 0.3], [S8, B(38.9), B(44.4) + 0.35], [S9, B(44.8), DURATION],
];

export const Video = ({vertical, audio = true}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  const t = frame / fps;
  const v = vertical;
  const u = v ? W / 1080 : H / 1080;
  return (
    <AbsoluteFill style={{background: '#fff', overflow: 'hidden'}}>
      <Font />
      {SCENES.map(([S, a, b], i) => (t >= a && t < b ? <S key={i} t={t} W={W} H={H} v={v} u={u} /> : null))}
      {audio && <Audio src={staticFile('mix.wav')} />}
    </AbsoluteFill>
  );
};
