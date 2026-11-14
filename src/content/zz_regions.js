/* ================= New regions: Cinder Camp, the Sand Refinery, Northwatch Outpost, the Fallen Isle, Halcyon after the plate ================= */
(function () {
  const E = AE.E, cs = AE.cs, EV = AE.EV, F = function () { return AE.S_.flags; };
  const sayAs = function (n, t) { return AE.say(t, { name: n }); };
  const T = function (bg, sets) { return { bg: bg, sets: sets.map(function (x) { return { enemies: x[0], w: x[1] || 1 }; }) }; };
  AE.K('saw_arm', { name: 'Saw Arm', kind: 'phys', power: 1.9, fx: 'cut' });
  AE.K('sandblaster', { name: 'Sandblaster', kind: 'mag', power: 9, elem: 'earth', status: ['blind'], hit: 40, all: 1, fx: 'quake' });
  AE.K('frost_rifle', { name: 'Frost Rifle', kind: 'mag', power: 11, elem: 'ice', fx: 'ice' });
  AE.K('isle_song', { name: 'Broken Hymn', kind: 'mag', power: 16, elem: 'holy', all: 1, fx: 'holy' });
  // the Sand Refinery (Act III, levels 32-36)
  E('sandbot', 'Refinery Crawler', 33, 2200, 100, 80, 30, 40, 26, 520, 34, 320, { mon: 'SpiderYellow', k: 2.3, sat: 0.4 }, { weak: ['water', 'bolt'], ai: [[2, 'attack'], [2, 'saw_arm']] });
  E('sandguard', 'Refinery Guard', 33, 2000, 104, 60, 40, 40, 32, 520, 34, 400, { cast: 'trooper', hue: 40 }, { ai: [[3, 'attack'], [1, 'grenade_toss']], steal: [['x_potion', 0.3]] });
  E('slagslime', 'Slag Slime', 34, 2400, 90, 90, 70, 30, 18, 540, 36, 300, { mon: 'Slime4', hue: 20 }, { weak: ['ice', 'water'], absorb: ['fire'], ai: [[1, 'attack'], [2, 'magma_spit']] });
  E('crusher', 'The Crusher', 37, 36000, 120, 70, 60, 50, 24, 12000, 300, 8000, { boss: 'GiantRacoonGold', anim: 'Idle', fw: 60, fh: 60, k: 1.9, sat: 0.5 }, { boss: 1, weak: ['bolt', 'water'], ai: [[2, 'saw_arm'], [2, 'sandblaster'], [1, 'attack']], drop: [['prism:doublecast', 1]] });
  AE.ENC.refinery = T('factory', [[['sandbot', 'sandguard'], 3], [['slagslime', 'slagslime'], 2], [['sandguard', 'sandguard', 'sandbot'], 1]]);
  // Northwatch Outpost (Act IV, levels 40-45)
  E('nwsoldier', 'Northwatch Rifleman', 41, 3200, 128, 70, 60, 50, 36, 700, 44, 420, { cast: 'gunner', hue: 190 }, { ai: [[2, 'attack'], [2, 'frost_rifle']], steal: [['turbo_ether', 0.2]] });
  E('nwhound', 'Frost Hound', 41, 3400, 132, 60, 30, 40, 44, 700, 44, 300, { mon: 'Beast', hue: 180, bright: 1.3 }, { absorb: ['ice'], weak: ['fire'], ai: [[3, 'attack'], [1, 'ice_fang']] });
  E('nwmech', 'Snow Walker', 43, 4600, 140, 100, 40, 50, 22, 760, 48, 500, { mon: 'Cyclope2', k: 2.6, sat: 0.2, bright: 1.3 }, { weak: ['bolt', 'fire'], ai: [[3, 'attack'], [1, 'drill']] });
  E('commander', 'Commander Reyst', 46, 58000, 150, 80, 90, 70, 38, 20000, 440, 15000, { cast: 'officer', k: 1.5, hue: 190 }, { boss: 1, ai: [[2, 'dv2_lunge'], [2, 'frost_rifle'], [1, 'dv_order'], [1, 'attack']], drop: [['prism:counter', 1], ['card:c_drago', 1]] });
  AE.ENC.outpost = T('snow', [[['nwsoldier', 'nwsoldier'], 3], [['nwhound', 'nwhound', 'nwsoldier'], 2], [['nwmech'], 2]]);
  // the Fallen Isle (Act V, levels 55-62)
  E('isleguard', 'Isle Sentinel', 56, 8000, 180, 110, 110, 100, 34, 1300, 76, 800, { mon: 'Cyclope2', k: 2.7, hue: 200, bright: 1.4 }, { weak: ['dark'], ai: [[2, 'attack'], [1, 'holy_lance']] });
  E('islebird', 'Storm Roc', 56, 7000, 190, 80, 90, 80, 50, 1300, 76, 700, { mon: 'Owl2', k: 2.6, hue: 200 }, { weak: ['bolt'], float: 1, ai: [[2, 'attack'], [2, 'gust'], [1, 'dive']] });
  E('islewisp', 'Chorus Shade', 57, 6000, 120, 80, 160, 130, 46, 1300, 80, 700, { mon: 'Spirit', hue: 180, bright: 1.5 }, { absorb: ['holy'], weak: ['dark'], ai: [[1, 'attack'], [2, 'isle_song']] });
  E('isleking', 'The Last Chorister', 64, 140000, 200, 110, 210, 140, 50, 40000, 900, 30000, { boss: 'GiantSpirit', anim: 'Idle', fw: 50, fh: 50, k: 2.6, hue: 170, bright: 1.6 }, { boss: 1, absorb: ['holy'], weak: ['dark'], ai: [[2, 'isle_song'], [2, 'holy_lance'], [1, 'v_count'], [1, 'h0_mend', 'hurt']], drop: [['prism:aethrael', 1]] });
  AE.ENC.skyruins = T('citadel', [[['isleguard', 'islewisp'], 3], [['islebird', 'islebird'], 2], [['islewisp', 'islewisp', 'islebird'], 1]]);
  AE.SHOPS.cc_store = { name: 'Supply Mound', items: ['potion', 'hi_potion', 'phoenix_down', 'antidote', 'tent', 'grenade', 'smoke_bomb'] };
  // gates: some places need the story to have reached them
  const gate = function (place, ch, msg) {
    const prev = EV['place:' + place];
    EV['place:' + place] = async function (w) {
      if (AE.S_.chapter < ch) { await AE.notice(msg); return; }
      if (prev) return prev.apply(this, arguments);
      w.busy = false; w.enterPlace(place, true);
    };
  };
  gate('refinery', 3, 'An Aurex refinery behind a sand-wall. Guards on every tower. Not yet.');
  gate('outpost', 4, 'A fortified Aurex outpost in the snow. Its guns point at the sky.');
  gate('skyruins', 5, 'A strange mountain. Its top looks like it fell from somewhere.');
  // Cinder Camp
  EV.rg_pip = async function () {
    if (F().a1_done && !F().a5_halcyon) { await sayAs('PIP', 'Warden! We got out! Half the Sumps came out through the drains after the Containment. This camp\'s ours now.'); return; }
    await sayAs('PIP', 'Building roofs, me. Pip and Marlo, Roofs for the Sky. Want one? No? Your loss.');
  };
  EV.rg_marlo = async function () { await sayAs('MARLO', F().q_marlo_done ? 'Nell writes to the camp now. Every week. Thank you again.' : 'We sleep in shifts. Aurex patrols the Ashfields at night. If you see them, give them a smack from me.'); };
  // the bosses
  EV.rg_refinery = async function () {
    cs.flag('rg_refinery');
    await AE.say('The refinery\'s heart: a separator the size of a church, grinding desert sand for traces of the Aetherflow. Its operator climbs into a crusher-suit.');
    await cs.battle(['crusher'], { bg: 'factory', boss: 1, noRun: 1 });
    await AE.say('The separator winds down. The sand stops screaming. Somewhere under the dunes, the flow settles.');
  };
  EV.rg_outpost = async function () {
    cs.flag('rg_outpost');
    await sayAs('COMMANDER REYST', 'The Warden. Captain Venn spoke of you. He said you were worth five of my men. I brought twenty.');
    await cs.battle(['nwsoldier', 'commander', 'nwsoldier'], { bg: 'snow', boss: 1, noRun: 1 });
    await sayAs('COMMANDER REYST', 'Venn was right. ...Tell him Reyst says he picked the better side.');
  };
  EV.rg_skyruins = async function () {
    cs.flag('rg_skyruins');
    await AE.say('At the top of the broken spire, a singer made of light keeps singing a hymn with half its words missing.');
    if (AE.S_.party.indexOf('lyra') >= 0) await cs.s('lyra', 'It\'s one of the Chorus. The last one who didn\'t go into the flow. It doesn\'t know the song is over.');
    await cs.battle(['isleking'], { bg: 'citadel', boss: 1, noRun: 1 });
    if (AE.S_.party.indexOf('lyra') >= 0) await cs.s('lyra', 'Rest now. We\'ll sing the rest for you.');
  };
  // Halcyon after the plate
  const hp = EV['place:halcyon'];
  EV['place:halcyon'] = async function (w) {
    if (F().a5_halcyon) { AE.WORLD.places.halcyon[2] = 'halcyon_new'; w.busy = false; w.enterPlace('halcyon', true); return; }
    return hp.apply(this, arguments);
  };
  EV.inn_tess = function () { return AE.inn(0, 'TESS'); };
  EV.rg_corra = async function () {
    await sayAs('NAN CORRA', 'There\'s my girl. And her Warden. Sit. Eat. You\'re both too thin, and the world\'s ended twice, and that\'s no excuse.');
    if (AE.S_.party.indexOf('lyra') >= 0) await cs.s('lyra', 'Nan. I sang the sky back together.');
    await sayAs('NAN CORRA', 'I know, love. I heard you. Everybody heard you.');
    AE.healAll();
  };
  EV.rg_drago_halcyon = async function () { await sayAs('DRAGO', 'Aurex Security is now the Halcyon Watch. We carry buckets more than halberds. I don\'t hate it.'); };
})();
