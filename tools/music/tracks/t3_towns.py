"""Towns and safe places: each has its own theme."""
from score import *
from motifs import *

THORN_A = M('b4:q. c5:e d5:q g5:q | e5:q. d5:e c5:q e5:q | d5:q. b4:e g4:q b4:q | a4:h. r:q '
            '| b4:q. c5:e d5:q g5:q | g5:q. f#5:e e5:q g5:q | e5:q d5:q c5:q a4:q | g4:h. r:q')
THORN_B = M('e5:q. f#5:e g5:q e5:q | d5:q. b4:e g4:q b4:q | c5:q. b4:e a4:q c5:q | b4:q a4:q f#4:h '
            '| e5:q. f#5:e g5:q a5:q | b5:q. a5:e g5:q e5:q | d5:q e5:q c5:q a4:q | g4:h. r:q')
THORN_PA = 'G:4 C:4 G/B:4 D:4 G:4 Em:4 C:2 D:2 G:4'
THORN_PB = 'C:4 G:4 Am7:4 D7:4 C:4 G:4 Am7:2 D7:2 G:4'


@track('thornbrook', 'Thornbrook, Home')
def thornbrook():
    S = Song(92, 96, rt=2.0, wet=0.3, loud=-17)
    pr = chain(prog(THORN_PA), prog(THORN_PB), prog(THORN_PA))
    S.add('oboe', THORN_A, pan=-0.1); S.add('flute', THORN_B.tr(12), at=32, pan=0.15)
    S.add('strings', THORN_A.tr(12), at=64, pan=0.2, gain=0.8); S.add('oboe', THORN_A, at=64, pan=-0.2, gain=0.5)
    S.add('guitar', degarp(pr, '1 5 8 10 12 10 8 5', 0.5, low=43, vel=0.5), pan=0.3, gain=0.6)
    S.add('bass', bassline(pr, '1:2 5:2', low=36, vel=0.6), gain=0.6)
    S.add('strings', pad(pr, 55, 69, 0.3), pan=-0.3, gain=0.4)
    S.add('clarinet', M('d5:h c5:h | b4:w | c5:h e5:h | d5:w').tr(-12) * 2, at=32, pan=-0.35, gain=0.5)
    S.drums({'shaker': '..x...x...x...x.'}, 24, gain=0.4)
    return S


@track('town', 'Lanterns in the Square (towns)')
def town():
    S = Song(120, 112, rt=1.8, wet=0.26, loud=-16)
    A = M('e5:e f5:e g5:q c6:q g5:q | a5:q. g5:e f5:q a5:q | g5:q. f5:e e5:q d5:q | e5:h c5:h '
          '| a4:e b4:e c5:q e5:q a5:q | g5:q. f5:e e5:q f5:q | d5:q f#5:q a5:q c6:q | b5:h. r:q')
    B = M('a5:q. g5:e f5:q c5:q | g5:q. f5:e e5:q c5:q | f5:q e5:q d5:q a5:q | g5:h. r:q '
          '| a5:q. b5:e c6:q a5:q | g5:q. f5:e e5:q c5:q | d5:q f5:q e5:q d5:q | c5:h. r:q')
    pA = prog('C:4 F:4 G:4 C:4 Am:4 F:4 D7:4 G7:4'); pB = prog('F:4 C/E:4 Dm7:4 G7:4 F:4 Em7:4 Dm7:2 G7:2 C:4')
    vamp = prog('C:2 Am:2 F:2 G7:2 C:2 Am:2 F:2 G7:2')
    pr = chain(vamp, pA, pB, pA)
    S.add('clarinet', A, at=16, pan=-0.15); S.add('flute', B.tr(12), at=48, pan=0.2, gain=0.85)
    S.add('accordion', B, at=48, pan=-0.2, gain=0.5)
    S.add('clarinet', A, at=80, pan=-0.15); S.add('glock', A.tr(12), at=80, pan=0.3, gain=0.55)
    S.add('pizz', comp(pr, 'r:1 1:1 r:1 1:1', 57, 69, 0.55), pan=0.3, gain=0.45)
    S.add('bass', bassline(pr, '1:1 5:1 8:1 5:1', low=36, vel=0.7), gain=0.7)
    S.add('harp', degarp(vamp, '1 3 5 8', 0.5, low=55, vel=0.5), pan=0.2)
    S.add('strings', pad(pr, 55, 70, 0.3), at=0, pan=-0.3, gain=0.35)
    S.drums({'kick': 'x.......x.......', 'rim': '....x.......x...', 'shaker': 'x.x.x.x.x.x.x.x.'}, 28, gain=0.45)
    return S


