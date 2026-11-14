"""Every outdoor town gets its own shape and its own streets (runs after the towns and their people are placed).

The hand-built towns placed their houses well but laid them on a ruler-straight crossroads in a rectangle of
trees. Here each town is given a concept: a silhouette (a river-bend village, a desert canyon, a mountain valley,
a round glade, an island, a crater camp...), features (a winding stream, salt pools, marsh water) and a street
network that winds from the way in to a plaza and from the plaza to every door. Old straight roads are erased.
Houses, doors, people, signs and events are never touched, and every one of them stays reachable from the entry."""
import math, random
from _kit import *
from mapkit import OPEN, SOLID

def build(): return []

# concept per town. shape: how the clearing is cut; main/lane: street materials; roads: the old straight-road
# materials to erase; plaza: (material, u, v, rx, ry) with u, v in -1..1 across the town
TOWNS = {
    'thornbrook': dict(shape='blob', roads={'cobble', 'dirt'}, main='dirt', lane='dirt', plaza=('cobble', 0.0, -0.05, 6, 5),
                       stream=[(-1.1, 0.55), (-0.5, 0.35), (0.0, 0.62), (0.45, 0.4), (1.1, 0.55)], pond=1),
    'kestrel': dict(shape='kidney', roads={'dirt'}, main='dirt', lane='dirt', plaza=('dirt', -0.1, -0.2, 4, 3), corral=('sand', 0.45, 0.35, 9, 6)),
    'windhaven': dict(shape='diamond', roads={'cobble'}, main='cobble', lane='cobble', plaza=('cobble', 0.0, 0.05, 5, 4), terraces=1),
    'portlark': dict(shape='crescent', roads={'cobble'}, main='cobble', lane='dirt', plaza=('cobble', 0.0, 0.15, 6, 3)),
    'saltmere': dict(shape='shore', roads={'cobble'}, main='planks', lane='planks', plaza=('cobble', 0.0, 0.1, 5, 4), pools=7),
    'sunscar': dict(shape='canyon', roads={'cobble'}, main='cobble', lane='cobble', plaza=None),
    'frostgate': dict(shape='valley', roads={'cobble'}, main='cobble', lane='cobble', plaza=('cobble', 0.0, 0.2, 5, 3)),
    'lumen': dict(shape='round', roads={'cobble'}, main='cobble', lane='cobble', plaza=None, ring=1),
    'mideel': dict(shape='marsh', roads={'cobble'}, main='planks', lane='planks', plaza=('planks', 0.0, 0.0, 4, 3), pools=9),
    'talon_isle': dict(shape='island', roads={'dirt'}, main='dirt', lane='dirt', plaza=('dirt', 0.0, 0.0, 5, 4)),
    'camp': dict(shape='round', roads={'dirt'}, main='dirt', lane='dirt', plaza=('dirt', 0.0, 0.0, 6, 5)),
    'halcyon_new': dict(shape='ruin', roads={'cobble', 'dirt'}, main='cobble', lane='dirt', plaza=('cobble', 0.0, 0.0, 7, 5)),
    'mem_thornbrook': dict(shape='blob', roads={'cobble', 'dirt'}, main='dirt', lane='dirt', plaza=('cobble', 0.0, -0.05, 6, 5)),
}

def _noise(seed):
    r = random.Random(seed); P = [r.random() for _ in range(4096)]
    def h(a, b): return P[(a * 73 + b * 151) % 4096]
    def n(x, y):
        xi, yi = math.floor(x), math.floor(y); fx, fy = x - xi, y - yi; fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
        return (h(xi, yi) * (1 - fx) + h(xi + 1, yi) * fx) * (1 - fy) + (h(xi, yi + 1) * (1 - fx) + h(xi + 1, yi + 1) * fx) * fy
    return lambda x, y: 0.6 * n(x, y) + 0.4 * n(x * 2.3 + 17, y * 2.3)

