"""Battles and jingles."""
from score import *
from motifs import *


@track('battle', 'Clash of Wills (battle)')
def battle():
    S = Song(150, 112, rt=1.6, wet=0.22, loud=-14.5)
    riff = M('c2:e c2:e c3:e c2:e bb1:e c2:e g2:e c2:e')
    riff2 = M('c2:e c2:e c3:e c2:e d2:e eb2:e e2:e f2:e')
    intro = riff + riff2
    pA = prog('Cm:4 Cm:4 Ab:4 G:4 Cm:4 Ab:4 Bb:4 G:4')
    pB = prog('Ab:4 Bb:4 Gm:4 Cm:4 Ab:4 Bb:4 Fm7:2 G7:2 G:4')
    mA = M('g4:q. c5:e c5:q d5:q | eb5:q. d5:e c5:q bb4:q | ab4:q. bb4:e c5:q eb5:q | d5:h. g4:q '
           '| g4:q. c5:e c5:q d5:q | eb5:q f5:e eb5:e d5:q c5:q | bb4:q. c5:e d5:q f5:q | g5:w')
    mB = M('c6:q bb5:q ab5:q g5:q | f5:q. g5:e ab5:h | g5:q f5:q eb5:q d5:q | eb5:q. f5:e g5:h '
           '| ab5:q g5:q f5:q eb5:q | d5:q. eb5:e f5:h | eb5:q d5:q c5:q b4:q | d5:h. g4:q')
    # form: intro(8) A(32) B(32) A'(32) riff(8) = 112
    S.add('slap', intro, at=0, gain=1.1); S.add('slap', riff + riff2, at=104, gain=1.1)
    S.add('synbass', intro.tr(12), at=0, gain=0.5); S.add('synbass', (riff + riff2).tr(12), at=104, gain=0.5)
    stab = M('c4+eb4+g4:e! r:e r:q c4+eb4+g4:e! r:e r:q') + M('c4+eb4+g4:e! r:e r:q d4+f4+ab4:e! r:e eb4+g4+bb4:e e4+g4+c5:e!')
    S.add('brass', stab, at=0, pan=0.2); S.add('brass', stab, at=104, pan=0.2)
    body = pA + [(c, t + 32, d) for c, t, d in pB] + [(c, t + 64, d) for c, t, d in pA]
    S.add('bass', bassline(body, '1:.5 1:.5 8:.5 1:.5 1:.5 5:.5 b7:.5 5:.5', low=36), at=8, gain=0.85)
    S.add('trumpet', mA, at=8, pan=-0.1); S.add('horn', mA.tr(-12), at=8, pan=0.25, gain=0.7)
    S.add('strings_fast', comp(pA, '1:.5 1?:.5 1?:.5 1:.5', 55, 70, 0.5), at=8, pan=0.35, legato=0.5)
    S.add('strings', mB, at=40, pan=0.2); S.add('strings', mB.tr(-12), at=40, pan=-0.2, gain=0.6)
    S.add('brass', comp(pB, '1!:1.5 1:.5 r:1 1:1', 52, 67, 0.55), at=40, pan=-0.25)
    S.add('trumpet', mA, at=72, pan=-0.1); S.add('strings', mA.tr(12), at=72, pan=0.25, gain=0.7)
    S.add('horn', pad(pA, 50, 64, 0.45, n=3), at=72, pan=0.3)
    S.add('strings_fast', degarp(pB, '1 3 5 8 10 8 5 3', 0.25, low=55, vel=0.35), at=40, pan=0.35, gain=0.8)
    S.drums({'kick': 'x.....x.x.....x.', 'snare': '....x.......x...', 'hat': 'x.x.x.x.x.x.x.xx'}, 2, at=0, gain=0.6)
    S.drums({'kick': 'x.....x.x.....x.', 'snare': '....x.......x..o', 'hat': 'x.x.x.x.x.x.x.x.'}, 24, at=8, gain=0.6)
    S.drums({'kick': 'x.....x.x.....x.', 'snare': '....x.......x.xx', 'hat': 'x.x.x.x.x.x.x.xx'}, 2, at=104, gain=0.6)
    S.add('tom', M('c4:e c4:e a3:e a3:e f3:e f3:e d3:e d3:e'), at=100, gain=0.8)
    for b in (8, 40, 72): S.add('crash', M('c4:w'), at=b, gain=0.8)
    S.add('timpani', bassline(body, '1!:2 5:2', low=40, vel=0.6), at=8, gain=0.8)
    return S


