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
    const touch = (function () { try { return window.matchMedia('(pointer: coarse)').matches; } catch (e) { return false; } })();
    AE.setPad(o.pad !== undefined ? o.pad : (AE.pad.want !== undefined ? AE.pad.want : touch));
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
// ---------- touch pad: a d-pad and buttons over the game, for phones and tablets ----------
AE.pad = {
  el: null,
  make: function (root) {
    const p = this.el = document.createElement('div'); p.className = 'ae-pad';
    p.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1;user-select:none;-webkit-user-select:none;touch-action:none';
    const btn = function (label, key, css) {
      const b = document.createElement('div'); b.textContent = label;
      b.style.cssText = 'position:absolute;pointer-events:auto;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.35);color:#fff;font:bold 15px sans-serif;border-radius:10px;' + css;
      const on = function (e) { e.preventDefault(); AE.ac(); if (AE.game) AE.game.input.press(key, true); b.style.background = 'rgba(255,255,255,.35)'; };
      const off = function (e) { e.preventDefault(); if (AE.game) AE.game.input.press(key, false); b.style.background = 'rgba(255,255,255,.14)'; };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
      p.appendChild(b);
    };
    btn('▲', 'up', 'left:52px;bottom:104px;width:46px;height:46px'); btn('▼', 'down', 'left:52px;bottom:10px;width:46px;height:46px');
    btn('◀', 'left', 'left:6px;bottom:57px;width:46px;height:46px'); btn('▶', 'right', 'left:98px;bottom:57px;width:46px;height:46px');
    btn('OK', 'ok', 'right:14px;bottom:60px;width:56px;height:56px;border-radius:28px'); btn('✕', 'back', 'right:76px;bottom:16px;width:46px;height:46px;border-radius:23px');
    btn('MENU', 'menu', 'right:14px;bottom:126px;width:56px;height:30px;font-size:11px'); btn('RUN', 'run', 'right:76px;bottom:126px;width:46px;height:30px;font-size:11px');
    btn('MAP', 'map', 'left:6px;top:8px;width:46px;height:28px;font-size:11px');
    // FLEE: hold it to run from a battle (like holding Q and E); shown only in battles you can run from
    btn('FLEE', 'flee', 'right:128px;bottom:126px;width:52px;height:30px;font-size:11px;background:rgba(220,90,70,.3)');
    this.fleeBtn = p.lastChild; this.fleeBtn.style.display = 'none';
    root.appendChild(p);
  },
  set: function (on) {
    const r = AE.host.root; if (!r) { AE.pad.want = on; return; }
    if (!this.el) this.make(r);
    this.el.style.display = on ? 'block' : 'none';
    clearInterval(this.fleeT); this.fleeT = 0;
    if (on) {
      const self = this;
      this.fleeT = setInterval(function () {
        if (!self.el || !self.el.isConnected) { clearInterval(self.fleeT); self.fleeT = 0; return; }
        const t = AE.game && AE.game.top(), show = !!(t && t.kind === 'battle' && t.form && !t.form.noRun && !t.result);
        self.fleeBtn.style.display = show ? 'flex' : 'none';
        if (!show && AE.game && AE.game.input.held.flee) AE.game.input.press('flee', false);
      }, 200);
    }
  }
};
AE.setPad = function (on) { AE.pad.set(!!on); };