def _shape(kind, u, v, n):
    """< 0.96 inside the clearing. u, v: -1..1 across the map."""
    if kind == 'blob': return (abs(u) ** 2.3 + abs(v) ** 2.3) ** (1 / 2.3) + n * 0.5
    if kind == 'kidney': return (abs(u) ** 2.2 + abs(v) ** 2.2) ** (1 / 2.2) + n * 0.45 + max(0, 0.45 - math.hypot(u + 0.95, v - 0.15)) * 1.4
    if kind == 'diamond': return abs(u) * 0.75 + abs(v) * 0.6 + n * 0.45 + 0.08
    if kind == 'crescent': return (abs(u) ** 2.4 + abs(v) ** 2.4) ** (1 / 2.4) + n * 0.45
    if kind == 'shore': return (abs(u) ** 3 + abs(v) ** 3) ** (1 / 3) + n * 0.55
    if kind == 'canyon':
        w = 0.62 + 0.18 * math.sin(v * 2.4 + 0.6) + 0.15 * math.exp(-((v + 0.15) / 0.35) ** 2)
        return abs(u + 0.12 * math.sin(v * 3.1)) / w + n * 0.35 + max(0, abs(v) - 0.92) * 3
    if kind == 'valley':
        w = 0.42 + 0.5 * (v + 1) / 2
        return abs(u - 0.08 * math.sin(v * 2.5)) / w + n * 0.4 + max(0, abs(v) - 0.93) * 3
    if kind in ('round', 'island'): return math.hypot(u, v) * 1.02 + n * 0.4
    if kind == 'marsh': return math.hypot(u, v) + n * 0.6
    if kind == 'ruin': return (abs(u) ** 3.5 + abs(v) ** 3.5) ** (1 / 3.5) + n * 0.6
    return max(abs(u), abs(v))

def _busy(m, pad=2):
    B = set()
    for L in (m.warps, m.events, m.npcs):
        for e in L:
            for k in range(e.get('w', 1)):
                for j in range(e.get('h', 1)):
                    for dx in range(-pad, pad + 1):
                        for dy in range(-pad, pad + 1): B.add((e['x'] + k + dx, e['y'] + j + dy))
    for k in list(m.signs.keys()) + list(m.chests.keys()):
        x, y = map(int, k.split(','))
        for dx in range(-1, 2):
            for dy in range(-1, 2): B.add((x + dx, y + dy))
    if m.entry:
        for dx in range(-2, 3):
            for dy in range(-2, 3): B.add((m.entry[0] + dx, m.entry[1] + dy))
    return B

def _reach(m):
    W = m.w; seen = bytearray(W * m.h); ok = (OPEN, 6, 8)
    if not m.entry: return None
    s0 = m.i(*m.entry)
    if m.col[s0] not in ok: return None
    st = [s0]; seen[s0] = 1
    while st:
        i = st.pop(); x = i % W
        for j in ((i - 1) if x > 0 else -1, (i + 1) if x < W - 1 else -1, i - W, i + W):
            if 0 <= j < W * m.h and not seen[j] and m.col[j] in ok: seen[j] = 1; st.append(j)
    return seen

def _keys(m): return [(e['x'], e['y']) for L in (m.warps, m.events, m.npcs) for e in L]

def _keys_ok(m, K):
    seen = _reach(m)
    if seen is None: return True
    for (x, y) in K:
        if not m.ok(x, y): continue
        i = m.i(x, y)
        if m.col[i] in (OPEN, 6, 8):
            if not seen[i]: return False
        elif not any(m.ok(x + a, y + b) and seen[m.i(x + a, y + b)] for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))): return False
    return True

def _snap(m, cells):
    return [(m.i(a, b), m.col[m.i(a, b)], m.layers['deco'][m.i(a, b)], m.layers['over'][m.i(a, b)], m.wall[m.i(a, b)], m.mat[m.i(a, b)]) for (a, b) in cells if m.ok(a, b)]
