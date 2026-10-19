import React from 'react';
import {Img, staticFile} from 'remotion';

// Langage visuel de la vidéo de référence : fond blanc, bulles iMessage, surligneur jaune, rouge pour barrer, vert pour valider.
export const C = {
  bg: '#FCFCFC',
  ink: '#080808',
  gray: '#7E7D80',
  ghost: '#ADACAF',
  bubble: '#E8E7EA',
  mark: '#FFE04D',
  red: '#DF3322',
  blue: '#0983FE',
  green: '#2ECC5B',
  night: '#464ADF',
};
// Sur le Mac, -apple-system donne San Francisco ; Inter sert de secours dans le cloud.
export const FONT = "-apple-system, 'SF Pro Display', 'Inter Display', 'Inter', 'Helvetica Neue', sans-serif";

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const prog = (t, at, dur) => clamp((t - at) / dur);
export const eo = (x) => 1 - Math.pow(1 - x, 4);
export const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const lerp = (a, b, x) => a + (b - a) * x;

// Ressort amorti (≈ damping 14, stiffness 180) : 0 → 1 avec ~8 % de dépassement
export const spring = (t, at, dur = 0.5) => {
  const x = (t - at) / dur;
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return 1 - Math.exp(-6 * x) * Math.cos(7.5 * x);
};

// Entrée de carte de la référence : flou 24→0, fondu, échelle 0,9→1 (cubic-bezier(.22,1,.36,1) ≈ eo)
export const enter = (t, at, dur = 0.24, dy = 0) => {
  const x = eo(prog(t, at, dur));
  if (x >= 1) return {};
  return {opacity: x, transform: `translateY(${(1 - x) * dy}px) scale(${0.9 + 0.1 * x})`, filter: `blur(${(1 - x) * 24}px)`};
};

// Pop à ressort (bulles, pilules, coches)
export const pop = (t, at, dur = 0.45, from = 0.6) => {
  if (t < at) return {opacity: 0, transform: `scale(${from})`};
  const s = spring(t, at, dur);
  return {opacity: clamp((t - at) / 0.08), transform: `scale(${from + (1 - from) * s})`};
};

// Calque de scène : entrée rapide floutée, micro-travelling avant permanent, sortie par réduction rapide.
export const Scene = ({t, from, to, children, bg, push = 0.035, cutIn = false, cutOut = false}) => {
  if (t < from - 0.001 || t > to + 0.001) return null;
  const i = cutIn ? 1 : eo(prog(t, from, 0.24));
  const o = cutOut ? 0 : prog(t, to - 0.12, 0.12) ** 2;
  const drift = 1 + push * prog(t, from, to - from);
  const scale = (0.94 + 0.06 * i) * drift * (1 - 0.35 * o);
  const blur = (1 - i) * 20 + o * 14;
  return (
    <div style={{position: 'absolute', inset: 0, background: bg, opacity: i * (1 - o), transform: `scale(${scale})`, filter: blur > 0.05 ? `blur(${blur}px)` : undefined}}>
      {children}
    </div>
  );
};

export const Center = ({children, style}) => (
  <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', ...style}}>{children}</div>
);

export const T = (size, weight = 600, color = C.ink) => ({
  fontFamily: FONT,
  fontSize: size,
  fontWeight: weight,
  color,
  letterSpacing: `${-0.015 - (size > 90 ? 0.015 : 0)}em`,
  lineHeight: 1.18,
});

// Mots qui apparaissent un à un sur l'attaque de la voix. items : [[mot, instant], …]
export const Words = ({t, items, style, gap = '0.25em', align = 'center'}) => (
  <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: align, columnGap: gap, ...style}}>
    {items.map(([w, at], i) => {
      const x = eo(prog(t, at, 0.16));
      return (
        <span key={i} style={{display: 'inline-block', opacity: x, transform: `translateY(${(1 - x) * 14}px)`, filter: x < 1 ? `blur(${(1 - x) * 8}px)` : undefined}}>{w}</span>
      );
    })}
  </div>
);

// Mots déjà affichés en gris qui noircissent quand ils sont prononcés (bulles de la référence)
export const Ink = ({t, items}) => (
  <>
    {items.map(([w, at], i) => {
      const x = prog(t, at, 0.1);
      return (
        <span key={i} style={{color: x >= 1 ? C.ink : x <= 0 ? C.ghost : `rgb(${lerp(173, 8, x)},${lerp(172, 8, x)},${lerp(175, 8, x)})`}}>{w}{i < items.length - 1 ? ' ' : ''}</span>
      );
    })}
  </>
);

// Surligneur jaune qui avance de gauche à droite
export const Mark = ({t, at, children, dur = 0.35}) => {
  const p = eo(prog(t, at, dur));
  return (
    <span style={{backgroundImage: `linear-gradient(${C.mark}, ${C.mark})`, backgroundRepeat: 'no-repeat', backgroundPosition: '0 60%', backgroundSize: `${p * 100}% 78%`, padding: '0 0.1em', margin: '0 -0.04em', borderRadius: 6}}>{children}</span>
  );
};

