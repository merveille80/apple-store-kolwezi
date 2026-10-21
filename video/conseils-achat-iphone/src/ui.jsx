import React from 'react';
import {Img, staticFile} from 'remotion';

// Langage visuel de la vidéo de référence : fond blanc, bulles iMessage, surligneur jaune, rouge pour barrer, vert pour valider.
export const C = {
  bg: '#FFFFFF',
  ink: '#080808',
  gray: '#7E7D80',
  ghost: '#ADACAF',
  bubble: '#E8E7EA',
  mark: '#FFE04D',
  red: '#DF3322',
  blue: '#0983FE',
  green: '#2ECC5B',
  night: '#464ADF',
  // v3 : plus aucun rouge, UI neutre façon Apple (encre, gris, bleu de sélection iOS)
  accent: '#1D1D1F',
  glow: 'rgba(0,0,0,.14)',
  lime: '#1FC46A',
  select: '#0071E3',
  soft: '#F5F5F7',
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
  return 1 - Math.exp(-6.5 * x) * Math.cos(5.2 * x); // v5 : ressort plus amorti, façon iOS (≈ 3 % de dépassement)
};

// Entrée de carte de la référence : flou 24→0, fondu, échelle 0,9→1 (cubic-bezier(.22,1,.36,1) ≈ eo)
export const enter = (t, at, dur = 0.24, dy = 0) => {
  const x = eo(prog(t, at, dur * 1.4));
  if (x >= 1) return {};
  return {opacity: x, transform: `translateY(${(1 - x) * (dy || 24)}px) scale(${0.95 + 0.05 * x})`, filter: `blur(${(1 - x) * 14}px)`};
};

// Pop à ressort (bulles, pilules, coches)
export const pop = (t, at, dur = 0.45, from = 0.6) => {
  if (t < at) return {opacity: 0, transform: `scale(${from})`};
  const s = spring(t, at, dur);
  return {opacity: clamp((t - at) / 0.08), transform: `scale(${from + (1 - from) * s})`};
};

// Flou de bougé directionnel (filtre SVG, flou horizontal ou vertical seulement)
export const MotionBlur = ({id, x = 0, y = 0, children, style}) => {
  const on = x > 0.3 || y > 0.3;
  return (
    <div style={{...style, filter: on ? `url(#${id})` : style && style.filter}}>
      {on && (
        <svg width="0" height="0" style={{position: 'absolute'}}>
          <filter id={id} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={`${x} ${y}`} /></filter>
        </svg>
      )}
      {children}
    </div>
  );
};

