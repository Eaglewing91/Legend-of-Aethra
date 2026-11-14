/* ================= Story tools: timers, party changes, quests ================= */
// A countdown shown on the field (the reactor escape). When it runs out, AE.EV[ev] runs (usually a game over).
AE.Timer = {
  start: function (seconds, ev, label) { AE.S_.timer = { f: Math.round(seconds * 60), ev: ev, label: label || 'TIME' }; },
  stop: function () { AE.S_.timer = null; },
  left: function () { return AE.S_.timer ? Math.ceil(AE.S_.timer.f / 60) : 0; }
};
(function () {
  const up = AE.Field.prototype.update;
  AE.Field.prototype.update = function (g) {
    const T = AE.S_ && AE.S_.timer;
    if (T && T.f > 0 && !this.paused) {
      T.f--;
      if (T.f <= 0) { const ev = T.ev; AE.S_.timer = null; this.locked = 0; this.run(ev); }
    }
    return up.call(this, g);
  };
  const dr = AE.Field.prototype.draw;
  AE.Field.prototype.draw = function (ctx) {
    dr.call(this, ctx);
    const T = AE.S_ && AE.S_.timer; if (!T) return;
    const s = Math.ceil(T.f / 60), txt = Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
    AE.window(ctx, AE.W - 62, 6, 56, 22);
    AE.text(ctx, txt, AE.W - 34, 12, s <= 30 && (AE.game.frame >> 4) % 2 ? '#ff6060' : '#fff', { align: 'center' });
  };
  // the timer keeps running during battles (and battles cost time)
  if (AE.Battle) {
    const tk = AE.Battle.prototype.tick;
    if (tk) AE.Battle.prototype.tick = function () { const T = AE.S_.timer; if (T && T.f > 60) T.f--; return tk.apply(this, arguments); };
  }
})();

// put a new Prism straight into a member's first free slot (gifts that should be ready to use)
AE.slotPrism = function (mid, pid) {
  const S = AE.S_, m = S.m[mid]; if (!m) return AE.addPrism(pid);
  const k = AE.addPrism(pid);
  for (const slot of ['weapon', 'armor']) {
    const G = slot === 'weapon' ? AE.WEAPONS[m.equip.weapon] : AE.ARMORS[m.equip.armor]; const n = G ? G.slots || 0 : 0;
    m.slots[slot] = m.slots[slot] || [];
    for (let i = 0; i < n; i++) if (m.slots[slot][i] === null || m.slots[slot][i] === undefined) { m.slots[slot][i] = k; AE.calc(mid); return k; }
  }
  return k;
};
// set the battle party (others go to the reserve); members not yet joined are joined at the party's level
AE.setParty = function (ids, lv) {
  const S = AE.S_;
  const avg = Math.max(1, Math.round(AE.partyMembers().reduce(function (a, m) { return a + m.lv; }, 0) / Math.max(1, AE.partyMembers().length)));
  ids.forEach(function (id) { if (!S.m[id]) AE.joinMember(id, lv || avg); });
  const all = S.party.concat(S.reserve).concat(ids).filter(function (v, i, a) { return a.indexOf(v) === i; });
  S.party = ids.slice(0, 3); S.reserve = all.filter(function (id) { return S.party.indexOf(id) < 0 && S.m[id] && !(S.away || {})[id]; });
  if (AE.field()) AE.field().player.who = S.party[0];
};
// members away on the story's business (not in the party or the reserve until they come back)
AE.away = function (id, v) { const S = AE.S_; S.away = S.away || {}; if (v === false) { delete S.away[id]; if (S.m[id] && S.party.indexOf(id) < 0 && S.reserve.indexOf(id) < 0) S.reserve.push(id); } else { S.away[id] = 1; S.party = S.party.filter(function (p) { return p !== id; }); S.reserve = S.reserve.filter(function (p) { return p !== id; }); } };

// quests: S.quests[id] = 0 (offered) .. 'done'. AE.QUESTS holds the names for the menu.
AE.QUESTS = {};
AE.quest = function (id, v) { const S = AE.S_; if (v === undefined) return S.quests[id]; S.quests[id] = v; return v; };

// a little helper for "give one item, take a key item" exchanges
AE.take = function (id, n) { AE.addItem(id, -(n || 1)); };
AE.pay = function (g) { if (AE.S_.gold < g) return false; AE.S_.gold -= g; return true; };

// game over by story (the reactor goes up with you in it)
AE.EV.timeout_reactor = async function () {
  await AE.cs.shake(60); AE.game.flash = 30; await AE.wait(30);
  await AE.cs.narrate(['Reactor 4 tore itself apart.', 'Nobody below the plate ever learned who had been inside.']);
  AE.Timer.stop(); AE.gameOver();
};
// generated-floor puzzles: n switches open the seal 'key' (see tools/maps/_gen.py switches())
AE.EV.gen_switch = async function (e) {
  const S = AE.S_, f = e.key + '_' + e.n, words = { valve: 'You heave the valve wheel round. Pipes groan somewhere.', terminal: 'You key the override into the terminal. It beeps grudgingly.',
    lever: 'You pull the lever. Something clanks far away.', rune: 'You touch the rune. It flares and stays lit.', crystal: 'The crystal hums and turns bright.', orb: 'The orb lights up.' };
  if (S.flags[f]) { await AE.say('Already done.'); return; }
  S.flags[f] = 1; AE.Sfx.play('door');
  let n = 0; for (let k = 0; k < e.of; k++) if (S.flags[e.key + '_' + k]) n++;
  await AE.say((words[e.kind] || 'Done.') + ' (' + n + ' of ' + e.of + ')');
  if (n >= e.of) { AE.cs.flag(e.key); AE.Sfx.play('secret'); await AE.notice('A seal on this floor opens.'); }
};
AE.EV.gen_seal = async function (e) {
  let n = 0; for (let k = 0; k < e.of; k++) if (AE.S_.flags[e.key + '_' + k]) n++;
  const what = { valve: 'valves', terminal: 'security terminals', lever: 'levers', rune: 'runes', crystal: 'crystals', orb: 'orbs' }[e.kind] || 'switches';
  await AE.say('A heavy seal blocks the way on. ' + e.of + ' ' + what + ' somewhere on this floor control it. (' + n + ' of ' + e.of + ' done)');
};
