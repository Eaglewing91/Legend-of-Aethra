"""Act III: Solmara. Port Lark, Saltmere, the Smugglers' Grotto, the Coral Sanctum, Sunscar and its ruins, Orin's Tower,
Dunewreck (and the first Memory Dive: Thornbrook, seven years ago), Mount Cinder.

Flags: a3_ferry, a3_grotto (Sable's crew; the submersible), a3_coral (Drowned Warden), a3_sunscar, a3_ruins, a3_orin (joins),
a3_rook (wakes), a3_dive (Memory Dive done; Engine Core), a3_drago3, a3_colossus, a3_done."""
from _kit import *
from _gen import switches, gen, link, stairs, door_up, put, prop
from a1_sumps import fix_doors
from a2_meridia import town, exit_south, doors, deco_town

def portlark():
    m = town('portlark', 'Port Lark', 54, 40, ground='grass', seed=51, music='boat')
    m.ground('water', 3, 3, 50, 12); m.ground('planks', 24, 8, 29, 18); m.ground('planks', 10, 10, 44, 12)
    m.ground('cobble', 26, 19, 28, 37); m.ground('cobble', 4, 22, 49, 24)
    D = doors(m, [(8, 26, 'tan', 'pl_inn'), (16, 26, 'shop', 'pl_shop'), (38, 26, 'orange', 'pl_office'), (45, 27, 'wood', None)])
    for (x, y) in ((12, 13), (13, 13), (40, 13), (41, 13), (30, 15)): prop(m, 'crate' if x % 2 else 'barrel', x, y)
    m.event(25, 9, 'a3_ferry', 4, 1)
    m.sign(23, 14, 'FERRY TO SALTMERE. Tickets at the harbour office.')
    savepoint(m, 31, 21); deco_town(m, 52, n_trees=8); exit_south(m, 26, 3); m.entry = [27, 36]
    m.npc(20, 23, 'Villager5', name='SAILOR', walk=2, say=['Saltmere\'s across the strait. Desert on the far shore. Hot as a forge.'])
    m.npc(33, 17, 'Villager6', name='DOCKER', walk=1, say=['Aurex chartered every ship last month. Every one! For "survey work" under the sea.'])
    return m, D
def portlark_ins(D):
    to = lambda k: ('portlark',) + D[k]
    i = interior('pl_inn', 'The Anchor', 14, 11, to('pl_inn'), door=6); counter(i, 3, 8, 4); bed(i, 1, 6); bed(i, 12, 6); i.npc(5, 3, 'Woman', name='INNKEEPER', ev='inn_lark', dir=2, still=1)
    s = interior('pl_shop', 'Chandlery', 12, 10, to('pl_shop'), door=6); counter(s, 3, 8, 4); s.npc(5, 3, 'Villager4', name='CHANDLER', shop='pl_shop', dir=2, still=1)
    o = interior('pl_office', 'Harbour Office', 12, 10, to('pl_office'), floor='tile', wall='pale', door=6); counter(o, 3, 8, 4); o.npc(5, 3, 'Inspector', name='HARBOURMASTER', ev='a3_ticket', dir=2, still=1)
    return [i, s, o]

def saltmere():
    m = town('saltmere', 'Saltmere', 54, 42, ground='sand', seed=61, music='desert', border='sand')
    m.ground('water', 2, 2, 51, 8); m.ground('planks', 24, 6, 29, 14)
    m.ground('cobble', 26, 15, 28, 39); m.ground('cobble', 4, 22, 49, 24)
    D = doors(m, [(8, 15, 'tan', 'sm_inn'), (16, 16, 'shop', 'sm_shop'), (38, 15, 'red', 'sm_arms'), (45, 16, 'green', 'sm_prism'), (10, 30, 'mound', None), (40, 31, 'thatch', None)])
    m.event(25, 7, 'a3_ferry_back', 4, 1)
    m.stamp('dungeon', 2, 3, 48, 34); m.warp(48, 34, 'grotto', 0, 0, 2); m.sign(49, 35, 'A rope ladder into a sea-cave. Someone has painted a grinning skull beside it.')
    savepoint(m, 31, 20)
    exit_south(m, 26, 3); m.entry = [27, 37]
    m.npc(20, 25, 'Sultan', name='MERCHANT', walk=2, say=['Sunscar\'s to the south-east, past the dunes. Take water. Take two waters.'])
    m.npc(34, 27, 'Cavegirl', name='FISHER GIRL', walk=2, say=['The sea\'s gone wrong. Fish float belly-up near the reef. Mum says the Coral Sanctum stopped singing.'])
    return m, D
