/* ================= Gilded Spire minigames: Talonbird races, slots, the shooting gallery, the Battle Square =================
   They pay in Spire Tokens (S.tokens), traded for prizes at the Spire Exchange. Every game is one keypress at a time. */
AE.tokens = function (n) { const S = AE.S_; S.tokens = Math.max(0, (S.tokens || 0) + (n || 0)); return S.tokens; };
AE.miniScene = function (o) { return new Promise(function (done) { o.done = done; o.kind = 'mini'; o.opaque = true; o.t = 0; AE.game.push(o); }); };
AE.miniEnd = function (o, v) { AE.game.pop(o); o.done(v); };

// ---------- Talonbird race: pick a bird, bet tokens, watch ----------
AE.race = async function () {
  const birds = [['Gold-Crest', 7, 50, 30], ['Bruiser', 4, 40, 70], ['Featherfall', 6, 60, 20], ['Old Biscuit', 2, 30, 90]].map(function (b) { return { name: b[0], spd: b[1] + Math.random() * 3, sta: b[2] + AE.rand(20), luck: b[3] }; });
  if (AE.S_.mybird) birds.push({ name: AE.S_.mybird.name + ' (yours)', spd: AE.S_.mybird.spd, sta: AE.S_.mybird.sta, luck: 50, mine: 1 });
  const odds = birds.map(function (b) { return Math.max(2, Math.round(20 / (b.spd + b.sta / 20))); });
  const pick = await AE.ask('Which bird?', birds.map(function (b, i) { return b.name + '  x' + odds[i]; }).concat(['Leave']), { name: 'BOOKIE', cancel: birds.length });
  if (pick >= birds.length) return;
  const have = AE.tokens(0), bets = [10, 50, 100].filter(function (v) { return v <= have; });
  let bet = 0;
  if (bets.length) { const r = await AE.ask('Bet how many tokens? (You have ' + have + ')', bets.map(String).concat(['Just watch']), { name: 'BOOKIE', cancel: bets.length }); bet = bets[r] || 0; }
  AE.tokens(-bet);
  const res = await AE.miniScene({
    pos: birds.map(function () { return 0; }), en: birds.map(function (b) { return b.sta; }), win: -1,
    update: function (g) {
      this.t++; if (this.t < 60) return;
      if (this.win < 0) birds.forEach(function (b, i) {
        let v = b.spd * 0.05 + Math.random() * 0.25; if (this.en[i] > 0) this.en[i] -= 0.4; else v *= 0.6;
        if (Math.random() * 100 < b.luck / 40) v += 0.5; if (g.input.held.ok && i === pick) v += 0.04;
        this.pos[i] += v; if (this.pos[i] >= 200 && this.win < 0) { this.win = i; this.wt = this.t; }
      }, this);
      if (this.win >= 0 && this.t - this.wt > 90) AE.miniEnd(this, this.win);
    },
    draw: function (ctx) {
      ctx.fillStyle = '#7ab04a'; ctx.fillRect(0, 0, AE.W, AE.H); ctx.fillStyle = '#c8a060';
      birds.forEach(function (b, i) { ctx.fillRect(0, 40 + i * 34, AE.W, 22); });
      ctx.fillStyle = '#fff'; ctx.fillRect(228, 34, 3, birds.length * 34);
      birds.forEach(function (b, i) {
        const x = 20 + this.pos[i], y = 40 + i * 34; const im = AE.IMG['mon_' + (i % 2 ? 'Owl' : 'Owl2')];
        if (im) AE.blit(ctx, im, 3 * 16, (Math.floor(this.t / 6 + i) % 4) * 16, 16, 16, x - 8, y - 6, 24, 24, { filter: 'hue-rotate(' + i * 60 + 'deg)' });
        AE.text(ctx, b.name, 4, y + 12, i === pick ? '#ffe080' : '#fff');
      }, this);
      AE.text(ctx, this.t < 60 ? 'Ready...' : this.win >= 0 ? birds[this.win].name + ' wins!' : 'Hold OK to cheer your bird!', AE.W / 2, 8, '#fff', { align: 'center' });
    }
  });
  if (res === pick) { const won = Math.max(bet * odds[pick], 5); AE.tokens(won); AE.Sfx.play('coin'); await AE.say('Your bird won! You get ' + won + ' tokens.', { name: 'BOOKIE' }); }
  else await AE.say(bet ? 'Better luck next time.' : 'Fun to watch, isn\'t it?', { name: 'BOOKIE' });
};

