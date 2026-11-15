/* ================= The field: walking around towns, dungeons and buildings =================
   Grid movement (16 px tiles), the party leader on screen, people who wander and talk, chests, signs, doors,
   touch events and random encounters. Scripts lock the controls while they run. */
AE.Actor = function (o) {
  Object.assign(this, { x: 0, y: 0, dir: 2, who: 'kael', moving: false, px: 0, py: 0, sx: 0, sy: 0, step: 0, anim: 0, speed: 1, hidden: false }, o);
  this.px = this.x * 16; this.py = this.y * 16;
};
AE.Actor.prototype.draw = function (ctx, cx, cy) {
  if (this.hidden) return;
  const X = this.px + 8 - cx, Y = this.py + 14 - cy + (this.hop || 0);
  if (X < -32 || Y < -48 || X > AE.W + 32 || Y > AE.H + 48) return;
  ctx.fillStyle = 'rgba(0,0,0,.26)'; ctx.beginPath(); ctx.ellipse(X, Y, 6, 2.2, 0, 0, 7); ctx.fill();
  const f = this.moving ? Math.floor(this.anim) : -1, run = this.speed > 1;
  if (this.cast !== false && AE.actorOn(this.who)) {
    AE.actor(ctx, this.who, this.pose || (this.moving ? (run ? 'run' : 'walk') : 'idle'), this.dir, this.pose ? Math.floor(this.anim) : f < 0 ? 0 : f, X, Y, 0.75);
  } else if (!AE.person(ctx, this.who, this.dir, f, X, Y, 0.75)) {
    ctx.fillStyle = '#c84'; ctx.fillRect(X - 5, Y - 18, 10, 18);
  }
  if (this.emote) AE.drawEmote(ctx, this.emote, X, Y - 26);
};
AE.Actor.prototype.update = function () {
  if (!this.moving) return;
  const D = AE.DIRS[this.dir], v = this.speed;
  this.px += D.x * v; this.py += D.y * v; this.anim += 0.12 * v;
  if (Math.abs(this.px - this.x * 16) < v && Math.abs(this.py - this.y * 16) < v) { this.px = this.x * 16; this.py = this.y * 16; this.moving = false; return true; }
  return false;
};
AE.drawEmote = function (ctx, e, X, Y) {
  AE.window(ctx, X - 7, Y - 8, 14, 13);
  AE.text(ctx, e, X, Y - 5, e === '!' ? '#ff6060' : e === '?' ? '#80c0ff' : '#ffe080', { align: 'center', shadow: false });
};

