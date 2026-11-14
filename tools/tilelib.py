"""Map builder for Legend of Varrowmere.

Maps are authored here in Python with stamps from the CC0 art pack, then written to src/data/maps.json.
Each map has three art layers (ground, deco under actors, over above actors), a collision grid,
camera areas (one per screen, like the original), warps, signs, chests and spawns.

Tile reference: sheet << 16 | ty << 8 | tx, or -1 for empty.
Sheets: 0 Overworld, 1 Inner, 2 cave, 3 objects.
Collision codes: 0 open, 1 solid, 2 deep water, 3 pit, 4 ledge (jump south), 5 low wall (blocks walking, not arrows),
                 6 bush (solid, cuttable, liftable), 7 rock (solid, liftable), 8 shallow water.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import blend as BLEND
BLEND.build()
BLEND.build_walls()
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
OW, IN, CV, OB = 0, 1, 2, 3
NF, NN = 4, 5          # Ninja Adventure floor and nature sheets
BL = 6                 # generated soft-edge ground transitions (tools/blend.py)
NW, NH, NR, NE, ND, NI = 7, 8, 9, 10, 11, 12   # pack water, houses, cliffs, elements, floor details, interior floors
LM = 13                # landmarks (generated in tools/patch_sheets.py)
DW = 14                # dungeon walls (generated in tools/blend.py)
DF = 15                # dungeon floors to match
OPEN, SOLID, DEEP, PIT, LEDGE, LOW, BUSH, ROCK, SHALLOW, CRACK, TORCH, TORCH_LIT, LOCKED, BIGLOCK, BLOCK, PLATE, SHUTTER, BIGCHEST, LEVER, SWITCH, POST, _21, PEDESTAL, BARRIER, PEG, DARKROCK = range(26)



def ref(sheet, tx, ty):
    return sheet << 16 | ty << 8 | tx


class Map:
    def __init__(self, mid, w, h, name, indoor=False, dark=False, music='village'):
        self.id, self.w, self.h, self.name = mid, w, h, name
        self.layers = {k: [-1] * (w * h) for k in ('ground', 'deco', 'over')}
        self.col = [OPEN] * (w * h)
        self.areas, self.warps, self.signs, self.chests, self.spawns = [], [], {}, {}, []
        self.indoor, self.dark, self.music = indoor, dark, music
        self.entry = [2, 2]
        self.extra = {}

    def ok(self, x, y):
        return 0 <= x < self.w and 0 <= y < self.h

    def put(self, layer, sheet, tx, ty, x, y):
        if self.ok(x, y):
            self.layers[layer][y * self.w + x] = ref(sheet, tx, ty)

    def stamp(self, sheet, tx, ty, x, y, w=1, h=1, layer='deco', col=None):
        for j in range(h):
            for i in range(w):
                self.put(layer, sheet, tx + i, ty + j, x + i, y + j)
        if col is not None:
            self.solid(x, y, w, h, col)

    def fill(self, sheet, tx, ty, x0=0, y0=0, x1=None, y1=None, layer='ground'):
        x1 = self.w - 1 if x1 is None else x1
        y1 = self.h - 1 if y1 is None else y1
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.put(layer, sheet, tx, ty, x, y)

    def nine(self, sheet, tx, ty, x0, y0, x1, y1, layer='ground', col=None):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                cx = 0 if x == x0 else 2 if x == x1 else 1
                cy = 0 if y == y0 else 2 if y == y1 else 1
                self.put(layer, sheet, tx + cx, ty + cy, x, y)
                if col is not None and self.ok(x, y):
                    self.col[y * self.w + x] = col

    def solid(self, x, y, w=1, h=1, code=SOLID):
        for j in range(h):
            for i in range(w):
                if self.ok(x + i, y + j):
                    self.col[(y + j) * self.w + x + i] = code

    def area(self, x, y, w=16, h=14):
        self.areas.append([x, y, w, h])

    def warp(self, x, y, to, tx, ty, dir=2):
        self.warps.append({'x': x, 'y': y, 'to': to, 'tx': tx, 'ty': ty, 'dir': dir})
        self.solid(x, y, 1, 1, OPEN)

    def sign(self, x, y, text):
        self.signs['%d,%d' % (x, y)] = text

    def chest(self, x, y, item, big=False):
        self.chests['%d,%d' % (x, y)] = {'item': item, 'big': big}
        self.stamp(OB, 0, 0, x, y, layer='deco', col=SOLID)

    def spawn(self, kind, x, y, **kw):
        d = {'kind': kind, 'x': x, 'y': y}
        d.update(kw)
        self.spawns.append(d)

    def snapshot(self):
        import copy
        return copy.deepcopy(self.layers), list(self.col), copy.deepcopy(self.warps)

    def variant(self, when, before):
        """Record what changed since snapshot() as a variant applied when a story flag is set, then undo it."""
        layers, col, warps = before
        ch = {'when': when, 'tiles': [], 'col': [], 'warps': [w for w in self.warps if w not in warps]}
        for name in self.layers:
            for i, (a, b) in enumerate(zip(layers[name], self.layers[name])):
                if a != b: ch['tiles'].append([name, i, b])
        for i, (a, b) in enumerate(zip(col, self.col)):
            if a != b: ch['col'].append([i, b])
        self.layers, self.col, self.warps = layers, col, warps
        self.extra.setdefault('variants', []).append(ch)

    def unpoke(self):
        """Border rocks and trees that poke into the land are taken back out wherever they would crowd a chest,
        sign, door, dig spot or person: the border behind them is filled with small rocks instead."""
        spots = [tuple(map(int, k.split(','))) for d in (self.chests, self.signs, self.extra.get('digs', {})) for k in d]
        spots += [(w['x'], w['y']) for w in self.warps] + [(d['x'], d['y']) for d in self.spawns if 'x' in d]
        for pk in getattr(self, 'pokes', []):
            if not any(abs(px - sx) <= 2 and abs(py - sy) <= 2 for (px, py) in pk['poke'] for (sx, sy) in spots):
                continue
            for (x, y) in pk['cells']:
                if not self.ok(x, y):
                    continue
                i = y * self.w + x
                self.layers['deco'][i] = self.layers['over'][i] = -1
                if (x, y) in pk['poke']:
                    self.col[i] = OPEN
                else:
                    tx, ty = pk['small'][(x + y) % len(pk['small'])]
                    self.put('deco', NN, tx, ty, x, y)
        self.pokes = []

    def json(self):
        self.unpoke()
        naremap(self)
        return {'id': self.id, 'name': self.name, 'w': self.w, 'h': self.h, 'layers': self.layers, 'col': self.col,
                'areas': self.areas or [[0, 0, self.w, self.h]], 'warps': self.warps, 'signs': self.signs,
                'chests': self.chests, 'spawns': self.spawns, 'indoor': self.indoor, 'dark': self.dark,
                'music': self.music, 'entry': self.entry, **self.extra}


# ---------- stamps (art pack pieces with their collision) ----------
def grass(m, x0, y0, x1, y1):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            m.put('ground', OW, (x * 3 + y) % 2, 9 if (x * 5 + y * 3) % 7 else 31, x, y)


def road_ns(m, x, y0, y1):          # 2-wide stone road running north-south
    for y in range(y0, y1 + 1):
        m.put('ground', OW, 8, 23 if y % 2 else 24, x, y)
        m.put('ground', OW, 9, 23 if y % 2 else 24, x + 1, y)


def stone_pad(m, x0, y, x1):
    for x in range(x0, x1 + 1):
        m.put('ground', OW, 8, 23, x, y)


FOREST_CLUMPS = [(0, 2), (4, 2), (16, 2), (20, 2), (4, 2), (16, 2)]


def forest(m, x, y):                 # 4 wide tree block (two clumps of the pack's trees, one behind the other): solid below the top row
    for k, (oy, layer0) in enumerate(((0, 'over'), (3, None))):
        tx, ty = FOREST_CLUMPS[(x * 7 + y * 3 + k * 5) % len(FOREST_CLUMPS)]
        for j in range(3):
            for i in range(4):
                layer = layer0 or ('over' if j == 0 else 'deco')
                m.put(layer, NN, tx + i, ty + j, x + i, y + oy + j)
    m.solid(x, y + 3, 4, 3)
    m.solid(x, y + 1, 4, 2)


def house(m, x, y, door_to=None):    # 5x5 house, door at bottom middle
    m.stamp(OW, 6, 0, x, y, 5, 5, col=SOLID)
    if door_to:
        m.warp(x + 2, y + 4, *door_to)


def lake(m, x0, y0, x1, y1):
    m.nine(OW, 2, 6, x0, y0, x1, y1, col=DEEP)
    for x in range(x0, x1 + 1):     # the grassy bank row is walkable
        if m.ok(x, y0):
            m.col[y0 * m.w + x] = OPEN


def fence(m, x0, x1, y):
    # left end post, joined middle posts, right end post (rails meet tile to tile)
    for x in range(x0, x1 + 1):
        tx = 2 if x == x0 else 3 if x == x1 else 4
        m.stamp(OW, tx, 17, x, y, col=LOW)


def flowers(m, pts):
    for (x, y) in pts:
        m.put('deco', OW, 1, 8, x, y)


def bush(m, x, y):
    m.stamp(OW, 0, 16, x, y, col=BUSH)


def fountain(m, x, y):
    m.stamp(OW, 22, 9, x, y, 3, 3, col=SOLID)


def stall(m, x, y):
    m.stamp(OW, 18, 22, x, y, 5, 6)
    m.solid(x, y + 2, 5, 4)


def barrels(m, x, y):
    m.stamp(OW, 33, 0, x, y, 2, 2, col=SOLID)


def signboard(m, x, y, text):
    m.stamp(OW, 34, 2, x, y, 1, 1, col=SOLID)
    m.sign(x, y, text)


# ---------- region painting: author whole screens as text ----------
# .  grass        =  stone road      -  stone path      :  dry earth     ~  deep water (edges drawn automatically)
# F  forest wall  b  bush            r  boulder (Glove) O  big boulder (2x2, top-left)   *  flowers
# H  house (5x5, top-left; the door is the middle of its bottom row)   f  fence (ends joined)   |  fence post
# S  market stall (5x6, top-left)   W  fountain (3x3, top-left)   B  barrels (2x2)   p  pit
def ground_tile(m, gc, X, Y):
    if gc == ':':
        m.put('ground', OW, 12, 13, X, Y)
    elif gc in 'sw':
        r = (X * 7 + Y * 13) % 23
        if gc == 's':
            m.put('ground', NF, *((0, 4) if r == 0 else (1, 4) if r == 1 else (1, 1)), X, Y)
        else:
            m.put('ground', NF, *((0, 18) if r in (0, 5) else (1, 18) if r in (1, 9, 14) else (1, 15)), X, Y)


def paint(m, rows, ox=0, oy=0, base='.', grounds=None):
    H_ = len(rows)
    W_ = max(len(r) for r in rows)
    g = [r.ljust(W_, '.') for r in rows]
    g = round_corners(g) if grounds is None else g
    at = lambda x, y: g[y][x] if 0 <= y < H_ and 0 <= x < W_ else None
    grass(m, ox, oy, ox + W_ - 1, oy + H_ - 1)
    if grounds is not None:              # the world builder says what ground lies under every tile
        for y in range(H_):
            for x in range(W_):
                c = g[y][x]
                gc = c if c in 'sw' else grounds[y][x]
                if gc != '.' and c not in '~-=h':
                    ground_tile(m, gc, ox + x, oy + y)
    elif base in (':', 's', 'w'):          # dry, sandy and snowy lands: everything that isn't grass, water or road sits on the land's own ground
        for y in range(H_):
            for x in range(W_):
                if g[y][x] not in '.*b~-=':
                    X, Y = ox + x, oy + y
                    if base == ':':
                        m.put('ground', OW, 12, 13, X, Y)
                    else:
                        r = (X * 7 + Y * 13) % 23
                        if base == 's':
                            m.put('ground', NF, *((0, 4) if r == 0 else (1, 4) if r == 1 else (1, 1)), X, Y)
                        else:
                            m.put('ground', NF, *((0, 18) if r in (0, 5) else (1, 18) if r in (1, 9, 14) else (1, 15)), X, Y)
    band = set()
    for y in range(H_):
        for x in range(W_):
            if g[y][x] == 'O' and (x < 2 or y < 2 or x >= W_ - 2 or y >= H_ - 2):
                band.update({(ox + x + i, oy + y + j) for i in (0, 1) for j in (0, 1)})
    for y in range(H_):
        for x in range(W_):
            c, X, Y = g[y][x], ox + x, oy + y
            if c == '=':
                m.put('ground', OW, 8 + (X % 2), 23 if Y % 2 else 24, X, Y)
                m.col[Y * m.w + X] = OPEN
            elif c == '-':
                m.put('ground', OW, 8, 23, X, Y)
            elif c == ':':
                m.put('ground', OW, 12, 13, X, Y)
            elif c == 'h':                    # a plank bridge over water
                m.put('ground', NW, 1, 13, X, Y)
                m.col[Y * m.w + X] = OPEN
            elif c == '~':
                k = BLEND.mask(lambda a, b: at(a, b) in ('~', 'h', None), x, y)      # water with soft, foamy banks
                nb = [at(x + i, y + j) for i in (-1, 0, 1) for j in (-1, 0, 1)]
                pair = 5 if any(n in (':', '-', '=') for n in nb) else 6 if base == 's' and not any(n == '.' for n in nb) else 4
                m.put('ground', NW, 1, 7, X, Y) if k == 255 else m.put('ground', BL, k & 15, pair * 16 + (k >> 4), X, Y)
                m.col[Y * m.w + X] = DEEP
            elif c == '~':
                wet = lambda a, b: at(a, b) in ('~', None)
                cx = 0 if not wet(x - 1, y) else 2 if not wet(x + 1, y) else 1
                cy = 0 if not wet(x, y - 1) else 2 if not wet(x, y + 1) else 1
                m.put('ground', OW, 2 + cx, 6 + cy, X, Y)
                m.col[Y * m.w + X] = DEEP
            elif c == 'b':
                bush(m, X, Y)
            elif c == 'r':
                m.put('deco', CV, 5, 4, X, Y)
                m.col[Y * m.w + X] = ROCK
            elif c == '*':
                m.put('deco', OW, 1, 8, X, Y)
            elif c == 'p':
                m.put('ground', CV, 1, 1, X, Y)
                m.col[Y * m.w + X] = PIT
            elif c == 'x':
                m.put('deco', OW, 28, 2, X, Y)
            elif c == 'g':
                m.stamp(OW, 35, 5, X, Y, 2, 2, col=SOLID)
    if grounds is not None:
        soften_grounds(m, g, grounds, ox, oy)
    else:
        soften(m, g, ox, oy, base)
    paint_forest(m, g, ox, oy, base)
    if band:
        dress_border(m, g, ox, oy, base, band)
    rock = {(ox + x, oy + y) for y in range(H_) for x in range(W_) if g[y][x] == 'Q'}
    if rock:                            # rock masses: a packed jumble of the pack's rocks (and a tree or two)
        gb = grounds[0][0] if grounds else base
        kits = {}
        for (X, Y) in rock:
            gc = grounds[Y - oy][X - ox] if grounds else base
            kits.setdefault(gc, set()).add((X, Y))
        for gc, cells in kits.items():
            dress_border(m, g, ox, oy, gc, cells, BORDER_KITS.get(gc, BORDER_KITS['.']))
        void = gb
    for y in range(H_):
        for x in range(W_):
            c, X, Y = g[y][x], ox + x, oy + y
            if c == 'O' and (X, Y) in band:
                pass
            elif c == 'O':
                if base == 's':
                    m.stamp(NN, 12, 6, X, Y, 2, 2, col=SOLID)
                elif base in (':', 'w'):
                    m.stamp(NN, 16, 6, X, Y, 2, 2, col=SOLID)
                else:
                    boulder(m, X, Y)
            elif c == 'T' and (Y + 1 >= m.h or X + 1 >= m.w):
                pass
            elif c == 'T':          # a round tree from the pack (2x2): crown over the top row
                k = (X + Y) % 3
                tx, ty = ((8, 0) if k else (10, 0)) if base == 'w' else ((0, 0), (16, 0), (18, 0))[k]
                for i in range(2):
                    m.put('over', NN, tx + i, ty, X + i, Y)
                    m.put('deco', NN, tx + i, ty + 1, X + i, Y + 1)
                    m.col[(Y + 1) * m.w + X + i] = SOLID
            elif c == 'H':
                m.stamp(OW, 6, 0, X, Y, 5, 5, col=SOLID)
            elif c == 'S':
                stall(m, X, Y)
            elif c == 'W':
                fountain(m, X, Y)
            elif c == 'B':
                barrels(m, X, Y)
            elif c == 'f' and at(x - 1, y) != 'f':
                x1 = x
                while at(x1 + 1, y) == 'f':
                    x1 += 1
                fence(m, X, ox + x1, Y)
            elif c == '|':
                m.stamp(OW, 0, 17, X, Y, col=LOW)


def round_corners(g):
    """Square ponds and dirt patches lose their outermost corner tiles (when grass lies on both open sides),
    so with the soft blend tiles they read as rounded shapes rather than boxes."""
    H_, W_ = len(g), len(g[0])
    rows = [list(r) for r in g]
    at = lambda x, y: rows[y][x] if 0 <= y < H_ and 0 <= x < W_ else None
    for y in range(H_):            # first fill the notches of cross-shaped mud patches (mud is walkable, so this is safe)
        for x in range(W_):
            if rows[y][x] == '.' and sum(at(x + i, y + j) == ':' for i, j in ((1, 0), (-1, 0), (0, 1), (0, -1))) >= 2 and \
               any(at(x + i, y) == ':' and at(x, y + j) == ':' and at(x + i, y + j) == ':' for i in (-1, 1) for j in (-1, 1)):
                rows[y][x] = ':'
    g = [''.join(r) for r in rows]
    rows = [list(r) for r in g]
    at = lambda x, y: g[y][x] if 0 <= y < H_ and 0 <= x < W_ else None
    for y in range(H_):
        for x in range(W_):
            c = g[y][x]
            if c not in '~:':
                continue
            for dx, dy in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
                # a corner: open (grass) on both outward sides and diagonally, its own kind on both inward sides and beyond
                if at(x + dx, y) == '.' and at(x, y + dy) == '.' and at(x + dx, y + dy) == '.' and \
                   at(x - dx, y) == c and at(x, y - dy) == c and at(x - dx, y - dy) == c and at(x - 2 * dx, y) == c and at(x, y - 2 * dy) == c and at(x - 3 * dx, y) == c and at(x, y - 3 * dy) == c and \
                   not any(at(x + i, y + j) in ('f', '|') for i in (-2, -1, 0, 1, 2) for j in (-2, -1, 0, 1, 2)):
                    rows[y][x] = '.'
                    break
    return [''.join(r) for r in rows]


def soften_grounds(m, g, gr, ox, oy):
    """Blend edges when the ground changes inside one area: grass meeting sand, snow or rocky dirt, and dirt paths in grass."""
    H_, W_ = len(g), len(g[0])
    G = lambda x, y: (g[y][x] if g[y][x] in 'sw' else gr[y][x]) if 0 <= x < W_ and 0 <= y < H_ else None
    for y in range(H_):
        for x in range(W_):
            c = g[y][x]
            if c in '~h':
                continue
            if gr[y][x] == '.' and c in ':-=':
                k = BLEND.mask(lambda a, b: not (0 <= a < W_ and 0 <= b < H_) or g[b][a] in ':-=', x, y)
                if k != 255:
                    m.put('ground', BL, k & 15, (k >> 4), ox + x, oy + y)
                continue
            if G(x, y) != '.' or c in 'QFTOg_':
                continue
            others = [G(x + i, y + j) for i in (-1, 0, 1) for j in (-1, 0, 1)]
            kind = next((o for o in ('s', 'w', ':') if o in others), None)
            if not kind:
                continue
            pair = {'s': 1, 'w': 2, ':': 3}[kind]
            k = BLEND.mask(lambda a, b: G(a, b) in ('.', None), x, y)
            if k != 255:
                m.put('ground', BL, k & 15, pair * 16 + (k >> 4), ox + x, oy + y)


def soften(m, g, ox, oy, base):
    """Round off patches of one ground lying on another (dirt on grass, grass on sand or snow) with blend tiles."""
    H_, W_ = len(g), len(g[0])
    if base == '.':
        pair, top, alike = 0, ':-=', ':-='
    elif base in ('s', 'w', ':'):
        pair, top, alike = {'s': 1, 'w': 2, ':': 3}[base], '.', '.*b~'
    else:
        return
    isB = lambda x, y: not (0 <= x < W_ and 0 <= y < H_) or g[y][x] in alike
    for y in range(H_):
        for x in range(W_):
            if g[y][x] not in top:
                continue
            k = BLEND.mask(isB, x, y)
            if k != 255:
                m.put('ground', BL, k & 15, pair * 16 + (k >> 4), ox + x, oy + y)


HOUSES = [(0, 0), (4, 0), (8, 0), (12, 0)]


WALLMAT = {'moss': ['bonehollow', 'mirefen', 'brambletemple', 'ruins1'], 'brick': ['turtleback', 'olddepths', 'forge', 'arcadevault'],
           'ice': ['frostmere', 'stormspire'], 'dark': ['thievesden', 'vault', 'keep'], 'sand': ['glassspire', 'quarry', 'barrow'], 'pale': ['mirrortemple', 'shrine', 'castle']}
WALLMATS = [w[0] for w in BLEND.WALL_MATS]


def dungeon_walls(m):
    """Dungeon rooms get the generated pack-style walls (rounded, outlined, brick faces) and a matching floor."""
    mat = m.extra.get('wallmat') or next((k for k, ids in WALLMAT.items() if m.extra.get('dungeon', m.id) in ids), None)
    if mat is None:
        return
    p = WALLMATS.index(mat)
    G, D, O = m.layers['ground'], m.layers['deco'], m.layers['over']
    wall = lambda x, y: not m.ok(x, y) or (m.col[y * m.w + x] == SOLID and D[y * m.w + x] < 0 and O[y * m.w + x] < 0 and G[y * m.w + x] >= 0 and (G[y * m.w + x] >> 16) in (IN, CV))
    walls = [(x, y) for y in range(m.h) for x in range(m.w) if wall(x, y)]
    fl = BLEND.WALL_MATS[p][3]
    for (x, y) in walls:
        k = BLEND.mask(wall, x, y)
        G[y * m.w + x] = ref(DW, k & 15, p * 16 + (k >> 4))
    m.extra['floor'] = ('df', p)


def naremap(m):
    """Swap the old art pack's ground, water, roads, flowers, bushes, houses and dungeon tiles for Ninja Adventure ones."""
    if m.indoor and (not (m.w == 16 and m.h == 14) or m.extra.get('wallmat')):
        dungeon_walls(m)
    G, D, O = m.layers['ground'], m.layers['deco'], m.layers['over']
    sh = lambda r: r >> 16
    t = lambda r: (r & 255, (r >> 8) & 255)
    W, H = m.w, m.h
    grass = {(0, 9), (1, 9), (0, 31), (1, 31)}
    water = {(x, y) for x in (2, 3, 4) for y in (6, 7, 8)}
    road = {(8, 23), (8, 24), (9, 23), (9, 24)}
    isw = lambda x, y: not (0 <= x < W and 0 <= y < H) or m.col[y * W + x] in (DEEP,)
    for y in range(H):
        for x in range(W):
            i = y * W + x
            g = G[i]
            if g >= 0 and sh(g) == OW:
                tt = t(g)
                if tt in grass:
                    h = (x * 7 + y * 13) % 17
                    G[i] = ref(NF, 12 + h, 12) if h < 3 else ref(NF, 11, 12)
                elif tt == (12, 13) or tt in road:
                    G[i] = ref(NF, 12, 8)
                elif tt in water:
                    if m.col[i] == DEEP:
                        k = BLEND.mask(isw, x, y)
                        G[i] = ref(NW, 1, 7) if k == 255 else ref(BL, k & 15, 4 * 16 + (k >> 4))
                    else:
                        G[i] = ref(NF, 11, 12)
            elif g >= 0 and sh(g) == IN:
                tt = t(g)
                if tt == (1, 1):
                    G[i] = ref(NI, 12 + (x * 3 + y) % 3, 13)
                elif tt == (0, 4):
                    G[i] = ref(NI, 1 + (x + y * 2) % 3, 1)
                elif 5 <= tt[0] <= 7 and 6 <= tt[1] <= 8 and not (W == 16 and H == 14):
                    G[i] = ref(NR, tt[0] - 1, tt[1] - 6)
            if g >= 0 and sh(g) == CV and t(g) == (0, 0) and m.extra.get('floor'):
                fl = m.extra['floor']
                G[i] = ref(DF, fl[1] + (6 if (x * 7 + y * 3) % 11 == 0 else 0), 0) if fl[0] == 'df' else ref(NI, *fl)
            d = D[i]
            if d >= 0 and sh(d) == OW:
                tt = t(d)
                if tt == (1, 8):
                    D[i] = ref(NN, (0, 2, 3, 0)[(x + y) % 4], 11)
                elif tt == (0, 16):
                    D[i] = ref(NN, (x * 5 + y) % 3, 10)
                elif tt == (6, 0):          # a house: the pack's cottage, door where the old one was
                    hx, hy = HOUSES[(x * 3 + y) % len(HOUSES)]
                    for j in range(5):
                        for k in range(5):
                            if m.ok(x + k, y + j):
                                D[(y + j) * W + x + k] = -1
                                if j < 2 or k == 0:
                                    m.col[(y + j) * W + x + k] = OPEN
                    for j in range(3):
                        for k in range(4):
                            if m.ok(x + 1 + k, y + 2 + j):
                                D[(y + 2 + j) * W + x + 1 + k] = ref(NH, hx + k, hy + j)
                                m.col[(y + 2 + j) * W + x + 1 + k] = SOLID if (k, j) not in ((1, 2),) else m.col[(y + 2 + j) * W + x + 1 + k]
            if D[i] >= 0 and sh(D[i]) == IN:
                tt = t(D[i])
                if 5 <= tt[0] <= 7 and 6 <= tt[1] <= 8 and not (W == 16 and H == 14):
                    D[i] = ref(NR, tt[0] - 1, tt[1] - 6)
    for v in m.extra.get('variants', []):          # story changes use the same swaps
        for t_ in v['tiles']:
            name, i, r = t_
            if r < 0 or sh(r) != OW:
                continue
            tt, x, y = t(r), i % W, i // W
            if tt in grass:
                t_[2] = ref(NF, 11, 12)
            elif tt == (12, 13) or tt in road:
                t_[2] = ref(NF, 12, 8)
            elif tt in water:
                t_[2] = ref(NW, 1, 7)
            elif tt == (1, 8):
                t_[2] = ref(NN, 0, 11)
            elif tt == (0, 16):
                t_[2] = ref(NN, (x * 5 + y) % 3, 10)


