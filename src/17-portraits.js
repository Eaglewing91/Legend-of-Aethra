/* ================= Dialogue portraits, automatic emotes, screen wipes =================
   - A speaker who has character art gets a framed portrait beside their words, with a mood read from the line:
     surprise or shouting (!) gives a jolt and a red flush, a question a "?", trailing "..." a sigh and a blue cast.
   - When someone in the scene speaks with feeling, their field sprite shows the matching emote bubble.
   - Moving between field maps uses an iris wipe instead of a plain fade. */
(function () {
  const portraitId = function (o) {
    if (!o || !o.name) return null;
    if (o.who && AE.actorOn(o.who)) return o.who;
    const nm = String(o.name).toLowerCase();
    for (const k in AE.CHARS) if (AE.CHARS[k].name.toLowerCase() === nm && AE.actorOn(k)) return k;
    const words = nm.replace(/[^a-z ]/g, '').split(' ');
    for (const w of [words[words.length - 1], words[0]]) if (w && AE.actorOn(w)) return w;
    return null;
  };
  const moodOf = function (s) {
    s = String(s);
    if (/!{1,}\??$|!\s*$|!['"]?$/.test(s.trim()) || /!\s/.test(s)) return 'shout';
    if (/\?\s*$/.test(s.trim())) return 'ask';
    if (/\.\.\.\s*$|^\.\.\./.test(s.trim())) return 'sigh';
    return 'calm';
  };
  AE.moodOf = moodOf;
  const lay0 = AE.Message.prototype.layout;
  AE.Message.prototype.layout = function () {
    if (this.pid === undefined) this.pid = portraitId(this.o);
    if (!this.pid) return lay0.apply(this, arguments);
    this.lines = AE.wrap(this.pages[this.page], AE.W - 82);
    this.len = this.lines.join('').length; this.t = this.o.instant ? 999 : 0;
    this.mood = moodOf(this.pages[this.page]); this.mt = 0;
  };
  const draw0 = AE.Message.prototype.draw;
  AE.Message.prototype.draw = function (ctx) {
    if (!this.pid) return draw0.apply(this, arguments);
    // shift the text right of the portrait: draw the message with an offset, then the portrait over the gap
    const n = Math.max(4, this.lines.length + (this.page === this.pages.length - 1 && this.choices ? this.choices.length : 0));
    const h = 12 + n * 12, top = this.o.pos === 'top' ? 6 : AE.H - h - 6;
    AE.window(ctx, 6, top, AE.W - 12, h);
    let left = this.t, y = top + 7;
    if (this.o.name) { AE.window(ctx, 10, top - 14, AE.textWidth(this.o.name) + 14, 16); AE.text(ctx, this.o.name, 17, top - 10, '#ffe080'); }
    for (let i = 0; i < this.lines.length; i++) { const s = this.lines[i].slice(0, Math.max(0, left)); left -= this.lines[i].length; AE.text(ctx, s, 64, y, '#fff'); y += 12; }
    if (this.t >= this.len && this.page === this.pages.length - 1 && this.choices) {
      for (let i = 0; i < this.choices.length; i++) { AE.text(ctx, this.choices[i], 84, y, '#fff'); if (i === this.sel) AE.cursor(ctx, 68, y); y += 12; }
    } else if (this.t >= this.len && Math.floor(AE.game.frame / 16) % 2) { ctx.fillStyle = '#fff'; ctx.fillRect(AE.W - 20, top + h - 9, 5, 1); ctx.fillRect(AE.W - 19, top + h - 8, 3, 1); ctx.fillRect(AE.W - 18, top + h - 7, 1, 1); }
    // the portrait
    this.mt = (this.mt || 0) + 1;
    const px = 11, py = top + 5, pw = 48, ph = 48, jolt = this.mood === 'shout' && this.mt < 14 ? Math.round(Math.sin(this.mt * 1.6) * 2) : 0;
    ctx.save(); ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
    const g = ctx.createLinearGradient(0, py, 0, py + ph);
    const bg = { shout: ['#6a2a3a', '#2a0e18'], ask: ['#3a4a7a', '#141a34'], sigh: ['#2a3a5a', '#0e1424'], calm: ['#3a4a6a', '#141a2a'] }[this.mood];
    g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]); ctx.fillStyle = g; ctx.fillRect(px, py, pw, ph);
    const talking = this.t < this.len, f = talking ? Math.floor(AE.game.frame / 8) % 2 : 0;
    const M = AE.MS[this.pid], tall = (M && M.idle && M.idle.fy) || 28, k = 2.2;
    AE.actor(ctx, this.pid, 'idle', 2, f, px + pw / 2 + jolt, py + ph + tall * k * 0.3, k, { filter: this.mood === 'sigh' ? 'saturate(.7) brightness(.9)' : undefined });
    ctx.restore();
    ctx.strokeStyle = '#e8e8f0'; ctx.lineWidth = 1; ctx.strokeRect(px - 0.5, py - 0.5, pw + 1, ph + 1);
    if (this.mood === 'shout' || this.mood === 'ask') AE.drawEmote(ctx, this.mood === 'shout' ? '!' : '?', px + pw - 6, py + 6);
    if (this.mood === 'sigh') AE.drawEmote(ctx, '...', px + pw - 8, py + 6);
  };
  // the speaker's sprite reacts in the scene
  const s0 = AE.cs.s;
  AE.cs.s = function (who, text, o) {
    const f = AE.field(), mood = moodOf(text), e = mood === 'shout' ? '!' : mood === 'ask' ? '?' : mood === 'sigh' ? '...' : null;
    let a = null;
    if (f && e) { a = f.npcs.find(function (n) { return n.who === who && !n.hidden; }) || (AE.S_.party[0] === who ? f.player : null); if (a) a.emote = e; }
    return s0.call(this, who, text, Object.assign({ who: who }, o || {})).then(function (r) { if (a && a.emote === e) a.emote = null; return r; });
  };
  // ---------- iris wipe between field maps ----------
  AE.wipe = { k: 0, dir: 0 };
  const load0 = AE.Field.prototype.load;
  AE.Field.prototype.load = function () { AE.wipe.k = 1; AE.wipe.dir = -1; return load0.apply(this, arguments); };
  const fdraw0 = AE.Field.prototype.draw;
  AE.Field.prototype.draw = function (ctx) {
    fdraw0.apply(this, arguments);
    const w = AE.wipe; if (w.k <= 0) return;
    const P = this.player, cx = P ? P.px + 8 - Math.round(this.cam.x) : AE.W / 2, cy = P ? P.py + 4 - Math.round(this.cam.y) : AE.H / 2;
    const R = (1 - w.k) * 220;
    ctx.save(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.rect(0, 0, AE.W, AE.H); ctx.arc(cx, cy, Math.max(0.1, R), 0, Math.PI * 2, true); ctx.fill(); ctx.restore();
    w.k = Math.max(0, w.k - 0.045);
  };
})();
