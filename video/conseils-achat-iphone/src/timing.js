import T from './timing.json';

// v5 : la voix French Darling n'a pas le même débit que la voix Koraly sur laquelle toute l'animation est minutée.
// Plutôt que de réécrire chaque instant, on déforme le temps : chaque mot de l'ancienne voix est une ancre
// [instant ancien, instant nouveau], et une interpolation monotone (Fritsch-Carlson) donne, pour chaque image
// de la nouvelle vidéo, l'instant correspondant de l'ancienne. Les animations restent calées sur chaque mot.
const A = T.anchors;
const xs = A.map((a) => a[1]);
const ys = A.map((a) => a[0]);
const n = xs.length;
const d = xs.slice(0, -1).map((x, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - x));
const m = xs.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
for (let i = 0; i < n - 1; i++) {
  const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
  if (s > 9) {
    const k = 3 / Math.sqrt(s);
    m[i] = k * a * d[i];
    m[i + 1] = k * b * d[i];
  }
}

export const NEW_DURATION = T.duration;

// instant de la nouvelle vidéo → instant de l'animation d'origine
export const toOld = (t) => {
  if (t <= xs[0]) return ys[0] + (t - xs[0]) * d[0];
  if (t >= xs[n - 1]) return ys[n - 1] + (t - xs[n - 1]) * d[n - 2];
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] <= t) lo = mid; else hi = mid;
  }
  const h = xs[hi] - xs[lo], u = (t - xs[lo]) / h;
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  return h00 * ys[lo] + h10 * h * m[lo] + h01 * ys[hi] + h11 * h * m[hi];
};
