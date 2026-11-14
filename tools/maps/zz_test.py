"""A small test area for the engine."""
from _kit import *

def build():
    m = Map('test', 40, 30, 'Test Meadow', music='town', enc=None)
    m.ground('grass', 0, 0, 39, 29)
    m.paint([
        '........................................',
        '........................................',
        '..........ddddddddddddddddddd...........',
        '..........d.................d...........',
        '..........d....~~~~~~.......d...........',
        '..........d...~~~~~~~~......d...........',
        '..........d...~~~~~~~~......d...........',
        '..........d....~~~~~~.......d...........',
        '..........d.................d...........',
        '...dddddddddddddddddddddddddddddddd.....',
        '..........d.................d...........',
        '..........d....sssss........d...........',
        '..........d...sssssss.......d...........',
        '..........ddddddddddddddddddd...........',
    ], {'d': ('g', 'dirt'), '~': ('g', 'water'), 's': ('g', 'sand')}, 0, 0)
    forest(m, 0, 18, 39, 29, seed=2)
    forest(m, 32, 0, 39, 17, seed=4)
    tree(m, 4, 3); tree(m, 7, 5, 'pine'); tree(m, 24, 15, 'light')
    house(m, 20, 2, 'orange', to=('test_in', 7, 11))
    flowers(m, [(5, 11), (6, 12), (8, 11), (22, 11)])
    bush(m, 14, 15); bush(m, 15, 15)
    savepoint(m, 12, 10)
    sign(m, 9, 9, 'Test Meadow. East: a cave.')
    m.npc(16, 10, 'Villager', say=['Hello! This is a test.', 'Still a test.'], walk=2)
    m.npc(18, 12, 'OldMan', say='The cave to the east has monsters.', name='OLD MAN')
    m.chest(26, 11, 'potion', 3)
    m.warp(35, 9, 'test_cave', 3, 10, 1)
    m.zone(0, 14, 40, 4, 'test_field')
    m.entry = [12, 12]
    # interior
    h = Map('test_in', 16, 14, 'Little House', music='village', kind='house')
    h.under = 'tile'
    room(h, 0, 0, 15, 13, floor='tile', wall='pale', thick=3)
    h.warp(7, 13, 'test', 21, 5, 2); h.ground('tile', 7, 13, 7, 13); h.wall[h.i(7, 13)] = None; h.setcol(7, 13, OPEN)
    h.npc(5, 6, 'Woman', say='Make yourself at home.', name='MARA')
    h.npc(10, 5, 'Merchant' if False else 'Noble', shop='test_shop', name='TRADER')
    h.chest(13, 4, 'hi_potion')
    # cave
    c = Map('test_cave', 30, 22, 'Test Cave', music='cave', kind='dungeon', enc='test_cave')
    c.under = 'cave'
    c.walls('rock', 0, 0, 29, 21)
    carve(c, 1, 8, 12, 12, 'cave'); carve(c, 12, 3, 16, 18, 'cave'); carve(c, 16, 14, 27, 18, 'cave'); carve(c, 18, 3, 26, 8, 'cave'); carve(c, 16, 5, 18, 6, 'cave')
    c.ground('water', 20, 15, 22, 16)
    c.warp(0, 10, 'test', 34, 9, 3); c.wall[c.i(0, 10)] = None; c.ground('cave', 0, 10, 0, 10); c.setcol(0, 10, OPEN)
    c.chest(25, 4, 'ether'); c.chest(26, 17, 'prism:fire')
    c.event(22, 5, 'testboss', touch=False)
    c.npc(22, 5, 'Knight', say='...')
    return [m, h, c]