// Trait rouge qui barre un mot (12 images à 60 i/s ≈ 0,2 s)
export const Strike = ({t, at, children, color = C.red}) => {
  const p = eo(prog(t, at, 0.22));
  return (
    <span style={{position: 'relative', display: 'inline-block'}}>
      {children}
      <span style={{position: 'absolute', left: '-3%', top: '52%', height: '0.12em', width: `${p * 106}%`, background: color, borderRadius: 99}} />
    </span>
  );
};

export const shadow = '0 30px 120px rgba(0,0,0,0.08), 0 6px 20px rgba(0,0,0,0.04)';

export const Card = ({children, style}) => (
  <div style={{background: '#fff', borderRadius: 48, boxShadow: shadow, fontFamily: FONT, color: C.ink, ...style}}>{children}</div>
);

export const Pill = ({children, style}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 20, background: '#fff', borderRadius: 999, boxShadow: shadow, padding: '24px 44px', ...T(50, 600), whiteSpace: 'nowrap', ...style}}>{children}</div>
);

export const Avatar = ({size = 78, emoji = '🙂', bg = '#F3D9BD'}) => (
  <div style={{width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.6, flexShrink: 0}}>{emoji}</div>
);

// Bulle de discussion avec avatar ; elle naît d'un pop à ressort depuis l'avatar
export const Bubble = ({t, at, children, width = 900, size = 56, style}) => {
  const s = t < at ? 0 : spring(t, at, 0.5);
  return (
    <div style={{display: 'flex', alignItems: 'flex-end', gap: 22, width, opacity: clamp((t - at) / 0.08), ...style}}>
      <Avatar />
      <div style={{transformOrigin: '0% 100%', transform: `scale(${0.6 + 0.4 * s})`, background: C.bubble, borderRadius: 54, padding: '32px 44px', ...T(size, 450), lineHeight: 1.24}}>{children}</div>
    </div>
  );
};

export const Check = ({size = 62, on = 1}) => (
  <div style={{width: size, height: size, borderRadius: '50%', background: on > 0 ? C.green : C.bubble, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transform: `scale(${0.4 + 0.6 * on})`}}>
    {on > 0 && <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
  </div>
);

// Icônes au trait façon SF Symbols
const I = ({d, size, color = C.ink, fill}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', flexShrink: 0}}>
    <path d={d} fill={fill || 'none'} stroke={fill ? 'none' : color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const Icon = {
  pin: (s = 44) => <I size={s} fill={C.red} d="M12 2.5a7 7 0 0 0-7 7c0 5.2 7 12 7 12s7-6.8 7-12a7 7 0 0 0-7-7zm0 9.6a2.6 2.6 0 1 1 0-5.2 2.6 2.6 0 0 1 0 5.2z" />,
  bolt: (s = 40) => <I size={s} fill="#FFB800" d="M13.5 2 4.5 13.5h6L9.5 22l9-11.5h-6z" />,
  camera: (s = 40) => <I size={s} d="M4 7.5h3l1.6-2.5h6.8L17 7.5h3a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18V9A1.5 1.5 0 0 1 4 7.5zM12 16.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2z" />,
  battery: (s = 40) => <I size={s} color={C.green} d="M3 8h15a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 18 16H3a1.5 1.5 0 0 1-1.5-1.5v-5A1.5 1.5 0 0 1 3 8zM22 10.5v3M4.5 11v2h9v-2z" />,
  chat: (s = 40) => <I size={s} color={C.green} d="M12 3.5c-4.7 0-8.5 3.4-8.5 7.6 0 2.2 1 4.1 2.7 5.5L5.5 20.5l4-1.8c.8.2 1.6.3 2.5.3 4.7 0 8.5-3.4 8.5-7.6S16.7 3.5 12 3.5z" />,
  photo: (s = 40) => <I size={s} color="#FF9500" d="M4 4.5h16a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18V6A1.5 1.5 0 0 1 4 4.5zM2.5 16l5-5 4 4 3-3 7 6.5M16 9.2a1.4 1.4 0 1 0 0-.1z" />,
  heart: (s = 40) => <I size={s} fill="#FF2D55" d="M12 20.5s-8-4.9-8-10.6A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 8 2.6c0 5.7-8 10.6-8 10.6z" />,
};

// Photo produit détourée avec ombre portée douce
export const Phone = ({src, h, style}) => (
  <Img src={staticFile(src)} style={{height: h, width: 'auto', display: 'block', filter: 'drop-shadow(0 40px 50px rgba(0,0,0,.16)) drop-shadow(0 8px 14px rgba(0,0,0,.08))', ...style}} />
);

// Nom de la boutique (pas de logo fourni pour l'instant)
export const Brand = ({size = 120, color = C.ink, oneLine = false}) => (
  <div style={{...T(size, 700, color), letterSpacing: '-0.035em', textAlign: 'center', lineHeight: 1.02}}>
    Apple Store{oneLine ? ' ' : <br />}Kolwezi
  </div>
);