@track('boss', 'Guardians (boss battle)')
def boss():
    S = Song(160, 128, rt=2.0, wet=0.26, loud=-14)
    riff = M('d2:e. d2:s d2:e f2:e d2:e g2:e d2:e ab2:e')
    riff2 = M('d2:e. d2:s d2:e f2:e d2:e c3:e bb2:e ab2:e')
    pA = prog('Dm:4 Dm:4 Bb:4 A:4 Dm:4 Gm:4 Eb:4 A7:4')
    pB = prog('Gm:4 Dm:4 Eb:4 Bb:4 Gm:4 Dm:4 Eb:4 A7sus4:2 A7:2')
    mA = M('d5:h a4:q d5:q | f5:q. e5:e d5:q a5:q | g5:h. f5:q | e5:w '
           '| d5:q. e5:e f5:q d5:q | bb5:h a5:q g5:q | g5:q. f5:e eb5:q g5:q | a5:h. r:q')
    mB = M('bb5:q. a5:e g5:q d5:q | f5:h. a5:q | g5:q f5:q eb5:q g5:q | f5:w '
           '| bb5:q. c6:e d6:q bb5:q | a5:h f5:h | g5:q. a5:e bb5:q g5:q | a5:h e5:h')
    # form: intro 8 | A 32 | B 32 | A' 32 | break 8 | riff 16
    intro = riff * 2
    S.add('synbass', intro + R(96) + riff * 2 + riff2 * 2, gain=0.9)
    S.add('slap', intro + R(96) + riff * 2 + riff2 * 2, gain=0.7)
    S.add('organ', M('d4+f4+a4+d5:w d4+f4+ab4+d5:w'), at=0, gain=0.9, pan=-0.2)
    S.add('choir', M('d4+a4+d5:h r:h d4+ab4+d5:h r:h'), at=0, pan=0.2)
    body = pA + [(c, t + 32, d) for c, t, d in pB] + [(c, t + 64, d) for c, t, d in pA]
    S.add('bass', bassline(body, '1:.5 1:.5 1:.5 8:.5 1:.5 1:.5 b7:.5 5:.5', low=38), at=8, gain=0.85)
    S.add('brass', mA, at=8, pan=-0.15); S.add('horn', mA.tr(-12), at=8, pan=0.2, gain=0.8)
    S.add('organ', pad(pA, 50, 67, 0.5), at=8, pan=0.3, gain=0.6)
    S.add('strings_fast', degarp(pA, '1 b2 3 5 8 5 3 b2', 0.25, low=50, vel=0.35), at=8, pan=-0.35, gain=0.8)
    S.add('strings', mB, at=40, pan=0.15); S.add('trumpet', mB.tr(-12), at=40, pan=-0.2, gain=0.7)
    S.add('choir', pad(pB, 55, 72, 0.6), at=40, pan=-0.3, gain=0.7)
    S.add('strings_fast', comp(pB, '1:.5 1?:.5 1?:.5 1:.5', 50, 64, 0.5), at=40, pan=0.35, legato=0.5)
    S.add('brass', mA.tr(12).vel(0.9), at=72, pan=-0.15); S.add('strings', mA, at=72, pan=0.2)
    S.add('choir', pad(pA, 55, 74, 0.6), at=72, pan=0.3, gain=0.8)
    S.add('organ', M('d3+a3+d4:w eb3+bb3+eb4:w e3+b3+e4:w a2+e3+a3:w'), at=104, gain=0.9)
    S.add('timpani', roll(45, 8, 8, 0.3, 0.9), at=104)
    S.add('brass', M('d4+f4+a4:q. d4+f4+a4:e r:h eb4+g4+bb4:q. eb4+g4+bb4:e r:h e4+g#4+b4:q. e4+g#4+b4:e r:h a3+c#4+e4:w'), at=104, gain=0.9)
    S.drums({'kick': 'x..x..x.x..x..x.', 'snare': '....x.......x...', 'hat': 'x.x.x.x.x.x.x.x.'}, 2, at=0, gain=0.6)
    S.drums({'kick': 'x..x..x.x..x..x.', 'snare': '....x.......x..o', 'ride': 'x.x.x.x.x.x.x.x.'}, 24, at=8, gain=0.6)
    S.drums({'kick': 'x..x..x.x..x..x.', 'snare': '....x.......x.xx', 'hat': 'x.x.x.x.x.x.x.x.'}, 4, at=112, gain=0.6)
    S.add('taiko', M('c4:q c4:q c4:q c4:q') * 2, at=104, gain=0.8)
    for b in (8, 40, 72, 112): S.add('crash', M('c4:w'), at=b, gain=0.8)
    S.add('timpani', bassline(body, '1!:1 1:1 5:1 1:1', low=38, vel=0.6), at=8, gain=0.7)
    return S


