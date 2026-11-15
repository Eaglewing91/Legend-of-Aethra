"""The world of Aethra: terrain grid (256 x 192 tiles), places, vehicles and encounter regions -> build/world.json.

Shapes are blobs and noisy lines, so coastlines, ranges and rivers look natural but stay exactly where the story
needs them. Terrain codes (one byte per tile) are listed in T below; the game draws the world in perspective."""
import json, math, os, random

W, H = 256, 192
T = {'sea': 0, 'shallow': 1, 'beach': 2, 'grass': 3, 'forest': 4, 'hills': 5, 'mount': 6, 'desert': 7, 'snow': 8, 'snowmount': 9,
     'swamp': 10, 'ash': 11, 'river': 12, 'road': 13, 'city': 14, 'jungle': 15, 'lava': 16, 'crater': 17, 'rail': 18, 'farm': 19, 'mesa': 20, 'ice': 21, 'deep': 22}
rnd = random.Random(7)
# value noise
PERM = list(range(256)); rnd.shuffle(PERM)
def h2(x, y): return PERM[(PERM[x & 255] + y) & 255] / 255.0
def vnoise(x, y):
    xi, yi = int(math.floor(x)), int(math.floor(y)); xf, yf = x - xi, y - yi
    u, v = xf * xf * (3 - 2 * xf), yf * yf * (3 - 2 * yf)
    a, b, c, d = h2(xi, yi), h2(xi + 1, yi), h2(xi, yi + 1), h2(xi + 1, yi + 1)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
def fbm(x, y, o=4):
    s, a, f, n = 0, 1, 1, 0
    for _ in range(o): s += a * vnoise(x * f, y * f); n += a; a *= 0.5; f *= 2
    return s / n

g = [[T['sea']] * W for _ in range(H)]
def put(x, y, t):
    if 0 <= x < W and 0 <= y < H: g[y][x] = t
def at(x, y): return g[y][x] if 0 <= x < W and 0 <= y < H else T['sea']
def blob(cx, cy, rx, ry, t, rough=0.5, only=None, scale=0.08, seed=0):
    for y in range(int(cy - ry * 1.5), int(cy + ry * 1.5) + 1):
        for x in range(int(cx - rx * 1.5), int(cx + rx * 1.5) + 1):
            wx = x + (fbm(x * 0.07 + seed * 3.3, y * 0.07) - 0.5) * rx * 1.1; wy = y + (fbm(x * 0.07, y * 0.07 + seed * 5.1) - 0.5) * ry * 1.1
            d = ((wx - cx) / rx) ** 2 + ((wy - cy) / ry) ** 2
            n = fbm(x * scale + seed * 13.1, y * scale + seed * 7.7)
            if d < 1 + (n - 0.5) * 2 * rough * 2:
                if only is None or at(x, y) in only: put(x, y, t)
def line(pts, t, width=1.0, rough=0.6, only=None, seed=0):
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = int(max(abs(x1 - x0), abs(y1 - y0)) * 2) + 1
        for k in range(n + 1):
            x, y = x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n
            w = width * (0.7 + fbm(x * 0.2 + seed, y * 0.2) * rough)
            for yy in range(int(y - w - 1), int(y + w + 2)):
                for xx in range(int(x - w - 1), int(x + w + 2)):
                    if (xx - x) ** 2 + (yy - y) ** 2 <= w * w and (only is None or at(xx, yy) in only): put(xx, yy, t)
LAND = None
def land(): return {v for k, v in T.items() if k not in ('sea', 'shallow', 'deep')}

# ---------- continents ----------
# Each continent is a set of cores (ellipses) and arms (tapering strokes: peninsulas, capes, hooks) with bays cut out of
# it; the edge is pushed about by two layers of noise and a domain warp, so coastlines are jagged at every scale.
def seg_d(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay; L = dx * dx + dy * dy or 1
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / L)); qx, qy = ax + t * dx, ay + t * dy
    return math.hypot(px - qx, py - qy), t
