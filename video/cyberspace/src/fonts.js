import {continueRender, delayRender, staticFile} from 'remotion';

// Polices Inter et Inter Display embarquées (public/fonts) : rendu identique sur n'importe quelle machine.
const FILES = [];
for (const [fam, file] of [['Inter', 'Inter'], ['Inter Display', 'InterDisplay']]) {
  for (const [w, name] of [[400, 'Regular'], [500, 'Medium'], [600, 'SemiBold'], [700, 'Bold']]) FILES.push([fam, w, `${file}-${name}.otf`]);
}

if (typeof document !== 'undefined' && typeof FontFace !== 'undefined') {
  const handle = delayRender('Chargement des polices Inter');
  Promise.all(FILES.map(([fam, w, f]) => new FontFace(fam, `url(${staticFile(`fonts/${f}`)})`, {weight: String(w)}).load().then((ff) => document.fonts.add(ff))))
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
}
