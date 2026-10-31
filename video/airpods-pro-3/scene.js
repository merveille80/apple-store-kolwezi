// Spec ad « All new AirPods Pro 3 » : scène 3D (three.js) + typo + fonds.
// window.setup(w, h) puis window.renderFrame(t) ; t en secondes (0 → DUR).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { APPLE_PATH } from './apple-logo.js';

export const DUR = 11.1;
// Bornes des beats (brief §3)
const B = { A: 0, B: 1.4, C: 1.9, D: 2.4, E: 3.8, F: 4.4, G: 5.8, H: 7.0, I: 8.8, J: 10.0, END: 11.1 };
window.BEATS = B;

const GRAY = '#E8E8ED';
const INK = '#1d1d1f';
const GREEN = new THREE.Color('#39ff6a');

// ---------- utilitaires ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eout = (x) => 1 - Math.pow(1 - x, 3);
const eexpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const ebackout = (x) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };

let W = 1080, H = 1920, M = 1080;
const stage = document.getElementById('stage');
const bg = document.getElementById('bg');
const glc = document.getElementById('gl');
const fx = document.getElementById('fx');
const typeLayer = document.getElementById('type');
const bgx = bg.getContext('2d');
const fxx = fx.getContext('2d');

// ---------- rendu ----------
const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
scene.environmentIntensity = 0.62;

const camera = new THREE.PerspectiveCamera(30, 9 / 16, 0.1, 200);
const key = new THREE.DirectionalLight(0xffffff, 2.1);
key.position.set(-4, 8, 6);
scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff, 0.8);
rim.position.set(6, 3, -5);
scene.add(rim);
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a90, 0.35));

// ---------- matières ----------
const matWhite = () => new THREE.MeshPhysicalMaterial({ color: 0xf6f6f7, roughness: 0.2, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06 });
const mTip = new THREE.MeshPhysicalMaterial({ color: 0xe6e6e8, roughness: 0.55, metalness: 0, sheen: 0.4, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xffffff) });
const mMesh = new THREE.MeshStandardMaterial({ color: 0x2c2c2f, roughness: 0.9, metalness: 0.0 });
const mDark = new THREE.MeshStandardMaterial({ color: 0x3a3a3d, roughness: 0.6 });
const mInner = new THREE.MeshPhysicalMaterial({ color: 0xe9e9ec, roughness: 0.35, clearcoat: 0.4 });
function wellTex() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, '#6d6d72'); g.addColorStop(0.55, '#9a9a9f'); g.addColorStop(0.85, '#cfcfd3'); g.addColorStop(1, 'rgba(233,233,236,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const mWell = new THREE.MeshStandardMaterial({ map: wellTex(), transparent: true, roughness: 0.6 });
const mLed = new THREE.MeshStandardMaterial({ color: 0x0a2a12, emissive: GREEN, emissiveIntensity: 2.2, roughness: 0.3 });
const mSensor = new THREE.MeshPhysicalMaterial({ color: 0xdcdcdf, roughness: 0.45, clearcoat: 0.3, emissive: GREEN, emissiveIntensity: 0 });

// Matière coupée en y local (pour séparer couvercle / base d'un même volume arrondi)
function cutMaterial(cut, side) {
  const m = matWhite();
  m.side = THREE.DoubleSide;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uCut = { value: cut };
    sh.uniforms.uSide = { value: side };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vLY;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLY = position.y;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vLY;\nuniform float uCut;\nuniform float uSide;')
      .replace('void main() {', 'void main() {\n  if ((vLY - uCut) * uSide < 0.0) discard;');
  };
  m.customProgramCacheKey = () => 'cut' + cut + '_' + side;
  return m;
}

function roundedRectShape(w, h, r, rz) {
  return ellipseRectShape(w, h, r, rz === undefined ? r : rz);
}
// Contour sans point dupliqué (évite les trous de triangulation)
function ellipseRectShape(w, h, rx, ry, seg = 40) {
  const pts = [];
  const cs = [[w / 2 - rx, h / 2 - ry, 0], [-w / 2 + rx, h / 2 - ry, Math.PI / 2], [-w / 2 + rx, -h / 2 + ry, Math.PI], [w / 2 - rx, -h / 2 + ry, Math.PI * 1.5]];
  for (const [cx, cy, a0] of cs) {
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (i / seg) * (Math.PI / 2);
      pts.push(new THREE.Vector2(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry));
    }
  }
  return new THREE.Shape(pts);
}

