import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'path';
const [id, prefix, ...frames] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.jsx')});
const comp = await selectComposition({serveUrl, id, browserExecutable: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'});
for (const f of frames) {
  await renderStill({composition: comp, serveUrl, output: `/tmp/claude-0/stills/${prefix}${f}.jpg`, frame: +f, scale: 0.5, imageFormat: 'jpeg', browserExecutable: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'});
}
console.log('done');
