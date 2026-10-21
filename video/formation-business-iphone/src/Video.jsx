import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';

// Montage UI autour de la vidéo avatar. Tous les instants sont ceux de la voix (voix-mots.json).
// Les scènes sont dessinées dans un espace 540×960 (celui du storyboard), mis à l'échelle ×2 en 9:16.
export const DURATION = 40.95;

const INK = '#1d1d1f', GRAY = '#86868b', BLUE = '#0071e3', SOFT = '#f5f5f7';
const FONT = "-apple-system, 'SF Pro Display', 'Inter Display', Inter, 'Helvetica Neue', sans-serif";
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};

const p = (t, t0, d = 0.55) => interpolate(t, [t0, t0 + d], [0, 1], {...CL, easing: EASE});
const pop = (t, t0, cfg = {}) => (t < t0 ? 0 : spring({frame: (t - t0) * 60, fps: 60, config: {damping: 13, stiffness: 180, mass: 0.7, ...cfg}}));
const lerp = (a, b, k) => a + (b - a) * k;

// Entrée douce : fondu, montée, flou qui se résorbe
const rise = (t, t0, {dy = 26, d = 0.6, blur = 10, s = 0.97} = {}) => {
  const k = p(t, t0, d);
  return {opacity: k, transform: `translateY(${(1 - k) * dy}px) scale(${lerp(s, 1, k)})`, filter: `blur(${(1 - k) * blur}px)`};
};
// Entrée avec rebond (icônes, pastilles)
const bounce = (t, t0, from = 0.4) => {
  const k = pop(t, t0);
  return {opacity: Math.min(1, k * 2), transform: `scale(${lerp(from, 1, k)})`};
};

