"""Act IV: Nordheim (Frostgate and its mines, Lumen, the Deeproot Caverns, the Crater) and Act V (the Vanguard Academy,
Mideel Shallows and Kael's Memory Dive, the Echo trials, the Sky Citadel and the Aetherflow, the Abyssal Spire)."""
from _kit import *
from _gen import switches, gen, link, stairs, door_up, put, prop
from a1_sumps import fix_doors
from a2_meridia import town, exit_south, doors, deco_town

def series(base, names, theme, seed, enc, loot, w=54, h=42, rooms=11, music=None, up=False, pools=0, first_id=None, dark=0, **kw):
    """A run of generated floors linked by stairs; returns (maps, infos). The first floor's door leads to the world."""
    ms, inf = [], []
    for k, nm in enumerate(names):
        mid = first_id if (k == 0 and first_id) else '%s_%d' % (base, k + 1)
        m, i = gen(mid, nm, w, h, theme, seed + k, enc=enc, rooms=rooms, chests=loot[k] if k < len(loot) else [], music=music, pools=pools, **kw)
        if dark: m.dark = dark
        ms.append(m); inf.append(i)
    for k in range(len(ms) - 1): link(ms[k], inf[k]['rooms'][-1], ms[k + 1], inf[k + 1]['rooms'][0], down=not up)
    e = inf[0]['rooms'][0]; door_up(ms[0], e.x + e.w // 2 - 1, e.y - 1, '@world', 0, 0); ms[0].entry = [e.x + e.w // 2, e.y + 1]
    return ms, inf
def boss_at_end(m, info, ev, flag, crystal=False):
    q = info['rooms'][-1]; m.event(q.x, q.y + q.h // 2, ev, q.w, 1, unless=flag)
    if crystal: put(m, 'crystal_big', q.x + q.w // 2 - 1, q.y + 1)
    savepoint(m, info['rooms'][-2].x + 1, info['rooms'][-2].y + 1)

def frostgate():
    m = town('frostgate', 'Frostgate', 54, 42, ground='snow', seed=91, music='snow', border='rock')
    m.ground('cobble', 26, 3, 28, 39); m.ground('cobble', 4, 20, 49, 22)
    D = doors(m, [(8, 9, 'igloo', 'fg_inn'), (15, 10, 'shop', 'fg_shop'), (38, 9, 'red', 'fg_arms'), (45, 10, 'igloo2', 'fg_prism'), (9, 27, 'wood', None), (40, 28, 'igloo', 'fg_house')])
    m.stamp('dungeon', 2, 3, 27, 4); m.warp(27, 4, 'fg_mine_1', 0, 0, 2); m.sign(28, 5, 'FROSTGATE MINES. Aurex property. Lantern required beyond level 2.')
    savepoint(m, 31, 24); exit_south(m, 26, 3); m.entry = [27, 37]
    for (x, y) in ((20, 13), (33, 13), (20, 27), (33, 27)): tree(m, x, y, 'snowpine')
    m.event(25, 33, 'a4_frost', 5, 1, unless='a4_frost')
    m.npc(18, 21, 'Eskimo', name='MINER', walk=2, say=['The mines go down to the Deeproot, they say. To the roots of the world. Nobody\'s been that deep and come back talking.'])
    m.npc(36, 23, 'Hunter', name='TRAPPER', walk=1, say=['Lumen? The bell village? Hidden in the snow-woods east. You\'ll never find it without a Lumen bell to ring.'])
    return m, D
def frostgate_ins(D):
    to = lambda k: ('frostgate',) + D[k]; out = []
    i = interior('fg_inn', 'Hearthstone Inn', 14, 11, to('fg_inn'), floor='planks', wall='wood', door=6); counter(i, 3, 8, 4); bed(i, 1, 6); bed(i, 12, 6); i.npc(5, 3, 'Eskimo', name='INNKEEPER', ev='inn_frost', dir=2, still=1); out.append(i)
    s = interior('fg_shop', 'Frost Provisions', 12, 10, to('fg_shop'), door=6); counter(s, 3, 8, 4); s.npc(5, 3, 'Villager4', name='PROVISIONER', shop='fg_shop', dir=2, still=1); out.append(s)
    a = interior('fg_arms', 'Glacier Forge', 12, 10, to('fg_arms'), floor='darkcobble', wall='rock', door=6); counter(a, 3, 8, 4); a.npc(5, 3, 'Blacksmith', name='SMITH', shop='fg_arms', dir=2, still=1); out.append(a)
    p = interior('fg_prism', 'Rime Prisms', 12, 10, to('fg_prism'), floor='marble', wall='ice', door=6); counter(p, 3, 8, 4); p.npc(5, 3, 'SorcererBlack', name='RIME', shop='fg_prism', dir=2, still=1); out.append(p)
    h = interior('fg_house', 'Foreman\'s House', 12, 10, to('fg_house'), door=6); bed(h, 1, 3); table(h, 4, 6); h.npc(6, 4, 'OldMan3', name='FOREMAN', ev='a4_foreman', dir=2, still=1); out.append(h)
    return out

def mines():
    ms, inf = series('fg_mine', ['Frostgate Mines - Upper Galleries', 'Frostgate Mines - Ice Shafts', 'Frostgate Mines - Frozen Lake', 'Frostgate Mines - Old Works', 'Frostgate Mines - Bell Hollow'],
                     'ice', 1700, 'fgmine', [['prism:ice', 'x_potion'], ['dragon_mail', ('gold', 4200)], ['prism:glacielle' if False else 'prism:time', 'elixir'], ['echo_bell', 'turbo_ether'], ['aether_rifle', 'prism:hp_plus']], music='cave', dark=1)
    e = inf[0]['rooms'][0]; ms[0].warps[-1].update({'to': 'frostgate', 'tx': 27, 'ty': 5}); ms[0].warps[-2].update({'to': 'frostgate', 'tx': 27, 'ty': 5})
    for k in range(2, 5): ms[k].dark = 3
    switches(ms[2], inf[2], 3, 'fm_levers3', 'lever')
    boss_at_end(ms[4], inf[4], 'a4_frostwyrm', 'a4_lumenbell')
    return ms

def lumen():
    m = town('lumen', 'Lumen', 52, 40, ground='snow', seed=101, music='mystical')
    m.ground('marble', 22, 10, 29, 17); put(m, 'crystal_big', 25, 12)
    m.ground('cobble', 24, 18, 27, 37)
    D = doors(m, [(8, 10, 'igloo', 'lm_inn'), (15, 11, 'igloo2', 'lm_shop'), (37, 10, 'hall', 'lm_hall'), (9, 26, 'thatch', None), (40, 27, 'igloo', None)])
    for (x, y) in ((5, 5), (45, 5), (5, 33), (45, 33), (18, 20), (33, 20)): tree(m, x, y, 'white')
    savepoint(m, 30, 22); exit_south(m, 24, 4); m.entry = [25, 36]
    m.event(23, 32, 'a4_lumen', 6, 1, unless='a4_lumen')
    m.npc(20, 24, 'Monk2', name='BELLKEEPER', walk=1, say=['Lumen\'s summoners call the Echoes with bells. Only one summoner is left now. Ember. She is twelve.'])
    return m, D
def lumen_ins(D):
    to = lambda k: ('lumen',) + D[k]; out = []
    i = interior('lm_inn', 'Bell Inn', 14, 11, to('lm_inn'), door=6); counter(i, 3, 8, 4); bed(i, 1, 6); bed(i, 12, 6); i.npc(5, 3, 'Woman', name='INNKEEPER', ev='inn_lumen', dir=2, still=1); out.append(i)
    s = interior('lm_shop', 'Chime Shop', 12, 10, to('lm_shop'), door=6); counter(s, 3, 8, 4); s.npc(5, 3, 'Monk', name='CHIMER', shop='lm_shop', dir=2, still=1); out.append(s)
    h = interior('lm_hall', 'Hall of Bells', 24, 16, to('lm_hall'), floor='marble', wall='ice', door=11, music='mystical')
    for x in (3, 7, 16, 20): put(h, 'pillar', x, 4)
    put(h, 'crystal_big', 11, 3); h.npc(11, 8, 'ember', id='ember', ev='a4_ember', dir=2, still=1, unless='a4_ember')
    h.npc(5, 10, 'Master', name='ELDER BELL', ev='a4_elderbell', dir=2, still=1); out.append(h)
    return out

def deeproot():
    ms, inf = series('deeproot', ['Deeproot - Root Gate', 'Deeproot - Hanging Gardens', 'Deeproot - Glowing Fen', 'Deeproot - Bone Roots', 'Deeproot - World Vein', 'Deeproot - Earth Crystal'],
                     'cave', 1800, 'deeproot', [['prism:earth', 'elixir'], ['genesis_rod' if False else 'sage_rod', ('gold', 5000)], ['prism:gaiadon', 'ribbon' if False else 'safety_bit'], ['titan_grip', 'megalixir'],
                                               ['prism:ultima' if False else 'prism:flare', 'turbo_ether'], ['x_potion']], first_id='deeproot_1', pools=0.4, dark=1)
    switches(ms[2], inf[2], 3, 'dr_roots3', 'crystal'); switches(ms[4], inf[4], 4, 'dr_roots5', 'crystal')
    boss_at_end(ms[5], inf[5], 'a4_sundering', 'a4_sundering', crystal=True)
    q = inf[3]['rooms'][len(inf[3]['rooms']) // 2]; ms[3].event(q.x, q.y + q.h // 2, 'a4_rootking', q.w, 1, unless='a4_rootking')
    return ms

def academy():
    """The Vanguard Academy, flying: the party's base in Act V."""
    m = Map('academy', 44, 34, 'Vanguard Academy', music='airship', kind='town'); m.under = 'tile'
    room(m, 0, 0, 43, 33, floor='tile', wall='stone', thick=3)
    m.ground('carpet', 20, 3, 23, 32); m.ground('carpet', 1, 15, 42, 17)
    for (x, y) in ((4, 4), (10, 4), (33, 4), (39, 4)): put(m, 'statue', x, y)
    for (x, y) in ((4, 24), (8, 24), (35, 24), (39, 24)): put(m, 'desk', x, y)
    put(m, 'crystal_big', 21, 4)
    savepoint(m, 25, 18)
    m.npc(21, 7, 'Master', name='HEADMASTER CAIRN', ev='a5_headmaster', dir=2, still=1)
    m.npc(10, 18, 'SamuraiBlue', name='WARDEN QUARTERMASTER', shop='academy', dir=2, still=1)
    m.npc(32, 18, 'Princess', name='ACADEMY NURSE', ev='inn_academy', dir=2, still=1)
    m.npc(15, 26, 'drago', id='drago', name='DRAGO', ev='a5_drago_base', dir=2, still=1, if_='a5_drago_joins')
    m.npc(28, 10, 'KnightGold', name='CADET', walk=2, say=['They say the Academy was built to fly. Nobody believed it. Now look at us.'])
    for k in range(3): m.warp(20 + k, 32, '@world', 0, 0, 2); m.wall[m.i(20 + k, 33)] = 'stone'
    for k in range(3): m.wall[m.i(20 + k, 32)] = None; m.ground('carpet', 20 + k, 32, 20 + k, 32)
    m.entry = [21, 30]
    return m

def mideel():
    m = town('mideel', 'Mideel Shallows', 46, 36, ground='grass', seed=111, music='peaceful')
    m.ground('aether', 6, 6, 18, 14); m.ground('cobble', 22, 3, 24, 33)
    D = doors(m, [(28, 8, 'longhouse', 'md_clinic'), (34, 20, 'orange', 'md_shop'), (8, 22, 'thatch', None)])
    savepoint(m, 26, 20); exit_south(m, 22, 3); m.entry = [23, 32]
    m.npc(14, 18, 'Villager5', name='FISHER', walk=2, say=['The Aetherflow comes right up to the surface here. Glows at night. Sometimes it brings things up. People, once.'])
    return m, D
def mideel_ins(D):
    to = lambda k: ('mideel',) + D[k]; out = []
    c = interior('md_clinic', 'Shallows Clinic', 18, 12, to('md_clinic'), floor='tile', wall='pale', door=8)
    for x in (2, 5, 12, 15): bed(c, x, 3)
    c.npc(9, 5, 'Master', name='DOCTOR', dir=2, still=1, ev='a5_mideel_doc')
    c.npc(5, 6, 'kael', id='kael_bed', still=1, dir=2, ev='a5_kael_bed', unless='a5_kael')
    out.append(c)
    s = interior('md_shop', 'Shallows Store', 12, 10, to('md_shop'), door=6); counter(s, 3, 8, 4); s.npc(5, 3, 'Villager3', name='SHOPKEEP', shop='md_shop', dir=2, still=1); out.append(s)
    # Kael's mind: the Memory Dive with Lyra (fragments of Thornbrook, Halcyon and the Academy, stitched together)
    k = Map('kael_mind', 46, 36, 'Kael\'s Memory', music='dream', kind='dungeon'); k.under = 'void'
    k.ground('void', 0, 0, 45, 35); k.setcol(0, 0, SOLID, 46, 36); k.extra['tint'] = 'rgba(60,80,160,.22)'
    k.ground('grass', 3, 26, 14, 33); k.ground('dirt', 8, 18, 9, 26); k.ground('metal', 4, 12, 16, 18); k.ground('grate', 16, 14, 28, 15)
    k.ground('planks', 28, 8, 38, 16); k.ground('marble', 30, 2, 42, 7)
    house(k, 5, 26, 'orange'); put(k, 'machine', 6, 13); put(k, 'console', 12, 13); house(k, 31, 9, 'hall'); put(k, 'crystal_big', 35, 3)
    k.entry = [10, 31]
    for i, (x, y) in enumerate(((8, 28), (10, 15), (37, 14), (38, 5))): k.event(x, y, 'a5_frag', 1, 1, touch=False, n=i); put(k, 'orb', x, y)
    k.event(30, 4, 'a5_mind_end', 12, 1, if_='frag0&frag1&frag2&frag3')
    out.append(k)
    return out

def trials():
    out = []
    for (mid, nm, th, seed, echo) in (('trial_gale', 'Gale Trial', 'forest', 1900, 'sylphine'), ('trial_frost', 'Frost Trial', 'ice', 1910, 'glacielle'), ('trial_storm', 'Storm Trial', 'factory', 1920, 'voltigar')):
        ms, inf = series(mid, [nm + ' - Outer', nm + ' - Inner', nm + ' - Altar'], th, seed, 'trial', [['elixir'], ['megalixir'], []], first_id=mid, music='temple')
        boss_at_end(ms[2], inf[2], 'a5_trial', 'trial_' + echo, crystal=True)
        ms[2].events[-1]['echo'] = echo
        out += ms
    return out

def citadel():
    ms, inf = series('citadel', ['Sky Citadel - Gate of Song', 'Sky Citadel - Hall of the Chorus', 'Sky Citadel - Garden of Islands', 'Sky Citadel - Archive of Memory',
                                 'Sky Citadel - Engine of Heaven', 'Sky Citadel - Throne Stair', 'Sky Citadel - Hollow Choir', 'Sky Citadel - The Throne'],
                     'crystal', 2000, 'citadel', [['megalixir', 'prism:holy'], ['seraph_staff' if False else 'x_potion', ('gold', 8000)], ['prism:ultima', 'elixir'], ['ribbon', 'megalixir'],
                                                   ['prism:starfall', 'turbo_ether'], ['elixir', 'megalixir'], ['prism:aethrael' if False else 'prism:doublecast', 'elixir'], []], up=True, music='final', first_id='crater')
    # the party splits: gates on floors 2, 4, 6 need their switch (each guarded)
    for k in (1, 3, 5):
        q = inf[k]['rooms'][-1]; sx, sy = q.x + q.w // 2, q.y + 1
        ms[k].gate('cit_gate%d' % k, sx - 1, sy + 1, 3, 1, tile=('dungeon', 5, 1))
        r = inf[k]['rooms'][len(inf[k]['rooms']) // 2]; ms[k].event(r.x, r.y + r.h // 2, 'a5_gate', r.w, 1, unless='cit_gate%d' % k, n=k)
    ms[0].event(inf[0]['rooms'][0].x, inf[0]['rooms'][0].y + 2, 'a5_citadel', inf[0]['rooms'][0].w, 1, unless='a5_citadel')
    for k in (2, 4, 6): savepoint(ms[k], inf[k]['rooms'][0].x + 1, inf[k]['rooms'][0].y + 1)
    boss_at_end(ms[7], inf[7], 'a5_vesper', 'a5_vesper', crystal=True)
    # the Aetherflow beneath: the last area
    f = Map('aetherflow', 40, 40, 'The Aetherflow', music='final', kind='dungeon'); f.under = 'void'
    f.ground('void', 0, 0, 39, 39); f.setcol(0, 0, SOLID, 40, 40); f.extra['tint'] = 'rgba(40,160,140,.18)'
    f.ground('aether', 2, 2, 37, 37); f.ground('crystal', 18, 4, 21, 36); f.ground('crystal', 6, 18, 33, 21); f.ground('marble', 15, 3, 24, 8)
    f.entry = [19, 35]; f.event(17, 10, 'a5_nyxar', 6, 1, unless='a5_end')
    savepoint(f, 22, 30)
    return ms + [f]

def abyss():
    """The Abyssal Spire: ten floor plans reused for fifty floors (the floor number scales the monsters)."""
    ms = []
    for k in range(10):
        m, info = gen('abyss_%d' % (k + 1), 'Abyssal Spire', 40, 34, ['crystal', 'lava', 'ice', 'temple', 'factory'][k % 5], 2100 + k, enc='abyss', rooms=8, minr=(6, 5), maxr=(10, 8), music='castle')
        e = info['rooms'][0]; m.entry = [e.x + e.w // 2, e.y + e.h // 2]
        q = info['rooms'][-1]; put(m, 'orb', q.x + q.w // 2, q.y + 1); m.event(q.x + q.w // 2, q.y + 1, 'a5_abyss_up', touch=False)
        m.chest(q.x + 1, q.y + 1, 'elixir', gid='abyss_%d' % (k + 1)) if k == 9 else None
        savepoint(m, e.x + 1, e.y + 1)
        ms.append(m)
    e0 = ms[0]; ent = e0.entry
    door_up(ms[0], ent[0] - 1, 1, '@world', 0, 0) if False else None
    return ms

def build():
    fg, D1 = frostgate(); fgi = frostgate_ins(D1); fix_doors(fg, fgi)
    lm, D2 = lumen(); lmi = lumen_ins(D2); fix_doors(lm, lmi)
    md, D3 = mideel(); mdi = mideel_ins(D3); fix_doors(md, mdi)
    return [fg] + fgi + mines() + [lm] + lmi + deeproot() + [academy(), md] + mdi + trials() + citadel() + abyss()
