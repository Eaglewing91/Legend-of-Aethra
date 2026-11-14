// ==UserScript==
// @name         Legend of Aethra
// @namespace    eaglewing.legend-of-aethra
// @version      1.0.0
// @description  A 16-bit style role-playing game with active-time battles, for Torn. Plays inside the Torn Arcade phone (Legends folder) or in its own window from the Tampermonkey menu. Makes no requests, uses no API key and stores your saves only on your device.
// @author       Eaglewing [571041]
// @copyright    2026, Eaglewing [571041]. All rights reserved.
// @license      All Rights Reserved - for use on Torn (torn.com) only; no copying, modifying, redistribution or use elsewhere (see LICENCE)
// @homepageURL  https://github.com/Eaglewing91/Legend-of-Aethra
// @updateURL    https://github.com/Eaglewing91/Legend-of-Aethra/raw/main/build/Legend-of-Aethra.user.js
// @downloadURL  https://github.com/Eaglewing91/Legend-of-Aethra/raw/main/build/Legend-of-Aethra.user.js
// @match        https://www.torn.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// @noframes
// ==/UserScript==
/*
 * LEGEND OF AETHRA by Eaglewing [571041]
 * Licence: all rights reserved, for use on Torn only (full text: LICENCE in the GitHub repo). Third-party art and sound:
 * "Ninja Adventure" by Pixel-boy and AAA (CC0). Characters and townspeople: "Mana Seed" by Seliel the Shaper, used under
 * licence with permission (not CC0; don't extract or reuse it). Unofficial fan project, not affiliated with Torn.
 *
 * HOW IT WORKS
 * - The game's code, maps and story are inside this script; its pictures and sounds are in the Art & Effects script. Pages where you don't play only add a Tampermonkey menu entry and listen for
 *   Torn Arcade: nothing is unpacked, drawn or run until you press Play.
 * - It never reads, clicks or changes Torn's page, makes no network requests of any kind, uses no API key and no
 *   websockets. Keys are only read while the game window is open.
 * - Save files (three slots and a resume point) are kept in Tampermonkey storage on your device.
 * - Torn Arcade link (page events only): 'aethra:ping' / 'aethra:here' (installed? version), 'aethra:open' (play inside
 *   the phone), 'aethra:close', 'aethra:closed', 'aethra:mute', 'aethra:volume'. The Art & Effects script (needed) answers
 *   'aethra-art:request' with 'aethra-art'; the five optional Soundtrack scripts answer
 *   'aethra-music:request' with 'aethra-music'.
 *
 * TERMS OF SERVICE
 * | Data Storage          | Only locally (your save files, in Tampermonkey storage) |
 * | Data Sharing          | Nobody                                                  |
 * | Purpose of Use        | Public amusement                                        |
 * | Key Storage & Sharing | Not stored / Not shared (no API key is used)            |
 * | Key Access Level      | None (no API key needed)                                |
 */
(function () {
'use strict';
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

/* ================= Text: the hand-drawn pixel font (5 x 7, lower case with descenders) ================= */
AE.GLYPHS = {
  ' ': [], '!': ['#', '#', '#', '#', '#', '', '#'], '"': ['# #', '# #'], '#': ['', ' # # ', '#####', ' # # ', '#####', ' # # '],
  '$': [' # ', ' ####', '# #  ', ' ### ', '  # #', '#### ', '  #  '], '%': ['##   #', '##  #', '   # ', '  #  ', ' #   ', '#  ##', '   ##'],
  '&': [' ##  ', '#  # ', '# #  ', ' #   ', '# # #', '#  # ', ' ## #'], "'": ['#', '#'], '(': [' #', '# ', '# ', '# ', '# ', '# ', ' #'], ')': ['# ', ' #', ' #', ' #', ' #', ' #', '# '],
  '*': ['', '# #', ' # ', '###', ' # ', '# #'], '+': ['', '', '  #  ', '  #  ', '#####', '  #  ', '  #  '], ',': ['', '', '', '', '', ' #', ' #', '# '], '-': ['', '', '', '####'], '.': ['', '', '', '', '', '', '#'],
  '/': ['    #', '    #', '   # ', '  #  ', ' #   ', '#    ', '#    '],
  '0': [' ### ', '#   #', '#  ##', '# # #', '##  #', '#   #', ' ### '], '1': [' # ', '## ', ' # ', ' # ', ' # ', ' # ', '###'], '2': [' ### ', '#   #', '    #', '   # ', '  #  ', ' #   ', '#####'],
  '3': ['#####', '   # ', '  #  ', '   # ', '    #', '#   #', ' ### '], '4': ['   # ', '  ## ', ' # # ', '#  # ', '#####', '   # ', '   # '], '5': ['#####', '#    ', '#### ', '    #', '    #', '#   #', ' ### '],
  '6': ['  ## ', ' #   ', '#    ', '#### ', '#   #', '#   #', ' ### '], '7': ['#####', '    #', '   # ', '  #  ', ' #   ', ' #   ', ' #   '], '8': [' ### ', '#   #', '#   #', ' ### ', '#   #', '#   #', ' ### '],
  '9': [' ### ', '#   #', '#   #', ' ####', '    #', '   # ', ' ##  '], ':': ['', '', '#', '', '', '#'], ';': ['', '', ' #', '', '', ' #', '# '], '<': ['   #', '  # ', ' #  ', '#   ', ' #  ', '  # ', '   #'],
  '=': ['', '', '####', '', '####'], '>': ['#   ', ' #  ', '  # ', '   #', '  # ', ' #  ', '#   '], '?': [' ### ', '#   #', '    #', '   # ', '  #  ', '', '  #  '], '@': [' ### ', '#   #', '# ###', '# # #', '# ###', '#    ', ' ####'],
  A: [' ### ', '#   #', '#   #', '#####', '#   #', '#   #', '#   #'], B: ['#### ', '#   #', '#   #', '#### ', '#   #', '#   #', '#### '], C: [' ### ', '#   #', '#    ', '#    ', '#    ', '#   #', ' ### '],
  D: ['#### ', '#   #', '#   #', '#   #', '#   #', '#   #', '#### '], E: ['#####', '#    ', '#    ', '#### ', '#    ', '#    ', '#####'], F: ['#####', '#    ', '#    ', '#### ', '#    ', '#    ', '#    '],
  G: [' ### ', '#   #', '#    ', '# ###', '#   #', '#   #', ' ####'], H: ['#   #', '#   #', '#   #', '#####', '#   #', '#   #', '#   #'], I: ['###', ' # ', ' # ', ' # ', ' # ', ' # ', '###'],
  J: ['  ###', '   # ', '   # ', '   # ', '   # ', '#  # ', ' ##  '], K: ['#   #', '#  # ', '# #  ', '##   ', '# #  ', '#  # ', '#   #'], L: ['#    ', '#    ', '#    ', '#    ', '#    ', '#    ', '#####'],
  M: ['#   #', '## ##', '# # #', '# # #', '#   #', '#   #', '#   #'], N: ['#   #', '#   #', '##  #', '# # #', '#  ##', '#   #', '#   #'], O: [' ### ', '#   #', '#   #', '#   #', '#   #', '#   #', ' ### '],
  P: ['#### ', '#   #', '#   #', '#### ', '#    ', '#    ', '#    '], Q: [' ### ', '#   #', '#   #', '#   #', '# # #', '#  # ', ' ## #'], R: ['#### ', '#   #', '#   #', '#### ', '# #  ', '#  # ', '#   #'],
  S: [' ####', '#    ', '#    ', ' ### ', '    #', '    #', '#### '], T: ['#####', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '  #  '], U: ['#   #', '#   #', '#   #', '#   #', '#   #', '#   #', ' ### '],
  V: ['#   #', '#   #', '#   #', '#   #', '#   #', ' # # ', '  #  '], W: ['#   #', '#   #', '#   #', '# # #', '# # #', '# # #', ' # # '], X: ['#   #', '#   #', ' # # ', '  #  ', ' # # ', '#   #', '#   #'],
  Y: ['#   #', '#   #', ' # # ', '  #  ', '  #  ', '  #  ', '  #  '], Z: ['#####', '    #', '   # ', '  #  ', ' #   ', '#    ', '#####'],
  '[': ['##', '# ', '# ', '# ', '# ', '# ', '##'], '\\': ['#    ', '#    ', ' #   ', '  #  ', '   # ', '    #', '    #'], ']': ['##', ' #', ' #', ' #', ' #', ' #', '##'], '^': [' # ', '# #'], '_': ['', '', '', '', '', '', '', '#####'], '`': ['# ', ' #'],
  a: ['', '', ' ### ', '    #', ' ####', '#   #', ' ####'], b: ['#    ', '#    ', '#### ', '#   #', '#   #', '#   #', '#### '], c: ['', '', ' ### ', '#    ', '#    ', '#    ', ' ### '],
  d: ['    #', '    #', ' ####', '#   #', '#   #', '#   #', ' ####'], e: ['', '', ' ### ', '#   #', '#####', '#    ', ' ### '], f: ['  ##', ' #  ', '####', ' #  ', ' #  ', ' #  ', ' #  '],
  g: ['', '', ' ####', '#   #', '#   #', ' ####', '    #', ' ### '], h: ['#    ', '#    ', '#### ', '#   #', '#   #', '#   #', '#   #'], i: ['#', '', '#', '#', '#', '#', '#'],
  j: ['  #', '', ' ##', '  #', '  #', '  #', '  #', '## '], k: ['#   ', '#   ', '#  #', '# # ', '##  ', '# # ', '#  #'], l: ['##', ' #', ' #', ' #', ' #', ' #', ' ##'],
  m: ['', '', '## # ', '# # #', '# # #', '# # #', '# # #'], n: ['', '', '#### ', '#   #', '#   #', '#   #', '#   #'], o: ['', '', ' ### ', '#   #', '#   #', '#   #', ' ### '],
  p: ['', '', '#### ', '#   #', '#   #', '#### ', '#    ', '#    '], q: ['', '', ' ####', '#   #', '#   #', ' ####', '    #', '    #'], r: ['', '', '# ## ', '##   ', '#    ', '#    ', '#    '],
  s: ['', '', ' ####', '#    ', ' ### ', '    #', '#### '], t: [' #  ', ' #  ', '####', ' #  ', ' #  ', ' #  ', '  ##'], u: ['', '', '#   #', '#   #', '#   #', '#   #', ' ####'],
  v: ['', '', '#   #', '#   #', '#   #', ' # # ', '  #  '], w: ['', '', '#   #', '#   #', '# # #', '# # #', ' # # '], x: ['', '', '#   #', ' # # ', '  #  ', ' # # ', '#   #'],
  y: ['', '', '#   #', '#   #', '#   #', ' ####', '    #', ' ### '], z: ['', '', '#####', '   # ', '  #  ', ' #   ', '#####'],
  '{': ['  #', ' # ', ' # ', '#  ', ' # ', ' # ', '  #'], '|': ['#', '#', '#', '#', '#', '#', '#'], '}': ['#  ', ' # ', ' # ', '  #', ' # ', ' # ', '#  '], '~': ['', '', ' #  #', '# ## ', '']
};
AE.GLYPHS['·'] = ['', '', '', '#'];   // the middle dot (index 95: drawn in place of DEL)

/* ================= Drawing: text, windows, sprites ================= */
// ---------- text ----------
AE.FONT = { atlas: null, w: {}, tint: {} };
AE.fontBuild = function () {
  const c = document.createElement('canvas'); c.width = 96 * 8; c.height = 9; const x = c.getContext('2d'); x.fillStyle = '#fff';
  Object.keys(AE.GLYPHS).forEach(function (ch) {
    const code = ch === '·' ? 127 : ch.charCodeAt(0); const i = code - 32; if (i < 0 || i >= 96) return;
    const rows = AE.GLYPHS[ch]; let w = 0;
    rows.forEach(function (r, y) { for (let k = 0; k < r.length; k++) if (r[k] === '#') { x.fillRect(i * 8 + k, y, 1, 1); w = Math.max(w, k + 1); } });
    AE.FONT.w[code] = ch === ' ' ? 3 : w;
  });
  AE.FONT.atlas = c;
};
AE.fontTint = function (col) {
  if (!AE.FONT.atlas) AE.fontBuild();
  if (AE.FONT.tint[col]) return AE.FONT.tint[col];
  const c = document.createElement('canvas'); c.width = AE.FONT.atlas.width; c.height = AE.FONT.atlas.height; const x = c.getContext('2d');
  x.drawImage(AE.FONT.atlas, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
  return (AE.FONT.tint[col] = c);
};
AE.code = function (ch) { return ch === '·' ? 127 : ch.charCodeAt(0); };
AE.textWidth = function (s) {
  if (!AE.FONT.atlas) AE.fontBuild();
  s = String(s); let w = 0;
  for (let i = 0; i < s.length; i++) { const c = AE.code(s[i]); w += (AE.FONT.w[c] !== undefined ? AE.FONT.w[c] : 4) + 1; }
  return Math.max(0, w - 1);
};
// text(ctx, s, x, y, col, opts{shadow, align:'right'|'center'})
AE.text = function (ctx, s, x, y, col, o) {
  s = String(s); o = o || {}; col = col || '#fff';
  if (o.align === 'right') x -= AE.textWidth(s); else if (o.align === 'center') x -= Math.floor(AE.textWidth(s) / 2);
  x = Math.round(x); y = Math.round(y);
  if (o.shadow !== false) AE.textRaw(ctx, s, x + 1, y + 1, o.shadowCol || 'rgba(0,0,0,.75)');
  return AE.textRaw(ctx, s, x, y, col);
};
AE.textRaw = function (ctx, s, x, y, col) {
  const a = AE.fontTint(col);
  for (let i = 0; i < s.length; i++) {
    const c = AE.code(s[i]), w = AE.FONT.w[c] !== undefined ? AE.FONT.w[c] : 4, k = c - 32;
    if (k >= 0 && k < 96 && w) ctx.drawImage(a, k * 8, 0, w, 9, x, y, w, 9);
    x += w + 1;
  }
  return x;
};
// word wrap to a pixel width; '\n' forces a break
AE.wrap = function (s, width) {
  const out = [];
  String(s).split('\n').forEach(function (para) {
    let line = '';
    para.split(' ').forEach(function (w) {
      const t = line ? line + ' ' + w : w;
      if (AE.textWidth(t) > width && line) { out.push(line); line = w; } else line = t;
    });
    out.push(line);
  });
  return out;
};

// ---------- windows: the classic blue gradient box (colour set in Config) ----------
AE.WIN = { top: [32, 56, 168], bottom: [8, 12, 64] };
AE.winGrad = {};
AE.window = function (ctx, x, y, w, h, o) {
  o = o || {}; x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  const T = (AE.S_ && AE.S_.cfg && AE.S_.cfg.win) || AE.WIN, key = T.top.join() + T.bottom.join() + h;
  let g = AE.winGrad[key];
  if (!g) { g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgb(' + T.top.join() + ')'); g.addColorStop(1, 'rgb(' + T.bottom.join() + ')'); AE.winGrad[key] = g; }
  ctx.save(); ctx.globalAlpha = o.alpha || 1;
  ctx.translate(x, y); ctx.fillStyle = g; ctx.fillRect(2, 2, w - 4, h - 4); ctx.translate(-x, -y);
  ctx.restore();
  ctx.fillStyle = '#e8e8f0'; ctx.fillRect(x + 2, y, w - 4, 1); ctx.fillRect(x + 2, y + h - 1, w - 4, 1); ctx.fillRect(x, y + 2, 1, h - 4); ctx.fillRect(x + w - 1, y + 2, 1, h - 4);
  ctx.fillRect(x + 1, y + 1, 1, 1); ctx.fillRect(x + w - 2, y + 1, 1, 1); ctx.fillRect(x + 1, y + h - 2, 1, 1); ctx.fillRect(x + w - 2, y + h - 2, 1, 1);
  ctx.fillStyle = '#7880a0'; ctx.fillRect(x + 2, y + 1, w - 4, 1); ctx.fillRect(x + 1, y + 2, 1, h - 4);
  ctx.fillStyle = '#383c58'; ctx.fillRect(x + 2, y + h - 2, w - 4, 1); ctx.fillRect(x + w - 2, y + 2, 1, h - 4);
};
// the pointing hand cursor
AE.cursor = function (ctx, x, y, blink) {
  if (blink && Math.floor(AE.game.frame / 8) % 2) return;
  x = Math.round(x); y = Math.round(y);
  const px = ['  ####   ', ' #....#  ', ' #.....##', '#.......#', '#.......#', ' #.....# ', '  #####  '];
  px.forEach(function (r, j) { for (let i = 0; i < r.length; i++) { if (r[i] === ' ') continue; ctx.fillStyle = r[i] === '#' ? '#202030' : (j < 2 ? '#ffffff' : '#d8d8e0'); ctx.fillRect(x + i, y + j, 1, 1); } });
};
AE.bar = function (ctx, x, y, w, h, frac, col, back) {
  ctx.fillStyle = back || '#101018'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col; ctx.fillRect(x, y, Math.round(w * AE.clamp(frac, 0, 1)), h);
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x, y, Math.round(w * AE.clamp(frac, 0, 1)), 1);
};

// ---------- the cast: Mana Seed atlases (art/private), drawn feet-first ----------
AE.actorOn = function (id) { return !!(AE.MS && AE.MS[id] && AE.IMG['ms_' + id]); };
// frame(ctx, id, anim, dir 0..3 (up, right, down, left) or null for 1-direction anims, f, X, Y, k scale, flip)
AE.ROW = [1, 2, 0, 3];      // our dir -> atlas row (down, up, right, left)
AE.actor = function (ctx, id, anim, dir, f, X, Y, k, o) {
  const M = AE.MS && AE.MS[id], A = M && M[anim], im = AE.IMG['ms_' + id]; if (!A || !im) return false;
  o = o || {}; k = k || 1;
  const row = A.dirs === 4 ? AE.ROW[dir] : 0, fr = ((f % A.n) + A.n) % A.n;
  const sx = fr * A.w, sy = A.y + row * A.h;
  ctx.save();
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  if (o.filter) ctx.filter = o.filter;
  if (o.flip) { ctx.translate(Math.round(X), 0); ctx.scale(-1, 1); ctx.drawImage(im, sx, sy, A.w, A.h, -A.fx * k, Math.round(Y - A.fy * k), A.w * k, A.h * k); }
  else ctx.drawImage(im, sx, sy, A.w, A.h, Math.round(X - A.fx * k), Math.round(Y - A.fy * k), A.w * k, A.h * k);
  ctx.restore();
  return true;
};
// townsfolk atlas (ms_people): 7 cells per row (stand, walk 1-6), 4 rows per person
AE.person = function (ctx, name, dir, f, X, Y, k) {
  const P = AE.MS && AE.MS.people, im = AE.IMG.ms_people; if (!P || !im) return false;
  const i = P.names.indexOf(name); if (i < 0) return false; k = k || 1;
  const cell = f < 0 ? 0 : 1 + (f % 6);
  ctx.drawImage(im, cell * P.cw, (i * 4 + AE.ROW[dir]) * P.ch, P.cw, P.ch, Math.round(X - P.fx * k), Math.round(Y - P.fy * k), P.cw * k, P.ch * k);
  return true;
};
// any image region scaled, optionally flipped and tinted by a CSS filter
AE.blit = function (ctx, im, sx, sy, sw, sh, dx, dy, dw, dh, o) {
  if (!im) return; o = o || {};
  ctx.save(); if (o.alpha !== undefined) ctx.globalAlpha = o.alpha; if (o.filter) ctx.filter = o.filter;
  if (o.flip) { ctx.translate(Math.round(dx + dw), Math.round(dy)); ctx.scale(-1, 1); ctx.drawImage(im, sx, sy, sw, sh, 0, 0, dw, dh); }
  else ctx.drawImage(im, sx, sy, sw, sh, Math.round(dx), Math.round(dy), dw, dh);
  ctx.restore();
};
// recolour an image by hue-rotating its pixels (cached): palette swaps for monster variants
AE.recol = {};
AE.hue = function (key, im, deg, sat, light) {
  const k = key + ':' + deg + ':' + (sat || 1) + ':' + (light || 1); if (AE.recol[k]) return AE.recol[k];
  const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d');
  x.filter = 'hue-rotate(' + deg + 'deg) saturate(' + (sat || 1) + ') brightness(' + (light || 1) + ')'; x.drawImage(im, 0, 0);
  return (AE.recol[k] = c);
};

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
    if (!AE.cond(v.when)) return;
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

/* ================= Messages, choices, small notices ================= */
// say('Text', {name: 'KAEL', pos: 'top'|'bottom'}) -> Promise. Text pages split by '|'. '{gold}', colours: [r]red[/] ...
AE.Message = function (text, o) {
  this.kind = 'msg'; this.o = o || {}; this.pages = String(text).split('|'); this.page = 0; this.t = 0; this.done = null;
  this.choices = this.o.choices || null; this.sel = this.o.def || 0;
  this.lines = null;
};
AE.Message.prototype.enter = function () { this.layout(); };
AE.Message.prototype.layout = function () {
  this.lines = AE.wrap(this.pages[this.page], AE.W - 32);
  this.len = this.lines.join('').length; this.t = this.o.instant ? 999 : 0;
};
AE.Message.prototype.update = function (g) {
  const I = g.input, spd = (AE.S_ && AE.S_.cfg && AE.S_.cfg.text) || 2;
  if (this.t < this.len) {
    this.t += spd;
    if ((I.pressed.ok || I.pressed.back) && this.t > 2) this.t = this.len;
    if (AE.Sfx && g.frame % 4 === 0) AE.Sfx.play('text');
    return;
  }
  const last = this.page === this.pages.length - 1;
  if (last && this.choices) {
    if (I.rep.up) { this.sel = (this.sel + this.choices.length - 1) % this.choices.length; AE.Sfx && AE.Sfx.play('move'); }
    if (I.rep.down) { this.sel = (this.sel + 1) % this.choices.length; AE.Sfx && AE.Sfx.play('move'); }
    if (I.pressed.ok) { AE.Sfx && AE.Sfx.play('ok'); g.pop(this); this.done(this.sel); }
    else if (I.pressed.back && this.o.cancel !== undefined) { AE.Sfx && AE.Sfx.play('back'); g.pop(this); this.done(this.o.cancel); }
    return;
  }
  if (I.pressed.ok || I.pressed.back || (this.o.auto && ++this.wait > this.o.auto)) {
    if (last) { g.pop(this); this.done(-1); } else { this.page++; this.layout(); }
  }
};
AE.Message.prototype.draw = function (ctx) {
  const n = Math.max(3, this.lines.length + (this.page === this.pages.length - 1 && this.choices ? this.choices.length : 0));
  const h = 12 + n * 12, top = this.o.pos === 'top' ? 6 : AE.H - h - 6;
  AE.window(ctx, 6, top, AE.W - 12, h);
  let left = this.t, y = top + 7;
  if (this.o.name) { AE.window(ctx, 10, top - 14, AE.textWidth(this.o.name) + 14, 16); AE.text(ctx, this.o.name, 17, top - 10, '#ffe080'); }
  for (let i = 0; i < this.lines.length; i++) {
    const s = this.lines[i].slice(0, Math.max(0, left)); left -= this.lines[i].length;
    AE.text(ctx, s, 14, y, '#fff'); y += 12;
  }
  if (this.t >= this.len && this.page === this.pages.length - 1 && this.choices) {
    for (let i = 0; i < this.choices.length; i++) {
      AE.text(ctx, this.choices[i], 34, y, '#fff');
      if (i === this.sel) AE.cursor(ctx, 18, y);
      y += 12;
    }
  } else if (this.t >= this.len && Math.floor(AE.game.frame / 16) % 2) {
    ctx.fillStyle = '#fff'; ctx.fillRect(AE.W - 20, top + h - 9, 5, 1); ctx.fillRect(AE.W - 19, top + h - 8, 3, 1); ctx.fillRect(AE.W - 18, top + h - 7, 1, 1);
  }
};
AE.say = function (text, o) {
  const m = new AE.Message(text, o || {});
  return new Promise(function (r) { m.done = r; m.wait = 0; AE.game.push(m); });
};
AE.ask = function (text, choices, o) {
  o = Object.assign({}, o || {}, { choices: choices });
  return AE.say(text, o);
};
// a short notice in the middle of the screen ("Received Potion x3")
AE.Notice = function (text, frames) { this.kind = 'notice'; this.text = text; this.n = frames || 90; this.done = null; };
AE.Notice.prototype.update = function (g) { if (--this.n <= 0 || (this.n < 80 && (g.input.pressed.ok || g.input.pressed.back))) { g.pop(this); this.done(); } };
AE.Notice.prototype.draw = function (ctx) {
  const w = AE.textWidth(this.text) + 24; AE.window(ctx, (AE.W - w) / 2, 40, w, 22); AE.text(ctx, this.text, AE.W / 2, 47, '#fff', { align: 'center' });
};
AE.notice = function (text, frames) { const n = new AE.Notice(text, frames); return new Promise(function (r) { n.done = r; AE.game.push(n); }); };
// generic vertical list selector used by many menus
AE.List = function (items, o) { this.items = items; this.sel = 0; this.top = 0; this.o = o || {}; this.rows = this.o.rows || 8; this.cols = this.o.cols || 1; };
AE.List.prototype.move = function (I) {
  const n = this.items.length; if (!n) return false; const c = this.cols; let s = this.sel;
  if (I.rep.up) s -= c; if (I.rep.down) s += c; if (c > 1 && I.rep.left) s -= 1; if (c > 1 && I.rep.right) s += 1;
  if (this.o.wrap !== false) { if (s < 0) s = c > 1 ? Math.max(0, s + Math.ceil(n / c) * c) : n - 1; if (s >= n) s = c > 1 ? s % c : 0; }
  s = AE.clamp(s, 0, n - 1);
  const moved = s !== this.sel; this.sel = s;
  const row = Math.floor(s / c); if (row < this.top) this.top = row; if (row >= this.top + this.rows) this.top = row - this.rows + 1;
  if (moved && AE.Sfx) AE.Sfx.play('move');
  return moved;
};

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
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(Math.round(X - 5), Math.round(Y - 1), 10, 3);
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
  if (ev.length) this.run(ev[0].id, ev[0]);
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
  if (m.d.dark) { ctx.fillStyle = 'rgba(0,0,20,' + (m.d.dark * 0.15) + ')'; ctx.fillRect(0, 0, AE.W, AE.H); }
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

/* ================= The save state, the party, stats and items =================
   AE.S_ holds everything a save file keeps. Characters: AE.CHARS[id] (data) + S.m[id] (their progress).
   Stats at a level come from each character's base and growth; gear and Prisms add to them. */
AE.newState = function () {
  return {
    v: 1, playing: false, time: 0, steps: 0, chapter: 1, gold: 300,
    party: ['kael'], reserve: [], m: {}, inv: {}, prisms: [], flags: {}, chests: {}, cards: {},
    map: 'start', x: 0, y: 0, dir: 2, world: null, vehicles: {}, talon: { owned: [] },
    cfg: { atb: 'wait', speed: 3, text: 2, win: null, autorun: false, music: 1, cursor: 'reset' },
    stats: { battles: 0, kills: 0, runs: 0, steals: 0, saves: 0 }, bestiary: {}, quests: {}
  };
};
// ---------- levels ----------
AE.expFor = function (lv) { return lv <= 1 ? 0 : Math.floor(4 * Math.pow(lv - 1, 2.75) + 18 * (lv - 1)); };   // total EXP to reach lv (Lv 99 ~ 1.4M)
AE.growStat = function (b, g, lv, k) { return Math.floor(b + g * (lv - 1) + (k || 0) * Math.pow(lv - 1, 2)); };
// make a member: id, level
AE.joinMember = function (id, lv) {
  const S = AE.S_, C = AE.CHARS[id];
  const m = S.m[id] || { id: id, lv: 1, exp: 0, hp: 1, mp: 0, equip: { weapon: C.start.weapon || null, armor: C.start.armor || null, acc: C.start.acc || null }, slots: { weapon: [], armor: [] }, surge: 0, surgeLv: 1, surgeUses: 0, row: C.row || 'front', status: [] };
  m.lv = Math.max(m.lv, lv || 1); m.exp = Math.max(m.exp, AE.expFor(m.lv));
  S.m[id] = m; AE.calc(id); m.hp = m.maxhp; m.mp = m.maxmp;
  return m;
};
AE.ITEMDB = function (id) { return AE.ITEMS[id] || AE.WEAPONS[id] || AE.ARMORS[id] || AE.ACCS[id] || null; };
// derived stats from level, gear and Prisms
AE.calc = function (id) {
  const S = AE.S_, m = S.m[id], C = AE.CHARS[id], lv = m.lv, b = C.base, g = C.grow;
  const st = {
    maxhp: AE.growStat(b.hp, g.hp, lv, g.hp2), maxmp: AE.growStat(b.mp, g.mp, lv, g.mp2),
    str: AE.growStat(b.str, g.str, lv), vit: AE.growStat(b.vit, g.vit, lv), mag: AE.growStat(b.mag, g.mag, lv),
    spr: AE.growStat(b.spr, g.spr, lv), spd: AE.growStat(b.spd, g.spd, lv), lck: AE.growStat(b.lck, g.lck, lv)
  };
  const w = AE.WEAPONS[m.equip.weapon] || { atk: 0, hit: 95 }, a = AE.ARMORS[m.equip.armor] || { def: 0, mdef: 0, eva: 0 }, ac = AE.ACCS[m.equip.acc] || {};
  st.atk = 0; st.def = 0; st.mdef = 0; st.hit = w.hit || 95; st.eva = (a.eva || 0); st.meva = (a.meva || 0);
  const add = function (o) { if (!o) return; for (const k in o) if (typeof o[k] === 'number' && k in st) st[k] += o[k]; };
  add(w.stats); add(a.stats); add(ac.stats);
  st.wpn = w.atk || 0; st.arm = a.def || 0; st.marm = a.mdef || 0;
  // Prisms: abilities and stat changes
  st.abil = { magic: [], command: [], echo: [], support: [], indep: {} };
  const self = this;
  ['weapon', 'armor'].forEach(function (slot) {
    (m.slots[slot] || []).forEach(function (pid, i, arr) {
      if (pid === null || pid === undefined) return;
      const P = S.prisms[pid]; if (!P) return; const D = AE.PRISMS[P.id]; if (!D) return;
      const lvl = AE.prismLevel(P);
      if (D.stats) add(D.stats);
      if (D.type === 'magic') st.abil.magic.push({ pid: pid, id: P.id, lv: lvl, slot: slot, i: i });
      if (D.type === 'command') st.abil.command.push({ pid: pid, id: P.id, lv: lvl });
      if (D.type === 'echo') st.abil.echo.push({ pid: pid, id: P.id, lv: lvl, slot: slot, i: i });
      if (D.type === 'support') st.abil.support.push({ pid: pid, id: P.id, lv: lvl, slot: slot, i: i });
      if (D.type === 'indep') st.abil.indep[D.effect] = (st.abil.indep[D.effect] || 0) + (D.per || 1) * lvl;
    });
  });
  // independent Prisms: HP+, MP+, Speed+...
  const ind = st.abil.indep;
  if (ind.hp) st.maxhp = Math.floor(st.maxhp * (1 + ind.hp / 100));
  if (ind.mp) st.maxmp = Math.floor(st.maxmp * (1 + ind.mp / 100));
  if (ind.spd) st.spd += ind.spd; if (ind.lck) st.lck += ind.lck; if (ind.mag) st.mag += ind.mag; if (ind.str) st.str += ind.str;
  if (ac.effect) st.acc = ac.effect;
  st.maxhp = AE.clamp(st.maxhp, 1, 9999); st.maxmp = AE.clamp(st.maxmp, 0, 999);
  ['str', 'vit', 'mag', 'spr', 'spd', 'lck'].forEach(function (k) { st[k] = AE.clamp(st[k], 1, 255); });
  st.atk += st.str + st.wpn; st.def += st.vit + st.arm; st.mdef += st.spr + st.marm;
  st.elemAtk = w.elem || null; st.armElem = a.elem || null; st.armHalf = a.half || null; st.statusGuard = (a.guard || []).concat(ac.guard || []);
  m.st = st; m.maxhp = st.maxhp; m.maxmp = st.maxmp;
  m.hp = Math.min(m.hp, m.maxhp); m.mp = Math.min(m.mp, m.maxmp);
  return st;
};
AE.calcAll = function () { const S = AE.S_; Object.keys(S.m).forEach(AE.calc); };
// ---------- Prisms ----------
AE.prismLevel = function (P) { const D = AE.PRISMS[P.id], t = D.ap || [0]; let l = 0; for (let i = 0; i < t.length; i++) if (P.ap >= t[i]) l = i + 1; return l; };
AE.prismMaster = function (P) { const D = AE.PRISMS[P.id], t = D.ap || [0]; return P.ap >= t[t.length - 1]; };
AE.addPrism = function (id, ap) { AE.S_.prisms.push({ id: id, ap: ap || 0 }); return AE.S_.prisms.length - 1; };
// ---------- inventory ----------
AE.has = function (id) { return AE.S_.inv[id] || 0; };
AE.addItem = function (id, n) { const S = AE.S_; S.inv[id] = AE.clamp((S.inv[id] || 0) + (n === undefined ? 1 : n), 0, 99); if (!S.inv[id]) delete S.inv[id]; };
AE.itemName = function (id) {
  if (id === 'gold') return 'Gold';
  if (id.indexOf('prism:') === 0) return (AE.PRISMS[id.slice(6)] || {}).name + ' Prism';
  const d = AE.ITEMDB(id); return d ? d.name : id;
};
// gain(id, n): items, gold, Prisms ('prism:fire'), key items; shows the notice
AE.gain = function (id, n) {
  n = n || 1;
  if (id === 'gold') { AE.S_.gold = Math.min(9999999, AE.S_.gold + n); return AE.notice('Found ' + AE.fmt(n) + ' G'); }
  if (id.indexOf('prism:') === 0) { for (let i = 0; i < n; i++) AE.addPrism(id.slice(6)); return AE.notice('Received ' + AE.itemName(id) + (n > 1 ? ' x' + n : '')); }
  if (id.indexOf('card:') === 0) { AE.S_.cards[id.slice(5)] = (AE.S_.cards[id.slice(5)] || 0) + n; return AE.notice('Got the Arcana card ' + ((AE.CARDS || {})[id.slice(5)] || {}).name); }
  AE.addItem(id, n);
  return AE.notice('Received ' + AE.itemName(id) + (n > 1 ? ' x' + n : ''));
};
AE.member = function (id) { return AE.S_.m[id]; };
AE.partyMembers = function () { return AE.S_.party.map(function (id) { return AE.S_.m[id]; }).filter(Boolean); };
AE.healAll = function () { AE.partyMembers().concat(AE.S_.reserve.map(function (id) { return AE.S_.m[id]; })).forEach(function (m) { if (!m) return; AE.calc(m.id); m.hp = m.maxhp; m.mp = m.maxmp; m.status = []; }); };
AE.setFlag = function (f, v) { AE.S_.flags[f] = v === undefined ? 1 : v; };

/* ================= Sound and music =================
   Sound effects are small clips built into the game; music comes from the optional Soundtrack scripts (or the dev
   page). Logical track names (town, battle...) map to the tracks; jingles play once and return to the field music. */
AE.Audio = { ctx: null, master: null, vol: 0.8, muted: false, buf: {} };
AE.ac = function () {
  const A = AE.Audio;
  if (!A.ctx) {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    A.ctx = new C(); A.master = A.ctx.createGain(); A.master.gain.value = A.muted ? 0 : A.vol; A.master.connect(A.ctx.destination);
  }
  if (A.ctx.state === 'suspended') A.ctx.resume();
  return A.ctx;
};
AE.setVolume = function (v) { const A = AE.Audio; A.vol = AE.clamp(v, 0, 1); if (A.master) A.master.gain.value = A.muted ? 0 : A.vol; };
AE.setMuted = function (m) { const A = AE.Audio; A.muted = !!m; if (A.master) A.master.gain.value = A.muted ? 0 : A.vol; };
AE.b64buf = function (b64) { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; };
AE.decode = function (key, b64) {
  const A = AE.Audio, c = AE.ac(); if (!c || !b64) return Promise.resolve(null);
  if (A.buf[key]) return A.buf[key];
  A.buf[key] = new Promise(function (res) { try { c.decodeAudioData(AE.b64buf(b64), res, function () { res(null); }); } catch (e) { res(null); } });
  return A.buf[key];
};
AE.Sfx = {
  last: {},
  play: function (name) {
    const c = AE.ac(); if (!c || AE.Audio.muted) return;
    const now = c.currentTime; if (this.last[name] && now - this.last[name] < 0.04) return; this.last[name] = now;
    if (name === 'text') return this.blip(880, 0.02, 0.03);
    if (name === 'move' && !(AE.SFX || {}).move) return this.blip(660, 0.03, 0.06);
    const b64 = (AE.SFX || {})[name] || (AE.SFX || {})[(AE.SFXALIAS || {})[name]];
    if (!b64) return;
    AE.decode('sfx:' + name, b64).then(function (buf) {
      if (!buf) return; const s = c.createBufferSource(), g = c.createGain(); g.gain.value = 0.55; s.buffer = buf; s.connect(g); g.connect(AE.Audio.master); s.start();
    });
  },
  blip: function (hz, len, vol) {
    const c = AE.ac(); const o = c.createOscillator(), g = c.createGain(); o.type = 'square'; o.frequency.value = hz;
    g.gain.setValueAtTime(vol, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + len);
    o.connect(g); g.connect(AE.Audio.master); o.start(); o.stop(c.currentTime + len + 0.01);
  }
};
// logical names -> soundtrack keys
AE.TRACKS = {
  title: 'intro', story: 'story', town: 'village', village: 'calm_village', city: 'manor', slums: 'lost_village', world: 'adventure', road: 'road',
  battle: 'fight', boss: 'fight2', dungeon: 'dungeon', cave: 'cave', reactor: 'tension', factory: 'tension', sad: 'sad', temple: 'temple',
  mystic: 'mystical', forest: 'dark_forest', clearing: 'clearing', boat: 'boat', sea: 'boat', water: 'aquatic', desert: 'sunny', final: 'final_area',
  castle: 'dark_castle', ruins: 'ruins', crypt: 'crypt', curse: 'curse', dream: 'dream', airship: 'ascension', spire: 'good_time', revelation: 'revelation',
  lament: 'lament', ending: 'end_theme', credits: 'credit', melancholy: 'melancholia', chill: 'chill', peaceful: 'peaceful', quiet: 'quiet', snow: 'quiet',
  victory: '#victory', gameover: '#gameover', levelup: '#levelup'
};
AE.Music = {
  cur: null, src: null, gain: null, want: null, jingle: false,
  play: function (name) {
    if (!name) return;
    if (name === this.cur && !this.jingle) return;
    const key = AE.TRACKS[name] || name, self = this;
    this.cur = name; this.want = key;
    const c = AE.ac(); if (!c) return;
    const isJ = key[0] === '#', data = isJ ? (AE.SFX || {})[key.slice(1)] : (AE.MUSIC || {})[key];
    this.stop(0.25);
    if (!data) return;
    this.jingle = isJ;
    AE.decode('mus:' + key, data).then(function (buf) {
      if (!buf || self.want !== key) return;
      const s = c.createBufferSource(), g = c.createGain(); s.buffer = buf; s.loop = !isJ;
      const v = (AE.S_ && AE.S_.cfg ? AE.S_.cfg.music : 1) * 0.6;
      g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(Math.max(0.001, v), c.currentTime + 0.4);
      s.connect(g); g.connect(AE.Audio.master); s.start(); self.src = s; self.gain = g;
    });
  },
  stop: function (fade) {
    const c = AE.Audio.ctx; if (!c || !this.src) return;
    const s = this.src, g = this.gain; this.src = null;
    try { g.gain.setValueAtTime(g.gain.value, c.currentTime); g.gain.linearRampToValueAtTime(0, c.currentTime + (fade || 0.01)); s.stop(c.currentTime + (fade || 0.01) + 0.02); } catch (e) {}
  },
  tick: function () {}
};

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

/* ================= Cutscene helpers =================
   Story events are async functions: await AE.say(...), await walk('lyra', 'RRUU'), await battle(...). People in a
   scene are field actors (map npcs by id, the leader as 'hero', or actors added with spawn()). */
AE.cs = {
  f: function () { return AE.field(); },
  // find an actor: 'hero', an npc id from the map, or a spawned actor
  a: function (id) { const f = AE.field(); if (!f) return null; if (id === 'hero') return f.player; return f.npcs.find(function (n) { return n.id === id; }) || null; },
  spawn: function (id, who, x, y, dir, o) { const f = AE.field(); const a = new AE.Actor(Object.assign({ x: x, y: y, dir: dir === undefined ? 2 : dir, who: who, cast: !!(AE.MS && AE.MS[who] && AE.MS[who].idle), def: { still: 1 }, id: id, home: [x, y], wait: 9e9 }, o || {})); f.npcs.push(a); return a; },
  remove: function (id) { const f = AE.field(); f.npcs = f.npcs.filter(function (n) { return n.id !== id; }); },
  hide: function (id, v) { const a = AE.cs.a(id); if (a) a.hidden = v === undefined ? true : v; },
  face: function (id, d) { const a = AE.cs.a(id); if (a) a.dir = typeof d === 'number' ? d : 'URDL'.indexOf(d); },
  // walk a path of letters U R D L (repeat counts allowed: 'R3U2'); speed 1 walk, 2 run; ignores collisions
  walk: async function (id, path, speed) {
    const a = AE.cs.a(id); if (!a) return;
    const steps = []; path.replace(/([URDL])(\d*)/g, function (_, d, n) { for (let i = 0; i < (+n || 1); i++) steps.push('URDL'.indexOf(d)); });
    for (const d of steps) {
      a.dir = d; const D = AE.DIRS[d]; a.x += D.x; a.y += D.y; a.moving = true; a.speed = speed || 1;
      await AE.until(function () { return !a.moving; });
    }
    if (id === 'hero') { AE.S_.x = a.x; AE.S_.y = a.y; }
  },
  // walk several at once
  together: function (list) { return Promise.all(list.map(function (l) { return AE.cs.walk(l[0], l[1], l[2]); })); },
  emote: async function (id, e, frames) { const a = AE.cs.a(id); if (!a) return; a.emote = e; await AE.wait(frames || 50); a.emote = null; },
  jump: async function (id) { const a = AE.cs.a(id); if (!a) return; for (let i = 0; i < 12; i++) { a.hop = -Math.sin(i / 11 * Math.PI) * 6; await AE.wait(1); } a.hop = 0; },
  pose: function (id, anim) { const a = AE.cs.a(id); if (a) { a.pose = anim; a.anim = 0; } },
  shake: async function (n) { const f = AE.field(); if (f) f.shake = n || 30; AE.Sfx.play('quake'); await AE.wait(n || 30); },
  flash: async function () { AE.game.flash = 12; await AE.wait(12); },
  // camera: lock on a tile, or follow the hero again
  pan: async function (x, y, frames) {
    const f = AE.field(); const sx = f.cam.x, sy = f.cam.y, tx = AE.clamp(x * 16 + 8 - AE.W / 2, 0, f.map.w * 16 - AE.W), ty = AE.clamp(y * 16 + 8 - AE.H / 2, 0, f.map.h * 16 - AE.H);
    f.camLock = true; frames = frames || 40;
    for (let i = 1; i <= frames; i++) { const k = i / frames, e = k * k * (3 - 2 * k); f.cam.x = sx + (tx - sx) * e; f.cam.y = sy + (ty - sy) * e; await AE.wait(1); }
  },
  follow: function () { const f = AE.field(); if (f) f.camLock = false; },
  warp: async function (map, x, y, dir) { await AE.game.fadeOut(0.08); const f = AE.field(); f.load(map, x, y, dir); f.title = 100; await AE.game.fadeIn(0.08); },
  title: async function (text, sub, frames) {
    const s = { kind: 'title-card', t: 0, update: function () { this.t++; }, draw: function (ctx) {
      const a = Math.min(1, this.t / 30, (frames - this.t) / 30); ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 86, AE.W, 50); AE.text(ctx, text, AE.W / 2, 96, '#ffe8a0', { align: 'center' }); if (sub) AE.text(ctx, sub, AE.W / 2, 114, '#c0c8e0', { align: 'center' }); ctx.globalAlpha = 1; } };
    frames = frames || 180; AE.game.push(s); await AE.wait(frames); AE.game.pop(s);
  },
  // full-screen text on black (narration, chapter cards)
  narrate: async function (lines) {
    const s = { kind: 'narrate', opaque: true, i: 0, t: 0, update: function (g) { this.t++; if (this.t > 30 && (g.input.pressed.ok || this.t > 60 + lines[this.i].length * 3)) { this.i++; this.t = 0; } }, draw: function (ctx) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, AE.W, AE.H); const L = lines[Math.min(this.i, lines.length - 1)] || ''; const a = Math.min(1, this.t / 20); ctx.globalAlpha = a;
      AE.wrap(L, 210).forEach(function (l, k, arr) { AE.text(ctx, l, AE.W / 2, AE.H / 2 - arr.length * 6 + k * 12, '#e0e4f0', { align: 'center' }); }); ctx.globalAlpha = 1; } };
    AE.game.push(s); await AE.until(function () { return s.i >= lines.length; }); AE.game.pop(s);
  },
  battle: function (enemies, o) { o = o || {}; return AE.startBattle(Object.assign({ enemies: enemies }, o), o); },
  join: async function (id, lv, quiet) {
    const S = AE.S_; const m = AE.joinMember(id, lv || Math.max(1, Math.round(AE.partyMembers().reduce(function (a, m) { return a + m.lv; }, 0) / Math.max(1, AE.partyMembers().length))));
    if (S.party.indexOf(id) < 0 && S.reserve.indexOf(id) < 0) { if (S.party.length < 3) S.party.push(id); else S.reserve.push(id); }
    if (!quiet) { AE.Sfx.play('save'); await AE.notice(AE.CHARS[id].name + ' joined the party!'); }
    return m;
  },
  leave: function (id) { const S = AE.S_; S.party = S.party.filter(function (p) { return p !== id; }); S.reserve = S.reserve.filter(function (p) { return p !== id; }); },
  music: function (n) { AE.S_.musicOverride = n || null; if (AE.Music) AE.Music.play(n || (AE.field() ? AE.field().map.d.music : 'world')); },
  flag: function (f, v) { AE.setFlag(f, v); const fl = AE.field(); if (fl) fl.map.applyVariants(); },
  chapter: function (n) { AE.S_.chapter = Math.max(AE.S_.chapter, n); },
  // a line from a named speaker: s('lyra', 'Hello!') -> say with the name box
  s: function (who, text, o) { const C = AE.CHARS[who]; return AE.say(text, Object.assign({ name: (C ? C.name : who).toUpperCase() }, o || {})); }
};
// field camera: respect a locked camera during cutscenes
(function () {
  const cf = AE.Field.prototype.camFollow;
  AE.Field.prototype.camFollow = function () { if (this.camLock) return; return cf.call(this); };
})();

/* ================= Story tools: timers, party changes, quests ================= */
// A countdown shown on the field (the reactor escape). When it runs out, AE.EV[ev] runs (usually a game over).
AE.Timer = {
  start: function (seconds, ev, label) { AE.S_.timer = { f: Math.round(seconds * 60), ev: ev, label: label || 'TIME' }; },
  stop: function () { AE.S_.timer = null; },
  left: function () { return AE.S_.timer ? Math.ceil(AE.S_.timer.f / 60) : 0; }
};
(function () {
  const up = AE.Field.prototype.update;
  AE.Field.prototype.update = function (g) {
    const T = AE.S_ && AE.S_.timer;
    if (T && T.f > 0 && !this.paused) {
      T.f--;
      if (T.f <= 0) { const ev = T.ev; AE.S_.timer = null; this.locked = 0; this.run(ev); }
    }
    return up.call(this, g);
  };
  const dr = AE.Field.prototype.draw;
  AE.Field.prototype.draw = function (ctx) {
    dr.call(this, ctx);
    const T = AE.S_ && AE.S_.timer; if (!T) return;
    const s = Math.ceil(T.f / 60), txt = Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
    AE.window(ctx, AE.W - 62, 6, 56, 22);
    AE.text(ctx, txt, AE.W - 34, 12, s <= 30 && (AE.game.frame >> 4) % 2 ? '#ff6060' : '#fff', { align: 'center' });
  };
  // the timer keeps running during battles (and battles cost time)
  if (AE.Battle) {
    const tk = AE.Battle.prototype.tick;
    if (tk) AE.Battle.prototype.tick = function () { const T = AE.S_.timer; if (T && T.f > 60) T.f--; return tk.apply(this, arguments); };
  }
})();

// put a new Prism straight into a member's first free slot (gifts that should be ready to use)
AE.slotPrism = function (mid, pid) {
  const S = AE.S_, m = S.m[mid]; if (!m) return AE.addPrism(pid);
  const k = AE.addPrism(pid);
  for (const slot of ['weapon', 'armor']) {
    const G = slot === 'weapon' ? AE.WEAPONS[m.equip.weapon] : AE.ARMORS[m.equip.armor]; const n = G ? G.slots || 0 : 0;
    m.slots[slot] = m.slots[slot] || [];
    for (let i = 0; i < n; i++) if (m.slots[slot][i] === null || m.slots[slot][i] === undefined) { m.slots[slot][i] = k; AE.calc(mid); return k; }
  }
  return k;
};
// set the battle party (others go to the reserve); members not yet joined are joined at the party's level
AE.setParty = function (ids, lv) {
  const S = AE.S_;
  const avg = Math.max(1, Math.round(AE.partyMembers().reduce(function (a, m) { return a + m.lv; }, 0) / Math.max(1, AE.partyMembers().length)));
  ids.forEach(function (id) { if (!S.m[id]) AE.joinMember(id, lv || avg); });
  const all = S.party.concat(S.reserve).concat(ids).filter(function (v, i, a) { return a.indexOf(v) === i; });
  S.party = ids.slice(0, 3); S.reserve = all.filter(function (id) { return S.party.indexOf(id) < 0 && S.m[id] && !(S.away || {})[id]; });
  if (AE.field()) AE.field().player.who = S.party[0];
};
// members away on the story's business (not in the party or the reserve until they come back)
AE.away = function (id, v) { const S = AE.S_; S.away = S.away || {}; if (v === false) { delete S.away[id]; if (S.m[id] && S.party.indexOf(id) < 0 && S.reserve.indexOf(id) < 0) S.reserve.push(id); } else { S.away[id] = 1; S.party = S.party.filter(function (p) { return p !== id; }); S.reserve = S.reserve.filter(function (p) { return p !== id; }); } };

// quests: S.quests[id] = 0 (offered) .. 'done'. AE.QUESTS holds the names for the menu.
AE.QUESTS = {};
AE.quest = function (id, v) { const S = AE.S_; if (v === undefined) return S.quests[id]; S.quests[id] = v; return v; };

// a little helper for "give one item, take a key item" exchanges
AE.take = function (id, n) { AE.addItem(id, -(n || 1)); };
AE.pay = function (g) { if (AE.S_.gold < g) return false; AE.S_.gold -= g; return true; };

// game over by story (the reactor goes up with you in it)
AE.EV.timeout_reactor = async function () {
  await AE.cs.shake(60); AE.game.flash = 30; await AE.wait(30);
  await AE.cs.narrate(['Reactor 4 tore itself apart.', 'Nobody below the plate ever learned who had been inside.']);
  AE.Timer.stop(); AE.gameOver();
};

/* ================= The cast ================= */
// base = Lv 1, grow = per level (hp2/mp2: a little extra per level squared). surge: 4 Surge Arts per character.
AE.CHARS = {
  kael: { name: 'Kael', full: 'Kael Ardent', title: 'Courier-mercenary', weap: 'blade', row: 'front',
    base: { hp: 280, mp: 28, str: 20, vit: 16, mag: 12, spr: 12, spd: 20, lck: 14 },
    grow: { hp: 62, hp2: 0.32, mp: 5.6, mp2: 0.03, str: 1.68, vit: 1.35, mag: 1.15, spr: 1.12, spd: 1.2, lck: 0.8 },
    start: { weapon: 'courier_blade', armor: 'bronze_band' },
    surge: ['gale_rush', 'skysplitter', 'tempest_arc', 'aether_edge'] },
  lyra: { name: 'Lyra', full: 'Lyra Vale', title: 'Reactor technician', weap: 'staff', row: 'back',
    base: { hp: 210, mp: 46, str: 11, vit: 11, mag: 20, spr: 22, spd: 17, lck: 18 },
    grow: { hp: 50, hp2: 0.26, mp: 7.6, mp2: 0.04, str: 0.95, vit: 1.0, mag: 1.62, spr: 1.7, spd: 1.08, lck: 1.0 },
    start: { weapon: 'oak_staff', armor: 'bronze_band' },
    surge: ['mending_light', 'ward_bloom', 'sanctuary', 'rebirth'] },
  bram: { name: 'Bram', full: 'Bram Hollis', title: 'Rebel captain', weap: 'lance', row: 'front',
    base: { hp: 340, mp: 18, str: 23, vit: 21, mag: 9, spr: 11, spd: 13, lck: 11 },
    grow: { hp: 72, hp2: 0.36, mp: 4.2, mp2: 0.02, str: 1.8, vit: 1.6, mag: 0.85, spr: 1.0, spd: 0.95, lck: 0.7 },
    start: { weapon: 'service_lance', armor: 'iron_mail' },
    surge: ['breach_shot', 'overload', 'siege_line', 'last_stand'] },
  sable: { name: 'Sable', full: 'Sable', title: 'Undercity thief', weap: 'dagger', row: 'front',
    base: { hp: 240, mp: 30, str: 17, vit: 13, mag: 13, spr: 13, spd: 26, lck: 24 },
    grow: { hp: 55, hp2: 0.28, mp: 5.4, mp2: 0.03, str: 1.48, vit: 1.12, mag: 1.15, spr: 1.12, spd: 1.55, lck: 1.4 },
    start: { weapon: 'kris', armor: 'leather_vest' },
    surge: ['pickpocket_flurry', 'shadowstep', 'thousand_cuts', 'vanish'] },
  orin: { name: 'Orin', full: 'Orin Thale', title: 'Crystal scholar', weap: 'rod', row: 'back',
    base: { hp: 200, mp: 56, str: 10, vit: 10, mag: 26, spr: 20, spd: 14, lck: 14 },
    grow: { hp: 46, hp2: 0.24, mp: 8.2, mp2: 0.045, str: 0.85, vit: 0.95, mag: 1.85, spr: 1.5, spd: 1.0, lck: 0.9 },
    start: { weapon: 'scholar_rod', armor: 'silk_robe' },
    surge: ['arcane_surge', 'starfall', 'gravity_well', 'genesis'] },
  ember: { name: 'Ember', full: 'Ember', title: 'Summoner of Lumen', weap: 'bell', row: 'back',
    base: { hp: 190, mp: 52, str: 10, vit: 10, mag: 22, spr: 24, spd: 18, lck: 20 },
    grow: { hp: 47, hp2: 0.25, mp: 7.8, mp2: 0.042, str: 0.8, vit: 0.95, mag: 1.7, spr: 1.68, spd: 1.12, lck: 1.1 },
    start: { weapon: 'brass_bell', armor: 'silk_robe' },
    surge: ['echo_call', 'twin_echo', 'echo_chorus', 'grand_echo'] },
  rook: { name: 'Rook', full: 'Rook', title: 'Ancient automaton', weap: 'fist', row: 'front',
    base: { hp: 360, mp: 20, str: 24, vit: 24, mag: 8, spr: 14, spd: 12, lck: 8 },
    grow: { hp: 76, hp2: 0.38, mp: 4.0, mp2: 0.02, str: 1.82, vit: 1.72, mag: 0.8, spr: 1.15, spd: 0.92, lck: 0.6 },
    start: { weapon: 'iron_knuckle', armor: 'iron_mail' },
    surge: ['piston_barrage', 'core_burst', 'overclock', 'self_repair'] },
  vesna: { name: 'Vesna', full: 'Vesna Korr', title: 'Mercenary sharpshooter', weap: 'gun', row: 'back',
    base: { hp: 250, mp: 30, str: 21, vit: 14, mag: 14, spr: 14, spd: 22, lck: 20 },
    grow: { hp: 58, hp2: 0.29, mp: 5.6, mp2: 0.03, str: 1.66, vit: 1.2, mag: 1.15, spr: 1.18, spd: 1.38, lck: 1.25 },
    start: { weapon: 'scout_rifle', armor: 'leather_vest' },
    surge: ['deadeye', 'spread_shot', 'rain_of_lead', 'final_mark'] },
};
// Surge Arts: lv (1-4), power, target, element, effect
AE.SURGES = {
  gale_rush: { name: 'Gale Rush', lv: 1, kind: 'phys', target: 'enemy', power: 3, hits: 1, anim: 'slash' },
  skysplitter: { name: 'Skysplitter', lv: 2, kind: 'phys', target: 'enemies', power: 2.2, elem: 'wind', anim: 'slash' },
  tempest_arc: { name: 'Tempest Arc', lv: 3, kind: 'phys', target: 'enemy', power: 1.4, hits: 6, anim: 'slash' },
  aether_edge: { name: 'Aether Edge', lv: 4, kind: 'phys', target: 'enemies', power: 2.2, hits: 5, pierce: 1, anim: 'slash' },
  mending_light: { name: 'Mending Light', lv: 1, kind: 'heal', target: 'allies', power: 0.6 },
  ward_bloom: { name: 'Ward Bloom', lv: 2, kind: 'buff', target: 'allies', status: ['protect', 'shell'] },
  sanctuary: { name: 'Sanctuary', lv: 3, kind: 'heal', target: 'allies', power: 1, cure: 1 },
  rebirth: { name: 'Rebirth', lv: 4, kind: 'heal', target: 'allies', power: 1, revive: 1, status: ['regen'] },
  breach_shot: { name: 'Breach Shot', lv: 1, kind: 'phys', target: 'enemy', power: 3.4, pierce: 1, anim: 'thrust' },
  overload: { name: 'Overload', lv: 2, kind: 'phys', target: 'enemies', power: 2.3, elem: 'bolt', anim: 'thrust' },
  siege_line: { name: 'Siege Line', lv: 3, kind: 'phys', target: 'enemies', power: 3.2, anim: 'thrust' },
  last_stand: { name: 'Last Stand', lv: 4, kind: 'phys', target: 'enemies', power: 4.4, missing: 1, anim: 'thrust' },
  pickpocket_flurry: { name: 'Pickpocket Flurry', lv: 1, kind: 'phys', target: 'enemy', power: 1.2, hits: 3, steal: 1, anim: 'slash' },
  shadowstep: { name: 'Shadowstep', lv: 2, kind: 'phys', target: 'enemy', power: 3.2, crit: 1, anim: 'thrust' },
  thousand_cuts: { name: 'Thousand Cuts', lv: 3, kind: 'phys', target: 'random', power: 1.1, hits: 10, anim: 'slash' },
  vanish: { name: 'Vanish', lv: 4, kind: 'phys', target: 'enemies', power: 3.4, status: ['vanish'], anim: 'slash' },
  arcane_surge: { name: 'Arcane Surge', lv: 1, kind: 'mag', target: 'enemy', power: 3.4, anim: 'cast' },
  starfall: { name: 'Starfall', lv: 2, kind: 'mag', target: 'random', power: 1.0, hits: 8, anim: 'cast' },
  gravity_well: { name: 'Gravity Well', lv: 3, kind: 'gravity', target: 'enemies', power: 0.5, anim: 'cast' },
  genesis: { name: 'Genesis', lv: 4, kind: 'mag', target: 'enemies', power: 4.6, anim: 'cast' },
  echo_call: { name: 'Echo Call', lv: 1, kind: 'mag', target: 'enemies', power: 2.2, elem: 'holy', anim: 'cast' },
  twin_echo: { name: 'Twin Echo', lv: 2, kind: 'mag', target: 'enemies', power: 1.6, hits: 2, anim: 'cast' },
  echo_chorus: { name: 'Echo Chorus', lv: 3, kind: 'heal', target: 'allies', power: 0.8, status: ['haste'] },
  grand_echo: { name: 'Grand Echo', lv: 4, kind: 'mag', target: 'enemies', power: 5.2, anim: 'cast' },
  piston_barrage: { name: 'Piston Barrage', lv: 1, kind: 'phys', target: 'enemy', power: 1.1, hits: 4, anim: 'slash' },
  core_burst: { name: 'Core Burst', lv: 2, kind: 'phys', target: 'enemies', power: 2.4, elem: 'fire', anim: 'slash' },
  overclock: { name: 'Overclock', lv: 3, kind: 'buff', target: 'self', status: ['haste', 'berserk', 'protect'] },
  self_repair: { name: 'Self-Repair', lv: 4, kind: 'heal', target: 'self', power: 1, full: 1, cure: 1 },
  deadeye: { name: 'Deadeye', lv: 1, kind: 'phys', target: 'enemy', power: 3.2, crit: 1, anim: 'shoot' },
  spread_shot: { name: 'Spread Shot', lv: 2, kind: 'phys', target: 'enemies', power: 2.0, anim: 'shoot' },
  rain_of_lead: { name: 'Rain of Lead', lv: 3, kind: 'phys', target: 'random', power: 0.9, hits: 12, anim: 'shoot' },
  final_mark: { name: 'Final Mark', lv: 4, kind: 'phys', target: 'enemy', power: 9, pierce: 1, crit: 1, anim: 'shoot' },
};

/* ================= Items, weapons, armour, accessories ================= */
// use: what it does in and out of battle. target: ally | allies | enemy | enemies | any
AE.ITEMS = {
  potion: { name: 'Potion', price: 50, use: { heal: 100 }, target: 'ally', desc: 'Restores 100 HP.' },
  hi_potion: { name: 'Hi-Potion', price: 300, use: { heal: 500 }, target: 'ally', desc: 'Restores 500 HP.' },
  x_potion: { name: 'X-Potion', price: 3000, use: { heal: 9999 }, target: 'ally', desc: 'Restores all HP.' },
  ether: { name: 'Ether', price: 1500, use: { mp: 100 }, target: 'ally', desc: 'Restores 100 MP.' },
  turbo_ether: { name: 'Turbo Ether', price: 4000, use: { mp: 999 }, target: 'ally', desc: 'Restores all MP.' },
  elixir: { name: 'Elixir', price: 0, use: { heal: 9999, mp: 999 }, target: 'ally', desc: 'Restores all HP and MP.' },
  megalixir: { name: 'Megalixir', price: 0, use: { heal: 9999, mp: 999 }, target: 'allies', desc: 'Restores all HP and MP to the party.' },
  phoenix_down: { name: 'Phoenix Plume', price: 300, use: { revive: 0.25 }, target: 'ally', ko: true, desc: 'Revives a fallen ally.' },
  antidote: { name: 'Antidote', price: 40, use: { cure: ['poison'] }, target: 'ally', desc: 'Cures Poison.' },
  eye_drops: { name: 'Eye Drops', price: 50, use: { cure: ['blind'] }, target: 'ally', desc: 'Cures Blind.' },
  echo_screen: { name: 'Echo Herb', price: 100, use: { cure: ['silence'] }, target: 'ally', desc: 'Cures Silence.' },
  soft: { name: 'Softener', price: 150, use: { cure: ['stone', 'petrify'] }, target: 'ally', desc: 'Cures Stone.' },
  remedy: { name: 'Remedy', price: 1000, use: { cure: ['poison', 'blind', 'silence', 'stone', 'confuse', 'sleep', 'paralyse', 'frog', 'berserk', 'slow', 'stop', 'doom'] }, target: 'ally', desc: 'Cures all bad status.' },
  tent: { name: 'Tent', price: 500, field: 'tent', desc: 'Rest at a save point: restores the party.' },
  cottage: { name: 'Cottage', price: 1500, field: 'tent', desc: 'Rest anywhere on the world map.' },
  smoke_bomb: { name: 'Smoke Bomb', price: 200, battle: 'escape', target: 'none', desc: 'Escape from battle.' },
  grenade: { name: 'Grenade', price: 150, use: { damage: 180, elem: 'fire' }, target: 'enemies', desc: 'Damages all enemies.' },
  frost_vial: { name: 'Frost Vial', price: 0, use: { damage: 320, elem: 'ice' }, target: 'enemy', desc: 'Ice damage to one enemy.' },
  spark_cell: { name: 'Spark Cell', price: 0, use: { damage: 320, elem: 'bolt' }, target: 'enemy', desc: 'Bolt damage to one enemy.' },
  hero_tonic: { name: 'Hero Tonic', price: 0, use: { status: ['berserk', 'haste'] }, target: 'ally', desc: 'Haste and Berserk.' },
  speed_draught: { name: 'Speed Draught', price: 0, use: { status: ['haste'] }, target: 'ally', desc: 'Haste.' },
  power_source: { name: 'Power Source', price: 0, use: { boost: 'str' }, target: 'ally', desc: 'Raises Strength by 1 for good.' },
  guard_source: { name: 'Guard Source', price: 0, use: { boost: 'vit' }, target: 'ally', desc: 'Raises Vitality by 1 for good.' },
  mind_source: { name: 'Mind Source', price: 0, use: { boost: 'mag' }, target: 'ally', desc: 'Raises Magic by 1 for good.' },
  spirit_source: { name: 'Spirit Source', price: 0, use: { boost: 'spr' }, target: 'ally', desc: 'Raises Spirit by 1 for good.' },
  speed_source: { name: 'Speed Source', price: 0, use: { boost: 'spd' }, target: 'ally', desc: 'Raises Speed by 1 for good.' },
  luck_source: { name: 'Luck Source', price: 0, use: { boost: 'lck' }, target: 'ally', desc: 'Raises Luck by 1 for good.' },
  // talonbird feed (breeding/racing)
  greens: { name: 'Gysahl-free Greens', price: 80, field: 'feed', desc: 'Talonbird feed. Calms a wild bird.' },
  sweetroot: { name: 'Sweetroot', price: 600, field: 'feed', desc: 'Talonbird feed: better racing stats.' },
  // key items (k: true)
  reactor_pass: { name: 'Reactor Pass', k: true, desc: 'Undercurrent\'s forged pass into Reactor 4.' },
  vesper_file: { name: 'Vesper\'s File', k: true, desc: 'Notes on Project Cradle: draining the Crystals.' },
  rail_ticket: { name: 'Rail Ticket', k: true, desc: 'One way out of Halcyon.' },
  wind_shard: { name: 'Wind Shard', k: true, desc: 'All that is left of the Wind Crystal.' },
  water_shard: { name: 'Water Shard', k: true, desc: 'All that is left of the Water Crystal.' },
  fire_shard: { name: 'Fire Shard', k: true, desc: 'All that is left of the Fire Crystal.' },
  earth_shard: { name: 'Earth Shard', k: true, desc: 'All that is left of the Earth Crystal.' },
  ranch_pass: { name: 'Ranch Pass', k: true, desc: 'Lets you hire Talonbirds at Kestrel Ranch.' },
  spire_pass: { name: 'Gilded Spire Pass', k: true, desc: 'Free entry to the Gilded Spire for life.' },
  skimmer_key: { name: 'Skimmer Key', k: true, desc: 'The key to a desert Skimmer.' },
  ship_charter: { name: 'Ship Charter', k: true, desc: 'Passage on the Saltmere ferry.' },
  diving_suit: { name: 'Pressure Suit', k: true, desc: 'Lets the submersible dive deep.' },
  engine_core: { name: 'Aether Engine Core', k: true, desc: 'The heart of an airship.' },
  lumen_bell: { name: 'Lumen Bell', k: true, desc: 'Rings to open the hidden way to Lumen.' },
  frost_lantern: { name: 'Frost Lantern', k: true, desc: 'Lights the way through the Frostgate Mines.' },
  citadel_key: { name: 'Citadel Key', k: true, desc: 'Opens the gates of the Sky Citadel.' },
  surge_manual_kael: { name: 'Windborne Manual', k: true, desc: 'Teaches Kael his last Surge Art.' },
  surge_manual_lyra: { name: 'Bloom Codex', k: true, desc: 'Teaches Lyra her last Surge Art.' },
  surge_manual_bram: { name: 'Siege Manual', k: true, desc: 'Teaches Bram his last Surge Art.' },
  surge_manual_sable: { name: 'Shadow Ledger', k: true, desc: 'Teaches Sable her last Surge Art.' },
  surge_manual_orin: { name: 'Genesis Folio', k: true, desc: 'Teaches Orin his last Surge Art.' },
  surge_manual_ember: { name: 'Choir Score', k: true, desc: 'Teaches Ember her last Surge Art.' },
  surge_manual_rook: { name: 'Core Schematic', k: true, desc: 'Teaches Rook his last Surge Art.' },
  surge_manual_vesna: { name: 'Marksman\'s Log', k: true, desc: 'Teaches Vesna her last Surge Art.' },
  card_deck: { name: 'Arcana Deck', k: true, desc: 'Your deck of Arcana cards. Challenge players everywhere.' },
  spire_token: { name: 'Spire Tokens', k: true, desc: 'Gilded Spire currency.' },
};
// weapons: type must match the character's weapon kind. slots: number of Prism slots; links: linked pairs
AE.WEAPONS = {};
AE.ARMORS = {};
AE.ACCS = {};
(function () {
  const W = function (id, name, type, atk, hit, slots, links, price, extra) { AE.WEAPONS[id] = Object.assign({ name: name, type: type, atk: atk, hit: hit, slots: slots, links: links, price: price }, extra || {}); };
  // blades (Kael)
  W('courier_blade', 'Courier Blade', 'blade', 18, 96, 2, 1, 0);
  W('steel_saber', 'Steel Saber', 'blade', 26, 97, 2, 1, 600);
  W('wind_cutter', 'Wind Cutter', 'blade', 34, 98, 3, 1, 1500, { elem: 'wind' });
  W('dawn_edge', 'Dawn Edge', 'blade', 46, 98, 4, 2, 3400);
  W('storm_brand', 'Storm Brand', 'blade', 58, 99, 4, 2, 6800, { elem: 'bolt' });
  W('crystal_saber', 'Crystal Saber', 'blade', 74, 100, 6, 3, 12000);
  W('zephyr_fang', 'Zephyr Fang', 'blade', 88, 100, 6, 3, 0, { stats: { spd: 10 } });
  W('sky_render', 'Sky Render', 'blade', 120, 110, 8, 4, 0, { ult: 1, stats: { str: 20, spd: 20 } });
  // staves (Lyra)
  W('oak_staff', 'Oak Staff', 'staff', 10, 96, 2, 1, 0, { stats: { mag: 3 } });
  W('copper_staff', 'Copper Staff', 'staff', 15, 97, 3, 1, 700, { stats: { mag: 5 } });
  W('mending_rod', 'Mending Staff', 'staff', 22, 98, 4, 2, 2200, { stats: { mag: 9, spr: 5 } });
  W('lumen_staff', 'Lumen Staff', 'staff', 30, 98, 4, 2, 5200, { stats: { mag: 14, spr: 9 } });
  W('aurora_staff', 'Aurora Staff', 'staff', 40, 99, 6, 3, 10500, { stats: { mag: 20, spr: 14 } });
  W('seraph_staff', 'Seraph Staff', 'staff', 62, 110, 8, 4, 0, { ult: 1, stats: { mag: 40, spr: 40 } });
  // lances (Bram)
  W('service_lance', 'Service Lance', 'lance', 22, 92, 2, 1, 0);
  W('rifle_lance', 'Rifle Lance', 'lance', 30, 94, 2, 1, 750);
  W('breach_lance', 'Breach Lance', 'lance', 40, 95, 3, 1, 1800);
  W('volt_lance', 'Volt Lance', 'lance', 52, 96, 4, 2, 4000, { elem: 'bolt' });
  W('siege_lance', 'Siege Lance', 'lance', 66, 97, 4, 2, 7800);
  W('dragoon_pike', 'Wyvern Pike', 'lance', 82, 98, 6, 3, 13500);
  W('bastion', 'Bastion', 'lance', 128, 105, 8, 4, 0, { ult: 1, stats: { str: 25, vit: 25 } });
  // daggers (Sable)
  W('kris', 'Kris', 'dagger', 15, 99, 2, 1, 0);
  W('stiletto', 'Stiletto', 'dagger', 22, 100, 2, 1, 550, { stats: { spd: 2 } });
  W('mythril_knife', 'Silversteel Knife', 'dagger', 30, 102, 3, 1, 1600, { stats: { spd: 4 } });
  W('viper_fang', 'Viper Fang', 'dagger', 40, 103, 4, 2, 3600, { addStatus: 'poison' });
  W('nightshade', 'Nightshade', 'dagger', 54, 104, 4, 2, 7200, { stats: { lck: 10 } });
  W('mist_dirk', 'Mist Dirk', 'dagger', 70, 106, 6, 3, 12800, { stats: { spd: 12 } });
  W('vanishing_edge', 'Vanishing Edge', 'dagger', 112, 120, 8, 4, 0, { ult: 1, stats: { spd: 30, lck: 30 } });
  // rods (Orin)
  W('scholar_rod', 'Scholar\'s Rod', 'rod', 10, 95, 3, 1, 0, { stats: { mag: 5 } });
  W('ember_rod', 'Flame Rod', 'rod', 16, 96, 3, 1, 1400, { elem: 'fire', stats: { mag: 8 } });
  W('frost_rod', 'Frost Rod', 'rod', 20, 97, 4, 2, 2600, { elem: 'ice', stats: { mag: 11 } });
  W('thunder_rod', 'Thunder Rod', 'rod', 26, 97, 4, 2, 4800, { elem: 'bolt', stats: { mag: 15 } });
  W('sage_rod', 'Sage\'s Rod', 'rod', 34, 98, 6, 3, 9800, { stats: { mag: 24 } });
  W('genesis_rod', 'Genesis Rod', 'rod', 58, 105, 8, 4, 0, { ult: 1, stats: { mag: 50 } });
  // bells (Ember)
  W('brass_bell', 'Brass Bell', 'bell', 12, 96, 3, 1, 0, { stats: { spr: 4 } });
  W('silver_bell', 'Silver Bell', 'bell', 20, 97, 4, 2, 3200, { stats: { mag: 8, spr: 8 } });
  W('choir_bell', 'Choir Bell', 'bell', 30, 98, 5, 2, 7400, { stats: { mag: 14, spr: 14 } });
  W('echo_bell', 'Echo Bell', 'bell', 40, 99, 6, 3, 11800, { stats: { mag: 20, spr: 18 } });
  W('aethrael_bell', 'Bell of Aethrael', 'bell', 60, 110, 8, 4, 0, { ult: 1, stats: { mag: 40, spr: 40 } });
  // fists (Rook)
  W('iron_knuckle', 'Iron Knuckle', 'fist', 30, 96, 2, 1, 0);
  W('piston_fist', 'Piston Fist', 'fist', 44, 97, 3, 1, 3000);
  W('dynamo', 'Dynamo', 'fist', 60, 98, 4, 2, 6400, { elem: 'bolt' });
  W('titan_grip', 'Titan Grip', 'fist', 78, 99, 6, 3, 12200);
  W('omega_core', 'Omega Core', 'fist', 124, 105, 8, 4, 0, { ult: 1, stats: { str: 30, vit: 30 } });
  // guns (Vesna) - hit from the back row at full strength
  W('scout_rifle', 'Scout Rifle', 'gun', 38, 100, 3, 1, 0, { long: 1 });
  W('long_rifle', 'Long Rifle', 'gun', 52, 102, 4, 2, 5200, { long: 1 });
  W('hunter_rifle', 'Hunter\'s Rifle', 'gun', 66, 104, 4, 2, 8200, { long: 1, stats: { lck: 8 } });
  W('aether_rifle', 'Aether Rifle', 'gun', 80, 106, 6, 3, 12600, { long: 1 });
  W('final_word', 'Final Word', 'gun', 126, 120, 8, 4, 0, { ult: 1, long: 1, stats: { spd: 25, lck: 25 } });
  // armour: everyone
  const A = function (id, name, def, mdef, eva, slots, links, price, extra) { AE.ARMORS[id] = Object.assign({ name: name, def: def, mdef: mdef, eva: eva, slots: slots, links: links, price: price }, extra || {}); };
  A('bronze_band', 'Bronze Band', 8, 4, 0, 1, 0, 100);
  A('leather_vest', 'Leather Vest', 10, 5, 2, 1, 0, 150);
  A('silk_robe', 'Silk Robe', 6, 10, 2, 2, 0, 200);
  A('iron_mail', 'Iron Mail', 14, 4, 0, 1, 0, 300);
  A('iron_bangle', 'Iron Bangle', 16, 8, 0, 2, 1, 500);
  A('titan_band', 'Titan Band', 24, 12, 2, 2, 1, 1200);
  A('mythril_vest', 'Silversteel Vest', 32, 18, 4, 3, 1, 2600);
  A('carbon_band', 'Carbon Band', 40, 24, 4, 4, 2, 4400);
  A('mage_coat', 'Sage\'s Coat', 30, 40, 6, 4, 2, 5000);
  A('crystal_band', 'Crystal Band', 56, 36, 6, 4, 2, 8200);
  A('dragon_mail', 'Wyrmscale Mail', 70, 44, 6, 6, 3, 13000, { half: ['fire', 'ice', 'bolt'] });
  A('aegis_band', 'Aegis Band', 86, 62, 10, 6, 3, 0);
  A('aether_armlet', 'Aether Armlet', 110, 110, 15, 8, 4, 0);
  // accessories
  const C = function (id, name, price, extra) { AE.ACCS[id] = Object.assign({ name: name, price: price }, extra); };
  C('power_wrist', 'Power Wrist', 1200, { stats: { str: 10 } });
  C('guard_ring', 'Guard Ring', 1200, { stats: { vit: 10 } });
  C('mind_pendant', 'Mind Pendant', 1500, { stats: { mag: 10 } });
  C('spirit_charm', 'Spirit Charm', 1500, { stats: { spr: 10 } });
  C('swift_boots', 'Swift Boots', 2000, { stats: { spd: 10 } });
  C('lucky_coin', 'Lucky Coin', 0, { stats: { lck: 25 } });
  C('star_pendant', 'Star Pendant', 1800, { guard: ['poison'] });
  C('silver_glasses', 'Silver Glasses', 1800, { guard: ['blind'] });
  C('headband', 'Headband', 2200, { guard: ['sleep'] });
  C('safety_bit', 'Safety Bit', 0, { guard: ['stone', 'doom', 'stop'] });
  C('ribbon', 'Ribbon', 0, { guard: ['poison', 'blind', 'silence', 'stone', 'confuse', 'sleep', 'paralyse', 'frog', 'berserk', 'slow', 'stop', 'doom'] });
  C('sprint_shoes', 'Sprint Shoes', 0, { effect: 'haste' });
  C('barrier_ring', 'Barrier Ring', 0, { effect: 'protect', also: 'shell' });
  C('regen_charm', 'Regen Charm', 0, { effect: 'regen' });
  C('champion_belt', 'Champion Belt', 0, { stats: { str: 30, vit: 30 } });
  C('sages_circlet', 'Sage\'s Circlet', 0, { stats: { mag: 30, spr: 30 } });
  C('cat_bell', 'Cat\'s Bell', 0, { effect: 'walkheal' });
  C('fury_ring', 'Fury Ring', 0, { effect: 'berserk', stats: { str: 20 } });
})();

/* ================= Spells, Prisms and Echoes ================= */
// kind: mag (damage from Magic), heal, status (inflict), buff, cure, revive, gravity (fraction of HP), drain
AE.SPELLS = {
  fire: { name: 'Fire', mp: 4, kind: 'mag', power: 8, elem: 'fire', fx: 'fire' }, fira: { name: 'Fira', mp: 22, kind: 'mag', power: 20, elem: 'fire', fx: 'fire' }, firaga: { name: 'Firaga', mp: 52, kind: 'mag', power: 44, elem: 'fire', fx: 'fire' },
  ice: { name: 'Ice', mp: 4, kind: 'mag', power: 8, elem: 'ice', fx: 'ice' }, icra: { name: 'Icera', mp: 22, kind: 'mag', power: 20, elem: 'ice', fx: 'ice' }, icaga: { name: 'Iceaga', mp: 52, kind: 'mag', power: 44, elem: 'ice', fx: 'ice' },
  bolt: { name: 'Bolt', mp: 4, kind: 'mag', power: 8, elem: 'bolt', fx: 'bolt' }, bolra: { name: 'Bolra', mp: 22, kind: 'mag', power: 20, elem: 'bolt', fx: 'bolt' }, bolaga: { name: 'Bolaga', mp: 52, kind: 'mag', power: 44, elem: 'bolt', fx: 'bolt' },
  aero: { name: 'Aero', mp: 6, kind: 'mag', power: 10, elem: 'wind', fx: 'wind' }, aerora: { name: 'Aerora', mp: 26, kind: 'mag', power: 23, elem: 'wind', fx: 'wind' }, aeroga: { name: 'Aeroga', mp: 58, kind: 'mag', power: 48, elem: 'wind', fx: 'wind' },
  water: { name: 'Water', mp: 6, kind: 'mag', power: 10, elem: 'water', fx: 'water' }, watera: { name: 'Watera', mp: 26, kind: 'mag', power: 23, elem: 'water', fx: 'water' }, waterga: { name: 'Waterga', mp: 58, kind: 'mag', power: 48, elem: 'water', fx: 'water' },
  quake: { name: 'Quake', mp: 18, kind: 'mag', power: 18, elem: 'earth', fx: 'quake', all: 1 }, quakra: { name: 'Quakra', mp: 40, kind: 'mag', power: 32, elem: 'earth', fx: 'quake', all: 1 }, quakaga: { name: 'Quakaga', mp: 76, kind: 'mag', power: 54, elem: 'earth', fx: 'quake', all: 1 },
  cure: { name: 'Cure', mp: 5, kind: 'heal', power: 10, fx: 'heal' }, cura: { name: 'Cura', mp: 24, kind: 'heal', power: 26, fx: 'heal' }, curaga: { name: 'Curaga', mp: 54, kind: 'heal', power: 52, fx: 'heal' }, renew: { name: 'Renew', mp: 120, kind: 'heal', power: 999, fx: 'heal', full: 1 },
  regen: { name: 'Regen', mp: 30, kind: 'buff', status: ['regen'], fx: 'heal' },
  poisona: { name: 'Poisona', mp: 3, kind: 'cure', cure: ['poison'], fx: 'heal' }, esuna: { name: 'Esuna', mp: 15, kind: 'cure', cure: ['poison', 'blind', 'silence', 'stone', 'confuse', 'sleep', 'paralyse', 'frog', 'berserk', 'slow', 'stop'], fx: 'heal' },
  life: { name: 'Life', mp: 34, kind: 'revive', power: 0.25, fx: 'life' }, life2: { name: 'Full-Life', mp: 100, kind: 'revive', power: 1, fx: 'life' },
  protect: { name: 'Protect', mp: 12, kind: 'buff', status: ['protect'], fx: 'shield' }, shell: { name: 'Shell', mp: 12, kind: 'buff', status: ['shell'], fx: 'shield' }, reflect: { name: 'Reflect', mp: 20, kind: 'buff', status: ['reflect'], fx: 'shield' }, wall: { name: 'Wall', mp: 58, kind: 'buff', status: ['protect', 'shell'], fx: 'shield' },
  haste: { name: 'Haste', mp: 18, kind: 'buff', status: ['haste'], fx: 'time' }, slow: { name: 'Slow', mp: 16, kind: 'status', status: ['slow'], hit: 75, fx: 'time' }, stop: { name: 'Stop', mp: 34, kind: 'status', status: ['stop'], hit: 50, fx: 'time' },
  sleep: { name: 'Sleep', mp: 8, kind: 'status', status: ['sleep'], hit: 65, fx: 'dark' }, silence: { name: 'Silence', mp: 10, kind: 'status', status: ['silence'], hit: 70, fx: 'dark' }, confuse: { name: 'Confuse', mp: 18, kind: 'status', status: ['confuse'], hit: 55, fx: 'dark' }, berserk: { name: 'Berserk', mp: 16, kind: 'status', status: ['berserk'], hit: 70, fx: 'dark' },
  bio: { name: 'Bio', mp: 8, kind: 'mag', power: 9, elem: 'poison', status: ['poison'], hit: 40, fx: 'poison' }, bioga: { name: 'Bioga', mp: 36, kind: 'mag', power: 30, elem: 'poison', status: ['poison'], hit: 60, fx: 'poison' },
  demi: { name: 'Demi', mp: 22, kind: 'gravity', power: 0.25, fx: 'dark' }, demira: { name: 'Demira', mp: 44, kind: 'gravity', power: 0.5, fx: 'dark' },
  drain: { name: 'Drain', mp: 14, kind: 'drain', power: 14, fx: 'dark' }, osmose: { name: 'Osmose', mp: 2, kind: 'drainmp', power: 6, fx: 'dark' },
  holy: { name: 'Holy', mp: 96, kind: 'mag', power: 78, elem: 'holy', fx: 'holy' }, flare: { name: 'Flare', mp: 90, kind: 'mag', power: 84, fx: 'fire' }, ultima: { name: 'Ultima', mp: 130, kind: 'mag', power: 110, all: 1, fx: 'holy' }, starfall: { name: 'Starfall', mp: 160, kind: 'mag', power: 26, hits: 6, fx: 'holy' },
  scan: { name: 'Scan', mp: 1, kind: 'scan', fx: 'time' }, doom: { name: 'Doom', mp: 40, kind: 'status', status: ['doom'], hit: 40, fx: 'dark' }, frog: { name: 'Toad', mp: 14, kind: 'status', status: ['frog'], hit: 60, fx: 'dark' }, break_: { name: 'Petrify', mp: 50, kind: 'status', status: ['stone'], hit: 45, fx: 'dark' },
};
// Prisms. type: magic (spells by level), command (adds a battle command), support (works on its linked Prism),
// indep (passive), echo (summon). ap: AP needed for levels 2.. (level 1 at 0). stats: changes while equipped.
AE.PRISMS = {
  // magic
  fire: { name: 'Fire', type: 'magic', col: 'green', spells: ['fire', 'fira', 'firaga'], ap: [0, 2000, 18000, 35000], stats: { maxhp: 0 }, price: 600 },
  ice: { name: 'Ice', type: 'magic', col: 'green', spells: ['ice', 'icra', 'icaga'], ap: [0, 2000, 18000, 35000], price: 600 },
  bolt: { name: 'Bolt', type: 'magic', col: 'green', spells: ['bolt', 'bolra', 'bolaga'], ap: [0, 2000, 18000, 35000], price: 600 },
  aero: { name: 'Aero', type: 'magic', col: 'green', spells: ['aero', 'aerora', 'aeroga'], ap: [0, 2500, 20000, 40000], price: 1400 },
  water: { name: 'Water', type: 'magic', col: 'green', spells: ['water', 'watera', 'waterga'], ap: [0, 2500, 20000, 40000], price: 1400 },
  earth: { name: 'Earth', type: 'magic', col: 'green', spells: ['quake', 'quakra', 'quakaga'], ap: [0, 6000, 22000, 40000], price: 4800 },
  restore: { name: 'Restore', type: 'magic', col: 'green', spells: ['cure', 'cura', 'regen', 'curaga'], ap: [0, 2500, 17000, 24000, 40000], price: 750 },
  heal: { name: 'Heal', type: 'magic', col: 'green', spells: ['poisona', 'esuna'], ap: [0, 12000, 52000], price: 1500 },
  revive: { name: 'Revive', type: 'magic', col: 'green', spells: ['life', 'life2'], ap: [0, 45000, 55000], price: 0 },
  barrier: { name: 'Barrier', type: 'magic', col: 'green', spells: ['protect', 'shell', 'reflect', 'wall'], ap: [0, 5000, 15000, 30000, 45000], price: 5000 },
  time: { name: 'Time', type: 'magic', col: 'green', spells: ['haste', 'slow', 'stop'], ap: [0, 8000, 20000, 42000], price: 6000 },
  mystify: { name: 'Mystify', type: 'magic', col: 'green', spells: ['sleep', 'silence', 'confuse', 'berserk'], ap: [0, 2000, 12000, 25000, 35000], price: 900 },
  toxin: { name: 'Toxin', type: 'magic', col: 'green', spells: ['bio', 'bioga'], ap: [0, 9000, 30000], price: 1200 },
  gravity: { name: 'Gravity', type: 'magic', col: 'green', spells: ['demi', 'demira'], ap: [0, 10000, 40000], price: 4500 },
  seal: { name: 'Seal', type: 'magic', col: 'green', spells: ['drain', 'osmose', 'doom', 'frog', 'break_'], ap: [0, 8000, 20000, 30000, 50000], price: 0 },
  scan_m: { name: 'Insight', type: 'magic', col: 'green', spells: ['scan'], ap: [0, 1000], price: 300 },
  holy: { name: 'Holy', type: 'magic', col: 'green', spells: ['holy'], ap: [0, 60000], price: 0 },
  flare: { name: 'Flare', type: 'magic', col: 'green', spells: ['flare'], ap: [0, 60000], price: 0 },
  ultima: { name: 'Ultima', type: 'magic', col: 'green', spells: ['ultima'], ap: [0, 100000], price: 0 },
  starfall: { name: 'Starfall', type: 'magic', col: 'green', spells: ['starfall'], ap: [0, 120000], price: 0 },
  // commands
  steal: { name: 'Steal', type: 'command', col: 'yellow', cmd: 'steal', ap: [0, 40000], up: 'mug', price: 1200 },
  scan: { name: 'Sense', type: 'command', col: 'yellow', cmd: 'sense', ap: [0, 40000], price: 1000 },
  throw: { name: 'Throw', type: 'command', col: 'yellow', cmd: 'throw', ap: [0, 45000], price: 2500 },
  morph: { name: 'Morph', type: 'command', col: 'yellow', cmd: 'morph', ap: [0, 100000], price: 0 },
  deathblow: { name: 'Deathblow', type: 'command', col: 'yellow', cmd: 'deathblow', ap: [0, 40000], price: 0 },
  doublecast: { name: 'Double-Cast', type: 'command', col: 'yellow', cmd: 'w-magic', ap: [0, 250000], price: 0 },
  enemy_skill: { name: 'Mimic', type: 'command', col: 'yellow', cmd: 'mimic', ap: [0], price: 0 },
  manipulate: { name: 'Charm', type: 'command', col: 'yellow', cmd: 'charm', ap: [0, 40000], price: 0 },
  // support (linked)
  all: { name: 'All', type: 'support', col: 'blue', effect: 'all', ap: [0, 1500, 6000, 18000, 35000], price: 350 },
  elemental: { name: 'Elemental', type: 'support', col: 'blue', effect: 'elem', ap: [0, 10000, 30000, 80000], price: 0 },
  added: { name: 'Added Effect', type: 'support', col: 'blue', effect: 'added', ap: [0, 100000], price: 0 },
  absorb_hp: { name: 'Life Siphon', type: 'support', col: 'blue', effect: 'hpabsorb', ap: [0, 100000], price: 0 },
  absorb_mp: { name: 'Mana Siphon', type: 'support', col: 'blue', effect: 'mpabsorb', ap: [0, 100000], price: 0 },
  counter: { name: 'Counter', type: 'support', col: 'blue', effect: 'counter', ap: [0, 20000, 40000, 60000, 100000], price: 0 },
  quick: { name: 'Quickcast', type: 'support', col: 'blue', effect: 'quick', ap: [0, 20000, 70000], price: 0 },
  // independent
  hp_plus: { name: 'HP Plus', type: 'indep', col: 'purple', effect: 'hp', per: 10, ap: [0, 10000, 20000, 30000, 50000], price: 8000 },
  mp_plus: { name: 'MP Plus', type: 'indep', col: 'purple', effect: 'mp', per: 10, ap: [0, 10000, 20000, 30000, 50000], price: 8000 },
  speed_plus: { name: 'Speed Plus', type: 'indep', col: 'purple', effect: 'spd', per: 8, ap: [0, 15000, 30000, 60000, 100000], price: 0 },
  luck_plus: { name: 'Luck Plus', type: 'indep', col: 'purple', effect: 'lck', per: 8, ap: [0, 15000, 30000, 60000, 100000], price: 0 },
  magic_plus: { name: 'Magic Plus', type: 'indep', col: 'purple', effect: 'mag', per: 8, ap: [0, 10000, 20000, 30000, 50000], price: 0 },
  power_plus: { name: 'Power Plus', type: 'indep', col: 'purple', effect: 'str', per: 8, ap: [0, 10000, 20000, 30000, 50000], price: 0 },
  cover: { name: 'Cover', type: 'indep', col: 'purple', effect: 'cover', per: 20, ap: [0, 2000, 10000, 25000, 40000], price: 0 },
  long_range: { name: 'Long Reach', type: 'indep', col: 'purple', effect: 'long', ap: [0, 80000], price: 0 },
  preemptive: { name: 'First Strike', type: 'indep', col: 'purple', effect: 'pre', per: 1, ap: [0, 8000, 20000, 40000, 80000], price: 0 },
  encounter_down: { name: 'Quiet Step', type: 'indep', col: 'purple', effect: 'encdown', per: 1, ap: [0, 10000, 50000], price: 0 },
  encounter_up: { name: 'Lure', type: 'indep', col: 'purple', effect: 'encup', per: 1, ap: [0, 10000, 50000], price: 0 },
  exp_plus: { name: 'EXP Plus', type: 'indep', col: 'purple', effect: 'exp', per: 1, ap: [0, 60000, 150000], price: 0 },
  gold_plus: { name: 'Gold Plus', type: 'indep', col: 'purple', effect: 'gold', per: 1, ap: [0, 80000, 150000], price: 0 },
  // echoes (summons)
  sylphine: { name: 'Sylphine', type: 'echo', col: 'red', echo: 'sylphine', ap: [0, 5000, 20000, 40000, 60000] },
  marrowtide: { name: 'Marrowtide', type: 'echo', col: 'red', echo: 'marrowtide', ap: [0, 8000, 25000, 50000, 80000] },
  ignarok: { name: 'Ignarok', type: 'echo', col: 'red', echo: 'ignarok', ap: [0, 8000, 25000, 50000, 80000] },
  gaiadon: { name: 'Gaiadon', type: 'echo', col: 'red', echo: 'gaiadon', ap: [0, 10000, 30000, 60000, 90000] },
  voltigar: { name: 'Voltigar', type: 'echo', col: 'red', echo: 'voltigar', ap: [0, 6000, 20000, 40000, 60000] },
  glacielle: { name: 'Glacielle', type: 'echo', col: 'red', echo: 'glacielle', ap: [0, 6000, 20000, 40000, 60000] },
  seraphel: { name: 'Seraphel', type: 'echo', col: 'red', echo: 'seraphel', ap: [0, 15000, 40000, 80000, 120000] },
  nocturne: { name: 'Nocturne', type: 'echo', col: 'red', echo: 'nocturne', ap: [0, 15000, 40000, 80000, 120000] },
  aethrael: { name: 'Aethrael', type: 'echo', col: 'red', echo: 'aethrael', ap: [0, 50000, 150000, 300000, 500000] },
};
AE.ECHOES = {
  sylphine: { name: 'Sylphine', mp: 30, power: 22, elem: 'wind', fx: 'wind', desc: 'A wind spirit tears through the enemy line.', art: 'Spirit' },
  marrowtide: { name: 'Marrowtide', mp: 44, power: 30, elem: 'water', fx: 'water', desc: 'A tidal wave from the deep.', art: 'SquidGreen' },
  ignarok: { name: 'Ignarok', mp: 48, power: 33, elem: 'fire', fx: 'fire', desc: 'The volcano\'s heart erupts.', art: 'GiantFlam' },
  gaiadon: { name: 'Gaiadon', mp: 60, power: 40, elem: 'earth', fx: 'quake', desc: 'The ground itself rises.', art: 'GiantRacoon' },
  voltigar: { name: 'Voltigar', mp: 40, power: 28, elem: 'bolt', fx: 'bolt', desc: 'A storm-bird of lightning.', art: 'TenguBlue' },
  glacielle: { name: 'Glacielle', mp: 40, power: 28, elem: 'ice', fx: 'ice', desc: 'A maiden of eternal frost.', art: 'GiantSpirit' },
  seraphel: { name: 'Seraphel', mp: 90, kind: 'heal', power: 40, fx: 'heal', status: ['regen', 'protect', 'shell'], desc: 'Heals and guards the whole party.', art: 'GiantSpirit' },
  nocturne: { name: 'Nocturne', mp: 100, power: 58, elem: 'dark', fx: 'dark', status: ['slow'], desc: 'The night swallows the field.', art: 'DemonCyclop' },
  aethrael: { name: 'Aethrael', mp: 250, power: 140, hits: 1, fx: 'holy', desc: 'The world\'s first Echo, the voice of the Crystals.', art: 'DragonGreen' },
};
AE.ELEMENTS = ['fire', 'ice', 'bolt', 'water', 'wind', 'earth', 'holy', 'dark', 'poison'];
AE.STATUS_INFO = {
  poison: { col: '#80e060', bad: 1 }, blind: { col: '#a0a0a0', bad: 1 }, silence: { col: '#c0c0ff', bad: 1 }, sleep: { col: '#c080ff', bad: 1 },
  paralyse: { col: '#ffe060', bad: 1 }, confuse: { col: '#ff80c0', bad: 1 }, berserk: { col: '#ff6040', bad: 1 }, stone: { col: '#b0a090', bad: 1 },
  doom: { col: '#ff4040', bad: 1 }, frog: { col: '#40c060', bad: 1 }, slow: { col: '#6080ff', bad: 1 }, stop: { col: '#80a0c0', bad: 1 },
  haste: { col: '#ffd040' }, protect: { col: '#60c0ff' }, shell: { col: '#a080ff' }, regen: { col: '#60ff90' }, reflect: { col: '#c0ffff' }, float: { col: '#e0e0ff' }, vanish: { col: '#a0a0c0' },
};

/* ================= Enemies, enemy skills and encounter tables =================
   art: {mon: 'Slime', hue, k} | {boss: 'GiantSlime', anim, fw, fh, k} | {cast: 'trooper'} */
AE.ENEMIES = {};
AE.SKILLS = {};
AE.SPECIALS = {};
AE.ENC = {};
AE.SHOPS = {};
// E(id, name, lv, hp, atk, def, mag, mdef, spd, exp, ap, gold, art, extra)
AE.E = function (id, name, lv, hp, atk, def, mag, mdef, spd, exp, ap, gold, art, extra) {
  AE.ENEMIES[id] = Object.assign({ name: name, lv: lv, hp: hp, atk: atk, def: def, mag: mag, mdef: mdef, spd: spd, exp: exp, ap: ap, gold: gold, art: art, mp: 60 }, extra || {});
};
AE.K = function (id, o) { AE.SKILLS[id] = o; };

/* ================= Battle rules: fighters, damage, status, actions =================
   Formulas follow the classic ATB games: physical damage grows with Attack and level against (512 - Defence);
   magic with Magic and level against (512 - Magic Defence). ATB fills from Speed. */
AE.Fighter = function (o) { Object.assign(this, o); };
AE.mkParty = function (id, slot) {
  const S = AE.S_, m = S.m[id], C = AE.CHARS[id]; AE.calc(id); const st = m.st;
  const f = new AE.Fighter({ side: 'party', id: id, name: C.name, m: m, lv: m.lv, hp: m.hp, maxhp: m.maxhp, mp: m.mp, maxmp: m.maxmp,
    atk: st.atk, def: st.def, mag: st.mag, mdef: st.mdef, spd: st.spd, lck: st.lck, str: st.str, hit: st.hit, eva: st.eva, meva: st.meva,
    elemAtk: st.elemAtk, half: st.armHalf, guard: st.statusGuard, row: m.row, long: !!(AE.WEAPONS[m.equip.weapon] || {}).long || !!st.abil.indep.long,
    abil: st.abil, status: {}, atb: Math.random() * 0.5, slot: slot, surge: m.surge || 0, anim: 'ready', t: 0 });
  (m.status || []).forEach(function (s) { f.status[s] = 999; });
  if (st.acc === 'haste') f.status.haste = 9999; if (st.acc === 'protect') { f.status.protect = 9999; f.status.shell = 9999; }
  if (st.acc === 'regen') f.status.regen = 9999; if (st.acc === 'berserk') f.status.berserk = 9999;
  return f;
};
AE.mkEnemy = function (id, slot, o) {
  const D = AE.ENEMIES[id]; if (!D) throw new Error('no enemy ' + id);
  return new AE.Fighter(Object.assign({ side: 'enemy', id: id, d: D, name: D.name, lv: D.lv, hp: D.hp, maxhp: D.hp, mp: D.mp || 99, maxmp: D.mp || 99,
    atk: D.atk, def: D.def, mag: D.mag, mdef: D.mdef, spd: D.spd, lck: D.lck || 10, hit: D.hit || 95, eva: D.eva || 0, meva: D.meva || 0,
    status: {}, atb: Math.random() * 0.7, slot: slot, anim: 'idle', t: Math.random() * 10, ai: { n: 0, vars: {} } }, o || {}));
};
AE.alive = function (f) { return f.hp > 0 && !f.status.stone && !f.gone; };
AE.canAct = function (f) { return AE.alive(f) && !f.status.sleep && !f.status.paralyse && !f.status.stop; };
// ---------- damage ----------
AE.variance = function (n) { return Math.floor(n * (3841 + AE.rand(256)) / 4096); };
AE.physDamage = function (a, t, power, o) {
  o = o || {};
  const atk = a.status.berserk ? a.atk * 1.5 : a.atk, lv = a.lv;
  let base = atk + ((atk + lv) / 32) * ((atk * lv) / 32);
  let dmg = (power * 16) * (512 - Math.min(511, o.pierce ? 0 : t.def)) * base / (16 * 512);
  if (o.crit) dmg *= 2;
  if (a.side === 'enemy' && lv > 30) dmg *= Math.max(0.5, 1 - (lv - 30) * 0.0125);   // the level curve grows fast: late enemies hit a little softer
  if (!o.pierce && t.status.protect) dmg /= 2;
  if (t.defending) dmg /= 2;
  if (a.side === 'party' && a.row === 'back' && !a.long && !o.ranged) dmg /= 2;
  if (t.side === 'party' && t.row === 'back' && !o.ranged) dmg /= 2;
  if (a.status.frog) dmg /= 4;
  return AE.variance(dmg);
};
AE.magDamage = function (a, t, power, o) {
  o = o || {};
  let base = 6 * (a.mag + a.lv);
  let dmg = power * (512 - Math.min(511, t.mdef)) * base / (16 * 512);
  if (t.status.shell) dmg /= 2;
  if (o.split) dmg /= 2;   // spells on all targets lose a little
  return AE.variance(dmg);
};
AE.healAmount = function (a, power) { return AE.variance((power * 22 + 6 * (a.mag + a.lv) * power / 10)); };
// element: returns multiplier (-1 = absorb)
AE.elemMod = function (t, elem) {
  if (!elem) return 1;
  const D = t.d || {};
  if (t.side === 'enemy') {
    if ((D.absorb || []).indexOf(elem) >= 0) return -1;
    if ((D.immune || []).indexOf(elem) >= 0) return 0;
    if ((D.weak || []).indexOf(elem) >= 0) return 2;
    if ((D.resist || []).indexOf(elem) >= 0) return 0.5;
  } else if (t.half && t.half.indexOf(elem) >= 0) return 0.5;
  if (t.status.frog && elem === 'ice') return 1.5;
  return 1;
};
AE.critChance = function (a, t) { return AE.clamp((a.lck + a.lv - t.lv) / 4, 1, 40) / 100; };
AE.hitChance = function (a, t) {
  let h = a.hit + Math.floor(a.lck / 4) - (t.eva || 0);
  if (a.status.blind) h -= 50; if (t.status.sleep || t.status.paralyse || t.status.stop) h = 255;
  return AE.clamp(h, 5, 255) / 100;
};
// apply a status (respecting immunities and guards); dur in seconds of battle time
AE.STATUS_DUR = { poison: 999, blind: 999, silence: 999, sleep: 20, paralyse: 10, confuse: 25, berserk: 999, stone: 999, doom: 60, frog: 999, slow: 40, stop: 15, haste: 60, protect: 90, shell: 90, regen: 60, reflect: 60, float: 999, vanish: 12 };
AE.giveStatus = function (t, s, o) {
  const D = t.d || {};
  if ((D.immuneStatus || []).indexOf(s) >= 0) return false;
  if (t.guard && t.guard.indexOf(s) >= 0) return false;
  if (D.boss && ['stone', 'doom', 'stop', 'frog', 'confuse', 'sleep', 'paralyse'].indexOf(s) >= 0 && !(o && o.force)) return false;
  if (s === 'haste') delete t.status.slow; if (s === 'slow') delete t.status.haste;
  t.status[s] = AE.STATUS_DUR[s] || 60;
  if (s === 'stone' || s === 'doom') { if (s === 'stone') t.atb = 0; }
  return true;
};
// ---------- encounters ----------
AE.rollFormation = function (group) {
  const G = AE.ENC[group]; if (!G) return null;
  const tot = G.sets.reduce(function (a, s) { return a + (s.w || 1); }, 0); let r = Math.random() * tot;
  for (let i = 0; i < G.sets.length; i++) { r -= G.sets[i].w || 1; if (r <= 0) return Object.assign({ bg: G.bg, music: G.music }, G.sets[i]); }
  return Object.assign({ bg: G.bg }, G.sets[0]);
};
// ---------- rewards ----------
AE.giveExp = function (members, exp) {
  const ups = [];
  members.forEach(function (m) {
    const before = m.lv; m.exp += exp;
    while (m.lv < 99 && m.exp >= AE.expFor(m.lv + 1)) m.lv++;
    if (m.lv > before) { const oldmax = m.maxhp; AE.calc(m.id); m.hp += m.maxhp - oldmax; ups.push({ id: m.id, from: before, to: m.lv }); }
  });
  return ups;
};
AE.giveAp = function (members, ap) {
  const S = AE.S_, mastered = [];
  members.forEach(function (m) {
    ['weapon', 'armor'].forEach(function (slot) {
      const it = slot === 'weapon' ? AE.WEAPONS[m.equip.weapon] : AE.ARMORS[m.equip.armor]; const growth = it && it.growth === 0 ? 0 : 1;
      (m.slots[slot] || []).forEach(function (pid) {
        if (pid === null || pid === undefined) return; const P = S.prisms[pid]; if (!P) return;
        const before = AE.prismLevel(P), wasM = AE.prismMaster(P); P.ap += ap * growth;
        if (!wasM && AE.prismMaster(P)) { mastered.push(P.id); if ((AE.PRISMS[P.id].ap || []).length > 1) AE.addPrism(P.id, 0); }
        else if (AE.prismLevel(P) > before) mastered.push('lv:' + P.id);
      });
    });
    AE.calc(m.id);
  });
  return mastered;
};

/* ================= The battle scene (ATB) =================
   Party of up to 3 on the right, enemies on the left. ATB gauges fill with Speed; a full gauge opens the command
   window (Q/E switch between ready characters). Actions play one at a time. Wait mode pauses the gauges while you
   are choosing a spell, item or target. */
AE.startBattle = function (form, o) {
  o = o || {}; const g = AE.game;
  return new Promise(function (res) {
    const b = new AE.Battle(form, o); b.done = res;
    AE.Sfx && AE.Sfx.play('encounter');
    if (AE.Music) { b.prevMusic = AE.Music.cur; AE.Music.play(form.music || (form.boss ? 'boss' : 'battle')); }
    g.push(b);
  });
};
AE.Battle = function (form, o) {
  this.kind = 'battle'; this.opaque = true; this.form = form; this.o = o; const S = AE.S_, self = this;
  this.party = S.party.slice(0, 3).map(function (id, i) { return AE.mkParty(id, i); });
  this.enemies = form.enemies.map(function (e, i) { return AE.mkEnemy(typeof e === 'string' ? e : e.id, i, typeof e === 'string' ? {} : e); });
  this.layout();
  this.queue = []; this.ready = []; this.busy = false; this.menu = null; this.phase = 'intro'; this.t = 0; this.pops = []; this.fx = []; this.banner = null;
  this.allUses = {}; this.runHold = 0; this.result = null; this.spoils = { exp: 0, ap: 0, gold: 0, items: [] };
  // ambush / first strike
  const pre = Math.max(0, ...this.party.map(function (f) { return f.abil.indep.pre || 0; }));
  this.pre = form.pre || (!form.boss && Math.random() < 0.06 + pre * 0.12) ? 1 : (!form.boss && Math.random() < 0.05) ? -1 : 0;
  if (form.ambush) this.pre = -1;
  if (this.pre === 1) this.party.forEach(function (f) { f.atb = 1; });
  if (this.pre === -1) { this.enemies.forEach(function (f) { f.atb = 1; }); this.party.forEach(function (f) { f.atb = 0; }); }
  S.stats.battles++;
};
AE.Battle.prototype.layout = function () {
  this.party.forEach(function (f, i) { f.hx = 204 + i * 8 + (f.row === 'back' ? 14 : 0); f.hy = 72 + i * 28; f.x = f.hx; f.y = f.hy; });
  const n = this.enemies.length, self = this;
  this.enemies.forEach(function (f, i) {
    const p = (self.form.pos && self.form.pos[i]) || AE.autoPos(i, n, f.d);
    f.hx = p[0]; f.hy = p[1]; f.x = f.hx; f.y = f.hy;
  });
};
AE.autoPos = function (i, n, d) {
  if (d && d.boss && n === 1) return [74, 112];
  // up to 3 per column, columns spread to the left; big foes take more room
  const big = d && d.art && (d.art.k || 3) > 3, cols = Math.ceil(n / 3), c = Math.floor(i / 3), r = i % 3, rows = Math.min(3, n - c * 3);
  const colW = cols > 2 ? 40 : 52, x0 = 128 - (big ? 10 : 0);
  return [x0 - c * colW - (r === 1 && rows === 3 ? 14 : 0), 104 + (r - (rows - 1) / 2) * (rows === 3 ? 30 : 36)];
};
AE.Battle.prototype.all = function () { return this.party.concat(this.enemies); };
AE.Battle.prototype.foes = function (f) { return (f.side === 'party' ? this.enemies : this.party).filter(AE.alive); };
AE.Battle.prototype.friends = function (f, ko) { return (f.side === 'party' ? this.party : this.enemies).filter(function (x) { return ko ? !x.gone : AE.alive(x); }); };
AE.Battle.prototype.speedK = function () { return [0, 0.55, 0.75, 1, 1.25, 1.5][AE.S_.cfg.speed || 3]; };
AE.Battle.prototype.paused = function () {
  if (this.phase !== 'fight') return true;
  if (AE.S_.cfg.atb === 'wait' && this.menu && (this.menu.depth > 0)) return true;
  return false;
};
AE.Battle.prototype.update = function (g) {
  const I = g.input, self = this; this.t++;
  this.all().forEach(function (f) { f.t += 1 / 60; if (f.flash > 0) f.flash--; if (f.shake > 0) f.shake--; });
  this.pops = this.pops.filter(function (p) { p.t++; return p.t < 60; });
  this.fx = this.fx.filter(function (e) { e.t++; return e.t < e.life; });
  if (this.banner && --this.banner.t <= 0) this.banner = null;
  if (this.phase === 'intro') { if (this.t > 30) { this.phase = 'fight'; if (this.pre) this.say(this.pre > 0 ? 'First strike!' : 'Ambushed!'); } return; }
  if (this.phase === 'win' || this.phase === 'lose' || this.phase === 'end') { if (this.endUpdate) this.endUpdate(g); return; }
  // ATB and timed status
  if (!this.paused() && !this.busy) this.tick(1 / 60);
  else if (!this.paused()) this.tick(1 / 60);
  // run away: hold Q and E together (or the Run command)
  if (I.held.prev && I.held.next && !this.form.noRun) { if (++this.runHold > 70) { this.tryRun(); this.runHold = 0; } } else this.runHold = 0;
  // menus
  if (this.menu) this.menu.update(I, this);
  else if (this.ready.length) {
    const f = this.ready[0]; if (AE.canAct(f) && !f.status.confuse && !f.status.berserk) this.openMenu(f);
    else this.ready.shift();
  }
  // actions
  if (!this.busy && this.queue.length) {
    const act = this.queue.shift();
    if (!AE.alive(act.user) || (act.user.side === 'enemy' && this.over())) return;
    this.busy = true;
    this.perform(act).catch(function (e) { console.error(e); }).then(function () { self.busy = false; self.afterAction(); });
  }
};
AE.Battle.prototype.tick = function (dt) {
  const k = this.speedK(), self = this;
  this.all().forEach(function (f) {
    if (!AE.alive(f)) return;
    // timed statuses
    for (const s in f.status) {
      if (f.status[s] >= 999) continue;
      f.status[s] -= dt;
      if (f.status[s] <= 0) { delete f.status[s]; if (s === 'doom') { self.kill(f, 'doom'); } }
    }
    f.dotT = (f.dotT || 0) + dt;
    if (f.dotT > 3) {
      f.dotT = 0;
      if (f.status.poison) { const d = Math.max(1, Math.floor(f.maxhp / 32)); self.hurt(f, d, { quiet: false, col: '#9f9' }); }
      if (f.status.regen) { const h = Math.max(1, Math.floor(f.maxhp / 24)); self.healHp(f, h); }
    }
    if (!AE.canAct(f) || f.waiting) return;
    let r = (f.spd + 25) / 1500 * k * (f.status.haste ? 1.5 : 1) * (f.status.slow ? 0.5 : 1);
    if (f.side === 'enemy' && f.d.atbK) r *= f.d.atbK;
    f.atb = Math.min(1, f.atb + r);
    if (f.atb >= 1) {
      f.waiting = true; f.defending = false;
      if (f.side === 'enemy') self.enemyTurn(f);
      else if (f.status.confuse || f.status.berserk) self.autoTurn(f);
      else self.ready.push(f);
    }
  });
};
AE.Battle.prototype.over = function () { return !this.enemies.some(AE.alive) || !this.party.some(AE.alive); };
AE.Battle.prototype.afterAction = function () {
  if (this.phase !== 'fight') return;
  if (!this.enemies.some(function (e) { return AE.alive(e) && !e.d.ignore; })) { this.win(); return; }
  if (!this.party.some(AE.alive)) { this.lose(); return; }
};
AE.Battle.prototype.say = function (text, t) { this.banner = { text: text, t: t || 70 }; };
// ---------- turns ----------
AE.Battle.prototype.endTurn = function (f) { f.atb = 0; f.waiting = false; const i = this.ready.indexOf(f); if (i >= 0) this.ready.splice(i, 1); };
AE.Battle.prototype.enemyTurn = function (f) {
  const act = AE.enemyAct(f, this);
  if (!act) { this.endTurn(f); return; }
  act.user = f; this.queue.push(act);
};
AE.Battle.prototype.autoTurn = function (f) {
  const foes = f.status.confuse && Math.random() < 0.5 ? this.friends(f) : this.foes(f);
  if (!foes.length) { this.endTurn(f); return; }
  this.queue.push({ user: f, kind: 'attack', targets: [AE.pick(foes)] });
};
AE.Battle.prototype.openMenu = function (f) { this.menu = new AE.BattleMenu(f, this); AE.Sfx && AE.Sfx.play('ready'); };
AE.Battle.prototype.commit = function (act) {
  const f = act.user; this.menu = null; const i = this.ready.indexOf(f); if (i >= 0) this.ready.splice(i, 1);
  if (act.kind === 'defend') { f.defending = true; this.endTurn(f); return; }
  if (act.kind === 'row') { f.row = f.row === 'back' ? 'front' : 'back'; f.m.row = f.row; this.layout(); this.endTurn(f); return; }
  this.queue.push(act);
};
AE.Battle.prototype.tryRun = function () {
  if (this.form.noRun) { this.say('Can\'t escape!'); return; }
  const ps = this.party.filter(AE.alive), es = this.enemies.filter(AE.alive);
  const lvA = ps.reduce(function (a, f) { return a + f.lv; }, 0) / Math.max(1, ps.length), lvE = es.reduce(function (a, f) { return a + f.lv; }, 0) / Math.max(1, es.length);
  if (Math.random() < AE.clamp(0.55 + (lvA - lvE) * 0.04, 0.15, 0.95)) {
    this.say('Escaped!'); AE.Sfx && AE.Sfx.play('run'); AE.S_.stats.runs++;
    this.party.forEach(function (f) { f.anim = 'move'; f.flip = true; });
    this.finish('run', 50);
  } else this.say('Couldn\'t escape!');
};
// ---------- outcomes ----------
AE.Battle.prototype.kill = function (f, how) {
  f.hp = 0; f.atb = 0; f.waiting = false; const i = this.ready.indexOf(f); if (i >= 0) this.ready.splice(i, 1);
  if (this.menu && this.menu.f === f) this.menu = null;
  if (f.side === 'enemy') {
    f.dying = 30; AE.Sfx && AE.Sfx.play('die');
    const S = AE.S_; S.stats.kills++; S.bestiary[f.id] = (S.bestiary[f.id] || 0) + 1;
    if (!f.noReward) { this.spoils.exp += f.d.exp || 0; this.spoils.ap += f.d.ap || 0; this.spoils.gold += f.d.gold || 0;
      (f.d.drop || []).forEach(function (dr) { if (Math.random() < dr[1]) this.spoils.items.push(dr[0]); }, this); }
  } else { f.anim = 'dead'; f.status = {}; f.surge = f.surge || 0; }
};
AE.Battle.prototype.hurt = function (f, d, o) {
  o = o || {}; d = Math.floor(d);
  if (d < 0) { this.healHp(f, -d); return; }
  d = Math.min(9999, d);
  f.hp = Math.max(0, f.hp - d); f.flash = 10; f.shake = 8;
  this.pop(f, String(d), o.col || '#fff');
  if (f.side === 'party') { f.surge = Math.min(1, (f.surge || 0) + d / f.maxhp * 0.75); f.anim = 'hurt'; f.animT = 12; }
  if (f.status.sleep && !o.keepSleep) delete f.status.sleep;
  if (f.status.confuse && Math.random() < 0.5) delete f.status.confuse;
  if (f.hp <= 0) this.kill(f);
};
AE.Battle.prototype.healHp = function (f, h) { h = Math.floor(Math.min(9999, h)); if (!AE.alive(f) && !f.reviving) return; f.hp = Math.min(f.maxhp, f.hp + h); this.pop(f, String(h), '#7f7'); };
AE.Battle.prototype.pop = function (f, text, col) { this.pops.push({ x: f.x, y: f.y - (f.side === 'enemy' ? AE.enemyH(f) : 30), text: text, col: col, t: 0 }); };
AE.Battle.prototype.win = function () {
  if (this.phase !== 'fight') return;
  this.phase = 'win'; this.menu = null; const self = this, S = AE.S_;
  if (AE.Music) AE.Music.play('victory');
  this.party.forEach(function (f) { if (AE.alive(f)) { f.anim = 'win'; f.t = 0; } });
  const alive = this.party.filter(AE.alive).map(function (f) { return f.m; });
  const all = this.party.map(function (f) { return f.m; });
  const xb = 1 + Math.max(0, ...this.party.map(function (f) { return f.abil.indep.exp || 0; })) * 0.5;
  const gb = 1 + Math.max(0, ...this.party.map(function (f) { return f.abil.indep.gold || 0; })) * 0.5;
  const sp = this.spoils; sp.exp = Math.floor(sp.exp * xb); sp.gold = Math.floor(sp.gold * gb);
  this.syncBack();
  sp.ups = AE.giveExp(alive, sp.exp);
  // reserve members learn at half rate
  const res = S.reserve.map(function (id) { return S.m[id]; }).filter(Boolean); AE.giveExp(res, Math.floor(sp.exp / 2));
  sp.prisms = AE.giveAp(alive, sp.ap);
  S.gold = Math.min(9999999, S.gold + sp.gold);
  sp.items.forEach(function (id) { AE.gainQuiet(id); });
  this.endT = 0; this.endPage = 0;
  this.endUpdate = function (g) {
    self.endT++;
    if (self.endT > 40 && (g.input.pressed.ok || g.input.pressed.back)) {
      self.endPage++;
      if (self.endPage >= self.endPages().length) self.finish('win', 0);
      else AE.Sfx && AE.Sfx.play('ok');
    }
  };
};
AE.gainQuiet = function (id) {
  if (id.indexOf('prism:') === 0) AE.addPrism(id.slice(6)); else if (id.indexOf('card:') === 0) AE.S_.cards[id.slice(5)] = (AE.S_.cards[id.slice(5)] || 0) + 1; else AE.addItem(id, 1);
};
AE.Battle.prototype.endPages = function () {
  const sp = this.spoils, pages = [];
  pages.push(['EXP ' + AE.fmt(sp.exp), 'AP ' + AE.fmt(sp.ap), AE.fmt(sp.gold) + ' G']);
  if (sp.items.length) pages.push(['Found:'].concat(sp.items.map(AE.itemName)));
  const lv = (sp.ups || []).map(function (u) { return AE.CHARS[u.id].name + ' reached Lv ' + u.to + '!'; });
  if (lv.length) pages.push(lv);
  const pm = (sp.prisms || []).map(function (p) { return p.indexOf('lv:') === 0 ? AE.PRISMS[p.slice(3)].name + ' Prism levelled up!' : AE.PRISMS[p].name + ' Prism mastered! A new one was born.'; });
  if (pm.length) pages.push(pm);
  return pages;
};
AE.Battle.prototype.lose = function () {
  if (this.phase !== 'fight') return; this.phase = 'lose'; this.menu = null; const self = this;
  if (this.o.canLose) { this.say('Defeated...', 120); this.finish('lose', 120); return; }
  if (AE.Music) AE.Music.play('gameover');
  this.endT = 0;
  this.endUpdate = function (g) { self.endT++; if (self.endT > 150 && (g.input.pressed.ok)) self.finish('lose', 0); };
};
AE.Battle.prototype.syncBack = function () {
  this.party.forEach(function (f) {
    const m = f.m; m.hp = Math.max(0, f.hp); m.mp = f.mp; m.surge = f.surge;
    m.status = Object.keys(f.status).filter(function (s) { return ['poison', 'blind', 'silence', 'frog', 'stone'].indexOf(s) >= 0; });
  });
};
AE.Battle.prototype.finish = function (res, delay) {
  if (this.finished) return; this.finished = true; const self = this, g = AE.game;
  if (res !== 'win') this.syncBack();
  this.phase = 'end';
  AE.wait(delay || 1).then(function () { return g.fadeOut(0.1); }).then(function () {
    g.pop(self);
    if (res === 'lose' && !self.o.canLose) { AE.gameOver(); g.fadeIn(0.05); return; }
    if (res === 'lose') AE.partyMembers().forEach(function (m) { if (m.hp <= 0) m.hp = 1; });
    if (AE.Music && self.prevMusic) AE.Music.play(self.prevMusic);
    g.fadeIn(0.1); self.done(res);
  });
};

/* ================= Battle actions ================= */
AE.Battle.prototype.perform = async function (act) {
  const B = this, u = act.user, k = act.kind;
  if (!AE.canAct(u) && k !== 'surge') { B.endTurn(u); return; }
  act.targets = (act.targets || []).filter(function (t) { return act.ko ? !t.gone : AE.alive(t); });
  if (!act.targets.length && act.need !== false) {
    // retarget a living foe or friend of the same side as the original pick
    const pool = act.side === 'friends' ? B.friends(u) : B.foes(u);
    if (!pool.length) { B.endTurn(u); return; }
    act.targets = act.all ? pool : [AE.pick(pool)];
  }
  switch (k) {
    case 'attack': await B.doAttack(u, act.targets[0], {}); break;
    case 'magic': await B.doSpell(u, act.id, act.targets, act); break;
    case 'echo': await B.doEcho(u, act.id, act.targets, act); break;
    case 'item': await B.doItem(u, act.id, act.targets); break;
    case 'surge': await B.doSurge(u, act.id, act.targets); break;
    case 'skill': await B.doSkill(u, act.id, act.targets); break;
    case 'steal': await B.doSteal(u, act.targets[0], act.mug); break;
    case 'sense': await B.doSense(u, act.targets[0]); break;
    case 'throw': await B.doThrow(u, act.id, act.targets[0]); break;
    case 'morph': await B.doAttack(u, act.targets[0], { morph: 1 }); break;
    case 'deathblow': await B.doAttack(u, act.targets[0], { crit: 1, hitMod: -30 }); break;
    case 'run': B.tryRun(); break;
    case 'wait': await AE.wait(10); break;
  }
  B.endTurn(u);
};
AE.Battle.prototype.step = async function (u, fwd) {
  // party steps left toward the enemies, enemies flash
  if (u.side === 'party') { u.anim = 'move'; for (let i = 0; i < 8; i++) { u.x = u.hx - (fwd ? i * 2 : (8 - i) * 2) - (fwd ? 0 : 0); await AE.wait(1); } if (!fwd) u.x = u.hx; u.anim = 'ready'; }
  else { u.flash = 12; await AE.wait(10); }
};
AE.Battle.prototype.pose = async function (u, anim, frames) {
  if (u.side !== 'party') { u.flash = 8; await AE.wait(frames || 12); return; }
  u.anim = anim; u.t = 0; await AE.wait(frames || 18); u.anim = 'ready';
};
AE.Battle.prototype.doAttack = async function (u, t, o) {
  const B = this; o = o || {};
  await B.step(u, true);
  const C = u.side === 'party' ? AE.CHARS[u.id] : null;
  const anim = C ? (C.weap === 'lance' ? 'thrust' : C.weap === 'gun' ? 'thrust' : 'slash') : 'attack';
  await B.pose(u, anim, 12);
  B.addFx(u.side === 'party' ? (C.weap === 'gun' ? 'shot' : C.weap === 'fist' ? 'claw' : 'slash') : (u.d.hitFx || 'claw'), t);
  AE.Sfx && AE.Sfx.play(C && C.weap === 'gun' ? 'shot' : 'hit');
  await AE.wait(8);
  B.hitOnce(u, t, 1, Object.assign({ elem: u.elemAtk || (u.d && u.d.elemAtk) }, o));
  // counter
  if (t.side === 'party' && AE.alive(t) && t.abil && t.abil.support.some(function (s) { return s.id === 'counter'; }) && Math.random() < 0.4 && AE.canAct(t)) {
    await AE.wait(10); B.say('Counter'); await B.doAttack(t, u, { counter: 1 });
  }
  await AE.wait(12);
  await B.step(u, false);
};
// one physical hit: returns damage dealt or -1 for a miss
AE.Battle.prototype.hitOnce = function (u, t, power, o) {
  const B = this; o = o || {};
  if (!AE.alive(t)) return -1;
  if (t.status.vanish && !o.magic) { B.pop(t, 'Miss', '#ccc'); return -1; }
  if (!o.sure && Math.random() > AE.hitChance(u, t) + (o.hitMod || 0) / 100) { B.pop(t, 'Miss', '#ccc'); return -1; }
  const crit = o.crit || Math.random() < AE.critChance(u, t);
  let d = AE.physDamage(u, t, power, { crit: crit, pierce: o.pierce, ranged: o.ranged });
  const em = AE.elemMod(t, o.elem);
  if (o.morph && t.side === 'enemy') d = Math.floor(d / 8);
  if (em === -1) { B.healHp(t, d); return 0; }
  d = Math.floor(d * em);
  if (crit) B.pop(t, 'Critical!', '#ff8');
  B.hurt(t, Math.max(1, d), { col: em > 1 ? '#ffd040' : '#fff' });
  if (o.morph && t.side === 'enemy' && !AE.alive(t) && t.d.morph) { AE.gainQuiet(t.d.morph); B.say('Morphed into ' + AE.itemName(t.d.morph)); }
  if (u.side === 'party' && u.m && AE.WEAPONS[u.m.equip.weapon] && AE.WEAPONS[u.m.equip.weapon].addStatus && Math.random() < 0.25) AE.giveStatus(t, AE.WEAPONS[u.m.equip.weapon].addStatus);
  if (u.side === 'enemy' && u.d.addStatus && Math.random() < (u.d.addChance || 0.25)) { if (AE.giveStatus(t, u.d.addStatus)) B.pop(t, AE.cap(u.d.addStatus), AE.STATUS_INFO[u.d.addStatus].col); }
  // HP absorb support
  return d;
};
AE.cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
// spells (and enemy magic): kind mag | heal | status | buff | cure | revive | gravity | drain | scan
AE.Battle.prototype.doSpell = async function (u, id, targets, act) {
  const B = this, S = AE.SPELLS[id] || AE.SKILLS[id]; if (!S) return;
  const cost = act && act.free ? 0 : (S.mp || 0);
  if (u.mp < cost) { B.say('Not enough MP'); return; }
  if (u.status.silence && !(act && act.skill)) { B.say('Silenced!'); return; }
  u.mp -= cost;
  B.say(S.name, 50);
  await B.pose(u, 'cast', 20);
  const multi = targets.length > 1;
  for (let rep = 0; rep < (S.hits || 1) * (act && act.double ? 2 : 1); rep++) {
    const ts = (S.hits && S.hits > 1 && !S.all) ? [AE.pick(targets.filter(AE.alive).length ? targets.filter(AE.alive) : targets)] : targets;
    ts.forEach(function (t) { B.addFx(S.fx || 'spark', t); });
    AE.Sfx && AE.Sfx.play('spell_' + (S.fx || 'spark'));
    await AE.wait(22);
    ts.forEach(function (t0) {
      let t = t0;
      if (t.status.reflect && S.kind !== 'scan' && u !== t && !S.noReflect) { const back = u.side === t.side ? B.friends(t) : B.foes(t); if (back.length) { B.pop(t, 'Reflect', '#cff'); t = AE.pick(back); } }
      B.applySpell(u, t, S, { multi: multi && !S.all });
    });
    await AE.wait(14);
  }
};
AE.Battle.prototype.applySpell = function (u, t, S, o) {
  const B = this; o = o || {};
  if (S.kind === 'revive') {
    if (t.hp > 0 && AE.alive(t)) { B.pop(t, 'No effect', '#ccc'); return; }
    if (t.d && t.d.undead) { B.kill(t); return; }
    t.hp = Math.max(1, Math.floor(t.maxhp * (S.power || 0.25))); t.anim = 'ready'; t.atb = 0; t.waiting = false; B.pop(t, 'Revived', '#7f7'); return;
  }
  if (!AE.alive(t)) return;
  if (S.kind === 'heal') {
    let h = S.full ? t.maxhp : AE.healAmount(u, S.power) * (o.multi ? 0.6 : 1);
    if (t.d && t.d.undead) { B.hurt(t, h); return; }
    B.healHp(t, h);
    if (S.cure) B.cure(t, AE.ITEMS.remedy.use.cure);
  } else if (S.kind === 'mag' || S.kind === 'drain') {
    if (t.meva && Math.random() * 100 < t.meva) { B.pop(t, 'Miss', '#ccc'); return; }
    let d = AE.magDamage(u, t, S.power, { split: o.multi });
    const em = AE.elemMod(t, S.elem);
    if (em === -1) { B.healHp(t, d); return; }
    d = Math.floor(d * em);
    if (d <= 0 && em === 0) { B.pop(t, 'Immune', '#ccc'); }
    else B.hurt(t, Math.max(1, d), { col: em > 1 ? '#ffd040' : '#fff' });
    if (S.kind === 'drain') B.healHp(u, Math.min(d, t.hp + d));
  } else if (S.kind === 'drainmp') {
    const d = Math.min(t.mp, Math.floor(AE.magDamage(u, t, S.power) / 4)); t.mp -= d; u.mp = Math.min(u.maxmp, u.mp + d); B.pop(u, d + ' MP', '#8cf');
  } else if (S.kind === 'gravity') {
    if (t.d && t.d.boss && t.d.noGravity) { B.pop(t, 'Immune', '#ccc'); return; }
    B.hurt(t, Math.max(1, Math.floor(t.hp * S.power)));
  } else if (S.kind === 'scan') {
    B.scan(t); return;
  } else if (S.kind === 'cure') { B.cure(t, S.cure); return; }
  if (S.status) {
    const hit = S.kind === 'buff' ? 101 : (S.hit || 100);
    S.status.forEach(function (s) {
      if (Math.random() * 100 < hit - (t.lv - u.lv) && AE.alive(t)) { if (AE.giveStatus(t, s)) B.pop(t, AE.cap(s), (AE.STATUS_INFO[s] || {}).col || '#fff'); else if (S.kind !== 'mag') B.pop(t, 'Immune', '#ccc'); }
      else if (S.kind !== 'mag') B.pop(t, 'Miss', '#ccc');
    });
  }
};
AE.Battle.prototype.cure = function (t, list) {
  let any = false; (list || []).forEach(function (s) { if (t.status[s]) { delete t.status[s]; any = true; } });
  if (any) this.pop(t, 'Cured', '#7f7'); if (t.status.stone === undefined && t.anim === 'stone') t.anim = 'ready';
};
AE.Battle.prototype.scan = function (t) {
  const D = t.d || {}, w = (D.weak || []).join(', ') || 'none';
  this.say(t.name + '  Lv ' + t.lv + '  HP ' + t.hp + '/' + t.maxhp + '  Weak: ' + w, 140);
  AE.S_.bestiary['scan:' + t.id] = 1;
};
AE.Battle.prototype.doEcho = async function (u, id, targets, act) {
  const B = this, E = AE.ECHOES[id]; if (!E) return;
  if (u.mp < E.mp) { B.say('Not enough MP'); return; }
  u.mp -= E.mp; B.say(E.name, 90);
  await B.pose(u, 'cast', 24);
  B.echo = { id: id, t: 0 }; AE.Sfx && AE.Sfx.play('echo'); AE.game.flash = 10;
  await AE.wait(70);
  const ts = E.kind === 'heal' ? B.friends(u) : B.foes(u);
  ts.forEach(function (t) { B.addFx(E.fx, t); });
  AE.Sfx && AE.Sfx.play('spell_' + E.fx); await AE.wait(24);
  const lv = (act && act.lv) || 1;
  ts.forEach(function (t) {
    if (E.kind === 'heal') { B.healHp(t, AE.healAmount(u, E.power) * (1 + lv * 0.1)); (E.status || []).forEach(function (s) { AE.giveStatus(t, s); }); }
    else { const em = AE.elemMod(t, E.elem); let d = Math.floor(AE.magDamage(u, t, E.power * (1 + (lv - 1) * 0.08)) * (em === -1 ? 1 : em)); if (em === -1) B.healHp(t, d); else B.hurt(t, Math.max(1, d)); if (E.status) E.status.forEach(function (s) { if (Math.random() < 0.5) AE.giveStatus(t, s); }); }
  });
  await AE.wait(30); B.echo = null;
};
AE.Battle.prototype.doItem = async function (u, id, targets) {
  const B = this, I = AE.ITEMS[id]; if (!I) return;
  if (!AE.has(id)) { B.say('None left'); return; }
  AE.addItem(id, -1); B.say(I.name, 50);
  await B.pose(u, 'throw', 16);
  if (I.battle === 'escape') { if (B.form.noRun) B.say('Can\'t escape!'); else { B.say('Escaped!'); B.finish('run', 40); } return; }
  const U = I.use || {};
  targets.forEach(function (t) { B.addFx(U.damage ? (U.elem === 'ice' ? 'ice' : U.elem === 'bolt' ? 'bolt' : 'fire') : 'heal', t); });
  AE.Sfx && AE.Sfx.play(U.damage ? 'boom' : 'heal'); await AE.wait(20);
  targets.forEach(function (t) {
    if (U.revive) { if (t.hp <= 0) { t.hp = Math.max(1, Math.floor(t.maxhp * U.revive)); t.anim = 'ready'; t.atb = 0; t.waiting = false; B.pop(t, 'Revived', '#7f7'); } else B.pop(t, 'No effect', '#ccc'); return; }
    if (!AE.alive(t)) return;
    if (U.heal) { if (t.d && t.d.undead) B.hurt(t, U.heal); else B.healHp(t, U.heal); }
    if (U.mp) { const v = Math.min(t.maxmp - t.mp, U.mp); t.mp += v; B.pop(t, v + ' MP', '#8cf'); }
    if (U.cure) B.cure(t, U.cure);
    if (U.status) U.status.forEach(function (s) { AE.giveStatus(t, s); B.pop(t, AE.cap(s), AE.STATUS_INFO[s].col); });
    if (U.damage) { const em = AE.elemMod(t, U.elem); B.hurt(t, Math.max(1, Math.floor(AE.variance(U.damage) * Math.max(0, em)))); }
    if (U.boost && t.m) { t.m.bonus = t.m.bonus || {}; t.m.bonus[U.boost] = (t.m.bonus[U.boost] || 0) + 1; B.pop(t, U.boost.toUpperCase() + ' +1', '#ffd040'); }
  });
  await AE.wait(16);
};
AE.Battle.prototype.doSurge = async function (u, id, targets) {
  const B = this, L = AE.SURGES[id]; if (!L) return;
  u.surge = 0; u.m.surgeUses = (u.m.surgeUses || 0) + 1;
  B.say(L.name, 80); AE.game.flash = 8; AE.Sfx && AE.Sfx.play('surge');
  if (L.kind === 'phys') await B.step(u, true);
  await B.pose(u, L.anim || 'cast', 20);
  if (L.kind === 'heal' || L.kind === 'buff') {
    const ts = L.target === 'self' ? [u] : B.friends(u, L.revive);
    ts.forEach(function (t) { B.addFx('heal', t); }); await AE.wait(24);
    ts.forEach(function (t) {
      if (L.revive && t.hp <= 0) { t.hp = Math.floor(t.maxhp); t.anim = 'ready'; t.atb = 0; t.waiting = false; B.pop(t, 'Revived', '#7f7'); }
      if (!AE.alive(t)) return;
      if (L.power) B.healHp(t, L.full ? t.maxhp : t.maxhp * L.power);
      if (L.cure) B.cure(t, AE.ITEMS.remedy.use.cure);
      (L.status || []).forEach(function (s) { AE.giveStatus(t, s, { force: 1 }); });
    });
  } else {
    for (let h = 0; h < (L.hits || 1); h++) {
      const live = B.foes(u); if (!live.length) break;
      const ts = L.target === 'enemies' ? live : L.target === 'random' ? [AE.pick(live)] : [AE.alive(targets[0]) ? targets[0] : AE.pick(live)];
      ts.forEach(function (t) { B.addFx(L.kind === 'mag' ? 'holy' : 'slash', t); });
      AE.Sfx && AE.Sfx.play('hit'); await AE.wait(10);
      ts.forEach(function (t) {
        if (L.kind === 'gravity') { B.hurt(t, Math.max(1, Math.floor(t.hp * L.power))); return; }
        let power = L.power;
        if (L.missing) power *= 1 + (1 - u.hp / u.maxhp) * 2;
        if (L.kind === 'mag') B.hurt(t, Math.floor(AE.magDamage(u, t, power * 8) * Math.max(0, AE.elemMod(t, L.elem))));
        else B.hitOnce(u, t, power, { sure: 1, crit: L.crit, pierce: L.pierce, elem: L.elem, ranged: 1 });
        if (L.steal) B.stealFrom(u, t, true);
        (L.status || []).forEach(function (s) { if (s === 'vanish') AE.giveStatus(u, s); });
      });
      await AE.wait(6);
    }
    await AE.wait(14);
    if (L.kind === 'phys') await B.step(u, false);
  }
  u.anim = 'ready';
};
AE.Battle.prototype.doSkill = async function (u, id, targets) {
  const B = this, K = AE.SKILLS[id]; if (!K) return;
  if (K.kind === 'phys') {
    B.say(K.name, 50); await B.step(u, true); await B.pose(u, 'slash', 10);
    for (let h = 0; h < (K.hits || 1); h++) {
      targets.filter(AE.alive).forEach(function (t) { B.addFx(K.fx || 'claw', t); }); AE.Sfx && AE.Sfx.play('hit'); await AE.wait(10);
      targets.forEach(function (t) {
        const d = B.hitOnce(u, t, K.power || 1, { elem: K.elem, sure: K.sure, pierce: K.pierce });
        if (d > 0 && K.status) K.status.forEach(function (s) { if (Math.random() * 100 < (K.hit || 50) && AE.giveStatus(t, s)) B.pop(t, AE.cap(s), AE.STATUS_INFO[s].col); });
        if (d > 0 && K.drain) B.healHp(u, d);
      });
    }
    await AE.wait(12); await B.step(u, false); return;
  }
  if (K.kind === 'special') { await (AE.SPECIALS[id] || function () {})(B, u, targets, K); return; }
  await B.doSpell(u, id, targets, { free: !K.mp, skill: 1 });
};
AE.Battle.prototype.stealFrom = function (u, t, quiet) {
  const B = this, D = t.d || {};
  if (t.stolen || !(D.steal && D.steal.length)) { if (!quiet) B.say('Nothing to steal'); return false; }
  const base = 40 + (u.lv - t.lv) * 2 + u.lck / 3;
  for (let i = D.steal.length - 1; i >= 0; i--) {
    const it = D.steal[i];
    if (Math.random() * 100 < base * it[1]) { t.stolen = 1; AE.gainQuiet(it[0]); AE.S_.stats.steals++; B.say('Stole ' + AE.itemName(it[0]) + '!', 80); return true; }
  }
  if (!quiet) B.say('Couldn\'t steal anything');
  return false;
};
AE.Battle.prototype.doSteal = async function (u, t, mug) {
  const B = this; await B.step(u, true); await B.pose(u, mug ? 'slash' : 'thrust', 12);
  if (mug) B.hitOnce(u, t, 1, {});
  B.stealFrom(u, t); await AE.wait(20); await B.step(u, false);
};
AE.Battle.prototype.doSense = async function (u, t) { await this.pose(u, 'cast', 12); this.scan(t); await AE.wait(30); };
AE.Battle.prototype.doThrow = async function (u, id, t) {
  const B = this, W = AE.WEAPONS[id]; if (!W || !AE.has(id)) return; AE.addItem(id, -1);
  B.say('Throw: ' + W.name, 50); await B.pose(u, 'throw', 14); B.addFx('slash', t); await AE.wait(8);
  B.hurt(t, Math.max(1, Math.floor(AE.physDamage(u, t, 1, { ranged: 1 }) * (1 + W.atk / 30))));
  await AE.wait(14);
};

/* ================= Battle: enemy AI, the command menu, drawing ================= */
// enemy AI: D.ai = [[weight, action, condition?]...] or a function name in AE.AI. action: 'attack' | skill id | spell id
AE.AI = {};
AE.enemyAct = function (f, B) {
  const D = f.d, foes = B.foes(f), friends = B.friends(f);
  if (!foes.length) return null;
  if (f.status.confuse) return { kind: 'attack', targets: [AE.pick(Math.random() < 0.5 ? friends : foes)] };
  if (typeof D.ai === 'string' && AE.AI[D.ai]) { const a = AE.AI[D.ai](f, B); if (a) return a; }
  const list = (Array.isArray(D.ai) ? D.ai : [[1, 'attack']]).filter(function (r) { return !r[2] || AE.aiCond(r[2], f, B); });
  const tot = list.reduce(function (a, r) { return a + r[0]; }, 0); let r = Math.random() * tot, pick = list[0];
  for (let i = 0; i < list.length; i++) { r -= list[i][0]; if (r <= 0) { pick = list[i]; break; } }
  return AE.mkAct(f, B, pick[1]);
};
AE.aiCond = function (c, f, B) {
  if (c === 'hurt') return f.hp < f.maxhp * 0.5;
  if (c === 'low') return f.hp < f.maxhp * 0.25;
  if (c === 'alone') return B.friends(f).length === 1;
  if (c === 'ally_hurt') return B.friends(f).some(function (x) { return x.hp < x.maxhp * 0.5; });
  if (c === 'mp') return f.mp > 20;
  if (c.indexOf('turn%') === 0) return (f.ai.n % +c.slice(5)) === 0;
  if (c.indexOf('phase') === 0) return (f.ai.vars.phase || 0) === +c.slice(5);
  return true;
};
AE.mkAct = function (f, B, what) {
  f.ai.n++;
  const foes = B.foes(f), friends = B.friends(f);
  if (what === 'attack') return { kind: 'attack', targets: [AE.weakest(foes, f)] };
  if (what === 'wait') return { kind: 'wait', targets: [f], need: false };
  const K = AE.SKILLS[what] || AE.SPELLS[what]; if (!K) return { kind: 'attack', targets: [AE.pick(foes)] };
  const heal = K.kind === 'heal' || K.kind === 'buff' || K.kind === 'cure';
  let t = heal ? (K.target === 'self' ? [f] : K.all || K.target === 'all' ? friends : [friends.slice().sort(function (a, b) { return a.hp / a.maxhp - b.hp / b.maxhp; })[0]]) : (K.all || K.target === 'all' ? foes : [AE.pick(foes)]);
  return { kind: 'skill', id: what, targets: t, side: heal ? 'friends' : 'foes', all: K.all };
};
AE.weakest = function (foes, f) { return Math.random() < 0.3 ? foes.slice().sort(function (a, b) { return a.hp - b.hp; })[0] : AE.pick(foes); };

// ---------- the command menu ----------
AE.BattleMenu = function (f, B) {
  this.f = f; this.B = B; this.depth = 0; this.sub = null; this.target = null;
  this.cmds = this.build(); this.list = new AE.List(this.cmds, { rows: 6 });
  if (AE.S_.cfg.cursor === 'memory' && f.m.lastCmd !== undefined) this.list.sel = Math.min(f.m.lastCmd, this.cmds.length - 1);
};
AE.BattleMenu.prototype.build = function () {
  const f = this.f, a = f.abil, out = [];
  out.push(f.surge >= 1 ? { k: 'surge', name: 'Surge' } : { k: 'attack', name: 'Attack' });
  a.command.forEach(function (c) {
    const D = AE.PRISMS[c.id], mast = D.up && AE.prismMaster(AE.S_.prisms[c.pid]);
    if (D.cmd === 'steal') out.push({ k: mast ? 'mug' : 'steal', name: mast ? 'Mug' : 'Steal' });
    else if (D.cmd === 'sense') out.push({ k: 'sense', name: 'Sense' });
    else if (D.cmd === 'throw') out.push({ k: 'throw', name: 'Throw' });
    else if (D.cmd === 'morph') out.push({ k: 'morph', name: 'Morph' });
    else if (D.cmd === 'deathblow') out.push({ k: 'deathblow', name: 'Deathblow' });
    else if (D.cmd === 'mimic') out.push({ k: 'mimic', name: 'Mimic' });
  });
  if (a.magic.length) out.push({ k: 'magic', name: 'Magic', off: f.status.silence });
  if (a.echo.length) out.push({ k: 'echo', name: 'Echo', off: f.status.silence });
  out.push({ k: 'item', name: 'Item' });
  out.push({ k: 'defend', name: 'Defend' });
  out.push({ k: 'row', name: 'Change Row' });
  if (!this.B.form.noRun) out.push({ k: 'run', name: 'Run' });
  return out;
};
AE.BattleMenu.prototype.spells = function () {
  const f = this.f, out = [], seen = {}, sup = f.abil.support;
  f.abil.magic.forEach(function (m) {
    const D = AE.PRISMS[m.id];
    const linkedAll = sup.some(function (s) { return s.id === 'all' && s.slot === m.slot && (s.i ^ 1) === m.i; });
    D.spells.slice(0, Math.max(1, m.lv)).forEach(function (sp) {
      if (seen[sp]) { if (linkedAll) seen[sp].all = 1; return; }
      const o = { id: sp, name: AE.SPELLS[sp].name, mp: AE.SPELLS[sp].mp, all: linkedAll ? 1 : 0 }; seen[sp] = o; out.push(o);
    });
  });
  return out;
};
AE.BattleMenu.prototype.update = function (I, B) {
  const f = this.f;
  if (!AE.canAct(f) || f.status.confuse || f.status.berserk) { B.menu = null; return; }
  if (I.pressed.prev || I.pressed.next) {           // switch to another ready character
    if (B.ready.length > 1 && this.depth === 0) { B.ready.push(B.ready.shift()); B.menu = null; AE.Sfx && AE.Sfx.play('move'); return; }
  }
  if (this.target) { this.updateTarget(I, B); return; }
  if (this.sub) { this.updateSub(I, B); return; }
  this.list.move(I);
  if (I.pressed.back) { if (B.ready.length > 1) { B.ready.push(B.ready.shift()); B.menu = null; } return; }
  if (!I.pressed.ok) return;
  const c = this.cmds[this.list.sel]; if (c.off) { AE.Sfx && AE.Sfx.play('buzz'); return; }
  f.m.lastCmd = this.list.sel; AE.Sfx && AE.Sfx.play('ok');
  const self = this;
  switch (c.k) {
    case 'attack': case 'steal': case 'mug': case 'sense': case 'morph': case 'deathblow':
      this.pickTarget({ side: 'foes' }, function (ts) { return { kind: c.k === 'mug' ? 'steal' : c.k, mug: c.k === 'mug', targets: ts }; }); break;
    case 'magic': this.open('magic', this.spells()); break;
    case 'echo': this.open('echo', f.abil.echo.map(function (e) { const E = AE.ECHOES[AE.PRISMS[e.id].echo]; return { id: AE.PRISMS[e.id].echo, name: E.name, mp: E.mp, lv: e.lv }; })); break;
    case 'item': this.open('item', Object.keys(AE.S_.inv).filter(function (k) { const it = AE.ITEMS[k]; return it && !it.k && (it.use || it.battle); }).map(function (k) { return { id: k, name: AE.ITEMS[k].name, n: AE.S_.inv[k] }; })); break;
    case 'throw': this.open('throw', Object.keys(AE.S_.inv).filter(function (k) { return AE.WEAPONS[k]; }).map(function (k) { return { id: k, name: AE.WEAPONS[k].name, n: AE.S_.inv[k] }; })); break;
    case 'surge': this.open('surge', AE.CHARS[f.id].surge.filter(function (s) { return AE.SURGES[s].lv <= (f.m.surgeLv || 1); }).map(function (s) { return { id: s, name: AE.SURGES[s].name }; })); break;
    case 'mimic': this.open('mimic', Object.keys(AE.S_.flags).filter(function (k) { return k.indexOf('mimic:') === 0; }).map(function (k) { const id = k.slice(6); return { id: id, name: AE.SKILLS[id].name, mp: AE.SKILLS[id].mp || 0 }; })); break;
    case 'defend': B.commit({ user: f, kind: 'defend' }); break;
    case 'row': B.commit({ user: f, kind: 'row' }); break;
    case 'run': B.commit({ user: f, kind: 'run', need: false, targets: [] }); break;
  }
};
AE.BattleMenu.prototype.open = function (kind, items) {
  if (!items.length) { AE.Sfx && AE.Sfx.play('buzz'); return; }
  this.sub = { kind: kind, items: items, list: new AE.List(items, { cols: 2, rows: 4 }) }; this.depth = 1;
};
AE.BattleMenu.prototype.updateSub = function (I, B) {
  const s = this.sub, f = this.f; s.list.move(I);
  if (I.pressed.back) { this.sub = null; this.depth = 0; AE.Sfx && AE.Sfx.play('back'); return; }
  if (!I.pressed.ok) return;
  const it = s.items[s.list.sel];
  if ((s.kind === 'magic' || s.kind === 'echo' || s.kind === 'mimic') && f.mp < it.mp) { AE.Sfx && AE.Sfx.play('buzz'); return; }
  AE.Sfx && AE.Sfx.play('ok');
  if (s.kind === 'magic' || s.kind === 'mimic') {
    const S = AE.SPELLS[it.id] || AE.SKILLS[it.id], friendly = ['heal', 'buff', 'cure', 'revive'].indexOf(S.kind) >= 0;
    this.pickTarget({ side: friendly ? 'friends' : 'foes', canAll: it.all || S.all, forceAll: S.all, ko: S.kind === 'revive' }, function (ts, all) { return { kind: s.kind === 'mimic' ? 'skill' : 'magic', id: it.id, targets: ts, all: all }; });
  } else if (s.kind === 'echo') {
    B.commit({ user: f, kind: 'echo', id: it.id, lv: it.lv, targets: B.foes(f), all: 1 });
  } else if (s.kind === 'item') {
    const D = AE.ITEMS[it.id], tg = D.target || 'ally';
    if (D.battle === 'escape' || tg === 'none') { B.commit({ user: f, kind: 'item', id: it.id, targets: [f], need: false }); return; }
    this.pickTarget({ side: tg.indexOf('enem') === 0 ? 'foes' : 'friends', forceAll: tg === 'allies' || tg === 'enemies', ko: D.ko }, function (ts) { return { kind: 'item', id: it.id, targets: ts }; });
  } else if (s.kind === 'throw') {
    this.pickTarget({ side: 'foes' }, function (ts) { return { kind: 'throw', id: it.id, targets: ts }; });
  } else if (s.kind === 'surge') {
    const L = AE.SURGES[it.id];
    if (L.target === 'enemy') this.pickTarget({ side: 'foes' }, function (ts) { return { kind: 'surge', id: it.id, targets: ts }; });
    else B.commit({ user: f, kind: 'surge', id: it.id, targets: L.target === 'self' ? [f] : L.kind === 'heal' || L.kind === 'buff' ? B.friends(f, 1) : B.foes(f), need: false });
  }
};
AE.BattleMenu.prototype.pickTarget = function (o, make) {
  const B = this.B, f = this.f;
  const pool = (o.side === 'friends' ? B.party.filter(function (x) { return o.ko ? !x.gone : AE.alive(x); }) : B.enemies.filter(AE.alive));
  if (!pool.length) return;
  this.target = { o: o, make: make, side: o.side, i: 0, all: !!o.forceAll };
  if (o.side === 'friends') { const me = pool.indexOf(f); this.target.i = me >= 0 ? me : 0; if (o.ko) { const d = pool.findIndex(function (x) { return x.hp <= 0; }); if (d >= 0) this.target.i = d; } }
  this.depth = 2;
};
AE.BattleMenu.prototype.updateTarget = function (I, B) {
  const T = this.target, f = this.f;
  const pool = function (side) { return side === 'friends' ? B.party.filter(function (x) { return T.o.ko ? !x.gone : AE.alive(x); }) : B.enemies.filter(AE.alive); };
  let P = pool(T.side);
  if (!P.length) { this.target = null; this.depth = this.sub ? 1 : 0; return; }
  if (T.i >= P.length) T.i = 0;
  if (!T.o.forceAll) {
    if (I.rep.up) { T.i = (T.i + P.length - 1) % P.length; AE.Sfx && AE.Sfx.play('move'); }
    if (I.rep.down) { T.i = (T.i + 1) % P.length; AE.Sfx && AE.Sfx.play('move'); }
    // left/right: switch sides, or to 'all' when the spell can spread
    if (I.pressed.left || I.pressed.right) {
      if (T.o.canAll && !T.all) T.all = true; else if (T.all && T.o.canAll) T.all = false;
      else { T.side = T.side === 'friends' ? 'foes' : 'friends'; T.i = 0; }
      AE.Sfx && AE.Sfx.play('move');
    }
  }
  if (I.pressed.back) { this.target = null; this.depth = this.sub ? 1 : 0; AE.Sfx && AE.Sfx.play('back'); return; }
  if (I.pressed.ok) {
    P = pool(T.side); const ts = T.all ? P : [P[T.i]];
    const act = T.make(ts, T.all); act.user = f; act.side = T.side;
    AE.Sfx && AE.Sfx.play('ok'); B.commit(act);
  }
};
AE.BattleMenu.prototype.targets = function () {
  const T = this.target; if (!T) return []; const B = this.B;
  const P = T.side === 'friends' ? B.party.filter(function (x) { return T.o.ko ? !x.gone : AE.alive(x); }) : B.enemies.filter(AE.alive);
  return T.all ? P : [P[T.i]].filter(Boolean);
};

/* ================= Battle: drawing (backdrops, fighters, effects, windows) ================= */
AE.FXMAP = { slash: 'SpriteSheetSlash02', claw: 'Attack_Claw', shot: 'Attack_Cut', fire: 'Elemental_Flam', ice: 'Elemental_IceB', bolt: 'Elemental_Thunder',
  water: 'Elemental_Water', wind: 'Smoke_SmokeCircular', quake: 'Elemental_RockSpike', heal: 'Magic_Spirit', holy: 'Magic_CircleWhite', dark: 'Magic_SpiritDouble',
  poison: 'Elemental_Plant', shield: 'Magic_ShieldBlue', time: 'Magic_CircleSpark', life: 'Magic_Boost', spark: 'Magic_Spark', boom: 'Elemental_Explosion', bite: 'Attack_ClawDouble', cut: 'Attack_CutX' };
AE.Battle.prototype.addFx = function (kind, t) {
  const key = AE.FXMAP[kind] || kind, M = AE.FXMETA && AE.FXMETA[key];
  const n = M ? M.n : 6;
  this.fx.push({ key: key, x: t.x, y: t.y - (t.side === 'enemy' ? AE.enemyH(t) / 2 : 16), t: 0, life: n * 4 + 2, n: n, tint: kind === 'dark' ? 'hue-rotate(200deg) brightness(.7)' : kind === 'poison' ? 'hue-rotate(60deg)' : null });
};
// ---------- enemy sprites ----------
AE.enemyArt = function (f) {
  const A = f.d.art || {};
  if (A.mon) return { im: AE.IMG['mon_' + A.mon], fw: 16, fh: 16, k: A.k || 2, mon: 1 };
  if (A.boss) return { im: AE.IMG['boss_' + A.boss + '_' + (A.anim || 'Idle')], fw: A.fw, fh: A.fh, n: A.n, k: A.k || 2 };
  if (A.cast) return { cast: A.cast, k: A.k || 1.25 };
  return { none: 1 };
};
AE.enemyH = function (f) { const a = AE.enemyArt(f); if (a.mon) return 16 * a.k; if (a.cast) return 32 * a.k; return (a.fh || 32) * a.k; };
AE.drawEnemy = function (ctx, f, B, sel) {
  if (f.gone) return;
  const A = AE.enemyArt(f), D = f.d.art || {};
  let X = f.x + (f.shake ? (f.shake % 2 ? 2 : -2) : 0), Y = f.y;
  let alpha = 1, filter = [];
  if (f.dying) { alpha = f.dying / 30; filter.push('sepia(1) hue-rotate(-50deg) saturate(4)'); if (--f.dying <= 0) f.gone = true; }
  if (D.hue) filter.push('hue-rotate(' + D.hue + 'deg)'); if (D.sat) filter.push('saturate(' + D.sat + ')'); if (D.bright) filter.push('brightness(' + D.bright + ')');
  if (f.flash && f.flash % 4 < 2) filter.push('brightness(2.5)');
  if (f.status.stone) filter.push('grayscale(1)');
  if (f.status.frog) filter.push('hue-rotate(90deg)');
  const fs = filter.join(' ') || undefined;
  ctx.fillStyle = 'rgba(0,0,0,.25)'; const sw = A.mon ? 10 * A.k / 2 : 20; ctx.fillRect(Math.round(X - sw / 2), Math.round(Y - 2), Math.round(sw), 4);
  if (A.mon && A.im) {
    const fr = Math.floor(f.t * 6) % 4;
    AE.blit(ctx, A.im, 3 * 16, fr * 16, 16, 16, X - 8 * A.k, Y - 16 * A.k + (f.status.float ? -6 : 0), 16 * A.k, 16 * A.k, { alpha: alpha, filter: fs });
  } else if (A.im) {
    const n = A.n || Math.max(1, Math.floor(A.im.width / A.fw)), fr = Math.floor(f.t * 7) % n;
    AE.blit(ctx, A.im, fr * A.fw, 0, A.fw, A.fh, X - A.fw * A.k / 2, Y - A.fh * A.k, A.fw * A.k, A.fh * A.k, { alpha: alpha, filter: fs, flip: !D.noflip });
  } else if (A.cast) {
    const anim = f.flash > 6 ? 'b_slash' : 'b_ready';
    AE.actor(ctx, A.cast, anim, null, Math.floor(f.t * 6), X, Y, A.k, { flip: true, alpha: alpha, filter: fs });
  } else { ctx.fillStyle = '#a44'; ctx.fillRect(X - 10, Y - 24, 20, 24); }
  if (sel) AE.cursor(ctx, X - (A.mon ? 8 * A.k : (A.fw || 24) * A.k / 2) - 12, Y - AE.enemyH(f) / 2 - 3, true);
};
AE.drawPartyMember = function (ctx, f, B, sel) {
  let anim = f.anim || 'ready';
  if (f.animT > 0 && --f.animT <= 0 && anim === 'hurt') anim = f.anim = 'ready';
  if (f.hp <= 0) anim = 'dead';
  else if (anim === 'ready' && f.hp < f.maxhp / 4) anim = 'weak';
  const fr = anim === 'win' ? Math.min(3, Math.floor(f.t * 6)) : Math.floor(f.t * (anim === 'ready' ? 5 : 10));
  let filter = [];
  if (f.flash && f.flash % 4 < 2) filter.push('brightness(2.2)');
  if (f.status.stone) filter.push('grayscale(1) brightness(.9)');
  if (f.status.poison) filter.push('hue-rotate(40deg)');
  if (f.status.frog) filter.push('hue-rotate(90deg) saturate(2)');
  const X = f.x + (f.shake ? (f.shake % 2 ? 2 : -2) : 0), Y = f.y;
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(Math.round(X - 7), Math.round(Y - 2), 14, 4);
  const al = f.status.vanish ? 0.35 : 1;
  if (!AE.actor(ctx, f.id, 'b_' + anim, null, fr, X, Y, 1, { filter: filter.join(' ') || undefined, alpha: al, flip: !!f.flip })) { ctx.fillStyle = '#48c'; ctx.fillRect(X - 6, Y - 26, 12, 26); }
  if (f.defending) { ctx.globalAlpha = 0.5; ctx.fillStyle = '#8cf'; ctx.fillRect(X - 14, Y - 30, 2, 26); ctx.globalAlpha = 1; }
  if (sel) AE.cursor(ctx, X - 26, Y - 22, true);
  if (B.menu && B.menu.f === f && !B.menu.target) { ctx.fillStyle = '#ffe080'; const k = Math.floor(AE.game.frame / 10) % 2; ctx.fillRect(X - 2, Y - 40 - k, 4, 2); ctx.fillRect(X - 1, Y - 38 - k, 2, 2); }
};
// ---------- backdrops: sky/ceiling gradient + ground band textured from the area's floor ----------
AE.BGS = {
  grass: { sky: ['#5a8ad8', '#a8d0f0'], ground: ['floor', 11, 12], far: '#4a7a40' },
  forest: { sky: ['#1a3a2a', '#3a6a40'], ground: ['floor', 11, 12], far: '#20402a', trees: 1 },
  plains: { sky: ['#6aa0e8', '#c8e4f8'], ground: ['floor', 12, 8], far: '#7a9a50' },
  desert: { sky: ['#e8a860', '#f8e0a8'], ground: ['floor', 1, 1], far: '#c89860' },
  snow: { sky: ['#8aa8c8', '#e0ecf8'], ground: ['floor', 1, 15], far: '#a0b8d0' },
  cave: { sky: ['#0a0808', '#2a2018'], ground: ['infloor', 12, 13], far: '#1a1410', rocks: 1 },
  ice: { sky: ['#102030', '#305070'], ground: ['water', 13, 1], far: '#204060', rocks: 1 },
  lava: { sky: ['#200806', '#6a1a08'], ground: ['infloor', 12, 13], far: '#401008', rocks: 1, glow: 1 },
  city: { sky: ['#1a1a2a', '#4a4a6a'], ground: ['infloor', 1, 13], far: '#2a2a3a', city: 1 },
  slums: { sky: ['#2a2018', '#5a4838'], ground: ['infloor', 12, 13], far: '#3a3028', city: 1 },
  factory: { sky: ['#101418', '#30383e'], ground: 'fills:metal', far: '#202830', pipes: 1 },
  reactor: { sky: ['#06120e', '#1a4a38'], ground: 'fills:grate', far: '#0a2a20', pipes: 1, glow: 2 },
  sea: { sky: ['#4a7ad0', '#a0c8f0'], ground: ['water', 1, 7], far: '#3a6ab0' },
  beach: { sky: ['#5a9ae0', '#b8dcf8'], ground: ['floor', 1, 1], far: '#4a8ac8' },
  temple: { sky: ['#1a1830', '#3a3860'], ground: ['infloor', 12, 1], far: '#2a2840', pillars: 1 },
  ruins: { sky: ['#3a3a30', '#6a6a50'], ground: ['infloor', 12, 7], far: '#4a4a38', pillars: 1 },
  swamp: { sky: ['#1a2a1a', '#3a5030'], ground: ['water', 13, 7], far: '#2a3a20', trees: 1 },
  sky: { sky: ['#2a4a9a', '#9ac0f0'], ground: 'fills:marble', far: '#7a9ad0', clouds: 1 },
  citadel: { sky: ['#100820', '#3a1850'], ground: 'fills:crystal', far: '#2a1040', pillars: 1, glow: 3 },
  underwater: { sky: ['#06203a', '#185078'], ground: ['floor', 1, 1], far: '#0a3050', bubbles: 1 },
  ship: { sky: ['#5a8ad8', '#b0d8f8'], ground: ['water', 1, 13], far: '#3a6ab0' },
};
AE.drawBattleBg = function (ctx, kind, t) {
  const D = AE.BGS[kind] || AE.BGS.grass, H = 148, hz = 70;
  const g = ctx.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, D.sky[0]); g.addColorStop(1, D.sky[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, AE.W, hz);
  if (D.clouds) { ctx.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 6; i++) { const x = (i * 61 + t * 0.2) % (AE.W + 60) - 30; ctx.fillRect(x, 10 + i * 9 % 40, 40, 6); ctx.fillRect(x + 8, 6 + i * 9 % 40, 22, 4); } }
  // far band (hills, city skyline, cave wall)
  ctx.fillStyle = D.far;
  for (let x = 0; x < AE.W; x += 8) { const h = D.city ? (((x * 37) % 23) + 8) : D.rocks ? (((x * 13) % 9) + 6) : (Math.sin(x * 0.05) * 5 + 8); ctx.fillRect(x, hz - h, 8, h + 1); }
  if (D.city) { ctx.fillStyle = 'rgba(255,220,120,.5)'; for (let x = 4; x < AE.W; x += 11) if ((x * 7) % 5 < 2) ctx.fillRect(x, hz - 6 - (x % 9), 2, 2); }
  // ground: the area's floor texture, darker towards the horizon
  let im, sx, sy;
  if (typeof D.ground === 'string') { const nm = D.ground.split(':')[1]; im = AE.IMG.fills; sx = (AE.FILL_ORDER || []).indexOf(nm) * 16; sy = 0; }
  else { im = AE.IMG[D.ground[0]]; sx = D.ground[1] * 16; sy = D.ground[2] * 16; }
  if (im) for (let y = hz; y < H; y += 16) for (let x = 0; x < AE.W; x += 16) ctx.drawImage(im, sx, sy, 16, 16, x, y, 16, 16);
  const sh = ctx.createLinearGradient(0, hz, 0, H); sh.addColorStop(0, 'rgba(0,0,0,.55)'); sh.addColorStop(0.35, 'rgba(0,0,0,.15)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = sh; ctx.fillRect(0, hz, AE.W, H - hz);
  if (D.trees && AE.IMG.nature) for (let i = 0; i < 9; i++) ctx.drawImage(AE.IMG.nature, (i % 2 ? 2 : 0) * 16, 0, 32, 32, i * 30 - 6, hz - 26 - (i % 3) * 3, 32, 32);
  if (D.pillars) { ctx.fillStyle = 'rgba(0,0,0,.35)'; for (let x = 12; x < AE.W; x += 58) { ctx.fillRect(x, 0, 14, hz + 4); ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(x, 0, 3, hz + 4); ctx.fillStyle = 'rgba(0,0,0,.35)'; } }
  if (D.pipes) { ctx.fillStyle = 'rgba(80,100,110,.8)'; ctx.fillRect(0, 18, AE.W, 5); ctx.fillRect(0, 34, AE.W, 3); for (let x = 20; x < AE.W; x += 50) ctx.fillRect(x, 0, 4, hz); }
  if (D.glow) { ctx.globalAlpha = 0.15 + Math.sin(t * 0.05) * 0.05; ctx.fillStyle = D.glow === 1 ? '#ff6020' : D.glow === 2 ? '#40ffb0' : '#c060ff'; ctx.fillRect(0, 0, AE.W, H); ctx.globalAlpha = 1; }
  if (D.bubbles) { ctx.fillStyle = 'rgba(200,240,255,.5)'; for (let i = 0; i < 14; i++) { const y = H - ((t * 0.6 + i * 37) % H); ctx.fillRect((i * 53) % AE.W, y, 2, 2); } }
};
// ---------- the scene ----------
AE.Battle.prototype.draw = function (ctx) {
  const B = this, M = this.menu, sel = M ? M.targets() : [];
  AE.drawBattleBg(ctx, this.form.bg || 'grass', this.t);
  // the Echo: a huge form fills the field
  this.enemies.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (f) { AE.drawEnemy(ctx, f, B, sel.indexOf(f) >= 0); });
  this.party.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (f) { AE.drawPartyMember(ctx, f, B, sel.indexOf(f) >= 0); });
  if (this.echo) this.drawEcho(ctx);
  this.fx.forEach(function (e) {
    const im = AE.IMG['fx_' + e.key], M2 = AE.FXMETA && AE.FXMETA[e.key]; if (!im || !M2) return;
    const fr = Math.min(M2.n - 1, Math.floor(e.t / 4)), k = 2;
    AE.blit(ctx, im, fr * M2.fw, 0, M2.fw, im.height, e.x - M2.fw * k / 2, e.y - im.height * k / 2, M2.fw * k, im.height * k, { filter: e.tint || undefined });
  });
  this.pops.forEach(function (p) {
    const y = p.y - Math.min(14, p.t) + (p.t < 14 ? 0 : 0), a = p.t > 45 ? (60 - p.t) / 15 : 1;
    ctx.globalAlpha = a; AE.text(ctx, p.text, p.x, y, p.col, { align: 'center' }); ctx.globalAlpha = 1;
  });
  if (this.banner) { const w = AE.textWidth(this.banner.text) + 20; AE.window(ctx, (AE.W - w) / 2, 4, w, 18); AE.text(ctx, this.banner.text, AE.W / 2, 9, '#fff', { align: 'center' }); }
  this.drawHud(ctx);
  if (this.phase === 'win' && this.endT > 30) {
    const pages = this.endPages(), pg = pages[Math.min(this.endPage, pages.length - 1)];
    AE.window(ctx, 40, 30, 176, 16 + pg.length * 12); pg.forEach(function (l, i) { AE.text(ctx, l, 52, 38 + i * 12, '#fff'); });
  }
  if (this.phase === 'lose' && !this.o.canLose) {
    const a = Math.min(1, this.endT / 90); ctx.globalAlpha = a; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, AE.W, AE.H); ctx.globalAlpha = 1;
    if (this.endT > 60) AE.text(ctx, 'The party has fallen...', AE.W / 2, 100, '#e0d0d0', { align: 'center' });
  }
  if (this.phase === 'intro') { ctx.fillStyle = '#000'; const k = 1 - this.t / 30; ctx.fillRect(0, 0, AE.W, AE.H * k / 2); ctx.fillRect(0, AE.H - AE.H * k / 2, AE.W, AE.H * k / 2); }
  if (this.runHold > 10) AE.text(ctx, 'Running...', 200, 50, '#fff', { align: 'center' });
};
AE.Battle.prototype.drawEcho = function (ctx) {
  const E = AE.ECHOES[this.echo.id], t = ++this.echo.t, a = Math.min(1, t / 20);
  ctx.fillStyle = 'rgba(0,0,0,' + (0.5 * a) + ')'; ctx.fillRect(0, 0, AE.W, 150);
  const im = AE.IMG['boss_' + E.art + '_Idle'] || AE.IMG['boss_' + E.art + '_Preview'];
  if (im) {
    const h = im.height, fw = AE.BOSSFW && AE.BOSSFW[E.art] || h, k = Math.min(3, 100 / h), fr = Math.floor(t / 6) % Math.max(1, Math.floor(im.width / fw));
    AE.blit(ctx, im, fr * fw, 0, fw, h, 128 - fw * k / 2, 130 - h * k - Math.sin(t / 10) * 4, fw * k, h * k, { alpha: a, filter: 'drop-shadow(0 0 6px #fff)' });
  }
  AE.text(ctx, E.name, 128, 20, '#ffe080', { align: 'center' });
};
AE.Battle.prototype.drawHud = function (ctx) {
  const B = this, y0 = 150;
  AE.window(ctx, 0, y0, 92, AE.H - y0);
  const names = {}; this.enemies.filter(AE.alive).forEach(function (e) { names[e.name] = (names[e.name] || 0) + 1; });
  Object.keys(names).slice(0, 5).forEach(function (n, i) { AE.text(ctx, n + (names[n] > 1 ? ' x' + names[n] : ''), 7, y0 + 7 + i * 12, '#fff'); });
  AE.window(ctx, 92, y0, AE.W - 92, AE.H - y0);
  this.party.forEach(function (f, i) {
    const y = y0 + 8 + i * 20, ready = B.ready.indexOf(f) >= 0, active = B.menu && B.menu.f === f;
    const col = f.hp <= 0 ? '#e05050' : f.hp < f.maxhp / 4 ? '#ffd040' : '#fff';
    AE.text(ctx, f.name, 100, y, active ? '#ffe080' : col);
    AE.text(ctx, f.hp + '/' + f.maxhp, 192, y, col, { align: 'right' });
    AE.text(ctx, String(f.mp), 214, y, '#9cf', { align: 'right' });
    AE.bar(ctx, 218, y + 1, 32, 3, f.atb, ready || f.waiting ? '#ffe060' : '#e0e0e0');
    AE.bar(ctx, 218, y + 6, 32, 2, f.surge || 0, (f.surge || 0) >= 1 ? (AE.game.frame % 20 < 10 ? '#ff60c0' : '#ffa0e0') : '#c04090');
    // status pips
    let px = 100; Object.keys(f.status).slice(0, 6).forEach(function (s) { const I = AE.STATUS_INFO[s]; if (!I) return; ctx.fillStyle = I.col; ctx.fillRect(px, y + 10, 4, 2); px += 5; });
  });
  if (this.menu) this.drawMenu(ctx);
};
AE.Battle.prototype.drawMenu = function (ctx) {
  const M = this.menu, f = M.f;
  // the command list takes the place of the enemy names (bottom left), with the character's name on top
  const n = M.cmds.length, rows = 5; M.list.rows = rows;
  AE.window(ctx, 0, 150, 92, AE.H - 150);
  AE.window(ctx, 0, 136, 60, 16); AE.text(ctx, f.name, 8, 140, '#ffe080');
  for (let i = 0; i < Math.min(rows, n - M.list.top); i++) {
    const c = M.cmds[i + M.list.top];
    AE.text(ctx, c.name, 22, 157 + i * 12, c.off ? '#808090' : c.k === 'surge' ? '#ff9ad0' : '#fff');
    if (i + M.list.top === M.list.sel && !M.sub && !M.target) AE.cursor(ctx, 6, 157 + i * 12);
  }
  if (M.list.top > 0) AE.text(ctx, '^', 84, 152, '#aaa'); if (M.list.top + rows < n) AE.text(ctx, 'v', 84, 212, '#aaa');
  if (M.sub) {
    const s = M.sub, L = s.list, rows = 4, x = 4, w = AE.W - 8, yy = 150, hh = AE.H - 150;
    AE.window(ctx, x, yy, w, hh);
    for (let r = 0; r < rows; r++) for (let c = 0; c < 2; c++) {
      const i = (L.top + r) * 2 + c; if (i >= s.items.length) continue;
      const it = s.items[i], X = x + 18 + c * 122, Y = yy + 7 + r * 12;
      const dim = (it.mp !== undefined && f.mp < it.mp);
      AE.text(ctx, it.name + (it.all ? '*' : ''), X, Y, dim ? '#808090' : '#fff');
      if (it.mp !== undefined) AE.text(ctx, it.mp + '', X + 100, Y, '#9cf', { align: 'right' });
      if (it.n !== undefined) AE.text(ctx, ':' + it.n, X + 100, Y, '#fff', { align: 'right' });
      if (i === L.sel && !M.target) AE.cursor(ctx, X - 14, Y);
    }
  }
};

/* ================= Arcana: the card game =================
   Five cards a side on a 3 x 3 board. Each card has four ranks (top, right, bottom, left; 1-9 and A = 10).
   Place a card next to an opponent's: where your touching rank is higher, their card flips to your colour.
   Rules some players use: Same (two or more touching sides equal -> those flip, and chain), Elemental (board squares
   with an element: matching cards +1, others -1). The winner takes one card from the loser's hand. */
AE.CARDS = {};
AE.CARD = function (id, name, lv, n, art, elem) { AE.CARDS[id] = { name: name, lv: lv, n: n, art: art, elem: elem || null }; };
(function () {
  const C = AE.CARD, m = function (k, o) { return Object.assign({ mon: k }, o || {}); }, c = function (k, o) { return Object.assign({ cast: k }, o || {}); }, b = function (k, o) { return Object.assign({ boss: k }, o || {}); };
  // level 1
  C('c_rat', 'Pipe Rat', 1, [1, 4, 1, 5], m('Mouse'));
  C('c_slime', 'Flow Slime', 1, [5, 1, 1, 3], m('Slime2', { hue: 110 }), 'water');
  C('c_drone', 'Sentry Drone', 1, [1, 3, 3, 5], m('Eye', { hue: 170 }), 'bolt');
  C('c_trooper', 'Aurex Trooper', 1, [6, 1, 1, 2], c('trooper'));
  C('c_hawk', 'Girder Hawk', 1, [2, 3, 1, 5], m('Owl2'), 'wind');
  C('c_crawler', 'Coil Crawler', 1, [2, 1, 4, 4], m('SpiderYellow'), 'bolt');
  C('c_bat', 'Cave Bat', 1, [1, 5, 4, 1], m('BlueBat'));
  C('c_larva', 'Bloat Larva', 1, [3, 1, 3, 5], m('Larva2'), 'poison');
  // level 2
  C('c_sumprat', 'Sump Rat', 2, [6, 1, 4, 3], m('MouseBlack'));
  C('c_sludge', 'Sludge', 2, [2, 3, 1, 7], m('Slime3', { hue: 40 }), 'poison');
  C('c_eel', 'Drain Eel', 2, [2, 1, 6, 6], m('Snake2', { hue: 190 }), 'water');
  C('c_rotcap', 'Rotcap', 2, [5, 4, 3, 3], m('Mushroom2'));
  C('c_wisp', 'Spark Wisp', 2, [6, 2, 2, 5], m('Spirit', { hue: 60 }), 'bolt');
  C('c_gunner', 'Aurex Gunner', 2, [3, 6, 2, 4], c('gunner'));
  // level 3
  C('c_rivet', 'Rivet Drone', 3, [5, 3, 1, 7], m('Eye2', { hue: 30 }));
  C('c_imp', 'Scaffold Imp', 3, [6, 6, 3, 2], m('KappaRed'));
  C('c_heavy', 'Heavy Trooper', 3, [3, 5, 7, 2], c('officer', { hue: 200 }));
  C('c_hound', 'Guard Hound', 3, [7, 3, 1, 6], m('Beast'));
  C('c_drake', 'Arena Drake', 3, [5, 2, 6, 4], m('Lizard2'), 'fire');
  // level 4
  C('c_specimen', 'Lab Specimen', 4, [7, 5, 1, 7], m('Beast2', { hue: 260 }));
  C('c_failed', 'Failed Vessel', 4, [4, 7, 5, 4], m('Spirit2', { hue: 200 }), 'dark');
  C('c_arcanist', 'Aurex Arcanist', 4, [2, 6, 7, 5], c('tech'), 'fire');
  C('c_ogre', 'Ogre Twin', 4, [7, 4, 6, 3], m('Cyclope2'), 'earth');
  C('c_golem', 'Scrap Golem', 4, [6, 2, 7, 5], m('Cyclope', { sat: 0.3 }), 'earth');
  // level 5 (bosses of Act I)
  C('c_bulwark', 'Bulwark', 5, [7, 6, 2, 7], b('GiantBlueSamurai', { fw: 48, fh: 48, sat: 0.25 }), 'bolt');
  C('c_rustback', 'Rustback', 5, [3, 7, 7, 5], m('SpiderRed'), 'bolt');
  C('c_leviathan', 'Sump Leviathan', 5, [6, 3, 7, 6], b('SquidGreen', { fw: 76, fh: 79 }), 'water');
  // level 6-7
  C('c_brute', 'Scaffold Brute', 6, [8, 3, 6, 7], b('DemonCyclop2', { fw: 50, fh: 50 }));
  C('c_gorr', 'Gorr', 6, [5, 8, 7, 4], b('DemonCyclop', { fw: 50, fh: 50 }), 'earth');
  C('c_h0', 'Specimen H-0', 7, [8, 6, 7, 5], b('GiantSpirit', { fw: 50, fh: 50, hue: 230 }), 'dark');
  C('c_jugg', 'Iron Juggernaut', 7, [6, 8, 5, 8], b('GiantRedSamurai', { fw: 48, fh: 48, sat: 0.2 }), 'fire');
  // level 8-10 (people)
  C('c_bram', 'Bram', 8, [8, 7, 4, 9], c('bram'));
  C('c_sable', 'Sable', 8, [6, 9, 8, 5], c('sable'));
  C('c_drago', 'Drago Venn', 9, [9, 8, 8, 5], c('drago'));
  C('c_lyra', 'Lyra', 9, [6, 8, 9, 7], c('lyra'), 'holy');
  C('c_kael', 'Kael', 10, [10, 6, 8, 9], c('kael'), 'wind');
  C('c_vesper', 'Vesper', 10, [10, 9, 4, 10], c('vesper'), 'dark');
})();
// the people who play: deck, rules, how clever they are (0..1)
AE.ARCANA_FOES = {
  kid: { name: 'PUPIL', deck: ['c_rat', 'c_slime', 'c_bat', 'c_drone', 'c_larva', 'c_hawk'], rules: [], wit: 0.3, hi: 'Best of one! Loser gives a card! I won\'t cry!', lose: 'I\'m not crying. YOU\'RE crying.' },
  noble: { name: 'ARCANA PLAYER', deck: ['c_trooper', 'c_hawk', 'c_eel', 'c_rotcap', 'c_wisp', 'c_gunner', 'c_heavy'], rules: [], wit: 0.6, hi: 'A game? Splendid. I collect the Aurex cards. They\'re very collectable. Like the people.', lose: 'Oh, bother.' },
  dealer: { name: 'DEALER', deck: ['c_crawler', 'c_sumprat', 'c_rivet', 'c_imp', 'c_hound', 'c_heavy', 'c_bulwark'], rules: ['same'], wit: 0.8, hi: 'House rules: Same is on. Two matching sides, both flip. Shall we?', lose: 'House loses. House always remembers.' },
  sharp: { name: 'CARD SHARP', deck: ['c_hound', 'c_specimen', 'c_failed', 'c_arcanist', 'c_ogre', 'c_gorr', 'c_drake'], rules: ['same', 'elemental'], wit: 0.95, hi: 'Same and Elemental. Real rules for real players. Ready to lose something nice?', lose: '...Lucky. That was luck. Again.' }
};
(function () {
  const iname = AE.itemName;
  AE.itemName = function (id) { if (id && id.indexOf('card:') === 0) return 'Arcana: ' + ((AE.CARDS[id.slice(5)] || {}).name || id); return iname(id); };
})();
AE.cardRank = function (v) { return v >= 10 ? 'A' : String(v); };

// ---------- drawing a card ----------
AE.drawCard = function (ctx, id, x, y, side, o) {
  o = o || {}; const D = AE.CARDS[id]; if (!D) return;
  const W = 40, H = 48;
  const bg = side === 'p' ? ['#2a4a9a', '#16285a'] : side === 'e' ? ['#9a2a3a', '#5a1620'] : ['#555', '#333'];
  const g = ctx.createLinearGradient(0, y, 0, y + H); g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]);
  ctx.fillStyle = g; ctx.fillRect(x, y, W, H); ctx.strokeStyle = o.sel ? '#ffe080' : '#c8d0e0'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, W - 1, H - 1);
  if (o.back) { ctx.fillStyle = '#c8b070'; ctx.fillRect(x + 14, y + 18, 12, 12); return; }
  // art
  const A = D.art || {}; const filt = [A.hue ? 'hue-rotate(' + A.hue + 'deg)' : '', A.sat !== undefined ? 'saturate(' + A.sat + ')' : ''].join(' ').trim() || undefined;
  if (A.mon && AE.IMG['mon_' + A.mon]) AE.blit(ctx, AE.IMG['mon_' + A.mon], 0, 0, 16, 16, x + 12, y + 18, 16, 16, { filter: filt });
  else if (A.boss && AE.IMG['boss_' + A.boss + '_Idle']) { const s = 26 / Math.max(A.fw, A.fh); AE.blit(ctx, AE.IMG['boss_' + A.boss + '_Idle'], 0, 0, A.fw, A.fh, x + 20 - A.fw * s / 2, y + 44 - A.fh * s, A.fw * s, A.fh * s, { filter: filt }); }
  else if (A.cast) AE.actor(ctx, A.cast, 'idle', 2, 0, x + 20, y + 44, 0.7, { filter: filt });
  // ranks in a diamond, top-left
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x + 1, y + 1, 19, 23);
  const n = o.n || D.n;
  AE.text(ctx, AE.cardRank(n[0]), x + 10, y + 2, '#fff', { align: 'center' });
  AE.text(ctx, AE.cardRank(n[3]), x + 4, y + 9, '#fff', { align: 'center' });
  AE.text(ctx, AE.cardRank(n[1]), x + 16, y + 9, '#fff', { align: 'center' });
  AE.text(ctx, AE.cardRank(n[2]), x + 10, y + 16, '#fff', { align: 'center' });
  if (D.elem) { ctx.fillStyle = AE.ELEMCOL[D.elem] || '#fff'; ctx.fillRect(x + W - 7, y + 3, 4, 4); }
};
AE.ELEMCOL = { fire: '#ff7040', ice: '#80d0ff', bolt: '#ffe040', water: '#4080ff', wind: '#80ff90', earth: '#c09050', poison: '#a060e0', holy: '#ffffff', dark: '#8040a0' };

// ---------- the game scene ----------
AE.Arcana = {
  // play against a named player; resolves 'win' | 'lose' | 'draw' | 'no'
  duel: async function (foeId) {
    const Fd = AE.ARCANA_FOES[foeId]; if (!Fd) return 'no';
    const mine = Object.keys(AE.S_.cards).filter(function (k) { return AE.S_.cards[k] > 0 && AE.CARDS[k]; });
    const total = mine.reduce(function (a, k) { return a + AE.S_.cards[k]; }, 0);
    if (total < 5) { await AE.say('You need at least five Arcana cards to play.', { name: Fd.name }); return 'no'; }
    const r = await AE.ask(Fd.hi + (Fd.rules.length ? '' : ''), ['Play', 'Not now'], { name: Fd.name, cancel: 1 });
    if (r !== 0) return 'no';
    const g = new AE.ArcanaGame(foeId);
    const res = await new Promise(function (done) { g.done = done; AE.game.push(g); });
    if (res === 'win') await AE.say(Fd.lose, { name: Fd.name });
    return res;
  }
};
AE.ArcanaGame = function (foeId) {
  this.kind = 'arcana'; this.opaque = true; this.F = AE.ARCANA_FOES[foeId]; this.rules = this.F.rules;
  this.phase = 'choose'; this.t = 0; this.msg = '';
  // build the player's choosable list (one entry per copy, up to the count)
  const S = AE.S_; this.pool = [];
  Object.keys(S.cards).filter(function (k) { return AE.CARDS[k]; }).sort(function (a, b) { return AE.CARDS[b].lv - AE.CARDS[a].lv; })
    .forEach(function (k) { for (let i = 0; i < S.cards[k]; i++) this.pool.push(k); }, this);
  this.pick = []; this.list = new AE.List(this.pool, { rows: 12 });
  // the opponent's hand: 5 of their deck, weighted to stronger cards for clever players
  const deck = this.F.deck.slice().sort(function () { return Math.random() - 0.5; });
  this.ehand = deck.slice(0, 5).map(function (k) { return { id: k, side: 'e' }; });
  this.board = new Array(9).fill(null);
  this.elems = new Array(9).fill(null);
  if (this.rules.indexOf('elemental') >= 0) { const E = Object.keys(AE.ELEMCOL); for (let i = 0; i < 9; i++) if (Math.random() < 0.3) this.elems[i] = AE.pick(E); }
  this.hsel = 0; this.cell = 4; this.turn = Math.random() < 0.5 ? 'p' : 'e';
};
AE.ArcanaGame.prototype.val = function (c, i, side) {
  let v = AE.CARDS[c.id].n[side];
  if (this.elems[i]) v += (AE.CARDS[c.id].elem === this.elems[i]) ? 1 : -1;
  return AE.clamp(v, 1, 10);
};
// place card c at i; returns list of flipped cells
AE.ArcanaGame.prototype.place = function (c, i, dry) {
  const B = dry ? this.board.slice().map(function (x) { return x && { id: x.id, side: x.side }; }) : this.board, self = this;
  B[i] = { id: c.id, side: c.side };
  const N = [[i - 3, 0, 2, i >= 3], [i + 1, 1, 3, i % 3 < 2], [i + 3, 2, 0, i < 6], [i - 1, 3, 1, i % 3 > 0]];
  const flips = [];
  const rankAt = function (cell, k) { return self.val(B[cell], cell, k); };
  if (this.rules.indexOf('same') >= 0) {
    const same = N.filter(function (q) { return q[3] && B[q[0]] && rankAt(i, q[1]) === rankAt(q[0], q[2]); });
    if (same.length >= 2) same.forEach(function (q) { if (B[q[0]].side !== c.side) { B[q[0]].side = c.side; flips.push(q[0]); } });
  }
  N.forEach(function (q) { if (q[3] && B[q[0]] && B[q[0]].side !== c.side && rankAt(i, q[1]) > rankAt(q[0], q[2])) { B[q[0]].side = c.side; flips.push(q[0]); } });
  // combo: cards flipped by Same flip their own neighbours by the basic rule
  if (this.rules.indexOf('same') >= 0) {
    const q0 = flips.slice();
    while (q0.length) {
      const j = q0.shift();
      [[j - 3, 0, 2, j >= 3], [j + 1, 1, 3, j % 3 < 2], [j + 3, 2, 0, j < 6], [j - 1, 3, 1, j % 3 > 0]].forEach(function (q) {
        if (q[3] && B[q[0]] && B[q[0]].side !== c.side && rankAt(j, q[1]) > rankAt(q[0], q[2])) { B[q[0]].side = c.side; flips.push(q[0]); q0.push(q[0]); }
      });
    }
  }
  return flips;
};
AE.ArcanaGame.prototype.score = function (side) { return this.board.filter(function (x) { return x && x.side === side; }).length + (side === 'p' ? this.phand : this.ehand).length; };
AE.ArcanaGame.prototype.aiMove = function () {
  const self = this; let best = null;
  this.ehand.forEach(function (c, h) {
    for (let i = 0; i < 9; i++) {
      if (self.board[i]) continue;
      const fl = self.place(c, i, true).length;
      const n = AE.CARDS[c.id].n; const exposed = [i >= 3 && !self.board[i - 3] ? n[0] : 10, i % 3 < 2 && !self.board[i + 1] ? n[1] : 10, i < 6 && !self.board[i + 3] ? n[2] : 10, i % 3 > 0 && !self.board[i - 1] ? n[3] : 10];
      const weak = exposed.reduce(function (a, v) { return a + Math.max(0, 6 - v); }, 0);
      const sc = fl * 10 - weak * self.F.wit * 1.5 + Math.random() * (1 - self.F.wit) * 12 - AE.CARDS[c.id].lv * 0.3;
      if (!best || sc > best.sc) best = { sc: sc, h: h, i: i };
    }
  });
  return best;
};
AE.ArcanaGame.prototype.update = function (g) {
  const I = g.input; this.t++;
  if (this.phase === 'choose') {
    if (I.rep.up || I.rep.down) { this.list.move(I); AE.Sfx.play('move'); }
    if (I.pressed.ok) {
      const k = this.pool[this.list.sel]; const used = this.pick.filter(function (p) { return p === k; }).length;
      if (used >= AE.S_.cards[k]) { AE.Sfx.play('buzz'); return; }
      this.pick.push(k); AE.Sfx.play('ok');
      if (this.pick.length === 5) { this.phand = this.pick.map(function (k) { return { id: k, side: 'p' }; }); this.phase = 'play'; this.t = 0; this.msg = this.turn === 'p' ? 'You go first.' : this.F.name + ' goes first.'; }
    }
    if (I.pressed.back) { if (this.pick.length) { this.pick.pop(); AE.Sfx.play('back'); } else { AE.game.pop(this); this.done('no'); } }
    return;
  }
  if (this.phase === 'play') {
    if (this.board.every(Boolean)) { this.finish(); return; }
    if (this.turn === 'e') {
      if (this.t < 40) return;
      const m = this.aiMove(); const c = this.ehand.splice(m.h, 1)[0];
      const fl = this.place(c, m.i); AE.Sfx.play(fl.length ? 'hit' : 'ok'); this.flash = { cells: fl, t: 20 };
      this.turn = 'p'; this.t = 0; this.stage = 'hand'; return;
    }
    if (this.stage !== 'board') {
      if (I.rep.up) { this.hsel = (this.hsel + this.phand.length - 1) % this.phand.length; AE.Sfx.play('move'); }
      if (I.rep.down) { this.hsel = (this.hsel + 1) % this.phand.length; AE.Sfx.play('move'); }
      if (I.pressed.ok) { this.stage = 'board'; AE.Sfx.play('ok'); while (this.board[this.cell]) this.cell = (this.cell + 1) % 9; }
      return;
    }
    const mv = function (d) { return d; };
    if (I.rep.left && this.cell % 3 > 0) { this.cell--; AE.Sfx.play('move'); }
    if (I.rep.right && this.cell % 3 < 2) { this.cell++; AE.Sfx.play('move'); }
    if (I.rep.up && this.cell >= 3) { this.cell -= 3; AE.Sfx.play('move'); }
    if (I.rep.down && this.cell < 6) { this.cell += 3; AE.Sfx.play('move'); }
    if (I.pressed.back) { this.stage = 'hand'; AE.Sfx.play('back'); }
    if (I.pressed.ok) {
      if (this.board[this.cell]) { AE.Sfx.play('buzz'); return; }
      const c = this.phand.splice(this.hsel, 1)[0]; this.hsel = Math.min(this.hsel, Math.max(0, this.phand.length - 1));
      const fl = this.place(c, this.cell); AE.Sfx.play(fl.length ? 'hit' : 'ok'); this.flash = { cells: fl, t: 20 };
      this.turn = 'e'; this.t = 0; this.stage = 'hand';
    }
    return;
  }
  if (this.phase === 'claim') {
    if (I.rep.up) { this.csel = (this.csel + this.claimFrom.length - 1) % this.claimFrom.length; AE.Sfx.play('move'); }
    if (I.rep.down) { this.csel = (this.csel + 1) % this.claimFrom.length; AE.Sfx.play('move'); }
    if (I.pressed.ok) { const k = this.claimFrom[this.csel]; AE.S_.cards[k] = (AE.S_.cards[k] || 0) + 1; AE.Sfx.play('chest'); this.msg = 'You won ' + AE.CARDS[k].name + '!'; this.phase = 'over'; this.t = 0; }
    return;
  }
  if (this.phase === 'over' && this.t > 30 && (I.pressed.ok || I.pressed.back)) { AE.game.pop(this); this.done(this.result); }
};
AE.ArcanaGame.prototype.finish = function () {
  const p = this.score('p'), e = this.score('e'); const S = AE.S_;
  S.arcana = S.arcana || { w: 0, l: 0, d: 0 };
  if (p > e) {
    this.result = 'win'; S.arcana.w++; AE.Sfx.play('save');
    this.claimFrom = this.F.deck.filter(function (k, i, a) { return a.indexOf(k) === i; }); this.csel = 0; this.phase = 'claim'; this.msg = 'You win! Choose a card.';
  } else if (e > p) {
    this.result = 'lose'; S.arcana.l++; AE.Sfx.play('buzz');
    // they take the best card you played
    const best = this.pick.slice().sort(function (a, b) { return AE.CARDS[b].lv - AE.CARDS[a].lv; })[0];
    S.cards[best]--; if (S.cards[best] <= 0) delete S.cards[best];
    this.msg = 'You lose. ' + this.F.name + ' takes your ' + AE.CARDS[best].name + '.'; this.phase = 'over';
  } else { this.result = 'draw'; S.arcana.d++; this.msg = 'A draw. Nobody loses a card.'; this.phase = 'over'; }
  this.t = 0;
};
AE.ArcanaGame.prototype.draw = function (ctx) {
  const self = this;
  ctx.fillStyle = '#10301c'; ctx.fillRect(0, 0, AE.W, AE.H);
  ctx.fillStyle = '#184428'; for (let y = 0; y < AE.H; y += 8) for (let x = (y / 8) % 2 * 8; x < AE.W; x += 16) ctx.fillRect(x, y, 8, 8);
  if (this.phase === 'choose') {
    AE.window(ctx, 8, 8, 150, 208); AE.text(ctx, 'Choose 5 cards (' + this.pick.length + '/5)', 16, 14, '#ffe080');
    const L = this.list; for (let r = 0; r < L.rows; r++) {
      const i = L.top + r; if (i >= this.pool.length) break; const k = this.pool[i]; const D = AE.CARDS[k];
      const used = this.pick.filter(function (p) { return p === k; }).length; const dupeIdx = this.pool.slice(0, i).filter(function (p) { return p === k; }).length;
      AE.text(ctx, 'L' + D.lv + ' ' + D.name, 26, 30 + r * 14, dupeIdx < used ? '#666' : '#fff');
      if (i === L.sel) AE.cursor(ctx, 12, 30 + r * 14, true);
    }
    AE.drawCard(ctx, this.pool[this.list.sel], 190, 30, 'p');
    this.pick.forEach(function (k, i) { AE.drawCard(ctx, k, 166 + (i % 2) * 44, 90 + Math.floor(i / 2) * 42, 'p'); });
    AE.text(ctx, this.F.rules.length ? 'Rules: ' + this.F.rules.join(', ') : 'Rules: basic', 166, 214 - 8, '#cfc');
    return;
  }
  // board
  const BX = 68, BY = 36;
  for (let i = 0; i < 9; i++) {
    const x = BX + (i % 3) * 40, y = BY + Math.floor(i / 3) * 48;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x, y, 40, 48); ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.strokeRect(x + 0.5, y + 0.5, 39, 47);
    if (this.elems[i]) { ctx.fillStyle = AE.ELEMCOL[this.elems[i]]; ctx.globalAlpha = 0.5; ctx.fillRect(x + 16, y + 20, 8, 8); ctx.globalAlpha = 1; }
    const c = this.board[i];
    if (c) AE.drawCard(ctx, c.id, x, y, c.side, { n: [0, 1, 2, 3].map(function (k) { return self.val(c, i, k); }) });
    if (this.flash && this.flash.t > 0 && this.flash.cells.indexOf(i) >= 0) { ctx.fillStyle = 'rgba(255,255,255,' + (this.flash.t / 30) + ')'; ctx.fillRect(x, y, 40, 48); }
    if (this.phase === 'play' && this.turn === 'p' && this.stage === 'board' && i === this.cell) { ctx.strokeStyle = '#ffe080'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, 38, 46); ctx.lineWidth = 1; }
  }
  if (this.flash) this.flash.t--;
  // hands
  this.ehand.forEach(function (c, i) { AE.drawCard(ctx, c.id, 8, 18 + i * 34, 'e', { back: !self.rules.includes('open') && false }); });
  (this.phand || []).forEach(function (c, i) { const sel = self.turn === 'p' && i === self.hsel && self.phase === 'play'; AE.drawCard(ctx, c.id, 208 - (sel ? 8 : 0), 18 + i * 34, 'p', { sel: sel }); });
  // score
  AE.text(ctx, String(this.score('e')), 30, 202, '#ff8080', { align: 'center' }); AE.text(ctx, String(this.score('p')), 228, 202, '#80a0ff', { align: 'center' });
  AE.text(ctx, this.F.name, 8, 4, '#ffb0b0'); AE.text(ctx, 'YOU', 248, 4, '#b0c8ff', { align: 'right' });
  if (this.phase === 'play') AE.text(ctx, this.turn === 'p' ? (this.stage === 'board' ? 'Place your card' : 'Pick a card') : this.F.name + ' is thinking...', AE.W / 2, 190, '#fff', { align: 'center' });
  if (this.phase === 'claim') {
    AE.window(ctx, 60, 30, 136, 20 + this.claimFrom.length * 12); AE.text(ctx, 'Take one card:', 68, 36, '#ffe080');
    this.claimFrom.forEach(function (k, i) { AE.text(ctx, AE.CARDS[k].name, 84, 50 + i * 12, '#fff'); if (i === self.csel) AE.cursor(ctx, 70, 50 + i * 12, true); });
    AE.drawCard(ctx, this.claimFrom[this.csel], 108, 60 + this.claimFrom.length * 12, 'p');
  }
  if (this.phase === 'over') { AE.window(ctx, 30, 96, 196, 28); AE.text(ctx, this.msg, AE.W / 2, 104, '#fff', { align: 'center' }); }
  else if (this.msg && this.t < 90 && this.phase === 'play') AE.text(ctx, this.msg, AE.W / 2, 22, '#ffe080', { align: 'center' });
};
// the menu's card list: a proper browser now
AE.CardList = function () { this.sel = 0; };
AE.CardList.prototype.update = function (I) {
  const ks = Object.keys(AE.S_.cards).filter(function (k) { return AE.CARDS[k]; });
  if (I.rep.up) this.sel = Math.max(0, this.sel - 1); if (I.rep.down) this.sel = Math.min(ks.length - 1, this.sel + 1);
  if (I.pressed.back || I.pressed.ok) return 'close';
};
AE.CardList.prototype.draw = function (ctx) {
  AE.window(ctx, 0, 0, AE.W, AE.H); const S = AE.S_;
  const ks = Object.keys(S.cards).filter(function (k) { return AE.CARDS[k]; }).sort(function (a, b) { return AE.CARDS[a].lv - AE.CARDS[b].lv || (a < b ? -1 : 1); });
  const rec = S.arcana || { w: 0, l: 0, d: 0 };
  AE.text(ctx, 'Arcana  ' + ks.length + '/' + Object.keys(AE.CARDS).length + ' kinds   W' + rec.w + ' L' + rec.l + ' D' + rec.d, 10, 6, '#ffe080');
  if (!ks.length) { AE.text(ctx, 'No cards yet. The dealer at the Lucky Lantern', 10, 26, '#888'); AE.text(ctx, '(Market Ward) gives every new player a deck.', 10, 38, '#888'); return; }
  const top = Math.max(0, Math.min(this.sel - 6, ks.length - 14));
  ks.slice(top, top + 14).forEach(function (k, r) { const i = top + r; AE.text(ctx, 'L' + AE.CARDS[k].lv + ' ' + AE.CARDS[k].name + ' x' + S.cards[k], 22, 24 + r * 13, '#fff'); if (i === this.sel) AE.cursor(ctx, 8, 24 + r * 13, true); }, this);
  if (ks[this.sel]) AE.drawCard(ctx, ks[this.sel], 200, 40, 'p');
};

/* ================= Gilded Spire minigames: Talonbird races, slots, the shooting gallery, the Battle Square =================
   They pay in Spire Tokens (S.tokens), traded for prizes at the Spire Exchange. Every game is one keypress at a time. */
AE.tokens = function (n) { const S = AE.S_; S.tokens = Math.max(0, (S.tokens || 0) + (n || 0)); return S.tokens; };
AE.miniScene = function (o) { return new Promise(function (done) { o.done = done; o.kind = 'mini'; o.opaque = true; o.t = 0; AE.game.push(o); }); };
AE.miniEnd = function (o, v) { AE.game.pop(o); o.done(v); };

// ---------- Talonbird race: pick a bird, bet tokens, watch ----------
AE.race = async function () {
  const birds = [['Gold-Crest', 7, 50, 30], ['Bruiser', 4, 40, 70], ['Featherfall', 6, 60, 20], ['Old Biscuit', 2, 30, 90]].map(function (b) { return { name: b[0], spd: b[1] + Math.random() * 3, sta: b[2] + AE.rand(20), luck: b[3] }; });
  if (AE.S_.mybird) birds.push({ name: AE.S_.mybird.name + ' (yours)', spd: AE.S_.mybird.spd, sta: AE.S_.mybird.sta, luck: 50, mine: 1 });
  const odds = birds.map(function (b) { return Math.max(2, Math.round(20 / (b.spd + b.sta / 20))); });
  const pick = await AE.ask('Which bird?', birds.map(function (b, i) { return b.name + '  x' + odds[i]; }).concat(['Leave']), { name: 'BOOKIE', cancel: birds.length });
  if (pick >= birds.length) return;
  const have = AE.tokens(0), bets = [10, 50, 100].filter(function (v) { return v <= have; });
  let bet = 0;
  if (bets.length) { const r = await AE.ask('Bet how many tokens? (You have ' + have + ')', bets.map(String).concat(['Just watch']), { name: 'BOOKIE', cancel: bets.length }); bet = bets[r] || 0; }
  AE.tokens(-bet);
  const res = await AE.miniScene({
    pos: birds.map(function () { return 0; }), en: birds.map(function (b) { return b.sta; }), win: -1,
    update: function (g) {
      this.t++; if (this.t < 60) return;
      if (this.win < 0) birds.forEach(function (b, i) {
        let v = b.spd * 0.05 + Math.random() * 0.25; if (this.en[i] > 0) this.en[i] -= 0.4; else v *= 0.6;
        if (Math.random() * 100 < b.luck / 40) v += 0.5; if (g.input.held.ok && i === pick) v += 0.04;
        this.pos[i] += v; if (this.pos[i] >= 200 && this.win < 0) { this.win = i; this.wt = this.t; }
      }, this);
      if (this.win >= 0 && this.t - this.wt > 90) AE.miniEnd(this, this.win);
    },
    draw: function (ctx) {
      ctx.fillStyle = '#7ab04a'; ctx.fillRect(0, 0, AE.W, AE.H); ctx.fillStyle = '#c8a060';
      birds.forEach(function (b, i) { ctx.fillRect(0, 40 + i * 34, AE.W, 22); });
      ctx.fillStyle = '#fff'; ctx.fillRect(228, 34, 3, birds.length * 34);
      birds.forEach(function (b, i) {
        const x = 20 + this.pos[i], y = 40 + i * 34; const im = AE.IMG['mon_' + (i % 2 ? 'Owl' : 'Owl2')];
        if (im) AE.blit(ctx, im, 3 * 16, (Math.floor(this.t / 6 + i) % 4) * 16, 16, 16, x - 8, y - 6, 24, 24, { filter: 'hue-rotate(' + i * 60 + 'deg)' });
        AE.text(ctx, b.name, 4, y + 12, i === pick ? '#ffe080' : '#fff');
      }, this);
      AE.text(ctx, this.t < 60 ? 'Ready...' : this.win >= 0 ? birds[this.win].name + ' wins!' : 'Hold OK to cheer your bird!', AE.W / 2, 8, '#fff', { align: 'center' });
    }
  });
  if (res === pick) { const won = Math.max(bet * odds[pick], 5); AE.tokens(won); AE.Sfx.play('coin'); await AE.say('Your bird won! You get ' + won + ' tokens.', { name: 'BOOKIE' }); }
  else await AE.say(bet ? 'Better luck next time.' : 'Fun to watch, isn\'t it?', { name: 'BOOKIE' });
};

// ---------- slots: three reels, stop each with OK ----------
AE.SLOTSYM = ['7', 'B', 'C', 'Q', 'S', 'T'];
AE.slots = async function () {
  if (AE.tokens(0) < 3) { await AE.say('The slot machines take 3 tokens a spin. Win tokens at the races, or trade gold at the Exchange.'); return; }
  const r = await AE.ask('Spin for 3 tokens? (You have ' + AE.tokens(0) + ')', ['Spin', 'Leave'], { cancel: 1 }); if (r !== 0) return;
  AE.tokens(-3);
  const reels = [0, 1, 2].map(function () { return { i: AE.rand(6), stop: false, v: 0.35 + Math.random() * 0.2 }; });
  const out = await AE.miniScene({
    k: 0,
    update: function (g) {
      this.t++; reels.forEach(function (R) { if (!R.stop) R.i = (R.i + R.v) % 6; });
      if (g.input.pressed.ok && this.k < 3) { reels[this.k].stop = true; reels[this.k].i = Math.floor(reels[this.k].i); this.k++; AE.Sfx.play('ok'); if (this.k === 3) this.endT = this.t; }
      if (this.k === 3 && this.t - this.endT > 40) AE.miniEnd(this, reels.map(function (R) { return AE.SLOTSYM[Math.floor(R.i) % 6]; }));
    },
    draw: function (ctx) {
      ctx.fillStyle = '#300a14'; ctx.fillRect(0, 0, AE.W, AE.H); AE.window(ctx, 48, 60, 160, 90, { col: '#602020' });
      reels.forEach(function (R, i) { ctx.fillStyle = '#fff'; ctx.fillRect(62 + i * 46, 80, 38, 50); AE.text(ctx, AE.SLOTSYM[Math.floor(R.i) % 6], 81 + i * 46, 98, R.stop ? '#c02020' : '#202020', { align: 'center' }); });
      AE.text(ctx, 'Press OK to stop each reel', AE.W / 2, 170, '#ffe080', { align: 'center' });
    }
  });
  const pay = out[0] === out[1] && out[1] === out[2] ? (out[0] === '7' ? 200 : out[0] === 'B' ? 60 : 30) : (out[0] === out[1] || out[1] === out[2]) ? 4 : 0;
  if (pay) { AE.tokens(pay); AE.Sfx.play('coin'); await AE.notice(out.join(' ') + ' - won ' + pay + ' tokens!'); } else await AE.notice(out.join(' ') + ' - no luck.');
  if (out.join('') === '777' && !AE.S_.flags.slot777) { AE.S_.flags.slot777 = 1; await AE.gain('lucky_coin'); }
};

// ---------- shooting gallery: a target slides along; press OK when the sight is on it ----------
AE.gallery = async function () {
  if (AE.S_.gold < 50) { await AE.say('Fifty gold a round.', { name: 'GALLERY MAN' }); return; }
  const r = await AE.ask('Ten shots, 50 G. Hit eight for a prize!', ['Shoot', 'Leave'], { name: 'GALLERY MAN', cancel: 1 }); if (r !== 0) return;
  AE.S_.gold -= 50;
  const hits = await AE.miniScene({
    shot: 0, hit: 0, x: 0, v: 2.2, flash: 0,
    update: function (g) {
      this.t++; this.x += this.v; if (this.x < 10 || this.x > AE.W - 26) this.v = -this.v;
      if (this.flash) this.flash--;
      if (g.input.pressed.ok && this.shot < 10) { this.shot++; const on = Math.abs(this.x + 8 - AE.W / 2) < 9; if (on) { this.hit++; AE.Sfx.play('hit'); this.flash = 10; } else AE.Sfx.play('shot'); this.v = (Math.random() < 0.5 ? -1 : 1) * (2 + this.shot * 0.35); }
      if (this.shot >= 10 && !this.endT) this.endT = this.t; if (this.endT && this.t - this.endT > 40) AE.miniEnd(this, this.hit);
    },
    draw: function (ctx) {
      ctx.fillStyle = '#3a2614'; ctx.fillRect(0, 0, AE.W, AE.H); ctx.fillStyle = '#5a3a1e'; ctx.fillRect(0, 90, AE.W, 30);
      const im = AE.IMG.mon_Eye; if (im) AE.blit(ctx, im, 0, 0, 16, 16, this.x, 96, 16, 16, { filter: this.flash ? 'brightness(3)' : undefined });
      ctx.strokeStyle = '#ff4040'; ctx.strokeRect(AE.W / 2 - 9, 92, 18, 26); ctx.beginPath(); ctx.moveTo(AE.W / 2, 86); ctx.lineTo(AE.W / 2, 124); ctx.stroke();
      AE.text(ctx, 'Shots ' + this.shot + '/10   Hits ' + this.hit, AE.W / 2, 150, '#fff', { align: 'center' });
    }
  });
  const prize = hits >= 10 ? 'prism:long_range' : hits >= 8 ? 'hi_potion' : null;
  if (hits >= 8) { AE.tokens(hits * 5); await AE.say(hits + ' hits! A sharpshooter. Here\'s your prize and ' + hits * 5 + ' tokens.', { name: 'GALLERY MAN' }); if (prize === 'prism:long_range' && AE.S_.flags.gal10) await AE.gain('hi_potion', 2); else { if (hits >= 10) AE.S_.flags.gal10 = 1; await AE.gain(prize); } }
  else await AE.say(hits + ' hits. Not bad. Not good, either.', { name: 'GALLERY MAN' });
};

// ---------- Battle Square: fights in a row; tokens grow with the streak ----------
AE.arena = async function () {
  const r = await AE.ask('Up to five fights in a row. Each win pays more tokens. Lose, and you keep what you won. 100 G to enter.', ['Fight', 'Leave'], { name: 'ARENA MASTER', cancel: 1 });
  if (r !== 0) return; if (!AE.pay(100)) { await AE.say('100 G, please.', { name: 'ARENA MASTER' }); return; }
  let won = 0;
  for (let k = 0; k < 5; k++) {
    const sets = AE.ENC.arena.sets; const form = sets[AE.rand(sets.length)];
    const res = await AE.startBattle({ enemies: form.enemies, bg: 'ruins', noRun: 1 }, { canLose: 1 });
    if (res !== 'win') break; won++; const pay = [20, 40, 80, 160, 320][k]; AE.tokens(pay); await AE.notice('Win ' + won + '! +' + pay + ' tokens');
    if (k < 4) { const c = await AE.ask('Keep going?', ['Next fight', 'Quit while ahead'], { name: 'ARENA MASTER', cancel: 1 }); if (c !== 0) break; }
  }
  AE.healAll();
  await AE.say(won >= 5 ? 'Five straight! The Square salutes you.' : 'You won ' + won + ' fight' + (won === 1 ? '' : 's') + '. Come again!', { name: 'ARENA MASTER' });
  if (won >= 5 && !AE.S_.flags.arena5) { AE.S_.flags.arena5 = 1; await AE.gain('champion_belt'); }
};

// ---------- the Exchange ----------
AE.EXCHANGE = [['elixir', 400], ['cat_bell', 800], ['card:c_sylphine', 1500], ['prism:exp_plus', 2000], ['megalixir', 2400], ['sprint_shoes', 3000], ['prism:gold_plus', 4000], ['lucky_coin', 5000], ['ribbon', 9999]];
AE.exchange = async function () {
  const r = await AE.ask('Tokens: ' + AE.tokens(0) + '. Buy tokens (10 G each) or trade them for prizes?', ['Buy 50 tokens (500 G)', 'Prizes', 'Leave'], { name: 'EXCHANGER', cancel: 2 });
  if (r === 0) { if (AE.pay(500)) { AE.tokens(50); AE.Sfx.play('coin'); } else await AE.say('Not enough gold.'); return; }
  if (r !== 1) return;
  const c = await AE.ask('Prizes (you have ' + AE.tokens(0) + ' tokens):', AE.EXCHANGE.map(function (p) { return AE.itemName(p[0]) + ' - ' + p[1]; }).concat(['Back']), { name: 'EXCHANGER', cancel: AE.EXCHANGE.length });
  const P = AE.EXCHANGE[c]; if (!P) return;
  if (AE.tokens(0) < P[1]) { await AE.say('Not enough tokens.', { name: 'EXCHANGER' }); return; }
  AE.tokens(-P[1]); await AE.gain(P[0]);
};

/* ================= Running inside a host page (the Torn Arcade phone, or its own window) =================
   AE.host.open(parent) shows the game in a parent element (or a window over the page); AE.host.close() saves a
   suspend point, stops the loop and hides it. Nothing runs while it is closed. */
AE.host = {
  root: null, game: null,
  open: async function (parent, data, o) {
    o = o || {};
    if (!this.root) {
      const r = this.root = document.createElement('div'); r.className = 'ae-root';
      r.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:#000;display:flex;align-items:center;justify-content:center';
      const self = this;
      this.game = await AE.boot(r, data, { active: function () { return self.root && self.root.style.display !== 'none'; } });
      const x = document.createElement('button'); x.textContent = '✕'; x.title = 'Close (saves where you are)';
      x.style.cssText = 'position:absolute;top:6px;right:8px;z-index:2;background:rgba(0,0,0,.5);color:#fff;border:1px solid #888;border-radius:4px;font:14px sans-serif;cursor:pointer;padding:2px 8px';
      x.addEventListener('click', function () { self.close(); }); r.appendChild(x); this.closeBtn = x;
    }
    const r = this.root;
    if (parent) { r.style.position = 'absolute'; r.style.inset = '0'; parent.appendChild(r); } else { r.style.position = 'fixed'; document.body.appendChild(r); }
    if (o.noClose) this.closeBtn.style.display = 'none';
    r.style.display = 'flex'; this.game.input.clear(); this.game.start();
    const c = r.querySelector('canvas'); if (c) c.focus();
    if (AE.Music && AE.S_ && AE.S_.playing) { const f = AE.field(); AE.Music.cur = null; AE.Music.play(f ? f.map.d.music : 'world'); }
  },
  close: function () {
    if (!this.root || this.root.style.display === 'none') return;
    AE.suspend();
    this.root.style.display = 'none'; this.game.stop(); if (AE.Music) AE.Music.stop(0.1); this.game.input.clear();
    try { document.dispatchEvent(new CustomEvent('aethra:closed')); } catch (e) {}
  }
};
// a suspend point: written when the game is closed on the field or the world map, offered as "Resume" on the title
AE.suspend = function () {
  const S = AE.S_, top = AE.game && AE.game.top(); if (!S || !S.playing || !top) return false;
  if (top.kind !== 'field' && top.kind !== 'world') return false;
  if (top.kind === 'field' && top.locked) return false;
  AE.saveSlot('suspend'); return true;
};
(function () {
  const en = AE.Title.prototype.enter, up = AE.Title.prototype.update, dr = AE.Title.prototype.draw;
  AE.Title.prototype.enter = function (g) { en.call(this, g); this.resume = !!AE.readSlot('suspend'); if (this.resume) this.sel = 2; };
  AE.Title.prototype.update = function (g) {
    if (this.resume && !this.sub) {
      const I = g.input; this.t++;
      if (I.rep.up) { this.sel = (this.sel + 2) % 3; AE.Sfx.play('move'); } if (I.rep.down) { this.sel = (this.sel + 1) % 3; AE.Sfx.play('move'); }
      if (I.pressed.ok && this.sel === 2) { AE.ac(); AE.Sfx.play('ok'); const self = this; g.fadeOut(0.05).then(function () { g.pop(self); AE.loadSlot('suspend'); g.fadeIn(0.04); }); return; }
      if (I.pressed.ok) { if (this.sel === 0) { const self = this; g.fadeOut(0.04).then(function () { g.pop(self); AE.newGame(); g.fadeIn(0.03); }); } else if (this.hasSave) this.sub = new AE.FileScreen('load'); else AE.Sfx.play('buzz'); }
      return;
    }
    return up.call(this, g);
  };
  AE.Title.prototype.draw = function (ctx) {
    dr.call(this, ctx);
    if (this.resume && !this.sub) { AE.text(ctx, 'Resume', 112, 168, '#ffe080'); if (this.sel === 2) AE.cursor(ctx, 94, 168); }
  };
})();

/* ================= Boot: unpack the data, decode the art, start ================= */
// gzip + base64 -> object (maps and the world are shipped compressed)
AE.unz = async function (b64) {
  const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  const txt = await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  return JSON.parse(txt);
};
AE.boot = async function (host, data, opts) {
  opts = opts || {};
  if (data.mapsz) { data.maps = await AE.unz(data.mapsz); delete data.mapsz; }
  if (data.worldz) { data.world = await AE.unz(data.worldz); delete data.worldz; }
  AE.VERSION = data.version; AE.SHEETS = data.sheets; AE.FILL_ORDER = data.fills; AE.FXMETA = data.fx; AE.MS = data.ms || null; AE.BOSSFW = data.bossfw || {};
  AE.MAPS = data.maps; AE.WORLD = data.world; AE.SFX = data.sfx || {}; AE.MUSIC = Object.assign(AE.MUSIC || {}, data.music || {});
  const canvas = document.createElement('canvas'); canvas.className = 'ae-canvas'; host.appendChild(canvas);
  canvas.style.imageRendering = 'pixelated'; canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.style.objectFit = 'contain'; canvas.tabIndex = 0;
  const g = new AE.Game(canvas);
  const keys = Object.keys(data.art); let left = keys.length;
  return new Promise(function (res) {
    const ready = function () {
      AE.S_ = AE.newState();
      g.push(new AE.Title()); g.start(); res(g);
    };
    keys.forEach(function (k) {
      const im = new Image(); im.onload = im.onerror = function () { AE.IMG[k] = im; if (--left === 0) ready(); };
      im.src = 'data:image/png;base64,' + data.art[k];
    });
    if (!keys.length) ready();
    const kd = function (e) { if (!g.running || (opts.active && !opts.active())) return; if (g.input.key(e.code, true)) { e.preventDefault(); e.stopPropagation(); AE.ac(); } };
    const ku = function (e) { if (g.input.key(e.code, false)) { e.preventDefault(); } };
    window.addEventListener('keydown', kd, true); window.addEventListener('keyup', ku, true);
    window.addEventListener('blur', function () { g.input.clear(); });
    g.unbind = function () { window.removeEventListener('keydown', kd, true); window.removeEventListener('keyup', ku, true); };
  });
};
AE.newGame = function () {
  const S = AE.S_ = AE.newState(); S.playing = true;
  AE.joinMember('kael', 1);
  (AE.START && AE.START.inv || {}) && Object.keys((AE.START && AE.START.inv) || {}).forEach(function (k) { AE.addItem(k, AE.START.inv[k]); });
  const st = AE.START || { map: Object.keys(AE.MAPS)[0], x: 5, y: 5 };
  AE.game.push(new AE.Field(st.map, st.x, st.y, st.dir || 2));
  if (AE.EV['newgame']) AE.field().run('newgame');
};

/* ================= Act I enemies, skills and encounter tables =================
   E(id, name, lv, hp, atk, def, mag, mdef, spd, exp, ap, gold, art, extra) */
(function () {
  const E = AE.E, K = AE.K;
  // ---------- skills ----------
  K('rifle_shot', { name: 'Rifle Shot', kind: 'phys', power: 1.3, fx: 'shot', sure: 1 });
  K('baton', { name: 'Shock Baton', kind: 'phys', power: 1.1, elem: 'bolt', status: ['paralyse'], hit: 12, fx: 'bolt' });
  K('scan_beam', { name: 'Scan Beam', kind: 'mag', power: 4, elem: 'bolt', fx: 'spark' });
  K('flare_beam', { name: 'Flash', kind: 'mag', power: 1.5, status: ['blind'], hit: 45, fx: 'holy' });
  K('shock_bite', { name: 'Shock Bite', kind: 'phys', power: 1.3, elem: 'bolt', fx: 'bite' });
  K('aether_drip', { name: 'Aether Drip', kind: 'drainmp', power: 12, fx: 'water' });
  K('gnaw', { name: 'Gnaw', kind: 'phys', power: 1.2, fx: 'bite' });
  K('frenzy', { name: 'Frenzy', kind: 'phys', power: 0.7, hits: 2, fx: 'claw' });
  K('toxic_touch', { name: 'Toxic Touch', kind: 'phys', power: 1.0, status: ['poison'], hit: 45, fx: 'poison' });
  K('spit', { name: 'Bile Spit', kind: 'mag', power: 4, elem: 'water', status: ['poison'], hit: 40, fx: 'poison' });
  K('spores', { name: 'Sleep Spores', kind: 'mag', power: 1, status: ['sleep'], hit: 55, all: 1, fx: 'poison' });
  K('coil', { name: 'Constrict', kind: 'phys', power: 1.4, status: ['slow'], hit: 25, fx: 'claw' });
  K('dive', { name: 'Talon Dive', kind: 'phys', power: 1.5, elem: 'wind', fx: 'claw' });
  K('gust', { name: 'Gust', kind: 'mag', power: 4.5, elem: 'wind', all: 1, fx: 'wind' });
  K('rivet_gun', { name: 'Rivet Gun', kind: 'phys', power: 0.55, hits: 3, fx: 'shot', sure: 1 });
  K('zap', { name: 'Zap', kind: 'mag', power: 5.5, elem: 'bolt', fx: 'bolt' });
  K('shield_bash', { name: 'Shield Bash', kind: 'phys', power: 1.6, status: ['paralyse'], hit: 15, fx: 'boom' });
  K('pilfer', { name: 'Pilfer', kind: 'special', fx: 'claw' });
  K('fire_spell', { name: 'Fire', kind: 'mag', power: 4, elem: 'fire', fx: 'fire', mp: 4 });
  K('ice_spell', { name: 'Ice', kind: 'mag', power: 4, elem: 'ice', fx: 'ice', mp: 4 });
  K('bolt_spell', { name: 'Bolt', kind: 'mag', power: 4, elem: 'bolt', fx: 'bolt', mp: 4 });
  K('cure_spell', { name: 'Cure', kind: 'heal', power: 9, fx: 'heal', mp: 5 });
  K('protect_self', { name: 'Barrier', kind: 'buff', status: ['protect'], target: 'self', fx: 'shield' });
  K('howl', { name: 'Howl', kind: 'buff', status: ['haste'], target: 'self', fx: 'wind' });
  K('maul', { name: 'Maul', kind: 'phys', power: 1.8, fx: 'claw' });
  K('void_touch', { name: 'Hollow Touch', kind: 'mag', power: 5, elem: 'dark', status: ['silence'], hit: 30, fx: 'dark' });
  K('wail', { name: 'Wail', kind: 'mag', power: 3.5, elem: 'dark', all: 1, fx: 'dark' });
  K('grenade_toss', { name: 'Grenade', kind: 'mag', power: 6, elem: 'fire', all: 1, fx: 'boom' });
  K('smash', { name: 'Smash', kind: 'phys', power: 2.0, fx: 'boom' });
  // boss skills
  K('bw_cannon', { name: 'Arm Cannon', kind: 'mag', power: 6.5, elem: 'fire', fx: 'boom' });
  K('bw_sweep', { name: 'Sweep Laser', kind: 'mag', power: 4, elem: 'bolt', all: 1, fx: 'bolt' });
  K('bw_tackle', { name: 'Ram', kind: 'phys', power: 1.7, fx: 'boom' });
  K('bw_charge', { name: 'Core Charge', kind: 'buff', status: ['haste'], target: 'self', fx: 'spark' });
  K('bw_overdrive', { name: 'Overdrive', kind: 'mag', power: 9, elem: 'bolt', all: 1, fx: 'bolt' });
  K('lev_ink', { name: 'Sump Ink', kind: 'mag', power: 4, elem: 'water', status: ['blind'], hit: 50, all: 1, fx: 'water' });
  K('lev_tentacle', { name: 'Tentacle', kind: 'phys', power: 1.0, hits: 2, fx: 'claw' });
  K('lev_tide', { name: 'Sewage Tide', kind: 'mag', power: 7.5, elem: 'water', status: ['poison'], hit: 40, all: 1, fx: 'water' });
  K('gorr_club', { name: 'Unbroken Club', kind: 'phys', power: 2.1, fx: 'boom' });
  K('gorr_roar', { name: 'Crowd Roar', kind: 'buff', status: ['berserk'], target: 'self', fx: 'boom' });
  K('gorr_quake', { name: 'Stomp', kind: 'mag', power: 6.5, elem: 'earth', all: 1, fx: 'quake' });
  K('brute_girder', { name: 'Girder Swing', kind: 'phys', power: 1.25, fx: 'boom', all: 1 });
  K('brute_slam', { name: 'Slam', kind: 'phys', power: 2.2, fx: 'boom' });
  K('h0_scream', { name: 'Hollow Scream', kind: 'mag', power: 6, elem: 'dark', status: ['confuse'], hit: 25, all: 1, fx: 'dark' });
  K('h0_grasp', { name: 'Grasp', kind: 'phys', power: 1.6, drain: 1, fx: 'claw' });
  K('h0_flow', { name: 'Aether Surge', kind: 'mag', power: 10, fx: 'spark' });
  K('h0_mend', { name: 'Regrowth', kind: 'heal', power: 30, target: 'self', fx: 'heal' });
  K('dv_thrust', { name: 'Venn Lunge', kind: 'phys', power: 1.9, fx: 'slash', pierce: 1 });
  K('dv_spin', { name: 'Halberd Sweep', kind: 'phys', power: 1.15, all: 1, fx: 'slash' });
  K('dv_order', { name: 'Rally', kind: 'buff', status: ['haste', 'protect'], target: 'all', fx: 'shield' });
  K('dv_brace', { name: 'Brace', kind: 'buff', status: ['protect'], target: 'self', fx: 'shield' });
  K('jg_cannon', { name: 'Rail Cannon', kind: 'mag', power: 11, elem: 'fire', fx: 'boom' });
  K('jg_steam', { name: 'Steam Vent', kind: 'mag', power: 6.5, elem: 'water', all: 1, fx: 'wind' });
  K('jg_crush', { name: 'Crush', kind: 'phys', power: 2.0, fx: 'boom' });
  K('jg_whistle', { name: 'Whistle', kind: 'buff', status: ['haste'], target: 'self', fx: 'wind' });

  AE.SPECIALS.pilfer = async function (B, u, ts) {
    const t = ts[0]; B.say('Pilfer', 50); await B.step(u, true); B.hitOnce(u, t, 0.6, {});
    const g = Math.min(AE.S_.gold, 20 + AE.rand(40)); AE.S_.gold -= g; u.loot = (u.loot || 0) + g; if (g) B.say('Stole ' + g + ' G!', 60);
    await AE.wait(20); await B.step(u, false);
  };

  // ---------- Reactor 4 ----------
  E('a_trooper', 'Aurex Trooper', 3, 92, 17, 10, 6, 6, 16, 18, 2, 24, { cast: 'trooper' }, { ai: [[4, 'attack'], [1, 'baton']], steal: [['potion', 0.6]], drop: [['potion', 0.25]] });
  E('a_gunner', 'Aurex Gunner', 4, 78, 19, 8, 6, 8, 18, 21, 2, 28, { cast: 'gunner' }, { ai: [[3, 'rifle_shot'], [1, 'attack']], steal: [['grenade', 0.4]], drop: [['grenade', 0.15]] });
  E('sentry', 'Sentry Drone', 3, 64, 14, 14, 12, 8, 20, 17, 2, 18, { mon: 'Eye', hue: 170 }, { weak: ['bolt'], float: 1, ai: [[2, 'attack'], [2, 'scan_beam'], [1, 'flare_beam']], steal: [['eye_drops', 0.5]] });
  E('crawler', 'Coil Crawler', 4, 96, 18, 12, 6, 6, 15, 22, 3, 20, { mon: 'SpiderYellow' }, { absorb: ['bolt'], weak: ['water', 'ice'], ai: [[3, 'attack'], [2, 'shock_bite']], drop: [['spark_cell', 0.06]] });
  E('flowslime', 'Flow Slime', 4, 74, 13, 16, 14, 4, 12, 20, 3, 14, { mon: 'Slime2', hue: 110 }, { weak: ['fire'], resist: ['water'], ai: [[3, 'attack'], [2, 'aether_drip']], steal: [['ether', 0.08]] });
  E('piperat', 'Pipe Rat', 2, 48, 13, 6, 4, 4, 26, 12, 1, 10, { mon: 'Mouse' }, { ai: [[3, 'attack'], [1, 'gnaw']], drop: [['antidote', 0.2]] });
  E('bulwark', 'Bulwark', 8, 1650, 26, 26, 22, 18, 18, 240, 24, 400, { boss: 'GiantBlueSamurai', anim: 'Idle', fw: 48, fh: 48, k: 2, sat: 0.25, bright: 0.95 },
    { boss: 1, weak: ['bolt'], resist: ['fire'], steal: [['prism:barrier', 0.4], ['hi_potion', 1]], ai: 'bulwark', drop: [['iron_bangle', 1]] });
  AE.AI.bulwark = function (f, B) {
    const v = f.ai.vars; v.t = (v.t || 0) + 1;
    if (!v.phase && f.hp < f.maxhp * 0.5) { v.phase = 1; B.say('Bulwark: CORE TEMPERATURE CRITICAL. OVERDRIVE.', 90); return AE.mkAct(f, B, 'bw_charge'); }
    if (v.phase && v.t % 4 === 0) return AE.mkAct(f, B, 'bw_overdrive');
    const r = Math.random();
    if (r < 0.35) return AE.mkAct(f, B, 'attack'); if (r < 0.6) return AE.mkAct(f, B, 'bw_tackle'); if (r < 0.82) return AE.mkAct(f, B, 'bw_cannon');
    return AE.mkAct(f, B, 'bw_sweep');
  };
  AE.ENC.r4 = { bg: 'reactor', sets: [
    { enemies: ['a_trooper', 'a_trooper'], w: 3 }, { enemies: ['a_trooper', 'a_gunner'], w: 3 }, { enemies: ['sentry', 'sentry'], w: 2 }, { enemies: ['crawler'], w: 2 },
    { enemies: ['flowslime', 'flowslime', 'piperat'], w: 2 }, { enemies: ['piperat', 'piperat', 'piperat'], w: 2 }, { enemies: ['a_gunner', 'sentry', 'a_trooper'], w: 1 }] };

  // ---------- Drain 9 ----------
  E('sumprat', 'Sump Rat', 6, 135, 24, 12, 6, 8, 24, 34, 3, 30, { mon: 'MouseBlack' }, { ai: [[3, 'attack'], [1, 'frenzy']], drop: [['antidote', 0.3]] });
  E('sludge', 'Sludge', 7, 190, 22, 22, 16, 6, 10, 42, 4, 26, { mon: 'Slime3', hue: 40 }, { weak: ['fire'], immune: ['poison'], ai: [[2, 'attack'], [2, 'toxic_touch']], steal: [['antidote', 1]] });
  E('draineel', 'Drain Eel', 7, 160, 26, 14, 14, 10, 20, 40, 4, 34, { mon: 'Snake2', hue: 190 }, { weak: ['bolt'], absorb: ['water'], ai: [[3, 'attack'], [2, 'coil']] });
  E('bloat', 'Bloat Larva', 6, 120, 18, 10, 18, 10, 14, 36, 4, 22, { mon: 'Larva2' }, { weak: ['fire', 'wind'], ai: [[1, 'attack'], [3, 'spit']], drop: [['antidote', 0.4]] });
  E('rotcap', 'Rotcap', 7, 170, 20, 16, 20, 14, 12, 40, 5, 28, { mon: 'Mushroom2' }, { weak: ['fire'], ai: [[2, 'attack'], [1, 'spores']], steal: [['echo_screen', 0.6]] });
  E('rustback', 'Rustback', 10, 1400, 32, 30, 14, 20, 16, 380, 30, 800, { mon: 'SpiderRed', k: 3.2 }, { boss: 1, absorb: ['bolt'], weak: ['water'], ai: [[3, 'attack'], [2, 'shock_bite'], [1, 'frenzy']], drop: [['prism:quick', 1]] });
  E('leviathan', 'Sump Leviathan', 12, 3400, 34, 22, 30, 22, 20, 820, 45, 0, { boss: 'SquidGreen', anim: 'Idle', fw: 76, fh: 79, k: 1.4 },
    { boss: 1, weak: ['bolt'], absorb: ['water'], ai: 'leviathan', steal: [['prism:elemental', 0.3], ['x_potion', 1]] });
  AE.AI.leviathan = function (f, B) {
    const v = f.ai.vars; v.t = (v.t || 0) + 1;
    if (v.t % 5 === 0) return AE.mkAct(f, B, 'lev_tide');
    if (f.hp < f.maxhp * 0.4 && v.t % 3 === 0) return AE.mkAct(f, B, 'lev_ink');
    return AE.mkAct(f, B, Math.random() < 0.55 ? 'lev_tentacle' : 'attack');
  };
  AE.ENC.drains = { bg: 'swamp', sets: [
    { enemies: ['sumprat', 'sumprat'], w: 3 }, { enemies: ['sludge', 'bloat'], w: 2 }, { enemies: ['draineel', 'sumprat'], w: 2 }, { enemies: ['rotcap', 'rotcap'], w: 2 },
    { enemies: ['bloat', 'bloat', 'bloat'], w: 1 }, { enemies: ['sludge', 'draineel', 'rotcap'], w: 1 }] };

  // ---------- The Pit (arena) ----------
  E('pit_brawler', 'Pit Brawler', 8, 260, 30, 16, 6, 10, 18, 60, 4, 0, { cast: 'marlo', hue: 140 }, { ai: [[3, 'attack'], [1, 'frenzy']] });
  E('pit_hound', 'Pit Hound', 8, 210, 28, 12, 6, 8, 28, 55, 4, 0, { mon: 'Beast', hue: 20 }, { ai: [[3, 'attack'], [1, 'howl']] });
  E('pit_lizard', 'Arena Drake', 10, 380, 32, 20, 18, 14, 18, 90, 6, 0, { mon: 'Lizard2' }, { weak: ['ice'], ai: [[2, 'attack'], [1, 'fire_spell']] });
  E('pit_twin', 'Ogre Twin', 11, 620, 36, 22, 8, 12, 14, 140, 8, 0, { mon: 'Cyclope2', k: 2.5 }, { ai: [[3, 'attack'], [1, 'smash']] });
  E('gorr', 'Gorr the Unbroken', 15, 5200, 44, 30, 18, 22, 20, 1600, 60, 0, { boss: 'DemonCyclop', anim: 'Idle', fw: 50, fh: 50, k: 1.8 },
    { boss: 1, ai: [[3, 'attack'], [2, 'gorr_club'], [1, 'gorr_quake'], [1, 'gorr_roar', 'hurt']], steal: [['power_source', 0.3], ['hero_tonic', 1]] });

  // ---------- Spire Stair ----------
  E('hawk', 'Girder Hawk', 9, 210, 30, 14, 16, 12, 30, 62, 5, 40, { mon: 'Owl2' }, { weak: ['bolt', 'ice'], float: 1, ai: [[2, 'attack'], [2, 'dive'], [1, 'gust']], drop: [['phoenix_down', 0.08]] });
  E('rivet', 'Rivet Drone', 9, 190, 28, 24, 14, 10, 22, 60, 5, 46, { mon: 'Eye2', hue: 30 }, { weak: ['bolt'], float: 1, ai: [[2, 'attack'], [2, 'rivet_gun']], steal: [['spark_cell', 0.3]] });
  E('heavy', 'Heavy Trooper', 10, 360, 34, 28, 8, 14, 14, 78, 6, 60, { cast: 'officer', hue: 200 }, { ai: [[3, 'attack'], [1, 'shield_bash'], [1, 'protect_self', 'hurt']], steal: [['hi_potion', 0.3]], drop: [['potion', 0.4]] });
  E('wisp', 'Spark Wisp', 9, 150, 18, 12, 28, 22, 26, 58, 6, 36, { mon: 'Spirit', hue: 60 }, { absorb: ['bolt'], weak: ['water'], ai: [[1, 'attack'], [3, 'zap']], steal: [['ether', 0.06]] });
  E('imp', 'Scaffold Imp', 10, 240, 26, 16, 12, 12, 32, 66, 6, 80, { mon: 'KappaRed' }, { ai: [[2, 'attack'], [2, 'pilfer']] });
  E('patrol', 'Aurex Patrol', 9, 240, 30, 18, 10, 12, 18, 64, 5, 52, { cast: 'trooper', hue: 330 }, { ai: [[3, 'attack'], [1, 'baton'], [1, 'grenade_toss']], steal: [['grenade', 0.6]] });
  E('brute', 'Scaffold Brute', 14, 4300, 42, 32, 10, 18, 16, 1100, 40, 1200, { boss: 'DemonCyclop2', anim: 'Idle', fw: 50, fh: 50, k: 1.9, sat: 0.5 },
    { boss: 1, weak: ['bolt'], ai: [[3, 'attack'], [2, 'brute_girder'], [2, 'brute_slam']], steal: [['titan_band', 0.3], ['hi_potion', 1]], drop: [['prism:power_plus', 1]] });
  AE.ENC.spire = { bg: 'factory', sets: [
    { enemies: ['hawk', 'hawk'], w: 3 }, { enemies: ['rivet', 'patrol'], w: 3 }, { enemies: ['heavy', 'patrol'], w: 2 }, { enemies: ['wisp', 'wisp', 'rivet'], w: 2 },
    { enemies: ['imp', 'imp'], w: 2 }, { enemies: ['patrol', 'patrol', 'heavy'], w: 1 }, { enemies: ['hawk', 'wisp', 'imp'], w: 1 }] };

  // ---------- Aurex Tower ----------
  E('secoff', 'Security Officer', 13, 440, 40, 30, 12, 18, 20, 112, 8, 90, { cast: 'officer' }, { ai: [[3, 'attack'], [1, 'baton'], [1, 'rifle_shot']], steal: [['hi_potion', 0.4]] });
  E('sentinel', 'Sentinel Drone', 13, 340, 34, 30, 30, 20, 24, 106, 8, 80, { mon: 'Eye', hue: 300 }, { weak: ['bolt'], float: 1, ai: [[1, 'attack'], [2, 'scan_beam'], [1, 'flare_beam']] });
  E('lab_beast', 'Lab Specimen', 14, 520, 44, 22, 10, 14, 22, 128, 9, 70, { mon: 'Beast2', hue: 260 }, { weak: ['fire'], ai: [[3, 'attack'], [1, 'maul'], [1, 'howl']], drop: [['speed_draught', 0.05]] });
  E('failed', 'Failed Vessel', 14, 400, 30, 18, 34, 30, 18, 124, 10, 40, { mon: 'Spirit2', hue: 200, bright: 1.2 }, { undead: 1, weak: ['holy', 'fire'], absorb: ['dark'], ai: [[1, 'attack'], [2, 'void_touch'], [1, 'wail']], steal: [['mind_source', 0.03]] });
  E('arcanist', 'Aurex Arcanist', 14, 380, 22, 18, 38, 34, 20, 130, 10, 110, { cast: 'tech' }, { ai: [[1, 'attack'], [2, 'fire_spell'], [2, 'ice_spell'], [1, 'cure_spell', 'ally_hurt']], steal: [['ether', 0.4]] });
  E('hound', 'Guard Hound', 13, 420, 42, 20, 6, 12, 32, 110, 8, 60, { mon: 'Beast' }, { ai: [[3, 'attack'], [1, 'frenzy']] });
  E('h0', 'Specimen H-0', 18, 7800, 48, 28, 44, 30, 22, 2400, 80, 2000, { boss: 'GiantSpirit', anim: 'Idle', fw: 50, fh: 50, k: 2.2, hue: 230 },
    { boss: 1, weak: ['holy', 'fire'], absorb: ['dark'], ai: 'h0', steal: [['prism:heal', 0.3], ['x_potion', 1]] });
  AE.AI.h0 = function (f, B) {
    const v = f.ai.vars; v.t = (v.t || 0) + 1;
    if (f.hp < f.maxhp * 0.3 && !v.healed) { v.healed = 1; return AE.mkAct(f, B, 'h0_mend'); }
    if (v.t % 4 === 0) return AE.mkAct(f, B, 'h0_scream');
    if (v.t % 6 === 3) return AE.mkAct(f, B, 'h0_flow');
    return AE.mkAct(f, B, Math.random() < 0.5 ? 'h0_grasp' : 'attack');
  };
  E('drago1', 'Captain Drago Venn', 18, 6800, 50, 34, 24, 28, 26, 2800, 90, 2500, { cast: 'drago', k: 1.4 },
    { boss: 1, ai: 'drago1', steal: [['prism:deathblow', 0.25], ['hero_tonic', 1]], drop: [['dawn_edge', 1]] });
  AE.AI.drago1 = function (f, B) {
    const v = f.ai.vars; v.t = (v.t || 0) + 1;
    if (v.t === 1) return AE.mkAct(f, B, 'dv_order');
    if (f.hp < f.maxhp * 0.5 && !v.brace) { v.brace = 1; B.say('Drago: Good. Now I\'m interested.', 90); return AE.mkAct(f, B, 'dv_brace'); }
    if (v.t % 3 === 0) return AE.mkAct(f, B, 'dv_spin');
    return AE.mkAct(f, B, Math.random() < 0.5 ? 'dv_thrust' : 'attack');
  };
  AE.ENC.tower = { bg: 'city', sets: [
    { enemies: ['secoff', 'secoff'], w: 3 }, { enemies: ['sentinel', 'secoff'], w: 3 }, { enemies: ['hound', 'hound'], w: 2 }, { enemies: ['arcanist', 'secoff'], w: 2 },
    { enemies: ['lab_beast'], w: 2 }, { enemies: ['failed', 'failed'], w: 2 }, { enemies: ['lab_beast', 'arcanist', 'sentinel'], w: 1 }] };

  // ---------- Rail Yards ----------
  E('raildrone', 'Rail Drone', 16, 520, 46, 36, 30, 22, 26, 150, 11, 120, { mon: 'Eye2', hue: 200 }, { weak: ['bolt'], float: 1, ai: [[2, 'attack'], [2, 'rivet_gun'], [1, 'scan_beam']] });
  E('yardgun', 'Yard Gunner', 16, 560, 48, 30, 12, 20, 24, 156, 11, 140, { cast: 'gunner', hue: 120 }, { ai: [[2, 'attack'], [2, 'rifle_shot'], [1, 'grenade_toss']], steal: [['grenade', 1]] });
  E('scrapgolem', 'Scrap Golem', 17, 1100, 54, 44, 8, 16, 12, 220, 14, 160, { mon: 'Cyclope', k: 2.6, sat: 0.3 }, { weak: ['bolt', 'water'], ai: [[3, 'attack'], [1, 'smash']], drop: [['hi_potion', 0.3]] });
  E('yardhound', 'Yard Hound', 15, 480, 46, 22, 6, 14, 34, 140, 10, 80, { mon: 'Beast', hue: 300 }, { ai: [[3, 'attack'], [1, 'frenzy'], [1, 'howl']] });
  E('juggernaut', 'Iron Juggernaut', 20, 9800, 56, 40, 36, 30, 20, 3600, 120, 3000, { boss: 'GiantRedSamurai', anim: 'Idle', fw: 48, fh: 48, k: 2.3, sat: 0.2, bright: 0.85 },
    { boss: 1, weak: ['bolt', 'water'], resist: ['fire'], ai: 'jugg', steal: [['prism:gravity', 0.3], ['x_potion', 1]] });
  AE.AI.jugg = function (f, B) {
    const v = f.ai.vars; v.t = (v.t || 0) + 1;
    if (v.t % 5 === 0) return AE.mkAct(f, B, 'jg_cannon');
    if (f.hp < f.maxhp * 0.5 && !v.w) { v.w = 1; return AE.mkAct(f, B, 'jg_whistle'); }
    if (v.t % 3 === 0) return AE.mkAct(f, B, 'jg_steam');
    return AE.mkAct(f, B, Math.random() < 0.5 ? 'jg_crush' : 'attack');
  };
  AE.ENC.yards = { bg: 'factory', sets: [
    { enemies: ['raildrone', 'yardgun'], w: 3 }, { enemies: ['yardhound', 'yardhound', 'yardhound'], w: 2 }, { enemies: ['scrapgolem'], w: 2 }, { enemies: ['yardgun', 'yardgun', 'raildrone'], w: 2 },
    { enemies: ['scrapgolem', 'yardhound'], w: 1 }] };

  // ---------- shops (Act I) ----------
  AE.SHOPS.sumps_items = { name: 'Odds & Ends', items: ['potion', 'phoenix_down', 'antidote', 'eye_drops', 'echo_screen', 'tent', 'grenade'] };
  AE.SHOPS.sumps_arms = { name: 'Grett\'s Arms', items: ['steel_saber', 'copper_staff', 'rifle_lance', 'stiletto', 'leather_vest', 'iron_mail', 'iron_bangle'] };
  AE.SHOPS.sumps_junk = { name: 'Junk Mira', items: ['grenade', 'smoke_bomb', 'iron_bangle', 'tent', 'prism:scan', 'prism:throw'] };
  AE.SHOPS.market_tools = { name: 'Tool Trader', items: ['potion', 'hi_potion', 'phoenix_down', 'tent', 'smoke_bomb', 'grenade', 'remedy'] };
  AE.SHOPS.market_herbs = { name: 'Herbalist', items: ['antidote', 'eye_drops', 'echo_screen', 'soft', 'greens'] };
  AE.SHOPS.market_junk = { name: 'Scrap King', items: ['wind_cutter', 'mending_rod', 'breach_lance', 'mythril_knife', 'titan_band', 'silk_robe', 'star_pendant', 'silver_glasses'] };
  AE.SHOPS.prism_shop = { name: 'Prismatics', items: ['prism:fire', 'prism:ice', 'prism:bolt', 'prism:restore', 'prism:toxin', 'prism:mystify', 'prism:scan', 'prism:hp_plus', 'prism:all'] };
})();
// Arcana cards that monsters sometimes drop (bosses always drop theirs)
(function () {
  const D = { piperat: 'c_rat', flowslime: 'c_slime', sentry: 'c_drone', a_trooper: 'c_trooper', hawk: 'c_hawk', crawler: 'c_crawler', bloat: 'c_larva', sumprat: 'c_sumprat',
    sludge: 'c_sludge', draineel: 'c_eel', rotcap: 'c_rotcap', wisp: 'c_wisp', a_gunner: 'c_gunner', rivet: 'c_rivet', imp: 'c_imp', heavy: 'c_heavy', hound: 'c_hound',
    pit_lizard: 'c_drake', lab_beast: 'c_specimen', failed: 'c_failed', arcanist: 'c_arcanist', pit_twin: 'c_ogre', scrapgolem: 'c_golem',
    bulwark: 'c_bulwark', rustback: 'c_rustback', leviathan: 'c_leviathan', brute: 'c_brute', gorr: 'c_gorr', h0: 'c_h0', juggernaut: 'c_jugg', drago1: 'c_drago' };
  Object.keys(D).forEach(function (e) { const E = AE.ENEMIES[e]; if (!E) return; E.drop = (E.drop || []).concat([['card:' + D[e], E.boss ? 1 : 0.05]]); });
})();

/* ================= Act I: side quests, the Pit, bounties, Arcana players, inns ================= */
(function () {
  const cs = AE.cs, EV = AE.EV, F = function () { return AE.S_.flags; }, Q = AE.quest;
  const sayAs = function (name, t) { return AE.say(t, { name: name }); };
  AE.QUESTS.tam = 'Medicine for Tam';
  AE.QUESTS.pell = 'A letter for Granny Osk';
  AE.QUESTS.hask = 'Old Hask\'s badge';
  AE.QUESTS.pit = 'Champion of the Pit';
  AE.QUESTS.b_rustback = 'Bounty: Rustback';
  AE.QUESTS.b_leviathan = 'Bounty: the Sump Leviathan';

  EV.inn_sumps = function () { return AE.inn(40, 'INNKEEPER'); };

  // ---------- Tam's medicine: Ada Teller -> Doc Marrow -> a Glowcap from Drain 9 ----------
  EV.a1_ada = async function () {
    if (Q('tam') === 'done') { await sayAs('ADA TELLER', 'Tam\'s eating again. Eating everything. I\'ll never be able to thank you enough. So I won\'t try. I\'ll just make you soup, forever.'); return; }
    if (AE.has('tam_medicine')) {
      AE.take('tam_medicine'); Q('tam', 'done'); cs.flag('q_tam_done');
      await sayAs('ADA TELLER', 'Doc Marrow\'s tonic! Oh, oh, thank you. Tam, love, drink this. All of it. Yes, I know it tastes like a drain.');
      await sayAs('ADA TELLER', 'Please, take these. Tam\'s father wore them when he worked the reactors. They kept the bad air out of him, at least for a while.');
      await AE.gain('star_pendant'); AE.S_.gold += 300; await AE.notice('Received 300 G');
      return;
    }
    await sayAs('ADA TELLER', 'My boy Tam has the reactor cough. Everyone on Lantern Row gets it in the end, but he\'s only eight.');
    await sayAs('ADA TELLER', 'Doc Marrow says he could make a tonic if he had the right mushroom. I can\'t go into the drains. I can\'t leave Tam.');
    if (!Q('tam')) Q('tam', 1);
  };
  EV.a1_marrow = async function () {
    if (Q('tam') === 'done' || AE.has('tam_medicine')) { await sayAs('DOC MARROW', 'Get that tonic to the Tellers. And come back if anything aches. Everything aches. That\'s the Sumps.'); return; }
    if (AE.has('glowcap')) {
      AE.take('glowcap'); await sayAs('DOC MARROW', 'A Glowcap! A fat one, too. Give me a minute with my mortar...');
      await AE.wait(40); AE.Sfx.play('heal'); await AE.gain('tam_medicine');
      await sayAs('DOC MARROW', 'One lung tonic. For the Teller boy, yes? Off you go.');
      return;
    }
    await sayAs('DOC MARROW', 'Sit, sit. Let me look at you. ...Fell from the plate? And not a broken bone. Remarkable. Ridiculous, but remarkable.');
    AE.healAll(); await AE.notice('Doc Marrow patches you up. The party is fully healed.');
    if (Q('tam')) await sayAs('DOC MARROW', 'The Teller boy? I need a Glowcap. It only grows deep in Drain 9, in the cisterns. Bring me one and I\'ll make his tonic.');
  };

  // ---------- Mrs Pell's letter ----------
  EV.a1_pell = async function () {
    if (Q('pell') === 'done') { await sayAs('MRS PELL', 'Osk sent a reply! Three pages. Two of them are about my handwriting.'); return; }
    if (Q('pell') === 1) { await sayAs('MRS PELL', 'Granny Osk lives on the east side of the Sumps. Thank you, dear.'); return; }
    await sayAs('MRS PELL', 'You\'re going back into the Sumps? Would you take this to Granny Osk? It\'s from her grandson.');
    await sayAs('MRS PELL', 'He works for Aurex up on the plate. He can\'t write it himself, they read the post. So he tells me, and I write it.');
    Q('pell', 1); await AE.gain('pell_letter');
  };
  EV.a1_osk = async function () {
    if (AE.has('pell_letter')) {
      AE.take('pell_letter'); Q('pell', 'done');
      await sayAs('GRANNY OSK', 'A letter? From... oh. Oh, he did write. He did. He says he\'s eating properly. He\'s lying. Bless him.');
      await sayAs('GRANNY OSK', 'Here. Take these. They were his. He won\'t need them up there.');
      await AE.gain('hi_potion', 2); await AE.gain('prism:luck_plus');
      return;
    }
    await sayAs('GRANNY OSK', Q('pell') === 'done' ? 'I read his letter every morning. My eyes are bad. I know it by heart anyway.' : 'My grandson went up the Spire Stair to work for Aurex. He sends money every month. He never writes.');
  };

  // ---------- Old Hask and his badge ----------
  EV.a1_hask = async function () {
    if (Q('hask') === 'done') { await sayAs('OLD HASK', 'Warden. Keep your oath, and the oath\'ll keep you. Mostly.'); return; }
    if (AE.has('hask_badge')) {
      AE.take('hask_badge'); Q('hask', 'done');
      await sayAs('OLD HASK', '...My badge. You beat Gorr. You actually beat that great walking wall.');
      await sayAs('OLD HASK', 'Thirty years a Warden. I lost this the night I bet it in the Pit, drunk and stupid, and Gorr took it off me with one swing.');
      await sayAs('OLD HASK', 'Take my old blade. It cut wind once. Maybe it\'ll remember how.');
      await AE.gain('wind_cutter');
      await sayAs('OLD HASK', 'And lad. Your stance. Academy-perfect, it is. But nobody fights like the book. Not unless the book is all they\'ve got.');
      return;
    }
    await sayAs('OLD HASK', 'An Academy pup! Sit. Sit. You want to hear about the Code?');
    await sayAs('OLD HASK', '"The contract is sacred. The client is not. Know the difference." First line of the oath. Took me twenty years to understand it.');
    await sayAs('OLD HASK', 'I had a badge once. Lost it to Gorr in the Pit. If you ever beat him, I\'d dearly like it back.');
    if (!Q('hask')) Q('hask', 1);
  };

  // ---------- the schoolroom ----------
  EV.a1_teacher = async function () {
    await sayAs('MISS ODELL', 'Good morning! We\'re doing geography. Children, who can tell the Warden where Meridia is?');
    await sayAs('MISS ODELL', '...Across the water to the east. Yes. I grew up there. In an orphanage in Thornbrook, called the Lantern House.');
    await sayAs('MISS ODELL', 'Mother Ilse ran it. She sewed our names into our coats. She used to say some of us would forget them otherwise.');
    if (AE.S_.party.indexOf('sable') >= 0) { await cs.s('sable', '...'); await sayAs('MISS ODELL', 'Have we met, miss? You look awfully familiar.'); await cs.s('sable', 'Nope. Got one of those faces.'); }
  };
  EV.a1_arcana_kid = async function () {
    if (!AE.has('card_deck')) { await sayAs('PUPIL', 'Do you play Arcana? You need a deck. The dealer at the Lucky Lantern gives them away. Market Ward!'); return; }
    await AE.Arcana.duel('kid');
  };

  // ---------- Arcana at the Lucky Lantern ----------
  EV.a1_arcana_dealer = async function () {
    if (!AE.has('card_deck')) {
      await sayAs('DEALER', 'Never played Arcana? Well, then. Every soul in Aethra should have a deck. House gift.');
      await AE.gain('card_deck');
      ['c_rat', 'c_slime', 'c_drone', 'c_trooper', 'c_hawk', 'c_crawler', 'c_bat'].forEach(function (c) { AE.S_.cards[c] = (AE.S_.cards[c] || 0) + 1; });
      await AE.notice('Received 7 Arcana cards');
      await sayAs('DEALER', 'Five cards a side on a three-by-three board. Each card has four numbers. Put yours next to mine, and if your side is bigger, my card turns your colour.');
      await sayAs('DEALER', 'Most cards on the board at the end wins. Winner takes one card from the loser. Talk to anyone with a deck to play.');
      return;
    }
    await AE.Arcana.duel('dealer');
  };
  EV.a1_arcana_noble = function () { return AE.has('card_deck') ? AE.Arcana.duel('noble') : sayAs('ARCANA PLAYER', 'No deck, no game. The dealer at the bar hands them out.'); };
  EV.a1_cardsharp = function () { return AE.has('card_deck') ? AE.Arcana.duel('sharp') : sayAs('CARD SHARP', 'Cards? You? Come back with a deck, kid.'); };

  // ---------- the Pit ----------
  const ROUNDS = [
    { foes: ['pit_brawler', 'pit_brawler'], prize: 200, name: 'the Ash Lane Brawlers' },
    { foes: ['pit_hound', 'pit_hound', 'pit_hound'], prize: 300, name: 'Vorn\'s Hounds' },
    { foes: ['pit_lizard', 'hawk'], prize: 400, name: 'a Drake and its handler\'s hawk' },
    { foes: ['pit_twin', 'pit_twin'], prize: 600, name: 'the Ogre Twins' },
    { foes: ['gorr'], prize: 2000, name: 'GORR THE UNBROKEN', boss: 1 }];
  EV.a1_pit = async function () {
    const k = Q('pit') === 'done' ? 5 : (Q('pit') || 0);
    if (k >= 5) {
      const r = await AE.ask('PITMASTER VORN: The champion returns! Want a rematch with Gorr, for the crowd? No prize but glory.', ['Fight Gorr', 'Not now'], { name: 'PITMASTER VORN', cancel: 1 });
      if (r === 0) await cs.battle(['gorr'], { bg: 'ruins', boss: 1 });
      return;
    }
    const R = ROUNDS[k];
    if (k === 0) await sayAs('PITMASTER VORN', 'Fresh meat! Five bouts. Win them all and you face Gorr the Unbroken. Lose, and you walk out. Or get carried.');
    const c = await AE.ask('PITMASTER VORN: Bout ' + (k + 1) + ' of 5: ' + R.name + '. Entry is 100 G. Prize ' + R.prize + ' G. Ready?', ['Fight', 'Not yet'], { name: 'PITMASTER VORN', cancel: 1 });
    if (c !== 0) return;
    if (!AE.pay(100)) { await sayAs('PITMASTER VORN', 'No money, no blood. Come back richer.'); return; }
    const res = await cs.battle(R.foes, { bg: 'ruins', boss: R.boss, noRun: 1, canLose: 1 });
    if (res !== 'win') { AE.healAll(); await sayAs('PITMASTER VORN', 'Carried out! Ha! The crowd loved it. Heal up and try again.'); return; }
    AE.S_.gold += R.prize; AE.Sfx.play('coin'); await AE.notice('Won ' + R.prize + ' G');
    if (k === 4) {
      Q('pit', 'done');
      await sayAs('PITMASTER VORN', 'GORR IS BROKEN! Thirty-one wins and the Warden breaks him! The crowd is losing its mind!');
      await sayAs('GORR', '...Good fight. Here. I won this off an old man. He fought better than he drank. Give it back to him.');
      await AE.gain('hask_badge'); await AE.gain('power_wrist');
      return;
    }
    Q('pit', k + 1);
    await sayAs('PITMASTER VORN', ['Not bad! Next up, my hounds. They bite.', 'Still standing! Next bout\'s a drake. Bring water.', 'The crowd knows your name now! The Ogre Twins are waiting.', 'Only one left. Gorr. Rest first. Pray, if you\'re the sort.'][k]);
  };

  // ---------- Wardens' Hall bounties ----------
  EV.a1_bounty_board = async function () {
    const L = ['WARDENS\' HALL - HALCYON CHAPTER. Open bounties:'];
    L.push(Q('b_rustback') === 'done' ? '[CLAIMED] Rustback - a giant red crawler in Drain 9.' : 'RUSTBACK. A giant crawler nesting in the upper tunnels of Drain 9. 600 G.');
    L.push(Q('b_leviathan') === 'done' ? '[CLAIMED] The Sump Leviathan.' : 'THE SUMP LEVIATHAN. Something huge in the deep cistern of Drain 9. 1,500 G and a Prism.');
    for (const l of L) await AE.say(l);
  };
  EV.a1_bounty = async function () {
    let paid = false;
    if (F().bounty_rustback && Q('b_rustback') !== 'done') { Q('b_rustback', 'done'); AE.S_.gold += 600; paid = true; await sayAs('WARDEN CLERK', 'Rustback, confirmed dead. 600 gold, Warden. Sign here. And here. And here.'); await AE.notice('Received 600 G'); }
    if (F().bounty_leviathan && Q('b_leviathan') !== 'done') { Q('b_leviathan', 'done'); AE.S_.gold += 1500; paid = true; await sayAs('WARDEN CLERK', 'The Sump Leviathan! The whole Hall owes you a drink. 1,500 gold, and the chapter\'s own Prism.'); await AE.notice('Received 1,500 G'); await AE.gain('prism:elemental'); }
    if (!paid) await sayAs('WARDEN CLERK', 'Bounties are on the board. Kill the thing, come back, get paid. Academy badge? Good. No forms for you, then. Some forms.');
    if (!Q('b_rustback')) Q('b_rustback', 1); if (!Q('b_leviathan')) Q('b_leviathan', 1);
  };
  EV.a1_rustback = async function () {
    if (F().bounty_rustback) return;
    await AE.say('Webs as thick as rope. Something red and enormous unfolds from the ceiling.');
    const r = await cs.battle(['rustback'], { bg: 'cave', boss: 1, noRun: 1 });
    cs.flag('bounty_rustback'); await AE.say('Rustback is dead. Claim the bounty at the Wardens\' Hall.');
  };
  EV.a1_leviathan = async function () {
    if (F().bounty_leviathan) return;
    await cs.shake(30);
    await AE.say('The sewage heaves. A vast pale squid rises from the cistern, its eyes like drain covers.');
    if (AE.S_.party.indexOf('lyra') >= 0) await cs.s('lyra', 'It\'s been drinking the runoff from the reactors. It\'s full of the flow. Poor thing. Big, angry poor thing.');
    await cs.battle(['leviathan'], { bg: 'swamp', boss: 1, noRun: 1 });
    cs.flag('bounty_leviathan'); await AE.say('The Sump Leviathan sinks for good. Claim the bounty at the Wardens\' Hall.');
  };
})();

/* ================= Act I: Halcyon — the main story =================
   Flags in order: a1_open_done, r4_gate_open, r4_in, r4_door, r4_boss, esc_drago, esc_collapse, a1_fell, a1_woke, a1_rest,
   a1_spill, a1_plan, a1_seal, a1_stair, spire_brute, a1_view, a1_plaza, a1_lobby, a1_records, a1_specimen, a1_exec,
   a1_vault, a1_drago, a1_yards_in, a1_train (Act I ends). */
(function () {
  const cs = AE.cs, EV = AE.EV, F = function () { return AE.S_.flags; };
  const s = function (who, t) { return cs.s(who, t); };
  const sayAs = function (name, t) { return AE.say(t, { name: name }); };

  AE.START = { map: 'r4_gate', x: 5, y: 6, dir: 1, inv: { potion: 4, phoenix_down: 1 } };
  AE.ITEMS.glowcap = { name: 'Glowcap', k: true, desc: 'A mushroom that shines in the dark. Doc Marrow needs it for medicine.' };
  AE.ITEMS.tam_medicine = { name: 'Lung Tonic', k: true, desc: 'Doc Marrow\'s medicine for Tam Teller.' };
  AE.ITEMS.pell_letter = { name: 'Letter to Osk', k: true, desc: 'Mrs Pell\'s letter for Granny Osk, from her grandson.' };
  AE.ITEMS.hask_badge = { name: 'Warden\'s Badge', k: true, desc: 'A tarnished Warden badge. Old Hask lost it to Gorr in the Pit.' };
  AE.ITEMS.pit_pass = { name: 'Pit Fighter\'s Tag', k: true, desc: 'Lets you enter the Pit\'s tournament.' };

  // ---------- the opening: the night train to Reactor 4 ----------
  EV['enter:r4_gate'] = async function () {
    if (F().a1_open_done) return;
    const f = AE.field(); f.player.dir = 1;
    await cs.narrate(['Aethra.', 'Beneath its earth runs the Aetherflow: the living memory of everything that has ever been.',
      'Where the flow wells up, it hardens into Crystal. Four Crystals hold the islands of the upper sky aloft.',
      'In the city of Halcyon, Aurex Dynamics drinks the Aetherflow through eight great reactors, and sells the light back by the hour.',
      'Tonight, a newly sworn Warden of the Vanguard Academy takes his first contract.']);
    await cs.title('HALCYON', 'Reactor 4 - Outer Gate', 160);
    cs.music('reactor');
    await cs.walk('bram', 'D1L10', 1); cs.face('bram', 0); cs.face('hero', 2);
    await s('bram', 'So you\'re the Warden the Academy sent. I asked for a squad. They sent me a boy and a sword.');
    await s('kael', 'Warden contract one-one-two-seven. Escort Undercurrent into Reactor 4, and out again. Payment on completion.');
    await s('kael', 'What you do inside isn\'t my business.');
    await s('bram', 'Hah! They teach you to talk like a ledger at that school? Bram Hollis. I run this outfit.');
    await cs.walk('sable', 'D1L19', 2); cs.face('sable', 3);
    await s('sable', 'And I\'m the one who actually gets the doors open. Sable. Don\'t touch my things.');
    await s('sable', 'Ooh, an Academy sword. That\'s worth more than this whole platform.');
    await s('kael', 'It isn\'t for sale.');
    await s('sable', 'Everything\'s for sale, Warden. Just not everything\'s for sale to you.');
    cs.face('pip', 3); cs.face('marlo', 3);
    await sayAs('PIP', 'Pip! I carry the explosives. Mostly I don\'t drop them.');
    await sayAs('MARLO', 'Marlo. Ignore Pip. Don\'t ignore the explosives.');
    await s('bram', 'Here\'s the job. We go in, we plant one door charge on the core intake, we get out. Nobody gets hurt.');
    await s('bram', 'Aurex shuts Reactor 4 for a month, Halcyon gets a month of the Aetherflow left alone. That\'s all Undercurrent wants.');
    await s('kael', '...A month.');
    await s('bram', 'You got a problem with that, Warden?');
    await s('kael', 'Not my business.');
    // the patrol
    AE.Sfx.play('buzz'); await cs.shake(20);
    cs.spawn('t1', 'trooper', 18, 9, 1); cs.spawn('t2', 'trooper', 19, 9, 1);
    await cs.together([['t1', 'U3', 2], ['t2', 'U3', 2]]);
    await sayAs('AUREX TROOPER', 'Hold it! This platform is closed to the public!');
    await s('bram', 'We\'re not the public, son.');
    await AE.say('Battle tip: when a fighter\'s gauge fills, choose a command. Attack with your weapon, or open Magic to use a Prism\'s spells. Items heal.', { name: 'TIP' });
    AE.setParty(['kael', 'bram', 'sable'], 1);
    AE.slotPrism('kael', 'restore'); AE.slotPrism('bram', 'bolt'); AE.slotPrism('sable', 'steal');
    const r = await cs.battle(['a_trooper', 'a_trooper'], { bg: 'reactor', noRun: 1 });
    cs.remove('t1'); cs.remove('t2'); cs.remove('bram'); cs.remove('sable');
    await s('bram', 'Not bad, kid. Not bad at all.');
    await AE.say('Kael equipped a Restore Prism (Cure). Bram has Bolt, Sable has Steal. Open the menu (C) and choose Prisms to slot more as you find them.', { name: 'TIP' });
    await s('sable', 'Gate console\'s by the crates. Give me ten seconds and an Academy sword to hold.');
    await s('kael', 'You can have the ten seconds.');
    cs.flag('a1_open_done');
  };
  EV.a1_gate_console = async function () {
    if (F().r4_gate_open) { await AE.say('The console blinks: GATE OPEN. MAINTENANCE OVERRIDE.'); return; }
    await s('sable', 'Let\'s see... Aurex passcodes are always someone\'s birthday. Corvin Aurex, born the fifth of Harrowmonth...');
    AE.Sfx.play('ok'); await AE.wait(30); AE.Sfx.play('door');
    await s('sable', 'And we\'re in. Told you. Ten seconds.');
    await sayAs('PIP', 'We\'ll hold the platform and keep the train warm. Go!');
    cs.flag('r4_gate_open'); cs.flag('r4_in');
  };
  EV.a1_gate_locked = async function () { if (!F().r4_gate_open) await AE.say('The reactor gate is sealed. The console on the platform must control it.'); };
  EV.a1_pip = async function () { await sayAs('PIP', F().r4_gate_open ? 'Go! The train leaves when the charge goes, with or without you!' : 'Sable\'s the one with the codes. I\'m the one with the... other things.'); };
  EV.a1_marlo = async function () { await sayAs('MARLO', 'Twelve years I\'ve watched that chimney. Twelve years of grey sky. Tonight it stops.'); };
  EV.a1_bram_gate = async function () { await s('bram', 'Ready when you are, Warden.'); };
  EV.a1_sable_gate = async function () { await s('sable', 'Don\'t look at me like that. I said I wouldn\'t steal the sword. I didn\'t say anything about your wallet.'); };
  EV.a1_marlo_heal = async function () {
    await sayAs('MARLO', 'You look rough. Here, field kit. Patch yourselves up.');
    AE.healAll(); AE.Sfx.play('heal'); await AE.notice('The party is fully healed.');
  };
  // the shutter in the Pressure Hall: Lyra's voice on the intercom
  EV.a1_r4_door = async function () {
    await AE.say('A security shutter blocks the stairs. A speaker grille crackles beside it.');
    await sayAs('VOICE', '...Hello? Is someone at shutter nine? The sensors say three people. Three people who aren\'t on my roster.');
    await s('bram', 'Undercurrent. We\'re expected.');
    await sayAs('VOICE', 'You\'re LATE, is what you are. The relief shift starts in forty minutes.');
    await sayAs('VOICE', 'Listen. I\'ll open it. But you promised a door charge. Just the intake. If you hurt anything else down there...');
    await sayAs('VOICE', '...it\'s already hurting. Can\'t you hear it? No. Of course you can\'t.');
    await s('kael', 'Who is that?');
    await s('bram', 'Our friend on the inside. Don\'t ask her name. She\'d have to stop being our friend.');
    AE.Sfx.play('door'); cs.flag('r4_door');
  };

  // ---------- the core ----------
  EV['enter:r4_core'] = async function () {
    if (F().r4_boss) return;
    cs.spawn('lyra', 'lyra', 16, 7, 0);
  };
  EV.a1_bulwark = async function () {
    if (F().r4_boss) return;
    const f = AE.field();
    await cs.pan(16, 8, 30);
    cs.face('lyra', 2); await cs.emote('lyra', '!');
    await s('lyra', 'Stop! Don\'t come any closer to the core. It\'s... it\'s awake tonight.');
    await s('bram', 'So you\'re the voice. You\'re just a kid.');
    await s('lyra', 'I\'m eighteen and I\'m a level-three technician and I just betrayed my employer for you, so maybe be nice?');
    await s('kael', '...The crystal\'s glowing.');
    await s('lyra', 'It does that when it\'s scared. Everyone thinks the Aetherflow is just fuel. It isn\'t. It remembers. It\'s screaming.');
    await s('sable', 'Charming. Can we blow it up now?');
    AE.Sfx.play('quake'); await cs.shake(40);
    await s('lyra', 'Oh no. That\'s the core guardian. They said it was decommissioned!');
    await AE.say('A Warden-class security mech drops from the gantry above, steam pouring from its joints.');
    await sayAs('BULWARK', 'INTRUDERS DETECTED IN CORE LEVEL. LETHAL FORCE AUTHORISED.');
    cs.hide('lyra');
    const r = await cs.battle(['bulwark'], { bg: 'reactor', boss: 1, noRun: 1 });
    cs.hide('lyra', false); cs.flag('r4_boss');
    await s('bram', 'Now. Pip\'s charge, on the intake, and we walk.');
    await cs.walk('hero', 'U1');
    await s('lyra', 'That\'s not a door charge. That\'s... Bram, that\'s ten times the charge you promised me!');
    await s('bram', 'That\'s the charge Pip packed. It\'s a door charge. It\'s the same charge we always...');
    AE.Sfx.play('buzz'); await cs.shake(30);
    await sayAs('PA SYSTEM', 'Attention. Core overload sequence authorised. Reactor 4 personnel, evacuate. You have four minutes.');
    await sayAs('PA SYSTEM', 'Authorisation: Lune. Vesper. Chief Engineer.');
    await s('lyra', 'Dr. Lune? She\'s... she\'s not stopping it. She\'s STARTING it!');
    await s('bram', 'Our charge isn\'t even armed! Sable!');
    await s('sable', 'Not us! The core\'s doing it by itself! RUN!');
    await s('bram', 'Sable, with me, the main lift to the train! Warden! Get the girl out by the service catwalk, it\'s faster!');
    await s('kael', 'That\'s not in the contract.');
    await s('bram', 'Then I\'m adding it! GO!');
    AE.away('bram'); AE.away('sable');
    await cs.join('lyra', Math.max(4, AE.S_.m.kael.lv));
    AE.setParty(['kael', 'lyra']); AE.slotPrism('lyra', 'ice'); AE.slotPrism('lyra', 'restore');
    AE.Timer.start(240, 'timeout_reactor');
    await cs.warp('r4_escape', 69, 9, 3);
    await AE.say('Four minutes. Follow the service catwalk west, down under the plate.', { name: 'LYRA' });
  };
  EV['enter:r4_escape'] = async function () { if (!AE.S_.timer && !F().a1_fell) AE.Timer.start(240, 'timeout_reactor'); };
  EV.a1_esc_drago = async function () {
    cs.flag('esc_drago');
    cs.spawn('drago', 'drago', 51, 9, 1);
    await cs.walk('drago', 'D0'); await cs.walk('drago', 'R1');
    await sayAs('???', 'A Warden. Here. Of all the reactors in Halcyon.');
    await sayAs('DRAGO', 'Captain Drago Venn, Aurex Security. And you\'re late for your own funeral, both of you.');
    await s('lyra', 'Captain, the reactor\'s overloading, we have to...');
    await sayAs('DRAGO', 'I know what it\'s doing. I know who told it to.');
    await sayAs('DRAGO', 'Warden. The Academy sends me its roster every season. There\'s no Kael on this year\'s oath.');
    await s('kael', '...How do you know my name?');
    await sayAs('DRAGO', 'That\'s the question, isn\'t it. Go on. Run. I\'d rather fight you on a better day.');
    await cs.walk('drago', 'D2', 2); cs.remove('drago');
    await s('lyra', 'Who WAS that?');
    await s('kael', 'Someone who reads rosters.');
  };
  EV.a1_esc_collapse = async function () {
    cs.flag('esc_collapse'); await cs.shake(40);
    await AE.say('Behind you, a whole length of catwalk tears loose and spins down into the dark.');
    await s('lyra', 'Don\'t stop! Don\'t look down! Definitely don\'t look down!');
  };
  EV.a1_fall = async function () {
    AE.Timer.stop();
    await s('lyra', 'It ends here! It just... ends! Where\'s the rest of it?!');
    await cs.shake(60); AE.game.flash = 20;
    await s('kael', 'Lyra. Hold on to me.');
    await s('lyra', 'What? Why? What are you...');
    AE.Sfx.play('boom'); AE.game.flash = 40; await AE.wait(40);
    await cs.narrate(['Reactor 4 tore itself apart.', 'The blast lifted the plate above it like a sheet of paper, and dropped it on twelve streets of the Sumps.',
      'Two figures fell with it.', '...', 'The Aetherflow caught them. Or something in it did.']);
    cs.flag('a1_fell');
    await cs.warp('sumps', 10, 10, 2);
  };

  // ---------- the Sumps ----------
  EV['enter:sumps'] = async function () {
    if (!F().a1_fell || F().a1_woke) return;
    cs.music('sad');
    cs.pose('hero', 'b_dead'); cs.spawn('lyra', 'lyra', 12, 8, 3);
    await AE.wait(60);
    await s('lyra', '...Hey. Hey, Warden. You\'re lying on my flowers.');
    cs.pose('hero', null); await cs.jump('hero'); cs.face('hero', 1);
    await s('kael', '...We\'re alive.');
    await s('lyra', 'We\'re alive. We fell, I don\'t know, a hundred metres? And we landed in the one soft place in the whole Sumps.');
    await s('lyra', 'My crystal-moss. It only grows for me. And it caught us. That doesn\'t happen.');
    await s('kael', 'You said the Aetherflow was screaming. In the core.');
    await s('lyra', '...You remember that? Most people just tell me I\'m strange.');
    await s('lyra', 'I hear it. I always have. Like a choir in the next room. My Nan says my mother heard it too.');
    await s('lyra', 'And when we fell... it said a name. Not mine. I think it was yours, but it was... wrong somehow.');
    await s('kael', 'Kael Ardent.');
    await s('lyra', 'Kael. Okay. I\'m Lyra. Lyra Vale. Thanks for not letting go.');
    await s('kael', 'My contract was with Bram. I need to find him.');
    await s('lyra', 'If Bram\'s alive, he\'ll be at the Spillway. Everyone ends up at the Spillway eventually.');
    await s('lyra', 'But first my house. It\'s just east of here. Nan Corra will want to see I\'m in one piece, and you look like you need a bed.');
    cs.remove('lyra'); cs.flag('a1_woke'); cs.music('slums');
    await AE.say('Lyra\'s house is east of the flower bed. The Spillway is the big hall south-west of Cinder Square.', { name: 'TIP' });
  };
  EV.a1_flowerbed = async function () {
    if (AE.S_.party.indexOf('lyra') >= 0 && F().a1_woke) { await s('lyra', 'They\'re called crystal-moss. They drink the Aetherflow from the ground and turn it into light. No reactor needed.'); return; }
    await AE.say('Pale flowers glow faintly between the scrap.');
  };
  EV.a1_corra = async function () {
    if (!F().a1_rest) {
      await sayAs('NAN CORRA', 'Lyra Vale! Out all night, and the whole sky falling, and you come home looking like you were thrown out of a reactor!');
      await s('lyra', 'Nan, I was thrown out of a reactor.');
      await sayAs('NAN CORRA', 'Don\'t you joke at me. And who is this? He\'s bleeding on my floor.');
      await s('kael', 'Kael. Sorry about the floor.');
      await sayAs('NAN CORRA', 'Polite, at least. Both of you, into the back. Sleep. We\'ll talk when you can stand up straight.');
      await AE.say('Rest in the beds at the back of the room.', { name: 'TIP' });
      return;
    }
    if (!F().a1_spill) { await sayAs('NAN CORRA', 'Go find your Bram, then. And Kael. Bring her back to me.'); return; }
    await sayAs('NAN CORRA', 'I raised that girl from a bundle on my doorstep. Her mother left her with a song and nothing else.');
    await sayAs('NAN CORRA', 'She is going to do something brave and stupid, Warden. When she does, be standing next to her.');
    AE.healAll(); await AE.notice('Nan Corra patches everyone up. The party is fully healed.');
  };
  EV.a1_lyra_bed = async function () {
    if (F().a1_rest) { await AE.say('Lyra\'s bed. A stuffed talonbird with one eye watches you.'); return; }
    await AE.game.fadeOut(0.03); AE.healAll(); cs.music('quiet');
    await cs.narrate(['The radio in the kitchen murmurs through the night.', 'AUREX NEWS: Terrorists of the group calling itself Undercurrent have destroyed Reactor 4.',
      'Early reports suggest more than two hundred dead in the Ash Lane collapse.', 'President Corvin Aurex has declared a Containment Order for the undercity. Citizens are asked to remain calm.',
      'Morning comes. In the Sumps, it looks the same as night.']);
    cs.flag('a1_rest'); await AE.game.fadeIn(0.03); cs.music('village');
    await s('lyra', 'Two hundred people. Bram didn\'t do that. He couldn\'t have. He carries sweets in his pocket for the kids on Lantern Row.');
    await s('kael', 'The charge in the core was never armed. The reactor went up by itself.');
    await s('lyra', 'Not by itself. You heard the PA. "Authorisation: Lune."');
    await s('lyra', 'Dr. Vesper Lune. Chief Engineer. She runs every reactor in Halcyon. I\'ve seen her twice. She was kind to me, once.');
    await s('lyra', 'Why would she blow up her own reactor?');
    await s('kael', 'Not my business. My business is Bram, and my pay.');
    await s('lyra', 'Wow. Okay. I\'m coming with you anyway, so you\'d better get used to my business too.');
  };

  // ---------- the Spillway ----------
  EV['enter:spillway'] = EV.a1_spillway_enter = async function () {
    if (F().a1_spill) return;
    if (!F().a1_woke) return;
    cs.spawn('bram', 'bram', 15, 8, 2); cs.spawn('sable', 'sable', 16, 8, 2);
    await AE.wait(20); cs.face('bram', 2);
    await s('bram', 'WARDEN! Ha! I knew it, I told Sable, nothing that stubborn dies from a little fall!');
    await s('sable', 'He said, and I quote, "the boy\'s jam on a plate now". Hi, Warden.');
    await cs.walk('hero', 'U3');
    await s('kael', 'You told me it was a door charge.');
    await s('bram', 'It WAS a door charge! I swear it on my men, on every one of them. It was never even armed.');
    await s('sable', 'We were on the train when it went. Pip saw the core flash before anything touched it.');
    await s('lyra', 'It was Dr. Lune. Vesper Lune. She started the overload from somewhere else. I heard her code on the PA.');
    await s('bram', '...Aurex\'s chief engineer blew her own reactor and dropped the plate on Ash Lane. And now Aurex says it was us.');
    await s('bram', 'Two hundred people. My name on all of them.');
    await s('kael', 'The contract was in and out. I got you in. You got yourselves out. One thousand five hundred.');
    await s('sable', 'Oh, he\'s cold. I like him. I don\'t trust him, but I like him.');
    await s('bram', '...Fair\'s fair. You did your job.');
    AE.S_.gold += 1500; AE.Sfx.play('coin'); await AE.notice('Received 1,500 G');
    await s('bram', 'Come down to the hideout when you\'re ready. Behind the bar, down the stairs. I might have another job, if you\'ve the stomach.');
    cs.remove('bram'); cs.remove('sable'); cs.flag('a1_spill');
    await sayAs('TESS', 'And you two, wipe your feet. This is a respectable terrorist bar.');
  };
  EV.a1_tess = async function () {
    if (!F().a1_spill) { await sayAs('TESS', 'Lyra! Gods, girl, they said Reactor 4 went up with the night shift in it.'); return; }
    const r = await AE.ask('TESS: What\'ll it be?', ['Drink (heals, 30 G)', 'Rumours', 'Nothing'], { name: 'TESS', cancel: 2 });
    if (r === 0) { if (!AE.pay(30)) { await sayAs('TESS', 'No tabs. Not after Pip.'); return; } AE.healAll(); AE.Sfx.play('heal'); await sayAs('TESS', 'On the house. Well. On thirty gold of the house.'); return; }
    if (r === 1) {
      const R = ['Gorr the Unbroken fights in the Pit at the Market Ward. Thirty-one wins. If you beat him, folk say Old Hask wants a word.',
        'Drain 9\'s got something living in it. The Wardens\' Hall has a bounty out. Big money.', 'Doc Marrow\'s been asking after a Glowcap mushroom. Grows deep in the drains.',
        'The Spire Stair goes all the way up the plate pillar. Sable knows a way past the guards. Sable knows a way past everything.'];
      await sayAs('TESS', R[AE.rand(R.length)]);
    }
  };
  EV.a1_pip_bar = async function () { await sayAs('PIP', 'I checked my charge a hundred times. A hundred! It never even blinked. Someone else blew that core.'); };
  EV.a1_marlo_bar = async function () { await sayAs('MARLO', 'My sister lived on Ash Lane. ...Lives. She lives on Ash Lane. I haven\'t been to look.'); };

  EV.a1_bram_hideout = async function () {
    if (F().a1_plan) { await s('bram', 'Spire Stair\'s in the north-east of the Sumps. Sable will meet you there. Stock up first.'); return; }
    cs.music('story');
    await s('bram', 'Here\'s the truth of it. Aurex is calling us murderers on every radio in Halcyon. Undercurrent\'s finished unless we prove otherwise.');
    await s('lyra', 'Dr. Lune\'s authorisation will be on the reactor logs. In Aurex Tower. On the plate.');
    await s('sable', 'Seventy floors up and every lift guarded. Easy.');
    AE.Sfx.play('buzz'); await cs.shake(20);
    await sayAs('RADIO', 'By order of President Aurex: under the Containment Order, all lifts between the undercity and the plate are sealed, effective immediately.');
    await sayAs('RADIO', 'Residents of the Sumps will remain below until the terrorists responsible for Reactor 4 are surrendered.');
    cs.flag('a1_seal');
    await s('bram', '...They\'re going to starve the Sumps until somebody hands us over.');
    await s('sable', 'Then we don\'t take the lifts. The Spire Stair. It\'s the maintenance scaffold up the side of the plate pillar. Six storeys of rust and wind.');
    await s('sable', 'There\'s a barricade and a few bored guards at the bottom. I can deal with bored.');
    await s('bram', 'Up the Stair, across the plate, into the Tower. We take the logs and put Vesper Lune\'s name on every radio in the city.');
    await s('bram', 'Warden. You\'ve done your contract. I can\'t pay you for this one. Not much, anyway.');
    await s('kael', '...');
    await s('lyra', 'Then I\'ll pay him.');
    await s('kael', 'With what?');
    await s('lyra', 'Crystal-moss. A whole bed of it. It\'s the only thing in the Sumps that glows without a reactor. Worth more than gold, if you ask me.');
    await s('kael', 'That\'s not how contracts work.');
    await s('lyra', 'It is today.');
    await s('kael', '...Warden contract one-one-two-eight. Client: Lyra Vale. Escort the client to Aurex Tower, and out again.');
    await s('sable', 'He said yes! Bram, he said yes in his ledger voice!');
    await s('bram', 'HA! Welcome to Undercurrent, Warden. Unofficially. We\'ll have badges made.');
    AE.away('bram', false); AE.away('sable', false);
    AE.setParty(['kael', 'lyra', 'bram']);
    await AE.say('Bram and Sable rejoin. Up to three fight at once: change who fights with Order in the menu (C) or at any save crystal.', { name: 'TIP' });
    await s('sable', 'I\'ll go ahead and get friendly with the guards. Meet me at the Spire Stair, north-east, when you\'re stocked up.');
    await s('sable', 'And Warden? The Market Ward\'s east along Lantern Row. The Pit pays well. Just saying.');
    cs.flag('a1_plan'); cs.remove('bram'); cs.remove('sable'); cs.music('slums');
  };
  EV.a1_sable_hideout = async function () { await s('sable', 'Bram\'s the plan. I\'m the part of the plan that actually works.'); };

  // ---------- the Spire Stair ----------
  EV.a1_stair_locked = async function () {
    if (F().a1_stair) return;
    if (!F().a1_plan) { await AE.say('An Aurex barricade seals the Spire Stair. Guards stand behind it.'); return; }
    if (AE.S_.party.indexOf('sable') < 0) { AE.setParty(AE.S_.party.slice(0, 2).concat(['sable'])); }
    await s('sable', 'There you are. I\'ve made friends with the guards. Well. I\'ve made them very confused.');
    await sayAs('AUREX SERGEANT', 'You! That\'s the girl from the reactor broadcast! Detain them!');
    await s('sable', '...Friends was a strong word.');
    await cs.battle(['patrol', 'a_trooper', 'a_trooper'], { bg: 'factory', noRun: 1 });
    await s('sable', 'Right. The lock\'s a Corvin special. Someone\'s birthday...');
    AE.Sfx.play('door'); cs.flag('a1_stair');
    await s('bram', 'Six floors up, lads. Don\'t look down. Seriously, Pip fell off this thing once.');
    await s('lyra', 'Is Pip all right?');
    await s('bram', 'Pip landed on Marlo. Marlo\'s never forgiven him.');
  };
  EV.a1_brute = async function () {
    if (F().spire_brute) return;
    AE.Sfx.play('quake'); await cs.shake(30);
    await AE.say('A hulking work-brute in a welded harness swings down from the crane, a steel girder in its fists.');
    await s('bram', 'Aurex uses those for heavy lifting. Somebody\'s told this one to lift US.');
    await cs.battle(['brute'], { bg: 'factory', boss: 1, noRun: 1 });
    cs.flag('spire_brute');
    await s('sable', 'And it had a pocket full of gold. I checked. Professional courtesy.');
  };
  EV.a1_view = async function () {
    cs.flag('a1_view'); cs.music('melancholy');
    await AE.say('The scaffold opens onto the wind. Below, all of Halcyon spreads out in rings of light. Below that, the dark of the Sumps.');
    await s('lyra', 'I\'ve never been this high. I\'ve never seen the plate from the outside.');
    await s('lyra', 'It\'s beautiful. That\'s the worst part. It\'s really beautiful.');
    await s('bram', 'I used to stand guard up here. Aurex knight-captain Hollis, polished boots and all.');
    await s('sable', 'You never told me that.');
    await s('bram', 'Not a time I\'m proud of. ...Let it lie, Sable.');
    await s('lyra', 'Kael, where are you from? Really from?');
    await s('kael', 'Thornbrook. A village in Meridia, across the water. It burned when I was twelve.');
    await s('lyra', 'I\'m sorry.');
    await s('kael', 'I don\'t remember the fire. I remember the day after. Ash, coming down like snow. And a woman calling everyone\'s names in the street.');
    await s('kael', 'She called mine three times before I answered. As if I didn\'t know it was mine.');
    await s('sable', '...');
    await s('bram', '...');
    await s('lyra', 'Well. You know it now. Kael Ardent, who won\'t let go.');
    cs.music('factory');
  };

  // ---------- the upper plate and Aurex Tower ----------
  EV.a1_plaza = async function () {
    cs.flag('a1_plaza');
    await AE.say('Aurex Plaza. Clean stone, real trees, and a sky you can see. The tower doors stand ahead.');
    await s('lyra', 'Trees. They have TREES up here.');
    await sayAs('TOWER GUARD', 'Halt! Identification!');
    await s('bram', 'Here\'s my identification.');
    await cs.battle(['secoff', 'secoff'], { bg: 'city', noRun: 1 });
    await s('sable', 'Front door. Bold. I\'d never do it this way.');
    await s('bram', 'That\'s why I do the plans.');
  };
  EV.a1_receptionist = async function () {
    if (!F().a1_lobby) { await sayAs('RECEPTIONIST', 'Welcome to Aurex Dynamics. Do you have an appointment?'); return; }
    await sayAs('RECEPTIONIST', 'Please don\'t hurt me. The stairs are behind the desk. The lifts are off for "security".');
    await sayAs('RECEPTIONIST', '...The Executive Floor is the sixth. If anyone asks, I told you nothing. I\'ve been looking for a new job anyway.');
  };
  EV.a1_lobby = async function () {
    cs.flag('a1_lobby');
    await sayAs('RECEPTIONIST', 'Welcome to Aurex Dynamics. Do you have an appointment?');
    await s('kael', 'No.');
    await sayAs('RECEPTIONIST', 'Then please take a seat. The current wait is approximately... oh. Oh, you\'re the terrorists.');
    AE.Sfx.play('buzz'); await cs.shake(20);
    await sayAs('SPEAKER', 'Security breach in the lobby. All units.');
    await cs.battle(['secoff', 'sentinel', 'secoff'], { bg: 'city', noRun: 1 });
    await s('lyra', 'Stairs behind the desk. Up!');
  };
  EV.a1_records = async function () {
    if (F().a1_records) { await AE.say('Filing drawers, emptied by Sable with great professionalism.'); return; }
    if (!AE.S_.m.sable) { await AE.say('Filing drawers, locked.'); return; }
    await s('sable', 'Records. Ooh, locked drawers. Locked drawers are just drawers that are shy.');
    await AE.wait(30); AE.Sfx.play('chest');
    await s('sable', 'Reactor logs, reactor logs... no. Wait. This one\'s sealed in Lune\'s colour. "PROJECT CRADLE."');
    await AE.gain('vesper_file');
    await s('sable', '"Phase three. Vessel Seven, designation ARDENT, lost during the Reactor 4 field test. Recovery priority: absolute."');
    await s('lyra', 'Ardent. Kael, that\'s your...');
    await s('kael', 'It\'s a common name in Meridia.');
    await s('sable', '...It isn\'t, though.');
    await s('bram', 'Vessel. What in all the deeps is a vessel?');
    await s('sable', '"Vessel Seven exhibits stable memory transfer from the donor. Subject believes himself to be the donor." ...That\'s all. The rest\'s in the Cradle vault, seventh floor.');
    await s('kael', 'Then that\'s where we go. For the logs.');
    await s('lyra', 'For the logs. Sure.');
    cs.flag('a1_records');
  };
  EV.a1_specimen = async function () {
    AE.Sfx.play('quake'); await cs.shake(40);
    await AE.say('Every tank in the lab cracks at once. Something tall and pale climbs out of the largest, trailing light like a wet sheet.');
    await s('lyra', 'It\'s... made of the flow. Raw Aetherflow, poured into a shape. And it\'s singing.');
    await s('lyra', 'That\'s my lullaby. Why does it know my lullaby?!');
    await cs.battle(['h0'], { bg: 'city', boss: 1, noRun: 1 });
    cs.flag('a1_specimen');
    await s('lyra', 'It stopped singing. ...It sounded relieved.');
    await s('bram', 'Upstairs. Before Aurex grows another one.');
  };
  EV.a1_exec = async function () {
    cs.flag('a1_exec'); cs.music('revelation');
    await AE.say('Voices from the boardroom. Bram waves everyone down behind the partition.');
    cs.spawn('corvin', 'corvin', 13, 6, 2); cs.spawn('vesper', 'vesper', 22, 6, 2); cs.spawn('dragoX', 'drago', 28, 6, 2);
    cs.spawn('b1', 'Noble', 16, 8, 1); cs.spawn('b2', 'Sultan', 19, 8, 1); cs.spawn('b3', 'OldMan2', 25, 8, 1);
    await cs.pan(19, 6, 50);
    await sayAs('CORVIN AUREX', 'Reactor 4 has cost us four percent of output. It has also handed us a war we can sell. Every family on the plate is afraid of the dark now.');
    await sayAs('CORVIN AUREX', 'Afraid people pay for light, gentlemen. Afraid people pay double.');
    await sayAs('BOARD MEMBER', 'And the Sumps?');
    await sayAs('CORVIN AUREX', 'Sealed until Undercurrent is hanged in the Market Ward. Captain Venn assures me it will be quick.');
    await sayAs('DRAGO', 'I assured you it would be thorough, sir. I said nothing about quick.');
    await sayAs('CORVIN AUREX', 'Dr. Lune. Your little science project. The board would like to know why it needed a whole reactor.');
    await sayAs('VESPER', 'Because Reactor 4 sat on the deepest vein of the Aetherflow in Halcyon, President. And because my Vessel needed to come home.');
    await sayAs('VESPER', 'Project Cradle is ahead of schedule. Seven years of failures, and then he simply walked into my reactor on his own two feet.');
    await sayAs('VESPER', 'Once the four Crystals are drained, the Sky Citadel rises. You will have the only throne in the sky.');
    await sayAs('CORVIN AUREX', 'A throne. Yes. Good. Thrones are good business.');
    await sayAs('VESPER', 'They are the only business.');
    await AE.wait(30); cs.face('vesper', 2); await cs.pan(AE.field().player.x, AE.field().player.y, 40);
    await sayAs('VESPER', '...Come up to the vault when you\'re ready, bright boy. I left the door open for you.');
    await cs.pan(19, 6, 30);
    await sayAs('CORVIN AUREX', 'Doctor? Who are you talking to?');
    await sayAs('VESPER', 'Old friends. Meeting adjourned.');
    await AE.game.fadeOut(0.05);
    ['corvin', 'vesper', 'dragoX', 'b1', 'b2', 'b3'].forEach(cs.remove);
    cs.follow(); await AE.game.fadeIn(0.05);
    await s('lyra', 'She knew we were here. She looked right at you, Kael.');
    await s('bram', '"Drain the four Crystals." The Crystals hold up the sky. Even Aurex isn\'t that mad.');
    await s('sable', 'Not Aurex. Her. Corvin thinks it\'s a business plan. She doesn\'t.');
    await s('kael', 'The vault. The logs will be there.');
    await s('lyra', 'Kael...');
    await s('kael', 'The logs.');
    cs.music('city');
  };
  EV.a1_tank = async function () { await AE.say('A tank of pale fluid. Inside floats a sleeping young man with your face. A plate reads: VESSEL 3 - DEGRADED. DO NOT WAKE.'); };
  EV.a1_tank2 = async function () { await AE.say('Another tank. Another sleeper with your face, thinner, older somehow. VESSEL 5 - MEMORY REJECTED. SUBJECT REVERTED.'); };
  EV.a1_vault = async function () {
    cs.flag('a1_vault'); cs.music('mystic');
    await AE.say('Rows of tanks glow in the dark. In every one floats a young man with silver-blond hair, eyes closed. Every one of them has Kael\'s face.');
    await s('bram', 'Deeps preserve us.');
    await s('kael', '...They\'re not me.');
    await s('lyra', 'Kael, look at me. Look at me, not at them.');
    cs.spawn('vesper', 'vesper', 17, 7, 2);
    await AE.wait(30); AE.Sfx.play('echo');
    await sayAs('VESPER', 'They\'re not you. You\'re right, bright boy. They\'re what you would have been if you had not come out right.');
    await sayAs('VESPER', 'Seven tries. Seven sleeping boys. And then you. The one who walked out of Thornbrook\'s ashes believing every word of a dead man\'s memories.');
    AE.game.flash = 10; await cs.shake(20);
    await s('kael', 'Get... out of my head.');
    await sayAs('VESPER', 'Oh, I\'m not in your head. You\'re in mine. You always have been.');
    await sayAs('VESPER', 'Mother Ilse used to say you would forget your own name if it weren\'t sewn into your coat. Do you remember Mother Ilse, Kael?');
    await s('sable', '...');
    await s('lyra', 'Leave him alone!');
    await sayAs('VESPER', 'A Chorus girl. Of course. The flow brings its singers together at the end of things. You hear it weeping, don\'t you, little one?');
    await sayAs('VESPER', 'I\'m going to make it stop. I\'m going to make everything stop hurting. You will see.');
    await s('bram', 'You dropped a plate on two hundred people!');
    await sayAs('VESPER', 'Two hundred and twelve. I counted, Captain Hollis. I always count. You should try it some time. Thornbrook, for instance.');
    await s('bram', '...!');
    await sayAs('VESPER', 'Go on up to the roof, children. Drago so wants to meet you properly. And Kael... when the Crystals call you, answer. You won\'t be able to help it.');
    await AE.game.fadeOut(0.06); cs.remove('vesper'); await AE.game.fadeIn(0.06);
    await s('lyra', 'She\'s gone. Kael? Kael, talk to me.');
    await s('kael', 'I remember Thornbrook. I remember the well and the mill and the orphanage on the hill. I remember the fire. I REMEMBER it.');
    await s('lyra', 'Then it\'s yours. Whatever she says. Come on. The roof.');
    await s('sable', '(...Mother Ilse.)');
    AE.Sfx.play('door');
  };
  EV.a1_drago = async function () {
    cs.flag('a1_drago'); cs.music('boss');
    cs.spawn('drago', 'drago', 21, 13, 2); cs.spawn('g1', 'officer', 19, 14, 2); cs.spawn('g2', 'officer', 23, 14, 2);
    await cs.pan(21, 15, 30);
    await sayAs('DRAGO', 'There you are. The Warden who isn\'t on the roster, the Chorus girl, the thief, and... Captain Hollis. I wondered when.');
    await s('bram', 'Venn. Still polishing Aurex\'s boots?');
    await sayAs('DRAGO', 'Still running from what you did in them?');
    await sayAs('DRAGO', 'Warden. You want to know what you are? So do I. Let\'s find out the honest way.');
    await cs.battle(['secoff', 'drago1', 'secoff'], { bg: 'sky', boss: 1, noRun: 1 });
    cs.remove('g1'); cs.remove('g2'); cs.follow();
    await sayAs('DRAGO', 'Ha... You fight like the Academy. Every textbook stance, perfect. Too perfect. Like someone learned you out of a book.');
    AE.Sfx.play('quake'); await cs.shake(30);
    await AE.say('An Aurex gunship rises beside the roof. Drago steps back onto its ramp.');
    await sayAs('DRAGO', 'This isn\'t over. I\'ll be the one who finds out what you are. Not her.');
    cs.remove('drago');
    await s('bram', 'Cargo lift! East edge of the roof! It runs straight down to the Rail Yards!');
    await s('sable', 'We\'re leaving Halcyon? Without the logs?');
    await s('lyra', 'We have the Cradle file. And Vesper\'s going after the Crystals. Somebody has to get there first.');
  };
  EV.a1_cargo_lift = async function () {
    const r = await AE.ask('Take the cargo lift down to the Rail Yards? (You can\'t come back up.)', ['Go', 'Not yet'], { cancel: 1 });
    if (r !== 0) return;
    AE.Sfx.play('door'); await cs.warp('railyards', AE.MAPS.railyards.entry[0], AE.MAPS.railyards.entry[1], 2);
  };
  EV.a1_yards_in = async function () {
    cs.flag('a1_yards_in');
    await s('sable', 'The Rail Yards. Freight Nine leaves for the Ashfields on the hour, and it never stops for anyone.');
    await s('bram', 'Then we don\'t ask it to. Through the yards, onto the engine, out of Halcyon.');
    await s('lyra', 'Nan Corra... Pip, Marlo, the Sumps...');
    await s('bram', 'The Sumps has survived Aurex for forty years. It\'ll survive one more month. But Vesper won\'t stop at one city.');
    await s('kael', 'The contract was the tower and out again. This is the out again.');
    await s('lyra', '...Thank you, Kael.');
  };
  EV.a1_train = async function () {
    cs.flag('a1_train');
    await AE.say('Freight Nine hisses at the platform, steam boiling off its iron flanks. Something huge and armoured climbs down from the engine roof.');
    await sayAs('IRON JUGGERNAUT', 'RAIL SECURITY UNIT ONE. ALL OUTBOUND TRAFFIC SUSPENDED. COMPLY.');
    await s('sable', 'A rail guardian. They bolted a rail guardian to the train.');
    await s('bram', 'Then we unbolt it!');
    await cs.battle(['juggernaut'], { bg: 'factory', boss: 1, noRun: 1 });
    cs.music('story');
    await cs.narrate(['Freight Nine tore out of the Halcyon yards at dawn, four stowaways in its coal tender.',
      'Behind them, the plate shone like a crown over the dark of the Sumps.', 'Ahead lay the Ashfields, and beyond them, the whole of Meridia.',
      'Somewhere in a laboratory in the sky, a woman with silver hair smiled, and wrote a seventh name in her ledger.']);
    await cs.title('END OF ACT I', 'HALCYON', 180);
    cs.chapter(2); cs.flag('a1_done');
    await AE.say('The whole world is open to you now. Thornbrook lies east across the Ashfields. Use the map (M) to find your way.', { name: 'TIP' });
    const p = AE.landNear(80, 97);
    AE.toWorld(p[0], p[1]);
  };
  // after Act I, Halcyon is sealed
  EV['place:halcyon'] = async function () { await AE.notice('Halcyon\'s gates are sealed under the Containment Order.'); };
})();

// the nearest walkable world tile to (x, y)
AE.landNear = function (x, y) {
  for (let r = 0; r < 30; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    if (AE.WALK.foot.indexOf(AE.wtile(x + dx, y + dy)) >= 0) return [x + dx, y + dy];
  }
  return [x, y];
};

/* ================= Act II enemies, bosses, encounter tables and shops (Meridia) ================= */
(function () {
  const E = AE.E, K = AE.K;
  K('thorn_lash', { name: 'Thorn Lash', kind: 'phys', power: 1.3, hits: 2, fx: 'claw' });
  K('pollen', { name: 'Pollen Cloud', kind: 'mag', power: 3, status: ['sleep', 'blind'], hit: 35, all: 1, fx: 'poison' });
  K('root_bind', { name: 'Root Bind', kind: 'phys', power: 1.2, status: ['slow'], hit: 40, fx: 'quake' });
  K('sap_mend', { name: 'Sap', kind: 'heal', power: 22, target: 'self', fx: 'heal' });
  K('peck', { name: 'Peck Flurry', kind: 'phys', power: 0.6, hits: 3, fx: 'bite' });
  K('mist_breath', { name: 'Mist Breath', kind: 'mag', power: 5, elem: 'water', all: 1, fx: 'water' });
  K('earth_spike', { name: 'Stone Spike', kind: 'mag', power: 6, elem: 'earth', fx: 'quake' });
  K('burrow_bite', { name: 'Burrow', kind: 'phys', power: 1.7, fx: 'quake' });
  K('cave_in', { name: 'Cave-In', kind: 'mag', power: 7, elem: 'earth', all: 1, fx: 'quake' });
  K('sand_blast', { name: 'Sand Blast', kind: 'mag', power: 5, elem: 'earth', status: ['blind'], hit: 40, all: 1, fx: 'quake' });
  K('sting', { name: 'Sting', kind: 'phys', power: 1.4, status: ['poison'], hit: 50, fx: 'bite' });
  K('shiv', { name: 'Shiv', kind: 'phys', power: 1.5, crit: 1, fx: 'cut' });
  K('bone_rattle', { name: 'Bone Rattle', kind: 'mag', power: 5, elem: 'dark', status: ['confuse'], hit: 25, fx: 'dark' });
  K('drain_touch', { name: 'Grave Touch', kind: 'drain', power: 6, elem: 'dark', fx: 'dark' });
  K('gale', { name: 'Gale', kind: 'mag', power: 7, elem: 'wind', all: 1, fx: 'wind' });
  K('wind_blade', { name: 'Wind Blade', kind: 'mag', power: 9, elem: 'wind', fx: 'wind' });
  K('drill', { name: 'Drill Arm', kind: 'phys', power: 1.8, pierce: 1, fx: 'boom' });
  // bosses
  K('tm_crush', { name: 'Elder Crush', kind: 'phys', power: 2.0, fx: 'quake' });
  K('tm_spores', { name: 'Choking Spores', kind: 'mag', power: 4, status: ['poison', 'silence'], hit: 45, all: 1, fx: 'poison' });
  K('harl_burst', { name: 'Burst Fire', kind: 'phys', power: 0.7, hits: 4, fx: 'shot', sure: 1 });
  K('harl_snipe', { name: 'Gun-Arm Snipe', kind: 'phys', power: 2.4, fx: 'shot', sure: 1, pierce: 1 });
  K('harl_grenade', { name: 'Incendiary', kind: 'mag', power: 7, elem: 'fire', all: 1, fx: 'boom' });
  K('mk_dig', { name: 'Tunnel Strike', kind: 'phys', power: 2.1, fx: 'quake' });
  K('mk_quake', { name: 'Collapse', kind: 'mag', power: 9, elem: 'earth', all: 1, fx: 'quake' });
  K('lich_doom', { name: 'Toll of Graves', kind: 'mag', power: 2, status: ['doom'], hit: 30, fx: 'dark' });
  K('lich_bolt', { name: 'Ghostfire', kind: 'mag', power: 9, elem: 'dark', all: 1, fx: 'dark' });
  K('lich_raise', { name: 'Dark Mend', kind: 'heal', power: 30, target: 'self', fx: 'dark' });
  K('dv2_lunge', { name: 'Venn Lunge', kind: 'phys', power: 2.1, pierce: 1, fx: 'slash' });
  K('dv2_storm', { name: 'Halberd Storm', kind: 'phys', power: 0.55, hits: 4, fx: 'slash' });
  K('te_vortex', { name: 'Vortex Intake', kind: 'mag', power: 11, elem: 'wind', all: 1, fx: 'wind' });
  K('te_siphon', { name: 'Crystal Siphon', kind: 'drainmp', power: 30, all: 1, fx: 'spark' });
  K('te_piston', { name: 'Piston Hammer', kind: 'phys', power: 2.2, fx: 'boom' });
  K('te_overheat', { name: 'Overheat', kind: 'mag', power: 15, elem: 'fire', all: 1, fx: 'boom' });

  // ---------- the Ashfields and Meridia (world) ----------
  E('ashhound', 'Ash Hound', 16, 520, 48, 24, 10, 16, 32, 150, 11, 90, { mon: 'Beast', hue: 330, bright: 0.8 }, { weak: ['water'], ai: [[3, 'attack'], [1, 'frenzy']] });
  E('cinderling', 'Cinderling', 17, 430, 30, 20, 40, 30, 22, 160, 12, 80, { mon: 'Flam' }, { absorb: ['fire'], weak: ['water', 'ice'], ai: [[1, 'attack'], [3, 'fire_spell']] });
  E('scavenger', 'Scavenger Bird', 16, 460, 44, 20, 12, 18, 34, 148, 11, 110, { mon: 'Owl', hue: 20 }, { weak: ['bolt'], float: 1, ai: [[2, 'attack'], [2, 'peck']] });
  E('fieldmole', 'Field Mole', 18, 640, 52, 30, 10, 18, 18, 176, 12, 100, { mon: 'Mole' }, { weak: ['water'], ai: [[3, 'attack'], [1, 'burrow_bite']], drop: [['greens', 0.2]] });
  E('meadowbee', 'Meadow Wasp', 19, 500, 50, 22, 18, 20, 36, 184, 13, 90, { mon: 'Butterfly', hue: 40 }, { weak: ['wind', 'fire'], float: 1, ai: [[2, 'attack'], [2, 'sting']] });
  E('roadbandit', 'Road Bandit', 20, 720, 56, 30, 14, 22, 28, 210, 14, 260, { cast: 'marlo', hue: 60 }, { ai: [[3, 'attack'], [1, 'shiv'], [1, 'pilfer']], steal: [['hi_potion', 0.5]] });
  E('thornboar', 'Thornback', 21, 900, 60, 36, 10, 20, 22, 230, 15, 140, { mon: 'Panda', hue: 100 }, { weak: ['fire'], ai: [[3, 'attack'], [1, 'thorn_lash']] });
  // ---------- Mistwood ----------
  E('mistsprite', 'Mist Sprite', 19, 480, 30, 24, 46, 40, 30, 190, 14, 80, { mon: 'Spirit2', hue: 120 }, { weak: ['fire'], absorb: ['water'], float: 1, ai: [[1, 'attack'], [2, 'mist_breath'], [1, 'pollen']] });
  E('bloomtrap', 'Bloomtrap', 20, 760, 54, 32, 30, 24, 14, 210, 15, 90, { mon: 'Mushroom', hue: 300 }, { weak: ['fire'], ai: [[2, 'attack'], [1, 'pollen'], [1, 'root_bind']], steal: [['echo_screen', 1]] });
  E('mossbear', 'Moss Bear', 21, 1100, 64, 34, 10, 20, 20, 240, 16, 120, { mon: 'Bear', hue: 90 }, { weak: ['fire'], ai: [[3, 'attack'], [1, 'maul']] });
  E('wildtalon', 'Wild Talonbird', 20, 620, 56, 26, 14, 20, 40, 220, 15, 60, { mon: 'Owl2', hue: 60 }, { weak: ['bolt'], ai: [[2, 'attack'], [2, 'peck']], steal: [['greens', 1]] });
  E('fogsnake', 'Fog Viper', 20, 640, 58, 26, 20, 20, 30, 216, 15, 90, { mon: 'Snake3' }, { weak: ['ice'], ai: [[2, 'attack'], [2, 'sting']] });
  E('thornmaw', 'Thornmaw', 24, 12500, 70, 40, 44, 34, 22, 4400, 140, 2400, { boss: 'GiantBamboo', anim: 'Idle', fw: 62, fh: 62, k: 1.9, hue: 60 },
    { boss: 1, weak: ['fire'], absorb: ['earth'], ai: 'thornmaw', steal: [['prism:added', 0.3], ['x_potion', 1]] });
  AE.AI.thornmaw = function (f, B) {
    const v = f.ai.vars; v.t = (v.t || 0) + 1;
    if (f.hp < f.maxhp * 0.35 && !v.sap) { v.sap = 1; return AE.mkAct(f, B, 'sap_mend'); }
    if (v.t % 4 === 0) return AE.mkAct(f, B, 'tm_spores');
    return AE.mkAct(f, B, ['attack', 'tm_crush', 'thorn_lash', 'root_bind'][AE.rand(4)]);
  };
  // ---------- the mesa, Spire Prison ----------
  E('sandworm', 'Mesa Burrower', 22, 1000, 62, 34, 20, 22, 20, 260, 17, 160, { mon: 'Larva', k: 2.6, hue: 30 }, { weak: ['water', 'ice'], ai: [[2, 'attack'], [1, 'sand_blast'], [1, 'burrow_bite']] });
  E('scorpid', 'Dune Scorpid', 22, 820, 64, 40, 10, 18, 26, 250, 17, 150, { mon: 'SpiderRed', hue: 30 }, { weak: ['water'], ai: [[2, 'attack'], [2, 'sting']] });
  E('convict', 'Pit Convict', 22, 900, 62, 30, 14, 20, 26, 260, 17, 200, { cast: 'pip', hue: 180 }, { ai: [[3, 'attack'], [2, 'shiv']], steal: [['hi_potion', 0.5]] });
  E('pitdog', 'Pit Dog', 21, 700, 60, 26, 8, 16, 36, 240, 16, 100, { mon: 'Beast', hue: 40 }, { ai: [[3, 'attack'], [1, 'frenzy']] });
  E('harl', 'Harl Mercer', 26, 15000, 74, 40, 30, 32, 30, 5200, 160, 3000, { cast: 'gunner', k: 1.5, hue: 300 },
    { boss: 1, ai: 'harl', steal: [['prism:long_range', 0.3], ['hero_tonic', 1]], drop: [['card:c_harl', 1]] });
  AE.AI.harl = function (f, B) {
    const v = f.ai.vars; v.t = (v.t || 0) + 1;
    if (v.t % 4 === 0) return AE.mkAct(f, B, 'harl_grenade');
    if (f.hp < f.maxhp * 0.5 && v.t % 3 === 0) return AE.mkAct(f, B, 'harl_snipe');
    return AE.mkAct(f, B, Math.random() < 0.5 ? 'harl_burst' : 'attack');
  };
  // ---------- the Old Mine ----------
  E('minemole', 'Shaft Mole', 22, 980, 66, 40, 10, 20, 20, 270, 18, 140, { mon: 'Mole2' }, { weak: ['water'], ai: [[3, 'attack'], [1, 'burrow_bite']] });
  E('rockbiter', 'Rockbiter', 23, 1200, 70, 56, 10, 20, 14, 290, 19, 160, { mon: 'Cyclope', k: 2.4, hue: 30 }, { weak: ['water', 'bolt'], ai: [[3, 'attack'], [1, 'smash']] });
  E('glowbat', 'Glow Bat', 21, 640, 56, 24, 30, 26, 38, 250, 17, 90, { mon: 'YellowsBat' }, { weak: ['wind'], float: 1, ai: [[2, 'attack'], [1, 'flare_beam'], [1, 'drain_touch']] });
  E('oreslime', 'Ore Slime', 22, 860, 50, 60, 30, 10, 12, 260, 18, 300, { mon: 'Slime4' }, { weak: ['fire', 'bolt'], ai: [[2, 'attack'], [1, 'earth_spike']], steal: [['power_source', 0.02]] });
  E('moleking', 'Mole King', 28, 17000, 78, 46, 34, 30, 22, 6200, 180, 3600, { boss: 'GiantRacoon', anim: 'Idle', fw: 60, fh: 60, k: 1.8, hue: 230, bright: 0.85 },
    { boss: 1, weak: ['water'], absorb: ['earth'], ai: [[3, 'attack'], [2, 'mk_dig'], [1, 'mk_quake']], steal: [['prism:earth', 0.4], ['guard_source', 1]] });
  // ---------- Windhaven: catacombs and the Wind Shrine ----------
  E('bonewalker', 'Bonewalker', 24, 1100, 70, 38, 20, 30, 22, 300, 20, 170, { mon: 'Skull' }, { undead: 1, weak: ['holy', 'fire'], ai: [[3, 'attack'], [1, 'bone_rattle']] });
  E('shade', 'Catacomb Shade', 24, 900, 40, 30, 54, 48, 28, 310, 21, 120, { mon: 'Spirit', hue: 250, bright: 0.7 }, { undead: 1, weak: ['holy'], absorb: ['dark'], float: 1, ai: [[1, 'attack'], [2, 'drain_touch'], [1, 'void_touch']] });
  E('urnsnake', 'Urn Serpent', 24, 980, 70, 34, 20, 24, 30, 304, 20, 180, { mon: 'Snake4' }, { weak: ['ice'], ai: [[2, 'attack'], [2, 'sting']] });
  E('lich', 'Ossuary Warden', 28, 16000, 50, 40, 64, 50, 26, 6000, 180, 3000, { boss: 'GiantFlam', anim: 'Idle', fw: 50, fh: 50, k: 2, hue: 220, bright: 0.8 },
    { boss: 1, undead: 1, weak: ['holy', 'fire'], absorb: ['dark'], ai: 'lich', steal: [['prism:seal', 0.3], ['x_potion', 1]] });
  AE.AI.lich = function (f, B) {
    const v = f.ai.vars; v.t = (v.t || 0) + 1;
    if (v.t % 5 === 1) return AE.mkAct(f, B, 'lich_doom');
    if (f.hp < f.maxhp * 0.3 && !v.mend) { v.mend = 1; return AE.mkAct(f, B, 'lich_raise'); }
    return AE.mkAct(f, B, Math.random() < 0.55 ? 'lich_bolt' : 'drain_touch');
  };
  E('galeimp', 'Gale Imp', 25, 900, 60, 30, 50, 40, 40, 320, 22, 160, { mon: 'KappaGreen' }, { absorb: ['wind'], weak: ['earth'], ai: [[1, 'attack'], [2, 'wind_blade'], [1, 'gale']] });
  E('shrinegolem', 'Shrine Guardian', 26, 1600, 76, 60, 20, 40, 16, 360, 24, 200, { mon: 'Cyclope2', k: 2.6, sat: 0.4, bright: 1.2 }, { weak: ['bolt'], ai: [[3, 'attack'], [1, 'smash']] });
  E('drillbot', 'Aurex Drill Unit', 25, 1200, 74, 50, 20, 24, 20, 330, 22, 260, { mon: 'Eye2', k: 2.4, hue: 10 }, { weak: ['bolt', 'water'], ai: [[2, 'attack'], [2, 'drill']] });
  E('windtrooper', 'Aurex Windtrooper', 25, 1000, 70, 40, 24, 30, 30, 320, 22, 300, { cast: 'trooper', hue: 160 }, { ai: [[3, 'attack'], [1, 'grenade_toss'], [1, 'rifle_shot']], steal: [['hi_potion', 0.6]] });
  E('drago2', 'Captain Drago Venn', 27, 16000, 82, 46, 36, 38, 32, 6400, 180, 4000, { cast: 'drago', k: 1.4 },
    { boss: 1, ai: 'drago2', steal: [['prism:quick', 0.25], ['speed_source', 1]] });
  AE.AI.drago2 = function (f, B) {
    const v = f.ai.vars; v.t = (v.t || 0) + 1;
    if (v.t === 1) return AE.mkAct(f, B, 'dv_order');
    if (v.t % 4 === 0) return AE.mkAct(f, B, 'dv2_storm');
    return AE.mkAct(f, B, Math.random() < 0.5 ? 'dv2_lunge' : 'attack');
  };
  E('tempest', 'Tempest Engine', 30, 24000, 84, 52, 56, 40, 24, 9000, 240, 5000, { boss: 'TenguBlue', anim: 'Idle', fw: 68, fh: 68, k: 1.7, sat: 0.35, bright: 0.9 },
    { boss: 1, weak: ['bolt', 'water'], absorb: ['wind'], ai: 'tempest', steal: [['prism:speed_plus', 0.3], ['x_potion', 1]] });
  AE.AI.tempest = function (f, B) {
    const v = f.ai.vars; v.t = (v.t || 0) + 1;
    if (f.hp < f.maxhp * 0.5 && !v.hot) { v.hot = 1; B.say('Tempest Engine: PRESSURE CRITICAL', 80); }
    if (v.hot && v.t % 3 === 0) return AE.mkAct(f, B, 'te_overheat');
    if (v.t % 4 === 0) return AE.mkAct(f, B, 'te_vortex');
    if (v.t % 5 === 2) return AE.mkAct(f, B, 'te_siphon');
    return AE.mkAct(f, B, Math.random() < 0.5 ? 'te_piston' : 'attack');
  };

  // ---------- encounter tables ----------
  const T = function (bg, sets) { return { bg: bg, sets: sets.map(function (s) { return { enemies: s[0], w: s[1] || 1 }; }) }; };
  AE.ENC.w_ashfields = T('plains', [[['ashhound', 'ashhound'], 3], [['cinderling', 'scavenger'], 2], [['ashhound', 'cinderling', 'scavenger'], 1], [['scavenger', 'scavenger', 'scavenger'], 1]]);
  AE.ENC.w_meridia_n = T('grass', [[['fieldmole', 'meadowbee'], 3], [['roadbandit', 'roadbandit'], 2], [['wildtalon'], 2], [['meadowbee', 'meadowbee', 'meadowbee'], 1], [['thornboar'], 2]]);
  AE.ENC.w_meridia_n_forest = T('forest', [[['thornboar', 'fogsnake'], 2], [['mossbear'], 2], [['meadowbee', 'fogsnake'], 2]]);
  AE.ENC.w_meridia_s = T('grass', [[['fieldmole', 'roadbandit'], 2], [['thornboar', 'meadowbee'], 2], [['wildtalon', 'wildtalon'], 1]]);
  AE.ENC.w_mesa = T('desert', [[['sandworm'], 2], [['scorpid', 'scorpid'], 3], [['sandworm', 'scorpid'], 1]]);
  AE.ENC.mistwood = T('forest', [[['mistsprite', 'mistsprite'], 3], [['bloomtrap', 'fogsnake'], 2], [['mossbear'], 2], [['wildtalon', 'mistsprite'], 1], [['bloomtrap', 'bloomtrap', 'mistsprite'], 1]]);
  AE.ENC.prison = T('desert', [[['convict', 'convict'], 3], [['pitdog', 'pitdog', 'convict'], 2], [['scorpid', 'sandworm'], 1]]);
  AE.ENC.mine = T('cave', [[['minemole', 'glowbat'], 3], [['rockbiter'], 2], [['oreslime', 'oreslime'], 1], [['glowbat', 'glowbat', 'minemole'], 2]]);
  AE.ENC.catacombs = T('temple', [[['bonewalker', 'bonewalker'], 3], [['shade', 'urnsnake'], 2], [['shade', 'shade', 'bonewalker'], 1]]);
  AE.ENC.shrine = T('temple', [[['galeimp', 'galeimp'], 2], [['shrinegolem'], 2], [['drillbot', 'windtrooper'], 3], [['windtrooper', 'windtrooper', 'galeimp'], 1]]);
  AE.ENC.arena = T('ruins', [[['roadbandit', 'roadbandit', 'roadbandit']], [['mossbear', 'thornboar']], [['rockbiter', 'oreslime']], [['shrinegolem']], [['convict', 'convict', 'pitdog']]]);

  // ---------- Arcana cards for Meridia ----------
  const C = AE.CARD, m = function (k, o) { return Object.assign({ mon: k }, o || {}); };
  C('c_ashhound', 'Ash Hound', 3, [6, 5, 2, 4], m('Beast', { hue: 330 }), 'fire');
  C('c_mole', 'Field Mole', 3, [3, 7, 5, 2], m('Mole'), 'earth');
  C('c_wasp', 'Meadow Wasp', 3, [5, 2, 3, 7], m('Butterfly', { hue: 40 }), 'poison');
  C('c_mistsprite', 'Mist Sprite', 4, [3, 7, 4, 6], m('Spirit2', { hue: 120 }), 'water');
  C('c_mossbear', 'Moss Bear', 4, [7, 3, 7, 3], m('Bear', { hue: 90 }), 'earth');
  C('c_talon', 'Wild Talonbird', 4, [6, 6, 4, 4], m('Owl2', { hue: 60 }), 'wind');
  C('c_scorpid', 'Dune Scorpid', 5, [7, 2, 6, 7], m('SpiderRed', { hue: 30 }), 'poison');
  C('c_rockbiter', 'Rockbiter', 5, [5, 7, 7, 3], m('Cyclope', { hue: 30 }), 'earth');
  C('c_shade', 'Catacomb Shade', 5, [7, 6, 3, 6], m('Spirit', { hue: 250 }), 'dark');
  C('c_galeimp', 'Gale Imp', 5, [4, 6, 7, 5], m('KappaGreen'), 'wind');
  C('c_thornmaw', 'Thornmaw', 6, [8, 4, 6, 7], { boss: 'GiantBamboo', fw: 62, fh: 62, hue: 60 }, 'earth');
  C('c_harl', 'Harl Mercer', 7, [7, 8, 3, 8], { cast: 'gunner', hue: 300 }, 'fire');
  C('c_moleking', 'Mole King', 7, [8, 7, 7, 4], { boss: 'GiantRacoon', fw: 60, fh: 60, hue: 230 }, 'earth');
  C('c_lich', 'Ossuary Warden', 7, [5, 8, 8, 5], { boss: 'GiantFlam', fw: 50, fh: 50, hue: 220 }, 'dark');
  C('c_tempest', 'Tempest Engine', 8, [9, 6, 8, 6], { boss: 'TenguBlue', fw: 68, fh: 68, sat: 0.35 }, 'wind');
  C('c_ilse', 'Mother Ilse', 8, [4, 9, 9, 6], { cast: 'ilse' }, 'holy');
  C('c_sylphine', 'Sylphine', 9, [9, 9, 5, 8], { mon: 'Butterfly', hue: 120 }, 'wind');
  const Dd = { ashhound: 'c_ashhound', fieldmole: 'c_mole', meadowbee: 'c_wasp', mistsprite: 'c_mistsprite', mossbear: 'c_mossbear', wildtalon: 'c_talon', scorpid: 'c_scorpid',
    rockbiter: 'c_rockbiter', shade: 'c_shade', galeimp: 'c_galeimp', thornmaw: 'c_thornmaw', moleking: 'c_moleking', lich: 'c_lich', tempest: 'c_tempest' };
  Object.keys(Dd).forEach(function (e) { const X = AE.ENEMIES[e]; X.drop = (X.drop || []).concat([['card:' + Dd[e], X.boss ? 1 : 0.05]]); });
  Object.assign(AE.ARCANA_FOES, {
    orphan: { name: 'ORPHAN', deck: ['c_rat', 'c_bat', 'c_talon', 'c_mole', 'c_wasp', 'c_slime'], rules: [], wit: 0.4, hi: 'Mother Ilse taught me Arcana! I\'m very good. I\'m the best in the house.', lose: 'You didn\'t cheat? Swear on your coat?' },
    spire: { name: 'CARD PLAYER', deck: ['c_mistsprite', 'c_mossbear', 'c_ashhound', 'c_scorpid', 'c_rockbiter', 'c_wasp'], rules: ['same'], wit: 0.7, hi: 'The Spire plays Same. You knew that, right?', lose: 'Hm. You\'ve played before.' },
    master: { name: 'ARCANA MASTER', deck: ['c_shade', 'c_galeimp', 'c_thornmaw', 'c_harl', 'c_moleking', 'c_rockbiter', 'c_ilse'], rules: ['same', 'elemental'], wit: 1, hi: 'I am the Master of the Arcana Hall. Every rule, every trick. Shall we?', lose: 'A new master walks the Spire. Remarkable.' },
    duchess: { name: 'DUCHESS', deck: ['c_bulwark', 'c_leviathan', 'c_gorr', 'c_talon', 'c_scorpid', 'c_mossbear'], rules: ['elemental'], wit: 0.8, hi: 'I collect monsters, darling. On cards. The real ones smell.', lose: 'How tiresome. Take your card.' },
    monk: { name: 'MONK', deck: ['c_failed', 'c_shade', 'c_mistsprite', 'c_wisp', 'c_h0', 'c_galeimp'], rules: ['same'], wit: 0.85, hi: 'Every card is a memory. Shall we trade some?', lose: 'The flow gives, and the flow takes.' }
  });

  // ---------- shops ----------
  AE.SHOPS.th_items = { name: 'Thornbrook Goods', items: ['potion', 'hi_potion', 'phoenix_down', 'antidote', 'eye_drops', 'echo_screen', 'soft', 'tent', 'greens'] };
  AE.SHOPS.th_arms = { name: 'Ironbark Smithy', items: ['wind_cutter', 'mending_rod', 'breach_lance', 'mythril_knife', 'titan_band', 'mythril_vest', 'silk_robe'] };
  AE.SHOPS.th_prism = { name: 'Wren\'s Prisms', items: ['prism:fire', 'prism:ice', 'prism:bolt', 'prism:aero', 'prism:restore', 'prism:heal', 'prism:barrier', 'prism:all', 'prism:hp_plus', 'prism:steal'] };
  AE.SHOPS.ks_shop = { name: 'Feed & Tack', items: ['greens', 'sweetroot', 'potion', 'hi_potion', 'tent'] };
  AE.SHOPS.wh_items = { name: 'Pilgrim Supplies', items: ['hi_potion', 'phoenix_down', 'remedy', 'ether', 'tent', 'soft', 'smoke_bomb'] };
  AE.SHOPS.wh_arms = { name: 'Windsmith', items: ['dawn_edge', 'lumen_staff', 'volt_lance', 'viper_fang', 'carbon_band', 'mage_coat', 'headband', 'swift_boots'] };
  AE.SHOPS.wh_prism = { name: 'Shrine Prisms', items: ['prism:aero', 'prism:earth', 'prism:revive', 'prism:time', 'prism:mystify', 'prism:elemental', 'prism:added', 'prism:mp_plus', 'prism:cover'] };
})();

/* ================= Act II: Meridia — story and side events ================= */
(function () {
  const cs = AE.cs, EV = AE.EV, F = function () { return AE.S_.flags; }, Q = AE.quest;
  const s = function (who, t) { return cs.s(who, t); }, sayAs = function (n, t) { return AE.say(t, { name: n }); };
  const inP = function (id) { return AE.S_.party.indexOf(id) >= 0 || AE.S_.reserve.indexOf(id) >= 0; };
  AE.ITEMS.old_drawing = { name: 'Child\'s Drawing', k: true, desc: 'Three children under a lantern: KAEL, VESPER, SABLE, in wax crayon.' };
  AE.ITEMS.keeper_key = { name: 'Windkeeper\'s Key', k: true, desc: 'Opens the Wind Shrine. Cold to the touch, and humming.' };
  AE.ITEMS.owner_pardon = { name: 'Owner\'s Pardon', k: true, desc: 'A gold-edged card: the bearer is welcome in the Gilded Spire.' };
  AE.QUESTS.chick = 'A lost talonbird chick';

  EV.inn_thorn = function () { return AE.inn(80); };
  EV.inn_kestrel = function () { return AE.inn(60, 'MARGA'); };
  EV.inn_spire = function () { return AE.inn(200, 'CONCIERGE'); };
  EV.inn_wind = function () { return AE.inn(120); };

  // ---------- Thornbrook ----------
  EV.a2_thorn = async function () {
    cs.flag('a2_thorn'); cs.music('melancholy');
    await s('kael', '...Thornbrook.');
    await s('lyra', 'Your village? It\'s lovely, Kael. It looks brand new.');
    await s('kael', 'It is brand new. That\'s what\'s wrong with it. The well was on the other side of the green. The mill had a red roof.');
    await s('bram', '...');
    await s('sable', 'Seven years is a long time. Places change.');
    await s('kael', 'People shouldn\'t. Nobody\'s looked at me twice.');
    cs.music('village');
  };
  EV.a2_memorial = async function () {
    await sayAs('MEMORIAL KEEPER', 'The fire took forty-one souls. Their names are cut in the stone.');
    await AE.say('Near the bottom of the stone, newly cleaned: KAEL ARDENT, WARDEN-IN-TRAINING. AGED 12. HE WENT BACK FOR THE CHILDREN.');
    await s('kael', '...That\'s a mistake.');
    await sayAs('MEMORIAL KEEPER', 'No mistake, young man. I carved it myself. Buried him myself, what the fire left.');
    if (inP('lyra')) await s('lyra', 'Kael...');
  };
  EV.a2_ilse = async function () {
    if (F().a2_ilse) { await sayAs('MOTHER ILSE', 'Stay for supper. Please. All of you. I\'ll set a place for... for whoever you are, love. It doesn\'t matter.'); return; }
    cs.flag('a2_ilse'); cs.music('sad');
    await sayAs('MOTHER ILSE', 'Visitors? How lovely. We don\'t get many, now that...');
    await AE.wait(30); cs.emote('ilse', '!');
    await sayAs('MOTHER ILSE', '...Kael? Kael Ardent?');
    await s('kael', 'Mother Ilse.');
    await sayAs('MOTHER ILSE', 'No. No, you can\'t be. I held your hand while they... You were twelve. You were so small.');
    await sayAs('MOTHER ILSE', 'But it\'s your face. Older. Your father\'s chin. And you stand with your left foot forward, just like you did, like the Academy books.');
    await sayAs('MOTHER ILSE', 'Let me see your coat. I sewed your name in every coat you ever owned. ...There\'s no name. There\'s no name in it.');
    await s('kael', 'I remember you. I remember this room. Beds by the window. You sang when the thunder came.');
    await sayAs('MOTHER ILSE', 'I did. I did. Oh, love. Oh, what did they do to you?');
    if (inP('sable')) {
      await sayAs('MOTHER ILSE', '...And that\'s... Sable? Little Sable, who stole all the jam?');
      await s('sable', 'Hi, Mother.');
      await s('lyra', 'Sable? You grew up HERE?');
      await s('sable', 'With him. With the real him. And with...');
      await sayAs('MOTHER ILSE', 'With Vesper. Our Vesper. She\'s at Aurex now, doing such important work. She sends money every month. She paid for every board of this house.');
    }
    await s('kael', 'Vesper paid for the village to be rebuilt.');
    await sayAs('MOTHER ILSE', 'She was always the clever one. Always counting things. Children, stars, pennies. She used to count you to sleep, Kael. One, two, three...');
    await AE.say('Kael\'s head rings like a struck bell.'); AE.game.flash = 8; await cs.shake(16);
    await sayAs('MOTHER ILSE', 'Stay with me tonight. All of you. Whoever you are, you are welcome in the Lantern House.');
    AE.healAll(); await AE.gain('cat_bell');
    if (inP('sable')) await s('sable', 'Sorry, Warden. I knew. Since Halcyon. I didn\'t know how to say it.');
    await s('kael', '...Say it when we\'re done. Not now.');
    cs.music('peaceful');
  };
  EV.a2_coats = async function () {
    await AE.say('A row of small coats on hooks. Names stitched inside each collar in careful thread: TOMAS. ELI. MIRA. VESPER (old, faded). SABLE (tiny, much mended). KAEL (scorched at the hem).');
  };
  EV.a2_fenn = async function () { await sayAs('MRS FENN', 'This was the Ardent house, before. Aurex gave it to us after the fire. Lovely people, they say. All gone.'); };
  EV.a2_ardent_drawer = async function () {
    if (AE.has('old_drawing')) { await AE.say('An empty drawer.'); return; }
    await AE.say('At the back of the drawer: a child\'s drawing, crumpled and smoke-stained.'); await AE.gain('old_drawing');
    await AE.say('Three children under a lantern. Above them in wax crayon: KAEL. VESPER. SABLE. The tallest one is holding everyone\'s hand.');
  };
  EV.a2_orphan_cards = function () { return AE.has('card_deck') ? AE.Arcana.duel('orphan') : sayAs('ORPHAN', 'Do you play Arcana? You need a deck first!'); };

  // ---------- Mistwood and Kestrel ----------
  EV.a2_thornmaw = async function () {
    cs.shake(20);
    await AE.say('The trees of the Elder Glade lean in. One of them opens a mouth full of thorns.');
    if (inP('lyra')) await s('lyra', 'It\'s old. Older than Halcyon. And it\'s furious. Something drank its roots dry.');
    await cs.battle(['thornmaw'], { bg: 'forest', boss: 1, noRun: 1 });
    cs.flag('a2_mist');
    if (inP('lyra')) await s('lyra', 'Aurex test wells, all along the glade. They\'re draining the whole forest to feed the Wind Shrine drills.');
  };
  EV.a2_chick = async function () {
    await AE.say('A fluffy talonbird chick, lost and cheeping.'); cs.flag('q_chick'); Q('chick', 1);
    cs.remove(AE.field().npcs.find(function (n) { return n.def && n.def.name === 'CHICK'; }).id);
    await AE.notice('The chick hops into Kael\'s pack.');
  };
  EV.a2_joda = async function () {
    if (F().a2_talon) { await sayAs('RANCHER JODA', 'Your bird waits outside the ranch gate. Ride it across shallow rivers, and nothing will dare jump you.'); return; }
    cs.flag('a2_talon');
    await sayAs('RANCHER JODA', 'You came through Mistwood? On FOOT? With Thornmaw in the glade? ...Huh. Thornmaw\'s dead? Then you\'ve done me a kindness.');
    await sayAs('RANCHER JODA', 'Here. A Ranch Pass, and the pick of my stable. Talonbirds are fast, they cross shallow rivers, and wild monsters won\'t come near one.');
    await AE.gain('ranch_pass'); await AE.gain('greens', 3);
    const p = AE.WORLD.places.kestrel; const q = AE.landNear(p[0], p[1] + 2); AE.S_.vehicles.talon = { x: q[0], y: q[1], have: 1 };
    await AE.notice('A talonbird waits outside Kestrel Ranch.');
    await sayAs('RANCHER JODA', 'The Gilded Spire\'s south-west, on the big mesa. They race talonbirds there. And north of here, the Old Mine cuts through to Windhaven.');
  };
  EV.a2_breeder = async function () {
    if (Q('chick') === 1) {
      Q('chick', 'done'); await sayAs('BREEDER TAL', 'Pip! Little Pip! You found her! She\'s our best racer\'s chick. Here, take these. And when she\'s grown, she\'s yours to race.');
      await AE.gain('sweetroot', 3); AE.S_.mybird = { name: 'Pip', spd: 7.5, sta: 70 }; await AE.notice('You can now race Pip at the Gilded Spire.'); return;
    }
    await sayAs('BREEDER TAL', 'Feed a bird Sweetroot before a race, and it\'ll run its heart out. That\'s the secret. Don\'t tell the Spire.');
    if (AE.S_.mybird && AE.has('sweetroot')) {
      const r = await AE.ask('Feed ' + AE.S_.mybird.name + ' a Sweetroot? (Better racing.)', ['Feed', 'Not now'], { cancel: 1 });
      if (r === 0) { AE.take('sweetroot'); AE.S_.mybird.spd = Math.min(12, AE.S_.mybird.spd + 0.5); AE.S_.mybird.sta += 6; await AE.notice(AE.S_.mybird.name + ' looks faster.'); }
    }
  };

  // ---------- the Gilded Spire ----------
  EV.a2_spire = async function () {
    cs.flag('a2_spire'); cs.music('spire');
    await AE.say('The Gilded Spire. Gold lamps, gold doors, and somewhere, always, the sound of coins.');
    if (inP('sable')) await s('sable', 'Oh, I LOVE it here. Nobody notices one more pair of hands.');
    if (inP('bram')) await s('bram', 'Keep your purses close. Especially near Sable.');
    await AE.say('The Arcana Hall, the Talon Track, the Battle Square and the slots all trade in Spire Tokens. The Exchange swaps them for prizes.', { name: 'TIP' });
  };
  EV.a2_murder = async function () {
    cs.flag('a2_framed'); cs.music('tension');
    await AE.say('A crowd around the hotel steps. Two Aurex officers lie dead, shot clean through.');
    await sayAs('SPIRE GUARD', 'There! Those are the Reactor 4 terrorists from the broadcasts! Seize them!');
    if (inP('bram')) { await s('bram', '...A clean shot through the plate armour. That\'s a gun-arm. I know that wound.'); }
    await s('kael', 'We didn\'t do this.');
    await sayAs('SPIRE GUARD', 'Tell it to the sand!');
    await AE.game.fadeOut(0.03);
    await cs.narrate(['The Spire\'s justice is simple. The accused are lowered into the desert pit below the mesa.', 'Nobody climbs out.']);
    await cs.warp('spire_prison', AE.MAPS.spire_prison.entry[0], AE.MAPS.spire_prison.entry[1], 2);
  };
  EV.a2_prison_in = async function () {
    cs.flag('a2_prison_in');
    await sayAs('PRISONER', 'New meat! Welcome to the pit. The only way out is up, and the only way up is the Owner\'s pardon.');
    await sayAs('PRISONER', 'And the Owner pardons whoever brings him the real killer. Ha. Nobody ever does.');
    await s('kael', 'Then we find the real killer.');
    if (inP('bram')) await s('bram', 'I know who it is. A man with a gun for an arm. He\'s here. I\'d bet my life on it. ...I owe him that much.');
  };
  EV.a2_harl = async function () {
    cs.music('boss');
    await sayAs('HARL', 'Hollis. Bram Hollis. Seven years. You look old, Captain.');
    if (inP('bram')) {
      await s('bram', 'Harl. It\'s you killing Aurex men in the Spire.');
      await sayAs('HARL', 'Every one of them was at Thornbrook. Every one. I\'ve got a list. You\'re on it, Captain.');
      await s('lyra', 'Thornbrook? Bram, what is he talking about?');
      await sayAs('HARL', 'He didn\'t tell you? Captain Hollis got an order. Burn the village, contain the "outbreak". I refused. They took my arm for it, and my name.');
      await sayAs('HARL', 'He didn\'t refuse.');
      await s('bram', '...No. I didn\'t.');
      await s('kael', '...');
    } else await sayAs('HARL', 'Whoever you are, you\'re in my pit. That makes you mine.');
    await cs.battle(['harl'], { bg: 'desert', boss: 1, noRun: 1 });
    await sayAs('HARL', 'Hah... You fight for him? For the man who lit the match? Then you\'re as blind as he was.');
    await sayAs('HARL', 'Tell the Owner it was me. I\'m done. Seven years... it\'s enough.');
    cs.flag('a2_prison_out');
    if (inP('bram')) {
      await s('bram', 'I followed the order, Kael. I told myself it was quarantine. I told myself a lot of things.');
      await s('kael', 'You burned my village.');
      await s('bram', 'Yes.');
      await s('kael', '...We\'ll talk about it at the Lantern House. Not in a pit.');
    }
    await AE.game.fadeOut(0.04);
    await cs.narrate(['The Owner of the Gilded Spire was a fat man in a gold chair who liked a good story.', 'He liked this one so much he pardoned everyone, gave them a gold card, and the keys to a desert Skimmer.']);
    await AE.gain('owner_pardon'); await AE.gain('skimmer_key');
    const g = AE.WORLD.places.gilded; const q = AE.landNear(g[0], g[1] + 2); AE.S_.vehicles.skimmer = { x: q[0], y: q[1], have: 1 };
    await cs.warp('gilded_spire', 27, 40, 2);
    await AE.say('A Skimmer waits below the Spire\'s lift. It crosses deserts and plains at speed.', { name: 'TIP' });
  };
  EV.a2_exchange = function () { return AE.exchange(); };
  EV.a2_race = function () { return AE.race(); };
  EV.a2_slots = function () { return AE.slots(); };
  EV.a2_gallery = function () { return AE.gallery(); };
  EV.a2_arena = function () { return AE.arena(); };
  EV.a2_cards_spire = function () { return AE.has('card_deck') ? AE.Arcana.duel('spire') : sayAs('CARD PLAYER', 'No deck? The Lucky Lantern in Halcyon gives them out. Or try the Arcana Hall.'); };
  EV.a2_cards_master = async function () {
    if (!AE.has('card_deck')) { await AE.gain('card_deck'); ['c_rat', 'c_slime', 'c_drone', 'c_trooper', 'c_hawk', 'c_crawler', 'c_bat'].forEach(function (c) { AE.S_.cards[c] = (AE.S_.cards[c] || 0) + 1; }); await sayAs('ARCANA MASTER', 'No deck? Have one. The Hall insists.'); return; }
    return AE.Arcana.duel('master');
  };
  EV.a2_cards_duchess = function () { return AE.has('card_deck') ? AE.Arcana.duel('duchess') : sayAs('DUCHESS', 'Darling, you need a deck.'); };
  EV.a2_cards_monk = function () { return AE.has('card_deck') ? AE.Arcana.duel('monk') : sayAs('MONK', 'A deck first, friend.'); };

  // ---------- the Old Mine ----------
  EV.a2_miner = async function () {
    await sayAs('OLD MINER', 'Silver, they dug for. Then Aurex bought the claim and dug for something else. Dug till the walls started glowing.');
    await sayAs('OLD MINER', 'There\'s a big old mole down in the Deep Vein. Thinks it\'s a king. It\'s been eating the Aurex crews. Can\'t say I blame it.');
  };
  EV.a2_moleking = async function () {
    await cs.shake(30); await AE.say('The floor heaves. A huge mole wearing a crown of broken drill bits bursts up through the rock.');
    await cs.battle(['moleking'], { bg: 'cave', boss: 1, noRun: 1 });
    cs.flag('a2_mine'); await AE.say('Daylight shines down a shaft ahead: the far side of the mountain, and the road to Windhaven.');
  };

  // ---------- Windhaven ----------
  EV.a2_wind = async function () {
    cs.flag('a2_wind');
    await AE.say('Windhaven. White temples, prayer flags, and wind that never stops. Aurex drilling rigs stand around the shrine gate like vultures.');
    if (inP('lyra')) await s('lyra', 'The Wind Crystal is in there. I can hear it. It\'s... it\'s scared, Kael. Like the core was.');
    await s('kael', 'Vesper said "when the Crystals call you, answer". I don\'t hear anything.');
    if (inP('lyra')) await s('lyra', 'Good. Keep not hearing it.');
  };
  EV.a2_windkeeper = async function () { await sayAs('WINDKEEPER', F().a2_drain ? 'Aurex is inside. Please. The Crystal...' : 'The shrine is sealed. Only the Windkeeper\'s Key opens it, and the Key rests with the dead, in the Ossuary.'); };
  EV.a2_elder = async function () {
    await sayAs('ELDER SORREL', 'Aurex has paid us very well to open the shrine. I told them the Key is lost. It is not lost. It is buried with the first Windkeeper, in the deepest ossuary.');
    await sayAs('ELDER SORREL', 'If Aurex must have the Crystal, I would rather someone kind held the door. The catacombs are east. Bring the Key, and I will trust you with it.');
    cs.flag('a2_elder');
  };
  EV.a2_lich = async function () {
    await AE.say('Bones rise from the ossuary niches and knit together around a cold blue flame.');
    await sayAs('OSSUARY WARDEN', 'THE KEY SLEEPS WITH THE KEEPER. THE KEEPER SLEEPS WITH ME.');
    await cs.battle(['lich'], { bg: 'temple', boss: 1, noRun: 1 });
    cs.flag('a2_lich'); await AE.gain('keeper_key');
  };
  EV.a2_shrine_gate = async function () {
    if (!AE.has('keeper_key')) { await AE.say('A great sealed door, carved with wings. It has a keyhole shaped like a feather.'); return; }
    await AE.say('The Windkeeper\'s Key turns. The door sighs open... and Aurex drill-cable runs in through a hole already cut in the shrine\'s wall.');
    if (inP('bram')) await s('bram', 'They didn\'t wait for a key. They cut their way in.');
    cs.flag('a2_drain');
  };
  EV.a2_drago2 = async function () {
    cs.flag('a2_drago2');
    cs.spawn('drago', 'drago', AE.field().player.x, AE.field().player.y - 3, 2);
    await sayAs('DRAGO', 'Warden. I hoped it would be you. The doctor is upstairs, waiting for her shard. I\'m to keep everyone else out.');
    await sayAs('DRAGO', 'I read her Cradle files, you know. All of them. I know what you are now.');
    await s('kael', 'Then tell me.');
    await sayAs('DRAGO', 'Beat me first. That\'s the only honest way I know.');
    await cs.battle(['windtrooper', 'drago2', 'windtrooper'], { bg: 'temple', boss: 1, noRun: 1 });
    await sayAs('DRAGO', 'Ha... Better. Much better. Fine. You want the truth? You\'re a container, Warden. A jar with a dead boy\'s memories poured in.');
    await sayAs('DRAGO', 'And jars don\'t get a say in where they\'re carried. Remember that, when she calls you.');
    cs.remove('drago');
  };
  EV.a2_engine = async function () {
    cs.music('boss');
    await AE.say('The Crystal Heart. A great green crystal floats over the floor, wrapped in Aurex cables. A drilling engine the size of a house is chewing into its base.');
    await sayAs('TEMPEST ENGINE', 'EXTRACTION AT 61 PERCENT. INTERFERENCE DETECTED. PURGING.');
    await cs.battle(['tempest'], { bg: 'sky', boss: 1, noRun: 1 });
    cs.flag('a2_engine'); cs.music('revelation');
    await AE.say('The engine dies. The crystal shudders... and cracks from end to end. Something small and bright falls out of the heart of it: a shard of green light.');
    await s('kael', '...');
    cs.spawn('vesper', 'vesper', AE.field().player.x, AE.field().player.y - 4, 2);
    await sayAs('VESPER', 'There it is. The Wind Shard. Bring it here, bright boy.');
    await AE.say('Kael\'s hand is already closing on the shard. His feet are already walking.'); AE.game.flash = 10;
    if (inP('lyra')) await s('lyra', 'Kael! KAEL! Stop! Look at me!');
    await sayAs('VESPER', 'He can\'t, Chorus. He\'s mine. He was made to carry, and carry he will. One, two, three...');
    await s('kael', 'One... two...');
    await AE.say('Kael places the Wind Shard in Vesper\'s hand.');
    await sayAs('VESPER', 'Good boy. Now come with me. You belong in the Cradle.');
    if (inP('lyra')) {
      await s('lyra', 'NO. He belongs to himself!');
      await AE.say('Lyra throws her arms around Kael and pulls. Something in the dying Crystal SINGS, louder than Vesper\'s counting, and Kael\'s eyes clear.');
      await s('kael', '...Lyra?');
    }
    await sayAs('VESPER', 'A Chorus song. How old-fashioned. Keep him, then. For now. I have what I came for. Three to go.');
    cs.remove('vesper'); await cs.shake(60);
    await AE.say('The shrine shakes apart. From the shattered crystal rises a shape of green wind and white wings.');
    await sayAs('SYLPHINE', 'Child of the Chorus. The Crystal is gone; its memory lives in me. Call, and I will come.');
    await AE.gain('prism:sylphine');
    await AE.game.fadeOut(0.04);
    await cs.narrate(['The Wind Shrine fell into the valley that night.', 'In Windhaven, the wind stopped for the first time in a thousand years.',
      'Kael Ardent sat on the temple steps until dawn, staring at his empty hand.', '"I gave it to her," he said. "I couldn\'t stop. I didn\'t want to stop."',
      '"Then next time, we stop you," said Lyra. "That\'s what we\'re for."']);
    await cs.title('END OF ACT II', 'MERIDIA', 180);
    cs.flag('a2_done'); cs.chapter(3);
    await cs.warp('windhaven', 27, 30, 2);
    await AE.say('Vesper needs three more Shards. The Water Crystal lies across the sea in Solmara. The ferry leaves from Port Lark, east.', { name: 'TIP' });
  };
})();
AE.EV['enter:gs_hotel'] = function () { if (AE.S_.flags.a2_spire && !AE.S_.flags.a2_framed) return AE.EV.a2_murder(); };

/* ================= Act III: Solmara — enemies, story, side events ================= */
(function () {
  const E = AE.E, K = AE.K, cs = AE.cs, EV = AE.EV, F = function () { return AE.S_.flags; };
  const s = function (who, t) { return cs.s(who, t); }, sayAs = function (n, t) { return AE.say(t, { name: n }); };
  const inP = function (id) { return AE.S_.party.indexOf(id) >= 0 || AE.S_.reserve.indexOf(id) >= 0; };
  // ---------- skills ----------
  K('tidal', { name: 'Tidal Wave', kind: 'mag', power: 10, elem: 'water', all: 1, fx: 'water' });
  K('ink_jet', { name: 'Ink Jet', kind: 'mag', power: 6, elem: 'water', status: ['blind'], hit: 50, fx: 'water' });
  K('pinch', { name: 'Pincer', kind: 'phys', power: 1.6, fx: 'claw' });
  K('sandstorm', { name: 'Sandstorm', kind: 'mag', power: 9, elem: 'earth', status: ['blind'], hit: 35, all: 1, fx: 'quake' });
  K('heat_ray', { name: 'Heat Ray', kind: 'mag', power: 11, elem: 'fire', fx: 'fire' });
  K('magma_spit', { name: 'Magma Spit', kind: 'mag', power: 9, elem: 'fire', all: 1, fx: 'fire' });
  K('rune_beam', { name: 'Rune Beam', kind: 'mag', power: 11, fx: 'spark' });
  K('reflect_self', { name: 'Mirror Skin', kind: 'buff', status: ['reflect'], target: 'self', fx: 'shield' });
  K('flame_rifle', { name: 'Flame Rifle', kind: 'mag', power: 10, elem: 'fire', fx: 'fire' });
  K('dw_deluge', { name: 'Deluge', kind: 'mag', power: 15, elem: 'water', all: 1, fx: 'water' });
  K('dw_crush', { name: 'Abyssal Crush', kind: 'phys', power: 2.4, fx: 'boom' });
  K('dw_song', { name: 'Drowned Song', kind: 'mag', power: 3, status: ['sleep', 'confuse'], hit: 30, all: 1, fx: 'dark' });
  K('ic_inferno', { name: 'Inferno', kind: 'mag', power: 18, elem: 'fire', all: 1, fx: 'fire' });
  K('ic_fist', { name: 'Molten Fist', kind: 'phys', power: 2.5, elem: 'fire', fx: 'boom' });
  K('kestra_rain', { name: 'Knife Rain', kind: 'phys', power: 0.6, hits: 5, fx: 'cut' });
  K('dv3_dragon', { name: 'Dragonfall', kind: 'phys', power: 1.6, all: 1, fx: 'boom' });
  // ---------- enemies ----------
  E('reefcrab', 'Reef Crab', 28, 1400, 86, 70, 20, 30, 18, 400, 26, 220, { mon: 'GreenOctopus', hue: 330 }, { weak: ['bolt'], absorb: ['water'], ai: [[3, 'attack'], [1, 'pinch']] });
  E('seagull', 'Gale Gull', 27, 1000, 80, 34, 30, 30, 42, 380, 25, 160, { mon: 'Owl', hue: 180 }, { weak: ['bolt'], float: 1, ai: [[2, 'attack'], [2, 'peck']] });
  E('pirate', 'Grotto Cutthroat', 28, 1300, 88, 40, 20, 30, 34, 410, 26, 400, { cast: 'marlo', hue: 200 }, { ai: [[3, 'attack'], [1, 'shiv'], [1, 'pilfer']], steal: [['hi_potion', 0.6]] });
  E('squidling', 'Squidling', 29, 1200, 70, 40, 60, 46, 30, 420, 27, 180, { mon: 'Octopus2' }, { weak: ['bolt'], absorb: ['water'], ai: [[1, 'attack'], [2, 'ink_jet'], [1, 'tidal']] });
  E('pearlknight', 'Pearl Sentinel', 31, 2200, 96, 80, 40, 60, 20, 480, 30, 300, { mon: 'Cyclope2', k: 2.4, hue: 160, bright: 1.2 }, { weak: ['bolt'], resist: ['water'], ai: [[3, 'attack'], [1, 'reflect_self']] });
  E('kraken_s', 'Coral Kraken', 31, 1800, 84, 50, 66, 50, 28, 470, 30, 260, { mon: 'RedOctopus' }, { weak: ['bolt'], absorb: ['water'], ai: [[1, 'attack'], [2, 'tidal']] });
  E('kestra', 'Kestra, Grotto Queen', 30, 18000, 92, 46, 40, 40, 44, 7000, 200, 6000, { cast: 'sable', k: 1.45, hue: 140 }, { boss: 1, ai: [[3, 'attack'], [2, 'kestra_rain'], [1, 'pilfer']], steal: [['prism:manipulate', 0.25], ['speed_source', 1]] });
  E('dwarden', 'The Drowned Warden', 34, 30000, 98, 56, 72, 60, 26, 11000, 280, 7000, { boss: 'SquidRed', anim: 'Idle', fw: 76, fh: 79, k: 1.8, hue: 200, bright: 0.8 },
    { boss: 1, weak: ['bolt'], absorb: ['water'], ai: [[2, 'dw_crush'], [2, 'dw_deluge'], [1, 'dw_song'], [1, 'attack']], steal: [['prism:marrowtide', 0.2], ['x_potion', 1]] });
  E('sandshark', 'Sand Shark', 30, 1900, 96, 44, 20, 30, 34, 450, 28, 260, { mon: 'Fish', k: 2.6, hue: 30 }, { weak: ['water', 'ice'], ai: [[3, 'attack'], [1, 'burrow_bite']] });
  E('mummy', 'Ruin Wrapped', 30, 1700, 84, 46, 40, 40, 20, 440, 28, 220, { mon: 'Skull', hue: 40, bright: 1.2 }, { undead: 1, weak: ['fire', 'holy'], ai: [[2, 'attack'], [1, 'bone_rattle']] });
  E('sunlizard', 'Sun Basilisk', 31, 1800, 90, 50, 50, 40, 30, 470, 29, 240, { mon: 'Lizard', hue: 20 }, { weak: ['ice', 'water'], absorb: ['fire'], ai: [[2, 'attack'], [1, 'heat_ray']], addStatus: 'stone', addChance: 0.08 });
  E('runeeye', 'Rune Eye', 32, 1500, 50, 50, 80, 70, 34, 500, 32, 280, { mon: 'Eye2', hue: 260 }, { float: 1, ai: [[1, 'attack'], [2, 'rune_beam'], [1, 'reflect_self']] });
  E('glassgolem', 'Glass Golem', 33, 2600, 100, 90, 30, 90, 16, 520, 34, 300, { mon: 'Cyclope', k: 2.6, hue: 180, bright: 1.4 }, { weak: ['earth'], ai: [[3, 'attack'], [1, 'smash']] });
  E('scarab', 'Brass Scarab', 32, 1600, 94, 76, 20, 40, 30, 490, 32, 300, { mon: 'SpiderYellow', hue: 40 }, { weak: ['water', 'bolt'], ai: [[3, 'attack'], [1, 'pinch']] });
  E('chorusbot', 'Chorus Sentinel', 34, 2400, 102, 70, 60, 60, 26, 560, 36, 340, { mon: 'Eye', k: 2.6, hue: 90 }, { weak: ['bolt'], ai: [[2, 'attack'], [2, 'rune_beam']] });
  E('flametrooper', 'Aurex Flametrooper', 30, 1600, 90, 50, 50, 40, 30, 480, 30, 0, { cast: 'gunner', hue: 330 }, { ai: [[2, 'attack'], [2, 'flame_rifle']] });
  E('emberhound', 'Ember Hound', 35, 2300, 108, 50, 40, 40, 40, 580, 36, 300, { mon: 'Beast', hue: 350, bright: 1.2 }, { absorb: ['fire'], weak: ['water', 'ice'], ai: [[3, 'attack'], [1, 'magma_spit']] });
  E('lavaslime', 'Magma Slime', 35, 2600, 90, 80, 70, 40, 18, 590, 38, 320, { mon: 'Slime', hue: 330 }, { absorb: ['fire'], weak: ['ice', 'water'], ai: [[1, 'attack'], [2, 'magma_spit']] });
  E('salamander', 'Salamander', 36, 2400, 104, 60, 70, 50, 36, 600, 38, 340, { mon: 'Lizard2', hue: 340 }, { absorb: ['fire'], weak: ['ice'], ai: [[2, 'attack'], [2, 'heat_ray']] });
  E('drago3', 'Captain Drago Venn', 37, 32000, 118, 60, 50, 50, 38, 12000, 300, 8000, { cast: 'drago', k: 1.4 }, { boss: 1, ai: [[3, 'dv2_lunge'], [2, 'dv2_storm'], [1, 'dv3_dragon'], [1, 'dv_brace', 'hurt']], steal: [['prism:deathblow', 0.3], ['power_source', 1]] });
  E('colossus', 'Ignis Colossus', 40, 48000, 120, 70, 90, 60, 26, 16000, 360, 10000, { boss: 'TenguRed', anim: 'Idle', fw: 82, fh: 82, k: 1.6, bright: 1.1 },
    { boss: 1, absorb: ['fire'], weak: ['ice', 'water'], ai: 'colossus', steal: [['prism:ignarok', 0.2], ['elixir', 1]] });
  AE.AI.colossus = function (f, B) { const v = f.ai.vars; v.t = (v.t || 0) + 1; if (v.t % 4 === 0) return AE.mkAct(f, B, 'ic_inferno'); return AE.mkAct(f, B, ['attack', 'ic_fist', 'magma_spit', 'heat_ray'][AE.rand(4)]); };
  const T = function (bg, sets) { return { bg: bg, sets: sets.map(function (x) { return { enemies: x[0], w: x[1] || 1 }; }) }; };
  AE.ENC.w_solmara = T('beach', [[['reefcrab', 'seagull'], 2], [['pirate', 'pirate'], 2], [['seagull', 'seagull', 'seagull'], 1], [['sandshark'], 2]]);
  AE.ENC.w_desert = T('desert', [[['sandshark', 'scarab'], 2], [['sunlizard', 'mummy'], 2], [['scarab', 'scarab', 'scarab'], 1]]);
  AE.ENC.w_cinder = T('lava', [[['emberhound', 'emberhound'], 2], [['salamander', 'lavaslime'], 2]]);
  AE.ENC.w_sea = T('sea', [[['squidling', 'squidling'], 2], [['kraken_s'], 1]]);
  AE.ENC.grotto = T('cave', [[['pirate', 'pirate'], 3], [['reefcrab', 'squidling'], 2], [['pirate', 'pirate', 'seagull'], 1]]);
  AE.ENC.coral = T('underwater', [[['squidling', 'squidling'], 2], [['pearlknight'], 2], [['kraken_s', 'reefcrab'], 2], [['squidling', 'pearlknight', 'squidling'], 1]]);
  AE.ENC.ruins = T('ruins', [[['mummy', 'mummy'], 2], [['runeeye', 'scarab'], 2], [['sunlizard', 'mummy'], 2], [['runeeye', 'runeeye'], 1]]);
  AE.ENC.tower_orin = T('citadel', [[['runeeye', 'runeeye'], 2], [['glassgolem'], 2], [['runeeye', 'glassgolem'], 1]]);
  AE.ENC.wreck = T('ship', [[['chorusbot'], 2], [['scarab', 'scarab'], 2], [['chorusbot', 'runeeye'], 1]]);
  AE.ENC.dive = T('lava', [[['flametrooper'], 2], [['flametrooper', 'flametrooper'], 1]]);
  AE.ENC.cinder = T('lava', [[['emberhound', 'salamander'], 3], [['lavaslime', 'lavaslime'], 2], [['flametrooper', 'flametrooper', 'emberhound'], 1], [['salamander', 'salamander'], 1]]);
  // ---------- shops ----------
  AE.SHOPS.pl_shop = { name: 'Chandlery', items: ['hi_potion', 'phoenix_down', 'remedy', 'ether', 'tent', 'cottage', 'smoke_bomb'] };
  AE.SHOPS.sm_shop = { name: 'Oasis Goods', items: ['hi_potion', 'x_potion', 'phoenix_down', 'remedy', 'ether', 'soft', 'cottage'] };
  AE.SHOPS.sm_arms = { name: 'Dune Forge', items: ['storm_brand', 'aurora_staff', 'siege_lance', 'nightshade', 'thunder_rod', 'piston_fist', 'long_rifle', 'crystal_band', 'mage_coat'] };
  AE.SHOPS.sm_prism = { name: 'Mirage Prisms', items: ['prism:water', 'prism:earth', 'prism:toxin', 'prism:gravity', 'prism:barrier', 'prism:absorb_hp', 'prism:counter', 'prism:magic_plus', 'prism:power_plus'] };
  AE.SHOPS.ss_shop = { name: 'Caravan Store', items: ['x_potion', 'phoenix_down', 'remedy', 'turbo_ether', 'cottage', 'soft'] };
  AE.SHOPS.ss_arms = { name: 'Sunsteel', items: ['crystal_saber', 'sage_rod', 'dragoon_pike', 'mist_dirk', 'choir_bell', 'titan_grip', 'hunter_rifle', 'dragon_mail', 'headband'] };
  // ---------- cards ----------
  const C = AE.CARD;
  C('c_crab', 'Reef Crab', 5, [7, 5, 3, 7], { mon: 'GreenOctopus', hue: 330 }, 'water'); C('c_kestra', 'Kestra', 8, [8, 6, 9, 5], { cast: 'sable', hue: 140 });
  C('c_dwarden', 'Drowned Warden', 9, [9, 8, 4, 9], { boss: 'SquidRed', fw: 76, fh: 79, hue: 200 }, 'water'); C('c_colossus', 'Ignis Colossus', 9, [9, 5, 9, 9], { boss: 'TenguRed', fw: 82, fh: 82 }, 'fire');
  C('c_orin', 'Orin', 9, [6, 9, 7, 9], { cast: 'orin' }); C('c_rook', 'Rook', 9, [9, 7, 9, 6], { cast: 'rook' }, 'earth'); C('c_vesna', 'Vesna', 9, [8, 9, 6, 8], { cast: 'vesna' });
  ['reefcrab:c_crab', 'kestra:c_kestra', 'dwarden:c_dwarden', 'colossus:c_colossus'].forEach(function (p) { const q = p.split(':'), X = AE.ENEMIES[q[0]]; X.drop = (X.drop || []).concat([['card:' + q[1], X.boss ? 1 : 0.05]]); });

  // ---------- story ----------
  EV.inn_lark = function () { return AE.inn(150); }; EV.inn_salt = function () { return AE.inn(160); }; EV.inn_sun = function () { return AE.inn(180); };
  EV.a3_ticket = async function () {
    if (AE.has('ship_charter')) { await sayAs('HARBOURMASTER', 'The ferry leaves from the long pier. Show your charter to the deckhand.'); return; }
    await sayAs('HARBOURMASTER', 'Ferry tickets? Aurex has every berth booked. ...Unless you\'d like to work your passage. My manifest says the ferry needs guards. Pirates in the strait.');
    await AE.gain('ship_charter');
  };
  EV.a3_ferry = async function () {
    if (!AE.has('ship_charter')) { await AE.say('The ferry to Saltmere. A deckhand shakes his head: "Charter first. Harbour office."'); return; }
    const r = await AE.ask('Take the ferry to Saltmere?', ['Sail', 'Not yet'], { cancel: 1 }); if (r !== 0) return;
    if (!F().a3_ferry) {
      cs.flag('a3_ferry'); await cs.narrate(['The ferry ploughed east across a grey strait.', 'Halfway over, the sea went still and green, and every fish for a mile floated up dead.']);
      if (inP('lyra')) await s('lyra', 'The Water Crystal. It\'s... it\'s gone quiet. Already. She got there first.');
      await cs.battle(['pirate', 'pirate', 'seagull'], { bg: 'ship', noRun: 1 });
    }
    await cs.warp('saltmere', 26, 9, 2);
  };
  EV.a3_ferry_back = async function () { const r = await AE.ask('Ferry back to Port Lark?', ['Sail', 'Stay'], { cancel: 1 }); if (r === 0) await cs.warp('portlark', 26, 14, 2); };
  EV.a3_grotto = async function () {
    cs.music('boss');
    await sayAs('KESTRA', 'Well, well. Little Sable, come home. And with a whole gang of strays.');
    if (inP('sable')) {
      await s('sable', 'Kestra. I need the submersible.');
      await sayAs('KESTRA', 'You ran out on this crew with a sack of our gold and a three-day head start. And now you NEED.');
      await s('sable', 'I ran to Halcyon to find someone. I found him. Two of him, sort of. It\'s complicated.');
    }
    await sayAs('KESTRA', 'Grotto law. Beat me, take what you want. Lose, and you scrub barnacles for a year.');
    await cs.battle(['pirate', 'kestra', 'pirate'], { bg: 'cave', boss: 1, noRun: 1 });
    await sayAs('KESTRA', 'Ha! Still fast. Fine. The sub\'s in the west cove. Don\'t scratch her. And Sable... the Owner of the Spire was asking after you. Sweetly.');
    cs.flag('a3_grotto'); const q = AE.landNear(156, 124); AE.S_.vehicles.sub = { x: q[0], y: q[1], have: 1 };
    const b = AE.landNear(134, 112); AE.S_.vehicles.boat = { x: b[0], y: b[1], have: 1 };
    await AE.notice('The submersible and a sailing boat are yours.');
    await AE.say('Sail the boat across shallow seas; dive the submersible over deep water and press OK above the reef to enter the Coral Sanctum (far south).', { name: 'TIP' });
  };
  EV.a3_warden = async function () {
    cs.music('final');
    await AE.say('In the Heart of the Sea, the Water Crystal is gone. In its socket sleeps something vast: a crown of coral on a body of black water and old iron.');
    if (inP('lyra')) await s('lyra', 'It\'s dreaming. It\'s... it\'s dreaming about the sky breaking.');
    await sayAs('THE DROWNED WARDEN', 'THE ANCHOR IS TAKEN. WHEN THE FOURTH FALLS, WE WAKE. WE WILL MEND THE SKY BY BREAKING THE WORLD.');
    await cs.battle(['dwarden'], { bg: 'underwater', boss: 1, noRun: 1 });
    cs.flag('a3_coral');
    if (inP('lyra')) await s('lyra', 'A Sky Warden. One of the old guardians. Kael... if there\'s one, there are others. And when the last Crystal goes, they all wake up.');
    await AE.gain('prism:marrowtide');
    await AE.say('Marrowtide, the Echo of the drowned sea, answers to the Chorus song.');
  };
  EV.a3_sunscar = async function () { cs.flag('a3_sunscar'); await AE.say('Sunscar. Mud-brick houses, a deep blue well, and the bones of something huge buried in the dunes to the east.'); };
  EV.a3_mural = async function (e) {
    const M = ['A mural: robed singers standing in a ring around a crystal. Above them, islands float on lines of light.', 'A mural: the singers raising a great hall into the sky. THE CITADEL, the inscription reads. WHERE THE SONG IS SUNG.',
      'A mural: a black shape like a hole in the paint, swallowing the singers one by one. The paint around it is scratched away by many hands.', 'A mural: the last singers sealing the black shape in a crater. They are smaller now. Their mouths are closed.'];
    await AE.say(M[(e && e.n) || 0]);
  };
  EV.a3_ruins = async function () {
    cs.flag('a3_ruins');
    await AE.say('At the heart of the ruins a single word is cut in the floor, over and over, in a language older than any you know. Lyra reads it anyway.');
    if (inP('lyra')) { await s('lyra', '"NYXAR." It means... "the one who forgets". No. "The one who MAKES you forget."'); await s('kael', 'Orin\'s Tower is east of here. If anyone can read this, he can.'); }
  };
  EV.a3_orinlock = async function (e) { const n = (e && e.n) || 0; if (F()['orin_lock' + n]) { await AE.say('The orb glows steadily.'); return; } AE.Sfx.play('echo'); cs.flag('orin_lock' + n); await AE.say('The orb brightens at your touch. Somewhere on this floor, a crystal seal dissolves.'); };
  EV.a3_orin = async function () {
    cs.flag('a3_orin'); cs.music('mystic');
    cs.spawn('orin', 'orin', AE.field().player.x, AE.field().player.y - 3, 2);
    await sayAs('ORIN', 'Six floors of locks, and you walked through them like a summer garden. Either you are clever or you are stubborn. I hope stubborn. Clever is overrated.');
    await sayAs('ORIN', 'Orin Thale. I was a scholar of the Crystals once. I had a student. The brightest mind I ever met. Vesper Lune.');
    await sayAs('ORIN', 'I taught her about the Chorus, who sang the world awake. About the Sky Citadel, their throne. And about the thing they sealed in the Crater: Nyxar, the Hollow Echo.');
    await sayAs('ORIN', 'Nyxar is not a beast. It is a memory. The memory of the first calamity, the first loss. It wants to be the only memory left. It whispers to the clever, and the grieving.');
    await sayAs('ORIN', 'Vesper was both. I gave her the keys and she found the lock. Seven years I have hidden in this tower from what I taught her.');
    await s('kael', 'Then stop hiding.');
    await sayAs('ORIN', '...Yes. I suppose that is overdue. Let an old man walk with you. I know where the next Crystal lies, and I know what wakes when the fourth one dies.');
    cs.remove('orin'); await cs.join('orin');
    await sayAs('ORIN', 'East of here, Dunewreck: a Chorus airship buried in the sand. If its engine still lives, you could fly. You will need to fly, soon.');
  };
  EV.a3_rook = async function () {
    cs.music('mystic');
    await AE.say('In the wreck\'s engine room, a man-shaped machine sits slumped against the core, covered in seven years of sand.');
    await AE.say('Its eyes open. They are the same grey as Kael\'s.');
    await sayAs('ROOK', 'Memory trace... recognised. Kael. Kael Ardent. You are... alive? No. Recalculating.');
    await sayAs('ROOK', 'I am Rook. Chorus construct, archive class. Seven years ago a boy died in Thornbrook, and the Aetherflow carried his last memories here, to me. I have been keeping them.');
    await s('kael', 'His memories. My memories.');
    await sayAs('ROOK', 'Not yours. His. You have a copy. I have the end of it, the part the copy never got. Will you see it?');
    const r = await AE.ask('Dive into the real Kael Ardent\'s last memory?', ['Dive', 'Not yet'], { cancel: 1 }); if (r !== 0) return;
    cs.flag('a3_rook'); await cs.join('rook');
    AE.S_.diveParty = AE.S_.party.slice(); AE.S_.diveReserve = AE.S_.reserve.slice(); AE.S_.party = ['kael']; AE.S_.reserve = [];
    AE.S_.flags.diving = 1; AE.game.flash = 30;
    await cs.narrate(['The world goes white.', 'Thornbrook. Seven years ago. Night.', 'You are Kael Ardent, warden-in-training, twelve years old, and the sky is on fire.']);
    await cs.warp('mem_thornbrook', 24, 36, 0);
  };
  EV.a3_dive1 = async function () {
    cs.flag('dive1');
    await sayAs('KAEL (12)', 'The mill\'s burning... the green... Mother Ilse! The Lantern House is up the hill!');
    await sayAs('VILLAGER', 'Soldiers! Aurex soldiers, setting the fires! Run, boy!');
  };
  EV.a3_dive2 = async function () {
    cs.flag('dive2');
    cs.spawn('ybram', 'bram', 24, 19, 2); cs.spawn('yharl', 'gunner', 27, 19, 3);
    await sayAs('CAPTAIN HOLLIS', 'Orders are orders, Mercer. Quarantine. Whatever got loose in that orphanage, it can\'t be allowed out of the village.');
    await sayAs('MERCER', 'Those are CHILDREN, Captain! I won\'t! I won\'t do it!');
    await sayAs('CAPTAIN HOLLIS', '...Then go. Walk away, and don\'t look back. I\'ll carry this one myself.');
    await sayAs('KAEL (12)', 'Hey! HEY! There are kids in there!');
    await sayAs('CAPTAIN HOLLIS', 'Get that boy out of here!');
    await cs.battle(['flametrooper', 'flametrooper'], { bg: 'lava', noRun: 1 });
    cs.remove('ybram'); cs.remove('yharl');
  };
  EV.a3_dive3 = async function () {
    cs.flag('dive3'); cs.music('revelation');
    cs.spawn('yvesp', 'vesper', 24, 8, 2);
    await AE.say('At the Lantern House door stands a girl of sixteen with silver hair, holding a crystal that shines too brightly to look at.');
    await sayAs('VESPER (16)', 'It\'s all right, Kael. It\'s just a test. The voice said it would make everyone remember forever. Nobody would ever be lost again.');
    await sayAs('VESPER (16)', 'One, two, three... why is it so hot? Why is it SCREAMING?');
    await sayAs('KAEL (12)', 'Vesper, put it down! Everyone out! Mother Ilse, take the little ones! Out the back!');
    AE.game.flash = 30; await cs.shake(40);
    await cs.narrate(['The crystal broke.', 'The real Kael Ardent carried nine children out of the Lantern House, and went back for the tenth.', 'He did not come out again.',
      'Vesper Lune walked out of the fire with her hands burned to the wrist, and a voice in her head that said: you can fix this. You can bring him back.', 'Seven tries.']);
    AE.S_.party = AE.S_.diveParty; AE.S_.reserve = AE.S_.diveReserve; delete AE.S_.flags.diving; cs.flag('a3_dive');
    await cs.warp('dunewreck', AE.MAPS.dunewreck.entry[0], AE.MAPS.dunewreck.entry[1], 2);
    await s('kael', '...He went back for the tenth.');
    if (inP('lyra')) await s('lyra', 'And you\'re the boy who keeps going back. Kael. That part\'s yours. Nobody gave you that.');
    if (inP('bram')) await s('bram', 'I was there. I gave the order. And a boy walked into my fire for children I\'d written off. ...I have carried his face for seven years. And then it walked into my Reactor 4 job.');
    await sayAs('ROOK', 'Memory transfer complete. I will come with you. The boy would have wanted to see how it ends. And here: the Aether Engine Core. The ship\'s heart. Take it.');
    await AE.gain('engine_core');
    await sayAs('ROOK', 'Install it in an airframe and you will fly. There is one: an Aurex prototype at Mount Cinder\'s foot, the Skylark. Aurex left it when the Fire Crystal began to fail.');
  };
  EV.a3_drago3 = async function () {
    cs.flag('a3_drago3');
    await sayAs('DRAGO', 'Warden. Or should I say... what should I say? I saw the Cradle files. I know about the fire.');
    await sayAs('DRAGO', 'I was a boy in Halcyon when they told us Thornbrook was a plague. I joined Aurex to keep that from ever happening again. Funny, isn\'t it?');
    await cs.battle(['flametrooper', 'drago3', 'flametrooper'], { bg: 'lava', boss: 1, noRun: 1 });
    await sayAs('DRAGO', 'Ugh... Go on. She\'s at the top. And Warden: when she takes the Fire Shard, she\'ll have three. Don\'t give her the fourth. Whatever she does to you.');
  };
  EV.a3_colossus = async function () {
    cs.music('boss');
    await AE.say('The Fire Crystal burns in a lake of magma. Something made of the mountain\'s own stone rises from it, cracks glowing like a forge.');
    await cs.battle(['colossus'], { bg: 'lava', boss: 1, noRun: 1 });
    cs.flag('a3_colossus'); cs.music('revelation');
    cs.spawn('vesper', 'vesper', AE.field().player.x, AE.field().player.y - 4, 2);
    await sayAs('VESPER', 'Thank you, all of you. You do the hard part so beautifully. The Fire Shard, please, Kael.');
    await s('kael', 'No.');
    await sayAs('VESPER', '...No? Oh, bright boy. You saw the memory, didn\'t you. The fire. You think you understand me now.');
    await sayAs('VESPER', 'I don\'t need you to carry this one. I only needed you to break the guardian.');
    await AE.say('The shard lifts from the dead crystal and floats to her hand.');
    await sayAs('VESPER', 'Three. One more, in the north, under the roots of the world. Come to the Deeproot when you\'re ready, Kael. You always come.');
    cs.remove('vesper');
    if (inP('orin')) await sayAs('ORIN', 'Vesper! VESPER! ...She didn\'t even look at me.');
    await AE.game.fadeOut(0.04);
    await cs.narrate(['At the foot of Mount Cinder, in an abandoned Aurex hangar, the party found the Skylark.', 'Rook fitted the Engine Core into her heart. She shook, coughed smoke, and flew.']);
    await cs.title('END OF ACT III', 'SOLMARA', 180);
    cs.flag('a3_done'); cs.chapter(4);
    const q = AE.landNear(212, 146); AE.S_.vehicles.airship = { x: q[0], y: q[1], have: 1 };
    AE.toWorld(q[0], q[1] + 1);
    await AE.say('The Skylark is yours: board it on the world map and fly anywhere. The Earth Crystal lies north, in Nordheim. Frostgate is the gateway.', { name: 'TIP' });
  };
  // Vesna (optional): the sharpshooter in Sunscar
  EV.a3_vesna = async function () {
    if (F().vesna_joined) return;
    await sayAs('VESNA', 'Vesna Korr. You\'re the ones Vesper keeps not killing. That makes you interesting.');
    await sayAs('VESNA', 'I built Project Cradle with her. The Vessels. I walked out when the first ones died in their tanks. I should have burned the lab on my way out.');
    await sayAs('VESNA', 'I\'m going to finish what we started. The ending, I mean. Want a gun?');
    const r = await AE.ask('Let Vesna join?', ['Welcome aboard', 'Not now'], { cancel: 1 }); if (r !== 0) return;
    cs.flag('vesna_joined'); cs.remove('vesna'); await cs.join('vesna');
  };
})();

/* ================= Acts IV and V: Nordheim, the Sundering, the Broken Sky, the Citadel and the ending ================= */
(function () {
  const E = AE.E, K = AE.K, cs = AE.cs, EV = AE.EV, F = function () { return AE.S_.flags; };
  const s = function (who, t) { return cs.s(who, t); }, sayAs = function (n, t) { return AE.say(t, { name: n }); };
  const inP = function (id) { return AE.S_.party.indexOf(id) >= 0 || AE.S_.reserve.indexOf(id) >= 0; };
  AE.ITEMS.frost_lantern.desc = 'Lights the way through the Frostgate Mines.';
  // ---------- skills ----------
  K('blizzard', { name: 'Blizzard', kind: 'mag', power: 13, elem: 'ice', all: 1, fx: 'ice' });
  K('ice_fang', { name: 'Ice Fang', kind: 'phys', power: 1.8, elem: 'ice', fx: 'bite' });
  K('root_storm', { name: 'Root Storm', kind: 'mag', power: 14, elem: 'earth', all: 1, fx: 'quake' });
  K('void_ray', { name: 'Void Ray', kind: 'mag', power: 16, elem: 'dark', fx: 'dark' });
  K('holy_lance', { name: 'Holy Lance', kind: 'mag', power: 16, elem: 'holy', fx: 'holy' });
  K('thunderhead', { name: 'Thunderhead', kind: 'mag', power: 15, elem: 'bolt', all: 1, fx: 'bolt' });
  K('sky_fall', { name: 'Skyfall', kind: 'mag', power: 22, all: 1, fx: 'boom' });
  K('warden_crush', { name: 'Warden Crush', kind: 'phys', power: 2.6, fx: 'boom' });
  K('v_count', { name: 'Counting', kind: 'mag', power: 4, status: ['sleep', 'stop'], hit: 30, all: 1, fx: 'time' });
  K('v_cradle', { name: 'Cradle Light', kind: 'mag', power: 20, elem: 'holy', all: 1, fx: 'holy' });
  K('v_shards', { name: 'Four Shards', kind: 'mag', power: 26, all: 1, fx: 'spark' });
  K('v_mend', { name: 'Remember Me', kind: 'heal', power: 60, target: 'self', fx: 'heal' });
  K('nx_forget', { name: 'Forget', kind: 'mag', power: 8, status: ['silence', 'confuse', 'slow'], hit: 40, all: 1, fx: 'dark' });
  K('nx_hollow', { name: 'Hollow', kind: 'gravity', power: 0.5, fx: 'dark' });
  K('nx_end', { name: 'The Last Memory', kind: 'mag', power: 34, elem: 'dark', all: 1, fx: 'dark' });
  K('nx_grasp', { name: 'Grasp of Nothing', kind: 'phys', power: 2.8, drain: 1, fx: 'claw' });
  // ---------- enemies (Nordheim) ----------
  E('snowwolf', 'Rime Wolf', 38, 2800, 120, 60, 30, 40, 44, 640, 40, 300, { mon: 'Beast', hue: 180, bright: 1.3 }, { weak: ['fire'], absorb: ['ice'], ai: [[3, 'attack'], [1, 'ice_fang']] });
  E('yeti', 'Snow Brute', 40, 3600, 130, 70, 20, 40, 24, 700, 44, 340, { mon: 'Panda', k: 2.6, bright: 1.3 }, { weak: ['fire'], ai: [[3, 'attack'], [1, 'maul']] });
  E('icewisp', 'Frost Wisp', 39, 2200, 60, 50, 90, 80, 40, 660, 42, 300, { mon: 'Spirit', hue: 170, bright: 1.3 }, { absorb: ['ice'], weak: ['fire'], float: 1, ai: [[1, 'attack'], [2, 'ice_spell'], [1, 'blizzard']] });
  E('minebot', 'Aurex Mine Crawler', 40, 3200, 128, 90, 30, 40, 24, 690, 44, 400, { mon: 'SpiderYellow', k: 2.4, sat: 0.3 }, { weak: ['bolt'], ai: [[3, 'attack'], [1, 'drill']] });
  E('frostwyrm', 'Frost Wyrm', 44, 52000, 140, 70, 100, 70, 36, 18000, 400, 12000, { boss: 'DragonBlue', anim: 'Head', fw: 44, fh: 46, k: 2.6 }, { boss: 1, absorb: ['ice'], weak: ['fire'], ai: [[2, 'attack'], [2, 'blizzard'], [1, 'ice_fang']], steal: [['prism:glacielle', 0.2], ['elixir', 1]] });
  E('rootling', 'Rootling', 42, 3000, 126, 70, 60, 60, 30, 720, 46, 360, { mon: 'Bamboo' }, { weak: ['fire'], ai: [[2, 'attack'], [1, 'root_bind']] });
  E('fenhorror', 'Fen Horror', 43, 3800, 134, 66, 80, 60, 28, 760, 48, 380, { mon: 'GreenOctopus', k: 2.4 }, { weak: ['fire', 'ice'], ai: [[2, 'attack'], [1, 'spit'], [1, 'root_storm']] });
  E('bonedrake', 'Bone Drake', 44, 4200, 140, 72, 70, 60, 34, 800, 50, 420, { mon: 'Dragon', hue: 200, sat: 0.2, bright: 1.3 }, { undead: 1, weak: ['holy'], ai: [[2, 'attack'], [1, 'wail']] });
  E('rootking', 'The Root King', 46, 60000, 150, 76, 100, 70, 30, 20000, 420, 14000, { boss: 'GiantBamboo2', anim: 'Idle', fw: 62, fh: 62, k: 2.1 }, { boss: 1, weak: ['fire'], absorb: ['earth'], ai: [[2, 'attack'], [2, 'root_storm'], [1, 'sap_mend', 'hurt']], steal: [['prism:gaiadon', 0.2], ['megalixir', 1]] });
  E('ember_trial', 'Echo of Lumen', 40, 30000, 100, 60, 90, 70, 34, 12000, 300, 0, { boss: 'GiantSpirit', anim: 'Idle', fw: 50, fh: 50, k: 2.2, hue: 40 }, { boss: 1, ai: [[2, 'holy_lance'], [2, 'thunderhead'], [1, 'attack']] });
  // ---------- enemies (the Broken Sky) ----------
  E('skyspawn', 'Sky Spawn', 50, 5200, 160, 80, 100, 80, 40, 1000, 60, 600, { mon: 'Eye', k: 2.4, hue: 330 }, { float: 1, ai: [[2, 'attack'], [2, 'void_ray']] });
  E('redwolf', 'Crimson Wolf', 50, 5800, 170, 80, 40, 60, 46, 1020, 60, 500, { mon: 'Beast', hue: 350, sat: 2 }, { ai: [[3, 'attack'], [1, 'frenzy']] });
  E('hollowed', 'The Hollowed', 52, 6200, 150, 70, 120, 90, 34, 1100, 64, 600, { mon: 'Spirit2', hue: 260, bright: 0.6 }, { undead: 1, weak: ['holy'], absorb: ['dark'], ai: [[1, 'attack'], [2, 'void_ray'], [1, 'nx_forget']] });
  E('choirguard', 'Choir Guardian', 58, 9000, 190, 110, 120, 110, 36, 1400, 80, 900, { mon: 'Cyclope2', k: 2.8, hue: 180, bright: 1.4 }, { weak: ['dark'], ai: [[2, 'attack'], [1, 'holy_lance'], [1, 'reflect_self']] });
  E('citadelangel', 'Citadel Seraph', 60, 8000, 170, 90, 150, 120, 44, 1500, 84, 1000, { mon: 'Butterfly', k: 2.6, hue: 200, bright: 1.5 }, { float: 1, weak: ['dark'], ai: [[1, 'attack'], [2, 'holy_lance'], [1, 'cure_spell', 'ally_hurt']] });
  E('voidknight', 'Hollow Knight', 62, 11000, 210, 120, 80, 90, 38, 1700, 90, 1200, { cast: 'officer', k: 1.5, hue: 260, bright: 0.6 }, { ai: [[3, 'attack'], [1, 'nx_grasp']] });
  // the Sky Wardens (they roam the world after the Sundering)
  const W = function (id, name, hp, art, el) { E(id, name, 62, hp, 210, 100, 150, 100, 36, 30000, 600, 20000, art, { boss: 1, weak: el[0], absorb: el[1], ai: [[2, 'warden_crush'], [2, 'sky_fall'], [1, el[2]], [1, 'attack']] }); };
  W('w_ashen', 'Ashen Warden', 110000, { boss: 'TenguRed', anim: 'Idle', fw: 82, fh: 82, k: 1.8, sat: 0.2 }, [['water'], ['fire'], 'ic_inferno']);
  W('w_storm', 'Storm Warden', 110000, { boss: 'TenguBlue', anim: 'Idle', fw: 68, fh: 68, k: 2, hue: 60 }, [['earth'], ['bolt'], 'thunderhead']);
  W('w_frost', 'Rime Warden', 110000, { boss: 'DragonGreen', anim: 'Head', fw: 44, fh: 46, k: 2.8, hue: 120 }, [['fire'], ['ice'], 'blizzard']);
  W('w_iron', 'Iron Warden', 120000, { boss: 'GiantRedSamurai', anim: 'Idle', fw: 48, fh: 48, k: 2.6, sat: 0.1 }, [['bolt'], [], 'jg_cannon']);
  W('w_halcyon', 'Halcyon\'s Bane', 90000, { boss: 'SquidGreen', anim: 'Idle', fw: 76, fh: 79, k: 1.9, hue: 300 }, [['bolt'], ['water'], 'dw_deluge']);
  // trials and super-bosses
  E('t_glacielle', 'Glacielle', 50, 70000, 150, 80, 140, 100, 40, 20000, 500, 0, { mon: 'Spirit', k: 3.4, hue: 170 }, { boss: 1, absorb: ['ice'], weak: ['fire'], ai: [[2, 'blizzard'], [1, 'attack'], [1, 'ice_spell']] });
  E('t_voltigar', 'Voltigar', 52, 74000, 160, 80, 150, 100, 46, 21000, 520, 0, { mon: 'Eye2', k: 3.6, hue: 40 }, { boss: 1, absorb: ['bolt'], weak: ['earth'], ai: [[2, 'thunderhead'], [1, 'attack'], [1, 'zap']] });
  E('t_sylph', 'Sylphine\'s Shadow', 48, 66000, 150, 76, 130, 90, 50, 19000, 480, 0, { mon: 'Butterfly', k: 3.4, hue: 120 }, { boss: 1, absorb: ['wind'], weak: ['earth'], ai: [[2, 'gale'], [1, 'attack'], [1, 'wind_blade']] });
  E('hollowking', 'The Hollow King', 90, 400000, 300, 160, 260, 160, 60, 99999, 2000, 99999, { boss: 'DemonCyclop', anim: 'Idle', fw: 50, fh: 50, k: 2.6, hue: 260, bright: 0.6 }, { boss: 1, ai: [[2, 'nx_grasp'], [2, 'nx_end'], [1, 'nx_forget'], [1, 'attack']], drop: [['sky_render', 1]] });
  E('ruinwyrm', 'Ruin Wyrm', 80, 300000, 260, 140, 220, 140, 54, 80000, 1500, 60000, { boss: 'DragonGreen', anim: 'Head', fw: 44, fh: 46, k: 3, hue: 300 }, { boss: 1, ai: [[2, 'sky_fall'], [2, 'warden_crush'], [1, 'blizzard'], [1, 'ic_inferno']], drop: [['omega_core', 1]] });
  E('hermit', 'The Hermit', 75, 240000, 240, 130, 240, 160, 60, 70000, 1400, 50000, { cast: 'orin', k: 1.6, hue: 180 }, { boss: 1, ai: [[2, 'thunderhead'], [2, 'blizzard'], [2, 'ic_inferno'], [1, 'v_count']], drop: [['genesis_rod', 1]] });
  // the end
  E('vesper1', 'Vesper Lune', 64, 90000, 180, 100, 180, 120, 44, 0, 0, 0, { cast: 'vesper', k: 1.5 }, { boss: 1, ai: [[2, 'v_cradle'], [1, 'v_count'], [1, 'holy_lance']] });
  E('vesper2', 'Vesper, Crowned', 66, 120000, 200, 110, 200, 130, 46, 0, 0, 0, { boss: 'GiantSpirit', anim: 'Idle', fw: 50, fh: 50, k: 2.6, hue: 180, bright: 1.4 }, { boss: 1, ai: [[2, 'v_shards'], [1, 'v_count'], [1, 'v_mend', 'hurt'], [1, 'holy_lance']] });
  E('vesper3', 'Vesper, Hollowed', 68, 140000, 220, 120, 220, 140, 48, 0, 0, 0, { boss: 'TenguBlue', anim: 'Idle', fw: 68, fh: 68, k: 2.3, hue: 200, bright: 0.7 }, { boss: 1, ai: [[2, 'v_shards'], [2, 'void_ray'], [1, 'nx_forget']] });
  E('nyxar1', 'Nyxar, the Hollow Echo', 72, 150000, 220, 130, 240, 150, 50, 0, 0, 0, { boss: 'DragonBlue', anim: 'Head', fw: 44, fh: 46, k: 3.4, hue: 240, bright: 0.5 }, { boss: 1, ai: [[2, 'nx_grasp'], [2, 'void_ray'], [1, 'nx_forget'], [1, 'nx_hollow']] });
  E('nyxar2', 'Nyxar, Last Memory', 75, 180000, 220, 140, 260, 160, 54, 0, 0, 0, { boss: 'SquidRed', anim: 'Idle', fw: 76, fh: 79, k: 2.3, hue: 240, bright: 0.4 }, { boss: 1, ai: 'nyxar' });
  AE.AI.nyxar = function (f, B) { const v = f.ai.vars; v.t = (v.t || 0) + 1; if (v.t % 5 === 0) return AE.mkAct(f, B, 'nx_end'); if (v.t % 3 === 0) return AE.mkAct(f, B, 'nx_hollow'); return AE.mkAct(f, B, ['nx_grasp', 'void_ray', 'nx_forget'][AE.rand(3)]); };
  // ---------- encounter tables ----------
  const T = function (bg, sets) { return { bg: bg, sets: sets.map(function (x) { return { enemies: x[0], w: x[1] || 1, unless: x[2] }; }) }; };
  AE.ENC.w_nordheim = T('snow', [[['snowwolf', 'snowwolf'], 3], [['yeti'], 2], [['icewisp', 'snowwolf'], 2]]);
  AE.ENC.w_lumen_wood = T('snow', [[['icewisp', 'icewisp'], 2], [['yeti', 'snowwolf'], 2]]);
  AE.ENC.fgmine = T('ice', [[['minebot', 'snowwolf'], 3], [['icewisp', 'icewisp'], 2], [['yeti'], 2]]);
  AE.ENC.deeproot = T('cave', [[['rootling', 'rootling'], 3], [['fenhorror'], 2], [['bonedrake'], 2], [['rootling', 'fenhorror', 'rootling'], 1]]);
  AE.ENC.trial = T('temple', [[['choirguard'], 2], [['citadelangel', 'citadelangel'], 2]]);
  AE.ENC.citadel = T('citadel', [[['choirguard', 'citadelangel'], 3], [['voidknight'], 2], [['hollowed', 'hollowed', 'citadelangel'], 2], [['voidknight', 'hollowed'], 1]]);
  AE.ENC.abyss = T('citadel', [[['voidknight', 'hollowed'], 2], [['choirguard', 'citadelangel'], 2], [['skyspawn', 'skyspawn', 'redwolf'], 2]]);
  // after the Sundering, the world's monsters change, and a Sky Warden may find you
  const ch5 = { w_ashfields: 'w_ashen', w_meridia_n: 'w_storm', w_nordheim: 'w_frost', w_solmara: 'w_iron', w_desert: 'w_iron', w_mesa: 'w_ashen' };
  const roll = AE.rollFormation;
  AE.rollFormation = function (grp) {
    if (AE.S_.chapter >= 5 && AE.ENC[grp] && grp.indexOf('w_') === 0) {
      const wd = ch5[grp.replace('_forest', '')];
      if (wd && !AE.S_.flags['beat_' + wd] && Math.random() < 0.04) return { enemies: [wd], boss: 1, bg: 'sky', noRun: 1, warden: wd };
      if (Math.random() < 0.5) return { enemies: AE.pick([['skyspawn', 'redwolf'], ['hollowed', 'skyspawn'], ['redwolf', 'redwolf', 'skyspawn']]) };
    }
    return roll.apply(this, arguments);
  };
  // shops
  AE.SHOPS.fg_shop = { name: 'Frost Provisions', items: ['x_potion', 'phoenix_down', 'remedy', 'turbo_ether', 'cottage', 'soft', 'smoke_bomb'] };
  AE.SHOPS.fg_arms = { name: 'Glacier Forge', items: ['crystal_saber', 'sage_rod', 'dragoon_pike', 'mist_dirk', 'echo_bell', 'titan_grip', 'aether_rifle', 'crystal_band', 'dragon_mail'] };
  AE.SHOPS.fg_prism = { name: 'Rime Prisms', items: ['prism:ice', 'prism:time', 'prism:seal', 'prism:revive', 'prism:absorb_mp', 'prism:quick', 'prism:speed_plus', 'prism:encounter_down', 'prism:preemptive'] };
  AE.SHOPS.lm_shop = { name: 'Chime Shop', items: ['silver_bell', 'choir_bell', 'echo_bell', 'elixir', 'turbo_ether', 'prism:holy'] };
  AE.SHOPS.academy = { name: 'Warden Quartermaster', items: ['x_potion', 'elixir', 'megalixir', 'phoenix_down', 'remedy', 'turbo_ether', 'cottage', 'aegis_band', 'prism:flare', 'prism:exp_plus'] };
  AE.SHOPS.md_shop = { name: 'Shallows Store', items: ['x_potion', 'elixir', 'phoenix_down', 'remedy', 'cottage'] };
  const C = AE.CARD;
  C('c_ember', 'Ember', 9, [7, 8, 9, 6], { cast: 'ember' }); C('c_frostwyrm', 'Frost Wyrm', 8, [8, 8, 6, 7], { boss: 'DragonBlue', fw: 44, fh: 46 }, 'ice');
  C('c_rootking', 'Root King', 8, [7, 9, 7, 6], { boss: 'GiantBamboo2', fw: 62, fh: 62 }, 'earth'); C('c_nyxar', 'Nyxar', 10, [10, 10, 7, 9], { boss: 'DragonBlue', fw: 44, fh: 46, hue: 240 }, 'dark');
  C('c_hollowking', 'Hollow King', 10, [9, 10, 10, 6], { boss: 'DemonCyclop', fw: 50, fh: 50, hue: 260 }, 'dark');
  [['frostwyrm', 'c_frostwyrm'], ['rootking', 'c_rootking'], ['hollowking', 'c_hollowking']].forEach(function (p) { const X = AE.ENEMIES[p[0]]; X.drop = (X.drop || []).concat([['card:' + p[1], 1]]); });

  // ---------- Act IV ----------
  EV.inn_frost = function () { return AE.inn(250); }; EV.inn_lumen = function () { return AE.inn(200); }; EV.inn_academy = function () { return AE.inn(0, 'ACADEMY NURSE'); };
  EV.a4_frost = async function () {
    cs.flag('a4_frost'); await AE.say('Frostgate. A mining town in the snow, and every chimney smoking. The Aurex mine cuts down toward the Deeproot.');
    if (inP('orin')) await sayAs('ORIN', 'The Earth Crystal lies under the Deeproot Caverns. But the way in runs through Lumen, and Lumen hides from strangers. We need a summoner\'s bell to find it.');
  };
  EV.a4_foreman = async function () { await sayAs('FOREMAN', 'There was a bell once, in the deep galleries. The old Lumen folk used to come for it. Then something big and cold moved into Bell Hollow, and the bell stopped ringing.'); };
  EV.a4_frostwyrm = async function () {
    await AE.say('Bell Hollow. A silver bell hangs from the ice above a sleeping wyrm. The wyrm opens one eye.');
    await cs.battle(['frostwyrm'], { bg: 'ice', boss: 1, noRun: 1 });
    cs.flag('a4_lumenbell'); await AE.gain('lumen_bell'); await AE.gain('prism:glacielle');
    await AE.say('Ring the Lumen Bell at the snow-woods east of Frostgate to find the hidden village.', { name: 'TIP' });
  };
  EV['place:lumen'] = async function (w) {
    if (!AE.has('lumen_bell')) { await AE.notice('Snow, and silence, and trees that all look the same.'); return; }
    AE.Sfx.play('echo'); await AE.notice('You ring the Lumen Bell. The trees part.');
    w.busy = false; w.enterPlace('lumen', true);
  };
  EV.a4_lumen = async function () { cs.flag('a4_lumen'); await AE.say('Lumen. Bells hang from every eave. They ring with no wind at all.'); };
  EV.a4_elderbell = async function () { await sayAs('ELDER BELL', F().a4_ember ? 'Ember chose you. Lumen goes with her.' : 'Ember is the last summoner of Lumen. If you would take her into danger, she must choose it herself. Speak with her in the hall.'); };
  EV.a4_ember = async function () {
    await sayAs('EMBER', 'You\'re the ones the voice talks about. The voice in the Crater. It sounds like my mother. It isn\'t my mother.');
    await sayAs('EMBER', 'It\'s Nyxar. The Echoes told me. It wears the voices of everyone you\'ve lost, so you\'ll come closer.');
    await sayAs('EMBER', 'If I come with you, the Elders say I have to pass the trial. My bell against an Echo. Watch.');
    const r = await cs.battle(['ember_trial'], { bg: 'temple', boss: 1, noRun: 1 });
    cs.flag('a4_ember'); cs.remove('ember'); await cs.join('ember'); await AE.gain('prism:seraphel');
    // the Lantern House, told at last
    cs.music('sad');
    await AE.say('That night in Lumen\'s hall, by the bell-fire, everyone told what they knew of the Lantern House.');
    if (inP('sable')) await s('sable', 'I grew up with them. Kael, the real one. Vesper. She was like a big sister. She counted us to sleep.');
    if (inP('orin')) await sayAs('ORIN', 'And I taught her about the Chorus when she was fifteen. She asked if the Aetherflow could give back what it took. I said perhaps. I should have said no.');
    if (inP('rook')) await sayAs('ROOK', 'I have the boy\'s last memory. He went back for the tenth child. The tenth child was Sable.');
    if (inP('sable')) await s('sable', '...Yeah. He carried me out. Then the roof came down.');
    if (inP('bram')) {
      await s('bram', 'And I was the officer at the bottom of the hill, with the order to burn it all to stop the "outbreak". The outbreak was one frightened girl with a crystal she didn\'t understand.');
      await s('bram', 'I won\'t ask any of you to forgive me. I just want you to know it was me, from my own mouth. Not from Harl. Not from a memory.');
      await s('kael', '...He went back for the tenth. So will I. Every time. Even for you, Bram.');
    }
    cs.music('mystical');
  };
  EV.a4_rootking = async function () { cs.flag('a4_rootking'); await AE.say('The roots knot into a crowned giant.'); await cs.battle(['rootking'], { bg: 'forest', boss: 1, noRun: 1 }); await AE.gain('prism:gaiadon'); };
  EV.a4_sundering = async function () {
    cs.music('revelation');
    await AE.say('The Earth Crystal, vast and brown-gold, grown through with roots. Vesper waits before it, three Shards turning in the air around her.');
    cs.spawn('vesper', 'vesper', AE.field().player.x, AE.field().player.y - 4, 2);
    await sayAs('VESPER', 'You came. You always come. Now, bright boy: bring me the last one.');
    await s('kael', 'No. Not this time.');
    await sayAs('VESPER', 'One.');
    AE.game.flash = 8; await cs.shake(16);
    await sayAs('VESPER', 'Two.');
    if (inP('lyra')) await s('lyra', 'Kael, look at me! Look at ME!');
    await sayAs('VESPER', 'Three.');
    await AE.say('Kael walks forward. He reaches into the Crystal\'s heart and closes his hand on the Earth Shard. He cannot stop. He does not want to stop.');
    await AE.say('Four.'); AE.game.flash = 40; await cs.shake(80);
    cs.remove('vesper'); cs.music('final');
    await cs.narrate(['The four Shards met in Vesper\'s hands, and the world broke.', 'Far to the north, the Sky Citadel tore itself out of the Crater and rose, trailing earth and fire.',
      'The sky cracked like a dropped plate. Through the cracks came a red light that had not been seen since the Chorus fell silent.',
      'In Halcyon, President Corvin Aurex stood on his balcony to watch, and was the first to die when the Sky Wardens woke.',
      'In the Deeproot, the cavern floor gave way, and the Aetherflow rose to swallow the place where Kael had stood.',
      'Lyra Vale did not hesitate. She ran to the edge and jumped in after him.']);
    AE.away('kael'); AE.away('lyra');
    const rest = AE.S_.party.concat(AE.S_.reserve).filter(function (p) { return p !== 'kael' && p !== 'lyra'; });
    AE.S_.party = rest.slice(0, 3); AE.S_.reserve = rest.slice(3);
    await cs.narrate(['Days later, the Vanguard Academy rose from its cliffs on engines nobody had believed were real, and took the survivors aboard.',
      'Its Headmaster had been waiting forty years for the sky to break.', '"Find them," he told the ones who were left. "The flow gives back what it takes. Sometimes."']);
    await cs.title('END OF ACT IV', 'THE SUNDERING', 200);
    cs.flag('a4_sundering'); cs.flag('a4_done'); cs.chapter(5);
    await cs.warp('academy', 21, 20, 2);
    await AE.say('The world has changed. Sky Wardens roam the world map. Kael and Lyra are lost; rumours speak of something washed up in Mideel Shallows, far to the south-west.', { name: 'TIP' });
  };
  // ---------- Act V ----------
  EV['place:academy'] = async function (w) { if (!F().a4_done) { await AE.notice('The Vanguard Academy. Wardens on contract don\'t come home until the job is done.'); return; } w.busy = false; w.enterPlace('academy', true); };
  EV['place:mideel'] = async function (w) { if (!F().a4_done) { await AE.notice('Mideel Shallows. A quiet clinic town where the Aetherflow surfaces.'); } w.busy = false; w.enterPlace('mideel', true); };
  EV.a5_headmaster = async function () {
    if (!F().a5_kael) { await sayAs('HEADMASTER CAIRN', 'Every Warden swears the same oath: the contract is sacred. Your contract was to get the girl out, and back again. It isn\'t done. Find them.'); return; }
    if (!F().a5_halcyon) { await sayAs('HEADMASTER CAIRN', 'A Sky Warden circles Halcyon. The city is begging for help, and the Academy\'s guns are ready. Take us there, Warden: fly the Skylark to Halcyon.'); return; }
    await sayAs('HEADMASTER CAIRN', 'The Citadel hangs over the Crater. Every road leads there now. Go when you\'re ready. Not before.');
  };
  EV.a5_mideel_doc = async function () { await sayAs('DOCTOR', F().a5_kael ? 'Look after him. And after her. She didn\'t leave his side for a moment.' : 'He washed up in the shallows, glowing like a lamp. A girl with him, holding his hand so hard we couldn\'t prise it loose. She\'s fine. He... isn\'t anywhere at all.'); };
  EV.a5_kael_bed = async function () {
    AE.away('lyra', false); await cs.join('lyra', null, true);
    await s('lyra', 'Kael. It\'s me. I followed you all the way down, so you don\'t get to stay lost.');
    await s('lyra', 'He\'s in there, somewhere. In pieces. I can hear them, like dropped bells. I\'m going in after him.');
    const r = await AE.ask('Enter Kael\'s memory with Lyra?', ['Go in', 'Not yet'], { cancel: 1 }); if (r !== 0) return;
    AE.S_.mindParty = AE.S_.party.slice(); AE.S_.mindReserve = AE.S_.reserve.slice(); AE.S_.party = ['lyra']; AE.S_.reserve = [];
    AE.game.flash = 30; await cs.warp('kael_mind', 10, 31, 0);
  };
  const FRAG = [['Thornbrook. But not the real one: the one Vesper gave him. The well on the wrong side. It doesn\'t matter. He loved it anyway.', 'Some of what you remember isn\'t yours. All of what you DID is.'],
    ['Reactor 4. A frightened Warden on his first job, pretending not to be frightened. That one\'s all his. Nobody else was there.', 'You caught me. When we fell. That was you.'],
    ['The Lantern House, rebuilt. A woman holding his face. She knew he wasn\'t the boy she lost. She held him anyway.', 'Mother Ilse called you by name. You let her. That\'s kindness. That\'s yours too.'],
    ['The Wind Shrine. His hand opening. The shard falling into Vesper\'s palm.', 'You couldn\'t stop. But you\'re still here. You came back every time. That\'s who you are.']];
  EV.a5_frag = async function (e) {
    const n = (e && e.n) || 0; if (F()['frag' + n]) return; cs.flag('frag' + n);
    await AE.say(FRAG[n][0]); await s('lyra', FRAG[n][1]);
    if (F().frag0 && F().frag1 && F().frag2 && F().frag3) await s('lyra', 'That\'s all of them. Kael? Up by the light. Come on.');
  };
  EV.a5_mind_end = async function () {
    cs.music('peaceful');
    await AE.say('In the light at the top of the memory, a young man sits with his knees drawn up, very still.');
    await s('lyra', 'Hi.'); await s('kael', '...I don\'t know which of these are mine.');
    await s('lyra', 'None of them, some of them, all of them. It doesn\'t matter. The ones you choose. Choose, Kael.');
    await s('kael', 'Then... I choose the girl who wouldn\'t let go of me. Twice.');
    await s('lyra', 'Good choice.');
    AE.game.flash = 40;
    AE.away('kael', false); AE.S_.party = AE.S_.mindParty; AE.S_.reserve = AE.S_.mindReserve;
    AE.setParty(['kael', 'lyra'].concat(AE.S_.party.filter(function (p) { return p !== 'kael' && p !== 'lyra'; })).slice(0, 3));
    cs.flag('a5_kael'); AE.healAll();
    await AE.gain('surge_manual_kael');
    await cs.warp('mideel', 23, 24, 2);
    await s('kael', 'Kael. Just Kael. Not Ardent. He earned that name. I\'ll earn my own.');
    await AE.say('Kael rejoins. Halcyon is under attack by a Sky Warden: the Academy\'s headmaster wants to make a stand there.', { name: 'TIP' });
  };
  EV['place:halcyon'] = async function (w) {
    if (!F().a5_kael) { await AE.notice(F().a1_done ? 'Halcyon\'s gates are sealed.' : 'Halcyon.'); return; }
    if (F().a5_halcyon) { await AE.notice('Halcyon is rebuilding. The plate is down; the Sumps can see the sky.'); return; }
    w.busy = true; AE.Music.play('boss');
    await AE.say('Halcyon burns. A Sky Warden coils around the plate pillar, tearing at the city. The Academy\'s guns open up from above.');
    await sayAs('DRAGO', 'Warden! Over here! Aurex Security is with you. What\'s left of it.');
    await sayAs('DRAGO', 'Corvin\'s dead and Vesper\'s gone. I spent my life protecting the wrong people. Let me protect the right ones for once.');
    const r = await AE.startBattle({ enemies: ['w_halcyon'], bg: 'city', boss: 1, noRun: 1 });
    AE.S_.flags.a5_halcyon = 1; AE.S_.flags.a5_drago_joins = 1; AE.S_.flags.beat_w_halcyon = 1;
    await sayAs('DRAGO', 'It\'s down. Halcyon stands. ...I\'ll be at the Academy. Ask, and I\'ll fight beside you at the Citadel. That\'s the fifth time we\'ve met, Warden. Fifth time\'s the charm.');
    await AE.say('The Sky Citadel waits above the Crater, far to the north.', { name: 'TIP' });
    w.busy = false;
  };
  EV.a5_drago_base = async function () { await sayAs('DRAGO', 'Five fights. You won four. I\'m keeping count. Let\'s make the last one count together.'); };
  EV['place:crater'] = async function (w) {
    if (!F().a5_halcyon) { await AE.notice(F().a4_done ? 'The Citadel hangs above the Crater, ringed in red lightning. Not yet.' : 'The Crater. Nothing grows here. Nothing ever has.'); return; }
    w.busy = false; w.enterPlace('crater', true);
  };
  EV.a5_citadel = async function () {
    cs.flag('a5_citadel'); cs.music('final');
    await AE.say('The Sky Citadel. Halls of white stone floating on nothing, singing faintly, like a choir heard through a wall.');
    if (inP('lyra')) await s('lyra', 'It\'s the Chorus. Every voice that ever sang the world. They\'re still here. They\'re just... very quiet.');
    await AE.say('Three great gates bar the Throne Stair. Each opens from a switch deep in its own wing: split up and open them.', { name: 'TIP' });
  };
  EV.a5_gate = async function (e) {
    const n = (e && e.n) || 1;
    const team = { 1: ['bram', 'sable'], 3: ['orin', 'rook'], 5: ['ember', 'vesna'] }[n].filter(function (p) { return AE.S_.m[p]; });
    if (team.length) await AE.say(team.map(function (p) { return AE.CHARS[p].name; }).join(' and ') + ' hold the gate guardians back while you throw the switch.');
    await cs.battle(['voidknight', 'choirguard', 'voidknight'], { bg: 'citadel', noRun: 1 });
    AE.Sfx.play('door'); cs.flag('cit_gate' + n); await AE.notice('A gate on the Throne Stair opens.');
  };
  EV.a5_vesper = async function () {
    cs.music('final');
    cs.spawn('vesper', 'vesper', AE.field().player.x, AE.field().player.y - 4, 2);
    await sayAs('VESPER', 'You came. Of course you came. Kael, look: the throne. From here I can sing the world into anything. No more fires. No more lost children. Nobody ever forgotten.');
    await s('kael', 'Everybody frozen. Nothing ever changing. That isn\'t remembering, Vesper. That\'s a museum.');
    if (inP('sable')) await s('sable', 'Vesp. Stop counting. Please. He\'s not coming back. The real one. He\'s not.');
    await sayAs('VESPER', 'Sable... little Sable. You always did say the cruellest true things.');
    await sayAs('VESPER', 'No. NO. I can fix it. The voice promised me.');
    await cs.battle(['vesper1'], { bg: 'citadel', boss: 1, noRun: 1 });
    await sayAs('VESPER', 'The Shards... take them... make me MORE.');
    await cs.battle(['vesper2'], { bg: 'citadel', boss: 1, noRun: 1 });
    await sayAs('NYXAR', 'GOOD. SHE HAS CARRIED ME AS FAR AS SHE CAN.');
    await cs.battle(['vesper3'], { bg: 'citadel', boss: 1, noRun: 1 });
    cs.flag('a5_vesper'); cs.remove('vesper');
    await AE.say('Vesper falls to her knees, the Shards dark and cracked around her. For a moment she is sixteen again, burned to the wrists.');
    await sayAs('VESPER', 'Kael... I counted you to sleep. Every night. One, two, three... I\'m sorry. I\'m so sorry. It isn\'t her voice. It never was her voice.');
    await AE.say('The floor of the throne room opens like an eye. Below it, the Aetherflow, and something vast and hollow rising through it.');
    await cs.warp('aetherflow', 19, 35, 0);
  };
  EV.a5_nyxar = async function () {
    cs.music('final');
    await AE.say('In the river of all memory, a shape like a hole in the world. It speaks in the voices of the dead: mothers, children, a boy in a burning house.');
    await sayAs('NYXAR', 'I AM THE FIRST LOSS. I AM EVERY LOSS. LET ME BE THE ONLY MEMORY, AND NOTHING WILL EVER HURT AGAIN.');
    if (inP('ember')) await sayAs('EMBER', 'You are not my mother. You are Nyxar. I name you, and you\'re smaller now.');
    await s('kael', 'Everyone who ever lived is in this river. You don\'t get to be the only one.');
    await cs.battle(['nyxar1'], { bg: 'underwater', boss: 1, noRun: 1 });
    await sayAs('NYXAR', 'THEN I WILL BE THE LAST.');
    await cs.battle(['nyxar2'], { bg: 'underwater', boss: 1, noRun: 1 });
    cs.flag('a5_end'); await EV.ending();
  };
  EV.ending = async function () {
    cs.music('ending');
    await cs.narrate(['Nyxar came apart like smoke.', 'And in the river of memory, Lyra Vale began to sing.', 'One by one, the voices of the Chorus joined her: every singer who had ever lived, rising out of the Aetherflow.',
      'The song held the sky, as it had held it once before. The cracks closed. The red light faded.', 'The Crystals did not come back. Their memory was in the song now, and the song was everywhere.',
      'Without them, the reactors of Aurex Dynamics went dark, one by one. Halcyon\'s plate came down in pieces. For the first time in forty years, the Sumps saw the sky.',
      'The world had to learn to live without the Crystals\' light. It was hard. It was worth it.', 'Bram Hollis went back to Thornbrook and built a new mill, with a red roof.',
      'Sable and Mother Ilse took in every child the Sundering had orphaned.', 'Orin Thale wrote the history of the Chorus, and put his student\'s name in it, with kindness.',
      'Vesper Lune was never found. Sometimes, in Lumen, the bells ring at night in a careful rhythm. One, two, three.',
      'And in Thornbrook, beside the memorial stone with a dead boy\'s name on it, a young man and a young woman planted a bed of crystal-moss.', 'He had chosen his own name by then. It was a good one.']);
    await cs.title('LEGEND OF AETHRA', 'THE END', 300);
    await cs.narrate(['Created for Torn Arcade.', 'Art: Seliel the Shaper (Mana Seed characters), Pixel-boy and AAA (Ninja Adventure).', 'Thank you for playing.']);
    AE.S_.flags.cleared = 1; AE.S_.cleared = (AE.S_.cleared || 0) + 1;
    await AE.say('A clear save lets you keep exploring: the Abyssal Spire, the trials and the super-bosses still wait.', { name: 'TIP' });
    await cs.warp('academy', 21, 20, 2);
  };
  // ---------- trials, super-bosses, the Abyssal Spire ----------
  EV.a5_trial = async function (e) {
    const echo = (e && e.echo) || 'sylphine', foe = { sylphine: 't_sylph', glacielle: 't_glacielle', voltigar: 't_voltigar' }[echo];
    await AE.say('At the altar, an Echo takes shape to test you.');
    await cs.battle([foe], { bg: 'temple', boss: 1, noRun: 1 });
    cs.flag('trial_' + echo); await AE.gain('prism:' + (echo === 'sylphine' ? 'aethrael' : echo));
  };
  const superboss = function (place, foe, flag, text) {
    EV['place:' + place] = async function (w) {
      if (AE.S_.chapter < 5) { await AE.notice(text[0]); return; }
      if (F()[flag]) { await AE.notice(text[2]); return; }
      w.busy = true; await AE.say(text[1]);
      const r = await AE.ask('Fight?', ['Fight', 'Leave'], { cancel: 1 });
      if (r === 0) { const res = await AE.startBattle({ enemies: [foe], bg: 'sky', boss: 1 }, {}); if (res === 'win') F()[flag] = 1; }
      w.busy = false;
    };
  };
  superboss('chapel', 'ruinwyrm', 'beat_ruinwyrm', ['An empty chapel on a lonely isle.', 'The chapel bell rings by itself. Something enormous uncoils from the cliffs: the Ruin Wyrm, oldest of the dragons.', 'The chapel is quiet. The Wyrm\'s bones make a fine roof.']);
  superboss('hermit', 'hermit', 'beat_hermit', ['A hermit\'s hut. Nobody answers.', 'The hermit is an old mage who has waited a long time for a worthy opponent. "Ah. At last. Shall we?"', 'The hermit is gone. He left a note: "Well fought."']);
  EV['place:abyss'] = async function (w) {
    if (AE.S_.chapter < 5) { await AE.notice('A black spire, too tall to see the top. The door is sealed.'); return; }
    AE.S_.abyss = AE.S_.abyss || 1; w.busy = false;
    const m = 'abyss_' + (((AE.S_.abyss - 1) % 10) + 1); AE.WORLD.places.abyss[2] = m; w.enterPlace('abyss', true);
  };
  EV.a5_abyss_up = async function () {
    const S = AE.S_; S.abyss = S.abyss || 1;
    const r = await AE.ask('Abyssal Spire, floor ' + S.abyss + '. ' + (S.abyss >= 50 ? 'The top.' : 'Climb higher?'), [S.abyss >= 50 ? 'Face the top' : 'Climb', 'Return to the world'], { cancel: 1 });
    if (r === 1) { const p = AE.landNear(242, 54); AE.toWorld(p[0], p[1]); return; }
    if (S.abyss >= 50) { if (!S.flags.beat_hollowking) { await cs.battle(['hollowking'], { bg: 'citadel', boss: 1, noRun: 1 }); S.flags.beat_hollowking = 1; } return; }
    S.abyss++;
    if (S.abyss % 10 === 0) { await AE.say('A guardian waits on floor ' + S.abyss + '.'); await cs.battle(AE.pick([['choirguard', 'voidknight', 'choirguard'], ['w_iron'], ['frostwyrm'], ['rootking']]), { bg: 'citadel', boss: 1, noRun: 1 }); await AE.gain(AE.pick(['megalixir', 'elixir', 'power_source', 'speed_source', 'luck_source'])); }
    const m = 'abyss_' + (((S.abyss - 1) % 10) + 1); await cs.warp(m, AE.MAPS[m].entry[0], AE.MAPS[m].entry[1], 2);
  };
  // monsters in the Spire grow with the floor
  const mk = AE.mkEnemy;
  AE.mkEnemy = function (id, slot, o) {
    const f = mk.apply(this, arguments), fl = AE.field(), S = AE.S_;
    if (fl && /^abyss_/.test(fl.mapId) && S.abyss && !f.d.boss) { const k = 1 + S.abyss * 0.03; f.hp = f.maxhp = Math.floor(f.maxhp * k); f.atk = Math.floor(f.atk * k); f.mag = Math.floor(f.mag * k); }
    return f;
  };
  // Sky Wardens: mark beaten wardens
  const sb = AE.startBattle;
  AE.startBattle = function (form, o) { const p = sb.apply(this, arguments); if (form.warden) p.then(function (r) { if (r === 'win') AE.S_.flags['beat_' + form.warden] = 1; }); return p; };
})();

AE.store = { get: function (k) { try { return GM_getValue(k, null); } catch (e) { return null; } }, set: function (k, v) { try { GM_setValue(k, v); } catch (e) {} } };
let readying = null;
const DATA = {"version": "1.0.0", "worldz": "H4sIABnQ+GoC/+2dW4/bOLKA/0rDL/viBxUpyVK/LbI4MwdnB7vYDM4+BEHgdHvSPuNuB3Z3gsFi/vuhLrZEsXgndek0KCQ227Ro8lOxWCwW/7P6vrolWb5ePaxuoSTr1fPq9gMh6/6VBExWX2f04SiVBS4F+dlBrmTSNNvqTQNKAwdliX0h+zcMLBE4AUl640Rf/xBShA4S4VrfvUcCQtJVE1qSL0xPBslEnJjf2bOaXa+TNg0poRwbRZtsOWnqOHz2Ldq+YYNwVSNXjOMIlVmMh8JtAt4db7phTtFrbjEV0nTpCH23iHxdypu2fyc6SkkiPWzCalRqWCbWhixqAOiIgPUq9F7L+59nA+uTYnAX7BGW1cOOkepzpSbxooUEH3ZGxiOs6ILrmKzuELtUWicRFPUdjAABo1sPtadxumsaMKzZAOVQEIsGOSW0R4sXIWBEB41Kx5j6R3g7wEV1GxcBF7HC53SvAYMCDNEolROvHxuOZuIhPJEb5Cpnni6daiwyMDY6BfWNj25aqmVjOZx08ysXNGIJkVGnuGEZQUf0zbIxaSDRDVaFEpD+VHeeaoE3kp6cmFASEJQYmo5Mkuj1LFyivD5Q7CYxYg8ZQmLMif/kqHDixO3+mFABH9ul+7LBfFDhQbk28SYAK0WU5COlfFgxH3zEboi5Vm0LlD82fUPV4Ml0w6aYIMWDFdNa9A2t0woCXlMLHhk9tgwVs05pmy7vfGQPur4Y3hVmLhSZLO+pBoJXwE8qSa56TkPRJKCMrTbrxI6hkrlggFJlcgWIvGaATEYsqznKQiVP6glPUHSS5ZJjNlDhCuirGawwbHBtW2UWtnGciasNxcWFGk9wi8Umc1Jkv1ZGiqWKM4LiHHMo0htD5tHfQKsrFiuutNDRaJnWLxcMXNbmQwnQqIIlRb0izJaeRoBlmhVu2YrS/CjxYGT4I8xIcecELLvdY1Sx+OaQWq18NWfhogTrdDehQsMKFXsVd+INADBjLTTAeCNfQLCRKtQ4EWu5YjaRnnyrCMyUlCCM6BUvM4FCrUjxMtRZ7skZB5PpISljAhLGiYZaYgK+mFhu14tIyBz46D/VEdjwp8RWiASw989l14joeDuVs0FUMvwYsR1iYFo+kteDR09gjDGLUu8sDSE8INRSod8qcNDxhc4BjdjTbLEz44wtMJWhPZYpbQo+kLEkLiE0eiIOJrRYQiSmfXWaVZeYEsRGr5QFXzAzrsLE63TItknfbSnzMIHEw8PskYdWc6DOcEy/jNvDomPdD4/pVI9CogmMIzMIF9yk/6jxskSEiXApjtRwgaNf9zB72kATtMY3EeN+43XBwiCgjt84ggtd4LghHA9UErJtLh4gEHzPIzj2gVmUCXHWLO8v1VzBjASzHaLqbV2XOsPoJARUP0AxqfIxf9DAsFybdBhPRd2HZnNK9/nIUBKoF7qn32bhO5GJgQsEx+Xa1j3lWjZzIFJm4sxI8bHGwCFjody0SiwJHqehU4ppSPki54aX9EQqbWzXRUgvXqNsNms3KVw+Mwnawv7RX7q+G3a/o4zB3CH6IyDhovXZmyoIEtiz+xHDCKWuwMyCkXAqzbAxQsX6kGl6bmIGcY/owlXzPSgTOHJzGK+Ycusogn4KXDhhN/vTbOlxmlb3W5t0LRd3c484W1GyI/fI4o0bXaRZYsQQHi6Yf68JCehqwnRzhh4PP395EeZ78L+K4RTkKpfNHrm+qgWdUZIoIx/THnlRY2xZxD/QOcGGl2koAFOFPxVDmYuP93B+ggfH58tatUUXmLwf97wZeQia7OLq+MU9sYunYd0bgw8ZgEMl/RV1EVKklg60UIrExieDGd3QwA6IMc2EGNozvAISN11EFyJpvxF3bQUJeqE6qyDueSLJgAS1pqFTz2WyMzFtTVCs/TQpr1OoBdcoSsg42PBPmN8o7sqMvzHNwOSemEQBkJl2+lzn10TGP04j5D4wT9rBaA091mTJhxvOJbk/v7NuS5n1RUx5FG4izHDibsEAQ2xC+0zhSowPPPx02RYbU7+lfJBmdILZuNhY7JUNzUycVSAXr1XV2oOOHGozGR/Vuhd9gyAYe3yF9eCN6dhq52AAVujgYscSHaOznxYBEhiLn7CKcVy/aMOzf4YzfOrAD3gcAjpWeKZIWwvBcNgKRw6JSs5Q+Ijaj5k6rMdGtFOH02TiTbpinC1m8iwnQQmy6y+/iXs+XIu09tOWE6S0fY4gLSJHKAwzgJHghy65aBluEPU7m19BdyaISmRQ2C6f29K57XnaMvtqMjJG4izHf9RxMS+B6osxiKL02mI8LfiD2clgc4blYeB+FOVI8qUo5xa8jBkiOEZUwCjeBGo2PPmf1Ox+poULSnkwkPCRkViCJGWp+fox9ifMx0ksmeT0eReY8sAg+atZDUlVKCm1+jhqB76WGPHxYIoBkitMXTSyDiY5UDQmTovVmBwN9/4oxcHIDSUeJI4lOU/jbdZ9/SdXWAc0IA4cARkBplQqleQ0RRvqxkHJ0CVkVnDJttVY0TQCUKkBUOl45+CM42EkdanSnEI3A8lEHMa28Ulq7oiH/40YsiSw64jNPtdkruz0l2Vt1aEQ4ORBBJAMHfAZQ0Ic8ej4lZEDwYZZjbXXnccARqtNq4jRD1rO2w+idGc8QLy/pPNGt1Ngp2DERqQQ+V7F4K6Lsc96nGQqDk5T7rHHmtlikcwsBYobC9YmGCCB1rOijCTRiEh+ACD6YgJTA2cCBFUeeWMczjd5S3KQOtmAgSBrbSDRbbduKBC1j+pbpyujhfZ7JTVqcVe1wYYFM7sGxgJoN2i9JRSG3EAiiM0+Pgw2YgEWsg4ySxxsULg0/hg4UFP9MTUdIt6QMPXkTC3TODxQI+HgfIbMGwLivJJODIQJEuazS3Wgo2mJgIDR/gNNknVbBhygoKMwYU4E0Ucvmw6L4Ua7KbGQr+WCdulpJC6uvV8i18Azv76l2aLGTPG4RGkJFwg1sPUKRWO8cWSw37Q0vTpADG9MZjusgJTn+agZvoDQsfmA0g4P2g+S+AbINIAEWP+yw6O0vKstIWPpikskxNaYEcTBNHehIwogwxOMYgIyPyXELG6GHRyuIsSdjisgZej4L1h7xCakf0oSzIyPpBdS1JYRr2UzB+HRn9rY46F36ZPtco7NxzzMHjanqukJsXXBAeguV0QwPqAMePwlSHedzrPjxrfemQgRex+tPhwDSqwYofgQA6XTManSOIZ0gYiMI4X8YjH1IUGRkF22qFCpNgKl45m6yyZFFrQ+djBkn7hdbZ+B42XDSyHkePEi2VSHPzxzVClVwc/6/grzQSarU9XzHtSIyzR6XJznO12tZciIYefIDCeoIi8UmaApNoVOAUzWAwa8xAwSI0ctXHhgXCo9NFVIJDsZ4YiEMDtgdbGywxqY3SKRZkNmIAwzdLjsV4Qwx2LAYKbPJcxe1bQQ4ZCN0LTYa7whWZHjQitW/PfKDCFZ6mxYpWkRs6Od/DmxYSUz5CR1HIdwSMCNE4wSM04899mOp+TKlKxowFDLoUiHS4pddsRgQgV8eLEnZt6ejtrD8AIc/2dm5iExqbFhRzEY2ZMj40Y361lCTKHQYU3chylzfjzoUTLEWWaK9gqx/RfHRy96FhKXyuT+sc4PtguCb6DcuMNzRSavhEwuj19s6aeQSfkhr4OfqOfW6nyAXQYBnAFqAE9af+wyNrUXHV65nh5/0fMGj8shES5By/kHGCcHzOAxn2UF4UblmhsqctVSwYl//qaaGxpS3QkfjU3msLtwgWN8UnqYgOsRsfGYaUntf17Tc72n5rInW/o6BI7WTz0WoRCHCBrAvjNTeBYhfOwPwPKLvKU/slqvbmroEUkCD8NyJIBMl7eXpfLErKG9mizhhoZZrDLnxnoLgckmtuWjYyN3xj2vHl0pDI2N2SQrKDcRDpiel2kwdM3szcdxgTHRdMKqORBD7xzjVBUHaMb2HBbGJweHYSOPYrmc4RbJA0EDvpFfHQXQ4oPE2C9VCecXBkPGCBsfUQPCuYvjciNXPZa4o8VF4IDB1hV7aKJhAxgzMqd+vD8dHRiMj2JZ1g4ot4EKDDc9WQBjBY0xNxJebHRhfklv6AAzr7OfYjq28sGN7FZ6wGqrnBksqmB0YKcHKyixoQV/noan4wY84sWbIeh5yEy/u6W3DG6691ZLiE3gQhUqBoiYo3IZrInCLhj5VE6Xzd4k0jHhPqyYdor9Pn/lNj3iCocZJOY+j9ZhM4NQAoj+QHpIxzlMHtZuPrlBAaGy7QmYJAEnNkyc+Gz900Y8+VA8E4d4m7FjOUNEAUSDCPhzoSLEXrOPfJShjBMzP5G+4jQFIQ0lwQmRMgKI9uppkwOkI7olWLcQBzGPC9eBkmvVpmkwoTEwiXtolAoSUASQiQiJiTajP4At166eugsU94aZjA9/QghKiPePddFJQKPL4P5KuSUjrsqJqfTYCKkR/c3rqQCprsTDmUUYZujYjPRtGmAmPvgBGXpXHsR/x351cCNJ0P/TiGwkvesCSf+yjzBku1oKoYYbGARqxymRh9LnAbleYdwubKa7RoyMx8mACBQTS1LAyQQAJr5ToA7US4UQQCAnRDxqwYoQV6VV9dRsFAmwP4/PR8KNOKEQMbUkqufeRHpOlQxB9POqSqGI5BpmQyGycUgT8NFcTXIUJMSZELM1IT5RRZA82RZ6bzD8zirxxSI+GlIqJGy4C45AE7lLgA3Qq78CA/jsQcJEHpQJcQFz45EmYaL3Q+yYkJ3XA7ZUgHpIsYjAKQTCQz4nAhEaiaHaJetuklTX7KDgmbCjQm4AAE8nN9G+HMu0LPUODrRYq4Lhes2LiAHZVkICgoVlBPtt9XPlQSceBjTomJhSRtgRQTREBGAi45K9QW4qItQ6JUqEAgo6qZgwR0JtNAbH6K0gwyFzs9A6QwEBjmTAkZABMaGgoIZIqLU4Xbxxr4XGzJMHqo2NFZMIGlhIjGvDQnEwmeyZPyaWPPiyoB801D6U8MPRQAaSATp7hLtjlx8NV38mUw7c20slGyCYJ+jGkIaYcwy9iObts9DatHXlzFeYTVEQRwSgBhjImm3jeSY8CaZFmqEQy/jQ90Ez/dwFA2URWy8DtbqQKRLYuyPYtiJOgXFQLzUI0xuqux8CBsbEixQEBJxhH9qNnJjGlhkljR0qTKPiDBDjwG42P3sKyzRY2gABcc3tpmKupxEMV29MAdCuXmw8kwoC8IZAJgHdEXDzf4XBYZTmdsPQpwLzSzamACDGhcuIHyq5O+iaggDeS9uiaYRYDQiyp9vEXBh6s3B/IdEGAA6ETYTk6tBvulsNnJxgcAhso83Lp/VymAi+7zzshm4ZB9TALRXicLBxnP2Yc0Cl/hc2dYOenqfe8UyMlgrlJEDwkEUXAMS7miOgdRWbPwgqVxzTWglLx72mFZX6/l9NAgkQDi35qOATiZxab9hXt08UGOJt9tI9ffrRQDYzA9H8K8z4zE6lGCJlFtAm7oGB+j4bCQTiMT+yWXszAdJ2DLY5nCQxgsY7UjgJTEEUEpQO28E299GB/B3+aBmJcUPxOAVmTCJFbrbrNoEDZvkM7TpI1p01NdRmYDA860U1Li0uZFgsCAYYNK794S21l34K/0CCZlc0MR2jXwsH7o/wlYRYFMQ+TVyMesPHNokwRE8bDC4WCVcWfEjQrbSMcU74cJ8HMZcHSwsMGIuETRcI3UcibFDX/Vhxh/zipy0VAz0Kvqq+l4qI6en82hpMEk4zitY+bzXBk4EAGGxQDOhsj3hfXmThqASEtRwQrUHtLYXtfh8EQgkAnoCxet4sIPQiw9CHOPtrShjGxmGykM/LkA+uYMRCgswTiTHAGO9+LptbpgFjKC+mB2OS4WTc+y0Rj/iSw+PMEh6eJR3rp5xUZ1WbZ91VT+36b9xRiYVJ/d0LACVWD04zvl2tcZnq8ljtJlFWuzcjKKjmAIyvoEylDLXON5n+modo6fOSTK+9/mi4JMa4CMRMywsZ0Q7mqtFG67/JplkRYYmByhSweE2SI7MS9xzSIKDQBYMihkFcjD1lGhOeByXaeLDRTCl+ofZ55xuzCBrzoySZJyQoJ9Mw4hNwX3TwN/USnhKSMXURadB7P1ToqEt6IQLv41uC+qG9I67v+PI0rg6rOiuBxBmIoiPjprOA9rCBsFImmBvhnKZYvZ1OocEJJ2zozMhJDC264UaXuZiHe8ERMtH6vyxyyCTkKBBBSnt2+nxsfw01md1lt3wUDRnCHTgCgaC5ajdeTR5LZZ6P4bi3g9eVF+mhXsHkTHfQ7uBcGo8TZCDKAYq2Y5hZz7vA5gmREhm/OFLRFGDsjBHfSEPA7bAgwd1rVY+7raSZ1YqULyXYEX1mg4rWNhx941z4O6g7b4TTaP3pmZwVe3cZslA/+gASxQOXIBJHP0XyO6B3AMyQBvNRrNuWRxbLS//xHnZdVGR0q+QuS2dG8+uxTxYm2jALsHB2/Px6RxjBxCBUypgW2nN2xwToEjKVP5qTDOKwTSUyRnO5SiaCB2SH0wmNboZPmKFLD48YSWoYtY1MNHJFX1aU9uUo49aAHmoYVCU0PRbmQCVL5BpqANDBOBlYY5a7+9R/XTMWR6pBhzhxpAv9ZGtP5mBSmQ6J0am+8Eo2M0/Fk+6mYBFdyPCrQVCyQtB0kU5a0zT5wTa+zwerxJAq4kKVGDL+Gggt8750ZPUQ+/FiKlj6Z0Sevpl7KTjfsJtlkfHIaq8fOtZGnCmebrKqMiMSf6aSDinoeXW8ITVPA5XHnFQWbdt1OtSPxA+WHqtqTVx2kTdgnGyafvt1hw7cECDIM2fhzAJf5IdTsoMZnnyWlEnPVBc6AnRQVt74GN0hmZAAbi6mCFpgIHx8UjBmG3VqvM028WOAEplE6EEBUf1kplrAWk6wqnE3ceoc8mbTAXWDfFyvfl3d/md13m1Xt8l6dX7YHg7H76tbWK8+77Z3D6tbsl59OW3P59UtXa9+O5525+fVbbpePewPB5aZrVePx5cnlpevV/e78+7EXm7YNz1VX1M0L9pPlOzd9+3jV/b17F7bM/t2YDc67b/tTuwlu9PpuL1nr9id7vbPf7BX7Eb/9/L05bBjr9mtDttvrKLAbnV32j7Xpdi9Ttv9gb1iN/tte3pkr9iNHndn9kl2UPBqf8cKE6hqt2O3JuTP9errYXu3O1e/nP3guz+OT6vbD5vqgG/2+Tbn0xd2g1XdVE1l1quf28+yVnt+OJ6ePp+Ox99ZSUjSdZFymU255+P3J1bu1y6fFX3cn5+/H4/3VUH2S9htu6ymWNvK69Uvl3xW7HeWddqx3/mhLNg0J+lymkKn7RPrrvXqf5rcm3/V71nB4+H+cf/E2uBDUa43eZfR/rbtN/Zy9Y/D/c0vVS4r8X3/dP/AsqtWqe6Upf289qftHr8eqoL/vv6BlfyyP9zvql9Gcxb/m1wyPp2/7k+XG7avVz/Vf7p5X79lZb8eT8+H7aluUFYUKkaueU3R6i0r+U/2383fq2xW7Lw9PD/uTtXvg2zTtMw1jyv2/pJblXp8+cKoOp3rYklb2dPx+fnIt8v7ywf/cvNT82dW+u542lY9ASkruSFtxie4/EL2NK1X76q8m/esG55fHut7vjyd77anqlxZjQ9Zl8Xh8r7NbIqcXvZPdS03rNvTvJfX9nvz+lLq5l/1+6rfT/uqAwlh98qL5v0ndotd73bV69U/2B/+cr75tX7LCt6/PO2+n3Z3VU+QakKdkn5mU7h9vfrbNb9qF8ZC9VCym1aWm+KSc22Zb8fD3fbpWKFdiYSbd00BVvS30/H8XD9y1WORrBlAvTyuff7rmv2xeajZk/Xc9iMhXdb1rm1X/q3Nv3nH3p+aRjq8PDaYF3ldtnnfVpZJuO2XquTf69yPndT5UDK+0+v79jbtG/a8727eNW9Yme3nPyrp+YGwZsxI+/5at0sn/LXKrXi5PA7P2wMTQvtzJfo+0GRdEC6Pf+j/yerNqnrz39WfqsKnPePxy7YuzJ6INOHyWkwfTrUYWP3E8m5+rf7cla3bvi6cNbfu5Q6K1/0xLH9+Plai+AOhxbokfO6g/Psqsytf03T54dXjDNX9e7k8gO8f9l/r1zfvjt/qH/+wOz3uayAYhJV4bTOacg8vlSz4uc5i1P/M3lYd+7D9WgvXCqKiuGYMhF3Vvjfvmj/VopyxVpXasMWSNL1mDPn5pc6+ed+MrjV427vt/e7xjwolphawAeSaw3Pxv9unLy/b0/3NX9s/f2TD12n3pRq72FOyul19/8SE2v5+v/1UiQFA8giSR5G8FMnLkLx8kFc9lBskr0DyGItInVOkzilS5xSpc4rUOUXqnCJ1TpE6p0idM6TOGVLnDKlzk8e0nd/2u8N9U2cxL0Py8sH3NXXOkDpnSJ1zpM45UuccqXOO1DlH6pwjdRa/b4PkFUhest60eedtXV3uLeHfUv5t2r7l67dB6rdB6rdB6rdB6lfw9Sv4+hV8/Qq+fgXCaYFwWiD1K5D6FUj9Sr5+JV+/kq9fydevROpXIvUrkfqVSP1KpH6QIFAimQTLpFhmimVmWGaOZW6wzALLZJUHrPKAVR6wygNWecAqD1jlAas8YJUXM8uW5vPx8Lg91XAkYhaIWUTMujx4rbLHclIhJxOKlS2vXA0KsQZNVjuRrCswzLk8WP37F8L9C+H+pXj/Urx/Kdy/FO4/zEmFnEz46vLCFFcBMe/6OPSrIGRRMSsVszLx+8sLHXw1AKkGiCyIeRTJS5G8TMxjak6d83Q83T/s9o/14yRkETGLilmpmJWJWbmYtRGzCjGrRKp6qX49Y/jUzN6rdsNyCZqL/A5Afgggv4R1mdh2ILYdiG0HYtuB2HYgth2IbQdi24HYdoC0HaBtB2jbAdp2gLQdIG0HYtsRse2I2HZEbDsith0R246IbUfEtiNi2xGx7QjSdgRtO4K2HUHbjiBtR5C2G+Sxmce33cP+7tCYzurZ6Or26eVwYLO53/ePj7vGuMG6N6tMi5+P23oaRiuJQGpzxud6isVgImk1Cdqfzmz6drUz5B///PP/AY/4y/1EswEA", "sheets": ["floor", "nature", "water", "house", "relief", "elem", "detail", "infloor", "dungeon", "desert", "towers", "village", "field", "floorb", "hole", "rdetail", "pipes", "logic", "bed", "camp", "ground", "walls", "fills"], "fills": ["metal", "darkmetal", "grate", "carpet", "crystal", "void", "cave", "marble", "ash", "lava", "aether"], "fx": {"Attack_CircularSlash": {"fw": 32, "n": 4}, "Attack_Claw": {"fw": 32, "n": 4}, "Attack_ClawDouble": {"fw": 32, "n": 4}, "Attack_Cut": {"fw": 32, "n": 4}, "Attack_CutDouble": {"fw": 32, "n": 5}, "Attack_CutX": {"fw": 32, "n": 4}, "Attack_SlashCurved": {"fw": 32, "n": 4}, "Attack_SlashDoubleCurved": {"fw": 32, "n": 4}, "Elemental_Explosion": {"fw": 40, "n": 9}, "Elemental_Flam": {"fw": 25, "n": 8}, "Elemental_Ice": {"fw": 64, "n": 5}, "Elemental_IceB": {"fw": 32, "n": 9}, "Elemental_IceFlake": {"fw": 96, "n": 3}, "Elemental_Plant": {"fw": 30, "n": 8}, "Elemental_PlantB": {"fw": 30, "n": 7}, "Elemental_Rock": {"fw": 30, "n": 14}, "Elemental_RockB": {"fw": 30, "n": 14}, "Elemental_RockSpike": {"fw": 54, "n": 10}, "Elemental_Thunder": {"fw": 40, "n": 4}, "Elemental_Water": {"fw": 44, "n": 10}, "Elemental_WaterPillar": {"fw": 30, "n": 9}, "Magic_Aura": {"fw": 25, "n": 5}, "Magic_Boost": {"fw": 53, "n": 8}, "Magic_CircleOrange": {"fw": 32, "n": 4}, "Magic_CircleSpark": {"fw": 32, "n": 6}, "Magic_CircleSpark2": {"fw": 32, "n": 5}, "Magic_CircleWhite": {"fw": 32, "n": 4}, "Magic_ShieldBlue": {"fw": 24, "n": 6}, "Magic_ShieldYellow": {"fw": 24, "n": 6}, "Magic_Spark": {"fw": 27, "n": 10}, "Magic_Spirit": {"fw": 32, "n": 5}, "Magic_SpiritBlue": {"fw": 32, "n": 5}, "Magic_SpiritDouble": {"fw": 32, "n": 5}, "Smoke_Smoke": {"fw": 32, "n": 6}, "Smoke_SmokeCircular": {"fw": 30, "n": 8}, "SpriteSheetArc": {"fw": 38, "n": 6}, "SpriteSheetCircular": {"fw": 126, "n": 3}, "SpriteSheetMulti": {"fw": 45, "n": 6}, "SpriteSheetSlash01": {"fw": 26, "n": 5}, "SpriteSheetSlash02": {"fw": 66, "n": 6}, "SpriteSheetSlash03": {"fw": 114, "n": 2}}, "ms": {"bram": {"idle": {"y": 0, "w": 16, "h": 32, "n": 1, "dirs": 4, "fx": 8, "fy": 32}, "walk": {"y": 128, "w": 20, "h": 33, "n": 6, "dirs": 4, "fx": 10, "fy": 32}, "run": {"y": 260, "w": 20, "h": 35, "n": 6, "dirs": 4, "fx": 10, "fy": 34}, "b_cast": {"y": 400, "w": 16, "h": 34, "n": 2, "dirs": 1, "fx": 8, "fy": 34}, "b_throw": {"y": 434, "w": 23, "h": 31, "n": 4, "dirs": 1, "fx": 12, "fy": 31}, "b_win": {"y": 465, "w": 24, "h": 35, "n": 4, "dirs": 1, "fx": 12, "fy": 33}, "b_weak": {"y": 500, "w": 21, "h": 27, "n": 1, "dirs": 1, "fx": 12, "fy": 27}, "b_dead": {"y": 527, "w": 20, "h": 14, "n": 1, "dirs": 1, "fx": 10, "fy": 14}, "b_ready": {"y": 541, "w": 35, "h": 31, "n": 4, "dirs": 1, "fx": 23, "fy": 31}, "b_move": {"y": 572, "w": 40, "h": 31, "n": 4, "dirs": 1, "fx": 24, "fy": 31}, "b_hurt": {"y": 603, "w": 34, "h": 37, "n": 1, "dirs": 1, "fx": 11, "fy": 30}, "b_slash": {"y": 640, "w": 59, "h": 57, "n": 4, "dirs": 1, "fx": 31, "fy": 44}, "b_thrust": {"y": 697, "w": 54, "h": 29, "n": 3, "dirs": 1, "fx": 32, "fy": 29}}, "corvin": {"idle": {"y": 0, "w": 18, "h": 31, "n": 1, "dirs": 4, "fx": 9, "fy": 31}, "walk": {"y": 124, "w": 22, "h": 32, "n": 6, "dirs": 4, "fx": 11, "fy": 31}, "run": {"y": 252, "w": 28, "h": 34, "n": 6, "dirs": 4, "fx": 14, "fy": 33}, "b_cast": {"y": 388, "w": 17, "h": 33, "n": 2, "dirs": 1, "fx": 8, "fy": 33}, "b_throw": {"y": 421, "w": 27, "h": 30, "n": 4, "dirs": 1, "fx": 11, "fy": 30}, "b_win": {"y": 451, "w": 24, "h": 34, "n": 4, "dirs": 1, "fx": 12, "fy": 32}, "b_weak": {"y": 485, "w": 24, "h": 26, "n": 1, "dirs": 1, "fx": 12, "fy": 26}, "b_dead": {"y": 511, "w": 20, "h": 14, "n": 1, "dirs": 1, "fx": 10, "fy": 15}, "b_ready": {"y": 525, "w": 16, "h": 31, "n": 1, "dirs": 1, "fx": 7, "fy": 31}, "b_move": {"y": 556, "w": 20, "h": 31, "n": 6, "dirs": 1, "fx": 9, "fy": 31}, "b_hurt": {"y": 587, "w": 19, "h": 26, "n": 1, "dirs": 1, "fx": 9, "fy": 26}, "b_slash": {"y": 613, "w": 27, "h": 30, "n": 4, "dirs": 1, "fx": 11, "fy": 30}, "b_thrust": {"y": 643, "w": 27, "h": 30, "n": 4, "dirs": 1, "fx": 11, "fy": 30}}, "drago": {"idle": {"y": 0, "w": 16, "h": 32, "n": 1, "dirs": 4, "fx": 8, "fy": 32}, "walk": {"y": 128, "w": 20, "h": 33, "n": 6, "dirs": 4, "fx": 10, "fy": 32}, "run": {"y": 260, "w": 20, "h": 35, "n": 6, "dirs": 4, "fx": 10, "fy": 34}, "b_cast": {"y": 400, "w": 16, "h": 34, "n": 2, "dirs": 1, "fx": 8, "fy": 34}, "b_throw": {"y": 434, "w": 23, "h": 31, "n": 4, "dirs": 1, "fx": 12, "fy": 31}, "b_win": {"y": 465, "w": 24, "h": 35, "n": 4, "dirs": 1, "fx": 12, "fy": 33}, "b_weak": {"y": 500, "w": 21, "h": 27, "n": 1, "dirs": 1, "fx": 12, "fy": 27}, "b_dead": {"y": 527, "w": 20, "h": 14, "n": 1, "dirs": 1, "fx": 10, "fy": 14}, "b_ready": {"y": 541, "w": 35, "h": 31, "n": 4, "dirs": 1, "fx": 23, "fy": 31}, "b_move": {"y": 572, "w": 40, "h": 31, "n": 4, "dirs": 1, "fx": 24, "fy": 31}, "b_hurt": {"y": 603, "w": 34, "h": 37, "n": 1, "dirs": 1, "fx": 11, "fy": 30}, "b_slash": {"y": 640, "w": 59, "h": 57, "n": 4, "dirs": 1, "fx": 31, "fy": 44}, "b_thrust": {"y": 697, "w": 54, "h": 29, "n": 3, "dirs": 1, "fx": 32, "fy": 29}}, "ember": {"idle": {"y": 0, "w": 16, "h": 32, "n": 1, "dirs": 4, "fx": 8, "fy": 31}, "walk": {"y": 128, "w": 22, "h": 33, "n": 6, "dirs": 4, "fx": 11, "fy": 31}, "run": {"y": 260, "w": 28, "h": 35, "n": 6, "dirs": 4, "fx": 14, "fy": 33}, "b_cast": {"y": 400, "w": 17, "h": 34, "n": 2, "dirs": 1, "fx": 9, "fy": 33}, "b_throw": {"y": 434, "w": 27, "h": 31, "n": 4, "dirs": 1, "fx": 11, "fy": 30}, "b_win": {"y": 465, "w": 24, "h": 34, "n": 4, "dirs": 1, "fx": 12, "fy": 32}, "b_weak": {"y": 499, "w": 25, "h": 27, "n": 1, "dirs": 1, "fx": 13, "fy": 26}, "b_dead": {"y": 526, "w": 20, "h": 15, "n": 1, "dirs": 1, "fx": 10, "fy": 16}, "b_ready": {"y": 541, "w": 16, "h": 32, "n": 1, "dirs": 1, "fx": 8, "fy": 31}, "b_move": {"y": 573, "w": 20, "h": 31, "n": 6, "dirs": 1, "fx": 9, "fy": 31}, "b_hurt": {"y": 604, "w": 21, "h": 26, "n": 1, "dirs": 1, "fx": 11, "fy": 26}, "b_slash": {"y": 630, "w": 27, "h": 31, "n": 4, "dirs": 1, "fx": 11, "fy": 30}, "b_thrust": {"y": 661, "w": 27, "h": 31, "n": 4, "dirs": 1, "fx": 11, "fy": 30}}, "gunner": {"idle": {"y": 0, "w": 18, "h": 33, "n": 1, "dirs": 4, "fx": 9, "fy": 33}, "walk": {"y": 132, "w": 20, "h": 34, "n": 6, "dirs": 4, "fx": 10, "fy": 33}, "run": {"y": 268, "w": 20, "h": 37, "n": 6, "dirs": 4, "fx": 10, "fy": 36}, "b_cast": {"y": 416, "w": 18, "h": 35, "n": 2, "dirs": 1, "fx": 8, "fy": 35}, "b_throw": {"y": 451, "w": 23, "h": 33, "n": 4, "dirs": 1, "fx": 12, "fy": 33}, "b_win": {"y": 484, "w": 24, "h": 35, "n": 4, "dirs": 1, "fx": 12, "fy": 33}, "b_weak": {"y": 519, "w": 23, "h": 28, "n": 1, "dirs": 1, "fx": 12, "fy": 28}, "b_dead": {"y": 547, "w": 20, "h": 16, "n": 1, "dirs": 1, "fx": 10, "fy": 16}, "b_ready": {"y": 563, "w": 27, "h": 32, "n": 4, "dirs": 1, "fx": 14, "fy": 32}, "b_move": {"y": 595, "w": 28, "h": 32, "n": 4, "dirs": 1, "fx": 16, "fy": 32}, "b_hurt": {"y": 627, "w": 24, "h": 33, "n": 1, "dirs": 1, "fx": 7, "fy": 33}, "b_shoot": {"y": 660, "w": 30, "h": 33, "n": 8, "dirs": 1, "fx": 17, "fy": 33}, "b_slash": {"y": 693, "w": 30, "h": 33, "n": 8, "dirs": 1, "fx": 17, "fy": 33}, "b_thrust": {"y": 726, "w": 30, "h": 33, "n": 8, "dirs": 1, "fx": 17, "fy": 33}}, "ilse": {"idle": {"y": 0, "w": 18, "h": 35, "n": 1, "dirs": 4, "fx": 9, "fy": 34}, "walk": {"y": 140, "w": 24, "h": 36, "n": 6, "dirs": 4, "fx": 12, "fy": 34}, "run": {"y": 284, "w": 28, "h": 39, "n": 6, "dirs": 4, "fx": 14, "fy": 37}, "b_cast": {"y": 440, "w": 19, "h": 37, "n": 2, "dirs": 1, "fx": 9, "fy": 36}, "b_throw": {"y": 477, "w": 27, "h": 34, "n": 4, "dirs": 1, "fx": 11, "fy": 33}, "b_win": {"y": 511, "w": 24, "h": 36, "n": 4, "dirs": 1, "fx": 12, "fy": 34}, "b_weak": {"y": 547, "w": 25, "h": 30, "n": 1, "dirs": 1, "fx": 13, "fy": 29}, "b_dead": {"y": 577, "w": 22, "h": 14, "n": 1, "dirs": 1, "fx": 12, "fy": 15}, "b_ready": {"y": 591, "w": 17, "h": 35, "n": 1, "dirs": 1, "fx": 8, "fy": 34}, "b_move": {"y": 626, "w": 21, "h": 34, "n": 6, "dirs": 1, "fx": 9, "fy": 34}, "b_hurt": {"y": 660, "w": 21, "h": 29, "n": 1, "dirs": 1, "fx": 11, "fy": 29}, "b_slash": {"y": 689, "w": 27, "h": 34, "n": 4, "dirs": 1, "fx": 11, "fy": 33}, "b_thrust": {"y": 723, "w": 27, "h": 34, "n": 4, "dirs": 1, "fx": 11, "fy": 33}}, "kael": {"idle": {"y": 0, "w": 16, "h": 32, "n": 1, "dirs": 4, "fx": 8, "fy": 32}, "walk": {"y": 128, "w": 20, "h": 33, "n": 6, "dirs": 4, "fx": 10, "fy": 32}, "run": {"y": 260, "w": 20, "h": 35, "n": 6, "dirs": 4, "fx": 10, "fy": 34}, "b_cast": {"y": 400, "w": 16, "h": 34, "n": 2, "dirs": 1, "fx": 8, "fy": 34}, "b_throw": {"y": 434, "w": 23, "h": 31, "n": 4, "dirs": 1, "fx": 12, "fy": 31}, "b_win": {"y": 465, "w": 24, "h": 35, "n": 4, "dirs": 1, "fx": 12, "fy": 33}, "b_weak": {"y": 500, "w": 21, "h": 27, "n": 1, "dirs": 1, "fx": 12, "fy": 27}, "b_dead": {"y": 527, "w": 20, "h": 14, "n": 1, "dirs": 1, "fx": 10, "fy": 14}, "b_ready": {"y": 541, "w": 23, "h": 31, "n": 4, "dirs": 1, "fx": 12, "fy": 31}, "b_move": {"y": 572, "w": 24, "h": 31, "n": 4, "dirs": 1, "fx": 11, "fy": 31}, "b_hurt": {"y": 603, "w": 22, "h": 33, "n": 1, "dirs": 1, "fx": 6, "fy": 30}, "b_slash": {"y": 636, "w": 54, "h": 38, "n": 4, "dirs": 1, "fx": 29, "fy": 34}, "b_thrust": {"y": 674, "w": 46, "h": 29, "n": 4, "dirs": 1, "fx": 31, "fy": 29}}, "lyra": {"idle": {"y": 0, "w": 18, "h": 35, "n": 1, "dirs": 4, "fx": 9, "fy": 34}, "walk": {"y": 140, "w": 24, "h": 36, "n": 6, "dirs": 4, "fx": 12, "fy": 34}, "run": {"y": 284, "w": 28, "h": 39, "n": 6, "dirs": 4, "fx": 14, "fy": 37}, "b_cast": {"y": 440, "w": 19, "h": 37, "n": 2, "dirs": 1, "fx": 9, "fy": 36}, "b_throw": {"y": 477, "w": 27, "h": 34, "n": 4, "dirs": 1, "fx": 11, "fy": 33}, "b_win": {"y": 511, "w": 24, "h": 36, "n": 4, "dirs": 1, "fx": 12, "fy": 34}, "b_weak": {"y": 547, "w": 25, "h": 30, "n": 1, "dirs": 1, "fx": 13, "fy": 29}, "b_dead": {"y": 577, "w": 22, "h": 14, "n": 1, "dirs": 1, "fx": 12, "fy": 15}, "b_ready": {"y": 591, "w": 17, "h": 35, "n": 1, "dirs": 1, "fx": 8, "fy": 34}, "b_move": {"y": 626, "w": 21, "h": 34, "n": 6, "dirs": 1, "fx": 9, "fy": 34}, "b_hurt": {"y": 660, "w": 21, "h": 29, "n": 1, "dirs": 1, "fx": 11, "fy": 29}, "b_slash": {"y": 689, "w": 27, "h": 34, "n": 4, "dirs": 1, "fx": 11, "fy": 33}, "b_thrust": {"y": 723, "w": 27, "h": 34, "n": 4, "dirs": 1, "fx": 11, "fy": 33}}, "marlo": {"idle": {"y": 0, "w": 18, "h": 33, "n": 1, "dirs": 4, "fx": 9, "fy": 33}, "walk": {"y": 132, "w": 20, "h": 34, "n": 6, "dirs": 4, "fx": 10, "fy": 33}, "run": {"y": 268, "w": 20, "h": 37, "n": 6, "dirs": 4, "fx": 10, "fy": 36}, "b_cast": {"y": 416, "w": 18, "h": 35, "n": 2, "dirs": 1, "fx": 8, "fy": 35}, "b_throw": {"y": 451, "w": 23, "h": 33, "n": 4, "dirs": 1, "fx": 12, "fy": 33}, "b_win": {"y": 484, "w": 24, "h": 35, "n": 4, "dirs": 1, "fx": 12, "fy": 33}, "b_weak": {"y": 519, "w": 23, "h": 28, "n": 1, "dirs": 1, "fx": 12, "fy": 28}, "b_dead": {"y": 547, "w": 20, "h": 16, "n": 1, "dirs": 1, "fx": 10, "fy": 16}, "b_ready": {"y": 563, "w": 22, "h": 32, "n": 4, "dirs": 1, "fx": 11, "fy": 32}, "b_move": {"y": 595, "w": 22, "h": 32, "n": 4, "dirs": 1, "fx": 11, "fy": 32}, "b_hurt": {"y": 627, "w": 22, "h": 35, "n": 1, "dirs": 1, "fx": 6, "fy": 33}, "b_slash": {"y": 662, "w": 52, "h": 37, "n": 4, "dirs": 1, "fx": 29, "fy": 34}, "b_thrust": {"y": 699, "w": 46, "h": 31, "n": 4, "dirs": 1, "fx": 31, "fy": 31}}, "officer": {"idle": {"y": 0, "w": 16, "h": 32, "n": 1, "dirs": 4, "fx": 8, "fy": 32}, "walk": {"y": 128, "w": 20, "h": 33, "n": 6, "dirs": 4, "fx": 10, "fy": 32}, "run": {"y": 260, "w": 20, "h": 35, "n": 6, "dirs": 4, "fx": 10, "fy": 34}, "b_cast": {"y": 400, "w": 16, "h": 34, "n": 2, "dirs": 1, "fx": 8, "fy": 34}, "b_throw": {"y": 434, "w": 23, "h": 31, "n": 4, "dirs": 1, "fx": 12, "fy": 31}, "b_win": {"y": 465, "w": 24, "h": 35, "n": 4, "dirs": 1, "fx": 12, "fy": 33}, "b_weak": {"y": 500, "w": 21, "h": 27, "n": 1, "dirs": 1, "fx": 12, "fy": 27}, "b_dead": {"y": 527, "w": 20, "h": 14, "n": 1, "dirs": 1, "fx": 10, "fy": 14}, "b_ready": {"y": 541, "w": 23, "h": 31, "n": 4, "dirs": 1, "fx": 12, "fy": 31}, "b_move": {"y": 572, "w": 24, "h": 31, "n": 4, "dirs": 1, "fx": 11, "fy": 31}, "b_hurt": {"y": 603, "w": 22, "h": 33, "n": 1, "dirs": 1, "fx": 6, "fy": 30}, "b_slash": {"y": 636, "w": 54, "h": 38, "n": 4, "dirs": 1, "fx": 29, "fy": 34}, "b_thrust": {"y": 674, "w": 46, "h": 29, "n": 4, "dirs": 1, "fx": 31, "fy": 29}}, "orin": {"idle": {"y": 0, "w": 18, "h": 31, "n": 1, "dirs": 4, "fx": 9, "fy": 31}, "walk": {"y": 124, "w": 22, "h": 32, "n": 6, "dirs": 4, "fx": 11, "fy": 31}, "run": {"y": 252, "w": 28, "h": 34, "n": 6, "dirs": 4, "fx": 14, "fy": 33}, "b_cast": {"y": 388, "w": 17, "h": 33, "n": 2, "dirs": 1, "fx": 8, "fy": 33}, "b_throw": {"y": 421, "w": 27, "h": 30, "n": 4, "dirs": 1, "fx": 11, "fy": 30}, "b_win": {"y": 451, "w": 24, "h": 34, "n": 4, "dirs": 1, "fx": 12, "fy": 32}, "b_weak": {"y": 485, "w": 24, "h": 26, "n": 1, "dirs": 1, "fx": 12, "fy": 26}, "b_dead": {"y": 511, "w": 20, "h": 14, "n": 1, "dirs": 1, "fx": 10, "fy": 15}, "b_ready": {"y": 525, "w": 16, "h": 31, "n": 1, "dirs": 1, "fx": 7, "fy": 31}, "b_move": {"y": 556, "w": 20, "h": 31, "n": 6, "dirs": 1, "fx": 9, "fy": 31}, "b_hurt": {"y": 587, "w": 19, "h": 26, "n": 1, "dirs": 1, "fx": 9, "fy": 26}, "b_slash": {"y": 613, "w": 27, "h": 30, "n": 4, "dirs": 1, "fx": 11, "fy": 30}, "b_thrust": {"y": 643, "w": 27, "h": 30, "n": 4, "dirs": 1, "fx": 11, "fy": 30}}, "people": {"names": ["Blacksmith", "Brannoc", "Cavegirl", "Caveman", "Eskimo", "FighterWhite", "GladiatorBlue", "Hunter", "Inspector", "Knight", "KnightGold", "ManGreen", "Master", "Monk", "Monk2", "NinjaDark", "Noble", "OldMan", "OldMan2", "OldMan3", "OldWoman", "Princess", "Samurai", "SamuraiBlue", "Shaman", "SorcererBlack", "SorcererOrange", "Sultan", "Sultan2", "Villager", "Villager2", "Villager3", "Villager4", "Villager5", "Villager6", "Woman"], "cw": 40, "ch": 48, "fx": 20, "fy": 42}, "pip": {"idle": {"y": 0, "w": 14, "h": 31, "n": 1, "dirs": 4, "fx": 7, "fy": 31}, "walk": {"y": 124, "w": 20, "h": 32, "n": 6, "dirs": 4, "fx": 10, "fy": 31}, "run": {"y": 252, "w": 20, "h": 34, "n": 6, "dirs": 4, "fx": 10, "fy": 33}, "b_cast": {"y": 388, "w": 16, "h": 33, "n": 2, "dirs": 1, "fx": 8, "fy": 33}, "b_throw": {"y": 421, "w": 22, "h": 30, "n": 4, "dirs": 1, "fx": 11, "fy": 30}, "b_win": {"y": 451, "w": 24, "h": 34, "n": 4, "dirs": 1, "fx": 12, "fy": 32}, "b_weak": {"y": 485, "w": 21, "h": 26, "n": 1, "dirs": 1, "fx": 12, "fy": 26}, "b_dead": {"y": 511, "w": 20, "h": 15, "n": 1, "dirs": 1, "fx": 10, "fy": 16}, "b_ready": {"y": 526, "w": 35, "h": 30, "n": 4, "dirs": 1, "fx": 23, "fy": 30}, "b_move": {"y": 556, "w": 40, "h": 30, "n": 4, "dirs": 1, "fx": 24, "fy": 30}, "b_hurt": {"y": 586, "w": 34, "h": 37, "n": 1, "dirs": 1, "fx": 11, "fy": 30}, "b_slash": {"y": 623, "w": 59, "h": 57, "n": 4, "dirs": 1, "fx": 31, "fy": 44}, "b_thrust": {"y": 680, "w": 54, "h": 29, "n": 3, "dirs": 1, "fx": 32, "fy": 29}}, "rook": {"idle": {"y": 0, "w": 14, "h": 31, "n": 1, "dirs": 4, "fx": 7, "fy": 31}, "walk": {"y": 124, "w": 20, "h": 32, "n": 6, "dirs": 4, "fx": 10, "fy": 31}, "run": {"y": 252, "w": 20, "h": 34, "n": 6, "dirs": 4, "fx": 10, "fy": 33}, "b_cast": {"y": 388, "w": 16, "h": 33, "n": 2, "dirs": 1, "fx": 8, "fy": 33}, "b_throw": {"y": 421, "w": 22, "h": 30, "n": 4, "dirs": 1, "fx": 11, "fy": 30}, "b_win": {"y": 451, "w": 24, "h": 34, "n": 4, "dirs": 1, "fx": 12, "fy": 32}, "b_weak": {"y": 485, "w": 21, "h": 26, "n": 1, "dirs": 1, "fx": 12, "fy": 26}, "b_dead": {"y": 511, "w": 20, "h": 15, "n": 1, "dirs": 1, "fx": 10, "fy": 16}, "b_ready": {"y": 526, "w": 21, "h": 30, "n": 4, "dirs": 1, "fx": 10, "fy": 30}, "b_move": {"y": 556, "w": 22, "h": 30, "n": 4, "dirs": 1, "fx": 11, "fy": 30}, "b_hurt": {"y": 586, "w": 22, "h": 31, "n": 1, "dirs": 1, "fx": 6, "fy": 30}, "b_slash": {"y": 617, "w": 52, "h": 35, "n": 4, "dirs": 1, "fx": 29, "fy": 32}, "b_thrust": {"y": 652, "w": 46, "h": 29, "n": 4, "dirs": 1, "fx": 31, "fy": 29}}, "sable": {"idle": {"y": 0, "w": 18, "h": 33, "n": 1, "dirs": 4, "fx": 9, "fy": 33}, "walk": {"y": 132, "w": 20, "h": 34, "n": 6, "dirs": 4, "fx": 10, "fy": 33}, "run": {"y": 268, "w": 20, "h": 37, "n": 6, "dirs": 4, "fx": 10, "fy": 36}, "b_cast": {"y": 416, "w": 18, "h": 35, "n": 2, "dirs": 1, "fx": 8, "fy": 35}, "b_throw": {"y": 451, "w": 23, "h": 33, "n": 4, "dirs": 1, "fx": 12, "fy": 33}, "b_win": {"y": 484, "w": 24, "h": 35, "n": 4, "dirs": 1, "fx": 12, "fy": 33}, "b_weak": {"y": 519, "w": 23, "h": 28, "n": 1, "dirs": 1, "fx": 12, "fy": 28}, "b_dead": {"y": 547, "w": 20, "h": 15, "n": 1, "dirs": 1, "fx": 10, "fy": 16}, "b_ready": {"y": 562, "w": 22, "h": 32, "n": 4, "dirs": 1, "fx": 11, "fy": 32}, "b_move": {"y": 594, "w": 22, "h": 32, "n": 4, "dirs": 1, "fx": 11, "fy": 32}, "b_hurt": {"y": 626, "w": 22, "h": 35, "n": 1, "dirs": 1, "fx": 6, "fy": 33}, "b_slash": {"y": 661, "w": 52, "h": 37, "n": 4, "dirs": 1, "fx": 29, "fy": 34}, "b_thrust": {"y": 698, "w": 46, "h": 31, "n": 4, "dirs": 1, "fx": 31, "fy": 31}}, "tech": {"idle": {"y": 0, "w": 14, "h": 31, "n": 1, "dirs": 4, "fx": 7, "fy": 31}, "walk": {"y": 124, "w": 22, "h": 32, "n": 6, "dirs": 4, "fx": 11, "fy": 31}, "run": {"y": 252, "w": 28, "h": 34, "n": 6, "dirs": 4, "fx": 14, "fy": 33}, "b_cast": {"y": 388, "w": 16, "h": 33, "n": 2, "dirs": 1, "fx": 8, "fy": 33}, "b_throw": {"y": 421, "w": 27, "h": 30, "n": 4, "dirs": 1, "fx": 11, "fy": 30}, "b_win": {"y": 451, "w": 24, "h": 34, "n": 4, "dirs": 1, "fx": 12, "fy": 32}, "b_weak": {"y": 485, "w": 24, "h": 26, "n": 1, "dirs": 1, "fx": 12, "fy": 26}, "b_dead": {"y": 511, "w": 20, "h": 15, "n": 1, "dirs": 1, "fx": 10, "fy": 16}, "b_ready": {"y": 526, "w": 14, "h": 31, "n": 1, "dirs": 1, "fx": 7, "fy": 31}, "b_move": {"y": 557, "w": 20, "h": 31, "n": 6, "dirs": 1, "fx": 9, "fy": 31}, "b_hurt": {"y": 588, "w": 19, "h": 26, "n": 1, "dirs": 1, "fx": 9, "fy": 26}, "b_slash": {"y": 614, "w": 27, "h": 30, "n": 4, "dirs": 1, "fx": 11, "fy": 30}, "b_thrust": {"y": 644, "w": 27, "h": 30, "n": 4, "dirs": 1, "fx": 11, "fy": 30}}, "trooper": {"idle": {"y": 0, "w": 18, "h": 33, "n": 1, "dirs": 4, "fx": 9, "fy": 33}, "walk": {"y": 132, "w": 20, "h": 34, "n": 6, "dirs": 4, "fx": 10, "fy": 33}, "run": {"y": 268, "w": 20, "h": 37, "n": 6, "dirs": 4, "fx": 10, "fy": 36}, "b_cast": {"y": 416, "w": 18, "h": 35, "n": 2, "dirs": 1, "fx": 8, "fy": 35}, "b_throw": {"y": 451, "w": 23, "h": 33, "n": 4, "dirs": 1, "fx": 12, "fy": 33}, "b_win": {"y": 484, "w": 24, "h": 35, "n": 4, "dirs": 1, "fx": 12, "fy": 33}, "b_weak": {"y": 519, "w": 23, "h": 28, "n": 1, "dirs": 1, "fx": 12, "fy": 28}, "b_dead": {"y": 547, "w": 20, "h": 16, "n": 1, "dirs": 1, "fx": 10, "fy": 16}, "b_ready": {"y": 563, "w": 22, "h": 32, "n": 4, "dirs": 1, "fx": 11, "fy": 32}, "b_move": {"y": 595, "w": 22, "h": 32, "n": 4, "dirs": 1, "fx": 11, "fy": 32}, "b_hurt": {"y": 627, "w": 22, "h": 35, "n": 1, "dirs": 1, "fx": 6, "fy": 33}, "b_slash": {"y": 662, "w": 52, "h": 37, "n": 4, "dirs": 1, "fx": 29, "fy": 34}, "b_thrust": {"y": 699, "w": 46, "h": 31, "n": 4, "dirs": 1, "fx": 31, "fy": 31}}, "vesna": {"idle": {"y": 0, "w": 16, "h": 32, "n": 1, "dirs": 4, "fx": 8, "fy": 32}, "walk": {"y": 128, "w": 20, "h": 33, "n": 6, "dirs": 4, "fx": 10, "fy": 32}, "run": {"y": 260, "w": 20, "h": 35, "n": 6, "dirs": 4, "fx": 10, "fy": 34}, "b_cast": {"y": 400, "w": 17, "h": 34, "n": 2, "dirs": 1, "fx": 8, "fy": 34}, "b_throw": {"y": 434, "w": 22, "h": 31, "n": 4, "dirs": 1, "fx": 11, "fy": 31}, "b_win": {"y": 465, "w": 24, "h": 34, "n": 4, "dirs": 1, "fx": 12, "fy": 32}, "b_weak": {"y": 499, "w": 22, "h": 27, "n": 1, "dirs": 1, "fx": 12, "fy": 27}, "b_dead": {"y": 526, "w": 20, "h": 15, "n": 1, "dirs": 1, "fx": 10, "fy": 16}, "b_ready": {"y": 541, "w": 28, "h": 31, "n": 4, "dirs": 1, "fx": 15, "fy": 31}, "b_move": {"y": 572, "w": 29, "h": 31, "n": 4, "dirs": 1, "fx": 17, "fy": 31}, "b_hurt": {"y": 603, "w": 28, "h": 30, "n": 1, "dirs": 1, "fx": 11, "fy": 30}, "b_shoot": {"y": 633, "w": 30, "h": 33, "n": 8, "dirs": 1, "fx": 17, "fy": 33}, "b_slash": {"y": 666, "w": 30, "h": 33, "n": 8, "dirs": 1, "fx": 17, "fy": 33}, "b_thrust": {"y": 699, "w": 30, "h": 33, "n": 8, "dirs": 1, "fx": 17, "fy": 33}}, "vesper": {"idle": {"y": 0, "w": 18, "h": 34, "n": 1, "dirs": 4, "fx": 9, "fy": 34}, "walk": {"y": 136, "w": 24, "h": 35, "n": 6, "dirs": 4, "fx": 12, "fy": 34}, "run": {"y": 276, "w": 28, "h": 38, "n": 6, "dirs": 4, "fx": 14, "fy": 37}, "b_cast": {"y": 428, "w": 18, "h": 36, "n": 2, "dirs": 1, "fx": 8, "fy": 36}, "b_throw": {"y": 464, "w": 27, "h": 33, "n": 4, "dirs": 1, "fx": 11, "fy": 33}, "b_win": {"y": 497, "w": 24, "h": 36, "n": 4, "dirs": 1, "fx": 12, "fy": 34}, "b_weak": {"y": 533, "w": 24, "h": 29, "n": 1, "dirs": 1, "fx": 12, "fy": 29}, "b_dead": {"y": 562, "w": 22, "h": 14, "n": 1, "dirs": 1, "fx": 12, "fy": 15}, "b_ready": {"y": 576, "w": 17, "h": 34, "n": 1, "dirs": 1, "fx": 8, "fy": 34}, "b_move": {"y": 610, "w": 21, "h": 34, "n": 6, "dirs": 1, "fx": 9, "fy": 34}, "b_hurt": {"y": 644, "w": 19, "h": 29, "n": 1, "dirs": 1, "fx": 9, "fy": 29}, "b_slash": {"y": 673, "w": 27, "h": 33, "n": 4, "dirs": 1, "fx": 11, "fy": 33}, "b_thrust": {"y": 706, "w": 27, "h": 33, "n": 4, "dirs": 1, "fx": 11, "fy": 33}}}, "mapsz": "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", "music": {}, "bossfw": {"SquidGreen": 76, "GiantFlam": 50, "GiantFrog": 40, "GiantRedSamurai": 48, "SquidRed": 76, "GiantBlueSamurai": 48, "DemonCyclop2": 50, "GiantSlime2": 51, "GiantBamboo": 62, "GiantBamboo2": 62, "GiantRacoonGold": 60, "GiantSlime": 51, "TenguRed": 82, "DemonCyclop": 50, "GiantFrog2": 40, "GiantRacoon": 60, "TenguBlue": 68, "GiantSpirit": 50}};
const ensure = function () { return readying || (readying = Promise.resolve(AE)); };
// music arrives from the optional Soundtrack scripts
document.addEventListener('aethra-music', function (e) { try { const d = JSON.parse(e.detail); AE.MUSIC = Object.assign(AE.MUSIC || {}, d.tracks || {}); DATA.music = Object.assign(DATA.music || {}, d.tracks || {}); if (AE.Music && AE.Music.cur && !AE.Music.src) { const n = AE.Music.cur; AE.Music.cur = null; AE.Music.play(n); } } catch (x) {} });
// pictures and sounds come from the Art & Effects script (asked for once, when you first press Play)
let gotArt = !!DATA.art;
document.addEventListener('aethra-art', function (e) { try { const d = JSON.parse(e.detail); DATA.art = d.art; DATA.sfx = d.sfx; gotArt = true; } catch (x) {} });
const needArt = function (parent) {
  const box = document.createElement('div'); box.style.cssText = (parent ? 'position:absolute;' : 'position:fixed;z-index:2147483000;') + 'inset:0;background:#0a0c1c;color:#dde;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;font:15px sans-serif;text-align:center;padding:20px';
  box.innerHTML = '<b style="font-size:18px">Legend of Aethra needs its Art &amp; Effects script</b><span>Install it, then reload the page. It holds every picture and sound in the game.</span><a href="https://github.com/Eaglewing91/Legend-of-Aethra/raw/main/build/Legend-of-Aethra-Art.user.js" target="_blank" rel="noopener" style="color:#9cf">Install Legend of Aethra - Art &amp; Effects</a><button type="button" style="margin-top:8px;padding:4px 14px">Close</button>';
  box.querySelector('button').addEventListener('click', function () { box.remove(); try { document.dispatchEvent(new CustomEvent('aethra:closed')); } catch (x) {} });
  (parent || document.body).appendChild(box);
};
const play = function (parent, o) { o = o || {}; document.dispatchEvent(new CustomEvent('aethra-music:request'));
  if (!gotArt) document.dispatchEvent(new CustomEvent('aethra-art:request'));
  if (!gotArt) { needArt(parent); return Promise.resolve(); }
  return AE.host.open(parent || null, DATA, o).then(function () { if (o.muted !== undefined && AE.setMuted) AE.setMuted(o.muted); if (o.volume !== undefined && AE.setVolume) AE.setVolume(o.volume / 100); document.documentElement.dataset.aethraOpen = '1'; }); };
if (typeof GM_registerMenuCommand === 'function') GM_registerMenuCommand('Play Legend of Aethra', function () { play(); });
document.addEventListener('aethra:ping', function () { document.dispatchEvent(new CustomEvent('aethra:here', { detail: JSON.stringify({ version: '1.0.0', art: document.documentElement.dataset.aethraArt || '' }) })); });
document.addEventListener('aethra:open', function (e) { let d = null; try { d = JSON.parse(e.detail || 'null'); } catch (x) {} const host = d && typeof d.host === 'string' ? document.getElementById(d.host) : null; play(host, { muted: d && typeof d.muted === 'boolean' ? d.muted : undefined, volume: d && typeof d.volume === 'number' ? d.volume : undefined }); });
document.addEventListener('aethra:close', function () { AE.host.close(); delete document.documentElement.dataset.aethraOpen; });
document.addEventListener('aethra:mute', function (e) { let m = false; try { m = !!JSON.parse(e.detail).muted; } catch (x) {} if (AE.setMuted) AE.setMuted(m); });
document.addEventListener('aethra:volume', function (e) { let v = 100; try { v = Number(JSON.parse(e.detail).volume); } catch (x) {} if (isFinite(v) && AE.setVolume) AE.setVolume(v / 100); });
document.documentElement.dataset.aethra = '1.0.0';

})();
