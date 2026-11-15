"""Build Legend of Aethra.

python3 build.py            -> build/dev.html (test page) and build/Legend-of-Aethra.user.js
python3 build.py --fast     -> skip regenerating the tile sheets
Maps come from tools/maps/*.py through tools/build_maps.py. Mana Seed art (private) comes from art/private.
"""
import base64, glob, json, os, subprocess, sys, io, gzip
from PIL import Image

VERSION = '1.0.0'
FAST = '--fast' in sys.argv
os.makedirs('build', exist_ok=True)
env = dict(os.environ, PYTHONHASHSEED='0')
if not os.path.exists('art/private/ms_people.png') and os.path.isdir('/home/claude/private-art/manaseed'): subprocess.run(['python3', '-c', "import sys;sys.path.insert(0,'tools');import manaseed as M;M.main()"], check=True)
if not os.path.exists('art/private/ms_kael.png') and os.path.isdir('/home/claude/private-art/manaseed'): subprocess.run(['python3', 'tools/actors.py'], check=True)
subprocess.run(['python3', 'tools/worldgen.py'], check=True, env=env)
subprocess.run(['python3', 'tools/build_maps.py'] + (['--fast'] if FAST else []), check=True, env=env)
sys.path.insert(0, 'tools')
import mapkit as MK

ART = {}
for n, f in MK.SHEETS: ART[n] = f
for f in sorted(glob.glob('art/na/mon/*.png')): ART['mon_' + os.path.basename(f)[:-4]] = f[4:]
# side-on boss sprites (turned to face the party; made from the pack's art by tools/sides)
for f in sorted(glob.glob('art/generated/sides/*.png')): ART['side_' + os.path.basename(f)[:-4]] = f[4:]
for f in sorted(glob.glob('art/na/boss/*.png')):
    n = os.path.basename(f)[:-4]
    if n.endswith('_Idle') or n.endswith('_Head'): ART['boss_' + n] = f[4:]
import re as _re
_FXUSED = set(_re.findall(r"'([A-Za-z_0-9]+)'", _re.search(r'AE.FXMAP = \{(.*?)\};', open('src/34-battle-draw.js').read(), _re.S).group(1)))
for f in sorted(glob.glob('art/na/fx/*.png')):
    if os.path.basename(f)[:-4] in _FXUSED: ART['fx_' + os.path.basename(f)[:-4]] = f[4:]
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
    """Smallest lossless PNG: palette mode when the image has 256 colours or fewer (most pixel art does)."""
    src = 'art/' + f; cache = 'build/.png/' + f.replace('/', '__')
    if not os.path.exists(cache) or os.path.getmtime(cache) < os.path.getmtime(src):
        im = Image.open(src); im.load(); rgba = im.convert('RGBA'); best = open(src, 'rb').read()
        for cand in ('rgba', 'pal'):
            b = io.BytesIO()
            if cand == 'rgba': rgba.save(b, 'PNG', optimize=True)
            else:
                cols = rgba.getcolors(256)
                if cols is None: continue
                pal = [c for _, c in cols]; idx = {c: i for i, c in enumerate(pal)}
                p = Image.new('P', rgba.size); p.putdata([idx[c] for c in rgba.getdata()])
                flat = [v for c in pal for v in c[:3]]; p.putpalette(flat + [0] * (768 - len(flat)))
                p.info['transparency'] = bytes(c[3] for c in pal); p.save(b, 'PNG', optimize=True, transparency=bytes(c[3] for c in pal))
            if len(b.getvalue()) < len(best): best = b.getvalue()
        open(cache, 'wb').write(best)
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
def ogg(src, key, br='20k', mono=True):
    out = 'build/.snd/' + key + '.opus.ogg'
    if not os.path.exists(out):
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', src] + (['-ac', '1'] if mono else []) + ['-c:a', 'libopus', '-b:a', br, out], check=True)
    return base64.b64encode(open(out, 'rb').read()).decode()
sfx = {}
if os.path.isdir(NA):
    for k, f in SFX.items(): sfx[k] = ogg(NA + 'Sounds/' + f + '.wav', 's_' + k)
    for k, f in JINGLES.items(): sfx[k] = ogg(NA + 'Jingles/' + f + '.wav', 'j_' + k, '28k')
