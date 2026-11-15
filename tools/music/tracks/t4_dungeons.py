"""Dungeons, caves, reactors, temples and the Citadel."""
from score import *
from motifs import *


@track('reactor', 'Reactor 4')
def reactor():
    S = Song(132, 88, rt=1.6, wet=0.22, loud=-14.5)
    ost = M('c2:s c3:s c2:s c2:s eb2:s c2:s g2:s c2:s') * 2
    A = M('c5:q. eb5:e g5:q c6:q | bb5:q. ab5:e g5:h | ab5:q. g5:e f5:q eb5:q | d5:w | c5:q. eb5:e g5:q c6:q | db6:q. c6:e bb5:q ab5:q | g5:q f5:q eb5:q d5:q | g5:w')
    pA = prog('Cm:4 Cm:4 Ab:4 G:4 Cm:4 Db:4 Ab:2 G:2 G:4')
    pr = chain(prog('Cm:8'), pA, pA, prog('Cm:2 Bdim:2 Db:2 G:2 Cm:2 Bdim:2 Ab:2 G:2'))
    S.add('synbass', ost * 11, gain=0.8); S.add('slap', bassline(pr, '1:1', low=36, vel=0.8), gain=0.6)
    S.add('brass', A, at=8, pan=-0.1); S.add('strings_fast', comp(pA, '1:.25 1?:.25 1?:.25 1?:.25', 55, 67, 0.35), at=8, pan=0.3, gain=0.5)
    S.add('trumpet', A, at=40, pan=-0.1); S.add('strings', A.tr(12), at=40, pan=0.2, gain=0.7)
    S.add('horn', pad(pA, 50, 64, 0.5, n=3), at=40, pan=0.3, gain=0.6)
    S.add('brass', M('c4+eb4+g4:q! r:q b3+d4+f4:q! r:q db4+f4+ab4:q! r:q d4+g4+b4:q! r:q c4+eb4+g4:q! r:q b3+d4+f4:q! r:q c4+eb4+ab4:q! r:q d4+g4+b4:h!'), at=72, gain=0.8)
    S.add('bell', M('c6:q r:q r:h') * 22, gain=0.25, pan=0.4)
    S.drums({'kick': 'x...x...x...x...', 'rim': '..x...x...x..xx.', 'hat': 'xxxxxxxxxxxxxxxx'}, 22, gain=0.45)
    for b in (8, 40, 72): S.add('crash', M('c4:w'), at=b, gain=0.6)
    return S


@track('tower', 'Aurex Tower')
def tower():
    S = Song(108, 96, rt=2.2, wet=0.3, loud=-16.5)
    A = M('f#4:w | a4:h g#4:h | c#5:w | b4:h. a4:q | f#4:w | d5:h c#5:h | e5:h d5:q c#5:q | c#5:w')
    pr = prog('F#m:4 D:4 A/C#:4 Bm:2 E:2 F#m:4 Bm:4 D:4 C#7:4'); three = chain(pr, pr, pr)
    S.add('arpsyn', degarp(three, '1 5 8 5', 0.5, low=42, vel=0.5), pan=0.3, gain=0.6)
    S.add('synbass', bassline(three, '1:.5 1:.5 1:.5 1:.5', low=30, vel=0.6), gain=0.6)
    S.add('horn', A, pan=-0.15); S.add('strings', A.tr(12), at=32, pan=0.2); S.add('clarinet', A, at=32, pan=-0.2, gain=0.5)
    S.add('brass', A, at=64, pan=-0.1, gain=0.8); S.add('strings', A.tr(12), at=64, pan=0.2)
    S.add('pad', pad(three, 52, 67, 0.4), pan=-0.3, gain=0.5)
    S.drums({'rim': 'x..x..x...x..x..', 'hat': '..x...x...x...x.', 'kick': 'x.........x.....'}, 24, gain=0.4)
    S.add('epiano', M('c#6:q') * 24, at=0, gain=0.15, pan=-0.4)
    return S


