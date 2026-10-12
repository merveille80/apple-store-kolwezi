import React from 'react';
import {useCurrentFrame, useVideoConfig, Img, staticFile, Audio} from 'remotion';
import {clamp, prog, eo, eo5, eio, eio5, back, lerp, appear, pop, Layer, GridBg, Pill, Center, shadow, shadowSoft} from './ui';

// Pub iPhone 18 Pro Max · Apple Store Kolwezi
// Tous les horaires sont en secondes absolues : voix Théo (v2, prise 1) décalée de OFF,
// musique = le son de merveille dont le grand retour (58,36 s du fichier) tombe sur DROP (voir musique.py).
export const OFF = 0.36;
const w = (x) => x + OFF; // temps d'un mot de la prise → temps vidéo
export const DUR = 48.5;
const T = {
  delestage: w(0.151), trois: w(2.28), soiree: w(3.467),
  s2: 5.45, connait: w(5.387), photos: w(7.314), rame: w(9.867), stockage: w(11.04), sature: w(11.667), pire: w(12.453),
  s3: 13.75, aider: w(13.52), pas: w(15.08), lacher: w(15.64), gap: 16.05,
  drop: 16.55, aifone: w(16.76),
  s5: 18.75, batterie: w(18.48), courant: w(20.912),
  s6: 22.3, nettes: w(22.84), souvenirs: w(24.12),
  s7: 26.75, rapide: w(26.52), fluide: w(27.54), place: w(28.347), garder: w(29.968),
  sC: 30.75, noir: w(30.576), argent: w(31.44), glacier: w(32.07), bordeaux: w(32.8), choisis: w(33.56),
  s8: 34.75, chez: w(34.507), store: w(35.12), original: w(36.871), configure: w(38.208),
  s9: 39.89, cta: w(39.76), dropFinal: 39.89, dispo: w(41.251), passe: w(42.54), ecris: w(43.72), ouatsap: w(44.267),
  end: 46.92,
};
const BEAT = 0.5;

const INK = '#1D1D1F', GRAY = '#86868B', LINE = '#E8E8ED', RED = '#FF3B30', GREEN = '#30D158', WINE = '#5B1F2B';
const FONT = "'Inter', 'SF Pro Display', 'Helvetica Neue', sans-serif";
const phoneShadow = 'drop-shadow(0 50px 60px rgba(40,10,15,.28)) drop-shadow(0 10px 16px rgba(0,0,0,.14))';

// Titre cinétique : chaque mot monte et se défloute à son instant
const Words = ({t, items, size, color = INK, weight = 700, style, align = 'center'}) => (
  <div style={{fontFamily: FONT, fontSize: size, fontWeight: weight, letterSpacing: -size * 0.035, lineHeight: 1.08, color, textAlign: align, ...style}}>
    {items.map(([txt, at, st], i) => (
      <span key={i} style={{display: 'inline-block', marginRight: size * 0.24, ...appear(t, at, 0.55, size * 0.35), ...st}}>{txt}</span>
    ))}
  </div>
);

// Reflet qui glisse sur une photo détourée (masqué par sa transparence)
const Sheen = ({src, t, at, dur = 1.1, angle = 105}) => {
  const x = eio(prog(t, at, dur));
  if (x <= 0 || x >= 1) return null;
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen',
      WebkitMaskImage: `url(${src})`, WebkitMaskSize: '100% 100%', maskImage: `url(${src})`, maskSize: '100% 100%',
      background: `linear-gradient(${angle}deg, transparent ${lerp(-40, 110, x) - 18}%, rgba(255,255,255,.55) ${lerp(-40, 110, x)}%, transparent ${lerp(-40, 110, x) + 18}%)`}} />
  );
};

const Photo = ({name, height, t, sheenAt, style}) => {
  const src = staticFile(name);
  return (
    <div style={{position: 'relative', height, display: 'inline-block', ...style}}>
      <Img src={src} style={{height: '100%', display: 'block', filter: phoneShadow}} />
      {sheenAt != null && <Sheen src={src} t={t} at={sheenAt} />}
    </div>
  );
};

