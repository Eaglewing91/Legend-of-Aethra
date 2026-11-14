/* ================= Act I enemies, skills and encounter tables =================
   E(id, name, lv, hp, atk, def, mag, mdef, spd, exp, ap, gold, art, extra) */
(function () {
  const E = AE.E, K = AE.K;
  // ---------- skills ----------
  K('rifle_shot', { name: 'Rifle Shot', kind: 'phys', power: 1.3, fx: 'shot', sure: 1 });
  K('baton', { name: 'Shock Baton', kind: 'phys', power: 1.1, elem: 'bolt', status: ['paralyse'], hit: 12, fx: 'bolt' });
  K('scan_beam', { name: 'Scan Beam', kind: 'mag', power: 9, elem: 'bolt', fx: 'spark' });
  K('flare_beam', { name: 'Flash', kind: 'mag', power: 4, status: ['blind'], hit: 45, fx: 'holy' });
  K('shock_bite', { name: 'Shock Bite', kind: 'phys', power: 1.3, elem: 'bolt', fx: 'bite' });
  K('aether_drip', { name: 'Aether Drip', kind: 'drainmp', power: 12, fx: 'water' });
  K('gnaw', { name: 'Gnaw', kind: 'phys', power: 1.2, fx: 'bite' });
  K('frenzy', { name: 'Frenzy', kind: 'phys', power: 0.7, hits: 2, fx: 'claw' });
  K('toxic_touch', { name: 'Toxic Touch', kind: 'phys', power: 1.0, status: ['poison'], hit: 45, fx: 'poison' });
  K('spit', { name: 'Bile Spit', kind: 'mag', power: 9, elem: 'water', status: ['poison'], hit: 40, fx: 'poison' });
  K('spores', { name: 'Sleep Spores', kind: 'mag', power: 0, status: ['sleep'], hit: 55, all: 1, fx: 'poison' });
  K('coil', { name: 'Constrict', kind: 'phys', power: 1.4, status: ['slow'], hit: 25, fx: 'claw' });
  K('dive', { name: 'Talon Dive', kind: 'phys', power: 1.5, elem: 'wind', fx: 'claw' });
  K('gust', { name: 'Gust', kind: 'mag', power: 11, elem: 'wind', all: 1, fx: 'wind' });
  K('rivet_gun', { name: 'Rivet Gun', kind: 'phys', power: 0.55, hits: 3, fx: 'shot', sure: 1 });
  K('zap', { name: 'Zap', kind: 'mag', power: 13, elem: 'bolt', fx: 'bolt' });
  K('shield_bash', { name: 'Shield Bash', kind: 'phys', power: 1.6, status: ['paralyse'], hit: 15, fx: 'boom' });
  K('pilfer', { name: 'Pilfer', kind: 'special', fx: 'claw' });
  K('fire_spell', { name: 'Fire', kind: 'mag', power: 9, elem: 'fire', fx: 'fire', mp: 4 });
  K('ice_spell', { name: 'Ice', kind: 'mag', power: 9, elem: 'ice', fx: 'ice', mp: 4 });
  K('bolt_spell', { name: 'Bolt', kind: 'mag', power: 9, elem: 'bolt', fx: 'bolt', mp: 4 });
  K('cure_spell', { name: 'Cure', kind: 'heal', power: 9, fx: 'heal', mp: 5 });
  K('protect_self', { name: 'Barrier', kind: 'buff', status: ['protect'], target: 'self', fx: 'shield' });
  K('howl', { name: 'Howl', kind: 'buff', status: ['haste'], target: 'self', fx: 'wind' });
  K('maul', { name: 'Maul', kind: 'phys', power: 1.8, fx: 'claw' });
  K('void_touch', { name: 'Hollow Touch', kind: 'mag', power: 12, elem: 'dark', status: ['silence'], hit: 30, fx: 'dark' });
  K('wail', { name: 'Wail', kind: 'mag', power: 8, elem: 'dark', all: 1, fx: 'dark' });
  K('grenade_toss', { name: 'Grenade', kind: 'mag', power: 14, elem: 'fire', all: 1, fx: 'boom' });
  K('smash', { name: 'Smash', kind: 'phys', power: 2.0, fx: 'boom' });
  // boss skills
  K('bw_cannon', { name: 'Arm Cannon', kind: 'mag', power: 16, elem: 'fire', fx: 'boom' });
  K('bw_sweep', { name: 'Sweep Laser', kind: 'mag', power: 10, elem: 'bolt', all: 1, fx: 'bolt' });
  K('bw_tackle', { name: 'Ram', kind: 'phys', power: 1.7, fx: 'boom' });
  K('bw_charge', { name: 'Core Charge', kind: 'buff', status: ['haste'], target: 'self', fx: 'spark' });
  K('bw_overdrive', { name: 'Overdrive', kind: 'mag', power: 22, elem: 'bolt', all: 1, fx: 'bolt' });
  K('lev_ink', { name: 'Sump Ink', kind: 'mag', power: 10, elem: 'water', status: ['blind'], hit: 50, all: 1, fx: 'water' });
  K('lev_tentacle', { name: 'Tentacle', kind: 'phys', power: 1.0, hits: 2, fx: 'claw' });
  K('lev_tide', { name: 'Sewage Tide', kind: 'mag', power: 18, elem: 'water', status: ['poison'], hit: 40, all: 1, fx: 'water' });
  K('gorr_club', { name: 'Unbroken Club', kind: 'phys', power: 2.1, fx: 'boom' });
  K('gorr_roar', { name: 'Crowd Roar', kind: 'buff', status: ['berserk'], target: 'self', fx: 'boom' });
  K('gorr_quake', { name: 'Stomp', kind: 'mag', power: 15, elem: 'earth', all: 1, fx: 'quake' });
  K('brute_girder', { name: 'Girder Swing', kind: 'phys', power: 1.25, fx: 'boom', all: 1 });
  K('brute_slam', { name: 'Slam', kind: 'phys', power: 2.2, fx: 'boom' });
  K('h0_scream', { name: 'Hollow Scream', kind: 'mag', power: 14, elem: 'dark', status: ['confuse'], hit: 25, all: 1, fx: 'dark' });
  K('h0_grasp', { name: 'Grasp', kind: 'phys', power: 1.6, drain: 1, fx: 'claw' });
  K('h0_flow', { name: 'Aether Surge', kind: 'mag', power: 24, fx: 'spark' });
  K('h0_mend', { name: 'Regrowth', kind: 'heal', power: 30, target: 'self', fx: 'heal' });
  K('dv_thrust', { name: 'Venn Lunge', kind: 'phys', power: 1.9, fx: 'slash', pierce: 1 });
  K('dv_spin', { name: 'Halberd Sweep', kind: 'phys', power: 1.15, all: 1, fx: 'slash' });
  K('dv_order', { name: 'Rally', kind: 'buff', status: ['haste', 'protect'], target: 'all', fx: 'shield' });
  K('dv_brace', { name: 'Brace', kind: 'buff', status: ['protect'], target: 'self', fx: 'shield' });
  K('jg_cannon', { name: 'Rail Cannon', kind: 'mag', power: 26, elem: 'fire', fx: 'boom' });
  K('jg_steam', { name: 'Steam Vent', kind: 'mag', power: 16, elem: 'water', all: 1, fx: 'wind' });
  K('jg_crush', { name: 'Crush', kind: 'phys', power: 2.0, fx: 'boom' });
  K('jg_whistle', { name: 'Whistle', kind: 'buff', status: ['haste'], target: 'self', fx: 'wind' });

  AE.SPECIALS.pilfer = async function (B, u, ts) {
    const t = ts[0]; B.say('Pilfer', 50); await B.step(u, true); B.hitOnce(u, t, 0.6, {});
    const g = Math.min(AE.S_.gold, 20 + AE.rand(40)); AE.S_.gold -= g; u.loot = (u.loot || 0) + g; if (g) B.say('Stole ' + g + ' G!', 60);
    await AE.wait(20); await B.step(u, false);
  };

  // ---------- Reactor 4 ----------
  E('a_trooper', 'Aurex Trooper', 3, 92, 17, 10, 6, 6, 16, 18, 2, 24, { cast: 'trooper' }, { ai: [[4, 'attack'], [1, 'baton']], steal: [['potion', 0.6]], drop: [['potion', 0.25]] });
  E('a_gunner', 'Aurex Gunner', 4, 78, 19, 8, 6, 8, 18, 21, 2, 28, { cast: 'gunner' }, { ai: [[3, 'rifle_shot'], [1, 'attack']], steal: [['grenade', 0.4]], drop: [['grenade', 0.15]] });
  E('sentry', 'Sentry Drone', 3, 64, 14, 14, 12, 8, 20, 17, 2, 18, { mon: 'Eye', hue: 170 }, { weak: ['bolt'], float: 1, ai: [[2, 'attack'], [2, 'scan_beam'], [1, 'flare_beam']], steal: [['eye_drops', 0.5]] });
  E('crawler', 'Coil Crawler', 4, 96, 18, 12, 6, 6, 15, 22, 3, 20, { mon: 'SpiderYellow' }, { absorb: ['bolt'], weak: ['water', 'ice'], ai: [[3, 'attack'], [2, 'shock_bite']], drop: [['spark_cell', 0.06]] });
  E('flowslime', 'Flow Slime', 4, 74, 13, 16, 14, 4, 12, 20, 3, 14, { mon: 'Slime2', hue: 110 }, { weak: ['fire'], resist: ['water'], ai: [[3, 'attack'], [2, 'aether_drip']], steal: [['ether', 0.08]] });
  E('piperat', 'Pipe Rat', 2, 48, 13, 6, 4, 4, 26, 12, 1, 10, { mon: 'Mouse' }, { ai: [[3, 'attack'], [1, 'gnaw']], drop: [['antidote', 0.2]] });
  E('bulwark', 'Bulwark', 8, 1650, 26, 26, 22, 18, 18, 240, 24, 400, { boss: 'GiantBlueSamurai', anim: 'Idle', fw: 48, fh: 48, k: 2, sat: 0.25, bright: 0.95 },
    { boss: 1, weak: ['bolt'], resist: ['fire'], steal: [['prism:barrier', 0.4], ['hi_potion', 1]], ai: 'bulwark', drop: [['iron_bangle', 1]] });
  AE.AI.bulwark = function (f, B) {
    const v = f.ai.vars; v.t = (v.t || 0) + 1;
    if (!v.phase && f.hp < f.maxhp * 0.5) { v.phase = 1; B.say('Bulwark: CORE TEMPERATURE CRITICAL. OVERDRIVE.', 90); return AE.mkAct(f, B, 'bw_charge'); }
    if (v.phase && v.t % 4 === 0) return AE.mkAct(f, B, 'bw_overdrive');
    const r = Math.random();
    if (r < 0.35) return AE.mkAct(f, B, 'attack'); if (r < 0.6) return AE.mkAct(f, B, 'bw_tackle'); if (r < 0.82) return AE.mkAct(f, B, 'bw_cannon');
    return AE.mkAct(f, B, 'bw_sweep');
  };
  AE.ENC.r4 = { bg: 'reactor', sets: [
    { enemies: ['a_trooper', 'a_trooper'], w: 3 }, { enemies: ['a_trooper', 'a_gunner'], w: 3 }, { enemies: ['sentry', 'sentry'], w: 2 }, { enemies: ['crawler'], w: 2 },
    { enemies: ['flowslime', 'flowslime', 'piperat'], w: 2 }, { enemies: ['piperat', 'piperat', 'piperat'], w: 2 }, { enemies: ['a_gunner', 'sentry', 'a_trooper'], w: 1 }] };

  // ---------- Drain 9 ----------
  E('sumprat', 'Sump Rat', 6, 135, 24, 12, 6, 8, 24, 34, 3, 30, { mon: 'MouseBlack' }, { ai: [[3, 'attack'], [1, 'frenzy']], drop: [['antidote', 0.3]] });
  E('sludge', 'Sludge', 7, 190, 22, 22, 16, 6, 10, 42, 4, 26, { mon: 'Slime3', hue: 40 }, { weak: ['fire'], immune: ['poison'], ai: [[2, 'attack'], [2, 'toxic_touch']], steal: [['antidote', 1]] });
  E('draineel', 'Drain Eel', 7, 160, 26, 14, 14, 10, 20, 40, 4, 34, { mon: 'Snake2', hue: 190 }, { weak: ['bolt'], absorb: ['water'], ai: [[3, 'attack'], [2, 'coil']] });
  E('bloat', 'Bloat Larva', 6, 120, 18, 10, 18, 10, 14, 36, 4, 22, { mon: 'Larva2' }, { weak: ['fire', 'wind'], ai: [[1, 'attack'], [3, 'spit']], drop: [['antidote', 0.4]] });
  E('rotcap', 'Rotcap', 7, 170, 20, 16, 20, 14, 12, 40, 5, 28, { mon: 'Mushroom2' }, { weak: ['fire'], ai: [[2, 'attack'], [1, 'spores']], steal: [['echo_screen', 0.6]] });
  E('rustback', 'Rustback', 10, 1400, 32, 30, 14, 20, 16, 380, 30, 800, { mon: 'SpiderRed', k: 3.2 }, { boss: 1, absorb: ['bolt'], weak: ['water'], ai: [[3, 'attack'], [2, 'shock_bite'], [1, 'frenzy']], drop: [['prism:quick', 1]] });
  E('leviathan', 'Sump Leviathan', 12, 3400, 34, 22, 30, 22, 20, 820, 45, 0, { boss: 'SquidGreen', anim: 'Idle', fw: 76, fh: 79, k: 1.4 },
    { boss: 1, weak: ['bolt'], absorb: ['water'], ai: 'leviathan', steal: [['prism:elemental', 0.3], ['x_potion', 1]] });
  AE.AI.leviathan = function (f, B) {
    const v = f.ai.vars; v.t = (v.t || 0) + 1;
    if (v.t % 5 === 0) return AE.mkAct(f, B, 'lev_tide');
    if (f.hp < f.maxhp * 0.4 && v.t % 3 === 0) return AE.mkAct(f, B, 'lev_ink');
    return AE.mkAct(f, B, Math.random() < 0.55 ? 'lev_tentacle' : 'attack');
  };
  AE.ENC.drains = { bg: 'swamp', sets: [
    { enemies: ['sumprat', 'sumprat'], w: 3 }, { enemies: ['sludge', 'bloat'], w: 2 }, { enemies: ['draineel', 'sumprat'], w: 2 }, { enemies: ['rotcap', 'rotcap'], w: 2 },
    { enemies: ['bloat', 'bloat', 'bloat'], w: 1 }, { enemies: ['sludge', 'draineel', 'rotcap'], w: 1 }] };

  // ---------- The Pit (arena) ----------
  E('pit_brawler', 'Pit Brawler', 8, 260, 30, 16, 6, 10, 18, 60, 4, 0, { cast: 'marlo', hue: 140 }, { ai: [[3, 'attack'], [1, 'frenzy']] });
  E('pit_hound', 'Pit Hound', 8, 210, 28, 12, 6, 8, 28, 55, 4, 0, { mon: 'Beast', hue: 20 }, { ai: [[3, 'attack'], [1, 'howl']] });
  E('pit_lizard', 'Arena Drake', 10, 380, 32, 20, 18, 14, 18, 90, 6, 0, { mon: 'Lizard2' }, { weak: ['ice'], ai: [[2, 'attack'], [1, 'fire_spell']] });
  E('pit_twin', 'Ogre Twin', 11, 620, 36, 22, 8, 12, 14, 140, 8, 0, { mon: 'Cyclope2', k: 2.5 }, { ai: [[3, 'attack'], [1, 'smash']] });
  E('gorr', 'Gorr the Unbroken', 15, 5200, 44, 30, 18, 22, 20, 1600, 60, 0, { boss: 'DemonCyclop', anim: 'Idle', fw: 50, fh: 50, k: 1.8 },
    { boss: 1, ai: [[3, 'attack'], [2, 'gorr_club'], [1, 'gorr_quake'], [1, 'gorr_roar', 'hurt']], steal: [['power_source', 0.3], ['hero_tonic', 1]] });

  // ---------- Spire Stair ----------
  E('hawk', 'Girder Hawk', 9, 210, 30, 14, 16, 12, 30, 62, 5, 40, { mon: 'Owl2' }, { weak: ['bolt', 'ice'], float: 1, ai: [[2, 'attack'], [2, 'dive'], [1, 'gust']], drop: [['phoenix_down', 0.08]] });
  E('rivet', 'Rivet Drone', 9, 190, 28, 24, 14, 10, 22, 60, 5, 46, { mon: 'Eye2', hue: 30 }, { weak: ['bolt'], float: 1, ai: [[2, 'attack'], [2, 'rivet_gun']], steal: [['spark_cell', 0.3]] });
  E('heavy', 'Heavy Trooper', 10, 360, 34, 28, 8, 14, 14, 78, 6, 60, { cast: 'officer', hue: 200 }, { ai: [[3, 'attack'], [1, 'shield_bash'], [1, 'protect_self', 'hurt']], steal: [['hi_potion', 0.3]], drop: [['potion', 0.4]] });
  E('wisp', 'Spark Wisp', 9, 150, 18, 12, 28, 22, 26, 58, 6, 36, { mon: 'Spirit', hue: 60 }, { absorb: ['bolt'], weak: ['water'], ai: [[1, 'attack'], [3, 'zap']], steal: [['ether', 0.06]] });
  E('imp', 'Scaffold Imp', 10, 240, 26, 16, 12, 12, 32, 66, 6, 80, { mon: 'KappaRed' }, { ai: [[2, 'attack'], [2, 'pilfer']] });
  E('patrol', 'Aurex Patrol', 9, 240, 30, 18, 10, 12, 18, 64, 5, 52, { cast: 'trooper', hue: 330 }, { ai: [[3, 'attack'], [1, 'baton'], [1, 'grenade_toss']], steal: [['grenade', 0.6]] });
  E('brute', 'Scaffold Brute', 14, 4300, 42, 32, 10, 18, 16, 1100, 40, 1200, { boss: 'DemonCyclop2', anim: 'Idle', fw: 50, fh: 50, k: 1.9, sat: 0.5 },
    { boss: 1, weak: ['bolt'], ai: [[3, 'attack'], [2, 'brute_girder'], [2, 'brute_slam']], steal: [['titan_band', 0.3], ['hi_potion', 1]], drop: [['prism:power_plus', 1]] });
  AE.ENC.spire = { bg: 'factory', sets: [
    { enemies: ['hawk', 'hawk'], w: 3 }, { enemies: ['rivet', 'patrol'], w: 3 }, { enemies: ['heavy', 'patrol'], w: 2 }, { enemies: ['wisp', 'wisp', 'rivet'], w: 2 },
    { enemies: ['imp', 'imp'], w: 2 }, { enemies: ['patrol', 'patrol', 'heavy'], w: 1 }, { enemies: ['hawk', 'wisp', 'imp'], w: 1 }] };

  // ---------- Aurex Tower ----------
  E('secoff', 'Security Officer', 13, 440, 40, 30, 12, 18, 20, 112, 8, 90, { cast: 'officer' }, { ai: [[3, 'attack'], [1, 'baton'], [1, 'rifle_shot']], steal: [['hi_potion', 0.4]] });
  E('sentinel', 'Sentinel Drone', 13, 340, 34, 30, 30, 20, 24, 106, 8, 80, { mon: 'Eye', hue: 300 }, { weak: ['bolt'], float: 1, ai: [[1, 'attack'], [2, 'scan_beam'], [1, 'flare_beam']] });
  E('lab_beast', 'Lab Specimen', 14, 520, 44, 22, 10, 14, 22, 128, 9, 70, { mon: 'Beast2', hue: 260 }, { weak: ['fire'], ai: [[3, 'attack'], [1, 'maul'], [1, 'howl']], drop: [['speed_draught', 0.05]] });
  E('failed', 'Failed Vessel', 14, 400, 30, 18, 34, 30, 18, 124, 10, 40, { mon: 'Spirit2', hue: 200, bright: 1.2 }, { undead: 1, weak: ['holy', 'fire'], absorb: ['dark'], ai: [[1, 'attack'], [2, 'void_touch'], [1, 'wail']], steal: [['mind_source', 0.03]] });
  E('arcanist', 'Aurex Arcanist', 14, 380, 22, 18, 38, 34, 20, 130, 10, 110, { cast: 'tech' }, { ai: [[1, 'attack'], [2, 'fire_spell'], [2, 'ice_spell'], [1, 'cure_spell', 'ally_hurt']], steal: [['ether', 0.4]] });
  E('hound', 'Guard Hound', 13, 420, 42, 20, 6, 12, 32, 110, 8, 60, { mon: 'Beast' }, { ai: [[3, 'attack'], [1, 'frenzy']] });
  E('h0', 'Specimen H-0', 18, 7800, 48, 28, 44, 30, 22, 2400, 80, 2000, { boss: 'GiantSpirit', anim: 'Idle', fw: 50, fh: 50, k: 2.2, hue: 230 },
    { boss: 1, weak: ['holy', 'fire'], absorb: ['dark'], ai: 'h0', steal: [['prism:heal', 0.3], ['x_potion', 1]] });
  AE.AI.h0 = function (f, B) {
    const v = f.ai.vars; v.t = (v.t || 0) + 1;
    if (f.hp < f.maxhp * 0.3 && !v.healed) { v.healed = 1; return AE.mkAct(f, B, 'h0_mend'); }
    if (v.t % 4 === 0) return AE.mkAct(f, B, 'h0_scream');
    if (v.t % 6 === 3) return AE.mkAct(f, B, 'h0_flow');
    return AE.mkAct(f, B, Math.random() < 0.5 ? 'h0_grasp' : 'attack');
  };
  E('drago1', 'Captain Drago Venn', 18, 6800, 50, 34, 24, 28, 26, 2800, 90, 2500, { cast: 'drago', k: 1.4 },
    { boss: 1, ai: 'drago1', steal: [['prism:deathblow', 0.25], ['hero_tonic', 1]], drop: [['dawn_edge', 1]] });
  AE.AI.drago1 = function (f, B) {
    const v = f.ai.vars; v.t = (v.t || 0) + 1;
    if (v.t === 1) return AE.mkAct(f, B, 'dv_order');
    if (f.hp < f.maxhp * 0.5 && !v.brace) { v.brace = 1; B.say('Drago: Good. Now I\'m interested.', 90); return AE.mkAct(f, B, 'dv_brace'); }
    if (v.t % 3 === 0) return AE.mkAct(f, B, 'dv_spin');
    return AE.mkAct(f, B, Math.random() < 0.5 ? 'dv_thrust' : 'attack');
  };
  AE.ENC.tower = { bg: 'city', sets: [
    { enemies: ['secoff', 'secoff'], w: 3 }, { enemies: ['sentinel', 'secoff'], w: 3 }, { enemies: ['hound', 'hound'], w: 2 }, { enemies: ['arcanist', 'secoff'], w: 2 },
    { enemies: ['lab_beast'], w: 2 }, { enemies: ['failed', 'failed'], w: 2 }, { enemies: ['lab_beast', 'arcanist', 'sentinel'], w: 1 }] };

  // ---------- Rail Yards ----------
  E('raildrone', 'Rail Drone', 16, 520, 46, 36, 30, 22, 26, 150, 11, 120, { mon: 'Eye2', hue: 200 }, { weak: ['bolt'], float: 1, ai: [[2, 'attack'], [2, 'rivet_gun'], [1, 'scan_beam']] });
  E('yardgun', 'Yard Gunner', 16, 560, 48, 30, 12, 20, 24, 156, 11, 140, { cast: 'gunner', hue: 120 }, { ai: [[2, 'attack'], [2, 'rifle_shot'], [1, 'grenade_toss']], steal: [['grenade', 1]] });
  E('scrapgolem', 'Scrap Golem', 17, 1100, 54, 44, 8, 16, 12, 220, 14, 160, { mon: 'Cyclope', k: 2.6, sat: 0.3 }, { weak: ['bolt', 'water'], ai: [[3, 'attack'], [1, 'smash']], drop: [['hi_potion', 0.3]] });
  E('yardhound', 'Yard Hound', 15, 480, 46, 22, 6, 14, 34, 140, 10, 80, { mon: 'Beast', hue: 300 }, { ai: [[3, 'attack'], [1, 'frenzy'], [1, 'howl']] });
  E('juggernaut', 'Iron Juggernaut', 20, 9800, 56, 40, 36, 30, 20, 3600, 120, 3000, { boss: 'GiantRedSamurai', anim: 'Idle', fw: 48, fh: 48, k: 2.3, sat: 0.2, bright: 0.85 },
    { boss: 1, weak: ['bolt', 'water'], resist: ['fire'], ai: 'jugg', steal: [['prism:gravity', 0.3], ['x_potion', 1]] });
  AE.AI.jugg = function (f, B) {
    const v = f.ai.vars; v.t = (v.t || 0) + 1;
    if (v.t % 5 === 0) return AE.mkAct(f, B, 'jg_cannon');
    if (f.hp < f.maxhp * 0.5 && !v.w) { v.w = 1; return AE.mkAct(f, B, 'jg_whistle'); }
    if (v.t % 3 === 0) return AE.mkAct(f, B, 'jg_steam');
    return AE.mkAct(f, B, Math.random() < 0.5 ? 'jg_crush' : 'attack');
  };
  AE.ENC.yards = { bg: 'factory', sets: [
    { enemies: ['raildrone', 'yardgun'], w: 3 }, { enemies: ['yardhound', 'yardhound', 'yardhound'], w: 2 }, { enemies: ['scrapgolem'], w: 2 }, { enemies: ['yardgun', 'yardgun', 'raildrone'], w: 2 },
    { enemies: ['scrapgolem', 'yardhound'], w: 1 }] };

  // ---------- shops (Act I) ----------
  AE.SHOPS.sumps_items = { name: 'Odds & Ends', items: ['potion', 'phoenix_down', 'antidote', 'eye_drops', 'echo_screen', 'tent', 'grenade'] };
  AE.SHOPS.sumps_arms = { name: 'Grett\'s Arms', items: ['steel_saber', 'copper_staff', 'rifle_lance', 'stiletto', 'leather_vest', 'iron_mail', 'iron_bangle'] };
  AE.SHOPS.sumps_junk = { name: 'Junk Mira', items: ['grenade', 'smoke_bomb', 'iron_bangle', 'tent', 'prism:scan', 'prism:throw'] };
  AE.SHOPS.market_tools = { name: 'Tool Trader', items: ['potion', 'hi_potion', 'phoenix_down', 'tent', 'smoke_bomb', 'grenade', 'remedy'] };
  AE.SHOPS.market_herbs = { name: 'Herbalist', items: ['antidote', 'eye_drops', 'echo_screen', 'soft', 'greens'] };
  AE.SHOPS.market_junk = { name: 'Scrap King', items: ['wind_cutter', 'mending_rod', 'breach_lance', 'mythril_knife', 'titan_band', 'silk_robe', 'star_pendant', 'silver_glasses'] };
  AE.SHOPS.prism_shop = { name: 'Prismatics', items: ['prism:fire', 'prism:ice', 'prism:bolt', 'prism:restore', 'prism:toxin', 'prism:mystify', 'prism:scan', 'prism:hp_plus', 'prism:all'] };
})();
// Arcana cards that monsters sometimes drop (bosses always drop theirs)
(function () {
  const D = { piperat: 'c_rat', flowslime: 'c_slime', sentry: 'c_drone', a_trooper: 'c_trooper', hawk: 'c_hawk', crawler: 'c_crawler', bloat: 'c_larva', sumprat: 'c_sumprat',
    sludge: 'c_sludge', draineel: 'c_eel', rotcap: 'c_rotcap', wisp: 'c_wisp', a_gunner: 'c_gunner', rivet: 'c_rivet', imp: 'c_imp', heavy: 'c_heavy', hound: 'c_hound',
    pit_lizard: 'c_drake', lab_beast: 'c_specimen', failed: 'c_failed', arcanist: 'c_arcanist', pit_twin: 'c_ogre', scrapgolem: 'c_golem',
    bulwark: 'c_bulwark', rustback: 'c_rustback', leviathan: 'c_leviathan', brute: 'c_brute', gorr: 'c_gorr', h0: 'c_h0', juggernaut: 'c_jugg', drago1: 'c_drago' };
  Object.keys(D).forEach(function (e) { const E = AE.ENEMIES[e]; if (!E) return; E.drop = (E.drop || []).concat([['card:' + D[e], E.boss ? 1 : 0.05]]); });
})();