@track('dungeon', 'Into the Depths')
def dungeon():
    S = Song(92, 96, rt=2.4, wet=0.32, loud=-17)
    A = M('d4:h. e4:q | f4:h g4:q a4:q | bb4:h. a4:q | g4:h. e4:q | d4:h. f4:q | a4:h c5:q d5:q | c5:q bb4:q a4:q g4:q | a4:w')
    B = M('g4:h. bb4:q | d5:h c5:q bb4:q | eb5:h. d5:q | c#5:w')
    pA = prog('Dm:4 Dm:4 Bb:4 C:4 Dm:4 F:4 Gm:2 C:2 A:4'); pB = prog('Gm:4 Dm:4 Eb:4 A:4')
    pr = chain(pA, pA, pB, pB)
    S.add('pizz', degarp(pr, '1 5 3 5', 0.5, low=50, vel=0.55), pan=0.3, gain=0.6)
    S.add('clarinet', A, pan=-0.1); S.add('oboe', A.tr(12), at=32, pan=0.15); S.add('strings', A, at=32, pan=-0.2, gain=0.5)
    S.add('horn', B + B.tr(12), at=64, pan=-0.1)
    S.add('strings_lo', bassline(pr, '1:4', low=38, vel=0.5))
    S.add('harp', M('d6:w r:w r:w r:w') * 6, gain=0.4, pan=-0.4)
    S.add('timpani', M('d2:q r:q r:h r:w') * 12, gain=0.5)
    return S


@track('cave', 'Deep Caves')
def cave():
    S = Song(60, 48, rt=3.4, wet=0.45, loud=-20)
    pr = prog('Em9:8 Cmaj7:8 Am9:8 B7sus4:8 Em9:8 Cmaj7:4 B7:4')
    S.add('pad', pad(pr, 47, 64, 0.5), gain=0.45)
    S.add('strings_lo', bassline(pr, '1:8', low=28, vel=0.5))
    S.add('flute', M('r:w b4:h. a4:q | g4:w r:w | r:w e5:h. d5:q | b4:w r:w | r:w g5:h f#5:h | e5:w d#5:w'), pan=-0.1, gain=0.8)
    drops = M('r:h e6:e r:e r:q | r:w | r:q b5:e r:e r:h | r:h r:q g6:e r:e | r:w | r:e d6:e r:q r:h') * 2
    S.add('musicbox', drops, pan=0.4, gain=0.6); S.add('glock', drops.shift(0.75).tr(-5), pan=-0.4, gain=0.3)
    S.add('harp', degarp(pr, '1 5 9 10', 1, low=40, vel=0.35), pan=0.2)
    return S


@track('forest', 'Mistwood')
def forest():
    S = Song(120, 96, rt=2.6, wet=0.36, loud=-17.5)  # 3/4
    A = M('e5:q a5:q b5:q | c6:h b5:q | a5:q f5:q e5:q | d#5:h. | e5:q a5:q b5:q | c6:q d6:q c6:q | b5:q a5:q f#5:q | e5:h. '
          '| f5:q a5:q d6:q | c6:h a5:q | b5:q a5:q f5:q | g#5:h. | a5:q c6:q e6:q | d6:h b5:q | a5:q g5:q f5:q | e5:h.')
    pr = prog('Am:3 Am:3 F:3 B7:3 Am:3 D/F#:3 Fmaj7:3 E:3 Dm:3 Am/C:3 Bm7b5:3 E7:3 Am:3 G:3 F:3 E:3'); two = chain(pr, pr)
    S.add('flute', A, pan=-0.15); S.add('oboe', A.tr(-12), at=48, pan=0.15); S.add('celesta', A, at=48, pan=-0.3, gain=0.5)
    S.add('harp', degarp(two, '1 5 8', 1, low=45, vel=0.45), pan=0.3)
    S.add('pizz', bassline(two, '1:1 r:2', low=40, vel=0.6), gain=0.7)
    S.add('strings', pad(two, 52, 67, 0.3), pan=-0.3, gain=0.4)
    S.add('bell', M('e6:h. r:h. r:h. r:h.') * 8, gain=0.25, pan=0.4)
    return S


