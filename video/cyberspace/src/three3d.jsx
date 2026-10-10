import React, {useContext, useLayoutEffect, useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {MARK} from './markShape';
import {Fmt, prog, back, clamp} from './ui';

// Éléments 3D « studio » : argile blanche mate + noir laqué, lumière douce, ombres portées sur le fond.
// Chaque scène pose un petit canevas local ; 1 unité 3D = 100 px du plan de travail, origine au centre du canevas.
export const U = 100;
export const px = (x, y, w, h) => [(x - w / 2) / U, -(y - h / 2) / U];

const Studio = ({wall, floor, shadow}) => {
  const {gl, scene} = useThree();
  const env = useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    return pm.fromScene(new RoomEnvironment(), 0.04).texture;
  }, [gl]);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = 1.05;
    scene.environment = env;
    scene.environmentIntensity = 0.85;
  }, [gl, scene, env]);
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[-4, 8, 10]} intensity={2.1} castShadow shadow-mapSize={[2048, 2048]} shadow-radius={16} shadow-blurSamples={24} shadow-bias={-0.0004}
        shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-near={0.5} shadow-camera-far={40} />
      {wall !== null && (
        <mesh position={[0, 0, wall]} receiveShadow>
          <planeGeometry args={[80, 80]} />
          <shadowMaterial transparent opacity={shadow} />
        </mesh>
      )}
      {floor !== null && (
        <mesh position={[0, floor, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[80, 80]} />
          <shadowMaterial transparent opacity={shadow} />
        </mesh>
      )}
    </>
  );
};

// Canevas 3D local, en coordonnées du plan de travail (w × h px), net en 4K quel que soit l'agrandissement.
export const Stage3D = ({w, h, style, children, wall = -1.1, floor = null, shadow = 0.1, fov = 30}) => {
  const {k} = useContext(Fmt);
  const dist = h / U / 2 / Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const dpr = (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1) * k;
  return (
    <ThreeCanvas width={w} height={h} dpr={dpr} shadows="variance" gl={{alpha: true, antialias: true, preserveDrawingBuffer: true}}
      camera={{fov, position: [0, 0, dist], near: 0.1, far: 200}} style={{position: 'absolute', pointerEvents: 'none', ...style}}>
      <Studio wall={wall} floor={floor} shadow={shadow} />
      {children}
    </ThreeCanvas>
  );
};

// Matières
export const Clay = (p) => <meshPhysicalMaterial color="#F3F3F5" roughness={0.5} clearcoat={0.3} clearcoatRoughness={0.45} {...p} />;
export const Ink = (p) => <meshPhysicalMaterial color="#1D1D1F" roughness={0.26} clearcoat={1} clearcoatRoughness={0.12} {...p} />;
const MAT = {clay: Clay, ink: Ink};
const Mat = ({m = 'clay', ...p}) => React.createElement(MAT[m], Object.fromEntries(Object.entries(p).filter(([, x]) => x !== undefined)));

// Apparition « pop » + flottement + rotation lente
export const Float = ({t, at, pos, rot = [0, 0, 0], spin = [0, 0, 0], s = 1, bob = 0.06, dur = 0.8, children}) => {
  const p = clamp(back(prog(t, at, dur), 1.5), 0, 1.2);
  const b = Math.sin((t + at * 2.3) * 1.15) * bob;
  return (
    <group position={[pos[0], pos[1] + b, pos[2] || 0]} rotation={[rot[0] + t * spin[0], rot[1] + t * spin[1], rot[2] + t * spin[2]]} scale={Math.max(1e-4, p * s)}>
      {children}
    </group>
  );
};

