"""Act I additions: Lantern Heights (the plate's residential sector, west of Aurex Plaza) and its houses, the Aurex
Museum, the Plate Cafe; and Ash Lane, the street the plate fell on (west of the Sumps)."""
from _kit import *
from _gen import put, prop
from a1_sumps import fix_doors
from a2_meridia import doors, deco_town

def heights():
    W, H = 60, 44
    m = Map('plate_heights', W, H, 'Lantern Heights', music='city', kind='town'); m.under = 'tile'
    m.ground('grass', 0, 0, W - 1, H - 1)
    m.walls('pale', 0, 0, W - 1, 1); m.walls('pale', 0, H - 2, W - 1, H - 1); m.walls('pale', 0, 0, 1, H - 1); m.walls('pale', W - 2, 0, W - 1, H - 1)
    m.ground('tile', 2, 20, W - 1, 22); m.ground('tile', 28, 2, 30, H - 3); m.ground('marble', 22, 26, 37, 37)
    m.ground('water', 27, 29, 32, 34); put(m, 'statue', 29, 30)
    for y in (20, 21, 22): m.wall[m.i(W - 2, y)] = m.wall[m.i(W - 1, y)] = None; m.ground('tile', W - 2, y, W - 1, y); m.warp(W - 1, y, 'plate_plaza', 1, 12, 1)
    D = doors(m, [(6, 8, 'red', 'ph_museum'), (14, 9, 'green', 'ph_cafe'), (36, 8, 'orange', 'ph_inn'), (44, 9, 'shop', 'ph_boutique'),
                  (6, 28, 'tan', 'ph_house1'), (14, 29, 'orange2', 'ph_house2'), (44, 28, 'hall', 'ph_mansion'), (52, 9, 'wood', None)])
    m.sign(30, 24, 'LANTERN HEIGHTS. A Sector of Aurex Prosperity.')
    for (x, y) in ((22, 26), (37, 26), (22, 37), (37, 37)): lamp(m, x, y)
    for x in range(4, 26, 4): tree(m, x, 16, 'round')
    for x in range(34, 56, 4): tree(m, x, 16, 'light')
    savepoint(m, 25, 24)
    deco_town(m, 77, n_trees=8, n_flowers=30, n_rocks=0)
    m.entry = [W - 4, 21]
    P = lambda *a: list(a)
    m.npc(20, 21, 'Noble', name='GENTLEMAN', walk=2, say=P('The Sumps? I\'m told it\'s just below us. I\'ve never looked. One doesn\'t look down.'))
    m.npc(34, 23, 'Princess', name='NANNY', walk=1, say=P('The children ask why the sky is grey in the picture books. I tell them it\'s artistic licence.'))
    m.npc(40, 32, 'Villager3', name='GARDENER', walk=2, say=P('Every flower up here is grown under reactor lamps. Real sunlight? Too unpredictable, the Board says.'))
    m.npc(12, 23, 'Inspector', id='clerk', name='HAGGARD CLERK', ev='a1_q_pass', still=1, dir=2)
    m.npc(50, 22, 'KnightGold', name='PATROL', still=1, dir=3, say=P('Containment Order. Papers. ...Oh, you\'re visitors. Have a nice day. Don\'t go below.'))
    m.npc(24, 33, 'Villager6', name='BOY', walk=2, ev='a1_q_kite')
    return m, D

