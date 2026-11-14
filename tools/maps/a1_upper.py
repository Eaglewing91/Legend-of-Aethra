"""Act I, part 3: the Market Ward and the Pit, Drain 9, the Spire Stair, the upper plate, Aurex Tower and the Rail Yards.

market            the Market Ward bazaar (east of the Sumps)
market interiors  the Pit (arena), Wardens' Hall (bounties), Prism shop, Lucky Lantern (Arcana den)
drains_1..2, drains_lair   Drain 9 (optional; the Sump Leviathan bounty)
spire_1..6        the Spire Stair, the scaffold up the plate pillar (6 floors; a brute on 3)
plate_plaza       the upper plate before Aurex Tower
tower_1..8        lobby, Records, Records Annex, Labs, Specimen Labs, Executive floor, Cradle vault, roof
railyards         the freight yards: steal a train, leave Halcyon
"""
from _kit import *
from _gen import gen, link, stairs, door_up, put, prop
from a1_reactor import pad

def market():
    W, H = 64, 46
    m = Map('market', W, H, 'Market Ward', music='city', kind='town', dark=1)
    m.under = 'cobble'
    m.ground('dirt', 0, 0, W - 1, H - 1)
    m.walls('dark', 0, 0, W - 1, 1); m.walls('dark', 0, H - 2, W - 1, H - 1); m.walls('dark', W - 2, 0, W - 1, H - 1); m.walls('dark', 0, 0, 1, H - 1)
    m.ground('cobble', 1, 21, W - 3, 25)                  # the bazaar street
    m.ground('cobble', 30, 3, 34, H - 3)                  # Gallows Walk (north-south)
    m.ground('darkcobble', 22, 14, 42, 32)                # the market square
    m.ground('water', 30, 21, 34, 25); m.ground('cobble', 31, 22, 33, 24)
    put(m, 'statue', 32, 22)                              # the statue of Halcyon's founder in a dry fountain
    m.sign(32, 24, 'AURELIAN AUREX, FOUNDER. "Light for every home." (Someone has scratched: EXCEPT OURS.)')
    for x in (1, 2): m.wall[m.i(x, 22)] = None
    for y in (22, 23, 24): m.warp(1, y, 'sumps', W and 76, y + 4, 3)
    # stalls: counters with goods along the square
    for (x, y, k) in ((23, 16, 'food'), (27, 16, 'cloth'), (37, 16, 'tools'), (23, 29, 'herbs'), (37, 29, 'junk')):
        for d in range(3): m.stamp('elem', 3, 10, x + d, y, col=COUNTER)
        m.stamp('house', 16 + (x % 3), 12, x - 1, y, col=SOLID); m.stamp('house', 17, 14, x + 3, y, col=SOLID)
    m.npc(24, 15, 'Villager4', name='GRILL COOK', still=1, dir=2, say=['Skewers! Sump-rat skewers! ...It\'s chicken. Mostly.'])
    m.npc(28, 15, 'Woman', name='CLOTH SELLER', still=1, dir=2, say=['Aurex blue is out of fashion this week. Everyone\'s wearing grey. Grey hides the soot.'])
    m.npc(38, 15, 'Villager5', name='TOOL TRADER', shop='market_tools', still=1, dir=2)
    m.npc(24, 28, 'Villager3', name='HERBALIST', shop='market_herbs', still=1, dir=0)
    m.npc(38, 28, 'Sultan2', name='SCRAP KING', shop='market_junk', still=1, dir=0)
    # buildings
    D = {}
    def door(x, y, kind, mid):
        dx, dy = house(m, x, y, kind, to=(mid, 0, 0)); D[mid] = (dx, dy + 1)
    door(6, 13, 'hall', 'pit')
    door(14, 14, 'red', 'wardens_hall')
    door(46, 14, 'green', 'prism_shop')
    door(52, 28, 'orange2', 'lucky_lantern')
    door(44, 33, 'tan', 'market_house')
    m.sign(10, 21, 'THE PIT - fighters wanted. Glory, gold, small risk of death.')
    m.sign(18, 21, 'WARDENS\' HALL - bounties posted daily.')
    # north: the Aurex lift (sealed) and checkpoint
    m.ground('metal', 28, 2, 36, 6); m.walls('metal', 28, 2, 36, 3)
    m.gate('0', 31, 4, 3, 1, tile=('dungeon', 5, 1))
    m.sign(30, 6, 'PLATE LIFT 3 - OUT OF SERVICE (Containment Order)')
    m.npc(29, 7, 'Knight', name='LIFT GUARD', still=1, dir=2, say=['Lift\'s closed. Has been since the reactor.', 'The Spire Stair? That\'s closed too. Everything\'s closed. Go home.'])
    # filler
    for (x, y) in ((4, 4), (5, 4), (12, 5), (50, 4), (58, 6), (59, 6), (8, 38), (20, 40), (55, 40), (58, 18), (59, 19)): prop(m, 'crate' if (x + y) % 2 else 'barrel', x, y)
    for (x, y) in ((22, 14), (42, 14), (22, 32), (42, 32)): lamp(m, x, y)
    for (x, y) in ((3, 30), (60, 10), (16, 38)): tree(m, x, y, 'dead')
    house(m, 54, 4, 'wood'); house(m, 4, 34, 'mound'); house(m, 20, 36, 'thatch'); house(m, 56, 36, 'wood')
    for kind_x in ((54, 'wood'), (4, 'mound'), (20, 'thatch'), (56, 'wood')): pass
    # people
    m.npc(32, 27, 'Villager', name='TOWN CRIER', walk=1, say=['Hear ye! Aurex Security reports that Undercurrent terrorists destroyed Reactor 4!', 'Hundreds dead! The Containment Order is for your protection! Hear ye!'], unless='a1_stair')
    m.npc(26, 23, 'NinjaDark', name='CARD SHARP', ev='a1_cardsharp', still=1, dir=2)
    m.npc(44, 23, 'Noble', name='TOURIST', walk=2, say=['I came down from the plate for the authentic undercity experience.', 'It\'s very... authentic. Is that smell normal?'])
    m.npc(12, 26, 'GladiatorBlue', name='PIT FIGHTER', walk=1, say=['Gorr the Unbroken is still champion. Thirty-one wins.', 'Last fella who fought him still walks funny.'])
    m.npc(48, 24, 'Villager2', name='PORTER', walk=2, say=['Aurex doubled the plate toll this morning. Doubled!', 'They say it\'s to pay for the reactor. The reactor THEY blew up, if you ask me.'])
    m.npc(36, 38, 'OldMan2', name='STORYTELLER', still=1, dir=2, say=['Long ago, the Chorus sang the world awake, and the Crystals held up the sky.', 'Now we burn the Crystals\' blood for lamplight. And we wonder why the sky looks tired.'])
    m.entry = [3, 23]
    return m, D

