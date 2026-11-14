/* ================= Act III: Solmara — enemies, story, side events ================= */
(function () {
  const E = AE.E, K = AE.K, cs = AE.cs, EV = AE.EV, F = function () { return AE.S_.flags; };
  const s = function (who, t) { return cs.s(who, t); }, sayAs = function (n, t) { return AE.say(t, { name: n }); };
  const inP = function (id) { return AE.S_.party.indexOf(id) >= 0 || AE.S_.reserve.indexOf(id) >= 0; };
  // ---------- skills ----------
  K('tidal', { name: 'Tidal Wave', kind: 'mag', power: 10, elem: 'water', all: 1, fx: 'water' });
  K('ink_jet', { name: 'Ink Jet', kind: 'mag', power: 6, elem: 'water', status: ['blind'], hit: 50, fx: 'water' });
  K('pinch', { name: 'Pincer', kind: 'phys', power: 1.6, fx: 'claw' });
  K('sandstorm', { name: 'Sandstorm', kind: 'mag', power: 9, elem: 'earth', status: ['blind'], hit: 35, all: 1, fx: 'quake' });
  K('heat_ray', { name: 'Heat Ray', kind: 'mag', power: 11, elem: 'fire', fx: 'fire' });
  K('magma_spit', { name: 'Magma Spit', kind: 'mag', power: 9, elem: 'fire', all: 1, fx: 'fire' });
  K('rune_beam', { name: 'Rune Beam', kind: 'mag', power: 11, fx: 'spark' });
  K('reflect_self', { name: 'Mirror Skin', kind: 'buff', status: ['reflect'], target: 'self', fx: 'shield' });
  K('flame_rifle', { name: 'Flame Rifle', kind: 'mag', power: 10, elem: 'fire', fx: 'fire' });
  K('dw_deluge', { name: 'Deluge', kind: 'mag', power: 15, elem: 'water', all: 1, fx: 'water' });
  K('dw_crush', { name: 'Abyssal Crush', kind: 'phys', power: 2.4, fx: 'boom' });
  K('dw_song', { name: 'Drowned Song', kind: 'mag', power: 3, status: ['sleep', 'confuse'], hit: 30, all: 1, fx: 'dark' });
  K('ic_inferno', { name: 'Inferno', kind: 'mag', power: 18, elem: 'fire', all: 1, fx: 'fire' });
  K('ic_fist', { name: 'Molten Fist', kind: 'phys', power: 2.5, elem: 'fire', fx: 'boom' });
  K('kestra_rain', { name: 'Knife Rain', kind: 'phys', power: 0.6, hits: 5, fx: 'cut' });
  K('dv3_dragon', { name: 'Dragonfall', kind: 'phys', power: 1.6, all: 1, fx: 'boom' });
  // ---------- enemies ----------
  E('reefcrab', 'Reef Crab', 28, 1400, 86, 70, 20, 30, 18, 400, 26, 220, { mon: 'GreenOctopus', hue: 330 }, { weak: ['bolt'], absorb: ['water'], ai: [[3, 'attack'], [1, 'pinch']] });
  E('seagull', 'Gale Gull', 27, 1000, 80, 34, 30, 30, 42, 380, 25, 160, { mon: 'Owl', hue: 180 }, { weak: ['bolt'], float: 1, ai: [[2, 'attack'], [2, 'peck']] });
  E('pirate', 'Grotto Cutthroat', 28, 1300, 88, 40, 20, 30, 34, 410, 26, 400, { cast: 'marlo', hue: 200 }, { ai: [[3, 'attack'], [1, 'shiv'], [1, 'pilfer']], steal: [['hi_potion', 0.6]] });
  E('squidling', 'Squidling', 29, 1200, 70, 40, 60, 46, 30, 420, 27, 180, { mon: 'Octopus2' }, { weak: ['bolt'], absorb: ['water'], ai: [[1, 'attack'], [2, 'ink_jet'], [1, 'tidal']] });
  E('pearlknight', 'Pearl Sentinel', 31, 2200, 96, 80, 40, 60, 20, 480, 30, 300, { mon: 'Cyclope2', k: 2.4, hue: 160, bright: 1.2 }, { weak: ['bolt'], resist: ['water'], ai: [[3, 'attack'], [1, 'reflect_self']] });
  E('kraken_s', 'Coral Kraken', 31, 1800, 84, 50, 66, 50, 28, 470, 30, 260, { mon: 'RedOctopus' }, { weak: ['bolt'], absorb: ['water'], ai: [[1, 'attack'], [2, 'tidal']] });
  E('kestra', 'Kestra, Grotto Queen', 30, 18000, 92, 46, 40, 40, 44, 7000, 200, 6000, { cast: 'sable', k: 1.45, hue: 140 }, { boss: 1, ai: [[3, 'attack'], [2, 'kestra_rain'], [1, 'pilfer']], steal: [['prism:manipulate', 0.25], ['speed_source', 1]] });
  E('dwarden', 'The Drowned Warden', 34, 30000, 98, 56, 72, 60, 26, 11000, 280, 7000, { boss: 'SquidRed', anim: 'Idle', fw: 76, fh: 79, k: 1.8, hue: 200, bright: 0.8 },
    { boss: 1, weak: ['bolt'], absorb: ['water'], ai: [[2, 'dw_crush'], [2, 'dw_deluge'], [1, 'dw_song'], [1, 'attack']], steal: [['prism:marrowtide', 0.2], ['x_potion', 1]] });
  E('sandshark', 'Sand Shark', 30, 1900, 96, 44, 20, 30, 34, 450, 28, 260, { mon: 'Fish', k: 2.6, hue: 30 }, { weak: ['water', 'ice'], ai: [[3, 'attack'], [1, 'burrow_bite']] });
  E('mummy', 'Ruin Wrapped', 30, 1700, 84, 46, 40, 40, 20, 440, 28, 220, { mon: 'Skull', hue: 40, bright: 1.2 }, { undead: 1, weak: ['fire', 'holy'], ai: [[2, 'attack'], [1, 'bone_rattle']] });
  E('sunlizard', 'Sun Basilisk', 31, 1800, 90, 50, 50, 40, 30, 470, 29, 240, { mon: 'Lizard', hue: 20 }, { weak: ['ice', 'water'], absorb: ['fire'], ai: [[2, 'attack'], [1, 'heat_ray']], addStatus: 'stone', addChance: 0.08 });
  E('runeeye', 'Rune Eye', 32, 1500, 50, 50, 80, 70, 34, 500, 32, 280, { mon: 'Eye2', hue: 260 }, { float: 1, ai: [[1, 'attack'], [2, 'rune_beam'], [1, 'reflect_self']] });
  E('glassgolem', 'Glass Golem', 33, 2600, 100, 90, 30, 90, 16, 520, 34, 300, { mon: 'Cyclope', k: 2.6, hue: 180, bright: 1.4 }, { weak: ['earth'], ai: [[3, 'attack'], [1, 'smash']] });
  E('scarab', 'Brass Scarab', 32, 1600, 94, 76, 20, 40, 30, 490, 32, 300, { mon: 'SpiderYellow', hue: 40 }, { weak: ['water', 'bolt'], ai: [[3, 'attack'], [1, 'pinch']] });
  E('chorusbot', 'Chorus Sentinel', 34, 2400, 102, 70, 60, 60, 26, 560, 36, 340, { mon: 'Eye', k: 2.6, hue: 90 }, { weak: ['bolt'], ai: [[2, 'attack'], [2, 'rune_beam']] });
  E('flametrooper', 'Aurex Flametrooper', 30, 1600, 90, 50, 50, 40, 30, 480, 30, 0, { cast: 'gunner', hue: 330 }, { ai: [[2, 'attack'], [2, 'flame_rifle']] });
  E('emberhound', 'Ember Hound', 35, 2300, 108, 50, 40, 40, 40, 580, 36, 300, { mon: 'Beast', hue: 350, bright: 1.2 }, { absorb: ['fire'], weak: ['water', 'ice'], ai: [[3, 'attack'], [1, 'magma_spit']] });
  E('lavaslime', 'Magma Slime', 35, 2600, 90, 80, 70, 40, 18, 590, 38, 320, { mon: 'Slime', hue: 330 }, { absorb: ['fire'], weak: ['ice', 'water'], ai: [[1, 'attack'], [2, 'magma_spit']] });
  E('salamander', 'Salamander', 36, 2400, 104, 60, 70, 50, 36, 600, 38, 340, { mon: 'Lizard2', hue: 340 }, { absorb: ['fire'], weak: ['ice'], ai: [[2, 'attack'], [2, 'heat_ray']] });
  E('drago3', 'Captain Drago Venn', 37, 32000, 118, 60, 50, 50, 38, 12000, 300, 8000, { cast: 'drago', k: 1.4 }, { boss: 1, ai: [[3, 'dv2_lunge'], [2, 'dv2_storm'], [1, 'dv3_dragon'], [1, 'dv_brace', 'hurt']], steal: [['prism:deathblow', 0.3], ['power_source', 1]] });
  E('colossus', 'Ignis Colossus', 40, 48000, 120, 70, 90, 60, 26, 16000, 360, 10000, { boss: 'TenguRed', anim: 'Idle', fw: 82, fh: 82, k: 1.6, bright: 1.1 },
    { boss: 1, absorb: ['fire'], weak: ['ice', 'water'], ai: 'colossus', steal: [['prism:ignarok', 0.2], ['elixir', 1]] });
  AE.AI.colossus = function (f, B) { const v = f.ai.vars; v.t = (v.t || 0) + 1; if (v.t % 4 === 0) return AE.mkAct(f, B, 'ic_inferno'); return AE.mkAct(f, B, ['attack', 'ic_fist', 'magma_spit', 'heat_ray'][AE.rand(4)]); };
  const T = function (bg, sets) { return { bg: bg, sets: sets.map(function (x) { return { enemies: x[0], w: x[1] || 1 }; }) }; };
  AE.ENC.w_solmara = T('beach', [[['reefcrab', 'seagull'], 2], [['pirate', 'pirate'], 2], [['seagull', 'seagull', 'seagull'], 1], [['sandshark'], 2]]);
  AE.ENC.w_desert = T('desert', [[['sandshark', 'scarab'], 2], [['sunlizard', 'mummy'], 2], [['scarab', 'scarab', 'scarab'], 1]]);
  AE.ENC.w_cinder = T('lava', [[['emberhound', 'emberhound'], 2], [['salamander', 'lavaslime'], 2]]);
  AE.ENC.w_sea = T('sea', [[['squidling', 'squidling'], 2], [['kraken_s'], 1]]);
  AE.ENC.grotto = T('cave', [[['pirate', 'pirate'], 3], [['reefcrab', 'squidling'], 2], [['pirate', 'pirate', 'seagull'], 1]]);
  AE.ENC.coral = T('underwater', [[['squidling', 'squidling'], 2], [['pearlknight'], 2], [['kraken_s', 'reefcrab'], 2], [['squidling', 'pearlknight', 'squidling'], 1]]);
  AE.ENC.ruins = T('ruins', [[['mummy', 'mummy'], 2], [['runeeye', 'scarab'], 2], [['sunlizard', 'mummy'], 2], [['runeeye', 'runeeye'], 1]]);
  AE.ENC.tower_orin = T('citadel', [[['runeeye', 'runeeye'], 2], [['glassgolem'], 2], [['runeeye', 'glassgolem'], 1]]);
  AE.ENC.wreck = T('ship', [[['chorusbot'], 2], [['scarab', 'scarab'], 2], [['chorusbot', 'runeeye'], 1]]);
  AE.ENC.dive = T('lava', [[['flametrooper'], 2], [['flametrooper', 'flametrooper'], 1]]);
  AE.ENC.cinder = T('lava', [[['emberhound', 'salamander'], 3], [['lavaslime', 'lavaslime'], 2], [['flametrooper', 'flametrooper', 'emberhound'], 1], [['salamander', 'salamander'], 1]]);
  // ---------- shops ----------
  AE.SHOPS.pl_shop = { name: 'Chandlery', items: ['hi_potion', 'phoenix_down', 'remedy', 'ether', 'tent', 'cottage', 'smoke_bomb'] };
  AE.SHOPS.sm_shop = { name: 'Oasis Goods', items: ['hi_potion', 'x_potion', 'phoenix_down', 'remedy', 'ether', 'soft', 'cottage'] };
  AE.SHOPS.sm_arms = { name: 'Dune Forge', items: ['storm_brand', 'aurora_staff', 'siege_lance', 'nightshade', 'thunder_rod', 'piston_fist', 'long_rifle', 'crystal_band', 'mage_coat'] };
  AE.SHOPS.sm_prism = { name: 'Mirage Prisms', items: ['prism:water', 'prism:earth', 'prism:toxin', 'prism:gravity', 'prism:barrier', 'prism:absorb_hp', 'prism:counter', 'prism:magic_plus', 'prism:power_plus'] };
  AE.SHOPS.ss_shop = { name: 'Caravan Store', items: ['x_potion', 'phoenix_down', 'remedy', 'turbo_ether', 'cottage', 'soft'] };
  AE.SHOPS.ss_arms = { name: 'Sunsteel', items: ['crystal_saber', 'sage_rod', 'dragoon_pike', 'mist_dirk', 'choir_bell', 'titan_grip', 'hunter_rifle', 'dragon_mail', 'headband'] };
  // ---------- cards ----------
  const C = AE.CARD;
  C('c_crab', 'Reef Crab', 5, [7, 5, 3, 7], { mon: 'GreenOctopus', hue: 330 }, 'water'); C('c_kestra', 'Kestra', 8, [8, 6, 9, 5], { cast: 'sable', hue: 140 });
  C('c_dwarden', 'Drowned Warden', 9, [9, 8, 4, 9], { boss: 'SquidRed', fw: 76, fh: 79, hue: 200 }, 'water'); C('c_colossus', 'Ignis Colossus', 9, [9, 5, 9, 9], { boss: 'TenguRed', fw: 82, fh: 82 }, 'fire');
  C('c_orin', 'Orin', 9, [6, 9, 7, 9], { cast: 'orin' }); C('c_rook', 'Rook', 9, [9, 7, 9, 6], { cast: 'rook' }, 'earth'); C('c_vesna', 'Vesna', 9, [8, 9, 6, 8], { cast: 'vesna' });
  ['reefcrab:c_crab', 'kestra:c_kestra', 'dwarden:c_dwarden', 'colossus:c_colossus'].forEach(function (p) { const q = p.split(':'), X = AE.ENEMIES[q[0]]; X.drop = (X.drop || []).concat([['card:' + q[1], X.boss ? 1 : 0.05]]); });

  // ---------- story ----------
  EV.inn_lark = function () { return AE.inn(150); }; EV.inn_salt = function () { return AE.inn(160); }; EV.inn_sun = function () { return AE.inn(180); };
  EV.a3_ticket = async function () {
    if (AE.has('ship_charter')) { await sayAs('HARBOURMASTER', 'The ferry leaves from the long pier. Show your charter to the deckhand.'); return; }
    await sayAs('HARBOURMASTER', 'Ferry tickets? Aurex has every berth booked. ...Unless you\'d like to work your passage. My manifest says the ferry needs guards. Pirates in the strait.');
    await AE.gain('ship_charter');
  };
  EV.a3_ferry = async function () {
    if (!AE.has('ship_charter')) { await AE.say('The ferry to Saltmere. A deckhand shakes his head: "Charter first. Harbour office."'); return; }
    const r = await AE.ask('Take the ferry to Saltmere?', ['Sail', 'Not yet'], { cancel: 1 }); if (r !== 0) return;
    if (!F().a3_ferry) {
      cs.flag('a3_ferry'); await cs.narrate(['The ferry ploughed east across a grey strait.', 'Halfway over, the sea went still and green, and every fish for a mile floated up dead.']);
      if (inP('lyra')) await s('lyra', 'The Water Crystal. It\'s... it\'s gone quiet. Already. She got there first.');
      await cs.battle(['pirate', 'pirate', 'seagull'], { bg: 'ship', noRun: 1 });
    }
    await cs.warp('saltmere', 26, 9, 2);
  };
  EV.a3_ferry_back = async function () { const r = await AE.ask('Ferry back to Port Lark?', ['Sail', 'Stay'], { cancel: 1 }); if (r === 0) await cs.warp('portlark', 26, 14, 2); };
  EV.a3_grotto = async function () {
    cs.music('boss');
    await sayAs('KESTRA', 'Well, well. Little Sable, come home. And with a whole gang of strays.');
    if (inP('sable')) {
      await s('sable', 'Kestra. I need the submersible.');
      await sayAs('KESTRA', 'You ran out on this crew with a sack of our gold and a three-day head start. And now you NEED.');
      await s('sable', 'I ran to Halcyon to find someone. I found him. Two of him, sort of. It\'s complicated.');
    }
    await sayAs('KESTRA', 'Grotto law. Beat me, take what you want. Lose, and you scrub barnacles for a year.');
    await cs.battle(['pirate', 'kestra', 'pirate'], { bg: 'cave', boss: 1, noRun: 1 });
    await sayAs('KESTRA', 'Ha! Still fast. Fine. The sub\'s in the west cove. Don\'t scratch her. And Sable... the Owner of the Spire was asking after you. Sweetly.');
    cs.flag('a3_grotto'); const q = AE.landNear(156, 124); AE.S_.vehicles.sub = { x: q[0], y: q[1], have: 1 };
    const b = AE.landNear(134, 112); AE.S_.vehicles.boat = { x: b[0], y: b[1], have: 1 };
    await AE.notice('The submersible and a sailing boat are yours.');
    await AE.say('Sail the boat across shallow seas; dive the submersible over deep water and press OK above the reef to enter the Coral Sanctum (far south).', { name: 'TIP' });
  };
  EV.a3_warden = async function () {
    cs.music('final');
    await AE.say('In the Heart of the Sea, the Water Crystal is gone. In its socket sleeps something vast: a crown of coral on a body of black water and old iron.');
    if (inP('lyra')) await s('lyra', 'It\'s dreaming. It\'s... it\'s dreaming about the sky breaking.');
    await sayAs('THE DROWNED WARDEN', 'THE ANCHOR IS TAKEN. WHEN THE FOURTH FALLS, WE WAKE. WE WILL MEND THE SKY BY BREAKING THE WORLD.');
    await cs.battle(['dwarden'], { bg: 'underwater', boss: 1, noRun: 1 });
    cs.flag('a3_coral');
    if (inP('lyra')) await s('lyra', 'A Sky Warden. One of the old guardians. Kael... if there\'s one, there are others. And when the last Crystal goes, they all wake up.');
    await AE.gain('prism:marrowtide');
    await AE.say('Marrowtide, the Echo of the drowned sea, answers to the Chorus song.');
  };
  EV.a3_sunscar = async function () { cs.flag('a3_sunscar'); await AE.say('Sunscar. Mud-brick houses, a deep blue well, and the bones of something huge buried in the dunes to the east.'); };
  EV.a3_mural = async function (e) {
    const M = ['A mural: robed singers standing in a ring around a crystal. Above them, islands float on lines of light.', 'A mural: the singers raising a great hall into the sky. THE CITADEL, the inscription reads. WHERE THE SONG IS SUNG.',
      'A mural: a black shape like a hole in the paint, swallowing the singers one by one. The paint around it is scratched away by many hands.', 'A mural: the last singers sealing the black shape in a crater. They are smaller now. Their mouths are closed.'];
    await AE.say(M[(e && e.n) || 0]);
  };
  EV.a3_ruins = async function () {
    cs.flag('a3_ruins');
    await AE.say('At the heart of the ruins a single word is cut in the floor, over and over, in a language older than any you know. Lyra reads it anyway.');
    if (inP('lyra')) { await s('lyra', '"NYXAR." It means... "the one who forgets". No. "The one who MAKES you forget."'); await s('kael', 'Orin\'s Tower is east of here. If anyone can read this, he can.'); }
  };
  EV.a3_orinlock = async function (e) { const n = (e && e.n) || 0; if (F()['orin_lock' + n]) { await AE.say('The orb glows steadily.'); return; } AE.Sfx.play('echo'); cs.flag('orin_lock' + n); await AE.say('The orb brightens at your touch. Somewhere on this floor, a crystal seal dissolves.'); };
  EV.a3_orin = async function () {
    cs.flag('a3_orin'); cs.music('mystic');
    cs.spawn('orin', 'orin', AE.field().player.x, AE.field().player.y - 3, 2);
    await sayAs('ORIN', 'Six floors of locks, and you walked through them like a summer garden. Either you are clever or you are stubborn. I hope stubborn. Clever is overrated.');
    await sayAs('ORIN', 'Orin Thale. I was a scholar of the Crystals once. I had a student. The brightest mind I ever met. Vesper Lune.');
    await sayAs('ORIN', 'I taught her about the Chorus, who sang the world awake. About the Sky Citadel, their throne. And about the thing they sealed in the Crater: Nyxar, the Hollow Echo.');
    await sayAs('ORIN', 'Nyxar is not a beast. It is a memory. The memory of the first calamity, the first loss. It wants to be the only memory left. It whispers to the clever, and the grieving.');
    await sayAs('ORIN', 'Vesper was both. I gave her the keys and she found the lock. Seven years I have hidden in this tower from what I taught her.');
    await s('kael', 'Then stop hiding.');
    await sayAs('ORIN', '...Yes. I suppose that is overdue. Let an old man walk with you. I know where the next Crystal lies, and I know what wakes when the fourth one dies.');
    cs.remove('orin'); await cs.join('orin');
    await sayAs('ORIN', 'East of here, Dunewreck: a Chorus airship buried in the sand. If its engine still lives, you could fly. You will need to fly, soon.');
  };
  EV.a3_rook = async function () {
    cs.music('mystic');
    await AE.say('In the wreck\'s engine room, a man-shaped machine sits slumped against the core, covered in seven years of sand.');
    await AE.say('Its eyes open. They are the same grey as Kael\'s.');
    await sayAs('ROOK', 'Memory trace... recognised. Kael. Kael Ardent. You are... alive? No. Recalculating.');
    await sayAs('ROOK', 'I am Rook. Chorus construct, archive class. Seven years ago a boy died in Thornbrook, and the Aetherflow carried his last memories here, to me. I have been keeping them.');
    await s('kael', 'His memories. My memories.');
    await sayAs('ROOK', 'Not yours. His. You have a copy. I have the end of it, the part the copy never got. Will you see it?');
    const r = await AE.ask('Dive into the real Kael Ardent\'s last memory?', ['Dive', 'Not yet'], { cancel: 1 }); if (r !== 0) return;
    cs.flag('a3_rook'); await cs.join('rook');
    AE.S_.diveParty = AE.S_.party.slice(); AE.S_.diveReserve = AE.S_.reserve.slice(); AE.S_.party = ['kael']; AE.S_.reserve = [];
    AE.S_.flags.diving = 1; AE.game.flash = 30;
    await cs.narrate(['The world goes white.', 'Thornbrook. Seven years ago. Night.', 'You are Kael Ardent, warden-in-training, twelve years old, and the sky is on fire.']);
    await cs.warp('mem_thornbrook', 24, 36, 0);
  };
  EV.a3_dive1 = async function () {
    cs.flag('dive1');
    await sayAs('KAEL (12)', 'The mill\'s burning... the green... Mother Ilse! The Lantern House is up the hill!');
    await sayAs('VILLAGER', 'Soldiers! Aurex soldiers, setting the fires! Run, boy!');
  };
  EV.a3_dive2 = async function () {
    cs.flag('dive2');
    cs.spawn('ybram', 'bram', 24, 19, 2); cs.spawn('yharl', 'gunner', 27, 19, 3);
    await sayAs('CAPTAIN HOLLIS', 'Orders are orders, Mercer. Quarantine. Whatever got loose in that orphanage, it can\'t be allowed out of the village.');
    await sayAs('MERCER', 'Those are CHILDREN, Captain! I won\'t! I won\'t do it!');
    await sayAs('CAPTAIN HOLLIS', '...Then go. Walk away, and don\'t look back. I\'ll carry this one myself.');
    await sayAs('KAEL (12)', 'Hey! HEY! There are kids in there!');
    await sayAs('CAPTAIN HOLLIS', 'Get that boy out of here!');
    await cs.battle(['flametrooper', 'flametrooper'], { bg: 'lava', noRun: 1 });
    cs.remove('ybram'); cs.remove('yharl');
  };
  EV.a3_dive3 = async function () {
    cs.flag('dive3'); cs.music('revelation');
    cs.spawn('yvesp', 'vesper', 24, 8, 2);
    await AE.say('At the Lantern House door stands a girl of sixteen with silver hair, holding a crystal that shines too brightly to look at.');
    await sayAs('VESPER (16)', 'It\'s all right, Kael. It\'s just a test. The voice said it would make everyone remember forever. Nobody would ever be lost again.');
    await sayAs('VESPER (16)', 'One, two, three... why is it so hot? Why is it SCREAMING?');
    await sayAs('KAEL (12)', 'Vesper, put it down! Everyone out! Mother Ilse, take the little ones! Out the back!');
    AE.game.flash = 30; await cs.shake(40);
    await cs.narrate(['The crystal broke.', 'The real Kael Ardent carried nine children out of the Lantern House, and went back for the tenth.', 'He did not come out again.',
      'Vesper Lune walked out of the fire with her hands burned to the wrist, and a voice in her head that said: you can fix this. You can bring him back.', 'Seven tries.']);
    AE.S_.party = AE.S_.diveParty; AE.S_.reserve = AE.S_.diveReserve; delete AE.S_.flags.diving; cs.flag('a3_dive');
    await cs.warp('dunewreck', AE.MAPS.dunewreck.entry[0], AE.MAPS.dunewreck.entry[1], 2);
    await s('kael', '...He went back for the tenth.');
    if (inP('lyra')) await s('lyra', 'And you\'re the boy who keeps going back. Kael. That part\'s yours. Nobody gave you that.');
    if (inP('bram')) await s('bram', 'I was there. I gave the order. And a boy walked into my fire for children I\'d written off. ...I have carried his face for seven years. And then it walked into my Reactor 4 job.');
    await sayAs('ROOK', 'Memory transfer complete. I will come with you. The boy would have wanted to see how it ends. And here: the Aether Engine Core. The ship\'s heart. Take it.');
    await AE.gain('engine_core');
    await sayAs('ROOK', 'Install it in an airframe and you will fly. There is one: an Aurex prototype at Mount Cinder\'s foot, the Skylark. Aurex left it when the Fire Crystal began to fail.');
  };
  EV.a3_drago3 = async function () {
    cs.flag('a3_drago3');
    await sayAs('DRAGO', 'Warden. Or should I say... what should I say? I saw the Cradle files. I know about the fire.');
    await sayAs('DRAGO', 'I was a boy in Halcyon when they told us Thornbrook was a plague. I joined Aurex to keep that from ever happening again. Funny, isn\'t it?');
    await cs.battle(['flametrooper', 'drago3', 'flametrooper'], { bg: 'lava', boss: 1, noRun: 1 });
    await sayAs('DRAGO', 'Ugh... Go on. She\'s at the top. And Warden: when she takes the Fire Shard, she\'ll have three. Don\'t give her the fourth. Whatever she does to you.');
  };
  EV.a3_colossus = async function () {
    cs.music('boss');
    await AE.say('The Fire Crystal burns in a lake of magma. Something made of the mountain\'s own stone rises from it, cracks glowing like a forge.');
    await cs.battle(['colossus'], { bg: 'lava', boss: 1, noRun: 1 });
    cs.flag('a3_colossus'); cs.music('revelation');
    cs.spawn('vesper', 'vesper', AE.field().player.x, AE.field().player.y - 4, 2);
    await sayAs('VESPER', 'Thank you, all of you. You do the hard part so beautifully. The Fire Shard, please, Kael.');
    await s('kael', 'No.');
    await sayAs('VESPER', '...No? Oh, bright boy. You saw the memory, didn\'t you. The fire. You think you understand me now.');
    await sayAs('VESPER', 'I don\'t need you to carry this one. I only needed you to break the guardian.');
    await AE.say('The shard lifts from the dead crystal and floats to her hand.');
    await sayAs('VESPER', 'Three. One more, in the north, under the roots of the world. Come to the Deeproot when you\'re ready, Kael. You always come.');
    cs.remove('vesper');
    if (inP('orin')) await sayAs('ORIN', 'Vesper! VESPER! ...She didn\'t even look at me.');
    await AE.game.fadeOut(0.04);
    await cs.narrate(['At the foot of Mount Cinder, in an abandoned Aurex hangar, the party found the Skylark.', 'Rook fitted the Engine Core into her heart. She shook, coughed smoke, and flew.']);
    await cs.title('END OF ACT III', 'SOLMARA', 180);
    cs.flag('a3_done'); cs.chapter(4);
    const q = AE.landNear(212, 146); AE.S_.vehicles.airship = { x: q[0], y: q[1], have: 1 };
    AE.toWorld(q[0], q[1] + 1);
    await AE.say('The Skylark is yours: board it on the world map and fly anywhere. The Earth Crystal lies north, in Nordheim. Frostgate is the gateway.', { name: 'TIP' });
  };
  // Vesna (optional): the sharpshooter in Sunscar
  EV.a3_vesna = async function () {
    if (F().vesna_joined) return;
    await sayAs('VESNA', 'Vesna Korr. You\'re the ones Vesper keeps not killing. That makes you interesting.');
    await sayAs('VESNA', 'I built Project Cradle with her. The Vessels. I walked out when the first ones died in their tanks. I should have burned the lab on my way out.');
    await sayAs('VESNA', 'I\'m going to finish what we started. The ending, I mean. Want a gun?');
    const r = await AE.ask('Let Vesna join?', ['Welcome aboard', 'Not now'], { cancel: 1 }); if (r !== 0) return;
    cs.flag('vesna_joined'); cs.remove('vesna'); await cs.join('vesna');
  };
})();