// ---------- boîtier ----------
const CASE = { w: 6.06, h: 4.52, d: 2.17, r: 1.75, bs: 0.62, bt: 0.78 };
CASE.cut = CASE.h / 2 - 1.55; // ligne de séparation couvercle / base

function makeCase() {
  const { w, h, d, r, bs, bt } = CASE;
  const shape = roundedRectShape(w - 2 * bs, h - 2 * bs, r - bs);
  const core = d - 2 * bt;
  const geo = new THREE.ExtrudeGeometry(shape, { depth: core, bevelEnabled: true, bevelThickness: bt, bevelSize: bs, bevelSegments: 28, curveSegments: 64 });
  geo.translate(0, 0, -core / 2);
  geo.computeVertexNormals();

  const root = new THREE.Group();
  const gap = 0.012;
  const base = new THREE.Mesh(geo, cutMaterial(CASE.cut - gap, -1));
  root.add(base);

  // charnière à l'arrière, en haut de la base
  const hinge = new THREE.Group();
  hinge.position.set(0, CASE.cut, -d / 2 + 0.25);
  root.add(hinge);
  const lid = new THREE.Mesh(geo, cutMaterial(CASE.cut + gap, 1));
  lid.position.set(0, -CASE.cut, d / 2 - 0.25);
  hinge.add(lid);

  // capots intérieurs (dessus de la base, dessous du couvercle)
  const capShape = ellipseRectShape(w - 0.06, d - 0.06, bs * 0.98, bt * 0.98);
  const capGeo = new THREE.ShapeGeometry(capShape, 48);
  const capBase = new THREE.Mesh(capGeo, mInner);
  capBase.rotation.x = -Math.PI / 2;
  capBase.position.y = CASE.cut - gap - 0.002;
  root.add(capBase);
  const capLid = new THREE.Mesh(capGeo, mInner);
  capLid.rotation.x = Math.PI / 2;
  capLid.position.set(0, CASE.cut + gap + 0.002, 0);
  lid.add(capLid); // repère du couvercle = repère du boîtier
  capLid.position.set(0, CASE.cut + gap + 0.002, 0);

  // logements des écouteurs
  for (const sx of [-1, 1]) {
    const well = new THREE.Mesh(new THREE.CircleGeometry(1, 48), mWell);
    well.scale.set(0.95, 0.72, 1);
    well.rotation.x = -Math.PI / 2;
    well.position.set(sx * 1.42, CASE.cut - gap, 0.05);
    well.position.y += 0.004;
    root.add(well);
  }

  // LED avant
  const led = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.06, 6, 16), mLed);
  led.rotation.z = Math.PI / 2;
  led.position.set(0, CASE.cut - 0.62, d / 2 + 0.002);
  led.scale.set(1, 1, 0.35);
  root.add(led);

  // USB-C + haut-parleur (dessous)
  const usb = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.08, 0.3, 4, 0.04), mDark);
  usb.position.set(0, -h / 2 + 0.005, 0);
  root.add(usb);
  for (let i = 0; i < 6; i++) {
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), mDark);
    hole.rotation.x = Math.PI / 2;
    hole.position.set(-1.9 + i * 0.16, -h / 2 + 0.003, 0.0);
    root.add(hole);
    const hole2 = hole.clone();
    hole2.position.x = 1.1 + i * 0.16;
    root.add(hole2);
  }
  // passant de dragonne (côté droit)
  const loop = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.12, 0.34, 3, 0.012), mDark);
  loop.position.set(w / 2 - 0.004, -h / 2 + 1.2, 0);
  root.add(loop);

  root.userData = { hinge, led };
  return root;
}

