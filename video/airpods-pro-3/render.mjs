// Rendu d'images fixes ou de séquences PNG avec Chromium (Playwright).
// node render.mjs stills <w> <h> <outdir> t1 t2 ...
// node render.mjs seq <w> <h> <outdir> <fps> [t0] [t1] [samples]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const TYPES = { '.png': 'image/png', '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };
// LAYER_DIR : dossier de PNG RGBA (rendu Blender) servi sous /layer/
const LAYER_DIR = process.env.LAYER_DIR ? path.resolve(process.env.LAYER_DIR) : null;
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const base = LAYER_DIR && u.startsWith('/layer/') ? LAYER_DIR : ROOT;
  const p = path.join(base, base === ROOT ? u : u.slice('/layer/'.length));
  if (!p.startsWith(base) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const [mode, w, h, outdir, ...rest] = process.argv.slice(2);
const W = +w, H = +h;
fs.mkdirSync(outdir, { recursive: true });
const handle = process.env.HANDLE || '@TON_HANDLE';

const args = ['--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ args, executablePath: process.env.CHROME || undefined });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('console', (m) => { if (m.type() === 'error') console.error('page:', m.text()); });
page.on('pageerror', (e) => console.error('pageerror:', e.message));
await page.goto(`http://localhost:${port}/scene.html`);
await page.waitForFunction(() => window.sceneReady === true, null, { timeout: 60000 });
await page.evaluate(([a, b, c]) => window.setup(a, b, c), [W, H, handle]);
if (LAYER_DIR) await page.evaluate((fps) => window.useLayer('/layer', fps), +(process.env.LAYER_FPS || 60));

async function shot(t, file) {
  await page.evaluate((tt) => window.renderFrame(tt), t);
  await page.screenshot({ path: file, type: 'png', clip: { x: 0, y: 0, width: W, height: H } });
}

if (mode === 'stills') {
  for (const t of rest) await shot(+t, path.join(outdir, `t${(+t).toFixed(2)}.png`));
} else {
  const fps = +rest[0];
  const t0 = rest[1] !== undefined ? +rest[1] : 0;
  const t1 = rest[2] !== undefined ? +rest[2] : 11.1;
  const n0 = Math.round(t0 * fps), n1 = Math.round(t1 * fps);
  const start = Date.now();
  for (let n = n0; n < n1; n++) {
    await shot(n / fps, path.join(outdir, `f${String(n).padStart(5, '0')}.png`));
    if (n % 30 === 0) console.log(`frame ${n}/${n1} ${((Date.now() - start) / 1000).toFixed(0)}s`);
  }
}
await browser.close();
server.close();
