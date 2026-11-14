/* ================= More battle mechanics: Mimic learning, Surge levels, back attacks; the Bestiary =================
   - Mimic (the Enemy Skill Prism): a party member carrying it who is hit by a learnable enemy skill learns it.
   - Surge Arts level up with use: each character's next Art unlocks after enough Surges.
   - Back attacks: sometimes the party is caught from behind: they face the wrong way, their rows swap, the
     enemy acts first and blows from behind hit harder until each member turns round (on their first action). */
(function () {
  // ---------- Mimic ----------
  AE.mimicKnown = function (id) { return !!AE.S_.flags['mimic:' + id]; };
  const skill0 = AE.Battle.prototype.doSkill;
  AE.Battle.prototype.doSkill = async function (u, id, targets) {
    const r = await skill0.apply(this, arguments), K = AE.SKILLS[id], B = this;
    if (u.side === 'enemy' && K && K.kind !== 'special' && !K.nomimic && !AE.mimicKnown(id)) {
      const learner = (targets || []).find(function (t) { return t.side === 'party' && AE.alive(t) && t.abil && t.abil.command.some(function (c) { return c.id === 'enemy_skill'; }); });
      if (learner) { AE.S_.flags['mimic:' + id] = 1; B.say(learner.name + ' learned ' + K.name + '!', 90); AE.Sfx && AE.Sfx.play('learn'); B.burst('holy', learner.x, learner.y - 16); await AE.wait(40); }
    }
    return r;
  };
  // ---------- Surge levels ----------
  AE.SURGE_NEXT = [0, 6, 16, 32];          // total Surges used to reach Lv 2, 3, 4
  const surge0 = AE.Battle.prototype.doSurge;
  AE.Battle.prototype.doSurge = async function (u, id, targets) {
    await surge0.apply(this, arguments);
    const m = u.m; if (!m) return;
    const lv = m.surgeLv || 1;
    if (lv < 4 && (m.surgeUses || 0) >= AE.SURGE_NEXT[lv]) {
      m.surgeLv = lv + 1;
      const art = AE.CHARS[u.id] && AE.CHARS[u.id].surge.map(function (s) { return AE.SURGES[s]; }).find(function (s) { return s.lv === lv + 1; });
      if (art) { this.say(u.name + ': new Surge Art, ' + art.name + '!', 110); AE.Sfx && AE.Sfx.play('learn'); this.burst('life', u.x, u.y - 16); await AE.wait(50); }
    }
  };
  // ---------- back attacks ----------
  const B0 = AE.Battle;
  AE.Battle = function (form, o) {
    B0.call(this, form, o);
    const pre = Math.max(0, ...this.party.map(function (f) { return f.abil.indep.pre || 0; }));
    if (form.back || (!form.boss && !form.noBack && !this.pre && !(o && o.noBack) && Math.random() < Math.max(0.01, 0.045 - pre * 0.015))) {
      this.back = true; this.pre = -1;
      this.party.forEach(function (f) { f.flip = true; f.backT = 1; f.row = f.row === 'back' ? 'front' : 'back'; f.atb = 0; });
      this.enemies.forEach(function (f) { f.atb = 1; });
      this.layout();
    }
  };
  AE.Battle.prototype = B0.prototype; AE.Battle.prototype.constructor = AE.Battle;
  Object.keys(B0).forEach(function (k) { AE.Battle[k] = B0[k]; });
  const upd0 = AE.Battle.prototype.update;
  AE.Battle.prototype.update = function (g) {
    if (this.phase === 'intro' && this.t === 30 && this.back) { upd0.apply(this, arguments); this.say('Back attack!', 80); return; }
    return upd0.apply(this, arguments);
  };
  const perf0 = AE.Battle.prototype.perform;
  AE.Battle.prototype.perform = async function (act) {
    const u = act.user;
    if (u && u.side === 'party' && u.backT) { u.backT = 0; u.flip = false; u.row = u.row === 'back' ? 'front' : 'back'; this.layout(); AE.Sfx && AE.Sfx.play('move'); await AE.wait(8); }
    return perf0.apply(this, arguments);
  };
  const hurt0 = AE.Battle.prototype.hurt;
  AE.Battle.prototype.hurt = function (f, d, o) { if (f.side === 'party' && f.backT && d > 0) d = Math.floor(d * 1.25); return hurt0.call(this, f, d, o); };
  // rows only matter for the battle: the saved row is the one the player picked
  const sync0 = AE.Battle.prototype.syncBack;
  AE.Battle.prototype.syncBack = function () { this.party.forEach(function (f) { if (f.backT) f.row = f.row === 'back' ? 'front' : 'back'; }); return sync0.apply(this, arguments); };

  // ---------- the Bestiary ----------
  AE.Bestiary = function () { this.sel = 0; this.t = 0; };
  AE.Bestiary.prototype.list = function () {
    const S = AE.S_;
    return Object.keys(AE.ENEMIES).filter(function (k) { return S.bestiary[k] || S.bestiary['scan:' + k]; })
      .sort(function (a, b) { return AE.ENEMIES[a].lv - AE.ENEMIES[b].lv || (a < b ? -1 : 1); });
  };
  AE.Bestiary.prototype.update = function (I) {
    const L = this.list(); this.t++;
    if (I.rep.up) { this.sel = Math.max(0, this.sel - 1); AE.Sfx.play('move'); }
    if (I.rep.down) { this.sel = Math.min(L.length - 1, this.sel + 1); AE.Sfx.play('move'); }
    if (I.rep.left) this.sel = Math.max(0, this.sel - 10); if (I.rep.right) this.sel = Math.min(L.length - 1, this.sel + 10);
    if (I.pressed.back || I.pressed.menu) return 'close';
  };
  AE.Bestiary.prototype.draw = function (ctx) {
    const S = AE.S_, L = this.list(), all = Object.keys(AE.ENEMIES).length;
    AE.window(ctx, 0, 0, AE.W, AE.H);
    AE.text(ctx, 'Bestiary  ' + L.length + '/' + all, 10, 6, '#ffe080');
    if (!L.length) { AE.text(ctx, 'Nothing recorded yet.', 10, 26, '#888'); return; }
    const top = Math.max(0, Math.min(this.sel - 7, L.length - 15));
    L.slice(top, top + 15).forEach(function (k, r) { const i = top + r; AE.text(ctx, AE.ENEMIES[k].name, 20, 22 + r * 13, i === this.sel ? '#fff' : '#b0b8d0'); if (i === this.sel) AE.cursor(ctx, 6, 22 + r * 13, true); }, this);
    const id = L[this.sel], D = AE.ENEMIES[id], scanned = S.bestiary['scan:' + id];
    // portrait on a little painted stage
    AE.window(ctx, 126, 18, 124, 92);
    const f = { d: D, t: this.t / 60, status: {}, x: 188, y: 100, hp: 1 };
    const A = AE.enemyArt(f), h = AE.enemyH(f), k = Math.min(1, 70 / Math.max(1, h));
    ctx.save(); ctx.beginPath(); ctx.rect(130, 22, 116, 84); ctx.clip();
    const g = ctx.createLinearGradient(0, 22, 0, 106); g.addColorStop(0, '#2a3a6a'); g.addColorStop(1, '#0a1020'); ctx.fillStyle = g; ctx.fillRect(130, 22, 116, 84);
    ctx.translate(188, 100); ctx.scale(k, k); ctx.translate(-188, -100);
    if (!A.none) AE.drawEnemy(ctx, f, { menu: null }, false);
    ctx.restore();
    let y = 116; const line = function (a, b, col) { AE.text(ctx, a, 132, y, '#9cf'); AE.text(ctx, String(b), 246, y, col || '#fff', { align: 'right' }); y += 12; };
    line('Defeated', S.bestiary[id] || 0);
    line('Level', scanned ? D.lv : '??');
    line('HP', scanned ? AE.fmt(D.hp) : '??');
    line('EXP / AP', scanned ? D.exp + ' / ' + D.ap : '??');
    line('Gil', scanned ? D.gold : '??');
    if (scanned) {
      if (D.weak && D.weak.length) line('Weak', D.weak.join(', '), '#ffd040');
      if (D.absorb && D.absorb.length) line('Absorbs', D.absorb.join(', '), '#7f7');
    } else AE.text(ctx, 'Use Sense to learn more.', 132, y, '#888');
  };
  const MM = AE.MainMenu;
  AE.MainMenu = function () { MM.call(this); const i = this.cmds.indexOf('Arcana'); this.cmds.splice(i + 1, 0, 'Bestiary'); this.list = new AE.List(this.cmds); };
  AE.MainMenu.prototype = MM.prototype; AE.MainMenu.prototype.constructor = AE.MainMenu;
  const mmu = MM.prototype.update;
  AE.MainMenu.prototype.update = function (g) {
    if (!this.sub && !this.pick && g.input.pressed.ok && this.cmds[this.list.sel] === 'Bestiary') { AE.Sfx.play('ok'); this.sub = new AE.Bestiary(); return; }
    return mmu.apply(this, arguments);
  };
})();
