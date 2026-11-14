"""Find cut-off objects (half a tree, a rock missing its corner) on every map in build/maps.json.

For each tileset tile we work out which edges carry on into the next tile of the sheet (both tiles have solid pixels
along the shared edge). A placed tile whose object carries on in some direction, where the map's neighbour cell
doesn't hold the matching tile, is cut. Prints a summary; with --list, every cut cell."""
import json, os, sys
from collections import defaultdict
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
import mapkit as MK

OBJ = {'nature', 'house', 'towers', 'camp', 'bed', 'elem', 'dungeon', 'pipes', 'village', 'desert'}
_edges = {}
def edges(sheet):
    if sheet in _edges: return _edges[sheet]
    f = dict(MK.SHEETS)[sheet]; im = Image.open(os.path.join(MK.ART, f)).convert('RGBA'); a = im.getchannel('A').load()
    W, H = im.size[0] // 16, im.size[1] // 16
    def edge(tx, ty, side):
        n = 0
        for k in range(16):
            x, y = {'L': (tx * 16, ty * 16 + k), 'R': (tx * 16 + 15, ty * 16 + k), 'T': (tx * 16 + k, ty * 16), 'B': (tx * 16 + k, ty * 16 + 15)}[side]
            if a[x, y] > 128: n += 1
        return n
    E = {}
    for ty in range(H):
        for tx in range(W):
            c = {}
            if tx + 1 < W and edge(tx, ty, 'R') >= 4 and edge(tx + 1, ty, 'L') >= 4: c['R'] = (tx + 1, ty)
            if tx > 0 and edge(tx, ty, 'L') >= 4 and edge(tx - 1, ty, 'R') >= 4: c['L'] = (tx - 1, ty)
            if ty + 1 < H and edge(tx, ty, 'B') >= 4 and edge(tx, ty + 1, 'T') >= 4: c['B'] = (tx, ty + 1)
            if ty > 0 and edge(tx, ty, 'T') >= 4 and edge(tx, ty - 1, 'B') >= 4: c['T'] = (tx, ty - 1)
            E[(tx, ty)] = c
    _edges[sheet] = E; return E

# tiles the game uses as whole objects on their own (side by side in the sheet, so their edges touch)
ALONE = {('nature', x, 10) for x in range(10)} | {('nature', x, 11) for x in range(10)} | {('nature', 15, 9), ('nature', 18, 9), ('nature', 17, 13), ('nature', 18, 13), ('nature', 19, 13), ('nature', 4, 13)} \
    | {('nature', x, y) for x in (4, 5, 6) for y in (14, 15)} | {('house', 19, 14), ('house', 20, 14), ('house', 16, 15), ('house', 17, 15), ('house', 18, 15), ('house', 21, 13), ('house', 21, 14), ('house', 21, 15)} \
    | {('house', 7, 15), ('house', 7, 16), ('house', 7, 17), ('house', 7, 18), ('house', 6, 2), ('house', 10, 4), ('house', 11, 4), ('house', 12, 4)} \
    | {('dungeon', x, y) for x in range(12) for y in range(4)} | {('elem', x, 0) for x in range(16)} | {('bed', 5, 3), ('bed', 5, 4), ('bed', 12, 3), ('bed', 12, 4), ('bed', 12, 0), ('bed', 12, 1)} | {('nature', x, 8) for x in range(12)} | {('nature', x, 9) for x in range(12)} | {('elem', x, 10) for x in (2, 3, 4)} | {('elem', 6, 11), ('elem', 7, 11)} | {('pipes', x, y) for x in range(15) for y in range(3)}
def cuts(m):
    W, H = m['w'], m['h']; names = [n for n, _ in MK.SHEETS]; out = []
    L = [m['layers'][k] for k in ('deco', 'over')]
    def at(x, y):
        if not (0 <= x < W and 0 <= y < H): return set()
        return {r for lay in L for r in [lay[y * W + x]] if r >= 0}
    for lay in L:
        for i, r in enumerate(lay):
            if r < 0: continue
            sh = names[r >> 16]
            if sh not in OBJ: continue
            tx, ty = r & 255, (r >> 8) & 255; x, y = i % W, i // W
            for d, (nx, ny) in edges(sh).get((tx, ty), {}).items():
                X, Y = x + {'L': -1, 'R': 1, 'T': 0, 'B': 0}[d], y + {'L': 0, 'R': 0, 'T': -1, 'B': 1}[d]
                want = MK.SI[sh] << 16 | ny << 8 | nx
                if want not in at(X, Y) and not ((sh, tx, ty) in ALONE and (sh, nx, ny) in ALONE): out.append((x, y, sh, tx, ty, d))
    return out

def prune(m):
    """Remove tree pieces (and other big nature pieces) whose object is cut; put a bush where a solid piece was."""
    names = [n for n, _ in MK.SHEETS]; nat = MK.SI['nature']; W, H = m.w, m.h
    E = edges('nature')
    def has(x, y, r): return 0 <= x < W and 0 <= y < H and (m.layers['deco'][y * W + x] == r or m.layers['over'][y * W + x] == r)
    for _ in range(6):
        gone = 0
        for L in ('deco', 'over'):
            lay = m.layers[L]
            for i, r in enumerate(lay):
                if r < 0 or (r >> 16) != nat: continue
                tx, ty = r & 255, (r >> 8) & 255
                if not (ty <= 9 or ty >= 16): continue          # trees, stumps and big rocks; not bushes and flowers
                x, y = i % W, i // W
                for d, (nx, ny) in E.get((tx, ty), {}).items():
                    X, Y = x + {'L': -1, 'R': 1, 'T': 0, 'B': 0}[d], y + {'L': 0, 'R': 0, 'T': -1, 'B': 1}[d]
                    if not has(X, Y, nat << 16 | ny << 8 | nx):
                        lay[i] = -1; gone += 1
                        if L == 'deco' and m.col[i] == MK.SOLID: lay[i] = MK.ref('nature', (x * 3 + y) % 6, 10)
                        break
        if not gone: break

if __name__ == '__main__':
    M = json.load(open('build/maps.json')); total = 0; kinds = defaultdict(int)
    for k, m in M.items():
        c = cuts(m); total += len(c)
        for (x, y, sh, tx, ty, d) in c: kinds[(sh, tx, ty)] += 1
        if c and '--list' in sys.argv: print(k, c[:12])
        elif c: print('%-22s %d' % (k, len(c)))
    print('total cut cells:', total)
    print('worst tiles:', sorted(kinds.items(), key=lambda kv: -kv[1])[:20])