CONT = [
    # Meridia: a broad heartland, the mesa country in the south-west, a curling western arm, the Port Lark cape
    dict(cores=[(76, 98, 40, 34, 0.3), (104, 80, 22, 18, -0.4), (118, 106, 14, 22, 0.2), (40, 130, 22, 16, 0.5), (62, 62, 20, 12, -0.2)],
         arms=[[(44, 84, 9), (24, 96, 7), (16, 116, 6), (22, 138, 4)], [(118, 112, 8), (134, 112, 6), (140, 122, 3)], [(62, 60, 7), (54, 46, 4)],
               [(100, 118, 7), (96, 140, 5), (104, 154, 3)], [(30, 140, 6), (20, 152, 4), (28, 160, 2)]],
         bays=[(86, 126, 9, 6), (54, 82, 6, 5), (126, 90, 6, 7), (66, 132, 7, 5)]),
    # Solmara: desert heart, Mount Cinder's horn in the east, a southern hook, a western lobe for Saltmere
    dict(cores=[(196, 154, 40, 22, 0.15), (164, 126, 14, 12, 0), (226, 130, 12, 16, 0.4), (176, 178, 24, 9, -0.1)],
         arms=[[(226, 120, 8), (236, 104, 5), (232, 92, 3)], [(160, 182, 7), (142, 186, 4)], [(214, 172, 8), (234, 178, 5), (246, 168, 3)], [(158, 132, 6), (146, 140, 3)]],
         bays=[(212, 140, 8, 5), (184, 132, 6, 4)]),
    # Nordheim: a long frozen shelf with the Crater in the west, fingers reaching south (Frostgate, Lumen)
    dict(cores=[(140, 22, 66, 15, 0), (82, 28, 22, 12, 0.2), (204, 20, 22, 12, -0.1)],
         arms=[[(110, 30, 7), (108, 42, 5), (104, 52, 3)], [(152, 30, 6), (160, 42, 4), (156, 52, 2)], [(186, 26, 7), (190, 38, 4)], [(64, 26, 6), (48, 36, 4), (40, 48, 2)]],
         bays=[(130, 36, 7, 5), (176, 36, 5, 4)]),
]
ISLANDS = [(242, 52, 6, 4), (236, 44, 3, 2), (248, 60, 3, 3), (20, 40, 6, 5), (12, 48, 3, 2), (150, 88, 5, 5), (156, 82, 2, 2), (238, 92, 4, 6),
           (12, 170, 5, 8), (22, 180, 3, 2), (120, 182, 6, 8), (132, 186, 3, 2), (108, 186, 2, 2), (205, 82, 4, 9), (30, 82, 4, 9), (64, 176, 3, 2), (240, 140, 2, 3)]
def landness(x, y):
    wx = x + (fbm(x * 0.045 + 31, y * 0.045) - 0.5) * 16; wy = y + (fbm(x * 0.045, y * 0.045 + 57) - 0.5) * 16   # domain warp
    best = -9
    for C in CONT:
        v = -9
        for (cx, cy, rx, ry, rot) in C['cores']:
            c, s_ = math.cos(rot), math.sin(rot); dx, dy = wx - cx, wy - cy
            u, w_ = (dx * c + dy * s_) / rx, (-dx * s_ + dy * c) / ry
            v = max(v, 1 - math.sqrt(u * u + w_ * w_))
        for arm in C['arms']:
            for (ax, ay, ar), (bx, by, br) in zip(arm, arm[1:]):
                d, t = seg_d(wx, wy, ax, ay, bx, by); r_ = ar + (br - ar) * t
                v = max(v, 1 - d / r_)
        for (bx, by, brx, bry) in C['bays']:
            v = min(v, ((wx - bx) / brx) ** 2 + ((wy - by) / bry) ** 2 - 1)
        best = max(best, v)
    for (cx, cy, rx, ry) in ISLANDS:
        best = max(best, 1 - math.sqrt(((wx - cx) / rx) ** 2 + ((wy - cy) / ry) ** 2))
    return best + (fbm(x * 0.09, y * 0.09) - 0.5) * 0.7 + (fbm(x * 0.25 + 5, y * 0.25) - 0.5) * 0.35
