import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, T, FONT, Scene, MotionBlur, Roll, Rings, Neon, Center, Words, Ink, Mark, Strike, Card, Pill, Avatar, Bubble, Check, Icon, Phone, Brand, enter, pop, spring, eo, eio, prog, clamp, lerp} from './ui';

// Les instants sont ceux de la voix Koraly (transcription mot à mot, audio/voix-mots.json) : la voix démarre à 0 s.
export const DURATION = 89.5;

// S1 · « Stop… avant d'acheter ton prochain iPhone, écoute ceci. » : mots cinétiques rouges avec halo (référence 2)
const S1 = ({t, v}) => {
  const stopOut = eio(prog(t, 0.6, 0.14));
  const ph = spring(t, 1.88, 0.8);
  const tilt = 1 - eo(prog(t, 1.88, 0.9));
  return (
    <>
      {stopOut < 1 && (
        <Center style={{top: v ? -120 : -60}}>
          <MotionBlur id="stop" x={stopOut * 30} style={{opacity: 1 - stopOut, transform: `translateX(${stopOut * 300}px)`}}>
            <Words t={t} items={[['Stop.', 0.16]]} style={{...T(190, 750)}} />
          </MotionBlur>
        </Center>
      )}
      <Center style={{top: v ? (t > 1.88 ? -420 * eo(prog(t, 1.88, 0.5)) - 120 : -120) : -60 - (t > 1.88 ? 300 * eo(prog(t, 1.88, 0.5)) : 0), padding: '0 60px'}}>
        <Words t={t} items={[['Avant', 0.7], ["d'acheter", 0.96], ['ton', 1.3], ['prochain', 1.46], ['iPhone,', 1.88]]} style={{...T(v ? 86 : 80, 650)}} />
        <Words t={t} items={[['écoute', 2.52], ['ceci.', 2.82]]} style={{...T(v ? 86 : 80, 650), marginTop: 8}} />
      </Center>
      {t > 1.88 && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: v ? 200 : 40, display: 'flex', justifyContent: 'center', perspective: 1600, opacity: clamp((t - 1.88) / 0.12), transform: `translateY(${(1 - ph) * 320}px)`, filter: `blur(${lerp(16, 0, clamp((t - 1.88) / 0.45))}px)`}}>
          <div style={{transform: `rotateX(${tilt * 38}deg) rotateZ(${tilt * -10}deg)`}}>
            <Phone src="p18.png" h={v ? 760 : 440} />
          </div>
        </div>
      )}
    </>
  );
};

// S2 · bulle client, mots gris → noirs ; trois iPhone flous défilent derrière
const S2 = ({t, v}) => {
  const items = [["Aujourd'hui,", 3.76], ['acheter', 4.32], ['un', 4.62], ['iPhone,', 4.76], ['ce', 5.3], ["n'est", 5.42], ['plus', 5.58], ['seulement', 5.8], ['choisir', 6.12], ['un', 6.48], ['modèle.', 6.58]];
  const dx = lerp(80, -80, prog(t, 3.6, 3.8));
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: v ? 1060 : 560, display: 'flex', justifyContent: 'center', gap: v ? 40 : 90, transform: `translateX(${dx}px)`, filter: 'blur(9px)', opacity: 0.5}}>
        <Phone src="bm-11.png" h={v ? 560 : 420} />
        <Phone src="bm-13.png" h={v ? 560 : 420} />
        <Phone src="bm-17promax.png" h={v ? 560 : 420} />
      </div>
      <Center style={{top: v ? -300 : -260}}>
        <Bubble t={t} at={3.76} width={v ? 900 : 1300}><Ink t={t} items={items} /></Bubble>
      </Center>
    </>
  );
};

// S3 · « La vraie question, c'est : est-ce que tu achètes au bon endroit ? »
const S3 = ({t}) => (
  <Center>
    <Words t={t} items={[['La', 7.5], ['vraie', 7.64], ['question,', 7.88], ["c'est :", 8.4]]} style={{...T(54, 500, C.gray), marginBottom: 40}} />
    <Words t={t} items={[['est-ce', 9.08], ['que', 9.28], ['tu', 9.42], ['achètes', 9.56]]} style={{...T(92, 650)}} />
    <div style={{...T(92, 650), marginTop: 8, ...enter(t, 9.88, 0.2)}}>
      <Mark t={t} at={9.92} dur={0.55}>au bon endroit</Mark> ?
    </div>
  </Center>
);

const CITIES = [['Kolwezi', 11.7], ['Likasi', 12.44], ['Lubumbashi', 13.18], ['Fungurume', 14.22]];

const REGION = {Kolwezi: 'Lualaba', Likasi: 'Haut-Katanga', Lubumbashi: 'Haut-Katanga', Fungurume: 'Lualaba'};

