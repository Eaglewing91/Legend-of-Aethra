"""Legend of Aethra: a small offline orchestra.
Every instrument is synthesised here (no samples): strings, brass, horns, woodwinds, harp, piano, celesta, bells, choir,
organ, accordion, plucked and synth basses, timpani and a drum kit. Songs are rendered at 32 kHz, given a hall reverb,
wrapped so they loop without a seam, levelled, and written as WAV for Opus encoding."""
import numpy as np, wave
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.ndimage import maximum_filter1d, uniform_filter1d

SR = 32000
RNG = np.random.default_rng(1991)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


# ---------------------------------------------------------------- filters
_SOS = {}


def _sos(kind, f, order=2):
    if kind == 'band':
        lo, hi = max(20, f[0]), min(SR * 0.45, f[1]); key = (kind, int(lo), int(hi), order); wn = [lo, hi]
    else:
        f = min(max(f, 20), SR * 0.45); key = (kind, int(f), order); wn = f
    if key not in _SOS: _SOS[key] = butter(order, wn, kind if kind != 'band' else 'bandpass', fs=SR, output='sos')
    return _SOS[key]


def lp(x, f, order=2): return sosfilt(_sos('low', f, order), x)
def hp(x, f, order=2): return sosfilt(_sos('high', f, order), x)
def bp(x, lo, hi, order=2): return sosfilt(_sos('band', (lo, hi), order), x)


# ---------------------------------------------------------------- building blocks
def env(n_hold, a=0.01, d=0.1, s=0.8, r=0.2):
    """Attack (linear), decay (exponential) to sustain, held for n_hold samples, then an exponential release."""
    A, D, R = int(a * SR), int(d * SR), max(16, int(r * SR))
    e = np.full(max(1, n_hold), float(s))
    if A > 0:
        k = min(A, len(e)); e[:k] = np.linspace(0, 1, A, endpoint=False)[:k]
    if D > 0 and A < len(e):
        k = min(D, len(e) - A); e[A:A + k] = s + (1 - s) * np.exp(-5 * np.arange(k) / D)
    return np.concatenate([e, e[-1] * np.exp(-6.9 * np.arange(R) / R)])


def freqs(f, n, vib=0.0, rate=5.4, delay=0.3, scoop=0.0, scoop_t=0.04):
    t = np.arange(n) / SR; fa = np.full(n, f)
    if vib:
        ramp = np.clip((t - delay) / 0.35, 0, 1)
        fa = fa * 2 ** (vib / 12 * np.sin(2 * np.pi * rate * t + RNG.random() * 6.283) * ramp)
    if scoop: fa = fa * 2 ** (-scoop / 12 * np.exp(-t / scoop_t))
    return fa


def saw(fa):
    dt = fa / SR; p = (np.cumsum(dt) + RNG.random()) % 1.0; y = 2 * p - 1
    m = p < dt; t = p[m] / dt[m]; y[m] -= t + t - t * t - 1
    m = p > 1 - dt; t = (p[m] - 1) / dt[m]; y[m] -= t * t + t + t + 1
    return y


def pulse(fa, w=0.5):
    dt = fa / SR; ph = np.cumsum(dt) + RNG.random()

    def bl(p):
        p = p % 1.0; y = 2 * p - 1
        m = p < dt; t = p[m] / dt[m]; y[m] -= t + t - t * t - 1
        m = p > 1 - dt; t = (p[m] - 1) / dt[m]; y[m] -= t * t + t + t + 1
        return y
    return 0.5 * (bl(ph) - bl(ph + w))


def sine(fa, ph0=0.0):
    return np.sin(2 * np.pi * (np.cumsum(fa) / SR) + ph0)


def noise(n): return RNG.standard_normal(n)


def partials(f, n, amps, decays, ratios=None, inharm=0.0):
    """Sum of decaying sine partials (plucked and struck things)."""
    t = np.arange(n) / SR; y = np.zeros(n)
    for k, (a, d) in enumerate(zip(amps, decays), 1):
        r = ratios[k - 1] if ratios else k * np.sqrt(1 + inharm * k * k)
        fk = f * r
        if fk >= SR * 0.45 or a <= 0: continue
        y += a * np.exp(-t * d) * np.sin(2 * np.pi * fk * t + RNG.random() * 6.283)
    return y


