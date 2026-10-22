"""Mix de la présentation iPhone 18 Pro Max sans voix : musique « Hotshot » (oomiee, 118 BPM) + bruitages Epidemic Sound.

Usage : python3 mix.py [sortie.wav] [dossier des pistes séparées]
Sons dans audio/epidemic/ (non versionnés, identifiants dans audio/SOURCES.md).
Le drop de la musique (107,29 s) tombe sur le temps 6 de la vidéo (révélation de l'iPhone) ;
au temps 45 (bulle « apple store kolwezi ») on saute 24 temps plus loin, sur le dernier coup du morceau (139,32 s).
"""
import subprocess, sys, random
import numpy as np

OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/mix.wav'
STEMS = sys.argv[2] if len(sys.argv) > 2 else None
SR, DUR = 48000, 26.0
T = 60 / 118
B = lambda n: n * T
DROP, END_HIT = 107.29, 139.32
E = 'audio/epidemic/'
random.seed(7)
n = int(DUR * SR)
t = np.arange(n) / SR
lerp = lambda a, b: np.clip((t - a) / (b - a), 0, 1)

def load(path, af=None):
    cmd = ['ffmpeg', '-v', 'error', '-i', path] + (['-af', af] if af else []) + ['-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    x = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32)
    return x.reshape(-1, 2).astype(np.float64)

def place(buf, x, t0):
    s = int(round(t0 * SR)); e = min(len(buf), s + len(x))
    if s < 0: x = x[-s:]; s = 0
    if e > s: buf[s:e] += x[:e - s]

# ── Musique : intro avant le drop, drop sur B(6), saut vers le coup final sur B(45)
song = load(E + 'musique.mp3')
start = DROP - B(6)
cut = B(45) - 0.03
a = song[int(start * SR): int((start + cut) * SR)]
b = song[int((END_HIT - 0.03) * SR):]
xf = int(0.02 * SR)
mus = np.zeros((n, 2))
place(mus, a, 0)
mus[int(cut * SR) - xf:int(cut * SR)] *= np.linspace(1, 0, xf)[:, None]
bb = b[: n - int(cut * SR) + xf].copy(); bb[:xf] *= np.linspace(0, 1, xf)[:, None]
place(mus, bb, cut - xf / SR)
env = lerp(0, 0.35) * (1 - lerp(DUR - 1.6, DUR) ** 1.4)
# Silence avant la révélation : la musique s'efface 0,3 s avant le drop
dip = 1 - 0.85 * (lerp(B(6) - 0.36, B(6) - 0.26) - lerp(B(6) - 0.02, B(6)))
# Grave de la musique un peu en retrait sous les deux impacts
mus *= (env * dip * 10 ** (-7 / 20))[:, None]

# ── Bruitages
def clip(name, ext='wav'):
    x = load(f'{E}sfx-{name}.{ext}', 'highpass=f=40,lowpass=f=14000')
    x /= np.abs(x).max() + 1e-9
    k = int(0.003 * SR); x[:k] *= np.linspace(0, 1, k)[:, None]
    f = int(0.04 * SR); x[-f:] *= np.linspace(1, 0, f)[:, None]
    lead = np.argmax(np.abs(x).sum(1)) / SR  # le pic du son tombe sur l'instant voulu
    return x, lead

CL = {k: clip(k) for k in ['click', 'tick', 'whoosh', 'riser', 'impact', 'chime']}
CL.update({k: clip(k, 'mp3') for k in ['pop', 'glasspop', 'shimmer']})
CLICK3 = [B(10.5), B(11.5), B(12.5), B(13.5)]
EV = [
    # 1 · Dynamic Island
    (0.12, 'pop', -24), (B(1) + 0.2, 'whoosh', -27), (B(1) + 0.3, 'glasspop', -27),
    (B(2) + 0.1, 'tick', -31), (B(2.5) + 0.1, 'tick', -31), (B(5) + 0.15, 'whoosh', -26),
    # 2 · Révélation : riser coupé avant le drop, impact sur le drop
    (B(6) - 0.32, 'riser', -20), (B(6) + 0.02, 'impact', -8),
    (B(7) + 0.1, 'tick', -29), (B(7.5) + 0.1, 'tick', -29), (B(8) + 0.1, 'tick', -29), (B(8.5) + 0.1, 'tick', -28),
    (B(9) + 0.12, 'whoosh', -26),
    # 3 · Couleurs
    (B(9.5) + 0.15, 'pop', -25),
] + [(c, 'click', -19) for c in CLICK3] + [(c + 0.12, 'whoosh', -31) for c in CLICK3[1:]] + [
    (B(15.65), 'whoosh', -21),
    # 4 · Caméra
    (B(16.5) + 0.2, 'whoosh', -28), (B(17) + 0.2, 'shimmer', -31),
] + [(s, 'tick', -24) for s in [B(18), B(19), B(20), B(21)]] + [(B(21) + 0.02, 'glasspop', -27), (B(22) + 0.12, 'whoosh', -27),
    # 5 · Puce
    (B(22.5) + 0.12, 'impact', -19), (B(22.5) + 0.1, 'glasspop', -23), (B(23.1), 'shimmer', -27),
    (B(24) + 0.1, 'tick', -30), (B(24.5) + 0.1, 'tick', -30), (B(25) + 0.12, 'tick', -32), (B(27) + 0.12, 'whoosh', -27),
    # 6 · Autonomie
    (B(27.6), 'whoosh', -23), (B(28) + 0.15, 'pop', -24),
] + [(B(28.5) + i * 0.05, 'tick', -37) for i in range(0, 21)] + [
    (B(30.5) + 0.03, 'chime', -22), (B(31) + 0.1, 'tick', -30), (B(31.5) + 0.1, 'tick', -31), (B(33) + 0.12, 'whoosh', -26),
    # 7 · Stockage
    (B(33.3) + 0.1, 'tick', -30), (B(33.8) + 0.1, 'tick', -30),
] + [(B(34.3 + i * 0.5) + 0.12, 'pop', -26) for i in range(4)] + [
    (B(37), 'click', -18), (B(37) + 0.02, 'glasspop', -25), (B(39) + 0.12, 'whoosh', -26),
    # 8 · Les 4 ensemble
] + [(B(39 + i * 0.5) + 0.18, 'whoosh', -29) for i in range(4)] + [
    (B(41) + 0.05, 'impact', -13), (B(41.25) + 0.1, 'tick', -30), (B(41.5) + 0.1, 'tick', -30), (B(41.75) + 0.1, 'tick', -29),
    (B(42.5) + 0.1, 'tick', -31), (B(44.4) + 0.15, 'whoosh', -26),
    # 9 · Signature
    (B(45) + 0.04, 'pop', -20), (B(45) + 0.06, 'chime', -15), (B(45.9), 'shimmer', -30),
]
sfx = np.zeros((n, 2))
for t0, name, g in EV:
    x, lead = CL[name]
    r = 1 + random.uniform(-0.025, 0.025)
    idx = np.arange(0, len(x) - 1, r)
    y = np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in range(2)], 1)
    pan = 0 if name in ('impact', 'chime', 'riser') else random.uniform(-0.15, 0.15)
    g += 0 if name in ('impact', 'riser') else 5  # les UI doivent passer au-dessus de la batterie
    y = y * 10 ** ((g + random.uniform(-0.5, 0.5)) / 20) * np.array([1 - pan, 1 + pan])
    place(sfx, y, t0 - lead / r)

