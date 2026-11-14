/* ================= The world map, in perspective =================
   A tilted, rotatable view of the whole world (SNES Mode 7 style): the ground is drawn from a texture with one
   8 x 8 block per tile, trees and mountains stand up as sprites, towns and dungeons as markers. Q/E rotate the
   view; walking onto a place enters it. Vehicles: Talonbird, Skimmer, boat, submersible, airship. */
AE.WT = null;     // terrain texture (Uint32), built once
AE.TERRAIN = {   // code -> [sheet, tx, ty, tint r,g,b], passable on foot
  0: ['water', 1, 7, 0.7, 0.75, 0.95], 1: ['water', 1, 7, 1.05, 1.08, 1.05], 2: ['floor', 1, 1, 1, 1, 1], 3: ['floor', 11, 12, 1, 1, 1], 4: ['floor', 11, 12, 0.55, 0.75, 0.55],
  5: ['floor', 12, 8, 0.95, 1, 0.8], 6: ['infloor', 12, 13, 1.15, 1.0, 0.85], 7: ['floor', 1, 1, 1.05, 0.95, 0.8], 8: ['floor', 1, 15, 1, 1, 1], 9: ['floor', 1, 15, 0.8, 0.85, 0.95],
  10: ['water', 13, 7, 0.8, 1.0, 0.7], 11: ['fills', 'ash', 0, 1, 1, 1], 12: ['water', 1, 7, 1.0, 1.05, 1.1], 13: ['floor', 12, 8, 1.1, 1.0, 0.9], 14: ['infloor', 1, 13, 0.85, 0.85, 0.9],
  15: ['floor', 11, 12, 0.45, 0.7, 0.45], 16: ['fills', 'lava', 0, 1, 1, 1], 17: ['infloor', 12, 13, 0.55, 0.5, 0.6], 18: ['infloor', 12, 13, 0.9, 0.8, 0.7], 19: ['floor', 11, 12, 1.15, 1.15, 0.7],
  20: ['infloor', 1, 7, 1, 0.85, 0.75], 21: ['water', 13, 1, 1, 1, 1], 22: ['water', 1, 7, 0.45, 0.5, 0.8]
};
AE.WALK = { foot: [2, 3, 4, 5, 7, 8, 10, 11, 13, 14, 15, 18, 19, 21], talon: [2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14, 15, 18, 19, 21], skimmer: [2, 3, 7, 11, 13, 14, 18, 19],
  boat: [0, 1, 12], sub: [0, 1, 22], airship: 'all' };