def gate(y, n_hold, r=0.12):
    """Damp a ringing sound after n_hold samples (a released key or a muted string)."""
    R = max(16, int(r * SR))
    if n_hold + R >= len(y): return y
    y = y[:n_hold + R].copy(); y[n_hold:] *= np.exp(-6.9 * np.arange(R) / R); return y


# ---------------------------------------------------------------- the orchestra
def strings(m, dur, vel, a=0.09, bright=1.0, r=0.45):
    f = mtof(m); n = int(dur * SR); e = env(n, a=a, d=0.25, s=0.85, r=r); N = len(e)
    sig = sum(saw(freqs(f * 2 ** (c / 1200), N, vib=0.12, rate=5.2 + RNG.random())) for c in (-9, 0, 8))
    sig = lp(lp(sig, min(1800 + f * 2.2, 5200) * bright), 7000)
    return sig * e * vel * 0.17


def strings_lo(m, dur, vel): return strings(m, dur, vel, a=0.12, bright=0.7)
def strings_fast(m, dur, vel): return strings(m, dur, vel, a=0.025, r=0.18)


def brass(m, dur, vel, dark=650, brt=3400, a=0.035, r=0.18):
    f = mtof(m); n = int(dur * SR); e = env(n, a=a, d=0.3, s=0.8, r=r); N = len(e)
    fa = freqs(f, N, vib=0.08, rate=5.0, delay=0.4, scoop=0.35, scoop_t=0.03)
    sig = saw(fa) + saw(fa * 1.003)
    t = np.arange(N) / SR; b = np.clip(0.35 + 0.65 * np.exp(-t / 0.25) * np.minimum(1, t / max(a, 1e-3)) + 0.25 * vel, 0, 1)
    sig = lp(sig, dark) * (1 - b) + lp(sig, brt * (0.7 + 0.4 * vel)) * b
    return sig * e * vel * 0.17


def horn(m, dur, vel): return brass(m, dur, vel, dark=450, brt=1500, a=0.06, r=0.3) * 1.25
def trumpet(m, dur, vel): return brass(m, dur, vel, dark=900, brt=4800, a=0.025, r=0.12) * 0.9


def flute(m, dur, vel):
    f = mtof(m); n = int(dur * SR); e = env(n, a=0.06, d=0.2, s=0.85, r=0.15); N = len(e)
    fa = freqs(f, N, vib=0.16, rate=5.0, delay=0.25)
    sig = sine(fa) + 0.22 * sine(fa * 2) + 0.07 * sine(fa * 3)
    sig += 0.06 * bp(noise(N), f * 0.8, min(f * 3, 12000))
    return sig * e * vel * 0.34


def oboe(m, dur, vel):
    f = mtof(m); n = int(dur * SR); e = env(n, a=0.04, d=0.15, s=0.85, r=0.12); N = len(e)
    sig = bp(pulse(freqs(f, N, vib=0.12, rate=5.6, delay=0.3), 0.18), 500, 4200)
    return sig * e * vel * 0.5


def clarinet(m, dur, vel):
    f = mtof(m); n = int(dur * SR); e = env(n, a=0.05, d=0.15, s=0.9, r=0.12); N = len(e)
    sig = lp(pulse(freqs(f, N, vib=0.06, rate=5.0, delay=0.5), 0.5), 1900)
    return sig * e * vel * 0.42


def pluck(m, dur, vel, bright=1.0, decay=1.0, ring=2.5, damp=None, tilt=1.15):
    f = mtof(m); N = int(min(ring, max(dur + 0.3, 0.4)) * SR)
    K = int(min(24, (SR * 0.45) / f))
    amps = [(1 / k ** tilt) * (bright ** (k - 1)) for k in range(1, K + 1)]
    decs = [(0.9 + 0.55 * k) / decay * (1 + f / 900) for k in range(1, K + 1)]
    y = partials(f, N, amps, decs); y[:int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))
    k = int(0.006 * SR); y[:k] += 0.07 * lp(noise(k), 2500 + 2000 * bright) * np.linspace(1, 0, k) * vel
    if damp is not None: y = gate(y, int(dur * SR), damp)
    fade = np.ones(len(y)); k = int(0.05 * SR); fade[-k:] = np.linspace(1, 0, k)
    return y * fade * vel * 0.32


