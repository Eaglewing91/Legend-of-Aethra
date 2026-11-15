"""Story themes: the cast's leitmotifs in their quiet and dark forms, and the ending."""
from score import *
from motifs import *
from tracks.t3_towns import THORN_A, THORN_PA


@track('story', 'Reflections (the main theme, remembered)')
def story():
    S = Song(72, 64, rt=2.8, wet=0.38, loud=-18)
    pr = chain(prog(MAIN_PA), prog(MAIN_PB))
    S.add('oboe', MAIN_A.tr(-12), pan=-0.1); S.add('strings', MAIN_B, at=32, pan=0.15); S.add('horn', MAIN_B.tr(-12), at=32, pan=-0.2, gain=0.45)
    S.add('piano', degarp(pr, '1 5 8 10', 1, low=38, vel=0.45), pan=0.25, gain=0.6)
    S.add('strings', pad(pr, 54, 69, 0.3), pan=-0.3, gain=0.4)
    S.add('strings_lo', bassline(pr, '1:4', low=38, vel=0.45))
    return S


@track('lyra', 'Lyra\'s Song (the Chorus)')
def lyra():
    S = Song(76, 64, rt=3.0, wet=0.42, loud=-18)
    pr = chain(prog(LYRA_PA), prog(LYRA_PB))
    S.add('flute', LYRA_A, pan=-0.1); S.add('strings', LYRA_B, at=32, pan=0.15); S.add('choir_u', LYRA_B.tr(-12), at=32, pan=-0.2, gain=1.2)
    S.add('harp', degarp(pr, '1 5 8 9 10 9 8 5', 0.5, low=41, vel=0.45), pan=0.3)
    S.add('strings', pad(pr, 53, 69, 0.3), pan=-0.3, gain=0.4)
    S.add('strings_lo', bassline(pr, '1:4', low=36, vel=0.4))
    S.add('celesta', M('c6:w r:w r:w r:w') * 4, gain=0.35, pan=0.4)
    return S


@track('quiet', 'Night Talk')
def quiet():
    S = Song(66, 64, rt=2.4, wet=0.34, loud=-19.5)
    pr = chain(prog(LYRA_PA), prog(LYRA_PB))
    S.add('piano', LYRA_A, pan=0.0); S.add('piano', degarp(prog(LYRA_PA), '1 5 8 10 12 10 8 5', 0.5, low=41, vel=0.35), pan=-0.2)
    S.add('guitar', degarp(prog(LYRA_PB), '1 5 8 10 12 10 8 5', 0.5, low=41, vel=0.45), at=32, pan=0.25, gain=0.7)
    S.add('flute', LYRA_B, at=32, pan=-0.1, gain=0.85)
    S.add('pad', pad(pr, 53, 67, 0.3), gain=0.35)
    S.add('strings_lo', bassline(pr, '1:4', low=36, vel=0.35))
    return S


@track('vesper', 'Vesper\'s Theme (One, Two, Three)')
def vesper():
    S = Song(100, 72, rt=3.0, wet=0.42, loud=-18)   # 3/4, three variations
    pV = prog(VES_P); dark = prog('Em:3 Ebaug:3 Em/D:3 C:3 B7:3 Em:3 Am:3 B7:3')
    pr = chain(pV, pV, dark)
    S.add('musicbox', VES_A.tr(12), pan=-0.15)
    S.add('pizz', bassline(pV, '1:1 5?:1 5?:1', low=40, vel=0.55), gain=0.6)
    S.add('strings', VES_A, at=24, pan=0.15); S.add('celesta', M('e6:h. f#6:h. g6:h. a6:h. b6:h. c7:h. a6:h. b6:h.'), at=24, pan=-0.3, gain=0.4)
    S.add('strings', pad(pV, 52, 67, 0.3), at=24, pan=-0.2, gain=0.4)
    S.add('choir', VES_A, at=48, pan=0.0, gain=0.8); S.add('organ', pad(dark, 48, 62, 0.4), at=48, gain=0.5)
    S.add('strings_lo', bassline(chain(pV, dark), '1:3', low=35, vel=0.5), at=24)
    S.add('bell', VES_COUNT.tr(12), at=69, gain=0.5)
    S.add('timpani', M('e2:q r:q r:q') * 8, at=48, gain=0.4)
    return S