# music: the original Legend of Aethra score, rendered by tools/music (the dev page carries it with --music; the
# userscript gets it from the Soundtrack script)
FF = 'build/.snd/ff/'
if '--music' in sys.argv or '--soundtrack' in sys.argv: subprocess.run([sys.executable, 'tools/music/render.py'], check=True)
MUSIC = {os.path.basename(f)[:-5]: f for f in sorted(glob.glob(FF + '*.opus'))}
TITLES = json.load(open(FF + 'titles.json')) if os.path.exists(FF + 'titles.json') else {}
music = {}
if '--music' in sys.argv:
    for k, f in MUSIC.items(): music[k] = base64.b64encode(open(f, 'rb').read()).decode()

maps = json.load(open('build/maps.json'))
bossfw = {}
for f in glob.glob('art/na/boss/*_Idle*.png'):
    im = Image.open(f); n = os.path.basename(f)[:-4].split('_')[0]; bossfw[n] = im.size[1] if im.size[0] % im.size[1] == 0 else im.size[0] // max(1, round(im.size[0] / im.size[1]))
world = json.load(open('build/world.json'))
gz = lambda o: base64.b64encode(gzip.compress(json.dumps(o, separators=(',', ':')).encode(), 9)).decode()
data = {'version': VERSION, 'worldz': gz(world), 'sheets': [n for n, _ in MK.SHEETS], 'fills': MK.FILL_ORDER, 'fx': fx_meta(), 'ms': MS, 'mapsz': gz(maps), 'art': art, 'sfx': sfx, 'music': music, 'bossfw': bossfw, 'sides': json.load(open('art/generated/sides/sides.json')) if os.path.exists('art/generated/sides/sides.json') else {}}
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
# ---------- the soundtrack: one optional script with every track (Opus; larger than 2 MB by choice) ----------
if '--soundtrack' in sys.argv and MUSIC:
    tracks = {k: base64.b64encode(open(f, 'rb').read()).decode() for k, f in MUSIC.items()}
    fname = 'Legend-of-Aethra-Soundtrack.user.js'; url = 'https://github.com/Eaglewing91/Legend-of-Aethra/raw/main/build/' + fname
    names = '\n'.join('   - %s' % TITLES.get(k, k) for k in MUSIC)
    txt = """// ==UserScript==
// @name         Legend of Aethra - Soundtrack
// @namespace    eaglewing.legend-of-aethra
// @version      %s
// @description  Optional music for Legend of Aethra: the full original score (%d tracks). Hands the tracks to the game when it starts; makes no requests and stores nothing.
// @author       Eaglewing [571041]
// @match        https://www.torn.com/*
// @updateURL    %s
// @downloadURL  %s
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==
/* The Legend of Aethra soundtrack: an original score in the spirit of the classic Final Fantasy soundtracks, composed
   and synthesised for this game (no samples, no borrowed melodies). (c) Eaglewing [571041], all rights reserved; for
   use on Torn only. This script makes no requests and needs no API key. It only answers the game's
   'aethra-music:request' page event with one 'aethra-music' event carrying its tracks.
   Tracks:
%s
   TERMS OF SERVICE
   | Data Storage          | No                       |
   | Data Sharing          | Nobody                   |
   | Purpose of Use        | Public amusement         |
   | Key Storage & Sharing | Not stored / Not shared  |
   | Key Access Level      | None (no API key needed) |
*/
(function () {
  const T = %s;
  let msg = null;
  const send = function () { if (!msg) msg = JSON.stringify({ part: 1, tracks: T }); document.dispatchEvent(new CustomEvent('aethra-music', { detail: msg })); };
  document.addEventListener('aethra-music:request', send);
  document.dispatchEvent(new CustomEvent('aethra-music:ready'));   // tiny: lets an already-open game ask again
  document.documentElement.dataset['aethraMusic1'] = '%s';
})();
""" % (VERSION, len(tracks), url, url, names, json.dumps(tracks), VERSION)
    open('build/' + fname, 'w').write(txt)
    print('soundtrack: %d tracks, %.2f MB' % (len(tracks), len(txt) / 1e6))