@track('halcyon', 'Halcyon, City of Plates')
def halcyon():
    S = Song(100, 112, rt=2.0, wet=0.28, loud=-16)
    A = M('a4:h. c5:q | e5:q. d5:e c5:q b4:q | d5:h. g4:q | b4:w | a4:h. c5:q | f5:q. e5:e d5:q c5:q | d5:q c5:q b4:q a4:q | g#4:w')
    B = M('c5:q. d5:e e5:h | d5:q. e5:e g5:h | e5:q d5:q c5:q b4:q | b4:h. g4:q | a4:q c5:q f5:h | e5:q. d5:e c5:q d5:q | b4:h g#4:h | e5:w')
    pA = prog('Am:4 F:4 G:4 Em:4 Am:4 F:4 Dm:4 E:4'); pB = prog('F:4 G:4 Am:4 Em:4 F:4 Dm:4 E:4 E7:4')
    intro = prog('Am:4 F:4 Am:4 E:4')
    pr = chain(intro, pA, pB, pA)
    S.add('arpsyn', degarp(pr, '1 5 8 5 10 5 8 5', 0.25, low=45, vel=0.5), pan=0.3, gain=0.5)
    S.add('synbass', bassline(pr, '1:.5 1:.5 r:.5 1:.5 1:.5 r:.5 8:.5 5:.5', low=33, vel=0.75), gain=0.7)
    S.add('horn', A, at=16, pan=-0.15); S.add('strings', A.tr(12), at=16, pan=0.2, gain=0.4)
    S.add('strings', B.tr(12), at=48, pan=0.2); S.add('epiano', pad(pB, 55, 69, 0.45), at=48, pan=-0.3, gain=0.6)
    S.add('brass', A, at=80, pan=-0.15, gain=0.8); S.add('strings', A.tr(12), at=80, pan=0.2, gain=0.8)
    S.add('pad', pad(pr, 52, 67, 0.4), pan=-0.2, gain=0.5)
    S.drums({'kick': 'x.....x...x.....', 'rim': '....x.......x..x', 'hat': '..x...x...x...x.'}, 28, gain=0.45)
    S.add('bell', M('e6:w'), at=0, gain=0.4); S.add('bell', M('e6:w'), at=48, gain=0.4)
    return S


@track('sumps', 'Under the Plate (the Sumps)')
def sumps():
    S = Song(84, 96, swing=0.17, rt=1.4, wet=0.22, loud=-16.5)
    A = M('a4:e d5:e f5:q. e5:e d5:q | c5:q. a4:e f4:h | d5:e g5:e bb5:q. a5:e g5:q | f5:q e5:q c#5:h '
          '| a4:e d5:e f5:q. e5:e d5:q | f5:q ab5:q f5:q d5:q | e5:q. d5:e c#5:q e5:q | d5:h. r:q')
    B = M('bb4:q d5:q g5:q. f5:e | f5:q. e5:e d5:h | e5:q g5:q bb5:q. a5:e | a5:h. r:q '
          '| g5:q. f5:e e5:q d5:q | f5:q. e5:e d5:q a4:q | bb4:q a4:q c#5:q e5:q | d5:h. r:q')
    pA = prog('Dm:4 Dm:4 Gm:4 A7:4 Dm:4 Bb7:4 A7:4 Dm:4'); pB = prog('Gm:4 Dm:4 Em7b5:4 A7:4 Gm:4 Dm:4 Em7b5:2 A7:2 Dm:4')
    pr = chain(pA, pB, pA)
    S.add('accordion', A, pan=-0.15); S.add('clarinet', B, at=32, pan=0.15); S.add('accordion', A, at=64, pan=-0.15)
    S.add('clarinet', A.tr(-12), at=64, pan=0.2, gain=0.5)
    S.add('bass', bassline(pr, '1:1 3:1 5:1 b7:1', low=38, vel=0.75), gain=0.75)
    S.add('piano', comp(pr, 'r:1 1:1 r:1 1?:1', 53, 67, 0.5, n=3), pan=0.3, gain=0.55)
    S.drums({'snare': '....o.......o...', 'ride': 'x...x.x.x...x.x.', 'kick': 'x.......x.......'}, 24, gain=0.35)
    return S