def heights_ins(D):
    to = lambda k: ('plate_heights',) + D[k]; out = []
    mu = interior('ph_museum', 'Aurex Museum of Progress', 22, 15, to('ph_museum'), floor='marble', wall='pale', door=10, music='mystic')
    for (x, y, n) in ((3, 4, 0), (8, 4, 1), (13, 4, 2), (18, 4, 3), (3, 9, 4), (18, 9, 5)):
        put(mu, 'orb' if n % 2 else 'crystal_s', x, y); mu.event(x, y, 'a1_exhibit', touch=False, n=n)
    put(mu, 'statue', 10, 8)
    mu.npc(11, 11, 'Monk2', id='curator', name='CURATOR', ev='a1_q_museum', dir=2, still=1)
    out.append(mu)
    c = interior('ph_cafe', 'Cafe Aureate', 16, 12, to('ph_cafe'), floor='carpet', wall='wood', door=7, music='chill')
    for (x, y) in ((2, 5), (7, 5), (11, 5), (4, 8)): table(c, x, y)
    counter(c, 9, 13, 2) if False else None
    c.npc(3, 4, 'Noble', name='CARD FAN', ev='a1_cards_cafe', dir=2, still=1)
    c.npc(12, 4, 'Woman', name='WAITRESS', walk=1, say=['Today\'s special is the Reactor Roast. It\'s coffee. Very strong coffee.'])
    c.npc(8, 9, 'OldMan2', name='RETIRED ENGINEER', ev='a1_engineer', dir=0, still=1)
    out.append(c)
    i = interior('ph_inn', 'The Gilt Lamp Hotel', 16, 12, to('ph_inn'), floor='carpet', wall='pale', door=7); counter(i, 4, 10, 4); bed(i, 1, 7); bed(i, 14, 7)
    i.npc(7, 3, 'Princess', name='CONCIERGE', ev='inn_heights', dir=2, still=1); out.append(i)
    b = interior('ph_boutique', 'Silk & Steel Boutique', 13, 10, to('ph_boutique'), floor='marble', wall='pale', door=6); counter(b, 3, 9, 4)
    b.npc(6, 3, 'Noble', name='BOUTIQUE OWNER', shop='ph_boutique', dir=2, still=1); out.append(b)
    h1 = interior('ph_house1', 'The Albrights\' Flat', 12, 10, to('ph_house1'), floor='carpet', wall='pale', door=6); bed(h1, 1, 3); table(h1, 5, 6); bookcase(h1, 8, 2)
    h1.npc(6, 4, 'Woman', name='MRS ALBRIGHT', ev='a1_q_sister', dir=2, still=1)
    h1.npc(3, 7, 'Villager3', id='nell', name='NELL', ev='a1_nell', dir=1, still=1, if_='q_marlo_nell'); out.append(h1)
    h2 = interior('ph_house2', 'A Tidy Apartment', 12, 10, to('ph_house2'), floor='tile', wall='pale', door=6); bed(h2, 1, 3); drawers(h2, 8, 2)
    h2.npc(5, 5, 'Villager2', name='OFF-DUTY TECH', dir=2, still=1, say=['I work the Reactor 1 night shift. Since 4 went up, we\'ve all been told to smile and not mention it.', 'Dr. Lune walked the floor last week. Counting the valves. Out loud.'])
    h2.chest(10, 6, 'hi_potion', 2); out.append(h2)
    mn = interior('ph_mansion', 'Aurex Residence', 22, 15, to('ph_mansion'), floor='carpet', wall='pale', door=10, music='city')
    for (x, y) in ((3, 4), (17, 4)): put(mn, 'statue', x, y)
    table(mn, 9, 6); bookcase(mn, 1, 9); bookcase(mn, 19, 9)
    mn.npc(10, 4, 'KnightGold', name='BUTLER', ev='a1_butler', dir=2, still=1)
    mn.chest(20, 12, 'prism:magic_plus'); mn.chest(1, 12, 'silver_glasses')
    out.append(mn)
    return out

def ash_lane():
    """Ash Lane: the street the plate fell on. Rubble, rescue workers, a memorial."""
    m = Map('ash_lane', 44, 34, 'Ash Lane', music='lament', kind='town', dark=1); m.under = 'ash'
    m.ground('ash', 0, 0, 43, 33)
    m.walls('dark', 0, 0, 43, 1); m.walls('dark', 0, 32, 43, 33); m.walls('dark', 0, 0, 1, 33)
    m.ground('cobble', 2, 15, 43, 17)
    import random
    r = random.Random(4)
    for _ in range(70):
        x, y = r.randint(3, 40), r.randint(3, 30)
        if 14 <= y <= 18: continue
        prop(m, r.choice(['rock', 'rock', 'crate', 'barrel']), x, y)
    for (x, y) in ((8, 6), (20, 4), (33, 7), (12, 25), (28, 26)): put(m, 'bigrock', x, y)
    for y in (15, 16, 17): m.warp(43, y, 'sumps', 2, y + 11, 1)
    put(m, 'statue', 21, 12); m.event(21, 12, 'a1_memorial', touch=False)
    m.npc(16, 16, 'Knight', name='RESCUE WORKER', walk=1, say=['Six days digging. We found a dog yesterday. Alive. The whole street cheered.'])
    m.npc(30, 14, 'Villager4', name='DIGGER', still=1, dir=0, say=['Aurex sent a crane. Then took it back. Said it was needed for the plate repairs.'])
    m.npc(10, 18, 'OldWoman', name='MOURNER', still=1, dir=1, say=['My house was the blue one. You can\'t tell which one was blue now.'])
    m.npc(24, 20, 'marlo', id='marlo_ash', name='MARLO', ev='a1_q_marlo', still=1, dir=0, if_='q_marlo_go&!q_marlo_done')
    m.chest(40, 4, 'phoenix_down', 2); m.chest(4, 29, 'prism:cover')
    m.entry = [41, 16]
    return m

def build():
    h, D = heights(); hi = heights_ins(D); fix_doors(h, hi)
    return [h] + hi + [ash_lane()]
