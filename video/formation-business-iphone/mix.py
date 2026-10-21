"""Mix de la pub « Formation business iPhone » : voix de l'avatar (inchangée, calée sur l'image),
musique « Moving Up » et un bruitage Epidemic Sound par élément animé.

Usage : python3 mix.py [sortie.wav] [dossier des pistes séparées]
Les sons sont dans audio/epidemic/ (non versionnés, identifiants dans audio/SOURCES.md).
Les instants de EV sont ceux de src/Video.jsx (voix-mots.json).
"""
import subprocess, sys, random
import numpy as np

OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/mix.wav'
STEMS = sys.argv[2] if len(sys.argv) > 2 else None
SR, DUR = 48000, 40.95
MUSIC_START, MUSIC_DB, DUCK_DB = 1.0, -15.0, 7.0
E = 'audio/epidemic/'
random.seed(6)

def load(path, af=None):
    cmd = ['ffmpeg', '-v', 'error', '-i', path, '-vn']
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

# Voix de l'avatar : posée à 0 s, sans découpe (synchro labiale)
voice = load('public/avatar.mp4', 'highpass=f=70,acompressor=threshold=-20dB:ratio=2.2:attack=8:release=120:makeup=1.5')[:n]
voice = np.pad(voice, ((0, n - len(voice)), (0, 0)))
env_v = np.abs(voice).mean(1)
k = int(0.3 * SR)
active = np.clip(np.convolve(env_v, np.ones(k) / k, 'same') / (env_v.max() * 0.08), 0, 1)

# Musique : la fin de l'edit (42 s) tombe sur la fin de la vidéo
mus = load(E + 'musique.wav', f'atrim=start={MUSIC_START},asetpts=PTS-STARTPTS')[:n]
mus = np.pad(mus, ((0, n - len(mus)), (0, 0)))
t = np.arange(n) / SR
env = np.clip(t / 0.25, 0, 1) * np.clip((DUR - t) / 0.4, 0, 1)
gain = 10 ** ((MUSIC_DB - DUCK_DB * active) / 20)
mus = mus * (env * gain)[:, None]

# Bruitages
def clip(name, maxlen=None):
    x = load(E + 'sfx-' + name + '.mp3', 'lowpass=f=13000')
    if maxlen:
        x = x[:int(maxlen * SR)]
    x = fade(x, 0.002, 0.04)
    PEAK[name] = float(np.abs(x).max() + 1e-9)
    x /= PEAK[name]
    lead = np.argmax(np.abs(x).sum(1)) / SR  # le pic tombe sur l'instant voulu
    return x, lead

PEAK = {}
NAMES = ['whoosh', 'swoosh', 'pop', 'pop2', 'tap', 'tick', 'riser', 'impact', 'success', 'notif', 'calc', 'mouse', 'shimmer', 'select', 'trans']
CL = {k: clip(k) for k in NAMES}
CL['keys'] = clip('keys', 1.9)
CL['keys'] = (CL['keys'][0], 0.0)
CL['riser'] = (CL['riser'][0], len(CL['riser'][0]) / SR)  # le riser se termine sur l'instant voulu
CL['trans'] = (CL['trans'][0], CL['trans'][1])

