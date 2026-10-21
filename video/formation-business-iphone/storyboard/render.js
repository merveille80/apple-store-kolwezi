const { chromium } = require('playwright');
const fs = require('fs');
const D = __dirname + '/img/';
const OUT = __dirname + '/out/';
fs.mkdirSync(OUT, { recursive: true });
const C = {};
const im = (f) => C[f] || (C[f] = `data:image/${f.endsWith('jpg') ? 'jpeg' : 'png'};base64,` + fs.readFileSync(D + f).toString('base64'));

const ink = '#1d1d1f', gray = '#86868b', blue = '#0071e3';
const abs = (x, y, extra = '') => `position:absolute;left:${x}px;top:${y}px;${extra}`;
const txt = (s, x, y, size, o = {}) => `<div style="${abs(x, y)}font-size:${size}px;font-weight:${o.w || 650};color:${o.c || ink};letter-spacing:${o.ls ?? -0.025}em;line-height:1.08;white-space:${o.wrap ? 'normal' : 'nowrap'};width:${o.width ? o.width + 'px' : 'auto'};text-align:${o.align || 'left'};opacity:${o.op ?? 1};filter:${o.blur ? `blur(${o.blur}px)` : 'none'};transform:translateX(${o.center ? '-50%' : '0'})">${s}</div>`;
const card = (x, y, w, h, inner = '', o = {}) => `<div style="${abs(x, y)}width:${w}px;height:${h}px;border-radius:${o.r || 26}px;background:${o.bg || '#fff'};box-shadow:0 18px 50px rgba(0,0,0,${o.sh ?? 0.10}),0 0 0 1px rgba(0,0,0,.05);overflow:${o.ov || 'hidden'};opacity:${o.op ?? 1};transform:${o.tf || 'none'}">${inner}</div>`;
const phone = (f, x, y, h, o = {}) => `<img src="${im(f)}" style="${abs(x, y)}height:${h}px;transform:rotate(${o.rot || 0}deg);filter:drop-shadow(0 ${h * .05}px ${h * .07}px rgba(0,0,0,.18)) ${o.blur ? `blur(${o.blur}px)` : ''};opacity:${o.op ?? 1}">`;
const pill = (s, x, y, o = {}) => `<div style="${abs(x, y)}padding:${o.p || '9px 16px'};border-radius:999px;background:${o.bg || '#fff'};color:${o.c || ink};font-size:${o.fs || 16}px;font-weight:650;box-shadow:0 8px 24px rgba(0,0,0,.10),0 0 0 1px rgba(0,0,0,.05);white-space:nowrap;transform:${o.tf || 'none'}">${s}</div>`;
const check = (s = 18, c = blue) => `<svg width="${s}" height="${s}" viewBox="0 0 20 20" style="vertical-align:-3px"><circle cx="10" cy="10" r="10" fill="${c}"/><path d="M5.5 10.3l3 3 6-6.3" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const cursor = (x, y, s = 26) => `<svg style="${abs(x, y)}width:${s}px;height:${s * 1.4}px;z-index:20;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3))" viewBox="0 0 20 28"><path d="M2 2 L2 22 L7 17 L10.5 25 L14 23.5 L10.5 15.8 L17 15.5 Z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
const ripple = (x, y) => `<div style="${abs(x - 22, y - 22)}width:44px;height:44px;border-radius:50%;border:2px solid rgba(0,113,227,.5);background:rgba(0,113,227,.08)"></div>`;
const brand = (x, y, s = 13, center = false) => txt(`apple store <span style="color:${gray}">kolwezi</span>`, x, y, s, { w: 600, ls: -0.01, center });
// Icônes d'apps (version storyboard ; les logos officiels en production)
const appIcon = (k, x, y, s) => {
  const bg = { wa: '#25D366', fb: '#0866FF', tt: '#000' }[k];
  const g = {
    wa: `<path d="M32 12a20 20 0 0 0-17.3 30l-2.7 9.9 10.2-2.7A20 20 0 1 0 32 12z" fill="none" stroke="#fff" stroke-width="4"/><path d="M24.5 22.5c.8-.8 2-.6 2.5.4l1.6 3.6c.3.7 0 1.5-.5 2l-1 1c1.4 3 3.8 5.4 6.8 6.8l1-1c.5-.5 1.3-.8 2-.5l3.6 1.6c1 .5 1.2 1.7.4 2.5-3 3-8 1.5-12-2.5s-5.4-9-2.4-11.9z" fill="#fff"/>`,
    fb: `<path d="M36 54V35h6l1-7h-7v-4.5c0-2 .6-3.5 3.6-3.5H43v-6.3c-.7-.1-2.9-.3-5.5-.3-5.4 0-9 3.3-9 9.3V28h-6v7h6v19z" fill="#fff"/>`,
    tt: `<path d="M35 12h7c.6 5 3.6 8 8.5 8.5v7c-3.2 0-6-1-8.5-2.8V40a12 12 0 1 1-12-12v7.2a5 5 0 1 0 5 4.8z" fill="#fff"/><path d="M33 14h7c.6 5 3.6 8 8.5 8.5" fill="none" stroke="#25F4EE" stroke-width="1.5" opacity=".7"/>`,
  }[k];
  return `<svg style="${abs(x, y)}width:${s}px;height:${s}px;filter:drop-shadow(0 10px 20px rgba(0,0,0,.18))" viewBox="0 0 64 64"><rect width="64" height="64" rx="14.5" fill="${bg}"/>${g}</svg>`;
};

