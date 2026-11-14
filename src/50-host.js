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
