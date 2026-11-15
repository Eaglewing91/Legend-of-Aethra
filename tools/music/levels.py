"""Per-part loudness while playing (dB relative to the mix): python3 levels.py track ..."""
import sys, numpy as np; sys.path.insert(0, '.')
import render; render.load()
def active(ph, beats):
    iv = sorted((t % beats, min(beats, t % beats + max(d, 0.5))) for t, d, m, v in ph.ev)
    tot, end = 0, -1
    for a, b in iv:
        if b <= end: continue
        tot += b - max(a, end); end = b
    return max(tot / beats, 1e-3)
for k in sys.argv[1:]:
    S = render.REG[k][0](); S.render('/tmp/claude-0/pv/_lv.wav'); out = []
    for (inst, ph, at, pan, gain, *_), (n, l) in zip(S.parts, S.levels):
        out.append('%s %.0f' % (inst, l - 10 * np.log10(active(ph, S.beats))))
    print(k + ': ' + ', '.join(out))
