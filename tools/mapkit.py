"""Map kit for Legend of Aethra: materials, auto-tiling, stamps and the Map container.

Maps are painted from text rows with a legend (one character per tile) and then dressed with stamps (houses, trees,
furniture...). Soft grounds (grass, dirt, sand, snow) and liquids (water, lava, poison) get generated rounded
transition tiles; walls of any material get generated thick walls with rounded corners and a face where floor lies
below. Everything is written to art/generated/ by build_sheets() and referenced as sheet << 16 | ty << 8 | tx.

Collision: 0 open, 1 solid, 2 water (deep), 3 counter (talk across), 4 damage floor, 5 ledge, 6 stairs/door (warp),
7 low (blocks walking, not sight), 8 shallow water (walkable), 9 hidden passage (walkable, drawn as wall).
"""
import json, math, os
from PIL import Image

ART = os.path.join(os.path.dirname(__file__), '..', 'art')
GEN = os.path.join(ART, 'generated')
OPEN, SOLID, WATER, COUNTER, HURT, LEDGE, STAIR, LOW, SHALLOW, HIDDEN = range(10)

# ---------- sheets (index order is what the game uses) ----------
SHEETS = [
    ('floor', 'na/TilesetFloor.png'), ('nature', 'na/TilesetNature.png'), ('water', 'na/TilesetWater.png'),
    ('house', 'na/TilesetHouse.png'), ('relief', 'na/TilesetRelief.png'), ('elem', 'na/TilesetElement.png'),
    ('detail', 'na/TilesetFloorDetail.png'), ('infloor', 'na/TilesetInteriorFloor.png'), ('dungeon', 'na/TilesetDungeon.png'),
    ('desert', 'na/TilesetDesert.png'), ('towers', 'na/TilesetTowers.png'), ('village', 'na/TilesetVillageAbandoned.png'),
    ('field', 'na/TilesetField.png'), ('floorb', 'na/TilesetFloorB.png'), ('hole', 'na/TilesetHole.png'),
    ('rdetail', 'na/TilesetReliefDetail.png'), ('pipes', 'na/Pipes.png'), ('logic', 'na/TilesetLogic.png'),
    ('bed', 'na/tileset_bed.png'), ('camp', 'na/tileset_camp.png'),
    ('ground', 'generated/ground.png'), ('walls', 'generated/walls.png'), ('fills', 'generated/fills.png'),
]
SI = {n: i for i, (n, _) in enumerate(SHEETS)}
def ref(sheet, tx, ty): return SI[sheet] << 16 | ty << 8 | tx