// ---------- écouteur ----------
function tipGeometry(s = 1) {
  const pts = [
    [0.0, 0.66], [0.2, 0.655], [0.38, 0.62], [0.52, 0.55], [0.63, 0.44], [0.71, 0.3], [0.75, 0.15],
    [0.75, 0.04], [0.7, -0.02], [0.58, -0.04], [0.42, -0.02], [0.36, -0.12], [0.34, -0.3], [0.0, -0.3],
  ].reverse().map(([x, y]) => new THREE.Vector2(x * s, y * s));
  const g = new THREE.LatheGeometry(pts, 72);
  g.computeVertexNormals();
  return g;
}

function makeTip(s = 1) {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(tipGeometry(s), mTip);
  g.add(shell);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.17 * s, 32), mMesh);
  hole.rotation.x = -Math.PI / 2;
  hole.position.y = 0.663 * s;
  g.add(hole);
  return g;
}

function makeBud() {
  const bud = new THREE.Group();
  const white = matWhite();
  // tête
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.9, 96, 64), white);
  head.scale.set(1.0, 0.86, 0.8);
  bud.add(head);
  // embout (orienté vers +x et un peu vers l'arrière)
  const tip = makeTip(0.92);
  tip.rotation.z = -Math.PI / 2;
  tip.rotation.y = 0.45;
  tip.position.set(0.62, 0.05, -0.28);
  bud.add(tip);
  // grilles (micro extérieur + évent)
  const vent1 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 16), mMesh);
  vent1.scale.set(1.3, 0.55, 0.25);
  vent1.position.set(-0.3, 0.74, 0.12);
  vent1.lookAt(vent1.position.clone().multiplyScalar(3));
  bud.add(vent1);
  const vent2 = new THREE.Mesh(new THREE.SphereGeometry(0.065, 24, 12), mMesh);
  vent2.scale.set(1.5, 0.7, 0.3);
  vent2.position.set(-0.62, -0.1, 0.5);
  vent2.lookAt(vent2.position.clone().multiplyScalar(3));
  bud.add(vent2);
  // tige
  const stemG = new THREE.Group();
  stemG.position.set(-0.2, -0.45, 0.12);
  stemG.rotation.z = -0.1;
  stemG.rotation.x = 0.12;
  bud.add(stemG);
  const stem = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 1.7, 16, 48), white);
  stem.scale.set(1, 1, 0.8);
  stem.position.y = -1.0;
  stemG.add(stem);
  // capteur de force (léger creux sur la face avant de la tige)
  const sensor = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.42, 10, 24), mSensor);
  sensor.scale.set(1, 1, 0.18);
  sensor.position.set(0, -0.72, 0.217);
  stemG.add(sensor);
  // micro en bout de tige
  const mic = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.08, 6, 16), mMesh);
  mic.scale.set(1, 1, 0.3);
  mic.position.set(0, -1.98, 0.17);
  mic.rotation.x = 0.5;
  stemG.add(mic);
  bud.userData = { sensor, stemG };
  return bud;
}

// ---------- ombre de contact ----------
function shadowTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(0,0,0,0.55)');
  g.addColorStop(0.45, 'rgba(0,0,0,0.22)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
const SH_TEX = shadowTex();
function makeShadow(sx, sz) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: SH_TEX, transparent: true, depthWrite: false, opacity: 1 }));
  m.rotation.x = -Math.PI / 2;
  m.scale.set(sx, sz, 1);
  m.renderOrder = -1;
  return m;
}

// ---------- halo vert (sprites additifs) ----------
function glowSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(120,255,150,1)');
  g.addColorStop(0.25, 'rgba(57,255,106,0.55)');
  g.addColorStop(1, 'rgba(57,255,106,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
  return s;
}

// ---------- objets de la scène ----------
const caseObj = makeCase();
scene.add(caseObj);
const caseShadow = makeShadow(8, 3.6);
scene.add(caseShadow);
const ledGlow = glowSprite();
caseObj.userData.led.add(ledGlow);
ledGlow.scale.set(0.32, 0.32, 1);

const budL = makeBud();
const budR = makeBud();
budR.scale.x = -1;
scene.add(budL, budR);
const budShadowL = makeShadow(2.4, 1.6);
const budShadowR = makeShadow(2.4, 1.6);
scene.add(budShadowL, budShadowR);
const sensorGlow = glowSprite();
budL.userData.sensor.add(sensorGlow);
sensorGlow.scale.set(0.7, 1.5, 1);

