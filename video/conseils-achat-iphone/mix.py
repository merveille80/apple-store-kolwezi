"""Mix de la pub « Conseils d'achat iPhone » : voix Koraly, musique « A Step Ahead » (Experia) et bruitages Epidemic Sound.

Usage : python3 mix.py [sortie.wav] [dossier des pistes séparées]
Les sons Epidemic sont dans audio/epidemic/ (non versionnés, identifiants dans audio/SOURCES.md).
Les instants sont ceux de la voix (elle démarre à 0 s, comme dans src/Video.jsx).
Musique très basse sous la voix ; si les stems existent, la mélodie n'entre qu'à 71,7 s (« Alors… ») pour la montée de fin.
"""
import json, os, subprocess, sys, random, wave
import numpy as np

OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/mix.wav'
STEMS = sys.argv[2] if len(sys.argv) > 2 else None
SR, DUR = 48000, 89.5
MUSIC_DB, DUCK_DB, FINALE = -21.0, 6.0, 71.7
S = 'audio/epidemic/'
random.seed(19)

def load(path, af=None):
    cmd = ['ffmpeg', '-v', 'error', '-i', path]
    if af:
        cmd += ['-af', af]
    cmd += ['-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    x = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32)
    return x.reshape(-1, 2).astype(np.float64)

def clip(name):
    x = load(S + 'sfx-' + name + '.mp3', 'lowpass=f=12000')
    f = int(0.002 * SR); x[:f] *= np.linspace(0, 1, f)[:, None]
    f2 = int(0.03 * SR); x[-f2:] *= np.linspace(1, 0, f2)[:, None]
    x /= np.abs(x).max() + 1e-9
    return x

# (instant, son, gain dB, ancrage) : ancrage 'peak' = le pic du son tombe sur l'instant (impacts, pops),
# 'start' = le son démarre à l'instant (whoosh, riser se terminant sur l'impact s'il est placé avant)
EV = [
    (0.16, 'keys', -26, 'start'),                      # « Stop. » tapé
    (1.86, 'whoosh', -27, 'start'),                    # le 18 Pro Max monte
    (3.62, 'whoosh2', -30, 'start'),                   # entrée scène bulle
    (3.76, 'pop', -22, 'peak'),                        # bulle
    (6.58, 'message', -25, 'peak'),                    # « modèle. »
    (7.32, 'swoosh', -29, 'start'),
    (9.08, 'tap', -26, 'peak'),
    (9.92, 'swoosh', -28, 'start'),                    # surligneur « au bon endroit »
    (10.97, 'whoosh2', -30, 'start'),
    (11.7, 'pop', -23, 'peak'), (12.44, 'pop2', -23, 'peak'), (13.18, 'pop', -23, 'peak'), (14.22, 'pop2', -23, 'peak'),
    (15.56, 'riser', -24, 'end'),                      # riser qui se termine sur le nom
    (15.56, 'impact', -21, 'peak'),
    (18.22, 'success', -24, 'peak'),                   # « expérience »
    (19.27, 'whoosh2', -30, 'start'),
    (21.3, 'tap', -24, 'peak'),                        # trait rouge
    (21.87, 'whoosh', -29, 'start'),
    (23.7, 'swoosh', -29, 'start'),                    # carte
    (24.3, 'tap', -24, 'peak'), (25.36, 'tap', -24, 'peak'), (26.36, 'tap', -24, 'peak'),
    (26.4, 'success', -27, 'peak'),
    (27.4, 'whoosh2', -30, 'start'),
    (27.56, 'pop', -22, 'peak'),                       # bulle question
    (29.66, 'pop2', -28, 'peak'), (30.12, 'pop2', -28, 'peak'), (30.58, 'pop2', -28, 'peak'),
    (31.62, 'swoosh', -29, 'start'),
    (33.0, 'whoosh', -27, 'start'), (33.54, 'whoosh', -27, 'start'), (34.12, 'whoosh', -27, 'start'),  # 11, 12, 13
    (35.1, 'whoosh2', -30, 'start'),
    (35.24, 'pop', -22, 'peak'),
    (36.34, 'pop2', -25, 'peak'), (37.3, 'pop2', -25, 'peak'), (38.9, 'pop2', -25, 'peak'),
    (39.7, 'swoosh', -27, 'start'),
    (40.78, 'swipe', -26, 'start'), (42.0, 'swipe', -26, 'start'), (43.12, 'swipe', -26, 'start'), (44.3, 'swipe', -26, 'start'),  # carrousel
    (46.3, 'riser', -25, 'end'),
    (46.3, 'impact', -20, 'peak'),                     # 18 Pro Max
    (46.36, 'success', -24, 'peak'),
    (47.9, 'whoosh2', -30, 'start'),
    (49.36, 'swoosh', -29, 'start'),
    (50.0, 'swipe', -30, 'start'), (51.1, 'swipe', -30, 'start'), (52.56, 'swipe', -30, 'start'),  # bouton qui bascule (v2)
    (50.08, 'tap', -24, 'peak'), (51.18, 'tap', -24, 'peak'), (52.64, 'tap', -24, 'peak'),
    (53.3, 'success', -25, 'peak'),                    # « honnête »
    (54.3, 'whoosh2', -30, 'start'),
    (54.27, 'impact2', -25, 'peak'),                   # coupe sur l'écran sombre « glitch » (v2)
    (57.22, 'whoosh2', -28, 'start'),                  # retour au blanc (v2)
    (55.12, 'tap', -25, 'peak'), (56.7, 'tap', -25, 'peak'),
    (57.8, 'swoosh', -28, 'start'),
    (58.95, 'whoosh', -26, 'start'),                   # bascule sur le bleu
    (60.22, 'pop', -24, 'peak'), (61.0, 'pop2', -24, 'peak'), (61.66, 'pop', -24, 'peak'),
    (62.5, 'whoosh', -27, 'start'),                    # retour au blanc
    (63.95, 'swipe', -25, 'start'),                    # ancien iPhone
    (65.82, 'message', -24, 'peak'),                   # alerte
    (66.34, 'tap', -21, 'peak'),                       # appui sur « Échanger »
    (66.5, 'confirm', -22, 'peak'),
    (69.9, 'riser', -27, 'end'),
    (69.94, 'whoosh', -25, 'start'),                   # métamorphose en 18 Pro Max
    (70.0, 'success', -25, 'peak'),
    (71.5, 'whoosh2', -29, 'start'),
    (72.64, 'pop', -24, 'peak'), (73.42, 'pop2', -24, 'peak'), (74.34, 'pop', -24, 'peak'), (75.44, 'pop2', -24, 'peak'),
    (79.38, 'riser', -23, 'end'),
    (79.38, 'impact2', -19, 'peak'),                   # nom de la boutique
    (80.95, 'whoosh2', -29, 'start'),
    (81.08, 'swoosh', -28, 'start'),                   # sondage
    (82.62, 'tap', -26, 'peak'),
    (84.74, 'swoosh', -29, 'start'),
    (86.28, 'tap', -21, 'peak'),
    (86.3, 'success', -21, 'peak'),                    # « MIEUX »
    (87.2, 'whoosh', -28, 'start'),                    # écran de fin
]

n = int(DUR * SR)
names = sorted({e[1] for e in EV})
CL = {nm: clip(nm) for nm in names}
sfx = np.zeros((n, 2))
placed = []
for t0, name, g, anchor in EV:
    x = CL[name]
    r = 1 + random.uniform(-0.03, 0.03)
    idx = np.arange(0, len(x) - 1, r)
    y = np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in range(2)], 1)
    gdb = g + random.uniform(-0.8, 0.8)
    pan = random.uniform(-0.18, 0.18)
    y = y * 10 ** (gdb / 20) * np.array([1 - pan, 1 + pan])
    if anchor == 'peak':
        st = t0 - np.argmax(np.abs(y).sum(1)) / SR
    elif anchor == 'end':
        st = t0 - len(y) / SR + 0.05
    else:
        st = t0
    start = int(max(0, st) * SR)
    end = min(n, start + len(y))
    sfx[start:end] += y[: end - start]
    placed.append({'debut_s': round(start / SR, 3), 'son': name, 'gain_db': round(gdb, 1)})

