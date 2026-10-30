// Plan son de la vidéo CyberSpace : un bruitage par élément animé, calé sur les instants E de src/Video.jsx.
//
// Usage : node after-effects/sons.mjs plan        écrit sons.json (repères + calques audio lus par gen.mjs)
//         node after-effects/sons.mjs preparer    sons/brut/<clé>.wav|mp3 → sons/<clé>.wav (silence de tête coupé,
//                                                 crête à -1 dBFS, 48 kHz stéréo) + la musique en sons/musique-cyberspace.wav
//         node after-effects/sons.mjs mixer       sons/*.wav → sons/mix-master.wav (-14 LUFS, -1 dBTP),
//                                                 sons/stem-musique.wav, sons/stem-bruitages.wav, sons/decalage.js
//
// plan a besoin de src/Video.jsx ; preparer et mixer n'ont besoin que de sons.json et de ffmpeg
// (variable FFMPEG pour un autre chemin).
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SONS = path.join(HERE, 'sons');
const PLAN = path.join(HERE, 'sons.json');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const r3 = (x) => Math.round(x * 1000) / 1000;

// Bruitages Epidemic Sound (crête normalisée à -1 dBFS par « preparer », d'où des gains négatifs)
const FICHIERS = {
  clic: ['45c94b43-2fb0-4970-98db-cc0fe6ea3678', 'Glassy Touch'],
  clic2: ['d637e4e8-6846-496b-84f9-19f3f7b59539', 'Simple Select'],
  tick: ['326f0f67-5371-452f-aec4-65f1c0a654b0', 'Type Zap'],
  pop: ['7cce069c-4a3a-4746-b5c8-94a653fab587', 'Bubbly Select'],
  pop2: ['19edc18a-387f-4987-9110-75d1abecc3fa', 'Bubbly Option'],
  whoosh: ['c406a00b-d4b3-42e9-ba76-707ba5174543', 'Generic Air'],
  whooshDoux: ['073cf199-3d1b-4a67-9128-a5abd13870ff', 'Soft Airy'],
  data: ['53d103e7-fdd7-4e11-8994-4f724415f262', 'Data Read Out Burst 01'],
  scan: ['7762db67-eb05-432b-8662-a9e448f9cab2', 'Data Process 03'],
  clavier: ['f94a21b7-3e53-4cf8-b3b3-4cb0ce73febd', 'Laptop Key Press Single'],
  lock: ['46216b97-17a4-48ec-a7ec-999132ef096a', 'Confirm Dull'],
  logo: ['e6ba185b-70c0-434f-919b-e05e8a578a1c', 'Stinger Soft Hit Short'],
  impact: ['6d82b75c-2d2f-40b3-9e1b-4d822c1173d5', 'Boom Low Hit'],
  trait: ['27384f5f-7e69-4f29-916d-b31071cf0112', 'Tech Data Transition 02'],
};
const MUSIQUE = {fichier: 'sons/musique-cyberspace.wav', source: '../audio/cyberspace-sound.mp3', db: 0};

