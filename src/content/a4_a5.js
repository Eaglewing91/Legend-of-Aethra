/* ================= Acts IV and V: Nordheim, the Sundering, the Broken Sky, the Citadel and the ending ================= */
(function () {
  const E = AE.E, K = AE.K, cs = AE.cs, EV = AE.EV, F = function () { return AE.S_.flags; };
  const s = function (who, t) { return cs.s(who, t); }, sayAs = function (n, t) { return AE.say(t, { name: n }); };
  const inP = function (id) { return AE.S_.party.indexOf(id) >= 0 || AE.S_.reserve.indexOf(id) >= 0; };
  AE.ITEMS.frost_lantern.desc = 'Lights the way through the Frostgate Mines.';
  // ---------- skills ----------
  K('blizzard', { name: 'Blizzard', kind: 'mag', power: 13, elem: 'ice', all: 1, fx: 'ice' });
  K('ice_fang', { name: 'Ice Fang', kind: 'phys', power: 1.8, elem: 'ice', fx: 'bite' });
  K('root_storm', { name: 'Root Storm', kind: 'mag', power: 14, elem: 'earth', all: 1, fx: 'quake' });
  K('void_ray', { name: 'Void Ray', kind: 'mag', power: 16, elem: 'dark', fx: 'dark' });
  K('holy_lance', { name: 'Holy Lance', kind: 'mag', power: 16, elem: 'holy', fx: 'holy' });
  K('thunderhead', { name: 'Thunderhead', kind: 'mag', power: 15, elem: 'bolt', all: 1, fx: 'bolt' });
  K('sky_fall', { name: 'Skyfall', kind: 'mag', power: 22, all: 1, fx: 'boom' });
  K('warden_crush', { name: 'Warden Crush', kind: 'phys', power: 2.6, fx: 'boom' });
  K('v_count', { name: 'Counting', kind: 'mag', power: 4, status: ['sleep', 'stop'], hit: 30, all: 1, fx: 'time' });
  K('v_cradle', { name: 'Cradle Light', kind: 'mag', power: 20, elem: 'holy', all: 1, fx: 'holy' });
  K('v_shards', { name: 'Four Shards', kind: 'mag', power: 26, all: 1, fx: 'spark' });
  K('v_mend', { name: 'Remember Me', kind: 'heal', power: 60, target: 'self', fx: 'heal' });
  K('nx_forget', { name: 'Forget', kind: 'mag', power: 8, status: ['silence', 'confuse', 'slow'], hit: 40, all: 1, fx: 'dark' });
  K('nx_hollow', { name: 'Hollow', kind: 'gravity', power: 0.5, fx: 'dark' });
  K('nx_end', { name: 'The Last Memory', kind: 'mag', power: 34, elem: 'dark', all: 1, fx: 'dark' });
  K('nx_grasp', { name: 'Grasp of Nothing', kind: 'phys', power: 2.8, drain: 1, fx: 'claw' });
  // ---------- enemies (Nordheim) ----------
  E('snowwolf', 'Rime Wolf', 38, 2800, 120, 60, 30, 40, 44, 640, 40, 300, { mon: 'Beast', hue: 180, bright: 1.3 }, { weak: ['fire'], absorb: ['ice'], ai: [[3, 'attack'], [1, 'ice_fang']] });
  E('yeti', 'Snow Brute', 40, 3600, 130, 70, 20, 40, 24, 700, 44, 340, { mon: 'Panda', k: 2.6, bright: 1.3 }, { weak: ['fire'], ai: [[3, 'attack'], [1, 'maul']] });
  E('icewisp', 'Frost Wisp', 39, 2200, 60, 50, 90, 80, 40, 660, 42, 300, { mon: 'Spirit', hue: 170, bright: 1.3 }, { absorb: ['ice'], weak: ['fire'], float: 1, ai: [[1, 'attack'], [2, 'ice_spell'], [1, 'blizzard']] });
  E('minebot', 'Aurex Mine Crawler', 40, 3200, 128, 90, 30, 40, 24, 690, 44, 400, { mon: 'SpiderYellow', k: 2.4, sat: 0.3 }, { weak: ['bolt'], ai: [[3, 'attack'], [1, 'drill']] });
  E('frostwyrm', 'Frost Wyrm', 44, 52000, 140, 70, 100, 70, 36, 18000, 400, 12000, { boss: 'DragonBlue', anim: 'Head', fw: 44, fh: 46, k: 2.6 }, { boss: 1, absorb: ['ice'], weak: ['fire'], ai: [[2, 'attack'], [2, 'blizzard'], [1, 'ice_fang']], steal: [['prism:glacielle', 0.2], ['elixir', 1]] });
  E('rootling', 'Rootling', 42, 3000, 126, 70, 60, 60, 30, 720, 46, 360, { mon: 'Bamboo' }, { weak: ['fire'], ai: [[2, 'attack'], [1, 'root_bind']] });
  E('fenhorror', 'Fen Horror', 43, 3800, 134, 66, 80, 60, 28, 760, 48, 380, { mon: 'GreenOctopus', k: 2.4 }, { weak: ['fire', 'ice'], ai: [[2, 'attack'], [1, 'spit'], [1, 'root_storm']] });
  E('bonedrake', 'Bone Drake', 44, 4200, 140, 72, 70, 60, 34, 800, 50, 420, { mon: 'Dragon', hue: 200, sat: 0.2, bright: 1.3 }, { undead: 1, weak: ['holy'], ai: [[2, 'attack'], [1, 'wail']] });
  E('rootking', 'The Root King', 46, 60000, 150, 76, 100, 70, 30, 20000, 420, 14000, { boss: 'GiantBamboo2', anim: 'Idle', fw: 62, fh: 62, k: 2.1 }, { boss: 1, weak: ['fire'], absorb: ['earth'], ai: [[2, 'attack'], [2, 'root_storm'], [1, 'sap_mend', 'hurt']], steal: [['prism:gaiadon', 0.2], ['megalixir', 1]] });
  E('ember_trial', 'Echo of Lumen', 40, 30000, 100, 60, 90, 70, 34, 12000, 300, 0, { boss: 'GiantSpirit', anim: 'Idle', fw: 50, fh: 50, k: 2.2, hue: 40 }, { boss: 1, ai: [[2, 'holy_lance'], [2, 'thunderhead'], [1, 'attack']] });
  // ---------- enemies (the Broken Sky) ----------
  E('skyspawn', 'Sky Spawn', 50, 5200, 160, 80, 100, 80, 40, 1000, 60, 600, { mon: 'Eye', k: 2.4, hue: 330 }, { float: 1, ai: [[2, 'attack'], [2, 'void_ray']] });
  E('redwolf', 'Crimson Wolf', 50, 5800, 170, 80, 40, 60, 46, 1020, 60, 500, { mon: 'Beast', hue: 350, sat: 2 }, { ai: [[3, 'attack'], [1, 'frenzy']] });
  E('hollowed', 'The Hollowed', 52, 6200, 150, 70, 120, 90, 34, 1100, 64, 600, { mon: 'Spirit2', hue: 260, bright: 0.6 }, { undead: 1, weak: ['holy'], absorb: ['dark'], ai: [[1, 'attack'], [2, 'void_ray'], [1, 'nx_forget']] });
  E('choirguard', 'Choir Guardian', 58, 9000, 190, 110, 120, 110, 36, 1400, 80, 900, { mon: 'Cyclope2', k: 2.8, hue: 180, bright: 1.4 }, { weak: ['dark'], ai: [[2, 'attack'], [1, 'holy_lance'], [1, 'reflect_self']] });
  E('citadelangel', 'Citadel Seraph', 60, 8000, 170, 90, 150, 120, 44, 1500, 84, 1000, { mon: 'Butterfly', k: 2.6, hue: 200, bright: 1.5 }, { float: 1, weak: ['dark'], ai: [[1, 'attack'], [2, 'holy_lance'], [1, 'cure_spell', 'ally_hurt']] });
  E('voidknight', 'Hollow Knight', 62, 11000, 210, 120, 80, 90, 38, 1700, 90, 1200, { cast: 'officer', k: 1.5, hue: 260, bright: 0.6 }, { ai: [[3, 'attack'], [1, 'nx_grasp']] });
  // the Sky Wardens (they roam the world after the Sundering)
  const W = function (id, name, hp, art, el) { E(id, name, 62, hp, 210, 100, 150, 100, 36, 30000, 600, 20000, art, { boss: 1, weak: el[0], absorb: el[1], ai: [[2, 'warden_crush'], [2, 'sky_fall'], [1, el[2]], [1, 'attack']] }); };
  W('w_ashen', 'Ashen Warden', 110000, { boss: 'TenguRed', anim: 'Idle', fw: 82, fh: 82, k: 1.8, sat: 0.2 }, [['water'], ['fire'], 'ic_inferno']);
  W('w_storm', 'Storm Warden', 110000, { boss: 'TenguBlue', anim: 'Idle', fw: 68, fh: 68, k: 2, hue: 60 }, [['earth'], ['bolt'], 'thunderhead']);
  W('w_frost', 'Rime Warden', 110000, { boss: 'DragonGreen', anim: 'Head', fw: 44, fh: 46, k: 2.8, hue: 120 }, [['fire'], ['ice'], 'blizzard']);
  W('w_iron', 'Iron Warden', 120000, { boss: 'GiantRedSamurai', anim: 'Idle', fw: 48, fh: 48, k: 2.6, sat: 0.1 }, [['bolt'], [], 'jg_cannon']);
  W('w_halcyon', 'Halcyon\'s Bane', 90000, { boss: 'SquidGreen', anim: 'Idle', fw: 76, fh: 79, k: 1.9, hue: 300 }, [['bolt'], ['water'], 'dw_deluge']);
  // trials and super-bosses
  E('t_glacielle', 'Glacielle', 50, 70000, 150, 80, 140, 100, 40, 20000, 500, 0, { mon: 'Spirit', k: 3.4, hue: 170 }, { boss: 1, absorb: ['ice'], weak: ['fire'], ai: [[2, 'blizzard'], [1, 'attack'], [1, 'ice_spell']] });
  E('t_voltigar', 'Voltigar', 52, 74000, 160, 80, 150, 100, 46, 21000, 520, 0, { mon: 'Eye2', k: 3.6, hue: 40 }, { boss: 1, absorb: ['bolt'], weak: ['earth'], ai: [[2, 'thunderhead'], [1, 'attack'], [1, 'zap']] });
  E('t_sylph', 'Sylphine\'s Shadow', 48, 66000, 150, 76, 130, 90, 50, 19000, 480, 0, { mon: 'Butterfly', k: 3.4, hue: 120 }, { boss: 1, absorb: ['wind'], weak: ['earth'], ai: [[2, 'gale'], [1, 'attack'], [1, 'wind_blade']] });
  E('hollowking', 'The Hollow King', 90, 400000, 300, 160, 260, 160, 60, 99999, 2000, 99999, { boss: 'DemonCyclop', anim: 'Idle', fw: 50, fh: 50, k: 2.6, hue: 260, bright: 0.6 }, { boss: 1, ai: [[2, 'nx_grasp'], [2, 'nx_end'], [1, 'nx_forget'], [1, 'attack']], drop: [['sky_render', 1]] });
  E('ruinwyrm', 'Ruin Wyrm', 80, 300000, 260, 140, 220, 140, 54, 80000, 1500, 60000, { boss: 'DragonGreen', anim: 'Head', fw: 44, fh: 46, k: 3, hue: 300 }, { boss: 1, ai: [[2, 'sky_fall'], [2, 'warden_crush'], [1, 'blizzard'], [1, 'ic_inferno']], drop: [['omega_core', 1]] });
  E('hermit', 'The Hermit', 75, 240000, 240, 130, 240, 160, 60, 70000, 1400, 50000, { cast: 'orin', k: 1.6, hue: 180 }, { boss: 1, ai: [[2, 'thunderhead'], [2, 'blizzard'], [2, 'ic_inferno'], [1, 'v_count']], drop: [['genesis_rod', 1]] });
  // the end
  E('vesper1', 'Vesper Lune', 64, 90000, 180, 100, 180, 120, 44, 0, 0, 0, { cast: 'vesper', k: 1.5 }, { boss: 1, ai: [[2, 'v_cradle'], [1, 'v_count'], [1, 'holy_lance']] });
  E('vesper2', 'Vesper, Crowned', 66, 120000, 200, 110, 200, 130, 46, 0, 0, 0, { boss: 'GiantSpirit', anim: 'Idle', fw: 50, fh: 50, k: 2.6, hue: 180, bright: 1.4 }, { boss: 1, ai: [[2, 'v_shards'], [1, 'v_count'], [1, 'v_mend', 'hurt'], [1, 'holy_lance']] });
  E('vesper3', 'Vesper, Hollowed', 68, 140000, 220, 120, 220, 140, 48, 0, 0, 0, { boss: 'TenguBlue', anim: 'Idle', fw: 68, fh: 68, k: 2.3, hue: 200, bright: 0.7 }, { boss: 1, ai: [[2, 'v_shards'], [2, 'void_ray'], [1, 'nx_forget']] });
  E('nyxar1', 'Nyxar, the Hollow Echo', 72, 150000, 220, 130, 240, 150, 50, 0, 0, 0, { boss: 'DragonBlue', anim: 'Head', fw: 44, fh: 46, k: 3.4, hue: 240, bright: 0.5 }, { boss: 1, ai: [[2, 'nx_grasp'], [2, 'void_ray'], [1, 'nx_forget'], [1, 'nx_hollow']] });
  E('nyxar2', 'Nyxar, Last Memory', 75, 180000, 220, 140, 260, 160, 54, 0, 0, 0, { boss: 'SquidRed', anim: 'Idle', fw: 76, fh: 79, k: 2.3, hue: 240, bright: 0.4 }, { boss: 1, ai: 'nyxar' });
  AE.AI.nyxar = function (f, B) { const v = f.ai.vars; v.t = (v.t || 0) + 1; if (v.t % 5 === 0) return AE.mkAct(f, B, 'nx_end'); if (v.t % 3 === 0) return AE.mkAct(f, B, 'nx_hollow'); return AE.mkAct(f, B, ['nx_grasp', 'void_ray', 'nx_forget'][AE.rand(3)]); };
  // ---------- encounter tables ----------
  const T = function (bg, sets) { return { bg: bg, sets: sets.map(function (x) { return { enemies: x[0], w: x[1] || 1, unless: x[2] }; }) }; };
  AE.ENC.w_nordheim = T('snow', [[['snowwolf', 'snowwolf'], 3], [['yeti'], 2], [['icewisp', 'snowwolf'], 2]]);
  AE.ENC.w_lumen_wood = T('snow', [[['icewisp', 'icewisp'], 2], [['yeti', 'snowwolf'], 2]]);
  AE.ENC.fgmine = T('ice', [[['minebot', 'snowwolf'], 3], [['icewisp', 'icewisp'], 2], [['yeti'], 2]]);
  AE.ENC.deeproot = T('cave', [[['rootling', 'rootling'], 3], [['fenhorror'], 2], [['bonedrake'], 2], [['rootling', 'fenhorror', 'rootling'], 1]]);
  AE.ENC.trial = T('temple', [[['choirguard'], 2], [['citadelangel', 'citadelangel'], 2]]);
  AE.ENC.citadel = T('citadel', [[['choirguard', 'citadelangel'], 3], [['voidknight'], 2], [['hollowed', 'hollowed', 'citadelangel'], 2], [['voidknight', 'hollowed'], 1]]);
  AE.ENC.abyss = T('citadel', [[['voidknight', 'hollowed'], 2], [['choirguard', 'citadelangel'], 2], [['skyspawn', 'skyspawn', 'redwolf'], 2]]);
  // after the Sundering, the world's monsters change, and a Sky Warden may find you
  const ch5 = { w_ashfields: 'w_ashen', w_meridia_n: 'w_storm', w_nordheim: 'w_frost', w_solmara: 'w_iron', w_desert: 'w_iron', w_mesa: 'w_ashen' };
  const roll = AE.rollFormation;
  AE.rollFormation = function (grp) {
    if (AE.S_.chapter >= 5 && AE.ENC[grp] && grp.indexOf('w_') === 0) {
      const wd = ch5[grp.replace('_forest', '')];
      if (wd && !AE.S_.flags['beat_' + wd] && Math.random() < 0.04) return { enemies: [wd], boss: 1, bg: 'sky', noRun: 1, warden: wd };
      if (Math.random() < 0.5) return { enemies: AE.pick([['skyspawn', 'redwolf'], ['hollowed', 'skyspawn'], ['redwolf', 'redwolf', 'skyspawn']]) };
    }
    return roll.apply(this, arguments);
  };
  // shops
  AE.SHOPS.fg_shop = { name: 'Frost Provisions', items: ['x_potion', 'phoenix_down', 'remedy', 'turbo_ether', 'cottage', 'soft', 'smoke_bomb'] };
  AE.SHOPS.fg_arms = { name: 'Glacier Forge', items: ['crystal_saber', 'sage_rod', 'dragoon_pike', 'mist_dirk', 'echo_bell', 'titan_grip', 'aether_rifle', 'crystal_band', 'dragon_mail'] };
  AE.SHOPS.fg_prism = { name: 'Rime Prisms', items: ['prism:ice', 'prism:time', 'prism:seal', 'prism:revive', 'prism:absorb_mp', 'prism:quick', 'prism:speed_plus', 'prism:encounter_down', 'prism:preemptive'] };
  AE.SHOPS.lm_shop = { name: 'Chime Shop', items: ['silver_bell', 'choir_bell', 'echo_bell', 'elixir', 'turbo_ether', 'prism:holy'] };
  AE.SHOPS.academy = { name: 'Warden Quartermaster', items: ['x_potion', 'elixir', 'megalixir', 'phoenix_down', 'remedy', 'turbo_ether', 'cottage', 'aegis_band', 'prism:flare', 'prism:exp_plus'] };
  AE.SHOPS.md_shop = { name: 'Shallows Store', items: ['x_potion', 'elixir', 'phoenix_down', 'remedy', 'cottage'] };
  const C = AE.CARD;
  C('c_ember', 'Ember', 9, [7, 8, 9, 6], { cast: 'ember' }); C('c_frostwyrm', 'Frost Wyrm', 8, [8, 8, 6, 7], { boss: 'DragonBlue', fw: 44, fh: 46 }, 'ice');
  C('c_rootking', 'Root King', 8, [7, 9, 7, 6], { boss: 'GiantBamboo2', fw: 62, fh: 62 }, 'earth'); C('c_nyxar', 'Nyxar', 10, [10, 10, 7, 9], { boss: 'DragonBlue', fw: 44, fh: 46, hue: 240 }, 'dark');
  C('c_hollowking', 'Hollow King', 10, [9, 10, 10, 6], { boss: 'DemonCyclop', fw: 50, fh: 50, hue: 260 }, 'dark');
  [['frostwyrm', 'c_frostwyrm'], ['rootking', 'c_rootking'], ['hollowking', 'c_hollowking']].forEach(function (p) { const X = AE.ENEMIES[p[0]]; X.drop = (X.drop || []).concat([['card:' + p[1], 1]]); });

  // ---------- Act IV ----------
  EV.inn_frost = function () { return AE.inn(250); }; EV.inn_lumen = function () { return AE.inn(200); }; EV.inn_academy = function () { return AE.inn(0, 'ACADEMY NURSE'); };
  EV.a4_frost = async function () {
    cs.flag('a4_frost'); await AE.say('Frostgate. A mining town in the snow, and every chimney smoking. The Aurex mine cuts down toward the Deeproot.');
    if (inP('orin')) await sayAs('ORIN', 'The Earth Crystal lies under the Deeproot Caverns. But the way in runs through Lumen, and Lumen hides from strangers. We need a summoner\'s bell to find it.');
  };
  EV.a4_foreman = async function () { await sayAs('FOREMAN', 'There was a bell once, in the deep galleries. The old Lumen folk used to come for it. Then something big and cold moved into Bell Hollow, and the bell stopped ringing.'); };
  EV.a4_frostwyrm = async function () {
    await AE.say('Bell Hollow. A silver bell hangs from the ice above a sleeping wyrm. The wyrm opens one eye.');
    await cs.battle(['frostwyrm'], { bg: 'ice', boss: 1, noRun: 1 });
    cs.flag('a4_lumenbell'); await AE.gain('lumen_bell'); await AE.gain('prism:glacielle');
    await AE.say('Ring the Lumen Bell at the snow-woods east of Frostgate to find the hidden village.', { name: 'TIP' });
  };
  EV['place:lumen'] = async function (w) {
    if (!AE.has('lumen_bell')) { await AE.notice('Snow, and silence, and trees that all look the same.'); return; }
    AE.Sfx.play('echo'); await AE.notice('You ring the Lumen Bell. The trees part.');
    w.busy = false; w.enterPlace('lumen', true);
  };
  EV.a4_lumen = async function () { cs.flag('a4_lumen'); await AE.say('Lumen. Bells hang from every eave. They ring with no wind at all.'); };
  EV.a4_elderbell = async function () { await sayAs('ELDER BELL', F().a4_ember ? 'Ember chose you. Lumen goes with her.' : 'Ember is the last summoner of Lumen. If you would take her into danger, she must choose it herself. Speak with her in the hall.'); };
  EV.a4_ember = async function () {
    await sayAs('EMBER', 'You\'re the ones the voice talks about. The voice in the Crater. It sounds like my mother. It isn\'t my mother.');
    await sayAs('EMBER', 'It\'s Nyxar. The Echoes told me. It wears the voices of everyone you\'ve lost, so you\'ll come closer.');
    await sayAs('EMBER', 'If I come with you, the Elders say I have to pass the trial. My bell against an Echo. Watch.');
    const r = await cs.battle(['ember_trial'], { bg: 'temple', boss: 1, noRun: 1 });
    cs.flag('a4_ember'); cs.remove('ember'); await cs.join('ember'); await AE.gain('prism:seraphel');
    // the Lantern House, told at last
    cs.music('sad');
    await AE.say('That night in Lumen\'s hall, by the bell-fire, everyone told what they knew of the Lantern House.');
    if (inP('sable')) await s('sable', 'I grew up with them. Kael, the real one. Vesper. She was like a big sister. She counted us to sleep.');
    if (inP('orin')) await sayAs('ORIN', 'And I taught her about the Chorus when she was fifteen. She asked if the Aetherflow could give back what it took. I said perhaps. I should have said no.');
    if (inP('rook')) await sayAs('ROOK', 'I have the boy\'s last memory. He went back for the tenth child. The tenth child was Sable.');
    if (inP('sable')) await s('sable', '...Yeah. He carried me out. Then the roof came down.');
    if (inP('bram')) {
      await s('bram', 'And I was the officer at the bottom of the hill, with the order to burn it all to stop the "outbreak". The outbreak was one frightened girl with a crystal she didn\'t understand.');
      await s('bram', 'I won\'t ask any of you to forgive me. I just want you to know it was me, from my own mouth. Not from Harl. Not from a memory.');
      await s('kael', '...He went back for the tenth. So will I. Every time. Even for you, Bram.');
    }
    cs.music('mystical');
  };
  EV.a4_rootking = async function () { cs.flag('a4_rootking'); await AE.say('The roots knot into a crowned giant.'); await cs.battle(['rootking'], { bg: 'forest', boss: 1, noRun: 1 }); await AE.gain('prism:gaiadon'); };
  EV.a4_sundering = async function () {
    cs.music('revelation');
    await AE.say('The Earth Crystal, vast and brown-gold, grown through with roots. Vesper waits before it, three Shards turning in the air around her.');
    cs.spawn('vesper', 'vesper', AE.field().player.x, AE.field().player.y - 4, 2);
    await sayAs('VESPER', 'You came. You always come. Now, bright boy: bring me the last one.');
    await s('kael', 'No. Not this time.');
    await sayAs('VESPER', 'One.');
    AE.game.flash = 8; await cs.shake(16);
    await sayAs('VESPER', 'Two.');
    if (inP('lyra')) await s('lyra', 'Kael, look at me! Look at ME!');
    await sayAs('VESPER', 'Three.');
    await AE.say('Kael walks forward. He reaches into the Crystal\'s heart and closes his hand on the Earth Shard. He cannot stop. He does not want to stop.');
    await AE.say('Four.'); AE.game.flash = 40; await cs.shake(80);
    cs.remove('vesper'); cs.music('final');
    await cs.narrate(['The four Shards met in Vesper\'s hands, and the world broke.', 'Far to the north, the Sky Citadel tore itself out of the Crater and rose, trailing earth and fire.',
      'The sky cracked like a dropped plate. Through the cracks came a red light that had not been seen since the Chorus fell silent.',
      'In Halcyon, President Corvin Aurex stood on his balcony to watch, and was the first to die when the Sky Wardens woke.',
      'In the Deeproot, the cavern floor gave way, and the Aetherflow rose to swallow the place where Kael had stood.',
      'Lyra Vale did not hesitate. She ran to the edge and jumped in after him.']);
    AE.away('kael'); AE.away('lyra');
    const rest = AE.S_.party.concat(AE.S_.reserve).filter(function (p) { return p !== 'kael' && p !== 'lyra'; });
    AE.S_.party = rest.slice(0, 3); AE.S_.reserve = rest.slice(3);
    await cs.narrate(['Days later, the Vanguard Academy rose from its cliffs on engines nobody had believed were real, and took the survivors aboard.',
      'Its Headmaster had been waiting forty years for the sky to break.', '"Find them," he told the ones who were left. "The flow gives back what it takes. Sometimes."']);
    await cs.title('END OF ACT IV', 'THE SUNDERING', 200);
    cs.flag('a4_sundering'); cs.flag('a4_done'); cs.chapter(5);
    if (AE.worldPan) { await AE.game.fadeIn(0.05); await AE.worldPan({ x: 96, y: 40, path: [[96, 60], [96, 26]], spin: 0.8, secs: 7, hideShip: 1, text: 'Above the Crater, the sky split open.' }); await AE.game.fadeOut(0.05); }
    await cs.warp('academy', 21, 20, 2);
    await AE.say('The world has changed. Sky Wardens roam the world map. Kael and Lyra are lost; rumours speak of something washed up in Mideel Shallows, far to the south-west.', { name: 'TIP' });
  };
  // ---------- Act V ----------
  EV['place:academy'] = async function (w) { if (!F().a4_done) { await AE.notice('The Vanguard Academy. Wardens on contract don\'t come home until the job is done.'); return; } w.busy = false; w.enterPlace('academy', true); };
  EV['place:mideel'] = async function (w) { if (!F().a4_done) { await AE.notice('Mideel Shallows. A quiet clinic town where the Aetherflow surfaces.'); } w.busy = false; w.enterPlace('mideel', true); };
  EV.a5_headmaster = async function () {
    if (!F().a5_kael) { await sayAs('HEADMASTER CAIRN', 'Every Warden swears the same oath: the contract is sacred. Your contract was to get the girl out, and back again. It isn\'t done. Find them.'); return; }
    if (!F().a5_halcyon) { await sayAs('HEADMASTER CAIRN', 'A Sky Warden circles Halcyon. The city is begging for help, and the Academy\'s guns are ready. Take us there, Warden: fly the Skylark to Halcyon.'); return; }
    await sayAs('HEADMASTER CAIRN', 'The Citadel hangs over the Crater. Every road leads there now. Go when you\'re ready. Not before.');
  };
  EV.a5_mideel_doc = async function () { await sayAs('DOCTOR', F().a5_kael ? 'Look after him. And after her. She didn\'t leave his side for a moment.' : 'He washed up in the shallows, glowing like a lamp. A girl with him, holding his hand so hard we couldn\'t prise it loose. She\'s fine. He... isn\'t anywhere at all.'); };
  EV.a5_kael_bed = async function () {
    AE.away('lyra', false); await cs.join('lyra', null, true);
    await s('lyra', 'Kael. It\'s me. I followed you all the way down, so you don\'t get to stay lost.');
    await s('lyra', 'He\'s in there, somewhere. In pieces. I can hear them, like dropped bells. I\'m going in after him.');
    const r = await AE.ask('Enter Kael\'s memory with Lyra?', ['Go in', 'Not yet'], { cancel: 1 }); if (r !== 0) return;
    AE.S_.mindParty = AE.S_.party.slice(); AE.S_.mindReserve = AE.S_.reserve.slice(); AE.S_.party = ['lyra']; AE.S_.reserve = [];
    AE.game.flash = 30; await cs.warp('kael_mind', 10, 31, 0);
  };
  const FRAG = [['Thornbrook. But not the real one: the one Vesper gave him. The well on the wrong side. It doesn\'t matter. He loved it anyway.', 'Some of what you remember isn\'t yours. All of what you DID is.'],
    ['Reactor 4. A frightened Warden on his first job, pretending not to be frightened. That one\'s all his. Nobody else was there.', 'You caught me. When we fell. That was you.'],
    ['The Lantern House, rebuilt. A woman holding his face. She knew he wasn\'t the boy she lost. She held him anyway.', 'Mother Ilse called you by name. You let her. That\'s kindness. That\'s yours too.'],
    ['The Wind Shrine. His hand opening. The shard falling into Vesper\'s palm.', 'You couldn\'t stop. But you\'re still here. You came back every time. That\'s who you are.']];
  EV.a5_frag = async function (e) {
    const n = (e && e.n) || 0; if (F()['frag' + n]) return; cs.flag('frag' + n);
    await AE.say(FRAG[n][0]); await s('lyra', FRAG[n][1]);
    if (F().frag0 && F().frag1 && F().frag2 && F().frag3) await s('lyra', 'That\'s all of them. Kael? Up by the light. Come on.');
  };
  EV.a5_mind_end = async function () {
    cs.music('peaceful');
    await AE.say('In the light at the top of the memory, a young man sits with his knees drawn up, very still.');
    await s('lyra', 'Hi.'); await s('kael', '...I don\'t know which of these are mine.');
    await s('lyra', 'None of them, some of them, all of them. It doesn\'t matter. The ones you choose. Choose, Kael.');
    await s('kael', 'Then... I choose the girl who wouldn\'t let go of me. Twice.');
    await s('lyra', 'Good choice.');
    AE.game.flash = 40;
    AE.away('kael', false); AE.S_.party = AE.S_.mindParty; AE.S_.reserve = AE.S_.mindReserve;
    AE.setParty(['kael', 'lyra'].concat(AE.S_.party.filter(function (p) { return p !== 'kael' && p !== 'lyra'; })).slice(0, 3));
    cs.flag('a5_kael'); AE.healAll();
    await AE.gain('surge_manual_kael');
    await cs.warp('mideel', 23, 24, 2);
    await s('kael', 'Kael. Just Kael. Not Ardent. He earned that name. I\'ll earn my own.');
    await AE.say('Kael rejoins. Halcyon is under attack by a Sky Warden: the Academy\'s headmaster wants to make a stand there.', { name: 'TIP' });
  };
  EV['place:halcyon'] = async function (w) {
    if (!F().a5_kael) { await AE.notice(F().a1_done ? 'Halcyon\'s gates are sealed.' : 'Halcyon.'); return; }
    if (F().a5_halcyon) { await AE.notice('Halcyon is rebuilding. The plate is down; the Sumps can see the sky.'); return; }
    w.busy = true; AE.Music.play('boss');
    await AE.say('Halcyon burns. A Sky Warden coils around the plate pillar, tearing at the city. The Academy\'s guns open up from above.');
    await sayAs('DRAGO', 'Warden! Over here! Aurex Security is with you. What\'s left of it.');
    await sayAs('DRAGO', 'Corvin\'s dead and Vesper\'s gone. I spent my life protecting the wrong people. Let me protect the right ones for once.');
    const r = await AE.startBattle({ enemies: ['w_halcyon'], bg: 'city', boss: 1, noRun: 1 });
    AE.S_.flags.a5_halcyon = 1; AE.S_.flags.a5_drago_joins = 1; AE.S_.flags.beat_w_halcyon = 1;
    await sayAs('DRAGO', 'It\'s down. Halcyon stands. ...I\'ll be at the Academy. Ask, and I\'ll fight beside you at the Citadel. That\'s the fifth time we\'ve met, Warden. Fifth time\'s the charm.');
    await AE.say('The Sky Citadel waits above the Crater, far to the north.', { name: 'TIP' });
    w.busy = false;
  };
  EV.a5_drago_base = async function () { await sayAs('DRAGO', 'Five fights. You won four. I\'m keeping count. Let\'s make the last one count together.'); };
  EV['place:crater'] = async function (w) {
    if (!F().a5_halcyon) { await AE.notice(F().a4_done ? 'The Citadel hangs above the Crater, ringed in red lightning. Not yet.' : 'The Crater. Nothing grows here. Nothing ever has.'); return; }
    w.busy = false; w.enterPlace('crater', true);
  };
  EV.a5_citadel = async function () {
    cs.flag('a5_citadel'); cs.music('final');
    await AE.say('The Sky Citadel. Halls of white stone floating on nothing, singing faintly, like a choir heard through a wall.');
    if (inP('lyra')) await s('lyra', 'It\'s the Chorus. Every voice that ever sang the world. They\'re still here. They\'re just... very quiet.');
    await AE.say('Three great gates bar the Throne Stair. Each opens from a switch deep in its own wing: split up and open them.', { name: 'TIP' });
  };
  EV.a5_gate = async function (e) {
    const n = (e && e.n) || 1;
    const team = { 1: ['bram', 'sable'], 3: ['orin', 'rook'], 5: ['ember', 'vesna'] }[n].filter(function (p) { return AE.S_.m[p]; });
    if (team.length) await AE.say(team.map(function (p) { return AE.CHARS[p].name; }).join(' and ') + ' hold the gate guardians back while you throw the switch.');
    await cs.battle(['voidknight', 'choirguard', 'voidknight'], { bg: 'citadel', noRun: 1 });
    AE.Sfx.play('door'); cs.flag('cit_gate' + n); await AE.notice('A gate on the Throne Stair opens.');
  };
  EV.a5_vesper = async function () {
    cs.music('final');
    cs.spawn('vesper', 'vesper', AE.field().player.x, AE.field().player.y - 4, 2);
    await sayAs('VESPER', 'You came. Of course you came. Kael, look: the throne. From here I can sing the world into anything. No more fires. No more lost children. Nobody ever forgotten.');
    await s('kael', 'Everybody frozen. Nothing ever changing. That isn\'t remembering, Vesper. That\'s a museum.');
    if (inP('sable')) await s('sable', 'Vesp. Stop counting. Please. He\'s not coming back. The real one. He\'s not.');
    await sayAs('VESPER', 'Sable... little Sable. You always did say the cruellest true things.');
    await sayAs('VESPER', 'No. NO. I can fix it. The voice promised me.');
    await cs.battle(['vesper1'], { bg: 'citadel', boss: 1, noRun: 1 });
    await sayAs('VESPER', 'The Shards... take them... make me MORE.');
    await cs.battle(['vesper2'], { bg: 'citadel', boss: 1, noRun: 1 });
    await sayAs('NYXAR', 'GOOD. SHE HAS CARRIED ME AS FAR AS SHE CAN.');
    await cs.battle(['vesper3'], { bg: 'citadel', boss: 1, noRun: 1 });
    cs.flag('a5_vesper'); cs.remove('vesper');
    await AE.say('Vesper falls to her knees, the Shards dark and cracked around her. For a moment she is sixteen again, burned to the wrists.');
    await sayAs('VESPER', 'Kael... I counted you to sleep. Every night. One, two, three... I\'m sorry. I\'m so sorry. It isn\'t her voice. It never was her voice.');
    await AE.say('The floor of the throne room opens like an eye. Below it, the Aetherflow, and something vast and hollow rising through it.');
    await cs.warp('aetherflow', 19, 35, 0);
  };
  EV.a5_nyxar = async function () {
    cs.music('final');
    await AE.say('In the river of all memory, a shape like a hole in the world. It speaks in the voices of the dead: mothers, children, a boy in a burning house.');
    await sayAs('NYXAR', 'I AM THE FIRST LOSS. I AM EVERY LOSS. LET ME BE THE ONLY MEMORY, AND NOTHING WILL EVER HURT AGAIN.');
    if (inP('ember')) await sayAs('EMBER', 'You are not my mother. You are Nyxar. I name you, and you\'re smaller now.');
    await s('kael', 'Everyone who ever lived is in this river. You don\'t get to be the only one.');
    await cs.battle(['nyxar1'], { bg: 'underwater', boss: 1, noRun: 1 });
    await sayAs('NYXAR', 'THEN I WILL BE THE LAST.');
    await cs.battle(['nyxar2'], { bg: 'underwater', boss: 1, noRun: 1 });
    cs.flag('a5_end'); await EV.ending();
  };
  EV.ending = async function () {
    cs.music('ending');
    await cs.narrate(['Nyxar came apart like smoke.', 'And in the river of memory, Lyra Vale began to sing.', 'One by one, the voices of the Chorus joined her: every singer who had ever lived, rising out of the Aetherflow.',
      'The song held the sky, as it had held it once before. The cracks closed. The red light faded.', 'The Crystals did not come back. Their memory was in the song now, and the song was everywhere.',
      'Without them, the reactors of Aurex Dynamics went dark, one by one. Halcyon\'s plate came down in pieces. For the first time in forty years, the Sumps saw the sky.',
      'The world had to learn to live without the Crystals\' light. It was hard. It was worth it.', 'Bram Hollis went back to Thornbrook and built a new mill, with a red roof.',
      'Sable and Mother Ilse took in every child the Sundering had orphaned.', 'Orin Thale wrote the history of the Chorus, and put his student\'s name in it, with kindness.',
      'Vesper Lune was never found. Sometimes, in Lumen, the bells ring at night in a careful rhythm. One, two, three.',
      'And in Thornbrook, beside the memorial stone with a dead boy\'s name on it, a young man and a young woman planted a bed of crystal-moss.', 'He had chosen his own name by then. It was a good one.']);
    await cs.title('LEGEND OF AETHRA', 'THE END', 300);
    await cs.narrate(['Created for Torn Arcade.', 'Art: Seliel the Shaper (Mana Seed characters), Pixel-boy and AAA (Ninja Adventure).', 'Thank you for playing.']);
    AE.S_.flags.cleared = 1; AE.S_.cleared = (AE.S_.cleared || 0) + 1;
    await AE.say('A clear save lets you keep exploring: the Abyssal Spire, the trials and the super-bosses still wait.', { name: 'TIP' });
    await cs.warp('academy', 21, 20, 2);
  };
  // ---------- trials, super-bosses, the Abyssal Spire ----------
  EV.a5_trial = async function (e) {
    const echo = (e && e.echo) || 'sylphine', foe = { sylphine: 't_sylph', glacielle: 't_glacielle', voltigar: 't_voltigar' }[echo];
    await AE.say('At the altar, an Echo takes shape to test you.');
    await cs.battle([foe], { bg: 'temple', boss: 1, noRun: 1 });
    cs.flag('trial_' + echo); await AE.gain('prism:' + (echo === 'sylphine' ? 'aethrael' : echo));
  };
  const superboss = function (place, foe, flag, text) {
    EV['place:' + place] = async function (w) {
      if (AE.S_.chapter < 5) { await AE.notice(text[0]); return; }
      if (F()[flag]) { await AE.notice(text[2]); return; }
      w.busy = true; await AE.say(text[1]);
      const r = await AE.ask('Fight?', ['Fight', 'Leave'], { cancel: 1 });
      if (r === 0) { const res = await AE.startBattle({ enemies: [foe], bg: 'sky', boss: 1 }, {}); if (res === 'win') F()[flag] = 1; }
      w.busy = false;
    };
  };
  superboss('chapel', 'ruinwyrm', 'beat_ruinwyrm', ['An empty chapel on a lonely isle.', 'The chapel bell rings by itself. Something enormous uncoils from the cliffs: the Ruin Wyrm, oldest of the dragons.', 'The chapel is quiet. The Wyrm\'s bones make a fine roof.']);
  superboss('hermit', 'hermit', 'beat_hermit', ['A hermit\'s hut. Nobody answers.', 'The hermit is an old mage who has waited a long time for a worthy opponent. "Ah. At last. Shall we?"', 'The hermit is gone. He left a note: "Well fought."']);
  EV['place:abyss'] = async function (w) {
    if (AE.S_.chapter < 5) { await AE.notice('A black spire, too tall to see the top. The door is sealed.'); return; }
    AE.S_.abyss = AE.S_.abyss || 1; w.busy = false;
    const m = 'abyss_' + (((AE.S_.abyss - 1) % 10) + 1); AE.WORLD.places.abyss[2] = m; w.enterPlace('abyss', true);
  };
  EV.a5_abyss_up = async function () {
    const S = AE.S_; S.abyss = S.abyss || 1;
    const r = await AE.ask('Abyssal Spire, floor ' + S.abyss + '. ' + (S.abyss >= 50 ? 'The top.' : 'Climb higher?'), [S.abyss >= 50 ? 'Face the top' : 'Climb', 'Return to the world'], { cancel: 1 });
    if (r === 1) { const p = AE.landNear(242, 54); AE.toWorld(p[0], p[1]); return; }
    if (S.abyss >= 50) { if (!S.flags.beat_hollowking) { await cs.battle(['hollowking'], { bg: 'citadel', boss: 1, noRun: 1 }); S.flags.beat_hollowking = 1; } return; }
    S.abyss++;
    if (S.abyss % 10 === 0) { await AE.say('A guardian waits on floor ' + S.abyss + '.'); await cs.battle(AE.pick([['choirguard', 'voidknight', 'choirguard'], ['w_iron'], ['frostwyrm'], ['rootking']]), { bg: 'citadel', boss: 1, noRun: 1 }); await AE.gain(AE.pick(['megalixir', 'elixir', 'power_source', 'speed_source', 'luck_source'])); }
    const m = 'abyss_' + (((S.abyss - 1) % 10) + 1); await cs.warp(m, AE.MAPS[m].entry[0], AE.MAPS[m].entry[1], 2);
  };
  // monsters in the Spire grow with the floor
  const mk = AE.mkEnemy;
  AE.mkEnemy = function (id, slot, o) {
    const f = mk.apply(this, arguments), fl = AE.field(), S = AE.S_;
    if (fl && /^abyss_/.test(fl.mapId) && S.abyss && !f.d.boss) { const k = 1 + S.abyss * 0.03; f.hp = f.maxhp = Math.floor(f.maxhp * k); f.atk = Math.floor(f.atk * k); f.mag = Math.floor(f.mag * k); }
    return f;
  };
  // Sky Wardens: mark beaten wardens
  const sb = AE.startBattle;
  AE.startBattle = function (form, o) { const p = sb.apply(this, arguments); if (form.warden) p.then(function (r) { if (r === 'win') AE.S_.flags['beat_' + form.warden] = 1; }); return p; };
})();
