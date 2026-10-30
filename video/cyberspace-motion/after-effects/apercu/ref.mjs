// Images de référence Remotion (mêmes instants) : node after-effects/apercu/ref.mjs CyberSpaceVertical out/ref 30,120
import path from 'node:path';
import fs from 'node:fs';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
const [id = 'CyberSpaceVertical', outDir = 'out/ref', list = ''] = process.argv.slice(2);
const frames = list.split(',').map(Number);
fs.mkdirSync(outDir, {recursive: true});
const CLOUD = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const browserExecutable = fs.existsSync(CLOUD) ? CLOUD : undefined;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.jsx')});
const composition = await selectComposition({serveUrl, id, browserExecutable});
const tag = id === 'CyberSpaceVertical' ? '9x16' : '16x9';
for (const f of frames) {
  await renderStill({composition, serveUrl, frame: f, output: path.join(outDir, `${tag}-${String(f).padStart(4, '0')}.png`), scale: 0.5, browserExecutable});
}
console.log('ok', frames.length);
