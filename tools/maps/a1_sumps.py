"""Act I, part 2: the Sumps (Halcyon's undercity, under the plate), its houses and the Spillway bar.

Flags used by the people here (set by the story events in src/content/a1_story.js):
  a1_woke   Kael has woken in the Sumps after the fall      a1_spill   met Undercurrent at the Spillway
  a1_seal   Aurex has sealed the Sumps                        a1_stair   the way up the Spire Stair is open
"""
from _kit import *
from _gen import put, prop

W, H = 80, 60
D = {}   # interior id -> where you come out in the Sumps (one below the door)
def door(m, x, y, kind, mid, ix, iy):
    dx, dy = house(m, x, y, kind, to=(mid, ix, iy)); D[mid] = (dx, dy + 1)

def sumps():
    m = Map('sumps', W, H, 'The Sumps', music='slums', kind='town', dark=1)
    m.under = 'dirt'
    m.ground('dirt', 0, 0, W - 1, H - 1)
    # the plate's foundations hem the Sumps in
    m.walls('dark', 0, 0, W - 1, 1); m.walls('dark', 0, H - 2, W - 1, H - 1); m.walls('dark', 0, 0, 1, H - 1); m.walls('dark', W - 2, 0, W - 1, H - 1)
    # streets
    m.ground('cobble', 2, 26, W - 3, 28)                 # Lantern Row (east-west)
    m.ground('cobble', 28, 2, 30, H - 3)                 # Pillar Street (north-south)
    m.ground('cobble', 30, 12, 66, 13)                   # up to the plate pillar
    m.ground('cobble', 64, 4, 66, 13)
    m.ground('darkcobble', 22, 20, 36, 34)               # Cinder Square
    m.ground('cobble', 30, 44, 60, 45)                   # Sump Lane
    # the runoff canal and its bridges
    m.ground('poison', 40, 2, 42, H - 3)
    for y0 in (12, 26, 44): m.ground('planks', 40, y0, 42, y0 + (2 if y0 == 26 else 1))
    # --- the landing site: a scrap heap where Lyra grows crystal-moss flowers ---
    m.ground('grass', 6, 6, 14, 11)
    flowers(m, [(7, 7), (8, 8), (10, 7), (12, 8), (13, 10), (9, 10), (7, 10), (11, 9)])
    for (x, y) in ((6, 6), (14, 6), (6, 11), (14, 11)): prop(m, 'crystal_s', x, y)
    for (x, y) in ((3, 3), (4, 3), (3, 4), (17, 3), (18, 4), (3, 14), (4, 15), (17, 15)): prop(m, 'rock', x, y)
    for (x, y) in ((16, 8), (5, 13), (18, 12)): prop(m, 'crate', x, y)
    put(m, 'bigrock', 15, 4); put(m, 'bigrock', 2, 8)
    m.event(10, 9, 'a1_flowerbed', touch=False)
    # --- houses and buildings (doors lead to the interiors below) ---
    door(m, 21, 6, 'green', 'lyra_home', 7, 10)
    door(m, 13, 19, 'hall', 'spillway', 11, 14)
    door(m, 24, 14, 'orange', 'sumps_inn', 7, 10)
    door(m, 45, 19, 'shop', 'sumps_items', 6, 8)
    door(m, 51, 19, 'red', 'sumps_arms', 6, 8)
    door(m, 45, 32, 'tan', 'sumps_house1', 5, 8)
    door(m, 57, 32, 'wood', 'sumps_house2', 5, 8)
    door(m, 60, 6, 'hut', 'sumps_junk', 6, 8)
    door(m, 6, 32, 'orange2', 'sumps_clinic', 6, 8)
    door(m, 14, 46, 'longhouse', 'sumps_kids', 7, 10)
    # Cinder Square: the save point, the notice board, market carts, lamp posts
    savepoint(m, 31, 22)
    sign(m, 27, 21, 'NOTICE: By order of Aurex Security, the Sumps curfew starts at the second bell. Report Undercurrent activity for a reward.')
    for (x, y) in ((22, 20), (36, 20), (22, 34), (36, 34)): lamp(m, x, y)
    for (x, y) in ((24, 30), (25, 30), (34, 23)): barrel(m, x, y)
    crate(m, 33, 31); crate(m, 34, 31); crate(m, 34, 32)
    # scrap and junk all over
    for (x, y) in ((44, 3), (45, 3), (48, 8), (55, 4), (70, 20), (71, 21), (72, 20), (74, 38), (73, 39), (52, 50), (53, 51), (66, 52), (8, 52), (9, 53), (35, 52)):
        prop(m, 'rock', x, y)
    for (x, y) in ((44, 8), (47, 24), (58, 24), (66, 24), (10, 24), (5, 28), (60, 40), (20, 40), (36, 48)): barrel(m, x, y)
    for (x, y) in ((46, 8), (56, 24), (67, 24), (11, 24), (61, 40), (21, 40), (37, 48)): crate(m, x, y)
    for (x, y) in ((70, 30), (74, 30), (70, 34), (74, 34)): put(m, 'pipe_v', x, y)
    put(m, 'machine', 50, 8); put(m, 'machine', 72, 44); put(m, 'machine', 4, 40)
    # the kids' playground with tyres, and a dead tree
    m.ground('sand', 4, 38, 12, 43)
    for (x, y) in ((5, 39), (7, 41), (10, 39), (11, 42)): barrel(m, x, y)
    tree(m, 20, 36, 'dead'); tree(m, 66, 46, 'dead'); tree(m, 3, 20, 'dead')
    # the Spire Stair at the plate pillar (north east): an Aurex barricade until the way is open
    m.ground('metal', 62, 2, 68, 6); m.walls('metal', 62, 2, 68, 3)
    m.wall[m.i(64, 3)] = m.wall[m.i(65, 3)] = m.wall[m.i(66, 3)] = None; m.ground('metal', 64, 3, 66, 3)
    m.gate('a1_stair', 64, 3, 3, 1, tile=('dungeon', 5, 1))
    [m.warp(64 + k, 3, 'spire_1', 0, 0, 0, 1, flag='a1_stair') for k in range(3)]
    m.event(64, 4, 'a1_stair_locked', 3, 1, unless='a1_stair')
    sign(m, 61, 5, 'SPIRE STAIR - maintenance access to the upper plate. CLOSED.')
    # the drains (south): a manhole in Sump Lane
    m.stamp('dungeon', 2, 3, 33, 46); m.warp(33, 46, 'drains_1', 0, 0, 2)
    sign(m, 34, 47, 'Drain 9. Something big lives down here. Bounty posted at the Market Ward. - Wardens\' Hall')
    # the road east to the Market Ward
    for y in (26, 27, 28): m.warp(W - 3, y, 'market', 2, y - 4, 1)
    m.ground('cobble', W - 3, 26, W - 2, 28); m.wall[m.i(W - 2, 26)] = None
    shanty(m)
    m.entry = [10, 10]
    people(m)
    return m

