"""Score notation and the mixer.
  M('d5:q e5 f#5:h a5:q.! r:e')    notes with durations (w h q e s t=triplet 8th, qt=triplet quarter, '.' dots, or beats),
                                   '+' joins a chord (d4+f#4+a4:h), '!' accents, '?' softens, r is a rest.
  prog('D:4 Bm:4 G/B:2 A7sus4:2')  chords; pad() voice-leads them, arp() and bassline() and comp() play patterns over them.
  Phrases add (+, one after another), multiply (* n, repeat) and layer (|, at the same time)."""
import re, math, numpy as np
from synth import SR, INST, UNPITCHED, DRUMS, RNG, hall, master, write_wav

PC = {'c': 0, 'd': 2, 'e': 4, 'f': 5, 'g': 7, 'a': 9, 'b': 11}
DUR = {'w': 4, 'h': 2, 'q': 1, 'e': 0.5, 's': 0.25, 't': 1 / 3, 'qt': 2 / 3, 'ht': 4 / 3, 'x': 1 / 6}


class P:
    """A phrase: events (beat, length, [midi], velocity) and a total length in beats."""
    def __init__(s, ev=None, length=0.0): s.ev = ev or []; s.len = length
    def __add__(a, b): return P(a.ev + [(t + a.len, d, m, v) for t, d, m, v in b.ev], a.len + b.len)
    def __mul__(a, n):
        r = P()
        for _ in range(n): r = r + a
        return r
    def __or__(a, b): return P(a.ev + b.ev, max(a.len, b.len))
    def tr(s, k): return P([(t, d, [x + k for x in m], v) for t, d, m, v in s.ev], s.len)
    def vel(s, k): return P([(t, d, m, min(1.0, v * k)) for t, d, m, v in s.ev], s.len)
    def shift(s, b): return P([(t + b, d, m, v) for t, d, m, v in s.ev], s.len + b)
    def legato(s, k): return P([(t, d * k, m, v) for t, d, m, v in s.ev], s.len)
    def oct(s, *ks): return P([(t, d, [x + 12 * k for x in m for k in ks], v) for t, d, m, v in s.ev], s.len)
    def fit(s, length):  # repeat or cut to an exact length
        r = P()
        while r.len < length: r = r + s
        return P([e for e in r.ev if e[0] < length - 1e-6], length)
    def crescendo(s, v0, v1):
        L = max(s.len, 1e-6); return P([(t, d, m, v * (v0 + (v1 - v0) * t / L)) for t, d, m, v in s.ev], s.len)


def note(tok):
    m = re.match(r'^([a-g])(#|b)?(-?\d)$', tok)
    if not m: raise ValueError('bad note ' + tok)
    return 12 * (int(m.group(3)) + 1) + PC[m.group(1)] + {'#': 1, 'b': -1, None: 0}[m.group(2)]


def M(s, dur=1.0, vel=0.78):
    ev, t = [], 0.0
    for tok in s.replace('|', ' ').split():
        if tok.startswith('v='): vel = float(tok[2:]); continue
        v = vel
        while tok and tok[-1] in '!?':
            v = min(1.0, v * 1.22) if tok[-1] == '!' else v * 0.7; tok = tok[:-1]
        if ':' in tok:
            body, d = tok.split(':')
            dots = len(d) - len(d.rstrip('.')); d = d.rstrip('.')
            dur = (DUR[d] if d in DUR else float(eval(d))) * (1.5 if dots == 1 else 1.75 if dots == 2 else 1)
        else: body = tok
        if body != 'r': ev.append((t, dur, [note(x) for x in body.split('+')], v))
        t += dur
    return P(ev, t)


def R(beats): return P([], beats)