# ---------- the Art & Effects script: every picture and sound effect (the main script carries code, maps and story) ----------
main_blob = json.dumps({k: (v if k != 'music' else {}) for k, v in data.items() if k not in ('art', 'sfx')})
art_blob = json.dumps({'art': data['art'], 'sfx': data['sfx']})
ART_URL = 'https://github.com/Eaglewing91/Legend-of-Aethra/raw/main/build/Legend-of-Aethra-Art.user.js'
art_js = '''// ==UserScript==
// @name         Legend of Aethra - Art & Effects
// @namespace    eaglewing.legend-of-aethra
// @version      ''' + VERSION + '''
// @description  The pictures and sound effects for Legend of Aethra (needed to play). Hands them to the game when it starts; makes no requests and stores nothing.
// @author       Eaglewing [571041]
// @copyright    2026, Eaglewing [571041]. All rights reserved.
// @license      All Rights Reserved - for use on Torn (torn.com) only (see LICENCE)
// @match        https://www.torn.com/*
// @updateURL    ''' + ART_URL + '''
// @downloadURL  ''' + ART_URL + '''
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==
/* Art and sound effects: "Ninja Adventure" by Pixel-boy and AAA (CC0). Characters and townspeople: "Mana Seed" by Seliel the
   Shaper, used under licence with permission (not CC0; don't extract or reuse it). Packaging (c) Eaglewing [571041].
   This script makes no requests and needs no API key. It only answers the game's 'aethra-art:request' page event with one
   'aethra-art' event carrying its pictures and sounds.
   TERMS OF SERVICE
   | Data Storage          | No                       |
   | Data Sharing          | Nobody                   |
   | Purpose of Use        | Public amusement         |
   | Key Storage & Sharing | Not stored / Not shared  |
   | Key Access Level      | None (no API key needed) |
*/
(function () {
  const A = ''' + art_blob + ''';
  document.addEventListener('aethra-art:request', function () { document.dispatchEvent(new CustomEvent('aethra-art', { detail: JSON.stringify(A) })); });
  document.documentElement.dataset.aethraArt = \'''' + VERSION + '''\';
})();
'''
# (one script now: the art and effects ship inside the game itself)

