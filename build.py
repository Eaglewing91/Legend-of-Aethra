"""Build Legend of Aethra.

python3 build.py            -> build/dev.html (test page) and build/Legend-of-Aethra.user.js
python3 build.py --fast     -> skip regenerating the tile sheets
Maps come from tools/maps/*.py through tools/build_maps.py. Mana Seed art (private) comes from art/private.
"""
import base64, glob, json, os, subprocess, sys, io, gzip
from PIL import Image

VERSION = '0.1.0'
FAST = '--fast' in sys.argv
os.makedirs('build', exist_ok=True)
env = dict(os.environ, PYTHONHASHSEED='0')
if not os.path.exists('art/private/ms_people.png') and os.path.isdir('/home/claude/private-art/manaseed'): subprocess.run(['python3', '-c', "import sys;sys.path.insert(0,'tools');import manaseed as M;M.main()"], check=True)
if not os.path.exists('art/private/ms_kael.png') and os.path.isdir('/home/claude/private-art/manaseed'): subprocess.run(['python3', 'tools/actors.py'], check=True)
subprocess.run(['python3', 'tools/build_maps.py'] + (['--fast'] if FAST else []), check=True, env=env)
sys.path.insert(0, 'tools')
import mapkit as MK

ART = {}
for n, f in MK.SHEETS: ART[n] = f
for f in sorted(glob.glob('art/na/mon/*.png')): ART['mon_' + os.path.basename(f)[:-4]] = f[4:]
for f in sorted(glob.glob('art/na/boss/*.png')): ART['boss_' + os.path.basename(f)[:-4]] = f[4:]
for f in sorted(glob.glob('art/na/fx/*.png')): ART['fx_' + os.path.basename(f)[:-4]] = f[4:]
ART['chests'] = 'na/misc/chests.png'; ART['ripple'] = 'na/misc/ripple.png'
MS = {}
for f in sorted(glob.glob('art/private/ms_*.png')):
    n = os.path.basename(f)[3:-4]; ART['ms_' + n] = f[4:]; MS[n] = json.load(open(f[:-4] + '.json'))

