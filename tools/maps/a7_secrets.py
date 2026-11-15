"""Secret places: hidden on every map until you find them.

The four legendary Prism caves, one for each way of travelling (FF7's Knights of the Round, four times over):
  Veiled Falls (on foot, behind a waterfall in north-west Meridia) - the Mega All Prism
  Kingsrest Hollow (Gold Talonbird, a valley sealed by cliffs in the far west) - the Oath of Kings Echo
  Drowned Archive (submersible, a hole in the south-western sea floor) - the Quadracast Prism
  Skyward Peak (airship, a snow summit in eastern Nordheim) - the Overdrive Prism
Smaller secrets: Moonwell Oasis (only there at night), the Forgotten Graves, Rumrunners' Cove, the Stargazer's Cabin,
and the ghost ship (a world-map event at sea, at night, by boat)."""
from _kit import *
from _gen import gen, link, door_up, put, prop

def cave(mid, name, theme, seed, enc, floors, chests, music, boss_ev, flag, dark=0, w=50, h=40):
    ms, infos = [], []
    for k in range(floors):
        m, i = gen(mid if k == 0 else '%s_%d' % (mid[:-2], k + 1) if mid.endswith('_1') else '%s_%d' % (mid, k + 1), name + ('' if k == 0 else ' - Depths'), w, h, theme, seed + k, enc=enc, rooms=9, chests=chests[k] if k < len(chests) else [], music=music)
        m.dark = dark; ms.append(m); infos.append(i)
    e = infos[0]['rooms'][0]; door_up(ms[0], e.x + e.w // 2 - 1, e.y - 1, '@world', 0, 0); ms[0].entry = [e.x + e.w // 2, e.y + 1]
    for k in range(floors - 1): link(ms[k], infos[k]['rooms'][-1], ms[k + 1], infos[k + 1]['rooms'][0])
    q = infos[-1]['rooms'][-1]; ms[-1].event(q.x, q.y + q.h // 2, boss_ev, q.w, 1, unless=flag); put(ms[-1], 'crystal_big', q.x + q.w // 2 - 1, q.y + 1)
    if len(infos[-1]['rooms']) > 1: savepoint(ms[-1], infos[-1]['rooms'][-2].x + 1, infos[-1]['rooms'][-2].y + 1)
    return ms

def oasis():
    m = Map('sc_oasis', 30, 24, 'Moonwell Oasis', music='mystical', kind='town'); m.under = 'sand'
    m.ground('sand', 0, 0, 29, 23); m.walls('sand', 0, 0, 29, 1); m.walls('sand', 0, 22, 29, 23); m.walls('sand', 0, 0, 1, 23); m.walls('sand', 28, 0, 29, 23)
    m.ground('water', 11, 8, 18, 13)
    for (x, y) in ((9, 7), (20, 7), (9, 14), (20, 14)): tree(m, x, y, 'light')
    for x in range(13, 17): m.walls('sand', x, 22, x, 23)
    for k in range(4): m.wall[m.i(13 + k, 22)] = None; m.wall[m.i(13 + k, 23)] = None; m.ground('sand', 13 + k, 22, 13 + k, 23); m.warp(13 + k, 23, '@world', 0, 0, 2)
    m.entry = [14, 21]
    m.npc(6, 10, 'SorcererBlack' if False else 'OldWoman', name='MOON MERCHANT', shop='sc_oasis', still=1, dir=2)
    m.npc(23, 10, 'Woman', name='WELL KEEPER', ev='sc_well', still=1, dir=2)
    m.npc(15, 17, 'OldMan', name='RUMOUR-MONGER', ev='sc_rumours', walk=1)
    savepoint(m, 6, 16)
    return [m]

def graves():
    m = Map('sc_graves', 28, 22, 'Forgotten Graves', music='crypt', kind='town', dark=1); m.under = 'grass'
    m.ground('grass', 0, 0, 27, 21); forest(m, 0, 0, 27, 2, seed=5); forest(m, 0, 19, 11, 21, seed=6); forest(m, 16, 19, 27, 21, seed=7); forest(m, 0, 0, 2, 21, seed=8); forest(m, 25, 0, 27, 21, seed=9)
    for k in range(4): m.warp(12 + k, 21, '@world', 0, 0, 2)
    for (x, y) in ((6, 6), (10, 6), (14, 6), (18, 6), (6, 11), (10, 11), (18, 11), (22, 11)): put(m, 'urn', x, y)
    put(m, 'statue', 13, 10); m.entry = [13, 19]
    m.npc(20, 15, 'SkullBlue' if False else 'OldMan', name='GRAVE-TENDER', ev='sc_graves', still=1, dir=2)
    m.event(13, 12, 'sc_tomb', 2, 1, touch=False)
    return [m]

def cove():
    ms = cave('sc_cove_1', 'Rumrunners\' Cove', 'cave', 7701, 'grotto', 1, [['x_potion', ('gold', 12000), 'prism:gold_plus']], 'boat', 'sc_rumrunner', 'sc_rumrunner', dark=1, w=44, h=34)
    ms[0].id = 'sc_cove'
    return ms

def cabin():
    m = interior('sc_cabin', 'Stargazer\'s Cabin', 16, 12, ('@world', 0, 0), floor='planks', wall='wood', door=7, music='quiet')
    bed(m, 1, 4); bookcase(m, 4, 3); bookcase(m, 7, 3); table(m, 10, 7); put(m, 'statue', 12, 3)
    m.npc(9, 5, 'OldMan', name='STARGAZER', ev='sc_stargazer', still=1, dir=2)
    return [m]

def ghost_ship():
    m, i = gen('sc_ghost', 'The Lantern Wake (Ghost Ship)', 44, 34, 'ship', 7801, enc='cove', rooms=8, chests=['megalixir', ('gold', 20000)], music='curse')
    m.dark = 2; e = i['rooms'][0]; door_up(m, e.x + e.w // 2 - 1, e.y - 1, '@world', 0, 0); m.entry = [e.x + e.w // 2, e.y + 1]
    q = i['rooms'][-1]; m.event(q.x, q.y + q.h // 2, 'sc_captain', q.w, 1, unless='sc_captain')
    return [m]

def build():
    out = []
    out += cave('sc_falls_1', 'Veiled Falls', 'cave', 7101, 'coral', 2, [['hi_potion', 'ether'], ['elixir']], 'water', 'sc_falls', 'sc_falls', w=46, h=36)
    out += cave('sc_vault_1', 'Kingsrest Hollow', 'temple', 7201, 'citadel', 2, [['x_potion'], ['megalixir']], 'temple', 'sc_vault', 'sc_vault')
    out += cave('sc_deep_1', 'Drowned Archive', 'ruins', 7301, 'abyss', 2, [['elixir'], ['prism:mp_plus']], 'water', 'sc_deep', 'sc_deep', dark=1)
    out += cave('sc_peak_1', 'Skyward Peak', 'ice', 7401, 'trial', 1, [['megalixir']], 'snow', 'sc_peak', 'sc_peak')
    out += oasis() + graves() + cove() + cabin() + ghost_ship()
    return out