// ---------- slots: three reels, stop each with OK ----------
AE.SLOTSYM = ['7', 'B', 'C', 'Q', 'S', 'T'];
AE.slots = async function () {
  if (AE.tokens(0) < 3) { await AE.say('The slot machines take 3 tokens a spin. Win tokens at the races, or trade gold at the Exchange.'); return; }
  const r = await AE.ask('Spin for 3 tokens? (You have ' + AE.tokens(0) + ')', ['Spin', 'Leave'], { cancel: 1 }); if (r !== 0) return;
  AE.tokens(-3);
  const reels = [0, 1, 2].map(function () { return { i: AE.rand(6), stop: false, v: 0.35 + Math.random() * 0.2 }; });
  const out = await AE.miniScene({
    k: 0,
    update: function (g) {
      this.t++; reels.forEach(function (R) { if (!R.stop) R.i = (R.i + R.v) % 6; });
      if (g.input.pressed.ok && this.k < 3) { reels[this.k].stop = true; reels[this.k].i = Math.floor(reels[this.k].i); this.k++; AE.Sfx.play('ok'); if (this.k === 3) this.endT = this.t; }
      if (this.k === 3 && this.t - this.endT > 40) AE.miniEnd(this, reels.map(function (R) { return AE.SLOTSYM[Math.floor(R.i) % 6]; }));
    },
    draw: function (ctx) {
      ctx.fillStyle = '#300a14'; ctx.fillRect(0, 0, AE.W, AE.H); AE.window(ctx, 48, 60, 160, 90, { col: '#602020' });
      reels.forEach(function (R, i) { ctx.fillStyle = '#fff'; ctx.fillRect(62 + i * 46, 80, 38, 50); AE.text(ctx, AE.SLOTSYM[Math.floor(R.i) % 6], 81 + i * 46, 98, R.stop ? '#c02020' : '#202020', { align: 'center' }); });
      AE.text(ctx, 'Press OK to stop each reel', AE.W / 2, 170, '#ffe080', { align: 'center' });
    }
  });
  const pay = out[0] === out[1] && out[1] === out[2] ? (out[0] === '7' ? 200 : out[0] === 'B' ? 60 : 30) : (out[0] === out[1] || out[1] === out[2]) ? 4 : 0;
  if (pay) { AE.tokens(pay); AE.Sfx.play('coin'); await AE.notice(out.join(' ') + ' - won ' + pay + ' tokens!'); } else await AE.notice(out.join(' ') + ' - no luck.');
  if (out.join('') === '777' && !AE.S_.flags.slot777) { AE.S_.flags.slot777 = 1; await AE.gain('lucky_coin'); }
};

// ---------- shooting gallery: a target slides along; press OK when the sight is on it ----------
AE.gallery = async function () {
  if (AE.S_.gold < 50) { await AE.say('Fifty gold a round.', { name: 'GALLERY MAN' }); return; }
  const r = await AE.ask('Ten shots, 50 G. Hit eight for a prize!', ['Shoot', 'Leave'], { name: 'GALLERY MAN', cancel: 1 }); if (r !== 0) return;
  AE.S_.gold -= 50;
  const hits = await AE.miniScene({
    shot: 0, hit: 0, x: 0, v: 2.2, flash: 0,
    update: function (g) {
      this.t++; this.x += this.v; if (this.x < 10 || this.x > AE.W - 26) this.v = -this.v;
      if (this.flash) this.flash--;
      if (g.input.pressed.ok && this.shot < 10) { this.shot++; const on = Math.abs(this.x + 8 - AE.W / 2) < 9; if (on) { this.hit++; AE.Sfx.play('hit'); this.flash = 10; } else AE.Sfx.play('shot'); this.v = (Math.random() < 0.5 ? -1 : 1) * (2 + this.shot * 0.35); }
      if (this.shot >= 10 && !this.endT) this.endT = this.t; if (this.endT && this.t - this.endT > 40) AE.miniEnd(this, this.hit);
    },
    draw: function (ctx) {
      ctx.fillStyle = '#3a2614'; ctx.fillRect(0, 0, AE.W, AE.H); ctx.fillStyle = '#5a3a1e'; ctx.fillRect(0, 90, AE.W, 30);
      const im = AE.IMG.mon_Eye; if (im) AE.blit(ctx, im, 0, 0, 16, 16, this.x, 96, 16, 16, { filter: this.flash ? 'brightness(3)' : undefined });
      ctx.strokeStyle = '#ff4040'; ctx.strokeRect(AE.W / 2 - 9, 92, 18, 26); ctx.beginPath(); ctx.moveTo(AE.W / 2, 86); ctx.lineTo(AE.W / 2, 124); ctx.stroke();
      AE.text(ctx, 'Shots ' + this.shot + '/10   Hits ' + this.hit, AE.W / 2, 150, '#fff', { align: 'center' });
    }
  });
  const prize = hits >= 10 ? 'prism:long_range' : hits >= 8 ? 'hi_potion' : null;
  if (hits >= 8) { AE.tokens(hits * 5); await AE.say(hits + ' hits! A sharpshooter. Here\'s your prize and ' + hits * 5 + ' tokens.', { name: 'GALLERY MAN' }); if (prize === 'prism:long_range' && AE.S_.flags.gal10) await AE.gain('hi_potion', 2); else { if (hits >= 10) AE.S_.flags.gal10 = 1; await AE.gain(prize); } }
  else await AE.say(hits + ' hits. Not bad. Not good, either.', { name: 'GALLERY MAN' });
};