# ---------- materials ----------
# soft grounds and liquids blend; 'hard' floors are plain tiles. prio: higher draws its edge over lower.
# fill: (sheet, tx, ty) or a generated fill name; var: occasional variant tiles
MATS = {
    'sand':   dict(fill=('floor', 1, 1), soft=1, prio=1),
    'dirt':   dict(fill=('floor', 12, 8), soft=1, prio=2),
    'grass':  dict(fill=('floor', 11, 12), soft=1, prio=3, var=[('floor', 12, 12), ('floor', 13, 12), ('floor', 14, 12)]),
    'snow':   dict(fill=('floor', 1, 15), soft=1, prio=4, var=[('floor', 0, 18), ('floor', 1, 18)]),
    'ash':    dict(fill='ash', soft=1, prio=2),
    'water':  dict(fill=('water', 1, 7), soft=1, prio=9, liquid=1),
    'poison': dict(fill=('water', 13, 7), soft=1, prio=9, liquid=1),
    'lava':   dict(fill='lava', soft=1, prio=9, liquid=1),
    'aether': dict(fill='aether', soft=1, prio=9, liquid=1),
    'ice':    dict(fill=('water', 13, 1), soft=1, prio=8),
    # hard floors
    'cobble': dict(fill=('infloor', 1, 13)), 'darkcobble': dict(fill=('infloor', 12, 13)),
    'brick':  dict(fill=('infloor', 1, 1)), 'redbrick': dict(fill=('infloor', 1, 7)),
    'tile':   dict(fill=('infloor', 12, 1)), 'moss': dict(fill=('infloor', 12, 7)),
    'planks': dict(fill=('water', 1, 13)), 'metal': dict(fill='metal'), 'grate': dict(fill='grate'),
    'carpet': dict(fill='carpet'), 'crystal': dict(fill='crystal'), 'void': dict(fill='void'),
    'cave':   dict(fill='cave'), 'darkmetal': dict(fill='darkmetal'), 'marble': dict(fill='marble'),
}
# generated fills: base texture + tint (r, g, b) multipliers (+ optional grid lines for metal plates)
FILLS = {
    'metal': (('infloor', 12, 1), (0.62, 0.7, 0.8), 'plate'), 'darkmetal': (('infloor', 12, 13), (0.7, 0.78, 0.9), 'plate'),
    'grate': (('infloor', 12, 13), (0.75, 0.8, 0.85), 'grate'), 'carpet': (('infloor', 12, 1), (1.0, 0.45, 0.45), None),
    'crystal': (('water', 13, 1), (0.8, 0.9, 1.15), None), 'void': (None, (0, 0, 0), None),
    'cave': (('infloor', 12, 13), (1.05, 0.9, 0.78), None), 'marble': (('infloor', 1, 1), (0.95, 0.97, 1.02), None),
    'ash': (('floor', 12, 8), (0.55, 0.52, 0.5), None), 'lava': (('water', 1, 7), (2.4, 0.55, 0.15), None),
    'aether': (('water', 1, 7), (0.45, 1.2, 1.1), None),
}
FILL_ORDER = list(FILLS)
# walls: top texture, face texture, tint
WALLS = {
    'rock': (('infloor', 12, 13), ('infloor', 14, 13), (1.1, 0.95, 0.82)),
    'brick': (('infloor', 1, 7), ('infloor', 1, 7), (0.85, 0.72, 0.62)),
    'stone': (('infloor', 12, 7), ('infloor', 13, 13), (0.95, 1.0, 0.92)),
    'metal': (('infloor', 12, 1), ('infloor', 13, 1), (0.6, 0.68, 0.8)),
    'dark': (('infloor', 12, 13), ('infloor', 14, 13), (0.75, 0.72, 0.9)),
    'ice': (('infloor', 1, 1), ('infloor', 1, 1), (0.75, 0.9, 1.15)),
    'sand': (('infloor', 1, 13), ('infloor', 2, 13), (1.0, 0.92, 0.8)),
    'pale': (('infloor', 1, 1), ('infloor', 2, 1), (0.95, 0.88, 0.82)),
    'wood': (('water', 1, 13), ('water', 1, 13), (0.8, 0.65, 0.5)),
    'crystal': (('water', 13, 1), ('water', 13, 1), (0.85, 0.75, 1.2)),
    'lava': (('infloor', 12, 13), ('infloor', 14, 13), (1.2, 0.6, 0.45)),
    'hedge': (('floor', 11, 12), ('floor', 11, 12), (0.6, 0.85, 0.55)),
}
WALL_ORDER = list(WALLS)
PAIRS = []          # (top material, bottom material) -> generated on demand
def pair(top, bot):
    k = (top, bot)
    if k not in PAIRS: PAIRS.append(k)
    return PAIRS.index(k)

N, E, S, W, NE, SE, SW, NW = 1, 2, 4, 8, 16, 32, 64, 128
NB = ((N, 0, -1), (E, 1, 0), (S, 0, 1), (W, -1, 0), (NE, 1, -1), (SE, 1, 1), (SW, -1, 1), (NW, -1, -1))
def mask(isin, x, y):
    k = 0
    for bit, dx, dy in NB:
        if isin(x + dx, y + dy): k |= bit
    # diagonals only count when both sides do (standard 47-tile reduction)
    for bit, a, b in ((NE, N, E), (SE, S, E), (SW, S, W), (NW, N, W)):
        if not (k & a and k & b): k &= ~bit
    return k

