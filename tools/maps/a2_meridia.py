"""Act II: Meridia. Thornbrook and the Lantern House, Mistwood, Kestrel Ranch, the Gilded Spire and Spire Prison,
the Old Mine, Windhaven, its Catacombs and the Wind Shrine.

Flags (src/content/a2_story.js): a2_thorn (arrived), a2_ilse (met Mother Ilse), a2_mist (through Mistwood),
a2_talon (first Talonbird), a2_spire (arrived at the Spire), a2_framed, a2_prison_out, a2_mine, a2_wind (at Windhaven),
a2_drain (Aurex at the shrine), a2_engine (Tempest Engine beaten), a2_done (shard given; Act II over)."""
import random
from _kit import *
from _gen import switches, gen, link, stairs, door_up, put, prop
from a1_sumps import fix_doors

def town(mid, name, W, H, ground='grass', path='dirt', music='town', border='forest', seed=1, dark=0):
    m = Map(mid, W, H, name, music=music, kind='town', dark=dark); m.under = ground
    m.ground(ground, 0, 0, W - 1, H - 1)
    if border == 'forest':
        forest(m, 0, 0, W - 1, 2, seed=seed); forest(m, 0, H - 3, W - 1, H - 1, seed=seed + 1)
        forest(m, 0, 0, 2, H - 1, seed=seed + 2); forest(m, W - 3, 0, W - 1, H - 1, seed=seed + 3)
    elif border:
        m.walls(border, 0, 0, W - 1, 1); m.walls(border, 0, H - 2, W - 1, H - 1); m.walls(border, 0, 0, 1, H - 1); m.walls(border, W - 2, 0, W - 1, H - 1)
    return m

def exit_south(m, x, w=3, to='@world'):
    """A gap in the south border that leads out to the world map."""
    for k in range(w):
        for y in range(m.h - 3, m.h):
            i = m.i(x + k, y); m.wall[i] = None; m.layers['deco'][i] = m.layers['over'][i] = -1; m.col[i] = OPEN
            m.ground(m.under if m.mat[i] is None else m.mat[i], x + k, y, x + k, y)
        m.warp(x + k, m.h - 1, to, 0, 0, 2)

def doors(m, specs):
    """specs: (x, y, kind, interior id) -> builds door warps; returns {id: (x, y below door)}."""
    D = {}
    for (x, y, kind, iid) in specs:
        dx, dy = house(m, x, y, kind, to=(iid, 0, 0) if iid else None); D[iid] = (dx, dy + 1)
        if not iid: m.sign(dx, dy, 'Locked.'); m.setcol(dx, dy, SOLID)
    return D

def deco_town(m, seed, n_trees=18, n_flowers=24, n_rocks=8):
    r = random.Random(seed)
    def clear(x, y):
        return m.ok(x, y) and m.col[m.i(x, y)] == OPEN and m.layers['deco'][m.i(x, y)] < 0 and m.mat[m.i(x, y)] in ('grass', 'snow', 'sand') and not m.warps_at(x, y)
    for _ in range(n_trees * 6):
        x, y = r.randint(3, m.w - 5), r.randint(3, m.h - 5)
        if all(clear(x + a, y + b) for a in range(-1, 3) for b in range(-1, 3)): tree(m, x, y, r.choice(['round', 'light', 'bushy'])); n_trees -= 1
        if n_trees <= 0: break
    pts = [(r.randint(3, m.w - 4), r.randint(3, m.h - 4)) for _ in range(n_flowers * 3)]
    flowers(m, [p for p in pts if clear(*p)][:n_flowers])
    for _ in range(n_rocks):
        x, y = r.randint(3, m.w - 4), r.randint(3, m.h - 4)
        if clear(x, y): prop(m, 'rock', x, y)
Map.warps_at = lambda m, x, y: [w for w in m.warps if w['x'] == x and w['y'] == y]

