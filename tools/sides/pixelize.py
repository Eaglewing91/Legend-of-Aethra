"""Turn an AI-turned boss picture (1024 px, flat grey background) back into a clean sprite: find the pixel grid, take
the most common colour in each cell, key out the background, snap every colour to the original sprite's palette,
crop, and give it the original's dark outline. python3 pixelize.py in.png Original_Idle.png out.png [cells]"""
import sys, numpy as np
from PIL import Image
from collections import Counter

def palette(path):
    a = np.array(Image.open(path).convert('RGBA')).reshape(-1, 4)
    c = Counter(tuple(p[:3]) for p in a if p[3] > 200)
    return np.array([k for k, n in c.most_common(32)], float)

def own_palette(im, bgc, n=14):
    flat = im.reshape(-1, 3); keep = flat[np.linalg.norm(flat - bgc, axis=1) > 30]
    q = Image.fromarray(keep[None].astype(np.uint8)).quantize(n, method=Image.Quantize.MEDIANCUT)
    return np.array(q.getpalette()[:n * 3], float).reshape(-1, 3)


def run(src, orig, out, pitch=10.25, outline=True, own=False):
    im = np.array(Image.open(src).convert('RGB')).astype(float); H, W = im.shape[:2]
    P = palette(orig)
    bgc = np.median(np.concatenate([im[:8].reshape(-1, 3), im[-8:].reshape(-1, 3)]), axis=0)
    if own: P = own_palette(im, bgc)
    # 1. every big pixel to the nearest palette colour, or background (index -1)
    Pa = np.vstack([P, bgc[None]])
    idx = np.zeros((H, W), int)
    for y0 in range(0, H, 128):
        blk = im[y0:y0 + 128]; d = np.linalg.norm(blk[:, :, None, :] - Pa[None, None], axis=3)
        idx[y0:y0 + 128] = d.argmin(2)
    BG = len(P); idx[np.linalg.norm(im - bgc, axis=2) < 26] = BG
    # 2. the most common class in each cell (background only wins with a clear majority)
    ny, nx = int(H / pitch), int(W / pitch); cell = np.full((ny, nx), BG)
    for y in range(ny):
        for x in range(nx):
            v = idx[int(y * pitch):int((y + 1) * pitch), int(x * pitch):int((x + 1) * pitch)].ravel()
            c = np.bincount(v, minlength=BG + 1)
            if c[BG] > 0.6 * len(v): continue
            c[BG] = 0; cell[y, x] = c.argmax()
    # 3. background reachable from the edges only (keeps grey details inside the body)
    bg = np.zeros((ny, nx), bool); st = [(0, x) for x in range(nx)] + [(ny - 1, x) for x in range(nx)] + [(y, 0) for y in range(ny)] + [(y, nx - 1) for y in range(ny)]
    while st:
        y, x = st.pop()
        if 0 <= y < ny and 0 <= x < nx and not bg[y, x] and cell[y, x] == BG:
            bg[y, x] = True; st += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    cell[(cell == BG) & ~bg] = 0
    rgba = np.zeros((ny, nx, 4), np.uint8); op = cell != BG
    rgba[op, :3] = P[cell[op]].astype(np.uint8); rgba[op, 3] = 255
    A = rgba[..., 3] > 0
    for y in range(1, ny - 1):
        for x in range(1, nx - 1):
            if A[y, x] and A[y - 1:y + 2, x - 1:x + 2].sum() < 3: rgba[y, x, 3] = 0
    if outline:  # the pack's look: a 1px darkest-colour outline all round
        dark = P[np.argmin(P.sum(1))].astype(np.uint8); A = rgba[..., 3] > 0; edge = np.zeros_like(A)
        edge[1:] |= A[:-1]; edge[:-1] |= A[1:]; edge[:, 1:] |= A[:, :-1]; edge[:, :-1] |= A[:, 1:]
        e = edge & ~A; rgba[e, :3] = dark; rgba[e, 3] = 255
    ys, xs = np.where(rgba[..., 3] > 0)
    crop = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    Image.fromarray(crop).save(out)
    return crop.shape


if __name__ == '__main__':
    print(run(sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]) if len(sys.argv) > 4 else 10.25))