@track('harbour', 'Port Lark')
def harbour():
    S = Song(116, 96, rt=1.8, wet=0.25, loud=-16)
    A = M('a4:q d5:e d5:e d5:q e5:q | f#5:q. e5:e d5:q a4:q | c5:q e5:e e5:e g5:q e5:q | d5:q c5:q b4:q g4:q '
          '| a4:q d5:e d5:e d5:q e5:q | f#5:q. g5:e a5:q f#5:q | g5:q e5:q c5:q e5:q | d5:h. r:q')
    B = M('b5:q. a5:e g5:q d5:q | f#5:q. e5:e d5:q a4:q | c5:q d5:q e5:q g5:q | a5:h. r:q '
          '| b5:q. a5:e g5:q b5:q | a5:q f#5:q d5:q f#5:q | e5:q d5:q c5:q e5:q | d5:h. r:q')
    pA = prog('D:4 D:4 C:4 G:4 D:4 Bm:4 C:4 D:4'); pB = prog('G:4 D:4 C:4 A:4 G:4 D:4 C:4 D:4')
    pr = chain(pA, pB, pA)
    S.add('accordion', A, pan=-0.15); S.add('strings_fast', B, at=32, pan=0.2); S.add('flute', B.tr(12), at=32, pan=-0.2, gain=0.5)
    S.add('strings_fast', A, at=64, pan=0.2, gain=0.8); S.add('accordion', A, at=64, pan=-0.15, gain=0.8)
    S.add('guitar', comp(pr, '1:1 1?:.5 1?:.5 1:1 1?:1', 52, 64, 0.5), pan=0.35, gain=0.45)
    S.add('bass', bassline(pr, '1:1 5:1 8:1 5:1', low=38, vel=0.7), gain=0.7)
    S.drums({'handdrum': 'x..ox.o.x..ox.o.', 'tamb': '....x.......x...'}, 24, gain=0.5, toms={'h': 50})
    return S


@track('desert', 'Sunscar')
def desert():
    S = Song(96, 96, rt=2.0, wet=0.28, loud=-16.5)
    A = M('e5:q. f5:e g#5:q f5:q | e5:h. r:q | e5:e f5:e g#5:e a5:e b5:q a5:e g#5:e | f5:q e5:q f5:h '
          '| g#5:q. a5:e b5:q c6:q | b5:q a5:q g#5:q f5:q | f5:q e5:q d5:q c5:q | e5:w')
    B = M('c6:q. b5:e a5:q e5:q | d5:e e5:e f5:e g5:e f5:q e5:q | f5:q. e5:e d5:q c5:q | b4:h. g#4:q '
          '| a4:q c5:q e5:q a5:q | g5:q. f5:e e5:q d5:q | c5:q d5:q e5:q f5:q | e5:w')
    pA = prog('E:4 E:4 E:4 F:4 Am:4 E7:4 Dm:2 F:2 E:4'); pB = prog('Am:4 G:4 F:4 E:4 Am:4 G:4 F:4 E:4')
    pr = chain(pA, pB, pA)
    S.add('oboe', A, pan=-0.1); S.add('flute', B, at=32, pan=0.15); S.add('oboe', A, at=64, pan=-0.1); S.add('strings', A.tr(-12), at=64, pan=0.2, gain=0.5)
    S.add('guitar', comp(pr, '1:.5 1?:.5 r:.5 1?:.5 1:.5 r:.5 1?:1', 52, 64, 0.5), pan=0.35, gain=0.45)
    S.add('strings_lo', M('e2:w') * 24, gain=0.5)
    S.add('bass', bassline(pr, '1:1.5 1:.5 5:1 1:1', low=40, vel=0.7), gain=0.6)
    S.drums({'handdrum': 'x..ox.x.o.x.x.o.', 'shaker': 'x.xxx.xxx.xxx.xx'}, 24, gain=0.5, toms={'h': 52})
    return S


