"""Mix de la pub iPhone 18 Pro Max v2 : voix Théo + bruitages + le son de merveille (musique.py), calés sur l'image (48,5 s).

Usage : python3 mix.py <musique.wav> <sortie.wav> [gain musique dB]
Les instants sont en secondes vidéo ; la voix (v2, prise 1) est décalée de VO_OFF, comme T dans src/Video.jsx.
"""
import subprocess, sys, random, wave
import numpy as np

MUSIC, OUT = sys.argv[1:3]
MUSIC_DB = float(sys.argv[3]) if len(sys.argv) > 3 else -10.0
SR, DUR, VO_OFF = 48000, 48.5, 0.36
DROP, BEAT = 16.55, 2.0287 / 4  # grille du son de merveille
S = 'audio/sfx2/'
random.seed(11)

def load(path, af=None):
    cmd = ['ffmpeg', '-v', 'error', '-i', path]
    if af:
        cmd += ['-af', af]
    cmd += ['-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    x = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32)
    return x.reshape(-1, 2).astype(np.float64)

def clip(name, a=0, b=None, align=True):
    x = load(S + name + '.mp3')
    x = x[int(a * SR): int(b * SR) if b else None].copy()
    f = int(0.004 * SR); x[:f] *= np.linspace(0, 1, f)[:, None]
    f2 = int(0.03 * SR); x[-f2:] *= np.linspace(1, 0, f2)[:, None]
    x /= np.abs(x).max() + 1e-9
    lead = np.argmax(np.abs(x).sum(1)) / SR if align else 0.0
    return x, lead

C = {
    'tA': clip('tap4', 0.45, 0.85), 'tB': clip('tap2', 1.62, 2.0), 'tC': clip('tap3', 1.55, 1.95),
    'w1': clip('whoosh1'), 'w2': clip('whoosh2'),
    'c1': clip('chime1'), 'c2': clip('chime2'), 'c3': clip('chime3'),
    'coupure': clip('coupure', align=False), 'batterie': clip('batterie'), 'erreur': clip('erreur'),
    'impact': clip('impact'), 'obtu': clip('obturateur'), 'tic': clip('tic'),
}
TAPS = ['tA', 'tB', 'tC']
_ti = [0]
def tap():
    _ti[0] = (_ti[0] + 1) % len(TAPS)
    return TAPS[_ti[0]]

w = lambda x: x + VO_OFF
beat = lambda k: DROP + k * BEAT
EV = [
    (0.00, 'coupure', -8),                       # la lumière se coupe
    (w(2.28), 'batterie', -14),                  # « trois pour cent »
    (5.43, 'w2', -17),                           # passage au blanc
    (w(7.314), 'tap', -16), (w(9.867), 'tap', -16), (w(11.04), 'tap', -16),
    (w(11.667), 'erreur', -15),                  # « saturé »
    (13.75, 'w1', -16),                          # les cartes s'envolent
    (w(15.64), 'tap', -15),                      # pilule « lâcher »
    (DROP, 'impact', -8),                        # grand retour du son : « Voici »
    (18.75, 'w2', -18),
] + [(beat(k), 'tic', -21) for k in range(5, 11)] + [
    (21.6, 'c2', -22),                           # 23:00
    (22.3, 'w1', -18),
    (w(22.84), 'obtu', -10),                     # déclic sur « nettes »
    (26.75, 'w2', -18),
] + [(w(26.52) + k * 0.125, 'tap', -21) for k in range(12)] + [
    (w(29.968), 'c3', -22),                      # l'alerte disparaît
    (30.75, 'w1', -18),                          # scène couleurs
    (w(30.576), 'c1', -23), (w(31.44), 'c2', -23), (w(32.07), 'c3', -23), (w(32.8), 'c1', -23),
    (34.75, 'w2', -18),
    (w(35.12), 'tap', -17),
    (w(36.871), 'c1', -19), (w(38.208), 'c2', -19),
    (39.89, 'w2', -17),
    (39.89, 'impact', -13),                      # le téléphone arrive
    (w(43.72), 'tap', -16),
    (w(44.267), 'tap', -13),                     # clic sur WhatsApp
    (46.92, 'c1', -20),                          # logo final, sur la dernière frappe du son
]

n = int(DUR * SR)
sfx = np.zeros((n, 2))
for t0, name, g in EV:
    if name == 'tap':
        name = tap()
    x, lead = C[name]
    r = 1 + random.uniform(-0.03, 0.03)
    idx = np.arange(0, len(x) - 1, r)
    y = np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in range(2)], 1)
    gain = 10 ** ((g + random.uniform(-1, 1)) / 20)
    pan = random.uniform(-0.2, 0.2)
    y = y * gain * np.array([1 - pan, 1 + pan])
    start = int(max(0, t0 - lead / r) * SR)
    end = min(n, start + len(y))
    sfx[start:end] += y[: end - start]

vo = load('audio/voix-theo-v2.mp3', 'highpass=f=70,acompressor=threshold=-22dB:ratio=2.5:attack=8:release=120:makeup=2,equalizer=f=3500:t=q:w=1:g=1.5')
voice = np.zeros((n, 2))
s0 = int(VO_OFF * SR)
voice[s0: s0 + len(vo)] = vo[: n - s0]

mus = load(MUSIC)[:n]
if len(mus) < n:
    mus = np.concatenate([mus, np.zeros((n - len(mus), 2))])
lvl = np.sqrt(np.convolve((voice ** 2).mean(1), np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same'))
active = (lvl > 10 ** (-38 / 20)).astype(float)
k = np.exp(-np.arange(int(0.35 * SR)) / (0.12 * SR)); k /= k.sum()
active = np.clip(np.convolve(active, k, 'full')[:n] * 1.6, 0, 1)
mus *= (10 ** ((MUSIC_DB - 4.0 * active) / 20))[:, None]

mix = voice + sfx + mus
tmp = 'audio/mix.raw.wav'
with wave.open(tmp, 'wb') as wf:
    wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR)
    wf.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9,alimiter=limit=0.89,aresample=48000', '-ar', '48000', OUT], check=True)
print('ok', OUT, 'peak mix', float(np.abs(mix).max()))
