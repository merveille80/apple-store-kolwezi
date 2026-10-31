# Mixage audio de la spec ad AirPods Pro 3 (11,1 s).
#   python3 mix.py <dossier_sons> <dossier_sortie>
# Entrées (non versionnées, licence Epidemic Sound) : musique-the-mood.wav et
# les bruitages. Sorties : stems WAV 48 kHz (musique, bruitages, un fichier par
# bruitage calé sur la timeline) et master normalisé −14 LUFS / −1 dBTP.
import sys, os, json, subprocess
import numpy as np
from scipy.signal import butter, sosfilt

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(os.path.join(OUT, 'bruitages'), exist_ok=True)
SR = 48000
DUR = 11.1
N = int(round(DUR * SR))

def load(name):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(SRC, name), '-ac', '2', '-ar', str(SR),
                        '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(p, np.float32).reshape(-1, 2).astype(np.float64)

def save(path, x):
    x = np.clip(x, -1, 1).astype(np.float32)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-',
                    '-c:a', 'pcm_s24le', path], input=x.tobytes(), check=True)

def db(g): return 10 ** (g / 20)
def ramp(n, a, b): return np.linspace(a, b, n)[:, None]

# ---------- musique : « The Mood » (Heyson), 126 BPM ----------
# Drop de la source à 30,00 s calé sur 1,90 s (apparition du boîtier).
# A (0–1,4 s) : 1,4 s prises deux mesures après le drop (grosse caisse nette).
# B (1,4–1,9 s) : la respiration d'avant-drop de la source (29,50–30,00 s),
#   filtrée passe-bas et baissée → quasi-silence tendu.
# Puis la source continue en plein à partir de 30,00 s ; fondu de sortie 0,6 s.
mus = load('musique-the-mood.wav')
DROP_SRC, DROP_T = 30.00, 1.90
BAR = 4 * 60 / 126
A_SRC = DROP_SRC + 2 * BAR
music = np.zeros((N, 2))
nA = int(1.4 * SR)
a = mus[int(A_SRC * SR): int(A_SRC * SR) + nA].copy()
a[-int(0.12 * SR):] *= ramp(int(0.12 * SR), 1, 0)  # évite un clic à la coupe au noir
music[:nA] = a
off = int((DROP_SRC - DROP_T) * SR)  # source = t + 28,10 s
rest = mus[off + nA: off + N]
b_len = int((DROP_T - 1.4) * SR)
sos = butter(4, 700, 'low', fs=SR, output='sos')
bseg = sosfilt(sos, rest[:b_len], axis=0) * db(-8)
rest = rest.copy(); rest[:b_len] = bseg
music[nA:] = rest[:N - nA]
nf = int(0.6 * SR)
music[-nf:] *= ramp(nf, 1, 0) ** 2

