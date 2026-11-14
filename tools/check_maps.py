"""Check every map in build/maps.json: from the entry (and from every arrival point of a warp into the map), can you reach
every warp, chest, NPC and event? Story gates (variants) count as open. Prints problems; exit code 1 if any."""
import json, sys
from collections import deque
M = json.load(open('build/maps.json'))
WALK = {0, 6, 8}          # OPEN, STAIR, SHALLOW
bad = 0
arrivals = {k: [tuple(m['entry'])] for k, m in M.items()}
for k, m in M.items():
    for w in m['warps']:
        if w['to'] in M: arrivals[w['to']].append((w['tx'], w['ty']))
for k, m in M.items():
    W, H = m['w'], m['h']; col = m['col'][:]
    for v in m.get('variants', []):
        for i, c in v.get('col', []): col[i] = c
    ok = lambda x, y: 0 <= x < W and 0 <= y < H and col[y * W + x] in WALK
    seen = set(); dq = deque()
    for (x, y) in arrivals[k]:
        if 0 <= x < W and 0 <= y < H: seen.add((x, y)); dq.append((x, y))
        else: print('%s: arrival (%d,%d) off the map' % (k, x, y)); bad += 1
    for (x, y) in arrivals[k]:
        if 0 <= x < W and 0 <= y < H and col[y * W + x] not in WALK: print('%s: arrival (%d,%d) is blocked (col %d)' % (k, x, y, col[y * W + x])); bad += 1
    while dq:
        x, y = dq.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            p = (x + dx, y + dy)
            if p not in seen and ok(*p): seen.add(p); dq.append(p)
    near = lambda x, y: (x, y) in seen or any((x + dx, y + dy) in seen for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
    for w in m['warps']:
        if (w['x'], w['y']) not in seen and not near(w['x'], w['y']): print('%s: warp to %s at (%d,%d) unreachable' % (k, w['to'], w['x'], w['y'])); bad += 1
    for c, ch in m['chests'].items():
        x, y = map(int, c.split(','))
        if not near(x, y): print('%s: chest %s at (%d,%d) unreachable' % (k, ch['item'], x, y)); bad += 1
    for n in m['npcs']:
        if not near(n['x'], n['y']): print('%s: npc %s at (%d,%d) unreachable' % (k, n.get('name') or n['who'], n['x'], n['y'])); bad += 1
    for e in m['events']:
        if not any(near(x, y) for x in range(e['x'], e['x'] + e['w']) for y in range(e['y'], e['y'] + e['h'])): print('%s: event %s at (%d,%d) unreachable' % (k, e['id'], e['x'], e['y'])); bad += 1
print('checked %d maps, %d problems' % (len(M), bad))
sys.exit(1 if bad else 0)