const A = ({x, y, w, h, style, children}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, ...style}}>{children}</div>
);
const T = ({x, y, size, w = 650, c = INK, ls = -0.025, center, right, style, children}) => (
  <div style={{position: 'absolute', left: x, top: y, fontSize: size, fontWeight: w, color: c, letterSpacing: `${ls}em`, lineHeight: 1.08, whiteSpace: 'nowrap',
    ...style, transform: [center ? 'translateX(-50%)' : right ? 'translateX(-100%)' : '', style?.transform || ''].join(' ').trim() || undefined}}>{children}</div>
);
const Card = ({x, y, w, h, r = 26, bg = '#fff', sh = 0.1, style, children, clip = true}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: r, background: bg, overflow: clip ? 'hidden' : 'visible',
    boxShadow: `0 18px 50px rgba(0,0,0,${sh}), 0 0 0 1px rgba(0,0,0,.05)`, ...style}}>{children}</div>
);
const Pill = ({x, y, fs = 16, pad = '9px 16px', bg = '#fff', c = INK, style, children}) => (
  <div style={{position: 'absolute', left: x, top: y, padding: pad, borderRadius: 999, background: bg, color: c, fontSize: fs, fontWeight: 650, whiteSpace: 'nowrap',
    boxShadow: '0 8px 24px rgba(0,0,0,.10), 0 0 0 1px rgba(0,0,0,.05)', display: 'flex', alignItems: 'center', gap: 8, ...style}}>{children}</div>
);
const Phone = ({f, x, y, h, rot = 0, style}) => (
  <Img src={staticFile(f)} style={{position: 'absolute', left: x, top: y, height: h, transform: `rotate(${rot}deg)`,
    filter: `drop-shadow(0 ${h * 0.05}px ${h * 0.07}px rgba(0,0,0,.18))`, ...style}} />
);
const Check = ({s = 20, c = BLUE, k = 1}) => (
  <svg width={s} height={s} viewBox="0 0 20 20" style={{flex: 'none'}}>
    <circle cx="10" cy="10" r="10" fill={c} />
    <path d="M5.5 10.3l3 3 6-6.3" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="14" strokeDashoffset={14 * (1 - k)} />
  </svg>
);
const AppIcon = ({k, x, y, s, style}) => {
  const bg = {wa: '#25D366', fb: '#0866FF', tt: '#000'}[k];
  return (
    <svg style={{position: 'absolute', left: x, top: y, width: s, height: s, filter: 'drop-shadow(0 10px 20px rgba(0,0,0,.18))', ...style}} viewBox="0 0 64 64">
      <rect width="64" height="64" rx="14.5" fill={bg} />
      {k === 'wa' && <><path d="M32 12a20 20 0 0 0-17.3 30l-2.7 9.9 10.2-2.7A20 20 0 1 0 32 12z" fill="none" stroke="#fff" strokeWidth="4" /><path d="M24.5 22.5c.8-.8 2-.6 2.5.4l1.6 3.6c.3.7 0 1.5-.5 2l-1 1c1.4 3 3.8 5.4 6.8 6.8l1-1c.5-.5 1.3-.8 2-.5l3.6 1.6c1 .5 1.2 1.7.4 2.5-3 3-8 1.5-12-2.5s-5.4-9-2.4-11.9z" fill="#fff" /></>}
      {k === 'fb' && <path d="M36 54V35h6l1-7h-7v-4.5c0-2 .6-3.5 3.6-3.5H43v-6.3c-.7-.1-2.9-.3-5.5-.3-5.4 0-9 3.3-9 9.3V28h-6v7h6v19z" fill="#fff" />}
      {k === 'tt' && <><path d="M33 14h7c.6 5 3.6 8 8.5 8.5" fill="none" stroke="#25F4EE" strokeWidth="2" opacity=".8" /><path d="M35 12h7c.6 5 3.6 8 8.5 8.5v7c-3.2 0-6-1-8.5-2.8V40a12 12 0 1 1-12-12v7.2a5 5 0 1 0 5 4.8z" fill="#fff" /></>}
    </svg>
  );
};
// Mot par mot : chaque mot sort du flou à son instant
const Words = ({t, items, size, w = 650, c = INK, gap = 0.26}) => (
  <span>{items.map(([word, t0], i) => {
    const k = p(t, t0, 0.45);
    return <span key={i} style={{display: 'inline-block', marginRight: `${gap}em`, opacity: k, filter: `blur(${(1 - k) * 8}px)`, transform: `translateY(${(1 - k) * 0.35 * size}px)`}}>{word}</span>;
  })}</span>
);
const Brand = ({x, y, s = 15, center, t, t0}) => (
  <T x={x} y={y} size={s} w={600} ls={-0.01} center={center} style={{opacity: p(t, t0, 0.8), letterSpacing: `${lerp(0.12, -0.01, p(t, t0, 1.1))}em`}}>
    apple store <span style={{color: GRAY}}>kolwezi</span>
  </T>
);
const Num = ({n}) => <>{String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')}</>;

// En-tête de rubrique (01 Où acheter / sous-titre)
const Head = ({t, num, title, sub, t0, t1}) => (
  <>
    <T x={40} y={70} size={18} w={700} c={BLUE} style={rise(t, t0 - 0.1, {dy: 10})}>{num}</T>
    <T x={40} y={96} size={46} style={rise(t, t0, {dy: 20})}>{title}</T>
    <T x={40} y={148} size={30} w={600} c={GRAY} style={rise(t, t1, {dy: 14})}>{sub}</T>
  </>
);

// ---------- Scènes ----------
const SCENES = [
  {s: 0, e: 3.4, av: 'full', wy: -340, C: ({t}) => (
    <Card x={40} y={640} w={460} h={200} r={30} bg="rgba(255,255,255,.94)" clip={false} style={{...rise(t, 0.3, {dy: 120, d: 0.8, blur: 0, s: 1}), backdropFilter: 'blur(20px)'}}>
      <Phone f="bm-17promax.png" x={285} y={-80} h={180} rot={-8} style={{...rise(t, 0.6, {dy: 40}), transformOrigin: 'bottom'}} />
      <Phone f="18promax.png" x={352} y={-50} h={180} rot={6} style={rise(t, 0.8, {dy: 40})} />
      <T x={28} y={34} size={40}><Words t={t} size={40} items={[['Le', 1.45], ['business', 1.6]]} /></T>
      <T x={28} y={80} size={40}><Words t={t} size={40} items={[['d’iPhone', 2.02]]} /></T>
      <Pill x={28} y={138} fs={15} bg={INK} c="#fff" style={bounce(t, 2.9, 0.6)}>en RDC</Pill>
    </Card>
  )},
  {s: 3.4, e: 6.4, av: 'card', wy: 120, C: ({t}) => {
    const q = 'Par où commencer ?';
    const n = Math.floor(interpolate(t, [3.75, 5.6], [0, q.length], CL));
    const draw = p(t, 4.5, 0.9);
    return (
      <>
        <Card x={40} y={90} w={460} h={64} r={32} style={rise(t, 3.55, {dy: 20})}>
          <div style={{position: 'absolute', left: 22, top: 18, fontSize: 22, fontWeight: 550, color: INK}}>
            {q.slice(0, n)}<span style={{display: 'inline-block', width: 2, height: 24, background: BLUE, marginLeft: 3, verticalAlign: -4, opacity: Math.floor(t * 2.4) % 2 || n < q.length ? 1 : 0}} />
          </div>
          <svg style={{position: 'absolute', left: 410, top: 17}} width="30" height="30" viewBox="0 0 24 24"><circle cx="10" cy="10" r="6.5" stroke={GRAY} strokeWidth="2.2" fill="none" /><path d="M15 15l5 5" stroke={GRAY} strokeWidth="2.2" strokeLinecap="round" /></svg>
        </Card>
        <svg style={{position: 'absolute', left: 0, top: 160}} width="540" height="340" viewBox="0 0 540 340">
          <g fill="none" stroke="#c7c7cc" strokeWidth="2.5" strokeDasharray="2 9" strokeLinecap="round">
            {['M270 20 C270 120 100 140 90 250', 'M270 20 C270 120 232 140 232 250', 'M270 20 C270 120 410 140 404 250'].map((d, i) => (
              <path key={i} d={d} style={{clipPath: `inset(0 0 ${100 - 100 * p(t, 4.5 + i * 0.12, 0.8)}% 0)`}} opacity={draw > 0 ? 1 : 0} />
            ))}
          </g>
        </svg>
        <Pill x={28} y={410} fs={15} style={bounce(t, 5.0)}>Acheter où ?</Pill>
        <Pill x={180} y={410} fs={15} style={bounce(t, 5.25)}>Quel prix ?</Pill>
        <Pill x={318} y={410} fs={15} style={bounce(t, 5.5)}>Vendre comment ?</Pill>
      </>
    );
  }},
  {s: 6.4, e: 10.2, av: 'bubble', wy: 20, C: ({t}) => {
    const n = interpolate(t, [7.15, 8.05], [0, 150000], {...CL, easing: Easing.out(Easing.cubic)});
    const k = p(t, 9.5, 0.5);
    return (
      <>
        <T x={270} y={230} size={24} w={500} c={GRAY} center style={rise(t, 6.72, {dy: 12})}>seulement</T>
        <T x={270} y={275} size={112} w={700} ls={-0.05} center style={{...rise(t, 7.1, {dy: 30}), fontVariantNumeric: 'tabular-nums'}}><Num n={n} /></T>
        <T x={270} y={400} size={52} c={GRAY} center style={rise(t, 7.95, {dy: 16})}>FC</T>
        <Card x={110} y={520} w={320} h={70} r={35} style={rise(t, 9.0, {dy: 30})}>
          <div style={{position: 'absolute', left: 22, top: 22, display: 'flex', gap: 10, alignItems: 'center', fontSize: 20, fontWeight: 600}}>
            <div style={{transform: `scale(${lerp(0.4, 1, pop(t, 9.5))})`}}><Check s={22} k={k} /></div>Formation complète
          </div>
        </Card>
      </>
    );
  }},
  {s: 10.2, e: 12.5, av: 'bubble', wy: 0, C: ({t}) => {
    const k = p(t, 10.2, 0.9);
    return (
      <Card x={70} y={120} w={400} h={560} r={34} sh={0.14} style={{opacity: k, transform: `perspective(1400px) rotateX(${(1 - k) * 18}deg) translateY(${(1 - k) * 80}px) scale(${lerp(0.92, 1, k)})`}}>
        <A x={0} y={0} w={400} h={300} style={{background: SOFT}} />
        <Phone f="noir-dos.png" x={110} y={40} h={230} rot={-6} style={rise(t, 10.45, {dy: 40})} />
        <Phone f="argent-dos.png" x={200} y={50} h={230} rot={6} style={rise(t, 10.6, {dy: 40})} />
        <Pill x={24} y={324} fs={13} pad="6px 12px" bg={SOFT} style={{...rise(t, 10.5, {dy: 8}), boxShadow: 'none'}}>Formation</Pill>
        {[['SE LANCER', 10.4], ['DANS LE BUSINESS', 10.88], ['D’IPHONE', 11.8]].map(([s, t0], i) => (
          <T key={i} x={26} y={370 + i * 44} size={40} w={750} style={rise(t, t0, {dy: 14, blur: 12})}>{s}</T>
        ))}
        <T x={26} y={516} size={16} w={500} c={GRAY} style={rise(t, 11.9)}>Méthode complète · RDC</T>
      </Card>
    );
  }},
  {s: 12.5, e: 14.3, av: 'card', wy: 120, C: ({t}) => (
    <Card x={40} y={70} w={460} h={420} r={32} style={rise(t, 12.55, {dy: 30})}>
      <T x={28} y={30} size={30}><Words t={t} size={30} items={[['Tu', 13.4], ['vas', 13.5], ['apprendre', 13.65]]} /></T>
      {[0, 1, 2, 3].map((i) => (
        <A key={i} x={28} y={100 + i * 76} w={404} h={58} style={{...rise(t, 12.85 + i * 0.13, {dy: 16}), borderRadius: 16, background: SOFT}}>
          <A x={18} y={17} w={24} h={24} style={{borderRadius: '50%', border: '2px solid #d2d2d7'}} />
          <A x={60} y={22} w={[220, 260, 200, 240][i] * p(t, 13.0 + i * 0.13, 0.7)} h={14} style={{borderRadius: 7, background: '#e5e5ea'}} />
        </A>
      ))}
    </Card>
  )},
  {s: 14.3, e: 17.2, av: 'bubble', wy: 20, C: ({t}) => {
    const strike = p(t, 16.3, 0.45);
    return (
      <>
        <Head t={t} num="01" title="Où acheter" sub="sans te faire escroquer" t0={14.38} t1={15.75} />
        <Card x={40} y={250} w={270} h={380} sh={0.14} style={rise(t, 14.75, {dy: 60})}>
          <A x={0} y={0} w={270} h={250} style={{background: SOFT}} />
          <Phone f="bm-16promax.png" x={55} y={25} h={200} style={rise(t, 14.95, {dy: 30})} />
          <T x={20} y={270} size={22}>Fournisseur</T>
          <T x={20} y={304} size={18} c={BLUE} style={{display: 'flex', gap: 6, alignItems: 'center', opacity: p(t, 15.2, 0.3)}}>
            <span style={{transform: `scale(${lerp(0.3, 1, pop(t, 15.2))})`, display: 'flex'}}><Check s={18} k={p(t, 15.3, 0.4)} /></span>Vérifié
          </T>
          <T x={20} y={340} size={14} w={550} c={GRAY} style={rise(t, 15.45, {dy: 6})}>IMEI · État · Garantie</T>
        </Card>
        <Card x={330} y={300} w={180} h={280} r={22} style={{...rise(t, 15.8, {dy: 60}), opacity: 0.75 * p(t, 15.8, 0.6)}}>
          <A x={0} y={0} w={180} h={170} style={{background: SOFT}} />
          <Phone f="bm-15promax.png" x={40} y={20} h={130} style={{opacity: 0.45}} />
          <T x={16} y={190} size={16} c={GRAY}>Prix trop beau ?</T>
          <T x={16} y={228} size={15} w={600} c={GRAY} style={{opacity: 1 - 0.6 * p(t, 16.75, 0.4)}}>
            Arnaque<A x={-2} y={9} w={66 * strike} h={2} style={{background: GRAY}} />
          </T>
        </Card>
      </>
    );
  }},
  {s: 17.2, e: 20.8, av: 'bubble', wy: 20, C: ({t}) => {
    const m = interpolate(t, [18.45, 19.3], [0, 150], {...CL, easing: Easing.out(Easing.cubic)});
    const H = [30, 46, 40, 62, 74, 92, 118];
    return (
      <>
        <Head t={t} num="02" title="Ta rentabilité" sub="et tes prix" t0={17.42} t1={19.6} />
        <Card x={40} y={240} w={460} h={400} r={30} sh={0.12} style={rise(t, 17.6, {dy: 50})}>
          {[['Prix d’achat', '1 100 $', 17.8], ['Prix de vente', '1 250 $', 18.1]].map(([a, b, t0], i) => (
            <React.Fragment key={i}>
              <T x={28} y={32 + i * 64} size={19} w={550} c={GRAY} style={rise(t, t0, {dy: 8})}>{a}</T>
              <T x={432} y={30 + i * 64} size={24} right style={rise(t, t0 + 0.1, {dy: 8})}>{b}</T>
              <A x={28} y={74 + i * 64} w={404 * p(t, t0, 0.6)} h={1} style={{background: '#e5e5ea'}} />
            </React.Fragment>
          ))}
          <T x={28} y={170} size={22} style={rise(t, 18.4, {dy: 8})}>Marge</T>
          <T x={432} y={158} size={40} w={700} ls={-0.03} right style={{opacity: p(t, 18.4, 0.3), fontVariantNumeric: 'tabular-nums'}}>+<Num n={m} /> $</T>
          <svg style={{position: 'absolute', left: 28, top: 240}} width="404" height="130" viewBox="0 0 404 130">
            {H.map((h, i) => {
              const k = pop(t, 19.4 + i * 0.12, {damping: 15});
              const last = i === 6;
              return <rect key={i} x={i * 58} y={130 - h * k} width="40" height={Math.max(0, h * k)} rx="9" fill={last && t > 20.2 ? INK : '#e5e5ea'} />;
            })}
          </svg>
        </Card>
        <T x={40} y={656} size={13} w={500} c={GRAY} style={rise(t, 18.2, {dy: 4})}>chiffres d’exemple</T>
      </>
    );
  }},
  {s: 20.8, e: 23.8, av: 'bubble', wy: 20, C: ({t}) => {
    // Budget : 300 $ → 600 $ → 1 000 $, le modèle correspondant passe devant
    const b = interpolate(t, [21.3, 21.9, 22.3, 22.9, 23.1], [300, 300, 600, 600, 1000], {...CL, easing: Easing.inOut(Easing.cubic)});
    const sel = b < 450 ? 0 : b < 800 ? 1 : 2;
    const pos = interpolate(b, [300, 600, 1000], [0, 1, 2], CL);
    const M = [['bm-12.png', 'iPhone 12'], ['bm-14promax.png', 'iPhone 14 Pro Max'], ['bm-17promax.png', 'iPhone 17 Pro Max']];
    return (
      <>
        <Head t={t} num="03" title="Quel modèle" sub="selon ton budget" t0={21.04} t1={22.24} />
        <Card x={40} y={240} w={460} h={120} style={rise(t, 21.2, {dy: 30})}>
          <T x={26} y={22} size={17} w={550} c={GRAY}>Ton budget</T>
          <T x={26} y={46} size={34} w={700} style={{fontVariantNumeric: 'tabular-nums'}}><Num n={Math.round(b / 10) * 10} /> $</T>
          <A x={26} y={96} w={408} h={6} style={{borderRadius: 3, background: '#e5e5ea'}} />
          <A x={26} y={96} w={408 * (b - 200) / 900} h={6} style={{borderRadius: 3, background: BLUE}} />
          <A x={26 + 408 * (b - 200) / 900 - 13} y={86} w={26} h={26} style={{borderRadius: '50%', background: '#fff', boxShadow: '0 3px 10px rgba(0,0,0,.25)'}} />
        </Card>
        <div style={{position: 'absolute', left: 0, top: 390, width: 540, height: 280, ...rise(t, 21.45, {dy: 40})}}>
          {M.map(([f], i) => {
            const d = i - pos; // position relative au centre
            const ad = Math.min(1.4, Math.abs(d));
            const h = lerp(215, 160, Math.min(1, ad));
            return <Phone key={i} f={f} x={270 + d * 175 - h * 0.4} y={10 + (215 - h) * 0.6} h={h}
              style={{opacity: lerp(1, 0.35, Math.min(1, ad)), filter: `blur(${Math.min(1, ad) * 1.5}px) drop-shadow(0 10px 15px rgba(0,0,0,.18))`, zIndex: 10 - Math.round(ad * 3)}} />;
          })}
        </div>
        <Pill x={270} y={625} fs={15} bg={INK} c="#fff" style={{transform: `translateX(-50%) scale(${lerp(0.9, 1, pop(t, [21.5, 22.3, 23.1][sel]))})`, opacity: p(t, 21.6, 0.3)}}>{M[sel][1]}</Pill>
      </>
    );
  }},
  {s: 23.8, e: 28.2, av: 'bubble', wy: 20, C: ({t}) => (
    <>
      <Head t={t} num="04" title="Vendre vite" sub="sur les réseaux" t0={24.12} t1={25.04} />
      {[['wa', 60, 26.04, 'WhatsApp'], ['fb', 215, 26.74, 'Facebook'], ['tt', 370, 27.46, 'TikTok']].map(([k, x, t0, name]) => (
        <React.Fragment key={k}>
          <AppIcon k={k} x={x} y={240} s={110} style={{...bounce(t, t0 - 0.05, 0.3), transformOrigin: '50% 80%'}} />
          <T x={x + 55} y={362} size={15} w={600} c={GRAY} center style={{opacity: p(t, t0 + 0.1, 0.4)}}>{name}</T>
        </React.Fragment>
      ))}
      <Card x={40} y={420} w={460} h={82} r={22} bg="rgba(255,255,255,.97)" style={rise(t, 24.55, {dy: -40, blur: 6})}>
        <AppIcon k="wa" x={16} y={18} s={46} style={{filter: 'none'}} />
        <T x={76} y={18} size={17}>Client</T>
        <T x={76} y={44} size={16} w={500} c={GRAY}>Il est encore dispo ? Je prends 👍</T>
        <T x={444} y={20} size={13} w={500} c={GRAY} right>maintenant</T>
      </Card>
      <Card x={56} y={514} w={428} h={74} r={20} style={{...rise(t, 25.05, {dy: -40, blur: 6}), opacity: 0.9 * p(t, 25.05)}}>
        <AppIcon k="tt" x={14} y={14} s={44} style={{filter: 'none'}} />
        <T x={70} y={14} size={17}>12,4 k vues</T>
        <T x={70} y={40} size={15} w={500} c={GRAY}>sur ta vidéo iPhone 17 Pro Max</T>
      </Card>
      <Card x={72} y={598} w={396} h={66} r={18} style={{...rise(t, 25.55, {dy: -40, blur: 6}), opacity: 0.78 * p(t, 25.55)}}>
        <AppIcon k="fb" x={14} y={12} s={40} style={{filter: 'none'}} />
        <T x={66} y={22} size={16}>3 nouveaux messages</T>
      </Card>
    </>
  )},
  {s: 28.2, e: 31.8, av: 'full', wy: -340, C: ({t}) => (
    <Card x={40} y={660} w={460} h={170} r={30} bg="rgba(255,255,255,.94)" style={{...rise(t, 28.3, {dy: 120, d: 0.8, blur: 0, s: 1}), backdropFilter: 'blur(20px)'}}>
      <T x={28} y={30} size={20} w={550} c={GRAY}><Words t={t} size={20} items={[['L’objectif', 28.3], ['est', 28.8], ['simple', 29.0]]} /></T>
      <T x={28} y={64} size={38}><Words t={t} size={38} items={[['Démarrer', 30.2], ['ton', 30.64]]} /></T>
      <T x={28} y={108} size={38}><Words t={t} size={38} items={[['business', 30.8], ['d’iPhone', 31.24]]} /></T>
    </Card>
  )},
  {s: 31.8, e: 36.2, av: 'card', wy: 120, C: ({t}) => (
    <>
      <T x={270} y={110} size={40} center><Words t={t} size={40} items={[['Une', 32.4], ['vraie', 32.66], ['méthode', 32.88]]} /></T>
      {[['Claire', 175, 200, 33.86, BLUE], ['Concrète', 155, 290, 34.5, BLUE], ['Rentable', 160, 380, 35.36, INK]].map(([s, x, y, t0, c], i) => (
        <Pill key={i} x={x} y={y} fs={26} pad="16px 26px" style={{...bounce(t, t0 - 0.06, 0.5), transform: `${bounce(t, t0 - 0.06, 0.5).transform} scale(${i === 2 ? lerp(1, 1.06, p(t, 35.6, 0.4)) : 1})`}}>
          <Check s={22} c={c} k={p(t, t0 + 0.08, 0.35)} />{s}
        </Pill>
      ))}
    </>
  )},
  {s: 36.2, e: DURATION + 1, av: 'bubble', wy: 90, C: ({t, wide}) => {
    // Curseur : arrive sur le bouton et clique sur « lien » (37,24 s)
    const cx = interpolate(t, [36.5, 37.15], [470, 336], {...CL, easing: EASE}), cy = interpolate(t, [36.5, 37.15], [640, 458], {...CL, easing: EASE});
    const click = p(t, 37.24, 0.5);
    const press = t > 37.2 && t < 37.36 ? 0.96 : 1;
    return (
      <>
        <Card x={40} y={90} w={460} h={56} r={28} sh={0.08} style={rise(t, 36.35, {dy: 20})}>
          <svg style={{position: 'absolute', left: 18, top: 17}} width="22" height="22" viewBox="0 0 24 24"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" stroke={GRAY} strokeWidth="2.2" fill="none" strokeLinecap="round" /></svg>
          <T x={50} y={17} size={19} w={600}>Lien du site</T>
          <T x={442} y={19} size={15} w={550} c={BLUE} right>Programme complet</T>
        </Card>
        <T x={270} y={200} size={24} w={550} c={GRAY} center style={rise(t, 38.3, {dy: 10})}>Le programme complet</T>
        <T x={270} y={240} size={58} w={700} center style={rise(t, 39.45, {dy: 20})}>Inscris-toi</T>
        <T x={270} y={306} size={58} w={700} center style={rise(t, 40.15, {dy: 20, d: 0.5})}>dès aujourd’hui</T>
        <A x={110} y={420} w={320} h={70} style={{...rise(t, 36.55, {dy: 30}), borderRadius: 35, background: INK, color: '#fff', fontSize: 22, fontWeight: 650, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 14px 30px rgba(0,0,0,.2)', transform: `${rise(t, 36.55, {dy: 30}).transform} scale(${press})`}}>Voir le programme</A>
        <A x={340 - 22 - click * 30} y={462 - 22 - click * 30} w={44 + click * 60} h={44 + click * 60} style={{borderRadius: '50%', border: '2px solid rgba(0,113,227,.55)', opacity: t > 37.24 ? 1 - click : 0}} />
        <svg style={{position: 'absolute', left: cx, top: cy, width: 26, height: 36, zIndex: 20, opacity: p(t, 36.5, 0.3), filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.3))', transform: `scale(${press})`}} viewBox="0 0 20 28">
          <path d="M2 2 L2 22 L7 17 L10.5 25 L14 23.5 L10.5 15.8 L17 15.5 Z" fill="#111" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        <T x={270} y={515} size={17} w={550} c={GRAY} center style={rise(t, 38.8, {dy: 8})}>150 000 FC · formation complète</T>
        {!wide && <Brand x={270} y={880} center t={t} t0={40.3} />}
      </>
    );
  }},
];

const AV = {full: {x: 0, y: 0, w: 540, h: 960, r: 0, oy: 50}, card: {x: 24, y: 520, w: 492, h: 380, r: 30, oy: 18}, bubble: {x: 404, y: 750, w: 112, h: 150, r: 24, oy: 15}};

export const TIMELINE = SCENES.map(({s, e, av}) => ({s, e, av}));
export const AVATAR_RECTS = AV;
const sceneAt = (t) => Math.max(0, SCENES.findIndex((s, i) => t >= s.s && (i === SCENES.length - 1 || t < SCENES[i + 1].s)));

// Fenêtre d'une scène : sortie floutée sur 0,3 s
const SceneLayer = ({t, sc, wide}) => {
  if (t < sc.s - 0.02 || t > sc.e + 0.32) return null;
  const out = p(t, sc.e - 0.02, 0.32);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: 1 - out, filter: out > 0 ? `blur(${out * 10}px)` : undefined, transform: `scale(${1 - out * 0.03})`, transformOrigin: '50% 40%'}}>
      <sc.C t={t} wide={wide} />
    </div>
  );
};