def shanty(m, seed=9):
    """Fill the gaps with locked-up shacks, fences, scrap and puddles so the Sumps feels crowded."""
    import random
    r = random.Random(seed)
    def clear(x, y, w, h):
        for j in range(-1, h + 2):
            for k in range(-1, w + 1):
                X, Y = x + k, y + j
                if not m.ok(X, Y) or m.col[m.i(X, Y)] != OPEN or m.layers['deco'][m.i(X, Y)] >= 0 or m.mat[m.i(X, Y)] not in ('dirt',): return False
        return True
    n = 0
    for _ in range(900):
        kind = r.choice(['wood', 'mound', 'thatch', 'tan', 'orange', 'wood'])
        tx, ty, w, h = HOUSES[kind]; x, y = r.randint(2, W - w - 3), r.randint(2, H - h - 4)
        if clear(x, y, w, h):
            house(m, x, y, kind); n += 1
            dx = x + door_col(kind); m.sign(dx, y + h - 1, r.choice(['Locked. Someone inside is snoring.', 'Locked tight.', 'A note: GONE TO THE MARKET. DON\'T STEAL ANYTHING. - P',
                                                                    'Locked. A dog barks inside.', 'Boarded up since the last plate fall.', 'Nobody answers.']))
            m.setcol(dx, y + h - 1, SOLID)
        if n >= 26: break
    for _ in range(140):
        x, y = r.randint(2, W - 3), r.randint(2, H - 3)
        if clear(x, y, 1, 1): prop(m, r.choice(['rock', 'rock', 'crate', 'barrel', 'stump', 'bush']), x, y)
    for _ in range(14):
        x, y = r.randint(2, W - 8), r.randint(2, H - 4); L = r.randint(3, 6)
        if clear(x, y, L, 1): fence_h(m, x, x + L - 1, y)
    for _ in range(10):
        x, y = r.randint(2, W - 6), r.randint(2, H - 5)
        if clear(x, y, 3, 2): m.ground('water', x, y, x + r.randint(1, 2), y + 1)

