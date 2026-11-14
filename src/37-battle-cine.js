/* ================= Battle cinematics: Surge cut-ins, Echo summoning sequences ================= */
(function () {
  AE.PARTYK = 1.3;
  const W = AE.W;
  // Surge: the screen darkens, a band sweeps across with the character's face and the Art's name
  const surge0 = AE.Battle.prototype.doSurge;
  AE.Battle.prototype.doSurge = async function (u, id, targets) {
    const L = AE.SURGES[id];
    if (L && u.side === 'party') { this.cutin = { id: u.id, name: L.name, t: 0 }; AE.Sfx && AE.Sfx.play('surge'); await AE.wait(56); this.cutin = null; }
    return surge0.apply(this, arguments);
  };
  // Echo: a summoning circle opens, light pours down, the creature descends with a shock wave
  const echo0 = AE.Battle.prototype.doEcho;
  AE.Battle.prototype.doEcho = async function (u, id, targets, act) {
    const E = AE.ECHOES[id];
    if (E && u.mp >= E.mp) { this.summon = { t: 0, name: E.name }; await AE.wait(70); this.summon = null; this.shakeT = 14; }
    return echo0.apply(this, arguments);
  };
  const draw0 = AE.Battle.prototype.draw;
  AE.Battle.prototype.draw = function (ctx) {
    draw0.call(this, ctx);
    const S = this.summon;
    if (S) {
      const t = ++S.t, k = Math.min(1, t / 20);
      ctx.fillStyle = 'rgba(0,0,10,' + 0.6 * k + ')'; ctx.fillRect(0, 0, W, 150);
      ctx.save(); ctx.translate(W / 2, 108); ctx.scale(1, 0.35); ctx.rotate(t * 0.05);
      ctx.strokeStyle = 'rgba(255,230,140,' + k + ')'; ctx.lineWidth = 2;
      for (const r of [50, 40]) { ctx.beginPath(); ctx.arc(0, 0, r * k, 0, 7); ctx.stroke(); }
      ctx.beginPath(); for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI * 4; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 46 * k, Math.sin(a) * 46 * k); } ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(W / 2 - 30, 0, W / 2 + 30, 0); g.addColorStop(0, 'rgba(255,240,180,0)'); g.addColorStop(0.5, 'rgba(255,240,180,' + 0.7 * k + ')'); g.addColorStop(1, 'rgba(255,240,180,0)');
      ctx.fillStyle = g; ctx.fillRect(W / 2 - 30, 0, 60, 110);
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + t * 0.02, r = 30 + ((t * 2 + i * 13) % 80); ctx.fillStyle = 'rgba(255,240,180,.7)'; ctx.fillRect(W / 2 + Math.cos(a) * r, 108 + Math.sin(a) * r * 0.35 - (t % 40), 2, 2); }
      ctx.restore();
      if (t > 10) AE.text(ctx, S.name, W / 2, 24, '#ffe080', { align: 'center' });
    }
    const C = this.cutin;
    if (C) {
      const t = ++C.t, k = Math.min(1, t / 10), out = Math.max(0, (t - 44) / 12), y0 = 46;
      ctx.fillStyle = 'rgba(0,0,0,' + 0.5 * k * (1 - out) + ')'; ctx.fillRect(0, 0, W, 150);
      const bx = -W + (W + 0) * Math.min(1, t / 8) + out * W;
      ctx.save(); ctx.translate(bx, 0);
      const g = ctx.createLinearGradient(0, y0, 0, y0 + 50); g.addColorStop(0, '#ff60c0'); g.addColorStop(0.5, '#601848'); g.addColorStop(1, '#ff60c0');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, y0 + 6); ctx.lineTo(W, y0); ctx.lineTo(W, y0 + 44); ctx.lineTo(0, y0 + 50); ctx.fill();
      for (let i = 0; i < 12; i++) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(((i * 47 + t * 9) % (W + 40)) - 20, y0 + 6 + (i * 7) % 36, 18, 1); }   // speed lines
      ctx.save(); ctx.beginPath(); ctx.rect(14, y0 + 2, 70, 46); ctx.clip();
      const M = AE.MS && AE.MS[C.id], tall = (M && M.idle && M.idle.fy) || 28; AE.actor(ctx, C.id, 'idle', 2, 0, 48 + (1 - k) * 20, y0 + 50 + tall * 3 * 0.35, 3);
      ctx.restore();
      AE.text(ctx, C.name, 96, y0 + 19, '#fff');
      ctx.restore();
    }
  };
})();