const tipSizes = [1.0, 0.9, 0.8, 0.7]; // L, M, S, XS
const tips = tipSizes.map((s) => { const t = makeTip(s); scene.add(t); return t; });
const tipShadows = tipSizes.map((s) => { const sh = makeShadow(2.2 * s, 1.2 * s); scene.add(sh); return sh; });

const ALL = [caseObj, caseShadow, budL, budR, budShadowL, budShadowR, ...tips, ...tipShadows];

// ---------- caméra : cadrage indépendant du format ----------
// S = taille (unités 3D) couverte par la plus petite dimension de l'image.
function frame(target, dir, S, roll = 0) {
  const vfov = THREE.MathUtils.degToRad(camera.fov);
  const aspect = W / H;
  let dist;
  if (aspect < 1) {
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    dist = S / 2 / Math.tan(hfov / 2);
  } else {
    dist = S / 2 / Math.tan(vfov / 2);
  }
  const d = new THREE.Vector3(...dir).normalize();
  camera.position.set(target[0] + d.x * dist, target[1] + d.y * dist, target[2] + d.z * dist);
  camera.up.set(Math.sin(roll), Math.cos(roll), 0);
  camera.lookAt(target[0], target[1], target[2]);
}
const portrait = () => W / H < 1;

// ---------- fonds ----------
function drawRings(t, mode, alpha = 1) {
  // mode 0 = intro (blanc → cyan → bleu → marine → noir), 1 = clair (blanc / cyan doux)
  const cx = W / 2, cy = H / 2;
  const R = Math.hypot(W, H) / 2;
  // respirations sur la grosse caisse (128 BPM)
  const beat = 60 / 128;
  const ph = (t % beat) / beat;
  const pulse = Math.exp(-ph * 5.5);
  bgx.globalAlpha = alpha;
  const g = bgx.createRadialGradient(cx, cy, 0, cx, cy, R);
  if (mode === 0) {
    const k = 0.04 * pulse;
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.16 + k, '#f3fdff');
    g.addColorStop(0.3 + k, '#5fd8ff');
    g.addColorStop(0.47 + k, '#1e7bff');
    g.addColorStop(0.66 + k, '#0b2a78');
    g.addColorStop(0.84, '#03081e');
    g.addColorStop(1, '#000000');
  } else {
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, '#f2fbff');
    g.addColorStop(0.62, '#bfeeff');
    g.addColorStop(1, '#7fd3f5');
  }
  bgx.fillStyle = g;
  bgx.fillRect(0, 0, W, H);
  // anneaux concentriques (onde sonore) qui s'éloignent
  const n = 14;
  const spacing = R / n;
  const drift = ((t / beat) * 0.5 % 1) * spacing;
  bgx.lineWidth = Math.max(1, M * 0.003);
  for (let i = 0; i < n + 1; i++) {
    const r = i * spacing + drift + spacing * 0.4 * pulse;
    const fade = clamp(r / (R * 0.18)) * (1 - clamp(r / R));
    const a = (mode === 0 ? 0.16 : 0.22) * fade * (0.7 + 0.6 * pulse);
    bgx.strokeStyle = mode === 0 ? `rgba(255,255,255,${a})` : `rgba(40,150,210,${a})`;
    bgx.beginPath();
    bgx.arc(cx, cy, r, 0, Math.PI * 2);
    bgx.stroke();
  }
  bgx.globalAlpha = 1;
}
function fillBg(color, alpha = 1) {
  bgx.globalAlpha = alpha;
  bgx.fillStyle = color;
  bgx.fillRect(0, 0, W, H);
  bgx.globalAlpha = 1;
}

