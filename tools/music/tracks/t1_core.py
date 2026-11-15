"""Title, world map, airship, sea, talonbirds."""
from score import *
from motifs import *


@track('prelude', 'Prelude of Crystals')
def prelude():
    S = Song(70, 64, rt=3.0, wet=0.42, loud=-18)
    p1 = prog('Dmaj9:4 Bm9:4 Gmaj9:4 A7sus4:4 F#m7:4 Bm9:4 Em9:4 A7sus4:4')
    p2 = prog('Dmaj9:4 Bm9:4 Gmaj9:4 A7sus4:4 D/F#:4 Gmaj9:4 Em9:4 A7sus4:2 A7:2')
    harp = degarp(p1, CRYSTAL_UPDOWN, 0.25, low=38, vel=0.5) + degarp(p2, CRYSTAL_UPDOWN, 0.25, low=38, vel=0.55)
    S.add('harp', harp, pan=-0.2)
    S.add('strings', pad(p1, 57, 74, 0.28) + pad(p2, 57, 76, 0.38), pan=0.2, gain=0.5)
    S.add('strings_lo', bassline(p1 + [(c, t + 32, d) for c, t, d in p2], '1:4', low=38, vel=0.45))
    S.add('flute', MAIN_A.vel(0.85), at=32, pan=0.1)
    S.add('celesta', MAIN_A.vel(0.35).tr(12), at=32, pan=-0.3)
    S.add('triangle', M('a6:w') * 4 + M('a6:w') * 4, gain=0.35)
    return S


@track('world', 'Legend of Aethra (the world map)')
def world():
    S = Song(104, 112, rt=2.2, wet=0.3, loud=-15.5)
    intro = prog('D:4 G/D:4 A/D:4 D:2 A7:2')
    pa, pb = prog(MAIN_PA), prog(MAIN_PB)
    allp = intro + [(c, t + 16, d) for c, t, d in pa] + [(c, t + 48, d) for c, t, d in pb] + [(c, t + 80, d) for c, t, d in pa]
    # intro fanfare: brass chords on the off-beats rising, timpani
    S.add('brass', comp(intro, '1!:1.5 1:.5 1:2', 55, 74, 0.7), pan=0.15)
    S.add('timpani', M('d3:q d3:e d3:e a2:h') * 3 + M('a2:q a2:e a2:e a2:q a2:q'), gain=0.9)
    S.add('crash', M('c4:w'), at=0, gain=0.7)
    # melody: horns (A), strings and trumpet (B), full strings and brass (A')
    S.add('horn', MAIN_A.tr(-12), at=16, pan=-0.15)
    S.add('strings', MAIN_A.vel(0.55), at=16, pan=0.2)
    S.add('strings', MAIN_B, at=48, pan=0.2)
    S.add('trumpet', MAIN_B.vel(0.7).tr(-12), at=48, pan=-0.1)
    S.add('strings', MAIN_A.oct(0, -1), at=80, pan=0.2)
    S.add('brass', MAIN_A.vel(0.7).tr(-12), at=80, pan=-0.2)
    S.add('horn', pad(pa, 50, 66, 0.4, n=3), at=80, pan=-0.3)
    # accompaniment
    S.add('strings_fast', comp(allp, '1:.5 1?:.5', 52, 69, 0.38), pan=-0.35, legato=0.6)
    S.add('harp', degarp(allp[3:], '1 5 8 10 12 10 8 5', 0.5, low=45, vel=0.38), at=0, pan=0.4)
    S.add('bass', bassline(allp, '1:1 1:.5 5:.5 8:1 5:1', low=38, vel=0.7))
    S.add('strings_lo', bassline(allp, '1:4', low=38, vel=0.35))
    S.drums({'snare': '....x..o....x.xo', 'kick': 'x.......x.......'}, 24, at=16, gain=0.4)
    S.add('crash', M('c4:w'), at=16, gain=0.6); S.add('crash', M('c4:w'), at=48, gain=0.6); S.add('crash', M('c4:w'), at=80, gain=0.7)
    S.add('swell', M('c4:w'), at=44, gain=0.8); S.add('swell', M('c4:w'), at=76, gain=0.8); S.add('swell', M('c4:w'), at=108, gain=0.6)
    S.add('timpani', bassline(allp[3:], '1:2 5?:2', low=40, vel=0.55), at=0, gain=0.6)
    return S