AE.LAND = { airship: [2, 3, 5, 7, 8, 11, 13, 19, 21], boat: [2], sub: [1] };
AE.buildWorldTexture = function () {
  const D = AE.WORLD, S = 8, c = document.createElement('canvas'); c.width = D.w * S; c.height = D.h * S; const x = c.getContext('2d');
  // one 8x8 swatch per terrain, slightly varied per tile
  const sw = {};
  Object.keys(AE.TERRAIN).forEach(function (k) {
    const T = AE.TERRAIN[k], im = AE.IMG[T[0]]; const s = document.createElement('canvas'); s.width = 8; s.height = 8; const sx = s.getContext('2d');
    const tx = typeof T[1] === 'string' ? AE.FILL_ORDER.indexOf(T[1]) : T[1];
    if (im) { sx.drawImage(im, tx * 16, T[2] * 16, 16, 16, 0, 0, 8, 8); }
    const d = sx.getImageData(0, 0, 8, 8); for (let i = 0; i < d.data.length; i += 4) { d.data[i] = Math.min(255, d.data[i] * T[3]); d.data[i + 1] = Math.min(255, d.data[i + 1] * T[4]); d.data[i + 2] = Math.min(255, d.data[i + 2] * T[5]); d.data[i + 3] = 255; }
    sx.putImageData(d, 0, 0); sw[k] = s;
  });
  for (let ty = 0; ty < D.h; ty++) for (let tx = 0; tx < D.w; tx++) x.drawImage(sw[D.t[ty * D.w + tx]], tx * S, ty * S);
  // soften: darken coasts, light shading by noise
  const img = x.getImageData(0, 0, c.width, c.height);
  AE.WT = { w: c.width, h: c.height, px: new Uint32Array(img.data.buffer), canvas: c };
  AE.WMINI = (function () { const m = document.createElement('canvas'); m.width = D.w; m.height = D.h; m.getContext('2d').drawImage(c, 0, 0, D.w, D.h); return m; })();
};
AE.wtile = function (x, y) { const D = AE.WORLD; x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= D.w || y >= D.h) return 22; return D.t[y * D.w + x]; };
AE.toWorld = function (x, y, v) {
  const g = AE.game; g.scenes = g.scenes.filter(function (s) { return s.kind !== 'field'; });
  const w = new AE.World(x, y, v); g.push(w); return w;
};
AE.World = function (x, y, v) {
  this.kind = 'world'; this.opaque = true;
  if (!AE.WT) AE.buildWorldTexture();
  const S = AE.S_; S.world = S.world || {}; S.world.x = x; S.world.y = y; S.world.v = v || S.world.v || null;
  this.x = x + 0.5; this.y = y + 0.5; this.ang = S.world.ang || 0; this.v = S.world.v; this.t = 0; this.steps = 0; this.encN = 40 + AE.rand(60);
  this.out = document.createElement('canvas'); this.out.width = AE.W; this.out.height = AE.H; this.octx = this.out.getContext('2d'); this.img = this.octx.createImageData(AE.W, AE.H); this.buf = new Uint32Array(this.img.data.buffer);
  this.lastTile = null; this.alt = this.v === 'airship' ? 1 : 0; this.mini = true;
  if (AE.Music) AE.Music.play(this.v === 'airship' ? 'airship' : this.v === 'boat' || this.v === 'sub' ? 'boat' : 'world');
};
AE.World.prototype.speed = function () { return { foot: 0.085, talon: 0.17, skimmer: 0.2, boat: 0.15, sub: 0.12, airship: 0.3 }[this.v || 'foot']; };
AE.World.prototype.canGo = function (x, y) {
  const t = AE.wtile(x, y), L = AE.WALK[this.v || 'foot'];
  if (L === 'all') return x > 0 && y > 0 && x < AE.WORLD.w - 1 && y < AE.WORLD.h - 1;
  if (L.indexOf(t) >= 0) return true;
  if (!this.v && t === 17 && AE.S_.flags.crater_open) return true;
  return false;
};
AE.World.prototype.placeAt = function (x, y) {
  const P = AE.WORLD.places; x = Math.floor(x); y = Math.floor(y);
  for (const k in P) { const p = P[k]; if (Math.abs(p[0] - x) <= 0 && Math.abs(p[1] - y) <= 0) return k; }
  return null;
};
AE.World.prototype.update = function (g) {
  const I = g.input, S = AE.S_; this.t++;
  if (this.busy) return;
  if (I.pressed.menu || I.pressed.back) { AE.Sfx.play('open'); g.push(new AE.MainMenu()); return; }
  if (I.pressed.map) this.mini = !this.mini;
  if (I.held.prev) this.ang -= 0.03; if (I.held.next) this.ang += 0.03;
  S.world.ang = this.ang;
  // movement relative to the view
  let fx = 0, fy = 0; if (I.held.up) fy -= 1; if (I.held.down) fy += 1; if (I.held.left) fx -= 1; if (I.held.right) fx += 1;
  if (fx || fy) {
    const sp = this.speed() * (I.held.run && !this.v ? 1.6 : 1), c = Math.cos(this.ang), s = Math.sin(this.ang);
    const dx = (fx * c - fy * s) * sp, dy = (fx * s + fy * c) * sp;
    this.face = Math.atan2(dy, dx);
    if (this.canGo(this.x + dx, this.y)) this.x += dx; if (this.canGo(this.x, this.y + dy)) this.y += dy;
    this.moving = true; this.anim = (this.anim || 0) + 0.15;
    const tk = Math.floor(this.x) + ',' + Math.floor(this.y);
    if (tk !== this.lastTile) { this.lastTile = tk; this.onTile(); }
  } else this.moving = false;
  S.world.x = Math.floor(this.x); S.world.y = Math.floor(this.y);
  if (I.pressed.ok) this.action();
  // a parked vehicle under you can be boarded with OK (see action)
};
AE.World.prototype.onTile = function () {
  const S = AE.S_;
  if (!this.v) {
    const p = this.placeAt(this.x, this.y);
    if (p) { this.enterPlace(p); return; }
  }
  // encounters: on foot, skimmer and boat (not the Talonbird or airship)
  if (this.v === 'talon' || this.v === 'airship' || S.flags.noEnc) return;
  const reg = AE.WORLD.reg[Math.floor(this.x / 16) + ',' + Math.floor(this.y / 16)];
  const t = AE.wtile(this.x, this.y), grp = this.v === 'boat' || this.v === 'sub' ? 'w_sea' : t === 4 || t === 15 ? (reg || 'w') + '_forest' : reg;
  const G = AE.ENC[grp] || AE.ENC[reg]; if (!G) return;
  if (++this.steps >= this.encN) {
    this.steps = 0; this.encN = 30 + AE.rand(60); const self = this; this.busy = true;
    const f = AE.rollFormation(AE.ENC[grp] ? grp : reg); f.bg = f.bg || AE.worldBg(t);
    AE.startBattle(f, {}).then(function () { self.busy = false; if (AE.Music) AE.Music.play('world'); });
  }
};
AE.worldBg = function (t) { return { 2: 'beach', 3: 'grass', 4: 'forest', 5: 'plains', 7: 'desert', 8: 'snow', 10: 'swamp', 11: 'slums', 13: 'plains', 15: 'forest', 19: 'plains', 21: 'ice', 0: 'sea', 1: 'sea' }[t] || 'grass'; };
AE.World.prototype.enterPlace = function (k, force) {
  const p = AE.WORLD.places[k], self = this, S = AE.S_;
  if (!force && AE.EV['place:' + k]) { this.busy = true; Promise.resolve(AE.EV['place:' + k](this)).then(function (r) { self.busy = false; }); return; }
  const M = AE.MAPS[p[2]]; if (!M) { this.notice = { text: p[6] + ' (not built yet)', t: 90 }; return; }
  this.busy = true;
  AE.game.fadeOut(0.1).then(function () {
    S.worldRet = [Math.floor(self.x), Math.floor(self.y)];
    S.world = null; AE.game.pop(self);
    const e = M.entry || [M.w >> 1, M.h - 2];
    const f = new AE.Field(p[2], e[0], e[1], 0); AE.game.push(f); f.title = 120;
    AE.game.fadeIn(0.1);
  });
};
AE.World.prototype.action = function () {
  const S = AE.S_, V = S.vehicles;
  if (this.v) {
    // get out: land next to here
    const t = AE.wtile(this.x, this.y), L = AE.LAND[this.v];
    if (this.v === 'sub' && t === 22) { const p = this.placeAt(this.x, this.y); if (p === 'coral' || (AE.WORLD.places.coral[0] === Math.floor(this.x) && AE.WORLD.places.coral[1] === Math.floor(this.y))) { this.enterPlace("coral"); return; } }
    let spot = null;
    if (L && L.indexOf(t) >= 0) spot = [this.x, this.y];
    else for (let a = 0; a < 8 && !spot; a++) { const nx = this.x + Math.cos(a * Math.PI / 4), ny = this.y + Math.sin(a * Math.PI / 4); if (AE.WALK.foot.indexOf(AE.wtile(nx, ny)) >= 0) spot = [nx, ny]; }
    if (!spot || (this.v === 'airship' && AE.LAND.airship.indexOf(t) < 0)) { AE.Sfx.play('buzz'); return; }
    V[this.v] = { x: Math.floor(this.x), y: Math.floor(this.y), have: 1 };
    this.x = Math.floor(spot[0]) + 0.5; this.y = Math.floor(spot[1]) + 0.5; this.v = null; S.world.v = null; AE.Sfx.play('door');
    if (AE.Music) AE.Music.play('world'); return;
  }
  // board a vehicle under or next to you
  for (const k in V) {
    const q = V[k]; if (!q || !q.have) continue;
    if (Math.abs(q.x + 0.5 - this.x) < 1.2 && Math.abs(q.y + 0.5 - this.y) < 1.2) {
      this.v = k; S.world.v = k; this.x = q.x + 0.5; this.y = q.y + 0.5; V[k] = Object.assign({}, q, { x: -99, y: -99 }); AE.Sfx.play('door');
      if (AE.Music) AE.Music.play(k === 'airship' ? 'airship' : k === 'boat' || k === 'sub' ? 'boat' : 'world'); return;
    }
  }
  if (S.flags.talon_whistle && this.v === null && AE.wtile(this.x, this.y) !== 8) { this.v = 'talon'; S.world.v = 'talon'; AE.Sfx.play('run'); }
};
// ---------- drawing ----------
AE.World.prototype.draw = function (ctx) {
  const W = AE.W, H = AE.H, T = AE.WT, buf = this.buf, air = this.v === 'airship';
  const hz = air ? 52 : 64, camH = air ? 56 : 30, focal = 160;
  const c = Math.cos(this.ang), s = Math.sin(this.ang);
  // camera sits behind the player
  const back = air ? 7 : 4.5, cx = this.x * 8 - (-s) * 0 - (s * back * 8) * 0, cy = this.y * 8;
  const fxv = s, fyv = -c;            // forward (view "up")
  const camX = this.x * 8 - fxv * back * 8, camY = this.y * 8 - fyv * back * 8;
  const sky1 = air ? [70, 120, 200] : [100, 150, 220], sky2 = [190, 215, 240];
  for (let y = 0; y <= hz; y++) { const k = y / hz, r = sky1[0] + (sky2[0] - sky1[0]) * k, gg = sky1[1] + (sky2[1] - sky1[1]) * k, b = sky1[2] + (sky2[2] - sky1[2]) * k; const col = (255 << 24) | (b << 16) | (gg << 8) | r; for (let x = 0; x < W; x++) buf[y * W + x] = col; }
  const tw = T.w, th = T.h, px = T.px;
  for (let y = hz + 1; y < H; y++) {
    const dist = camH * focal / (y - hz);
    const wx0 = camX + fxv * dist, wy0 = camY + fyv * dist;
    const lat = dist / focal;
    let wx = wx0 + (-W / 2) * lat * c, wy = wy0 + (-W / 2) * lat * s;
    const dx = lat * c, dy = lat * s;
    const fog = Math.min(1, Math.max(0, (dist - 420) / 500));
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const ix = wx | 0, iy = wy | 0;
      let col;
      if (ix < 0 || iy < 0 || ix >= tw || iy >= th) col = 0xff6a2a10; else col = px[iy * tw + ix];
      if (fog > 0) { const r = col & 255, gg = (col >> 8) & 255, b = (col >> 16) & 255; col = (255 << 24) | ((b + (240 - b) * fog) << 16) | ((gg + (220 - gg) * fog) << 8) | (r + (200 - r) * fog); }
      buf[row + x] = col; wx += dx; wy += dy;
    }
  }
  this.octx.putImageData(this.img, 0, 0);
  ctx.drawImage(this.out, 0, 0);
  // project world points to the screen
  const proj = function (wx, wy) {
    const rx = wx * 8 - camX, ry = wy * 8 - camY;
    const fwd = rx * fxv + ry * fyv, side = rx * c + ry * s;
    if (fwd < 8) return null;
    const sy = hz + camH * focal / fwd, sx = W / 2 + side * focal / fwd;
    return { x: sx, y: sy, k: focal / fwd * 8 / 16, d: fwd };
  };
  // billboards: trees, mountains and places near the camera
  const items = [], D = AE.WORLD, R = air ? 60 : 44, x0 = Math.floor(this.x - R), y0 = Math.floor(this.y - R);
  for (let ty = Math.max(0, y0); ty < Math.min(D.h, y0 + R * 2); ty += 1) {
    for (let tx = Math.max(0, x0); tx < Math.min(D.w, x0 + R * 2); tx += 1) {
      const t = D.t[ty * D.w + tx];
      if ((t === 4 || t === 15) && ((tx * 7 + ty * 3) % 3 === 0)) { const p = proj(tx + 0.5, ty + 0.5); if (p && p.y > hz) items.push({ p: p, kind: t === 15 ? 'jtree' : 'tree', tx: tx, ty: ty }); }
      else if ((t === 6 || t === 9) && ((tx + ty * 2) % 2 === 0)) { const p = proj(tx + 0.5, ty + 0.5); if (p && p.y > hz) items.push({ p: p, kind: t === 9 ? 'smount' : 'mount', tx: tx, ty: ty }); }
    }
  }
  for (const k in D.places) { const q = D.places[k]; if (q.hidden && !AE.S_.flags['found_' + k]) continue; const p = proj(q[0] + 0.5, q[1] + 0.5); if (p && p.y > hz - 4) items.push({ p: p, kind: 'place', place: k, q: q }); }
  const V = AE.S_.vehicles;
  for (const k in V) { const q = V[k]; if (q && q.have && q.x > 0) { const p = proj(q.x + 0.5, q.y + 0.5); if (p) items.push({ p: p, kind: 'veh', v: k }); } }
  items.sort(function (a, b) { return b.p.d - a.p.d; });
  const nat = AE.IMG.nature, hs = AE.IMG.house;
  items.forEach(function (it) {
    const p = it.p, k = Math.min(3.2, p.k);
    if (it.kind === 'tree' || it.kind === 'jtree') { if (nat) ctx.drawImage(nat, it.kind === 'jtree' ? 96 : (it.tx % 2 ? 32 : 0), 0, 32, 32, p.x - 16 * k, p.y - 30 * k, 32 * k, 32 * k); }
    else if (it.kind === 'mount' || it.kind === 'smount') {
      const h = 22 * k, w = 18 * k;
      ctx.fillStyle = it.kind === 'smount' ? '#9aa4b8' : '#7a6450'; ctx.beginPath(); ctx.moveTo(p.x - w, p.y); ctx.lineTo(p.x, p.y - h); ctx.lineTo(p.x + w, p.y); ctx.fill();
      ctx.fillStyle = it.kind === 'smount' ? '#e8eef8' : '#9a8068'; ctx.beginPath(); ctx.moveTo(p.x - w * 0.35, p.y - h * 0.65); ctx.lineTo(p.x, p.y - h); ctx.lineTo(p.x + w * 0.35, p.y - h * 0.65); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.moveTo(p.x, p.y - h); ctx.lineTo(p.x + w, p.y); ctx.lineTo(p.x + w * 0.2, p.y); ctx.fill();
    } else if (it.kind === 'place') {
      const ic = AE.PLACEICON[it.q[5]] || AE.PLACEICON.town, kk = Math.min(1.5, p.k * 1.1);
      if (hs && ic) ctx.drawImage(AE.IMG[ic[0]], ic[1] * 16, ic[2] * 16, ic[3] * 16, ic[4] * 16, p.x - ic[3] * 8 * kk, p.y - ic[4] * 16 * kk, ic[3] * 16 * kk, ic[4] * 16 * kk);
    } else if (it.kind === 'veh') AE.drawVehicle(ctx, it.v, p.x, p.y, Math.min(2, p.k * 1.4), 0);
  });
  // the player (or the vehicle carrying them)
  const PX = W / 2, PY = hz + camH * focal / (back * 8);
  if (this.v && this.v !== 'talon') AE.drawVehicle(ctx, this.v, PX, PY - (air ? 10 + Math.sin(this.t / 20) * 2 : 0), 1.4, this.t);
  else {
    if (this.v === 'talon') AE.drawVehicle(ctx, 'talon', PX, PY, 1.2, this.t);
    const dir = this.moving ? AE.faceDir(this.face - this.ang) : 0;
    AE.actor(ctx, AE.S_.party[0], this.moving ? 'walk' : 'idle', dir, Math.floor(this.anim || 0), PX, PY - (this.v === 'talon' ? 10 : 0), 0.85);
  }
  // HUD: place name nearby, minimap
  const near = this.placeAt(this.x, this.y);
  if (this.notice && this.notice.t-- > 0) { const w = AE.textWidth(this.notice.text) + 20; AE.window(ctx, (W - w) / 2, 8, w, 18); AE.text(ctx, this.notice.text, W / 2, 13, '#fff', { align: 'center' }); }
  if (this.mini) {
    const mw = 64, mh = 48; ctx.globalAlpha = 0.85; ctx.drawImage(AE.WMINI, W - mw - 6, H - mh - 6, mw, mh); ctx.globalAlpha = 1;
    ctx.strokeStyle = '#fff'; ctx.strokeRect(W - mw - 6.5, H - mh - 6.5, mw + 1, mh + 1);
    const mx = W - mw - 6 + this.x / AE.WORLD.w * mw, my = H - mh - 6 + this.y / AE.WORLD.h * mh;
    ctx.fillStyle = AE.game.frame % 30 < 15 ? '#ff4040' : '#fff'; ctx.fillRect(mx - 1, my - 1, 3, 3);
    ctx.strokeStyle = '#ff4040'; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + Math.sin(this.ang) * 5, my - Math.cos(this.ang) * 5); ctx.stroke();
  }
};
AE.faceDir = function (a) { a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); const q = Math.round(a / (Math.PI / 2)) % 4; return [1, 2, 3, 0][q]; };
AE.PLACEICON = { city: ['towers', 0, 0, 3, 3], town: ['house', 0, 0, 4, 3], village: ['house', 23, 0, 3, 3], temple: ['house', 16, 7, 2, 2], forest: ['nature', 6, 0, 2, 2], ranch: ['house', 26, 0, 3, 3],
  cave: ['house', 0, 7, 3, 3], spire: ['towers', 3, 0, 3, 3], port: ['house', 8, 0, 4, 3], sea: ['water', 1, 7, 1, 1], ruins: ['village', 0, 0, 3, 3], tower: ['towers', 6, 0, 3, 3],
  wreck: ['village', 3, 0, 3, 3], volcano: ['nature', 4, 0, 2, 2], crater: ['nature', 4, 0, 2, 2], shrine: ['house', 0, 15, 2, 2], hut: ['house', 23, 0, 3, 3] };
