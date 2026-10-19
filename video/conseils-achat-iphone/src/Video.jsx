import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, T, FONT, Scene, Center, Words, Ink, Mark, Strike, Card, Pill, Avatar, Bubble, Check, Icon, Phone, Brand, enter, pop, spring, eo, eio, prog, clamp, lerp} from './ui';

// Les instants sont ceux de la voix Koraly (transcription mot à mot, audio/voix-mots.json) : la voix démarre à 0 s.
export const DURATION = 89.5;

// S1 · « Stop… avant d'acheter ton prochain iPhone, écoute ceci. » : un mot à la fois, coupé net
const S1 = ({t, v}) => {
  const words = [['Avant', 0.7], ["d'acheter", 0.96], ['ton prochain', 1.3], ['iPhone,', 1.88], ['écoute', 2.52], ['ceci.', 2.82]];
  const stop = 'Stop.';
  const typed = Math.floor(clamp((t - 0.16) / (4 / 60), 0, stop.length));
  const cur = words.filter(([, at]) => t >= at).pop();
  const ph = spring(t, 1.88, 0.7);
  return (
    <>
      <Center style={{top: v ? -120 : -60}}>
        {t < 0.7 ? (
          <div style={{...T(170, 700, C.red)}}>{stop.slice(0, typed)}<span style={{color: C.ink, fontWeight: 300, opacity: Math.floor(t * 4) % 2 ? 0 : 1}}>|</span></div>
        ) : (
          <div style={{...T(cur[0] === 'iPhone,' ? 120 : 96, 600)}}>{cur[0]}</div>
        )}
      </Center>
      {t > 1.88 && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: v ? 260 : 40, display: 'flex', justifyContent: 'center', opacity: clamp((t - 1.88) / 0.12), transform: `translateY(${(1 - ph) * 260}px)`, filter: `blur(${lerp(14, 0, clamp((t - 1.88) / 0.5))}px)`}}>
          <Phone src="p18.png" h={v ? 640 : 420} />
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

// S4 · une pilule par ville, ressort léger
const S4 = ({t, v}) => (
  <Center>
    <Words t={t} items={[['Que', 11.16], ['tu', 11.28], ['sois', 11.4], ['à…', 11.58]]} style={{...T(56, 500, C.gray), marginBottom: 60}} />
    <div style={{display: 'flex', flexDirection: v ? 'column' : 'row', alignItems: 'center', gap: v ? 44 : 36}}>
      {CITIES.map(([c, at], i) => (
        <div key={c} style={pop(t, at, 0.5, 0.5)}>
          <Pill style={{fontSize: v ? 58 : 50}}>{Icon.pin(v ? 50 : 44)}{c}{i === 0 && <span style={{width: 24, height: 24, borderRadius: '50%', background: C.blue}} />}</Pill>
        </div>
      ))}
    </div>
  </Center>
);

// S5 · les pilules fusionnent → nom de la boutique ; « une nouvelle expérience »
const S5 = ({t, v}) => {
  const m = eio(prog(t, 15.1, 0.4));
  return (
    <>
      {m < 1 && (
        <Center>
          <div style={{display: 'flex', flexDirection: v ? 'column' : 'row', alignItems: 'center', gap: lerp(v ? 44 : 36, -120, m), opacity: 1 - m, transform: `scale(${1 - 0.6 * m})`, filter: `blur(${m * 10}px)`}}>
            {CITIES.map(([c]) => <Pill key={c}>{Icon.pin(44)}{c}</Pill>)}
          </div>
        </Center>
      )}
      <Center>
        <div style={{...T(52, 500, C.gray), ...enter(t, 15.3, 0.2), marginBottom: 14}}>chez</div>
        <div style={{...pop(t, 15.56, 0.6, 0.7)}}><Brand size={v ? 150 : 140} /></div>
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

// S7 · carte check-list budget / besoin / style de vie
const S7 = ({t, v}) => {
  const rows = [['ton budget', 24.3], ['ton besoin', 25.36], ['ton style de vie', 26.36]];
  return (
    <Center>
      <Words t={t} items={[['On', 22.04], ["t'aide", 22.18], ['à', 22.42], ['choisir', 22.48], ["l'iPhone", 22.86]]} style={{...T(64, 650)}} />
      <Words t={t} items={[['qui', 23.4], ['correspond', 23.58], ['à…', 24.06]]} style={{...T(64, 500, C.ghost), marginBottom: 60}} />
      <div style={enter(t, 23.7, 0.26, 40)}>
        <Card style={{padding: '56px 70px', display: 'flex', flexDirection: 'column', gap: 50, width: v ? 820 : 900}}>
          {rows.map(([r, at]) => {
            const on = t >= at ? spring(t, at, 0.4) : 0;
            return (
              <div key={r} style={{display: 'flex', alignItems: 'center', gap: 34, ...T(64, 600, t >= at ? C.ink : C.ghost)}}>
                <Check size={70} on={on} />{r}
              </div>
            );
          })}
        </Card>
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
          const s = t < at ? 0 : spring(t, at, 0.6);
          return (
            <div key={src} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34, opacity: clamp((t - at) / 0.1), transform: `translateY(${(1 - s) * -180}px)`}}>
              <Phone src={src} h={v ? 450 : 330} />
              <div style={{...T(46, 600)}}>{label}</div>
            </div>
          );
        })}
      </div>
    </>
  );
};