@track('temple', 'Shrine of the Winds')
def temple():
    S = Song(72, 64, rt=3.6, wet=0.48, loud=-18.5)
    A = M('a4:h d5:h | e5:h. g#5:q | g5:h f#5:q e5:q | f#5:w | d5:h. b4:q | c5:h e5:h | d5:h c#5:h | d5:w')
    pr = prog('D:4 E/D:4 G:4 D:4 Bm:4 C:4 Gmaj7:2 A:2 D:4'); two = chain(pr, pr)
    S.add('choir', A, pan=-0.1); S.add('choir_o', pad(pr, 50, 64, 0.5), pan=0.2, gain=0.6)
    S.add('flute', A.tr(12), at=32, pan=0.2); S.add('choir', A, at=32, pan=-0.2, gain=0.7)
    S.add('organ', pad(two, 50, 64, 0.35), gain=0.4)
    S.add('harp', degarp(two, CRYSTAL_UP, 0.5, low=38, vel=0.4), pan=0.35)
    S.add('bell', M('d6:w r:w a5:w r:w') * 4, gain=0.3, pan=-0.4)
    S.add('strings_lo', bassline(two, '1:4', low=38, vel=0.45))
    return S


@track('water', 'Coral Sanctum')
def water():
    S = Song(84, 64, rt=2.8, wet=0.4, loud=-18)
    A = M('f#5:q. a5:e c#6:h | b5:q. g#5:e e5:h | d5:q f#5:q a5:q b5:q | c#6:w | f#5:q. a5:e c#6:h | e6:q. d6:e b5:h | c#6:q b5:q g#5:q e5:q | f#5:w')
    pr = prog('Dmaj7:4 C#m7:4 Bm7:4 Amaj7:4 Dmaj7:4 E/D:4 C#m7:4 F#m9:4'); two = chain(pr, pr)
    S.add('celesta', A, pan=-0.15); S.add('flute', A, at=32, pan=0.15); S.add('epiano', A.tr(-12), at=32, pan=-0.2, gain=0.4)
    S.add('epiano', comp(two, '1:1.5 1?:2.5', 52, 67, 0.45, n=4), pan=0.25, gain=0.5)
    S.add('pad', pad(two, 50, 66, 0.4), gain=0.5)
    S.add('sub', bassline(two, '1:3 5:1', low=33, vel=0.6), gain=0.7)
    S.add('harp', degarp(two, '1 5 9 10 12 10 9 5', 0.5, low=50, vel=0.3), pan=0.35)
    S.drums({'shaker': '..x...x...x...x.'}, 16, gain=0.3)
    return S


@track('castle', 'Abyssal Spire')
def castle():
    S = Song(120, 96, rt=3.0, wet=0.36, loud=-15.5)
    A = M('c4:h g4:h | ab4:q. g4:e f4:q eb4:q | f4:h c5:h | b4:w | c5:h. eb5:q | db5:h f5:h | d5:q eb5:q f5:q d5:q | c5:w')
    pr = prog('Cm:4 Ab:4 Fm:4 G:4 Cm:4 Db:4 G7:4 Cm:4'); three = chain(pr, pr, pr)
    S.add('organ', degarp(three, '1 5 8 10 12 10 8 5', 0.25, low=48, vel=0.5), gain=0.6, pan=0.25)
    S.add('brass', A, pan=-0.1); S.add('choir', A.tr(12), at=32, pan=0.15); S.add('brass', A, at=32, gain=0.6)
    S.add('organ', A.tr(12).oct(0, -1), at=64, pan=-0.2)
    S.add('choir', pad(three, 55, 70, 0.5), pan=-0.3, gain=0.5)
    S.add('strings_lo', bassline(three, '1:2 5:2', low=36, vel=0.6))
    S.add('timpani', bassline(three, '1!:1 r:1 1:1 r:1', low=38, vel=0.55), gain=0.7)
    S.add('gong', M('c2:w'), at=0, gain=0.6); S.add('gong', M('c2:w'), at=64, gain=0.6)
    return S


