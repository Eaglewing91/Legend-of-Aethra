/* ================= More to do: Battle Square ranks, the roaming Weapons, snowboarding, the sub duel =================
   - Battle Square has ranks: C, B, A, S and Champion. Each rank's foes are tougher and its tokens bigger; clear a
     rank's five fights to open the next.
   - After the Sundering three Weapons roam the world: the Tide Weapon in the seas, the Dune Weapon in the Sunscar
     desert, the Storm Weapon in the sky (only the airship can reach it). They show on the map; touch one to fight.
   - Frostgate's slope keeper runs a snowboard course; Saltmere's harbour has a submarine duel. */
(function () {
  const E = AE.E, EV = AE.EV, sayAs = function (n, t) { return AE.say(t, { name: n }); };
  // ---------- Battle Square ranks ----------
  const RANKS = [['C', 1, 0, 100], ['B', 2.4, 1, 500], ['A', 5, 2, 2000], ['S', 10, 3, 6000], ['Champion', 18, 4, 15000]];
  AE.arena = async function () {
    const S = AE.S_; S.arenaRank = S.arenaRank || 0;
    const open = RANKS.slice(0, Math.min(RANKS.length, S.arenaRank + 1));
    const r = await AE.ask('Battle Square. Five fights in a row; each win pays tokens. Which rank?', open.map(function (R) { return R[0] + ' rank (' + AE.fmt(R[3]) + ' Gil)'; }).concat(['Leave']), { name: 'ARENA MASTER', cancel: open.length });
    const R = open[r]; if (!R) return;
    if (!AE.pay(R[3])) { await sayAs('ARENA MASTER', AE.fmt(R[3]) + ' Gil to enter that rank.'); return; }
    const k = R[1]; let won = 0;
    for (let i = 0; i < 5; i++) {
      const sets = AE.ENC.arena.sets, form = sets[AE.rand(sets.length)];
      const foes = form.enemies.map(function (id) { const D = AE.ENEMIES[id]; return { id: id, hp: Math.round(D.hp * k), maxhp: Math.round(D.hp * k), atk: Math.round(D.atk * (1 + (k - 1) * 0.35)), mag: Math.round(D.mag * (1 + (k - 1) * 0.35)), def: Math.round(D.def * (1 + (k - 1) * 0.2)), lv: D.lv + R[2] * 12 }; });
      const res = await AE.startBattle({ enemies: foes, bg: 'ruins', noRun: 1, noBack: 1 }, { canLose: 1 });
      if (res !== 'win') break; won++;
      const pay = [20, 40, 80, 160, 320][i] * (1 + R[2] * 2); AE.tokens(pay); await AE.notice('Win ' + won + '! +' + pay + ' tokens');
      if (i < 4) { const c = await AE.ask('Keep going?', ['Next fight', 'Quit while ahead'], { name: 'ARENA MASTER', cancel: 1 }); if (c !== 0) break; }
    }
    AE.healAll();
    if (won >= 5) {
      if (R[2] === S.arenaRank && S.arenaRank < RANKS.length - 1) { S.arenaRank++; await sayAs('ARENA MASTER', R[0] + ' rank cleared! ' + RANKS[S.arenaRank][0] + ' rank is open to you now.'); }
      const prize = ['champion_belt', 'prism:counter', 'prism:quick', 'ribbon', 'megalixir'][R[2]];
      const f = 'arena_' + R[0]; if (!S.flags[f]) { S.flags[f] = 1; try { await AE.gain(prize); } catch (e) { await AE.gain('megalixir'); } }
      if (R[2] === 4) await sayAs('ARENA MASTER', 'Champion of the Battle Square. They will sing about this one.');
    } else await sayAs('ARENA MASTER', 'You won ' + won + ' fight' + (won === 1 ? '' : 's') + '. Come again!');
  };
  // ---------- the Weapons ----------
  E('w_tide', 'Tide Weapon', 82, 520000, 260, 160, 240, 170, 58, 90000, 3000, 80000, { mon: 'GreenOctopus', k: 6, hue: 160, bright: 0.8 }, { boss: 1, weak: ['bolt'], absorb: ['water'], ai: [[3, 'attack'], [2, 'blizzard'], [1, 'v_count']] });
  E('w_dune', 'Dune Weapon', 84, 600000, 290, 190, 200, 150, 54, 95000, 3000, 90000, { mon: 'GreyTrex', k: 6, hue: 20, bright: 0.85 }, { boss: 1, weak: ['ice', 'water'], absorb: ['fire'], ai: [[3, 'attack'], [2, 'ic_inferno'], [1, 'flare_beam']] });
  E('w_storm', 'Storm Weapon', 88, 700000, 280, 170, 280, 190, 70, 120000, 4000, 100000, { mon: 'Dragon', k: 6, hue: 220, bright: 0.9 }, { boss: 1, weak: ['quake'], absorb: ['bolt', 'wind'], ai: [[3, 'thunderhead'], [2, 'attack'], [1, 'v_count']] });
  AE.WEAPONS_ROAM = {
    w_tide: { name: 'Tide Weapon', sea: 1, path: [[140, 60], [180, 70], [200, 110], [150, 100], [110, 150], [60, 170], [40, 110], [90, 50]], v: 0.04, art: 'GreenOctopus', hue: 160, prize: 'prism:hp_plus' },
    w_dune: { name: 'Dune Weapon', path: [[186, 150], [200, 140], [215, 150], [205, 165], [190, 166], [180, 158]], v: 0.03, art: 'GreyTrex', hue: 20, prize: 'megalixir' },
    w_storm: { name: 'Storm Weapon', sky: 1, path: [[60, 40], [140, 60], [220, 40], [240, 120], [170, 180], [60, 150]], v: 0.07, art: 'Dragon', hue: 220, prize: 'ribbon' },
  };
  AE.weaponPos = function (id, t) {
    const W = AE.WEAPONS_ROAM[id], P = W.path, L = []; let tot = 0;
    for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], d = Math.hypot(b[0] - a[0], b[1] - a[1]); L.push(d); tot += d; }
    let s = (t * W.v) % tot;
    for (let i = 0; i < P.length; i++) { if (s <= L[i]) { const a = P[i], b = P[(i + 1) % P.length], k = s / L[i]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; } s -= L[i]; }
    return P[0];
  };
  const active = function () { const S = AE.S_; return S.chapter >= 5 ? Object.keys(AE.WEAPONS_ROAM).filter(function (k) { return !S.flags['beat_' + k]; }) : []; };
  const wupd = AE.World.prototype.update;
  AE.World.prototype.update = function (g) {
    const r = wupd.apply(this, arguments);
    if (this.busy) return r;
    const S = AE.S_, t = S.time * 60, self = this;
    for (const id of active()) {
      const W = AE.WEAPONS_ROAM[id], p = AE.weaponPos(id, t), air = this.v === 'airship';
      if (!!W.sky !== air) continue;
      if (Math.hypot(p[0] - this.x, p[1] - this.y) < 1.6) {
        this.busy = true;
        (async function () {
          await AE.say('The ' + W.name + ' turns towards you. The air goes still.');
          const res = await AE.startBattle({ enemies: [id], bg: W.sky ? 'sky' : W.sea ? 'sea' : 'desert', boss: 1, noRun: 0, noBack: 1 }, { canLose: 1 });
          if (res === 'win') { S.flags['beat_' + id] = 1; await AE.notice('The ' + W.name + ' falls.'); if (W.prize) await AE.gain(W.prize); }
          // step back so it does not catch you again at once
          self.x -= Math.sin(self.ang) * 3; self.y += Math.cos(self.ang) * 3; self.busy = false; if (AE.Music) AE.Music.play(self.v === 'airship' ? 'airship' : 'world');
        })();
        break;
      }
    }
    return r;
  };
  const wdraw = AE.World.prototype.draw;
  AE.World.prototype.draw = function (ctx) {
    wdraw.apply(this, arguments);
    if (!this._proj) return;
    const t = AE.S_.time * 60, self = this;
    active().forEach(function (id) {
      const W = AE.WEAPONS_ROAM[id], p = AE.weaponPos(id, t), q = self._proj(p[0], p[1], W.sky ? 22 : W.sea ? 1 : 3);
      if (!q || q.d > 700) return;
      const k = Math.min(5, q.k * 9), im = AE.IMG['mon_' + W.art]; if (!im) return;
      const fr = Math.floor(self.t / 10) % 4, bob = Math.sin(self.t * 0.05) * 3;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(q.x, q.y - 8 * k + bob, 0, q.x, q.y - 8 * k + bob, 14 * k); g.addColorStop(0, 'rgba(255,60,60,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(q.x - 14 * k, q.y - 22 * k + bob, 28 * k, 28 * k); ctx.restore();
      AE.blit(ctx, im, 0, fr * 16, 16, 16, q.x - 8 * k, q.y - 16 * k + bob, 16 * k, 16 * k, { filter: 'hue-rotate(' + W.hue + 'deg) brightness(.85)' });
    });
    if (this.mini === 2) return;
    // on the minimap
    if (this.mini) {
      const mw = 64, mh = 48, X0 = AE.W - mw - 6, Y0 = AE.H - mh - 6;
      active().forEach(function (id) { const p = AE.weaponPos(id, t); ctx.fillStyle = AE.game.frame % 20 < 10 ? '#ff2020' : '#600'; ctx.fillRect(X0 + p[0] / AE.WORLD.w * mw - 1, Y0 + p[1] / AE.WORLD.h * mh - 1, 2, 2); });
    }
  };
  // ---------- Frostgate: the snowboard course ----------
  AE.snowboard = async function () {
    const r = await AE.ask('Down the north slope? Dodge the pines, ride through the flags. 50 Gil.', ['Ride', 'Not now'], { name: 'SLOPE KEEPER', cancel: 1 });
    if (r !== 0) return; if (!AE.pay(50)) { await sayAs('SLOPE KEEPER', 'Fifty Gil for the board.'); return; }
    const objs = []; for (let i = 0; i < 70; i++) objs.push({ z: 30 + i * 9 + Math.random() * 6, x: Math.random() * 2 - 1, k: Math.random() < 0.3 ? 'flag' : 'tree', hit: 0 });
    const score = await AE.miniScene({
      x: 0, vx: 0, z: 0, sp: 1.6, pts: 0, crash: 0,
      update: function (g) {
        this.t++; const I = g.input;
        if (I.held.left) this.vx -= 0.006; if (I.held.right) this.vx += 0.006; this.vx *= 0.9; this.x = Math.max(-1.1, Math.min(1.1, this.x + this.vx));
        if (this.crash > 0) this.crash--; else this.sp = Math.min(3.2, this.sp + 0.004);
        this.z += this.sp * 0.2;
        for (const o of objs) { const d = o.z - this.z; if (!o.hit && d < 0.6 && d > -0.6 && Math.abs(o.x - this.x) < (o.k === 'tree' ? 0.16 : 0.2)) { o.hit = 1; if (o.k === 'flag') { this.pts += 10; AE.Sfx.play('coin'); } else { this.sp = 0.8; this.crash = 30; this.pts = Math.max(0, this.pts - 5); AE.Sfx.play('hit'); } } }
        if (this.z > objs[objs.length - 1].z + 4) AE.miniEnd(this, this.pts);
      },
      draw: function (ctx) {
        const W = AE.W, H = AE.H, hz = 60;
        const g = ctx.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, '#6a8ad0'); g.addColorStop(1, '#d8e6f8'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, hz);
        ctx.fillStyle = '#a8b8d0'; for (let x = 0; x < W; x += 4) { const h = 10 + Math.abs(Math.sin(x * 0.05) * 14) + Math.sin(x * 0.13) * 4; ctx.fillRect(x, hz - h, 4, h); }
        for (let y = hz; y < H; y++) { const z = 40 / (y - hz + 1), c = 230 - Math.min(40, z * 3) + ((Math.floor(this.z + z) % 2) ? 6 : 0); ctx.fillStyle = 'rgb(' + c + ',' + (c + 6) + ',' + (c + 18) + ')'; ctx.fillRect(0, y, W, 1); }
        const self = this;
        objs.filter(function (o) { return o.z > self.z + 0.2 && o.z < self.z + 40; }).sort(function (a, b) { return b.z - a.z; }).forEach(function (o) {
          const d = o.z - self.z, y = hz + 40 / d * 4, s = 30 / d, x = W / 2 + (o.x - self.x) * 160 / d * 1.4;
          if (o.k === 'tree') { ctx.fillStyle = '#2a4a3a'; ctx.beginPath(); ctx.moveTo(x - s * 1.2, y); ctx.lineTo(x, y - s * 4); ctx.lineTo(x + s * 1.2, y); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x - s * 0.5, y - s * 2.6); ctx.lineTo(x, y - s * 4); ctx.lineTo(x + s * 0.5, y - s * 2.6); ctx.fill(); }
          else if (!o.hit) { ctx.fillStyle = '#c03030'; ctx.fillRect(x, y - s * 3, Math.max(1, s * 0.25), s * 3); ctx.fillRect(x, y - s * 3, s * 1.4, s * 0.9); }
        });
        // the rider
        const px = W / 2, py = H - 30, lean = this.vx * 60;
        ctx.save(); ctx.translate(px, py); ctx.rotate(lean * 0.05 + (this.crash ? Math.sin(this.t) * 0.4 : 0));
        ctx.fillStyle = '#3060c0'; ctx.fillRect(-14, 0, 28, 4); AE.actor(ctx, AE.S_.party[0], 'idle', 0, 0, 0, 0, 1); ctx.restore();
        AE.text(ctx, 'Score ' + this.pts, 8, 6, '#203050'); AE.text(ctx, 'Speed ' + Math.round(this.sp * 30), W - 8, 6, '#203050', { align: 'right' });
      }
    });
    AE.tokens(score); const S = AE.S_; S.bestSnow = Math.max(S.bestSnow || 0, score);
    await sayAs('SLOPE KEEPER', score + ' points! That\'s ' + score + ' tokens for the Gilded Spire.' + (score >= 200 && !S.flags.snow200 ? ' And a champion\'s prize!' : ''));
    if (score >= 200 && !S.flags.snow200) { S.flags.snow200 = 1; await AE.gain('prism:speed_plus'); }
  };
  // ---------- Saltmere: the submarine duel ----------
  AE.subduel = async function () {
    const r = await AE.ask('Training duel in the harbour subs: sink four targets before they sink you. Free for Wardens.', ['Dive', 'Not now'], { name: 'SUB CAPTAIN', cancel: 1 });
    if (r !== 0) return;
    const res = await AE.miniScene({
      x: 128, y: 190, hp: 3, foes: [0, 1, 2, 3].map(function (i) { return { x: 30 + i * 60, y: 40 + (i % 2) * 30, v: (i % 2 ? 1 : -1) * (0.6 + i * 0.15), hp: 2, cd: 60 + i * 30 }; }), shots: [], their: [], cd: 0,
      update: function (g) {
        this.t++; const I = g.input, self = this;
        if (I.held.left) this.x -= 1.6; if (I.held.right) this.x += 1.6; if (I.held.up) this.y -= 1; if (I.held.down) this.y += 1;
        this.x = Math.max(12, Math.min(244, this.x)); this.y = Math.max(120, Math.min(210, this.y));
        if (this.cd > 0) this.cd--; if (I.pressed.ok && this.cd === 0) { this.shots.push({ x: this.x, y: this.y - 8 }); this.cd = 18; AE.Sfx.play('shot'); }
        this.shots.forEach(function (s) { s.y -= 3; }); this.their.forEach(function (s) { s.y += 1.6; s.x += (self.x - s.x) * 0.004; });
        this.foes.forEach(function (f) { if (f.hp <= 0) return; f.x += f.v; if (f.x < 14 || f.x > 242) f.v = -f.v; if (--f.cd <= 0) { self.their.push({ x: f.x, y: f.y + 8 }); f.cd = 70 + AE.rand(60); } });
        this.shots = this.shots.filter(function (s) { for (const f of self.foes) if (f.hp > 0 && Math.abs(s.x - f.x) < 12 && Math.abs(s.y - f.y) < 6) { f.hp--; AE.Sfx.play('hit'); return false; } return s.y > -10; });
        this.their = this.their.filter(function (s) { if (Math.abs(s.x - self.x) < 10 && Math.abs(s.y - self.y) < 6) { self.hp--; AE.Sfx.play('hurt'); return false; } return s.y < 230; });
        if (this.hp <= 0) AE.miniEnd(this, 0); if (this.foes.every(function (f) { return f.hp <= 0; })) AE.miniEnd(this, 1);
      },
      draw: function (ctx) {
        const W = AE.W, H = AE.H, g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1a5a8a'); g.addColorStop(1, '#06203a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(200,240,255,.3)'; for (let i = 0; i < 20; i++) ctx.fillRect((i * 53 + this.t * 0.3) % W, (H - (this.t * 0.5 + i * 41) % H), 2, 2);
        const sub = function (x, y, col, flip) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, 12, 4, 0, 0, 7); ctx.fill(); ctx.fillRect(x - 3, y - 8 * (flip ? -1 : 1) - (flip ? 0 : 0), 6, 4); };
        this.foes.forEach(function (f) { if (f.hp > 0) sub(f.x, f.y, '#a04040', true); });
        sub(this.x, this.y, '#d0b040', false);
        ctx.fillStyle = '#ffe080'; this.shots.forEach(function (s) { ctx.fillRect(s.x - 1, s.y - 3, 2, 6); });
        ctx.fillStyle = '#ff6060'; this.their.forEach(function (s) { ctx.fillRect(s.x - 1, s.y - 3, 2, 6); });
        AE.text(ctx, 'Hull ' + '#'.repeat(Math.max(0, this.hp)), 8, 6, '#fff'); AE.text(ctx, 'Targets ' + this.foes.filter(function (f) { return f.hp > 0; }).length, W - 8, 6, '#fff', { align: 'right' });
      }
    });
    const S = AE.S_;
    if (res) { AE.tokens(150); await sayAs('SUB CAPTAIN', 'All four sunk! 150 tokens, and the harbour salutes you.'); if (!S.flags.subwin) { S.flags.subwin = 1; await AE.gain('megalixir'); } }
    else await sayAs('SUB CAPTAIN', 'Sunk! Happens to the best of us. Try again.');
  };
  EV.mg_snow = function () { return AE.snowboard(); };
  EV.mg_sub = function () { return AE.subduel(); };
})();