function reperes(E) {
  const c = [];
  const q = (t, son, db, element) => c.push({t: r3(t), son, db, element});
  // 1 · Accroche
  q(E.construis, 'data', -15, 'Construis');
  q(E.construis + 0.03, 'tick', -22, 'HUD');
  q(E.ton, 'clic', -12, 'ton');
  q(E.morph - 0.06, 'whoosh', -15, 'morph');
  q(E.hit1, 'tick', -14, 'échange');
  q(E.logo, 'lock', -11, 'logo');
  q(E.projet, 'data', -16, 'prochain projet');
  q(E.outTxt - 0.06, 'whoosh', -15, 'sortie');
  q(E.cube, 'pop', -12, 'cube');
  q(E.cubeFill, 'pop2', -14, 'remplissage');
  // 2 · Idée / digital
  [E.open1, E.open2, E.open3].forEach((t, i) => q(t, 'tick', -13, `ouverture ${i + 1}`));
  [0.08, 0.16, 0.24].forEach((d, i) => q(E.open1 + d, 'clic2', -22, `carré ${i + 1}`));
  q(E.open3, 'scan', -17, 'cadre');
  q(E.idee, 'data', -16, 'Ton idée');
  q(E.open3 + 0.08, 'data', -24, 'repères');
  q(E.cubePop, 'pop', -12, 'cube');
  q(E.digital, 'data', -16, 'Ton digital');
  // 3 · Services connectés
  q(E.cercles - 0.06, 'whoosh', -14, 'cercles');
  q(E.cercles, 'data', -16, 'titre');
  E.pills.forEach((t, i) => q(t, i % 2 ? 'pop2' : 'pop', -13, `pastille ${i + 1}`));
  q(E.trame - 0.05, 'whoosh', -14, 'trame');
  // 4 · Typo mono
  [[E.tout, 'Tout'], [E.enun, 'en un'], [E.endroit, 'endroit']].forEach(([t, w]) => {
    q(t, 'clavier', -10, w);
    q(t, 'tick', -20, `fantôme ${w}`);
  });
  q(E.tout, 'data', -20, 'invite');
  q(E.tout + 0.05, 'tick', -22, 'micro-grille');
  [E.blocs, E.blocs + 0.24, E.blocs + 0.41].forEach((t, i) => q(t, 'tick', -14, `bloc ${i + 1}`));
  // 5 · Flowchart
  q(E.blanc + 0.06, 'whoosh', -16, 'carré');
  q(E.node1, 'pop', -12, 'nœud');
  q(E.node1 + 0.04, 'data', -18, 'étiquette nœud');
  q(E.trait, 'trait', -16, 'liaison 1');
  q(E.n2, 'pop', -13, 'Brief');
  q(E.n3, 'pop2', -13, 'Build');
  q(E.n4, 'pop', -11, 'Launch');
  q(E.n4 + 0.1, 'trait', -18, 'liaison 2');
  q(E.au, 'clic', -12, 'au');
  q(E.lanc, 'clic', -12, 'lancement');
  q(E.fusee, 'pop2', -13, 'fusée');
  q(E.pan - 0.07, 'whooshDoux', -13, 'panoramique');
  // 6 · Accompagnement
  ['Pensé', 'pour', 'ton', 'business'].forEach((w, i) => q(E.pense[i], i % 2 ? 'clic2' : 'clic', -12, w));
  q(E.wipe - 0.09, 'whoosh', -13, 'volet');
  q(E.orange, 'impact', -10, 'plein orange');
  q(E.on, 'data', -15, 'On');
  q(E.acc, 'data', -15, "t'accompagne");
  q(E.bout - 0.04, 'whoosh', -18, 'montée');
  q(E.bout, 'data', -15, "jusqu'au bout");
  // 7 · Logo
  q(E.outro - 0.06, 'whoosh', -13, 'pièces');
  q(E.outro + 0.1, 'data', -22, 'cotes');
  q(E.lock, 'logo', -8, 'logo');
  q(E.lock, 'scan', -19, 'cadre logo');
  q(E.lock + 0.08, 'clic2', -16, 'nom');
  q(E.sous, 'data', -16, 'sous-titre');
  q(E.cta, 'pop', -14, 'site');
  return c.sort((a, b) => a.t - b.t);
}

function plan() {
  const ROOT = path.resolve(HERE, '..');
  const SRC = fs.readFileSync(path.join(ROOT, 'src/Video.jsx'), 'utf8');
  const E = Function('return ' + SRC.match(/export const E = (\{[\s\S]*?\n\});/)[1])();
  const DUR = +SRC.match(/export const DURATION = ([\d.]+)/)[1];
  const cues = reperes(E);
  const sons = {};
  Object.entries(FICHIERS).forEach(([k, [id, titre]]) => (sons[k] = {epidemic: id, titre, fichier: `sons/${k}.wav`}));
  const layers = [{name: 'Musique · Cyberspace sound', file: MUSIQUE.fichier, start: 0, db: MUSIQUE.db}];
  cues.forEach((r, i) => layers.push({name: `SFX ${String(i + 1).padStart(2, '0')} · ${r.son} · ${r.element}`, file: sons[r.son].fichier, start: r.t, db: r.db, sfx: 1}));
  const json = {duree: DUR, musique: MUSIQUE, sons, reperes: cues, layers};
  fs.writeFileSync(PLAN, JSON.stringify(json, null, 1) + '\n');
  const parSon = {};
  cues.forEach((r) => (parSon[r.son] = (parSon[r.son] || 0) + 1));
  console.log(`${cues.length} bruitages → ${path.relative(ROOT, PLAN)}`, parSon);
}