// ---------- typo ----------
const texts = {};
function mkText(id, html, weight, color) {
  const el = document.createElement('div');
  el.className = 't';
  el.innerHTML = html;
  el.style.fontWeight = weight;
  el.style.color = color;
  typeLayer.appendChild(el);
  texts[id] = el;
  return el;
}
mkText('allnew', 'All new', 500, INK);
mkText('title', 'AirPods Pro 3', 700, INK);
mkText('rebuilt', '', 700, INK);
mkText('fit', 'Fit, finally figured out.', 700, INK);
mkText('touch', '<span class="w" id="w-touch">Touch</span><span class="w" id="w-control">&nbsp;control</span>', 700, INK);
mkText('disc', '', 400, 'rgba(255,255,255,0.78)');
const logoEl = document.createElement('div');
logoEl.className = 't';
logoEl.innerHTML = `<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#fff" d="${APPLE_PATH}"/></svg>`;
typeLayer.appendChild(logoEl);

let HANDLE = '@Dgit';
function place(el, { x, y, size, align = 'center', vAlign = 'center', opacity = 1, blur = 0, dx = 0, dy = 0, scale = 1, sy = 1 }) {
  el.style.fontSize = size + 'px';
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  const ax = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0%';
  const ay = vAlign === 'center' ? '-50%' : vAlign === 'bottom' ? '-100%' : '0%';
  el.style.transform = `translate(${ax}, ${ay}) translate(${dx}px, ${dy}px) scale(${scale}, ${scale * sy})`;
  el.style.transformOrigin = align === 'right' ? '100% 50%' : align === 'left' ? '0% 50%' : '50% 50%';
  el.style.opacity = opacity;
  el.style.filter = blur > 0.05 ? `blur(${blur}px)` : 'none';
  el.style.display = opacity <= 0.001 ? 'none' : 'block';
}
function hideAll() {
  for (const k in texts) texts[k].style.display = 'none';
  logoEl.style.display = 'none';
}
// entrée « flou + glissé » façon keynote
function blurIn(t, t0, dur = 0.35, dist = 0.04) {
  const k = eexpo(prog(t, t0, t0 + dur));
  return { opacity: clamp(k * 1.4), blur: (1 - k) * M * 0.02, dy: (1 - k) * M * dist };
}

// ---------- état par beat ----------
function hideObjects() { for (const o of ALL) o.visible = false; }

function resetBud(b) {
  b.position.set(0, 0, 0);
  b.rotation.set(0, 0, 0);
  b.userData.sensor.material.emissiveIntensity = 0;
  sensorGlow.material.opacity = 0;
}

function setCase(t) {
  // C + D : boîtier
  const tc = t - B.C;
  caseObj.visible = caseShadow.visible = true;
  const appear = eout(prog(t, B.C, B.C + 0.35));
  const floatY = Math.sin(t * 2.2) * 0.08;
  caseObj.position.set(0, -0.2 + floatY + (1 - appear) * -0.5, 0);
  caseObj.rotation.set(0.05, lerp(-0.32, -0.12, eio(prog(t, B.C, B.E))), 0);
  const s = lerp(0.9, 1, appear);
  caseObj.scale.setScalar(s);
  caseShadow.position.set(0, -CASE.h / 2 - 1.1, 0);
  caseShadow.material.opacity = 0.55 * appear;
  // couvercle
  const open = eio(prog(t, B.D, B.D + 0.42));
  caseObj.userData.hinge.rotation.x = -open * THREE.MathUtils.degToRad(108);
  // LED
  const ledOn = 0.6 + 0.4 * Math.sin(tc * 6.0) ** 2;
  mLed.emissiveIntensity = 2.4 * ledOn;
  ledGlow.material.opacity = 0.65 * ledOn * appear;
  // écouteurs dans le boîtier puis qui s'élèvent
  const lift = eio(prog(t, B.D + 0.28, B.D + 1.0));
  for (const [b, sx, sh] of [[budL, -1, budShadowL], [budR, 1, budShadowR]]) {
    resetBud(b);
    b.visible = open > 0.05;
    sh.visible = false;
    const seatY = CASE.cut - 0.05;
    b.position.set(caseObj.position.x + sx * 1.42 * s, caseObj.position.y + seatY * s + lift * 3.4 + Math.sin(t * 2.6 + sx) * 0.05 * lift, 0.05);
    b.position.x += sx * lift * 0.55;
    // dans le boîtier : embout vers l'arrière ; en l'air : léger pivot vers la caméra
    b.rotation.set(lift * 0.1, (sx < 0 ? 1 : -1) * (Math.PI / 2 - 0.2) * (1 - lift * 0.55), sx * lift * 0.12);
    b.scale.set(sx < 0 ? s : -s, s, s);
  }
  // caméra
  const camUp = eio(prog(t, B.D, B.D + 0.9));
  frame([0, lerp(0, 1.3, camUp), 0], [0, lerp(0.22, 0.38, camUp), 1], lerp(9.6, 11.2, camUp));
}

