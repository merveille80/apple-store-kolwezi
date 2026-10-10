import React, {useContext} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {C, FONT} from './theme';
import {Fmt, clamp, prog, eo, eo5, eox, eio, eio5, back, lerp, appear, pop, Layer, GridBg, Card, Pill, Center, Icon, IconTile, Chip, Mark, Lockup, H, shadow, shadowSoft} from './ui';
import {Stage3D, Float, Sphere, Torus, Capsule, RBox, Plus, Logo3D, Bubble3D, px, U} from './three3d';
import {remap} from './remap';

// Les scènes sont écrites en « temps visuel » u (secondes), recalé sur la voix off par remap().
// Plan de travail : 1276×720 en 16:9, 720×1280 en 9:16 (v), agrandi vers la composition puis rendu ×2 (4K).
const W = ({t, at, children, style, dur, dy}) => <span style={{display: 'inline-block', ...appear(t, at, dur, dy), ...style}}>{children}</span>;
const mix = (a, b, x) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], x))).join(',')})`;
const INK = [29, 29, 31], WHITE = [255, 255, 255], CLAY = [243, 243, 245];
const useF = () => useContext(Fmt);

// Formes flottantes d'ambiance : positions en px du plan de travail
const Ambient = ({t, items, w, h}) => (
  <Stage3D w={w} h={h} style={{left: 0, top: 0}}>
    {items.map(({x, y, z = 0, at, s = 1, rot, spin, el}, i) => {
      const [X, Y] = px(x, y, w, h);
      return <Float key={i} t={t} at={at} pos={[X, Y, z]} rot={rot} spin={spin} s={s}>{el}</Float>;
    })}
  </Stage3D>
);

// Logo CS en 3D à la place de la marque du lockup : arrive en tournant puis oscille doucement
const MarkSpin = ({t, size, at, sphereAt}) => {
  const w = size * 2.6, h = size * 2.4;
  const spin = eox(prog(t, at, 1.1));
  const sc = clamp(back(prog(t, at, 0.75), 1.3), 0, 1.2);
  const sway = eio(clamp((t - at - 0.9) / 0.9));
  const ry = lerp(-Math.PI * 1.2, 0, spin) + Math.sin((t - at - 0.9) * 1.25) * 0.16 * sway;
  const rx = lerp(0.55, 0, spin) + Math.sin((t - at) * 0.9 + 1) * 0.05 * sway;
  let sph = 0;
  if (sphereAt !== undefined) {
    const d = back(prog(t, sphereAt, 0.55), 1.4);
    const g = eio5(prog(t, sphereAt + 0.25, 0.45));
    sph = clamp(d, 0, 1.3) * lerp(0.25, 1, g) * (1 - eio(prog(t, at - 0.02, 0.32)));
  }
  return (
    <Stage3D w={w} h={h} wall={-0.55} shadow={0.1} style={{left: size / 2 - w / 2, top: size * 0.4 - h / 2}}>
      <group rotation={[rx, ry, 0]} scale={Math.max(1e-4, sc)}><Logo3D size={size} /></group>
      {sph > 0.001 && <group scale={sph}><Sphere r={(size * 0.3) / U} m="ink" /></group>}
    </Stage3D>
  );
};

// ---------- A. « Vous avez une idée… mais elle reste sur le papier ? »
const SceneA = ({t}) => {
  const {v, W: SW, H: SH} = useF();
  const ring = eio(prog(t, 0.95, 0.7));
  const lift = eio5(prog(t, 1.9, 0.8));
  const items = v
    ? [
        {x: 170, y: 330, at: 0.3, s: 1.1, rot: [1.1, 0, 0], spin: [0.25, 0.35, 0], el: <Torus R={0.36} r={0.13} />},
        {x: 560, y: 290, at: 0.5, el: <Sphere r={0.34} m="ink" />},
        {x: 170, y: 990, at: 0.7, rot: [0.5, 0.7, 0], spin: [0.2, 0.3, 0.1], el: <RBox w={0.62} h={0.62} d={0.62} r={0.14} />},
        {x: 560, y: 1010, at: 0.9, rot: [0, 0, 0.7], spin: [0, 0.4, 0], el: <Capsule r={0.15} l={0.5} m="ink" />},
      ]
    : [
        {x: 250, y: 165, at: 0.3, s: 1.1, rot: [1.1, 0, 0], spin: [0.25, 0.35, 0], el: <Torus R={0.36} r={0.13} />},
        {x: 1020, y: 170, at: 0.5, el: <Sphere r={0.32} m="ink" />},
        {x: 225, y: 545, at: 0.7, rot: [0.5, 0.7, 0], spin: [0.2, 0.3, 0.1], el: <RBox w={0.62} h={0.62} d={0.62} r={0.14} />},
        {x: 1060, y: 560, at: 0.9, rot: [0, 0, 0.7], spin: [0, 0.4, 0], el: <Capsule r={0.15} l={0.5} m="ink" />},
      ];
  return (
    <Layer t={t} from={0} to={3.6} zoomIn={0} zoomOut={0.45} outScale={2.4}>
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${-lift * 20}px)`}}><Ambient t={t} items={items} w={SW} h={SH} /></div>
      <Center style={{flexDirection: 'column', transform: `translateY(${-lift * 36}px) scale(${1 + t * 0.012})`}}>
        <div style={{...H(v ? 56 : 60, 500, C.gray), display: 'flex', gap: 16, alignItems: 'center'}}>
          <W t={t} at={0.15}>Vous</W><W t={t} at={0.38}>avez</W><W t={t} at={0.6}>une</W>
          <span style={{position: 'relative', display: 'inline-block', ...appear(t, 0.82)}}>
            <span style={{color: C.ink, fontWeight: 700, padding: '0 20px'}}>idée</span>
            <svg style={{position: 'absolute', left: -2, top: -8, overflow: 'visible'}} width="100%" height={v ? 78 : 84}>
              <rect x="0" y="0" width="100%" height={v ? 78 : 84} rx={v ? 39 : 42} fill="none" stroke={C.ink} strokeWidth="3" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - ring} />
            </svg>
          </span>
        </div>
        <div style={{...H(v ? 40 : 44, 500, C.gray), display: 'flex', flexWrap: 'wrap', justifyContent: 'center', maxWidth: v ? 600 : 1200, gap: 12, marginTop: 30}}>
          <W t={t} at={2.1}>mais</W><W t={t} at={2.22}>elle</W><W t={t} at={2.33}>reste</W><W t={t} at={2.6}>sur</W><W t={t} at={2.72}>le</W>
          <W t={t} at={2.83} style={{color: C.ink, fontWeight: 700}}>papier ?</W>
        </div>
      </Center>
    </Layer>
  );
};