# Pack sprites for dressing a rocky border: (tx, ty, w, h, is_tree). Rocks sit on the ground; a tree's top row is its crown.
_ROCKS_B = [(17, 10, 4, 3, 0), (21, 10, 2, 3, 0), (15, 10, 2, 2, 0), (15, 12, 2, 2, 0), (12, 5, 4, 3, 0), (13, 8, 2, 2, 0)]
_ROCKS_G = [(17, 14, 4, 3, 0), (21, 14, 2, 3, 0), (15, 14, 2, 2, 0), (15, 16, 2, 2, 0), (16, 5, 4, 3, 0), (16, 8, 2, 2, 0)]
BORDER_KITS = {
    '.': (_ROCKS_B + [(0, 2, 4, 3, 1), (4, 2, 4, 3, 1), (16, 2, 4, 3, 1), (3, 18, 3, 3, 1), (2, 0, 2, 2, 1), (0, 0, 2, 2, 1), (16, 0, 2, 2, 1)],
          [(17, 13), (18, 13), (19, 13), (0, 10), (1, 10), (2, 10)]),
    ':': (_ROCKS_G + [(0, 2, 4, 3, 1), (0, 5, 4, 3, 1), (4, 0, 2, 2, 1), (2, 0, 2, 2, 1)], [(17, 17), (18, 17), (19, 17)]),
    'w': (_ROCKS_G + [(8, 2, 4, 3, 1), (4, 5, 4, 3, 1), (8, 5, 4, 3, 1), (6, 18, 3, 3, 1), (2, 12, 2, 2, 0), (8, 0, 2, 2, 1), (10, 0, 2, 2, 1)],
          [(17, 17), (18, 17), (4, 12), (5, 12)]),
    's': (_ROCKS_B + [(0, 5, 4, 3, 1), (4, 0, 2, 2, 1)], [(17, 13), (18, 13), (19, 13)]),
}


