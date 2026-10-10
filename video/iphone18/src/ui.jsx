import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, FONT, DISPLAY} from './theme';

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const prog = (t, at, dur) => clamp((t - at) / dur);
export const eo = (x) => 1 - Math.pow(1 - x, 3);
export const eo5 = (x) => 1 - Math.pow(1 - x, 5);
export const eox = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
export const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const eio5 = (x) => (x < 0.5 ? 16 * Math.pow(x, 5) : 1 - Math.pow(-2 * x + 2, 5) / 2);
export const back = (x, c1 = 1.25) => {
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
export const lerp = (a, b, x) => a + (b - a) * x;

// Apparition : glisse vers le haut et se défloute, courbe quint (départ vif, arrivée très douce)
export const appear = (t, at, dur = 0.6, dy = 18) => {
  const x = eo5(prog(t, at, dur));
  return {opacity: clamp(x * 1.4), transform: `translateY(${(1 - x) * dy}px)`, filter: x < 1 ? `blur(${(1 - x) * 6}px)` : undefined};
};

// Pop discret : 0,86 → 1 avec un dépassement léger
export const pop = (t, at, dur = 0.6) => {
  const x = prog(t, at, dur);
  const s = x <= 0 ? 0 : back(x);
  return {opacity: clamp(x * 4), transform: `scale(${0.86 + 0.14 * s})`};
};

// Calque de scène : fondu + zoom traversant
export const Layer = ({t, from, to, children, zoomIn = 0.35, zoomOut = 0.45, outScale = 1.8, inScale = 0.92, style}) => {
  if (t < from - 0.01 || t > to + 0.01) return null;
  const i = zoomIn ? eo5(prog(t, from, zoomIn)) : 1;
  const o = zoomOut ? eio(prog(t, to - zoomOut, zoomOut)) : 0;
  const scale = lerp(inScale, 1, i) * lerp(1, outScale, o);
  const blur = (1 - i) * 6 + o * 10;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: i * (1 - o), transform: `scale(${scale})`, filter: blur > 0.05 ? `blur(${blur}px)` : undefined, ...style}}>
      {children}
    </div>
  );
};