def _undo(m, snap):
    for (i, c, d, o, wl, mt) in snap: m.col[i] = c; m.layers['deco'][i] = d; m.layers['over'][i] = o; m.wall[i] = wl; m.mat[i] = mt

def _curve(a, b, r, wob):
    """A wandering line a -> b (midpoint displacement), densely sampled."""
    pts = [a, b]
    for depth in range(3):
        out = [pts[0]]
        for p, q in zip(pts, pts[1:]):
            mx, my = (p[0] + q[0]) / 2, (p[1] + q[1]) / 2; L = math.hypot(q[0] - p[0], q[1] - p[1])
            nx, ny = (-(q[1] - p[1]) / (L or 1), (q[0] - p[0]) / (L or 1)); d = r.uniform(-1, 1) * L * wob / (depth + 1)
            out += [(mx + nx * d, my + ny * d), q]
        pts = out
    dense = []
    for p, q in zip(pts, pts[1:]):
        L = max(1, int(math.hypot(q[0] - p[0], q[1] - p[1]) * 2))
        for k in range(L): dense.append((p[0] + (q[0] - p[0]) * k / L, p[1] + (q[1] - p[1]) * k / L))
    dense.append(pts[-1]); return dense

def reshape(m, C, seed):
    r = random.Random(seed); N = _noise(seed); base = m.under; W, H = m.w, m.h
    busy = _busy(m); K = _keys(m); start_ok = _keys_ok(m, K)
    U = lambda x: (x - (W - 1) / 2) / ((W - 1) / 2); V = lambda y: (y - (H - 1) / 2) / ((H - 1) / 2)
    X = lambda u: int(round(u * (W - 1) / 2 + (W - 1) / 2)); Y = lambda v: int(round(v * (H - 1) / 2 + (H - 1) / 2))
    def plain(x, y):
        if not m.ok(x, y): return False
        i = m.i(x, y); return m.wall[i] is None and m.col[i] == OPEN and m.layers['deco'][i] < 0 and m.layers['over'][i] < 0
    # 1. erase the old straight roads (ground only; whatever stands on them stays)
    for i in range(W * H):
        if m.mat[i] in C['roads']: m.mat[i] = base
    # 2. water: a winding stream, salt pools, marsh water
    if C.get('stream'):
        pts = [(X(u), Y(v)) for (u, v) in C['stream']]
        for (p, q) in zip(pts, pts[1:]):
            for (x, y) in _curve(p, q, r, 0.18):
                for dx in range(-1, 2):
                    for dy in range(-1, 1):
                        X0, Y0 = int(x) + dx, int(y) + dy
                        if plain(X0, Y0) and (X0, Y0) not in busy and m.mat[m.i(X0, Y0)] == base:
                            sn = _snap(m, [(X0, Y0)]); m.ground('water', X0, Y0, X0, Y0)
                            if start_ok and not _keys_ok(m, K): _undo(m, sn)
    for _ in range(C.get('pools', 0)):
        cx, cy, rx, ry = r.randint(6, W - 7), r.randint(6, H - 7), r.uniform(2, 4.5), r.uniform(1.5, 3)
        cells = [(x, y) for y in range(int(cy - ry) - 1, int(cy + ry) + 2) for x in range(int(cx - rx) - 1, int(cx + rx) + 2)
                 if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + (N(x * 0.5, y * 0.5) - 0.5) < 1 and plain(x, y) and (x, y) not in busy]
        sn = _snap(m, cells)
        for (x, y) in cells: m.ground('water', x, y, x, y)
        if start_ok and not _keys_ok(m, K): _undo(m, sn)
    if C.get('pond'):   # the old rectangular pond gets round, ragged edges
        for i in range(W * H):
            x, y = i % W, i // W
            if m.mat[i] == 'water' and (x, y) not in busy and sum(1 for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)) if m.ok(x + a, y + b) and m.mat[m.i(x + a, y + b)] != 'water') >= 2 and N(x * 0.7, y * 0.7) > 0.45:
                m.ground(base, x, y, x, y)
    # 3. streets: from each way in to the plaza, and from the plaza (or the nearest street) to every door
    hub = (X(C['plaza'][1]), Y(C['plaza'][2])) if C.get('plaza') else (X(0), Y(0))
    if C.get('plaza'):
        mat, u, v, rx, ry = C['plaza']
        for y in range(hub[1] - ry - 1, hub[1] + ry + 2):
            for x in range(hub[0] - rx - 1, hub[0] + rx + 2):
                if m.ok(x, y) and ((x - hub[0]) / rx) ** 2 + ((y - hub[1]) / ry) ** 2 + (N(x * 0.6, y * 0.6) - 0.5) * 0.6 < 1 and m.mat[m.i(x, y)] == base: m.mat[m.i(x, y)] = mat
    if C.get('corral'):
        mat, u, v, rx, ry = C['corral']; cx, cy = X(u), Y(v)
        for i in range(W * H):
            if m.mat[i] == 'sand': m.mat[i] = base
        for y in range(cy - ry - 1, cy + ry + 2):
            for x in range(cx - rx - 1, cx + rx + 2):
                if m.ok(x, y) and ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1 and m.mat[m.i(x, y)] == base: m.mat[m.i(x, y)] = mat
    doors = [(w['x'], w['y'] + 1) for w in m.warps if w['to'] != '@world' and m.ok(w['x'], w['y'] + 1) and m.col[m.i(w['x'], w['y'] + 1)] == OPEN and 0 < w['y'] < H - 1]
    exits = {}
    for w in m.warps:
        if w['to'] == '@world' or w['x'] in (0, W - 1) or w['y'] in (0, H - 1): exits.setdefault((w['x'] // 4, w['y'] // 4), (w['x'], w['y']))
    targets = [(p, 'main') for p in exits.values()]
    if m.entry: targets.append((tuple(m.entry), 'main'))
    targets += [(p, 'lane') for p in doors] + [((s[0], s[1] + 1), 'lane') for s in m.extra.get('saves', [])]
    path_cells = set()
    def paint(x, y, mat):
        if not m.ok(x, y): return
        i = m.i(x, y)
        if m.wall[i] is not None: return
        if m.mat[i] in ('water', 'aether') and m.col[i] != OPEN:
            if m.layers['deco'][i] < 0 and (x, y) not in busy: m.ground('planks', x, y, x, y); path_cells.add((x, y))   # bridges and boardwalks
            return
        if m.mat[i] == base or m.mat[i] in ('dirt', 'cobble', 'planks', C['main'], C['lane']): m.mat[i] = mat; path_cells.add((x, y))
    def street(a, b, mat, width):
        for (x, y) in _curve(a, b, r, 0.12):
            for dx in range(width):
                for dy in range(width): paint(int(round(x)) + dx - width // 2, int(round(y)) + dy - width // 2, mat)
    if C.get('ring'):
        ry = min(W, H) * 0.3; rx = ry * W / H
        for k in range(200):
            a = k / 200 * math.pi * 2; x, y = hub[0] + math.cos(a) * rx, hub[1] + math.sin(a) * ry
            for dx in range(2):
                for dy in range(2): paint(int(x) + dx, int(y) + dy, C['main'])
    for (p, kind) in targets:
        tgt = hub
        if kind == 'lane' and path_cells:
            q = min(path_cells, key=lambda c: (c[0] - p[0]) ** 2 + (c[1] - p[1]) ** 2)
            if (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 < (hub[0] - p[0]) ** 2 + (hub[1] - p[1]) ** 2: tgt = q
        street(p, tgt, C['main'] if kind == 'main' else C['lane'], 3 if kind == 'main' else 2)
    # 4. the silhouette: outside the town's shape becomes forest, rock or sea
    forest_b = any(m.layers['deco'][m.i(1, y)] >= 0 for y in range(H)) and C['shape'] != 'island'
    wall_mat = next((m.wall[m.i(0, y)] for y in range(H) if m.wall[m.i(0, y)]), None)
    protect = busy | path_cells
    def out(x, y): return _shape(C['shape'], U(x), V(y), N(x * 0.11 + 3, y * 0.11) - 0.5) > C.get('cut', 0.84)
    # clear small clutter (flowers, tufts, bushes, pebbles; and for an island, the old forest) out where the wild begins
    import mapkit as MK
    NAT = MK.SI['nature']
    for y in range(H):
        for x in range(W):
            if not out(x, y) or (x, y) in protect: continue
            i = m.i(x, y); changed = False
            for L in ('deco', 'over'):
                v = m.layers[L][i]
                if v >= 0 and (v >> 16) == NAT:
                    ty = (v >> 8) & 255
                    if 10 <= ty <= 15 or C['shape'] == 'island': m.layers[L][i] = -1; changed = True
            if changed and m.wall[i] is None and m.layers['deco'][i] < 0: m.col[i] = OPEN
    step = 2 if forest_b else 1
    for y in range(1, H - 1, step):
        for x in range(1, W - 1, step):
            cells = [(x, y), (x + 1, y), (x, y + 1), (x + 1, y + 1)] if step == 2 else [(x, y)]
            if not all(out(a, b) and plain(a, b) and (a, b) not in protect for (a, b) in cells): continue
            sn = _snap(m, cells)
            if C['shape'] == 'island': m.ground('water', x, y, x, y)
            elif forest_b: tree(m, x, y, r.choice(['round', 'pine', 'bushy', 'light']) if base == 'grass' else 'pine')
            elif wall_mat: m.walls(wall_mat, x, y, x, y)
            else: continue
            if start_ok and not _keys_ok(m, K): _undo(m, sn)
    if C['shape'] == 'island':
        for y in range(H):
            for x in range(W):
                i = m.i(x, y)
                if m.mat[i] == base and (x, y) not in path_cells and any(m.ok(x + a, y + b) and m.mat[m.i(x + a, y + b)] == 'water' for a in (-1, 0, 1) for b in (-1, 0, 1)): m.mat[i] = 'sand'
    if C.get('terraces'):   # Windhaven: arcs of low crags below the temple, broken by the streets
        for k in (0.45, 0.75):
            for t in range(140):
                a = math.pi * (0.12 + 0.76 * t / 140); x, y = int(hub[0] + math.cos(a) * W * k * 0.5), int(hub[1] + 2 - math.sin(a) * H * k * 0.5)
                if plain(x, y) and (x, y) not in protect:
                    sn = _snap(m, [(x, y)]); rock(m, x, y)
                    if start_ok and not _keys_ok(m, K): _undo(m, sn)
    # 5. pockets the outline cut off: nobody can stand there, so fill them
    seen = _reach(m)
    if seen is not None and start_ok:
        for y in range(1, H - 1):
            for x in range(1, W - 1):
                i = m.i(x, y)
                if m.col[i] == OPEN and not seen[i] and (x, y) not in busy and m.wall[i] is None and m.layers['deco'][i] < 0:
                    if C['shape'] == 'island': m.ground('water', x, y, x, y)
                    elif wall_mat and not forest_b: m.walls(wall_mat, x, y, x, y)
                    else: bush(m, x, y)
    # 6. flower beds along the streets
    for (x, y) in sorted(path_cells)[::7]:
        for (a, b) in ((2, 0), (-2, 0), (0, 2), (0, -2)):
            X0, Y0 = x + a, y + b
            if plain(X0, Y0) and (X0, Y0) not in protect and m.mat[m.i(X0, Y0)] == base and r.random() < 0.25: flowers(m, [(X0, Y0)])

def patch(maps):
    for k, C in TOWNS.items():
        if k in maps: reshape(maps[k], C, sum(map(ord, k)))