// ---------- Battle Square: fights in a row; tokens grow with the streak ----------
AE.arena = async function () {
  const r = await AE.ask('Up to five fights in a row. Each win pays more tokens. Lose, and you keep what you won. 100 G to enter.', ['Fight', 'Leave'], { name: 'ARENA MASTER', cancel: 1 });
  if (r !== 0) return; if (!AE.pay(100)) { await AE.say('100 G, please.', { name: 'ARENA MASTER' }); return; }
  let won = 0;
  for (let k = 0; k < 5; k++) {
    const sets = AE.ENC.arena.sets; const form = sets[AE.rand(sets.length)];
    const res = await AE.startBattle({ enemies: form.enemies, bg: 'ruins', noRun: 1 }, { canLose: 1 });
    if (res !== 'win') break; won++; const pay = [20, 40, 80, 160, 320][k]; AE.tokens(pay); await AE.notice('Win ' + won + '! +' + pay + ' tokens');
    if (k < 4) { const c = await AE.ask('Keep going?', ['Next fight', 'Quit while ahead'], { name: 'ARENA MASTER', cancel: 1 }); if (c !== 0) break; }
  }
  AE.healAll();
  await AE.say(won >= 5 ? 'Five straight! The Square salutes you.' : 'You won ' + won + ' fight' + (won === 1 ? '' : 's') + '. Come again!', { name: 'ARENA MASTER' });
  if (won >= 5 && !AE.S_.flags.arena5) { AE.S_.flags.arena5 = 1; await AE.gain('champion_belt'); }
};

// ---------- the Exchange ----------
AE.EXCHANGE = [['elixir', 400], ['cat_bell', 800], ['card:c_sylphine', 1500], ['prism:exp_plus', 2000], ['megalixir', 2400], ['sprint_shoes', 3000], ['prism:gold_plus', 4000], ['lucky_coin', 5000], ['ribbon', 9999]];
AE.exchange = async function () {
  const r = await AE.ask('Tokens: ' + AE.tokens(0) + '. Buy tokens (10 G each) or trade them for prizes?', ['Buy 50 tokens (500 G)', 'Prizes', 'Leave'], { name: 'EXCHANGER', cancel: 2 });
  if (r === 0) { if (AE.pay(500)) { AE.tokens(50); AE.Sfx.play('coin'); } else await AE.say('Not enough gold.'); return; }
  if (r !== 1) return;
  const c = await AE.ask('Prizes (you have ' + AE.tokens(0) + ' tokens):', AE.EXCHANGE.map(function (p) { return AE.itemName(p[0]) + ' - ' + p[1]; }).concat(['Back']), { name: 'EXCHANGER', cancel: AE.EXCHANGE.length });
  const P = AE.EXCHANGE[c]; if (!P) return;
  if (AE.tokens(0) < P[1]) { await AE.say('Not enough tokens.', { name: 'EXCHANGER' }); return; }
  AE.tokens(-P[1]); await AE.gain(P[0]);
};