const Avatar = ({t, rect, zoom = 1}) => (
  <div style={{position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: rect.r, overflow: 'hidden', background: '#9ec3d3',
    boxShadow: rect.r > 0 ? `0 ${rect.r * 0.6}px ${rect.r * 1.6}px rgba(0,0,0,.16)` : 'none', border: rect.w < 200 ? '3px solid #fff' : 'none'}}>
    <OffthreadVideo src={staticFile('avatar.mp4')} muted style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: `50% ${rect.oy}%`, transform: `scale(${zoom})`}} />
  </div>
);

// broll : calque B-roll seul sur fond transparent (projets After Effects), sans avatar ni son
export const Video = ({vertical, broll = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const i = sceneAt(t);
  const sc = SCENES[i];

  if (vertical) {
    const prev = AV[(SCENES[i - 1] || sc).av], cur = AV[sc.av];
    const k = p(t, sc.s - 0.05, 0.7);
    const rect = Object.fromEntries(Object.keys(cur).map((key) => [key, lerp(prev[key], cur[key], k)]));
    const zoom = sc.av === 'full' ? interpolate(t, [sc.s, sc.e], [1.0, 1.05], CL) : 1;
    return (
      <AbsoluteFill style={{background: broll ? 'transparent' : '#fff', fontFamily: FONT, WebkitFontSmoothing: 'antialiased'}}>
        {!broll && <Audio src={staticFile('mix.wav')} />}
        <div style={{position: 'absolute', left: 0, top: 0, width: 540, height: 960, transform: 'scale(2)', transformOrigin: '0 0', overflow: 'hidden'}}>
          {!broll && <Avatar t={t} rect={rect} zoom={zoom} />}
          {SCENES.map((s, j) => <SceneLayer key={j} t={t} sc={s} />)}
        </div>
      </AbsoluteFill>
    );
  }

  // 16:9 : avatar dans un grand cadre arrondi à gauche, B-roll à droite
  const wy = interpolate(t, [sc.s - 0.05, sc.s + 0.6], [(SCENES[i - 1] || sc).wy, sc.wy], {...CL, easing: EASE});
  const breathe = interpolate(t, [0, DURATION], [1.0, 1.04]);
  return (
    <AbsoluteFill style={{background: broll ? 'transparent' : '#fff', fontFamily: FONT, WebkitFontSmoothing: 'antialiased'}}>
      {!broll && <Audio src={staticFile('mix.wav')} />}
      {!broll && <Avatar t={t} rect={{x: 110, y: 70, w: 564, h: 940, r: 46, oy: 30}} zoom={breathe} />}
      <div style={{position: 'absolute', left: 905, top: 0, width: 540, height: 960, transform: `scale(1.35) translateY(${wy}px)`, transformOrigin: '0 0'}}>
        {SCENES.map((s, j) => <SceneLayer key={j} t={t} sc={s} wide />)}
      </div>
      <div style={{position: 'absolute', left: 1280, top: 1012}}><Brand x={0} y={0} s={20} center t={t} t0={40.3} /></div>
    </AbsoluteFill>
  );
};
