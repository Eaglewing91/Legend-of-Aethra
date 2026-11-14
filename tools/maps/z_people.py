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