for y in range(H):
    for x in range(W):
        if landness(x, y) > 0.08: g[y][x] = T['grass']
# every place stands on land, with a little ground round it
PLACE_XY = [(70, 100), (104, 84), (116, 70), (98, 120), (89, 76), (120, 54), (36, 132), (132, 110), (157, 120), (150, 132), (195, 155), (178, 146), (225, 168), (212, 142),
            (222, 128), (110, 36), (150, 22), (186, 22), (96, 14), (242, 52), (30, 82), (20, 40), (205, 82), (238, 92), (120, 182), (12, 170), (150, 88), (73, 144), (91, 104),
            (83, 91), (200, 165), (130, 30), (60, 30)]
for (px, py) in PLACE_XY:
    for yy in range(py - 2, py + 3):
        for xx in range(px - 2, px + 3):
            if 0 <= xx < W and 0 <= yy < H and g[yy][xx] == T['sea']: g[yy][xx] = T['grass']
LAND = land()
# ---------- biomes ----------
blob(135, 20, 70, 18, T['snow'], only=LAND, seed=4)                       # the whole north is snow
blob(80, 30, 24, 14, T['snow'], only=LAND, seed=5)
blob(70, 100, 16, 13, T['ash'], only=LAND, seed=6)                        # reactor wastes around Halcyon
blob(118, 70, 12, 10, T['forest'], only=LAND, seed=7)                     # Mistwood
blob(45, 80, 12, 9, T['forest'], only=LAND, seed=8)
blob(150, 165, 14, 8, T['jungle'], only=LAND, seed=9)
blob(200, 156, 34, 20, T['desert'], only=LAND, seed=10)                   # Sunscar
blob(38, 132, 14, 12, T['desert'], only=LAND, seed=11)                    # the Gilded Spire's mesa country
blob(36, 132, 4, 4, T['mesa'], only={T['desert']}, seed=12)
blob(108, 128, 10, 7, T['swamp'], only=LAND, seed=13)
blob(100, 86, 10, 7, T['farm'], only=LAND, seed=14)                       # Thornbrook fields
blob(176, 186, 20, 6, T['jungle'], only=LAND, seed=15)
# mountains: ranges as noisy lines
line([(56, 58), (40, 66), (28, 76)], T['mount'], 2.6, only=LAND, seed=2)
line([(122, 50), (132, 58)], T['mount'], 2.2, only=LAND, seed=3)
line([(214, 112), (226, 122), (232, 136)], T['mount'], 3.0, only=LAND, seed=4)
line([(70, 22), (100, 12), (140, 8), (170, 12), (205, 6)], T['snowmount'], 3.4, only=LAND, seed=6)
line([(120, 30), (128, 40)], T['snowmount'], 2.0, only=LAND, seed=8)
blob(226, 124, 4, 4, T['lava'], only=LAND, seed=18)                       # Mount Cinder's caldera
line([(46, 116), (50, 104), (60, 92)], T['hills'], 2.0, only=LAND, seed=9)
line([(132, 92), (126, 100)], T['hills'], 2.0, only=LAND, seed=10)
# ridged ranges: long crooked spines of peaks inland, the way FF7's ranges snake across a continent
def coast_d(x, y, r=3):
    return any(at(x + dx, y + dy) == T['sea'] for dx in range(-r, r + 1) for dy in range(-r, r + 1))