AE.drawVehicle = function (ctx, v, x, y, k, t) {
  const col = { talon: '#f0c040', skimmer: '#c86040', boat: '#a07048', sub: '#5080c0', airship: '#c0a060' }[v] || '#fff';
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-10, -1, 20, 3);
  if (v === 'airship') {
    ctx.fillStyle = '#7a5a3a'; ctx.fillRect(-12, -8, 24, 6); ctx.fillStyle = col; ctx.fillRect(-14, -18, 28, 9); ctx.fillStyle = '#e8e0c8'; ctx.fillRect(-12, -17, 24, 3);
    ctx.fillStyle = '#504030'; const p = (t / 3) % 2 ? 6 : 2; ctx.fillRect(-16, -14, 2, p); ctx.fillRect(14, -14, 2, p);
  } else if (v === 'boat' || v === 'sub') {
    ctx.fillStyle = col; ctx.fillRect(-12, -6, 24, 6); ctx.fillStyle = v === 'sub' ? '#a0c0e0' : '#e8e0c8'; ctx.fillRect(-4, v === 'sub' ? -10 : -18, v === 'sub' ? 8 : 2, v === 'sub' ? 4 : 12);
    if (v === 'boat') { ctx.fillStyle = '#f0f0f0'; ctx.fillRect(-2, -18, 8, 9); }
  } else if (v === 'skimmer') { ctx.fillStyle = col; ctx.fillRect(-10, -8, 20, 6); ctx.fillStyle = '#303030'; ctx.fillRect(-9, -3, 5, 3); ctx.fillRect(4, -3, 5, 3); ctx.fillStyle = '#a0d0f0'; ctx.fillRect(-3, -11, 6, 3); }
  else if (v === 'talon') { ctx.fillStyle = col; ctx.fillRect(-7, -14, 14, 9); ctx.fillRect(4, -20, 5, 8); ctx.fillStyle = '#f08020'; ctx.fillRect(8, -18, 4, 2); ctx.fillStyle = '#c09020'; const l = (t / 4) % 2 ? 2 : 0; ctx.fillRect(-4 + l, -5, 2, 5); ctx.fillRect(2 - l, -5, 2, 5); }
  ctx.restore();
};