function setPair(t, t0, t1, macro) {
  // F (macro, rotation lente + parallaxe) et I (héros, face caméra)
  const k = prog(t, t0, t1);
  for (const [b, sx, sh] of [[budL, -1, budShadowL], [budR, 1, budShadowR]]) {
    resetBud(b);
    b.visible = true;
    sh.visible = true;
    b.scale.set(sx < 0 ? 1 : -1, 1, 1);
    const bob = Math.sin(t * 2.4 + sx * 1.3) * 0.07;
    if (macro) {
      b.position.set(sx * lerp(1.15, 1.3, k), 0.9 + bob + sx * 0.12, sx * lerp(0.25, -0.25, eio(k)));
      b.rotation.set(0.08, (sx < 0 ? -1 : 1) * lerp(0.95, 0.35, eio(k)), sx * -0.08);
    } else {
      b.position.set(sx * 1.25, 0.95 + bob, 0);
      b.rotation.set(0.04, (sx < 0 ? -1 : 1) * lerp(0.42, 0.3, eio(k)), sx * -0.05);
    }
    sh.position.set(b.position.x, -2.6, b.position.z);
    sh.material.opacity = 0.45;
  }
  if (macro) {
    const a = lerp(-0.22, 0.22, eio(k));
    frame([0, 0.15, 0], [Math.sin(a) * 1, 0.18, Math.cos(a)], lerp(5.4, 4.8, eio(k)));
  } else {
    const p = eout(k);
    frame([0, -0.2, 0], [0, 0.08, 1], lerp(6.6, 6.0, p));
  }
}

function setFit(t) {
  const k = prog(t, B.G, B.H);
  const P = portrait();
  // écouteur gauche, de profil (embout vers la droite)
  resetBud(budL);
  budL.visible = budShadowL.visible = true;
  budL.scale.set(1, 1, 1);
  const bx = P ? -2.25 : -3.1;
  budL.position.set(bx, 1.05 + Math.sin(t * 2.2) * 0.04, 0);
  budL.rotation.set(0.05, -0.15, 0.0);
  budShadowL.position.set(bx, -1.75, 0);
  budShadowL.material.opacity = 0.4;
  // 4 embouts L → XS, alignés, qui se posent un par un (1 tick chacun)
  const x0 = P ? -0.55 : -1.0;
  const step = P ? 1.25 : 1.55;
  tips.forEach((tp, i) => {
    const s = tipSizes[i];
    const ti = B.G + 0.12 + i * 0.13;
    const a = ebackout(prog(t, ti, ti + 0.32));
    tp.visible = tipShadows[i].visible = prog(t, ti, ti + 0.01) > 0;
    tp.position.set(x0 + i * step - (1 - s) * 0.3, -0.85 + (1 - clamp(a)) * 0.8, 0);
    tp.rotation.set(0.12, 0, 0);
    tp.scale.setScalar(s * Math.max(0.001, a) / s);
    tipShadows[i].position.set(tp.position.x, -1.42, 0);
    tipShadows[i].material.opacity = 0.35 * clamp(a);
  });
  const drift = eio(k);
  frame([P ? 0.15 : 0.2, 0.0, 0], [lerp(-0.08, 0.06, drift), 0.28, 1], P ? lerp(7.9, 7.5, drift) : lerp(5.6, 5.3, drift));
}

