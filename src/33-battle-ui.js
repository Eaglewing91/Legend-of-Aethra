/* ================= Battle: enemy AI, the command menu, drawing ================= */
// enemy AI: D.ai = [[weight, action, condition?]...] or a function name in AE.AI. action: 'attack' | skill id | spell id
AE.AI = {};
AE.enemyAct = function (f, B) {
  const D = f.d, foes = B.foes(f), friends = B.friends(f);
  if (!foes.length) return null;
  if (f.status.confuse) return { kind: 'attack', targets: [AE.pick(Math.random() < 0.5 ? friends : foes)] };
  if (typeof D.ai === 'string' && AE.AI[D.ai]) { const a = AE.AI[D.ai](f, B); if (a) return a; }
  const list = (Array.isArray(D.ai) ? D.ai : [[1, 'attack']]).filter(function (r) { return !r[2] || AE.aiCond(r[2], f, B); });
  const tot = list.reduce(function (a, r) { return a + r[0]; }, 0); let r = Math.random() * tot, pick = list[0];
  for (let i = 0; i < list.length; i++) { r -= list[i][0]; if (r <= 0) { pick = list[i]; break; } }
  return AE.mkAct(f, B, pick[1]);
};
AE.aiCond = function (c, f, B) {
  if (c === 'hurt') return f.hp < f.maxhp * 0.5;
  if (c === 'low') return f.hp < f.maxhp * 0.25;
  if (c === 'alone') return B.friends(f).length === 1;
  if (c === 'ally_hurt') return B.friends(f).some(function (x) { return x.hp < x.maxhp * 0.5; });
  if (c === 'mp') return f.mp > 20;
  if (c.indexOf('turn%') === 0) return (f.ai.n % +c.slice(5)) === 0;
  if (c.indexOf('phase') === 0) return (f.ai.vars.phase || 0) === +c.slice(5);
  return true;
};
AE.mkAct = function (f, B, what) {
  f.ai.n++;
  const foes = B.foes(f), friends = B.friends(f);
  if (what === 'attack') return { kind: 'attack', targets: [AE.weakest(foes, f)] };
  if (what === 'wait') return { kind: 'wait', targets: [f], need: false };
  const K = AE.SKILLS[what] || AE.SPELLS[what]; if (!K) return { kind: 'attack', targets: [AE.pick(foes)] };
  const heal = K.kind === 'heal' || K.kind === 'buff' || K.kind === 'cure';
  let t = heal ? (K.target === 'self' ? [f] : K.all || K.target === 'all' ? friends : [friends.slice().sort(function (a, b) { return a.hp / a.maxhp - b.hp / b.maxhp; })[0]]) : (K.all || K.target === 'all' ? foes : [AE.pick(foes)]);
  return { kind: 'skill', id: what, targets: t, side: heal ? 'friends' : 'foes', all: K.all };
};
AE.weakest = function (foes, f) { return Math.random() < 0.3 ? foes.slice().sort(function (a, b) { return a.hp - b.hp; })[0] : AE.pick(foes); };

