/* ================= Battle rules: fighters, damage, status, actions =================
   Formulas follow the classic ATB games: physical damage grows with Attack and level against (512 - Defence);
   magic with Magic and level against (512 - Magic Defence). ATB fills from Speed. */
AE.Fighter = function (o) { Object.assign(this, o); };
AE.mkParty = function (id, slot) {
  const S = AE.S_, m = S.m[id], C = AE.CHARS[id]; AE.calc(id); const st = m.st;
  const f = new AE.Fighter({ side: 'party', id: id, name: C.name, m: m, lv: m.lv, hp: m.hp, maxhp: m.maxhp, mp: m.mp, maxmp: m.maxmp,
    atk: st.atk, def: st.def, mag: st.mag, mdef: st.mdef, spd: st.spd, lck: st.lck, str: st.str, hit: st.hit, eva: st.eva, meva: st.meva,
    elemAtk: st.elemAtk, half: st.armHalf, guard: st.statusGuard, row: m.row, long: !!(AE.WEAPONS[m.equip.weapon] || {}).long || !!st.abil.indep.long,
    abil: st.abil, status: {}, atb: Math.random() * 0.5, slot: slot, surge: m.surge || 0, anim: 'ready', t: 0 });
  (m.status || []).forEach(function (s) { f.status[s] = 999; });
  if (st.acc === 'haste') f.status.haste = 9999; if (st.acc === 'protect') { f.status.protect = 9999; f.status.shell = 9999; }
  if (st.acc === 'regen') f.status.regen = 9999; if (st.acc === 'berserk') f.status.berserk = 9999;
  return f;
};
AE.mkEnemy = function (id, slot, o) {
  const D = AE.ENEMIES[id]; if (!D) throw new Error('no enemy ' + id);
  return new AE.Fighter(Object.assign({ side: 'enemy', id: id, d: D, name: D.name, lv: D.lv, hp: D.hp, maxhp: D.hp, mp: D.mp || 99, maxmp: D.mp || 99,
    atk: D.atk, def: D.def, mag: D.mag, mdef: D.mdef, spd: D.spd, lck: D.lck || 10, hit: D.hit || 95, eva: D.eva || 0, meva: D.meva || 0,
    status: {}, atb: Math.random() * 0.7, slot: slot, anim: 'idle', t: Math.random() * 10, ai: { n: 0, vars: {} } }, o || {}));
};
AE.alive = function (f) { return f.hp > 0 && !f.status.stone && !f.gone; };
AE.canAct = function (f) { return AE.alive(f) && !f.status.sleep && !f.status.paralyse && !f.status.stop; };
// ---------- damage ----------
AE.variance = function (n) { return Math.floor(n * (3841 + AE.rand(256)) / 4096); };
AE.physDamage = function (a, t, power, o) {
  o = o || {};
  const atk = a.status.berserk ? a.atk * 1.5 : a.atk, lv = a.lv;
  let base = atk + ((atk + lv) / 32) * ((atk * lv) / 32);
  let dmg = (power * 16) * (512 - Math.min(511, o.pierce ? 0 : t.def)) * base / (16 * 512);
  if (o.crit) dmg *= 2;
  if (a.side === 'enemy' && lv > 30) dmg *= Math.max(0.5, 1 - (lv - 30) * 0.0125);   // the level curve grows fast: late enemies hit a little softer
  if (!o.pierce && t.status.protect) dmg /= 2;
  if (t.defending) dmg /= 2;
  if (a.side === 'party' && a.row === 'back' && !a.long && !o.ranged) dmg /= 2;
  if (t.side === 'party' && t.row === 'back' && !o.ranged) dmg /= 2;
  if (a.status.frog) dmg /= 4;
  return AE.variance(dmg);
};
AE.magDamage = function (a, t, power, o) {
  o = o || {};
  let base = 6 * (a.mag + a.lv);
  let dmg = power * (512 - Math.min(511, t.mdef)) * base / (16 * 512);
  if (t.status.shell) dmg /= 2;
  if (o.split) dmg /= 2;   // spells on all targets lose a little
  return AE.variance(dmg);
};
AE.healAmount = function (a, power) { return AE.variance((power * 22 + 6 * (a.mag + a.lv) * power / 10)); };
// element: returns multiplier (-1 = absorb)
AE.elemMod = function (t, elem) {
  if (!elem) return 1;
  const D = t.d || {};
  if (t.side === 'enemy') {
    if ((D.absorb || []).indexOf(elem) >= 0) return -1;
    if ((D.immune || []).indexOf(elem) >= 0) return 0;
    if ((D.weak || []).indexOf(elem) >= 0) return 2;
    if ((D.resist || []).indexOf(elem) >= 0) return 0.5;
  } else if (t.half && t.half.indexOf(elem) >= 0) return 0.5;
  if (t.status.frog && elem === 'ice') return 1.5;
  return 1;
};
AE.critChance = function (a, t) { return AE.clamp((a.lck + a.lv - t.lv) / 4, 1, 40) / 100; };
AE.hitChance = function (a, t) {
  let h = a.hit + Math.floor(a.lck / 4) - (t.eva || 0);
  if (a.status.blind) h -= 50; if (t.status.sleep || t.status.paralyse || t.status.stop) h = 255;
  return AE.clamp(h, 5, 255) / 100;
};
// apply a status (respecting immunities and guards); dur in seconds of battle time
AE.STATUS_DUR = { poison: 999, blind: 999, silence: 999, sleep: 20, paralyse: 10, confuse: 25, berserk: 999, stone: 999, doom: 60, frog: 999, slow: 40, stop: 15, haste: 60, protect: 90, shell: 90, regen: 60, reflect: 60, float: 999, vanish: 12 };
AE.giveStatus = function (t, s, o) {
  const D = t.d || {};
  if ((D.immuneStatus || []).indexOf(s) >= 0) return false;
  if (t.guard && t.guard.indexOf(s) >= 0) return false;
  if (D.boss && ['stone', 'doom', 'stop', 'frog', 'confuse', 'sleep', 'paralyse'].indexOf(s) >= 0 && !(o && o.force)) return false;
  if (s === 'haste') delete t.status.slow; if (s === 'slow') delete t.status.haste;
  t.status[s] = AE.STATUS_DUR[s] || 60;
  if (s === 'stone' || s === 'doom') { if (s === 'stone') t.atb = 0; }
  return true;
};
// ---------- encounters ----------
AE.rollFormation = function (group) {
  const G = AE.ENC[group]; if (!G) return null;
  const tot = G.sets.reduce(function (a, s) { return a + (s.w || 1); }, 0); let r = Math.random() * tot;
  for (let i = 0; i < G.sets.length; i++) { r -= G.sets[i].w || 1; if (r <= 0) return Object.assign({ bg: G.bg, music: G.music }, G.sets[i]); }
  return Object.assign({ bg: G.bg }, G.sets[0]);
};
// ---------- rewards ----------
AE.giveExp = function (members, exp) {
  const ups = [];
  members.forEach(function (m) {
    const before = m.lv; m.exp += exp;
    while (m.lv < 99 && m.exp >= AE.expFor(m.lv + 1)) m.lv++;
    if (m.lv > before) { const oldmax = m.maxhp; AE.calc(m.id); m.hp += m.maxhp - oldmax; ups.push({ id: m.id, from: before, to: m.lv }); }
  });
  return ups;
};
AE.giveAp = function (members, ap) {
  const S = AE.S_, mastered = [];
  members.forEach(function (m) {
    ['weapon', 'armor'].forEach(function (slot) {
      const it = slot === 'weapon' ? AE.WEAPONS[m.equip.weapon] : AE.ARMORS[m.equip.armor]; const growth = it && it.growth === 0 ? 0 : 1;
      (m.slots[slot] || []).forEach(function (pid) {
        if (pid === null || pid === undefined) return; const P = S.prisms[pid]; if (!P) return;
        const before = AE.prismLevel(P), wasM = AE.prismMaster(P); P.ap += ap * growth;
        if (!wasM && AE.prismMaster(P)) { mastered.push(P.id); if ((AE.PRISMS[P.id].ap || []).length > 1) AE.addPrism(P.id, 0); }
        else if (AE.prismLevel(P) > before) mastered.push('lv:' + P.id);
      });
    });
    AE.calc(m.id);
  });
  return mastered;
};