@track('victory', 'Victory Fanfare (jingle)', kbps=32)
def victory():
    S = Song(126, 16, loop=False, rt=1.8, wet=0.3, loud=-14)
    fan = M('f4:t bb4:t d5:t f5:q. d5:e eb5:q. f5:e | g5:q. f5:e eb5:e d5:e c5:e eb5:e | d5:q. c5:e bb4:q d5:q | f5:h. r:q')
    S.add('trumpet', fan, pan=-0.1); S.add('horn', fan.tr(-12), pan=0.2, gain=0.7)
    pr = prog('Bb:2 Eb:2 Eb:2 F:2 Bb:2 Gm:2 Bb:4')
    S.add('brass', comp(pr, '1:.5 1?:.5 r:1', 50, 65, 0.6), at=1, pan=0.3)
    S.add('strings', pad(pr, 55, 72, 0.6), at=1, pan=-0.3, gain=0.8)
    S.add('bass', bassline(pr, '1:1 5:1', low=34), at=1)
    S.add('timpani', M('bb2:e bb2:e f2:q bb2:q f2:q bb2:e bb2:e f2:q bb2:q f2:q f2:q bb2:q f2:q bb2:q') + roll(46, 4, 10, 0.3, 0.9), at=1, gain=0.8)
    S.add('crash', M('c4:w'), at=1); S.add('crash', M('c4:w'), at=13)
    S.add('brass', M('bb3+d4+f4+bb4:w'), at=13, gain=1.1); S.add('strings', M('bb4+d5+f5+bb5:w'), at=13)
    S.add('glock', M('bb5:e d6:e f6:e bb6:q'), at=13, gain=0.8)
    return S


@track('gameover', 'The Light Fades (game over)', kbps=32)
def gameover():
    S = Song(58, 16, loop=False, rt=3.0, wet=0.45, loud=-19)
    S.add('piano', M('c5:h ab4:q c5:q | db5:h. c5:q | bb4:q ab4:q g4:q f4:q | f4:w'))
    S.add('strings', pad(prog('Fm:4 Dbmaj7:4 Bbm7:2 C7sus4:2 Fm:4'), 53, 70, 0.45), gain=0.7)
    S.add('strings_lo', M('f2:w db2:w bb1:h c2:h f2:w'), gain=0.8)
    S.add('celesta', M('ab5:w'), at=12, gain=0.5)
    return S


@track('levelup', 'A Night\'s Rest (inn jingle)', kbps=32)
def levelup():
    S = Song(96, 8, loop=False, rt=2.4, wet=0.4, loud=-17)
    S.add('harp', degarp(prog('Gmaj9:4'), '1 5 9 10 12 16 17 19', 0.25, low=43, vel=0.55))
    S.add('celesta', M('d6:e b5:e a5:e g5:e d6:h'), gain=0.8)
    S.add('strings', M('g4+b4+d5+f#5:w'), at=0.5, gain=0.6)
    S.add('flute', M('r:q b5:q a5:q d6:q | g5:w'), gain=0.8)
    S.add('triangle', M('a6:w'), at=4, gain=0.5)
    return S