// ---------- the command menu ----------
AE.BattleMenu = function (f, B) {
  this.f = f; this.B = B; this.depth = 0; this.sub = null; this.target = null;
  this.cmds = this.build(); this.list = new AE.List(this.cmds, { rows: 6 });
  if (AE.S_.cfg.cursor === 'memory' && f.m.lastCmd !== undefined) this.list.sel = Math.min(f.m.lastCmd, this.cmds.length - 1);
};
AE.BattleMenu.prototype.build = function () {
  const f = this.f, a = f.abil, out = [];
  out.push(f.surge >= 1 ? { k: 'surge', name: 'Surge' } : { k: 'attack', name: 'Attack' });
  a.command.forEach(function (c) {
    const D = AE.PRISMS[c.id], mast = D.up && AE.prismMaster(AE.S_.prisms[c.pid]);
    if (D.cmd === 'steal') out.push({ k: mast ? 'mug' : 'steal', name: mast ? 'Mug' : 'Steal' });
    else if (D.cmd === 'sense') out.push({ k: 'sense', name: 'Sense' });
    else if (D.cmd === 'throw') out.push({ k: 'throw', name: 'Throw' });
    else if (D.cmd === 'morph') out.push({ k: 'morph', name: 'Morph' });
    else if (D.cmd === 'deathblow') out.push({ k: 'deathblow', name: 'Deathblow' });
    else if (D.cmd === 'mimic') out.push({ k: 'mimic', name: 'Mimic' });
  });
  if (a.magic.length) out.push({ k: 'magic', name: 'Magic', off: f.status.silence });
  if (a.echo.length) out.push({ k: 'echo', name: 'Echo', off: f.status.silence });
  out.push({ k: 'item', name: 'Item' });
  out.push({ k: 'defend', name: 'Defend' });
  out.push({ k: 'row', name: 'Change Row' });
  if (!this.B.form.noRun) out.push({ k: 'run', name: 'Run' });
  return out;
};
AE.BattleMenu.prototype.spells = function () {
  const f = this.f, out = [], seen = {}, sup = f.abil.support;
  f.abil.magic.forEach(function (m) {
    const D = AE.PRISMS[m.id];
    const linkedAll = sup.some(function (s) { return s.id === 'all' && s.slot === m.slot && (s.i ^ 1) === m.i; });
    D.spells.slice(0, Math.max(1, m.lv)).forEach(function (sp) {
      if (seen[sp]) { if (linkedAll) seen[sp].all = 1; return; }
      const o = { id: sp, name: AE.SPELLS[sp].name, mp: AE.SPELLS[sp].mp, all: linkedAll ? 1 : 0 }; seen[sp] = o; out.push(o);
    });
  });
  return out;
};
AE.BattleMenu.prototype.update = function (I, B) {
  const f = this.f;
  if (!AE.canAct(f) || f.status.confuse || f.status.berserk) { B.menu = null; return; }
  if (I.pressed.prev || I.pressed.next) {           // switch to another ready character
    if (B.ready.length > 1 && this.depth === 0) { B.ready.push(B.ready.shift()); B.menu = null; AE.Sfx && AE.Sfx.play('move'); return; }
  }
  if (this.target) { this.updateTarget(I, B); return; }
  if (this.sub) { this.updateSub(I, B); return; }
  this.list.move(I);
  if (I.pressed.back) { if (B.ready.length > 1) { B.ready.push(B.ready.shift()); B.menu = null; } return; }
  if (!I.pressed.ok) return;
  const c = this.cmds[this.list.sel]; if (c.off) { AE.Sfx && AE.Sfx.play('buzz'); return; }
  f.m.lastCmd = this.list.sel; AE.Sfx && AE.Sfx.play('ok');
  const self = this;
  switch (c.k) {
    case 'attack': case 'steal': case 'mug': case 'sense': case 'morph': case 'deathblow':
      this.pickTarget({ side: 'foes' }, function (ts) { return { kind: c.k === 'mug' ? 'steal' : c.k, mug: c.k === 'mug', targets: ts }; }); break;
    case 'magic': this.open('magic', this.spells()); break;
    case 'echo': this.open('echo', f.abil.echo.map(function (e) { const E = AE.ECHOES[AE.PRISMS[e.id].echo]; return { id: AE.PRISMS[e.id].echo, name: E.name, mp: E.mp, lv: e.lv }; })); break;
    case 'item': this.open('item', Object.keys(AE.S_.inv).filter(function (k) { const it = AE.ITEMS[k]; return it && !it.k && (it.use || it.battle); }).map(function (k) { return { id: k, name: AE.ITEMS[k].name, n: AE.S_.inv[k] }; })); break;
    case 'throw': this.open('throw', Object.keys(AE.S_.inv).filter(function (k) { return AE.WEAPONS[k]; }).map(function (k) { return { id: k, name: AE.WEAPONS[k].name, n: AE.S_.inv[k] }; })); break;
    case 'surge': this.open('surge', AE.CHARS[f.id].surge.filter(function (s) { return AE.SURGES[s].lv <= (f.m.surgeLv || 1); }).map(function (s) { return { id: s, name: AE.SURGES[s].name }; })); break;
    case 'mimic': this.open('mimic', Object.keys(AE.S_.flags).filter(function (k) { return k.indexOf('mimic:') === 0; }).map(function (k) { const id = k.slice(6); return { id: id, name: AE.SKILLS[id].name, mp: AE.SKILLS[id].mp || 0 }; })); break;
    case 'defend': B.commit({ user: f, kind: 'defend' }); break;
    case 'row': B.commit({ user: f, kind: 'row' }); break;
    case 'run': B.commit({ user: f, kind: 'run', need: false, targets: [] }); break;
  }
};
AE.BattleMenu.prototype.open = function (kind, items) {
  if (!items.length) { AE.Sfx && AE.Sfx.play('buzz'); return; }
  this.sub = { kind: kind, items: items, list: new AE.List(items, { cols: 2, rows: 4 }) }; this.depth = 1;
};
AE.BattleMenu.prototype.updateSub = function (I, B) {
  const s = this.sub, f = this.f; s.list.move(I);
  if (I.pressed.back) { this.sub = null; this.depth = 0; AE.Sfx && AE.Sfx.play('back'); return; }
  if (!I.pressed.ok) return;
  const it = s.items[s.list.sel];
  if ((s.kind === 'magic' || s.kind === 'echo' || s.kind === 'mimic') && f.mp < it.mp) { AE.Sfx && AE.Sfx.play('buzz'); return; }
  AE.Sfx && AE.Sfx.play('ok');
  if (s.kind === 'magic' || s.kind === 'mimic') {
    const S = AE.SPELLS[it.id] || AE.SKILLS[it.id], friendly = ['heal', 'buff', 'cure', 'revive'].indexOf(S.kind) >= 0;
    this.pickTarget({ side: friendly ? 'friends' : 'foes', canAll: it.all || S.all, forceAll: S.all, ko: S.kind === 'revive' }, function (ts, all) { return { kind: s.kind === 'mimic' ? 'skill' : 'magic', id: it.id, targets: ts, all: all }; });
  } else if (s.kind === 'echo') {
    B.commit({ user: f, kind: 'echo', id: it.id, lv: it.lv, targets: B.foes(f), all: 1 });
  } else if (s.kind === 'item') {
    const D = AE.ITEMS[it.id], tg = D.target || 'ally';
    if (D.battle === 'escape' || tg === 'none') { B.commit({ user: f, kind: 'item', id: it.id, targets: [f], need: false }); return; }
    this.pickTarget({ side: tg.indexOf('enem') === 0 ? 'foes' : 'friends', forceAll: tg === 'allies' || tg === 'enemies', ko: D.ko }, function (ts) { return { kind: 'item', id: it.id, targets: ts }; });
  } else if (s.kind === 'throw') {
    this.pickTarget({ side: 'foes' }, function (ts) { return { kind: 'throw', id: it.id, targets: ts }; });
  } else if (s.kind === 'surge') {
    const L = AE.SURGES[it.id];
    if (L.target === 'enemy') this.pickTarget({ side: 'foes' }, function (ts) { return { kind: 'surge', id: it.id, targets: ts }; });
    else B.commit({ user: f, kind: 'surge', id: it.id, targets: L.target === 'self' ? [f] : L.kind === 'heal' || L.kind === 'buff' ? B.friends(f, 1) : B.foes(f), need: false });
  }
};
AE.BattleMenu.prototype.pickTarget = function (o, make) {
  const B = this.B, f = this.f;
  const pool = (o.side === 'friends' ? B.party.filter(function (x) { return o.ko ? !x.gone : AE.alive(x); }) : B.enemies.filter(AE.alive));
  if (!pool.length) return;
  this.target = { o: o, make: make, side: o.side, i: 0, all: !!o.forceAll };
  if (o.side === 'friends') { const me = pool.indexOf(f); this.target.i = me >= 0 ? me : 0; if (o.ko) { const d = pool.findIndex(function (x) { return x.hp <= 0; }); if (d >= 0) this.target.i = d; } }
  this.depth = 2;
};
AE.BattleMenu.prototype.updateTarget = function (I, B) {
  const T = this.target, f = this.f;
  const pool = function (side) { return side === 'friends' ? B.party.filter(function (x) { return T.o.ko ? !x.gone : AE.alive(x); }) : B.enemies.filter(AE.alive); };
  let P = pool(T.side);
  if (!P.length) { this.target = null; this.depth = this.sub ? 1 : 0; return; }
  if (T.i >= P.length) T.i = 0;
  if (!T.o.forceAll) {
    if (I.rep.up) { T.i = (T.i + P.length - 1) % P.length; AE.Sfx && AE.Sfx.play('move'); }
    if (I.rep.down) { T.i = (T.i + 1) % P.length; AE.Sfx && AE.Sfx.play('move'); }
    // left/right: switch sides, or to 'all' when the spell can spread
    if (I.pressed.left || I.pressed.right) {
      if (T.o.canAll && !T.all) T.all = true; else if (T.all && T.o.canAll) T.all = false;
      else { T.side = T.side === 'friends' ? 'foes' : 'friends'; T.i = 0; }
      AE.Sfx && AE.Sfx.play('move');
    }
  }
  if (I.pressed.back) { this.target = null; this.depth = this.sub ? 1 : 0; AE.Sfx && AE.Sfx.play('back'); return; }
  if (I.pressed.ok) {
    P = pool(T.side); const ts = T.all ? P : [P[T.i]];
    const act = T.make(ts, T.all); act.user = f; act.side = T.side;
    AE.Sfx && AE.Sfx.play('ok'); B.commit(act);
  }
};
AE.BattleMenu.prototype.targets = function () {
  const T = this.target; if (!T) return []; const B = this.B;
  const P = T.side === 'friends' ? B.party.filter(function (x) { return T.o.ko ? !x.gone : AE.alive(x); }) : B.enemies.filter(AE.alive);
  return T.all ? P : [P[T.i]].filter(Boolean);
};
