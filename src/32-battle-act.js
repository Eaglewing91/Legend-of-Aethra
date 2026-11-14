/* ================= Battle actions ================= */
AE.Battle.prototype.perform = async function (act) {
  const B = this, u = act.user, k = act.kind;
  if (!AE.canAct(u) && k !== 'surge') { B.endTurn(u); return; }
  act.targets = (act.targets || []).filter(function (t) { return act.ko ? !t.gone : AE.alive(t); });
  if (!act.targets.length && act.need !== false) {
    // retarget a living foe or friend of the same side as the original pick
    const pool = act.side === 'friends' ? B.friends(u) : B.foes(u);
    if (!pool.length) { B.endTurn(u); return; }
    act.targets = act.all ? pool : [AE.pick(pool)];
  }
  switch (k) {
    case 'attack': await B.doAttack(u, act.targets[0], {}); break;
    case 'magic': await B.doSpell(u, act.id, act.targets, act); break;
    case 'echo': await B.doEcho(u, act.id, act.targets, act); break;
    case 'item': await B.doItem(u, act.id, act.targets); break;
    case 'surge': await B.doSurge(u, act.id, act.targets); break;
    case 'skill': await B.doSkill(u, act.id, act.targets); break;
    case 'steal': await B.doSteal(u, act.targets[0], act.mug); break;
    case 'sense': await B.doSense(u, act.targets[0]); break;
    case 'throw': await B.doThrow(u, act.id, act.targets[0]); break;
    case 'morph': await B.doAttack(u, act.targets[0], { morph: 1 }); break;
    case 'deathblow': await B.doAttack(u, act.targets[0], { crit: 1, hitMod: -30 }); break;
    case 'run': B.tryRun(); break;
    case 'wait': await AE.wait(10); break;
  }
  B.endTurn(u);
};
AE.Battle.prototype.step = async function (u, fwd) {
  // party steps left toward the enemies, enemies flash
  if (u.side === 'party') { u.anim = 'move'; for (let i = 0; i < 8; i++) { u.x = u.hx - (fwd ? i * 2 : (8 - i) * 2) - (fwd ? 0 : 0); await AE.wait(1); } if (!fwd) u.x = u.hx; u.anim = 'ready'; }
  else { u.flash = 12; await AE.wait(10); }
};
AE.Battle.prototype.pose = async function (u, anim, frames) {
  if (u.side !== 'party') { u.flash = 8; await AE.wait(frames || 12); return; }
  u.anim = anim; u.t = 0; await AE.wait(frames || 18); u.anim = 'ready';
};
AE.Battle.prototype.doAttack = async function (u, t, o) {
  const B = this; o = o || {};
  await B.step(u, true);
  const C = u.side === 'party' ? AE.CHARS[u.id] : null;
  const anim = C ? (C.weap === 'lance' ? 'thrust' : C.weap === 'gun' ? 'thrust' : 'slash') : 'attack';
  await B.pose(u, anim, 12);
  B.addFx(u.side === 'party' ? (C.weap === 'gun' ? 'shot' : C.weap === 'fist' ? 'claw' : 'slash') : (u.d.hitFx || 'claw'), t);
  AE.Sfx && AE.Sfx.play(C && C.weap === 'gun' ? 'shot' : 'hit');
  await AE.wait(8);
  B.hitOnce(u, t, 1, Object.assign({ elem: u.elemAtk || (u.d && u.d.elemAtk) }, o));
  // counter
  if (t.side === 'party' && AE.alive(t) && t.abil && t.abil.support.some(function (s) { return s.id === 'counter'; }) && Math.random() < 0.4 && AE.canAct(t)) {
    await AE.wait(10); B.say('Counter'); await B.doAttack(t, u, { counter: 1 });
  }
  await AE.wait(12);
  await B.step(u, false);
};
// one physical hit: returns damage dealt or -1 for a miss
AE.Battle.prototype.hitOnce = function (u, t, power, o) {
  const B = this; o = o || {};
  if (!AE.alive(t)) return -1;
  if (t.status.vanish && !o.magic) { B.pop(t, 'Miss', '#ccc'); return -1; }
  if (!o.sure && Math.random() > AE.hitChance(u, t) + (o.hitMod || 0) / 100) { B.pop(t, 'Miss', '#ccc'); return -1; }
  const crit = o.crit || Math.random() < AE.critChance(u, t);
  let d = AE.physDamage(u, t, power, { crit: crit, pierce: o.pierce, ranged: o.ranged });
  const em = AE.elemMod(t, o.elem);
  if (o.morph && t.side === 'enemy') d = Math.floor(d / 8);
  if (em === -1) { B.healHp(t, d); return 0; }
  d = Math.floor(d * em);
  if (crit) B.pop(t, 'Critical!', '#ff8');
  B.hurt(t, Math.max(1, d), { col: em > 1 ? '#ffd040' : '#fff' });
  if (o.morph && t.side === 'enemy' && !AE.alive(t) && t.d.morph) { AE.gainQuiet(t.d.morph); B.say('Morphed into ' + AE.itemName(t.d.morph)); }
  if (u.side === 'party' && u.m && AE.WEAPONS[u.m.equip.weapon] && AE.WEAPONS[u.m.equip.weapon].addStatus && Math.random() < 0.25) AE.giveStatus(t, AE.WEAPONS[u.m.equip.weapon].addStatus);
  if (u.side === 'enemy' && u.d.addStatus && Math.random() < (u.d.addChance || 0.25)) { if (AE.giveStatus(t, u.d.addStatus)) B.pop(t, AE.cap(u.d.addStatus), AE.STATUS_INFO[u.d.addStatus].col); }
  // HP absorb support
  return d;
};
AE.cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
// spells (and enemy magic): kind mag | heal | status | buff | cure | revive | gravity | drain | scan
AE.Battle.prototype.doSpell = async function (u, id, targets, act) {
  const B = this, S = AE.SPELLS[id] || AE.SKILLS[id]; if (!S) return;
  const cost = act && act.free ? 0 : (S.mp || 0);
  if (u.mp < cost) { B.say('Not enough MP'); return; }
  if (u.status.silence && !(act && act.skill)) { B.say('Silenced!'); return; }
  u.mp -= cost;
  B.say(S.name, 50);
  await B.pose(u, 'cast', 20);
  const multi = targets.length > 1;
  for (let rep = 0; rep < (S.hits || 1) * (act && act.double ? 2 : 1); rep++) {
    const ts = (S.hits && S.hits > 1 && !S.all) ? [AE.pick(targets.filter(AE.alive).length ? targets.filter(AE.alive) : targets)] : targets;
    ts.forEach(function (t) { B.addFx(S.fx || 'spark', t); });
    AE.Sfx && AE.Sfx.play('spell_' + (S.fx || 'spark'));
    await AE.wait(22);
    ts.forEach(function (t0) {
      let t = t0;
      if (t.status.reflect && S.kind !== 'scan' && u !== t && !S.noReflect) { const back = u.side === t.side ? B.friends(t) : B.foes(t); if (back.length) { B.pop(t, 'Reflect', '#cff'); t = AE.pick(back); } }
      B.applySpell(u, t, S, { multi: multi && !S.all });
    });
    await AE.wait(14);
  }
};
AE.Battle.prototype.applySpell = function (u, t, S, o) {
  const B = this; o = o || {};
  if (S.kind === 'revive') {
    if (t.hp > 0 && AE.alive(t)) { B.pop(t, 'No effect', '#ccc'); return; }
    if (t.d && t.d.undead) { B.kill(t); return; }
    t.hp = Math.max(1, Math.floor(t.maxhp * (S.power || 0.25))); t.anim = 'ready'; t.atb = 0; t.waiting = false; B.pop(t, 'Revived', '#7f7'); return;
  }
  if (!AE.alive(t)) return;
  if (S.kind === 'heal') {
    let h = S.full ? t.maxhp : AE.healAmount(u, S.power) * (o.multi ? 0.6 : 1);
    if (t.d && t.d.undead) { B.hurt(t, h); return; }
    B.healHp(t, h);
    if (S.cure) B.cure(t, AE.ITEMS.remedy.use.cure);
  } else if (S.kind === 'mag' || S.kind === 'drain') {
    if (t.meva && Math.random() * 100 < t.meva) { B.pop(t, 'Miss', '#ccc'); return; }
    let d = AE.magDamage(u, t, S.power, { split: o.multi });
    const em = AE.elemMod(t, S.elem);
    if (em === -1) { B.healHp(t, d); return; }
    d = Math.floor(d * em);
    if (d <= 0 && em === 0) { B.pop(t, 'Immune', '#ccc'); }
    else B.hurt(t, Math.max(1, d), { col: em > 1 ? '#ffd040' : '#fff' });
    if (S.kind === 'drain') B.healHp(u, Math.min(d, t.hp + d));
  } else if (S.kind === 'drainmp') {
    const d = Math.min(t.mp, Math.floor(AE.magDamage(u, t, S.power) / 4)); t.mp -= d; u.mp = Math.min(u.maxmp, u.mp + d); B.pop(u, d + ' MP', '#8cf');
  } else if (S.kind === 'gravity') {
    if (t.d && t.d.boss && t.d.noGravity) { B.pop(t, 'Immune', '#ccc'); return; }
    B.hurt(t, Math.max(1, Math.floor(t.hp * S.power)));
  } else if (S.kind === 'scan') {
    B.scan(t); return;
  } else if (S.kind === 'cure') { B.cure(t, S.cure); return; }
  if (S.status) {
    const hit = S.kind === 'buff' ? 101 : (S.hit || 100);
    S.status.forEach(function (s) {
      if (Math.random() * 100 < hit - (t.lv - u.lv) && AE.alive(t)) { if (AE.giveStatus(t, s)) B.pop(t, AE.cap(s), (AE.STATUS_INFO[s] || {}).col || '#fff'); else if (S.kind !== 'mag') B.pop(t, 'Immune', '#ccc'); }
      else if (S.kind !== 'mag') B.pop(t, 'Miss', '#ccc');
    });
  }
};
AE.Battle.prototype.cure = function (t, list) {
  let any = false; (list || []).forEach(function (s) { if (t.status[s]) { delete t.status[s]; any = true; } });
  if (any) this.pop(t, 'Cured', '#7f7'); if (t.status.stone === undefined && t.anim === 'stone') t.anim = 'ready';
};
AE.Battle.prototype.scan = function (t) {
  const D = t.d || {}, w = (D.weak || []).join(', ') || 'none';
  this.say(t.name + '  Lv ' + t.lv + '  HP ' + t.hp + '/' + t.maxhp + '  Weak: ' + w, 140);
  AE.S_.bestiary['scan:' + t.id] = 1;
};
AE.Battle.prototype.doEcho = async function (u, id, targets, act) {
  const B = this, E = AE.ECHOES[id]; if (!E) return;
  if (u.mp < E.mp) { B.say('Not enough MP'); return; }
  u.mp -= E.mp; B.say(E.name, 90);
  await B.pose(u, 'cast', 24);
  B.echo = { id: id, t: 0 }; AE.Sfx && AE.Sfx.play('echo'); AE.game.flash = 10;
  await AE.wait(70);
  const ts = E.kind === 'heal' ? B.friends(u) : B.foes(u);
  ts.forEach(function (t) { B.addFx(E.fx, t); });
  AE.Sfx && AE.Sfx.play('spell_' + E.fx); await AE.wait(24);
  const lv = (act && act.lv) || 1;
  ts.forEach(function (t) {
    if (E.kind === 'heal') { B.healHp(t, AE.healAmount(u, E.power) * (1 + lv * 0.1)); (E.status || []).forEach(function (s) { AE.giveStatus(t, s); }); }
    else { const em = AE.elemMod(t, E.elem); let d = Math.floor(AE.magDamage(u, t, E.power * (1 + (lv - 1) * 0.08)) * (em === -1 ? 1 : em)); if (em === -1) B.healHp(t, d); else B.hurt(t, Math.max(1, d)); if (E.status) E.status.forEach(function (s) { if (Math.random() < 0.5) AE.giveStatus(t, s); }); }
  });
  await AE.wait(30); B.echo = null;
};
AE.Battle.prototype.doItem = async function (u, id, targets) {
  const B = this, I = AE.ITEMS[id]; if (!I) return;
  if (!AE.has(id)) { B.say('None left'); return; }
  AE.addItem(id, -1); B.say(I.name, 50);
  await B.pose(u, 'throw', 16);
  if (I.battle === 'escape') { if (B.form.noRun) B.say('Can\'t escape!'); else { B.say('Escaped!'); B.finish('run', 40); } return; }
  const U = I.use || {};
  targets.forEach(function (t) { B.addFx(U.damage ? (U.elem === 'ice' ? 'ice' : U.elem === 'bolt' ? 'bolt' : 'fire') : 'heal', t); });
  AE.Sfx && AE.Sfx.play(U.damage ? 'boom' : 'heal'); await AE.wait(20);
  targets.forEach(function (t) {
    if (U.revive) { if (t.hp <= 0) { t.hp = Math.max(1, Math.floor(t.maxhp * U.revive)); t.anim = 'ready'; t.atb = 0; t.waiting = false; B.pop(t, 'Revived', '#7f7'); } else B.pop(t, 'No effect', '#ccc'); return; }
    if (!AE.alive(t)) return;
    if (U.heal) { if (t.d && t.d.undead) B.hurt(t, U.heal); else B.healHp(t, U.heal); }
    if (U.mp) { const v = Math.min(t.maxmp - t.mp, U.mp); t.mp += v; B.pop(t, v + ' MP', '#8cf'); }
    if (U.cure) B.cure(t, U.cure);
    if (U.status) U.status.forEach(function (s) { AE.giveStatus(t, s); B.pop(t, AE.cap(s), AE.STATUS_INFO[s].col); });
    if (U.damage) { const em = AE.elemMod(t, U.elem); B.hurt(t, Math.max(1, Math.floor(AE.variance(U.damage) * Math.max(0, em)))); }
    if (U.boost && t.m) { t.m.bonus = t.m.bonus || {}; t.m.bonus[U.boost] = (t.m.bonus[U.boost] || 0) + 1; B.pop(t, U.boost.toUpperCase() + ' +1', '#ffd040'); }
  });
  await AE.wait(16);
};
AE.Battle.prototype.doSurge = async function (u, id, targets) {
  const B = this, L = AE.SURGES[id]; if (!L) return;
  u.surge = 0; u.m.surgeUses = (u.m.surgeUses || 0) + 1;
  B.say(L.name, 80); AE.game.flash = 8; AE.Sfx && AE.Sfx.play('surge');
  if (L.kind === 'phys') await B.step(u, true);
  await B.pose(u, L.anim || 'cast', 20);
  if (L.kind === 'heal' || L.kind === 'buff') {
    const ts = L.target === 'self' ? [u] : B.friends(u, L.revive);
    ts.forEach(function (t) { B.addFx('heal', t); }); await AE.wait(24);
    ts.forEach(function (t) {
      if (L.revive && t.hp <= 0) { t.hp = Math.floor(t.maxhp); t.anim = 'ready'; t.atb = 0; t.waiting = false; B.pop(t, 'Revived', '#7f7'); }
      if (!AE.alive(t)) return;
      if (L.power) B.healHp(t, L.full ? t.maxhp : t.maxhp * L.power);
      if (L.cure) B.cure(t, AE.ITEMS.remedy.use.cure);
      (L.status || []).forEach(function (s) { AE.giveStatus(t, s, { force: 1 }); });
    });
  } else {
    for (let h = 0; h < (L.hits || 1); h++) {
      const live = B.foes(u); if (!live.length) break;
      const ts = L.target === 'enemies' ? live : L.target === 'random' ? [AE.pick(live)] : [AE.alive(targets[0]) ? targets[0] : AE.pick(live)];
      ts.forEach(function (t) { B.addFx(L.kind === 'mag' ? 'holy' : 'slash', t); });
      AE.Sfx && AE.Sfx.play('hit'); await AE.wait(10);
      ts.forEach(function (t) {
        if (L.kind === 'gravity') { B.hurt(t, Math.max(1, Math.floor(t.hp * L.power))); return; }
        let power = L.power;
        if (L.missing) power *= 1 + (1 - u.hp / u.maxhp) * 2;
        if (L.kind === 'mag') B.hurt(t, Math.floor(AE.magDamage(u, t, power * 8) * Math.max(0, AE.elemMod(t, L.elem))));
        else B.hitOnce(u, t, power, { sure: 1, crit: L.crit, pierce: L.pierce, elem: L.elem, ranged: 1 });
        if (L.steal) B.stealFrom(u, t, true);
        (L.status || []).forEach(function (s) { if (s === 'vanish') AE.giveStatus(u, s); });
      });
      await AE.wait(6);
    }
    await AE.wait(14);
    if (L.kind === 'phys') await B.step(u, false);
  }
  u.anim = 'ready';
};
AE.Battle.prototype.doSkill = async function (u, id, targets) {
  const B = this, K = AE.SKILLS[id]; if (!K) return;
  if (K.kind === 'phys') {
    B.say(K.name, 50); await B.step(u, true); await B.pose(u, 'slash', 10);
    for (let h = 0; h < (K.hits || 1); h++) {
      targets.filter(AE.alive).forEach(function (t) { B.addFx(K.fx || 'claw', t); }); AE.Sfx && AE.Sfx.play('hit'); await AE.wait(10);
      targets.forEach(function (t) {
        const d = B.hitOnce(u, t, K.power || 1, { elem: K.elem, sure: K.sure, pierce: K.pierce });
        if (d > 0 && K.status) K.status.forEach(function (s) { if (Math.random() * 100 < (K.hit || 50) && AE.giveStatus(t, s)) B.pop(t, AE.cap(s), AE.STATUS_INFO[s].col); });
        if (d > 0 && K.drain) B.healHp(u, d);
      });
    }
    await AE.wait(12); await B.step(u, false); return;
  }
  if (K.kind === 'special') { await (AE.SPECIALS[id] || function () {})(B, u, targets, K); return; }
  await B.doSpell(u, id, targets, { free: !K.mp, skill: 1 });
};
AE.Battle.prototype.stealFrom = function (u, t, quiet) {
  const B = this, D = t.d || {};
  if (t.stolen || !(D.steal && D.steal.length)) { if (!quiet) B.say('Nothing to steal'); return false; }
  const base = 40 + (u.lv - t.lv) * 2 + u.lck / 3;
  for (let i = D.steal.length - 1; i >= 0; i--) {
    const it = D.steal[i];
    if (Math.random() * 100 < base * it[1]) { t.stolen = 1; AE.gainQuiet(it[0]); AE.S_.stats.steals++; B.say('Stole ' + AE.itemName(it[0]) + '!', 80); return true; }
  }
  if (!quiet) B.say('Couldn\'t steal anything');
  return false;
};
AE.Battle.prototype.doSteal = async function (u, t, mug) {
  const B = this; await B.step(u, true); await B.pose(u, mug ? 'slash' : 'thrust', 12);
  if (mug) B.hitOnce(u, t, 1, {});
  B.stealFrom(u, t); await AE.wait(20); await B.step(u, false);
};
AE.Battle.prototype.doSense = async function (u, t) { await this.pose(u, 'cast', 12); this.scan(t); await AE.wait(30); };
AE.Battle.prototype.doThrow = async function (u, id, t) {
  const B = this, W = AE.WEAPONS[id]; if (!W || !AE.has(id)) return; AE.addItem(id, -1);
  B.say('Throw: ' + W.name, 50); await B.pose(u, 'throw', 14); B.addFx('slash', t); await AE.wait(8);
  B.hurt(t, Math.max(1, Math.floor(AE.physDamage(u, t, 1, { ranged: 1 }) * (1 + W.atk / 30))));
  await AE.wait(14);
};