// Photo de soirée, de nuit (bokeh chaud) : floue au départ, nette au déclic
const NightShot = ({w: W, h: H, blur}) => {
  const dots = [[18, 30, 26, '#FFB45A'], [38, 22, 18, '#FFD08A'], [62, 34, 30, '#FF9F43'], [80, 20, 16, '#FFE1A8'], [28, 62, 14, '#FFC46B'], [70, 60, 20, '#FFB45A'], [50, 46, 12, '#FFF0C9'], [88, 48, 22, '#FF8C42']];
  return (
    <div style={{width: W, height: H, borderRadius: W * 0.06, overflow: 'hidden', position: 'relative', background: 'linear-gradient(180deg,#0B0B12 0%,#1A1420 55%,#2A1B1E 100%)', boxShadow: shadow}}>
      <div style={{position: 'absolute', inset: 0, filter: `blur(${blur}px)`}}>
        {dots.map(([x, y, r, c], i) => (
          <div key={i} style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: W * r / 200, height: W * r / 200, borderRadius: '50%', background: c, opacity: 0.85, transform: 'translate(-50%,-50%)', boxShadow: `0 0 ${W * 0.03}px ${c}`}} />
        ))}
        {/* deux silhouettes (les mariés) */}
        <div style={{position: 'absolute', left: '36%', bottom: 0, width: '13%', height: '52%', borderRadius: '45% 45% 8% 8%', background: '#F4EDE4'}} />
        <div style={{position: 'absolute', left: '51%', bottom: 0, width: '13%', height: '56%', borderRadius: '45% 45% 8% 8%', background: '#15151A', boxShadow: 'inset 0 0 0 2px #2A2A30'}} />
        <div style={{position: 'absolute', left: '38.5%', bottom: '49%', width: '8%', height: '12%', borderRadius: '50%', background: '#5A3A2C'}} />
        <div style={{position: 'absolute', left: '53.5%', bottom: '53%', width: '8%', height: '12%', borderRadius: '50%', background: '#4A2E22'}} />
      </div>
    </div>
  );
};

const BatteryIcon = ({width, level, color, stroke = '#555', glow}) => (
  <div style={{display: 'flex', alignItems: 'center'}}>
    <div style={{width, height: width * 0.46, border: `${width * 0.035}px solid ${stroke}`, borderRadius: width * 0.12, padding: width * 0.035, boxShadow: glow}}>
      <div style={{width: `${Math.max(level, 0.03) * 100}%`, height: '100%', background: color, borderRadius: width * 0.06}} />
    </div>
    <div style={{width: width * 0.05, height: width * 0.16, background: stroke, borderRadius: `0 ${width * 0.03}px ${width * 0.03}px 0`, marginLeft: width * 0.015}} />
  </div>
);