const ff = (args) => execFileSync(FFMPEG, ['-hide_banner', '-nostdin', ...args], {stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26});
// ffmpeg écrit ses mesures sur stderr : spawnSync pour les lire même quand tout va bien
const mesure = (args) => {
  const p = spawnSync(FFMPEG, ['-hide_banner', '-nostdin', ...args], {encoding: 'utf8', maxBuffer: 1 << 26});
  if (p.status !== 0) throw new Error(p.stderr.slice(-2000));
  return p.stderr;
};
const crete = (f, filtre = '') => +mesure(['-i', f, '-af', (filtre ? filtre + ',' : '') + 'volumedetect', '-f', 'null', '-']).match(/max_volume: (-?[\d.]+) dB/)[1];
const loudness = (f) => {
  const s = mesure(['-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const bloc = s.slice(s.lastIndexOf('Summary:'));
  return {I: +bloc.match(/I:\s+(-?[\d.]+|-inf) LUFS/)[1], TP: +((bloc.match(/Peak:\s+(-?[\d.]+|-inf) dBFS/) || [])[1] ?? NaN)};
};
const SORTIE = ['-ar', '48000', '-ac', '2', '-c:a', 'pcm_s24le'];

function lirePlan() {
  return JSON.parse(fs.readFileSync(PLAN, 'utf8'));
}

function preparer() {
  const p = lirePlan();
  const brut = path.join(SONS, 'brut');
  fs.mkdirSync(SONS, {recursive: true});
  Object.entries(p.sons).forEach(([k, s]) => {
    const src = ['wav', 'mp3', 'aif', 'aiff'].map((x) => path.join(brut, `${k}.${x}`)).find((f) => fs.existsSync(f));
    if (!src) throw new Error(`bruitage manquant : sons/brut/${k}.wav (Epidemic ${s.epidemic}, « ${s.titre} »)`);
    const coupe = 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.004';
    const pic = crete(src, coupe);
    const out = path.join(HERE, s.fichier);
    ff(['-y', '-i', src, '-af', `${coupe},volume=${r3(-1 - pic)}dB`, ...SORTIE, out]);
    console.log(`${k.padEnd(11)} ${s.titre.padEnd(26)} crête ${pic} dB → -1 dBFS`);
  });
  const mus = path.join(HERE, p.musique.fichier);
  ff(['-y', '-i', path.resolve(HERE, p.musique.source), ...SORTIE, mus]);
  console.log('musique    →', p.musique.fichier);
}

// Bus des bruitages : un flux par repère, retardé et atténué, sommé sans normalisation
function bus(p, decalage, out) {
  const args = ['-y'];
  const f = [];
  p.reperes.forEach((r, i) => {
    args.push('-i', path.join(HERE, p.sons[r.son].fichier));
    const ms = Math.round(r.t * 1000);
    f.push(`[${i}:a]volume=${r3(r.db + decalage)}dB,adelay=${ms}|${ms}[s${i}]`);
  });
  const n = p.reperes.length;
  f.push(`${p.reperes.map((_, i) => `[s${i}]`).join('')}amix=inputs=${n}:normalize=0:duration=longest,apad,atrim=0:${p.duree}[o]`);
  ff([...args, '-filter_complex', f.join(';'), '-map', '[o]', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_f32le', out]);
}

function mixer() {
  const p = lirePlan();
  const tmp = path.join(SONS, 'tmp');
  fs.mkdirSync(tmp, {recursive: true});
  const mus = path.join(tmp, 'musique.wav');
  const MDB = p.musique.db;
  ff(['-y', '-i', path.join(HERE, p.musique.fichier), '-af', `volume=${MDB}dB,apad,atrim=0:${p.duree}`, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_f32le', mus]);
  // 1) Équilibre : le bus des bruitages vise 7 LU sous la musique (mesures EBU R128 à seuil relatif)
  const brut = path.join(tmp, 'bruitages-0.wav');
  bus(p, 0, brut);
  const Lm = loudness(mus).I, Lb = loudness(brut).I;
  const CIBLE = -7;
  const decalage = r3(Math.max(-10, Math.min(10, Lm + CIBLE - Lb)));
  const sfx = path.join(tmp, 'bruitages.wav');
  bus(p, decalage, sfx);
  console.log(`musique ${Lm} LUFS · bruitages ${Lb} LUFS → décalage des bruitages ${decalage} dB (cible ${CIBLE} LU sous la musique)`);
  // 2) Somme puis loudnorm en deux passes, linéaire (gain fixe, aucune compression)
  const somme = path.join(tmp, 'somme.wav');
  ff(['-y', '-i', mus, '-i', sfx, '-filter_complex', '[0:a][1:a]amix=inputs=2:normalize=0:duration=first[o]', '-map', '[o]', '-c:a', 'pcm_f32le', somme]);
  const s = mesure(['-i', somme, '-af', 'loudnorm=I=-14:TP=-1:LRA=11:print_format=json', '-f', 'null', '-']);
  const m = JSON.parse(s.slice(s.lastIndexOf('{'), s.lastIndexOf('}') + 1));
  const ln = `loudnorm=I=-14:TP=-1:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  const master = path.join(SONS, 'mix-master.wav');
  ff(['-y', '-i', somme, '-af', `${ln},atrim=0:${p.duree}`, ...SORTIE, master]);
  // Gain appliqué par le master, reporté sur les stems pour qu'ils se recombinent exactement
  const gain = r3(-14 - +m.input_i);
  ff(['-y', '-i', mus, '-af', `volume=${gain}dB,alimiter=limit=0.89:level=false`, ...SORTIE, path.join(SONS, 'stem-musique.wav')]);
  ff(['-y', '-i', sfx, '-af', `volume=${gain}dB,alimiter=limit=0.89:level=false`, ...SORTIE, path.join(SONS, 'stem-bruitages.wav')]);
  fs.writeFileSync(path.join(SONS, 'decalage.js'), `// Écrit par sons.mjs mixer : gain ajouté à chaque bruitage dans After Effects\nvar CS_SFX_OFFSET = ${decalage};\n`);
  const L = loudness(master);
  console.log(`master ${L.I} LUFS, crête vraie ${L.TP} dBTP (avant ${m.input_i} LUFS / ${m.input_tp} dBTP, gain ${gain} dB) → sons/mix-master.wav`);
  fs.rmSync(tmp, {recursive: true, force: true});
}

const cmd = process.argv[2];
if (cmd === 'plan') plan();
else if (cmd === 'preparer') preparer();
else if (cmd === 'mixer') mixer();
else {
  console.log('usage : node after-effects/sons.mjs plan | preparer | mixer');
  process.exit(1);
}
