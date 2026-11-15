"""Render the Legend of Aethra soundtrack: python3 tools/music/render.py [track ...]
Each track module in tools/music/tracks/ registers songs with @track. Output: build/.snd/ff/<key>.opus (and .wav),
re-rendered only when the track's source or the engine changes."""
import os, sys, glob, hashlib, importlib, subprocess, json, time
from multiprocessing import Pool
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
OUT = os.path.join(HERE, '..', '..', 'build', '.snd', 'ff')
REG = {}


def track(key, title, kbps=32):
    def deco(fn):
        REG[key] = (fn, title, kbps, fn.__module__); return fn
    return deco


def load():
    import builtins; builtins.track = track
    for f in sorted(glob.glob(os.path.join(HERE, 'tracks', '*.py'))):
        importlib.import_module('tracks.' + os.path.basename(f)[:-3])
    return REG


def engine_hash():
    h = hashlib.sha1()
    for f in ('synth.py', 'score.py', 'render.py', 'motifs.py', 'calib.json'): h.update(open(os.path.join(HERE, f), 'rb').read())
    return h.hexdigest()


def one(key):
    load(); fn, title, kbps, mod = REG[key]
    src = open(sys.modules[mod].__file__, 'rb').read()
    h = hashlib.sha1(src + engine_hash().encode() + key.encode()).hexdigest()[:16]
    wav, opus, stamp = [os.path.join(OUT, key + x) for x in ('.wav', '.opus', '.hash')]
    if os.path.exists(opus) and os.path.exists(stamp) and open(stamp).read() == h: return key, 'cached', 0
    t0 = time.time(); song = fn(); song.render(wav)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav, '-c:a', 'libopus', '-b:a', '%dk' % kbps, '-vbr', 'on', '-application', 'audio', opus], check=True)
    open(stamp, 'w').write(h)
    return key, '%.1fs audio %.0fs' % (song.sec(song.beats), time.time() - t0), os.path.getsize(opus)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True); load()
    keys = [a for a in sys.argv[1:] if not a.startswith('-')] or list(REG)
    with Pool(2) as p:
        for k, msg, size in p.imap_unordered(one, keys): print('%-16s %s %s' % (k, msg, ('%.0f KB' % (size / 1024)) if size else ''), flush=True)
    json.dump({k: REG[k][1] for k in REG}, open(os.path.join(OUT, 'titles.json'), 'w'), indent=1)