// S9 · question « puissant » puis carrousel des Pro Max, le 18 arrive en grand
const PRO = [['bm-14promax.png', 'iPhone 14 Pro Max', 40.9], ['bm-15promax.png', 'iPhone 15 Pro Max', 42.12], ['bm-16promax.png', 'iPhone 16 Pro Max', 43.24], ['bm-17promax.png', 'iPhone 17 Pro Max', 44.42], ['p18.png', 'iPhone 18 Pro Max', 46.3]];
const S9 = ({t, v}) => {
  const q = [['Tu', 35.24], ['veux', 35.38], ['un', 35.5], ['iPhone', 35.64], ['plus', 36.12], ['puissant', 36.34], ['avec', 36.92], ['une', 37.14], ['caméra', 37.3], ['premium', 37.72], ['et', 38.36], ['une', 38.44], ['meilleure', 38.6], ['autonomie ?', 38.9]];
  const pills = [[Icon.bolt, 'puissant', 36.34], [Icon.camera, 'caméra premium', 37.3], [Icon.battery, 'autonomie', 38.9]];
  const qOut = eio(prog(t, 39.7, 0.3));
  // position du carrousel : index courant interpolé entre deux modèles (glissé rapide avec flou de bougé)
  let idx = 0, blur = 0;
  for (let i = 0; i < PRO.length; i++) {
    const at = PRO[i][2];
    const d = i === 4 ? 0.55 : 0.32;
    const k = eio(prog(t, at - 0.12, d));
    if (i > 0) idx += k;
    if (t > at - 0.12 && t < at - 0.12 + d) blur = Math.sin(Math.PI * prog(t, at - 0.12, d)) * (i === 4 ? 10 : 16);
  }
  const gap = v ? 620 : 560;
  const show = t > 39.9;
  return (
    <>
      {qOut < 1 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: v ? 520 : 240, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 50, opacity: 1 - qOut, transform: `translateY(${-qOut * 200}px) scale(${1 - 0.2 * qOut})`}}>
          <Bubble t={t} at={35.24} width={v ? 900 : 1300} size={v ? 54 : 50}><Ink t={t} items={q} /></Bubble>
          <div style={{display: 'flex', flexDirection: v ? 'column' : 'row', gap: 30, alignItems: 'center'}}>
            {pills.map(([ic, l, at]) => <div key={l} style={pop(t, at, 0.45, 0.5)}><Pill>{ic(48)}{l}</Pill></div>)}
          </div>
        </div>
      )}
      {show && (
        <>
          <Words t={t} items={[['On', 39.88], ['peut', 40.04], ['te', 40.18], ['conseiller', 40.32], ['le…', 40.78]]} style={{position: 'absolute', left: 0, right: 0, top: v ? 300 : 110, ...T(52, 500, C.gray)}} />
          <div style={{position: 'absolute', left: '50%', top: v ? 960 : 560, opacity: clamp((t - 40.6) / 0.2)}}>
            {PRO.map(([src], i) => {
              const off = i - idx;
              const a = Math.abs(off);
              const big = i === 4 ? 1 + 0.25 * eo(prog(t, 46.3, 0.6)) : 1;
              const sc = (1 - 0.28 * Math.min(a, 1.5)) * big;
              const h = v ? 760 : 500;
              return (
                <div key={src} style={{position: 'absolute', left: 0, top: 0, transform: `translate(-50%, -50%) translateX(${off * gap}px) scale(${sc})`, opacity: clamp(1.6 - a * 0.6), filter: `blur(${a * 7 + blur}px)`, zIndex: 10 - Math.round(a)}}>
                  <Phone src={src} h={h} />
                </div>
              );
            })}
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: v ? 1460 : 880, display: 'flex', justifyContent: 'center'}}>
            {PRO.map(([, label, at], i) => {
              const next = PRO[i + 1] ? PRO[i + 1][2] - 0.12 : 99;
              if (t < at - 0.05 || t >= next) return null;
              return <div key={label} style={{position: 'absolute', ...pop(t, at, 0.4, 0.7)}}><Pill style={{fontSize: i === 4 ? 64 : 52, padding: i === 4 ? '28px 54px' : undefined}}>{label}</Pill></div>;
            })}
          </div>
          {t > 45.6 && t < 46.4 && <Words t={t} items={[['ou', 45.72], ['même', 45.86], ['le…', 46.1]]} style={{position: 'absolute', left: 0, right: 0, top: v ? 1600 : 980, ...T(48, 500, C.gray)}} />}
        </>
      )}
    </>
  );
};

