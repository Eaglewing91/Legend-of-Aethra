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
  // bosses turned side-on to face the party (tools/sides), when there is a turned sprite for them
  const SD = A.boss && AE.SIDES && AE.SIDES[A.boss];
  if (SD && AE.IMG['side_' + A.boss]) return { im: AE.IMG['side_' + A.boss], fw: SD.fw, fh: SD.fh, n: SD.n, k: (A.k || 2) * SD.scale * ((A.fh || SD.origfh) / SD.origfh), side: 1 };
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
    AE.blit(ctx, A.im, fr * A.fw, 0, A.fw, A.fh, X - A.fw * A.k / 2, Y - A.fh * A.k, A.fw * A.k, A.fh * A.k, { alpha: alpha, filter: fs, flip: !A.side && !D.noflip });
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
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(X, Y, 10, 3, 0, 0, 7); ctx.fill();
  const al = f.status.vanish ? 0.35 : 1;
  if (!AE.actor(ctx, f.id, 'b_' + anim, null, fr, X, Y, AE.PARTYK || 1.3, { filter: filter.join(' ') || undefined, alpha: al, flip: !!f.flip })) { ctx.fillStyle = '#48c'; ctx.fillRect(X - 6, Y - 26, 12, 26); }
  if (f.defending) { ctx.globalAlpha = 0.5; ctx.fillStyle = '#8cf'; ctx.fillRect(X - 14, Y - 30, 2, 26); ctx.globalAlpha = 1; }
  if (sel) AE.cursor(ctx, X - 30, Y - 26, true);
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
  if (this.drawParts) this.drawParts(ctx);
  this.pops.forEach(function (p, i) {
    // numbers leap up, drop and bounce twice, then fade
    const t = p.t, b = t < 10 ? Math.sin(t / 10 * Math.PI) * 14 : t < 18 ? Math.sin((t - 10) / 8 * Math.PI) * 5 : t < 24 ? Math.sin((t - 18) / 6 * Math.PI) * 2 : 0;
    const y = p.y - 6 - b, a = t > 45 ? (60 - t) / 15 : 1;
    ctx.globalAlpha = a; AE.text(ctx, p.text, p.x, y, p.col, { align: 'center' }); ctx.globalAlpha = 1;
  });
  if (!this.banner && this.phase === 'fight') this.drawTurns(ctx);
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
    AE.bar(ctx, 218, y + 3, 32, 3, f.surge || 0, (f.surge || 0) >= 1 ? (AE.game.frame % 20 < 10 ? '#ff60c0' : '#ffa0e0') : '#c04090');
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

// the turn-order strip: who acts now, then the next turns
AE.Battle.prototype.drawTurns = function (ctx) {
  const list = this.order(6), cur = this.menu ? this.menu.f : this.cur; if (!list.length) return;
  const items = list.map(function (f, i) {
    let n = f.name; if (n.length > 8) n = n.slice(0, 7) + '.';
    return { f: f, n: n, w: AE.textWidth(n), now: i === 0 && f === cur };
  });
  let w = AE.textWidth('Next') + 14, k = 0;
  for (; k < items.length; k++) { if (w + items[k].w + 10 > AE.W - 8) break; w += items[k].w + 10; }
  ctx.globalAlpha = 0.85; AE.window(ctx, 2, 2, w, 15); ctx.globalAlpha = 1;
  let x = 9; AE.text(ctx, items[0].now ? 'Now' : 'Next', x, 6, '#aab'); x += AE.textWidth('Next') + 6;
  for (let i = 0; i < k; i++) {
    const it = items[i], col = it.f.side === 'party' ? (it.now ? '#ffe080' : '#cfe0ff') : (it.now ? '#ff9a7a' : '#e0a0a0');
    if (i) AE.text(ctx, '>', x - 8, 6, '#667');
    AE.text(ctx, it.n, x, 6, col); x += it.w + 10;
  }
};