# ---------------------------------------------------------------- chords
QUAL = {'': [0, 4, 7], 'm': [0, 3, 7], '7': [0, 4, 7, 10], 'maj7': [0, 4, 7, 11], 'm7': [0, 3, 7, 10], 'dim': [0, 3, 6], 'aug': [0, 4, 8],
        'sus4': [0, 5, 7], 'sus2': [0, 2, 7], '6': [0, 4, 7, 9], 'm6': [0, 3, 7, 9], '9': [0, 4, 7, 10, 14], 'maj9': [0, 4, 7, 11, 14],
        'm9': [0, 3, 7, 10, 14], 'add9': [0, 4, 7, 14], 'madd9': [0, 3, 7, 14], 'm7b5': [0, 3, 6, 10], 'dim7': [0, 3, 6, 9],
        '7sus4': [0, 5, 7, 10], '5': [0, 7], 'mmaj7': [0, 3, 7, 11], '7b9': [0, 4, 7, 10, 13], 'm11': [0, 3, 7, 10, 14, 17], 'maj7#11': [0, 4, 7, 11, 18]}


class Chord:
    def __init__(s, sym):
        m = re.match(r'^([A-G])(#|b)?([^/]*)(?:/([A-G])(#|b)?)?$', sym)
        if not m or m.group(3) not in QUAL: raise ValueError('bad chord ' + sym)
        s.root = (PC[m.group(1).lower()] + {'#': 1, 'b': -1, None: 0}[m.group(2)]) % 12
        s.iv = QUAL[m.group(3)]; s.q = m.group(3)
        s.bass = (PC[m.group(4).lower()] + {'#': 1, 'b': -1, None: 0}[m.group(5)]) % 12 if m.group(4) else s.root
    def pcs(s): return sorted(set((s.root + i) % 12 for i in s.iv))
    def deg(s, d):
        """Scale-ish degrees relative to the root: 1 3 5 7 8 9 and flats/sharps (b3, b7, #4...)."""
        acc = 0
        while d and d[0] in 'b#': acc += -1 if d[0] == 'b' else 1; d = d[1:]
        n = int(d)
        third = 3 if 3 in s.iv else (4 if 4 in s.iv else (5 if 5 in s.iv else 2 if 2 in s.iv else 4))
        fifth = 6 if 6 in s.iv else 8 if 8 in s.iv else 7
        seventh = 10 if 10 in s.iv else 11 if 11 in s.iv else 9 if 9 in s.iv else 10
        o, b = (n - 1) // 7, (n - 1) % 7 + 1
        base = {1: 0, 2: 2, 3: third, 4: 5, 5: fifth, 6: 9, 7: seventh}[b] + 12 * o
        return base + acc


def prog(s):
    out, t = [], 0.0
    for tok in s.replace('|', ' ').split():
        sym, d = tok.split(':'); d = float(eval(d)); out.append((Chord(sym), t, d)); t += d
    return out


def plen(pr): return pr[-1][1] + pr[-1][2]


def _voicings(c, low, high, n=None):
    pcs = c.pcs()
    if n is not None and len(pcs) > n:  # thin out: keep root, 3rd/sus, 7th or 5th
        keep = [c.root, (c.root + c.iv[1]) % 12] + [(c.root + i) % 12 for i in c.iv[::-1] if (c.root + i) % 12 not in (c.root, (c.root + c.iv[1]) % 12)]
        pcs = sorted(set(keep[:n]))
    cands = []
    for start in range(low, low + 12):
        if start % 12 not in pcs: continue
        v, x = [start], start
        while len(v) < len(pcs):
            x += 1
            while x % 12 not in pcs or x % 12 in [y % 12 for y in v]: x += 1
            v.append(x)
        if v[-1] <= high: cands.append(v)
    return cands or [[low + ((p - low) % 12) for p in pcs]]


def pad(pr, low=55, high=76, vel=0.6, n=None, double_bass=False):
    ev, prev = [], None
    for c, t, d in pr:
        cands = _voicings(c, low, high, n)
        v = min(cands, key=lambda v: sum(abs(a - b) for a, b in zip(v, prev)) if prev and len(prev) == len(v) else abs(sum(v) / len(v) - (low + high) / 2))
        prev = v; ev.append((t, d, list(v), vel))
    return P(ev, plen(pr))


