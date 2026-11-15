/* ================= The save state, the party, stats and items =================
   AE.S_ holds everything a save file keeps. Characters: AE.CHARS[id] (data) + S.m[id] (their progress).
   Stats at a level come from each character's base and growth; gear and Prisms add to them. */
AE.newState = function () {
  return {
    v: 1, playing: false, time: 0, steps: 0, chapter: 1, gold: 300,
    party: ['kael'], reserve: [], m: {}, inv: {}, prisms: [], flags: {}, chests: {}, cards: {},
    map: 'start', x: 0, y: 0, dir: 2, world: null, vehicles: {}, talon: { owned: [] },
    cfg: { atb: 'wait', speed: 3, text: 2, win: null, autorun: false, music: 1, cursor: 'reset' },
    stats: { battles: 0, kills: 0, runs: 0, steals: 0, saves: 0 }, bestiary: {}, quests: {}
  };
};
// ---------- levels ----------
AE.EXP_K = 1.25;   // levelling pace: each level needs 25% more EXP than the original curve
AE.expFor = function (lv) { return lv <= 1 ? 0 : Math.floor(AE.EXP_K * (4 * Math.pow(lv - 1, 2.75) + 18 * (lv - 1))); };   // total EXP to reach lv (Lv 99 ~ 2M)
AE.growStat = function (b, g, lv, k) { return Math.floor(b + g * (lv - 1) + (k || 0) * Math.pow(lv - 1, 2)); };
// make a member: id, level
AE.joinMember = function (id, lv) {
  const S = AE.S_, C = AE.CHARS[id];
  const m = S.m[id] || { id: id, lv: 1, exp: 0, hp: 1, mp: 0, equip: { weapon: C.start.weapon || null, armor: C.start.armor || null, acc: C.start.acc || null }, slots: { weapon: [], armor: [] }, surge: 0, surgeLv: 1, surgeUses: 0, row: C.row || 'front', status: [] };
  m.lv = Math.max(m.lv, lv || 1); m.exp = Math.max(m.exp, AE.expFor(m.lv));
  S.m[id] = m; AE.calc(id); m.hp = m.maxhp; m.mp = m.maxmp;
  return m;
};
AE.ITEMDB = function (id) { return AE.ITEMS[id] || AE.WEAPONS[id] || AE.ARMORS[id] || AE.ACCS[id] || null; };
// derived stats from level, gear and Prisms
AE.calc = function (id) {
  const S = AE.S_, m = S.m[id], C = AE.CHARS[id], lv = m.lv, b = C.base, g = C.grow;
  const st = {
    maxhp: AE.growStat(b.hp, g.hp, lv, g.hp2), maxmp: AE.growStat(b.mp, g.mp, lv, g.mp2),
    str: AE.growStat(b.str, g.str, lv), vit: AE.growStat(b.vit, g.vit, lv), mag: AE.growStat(b.mag, g.mag, lv),
    spr: AE.growStat(b.spr, g.spr, lv), spd: AE.growStat(b.spd, g.spd, lv), lck: AE.growStat(b.lck, g.lck, lv)
  };
  const w = AE.WEAPONS[m.equip.weapon] || { atk: 0, hit: 95 }, a = AE.ARMORS[m.equip.armor] || { def: 0, mdef: 0, eva: 0 }, ac = AE.ACCS[m.equip.acc] || {};
  st.atk = 0; st.def = 0; st.mdef = 0; st.hit = w.hit || 95; st.eva = (a.eva || 0); st.meva = (a.meva || 0);
  const add = function (o) { if (!o) return; for (const k in o) if (typeof o[k] === 'number' && k in st) st[k] += o[k]; };
  add(w.stats); add(a.stats); add(ac.stats);
  st.wpn = w.atk || 0; st.arm = a.def || 0; st.marm = a.mdef || 0;
  // Prisms: abilities and stat changes
  st.abil = { magic: [], command: [], echo: [], support: [], indep: {} };
  const self = this;
  ['weapon', 'armor'].forEach(function (slot) {
    (m.slots[slot] || []).forEach(function (pid, i, arr) {
      if (pid === null || pid === undefined) return;
      const P = S.prisms[pid]; if (!P) return; const D = AE.PRISMS[P.id]; if (!D) return;
      const lvl = AE.prismLevel(P);
      if (D.stats) add(D.stats);
      if (D.type === 'magic') st.abil.magic.push({ pid: pid, id: P.id, lv: lvl, slot: slot, i: i });
      if (D.type === 'command') st.abil.command.push({ pid: pid, id: P.id, lv: lvl });
      if (D.type === 'echo') st.abil.echo.push({ pid: pid, id: P.id, lv: lvl, slot: slot, i: i });
      if (D.type === 'support') st.abil.support.push({ pid: pid, id: P.id, lv: lvl, slot: slot, i: i });
      if (D.type === 'indep') st.abil.indep[D.effect] = (st.abil.indep[D.effect] || 0) + (D.per || 1) * lvl;
    });
  });
  // independent Prisms: HP+, MP+, Speed+...
  const ind = st.abil.indep;
  if (ind.hp) st.maxhp = Math.floor(st.maxhp * (1 + ind.hp / 100));
  if (ind.mp) st.maxmp = Math.floor(st.maxmp * (1 + ind.mp / 100));
  if (ind.spd) st.spd += ind.spd; if (ind.lck) st.lck += ind.lck; if (ind.mag) st.mag += ind.mag; if (ind.str) st.str += ind.str;
  if (ac.effect) st.acc = ac.effect;
  st.maxhp = AE.clamp(st.maxhp, 1, 9999); st.maxmp = AE.clamp(st.maxmp, 0, 999);
  ['str', 'vit', 'mag', 'spr', 'spd', 'lck'].forEach(function (k) { st[k] = AE.clamp(st[k], 1, 255); });
  st.atk += st.str + st.wpn; st.def += st.vit + st.arm; st.mdef += st.spr + st.marm;
  st.elemAtk = w.elem || null; st.armElem = a.elem || null; st.armHalf = a.half || null; st.statusGuard = (a.guard || []).concat(ac.guard || []);
  m.st = st; m.maxhp = st.maxhp; m.maxmp = st.maxmp;
  m.hp = Math.min(m.hp, m.maxhp); m.mp = Math.min(m.mp, m.maxmp);
  return st;
};
AE.calcAll = function () { const S = AE.S_; Object.keys(S.m).forEach(AE.calc); };
// ---------- Prisms ----------
AE.prismLevel = function (P) { const D = AE.PRISMS[P.id], t = D.ap || [0]; let l = 0; for (let i = 0; i < t.length; i++) if (P.ap >= t[i]) l = i + 1; return l; };
AE.prismMaster = function (P) { const D = AE.PRISMS[P.id], t = D.ap || [0]; return P.ap >= t[t.length - 1]; };
AE.addPrism = function (id, ap) { AE.S_.prisms.push({ id: id, ap: ap || 0 }); return AE.S_.prisms.length - 1; };
// ---------- inventory ----------
AE.has = function (id) { return AE.S_.inv[id] || 0; };
AE.addItem = function (id, n) { const S = AE.S_; S.inv[id] = AE.clamp((S.inv[id] || 0) + (n === undefined ? 1 : n), 0, 99); if (!S.inv[id]) delete S.inv[id]; };
AE.itemName = function (id) {
  if (id === 'gold') return 'Gil';
  if (id.indexOf('prism:') === 0) return (AE.PRISMS[id.slice(6)] || {}).name + ' Prism';
  const d = AE.ITEMDB(id); return d ? d.name : id;
};
// gain(id, n): items, gold, Prisms ('prism:fire'), key items; shows the notice
AE.gain = function (id, n) {
  n = n || 1;
  if (id === 'gold') { AE.S_.gold = Math.min(9999999, AE.S_.gold + n); return AE.notice('Found ' + AE.fmt(n) + ' Gil'); }
  if (id.indexOf('prism:') === 0) { for (let i = 0; i < n; i++) AE.addPrism(id.slice(6)); return AE.notice('Received ' + AE.itemName(id) + (n > 1 ? ' x' + n : '')); }
  if (id.indexOf('card:') === 0) { AE.S_.cards[id.slice(5)] = (AE.S_.cards[id.slice(5)] || 0) + n; return AE.notice('Got the Arcana card ' + ((AE.CARDS || {})[id.slice(5)] || {}).name); }
  AE.addItem(id, n);
  return AE.notice('Received ' + AE.itemName(id) + (n > 1 ? ' x' + n : ''));
};
AE.member = function (id) { return AE.S_.m[id]; };
AE.partyMembers = function () { return AE.S_.party.map(function (id) { return AE.S_.m[id]; }).filter(Boolean); };
AE.healAll = function () { AE.partyMembers().concat(AE.S_.reserve.map(function (id) { return AE.S_.m[id]; })).forEach(function (m) { if (!m) return; AE.calc(m.id); m.hp = m.maxhp; m.mp = m.maxmp; m.status = []; }); };
AE.setFlag = function (f, v) { AE.S_.flags[f] = v === undefined ? 1 : v; };