# ---------- bruitages ----------
# 'peak' : le maximum du son tombe sur l'image (whooshes : attaque avant) ;
# 'onset' : le début du transitoire tombe sur l'image.
CUES = [
    (0.00, 'whoosh-soft.wav', 'onset', -9, 0, 'titre'),
    (1.40, 'boom-low.wav', 'onset', -14, 0, 'coupe au noir'),
    (1.90, 'boom-deep.wav', 'onset', -3, 0, 'boîtier (impact principal)'),
    (2.40, 'clic-couvercle.wav', 'onset', -2, 0, 'ouverture du couvercle'),
    (2.55, 'whoosh-soft.wav', 'peak', -6, 0, 'écouteurs qui montent'),
    (3.82, 'tick-ui.wav', 'onset', -6, 0, '« Rebuilt »'),
    (3.89, 'tick-ui.wav', 'onset', -8, 1, '« from »'),
    (3.96, 'tick-ui.wav', 'onset', -8, 2, '« the »'),
    (4.03, 'tick-ui.wav', 'onset', -8, 3, '« ground »'),
    (4.15, 'tick-dull.wav', 'onset', -5, 0, '« up »'),
    (4.40, 'whoosh-tonal.wav', 'peak', -7, 0, 'macro sur la paire'),
    (5.92, 'tick-ui.wav', 'onset', -7, 0, 'embout L'),
    (6.05, 'tick-ui.wav', 'onset', -7, 1, 'embout M'),
    (6.18, 'tick-ui.wav', 'onset', -7, 2, 'embout S'),
    (6.31, 'tick-ui.wav', 'onset', -7, 3, 'embout XS'),
    (6.00, 'tick-dull.wav', 'onset', -7, 0, '« Fit, finally figured out. »'),
    (7.30, 'tick-ui.wav', 'onset', -6, 0, '« Touch »'),
    (7.45, 'hum-neon.wav', 'onset', -16, 0, 'capteur qui s’allume (0,8 s)'),
    (7.75, 'tick-ui.wav', 'onset', -6, 2, '« control »'),
    (8.80, 'whoosh-tonal.wav', 'peak', -7, 0, 'paire héros'),
    (10.00, 'boom-low.wav', 'onset', -6, 0, 'logo Apple'),
]
PITCH = [1.0, 1.06, 1.12, 1.19]  # légères variations de hauteur (tick)
cache = {}
def sfx(name, pitch):
    k = (name, pitch)
    if k not in cache:
        x = load(name)
        if pitch != 1.0:  # rééchantillonnage simple = hauteur + durée
            idx = np.arange(0, len(x) - 1, pitch)
            x = np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in range(2)], 1)
        cache[k] = x
    return cache[k]

def anchor(x, mode):
    env = np.abs(x).max(1)
    if mode == 'peak':
        w = int(0.01 * SR)
        sm = np.convolve(env, np.ones(w) / w, 'same')
        return int(np.argmax(sm))
    thr = env.max() * 0.1
    return int(np.argmax(env > thr))

fx = np.zeros((N, 2))
sheet = []
for i, (t, name, mode, gain, pv, label) in enumerate(CUES):
    x = sfx(name, PITCH[pv]) * db(gain)
    if name == 'hum-neon.wav':  # court : 0,8 s avec fondu
        L = int(0.8 * SR); x = x[:L].copy()
        x *= np.minimum(ramp(L, 0, 1) * 6, 1) * ramp(L, 1, 0) ** 0.7
    a0 = anchor(x, mode)
    start = int(round(t * SR)) - a0
    s0 = max(0, start); s1 = min(N, start + len(x))
    if s1 <= s0: continue
    seg = x[s0 - start: s1 - start]
    fx[s0:s1] += seg
    stem = np.zeros((N, 2)); stem[s0:s1] = seg
    fn = f'{i + 1:02d}_{t:05.2f}s_{os.path.splitext(name)[0]}.wav'
    save(os.path.join(OUT, 'bruitages', fn), stem)
    sheet.append(dict(t=t, file=name, stem=fn, gain_db=gain, pitch=PITCH[pv], align=mode,
                      start=round(start / SR, 4), label=label))

save(os.path.join(OUT, 'musique.wav'), music)
save(os.path.join(OUT, 'bruitages.wav'), fx)
pre = os.path.join(OUT, 'mix-brut.wav')
save(pre, music * db(-3) + fx)

# master : −14 LUFS intégrés, −1 dBTP (loudnorm en deux passes)
m = subprocess.run(['ffmpeg', '-hide_banner', '-i', pre, '-af', 'loudnorm=I=-14:TP=-1:LRA=11:print_format=json',
                    '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
      f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', pre, '-af', af + ',aresample=48000', '-c:a', 'pcm_s24le',
                '-t', str(DUR), os.path.join(OUT, 'master.wav')], check=True)
os.remove(pre)
json.dump(dict(music=dict(source='ES_The Mood - Heyson', drop_src=DROP_SRC, drop_t=DROP_T, a_src=round(A_SRC, 3)),
               cues=sheet), open(os.path.join(OUT, 'cues.json'), 'w'), indent=1, ensure_ascii=False)
print('OK', OUT)