// S10 · « Et le plus important » + carte de trois engagements
const S10 = ({t, v}) => {
  const rows = [['Pose tes questions', 50.08], ['Compare les modèles', 51.18], [<span>Un conseil <Mark t={t} at={53.3} dur={0.45}>honnête</Mark></span>, 52.64]];
  return (
    <Center>
      <Words t={t} items={[['Et', 48.1], ['le', 48.2], ['plus', 48.34], ['important', 48.54]]} style={{...T(84, 700), marginBottom: 70}} />
      <div style={enter(t, 49.36, 0.26, 40)}>
        <Card style={{padding: '60px 70px', display: 'flex', flexDirection: 'column', gap: 54, width: v ? 880 : 960}}>
          {rows.map(([r, at], i) => (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 34, ...T(60, 600, t >= at ? C.ink : C.ghost)}}>
              <Check size={68} on={t >= at ? spring(t, at, 0.4) : 0} />{r}
            </div>
          ))}
        </Card>
      </div>
    </Center>
  );
};

// S11 · deux phrases barrées puis « juste une vraie orientation »
const S11 = ({t}) => (
  <Center style={{gap: 64, padding: '0 70px', textAlign: 'center'}}>
    <div style={{...T(68, 600), ...enter(t, 54.5, 0.2)}}><Strike t={t} at={55.12}>Pas de pression</Strike></div>
    <div style={{...T(68, 600), ...enter(t, 55.52, 0.2)}}><Strike t={t} at={56.7}>Pas de discours compliqué</Strike></div>
    <div style={{...T(76, 700), ...enter(t, 57.3, 0.2)}}>Juste une <Mark t={t} at={57.8} dur={0.6}>vraie orientation</Mark></div>
  </Center>
);

