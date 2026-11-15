/* ================= Legend of Aethra: core =================
   One canvas, 256 x 224 logical pixels drawn at 2x. A stack of scenes (field, menus, battle...) updated at a fixed
   60 steps a second. Scripts (cutscenes, events) are async functions that await promises the game loop resolves. */
const AE = {};
AE.W = 256; AE.H = 224; AE.S = 2; AE.T = 16;
AE.IMG = {};
AE.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
AE.rand = function (n) { return Math.floor(Math.random() * n); };
AE.pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
AE.chance = function (p) { return Math.random() < p; };
AE.DIRS = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];   // up, right, down, left
AE.fmt = function (n) { return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
AE.time = function (s) { s = Math.floor(s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return h + ':' + (m < 10 ? '0' : '') + m; };

/* ---------- input ----------
   up/down/left/right, ok (Z, Enter, Space, F), back (X, Escape, Backspace), menu (C, Tab), run (Shift, hold),
   prev/next (Q, E: switch character, rotate the world view), plus the touch pad (src/90-touch.js). */
AE.KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'ok', Enter: 'ok', NumpadEnter: 'ok', Space: 'ok', KeyF: 'ok', KeyX: 'back', Escape: 'back', Backspace: 'back',
  KeyC: 'menu', Tab: 'menu', ShiftLeft: 'run', ShiftRight: 'run', KeyQ: 'prev', KeyE: 'next', KeyM: 'map' };
AE.Input = function () { this.held = {}; this.down = {}; this.pressed = {}; this.rep = {}; this.t = {}; };
AE.Input.prototype.key = function (code, isDown) {
  const k = AE.KEYMAP[code]; if (!k) return false;
  if (isDown && !this.held[k]) this.down[k] = true;
  this.held[k] = isDown; if (!isDown) this.t[k] = 0;
  return true;
};
AE.Input.prototype.press = function (k, isDown) { if (isDown && !this.held[k]) this.down[k] = true; this.held[k] = isDown; if (!isDown) this.t[k] = 0; };
// once per step: 'pressed' = went down since last step; 'rep' = pressed, or held long enough to auto-repeat (menus)
AE.Input.prototype.step = function () {
  this.pressed = this.down; this.down = {}; this.rep = {};
  for (const k in this.held) {
    if (!this.held[k]) continue;
    this.t[k] = (this.t[k] || 0) + 1;
    if (this.pressed[k] || (this.t[k] > 18 && this.t[k] % 4 === 0)) this.rep[k] = true;
  }
  for (const k in this.pressed) this.rep[k] = true;
};
AE.Input.prototype.clear = function () { this.held = {}; this.down = {}; this.pressed = {}; this.rep = {}; this.t = {}; };
AE.Input.prototype.dir = function () { return this.held.up ? 0 : this.held.down ? 2 : this.held.left ? 3 : this.held.right ? 1 : -1; };

/* ---------- waiting: scripts await these ---------- */
AE.waits = [];
AE.wait = function (frames) { return new Promise(function (r) { AE.waits.push({ n: Math.max(1, Math.round(frames)), r: r }); }); };
AE.until = function (fn) { return new Promise(function (r) { AE.waits.push({ fn: fn, r: r }); }); };
AE.tickWaits = function () {
  const w = AE.waits; AE.waits = [];
  w.forEach(function (q) {
    if (q.fn ? q.fn() : --q.n <= 0) q.r(); else AE.waits.push(q);
  });
};

/* ---------- the game ---------- */
AE.Game = function (canvas) {
  this.canvas = canvas; this.ctx = canvas.getContext('2d');
  canvas.width = AE.W * AE.S; canvas.height = AE.H * AE.S;
  this.ctx.setTransform(AE.S, 0, 0, AE.S, 0, 0); this.ctx.imageSmoothingEnabled = false;
  this.input = new AE.Input(); this.scenes = []; this.frame = 0; this.fade = 0; this.fadeTo = 0; this.fadeCol = '#000';
  this.running = false; this.acc = 0; this.last = 0; this.flash = 0;
  AE.game = this;
};
AE.Game.prototype.push = function (s) { this.scenes.push(s); if (s.enter) s.enter(this); return s; };
AE.Game.prototype.pop = function (s) {
  const i = s ? this.scenes.lastIndexOf(s) : this.scenes.length - 1; if (i < 0) return;
  const out = this.scenes.splice(i, 1)[0]; if (out.exit) out.exit(this); return out;
};
AE.Game.prototype.top = function () { return this.scenes[this.scenes.length - 1]; };
AE.Game.prototype.find = function (kind) { for (let i = this.scenes.length - 1; i >= 0; i--) if (this.scenes[i].kind === kind) return this.scenes[i]; return null; };
AE.Game.prototype.step = function () {
  this.input.step(); this.frame++;
  if (AE.S_ && AE.S_.playing) AE.S_.time += 1 / 60;
  const top = this.top(); if (top && top.update) top.update(this);
  for (let i = 0; i < this.scenes.length - 1; i++) if (this.scenes[i].always) this.scenes[i].always(this);
  AE.tickWaits();
  if (this.fade !== this.fadeTo) { const d = this.fadeSpeed || 0.08; this.fade = this.fade < this.fadeTo ? Math.min(this.fadeTo, this.fade + d) : Math.max(this.fadeTo, this.fade - d); }
  if (this.flash > 0) this.flash--;
  if (AE.Music) AE.Music.tick();
};
AE.Game.prototype.draw = function () {
  if (this.frame % 30 === 0 && AE.fitCanvas) AE.fitCanvas(this);
  const c = this.ctx; c.setTransform(AE.S, 0, 0, AE.S, 0, 0); c.imageSmoothingEnabled = false;
  c.fillStyle = '#000'; c.fillRect(0, 0, AE.W, AE.H);
  // draw from the last opaque scene up
  let from = 0; for (let i = this.scenes.length - 1; i >= 0; i--) if (this.scenes[i].opaque) { from = i; break; }
  for (let i = from; i < this.scenes.length; i++) { const s = this.scenes[i]; if (s.draw) { c.save(); s.draw(c, this); c.restore(); } }
  if (this.fade > 0) { c.globalAlpha = this.fade; c.fillStyle = this.fadeCol; c.fillRect(0, 0, AE.W, AE.H); c.globalAlpha = 1; }
  if (this.flash > 0) { c.globalAlpha = Math.min(1, this.flash / 6); c.fillStyle = '#fff'; c.fillRect(0, 0, AE.W, AE.H); c.globalAlpha = 1; }
};
AE.Game.prototype.start = function () {
  if (this.running) return; this.running = true; const self = this;
  const loop = function (t) {
    if (!self.running) return;
    if (!self.last) self.last = t;
    self.acc += Math.min(100, t - self.last); self.last = t;
    let n = 0; while (self.acc >= 1000 / 60 && n < 4) { self.step(); self.acc -= 1000 / 60; n++; }
    if (n === 4) self.acc = 0;
    self.draw(); self.raf = requestAnimationFrame(loop);
  };
  this.raf = requestAnimationFrame(loop);
};
AE.Game.prototype.stop = function () { this.running = false; if (this.raf) cancelAnimationFrame(this.raf); this.last = 0; };
// fades: await game.fadeOut(); ... await game.fadeIn();
AE.Game.prototype.fadeOut = function (speed, col) { this.fadeCol = col || '#000'; this.fadeSpeed = speed || 0.08; this.fadeTo = 1; const g = this; return AE.until(function () { return g.fade >= 1; }); };
AE.Game.prototype.fadeIn = function (speed) { this.fadeSpeed = speed || 0.08; this.fadeTo = 0; const g = this; return AE.until(function () { return g.fade <= 0; }); };
