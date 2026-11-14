"""Unique interiors: most buildings grow extra rooms, upper floors and cellars, each furnished for what it is.

Every building already had one box room. Here each one is given a plan from its role (home, shop, smithy, prism
shop, inn, clinic, school, tavern, hall, mansion) and its own seed:
  - a wing to the east (the map widens to the right, so nothing already placed moves): a bedroom, kitchen, study,
    storeroom, forge, vault, dining room, ward, classroom or gallery, joined by a doorway; its outline varies;
  - corner notches and alcoves, so the outline is not a plain box;
  - an upstairs (attic bedrooms, guest rooms, a study) or a cellar (stores, wine, a forgotten chest) as new maps
    reached by stairs;
  - furniture in every new room to suit it, and some residents with something to say.
Story rooms keep their main room untouched (scenes walk across it); they still get wings and floors.
Small generic homes vary by seed but stay modest: "some basic houses can be similar"."""
import random, re, glob, os
from _kit import *
from mapkit import Map, OPEN, SOLID, COUNTER
from _gen import put as gput, stairs
from z_towns import _reach, _keys, _keys_ok, _snap, _undo

def build(): return []

ROLES = [
    ('inn', r'inn|hotel|rest\b|anchor|kettle|salt & sun|gilded rest'), ('smithy', r'arms|forge|smithy|windsmith|sunsteel'),
    ('prism', r'prism'), ('clinic', r'clinic'), ('school', r'school'), ('tavern', r'cafe|lantern|lucky|spillway|corra'),
    ('hall', r'hall|museum|office|arcana'), ('mansion', r'mansion|residence'),
    ('shop', r'goods|store|shop|odds|supplies|chandlery|provisions|exchange|boutique|feed|junk|mound|chime'),
    ('skip', r'pit|square|track|sevens|gallery|stable|barn|hideout|tent'), ('home', r'.')]
WINGS = {'home': ['bedroom', 'kitchen', 'study', 'nursery', 'bedroom'], 'shop': ['storeroom', 'storeroom', 'office'], 'smithy': ['forge', 'storeroom'],
         'prism': ['vault', 'study'], 'inn': ['dining', 'kitchen'], 'clinic': ['ward'], 'school': ['classroom', 'library'], 'tavern': ['backroom', 'kitchen'],
         'hall': ['gallery', 'library'], 'mansion': ['gallery', 'library', 'dining']}
UPPER = {'home': 0.45, 'shop': 0.15, 'smithy': 0.0, 'prism': 0.2, 'inn': 1.0, 'clinic': 0.5, 'school': 0.3, 'tavern': 0.5, 'hall': 0.5, 'mansion': 1.0}
CELLAR = {'home': 0.25, 'shop': 0.55, 'smithy': 0.35, 'prism': 0.3, 'inn': 0.5, 'clinic': 0.0, 'school': 0.0, 'tavern': 0.7, 'hall': 0.3, 'mansion': 0.6}
FLOOR = {'bedroom': 'carpet', 'kitchen': 'tile', 'study': 'planks', 'nursery': 'carpet', 'storeroom': 'darkcobble', 'office': 'planks', 'forge': 'darkcobble',
         'vault': 'marble', 'dining': 'planks', 'ward': 'tile', 'classroom': 'planks', 'library': 'carpet', 'backroom': 'darkcobble', 'gallery': 'marble'}
LINES = {
    'inn': ['Third night here. The beds are better than the food.', 'Shh. My husband snores. Loudly.', 'I came for one night. That was a month ago.'],
    'home': ['Mind the floorboards, they creak.', 'Up here is where I keep the good blanket.', 'Grandmother lived up here. Her chair still rocks by itself.'],
    'cellar': ['Who\'s down there? Oh. Just you.', 'Cool down here. Keeps the cheese happy.'],
    'clinic': ['The nurse says I\'ll be up and walking soon.', 'Don\'t touch the green bottles.'],
    'hall': ['The archives go back four hundred years.', 'Quiet, please. People are reading.'],
    'mansion': ['The master is not receiving visitors.', 'Every portrait in this house is of the same man.'],
    'school': ['Lessons are over. I\'m only here for the books.'], 'tavern': ['Private room. Members only. ...Fine, stay.'],
}

def _arrivals():
    A = {}
    for f in glob.glob(os.path.join(os.path.dirname(__file__), '..', '..', 'src', '**', '*.js'), recursive=True):
        for mid, x, y in re.findall(r"warp\('(\w+)',\s*(\d+),\s*(\d+)", open(f).read()): A.setdefault(mid, []).append((int(x), int(y)))
    return A

