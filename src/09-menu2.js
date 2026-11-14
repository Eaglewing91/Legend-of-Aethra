/* ================= Menus: Equip, Prisms, Order, Config, Save/Load ================= */
AE.EquipScreen = function (id) { this.id = id; this.slot = 0; this.picking = false; this.list = new AE.List([], { rows: 8 }); };
AE.EQUIP_SLOTS = ['weapon', 'armor', 'acc'];
AE.equipChoices = function (id, slot) {
  const inv = AE.S_.inv, C = AE.CHARS[id];
  return Object.keys(inv).filter(function (k) {
    if (slot === 'weapon') return AE.WEAPONS[k] && AE.WEAPONS[k].type === C.weap;
    if (slot === 'armor') return !!AE.ARMORS[k];
    return !!AE.ACCS[k];
  });
};
// swap a piece of gear; Prisms in the old piece go back to the bag when they don't fit the new one
AE.equip = function (id, slot, item) {
  const m = AE.S_.m[id], old = m.equip[slot];
  if (old) AE.addItem(old, 1);
  if (item) AE.addItem(item, -1);
  m.equip[slot] = item || null;
  if (slot !== 'acc') {
    const D = slot === 'weapon' ? AE.WEAPONS[item] : AE.ARMORS[item], n = D ? D.slots : 0;
    m.slots[slot] = (m.slots[slot] || []).slice(0, n);
  }
  AE.calc(id);
};
AE.EquipScreen.prototype.update = function (I) {
  const self = this;
  if (this.picking) {
    this.list.move(I);
    if (I.pressed.back) { this.picking = false; AE.Sfx.play('back'); return; }
    if (I.pressed.ok) {
      const it = this.list.items[this.list.sel]; const slot = AE.EQUIP_SLOTS[this.slot];
      if (it === '(remove)') { if (slot === 'acc') AE.equip(this.id, slot, null); else { AE.Sfx.play('buzz'); return; } }
      else AE.equip(this.id, slot, it);
      AE.Sfx.play('equip'); this.picking = false;
    }
    return;
  }
  const P = AE.S_.party, i = P.indexOf(this.id);
  if (I.pressed.prev) this.id = P[(i + P.length - 1) % P.length]; if (I.pressed.next) this.id = P[(i + 1) % P.length];
  if (I.rep.up) this.slot = (this.slot + 2) % 3; if (I.rep.down) this.slot = (this.slot + 1) % 3;
  if (I.pressed.back) { AE.Sfx.play('back'); return 'close'; }
  if (I.pressed.ok) {
    const items = AE.equipChoices(this.id, AE.EQUIP_SLOTS[this.slot]); if (this.slot === 2) items.push('(remove)');
    if (!items.length) { AE.Sfx.play('buzz'); return; }
    this.list = new AE.List(items, { rows: 8 }); this.picking = true; AE.Sfx.play('ok');
  }
};
AE.EquipScreen.prototype.draw = function (ctx) {
  const m = AE.S_.m[this.id], self = this; AE.calc(this.id); const st = m.st;
  AE.window(ctx, 0, 0, AE.W, 88); AE.memberCard(ctx, this.id, 6, 4);
  ['Weapon', 'Armour', 'Acc.'].forEach(function (n, i) {
    const k = AE.EQUIP_SLOTS[i]; AE.text(ctx, n, 140, 8 + i * 12, '#9cf'); AE.text(ctx, m.equip[k] ? AE.itemName(m.equip[k]) : '-', 180, 8 + i * 12, '#fff');
    if (i === self.slot) AE.cursor(ctx, 126, 8 + i * 12, self.picking);
  });
  // slots preview
  const D = this.slot === 0 ? AE.WEAPONS[m.equip.weapon] : this.slot === 1 ? AE.ARMORS[m.equip.armor] : null;
  if (D) AE.drawSlots(ctx, 140, 50, D, m.slots[this.slot === 0 ? 'weapon' : 'armor'] || []);
  AE.window(ctx, 0, 88, 120, AE.H - 88);
  // compare
  const cur = this.picking ? this.list.items[this.list.sel] : null, slot = AE.EQUIP_SLOTS[this.slot];
  let st2 = null;
  if (cur && cur !== '(remove)') { const save = JSON.stringify(m.equip); const was = m.equip[slot]; m.equip[slot] = cur; st2 = AE.calc(this.id); m.equip[slot] = was; AE.calc(this.id); }
  [['Attack', 'atk'], ['Attack %', 'hit'], ['Defence', 'def'], ['Defence %', 'eva'], ['Magic', 'mag'], ['Magic Def', 'mdef'], ['Speed', 'spd']].forEach(function (r, i) {
    const y = 96 + i * 12, a = st[r[1]]; AE.text(ctx, r[0], 8, y, '#9cf'); AE.text(ctx, String(a), 82, y, '#fff', { align: 'right' });
    if (st2) { const b = st2[r[1]]; AE.text(ctx, String(b), 112, y, b > a ? '#7f7' : b < a ? '#f77' : '#fff', { align: 'right' }); }
  });
  AE.window(ctx, 120, 88, 136, AE.H - 88);
  if (this.picking) {
    for (let i = 0; i < 9 && i + this.list.top < this.list.items.length; i++) {
      const it = this.list.items[i + this.list.top]; AE.text(ctx, it === '(remove)' ? '(remove)' : AE.itemName(it), 140, 96 + i * 12, '#fff');
      if (i + this.list.top === this.list.sel) AE.cursor(ctx, 124, 96 + i * 12);
    }
    if (cur && cur !== '(remove)') { const d = AE.ITEMDB(cur); if (d && d.slots !== undefined) AE.drawSlots(ctx, 140, 208, d, []); }
  } else AE.text(ctx, 'Q/E: other characters', 248, 208, '#666', { align: 'right' });
};
// Prism slots: circles, linked pairs joined by a bar
AE.PRISMCOL = { green: '#40d060', yellow: '#f0d040', blue: '#4080ff', purple: '#b060f0', red: '#f04040' };
AE.drawSlots = function (ctx, x, y, D, filled, sel) {
  const n = D.slots || 0, links = D.links || 0;
  for (let i = 0; i < n; i++) {
    const X = x + i * 13;
    if (i % 2 === 0 && Math.floor(i / 2) < links && i + 1 < n) { ctx.fillStyle = '#c8b070'; ctx.fillRect(X + 5, y + 3, 10, 3); }
    ctx.fillStyle = '#202028'; ctx.fillRect(X, y, 9, 9); ctx.fillStyle = '#7880a0'; ctx.fillRect(X + 1, y + 1, 7, 7); ctx.fillStyle = '#101018'; ctx.fillRect(X + 2, y + 2, 5, 5);
    const pid = filled[i];
    if (pid !== undefined && pid !== null && AE.S_.prisms[pid]) { ctx.fillStyle = AE.PRISMCOL[AE.PRISMS[AE.S_.prisms[pid].id].col]; ctx.fillRect(X + 2, y + 2, 5, 5); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(X + 3, y + 3, 1, 1); }
    if (sel === i) AE.cursor(ctx, X - 2, y + 9);
  }
};
// ---------- Prisms ----------
AE.PrismScreen = function (id) { this.id = id; this.row = 0; this.col = 0; this.picking = false; this.list = new AE.List([], { rows: 10 }); };
AE.prismsFree = function () {
  const S = AE.S_, used = {};
  Object.keys(S.m).forEach(function (id) { const m = S.m[id]; ['weapon', 'armor'].forEach(function (s) { (m.slots[s] || []).forEach(function (p) { if (p !== null && p !== undefined) used[p] = 1; }); }); });
  return S.prisms.map(function (p, i) { return i; }).filter(function (i) { return !used[i]; });
};
AE.PrismScreen.prototype.update = function (I) {
  const m = AE.S_.m[this.id], slot = this.row ? 'armor' : 'weapon', D = this.row ? AE.ARMORS[m.equip.armor] : AE.WEAPONS[m.equip.weapon], n = D ? D.slots : 0;
  if (this.picking) {
    this.list.move(I);
    if (I.pressed.back) { this.picking = false; AE.Sfx.play('back'); return; }
    if (I.pressed.ok) {
      const pid = this.list.items[this.list.sel]; m.slots[slot] = m.slots[slot] || [];
      m.slots[slot][this.col] = pid === -1 ? null : pid; AE.calc(this.id); AE.Sfx.play('equip'); this.picking = false;
    }
    return;
  }
  const P = AE.S_.party, i = P.indexOf(this.id);
  if (I.pressed.prev) this.id = P[(i + P.length - 1) % P.length]; if (I.pressed.next) this.id = P[(i + 1) % P.length];
  if (I.rep.up || I.rep.down) { this.row = 1 - this.row; AE.Sfx.play('move'); }
  if (I.rep.left) this.col = Math.max(0, this.col - 1); if (I.rep.right) this.col = Math.min(Math.max(0, n - 1), this.col + 1);
  this.col = Math.min(this.col, Math.max(0, n - 1));
  if (I.pressed.back) { AE.Sfx.play('back'); return 'close'; }
  if (I.pressed.ok && n) {
    const items = AE.prismsFree().sort(function (a, b) { const x = AE.S_.prisms[a], y = AE.S_.prisms[b]; return x.id < y.id ? -1 : x.id > y.id ? 1 : b - a; });
    items.unshift(-1); this.list = new AE.List(items, { rows: 10 }); this.picking = true; AE.Sfx.play('ok');
  }
};
AE.PrismScreen.prototype.draw = function (ctx) {
  const m = AE.S_.m[this.id], self = this; AE.calc(this.id);
  AE.window(ctx, 0, 0, AE.W, 80); AE.memberCard(ctx, this.id, 6, 4);
  const W = AE.WEAPONS[m.equip.weapon], A = AE.ARMORS[m.equip.armor];
  AE.text(ctx, 'Wpn ' + (W ? W.name : '-'), 136, 8, '#9cf'); if (W) AE.drawSlots(ctx, 140, 20, W, m.slots.weapon || [], this.row === 0 && !this.picking ? this.col : -1);
  AE.text(ctx, 'Arm ' + (A ? A.name : '-'), 136, 40, '#9cf'); if (A) AE.drawSlots(ctx, 140, 52, A, m.slots.armor || [], this.row === 1 && !this.picking ? this.col : -1);
  AE.window(ctx, 0, 80, AE.W, 30);
  const curPid = (m.slots[this.row ? 'armor' : 'weapon'] || [])[this.col], showPid = this.picking ? this.list.items[this.list.sel] : curPid;
  if (showPid !== undefined && showPid !== null && showPid >= 0) {
    const P = AE.S_.prisms[showPid], D = AE.PRISMS[P.id], lv = AE.prismLevel(P), ap = D.ap || [0];
    AE.text(ctx, D.name + ' Prism  Lv ' + lv + (AE.prismMaster(P) ? ' MASTER' : ''), 8, 86, AE.PRISMCOL[D.col]);
    const desc = D.type === 'magic' ? 'Spells: ' + D.spells.slice(0, Math.max(1, lv)).map(function (s) { return AE.SPELLS[s].name; }).join(', ')
      : D.type === 'echo' ? 'Summons the Echo ' + D.name : D.type === 'command' ? 'Adds the ' + D.name + ' command' : D.type === 'support' ? 'Works with the Prism linked to it' : 'Passive: ' + D.name;
    AE.text(ctx, desc + (AE.prismMaster(P) ? '' : '   AP ' + AE.fmt(P.ap) + '/' + AE.fmt(ap[Math.min(ap.length - 1, lv)])), 8, 98, '#fff');
  } else AE.text(ctx, 'Empty slot. Press OK to set a Prism.', 8, 92, '#888');
  AE.window(ctx, 0, 110, AE.W, AE.H - 110);
  if (this.picking) {
    for (let i = 0; i < 9 && i + this.list.top < this.list.items.length; i++) {
      const pid = this.list.items[i + this.list.top], y = 118 + i * 11;
      if (pid === -1) AE.text(ctx, '(empty)', 24, y, '#aaa');
      else { const P = AE.S_.prisms[pid], D = AE.PRISMS[P.id]; ctx.fillStyle = AE.PRISMCOL[D.col]; ctx.fillRect(24, y + 2, 5, 5); AE.text(ctx, D.name, 34, y, '#fff'); AE.text(ctx, 'Lv ' + AE.prismLevel(P), 160, y, '#9cf'); }
      if (i + this.list.top === this.list.sel) AE.cursor(ctx, 8, y);
    }
  } else {
    const free = AE.prismsFree(); AE.text(ctx, 'Prisms in the bag: ' + free.length, 8, 118, '#9cf');
    const counts = {}; free.forEach(function (p) { const id = AE.S_.prisms[p].id; counts[id] = (counts[id] || 0) + 1; });
    Object.keys(counts).slice(0, 16).forEach(function (id, i) { const D = AE.PRISMS[id]; const x = 8 + (i % 2) * 124, y = 132 + Math.floor(i / 2) * 11; ctx.fillStyle = AE.PRISMCOL[D.col]; ctx.fillRect(x, y + 2, 5, 5); AE.text(ctx, D.name + (counts[id] > 1 ? ' x' + counts[id] : ''), x + 9, y, '#fff'); });
  }
};
// ---------- Order: party and reserve ----------
AE.OrderScreen = function () { this.sel = 0; this.hold = -1; };
AE.OrderScreen.prototype.all = function () { return AE.S_.party.concat(AE.S_.reserve); };
AE.OrderScreen.prototype.update = function (I) {
  const L = this.all(), S = AE.S_;
  if (I.rep.up) this.sel = (this.sel + L.length - 1) % L.length; if (I.rep.down) this.sel = (this.sel + 1) % L.length;
  if (I.pressed.left || I.pressed.right) { const id = L[this.sel]; if (S.m[id]) { S.m[id].row = S.m[id].row === 'back' ? 'front' : 'back'; AE.Sfx.play('ok'); } }
  if (I.pressed.back) { if (this.hold >= 0) this.hold = -1; else return 'close'; }
  if (I.pressed.ok) {
    if (S.flags.lockParty) { AE.Sfx.play('buzz'); return; }
    if (this.hold < 0) { this.hold = this.sel; AE.Sfx.play('ok'); return; }
    const a = L[this.hold], b = L[this.sel]; L[this.hold] = b; L[this.sel] = a;
    const np = L.slice(0, Math.min(3, S.party.length + (S.party.length < 3 ? S.reserve.length : 0))).slice(0, 3), nr = L.slice(np.length);
    if (np.indexOf(S.lead || 'kael') < 0 && S.flags.kaelLeads) { AE.Sfx.play('buzz'); this.hold = -1; return; }
    S.party = np; S.reserve = nr; this.hold = -1; AE.Sfx.play('equip');
    const f = AE.field(); if (f) f.player.who = S.party[0];
  }
};
AE.OrderScreen.prototype.draw = function (ctx) {
  const L = this.all(), S = AE.S_, self = this;
  AE.window(ctx, 0, 0, AE.W, AE.H);
  AE.text(ctx, 'Party', 10, 6, '#ffe080'); AE.text(ctx, 'Left/Right: row   OK: swap', 246, 6, '#888', { align: 'right' });
  L.forEach(function (id, i) {
    const y = 18 + i * 25 + (i >= S.party.length ? 10 : 0);
    if (i === S.party.length) AE.text(ctx, 'Reserve', 10, y - 10, '#ffe080');
    const m = S.m[id]; AE.portrait(ctx, id, 30, y + 22);
    AE.text(ctx, AE.CHARS[id].name + '  Lv ' + m.lv, 48, y + 4, i === self.hold ? '#ffe080' : '#fff');
    AE.text(ctx, 'HP ' + m.hp + '/' + m.maxhp + '  MP ' + m.mp + '/' + m.maxmp + '  ' + (m.row === 'back' ? 'Back row' : 'Front row'), 48, y + 14, '#aac');
    if (i === self.sel) AE.cursor(ctx, 4, y + 8);
  });
};
// ---------- Config ----------
AE.ConfigScreen = function () { this.sel = 0; };
AE.CONFIG = [
  ['Battle mode', 'atb', ['active', 'wait'], ['Active', 'Wait']], ['Battle speed', 'speed', [1, 2, 3, 4, 5], ['1', '2', '3', '4', '5']],
  ['Text speed', 'text', [1, 2, 4, 99], ['Slow', 'Normal', 'Fast', 'Instant']], ['Always run', 'autorun', [false, true], ['Off', 'On']],
  ['Cursor', 'cursor', ['reset', 'memory'], ['Reset', 'Memory']], ['Music', 'music', [0, 0.5, 1], ['Off', 'Low', 'Full']],
  ['Window colour', 'winSel', [0, 1, 2, 3, 4], ['Blue', 'Midnight', 'Crimson', 'Forest', 'Steel']]
];
AE.WINCOLS = [{ top: [32, 56, 168], bottom: [8, 12, 64] }, { top: [24, 24, 56], bottom: [4, 4, 12] }, { top: [140, 30, 40], bottom: [40, 6, 10] }, { top: [30, 110, 60], bottom: [6, 30, 12] }, { top: [90, 100, 120], bottom: [24, 28, 36] }];
AE.ConfigScreen.prototype.update = function (I) {
  const C = AE.S_.cfg, L = AE.CONFIG;
  if (I.rep.up) this.sel = (this.sel + L.length - 1) % L.length; if (I.rep.down) this.sel = (this.sel + 1) % L.length;
  const row = L[this.sel], k = row[1], vals = row[2];
  let i = vals.indexOf(C[k]); if (i < 0) i = 0;
  if (I.rep.left || I.rep.right) {
    i = AE.clamp(i + (I.rep.right ? 1 : -1), 0, vals.length - 1); C[k] = vals[i]; AE.Sfx.play('move');
    if (k === 'winSel') { C.win = AE.WINCOLS[C[k]]; AE.winGrad = {}; }
    if (k === 'music' && AE.Music.gain) AE.Music.gain.gain.value = C.music * 0.6;
  }
  if (I.pressed.back || I.pressed.ok) return 'close';
};
AE.ConfigScreen.prototype.draw = function (ctx) {
  const C = AE.S_.cfg, self = this;
  AE.window(ctx, 0, 0, AE.W, AE.H); AE.text(ctx, 'Config', 10, 6, '#ffe080');
  AE.CONFIG.forEach(function (r, i) {
    const y = 24 + i * 16; AE.text(ctx, r[0], 24, y, '#fff');
    let v = r[2].indexOf(C[r[1]]); if (v < 0) v = 0; AE.text(ctx, '< ' + r[3][v] + ' >', 200, y, '#ffe080', { align: 'center' });
    if (i === self.sel) AE.cursor(ctx, 8, y);
  });
  AE.text(ctx, 'Wait mode pauses battle time while you choose a spell, item or target.', 10, 150, '#888');
  AE.text(ctx, 'Keys: arrows move, Z/Enter OK, X/Esc back, C menu,', 10, 170, '#888');
  AE.text(ctx, 'Shift run, Q/E switch, hold Q+E in battle to flee.', 10, 182, '#888');
};
AE.CardList = function () {};
AE.CardList.prototype.update = function (I) { if (I.pressed.back || I.pressed.ok) return 'close'; };
AE.CardList.prototype.draw = function (ctx) {
  AE.window(ctx, 0, 0, AE.W, AE.H); AE.text(ctx, 'Arcana cards', 10, 6, '#ffe080');
  const cards = Object.keys(AE.S_.cards); if (!cards.length) { AE.text(ctx, 'No cards yet. Monsters drop them; players everywhere play.', 10, 26, '#888'); return; }
  cards.slice(0, 32).forEach(function (c, i) { const D = (AE.CARDS || {})[c] || { name: c }; AE.text(ctx, D.name + ' x' + AE.S_.cards[c], 10 + (i % 2) * 124, 24 + Math.floor(i / 2) * 11, '#fff'); });
};
