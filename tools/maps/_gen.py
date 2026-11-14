"""Dungeon generator: big multi-room floors with corridors, loops, themed props, chests and stairs.

gen(mid, name, w, h, theme, seed, ...) -> (Map, info). info has the rooms (entry room first, exit/boss room last),
dead ends and free floor cells, so story scripts can place people and events precisely."""
import random
from _kit import *
from mapkit import ref

THEMES = {
    # wall, floors (main, accent), props, music, encounter background
    'reactor': dict(wall='metal', floor='grate', accent='metal', props=[], music='reactor', dark=0, water='aether'),
    'tower': dict(wall='pale', floor='marble', accent='tile', props=['plant', 'desk', 'shelf', 'console', 'crate'], music='factory', dark=0),
    'sewer': dict(wall='dark', floor='darkcobble', accent='darkmetal', props=['barrel', 'crate', 'pipe_v', 'grate'], music='slums', dark=1, water='poison'),
    'cave': dict(wall='rock', floor='cave', accent='cave', props=['rock', 'rock', 'crystal_s', 'stal'], music='cave', dark=1),
    'mine': dict(wall='rock', floor='cave', accent='planks', props=['crate', 'barrel', 'rock', 'cart'], music='cave', dark=1),
    'temple': dict(wall='stone', floor='moss', accent='tile', props=['statue', 'pillar', 'torch', 'urn'], music='temple', dark=0),
    'ice': dict(wall='ice', floor='crystal', accent='ice', props=['rock', 'crystal_s', 'pillar'], music='snow', dark=0),
    'lava': dict(wall='lava', floor='cave', accent='darkcobble', props=['rock', 'stal'], music='dungeon', dark=0, water='lava'),
    'ruins': dict(wall='sand', floor='cobble', accent='brick', props=['pillar', 'statue', 'urn', 'rock'], music='ruins', dark=0),
    'ship': dict(wall='wood', floor='planks', accent='metal', props=['crate', 'barrel', 'console', 'pipe_h'], music='dungeon', dark=0),
    'crystal': dict(wall='dark', floor='crystal', accent='marble', props=['crystal_s', 'pillar', 'statue'], music='final', dark=0),
    'forest': dict(wall='hedge', floor='grass', accent='dirt', props=['bush', 'rock', 'flowers', 'stump'], music='forest', dark=0, water='water'),
    'factory': dict(wall='metal', floor='metal', accent='darkmetal', props=['crate', 'console', 'pipe_h', 'pipe_v', 'barrel'], music='factory', dark=0),
}
SIZE = {'pipe_v': (1, 3), 'pipe_h': (4, 1), 'gpipe_v': (1, 3), 'gpipe_h': (4, 1), 'machine': (2, 2), 'crystal_big': (2, 2), 'desk': (3, 1),
        'shelf': (1, 2), 'statue': (1, 2), 'pillar': (1, 2), 'cart': (2, 1), 'stump': (2, 1), 'bigrock': (2, 2), 'drawers': (2, 2), 'bed': (1, 2)}
