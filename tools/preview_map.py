"""Render maps from build/maps.json to PNG (for checking layouts without the game).
python3 tools/preview_map.py <map id> [out.png] [scale]   (scale 1 = 16 px per tile; 0.25 for a quick overview)"""
import json, os, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(__file__))
import mapkit as MK

def render(m, scale=1.0, marks=True):
    sheets = [Image.open(os.path.join(MK.ART, f)).convert('RGBA') for _, f in MK.SHEETS]
    W, H = m['w'], m['h']; im = Image.new('RGBA', (W * 16, H * 16), (0, 0, 0, 255))
    cache = {}
    def tile(r):
        if r not in cache:
            s, ty, tx = r >> 16, (r >> 8) & 255, r & 255
            cache[r] = sheets[s].crop((tx * 16, ty * 16, tx * 16 + 16, ty * 16 + 16))
        return cache[r]
    for L in ('ground', 'wall', 'deco', 'over'):
        for i, r in enumerate(m['layers'][L]):
            if r >= 0: im.alpha_composite(tile(r), ((i % W) * 16, (i // W) * 16))
    if marks:
        d = ImageDraw.Draw(im)
        for w in m['warps']: d.rectangle([w['x'] * 16 + 2, w['y'] * 16 + 2, w['x'] * 16 + 13, w['y'] * 16 + 13], outline=(255, 0, 255), width=2)
        for k in m['chests']: x, y = map(int, k.split(',')); d.rectangle([x * 16 + 3, y * 16 + 3, x * 16 + 12, y * 16 + 12], fill=(230, 180, 40))
        for n in m['npcs']: d.ellipse([n['x'] * 16 + 3, n['y'] * 16 + 3, n['x'] * 16 + 12, n['y'] * 16 + 12], fill=(60, 200, 255))
        for e in m['events']: d.rectangle([e['x'] * 16, e['y'] * 16, (e['x'] + e['w']) * 16 - 1, (e['y'] + e['h']) * 16 - 1], outline=(255, 60, 60))
        ex, ey = m['entry']; d.ellipse([ex * 16 + 4, ey * 16 + 4, ex * 16 + 11, ey * 16 + 11], fill=(80, 255, 80))
    if scale != 1: im = im.resize((int(im.width * scale), int(im.height * scale)), Image.NEAREST if scale >= 1 else Image.BILINEAR)
    return im

if __name__ == '__main__':
    maps = json.load(open('build/maps.json'))
    mid = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else '/tmp/' + mid + '.png'
    render(maps[mid], float(sys.argv[3]) if len(sys.argv) > 3 else 1).save(out); print(out)
