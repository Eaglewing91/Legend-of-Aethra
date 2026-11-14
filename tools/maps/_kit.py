"""Shared stamps for the map modules: trees, houses, rocks, flowers, fences, save points, furniture."""
import os, random
from PIL import Image
import mapkit as MK
from mapkit import Map, OPEN, SOLID, WATER, COUNTER, HURT, LEDGE, STAIR, LOW, SHALLOW, HIDDEN

TREES = {'round': (0, 0), 'pine': (2, 0), 'dead': (4, 0), 'bushy': (6, 0), 'snowpine': (8, 0), 'white': (12, 0), 'pink': (14, 0), 'light': (16, 0), 'olive': (18, 0)}
def tree(m, x, y, kind='round'):
    """A 2x2 tree: crown (top row) above people, trunk row solid."""
    tx, ty = TREES[kind]
    m.stamp('nature', tx, ty, x, y, 2, 2, overrows=1, col=SOLID)
def forest(m, x0, y0, x1, y1, kinds=('round', 'pine', 'bushy'), density=1.0, seed=1):
    """Fill a box with trees on a 2x2 grid, staggered, solid all through."""
    r = random.Random(seed)
    for y in range(y0, y1, 2):
        for x in range(x0 + ((y // 2) % 2), x1, 2):
            if r.random() < density and x + 1 <= x1 and y + 1 <= y1: tree(m, x, y, r.choice(kinds))
    m.setcol(x0, y0, SOLID, x1 - x0 + 1, y1 - y0 + 1)
BUSHES = [(0, 10), (1, 10), (2, 10), (3, 10), (4, 10), (5, 10)]
FLOWERS = [(0, 11), (1, 11), (2, 11), (5, 11), (6, 11), (7, 11)]
def bush(m, x, y, k=None): tx, ty = BUSHES[(k if k is not None else (x * 3 + y)) % len(BUSHES)]; m.stamp('nature', tx, ty, x, y, col=SOLID)
def flowers(m, pts):
    for (x, y) in pts: tx, ty = FLOWERS[(x * 5 + y * 3) % len(FLOWERS)]; m.stamp('nature', tx, ty, x, y)
def rock(m, x, y, big=False):
    if big: m.stamp('nature', 20, 5, x, y, 2, 2, col=SOLID)
    else: m.stamp('nature', 16 + (x + y) % 2 * 2, 8, x, y, 1, 1, col=SOLID)
def scatter(m, x0, y0, x1, y1, n, fn, seed=3, avoid=None):
    r = random.Random(seed)
    for _ in range(n):
        x, y = r.randint(x0, x1), r.randint(y0, y1)
        if m.col[m.i(x, y)] == OPEN and m.layers['deco'][m.i(x, y)] < 0 and not any(w['x'] == x and w['y'] == y for w in m.warps):
            if avoid and avoid(x, y): continue
            fn(m, x, y)
def grass_tufts(m, x0, y0, x1, y1, n=30, seed=5):
    scatter(m, x0, y0, x1, y1, n, lambda mm, x, y: mm.stamp('detail', (x * 7 + y) % 6, 0, x, y) if mm.mat[mm.i(x, y)] == 'grass' else None, seed)

# ---------- houses from the pack (tx, ty, w, h); the door column is found from the art ----------
HOUSES = {'orange': (0, 0, 4, 3), 'tan': (4, 0, 4, 3), 'orange2': (8, 0, 4, 3), 'red': (12, 0, 4, 3), 'shop': (16, 0, 3, 3),
          'green': (19, 0, 4, 3), 'hut': (23, 0, 3, 3), 'wood': (26, 0, 3, 3), 'igloo': (0, 11, 3, 3), 'igloo2': (6, 11, 3, 3),
          'mound': (0, 7, 3, 3), 'thatch': (3, 7, 3, 3)}
_doors = {}
def door_col(kind):
    if kind in _doors: return _doors[kind]
    tx, ty, w, h = HOUSES[kind]
    im = Image.open(os.path.join(MK.ART, 'na/TilesetHouse.png')).convert('RGBA'); px = im.load()
    best, bx = -1, 0
    for k in range(w):
        n = 0
        for yy in range(16):
            for xx in range(16):
                r, g, b, a = px[(tx + k) * 16 + xx, (ty + h - 1) * 16 + yy]
                if a > 200 and r + g + b < 120: n += 1
        if n > best: best, bx = n, k
    _doors[kind] = bx; return bx
def house(m, x, y, kind='orange', to=None, name=None):
    """Stamp a house at (x, y) (top-left). to = (map, tx, ty) puts a door warp. Returns the door (x, y)."""
    tx, ty, w, h = HOUSES[kind]
    m.stamp('house', tx, ty, x, y, w, h, overrows=1, col=SOLID)
    dx = x + door_col(kind); dy = y + h - 1
    if to: m.warp(dx, dy, to[0], to[1], to[2], 0); m.setcol(dx, dy, OPEN)
    if name: m.sign(dx + 1 if dx + 1 < x + w else dx - 1, dy + 1, name) if False else None
    return (dx, dy)
def fence_h(m, x0, x1, y):
    for x in range(x0, x1 + 1): m.stamp('house', 10 if x == x0 else 12 if x == x1 else 11, 4, x, y, col=LOW)
def savepoint(m, x, y):
    m.stamp('nature', 1, 15, x, y, col=SOLID); m.event(x, y, 'savepoint', touch=False); m.extra.setdefault('saves', []).append([x, y])
def sign(m, x, y, text): m.stamp('house', 6, 2, x, y, col=SOLID); m.sign(x, y, text)
def lamp(m, x, y): m.stamp('house', 22, 15, x, y, col=SOLID)
def barrel(m, x, y): m.stamp('house', 17, 14, x, y, col=SOLID)
def crate(m, x, y): m.stamp('house', 16, 14, x, y, col=SOLID)

# ---------- rooms ----------
def room(m, x0, y0, x1, y1, floor='brick', wall='brick', thick=2):
    """Walls around a box, floor inside; the top wall is 'thick' rows (its face shows)."""
    m.walls(wall, x0, y0, x1, y0 + thick - 1); m.walls(wall, x0, y1, x1, y1)
    m.walls(wall, x0, y0, x0, y1); m.walls(wall, x1, y0, x1, y1)
    m.ground(floor, x0 + 1, y0 + thick, x1 - 1, y1 - 1)
def carve(m, x0, y0, x1, y1, floor):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if m.ok(x, y): m.wall[m.i(x, y)] = None; m.ground(floor, x, y, x, y)