// Fond : blanc pur + grille fine très claire, dérive lente
export const GridBg = ({t}) => (
  <div style={{position: 'absolute', inset: -60, background: C.bg, overflow: 'hidden'}}>
    <div style={{position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${C.grid} 1px, transparent 1px), linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`, backgroundSize: '48px 48px', transform: `translate(${-(t * 4) % 48}px, ${-(t * 3) % 48}px)`}} />
  </div>
);

export const shadow = '0 30px 70px -30px rgba(0,0,0,.20), 0 4px 14px -4px rgba(0,0,0,.06)';
export const shadowSoft = '0 16px 40px -18px rgba(0,0,0,.16), 0 2px 6px -2px rgba(0,0,0,.05)';

export const Card = ({children, style}) => (
  <div style={{background: '#fff', borderRadius: 22, boxShadow: shadow, border: `1px solid ${C.line}`, fontFamily: FONT, ...style}}>{children}</div>
);

// Pilule : dark (noir), light (blanc bordé), tile (gris clair)
export const Pill = ({children, style, kind = 'dark'}) => {
  const k = {
    dark: {background: C.ink, color: '#fff', boxShadow: '0 14px 30px -14px rgba(0,0,0,.5)'},
    light: {background: '#fff', color: C.ink, border: `1px solid ${C.line}`, boxShadow: shadowSoft},
    tile: {background: C.tile, color: C.ink},
  }[kind];
  return (
    <div style={{display: 'inline-flex', alignItems: 'center', gap: 10, padding: '11px 22px', borderRadius: 999, fontFamily: FONT, fontWeight: 600, fontSize: 20, whiteSpace: 'nowrap', ...k, ...style}}>{children}</div>
  );
};

export const Center = ({children, style}) => (
  <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style}}>{children}</div>
);

// Icônes SVG au trait
export const Icon = ({name, size = 22, color = 'currentColor', sw = 1.9}) => {
  const p = {fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round'};
  const paths = {
    globe: <><circle cx="12" cy="12" r="9" {...p} /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" {...p} /></>,
    phone: <><rect x="7" y="2.5" width="10" height="19" rx="2.5" {...p} /><path d="M11 18.5h2" {...p} /></>,
    gear: <><circle cx="12" cy="12" r="3.2" {...p} /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" {...p} /></>,
    code: <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" {...p} />,
    spark: <path d="M12 2.5l2.2 6.3 6.3 2.2-6.3 2.2L12 19.5l-2.2-6.3L3.5 11l6.3-2.2z" {...p} />,
    shield: <><path d="M12 2.5l8 3v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-6z" {...p} /><path d="M8.5 12l2.5 2.5 4.5-5" {...p} /></>,
    cloud: <path d="M7 18.5h10.5a4 4 0 0 0 .5-8 6 6 0 0 0-11.6 1.5A3.3 3.3 0 0 0 7 18.5z" {...p} />,
    check: <path d="M5 12.5l4.5 4.5L19 7.5" {...p} />,
    x: <path d="M7 7l10 10M17 7L7 17" {...p} />,
    clock: <><circle cx="12" cy="12" r="9" {...p} /><path d="M12 7v5l3.5 2" {...p} /></>,
    users: <><circle cx="9" cy="8" r="3.5" {...p} /><path d="M2.5 20c.8-3.6 3.3-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.8c1.6.8 2.6 2.5 3 5.2" {...p} /></>,
    chart: <path d="M3 20h18M5 16l4.5-5 3.5 3.5L20 6.5M15 6.5h5v5" {...p} />,
    bot: <><rect x="4" y="8" width="16" height="11" rx="3.5" {...p} /><path d="M12 4v4M9 13h.01M15 13h.01" {...p} /></>,
    building: <><rect x="4" y="3" width="11" height="18" rx="1.5" {...p} /><path d="M15 9h4.5v12H15M7.5 7h4M7.5 11h4M7.5 15h4" {...p} /></>,
    rocket: <path d="M5 19c0-3 1-5 3-6l3 3c-1 2-3 3-6 3zM9 12c2-6 6-9 11-9 0 5-3 9-9 11zM15 8.5h.01" {...p} />,
    plus: <path d="M12 5v14M5 12h14" {...p} />,
    arrow: <path d="M4 12h15M13 6l6 6-6 6" {...p} />,
    cursor: <path d="M5 3l14 7.5-6.2 1.6L10 18.5z" fill={color} stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />,
    lock: <><rect x="5" y="10.5" width="14" height="10" rx="2.5" {...p} /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" {...p} /></>,
    send: <path d="M4 12l16-8-6 16-2.5-6.5z" {...p} />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', flexShrink: 0}}>{paths[name]}</svg>;
};

// Tuile d'icône grise (comme sur le site)
export const IconTile = ({name, size = 44, dark, style}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.3, background: dark ? C.ink : C.tile, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...style}}>
    <Icon name={name} size={size * 0.48} color={dark ? '#fff' : C.ink} />
  </div>
);

// Puce flottante blanche (Sites Web, Cloud…)
export const Chip = ({icon, label, style}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 12, padding: '10px 20px 10px 10px', borderRadius: 18, background: '#fff', boxShadow: shadowSoft, border: `1px solid ${C.line}`, fontFamily: FONT, fontSize: 18, fontWeight: 500, color: C.ink, whiteSpace: 'nowrap', ...style}}>
    <IconTile name={icon} size={38} />
    {label}
  </div>
);

// Vrai logo CyberSpace (extrait du fichier fourni)
export const Mark = ({size = 100, white, style}) => (
  <Img src={staticFile(white ? 'cs-mark-w.png' : 'cs-mark.png')} style={{width: size, height: size * (919 / 1148), display: 'block', ...style}} />
);

// Lockup complet : marque + « Cyber Space » + « THE FUTUR IS NOW », proportions du logo d'origine.
// size = largeur de la marque. reveal (0→1) déroule le nom, tag (0→1) fait apparaître la signature.
export const Lockup = ({size = 140, reveal = 1, tag = 1, markStyle}) => {
  const word = {left: 1.075, top: 0.165, w: 0.653, h: 0.439};
  const tg = {left: 1.08, top: 0.666, w: 0.664, h: 0.0575};
  const fullW = size * (word.left + Math.max(word.w, tg.w));
  const markW = size;
  const width = lerp(markW, fullW, reveal);
  return (
    <div style={{position: 'relative', width, height: size * 0.8}}>
      <div style={{position: 'absolute', left: 0, top: 0, ...markStyle}}><Mark size={size} /></div>
      <div style={{position: 'absolute', left: size * word.left, top: size * word.top, width: size * word.w * reveal + 2, height: size * word.h, overflow: 'hidden'}}>
        <Img src={staticFile('cs-word.png')} style={{width: size * word.w, height: size * word.h, display: 'block', transform: `translateX(${(1 - reveal) * -size * 0.25}px)`, opacity: reveal}} />
      </div>
      <Img src={staticFile('cs-tag.png')} style={{position: 'absolute', left: size * tg.left, top: size * tg.top, width: size * tg.w, height: size * tg.h, opacity: tag, transform: `translateY(${(1 - tag) * 8}px)`, filter: tag < 1 ? `blur(${(1 - tag) * 4}px)` : undefined}} />
    </div>
  );
};

export const H = (size, weight = 700, color = C.ink) => ({fontFamily: size >= 40 ? DISPLAY : FONT, fontSize: size, fontWeight: weight, color, letterSpacing: size >= 40 ? -size * 0.035 : -0.4, lineHeight: 1.08, whiteSpace: 'nowrap'});