// S12 · seul plan en couleur pleine : « comme si on conseillait un frère, une sœur, un ami. »
const S12 = ({t, v}) => {
  const ppl = [['👦🏾', 'un frère', 60.22], ['👧🏾', 'une sœur', 61.0], ['🧑🏾', 'un ami', 61.66]];
  return (
    <Center>
      <Words t={t} items={[['comme', 59.14], ['si', 59.34], ['on', 59.46], ['conseillait', 59.62]]} style={{...T(84, 650, '#fff'), marginBottom: 90}} />
      <div style={{display: 'flex', gap: v ? 70 : 120}}>
        {ppl.map(([e, l, at]) => (
          <div key={l} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, ...pop(t, at, 0.5, 0.4)}}>
            <Avatar size={v ? 200 : 210} emoji={e} bg="rgba(255,255,255,.92)" />
            <div style={{...T(52, 600, '#fff')}}>{l}</div>
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
      <div style={{position: 'absolute', left: v ? '50%' : '30%', top: v ? 820 : 560}}>
        <div style={{position: 'absolute', transform: `translate(-50%, -50%) translateX(${(1 - old) * -700 - morph * 60}px) scale(${1 - 0.5 * morph}) rotate(${(1 - old) * -8}deg)`, opacity: clamp((t - 63.98) / 0.1) * (1 - morph), filter: `blur(${morph * 18}px)`}}>
          <Phone src="bm-11.png" h={v ? 600 : 420} />
        </div>
        <div style={{position: 'absolute', transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * spring(t, 69.94, 0.6)})`, opacity: morph, filter: `blur(${(1 - morph) * 18}px)`}}>
          <Phone src="p18.png" h={v ? 700 : 480} />
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
                  <div style={{flex: 1, borderRadius: 99, padding: '30px 0', background: C.blue, ...T(46, 600, '#fff'), transform: press ? 'scale(.97)' : undefined, filter: press ? 'brightness(.85)' : undefined}}>Échanger</div>
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

// S14 · rappel des villes, « pense d'abord à » → nom de la boutique
const S14 = ({t, v}) => {
  const times = [72.64, 73.42, 74.34, 75.44];
  return (
    <Center>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 22, maxWidth: v ? 960 : 1600, marginBottom: 80}}>
        {CITIES.map(([c], i) => <div key={c} style={pop(t, times[i], 0.45, 0.5)}><Pill style={{fontSize: 42, padding: '18px 32px', gap: 12}}>{Icon.pin(36)}{c}</Pill></div>)}
      </div>
      <Words t={t} items={[['avant', 76.64], ["d'acheter", 76.86], ['ton', 77.2], ['prochain', 77.38], ['iPhone,', 77.76]]} style={{...T(56, 500, C.gray), maxWidth: 960}} />
      <Words t={t} items={[['pense', 78.56], ["d'abord", 78.78], ['à', 79.2]]} style={{...T(56, 500, C.gray), marginTop: 6, marginBottom: 50}} />
      <div style={pop(t, 79.38, 0.6, 0.7)}><Brand size={v ? 160 : 150} /></div>
    </Center>
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
              <span style={{...T(56, 800), ...pop(t, 86.28, 0.45, 0.5)}}>MIEUX</span>
              <Radio on={sel} />
            </div>
          </div>
        </Card>
      </div>
      {t > 87.2 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: v ? 1230 : 640, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, opacity: end, transform: `translateY(${(1 - end) * 60}px)`}}>
          <Brand size={v ? 110 : 96} oneLine={!v} />
          <div style={{...T(40, 500, C.gray)}}>Kolwezi · Likasi · Lubumbashi · Fungurume</div>
        </div>
      )}
    </>
  );
};

const SCENES = [
  [S1, 0, 3.6, {cutOut: true}],
  [S2, 3.6, 7.3],
  [S3, 7.3, 10.95],
  [S4, 10.95, 15.1, {cutOut: true}],
  [S5, 15.1, 19.25, {cutIn: true}],
  [S6, 19.25, 21.85],
  [S7, 21.85, 27.35],
  [S8, 27.35, 35.05],
  [S9, 35.05, 47.85],
  [S10, 47.85, 54.25],
  [S11, 54.25, 58.95, {cutOut: true}],
  [S12, 58.95, 62.5, {bg: C.night, cutIn: true, cutOut: true}],
  [S13, 62.5, 71.45, {cutIn: true}],
  [S14, 71.45, 80.9],
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
        <Scene key={i} t={t} from={from} to={to} {...o}>
          <S t={t} v={v} />
        </Scene>
      ))}
      <Audio src={staticFile('mix.wav')} />
    </AbsoluteFill>
  );
};