@track('fierce', 'Those Who Stand (rival and last-stand battles)')
def fierce():
    S = Song(168, 128, rt=1.6, wet=0.22, loud=-14)
    riff = M('e2:e e2:e e3:e e2:e d2:e e2:e g2:e a2:e')
    riff2 = M('e2:e e2:e e3:e e2:e g2:e f#2:e d2:e b1:e')
    pA = prog('Em:4 Em:4 C:4 B:4 Em:4 G:4 Am:2 C:2 B7:4')
    mA = M('e5:q. b4:e e5:q f#5:q | g5:q. f#5:e e5:q d5:q | c5:q. d5:e e5:q g5:q | f#5:h. b4:q '
           '| e5:q. b4:e e5:q f#5:q | g5:q a5:q b5:q d6:q | c6:q b5:q a5:q g5:q | f#5:w')
    # B: the main theme breaks through, in G
    pB = prog('G:4 Em:4 C:4 D:4 G/B:4 C:4 Am7:4 D7sus4:2 D7:2')
    mB = MAIN_A.tr(5)
    S.add('slap', riff + riff2, gain=1.0); S.add('synbass', (riff + riff2).tr(12), gain=0.45)
    S.add('slap', riff + riff2, at=120, gain=1.0); S.add('synbass', (riff + riff2).tr(12), at=120, gain=0.45)
    S.add('brass', M('e4+g4+b4:e! r:e r:q e4+g4+b4:e! r:e r:q') + M('e4+g4+b4:e! r:e r:q d4+f#4+a4:e! r:e d#4+f#4+b4:q!'), pan=0.2)
    body = pA + [(c, t + 32, d) for c, t, d in pB] + [(c, t + 64, d) for c, t, d in pA] + [(c, t + 96, d) for c, t, d in pB[:4]]
    S.add('bass', bassline(body, '1:.5 1:.5 8:.5 1:.5 1:.5 5:.5 8:.5 5:.5', low=36), at=8, gain=0.8)
    S.add('trumpet', mA, at=8, pan=-0.1); S.add('strings', mA.tr(-12), at=8, pan=0.25, gain=0.6)
    S.add('strings_fast', comp(pA, '1:.5 1?:.5 1?:.5 1:.5', 52, 67, 0.5), at=8, pan=0.35, legato=0.5, gain=0.7)
    S.add('strings', mB, at=40, pan=0.2); S.add('horn', mB.tr(-12), at=40, pan=-0.2, gain=0.8)
    S.add('brass', comp(pB, '1!:1 r:.5 1:.5 r:1 1:1', 50, 64, 0.5), at=40, pan=-0.3, gain=0.6)
    S.add('trumpet', mA, at=72, pan=-0.1); S.add('strings', mA.tr(12), at=72, pan=0.25, gain=0.7)
    S.add('strings_fast', degarp(pA, '1 3 5 8 10 8 5 3', 0.25, low=52, vel=0.35), at=72, pan=0.35, gain=0.7)
    S.add('strings', M('d5:q f#5:q b5:h | a5:q. g5:e g5:q b5:q | a5:q g5:q f#5:q e5:q | f#5:h. r:q'), at=104, pan=0.2)
    S.add('brass', M('d5:q f#5:q b5:h | a5:q. g5:e g5:q b5:q | a5:q g5:q f#5:q e5:q | f#5:h. r:q').tr(-12), at=104, pan=-0.2, gain=0.7)
    S.drums({'kick': 'x.x...x.x.x...x.', 'snare': '....x.......x...', 'hat': 'x.x.x.x.x.x.x.x.'}, 32, gain=0.6)
    S.add('tom', M('e4:s e4:s c4:s c4:s a3:s a3:s f3:s f3:s'), at=126, gain=0.8)
    for b in (8, 40, 72, 104): S.add('crash', M('c4:w'), at=b, gain=0.8)
    S.add('timpani', bassline(body, '1!:2 5:2', low=40, vel=0.6), at=8, gain=0.7)
    return S