// Liste verticale en profondeur (référence 2, liste d'actions) : la ligne active au centre est nette et grande,
// les autres reculent, se floutent et s'estompent. at : instants où chaque ville devient active.
const CityList = ({t, times, v, speed = 0.42}) => {
  let pos = 0;
  times.forEach((at, i) => { if (i > 0) pos += eio(prog(t, at - 0.08, speed)); });
  const rowH = v ? 210 : 150;
  return (
    <div style={{position: 'relative', width: v ? 900 : 980, height: rowH * 4.4, perspective: 1800}}>
      {CITIES.map(([c], i) => {
        const off = i - pos;
        const a = Math.abs(off);
        const seen = t >= times[i] - 0.25;
        const act = clamp(1 - a);
        return (
          <div key={c} style={{position: 'absolute', left: 0, right: 0, top: '50%', height: rowH - 34, marginTop: -(rowH - 34) / 2, transform: `translateY(${off * rowH}px) translateZ(${-a * 160}px) rotateX(${-off * 14}deg) scale(${0.92 + 0.12 * act})`, opacity: seen ? clamp(1.25 - a * 0.42) : 0, filter: `blur(${a * 3.2}px)`, zIndex: 10 - Math.round(a)}}>
            <div style={{height: '100%', display: 'flex', alignItems: 'center', gap: 30, padding: '0 44px', background: '#fff', borderRadius: 36, boxShadow: `0 ${10 + 24 * act}px ${30 + 50 * act}px rgba(0,0,0,${0.05 + 0.06 * act})`}}>
              {Icon.pin(v ? 58 : 48)}
              <div>
                <div style={{...T(v ? 60 : 50, 650)}}>{c}</div>
                <div style={{...T(v ? 32 : 28, 450, C.gray)}}>{REGION[c]}</div>
              </div>
              <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14, ...T(v ? 32 : 28, 600, C.lime), opacity: act}}>
                <span style={{width: 16, height: 16, borderRadius: '50%', background: C.lime, boxShadow: `0 0 14px ${C.lime}`}} />conseil
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// S4 · « Que tu sois à Kolwezi, Likasi, Lubumbashi ou Fungurume, »
const S4 = ({t, v}) => (
  <Center>
    <Words t={t} items={[['Que', 11.16], ['tu', 11.28], ['sois', 11.4], ['à…', 11.58]]} style={{...T(56, 500, C.gray), marginBottom: v ? 40 : 10}} />
    <CityList t={t} v={v} times={CITIES.map(([, at]) => at)} />
  </Center>
);

// S5 · les pilules fusionnent → nom de la boutique ; « une nouvelle expérience »
const S5 = ({t, v}) => {
  const m = eio(prog(t, 15.1, 0.4));
  const wash = t >= 15.56 ? 1 - eo(prog(t, 15.56, 0.7)) : 0;
  return (
    <>
      {wash > 0 && <div style={{position: 'absolute', inset: -200, background: '#F7D3D6', opacity: wash * 0.9}} />}
      {m < 1 && (
        <Center>
          <div style={{display: 'flex', flexDirection: v ? 'column' : 'row', alignItems: 'center', gap: lerp(v ? 44 : 36, -120, m), opacity: 1 - m, transform: `scale(${1 - 0.6 * m})`, filter: `blur(${m * 10}px)`}}>
            {CITIES.map(([c]) => <Pill key={c} style={{fontSize: 44, padding: '18px 34px'}}>{Icon.pin(40)}{c}</Pill>)}
          </div>
        </Center>
      )}
      <Center>
        <div style={{...T(52, 500, C.gray), ...enter(t, 15.3, 0.2), marginBottom: 14}}>chez</div>
        <div style={{...pop(t, 15.56, 0.6, 0.7), filter: t < 15.7 ? `blur(${(1 - prog(t, 15.56, 0.14)) * 12}px)` : undefined}}><Brand size={v ? 150 : 140} /></div>
        <Words t={t} items={[['on', 16.88], ['veut', 17.02], ['te', 17.18], ['faire', 17.32], ['vivre', 17.5]]} style={{...T(50, 500, C.gray), marginTop: 70}} />
        <div style={{marginTop: 26, ...pop(t, 17.76, 0.45, 0.7)}}>
          <Pill style={{fontSize: 58}}>une nouvelle <Mark t={t} at={18.22} dur={0.45}>expérience</Mark></Pill>
        </div>
      </Center>
    </>
  );
};

// S6 · « Ici, on ne te vend pas seulement un téléphone, » ; « un téléphone » barré
const S6 = ({t}) => (
  <Center style={{padding: '0 70px'}}>
    <Words t={t} items={[['Ici,', 19.42], ['on', 19.82], ['ne', 19.92], ['te', 20.06], ['vend', 20.18], ['pas', 20.44]]} style={{...T(84, 650)}} />
    <Words t={t} items={[['seulement', 20.64], [<Strike t={t} at={21.3}>un téléphone</Strike>, 20.94]]} style={{...T(84, 650), marginTop: 10}} />
  </Center>
);

// S7 · carte sombre façon « Transaction Fee » (référence 2) : courbe rouge qui monte, étiquettes qui s'allument
const S7 = ({t, v}) => {
  const rows = [['ton budget', 24.3, 0.3], ['ton besoin', 25.36, 0.58], ['ton style de vie', 26.36, 0.86]];
  const W = v ? 860 : 1000, H = v ? 900 : 640;
  const draw = eio(prog(t, 23.9, 2.9));
  const P = (x) => [70 + x * (W - 140), H - 150 - Math.pow(x, 1.25) * (H - 330) - Math.sin(x * 9) * 18];
  const pts = Array.from({length: 61}, (_, k) => P(k / 60));
  const d = pts.map(([x, y], k) => `${k ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const zoom = 1 + 0.06 * eo(prog(t, 24.3, 2.6));
  return (
    <Center>
      <Words t={t} items={[['On', 22.04], ["t'aide", 22.18], ['à', 22.42], ['choisir', 22.48], ["l'iPhone", 22.86]]} style={{...T(64, 650)}} />
      <Words t={t} items={[['qui', 23.4], ['correspond', 23.58], ['à…', 24.06]]} style={{...T(64, 500, C.gray), marginBottom: 50}} />
      <div style={{...enter(t, 23.7, 0.26, 40), transform: `${enter(t, 23.7, 0.26, 40).transform || ''} scale(${zoom})`}}>
        <div style={{position: 'relative', width: W, height: H, borderRadius: 54, background: C.dark, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,.25)', fontFamily: FONT}}>
          <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
            {Array.from({length: 14}).map((_, k) => <line key={'v' + k} x1={k * W / 13} y1={0} x2={k * W / 13} y2={H} stroke="rgba(255,255,255,.06)" strokeWidth="2" />)}
            {Array.from({length: 12}).map((_, k) => <line key={'h' + k} x1={0} y1={k * H / 11} x2={W} y2={k * H / 11} stroke="rgba(255,255,255,.06)" strokeWidth="2" />)}
            <path d={d} fill="none" stroke={C.accent} strokeWidth="9" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - draw} style={{filter: 'drop-shadow(0 0 14px rgba(255,40,40,.9))'}} />
          </svg>
          <div style={{position: 'absolute', left: 54, top: 50, ...T(v ? 50 : 46, 650, '#fff')}}>Ton iPhone idéal</div>
          {rows.map(([r, at, x]) => {
            const [px, py] = P(x);
            const s = t < at ? 0 : spring(t, at, 0.45);
            return (
              <div key={r} style={{position: 'absolute', left: px, top: py, opacity: clamp((t - at) / 0.08)}}>
                <div style={{position: 'absolute', left: -15, top: -15, width: 30, height: 30, borderRadius: '50%', background: '#fff', boxShadow: '0 0 24px rgba(255,255,255,.9)', transform: `scale(${s})`}} />
                <div style={{position: 'absolute', left: x > 0.7 ? -40 : 30, top: -96, transform: `translate(${x > 0.7 ? '-100%' : 0}, ${(1 - s) * 30}px)`, display: 'flex', alignItems: 'center', gap: 14, whiteSpace: 'nowrap', ...T(v ? 44 : 40, 650, '#fff'), textShadow: '0 0 18px rgba(255,255,255,.55)'}}>
                  <Check size={v ? 48 : 44} on={s} />{r}
                </div>
              </div>
            );
          })}
          <div style={{position: 'absolute', left: 54, bottom: 44, display: 'flex', alignItems: 'center', gap: 14, ...T(34, 600, 'rgba(255,255,255,.85)')}}>
            <span style={{width: 26, height: 26, borderRadius: '50%', border: `5px solid ${C.accent}`}} />Apple Store Kolwezi
          </div>
        </div>
      </div>
    </Center>
  );
};

// S8 · question « simple, fiable » puis iPhone 11, 12, 13 qui tombent sur leur chiffre
const S8 = ({t, v}) => {
  const q = [['Tu', 27.56], ['veux', 27.7], ['un', 27.82], ['iPhone', 27.96], ['simple,', 28.42], ['fiable', 28.96], ['pour', 29.5], ['WhatsApp,', 29.66], ['photos', 30.12], ['et', 30.46], ['réseaux', 30.58], ['sociaux ?', 30.84]];
  const icons = [[Icon.chat, 29.66], [Icon.photo, 30.12], [Icon.heart, 30.58]];
  const phones = [['bm-11.png', 'iPhone 11', 33.02], ['bm-12.png', 'iPhone 12', 33.56], ['bm-13.png', 'iPhone 13', 34.14]];
  const up = eio(prog(t, 31.62, 0.5));
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: lerp(v ? 700 : 300, v ? 260 : 90, up), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34}}>
        <Bubble t={t} at={27.56} width={v ? 900 : 1300} size={v ? 54 : 50}><Ink t={t} items={q} /></Bubble>
        <div style={{display: 'flex', gap: 24, marginLeft: 100}}>
          {icons.map(([ic, at], i) => <div key={i} style={{...pop(t, at, 0.4, 0.4), background: '#fff', borderRadius: 30, boxShadow: '0 10px 30px rgba(0,0,0,.08)', padding: 18}}>{ic(46)}</div>)}
        </div>
      </div>
      <Words t={t} items={[['On', 31.62], ['peut', 31.76], ["t'orienter", 31.88], ['vers…', 32.38]]} style={{position: 'absolute', left: 0, right: 0, top: v ? 760 : 470, ...T(52, 500, C.gray)}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: v ? 940 : 560, display: 'flex', justifyContent: 'center', gap: v ? 30 : 80}}>
        {phones.map(([src, label, at]) => {
          const s = t < at ? 0 : spring(t, at, 0.5);
          const k = prog(t, at, 0.3);
          return (
            <MotionBlur key={src} id={'p8' + src.slice(3, 5)} x={Math.sin(Math.PI * k) * 26} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34, opacity: clamp((t - at) / 0.08), transform: `translateX(${(1 - s) * 520}px)`}}>
              <Phone src={src} h={v ? 450 : 330} />
              <Words t={t} items={[[label, at + 0.04]]} style={{...T(46, 650)}} />
            </MotionBlur>
          );
        })}
      </div>
    </>
  );
};

// S9 · question « puissant » puis carrousel des Pro Max avec flou de bougé horizontal et numéro à rouleau ;
// le 18 Pro Max se pose sur les cibles concentriques en pivotant (référence 2)
const PRO = [['bm-14promax.png', '14', 40.9], ['bm-15promax.png', '15', 42.12], ['bm-16promax.png', '16', 43.24], ['bm-17promax.png', '17', 44.42], ['p18.png', '18', 46.3]];
const S9 = ({t, v}) => {
  const q = [['Tu', 35.24], ['veux', 35.38], ['un', 35.5], ['iPhone', 35.64], ['plus', 36.12], ['puissant', 36.34], ['avec', 36.92], ['une', 37.14], ['caméra', 37.3], ['premium', 37.72], ['et', 38.36], ['une', 38.44], ['meilleure', 38.6], ['autonomie ?', 38.9]];
  const pills = [[Icon.bolt, 'puissant', 36.34], [Icon.camera, 'caméra premium', 37.3], [Icon.battery, 'autonomie', 38.9]];
  const qOut = eio(prog(t, 39.7, 0.3));
  let idx = 0, mb = 0;
  for (let i = 1; i < PRO.length; i++) {
    const at = PRO[i][2];
    const d = i === 4 ? 0.5 : 0.3;
    const k = prog(t, at - 0.12, d);
    idx += eio(k);
    if (k > 0 && k < 1) mb = Math.sin(Math.PI * k) * (i === 4 ? 30 : 45);
  }
  const gap = v ? 620 : 560;
  const show = t > 39.9;
  const hero = t >= 46.3;
  const rot = 1 - eo(prog(t, 46.3, 0.8));
  const others = eio(prog(t, 46.2, 0.4));
  return (
    <>
      {qOut < 1 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: v ? 520 : 200, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 50, opacity: 1 - qOut, transform: `translateY(${-qOut * 200}px) scale(${1 - 0.2 * qOut})`}}>
          <Bubble t={t} at={35.24} width={v ? 900 : 1300} size={v ? 54 : 50}><Ink t={t} items={q} /></Bubble>
          <div style={{display: 'flex', flexDirection: v ? 'column' : 'row', gap: 30, alignItems: 'center'}}>
            {pills.map(([ic, l, at]) => <div key={l} style={pop(t, at, 0.45, 0.5)}><Pill>{ic(48)}{l}</Pill></div>)}
          </div>
        </div>
      )}
      {show && (
        <>
          <Words t={t} items={[['On', 39.88], ['peut', 40.04], ['te', 40.18], ['conseiller', 40.32], ['le…', 40.78]]} style={{position: 'absolute', left: 0, right: 0, top: v ? 300 : 90, ...T(52, 500, C.gray)}} />
          <div style={{position: 'absolute', left: '50%', top: v ? 960 : 540, width: 0, height: 0}}>
            <Rings t={t} at={46.22} size={v ? 1000 : 720} />
          </div>
          <MotionBlur id="pro" x={mb} style={{position: 'absolute', left: '50%', top: v ? 960 : 540, opacity: clamp((t - 40.6) / 0.2), perspective: 2000}}>
            {PRO.map(([src], i) => {
              const off = i - idx;
              const a = Math.abs(off);
              if (i < 4 && hero && others >= 1) return null;
              const sc = i === 4 ? (1 - 0.28 * Math.min(a, 1.5)) * (1 + 0.12 * eo(prog(t, 46.3, 0.6))) : (1 - 0.28 * Math.min(a, 1.5)) * (1 - 0.3 * others);
              const h = v ? 760 : 500;
              return (
                <div key={src} style={{position: 'absolute', left: 0, top: 0, transform: `translate(-50%, -50%) translateX(${off * gap}px) scale(${sc})`, opacity: clamp(1.6 - a * 0.6) * (i < 4 ? 1 - others : 1), filter: a > 0.05 ? `blur(${a * 7}px)` : undefined, zIndex: 10 - Math.round(a)}}>
                  <div style={{transform: i === 4 && hero ? `rotateY(${rot * -55}deg) rotateZ(${rot * 8}deg)` : undefined}}>
                    <Phone src={src} h={h} />
                  </div>
                </div>
              );
            })}
          </MotionBlur>
          {t > 40.78 && (
            <div style={{position: 'absolute', left: 0, right: 0, top: v ? 1480 : 870, display: 'flex', justifyContent: 'center', ...enter(t, 40.86, 0.2)}}>
              <Pill style={{fontSize: hero ? 64 : 54, padding: hero ? '28px 56px' : undefined, boxShadow: hero ? `0 0 0 4px ${C.accent}, 0 20px 60px ${C.glow}` : undefined}}>
                iPhone <Roll t={t} steps={PRO.map(([, n, at]) => [n, at - 0.04])} style={{color: hero ? C.accent : C.ink}} /> Pro Max
              </Pill>
            </div>
          )}
          {t > 45.6 && t < 46.4 && <Words t={t} items={[['ou', 45.72], ['même', 45.86], ['le…', 46.1]]} style={{position: 'absolute', left: 0, right: 0, top: v ? 1640 : 980, ...T(48, 500, C.gray)}} />}
        </>
      )}
    </>
  );
};

// S10 · carte « Transfer » de la référence 2 : le texte roule d'un engagement à l'autre et le bouton rouge bascule à chaque changement
const S10 = ({t, v}) => {
  const steps = [['Pose tes questions', 50.08], ['Compare les modèles', 51.18], ['Un conseil honnête', 52.64]];
  let k = -1;
  steps.forEach(([, at], i) => { if (t >= at - 0.06) k = i; });
  const swing = (at) => {
    const x = (t - at) / 0.55;
    if (x < 0 || x > 1) return 0;
    return Math.sin(x * Math.PI * 2.2) * Math.exp(-3.2 * x);
  };
  const sw = steps.reduce((acc, [, at]) => acc + swing(at - 0.06), 0);
  const W = v ? 900 : 1000;
  return (
    <Center>
      <Words t={t} items={[['Et', 48.1], ['le', 48.2], ['plus', 48.34], ['important', 48.54]]} style={{...T(84, 700), marginBottom: 80}} />
      <div style={{...enter(t, 49.36, 0.26, 40), width: W, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{...T(44, 500, C.gray), marginBottom: 18}}>Chez nous, tu peux</div>
        <div style={{position: 'relative', height: 110, width: W, overflow: 'visible'}}>
          {steps.map(([txt, at], i) => {
            const pin = eo(prog(t, at - 0.06, 0.3));
            const pout = i < steps.length - 1 ? eo(prog(t, steps[i + 1][1] - 0.06, 0.3)) : 0;
            if (t < at - 0.06 || pout >= 1) return null;
            const y = (1 - pin) * 90 - pout * 90;
            const bl = Math.sin(Math.PI * pin) * 8 + Math.sin(Math.PI * pout) * 8;
            return (
              <div key={txt} style={{position: 'absolute', inset: 0, textAlign: 'center', transform: `translateY(${y}px) rotate(${(1 - pin) * -4 + pout * 4}deg)`, opacity: pin * (1 - pout), filter: bl > 0.1 ? `blur(${bl}px)` : undefined, ...T(v ? 84 : 80, 700)}}>
                {i === 2 ? <span>Un conseil <Mark t={t} at={53.3} dur={0.4}>honnête</Mark></span> : txt}
              </div>
            );
          })}
        </div>
        <div style={{marginTop: 54, width: v ? 620 : 560, padding: '30px 0', borderRadius: 99, background: C.accent, textAlign: 'center', ...T(50, 650, '#fff'), transform: `rotate(${sw * -16}deg) translateY(${Math.abs(sw) * 16}px)`, boxShadow: `0 ${18 + Math.abs(sw) * 20}px 50px ${C.glow}`}}>
          {k < 2 ? 'Demander conseil' : 'Passer en boutique'}
        </div>
        <div style={{display: 'flex', gap: 18, marginTop: 50}}>
          {steps.map(([, at], i) => <div key={i} style={{width: t >= at - 0.06 ? 54 : 18, height: 18, borderRadius: 99, background: t >= at - 0.06 ? C.accent : '#E2E2E5'}} />)}
        </div>
      </div>
    </Center>
  );
};

// S11 · rupture sombre « glitch » (référence 2, « Almost gone ») : les deux refus en néon rouge barrés,
// puis retour net au blanc pour « juste une vraie orientation »
const S11 = ({t, v}) => {
  const dark = t < 57.22;
  const flash = t < 54.42;
  const sz = v ? 76 : 80;
  if (dark) {
    return (
      <AbsoluteFill style={{background: flash ? '#8A8A8A' : C.dark}}>
        <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,.035) 0 2px, transparent 2px 6px)'}} />
        <Center style={{gap: 70, padding: '0 70px', textAlign: 'center'}}>
          <div style={{...T(sz, 650), ...enter(t, 54.42, 0.18)}}><Neon t={t}><Strike t={t} at={55.12} color="#FF3B3B">Pas de pression</Strike></Neon></div>
          <div style={{...T(sz, 650), ...enter(t, 55.52, 0.18)}}><Neon t={t + 3}><Strike t={t} at={56.7} color="#FF3B3B">Pas de discours compliqué</Strike></Neon></div>
        </Center>
      </AbsoluteFill>
    );
  }
  return (
    <Center style={{padding: '0 70px', textAlign: 'center'}}>
      <Words t={t} items={[['Juste', 57.3], ['une', 57.52]]} style={{...T(v ? 84 : 88, 700)}} />
      <div style={{...T(v ? 96 : 100, 750), marginTop: 10, ...enter(t, 57.7, 0.2)}}><Mark t={t} at={57.8} dur={0.5}>vraie orientation</Mark></div>
    </Center>
  );
};

// S12 · seul plan en couleur pleine : « comme si on conseillait un frère, une sœur, un ami. »
const S12 = ({t, v}) => {
  const ppl = [['👦🏾', 'un frère', 60.22], ['👧🏾', 'une sœur', 61.0], ['🧑🏾', 'un ami', 61.66]];
  return (
    <Center>
      <Words t={t} items={[['comme', 59.14], ['si', 59.34], ['on', 59.46], ['conseillait', 59.62]]} style={{...T(84, 650), marginBottom: 90}} />
      <div style={{display: 'flex', gap: v ? 70 : 120}}>
        {ppl.map(([e, l, at]) => (
          <div key={l} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, ...pop(t, at, 0.5, 0.4)}}>
            <div style={{borderRadius: '50%', boxShadow: t >= at && t < at + 0.6 ? `0 0 0 6px ${C.accent}, 0 0 50px ${C.glow}` : '0 20px 50px rgba(0,0,0,.1)'}}><Avatar size={v ? 200 : 210} emoji={e} bg="#F4F4F6" /></div>
            <Words t={t} items={[[l, at]]} style={{...T(52, 650)}} />
          </div>
        ))}
      </div>
    </Center>
  );
};

// S13 · reprise : l'ancien iPhone arrive, alerte « L'échange est possible », appui sur « Échanger », il devient un 18 Pro Max
const S13 = ({t, v}) => {
  const press = t >= 66.34 && t < 66.44;
  const done = eo(prog(t, 66.5, 0.25));
  const morph = eio(prog(t, 69.9, 0.55));
  const old = spring(t, 63.98, 0.6);
  const cardOut = eio(prog(t, 67.2, 0.35));
  return (
    <>
      <Words t={t} items={[['Même', 62.72], ['si', 62.92], ['tu', 63.04], ['as', 63.16], ['déjà', 63.28], ['un', 63.54], ['ancien', 63.64], ['iPhone,', 63.98]]} style={{position: 'absolute', left: 60, right: 60, top: v ? 200 : 60, ...T(60, 650)}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: v ? 400 : 150, display: 'flex', justifyContent: 'center'}}>
        <div style={{...enter(t, 64.6, 0.2)}}><Pill style={{background: C.ink, color: '#fff', fontSize: 52}}>viens avec.</Pill></div>
      </div>
      <div style={{position: 'absolute', left: v ? '50%' : '30%', top: v ? 880 : 560}}>
        <Rings t={t} at={69.9} size={v ? 760 : 560} />
        <div style={{position: 'absolute', perspective: 1800, transform: `translate(-50%, -50%) translateX(${(1 - old) * -700}px) rotate(${(1 - old) * -8}deg)`, opacity: clamp((t - 63.98) / 0.1) * (morph < 0.5 ? 1 : 0)}}>
          <div style={{transform: `rotateY(${morph * 180}deg)`}}><Phone src="bm-11.png" h={v ? 600 : 420} /></div>
        </div>
        <div style={{position: 'absolute', perspective: 1800, transform: `translate(-50%, -50%) scale(${1 + 0.06 * eo(prog(t, 70.2, 0.5))})`, opacity: morph >= 0.5 ? 1 : 0}}>
          <div style={{transform: `rotateY(${(morph - 1) * 180}deg)`}}><Phone src="p18.png" h={v ? 600 : 440} /></div>
        </div>
      </div>
      {cardOut < 1 && (
        <div style={{position: 'absolute', left: v ? 0 : 880, right: v ? 0 : 120, top: v ? 1180 : 340, display: 'flex', justifyContent: 'center', ...enter(t, 65.82, 0.24, 30), opacity: (t < 65.82 ? 0 : 1) * (1 - cardOut), transform: `translateY(${cardOut * 80}px)`}}>
          <Card style={{width: v ? 860 : 820, padding: '56px 56px 50px', textAlign: 'center'}}>
            {done < 1 ? (
              <div style={{opacity: 1 - done}}>
                <div style={{...T(60, 700), marginBottom: 18}}>L'échange est possible</div>
                <div style={{...T(40, 450, C.gray), marginBottom: 46}}>Apporte ton ancien iPhone en boutique.</div>
                <div style={{display: 'flex', gap: 26}}>
                  <div style={{flex: 1, borderRadius: 99, padding: '30px 0', background: C.bubble, ...T(46, 600)}}>Plus tard</div>
                  <div style={{flex: 1, borderRadius: 99, padding: '30px 0', background: C.accent, ...T(46, 600, '#fff'), transform: press ? 'scale(.97)' : undefined, filter: press ? 'brightness(.85)' : undefined}}>Échanger</div>
                </div>
              </div>
            ) : null}
            {done > 0 && (
              <div style={{position: done < 1 ? 'absolute' : 'relative', inset: done < 1 ? 0 : undefined, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26, opacity: done, padding: done < 1 ? 0 : '30px 0'}}>
                <Check size={110} on={spring(t, 66.5, 0.45)} />
                <div style={{...T(58, 700)}}>Échange accepté</div>
              </div>
            )}
          </Card>
        </div>
      )}
      {t > 67.2 && (
        <div style={{position: 'absolute', left: v ? 60 : 900, right: v ? 60 : 120, top: v ? 1250 : 400}}>
          <Words t={t} items={[['Ton', 67.26], ['ancien', 67.4], ['téléphone', 67.74], ['peut', 68.32], ['devenir', 68.46]]} style={{...T(58, 600, C.gray)}} />
          <Words t={t} items={[['le', 68.98], [<Mark t={t} at={69.2} dur={0.4}>début</Mark>, 69.18], ['de', 69.56], ['ton', 69.7], ['nouveau', 69.94], ['iPhone.', 70.32]]} style={{...T(70, 700), marginTop: 12}} />
        </div>
      )}
    </>
  );
};

// S14 · rappel des villes en liste profonde rapide, « pense d'abord à » → nom de la boutique avec voile rose (référence 2, nsave)
const S14 = ({t, v}) => {
  const times = [72.64, 73.42, 74.34, 75.44];
  const listOut = eio(prog(t, 76.3, 0.3));
  const wash = t >= 79.38 ? 1 - eo(prog(t, 79.38, 0.8)) : 0;
  return (
    <>
      {wash > 0 && <div style={{position: 'absolute', inset: -200, background: '#F7D3D6', opacity: wash * 0.9}} />}
      {listOut < 1 && (
        <Center style={{opacity: 1 - listOut, transform: `translateY(${-listOut * 160}px) scale(${1 - 0.15 * listOut})`, filter: listOut > 0 ? `blur(${listOut * 12}px)` : undefined}}>
          <Words t={t} items={[['Alors', 71.6], ['que', 71.9], ['tu', 72.02], ['sois', 72.14], ['à…', 72.34]]} style={{...T(56, 500, C.gray), marginBottom: v ? 40 : 10}} />
          <CityList t={t} v={v} times={times} speed={0.3} />
        </Center>
      )}
      {t > 76.4 && (
        <Center>
          <Words t={t} items={[['avant', 76.64], ["d'acheter", 76.86], ['ton', 77.2], ['prochain', 77.38], ['iPhone,', 77.76]]} style={{...T(60, 600), maxWidth: 960}} />
          <Words t={t} items={[['pense', 78.56], ["d'abord", 78.78], ['à', 79.2]]} style={{...T(60, 600, C.gray), marginTop: 6, marginBottom: 60}} />
          <div style={{...pop(t, 79.38, 0.6, 0.7), filter: t < 79.55 ? `blur(${(1 - prog(t, 79.38, 0.16)) * 14}px)` : undefined}}><Brand size={v ? 160 : 150} /></div>
        </Center>
      )}
    </>
  );
};

// S15 · sondage final puis écran de fin
const S15 = ({t, v}) => {
  const sel = t >= 86.28 ? spring(t, 86.28, 0.4) : 0;
  const end = eio(prog(t, 87.2, 0.6));
  const Radio = ({on}) => (
    <div style={{width: 58, height: 58, borderRadius: '50%', border: `4px solid ${on ? C.green : '#D2D2D7'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
      {on > 0 && <Check size={58} on={on} />}
    </div>
  );
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: v ? 520 : 140, display: 'flex', justifyContent: 'center', transform: `translateY(${-end * (v ? 200 : 60)}px) scale(${1 - 0.18 * end})`, ...enter(t, 81.08, 0.26, 40)}}>
        <Card style={{width: v ? 900 : 1100, padding: '50px 56px'}}>
          <div style={{...T(36, 600, C.gray), marginBottom: 26, letterSpacing: '0.02em'}}>SONDAGE</div>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '30px 0', borderBottom: '2px solid #F0F0F2', ...enter(t, 81.28, 0.2)}}>
            <div style={{...T(52, 500)}}>Un bon iPhone</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 22, ...T(48, 500, C.gray)}}><span style={enter(t, 82.62, 0.2)}>c'est bien</span><Radio on={0} /></div>
          </div>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '34px 0 10px', ...enter(t, 83.48, 0.2)}}>
            <div style={{...T(52, 700), lineHeight: 1.3}}>Un bon iPhone acheté<br />au <Mark t={t} at={84.74} dur={0.45}>bon endroit</Mark></div>
            <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
              <span style={{...T(56, 800), ...pop(t, 86.28, 0.45, 0.5), color: C.accent, textShadow: `0 0 0.35em ${C.glow}`}}>MIEUX</span>
              <Radio on={sel} />
            </div>
          </div>
        </Card>
      </div>
      {t >= 87.2 && t < 88.2 && <div style={{position: 'absolute', inset: -200, background: '#F7D3D6', opacity: (1 - eo(prog(t, 87.2, 0.9))) * 0.8}} />}
      {t > 87.2 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: v ? 1230 : 640, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, opacity: end, transform: `translateY(${(1 - end) * 60}px)`}}>
          <Brand size={v ? 110 : 96} oneLine={!v} />
          <Words t={t} accent={false} items={[['Kolwezi', 87.5], ['·', 87.6], ['Likasi', 87.7], ['·', 87.8], ['Lubumbashi', 87.9], ['·', 88.0], ['Fungurume', 88.1]]} style={{...T(40, 500, C.gray)}} />
        </div>
      )}
    </>
  );
};

