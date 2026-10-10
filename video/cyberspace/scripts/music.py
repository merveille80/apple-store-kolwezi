"""Fond musical rythmé (tech / corporate motivant, 120 BPM) composé en code et calé sur la v2.

Usage : python3 music.py <sortie.wav>
Les temps forts tombent sur les révélations : drop au logo (10,17 s), respiration sur « Et en plus ? »,
montée avant « Vous avez un projet ? », drop final sur le logo de fin (43,67 s).
Calé sur la VO Théo balisée (remap du 2026-10-10) ; pour une autre VO, recaler PHI et les mesures ci-dessous.
"""
import sys, wave
import numpy as np

SR = 48000
DUR = 50.5
BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT
PHI = 0.169                    # premier temps fort calé pour que le drop tombe sur le logo (10,17 s)
N = int(DUR * SR)
rng = np.random.default_rng(3)

def b2t(bar, beat=0.0):
    return PHI + bar * BAR + beat * BEAT

def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)

def env_exp(n, tau):
    return np.exp(-np.arange(n) / SR / tau)

def fft_filter(x, lo=None, hi=None, order=2):
    """Filtre passe-bande doux, phase nulle (sur tout le signal, mono ou stéréo)."""
    X = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(x.shape[0], 1 / SR)
    g = np.ones_like(f)
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (2 * order))
    if hi:
        g *= 1 / np.sqrt(1 + (f / hi) ** (2 * order))
    if x.ndim == 2:
        g = g[:, None]
    return np.fft.irfft(X * g, n=x.shape[0], axis=0)

# ---------- oscillateurs à table d'onde (scie à bande limitée)
TL = 4096
_tables = {}
def saw_table(nh):
    nh = int(max(1, min(nh, 200)))
    if nh not in _tables:
        ph = np.arange(TL) / TL * 2 * np.pi
        k = np.arange(1, nh + 1)
        _tables[nh] = (np.sin(np.outer(ph, k)) / k).sum(1) * (2 / np.pi)
    return _tables[nh]

def saw(freq, n, cutoff=8000, phase=None):
    tab = saw_table(cutoff / freq)
    ph = (phase if phase is not None else rng.random()) + np.arange(n) * freq / SR
    return tab[((ph % 1) * TL).astype(int)]

def place(buf, x, t, gain=1.0, pan=0.0):
    s = int(round(t * SR))
    if s >= N or s + len(x) <= 0:
        return
    a, b = max(0, s), min(N, s + len(x))
    y = x[a - s: b - s] * gain
    if y.ndim == 1:
        y = np.stack([y * (1 - pan), y * (1 + pan)], 1)
    buf[a:b] += y

# ---------- instruments
def kick():
    n = int(0.42 * SR)
    t = np.arange(n) / SR
    f = 52 + 110 * np.exp(-t / 0.035)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.15)
    click = rng.standard_normal(n) * np.exp(-t / 0.003) * 0.25
    return np.tanh(1.6 * (body + click))

def clap():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    e = np.zeros(n)
    for d in (0, 0.011, 0.022):
        e += (t >= d) * np.exp(-np.maximum(t - d, 0) / 0.006)
    e += (t >= 0.03) * np.exp(-np.maximum(t - 0.03, 0) / 0.11) * 0.8
    noise = fft_filter(rng.standard_normal(n), 900, 7000) * e
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.04) * 0.4
    x = noise + body
    return x / np.abs(x).max()

def hat(open_=False):
    n = int((0.28 if open_ else 0.07) * SR)
    x = fft_filter(rng.standard_normal(n), 7000, 16000, order=3) * env_exp(n, 0.09 if open_ else 0.016)
    return x / np.abs(x).max()

def crash():
    n = int(2.2 * SR)
    x = fft_filter(rng.standard_normal((n, 2)), 3500, 15000) * env_exp(n, 0.65)[:, None]
    return x / np.abs(x).max()

def boom():
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    f = 38 + 60 * np.exp(-t / 0.08)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.55)

def riser(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros((n, 2))
    # bruit filtré dont la coupure monte, construit par tranches
    seg = int(0.05 * SR)
    noise = rng.standard_normal((n + seg, 2))
    for i in range(0, n, seg):
        p = i / n
        lo = 300 + 6000 * p ** 2
        chunk = fft_filter(noise[i: i + 2 * seg], lo, lo * 2.5)
        x[i: i + seg] += chunk[:min(seg, n - i)]
    tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (2 * t / dur)) / SR) * 0.25
    x += tone[:, None]
    x *= (t / dur)[:, None] ** 2.2
    return x / np.abs(x).max()

def pluck(f, dur=0.32):
    n = int(dur * SR)
    t = np.arange(n) / SR
    bright = saw(f, n, cutoff=7000) * np.exp(-t / 0.05)
    soft = saw(f, n, cutoff=1500) * np.exp(-t / 0.16)
    x = 0.45 * bright + 0.55 * soft
    x[: int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))
    return x

