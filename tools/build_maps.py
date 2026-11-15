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
    arr = {}; arrsrc = {}
    for m in maps.values():
        for w in m.warps:
            if w['to'] in maps: arr.setdefault(w['to'], []).append((w['tx'], w['ty'])); arrsrc.setdefault(w['to'], []).append((m.id, w['tx'], w['ty']))
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
        def reach(st=None):
            seen = set(); q = deque()
            for (x, y) in (st if st is not None else starts):
                if 0 <= x < W and 0 <= y < H and col[y * W + x] in (0, 6, 8): seen.add((x, y)); q.append((x, y))
            while q:
                x, y = q.popleft()
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    X, Y = x + dx, y + dy
                    if 0 <= X < W and 0 <= Y < H and (X, Y) not in seen and col[Y * W + X] in (0, 6, 8): seen.add((X, Y)); q.append((X, Y))
            return seen
        wset = {(w['x'], w['y']) for w in d['warps']}
        tset = {(e['x'] + i, e['y'] + j) for e in d['events'] if e['touch'] for i in range(e['w']) for j in range(e['h'])}
        # doors, stairs and step-on events must be stood on; everything else only needs a tile beside it
        def score0(seen): return sum(1 for (x, y) in keep if (x, y) not in wset and ((x, y) in seen or ((x, y) not in tset and any((x + dx, y + dy) in seen for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))))))
        # a door or stairs counts only if you can walk onto it without arriving through it (from the map it leads to)
        scripted = [p for p in arr.get(k, []) if p not in [(a[1], a[2]) for a in arrsrc.get(k, [])]]
        dests = sorted({w['to'] for w in d['warps']})
        def score(seen):
            n = score0(seen)
            for T in dests:
                st = [tuple(d['entry'])] + scripted + [(a[1], a[2]) for a in arrsrc.get(k, []) if a[0] != T]
                sT = reach(st); n += sum(1 for w in d['warps'] if w['to'] == T and (w['x'], w['y']) in sT)
            return n
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
    # a chest, a person or something to examine whose only way to it has a prop drawn on it (it looks blocked):
    # take that prop away so the way in is plain floor
    cleared = 0; moved = 0
    for k, d in out.items():
        W, H, col, L = d['w'], d['h'], d['col'], d['layers']
        chests = d['chests'] if isinstance(d['chests'], dict) else {}
        npcs = d['npcs'].values() if isinstance(d['npcs'], dict) else d['npcs']
        tg = [tuple(map(int, c.split(','))) for c in chests] + [(n['x'], n['y']) for n in npcs if not n.get('walk')]
        tg += [(e['x'], e['y']) for e in d['events'] if not e['touch'] and e['w'] == 1 and e['h'] == 1 and col[e['y'] * W + e['x']] not in (0, 6, 8)]
        warps = {(w['x'], w['y']) for w in d['warps']}
        # a chest you could only open by standing on stairs or a door: move it to the nearest free floor
        for ck in list(chests):
            x, y = map(int, ck.split(','))
            nb = [(x + dx, y + dy) for dx, dy in ((0, 1), (1, 0), (-1, 0), (0, -1)) if 0 <= x + dx < W and 0 <= y + dy < H and col[(y + dy) * W + x + dx] in (0, 6, 8)]
            if not nb or any(p not in warps for p in nb): continue
            taken = set(tg) | warps | {(e['x'], e['y']) for e in d['events']}
            from collections import deque as _dq
            seen = {nb[0]}; q = _dq([nb[0]]); spot = None
            while q and not spot:
                cx_, cy_ = q.popleft()
                for dx, dy in ((0, 1), (1, 0), (-1, 0), (0, -1)):
                    X, Y = cx_ + dx, cy_ + dy
                    if not (0 <= X < W and 0 <= Y < H) or (X, Y) in seen or col[Y * W + X] not in (0, 6, 8): continue
                    seen.add((X, Y)); q.append((X, Y))
                    if (X, Y) in taken or L['deco'][Y * W + X] >= 0 or L['over'][Y * W + X] >= 0: continue
                    # against a wall, with open floor in front, and not in a 1-wide way through
                    if Y > 0 and col[(Y - 1) * W + X] == 1 and Y + 1 < H and col[(Y + 1) * W + X] in (0, 6, 8) and (Y + 1, X) and (X - 1 >= 0 and col[Y * W + X - 1] in (0, 6, 8) or X + 1 < W and col[Y * W + X + 1] in (0, 6, 8)):
                        spot = (X, Y); break
            if spot:
                v = chests.pop(ck); chests['%d,%d' % spot] = v; col[spot[1] * W + spot[0]] = 1; col[y * W + x] = 0; moved += 1
                tg = [t for t in tg if t != (x, y)] + [spot]
        for (x, y) in tg:
            nb = [(x + dx, y + dy) for dx, dy in ((0, 1), (1, 0), (-1, 0), (0, -1)) if 0 <= x + dx < W and 0 <= y + dy < H and col[(y + dy) * W + x + dx] in (0, 6, 8) and (x + dx, y + dy) not in warps]
            if not nb or any(L['deco'][Y * W + X] < 0 and L['over'][Y * W + X] < 0 for X, Y in nb): continue
            X, Y = nb[0]; L['deco'][Y * W + X] = -1; L['over'][Y * W + X] = -1
            for j in range(1, 4):   # the rest of a tall prop below it
                t = (Y + j) * W + X
                if Y + j >= H or col[t] != 1 or L['deco'][t] < 0: break
                L['deco'][t] = -1; L['over'][t] = -1; col[t] = 0
            cleared += 1
    # doors and stairs you could never walk to (a prop stands in the only doorway): take that prop away
    opened = 0
    for k, d in out.items():
        W, H, col, L = d['w'], d['h'], d['col'], d['layers']
        scripted = [p for p in arr.get(k, []) if p not in [(a[1], a[2]) for a in arrsrc.get(k, [])]]
        def reach2(st):
            seen = set(); q = deque()
            for (x, y) in st:
                if 0 <= x < W and 0 <= y < H and col[y * W + x] in (0, 6, 8): seen.add((x, y)); q.append((x, y))
            while q:
                x, y = q.popleft()
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    X, Y = x + dx, y + dy
                    if 0 <= X < W and 0 <= Y < H and (X, Y) not in seen and col[Y * W + X] in (0, 6, 8): seen.add((X, Y)); q.append((X, Y))
            return seen
        for w in d['warps']:
            st = [tuple(d['entry'])] + scripted + [(a[1], a[2]) for a in arrsrc.get(k, []) if a[0] != w['to']]
            if (w['x'], w['y']) in reach2(st): continue
            def lone(i): return not any(0 <= i + o < W * H and col[i + o] == 1 and L['deco'][i + o] >= 0 and L['wall'][i + o] < 0 for o in (-1, 1))
            cands = sorted([i for i in range(W * H) if col[i] == 1 and L['wall'][i] < 0], key=lambda i: (not lone(i), i))
            for i in cands:
                col[i] = 0
                if (w['x'], w['y']) in reach2(st):
                    L['deco'][i] = -1; L['over'][i] = -1; opened += 1
                    for dy in (-1, 1):   # the rest of a tall prop (a bed, a shelf) in the same column
                        for j in range(1, 4):
                            t = i + dy * j * W
                            if not (0 <= t < W * H) or L['wall'][t] >= 0 or (L['deco'][t] < 0 and L['over'][t] < 0) or col[t] not in (0, 1): break
                            if col[t] == 0 and L['over'][t] >= 0: L['over'][t] = -1; break
                            if col[t] != 1: break
                            L['deco'][t] = -1; L['over'][t] = -1; col[t] = 0
                    break
                col[i] = 1
    print('props taken out of doorways: %d' % opened)
    # fewer chests (FF7 hands out far less): at most one chest of consumables or gold per map (the most valuable is
    # kept), and only a few of the rarest items in the whole game (the latest ones are kept)
    COMMON = {'potion', 'hi_potion', 'ether', 'antidote', 'eye_drops', 'echo_screen', 'grenade', 'phoenix_down', 'remedy', 'glowcap', 'soft',
              'maiden_kiss', 'tranquilizer', 'hyper', 'gold', 'tent', 'x_potion', 'elixir', 'megalixir', 'turbo_ether'}
    CAP = {'megalixir': 4, 'elixir': 8, 'x_potion': 8, 'turbo_ether': 5, 'ribbon': 1}
    VAL = {'megalixir': 9, 'elixir': 8, 'turbo_ether': 7, 'x_potion': 6, 'gold': 5, 'tent': 4, 'ether': 4, 'hi_potion': 3, 'phoenix_down': 3, 'remedy': 3}
    order = list(out); drop = set()
    for k in order:
        ch = out[k]['chests'] if isinstance(out[k]['chests'], dict) else {}
        com = sorted([c for c, v in ch.items() if v['item'] in COMMON], key=lambda c: (-VAL.get(ch[c]['item'], 1), c))
        for c in com[1:]: drop.add((k, c))
    seen_cap = {}
    for k in reversed(order):
        ch = out[k]['chests'] if isinstance(out[k]['chests'], dict) else {}
        for c in sorted(ch):
            it = ch[c]['item']
            if (k, c) in drop or it not in CAP: continue
            seen_cap[it] = seen_cap.get(it, 0) + 1
            if seen_cap[it] > CAP[it]: drop.add((k, c))
    for k, c in drop:
        d = out[k]; x, y = map(int, c.split(',')); del d['chests'][c]; d['col'][y * d['w'] + x] = 0
    print('chests removed: %d' % len(drop))
    print('prop tops made solid: %d, props removed from paths: %d, props cleared from the way to chests/people: %d, chests moved off stairs: %d' % (fixed, removed, cleared, moved))
    os.makedirs('build', exist_ok=True)
    json.dump(out, open('build/maps.json', 'w'), separators=(',', ':'))
    if '--fast' not in sys.argv or not os.path.exists(os.path.join(MK.GEN, 'walls.png')):
        MK.build_fills(); MK.build_walls()
    MK.build_ground()
    print('maps: %d maps, %d ground pairs' % (len(maps), len(MK.PAIRS)))

if __name__ == '__main__':
    main()
