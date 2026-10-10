// Recalage temporel : les scènes sont écrites dans l'ancienne base de temps (VO v1 ×1,065 + 0,15 s).
// On mappe le temps réel (VO Théo décalée de 0,4 s) vers cette base, mot par mot, avec une
// interpolation cubique monotone (Fritsch–Carlson) pour garder des vitesses continues.
const OLD_SPEED = 1.065, OLD_OFF = 0.15, NEW_OFF = 0.4, END = 50.5;
// [début du mot dans la VO v1, début du même mot dans la VO Théo balisée (prise yZchlJnyfEqs1pEoNnbS)]
const WORDS = [
  [0, 0.176], [0.778, 0.613], [2.101, 1.232], [3.019, 1.98], [3.634, 3.067], [4.296, 3.726], [5.004, 4.368],
  [6.304, 5.413], [7.964, 6.68], [9.125, 7.9], [10.136, 8.76], [11.401, 9.813], [12.527, 10.56], [14.663, 11.312],
  [15.36, 12.267], [16.428, 12.917], [17.612, 14.32], [18.588, 15.34], [19.923, 17.093], [20.596, 17.653], [21.595, 18.667],
  [21.908, 18.928], [22.895, 19.66], [23.742, 20.12], [24.543, 20.366], [26.111, 21.36], [26.889, 22.36], [28.259, 23.08],
  [29.431, 23.987], [30.546, 25.34], [31.625, 26.36], [32.496, 27.19], [33.785, 28.46], [35.201, 29.893], [36.165, 30.6],
  [36.908, 31.32], [38.696, 32.84], [39.671, 33.72], [40.704, 34.76], [42.063, 35.56], [43.34, 36.747], [44.35, 37.434],
  [45.778, 39.093], [46.475, 40.12], [46.939, 41.104], [48.263, 42.032], [48.773, 42.777], [50.051, 43.296], [51.037, 44.533],
  [51.746, 45.264], [52.663, 46.0],
];

const pts = [[0, 0]];
for (const [o, n] of WORDS) {
  const x = n + NEW_OFF, y = o / OLD_SPEED + OLD_OFF;
  const [px, py] = pts[pts.length - 1];
  if (x > px + 0.05 && y > py + 0.05) pts.push([x, y]);
}
pts.push([END, END]);

const n = pts.length;
const dx = [], m = [];
for (let i = 0; i < n - 1; i++) {
  dx.push(pts[i + 1][0] - pts[i][0]);
  m.push((pts[i + 1][1] - pts[i][1]) / dx[i]);
}
const tan = new Array(n);
tan[0] = m[0];
tan[n - 1] = m[n - 2];
for (let i = 1; i < n - 1; i++) tan[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
for (let i = 0; i < n - 1; i++) {
  const a = tan[i] / m[i], b = tan[i + 1] / m[i];
  const s = a * a + b * b;
  if (s > 9) {
    const k = 3 / Math.sqrt(s);
    tan[i] = k * a * m[i];
    tan[i + 1] = k * b * m[i];
  }
}

export const remap = (t) => {
  if (t <= 0) return 0;
  if (t >= END) return END;
  let i = 0;
  while (i < n - 2 && t > pts[i + 1][0]) i++;
  const h = dx[i], s = (t - pts[i][0]) / h;
  const s2 = s * s, s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * pts[i][1] + (s3 - 2 * s2 + s) * h * tan[i] + (-2 * s3 + 3 * s2) * pts[i + 1][1] + (s3 - s2) * h * tan[i + 1];
};
