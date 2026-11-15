/* ================= Secrets =================
   Secret places stay off every map until you walk into them. Travellers in inns and the rumour-monger at the
   Moonwell Oasis drop hints. Four legendary Prisms wait in the four hidden caves; the Oasis is only there at night;
   the ghost ship sails only at night and is boarded from the boat. */
(function () {
  const E = AE.E, EV = AE.EV, cs = AE.cs, sayAs = function (n, t) { return AE.say(t, { name: n }); }, F = function () { return AE.S_.flags; };
  // ---------- the legendary Prisms ----------
  Object.assign(AE.PRISMS, {
    mega_all: { name: 'Mega All', type: 'indep', col: 'purple', effect: 'megaall', ap: [0], price: 0, desc: 'Every spell, item and Echo reaches all targets.' },
    quadracast: { name: 'Quadracast', type: 'indep', col: 'purple', effect: 'quadra', ap: [0], price: 0, desc: 'Attack magic is cast four times.' },
    overdrive: { name: 'Overdrive', type: 'indep', col: 'purple', effect: 'overdrive', ap: [0], price: 0, desc: 'The Surge gauge fills twice as fast.' },
    oath: { name: 'Oath of Kings', type: 'echo', col: 'red', echo: 'oath', ap: [0, 100000, 300000, 600000, 900000] },
  });
  AE.ECHOES.oath = { name: 'Oath of Kings', mp: 280, power: 24, hits: 13, fx: 'holy', desc: 'Thirteen sworn kings strike, one after another.', art: 'DemonCyclop2' };
  // Mega All: spells (and Echoes) reach everyone on that side
  const spell0 = AE.Battle.prototype.doSpell;
  AE.Battle.prototype.doSpell = async function (u, id, targets, act) {
    const S = AE.SPELLS[id] || AE.SKILLS[id], ind = (u.abil && u.abil.indep) || {};
    if (S && u.side === 'party' && ind.megaall && !(act && act.skill)) {
      const friendly = ['heal', 'buff', 'cure', 'revive'].indexOf(S.kind) >= 0;
      targets = friendly ? this.friends(u, S.kind === 'revive') : this.foes(u);
    }
    const r = await spell0.call(this, u, id, targets, act);
    if (S && u.side === 'party' && ind.quadra && S.kind === 'mag' && !(act && (act.skill || act.quadra))) {
      for (let k = 0; k < 3; k++) { const live = this.foes(u); if (!live.length) break; await spell0.call(this, u, id, ind.megaall ? live : [AE.pick(live)], { free: 1, quadra: 1 }); }
    }
    return r;
  };
  // Overdrive: the Surge gauge fills twice as fast
  const hurt0 = AE.Battle.prototype.hurt;
  AE.Battle.prototype.hurt = function (f, d, o) {
    const before = f.surge || 0; const r = hurt0.apply(this, arguments);
    if (f.side === 'party' && f.abil && f.abil.indep && f.abil.indep.overdrive) f.surge = Math.min(1, before + ((f.surge || 0) - before) * 2);
    return r;
  };
  // Echoes with several hits (Oath of Kings)
  const echo0 = AE.Battle.prototype.doEcho;
  AE.Battle.prototype.doEcho = async function (u, id, targets, act) {
    const E2 = AE.ECHOES[id], mp0 = u.mp; await echo0.apply(this, arguments);
    if (!E2 || !(E2.hits > 1) || u.mp === mp0) return;
    for (let h = 1; h < E2.hits; h++) {
      const live = this.foes(u); if (!live.length) break;
      const t = AE.pick(live); this.addFx(E2.fx, t); AE.Sfx && AE.Sfx.play('hit'); this.say(E2.name + ' ' + (h + 1), 20);
      this.hurt(t, Math.max(1, Math.floor(AE.magDamage(u, t, E2.power) * Math.max(0, AE.elemMod(t, E2.elem))))); await AE.wait(14);
    }
  };
  // ---------- guardians ----------
  E('sc_serpent', 'Veil Serpent', 48, 70000, 210, 120, 180, 140, 52, 20000, 1200, 15000, { mon: 'Snake4', k: 5, hue: 170 }, { boss: 1, absorb: ['water'], weak: ['bolt'], ai: [[3, 'attack'], [2, 'blizzard'], [1, 'v_count']] });
  E('sc_king', 'The Thirteenth King', 70, 260000, 260, 170, 220, 170, 60, 60000, 3000, 40000, { cast: 'officer', k: 1.6, hue: 40, bright: 0.8 }, { boss: 1, weak: ['dark'], absorb: ['holy'], ai: [[3, 'attack'], [2, 'flare_beam'], [1, 'v_count']] });
  E('sc_archivist', 'Drowned Archivist', 66, 220000, 200, 150, 260, 190, 54, 50000, 2600, 30000, { mon: 'RedOctopus', k: 5, hue: 200 }, { boss: 1, absorb: ['water'], weak: ['bolt'], ai: [[2, 'blizzard'], [2, 'thunderhead'], [1, 'attack']] });
  E('sc_sentinel', 'Sky Sentinel', 72, 280000, 240, 190, 250, 200, 66, 65000, 3200, 40000, { mon: 'Eye2', k: 5, hue: 190 }, { boss: 1, weak: ['earth'], absorb: ['wind', 'bolt'], ai: [[2, 'thunderhead'], [2, 'attack'], [1, 'ic_inferno']] });
  E('sc_rumboss', 'Rumrunner Boss', 34, 30000, 150, 90, 70, 70, 44, 8000, 600, 20000, { cast: 'gunner', k: 1.3, hue: 300 }, { boss: 1, ai: [[3, 'attack'], [1, 'v_count']] });
  E('sc_ghostcap', 'Captain Hollow', 60, 150000, 230, 130, 200, 150, 56, 40000, 2200, 30000, { mon: 'SkullBlue', k: 4.5, hue: 140 }, { boss: 1, undead: 1, weak: ['holy', 'fire'], ai: [[3, 'attack'], [2, 'blizzard'], [1, 'v_count']] });
  const guardian = function (ev, foe, bg, intro, prize, after) {
    EV[ev] = async function () {
      await AE.say(intro);
      const res = await cs.battle([foe], { bg: bg, boss: 1, noRun: 1, noBack: 1 });
      if (res === 'lose') return;
      cs.flag(ev); AE.Sfx.play('secret'); await AE.gain(prize); if (after) await AE.say(after);
    };
  };
  guardian('sc_falls', 'sc_serpent', 'cave', 'Behind the falling water, a serpent coils around a crystal that hums with every voice in the cave.', 'prism:mega_all', 'Mega All: whatever you cast, everyone on that side feels it.');
  guardian('sc_vault', 'sc_king', 'temple', 'Thirteen empty thrones. The last one is not empty. A king in gold armour rises: "Swear, or fall."', 'prism:oath', 'The Oath of Kings. Thirteen blades, sworn to you.');
  guardian('sc_deep', 'sc_archivist', 'underwater', 'Shelves of drowned books, still in order. Something with too many arms is reading them.', 'prism:quadracast', 'Quadracast: attack magic, four times over.');
  guardian('sc_peak', 'sc_sentinel', 'sky', 'Above the clouds, an eye of stone opens and looks at you for a very long time.', 'prism:overdrive', 'Overdrive: your Surges come twice as fast.');
  guardian('sc_rumrunner', 'sc_rumboss', 'cave', 'A cove full of crates marked "SALT". It is not salt. Their boss cracks his knuckles.', 'prism:steal', 'Under his coat: a Prism he stole from somebody important.');
  guardian('sc_captain', 'sc_ghostcap', 'ship', 'The captain of the Lantern Wake turns. There is nothing under his hat but cold light.', 'ribbon', 'The ghost ship sighs, and the fog lifts. The Lantern Wake will not sail again.');
  // ---------- hidden places: off the map until found ----------
  AE.placeVisible = function (k) {
    const q = AE.WORLD.places[k], S = AE.S_; if (!q) return false;
    if (k === 'oasis' && !(AE.dayLight && AE.dayLight().night > 0.45)) return false;
    return !q.hidden || !!S.flags['found_' + k];
  };
  const markSecrets = function () { (AE.WORLD.secrets || []).forEach(function (k) { if (AE.WORLD.places[k]) AE.WORLD.places[k].hidden = true; }); };
  const W0 = AE.World;
  AE.World = function () { markSecrets(); W0.apply(this, arguments); };
  AE.World.prototype = W0.prototype; AE.World.prototype.constructor = AE.World; Object.keys(W0).forEach(function (k) { AE.World[k] = W0[k]; });
  const pa0 = AE.World.prototype.placeAt;
  AE.World.prototype.placeAt = function (x, y) { const k = pa0.apply(this, arguments); if (k === 'oasis' && !AE.placeVisible('oasis')) return null; return k; };
  const ep0 = AE.World.prototype.enterPlace;
  AE.World.prototype.enterPlace = function (k, force) {
    const S = AE.S_;
    if ((AE.WORLD.secrets || []).indexOf(k) >= 0 && !S.flags['found_' + k]) {
      S.flags['found_' + k] = 1; AE.Sfx.play('secret');
      const n = (AE.WORLD.secrets || []).filter(function (s) { return S.flags['found_' + s]; }).length;
      AE.notice('Secret found: ' + AE.WORLD.places[k][6] + ' (' + n + '/' + AE.WORLD.secrets.length + ')');
    }
    return ep0.apply(this, arguments);
  };
  // the sub surfaces into the Drowned Archive the same way it does into the Coral Sanctum
  const act0 = AE.World.prototype.action;
  AE.World.prototype.action = function () {
    const p = AE.WORLD.places.deep_ruin;
    if (this.v === 'sub' && p && Math.floor(this.x) === p[0] && Math.floor(this.y) === p[1]) { this.enterPlace('deep_ruin'); return; }
    return act0.apply(this, arguments);
  };
  // the ghost ship: at night, out at sea; board it from the boat
  AE.GHOST = [104, 166];
  const upd0 = AE.World.prototype.update;
  AE.World.prototype.update = function (g) {
    const r = upd0.apply(this, arguments);
    if (this.busy || F().sc_captain) return r;
    const night = AE.dayLight && AE.dayLight().night > 0.45;
    if (night && this.v === 'boat' && Math.hypot(this.x - AE.GHOST[0], this.y - AE.GHOST[1]) < 2 && g.input.pressed.ok) {
      const self = this; this.busy = true;
      (async function () {
        const c = await AE.ask('A ship with no crew drifts out of the fog, lanterns lit. Board her?', ['Board', 'Row away'], { cancel: 1 });
        if (c === 0) { F().found_ghost = 1; self.busy = false; AE.game.fadeOut(0.08).then(function () { AE.S_.worldRet = [Math.floor(self.x), Math.floor(self.y)]; AE.S_.world = Object.assign(AE.S_.world || {}, { v: 'boat' }); AE.game.pop(self); const M = AE.MAPS.sc_ghost; const f = new AE.Field('sc_ghost', M.entry[0], M.entry[1], 0); AE.game.push(f); f.title = 120; AE.game.fadeIn(0.08); }); }
        else self.busy = false;
      })();
    }
    return r;
  };
  const wd0 = AE.World.prototype.draw;
  AE.World.prototype.draw = function (ctx) {
    wd0.apply(this, arguments);
    if (F().sc_captain || !this._proj || !(AE.dayLight && AE.dayLight().night > 0.45)) return;
    const q = this._proj(AE.GHOST[0], AE.GHOST[1], 1); if (!q || q.d > 500) return;
    const k = Math.min(2.6, q.k * 1.6), t = this.t;
    ctx.save(); ctx.translate(q.x, q.y + Math.sin(t * 0.04) * 1.5); ctx.scale(k, k); ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#2a3a3a'; ctx.beginPath(); ctx.moveTo(-14, -4); ctx.lineTo(14, -4); ctx.lineTo(10, 2); ctx.lineTo(-10, 2); ctx.fill();
    ctx.fillStyle = '#1e2a2a'; ctx.fillRect(-1, -24, 2, 20); ctx.fillStyle = 'rgba(200,230,220,.55)'; ctx.fillRect(1, -22, 9, 8); ctx.fillRect(-10, -20, 9, 7);
    ctx.globalCompositeOperation = 'lighter'; for (const lx of [-9, 0, 9]) { const g = ctx.createRadialGradient(lx, -6, 0, lx, -6, 5); g.addColorStop(0, 'rgba(140,255,200,.8)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(lx - 5, -11, 10, 10); }
    ctx.restore();
  };
  // ---------- the people of the secrets ----------
  AE.SHOPS.sc_oasis = { name: 'Moon Merchant', items: ['x_potion', 'turbo_ether', 'remedy', 'cottage', 'sun_nut', 'storm_nut', 'star_nut'] };
  EV.sc_well = async function () { await sayAs('WELL KEEPER', 'The Moonwell only rises when the moon does. Drink. It remembers you.'); AE.healAll(); AE.Sfx.play('save'); await AE.notice('The party is fully restored.'); };
  const RUMOURS = [
    ['falls', 'They say a waterfall in the north-west of Meridia hides a cave. Walk into the falls, if you dare get wet.'],
    ['graveyard', 'There are graves in the woods west of the Old Mine. Nobody remembers whose.'],
    ['oasis', 'In the Sunscar east of the refinery, a well appears at night. Merchants who\'ve seen it never find it by day.'],
    ['hidden_cove', 'Rumrunners hide their cargo in a cove on Solmara\'s southern shore. The guards look the other way.'],
    ['star_cabin', 'An old stargazer lives on a spit of snow south of Deeproot. You\'ll need wings to visit.'],
    ['peak', 'The tallest summit in the far north-east of Nordheim has a flat top. As if something lands there.'],
    ['deep_ruin', 'Fishermen off the south-west coast talk of a hole in the sea floor, and books floating up from it.'],
    ['vault', 'Thirteen kings sleep in a valley in the far west of Meridia, walled in by cliffs. Not even an airship can land there.'],
    ['atoll', 'South of Port Lark there\'s a ring of sand in the sea. Prickly things live there, and they pay better than any job. If you can hit them.'],
    ['ghost', 'A ship with green lanterns sails the southern sea at night. Row out to her, if you have a boat and no sense.'],
  ];
  EV.sc_rumours = async function () {
    const S = AE.S_, left = RUMOURS.filter(function (r) { return !S.flags['found_' + r[0]] && !(r[0] === 'ghost' && S.flags.sc_captain); });
    if (!left.length) { await sayAs('TRAVELLER', 'You\'ve found every secret I know. You should be telling ME stories.'); return; }
    S.rumour = ((S.rumour || 0) + 1) % left.length; await sayAs('TRAVELLER', left[S.rumour][1]);
  };
  EV.sc_graves = async function () {
    if (F().sc_tomb) { await sayAs('GRAVE-TENDER', 'They sleep easier now. So do I.'); return; }
    await sayAs('GRAVE-TENDER', 'Wardens. Forty years ago, before Aurex. They held the Crystals\' gate and nobody wrote their names down.|The big stone in the middle is their captain. Pay your respects, if you like.');
  };
  EV.sc_tomb = async function () {
    if (F().sc_tomb) { await AE.say('"Here lies the Warden-Captain. The contract is sacred."'); return; }
    await AE.say('Carved on the stone: "Here lies the Warden-Captain. The contract is sacred." Someone has left a sword-belt in the moss.');
    cs.flag('sc_tomb'); await AE.gain('champion_belt' in (AE.ITEMS || {}) ? 'champion_belt' : 'prism:exp_plus');
  };
  EV.sc_stargazer = async function () {
    if (F().sc_star) { await sayAs('STARGAZER', 'The Crystals were stars once, you know. Fallen ones. Keep looking up.'); return; }
    await sayAs('STARGAZER', 'Visitors! By airship, no less. Look through the glass: see the four bright ones in a square?|Waterfall, valley, deep sea, high peak. Each one shines over a place where something old was hidden.|Take this. I won\'t be needing luck up here.');
    cs.flag('sc_star'); await AE.gain('prism:luck_plus');
  };
})();