def role_of(m):
    key = (m.id + ' ' + m.name).lower()
    for r, pat in ROLES:
        if re.search(pat, key): return r
    return 'home'

def widen(m, add):
    """Grow the map `add` columns to the right; new cells are wall. Nothing that exists moves."""
    W, H, W2 = m.w, m.h, m.w + add
    def grow(arr, fill):
        out = []
        for y in range(H): out += arr[y * W:(y + 1) * W] + [fill] * add
        return out
    wall = next((m.wall[m.i(m.w - 1, y)] for y in range(H) if m.wall[m.i(m.w - 1, y)]), 'wood')
    m.mat = grow(m.mat, m.under); m.wall = grow(m.wall, wall); m.col = grow(m.col, SOLID)
    for k in m.layers: m.layers[k] = grow(m.layers[k], -1)
    m.w = W2
    return wall

def plain(m, x, y):
    if not m.ok(x, y): return False
    i = m.i(x, y); return m.wall[i] is None and m.col[i] == OPEN and m.layers['deco'][i] < 0 and m.layers['over'][i] < 0

def try_place(m, K, busy, cells, fn):
    if not all(plain(m, a, b) and (a, b) not in busy for (a, b) in cells): return False
    sn = _snap(m, cells); fn()
    if not _keys_ok(m, K): _undo(m, sn); return False
    return True