# ---------------- Thornbrook ----------------
def thornbrook():
    m = town('thornbrook', 'Thornbrook', 60, 48, seed=21, music='village')
    m.ground('dirt', 28, 3, 31, 47); m.ground('dirt', 3, 22, 56, 24)      # crossroads
    m.ground('cobble', 22, 16, 37, 30)                                   # the green, paved after the fire
    m.ground('water', 6, 34, 16, 41)                                     # the mill pond
    D = doors(m, [(8, 10, 'orange', 'th_inn'), (15, 9, 'shop', 'th_items'), (40, 10, 'red', 'th_arms'), (47, 9, 'green', 'th_prism'),
                  (40, 32, 'tan', 'th_ardent'), (47, 33, 'orange2', 'th_mayor'), (18, 34, 'wood', None), (52, 18, 'thatch', None), (6, 18, 'mound', None)])
    # the Lantern House on its hill (north), a long wooden orphanage
    m.ground('grass', 24, 3, 36, 12); dl = house(m, 27, 3, 'hall', to=('lantern', 0, 0)); D['lantern'] = (dl[0], dl[1] + 1)
    fence_h(m, 23, 26, 12); fence_h(m, 33, 37, 12)
    for (x, y) in ((24, 6), (35, 6)): tree(m, x, y, 'pink')
    m.sign(30, 13, 'THE LANTERN HOUSE. Every child has a name here.')
    # the well and the old mill (burned shell)
    put(m, 'urn', 29, 22); m.sign(30, 21, 'The old well. Someone has carved: "WE REMEMBER. 7 YEARS."')
    house(m, 10, 30, 'longhouse'); m.sign(11, 34, 'The burned mill. Rebuilt walls, but nobody grinds here any more.')
    savepoint(m, 33, 26)
    deco_town(m, 22)
    exit_south(m, 28, 4)
    m.warp(59, 23, '@world', 0, 0, 1) if False else None
    m.entry = [29, 44]
    m.event(27, 40, 'a2_thorn', 6, 1, unless='a2_thorn')
    P = lambda *a: list(a)
    m.npc(26, 20, 'Villager', name='FARMER', walk=2, say=P('Seven years since the fire. We rebuilt it all, plank by plank.', 'Aurex sent money for the rebuilding. Nice of them. Strange of them.'))
    m.npc(34, 24, 'Woman', name='BAKER', walk=2, say=P('A Warden in Thornbrook! The last one we had was the Ardent boy. Brave little thing. Died in the fire, saving the Lantern children.'))
    m.npc(22, 27, 'Villager3', name='GIRL', walk=2, say=P('Kael Ardent? That\'s the name on the memorial stone. Are you named after him?'))
    m.npc(44, 23, 'OldMan', name='OLD COOPER', still=1, dir=2, say=P('Knew every family in this village. Can\'t say I know you, lad. Can\'t say I don\'t, either. Funny.'))
    m.npc(14, 24, 'Hunter', name='TRAPPER', walk=1, say=P('Mistwood\'s north-east of here. Keep to the stones. The fog plays tricks.', 'Kestrel Ranch is on the far side. They\'ll rent you a talonbird if you\'re mad enough to ride one.'))
    m.npc(30, 30, 'Knight', name='AUREX SURVEYOR', still=1, dir=2, say=P('Aurex Dynamics, Wind Survey. We\'re just passing through to Windhaven.', 'Don\'t worry about the drills. They\'re for... surveying.'), unless='a2_done')
    m.npc(29, 19, 'OldWoman', name='MEMORIAL KEEPER', still=1, dir=2, ev='a2_memorial')
    return m, D