EV = [
    # 1 · avatar plein écran, carte « Le business d'iPhone »
    (0.35, 'whoosh', -27), (0.62, 'pop', -29), (0.82, 'pop', -29), (1.62, 'tick', -31), (2.04, 'tick', -31), (2.92, 'select', -26),
    # 2 · cadre partagé, recherche, chemins, pastilles
    (3.45, 'trans', -25), (3.6, 'swoosh', -31), (3.75, 'keys', -31), (4.55, 'swoosh', -34),
    (5.02, 'pop2', -28), (5.27, 'pop2', -28), (5.52, 'pop2', -27),
    # 3 · 150 000 FC
    (6.45, 'trans', -27), (6.74, 'tick', -30), (8.05, 'riser', -31),
] + [(7.18 + i * 0.075, 'tick', -39) for i in range(11)] + [
    (8.06, 'impact', -27), (9.03, 'swoosh', -31), (9.52, 'success', -27),
    # 4 · couverture de la formation
    (10.25, 'whoosh', -26), (10.47, 'pop', -31), (10.62, 'pop', -31), (10.42, 'tick', -30), (10.9, 'tick', -30), (11.82, 'tick', -29), (11.95, 'shimmer', -33),
    # 5 · « Tu vas apprendre »
    (12.52, 'trans', -27), (12.6, 'swoosh', -31),
] + [(12.87 + i * 0.13, 'tick', -34) for i in range(4)] + [
    # 6 · où acheter
    (14.32, 'whoosh', -28), (14.4, 'tick', -31), (14.78, 'swoosh', -29), (15.22, 'success', -27), (15.82, 'swoosh', -32), (16.32, 'tap', -29),
    # 7 · rentabilité
    (17.22, 'whoosh', -28), (17.44, 'tick', -31), (17.62, 'swoosh', -29), (17.82, 'calc', -27), (18.12, 'calc', -27),
] + [(18.47 + i * 0.085, 'tick', -39) for i in range(10)] + [(19.42 + i * 0.12, 'pop', -33) for i in range(7)] + [
    (20.22, 'select', -27),
    # 8 · budget et modèles
    (20.82, 'whoosh', -28), (21.06, 'tick', -31), (21.22, 'swoosh', -30), (21.47, 'whoosh', -33),
    (21.92, 'tap', -30), (22.0, 'swoosh', -33), (22.32, 'select', -28), (22.92, 'tap', -30), (22.98, 'swoosh', -33), (23.12, 'select', -28),
    # 9 · réseaux
    (23.82, 'whoosh', -28), (24.14, 'tick', -31), (24.57, 'notif', -27), (25.07, 'notif', -29), (25.57, 'notif', -31),
    (26.04, 'pop2', -25), (26.74, 'pop2', -25), (27.46, 'pop2', -24),
    # 10 · avatar plein écran
    (28.22, 'trans', -25), (28.35, 'swoosh', -30), (30.22, 'tick', -31), (30.82, 'tick', -31),
    # 11 · claire, concrète, rentable
    (31.82, 'trans', -26), (32.42, 'tick', -31), (33.88, 'pop2', -26), (34.52, 'pop2', -26), (35.38, 'pop2', -25), (35.4, 'impact', -29),
    # 12 · appel à l'action
    (36.22, 'whoosh', -27), (36.38, 'swoosh', -31), (36.58, 'swoosh', -30), (37.24, 'mouse', -21), (38.32, 'tick', -31),
    (39.47, 'swoosh', -30), (40.17, 'tick', -30), (40.32, 'shimmer', -29),
]
sfx = np.zeros((n, 2))
placed = []  # pour After Effects : un calque par bruitage
for t0, name, g in EV:
    x, lead = CL[name]
    r = 1 + random.uniform(-0.02, 0.02)
    idx = np.arange(0, len(x) - 1, r)
    y = np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in range(2)], 1)
    pan = random.uniform(-0.12, 0.12)
    y = y * 10 ** ((g + random.uniform(-0.6, 0.6)) / 20) * np.array([1 - pan, 1 + pan])
    place(sfx, y, max(0, t0 - lead / r))
    placed.append({'t': round(max(0, t0 - lead / r), 4), 'son': name, 'db': round(g - 20 * np.log10(PEAK[name]), 2)})

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
    # Pistes séparées (projets After Effects) : même gain que le mix final
    import os, re
    os.makedirs(STEMS, exist_ok=True)
    m = np.clip(mix, -1, 1).astype(np.float32).tobytes()
    log = subprocess.run(['ffmpeg', '-hide_banner', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-af', 'ebur128', '-f', 'null', '-'],
                         input=m, capture_output=True).stderr.decode()
    lufs = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', log)[-1])
    g = 10 ** ((-14 - lufs) / 20)
    g = min(g, 10 ** (-1 / 20) / max(np.abs(voice).max(), np.abs(mus).max(), np.abs(sfx).max()))
    for name, x in [('voix', voice), ('musique', mus), ('bruitages', sfx)]:
        write(f'{STEMS}/{name}.wav', x * g, norm=False)
    print('gain des pistes', round(20 * np.log10(g), 2), 'dB')
    import json
    json.dump({'gain_db': round(20 * np.log10(g), 2), 'bruitages': placed}, open(f'{STEMS}/bruitages.json', 'w'), ensure_ascii=False, indent=1)
print('ok', OUT, len(EV), 'bruitages')