// ---------- B. « → Le problème est simple »
const SceneB = ({t}) => {
  const {v} = useF();
  const xf = (tt) => lerp(v ? 220 : 280, v ? -60 : -150, eo5(prog(tt, 3.5, 1.35)));
  const x = xf(t);
  const vel = Math.abs(xf(t + 1 / 60) - x);
  const fill = eio(prog(t, 4.3, 0.35));
  const simple = (
    <span style={{position: 'relative', display: 'inline-block', ...appear(t, 4.12)}}>
      <span style={{position: 'absolute', inset: '-4px 0', borderRadius: 999, border: `4px solid ${C.ink}`, background: `rgba(29,29,31,${fill})`}} />
      <span style={{position: 'relative', padding: '0 28px', color: mix(INK, WHITE, fill)}}>simple</span>
    </span>
  );
  return (
    <Layer t={t} from={3.5} to={4.95} zoomIn={0.2} zoomOut={0.35} outScale={1.5}>
      <Center>
        <div style={{transform: `translateX(${x}px)`, filter: vel > 0.3 ? `blur(${Math.min(vel * 0.5, 8)}px)` : undefined}}>
          {v ? (
            <div style={{...H(84, 700), display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 26}}>
              <div style={{display: 'flex', gap: 20, alignItems: 'center'}}>
                <span style={appear(t, 3.5)}><Icon name="arrow" size={66} color={C.ink} sw={2.6} /></span>
                <W t={t} at={3.56}>Le</W><W t={t} at={3.68}>problème</W>
              </div>
              <div style={{display: 'flex', gap: 20, alignItems: 'center', marginLeft: 86}}>
                <W t={t} at={4.0} style={{color: C.gray, fontWeight: 500}}>est</W>{simple}
              </div>
            </div>
          ) : (
            <div style={{...H(90, 700), display: 'flex', gap: 22, alignItems: 'center'}}>
              <span style={appear(t, 3.5)}><Icon name="arrow" size={72} color={C.ink} sw={2.6} /></span>
              <W t={t} at={3.56}>Le</W><W t={t} at={3.68}>problème</W><W t={t} at={4.0} style={{color: C.gray, fontWeight: 500}}>est</W>
              {simple}
            </div>
          )}
        </div>
      </Center>
    </Layer>
  );
};