@track('airship', 'Skylark (airship)')
def airship():
    S = Song(132, 112, rt=2.0, wet=0.28, loud=-15)
    E = 2  # the main theme, up a tone in E major, flying
    pa, pb = prog(MAIN_PA), prog(MAIN_PB)
    intro = prog('E:4 E:4 Asus2/E:4 B7sus4:2 B7:2')
    allp = intro + [(c, t + 16, d) for c, t, d in pa] + [(c, t + 48, d) for c, t, d in pb] + [(c, t + 80, d) for c, t, d in pa]
    trp = lambda pr: [(c, t, d) for c, t, d in pr]
    S.add('strings_fast', degarp(intro, '1 5 8 9 10 12 10 9', 0.25, low=52, vel=0.45), pan=0.3)
    S.add('horn', M('b4:h. e5:q | g#5:w | a5:h. e5:q | f#5:w'), pan=-0.2)
    S.add('trumpet', MAIN_A.tr(E - 12), at=16, pan=-0.15)
    S.add('strings', MAIN_A.tr(E), at=16, pan=0.2, gain=0.6)
    S.add('strings', MAIN_B.tr(E), at=48, pan=0.2)
    S.add('horn', MAIN_B.tr(E - 12), at=48, pan=-0.25, gain=0.7)
    S.add('strings', MAIN_A.tr(E).oct(0, -1), at=80, pan=0.2)
    S.add('brass', MAIN_A.tr(E - 12), at=80, pan=-0.15, gain=0.8)
    S.add('glock', MAIN_A.tr(E + 12).vel(0.6), at=80, pan=-0.35, gain=0.6)
    S.add('strings_fast', degarp(allp[4:], '1 5 8 10 12 10 8 5', 0.25, low=50, vel=0.32), pan=0.35, tr=E)
    S.add('bass', bassline(allp[4:], '1:.5 r:.5 8:.5 1:.5 5:.5 r:.5 8:.5 5:.5', low=36, vel=0.75), tr=E, gain=0.6)
    S.add('bass', bassline(intro, '1:.5 r:.5 8:.5 1:.5 5:.5 r:.5 8:.5 5:.5', low=40, vel=0.75), gain=0.6)
    S.add('brass', comp(allp[4:], 'r:.5 1:.5 r:1 r:.5 1:.5 r:1', 55, 68, 0.45), pan=0.25, tr=E, gain=0.45)
    S.drums({'kick': 'x.....x.x.......', 'snare': '....x.......x...', 'hat': 'x.xxx.xxx.xxx.xx'}, 28, gain=0.5)
    for b in (16, 48, 80): S.add('crash', M('c4:w'), at=b, gain=0.7)
    S.add('swell', M('c4:w'), at=12, gain=0.8)
    S.add('timpani', bassline(allp[4:], '1!:2 5:2', low=40, vel=0.5), tr=E, gain=0.7)
    return S