AE.Field = function (mapId, x, y, dir) {
  this.kind = 'field'; this.opaque = true;
  this.load(mapId, x, y, dir);
};
AE.Field.prototype.load = function (mapId, x, y, dir) {
  const S = AE.S_;
  this.map = new AE.Map(mapId); this.mapId = mapId;
  S.map = mapId; S.x = x; S.y = y; S.dir = dir === undefined ? 2 : dir;
  this.player = new AE.Actor({ x: x, y: y, dir: S.dir, who: S.party[0] || 'kael' });
  this.npcs = [];
  const self = this;
  (this.map.d.npcs || []).forEach(function (n, i) {
    if (n.if && !AE.cond(n.if)) return; if (n.unless && AE.cond(n.unless)) return;
    const a = new AE.Actor({ x: n.x, y: n.y, dir: n.dir === undefined ? 2 : n.dir, who: n.who, cast: !!(AE.MS && AE.MS[n.who] && AE.MS[n.who].idle), def: n, id: n.id || ('n' + i), home: [n.x, n.y], wait: AE.rand(120) });
    self.npcs.push(a);
  });
  this.stepsSince = 0; this.encN = this.rollEnc(); this.locked = 0; this.cam = { x: 0, y: 0 };
  this.camFollow();
  if (AE.Music) AE.Music.play(AE.S_.musicOverride || this.map.d.music);
  if (AE.EV['enter:' + mapId]) this.run('enter:' + mapId);
};
AE.Field.prototype.rollEnc = function () { return 12 + AE.rand(24); };
AE.Field.prototype.camFollow = function () {
  const p = this.player;
  this.cam.x = AE.clamp(p.px + 8 - AE.W / 2, 0, Math.max(0, this.map.w * 16 - AE.W));
  this.cam.y = AE.clamp(p.py + 8 - AE.H / 2, 0, Math.max(0, this.map.h * 16 - AE.H));
  if (this.map.w * 16 < AE.W) this.cam.x = -(AE.W - this.map.w * 16) / 2;
  if (this.map.h * 16 < AE.H) this.cam.y = -(AE.H - this.map.h * 16) / 2;
  if (this.shake) { this.cam.x += AE.rand(5) - 2; this.cam.y += AE.rand(5) - 2; this.shake--; }
};
AE.Field.prototype.npcAt = function (x, y) {
  for (let i = 0; i < this.npcs.length; i++) { const n = this.npcs[i]; if (n.hidden) continue; if ((n.x === x && n.y === y) || (n.moving && Math.round(n.px / 16) === x && Math.round(n.py / 16) === y)) return n; }
  return null;
};
AE.Field.prototype.blocked = function (x, y, who) {
  const c = this.map.c(x, y), C = AE.C;
  if (c === C.SOLID || c === C.WATER || c === C.COUNTER || c === C.LOW || c === C.LEDGE) return true;
  if (this.npcAt(x, y)) return true;
  if (who !== this.player && this.player.x === x && this.player.y === y) return true;
  return false;
};
AE.Field.prototype.run = function (id, arg) {
  const fn = AE.EV[id]; if (!fn) return Promise.resolve();
  const self = this; this.locked++;
  return Promise.resolve().then(function () { return fn(arg || {}); }).catch(function (e) { console.error('event ' + id, e); }).then(function () { self.locked = Math.max(0, self.locked - 1); });
};
AE.Field.prototype.update = function (g) {
  const I = g.input, p = this.player;
  this.npcs.forEach(function (n) { n.update(); });
  this.wanderNpcs();
  if (p.moving) {
    if (p.update()) this.arrive();
  } else if (!this.locked && !this.transit) {
    if (I.pressed.menu || (I.pressed.back && !this.noMenu)) { AE.Sfx && AE.Sfx.play('open'); g.push(new AE.MainMenu()); return; }
    if (I.pressed.ok) { this.interact(); }
    else {
      const d = I.dir();
      if (d >= 0) {
        p.dir = d; const D = AE.DIRS[d], nx = p.x + D.x, ny = p.y + D.y;
        p.speed = I.held.run || (AE.S_.cfg.autorun && !I.held.run) ? 2 : 1;
        if (!this.blocked(nx, ny, p)) { p.x = nx; p.y = ny; p.moving = true; }
        else { const w = this.map.warpAt(nx, ny); if (w && this.map.c(nx, ny) !== AE.C.OPEN) this.takeWarp(w); }
      }
    }
  }
  this.camFollow();
};
// a step finished: doors, touch events, encounters
AE.Field.prototype.arrive = function () {
  const p = this.player, S = AE.S_; S.x = p.x; S.y = p.y; S.dir = p.dir; S.steps++;
  const w = this.map.warpAt(p.x, p.y); if (w) { this.takeWarp(w); return; }
  const evs = this.map.eventsAt(p.x, p.y).filter(function (e) { return e.touch && (!e.if || AE.cond(e.if)) && (!e.unless || !AE.cond(e.unless)); });
  if (evs.length) { this.run(evs[0].id, evs[0]); return; }
  const enc = this.map.encAt(p.x, p.y);
  if (enc && AE.ENC && AE.ENC[enc] && !S.flags.noEnc) {
    const rate = S.equipEffect && S.equipEffect('encounter') || 1;
    this.stepsSince += rate;
    if (this.stepsSince >= this.encN) { this.stepsSince = 0; this.encN = this.rollEnc(); this.encounter(enc); }
  }
};
AE.Field.prototype.encounter = function (group) {
  const self = this; this.locked++;
  AE.startBattle(AE.rollFormation(group), { field: true }).then(function () { self.locked = Math.max(0, self.locked - 1); });
};
AE.Field.prototype.takeWarp = function (w) {
  if (this.transit) return; this.transit = true; const self = this;
  AE.Sfx && AE.Sfx.play(w.sound || 'door');
  AE.game.fadeOut(0.12).then(function () {
    if (w.to === '@world') { const p = (w.tx || w.ty) ? AE.landNear(w.tx, w.ty) : (AE.S_.worldRet || AE.landNear(70, 100)); AE.toWorld(p[0], p[1]); }
    else self.load(w.to, w.tx, w.ty, w.dir === undefined ? self.player.dir : w.dir);
    self.transit = false; return AE.game.fadeIn(0.12);
  });
};
AE.Field.prototype.interact = function () {
  const p = this.player, D = AE.DIRS[p.dir]; let tx = p.x + D.x, ty = p.y + D.y;
  if (this.map.c(tx, ty) === AE.C.COUNTER) { tx += D.x; ty += D.y; }
  const n = this.npcAt(tx, ty) || this.npcAt(p.x + D.x, p.y + D.y);
  if (n) { this.talk(n); return; }
  const ch = this.map.chestAt(p.x + D.x, p.y + D.y);
  if (ch) { this.openChest(ch); return; }
  const sg = this.map.signAt(p.x + D.x, p.y + D.y);
  if (sg) { this.locked++; const self = this; AE.say(sg).then(function () { self.locked--; }); return; }
  const ev = this.map.eventsAt(p.x + D.x, p.y + D.y).concat(this.map.eventsAt(tx, ty)).filter(function (e) { return !e.touch && (!e.if || AE.cond(e.if)) && (!e.unless || !AE.cond(e.unless)); });
  if (ev.length) { this.run(ev[0].id, ev[0]); return; }
  // standing on a check spot (not a step trigger) works too, whichever way you face
  const here = this.map.eventsAt(p.x, p.y).filter(function (e) { return !e.touch && (!e.if || AE.cond(e.if)) && (!e.unless || !AE.cond(e.unless)); });
  if (here.length) { this.run(here[0].id, here[0]); return; }
  // facing a solid object (a console, a bed, a mural) whose examine spot is the floor beside it
  const fx = p.x + D.x, fy = p.y + D.y, map = this.map, C = AE.C;
  if (map.c(fx, fy) === C.OPEN || map.c(fx, fy) === C.STAIR || map.c(fx, fy) === C.SHALLOW) return;
  const near = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(function (d) { return [fx + d[0], fy + d[1]]; }).filter(function (q) { return q[0] !== p.x || q[1] !== p.y; });
  for (let i = 0; i < near.length; i++) {
    const es = map.eventsAt(near[i][0], near[i][1]).filter(function (e) { return !e.touch && (!e.if || AE.cond(e.if)) && (!e.unless || !AE.cond(e.unless)); });
    if (es.length) { this.run(es[0].id, es[0]); return; }
  }
};
AE.Field.prototype.talk = function (n) {
  const self = this, p = this.player, d = n.def;
  if (!d.still) n.dir = (p.dir + 2) % 4;
  if (d.ev) { this.run(d.ev, n); return; }
  if (d.shop) { this.locked++; AE.openShop(d.shop, d).then(function () { self.locked--; }); return; }
  const lines = d.say || '...';
  this.locked++;
  const pick = Array.isArray(lines) ? lines[(n.talks = (n.talks || 0) + 1, Math.min(lines.length - 1, n.talks - 1))] : lines;
  AE.say(pick, { name: d.name }).then(function () { self.locked--; });
};
AE.Field.prototype.openChest = function (ch) {
  const S = AE.S_, self = this;
  this.locked++;
  if (S.chests[ch.id]) { AE.say('It\'s empty.').then(function () { self.locked--; }); return; }
  S.chests[ch.id] = 1; AE.Sfx && AE.Sfx.play('chest');
  AE.gain(ch.item, ch.n || 1).then(function () { self.locked--; });
};
AE.Field.prototype.wanderNpcs = function () {
  const self = this;
  this.npcs.forEach(function (n) {
    const d = n.def; if (n.moving || self.locked || !d.walk) return;
    if (--n.wait > 0) return; n.wait = 60 + AE.rand(160);
    const dir = AE.rand(4), D = AE.DIRS[dir], nx = n.x + D.x, ny = n.y + D.y; n.dir = dir;
    if (Math.abs(nx - n.home[0]) > (d.walk || 2) || Math.abs(ny - n.home[1]) > (d.walk || 2)) return;
    if (!self.blocked(nx, ny, n) && !self.map.warpAt(nx, ny)) { n.x = nx; n.y = ny; n.moving = true; n.speed = 0.5; }
  });
};
AE.Field.prototype.draw = function (ctx) {
  const m = this.map, cx = Math.round(this.cam.x), cy = Math.round(this.cam.y);
  ctx.fillStyle = m.d.bg || '#000'; ctx.fillRect(0, 0, AE.W, AE.H);
  m.drawLayer(ctx, 'ground', cx, cy); m.drawLayer(ctx, 'wall', cx, cy); m.drawLayer(ctx, 'deco', cx, cy);
  // chests opened show open
  const S = AE.S_;
  for (const k in m.d.chests) {
    const c = m.d.chests[k], xy = k.split(','), X = xy[0] * 16 - cx, Y = xy[1] * 16 - cy;
    if (X < -16 || Y < -16 || X > AE.W || Y > AE.H) continue;
    AE.drawChest(ctx, X, Y, !!S.chests[c.id], c.big);
  }
  const all = this.npcs.concat([this.player]).sort(function (a, b) { return a.py - b.py; });
  all.forEach(function (a) { a.draw(ctx, cx, cy); });
  m.drawLayer(ctx, 'over', cx, cy);
  // where to go next: a bouncing gold arrow over marked events (mark is a condition, like if)
  (m.d.events || []).forEach(function (e) {
    if (!e.mark || !AE.cond(e.mark)) return;
    const X = Math.round((e.x + e.w / 2) * 16 - cx), Y = Math.round(e.y * 16 - cy - 6 - Math.abs(Math.sin(AE.game.frame / 12)) * 5);
    if (X < -16 || Y < -16 || X > AE.W + 16 || Y > AE.H + 16) return;
    // a soft pulsing glow on the spot itself
    const gx = e.x * 16 - cx, gy = e.y * 16 - cy, pul = 0.25 + 0.2 * Math.sin(AE.game.frame / 9);
    ctx.fillStyle = 'rgba(255,214,80,' + pul.toFixed(3) + ')'; ctx.fillRect(gx, gy, e.w * 16, e.h * 16);
    ctx.strokeStyle = 'rgba(255,230,140,' + (pul + 0.3).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.strokeRect(gx + 0.5, gy + 0.5, e.w * 16 - 1, e.h * 16 - 1);
    // the arrow
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.moveTo(X - 8, Y - 11); ctx.lineTo(X + 8, Y - 11); ctx.lineTo(X, Y + 1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd040'; ctx.beginPath(); ctx.moveTo(X - 7, Y - 12); ctx.lineTo(X + 7, Y - 12); ctx.lineTo(X, Y - 1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff6c0'; ctx.fillRect(X - 5, Y - 11, 6, 1);
  });
  if (AE.fieldAmbient) AE.fieldAmbient(ctx, this, cx, cy);
  if (AE.fieldLight) AE.fieldLight(ctx, this, cx, cy);
  if (m.d.tint) { ctx.fillStyle = m.d.tint; ctx.fillRect(0, 0, AE.W, AE.H); }
  if (this.title > 0) {
    this.title--; const a = Math.min(1, this.title / 30);
    ctx.globalAlpha = a; const w = AE.textWidth(m.name) + 24; AE.window(ctx, (AE.W - w) / 2, 12, w, 20); AE.text(ctx, m.name, AE.W / 2, 18, '#fff', { align: 'center' }); ctx.globalAlpha = 1;
  }
};
AE.drawChest = function (ctx, X, Y, open, big) {
  const im = AE.IMG.chests; if (!im) { ctx.fillStyle = open ? '#653' : '#a72'; ctx.fillRect(X + 2, Y + 4, 12, 10); return; }
  ctx.drawImage(im, open ? 16 : 0, big ? 16 : 0, 16, 16, X, Y, 16, 16);
};
// conditions: 'flag', '!flag', 'a&b', 'item:key', 'party:lyra', 'chapter>=3'
AE.cond = function (c) {
  if (typeof c === 'function') return c();
  const S = AE.S_;
  return String(c).split('&').every(function (t) {
    t = t.trim(); let neg = false; if (t[0] === '!') { neg = true; t = t.slice(1); }
    let v;
    if (t.indexOf('item:') === 0) v = (S.inv[t.slice(5)] || 0) > 0;
    else if (t.indexOf('party:') === 0) v = S.party.indexOf(t.slice(6)) >= 0 || S.reserve.indexOf(t.slice(6)) >= 0;
    else if (/^chapter>=\d+$/.test(t)) v = S.chapter >= +t.split('>=')[1];
    else v = !!S.flags[t];
    return neg ? !v : v;
  });
};
AE.EV = {};
AE.field = function () { return AE.game.find('field'); };
