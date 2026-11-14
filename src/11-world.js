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
  boat: [0, 1, 12], sub: [0, 1, 22], airship: 'all',
  gtalon: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21] };   // the gold talonbird crosses mountains and shallow seas
AE.LAND = { airship: [2, 3, 5, 7, 8, 11, 13, 19, 21], boat: [2], sub: [1] };
// ---------- the world as a landscape: a height map and a colour map, 4 pixels per tile ----------
AE.WS = 4;
AE.buildWorldTexture = function () {
  const D = AE.WORLD, S = AE.WS, MW = D.w * S, MH = D.h * S, N = MW * MH;
  const hash = function (x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const vn = function (x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const fbm = function (x, y, o) { let s = 0, a = 1, n = 0; for (let i = 0; i < o; i++) { s += a * vn(x, y); n += a; a *= 0.5; x *= 2.03; y *= 2.03; } return s / n; };
  const tile = function (x, y) { x = Math.max(0, Math.min(D.w - 1, x)); y = Math.max(0, Math.min(D.h - 1, y)); return D.t[y * D.w + x]; };
  // per terrain: base height, detail amplitude, colour
  const WATER = { 0: 1, 1: 1, 12: 1, 22: 1, 16: 0 };
  const HB = { 2: 0.8, 3: 1.6, 4: 2, 5: 3.5, 6: 6, 7: 1.6, 8: 2, 9: 7, 10: 1.2, 11: 1.6, 13: 1.6, 14: 1.8, 15: 2, 16: 1, 17: 0.6, 18: 1.6, 19: 1.6, 20: 6, 21: 1.2 };
  const COL = { 2: [222, 204, 150], 3: [92, 158, 62], 4: [38, 98, 44], 5: [128, 140, 78], 6: [122, 104, 84], 7: [222, 186, 116], 8: [236, 242, 250], 9: [200, 208, 222],
    10: [78, 98, 64], 11: [104, 92, 88], 13: [170, 140, 96], 14: [150, 150, 158], 15: [34, 112, 54], 16: [232, 90, 30], 17: [64, 52, 62], 18: [96, 80, 66], 19: [150, 172, 72], 20: [186, 112, 74], 21: [196, 228, 246] };
  const hb = function (t) { return WATER[t] ? 0 : (HB[t] || 3); };
  // smooth fields from the tile grid (bilinear between tile centres)
  const H = new Float32Array(N), land = new Float32Array(N), mnt = new Float32Array(N), hil = new Float32Array(N), fst = new Float32Array(N), dsr = new Float32Array(N), mes = new Float32Array(N), snw = new Float32Array(N), dep = new Float32Array(N);
  for (let py = 0; py < MH; py++) {
    const fy = (py + 0.5) / S - 0.5, ty = Math.floor(fy), wy = fy - ty;
    for (let px = 0; px < MW; px++) {
      const fx = (px + 0.5) / S - 0.5, tx = Math.floor(fx), wx = fx - tx, i = py * MW + px;
      const T = [tile(tx, ty), tile(tx + 1, ty), tile(tx, ty + 1), tile(tx + 1, ty + 1)], Wt = [(1 - wx) * (1 - wy), wx * (1 - wy), (1 - wx) * wy, wx * wy];
      let h = 0, l = 0, m = 0, hi = 0, f = 0, d = 0, me = 0, sn = 0, dp = 0;
      for (let k = 0; k < 4; k++) {
        const t = T[k], w = Wt[k]; h += hb(t) * w; l += (WATER[t] ? 0 : 1) * w;
        m += (t === 6 || t === 9 ? 1 : 0) * w; hi += (t === 5 ? 1 : 0) * w; f += (t === 4 || t === 15 ? 1 : 0) * w; d += (t === 7 ? 1 : 0) * w; me += (t === 20 ? 1 : 0) * w;
        sn += (t === 8 || t === 9 || t === 21 ? 1 : 0) * w; dp += (t === 22 ? 2 : t === 0 ? 1 : 0) * w;
      }
      H[i] = h; land[i] = l; mnt[i] = m; hil[i] = hi; fst[i] = f; dsr[i] = d; mes[i] = me; snw[i] = sn; dep[i] = dp;
    }
  }
  // land or water at each pixel: the smooth land field, nudged by noise so coasts are ragged, not tile-shaped
  const height = new Float32Array(N), col = new Uint32Array(N), water = new Uint8Array(N);
  const rgb = [0, 0, 0];
  for (let py = 0; py < MH; py++) for (let px = 0; px < MW; px++) {
    const i = py * MW + px, x = px / S, y = py / S;
    const n1 = fbm(x * 0.35, y * 0.35, 3), n2 = fbm(x * 1.3 + 50, y * 1.3, 2);
    const L = land[i] + (n1 - 0.5) * 0.45 + (n2 - 0.5) * 0.15;
    if (L < 0.5) { water[i] = 1; height[i] = 0; continue; }
    // ridged noise for peaks, rolling noise for hills, bumps for tree canopy, ripples for dunes
    const rid = 1 - Math.abs(fbm(x * 0.22 + 9, y * 0.22 + 3, 4) * 2 - 1);
    let h = H[i] + Math.min(1, (L - 0.5) * 6) * 0.8;
    h += mnt[i] * (rid * rid * 12 + fbm(x * 0.6, y * 0.6, 3) * 3);
    h += hil[i] * fbm(x * 0.4 + 3, y * 0.4, 3) * 2.5;
    h += fst[i] * fbm(x * 2.2, y * 2.2, 2) * 1.2;
    h += dsr[i] * (Math.sin(x * 1.1 + fbm(x * 0.3, y * 0.3, 2) * 6) * 0.5 + 0.5) * 0.6;
    if (mes[i] > 0.45) h = 7 + fbm(x, y, 2);                 // flat-topped mesas with sheer sides
    h *= Math.min(1, (L - 0.5) * 4 + 0.2);                        // land slopes down to the sea
    height[i] = Math.max(0.4, h);
  }
  // round off the peaks: two passes of a small blur over the land (the sea stays flat)
  const tmp = new Float32Array(N);
  for (let pass = 0; pass < 2; pass++) {
    for (let py = 0; py < MH; py++) for (let px = 0; px < MW; px++) {
      const i = py * MW + px; if (water[i]) { tmp[i] = 0; continue; }
      let a = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = px + dx, Y = py + dy; if (X < 0 || Y < 0 || X >= MW || Y >= MH) continue; a += height[Y * MW + X]; n++; }
      tmp[i] = Math.max(0.4, a / n);
    }
    height.set(tmp);
  }
  // colour: the terrain picked at a jittered position (organic borders), lit by the slope, snow on high peaks
  for (let py = 0; py < MH; py++) for (let px = 0; px < MW; px++) {
    const i = py * MW + px, x = px / S, y = py / S;
    const hL = height[py * MW + Math.max(0, px - 1)], hR = height[py * MW + Math.min(MW - 1, px + 1)], hU = height[Math.max(0, py - 1) * MW + px], hD = height[Math.min(MH - 1, py + 1) * MW + px];
    const gx = (hR - hL) * 0.5, gy = (hD - hU) * 0.5, shade = Math.max(0.5, Math.min(1.35, 1 + (-gx * 0.7 - gy * 0.9) * 0.45));
    const g = fbm(x * 1.7, y * 1.7, 2), g2 = hash(px, py);
    if (water[i]) {
      // depth: turquoise shallows by the shore, blue sea, navy deeps
      let dp = dep[i]; const near = 1 - land[i];
      const sh = Math.max(0, 1 - near * 1.6);
      const a = [40, 90, 170], b = [16, 46, 112], c = [70, 160, 200];
      const k = Math.min(1, Math.max(0, dp - 1));
      let r = a[0] + (b[0] - a[0]) * k, gg = a[1] + (b[1] - a[1]) * k, bb = a[2] + (b[2] - a[2]) * k;
      r += (c[0] - r) * sh; gg += (c[1] - gg) * sh; bb += (c[2] - bb) * sh;
      const t0 = tile(Math.floor(x), Math.floor(y)); if (t0 === 12) { r = 70; gg = 150; bb = 210; }
      const wv = (g - 0.5) * 18; r += wv; gg += wv; bb += wv;
      if (land[i] + (fbm(x * 0.35, y * 0.35, 3) - 0.5) * 0.45 > 0.42) { r += 60; gg += 60; bb += 50; }   // surf
      col[i] = 0xff000000 | (Math.max(0, Math.min(255, bb)) << 16) | (Math.max(0, Math.min(255, gg)) << 8) | Math.max(0, Math.min(255, r)); continue;
    }
    const jx = Math.floor(x + (fbm(x * 0.9 + 7, y * 0.9, 2) - 0.5) * 1.4), jy = Math.floor(y + (fbm(x * 0.9, y * 0.9 + 7, 2) - 0.5) * 1.4);
    let t = tile(jx, jy); if (WATER[t] && t !== 16) t = tile(Math.floor(x), Math.floor(y)); if (WATER[t] && t !== 16) t = 2;
    const C = COL[t] || COL[3]; rgb[0] = C[0]; rgb[1] = C[1]; rgb[2] = C[2];
    const h = height[i], slope = Math.abs(gx) + Math.abs(gy);
    if (mnt[i] > 0.2 && slope > 0.9) { const k = Math.min(1, (slope - 0.9) / 1.5); rgb[0] += (110 - rgb[0]) * k; rgb[1] += (96 - rgb[1]) * k; rgb[2] += (84 - rgb[2]) * k; }   // bare rock on steep sides
    if (h > 14 || (snw[i] > 0.4 && h > 6)) { const k = Math.min(1, (h - (snw[i] > 0.4 ? 6 : 14)) / 3); rgb[0] += (245 - rgb[0]) * k; rgb[1] += (248 - rgb[1]) * k; rgb[2] += (252 - rgb[2]) * k; }   // snow caps
    if (t === 4 || t === 15) { const k = (g2 < 0.5 ? -14 : 10) + (g - 0.5) * 40; rgb[0] += k * 0.5; rgb[1] += k; rgb[2] += k * 0.5; }   // dappled canopy
    else { const big = fbm(x * 0.45 + 20, y * 0.45, 3) - 0.5, k = (g - 0.5) * 34 + (g2 - 0.5) * 14 + big * 40; rgb[0] += k * (t === 3 || t === 19 ? 0.6 : 1); rgb[1] += k; rgb[2] += k * (t === 3 || t === 19 ? 0.5 : 1);
      if ((t === 3 || t === 19) && big > 0.12) { rgb[0] += 18; rgb[1] += 8; }  }   // sunlit meadows, darker hollows
    if (t === 16 || t === 17) { const k = 0.5 + 0.5 * Math.sin(x * 3 + y * 2); rgb[0] += k * 30; }
    const r = Math.max(0, Math.min(255, rgb[0] * shade)), gg = Math.max(0, Math.min(255, rgb[1] * shade)), bb = Math.max(0, Math.min(255, rgb[2] * shade));
    col[i] = 0xff000000 | (bb << 16) | (gg << 8) | r;
  }
  const c = document.createElement('canvas'); c.width = MW; c.height = MH; const cx = c.getContext('2d'), im = cx.createImageData(MW, MH);
  new Uint32Array(im.data.buffer).set(col); cx.putImageData(im, 0, 0);
  AE.WT = { w: MW, h: MH, px: col, hgt: height, water: water, canvas: c };
  AE.WMINI = (function () { const m = document.createElement('canvas'); m.width = D.w; m.height = D.h; const k = m.getContext('2d'); k.imageSmoothingEnabled = true; k.drawImage(c, 0, 0, D.w, D.h); return m; })();
};
AE.wheight = function (x, y) {   // ground height at a world position in tiles (bilinear)
  const T = AE.WT, S = AE.WS, fx = x * S - 0.5, fy = y * S - 0.5, ix = Math.floor(fx), iy = Math.floor(fy), ax = fx - ix, ay = fy - iy;
  const g = function (a, b) { a = Math.max(0, Math.min(T.w - 1, a)); b = Math.max(0, Math.min(T.h - 1, b)); return T.hgt[b * T.w + a]; };
  return (g(ix, iy) * (1 - ax) + g(ix + 1, iy) * ax) * (1 - ay) + (g(ix, iy + 1) * (1 - ax) + g(ix + 1, iy + 1) * ax) * ay;
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
  if (this.v === 'talon' || this.v === 'gtalon' || this.v === 'airship' || S.flags.noEnc) return;
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
  // a real landscape, ray-cast column by column (voxel terrain): hills and peaks stand up, the horizon bends away
  const W = AE.W, H = AE.H, T = AE.WT, buf = this.buf, air = this.v === 'airship', S = AE.WS;
  const c = Math.cos(this.ang), s = Math.sin(this.ang), fxv = s, fyv = -c;
  const focal = 150, hz = air ? 40 : 50, curv = air ? 0.00022 : 0.0003;
  const back = (air ? 22 : 13) * S;
  const pH = AE.wheight(this.x, this.y) + (air ? 10 + Math.sin(this.t / 20) * 0.5 : 0);
  const camX = this.x * S - fxv * back, camY = this.y * S - fyv * back;
  let clear = 0; for (let k = 0; k <= 1; k += 0.125) clear = Math.max(clear, AE.wheight((camX + fxv * back * k) / S, (camY + fyv * back * k) / S) + 6 + (1 - k) * 4);
  const want = Math.max(pH + (air ? 48 : 26), clear);
  this.camH = this.camH == null ? want : this.camH + (want - this.camH) * 0.1;
  const camH = this.camH;
  const red = AE.S_ && AE.S_.chapter >= 5 && !(AE.S_.flags && AE.S_.flags.cleared);   // after the Sundering the sky is cracked and red
  const sky1 = red ? [90, 20, 30] : air ? [52, 96, 186] : [70, 122, 206], sky2 = red ? [220, 110, 70] : [200, 222, 240];
  for (let y = 0; y < H; y++) {
    const k = Math.min(1, Math.max(0, y / (hz + 20))), r = sky1[0] + (sky2[0] - sky1[0]) * k, gg = sky1[1] + (sky2[1] - sky1[1]) * k, b = sky1[2] + (sky2[2] - sky1[2]) * k;
    const col = (255 << 24) | (b << 16) | (gg << 8) | r, row = y * W; for (let x = 0; x < W; x++) buf[row + x] = col;
  }
  // a few soft clouds that turn with the view
  if (!AE.WCLOUD) { AE.WCLOUD = []; for (let i = 0; i < 14; i++) AE.WCLOUD.push([Math.random() * Math.PI * 2, 8 + Math.random() * (hz - 30), 18 + Math.random() * 40, 3 + Math.random() * 5]); }
  for (const cl of AE.WCLOUD) {
    let a = cl[0] - this.ang - this.t * 0.0004; a = ((a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    if (Math.abs(a) > 1.2) continue;
    const cx0 = W / 2 + Math.tan(a) * focal, cy0 = cl[1] * (red ? 1 : 1), cw = cl[2], ch = cl[3];
    for (let y = Math.max(0, cy0 - ch | 0); y < Math.min(hz + 10, cy0 + ch); y++) for (let x = Math.max(0, cx0 - cw | 0); x < Math.min(W, cx0 + cw); x++) {
      const d = ((x - cx0) / cw) ** 2 + ((y - cy0) / ch) ** 2; if (d > 1) continue;
      const i = y * W + x, o = buf[i], k = (1 - d) * 0.55, r = o & 255, g2 = (o >> 8) & 255, b = (o >> 16) & 255;
      buf[i] = 0xff000000 | ((b + (255 - b) * k) << 16) | ((g2 + (255 - g2) * k) << 8) | (r + (255 - r) * k);
    }
  }
  const tw = T.w, th = T.h, px = T.px, hg = T.hgt, wa = T.water;
  const zb = this.zb || (this.zb = new Float32Array(W * H)); zb.fill(1e9);
  const maxZ = air ? 1100 : 820, fog0 = air ? 450 : 330, fr = sky2[0], fgc = sky2[1], fb = sky2[2], tt = this.t >> 3;
  for (let x = 0; x < W; x++) {
    const r0 = (x - W / 2) / focal, dx = fxv + c * r0, dy = fyv + s * r0;
    let ybuf = H, z = 1.5, dz = 0.5;
    while (z < maxZ && ybuf > 0) {
      const mx = (camX + dx * z) | 0, my = (camY + dy * z) | 0;
      let h = 0, col = 0xff70300e, wet = 1;
      if (mx >= 0 && my >= 0 && mx < tw - 1 && my < th - 1) {
        const i = my * tw + mx; h = hg[i]; col = px[i]; wet = wa[i];
        if (z < 140) {      // up close, blend the four neighbouring pixels so the ground isn't blocky
          const fx = camX + dx * z - mx, fy = camY + dy * z - my, a = px[i], b = px[i + 1], cc = px[i + tw], d = px[i + tw + 1];
          const w0 = (1 - fx) * (1 - fy), w1 = fx * (1 - fy), w2 = (1 - fx) * fy, w3 = fx * fy;
          const R = (a & 255) * w0 + (b & 255) * w1 + (cc & 255) * w2 + (d & 255) * w3, G = ((a >> 8) & 255) * w0 + ((b >> 8) & 255) * w1 + ((cc >> 8) & 255) * w2 + ((d >> 8) & 255) * w3, B = ((a >> 16) & 255) * w0 + ((b >> 16) & 255) * w1 + ((cc >> 16) & 255) * w2 + ((d >> 16) & 255) * w3;
          col = 0xff000000 | (B << 16) | (G << 8) | R; h = hg[i] * w0 + hg[i + 1] * w1 + hg[i + tw] * w2 + hg[i + tw + 1] * w3;
        }
      }
      const sy = (hz + (camH - h + z * z * curv) * focal / z) | 0;
      if (sy < ybuf) {
        if (wet && (((mx * 7 + my * 13 + tt) & 31) === 0)) col = (col & 0xff000000) | Math.min(0xffffff, (col & 0xfefefe) + 0x303030);   // glints on the water
        if (z > fog0) {
          const f = Math.min(1, (z - fog0) / (maxZ - fog0)), r = col & 255, g2 = (col >> 8) & 255, b = (col >> 16) & 255;
          col = 0xff000000 | ((b + (fb - b) * f) << 16) | ((g2 + (fgc - g2) * f) << 8) | (r + (fr - r) * f);
        }
        for (let y = sy < 0 ? 0 : sy; y < ybuf; y++) { buf[y * W + x] = col; zb[y * W + x] = z; }
        ybuf = sy;
      }
      z += dz; dz *= 1.011;
    }
  }
  this.octx.putImageData(this.img, 0, 0);
  ctx.drawImage(this.out, 0, 0);
  // project world points to the screen (and test them against the terrain in front)
  const proj = function (wx, wy, up) {
    const rx = wx * S - camX, ry = wy * S - camY;
    const fwd = rx * fxv + ry * fyv, side = rx * c + ry * s;
    if (fwd < 3) return null;
    const h = AE.wheight(wx, wy) + (up || 0), sy = hz + (camH - h + fwd * fwd * curv) * focal / fwd, sx = W / 2 + side * focal / fwd;
    return { x: sx, y: sy, k: focal / fwd * S / 16, d: fwd };
  };
  const seen = function (p, tall) {
    for (const yy of [p.y - 1, p.y - tall]) { const X = Math.round(p.x), Y = Math.round(yy); if (X < 0 || X >= W || Y < 0) continue; if (Y >= H || zb[Y * W + X] >= p.d - 3) return true; }
    return false;
  };
  // billboards: trees close by, and places
  const items = [], D = AE.WORLD, R = 22, x0 = Math.floor(this.x - R), y0 = Math.floor(this.y - R);
  if (!air) for (let ty = Math.max(0, y0); ty < Math.min(D.h, y0 + R * 2); ty++) for (let tx = Math.max(0, x0); tx < Math.min(D.w, x0 + R * 2); tx++) {
    const t = D.t[ty * D.w + tx];
    if ((t === 4 || t === 15) && ((tx * 7 + ty * 3) % 2 === 0)) { const p = proj(tx + 0.3 + ((tx * 13 + ty) % 5) * 0.1, ty + 0.5); if (p && p.y > hz && seen(p, 12 * p.k)) items.push({ p: p, kind: t === 15 ? 'jtree' : 'tree', tx: tx, ty: ty }); }
  }
  for (const k in D.places) { const q = D.places[k]; if (q.hidden && !AE.S_.flags['found_' + k]) continue; const p = proj(q[0] + 0.5, q[1] + 0.5); if (p && seen(p, 30 * Math.min(2.2, p.k * 1.4))) items.push({ p: p, kind: 'place', place: k, q: q }); }
  const V = AE.S_.vehicles;
  for (const k in V) { const q = V[k]; if (q && q.have && q.x > 0) { const p = proj(q.x + 0.5, q.y + 0.5); if (p && seen(p, 10)) items.push({ p: p, kind: 'veh', v: k }); } }
  this._pv = { PY: hz + (camH - pH) * focal / back, tile: S * focal / back };
  items.sort(function (a, b) { return b.p.d - a.p.d; });
  const nat = AE.IMG.nature, hs = AE.IMG.house;
  items.forEach(function (it) {
    const p = it.p, k = Math.min(3.2, p.k);
    if (it.kind === 'tree' || it.kind === 'jtree') { if (nat) ctx.drawImage(nat, it.kind === 'jtree' ? 96 : (it.tx % 2 ? 32 : 0), 0, 32, 32, p.x - 16 * k, p.y - 30 * k, 32 * k, 32 * k); }
    else if (it.kind === 'place') {
      const ic = AE.PLACEICON[it.q[5]] || AE.PLACEICON.town, kk = Math.min(2.2, p.k * 1.4);
      if (hs && ic) ctx.drawImage(AE.IMG[ic[0]], ic[1] * 16, ic[2] * 16, ic[3] * 16, ic[4] * 16, p.x - ic[3] * 8 * kk, p.y - ic[4] * 16 * kk, ic[3] * 16 * kk, ic[4] * 16 * kk);
    } else if (it.kind === 'veh') AE.drawVehicle(ctx, it.v, p.x, p.y, Math.min(2, p.k * 1.4), 0);
  });
  // the player (or the vehicle carrying them)
  const PX = W / 2, PY = this._pv.PY;
  if (this.v && this.v !== 'talon') AE.drawVehicle(ctx, this.v, PX, PY - (air ? 6 : 0), air ? 1.15 : 1.3, this.t);
  else {
    if (this.v === 'talon' || this.v === 'gtalon') AE.drawVehicle(ctx, this.v, PX, PY, 1.2, this.t);
    const dir = this.moving ? AE.faceDir(this.face - this.ang) : 0;
    AE.actor(ctx, AE.S_.party[0], this.moving ? 'walk' : 'idle', dir, Math.floor(this.anim || 0), PX, PY - (this.v === 'talon' || this.v === 'gtalon' ? 10 : 0), 0.85);
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
  const col = { gtalon: '#ffe060', talon: '#f0c040', skimmer: '#c86040', boat: '#a07048', sub: '#5080c0', airship: '#c0a060' }[v] || '#fff';
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  const P = function (fill, pts, stroke) { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 0.8; ctx.stroke(); } };
  const E = function (fill, x, y, rx, ry, stroke) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 0.8; ctx.stroke(); } };
  const gr = function (y0, y1, a, b) { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
  if (v === 'airship') {
    // seen from behind and above: a gold gasbag with ribs, a wooden gondola-hull, swept wings with spinning propellers
    const spin = (t / 2) % 4, bob = 0;
    E('rgba(0,0,0,.22)', 0, 2, 16, 3);
    P(gr(-14, -6, '#8a6a48', '#5a3e26'), [-24, -12, -8, -15, -8, -9, -22, -7], '#3a2818');        // left wing
    P(gr(-14, -6, '#8a6a48', '#5a3e26'), [24, -12, 8, -15, 8, -9, 22, -7], '#3a2818');           // right wing
    for (const sx of [-23, 23]) {                                                                   // engine pods and propellers
      E('#4a4a52', sx, -10, 2.6, 2.6, '#202024'); E('#c8c8d0', sx, -10, 0.9, 0.9);
      ctx.strokeStyle = 'rgba(230,230,240,.85)'; ctx.lineWidth = 1.2; ctx.beginPath();
      const a0 = spin * Math.PI / 4; ctx.moveTo(sx + Math.cos(a0) * 6, -10 + Math.sin(a0) * 6); ctx.lineTo(sx - Math.cos(a0) * 6, -10 - Math.sin(a0) * 6);
      ctx.moveTo(sx + Math.cos(a0 + 1.57) * 6, -10 + Math.sin(a0 + 1.57) * 6); ctx.lineTo(sx - Math.cos(a0 + 1.57) * 6, -10 - Math.sin(a0 + 1.57) * 6); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(sx, -10, 6, 0, 7); ctx.stroke();
    }
    P(gr(-16, 0, '#9c6c40', '#4e3018'), [-10, -14, 10, -14, 8, -4, 4, 0, -4, 0, -8, -4], '#2e1c0e');   // hull (stern view)
    ctx.fillStyle = 'rgba(255,220,140,.9)'; ctx.fillRect(-5, -10, 2.4, 2); ctx.fillRect(-1.2, -10, 2.4, 2); ctx.fillRect(2.6, -10, 2.4, 2);   // stern windows
    ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-9, -7); ctx.lineTo(9, -7); ctx.stroke();
    P('#c8a060', [-2, -4, 2, -4, 0, 3], '#5a3e26');                                                   // rudder
    ctx.strokeStyle = '#3a2818'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-7, -14); ctx.lineTo(-9, -20); ctx.moveTo(7, -14); ctx.lineTo(9, -20); ctx.moveTo(0, -14); ctx.lineTo(0, -20); ctx.stroke();   // rigging
    E(gr(-34, -18, '#f4d27a', '#b0802c'), 0, -26, 17, 8.5, '#6a4a18');                              // gasbag
    ctx.strokeStyle = 'rgba(110,74,24,.6)'; ctx.lineWidth = 0.7;
    for (const k of [-0.6, -0.2, 0.2, 0.6]) { ctx.beginPath(); ctx.ellipse(0, -26, 17 * Math.abs(k) + 0.5, 8.5, 0, -Math.PI / 2, Math.PI / 2, k < 0); ctx.stroke(); }
    E('rgba(255,250,220,.55)', -6, -30, 6, 2.2);                                                      // highlight
    P('#a02828', [-3, -35, 3, -35, 0, -40], '#501010');                                               // fin
  } else if (v === 'boat') {
    E('rgba(255,255,255,.35)', 0, 1, 14, 2.5);                                                        // wake
    P(gr(-8, 0, '#a0683a', '#5a3418'), [-13, -7, 13, -7, 10, 0, -10, 0], '#2e1a0c');                  // hull
    ctx.fillStyle = '#e8e0cc'; ctx.fillRect(-13, -8, 26, 1.5);
    ctx.fillStyle = '#d8d0c0'; ctx.fillRect(-6, -13, 9, 6); ctx.fillStyle = '#4a6a8a'; ctx.fillRect(-5, -12, 2, 2); ctx.fillRect(-1, -12, 2, 2);   // cabin
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(5, -26, 1.2, 19);                                          // mast
    P('#f4f0e4', [6.5, -25, 6.5, -10, 14, -11], '#9a9480'); P('#f4f0e4', [4.5, -24, 4.5, -11, -2, -12], '#9a9480');   // sails
    P('#c03030', [6, -26, 10, -24.5, 6, -23]);
  } else if (v === 'sub') {
    E('rgba(255,255,255,.3)', 0, 1, 14, 2.5);
    E(gr(-9, 0, '#7aa0c8', '#2c4a70'), 0, -4, 14, 4.5, '#1a2c44');                                    // hull
    P(gr(-12, -6, '#8ab0d8', '#3a5a80'), [-4, -7, 4, -7, 3, -12, -3, -12], '#1a2c44');                 // conning tower
    ctx.fillStyle = '#ffe080'; ctx.fillRect(-1.5, -10.5, 3, 1.5); ctx.fillStyle = '#9ab'; ctx.fillRect(1.5, -16, 0.8, 4);   // periscope
    for (const x of [-8, -3, 2, 7]) E('#cfe6ff', x, -4, 1, 1);                                          // portholes
    P('#2c4a70', [12, -4, 16, -8, 16, 0]);
  } else if (v === 'skimmer') {
    E('rgba(0,0,0,.25)', 0, 1, 12, 2.5);
    P(gr(-10, -2, '#e07850', '#8a3a20'), [-11, -3, -8, -9, 8, -9, 11, -3, 8, -1, -8, -1], '#4a1a0c');   // body
    P('#a8d8f0', [-4, -9, 4, -9, 3, -12, -3, -12], '#3a5a70');                                          // canopy
    ctx.fillStyle = '#ffd060'; ctx.fillRect(-10, -6, 2, 1.5); ctx.fillRect(8, -6, 2, 1.5);
    ctx.fillStyle = 'rgba(255,200,120,.55)'; ctx.fillRect(-7, -1, 14, 1.5);                             // hover glow
  }
  else if (v === 'talon' || v === 'gtalon') {
    // a big running bird: plump body, tail plumes, crest, beak, striding legs
    const l = Math.sin(t / 3) * 2.5, dark = v === 'gtalon' ? '#b08810' : '#b07a18', light = v === 'gtalon' ? '#fff0a0' : '#ffe08a';
    E('rgba(0,0,0,.25)', 0, 1, 9, 2);
    ctx.strokeStyle = '#d07018'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-2, -6); ctx.lineTo(-2 + l, 0); ctx.moveTo(2, -6); ctx.lineTo(2 - l, 0); ctx.stroke();
    P(dark, [-7, -11, -13, -16, -12, -10, -14, -8, -7, -8]);                                          // tail plumes
    E(gr(-15, -5, light, col), 0, -10, 8, 5.5, dark);                                                  // body
    P(col, [3, -13, 7, -21, 10, -20, 7, -12], dark);                                                   // neck
    E(gr(-25, -18, light, col), 8.5, -21.5, 3.6, 3.2, dark);                                           // head
    P('#f08020', [11.5, -22.5, 15.5, -21, 11.5, -20]);                                                 // beak
    ctx.fillStyle = '#201008'; ctx.fillRect(9, -22.5, 1.2, 1.2);
    P(dark, [6, -24, 4, -28, 8, -25, 9, -29, 9.5, -24.5]);                                             // crest
    P(dark, [-3, -12, 3, -12, 0, -7]);                                                                 // wing
  }
  ctx.restore();
};