def thornbrook_ins(D):
    to = lambda k: ('thornbrook',) + D[k]
    out = []
    l = interior('lantern', 'The Lantern House', 26, 16, to('lantern'), floor='planks', wall='wood', music='peaceful', door=12)
    for x in (2, 4, 6, 8): bed(l, x, 3)
    for x in (17, 19, 21, 23): bed(l, x, 3, 2)
    table(l, 10, 8); table(l, 14, 8); bookcase(l, 11, 3); plant(l, 1, 13); plant(l, 24, 13)
    l.npc(13, 6, 'ilse', id='ilse', ev='a2_ilse', dir=2, still=1)
    l.npc(6, 9, 'Cavegirl', name='ORPHAN', walk=1, say=['Mother Ilse sews our names into our coats! So we never forget.'])
    l.npc(19, 10, 'Villager6', name='ORPHAN', walk=1, say=['I\'m going to be a Warden like Kael Ardent. He saved Mother Ilse from the fire.'])
    l.npc(22, 7, 'Villager3', name='ORPHAN', still=1, dir=3, ev='a2_orphan_cards')
    l.event(2, 6, 'a2_coats', 3, 1, touch=False); l.stamp('house', 6, 2, 3, 6, col=SOLID)
    out.append(l)
    i = interior('th_inn', 'The Thorn & Kettle', 14, 11, to('th_inn'), floor='planks', wall='wood', door=6)
    counter(i, 3, 8, 4); bed(i, 1, 6); bed(i, 12, 6); i.npc(5, 3, 'Princess', name='INNKEEPER', ev='inn_thorn', dir=2, still=1); out.append(i)
    s = interior('th_items', 'Thornbrook Goods', 12, 10, to('th_items'), door=6); counter(s, 3, 8, 4); shelf(s, 1, 3); s.npc(5, 3, 'Villager4', name='GROCER', shop='th_items', dir=2, still=1); out.append(s)
    a = interior('th_arms', 'Ironbark Smithy', 12, 10, to('th_arms'), floor='darkcobble', wall='brick', door=6); counter(a, 3, 8, 4); a.npc(5, 3, 'Blacksmith', name='SMITH', shop='th_arms', dir=2, still=1); out.append(a)
    p = interior('th_prism', 'Wren\'s Prisms', 12, 10, to('th_prism'), floor='marble', wall='pale', door=6, music='mystic'); counter(p, 3, 8, 4); put(p, 'crystal_s', 1, 3); p.npc(5, 3, 'SorcererBlack', name='PRISM SELLER', shop='th_prism', dir=2, still=1); out.append(p)
    h = interior('th_ardent', 'The Ardent House', 12, 10, to('th_ardent'), door=6); bed(h, 1, 3); bed(h, 3, 3, 1); table(h, 5, 6); drawers(h, 8, 2)
    h.npc(6, 5, 'Woman', name='MRS FENN', ev='a2_fenn', dir=2, still=1); h.event(8, 3, 'a2_ardent_drawer', 2, 1, touch=False); out.append(h)
    y = interior('th_mayor', 'Mayor\'s House', 12, 10, to('th_mayor'), door=6); bookcase(y, 1, 2); table(y, 4, 5)
    y.npc(6, 4, 'Noble', name='MAYOR ADLER', dir=2, still=1, say=['Aurex rebuilt Thornbrook after the fire. Every board, every nail. We owe them everything.', 'I signed whatever they asked. Wouldn\'t you?']); out.append(y)
    return out

