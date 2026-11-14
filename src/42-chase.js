/* ================= Set piece: the Freight Nine chase (end of Act I) =================
   Aurex skimmer-bikes chase the train out of Halcyon. Kael rides the coal tender's side rail on a stolen skimmer:
   left/right/up/down to move, OK to swing. Bikes that reach the train scrape its armour. Keep the train going for
   the whole run. Retry if the train is stopped (no game over). */
AE.chase = function (o) {
  o = o || {};
  return AE.miniScene({
    dur: (o.secs || 70) * 60 * (AE.S_ && AE.S_.flags.chase_easy ? 0.75 : 1), hp: 100, x: 176, y: 150, bikes: [], spawn: 60, score: 0, swing: 0, hitT: 0, scroll: 0, done2: false,
    update: function (g) {
      const I = g.input; this.t++; this.scroll = (this.scroll + 6) % 32;
      if (this.done2) { if (this.t - this.endT > 90 || (this.t - this.endT > 30 && I.pressed.ok)) AE.miniEnd(this, this.result); return; }
      // the rider
      const sp = 2.2;
      if (I.held.left) this.x -= sp; if (I.held.right) this.x += sp; if (I.held.up) this.y -= sp * 0.8; if (I.held.down) this.y += sp * 0.8;
      this.x = AE.clamp(this.x, 108, 228); this.y = AE.clamp(this.y, 40, 200);
      if (this.swing > 0) this.swing--;
      if (this.hitT > 0) this.hitT--;
      if (I.pressed.ok && this.swing <= 0) {
        this.swing = 16; AE.Sfx.play('slash');
        this.bikes.forEach(function (b) { if (!b.dead && Math.abs(b.x - this.x) < 26 && Math.abs(b.y - this.y) < 22) { b.hp--; b.kx = (b.x < this.x ? -1 : 1) * 4; AE.Sfx.play('hit'); if (b.hp <= 0) { b.dead = 40; this.score++; AE.Sfx.play('die'); } } }, this);
      }
      // bikes: come up from behind, pick a target (the train or Kael), ram
      if (--this.spawn <= 0) {
        const late = this.t / this.dur; this.spawn = Math.max(28, 90 - late * 60) + AE.rand(30);
        const heavy = late > 0.5 && Math.random() < 0.3;
        this.bikes.push({ x: 112 + AE.rand(4) * 34, y: 236, hp: heavy ? 3 : 1, heavy: heavy, kx: 0, tgt: Math.random() < 0.7 ? 'train' : 'kael', atk: 0 });
      }
      this.bikes.forEach(function (b) {
        if (b.dead) { b.dead--; b.y += 3; b.x += b.kx; return; }
        b.x += b.kx; b.kx *= 0.85;
        const tx = b.tgt === 'train' ? 112 : this.x, ty = b.tgt === 'train' ? 60 + (b.y % 120) : this.y + 4;
        b.y += (ty < b.y ? -1.3 : 0.6) * (b.heavy ? 0.8 : 1);
        b.x += AE.clamp(tx - b.x, -1.4, 1.4);
        if (b.tgt === 'train' && b.x < 120 && b.y < 190) { if (++b.atk % 45 === 0) { this.hp -= (b.heavy ? 4 : 2) * (AE.S_ && AE.S_.flags.chase_easy ? 0.6 : 1); AE.Sfx.play('shot'); this.shake = 6; } }
        if (b.tgt === 'kael' && Math.abs(b.x - this.x) < 14 && Math.abs(b.y - this.y) < 12 && this.hitT <= 0) { this.hitT = 40; this.x += b.x < this.x ? 14 : -14; this.hp -= 2; AE.Sfx.play('hit'); }
      }, this);
      this.bikes = this.bikes.filter(function (b) { return (b.dead === undefined || b.dead > 0) && b.y > -30; });
      if (this.shake) this.shake--;
      if (this.hp <= 0) { this.done2 = true; this.result = 'fail'; this.endT = this.t; AE.Sfx.play('buzz'); }
      else if (this.t >= this.dur) { this.done2 = true; this.result = 'win'; this.endT = this.t; AE.Sfx.play('save'); }
    },
    draw: function (ctx) {
      const sx = this.shake ? AE.rand(3) - 1 : 0;
      ctx.fillStyle = '#4a4038'; ctx.fillRect(0, 0, AE.W, AE.H);                       // ash plain
      ctx.fillStyle = '#5a5048'; for (let y = -32 + this.scroll; y < AE.H; y += 32) ctx.fillRect(0, y, 12, 6);
      ctx.fillStyle = '#2e2c30'; ctx.fillRect(100, 0, 140, AE.H);                       // the service road beside the rails
      ctx.fillStyle = '#c8b060'; for (let y = -32 + this.scroll * 2 % 32; y < AE.H; y += 32) { ctx.fillRect(146, y, 2, 14); ctx.fillRect(180, y, 2, 14); ctx.fillRect(214, y, 2, 14); }
      // the train: rails and Freight Nine
      ctx.fillStyle = '#3a3634'; ctx.fillRect(30 + sx, 0, 56, AE.H); ctx.fillStyle = '#6a625c'; for (let y = -16 + this.scroll; y < AE.H; y += 16) ctx.fillRect(30 + sx, y, 56, 3);
      for (let k = 0; k < 4; k++) { const y = 10 + k * 54; ctx.fillStyle = k === 0 ? '#5a2a20' : '#3a4a5a'; ctx.fillRect(38 + sx, y, 40, 48); ctx.fillStyle = '#222'; ctx.fillRect(42 + sx, y + 6, 32, 6); }
      ctx.fillStyle = 'rgba(200,200,210,.35)'; for (let i = 0; i < 5; i++) { const r = (this.t * 2 + i * 23) % 60; ctx.beginPath(); ctx.arc(58 + sx + Math.sin(i + this.t / 20) * 6, 8 - r * 0.3, 4 + r / 8, 0, 7); ctx.fill(); }
      // bikes
      const im = AE.IMG.mon_Eye2;
      this.bikes.forEach(function (b) {
        ctx.globalAlpha = b.dead ? b.dead / 40 : 1;
        ctx.fillStyle = b.heavy ? '#8a3a2a' : '#5a6a7a'; ctx.fillRect(b.x - 9, b.y - 4, 18, 12); ctx.fillStyle = '#ffd060'; ctx.fillRect(b.x - 2, b.y - 6, 4, 3);
        AE.actor(ctx, b.heavy ? 'officer' : 'trooper', 'idle', 0, 0, b.x, b.y + 2, 0.6);
        ctx.globalAlpha = 1;
      });
      // Kael on the skimmer
      ctx.fillStyle = '#c0a040'; ctx.fillRect(this.x - 10, this.y - 4, 20, 13); ctx.fillStyle = '#80e0ff'; ctx.fillRect(this.x - 8, this.y + 8, 16, 2);
      if (!(this.hitT > 0 && this.hitT % 6 < 3)) AE.actor(ctx, 'kael', this.swing > 8 ? 'run' : 'idle', 0, Math.floor(this.t / 6), this.x, this.y + 2, 0.6);
      if (this.swing > 8) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(this.x, this.y - 6, 18, Math.PI * (1 + (16 - this.swing) / 8), Math.PI * (1.5 + (16 - this.swing) / 8)); ctx.stroke(); ctx.lineWidth = 1; }
      // HUD
      AE.window(ctx, 4, 4, 92, 30); AE.text(ctx, 'FREIGHT NINE', 10, 8, '#ffe080');
      ctx.fillStyle = '#300'; ctx.fillRect(10, 22, 78, 6); ctx.fillStyle = this.hp > 30 ? '#4c4' : '#e44'; ctx.fillRect(10, 22, Math.max(0, 78 * this.hp / 100), 6);
      const left = Math.max(0, Math.ceil((this.dur - this.t) / 60)); AE.window(ctx, AE.W - 70, 4, 66, 30);
      AE.text(ctx, left + 's', AE.W - 37, 8, '#fff', { align: 'center' }); AE.text(ctx, 'KO ' + this.score, AE.W - 37, 20, '#8cf', { align: 'center' });
      if (this.t < 120) { AE.window(ctx, 44, 92, 168, 40); AE.text(ctx, 'Keep the bikes off the train!', AE.W / 2, 98, '#fff', { align: 'center' }); AE.text(ctx, 'Arrows move · Z/OK to swing', AE.W / 2, 114, '#cde', { align: 'center' }); }
      if (this.done2) { AE.window(ctx, 40, 96, 176, 28); AE.text(ctx, this.result === 'win' ? 'Freight Nine breaks free!' : 'The train is stopped...', AE.W / 2, 104, '#fff', { align: 'center' }); }
    }
  });
};
