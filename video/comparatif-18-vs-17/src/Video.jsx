import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT, T, Layer, At, Card, Mark, Words, Step, Check, Cursor, Iris, appear, pop, prog, eo5, eio, lerp, clamp, shadow} from './ui';

// Les instants sont ceux de la voix (prise 2, mots repérés par transcription) ; la voix démarre à VO_OFF dans la vidéo.
export const VO_OFF = 0.5;
export const DURATION = 66;
const w = (x) => x + VO_OFF;

// Bornes des scènes (secondes vidéo)
const S = {
  s12: [0, w(7.82)],
  s3: [w(7.82), w(11.03)],
  s4: [w(11.03), w(22.44)],
  s5: [w(22.44), w(28.32)],
  s6: [w(28.32), w(40.14)],
  s7: [w(40.14), w(50.37)],
  s8: [w(50.37), w(58.37)],
  s9: [w(58.37), DURATION + 1],
};

// ——— 1 et 2 : accroche + question ———
const Phones = ({t, V}) => {
  const h = V ? 600 : 560;
  const cy = V ? 1060 : 600;
  const d1 = V ? 255 : 340;
  const d2 = V ? 150 : 190;
  const enter = eo5(prog(t, 0.1, 1.4));
  const close = eio(prog(t, w(2.39), 0.9));
  const open = eio(prog(t, w(3.6), 0.9));
  const d = lerp(lerp(d1 + (V ? 700 : 900), d1, enter), d2, close * (1 - open));
  const dim = eio(prog(t, w(4.93), 0.8));
  const lab = appear(t, w(3.72), 0.6, 10);
  const phone = (src, x, z, label, strong) => (
    <div style={{position: 'absolute', left: x, top: cy - h / 2, transform: 'translateX(-50%)', zIndex: z, textAlign: 'center'}}>
      <Img src={staticFile(src)} style={{height: h, display: 'block', filter: 'drop-shadow(0 34px 40px rgba(0,0,0,.16)) drop-shadow(0 6px 10px rgba(0,0,0,.08))'}} />
      <div style={{...T(30, 600, strong ? C.ink : C.gray), marginTop: 38, ...lab, opacity: lab.opacity * (1 - dim)}}>{label}</div>
    </div>
  );
  const W = V ? 1080 : 1920;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: lerp(1, 0.13, dim), filter: dim > 0.01 ? `blur(${dim * 6}px)` : undefined, transform: `scale(${lerp(1, 0.94, dim)})`}}>
      {phone('p17.png', W / 2 + d, 1, 'iPhone 17 Pro Max', false)}
      {phone('p18.png', W / 2 - d, 2, 'iPhone 18 Pro Max', true)}
    </div>
  );
};