# ---------------- Mistwood ----------------
def mistwood():
    ms = []; infos = []
    loot = [['phoenix_down', ('potion', 3), 'prism:aero'], ['hi_potion', 'silver_bell' if False else 'mending_rod', ('gold', 900)], ['ether', 'swift_boots', 'prism:revive']]
    for k in range(3):
        m, info = gen('mistwood' if k == 0 else 'mistwood_%d' % (k + 1), 'Mistwood' + ('' if k == 0 else (' - Hollow Path', ' - Elder Glade')[k - 1]),
                      60, 44, 'forest', 600 + k, enc='mistwood', rooms=13, chests=loot[k], pools=0.4, music='forest')
        m.dark = 1; ms.append(m); infos.append(info)
    for k in range(2):
        a, b = infos[k]['rooms'][-1], infos[k + 1]['rooms'][0]
        # paths between areas: east edge of the last room -> west side of the next first room (as stairs-like warps)
        link(ms[k], a, ms[k + 1], b, down=True)
    # in and out: first room has the way back to the world, last room of area 3 leads out to Kestrel
    e = infos[0]['rooms'][0]; door_up(ms[0], e.x + e.w // 2 - 1, e.y - 1, '@world', 0, 0); ms[0].entry = [e.x + e.w // 2, e.y + 1]
    q = infos[2]['rooms'][-1]; door_up(ms[2], q.x + q.w // 2 - 1, q.y - 1, 'kestrel', 0, 0)
    # the Elder Glade guardian
    ms[2].event(q.x, q.y + q.h - 2, 'a2_thornmaw', q.w, 1, unless='a2_mist')
    savepoint(ms[1], infos[1]['rooms'][0].x + 1, infos[1]['rooms'][0].y + 1)
    savepoint(ms[2], infos[2]['rooms'][-2].x + 1, infos[2]['rooms'][-2].y + 1)
    # a lost talonbird chick (side quest) in area 2
    r = infos[1]['rooms'][len(infos[1]['rooms']) // 2]; ms[1].npc(r.x + 2, r.y + 2, 'Owl', name='CHICK', ev='a2_chick', still=1, unless='q_chick')
    return ms

# ---------------- Kestrel Ranch ----------------
def kestrel():
    m = town('kestrel', 'Kestrel Ranch', 52, 40, seed=31, music='peaceful')
    m.ground('dirt', 4, 18, 47, 20); m.ground('dirt', 24, 3, 26, 37)
    m.ground('sand', 30, 24, 46, 34)                                   # the paddock
    for x in range(30, 47): m.stamp('house', 11, 4, x, 23, col=LOW); m.stamp('house', 11, 4, x, 35, col=LOW)
    D = doors(m, [(8, 8, 'hall', 'ks_barn'), (16, 10, 'orange', 'ks_house'), (36, 9, 'wood', 'ks_shop')])
    m.npc(38, 28, 'Owl2', name='TALONBIRD', walk=2, say=['Kwark!']); m.npc(42, 31, 'Owl', name='TALONBIRD', walk=2, say=['Krrrk?']); m.npc(33, 30, 'Owl2', name='TALONBIRD', walk=2, say=['Kwee!'])
    m.npc(28, 21, 'Hunter', id='rancher', name='RANCHER JODA', ev='a2_joda', still=1, dir=2)
    m.npc(20, 26, 'Villager5', name='STABLEHAND', walk=2, say=['Wild talonbirds run the plains. You need Greens to calm one, and a Ranch Pass to keep one.', 'Talonbirds cross shallow rivers, and wild ones never let monsters near.'])
    savepoint(m, 22, 15)
    deco_town(m, 32, n_trees=10)
    exit_south(m, 24, 3)
    m.entry = [25, 36]
    return m, D

def kestrel_ins(D):
    to = lambda k: ('kestrel',) + D[k]
    b = interior('ks_barn', 'Kestrel Barn', 22, 14, to('ks_barn'), floor='planks', wall='wood', door=10, music='peaceful')
    for x in range(3, 20, 4): b.stamp('house', 11, 4, x, 6, col=LOW)
    b.npc(5, 4, 'Owl2', name='GOLD-CREST', still=1, say=['A proud racing bird. Kwaaark!']); b.npc(13, 4, 'Owl', name='BRUISER', still=1, say=['A big slow bird. It\'s eating your sleeve.'])
    b.npc(17, 9, 'Cavegirl', name='BREEDER TAL', ev='a2_breeder', still=1, dir=3)
    h = interior('ks_house', 'Joda\'s House', 12, 10, to('ks_house'), door=6); bed(h, 1, 3); table(h, 4, 6); h.npc(6, 4, 'Woman', name='MARGA', ev='inn_kestrel', still=1, dir=2)
    s = interior('ks_shop', 'Feed & Tack', 12, 10, to('ks_shop'), door=6); counter(s, 3, 8, 4); s.npc(5, 3, 'Villager2', name='FEEDER', shop='ks_shop', dir=2, still=1)
    return [b, h, s]

# ---------------- the Gilded Spire and its prison ----------------
def gilded():
    m = Map('gilded_spire', 56, 46, 'The Gilded Spire', music='spire', kind='town'); m.under = 'marble'
    m.ground('sand', 0, 0, 55, 45); m.walls('sand', 0, 0, 55, 1); m.walls('sand', 0, 44, 55, 45); m.walls('sand', 0, 0, 1, 45); m.walls('sand', 54, 0, 55, 45)
    m.ground('marble', 4, 4, 51, 41); m.ground('carpet', 26, 4, 29, 41); m.ground('carpet', 4, 21, 51, 24)
    m.ground('water', 22, 17, 33, 28); m.ground('marble', 25, 20, 30, 25); put(m, 'statue', 27, 21)
    D = doors(m, [(8, 7, 'hall', 'gs_arcana'), (16, 8, 'shop', 'gs_shop'), (38, 7, 'hall', 'gs_hotel'), (46, 8, 'red', 'gs_arena'),
                  (8, 30, 'green', 'gs_race'), (16, 31, 'orange2', 'gs_slots'), (40, 31, 'tan', 'gs_gallery')])
    for (x, y) in ((5, 5), (50, 5), (5, 40), (50, 40), (22, 5), (33, 5)): put(m, 'orb', x, y)
    for (x, y) in ((24, 15), (31, 15), (24, 30), (31, 30)): put(m, 'pillar', x, y)
    m.sign(26, 42, 'THE GILDED SPIRE. Luck lives here. So does the house.')
    savepoint(m, 31, 38)
    for k in range(4): m.warp(26 + k, 44, '@world', 0, 0, 2); m.wall[m.i(26 + k, 44)] = None; m.ground('carpet', 26 + k, 44, 26 + k, 44)
    m.entry = [27, 42]
    m.event(25, 39, 'a2_spire', 6, 1, unless='a2_spire')
    m.event(26, 43, 'a2_murder', 4, 1, if_='a2_spire&!a2_framed')
    P = lambda *a: list(a)
    m.npc(20, 22, 'Sultan', name='HIGH ROLLER', walk=2, say=P('Lost my house on the talon races. Won a better house on the slots. Lost that too. Grand day.'))
    m.npc(36, 25, 'Noble', name='TOURIST', walk=2, say=P('The Spire was built on a mesa so nobody can walk out without paying the lift.', 'Or falling. Some people fall.'))
    m.npc(12, 22, 'NinjaDark', name='CARD PLAYER', ev='a2_cards_spire', still=1, dir=2)
    m.npc(44, 22, 'GladiatorBlue', name='ARENA FAN', walk=1, say=P('The Battle Square takes all comers. Win streaks pay in Spire Tokens!'))
    m.npc(30, 34, 'KnightGold', name='SPIRE GUARD', still=1, dir=2, say=P('Behave. The owner sees everything.'))
    return m, D

def gilded_ins(D):
    to = lambda k: ('gilded_spire',) + D[k]; out = []
    a = interior('gs_arcana', 'Arcana Hall', 22, 15, to('gs_arcana'), floor='carpet', wall='wood', door=10, music='chill')
    for (x, y) in ((3, 4), (9, 4), (15, 4), (3, 9), (15, 9)): table(a, x, y)
    a.npc(4, 3, 'Sultan2', name='ARCANA MASTER', ev='a2_cards_master', still=1, dir=2)
    a.npc(10, 3, 'Princess', name='DUCHESS', ev='a2_cards_duchess', still=1, dir=2)
    a.npc(16, 8, 'Monk2', name='MONK', ev='a2_cards_monk', still=1, dir=2); out.append(a)
    s = interior('gs_shop', 'Spire Exchange', 12, 10, to('gs_shop'), floor='marble', wall='pale', door=6); counter(s, 3, 8, 4)
    s.npc(5, 3, 'Noble', name='EXCHANGER', ev='a2_exchange', dir=2, still=1); out.append(s)
    h = interior('gs_hotel', 'The Gilded Rest', 22, 15, to('gs_hotel'), floor='carpet', wall='pale', door=10)
    counter(h, 7, 13, 5); [bed(h, x, 9) for x in (2, 4, 16, 18)]; h.npc(10, 4, 'Princess', name='CONCIERGE', ev='inn_spire', dir=2, still=1); out.append(h)
    r = interior('gs_arena', 'Battle Square', 20, 14, to('gs_arena'), floor='sand', wall='brick', door=9, music='battle'); r.npc(9, 4, 'KnightGold', name='ARENA MASTER', ev='a2_arena', dir=2, still=1); out.append(r)
    t = interior('gs_race', 'Talon Track', 22, 14, to('gs_race'), floor='sand', wall='wood', door=10, music='spire'); t.npc(10, 4, 'Hunter', name='BOOKIE', ev='a2_race', dir=2, still=1); out.append(t)
    l = interior('gs_slots', 'Lucky Sevens', 14, 10, to('gs_slots'), floor='carpet', wall='wood', door=7)
    for x in range(2, 12, 2): put(l, 'console', x, 3)
    l.event(2, 4, 'a2_slots', 10, 1, touch=False); out.append(l)
    g = interior('gs_gallery', 'Shooting Gallery', 14, 10, to('gs_gallery'), floor='planks', wall='wood', door=7); g.npc(7, 3, 'Villager4', name='GALLERY MAN', ev='a2_gallery', dir=2, still=1); out.append(g)
    return out

def prison():
    m, info = gen('spire_prison', 'Spire Prison', 62, 46, 'ruins', 811, enc='prison', rooms=13, chests=['hi_potion', ('gold', 1200), 'prism:counter', 'remedy', 'titan_band'], music='desert')
    m.dark = 0
    e = info['rooms'][0]; m.entry = list(e.c())
    m.event(e.x + 1, e.y + 1, 'a2_prison_in', e.w - 2, 1, unless='a2_prison_in')
    q = info['rooms'][-1]
    m.event(q.x, q.y + q.h // 2, 'a2_harl', q.w, 1, unless='a2_prison_out')
    savepoint(m, info['rooms'][-2].x + 1, info['rooms'][-2].y + 1)
    # villagers of the pit
    for k, (who, line) in enumerate((('Caveman', 'Everyone down here was framed. Me, I actually did it. Feels lonely.'), ('Villager2', 'Harl runs the pit. He used to be a soldier. Aurex.'),
                                     ('OldMan3', 'The only way out is the Owner\'s pardon. Or the sand. The sand takes everyone eventually.'))):
        r = info['rooms'][1 + k * 3]; m.npc(r.x + 1, r.y + 1, who, name='PRISONER', still=1, dir=2, say=[line])
    return m

# ---------------- the Old Mine ----------------
def oldmine():
    ms = []; infos = []
    loot = [['prism:earth', ('potion', 4), 'hi_potion'], ['volt_lance' if False else 'breach_lance', 'carbon_band' if False else 'mythril_vest', ('gold', 1400)],
            ['ether', 'prism:gravity', 'silver_glasses'], ['dawn_edge', 'x_potion', 'prism:mp_plus']]
    for k in range(4):
        m, info = gen('oldmine' if k == 0 else 'oldmine_%d' % (k + 1), 'Old Mine' + ('', ' - Lower Shafts', ' - Flooded Seam', ' - Deep Vein')[k], 58, 44, 'mine', 700 + k, enc='mine', rooms=12, chests=loot[k], pools=0.4 if k == 2 else 0)
        ms.append(m); infos.append(info)
    for k in range(3): link(ms[k], infos[k]['rooms'][-1], ms[k + 1], infos[k + 1]['rooms'][0])
    switches(ms[1], infos[1], 3, 'mine_levers2', 'lever')
    e = infos[0]['rooms'][0]; door_up(ms[0], e.x + e.w // 2 - 1, e.y - 1, '@world', 0, 0); ms[0].entry = [e.x + e.w // 2, e.y + 1]
    q = infos[3]['rooms'][-1]; ms[3].event(q.x, q.y + q.h // 2, 'a2_moleking', q.w, 1, unless='a2_mine')
    door_up(ms[3], q.x + q.w // 2 - 1, q.y - 1, '@world', 114, 60)
    ms[3].warps[-1]['flag'] = 'a2_mine'; ms[3].warps[-2]['flag'] = 'a2_mine'
    savepoint(ms[1], infos[1]['rooms'][0].x + 1, infos[1]['rooms'][0].y + 1); savepoint(ms[3], infos[3]['rooms'][-2].x + 1, infos[3]['rooms'][-2].y + 1)
    r = infos[2]['rooms'][2]; ms[2].npc(r.x + 1, r.y + 1, 'Blacksmith', name='OLD MINER', still=1, dir=2, ev='a2_miner')
    return ms

# ---------------- Windhaven, the Catacombs and the Wind Shrine ----------------
def windhaven():
    m = town('windhaven', 'Windhaven', 56, 44, ground='grass', seed=41, music='temple')
    m.ground('cobble', 26, 3, 29, 43); m.ground('cobble', 4, 22, 51, 24); m.ground('marble', 20, 4, 35, 12)
    D = doors(m, [(8, 10, 'tan', 'wh_inn'), (15, 11, 'shop', 'wh_items'), (40, 11, 'red', 'wh_arms'), (46, 10, 'green', 'wh_prism'), (10, 30, 'wood', None), (42, 31, 'orange', 'wh_elder')])
    # the shrine gate (north): pillars and a great door
    for x in (21, 24, 31, 34): put(m, 'pillar', x, 6)
    m.walls('stone', 24, 3, 31, 4); m.wall[m.i(27, 4)] = m.wall[m.i(28, 4)] = None; m.ground('marble', 27, 4, 28, 4)
    m.warp(27, 4, 'wind_shrine_1', 0, 0, 0, 2, flag='a2_drain')
    m.event(26, 5, 'a2_shrine_gate', 4, 1, unless='a2_drain')
    # the catacombs entrance (east)
    m.stamp('dungeon', 2, 3, 49, 16); m.warp(49, 16, 'wh_cat_1', 0, 0, 2); m.sign(50, 17, 'Catacombs of the Windkeepers. Enter in silence.')
    savepoint(m, 31, 26)
    for (x, y) in ((18, 18), (37, 18), (18, 28), (37, 28)): put(m, 'statue', x, y)
    deco_town(m, 42)
    exit_south(m, 26, 4)
    m.entry = [27, 41]
    m.event(25, 36, 'a2_wind', 6, 1, unless='a2_wind')
    m.npc(28, 14, 'Monk', name='WINDKEEPER', still=1, dir=2, ev='a2_windkeeper')
    m.npc(20, 23, 'Villager3', name='PILGRIM', walk=2, say=['The Wind Crystal sings at dawn. You can hear it from the whole valley.', '...It\'s been quieter lately.'])
    m.npc(36, 26, 'Knight', name='AUREX ENGINEER', still=1, dir=2, say=['Drill rig\'s ready. The doctor says we start at the shrine tonight.'], if_='a2_wind&!a2_engine')
    return m, D

def windhaven_ins(D):
    to = lambda k: ('windhaven',) + D[k]; out = []
    i = interior('wh_inn', 'Gale Inn', 14, 11, to('wh_inn'), door=6); counter(i, 3, 8, 4); bed(i, 1, 6); bed(i, 12, 6); i.npc(5, 3, 'Woman', name='INNKEEPER', ev='inn_wind', dir=2, still=1); out.append(i)
    s = interior('wh_items', 'Pilgrim Supplies', 12, 10, to('wh_items'), door=6); counter(s, 3, 8, 4); s.npc(5, 3, 'Villager5', name='SUPPLIER', shop='wh_items', dir=2, still=1); out.append(s)
    a = interior('wh_arms', 'Windsmith', 12, 10, to('wh_arms'), floor='darkcobble', wall='brick', door=6); counter(a, 3, 8, 4); a.npc(5, 3, 'Blacksmith', name='WINDSMITH', shop='wh_arms', dir=2, still=1); out.append(a)
    p = interior('wh_prism', 'Shrine Prisms', 12, 10, to('wh_prism'), floor='marble', wall='pale', door=6); counter(p, 3, 8, 4); p.npc(5, 3, 'Monk2', name='ACOLYTE', shop='wh_prism', dir=2, still=1); out.append(p)
    e = interior('wh_elder', 'Elder\'s House', 12, 10, to('wh_elder'), door=6); bookcase(e, 1, 2); e.npc(6, 4, 'Master', name='ELDER SORREL', ev='a2_elder', dir=2, still=1); out.append(e)
    return out

def catacombs_shrine():
    out = []
    c1, i1 = gen('wh_cat_1', 'Windhaven Catacombs', 54, 42, 'temple', 901, enc='catacombs', rooms=12, chests=['prism:holy' if False else 'prism:revive', ('gold', 1600), 'silver_glasses'], music='crypt')
    c2, i2 = gen('wh_cat_2', 'Catacombs - Ossuary', 56, 42, 'temple', 902, enc='catacombs', rooms=12, chests=['regen_charm', 'x_potion', 'prism:seal'], music='crypt')
    c1.dark = c2.dark = 2
    e = i1['rooms'][0]; door_up(c1, e.x + e.w // 2 - 1, e.y - 1, 'windhaven', 49, 17); c1.entry = [e.x + e.w // 2, e.y + 1]
    link(c1, i1['rooms'][-1], c2, i2['rooms'][0])
    q = i2['rooms'][-1]; c2.event(q.x, q.y + q.h // 2, 'a2_lich', q.w, 1, unless='a2_lich')
    savepoint(c2, i2['rooms'][-2].x + 1, i2['rooms'][-2].y + 1)
    out += [c1, c2]
    ss = []; infos = []
    loot = [['hi_potion', 'prism:aero'], ['storm_brand' if False else 'wind_cutter', 'ether'], ['aurora_staff' if False else 'lumen_staff', ('gold', 2200)], ['prism:time', 'carbon_band'], ['x_potion', 'swift_boots']]
    for k in range(5):
        m, info = gen('wind_shrine_%d' % (k + 1), 'Wind Shrine - ' + ('Gate of Breath', 'Hall of Echoes', 'Gale Stair', 'Sky Cloister', 'Crystal Heart')[k], 52, 42, 'temple', 950 + k, enc='shrine', rooms=11, chests=loot[k], music='temple')
        ss.append(m); infos.append(info)
    for k in range(4): link(ss[k], infos[k]['rooms'][-1], ss[k + 1], infos[k + 1]['rooms'][0], down=False)
    switches(ss[1], infos[1], 4, 'ws_runes2', 'rune'); switches(ss[3], infos[3], 4, 'ws_runes4', 'rune')
    e = infos[0]['rooms'][0]; door_up(ss[0], e.x + e.w // 2 - 1, e.y + e.h, 'windhaven', 27, 5) if False else None
    m0 = ss[0]; y = e.y + e.h; x0 = e.x + e.w // 2 - 1
    for k in range(2): m0.wall[m0.i(x0 + k, y)] = None; m0.ground(m0.under, x0 + k, y, x0 + k, y)
    m0.warp(x0, y, 'windhaven', 27, 5, 2, 2); m0.entry = [x0, y - 1]
    # Drago on the Gale Stair (rival fight 2), Aurex's drill crew, the engine at the heart
    q = infos[2]['rooms'][len(infos[2]['rooms']) // 2]; ss[2].event(q.x, q.y + q.h // 2, 'a2_drago2', q.w, 1, unless='a2_drago2')
    q = infos[4]['rooms'][-1]; ss[4].event(q.x, q.y + q.h - 2, 'a2_engine', q.w, 1, unless='a2_engine')
    put(ss[4], 'crystal_big', q.x + q.w // 2 - 1, q.y + 1)
    savepoint(ss[2], infos[2]['rooms'][0].x + 1, infos[2]['rooms'][0].y + 1); savepoint(ss[4], infos[4]['rooms'][-2].x + 1, infos[4]['rooms'][-2].y + 1)
    return out + ss

def build():
    th, Dt = thornbrook(); thi = thornbrook_ins(Dt); fix_doors(th, thi)
    ks, Dk = kestrel(); ksi = kestrel_ins(Dk); fix_doors(ks, ksi)
    gs, Dg = gilded(); gsi = gilded_ins(Dg); fix_doors(gs, gsi)
    wh, Dw = windhaven(); whi = windhaven_ins(Dw); fix_doors(wh, whi)
    return [th] + thi + mistwood() + [ks] + ksi + [gs] + gsi + [prison()] + oldmine() + [wh] + whi + catacombs_shrine()