// ---------- C. « sans site, sans application, sans automatisation… vos clients vont voir ailleurs »
const MissingCard = ({t, at, icon, label}) => (
  <div style={pop(t, at)}>
    <Card style={{width: 290, padding: 26}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
        <IconTile name={icon} size={46} />
        <div style={{fontSize: 22, fontWeight: 600, color: C.ink}}>{label}</div>
      </div>
      <div style={{height: 10, borderRadius: 5, background: C.tile, marginTop: 20, width: '90%'}} />
      <div style={{height: 10, borderRadius: 5, background: C.tile, marginTop: 10, width: '60%'}} />
      <div style={{marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 13px 6px 9px', borderRadius: 999, background: C.tile, color: C.ink2, fontSize: 15, fontWeight: 600, ...pop(t, at + 0.25, 0.5)}}>
        <Icon name="x" size={15} color={C.ink2} sw={2.4} /> Absent
      </div>
    </Card>
  </div>
);

const Visitor = ({t, at, x, y, dx, dy}) => {
  const a = pop(t, at, 0.45);
  const go = eio(prog(t, at + 0.55, 1.2));
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(${dx * go}px, ${dy * go}px)`, opacity: Number(a.opacity) * (1 - go)}}>
      <div style={{display: 'flex', alignItems: 'flex-start', gap: 4, transform: a.transform}}>
        <Icon name="cursor" size={26} color={C.ink} />
        <div style={{marginTop: 16, padding: '7px 15px', borderRadius: 999, background: C.ink, color: '#fff', fontFamily: FONT, fontWeight: 500, fontSize: 17, boxShadow: '0 10px 24px -10px rgba(0,0,0,.45)'}}>client</div>
      </div>
    </div>
  );
};

const SceneC = ({t}) => {
  const {v} = useF();
  const iso = eio5(prog(t, 8.55, 1.0));
  const drift = (t - 4.8) * 6;
  const bars = [62, 70, 58, 66, 44, 36, 28, 20, 14];
  const vis = v
    ? [[8.75, 120, 330, -320, -160], [8.95, 430, 280, 320, -220], [9.15, 150, 860, -260, 300], [9.3, 470, 800, 320, 260]]
    : [[8.75, 300, 250, -420, -120], [8.95, 760, 200, 480, -160], [9.15, 560, 430, 120, 360], [9.3, 860, 420, 460, 140]];
  return (
    <Layer t={t} from={4.8} to={10.35} zoomIn={0.4} zoomOut={0.45} outScale={0.6}>
      <div style={{position: 'absolute', inset: 0, perspective: 1400}}>
        <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `translate${v ? 'Y' : 'X'}(${-drift}px) rotateX(${lerp(6, 46, iso)}deg) rotateZ(${lerp(0, -20, iso)}deg) scale(${lerp(1, 0.86, iso)})`}}>
          <div style={v
            ? {position: 'absolute', left: 0, right: 0, top: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28}
            : {position: 'absolute', left: 0, right: 0, top: 190, display: 'flex', justifyContent: 'center', gap: 34}}>
            <MissingCard t={t} at={4.85} icon="globe" label="Site web" />
            <MissingCard t={t} at={5.82} icon="phone" label="Application" />
            <MissingCard t={t} at={7.36} icon="gear" label="Automatisation" />
          </div>
        </div>
      </div>
      {vis.map(([at, x, y, dx, dy]) => <Visitor key={at} t={t} at={at} x={x} y={y} dx={dx} dy={dy} />)}
      <div style={{position: 'absolute', left: v ? 170 : 448, top: v ? 500 : 230, ...pop(t, 9.35, 0.6)}}>
        <Card style={{width: 380, padding: 24}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div style={{fontSize: 18, color: C.gray, fontWeight: 500}}>Clients ce mois</div>
            <div style={{fontSize: 16, color: C.loss, fontWeight: 600}}>−68 %</div>
          </div>
          <div style={{fontSize: 48, fontWeight: 700, color: C.ink, marginTop: 4, letterSpacing: -1.5, fontVariantNumeric: 'tabular-nums'}}>{Math.round(lerp(312, 98, eo(prog(t, 9.4, 1.0))))}</div>
          <div style={{display: 'flex', alignItems: 'flex-end', gap: 10, height: 80, marginTop: 10, background: '#FAFAFB', borderRadius: 12, padding: 10}}>
            {bars.map((h, i) => (
              <div key={i} style={{flex: 1, height: h * eo5(prog(t, 9.45 + i * 0.05, 0.6)), background: i < 4 ? C.ink : C.gray2, borderRadius: 4}} />
            ))}
          </div>
        </Card>
      </div>
    </Layer>
  );
};

// ---------- D. Révélation du logo : une sphère noire laquée se transforme en logo CS 3D
const SceneD = ({t}) => {
  const {v} = useF();
  const reveal = eo5(prog(t, 11.15, 0.9));
  const tag = eo5(prog(t, 11.9, 0.7));
  const size = v ? 250 : 210;
  return (
    <Layer t={t} from={10.3} to={13.75} zoomIn={0.1} zoomOut={0.45} outScale={2.4}>
      <Center style={{transform: `scale(${1 + (t - 10.3) * 0.022})`}}>
        <Lockup size={size} reveal={reveal} tag={tag} mark3d={<MarkSpin t={t} size={size} at={10.8} sphereAt={10.35} />} />
      </Center>
    </Layer>
  );
};

// ---------- E. Sites web, applications, logiciels (scène blanche, maquettes façon site)
const Notif = ({t, at, x, y, label = 'Nouvelle commande'}) => (
  <div style={{position: 'absolute', left: x, top: y, ...pop(t, at, 0.5)}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 9, padding: '9px 16px 9px 10px', borderRadius: 999, background: '#fff', border: `1px solid ${C.line}`, fontFamily: FONT, fontSize: 15, fontWeight: 500, color: C.ink, boxShadow: shadowSoft, whiteSpace: 'nowrap'}}>
      <span style={{width: 22, height: 22, borderRadius: 11, background: C.live, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Icon name="check" size={13} color="#fff" sw={3} /></span>
      {label}
    </div>
  </div>
);

const Typed = ({t, at, text, cps = 22, style}) => {
  if (t < at) return null;
  const n = Math.floor(clamp((t - at) * cps, 0, text.length));
  const caret = n < text.length || Math.floor(t * 2.5) % 2 === 0;
  return <span style={style}>{text.slice(0, n)}<span style={{display: 'inline-block', width: 3, height: '0.9em', marginLeft: 4, verticalAlign: '-0.08em', background: C.ink, opacity: caret ? 1 : 0}} /></span>;
};

const BrowserBar = ({url, live}) => (
  <div style={{height: 38, display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: `1px solid ${C.line}`, background: '#FBFBFC', position: 'relative'}}>
    {[0, 1, 2].map((i) => <span key={i} style={{width: 10, height: 10, borderRadius: 5, background: '#D9D9DE', marginRight: 7}} />)}
    <div style={{position: 'absolute', left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', borderRadius: 999, background: '#fff', border: `1px solid ${C.line}`, fontSize: 12, color: C.gray}}>{url}</div>
    {live && <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: C.live}}><span style={{width: 7, height: 7, borderRadius: 4, background: C.live}} />LIVE</div>}
  </div>
);

const SiteMockup = () => (
  <Card style={{width: 620, height: 372, overflow: 'hidden', borderRadius: 20}}>
    <BrowserBar url="cyberspacesarl.com" />
    <div style={{padding: '14px 20px 0'}}>
      <div style={{display: 'flex', alignItems: 'center', padding: '7px 8px 7px 12px', borderRadius: 14, boxShadow: shadowSoft, border: `1px solid ${C.line}`}}>
        <Mark size={22} />
        <span style={{fontSize: 12.5, fontWeight: 600, marginLeft: 6, color: C.ink}}>CyberSpace</span>
        <span style={{fontSize: 10, color: C.gray, marginLeft: 3}}>Sarl</span>
        <div style={{display: 'flex', gap: 4, marginLeft: 'auto', marginRight: 'auto'}}>
          {['Accueil', 'Services', 'Solutions', 'Contact'].map((s) => <span key={s} style={{fontSize: 10, padding: '4px 9px', borderRadius: 999, background: C.tile, color: C.ink}}>{s}</span>)}
        </div>
        <span style={{fontSize: 10, fontWeight: 600, padding: '6px 11px', borderRadius: 999, background: C.ink, color: '#fff'}}>Démarrer un projet</span>
      </div>
      <div style={{textAlign: 'center', marginTop: 16}}>
        <span style={{fontSize: 10, padding: '4px 12px', borderRadius: 999, border: `1px solid ${C.line}`, color: C.ink}}>Solutions digitales pour entreprises ambitieuses</span>
        <div style={{...H(40, 700), marginTop: 14, lineHeight: 1.02}}>Transformez vos<br />idées en <span style={{color: C.gray}}>réalité.</span></div>
        <div style={{fontSize: 11, color: C.gray, marginTop: 12, lineHeight: 1.5}}>CyberSpace Sarl accompagne les entreprises dans leur<br />transformation digitale.</div>
        <div style={{display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14}}>
          <span style={{fontSize: 11, fontWeight: 600, padding: '8px 16px', borderRadius: 999, background: C.ink, color: '#fff'}}>Démarrer un projet →</span>
          <span style={{fontSize: 11, fontWeight: 600, padding: '8px 16px', borderRadius: 999, background: '#fff', color: C.ink, boxShadow: shadowSoft, border: `1px solid ${C.line}`}}>Découvrir nos services</span>
        </div>
      </div>
    </div>
  </Card>
);

const PhoneMockup = () => (
  <div style={{width: 150, height: 300, borderRadius: 32, background: C.ink, padding: 7, boxShadow: shadow}}>
    <div style={{width: '100%', height: '100%', borderRadius: 26, background: '#fff', overflow: 'hidden', fontFamily: FONT, padding: 12}}>
      <div style={{width: 44, height: 6, borderRadius: 3, background: C.ink, margin: '0 auto 12px'}} />
      <div style={{fontSize: 13, fontWeight: 700, color: C.ink}}>Ma boutique</div>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{display: 'flex', gap: 8, marginTop: 12, alignItems: 'center'}}>
          <div style={{width: 34, height: 34, borderRadius: 10, background: C.tile}} />
          <div style={{flex: 1}}>
            <div style={{height: 6, borderRadius: 3, background: C.line, width: '90%'}} />
            <div style={{height: 6, borderRadius: 3, background: C.tile, width: '55%', marginTop: 5}} />
          </div>
        </div>
      ))}
      <div style={{marginTop: 16, padding: '8px 0', borderRadius: 999, background: C.ink, color: '#fff', fontSize: 10.5, fontWeight: 600, textAlign: 'center'}}>Commander</div>
    </div>
  </div>
);

const CHART_K = 'M0 84 C20 84 34 60 52 44 S78 46 96 54 S130 72 150 64 S168 56 182 72 S206 52 222 58 S240 44 256 60 S286 74 306 64 S334 46 352 60 S382 78 404 70 S440 62 470 66';
const CHART_B = 'M0 132 C16 134 28 122 44 124 S70 134 86 130 S112 122 128 126 S150 120 170 124 S196 128 214 122 S240 114 260 120 S290 128 310 122 S340 116 360 122 S392 128 412 124 S446 118 470 122';

const Dashboard = ({t}) => {
  const line = eio(prog(t, 17.9, 1.5));
  const rev = Math.round(lerp(4120, 12480, eo5(prog(t, 17.9, 1.6))));
  const cli = Math.round(lerp(312, 1248, eo5(prog(t, 18.2, 1.5))));
  const bar = eo5(prog(t, 18.3, 1.4));
  const tip = pop(t, 19.3, 0.5);
  const ia = pop(t, 18.9, 0.6);
  const fmt = (n) => n.toLocaleString('fr-FR').replace(/ | /g, ' ');
  return (
    <Card style={{width: 700, overflow: 'hidden', borderRadius: 24, background: '#FBFBFC'}}>
      <BrowserBar url="app.cyberspace.cd" live />
      <div style={{display: 'flex', gap: 16, padding: 18}}>
        <div style={{flex: 1.55, background: '#fff', borderRadius: 18, border: `1px solid ${C.line}`, padding: 18, position: 'relative'}}>
          <div style={{fontSize: 13, color: C.gray}}>Revenus du mois</div>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4}}>
            <div style={{fontSize: 30, fontWeight: 700, color: C.ink, letterSpacing: -1, fontVariantNumeric: 'tabular-nums'}}>{fmt(rev)} $</div>
            <div style={{fontSize: 13, fontWeight: 600, color: C.live}}>+32,4%</div>
          </div>
          <svg width="400" height="150" viewBox="0 0 470 150" style={{marginTop: 12}}>
            <path d={`${CHART_K} L470 150 L0 150Z`} fill="#F1F1F3" opacity={line} />
            <path d={CHART_K} fill="none" stroke={C.ink} strokeWidth="2.2" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - line} />
            <path d={CHART_B} fill="none" stroke={C.data} strokeWidth="2.2" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - line} />
            <line x1="222" y1="0" x2="222" y2="150" stroke={C.gray2} strokeWidth="1" strokeDasharray="3 4" opacity={Number(tip.opacity)} />
            <circle cx="222" cy="58" r="5" fill={C.ink} opacity={Number(tip.opacity)} />
          </svg>
          <div style={{position: 'absolute', left: 168, top: 86, ...tip}}>
            <div style={{background: C.ink, color: '#fff', borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 600}}>12 480 $<div style={{fontSize: 8, color: C.gray2, letterSpacing: 1, marginTop: 2}}>JUIN 2026</div></div>
          </div>
        </div>
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 16}}>
          <div style={{background: '#fff', borderRadius: 18, border: `1px solid ${C.line}`, padding: 18}}>
            <div style={{fontSize: 13, color: C.gray}}>Clients actifs</div>
            <div style={{fontSize: 30, fontWeight: 700, color: C.ink, letterSpacing: -1, marginTop: 4, fontVariantNumeric: 'tabular-nums'}}>{fmt(cli)}</div>
            <div style={{height: 7, borderRadius: 4, background: C.tile, marginTop: 14, overflow: 'hidden'}}><div style={{height: '100%', width: `${72 * bar}%`, background: C.data, borderRadius: 4}} /></div>
          </div>
          <div style={{background: C.ink, borderRadius: 18, padding: 18, color: '#fff', ...ia}}>
            <div style={{width: 34, height: 34, borderRadius: 10, background: '#3A3A3C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700}}>IA</div>
            <div style={{fontSize: 16, fontWeight: 600, marginTop: 12}}>Assistant WhatsApp</div>
            <div style={{fontSize: 12, color: C.gray2, marginTop: 6, lineHeight: 1.45}}>14 commandes traitées automatiquement aujourd'hui</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const SceneE = ({t}) => {
  const {v, W: SW, H: SH} = useF();
  const enter = eo5(prog(t, 13.75, 1.0));
  const toDash = eio5(prog(t, 17.4, 0.8));
  const tilt = Math.sin((t - 13.75) * 0.5) * 3;
  const dashIn = eo5(prog(t, 17.55, 1.0));
  const items = v
    ? [
        {x: 640, y: 200, z: -0.6, at: 14.0, rot: [1.0, 0.3, 0], spin: [0.2, 0.3, 0], el: <Torus R={0.34} r={0.12} m="ink" />},
        {x: 80, y: 1180, z: -0.4, at: 14.3, el: <Sphere r={0.3} />},
        {x: 640, y: 1170, z: -0.5, at: 14.5, rot: [0.6, 0.4, 0], spin: [0.15, 0.25, 0], el: <RBox w={0.5} h={0.5} d={0.5} r={0.12} />},
      ]
    : [
        {x: 95, y: 130, z: -0.6, at: 14.0, rot: [1.0, 0.3, 0], spin: [0.2, 0.3, 0], el: <Torus R={0.32} r={0.12} m="ink" />},
        {x: 95, y: 610, z: -0.4, at: 14.3, el: <Sphere r={0.28} />},
        {x: 1200, y: 655, z: -0.5, at: 14.5, rot: [0.6, 0.4, 0], spin: [0.15, 0.25, 0], el: <RBox w={0.46} h={0.46} d={0.46} r={0.11} />},
      ];
  const notifs = v
    ? [[15.9, 380, 330, 'Nouvelle commande'], [16.25, 40, 800, 'Paiement reçu'], [16.6, 130, 880, 'Nouvelle commande'], [16.9, 50, 960, 'Nouveau client'], [17.15, 170, 1040, 'Paiement reçu']]
    : [[15.9, 500, 96, 'Nouvelle commande'], [16.25, 1060, 104, 'Paiement reçu'], [16.6, 600, 560, 'Nouvelle commande'], [16.9, 900, 620, 'Nouveau client'], [17.15, 440, 420, 'Paiement reçu']];
  const chips = v
    ? [[18.4, 40, 870, 'globe', 'Sites Web'], [18.7, 330, 870, 'bot', 'IA & Automatisation'], [19.0, 70, 960, 'shield', 'Cybersécurité'], [19.3, 400, 960, 'cloud', 'Cloud']]
    : [[18.4, 466, 126, 'globe', 'Sites Web'], [18.7, 990, 62, 'bot', 'IA & Automatisation'], [19.0, 1000, 560, 'shield', 'Cybersécurité'], [19.3, 530, 600, 'cloud', 'Cloud']];
  return (
    <Layer t={t} from={13.75} to={20.35} zoomIn={0.45} zoomOut={0.45} outScale={1.6} inScale={0.88}>
      <Ambient t={t} items={items} w={SW} h={SH} />
      {/* Partie 1 : site + appli */}
      <div style={{position: 'absolute', inset: 0, opacity: 1 - toDash, transform: `translateX(${-toDash * 260}px)`, filter: toDash > 0 ? `blur(${toDash * 8}px)` : undefined}}>
        <div style={{position: 'absolute', left: v ? 60 : 70, top: v ? 120 : 262, width: v ? 600 : 440}}>
          <div style={H(v ? 60 : 52, 700)}><Typed t={t} at={14.6} text="Sites web" /></div>
          <div style={{...H(34, 500, C.gray), marginTop: 10}}>{t >= 15.5 && <Typed t={t} at={15.5} text="et applications mobiles" cps={30} />}</div>
          <div style={{...H(34, 600), marginTop: 8}}>{t >= 16.55 && <Typed t={t} at={16.55} text="qui vendent." cps={24} />}</div>
        </div>
        <div style={{position: 'absolute', left: v ? 50 : 500, top: v ? 400 : 150, perspective: 1400}}>
          <div style={{transform: `translateY(${(1 - enter) * 260}px) rotateY(${(v ? -8 : -16) + tilt}deg) rotateX(7deg) scale(${lerp(0.8, 1, enter)})`, opacity: clamp(enter * 1.5)}}>
            <SiteMockup />
          </div>
        </div>
        <div style={{position: 'absolute', left: v ? 500 : 1050, top: v ? 700 : 300, ...pop(t, 15.55, 0.6)}}>
          <div style={{transform: `rotate(${5 - tilt}deg)`}}><PhoneMockup /></div>
        </div>
        {notifs.map(([at, x, y, label]) => <Notif key={at} t={t} at={at} x={x} y={y} label={label} />)}
      </div>
      {/* Partie 2 : logiciels sur mesure */}
      <div style={{position: 'absolute', inset: 0, opacity: toDash}}>
        <div style={{position: 'absolute', left: v ? 60 : 64, top: v ? 250 : 250, width: v ? 600 : 470, transform: `translateX(${(1 - toDash) * 120}px)`}}>
          <div style={H(v ? 50 : 46, 700)}>{t >= 17.75 && <Typed t={t} at={17.75} text="Logiciels sur mesure" cps={26} />}</div>
          <div style={{...H(30, 500, C.gray), marginTop: 14}}>
            <W t={t} at={18.75}>pour</W> <W t={t} at={18.95} style={{color: C.ink, fontWeight: 600}}>piloter</W> <W t={t} at={19.25}>votre</W> <W t={t} at={19.45} style={{color: C.ink, fontWeight: 600}}>activité</W>
          </div>
        </div>
        <div style={{position: 'absolute', left: v ? 22 : 520, top: v ? 450 : 150, perspective: 1500}}>
          <div style={{transform: `translateX(${(1 - dashIn) * 300}px) rotateY(${(v ? lerp(-14, -5, dashIn) : lerp(-24, -12, dashIn)) + tilt}deg) rotateX(6deg) scale(${v ? lerp(0.84, 0.9, dashIn) : lerp(0.9, 0.96, dashIn)})`, transformOrigin: 'left center'}}>
            <Dashboard t={t} />
          </div>
        </div>
        {chips.map(([at, x, y, icon, label]) => <div key={at} style={{position: 'absolute', left: x, top: y, ...pop(t, at, 0.6)}}><Chip icon={icon} label={label} /></div>)}
      </div>
    </Layer>
  );
};

// ---------- F. « Et en plus ? » + signe plus 3D
const SceneF = ({t}) => {
  const {v} = useF();
  const sp = eox(prog(t, 20.7, 1.0));
  return (
    <Layer t={t} from={20.35} to={22.0} zoomIn={0.3} zoomOut={0.45} outScale={2.2}>
      <Center style={{flexDirection: v ? 'column' : 'row', gap: v ? 10 : 6}}>
        <div style={{...H(v ? 74 : 68, 500, C.gray), display: 'flex', gap: 18}}>
          <W t={t} at={20.4}>Et</W><W t={t} at={20.55}>en</W><W t={t} at={20.7} style={{color: C.ink, fontWeight: 700}}>plus ?</W>
        </div>
        <div style={{position: 'relative', width: 150, height: 150}}>
          <Stage3D w={420} h={420} wall={-1.3} shadow={0.13} style={{left: -135, top: -135}}>
            <Float t={t} at={20.65} pos={[0, 0, 0]} rot={[lerp(0.8, 0.22, sp) + Math.sin(t * 1.1) * 0.05, lerp(-Math.PI * 1.5, -0.4, sp) + Math.sin(t * 0.9) * 0.12, lerp(0.6, 0.12, sp)]} bob={0.04}>
              <Plus a={1.05} b={0.3} />
            </Float>
          </Stage3D>
        </div>
      </Center>
    </Layer>
  );
};

// ---------- G. Agents IA WhatsApp 24 h/24
const Bubble = ({t, at, bot, children, time}) => (
  <div style={{display: 'flex', justifyContent: bot ? 'flex-start' : 'flex-end', marginTop: 12, ...appear(t, at, 0.5, 14)}}>
    <div style={{maxWidth: 320, padding: '10px 14px', borderRadius: 18, borderBottomLeftRadius: bot ? 6 : 18, borderBottomRightRadius: bot ? 18 : 6, background: bot ? C.ink : C.tile, fontSize: 15.5, color: bot ? '#fff' : C.ink, lineHeight: 1.38}}>
      {children}
      <div style={{fontSize: 10.5, color: bot ? C.gray2 : C.gray, textAlign: 'right', marginTop: 3}}>{time}</div>
    </div>
  </div>
);

const SceneG = ({t}) => {
  const {v} = useF();
  const typing = t > 22.85 && t < 23.2;
  const plus = eo5(prog(t, 25.0, 0.6));
  const roll = eio5(prog(t, 25.6, 0.7));
  const camY = lerp(0, -36, eio5(prog(t, 24.9, 0.8)));
  const card = v ? {x: 130, y: 400} : {x: 640, y: 90};
  const bub = v ? {x: 585, y: 375} : {x: 575, y: 95};
  return (
    <Layer t={t} from={21.9} to={27.65} zoomIn={0.4} zoomOut={0.45} outScale={1.8}>
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${camY}px)`}}>
        <div style={{position: 'absolute', left: v ? 60 : 120, top: v ? 120 : 200, width: v ? 600 : 420}}>
          <div style={pop(t, 21.95)}><Pill kind="dark"><Icon name="bot" size={22} color="#fff" /> Agents IA</Pill></div>
          <div style={{...H(v ? 46 : 42, 700), marginTop: 24, whiteSpace: 'normal', lineHeight: 1.18}}>
            <W t={t} at={23.2}>répondent</W> <W t={t} at={23.6} style={{color: C.gray, fontWeight: 500}}>à</W> <W t={t} at={23.7} style={{color: C.gray, fontWeight: 500}}>vos</W> <W t={t} at={23.85}>clients</W> <W t={t} at={24.0} style={{color: C.gray, fontWeight: 500}}>sur</W>{' '}
            <span style={{position: 'relative', display: 'inline-block', ...appear(t, 24.15)}}>
              WhatsApp
              <span style={{position: 'absolute', left: 0, bottom: -4, height: 4, borderRadius: 2, background: C.ink, width: `${eio(prog(t, 24.4, 0.6)) * 100}%`}} />
            </span>
          </div>
        </div>
        <div style={{position: 'absolute', left: card.x, top: card.y, perspective: 1400, ...appear(t, 22.0, 0.8, 50)}}>
          <div style={{transform: `rotateY(-9deg) rotateX(3deg)`}}>
            <Card style={{width: 460, overflow: 'hidden'}}>
              <div style={{padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.line}`}}>
                <div style={{width: 42, height: 42, borderRadius: 21, background: C.tile, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Mark size={28} /></div>
                <div>
                  <div style={{fontSize: 16, fontWeight: 600, color: C.ink}}>CyberSpace · Assistant IA</div>
                  <div style={{fontSize: 12.5, color: typing ? C.gray : C.live, display: 'flex', alignItems: 'center', gap: 5, marginTop: 2}}>
                    {!typing && <span style={{width: 6, height: 6, borderRadius: 3, background: C.live}} />}{typing ? 'écrit…' : 'en ligne'}
                  </div>
                </div>
              </div>
              <div style={{padding: '6px 16px 18px', minHeight: 300, background: '#FCFCFD'}}>
                <Bubble t={t} at={22.3} time="02:14">Bonsoir, je voudrais un site pour ma boutique.</Bubble>
                <Bubble t={t} at={23.2} bot time="02:14">Bonsoir ! Avec plaisir. Quel type de site souhaitez-vous ?</Bubble>
                <Bubble t={t} at={24.1} time="02:15">Un site e-commerce.</Bubble>
                <Bubble t={t} at={24.55} bot time="02:15">Parfait, je vous envoie un devis tout de suite.</Bubble>
              </div>
            </Card>
          </div>
        </div>
        {/* Bulle 3D qui « écrit », posée sur le coin de la conversation */}
        <Stage3D w={380} h={340} wall={-1.2} shadow={0.12} style={{left: bub.x - 190, top: bub.y - 170}}>
          <Float t={t} at={22.6} pos={[0, 0, 0.2]} rot={v ? [0.12, -0.42, -0.08] : [0.12, 0.42, 0.1]} spin={[0, 0, 0]} bob={0.06}>
            <group rotation={[0, Math.sin(t * 0.8) * 0.12, 0]}><Bubble3D t={t} /></group>
          </Float>
        </Stage3D>
        <div style={{position: 'absolute', left: v ? 168 : 120, top: v ? 860 : 470, ...pop(t, 25.0)}}>
          <div style={{display: 'flex', alignItems: 'center', height: 64, width: lerp(64, 384, eo5(prog(t, 25.25, 0.7))), borderRadius: 32, background: '#fff', border: `1px solid ${C.line}`, boxShadow: shadow, overflow: 'hidden', fontFamily: FONT}}>
            <div style={{width: 62, height: 62, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transform: `rotate(${plus * 360}deg)`}}><Icon name="clock" size={28} color={C.ink} /></div>
            <div style={{fontSize: 24, fontWeight: 500, color: C.ink, whiteSpace: 'nowrap', opacity: eo(prog(t, 25.45, 0.4)), display: 'flex', alignItems: 'center', gap: 8}}>
              Disponible
              <span style={{display: 'inline-flex', height: 38, overflow: 'hidden', padding: '0 10px', borderRadius: 10, background: C.ink, color: '#fff', fontWeight: 700}}>
                <span style={{display: 'flex', flexDirection: 'column', transform: `translateY(${-roll * 38}px)`}}><span style={{lineHeight: '38px'}}>23</span><span style={{lineHeight: '38px'}}>24</span></span>
              </span>
              h/24
            </div>
          </div>
        </div>
      </div>
    </Layer>
  );
};

// ---------- H. Méthode : chaque étape pose un bloc 3D, le bloc actif passe en noir laqué
const steps = [
  {at: 29.68, icon: 'code', a: 'On', b: 'développe'},
  {at: 30.5, icon: 'gear', a: 'On', b: 'automatise'},
  {at: 31.6, icon: 'spark', a: 'On', b: 'innove'},
  {at: 33.5, icon: 'shield', a: 'Sécurisé', b: 'dans le cloud'},
];
const hex = (rgb) => '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
const Slab = ({t, i, s, next}) => {
  const drop = prog(t, s.at, 0.6);
  if (drop <= 0) return null;
  const y0 = -0.95 + i * 0.5;
  const y = y0 + (1 - eox(drop)) * 3.2 - Math.sin(Math.PI * clamp((drop - 0.55) / 0.45)) * 0.05;
  const on = eo5(prog(t, s.at + 0.15, 0.45)) * (next ? 1 - eo5(prog(t, next.at, 0.45)) : 1);
  return (
    <mesh castShadow receiveShadow position={[0, y, 0]} rotation={[0, (1 - eox(drop)) * 0.8, 0]} geometry={slabGeo()}>
      <meshPhysicalMaterial color={hex(CLAY.map((c, j) => lerp(c, INK[j], on)))} roughness={lerp(0.5, 0.26, on)} clearcoat={lerp(0.3, 1, on)} clearcoatRoughness={lerp(0.45, 0.12, on)} />
    </mesh>
  );
};
let _slab = null;
const slabGeo = () => _slab || (_slab = new RoundedBoxGeometry(2.3, 0.42, 1.5, 6, 0.14));

const SceneH = ({t}) => {
  const {v} = useF();
  const split = eio5(prog(t, 29.3, 0.7));
  const stage = v ? {x: 360, y: 830, s: 700} : {x: 935, y: 395, s: 560};
  return (
    <Layer t={t} from={27.65} to={34.75} zoomIn={0.4} zoomOut={0.45} outScale={0.55}>
      <div style={{position: 'absolute', left: 0, right: 0, top: v ? lerp(520, 140, split) : lerp(290, 110, split), textAlign: 'center', transform: `scale(${lerp(1, v ? 0.82 : 0.72, split)})`}}>
        <div style={H(v ? 64 : 58, 700)}><W t={t} at={27.8} style={{color: C.gray, fontWeight: 500}}>Notre</W> <W t={t} at={27.95}>méthode</W></div>
        <div style={{...H(v ? 46 : 42, 500, C.gray), marginTop: 12}}>
          <W t={t} at={28.4}>c'est</W> <W t={t} at={28.55}>du</W>{' '}
          <span style={{position: 'relative', display: 'inline-block', color: C.ink, fontWeight: 700, ...appear(t, 28.75)}}>
            concret
            <span style={{position: 'absolute', left: 0, bottom: -6, height: 4, borderRadius: 2, background: C.ink, width: `${eio(prog(t, 28.95, 0.6)) * 100}%`}} />
          </span>
        </div>
      </div>
      <div style={v ? {position: 'absolute', left: 0, right: 0, top: 330, height: 60} : {position: 'absolute', left: 110, top: 330, height: 60}}>
        {steps.map((s, i) => {
          const next = steps[i + 1];
          const out = next ? eio(prog(t, next.at - 0.05, 0.3)) : 0;
          if (t < s.at || out >= 1) return null;
          const a = eo5(prog(t, s.at + 0.12, 0.55));
          return (
            <div key={i} style={{position: 'absolute', ...(v ? {left: 0, right: 0, textAlign: 'center'} : {}), ...H(v ? 54 : 46, 700), opacity: clamp(a * 1.4) * (1 - out), transform: `translateY(${(1 - a) * 26 - out * 26}px)`, filter: a < 1 || out > 0 ? `blur(${(1 - a) * 6 + out * 6}px)` : undefined}}>
              <span style={{color: C.gray, fontWeight: 500}}>{s.a} </span>{s.b}
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', inset: 0, opacity: split}}>
        <Stage3D w={stage.s} h={stage.s} wall={null} shadow={0.12} style={{left: stage.x - stage.s / 2, top: stage.y - stage.s / 2}}>
          <group rotation={[0.48, -0.62 + Math.sin(t * 0.35) * 0.12, 0]} position={[0, -0.15, 0]} scale={v ? 1.3 : 0.92}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.17, 0]} receiveShadow>
              <planeGeometry args={[9, 9]} />
              <shadowMaterial transparent opacity={0.13} />
            </mesh>
            {steps.map((s, i) => <Slab key={i} t={t} i={i} s={s} next={steps[i + 1]} />)}
          </group>
        </Stage3D>
      </div>
    </Layer>
  );
};

// ---------- I. Résultat : histogramme 3D qui monte + cartes
const BARS = [0.55, 0.85, 1.15, 1.5, 2.05];
const SceneI = ({t}) => {
  const {v, W: SW} = useF();
  const merge = eio5(prog(t, 34.85, 0.65));
  const bar = eo5(prog(t, 35.3, 0.6));
  const move = eio5(prog(t, 35.8, 0.7));
  const icons = ['code', 'gear', 'spark', 'shield'];
  const stats = [
    {at: 35.95, icon: 'clock', label: 'de temps'},
    {at: 36.95, icon: 'users', label: 'de clients'},
    {at: 38.05, icon: 'chart', label: 'de croissance'},
  ];
  const chart = v ? {x: 360, y: 500, w: 700, h: 520} : {x: 638, y: 300, w: 760, h: 340};
  return (
    <Layer t={t} from={34.75} to={39.5} zoomIn={0.3} zoomOut={0.45} outScale={2}>
      <div style={{position: 'absolute', left: SW / 2 - 300, top: lerp(v ? 595 : 315, v ? 150 : 70, move), width: 600, height: 90}}>
        {icons.map((n, i) => (
          <div key={n} style={{position: 'absolute', top: 15, left: lerp(125 + i * 100, 270, merge), opacity: 1 - bar, transform: `scale(${1 - merge * 0.3})`}}>
            <IconTile name={n} size={60} dark />
          </div>
        ))}
        <div style={{position: 'absolute', left: 300 - lerp(30, 120, bar), top: 18, width: lerp(60, 240, bar), height: 54, borderRadius: 27, background: C.ink, opacity: clamp(bar * 2), boxShadow: '0 20px 40px -18px rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
          <span style={{...H(24, 600, '#fff'), opacity: eo(prog(t, 35.5, 0.35))}}>Résultat</span>
        </div>
      </div>
      <Stage3D w={chart.w} h={chart.h} wall={null} style={{left: chart.x - chart.w / 2, top: chart.y - chart.h / 2}} fov={26}>
        <group rotation={[0.32, -0.55 + Math.sin(t * 0.3) * 0.06, 0]} position={[0, v ? -0.9 : -0.85, 0]} scale={v ? 1.15 : 0.82}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[12, 12]} />
            <shadowMaterial transparent opacity={0.12} />
          </mesh>
          {BARS.map((hb, i) => {
            const g = 0.45 * eo5(prog(t, 35.85 + i * 0.1, 0.8)) + 0.3 * eo5(prog(t, 36.95 + i * 0.06, 0.7)) + 0.25 * eo5(prog(t, 38.05 + i * 0.06, 0.8));
            const h = Math.max(0.02, Math.round(hb * g * 100) / 100);
            if (g <= 0.001) return null;
            return (
              <group key={i} position={[(i - 2) * 0.78, h / 2, 0]}>
                <RBox w={0.5} h={h} d={0.5} r={Math.min(0.1, h / 2 - 0.001)} m={i === 4 ? 'ink' : 'clay'} />
              </group>
            );
          })}
        </group>
      </Stage3D>
      <div style={v
        ? {position: 'absolute', left: 0, right: 0, top: 800, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}
        : {position: 'absolute', left: 0, right: 0, top: 500, display: 'flex', justifyContent: 'center', gap: 24}}>
        {stats.map((s) => (
          <div key={s.label} style={pop(t, s.at)}>
            <Card style={{padding: '20px 30px 20px 20px', display: 'flex', alignItems: 'center', gap: 16, whiteSpace: 'nowrap', minWidth: v ? 400 : undefined}}>
              <IconTile name={s.icon} size={52} />
              <div style={{fontSize: 30, fontWeight: 700, color: C.ink, letterSpacing: -0.8}}><span style={{color: C.gray, fontWeight: 500}}>+</span> {s.label}</div>
            </Card>
          </div>
        ))}
      </div>
    </Layer>
  );
};

// ---------- J. Entrepreneurs, PME, institutions → de l'idée à la réalisation
const Audience = ({t, at, icon, title, note, x, y}) => (
  <div style={{position: 'absolute', left: x, top: y, ...pop(t, at, 0.65)}}>
    <Card style={{width: 330, height: 300, padding: 0, overflow: 'hidden'}}>
      <div style={{height: 170, background: '#F7F7F8', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${C.line}`}}>
        <div style={{position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${C.grid} 1px, transparent 1px), linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`, backgroundSize: '24px 24px'}} />
        <div style={{position: 'relative', width: 92, height: 92, borderRadius: 26, background: '#fff', boxShadow: shadowSoft, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Icon name={icon} size={46} color={C.ink} sw={1.6} />
        </div>
      </div>
      <div style={{padding: '18px 22px'}}>
        <div style={{fontSize: 27, fontWeight: 700, color: C.ink, letterSpacing: -0.7}}>{title}</div>
        <div style={{marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 13px 6px 8px', borderRadius: 999, background: C.tile, color: C.ink, fontSize: 15, fontWeight: 500, ...pop(t, at + 0.35, 0.5)}}>
          <span style={{width: 20, height: 20, borderRadius: 10, background: C.live, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Icon name="check" size={12} color="#fff" sw={3} /></span> {note}
        </div>
      </div>
    </Card>
  </div>
);

const SceneJ = ({t}) => {
  const {v} = useF();
  const pan = lerp(80, -60, eio(prog(t, 39.5, 3.2)));
  const out = eio5(prog(t, 42.8, 0.6));
  const fill = eio(prog(t, 43.6, 1.4));
  const pos = v ? [[195, 120], [195, 440], [195, 760]] : [[70, 140], [470, 140], [870, 140]];
  return (
    <Layer t={t} from={39.5} to={45.35} zoomIn={0.35} zoomOut={0.45} outScale={2.2}>
      <div style={{position: 'absolute', inset: 0, transform: `translate${v ? 'Y' : 'X'}(${pan * (v ? 0.7 : 1)}px) scale(${lerp(1, 0.7, out)})`, opacity: 1 - out, filter: out > 0 ? `blur(${out * 8}px)` : undefined}}>
        <Audience t={t} at={39.65} icon="rocket" title="Entrepreneurs" note="Site en ligne" x={pos[0][0]} y={pos[0][1]} />
        <Audience t={t} at={40.95} icon="building" title="PME" note="Application publiée" x={pos[1][0]} y={pos[1][1]} />
        <Audience t={t} at={41.95} icon="users" title="Institutions" note="Agent IA actif" x={pos[2][0]} y={pos[2][1]} />
      </div>
      <Center style={{opacity: out}}>
        <div style={{transform: `scale(${lerp(0.8, 1, back(prog(t, 43.0, 0.65))) * (v ? 0.98 : 1)})`}}>
          <div style={{padding: '22px 30px 22px 22px', borderRadius: 999, background: '#fff', border: `1px solid ${C.line}`, boxShadow: shadow, display: 'flex', alignItems: 'center', gap: 18, fontFamily: FONT}}>
            <IconTile name="spark" size={48} dark style={{borderRadius: 24}} />
            <div style={{...H(30, 500, C.gray), display: 'flex', gap: 10}}>
              <span>De</span><span style={{color: C.ink, fontWeight: 700, ...appear(t, 43.6)}}>l'idée</span><span style={appear(t, 43.85)}>à la</span><span style={{color: C.ink, fontWeight: 700, ...appear(t, 44.0)}}>réalisation</span>
            </div>
            <div style={{width: v ? 70 : 120, height: 8, borderRadius: 4, background: C.tile, overflow: 'hidden'}}>
              <div style={{width: `${fill * 100}%`, height: '100%', background: C.data, borderRadius: 4}} />
            </div>
          </div>
        </div>
      </Center>
    </Layer>
  );
};

// ---------- K. « Vous avez un projet ? » : carte noire laquée en 3D avec le logo en relief
const SceneK = ({t}) => {
  const {v} = useF();
  const card = clamp(back(prog(t, 45.55, 0.6)), 0, 1.2);
  const turn = eox(prog(t, 45.55, 1.0));
  const fly = eio5(prog(t, 46.5, 0.6));
  const slot = lerp(0, v ? 210 : 220, eo5(prog(t, 45.55, 0.55))) * (1 - fly);
  return (
    <Layer t={t} from={45.35} to={47.05} zoomIn={0.3} zoomOut={0.35} outScale={1.25}>
      <Center>
        <div style={{display: 'flex', flexDirection: v ? 'column' : 'row', alignItems: 'center', gap: 22}}>
          <div style={{...H(v ? 70 : 60, 500, C.gray), ...appear(t, 45.42)}}>Vous avez</div>
          <div style={{position: 'relative', width: v ? 300 : slot, height: v ? slot : 150}}>
            <Stage3D w={900} h={760} wall={-1.6} shadow={0.13} style={{left: (v ? 150 : slot / 2) - 450, top: (v ? slot / 2 : 75) - 380}}>
              <group position={[fly * 2.6, fly * 2.1, fly * 0.8]} rotation={[lerp(0.5, 0.1, turn) + Math.sin(t * 1.3) * 0.04, lerp(-1.9, -0.18, turn) + fly * 0.6, lerp(-0.3, -0.06, turn) + fly * 0.4]} scale={Math.max(1e-4, card * (1 - fly * 0.85) * (v ? 1.1 : 1))}>
                <RBox w={2.1} h={1.36} d={0.16} r={0.08} m="ink" />
                <group position={[0, 0, 0.1 + 0.02]}><Logo3D size={88} m="clay" color="#FFFFFF" /></group>
              </group>
            </Stage3D>
          </div>
          <div style={{...H(v ? 70 : 60, 700), ...appear(t, 45.95)}}>un projet ?</div>
        </div>
      </Center>
    </Layer>
  );
};

// ---------- L. CTA final
const SceneL = ({t}) => {
  const {v} = useF();
  const mark = back(prog(t, 47.05, 0.6));
  const word = eo5(prog(t, 47.3, 0.8));
  const tag = eo5(prog(t, 47.75, 0.7));
  const btn = pop(t, 48.85, 0.6);
  const cur = eio5(prog(t, 48.95, 0.7));
  const press = 1 - 0.05 * Math.sin(Math.PI * prog(t, 49.6, 0.22));
  const ripple = eo(prog(t, 49.65, 0.7));
  const size = v ? 190 : 140;
  return (
    <Layer t={t} from={47.0} to={50.6} zoomIn={0.3} zoomOut={0}>
      <Center style={{flexDirection: 'column', transform: `scale(${1 + (t - 47) * 0.01})`}}>
        <div style={{opacity: clamp(mark * 3)}}>
          <Lockup size={size} reveal={word} tag={tag} mark3d={<MarkSpin t={t} size={size} at={47.0} />} />
        </div>
        {v ? (
          <div style={{...H(54, 700), marginTop: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
            <div style={{display: 'flex', gap: 14}}><W t={t} at={47.15}>Transformons</W><W t={t} at={47.75}>votre</W></div>
            <div style={{display: 'flex', gap: 14}}><W t={t} at={47.95}>idée</W><W t={t} at={48.3}>en</W><W t={t} at={48.5} style={{color: C.gray}}>réalité.</W></div>
          </div>
        ) : (
          <div style={{...H(44, 700), marginTop: 34, display: 'flex', gap: 12}}>
            <W t={t} at={47.15}>Transformons</W><W t={t} at={47.75}>votre</W><W t={t} at={47.95}>idée</W><W t={t} at={48.3}>en</W><W t={t} at={48.5} style={{color: C.gray}}>réalité.</W>
          </div>
        )}
        <div style={{position: 'relative', marginTop: v ? 46 : 34, ...btn}}>
          <div style={{transform: `scale(${press})`, padding: v ? '22px 40px' : '18px 34px', borderRadius: 999, background: C.ink, color: '#fff', fontFamily: FONT, fontSize: v ? 28 : 23, fontWeight: 600, boxShadow: '0 20px 40px -16px rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', gap: 12}}>
            Demander un devis <Icon name="arrow" size={v ? 26 : 22} color="#fff" sw={2.2} />
          </div>
          {ripple > 0 && ripple < 1 && <div style={{position: 'absolute', inset: 0, borderRadius: 999, border: `2px solid ${C.ink}`, transform: `scale(${1 + ripple * 0.16})`, opacity: 1 - ripple}} />}
          <div style={{position: 'absolute', left: lerp(v ? 330 : 400, v ? 240 : 200, cur), top: lerp(130, 40, cur), opacity: eo(prog(t, 48.9, 0.3))}}><Icon name="cursor" size={v ? 38 : 32} color={C.ink} /></div>
        </div>
        <div style={{...H(v ? 24 : 18, 500, C.gray), marginTop: v ? 44 : 30, display: 'flex', flexDirection: v ? 'column' : 'row', alignItems: 'center', gap: v ? 8 : 18, ...appear(t, 49.1)}}>
          <span>cyberspacesarl.com</span>{!v && <span style={{color: C.gray2}}>·</span>}<span>WhatsApp +243 97 029 9448</span>
        </div>
      </Center>
    </Layer>
  );
};

export const Video = ({vertical = false}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const u = remap(frame / fps);
  const SW = vertical ? 720 : 1276, SH = vertical ? 1280 : 720;
  const k = width / SW;
  return (
    <AbsoluteFill style={{background: C.bg, fontFamily: FONT, overflow: 'hidden'}}>
      <Fmt.Provider value={{v: vertical, W: SW, H: SH, k}}>
        <div style={{position: 'absolute', left: (width - SW * k) / 2, top: (height - SH * k) / 2, width: SW, height: SH, transform: `scale(${k})`, transformOrigin: '0 0'}}>
          <GridBg t={u} />
          <SceneA t={u} />
          <SceneB t={u} />
          <SceneC t={u} />
          <SceneD t={u} />
          <SceneE t={u} />
          <SceneF t={u} />
          <SceneG t={u} />
          <SceneH t={u} />
          <SceneI t={u} />
          <SceneJ t={u} />
          <SceneK t={u} />
          <SceneL t={u} />
        </div>
      </Fmt.Provider>
    </AbsoluteFill>
  );
};
