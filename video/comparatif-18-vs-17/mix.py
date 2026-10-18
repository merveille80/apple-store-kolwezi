"""Mix du comparatif iPhone 18 Pro Max vs 17 Pro Max : voix Théo, musique « Sunny Patterns » et bruitages Epidemic Sound.

Usage : python3 mix.py [sortie.wav] [dossier des pistes séparées]
Les sons Epidemic sont dans audio/epidemic/ (non versionnés, identifiants dans audio/SOURCES.md).
Les instants sont en secondes vidéo ; w(x) convertit un instant de la voix (VO_OFF, comme dans src/Video.jsx).
La musique joue son début, puis enchaîne à 50,4 s (« Alors, faut-il changer ? ») sur sa vraie fin, calée à la mesure.
"""
import json, os, subprocess, sys, random, wave
import numpy as np

OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/mix.wav'
STEMS = sys.argv[2] if len(sys.argv) > 2 else None
SR, DUR, VO_OFF = 48000, 66.0, 0.5
MUSIC_DB, DUCK_DB = -12.0, 5.0
BEAT = 60 / 76  # Sunny Patterns, 76 BPM
JUMP_AT, JUMP_BY = 50.4, 244 * BEAT  # saut de 61 mesures vers la fin du morceau
S = 'audio/epidemic/'
random.seed(18)
w = lambda x: x + VO_OFF

def load(path, af=None):
    cmd = ['ffmpeg', '-v', 'error', '-i', path]
    if af:
        cmd += ['-af', af]
    cmd += ['-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    x = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32)
    return x.reshape(-1, 2).astype(np.float64)

def clip(name):
    x = load(S + 'sfx-' + name + '.mp3', 'lowpass=f=11000')
    f = int(0.002 * SR); x[:f] *= np.linspace(0, 1, f)[:, None]
    f2 = int(0.03 * SR); x[-f2:] *= np.linspace(1, 0, f2)[:, None]
    x /= np.abs(x).max() + 1e-9
    lead = np.argmax(np.abs(x).sum(1)) / SR  # le pic du son tombe sur l'instant voulu
    return x, lead

NAMES = ['pop', 'click', 'whoosh', 'success', 'shimmer', 'riser', 'glasspop']
CL = {n: clip(n) for n in NAMES}

EV = [
    (0.55, 'whoosh', -22),                                   # les téléphones arrivent
    (w(2.6), 'whoosh', -27),                                 # ils se rapprochent
    (w(5.5), 'pop', -20),                                    # bulle
    (w(7.35), 'pop', -25),                                   # « ••• »
    (w(9.45), 'click', -22), (w(9.85), 'click', -23), (w(10.25), 'click', -22),  # les trois cartes
    (w(11.03), 'whoosh', -25),
    (w(13.6), 'glasspop', -24),                              # photo
    (w(17.1), 'click', -23),                                 # ƒ/1,48
    (w(19.6), 'click', -24), (w(19.9), 'click', -24), (w(20.2), 'click', -23),  # trois crans vers ƒ/4,0
    (w(22.44), 'whoosh', -26),
    (w(25.1), 'pop', -21), (w(26.07), 'pop', -21), (w(27.03), 'pop', -21),  # coches
    (w(28.32), 'whoosh', -26),
    (w(34.9), 'riser', -24),                                 # les barres se remplissent
    (w(36.35), 'success', -22),                              # « +6 h »
    (w(40.14), 'whoosh', -26),
    (w(42.4), 'shimmer', -23),                               # A20 Pro
    (w(43.6), 'glasspop', -25),
    (w(44.6), 'click', -23),                                 # surface ×3
    (w(47.25), 'pop', -22), (w(48.03), 'pop', -22),
    (w(50.37), 'whoosh', -26),
    (w(52.05), 'glasspop', -24),                             # carte de choix
    (w(57.55), 'click', -20),                                # tap sur « Je compare »
    (w(57.7), 'success', -19),
    (w(58.37), 'whoosh', -26),
    (w(59.75), 'pop', -23),                                  # message troc
]

n = int(DUR * SR)
sfx = np.zeros((n, 2))
placed = []
for t0, name, g in EV:
    x, lead = CL[name]
    r = 1 + random.uniform(-0.025, 0.025)
    idx = np.arange(0, len(x) - 1, r)
    y = np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in range(2)], 1)
    gdb = g + random.uniform(-0.8, 0.8)
    pan = random.uniform(-0.15, 0.15)
    y = y * 10 ** (gdb / 20) * np.array([1 - pan, 1 + pan])
    start = int(max(0, t0 - lead / r) * SR)
    end = min(n, start + len(y))
    sfx[start:end] += y[: end - start]
    placed.append({'debut_s': round(start / SR, 3), 'son': name, 'gain_db': round(gdb, 1)})

vo = load('audio/voix-theo.mp3', 'highpass=f=70,acompressor=threshold=-22dB:ratio=2.5:attack=8:release=120:makeup=2,equalizer=f=3500:t=q:w=1:g=1.2')
voice = np.zeros((n, 2))
s0 = int(VO_OFF * SR)
voice[s0: s0 + len(vo)] = vo[: n - s0]

# Musique : début du morceau, puis fondu enchaîné vers la fin naturelle
full = load(S + 'musique.mp3')
a = full[:n]
b0 = int((JUMP_AT + JUMP_BY) * SR) - int(JUMP_AT * SR)
b = full[b0: b0 + n]
if len(b) < n:
    b = np.concatenate([b, np.zeros((n - len(b), 2))])
tt = np.arange(n) / SR
xf = np.clip((tt - JUMP_AT + 0.75) / 1.5, 0, 1)
xf = 0.5 - 0.5 * np.cos(np.pi * xf)
mus = a * np.sqrt(1 - xf)[:, None] + b * np.sqrt(xf)[:, None]
mus *= np.clip(tt / 1.2, 0, 1)[:, None]                       # entrée douce
mus *= np.clip((DUR - tt) / 2.5, 0, 1)[:, None] ** 1.5         # sortie douce

lvl = np.sqrt(np.convolve((voice ** 2).mean(1), np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same'))
active = (lvl > 10 ** (-38 / 20)).astype(float)
k = np.exp(-np.arange(int(0.4 * SR)) / (0.15 * SR)); k /= k.sum()
active = np.clip(np.convolve(active, k, 'full')[:n] * 1.6, 0, 1)
mus *= (10 ** ((MUSIC_DB - DUCK_DB * active) / 20))[:, None]

def write(path, x):
    with wave.open(path, 'wb') as wf:
        wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR)
        wf.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())

mix = voice + sfx + mus
tmp = 'audio/mix.raw.wav'
write(tmp, mix)
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9,alimiter=limit=0.89,aresample=48000', '-ar', '48000', OUT], check=True)
if STEMS:
    os.makedirs(STEMS, exist_ok=True)
    gain = np.sqrt((load(OUT) ** 2).mean() / ((mix ** 2).mean() + 1e-12))
    for nm, x in (('voix', voice), ('musique', mus), ('bruitages', sfx)):
        write(os.path.join(STEMS, nm + '.wav'), x * gain)
    json.dump({'gain_sortie_db': round(20 * np.log10(gain), 2), 'bruitages': placed}, open(os.path.join(STEMS, 'bruitages.json'), 'w'), ensure_ascii=False, indent=1)
os.remove(tmp)
print('ok', OUT, 'peak mix', float(np.abs(mix).max()))
