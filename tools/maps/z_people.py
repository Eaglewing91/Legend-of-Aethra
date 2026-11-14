"""More people for every town (and the side quests they give). Runs after every other map module: patch() adds
townsfolk, quest givers and quest props to maps built elsewhere."""
from _kit import *

def build(): return []

def spot(m, x, y):
    """The nearest walkable, empty cell to (x, y)."""
    taken = {(n['x'], n['y']) for n in m.npcs} | {tuple(map(int, k.split(','))) for k in m.chests}
    for r in range(0, 12):
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                X, Y = x + dx, y + dy
                if m.ok(X, Y) and m.col[m.i(X, Y)] == OPEN and (X, Y) not in taken and not any(w['x'] == X and w['y'] == Y for w in m.warps): return X, Y
    return x, y

def P(m, x, y, who, name, say=None, **kw):
    X, Y = spot(m, x, y)
    if say is not None: kw['say'] = say
    m.npc(X, Y, who, name=name, **kw)

def patch(M):
    t = M['thornbrook']
    P(t, 12, 22, 'Villager2', 'MILLER BROM', ev='q_mill', still=1, dir=2)
    P(t, 40, 26, 'Woman', 'WIDOW HARL', walk=1, say=['My Harl went off to be a soldier. Aurex said he deserted. Harl never deserted anything in his life.'], unless='a2_prison_out')
    P(t, 40, 26, 'Woman', 'WIDOW HARL', walk=1, say=['They say Harl\'s in the Spire prison. At least he\'s alive. At least he said no.'], if_='a2_prison_out')
    P(t, 20, 40, 'Cavegirl', 'GIRL', walk=2, say=['Mother Ilse says the Lantern House was the first house rebuilt. Before the inn, before the mill. Children first.'])
    P(t, 48, 40, 'Hunter', 'WOODSMAN', walk=1, say=['Mistwood\'s angry this year. The trees are thirsty, and nobody can say why.'], unless='a2_mist')
    P(t, 30, 33, 'OldMan2', 'SCHOOLMASTER', still=1, dir=2, say=['After the Sundering, every child in Meridia came here. We hold class on the green now. The sky is the roof.'], if_='chapter>=5')
    k = M['kestrel']
    P(k, 30, 28, 'Villager4', 'FENCER', ev='q_bears', still=1, dir=2)
    P(k, 14, 22, 'Princess', 'JODA\'S DAUGHTER', walk=2, say=['When I grow up I\'ll race at the Gilded Spire. On a GOLD talonbird. They\'re real! Grandad saw one on Plumage Isle.'])
    g = M['gilded_spire']
    P(g, 36, 34, 'Sultan', 'TIPSTER', ev='q_tip', still=1, dir=2)
    P(g, 8, 26, 'Princess', 'SHOWGIRL', walk=2, say=['The Owner built the Spire on a mesa so nobody could leave without paying for the lift. He thinks that\'s funny.'])
    P(g, 46, 26, 'OldMan', 'GAMBLER', walk=1, say=['Three sevens on the slots pays a fortune. I\'ve seen it once. Forty years ago. It was beautiful.'])
    w = M['windhaven']
    P(w, 36, 22, 'Monk2', 'FLAG KEEPER', ev='q_imps', still=1, dir=2)
    P(w, 14, 26, 'Villager3', 'PILGRIM', walk=2, say=['I walked all the way from Port Lark to hear the Crystal sing. Now it\'s gone. I\'ll walk home slowly.'], if_='a2_done')
    P(w, 40, 36, 'Villager6', 'BOY', walk=2, say=['The wind stopped when the shrine fell. Then the Echo came, and now the wind blows from the south. Everything\'s backwards.'], if_='a2_done')
    pl = M['portlark']
    P(pl, 34, 22, 'Villager5', 'SHIFTY SAILOR', ev='q_crate', still=1, dir=2)
    P(pl, 12, 30, 'Woman', 'NET MENDER', walk=1, say=['My husband\'s ship was chartered by Aurex. "Survey work under the sea." He came back white as salt and won\'t say what they surveyed.'])
    sm = M['saltmere']
    P(sm, 22, 28, 'Cavegirl', 'FISHER GIRL', ev='q_coral', still=1, dir=2)
    P(sm, 40, 24, 'Sultan2', 'MERCHANT', ev='q_crate_end', still=1, dir=3)
    ss = M['sunscar']
    P(ss, 34, 23, 'OldMan2', 'STARGAZER', ev='q_stars', still=1, dir=2)
    P(ss, 12, 22, 'Caveman', 'DIGGER', walk=1, say=['The bones in the dunes east of here? An airship, they say. Older than the Crystals. Something inside it still hums.'])
    fg = M['frostgate']
    P(fg, 34, 26, 'Eskimo', 'WORRIED WIFE', ev='q_miner', still=1, dir=2)
    P(fg, 12, 30, 'OldMan3', 'OLD MINER', walk=1, say=['Aurex pays double for night shifts in the deep galleries. Nobody takes them twice.'])
    lm = M['lumen']
    P(lm, 28, 26, 'Monk', 'BELL WARDEN', ev='q_bells', still=1, dir=2)
    for i, (x, y) in enumerate(((6, 6), (44, 6), (6, 32), (44, 32), (25, 20))):
        X, Y = spot(lm, x, y); lm.stamp('dungeon', 6, 2, X, Y, col=SOLID); lm.event(X, Y, 'q_bell', touch=False, n=i)
    md = M['mideel']
    P(md, 30, 26, 'Woman', 'NURSE', ev='q_flowsick', still=1, dir=2)
    a = M['academy']
    P(a, 8, 10, 'officer', 'SPARRING MASTER', ev='q_spar', still=1, dir=2)
    P(a, 36, 10, 'Master', 'ARCHIVIST', ev='q_wardens', still=1, dir=2)
    P(a, 30, 26, 'SamuraiBlue', 'CADET', walk=2, say=['They say the Warden Kael wasn\'t on the roster. I asked the Headmaster. He said "He is now."'])
    fm = M['fg_mine_3']
    X, Y = spot(fm, fm.w // 2, fm.h // 2); fm.npc(X, Y, 'Eskimo', name='TRAPPED MINER', ev='q_miner_found', still=1, dir=2, unless='q_miner_saved')
    om = M['oldmine_2']
    X, Y = spot(om, om.entry[0] + 3, om.entry[1] + 2); om.chest(X, Y, 'mill_gear')
    sw = M['wreck_isle_2']
    X, Y = spot(sw, sw.w // 2, sw.h // 2); sw.chest(X, Y, 'surge_manual_sable')
    ot = M['orin_tower_6']
    X, Y = spot(ot, ot.entry[0] + 2, ot.entry[1]); ot.chest(X, Y, 'surge_manual_orin')

# ---------- open up locked houses: every town gets homes you can walk into ----------
LINES = {
    'thornbrook': ['We came back after the fire. Where else would we go?', 'My grandmother says the fire burned blue at the orphanage. Fire isn\'t blue.', 'Mother Ilse fed us all, that first winter. She still sends soup.'],
    'kestrel': ['Talonbird feathers in the soup again. Every day. Lovely.', 'Joda breeds the fastest birds in Meridia. He says so himself. Often.'],
    'windhaven': ['We pray to the wind. Lately it doesn\'t answer.', 'Aurex offered every family in Windhaven a year\'s wages to sell the shrine. Nobody sold.'],
    'portlark': ['The sea\'s been strange. Warm in the wrong places.', 'My son\'s a sailor. Sailors\' mothers don\'t sleep.'],
    'saltmere': ['Sand in the bread, sand in the bed. That\'s Saltmere.', 'The ferry brings strangers. Strangers bring trouble. You look like trouble. Tea?'],
    'sunscar': ['Water is life out here. Sit, sit, have some. Not too much.', 'My grandfather dug in the ruins. He came back singing songs nobody knew.'],
    'frostgate': ['Close the door! The cold gets in and never leaves.', 'Three shifts a day in the mines. Aurex pays well. Aurex pays in the end, too.'],
    'lumen': ['Ring softly. The bells remember everything.', 'Ember was such a quiet child. Then the Echoes started answering her.'],
    'mideel': ['People wash up in the shallows sometimes. Some of them remember who they were.', 'The water glows at night. My children call it the river of stars.'],
    'sumps': ['Close the door, love, the soot gets in.', 'We were on Ash Lane once. Now we\'re here. Next year, who knows.', 'My boy works the reactors. Comes home coughing.', 'Undercurrent? Never heard of them. Tea?'],
}
LOOT = ['potion', 'hi_potion', 'ether', 'phoenix_down', 'antidote', ('gold', 300), 'tent', 'remedy']
WHO = ['Villager', 'Villager2', 'Villager3', 'Woman', 'OldMan', 'OldWoman', 'Villager5', 'Villager6', 'Hunter', 'Cavegirl']

def open_homes(M):
    import random
    r = random.Random(17)
    added = []
    for tid, lines in LINES.items():
        t = M.get(tid)
        if not t: continue
        locked = [k for k, v in t.signs.items() if v == 'Locked.' or v.startswith('Locked') or 'Nobody answers' in v or 'snoring' in v]
        r.shuffle(locked)
        for n, k in enumerate(locked[:8 if tid == 'sumps' else 4]):
            x, y = map(int, k.split(','))
            hid = '%s_home%d' % (tid, n + 1)
            h = interior(hid, 'A Home', 12, 10, (tid, x, y + 1), floor='planks', wall='wood', door=6)
            bed(h, 1, 3); bed(h, 3, 3, n % 3); table(h, 5, 6); drawers(h, 8, 2)
            h.npc(r.randint(2, 9), 8, r.choice(WHO), name='RESIDENT', walk=1, say=[r.choice(lines), r.choice(lines)])
            if r.random() < 0.6:
                it = r.choice(LOOT); h.chest(10, 6, it if isinstance(it, str) else it[0], 1 if isinstance(it, str) else it[1])
            del t.signs[k]; t.setcol(x, y, OPEN); t.warp(x, y, hid, h.entry[0], h.entry[1], 0)
            M[hid] = h; added.append(hid)
    return added

_patch0 = patch
def patch(M):
    _patch0(M); open_homes(M)