const Wordmark = ({size}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: size * 0.32, fontFamily: FONT}}>
    <div style={{width: size * 1.25, height: size * 1.25, borderRadius: size * 0.32, background: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 30px -14px rgba(0,0,0,.5)'}}>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8h12l-1 12H7L6 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
    </div>
    <div style={{lineHeight: 1}}>
      <div style={{fontSize: size, fontWeight: 700, letterSpacing: -size * 0.03, color: INK}}>Apple Store Kolwezi</div>
    </div>
  </div>
);

const Check = ({size = 22}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);

const WaIcon = ({size = 26}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12a8 8 0 0 1-11.8 7L4 20l1.1-4A8 8 0 1 1 20 12z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.4-1.8-.9-.8.8c-.9-.4-1.9-1.4-2.3-2.3l.8-.8-.9-1.8L9 9.5z" /></svg>
);

// texteFin=false : écran de fin sans ses textes (ils sont refaits en calques texte modifiables dans invideo)
export const Video = ({vertical = false, texteFin = true}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const V = vertical;
  const u = Math.min(width, height) / 1080; // unité : 1 = 1 px sur un écran 1080 de petit côté

  // ---------- Scène 1 : délestage (fond noir)
  const s1 = t < T.s2 + 0.4;
  const flash = 1 - eo(prog(t, 0, 0.18));
  const blink = t > T.trois ? (Math.floor((t - T.trois) / 0.25) % 2 === 0 ? 1 : 0.25) : 1;
  const dieOut = 1 - eio(prog(t, T.s2 - 0.37, 0.3));
  const toWhite = eio5(prog(t, T.s2 - 0.05, 0.45));

  // ---------- Scène 2 : les galères
  const cardsOut = eio5(prog(t, T.s3, 0.5));
  const shake = t > T.sature && t < T.sature + 0.45 ? Math.sin((t - T.sature) * 70) * 10 * u * (1 - (t - T.sature) / 0.45) : 0;
  const spin = (t * 360 * 1.4) % 360;

  // ---------- Scène 4 : révélation
  const rv = eo5(prog(t, T.drop, 1.1));
  const toS5 = eio5(prog(t, T.s5, 0.7));
  const toS6 = eio5(prog(t, T.s6 - 0.1, 0.55));

  const cardW = (V ? 330 : 430) * u;

  return (
    <div style={{position: 'absolute', inset: 0, background: '#000', overflow: 'hidden', fontFamily: FONT}}>
      <GridBg t={t} />

      {/* ===== Scène 1 ===== */}
      {s1 && (
        <div style={{position: 'absolute', inset: 0, background: '#000', opacity: 1 - toWhite}}>
          <Center style={{flexDirection: 'column', gap: 40 * u, opacity: dieOut}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 34 * u, ...appear(t, 0.15, 0.6, 20 * u)}}>
              <div style={{opacity: blink}}><BatteryIcon width={(V ? 340 : 340) * u} level={0.03} color={RED} stroke="#4A4A4F" /></div>
              <div style={{color: RED, fontSize: (V ? 150 : 150) * u, fontWeight: 700, letterSpacing: -4 * u, opacity: t > T.trois ? blink : 0}}>3 %</div>
            </div>
            <Words t={t} size={(V ? 76 : 74) * u} color="#F5F5F7" items={[['Délestage', T.delestage], ['à', T.delestage + 0.4], ['Kolwezi.', T.delestage + 0.5]]} />
            <Words t={t} size={(V ? 44 : 42) * u} weight={500} color="#86868B" style={{maxWidth: (V ? 860 : 1200) * u}} items={[['Et', T.soiree], ["t'as", T.soiree + 0.1], ['encore', T.soiree + 0.2], ['toute', T.soiree + 0.5], ['la', T.soiree + 0.7], ['soirée', T.soiree + 0.8], ['devant', T.soiree + 1.1], ['toi.', T.soiree + 1.3]]} />
          </Center>
          <div style={{position: 'absolute', inset: 0, background: '#FFF6E0', opacity: flash * 0.9}} />
        </div>
      )}

      {/* ===== Scène 2 + 3 : les galères puis la bascule ===== */}
      <Layer t={t} from={T.s2} to={T.drop - 0.02} zoomIn={0.5} zoomOut={0}>
        <div style={{position: 'absolute', left: 0, right: 0, top: (V ? 330 : 150) * u, display: 'flex', justifyContent: 'center', opacity: 1 - cardsOut}}>
          <Words t={t} size={(V ? 80 : 74) * u} items={[['On', T.connait], ['connaît', T.connait + 0.15], ['tous', T.connait + 0.5], ['ça.', T.connait + 0.7, {color: GRAY}]]} />
        </div>
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: V ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: (V ? 40 : 46) * u, paddingTop: (V ? 260 : 120) * u}}>
          {[
            {at: T.photos, rot: -4, label: 'Photo du mariage, de nuit', body: <NightShot w={cardW - 36 * u} h={(cardW - 36 * u) * 0.66} blur={9 * u} />},
            {at: T.rame, rot: 0, label: 'Ça rame…', body: (
              <div style={{width: cardW - 36 * u, height: (cardW - 36 * u) * 0.66, borderRadius: 16 * u, background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <div style={{width: 74 * u, height: 74 * u, borderRadius: '50%', border: `${8 * u}px solid #E2E2E7`, borderTopColor: INK, transform: `rotate(${spin}deg)`}} />
              </div>)},
            {at: T.stockage, rot: 4, label: 'Au pire moment.', body: (
              <div style={{width: cardW - 36 * u, height: (cardW - 36 * u) * 0.66, borderRadius: 16 * u, background: '#F5F5F7', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24 * u, gap: 14 * u, transform: `translateX(${shake}px)`}}>
                <div style={{fontSize: 28 * u, fontWeight: 700, color: INK, letterSpacing: -0.6 * u}}>Stockage saturé</div>
                <div style={{height: 12 * u, borderRadius: 6 * u, background: '#E2E2E7', overflow: 'hidden'}}>
                  <div style={{width: `${lerp(72, 100, eo(prog(t, T.stockage + 0.2, 0.6)))}%`, height: '100%', background: t > T.sature ? RED : INK}} />
                </div>
                <div style={{fontSize: 18 * u, color: GRAY}}>Impossible d'enregistrer la photo.</div>
              </div>)},
          ].map((c, i) => {
            const fly = cardsOut;
            const dir = V ? [-1, 1, -1][i] : [-1, 0, 1][i];
            return (
              <div key={i} style={{...pop(t, c.at, 0.7), transform: `${pop(t, c.at, 0.7).transform} rotate(${c.rot}deg) translate(${dir * fly * 900 * u}px, ${(V ? 0 : -1) * fly * 420 * u + (V ? fly * 0 : 0)}px) rotate(${dir * fly * 18}deg)`, opacity: Math.min(pop(t, c.at, 0.7).opacity, 1 - fly)}}>
                <div style={{background: '#fff', borderRadius: 26 * u, padding: 18 * u, boxShadow: shadow, border: `1px solid ${LINE}`}}>
                  {c.body}
                  <div style={{fontSize: 21 * u, fontWeight: 600, color: INK, marginTop: 14 * u, letterSpacing: -0.3 * u}}>{c.label}</div>
                </div>
              </div>
            );
          })}
        </div>
        {/* la bascule */}
        {t > T.s3 && (
          <Center style={{flexDirection: 'column', opacity: 1 - eio(prog(t, T.gap - 0.12, 0.2)), transform: `scale(${1 + 0.06 * eio(prog(t, T.gap - 0.12, 0.2))})`}}>
            <Words t={t} size={(V ? 92 : 100) * u} style={{maxWidth: (V ? 900 : 1700) * u}} items={[['Ton', T.aider], ['téléphone', T.aider + 0.4], ['devrait', T.aider + 0.8], ["t'aider.", T.aider + 1.12]]} />
            <div style={{display: 'flex', alignItems: 'center', marginTop: 18 * u}}>
              <Words t={t} size={(V ? 92 : 100) * u} color={GRAY} items={[['Pas', T.pas], ['te', T.pas + 0.29]]} />
              <div style={{...pop(t, T.lacher, 0.5), background: INK, color: '#fff', borderRadius: 999, padding: `${4 * u}px ${34 * u}px ${12 * u}px`, fontSize: (V ? 92 : 100) * u, fontWeight: 700, letterSpacing: -3.5 * u}}>lâcher.</div>
            </div>
          </Center>
        )}
      </Layer>

      {/* ===== Scènes 4 → 5 : révélation puis batterie ===== */}
      {t >= T.drop && t < T.s6 + 0.5 && (
        <div style={{position: 'absolute', inset: 0, opacity: 1 - toS6}}>
          {/* téléphone */}
          <div style={{position: 'absolute', left: '50%', top: '50%',
            transform: `translate(-50%,-50%) translate(${lerp(0, V ? 0 : -420, toS5) * u}px, ${lerp(lerp(260, V ? -80 : -50, rv), V ? -330 : -10, toS5) * u}px) perspective(${2400 * u}px) rotateY(${lerp(-28, 0, rv) + Math.sin(t * 0.9) * 3}deg) rotateZ(${lerp(-8, 0, rv) + lerp(0, -6, toS5)}deg) scale(${lerp(1.25, 1, rv) * lerp(1, V ? 0.62 : 0.78, toS5)})`,
            opacity: clamp(rv * 2)}}>
            <Photo name="dos.png" height={(V ? 980 : 700) * u} t={t} sheenAt={T.drop + 0.25} />
          </div>
          {/* nom */}
          <div style={{position: 'absolute', left: 0, right: 0, bottom: (V ? 300 : 50) * u, display: 'flex', justifyContent: 'center', opacity: 1 - toS5}}>
            <div style={{fontSize: (V ? 92 : 84) * u, fontWeight: 700, color: INK, letterSpacing: lerp(18, -2.5, eo5(prog(t, T.aifone, 1.0))) * u, ...appear(t, T.aifone, 0.7, 30 * u)}}>
              iPhone 18 Pro Max
            </div>
          </div>
          {/* batterie */}
          {t > T.s5 && (
            <div style={{position: 'absolute', ...(V ? {left: 0, right: 0, top: 1150 * u, alignItems: 'center'} : {left: 900 * u, top: 0, bottom: 0, justifyContent: 'center'}), display: 'flex', flexDirection: 'column', gap: 26 * u}}>
              <Words t={t} align={V ? 'center' : 'left'} size={(V ? 88 : 86) * u} items={[["Jusqu'à", T.batterie], ['29 h.', T.batterie + 0.52]]} />
              <Words t={t} align={V ? 'center' : 'left'} size={(V ? 46 : 42) * u} weight={500} color={GRAY} items={[['Même', T.courant - 0.3], ['sans', T.courant - 0.1], ['courant.', T.courant + 0.05]]} />
              <div style={{display: 'flex', alignItems: 'center', gap: 28 * u, marginTop: 20 * u, ...appear(t, T.s5 + 0.3, 0.6, 20 * u)}}>
                <BatteryIcon width={190 * u} level={1} color={GREEN} stroke={INK} />
                <div style={{fontSize: 46 * u, fontWeight: 600, color: INK, fontVariantNumeric: 'tabular-nums', letterSpacing: -1 * u}}>
                  {String(Math.round(lerp(8, 23, eio(prog(t, T.s5 + 0.2, 2.6))))).padStart(2, '0')}:00
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== Scène 6 : photo de nuit ===== */}
      <Layer t={t} from={T.s6} to={T.s7} zoomIn={0.5} zoomOut={0.4} inScale={1.12} outScale={1.25}>
        <div style={{position: 'absolute', ...(V ? {left: -40 * u, top: -20 * u, height: 900 * u} : {left: -60 * u, bottom: -40 * u, height: 1160 * u}), transform: `scale(${lerp(1, 1.08, prog(t, T.s6, 4))})`, transformOrigin: '20% 30%'}}>
          <Img src={staticFile('gros-plan-camera.png')} style={{height: '100%', filter: phoneShadow}} />
        </div>
        <div style={{position: 'absolute', ...(V ? {left: 0, right: 0, top: 940 * u, alignItems: 'center'} : {right: 110 * u, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'flex-start'}), display: 'flex', flexDirection: 'column', gap: 30 * u}}>
          <div style={{...pop(t, T.s6 + 0.25, 0.6), position: 'relative'}}>
            <NightShot w={(V ? 640 : 560) * u} h={(V ? 420 : 370) * u} blur={lerp(14, 0, eo(prog(t, T.nettes, 0.25))) * u} />
            <div style={{position: 'absolute', inset: 0, borderRadius: 34 * u, background: '#fff', opacity: 0.9 * (1 - eo(prog(t, T.nettes, 0.35))) * (t >= T.nettes ? 1 : 0)}} />
          </div>
          <Words t={t} align={V ? 'center' : 'left'} size={(V ? 74 : 66) * u} items={[['Nettes,', T.nettes], ['même', T.nettes + 0.5], ['la', T.nettes + 0.7], ['nuit.', T.nettes + 0.8]]} />
          <Words t={t} align={V ? 'center' : 'left'} size={(V ? 42 : 36) * u} weight={500} color={GRAY} style={{maxWidth: 640 * u}} items={[['Tes', T.souvenirs], ['souvenirs,', T.souvenirs + 0.3], ['comme', T.souvenirs + 0.9], ['tu', T.souvenirs + 1.2], ['les', T.souvenirs + 1.35], ['as', T.souvenirs + 1.5], ['vécus.', T.souvenirs + 1.6]]} />
        </div>
      </Layer>

      {/* ===== Scène 7 : vitesse et stockage ===== */}
      <Layer t={t} from={T.s7} to={T.sC} zoomIn={0.4} zoomOut={0.4}>
        <Center style={{flexDirection: 'column', gap: 46 * u}}>
          <div style={{display: 'grid', gridTemplateColumns: `repeat(${V ? 4 : 6}, ${110 * u}px)`, gap: 26 * u}}>
            {Array.from({length: V ? 12 : 12}).map((_, i) => {
              const at = T.rapide + i * 0.125;
              const dark = [0, 3, 5, 6, 9, 10].includes(i);
              const glyphs = ['M4 17l5-5 4 4 7-8', 'M12 3v18M3 12h18', 'M5 5h14v14H5z', 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z', 'M4 8h16M4 16h16', 'M6 4l12 8-12 8z'];
              return (
                <div key={i} style={{...pop(t, at, 0.45), width: 110 * u, height: 110 * u, borderRadius: 26 * u, background: dark ? INK : '#fff', border: dark ? 'none' : `1px solid ${LINE}`, boxShadow: shadowSoft, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <svg width={46 * u} height={46 * u} viewBox="0 0 24 24" fill="none" stroke={dark ? '#fff' : INK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={glyphs[i % 6]} /></svg>
                </div>
              );
            })}
          </div>
          <Words t={t} size={(V ? 76 : 72) * u} style={{maxWidth: (V ? 960 : 1700) * u}} items={[['Rapide.', T.rapide], ['Fluide.', T.fluide], ["Jusqu'à", T.place + 0.09, {color: GRAY}], ['2 To.', T.place + 0.4, {color: GRAY}]]} />
          <div style={{...appear(t, T.place, 0.5, 14 * u), opacity: (t < T.garder + 0.2 ? 1 : 1 - eo(prog(t, T.garder + 0.2, 0.4))) * clamp(prog(t, T.place, 0.4))}}>
            <Pill kind="light" style={{fontSize: 26 * u, padding: `${12 * u}px ${26 * u}px`, color: RED, position: 'relative'}}>
              Stockage saturé
              <div style={{position: 'absolute', left: 20 * u, top: '52%', height: 3 * u, background: RED, width: `calc(${eo(prog(t, T.garder, 0.35)) * 100}% - ${40 * u}px)`}} />
            </Pill>
          </div>
        </Center>
      </Layer>

      {/* ===== Scène couleurs ===== */}
      <Layer t={t} from={T.sC} to={T.s8} zoomIn={0.45} zoomOut={0.4}>
        <Center style={{flexDirection: 'column', gap: (V ? 50 : 40) * u}}>
          <div style={{display: 'grid', gridTemplateColumns: `repeat(${V ? 2 : 4}, auto)`, gap: `${(V ? 50 : 26) * u}px ${(V ? 40 : 34) * u}px`}}>
            {[['noir', 'Noir', T.noir], ['argent', 'Argent', T.argent], ['glacier', 'Glacier', T.glacier], ['bordeaux', 'Bordeaux', T.bordeaux]].map(([f, name, at], i, all) => {
              const next = i < 3 ? all[i + 1][2] : T.choisis;
              const dim = (i < 3 ? eo(prog(t, next, 0.3)) : 0) * (1 - eo(prog(t, T.choisis, 0.35)));
              const focus = eo(prog(t, at, 0.35)) * (1 - eo(prog(t, next, 0.3)));
              const p = pop(t, at - 0.08, 0.6);
              return (
                <div key={f} style={{...p, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 * u}}>
                  <div style={{transform: `translateY(${-14 * focus * u}px) scale(${1 + 0.05 * focus})`, opacity: lerp(1, 0.4, dim)}}>
                    <Photo name={`couleurs/${f}.png`} height={(V ? 500 : 440) * u} t={t} sheenAt={at} />
                  </div>
                  <div style={{fontSize: (V ? 44 : 34) * u, fontWeight: 600, color: INK, letterSpacing: -0.6 * u, opacity: lerp(1, 0.4, dim)}}>{name}</div>
                </div>
              );
            })}
          </div>
          <Words t={t} size={(V ? 84 : 72) * u} items={[['Choisis', T.choisis], ['le', T.choisis + 0.39], ['tien.', T.choisis + 0.48]]} />
        </Center>
      </Layer>

      {/* ===== Scène 8 : la confiance ===== */}
      <Layer t={t} from={T.s8} to={T.s9} zoomIn={0.45} zoomOut={0.4}>
        <Center style={{flexDirection: 'column', gap: 46 * u}}>
          <div style={{...pop(t, T.store, 0.7)}}><Wordmark size={(V ? 74 : 100) * u} /></div>
          <div style={{display: 'flex', flexDirection: V ? 'column' : 'row', gap: 20 * u, alignItems: 'center'}}>
            {[['Original', T.original], ['Configuré sur place', T.configure]].map(([txt, at], i) => (
              <div key={i} style={pop(t, at, 0.55)}>
                <Pill kind={i === 0 ? 'dark' : 'light'} style={{fontSize: 40 * u, padding: `${20 * u}px ${40 * u}px`, gap: 14 * u}}><Check size={38 * u} />{txt}</Pill>
              </div>
            ))}
          </div>
          <div style={{...appear(t, T.s8 + 0.4, 0.6, 14 * u), fontSize: 38 * u, color: GRAY, fontWeight: 500}}>Chez nous, à Kolwezi.</div>
        </Center>
      </Layer>

      {/* ===== Scène 9 : appel à l'action ===== */}
      <Layer t={t} from={T.s9} to={DUR + 0.1} zoomIn={0.5} zoomOut={0}>
        {(() => {
          const slam = eo5(prog(t, T.dropFinal, 0.9));
          const endT = eio5(prog(t, T.end, 0.9));
          return (
            <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: V ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: (V ? 60 : 110) * u}}>
              <div style={{transform: `translateY(${lerp(140, 0, slam) * u + Math.sin(t * 1.6) * 8 * u}px) rotate(${lerp(8, -3, slam)}deg) scale(${lerp(0.9, 1, slam) * lerp(1, V ? 0.8 : 0.82, endT)})`, opacity: clamp(slam * 3)}}>
                <Photo name="dos-et-ecran.png" height={(V ? 820 : 720) * u} t={t} sheenAt={T.dropFinal + 0.2} />
              </div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: V ? 'center' : 'flex-start', gap: 18 * u, visibility: texteFin ? 'visible' : 'hidden'}}>
                <div style={{fontSize: (V ? 82 : 80) * u, fontWeight: 700, color: INK, letterSpacing: -2.5 * u, ...appear(t, T.cta, 0.6, 24 * u)}}>iPhone 18 Pro Max</div>
                <div style={{fontSize: (V ? 48 : 46) * u, fontWeight: 500, color: GRAY, letterSpacing: -1 * u, ...appear(t, T.dispo, 0.6, 18 * u)}}>Disponible maintenant.</div>
                <div style={{display: 'flex', gap: 16 * u, marginTop: 24 * u, flexDirection: 'row', alignItems: 'center'}}>
                  <div style={{...pop(t, T.ecris, 0.55), transform: `${pop(t, T.ecris, 0.55).transform} scale(${t > T.ouatsap && t < T.ouatsap + 0.18 ? 0.94 : 1})`}}>
                    <Pill kind="dark" style={{fontSize: 32 * u, padding: `${18 * u}px ${34 * u}px`, gap: 14 * u}}><WaIcon size={34 * u} />Écris-nous sur WhatsApp</Pill>
                  </div>
                </div>
                <div style={{...appear(t, T.passe, 0.6, 14 * u), fontSize: 30 * u, color: GRAY, fontWeight: 500, marginTop: 6 * u}}>Passe nous voir en boutique, à Kolwezi.</div>
                <div style={{marginTop: 34 * u, ...appear(t, T.end, 0.8, 20 * u)}}><Wordmark size={(V ? 46 : 44) * u} /></div>
              </div>
            </div>
          );
        })()}
      </Layer>

      <Audio src={staticFile('mix.wav')} />
    </div>
  );
};
