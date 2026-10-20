"""Mix de la présentation iPhone 18 Pro Max : voix Hugo, musique « The Story So Far » et bruitages Epidemic Sound.

Usage : python3 mix.py [sortie.wav] [dossier des pistes séparées]
Les sons Epidemic sont dans audio/epidemic/ (non versionnés, identifiants dans audio/SOURCES.md).
La voix est découpée phrase par phrase (SEG) et posée sur les scènes de src/Video.jsx.
La musique démarre à 75,74 s pour que sa reprise (82,74 s) tombe sur le passage au noir (7,0 s).
"""
import subprocess, sys, random
import numpy as np

OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/mix.wav'
STEMS = sys.argv[2] if len(sys.argv) > 2 else None
SR, DUR = 48000, 35.5
MUSIC_START, MUSIC_DB, DUCK_DB = 75.74, -13.0, 6.0
E = 'audio/epidemic/'
random.seed(18)

def load(path, af=None):
    cmd = ['ffmpeg', '-v', 'error', '-i', path]
    if af:
        cmd += ['-af', af]
    cmd += ['-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    x = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32)
    return x.reshape(-1, 2).astype(np.float64)

def fade(x, a=0.015, b=0.03):
    fa, fb = int(a * SR), int(b * SR)
    x = x.copy()
    x[:fa] *= np.linspace(0, 1, fa)[:, None]
    x[-fb:] *= np.linspace(1, 0, fb)[:, None]
    return x

def place(buf, x, t0):
    s = int(round(t0 * SR))
    e = min(len(buf), s + len(x))
    if e > s:
        buf[s:e] += x[:e - s]

n = int(DUR * SR)

# Voix : (début source, fin source, instant vidéo du début)
SEG = [
    (0.00, 2.55, 0.55),   # Voici l'iPhone 18 Pro Max
    (2.60, 5.20, 4.00),   # Un design unibody en aluminium
    (5.60, 6.35, 7.38),   # Noir
    (6.60, 7.20, 8.75),   # Argent
    (7.38, 8.10, 10.00),  # Glacier
    (8.25, 9.20, 11.08),  # Et bordeaux
    (9.40, 17.90, 12.90), # Sa caméra Fusion 48 mégapixels… de ƒ/1,48 à ƒ/4
    (18.10, 22.30, 21.80),# Puce A20 Pro. Jusqu'à 43 heures de vidéo
    (22.40, 24.95, 26.40),# Et jusqu'à 2 téraoctets de stockage
    (25.10, 28.20, 29.95),# Disponible maintenant chez Apple Store Kolwezi
]
raw = load('audio/voix-hugo.mp3', 'highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2')
voice = np.zeros((n, 2))
active = np.zeros(n)
for a, b, t0 in SEG:
    seg = fade(raw[int(a * SR):int(b * SR)])
    place(voice, seg, t0)
    s = int(t0 * SR); active[s:s + len(seg)] = 1

# Musique : démarrage décalé, fondu d'entrée court, fondu de sortie sur la fin
mus = load(E + 'musique.mp3', f'atrim=start={MUSIC_START},asetpts=PTS-STARTPTS')[:n]
mus = np.pad(mus, ((0, n - len(mus)), (0, 0)))
t = np.arange(n) / SR
env = np.clip(t / 0.6, 0, 1) * np.clip((DUR - t) / 2.2, 0, 1) ** 1.5
k = int(0.25 * SR)
duck = np.convolve(active, np.ones(k) / k, 'same')
gain = 10 ** ((MUSIC_DB - DUCK_DB * duck) / 20)
mus = mus * (env * gain)[:, None]

# Bruitages
def clip(name):
    x = load(E + 'sfx-' + name + '.mp3', 'lowpass=f=12000')
    x = fade(x, 0.002, 0.03)
    x /= np.abs(x).max() + 1e-9
    lead = np.argmax(np.abs(x).sum(1)) / SR  # le pic tombe sur l'instant voulu
    return x, lead

CL = {k: clip(k) for k in ['pop', 'click', 'whoosh', 'shimmer', 'riser', 'glasspop', 'shutter']}
EV = [
    (0.9, 'click', -27), (1.4, 'click', -27), (2.0, 'click', -26),           # mots du titre
    (3.75, 'whoosh', -25),                                                    # le titre se range
    (4.05, 'whoosh', -31), (4.3, 'whoosh', -31), (4.55, 'whoosh', -31), (4.8, 'whoosh', -30),  # cascade des iPhone
    (7.0, 'riser', -23),                                                      # passage au noir
    (7.55, 'click', -25), (8.8, 'click', -25), (10.05, 'click', -25), (11.3, 'click', -24),  # couleurs
    (8.72, 'whoosh', -31), (9.97, 'whoosh', -31), (11.22, 'whoosh', -31),
    (12.35, 'whoosh', -24),                                                   # sortie du noir
    (13.4, 'whoosh', -29),                                                    # zoom caméra
    (14.4, 'glasspop', -26),                                                  # diaphragme et puces
    (18.45, 'shutter', -21), (20.2, 'shutter', -23), (20.5, 'shutter', -23), (20.8, 'shutter', -20),
    (21.6, 'whoosh', -27),
    (22.05, 'glasspop', -24), (22.15, 'shimmer', -29),                        # A20 Pro
    (24.4, 'pop', -24),                                                       # 43 h
] + [(24.45 + i * 0.1, 'click', -36) for i in range(9)] + [                 # compteur
    (26.2, 'whoosh', -27),
    (26.38, 'pop', -31), (26.47, 'pop', -31), (26.56, 'pop', -31), (26.65, 'pop', -31),  # puces de stockage
    (27.3, 'click', -21), (27.32, 'glasspop', -23),                           # clic sur 2 To
    (29.65, 'whoosh', -25),
    (31.35, 'riser', -27),                                                    # le nom se dévoile
    (32.6, 'shimmer', -25),
]
sfx = np.zeros((n, 2))
for t0, name, g in EV:
    x, lead = CL[name]
    r = 1 + random.uniform(-0.02, 0.02)
    idx = np.arange(0, len(x) - 1, r)
    y = np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in range(2)], 1)
    pan = random.uniform(-0.12, 0.12)
    y = y * 10 ** ((g + random.uniform(-0.6, 0.6)) / 20) * np.array([1 - pan, 1 + pan])
    place(sfx, y, max(0, t0 - lead / r))

