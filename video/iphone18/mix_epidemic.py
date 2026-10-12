"""Mix v3 de la pub iPhone 18 Pro Max : même voix Théo (v2, prise 1), même son de merveille, bruitages Epidemic Sound.

Usage : python3 mix_epidemic.py <musique.wav> <sortie.wav> [dossier des pistes séparées]
Les bruitages sont dans audio/epidemic/ (WAV Epidemic Sound, liste et identifiants dans audio/epidemic/SOURCES.md).
Les instants sont en secondes vidéo, comme T dans src/Video.jsx ; la voix est décalée de VO_OFF.
Avec un dossier en 3e argument, écrit aussi voix.wav, musique.wav, bruitages.wav et bruitages.json
(un bruitage par ligne : instant, fichier, gain) pour monter chaque son sur sa propre piste dans invideo.
"""
import json, os, subprocess, sys, random, wave
import numpy as np

MUSIC, OUT = sys.argv[1:3]
STEMS = sys.argv[3] if len(sys.argv) > 3 else None
SR, DUR, VO_OFF = 48000, 48.5, 0.36
MUSIC_DB = -10.0
DROP, BEAT = 16.55, 2.0287 / 4  # grille du son de merveille
S = 'audio/epidemic/'
random.seed(11)

def load(path, af=None):
    cmd = ['ffmpeg', '-v', 'error', '-i', path]
    if af:
        cmd += ['-af', af]
    cmd += ['-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    x = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32)
    return x.reshape(-1, 2).astype(np.float64)

def clip(name, af=None):
    x = load(S + name + '.wav', af)
    f = int(0.002 * SR); x[:f] *= np.linspace(0, 1, f)[:, None]
    f2 = int(0.03 * SR); x[-f2:] *= np.linspace(1, 0, f2)[:, None]
    x /= np.abs(x).max() + 1e-9
    lead = np.argmax(np.abs(x).sum(1)) / SR  # on cale le pic du son sur l'instant voulu
    return x, lead

# Les sons très aigus sont légèrement adoucis pour rester discrets sous la voix
SOFT = 'lowpass=f=9000'
C = {n: clip(n, SOFT if n in ('tic', 'wsoft', 'riser', 'batterie') else None) for n in [
    'coupure', 'batterie', 'erreur', 'wsoft', 'wlight', 'whit', 'tglass', 'tsimple', 'tdull',
    'boom', 'boomlow', 'riser', 'obtu', 'tic', 'csoft', 'cdigital', 'cbright']}
TAPS = ['tglass', 'tsimple', 'tdull']
_ti = [0]
def tap():
    _ti[0] = (_ti[0] + 1) % len(TAPS)
    return TAPS[_ti[0]]

w = lambda x: x + VO_OFF
beat = lambda k: DROP + k * BEAT
EV = [
    (0.00, 'coupure', -9),                       # la lumière se coupe
    (w(2.28), 'batterie', -19),                  # « trois pour cent »
    (5.43, 'wsoft', -19),                        # passage au blanc
    (w(7.314), 'tap', -21), (w(9.867), 'tap', -21), (w(11.04), 'tap', -21),
    (w(11.667), 'erreur', -20),                  # « saturé »
    (13.75, 'wlight', -16),                      # les cartes s'envolent
    (w(15.64), 'tap', -19),                      # pilule « lâcher »
    (DROP - 0.02, 'riser', -17),                 # montée qui culmine sur le retour du son
    (DROP, 'boom', -9),                          # grand retour du son : « Voici »
    (18.75, 'whit', -18),
] + [(beat(k), 'tic', -25) for k in range(5, 11)] + [
    (21.6, 'cdigital', -24),                     # 23:00
    (22.3, 'wlight', -18),
    (w(22.84), 'obtu', -11),                     # déclic sur « nettes »
    (26.75, 'wsoft', -19),
] + [(w(26.52) + k * 0.125, 'tap', -26) for k in range(12)] + [
    (w(29.968), 'cbright', -25),                 # l'alerte disparaît
    (30.75, 'wlight', -18),                      # scène couleurs
    (w(30.576), 'csoft', -24), (w(31.44), 'cdigital', -24), (w(32.07), 'cbright', -25), (w(32.8), 'csoft', -24),
    (34.75, 'whit', -18),
    (w(35.12), 'tap', -21),
    (w(36.871), 'csoft', -21), (w(38.208), 'cdigital', -21),
    (39.89, 'wsoft', -17),
    (39.89, 'boomlow', -11),                     # le téléphone arrive
    (w(43.72), 'tap', -20),
    (w(44.267), 'tap', -17),                     # clic sur WhatsApp
    (46.92, 'csoft', -20),                       # logo final, sur la dernière frappe du son
]

n = int(DUR * SR)
sfx = np.zeros((n, 2))
placed = []
for t0, name, g in EV:
    if name == 'tap':
        name = tap()
    x, lead = C[name]
    r = 1 + random.uniform(-0.03, 0.03)
    idx = np.arange(0, len(x) - 1, r)
    y = np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in range(2)], 1)
    gdb = g + random.uniform(-1, 1)
    pan = random.uniform(-0.2, 0.2)
    y = y * 10 ** (gdb / 20) * np.array([1 - pan, 1 + pan])
    start = int(max(0, t0 - lead / r) * SR)
    end = min(n, start + len(y))
    sfx[start:end] += y[: end - start]
    placed.append({'debut_s': round(start / SR, 3), 'son': name, 'gain_db': round(gdb, 1), 'vitesse': round(r, 3)})

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

def write(path, x):
    with wave.open(path, 'wb') as wf:
        wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR)
        wf.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())

mix = voice + sfx + mus
tmp = 'audio/mix.raw.wav'
write(tmp, mix)
# même gain de sortie pour le mix et les pistes séparées : on mesure ce que loudnorm applique
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9,alimiter=limit=0.89,aresample=48000', '-ar', '48000', OUT], check=True)
if STEMS:
    os.makedirs(STEMS, exist_ok=True)
    gain = np.sqrt((load(OUT) ** 2).mean() / ((mix ** 2).mean() + 1e-12))
    for nm, x in (('voix', voice), ('musique', mus), ('bruitages', sfx)):
        write(os.path.join(STEMS, nm + '.wav'), x * gain)
    json.dump({'gain_sortie_db': round(20 * np.log10(gain), 2), 'bruitages': placed}, open(os.path.join(STEMS, 'bruitages.json'), 'w'), ensure_ascii=False, indent=1)
os.remove(tmp)
print('ok', OUT, 'peak mix', float(np.abs(mix).max()))
