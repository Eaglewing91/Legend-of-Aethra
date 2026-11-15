"""Make a side-on boss's battle sheet: 4 frames of a slow breath (the upper body sinks a pixel and rises), plus the
scale that keeps it the same size on screen as the pack's front-facing sprite. Writes art/generated/sides/<Name>.png
and updates art/generated/sides/sides.json. python3 make_sheet.py sprite.png Name"""
import sys, json, os, numpy as np
from PIL import Image
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'art', 'generated', 'sides')

def visible(path):
    im = np.array(Image.open(path).convert('RGBA')); h = im.shape[0]
    fw = h if im.shape[1] % h == 0 else im.shape[1] // max(1, round(im.shape[1] / h))
    a = im[:, :fw, 3] > 0; ys, xs = np.where(a); return (ys.max() - ys.min() + 1), (xs.max() - xs.min() + 1), fw, h

def make(sprite, name):
    sp = np.array(Image.open(sprite).convert('RGBA')); h, w = sp.shape[:2]
    fh, fw = h + 2, w + 2
    frames = []
    for k in (0, 1, 1, 0):
        f = np.zeros((fh, fw, 4), np.uint8)
        if k == 0: f[2:, 1:-1] = sp
        else:  # breathe: everything above the waist moves down one pixel
            cut = int(h * 0.55); f[2 + cut:2 + h, 1:-1] = sp[cut:]
            reg = f[3:3 + cut, 1:-1]; up = sp[:cut]; m = up[..., 3] > 0; reg[m] = up[m]
        frames.append(f)
    sheet = np.concatenate(frames, axis=1); Image.fromarray(sheet).save(os.path.join(OUT, name + '.png'))
    vh, vw, ofw, ofh = visible('art/na/boss/%s_Idle.png' % name if os.path.exists('art/na/boss/%s_Idle.png' % name) else 'art/na/boss/%s_Head.png' % name)
    scale = round(float(np.sqrt((vh * vw) / (h * w))), 3)   # same area on screen as the original
    meta_p = os.path.join(OUT, 'sides.json'); meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
    meta[name] = {'fw': fw, 'fh': fh, 'n': 4, 'scale': scale, 'origfh': ofh}
    json.dump(meta, open(meta_p, 'w'), indent=1, sort_keys=True)
    return meta[name]

if __name__ == '__main__':
    print(make(sys.argv[1], sys.argv[2]))
