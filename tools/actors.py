"""The cast, built from Seliel the Shaper's Mana Seed Character Base and add-ons (licensed to the game's author; the
files never go in the public repo). Writes art/private/ms_<name>.png + .json, one atlas per person:
  field animations in 4 directions (down, up, right, left)  -> idle, walk, run
  battle animations facing left only (party stands on the right) -> ready, move, slash, thrust, shoot, cast, throw,
  hurt, dead, win (facing the camera)
Each animation's meta: y, w, h, n (frames), dirs (4 or 1), fx/fy (feet position in the cell).
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import manaseed as MS
from PIL import Image

OUT = 'art/private'
_player = MS.player
MISSING = set()
def _soft(page, L, code, v):
    # some layers (cloaks, some hair) are not drawn for every page: leave them off those pages
    try: return _player(page, L, code, v)
    except SystemExit:
        MISSING.add((page, L, code)); return Image.new('RGBA', (512, 512))
MS.player = _soft
ONE = lambda w, sh=None: {pg: [('6tla', w, 1, pg.replace('pONE', 'ONE-hand ') + ' (sword)')] + ([('7tlb', sh, 1, pg.replace('pONE', 'ONE-hand ') + ' (shield)')] if sh else []) for pg in ('pONE1', 'pONE2', 'pONE3')}
POL = lambda w: {pg: [('6tla', w, 1, pg.replace('pPOL', 'POLearm '))] for pg in ('pPOL1', 'pPOL2', 'pPOL3')}
BOW = lambda w: {pg: [('6tla', w, 1, pg.replace('pBOW', 'BOW ') + ' (bow)'), ('7tlb', 'qv01', 1, pg.replace('pBOW', 'BOW ') + ' (quiver)')] for pg in ('pBOW1', 'pBOW2', 'pBOW3')}
L4 = lambda f: f                       # 4-direction animation: f(d) -> cells
FIELD = {
    'idle': ('p1', lambda d: [(0, d)]),
    'walk': ('p1', lambda d: [(k, 4 + d) for k in range(6)]),
    'run': ('p1', lambda d: [(k, 4 + d) for k in (0, 1, 6, 3, 4, 7)]),
}
def battle(kind):
    """Battle animations (left-facing). Fighters use the combat pages (blade, pole, bow); casters ('bare') use the
    everyday pages, so they can wear any outfit."""
    a = {
        'cast': ('p2', [(6, 7), (7, 7)]),
        'throw': ('p2', [(k, 3) for k in range(4, 8)]),
        'win': ('p1', [(5, 0), (6, 0), (7, 0), (0, 0)]),
        'weak': ('p4', [(5, 7)]),
        'dead': ('p4', [(4, 4)]),
    }
    if kind == 'bare':
        a.update({'ready': ('p1', [(0, 3)]), 'move': ('p1', [(k, 7) for k in range(6)]), 'hurt': ('p4', [(6, 7)]),
                  'slash': ('p2', [(k, 3) for k in range(4, 8)]), 'thrust': ('p2', [(k, 3) for k in range(4, 8)])})
        return a
    pg = {'blade': 'pONE', 'pole': 'pPOL', 'bow': 'pBOW'}[kind]
    a.update({'ready': (pg + '2', [(k, 3) for k in range(4)]), 'move': (pg + '2', [(k, 3) for k in range(4, 8)]),
              'hurt': (pg + '1', [(5, 3)])})
    if kind == 'blade':
        a['slash'] = ('pONE3', [(k, 3) for k in range(4)]); a['thrust'] = ('pONE3', [(k, 7) for k in range(4)])
    if kind == 'pole':
        a['slash'] = ('pPOL3', [(k, 3) for k in range(4)]); a['thrust'] = ('pPOL3', [(k, 7) for k in range(3)])
    if kind == 'bow':
        a['shoot'] = ('pBOW3', [(k, 7) for k in range(8)]); a['slash'] = a['shoot']; a['thrust'] = a['shoot']
    return a
# look: skin 0-10; out (code, v); hair (code, v); hat (code, v); cloak v. Fighters wear what the combat pages
# support (Forester tunic or farmer's trousers, bob or dapper hair, the two hats); casters can wear anything.
CAST = {
    'kael':  (dict(skin=2, out=('fstr', 3), hair=('dap1', 2)), ONE('sw02'), 'blade'),
    'lyra':  (dict(skin=1, out=('pfdr', 2), hair=('pon1', 5), cloak=1), {}, 'bare'),
    'bram':  (dict(skin=6, out=('pfpn', 1), hair=('dap1', 13)), POL('hb01'), 'pole'),
    'sable': (dict(skin=3, out=('fstr', 2), hair=('bob1', 13), hat=('pnty', 5)), ONE('sw01'), 'blade'),
    'orin':  (dict(skin=4, out=('alch', 4), hair=('bob2', 0), cloak=7), {}, 'bare'),
    'ember': (dict(skin=0, out=('pfdr', 5), hair=('bob1', 5), cloak=8), {}, 'bare'),
    'rook':  (dict(skin=7, out=('pfpn', 5), hair=('bob1', 0)), ONE('mc01'), 'blade'),
    'vesna': (dict(skin=5, out=('fstr', 5), hair=('bob1', 7), hat=('pfht', 2)), BOW('bo02'), 'bow'),
    # story people (also used as human foes in battle)
    'vesper':  (dict(skin=0, out=('alch', 1), hair=('pon1', 1), cloak=1), {}, 'bare'),
    'corvin':  (dict(skin=2, out=('alch', 2), hair=('bob2', 3), cloak=8), {}, 'bare'),
    'drago':   (dict(skin=4, out=('fstr', 1), hair=('dap1', 4)), POL('hb01'), 'pole'),
    'trooper': (dict(skin=3, out=('fstr', 1), hair=('bob1', 11), hat=('pfht', 1)), ONE('sw01'), 'blade'),
    'gunner':  (dict(skin=5, out=('pfpn', 1), hair=('dap1', 13), hat=('pfht', 1)), BOW('bo01'), 'bow'),
    'officer': (dict(skin=1, out=('fstr', 4), hair=('dap1', 10)), ONE('sw02'), 'blade'),
    'ilse':    (dict(skin=3, out=('pfdr', 3), hair=('pon1', 0), cloak=2), {}, 'bare'),
    'pip':     (dict(skin=6, out=('pfpn', 4), hair=('bob1', 5)), POL('hb01'), 'pole'),
    'marlo':   (dict(skin=1, out=('pfpn', 2), hair=('dap1', 11), hat=('pnty', 2)), ONE('sw01'), 'blade'),
    'tech':    (dict(skin=4, out=('alch', 3), hair=('bob1', 9), cloak=3), {}, 'bare'),
}

def build(name, look, gear, kind):
    guides = {}
    for gl in gear.values():
        for (_, _, _, gname) in gl: guides[gname] = MS.guide(gname)
    blocks = []
    for an, (page, fr) in FIELD.items():
        blocks.append((an, [[MS.actor_cell(page, c, r, guides, look, gear) for (c, r) in fr(d)] for d in range(4)]))
    for an, (page, cells) in battle(kind).items():
        blocks.append(('b_' + an, [[MS.actor_cell(page, c, r, guides, look, gear) for (c, r) in cells]]))
    built = []
    for an, rows in blocks:
        box = None
        for row in rows:
            for c in row:
                bb = c.getbbox()
                if bb: box = bb if not box else (min(box[0], bb[0]), min(box[1], bb[1]), max(box[2], bb[2]), max(box[3], bb[3]))
        built.append((an, rows, box))
    W = max(len(r[0]) * (bb[2] - bb[0]) for (_, r, bb) in built); H = sum(len(r) * (bb[3] - bb[1]) for (_, r, bb) in built)
    atlas = Image.new('RGBA', (W, H)); y = 0; meta = {}
    for (an, rows, bb) in built:
        w, h = bb[2] - bb[0], bb[3] - bb[1]
        for d, row in enumerate(rows):
            for k, c in enumerate(row): atlas.alpha_composite(c.crop(bb), (k * w, y + d * h))
        meta[an] = {'y': y, 'w': w, 'h': h, 'n': len(rows[0]), 'dirs': len(rows), 'fx': 32 - bb[0], 'fy': 44 - bb[1]}
        y += len(rows) * h
    MS.save_indexed(atlas, OUT + '/ms_' + name + '.png')
    json.dump(meta, open(OUT + '/ms_' + name + '.json', 'w'))
    print('actor %s %dx%d %d bytes' % (name, W, H, os.path.getsize(OUT + '/ms_' + name + '.png')))

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[1:]
    for n, (look, gear, kind) in CAST.items():
        if not only or n in only: build(n, look, gear, kind)
    if MISSING: print('left off:', sorted(MISSING))