@track('crypt', 'Catacombs')
def crypt():
    S = Song(70, 64, rt=3.2, wet=0.42, loud=-19)
    A = M('d5:q g5:q bb5:q a5:q | g5:h d5:h | eb5:q d5:q c5:q bb4:q | a4:w | d5:q g5:q bb5:q d6:q | c#6:h d6:h | bb5:q a5:q g5:q f#5:q | g5:w')
    pr = prog('Gm:4 Gm:4 Cm:4 D:4 Gm:4 A7:4 Eb:2 D:2 Gm:4'); two = chain(pr, pr)
    S.add('musicbox', A, pan=-0.15); S.add('celesta', A.tr(-12), at=32, pan=0.2, gain=0.6); S.add('musicbox', A, at=32, pan=-0.15, gain=0.6)
    S.add('strings', pad(two, 50, 64, 0.3), gain=0.45)
    S.add('strings_lo', M('g1:w') * 16, gain=0.6)
    S.add('pad', M('g3+d4:w ab3+eb4:w') * 8, gain=0.25)
    S.add('bell', M('g4:w r:w r:w r:w') * 4, gain=0.25, pan=0.4)
    return S


@track('citadel', 'Sky Citadel')
def citadel():
    S = Song(96, 96, rt=3.2, wet=0.38, loud=-15.5)
    A = M('d5:h f5:h | f5:q. e5:e d5:h | g5:h bb5:h | a5:w | d5:h a5:h | c6:q. bb5:e a5:h | g5:q f5:q eb5:q g5:q | a5:w')
    pA = prog('Dm:4 Bb:4 Gm:4 A:4 Dm:4 F:4 Eb:4 A7:4'); pL = prog('D:4 F#m/C#:4 Bm:4 G:4')
    pr = chain(pA, pA, pL, prog('Dm:4 Dm:4 Dm:4 A7:4'))
    S.add('choir', A, pan=-0.1); S.add('strings', A.tr(-12), pan=0.2, gain=0.5)
    S.add('brass', A, at=32, pan=-0.1); S.add('strings', A, at=32, pan=0.2); S.add('choir', A.tr(-12), at=32, gain=0.6)
    S.add('celesta', P([e for e in LYRA_A.ev if e[0] < 16], 16).tr(-3), at=64, pan=-0.2); S.add('flute', P([e for e in LYRA_A.ev if e[0] < 16], 16).tr(9), at=64, pan=0.2, gain=0.6)
    S.add('choir_o', NYX_A, at=80, pan=0.0); S.add('organ', NYX_A.tr(-12), at=80, gain=0.6)
    S.add('strings_fast', comp(pr, '1:.25 1?:.25 1?:.25 1?:.25', 50, 64, 0.3), pan=0.35, gain=0.45)
    S.add('strings_lo', bassline(pr, '1:4', low=38, vel=0.55))
    S.add('timpani', bassline(pr, '1!:1 r:3', low=38, vel=0.6), gain=0.7)
    S.add('swell', M('c4:w'), at=28); S.add('swell', M('c4:w'), at=60); S.add('crash', M('c4:w'), at=32, gain=0.6)
    return S


@track('ruins', 'Ancient Ruins')
def ruins():
    S = Song(80, 64, rt=2.8, wet=0.38, loud=-18)
    A = M('d5:h eb5:q d5:q | c5:h. a4:q | bb4:q c5:q d5:q eb5:q | d5:w | f5:h eb5:q d5:q | eb5:h c5:h | d5:q c5:q bb4:q c5:q | d5:w')
    pr = prog('Dm:4 Dm:4 Eb:4 Dm:4 Gm:4 Cm:4 Bb:2 Eb:2 Dm:4'); two = chain(pr, pr)
    S.add('oboe', A, pan=-0.1); S.add('flute', A.tr(12), at=32, pan=0.15, gain=0.7); S.add('oboe', A, at=32, gain=0.5)
    S.add('harp', degarp(two, '1 5 8 b9', 0.5, low=45, vel=0.45), pan=0.3)
    S.add('strings_lo', M('d2:w') * 16, gain=0.6)
    S.drums({'handdrum': 'x.......o...x...'}, 16, gain=0.4, toms={'h': 45})
    return S
