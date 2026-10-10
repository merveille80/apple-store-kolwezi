"""Mix v3 : voix Théo + bruitages organiques ElevenLabs + musique de fond, calés sur l'image (50,5 s).

Usage : python3 mix3.py <dossier audio> <remap_table.txt> <sortie.wav> <musique> [gain musique dB]
La musique peut être n'importe quel fichier (celle de music.py ou un morceau fourni) : elle est coupée
à 50,5 s avec un fondu final et baissée automatiquement sous la voix.
Les instants d'événements sont donnés en temps visuel des scènes (u) puis convertis en temps réel
via la table de remap exportée depuis src/remap.js.
"""
import subprocess, sys, random
import numpy as np

A, TABLE, OUT, MUSIC = sys.argv[1:5]
MUSIC_DB = float(sys.argv[5]) if len(sys.argv) > 5 else -11.0
VO = sys.argv[6] if len(sys.argv) > 6 else f'{A}/theo4.mp3'
SR, DUR, VO_OFF = 48000, 50.5, 0.4
S = f'{A}/sfx2/'
random.seed(7)

tab = np.loadtxt(TABLE)
def real(u):
    return float(np.interp(u, tab[:, 1], tab[:, 0]))

def load(path, af=None):
    cmd = ['ffmpeg', '-v', 'error', '-i', path]
    if af:
        cmd += ['-af', af]
    cmd += ['-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    x = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32)
    return x.reshape(-1, 2).astype(np.float64)

def clip(name, a=0, b=None):
    x = load(S + name + '.mp3')
    x = x[int(a * SR): int(b * SR) if b else None].copy()
    f = int(0.004 * SR)
    x[:f] *= np.linspace(0, 1, f)[:, None]
    f2 = int(0.03 * SR)
    x[-f2:] *= np.linspace(1, 0, f2)[:, None]
    x /= np.abs(x).max() + 1e-9          # crête à 0 dBFS, le gain de l'événement fait le reste
    lead = np.argmax(np.abs(x).sum(1)) / SR
    return x, lead

C = {
    'tA': clip('tap4', 0.45, 0.85), 'tB': clip('tap2', 1.62, 2.0), 'tC': clip('tap3', 1.55, 1.95),
    'tD': clip('tap2', 1.20, 1.55), 'tE': clip('tap3', 0.92, 1.30),
    'w1': clip('whoosh1'), 'w2': clip('whoosh2'),
    's2': clip('swell2'), 's3': clip('swell3'),
    'c1': clip('chime1'), 'c2': clip('chime2'), 'c3': clip('chime3'),
    'k1': clip('key1', 0, 0.7), 'k3': clip('key3', 0.9, 1.9), 'k4': clip('key4', 1.2, 2.6),
}
# Les claviers démarrent tout de suite (pas d'alignement sur la crête)
for k in ('k1', 'k3', 'k4'):
    C[k] = (C[k][0], 0.0)

TAPS = ['tA', 'tB', 'tC', 'tD', 'tE']
_ti = [0]
def tap():
    _ti[0] = (_ti[0] + 2) % len(TAPS)
    return TAPS[_ti[0]]

# (temps visuel u, son, gain dB) ; « tap » = prise de tap tournante pour éviter la répétition
EV = [
    (0.82, 'tap', -19),
    (3.40, 'w2', -17), (4.30, 'tap', -16),
    (4.85, 'tap', -19), (5.82, 'tap', -19), (7.36, 'tap', -19),
    (8.60, 'w1', -21), (9.35, 'tap', -18),
    (10.80, 's2', -19), (11.90, 'c1', -21),
    (13.50, 'w1', -17),
    (14.60, 'k1', -24), (15.50, 'k3', -25), (15.90, 'tap', -22), (16.25, 'c3', -27), (16.55, 'k1', -25),
    (17.45, 'w2', -19), (17.75, 'k4', -25), (19.30, 'c2', -24),
    (20.40, 'w1', -17), (20.70, 'tap', -19),
    (21.95, 'w2', -19), (23.20, 'tap', -22), (24.55, 'c3', -26),
    (25.00, 'tap', -17), (25.60, 'tap', -20),
    (27.45, 'w1', -17),
    (29.68, 'tap', -18), (30.50, 'tap', -18), (31.60, 'tap', -18), (33.50, 'c1', -23),
    (34.55, 'w2', -17), (35.40, 'c1', -21),
    (35.95, 'tap', -18), (36.95, 'tap', -18), (38.05, 'tap', -18),
    (39.30, 'w1', -17), (39.65, 'tap', -19), (40.95, 'tap', -19), (41.95, 'tap', -19),
    (42.85, 'w2', -21), (44.00, 'c3', -25),
    (45.15, 'w2', -17), (45.55, 'tap', -17), (46.55, 'w1', -20),
    (47.05, 's3', -20), (48.85, 'tap', -17), (49.65, 'tap', -14), (49.70, 'c1', -20),
]

n = int(DUR * SR)
sfx = np.zeros((n, 2))
for u, name, g in EV:
    if name == 'tap':
        name = tap()
    x, lead = C[name]
    # variation organique : hauteur ±3 %, gain ±1,5 dB, panoramique léger
    r = 1 + random.uniform(-0.03, 0.03)
    idx = np.arange(0, len(x) - 1, r)
    y = np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in range(2)], 1)
    gain = 10 ** ((g + random.uniform(-1.5, 1.5)) / 20)
    pan = random.uniform(-0.25, 0.25)
    y = y * gain * np.array([1 - pan, 1 + pan])
    start = int(max(0, real(u) - lead / r) * SR)
    end = min(n, start + len(y))
    sfx[start:end] += y[: end - start]

vo = load(VO, 'highpass=f=70,acompressor=threshold=-22dB:ratio=2.5:attack=8:release=120:makeup=2,equalizer=f=3500:t=q:w=1:g=1.5')
voice = np.zeros((n, 2))
s0 = int(VO_OFF * SR)
voice[s0: s0 + len(vo)] = vo[: n - s0]

# Musique : niveau fixe + baisse automatique sous la voix (enveloppe lissée de la voix)
mus = load(MUSIC)[:n]
if len(mus) < n:
    mus = np.concatenate([mus, np.zeros((n - len(mus), 2))])
f = int(1.2 * SR)
mus[-f:] *= np.linspace(1, 0, f)[:, None] ** 1.5
lvl = np.sqrt(np.convolve((voice ** 2).mean(1), np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same'))
active = (lvl > 10 ** (-38 / 20)).astype(float)
k = np.exp(-np.arange(int(0.35 * SR)) / (0.12 * SR)); k /= k.sum()
active = np.clip(np.convolve(active, k, 'full')[:n] * 1.6, 0, 1)
duck_db = -4.5 * active
mus *= (10 ** ((MUSIC_DB + duck_db) / 20))[:, None]

mix = voice + sfx + mus
tmp = OUT + '.raw.wav'
import wave
pcm = (np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes()
with wave.open(tmp, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm)
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9,alimiter=limit=0.89,aresample=48000', '-ar', '48000', OUT], check=True)
print('ok', OUT, 'peak mix', float(np.abs(mix).max()))