function setTouch(t) {
  const k = prog(t, B.H, B.I);
  resetBud(budL);
  budL.visible = true;
  budL.scale.set(1, 1, 1);
  // tige face caméra, capteur au centre
  budL.position.set(0, 0, 0);
  budL.rotation.set(-0.12, lerp(0.18, 0.05, eio(k)), 0.1);
  budL.updateMatrixWorld(true);
  const sensor = budL.userData.sensor;
  const glow = eout(prog(t, B.H + 0.45, B.H + 0.9));
  const breathe = 0.85 + 0.15 * Math.sin((t - B.H) * 7);
  sensor.material.emissiveIntensity = 0.75 * glow * breathe;
  sensorGlow.material.opacity = 0.3 * glow * breathe;
  const p = new THREE.Vector3();
  sensor.getWorldPosition(p);
  const P = portrait();
  const off = P ? -0.62 : -0.75;
  frame([p.x - off, p.y + lerp(0.25, 0.1, eio(k)), p.z], [-0.12, 0.05, 1], lerp(P ? 2.5 : 1.9, P ? 2.15 : 1.65, eout(k)), 0);
}

// ---------- typographie par beat ----------
function setType(t) {
  hideAll();
  const P = portrait();
  if (t < B.B) {
    // A : titre
    const k1 = blurIn(t, 0.05, 0.4, 0.025);
    const k2 = blurIn(t, 0.15, 0.45, 0.035);
    const out = 1 - prog(t, B.B - 0.12, B.B);
    const breathe = 1 + 0.012 * Math.exp(-((t % (60 / 128)) / (60 / 128)) * 5);
    place(texts.allnew, { x: W / 2, y: H / 2 - M * 0.085, size: M * 0.05, ...k1, opacity: k1.opacity * out, scale: breathe });
    place(texts.title, { x: W / 2, y: H / 2 + M * 0.0, size: M * 0.125, ...k2, opacity: k2.opacity * out, scale: breathe });
  } else if (t >= B.E && t < B.F) {
    // E : claim, mot par mot ; « up » arrive en flou de mouvement
    const words = ['Rebuilt', 'from', 'the', 'ground', 'up'];
    const html = words.map((w, i) => `<span class="w" data-i="${i}">${w}</span>`);
    const el = texts.rebuilt;
    if (!el.dataset.ok) {
      el.innerHTML = html.slice(0, 2).join(' ') + '<br class="pbr"> ' + html.slice(2).join(' ');
      el.style.textAlign = 'center';
      el.style.lineHeight = '1.04';
      el.dataset.ok = 1;
    }
    el.querySelector('.pbr').style.display = P ? 'inline' : 'none';
    place(el, { x: W / 2, y: H / 2, size: P ? M * 0.105 : M * 0.085, opacity: 1 });
    el.querySelectorAll('.w').forEach((sp) => {
      const i = +sp.dataset.i;
      const t0 = B.E + 0.02 + i * 0.07;
      if (i < 4) {
        const k = eexpo(prog(t, t0, t0 + 0.22));
        sp.style.opacity = clamp(k * 1.5);
        sp.style.filter = `blur(${(1 - k) * M * 0.012}px)`;
        sp.style.transform = `translateY(${(1 - k) * M * 0.03}px)`;
      } else {
        // « up » : monte vite, flou vertical qui persiste un peu (comme la source)
        const k = eexpo(prog(t, t0 + 0.05, t0 + 0.4));
        sp.style.opacity = clamp(k * 1.6);
        sp.style.filter = `blur(${(1 - k) * M * 0.02 + 0.6}px)`;
        sp.style.transform = `translateY(${(1 - k) * M * 0.12}px) scaleY(${1 + (1 - k) * 0.5})`;
      }
    });
  } else if (t >= B.G && t < B.H) {
    // G : « Fit, finally figured out. » en bas à droite
    const k = blurIn(t, B.G + 0.2, 0.4, 0.02);
    const out = 1 - prog(t, B.H - 0.08, B.H);
    if (P) place(texts.fit, { x: W * 0.92, y: H * 0.7, size: M * 0.068, align: 'right', ...k, opacity: k.opacity * out });
    else place(texts.fit, { x: W * 0.93, y: H * 0.84, size: M * 0.06, align: 'right', ...k, opacity: k.opacity * out });
  } else if (t >= B.H && t < B.I) {
    // H : « Touch » puis « control »
    const el = texts.touch;
    const k1 = blurIn(t, B.H + 0.3, 0.35, 0.0);
    const k2 = eexpo(prog(t, B.H + 0.75, B.H + 1.1));
    const out = 1 - prog(t, B.I - 0.08, B.I);
    if (P) place(el, { x: W * 0.93, y: H * 0.5, size: M * 0.074, align: 'right', opacity: k1.opacity * out, blur: k1.blur });
    else place(el, { x: W * 0.9, y: H * 0.5, size: M * 0.08, align: 'right', opacity: k1.opacity * out, blur: k1.blur });
    const c = el.querySelector('#w-control');
    c.style.opacity = clamp(k2 * 1.4);
    c.style.filter = `blur(${(1 - k2) * M * 0.018}px)`;
    c.style.transform = `translateX(${(1 - k2) * -M * 0.05}px)`;
  } else if (t >= B.J) {
    // J : logo + disclaimer
    const k = eout(prog(t, B.J + 0.05, B.J + 0.4));
    const sz = M * (P ? 0.16 : 0.13);
    logoEl.style.width = sz + 'px';
    logoEl.style.height = sz + 'px';
    place(logoEl, { x: W / 2, y: H / 2 - M * 0.02, size: 16, opacity: k, scale: lerp(0.94, 1, k), blur: (1 - k) * 6 });
    const d = texts.disc;
    d.style.textAlign = 'center';
    d.style.lineHeight = '1.45';
    d.style.letterSpacing = '0';
    d.innerHTML = `This spec ad is not commissioned by Apple and is in no way associated with Apple.<br>Spec ad by ${HANDLE}`;
    const k2 = eout(prog(t, B.J + 0.15, B.J + 0.5));
    place(d, { x: W / 2, y: P ? H * 0.75 : H * 0.86, size: M * (P ? 0.024 : 0.021), opacity: k2 });
  }
}