def harp(m, dur, vel): return pluck(m, dur, vel, bright=0.62, decay=1.6, ring=3.0) * 1.15
def guitar(m, dur, vel): return pluck(m, dur, vel, bright=0.78, decay=0.9, ring=1.6, damp=0.1)
def mandolin(m, dur, vel): return pluck(m, dur, vel, bright=0.85, decay=0.5, ring=0.7)
def harpsi(m, dur, vel):
    a = pluck(m, dur, vel, bright=0.93, decay=0.7, ring=1.4, tilt=0.75); b = pluck(m + 12, dur, vel, bright=0.9, decay=0.6, ring=1.4, tilt=0.8)
    n = min(len(a), len(b)); return hp(a[:n] + 0.5 * b[:n], 250)
def pizz(m, dur, vel): return lp(pluck(m, dur, vel, bright=0.55, decay=0.32, ring=0.6), 3000) * 1.3
def bass(m, dur, vel): return lp(pluck(m, dur, vel, bright=0.7, decay=1.2, ring=2.0, damp=0.06, tilt=0.9), 1400) * 1.5
def slap(m, dur, vel): return lp(pluck(m, dur, vel, bright=0.9, decay=0.8, ring=1.2, damp=0.05, tilt=0.8), 3000) * 1.3


def piano(m, dur, vel):
    f = mtof(m); N = int(min(4.0, dur + 1.2) * SR); K = int(min(18, (SR * 0.45) / f))
    br = 0.45 + 0.4 * vel
    amps = [(1 / k ** 1.3) * br ** (k - 1) for k in range(1, K + 1)]
    decs = [(0.55 + 0.45 * k) * (1 + f / 1400) for k in range(1, K + 1)]
    y = partials(f, N, amps, decs, inharm=0.0003)
    y = gate(y, int(dur * SR), 0.18)
    y[:int(0.003 * SR)] += 0.15 * noise(int(0.003 * SR))
    return y * vel * 0.3


def epiano(m, dur, vel):
    f = mtof(m); n = int(dur * SR); N = int(min(3.5, dur + 1.0) * SR); t = np.arange(N) / SR
    idx = 1.6 * np.exp(-t * 3.0) * (0.5 + vel)
    y = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t)) * np.exp(-t * (0.9 + f / 1500))
    y += 0.25 * np.sin(2 * np.pi * f * 14 * t) * np.exp(-t * 30)
    return gate(y, n, 0.2) * vel * 0.3


def fm_bell(m, dur, vel, ratio=3.5, index=2.4, decay=1.2, length=4.0):
    f = mtof(m); N = int(length * SR); t = np.arange(N) / SR
    idx = index * np.exp(-t * 2.0)
    y = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * ratio * t)) * np.exp(-t * decay)
    return y * vel * 0.25


def bell(m, dur, vel): return fm_bell(m, dur, vel, ratio=3.5, index=2.6, decay=0.9, length=4.5)
def celesta(m, dur, vel): return fm_bell(m, dur, vel, ratio=4.0, index=0.9, decay=2.2, length=2.5) * 1.1


def glock(m, dur, vel):
    f = mtof(m); N = int(2.0 * SR)
    return partials(f, N, [1, 0.35, 0.15], [2.4, 5.0, 8.0], ratios=[1, 2.76, 5.4]) * vel * 0.28


def musicbox(m, dur, vel):
    f = mtof(m); N = int(2.2 * SR)
    y = partials(f, N, [1, 0.25, 0.12], [2.0, 6.0, 12.0], ratios=[1, 3.0, 5.9])
    y[:int(0.002 * SR)] += 0.4 * noise(int(0.002 * SR))
    return y * vel * 0.28