// Calque de scène v5 : transitions façon keynote Apple, toujours en fondu enchaîné (plus aucune coupe sèche).
// Entrée : la scène monte légèrement, de 0,97 à 1, en sortant du flou. Sortie : elle continue de monter et
// s'efface pendant que la suivante arrive (chevauchement de 0,3 s). out = 'zoom' : sortie en avançant vers la caméra.
const OVER = 0.3;
export const Scene = ({t, from, to, children, bg, push = 0.035, out = 'rise', first = false, last = false, id = 's'}) => {
  const end = last ? to : to + OVER;
  if (t < from - 0.001 || t > end + 0.001) return null;
  const i = first ? 1 : eio(prog(t, from, 0.5));
  const o = last ? 0 : eio(prog(t, to - 0.05, OVER + 0.05));
  const drift = 1 + push * prog(t, from, to - from);
  let scale = (0.97 + 0.03 * i) * drift, ty = (1 - i) * 40, blur = (1 - i) * 10;
  if (out === 'zoom') {
    scale *= 1 + 0.12 * o;
    blur += o * 12;
  } else {
    ty -= o * 60;
    blur += o * 8;
  }
  return (
    <div style={{position: 'absolute', inset: 0, background: bg, opacity: i * (1 - o)}}>
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${ty}px) scale(${scale})`, filter: blur > 0.05 ? `blur(${blur}px)` : undefined}}>
        {children}
      </div>
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
// v3 : le mot monte d'en bas, flou → net, sans couleur ni halo.
export const Words = ({t, items, style, gap = '0.25em', align = 'center'}) => (
  <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: align, columnGap: gap, ...style}}>
    {items.map(([w, at], i) => {
      const x = eo(prog(t, at - 0.04, 0.34));
      return (
        <span key={i} style={{display: 'inline-block', opacity: eo(prog(t, at - 0.04, 0.2)), transform: `translateY(${(1 - x) * 0.3}em) scale(${0.94 + 0.06 * x})`, transformOrigin: '50% 100%', filter: x < 1 ? `blur(${(1 - x) * 7}px)` : undefined}}>{w}</span>
      );
    })}
  </div>
);

// Mots déjà affichés en gris qui noircissent quand ils sont prononcés (bulles de la référence)
export const Ink = ({t, items}) => (
  <>
    {items.map(([w, at], i) => {
      const x = eio(prog(t, at - 0.02, 0.18));
      const base = x >= 1 ? C.ink : x <= 0 ? C.ghost : `rgb(${lerp(173, 8, x)},${lerp(172, 8, x)},${lerp(175, 8, x)})`;
      return (
        <span key={i} style={{color: base}}>{w}{i < items.length - 1 ? ' ' : ''}</span>
      );
    })}
  </>
);

// v3 : sélection de texte iOS standard (poignées bleues + fond bleu pâle), le texte garde sa couleur
export const Mark = ({t, at, children, dur = 0.35}) => {
  const p = eo(prog(t, at, dur));
  const h = spring(t, at, 0.45);
  const on = t >= at;
  const Handle = ({top}) => (
    <span style={{position: 'absolute', [top ? 'left' : 'right']: '-0.06em', top: top ? '-0.08em' : undefined, bottom: top ? undefined : '-0.12em', width: '0.05em', height: '1.18em', background: C.select, borderRadius: 9, transform: `scaleY(${h})`, transformOrigin: top ? '50% 100%' : '50% 0%'}}>
      <span style={{position: 'absolute', left: '50%', [top ? 'top' : 'bottom']: '-0.12em', width: '0.17em', height: '0.17em', marginLeft: '-0.085em', borderRadius: '50%', background: C.select}} />
    </span>
  );
  return (
    <span style={{position: 'relative', display: 'inline-block', padding: '0 0.06em', margin: '0 0.02em', backgroundImage: 'linear-gradient(rgba(0,113,227,.16), rgba(0,113,227,.16))', backgroundRepeat: 'no-repeat', backgroundSize: `${p * 100}% 100%`, borderRadius: '0.08em'}}>
      {children}
      {on && <><Handle top /><Handle /></>}
    </span>
  );
};

// Trait fin qui barre un mot (v3 : couleur du texte, sans halo)
export const Strike = ({t, at, children, color = C.ink}) => {
  const p = eo(prog(t, at, 0.22));
  return (
    <span style={{position: 'relative', display: 'inline-block'}}>
      {children}
      <span style={{position: 'absolute', left: '-3%', top: '52%', height: '0.075em', width: `${p * 106}%`, background: color, borderRadius: 99}} />
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

// v2 : la bulle devient une carte de message façon notification (en-tête avatar + nom + heure), entrée en pop à ressort
export const Bubble = ({t, at, children, width = 900, size = 56, style, name = 'Client', time = 'maintenant'}) => {
  const s = t < at ? 0 : spring(t, at, 0.5);
  return (
    <div style={{width, opacity: clamp((t - at) / 0.08), transform: `translateY(${(1 - s) * 40}px) scale(${0.86 + 0.14 * s})`, filter: s < 0.6 ? `blur(${(0.6 - s) * 20}px)` : undefined, ...style}}>
      <div style={{background: '#fff', borderRadius: 44, boxShadow: '0 24px 70px rgba(0,0,0,.09), 0 2px 8px rgba(0,0,0,.04)', padding: '34px 44px 40px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20}}>
          <Avatar size={64} />
          <div style={{...T(34, 650)}}>{name}<span style={{color: C.gray, fontWeight: 450}}> · {time}</span></div>
          <div style={{marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', background: C.lime}} />
        </div>
        <div style={{...T(size, 500), lineHeight: 1.26}}>{children}</div>
      </div>
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
  pin: (s = 44) => <I size={s} fill={C.ink} d="M12 2.5a7 7 0 0 0-7 7c0 5.2 7 12 7 12s7-6.8 7-12a7 7 0 0 0-7-7zm0 9.6a2.6 2.6 0 1 1 0-5.2 2.6 2.6 0 0 1 0 5.2z" />,
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

// Nom de la boutique en texte (secours ; le logo officiel est LogoReveal)
export const Brand = ({size = 120, color = C.ink, oneLine = false}) => (
  <div style={{...T(size, 700, color), letterSpacing: '-0.035em', textAlign: 'center', lineHeight: 1.02}}>
    Apple Store{oneLine ? ' ' : <br />}Kolwezi
  </div>
);

// Compteur à rouleaux (référence 2 : $0.14 → $328.00) : chaque caractère qui change roule verticalement avec flou
export const Roll = ({t, steps, style}) => {
  // steps : [[texte, instant], …]
  let k = 0;
  for (let i = 0; i < steps.length; i++) if (t >= steps[i][1]) k = i;
  const cur = steps[k][0];
  const prev = k > 0 ? steps[k - 1][0] : cur;
  const p = k > 0 ? eo(prog(t, steps[k][1], 0.32)) : 1;
  const n = Math.max(cur.length, prev.length);
  return (
    <span style={{display: 'inline-flex', ...style}}>
      {Array.from({length: n}).map((_, i) => {
        const a = prev[i] || '', b = cur[i] || '';
        if (a === b || p >= 1) return <span key={i} style={{whiteSpace: 'pre'}}>{b}</span>;
        const d = Math.sin(Math.PI * p) * 6;
        return (
          <span key={i} style={{position: 'relative', display: 'inline-block', overflow: 'hidden', whiteSpace: 'pre', verticalAlign: 'top'}}>
            <span style={{visibility: 'hidden'}}>{b.length >= a.length ? b : a}</span>
            <span style={{position: 'absolute', left: 0, top: 0, transform: `translateY(${-p * 100}%)`, filter: `blur(${d}px)`, opacity: 1 - p}}>{a}</span>
            <span style={{position: 'absolute', left: 0, top: 0, transform: `translateY(${(1 - p) * 100}%)`, filter: `blur(${d}px)`}}>{b}</span>
          </span>
        );
      })}
    </span>
  );
};

// Cibles concentriques (plan du téléphone) : deux anneaux gris clair qui naissent d'un point (v3 : sans rouge)
export const Rings = ({t, at, size = 700}) => {
  const a = spring(t, at, 0.7), b = spring(t, at + 0.08, 0.7);
  if (t < at) return null;
  return (
    <div style={{position: 'absolute', left: '50%', top: '50%', width: 0, height: 0}}>
      <div style={{position: 'absolute', width: size, height: size, left: -size / 2, top: -size / 2, borderRadius: '50%', border: `${size * 0.035}px solid #E8E8ED`, transform: `scale(${a})`}} />
      <div style={{position: 'absolute', width: size * 0.7, height: size * 0.7, left: -size * 0.35, top: -size * 0.35, borderRadius: '50%', border: `${size * 0.11}px solid ${C.soft}`, transform: `scale(${b})`, boxShadow: 'inset 0 10px 40px rgba(0,0,0,.04)'}} />
    </div>
  );
};

// Nom de la boutique en petit texte, minuscules, façon Apple (v4 : remplace le logo image).
// Chaque mot sort du flou en montant légèrement ; l'interlettrage se resserre pendant l'entrée.
export const LogoReveal = ({t, at, width = 700, style}) => {
  const size = Math.round(width * 0.085);
  const words = [['apple', 600, C.ink], ['store', 600, C.ink], ['kolwezi', 400, C.gray]];
  return (
    <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: size * 0.28, whiteSpace: 'nowrap', ...style}}>
      {words.map(([w, wt, col], i) => {
        const p = eo(prog(t, at + i * 0.12, 0.7));
        return (
          <span key={w} style={{...T(size, wt, col), letterSpacing: `${0.06 * (1 - p) - 0.01}em`, opacity: p, transform: `translateY(${(1 - p) * size * 0.4}px)`, filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined, display: 'inline-block'}}>{w}</span>
        );
      })}
    </div>
  );
};