const W = 540, H = 960;
// Modes de cadrage de l'avatar
const avFull = (f) => `<img src="${im(f)}" style="${abs(0, 0)}width:${W}px;height:${H}px;object-fit:cover">`;
const avCard = (f) => `<div style="${abs(24, 520)}width:${W - 48}px;height:${H - 520 - 60}px;border-radius:30px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.14)"><img src="${im(f)}" style="width:100%;height:100%;object-fit:cover;object-position:50% 18%"></div>`;
const avBubble = (f) => `<div style="${abs(W - 24 - 112, H - 60 - 150)}width:112px;height:150px;border-radius:24px;overflow:hidden;box-shadow:0 14px 34px rgba(0,0,0,.18);border:3px solid #fff"><img src="${im(f)}" style="width:100%;height:100%;object-fit:cover;object-position:50% 15%"></div>`;
const white = `<div style="${abs(0, 0)}width:${W}px;height:${H}px;background:#fff"></div>`;

const scenes = [
  // 1
  () => avFull('av-1.5.jpg') + card(40, 640, 460, 200, `
      ${phone('bm-17promax.png', 255, -70, 190, { rot: -8 })}${phone('18promax.png', 330, -40, 190, { rot: 6 })}
      ${txt('Le business', 28, 34, 40)}${txt('d’iPhone', 28, 80, 40)}
      ${pill('en RDC', 28, 138, { fs: 15, bg: ink, c: '#fff' })}`, { r: 30, bg: 'rgba(255,255,255,.94)', ov: 'visible' }),
  // 2
  () => white + card(40, 90, 460, 64, `<div style="${abs(22, 19)}font-size:22px;font-weight:550;color:${ink}">Par où commencer ?<span style="display:inline-block;width:2px;height:24px;background:${blue};margin-left:3px;vertical-align:-4px"></span></div>
      <svg style="${abs(410, 17)}" width="30" height="30" viewBox="0 0 24 24"><circle cx="10" cy="10" r="6.5" stroke="${gray}" stroke-width="2.2" fill="none"/><path d="M15 15l5 5" stroke="${gray}" stroke-width="2.2" stroke-linecap="round"/></svg>`, { r: 32 })
    + `<svg style="${abs(0, 160)}" width="540" height="340" viewBox="0 0 540 340"><g fill="none" stroke="#c7c7cc" stroke-width="2.5" stroke-dasharray="2 9" stroke-linecap="round"><path d="M270 20 C270 120 120 140 110 250"/><path d="M270 20 L270 250"/><path d="M270 20 C270 120 420 140 430 250"/></g></svg>`
    + pill('Acheter où ?', 50, 410, { fs: 15 }) + pill('Quel prix ?', 212, 410, { fs: 15 }) + pill('Vendre comment ?', 360, 410, { fs: 15 })
    + avCard('av-4.6.jpg'),
  // 3
  () => white + txt('seulement', 270, 230, 24, { w: 500, c: gray, center: true })
    + txt('150 000', 270, 275, 112, { w: 700, ls: -0.05, center: true }) + txt('FC', 270, 400, 52, { w: 650, c: gray, center: true })
    + card(110, 520, 320, 70, `<div style="${abs(22, 22)}font-size:20px;font-weight:600">${check(22)}&nbsp; Formation complète</div>`, { r: 35 })
    + avBubble('av-8.0.jpg'),
  // 4
  () => white + card(70, 120, 400, 560, `
      <div style="${abs(0, 0)}width:400px;height:300px;background:#f5f5f7"></div>
      ${phone('noir-dos.png', 110, 40, 230, { rot: -6 })}${phone('argent-dos.png', 200, 50, 230, { rot: 6 })}
      ${pill('Formation', 24, 324, { fs: 13, p: '6px 12px', bg: '#f5f5f7' })}
      ${txt('SE LANCER', 26, 370, 40, { w: 750 })}${txt('DANS LE BUSINESS', 26, 414, 40, { w: 750 })}${txt('D’IPHONE', 26, 458, 40, { w: 750, op: .25, blur: 3 })}
      ${txt('Méthode complète · RDC', 26, 516, 16, { w: 500, c: gray })}`, { r: 34, sh: .14 })
    + avBubble('av-11.2.jpg'),
  // 5
  () => white + card(40, 70, 460, 420, `${txt('Tu vas apprendre', 28, 30, 30)}
      ${[0, 1, 2, 3].map(i => `<div style="${abs(28, 100 + i * 76)}width:404px;height:58px;border-radius:16px;background:#f5f5f7"></div><div style="${abs(46, 117 + i * 76)}width:24px;height:24px;border-radius:50%;border:2px solid #d2d2d7"></div><div style="${abs(88, 122 + i * 76)}width:${[220, 260, 200, 240][i]}px;height:14px;border-radius:7px;background:#e5e5ea"></div>`).join('')}`, { r: 32 })
    + avCard('av-13.2.jpg'),
  // 6
  () => white + txt('01', 40, 70, 18, { w: 700, c: blue }) + txt('Où acheter', 40, 96, 46) + txt('sans te faire escroquer', 40, 148, 30, { c: gray, w: 600 })
    + card(40, 250, 270, 380, `<div style="${abs(0, 0)}width:270px;height:250px;background:#f5f5f7"></div>${phone('bm-16promax.png', 55, 25, 200)}
      ${txt('Fournisseur', 20, 270, 22)}${txt(`${check(18)} Vérifié`, 20, 304, 18, { c: blue, w: 650 })}${txt('IMEI · État · Garantie', 20, 340, 14, { c: gray, w: 550 })}`, { r: 26, sh: .14 })
    + card(330, 300, 180, 280, `<div style="${abs(0, 0)}width:180px;height:170px;background:#f5f5f7"></div>${phone('bm-15promax.png', 40, 20, 130, { op: .45 })}
      ${txt('Prix trop beau ?', 16, 190, 16, { c: gray })}<div style="${abs(16, 228)}font-size:15px;font-weight:600;color:${gray};text-decoration:line-through">Arnaque</div>`, { r: 22, op: .75, tf: 'scale(.96)' })
    + avBubble('av-15.5.jpg'),
  // 7
  () => white + txt('02', 40, 70, 18, { w: 700, c: blue }) + txt('Ta rentabilité', 40, 96, 46) + txt('et tes prix', 40, 148, 30, { c: gray, w: 600 })
    + card(40, 240, 460, 400, `
      ${[['Prix d’achat', '1 100 $', ink], ['Prix de vente', '1 250 $', ink]].map((r, i) => `${txt(r[0], 28, 32 + i * 64, 19, { c: gray, w: 550 })}${txt(r[1], 432, 30 + i * 64, 24, { w: 650, align: 'right' }).replace('left:432px', 'right:28px')}<div style="${abs(28, 74 + i * 64)}width:404px;height:1px;background:#e5e5ea"></div>`).join('')}
      ${txt('Marge', 28, 170, 22, { w: 650 })}<div style="${abs(0, 160)}width:432px;text-align:right;font-size:40px;font-weight:700;color:${ink};letter-spacing:-.03em">+150 $</div>
      <svg style="${abs(28, 240)}" width="404" height="130" viewBox="0 0 404 130">${[30, 46, 40, 62, 74, 92, 118].map((h, i) => `<rect x="${i * 58}" y="${130 - h}" width="40" height="${h}" rx="9" fill="${i === 6 ? ink : '#e5e5ea'}"/>`).join('')}</svg>`, { r: 30, sh: .12 })
    + txt('chiffres d’exemple', 40, 656, 13, { c: gray, w: 500 }) + avBubble('av-18.8.jpg'),
  // 8
  () => white + txt('03', 40, 70, 18, { w: 700, c: blue }) + txt('Quel modèle', 40, 96, 46) + txt('selon ton budget', 40, 148, 30, { c: gray, w: 600 })
    + card(40, 240, 460, 120, `${txt('Ton budget', 26, 22, 17, { c: gray, w: 550 })}${txt('600 $', 26, 46, 34, { w: 700 })}
      <div style="${abs(26, 96)}width:408px;height:6px;border-radius:3px;background:#e5e5ea"></div><div style="${abs(26, 96)}width:190px;height:6px;border-radius:3px;background:${blue}"></div>
      <div style="${abs(204, 86)}width:26px;height:26px;border-radius:50%;background:#fff;box-shadow:0 3px 10px rgba(0,0,0,.25)"></div>`, { r: 26 })
    + phone('bm-12.png', 30, 420, 170, { op: .35 }) + phone('bm-14promax.png', 180, 395, 215) + phone('bm-17promax.png', 360, 420, 170, { op: .35 })
    + pill('iPhone 14 Pro Max', 200, 625, { fs: 15, bg: ink, c: '#fff' }) + avBubble('av-22.2.jpg'),
  // 9
  () => white + txt('04', 40, 70, 18, { w: 700, c: blue }) + txt('Vendre vite', 40, 96, 46) + txt('sur les réseaux', 40, 148, 30, { c: gray, w: 600 })
    + appIcon('wa', 60, 240, 110) + appIcon('fb', 215, 240, 110) + appIcon('tt', 370, 240, 110)
    + txt('WhatsApp', 115, 362, 15, { w: 600, c: gray, center: true }) + txt('Facebook', 270, 362, 15, { w: 600, c: gray, center: true }) + txt('TikTok', 425, 362, 15, { w: 600, c: gray, center: true })
    + card(40, 420, 460, 82, `${appIcon('wa', 16, 18, 46)}${txt('Client', 76, 18, 17)}${txt('Il est encore dispo ? Je prends 👍', 76, 44, 16, { c: gray, w: 500 })}${txt('maintenant', 444, 20, 13, { c: gray, w: 500 }).replace('left:444px', 'right:16px')}`, { r: 22, bg: 'rgba(255,255,255,.96)' })
    + card(56, 514, 428, 74, `${appIcon('tt', 14, 14, 44)}${txt('12,4 k vues', 70, 14, 17)}${txt('sur ta vidéo iPhone 17 Pro Max', 70, 40, 15, { c: gray, w: 500 })}`, { r: 20, op: .9, tf: 'scale(.97)' })
    + card(72, 598, 396, 66, `${appIcon('fb', 14, 12, 40)}${txt('3 nouveaux messages', 66, 22, 16)}`, { r: 18, op: .75, tf: 'scale(.94)' })
    + avBubble('av-26.8.jpg'),
  // 10
  () => avFull('av-30.0.jpg') + card(40, 660, 460, 170, `${txt('L’objectif est simple', 28, 30, 20, { c: gray, w: 550 })}${txt('Démarrer ton', 28, 64, 38)}${txt('business d’iPhone', 28, 108, 38)}`, { r: 30, bg: 'rgba(255,255,255,.94)' }),
  // 11
  () => white + txt('Une vraie méthode', 270, 110, 40, { center: true })
    + pill(`${check(22)}&nbsp; Claire`, 175, 200, { fs: 26, p: '16px 26px' }) + pill(`${check(22)}&nbsp; Concrète`, 155, 290, { fs: 26, p: '16px 26px' }) + pill(`${check(22, ink)}&nbsp; Rentable`, 160, 380, { fs: 26, p: '16px 26px', tf: 'scale(1.06)' })
    + avCard('av-34.5.jpg'),
  // 12
  () => white + card(40, 90, 460, 56, `<svg style="${abs(18, 18)}" width="20" height="20" viewBox="0 0 20 20"><rect x="4" y="9" width="12" height="9" rx="2" fill="${gray}"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9" stroke="${gray}" stroke-width="2" fill="none"/></svg>${txt('ton-site.com/formation', 48, 17, 19, { w: 550 })}`, { r: 28, sh: .08 })
    + txt('Le programme complet', 270, 200, 24, { c: gray, w: 550, center: true }) + txt('Inscris-toi', 270, 240, 58, { w: 700, center: true }) + txt('dès aujourd’hui', 270, 306, 58, { w: 700, center: true })
    + `<div style="${abs(110, 420)}width:320px;height:70px;border-radius:35px;background:${ink};color:#fff;font-size:22px;font-weight:650;display:flex;align-items:center;justify-content:center;box-shadow:0 14px 30px rgba(0,0,0,.2)">Voir le programme</div>`
    + ripple(340, 462) + cursor(336, 458) + txt('150 000 FC · formation complète', 270, 515, 17, { c: gray, w: 550, center: true })
    + brand(270, 880, 15, true) + avBubble('av-38.5.jpg'),
];