mix = mus + sfx

def write(path, x, norm=True):
    raw = path + '.raw.wav'
    x = np.clip(x, -1, 1).astype(np.float32)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', raw], input=x.tobytes(), check=True)
    af = 'loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000' if norm else 'anull'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', af, '-ar', str(SR), '-c:a', 'pcm_s16le' if norm else 'pcm_s24le', path], check=True)
    subprocess.run(['rm', '-f', raw])

write(OUT, mix)
if STEMS:
    # Pistes séparées pour After Effects, au même gain que le mix final
    import os, re
    os.makedirs(STEMS, exist_ok=True)
    log = subprocess.run(['ffmpeg', '-hide_banner', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-af', 'ebur128', '-f', 'null', '-'],
                         input=np.clip(mix, -1, 1).astype(np.float32).tobytes(), capture_output=True).stderr.decode()
    lufs = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', log)[-1])
    g = min(10 ** ((-14 - lufs) / 20), 10 ** (-1 / 20) / max(np.abs(mus).max(), np.abs(sfx).max()))
    for name, x in [('musique', mus), ('bruitages', sfx)]:
        write(f'{STEMS}/{name}.wav', x * g, norm=False)
    print('gain des pistes', round(20 * np.log10(g), 2), 'dB')
print('ok', OUT)