vo = load('audio/voix-koraly.mp3', 'highpass=f=70,acompressor=threshold=-22dB:ratio=2.5:attack=8:release=120:makeup=2')
voice = np.zeros((n, 2))
voice[: min(n, len(vo))] = vo[:n]

def fit(x):
    return x[:n] if len(x) >= n else np.concatenate([x, np.zeros((n - len(x), 2))])

tt = np.arange(n) / SR
stems = {k: S + 'musique-stem-' + k + '.mp3' for k in ('drums', 'bass', 'instruments', 'melody')}
if all(os.path.exists(p) for p in stems.values()):
    base = sum(fit(load(stems[k])) for k in ('drums', 'bass', 'instruments'))
    mel = fit(load(stems['melody']))
    rise = np.clip((tt - FINALE + 1.0) / 2.0, 0, 1)[:, None]
    mus = base + mel * (0.25 + 0.75 * rise)
else:
    mus = fit(load(S + 'musique-full.wav'))
mus *= np.clip(tt / 1.0, 0, 1)[:, None]

lvl = np.sqrt(np.convolve((voice ** 2).mean(1), np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same'))
active = (lvl > 10 ** (-38 / 20)).astype(float)
k = np.exp(-np.arange(int(0.4 * SR)) / (0.15 * SR)); k /= k.sum()
active = np.clip(np.convolve(active, k, 'full')[:n] * 1.6, 0, 1)
lift = 3.0 * np.clip((tt - FINALE) / 4.0, 0, 1)                 # la musique monte un peu pour la fin
mus *= (10 ** ((MUSIC_DB + lift - DUCK_DB * active) / 20))[:, None]

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