@track('vesper_battle', 'One, Two, Three (Vesper)')
def vesper_battle():
    S = Song(176, 132, rt=2.2, wet=0.28, loud=-14.5)    # 3/4
    pV = prog(VES_P)
    mB = M('e5:q f5:q g5:q | a5:h. | g5:q f#5:q e5:q | b5:h. | c6:q b5:q a5:q | g5:q f#5:q e5:q | f#5:q g5:q a5:q | b5:h.')
    pB = prog('Am:3 Am:3 Em:3 Em:3 C:3 Em:3 Am:3 B7:3')
    mC = M('e5:q d#5:q d5:q | c#5:h. | c5:q b4:q bb4:q | a4:h. | g4:q f#4:q f4:q | e4:h. | d#4:q e4:q f#4:q | b4:h.')
    pC = prog('Em:3 A7:3 C:3 Am:3 Em:3 Em:3 B7:3 B7:3')
    # intro: the count, on bells and organ
    S.add('bell', M('b5:q a5:q g5:q | r:h. | b5:q a5:q g5:q | r:h.'), pan=-0.2)
    S.add('organ', M('e3+b3+e4+g4:h. d#3+a3+b3+f#4:h. e3+b3+e4+g4:h. b2+f#3+a3+d#4:h.'), gain=0.8)
    S.add('timpani', M('e2:q e2:q e2:q b1:h. e2:q e2:q e2:q b1:q b1:q b1:q'))
    # A: strings and choir; A2: brass with harpsichord; B; C; A3: everything
    S.add('strings', VES_A.tr(12), at=12, pan=0.2); S.add('choir', VES_A, at=12, pan=-0.2, gain=0.6)
    S.add('brass', VES_A, at=36, pan=-0.1); S.add('harpsi', degarp(pV, '1 3 5 8 5 3', 0.5, low=52, vel=0.5), at=36, pan=0.35, gain=0.45)
    S.add('strings', mB, at=60, pan=0.2); S.add('horn', mB.tr(-12), at=60, pan=-0.2, gain=0.7)
    S.add('choir', mC.tr(12), at=84, pan=0.0); S.add('organ', pad(pC, 52, 67, 0.5), at=84, gain=0.6)
    S.add('trumpet', VES_A, at=108, pan=-0.1); S.add('strings', VES_A.tr(12), at=108, pan=0.25)
    S.add('choir', pad(pV, 55, 71, 0.6), at=108, pan=-0.3, gain=0.7)
    body = pV + [(c, t + 24, d) for c, t, d in pV] + [(c, t + 48, d) for c, t, d in pB] + [(c, t + 72, d) for c, t, d in pC] + [(c, t + 96, d) for c, t, d in pV]
    S.add('bass', bassline(body, '1!:1 5:1 8:1', low=36), at=12, gain=0.8)
    S.add('strings_fast', comp(body, 'r:1 1:1 1?:1', 55, 69, 0.5), at=12, pan=0.35, legato=0.5, gain=0.6)
    S.drums({'kick': 'x.....', 'snare': '..x.x.', 'hat': 'x.x.x.'}, 40, bpb=3, spb=2, at=12, gain=0.55)
    S.add('timpani', bassline(body, '1!:3', low=40, vel=0.6), at=12, gain=0.7)
    for b in (12, 60, 108): S.add('crash', M('c4:h.'), at=b, gain=0.8)
    S.add('bell', VES_COUNT.tr(12), at=105, gain=0.6)
    return S