TREE_KITS = {
    '.': ([(0, 0, 2, 2, 1), (2, 0, 2, 2, 1), (6, 0, 2, 2, 1), (16, 0, 2, 2, 1), (18, 0, 2, 2, 1), (0, 2, 4, 3, 1), (4, 2, 4, 3, 1),
           (16, 2, 4, 3, 1), (20, 2, 4, 3, 1), (3, 18, 3, 3, 1)], [(0, 10), (1, 10), (2, 10), (0, 10)]),
    'w': ([(8, 0, 2, 2, 1), (10, 0, 2, 2, 1), (12, 0, 2, 2, 1), (8, 2, 4, 3, 1), (4, 5, 4, 3, 1), (8, 5, 4, 3, 1), (6, 18, 3, 3, 1)],
          [(4, 12), (5, 12), (10, 12)]),
}
TREE_KITS['s'] = TREE_KITS[':'] = TREE_KITS['.']


def dress_border(m, g, ox, oy, base, band, kit=None):
    """Fill a rocky border with a random mix of the pack's rocks and trees instead of a row of identical boulders.
    Sprites may poke one row into the land where it is plain ground, so the edge is not a straight line."""
    import random
    rng = random.Random(sum(ord(c) for c in m.id) * 7 + 3)
    big, small = kit or BORDER_KITS.get(base, BORDER_KITS['.'])
    H_, W_ = len(g), len(g[0])
    occ = set()

    def ok(X, Y):
        if (X, Y) in occ:
            return False
        if (X, Y) in band:
            return True
        x, y = X - ox, Y - oy
        if not (0 <= X < m.w and 0 <= Y < m.h):
            return True                       # hangs off the edge of the map: cut by the screen edge, never seen whole
        if not (0 <= x < W_ and 0 <= y < H_) or g[y][x] != base:
            return False
        if not (x == 2 or y == 2 or x == W_ - 3 or y == H_ - 3):
            return False
        # only poke in beside a solid run of border, never next to an opening
        return all((X + i, Y + j) in band or (X + i, Y + j) in occ or not (0 <= x + i < W_ and 0 <= y + j < H_) or not (x + i < 2 or y + j < 2 or x + i >= W_ - 2 or y + j >= H_ - 2)
                   for i in (-2, -1, 0, 1, 2) for j in (-2, -1, 0, 1, 2))

    for (X, Y) in sorted(band, key=lambda p: (p[1], p[0])):
        if (X, Y) in occ:
            continue
        kit = big[:]
        rng.shuffle(kit)
        done = False
        for (tx, ty, w, h, tree) in kit:
            offs = [(i, j) for j in range(h) for i in range(w)]
            rng.shuffle(offs)
            for (i, j) in offs:
                ax, ay = X - i, Y - j
                cells = [(ax + a, ay + b) for b in range(h) for a in range(w)]
                if all(ok(cx, cy) for cx, cy in cells):
                    poke = {c for c in cells if c not in band}
                    if poke:
                        m.pokes = getattr(m, 'pokes', []) + [{'cells': cells, 'poke': poke, 'small': small}]
                    for b in range(h):
                        for a in range(w):
                            if not m.ok(ax + a, ay + b):
                                occ.add((ax + a, ay + b))
                                continue
                            layer = 'over' if tree and b == 0 else 'deco'
                            m.put(layer, NN, tx + a, ty + b, ax + a, ay + b)
                            m.layers['deco' if layer == 'over' else 'over'][(ay + b) * m.w + ax + a] = -1
                            m.col[(ay + b) * m.w + ax + a] = SOLID
                            occ.add((ax + a, ay + b))
                    done = True
                    break
            if done:
                break
        if not done:
            tx, ty = rng.choice(small)
            m.put('deco', NN, tx, ty, X, Y)
            m.col[Y * m.w + X] = SOLID
            occ.add((X, Y))


