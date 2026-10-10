"""Fond musical de la pub iPhone 18 Pro Max v2 : le son de merveille (audio/son-merveille.mp3), adapté à la vidéo.

Usage : python3 musique.py <sortie.wav>
- Le grand retour du son (58,36 s dans le fichier) tombe sur DROP (« Voici l'iPhone 18 Pro Max »).
- Avant : fondu d'entrée après l'accroche, puis le passage calme du son (relevé de quelques dB) sous les galères.
- Pour tenir jusqu'au logo, 4 mesures du passage fort sont rejouées une fois (saut calé à l'échantillon près).
- La dernière frappe du son tombe sur le logo final, puis fondu de sortie.
"""
import subprocess, sys, wave
import numpy as np

OUT = sys.argv[1]
SR, DUR = 48000, 48.5
SRC = 'audio/son-merveille.mp3'
DROP_SONG, DROP = 58.373, 16.55          # grand retour du son → « Voici »
BAR = 2.0287                            # ~118,3 BPM (grille ajustée sur les frappes du son)
JUMP_FROM = DROP_SONG + 8 * BAR - 0.03        # fin de phrase (8 mesures après le retour)
JUMP_TO = DROP_SONG + 4 * BAR - 0.03         # on rejoue les mesures 4 à 7
FADE_IN = (2.6, 5.2)                    # secondes vidéo
BREAK = (49.6, 58.2, 9.0)               # passage calme du son relevé de +9 dB
FADE_OUT = (47.0, 48.5)

x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', SRC, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'],
                                 capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).astype(np.float64)

# affiner le point de retour : meilleure corrélation autour de JUMP_TO (±4 ms)
a = int(JUMP_FROM * SR); L = int(0.25 * SR)
ref = x[a:a + L].mean(1)
best, bj = -1e9, int(JUMP_TO * SR)
for j in range(int((JUMP_TO - 0.004) * SR), int((JUMP_TO + 0.004) * SR), 2):
    c = float(np.dot(ref, x[j:j + L].mean(1)))
    if c > best:
        best, bj = c, j
start = int((DROP_SONG - DROP) * SR)
part1 = x[start:a]
part2 = x[bj:]
xf = int(0.012 * SR)
ramp = np.linspace(0, 1, xf)[:, None]
part2 = part2.copy()
part2[:xf] = part2[:xf] * ramp + x[a:a + xf] * (1 - ramp)
y = np.concatenate([part1, part2])
n = int(DUR * SR)
y = y[:n] if len(y) >= n else np.concatenate([y, np.zeros((n - len(y), 2))])

t = np.arange(n) / SR
song_t = np.where(t < (a - start) / SR, t + DROP_SONG - DROP, t - (a - start) / SR + bj / SR)
g_db = np.zeros(n)
b0, b1, bg = BREAK
inb = np.clip(np.minimum((song_t - b0) / 0.6, (b1 - song_t) / 0.15), 0, 1)
g_db += bg * inb
g = 10 ** (g_db / 20)
fi = np.clip((t - FADE_IN[0]) / (FADE_IN[1] - FADE_IN[0]), 0, 1) ** 2
fo = np.clip((FADE_OUT[1] - t) / (FADE_OUT[1] - FADE_OUT[0]), 0, 1) ** 1.5
y *= (g * fi * fo)[:, None]

with wave.open(OUT, 'wb') as wf:
    wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR)
    wf.writeframes((np.clip(y, -1, 1) * 32767).astype('<i2').tobytes())
print('ok', OUT, 'saut', round(JUMP_FROM, 3), '→', round(bj / SR, 3), 'vidéo', round((a - start) / SR, 3), 's')
