/* ================= Battle: painted backdrops, particles, screen shake, bouncing numbers, swirl intro =================
   Each backdrop is painted once (layered sky, far ranges in haze, a middle layer that says where you are, a floor
   drawn in true perspective from the area's ground texture) and then animated on top (clouds, embers, snow, rain,
   bubbles, motes). Spells and hits throw particles; heavy blows shake the screen. */
(function () {
  const W = AE.W, BH = 150, HZ = 74, BGR = 3;   // backdrops are painted at 3x and drawn smoothly
  const hash = function (x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const n1 = function (x, s) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i, s) * (1 - u) + hash(i + 1, s) * u; };
  const ridge = function (x, s, o) { let v = 0, a = 1, n = 0, f = 1; for (let i = 0; i < (o || 4); i++) { v += a * n1(x * f, s + i * 17); n += a; a *= 0.5; f *= 2.1; } return v / n; };
  const rgb = function (h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
  const mix = function (a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; };
  const css = function (c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a === undefined ? 1 : a) + ')'; };
  // per backdrop: sky stops, haze colour, far ranges, the middle layer, floor tint, what moves
  const P = {
    grass: { sky: ['#3f78d0', '#8ec0ee', '#d8ecf8'], haze: '#b8d4ea', far: ['#7a98b8', '#5a8060'], mid: 'trees', tint: [1, 1.05, 0.95], sun: 1, anim: 'clouds' },
    plains: { sky: ['#4a86dc', '#9cc8f0', '#e4f0f8'], haze: '#c8dcec', far: ['#88a0bc', '#7a9a58'], mid: 'hills', tint: [1.05, 1.05, 0.9], sun: 1, anim: 'clouds' },
    forest: { sky: ['#20402c', '#3e6a44', '#7aa070'], haze: '#5a8060', far: ['#2e5236', '#1c3a24'], mid: 'deepwood', tint: [0.8, 0.95, 0.8], anim: 'leaves', shafts: 1 },
    desert: { sky: ['#e08848', '#f0b870', '#f8e4b0'], haze: '#f0d0a0', far: ['#d0a070', '#b88050'], mid: 'dunes', tint: [1.1, 1, 0.85], sun: 2, anim: 'dust' },
    snow: { sky: ['#6a88b0', '#a8c0dc', '#e8f0f8'], haze: '#dce6f2', far: ['#a8b8d0', '#8ca0bc'], mid: 'pines', snowcap: 1, tint: [1, 1, 1.05], anim: 'snow' },
    ice: { sky: ['#081828', '#1a3a58', '#3a6a8a'], haze: '#4a7a9a', far: ['#2a4a68', '#1a3450'], mid: 'crystals', tint: [0.85, 0.95, 1.15], anim: 'snow', cave: 1 },
    cave: { sky: ['#060404', '#1a120c', '#30241a'], haze: '#2a2018', far: ['#2a2018', '#1a120c'], mid: 'stalag', tint: [0.75, 0.7, 0.65], cave: 1, anim: 'motes' },
    lava: { sky: ['#140404', '#4a1006', '#8a2a0a'], haze: '#7a2a10', far: ['#3a0e06', '#240804'], mid: 'stalag', tint: [1.05, 0.7, 0.55], cave: 1, anim: 'embers', glow: '#ff5010' },
    city: { sky: ['#0c0c1c', '#2a2a4a', '#5a4a6a'], haze: '#4a4060', far: ['#2a2a40', '#1a1a2c'], mid: 'skyline', tint: [0.85, 0.85, 0.95], anim: 'rain' },
    slums: { sky: ['#1a1410', '#3a3028', '#6a5848'], haze: '#5a4a3a', far: ['#3a3028', '#2a2018'], mid: 'shacks', tint: [0.9, 0.85, 0.8], anim: 'motes' },
    factory: { sky: ['#0a0e12', '#202830', '#3a4650'], haze: '#3a4650', far: ['#1e262e', '#141a20'], mid: 'pipes', tint: [0.8, 0.85, 0.9], anim: 'sparks' },
    reactor: { sky: ['#040c0a', '#0e3026', '#1e6a50'], haze: '#1e5a46', far: ['#0a2a20', '#061a14'], mid: 'reactor', tint: [0.75, 1, 0.9], anim: 'motes', glow: '#30ffb0' },
    sea: { sky: ['#3a70c8', '#8ab8ec', '#d0e6f8'], haze: '#b0d0ec', far: ['#6a8ab0', '#4a7aa8'], mid: 'ocean', tint: [0.9, 1, 1.1], sun: 1, anim: 'clouds' },
    beach: { sky: ['#3a7ad8', '#90c4f0', '#dcf0fa'], haze: '#c0dcf0', far: ['#6a90b8', '#3a7ab0'], mid: 'ocean', tint: [1.1, 1.05, 0.9], sun: 1, anim: 'clouds' },
    temple: { sky: ['#100e20', '#2a2848', '#4a4670'], haze: '#3a3858', far: ['#24223a', '#18162a'], mid: 'colonnade', tint: [0.9, 0.9, 1], anim: 'motes', shafts: 1 },
    ruins: { sky: ['#4a5060', '#8a8a80', '#c8c0a0'], haze: '#a8a490', far: ['#6a6a60', '#4a4a40'], mid: 'broken', tint: [1, 0.95, 0.85], sun: 1, anim: 'dust' },
    swamp: { sky: ['#141e14', '#2a3a26', '#4a5a3a'], haze: '#3a4a30', far: ['#24341e', '#162212'], mid: 'mangrove', tint: [0.8, 0.95, 0.75], anim: 'rain' },
    sky: { sky: ['#1a3a8a', '#5a8ad8', '#c0dcf8'], haze: '#d0e4f8', far: ['#e8f0fa', '#c8d8f0'], mid: 'cloudsea', tint: [1, 1, 1.1], sun: 1, anim: 'clouds' },
    citadel: { sky: ['#0a0418', '#2a0e40', '#5a2070'], haze: '#4a1a60', far: ['#2a1040', '#1a0828'], mid: 'crystals', tint: [0.95, 0.8, 1.1], anim: 'motes', glow: '#c060ff' },
    underwater: { sky: ['#041828', '#0c3a5a', '#1a6a8a'], haze: '#1a5a7a', far: ['#0a3050', '#062038'], mid: 'kelp', tint: [0.7, 0.95, 1.1], anim: 'bubbles', shafts: 1 },
    ship: { sky: ['#3a74cc', '#8cbcee', '#d4e8f8'], haze: '#b4d2ee', far: ['#6a8ab0', '#4a7aa8'], mid: 'ocean', tint: [1, 1, 1], sun: 1, anim: 'clouds' },
  };
  AE.BGART = P;
  AE.BGCACHE = {};
  const texData = function (D) {
    let im, sx, sy;
    if (typeof D.ground === 'string') { const nm = D.ground.split(':')[1]; im = AE.IMG.fills; sx = (AE.FILL_ORDER || []).indexOf(nm) * 16; sy = 0; }
    else { im = AE.IMG[D.ground[0]]; sx = D.ground[1] * 16; sy = D.ground[2] * 16; }
    const c = document.createElement('canvas'); c.width = 16; c.height = 16; const x = c.getContext('2d');
    if (im && sx >= 0) x.drawImage(im, sx, sy, 16, 16, 0, 0, 16, 16); else { x.fillStyle = '#6a8a4a'; x.fillRect(0, 0, 16, 16); }
    return x.getImageData(0, 0, 16, 16).data;
  };
  const paint = function (kind) {
    const D = AE.BGS[kind] || AE.BGS.grass, A = P[kind] || P.grass, seed = kind.length * 31 + kind.charCodeAt(0);
    const R = BGR, c = document.createElement('canvas'); c.width = W * R; c.height = BH * R; const x = c.getContext('2d'); x.setTransform(R, 0, 0, R, 0, 0);
    // sky
    const g = x.createLinearGradient(0, 0, 0, HZ); g.addColorStop(0, A.sky[0]); g.addColorStop(0.6, A.sky[1]); g.addColorStop(1, A.sky[2]); x.fillStyle = g; x.fillRect(0, 0, W, HZ + 2);
    if (A.sun) { const sg = x.createRadialGradient(200, 22, 2, 200, 22, 60); sg.addColorStop(0, A.sun === 2 ? 'rgba(255,240,200,1)' : 'rgba(255,255,240,.95)'); sg.addColorStop(0.15, 'rgba(255,250,220,.6)'); sg.addColorStop(1, 'rgba(255,250,220,0)'); x.fillStyle = sg; x.fillRect(0, 0, W, HZ); }
    if (A.cave) {   // a rock ceiling hanging down
      for (let j = 0; j < W * BGR; j++) { const i = j / BGR, h = 6 + ridge(i * 0.05, seed + 3) * 26 + (hash(Math.floor(i) >> 2, seed) < 0.12 ? 10 * hash(Math.floor(i), 9) : 0); const cg = x.createLinearGradient(0, 0, 0, h); cg.addColorStop(0, A.far[1]); cg.addColorStop(1, A.far[0]); x.fillStyle = cg; x.fillRect(i, 0, 1 / BGR + 0.01, h); }
    }
    // far ranges: two silhouettes, the further one lost in haze
    const haze = rgb(A.haze), sky = x.getImageData(0, 0, W * R, (HZ + 2) * R), sd = sky.data;
    [[0.55, 20, 0.018, A.far[0], 0.55], [0.85, 14, 0.03, A.far[1], 0.2]].forEach(function (L, li) {
      const base = HZ - 2, col = rgb(L[3]);
      for (let j = 0; j < W * R; j++) {
        const i = j / R, h = L[1] * (0.35 + ridge(i * L[2], seed + li * 50, 5)) * (A.mid === 'ocean' || A.mid === 'cloudsea' ? 0.35 : 1);
        for (let yy = Math.floor((base - h) * R); yy < (base + 2) * R; yy++) {
          const y = yy / R, k = (y - (base - h)) / (h + 2), cc = mix(col, haze, L[4] * (1 - k * 0.3));
          const sh = A.snowcap && y < base - h + 4 ? 1.4 : 1, top = Math.min(1, ((yy + 1) / R - (base - h)) * R), o = (yy * W * R + j) * 4;
          for (let q = 0; q < 3; q++) sd[o + q] = sd[o + q] + (Math.min(255, cc[q] * sh) - sd[o + q]) * top;   // anti-aliased ridge line
        }
      }
    });
    x.putImageData(sky, 0, 0);
    // the floor in perspective, from the area's ground tile
    const T = texData(D), tint = A.tint || [1, 1, 1], img = x.getImageData(0, HZ * R, W * R, (BH - HZ) * R), d = img.data, fh = rgb(A.haze);
    const tex = function (u, v, k) {   // bilinear, wrapping
      const u0 = Math.floor(u), v0 = Math.floor(v), fu = u - u0, fv = v - v0, a = u0 & 15, b2 = (u0 + 1) & 15, c2 = v0 & 15, e = (v0 + 1) & 15;
      const p = function (uu, vv) { return T[(vv * 16 + uu) * 4 + k]; };
      return (p(a, c2) * (1 - fu) + p(b2, c2) * fu) * (1 - fv) + (p(a, e) * (1 - fu) + p(b2, e) * fu) * fv;
    };
    for (let yy = 0; yy < (BH - HZ) * R; yy++) {
      const y = yy / R, z = 900 / (y + 6), fog = Math.max(0, Math.min(1, (z - 30) / 110)), lum = 0.55 + 0.45 * Math.min(1, y / 50);
      for (let j = 0; j < W * R; j++) {
        const i = j / R, u = (i - W / 2) * z / 120 + 1000, v = z * 1.2, p = (yy * W * R + j) * 4;
        const jit = 0.92 + hash(Math.floor(i) >> 1, (z | 0)) * 0.16;
        for (let k = 0; k < 3; k++) { let val = tex(u, v, k) * tint[k] * lum * jit; val = val + (fh[k] - val) * fog * 0.85; d[p + k] = Math.max(0, Math.min(255, val)); }
        d[p + 3] = 255;
      }
    }
    x.putImageData(img, 0, HZ * R);
    // the middle layer: what makes this place this place
    mid(x, A, seed, HZ);
    // floor clutter in perspective (stones, tufts) and a soft vignette
    for (let i = 0; i < 40; i++) {
      const yy = HZ + 6 + Math.pow(hash(i, seed + 7), 1.6) * (BH - HZ - 8), xx = hash(i, seed + 8) * W, s = (yy - HZ) / 30;
      if (Math.abs(xx - W / 2) < 50 && yy > HZ + 30) continue;
      x.fillStyle = 'rgba(0,0,0,.18)'; x.beginPath(); x.ellipse(xx, yy + s, 3 * s, 1.2 * s, 0, 0, 7); x.fill();
      x.fillStyle = A.mid === 'trees' || A.mid === 'hills' || A.mid === 'deepwood' ? 'rgba(40,90,30,.8)' : 'rgba(90,80,70,.7)';
      x.beginPath(); x.ellipse(xx, yy, 2.4 * s, 1.4 * s, 0, 0, 7); x.fill();
    }
    const vg = x.createRadialGradient(W / 2, BH * 0.55, 60, W / 2, BH * 0.55, 190); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); x.fillStyle = vg; x.fillRect(0, 0, W, BH);
    // ground shadow band at the horizon (depth)
    const sh = x.createLinearGradient(0, HZ - 1, 0, HZ + 18); sh.addColorStop(0, 'rgba(0,0,0,.35)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = sh; x.fillRect(0, HZ - 1, W, 19);
    return c;
  };
  const tree = function (x, cx, by, s, col, dark) {
    x.fillStyle = dark; x.fillRect(cx - s * 0.12, by - s * 0.5, s * 0.24, s * 0.5);
    for (let k = 0; k < 3; k++) { x.fillStyle = k === 0 ? dark : col; x.beginPath(); x.ellipse(cx + (k - 1) * s * 0.18, by - s * (0.65 + k * 0.12), s * (0.42 - k * 0.08), s * (0.35 - k * 0.05), 0, 0, 7); x.fill(); }
  };
  const pine = function (x, cx, by, s, col, snow) {
    x.fillStyle = '#3a2a1a'; x.fillRect(cx - 1, by - s * 0.2, 2, s * 0.2);
    for (let k = 0; k < 3; k++) { const w = s * (0.45 - k * 0.12), t0 = by - s * (0.15 + k * 0.25); x.fillStyle = col; x.beginPath(); x.moveTo(cx - w, t0); x.lineTo(cx, t0 - s * 0.4); x.lineTo(cx + w, t0); x.fill(); if (snow) { x.fillStyle = 'rgba(255,255,255,.85)'; x.beginPath(); x.moveTo(cx - w * 0.4, t0 - s * 0.24); x.lineTo(cx, t0 - s * 0.4); x.lineTo(cx + w * 0.4, t0 - s * 0.24); x.fill(); } }
  };
  const mid = function (x, A, seed, hz) {
    const r = function (i) { return hash(i, seed + 99); };
    switch (A.mid) {
      case 'trees': for (let i = 0; i < 22; i++) tree(x, r(i) * W, hz + 1 + r(i + 50) * 3, 14 + r(i + 7) * 12, '#3c7a34', '#24502a'); break;
      case 'hills': for (let i = 0; i < 6; i++) { x.fillStyle = 'rgba(70,120,50,.9)'; x.beginPath(); x.ellipse(r(i) * W, hz + 3, 30 + r(i + 3) * 40, 8 + r(i + 4) * 6, 0, Math.PI, 0); x.fill(); } for (let i = 0; i < 8; i++) tree(x, r(i + 20) * W, hz + 2, 10 + r(i + 9) * 6, '#4a8a3c', '#2a5a2a'); break;
      case 'deepwood': for (let L = 0; L < 3; L++) for (let i = 0; i < 16; i++) tree(x, (i + r(i + L * 30)) * W / 15, hz + 4 + L * 4, 30 + r(i + L) * 20 + L * 10, ['#2a5a30', '#24502a', '#1a3a20'][L], ['#14301a', '#102814', '#0a1e10'][L]);
        for (let i = 0; i < 5; i++) { x.fillStyle = '#1a120a'; x.fillRect(r(i + 70) * W, 0, 4 + r(i) * 5, hz + 6); } break;
      case 'pines': for (let i = 0; i < 26; i++) pine(x, r(i) * W, hz + 2 + r(i + 5) * 3, 14 + r(i + 9) * 14, '#2a4a3a', true); break;
      case 'dunes': for (let i = 0; i < 5; i++) { const g = x.createLinearGradient(0, hz - 12, 0, hz + 4); g.addColorStop(0, '#f0c888'); g.addColorStop(1, '#c08850'); x.fillStyle = g; x.beginPath(); x.ellipse(r(i) * W, hz + 3, 40 + r(i + 1) * 50, 10 + r(i + 2) * 8, 0, Math.PI, 0); x.fill(); }
        x.fillStyle = '#6a8a3a'; for (let i = 0; i < 4; i++) { const cx = r(i + 40) * W; x.fillRect(cx, hz - 10, 3, 12); x.fillRect(cx - 4, hz - 6, 4, 2); x.fillRect(cx - 4, hz - 9, 2, 4); x.fillRect(cx + 3, hz - 7, 4, 2); x.fillRect(cx + 5, hz - 10, 2, 4); } break;
      case 'crystals': for (let i = 0; i < 14; i++) { const cx = r(i) * W, h = 14 + r(i + 3) * 30, w = 4 + r(i + 4) * 6, g = x.createLinearGradient(cx - w, 0, cx + w, 0);
          g.addColorStop(0, A.glow ? 'rgba(200,120,255,.9)' : 'rgba(150,220,255,.9)'); g.addColorStop(0.5, 'rgba(255,255,255,.95)'); g.addColorStop(1, A.glow ? 'rgba(90,30,140,.9)' : 'rgba(60,120,170,.9)');
          x.fillStyle = g; x.beginPath(); x.moveTo(cx - w, hz + 3); x.lineTo(cx - w * 0.6, hz - h * 0.7); x.lineTo(cx, hz - h); x.lineTo(cx + w * 0.7, hz - h * 0.6); x.lineTo(cx + w, hz + 3); x.fill(); } break;
      case 'stalag': for (let i = 0; i < 12; i++) { const cx = r(i) * W, h = 10 + r(i + 1) * 26, w = 3 + r(i + 2) * 6; x.fillStyle = A.glow ? '#3a1408' : '#2a2018'; x.beginPath(); x.moveTo(cx - w, hz + 3); x.lineTo(cx, hz - h); x.lineTo(cx + w, hz + 3); x.fill(); x.fillStyle = 'rgba(255,255,255,.08)'; x.beginPath(); x.moveTo(cx - w * 0.3, hz); x.lineTo(cx, hz - h); x.lineTo(cx, hz); x.fill(); }
        if (A.glow) { for (let i = 0; i < 3; i++) { const cx = r(i + 60) * W, g = x.createRadialGradient(cx, hz + 2, 1, cx, hz + 2, 30); g.addColorStop(0, 'rgba(255,140,40,.8)'); g.addColorStop(1, 'rgba(255,60,0,0)'); x.fillStyle = g; x.fillRect(cx - 30, hz - 28, 60, 40); } } break;
      case 'skyline': for (let i = 0; i < 30; i++) { const bx = i * 9 - 4 + r(i) * 4, bw = 7 + r(i + 1) * 8, bh = 14 + r(i + 2) * 40; x.fillStyle = i % 2 ? '#181828' : '#22223a'; x.fillRect(bx, hz - bh, bw, bh + 3);
          for (let wy = hz - bh + 3; wy < hz - 2; wy += 4) for (let wx = bx + 1; wx < bx + bw - 1; wx += 3) if (hash(wx, wy) < 0.35) { x.fillStyle = hash(wy, wx) < 0.5 ? 'rgba(255,220,130,.9)' : 'rgba(160,220,255,.7)'; x.fillRect(wx, wy, 1, 2); } }
        x.fillStyle = 'rgba(255,80,60,.9)'; x.fillRect(W * 0.7, hz - 58, 2, 2); break;
      case 'shacks': for (let i = 0; i < 18; i++) { const bx = i * 15 + r(i) * 6, bw = 10 + r(i + 1) * 8, bh = 8 + r(i + 2) * 12; x.fillStyle = ['#4a3a2a', '#3a3028', '#5a4a3a'][i % 3]; x.fillRect(bx, hz - bh, bw, bh + 3); x.fillStyle = '#6a5a4a'; x.beginPath(); x.moveTo(bx - 2, hz - bh); x.lineTo(bx + bw / 2, hz - bh - 5); x.lineTo(bx + bw + 2, hz - bh); x.fill(); if (r(i + 5) < 0.5) { x.fillStyle = 'rgba(255,200,100,.8)'; x.fillRect(bx + 3, hz - bh + 3, 2, 2); } }
        x.fillStyle = '#2a2420'; x.fillRect(0, 0, W, 10); for (let i = 0; i < W; i += 24) x.fillRect(i, 0, 3, hz); break;   // the plate overhead
      case 'pipes': case 'reactor': for (let i = 0; i < 4; i++) { const y = 10 + i * 13, gg = x.createLinearGradient(0, y, 0, y + 6); gg.addColorStop(0, '#6a7a86'); gg.addColorStop(0.5, '#3a4650'); gg.addColorStop(1, '#1a2028'); x.fillStyle = gg; x.fillRect(0, y, W, 5 + (i % 2) * 2); }
        for (let i = 0; i < 6; i++) { const px = 20 + i * 44, gg = x.createLinearGradient(px, 0, px + 8, 0); gg.addColorStop(0, '#5a6a76'); gg.addColorStop(1, '#1a2028'); x.fillStyle = gg; x.fillRect(px, 0, 8, hz + 2); }
        if (A.mid === 'reactor') { const g = x.createRadialGradient(W / 2, hz - 20, 4, W / 2, hz - 20, 50); g.addColorStop(0, 'rgba(120,255,200,.9)'); g.addColorStop(1, 'rgba(40,255,160,0)'); x.fillStyle = g; x.fillRect(0, 0, W, hz + 10); x.strokeStyle = '#2a3a36'; x.lineWidth = 3; x.beginPath(); x.arc(W / 2, hz - 20, 22, 0, 7); x.stroke(); } break;
      case 'ocean': { const g = x.createLinearGradient(0, hz - 4, 0, hz + 30); g.addColorStop(0, '#5a90d0'); g.addColorStop(1, '#2a5a9a'); x.fillStyle = g; x.fillRect(0, hz - 3, W, A === P.beach ? 10 : 30);
        x.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 40; i++) x.fillRect(r(i) * W, hz - 2 + r(i + 1) * (A === P.beach ? 9 : 28), 3 + r(i + 2) * 6, 1); break; }
      case 'colonnade': for (let i = 0; i < 7; i++) { const px = 8 + i * 40, g = x.createLinearGradient(px, 0, px + 14, 0); g.addColorStop(0, '#5a5878'); g.addColorStop(0.4, '#8a88a8'); g.addColorStop(1, '#2a2840'); x.fillStyle = g; x.fillRect(px, 0, 14, hz + 4); x.fillStyle = '#3a3858'; x.fillRect(px - 3, hz - 2, 20, 6); x.fillRect(px - 3, 0, 20, 5); } break;
      case 'broken': for (let i = 0; i < 7; i++) { const px = 10 + i * 38, h = 20 + r(i) * 40, g = x.createLinearGradient(px, 0, px + 12, 0); g.addColorStop(0, '#a8a08a'); g.addColorStop(1, '#5a5444'); x.fillStyle = g; x.fillRect(px, hz - h, 12, h + 4); x.fillStyle = '#7a7460'; x.fillRect(px - 2, hz + 1, 16, 4); x.fillStyle = 'rgba(70,110,40,.8)'; x.fillRect(px, hz - h, 12, 3); } break;
      case 'mangrove': for (let i = 0; i < 12; i++) { const cx = r(i) * W; x.strokeStyle = '#1e2a16'; x.lineWidth = 2; for (let k = -2; k <= 2; k++) { x.beginPath(); x.moveTo(cx, hz - 18); x.quadraticCurveTo(cx + k * 4, hz - 6, cx + k * 7, hz + 3); x.stroke(); } tree(x, cx, hz - 14, 22, '#2a3e20', '#18260f'); }
        x.fillStyle = 'rgba(80,110,60,.5)'; x.fillRect(0, hz, W, 8); break;
      case 'cloudsea': for (let i = 0; i < 26; i++) { x.fillStyle = 'rgba(255,255,255,' + (0.6 + r(i) * 0.4) + ')'; x.beginPath(); x.ellipse(r(i + 1) * W, hz + r(i + 2) * 10 - 4, 20 + r(i + 3) * 30, 5 + r(i + 4) * 5, 0, 0, 7); x.fill(); } break;
      case 'kelp': for (let i = 0; i < 18; i++) { const cx = r(i) * W, h = 30 + r(i + 1) * 40; x.strokeStyle = 'rgba(40,120,80,.85)'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx, hz + 4); for (let k = 1; k <= 6; k++) x.lineTo(cx + Math.sin(k + i) * 4, hz + 4 - h * k / 6); x.stroke(); }
        for (let i = 0; i < 8; i++) { x.fillStyle = ['#e06a8a', '#f0a050', '#c050c0'][i % 3]; x.beginPath(); x.ellipse(r(i + 30) * W, hz + 2, 5, 3, 0, Math.PI, 0); x.fill(); } break;
    }
  };
  // light shafts, glow, moving weather: drawn every frame on top of the painted backdrop
  AE.drawBattleBg = function (ctx, kind, t) {
    if (!AE.BGCACHE[kind]) AE.BGCACHE[kind] = paint(kind);
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(AE.BGCACHE[kind], 0, 0, W, BH); ctx.restore();
    const A = P[kind] || P.grass;
    if (A.shafts) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const x0 = 30 + i * 60 + Math.sin(t * 0.01 + i) * 8, a = 0.05 + 0.03 * Math.sin(t * 0.02 + i * 2); ctx.fillStyle = 'rgba(255,250,200,' + a + ')'; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0 + 16, 0); ctx.lineTo(x0 + 50, BH); ctx.lineTo(x0 + 20, BH); ctx.fill(); } ctx.restore(); }
    if (A.glow) { ctx.globalAlpha = 0.1 + Math.sin(t * 0.05) * 0.05; ctx.fillStyle = A.glow; ctx.fillRect(0, 0, W, BH); ctx.globalAlpha = 1; }
    const an = A.anim;
    if (an === 'clouds') { for (let i = 0; i < 6; i++) { const x = (i * 71 + t * (0.08 + i * 0.02)) % (W + 80) - 40, y = 8 + (i * 17) % 40; ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(x, y, 22 + i * 3, 5, 0, 0, 7); ctx.ellipse(x + 10, y - 3, 12, 5, 0, 0, 7); ctx.fill(); } }
    else if (an === 'snow') { ctx.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 60; i++) { const x = (hash(i, 1) * W + Math.sin(t * 0.02 + i) * 10 + t * 0.2) % W, y = (hash(i, 2) * BH + t * (0.4 + hash(i, 3) * 0.6)) % BH; ctx.fillRect(x, y, hash(i, 4) < 0.3 ? 2 : 1, hash(i, 4) < 0.3 ? 2 : 1); } }
    else if (an === 'rain') { ctx.strokeStyle = 'rgba(180,200,230,.35)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 70; i++) { const x = (hash(i, 1) * W + t * 1.5) % W, y = (hash(i, 2) * BH + t * 6) % BH; ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 7); } ctx.stroke(); }
    else if (an === 'embers') { for (let i = 0; i < 40; i++) { const y = BH - ((t * (0.4 + hash(i, 3)) + hash(i, 2) * BH) % BH), x = (hash(i, 1) * W + Math.sin(t * 0.03 + i) * 8) % W; ctx.fillStyle = hash(i, 5) < 0.5 ? 'rgba(255,180,60,.9)' : 'rgba(255,90,20,.8)'; ctx.fillRect(x, y, 1 + (i % 2), 1 + (i % 2)); } }
    else if (an === 'bubbles') { ctx.strokeStyle = 'rgba(200,240,255,.6)'; for (let i = 0; i < 24; i++) { const y = BH - ((t * (0.3 + hash(i, 3) * 0.5) + hash(i, 2) * BH) % BH), x = hash(i, 1) * W + Math.sin(t * 0.04 + i) * 4; ctx.beginPath(); ctx.arc(x, y, 1 + hash(i, 4) * 2, 0, 7); ctx.stroke(); } }
    else if (an === 'leaves') { for (let i = 0; i < 18; i++) { const x = (hash(i, 1) * W + t * 0.3 + Math.sin(t * 0.03 + i) * 12) % W, y = (hash(i, 2) * BH + t * (0.25 + hash(i, 3) * 0.3)) % BH; ctx.fillStyle = ['#c8a030', '#8ab040', '#d07030'][i % 3]; ctx.fillRect(x, y, 2, 1); ctx.fillRect(x + (Math.sin(t * 0.1 + i) > 0 ? 1 : 0), y + 1, 1, 1); } }
    else if (an === 'dust') { for (let i = 0; i < 30; i++) { const x = (hash(i, 1) * W + t * (0.5 + hash(i, 2))) % W, y = HZ - 10 + hash(i, 3) * (BH - HZ + 10) + Math.sin(t * 0.03 + i) * 3; ctx.fillStyle = 'rgba(240,220,170,.35)'; ctx.fillRect(x, y, 2, 1); } }
    else if (an === 'sparks') { if (t % 90 < 14) { const sx = 20 + ((t / 90) | 0) * 44 % W; for (let i = 0; i < 8; i++) { ctx.fillStyle = 'rgba(255,220,120,.9)'; ctx.fillRect(sx + 4 + Math.sin(i * 3) * (t % 90), 30 + i * 2 + (t % 90) * 0.8, 1, 1); } } }
    else if (an === 'motes') { for (let i = 0; i < 26; i++) { const x = (hash(i, 1) * W + Math.sin(t * 0.01 + i) * 14) % W, y = (hash(i, 2) * BH - t * (0.1 + hash(i, 3) * 0.2) + BH * 10) % BH, a = 0.3 + 0.3 * Math.sin(t * 0.05 + i); ctx.fillStyle = A.glow ? 'rgba(200,160,255,' + a + ')' : 'rgba(255,240,200,' + a + ')'; ctx.fillRect(x, y, 1, 1); } }
  };
  // ---------- particles ----------
  const PART = {
    fire: { n: 34, col: ['#fff2a0', '#ffb030', '#ff6010', '#c02808'], up: -1.1, spread: 14, life: 40, grow: 1, ring: '#ff8020' },
    ice: { n: 26, col: ['#ffffff', '#c8f0ff', '#80c8ff'], shard: 1, spread: 30, life: 30, ring: '#a0e0ff', inward: 1 },
    bolt: { n: 18, col: ['#ffffff', '#fff6a0', '#a0c8ff'], spread: 10, life: 22, bolt: 1 },
    water: { n: 30, col: ['#e0f8ff', '#60b0f0', '#2a70d0'], up: -2.2, grav: 0.18, spread: 10, life: 36 },
    wind: { n: 30, col: ['#ffffff', '#c8f0d8', '#90e0b0'], swirl: 1, spread: 20, life: 40 },
    quake: { n: 22, col: ['#a08060', '#705038', '#c0a080'], up: -3.2, grav: 0.22, spread: 18, life: 40, rock: 1, shake: 10 },
    holy: { n: 30, col: ['#ffffff', '#fff6c0', '#ffe080'], up: -0.9, spread: 16, life: 46, pillar: '#fff6c0' },
    heal: { n: 24, col: ['#ffffff', '#b0ffb0', '#60e0a0'], up: -0.8, spread: 12, life: 46, pillar: '#a0ffc0' },
    life: { n: 30, col: ['#ffffff', '#fff6a0', '#ffd0f0'], up: -1, spread: 12, life: 50, pillar: '#fff0c0' },
    dark: { n: 30, col: ['#e0a0ff', '#8040c0', '#301040'], inward: 1, spread: 34, life: 34, ring: '#8040c0' },
    poison: { n: 18, col: ['#d0ff80', '#80d040', '#408020'], up: -0.6, spread: 12, life: 40, bubble: 1 },
    boom: { n: 40, col: ['#ffffff', '#ffe080', '#ff8020', '#603020'], burst: 3.2, spread: 4, life: 34, ring: '#ffc060', shake: 12 },
    hit: { n: 10, col: ['#ffffff', '#fff0a0', '#ffc040'], burst: 2.6, spread: 2, life: 14 },
    crit: { n: 22, col: ['#ffffff', '#fff0a0', '#ff8040'], burst: 3.6, spread: 2, life: 20, ring: '#fff0a0', shake: 7 },
    spark: { n: 16, col: ['#ffffff', '#a0f0ff'], burst: 2, spread: 4, life: 20 },
    time: { n: 20, col: ['#ffffff', '#c0a0ff'], swirl: 1, spread: 16, life: 34, ring: '#c0a0ff' },
    shield: { n: 16, col: ['#ffffff', '#80c0ff'], swirl: 1, spread: 16, life: 30, ring: '#80c0ff' },
    death: { n: 30, col: ['#ff6060', '#c02020', '#401010'], up: -0.5, spread: 18, life: 50 },
  };
  AE.PART = PART;
  AE.Battle.prototype.burst = function (kind, x, y) {
    const D = PART[kind]; if (!D) return; this.parts = this.parts || [];
    for (let i = 0; i < D.n; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * D.spread, sp = (D.burst || 0.5) * (0.4 + Math.random());
      const p = { x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.7, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp + (D.up || 0) * (0.5 + Math.random()), t: 0, life: D.life * (0.6 + Math.random() * 0.6), col: D.col[(Math.random() * D.col.length) | 0], s: 1 + Math.random() * 2, D: D, cx: x, cy: y, a: a };
      if (D.inward) { p.x = x + Math.cos(a) * D.spread * 1.5; p.y = y + Math.sin(a) * D.spread; p.vx = (x - p.x) / D.life * 1.4; p.vy = (y - p.y) / D.life * 1.4; }
      this.parts.push(p);
    }
    if (D.ring) this.parts.push({ ring: 1, x: x, y: y, t: 0, life: 18, col: D.ring });
    if (D.pillar) this.parts.push({ pillar: 1, x: x, y: y, t: 0, life: 40, col: D.pillar });
    if (D.bolt) { for (let k = 0; k < 2; k++) this.parts.push({ bolt: 1, x: x, y: y, t: 0, life: 12, seed: Math.random() * 999 }); AE.game.flash = Math.max(AE.game.flash, 3); }
    if (D.shake) this.shakeT = Math.max(this.shakeT || 0, D.shake);
  };
  AE.Battle.prototype.updateParts = function () {
    this.parts = (this.parts || []).filter(function (p) {
      p.t++; if (p.ring || p.pillar || p.bolt) return p.t < p.life;
      const D = p.D;
      if (D.swirl) { p.a += 0.18; const r = D.spread * (1 - p.t / p.life) + 4; p.x = p.cx + Math.cos(p.a) * r; p.y = p.cy + Math.sin(p.a) * r * 0.5 - p.t * 0.6; }
      else { p.x += p.vx; p.y += p.vy; p.vy += D.grav || 0; if (!D.grav) { p.vx *= 0.95; if (D.burst) p.vy *= 0.95; } }
      return p.t < p.life;
    });
    if (this.shakeT > 0) this.shakeT--;
  };
  AE.Battle.prototype.drawParts = function (ctx) {
    if (!this.parts || !this.parts.length) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    this.parts.forEach(function (p) {
      const k = 1 - p.t / p.life;
      if (p.ring) { ctx.strokeStyle = p.col; ctx.globalAlpha = k; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p.x, p.y, 4 + p.t * 2.2, 2 + p.t * 1.1, 0, 0, 7); ctx.stroke(); return; }
      if (p.pillar) { const g = ctx.createLinearGradient(p.x - 12, 0, p.x + 12, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, p.col); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.globalAlpha = Math.min(1, k * 1.5) * 0.6; ctx.fillStyle = g; ctx.fillRect(p.x - 12, 0, 24, p.y + 18); return; }
      if (p.bolt) { ctx.globalAlpha = k; ctx.strokeStyle = '#e8f0ff'; ctx.lineWidth = 2; ctx.beginPath(); let x = p.x + Math.sin(p.seed) * 20, y = 0; ctx.moveTo(x, y); while (y < p.y) { y += 8; x += (Math.sin(p.seed + y * 1.7 + p.t) * 9); x += (p.x - x) * 0.25; ctx.lineTo(x, Math.min(y, p.y)); } ctx.stroke(); ctx.strokeStyle = 'rgba(140,180,255,.6)'; ctx.lineWidth = 5; ctx.stroke(); return; }
      ctx.globalAlpha = Math.min(1, k * 1.6); ctx.fillStyle = p.col;
      const s = p.D.grow ? p.s * (1 + p.t / p.life * 1.5) : p.s;
      if (p.D.shard) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillRect(-s * 1.5, -0.5, s * 3, 1.2); ctx.restore(); }
      else if (p.D.bubble) { ctx.strokeStyle = p.col; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, 7); ctx.stroke(); }
      else if (p.D.rock) { ctx.globalCompositeOperation = 'source-over'; ctx.fillRect(p.x - s, p.y - s, s * 2, s * 2); ctx.globalCompositeOperation = 'lighter'; }
      else ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    });
    ctx.restore();
  };
  // spell and hit effects throw particles as well as the sprite animation
  const FXP = { fire: 'fire', ice: 'ice', bolt: 'bolt', water: 'water', wind: 'wind', quake: 'quake', heal: 'heal', holy: 'holy', dark: 'dark', poison: 'poison', shield: 'shield', time: 'time', life: 'life', spark: 'spark', boom: 'boom', slash: 'hit', claw: 'hit', shot: 'spark', bite: 'hit', cut: 'hit' };
  const addFx0 = AE.Battle.prototype.addFx;
  AE.Battle.prototype.addFx = function (kind, t) {
    addFx0.apply(this, arguments);
    const k = FXP[kind]; if (k && t) this.burst(k, t.x, t.y - (t.side === 'enemy' ? AE.enemyH(t) / 2 : 16));
  };
  const hurt0 = AE.Battle.prototype.hurt;
  AE.Battle.prototype.hurt = function (f, d, o) {
    const big = d >= f.maxhp * 0.2 || (o && o.crit);
    hurt0.apply(this, arguments);
    const y = f.y - (f.side === 'enemy' ? AE.enemyH(f) / 2 : 16);
    if (d > 0) this.burst(big ? 'crit' : 'hit', f.x, y);
    if (big) this.shakeT = Math.max(this.shakeT || 0, 8);
    if (f.hp <= 0 && f.side === 'enemy') this.burst('death', f.x, y);
  };
  const upd0 = AE.Battle.prototype.update;
  AE.Battle.prototype.update = function (g) { this.updateParts(); return upd0.apply(this, arguments); };
  const draw0 = AE.Battle.prototype.draw;
  AE.Battle.prototype.draw = function (ctx) {
    const s = this.shakeT || 0;
    if (s) { ctx.save(); ctx.translate((Math.random() - 0.5) * s * 0.8, (Math.random() - 0.5) * s * 0.6); }
    draw0.call(this, ctx);
    if (s) ctx.restore();
    // the swirl into battle: blades of black spinning open
    if (this.phase === 'intro' || this.t < 34) {
      const k = Math.max(0, 1 - this.t / 32); if (k > 0) {
        ctx.save(); ctx.translate(W / 2, AE.H / 2); ctx.rotate(k * 4); ctx.fillStyle = '#000';
        for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 200, 0, Math.PI / 4 * k); ctx.fill(); }
        ctx.restore();
      }
    }
  };
})();