def paint_forest(m, g, ox, oy, base='.'):
    """Forest (F) drawn as a loose mix of the pack's trees and bushes, packed to fill the forest's shape, so there are
    no straight walls of identical trunks and no tree cut in half (trees at the map's edge simply hang off it)."""
    H_, W_ = len(g), len(g[0])
    used = set()
    # whatever is left becomes a loose mix of the pack's trees and bushes (not a straight hedge)
    left = {(ox + x, oy + y) for y in range(H_) for x in range(W_) if g[y][x] == 'F' and (x, y) not in used}
    if left:
        dress_border(m, g, ox, oy, base, left, TREE_KITS.get(base, TREE_KITS['.']))


def interior(mid, name, back, kind='house', npcs=(), chests=(), signs=()):
    """A one-room interior (16x14) with furniture by kind; the door at the bottom returns to back = (map, x, y)."""
    m = Map(mid, 16, 14, name, indoor=True, music='home')
    m.fill(IN, 1, 1, 0, 0, 15, 13)
    m.fill(IN, 0, 4, 2, 3, 13, 12)
    for x in range(2, 14):
        for r in range(3):
            m.put('ground', IN, 5 + (x % 3), 6 + r, x, r)
    m.solid(0, 0, 16, 3)
    m.solid(0, 0, 2, 14)
    m.solid(14, 0, 2, 14)
    m.solid(0, 13, 16, 1)
    for x in (7, 8):
        m.put('ground', IN, 0, 4, x, 13)
        m.solid(x, 13, 1, 1, OPEN)
        m.warp(x, 13, back[0], back[1], back[2], 2)
    if kind in ('shop', 'smith', 'tavern', 'game'):
        for x in range(3, 13):
            m.put('deco', IN, 10 if x == 3 else 12 if x == 12 else 11, 3, x, 6)
            m.col[6 * m.w + x] = LOW if kind == 'game' else SOLID
    if kind == 'game':
        pass
    else:
        import interiors as INT
        res = set()
        for n in npcs:
            res |= {(n[0] + a, n[1] + b) for a in (-1, 0, 1) for b in (-1, 0, 1)}
        for c in chests:
            res |= {(c[0], c[1]), (c[0], c[1] + 1)}
        for sg in signs:
            res |= {(sg[0], sg[1] + 1)}
        if kind in ('shop', 'smith', 'tavern'):
            # goods on the counter, behind it the keeper's stock
            for k, x in enumerate((4, 5, 10, 11)):
                sh, tx, ty = [(NH, 21, 12), (NH, 19, 14), (NH, 21, 14), (NH, 20, 14)][(k + INT.seed_of(mid)) % 4] if kind == 'shop' else \
                    [(NH, 16, 15), (NH, 17, 15), (NH, 14, 15), (NH, 16, 13)][k] if kind == 'tavern' else [(NH, 15, 15), (NH, 14, 14), (NH, 15, 16), (NH, 14, 15)][k]
                m.put('over', sh, tx, ty, x, 6)
            res |= {(x, y) for x in range(2, 14) for y in (6, 7)}
        stairs = INT.furnish(sys.modules[__name__], m, mid, 'house' if kind not in INT.LAYOUTS else kind, res)
        if stairs:
            c = INT.cellar(sys.modules[__name__], mid, name, (mid, stairs[0], stairs[1] + 1), INT.CELLARS[mid])
            m.warp(stairs[0], stairs[1] - 1, c.id, c.entry[0], c.entry[1], 2); m.warp(stairs[0] + 1, stairs[1] - 1, c.id, c.entry[0], c.entry[1], 2)
            m.col[(stairs[1] - 1) * m.w + stairs[0]] = OPEN; m.col[(stairs[1] - 1) * m.w + stairs[0] + 1] = OPEN
            m.floors = [c]
    import interiors as INT
    for i, n in enumerate(npcs):
        kw = dict(n[2])
        if i == 0 and mid in INT.SHOP_STOCK:
            kw['shop'] = INT.SHOP_STOCK[mid]
        m.spawn('villager', n[0], n[1], **kw)
    for c in chests:
        m.chest(*c)
    for sg in signs:
        m.sign(*sg)
    m.entry = [7, 12]
    return m


def region(mid, name, wx, wy, sw, sh, rows, music='village', base='.', grounds=None):
    m = Map(mid, sw * 16, sh * 14, name, music=music)
    for j in range(sh):
        for i in range(sw):
            m.area(i * 16, j * 14)
    m.extra['world'] = [wx, wy]
    paint(m, rows, base=base, grounds=grounds)
    return m


# ---------- the first area: Thistledown and the east meadow ----------
def boulder(m, x, y):                 # a big 2x2 boulder (one of the pack's rocks, varied by place)
    tx, ty = ROCKS2[(x * 5 + y * 3) % len(ROCKS2)]
    m.stamp(NN, tx, ty, x, y, 2, 2, col=SOLID)


def rockpile(m, x, y):
    tx, ty = ROCKS2[(x * 3 + y * 7 + 1) % len(ROCKS2)]
    m.stamp(NN, tx, ty, x, y, 2, 2, col=SOLID)


ROCKS2 = [(15, 10), (15, 12), (13, 8), (15, 10), (13, 8)]