def fx_meta():
    out = {}
    for f in sorted(glob.glob('art/na/fx/*.png')):
        im = Image.open(f).convert('RGBA'); W, H = im.size; a = im.getchannel('A').load()
        colfill = [sum(1 for y in range(H) if a[x, y] > 10) for x in range(W)]
        best = None
        for fw in range(max(8, H - 20), min(W, H * 3) + 1):
            if W % fw or W // fw < 2: continue
            n = W // fw; score = sum(colfill[k * fw] + colfill[k * fw - 1] for k in range(1, n)) / (n - 1)
            c = (score, abs(fw - H), fw)
            if best is None or c < best: best = c
        fw = best[2] if best else H
        out[os.path.basename(f)[:-4]] = {'fw': fw, 'n': W // fw}
    return out

os.makedirs('build/.png', exist_ok=True)
def packed(f):
    src = 'art/' + f; cache = 'build/.png/' + f.replace('/', '__')
    if not os.path.exists(cache) or os.path.getmtime(cache) < os.path.getmtime(src):
        im = Image.open(src); im.load(); b = io.BytesIO()
        rgba = im.convert('RGBA'); cols = rgba.getcolors(256)
        if cols is not None:
            p = rgba.convert('P', palette=Image.ADAPTIVE, colors=256) if False else None
        rgba.save(b, 'PNG', optimize=True)
        data = b.getvalue(); raw = open(src, 'rb').read()
        open(cache, 'wb').write(data if len(data) < len(raw) else raw)
    return open(cache, 'rb').read()
art = {k: base64.b64encode(packed(f)).decode() for k, f in ART.items()}

# sound effects: short clips converted to small ogg
SFX = {'move': 'Menu/Move1', 'ok': 'Menu/Accept', 'back': 'Menu/Cancel', 'buzz': 'Alert/Alert2', 'open': 'Menu/Menu5', 'door': 'Whoosh & Slash/Whoosh',
       'chest': 'Bonus/Bonus', 'encounter': 'Whoosh & Slash/Launch', 'ready': 'Menu/Menu8', 'hit': 'Hit & Impact/Hit1', 'shot': 'Hit & Impact/Impact2',
       'die': 'Elemental/Explosion2', 'spell_fire': 'Elemental/Fire', 'spell_ice': 'Magic & Skill/Magic2', 'spell_bolt': 'Magic & Skill/Magic3',
       'spell_water': 'Elemental/Water1', 'spell_wind': 'Whoosh & Slash/Whoosh2', 'spell_quake': 'Elemental/Explosion3', 'spell_heal': 'Magic & Skill/Heal',
       'spell_holy': 'Magic & Skill/Magic5', 'spell_dark': 'Magic & Skill/Strange', 'spell_poison': 'Elemental/Bubble', 'spell_shield': 'Magic & Skill/Fx',
       'spell_time': 'Magic & Skill/Magic4', 'spell_life': 'Bonus/PowerUp1', 'spell_spark': 'Magic & Skill/Magic1', 'heal': 'Magic & Skill/Heal2',
       'boom': 'Elemental/Explosion', 'surge': 'Bonus/PowerUp2', 'echo': 'Magic & Skill/Spirit', 'run': 'Jump & Bounce/Jump', 'coin': 'Bonus/Coin',
       'save': 'Bonus/Bonus2', 'equip': 'Menu/Accept3', 'quake': 'Elemental/Explosion4', 'slash': 'Whoosh & Slash/Slash'}
JINGLES = {'victory': 'Success1', 'levelup': 'LevelUp1', 'gameover': 'GameOver', 'item': 'Success3', 'secret': 'Secret1'}
NA = '/home/claude/assets/na/Ninja Adventure - Asset Pack/Audio/'
os.makedirs('build/.snd', exist_ok=True)
def ogg(src, key, br='32k', mono=True):
    out = 'build/.snd/' + key + '.ogg'
    if not os.path.exists(out):
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', src] + (['-ac', '1'] if mono else []) + ['-ar', '22050', '-c:a', 'libvorbis', '-b:a', br, out], check=True)
    return base64.b64encode(open(out, 'rb').read()).decode()
sfx = {}
if os.path.isdir(NA):
    for k, f in SFX.items(): sfx[k] = ogg(NA + 'Sounds/' + f + '.wav', 's_' + k)
    for k, f in JINGLES.items(): sfx[k] = ogg(NA + 'Jingles/' + f + '.wav', 'j_' + k, '48k')
# music (the dev page carries it; the userscript gets it from the Soundtrack scripts)
MUSIC = {'intro': '38 - Intro', 'story': '6 - Story', 'village': '36 - Village', 'calm_village': '33 - Calm Village', 'manor': '32 - Manor', 'lost_village': '26 - Lost Village',
         'adventure': '35 - Adventure', 'road': '23 - Road', 'fight': '17 - Fight', 'fight2': '34  - Fight', 'dungeon': '21 - Dungeon', 'cave': '2 - The Cave',
         'tension': '28 - Tension', 'sad': '7 - Sad Theme', 'temple': '12 - Temple', 'mystical': '13 - Mystical', 'dark_forest': '37 - Dark Forest', 'clearing': '11 - Clearing',
         'boat': '39 - Boat', 'aquatic': '18 - Aquatic', 'sunny': '31 - Sunny', 'final_area': '24 - Final Area', 'dark_castle': '10 - Dark Castle', 'ruins': '30 - Ruins',
         'crypt': '40 - Crypt', 'curse': '14 - Curse', 'dream': '22 - Dream', 'ascension': '19 - Ascension', 'good_time': '20 - Good Time', 'revelation': '3 - Revelation',
         'lament': '29 - Lament', 'end_theme': '8 - End Theme', 'credit': '15 - Credit Theme', 'melancholia': '16 - Melancholia', 'chill': '27 - Chill',
         'peaceful': '5 - Peaceful', 'quiet': '9 - Quiet'}
music = {}
if os.path.isdir(NA) and '--music' in sys.argv:
    for k, f in MUSIC.items(): music[k] = ogg(NA + 'Musics/' + f + '.ogg', 'm_' + k, '40k')

maps = json.load(open('build/maps.json'))
bossfw = {}
for f in glob.glob('art/na/boss/*_Idle*.png'):
    im = Image.open(f); n = os.path.basename(f)[:-4].split('_')[0]; bossfw[n] = im.size[1] if im.size[0] % im.size[1] == 0 else im.size[0] // max(1, round(im.size[0] / im.size[1]))
data = {'version': VERSION, 'sheets': [n for n, _ in MK.SHEETS], 'fills': MK.FILL_ORDER, 'fx': fx_meta(), 'ms': MS, 'maps': maps, 'art': art, 'sfx': sfx, 'music': music, 'bossfw': bossfw}
src = '\n'.join(open(f).read() for f in sorted(glob.glob('src/*.js')) + sorted(glob.glob('src/content/*.js')))
blob = json.dumps(data)
open('build/data.js', 'w').write('window.AE_DATA = ' + blob + ';')
dev = """<!doctype html><html><head><meta charset="utf-8"><title>Legend of Aethra (dev)</title>
<style>html,body{margin:0;background:#000;height:100%}#host{width:100vw;height:100vh;display:flex;align-items:center;justify-content:center}</style></head>
<body><div id="host"></div><script src="data.js"></script><script>
""" + src + """
window.AE = AE; AE.boot(document.getElementById('host'), window.AE_DATA).then(function (g) { window.ready = true; });
</script></body></html>"""
open('build/dev.html', 'w').write(dev)
print('build: %d maps, %d images, %d sfx, %d music, data %.1f MB, code %d KB' % (len(maps), len(art), len(sfx), len(music), len(blob) / 1e6, len(src) // 1024))