def arp(pr, pattern='0 1 2 3', step=0.5, low=55, vel=0.62, n=None, accent_first=True, hold=1.0):
    """Arpeggiate each chord; index i reaches up through octaves (0..k-1 are the chord tones, k.. the next octave)."""
    ev = []; pat = [int(x) for x in pattern.split()]
    prev = None
    for c, t, d in pr:
        cands = _voicings(c, low, low + 14, n)
        v = min(cands, key=lambda v: abs(v[0] - prev) if prev else abs(v[0] - low)); prev = v[0]
        k, i, tt = len(v), 0, 0.0
        while tt < d - 1e-6:
            idx = pat[i % len(pat)]; m = v[idx % k] + 12 * (idx // k)
            ev.append((t + tt, step * hold, [m], vel * (1.12 if accent_first and tt == 0 else 1.0)))
            tt += step; i += 1
    return P(ev, plen(pr))


def bassline(pr, pattern='1:1', low=33, vel=0.8, lowest=None):
    ev = []
    toks = [(x.split(':')[0], float(eval(x.split(':')[1])) if ':' in x else 1.0) for x in pattern.split()]
    for c, t, d in pr:
        root = low + ((c.root - low) % 12); bassn = low + ((c.bass - low) % 12)
        tt, i = 0.0, 0
        while tt < d - 1e-6:
            dg, dl = toks[i % len(toks)]; dl = min(dl, d - tt)
            if dg != 'r':
                acc = dg.rstrip('!?'); vv = vel * (1.2 if dg.endswith('!') else 0.7 if dg.endswith('?') else 1)
                mm = bassn if acc in ('1', 'B') and c.bass != c.root else root + c.deg(acc)
                ev.append((t + tt, dl, [mm], min(1, vv)))
            tt += dl; i += 1
    return P(ev, plen(pr))


def degarp(pr, degs='1 5 9 10', step=0.5, low=45, vel=0.6, hold=1.0, accent_first=True):
    """Arpeggio by scale degree from the chord root (9 = the 9th, 10 = the 3rd an octave up, 12 = the 5th up...)."""
    toks = degs.split(); ev = []
    for c, t, d in pr:
        root = low + ((c.root - low) % 12); tt, i = 0.0, 0
        while tt < d - 1e-6:
            tk = toks[i % len(toks)]
            if tk != 'r': ev.append((t + tt, step * hold, [root + c.deg(tk)], vel * (1.12 if accent_first and tt == 0 else 1.0)))
            tt += step; i += 1
    return P(ev, plen(pr))


def comp(pr, rhythm='1:1', low=52, high=72, vel=0.55, n=None):
    """Chord stabs: '1' plays the chord, 'r' rests (each token has a length)."""
    toks = [(x.split(':')[0], float(eval(x.split(':')[1]))) for x in rhythm.split()]
    ev, prev = [], None
    for c, t, d in pr:
        cands = _voicings(c, low, high, n)
        v = min(cands, key=lambda v: sum(abs(a - b) for a, b in zip(v, prev)) if prev and len(prev) == len(v) else 0); prev = v
        tt, i = 0.0, 0
        while tt < d - 1e-6:
            k, dl = toks[i % len(toks)]; dl = min(dl, d - tt)
            if k != 'r': ev.append((t + tt, dl, list(v), vel * (1.2 if k.endswith('!') else 0.7 if k.endswith('?') else 1)))
            tt += dl; i += 1
    return P(ev, plen(pr))


def roll(m, beats, rate=8, vel=0.5, v1=None):
    """A drum or timpani roll from vel to v1."""
    n = int(beats * rate); v1 = vel if v1 is None else v1
    return P([(i / rate, 1 / rate, [m], vel + (v1 - vel) * i / max(1, n - 1)) for i in range(n)], beats)


# ---------------------------------------------------------------- the song
class Song:
    def __init__(s, bpm, beats, loop=True, swing=0.0, rt=2.2, wet=0.32, loud=-16.0, bright=5000):
        s.bpm, s.beats, s.loop, s.swing, s.rt, s.wet, s.loud, s.bright = bpm, beats, loop, swing, rt, wet, loud, bright
        s.parts = []

    def add(s, inst, ph, at=0.0, pan=0.0, gain=1.0, send=None, legato=0.95, human=1.0, tr=0, bpm=None):
        s.parts.append((inst, ph, at, pan, gain, send, legato, human, tr))
        return s

    def drums(s, pats, bars, bpb=4, spb=4, at=0.0, gain=1.0, toms=None):
        """pats: {'kick': 'x...x...', ...}: one character per step; x hit, X accent, o ghost, . rest; toms use h/m/l."""
        toms = toms or {'h': 52, 'm': 47, 'l': 43}
        for inst, pat in pats.items():
            pat = pat.replace(' ', '').replace('|', ''); L = len(pat); ev = []
            total = int(round(bars * bpb * spb))
            for i in range(total):
                ch = pat[i % L]
                if ch == '.': continue
                v = {'x': 0.8, 'X': 1.0, 'o': 0.45}.get(ch, 0.8); m = toms.get(ch, 60)
                ev.append((i / spb, 1 / spb, [m], v))
            s.add(inst, P(ev, bars * bpb), at=at, gain=gain, pan={'hat': 0.25, 'ohat': 0.25, 'shaker': -0.3, 'tamb': -0.25, 'ride': 0.3, 'crash': -0.15}.get(inst, 0), human=0.3)
        return s

    def sec(s, b): return b * 60.0 / s.bpm

    def render(s, path):
        N = int(round(s.sec(s.beats) * SR)); tail = int((s.rt + 4.5) * SR)
        dry = np.zeros((2, N + tail)); send = np.zeros(N + tail); cache = {}; s.levels = []
        for pi, (inst, ph, at, pan, gain, sendk, legato, human, tr) in enumerate(s.parts):
            energy = 0.0
            fn, dsend, dgain = INST[inst]; sendk = dsend if sendk is None else sendk
            L, Rr = math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)
            for (t, d, ms, v) in ph.ev:
                b = t + at
                if s.swing and abs((b % 1) - 0.5) < 1e-4: b += s.swing
                if s.loop: b %= s.beats
                elif b >= s.beats + 1e-6 and inst not in ('swell',): pass
                for m in ms:
                    m = m + (0 if inst in UNPITCHED else tr)
                    vv = v
                    jitter = 0.0
                    if inst not in DRUMS and human:
                        vv = round(min(1.0, v * (1 + RNG.uniform(-0.05, 0.05) * human)) / 0.02) * 0.02
                        jitter = RNG.normal(0, 0.0045 * human)
                    secs = s.sec(d) * (legato if inst not in DRUMS else 1)
                    key = (inst, m, round(secs, 3), round(vv, 2))
                    if key not in cache:
                        yy = fn(m, secs, vv) * dgain; cache[key] = (yy, float(np.sum(_hp(yy) ** 2)))
                    y, ew = cache[key]; y = y * gain; i0 = int(round((s.sec(b) + jitter) * SR))
                    if i0 < 0: i0 = 0
                    i1 = min(len(send), i0 + len(y)); y = y[:i1 - i0]
                    dry[0, i0:i1] += y * L; dry[1, i0:i1] += y * Rr; send[i0:i1] += y * sendk; energy += ew * gain * gain
            s.levels.append((inst, 10 * np.log10(energy / max(1, N) + 1e-12)))
        ir = hall(s.rt, bright=s.bright)
        wet = np.stack([_fconv(send, ir[0]), _fconv(send, ir[1])])
        out = dry + wet * s.wet
        if s.loop:
            body = out[:, :N].copy()
            for k in range(N, N + tail, N):
                seg = out[:, k:min(k + N, N + tail)]; body[:, :seg.shape[1]] += seg
            out = body
        else:
            nz = np.where(np.max(np.abs(out), axis=0) > 1e-4)[0]; end = (nz[-1] + 1) if len(nz) else N
            out = out[:, :end]; k = min(int(0.3 * SR), out.shape[1]); out[:, -k:] *= np.linspace(1, 0, k)
        pre = np.sqrt(np.mean(_hp(out.mean(0)) ** 2)) + 1e-12
        s.levels = [(n, l - 20 * np.log10(pre)) for n, l in s.levels]
        out = master(out, -13.5 + (s.loud + 16.0) * 0.5)  # louder overall; quiet pieces stay quieter, but by half as much
        write_wav(path, out)
        return out


def _hp(x):
    from synth import hp
    return hp(x, 180)


def _fconv(x, h):
    from scipy.signal import fftconvolve
    return fftconvolve(x, h)[:len(x)]


def chain(*prs):
    """Join chord progressions end to end."""
    out, off = [], 0.0
    for pr in prs:
        out += [(c, t + off, d) for c, t, d in pr]; off += plen(pr)
    return out
