/* ================= Maps: tile layers, collision, warps, people, chests ================= */
AE.C = { OPEN: 0, SOLID: 1, WATER: 2, COUNTER: 3, HURT: 4, LEDGE: 5, STAIR: 6, LOW: 7, SHALLOW: 8, HIDDEN: 9 };
AE.Map = function (id) {
  const d = AE.MAPS[id]; if (!d) throw new Error('no map ' + id);
  this.d = d; this.id = id; this.w = d.w; this.h = d.h; this.name = d.name;
  this.col = d.col.slice();
  this.layers = d.layers;
  this.anim = 0;
  // story changes to the map (doors that open, bridges that appear): d.variants [{when: flag, tiles: [[layer, i, ref]], col: [[i, c]]}]
  this.applyVariants();
};
AE.Map.prototype.applyVariants = function () {
  const S = AE.S_; if (!this.d.variants || !S) return;
  const self = this; this.layers = JSON.parse(JSON.stringify(this.d.layers)); this.col = this.d.col.slice();
  this.d.variants.forEach(function (v) {
    if (!S.flags[v.when]) return;
    (v.tiles || []).forEach(function (t) { self.layers[t[0]][t[1]] = t[2]; });
    (v.col || []).forEach(function (c) { self.col[c[0]] = c[1]; });
  });
};
AE.Map.prototype.c = function (x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? AE.C.SOLID : this.col[y * this.w + x]; };
AE.Map.prototype.warpAt = function (x, y) {
  const w = this.d.warps; for (let i = 0; i < w.length; i++) if (w[i].x === x && w[i].y === y && (!w[i].flag || AE.S_.flags[w[i].flag])) return w[i];
  return null;
};
AE.Map.prototype.chestAt = function (x, y) { return this.d.chests[x + ',' + y] || null; };
AE.Map.prototype.signAt = function (x, y) { return this.d.signs[x + ',' + y] || null; };
AE.Map.prototype.eventsAt = function (x, y) {
  return (this.d.events || []).filter(function (e) { return x >= e.x && x < e.x + e.w && y >= e.y && y < e.y + e.h; });
};
AE.Map.prototype.encAt = function (x, y) {
  const z = this.d.zones || []; for (let i = 0; i < z.length; i++) { const q = z[i]; if (x >= q[0] && x < q[0] + q[2] && y >= q[1] && y < q[1] + q[3]) return q[4]; }
  return this.d.enc;
};
// draw one layer over the camera rectangle
AE.Map.prototype.drawLayer = function (ctx, name, cx, cy) {
  const L = this.layers[name]; if (!L) return;
  const x0 = Math.max(0, Math.floor(cx / 16)), y0 = Math.max(0, Math.floor(cy / 16));
  const x1 = Math.min(this.w - 1, Math.floor((cx + AE.W) / 16)), y1 = Math.min(this.h - 1, Math.floor((cy + AE.H) / 16));
  const sh = AE.SHEETS, img = AE.IMG, wf = Math.floor(AE.game.frame / 20) % 4;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const r = L[y * this.w + x]; if (r < 0) continue;
      const s = r >> 16; let tx = r & 255, ty = (r >> 8) & 255; const im = img[sh[s]]; if (!im) continue;
      // animated water: the pack's water fill shimmers through its ripple frames
      ctx.drawImage(im, tx * 16, ty * 16, 16, 16, x * 16 - cx, y * 16 - cy, 16, 16);
      if (sh[s] === 'water' && ty === 7 && tx === 1 && AE.IMG.ripple && (x * 3 + y * 5) % 7 === 0) ctx.drawImage(AE.IMG.ripple, ((wf + x) % 4) * 16, 0, 16, 16, x * 16 - cx, y * 16 - cy, 16, 16);
    }
  }
};