@track('frost', 'Frostgate')
def frost():
    S = Song(84, 96, rt=3.0, wet=0.4, loud=-18)  # 3/4
    A = M('f#5:q. e5:e d5:q | c#5:h b4:q | d5:q. e5:e f#5:q | g5:h. | e5:q. f#5:e g5:q | a5:h e5:q | f#5:h. | r:q e5:q c#5:q '
          '| d5:q. c#5:e b4:q | b5:h a5:q | g5:q. f#5:e e5:q | a5:h. | f#5:q. g5:e a5:q | b5:h f#5:q | e5:q d5:q c#5:q | b4:h.')
    pr = prog('Bm:3 Bm:3 G:3 G:3 Em:3 A:3 F#:3 F#7:3 Bm:3 G:3 Em:3 A:3 D:3 Bm:3 Em:1.5 F#7:1.5 Bm:3')
    two = chain(pr, pr)
    S.add('celesta', A, pan=-0.2); S.add('flute', A, at=48, pan=0.15); S.add('strings', A.tr(-12), at=48, pan=-0.15, gain=0.6)
    S.add('harp', degarp(two, '1 5 8 10 8 5', 0.5, low=43, vel=0.45), pan=0.3)
    S.add('strings', pad(two, 54, 69, 0.3), pan=-0.3, gain=0.4)
    S.add('strings_lo', bassline(two, '1:3', low=35, vel=0.4))
    S.add('triangle', M('a6:h.') * 16, gain=0.3); S.add('bell', M('b5:h. r:h. r:h. r:h.') * 8, gain=0.25)
    return S


@track('lumen', 'Lumen, Where the Echoes Sleep')
def lumen():
    S = Song(88, 96, rt=2.6, wet=0.36, loud=-17)
    A = M('e5:h. d5:q | e5:q. g5:e a5:h | f#5:q. e5:e d5:q b4:q | a4:w | e5:h. g5:q | a5:q. b5:e c6:q b5:q | a5:q g5:q f#5:q d5:q | e5:w')
    B = M('c6:h. a5:q | b5:q. a5:e g5:h | a5:q e5:q c5:q e5:q | f#5:w | c6:q. b5:e a5:q f5:q | g5:q. a5:e b5:q d6:q | b5:q a5:q g5:q e5:q | a5:w')
    pA = prog('Am:4 G:4 D/F#:4 Am:4 Am:4 G:4 D:4 Em:4'); pB = prog('F:4 G:4 Am:4 D:4 F:4 G:4 Em:4 Am:4')
    pr = chain(pA, pB, pA)
    S.add('flute', A, pan=-0.1); S.add('choir_u', B, at=32, pan=0.1, gain=3.5); S.add('flute', B.tr(12), at=32, pan=-0.2, gain=0.5)
    S.add('flute', A, at=64, pan=-0.1); S.add('oboe', A.tr(-12), at=64, pan=0.2, gain=0.45)
    S.add('harp', degarp(pr, '1 5 9 5', 0.5, low=45, vel=0.5), pan=0.3)
    S.add('pad', pad(pr, 52, 67, 0.4), pan=-0.2, gain=0.5)
    S.add('strings_lo', bassline(pr, '1:4', low=33, vel=0.45))
    S.drums({'handdrum': 'x.....o.x...o...'}, 24, gain=0.45, toms={'h': 45})
    S.add('bell', M('a5:w r:w r:w r:w') * 6, gain=0.3, pan=0.4)
    return S


