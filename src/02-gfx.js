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
// Sharp scaling: every source pixel covers a whole number of screen pixels (no uneven, wobbly pixels), and sprites
// sit on the screen's pixel grid. AE.S is the screen pixels per game pixel (see AE.fitCanvas).
AE.fitK = function (k) { return Math.max(1, Math.round(k * AE.S)) / AE.S; };
AE.px = function (v) { return Math.round(v * AE.S) / AE.S; };
AE.actor = function (ctx, id, anim, dir, f, X, Y, k, o) {
  const M = AE.MS && AE.MS[id], A = M && M[anim], im = AE.IMG['ms_' + id]; if (!A || !im) return false;
  o = o || {}; k = AE.fitK(k || 1);
  const row = A.dirs === 4 ? AE.ROW[dir] : 0, fr = ((f % A.n) + A.n) % A.n;
  const sx = fr * A.w, sy = A.y + row * A.h;
  ctx.save();
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  if (o.filter) ctx.filter = o.filter;
  if (o.flip) { ctx.translate(AE.px(X), 0); ctx.scale(-1, 1); ctx.drawImage(im, sx, sy, A.w, A.h, AE.px(-A.fx * k), AE.px(Y - A.fy * k), A.w * k, A.h * k); }
  else ctx.drawImage(im, sx, sy, A.w, A.h, AE.px(X - A.fx * k), AE.px(Y - A.fy * k), A.w * k, A.h * k);
  ctx.restore();
  return true;
};
// townsfolk atlas (ms_people): 7 cells per row (stand, walk 1-6), 4 rows per person
AE.person = function (ctx, name, dir, f, X, Y, k) {
  const P = AE.MS && AE.MS.people, im = AE.IMG.ms_people; if (!P || !im) return false;
  const i = P.names.indexOf(name); if (i < 0) return false; k = AE.fitK(k || 1);
  const cell = f < 0 ? 0 : 1 + (f % 6);
  ctx.drawImage(im, cell * P.cw, (i * 4 + AE.ROW[dir]) * P.ch, P.cw, P.ch, AE.px(X - P.fx * k), AE.px(Y - P.fy * k), P.cw * k, P.ch * k);
  return true;
};
// any image region scaled, optionally flipped and tinted by a CSS filter
AE.blit = function (ctx, im, sx, sy, sw, sh, dx, dy, dw, dh, o) {
  if (!im) return; o = o || {};
  // whole screen pixels per source pixel; keep the sprite centred and standing on the same spot
  if (sw > 0 && sh > 0) { const w2 = sw * AE.fitK(dw / sw), h2 = sh * AE.fitK(dh / sh); dx += (dw - w2) / 2; dy += dh - h2; dw = w2; dh = h2; }
  ctx.save(); if (o.alpha !== undefined) ctx.globalAlpha = o.alpha; if (o.filter) ctx.filter = o.filter;
  if (o.flip) { ctx.translate(AE.px(dx + dw), AE.px(dy)); ctx.scale(-1, 1); ctx.drawImage(im, sx, sy, sw, sh, 0, 0, dw, dh); }
  else ctx.drawImage(im, sx, sy, sw, sh, AE.px(dx), AE.px(dy), dw, dh);
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