for y in range(H):
    for x in range(W):
        t0 = at(x, y)
        if t0 not in (T['grass'], T['forest'], T['desert'], T['snow'], T['jungle'], T['farm']) or coast_d(x, y): continue
        if any(abs(x - px) <= 4 and abs(y - py) <= 4 for (px, py) in PLACE_XY): continue
        ridge = 1 - abs(2 * fbm(x * 0.06 + 90, y * 0.06 + 40, 3) - 1); mask = fbm(x * 0.02 + 7, y * 0.02 + 3)
        if mask < 0.47: continue
        snowy = t0 == T['snow']
        if ridge > 0.955: put(x, y, T['snowmount'] if snowy else T['mount'])
        elif ridge > 0.9 and not snowy: put(x, y, T['hills'])
# rivers
line([(118, 60), (112, 76), (106, 92), (102, 106), (108, 124), (112, 140)], T['river'], 1.2, rough=0.3, only=LAND, seed=11)
line([(60, 64), (58, 80), (64, 92)], T['river'], 1.0, rough=0.3, only=LAND, seed=12)
line([(198, 146), (190, 160), (184, 176), (180, 186)], T['river'], 1.0, rough=0.3, only=LAND, seed=13)
# roads and the railway
line([(76, 100), (88, 100), (98, 92), (104, 86)], T['road'], 0.6, rough=0, only=LAND | {T['river']}, seed=14)
line([(104, 86), (112, 78), (118, 62), (120, 56)], T['road'], 0.6, rough=0, only=LAND | {T['river']}, seed=15)
line([(104, 88), (100, 104), (98, 118)], T['road'], 0.6, rough=0, only=LAND | {T['river']}, seed=16)
line([(98, 118), (110, 116), (126, 112), (132, 110)], T['road'], 0.6, rough=0, only=LAND | {T['river']}, seed=17)
line([(64, 100), (52, 112), (42, 124)], T['road'], 0.6, rough=0, only=LAND | {T['river']}, seed=18)
line([(160, 120), (176, 132), (194, 150)], T['road'], 0.6, rough=0, only=LAND, seed=19)
line([(110, 34), (124, 30), (148, 22)], T['road'], 0.6, rough=0, only=LAND, seed=20)
line([(80, 100), (92, 98), (100, 90)], T['rail'], 0.5, rough=0, only=LAND | {T['river'], T['road']}, seed=21)
blob(70, 100, 6, 5, T['city'], rough=0.05, only=LAND, seed=19)            # Halcyon
# shores: shallow water around land, beaches
for y in range(H):
    for x in range(W):
        if at(x, y) == T['sea']:
            if any(at(x + dx, y + dy) not in (T['sea'], T['shallow'], T['deep']) for dx in (-1, 0, 1) for dy in (-1, 0, 1)): g[y][x] = T['shallow']
for y in range(H):
    for x in range(W):
        if at(x, y) == T['sea'] and fbm(x * 0.05, y * 0.05) < 0.38: g[y][x] = T['deep']
for y in range(H):
    for x in range(W):
        if at(x, y) in (T['grass'], T['jungle']) and any(at(x + dx, y + dy) == T['shallow'] for dx in (-1, 0, 1) for dy in (-1, 0, 1)) and fbm(x * 0.3, y * 0.3) > 0.45: g[y][x] = T['beach']
blob(140, 172, 5, 4, T['deep'], only={T['sea'], T['shallow']}, seed=20)  # the trench over the Coral Sanctum

# ---------- story geography: what each way of travelling can reach (checked by tools/check_world.py) ----------
import heapq
FOOT = {2, 3, 4, 5, 7, 8, 10, 11, 13, 14, 15, 18, 19, 21}
# the Coral trench: open water, deep in the middle
for y in range(160, 185):
    for x in range(128, 153):
        d = math.hypot(x - 140, y - 172)
        if d < 7 + (fbm(x * 0.3, y * 0.3) - 0.5) * 3: g[y][x] = T['deep'] if d < 3.5 else (T['sea'] if d < 6 else T['shallow'])