def choir(m, dur, vel, vowel='a'):
    f = mtof(m); n = int(dur * SR); e = env(n, a=0.22, d=0.3, s=0.9, r=0.5); N = len(e)
    src = sum(saw(freqs(f * 2 ** (c / 1200), N, vib=0.18, rate=4.6 + RNG.random() * 1.2, delay=0.15)) for c in (-12, -4, 5, 11))
    F = {'a': ((800, 1150, 2900), (1, 0.5, 0.18)), 'o': ((480, 820, 2800), (1, 0.4, 0.1)), 'u': ((330, 720, 2500), (1, 0.25, 0.06)),
         'e': ((450, 1900, 2600), (1, 0.45, 0.2))}[vowel]
    y = sum(g * bp(src, fr * 0.82, fr * 1.2) for fr, g in zip(*F))
    y += 0.08 * hp(src, 3000)
    return y * e * vel * 0.33


def choir_o(m, dur, vel): return choir(m, dur, vel, 'o')
def choir_u(m, dur, vel): return choir(m, dur, vel, 'u') * 1.3


def organ(m, dur, vel):
    f = mtof(m); n = int(dur * SR); e = env(n, a=0.012, d=0.05, s=1.0, r=0.12); N = len(e)
    fa = np.full(N, f); t = np.arange(N) / SR
    y = sum(a * sine(fa * h) for h, a in ((0.5, 0.6), (1, 1), (2, 0.7), (3, 0.45), (4, 0.4), (6, 0.2), (8, 0.18)) if f * h < SR * 0.45)
    y *= 1 + 0.08 * np.sin(2 * np.pi * 6.2 * t)
    return y * e * vel * 0.12


def accordion(m, dur, vel):
    f = mtof(m); n = int(dur * SR); e = env(n, a=0.035, d=0.1, s=0.9, r=0.1); N = len(e)
    y = pulse(freqs(f * 0.9965, N), 0.35) + pulse(freqs(f * 1.0035, N), 0.35)
    return lp(bp(y, 300, 5000), 3800) * e * vel * 0.3


def pad(m, dur, vel):
    f = mtof(m); n = int(dur * SR); e = env(n, a=0.45, d=0.5, s=0.9, r=0.9); N = len(e)
    y = sum(saw(freqs(f * 2 ** (c / 1200), N, vib=0.05, rate=0.3 + RNG.random() * 0.4, delay=0)) for c in (-11, -3, 4, 12))
    return lp(lp(y, 1100 + f), 4000) * e * vel * 0.12


def synbass(m, dur, vel):
    f = mtof(m); n = int(dur * SR); e = env(n, a=0.005, d=0.25, s=0.7, r=0.07); N = len(e); t = np.arange(N) / SR
    y = saw(np.full(N, f)) * 0.8 + 0.7 * sine(np.full(N, f))
    y = lp(y, 320, 2) * 0.6 + lp(y, 300 + 2400 * vel, 2) * (0.6 * np.exp(-t / 0.12))
    return y * e * vel * 0.45


def sub(m, dur, vel):
    f = mtof(m); n = int(dur * SR); e = env(n, a=0.01, d=0.2, s=0.9, r=0.1); N = len(e)
    return (sine(np.full(N, f)) + 0.15 * sine(np.full(N, 2 * f))) * e * vel * 0.5


def arpsyn(m, dur, vel):
    f = mtof(m); n = int(dur * SR); e = env(n, a=0.003, d=0.12, s=0.35, r=0.08); N = len(e)
    return lp(pulse(np.full(N, f), 0.3), 2600) * e * vel * 0.28


def timpani(m, dur, vel):
    f = mtof(m); N = int(1.8 * SR); t = np.arange(N) / SR
    fa = f * (1 + 0.04 * np.exp(-t / 0.05))
    y = np.sin(2 * np.pi * np.cumsum(fa) / SR) * np.exp(-t * 2.2)
    y += 0.4 * partials(f, N, [0.5, 0.3, 0.2], [3.5, 4.5, 6], ratios=[1.5, 1.99, 2.44])
    y += 0.5 * lp(noise(N), 900) * np.exp(-t * 30)
    return y * vel * 0.65


# ---- drums (the note number is ignored except for toms)
def _nz(N, lo, hi, dec):
    t = np.arange(N) / SR; return bp(noise(N), lo, hi) * np.exp(-t * dec)


def kick(m, dur, vel):
    N = int(0.45 * SR); t = np.arange(N) / SR
    f = 48 + 90 * np.exp(-t / 0.03)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) + 0.15 * _nz(N, 1000, 5000, 80)
    return y * vel * 0.9


