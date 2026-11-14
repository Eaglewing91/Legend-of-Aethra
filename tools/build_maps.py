"""Build every map: each module in tools/maps/ has build() returning a list of mapkit.Map. Writes build/maps.json and
the generated tile sheets (ground transitions, walls, fills)."""
import glob, importlib, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'maps'))
import mapkit as MK

def main():
    maps = {}; mods = []
    for f in sorted(glob.glob(os.path.join(os.path.dirname(__file__), 'maps', '*.py'))):
        name = os.path.basename(f)[:-3]
        if name.startswith('_'): continue
        mod = importlib.import_module(name)
        mods.append(mod)
        for m in mod.build():
            if m.id in maps: raise SystemExit('duplicate map id ' + m.id)
            maps[m.id] = m
    # modules may add to other modules' maps (more people, more events) before the tiles are made
    for mod in mods:
        if hasattr(mod, 'patch'): mod.patch(maps)
    for m in maps.values(): m.finish()
    # a warp to (0, 0) means "the target's entry point"
    for m in maps.values():
        for w in m.warps:
            if w['to'] in maps and w['tx'] == 0 and w['ty'] == 0: w['tx'], w['ty'] = maps[w['to']].entry
    # check warps point somewhere real
    for m in maps.values():
        for w in m.warps:
            if w['to'] != '@world' and w['to'] not in maps: print('warning: %s warp to missing map %s' % (m.id, w['to']))
    out = {k: m.json() for k, m in maps.items()}
    os.makedirs('build', exist_ok=True)
    json.dump(out, open('build/maps.json', 'w'), separators=(',', ':'))
    if '--fast' not in sys.argv or not os.path.exists(os.path.join(MK.GEN, 'walls.png')):
        MK.build_fills(); MK.build_walls()
    MK.build_ground()
    print('maps: %d maps, %d ground pairs' % (len(maps), len(MK.PAIRS)))

if __name__ == '__main__':
    main()
