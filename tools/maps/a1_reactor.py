"""Act I, part 1: Reactor 4 (the opening mission), its core and the escape.

r4_gate   the outer gate and the night train platform (opening scene, first battle)
r4_1..3   Intake, Pressure Hall and Condenser Deck: big generated floors, linked by stairs
r4_core   the core chamber: Lyra at the console, Bulwark guarding the core
r4_escape the collapsing service catwalk (timed escape) -> the fall into the Sumps
"""
from _kit import *
from _gen import switches, gen, link, stairs, door_up, put, prop

def pad(rows, w, ch='#'):
    for r in rows: assert len(r) <= w, (len(r), r)
    return [r + ch * (w - len(r)) for r in rows]

L = {
    '#': (None, 'metal'), '.': ('metal',), ',': ('grate',), '=': ('darkmetal',), '~': ('aether',), 'v': ('void',),
    'T': ('darkcobble',), 'r': ('darkcobble', None, 'pipe_h'), 'o': ('metal', None, 'orb'), 'c': ('metal', None, 'crate'),
    'b': ('metal', None, 'barrel'), 'k': ('metal', None, 'console'), 'm': ('metal', None, 'machine'), 'p': ('metal', None, 'pipe_v'),
    'g': ('metal', None, 'gpipe_v'), 's': ('metal', None, 'sensor'), 'h': ('grate', None, 'pipe_h'), 'C': ('grate', None, 'crystal_big'),
    'G': ('metal',), 'S': ('grate',),
}

def build_gate():
    m = Map('r4_gate', 40, 32, 'Reactor 4 - Outer Gate', music='reactor', kind='dungeon')
    m.under = 'metal'
    rows = pad([
        '########################################',
        '#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT#',
        '#rTTTrTTTrTTTrTTTrTTTrTTTrTTTrTTTrTTTT#',
        '#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT#',
        '#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#',
        '#.o....cc...b.....o......o...k......o..#',
        '#......c...............................#',
        '#..........................b...........#',
        '#####p..p######.....######p..p##########',
        '#~~~~#..#~~~~~#.....#~~~~~#..#~~~~~~~~~#',
        '#~~~~#..#~~~~~#.....#~~~~~#..#~~~~~~~~~#',
        '#....,..,.....,.....,.....,..,.........#',
        '#.m..,..,..c..,.....,..s..,..,..m...s..#',
        '#....,..,.....,.....,.....,..,.........#',
        '#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#',
        '#....,..,..........................c...#',
        '#.k..,..,....p...p...p...p...p.....cc..#',
        '#....,..,..............................#',
        '#~~~~,~~,~~~~~~~...........~~~~~~~~~~~~#',
        '#~~~~,~~,~~~~~~~...........~~~~~~~~~~~~#',
        '#....,..,...............................',
        '#.o..,..,......o.........o.........o...#',
        '#....,..,..............................#',
        '#..b.,..,.......=========..............#',
        '#############p..=========..p############',
        '#############...=========...############',
        '#############m..=========..m############',
        '#############...=========...############',
        '#############...=========...############',
        '#############o..=========..o############',
        '##########################G#############',
        '########################################',
    ], 40)
    grid(m, rows, L)
    # the reactor doors (2 wide at the bottom of the ramp)
    m.ground('darkmetal', 19, 30, 20, 30); m.wall[m.i(19, 30)] = m.wall[m.i(20, 30)] = None
    m.walls('metal', 26, 30, 26, 30)
    m.gate('r4_gate_open', 19, 30, 2, 1, tile=('dungeon', 5, 1))
    m.warp(19, 30, 'r4_1', 0, 0, 2, 2)                 # target fixed below once r4_1 exists
    m.warp(39, 20, 'r4_gate', 38, 20, 3)               # (east alley is a dead end: Sable's lookout)
    # the console that opens the gate (Sable hacks it), the platform and the start
    m.event(29, 6, 'a1_gate_console', touch=False)
    m.event(18, 29, 'a1_gate_locked', 4, 1)
    m.entry = [5, 6]
    m.chest(37, 16, 'potion', 2); m.chest(2, 23, 'antidote', 2); m.chest(38, 7, 'gold', 100)
    m.sign(18, 8, 'AUREX DYNAMICS - REACTOR 4. Authorised personnel only.')
    m.npc(21, 5, 'pip', id='pip', ev='a1_pip', dir=2, still=1, unless='r4_in')
    m.npc(23, 6, 'marlo', id='marlo', ev='a1_marlo', dir=1, still=1, unless='r4_in')
    m.npc(16, 6, 'bram', id='bram', ev='a1_bram_gate', dir=2, still=1, unless='a1_open_done')
    m.npc(27, 6, 'sable', id='sable', ev='a1_sable_gate', dir=1, still=1, unless='a1_open_done')
    return m