def snare(m, dur, vel):
    N = int(0.35 * SR); t = np.arange(N) / SR
    y = 0.6 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25) + lp(_nz(N, 1000, 8000, 18), 5500)
    return y * vel * 0.5


def rim(m, dur, vel):
    N = int(0.12 * SR); return _nz(N, 1500, 6000, 60) * vel * 0.5


def hat(m, dur, vel): return hp(_nz(int(0.08 * SR), 6000, 14000, 70), 7000) * vel * 0.32
def ohat(m, dur, vel): return hp(_nz(int(0.5 * SR), 6000, 14000, 7), 6000) * vel * 0.25
def shaker(m, dur, vel):
    N = int(0.09 * SR); t = np.arange(N) / SR
    return _nz(N, 4000, 12000, 30) * np.minimum(1, t / 0.02) * vel * 0.3


def crash(m, dur, vel):
    N = int(2.6 * SR); t = np.arange(N) / SR
    return hp(noise(N), 4000) * np.exp(-t * 1.6) * vel * 0.22


def ride(m, dur, vel):
    N = int(1.2 * SR); t = np.arange(N) / SR
    y = hp(noise(N), 5000) * np.exp(-t * 4) * 0.5 + 0.35 * bp(noise(N), 3000, 4500) * np.exp(-t * 9)
    return y * vel * 0.2


def tom(m, dur, vel):
    f = mtof(m); N = int(0.6 * SR); t = np.arange(N) / SR
    fa = f * (1 + 0.35 * np.exp(-t / 0.04))
    return (np.sin(2 * np.pi * np.cumsum(fa) / SR) * np.exp(-t * 6) + 0.2 * _nz(N, 300, 3000, 40)) * vel * 0.7


def taiko(m, dur, vel):
    N = int(1.2 * SR); t = np.arange(N) / SR; f = 62 * (1 + 0.5 * np.exp(-t / 0.03))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.5) + 0.35 * lp(noise(N), 700) * np.exp(-t * 18)) * vel * 0.9


def handdrum(m, dur, vel):
    f = mtof(m); N = int(0.5 * SR); t = np.arange(N) / SR
    fa = f * (1 + 0.15 * np.exp(-t / 0.02))
    return (np.sin(2 * np.pi * np.cumsum(fa) / SR) * np.exp(-t * 9) + 0.25 * _nz(N, 800, 5000, 50)) * vel * 0.6


def tamb(m, dur, vel): return (hp(_nz(int(0.25 * SR), 5000, 14000, 14), 5000) + 0.2 * _nz(int(0.25 * SR), 2000, 4000, 30)) * vel * 0.28


def triangle(m, dur, vel):
    N = int(2.5 * SR); return partials(mtof(m), N, [1, 0.6, 0.4], [1.0, 1.4, 1.8], ratios=[1, 2.9, 5.1]) * vel * 0.14


def gong(m, dur, vel):
    N = int(5 * SR); t = np.arange(N) / SR
    y = partials(mtof(m), N, [1, 0.8, 0.6, 0.5, 0.3], [0.5, 0.6, 0.7, 0.9, 1.2], ratios=[1, 1.47, 2.09, 2.56, 3.3])
    return (y + 0.3 * lp(noise(N), 3000) * np.exp(-t * 1.5)) * np.minimum(1, t / 0.05) * vel * 0.3


def swell(m, dur, vel):
    """A cymbal roll that rises into the next downbeat."""
    N = int(dur * SR); t = np.arange(N) / SR
    return hp(noise(N), 3500) * (t / max(dur, 0.01)) ** 2 * vel * 0.25