def people(m):
    S = lambda *a: list(a)
    # Cinder Square
    m.npc(26, 24, 'Villager2', name='DOCKHAND', walk=2, say=S('The plate came down on Ash Lane in the night. Twelve streets, gone.',
          'Aurex says Undercurrent did it. Funny how Aurex is never the one who says sorry.'), if_='a1_woke')
    m.npc(32, 28, 'Woman', name='WASHER', walk=2, say=S('Lights went out at midnight, then the whole sky shook.', 'My boy says he saw a girl fall out of the sky with a young man. Like a story.'), unless='a1_spill')
    m.npc(32, 28, 'Woman', name='WASHER', walk=2, say=S('You\'re the two who fell! Lyra, love, you\'re all scraped up.', 'Go see the clinic. Doc Marrow won\'t take your money, he never does.'), if_='a1_spill&!a1_seal')
    m.npc(32, 28, 'Woman', name='WASHER', walk=2, say=S('They\'ve welded the lifts shut. Every one.', 'If they mean to starve us out, they\'ll find the Sumps has been hungry before.'), if_='a1_seal')
    m.npc(24, 32, 'OldMan3', name='OLD SALVAGER', still=1, dir=1, say=S('Forty years I\'ve been pulling copper out of the drains.', 'Back when I started you could still see the sky from Cinder Square. Then they finished the plate.',
          'Ever see the sky, lad? Real sky? Hah. Neither have most folk down here.'))
    m.npc(35, 27, 'Villager5', name='PEDLAR', still=1, dir=3, say=S('Lantern Row runs east to the Market Ward. Best prices this side of the canal.', 'The Pit\'s over there too. They say a Warden could make a fortune fighting in it.'))
    m.npc(29, 33, 'Villager', name='CURFEW MAN', walk=1, say=S('Second bell is curfew. Don\'t let the patrols catch you on Pillar Street after dark.', '...Though down here, it\'s always after dark, isn\'t it?'))
    # Lantern Row and the west
    m.npc(18, 27, 'Villager3', name='FLOWER GIRL', walk=2, say=S('Crystal-moss! Only Lyra can grow it, you know. It doesn\'t take for anyone else.', 'She says she sings to it. I tried singing to mine. It died anyway.'))
    m.npc(8, 27, 'Hunter', name='RAT CATCHER', walk=2, say=S('Rats in Drain 9 are big as dogs these days. Something\'s been feeding them.', 'Something bigger lives down there too. I\'ve heard it.'))
    m.npc(11, 36, 'Cavegirl', name='KID', walk=2, say=S('Are you a real Warden? With the oath and everything?', 'Say the oath! Say it! ...Aww.'), if_='a1_woke')
    m.npc(7, 40, 'Villager6', name='KID', walk=2, say=S('We\'re playing Undercurrent and Aurex. I\'m Undercurrent, I always win.'))
    # east
    m.npc(52, 27, 'GladiatorBlue', name='MERC', still=1, dir=2, say=S('The Pit pays two hundred a bout. Fighters\' gate is in the Market Ward.', 'Bring something better than that letter-opener, Warden.'))
    m.npc(60, 26, 'Villager4', name='SMITH', walk=2, say=S('If you see Grett, tell him I want my anvil back.', 'Grett runs the arms shop. He has my anvil. He knows what he did.'))
    m.npc(64, 36, 'OldWoman', name='GRANNY OSK', still=1, dir=2, ev='a1_osk')
    m.npc(70, 24, 'Knight', name='AUREX GUARD', still=1, dir=3, say=S('Move along. Nothing to see.'), unless='a1_seal')
    m.npc(63, 5, 'Knight', name='AUREX GUARD', still=1, dir=2, say=S('The Spire Stair is closed by order of Aurex Security.', 'Turn around.'), unless='a1_stair')
    m.npc(67, 5, 'KnightGold', name='AUREX SERGEANT', still=1, dir=2, say=S('Under the Containment Order, the Sumps is sealed until the terrorists are found.', 'You\'d better hope you aren\'t one of them.'), if_='a1_seal&!a1_stair')
    m.npc(56, 46, 'Inspector', name='INSPECTOR', walk=2, say=S('Aurex Water and Sanitation. We are investigating the... smell.', 'It has been eleven years.'))

