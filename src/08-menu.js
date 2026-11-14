/* ================= The main menu =================
   Party summary on the left, commands on the right: Items, Magic, Prisms, Equip, Status, Order, Config, Save. */
AE.MainMenu = function () {
  this.kind = 'menu'; this.cmds = ['Item', 'Magic', 'Prisms', 'Equip', 'Status', 'Order', 'Arcana', 'Config', 'Save'];
  this.list = new AE.List(this.cmds); this.sub = null; this.pick = null;
};
AE.MainMenu.prototype.update = function (g) {
  const I = g.input;
  if (this.sub) { if (this.sub.update(I, this) === 'close') this.sub = null; return; }
  if (this.pick) { this.updatePick(I); return; }
  this.list.move(I);
  if (I.pressed.back || I.pressed.menu) { AE.Sfx.play('back'); g.pop(this); return; }
  if (!I.pressed.ok) return;
  const c = this.cmds[this.list.sel]; AE.Sfx.play('ok');
  if (c === 'Item') this.sub = new AE.ItemScreen();
  else if (c === 'Config') this.sub = new AE.ConfigScreen();
  else if (c === 'Save') { if (AE.canSave()) this.sub = new AE.FileScreen('save'); else { AE.Sfx.play('buzz'); this.toast = 60; } }
  else if (c === 'Order') this.sub = new AE.OrderScreen();
  else if (c === 'Arcana') this.sub = new AE.CardList();
  else this.pick = { cmd: c, i: 0 };       // choose a character first
};
AE.MainMenu.prototype.updatePick = function (I) {
  const P = AE.S_.party, p = this.pick;
  if (I.rep.up) { p.i = (p.i + P.length - 1) % P.length; AE.Sfx.play('move'); }
  if (I.rep.down) { p.i = (p.i + 1) % P.length; AE.Sfx.play('move'); }
  if (I.pressed.back) { this.pick = null; AE.Sfx.play('back'); return; }
  if (I.pressed.ok) {
    const id = P[p.i]; AE.Sfx.play('ok'); this.pick = null;
    if (p.cmd === 'Magic') this.sub = new AE.MagicScreen(id);
    if (p.cmd === 'Prisms') this.sub = new AE.PrismScreen(id);
    if (p.cmd === 'Equip') this.sub = new AE.EquipScreen(id);
    if (p.cmd === 'Status') this.sub = new AE.StatusScreen(id);
  }
};
AE.portrait = function (ctx, id, x, y) { AE.actor(ctx, id, 'idle', 2, 0, x, y, 1); };
AE.memberCard = function (ctx, id, x, y, hl) {
  const m = AE.S_.m[id], C = AE.CHARS[id]; if (!m) return;
  AE.portrait(ctx, id, x + 14, y + 36);
  AE.text(ctx, C.name, x + 34, y + 4, hl ? '#ffe080' : '#fff');
  AE.text(ctx, 'Lv ' + m.lv, x + 120, y + 4, '#9cf');
  AE.text(ctx, 'HP', x + 34, y + 16, '#9cf'); AE.text(ctx, m.hp + '/' + m.maxhp, x + 120, y + 16, m.hp <= 0 ? '#e05050' : '#fff', { align: 'right' });
  AE.bar(ctx, x + 34, y + 26, 86, 2, m.hp / m.maxhp, '#60d080');
  AE.text(ctx, 'MP', x + 34, y + 30, '#9cf'); AE.text(ctx, m.mp + '/' + m.maxmp, x + 120, y + 30, '#fff', { align: 'right' });
  AE.bar(ctx, x + 34, y + 40, 86, 2, m.maxmp ? m.mp / m.maxmp : 0, '#60a0ff');
  if (m.row === 'back') AE.text(ctx, 'Back', x + 124, y + 30, '#888');
};
AE.MainMenu.prototype.draw = function (ctx) {
  const S = AE.S_, self = this;
  AE.window(ctx, 0, 0, 180, AE.H);
  S.party.forEach(function (id, i) { AE.memberCard(ctx, id, 6, 8 + i * 58, self.pick && self.pick.i === i); if (self.pick && self.pick.i === i) AE.cursor(ctx, 2, 26 + i * 58); });
  AE.window(ctx, 180, 0, 76, this.cmds.length * 12 + 12);
  this.cmds.forEach(function (c, i) { AE.text(ctx, c, 196, 7 + i * 12, c === 'Save' && !AE.canSave() ? '#808090' : '#fff'); if (i === self.list.sel && !self.pick && !self.sub) AE.cursor(ctx, 182, 7 + i * 12); });
  AE.window(ctx, 180, 166, 76, 34);
  AE.text(ctx, 'Time', 186, 172, '#9cf'); AE.text(ctx, AE.time(S.time), 250, 172, '#fff', { align: 'right' });
  AE.text(ctx, AE.fmt(S.gold), 238, 185, '#fff', { align: 'right' }); AE.text(ctx, 'G', 250, 185, '#9cf', { align: 'right' });
  const f = AE.field(), loc = AE.S_.world ? 'World map' : f ? f.map.name : '';
  AE.window(ctx, 120, 200, 136, 24); AE.text(ctx, loc, 250, 207, '#fff', { align: 'right' });
  if (this.toast > 0) { this.toast--; AE.window(ctx, 30, 96, 140, 20); AE.text(ctx, 'Save at a save point.', 100, 102, '#fff', { align: 'center' }); }
  if (this.sub) this.sub.draw(ctx, this);
};
AE.canSave = function () { const f = AE.field(); return !!(AE.S_.world || (f && f.atSave) || AE.S_.flags.debugSave); };

