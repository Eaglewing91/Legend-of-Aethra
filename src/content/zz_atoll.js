/* ================= Needle Atoll: the levelling island (FF7's Cactus Island) =================
   A little desert atoll in the open sea south of Port Lark, unmarked on any map. Walk on its sand and something
   attacks almost every few steps. What lives there is hard to hit and hits hard, but pays enormously:
   - Needlebacks: dodge most blows, fire "1,000 Needles" (always exactly 1,000 damage), and bolt if the fight drags.
     Huge EXP, AP and Gil. Morph one for the Tetra Bloom (absorbs fire, ice, lightning and earth).
   - Greedy Urns: nothing hurts them... until you hand one an Elixir. Then it can be broken, for a fortune in AP.
   - The Jumbo Needleback: rare, enormous, "10,000 Needles". The biggest payday on the island. */
(function () {
  const E = AE.E, K = AE.K;
  // ---------- the gear it gives ----------
  AE.ACCS.tetra_bloom = { name: 'Tetra Bloom', price: 0, absorb: ['fire', 'ice', 'bolt', 'earth'] };
  const em0 = AE.elemMod;
  AE.elemMod = function (t, elem) {
    if (elem && t.side === 'party' && t.m && t.m.equip && AE.ACCS[t.m.equip.acc] && (AE.ACCS[t.m.equip.acc].absorb || []).indexOf(elem) >= 0) return -1;
    return em0.apply(this, arguments);
  };
  // ---------- the moves ----------
  const fixedHit = function (name, dmg, all) {
    return async function (B, u, ts) {
      B.say(name, 60); AE.Sfx && AE.Sfx.play('hit');
      const targets = all ? B.foes(u) : [AE.alive(ts[0]) ? ts[0] : AE.pick(B.foes(u))];
      targets.forEach(function (t) { if (t) { B.addFx('cut', t); B.burst && B.burst('spark', t.x, t.y - 16); } }); await AE.wait(18);
      targets.forEach(function (t) { if (t && AE.alive(t)) B.hurt(t, dmg, { col: '#fff' }); });
      await AE.wait(16);
    };
  };
  K('needles', { name: '1,000 Needles', kind: 'special' }); AE.SPECIALS.needles = fixedHit('1,000 Needles', 1000);
  K('jneedles', { name: '10,000 Needles', kind: 'special' }); AE.SPECIALS.jneedles = fixedHit('10,000 Needles', 2500, true);
  K('bolt_away', { name: 'Runs away', kind: 'special' });
  AE.SPECIALS.bolt_away = async function (B, u) {
    B.say(u.name + ' ran away!', 70); AE.Sfx && AE.Sfx.play('run');
    for (let i = 0; i < 16; i++) { u.x += 4; await AE.wait(1); }
    u.noReward = true; u.hp = 0; u.gone = true;
  };
  K('beg', { name: 'Begs', kind: 'special' });
  AE.SPECIALS.beg = async function (B, u) { B.say(u.fed ? 'The urn looks very content.' : '"Gimme an Elixir! An Elixir!"', 70); await AE.wait(40); };
  // ---------- the monsters ----------
  E('needleback', 'Needleback', 40, 6000, 130, 200, 40, 160, 60, 2400, 110, 1200, { mon: 'Bamboo', k: 2.6, hue: 40, sat: 1.3 },
    { eva: 85, morph: 'tetra_bloom', ai: 'needleback', immune: ['poison'] });
  E('jumbo_needle', 'Jumbo Needleback', 64, 60000, 210, 220, 120, 200, 40, 20000, 1200, 12000, { mon: 'BambooYellow', k: 5.5, hue: 30, sat: 1.4 },
    { boss: 0, eva: 40, ai: [[2, 'jneedles'], [3, 'attack']], drop: [['megalixir', 0.5]] });
  E('greedy_urn', 'Greedy Urn', 41, 4096, 10, 255, 10, 255, 30, 6000, 900, 6000, { mon: 'LanternRed', k: 2.8, hue: 300 },
    { urn: 1, ai: 'greedy_urn' });
  AE.AI.needleback = function (f, B) {
    f.turns = (f.turns || 0) + 1;
    if (f.turns >= 4 && Math.random() < 0.45) return { kind: 'skill', id: 'bolt_away', targets: [f] };
    return Math.random() < 0.65 ? { kind: 'skill', id: 'needles', targets: [AE.pick(B.foes(f))] } : { kind: 'attack', targets: [AE.pick(B.foes(f))] };
  };
  AE.AI.greedy_urn = function (f, B) {
    f.turns = (f.turns || 0) + 1;
    if (f.turns >= 7) return { kind: 'skill', id: 'bolt_away', targets: [f] };
    return { kind: 'skill', id: 'beg', targets: [f] };
  };
  // nothing hurts a Greedy Urn until it has been given an Elixir
  const hurt0 = AE.Battle.prototype.hurt;
  AE.Battle.prototype.hurt = function (f, d, o) {
    if (f.side === 'enemy' && f.d && f.d.urn && !f.fed && d > 0) { this.pop(f, 'Immune', '#ccc'); return; }
    return hurt0.apply(this, arguments);
  };
  const item0 = AE.Battle.prototype.doItem;
  AE.Battle.prototype.doItem = async function (u, id, targets) {
    const urn = (targets || []).find(function (t) { return t.side === 'enemy' && t.d && t.d.urn; });
    if (urn && (id === 'elixir' || id === 'megalixir')) {
      if (!AE.has(id)) { this.say('None left'); return; }
      AE.addItem(id, -1); this.say(AE.ITEMS[id].name, 50); await this.pose(u, 'throw', 16);
      urn.fed = true; this.addFx('heal', urn); this.say('"Ahh! That hit the spot!" The urn cracks open.', 90); AE.Sfx && AE.Sfx.play('secret'); await AE.wait(40); return;
    }
    return item0.apply(this, arguments);
  };
  // items can target enemies (an Elixir for the urn): when the item menu opens on the atoll, let it aim at foes
  const pick0 = AE.BattleMenu.prototype.pickTarget;
  AE.BattleMenu.prototype.pickTarget = function (o, make) {
    if (this.B.enemies.some(function (e) { return e.d && e.d.urn && AE.alive(e); }) && this.sub && this.sub.kind === 'item') {
      const it = this.sub.items[this.sub.list.sel]; if (it && (it.id === 'elixir' || it.id === 'megalixir')) o = Object.assign({}, o, { side: 'foes', forceAll: false });
    }
    return pick0.call(this, o, make);
  };
  AE.ENC.w_needle = { bg: 'desert', sets: [{ enemies: ['needleback'], w: 5 }, { enemies: ['needleback', 'needleback'], w: 3 }, { enemies: ['greedy_urn'], w: 2 }, { enemies: ['needleback', 'greedy_urn'], w: 1 }, { enemies: ['jumbo_needle'], w: 0.35 }] };
  // ---------- the island: an encounter zone on the world map, almost every few steps ----------
  AE.ATOLL = [120, 146, 6.5];
  const tile0 = AE.World.prototype.onTile;
  AE.World.prototype.onTile = function () {
    const A = AE.ATOLL, S = AE.S_;
    if (!this.v && Math.hypot(this.x - A[0], this.y - A[1]) < A[2] && !S.flags.noEnc && !this.placeAt(this.x, this.y)) {
      if (!S.flags.found_atoll) { S.flags.found_atoll = 1; AE.Sfx.play('secret'); AE.notice('Needle Atoll. Something rustles in the sand.'); }
      if (++this.steps >= (this.atollN || (this.atollN = 6 + AE.rand(8)))) {
        this.steps = 0; this.atollN = 5 + AE.rand(9); const self = this; this.busy = true;
        const f = AE.rollFormation('w_needle'); f.bg = 'desert';
        AE.startBattle(f, {}).then(function () { self.busy = false; if (AE.Music) AE.Music.play('world'); });
      }
      return;
    }
    return tile0.apply(this, arguments);
  };
})();
