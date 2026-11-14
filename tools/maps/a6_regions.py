"""More of the world: Cinder Camp (an Undercurrent waystation in the Ashfields), the Aurex Sand Refinery (Solmara),
Northwatch Outpost (Nordheim), the Fallen Isle (a sky-island that crashed in the Sundering) and Halcyon after the end
of the plate (Act V)."""
from _kit import *
from _gen import gen, link, door_up, put, prop, switches
from a2_meridia import town, exit_south, doors, deco_town
from a1_sumps import fix_doors

def series(base, names, theme, seed, enc, loot, **kw):
    ms, inf = [], []
    for k, nm in enumerate(names):
        m, i = gen('%s_%d' % (base, k + 1), nm, 54, 42, theme, seed + k, enc=enc, rooms=11, chests=loot[k], **kw); ms.append(m); inf.append(i)
    for k in range(len(ms) - 1): link(ms[k], inf[k]['rooms'][-1], ms[k + 1], inf[k + 1]['rooms'][0])
    e = inf[0]['rooms'][0]; door_up(ms[0], e.x + e.w // 2 - 1, e.y - 1, '@world', 0, 0); ms[0].entry = [e.x + e.w // 2, e.y + 1]
    return ms, inf
def boss(m, info, ev, flag):
    q = info['rooms'][-1]; m.event(q.x, q.y + q.h // 2, ev, q.w, 1, unless=flag); savepoint(m, info['rooms'][-2].x + 1, info['rooms'][-2].y + 1)

def camp():
    m = town('camp', 'Cinder Camp', 44, 34, ground='ash', seed=131, music='road', border='rock')
    m.ground('dirt', 20, 3, 23, 31); m.ground('dirt', 4, 15, 39, 17)
    D = doors(m, [(6, 6, 'thatch', 'cc_tent'), (30, 6, 'mound', 'cc_store'), (6, 22, 'thatch', None), (30, 22, 'mound', None)])
    for (x, y) in ((14, 10), (26, 11), (14, 24), (27, 25)): m.stamp('camp', 0, 0, x, y, 2, 2, overrows=1, col=SOLID)
    savepoint(m, 24, 19); exit_south(m, 20, 4); m.entry = [21, 30]
    m.npc(18, 16, 'pip', id='pip_camp', name='PIP', ev='rg_pip', still=1, dir=2)
    m.npc(28, 16, 'Hunter', name='SCOUT', walk=1, say=['Undercurrent keeps this camp for anyone running from Halcyon. Thornbrook\'s east, past the river.'])
    m.npc(10, 18, 'Villager6', name='REFUGEE', walk=2, say=['We walked out of the Sumps through the drains. Took a week. The Ashfields are nicer. That\'s saying something.'])
    return m, D
def camp_ins(D):
    to = lambda k: ('camp',) + D[k]
    t = interior('cc_tent', 'Undercurrent Tent', 12, 10, to('cc_tent'), floor='dirt', wall='wood', door=6); bed(t, 1, 3); bed(t, 3, 3); table(t, 6, 5)
    t.npc(8, 7, 'marlo', id='marlo_camp', name='MARLO', ev='rg_marlo', still=1, dir=2)
    s = interior('cc_store', 'Supply Mound', 12, 10, to('cc_store'), floor='dirt', wall='rock', door=6); counter(s, 3, 8, 4)
    s.npc(5, 3, 'Villager4', name='QUARTERMASTER', shop='cc_store', still=1, dir=2)
    return [t, s]

def refinery():
    ms, inf = series('refinery', ['Sand Refinery - Loading Yard', 'Sand Refinery - Crusher Halls', 'Sand Refinery - Separator Core'], 'factory', 2400, 'refinery',
                     [['hi_potion', ('gold', 3000)], ['prism:absorb_hp', 'turbo_ether'], ['titan_grip', 'x_potion']])
    switches(ms[1], inf[1], 3, 'rf_valves2', 'valve')
    boss(ms[2], inf[2], 'rg_refinery', 'rg_refinery')
    return ms
def outpost():
    ms, inf = series('outpost', ['Northwatch - Gatehouse', 'Northwatch - Barracks', 'Northwatch - Signal Tower'], 'ice', 2500, 'outpost',
                     [['x_potion', ('gold', 4000)], ['prism:preemptive', 'elixir'], ['crystal_band', 'turbo_ether']])
    switches(ms[1], inf[1], 3, 'np_terms2', 'terminal')
    boss(ms[2], inf[2], 'rg_outpost', 'rg_outpost')
    return ms
def skyruins():
    ms, inf = series('skyruins', ['Fallen Isle - Shattered Garden', 'Fallen Isle - Hall of Wind', 'Fallen Isle - Chorus Archive', 'Fallen Isle - Broken Spire'], 'crystal', 2600, 'skyruins',
                     [['megalixir', 'prism:holy'], ['elixir', ('gold', 9000)], ['prism:ultima', 'ribbon'], ['megalixir']])
    switches(ms[2], inf[2], 4, 'sr_runes3', 'rune')
    boss(ms[3], inf[3], 'rg_skyruins', 'rg_skyruins')
    return ms

def halcyon_new():
    """Act V: the plate is gone. The Sumps under an open sky, rebuilding."""
    m = town('halcyon_new', 'Halcyon - Under the Open Sky', 60, 44, ground='grass', seed=141, music='peaceful', border='rock')
    m.ground('cobble', 4, 20, 55, 22); m.ground('cobble', 28, 3, 30, 41); m.ground('dirt', 6, 6, 18, 14)
    flowers(m, [(7 + (i * 5) % 11, 7 + (i * 3) % 7) for i in range(30)])
    D = doors(m, [(36, 8, 'hall', 'hn_spillway'), (44, 9, 'green', 'hn_corra'), (36, 28, 'orange', 'hn_school'), (8, 28, 'longhouse', None), (46, 28, 'wood', None)])
    for (x, y) in ((22, 30), (24, 33), (52, 14), (12, 36)): prop(m, 'rock', x, y)
    m.sign(12, 16, 'LYRA\'S GARDEN. Crystal-moss. Don\'t pick it. (Do pick it if you need it. - L.)')
    savepoint(m, 32, 24); exit_south(m, 28, 3); m.entry = [29, 40]
    m.npc(26, 21, 'Villager2', name='DOCKHAND', walk=2, say=['The plate came down in pieces, and we saw the sky. Real sky. I sat on my roof all day.'])
    m.npc(34, 22, 'Woman', name='WASHER', walk=2, say=['No reactors, no lamps after dark. We go to bed with the sun now. I\'ve never slept so well.'])
    m.npc(16, 18, 'Cavegirl', name='KID', walk=2, say=['Lyra\'s flowers grow everywhere now! They light the streets at night!'])
    m.npc(30, 12, 'drago', name='DRAGO', ev='rg_drago_halcyon', still=1, dir=2)
    return m, D
def halcyon_new_ins(D):
    to = lambda k: ('halcyon_new',) + D[k]; out = []
    s = interior('hn_spillway', 'The Spillway (Open Air)', 20, 14, to('hn_spillway'), floor='planks', wall='wood', door=9, music='chill')
    counter(s, 3, 9, 5); table(s, 12, 6); table(s, 12, 10)
    s.npc(6, 4, 'Princess', name='TESS', ev='inn_tess', still=1, dir=2); s.npc(14, 9, 'pip', name='PIP', still=1, dir=3, say=['Undercurrent\'s retired! We\'re a building company now. "Pip & Marlo, Roofs for the Sky".'])
    out.append(s)
    c = interior('hn_corra', 'Nan Corra\'s', 14, 11, to('hn_corra'), floor='planks', wall='wood', door=7); bed(c, 2, 3); table(c, 6, 6)
    c.npc(9, 5, 'OldWoman', name='NAN CORRA', ev='rg_corra', still=1, dir=2); out.append(c)
    k = interior('hn_school', 'Open-Sky School', 16, 12, to('hn_school'), door=7)
    for (x, y) in ((3, 5), (9, 5), (3, 8), (9, 8)): table(k, x, y)
    k.npc(7, 3, 'Princess', name='MISS ODELL', still=1, dir=2, say=['Today\'s lesson: the sky. It is blue. It was always blue. We just couldn\'t see it.']); out.append(k)
    return out

def build():
    c, D = camp(); ci = camp_ins(D); fix_doors(c, ci)
    h, D2 = halcyon_new(); hi = halcyon_new_ins(D2); fix_doors(h, hi)
    return [c] + ci + refinery() + outpost() + skyruins() + [h] + hi