def fill_ref(mat, x=0, y=0):
    f = MATS[mat]['fill']
    v = MATS[mat].get('var')
    if v and ((x * 7 + y * 13) % 11) == 0:
        f = v[(x * 3 + y) % len(v)]
    if isinstance(f, str): return ref('fills', FILL_ORDER.index(f), 0)
    return ref(f[0], f[1], f[2])

# ---------- the map ----------
class Map:
    def __init__(self, mid, w, h, name, music='town', kind='town', enc=None, dark=0):
        self.id, self.w, self.h, self.name, self.music, self.kind = mid, w, h, name, music, kind
        self.mat = [None] * (w * h)          # ground material per cell
        self.wall = [None] * (w * h)         # wall material per cell
        self.layers = {k: [-1] * (w * h) for k in ('ground', 'wall', 'deco', 'over')}
        self.under = 'cave'                  # floor shown at the rounded corners of walls
        self.col = [OPEN] * (w * h)
        self.warps, self.npcs, self.chests, self.events, self.signs = [], [], {}, [], {}
        self.enc = enc                       # encounter group id (None = no random battles)
        self.zones = []                      # [x, y, w, h, encounter group]
        self.dark, self.extra = dark, {}
        self.entry = [w // 2, h // 2]
    def ok(self, x, y): return 0 <= x < self.w and 0 <= y < self.h
    def i(self, x, y): return y * self.w + x
    def put(self, layer, r, x, y):
        if self.ok(x, y): self.layers[layer][self.i(x, y)] = r
    def setcol(self, x, y, c, w=1, h=1):
        for j in range(h):
            for k in range(w):
                if self.ok(x + k, y + j): self.col[self.i(x + k, y + j)] = c
    def ground(self, mat, x0, y0, x1, y1):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if self.ok(x, y):
                    self.mat[self.i(x, y)] = mat; self.wall[self.i(x, y)] = None
                    self.col[self.i(x, y)] = WATER if MATS[mat].get('liquid') else OPEN
                    if mat == 'lava': self.col[self.i(x, y)] = SOLID
    def walls(self, mat, x0, y0, x1, y1):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if self.ok(x, y): self.wall[self.i(x, y)] = mat; self.col[self.i(x, y)] = SOLID
    def stamp(self, sheet, tx, ty, x, y, w=1, h=1, layer='deco', col=None, overrows=0):
        """Copy a w x h block of a sheet; the top 'overrows' rows go on the over layer (drawn above people)."""
        for j in range(h):
            for k in range(w):
                self.put('over' if j < overrows else layer, ref(sheet, tx + k, ty + j), x + k, y + j)
        if col is not None: self.setcol(x, y + overrows, col, w, h - overrows)
    def warp(self, x, y, to, tx, ty, dir=2, w=1, flag=None):
        for k in range(w):
            self.warps.append({'x': x + k, 'y': y, 'to': to, 'tx': tx + k, 'ty': ty, 'dir': dir})
            if flag: self.warps[-1]['flag'] = flag
            self.setcol(x + k, y, OPEN)
    def npc(self, x, y, who, **kw):
        d = {'x': x, 'y': y, 'who': who}; d.update({('if' if k == 'if_' else k): v for k, v in kw.items()}); self.npcs.append(d); return d
    def chest(self, x, y, item, n=1, gid=None):
        key = gid or '%s:%d,%d' % (self.id, x, y)
        self.chests['%d,%d' % (x, y)] = {'item': item, 'n': n, 'id': key}
        self.setcol(x, y, SOLID)
    def sign(self, x, y, text): self.signs['%d,%d' % (x, y)] = text
    def event(self, x, y, eid, w=1, h=1, touch=True, **kw):
        d = {'x': x, 'y': y, 'w': w, 'h': h, 'id': eid, 'touch': touch}; d.update({('if' if k == 'if_' else k): v for k, v in kw.items()}); self.events.append(d)
    def zone(self, x, y, w, h, group): self.zones.append([x, y, w, h, group])
    def variant(self, when, tiles=(), col=()):
        """A story change: when the condition holds, put tiles [(layer, x, y, ref or -1)] and collision [(x, y, c)]."""
        self.extra.setdefault('variants', []).append({'when': when, 'tiles': [[L, self.i(x, y), r] for (L, x, y, r) in tiles],
                                                      'col': [[self.i(x, y), c] for (x, y, c) in col]})
    def gate(self, when, x, y, w=1, h=1, tile=('dungeon', 0, 1), layer='deco'):
        """A barrier (shutter, rubble, locked grille) that disappears when the condition holds."""
        for j in range(h):
            for k in range(w): self.put(layer, ref(*tile), x + k, y + j)
        self.setcol(x, y, SOLID, w, h)
        self.variant(when, [(layer, x + k, y + j, -1) for j in range(h) for k in range(w)], [(x + k, y + j, OPEN) for j in range(h) for k in range(w)])

    # ---------- painting from text ----------
    def paint(self, rows, legend, ox=0, oy=0):
        """legend: char -> ('g', mat) ground | ('w', mat) wall | ('gw', ground, wall) wall over ground |
        callable(m, x, y) | ('g', mat, fn) ground then fn."""
        for j, row in enumerate(rows):
            for k, ch in enumerate(row):
                x, y = ox + k, oy + j
                if not self.ok(x, y) or ch not in legend: continue
                L = legend[ch]
                if callable(L): L(self, x, y); continue
                if L[0] == 'g': self.ground(L[1], x, y, x, y)
                elif L[0] == 'w': self.walls(L[1], x, y, x, y)
                elif L[0] == 'gw': self.ground(L[1], x, y, x, y); self.walls(L[2], x, y, x, y)
                if len(L) > 2 and callable(L[-1]): L[-1](self, x, y)
    def finish(self):
        """Turn materials and walls into tiles."""
        W, H = self.w, self.h
        mat = lambda x, y: self.mat[self.i(x, y)] if self.ok(x, y) else None
        wal = lambda x, y: self.wall[self.i(x, y)] if self.ok(x, y) else '#edge'
        G = self.layers['ground']
        for y in range(H):
            for x in range(W):
                i = self.i(x, y); a = self.mat[i]
                if self.wall[i]:
                    wm = self.wall[i]
                    k = mask(lambda p, q: wal(p, q) is not None, x, y)
                    self.layers['wall'][i] = ref('walls', k & 15, WALL_ORDER.index(wm) * 16 + (k >> 4))
                    G[i] = fill_ref(a or self.under, x, y)
                    continue
                if a is None: continue
                A = MATS[a]
                if not A.get('soft'):
                    G[i] = fill_ref(a, x, y); continue
                # lowest-priority different soft neighbour = what shows under our edge
                lows = []
                for _, dx, dy in NB:
                    b = mat(x + dx, y + dy)
                    if b and b != a and MATS[b].get('soft') and MATS[b]['prio'] < A['prio']: lows.append(b)
                    elif b and b != a and not MATS[b].get('soft') and A.get('liquid'): lows.append(b)
                if not lows:
                    G[i] = fill_ref(a, x, y); continue
                bot = min(lows, key=lambda b: MATS[b].get('prio', 0))
                k = mask(lambda p, q: (mat(p, q) == a) or (mat(p, q) is not None and MATS[mat(p, q)].get('soft') and MATS[mat(p, q)]['prio'] > A['prio'] and not MATS[mat(p, q)].get('liquid')) or mat(p, q) is None, x, y)
                if k == 255: G[i] = fill_ref(a, x, y); continue
                p = pair(a, bot)
                G[i] = ref('ground', k & 15, p * 16 + (k >> 4))
    def json(self):
        return {'id': self.id, 'name': self.name, 'w': self.w, 'h': self.h, 'music': self.music, 'kind': self.kind,
                'layers': self.layers, 'col': self.col, 'warps': self.warps, 'npcs': self.npcs, 'chests': self.chests,
                'events': self.events, 'signs': self.signs, 'enc': self.enc, 'zones': self.zones, 'dark': self.dark,
                'entry': self.entry, **self.extra}

# ---------- generated sheets ----------
def _sheet(name):
    for n, f in SHEETS:
        if n == name: return Image.open(os.path.join(ART, f)).convert('RGBA')
_cache = {}
def tile(src):
    if src is None: return Image.new('RGBA', (16, 16), (6, 6, 10, 255))
    s, tx, ty = src
    if s not in _cache: _cache[s] = _sheet(s)
    return _cache[s].crop((tx * 16, ty * 16, tx * 16 + 16, ty * 16 + 16))
def tint(im, t, f=1.0):
    out = im.copy(); px = out.load()
    for y in range(16):
        for x in range(16):
            r, g, b, a = px[x, y]
            px[x, y] = (min(255, int(r * t[0] * f)), min(255, int(g * t[1] * f)), min(255, int(b * t[2] * f)), a)
    return out
def fill_tile(name):
    src, t, style = FILLS[name]
    im = tint(tile(src), t) if src else Image.new('RGBA', (16, 16), (4, 4, 8, 255))
    if name == 'lava': im = tint(tile(src), (1, 1, 1)); px = im.load(); [px.__setitem__((x, y), (min(255, int(px[x, y][2] * 1.6 + 40)), int(px[x, y][1] * 0.45), 20, 255)) for y in range(16) for x in range(16)]
    px = im.load()
    if style == 'plate':
        for k in range(16):
            for (x, y) in ((k, 0), (0, k)): px[x, y] = tuple(int(c * 0.55) for c in px[x, y][:3]) + (255,)
            for (x, y) in ((k, 1), (1, k)): px[x, y] = tuple(min(255, int(c * 1.25)) for c in px[x, y][:3]) + (255,)
        for (x, y) in ((3, 3), (12, 3), (3, 12), (12, 12)): px[x, y] = (210, 220, 235, 255)
    if style == 'grate':
        for y in range(16):
            for x in range(16):
                if x % 4 == 0 or y % 4 == 0: px[x, y] = tuple(int(c * 1.3) if c < 190 else c for c in px[x, y][:3]) + (255,)
                else: px[x, y] = tuple(int(c * 0.35) for c in px[x, y][:3]) + (255,)
    return im
WAVE = [2, 2, 3, 3, 2, 1, 1, 2, 2, 3, 2, 2, 1, 1, 1, 2]
def inside(k, x, y):
    px, py = x + 0.5, y + 0.5
    n, e, s, w = k & N, k & E, k & S, k & W
    if not n and py < WAVE[x]: return False
    if not s and 16 - py < WAVE[(x + 7) % 16]: return False
    if not w and px < WAVE[(y + 3) % 16]: return False
    if not e and 16 - px < WAVE[(y + 11) % 16]: return False
    R = 6
    for (a, b, cx, cy) in ((n, w, R, R), (n, e, 16 - R, R), (s, w, R, 16 - R), (s, e, 16 - R, 16 - R)):
        if not a and not b and ((px < cx) if cx == R else (px > cx)) and ((py < cy) if cy == R else (py > cy)):
            if math.hypot(px - cx, py - cy) > R - 1.5: return False
    for (a, b, d, cx, cy) in ((n, w, k & NW, 0, 0), (n, e, k & NE, 16, 0), (s, w, k & SW, 0, 16), (s, e, k & SE, 16, 16)):
        if a and b and not d and math.hypot(px - cx, py - cy) < 3.5: return False
    return True
def mat_tile(m):
    f = MATS[m]['fill']
    return fill_tile(f) if isinstance(f, str) else tile(f)
def build_ground():
    out = Image.new('RGBA', (256, 256 * max(1, len(PAIRS))), (0, 0, 0, 0))
    for p, (top, bot) in enumerate(PAIRS):
        T, B = mat_tile(top), mat_tile(bot); liquid = MATS[top].get('liquid')
        for k in range(256):
            t = B.copy(); tp = t.load(); Tp = T.load()
            ins = [[inside(k, x, y) for x in range(16)] for y in range(16)]
            for y in range(16):
                for x in range(16):
                    if not ins[y][x]: continue
                    c = Tp[x, y]
                    edge = any(0 <= x + dx < 16 and 0 <= y + dy < 16 and not ins[y + dy][x + dx] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
                    if edge:
                        c = ((236, 250, 255, 255) if top == 'water' else (255, 200, 90, 255) if top == 'lava' else (180, 120, 200, 255)) if liquid else (int(c[0] * 0.72), int(c[1] * 0.72), int(c[2] * 0.72), 255)
                    elif liquid and any(0 <= x + dx < 16 and 0 <= y + dy < 16 and not ins[y + dy][x + dx] for dx, dy in ((2, 0), (-2, 0), (0, 2), (0, -2))):
                        c = (int(c[0] * 0.8), int(c[1] * 0.85), int(c[2] * 0.95), 255)
                    tp[x, y] = c
            out.paste(t, ((k & 15) * 16, p * 256 + (k >> 4) * 16))
    out.save(os.path.join(GEN, 'ground.png'))
def wall_inside(k, x, y):
    px, py = x + 0.5, y + 0.5
    n, e, s, w = k & N, k & E, k & S, k & W
    R = 5
    for (a, b, cx, cy) in ((n, w, R, R), (n, e, 16 - R, R), (s, w, R, 16 - R), (s, e, 16 - R, 16 - R)):
        if not a and not b and ((px < cx) if cx == R else (px > cx)) and ((py < cy) if cy == R else (py > cy)):
            if math.hypot(px - cx, py - cy) > R: return False
    for (a, b, d, cx, cy) in ((n, w, k & NW, 0, 0), (n, e, k & NE, 16, 0), (s, w, k & SW, 0, 16), (s, e, k & SE, 16, 16)):
        if a and b and not d and math.hypot(px - cx, py - cy) < 2.6: return False
    return True
def build_walls():
    out = Image.new('RGBA', (256, 256 * len(WALLS)), (0, 0, 0, 0))
    for p, name in enumerate(WALL_ORDER):
        top, face, t = WALLS[name]
        T, Fc = tile(top).load(), tile(face).load()
        for k in range(256):
            img = Image.new('RGBA', (16, 16), (0, 0, 0, 0)); ip = img.load()
            ins = [[wall_inside(k, x, y) for x in range(16)] for y in range(16)]
            facing = not (k & S)
            for y in range(16):
                for x in range(16):
                    if not ins[y][x]: continue
                    out_n = lambda dx, dy: not (0 <= x + dx < 16 and 0 <= y + dy < 16) and ((dx == -1 and not k & W) or (dx == 1 and not k & E) or (dy == -1 and not k & N) or (dy == 1 and not k & S))
                    edge = any((0 <= x + dx < 16 and 0 <= y + dy < 16 and not ins[y + dy][x + dx]) or out_n(dx, dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
                    if facing and y >= 8:
                        c = Fc[x, y]; f = 0.8 if y > 8 else 0.45
                        if y > 8 and (y - 9) % 4 == 3: f *= 0.82
                    else:
                        c = T[x, y]; f = 1.18 if ((y <= 1 and not k & N) or (x <= 1 and not k & W)) else 1.0
                    c = (min(255, int(c[0] * t[0] * f)), min(255, int(c[1] * t[1] * f)), min(255, int(c[2] * t[2] * f)), 255)
                    if edge: c = (22, 18, 26, 255)
                    ip[x, y] = c
            out.paste(img, ((k & 15) * 16, p * 256 + (k >> 4) * 16))
    out.save(os.path.join(GEN, 'walls.png'))
def build_fills():
    out = Image.new('RGBA', (16 * len(FILL_ORDER), 16))
    for i, n in enumerate(FILL_ORDER): out.paste(fill_tile(n), (i * 16, 0))
    out.save(os.path.join(GEN, 'fills.png'))
def build_sheets():
    os.makedirs(GEN, exist_ok=True); build_fills(); build_walls(); build_ground()
