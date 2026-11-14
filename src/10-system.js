/* ================= Saving, the title screen, game over, shops, inns, save points ================= */
AE.store = AE.store || { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
AE.saveSlot = function (n) {
  const S = AE.S_, f = AE.field();
  if (f) { S.map = f.mapId; S.x = f.player.x; S.y = f.player.y; S.dir = f.player.dir; }
  S.stats.saves++;
  const lead = S.party[0], m = S.m[lead];
  const head = { lead: lead, lv: m ? m.lv : 1, time: S.time, place: S.world ? 'World map' : (f ? f.map.name : ''), party: S.party.slice(), gold: S.gold, chapter: S.chapter };
  AE.store.set('aethra_save_' + n, JSON.stringify({ head: head, s: S }));
  AE.scoresUpdate && AE.scoresUpdate();
};
AE.readSlot = function (n) { try { return JSON.parse(AE.store.get('aethra_save_' + n) || 'null'); } catch (e) { return null; } };
AE.loadSlot = function (n) {
  const d = AE.readSlot(n); if (!d) return false;
  const S = Object.assign(AE.newState(), d.s); S.cfg = Object.assign(AE.newState().cfg, d.s.cfg || {}); AE.S_ = S; S.playing = true;
  if (S.cfg.winSel !== undefined) S.cfg.win = AE.WINCOLS[S.cfg.winSel];
  AE.calcAll(); AE.winGrad = {};
  const g = AE.game; g.scenes = [];
  if (S.world) AE.toWorld(S.world.x, S.world.y, S.world.v); else g.push(new AE.Field(S.map, S.x, S.y, S.dir));
  return true;
};
AE.FileScreen = function (mode) { this.mode = mode; this.sel = 0; this.msg = 0; };
AE.FileScreen.prototype.update = function (I, menu) {
  if (this.msg > 0) { this.msg--; if (this.msg === 0 && this.mode === 'load-done') return 'close'; return; }
  if (I.rep.up) this.sel = (this.sel + 2) % 3; if (I.rep.down) this.sel = (this.sel + 1) % 3;
  if (I.pressed.back) { AE.Sfx.play('back'); return 'close'; }
  if (I.pressed.ok) {
    if (this.mode === 'save') { AE.saveSlot(this.sel + 1); AE.Sfx.play('save'); this.msg = 50; this.saved = true; }
    else { if (AE.readSlot(this.sel + 1)) { AE.Sfx.play('ok'); AE.game.fadeOut(0.08).then(function () { AE.loadSlot(this.sel + 1); AE.game.fadeIn(0.06); }.bind(this)); this.msg = 999; } else AE.Sfx.play('buzz'); }
  }
};
AE.FileScreen.prototype.draw = function (ctx) {
  const self = this;
  AE.window(ctx, 0, 0, AE.W, AE.H); AE.text(ctx, this.mode === 'save' ? 'Save' : 'Load', 10, 6, '#ffe080');
  for (let i = 0; i < 3; i++) {
    const d = AE.readSlot(i + 1), y = 24 + i * 64; AE.window(ctx, 16, y, AE.W - 32, 58);
    if (i === this.sel) AE.cursor(ctx, 4, y + 24);
    if (!d) { AE.text(ctx, 'File ' + (i + 1) + '  - empty -', 28, y + 22, '#888'); continue; }
    const h = d.head; AE.text(ctx, 'File ' + (i + 1), 28, y + 8, '#ffe080');
    (h.party || [h.lead]).forEach(function (id, k) { AE.actor(ctx, id, 'idle', 2, 0, 44 + k * 22, y + 50, 0.75); });
    AE.text(ctx, AE.CHARS[h.lead].name + '  Lv ' + h.lv, 110, y + 8, '#fff');
    AE.text(ctx, h.place || '', 110, y + 22, '#9cf'); AE.text(ctx, 'Time ' + AE.time(h.time) + '   ' + AE.fmt(h.gold || 0) + ' G', 110, y + 36, '#fff');
  }
  if (this.msg > 0 && this.saved) { AE.window(ctx, 70, 96, 116, 22); AE.text(ctx, 'Saved.', 128, 103, '#fff', { align: 'center' }); }
};
// ---------- title ----------
AE.Title = function () { this.kind = 'title'; this.opaque = true; this.sel = 0; this.t = 0; this.sub = null; };
AE.Title.prototype.enter = function () { if (AE.Music) AE.Music.play('title'); this.hasSave = [1, 2, 3].some(function (n) { return !!AE.readSlot(n); }); this.sel = this.hasSave ? 1 : 0; };
AE.Title.prototype.update = function (g) {
  const I = g.input; this.t++;
  if (this.sub) { if (this.sub.update(I) === 'close') this.sub = null; return; }
  if (I.rep.up || I.rep.down) { this.sel = 1 - this.sel; AE.Sfx.play('move'); }
  if (I.pressed.ok) {
    AE.ac(); AE.Sfx.play('ok');
    if (this.sel === 0) { const self = this; g.fadeOut(0.04).then(function () { g.pop(self); AE.newGame(); g.fadeIn(0.03); }); }
    else if (this.hasSave) this.sub = new AE.FileScreen('load');
    else AE.Sfx.play('buzz');
  }
};
AE.Title.prototype.draw = function (ctx) {
  const t = this.t, g = ctx.createLinearGradient(0, 0, 0, AE.H); g.addColorStop(0, '#060818'); g.addColorStop(0.6, '#1a2050'); g.addColorStop(1, '#3a2a50'); ctx.fillStyle = g; ctx.fillRect(0, 0, AE.W, AE.H);
  for (let i = 0; i < 60; i++) { const x = (i * 97 + t * (0.1 + (i % 3) * 0.05)) % AE.W, y = (i * 53) % 140; ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + (i % 5) * 0.12) + ')'; ctx.fillRect(x, y, 1, 1); }
  // four crystals
  ['#80e0ff', '#60a0ff', '#ff8040', '#c0a060'].forEach(function (c, i) {
    const x = 56 + i * 48, y = 70 + Math.sin(t / 30 + i) * 4; ctx.fillStyle = c; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x + 6, y); ctx.lineTo(x, y + 12); ctx.lineTo(x - 6, y); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
  });
  AE.text(ctx, 'LEGEND OF', AE.W / 2, 26, '#c0c8ff', { align: 'center' });
  ctx.save(); ctx.scale(2, 2); AE.text(ctx, 'AETHRA', AE.W / 4, 18, '#ffe8a0', { align: 'center' }); ctx.restore();
  AE.text(ctx, 'The Shattered Crystals', AE.W / 2, 96, '#a0a8d0', { align: 'center' });
  if (!this.sub) {
    ['New Game', 'Continue'].forEach(function (s, i) { AE.text(ctx, s, 112, 136 + i * 16, i === 1 && !this.hasSave ? '#666' : '#fff'); if (i === this.sel) AE.cursor(ctx, 94, 136 + i * 16); }, this);
    AE.text(ctx, 'Arrows move · Z/Enter OK · X/Esc back · C menu', AE.W / 2, 196, '#7078a0', { align: 'center' });
    AE.text(ctx, 'v' + (AE.VERSION || '0') + '  Eaglewing [571041]', AE.W / 2, 210, '#505878', { align: 'center' });
  } else this.sub.draw(ctx);
};
AE.gameOver = function () {
  const g = AE.game; g.scenes = [];
  const s = { kind: 'gameover', opaque: true, t: 0,
    update: function (gg) { this.t++; if (this.t > 60 && gg.input.pressed.ok) { gg.scenes = []; gg.push(new AE.Title()); } },
    draw: function (ctx) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, AE.W, AE.H); AE.text(ctx, 'GAME OVER', AE.W / 2, 100, '#c04040', { align: 'center' }); if (this.t > 60) AE.text(ctx, 'Press OK', AE.W / 2, 130, '#888', { align: 'center' }); } };
  g.push(s);
};
// ---------- shops ----------
AE.SHOPS = AE.SHOPS || {};
AE.openShop = function (id, npc) {
  return new Promise(function (res) { const s = new AE.Shop(id); s.done = res; AE.game.push(s); });
};
AE.Shop = function (id) { this.kind = 'shop'; this.D = AE.SHOPS[id] || { items: [] }; this.mode = 0; this.list = new AE.List([], { rows: 10 }); this.qty = 1; this.phase = 'mode'; };
AE.Shop.prototype.stock = function () { return this.mode === 0 ? this.D.items.filter(function (i) { return AE.ITEMDB(i) || i.indexOf('prism:') === 0; }) : Object.keys(AE.S_.inv).filter(function (k) { const d = AE.ITEMDB(k); return d && !d.k; }); };
AE.priceOf = function (id) { if (id.indexOf('prism:') === 0) return AE.PRISMS[id.slice(6)].price || 0; const d = AE.ITEMDB(id); return d ? d.price || 0 : 0; };
AE.Shop.prototype.update = function (g) {
  const I = g.input, S = AE.S_;
  if (this.phase === 'mode') {
    if (I.rep.left || I.rep.right || I.rep.up || I.rep.down) { this.mode = (this.mode + 1) % 3; AE.Sfx.play('move'); }
    if (I.pressed.back) { g.pop(this); this.done(); return; }
    if (I.pressed.ok) { if (this.mode === 2) { g.pop(this); this.done(); return; } this.list = new AE.List(this.stock(), { rows: 10 }); this.phase = 'list'; AE.Sfx.play('ok'); }
    return;
  }
  if (this.phase === 'list') {
    this.list.items = this.stock(); this.list.move(I);
    if (I.pressed.back) { this.phase = 'mode'; AE.Sfx.play('back'); return; }
    if (I.pressed.ok && this.list.items.length) { this.qty = 1; this.phase = 'qty'; AE.Sfx.play('ok'); }
    return;
  }
  const id = this.list.items[this.list.sel], p = AE.priceOf(id), sell = this.mode === 1;
  const max = sell ? (S.inv[id] || 0) : id.indexOf('prism:') === 0 ? 9 : Math.max(0, 99 - (S.inv[id] || 0));
  if (I.rep.up || I.rep.right) this.qty = Math.min(max, this.qty + (I.rep.right ? 10 : 1)); if (I.rep.down || I.rep.left) this.qty = Math.max(1, this.qty - (I.rep.left ? 10 : 1));
  if (I.pressed.back) { this.phase = 'list'; return; }
  if (I.pressed.ok) {
    if (sell) { S.inv[id] -= this.qty; if (S.inv[id] <= 0) delete S.inv[id]; S.gold += Math.floor(p / 2) * this.qty; AE.Sfx.play('coin'); }
    else { if (S.gold < p * this.qty || !p) { AE.Sfx.play('buzz'); return; } S.gold -= p * this.qty; if (id.indexOf('prism:') === 0) for (let i = 0; i < this.qty; i++) AE.addPrism(id.slice(6)); else AE.addItem(id, this.qty); AE.Sfx.play('coin'); }
    this.phase = 'list';
  }
};
AE.Shop.prototype.draw = function (ctx) {
  const S = AE.S_, self = this;
  AE.window(ctx, 0, 0, AE.W, 22); AE.text(ctx, this.D.name || 'Shop', 10, 7, '#ffe080'); AE.text(ctx, AE.fmt(S.gold) + ' G', 246, 7, '#fff', { align: 'right' });
  AE.window(ctx, 0, 22, AE.W, 22);
  ['Buy', 'Sell', 'Leave'].forEach(function (m, i) { AE.text(ctx, m, 28 + i * 70, 29, '#fff'); if (i === self.mode && self.phase === 'mode') AE.cursor(ctx, 12 + i * 70, 29); });
  if (this.phase === 'mode') return;
  AE.window(ctx, 0, 44, 150, AE.H - 44);
  const items = this.list.items;
  for (let i = 0; i < 14 && i + this.list.top < items.length; i++) {
    const id = items[i + this.list.top], y = 51 + i * 12, p = AE.priceOf(id);
    AE.text(ctx, AE.itemName(id), 22, y, '#fff'); AE.text(ctx, String(this.mode === 1 ? Math.floor(p / 2) : p), 144, y, '#9cf', { align: 'right' });
    if (i + this.list.top === this.list.sel) AE.cursor(ctx, 6, y, this.phase === 'qty');
  }
  AE.window(ctx, 150, 44, 106, AE.H - 44);
  const id = items[this.list.sel];
  if (id) {
    const d = AE.ITEMDB(id); AE.text(ctx, 'Owned: ' + (S.inv[id] || 0), 156, 52, '#fff');
    AE.wrap(d ? d.desc || (d.atk ? 'Attack ' + d.atk + '  Slots ' + d.slots : d.def !== undefined ? 'Def ' + d.def + ' MDef ' + d.mdef + ' Slots ' + d.slots : '') : (AE.PRISMS[id.slice(6)] ? AE.PRISMS[id.slice(6)].type + ' Prism' : ''), 96).forEach(function (l, i) { AE.text(ctx, l, 156, 66 + i * 11, '#aac'); });
    // who can equip it
    if (d && (d.atk !== undefined && d.type)) S.party.concat(S.reserve).forEach(function (cid, i) { const ok = AE.CHARS[cid].weap === d.type; AE.actor(ctx, cid, 'idle', 2, 0, 166 + i * 18, 200, 0.6, { alpha: ok ? 1 : 0.25 }); });
  }
  if (this.phase === 'qty') { AE.window(ctx, 40, 90, 170, 34); AE.text(ctx, 'How many?  ' + this.qty, 52, 97, '#fff'); AE.text(ctx, 'Total ' + AE.fmt(AE.priceOf(id) * this.qty * (this.mode === 1 ? 0.5 : 1)) + ' G', 52, 109, '#9cf'); }
};
// ---------- inn and save points ----------
AE.inn = async function (price, name) {
  const r = await AE.ask((name || 'INNKEEPER') + ': A bed for the night is ' + price + ' G. Stay?', ['Stay', 'No thanks'], { cancel: 1 });
  if (r !== 0) return false;
  if (AE.S_.gold < price) { await AE.say('You don\'t have enough money.'); return false; }
  AE.S_.gold -= price; await AE.game.fadeOut(0.03); AE.healAll(); if (AE.Music) AE.Music.play('levelup'); await AE.wait(90); await AE.game.fadeIn(0.03);
  const f = AE.field(); if (f && AE.Music) AE.Music.play(f.map.d.music);
  await AE.say('You feel rested.'); return true;
};
AE.EV.savepoint = async function () {
  const f = AE.field(); f.atSave = true;
  const tent = AE.has('tent') ? ['Save', 'Use a Tent', 'Leave'] : ['Save', 'Leave'];
  const r = await AE.ask('A save crystal hums softly.', tent, { cancel: tent.length - 1 });
  if (r === 0) { const m = new AE.MainMenu(); m.sub = new AE.FileScreen('save'); m.list.sel = 8; AE.game.push(m); await AE.until(function () { return AE.game.top() !== m || !m.sub; }); if (AE.game.top() === m) AE.game.pop(m); }
  if (tent[r] === 'Use a Tent') { AE.addItem('tent', -1); await AE.game.fadeOut(0.03); AE.healAll(); await AE.wait(60); await AE.game.fadeIn(0.03); }
  f.atSave = false;
};