const SCENES = [
  [S1, 0, 3.6, {cutOut: true}],
  [S2, 3.6, 7.3, {dir: 1}],
  [S3, 7.3, 10.95, {out: 'zoom'}],
  [S4, 10.95, 15.1, {cutOut: true}],
  [S5, 15.1, 19.25, {cutIn: true, dir: -1}],
  [S6, 19.25, 21.85, {out: 'zoom'}],
  [S7, 21.85, 27.35, {out: 'zoom'}],
  [S8, 27.35, 35.05, {dir: 1}],
  [S9, 35.05, 47.85, {out: 'zoom'}],
  [S10, 47.85, 54.25, {cutOut: true}],
  [S11, 54.25, 58.95, {cutIn: true, dir: -1}],
  [S12, 58.95, 62.5, {out: 'zoom'}],
  [S13, 62.5, 71.45, {dir: 1}],
  [S14, 71.45, 80.9, {out: 'zoom'}],
  [S15, 80.9, DURATION, {cutOut: true}],
];

export const Video = ({vertical}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const v = vertical;
  return (
    <AbsoluteFill style={{background: C.bg, fontFamily: FONT, overflow: 'hidden'}}>
      {SCENES.map(([S, from, to, o = {}], i) => (
        <Scene key={i} id={'s' + i} t={t} from={from} to={to} {...o}>
          <S t={t} v={v} />
        </Scene>
      ))}
      <Audio src={staticFile('mix.wav')} />
    </AbsoluteFill>
  );
};