// ---------- Items ----------
AE.ItemScreen = function () { this.list = new AE.List([], { rows: 12 }); this.refresh(); this.target = null; this.tab = 0; };
AE.ItemScreen.prototype.refresh = function () {
  const inv = AE.S_.inv, tab = this.tab;
  this.items = Object.keys(inv).filter(function (k) { const d = AE.ITEMDB(k); return d && (tab === 1 ? d.k : !d.k); }).sort(function (a, b) { return AE.itemName(a) < AE.itemName(b) ? -1 : 1; });
  this.list.items = this.items; this.list.sel = Math.min(this.list.sel, Math.max(0, this.items.length - 1));
};
AE.ItemScreen.prototype.update = function (I) {
  if (this.target !== null) {
    const P = AE.S_.party;
    if (I.rep.up) this.target = (this.target + P.length - 1) % P.length; if (I.rep.down) this.target = (this.target + 1) % P.length;
    if (I.pressed.back) { this.target = null; return; }
    if (I.pressed.ok) {
      const id = this.items[this.list.sel], D = AE.ITEMS[id], U = D.use, all = D.target === 'allies';
      const ms = all ? P.map(function (p) { return AE.S_.m[p]; }) : [AE.S_.m[P[this.target]]]; let used = false;
      ms.forEach(function (m) {
        if (U.revive && m.hp <= 0) { m.hp = Math.max(1, Math.floor(m.maxhp * U.revive)); used = true; }
        if (m.hp <= 0) return;
        if (U.heal && m.hp < m.maxhp) { m.hp = Math.min(m.maxhp, m.hp + U.heal); used = true; }
        if (U.mp && m.mp < m.maxmp) { m.mp = Math.min(m.maxmp, m.mp + U.mp); used = true; }
        if (U.cure) { const n0 = m.status.length; m.status = m.status.filter(function (s) { return U.cure.indexOf(s) < 0; }); if (m.status.length < n0) used = true; }
        if (U.boost) { m.bonus = m.bonus || {}; AE.CHARS[m.id].base[U.boost] += 0; m.boost = m.boost || {}; m.boost[U.boost] = (m.boost[U.boost] || 0) + 1; used = true; }
      });
      if (used) { AE.addItem(id, -1); AE.Sfx.play('heal'); AE.calcAll(); this.refresh(); if (!AE.has(id)) this.target = null; } else AE.Sfx.play('buzz');
    }
    return;
  }
  if (I.pressed.prev || I.pressed.next) { this.tab = 1 - this.tab; this.list.sel = 0; this.list.top = 0; this.refresh(); AE.Sfx.play('move'); }
  this.list.move(I);
  if (I.pressed.back) { AE.Sfx.play('back'); return 'close'; }
  if (I.pressed.ok && this.items.length) {
    const D = AE.ITEMS[this.items[this.list.sel]];
    if (D && D.use && !D.use.damage && !D.use.status) { this.target = 0; AE.Sfx.play('ok'); } else AE.Sfx.play('buzz');
  }
};
AE.ItemScreen.prototype.draw = function (ctx) {
  const self = this;
  AE.window(ctx, 0, 0, AE.W, 22); AE.text(ctx, this.tab ? 'Key Items' : 'Items', 10, 7, '#ffe080'); AE.text(ctx, 'Q/E: ' + (this.tab ? 'Items' : 'Key Items'), 246, 7, '#888', { align: 'right' });
  AE.window(ctx, 0, 22, AE.W, 22);
  const cur = this.items[this.list.sel], D = cur && AE.ITEMDB(cur);
  AE.text(ctx, D ? D.desc || '' : '', 10, 29, '#fff');
  AE.window(ctx, 0, 44, AE.W, AE.H - 44);
  for (let i = 0; i < 14 && i + this.list.top < this.items.length; i++) {
    const id = this.items[i + this.list.top];
    AE.text(ctx, AE.itemName(id), 24, 51 + i * 12, '#fff'); if (!AE.ITEMDB(id).k) AE.text(ctx, String(AE.S_.inv[id]), 240, 51 + i * 12, '#fff', { align: 'right' });
    if (i + this.list.top === this.list.sel) AE.cursor(ctx, 8, 51 + i * 12, this.target !== null);
  }
  if (this.target !== null) {
    AE.window(ctx, 76, 30, 180, AE.S_.party.length * 58 + 10);
    AE.S_.party.forEach(function (id, i) { AE.memberCard(ctx, id, 82, 36 + i * 58); if (i === self.target) AE.cursor(ctx, 78, 54 + i * 58); });
  }
};
// ---------- Magic (cast healing spells outside battle) ----------
AE.MagicScreen = function (id) { this.id = id; this.target = null; AE.calc(id); this.spells = AE.fieldSpells(id); this.list = new AE.List(this.spells, { cols: 2, rows: 12 }); };
AE.fieldSpells = function (id) {
  const m = AE.S_.m[id], out = [], seen = {};
  m.st.abil.magic.forEach(function (x) { AE.PRISMS[x.id].spells.slice(0, Math.max(1, x.lv)).forEach(function (s) { if (!seen[s]) { seen[s] = 1; out.push(s); } }); });
  return out;
};
AE.MagicScreen.prototype.update = function (I) {
  const m = AE.S_.m[this.id];
  if (this.target !== null) {
    const P = AE.S_.party;
    if (I.rep.up) this.target = (this.target + P.length - 1) % P.length; if (I.rep.down) this.target = (this.target + 1) % P.length;
    if (I.pressed.back) { this.target = null; return; }
    if (I.pressed.ok) {
      const sp = AE.SPELLS[this.spells[this.list.sel]], t = AE.S_.m[P[this.target]];
      if (m.mp < sp.mp || m.hp <= 0) { AE.Sfx.play('buzz'); return; }
      let ok = false;
      if (sp.kind === 'heal' && t.hp > 0 && t.hp < t.maxhp) { t.hp = Math.min(t.maxhp, t.hp + (sp.full ? 9999 : AE.healAmount({ mag: m.st.mag, lv: m.lv }, sp.power))); ok = true; }
      if (sp.kind === 'revive' && t.hp <= 0) { t.hp = Math.max(1, Math.floor(t.maxhp * sp.power)); ok = true; }
      if (sp.kind === 'cure') { const n = t.status.length; t.status = t.status.filter(function (s) { return sp.cure.indexOf(s) < 0; }); ok = t.status.length < n; }
      if (ok) { m.mp -= sp.mp; AE.Sfx.play('heal'); } else AE.Sfx.play('buzz');
    }
    return;
  }
  this.list.move(I);
  if (I.pressed.back) { AE.Sfx.play('back'); return 'close'; }
  if (I.pressed.ok && this.spells.length) {
    const sp = AE.SPELLS[this.spells[this.list.sel]];
    if (['heal', 'revive', 'cure'].indexOf(sp.kind) >= 0) { this.target = 0; AE.Sfx.play('ok'); } else AE.Sfx.play('buzz');
  }
};
AE.MagicScreen.prototype.draw = function (ctx) {
  const m = AE.S_.m[this.id], self = this;
  AE.window(ctx, 0, 0, AE.W, 50); AE.memberCard(ctx, this.id, 6, 4);
  AE.window(ctx, 0, 50, AE.W, AE.H - 50);
  if (!this.spells.length) AE.text(ctx, 'No magic. Slot a magic Prism (green) into a weapon or armour.', 10, 58, '#888');
  this.spells.forEach(function (s, i) {
    const r = Math.floor(i / 2) - self.list.top, c = i % 2; if (r < 0 || r >= 12) return;
    const sp = AE.SPELLS[s], X = 22 + c * 120, Y = 58 + r * 12;
    AE.text(ctx, sp.name, X, Y, m.mp >= sp.mp ? '#fff' : '#808090'); AE.text(ctx, sp.mp + '', X + 96, Y, '#9cf', { align: 'right' });
    if (i === self.list.sel) AE.cursor(ctx, X - 16, Y, self.target !== null);
  });
  if (this.target !== null) {
    AE.window(ctx, 76, 30, 180, AE.S_.party.length * 58 + 10);
    AE.S_.party.forEach(function (id, i) { AE.memberCard(ctx, id, 82, 36 + i * 58); if (i === self.target) AE.cursor(ctx, 78, 54 + i * 58); });
  }
};
// ---------- Status ----------
AE.StatusScreen = function (id) { this.id = id; AE.calc(id); };
AE.StatusScreen.prototype.update = function (I) {
  const P = AE.S_.party; let i = P.indexOf(this.id);
  if (I.pressed.prev || I.pressed.left) { this.id = P[(i + P.length - 1) % P.length]; AE.calc(this.id); }
  if (I.pressed.next || I.pressed.right) { this.id = P[(i + 1) % P.length]; AE.calc(this.id); }
  if (I.pressed.back || I.pressed.ok) return 'close';
};
AE.StatusScreen.prototype.draw = function (ctx) {
  const m = AE.S_.m[this.id], C = AE.CHARS[this.id], st = m.st;
  AE.window(ctx, 0, 0, AE.W, AE.H);
  AE.memberCard(ctx, this.id, 8, 6);
  AE.text(ctx, C.full + ', ' + C.title, 140, 10, '#ffe080');
  AE.text(ctx, 'EXP', 140, 26, '#9cf'); AE.text(ctx, AE.fmt(m.exp), 248, 26, '#fff', { align: 'right' });
  AE.text(ctx, 'Next', 140, 38, '#9cf'); AE.text(ctx, m.lv >= 99 ? '-' : AE.fmt(AE.expFor(m.lv + 1) - m.exp), 248, 38, '#fff', { align: 'right' });
  AE.text(ctx, 'Surge Lv ' + (m.surgeLv || 1), 140, 50, '#ff9ad0');
  const L = [['Strength', st.str], ['Vitality', st.vit], ['Magic', st.mag], ['Spirit', st.spr], ['Speed', st.spd], ['Luck', st.lck], ['Attack', st.atk], ['Attack %', st.hit], ['Defence', st.def], ['Defence %', st.eva], ['Magic Atk', st.mag], ['Magic Def', st.mdef]];
  L.forEach(function (r, i) { const x = i < 6 ? 12 : 132, y = 70 + (i % 6) * 12; AE.text(ctx, r[0], x, y, '#9cf'); AE.text(ctx, String(r[1]), x + 108, y, '#fff', { align: 'right' }); });
  AE.text(ctx, 'Weapon', 12, 150, '#9cf'); AE.text(ctx, AE.itemName(m.equip.weapon || '') || '-', 72, 150, '#fff');
  AE.text(ctx, 'Armour', 12, 162, '#9cf'); AE.text(ctx, m.equip.armor ? AE.itemName(m.equip.armor) : '-', 72, 162, '#fff');
  AE.text(ctx, 'Acc.', 12, 174, '#9cf'); AE.text(ctx, m.equip.acc ? AE.itemName(m.equip.acc) : '-', 72, 174, '#fff');
  const arts = C.surge.filter(function (s) { return AE.SURGES[s].lv <= (m.surgeLv || 1); }).map(function (s) { return AE.SURGES[s].name; });
  AE.text(ctx, 'Surge Arts: ' + arts.join(', '), 12, 192, '#ff9ad0');
  AE.text(ctx, 'Q/E: other characters', 248, 208, '#666', { align: 'right' });
};