def ring(cx, cy, r_in, r_out, wall, floor, seed=0):
    """A ring of peaks (closed all the way round) with a hidden floor inside: only the airship gets in."""
    R = int(r_out * 1.5) + 2
    for y in range(cy - R, cy + R + 1):
        for x in range(cx - R, cx + R + 1):
            a = math.atan2(y - cy, x - cx)
            wob = 1 + 0.28 * math.sin(a * 3 + seed) + 0.16 * math.sin(a * 5 + seed * 2.3) + (fbm(x * 0.2 + seed, y * 0.2) - 0.5) * 0.6
            d = math.hypot(x - cx, y - cy) / wob
            if d < r_in: put(x, y, floor)
            elif d < r_out: put(x, y, wall)
ring(96, 14, 6, 10.5, T['snowmount'], T['snow'], 1); blob(96, 14, 3, 3, T['crater'], rough=0.3, seed=17)       # the Crater
ring(186, 22, 5, 8.5, T['snowmount'], T['forest'], 2); blob(186, 22, 2.2, 2, T['snow'], rough=0.2, seed=18)   # Lumen's hidden wood
ring(60, 30, 3, 6.5, T['mount'], T['hills'], 3)                                                              # the Fallen Isle
def gold_isle(cx, cy, r):
    """Cliffs all round and thick forest inside: no beach for a boat, nowhere for the airship. Only the Gold Talonbird."""
    for y in range(cy - r - 3, cy + r + 4):
        for x in range(cx - r - 3, cx + r + 4):
            if at(x, y) in (T['sea'], T['shallow'], T['deep']): continue
            put(x, y, T['forest'] if math.hypot(x - cx, (y - cy) * 0.8) < r - 2.2 else T['mount'])
    put(cx, cy, T['forest'])
gold_isle(150, 88, 5); gold_isle(12, 170, 5)
# ---------- secret places (hidden on every map until found) ----------
def vault(cx, cy, r):
    """A valley sealed by cliffs, on land: forest inside, mountains round it. Only the Gold Talonbird climbs in."""
    for y in range(cy - r - 2, cy + r + 3):
        for x in range(cx - r - 2, cx + r + 3):
            d = math.hypot(x - cx, y - cy)
            if d < r - 1.6: put(x, y, T['forest'])
            elif d < r + 1.2: put(x, y, T['mount'])
    put(cx, cy, T['forest'])
# Needle Atoll: a ring of sand in the open sea south of Port Lark (the levelling island, FF7's Cactus Island)
for y in range(136, 157):
    for x in range(110, 131):
        d = math.hypot(x - 120, (y - 146) * 1.15) + (fbm(x * 0.3 + 9, y * 0.3) - 0.5) * 2.2
        if d < 4.2: put(x, y, T['desert'])
        elif d < 5.6: put(x, y, T['beach'])
        elif d < 7.5 and at(x, y) in (T['sea'], T['deep']): put(x, y, T['shallow'])
for (x, y) in ((118, 144), (123, 148), (121, 143)): put(x, y, T['jungle'])      # a few palms
vault(20, 118, 5)                                                            # the Gold Talonbird's hidden valley
ring(224, 27, 2.5, 6, T['snowmount'], T['snow'], 7)                          # a peak only the airship can land on
for y in range(176, 186):                                                     # a deep hole in the south-west sea
    for x in range(56, 66):
        if at(x, y) in (T['sea'], T['shallow'], T['deep']):
            d = math.hypot(x - 61, y - 181); put(x, y, T['deep'] if d < 2.6 else T['sea'] if d < 4.6 else at(x, y))
for (px, py, t) in [(58, 70, 'grass'), (46, 80, 'forest'), (230, 152, 'desert'), (170, 183, 'beach'), (158, 44, 'snow')]:
    for yy in range(py - 1, py + 2):
        for xx in range(px - 1, px + 2):
            if at(xx, yy) in (T['sea'], T['shallow'], T['deep'], T['mount'], T['snowmount'], T['river']): put(xx, yy, T[t])
    put(px, py, T[t])
