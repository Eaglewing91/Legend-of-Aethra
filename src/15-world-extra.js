/* ================= World map extras: day and night, weather, landmarks, the full map =================
   A day lasts 20 minutes of play. Weather follows the region: snow over Nordheim, sand on the Sunscar wind,
   passing showers over Meridia. Every place is drawn as a little model (FF7's world-map miniatures), lit at night. */
(function () {
  const lerp = function (a, b, k) { return a + (b - a) * k; }, L3 = function (a, b, k) { return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)]; };
  const KEYS = [   // sun height -> sky top, sky horizon, land tint, night
    [-1, [8, 12, 34], [36, 48, 90], [0.4, 0.47, 0.72], 1],
    [-0.18, [14, 20, 50], [60, 60, 110], [0.5, 0.52, 0.75], 0.85],
    [0, [44, 46, 110], [214, 120, 104], [0.78, 0.66, 0.74], 0.25],
    [0.22, [70, 104, 190], [250, 190, 130], [1.04, 0.9, 0.78], 0],
    [0.45, [70, 122, 206], [200, 222, 240], [1, 1, 1], 0],
    [1, [64, 116, 204], [196, 220, 240], [1, 1, 1], 0]];
  AE.dayLight = function () {
    const S = AE.S_ || {}, t = (((S.time || 0) / 1200) + 0.38) % 1, sunH = Math.sin((t - 0.25) * Math.PI * 2);
    let i = 0; while (i < KEYS.length - 2 && sunH > KEYS[i + 1][0]) i++;
    const A = KEYS[i], B = KEYS[i + 1], k = Math.max(0, Math.min(1, (sunH - A[0]) / (B[0] - A[0])));
    const sky1 = L3(A[1], B[1], k).map(Math.round), sky2 = L3(A[2], B[2], k).map(Math.round), tint = L3(A[3], B[3], k);
    if (sunH > 0.45) { tint[0] = tint[1] = tint[2] = 1; }
    return { t: t, sunH: sunH, sunA: t * Math.PI * 2 + 1.2, sky1: sky1, sky2: sky2, tint: tint, night: lerp(A[4], B[4], k) };
  };
  // ---------- weather ----------
  const hash = function (i, s) { let h = (i * 374761393 + s * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  AE.weatherAt = function (x, y) {
    const S = AE.S_ || {}, tm = (S.time || 0);
    if (y < 46) return { kind: 'snow', k: 0.6 + 0.4 * Math.sin(tm / 90) };
    const reg = AE.WORLD.reg[Math.floor(x / 16) + ',' + Math.floor(y / 16)];
    if (reg === 'w_desert') { const k = Math.max(0, Math.sin(tm / 70)); return { kind: 'sand', k: k }; }
    if (reg === 'w_meridia_s' || reg === 'w_meridia_n' || reg === 'w_ashfields') { const k = Math.max(0, Math.sin(tm / 113 + 1) * 1.6 - 0.9); return { kind: 'rain', k: k }; }
    return { kind: 'clear', k: 0 };
  };
  AE.drawWeather = function (ctx, w, night) {
    const Wd = AE.weatherAt(w.x, w.y), W = AE.W, H = AE.H, t = w.t;
    w.wk = (w.wk || 0) + (Wd.k - (w.wk || 0)) * 0.02; const k = w.wk; if (k < 0.03) return;
    const ang = w.ang;
    if (Wd.kind === 'snow') { ctx.fillStyle = 'rgba(255,255,255,.85)'; const n = 90 * k | 0; for (let i = 0; i < n; i++) { const x = ((hash(i, 1) * W - ang * 120 + Math.sin(t * 0.02 + i) * 8 + t * 0.3) % W + W) % W, y = (hash(i, 2) * H + t * (0.5 + hash(i, 3) * 0.8)) % H; const s = hash(i, 4) < 0.3 ? 2 : 1; ctx.fillRect(x, y, s, s); } ctx.fillStyle = 'rgba(230,240,255,' + 0.12 * k + ')'; ctx.fillRect(0, 0, W, H); }
    else if (Wd.kind === 'rain') { ctx.strokeStyle = 'rgba(190,210,240,' + (0.45 * k) + ')'; ctx.lineWidth = 1; ctx.beginPath(); const n = 110 * k | 0; for (let i = 0; i < n; i++) { const x = ((hash(i, 1) * W - ang * 120 + t * 2) % W + W) % W, y = (hash(i, 2) * H + t * 7) % H; ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 8); } ctx.stroke(); ctx.fillStyle = 'rgba(40,50,70,' + 0.22 * k + ')'; ctx.fillRect(0, 0, W, H);
      if (k > 0.7 && (t % 600) < 4) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(0, 0, W, H); } }
    else if (Wd.kind === 'sand') { ctx.fillStyle = 'rgba(220,170,100,' + 0.3 * k + ')'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = 'rgba(240,210,150,' + 0.6 * k + ')'; const n = 80 * k | 0; for (let i = 0; i < n; i++) { const x = ((hash(i, 1) * W + t * (3 + hash(i, 3) * 3) - ang * 120) % W + W) % W, y = hash(i, 2) * H + Math.sin(t * 0.05 + i) * 4; ctx.fillRect(x, y, 4 + hash(i, 5) * 6, 1); } }
  };
  // ---------- landmarks: little models of each place ----------
  const box = function (ctx, x, by, w, h, wall, side, roof, roofH) {   // a building in 2.5D: front, right side, pitched roof
    const d = w * 0.35;
    ctx.fillStyle = side; ctx.beginPath(); ctx.moveTo(x + w, by); ctx.lineTo(x + w + d, by - d * 0.6); ctx.lineTo(x + w + d, by - h - d * 0.6); ctx.lineTo(x + w, by - h); ctx.fill();
    ctx.fillStyle = wall; ctx.fillRect(x, by - h, w, h);
    if (roof) {
      const rh = roofH === undefined ? w * 0.45 : roofH;
      ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x - 1, by - h); ctx.lineTo(x + w / 2, by - h - rh); ctx.lineTo(x + w / 2 + d, by - h - rh - d * 0.6); ctx.lineTo(x + w + d + 1, by - h - d * 0.6); ctx.lineTo(x + w + 1, by - h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.moveTo(x - 1, by - h); ctx.lineTo(x + w / 2, by - h - rh); ctx.lineTo(x + w + 1, by - h); ctx.fill();
    } else { ctx.fillStyle = side; ctx.beginPath(); ctx.moveTo(x, by - h); ctx.lineTo(x + d, by - h - d * 0.6); ctx.lineTo(x + w + d, by - h - d * 0.6); ctx.lineTo(x + w, by - h); ctx.fill(); }
  };
  const win = function (ctx, x, y, w, h, night) { ctx.fillStyle = night > 0.3 ? 'rgba(255,214,120,' + (0.4 + night * 0.6) + ')' : 'rgba(60,70,90,.8)'; ctx.fillRect(x, y, w, h); };
  const glow = function (ctx, x, y, r, a, col) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col || 'rgba(255,200,110,' + a + ')'); g.addColorStop(1, 'rgba(255,170,60,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
  AE.drawLandmark = function (ctx, id, kind, x, y, k, night, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(1, 0, 13, 4, 0, 0, 7); ctx.fill();   // shadow
    if (night > 0.3 && kind !== 'sea' && kind !== 'cave' && kind !== 'crater' && kind !== 'volcano') { ctx.globalCompositeOperation = 'lighter'; glow(ctx, 0, -6, 22, 0.35 * night); ctx.globalCompositeOperation = 'source-over'; }
    switch (id === 'halcyon' ? 'halcyon' : kind) {
      case 'halcyon': {   // the plate city: a great disc on pillars, the central tower, reactor glow
        ctx.fillStyle = '#4a4a54'; for (const px of [-14, -6, 6, 14]) ctx.fillRect(px - 1, -9, 2, 9);
        ctx.fillStyle = '#5a5a66'; ctx.beginPath(); ctx.ellipse(0, -10, 20, 6, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#7a7a88'; ctx.beginPath(); ctx.ellipse(0, -12, 20, 6, 0, 0, 7); ctx.fill();
        for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, rx = Math.cos(a) * 15, ry = Math.sin(a) * 4.2 - 12, hh = 2 + (i * 7 % 5); ctx.fillStyle = i % 2 ? '#8a8a98' : '#6a6a78'; ctx.fillRect(rx - 1.2, ry - hh, 2.4, hh); if (night > 0.3) win(ctx, rx - 0.5, ry - hh + 1, 1, 1, night); }
        box(ctx, -3, -14, 6, 16, '#9a9aa8', '#6a6a78', null); ctx.fillStyle = '#b0b0c0'; ctx.fillRect(-1, -36, 2, 6);
        for (let i = 0; i < 4; i++) win(ctx, -2, -28 + i * 3.5, 4, 1.2, night);
        ctx.globalCompositeOperation = 'lighter'; glow(ctx, 0, -8, 10, 0.6, 'rgba(80,255,170,.55)'); ctx.globalCompositeOperation = 'source-over';
        break; }
      case 'city': box(ctx, -10, 0, 6, 14, '#8a8a98', '#5a5a68', null); box(ctx, -3, 0, 7, 20, '#9a9aa8', '#6a6a78', null); box(ctx, 5, 0, 6, 11, '#7a7a88', '#4a4a58', '#a04030');
        for (let i = 0; i < 5; i++) win(ctx, -1.5, -18 + i * 3.5, 3, 1, night); for (let i = 0; i < 3; i++) win(ctx, -9, -12 + i * 3.5, 3, 1, night); break;
      case 'town': box(ctx, -12, 0, 8, 6, '#e8d8b8', '#b8a888', '#c04a30'); box(ctx, -2, -2, 9, 8, '#f0e0c0', '#c0b090', '#d05a38'); box(ctx, 8, 1, 6, 5, '#e0d0b0', '#b0a080', '#a83a28');
        win(ctx, 1, -6, 2, 2, night); win(ctx, -10, -3.5, 2, 2, night); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(3.5, -4, 2, 4); break;
      case 'village': case 'hut': box(ctx, -8, 0, 7, 5, '#c8a878', '#987848', '#7a8a3a', 5); if (kind === 'village') box(ctx, 2, 1, 7, 5, '#c8a878', '#987848', '#8a7a3a', 5); win(ctx, -5, -3, 2, 2, night);
        ctx.fillStyle = 'rgba(200,200,200,.5)'; ctx.beginPath(); ctx.arc(-3 + Math.sin(t * 0.05) * 1.5, -14 - (t * 0.1 % 6), 1.5, 0, 7); ctx.fill(); break;   // chimney smoke
      case 'ranch': box(ctx, -10, 0, 11, 7, '#a83a28', '#782818', '#5a3020', 6); ctx.fillStyle = '#e8e0d0'; ctx.fillRect(-6, -5, 3, 5);
        ctx.strokeStyle = '#8a6a40'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(3, -1); ctx.lineTo(15, -1); ctx.moveTo(3, -3); ctx.lineTo(15, -3); for (let fx = 3; fx <= 15; fx += 3) { ctx.moveTo(fx, 0); ctx.lineTo(fx, -4); } ctx.stroke();
        ctx.fillStyle = '#f0c040'; ctx.beginPath(); ctx.ellipse(9 + Math.sin(t * 0.03) * 3, -2, 2, 1.5, 0, 0, 7); ctx.fill(); break;
      case 'temple': case 'shrine': { const w = kind === 'temple' ? 18 : 10; ctx.fillStyle = '#c8c0b0'; ctx.fillRect(-w / 2 - 2, -2, w + 4, 2); for (let i = 0; i <= 4; i++) { ctx.fillStyle = '#e8e0d0'; ctx.fillRect(-w / 2 + i * w / 4 - 1, -11, 2, 9); }
        ctx.fillStyle = '#d8d0c0'; ctx.beginPath(); ctx.moveTo(-w / 2 - 2, -11); ctx.lineTo(0, -16); ctx.lineTo(w / 2 + 2, -11); ctx.fill(); if (kind === 'temple') { ctx.fillStyle = '#60a0d0'; ctx.beginPath(); ctx.arc(0, -16, 4, Math.PI, 0); ctx.fill(); } break; }
      case 'forest': ctx.fillStyle = '#2a6a30'; for (const [fx, fy, r] of [[-7, -4, 6], [5, -5, 7], [-1, -9, 6], [9, -1, 4]]) { ctx.beginPath(); ctx.arc(fx, fy, r, 0, 7); ctx.fill(); } ctx.fillStyle = '#4a9a40'; ctx.beginPath(); ctx.arc(-2, -11, 3.5, 0, 7); ctx.arc(4, -8, 3, 0, 7); ctx.fill(); break;
      case 'cave': ctx.fillStyle = '#7a6a58'; ctx.beginPath(); ctx.moveTo(-13, 0); ctx.quadraticCurveTo(-10, -14, 0, -15); ctx.quadraticCurveTo(11, -14, 13, 0); ctx.fill(); ctx.fillStyle = '#9a8a76'; ctx.beginPath(); ctx.moveTo(-8, -8); ctx.quadraticCurveTo(-2, -15, 6, -12); ctx.lineTo(0, -10); ctx.fill();
        ctx.fillStyle = '#140c08'; ctx.beginPath(); ctx.ellipse(0, -2, 5, 6, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(-5, -2, 10, 2); break;
      case 'spire': { const g = ctx.createLinearGradient(-4, 0, 4, 0); g.addColorStop(0, '#f0d070'); g.addColorStop(1, '#a07020'); ctx.fillStyle = '#b07848'; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-7, -6); ctx.lineTo(7, -6); ctx.lineTo(10, 0); ctx.fill();
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(0, -40); ctx.lineTo(4, -6); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, 0, -40, 6, 0.8); ctx.globalCompositeOperation = 'source-over'; break; }
      case 'port': box(ctx, -12, 0, 8, 6, '#e8e0d0', '#b8b0a0', '#3a6aa0'); box(ctx, -2, 0, 7, 5, '#e0d8c8', '#b0a898', '#3a6aa0'); ctx.fillStyle = '#8a6a40'; ctx.fillRect(4, -1, 12, 2);
        ctx.fillStyle = '#f0f0f0'; ctx.fillRect(12, -16, 3, 15); ctx.fillStyle = '#c03030'; ctx.fillRect(12, -12, 3, 2); ctx.fillRect(12, -6, 3, 2);
        ctx.globalCompositeOperation = 'lighter'; glow(ctx, 13.5, -17, 7 + Math.sin(t * 0.1) * 2, 0.4 + night * 0.5); ctx.globalCompositeOperation = 'source-over'; break;
      case 'ruins': ctx.fillStyle = '#a8a08a'; for (const [fx, h] of [[-10, 9], [-4, 14], [3, 6], [9, 11]]) { ctx.fillRect(fx - 1.5, -h, 3, h); } ctx.fillRect(-11, -14, 9, 2); ctx.fillStyle = '#5a7a3a'; ctx.fillRect(-5, -15, 3, 1.5); ctx.fillStyle = '#8a8270'; ctx.fillRect(-12, -1, 24, 1.5); break;
      case 'tower': box(ctx, -4, 0, 8, 26, '#8a8a98', '#5a5a68', '#6a3a8a', 6); for (let i = 0; i < 5; i++) win(ctx, -1, -23 + i * 4.5, 2, 2, night); ctx.fillStyle = '#c0a0ff'; ctx.globalCompositeOperation = 'lighter'; glow(ctx, 2, -34, 6, 0.6, 'rgba(190,140,255,.6)'); ctx.globalCompositeOperation = 'source-over'; break;
      case 'wreck': ctx.save(); ctx.rotate(-0.35); ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.moveTo(-14, -2); ctx.lineTo(10, -2); ctx.lineTo(6, 4); ctx.lineTo(-10, 4); ctx.fill(); ctx.fillStyle = '#4a3018'; ctx.fillRect(-3, -16, 1.5, 14); ctx.fillStyle = 'rgba(230,220,200,.7)'; ctx.fillRect(-1.5, -14, 6, 4); ctx.restore(); break;
      case 'volcano': ctx.fillStyle = 'rgba(80,70,70,.55)'; for (let i = 0; i < 4; i++) { const ph = (t * 0.03 + i * 0.25) % 1; ctx.beginPath(); ctx.arc(Math.sin(i + t * 0.01) * 3 + ph * 6, -14 - ph * 26, 3 + ph * 6, 0, 7); ctx.fill(); }
        ctx.globalCompositeOperation = 'lighter'; glow(ctx, 0, -10, 10, 0.6, 'rgba(255,110,30,.6)'); ctx.globalCompositeOperation = 'source-over'; break;
      case 'crater': ctx.globalCompositeOperation = 'lighter'; glow(ctx, 0, -4, 16, 0.5, 'rgba(160,255,200,.45)'); ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(160,255,220,.6)'; ctx.lineWidth = 0.8; ctx.beginPath(); for (let i = 0; i < 3; i++) { const ph = (t * 0.02 + i / 3) % 1; ctx.moveTo(Math.sin(i * 2) * 3, -2 - ph * 30); ctx.lineTo(Math.sin(i * 2) * 3, -6 - ph * 30); } ctx.stroke(); break;
      case 'sea': ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 0.8; for (let i = 0; i < 2; i++) { const r = ((t * 0.15 + i * 6) % 12) + 2; ctx.globalAlpha = 1 - r / 14; ctx.beginPath(); ctx.ellipse(0, -1, r, r * 0.35, 0, 0, 7); ctx.stroke(); } ctx.globalAlpha = 1; break;
      default: box(ctx, -5, 0, 10, 8, '#e0d0b0', '#b0a080', '#c04a30');
    }
    ctx.restore();
  };
  // ---------- the full-screen world map ----------
  AE.drawFullMap = function (ctx, w) {
    const T = AE.WT, D = AE.WORLD, W = AE.W, H = AE.H, mw = W - 16, mh = mw * T.h / T.w, x0 = 8, y0 = (H - mh) / 2 + 4;
    ctx.fillStyle = 'rgba(0,0,10,.85)'; ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(T.canvas, x0, y0, mw, mh); ctx.imageSmoothingEnabled = false;
    ctx.strokeStyle = '#fff'; ctx.strokeRect(x0 - 0.5, y0 - 0.5, mw + 1, mh + 1);
    AE.text(ctx, 'World of Aethra', W / 2, 4, '#ffe080', { align: 'center' });
    const sx = mw / D.w, sy = mh / D.h, S = AE.S_;
    for (const k in D.places) { const q = D.places[k]; if (AE.placeVisible ? !AE.placeVisible(k) : (q.hidden && !S.flags['found_' + k])) continue; ctx.fillStyle = '#fff'; ctx.fillRect(x0 + q[0] * sx - 1, y0 + q[1] * sy - 1, 2, 2); }
    const V = S.vehicles || {};
    for (const k in V) { const q = V[k]; if (q && q.have && q.x > 0) { ctx.fillStyle = { airship: '#ffd060', boat: '#a0d0ff', sub: '#60a0ff', skimmer: '#ff8060', talon: '#ffe080', gtalon: '#fff0a0' }[k] || '#fff'; ctx.fillRect(x0 + q.x * sx - 1.5, y0 + q.y * sy - 1.5, 3, 3); } }
    const px = x0 + w.x * sx, py = y0 + w.y * sy, on = AE.game.frame % 30 < 18;
    ctx.fillStyle = on ? '#ff3030' : '#fff'; ctx.beginPath(); ctx.arc(px, py, 2.5, 0, 7); ctx.fill();
    ctx.strokeStyle = '#ff3030'; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.sin(w.ang) * 7, py - Math.cos(w.ang) * 7); ctx.stroke();
    const near = Object.keys(D.places).filter(function (k) { return AE.placeVisible ? AE.placeVisible(k) : true; }).map(function (k) { const q = D.places[k]; return [Math.hypot(q[0] - w.x, q[1] - w.y), q[6]]; }).sort(function (a, b) { return a[0] - b[0]; })[0];
    if (near) AE.text(ctx, 'Nearest: ' + near[1], W / 2, H - 14, '#fff', { align: 'center' });
  };
})();
// ---------- story camera: a sweeping shot over the world for big moments ----------
AE.worldPan = function (o) {
  return new Promise(function (res) {
    const S = AE.S_, keep = S.world ? Object.assign({}, S.world) : null;
    const w = new AE.World(o.x, o.y, o.v || 'airship'); w.mini = 0;
    if (keep) S.world = keep; else S.world = null;
    const N = Math.round((o.secs || 6) * 60), a0 = o.ang || 0, a1 = a0 + (o.spin === undefined ? 1.2 : o.spin);
    const P = o.path || [[o.x, o.y], [o.x, o.y]];
    const scene = { kind: 'pan', opaque: true, t: 0,
      update: function (g) { if (++this.t >= N || (this.t > 30 && g.input.pressed.ok && o.skip !== false)) { AE.game.pop(this); res(); } },
      draw: function (ctx) {
        const k = this.t / N, e = k * k * (3 - 2 * k), seg = Math.min(P.length - 2, Math.floor(e * (P.length - 1))), f = e * (P.length - 1) - seg;
        w.x = P[seg][0] + (P[seg + 1][0] - P[seg][0]) * f + 0.5; w.y = P[seg][1] + (P[seg + 1][1] - P[seg][1]) * f + 0.5; w.ang = a0 + (a1 - a0) * e; w.t++;
        w.turn = (a1 - a0) / N * 3; if (o.hideShip) w.noPlayer = 1;
        w.draw(ctx);
        const bar = Math.min(22, this.t * 1.5, (N - this.t) * 1.5); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, AE.W, bar); ctx.fillRect(0, AE.H - bar, AE.W, bar);
        if (o.text && this.t > 20 && this.t < N - 20) { const a = Math.min(1, (this.t - 20) / 30, (N - 20 - this.t) / 30); ctx.globalAlpha = a; AE.text(ctx, o.text, AE.W / 2, AE.H - 18, '#fff', { align: 'center' }); ctx.globalAlpha = 1; }
      } };
    AE.game.push(scene);
  });
};