def market_interiors(D):
    out = []
    to = lambda mid: ('market',) + D[mid]
    p = interior('pit', 'The Pit', 24, 18, to('pit'), floor='sand', wall='brick', music='battle', door=11)
    m = p
    for x in range(3, 21): m.stamp('house', 11, 4, x, 6, col=LOW)       # the ring rail
    m.ground('sand', 3, 7, 20, 15)
    for x in range(2, 22, 3): put(m, 'barrel', x, 3)
    m.npc(11, 5, 'KnightGold', id='pitmaster', name='PITMASTER VORN', ev='a1_pit', dir=2, still=1)
    m.npc(4, 4, 'Villager2', name='BETTOR', still=1, dir=2, say=['Ten on the Warden! No, wait. Ten on whatever he\'s fighting.'])
    m.npc(19, 4, 'Woman', name='FAN', still=1, dir=2, say=['Gorr! GORR! GORRRR! ...Sorry. Who are you?'])
    out.append(p)
    w = interior('wardens_hall', 'Wardens\' Hall', 16, 12, to('wardens_hall'), floor='tile', wall='brick', music='town', door=7)
    counter(w, 4, 10, 5); bookcase(w, 1, 3); bookcase(w, 13, 3); table(w, 5, 8)
    w.stamp('house', 6, 2, 7, 3, col=SOLID); w.event(7, 3, 'a1_bounty_board', touch=False)
    w.npc(8, 4, 'Knight', id='clerk', name='WARDEN CLERK', ev='a1_bounty', dir=2, still=1)
    w.npc(3, 8, 'SamuraiBlue', name='WARDEN', still=1, dir=1, say=['Another Academy pup? Welcome to the Halcyon chapter.', 'Remember the Code: the contract is sacred, the client is not. Know the difference.'])
    out.append(w)
    s = interior('prism_shop', 'Prismatics', 13, 10, to('prism_shop'), floor='marble', wall='pale', music='mystic', door=6)
    counter(s, 3, 9, 4); put(s, 'crystal_s', 1, 3); put(s, 'crystal_s', 11, 3); put(s, 'orb', 1, 7); put(s, 'orb', 11, 7)
    s.npc(6, 3, 'SorcererOrange', name='VELLA', shop='prism_shop', dir=2, still=1)
    s.npc(9, 6, 'Monk2', name='SCHOLAR', still=1, dir=3, say=['A Prism is Aetherflow that cooled into thought. Slot one and you remember a spell you never learned.', 'Link two and they remember each other. Isn\'t that lovely?'])
    out.append(s)
    l = interior('lucky_lantern', 'The Lucky Lantern', 16, 12, to('lucky_lantern'), floor='carpet', wall='wood', music='chill', door=7)
    for (x, y) in ((2, 4), (7, 4), (12, 4), (4, 8), (10, 8)): table(l, x, y)
    l.npc(3, 3, 'Sultan', name='DEALER', still=1, dir=2, ev='a1_arcana_dealer')
    l.npc(8, 3, 'Noble', name='ARCANA PLAYER', still=1, dir=2, ev='a1_arcana_noble')
    l.npc(5, 7, 'Monk', name='OLD PLAYER', still=1, dir=2, say=['Arcana is older than Aurex. Older than Halcyon. The Chorus played it, they say.', 'Win a card, lose a card. That\'s the house rule here.'])
    out.append(l)
    h = interior('market_house', 'Pell House', 12, 10, to('market_house'), floor='planks', wall='wood', door=6)
    bed(h, 1, 3); drawers(h, 8, 2); table(h, 3, 6)
    h.npc(5, 5, 'Villager3', id='pell', name='MRS PELL', ev='a1_pell', dir=2, still=1)
    out.append(h)
    return out