@track('sea', 'Open Waters (the sea)')
def sea():
    S = Song(190, 192, rt=2.2, wet=0.3, loud=-16.5)   # 6/8: one beat is an eighth note, a bar is 6
    A = M('d5:q g5:h g5:q a5:q b5:q | a5:q g5:q e5:q d5:h. | e5:q g5:h g5:q a5:q b5:q | c6:h b5:q a5:h. '
          '| d5:q g5:h g5:q a5:q b5:q | c6:q b5:q a5:q b5:h g5:q | a5:q g5:q f#5:q e5:q d5:q c5:q | d5:h. d5:q e5:q f#5:q')
    B = M('g5:h. b5:h. | a5:q g5:q f#5:q e5:h. | d5:h e5:q f#5:h g5:q | a5:h. r:h. '
          '| b5:h. d6:h. | c6:q b5:q a5:q g5:h e5:q | d5:q e5:q g5:q a5:h b5:q | g5:h. r:h.')
    pA = prog('G:6 C:6 Em:6 D:6 G:6 C:6 Am7:6 D:6')
    pB = prog('Em:6 C:6 D:6 D:6 G:6 C:6 D:6 G:6')
    allp = pA + [(c, t + 48, d) for c, t, d in pB]; two = allp + [(c, t + 96, d) for c, t, d in allp]
    S.add('accordion', A + B, pan=-0.15)
    S.add('flute', (A + B).tr(12).vel(0.85), at=96, pan=0.2)
    S.add('clarinet', A + B, at=96, pan=-0.2, gain=0.6)
    S.add('guitar', comp(two, 'r:1 1:1 1?:1 r:1 1:1 1?:1', 55, 67, 0.45), pan=0.3, gain=0.45)
    S.add('bass', bassline(two, '1:3 5:3', low=36, vel=0.75))
    S.add('harp', degarp(two, '1 5 8 10 8 5', 1, low=43, vel=0.35), pan=-0.35)
    S.add('strings', pad(two, 55, 71, 0.35), pan=0.1, gain=0.5)
    S.drums({'handdrum': 'x..o..', 'tamb': '...x..'}, 32, bpb=6, spb=1, gain=0.5)
    return S


@track('talon', 'Talon Trot (talonbirds and ranches)')
def talon():
    S = Song(152, 96, swing=0.16, rt=1.4, wet=0.22, loud=-15.5)
    A = M('c5:e d5:e f5:q a5:q. g5:e | f5:q d5:q c5:h | d5:e e5:e f5:q bb5:q. a5:e | g5:h. r:q '
          '| c5:e d5:e f5:q a5:q c6:q | d6:q. c6:e a5:q f5:q | g5:q a5:e g5:e e5:q c5:q | f5:h. r:q')
    B = M('bb5:e a5:e bb5:e d6:e c6:h | a5:e g5:e a5:e c6:e f5:h | g5:e f5:e g5:e bb5:e a5:q g5:q | e5:q g5:q c6:h '
          '| c5:e d5:e f5:q a5:q c6:q | d6:q. c6:e a5:q f5:q | g5:q a5:e g5:e e5:q c5:q | f5:h. r:q')
    pA = prog('F:4 F:4 Bb:4 C7:4 F:4 Dm:4 C7:4 F:4'); pB = prog('Bb:4 F:4 Gm7:4 C7:4 F:4 Dm:4 C7:4 F:4')
    allp = pA + [(c, t + 32, d) for c, t, d in pB] + [(c, t + 64, d) for c, t, d in pA]
    S.add('flute', A + B + A.tr(12).vel(0.8), pan=0.15)
    S.add('mandolin', A + R(32) + A, pan=-0.3, gain=0.55)
    S.add('clarinet', R(32) + B.tr(-12), pan=-0.2, gain=0.7)
    S.add('pizz', comp(allp, 'r:1 1:1 r:1 1:1', 57, 69, 0.55), pan=0.3, gain=0.4)
    S.add('bass', bassline(allp, '1:1 3:1 5:1 6:1', low=36, vel=0.75), gain=0.75)
    S.add('guitar', comp(allp, 'r:.5 1?:.5 r:.5 1?:.5 r:.5 1?:.5 r:.5 1?:.5', 52, 64, 0.4), pan=-0.4, gain=0.6)
    S.add('glock', M('c6:e a5:e f5:q r:h') * 2, at=60, gain=0.5)
    S.drums({'kick': 'x.......x.......', 'rim': '....x.......x...', 'shaker': 'x.x.x.x.x.x.x.x.'}, 24, gain=0.5)
    S.add('tamb', M('c4:q') * 4, at=28, gain=0.6)
    return S