def path(a, b, cost):
    """Cheapest route a -> b; cost(tile) is None where it cannot go."""
    dist = {a: 0}; prev = {}; q = [(0, a)]
    while q:
        d, c = heapq.heappop(q)
        if c == b: break
        if d > dist[c]: continue
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (c[0] + dx, c[1] + dy)
            if not (0 <= n[0] < W and 0 <= n[1] < H): continue
            k = cost(at(*n)) if n != b else 1
            if k is None: continue
            if d + k < dist.get(n, 1e9): dist[n] = d + k; prev[n] = c; heapq.heappush(q, (d + k, n))
    out = [b]
    while out[-1] != a:
        if out[-1] not in prev: return None
        out.append(prev[out[-1]])
    return out[::-1]
PASS = {T['shallow']: (25, T['grass']), T['sea']: (40, T['grass']), T['river']: (6, T['road']), T['mount']: (9, T['hills']), T['snowmount']: (9, T['snow']), T['mesa']: (9, T['desert'])}
def foot_cost(t): return 1 if t in FOOT else PASS[t][0] if t in PASS else None
def walkable(a, b):
    """Make sure you can walk a -> b: fords become bridges, a pass is cut through any range in the way."""
    p = path(a, b, foot_cost)
    if p is None: print('no land route', a, b); return
    for (x, y) in p:
        if at(x, y) in (T['sea'], T['shallow']):
            rr = 1.2 + fbm(x * 0.2, y * 0.2) * 2.2        # an isthmus of uneven width, not a causeway
            for dy in range(-3, 4):
                for dx in range(-3, 4):
                    if dx * dx + dy * dy <= rr * rr and at(x + dx, y + dy) in (T['sea'], T['shallow'], T['deep']): put(x + dx, y + dy, T['grass'])
        elif at(x, y) in PASS: put(x, y, PASS[at(x, y)][1])
STAND = {(96, 14): T['crater']}
for (px, py) in PLACE_XY:
    if at(px, py) not in FOOT and (px, py) not in STAND: put(px, py, T['desert'] if at(px, py) == T['mesa'] else T['hills'] if at(px, py) == T['mount'] else T['grass'])
for yy in (133, 134):                 # the foot of the Gilded Spire, where the Skimmer is left
    for xx in (35, 36, 37): put(xx, yy, T['desert'])
for k in [(104, 84), (116, 70), (98, 120), (89, 76), (120, 54), (36, 132), (132, 110), (73, 144), (91, 104), (83, 91), (58, 70), (46, 80)]: walkable((70, 100), k)
for k in [(195, 155), (178, 146), (225, 168), (212, 142), (222, 128), (150, 132), (200, 165), (230, 152), (170, 183)]: walkable((157, 120), k)
def gold_cost(t): return None if t == T['lava'] else 4 if t == T['deep'] else 1
for k in [(150, 88), (12, 170)]:                 # a run of shoals the Gold Talonbird can wade along from Plumage Isle
    for (x, y) in path((30, 82), k, gold_cost) or []:
        if at(x, y) == T['deep']: put(x, y, T['shallow'])
for y in range(H):
    for x in range(W):
        if at(x, y) in (T['sea'], T['deep']) and math.hypot(x - 140, y - 172) > 7 and any(at(x + dx, y + dy) not in (T['sea'], T['shallow'], T['deep']) for dx in (-1, 0, 1) for dy in (-1, 0, 1)): g[y][x] = T['shallow']
