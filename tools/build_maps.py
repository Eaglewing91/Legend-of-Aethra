"""Build every map: each module in tools/maps/ has build() returning a list of mapkit.Map. Writes build/maps.json and
the generated tile sheets (ground transitions, walls, fills)."""
import glob, importlib, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'maps'))
import mapkit as MK

def main():
    maps = {}; mods = []
    for f in sorted(glob.glob(os.path.join(os.path.dirname(__file__), 'maps', '*.py'))):
        name = os.path.basename(f)[:-3]
        if name.startswith('_'): continue
        mod = importlib.import_module(name)
        mods.append(mod)
        for m in mod.build():
            if m.id in maps: raise SystemExit('duplicate map id ' + m.id)
            maps[m.id] = m
    # modules may add to other modules' maps (more people, more events) before the tiles are made
    for mod in mods:
        if hasattr(mod, 'patch'): mod.patch(maps)
    # shaped rooms: make sure every spot something stands on or arrives at is floor
    import re, _gen
    arr = {}
    for m in maps.values():
        for w in m.warps:
            if w['to'] in maps: arr.setdefault(w['to'], []).append((w['tx'], w['ty']))
    for f in glob.glob(os.path.join(os.path.dirname(__file__), '..', 'src', '**', '*.js'), recursive=True):
        for mid, x, y in re.findall(r"warp\('(\w+)',\s*(\d+),\s*(\d+)", open(f).read()): arr.setdefault(mid, []).append((int(x), int(y)))
    for m in maps.values():
        if not getattr(m, '_genrooms', None): continue
        pts = arr.get(m.id, []) + [tuple(m.entry)] if m.entry else arr.get(m.id, [])
        for L in (m.events, m.npcs, m.warps):
            for e in L:
                for k in range(e.get('w', 1)):
                    for j in range(e.get('h', 1)): pts.append((e['x'] + k, e['y'] + j))
        pts += [tuple(map(int, k.split(','))) if isinstance(k, str) else k for k in m.chests]
        _gen.open_spots(m, pts)
    # no half trees: a tree cut by a map edge, a doorway or an exit is removed (a bush goes where it stood)
    import check_cuts as CC
    for m in maps.values(): CC.prune(m)
    for m in maps.values(): m.finish()
    # a warp to (0, 0) means "the target's entry point"
    for m in maps.values():
        for w in m.warps:
            if w['to'] in maps and w['tx'] == 0 and w['ty'] == 0: w['tx'], w['ty'] = maps[w['to']].entry
    # check warps point somewhere real
    for m in maps.values():
        for w in m.warps:
            if w['to'] != '@world' and w['to'] not in maps: print('warning: %s warp to missing map %s' % (m.id, w['to']))
    out = {k: m.json() for k, m in maps.items()}
    # indoors: the top of a tall prop (a pipe, a shelf, a cabinet) standing against the wall is drawn over the floor
    # tile above it. Walking onto that tile looks like standing inside the prop, so it is made solid, unless that
    # would cut off a door, an event, a person or a chest.
    from collections import deque
    fixed = 0; removed = 0
    for k, d in out.items():
        if d.get('kind') == 'town': continue
        W, H, col, L = d['w'], d['h'], d['col'], d['layers']
        keep = set(); 
        for e in d['events']:
            for i in range(e['w']):
                for j in range(e['h']): keep.add((e['x'] + i, e['y'] + j))
        npcs = d['npcs'].values() if isinstance(d['npcs'], dict) else d['npcs']
        for n in npcs: keep.add((n['x'], n['y']))
        for w in d['warps']: keep.add((w['x'], w['y']))
        chests = d['chests'] if isinstance(d['chests'], dict) else {}
        for ck in chests: keep.add(tuple(map(int, ck.split(','))))
        starts = [tuple(d['entry'])] + arr.get(k, [])
        keep |= set(starts)
        cand = [i for i in range(W * H) if col[i] == 0 and L['over'][i] >= 0 and i + W < W * H and col[i + W] == 1 and L['deco'][i + W] >= 0
                and i - W >= 0 and col[i - W] == 1 and L['deco'][i - W] < 0 and (i % W, i // W) not in keep]
        if not cand: continue
        def reach():
            seen = set(); q = deque()
            for (x, y) in starts:
                if 0 <= x < W and 0 <= y < H and col[y * W + x] in (0, 6, 8): seen.add((x, y)); q.append((x, y))
            while q:
                x, y = q.popleft()
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    X, Y = x + dx, y + dy
                    if 0 <= X < W and 0 <= Y < H and (X, Y) not in seen and col[Y * W + X] in (0, 6, 8): seen.add((X, Y)); q.append((X, Y))
            return seen
        def score(seen): return sum(1 for (x, y) in keep if (x, y) in seen or any((x + dx, y + dy) in seen for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))))
        base = score(reach())
        for i in cand:
            col[i] = 1
            if score(reach()) < base: col[i] = 0
            else: fixed += 1
        # the ones that had to stay open are the only way through: take that prop away instead
        for i in cand:
            if col[i] != 0 or L['over'][i] < 0: continue
            x, y = i % W, i // W; xs = [x]
            for dx in (-1, 1):
                X = x + dx
                while 0 <= X < W and L['over'][y * W + X] >= 0 and L['deco'][(y + 1) * W + X] >= 0: xs.append(X); X += dx
            for X in xs:
                L['over'][y * W + X] = -1; col[y * W + X] = 0
                for j in range(1, 5):
                    t = (y + j) * W + X
                    if y + j >= H or L['deco'][t] < 0 or col[t] != 1: break
                    L['deco'][t] = -1; col[t] = 0
            removed += 1
    print('prop tops made solid: %d, props removed from paths: %d' % (fixed, removed))
    os.makedirs('build', exist_ok=True)
    json.dump(out, open('build/maps.json', 'w'), separators=(',', ':'))
    if '--fast' not in sys.argv or not os.path.exists(os.path.join(MK.GEN, 'walls.png')):
        MK.build_fills(); MK.build_walls()
    MK.build_ground()
    print('maps: %d maps, %d ground pairs' % (len(maps), len(MK.PAIRS)))

if __name__ == '__main__':
    main()