@track('nyxar', 'The Last Memory (Nyxar)')
def nyxar():
    S = Song(140, 132, rt=2.6, wet=0.3, loud=-13.5)
    # intro: the gong, and the hollow tritone sung by the choir (16)
    S.add('gong', M('d2:w'), gain=1.0)
    S.add('choir', NYX_A.oct(0, 1), pan=0.0); S.add('organ', NYX_A.tr(-12), gain=0.8)
    S.add('timpani', roll(38, 4, 8, 0.2, 0.9), at=12)
    # A: 7/8, twice (56)
    riff = M('d2:e d2:e d3:e d2:e ab2:e d2:e c3:e')
    mA = M('d5:q f5:q a5:q. | g#5:q. f5:q e5:q | f5:q e5:q d5:q. | c#5:3.5 | d5:q f5:q a5:q. | bb5:q. a5:q g#5:q | a5:q g5:q f5:q. | e5:3.5')
    pA = prog('Dm:3.5 E7/D:3.5 Dm:3.5 A7:3.5 Dm:3.5 Bb:3.5 Dm/F:3.5 A7:3.5')
    S.add('slap', riff * 16, at=16, gain=1.0); S.add('synbass', riff.tr(12) * 16, at=16, gain=0.45)
    S.add('brass', mA, at=16, pan=-0.1); S.add('strings', mA.tr(12), at=16, pan=0.2, gain=0.5)
    S.add('trumpet', mA, at=44, pan=-0.1); S.add('choir', mA.tr(-12), at=44, pan=0.25, gain=0.8)
    S.add('strings_fast', degarp(pA, '1 b2 3 5 8 5 3', 0.5, low=50, vel=0.4) * 2, at=16, pan=0.35, gain=0.7)
    S.add('organ', pad(pA, 50, 64, 0.5) * 2, at=16, pan=-0.3, gain=0.5)
    S.drums({'kick': 'x..x.x.', 'snare': '..x...x', 'hat': 'xxxxxxx'}, 16, bpb=3.5, spb=2, at=16, gain=0.6)
    # B: 4/4 - Lyra's song fights back in D major, then the main theme (32)
    pB = prog('D:4 F#m/C#:4 Bm:4 G:4 D/F#:4 G:4 Em7:4 A7:4')
    lyr = LYRA_A.tr(-3); mainend = M('a4:q f#5:q. e5:e d5:q | d5:q b5:h a5:q | g5:q. f#5:e e5:q d5:q | e5:h. r:q')
    S.add('strings', P([e for e in lyr.ev if e[0] < 16], 16).tr(12) + mainend.tr(12), at=72, pan=0.2)
    S.add('horn', P([e for e in lyr.ev if e[0] < 16], 16) + mainend, at=72, pan=-0.2)
    S.add('choir', pad(pB, 55, 72, 0.7), at=72, pan=0.0, gain=0.9)
    S.add('bass', bassline(pB, '1:.5 1:.5 8:.5 1:.5 5:.5 1:.5 8:.5 5:.5', low=38), at=72, gain=0.8)
    S.add('strings_fast', degarp(pB, '1 5 8 10 12 10 8 5', 0.25, low=50, vel=0.35), at=72, pan=0.35, gain=0.7)
    S.drums({'kick': 'x.....x.x.......', 'snare': '....x.......x...', 'ride': 'x.x.x.x.x.x.x.x.'}, 8, at=72, gain=0.6)
    S.add('crash', M('c4:w'), at=72); S.add('crash', M('c4:w'), at=88)
    # C: back to 7/8, the choir chants Nyxar over the riff (28)
    S.add('slap', riff * 8, at=104, gain=1.0); S.add('synbass', riff.tr(12) * 8, at=104, gain=0.45)
    S.add('choir', M('d5:q. g#5:q. d5:q. g#5:q. g5:q. c#5:q. g5:q. c#5:q. c5:q. f#5:q. c5:q. f#5:q. f5:3.5 e5:3.5').tr(-12).oct(0, 1), at=104, pan=0.0)
    S.add('brass', M('d4+a4:3.5 d4+g#4:3.5 c#4+g4:3.5 c#4+g4:3.5 c4+f#4:3.5 c4+f#4:3.5 c4+f4:3.5 c#4+e4+a4:3.5'), at=104, pan=-0.3, gain=0.7)
    S.drums({'kick': 'x..x.x.', 'snare': '..x...x', 'hat': 'xxxxxxx'}, 8, bpb=3.5, spb=2, at=104, gain=0.6)
    S.add('tom', M('d4:e d4:e c4:e c4:e a3:e a3:e f3:e'), at=128.5, gain=0.8)
    S.add('crash', M('c4:w'), at=16); S.add('crash', M('c4:w'), at=104)
    return S
