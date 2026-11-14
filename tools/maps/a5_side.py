"""Optional places: Plumage Isle (talonbird breeding and the Gold Talonbird) and Shipwreck Cove (the Nocturne Echo,
Kestra's last stand, Sable's ultimate weapon)."""
from _kit import *
from _gen import gen, link, door_up, put, prop
from a2_meridia import town, exit_south, doors, deco_town
from a1_sumps import fix_doors

def plumage():
    m = town('talon_isle', 'Plumage Isle', 50, 38, ground='grass', seed=121, music='peaceful')
    m.ground('sand', 3, 30, 46, 35); m.ground('dirt', 24, 3, 26, 34)
    m.ground('dirt', 30, 8, 46, 22)
    for x in range(30, 47): m.stamp('house', 11, 4, x, 7, col=LOW); m.stamp('house', 11, 4, x, 23, col=LOW)
    D = doors(m, [(6, 8, 'hall', 'pi_stable'), (14, 10, 'thatch', 'pi_hut')])
    for (x, y, n) in ((34, 12, 'Owl2'), (40, 15, 'Owl'), (43, 19, 'Owl2'), (36, 18, 'Owl')): m.npc(x, y, n, name='TALONBIRD', walk=2, say=['Kwark!'])
    m.npc(26, 20, 'Cavegirl', id='breeder', name='CHOCO-WEN', ev='a5_breeder', still=1, dir=2)
    m.npc(20, 26, 'Hunter', name='RACE SCOUT', ev='a5_racescout', walk=1)
    savepoint(m, 22, 14); deco_town(m, 122, n_trees=10); exit_south(m, 24, 3); m.entry = [25, 34]
    return m, D

def plumage_ins(D):
    to = lambda k: ('talon_isle',) + D[k]
    s = interior('pi_stable', 'The Great Stable', 22, 14, to('pi_stable'), floor='planks', wall='wood', door=10, music='peaceful')
    for x in range(3, 20, 4): s.stamp('house', 11, 4, x, 6, col=LOW)
    s.npc(5, 4, 'Owl2', name='SUNWING', still=1, say=['A champion racer. It looks at you like you owe it money.'])
    s.npc(16, 9, 'OldMan', name='OLD BREEDER', ev='a5_oldbreeder', still=1, dir=3)
    h = interior('pi_hut', 'Wen\'s Hut', 12, 10, to('pi_hut'), door=6); bed(h, 1, 3); table(h, 4, 6); h.npc(6, 4, 'Woman', name='WEN\'S MUM', ev='inn_plumage', still=1, dir=2)
    return [s, h]

def cove():
    m1, i1 = gen('wreck_isle', 'Shipwreck Cove', 58, 44, 'ship', 2301, enc='cove', rooms=12, chests=['x_potion', 'prism:absorb_mp', ('gold', 9000)], pools=0.6, music='boat')
    m2, i2 = gen('wreck_isle_2', 'Shipwreck Cove - The Black Hold', 58, 44, 'ship', 2302, enc='cove', rooms=12, chests=['megalixir', 'ribbon', 'elixir'], pools=0.5, music='crypt')
    m2.dark = 2
    e = i1['rooms'][0]; door_up(m1, e.x + e.w // 2 - 1, e.y - 1, '@world', 0, 0); m1.entry = [e.x + e.w // 2, e.y + 1]
    link(m1, i1['rooms'][-1], m2, i2['rooms'][0])
    q = i1['rooms'][len(i1['rooms']) // 2]; m1.event(q.x, q.y + q.h // 2, 'a5_kestra2', q.w, 1, unless='a5_kestra2')
    q = i2['rooms'][-1]; m2.event(q.x, q.y + q.h // 2, 'a5_nocturne', q.w, 1, unless='a5_nocturne'); put(m2, 'crystal_big', q.x + q.w // 2 - 1, q.y + 1)
    savepoint(m2, i2['rooms'][-2].x + 1, i2['rooms'][-2].y + 1)
    return [m1, m2]

def build():
    p, D = plumage(); pi = plumage_ins(D); fix_doors(p, pi)
    return [p] + pi + cove()