def build_core():
    m = Map('r4_core', 34, 30, 'Reactor 4 - Core', music='reactor', kind='dungeon')
    m.under = 'grate'
    rows = pad([
        '##################################',
        '##################################',
        '####~~~~~~~~~~~~~~~~~~~~~~~~~~####',
        '###~~~~~~~~~~~~~~~~~~~~~~~~~~~~###',
        '##~~~~~~~~~~~~~,,,,~~~~~~~~~~~~~##',
        '##~~~~~~~~~~~~,,C,,,~~~~~~~~~~~~##',
        '##~~~~~~~~~~~~,,,,,,~~~~~~~~~~~~##',
        '##~~~~~~~~~~~~,,,,,,~~~~~~~~~~~~##',
        '##~~~~~~~~~~~~~,,,,~~~~~~~~~~~~~##',
        '##~~~~,,,,,,,,,,,,,,,,,,,,,,~~~~##',
        '##~~~~,~~~~~~~~,,,,~~~~~~~,~~~~~##',
        '##~~~~,~~~~~~~~,,,,~~~~~~~,~~~~~##',
        '##k...,...~~~~~,,,,~~~~~..,...k.##',
        '##....,...~~~~~,,,,~~~~~..,.....##',
        '##p...,,,,,,,,,,,,,,,,,,,,,...p.##',
        '##....,...~~~~~,,,,~~~~~..,.....##',
        '##m...,...~~~~~,,,,~~~~~..,..m..##',
        '##....,...~~~~~,,,,~~~~~..,.....##',
        '##~~~~,~~~~~~~~,,,,~~~~~~~,~~~~~##',
        '##~~~~,~~~~~~~~,,,,~~~~~~~,~~~~~##',
        '##~~~~,,,,,,,,,,,,,,,,,,,,,~~~~~##',
        '##~~~~~~~~~~~~~,,,,~~~~~~~~~~~~~##',
        '####~~~~~~~~~~~,,,,~~~~~~~~~~~####',
        '######.........,,,,.........######',
        '######.o....s..,,,,..s....o.######',
        '######.........,,,,.........######',
        '################,,################',
        '################,,################',
        '##################################',
        '##################################',
    ], 34)
    grid(m, rows, L)
    m.warp(16, 27, 'r4_3', 0, 0, 0, 2)                 # back up (fixed below)
    m.entry = [16, 25]
    m.event(15, 9, 'a1_bulwark', 4, 1, unless='r4_boss')
    m.event(15, 12, 'a1_core_after', 4, 1, if_='r4_boss&!r4_charge')
    m.chest(3, 12, 'hi_potion'); m.chest(31, 16, 'prism:scan')
    savepoint(m, 8, 24)
    return m