const Scene12 = ({t, V}) => {
  const out = eio(prog(t, w(4.75), 0.5));
  const bubbleAt = w(5.5);
  const q = [['Apple', w(5.72)], ['nous', w(6.03)], ['revend', w(6.2)], ['le', w(6.53)], ['même', w(6.69)], ['téléphone ?', w(6.93)]];
  const dots = pop(t, w(7.35), 0.45);
  return (
    <>
      <Phones t={t} V={V} />
      <At y={V ? 300 : 110} style={{opacity: 1 - out, filter: out > 0 ? `blur(${out * 8}px)` : undefined}}>
        <div style={{...T(V ? 104 : 88), textAlign: 'center', lineHeight: 1.04, display: 'flex', flexDirection: V ? 'column' : 'row', gap: V ? 0 : '0.26em'}}>
          <Words t={t} items={[['Presque', w(1.91)]]} />
          <Words t={t} items={[[<Mark t={t} at={w(2.9)} dur={0.7}>identiques.</Mark>, w(2.39)]]} />
        </div>
      </At>
      {t > bubbleAt - 0.1 && (
        <div style={{position: 'absolute', left: V ? 100 : 470, top: V ? 700 : 330, display: 'flex', flexDirection: 'column', gap: 28}}>
          <div style={{display: 'flex', alignItems: 'flex-end', gap: 24, ...pop(t, bubbleAt, 0.6), transformOrigin: 'left bottom'}}>
            <div style={{width: 96, height: 96, borderRadius: '50%', background: C.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', ...T(44, 600, '#fff'), flexShrink: 0}}>?</div>
            <div style={{background: C.tile, borderRadius: '46px 46px 46px 12px', padding: '38px 48px', boxShadow: shadow, maxWidth: V ? 760 : 820}}>
              <Words t={t} items={q} style={{...T(52, 600), justifyContent: 'flex-start', whiteSpace: 'normal', lineHeight: 1.2}} gap="0.24em" />
            </div>
          </div>
          <div style={{marginLeft: 120, display: 'inline-flex', gap: 14, background: C.tile, borderRadius: 40, padding: '30px 38px', alignSelf: 'flex-start', ...dots, transformOrigin: 'left center'}}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{width: 18, height: 18, borderRadius: '50%', background: C.gray2, opacity: 0.45 + 0.55 * Math.max(0, Math.sin((t * 5 - i * 0.9) * 1.2))}} />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

// ——— 3 : « Pas tout à fait. Regarde ce qui change à l'intérieur. » ———
const Scene3 = ({t, V}) => {
  const items = ['Caméra', 'Autonomie', 'Puce et refroidissement'];
  const at = [w(9.45), w(9.85), w(10.25)];
  return (
    <>
      <At y={V ? 330 : 120}>
        <div style={{textAlign: 'center'}}>
          <div style={{...T(44, 600, C.gray), ...appear(t, w(7.82), 0.6)}}>Pas tout à fait.</div>
          <div style={{...T(V ? 88 : 84), marginTop: 34, lineHeight: 1.08}}>
            <Words t={t} items={[['Regarde', w(8.64)], ['ce', w(9.39)], ['qui', w(9.5)], ['change', w(9.71)]]} />
            <Words t={t} items={[[<span style={{color: C.gray}}>à l’intérieur.</span>, w(9.96)]]} />
          </div>
        </div>
      </At>
      <At y={V ? 860 : 560}>
        <div style={{display: 'flex', flexDirection: V ? 'column' : 'row', gap: V ? 34 : 30}}>
          {items.map((txt, i) => (
            <Card key={i} style={{width: V ? 800 : 500, padding: V ? '42px 52px' : '44px 46px', display: 'flex', alignItems: 'center', gap: 34, ...appear(t, at[i], 0.6, 60)}}>
              <span style={T(36, 600, C.gray2)}>0{i + 1}</span>
              <span style={{...T(V ? 48 : 40, 600), whiteSpace: 'normal'}}>{txt}</span>
            </Card>
          ))}
        </div>
      </At>
    </>
  );
};

// ——— 4 : ouverture variable ———
const APS = ['ƒ/1,48', 'ƒ/1,8', 'ƒ/2,8', 'ƒ/4,0'];
const PHOTOS = ['ap-max_light.jpg', 'ap-balance.jpg', 'ap-depth.jpg', 'ap-max_depth.jpg'];
// position du sélecteur (0 = ƒ/1,48 … 3 = ƒ/4,0) au fil de la voix
const apPos = (t) => {
  let p = 1;
  p = lerp(p, 0, eio(prog(t, w(17.04), 0.7))); // « elle s'ouvre »
  p = lerp(p, 1, eio(prog(t, w(19.55), 0.3))); // « se resserre » : trois crans
  p = lerp(p, 2, eio(prog(t, w(19.85), 0.3)));
  p = lerp(p, 3, eio(prog(t, w(20.15), 0.35)));
  return p;
};

const Scene4 = ({t, V}) => {
  const p = apPos(t);
  const title2 = eio(prog(t, w(14.4), 0.6));
  const pw = V ? 940 : 900;
  const ph = Math.round(pw * 1224 / 2100);
  const segW = V ? 196 : 180;
  const photo = appear(t, w(13.5), 0.8, 40);
  const irisOpen = lerp(22, 7, p / 3);
  return (
    <>
      <At y={V ? 150 : 70}><Step t={t} at={w(11.03)}>Différence 1 sur 3</Step></At>
      <At y={V ? 250 : 150}>
        <div style={{position: 'relative', textAlign: 'center', ...T(V ? 84 : 72)}}>
          <div style={{opacity: 1 - title2, transform: `translateY(${-title2 * 20}px)`, filter: title2 > 0 ? `blur(${title2 * 8}px)` : undefined}}>
            <Words t={t} items={[['La', w(12.29)], ['caméra', w(12.46)], ['principale', w(12.86)]]} />
          </div>
          <div style={{position: 'absolute', left: '50%', top: 0, transform: `translateX(-50%) translateY(${(1 - title2) * 20}px)`, opacity: title2, filter: title2 < 1 ? `blur(${(1 - title2) * 8}px)` : undefined}}>
            Ouverture <Mark t={t} at={w(15.03)}>variable.</Mark>
          </div>
        </div>
      </At>
      {/* photo d'exemple Apple, qui change avec l'ouverture */}
      <div style={{position: 'absolute', left: V ? (1080 - pw) / 2 : 120, top: V ? 420 : 260, width: pw, height: ph, borderRadius: 40, overflow: 'hidden', boxShadow: shadow, ...photo}}>
        {PHOTOS.map((f, i) => (
          <Img key={f} src={staticFile(f)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: clamp(1 - Math.abs(p - i)), transform: `scale(${1.04 - 0.04 * prog(t, w(13.5), 9)})`}} />
        ))}
        <div style={{position: 'absolute', right: 26, top: 26, display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,.92)', borderRadius: 999, padding: '10px 22px 10px 10px', ...appear(t, w(15.6), 0.6, 10)}}>
          <Iris r={30} open={irisOpen} spin={p * 0.5} />
          <span style={T(28, 700)}>{APS[Math.round(p)]}</span>
        </div>
      </div>
      {/* sélecteur d'ouverture */}
      <div style={{position: 'absolute', left: V ? (1080 - segW * 4 - 20) / 2 : 120 + (pw - segW * 4 - 20) / 2, top: V ? 420 + ph + 50 : 260 + ph + 40, ...appear(t, w(15.03), 0.6, 16)}}>
        <div style={{position: 'relative', background: C.tile, borderRadius: 999, padding: 10, display: 'flex'}}>
          <div style={{position: 'absolute', left: 10 + p * segW, top: 10, width: segW, bottom: 10, borderRadius: 999, background: C.ink}} />
          {APS.map((a, i) => (
            <div key={a} style={{position: 'relative', width: segW, textAlign: 'center', padding: '22px 0', ...T(V ? 38 : 34, 600, clamp(1 - Math.abs(p - i)) > 0.5 ? '#fff' : C.gray)}}>{a}</div>
          ))}
        </div>
      </div>
      {/* 17 contre 18 */}
      <div style={{position: 'absolute', left: V ? 0 : 1100, right: V ? 0 : 120, top: V ? 1260 : 300, display: 'flex', flexDirection: V ? 'row' : 'column', justifyContent: 'center', gap: V ? 36 : 34}}>
        <Card flat style={{width: V ? 440 : '100%', padding: '40px 44px', textAlign: V ? 'center' : 'left', ...appear(t, w(15.7), 0.6, 30)}}>
          <div style={T(28, 600, C.gray)}>iPhone 17 Pro Max</div>
          <div style={{...T(44, 600, C.gray), marginTop: 14}}>Ouverture fixe</div>
        </Card>
        <Card style={{width: V ? 440 : '100%', padding: '40px 44px', textAlign: V ? 'center' : 'left', ...appear(t, w(16.0), 0.6, 30)}}>
          <div style={T(28, 600)}>iPhone 18 Pro Max</div>
          <div style={{...T(44, 700), marginTop: 14}}>4 ouvertures</div>
        </Card>
      </div>
      <At y={V ? 1530 : 820} x={V ? undefined : 1460}>
        <div style={{...T(V ? 40 : 34, 600, C.gray), textAlign: 'center', lineHeight: 1.35, whiteSpace: 'normal', width: V ? 900 : 640}}>
          <span style={appear(t, w(18.19), 0.6, 10)}>Plus de <span style={{color: C.ink}}><Mark t={t} at={w(18.5)}>lumière</Mark></span>,</span>{' '}
          <span style={appear(t, w(20.75), 0.6, 10)}>ou plus de <span style={{color: C.ink}}><Mark t={t} at={w(21.07)}>netteté</Mark></span> en profondeur.</span>
        </div>
      </At>
    </>
  );
};

// ——— 5 : ce que ça change ———
const Scene5 = ({t, V}) => {
  const k = eio(prog(t, w(22.7), 1.6));
  const r = V ? 170 : 160;
  const rows = [['Portraits', w(24.85)], ['Vidéos', w(25.82)], ['Photos quand la lumière manque', w(26.78)]];
  return (
    <>
      <At y={V ? 150 : 70}><Step t={t} at={w(22.44)}>Résultat</Step></At>
      <div style={{position: 'absolute', left: V ? 0 : 120, width: V ? 1080 : 760, top: V ? 290 : 270, display: 'flex', justifyContent: 'center', gap: V ? 90 : 70}}>
        {[[lerp(80, 30, k), 'ƒ/4,0', 'Plus de netteté'], [lerp(80, 128, k), 'ƒ/1,48', 'Plus de lumière']].map(([o, a, l], i) => (
          <div key={a} style={{textAlign: 'center', ...appear(t, w(22.6) + i * 0.2, 0.7, 30)}}>
            <Iris r={V ? r : r * 0.95} open={o * (V ? 1 : 0.95)} spin={(i ? k : -k) * 0.6} />
            <div style={{...T(40, 700), marginTop: 30}}>{a}</div>
            <div style={{...T(30, 500, C.gray), marginTop: 10}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: V ? 0 : 960, right: V ? 0 : 120, top: V ? 900 : 290, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30}}>
        {rows.map(([txt, at]) => (
          <Card key={txt} style={{width: V ? 800 : '100%', padding: '38px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 30, ...appear(t, at, 0.6, 40)}}>
            <span style={{...T(V ? 46 : 42, 600), whiteSpace: 'normal', lineHeight: 1.15}}>{txt}</span>
            <div style={pop(t, at + 0.25, 0.5)}><Check /></div>
          </Card>
        ))}
      </div>
    </>
  );
};

// ——— 6 : autonomie ———
const Battery = ({t, at, frac, hours, label, strong, width, badge}) => {
  const f = eo5(prog(t, at, 1.1));
  const h = Math.round(hours * f);
  return (
    <div style={{width: width + 220, ...appear(t, at - 0.2, 0.6, 20)}}>
      <div style={{...T(32, 600, strong ? C.ink : C.gray), marginBottom: 20}}>{label}</div>
      <div style={{display: 'flex', alignItems: 'center', gap: 34}}>
        <div style={{position: 'relative', width, height: 104, borderRadius: 32, border: `4px solid ${strong ? C.ink : C.gray3}`, padding: 8, boxSizing: 'border-box'}}>
          <div style={{width: `${frac * f * 100}%`, height: '100%', borderRadius: 22, background: strong ? C.ink : C.gray3}} />
          <div style={{position: 'absolute', right: -16, top: 32, width: 10, height: 32, borderRadius: '0 6px 6px 0', background: strong ? C.ink : C.gray3}} />
          {badge}
        </div>
        <span style={{...T(60, 700, strong ? C.ink : C.gray), fontVariantNumeric: 'tabular-nums'}}>{h} h</span>
      </div>
    </div>
  );
};

const Scene6 = ({t, V}) => {
  const t2 = eio(prog(t, w(31.7), 0.6));
  const bw = V ? 640 : 900;
  const badge = (
    <div style={{position: 'absolute', right: -10, top: -78, background: C.green, borderRadius: 999, padding: '12px 26px', ...T(36, 700, '#fff'), ...pop(t, w(36.3), 0.6), transformOrigin: 'right bottom'}}>+6 h</div>
  );
  return (
    <>
      <At y={V ? 150 : 70}><Step t={t} at={w(28.32)}>Différence 2 sur 3</Step></At>
      <At y={V ? 260 : 150}>
        <div style={{position: 'relative', textAlign: 'center'}}>
          <div style={{...T(V ? 92 : 80), opacity: 1 - t2, filter: t2 > 0 ? `blur(${t2 * 8}px)` : undefined, transform: `translateY(${-t2 * 20}px)`}}>
            <Words t={t} items={[['L’autonomie.', w(29.88)]]} />
          </div>
          <div style={{position: 'absolute', left: '50%', top: 0, transform: `translateX(-50%) translateY(${(1 - t2) * 20}px)`, opacity: t2, filter: t2 < 1 ? `blur(${(1 - t2) * 8}px)` : undefined, textAlign: 'center'}}>
            <div style={T(V ? 88 : 80)}>Jusqu’à <Mark t={t} at={w(32.1)}>6 h de plus</Mark></div>
            <div style={{...T(V ? 50 : 44, 600, C.gray), marginTop: 18, ...appear(t, w(32.92), 0.6, 10)}}>en lecture vidéo</div>
          </div>
        </div>
      </At>
      <div style={{position: 'absolute', left: 0, right: 0, top: V ? 640 : 450, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: V ? 90 : 60}}>
        <Battery t={t} at={w(34.03)} frac={1} hours={43} label="iPhone 18 Pro Max" strong width={bw} badge={badge} />
        <Battery t={t} at={w(35.5)} frac={37 / 43} hours={37} label="iPhone 17 Pro Max" width={bw} />
      </div>
      <At y={V ? 1230 : 900}>
        <div style={{...T(V ? 36 : 32, 500, C.gray), ...appear(t, w(37.42), 0.6, 10)}}>
          Selon Apple. Dans la vraie vie, ça dépend de <span style={{color: C.ink}}><Mark t={t} at={w(39.1)}>ton usage</Mark></span>.
        </div>
      </At>
    </>
  );
};

// ——— 7 : puce A20 Pro + chambre à vapeur ———
const Chip = ({size, name, on, glow = 0, shine = -1}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.17, position: 'relative', background: on ? '#0B0B0C' : C.tile, boxShadow: on ? '0 30px 70px rgba(0,0,0,.25)' : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
    <div style={{width: size * 0.62, height: size * 0.62, borderRadius: size * 0.06, background: on ? 'linear-gradient(180deg,#F4F4F6,#D9D9DE)' : '#E6E6EA', boxShadow: on ? `0 0 ${size * 0.12 * glow}px rgba(255,255,255,${0.55 * glow})` : undefined, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div style={T(size * 0.2, 700, on ? C.ink : C.gray2)}>{name}</div>
      <div style={{...T(size * 0.09, 700, on ? '#3A3A3C' : C.gray2), marginTop: size * 0.015, letterSpacing: size * 0.005}}>PRO</div>
    </div>
    {shine >= 0 && shine <= 1 && (
      <div style={{position: 'absolute', top: -size * 0.2, bottom: -size * 0.2, width: size * 0.35, left: lerp(-size * 0.5, size * 1.2, shine), transform: 'rotate(20deg)', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.55), rgba(255,255,255,0))'}} />
    )}
  </div>
);

const Scene7 = ({t, V}) => {
  const a20 = prog(t, w(42.32), 0.7);
  const shine = prog(t, w(42.6), 1.1);
  const grow = eio(prog(t, w(44.52), 0.9));
  const cs = V ? 330 : 300;
  return (
    <>
      <At y={V ? 150 : 70}><Step t={t} at={w(40.14)}>Différence 3 sur 3</Step></At>
      <div style={{position: 'absolute', left: V ? 0 : 80, width: V ? 1080 : 900, top: V ? 290 : 240, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: V ? 50 : 44}}>
        <div style={{textAlign: 'center', ...appear(t, w(41.47), 0.6, 20), opacity: appear(t, w(41.47), 0.6).opacity * lerp(1, 0.6, a20)}}>
          <Chip size={cs * 0.72} name="A19" />
          <div style={{...T(28, 600, C.gray2), marginTop: 22}}>17 Pro Max</div>
        </div>
        <svg width="70" height="40" viewBox="0 0 70 40" style={appear(t, w(42.1), 0.5, 0)}><path d="M4 20h58M46 6l16 14-16 14" fill="none" stroke={C.gray3} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <div style={{textAlign: 'center', ...pop(t, w(42.32), 0.7)}}>
          <Chip size={cs} name="A20" on glow={clamp(a20 * 2) * (1 - 0.6 * prog(t, w(43.5), 1.5))} shine={shine > 0 && shine < 1 ? eio(shine) : -1} />
          <div style={{...T(30, 700), marginTop: 22}}>18 Pro Max</div>
        </div>
      </div>
      <div style={{position: 'absolute', left: V ? 90 : 1040, right: V ? 90 : 100, top: V ? 830 : 240, ...appear(t, w(43.5), 0.7, 40)}}>
        <Card style={{padding: V ? '50px 56px' : '46px 50px'}}>
          <div style={T(30, 600, C.gray)}>Refroidissement</div>
          <div style={{...T(V ? 56 : 52), marginTop: 12}}>Chambre à vapeur</div>
          <div style={{display: 'flex', gap: 26, marginTop: 42, alignItems: 'flex-end'}}>
            <div style={{textAlign: 'center'}}>
              <div style={{width: 120, height: 120, borderRadius: 26, background: '#E8E8ED'}} />
              <div style={{...T(24, 600, C.gray2), marginTop: 14}}>17 Pro Max</div>
            </div>
            <div style={{textAlign: 'center'}}>
              <div style={{width: lerp(120, 360, grow), height: 120, borderRadius: 26, background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
                <span style={{...T(44, 700, '#fff'), opacity: clamp(grow * 2 - 1)}}>surface ×3</span>
              </div>
              <div style={{...T(24, 600), marginTop: 14}}>18 Pro Max</div>
            </div>
          </div>
        </Card>
      </div>
      <At y={V ? 1370 : 720}>
        <div style={{display: 'flex', gap: 24}}>
          {[['Jeux', w(47.19)], ['Montage vidéo', w(47.97)]].map(([l, at]) => (
            <div key={l} style={{background: C.tile, borderRadius: 999, padding: '24px 44px', ...T(42, 600), ...pop(t, at, 0.55)}}>{l}</div>
          ))}
        </div>
      </At>
      <At y={V ? 1520 : 860}>
        <div style={{...T(V ? 40 : 36, 600, C.gray), ...appear(t, w(48.77), 0.6, 10)}}>
          Restent <span style={{color: C.ink}}><Mark t={t} at={w(49.11)}>fluides plus longtemps</Mark></span>.
        </div>
      </At>
    </>
  );
};

// ——— 8 : le choix ———
const Scene8 = ({t, V}) => {
  const card = appear(t, w(52.0), 0.7, 40);
  const keep = eio(prog(t, w(54.1), 0.3)) * (1 - eio(prog(t, w(54.9), 0.4)));
  const cw = V ? 880 : 1000;
  // curseur : arrive vers « Je compare » puis appuie
  const cx0 = cw * 0.9, cy0 = 560, cx1 = cw * 0.74, cy1 = 255;
  const mv = eio(prog(t, w(56.2), 1.0));
  const press = prog(t, w(57.5), 0.25);
  const pressS = press > 0 && press < 1 ? 1 - 0.08 * Math.sin(press * Math.PI) : 1;
  const done = eo5(prog(t, w(57.62), 0.45));
  return (
    <>
      <At y={V ? 560 : 170}>
        <div style={T(V ? 92 : 84)}>
          <Words t={t} items={[['Faut-il', w(50.82)], ['changer ?', w(51.33)]]} />
        </div>
      </At>
      <At y={V ? 780 : 380}>
        <div style={{position: 'relative', ...card}}>
          <Card style={{width: cw, padding: '60px 60px 56px', textAlign: 'center'}}>
            <div style={T(46, 700)}>Ton choix</div>
            <div style={{...T(32, 500, C.gray), marginTop: 14}}>Selon tes besoins, pas selon la pub.</div>
            <div style={{display: 'flex', gap: 26, marginTop: 50}}>
              <div style={{flex: 1, background: C.tile, borderRadius: 999, padding: '36px 0', ...T(38, 600), transform: `scale(${1 + 0.04 * keep})`, boxShadow: keep > 0.01 ? `0 0 0 ${4 * keep}px ${C.gray3}` : undefined}}>Je garde mon 17</div>
              <div style={{flex: 1, background: done > 0 ? `rgb(${lerp(29, 48, done)},${lerp(29, 209, done)},${lerp(31, 88, done)})` : C.ink, borderRadius: 999, padding: '36px 0', ...T(38, 600, '#fff'), transform: `scale(${pressS})`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16}}>
                {done > 0 && <span style={{display: 'inline-flex', transform: `scale(${done})`}}><svg width="34" height="34" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>}
                Je compare
              </div>
            </div>
          </Card>
          <div style={{position: 'absolute', left: lerp(cx0, cx1, mv), top: lerp(cy0, cy1, mv), opacity: clamp(prog(t, w(55.9), 0.4)) * (1 - prog(t, w(58.2), 0.4)), transform: `scale(${press > 0 && press < 1 ? 0.9 : 1})`}}>
            <Cursor size={72} />
          </div>
        </div>
      </At>
    </>
  );
};

// ——— 9 : fin ———
const Scene9 = ({t, V}) => {
  const msg = [['On', w(59.89)], ['évalue', w(60.8)], ['ton', w(61.16)], ['iPhone', w(61.36)], ['pour', w(61.79)], ['un', w(61.95)], [<Mark t={t} at={w(62.3)}>troc.</Mark>, w(62.06)]];
  return (
    <>
      <At y={V ? 600 : 170}>
        <div style={{...T(V ? 108 : 100), textAlign: 'center', lineHeight: 1.02}}>
          <Words t={t} items={[['Apple', w(58.64)], ['Store', w(58.85)]]} />
          <Words t={t} items={[['Kolwezi', w(59.16)]]} />
        </div>
      </At>
      <At y={V ? 890 : 420}>
        <div style={{...T(V ? 40 : 38, 500, C.gray), ...appear(t, w(59.5), 0.6, 10)}}>Viens comparer les deux en boutique.</div>
      </At>
      <At y={V ? 1030 : 540}>
        <Card style={{width: V ? 880 : 900, padding: '34px 40px', display: 'flex', alignItems: 'center', gap: 26, ...appear(t, w(59.7), 0.7, 40)}}>
          <div style={{width: 84, height: 84, borderRadius: '50%', background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
            <svg width="40" height="40" viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.5" fill="none" stroke="#fff" strokeWidth="1.9" /><path d="M11 18.5h2" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" /></svg>
          </div>
          <Words t={t} items={msg} style={{...T(V ? 42 : 40, 500), justifyContent: 'flex-start', whiteSpace: 'normal', lineHeight: 1.25}} gap="0.24em" />
        </Card>
      </At>
    </>
  );
};

export const Video = ({vertical = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const V = vertical;
  return (
    <AbsoluteFill style={{background: C.bg, fontFamily: FONT, overflow: 'hidden'}}>
      <Layer t={t} from={S.s12[0]} to={S.s12[1]} fadeIn={0}><Scene12 t={t} V={V} /></Layer>
      <Layer t={t} from={S.s3[0]} to={S.s3[1]}><Scene3 t={t} V={V} /></Layer>
      <Layer t={t} from={S.s4[0]} to={S.s4[1]}><Scene4 t={t} V={V} /></Layer>
      <Layer t={t} from={S.s5[0]} to={S.s5[1]}><Scene5 t={t} V={V} /></Layer>
      <Layer t={t} from={S.s6[0]} to={S.s6[1]}><Scene6 t={t} V={V} /></Layer>
      <Layer t={t} from={S.s7[0]} to={S.s7[1]}><Scene7 t={t} V={V} /></Layer>
      <Layer t={t} from={S.s8[0]} to={S.s8[1]}><Scene8 t={t} V={V} /></Layer>
      <Layer t={t} from={S.s9[0]} to={S.s9[1]} fadeOut={0}><Scene9 t={t} V={V} /></Layer>
      <Audio src={staticFile('mix.wav')} />
    </AbsoluteFill>
  );
};
