/* ================= Field maps: light and air =================
   Dark places are lit, not just tinted: the party carries a soft light, lamps, save crystals, lava and doorways
   glow, everything else falls into shadow. Outdoor towns follow the world's day and night. Each kind of place has
   something drifting in the air: leaves, snow, dust, sparks, embers, fireflies. */
(function () {
  const hash = function (i, s) { let h = (i * 374761393 + s * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const lights = function (m) {
    if (m._lights) return m._lights;
    const d = m.d, W = d.w, L = [], DUN = 8 << 16, NAT = 1 << 16;
    ['deco', 'over'].forEach(function (k) {
      const lay = d.layers[k]; if (!lay) return;
      for (let i = 0; i < lay.length; i++) { const r = lay[i]; if (r < 0) continue;
        const sh = r & 0xff0000, tx = r & 255, ty = (r >> 8) & 255, x = (i % W) * 16 + 8, y = Math.floor(i / W) * 16 + 8;
        if (sh === DUN && ty === 2 && tx >= 4 && tx <= 7) L.push([x, y, 46, [255, 190, 110]]);
        else if (sh === NAT && tx === 1 && ty === 15) L.push([x, y, 40, [120, 200, 255]]);
      }
    });
    for (let i = 0; i < d.col.length; i++) if (d.col[i] === 4 && (i % 3 === 0)) L.push([(i % W) * 16 + 8, Math.floor(i / W) * 16 + 8, 34, [255, 110, 40]]);   // lava
    (d.warps || []).forEach(function (w) { L.push([w.x * 16 + 8, w.y * 16 + 8, 30, [255, 210, 150]]); });
    m._lights = L; return L;
  };
  AE.fieldLight = function (ctx, F, cx, cy) {
    const m = F.map, d = m.d, S = AE.S_;
    let dark = d.dark ? [0, 0.55, 0.72, 0.85][d.dark] : 0;
    const outdoor = d.kind === 'town' && !d.indoors, DL = outdoor && AE.dayLight ? AE.dayLight() : null;
    if (DL) dark = Math.max(dark, DL.night * 0.62);
    if (d.kind === 'dungeon' && !dark) dark = 0.18;
    if (dark <= 0.02) return;
    const W = AE.W, H = AE.H;
    const c = F._lc || (F._lc = document.createElement('canvas')); c.width = W; c.height = H; const x = c.getContext('2d');
    x.fillStyle = DL && DL.night > 0.1 ? 'rgba(8,12,40,' + dark + ')' : 'rgba(4,4,14,' + dark + ')'; x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = 'destination-out';
    const t = AE.game.frame, hole = function (X, Y, r, a) { const g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(0.6, 'rgba(0,0,0,' + a * 0.6 + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(X - r, Y - r, r * 2, r * 2); };
    const P = F.player, flick = 1 + Math.sin(t * 0.15) * 0.03 + Math.sin(t * 0.37) * 0.02;
    hole(P.px + 8 - cx, P.py + 6 - cy, (d.dark >= 2 ? 64 : 84) * flick, 1);
    const L = lights(m), glows = [];
    L.forEach(function (l) { const X = l[0] - cx, Y = l[1] - cy; if (X < -60 || Y < -60 || X > W + 60 || Y > H + 60) return; const r = l[2] * (1 + Math.sin(t * 0.1 + l[0]) * 0.05); hole(X, Y, r, 0.95); glows.push([X, Y, r, l[3]]); });
    x.globalCompositeOperation = 'source-over';
    ctx.drawImage(c, 0, 0);
    // a warm (or cool) bloom over each light
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glows.forEach(function (g) { const gr = ctx.createRadialGradient(g[0], g[1], 0, g[0], g[1], g[2] * 0.7); gr.addColorStop(0, 'rgba(' + g[3].join(',') + ',' + (0.22 * dark + 0.06) + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(g[0] - g[2], g[1] - g[2], g[2] * 2, g[2] * 2); });
    ctx.restore();
  };
  // what drifts in the air, by the kind of place
  const AMB = { forest: 'leaves', clearing: 'leaves', snow: 'snow', cave: 'dust', dungeon: 'dust', crypt: 'dust', temple: 'motes', mystic: 'motes', mystical: 'motes', final: 'motes', castle: 'dust',
    factory: 'sparks', reactor: 'spores', desert: 'sand', water: 'bubbles', slums: 'ash', peaceful: 'pollen', village: 'pollen', chill: 'pollen', ruins: 'dust', spire: 'motes', curse: 'ash', dream: 'motes' };
  AE.fieldAmbient = function (ctx, F, cx, cy) {
    const d = F.map.d; if (d.kind === 'house') return;
    let kind = AMB[d.music]; if (!kind) return;
    const W = AE.W, H = AE.H, t = AE.game.frame, DL = AE.dayLight ? AE.dayLight() : null;
    if (kind === 'pollen' && DL && DL.night > 0.5) kind = 'fireflies';
    if (kind === 'leaves' && d.dark) kind = 'fireflies';
    const ox = -cx * 0.5, oy = -cy * 0.5, wrap = function (v, m) { return ((v % m) + m) % m; };
    for (let i = 0; i < 40; i++) {
      const a = hash(i, 1), b = hash(i, 2), c = hash(i, 3);
      let X, Y;
      switch (kind) {
        case 'leaves': X = wrap(a * W + ox + t * 0.3 + Math.sin(t * 0.02 + i) * 14, W); Y = wrap(b * H + oy + t * (0.3 + c * 0.3), H); ctx.fillStyle = ['#c89a30', '#8ab040', '#d07030'][i % 3]; ctx.fillRect(X, Y, 2, 1); ctx.fillRect(X + (Math.sin(t * 0.1 + i) > 0 ? 1 : 0), Y + 1, 1, 1); if (i > 16) i = 99; break;
        case 'snow': X = wrap(a * W + ox + Math.sin(t * 0.02 + i) * 10 + t * 0.2, W); Y = wrap(b * H + oy + t * (0.4 + c * 0.6), H); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(X, Y, c < 0.3 ? 2 : 1, c < 0.3 ? 2 : 1); break;
        case 'dust': X = wrap(a * W + ox + Math.sin(t * 0.007 + i) * 20, W); Y = wrap(b * H + oy + Math.cos(t * 0.006 + i) * 14, H); ctx.fillStyle = 'rgba(230,220,200,' + (0.18 + 0.15 * Math.sin(t * 0.03 + i)) + ')'; ctx.fillRect(X, Y, 1, 1); break;
        case 'motes': X = wrap(a * W + ox + Math.sin(t * 0.01 + i) * 12, W); Y = wrap(b * H + oy - t * (0.1 + c * 0.2), H); ctx.fillStyle = 'rgba(210,190,255,' + (0.3 + 0.3 * Math.sin(t * 0.05 + i)) + ')'; ctx.fillRect(X, Y, 1, 1); break;
        case 'sparks': if ((t + i * 37) % 160 < 18) { const ph = (t + i * 37) % 160; X = wrap(a * W + ox + Math.sin(i) * ph, W); Y = wrap(b * H + oy + ph * 0.9 + ph * ph * 0.02, H); ctx.fillStyle = 'rgba(255,220,120,.9)'; ctx.fillRect(X, Y, 1, 1); } break;
        case 'spores': X = wrap(a * W + ox + Math.sin(t * 0.01 + i) * 10, W); Y = wrap(b * H + oy - t * (0.2 + c * 0.2), H); ctx.fillStyle = 'rgba(100,255,190,' + (0.3 + 0.3 * Math.sin(t * 0.06 + i)) + ')'; ctx.fillRect(X, Y, 1, 1); break;
        case 'sand': X = wrap(a * W + ox + t * (1.5 + c * 1.5), W); Y = wrap(b * H + oy + Math.sin(t * 0.04 + i) * 3, H); ctx.fillStyle = 'rgba(240,210,150,.4)'; ctx.fillRect(X, Y, 3, 1); break;
        case 'bubbles': X = wrap(a * W + ox + Math.sin(t * 0.04 + i) * 4, W); Y = wrap(b * H + oy - t * (0.3 + c * 0.4), H); ctx.strokeStyle = 'rgba(200,240,255,.5)'; ctx.beginPath(); ctx.arc(X, Y, 1 + c * 1.5, 0, 7); ctx.stroke(); if (i > 20) i = 99; break;
        case 'ash': X = wrap(a * W + ox + t * 0.15 + Math.sin(t * 0.02 + i) * 6, W); Y = wrap(b * H + oy + t * (0.15 + c * 0.2), H); ctx.fillStyle = 'rgba(180,170,165,.5)'; ctx.fillRect(X, Y, 1, 1); break;
        case 'pollen': if (i > 14) { i = 99; break; } X = wrap(a * W + ox + Math.sin(t * 0.01 + i) * 16, W); Y = wrap(b * H + oy + Math.cos(t * 0.013 + i) * 10, H); ctx.fillStyle = 'rgba(255,250,200,.55)'; ctx.fillRect(X, Y, 1, 1); break;
        case 'fireflies': if (i > 18) { i = 99; break; } { X = wrap(a * W + ox + Math.sin(t * 0.013 + i * 2) * 20, W); Y = wrap(b * H + oy + Math.cos(t * 0.011 + i) * 14, H); const k = Math.max(0, Math.sin(t * 0.05 + i * 1.7));
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(X, Y, 0, X, Y, 5); g.addColorStop(0, 'rgba(220,255,120,' + 0.8 * k + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(X - 5, Y - 5, 10, 10); ctx.restore(); } break;
      }
    }
  };
})();