// ---------- image ----------
function setScene(t) {
  hideObjects();
  bgx.clearRect(0, 0, W, H);
  if (t < B.B) {
    drawRings(t, 0);
  } else if (t < B.C) {
    fillBg('#000');
  } else if (t < B.E) {
    // C : anneaux clairs ; D : passage au gris
    drawRings(t, 1);
    const g = eio(prog(t, B.D + 0.1, B.D + 0.55));
    if (g > 0) fillBg(GRAY, g);
    setCase(t);
  } else if (t < B.F) {
    fillBg(GRAY);
  } else if (t < B.G) {
    fillBg(GRAY);
    setPair(t, B.F, B.G, true);
  } else if (t < B.H) {
    fillBg(GRAY);
    setFit(t);
  } else if (t < B.I) {
    fillBg(GRAY);
    setTouch(t);
  } else if (t < B.J) {
    fillBg(GRAY);
    setPair(t, B.I, B.J, false);
  } else {
    fillBg('#000');
  }
  setType(t);
}

window.setup = (w, h, handle) => {
  W = w; H = h; M = Math.min(w, h);
  if (handle) HANDLE = handle;
  stage.style.width = w + 'px';
  stage.style.height = h + 'px';
  for (const c of [bg, fx]) { c.width = w; c.height = h; }
  renderer.setPixelRatio(1);
  renderer.setSize(w, h, false);
  glc.style.width = w + 'px';
  glc.style.height = h + 'px';
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
};

// Calque produit externe (rendu Blender RGBA), sinon three.js
let LAYER = null; // { url, fps }
const layerImg = new Image();
function loadImg(src) {
  return new Promise((res) => { layerImg.onload = () => res(true); layerImg.onerror = () => res(false); layerImg.src = src; });
}
window.useLayer = (url, fps) => { LAYER = url ? { url, fps } : null; };

window.renderFrame = async (t) => {
  setScene(t);
  fxx.clearRect(0, 0, W, H);
  if (LAYER) {
    hideObjects();
    renderer.render(scene, camera);
    const n = Math.round(t * LAYER.fps);
    const ok = await loadImg(`${LAYER.url}/f${String(n).padStart(5, '0')}.png`);
    if (ok) fxx.drawImage(layerImg, 0, 0, W, H);
  } else {
    renderer.render(scene, camera);
  }
  await document.fonts.ready;
  return true;
};
window.sceneReady = true;
window.__dbg = { THREE, scene, camera, renderer, caseObj, budL, budR, frame, hideObjects, fillBg, hideAll };
