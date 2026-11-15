"""Measure each instrument's perceived level (high-passed RMS) on a reference note and write calib.json gains."""
import json, numpy as np
from synth import *
REF = {'bass': 40, 'slap': 40, 'synbass': 40, 'sub': 40, 'strings_lo': 48, 'timpani': 45, 'tom': 47, 'handdrum': 55, 'gong': 40, 'triangle': 88,
       'flute': 76, 'celesta': 79, 'glock': 84, 'musicbox': 84, 'bell': 72}
out = {}
for name, (fn, snd, g) in INST.items():
    m = REF.get(name, 64); y = fn(m, 0.9, 0.78)
    win = y[:int((0.3 if name in DRUMS else 0.9) * SR)]
    w = hp(lp(win, 6000), 180)
    db = 20 * np.log10(np.sqrt(np.mean(w ** 2)) + 1e-9)
    target = -37 if name in ('hat', 'ohat', 'shaker', 'ride', 'tamb', 'crash', 'triangle') else -30 if name in DRUMS else -24
    out[name] = round(float(10 ** ((target - db) / 20)), 3)
    print('%-12s %6.1f dB -> x%.2f' % (name, db, out[name]))
out['swell'] = 0.5
for k, f in {'bass': 0.5, 'slap': 0.55, 'synbass': 0.5, 'sub': 0.45, 'strings_lo': 0.6, 'timpani': 0.8, 'harp': 0.75, 'kick': 1.3, 'snare': 0.8}.items(): out[k] = round(out[k] * f, 3)
json.dump(out, open('calib.json', 'w'), indent=1)