def furnish(m, kind, x0, y0, x1, y1, r, K, busy):
    """Fill a room (inclusive floor box) with things that make it that room."""
    def along_top(fns, gap=1):
        x = x0
        while x <= x1 - 1:
            f, w, h = r.choice(fns)
            if x + w - 1 <= x1: try_place(m, K, busy, [(x + k, y0 + j) for k in range(w) for j in range(max(2, h))], lambda f=f, x=x: f(m, x, y0))
            x += w + gap
    def scatter(fns, n, edge=True):
        for _ in range(n * 4):
            if n <= 0: break
            f, w, h = r.choice(fns)
            x = r.randint(x0, max(x0, x1 - w + 1)); y = r.randint(y0, max(y0, y1 - h + 1))
            if edge and not (x in (x0, x1 - w + 1) or y in (y0, y1 - h + 1)): continue
            if try_place(m, K, busy, [(x + k, y + j) for k in range(w) for j in range(h)], lambda f=f, x=x, y=y: f(m, x, y)): n -= 1
    B = lambda c: (lambda mm, x, y: bed(mm, x, y, c))
    tbl = (table, 3, 1); bk = (bookcase, 2, 2); dr = (drawers, 2, 2); sh = (shelf, 2, 2); pl = (plant, 1, 1); pt = (pots, 1, 1); br = (barrel, 1, 1); cr = (crate, 1, 1)
    def gp(kind_):
        return lambda mm, x, y: gput(mm, kind_, x, y, check=False)
    if kind in ('bedroom', 'nursery'):
        scatter([(B(r.randint(0, 2)), 1, 2)], 2 if kind == 'bedroom' else 3); scatter([dr, pl, pt], 2)
        rug(m, (x0 + x1) // 2 - 1, (y0 + y1) // 2, 3, 2) if x1 - x0 > 4 else None
    elif kind == 'kitchen': along_top([sh, dr]); scatter([br, pt, cr], 3); scatter([tbl], 1, edge=False)
    elif kind in ('study', 'library', 'office'): along_top([bk, bk, sh]); scatter([tbl], 1, edge=False); scatter([pl], 1)
    elif kind in ('storeroom', 'backroom'): scatter([br, cr, cr, br], 7); along_top([sh])
    elif kind == 'forge': scatter([br, cr], 3); along_top([(lambda mm, x, y: lamp(mm, x, y), 1, 1)], 2)
    elif kind == 'vault': scatter([(gp('crystal_s'), 1, 1)], 5); along_top([sh])
    elif kind == 'dining': scatter([tbl, tbl], 3, edge=False); scatter([pl, pt], 2)
    elif kind == 'ward': scatter([(B(2), 1, 2)], 4); scatter([pt], 1)
    elif kind == 'classroom': scatter([tbl], 4, edge=False); along_top([bk])
    elif kind == 'gallery': scatter([(gp('statue'), 2, 2), (gp('urn'), 1, 1), pl], 4); rug(m, x0 + 1, (y0 + y1) // 2, max(2, x1 - x0 - 1), 1)
    elif kind == 'cellar': scatter([br, br, cr, cr], 8)
    elif kind == 'guest': scatter([(B(r.randint(0, 2)), 1, 2)], 4); scatter([dr, pl], 2)
    elif kind == 'attic': scatter([(B(r.randint(0, 2)), 1, 2)], 1); scatter([cr, br, dr], 3)

def add_floor(M, m, role, kind, r, K, busy, rooms):
    """A new map upstairs or in the cellar, reached by stairs placed in one of the rooms of m."""
    nid = m.id + ('_up' if kind != 'cellar' else '_cellar')
    if nid in M: return
    # where the stairs go: a free floor cell in the top row of a room, with free floor below it
    spots = []
    for (x0, y0, x1, y1) in rooms:
        for x in range(x0, x1 + 1):
            if plain(m, x, y0) and plain(m, x, y0 + 1) and (x, y0) not in busy and (x, y0 + 1) not in busy: spots.append((x, y0))
    if not spots: return
    sx, sy = r.choice(spots)
    w, h = r.randint(10, 14), r.randint(9, 11)
    floor = 'darkcobble' if kind == 'cellar' else m.under if m.under in ('planks', 'carpet', 'tile', 'marble') else 'planks'
    wall = 'brick' if kind == 'cellar' else next((m.wall[m.i(0, y)] for y in range(m.h) if m.wall[m.i(0, y)]), 'wood')
    nm = m.name + (' - Cellar' if kind == 'cellar' else ' - Upstairs')
    n = Map(nid, w, h, nm, music=m.music, kind='house', dark=1 if kind == 'cellar' else 0); n.under = floor
    room(n, 0, 0, w - 1, h - 1, floor=floor, wall=wall, thick=3)
    tx, ty = r.randint(2, w - 3), 3
    stairs(n, tx, ty, m.id, sx, sy + 1, kind != 'cellar'); n.entry = [tx, ty + 1]
    sn = _snap(m, [(sx, sy)]); stairs(m, sx, sy, nid, tx, ty + 1, kind == 'cellar')
    if not _keys_ok(m, K): _undo(m, sn); m.warps = [w_ for w_ in m.warps if not (w_['x'] == sx and w_['y'] == sy)]; return
    # an inner wall in bigger upper floors: two rooms
    if kind != 'cellar' and w >= 12 and r.random() < 0.6:
        px = r.choice([x for x in range(5, w - 5) if abs(x - tx) > 1] or [w - 5]); n.walls(wall, px, 3, px, h - 2)
        gy = r.randint(4, h - 3); n.wall[n.i(px, gy)] = None; n.ground(floor, px, gy, px, gy)
    nK = _keys(n) + [tuple(n.entry)]; nb = {(tx + a, ty + b) for a in (-1, 0, 1) for b in (0, 1, 2)}
    sub = {'cellar': 'cellar', 'guest': 'guest', 'attic': 'attic', 'study': 'study'}[kind]
    furnish(n, sub, 1, 3, w - 2, h - 2, r, nK, nb)
    if kind == 'cellar' and r.random() < 0.7:
        for _ in range(30):
            x, y = r.randint(1, w - 2), r.randint(3, h - 2)
            seen = _reach(n)
            if plain(n, x, y) and (x, y) not in nb and seen is not None and any(n.ok(x + a, y + b) and seen[n.i(x + a, y + b)] for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                sn = _snap(n, [(x, y)]); n.setcol(x, y, SOLID)
                if _keys_ok(n, nK): _undo(n, sn); n.chest(x, y, r.choice(['potion', 'ether', 'hi_potion', 'phoenix_down', 'antidote', 'elixir']), 1); break
                _undo(n, sn)
    pool = LINES.get('cellar' if kind == 'cellar' else role, LINES['home'])
    if r.random() < (0.3 if kind == 'cellar' else 0.75):
        seen = _reach(n)
        for _ in range(30):
            x, y = r.randint(1, w - 2), r.randint(4, h - 2)
            if plain(n, x, y) and (x, y) not in nb and seen is not None and seen[n.i(x, y)]:
                n.npc(x, y, r.choice(['Villager', 'Villager2', 'Villager3', 'Woman', 'OldMan', 'OldWoman']), name='RESIDENT' if role == 'home' else 'GUEST' if role == 'inn' else 'LODGER', walk=1, say=[r.choice(pool), r.choice(pool)])
                break
    M[nid] = n

def redo(M, m, arrivals):
    r = random.Random(sum(map(ord, m.id)) * 7 + 3); role = role_of(m)
    if role == 'skip': return
    story = any(e['id'] not in ('savepoint',) for e in m.events) or m.id in arrivals
    K = _keys(m) + [tuple(m.entry)] + arrivals.get(m.id, [])
    busy = set()
    for (x, y) in K:
        for a in range(-1, 2):
            for b in range(-1, 2): busy.add((x + a, y + b))
    if not _keys_ok(m, K): return
    thick = next((y for y in range(m.h) if m.wall[m.i(m.w // 2, y)] is None), 3)
    rooms = [(1, thick, m.w - 2, m.h - 2)]
    # 1. a wing to the east (most buildings; small homes about half the time)
    generic = m.name == 'A Home'
    if not (generic and r.random() < 0.45):
        add = r.randint(6, 10) if m.w <= 14 else r.randint(8, 12)
        oldw = m.w; wall = widen(m, add)
        top = thick + (r.choice([0, 0, 1, 2, 3]) if m.h > 10 else r.choice([0, 1]))
        bot = m.h - 2 - (r.choice([0, 0, 1, 2]) if m.h > 10 else 0)
        kind = r.choice(WINGS.get(role, WINGS['home']))
        x0, x1 = oldw, m.w - 2
        if top > thick: m.walls(wall, x0, thick, x1, top - 1)
        m.ground(FLOOR.get(kind, m.under), x0, top, x1, bot)
        for y in range(top, bot + 1): m.wall[m.i(x0 - 1, y)] = wall; m.col[m.i(x0 - 1, y)] = SOLID
        # the doorway through the old east wall (two cells tall where it can be)
        ys = [y for y in range(max(top, thick + 1), bot + 1) if plain(m, x0 - 2, y) and (x0 - 2, y) not in busy]
        if not ys: ys = [y for y in range(top, bot + 1) if m.col[m.i(x0 - 2, y)] == OPEN]
        if ys:
            gy = r.choice(ys)
            for y in (gy, gy + 1) if gy + 1 <= bot and m.col[m.i(x0 - 2, gy + 1)] == OPEN else (gy,):
                m.wall[m.i(x0 - 1, y)] = None; m.ground(FLOOR.get(kind, m.under), x0 - 1, y, x0 - 1, y)
            busy |= {(x0 - 2, gy), (x0, gy), (x0 - 2, gy + 1), (x0, gy + 1)}
            furnish(m, kind, x0, top, x1, bot, r, K, busy); rooms.append((x0, top, x1, bot))
        else:   # no way in: give the columns back as wall
            m.walls(wall, x0, 0, x1, m.h - 1)
    # 2. notches: fill a top corner of the main room so the outline is not a box (not in story rooms)
    if not story and m.w > 10 and r.random() < 0.7:
        cw, ch = r.randint(2, 3), r.randint(1, 2)
        cx = 1 if r.random() < 0.5 else rooms[0][2] - cw + 1
        cells = [(cx + a, thick + b) for a in range(cw) for b in range(ch)]
        wall_m = next((m.wall[m.i(0, y)] for y in range(m.h) if m.wall[m.i(0, y)]), 'wood')
        try_place(m, K, busy, cells, lambda: m.walls(wall_m, cells[0][0], thick, cells[-1][0], thick + ch - 1))
    # 3. main room touch-ups (not story rooms): a rug and a plant or two
    if not story:
        x0, y0, x1, y1 = rooms[0]
        if r.random() < 0.6:
            rx, ry = (x0 + x1) // 2 - 1, (y0 + y1) // 2
            if all(plain(m, rx + a, ry + b) for a in range(3) for b in range(2)): rug(m, rx, ry, 3, 2)
        for _ in range(r.randint(1, 3)):
            x, y = r.choice([(x0, y1), (x1, y1), (x0, y0 + 2), (x1, y0 + 2)])
            try_place(m, K, busy, [(x, y)], lambda x=x, y=y: (plant if r.random() < 0.5 else pots)(m, x, y))
    # 4. upstairs and cellars
    if r.random() < UPPER.get(role, 0) * (0.6 if generic else 1):
        add_floor(M, m, role, 'guest' if role == 'inn' else 'study' if role in ('hall', 'mansion') else 'attic' if r.random() < 0.4 else 'guest' if role == 'clinic' else 'attic', r, K, busy, rooms)
    if r.random() < CELLAR.get(role, 0) * (0.6 if generic else 1):
        add_floor(M, m, role, 'cellar', r, K, busy, rooms)

def patch(maps):
    A = _arrivals()
    for k in sorted(list(maps.keys())):
        m = maps[k]
        if m.kind == 'house' and not k.endswith('_up') and not k.endswith('_cellar'): redo(maps, m, A)