export const Sphere = ({r = 0.4, m}) => (
  <mesh castShadow><sphereGeometry args={[r, 64, 48]} /><Mat m={m} /></mesh>
);
export const Torus = ({R = 0.4, r = 0.14, m}) => (
  <mesh castShadow><torusGeometry args={[R, r, 48, 96]} /><Mat m={m} /></mesh>
);
export const Capsule = ({r = 0.16, l = 0.5, m}) => (
  <mesh castShadow><capsuleGeometry args={[r, l, 16, 32]} /><Mat m={m} /></mesh>
);
const boxCache = new Map();
const rbox = (w, h, d, r) => {
  const key = [w, h, d, r].join();
  if (!boxCache.has(key)) boxCache.set(key, new RoundedBoxGeometry(w, h, d, 6, r));
  return boxCache.get(key);
};
export const RBox = ({w = 0.6, h = 0.6, d = 0.6, r = 0.12, m, color, receive}) => (
  <mesh castShadow receiveShadow={receive} geometry={rbox(w, h, d, r)}><Mat m={m} color={color} /></mesh>
);
export const Plus = ({a = 0.9, b = 0.26, m = 'ink'}) => (
  <group>
    <RBox w={a} h={b} d={b} r={b * 0.45} m={m} />
    <RBox w={b} h={a} d={b} r={b * 0.45} m={m} />
  </group>
);

// Logo CS extrudé (vectorisé depuis le PNG d'origine). size = largeur en px ; face avant au plan z = 0.
let markGeo = null;
const getMarkGeo = () => {
  if (markGeo) return markGeo;
  const shapes = MARK.map((o) => new THREE.Shape(o.pts.map(([x, y]) => new THREE.Vector2(x, y))));
  const depth = 0.16, bt = 0.022;
  markGeo = new THREE.ExtrudeGeometry(shapes, {depth, bevelEnabled: true, bevelThickness: bt, bevelSize: 0.006, bevelSegments: 4, curveSegments: 6});
  markGeo.translate(0, 0, -(depth + bt));
  markGeo.computeVertexNormals();
  return markGeo;
};
export const Logo3D = ({size = 200, m = 'ink', color}) => {
  const s = size / U;
  return (
    <mesh castShadow geometry={getMarkGeo()} scale={[s, s, s]}>
      <Mat m={m} color={color} />
    </mesh>
  );
};

// Bulle de discussion extrudée (noir laqué) avec trois points qui « écrivent »
let bubbleGeo = null;
const getBubbleGeo = () => {
  if (bubbleGeo) return bubbleGeo;
  const w = 1.5, h = 0.95, r = 0.42, P = Math.PI;
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.absarc(w / 2 - r, -h / 2 + r, r, -P / 2, 0, false);
  s.lineTo(w / 2, h / 2 - r);
  s.absarc(w / 2 - r, h / 2 - r, r, 0, P / 2, false);
  s.lineTo(-w / 2 + r, h / 2);
  s.absarc(-w / 2 + r, h / 2 - r, r, P / 2, P, false);
  s.lineTo(-w / 2, -h / 2 + r);
  s.absarc(-w / 2 + r, -h / 2 + r, r, P, 1.5 * P, false);
  const tail = new THREE.Shape();
  tail.moveTo(-0.6, -0.3);
  tail.lineTo(-0.18, -0.46);
  tail.lineTo(-0.74, -0.74);
  tail.lineTo(-0.6, -0.3);
  bubbleGeo = new THREE.ExtrudeGeometry([s, tail], {depth: 0.22, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 6, curveSegments: 24});
  bubbleGeo.translate(0, 0, -0.28);
  return bubbleGeo;
};
export const Bubble3D = ({t}) => (
  <group>
    <mesh castShadow geometry={getBubbleGeo()}><Ink /></mesh>
    {[-0.36, 0, 0.36].map((x, i) => (
      <mesh key={i} castShadow position={[x, 0.02 + Math.max(0, Math.sin(t * 7 - i * 0.9)) * 0.07, 0.03]}>
        <sphereGeometry args={[0.1, 32, 24]} />
        <Clay />
      </mesh>
    ))}
  </group>
);
