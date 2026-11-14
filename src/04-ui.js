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
