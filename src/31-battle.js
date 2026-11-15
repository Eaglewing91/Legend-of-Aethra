/* ================= The battle scene (ATB) =================
   Party of up to 3 on the right, enemies on the left. ATB gauges fill with Speed; a full gauge opens the command
   window (Q/E switch between ready characters). Actions play one at a time. Wait mode pauses the gauges while you
   are choosing a spell, item or target. */
AE.startBattle = function (form, o) {
  o = o || {}; const g = AE.game;
  return new Promise(function (res) {
    const b = new AE.Battle(form, o); b.done = res;
    AE.Sfx && AE.Sfx.play('encounter');
    if (AE.Music) { b.prevMusic = AE.Music.cur; AE.Music.play(form.music || (form.boss ? 'boss' : 'battle')); }
    g.push(b);
  });
};
AE.Battle = function (form, o) {
  this.kind = 'battle'; this.opaque = true; this.form = form; this.o = o; const S = AE.S_, self = this;
  this.party = S.party.slice(0, 3).map(function (id, i) { return AE.mkParty(id, i); });
  this.enemies = form.enemies.map(function (e, i) { return AE.mkEnemy(typeof e === 'string' ? e : e.id, i, typeof e === 'string' ? {} : e); });
  this.layout();
  this.queue = []; this.ready = []; this.busy = false; this.menu = null; this.phase = 'intro'; this.t = 0; this.pops = []; this.fx = []; this.banner = null;
  this.allUses = {}; this.runHold = 0; this.result = null; this.spoils = { exp: 0, ap: 0, gold: 0, items: [] };
  // ambush / first strike
  const pre = Math.max(0, ...this.party.map(function (f) { return f.abil.indep.pre || 0; }));
  this.pre = form.pre || (!form.boss && Math.random() < 0.06 + pre * 0.12) ? 1 : (!form.boss && Math.random() < 0.05) ? -1 : 0;
  if (form.ambush) this.pre = -1;
  if (this.pre === 1) this.party.forEach(function (f) { f.atb = 1; });
  if (this.pre === -1) { this.enemies.forEach(function (f) { f.atb = 1; }); this.party.forEach(function (f) { f.atb = 0; }); }
  S.stats.battles++;
};
AE.Battle.prototype.layout = function () {
  this.party.forEach(function (f, i) { f.hx = 204 + i * 8 + (f.row === 'back' ? 14 : 0); f.hy = 72 + i * 28; f.x = f.hx; f.y = f.hy; });
  const n = this.enemies.length, self = this;
  this.enemies.forEach(function (f, i) {
    const p = (self.form.pos && self.form.pos[i]) || AE.autoPos(i, n, f.d);
    f.hx = p[0]; f.hy = p[1]; f.x = f.hx; f.y = f.hy;
  });
};
AE.autoPos = function (i, n, d) {
  if (d && d.boss && n === 1) return [74, 112];
  // up to 3 per column, columns spread to the left; big foes take more room
  const big = d && d.art && (d.art.k || 3) > 3, cols = Math.ceil(n / 3), c = Math.floor(i / 3), r = i % 3, rows = Math.min(3, n - c * 3);
  const colW = cols > 2 ? 40 : 52, x0 = 128 - (big ? 10 : 0);
  return [x0 - c * colW - (r === 1 && rows === 3 ? 14 : 0), 104 + (r - (rows - 1) / 2) * (rows === 3 ? 30 : 36)];
};
AE.Battle.prototype.all = function () { return this.party.concat(this.enemies); };
AE.Battle.prototype.foes = function (f) { return (f.side === 'party' ? this.enemies : this.party).filter(AE.alive); };
AE.Battle.prototype.friends = function (f, ko) { return (f.side === 'party' ? this.party : this.enemies).filter(function (x) { return ko ? !x.gone : AE.alive(x); }); };
AE.Battle.prototype.speedK = function () { return [0, 0.55, 0.75, 1, 1.25, 1.5][AE.S_.cfg.speed || 3]; };
AE.Battle.prototype.paused = function () {
  if (this.phase !== 'fight') return true;
  if (AE.S_.cfg.atb === 'wait' && this.menu && (this.menu.depth > 0)) return true;
  return false;
};
AE.Battle.prototype.update = function (g) {
  const I = g.input, self = this; this.t++;
  this.all().forEach(function (f) { f.t += 1 / 60; if (f.flash > 0) f.flash--; if (f.shake > 0) f.shake--; });
  this.pops = this.pops.filter(function (p) { p.t++; return p.t < 60; });
  this.fx = this.fx.filter(function (e) { e.t++; return e.t < e.life; });
  if (this.banner && --this.banner.t <= 0) this.banner = null;
  if (this.phase === 'intro') { if (this.t > 30) { this.phase = 'fight'; if (this.pre) this.say(this.pre > 0 ? 'First strike!' : 'Ambushed!'); } return; }
  if (this.phase === 'win' || this.phase === 'lose' || this.phase === 'end') { if (this.endUpdate) this.endUpdate(g); return; }
  // ATB and timed status
  if (!this.paused() && !this.busy) this.tick(1 / 60);
  else if (!this.paused()) this.tick(1 / 60);
  // run away: hold Q and E together (or the Run command)
  if (((I.held.prev && I.held.next) || I.held.flee) && !this.form.noRun) { if (++this.runHold > 70) { this.tryRun(); this.runHold = 0; } } else this.runHold = 0;
  // menus
  if (this.menu) this.menu.update(I, this);
  else if (this.ready.length) {
    const f = this.ready[0]; if (AE.canAct(f) && !f.status.confuse && !f.status.berserk) this.openMenu(f);
    else this.ready.shift();
  }
  // actions
  if (!this.busy && this.queue.length) {
    const act = this.queue.shift();
    if (!AE.alive(act.user) || (act.user.side === 'enemy' && this.over())) return;
    this.busy = true;
    this.perform(act).catch(function (e) { console.error(e); }).then(function () { self.busy = false; self.afterAction(); });
  }
};
AE.Battle.prototype.tick = function (dt) {
  const k = this.speedK(), self = this;
  this.all().forEach(function (f) {
    if (!AE.alive(f)) return;
    // timed statuses
    for (const s in f.status) {
      if (f.status[s] >= 999) continue;
      f.status[s] -= dt;
      if (f.status[s] <= 0) { delete f.status[s]; if (s === 'doom') { self.kill(f, 'doom'); } }
    }
    f.dotT = (f.dotT || 0) + dt;
    if (f.dotT > 3) {
      f.dotT = 0;
      if (f.status.poison) { const d = Math.max(1, Math.floor(f.maxhp / 32)); self.hurt(f, d, { quiet: false, col: '#9f9' }); }
      if (f.status.regen) { const h = Math.max(1, Math.floor(f.maxhp / 24)); self.healHp(f, h); }
    }
    if (!AE.canAct(f) || f.waiting) return;
    let r = (f.spd + 25) / 1500 * k * (f.status.haste ? 1.5 : 1) * (f.status.slow ? 0.5 : 1);
    if (f.side === 'enemy' && f.d.atbK) r *= f.d.atbK;
    f.atb = Math.min(1, f.atb + r);
    if (f.atb >= 1) {
      f.waiting = true; f.defending = false;
      if (f.side === 'enemy') self.enemyTurn(f);
      else if (f.status.confuse || f.status.berserk) self.autoTurn(f);
      else self.ready.push(f);
    }
  });
};
AE.Battle.prototype.over = function () { return !this.enemies.some(AE.alive) || !this.party.some(AE.alive); };
AE.Battle.prototype.afterAction = function () {
  if (this.phase !== 'fight') return;
  if (!this.enemies.some(function (e) { return AE.alive(e) && !e.d.ignore; })) { this.win(); return; }
  if (!this.party.some(AE.alive)) { this.lose(); return; }
};
AE.Battle.prototype.say = function (text, t) { this.banner = { text: text, t: t || 70 }; };
// ---------- turns ----------
AE.Battle.prototype.endTurn = function (f) { f.atb = 0; f.waiting = false; const i = this.ready.indexOf(f); if (i >= 0) this.ready.splice(i, 1); };
AE.Battle.prototype.enemyTurn = function (f) {
  const act = AE.enemyAct(f, this);
  if (!act) { this.endTurn(f); return; }
  act.user = f; this.queue.push(act);
};
AE.Battle.prototype.autoTurn = function (f) {
  const foes = f.status.confuse && Math.random() < 0.5 ? this.friends(f) : this.foes(f);
  if (!foes.length) { this.endTurn(f); return; }
  this.queue.push({ user: f, kind: 'attack', targets: [AE.pick(foes)] });
};
AE.Battle.prototype.openMenu = function (f) { this.menu = new AE.BattleMenu(f, this); AE.Sfx && AE.Sfx.play('ready'); };
AE.Battle.prototype.commit = function (act) {
  const f = act.user; this.menu = null; const i = this.ready.indexOf(f); if (i >= 0) this.ready.splice(i, 1);
  if (act.kind === 'defend') { f.defending = true; this.endTurn(f); return; }
  if (act.kind === 'row') { f.row = f.row === 'back' ? 'front' : 'back'; f.m.row = f.row; this.layout(); this.endTurn(f); return; }
  this.queue.push(act);
};
AE.Battle.prototype.tryRun = function () {
  if (this.form.noRun) { this.say('Can\'t escape!'); return; }
  const ps = this.party.filter(AE.alive), es = this.enemies.filter(AE.alive);
  const lvA = ps.reduce(function (a, f) { return a + f.lv; }, 0) / Math.max(1, ps.length), lvE = es.reduce(function (a, f) { return a + f.lv; }, 0) / Math.max(1, es.length);
  if (Math.random() < AE.clamp(0.55 + (lvA - lvE) * 0.04, 0.15, 0.95)) {
    this.say('Escaped!'); AE.Sfx && AE.Sfx.play('run'); AE.S_.stats.runs++;
    this.party.forEach(function (f) { f.anim = 'move'; f.flip = true; });
    this.finish('run', 50);
  } else this.say('Couldn\'t escape!');
};
// ---------- outcomes ----------
AE.Battle.prototype.kill = function (f, how) {
  f.hp = 0; f.atb = 0; f.waiting = false; const i = this.ready.indexOf(f); if (i >= 0) this.ready.splice(i, 1);
  if (this.menu && this.menu.f === f) this.menu = null;
  if (f.side === 'enemy') {
    f.dying = 30; AE.Sfx && AE.Sfx.play('die');
    const S = AE.S_; S.stats.kills++; S.bestiary[f.id] = (S.bestiary[f.id] || 0) + 1;
    if (!f.noReward) { this.spoils.exp += f.d.exp || 0; this.spoils.ap += f.d.ap || 0; this.spoils.gold += f.d.gold || 0;
      (f.d.drop || []).forEach(function (dr) { if (Math.random() < dr[1]) this.spoils.items.push(dr[0]); }, this); }
  } else { f.anim = 'dead'; f.status = {}; f.surge = f.surge || 0; }
};
AE.Battle.prototype.hurt = function (f, d, o) {
  o = o || {}; d = Math.floor(d);
  if (d < 0) { this.healHp(f, -d); return; }
  d = Math.min(9999, d);
  f.hp = Math.max(0, f.hp - d); f.flash = 10; f.shake = 8;
  this.pop(f, String(d), o.col || '#fff');
  if (f.side === 'party') { f.surge = Math.min(1, (f.surge || 0) + d / f.maxhp * 0.75); f.anim = 'hurt'; f.animT = 12; }
  if (f.status.sleep && !o.keepSleep) delete f.status.sleep;
  if (f.status.confuse && Math.random() < 0.5) delete f.status.confuse;
  if (f.hp <= 0) this.kill(f);
};
AE.Battle.prototype.healHp = function (f, h) { h = Math.floor(Math.min(9999, h)); if (!AE.alive(f) && !f.reviving) return; f.hp = Math.min(f.maxhp, f.hp + h); this.pop(f, String(h), '#7f7'); };
AE.Battle.prototype.pop = function (f, text, col) { this.pops.push({ x: f.x, y: f.y - (f.side === 'enemy' ? AE.enemyH(f) : 30), text: text, col: col, t: 0 }); };
AE.Battle.prototype.win = function () {
  if (this.phase !== 'fight') return;
  this.phase = 'win'; this.menu = null; const self = this, S = AE.S_;
  if (AE.Music) AE.Music.play('victory');
  this.party.forEach(function (f) { if (AE.alive(f)) { f.anim = 'win'; f.t = 0; } });
  const alive = this.party.filter(AE.alive).map(function (f) { return f.m; });
  const all = this.party.map(function (f) { return f.m; });
  const xb = 1 + Math.max(0, ...this.party.map(function (f) { return f.abil.indep.exp || 0; })) * 0.5;
  const gb = 1 + Math.max(0, ...this.party.map(function (f) { return f.abil.indep.gold || 0; })) * 0.5;
  const sp = this.spoils; sp.exp = Math.floor(sp.exp * xb); sp.gold = Math.floor(sp.gold * gb);
  this.syncBack();
  sp.ups = AE.giveExp(alive, sp.exp);
  // reserve members learn at half rate
  const res = S.reserve.map(function (id) { return S.m[id]; }).filter(Boolean); AE.giveExp(res, Math.floor(sp.exp / 2));
  sp.prisms = AE.giveAp(alive, sp.ap);
  S.gold = Math.min(9999999, S.gold + sp.gold);
  sp.items.forEach(function (id) { AE.gainQuiet(id); });
  this.endT = 0; this.endPage = 0;
  this.endUpdate = function (g) {
    self.endT++;
    if (self.endT > 40 && (g.input.pressed.ok || g.input.pressed.back)) {
      self.endPage++;
      if (self.endPage >= self.endPages().length) self.finish('win', 0);
      else AE.Sfx && AE.Sfx.play('ok');
    }
  };
};
AE.gainQuiet = function (id) {
  if (id.indexOf('prism:') === 0) AE.addPrism(id.slice(6)); else if (id.indexOf('card:') === 0) AE.S_.cards[id.slice(5)] = (AE.S_.cards[id.slice(5)] || 0) + 1; else AE.addItem(id, 1);
};
AE.Battle.prototype.endPages = function () {
  const sp = this.spoils, pages = [];
  pages.push(['EXP ' + AE.fmt(sp.exp), 'AP ' + AE.fmt(sp.ap), AE.fmt(sp.gold) + ' Gil']);
  if (sp.items.length) pages.push(['Found:'].concat(sp.items.map(AE.itemName)));
  const lv = (sp.ups || []).map(function (u) { return AE.CHARS[u.id].name + ' reached Lv ' + u.to + '!'; });
  if (lv.length) pages.push(lv);
  const pm = (sp.prisms || []).map(function (p) { return p.indexOf('lv:') === 0 ? AE.PRISMS[p.slice(3)].name + ' Prism levelled up!' : AE.PRISMS[p].name + ' Prism mastered! A new one was born.'; });
  if (pm.length) pages.push(pm);
  return pages;
};
AE.Battle.prototype.lose = function () {
  if (this.phase !== 'fight') return; this.phase = 'lose'; this.menu = null; const self = this;
  if (this.o.canLose) { this.say('Defeated...', 120); this.finish('lose', 120); return; }
  if (AE.Music) AE.Music.play('gameover');
  this.endT = 0;
  this.endUpdate = function (g) { self.endT++; if (self.endT > 150 && (g.input.pressed.ok)) self.finish('lose', 0); };
};
AE.Battle.prototype.syncBack = function () {
  this.party.forEach(function (f) {
    const m = f.m; m.hp = Math.max(0, f.hp); m.mp = f.mp; m.surge = f.surge;
    m.status = Object.keys(f.status).filter(function (s) { return ['poison', 'blind', 'silence', 'frog', 'stone'].indexOf(s) >= 0; });
  });
};
AE.Battle.prototype.finish = function (res, delay) {
  if (this.finished) return; this.finished = true; const self = this, g = AE.game;
  if (res !== 'win') this.syncBack();
  this.phase = 'end';
  AE.wait(delay || 1).then(function () { return g.fadeOut(0.1); }).then(function () {
    g.pop(self);
    if (res === 'lose' && !self.o.canLose) { AE.gameOver(); g.fadeIn(0.05); return; }
    if (res === 'lose') AE.partyMembers().forEach(function (m) { if (m.hp <= 0) m.hp = 1; });
    if (AE.Music && self.prevMusic) AE.Music.play(self.prevMusic);
    g.fadeIn(0.1); self.done(res);
  });
};