def dock(near, water):
    """A foot tile next to water a vessel can sail, as close to `near` as possible: where the vessel is moored."""
    best = None
    for y in range(H):
        for x in range(W):
            if at(x, y) in FOOT and any(at(x + dx, y + dy) in water for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                d = (x - near[0]) ** 2 + (y - near[1]) ** 2
                if best is None or d < best[0]: best = (d, x, y)
    return [best[1], best[2]]

# ---------- places: id -> (x, y, map, entry x, entry y, kind, name) ----------
PLACES = {
    'halcyon': (70, 100, 'halcyon_gate', 0, 0, 'city', 'Halcyon'),
    'thornbrook': (104, 84, 'thornbrook', 0, 0, 'town', 'Thornbrook'),
    'mistwood': (116, 70, 'mistwood', 0, 0, 'forest', 'Mistwood'),
    'kestrel': (98, 120, 'kestrel', 0, 0, 'ranch', 'Kestrel Ranch'),
    'oldmine': (89, 76, 'oldmine', 0, 0, 'cave', 'Old Mine'),
    'windhaven': (120, 54, 'windhaven', 0, 0, 'temple', 'Windhaven'),
    'gilded': (36, 132, 'gilded_spire', 0, 0, 'spire', 'Gilded Spire'),
    'portlark': (132, 110, 'portlark', 0, 0, 'port', 'Port Lark'),
    'saltmere': (157, 120, 'saltmere', 0, 0, 'port', 'Saltmere'),
    'smugglers': (150, 132, 'grotto', 0, 0, 'cave', 'Smugglers\' Grotto'),
    'coral': (140, 172, 'coral_1', 0, 0, 'sea', 'Coral Sanctum'),
    'sunscar': (195, 155, 'sunscar', 0, 0, 'town', 'Sunscar'),
    'sunruins': (178, 146, 'sunruins', 0, 0, 'ruins', 'Sunscar Ruins'),
    'orin': (225, 168, 'orin_tower', 0, 0, 'tower', 'Orin\'s Tower'),
    'dunewreck': (212, 142, 'dunewreck', 0, 0, 'wreck', 'Dunewreck'),
    'cinder': (222, 128, 'cinder_1', 0, 0, 'volcano', 'Mount Cinder'),
    'frostgate': (110, 36, 'frostgate', 0, 0, 'town', 'Frostgate'),
    'deeproot': (150, 22, 'deeproot_1', 0, 0, 'cave', 'Deeproot Caverns'),
    'lumen': (186, 22, 'lumen', 0, 0, 'village', 'Lumen'),
    'crater': (96, 14, 'crater', 0, 0, 'crater', 'The Crater'),
    'abyss': (242, 52, 'abyss_1', 0, 0, 'tower', 'Abyssal Spire'),
    'talon_isle': (30, 82, 'talon_isle', 0, 0, 'ranch', 'Plumage Isle'),
    'trial_gale': (20, 40, 'trial_gale', 0, 0, 'shrine', 'Gale Trial'),
    'trial_frost': (205, 82, 'trial_frost', 0, 0, 'shrine', 'Frost Trial'),
    'trial_storm': (238, 92, 'trial_storm', 0, 0, 'shrine', 'Storm Trial'),
    'wreck_isle': (120, 182, 'wreck_isle', 0, 0, 'wreck', 'Shipwreck Cove'),
    'hermit': (12, 170, 'hermit', 0, 0, 'hut', 'Hermit\'s Hut'),
    'chapel': (150, 88, 'chapel', 0, 0, 'temple', 'Isle Chapel'),
    'mideel': (73, 144, 'mideel', 0, 0, 'village', 'Mideel Shallows'),
    'academy': (91, 104, 'academy', 0, 0, 'tower', 'Vanguard Academy'),
    'camp': (83, 91, 'camp', 0, 0, 'village', 'Cinder Camp'),
    'refinery': (200, 165, 'refinery_1', 0, 0, 'tower', 'Aurex Sand Refinery'),
    'outpost': (130, 30, 'outpost_1', 0, 0, 'tower', 'Northwatch Outpost'),
    'skyruins': (60, 30, 'skyruins_1', 0, 0, 'ruins', 'Fallen Isle'),
    # secrets
    'falls': (58, 70, 'sc_falls_1', 0, 0, 'cave', 'Veiled Falls'),
    'vault': (20, 118, 'sc_vault_1', 0, 0, 'cave', 'Kingsrest Hollow'),
    'deep_ruin': (61, 181, 'sc_deep_1', 0, 0, 'sea', 'Drowned Archive'),
    'peak': (224, 27, 'sc_peak_1', 0, 0, 'shrine', 'Skyward Peak'),
    'oasis': (230, 152, 'sc_oasis', 0, 0, 'village', 'Moonwell Oasis'),
    'graveyard': (46, 80, 'sc_graves', 0, 0, 'ruins', 'Forgotten Graves'),
    'hidden_cove': (170, 183, 'sc_cove', 0, 0, 'cave', 'Rumrunners\' Cove'),
    'star_cabin': (158, 44, 'sc_cabin', 0, 0, 'hut', 'Stargazer\'s Cabin'),
}
SECRETS = ['falls', 'vault', 'deep_ruin', 'peak', 'oasis', 'graveyard', 'hidden_cove', 'star_cabin']
# encounter regions: a coarse grid (16 x 16 tiles per cell) of encounter groups by area
REG = {}
def region(x0, y0, x1, y1, name):
    for cy in range(y0 // 16, y1 // 16 + 1):
        for cx in range(x0 // 16, x1 // 16 + 1): REG['%d,%d' % (cx, cy)] = name
region(0, 48, 143, 191, 'w_meridia_s'); region(48, 80, 95, 127, 'w_ashfields'); region(96, 48, 143, 95, 'w_meridia_n'); region(0, 112, 63, 159, 'w_mesa')
region(144, 112, 255, 191, 'w_solmara'); region(176, 128, 239, 175, 'w_desert'); region(208, 112, 239, 143, 'w_cinder')
region(0, 0, 255, 47, 'w_nordheim'); region(160, 0, 207, 39, 'w_lumen_wood')
VEHICLES = {'talon': None, 'skimmer': (190, 152), 'boat': dock((134, 112), {T['sea'], T['shallow']}), 'sub': dock((156, 124), {T['sea'], T['shallow']}), 'airship': dock((212, 146), FOOT)}

def main():
    os.makedirs('build', exist_ok=True)
    flat = [g[y][x] for y in range(H) for x in range(W)]
    json.dump({'w': W, 'h': H, 't': flat, 'T': T, 'places': PLACES, 'reg': REG, 'vehicles': VEHICLES, 'secrets': SECRETS}, open('build/world.json', 'w'), separators=(',', ':'))
    # preview
    try:
        from PIL import Image
        C = {0: (24, 60, 140), 1: (60, 120, 200), 2: (230, 210, 150), 3: (90, 170, 70), 4: (30, 110, 50), 5: (140, 150, 80), 6: (120, 100, 80), 7: (230, 190, 110),
             8: (230, 240, 250), 9: (180, 190, 210), 10: (80, 100, 70), 11: (110, 100, 100), 12: (70, 140, 220), 13: (180, 150, 100), 14: (160, 160, 170),
             15: (40, 130, 60), 16: (230, 80, 30), 17: (70, 60, 70), 18: (90, 70, 60), 19: (170, 190, 80), 20: (190, 120, 80), 21: (200, 230, 250), 22: (14, 40, 100)}
        im = Image.new('RGB', (W, H))
        im.putdata([C[v] for v in flat])
        for k, p in PLACES.items(): im.putpixel((p[0], p[1]), (255, 0, 0))
        im.resize((W * 3, H * 3), Image.NEAREST).save('build/world-preview.png')
    except Exception as e: print(e)
    print('world: %dx%d, %d places' % (W, H, len(PLACES)))

if __name__ == '__main__':
    main()