def bass_note(f, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = 0.55 * saw(f, n, cutoff=900) + 0.45 * np.sin(2 * np.pi * f * t)
    e = np.minimum(t / 0.004, 1) * (0.55 + 0.45 * np.exp(-t / 0.09))
    e *= np.clip((dur - t) / 0.02, 0, 1)
    return np.tanh(1.3 * x * e)

def pad_chord(notes, dur, cutoff):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros((n, 2))
    for m in notes:
        f = midi(m)
        for det, ch in ((-0.09, 0), (0.0, None), (0.09, 1)):
            v = saw(f * 2 ** (det / 12), n, cutoff=cutoff)
            if ch is None:
                x += v[:, None] * 0.5
            else:
                x[:, ch] += v
    e = np.minimum(t / 0.06, 1) * np.clip((dur - t) / 0.08, 0, 1)
    return x * e[:, None] / (len(notes) * 2)

# ---------- harmonie : Am – F – C – G (vi – IV – I – V)
PROG = [
    {'pad': [57, 60, 64, 67], 'bass': 45, 'arp': [69, 72, 76, 79]},
    {'pad': [53, 57, 60, 64], 'bass': 41, 'arp': [69, 72, 77, 81]},
    {'pad': [55, 60, 64, 67], 'bass': 48, 'arp': [67, 72, 76, 79]},
    {'pad': [55, 59, 62, 67], 'bass': 43, 'arp': [67, 71, 74, 79]},
]
ARP = [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 2, 3, 1, 2]

# ---------- forme (en mesures depuis PHI). Valeurs : niveau de chaque piste par mesure
NB = 26
def sec(**kw):
    return kw

# intro 0-4, drop 5, groove, respiration sur « Et en plus ? », montée MONT, coupure COUP puis drop final
MONT, COUP = 20, 21           # montée puis coupure avant l'appel à l'action
BRK0, BRK1 = b2t(9, 2), b2t(10)  # respiration sur « Et en plus ? » (19,17 → 20,17 s)
DROP_FINAL = b2t(COUP, 3)      # 43,67 s : logo final
END_DRUMS = b2t(24)            # 48,17 s : arrêt sur un accord tenu
form = {}
for b in range(-1, NB):
    s = dict(kick=0, clap=0, hat=0, ohat=0, bass=0, pad=0.0, cut=1200, arp=0.0)
    if b <= 1:
        s.update(pad=0.7, cut=700, arp=0.55)
    elif b <= 3:
        s.update(pad=0.75, cut=1100, arp=0.65, hat=0.5, kick=0.55)
    elif b == 4:
        s.update(pad=0.8, cut=2200, arp=0.7, hat=0.7, kick=0.7, bass=0.5)
    elif b < MONT:
        s.update(pad=0.85, cut=3800, arp=0.75, hat=1, ohat=1, kick=1, clap=1, bass=1)
    elif b == MONT:
        s.update(pad=0.85, cut=2600, arp=0.7, hat=0.8, kick=0.8, bass=0.8)
    else:
        s.update(pad=0.9, cut=900, arp=0.5)
    form[b] = s
BREAK_STATE = dict(kick=0, clap=0, hat=0.4, ohat=0, bass=0, pad=0.9, cut=1400, arp=0.7)
FINAL_STATE = dict(kick=1, clap=1, hat=1, ohat=1, bass=1, pad=0.9, cut=4200, arp=0.8)


drums = np.zeros((N, 2)); bass = np.zeros((N, 2)); pads = np.zeros((N, 2)); arps = np.zeros((N, 2)); fx = np.zeros((N, 2))
K, CL, HC, HO = kick(), clap(), [hat() for _ in range(4)], hat(True)
kick_times = []

def state(t):
    b = int(np.floor((t - PHI) / BAR))
    if t >= DROP_FINAL:
        return FINAL_STATE
    if BRK0 <= t < BRK1:
        return BREAK_STATE
    return form[max(-1, min(NB - 1, b))]

def hum(ms=4):
    return rng.uniform(-ms, ms) / 1000

step = BEAT / 4
t = PHI - BAR
i = 0
while t < DUR:
    if t >= 0:
        s = state(t)
        pos = i % 16
        silent = END_DRUMS <= t
        coupure = b2t(COUP) <= t < DROP_FINAL
        if not silent and not coupure:
            if pos % 4 == 0 and s['kick']:
                place(drums, K, t, 0.75 * s['kick']); kick_times.append(t)
            if pos in (4, 12) and s['clap']:
                place(drums, CL, t + hum(3), 0.55 * s['clap'], pan=0.05)
            if s['hat'] and pos % 2 == 1:
                place(drums, HC[rng.integers(4)], t + hum(), 0.3 * s['hat'] * rng.uniform(0.75, 1.0), pan=0.3)
            if s['hat'] and pos % 2 == 0 and s['kick'] >= 1:
                place(drums, HC[rng.integers(4)], t + hum(), 0.12 * rng.uniform(0.7, 1.0), pan=0.3)
            if s['ohat'] and pos % 4 == 2:
                place(drums, HO, t + hum(), 0.2 * s['ohat'], pan=-0.25)
            if s['bass'] and pos % 2 == 0:
                ch = PROG[int(np.floor((t - PHI) / BAR)) % 4]
                f = midi(ch['bass'] + (12 if pos in (6, 14) else 0))
                place(bass, bass_note(f, step * 1.7), t, 0.32 * s['bass'])
        if s['arp'] and not silent:
            ch = PROG[int(np.floor((t - PHI) / BAR)) % 4]
            m = ch['arp'][ARP[pos] % 4]
            v = s['arp'] * (1.0 if pos % 4 == 0 else 0.78) * rng.uniform(0.85, 1.0)
            pan = 0.2 * np.sin(i * 0.7)
            place(arps, pluck(midi(m)), t + hum(2), 0.2 * v, pan=pan)
        if pos == 0 and t < END_DRUMS:
            ch = PROG[int(np.floor((t - PHI) / BAR)) % 4]
            place(pads, pad_chord(ch['pad'], BAR + 0.05, s['cut']), t, 0.95 * s['pad'])
    t += step
    i += 1

# accord final tenu (tonique avec la quinte en haut), fondu jusqu'à la fin
fin = pad_chord([57, 60, 64, 69, 72], DUR - END_DRUMS + 0.2, 2600)
fin *= np.linspace(1, 0, len(fin))[:, None] ** 1.5
place(pads, fin, END_DRUMS, 0.75)
place(bass, bass_note(midi(33), 1.6) * np.linspace(1, 0, int(1.6 * SR)), END_DRUMS, 0.35)

# délai ping-pong sur les arpèges (3/16 de temps)
d = int(0.75 * BEAT * SR)
dl = np.zeros_like(arps)
dl[d:, 1] += arps[:-d, 0] * 0.38
dl[2 * d:, 0] += arps[:-2 * d, 1] * 0.25
arps = arps + fft_filter(dl, 400, 6000)

# pompe de sidechain (kick → basse, nappe, arpèges)
duck = np.ones(N)
tt = np.arange(int(0.3 * SR)) / SR
shape = 1 - 0.55 * np.exp(-tt / 0.09)
for kt in kick_times:
    s0 = int(kt * SR)
    e = min(N, s0 + len(shape))
    duck[s0:e] = np.minimum(duck[s0:e], shape[: e - s0])
bass *= duck[:, None]
pads *= (0.35 + 0.65 * duck)[:, None]
arps *= (0.6 + 0.4 * duck)[:, None]

# effets : montées et impacts sur les révélations
place(fx, riser(BAR * 2), b2t(3), 0.22)             # avant le drop du logo
place(fx, crash(), b2t(5), 0.28); place(fx, boom(), b2t(5), 0.55)
place(fx, riser(BRK1 - BRK0), BRK0, 0.18)            # retour du groove après « Et en plus ? »
place(fx, crash(), BRK1, 0.22)
place(fx, crash(), b2t(16), 0.16)                    # « Résultat »
place(fx, riser(DROP_FINAL - b2t(COUP)), b2t(COUP), 0.24)  # montée vers l'appel à l'action
place(fx, crash(), DROP_FINAL, 0.3); place(fx, boom(), DROP_FINAL, 0.6)
place(fx, crash(), END_DRUMS, 0.22)
# roulement de caisse claire dans la mesure de montée
for k in range(16):
    tk = b2t(MONT) + k * step
    place(drums, CL, tk, 0.06 + 0.22 * (k / 15) ** 2)

# réverbération (convolution avec une queue de bruit décroissante)
ir_n = int(1.8 * SR)
ir = rng.standard_normal((ir_n, 2)) * env_exp(ir_n, 0.45)[:, None]
ir = fft_filter(ir, 200, 7000)
ir /= np.sqrt((ir ** 2).sum(0))
def reverb(x, wet):
    L = x.shape[0] + ir_n
    nf = 1 << int(np.ceil(np.log2(L)))
    y = np.fft.irfft(np.fft.rfft(x, nf, axis=0) * np.fft.rfft(ir, nf, axis=0), nf, axis=0)[: x.shape[0]]
    return x + wet * y

music = (drums * 1.0 + reverb(fft_filter(bass, 30, 4000), 0.04) + reverb(pads, 0.35) * 0.9
         + reverb(arps, 0.25) + reverb(fx, 0.3) + reverb(drums * 0.0 + fft_filter(drums, 800, None), 0.12) * 0.15)
music = fft_filter(music, 50, 17000)
music[: int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))[:, None]
music[-int(0.3 * SR):] *= np.linspace(1, 0, int(0.3 * SR))[:, None]
music = np.tanh(music / np.abs(music).max() * 1.2) * 0.85

pcm = (music * 32767).astype('<i2').tobytes()
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm)
print('ok', sys.argv[1])