def saltmere_ins(D):
    to = lambda k: ('saltmere',) + D[k]; out = []
    i = interior('sm_inn', 'Salt & Sun', 14, 11, to('sm_inn'), floor='sand', wall='sand', door=6); counter(i, 3, 8, 4); bed(i, 1, 6); bed(i, 12, 6); i.npc(5, 3, 'Princess', name='INNKEEPER', ev='inn_salt', dir=2, still=1); out.append(i)
    s = interior('sm_shop', 'Oasis Goods', 12, 10, to('sm_shop'), floor='sand', wall='sand', door=6); counter(s, 3, 8, 4); s.npc(5, 3, 'Sultan2', name='TRADER', shop='sm_shop', dir=2, still=1); out.append(s)
    a = interior('sm_arms', 'Dune Forge', 12, 10, to('sm_arms'), floor='darkcobble', wall='sand', door=6); counter(a, 3, 8, 4); a.npc(5, 3, 'Blacksmith', name='SMITH', shop='sm_arms', dir=2, still=1); out.append(a)
    p = interior('sm_prism', 'Mirage Prisms', 12, 10, to('sm_prism'), floor='marble', wall='sand', door=6); counter(p, 3, 8, 4); p.npc(5, 3, 'SorcererOrange', name='MIRAGE', shop='sm_prism', dir=2, still=1); out.append(p)
    return out