# ---------- the userscript ----------
URL = 'https://github.com/Eaglewing91/Legend-of-Aethra/raw/main/build/'
header = '''// ==UserScript==
// @name         Legend of Aethra
// @namespace    eaglewing.legend-of-aethra
// @version      ''' + VERSION + '''
// @description  A 16-bit style role-playing game with active-time battles, for Torn. Plays inside the Torn Arcade phone (Legends folder) or in its own window from the Tampermonkey menu. Makes no requests, uses no API key and stores your saves only on your device.
// @author       Eaglewing [571041]
// @copyright    2026, Eaglewing [571041]. All rights reserved.
// @license      All Rights Reserved - for use on Torn (torn.com) only; no copying, modifying, redistribution or use elsewhere (see LICENCE)
// @homepageURL  https://github.com/Eaglewing91/Legend-of-Aethra
// @updateURL    ''' + URL + '''Legend-of-Aethra.user.js
// @downloadURL  ''' + URL + '''Legend-of-Aethra.user.js
// @match        https://www.torn.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// @noframes
// ==/UserScript==
/*
 * LEGEND OF AETHRA by Eaglewing [571041]
 * Licence: all rights reserved, for use on Torn only (full text: LICENCE in the GitHub repo). Third-party art and sound:
 * "Ninja Adventure" by Pixel-boy and AAA (CC0); the music is an original score. Characters and townspeople: "Mana Seed" by Seliel the Shaper, used under
 * licence with permission (not CC0; don't extract or reuse it). Unofficial fan project, not affiliated with Torn.
 *
 * HOW IT WORKS
 * - The whole game (code, maps, story, pictures and sound effects) is inside this script. Pages where you don't play only add a Tampermonkey menu entry and listen for
 *   Torn Arcade: nothing is unpacked, drawn or run until you press Play.
 * - It never reads, clicks or changes Torn's page, makes no network requests of any kind, uses no API key and no
 *   websockets. Keys are only read while the game window is open.
 * - Save files (three slots and a resume point) are kept in Tampermonkey storage on your device.
 * - Torn Arcade link (page events only): 'aethra:ping' / 'aethra:here' (installed? version), 'aethra:open' (play inside
 *   the phone), 'aethra:close', 'aethra:closed', 'aethra:mute', 'aethra:volume', 'aethra:pad'. The Art & Effects script (needed) answers
 *   'aethra-art:request' with 'aethra-art'; the optional Soundtrack script answers
 *   'aethra-music:request' with 'aethra-music'.
 *
 * TERMS OF SERVICE
 * | Data Storage          | Only locally (your save files, in Tampermonkey storage) |
 * | Data Sharing          | Nobody                                                  |
 * | Purpose of Use        | Public amusement                                        |
 * | Key Storage & Sharing | Not stored / Not shared (no API key is used)            |
 * | Key Access Level      | None (no API key needed)                                |
 */
'''
launcher = '''
AE.store = { get: function (k) { try { return GM_getValue(k, null); } catch (e) { return null; } }, set: function (k, v) { try { GM_setValue(k, v); } catch (e) {} } };
let readying = null;
const DATA = ''' + json.dumps(dict(data, music={})) + ''';
const ensure = function () { return readying || (readying = Promise.resolve(AE)); };
// music arrives from the optional Soundtrack scripts
document.addEventListener('aethra-music:ready', function () { if (AE.host && AE.host.root && AE.host.root.style.display !== 'none' && !Object.keys(AE.MUSIC || {}).length) document.dispatchEvent(new CustomEvent('aethra-music:request')); });
document.addEventListener('aethra-music', function (e) { try { const d = JSON.parse(e.detail); AE.MUSIC = Object.assign(AE.MUSIC || {}, d.tracks || {}); DATA.music = Object.assign(DATA.music || {}, d.tracks || {}); if (AE.Music && AE.Music.cur && !AE.Music.src) { const n = AE.Music.cur; AE.Music.cur = null; AE.Music.play(n); } } catch (x) {} });
// pictures and sounds come from the Art & Effects script (asked for once, when you first press Play)
let gotArt = !!DATA.art;
document.addEventListener('aethra-art', function (e) { try { const d = JSON.parse(e.detail); DATA.art = d.art; DATA.sfx = d.sfx; gotArt = true; } catch (x) {} });
const needArt = function (parent) {
  const box = document.createElement('div'); box.style.cssText = (parent ? 'position:absolute;' : 'position:fixed;z-index:2147483000;') + 'inset:0;background:#0a0c1c;color:#dde;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;font:15px sans-serif;text-align:center;padding:20px';
  box.innerHTML = '<b style="font-size:18px">Legend of Aethra needs its Art &amp; Effects script</b><span>Install it, then reload the page. It holds every picture and sound in the game.</span><a href="''' + ART_URL + '''" target="_blank" rel="noopener" style="color:#9cf">Install Legend of Aethra - Art &amp; Effects</a><button type="button" style="margin-top:8px;padding:4px 14px">Close</button>';
  box.querySelector('button').addEventListener('click', function () { box.remove(); try { document.dispatchEvent(new CustomEvent('aethra:closed')); } catch (x) {} });
  (parent || document.body).appendChild(box);
};
const play = function (parent, o) { o = o || {}; document.dispatchEvent(new CustomEvent('aethra-music:request'));
  if (!gotArt) document.dispatchEvent(new CustomEvent('aethra-art:request'));
  if (!gotArt) { needArt(parent); return Promise.resolve(); }
  return AE.host.open(parent || null, DATA, o).then(function () { if (o.muted !== undefined && AE.setMuted) AE.setMuted(o.muted); if (o.volume !== undefined && AE.setVolume) AE.setVolume(o.volume / 100); document.documentElement.dataset.aethraOpen = '1'; }); };
if (typeof GM_registerMenuCommand === 'function') GM_registerMenuCommand('Play Legend of Aethra', function () { play(); });
document.addEventListener('aethra:ping', function () { document.dispatchEvent(new CustomEvent('aethra:here', { detail: JSON.stringify({ version: \'''' + VERSION + '''\', art: document.documentElement.dataset.aethraArt || '' }) })); });
document.addEventListener('aethra:open', function (e) { let d = null; try { d = JSON.parse(e.detail || 'null'); } catch (x) {} const host = d && typeof d.host === 'string' ? document.getElementById(d.host) : null; play(host, { pad: d && typeof d.pad === 'boolean' ? d.pad : undefined, muted: d && typeof d.muted === 'boolean' ? d.muted : undefined, volume: d && typeof d.volume === 'number' ? d.volume : undefined }); });
document.addEventListener('aethra:close', function () { AE.host.close(); delete document.documentElement.dataset.aethraOpen; });
document.addEventListener('aethra:pad', function (e) { let on = false; try { on = !!JSON.parse(e.detail).on; } catch (x) {} AE.setPad(on); });
document.addEventListener('aethra:mute', function (e) { let m = false; try { m = !!JSON.parse(e.detail).muted; } catch (x) {} if (AE.setMuted) AE.setMuted(m); });
document.addEventListener('aethra:volume', function (e) { let v = 100; try { v = Number(JSON.parse(e.detail).volume); } catch (x) {} if (isFinite(v) && AE.setVolume) AE.setVolume(v / 100); });
document.documentElement.dataset.aethra = \'''' + VERSION + '''\';
'''
open('build/Legend-of-Aethra.user.js', 'w').write(header + '(function () {\n\'use strict\';\n' + src + launcher + '\n})();\n')
print('userscript: %.2f MB' % (os.path.getsize('build/Legend-of-Aethra.user.js') / 1e6))
print('build: %d maps, %d images, %d sfx, %d music, data %.1f MB, code %d KB' % (len(maps), len(art), len(sfx), len(music), len(blob) / 1e6, len(src) // 1024))