@track('tension', 'Danger')
def tension():
    S = Song(120, 96, rt=2.0, wet=0.28, loud=-16)
    pr = prog('C#m:8 A:8 C#m:8 G#7:8 C#m:8 D:8 C#m:8 G#7:8 F#m:8 D:8 G#:8 G#7:8')
    S.add('strings_fast', bassline(pr, '1:.5', low=49, vel=0.5), pan=0.3, gain=0.6, legato=0.6)
    S.add('strings_lo', bassline(pr, '1:8', low=37, vel=0.6))
    S.add('horn', M('c#4:w g4:w | c#4:w g#3:w | c#4:w g4:w | d4:w c#4:w | f#4:w g4:w | g#4:w g#3:w').tr(12), pan=-0.15, gain=0.8)
    S.add('brass', M('r:w r:w r:w r:w r:w r:w r:w r:h c#4+g4:h! r:w r:w r:w r:h d4+g#4:h!'), gain=0.8)
    S.add('taiko', M('c4:q r:q r:h') * 24, gain=0.6)
    S.add('timpani', roll(44, 4, 8, 0.2, 0.7), at=28, gain=0.7); S.add('timpani', roll(44, 4, 8, 0.2, 0.8), at=92, gain=0.7)
    S.add('piano', M('c#7:e r:e r:q r:h') * 24, gain=0.12, pan=0.4)
    S.add('pad', pad(pr, 49, 64, 0.35), gain=0.4)
    return S


@track('mystic', 'Mysteries')
def mystic():
    S = Song(76, 64, rt=2.8, wet=0.4, loud=-18.5)
    A = M('e5:h g5:q b5:q | a5:h. f#5:q | d5:q f#5:q a5:q f#5:q | g#5:w | c6:h. b5:q | a5:q f#5:q d5:q c5:q | b4:h d5:q f#5:q | e5:h d#5:h')
    pr = prog('Cmaj7:4 D/C:4 Bm7:4 E7:4 Am7:4 D7:4 Gmaj7:4 F#m7b5:2 B7:2'); two = chain(pr, pr)
    S.add('clarinet', A, pan=-0.1); S.add('celesta', A, at=32, pan=0.2); S.add('clarinet', A.tr(-12), at=32, pan=-0.2, gain=0.5)
    S.add('harp', degarp(two, '1 5 9 10 12 10 9 5', 0.5, low=40, vel=0.4), pan=0.3)
    S.add('pad', pad(two, 52, 67, 0.4), gain=0.5)
    S.add('strings_lo', bassline(two, '1:4', low=36, vel=0.4))
    S.add('bell', M('b5:w r:w r:w r:w') * 4, gain=0.25, pan=-0.4)
    return S


@track('memory', 'Fading Memory')
def memory():
    S = Song(66, 64, rt=3.4, wet=0.5, loud=-20)
    pr = prog(THORN_PA); drift = prog('Gm:4 Cm:4 Gm/Bb:4 D:4 Gm:4 Eb:4 Cm:2 D:2 Gm:4')
    S.add('musicbox', THORN_A.tr(12), pan=-0.15)
    S.add('musicbox', THORN_A.tr(12).vel(0.8), at=32, pan=0.15, gain=0.7)
    S.add('pad', pad(chain(pr, drift), 50, 65, 0.4), gain=0.5)
    S.add('strings', THORN_A.tr(-12).legato(1.4), at=32, pan=-0.2, gain=0.4)
    S.add('pad', M('bb3:w') * 8, at=32, gain=0.3)
    S.add('bell', M('r:w r:w r:w r:w r:w r:w r:w f#5:w'), at=32, gain=0.3)
    S.add('strings_lo', bassline(chain(pr, drift), '1:4', low=36, vel=0.35))
    return S


