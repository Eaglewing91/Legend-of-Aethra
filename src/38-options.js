/* ================= Options and quality of life =================
   Difficulty (Easy, Normal, Hard), New Game+ from a cleared save, a Quests screen with the next lead and a world
   marker, auto-save into the suspend slot on every new area, hints when you seem stuck, first-time tutorials for
   Prisms and Surges, a low-detail mode for slower phones, and extra synthesised sound effects. */
(function () {
  // ---------- config rows ----------
  AE.CONFIG.push(['Difficulty', 'diff', [0, 1, 2], ['Easy', 'Normal', 'Hard']], ['Detail', 'lowfx', [false, true], ['High', 'Low']], ['Hints', 'hints', [true, false], ['On', 'Off']]);
  const ns0 = AE.newState;
  AE.newState = function () { const S = ns0.apply(this, arguments); S.cfg.diff = 1; S.cfg.lowfx = false; S.cfg.hints = true; return S; };
  AE.ConfigScreen.prototype.draw = function (ctx) {
    const C = AE.S_.cfg, self = this;
    AE.window(ctx, 0, 0, AE.W, AE.H); AE.text(ctx, 'Config', 10, 6, '#ffe080');
    AE.CONFIG.forEach(function (r, i) {
      const y = 22 + i * 14; AE.text(ctx, r[0], 24, y, '#fff');
      let v = r[2].indexOf(C[r[1]]); if (v < 0) v = r[1] === 'diff' ? 1 : 0; AE.text(ctx, '< ' + r[3][v] + ' >', 200, y, '#ffe080', { align: 'center' });
      if (i === self.sel) AE.cursor(ctx, 8, y);
    });
    AE.text(ctx, 'Arrows move, Z OK, X back, C menu, Shift run.', 10, 186, '#888');
    AE.text(ctx, 'Q/E switch; hold Q+E in battle to flee.', 10, 198, '#888');
  };
  // ---------- difficulty: enemy toughness ----------
  const mk0 = AE.mkEnemy;
  AE.mkEnemy = function (id, slot, o) {
    const f = mk0.apply(this, arguments), d = (AE.S_ && AE.S_.cfg && AE.S_.cfg.diff !== undefined) ? AE.S_.cfg.diff : 1;
    if (d !== 1) { const kh = d === 0 ? 0.7 : 1.45, ka = d === 0 ? 0.78 : 1.25; f.hp = f.maxhp = Math.max(1, Math.round(f.maxhp * kh)); f.atk = Math.round(f.atk * ka); f.mag = Math.round(f.mag * ka); }
    if (AE.S_ && AE.S_.ngplus) { const k = 1 + 0.35 * AE.S_.ngplus; f.hp = f.maxhp = Math.round(f.maxhp * k); f.atk = Math.round(f.atk * (1 + 0.15 * AE.S_.ngplus)); f.mag = Math.round(f.mag * (1 + 0.15 * AE.S_.ngplus)); }
    return f;
  };
  // ---------- New Game+ ----------
  AE.newGamePlus = function (slot) {
    const d = AE.readSlot(slot); if (!d) return false;
    const old = d.s; AE.newGame(); const S = AE.S_;
    S.ngplus = (old.ngplus || 0) + 1; S.gold = old.gold || 0; S.cfg = Object.assign(S.cfg, old.cfg || {});
    // the party keep their levels, Prisms and growth; key items and story stay behind
    S.prisms = old.prisms || S.prisms; S.cards = old.cards || S.cards; S.bestiary = old.bestiary || S.bestiary;
    Object.keys(old.inv || {}).forEach(function (k) { const D = AE.ITEMS[k]; if (D && !D.k) S.inv[k] = old.inv[k]; });
    Object.keys(old.m || {}).forEach(function (id) { const m = old.m[id]; S.m[id] = Object.assign({}, m, { status: [] }); if (S.m[id].slots) S.m[id].slots = { weapon: [], armor: [] }; });
    if (S.m.kael) { S.m.kael.slots = { weapon: [], armor: [] }; }
    AE.calcAll && AE.calcAll(); return true;
  };
  const tu0 = AE.Title.prototype.update, td0 = AE.Title.prototype.draw, te0 = AE.Title.prototype.enter;
  AE.Title.prototype.enter = function () { te0.apply(this, arguments); this.ngSlot = [1, 2, 3].find(function (n) { const d = AE.readSlot(n); return d && d.s && d.s.flags && d.s.flags.cleared; }) || 0; };
  AE.Title.prototype.update = function (g) {
    if (!this.sub && this.ngSlot) {
      const I = g.input;
      if (I.rep.up || I.rep.down) { this.sel = (this.sel + (I.rep.down ? 1 : 2)) % 3; AE.Sfx.play('move'); return; }
      if (I.pressed.ok && this.sel === 2) { AE.ac(); AE.Sfx.play('ok'); const self = this, n = this.ngSlot; g.fadeOut(0.04).then(function () { g.pop(self); AE.newGamePlus(n); g.fadeIn(0.03); }); return; }
    }
    return tu0.apply(this, arguments);
  };
  AE.Title.prototype.draw = function (ctx) {
    td0.apply(this, arguments);
    if (!this.sub && this.ngSlot) { AE.text(ctx, 'New Game+', 112, 168, '#ffd060'); if (this.sel === 2) AE.cursor(ctx, 94, 168); }
  };
  // ---------- Quests screen ----------
  AE.QUEST_HINT = AE.QUEST_HINT || {};
  AE.storyLead = function () {   // where the main story goes next (by chapter and flags)
    const S = AE.S_, F = S.flags, P = AE.WORLD.places;
    const L = [
      [!F.a1_done, 'Escape Halcyon.', null],
      [!F.a2_thorn, 'Head north-east to Thornbrook.', 'thornbrook'], [!F.a2_mist, 'Cross Mistwood to Kestrel Ranch.', 'mistwood'], [!F.a2_spire, 'Ride to the Gilded Spire in the south-west.', 'gilded'],
      [!F.a2_wind, 'Climb north to Windhaven.', 'windhaven'], [!F.a2_done, 'Stop Aurex at the Wind Shrine.', 'windhaven'],
      [!F.a3_ferry, 'Take the ferry from Port Lark to Saltmere.', 'portlark'], [!F.a3_done, 'Cross the Sunscar desert to Mount Cinder.', 'cinder'],
      [!F.a4_done, 'Fly north to Frostgate and the Earth Crystal.', 'frostgate'],
      [!F.a5_kael, 'Search Mideel Shallows for Kael and Lyra.', 'mideel'], [!F.cleared, 'Descend into the Crater.', 'crater'],
      [true, 'The world is yours. Try the Abyssal Spire, the trials and the Weapons.', 'abyss']];
    const r = L.find(function (x) { return x[0]; }); return { text: r[1], place: r[2] && P[r[2]] ? r[2] : null };
  };
  AE.QuestScreen = function () { this.sel = 0; };
  AE.QuestScreen.prototype.update = function (I) { if (I.pressed.back || I.pressed.ok || I.pressed.menu) return 'close'; if (I.rep.down) this.sel++; if (I.rep.up) this.sel = Math.max(0, this.sel - 1); };
  AE.QuestScreen.prototype.draw = function (ctx) {
    const S = AE.S_; AE.window(ctx, 0, 0, AE.W, AE.H); AE.text(ctx, 'Quests', 10, 6, '#ffe080');
    const lead = AE.storyLead(); AE.text(ctx, 'Story', 14, 22, '#9cf'); AE.wrap(lead.text, 220).forEach(function (l, i) { AE.text(ctx, l, 24, 34 + i * 12, '#fff'); });
    const Q = Object.keys(AE.QUESTS || {}).filter(function (k) { return S.quests[k] !== undefined; });
    const open = Q.filter(function (k) { return S.quests[k] !== 'done'; }), done = Q.filter(function (k) { return S.quests[k] === 'done'; });
    AE.text(ctx, 'Side quests  ' + done.length + ' done, ' + open.length + ' open', 14, 62, '#9cf');
    const rows = open.map(function (k) { return ['* ' + AE.QUESTS[k], '#fff']; }).concat(done.map(function (k) { return ['  ' + AE.QUESTS[k], '#707890']; }));
    this.sel = Math.min(this.sel, Math.max(0, rows.length - 11));
    rows.slice(this.sel, this.sel + 11).forEach(function (r, i) { AE.text(ctx, r[0], 20, 76 + i * 12, r[1]); });
    if (!rows.length) AE.text(ctx, 'None yet. People in towns often need a hand.', 20, 76, '#888');
  };
  const MM = AE.MainMenu;
  AE.MainMenu = function () { MM.call(this); const i = this.cmds.indexOf('Status'); this.cmds.splice(i + 1, 0, 'Quests'); this.list = new AE.List(this.cmds); };
  AE.MainMenu.prototype = MM.prototype; AE.MainMenu.prototype.constructor = AE.MainMenu;
  const mmu = MM.prototype.update;
  AE.MainMenu.prototype.update = function (g) {
    if (!this.sub && !this.pick && g.input.pressed.ok && this.cmds[this.list.sel] === 'Quests') { AE.Sfx.play('ok'); this.sub = new AE.QuestScreen(); return; }
    return mmu.apply(this, arguments);
  };
  // the next story place blinks on the minimap and the full map
  const wd = AE.World.prototype.draw;
  AE.World.prototype.draw = function (ctx) {
    wd.apply(this, arguments);
    const lead = AE.storyLead(); if (!lead.place || AE.game.frame % 40 > 26) return;
    const p = AE.WORLD.places[lead.place], T = AE.WT;
    if (this.mini === 2) { const mw = AE.W - 16, mh = mw * T.h / T.w, x0 = 8, y0 = (AE.H - mh) / 2 + 4; ctx.strokeStyle = '#ffe040'; ctx.strokeRect(x0 + p[0] * mw / AE.WORLD.w - 3, y0 + p[1] * mh / AE.WORLD.h - 3, 6, 6); }
    else if (this.mini) { const mw = 64, mh = 48; ctx.fillStyle = '#ffe040'; ctx.fillRect(AE.W - mw - 6 + p[0] / AE.WORLD.w * mw - 1, AE.H - mh - 6 + p[1] / AE.WORLD.h * mh - 1, 3, 3); }
  };
  // ---------- auto-save on entering a new area; hints when stuck ----------
  const load0 = AE.Field.prototype.load;
  AE.Field.prototype.load = function (mapId) {
    const r = load0.apply(this, arguments), S = AE.S_;
    if (S && S.playing) {
      S.visited = S.visited || {};
      if (!S.visited[mapId]) { S.visited[mapId] = 1; const self = this; setTimeout(function () { try { if (AE.field() === self && !self.locked) { AE.saveSlot('suspend'); self.autoT = 90; } } catch (e) {} }, 400); }
      S.lastProgress = S.time;
    }
    return r;
  };
  const fd = AE.Field.prototype.draw;
  AE.Field.prototype.draw = function (ctx) {
    fd.apply(this, arguments);
    if (this.autoT > 0) { this.autoT--; ctx.globalAlpha = Math.min(1, this.autoT / 20); AE.text(ctx, 'Auto-saved', AE.W - 8, AE.H - 14, '#c0ffc0', { align: 'right' }); ctx.globalAlpha = 1; }
  };
  const fu = AE.Field.prototype.update;
  AE.Field.prototype.update = function (g) {
    const r = fu.apply(this, arguments), S = AE.S_;
    if (S && S.cfg && S.cfg.hints !== false && S.time - (S.lastProgress || 0) > 600 && !this.locked && AE.game.scenes[AE.game.scenes.length - 1] === this) {
      S.lastProgress = S.time; const lead = AE.storyLead(); AE.notice('Hint: ' + lead.text);
    }
    return r;
  };
  const fl0 = AE.setFlag;
  AE.setFlag = function () { if (AE.S_) AE.S_.lastProgress = AE.S_.time; return fl0.apply(this, arguments); };
  // ---------- first-time tutorials ----------
  AE.tutorial = function (id, lines) {
    const S = AE.S_; S.tut = S.tut || {}; if (S.tut[id] || (S.cfg && S.cfg.hints === false)) return Promise.resolve();
    S.tut[id] = 1; return AE.say(lines.join('|'), { name: 'TIP' });
  };
  const ap0 = AE.addPrism;
  AE.addPrism = function () {
    const r = ap0.apply(this, arguments);
    setTimeout(function () { AE.tutorial('prism', ['Prisms hold magic and skills. Slot them into weapons and armour from Menu > Prisms.', 'Linked slots (joined by a bar) let a support Prism, like All, change the Prism beside it.', 'Prisms grow with AP from battles and learn stronger spells.']); }, 600);
    return r;
  };
  const surgeHint = AE.Battle.prototype.update;
  AE.Battle.prototype.update = function (g) {
    const r = surgeHint.apply(this, arguments);
    if (!this.menu && this.party && this.party.some(function (f) { return (f.surge || 0) >= 1; }) && !(AE.S_.tut || {}).surge && this.phase === 'fight' && !this._tutq) {
      this._tutq = true;
      AE.tutorial('surge', ['A Surge gauge is full! Taking hits fills it.', 'The Surge command unleashes a character\'s Surge Art. Use them often: new Arts unlock with use.']);
    }
    return r;
  };
  // ---------- low detail: lighter world rendering and fewer particles ----------
  const wdraw2 = AE.World.prototype.draw;
  AE.World.prototype.draw = function (ctx) {
    if (AE.S_ && AE.S_.cfg && AE.S_.cfg.lowfx) { this.lowfx = true; }
    return wdraw2.apply(this, arguments);
  };
  const burst0 = AE.Battle.prototype.burst;
  AE.Battle.prototype.burst = function (kind, x, y) {
    if (AE.S_ && AE.S_.cfg && AE.S_.cfg.lowfx && Math.random() < 0.6) return;
    return burst0.apply(this, arguments);
  };
  const amb0 = AE.fieldAmbient;
  AE.fieldAmbient = function () { if (AE.S_ && AE.S_.cfg && AE.S_.cfg.lowfx) return; return amb0.apply(this, arguments); };
  // ---------- more sound: synthesised effects for things without a sample ----------
  const play0 = AE.Sfx.play;
  const SYN = {
    learn: [[660, 0.08], [880, 0.08], [1320, 0.16]], surge: [[220, 0.06], [330, 0.06], [440, 0.06], [660, 0.2]], echo: [[110, 0.3], [165, 0.3]],
    step: [[90, 0.03]], splash: [[300, 0.05], [180, 0.08]], wind: [[140, 0.2]], thunder: [[60, 0.35]], coin: [[1200, 0.05], [1600, 0.08]], shot: [[900, 0.03], [400, 0.05]], hurt: [[180, 0.1]], secret: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.25]]
  };
  AE.Sfx.play = function (name) {
    const has = (AE.SFX || {})[name] || (AE.SFX || {})[(AE.SFXALIAS || {})[name]];
    if (!has && SYN[name] && AE.ac && AE.ac() && !AE.Audio.muted) { let t = 0; const self = this; SYN[name].forEach(function (n) { setTimeout(function () { try { self.blip(n[0], n[1], 0.05); } catch (e) {} }, t * 1000); t += n[1] * 0.8; }); return; }
    return play0.apply(this, arguments);
  };
})();
// saves made while money was broken (it became "NaN" after battles): give back a fair amount
(function () {
  const ld = AE.loadSlot;
  AE.loadSlot = function (n) {
    const r = ld.apply(this, arguments), S = AE.S_;
    if (r && S && (typeof S.gold !== 'number' || !isFinite(S.gold))) { S.gold = 500 + 2500 * Math.max(0, (S.chapter || 1) - 1) * (S.chapter || 1); }
    if (S) delete S.Gil;
    return r;
  };
})();
// fairness: no single enemy blow takes more than three-quarters of a full-health member's HP (gravity aside)
(function () {
  const pf = AE.Battle.prototype.perform;
  AE.Battle.prototype.perform = function (act) { this._act = act; return pf.apply(this, arguments); };
  const h0 = AE.Battle.prototype.hurt;
  AE.Battle.prototype.hurt = function (f, d, o) {
    const A = this._act, K = A && A.id && (AE.SKILLS[A.id] || AE.SPELLS[A.id]);
    if (f.side === 'party' && d > 0 && A && A.user && A.user.side === 'enemy' && !(K && K.kind === 'gravity')) d = Math.min(d, Math.ceil(f.maxhp * 0.75));
    return h0.call(this, f, d, o);
  };
})();
