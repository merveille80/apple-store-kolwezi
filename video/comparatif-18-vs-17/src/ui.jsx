import React from 'react';

// Palette Apple épurée : fond blanc, encre, gris. Jaune uniquement pour le surligneur, vert uniquement pour « +6 h » et la validation.
export const C = {
  ink: '#1D1D1F',
  gray: '#86868B',
  gray2: '#AEAEB2',
  gray3: '#D2D2D7',
  line: '#EDEDF0',
  tile: '#F2F2F4',
  bg: '#FFFFFF',
  mark: '#FFE45C',
  green: '#30D158',
};
export const FONT = "'Inter', 'SF Pro Text', 'Helvetica Neue', sans-serif";
export const DISPLAY = "'Inter Display', 'Inter', 'SF Pro Display', 'Helvetica Neue', sans-serif";

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const prog = (t, at, dur) => clamp((t - at) / dur);
export const eo5 = (x) => 1 - Math.pow(1 - x, 5);
export const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const back = (x, c1 = 1.2) => 1 + (c1 + 1) * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
export const lerp = (a, b, x) => a + (b - a) * x;

// Apparition calme : monte de quelques pixels et se défloute
export const appear = (t, at, dur = 0.7, dy = 22) => {
  const x = eo5(prog(t, at, dur));
  return {opacity: clamp(x * 1.3), transform: `translateY(${(1 - x) * dy}px)`, filter: x < 1 ? `blur(${(1 - x) * 8}px)` : undefined};
};

// Pop doux 0,9 → 1
export const pop = (t, at, dur = 0.55) => {
  const x = prog(t, at, dur);
  const s = x <= 0 ? 0 : back(x);
  return {opacity: clamp(x * 3), transform: `scale(${0.9 + 0.1 * s})`};
};

// Calque de scène : fondu avec léger zoom traversant (transitions posées, ton calme)
export const Layer = ({t, from, to, children, fadeIn = 0.5, fadeOut = 0.5}) => {
  if (t < from - 0.01 || t > to + 0.01) return null;
  const i = fadeIn ? eo5(prog(t, from, fadeIn)) : 1;
  const o = fadeOut ? eio(prog(t, to - fadeOut, fadeOut)) : 0;
  const scale = lerp(0.97, 1, i) * lerp(1, 1.06, o);
  const blur = (1 - i) * 8 + o * 12;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: i * (1 - o), transform: `scale(${scale})`, filter: blur > 0.05 ? `blur(${blur}px)` : undefined}}>
      {children}
    </div>
  );
};

export const shadow = '0 30px 60px rgba(0,0,0,.08), 0 8px 18px rgba(0,0,0,.05)';

export const Card = ({children, style, flat}) => (
  <div style={{background: '#fff', borderRadius: 44, border: `1px solid ${C.line}`, boxShadow: flat ? undefined : shadow, fontFamily: FONT, color: C.ink, ...style}}>{children}</div>
);

// Positionne un bloc centré horizontalement sur x (par défaut le milieu), à partir du haut y
export const At = ({x, y, children, style}) => (
  <div style={{position: 'absolute', left: x === undefined ? 0 : x, right: x === undefined ? 0 : undefined, top: y, display: 'flex', justifyContent: 'center', transform: x === undefined ? undefined : 'translateX(-50%)', ...style}}>
    {children}
  </div>
);

export const T = (size, weight = 700, color = C.ink) => ({
  fontFamily: size >= 40 ? DISPLAY : FONT,
  fontSize: size,
  fontWeight: weight,
  color,
  letterSpacing: size >= 40 ? -size * 0.032 : -0.2,
  lineHeight: 1.08,
  whiteSpace: 'nowrap',
});

// Surligneur jaune qui se trace de gauche à droite
export const Mark = ({t, at, children, dur = 0.55}) => {
  const p = eo5(prog(t, at, dur));
  return (
    <span style={{backgroundImage: `linear-gradient(${C.mark}, ${C.mark})`, backgroundRepeat: 'no-repeat', backgroundPosition: '0 88%', backgroundSize: `${p * 100}% 34%`, padding: '0 0.06em'}}>{children}</span>
  );
};

// Mots qui arrivent un par un, calés sur la voix. items : [[mot, instant], …] ; un mot peut être un élément React.
export const Words = ({t, items, style, gap = '0.26em'}) => (
  <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: gap, ...style}}>
    {items.map(([w, at], i) => (
      <span key={i} style={{display: 'inline-block', ...appear(t, at, 0.6, 16)}}>{w}</span>
    ))}
  </div>
);

// Pastille d'étape en haut d'écran
export const Step = ({t, at, children}) => (
  <div style={{...appear(t, at, 0.6, 12), display: 'inline-flex', alignItems: 'center', gap: 14, padding: '14px 28px', borderRadius: 999, background: C.tile, fontFamily: FONT, fontSize: 28, fontWeight: 600, color: C.gray, letterSpacing: 0.4}}>
    {children}
  </div>
);

export const Check = ({size = 56, bg = C.ink}) => (
  <div style={{width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
    <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </div>
);

export const Cursor = ({size = 64}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.25))'}}>
    <path d="M5 3l14 7.5-6.2 1.6L10 18.5z" fill={C.ink} stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

// Diaphragme : 9 lames, open = rayon de l'ouverture (px)
export const Iris = ({r, open, spin = 0}) => {
  const n = 9;
  const hole = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + spin;
    hole.push(`${(open * Math.cos(a)).toFixed(2)},${(open * Math.sin(a)).toFixed(2)}`);
  }
  // lames : un trait par sommet, tangent à l'ouverture
  const blades = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + spin;
    const x1 = open * Math.cos(a), y1 = open * Math.sin(a);
    const b = a + Math.PI / 2 + 0.35;
    blades.push(<line key={i} x1={x1} y1={y1} x2={x1 + Math.cos(b) * r * 1.4} y2={y1 + Math.sin(b) * r * 1.4} stroke="#3A3A3C" strokeWidth={2} />);
  }
  const id = `iris${Math.round(r)}`;
  return (
    <svg width={r * 2 + 16} height={r * 2 + 16} viewBox={`${-r - 8} ${-r - 8} ${r * 2 + 16} ${r * 2 + 16}`} style={{display: 'block'}}>
      <defs><clipPath id={id}><circle r={r - 14} /></clipPath></defs>
      <circle r={r} fill={C.ink} />
      <circle r={r - 14} fill="#242426" />
      <g clipPath={`url(#${id})`}>{blades}</g>
      <polygon points={hole.join(' ')} fill="#fff" />
      <circle r={r} fill="none" stroke={C.gray3} strokeWidth={6} />
    </svg>
  );
};
