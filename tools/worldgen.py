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
def blob(cx, cy, rx, ry, t, rough=0.35, only=None, scale=0.08, seed=0):
    for y in range(int(cy - ry * 1.5), int(cy + ry * 1.5) + 1):
        for x in range(int(cx - rx * 1.5), int(cx + rx * 1.5) + 1):
            d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
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
# Meridia (centre-west)
for (cx, cy, rx, ry) in [(75, 100, 52, 44), (40, 128, 26, 22), (112, 72, 24, 24), (120, 108, 18, 26), (60, 60, 26, 16)]: blob(cx, cy, rx, ry, T['grass'], seed=1)
# Solmara (south-east)
for (cx, cy, rx, ry) in [(195, 152, 46, 30), (165, 128, 18, 16), (228, 128, 16, 18), (175, 178, 28, 12)]: blob(cx, cy, rx, ry, T['grass'], seed=2)
# Nordheim (north)
for (cx, cy, rx, ry) in [(135, 24, 72, 20), (80, 30, 26, 16), (200, 20, 26, 16)]: blob(cx, cy, rx, ry, T['grass'], seed=3)
# islands
for (cx, cy, r, s) in [(242, 52, 8, 4), (20, 40, 7, 5), (150, 88, 6, 6), (238, 92, 5, 7), (12, 170, 6, 9), (120, 182, 7, 10), (205, 82, 5, 11), (30, 82, 5, 12)]: blob(cx, cy, r, r * 0.8, T['grass'], seed=s)
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
blob(185, 22, 10, 7, T['forest'], only={T['snow']}, seed=16)              # Lumen's hidden wood
# mountains: ranges as noisy lines
line([(88, 58), (90, 78), (86, 96), (90, 116)], T['mount'], 3.2, only=LAND, seed=1)
line([(56, 58), (40, 66), (28, 76)], T['mount'], 2.6, only=LAND, seed=2)
line([(122, 50), (132, 58)], T['mount'], 2.2, only=LAND, seed=3)
line([(214, 112), (226, 122), (232, 136)], T['mount'], 3.0, only=LAND, seed=4)
line([(160, 140), (176, 136), (186, 130)], T['hills'], 2.5, only=LAND, seed=5)
line([(70, 22), (100, 12), (140, 8), (170, 12), (205, 6)], T['snowmount'], 3.4, only=LAND, seed=6)
line([(170, 26), (178, 30), (195, 30), (200, 22)], T['snowmount'], 2.4, only=LAND, seed=7)   # ring round Lumen
line([(120, 30), (128, 40)], T['snowmount'], 2.0, only=LAND, seed=8)
blob(96, 14, 7, 6, T['crater'], only=LAND, seed=17)                       # the Crater
blob(226, 124, 4, 4, T['lava'], only=LAND, seed=18)                       # Mount Cinder's caldera
line([(46, 116), (50, 104), (60, 92)], T['hills'], 2.0, only=LAND, seed=9)
line([(132, 92), (126, 100)], T['hills'], 2.0, only=LAND, seed=10)
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
}
# encounter regions: a coarse grid (16 x 16 tiles per cell) of encounter groups by area
REG = {}
def region(x0, y0, x1, y1, name):
    for cy in range(y0 // 16, y1 // 16 + 1):
        for cx in range(x0 // 16, x1 // 16 + 1): REG['%d,%d' % (cx, cy)] = name
region(0, 48, 143, 191, 'w_meridia_s'); region(48, 80, 95, 127, 'w_ashfields'); region(96, 48, 143, 95, 'w_meridia_n'); region(0, 112, 63, 159, 'w_mesa')
region(144, 112, 255, 191, 'w_solmara'); region(176, 128, 239, 175, 'w_desert'); region(208, 112, 239, 143, 'w_cinder')
region(0, 0, 255, 47, 'w_nordheim'); region(160, 0, 207, 39, 'w_lumen_wood')
VEHICLES = {'talon': None, 'skimmer': (190, 152), 'boat': (134, 112), 'sub': (156, 124), 'airship': (212, 146)}

def main():
    os.makedirs('build', exist_ok=True)
    flat = [g[y][x] for y in range(H) for x in range(W)]
    json.dump({'w': W, 'h': H, 't': flat, 'T': T, 'places': PLACES, 'reg': REG, 'vehicles': VEHICLES}, open('build/world.json', 'w'), separators=(',', ':'))
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