# name -> (function, reverb send, gain)
INST = {
    'strings': (strings, 0.45, 1.0), 'strings_lo': (strings_lo, 0.4, 1.0), 'strings_fast': (strings_fast, 0.35, 1.0),
    'brass': (brass, 0.35, 1.0), 'horn': (horn, 0.45, 1.0), 'trumpet': (trumpet, 0.3, 1.0),
    'flute': (flute, 0.45, 1.0), 'oboe': (oboe, 0.4, 1.0), 'clarinet': (clarinet, 0.4, 1.0),
    'harp': (harp, 0.45, 1.0), 'guitar': (guitar, 0.3, 1.0), 'mandolin': (mandolin, 0.3, 1.0), 'pizz': (pizz, 0.35, 1.0), 'harpsi': (harpsi, 0.35, 1.0),
    'bass': (bass, 0.08, 1.0), 'slap': (slap, 0.05, 1.0), 'synbass': (synbass, 0.05, 1.0), 'sub': (sub, 0.0, 1.0),
    'piano': (piano, 0.35, 1.0), 'epiano': (epiano, 0.4, 1.0), 'bell': (bell, 0.55, 1.0), 'celesta': (celesta, 0.5, 1.0),
    'glock': (glock, 0.45, 1.0), 'musicbox': (musicbox, 0.5, 1.0), 'choir': (choir, 0.6, 1.0), 'choir_o': (choir_o, 0.6, 1.0),
    'choir_u': (choir_u, 0.6, 1.0), 'organ': (organ, 0.5, 1.0), 'accordion': (accordion, 0.25, 1.0), 'pad': (pad, 0.5, 1.0),
    'arpsyn': (arpsyn, 0.3, 1.0), 'timpani': (timpani, 0.4, 1.0),
    'kick': (kick, 0.05, 1.0), 'snare': (snare, 0.2, 1.0), 'rim': (rim, 0.15, 1.0), 'hat': (hat, 0.1, 1.0), 'ohat': (ohat, 0.1, 1.0),
    'shaker': (shaker, 0.1, 1.0), 'crash': (crash, 0.2, 1.0), 'ride': (ride, 0.15, 1.0), 'tom': (tom, 0.25, 1.0),
    'taiko': (taiko, 0.35, 1.0), 'handdrum': (handdrum, 0.25, 1.0), 'tamb': (tamb, 0.15, 1.0), 'triangle': (triangle, 0.4, 1.0),
    'gong': (gong, 0.5, 1.0), 'swell': (swell, 0.3, 1.0),
}
import json as _j, os as _o
_CAL = _o.path.join(_o.path.dirname(_o.path.abspath(__file__)), 'calib.json')
if _o.path.exists(_CAL):
    for _k, _g in _j.load(open(_CAL)).items():
        if _k in INST: INST[_k] = (INST[_k][0], INST[_k][1], _g)
UNPITCHED = {'kick', 'snare', 'rim', 'hat', 'ohat', 'shaker', 'crash', 'ride', 'taiko', 'tamb', 'swell'}
DRUMS = UNPITCHED | {'tom', 'handdrum', 'timpani', 'gong', 'triangle'}


def hall(rt=2.2, predelay=0.018, bright=5000):
    """A synthetic stereo hall: decorrelated noise with an exponential decay that darkens as it fades."""
    N = int((rt + 0.3) * SR); t = np.arange(N) / SR; d = np.exp(-6.9 * t / rt)
    out = []
    for ch in range(2):
        nz = noise(N); dark = lp(nz, bright * 0.25); brt = lp(nz, bright)
        mix = np.exp(-t / (rt * 0.35)); ir = (brt * mix + dark * (1 - mix)) * d
        pd = int(predelay * SR) + ch * 37; ir = np.concatenate([np.zeros(pd), ir])
        for (dt, g) in ((0.011, 0.5), (0.019, 0.35), (0.027, 0.3), (0.041, 0.22)):  # early reflections
            k = int((dt + ch * 0.003) * SR); ir[k] += g
        out.append(ir / np.sqrt(np.sum(ir ** 2)))
    return out


def write_wav(path, x):
    x = np.clip(x, -1, 1); y = (x.T * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(y.tobytes())


def master(x, target_db=-16.0, ceiling=0.93):
    """Level to a target RMS, then a gentle look-ahead limiter so nothing clips."""
    x = x - np.mean(x, axis=1, keepdims=True)
    rms = np.sqrt(np.mean(hp(x.mean(0), 150) ** 2)) + 1e-9; x = x * (10 ** (target_db / 20) / rms)
    a = np.max(np.abs(x), axis=0); w = int(0.012 * SR)
    peak = maximum_filter1d(a, w * 2 + 1)
    g = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9)); g = uniform_filter1d(g, w * 2 + 1); g = np.minimum(g, ceiling / np.maximum(a, 1e-9))
    return x * g