@track('gilded', 'The Gilded Spire')
def gilded():
    S = Song(168, 112, rt=1.6, wet=0.22, loud=-15)
    A = M('f5:e g5:e f5:e d5:e bb4:q f5:q | g5:e a5:e g5:e eb5:e c5:q g5:q | eb5:q d5:q c5:q eb5:q | d5:h c5:h '
          '| f5:e g5:e f5:e d5:e bb4:q f5:q | g5:e a5:e bb5:e c6:e bb5:q g5:q | a5:q f5:q c5:q eb5:q | d5:h. r:q')
    B = M('bb5:q. c6:e bb5:q g5:q | f5:q. g5:e f5:q d5:q | eb5:e f5:e g5:e eb5:e c5:q g5:q | f5:h. r:q '
          '| bb5:q. c6:e d6:q bb5:q | a5:q. g5:e f#5:q d5:q | g5:q eb5:q c5:q a4:q | bb4:h. r:q')
    pA = prog('Bb:4 Gm:4 Cm7:4 F7:4 Bb:4 Eb:4 F7:4 Bb:4'); pB = prog('Eb:4 Bb:4 Cm7:4 F:4 Eb:4 D7:4 Cm7:2 F7:2 Bb:4')
    intro = prog('Bb:4 Gm:4 Eb:4 F7:4')
    pr = chain(intro, pA, pB, pA)
    S.add('brass', M('bb4+d5+f5:e! r:e bb4+d5+f5:e! r:e r:h | g4+bb4+d5:e! r:e g4+bb4+d5:e! r:e r:h | eb4+g4+bb4:e! r:e eb4+g4+bb4:e! r:e r:h | f4+a4+c5+eb5:h! r:h'), pan=0.2, gain=0.7)
    S.add('trumpet', A, at=16, pan=-0.1); S.add('glock', A.tr(12), at=16, pan=0.35, gain=0.45)
    S.add('clarinet', B, at=48, pan=0.15); S.add('strings_fast', B.tr(12), at=48, pan=-0.2, gain=0.6)
    S.add('trumpet', A, at=80, pan=-0.1); S.add('brass', A.tr(-12), at=80, pan=0.2, gain=0.6)
    S.add('brass', comp(pr[4:], 'r:.5 1:.5 r:.5 1:.5', 55, 67, 0.45), pan=0.3, gain=0.4)
    S.add('slap', bassline(pr, '1:.5 r:.5 8:.5 1:.5 5:.5 r:.5 8:.5 5:.5', low=34, vel=0.75), gain=0.7)
    S.drums({'kick': 'x...x...x...x...', 'snare': '....x.......x...', 'hat': 'x.xxx.xxx.xxx.xx'}, 28, gain=0.5)
    for b in (16, 48, 80): S.add('crash', M('c4:w'), at=b, gain=0.6)
    return S


@track('tavern', 'The Lucky Lantern')
def tavern():
    S = Song(100, 128, swing=0.17, rt=1.3, wet=0.2, loud=-17)
    mel = M('d5:q f5:q a5:q g5:q | e5:h. c5:q | e5:q. f5:e a5:q c6:q | a5:h f5:h | bb5:q a5:q g5:q f5:q | e5:q d5:q c5:q bb4:q '
            '| c5:q e5:q g5:q b5:q | a5:h. f#5:q | g5:q. f5:e d5:q bb4:q | c5:q e5:q g5:q bb5:q | a5:h. g5:q | ab5:q f5:q d5:q ab4:q '
            '| g4:q c5:q e5:q g5:q | f#5:q. e5:e d5:q c5:q | bb4:q d5:q e5:q c5:q | f5:w')
    pr = prog('Gm7:4 C7:4 Fmaj7:4 Dm7:4 Gm7:4 C7:4 Am7:4 D7:4 Gm7:4 C7:4 Fmaj7:4 Bb7:4 Am7:4 D7:4 Gm7:2 C7:2 F6:4')
    two = chain(pr, pr)
    S.add('clarinet', mel, pan=-0.15); S.add('piano', mel, at=64, pan=0.15)
    S.add('epiano', comp(two, 'r:1 1:.5 r:1.5 1?:1', 53, 67, 0.5, n=4), pan=0.25, gain=0.5)
    S.add('bass', bassline(two, '1:1 3:1 5:1 6:1', low=36, vel=0.7), gain=0.7)
    S.drums({'ride': 'x...x.x.x...x.x.', 'snare': '....o.......o...', 'kick': 'o.......o.......'}, 32, gain=0.35)
    return S