def build_escape():
    """A long service catwalk under the plate. The timer runs; sections collapse behind you."""
    W = 72
    m = Map('r4_escape', W, 20, 'Service Catwalk', music='reactor', kind='dungeon', dark=1)
    m.under = 'grate'
    m.ground('void', 0, 0, W - 1, 19); m.setcol(0, 0, SOLID, W, 20)
    # main catwalk with switchbacks
    def walk(x0, y0, x1, y1): m.ground('grate', min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1))
    walk(66, 9, 70, 10)
    walk(52, 9, 66, 10); walk(52, 3, 53, 10); walk(40, 3, 53, 4); walk(40, 3, 41, 15); walk(28, 14, 41, 15)
    walk(28, 6, 29, 15); walk(16, 6, 29, 7); walk(16, 6, 17, 13); walk(4, 12, 17, 13); walk(4, 12, 5, 16); walk(1, 15, 5, 16)
    # dead-end side platforms with chests (worth the seconds?)
    walk(58, 13, 61, 16); walk(59, 11, 60, 12); m.chest(60, 16, 'phoenix_down')
    walk(42, 8, 48, 9); m.chest(48, 8, 'ether')
    walk(18, 9, 24, 12); m.chest(24, 11, 'prism:restore')
    # pipes and supports on the void for depth
    for x in range(2, W - 2, 6):
        for y in (1, 18):
            if m.mat[m.i(x, y)] == 'void': m.stamp('pipes', 5, 1, x, y)
    m.entry = [69, 9]
    m.event(1, 15, 'a1_fall', 1, 2)
    m.event(55, 9, 'a1_esc_drago', 1, 2, unless='esc_drago')
    m.event(29, 9, 'a1_esc_collapse', 1, 1, unless='esc_collapse')
    return m

def build():
    gate = build_gate(); core = build_core(); esc = build_escape()
    # the generated floors: Intake, Pressure Hall, Condenser Deck
    f1, i1 = gen('r4_1', 'Reactor 4 - Intake', 60, 44, 'reactor', 41, enc='r4', rooms=12, pools=0.45,
                 chests=['potion', 'potion', ('gold', 150), 'grenade', 'antidote'])
    f2, i2 = gen('r4_2', 'Reactor 4 - Pressure Hall', 66, 46, 'reactor', 7, enc='r4', rooms=14, pools=0.5,
                 chests=['prism:bolt', 'phoenix_down', ('grenade', 2), ('potion', 3), ('gold', 220)])
    f3, i3 = gen('r4_3', 'Reactor 4 - Condenser Deck', 64, 48, 'reactor', 23, enc='r4', rooms=13, pools=0.5,
                 chests=['hi_potion', 'iron_bangle', 'ether', ('gold', 300), 'eye_drops'])
    # gate -> intake (a door in the top wall of the first room)
    e = i1['rooms'][0]; dx = e.x + e.w // 2 - 1
    door_up(f1, dx, e.y - 1, 'r4_gate', 19, 29); f1.entry = [dx, e.y + 1]
    for w in gate.warps:
        if w['to'] == 'r4_1': w['tx'] = dx + (w['x'] - 19); w['ty'] = e.y + 1
    # stairs: intake -> pressure hall -> condenser deck
    link(f1, i1['rooms'][-1], f2, i2['rooms'][0])
    link(f2, i2['rooms'][-1], f3, i3['rooms'][0])
    switches(f1, i1, 3, 'r4_valves1', 'valve')
    # the security shutter Lyra opens from inside (over the stairs down from the pressure hall)
    q = i2['rooms'][-1]; sx, sy = q.x + q.w // 2, q.y + 1
    f2.gate('r4_door', sx - 1, sy + 1, 3, 1, tile=('dungeon', 5, 1))
    f2.event(sx - 1, sy + 2, 'a1_r4_door', 3, 1, unless='r4_door')
    savepoint(f2, q.x + 1, q.y + q.h - 2)
    # condenser deck -> core (a door in the top wall of the last room)
    q = i3['rooms'][-1]; cx = q.x + q.w // 2 - 1
    door_up(f3, cx, q.y - 1, 'r4_core', 16, 26)
    for w in core.warps:
        if w['to'] == 'r4_3': w['tx'] = cx + (w['x'] - 16); w['ty'] = q.y + 1
    savepoint(f3, q.x + 1, q.y + 1)
    # Undercurrent rebels posted on the floors (they chat, heal, and give tips)
    r = i1['rooms'][1]; f1.npc(r.x + 1, r.y + 1, 'pip', id='pip1', say=['PIP: Biggest job we ever pulled, and the doors just... open for us.', 'PIP: Someone on the inside likes us.'], still=1, if_='r4_in&!r4_boss')
    r = i2['rooms'][2]; f2.npc(r.x + 2, r.y + 1, 'marlo', id='marlo2', ev='a1_marlo_heal', still=1, if_='r4_in&!r4_boss')
    return [gate, f1, f2, f3, core, esc]