@track('sorrow', 'Requiem for the Lost')
def sorrow():
    S = Song(60, 64, rt=3.2, wet=0.44, loud=-18.5)
    A = M('f#5:h. e5:q | d5:h b4:h | e5:q. f#5:e g5:q e5:q | f#5:w | d5:h. c#5:q | b4:h g5:h | f#5:q e5:q d5:q c#5:q | b4:w')
    B = M('g5:h. f#5:q | f#5:h a5:h | g5:q f#5:q e5:q d5:q | e5:w | b5:h. a5:q | a5:h c#5:h | e5:q d5:q c#5:q a#4:q | b4:w')
    pA = prog('Bm:4 G:4 Em:4 F#:4 Bm/A:4 Gmaj7:4 Em7:2 F#7:2 Bm:4'); pB = prog('G:4 D/F#:4 Em:4 A:4 G:4 F#m:4 Em7:2 F#7:2 Bm:4')
    pr = chain(pA, pB)
    S.add('oboe', A, pan=-0.1); S.add('strings', B, at=32, pan=0.15); S.add('strings', B.tr(-12), at=32, pan=-0.15, gain=0.5)
    S.add('strings', pad(pr, 54, 69, 0.35), pan=-0.3, gain=0.45)
    S.add('strings_lo', bassline(pr, '1:4', low=35, vel=0.5))
    S.add('harp', degarp(pA, '1 5 8 10', 1, low=38, vel=0.35), pan=0.3)
    return S


@track('ending', 'Legend of Aethra (Ending)')
def ending():
    S = Song(80, 112, rt=3.0, wet=0.38, loud=-16.5)
    pl = prog(LYRA_PA); pa = prog(MAIN_PA); pb = prog(MAIN_PB); pe = prog(MAIN_PEND)
    pr = chain(pl, pa, pb, pe)
    # Lyra's song on the flute, then the main theme on strings, then brass, then the big close
    S.add('flute', LYRA_A, pan=-0.1); S.add('harp', degarp(pl, '1 5 8 9 10 9 8 5', 0.5, low=41, vel=0.45), pan=0.3)
    S.add('strings', MAIN_A, at=32, pan=0.2); S.add('horn', pad(pa, 50, 64, 0.4, n=3), at=32, pan=-0.3, gain=0.6)
    S.add('trumpet', MAIN_B.tr(-12), at=64, pan=-0.1); S.add('strings', MAIN_B, at=64, pan=0.2, gain=0.8)
    S.add('choir', pad(pb, 55, 71, 0.5), at=64, pan=-0.2, gain=0.5)
    S.add('strings', MAIN_END.oct(0, -1), at=96, pan=0.2); S.add('brass', MAIN_END.tr(-12), at=96, pan=-0.15)
    S.add('choir', pad(pe, 55, 74, 0.6), at=96, gain=0.6)
    S.add('strings', pad(chain(pl, pa), 53, 69, 0.3), pan=-0.3, gain=0.4)
    S.add('strings_lo', bassline(pr, '1:4', low=36, vel=0.5))
    S.add('bass', bassline(chain(pb, pe), '1:1 5:1 8:1 5:1', low=38, vel=0.6), at=64, gain=0.5)
    S.add('timpani', bassline(chain(pb, pe), '1!:2 5:2', low=40, vel=0.45), at=64, gain=0.6)
    S.drums({'snare': '....x.......x...'}, 8, at=64, gain=0.3)
    S.add('crash', M('c4:w'), at=96, gain=0.6); S.add('swell', M('c4:w'), at=92, gain=0.8)
    S.add('celesta', M('d6:w'), at=108, gain=0.5); S.add('harp', degarp(prog('D:4'), CRYSTAL_UP, 0.25, low=38, vel=0.5), at=108)
    return S