@track('academy', 'Vanguard Academy')
def academy():
    S = Song(112, 96, rt=2.2, wet=0.28, loud=-16)
    A = M('f4:q. f4:e bb4:q d5:q | eb5:q. d5:e c5:q bb4:q | c5:q. d5:e eb5:q c5:q | d5:h bb4:h '
          '| g4:q. a4:e bb4:q d5:q | eb5:q. f5:e g5:q eb5:q | d5:q c5:q a4:q c5:q | bb4:h. r:q')
    B = M('g5:q. f5:e eb5:q bb4:q | f5:q. eb5:e d5:q bb4:q | eb5:q d5:q c5:q eb5:q | f5:h. r:q '
          '| g5:q. a5:e bb5:q g5:q | f5:q. d5:e bb4:q d5:q | c5:q eb5:q d5:q c5:q | bb4:h. r:q')
    pA = prog('Bb:4 Eb:4 F:4 Bb:4 Gm:4 Cm:4 F7:4 Bb:4'); pB = prog('Eb:4 Bb/D:4 Cm7:4 F:4 Eb:4 Bb/F:4 F7:4 Bb:4')
    pr = chain(pA, pB, pA)
    S.add('horn', A, pan=-0.15); S.add('strings', A.tr(12), pan=0.2, gain=0.4)
    S.add('trumpet', B, at=32, pan=-0.1); S.add('flute', B.tr(12), at=32, pan=0.3, gain=0.5)
    S.add('brass', A, at=64, pan=-0.1); S.add('strings', A.tr(12), at=64, pan=0.2, gain=0.8)
    S.add('strings', pad(pr, 53, 69, 0.4), pan=-0.3, gain=0.45)
    S.add('bass', bassline(pr, '1:1 5:1 8:1 5:1', low=34, vel=0.7), gain=0.65)
    S.drums({'snare': 'x..ox.x.x..ox.xx', 'kick': 'x.......x.......'}, 24, gain=0.4)
    S.add('timpani', bassline(pr, '1!:2 5:2', low=38, vel=0.5), gain=0.6)
    S.add('crash', M('c4:w'), at=64, gain=0.5)
    return S


@track('peaceful', 'Still Waters (Mideel and quiet places)')
def peaceful():
    S = Song(76, 64, rt=2.6, wet=0.38, loud=-18)
    A = M('g5:h. bb5:q | c6:q. bb5:e ab5:h | g5:q f5:q eb5:q bb4:q | c5:h d5:h | eb5:h. g5:q | f5:q. eb5:e c5:h | d5:q eb5:q f5:q bb5:q | g5:w')
    B = M('ab5:h c6:h | bb5:h. g5:q | ab5:q g5:q f5:q eb5:q | f5:w | c6:q. bb5:e ab5:q g5:q | bb5:q. ab5:e g5:q f5:q | eb5:q f5:q g5:q d5:q | eb5:w')
    pA = prog('Eb:4 Ab:4 Eb/G:4 Bb:4 Cm:4 Ab:4 Fm7:2 Bb:2 Eb:4'); pB = prog('Ab:4 Eb/G:4 Fm7:4 Bb:4 Ab:4 Gm7:4 Fm7:2 Bb7:2 Eb:4')
    pr = chain(pA, pB)
    S.add('flute', A, pan=-0.1); S.add('strings', B, at=32, pan=0.15); S.add('oboe', B.tr(-12), at=32, pan=-0.2, gain=0.4)
    S.add('harp', degarp(pr, '1 5 8 9 10 9 8 5', 0.5, low=39, vel=0.45), pan=0.3)
    S.add('strings', pad(pr, 55, 70, 0.3), pan=-0.3, gain=0.4)
    S.add('strings_lo', bassline(pr, '1:4', low=36, vel=0.4))
    return S