// Exemple de mise en page 16:9 (scène 7)
const sample169 = () => {
  const inner = scenes[6]().replace(avBubble('av-18.8.jpg'), '');
  return `<div style="${abs(0, 0)}width:1600px;height:900px;background:#fff"></div>
    <div style="${abs(60, 60)}width:438px;height:780px;border-radius:34px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.14)"><img src="${im('av-18.8.jpg')}" style="width:100%;height:100%;object-fit:cover"></div>
    <div style="${abs(700, 40)}width:540px;height:960px;transform:scale(.86);transform-origin:0 0">${inner}</div>`;
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  const page = (body, w, h) => `<html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{width:${w}px;height:${h}px;overflow:hidden;position:relative;font-family:'Inter Display','Inter',sans-serif;-webkit-font-smoothing:antialiased;background:#fff}</style></head><body>${body}</body></html>`;
  for (let i = 0; i < scenes.length; i++) {
    await p.setContent(page(scenes[i](), W, H)); await p.waitForTimeout(80);
    await p.screenshot({ path: `${OUT}scene-${i + 1}-9x16.png` });
  }
  await p.setViewportSize({ width: 1600, height: 900 });
  await p.setContent(page(sample169(), 1600, 900)); await p.waitForTimeout(80);
  await p.screenshot({ path: `${OUT}exemple-16x9.png` });
  await b.close();
})();
