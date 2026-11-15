"""Minigame hosts placed in towns: the slope keeper in Frostgate, the sub captain in Saltmere (after z_towns)."""
from mapkit import OPEN

def build(): return []

def _spot(m, near):
    from z_towns import _reach
    seen = _reach(m); best = None
    for y in range(2, m.h - 2):
        for x in range(2, m.w - 2):
            i = m.i(x, y)
            if m.col[i] != OPEN or m.wall[i] is not None or m.layers['deco'][i] >= 0 or (seen is not None and not seen[i]): continue
            if any(abs(e['x'] - x) < 2 and abs(e['y'] - y) < 2 for L in (m.npcs, m.warps, m.events) for e in L): continue
            d = (x - near[0]) ** 2 + (y - near[1]) ** 2
            if best is None or d < best[0]: best = (d, x, y)
    return best[1], best[2]

def patch(maps):
    if 'frostgate' in maps:
        m = maps['frostgate']; x, y = _spot(m, (m.w // 2 + 6, 8)); m.npc(x, y, 'Hunter', name='SLOPE KEEPER', ev='mg_snow', still=1, dir=2)
    if 'saltmere' in maps:
        m = maps['saltmere']; x, y = _spot(m, (m.w // 2 - 6, 10)); m.npc(x, y, 'OldMan', name='SUB CAPTAIN', ev='mg_sub', still=1, dir=2)

    # travellers in the inns trade rumours of secret places
    for iid in ('th_inn', 'pl_inn', 'ss_inn', 'fg_inn', 'lm_inn', 'sumps_inn', 'wh_inn', 'sm_inn'):
        if iid in maps:
            m = maps[iid]; x, y = _spot(m, (m.w - 3, m.h - 3)); m.npc(x, y, 'Hunter', name='TRAVELLER', ev='sc_rumours', walk=1)