def drains():
    d1, i1 = gen('drains_1', 'Drain 9', 56, 42, 'sewer', 91, enc='drains', rooms=12, pools=0.7, chests=['antidote', ('potion', 2), 'eye_drops', ('gold', 180), 'prism:poison'])
    d2, i2 = gen('drains_2', 'Drain 9 - Deep Cistern', 60, 44, 'sewer', 92, enc='drains', rooms=13, pools=0.8, chests=['hi_potion', 'stiletto', 'prism:hp_plus', ('gold', 260), 'echo_screen'])
    e = i1['rooms'][0]; dx = e.x + e.w // 2
    door_up(d1, dx, e.y - 1, 'sumps', 33, 47, 1); d1.entry = [dx, e.y + 1]
    link(d1, i1['rooms'][-1], d2, i2['rooms'][0])
    q = i2['rooms'][-1]; cx = q.x + q.w // 2 - 1
    door_up(d2, cx, q.y - 1, 'drains_lair', 11, 17)
    savepoint(d2, q.x + 1, q.y + 1)
    lair = Map('drains_lair', 24, 22, 'Leviathan\'s Cistern', music='cave', kind='dungeon', dark=1); lair.under = 'darkcobble'
    room(lair, 0, 0, 23, 21, floor='darkcobble', wall='dark', thick=3)
    lair.ground('poison', 3, 5, 20, 13); lair.ground('planks', 10, 5, 13, 18)
    lair.warp(11, 20, 'drains_2', cx, q.y + 1, 2, 2); lair.wall[lair.i(11, 21)] = None
    for x in (11, 12): lair.wall[lair.i(x, 20)] = None; lair.ground('darkcobble', x, 20, x, 20)
    lair.entry = [11, 18]
    lair.event(10, 14, 'a1_leviathan', 4, 1, unless='bounty_leviathan')
    lair.chest(2, 17, 'prism:counter'); lair.chest(21, 17, 'guard_ring')
    return [d1, d2, lair], (dx, e.y + 1)

