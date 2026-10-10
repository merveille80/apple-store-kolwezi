"""Mix de la pub iPhone 18 Pro Max : voix Théo + bruitages + musique (music.py), calés sur l'image (42,5 s).

Usage : python3 mix.py <musique.wav> <sortie.wav> [gain musique dB]
Les instants sont en secondes vidéo ; la voix (prise 2) est décalée de VO_OFF, comme T dans src/Video.jsx.
"""
import subprocess, sys, random, wave
import numpy as np

MUSIC, OUT = sys.argv[1:3]
MUSIC_DB = float(sys.argv[3]) if len(sys.argv) > 3 else -10.0
SR, DUR, VO_OFF = 48000, 42.5, 0.35
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
EV = [
    (0.00, 'coupure', -8),                       # la lumière se coupe
    (w(2.063), 'batterie', -14),                 # « trois pour cent »
    (5.10, 'w2', -17),                           # passage au blanc
    (w(6.216), 'tap', -16), (w(8.783), 'tap', -16), (w(10.129), 'tap', -16),
    (w(10.836), 'erreur', -15),                  # « saturé »
    (13.05, 'w1', -16),                          # les cartes s'envolent
    (w(14.876), 'tap', -15),                     # pilule « lâcher »
    (16.12, 'impact', -7),                       # DROP : « Voici »
    (17.95, 'w2', -18),
] + [(18.12 + k * 0.5, 'tic', -20) for k in range(6)] + [
    (21.0, 'c2', -22),                           # 23:00
    (21.0, 'w1', -18),
    (w(21.518), 'obtu', -10),                    # déclic sur « nettes »
    (25.05, 'w2', -18),
] + [(w(24.878) + k * 0.125, 'tap', -21) for k in range(12)] + [
    (w(27.606), 'c3', -22),                      # l'alerte disparaît
    (28.55, 'w1', -18),
    (w(28.918), 'tap', -17),
    (w(30.5), 'c1', -19), (w(31.686), 'c2', -19),
    (33.25, 'w2', -17),
    (34.12, 'impact', -12),                      # drop final
    (w(36.878), 'tap', -16),
    (w(37.425), 'tap', -13),                     # clic sur WhatsApp
    (39.6, 'c1', -20),
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

vo = load('audio/voix-theo.mp3', 'highpass=f=70,acompressor=threshold=-22dB:ratio=2.5:attack=8:release=120:makeup=2,equalizer=f=3500:t=q:w=1:g=1.5')
voice = np.zeros((n, 2))
s0 = int(VO_OFF * SR)
voice[s0: s0 + len(vo)] = vo[: n - s0]

mus = load(MUSIC)[:n]
if len(mus) < n:
    mus = np.concatenate([mus, np.zeros((n - len(mus), 2))])
f = int(1.2 * SR)
mus[-f:] *= np.linspace(1, 0, f)[:, None] ** 1.5
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
