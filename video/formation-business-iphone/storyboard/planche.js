const { chromium } = require('playwright');
const fs = require('fs');
const O = __dirname + '/out/';
const b64 = (f) => 'data:image/png;base64,' + fs.readFileSync(O + f).toString('base64');
const S = JSON.parse(fs.readFileSync(__dirname + '/scenes.json'));
const rows = S.map((s, i) => `<div class="row"><img src="${b64(`scene-${i + 1}-9x16.png`)}"><div class="t">
  <div class="h"><b>${String(i + 1).padStart(2, '0')}</b><span>${s.t}</span><em>${s.cadre}</em></div>
  <div class="vo">« ${s.vo} »</div>
  <div class="lab">Visuel</div><p>${s.vis}</p>
  <div class="lab">Son</div><p>${s.son}</p></div></div>`).join('');
const html = `<html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{width:1800px;background:#f5f5f7;font-family:'Inter Display',Inter,sans-serif;color:#1d1d1f;-webkit-font-smoothing:antialiased;padding:70px}
h1{font-size:54px;letter-spacing:-.03em}.sub{color:#86868b;font-size:22px;margin:10px 0 50px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:28px}.row{display:flex;gap:26px;background:#fff;border-radius:28px;padding:22px;box-shadow:0 10px 30px rgba(0,0,0,.05)}
.row img{width:250px;height:444px;border-radius:16px;box-shadow:0 0 0 1px rgba(0,0,0,.06)}.t{flex:1}.h{display:flex;align-items:baseline;gap:14px;margin-bottom:14px}
.h b{font-size:34px}.h span{font-size:19px;color:#0071e3;font-weight:650}.h em{margin-left:auto;font-style:normal;font-size:14px;background:#f5f5f7;padding:6px 12px;border-radius:99px;color:#6e6e73}
.vo{font-size:21px;font-weight:600;line-height:1.3;margin-bottom:16px}.lab{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#86868b;font-weight:650;margin-top:10px}
p{font-size:16.5px;line-height:1.42;color:#3a3a3c;margin-top:4px}.wide{margin-top:28px;background:#fff;border-radius:28px;padding:26px;display:flex;gap:30px;align-items:center}.wide img{width:900px;border-radius:16px;box-shadow:0 0 0 1px rgba(0,0,0,.06)}</style></head><body>
<h1>Formation business iPhone · storyboard v1</h1><div class="sub">41 s · voix de l’avatar conservée · 4K 60 i/s · 9:16 (ci-dessous) et 16:9 · fond blanc, B-roll en cartes UI style Apple, un bruitage par élément, musique dynamique</div>
<div class="grid">${rows}</div>
<div class="wide"><img src="${b64('exemple-16x9.png')}"><div class="t"><div class="h"><b>16:9</b><span>exemple, scène 7</span></div><p>En 16:9, l’avatar reste à gauche dans un grand cadre arrondi pendant toute la vidéo, et les B-roll s’animent dans la partie droite. Les scènes 1 et 10 (avatar plein écran en 9:16) gardent le même cadre, avec la carte de texte à droite.</p></div></div>
</body></html>`;
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1800, height: 1000 }, deviceScaleFactor: 1 });
  await p.setContent(html); await p.waitForTimeout(150); await p.screenshot({ path: O + 'storyboard-planche.png', fullPage: true }); await b.close(); })();