def spire():
    maps = []; infos = []
    loot = [['potion', 'grenade', ('gold', 200)], ['phoenix_down', 'prism:ice', 'hi_potion'], ['rifle_lance', ('potion', 3), 'antidote'],
            ['copper_staff', 'ether', ('gold', 400)], ['titan_band', 'prism:cover', 'hi_potion'], ['prism:steal', 'stiletto', ('gold', 500)]]
    names = ['Base Scaffold', 'Girder Run', 'Crane Deck', 'Wind Gallery', 'Rivet Heights', 'Top Spar']
    for k in range(6):
        m, info = gen('spire_%d' % (k + 1), 'Spire Stair - ' + names[k], 46, 40, 'factory', 300 + k, enc='spire', rooms=10, chests=loot[k], minr=(6, 5), maxr=(12, 8))
        maps.append(m); infos.append(info)
    for k in range(5): link(maps[k], infos[k]['rooms'][-1], maps[k + 1], infos[k + 1]['rooms'][0], down=False)
    # bottom door back to the Sumps, top door to the plate
    e = infos[0]['rooms'][0]; dx = e.x + e.w // 2 - 1
    door_up(maps[0], dx, e.y + e.h, 'sumps', 64, 4, 3) if False else None
    m0 = maps[0]; y = e.y + e.h
    for k in range(3): m0.wall[m0.i(dx + k, y)] = None; m0.ground('metal', dx + k, y, dx + k, y)
    m0.warp(dx, y, 'sumps', 64, 4, 2, 3); m0.entry = [dx + 1, y - 1]
    q = infos[5]['rooms'][-1]; tx = q.x + q.w // 2 - 1
    door_up(maps[5], tx, q.y - 1, 'plate_plaza', 19, 27)
    # the brute on the Crane Deck; save points on floors 3 and 5
    q3 = infos[2]['rooms'][-1]
    maps[2].event(q3.x, q3.y + q3.h - 2, 'a1_brute', q3.w, 1, unless='spire_brute')
    savepoint(maps[2], infos[2]['rooms'][-2].x + 1, infos[2]['rooms'][-2].y + 1)
    savepoint(maps[4], infos[4]['rooms'][0].x + 1, infos[4]['rooms'][0].y + 1)
    # a wind gallery: a story stop where you can see the whole city (floor 4)
    r4 = infos[3]['rooms'][len(infos[3]['rooms']) // 2]
    maps[3].event(r4.x + 1, r4.y + 1, 'a1_view', r4.w - 2, 1, unless='a1_view')
    return maps, (dx + 1, y - 1), (tx, q.y + 1)

def plate_plaza(spire_top):
    rows = pad([
        '########################################',
        '##############ppp......ppp##############',
        '##############............##############',
        '##############............##############',
        '###########....................#########',
        '#####,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,####',
        '###..,..o.......,,,,,,.......o.....,..##',
        '##...,..........,,,,,,.............,...#',
        '#....,...TT.....,,,,,,.....TT......,...#',
        '#....,...TT.....,,,,,,.....TT......,...#',
        '#....,..........,,,,,,.............,...#',
        '#....,,,,,,,,,,,,~~~~,,,,,,,,,,,,,,,...#',
        '#....,.........,,~~~~,,............,...#',
        '#....,..o......,,~~~~,,.......o....,...#',
        '#....,..........,,,,,,.............,...#',
        '#....,...TT.....,,,,,,.....TT......,...#',
        '#....,...TT.....,,,,,,.....TT......,...#',
        '#....,..........,,,,,,.............,...#',
        '#....,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,...#',
        '#...............,,,,,,.................#',
        '#..b.c..........,,,,,,...........c.b...#',
        '#...............,,,,,,.................#',
        '#######.........,,,,,,.........#########',
        '##########......,,,,,,.....#############',
        '##############..,,,,,,..################',
        '##############..,,,,,,..################',
        '###################..###################',
        '###################..###################',
        '########################################',
    ], 40)
    m = Map('plate_plaza', 40, 29, 'Upper Plate - Aurex Plaza', music='city', kind='town')
    m.under = 'tile'
    grid(m, rows, {'#': (None, 'pale'), '.': ('tile',), ',': ('marble',), '~': ('water',), 'o': ('tile', None, lambda m, x, y: lamp(m, x, y)),
                   'T': ('grass',), 'b': ('tile', None, 'barrel'), 'c': ('tile', None, 'crate'), 'p': ('tile', None, 'pillar')})
    for (x, y) in ((9, 8), (27, 8), (9, 15), (27, 15)): tree(m, x, y, 'round')
    for x in range(18, 22): m.wall[m.i(x, 1)] = None
    # the tower doors: the top of the plaza
    m.ground('marble', 18, 1, 21, 1); m.warp(18, 1, 'tower_1', 15, 21, 0, 4)
    m.warp(19, 27, 'spire_6', spire_top[0], spire_top[1], 2, 2)
    m.entry = [19, 25]
    m.event(14, 4, 'a1_plaza', 12, 1, unless='a1_plaza')
    m.sign(17, 6, 'AUREX DYNAMICS - HEADQUARTERS. "Power for a brighter Aethra."')
    m.npc(15, 3, 'Knight', name='TOWER GUARD', still=1, dir=2, say=['...'], unless='a1_plaza')
    m.npc(24, 3, 'Knight', name='TOWER GUARD', still=1, dir=2, say=['...'], unless='a1_plaza')
    m.npc(6, 12, 'Noble', name='PLATE LADY', walk=1, say=['The undercity? I\'ve never been. Is it true they have no sky down there?', 'How do they know what time it is?'])
    m.npc(32, 19, 'Inspector', name='CLERK', walk=1, say=['I just process the forms. Containment forms, demolition forms, compensation forms.', 'We\'ve never actually approved a compensation form.'])
    savepoint(m, 33, 22)
    return m

def tower(spire_top):
    out = []
    # lobby
    rows = pad([
        '####################################',
        '####################################',
        '####################################',
        '##pp....pp....SS....pp........pp####',
        '##..............................####',
        '##..m.....kkkkkkkkkkkk.....m....####',
        '##..............................####',
        '##,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,####',
        '##,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,####',
        '##..o...........,,.........o....####',
        '##..............,,..............####',
        '##..cc..........,,..........cc..####',
        '##..............,,..............####',
        '##..............,,..............####',
        '##..o...........,,.........o....####',
        '##..............,,..............####',
        '##..............,,..............####',
        '##..m...........,,..........m...####',
        '##..............,,..............####',
        '##..............,,..............####',
        '##..............,,..............####',
        '##..............,,..............####',
        '##..............,,..............####',
        '################,,##################',
        '####################################',
    ], 36)
    t1 = Map('tower_1', 36, 25, 'Aurex Tower - Lobby', music='factory', kind='dungeon'); t1.under = 'marble'
    grid(t1, rows, {'#': (None, 'pale'), '.': ('marble',), ',': ('carpet',), 'p': ('marble', None, 'plant'), 'm': ('marble', None, 'statue'),
                    'k': ('marble', None, lambda m, x, y: m.stamp('elem', 3, 10, x, y, col=COUNTER)), 'o': ('marble', None, 'plant'),
                    'c': ('marble', None, 'crate'), 'S': ('marble',)})
    for x in (16, 17): t1.wall[t1.i(x, 23)] = None; t1.ground('carpet', x, 23, x, 23)
    t1.warp(16, 23, 'plate_plaza', 19, 2, 2, 2)
    t1.stamp('elem', 6, 11, 14, 3); t1.stamp('elem', 6, 11, 15, 3)
    t1.entry = [16, 21]
    t1.event(4, 9, 'a1_lobby', 28, 1, unless='a1_lobby')
    t1.npc(16, 4, 'Princess', id='recept', name='RECEPTIONIST', ev='a1_receptionist', dir=2, still=1)
    t1.chest(31, 21, 'potion', 3); t1.chest(3, 21, 'phoenix_down')
    out.append(t1)
    # generated floors
    spec = [('tower_2', 'Aurex Tower - Records', 'tower', 501, ['hi_potion', 'prism:sleep', ('gold', 600)]),
            ('tower_3', 'Aurex Tower - Records Annex', 'tower', 502, ['mythril_vest', 'ether', 'eye_drops', 'prism:mp_plus']),
            ('tower_4', 'Aurex Tower - Laboratories', 'factory', 503, ['remedy', 'breach_lance', ('hi_potion', 2)]),
            ('tower_5', 'Aurex Tower - Specimen Labs', 'factory', 504, ['prism:haste', 'mythril_knife', 'phoenix_down', ('gold', 800)])]
    gens = []
    for (mid, name, th, seed, loot) in spec:
        m, info = gen(mid, name, 54, 40, th, seed, enc='tower', rooms=11, chests=loot)
        gens.append((m, info)); out.append(m)
    # lobby stairs up (at the top wall) -> floor 2's first room
    m2, i2 = gens[0]; r0 = i2['rooms'][0]; sx, sy = r0.x + r0.w // 2, r0.y + 1
    stairs(m2, sx, sy, 'tower_1', 14, 4, down=True); m2.entry = [sx, sy + 1]
    t1.warp(14, 3, 'tower_2', sx, sy + 1, 2, 2)
    for k in range(3): link(gens[k][0], gens[k][1]['rooms'][-1], gens[k + 1][0], gens[k + 1][1]['rooms'][0], down=False)
    # story stops: Sable finds the Cradle file in the records; the specimen breaks loose in the labs
    q = i2['rooms'][len(i2['rooms']) // 2]; m2.event(q.x + 1, q.y + 1, 'a1_records', 1, 1, touch=False); put(m2, 'drawers', q.x + 1, q.y)
    m2.sign(q.x + 1, q.y + 1, '') if False else None
    m5, i5 = gens[3]; q = i5['rooms'][-1]
    m5.event(q.x, q.y + q.h // 2, 'a1_specimen', q.w, 1, unless='a1_specimen')
    savepoint(m5, i5['rooms'][-2].x + 1, i5['rooms'][-2].y + 1)
    savepoint(gens[1][0], gens[1][1]['rooms'][0].x + 1, gens[1][1]['rooms'][0].y + 1)
    # executive floor (6), the Cradle vault (7), the roof (8)
    rows6 = pad([
        '########################################',
        '########################################',
        '########################################',
        '##pp......bbbb.....bbbb......pp.......##',
        '##....................................##',
        '##....,,,,,,,,,,,,,,,,,,,,,,,,,,,,....##',
        '##....,..........................,....##',
        '##....,...kkkkkkkkkkkkkkkkkkkk...,....##',
        '##....,..........................,....##',
        '##....,,,,,,,,,,,,,,,,,,,,,,,,,,,,....##',
        '##....................................##',
        '##.p..........................p.......##',
        '#############....#############....######',
        '##........#........#......#...........##',
        '##..c.....#...dd...#..dd..#...........##',
        '##........#........#......#...........##',
        '##..............................,,....##',
        '##..............................,,....##',
        '##################################,,####',
        '########################################',
    ], 40)
    t6 = Map('tower_6', 40, 20, 'Aurex Tower - Executive Floor', music='city', kind='dungeon'); t6.under = 'carpet'
    grid(t6, rows6, {'#': (None, 'pale'), '.': ('carpet',), ',': ('marble',), 'p': ('carpet', None, 'plant'), 'b': ('carpet', None, 'shelf'),
                     'k': ('marble', None, lambda m, x, y: m.stamp('elem', 3, 10, x, y, col=SOLID)), 'c': ('carpet', None, 'crate'), 'd': ('carpet', None, 'drawers')})
    m5x = gens[3][1]['rooms'][-1]
    out.append(t6)
    # floor 5 -> floor 6: stairs in the specimen lab's last room (unlocked once the specimen is beaten)
    sx5, sy5 = m5x.x + m5x.w - 2, m5x.y + 1
    stairs(m5, sx5, sy5, 'tower_6', 34, 16, down=False); m5.setcol(sx5, sy5 + 1, OPEN)
    m5.gate('a1_specimen', sx5, sy5, tile=('dungeon', 5, 1))
    stairs(t6, 34, 17, 'tower_5', sx5, sy5 + 1, down=True); t6.entry = [34, 16]
    t6.warps[-1].update({'x': 34, 'y': 17})
    stairs(t6, 3, 13, 'tower_7', 17, 26, down=False); t6.event(2, 13, 'a1_exec', 36, 4, unless='a1_exec')
    t6.chest(37, 14, 'power_wrist'); t6.chest(3, 16, 'x_potion') if False else t6.chest(3, 16, 'hi_potion', 2)
    # the Cradle vault: rows of tanks
    t7 = Map('tower_7', 36, 30, 'Aurex Tower - Cradle Vault', music='mystic', kind='dungeon', dark=1); t7.under = 'crystal'
    room(t7, 0, 0, 35, 29, floor='darkmetal', wall='crystal', thick=3)
    t7.ground('crystal', 15, 3, 20, 28)
    for y in range(5, 24, 4):
        for x in (3, 7, 26, 30): put(t7, 'crystal_big', x, y)
    for y in range(6, 24, 4): put(t7, 'orb', 12, y); put(t7, 'orb', 23, y)
    put(t7, 'machine', 17, 4); put(t7, 'console', 16, 6); put(t7, 'console', 19, 6)
    stairs(t7, 17, 27, 'tower_6', 3, 14, down=True); t7.entry = [17, 26]
    t7.event(15, 12, 'a1_vault', 6, 1, unless='a1_vault')
    t7.event(3, 9, 'a1_tank', 2, 1, touch=False); t7.event(30, 13, 'a1_tank2', 2, 1, touch=False)
    stairs(t7, 18, 3, 'tower_8', 20, 26, down=False); t7.gate('a1_vault', 18, 3, tile=('dungeon', 5, 1))
    t7.chest(33, 27, 'prism:barrier'); t7.chest(2, 27, 'surge_manual_kael') if False else t7.chest(2, 27, 'ether', 2)
    savepoint(t7, 21, 26)
    out.append(t7)
    # the roof: a landing pad in the wind
    t8 = Map('tower_8', 42, 30, 'Aurex Tower - Roof', music='boss', kind='dungeon'); t8.under = 'metal'
    t8.ground('void', 0, 0, 41, 29); t8.setcol(0, 0, SOLID, 42, 30)
    t8.ground('metal', 4, 3, 37, 27); t8.ground('grate', 10, 7, 31, 21); t8.ground('darkmetal', 18, 12, 23, 16)
    for (x, y) in ((4, 3), (36, 3), (4, 26), (36, 26), (20, 3)): put(t8, 'orb', x, y)
    for (x, y) in ((6, 5), (33, 5)): put(t8, 'machine', x, y)
    for (x, y) in ((6, 22), (8, 22), (32, 23), (33, 22)): put(t8, 'crate', x, y)
    stairs(t8, 20, 27, 'tower_7', 18, 4, down=True); t8.entry = [20, 26]
    t8.event(10, 18, 'a1_drago', 22, 1, unless='a1_drago')
    t8.event(37, 14, 'a1_cargo_lift', 1, 2, if_='a1_drago')
    t8.ground('darkmetal', 37, 13, 38, 16); t8.stamp('dungeon', 2, 3, 38, 14)
    out.append(t8)
    return out

def railyards():
    m, info = gen('railyards', 'Halcyon Rail Yards', 72, 44, 'factory', 777, enc='yards', rooms=14, chests=['hi_potion', ('grenade', 3), 'prism:throw', ('gold', 900), 'phoenix_down', 'iron_bangle'], minr=(8, 6), maxr=(15, 9))
    # rails across the big rooms
    for q in info['rooms']:
        if q.w >= 10:
            y = q.y + q.h // 2
            for x in range(q.x, q.x + q.w):
                if m.col[m.i(x, y)] == OPEN and m.layers['deco'][m.i(x, y)] < 0: m.ground('darkcobble', x, y, x, y)
    e = info['rooms'][0]; m.entry = [e.x + 2, e.y + 2]
    m.event(e.x + 1, e.y + 1, 'a1_yards_in', e.w - 2, 1, unless='a1_yards_in')
    q = info['rooms'][-1]
    m.event(q.x, q.y, 'a1_train', q.w, q.h, unless='a1_train')
    savepoint(m, info['rooms'][-2].x + 1, info['rooms'][-2].y + 1)
    return m

def build():
    mk, D = market(); ints = market_interiors(D)
    for w in mk.warps:
        for i in ints:
            if w['to'] == i.id: w['tx'], w['ty'] = i.entry
    dr, dr_in = drains()
    sp, sp_bottom, sp_top = spire()
    plaza = plate_plaza(sp_top)
    tw = tower(sp_top)
    ry = railyards()
    return [mk] + ints + dr + sp + [plaza] + tw + [ry]