def homes():
    out = []
    # Lyra's house: Lyra and Nan Corra (who took her in)
    h = interior('lyra_home', 'Lyra\'s House', 16, 13, ('sumps',) + D['lyra_home'], floor='planks', wall='wood', music='village', door=7)
    bed(h, 2, 3); bed(h, 4, 3); drawers(h, 7, 3); bookcase(h, 12, 3); table(h, 5, 7); plant(h, 1, 10); plant(h, 14, 10); pots(h, 14, 4)
    rug(h, 6, 8, 4, 2)
    h.npc(10, 6, 'OldWoman', id='corra', name='NAN CORRA', ev='a1_corra', dir=2, still=1)
    h.event(2, 5, 'a1_lyra_bed', 3, 1, touch=False)
    h.chest(13, 6, 'potion', 3)
    out.append(h)
    # the Spillway: Undercurrent's bar
    s = interior('spillway', 'The Spillway', 24, 17, ('sumps',) + D['spillway'], floor='planks', wall='wood', music='chill', door=11)
    counter(s, 3, 10, 6); shelf(s, 2, 3); shelf(s, 4, 3); shelf(s, 6, 3); bookcase(s, 8, 3)
    for (x, y) in ((14, 5), (19, 5), (14, 10), (19, 10)): table(s, x, y)
    for (x, y) in ((2, 13), (21, 13)): plant(s, x, y)
    for (x, y) in ((20, 3), (21, 3), (22, 4)): s.stamp('house', 17, 14, x, y, col=SOLID)
    s.stamp('elem', 7, 11, 2, 9); s.warp(2, 9, 'spillway_b', 4, 4, 2)          # stairs down to the hideout
    s.npc(6, 5, 'Princess', id='tess', name='TESS', ev='a1_tess', dir=2, still=1)
    s.npc(15, 6, 'pip', id='pip', ev='a1_pip_bar', dir=2, still=1, if_='a1_spill')
    s.npc(20, 11, 'marlo', id='marlo', ev='a1_marlo_bar', dir=3, still=1, if_='a1_spill')
    s.npc(17, 11, 'Villager2', name='DRUNK', still=1, dir=1, say=['Thish bar... thish bar ish the besht bar.', 'Tess! Tesh. Another one.'])
    s.npc(13, 13, 'Monk', name='STRANGER', still=1, dir=0, say=['The Aetherflow remembers everything that ever lived.', 'Every reactor is a mouth drinking it. What happens to memories that are drunk?'])
    out.append(s)
    b = Map('spillway_b', 22, 14, 'Undercurrent Hideout', music='story', kind='house'); b.under = 'darkcobble'
    room(b, 0, 0, 21, 13, floor='darkcobble', wall='dark', thick=3)
    b.stamp('elem', 6, 11, 3, 3); b.warp(3, 3, 'spillway', 3, 9, 1); b.entry = [3, 4]
    table(b, 9, 6); table(b, 12, 6); bookcase(b, 16, 3); drawers(b, 19, 3); put(b, 'machine', 18, 9); put(b, 'console', 7, 3)
    b.sign(10, 3, 'A hand-drawn map of the plate, the Spire Stair and Aurex Tower, pinned with knives.')
    b.stamp('house', 6, 2, 10, 3, col=SOLID)
    b.npc(11, 5, 'bram', id='bram', ev='a1_bram_hideout', dir=2, still=1, unless='a1_plan')
    b.npc(14, 8, 'sable', id='sable', ev='a1_sable_hideout', dir=3, still=1, unless='a1_plan')
    b.chest(20, 11, 'phoenix_down', 2)
    out.append(b)
    # inn
    n = interior('sumps_inn', 'Rusty Lantern Inn', 16, 12, ('sumps',) + D['sumps_inn'], floor='planks', wall='wood', door=7)
    counter(n, 4, 9, 5); bed(n, 1, 3); bed(n, 2, 3); bed(n, 13, 3); bed(n, 14, 3); plant(n, 1, 9); drawers(n, 11, 7)
    n.npc(7, 4, 'Villager', id='innkeep', name='INNKEEPER', ev='inn_sumps', dir=2, still=1)
    out.append(n)
    # item shop and arms shop
    i = interior('sumps_items', 'Odds & Ends', 13, 10, ('sumps',) + D['sumps_items'], floor='planks', wall='wood', door=6)
    counter(i, 3, 9, 4); shelf(i, 2, 3); shelf(i, 10, 3); pots(i, 11, 6); pots(i, 1, 6)
    i.npc(6, 3, 'Villager3', name='MAGDA', shop='sumps_items', dir=2, still=1)
    out.append(i)
    a = interior('sumps_arms', 'Grett\'s Arms', 13, 10, ('sumps',) + D['sumps_arms'], floor='darkcobble', wall='brick', door=6)
    counter(a, 3, 9, 4); a.stamp('house', 8, 9, 1, 3) if False else None; drawers(a, 10, 2); put(a, 'crate', 1, 6); put(a, 'crate', 11, 6)
    a.npc(6, 3, 'Blacksmith', name='GRETT', shop='sumps_arms', dir=2, still=1)
    a.npc(9, 6, 'Samurai', name='CUSTOMER', walk=1, say=['Grett says this blade belonged to a Warden.', 'Grett says that about everything.'])
    out.append(a)
    # clinic
    c = interior('sumps_clinic', 'Marrow\'s Clinic', 13, 10, ('sumps',) + D['sumps_clinic'], floor='tile', wall='pale', door=6)
    bed(c, 1, 3); bed(c, 3, 3); bed(c, 9, 3, 1); bed(c, 11, 3, 1); drawers(c, 5, 2); plant(c, 1, 7)
    c.npc(7, 5, 'Master', id='marrow', name='DOC MARROW', ev='a1_marrow', dir=2, still=1)
    c.npc(11, 6, 'Villager6', name='PATIENT', still=1, dir=3, say=['Fell off a scaffold on the Spire Stair. Aurex docked my pay for the scaffold.'])
    out.append(c)
    # two homes with side quests
    h1 = interior('sumps_house1', 'Teller House', 11, 10, ('sumps',) + D['sumps_house1'], floor='planks', wall='wood', door=5)
    bed(h1, 1, 3); bed(h1, 2, 3, 1); table(h1, 5, 5); plant(h1, 9, 7); drawers(h1, 7, 2)
    h1.npc(3, 6, 'Woman', id='ada', name='ADA TELLER', ev='a1_ada', dir=2, still=1)
    h1.npc(2, 5, 'Villager6', id='tam', name='TAM', still=1, dir=2, say=['*cough* ...Mum says the medicine is coming.'], unless='q_tam_done')
    h1.npc(2, 5, 'Villager6', id='tam', name='TAM', walk=1, say=['I feel loads better! Mum says you\'re a hero. Are you a hero?'], if_='q_tam_done')
    out.append(h1)
    h2 = interior('sumps_house2', 'Old Hask\'s Place', 11, 10, ('sumps',) + D['sumps_house2'], floor='planks', wall='wood', door=5)
    bed(h2, 1, 3); bookcase(h2, 7, 2); table(h2, 3, 6); pots(h2, 9, 6)
    h2.npc(5, 5, 'OldMan', id='hask', name='OLD HASK', ev='a1_hask', dir=2, still=1)
    out.append(h2)
    # the junk dealer in the hut
    j = interior('sumps_junk', 'Junk Mira\'s', 13, 10, ('sumps',) + D['sumps_junk'], floor='darkcobble', wall='dark', door=6)
    for (x, y) in ((1, 3), (2, 3), (1, 4), (10, 3), (11, 3), (11, 4)): put(j, 'crate', x, y)
    put(j, 'machine', 5, 3); put(j, 'pipe_v', 8, 3)
    j.npc(6, 6, 'Cavegirl', name='JUNK MIRA', shop='sumps_junk', dir=2, still=1)
    out.append(j)
    # the orphanage-run schoolroom (kids and the Arcana tutorial)
    k = interior('sumps_kids', 'Lantern Row School', 15, 12, ('sumps',) + D['sumps_kids'], floor='planks', wall='wood', door=7)
    for (x, y) in ((3, 6), (8, 6), (3, 9), (8, 9)): table(k, x, y)
    bookcase(k, 1, 2); bookcase(k, 12, 2); shelf(k, 4, 2)
    k.npc(7, 3, 'Princess', id='teacher', name='MISS ODELL', ev='a1_teacher', dir=2, still=1)
    k.npc(5, 7, 'Cavegirl', name='PUPIL', walk=1, say=['Miss Odell grew up in an orphanage too. In Thornbrook, far away.'])
    k.npc(10, 8, 'Villager6', name='PUPIL', still=1, dir=3, ev='a1_arcana_kid')
    out.append(k)
    return out

def fix_doors(outside, insides):
    """Point each door warp at the interior's entry (one step inside its exit)."""
    ins = {m.id: m for m in insides}
    for w in outside.warps:
        if w['to'] in ins and w['to'] != 'spillway_b': w['tx'], w['ty'] = ins[w['to']].entry

def build():
    m = sumps(); hs = homes(); fix_doors(m, hs)
    return [m] + hs
