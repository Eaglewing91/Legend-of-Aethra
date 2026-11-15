"""Who can reach what on the world map. Simulates each way of travelling (on foot, Talonbird, boat, sub, airship,
Gold Talonbird) and checks every story place is reachable the way the story expects, and that the gated ones are not
reachable too early."""
import json, sys
from collections import deque
D = json.load(open('build/world.json')); W, H, t = D['w'], D['h'], D['t']; P = D['places']
FOOT = {2, 3, 4, 5, 7, 8, 10, 11, 13, 14, 15, 18, 19, 21}
WALK = {'foot': FOOT, 'talon': FOOT | {12}, 'boat': {0, 1, 12}, 'sub': {0, 1, 22}, 'gtalon': set(range(23)) - {16, 22}}
LAND = {'airship': {2, 3, 5, 7, 8, 11, 13, 19, 21}, 'boat': {2}}
def at(x, y): return t[y * W + x] if 0 <= x < W and 0 <= y < H else -1
def flood(starts, ok):
    seen = set(s for s in starts if at(*s) in ok); q = deque(seen)
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (x + dx, y + dy)
            if n not in seen and at(*n) in ok: seen.add(n); q.append(n)
    return seen
def near(p, r=1): return [(p[0] + dx, p[1] + dy) for dx in range(-r, r + 1) for dy in range(-r, r + 1)]
def place_in(k, cells): return (P[k][0], P[k][1]) in cells
def foot_from(cells):   # get out of a vehicle anywhere in cells onto foot ground next to it
    return flood([n for c in cells for n in near(c)], FOOT)
res = {}
home = flood([(P['halcyon'][0], P['halcyon'][1])], FOOT)
talon = flood(list(home), WALK['talon']); talon_foot = foot_from(talon) | talon
sol = flood([(P['saltmere'][0], P['saltmere'][1])], FOOT)
V = D['vehicles']
boat_sea = flood(near(tuple(V['boat'])), WALK['boat']); boat_land = foot_from([c for c in boat_sea]) & {c for c in boat_sea for c in near(c)} ; boat_land = flood([c for c in boat_land if at(*c) in LAND['boat']], FOOT)
sub_sea = flood(near(tuple(V['sub'])), WALK['sub'])
air = flood([c for c in ((x, y) for y in range(1, H - 1) for x in range(1, W - 1)) if at(*c) in LAND['airship']], FOOT)
gt = flood(list(home), WALK['gtalon'])
problems = []
def need(k, cells, how):
    if not place_in(k, cells): problems.append('%s should be reachable %s' % (k, how))
def deny(k, cells, how):
    if place_in(k, cells): problems.append('%s should NOT be reachable %s' % (k, how))
for k in ('thornbrook', 'kestrel', 'mistwood', 'oldmine', 'windhaven', 'gilded', 'portlark', 'camp', 'academy', 'mideel'): need(k, home, 'on foot from Halcyon')
for k in ('saltmere', 'sunscar', 'frostgate', 'crater', 'lumen', 'abyss', 'deeproot', 'outpost', 'skyruins'): deny(k, talon_foot, 'from Halcyon by Talonbird')
for k in ('sunscar', 'sunruins', 'orin', 'dunewreck', 'cinder', 'refinery', 'smugglers'): need(k, sol, 'on foot from Saltmere')
if (P['coral'][0], P['coral'][1]) not in sub_sea: problems.append('coral trench not reachable by sub')
for k in ('frostgate', 'deeproot', 'outpost', 'abyss', 'talon_isle', 'trial_gale', 'trial_frost', 'trial_storm', 'wreck_isle', 'skyruins', 'lumen'): need(k, air, 'by airship')
for k in ('crater', 'skyruins', 'lumen'): deny(k, boat_land | talon_foot, 'by boat or Talonbird')
for k in ('falls', 'graveyard'): need(k, home, 'on foot from Halcyon')
for k in ('oasis', 'hidden_cove'): need(k, sol, 'on foot from Saltmere')
for k in ('peak', 'star_cabin'): need(k, air, 'by airship')
deny('peak', boat_land | talon_foot, 'by boat or Talonbird')
if (P['deep_ruin'][0], P['deep_ruin'][1]) not in sub_sea or at(P['deep_ruin'][0], P['deep_ruin'][1]) != 22: problems.append('deep_ruin not a deep tile the sub can reach')
deny('vault', air | boat_land | talon_foot, 'except by Gold Talonbird'); need('vault', gt, 'by Gold Talonbird')
for k in ('chapel', 'hermit'): deny(k, air | boat_land, 'except by Gold Talonbird'); need(k, gt, 'by Gold Talonbird')
for v, (x, y) in [(k, v) for k, v in D['vehicles'].items() if v]:
    if at(x, y) not in FOOT: problems.append('vehicle %s at %s is not on dry land' % (v, (x, y)))
    if v in ('boat', 'sub') and not any(at(*c) in WALK[v] for c in near((x, y))): problems.append('vehicle %s at %s has no water' % (v, (x, y)))
for k, p in P.items():
    if at(p[0], p[1]) not in FOOT and k not in ('coral', 'crater', 'deep_ruin'): problems.append('%s sits on terrain %d' % (k, at(p[0], p[1])))
print('\n'.join(problems) or 'world OK'); sys.exit(1 if problems else 0)