mix = voice + mus + sfx

def write(path, x, norm=True):
    raw = path + '.raw.wav'
    x = np.clip(x, -1, 1).astype(np.float32)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', raw], input=x.tobytes(), check=True)
    af = 'loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000' if norm else 'anull'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', af, '-ar', str(SR), '-c:a', 'pcm_s16le' if norm else 'pcm_s24le', path], check=True)
    subprocess.run(['rm', '-f', raw])

write(OUT, mix)
if STEMS:
    # Pistes séparées (projet After Effects) : même gain que le mix final, pour que leur somme sonne comme lui
    import os, re
    os.makedirs(STEMS, exist_ok=True)
    m = np.clip(mix, -1, 1).astype(np.float32).tobytes()
    log = subprocess.run(['ffmpeg', '-hide_banner', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-af', 'ebur128', '-f', 'null', '-'],
                         input=m, capture_output=True).stderr.decode()
    lufs = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', log)[-1])
    g = 10 ** ((-14 - lufs) / 20)
    g = min(g, 10 ** (-1 / 20) / max(np.abs(voice).max(), np.abs(mus).max(), np.abs(sfx).max()))  # pas d'écrêtage
    for name, x in [('voix', voice), ('musique', mus), ('bruitages', sfx)]:
        write(f'{STEMS}/{name}.wav', x * g, norm=False)
    print('gain des pistes', round(20 * np.log10(g), 2), 'dB')
print('ok', OUT)
