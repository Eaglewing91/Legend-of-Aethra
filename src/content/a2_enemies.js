/* ================= Act II enemies, bosses, encounter tables and shops (Meridia) ================= */
(function () {
  const E = AE.E, K = AE.K;
  K('thorn_lash', { name: 'Thorn Lash', kind: 'phys', power: 1.3, hits: 2, fx: 'claw' });
  K('pollen', { name: 'Pollen Cloud', kind: 'mag', power: 3, status: ['sleep', 'blind'], hit: 35, all: 1, fx: 'poison' });
  K('root_bind', { name: 'Root Bind', kind: 'phys', power: 1.2, status: ['slow'], hit: 40, fx: 'quake' });
  K('sap_mend', { name: 'Sap', kind: 'heal', power: 22, target: 'self', fx: 'heal' });
  K('peck', { name: 'Peck Flurry', kind: 'phys', power: 0.6, hits: 3, fx: 'bite' });
  K('mist_breath', { name: 'Mist Breath', kind: 'mag', power: 5, elem: 'water', all: 1, fx: 'water' });
  K('earth_spike', { name: 'Stone Spike', kind: 'mag', power: 6, elem: 'earth', fx: 'quake' });
  K('burrow_bite', { name: 'Burrow', kind: 'phys', power: 1.7, fx: 'quake' });
  K('cave_in', { name: 'Cave-In', kind: 'mag', power: 7, elem: 'earth', all: 1, fx: 'quake' });
  K('sand_blast', { name: 'Sand Blast', kind: 'mag', power: 5, elem: 'earth', status: ['blind'], hit: 40, all: 1, fx: 'quake' });
  K('sting', { name: 'Sting', kind: 'phys', power: 1.4, status: ['poison'], hit: 50, fx: 'bite' });
  K('shiv', { name: 'Shiv', kind: 'phys', power: 1.5, crit: 1, fx: 'cut' });
  K('bone_rattle', { name: 'Bone Rattle', kind: 'mag', power: 5, elem: 'dark', status: ['confuse'], hit: 25, fx: 'dark' });
  K('drain_touch', { name: 'Grave Touch', kind: 'drain', power: 6, elem: 'dark', fx: 'dark' });
  K('gale', { name: 'Gale', kind: 'mag', power: 7, elem: 'wind', all: 1, fx: 'wind' });
  K('wind_blade', { name: 'Wind Blade', kind: 'mag', power: 9, elem: 'wind', fx: 'wind' });
  K('drill', { name: 'Drill Arm', kind: 'phys', power: 1.8, pierce: 1, fx: 'boom' });
  // bosses
  K('tm_crush', { name: 'Elder Crush', kind: 'phys', power: 2.0, fx: 'quake' });
  K('tm_spores', { name: 'Choking Spores', kind: 'mag', power: 4, status: ['poison', 'silence'], hit: 45, all: 1, fx: 'poison' });
  K('harl_burst', { name: 'Burst Fire', kind: 'phys', power: 0.7, hits: 4, fx: 'shot', sure: 1 });
  K('harl_snipe', { name: 'Gun-Arm Snipe', kind: 'phys', power: 2.4, fx: 'shot', sure: 1, pierce: 1 });
  K('harl_grenade', { name: 'Incendiary', kind: 'mag', power: 7, elem: 'fire', all: 1, fx: 'boom' });
  K('mk_dig', { name: 'Tunnel Strike', kind: 'phys', power: 2.1, fx: 'quake' });
  K('mk_quake', { name: 'Collapse', kind: 'mag', power: 9, elem: 'earth', all: 1, fx: 'quake' });
  K('lich_doom', { name: 'Toll of Graves', kind: 'mag', power: 2, status: ['doom'], hit: 30, fx: 'dark' });
  K('lich_bolt', { name: 'Ghostfire', kind: 'mag', power: 9, elem: 'dark', all: 1, fx: 'dark' });
  K('lich_raise', { name: 'Dark Mend', kind: 'heal', power: 30, target: 'self', fx: 'dark' });
  K('dv2_lunge', { name: 'Venn Lunge', kind: 'phys', power: 2.1, pierce: 1, fx: 'slash' });
  K('dv2_storm', { name: 'Halberd Storm', kind: 'phys', power: 0.55, hits: 4, fx: 'slash' });
  K('te_vortex', { name: 'Vortex Intake', kind: 'mag', power: 11, elem: 'wind', all: 1, fx: 'wind' });
  K('te_siphon', { name: 'Crystal Siphon', kind: 'drainmp', power: 30, all: 1, fx: 'spark' });
  K('te_piston', { name: 'Piston Hammer', kind: 'phys', power: 2.2, fx: 'boom' });
  K('te_overheat', { name: 'Overheat', kind: 'mag', power: 15, elem: 'fire', all: 1, fx: 'boom' });

  // ---------- the Ashfields and Meridia (world) ----------
  E('ashhound', 'Ash Hound', 16, 520, 48, 24, 10, 16, 32, 150, 11, 90, { mon: 'Beast', hue: 330, bright: 0.8 }, { weak: ['water'], ai: [[3, 'attack'], [1, 'frenzy']] });
  E('cinderling', 'Cinderling', 17, 430, 30, 20, 40, 30, 22, 160, 12, 80, { mon: 'Flam' }, { absorb: ['fire'], weak: ['water', 'ice'], ai: [[1, 'attack'], [3, 'fire_spell']] });
  E('scavenger', 'Scavenger Bird', 16, 460, 44, 20, 12, 18, 34, 148, 11, 110, { mon: 'Owl', hue: 20 }, { weak: ['bolt'], float: 1, ai: [[2, 'attack'], [2, 'peck']] });
  E('fieldmole', 'Field Mole', 18, 640, 52, 30, 10, 18, 18, 176, 12, 100, { mon: 'Mole' }, { weak: ['water'], ai: [[3, 'attack'], [1, 'burrow_bite']], drop: [['greens', 0.2]] });
  E('meadowbee', 'Meadow Wasp', 19, 500, 50, 22, 18, 20, 36, 184, 13, 90, { mon: 'Butterfly', hue: 40 }, { weak: ['wind', 'fire'], float: 1, ai: [[2, 'attack'], [2, 'sting']] });
  E('roadbandit', 'Road Bandit', 20, 720, 56, 30, 14, 22, 28, 210, 14, 260, { cast: 'marlo', hue: 60 }, { ai: [[3, 'attack'], [1, 'shiv'], [1, 'pilfer']], steal: [['hi_potion', 0.5]] });
  E('thornboar', 'Thornback', 21, 900, 60, 36, 10, 20, 22, 230, 15, 140, { mon: 'Panda', hue: 100 }, { weak: ['fire'], ai: [[3, 'attack'], [1, 'thorn_lash']] });
  // ---------- Mistwood ----------
  E('mistsprite', 'Mist Sprite', 19, 480, 30, 24, 46, 40, 30, 190, 14, 80, { mon: 'Spirit2', hue: 120 }, { weak: ['fire'], absorb: ['water'], float: 1, ai: [[1, 'attack'], [2, 'mist_breath'], [1, 'pollen']] });
  E('bloomtrap', 'Bloomtrap', 20, 760, 54, 32, 30, 24, 14, 210, 15, 90, { mon: 'Mushroom', hue: 300 }, { weak: ['fire'], ai: [[2, 'attack'], [1, 'pollen'], [1, 'root_bind']], steal: [['echo_screen', 1]] });
  E('mossbear', 'Moss Bear', 21, 1100, 64, 34, 10, 20, 20, 240, 16, 120, { mon: 'Bear', hue: 90 }, { weak: ['fire'], ai: [[3, 'attack'], [1, 'maul']] });
  E('wildtalon', 'Wild Talonbird', 20, 620, 56, 26, 14, 20, 40, 220, 15, 60, { mon: 'Owl2', hue: 60 }, { weak: ['bolt'], ai: [[2, 'attack'], [2, 'peck']], steal: [['greens', 1]] });
  E('fogsnake', 'Fog Viper', 20, 640, 58, 26, 20, 20, 30, 216, 15, 90, { mon: 'Snake3' }, { weak: ['ice'], ai: [[2, 'attack'], [2, 'sting']] });
  E('thornmaw', 'Thornmaw', 24, 12500, 70, 40, 44, 34, 22, 4400, 140, 2400, { boss: 'GiantBamboo', anim: 'Idle', fw: 62, fh: 62, k: 1.9, hue: 60 },
    { boss: 1, weak: ['fire'], absorb: ['earth'], ai: 'thornmaw', steal: [['prism:added', 0.3], ['x_potion', 1]] });
  AE.AI.thornmaw = function (f, B) {
    const v = f.ai.vars; v.t = (v.t || 0) + 1;
    if (f.hp < f.maxhp * 0.35 && !v.sap) { v.sap = 1; return AE.mkAct(f, B, 'sap_mend'); }
    if (v.t % 4 === 0) return AE.mkAct(f, B, 'tm_spores');
    return AE.mkAct(f, B, ['attack', 'tm_crush', 'thorn_lash', 'root_bind'][AE.rand(4)]);
  };
  // ---------- the mesa, Spire Prison ----------
  E('sandworm', 'Mesa Burrower', 22, 1000, 62, 34, 20, 22, 20, 260, 17, 160, { mon: 'Larva', k: 2.6, hue: 30 }, { weak: ['water', 'ice'], ai: [[2, 'attack'], [1, 'sand_blast'], [1, 'burrow_bite']] });
  E('scorpid', 'Dune Scorpid', 22, 820, 64, 40, 10, 18, 26, 250, 17, 150, { mon: 'SpiderRed', hue: 30 }, { weak: ['water'], ai: [[2, 'attack'], [2, 'sting']] });
  E('convict', 'Pit Convict', 22, 900, 62, 30, 14, 20, 26, 260, 17, 200, { cast: 'pip', hue: 180 }, { ai: [[3, 'attack'], [2, 'shiv']], steal: [['hi_potion', 0.5]] });
  E('pitdog', 'Pit Dog', 21, 700, 60, 26, 8, 16, 36, 240, 16, 100, { mon: 'Beast', hue: 40 }, { ai: [[3, 'attack'], [1, 'frenzy']] });
  E('harl', 'Harl Mercer', 26, 15000, 74, 40, 30, 32, 30, 5200, 160, 3000, { cast: 'gunner', k: 1.5, hue: 300 },
    { boss: 1, ai: 'harl', steal: [['prism:long_range', 0.3], ['hero_tonic', 1]], drop: [['card:c_harl', 1]] });
  AE.AI.harl = function (f, B) {
    const v = f.ai.vars; v.t = (v.t || 0) + 1;
    if (v.t % 4 === 0) return AE.mkAct(f, B, 'harl_grenade');
    if (f.hp < f.maxhp * 0.5 && v.t % 3 === 0) return AE.mkAct(f, B, 'harl_snipe');
    return AE.mkAct(f, B, Math.random() < 0.5 ? 'harl_burst' : 'attack');
  };
  // ---------- the Old Mine ----------
  E('minemole', 'Shaft Mole', 22, 980, 66, 40, 10, 20, 20, 270, 18, 140, { mon: 'Mole2' }, { weak: ['water'], ai: [[3, 'attack'], [1, 'burrow_bite']] });
  E('rockbiter', 'Rockbiter', 23, 1200, 70, 56, 10, 20, 14, 290, 19, 160, { mon: 'Cyclope', k: 2.4, hue: 30 }, { weak: ['water', 'bolt'], ai: [[3, 'attack'], [1, 'smash']] });
  E('glowbat', 'Glow Bat', 21, 640, 56, 24, 30, 26, 38, 250, 17, 90, { mon: 'YellowsBat' }, { weak: ['wind'], float: 1, ai: [[2, 'attack'], [1, 'flare_beam'], [1, 'drain_touch']] });
  E('oreslime', 'Ore Slime', 22, 860, 50, 60, 30, 10, 12, 260, 18, 300, { mon: 'Slime4' }, { weak: ['fire', 'bolt'], ai: [[2, 'attack'], [1, 'earth_spike']], steal: [['power_source', 0.02]] });
  E('moleking', 'Mole King', 28, 17000, 78, 46, 34, 30, 22, 6200, 180, 3600, { boss: 'GiantRacoon', anim: 'Idle', fw: 60, fh: 60, k: 1.8, hue: 230, bright: 0.85 },
    { boss: 1, weak: ['water'], absorb: ['earth'], ai: [[3, 'attack'], [2, 'mk_dig'], [1, 'mk_quake']], steal: [['prism:earth', 0.4], ['guard_source', 1]] });
  // ---------- Windhaven: catacombs and the Wind Shrine ----------
  E('bonewalker', 'Bonewalker', 24, 1100, 70, 38, 20, 30, 22, 300, 20, 170, { mon: 'Skull' }, { undead: 1, weak: ['holy', 'fire'], ai: [[3, 'attack'], [1, 'bone_rattle']] });
  E('shade', 'Catacomb Shade', 24, 900, 40, 30, 54, 48, 28, 310, 21, 120, { mon: 'Spirit', hue: 250, bright: 0.7 }, { undead: 1, weak: ['holy'], absorb: ['dark'], float: 1, ai: [[1, 'attack'], [2, 'drain_touch'], [1, 'void_touch']] });
  E('urnsnake', 'Urn Serpent', 24, 980, 70, 34, 20, 24, 30, 304, 20, 180, { mon: 'Snake4' }, { weak: ['ice'], ai: [[2, 'attack'], [2, 'sting']] });
  E('lich', 'Ossuary Warden', 28, 16000, 50, 40, 64, 50, 26, 6000, 180, 3000, { boss: 'GiantFlam', anim: 'Idle', fw: 50, fh: 50, k: 2, hue: 220, bright: 0.8 },
    { boss: 1, undead: 1, weak: ['holy', 'fire'], absorb: ['dark'], ai: 'lich', steal: [['prism:seal', 0.3], ['x_potion', 1]] });
  AE.AI.lich = function (f, B) {
    const v = f.ai.vars; v.t = (v.t || 0) + 1;
    if (v.t % 5 === 1) return AE.mkAct(f, B, 'lich_doom');
    if (f.hp < f.maxhp * 0.3 && !v.mend) { v.mend = 1; return AE.mkAct(f, B, 'lich_raise'); }
    return AE.mkAct(f, B, Math.random() < 0.55 ? 'lich_bolt' : 'drain_touch');
  };
  E('galeimp', 'Gale Imp', 25, 900, 60, 30, 50, 40, 40, 320, 22, 160, { mon: 'KappaGreen' }, { absorb: ['wind'], weak: ['earth'], ai: [[1, 'attack'], [2, 'wind_blade'], [1, 'gale']] });
  E('shrinegolem', 'Shrine Guardian', 26, 1600, 76, 60, 20, 40, 16, 360, 24, 200, { mon: 'Cyclope2', k: 2.6, sat: 0.4, bright: 1.2 }, { weak: ['bolt'], ai: [[3, 'attack'], [1, 'smash']] });
  E('drillbot', 'Aurex Drill Unit', 25, 1200, 74, 50, 20, 24, 20, 330, 22, 260, { mon: 'Eye2', k: 2.4, hue: 10 }, { weak: ['bolt', 'water'], ai: [[2, 'attack'], [2, 'drill']] });
  E('windtrooper', 'Aurex Windtrooper', 25, 1000, 70, 40, 24, 30, 30, 320, 22, 300, { cast: 'trooper', hue: 160 }, { ai: [[3, 'attack'], [1, 'grenade_toss'], [1, 'rifle_shot']], steal: [['hi_potion', 0.6]] });
  E('drago2', 'Captain Drago Venn', 27, 16000, 82, 46, 36, 38, 32, 6400, 180, 4000, { cast: 'drago', k: 1.4 },
    { boss: 1, ai: 'drago2', steal: [['prism:quick', 0.25], ['speed_source', 1]] });
  AE.AI.drago2 = function (f, B) {
    const v = f.ai.vars; v.t = (v.t || 0) + 1;
    if (v.t === 1) return AE.mkAct(f, B, 'dv_order');
    if (v.t % 4 === 0) return AE.mkAct(f, B, 'dv2_storm');
    return AE.mkAct(f, B, Math.random() < 0.5 ? 'dv2_lunge' : 'attack');
  };
  E('tempest', 'Tempest Engine', 30, 24000, 84, 52, 56, 40, 24, 9000, 240, 5000, { boss: 'TenguBlue', anim: 'Idle', fw: 68, fh: 68, k: 1.7, sat: 0.35, bright: 0.9 },
    { boss: 1, weak: ['bolt', 'water'], absorb: ['wind'], ai: 'tempest', steal: [['prism:speed_plus', 0.3], ['x_potion', 1]] });
  AE.AI.tempest = function (f, B) {
    const v = f.ai.vars; v.t = (v.t || 0) + 1;
    if (f.hp < f.maxhp * 0.5 && !v.hot) { v.hot = 1; B.say('Tempest Engine: PRESSURE CRITICAL', 80); }
    if (v.hot && v.t % 3 === 0) return AE.mkAct(f, B, 'te_overheat');
    if (v.t % 4 === 0) return AE.mkAct(f, B, 'te_vortex');
    if (v.t % 5 === 2) return AE.mkAct(f, B, 'te_siphon');
    return AE.mkAct(f, B, Math.random() < 0.5 ? 'te_piston' : 'attack');
  };

  // ---------- encounter tables ----------
  const T = function (bg, sets) { return { bg: bg, sets: sets.map(function (s) { return { enemies: s[0], w: s[1] || 1 }; }) }; };
  AE.ENC.w_ashfields = T('plains', [[['ashhound', 'ashhound'], 3], [['cinderling', 'scavenger'], 2], [['ashhound', 'cinderling', 'scavenger'], 1], [['scavenger', 'scavenger', 'scavenger'], 1]]);
  AE.ENC.w_meridia_n = T('grass', [[['fieldmole', 'meadowbee'], 3], [['roadbandit', 'roadbandit'], 2], [['wildtalon'], 2], [['meadowbee', 'meadowbee', 'meadowbee'], 1], [['thornboar'], 2]]);
  AE.ENC.w_meridia_n_forest = T('forest', [[['thornboar', 'fogsnake'], 2], [['mossbear'], 2], [['meadowbee', 'fogsnake'], 2]]);
  AE.ENC.w_meridia_s = T('grass', [[['fieldmole', 'roadbandit'], 2], [['thornboar', 'meadowbee'], 2], [['wildtalon', 'wildtalon'], 1]]);
  AE.ENC.w_mesa = T('desert', [[['sandworm'], 2], [['scorpid', 'scorpid'], 3], [['sandworm', 'scorpid'], 1]]);
  AE.ENC.mistwood = T('forest', [[['mistsprite', 'mistsprite'], 3], [['bloomtrap', 'fogsnake'], 2], [['mossbear'], 2], [['wildtalon', 'mistsprite'], 1], [['bloomtrap', 'bloomtrap', 'mistsprite'], 1]]);
  AE.ENC.prison = T('desert', [[['convict', 'convict'], 3], [['pitdog', 'pitdog', 'convict'], 2], [['scorpid', 'sandworm'], 1]]);
  AE.ENC.mine = T('cave', [[['minemole', 'glowbat'], 3], [['rockbiter'], 2], [['oreslime', 'oreslime'], 1], [['glowbat', 'glowbat', 'minemole'], 2]]);
  AE.ENC.catacombs = T('temple', [[['bonewalker', 'bonewalker'], 3], [['shade', 'urnsnake'], 2], [['shade', 'shade', 'bonewalker'], 1]]);
  AE.ENC.shrine = T('temple', [[['galeimp', 'galeimp'], 2], [['shrinegolem'], 2], [['drillbot', 'windtrooper'], 3], [['windtrooper', 'windtrooper', 'galeimp'], 1]]);
  AE.ENC.arena = T('ruins', [[['roadbandit', 'roadbandit', 'roadbandit']], [['mossbear', 'thornboar']], [['rockbiter', 'oreslime']], [['shrinegolem']], [['convict', 'convict', 'pitdog']]]);

  // ---------- Arcana cards for Meridia ----------
  const C = AE.CARD, m = function (k, o) { return Object.assign({ mon: k }, o || {}); };
  C('c_ashhound', 'Ash Hound', 3, [6, 5, 2, 4], m('Beast', { hue: 330 }), 'fire');
  C('c_mole', 'Field Mole', 3, [3, 7, 5, 2], m('Mole'), 'earth');
  C('c_wasp', 'Meadow Wasp', 3, [5, 2, 3, 7], m('Butterfly', { hue: 40 }), 'poison');
  C('c_mistsprite', 'Mist Sprite', 4, [3, 7, 4, 6], m('Spirit2', { hue: 120 }), 'water');
  C('c_mossbear', 'Moss Bear', 4, [7, 3, 7, 3], m('Bear', { hue: 90 }), 'earth');
  C('c_talon', 'Wild Talonbird', 4, [6, 6, 4, 4], m('Owl2', { hue: 60 }), 'wind');
  C('c_scorpid', 'Dune Scorpid', 5, [7, 2, 6, 7], m('SpiderRed', { hue: 30 }), 'poison');
  C('c_rockbiter', 'Rockbiter', 5, [5, 7, 7, 3], m('Cyclope', { hue: 30 }), 'earth');
  C('c_shade', 'Catacomb Shade', 5, [7, 6, 3, 6], m('Spirit', { hue: 250 }), 'dark');
  C('c_galeimp', 'Gale Imp', 5, [4, 6, 7, 5], m('KappaGreen'), 'wind');
  C('c_thornmaw', 'Thornmaw', 6, [8, 4, 6, 7], { boss: 'GiantBamboo', fw: 62, fh: 62, hue: 60 }, 'earth');
  C('c_harl', 'Harl Mercer', 7, [7, 8, 3, 8], { cast: 'gunner', hue: 300 }, 'fire');
  C('c_moleking', 'Mole King', 7, [8, 7, 7, 4], { boss: 'GiantRacoon', fw: 60, fh: 60, hue: 230 }, 'earth');
  C('c_lich', 'Ossuary Warden', 7, [5, 8, 8, 5], { boss: 'GiantFlam', fw: 50, fh: 50, hue: 220 }, 'dark');
  C('c_tempest', 'Tempest Engine', 8, [9, 6, 8, 6], { boss: 'TenguBlue', fw: 68, fh: 68, sat: 0.35 }, 'wind');
  C('c_ilse', 'Mother Ilse', 8, [4, 9, 9, 6], { cast: 'ilse' }, 'holy');
  C('c_sylphine', 'Sylphine', 9, [9, 9, 5, 8], { mon: 'Butterfly', hue: 120 }, 'wind');
  const Dd = { ashhound: 'c_ashhound', fieldmole: 'c_mole', meadowbee: 'c_wasp', mistsprite: 'c_mistsprite', mossbear: 'c_mossbear', wildtalon: 'c_talon', scorpid: 'c_scorpid',
    rockbiter: 'c_rockbiter', shade: 'c_shade', galeimp: 'c_galeimp', thornmaw: 'c_thornmaw', moleking: 'c_moleking', lich: 'c_lich', tempest: 'c_tempest' };
  Object.keys(Dd).forEach(function (e) { const X = AE.ENEMIES[e]; X.drop = (X.drop || []).concat([['card:' + Dd[e], X.boss ? 1 : 0.05]]); });
  Object.assign(AE.ARCANA_FOES, {
    orphan: { name: 'ORPHAN', deck: ['c_rat', 'c_bat', 'c_talon', 'c_mole', 'c_wasp', 'c_slime'], rules: [], wit: 0.4, hi: 'Mother Ilse taught me Arcana! I\'m very good. I\'m the best in the house.', lose: 'You didn\'t cheat? Swear on your coat?' },
    spire: { name: 'CARD PLAYER', deck: ['c_mistsprite', 'c_mossbear', 'c_ashhound', 'c_scorpid', 'c_rockbiter', 'c_wasp'], rules: ['same'], wit: 0.7, hi: 'The Spire plays Same. You knew that, right?', lose: 'Hm. You\'ve played before.' },
    master: { name: 'ARCANA MASTER', deck: ['c_shade', 'c_galeimp', 'c_thornmaw', 'c_harl', 'c_moleking', 'c_rockbiter', 'c_ilse'], rules: ['same', 'elemental'], wit: 1, hi: 'I am the Master of the Arcana Hall. Every rule, every trick. Shall we?', lose: 'A new master walks the Spire. Remarkable.' },
    duchess: { name: 'DUCHESS', deck: ['c_bulwark', 'c_leviathan', 'c_gorr', 'c_talon', 'c_scorpid', 'c_mossbear'], rules: ['elemental'], wit: 0.8, hi: 'I collect monsters, darling. On cards. The real ones smell.', lose: 'How tiresome. Take your card.' },
    monk: { name: 'MONK', deck: ['c_failed', 'c_shade', 'c_mistsprite', 'c_wisp', 'c_h0', 'c_galeimp'], rules: ['same'], wit: 0.85, hi: 'Every card is a memory. Shall we trade some?', lose: 'The flow gives, and the flow takes.' }
  });

  // ---------- shops ----------
  AE.SHOPS.th_items = { name: 'Thornbrook Goods', items: ['potion', 'hi_potion', 'phoenix_down', 'antidote', 'eye_drops', 'echo_screen', 'soft', 'tent', 'greens'] };
  AE.SHOPS.th_arms = { name: 'Ironbark Smithy', items: ['wind_cutter', 'mending_rod', 'breach_lance', 'mythril_knife', 'titan_band', 'mythril_vest', 'silk_robe'] };
  AE.SHOPS.th_prism = { name: 'Wren\'s Prisms', items: ['prism:fire', 'prism:ice', 'prism:bolt', 'prism:aero', 'prism:restore', 'prism:heal', 'prism:barrier', 'prism:all', 'prism:hp_plus', 'prism:steal'] };
  AE.SHOPS.ks_shop = { name: 'Feed & Tack', items: ['greens', 'sweetroot', 'potion', 'hi_potion', 'tent'] };
  AE.SHOPS.wh_items = { name: 'Pilgrim Supplies', items: ['hi_potion', 'phoenix_down', 'remedy', 'ether', 'tent', 'soft', 'smoke_bomb'] };
  AE.SHOPS.wh_arms = { name: 'Windsmith', items: ['dawn_edge', 'lumen_staff', 'volt_lance', 'viper_fang', 'carbon_band', 'mage_coat', 'headband', 'swift_boots'] };
  AE.SHOPS.wh_prism = { name: 'Shrine Prisms', items: ['prism:aero', 'prism:earth', 'prism:revive', 'prism:time', 'prism:mystify', 'prism:elemental', 'prism:added', 'prism:mp_plus', 'prism:cover'] };
})();
