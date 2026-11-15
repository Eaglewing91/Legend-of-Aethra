"""The leitmotifs of Legend of Aethra. All original; they return in many tracks, the way a Final Fantasy score
threads its themes through the whole game.
  MAIN    "Legend of Aethra" (D major): rising 5-1-2-3 and the leap of a sixth. World map, airship, title, ending.
  LYRA    "The Chorus" (F major): Lyra's song, slow and pentatonic. Story, the quiet night talks, the ending.
  VESPER  "One, Two, Three" (E minor, 3/4): three falling steps, the counting. Vesper's scenes and battle.
  NYXAR   a hollow tritone that falls by semitones. The final battle and the Crater.
  CRYSTAL the harp figure (1 5 9 10 rising through octaves) that opens the game and marks every Crystal."""
from score import M, R, prog

# ---------- MAIN THEME (D major, 4/4). A = 8 bars, B = 8 bars.
MAIN_A = M('a4:q d5:q. e5:e f#5:q | f#5:q. e5:e d5:q b4:q | b4:q. d5:e g5:q f#5:e e5:e | e5:w '
           '| a4:q f#5:q. e5:e d5:q | d5:q b5:h a5:q | g5:q. f#5:e e5:q d5:q | e5:h. r:q')
MAIN_B = M('f#5:q. g5:e a5:h | b5:q. a5:e g5:q d5:q | f#5:q. e5:e d5:q a4:q | c#5:h. e5:q '
           '| d5:q f#5:q b5:h | a5:q. g5:e g5:q b5:q | a5:q g5:q f#5:q e5:q | e5:h c#5:q e5:q')
MAIN_END = M('d5:q f#5:q b5:h | a5:q. g5:e g5:q b5:q | a5:h. g5:e e5:e | d5:w')
MAIN_PA = 'D:4 Bm:4 G:4 A:4 D/F#:4 G:4 Em7:4 A7sus4:2 A7:2'
MAIN_PB = 'Bm:4 G:4 D:4 A:4 Bm:4 G:4 Em7:4 A:4'
MAIN_PEND = 'Bm:4 G:4 A7sus4:2 A7:2 D:4'

# ---------- LYRA / THE CHORUS (F major, 4/4)
LYRA_A = M('c5:h a4:q c5:q | d5:h. c5:q | f5:q e5:q d5:q c5:q | d5:w '
           '| a4:h c5:q d5:q | f5:h. g5:q | e5:q d5:q c5:q bb4:q | c5:w')
LYRA_B = M('f5:h e5:q f5:q | g5:h a5:q g5:q | f5:q d5:q c5:q a4:q | bb4:h c5:h '
           '| a4:h g4:q a4:q | c5:h. d5:q | c5:q bb4:q a4:q g4:q | f4:w')
LYRA_PA = 'F:4 Am:4 Dm:4 Bb:4 F/A:4 Bb:4 Gm7:2 C7:2 F:2 Csus4:2'
LYRA_PB = 'Dm:4 C:4 Bb:4 Gm7:2 C:2 F/A:4 Bb:4 Gm7:2 C7:2 F:4'

# ---------- VESPER: ONE, TWO, THREE (E minor, 3/4)
VES_A = M('b4:q a4:q g4:q | f#4:h. | b4:q a4:q g4:q | e5:h. | d#5:q e5:q f#5:q | g5:q f#5:q e5:q | c5:q b4:q a4:q | b4:h.')
VES_P = 'Em:3 B7/D#:3 Em:3 C:3 B7:3 Em:3 Am:3 B7:3'
VES_COUNT = M('b4:q a4:q g4:q')

# ---------- NYXAR (D, hollow): the tritone and the fall
NYX_A = M('d4:h g#4:h | g4:h c#4:h | c4:h f#4:h | f4:w')

# ---------- CRYSTAL harp figure (degrees from the chord root)
CRYSTAL_UP = '1 5 9 10 12 16 17 19'
CRYSTAL_UPDOWN = '1 5 9 10 12 16 17 19 21 19 17 16 12 10 9 5'
