"""Music per place: every town (and every house, shop and inn inside it) plays its own theme from the soundtrack."""
def build(): return []

# map id prefix -> soundtrack track (first match wins)
RULES = [
    (('wh_cat',), None),                                   # Windhaven's catacombs keep their crypt music
    (('gs_arcana',), 'tavern'),
    (('th_', 'thornbrook'), 'thornbrook'),
    (('ph_', 'plate_heights', 'market_house', 'market'), 'halcyon'),
    (('sumps', 'lyra_home', 'hn_'), 'sumps'),
    (('pl_', 'portlark', 'sm_', 'saltmere'), 'harbour'),
    (('ss_', 'sunscar'), 'desert'),
    (('fg_', 'frostgate'), 'frost'),
    (('lm_', 'lumen'), 'lumen'),
    (('md_', 'mideel'), 'peaceful'),
    (('gs_', 'gilded_spire'), 'gilded'),
    (('ks_', 'kestrel', 'pi_', 'talon_isle'), 'talon'),
    (('wardens_hall', 'academy'), 'academy'),
    (('wh_', 'windhaven', 'cc_'), 'town'),
]


def patch(maps):
    for mid, m in maps.items():
        for pre, track in RULES:
            if any(mid.startswith(p) for p in pre):
                if track and (m.music in ('village', 'town', 'peaceful', 'desert', 'snow', 'mystical', 'spire', 'city', 'slums', 'boat', 'airship', 'temple', 'chill') or mid in ('windhaven',)):
                    m.music = track
                break
        if m.music == 'village': m.music = 'town'
        if m.music == 'road': m.music = 'quiet'
