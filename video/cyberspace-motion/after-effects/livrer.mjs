// Assemble la vidéo livrée : image rendue par After Effects + mix master (sons/mix-master.wav).
//
// Usage : node after-effects/livrer.mjs <rendu-ae.mov> <9x16|16x9> <dossier de sortie>
// Produit cyberspace-motion-<format>-4k.mp4 (H.264 High, 60 i/s, AAC 320 kb/s)
//     et cyberspace-motion-<format>-apercu-720p.mp4 (léger, pour WhatsApp ou un aperçu rapide).
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const FFPROBE = process.env.FFPROBE || 'ffprobe';
const [src, fmt, dest] = process.argv.slice(2);
if (!src || !['9x16', '16x9'].includes(fmt) || !dest) {
  console.log('usage : node after-effects/livrer.mjs <rendu-ae.mov> <9x16|16x9> <dossier de sortie>');
  process.exit(1);
}
const mix = path.join(HERE, 'sons/mix-master.wav');
if (!fs.existsSync(mix)) throw new Error('sons/mix-master.wav manquant : lancer « node after-effects/sons.mjs mixer » avant');
fs.mkdirSync(dest, {recursive: true});
const run = (args) => execFileSync(FFMPEG, ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', ...args], {stdio: 'inherit'});
const vid = ['-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', '60',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709'];
const aud = ['-c:a', 'aac', '-ar', '48000', '-movflags', '+faststart', '-shortest'];

const big = path.join(dest, `cyberspace-motion-${fmt}-4k.mp4`);
run(['-i', src, '-i', mix, '-map', '0:v:0', '-map', '1:a:0', ...vid, '-preset', 'slow', '-crf', '14', '-b:a', '320k', ...aud, big]);
const small = path.join(dest, `cyberspace-motion-${fmt}-apercu-720p.mp4`);
const size = fmt === '9x16' ? '720:1280' : '1280:720';
run(['-i', big, '-vf', `scale=${size}:flags=lanczos`, ...vid, '-preset', 'medium', '-crf', '21', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', small]);

for (const f of [big, small]) {
  const info = JSON.parse(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,width,height,r_frame_rate,nb_frames', '-of', 'json', f], {encoding: 'utf8'}));
  const v = info.streams.find((s) => s.codec_type === 'video');
  const a = info.streams.find((s) => s.codec_type === 'audio');
  console.log(`${path.basename(f)} : ${v.width}×${v.height}, ${v.r_frame_rate} i/s, ${(+info.format.duration).toFixed(2)} s, son ${a ? 'oui' : 'NON'}, ${(info.format.size / 1048576).toFixed(1)} Mo`);
}