def prop(m, kind, x, y):
    """One prop with its top-left on a floor cell (solid unless noted). SIZE lists the bigger ones."""
    v = (x * 7 + y * 3)
    if kind == 'crate': m.stamp('house', 16, 14, x, y, col=SOLID)
    elif kind == 'barrel': m.stamp('house', 17, 14, x, y, col=SOLID)
    elif kind == 'pipe_v': m.stamp('pipes', 5, 0, x, y, 1, 3, overrows=1, col=SOLID)
    elif kind == 'pipe_h': m.stamp('pipes', 6, 0, x, y, 4, 1, col=SOLID)
    elif kind == 'gpipe_v': m.stamp('pipes', 10, 0, x, y, 1, 3, overrows=1, col=SOLID)
    elif kind == 'gpipe_h': m.stamp('pipes', 11, 0, x, y, 4, 1, col=SOLID)
    elif kind == 'machine': m.stamp('towers', 2 * (v % 6), 2, x, y, 2, 2, overrows=1, col=SOLID)
    elif kind == 'crystal_big': m.stamp('towers', 18 + 2 * (v % 3), 4, x, y, 2, 2, overrows=1, col=SOLID)
    elif kind == 'console': m.stamp('dungeon', 3 + v % 2, 3, x, y, col=SOLID)
    elif kind == 'orb': m.stamp('dungeon', 4 + v % 4, 2, x, y, col=SOLID)
    elif kind == 'sensor': m.stamp('dungeon', 5 + v % 3, 3, x, y, col=SOLID)
    elif kind == 'vent': m.stamp('dungeon', 4, 1, x, y)
    elif kind == 'grate': m.stamp('dungeon', 5, 1, x, y)
    elif kind == 'plant': m.stamp('nature', v % 4, 10, x, y, col=SOLID)
    elif kind == 'desk': m.stamp('elem', 2, 10, x, y, 3, 1, col=SOLID)
    elif kind == 'shelf': m.stamp('elem', 2 + v % 2, 7, x, y, 1, 2, overrows=1, col=SOLID)
    elif kind == 'drawers': m.stamp('elem', 6, 7, x, y, 2, 2, overrows=1, col=SOLID)
    elif kind == 'chair': m.stamp('elem', 11, 0, x, y)
    elif kind == 'rock': m.stamp('nature', (14, 15, 18, 19)[v % 4], 9, x, y, col=SOLID)
    elif kind == 'bigrock': m.stamp('nature', 12 if v % 2 else 16, 8, x, y, 2, 2, overrows=1, col=SOLID)
    elif kind == 'crystal_s': m.stamp('nature', 4 + v % 3, 14 + (v // 3) % 2, x, y, col=SOLID)
    elif kind == 'stal': m.stamp('nature', (14, 15)[v % 2], 9, x, y, col=SOLID)
    elif kind == 'statue': m.stamp('house', 6 + v % 2, 15, x, y, 1, 2, overrows=1, col=SOLID)
    elif kind == 'pillar': m.stamp('house', 7, 17, x, y, 1, 2, overrows=1, col=SOLID)
    elif kind == 'torch': m.stamp('dungeon', 6, 2, x, y, col=SOLID)
    elif kind == 'urn': m.stamp('house', 16 + v % 3, 12, x, y, col=SOLID)
    elif kind == 'cart': m.stamp('elem', 0, 3, x, y, 2, 1, col=SOLID)
    elif kind == 'bush': bush(m, x, y)
    elif kind == 'flowers': flowers(m, [(x, y)])
    elif kind == 'stump': m.stamp('nature', 4, 8, x, y, col=SOLID)
    elif kind == 'bed': m.stamp('bed', 5, 3, x, y, 1, 2, col=SOLID)

def free(m, x, y, w=1, h=1):
    return all(m.ok(x + k, y + j) and m.wall[m.i(x + k, y + j)] is None and m.col[m.i(x + k, y + j)] == OPEN and m.layers['deco'][m.i(x + k, y + j)] < 0
               for j in range(h) for k in range(w))
def parts(m):
    """Number of separate walkable areas (a prop must never split one)."""
    W, H = m.w, m.h; seen = bytearray(W * H); n = 0
    for s0 in range(W * H):
        if seen[s0] or m.col[s0] not in (OPEN, 6, 8): continue
        n += 1; st = [s0]; seen[s0] = 1
        while st:
            i = st.pop(); x, y = i % W, i // W
            for j in ((i - 1) if x > 0 else -1, (i + 1) if x < W - 1 else -1, i - W, i + W):
                if 0 <= j < W * H and not seen[j] and m.col[j] in (OPEN, 6, 8): seen[j] = 1; st.append(j)
    return n
def put(m, kind, x, y, check=True):
    w, h = SIZE.get(kind, (1, 1))
    if not free(m, x, y, w, h): return False
    before = parts(m) if check else 0
    cells = [m.i(x + k, y + j) for j in range(h) for k in range(w)]
    snap = [(i, m.col[i], m.layers['deco'][i], m.layers['over'][i]) for i in cells]
    prop(m, kind, x, y)
    if check and parts(m) > before:
        for (i, c, d, o) in snap: m.col[i] = c; m.layers['deco'][i] = d; m.layers['over'][i] = o
        return False
    return True

# room dressings: how a theme fills a room. Each is fn(m, room, r)
def _along_top(kinds, step):
    def f(m, q, r):
        x = q.x + 1
        while x < q.x + q.w - 1:
            k = r.choice(kinds); w = SIZE.get(k, (1, 1))[0]
            if x + w <= q.x + q.w - 1 and r.random() < 0.8: put(m, k, x, q.y)
            x += w + step
    return f
def _corners(kind):
    def f(m, q, r):
        w, h = SIZE.get(kind, (1, 1))
        for (x, y) in ((q.x + 1, q.y + 1), (q.x + q.w - 1 - w, q.y + 1), (q.x + 1, q.y + q.h - 1 - h), (q.x + q.w - 1 - w, q.y + q.h - 1 - h)): put(m, kind, x, y)
    return f
def _cluster(kinds, n):
    def f(m, q, r):
        cx, cy = r.choice(((q.x, q.y), (q.x + q.w - 3, q.y), (q.x, q.y + q.h - 2), (q.x + q.w - 3, q.y + q.h - 2)))
        for _ in range(n): put(m, r.choice(kinds), cx + r.randint(0, 2), cy + r.randint(0, 1))
    return f
def _floor(kind, n):
    def f(m, q, r):
        for _ in range(n): put(m, kind, q.x + r.randint(1, q.w - 2), q.y + r.randint(1, q.h - 2))
    return f
def _rows(kind, gap=3):
    def f(m, q, r):
        w, h = SIZE.get(kind, (1, 1))
        for y in range(q.y + 2, q.y + q.h - h - 1, h + 2):
            for x in range(q.x + 2, q.x + q.w - w - 1, w + gap): put(m, kind, x, y)
    return f
def _scatter(kinds, n):
    def f(m, q, r):
        for _ in range(n): put(m, r.choice(kinds), q.x + r.randint(0, q.w - 1), q.y + r.randint(0, q.h - 1))
    return f
DRESS = {
    'reactor': [_along_top(['pipe_v', 'pipe_v', 'machine', 'console'], 1), _corners('orb'), _cluster(['crate', 'barrel'], 5), _rows('machine', 4), _along_top(['gpipe_v', 'sensor'], 1)],
    'factory': [_along_top(['pipe_v', 'machine', 'console', 'pipe_h'], 1), _cluster(['crate', 'barrel', 'crate'], 6), _corners('orb'), _rows('crate', 2)],
    'tower': [_along_top(['shelf', 'shelf', 'drawers', 'plant'], 0), _rows('desk', 2), _corners('plant'), _along_top(['console', 'machine'], 2), _cluster(['crate'], 3)],
    'sewer': [_cluster(['barrel', 'crate'], 4), _along_top(['pipe_v', 'gpipe_v'], 2), _floor('grate', 3), _scatter(['rock'], 3)],
    'cave': [_scatter(['rock', 'rock', 'crystal_s', 'stal'], 7), _cluster(['bigrock'], 2), _corners('crystal_s')],
    'mine': [_scatter(['rock', 'crate', 'barrel'], 6), _cluster(['cart', 'crate'], 3), _corners('stal')],
    'temple': [_corners('statue'), _rows('pillar', 3), _along_top(['torch', 'urn', 'statue'], 2)],
    'ice': [_scatter(['crystal_s', 'rock'], 6), _corners('pillar'), _cluster(['bigrock'], 2)],
    'lava': [_scatter(['rock', 'stal'], 7), _cluster(['bigrock'], 2)],
    'ruins': [_rows('pillar', 3), _corners('statue'), _scatter(['rock', 'urn'], 5)],
    'ship': [_cluster(['crate', 'barrel'], 6), _along_top(['pipe_v', 'console'], 1), _floor('grate', 2)],
    'crystal': [_corners('crystal_big'), _rows('pillar', 4), _scatter(['crystal_s'], 6)],
    'forest': [_scatter(['bush', 'bush', 'rock', 'flowers', 'stump'], 9)],
}

class Room:
    def __init__(s, x, y, w, h): s.x, s.y, s.w, s.h = x, y, w, h
    def c(s): return (s.x + s.w // 2, s.y + s.h // 2)
    def cells(s): return [(x, y) for y in range(s.y, s.y + s.h) for x in range(s.x, s.x + s.w)]

def gen(mid, name, w, h, theme, seed, music=None, enc=None, rooms=14, minr=(6, 5), maxr=(13, 9), loops=0.25, chests=(), dark=None, corridor=2, under=None, pools=0):
    T = THEMES[theme]; r = random.Random(seed)
    m = Map(mid, w, h, name, music=music or T['music'], kind='dungeon', enc=enc, dark=T['dark'] if dark is None else dark)
    m.under = under or T['floor']
    m.walls(T['wall'], 0, 0, w - 1, h - 1)
    R = []
    tries = 0
    while len(R) < rooms and tries < 4000:
        tries += 1
        rw, rh = r.randint(minr[0], maxr[0]), r.randint(minr[1], maxr[1])
        x, y = r.randint(2, w - rw - 3), r.randint(3, h - rh - 3)
        if any(not (x + rw + 3 < q.x or q.x + q.w + 3 < x or y + rh + 4 < q.y or q.y + q.h + 4 < y) for q in R): continue
        R.append(Room(x, y, rw, rh))
    # order rooms into a chain from the westernmost, so the entry and the exit are far apart
    R.sort(key=lambda q: q.x + q.y * 0.3)
    chain = [R.pop(0)]
    while R:
        last = chain[-1]; R.sort(key=lambda q: abs(q.c()[0] - last.c()[0]) + abs(q.c()[1] - last.c()[1])); chain.append(R.pop(0))
    for q in chain: carve(m, q.x, q.y, q.x + q.w - 1, q.y + q.h - 1, T['floor'])
    def corr(a, b):
        (x0, y0), (x1, y1) = a.c(), b.c()
        if r.random() < 0.5: xs, ys = [(x, y0) for x in range(min(x0, x1), max(x0, x1) + 1)], [(x1, y) for y in range(min(y0, y1), max(y0, y1) + 1)]
        else: xs, ys = [(x0, y) for y in range(min(y0, y1), max(y0, y1) + 1)], [(x, y1) for x in range(min(x0, x1), max(x0, x1) + 1)]
        for (x, y) in xs + ys:
            for dx in range(corridor):
                for dy in range(corridor):
                    X, Y = x + dx, y + dy
                    if 1 <= X < w - 1 and 2 <= Y < h - 1 and m.wall[m.i(X, Y)]: carve(m, X, Y, X, Y, T['accent'])
    for a, b in zip(chain, chain[1:]): corr(a, b)
    for _ in range(int(len(chain) * loops)):
        a, b = r.sample(chain, 2); corr(a, b)
    # pools of water/lava in big rooms
    for q in chain[1:-1]:
        if pools and T.get('water') and q.w >= 9 and q.h >= 7 and r.random() < pools:
            m.ground(T['water'], q.x + 2, q.y + 2, q.x + q.w - 3, q.y + q.h - 3)
    # dress the rooms (the entry and exit rooms stay clear for story scenes)
    for q in chain[1:-1]:
        for f in r.sample(DRESS[theme], min(len(DRESS[theme]), r.randint(3, 4))): f(m, q, r)
    hollow(m, 2)
    if theme == 'forest': forestify(m, r)
    m.entry = list(chain[0].c())
    info = {'rooms': chain, 'map': m, 'theme': T}
    # dead ends: floor cells with three walls around (good for chests)
    info['nooks'] = [(x, y) for y in range(2, h - 1) for x in range(1, w - 1) if m.wall[m.i(x, y)] is None and m.col[m.i(x, y)] == OPEN and sum(1 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if m.wall[m.i(x + dx, y + dy)]) >= 3]
    ch = list(chests); spots = info['nooks'][:]
    for q in chain[1:]:
        for _ in range(3):
            x = q.x + r.randint(1, q.w - 2)
            if m.col[m.i(x, q.y)] == OPEN and m.col[m.i(x, q.y + 1)] == OPEN: spots.append((x, q.y))
    r.shuffle(spots)
    for it in ch:
        if not spots: break
        x, y = spots.pop()
        while spots and not (m.col[m.i(x, y)] == OPEN and m.layers['deco'][m.i(x, y)] < 0 and _chest_ok(m, x, y)): x, y = spots.pop()
        if m.col[m.i(x, y)] == OPEN: m.chest(x, y, it if isinstance(it, str) else it[0], 1 if isinstance(it, str) else it[1])
    if enc: m.enc = enc
    return m, info

def forestify(m, r):
    """Forest dungeons: every non-floor cell becomes thick woods (trees on grass) instead of walls."""
    W, H = m.w, m.h
    wood = [[m.wall[m.i(x, y)] is not None or m.mat[m.i(x, y)] == 'void' for x in range(W)] for y in range(H)]
    for y in range(H):
        for x in range(W):
            if wood[y][x]:
                i = m.i(x, y); m.wall[i] = None; m.mat[i] = 'grass'; m.col[i] = SOLID
    kinds = ['round', 'pine', 'bushy', 'round', 'light']
    for y in range(-1, H, 2):
        for x in range(-1 + (y // 2) % 2, W, 2):
            cells = [(x + a, y + b) for a in (0, 1) for b in (0, 1) if 0 <= x + a < W and 0 <= y + b < H]
            if cells and all(wood[q][p] for (p, q) in cells):
                k = r.choice(kinds); tx, ty = TREES[k]
                for (p, q) in cells:
                    m.put('over' if q == y else 'deco', ref('nature', tx + p - x, ty + q - y), p, q)
    for y in range(H):
        for x in range(W):
            if wood[y][x] and m.layers['deco'][m.i(x, y)] < 0 and m.layers['over'][m.i(x, y)] < 0: bush(m, x, y)

def hollow(m, keep=2):
    """Wall cells further than 'keep' from any floor become black void, so rooms read as rooms."""
    W, H = m.w, m.h
    floor = [[m.wall[m.i(x, y)] is None for x in range(W)] for y in range(H)]
    for y in range(H):
        for x in range(W):
            if floor[y][x]: continue
            near = any(floor[y + j][x + k] for j in range(-keep - 1, keep + 1) for k in range(-keep, keep + 1) if 0 <= x + k < W and 0 <= y + j < H)
            if not near: m.wall[m.i(x, y)] = None; m.mat[m.i(x, y)] = 'void'; m.col[m.i(x, y)] = SOLID

def _chest_ok(m, x, y):
    b = parts(m); m.col[m.i(x, y)] = SOLID; ok = parts(m) == b; m.col[m.i(x, y)] = OPEN; return ok

def _blocks(m, x, y):
    """Would a prop here close a 1-wide passage? (keep it if both sides along either axis are open)"""
    o = lambda X, Y: m.ok(X, Y) and m.wall[m.i(X, Y)] is None and m.col[m.i(X, Y)] == OPEN
    return (o(x - 1, y) and o(x + 1, y) and not o(x, y - 1) and not o(x, y + 1)) or (o(x, y - 1) and o(x, y + 1) and not o(x - 1, y) and not o(x + 1, y))

def stairs(m, x, y, to, tx, ty, down=True):
    """Stairs on a floor cell leading to another floor."""
    m.stamp('elem', 7 if down else 6, 11, x, y)
    m.warp(x, y, to, tx, ty, 2 if down else 0)
def door_up(m, x, y, to, tx, ty, w=2):
    """An opening in a top wall leading out (the wall cells become floor + warps)."""
    for k in range(w): carve(m, x + k, y, x + k, y, m.under)
    m.warp(x, y, to, tx, ty, 0, w)
def link(a, ra, b, rb, pos_a=None, pos_b=None, down=True):
    """Stairs between two generated floors: in room ra of map a down to room rb of map b (and back up)."""
    xa, ya = pos_a or (ra.x + ra.w // 2, ra.y + 1); xb, yb = pos_b or (rb.x + rb.w // 2, rb.y + 1)
    stairs(a, xa, ya, b.id, xb, yb + 1, down); stairs(b, xb, yb, a.id, xa, ya + 1, not down)
    a.setcol(xa, ya + 1, OPEN); b.setcol(xb, yb + 1, OPEN)

KINDS = {'valve': ('dungeon', 3, 3), 'terminal': ('dungeon', 4, 3), 'lever': ('dungeon', 3, 3), 'rune': ('dungeon', 7, 3), 'crystal': ('dungeon', 7, 3), 'orb': ('dungeon', 5, 2)}
def switches(m, info, n, key, kind='valve', stairs_room=-1):
    """A floor puzzle: the way on (the stairs in the given room) is sealed until n switches in other rooms are all thrown.
    The stairs sit at the top centre of the room (as link() puts them); the seal covers the three cells below."""
    import random
    r = random.Random(hash(key) & 0xffff)
    q = info['rooms'][stairs_room]; sx, sy = q.x + q.w // 2, q.y + 1
    m.gate(key, sx - 1, sy + 1, 3, 1, tile=('dungeon', 5, 1))
    m.event(sx - 1, sy + 1, 'gen_seal', 3, 1, touch=False, key=key, of=n, kind=kind, unless=key)
    rooms = [x for x in info['rooms'][1:-1]]; r.shuffle(rooms)
    for k, rm in enumerate(rooms[:n]):
        for _ in range(30):
            x, y = rm.x + r.randint(1, rm.w - 2), rm.y + r.randint(1, rm.h - 2)
            if m.col[m.i(x, y)] == OPEN and m.layers['deco'][m.i(x, y)] < 0 and _chest_ok(m, x, y) and not any(c == '%d,%d' % (x + dx, y + dy) for c in m.chests for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1))):
                m.stamp(*KINDS[kind], x, y, col=SOLID); m.event(x, y, 'gen_switch', touch=False, key=key, n=k, of=n, kind=kind); break
