// Rend des images de contrôle des données After Effects (émulateur canvas) : node after-effects/apercu/rendu.mjs 9x16 out/emu 0,1.5,3
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const [fmt = '9x16', outDir = 'out/emu', list = ''] = process.argv.slice(2);
const frames = list ? list.split(',').map(Number) : Array.from({length: 40}, (_, i) => i * 30);
fs.mkdirSync(outDir, {recursive: true});
const {chromium} = require('playwright');
const b = await chromium.launch({args: ['--allow-file-access-from-files']});
const p = await b.newPage();
p.on('console', (m) => console.log('[page]', m.text()));
p.on('pageerror', (e) => console.log('[erreur page]', e.message));
await p.goto('file://' + path.join(HERE, 'emulateur.html'));
await p.evaluate((src) => load(src), '../data-' + fmt + '.js');
for (const f of frames) {
  const url = await p.evaluate((t) => render(t, 0.25), f / 60);
  fs.writeFileSync(path.join(outDir, `${fmt}-${String(f).padStart(4, '0')}.png`), Buffer.from(url.split(',')[1], 'base64'));
}
await b.close();
console.log('ok', frames.length);