def grotto():
    m, info = gen('grotto', 'Smugglers\' Grotto', 58, 44, 'cave', 1101, enc='grotto', rooms=12, chests=['prism:steal', ('gold', 2600), 'nightshade', 'x_potion'], pools=0.6)
    e = info['rooms'][0]; door_up(m, e.x + e.w // 2 - 1, e.y - 1, 'saltmere', 48, 35); m.entry = [e.x + e.w // 2, e.y + 1]
    q = info['rooms'][-1]; m.event(q.x, q.y + q.h // 2, 'a3_grotto', q.w, 1, unless='a3_grotto')
    savepoint(m, info['rooms'][-2].x + 1, info['rooms'][-2].y + 1)
    return m

def coral():
    ms = []; infos = []
    loot = [['prism:water', 'x_potion'], ['aurora_staff', ('gold', 3000)], ['prism:absorb_hp', 'remedy'], ['crystal_band', 'turbo_ether'], ['prism:marrowtide', 'elixir']]
    for k in range(5):
        m, info = gen('coral_%d' % (k + 1), 'Coral Sanctum - ' + ('Kelp Gate', 'Pearl Halls', 'Tide Organ', 'Drowned Choir', 'Heart of the Sea')[k], 54, 42, 'crystal', 1200 + k, enc='coral', rooms=11, chests=loot[k], pools=0.6, music='water')
        m.dark = 1; ms.append(m); infos.append(info)
    for k in range(4): link(ms[k], infos[k]['rooms'][-1], ms[k + 1], infos[k + 1]['rooms'][0])
    switches(ms[1], infos[1], 3, 'cs_orbs2', 'orb'); switches(ms[3], infos[3], 4, 'cs_orbs4', 'orb')
    e = infos[0]['rooms'][0]; door_up(ms[0], e.x + e.w // 2 - 1, e.y - 1, '@world', 140, 172); ms[0].entry = [e.x + e.w // 2, e.y + 1]
    q = infos[4]['rooms'][-1]; ms[4].event(q.x, q.y + q.h // 2, 'a3_warden', q.w, 1, unless='a3_coral')
    savepoint(ms[2], infos[2]['rooms'][0].x + 1, infos[2]['rooms'][0].y + 1); savepoint(ms[4], infos[4]['rooms'][-2].x + 1, infos[4]['rooms'][-2].y + 1)
    return ms

def sunscar():
    m = town('sunscar', 'Sunscar', 52, 40, ground='sand', seed=71, music='desert', border='sand')
    m.ground('cobble', 25, 3, 27, 37); m.ground('cobble', 4, 20, 47, 22); m.ground('water', 21, 12, 31, 16)
    for (x, y) in ((20, 11), (32, 11), (20, 17), (32, 17)): tree(m, x, y, 'olive')
    D = doors(m, [(8, 10, 'tan', 'ss_inn'), (15, 11, 'shop', 'ss_shop'), (38, 10, 'red', 'ss_arms'), (8, 26, 'mound', None), (40, 27, 'thatch', 'ss_hut')])
    savepoint(m, 29, 24); exit_south(m, 25, 3); m.entry = [26, 36]
    m.event(24, 30, 'a3_sunscar', 5, 1, unless='a3_sunscar')
    m.npc(18, 21, 'Sultan', name='WATER SELLER', walk=2, say=['The ruins north of town are older than the sand. The Chorus built them, they say.'])
    m.npc(34, 23, 'OldMan2', name='STARGAZER', walk=1, say=['The old scholar Orin lives in a tower in the far east desert. He hasn\'t come down in seven years.'])
    return m, D
def sunscar_ins(D):
    to = lambda k: ('sunscar',) + D[k]; out = []
    i = interior('ss_inn', 'Sunscar Rest', 14, 11, to('ss_inn'), floor='sand', wall='sand', door=6); counter(i, 3, 8, 4); bed(i, 1, 6); bed(i, 12, 6); i.npc(5, 3, 'Woman', name='INNKEEPER', ev='inn_sun', dir=2, still=1); out.append(i)
    s = interior('ss_shop', 'Caravan Store', 12, 10, to('ss_shop'), floor='sand', wall='sand', door=6); counter(s, 3, 8, 4); s.npc(5, 3, 'Sultan2', name='CARAVANEER', shop='ss_shop', dir=2, still=1); out.append(s)
    a = interior('ss_arms', 'Sunsteel', 12, 10, to('ss_arms'), floor='darkcobble', wall='sand', door=6); counter(a, 3, 8, 4); a.npc(5, 3, 'Blacksmith', name='SMITH', shop='ss_arms', dir=2, still=1); out.append(a)
    h = interior('ss_hut', 'Vesna\'s Rented Room', 12, 10, to('ss_hut'), door=6); bed(h, 1, 3); table(h, 4, 6); h.npc(6, 4, 'vesna', id='vesna', ev='a3_vesna', dir=2, still=1, unless='vesna_joined'); out.append(h)
    return out

def ruins():
    ms = []; infos = []
    for k in range(2):
        m, info = gen('sunruins' if k == 0 else 'sunruins_2', 'Sunscar Ruins' + ('', ' - Hall of Songs')[k], 56, 42, 'ruins', 1300 + k, enc='ruins', rooms=12, chests=[['prism:enemy_skill', 'hi_potion', ('gold', 2800)], ['sage_rod', 'prism:magic_plus', 'elixir']][k])
        ms.append(m); infos.append(info)
    link(ms[0], infos[0]['rooms'][-1], ms[1], infos[1]['rooms'][0])
    e = infos[0]['rooms'][0]; door_up(ms[0], e.x + e.w // 2 - 1, e.y - 1, '@world', 0, 0); ms[0].entry = [e.x + e.w // 2, e.y + 1]
    q = infos[1]['rooms'][-1]; ms[1].event(q.x, q.y + q.h // 2, 'a3_ruins', q.w, 1, unless='a3_ruins')
    for k, r in enumerate(infos[1]['rooms'][2:6]): ms[1].event(r.x + 1, r.y + 1, 'a3_mural', 1, 1, touch=False, n=k); put(ms[1], 'statue', r.x + 1, r.y)
    return ms

def orin_tower():
    ms = []; infos = []
    for k in range(6):
        m, info = gen('orin_tower' if k == 0 else 'orin_tower_%d' % (k + 1), 'Orin\'s Tower - Floor %d' % (k + 1), 40, 34, 'crystal', 1400 + k, enc='tower_orin', rooms=8, chests=[['ether'], ['prism:gravity'], ['frost_rod'], ['mind_pendant'], ['prism:doublecast'], ['thunder_rod']][k], minr=(6, 5), maxr=(10, 8), music='mystic')
        ms.append(m); infos.append(info)
    for k in range(5):
        link(ms[k], infos[k]['rooms'][-1], ms[k + 1], infos[k + 1]['rooms'][0], down=False)
        # each floor's stairs are sealed by a crystal lock: touch the floor's orb to open it
        q = infos[k]['rooms'][-1]; sx, sy = q.x + q.w // 2, q.y + 1
        ms[k].gate('orin_lock%d' % k, sx - 1, sy + 1, 3, 1, tile=('dungeon', 5, 1))
        r = infos[k]['rooms'][len(infos[k]['rooms']) // 2]; put(ms[k], 'orb', r.x + 1, r.y); ms[k].event(r.x + 1, r.y, 'a3_orinlock', touch=False, n=k)
    e = infos[0]['rooms'][0]; door_up(ms[0], e.x + e.w // 2 - 1, e.y - 1, '@world', 0, 0); ms[0].entry = [e.x + e.w // 2, e.y + 1]
    q = infos[5]['rooms'][-1]; ms[5].event(q.x, q.y + q.h // 2, 'a3_orin', q.w, 1, unless='a3_orin')
    savepoint(ms[3], infos[3]['rooms'][0].x + 1, infos[3]['rooms'][0].y + 1)
    return ms

def dunewreck():
    m, info = gen('dunewreck', 'Dunewreck', 60, 44, 'ship', 1501, enc='wreck', rooms=13, chests=['prism:counter', 'iron_knuckle' if False else 'piston_fist', ('gold', 3200), 'turbo_ether'])
    e = info['rooms'][0]; door_up(m, e.x + e.w // 2 - 1, e.y - 1, '@world', 0, 0); m.entry = [e.x + e.w // 2, e.y + 1]
    q = info['rooms'][-1]; m.event(q.x, q.y + q.h // 2, 'a3_rook', q.w, 1, unless='a3_rook')
    put(m, 'machine', q.x + q.w // 2 - 1, q.y + 1)
    savepoint(m, info['rooms'][-2].x + 1, info['rooms'][-2].y + 1)
    # the Memory Dive: Thornbrook on the night of the fire
    t = town('mem_thornbrook', 'Thornbrook - Seven Years Ago', 50, 40, ground='grass', seed=81, music='curse', dark=2)
    t.ground('dirt', 23, 3, 26, 39); t.ground('dirt', 3, 19, 46, 21)
    D = doors(t, [(8, 8, 'orange', None), (16, 8, 'shop', None), (34, 8, 'red', None), (41, 9, 'green', None), (8, 26, 'tan', None), (36, 27, 'orange2', None)])
    house(t, 22, 3, 'hall')
    for (x, y, w, h) in ((6, 12, 4, 2), (31, 13, 5, 2), (12, 29, 4, 3), (40, 23, 3, 3), (18, 15, 2, 2)): t.ground('lava', x, y, x + w - 1, y + h - 1)
    t.entry = [24, 36]; t.event(22, 34, 'a3_dive1', 6, 1, unless='dive1'); t.event(21, 23, 'a3_dive2', 8, 1, unless='dive2'); t.event(22, 9, 'a3_dive3', 6, 1, unless='dive3')
    t.enc = 'dive'; t.extra['tint'] = 'rgba(120,20,0,.28)'
    return [m, t]

def cinder():
    ms = []; infos = []
    loot = [['prism:fire', 'hi_potion'], ['dragon_mail', ('gold', 3600)], ['prism:ignarok' if False else 'prism:absorb_mp', 'x_potion'], ['siege_lance', 'turbo_ether'], ['storm_brand', 'fury_ring'], ['elixir', 'prism:flare']]
    for k in range(6):
        m, info = gen('cinder_%d' % (k + 1), 'Mount Cinder - ' + ('Ash Road', 'Lava Tubes', 'Magma Falls', 'Obsidian Caves', 'Caldera Rim', 'Fire Crystal')[k], 54, 42, 'lava', 1600 + k, enc='cinder', rooms=11, chests=loot[k], pools=0.5, music='dungeon')
        ms.append(m); infos.append(info)
    for k in range(5): link(ms[k], infos[k]['rooms'][-1], ms[k + 1], infos[k + 1]['rooms'][0], down=False)
    switches(ms[2], infos[2], 3, 'mc_valves3', 'valve')
    e = infos[0]['rooms'][0]; door_up(ms[0], e.x + e.w // 2 - 1, e.y - 1, '@world', 0, 0); ms[0].entry = [e.x + e.w // 2, e.y + 1]
    q = infos[4]['rooms'][len(infos[4]['rooms']) // 2]; ms[4].event(q.x, q.y + q.h // 2, 'a3_drago3', q.w, 1, unless='a3_drago3')
    q = infos[5]['rooms'][-1]; ms[5].event(q.x, q.y + q.h - 2, 'a3_colossus', q.w, 1, unless='a3_colossus'); put(ms[5], 'crystal_big', q.x + q.w // 2 - 1, q.y + 1)
    for k in (1, 3, 5): savepoint(ms[k], infos[k]['rooms'][0].x + 1, infos[k]['rooms'][0].y + 1)
    return ms

def build():
    pl, Dp = portlark(); pli = portlark_ins(Dp); fix_doors(pl, pli)
    sm, Ds = saltmere(); smi = saltmere_ins(Ds); fix_doors(sm, smi)
    ss, Du = sunscar(); ssi = sunscar_ins(Du); fix_doors(ss, ssi)
    return [pl] + pli + [sm] + smi + [grotto()] + coral() + [ss] + ssi + ruins() + orin_tower() + dunewreck() + cinder()
