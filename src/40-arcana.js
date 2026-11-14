/* ================= Arcana: the card game =================
   Five cards a side on a 3 x 3 board. Each card has four ranks (top, right, bottom, left; 1-9 and A = 10).
   Place a card next to an opponent's: where your touching rank is higher, their card flips to your colour.
   Rules some players use: Same (two or more touching sides equal -> those flip, and chain), Elemental (board squares
   with an element: matching cards +1, others -1). The winner takes one card from the loser's hand. */
AE.CARDS = {};
AE.CARD = function (id, name, lv, n, art, elem) { AE.CARDS[id] = { name: name, lv: lv, n: n, art: art, elem: elem || null }; };
(function () {
  const C = AE.CARD, m = function (k, o) { return Object.assign({ mon: k }, o || {}); }, c = function (k, o) { return Object.assign({ cast: k }, o || {}); }, b = function (k, o) { return Object.assign({ boss: k }, o || {}); };
  // level 1
  C('c_rat', 'Pipe Rat', 1, [1, 4, 1, 5], m('Mouse'));
  C('c_slime', 'Flow Slime', 1, [5, 1, 1, 3], m('Slime2', { hue: 110 }), 'water');
  C('c_drone', 'Sentry Drone', 1, [1, 3, 3, 5], m('Eye', { hue: 170 }), 'bolt');
  C('c_trooper', 'Aurex Trooper', 1, [6, 1, 1, 2], c('trooper'));
  C('c_hawk', 'Girder Hawk', 1, [2, 3, 1, 5], m('Owl2'), 'wind');
  C('c_crawler', 'Coil Crawler', 1, [2, 1, 4, 4], m('SpiderYellow'), 'bolt');
  C('c_bat', 'Cave Bat', 1, [1, 5, 4, 1], m('BlueBat'));
  C('c_larva', 'Bloat Larva', 1, [3, 1, 3, 5], m('Larva2'), 'poison');
  // level 2
  C('c_sumprat', 'Sump Rat', 2, [6, 1, 4, 3], m('MouseBlack'));
  C('c_sludge', 'Sludge', 2, [2, 3, 1, 7], m('Slime3', { hue: 40 }), 'poison');
  C('c_eel', 'Drain Eel', 2, [2, 1, 6, 6], m('Snake2', { hue: 190 }), 'water');
  C('c_rotcap', 'Rotcap', 2, [5, 4, 3, 3], m('Mushroom2'));
  C('c_wisp', 'Spark Wisp', 2, [6, 2, 2, 5], m('Spirit', { hue: 60 }), 'bolt');
  C('c_gunner', 'Aurex Gunner', 2, [3, 6, 2, 4], c('gunner'));
  // level 3
  C('c_rivet', 'Rivet Drone', 3, [5, 3, 1, 7], m('Eye2', { hue: 30 }));
  C('c_imp', 'Scaffold Imp', 3, [6, 6, 3, 2], m('KappaRed'));
  C('c_heavy', 'Heavy Trooper', 3, [3, 5, 7, 2], c('officer', { hue: 200 }));
  C('c_hound', 'Guard Hound', 3, [7, 3, 1, 6], m('Beast'));
  C('c_drake', 'Arena Drake', 3, [5, 2, 6, 4], m('Lizard2'), 'fire');
  // level 4
  C('c_specimen', 'Lab Specimen', 4, [7, 5, 1, 7], m('Beast2', { hue: 260 }));
  C('c_failed', 'Failed Vessel', 4, [4, 7, 5, 4], m('Spirit2', { hue: 200 }), 'dark');
  C('c_arcanist', 'Aurex Arcanist', 4, [2, 6, 7, 5], c('tech'), 'fire');
  C('c_ogre', 'Ogre Twin', 4, [7, 4, 6, 3], m('Cyclope2'), 'earth');
  C('c_golem', 'Scrap Golem', 4, [6, 2, 7, 5], m('Cyclope', { sat: 0.3 }), 'earth');
  // level 5 (bosses of Act I)
  C('c_bulwark', 'Bulwark', 5, [7, 6, 2, 7], b('GiantBlueSamurai', { fw: 48, fh: 48, sat: 0.25 }), 'bolt');
  C('c_rustback', 'Rustback', 5, [3, 7, 7, 5], m('SpiderRed'), 'bolt');
  C('c_leviathan', 'Sump Leviathan', 5, [6, 3, 7, 6], b('SquidGreen', { fw: 76, fh: 79 }), 'water');
  // level 6-7
  C('c_brute', 'Scaffold Brute', 6, [8, 3, 6, 7], b('DemonCyclop2', { fw: 50, fh: 50 }));
  C('c_gorr', 'Gorr', 6, [5, 8, 7, 4], b('DemonCyclop', { fw: 50, fh: 50 }), 'earth');
  C('c_h0', 'Specimen H-0', 7, [8, 6, 7, 5], b('GiantSpirit', { fw: 50, fh: 50, hue: 230 }), 'dark');
  C('c_jugg', 'Iron Juggernaut', 7, [6, 8, 5, 8], b('GiantRedSamurai', { fw: 48, fh: 48, sat: 0.2 }), 'fire');
  // level 8-10 (people)
  C('c_bram', 'Bram', 8, [8, 7, 4, 9], c('bram'));
  C('c_sable', 'Sable', 8, [6, 9, 8, 5], c('sable'));
  C('c_drago', 'Drago Venn', 9, [9, 8, 8, 5], c('drago'));
  C('c_lyra', 'Lyra', 9, [6, 8, 9, 7], c('lyra'), 'holy');
  C('c_kael', 'Kael', 10, [10, 6, 8, 9], c('kael'), 'wind');
  C('c_vesper', 'Vesper', 10, [10, 9, 4, 10], c('vesper'), 'dark');
})();
// the people who play: deck, rules, how clever they are (0..1)
AE.ARCANA_FOES = {
  kid: { name: 'PUPIL', deck: ['c_rat', 'c_slime', 'c_bat', 'c_drone', 'c_larva', 'c_hawk'], rules: [], wit: 0.3, hi: 'Best of one! Loser gives a card! I won\'t cry!', lose: 'I\'m not crying. YOU\'RE crying.' },
  noble: { name: 'ARCANA PLAYER', deck: ['c_trooper', 'c_hawk', 'c_eel', 'c_rotcap', 'c_wisp', 'c_gunner', 'c_heavy'], rules: [], wit: 0.6, hi: 'A game? Splendid. I collect the Aurex cards. They\'re very collectable. Like the people.', lose: 'Oh, bother.' },
  dealer: { name: 'DEALER', deck: ['c_crawler', 'c_sumprat', 'c_rivet', 'c_imp', 'c_hound', 'c_heavy', 'c_bulwark'], rules: ['same'], wit: 0.8, hi: 'House rules: Same is on. Two matching sides, both flip. Shall we?', lose: 'House loses. House always remembers.' },
  sharp: { name: 'CARD SHARP', deck: ['c_hound', 'c_specimen', 'c_failed', 'c_arcanist', 'c_ogre', 'c_gorr', 'c_drake'], rules: ['same', 'elemental'], wit: 0.95, hi: 'Same and Elemental. Real rules for real players. Ready to lose something nice?', lose: '...Lucky. That was luck. Again.' }
};
(function () {
  const iname = AE.itemName;
  AE.itemName = function (id) { if (id && id.indexOf('card:') === 0) return 'Arcana: ' + ((AE.CARDS[id.slice(5)] || {}).name || id); return iname(id); };
})();
AE.cardRank = function (v) { return v >= 10 ? 'A' : String(v); };

// ---------- drawing a card ----------
AE.drawCard = function (ctx, id, x, y, side, o) {
  o = o || {}; const D = AE.CARDS[id]; if (!D) return;
  const W = 40, H = 48;
  const bg = side === 'p' ? ['#2a4a9a', '#16285a'] : side === 'e' ? ['#9a2a3a', '#5a1620'] : ['#555', '#333'];
  const g = ctx.createLinearGradient(0, y, 0, y + H); g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]);
  ctx.fillStyle = g; ctx.fillRect(x, y, W, H); ctx.strokeStyle = o.sel ? '#ffe080' : '#c8d0e0'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, W - 1, H - 1);
  if (o.back) { ctx.fillStyle = '#c8b070'; ctx.fillRect(x + 14, y + 18, 12, 12); return; }
  // art
  const A = D.art || {}; const filt = [A.hue ? 'hue-rotate(' + A.hue + 'deg)' : '', A.sat !== undefined ? 'saturate(' + A.sat + ')' : ''].join(' ').trim() || undefined;
  if (A.mon && AE.IMG['mon_' + A.mon]) AE.blit(ctx, AE.IMG['mon_' + A.mon], 0, 0, 16, 16, x + 12, y + 18, 16, 16, { filter: filt });
  else if (A.boss && AE.IMG['boss_' + A.boss + '_Idle']) { const s = 26 / Math.max(A.fw, A.fh); AE.blit(ctx, AE.IMG['boss_' + A.boss + '_Idle'], 0, 0, A.fw, A.fh, x + 20 - A.fw * s / 2, y + 44 - A.fh * s, A.fw * s, A.fh * s, { filter: filt }); }
  else if (A.cast) AE.actor(ctx, A.cast, 'idle', 2, 0, x + 20, y + 44, 0.7, { filter: filt });
  // ranks in a diamond, top-left
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x + 1, y + 1, 19, 23);
  const n = o.n || D.n;
  AE.text(ctx, AE.cardRank(n[0]), x + 10, y + 2, '#fff', { align: 'center' });
  AE.text(ctx, AE.cardRank(n[3]), x + 4, y + 9, '#fff', { align: 'center' });
  AE.text(ctx, AE.cardRank(n[1]), x + 16, y + 9, '#fff', { align: 'center' });
  AE.text(ctx, AE.cardRank(n[2]), x + 10, y + 16, '#fff', { align: 'center' });
  if (D.elem) { ctx.fillStyle = AE.ELEMCOL[D.elem] || '#fff'; ctx.fillRect(x + W - 7, y + 3, 4, 4); }
};
AE.ELEMCOL = { fire: '#ff7040', ice: '#80d0ff', bolt: '#ffe040', water: '#4080ff', wind: '#80ff90', earth: '#c09050', poison: '#a060e0', holy: '#ffffff', dark: '#8040a0' };

// ---------- the game scene ----------
AE.Arcana = {
  // play against a named player; resolves 'win' | 'lose' | 'draw' | 'no'
  duel: async function (foeId) {
    const Fd = AE.ARCANA_FOES[foeId]; if (!Fd) return 'no';
    const mine = Object.keys(AE.S_.cards).filter(function (k) { return AE.S_.cards[k] > 0 && AE.CARDS[k]; });
    const total = mine.reduce(function (a, k) { return a + AE.S_.cards[k]; }, 0);
    if (total < 5) { await AE.say('You need at least five Arcana cards to play.', { name: Fd.name }); return 'no'; }
    const r = await AE.ask(Fd.hi + (Fd.rules.length ? '' : ''), ['Play', 'Not now'], { name: Fd.name, cancel: 1 });
    if (r !== 0) return 'no';
    const g = new AE.ArcanaGame(foeId);
    const res = await new Promise(function (done) { g.done = done; AE.game.push(g); });
    if (res === 'win') await AE.say(Fd.lose, { name: Fd.name });
    return res;
  }
};
AE.ArcanaGame = function (foeId) {
  this.kind = 'arcana'; this.opaque = true; this.F = AE.ARCANA_FOES[foeId]; this.rules = this.F.rules;
  this.phase = 'choose'; this.t = 0; this.msg = '';
  // build the player's choosable list (one entry per copy, up to the count)
  const S = AE.S_; this.pool = [];
  Object.keys(S.cards).filter(function (k) { return AE.CARDS[k]; }).sort(function (a, b) { return AE.CARDS[b].lv - AE.CARDS[a].lv; })
    .forEach(function (k) { for (let i = 0; i < S.cards[k]; i++) this.pool.push(k); }, this);
  this.pick = []; this.list = new AE.List(this.pool, { rows: 12 });
  // the opponent's hand: 5 of their deck, weighted to stronger cards for clever players
  const deck = this.F.deck.slice().sort(function () { return Math.random() - 0.5; });
  this.ehand = deck.slice(0, 5).map(function (k) { return { id: k, side: 'e' }; });
  this.board = new Array(9).fill(null);
  this.elems = new Array(9).fill(null);
  if (this.rules.indexOf('elemental') >= 0) { const E = Object.keys(AE.ELEMCOL); for (let i = 0; i < 9; i++) if (Math.random() < 0.3) this.elems[i] = AE.pick(E); }
  this.hsel = 0; this.cell = 4; this.turn = Math.random() < 0.5 ? 'p' : 'e';
};
AE.ArcanaGame.prototype.val = function (c, i, side) {
  let v = AE.CARDS[c.id].n[side];
  if (this.elems[i]) v += (AE.CARDS[c.id].elem === this.elems[i]) ? 1 : -1;
  return AE.clamp(v, 1, 10);
};
// place card c at i; returns list of flipped cells
AE.ArcanaGame.prototype.place = function (c, i, dry) {
  const B = dry ? this.board.slice().map(function (x) { return x && { id: x.id, side: x.side }; }) : this.board, self = this;
  B[i] = { id: c.id, side: c.side };
  const N = [[i - 3, 0, 2, i >= 3], [i + 1, 1, 3, i % 3 < 2], [i + 3, 2, 0, i < 6], [i - 1, 3, 1, i % 3 > 0]];
  const flips = [];
  const rankAt = function (cell, k) { return self.val(B[cell], cell, k); };
  if (this.rules.indexOf('same') >= 0) {
    const same = N.filter(function (q) { return q[3] && B[q[0]] && rankAt(i, q[1]) === rankAt(q[0], q[2]); });
    if (same.length >= 2) same.forEach(function (q) { if (B[q[0]].side !== c.side) { B[q[0]].side = c.side; flips.push(q[0]); } });
  }
  N.forEach(function (q) { if (q[3] && B[q[0]] && B[q[0]].side !== c.side && rankAt(i, q[1]) > rankAt(q[0], q[2])) { B[q[0]].side = c.side; flips.push(q[0]); } });
  // combo: cards flipped by Same flip their own neighbours by the basic rule
  if (this.rules.indexOf('same') >= 0) {
    const q0 = flips.slice();
    while (q0.length) {
      const j = q0.shift();
      [[j - 3, 0, 2, j >= 3], [j + 1, 1, 3, j % 3 < 2], [j + 3, 2, 0, j < 6], [j - 1, 3, 1, j % 3 > 0]].forEach(function (q) {
        if (q[3] && B[q[0]] && B[q[0]].side !== c.side && rankAt(j, q[1]) > rankAt(q[0], q[2])) { B[q[0]].side = c.side; flips.push(q[0]); q0.push(q[0]); }
      });
    }
  }
  return flips;
};
AE.ArcanaGame.prototype.score = function (side) { return this.board.filter(function (x) { return x && x.side === side; }).length + (side === 'p' ? this.phand : this.ehand).length; };
AE.ArcanaGame.prototype.aiMove = function () {
  const self = this; let best = null;
  this.ehand.forEach(function (c, h) {
    for (let i = 0; i < 9; i++) {
      if (self.board[i]) continue;
      const fl = self.place(c, i, true).length;
      const n = AE.CARDS[c.id].n; const exposed = [i >= 3 && !self.board[i - 3] ? n[0] : 10, i % 3 < 2 && !self.board[i + 1] ? n[1] : 10, i < 6 && !self.board[i + 3] ? n[2] : 10, i % 3 > 0 && !self.board[i - 1] ? n[3] : 10];
      const weak = exposed.reduce(function (a, v) { return a + Math.max(0, 6 - v); }, 0);
      const sc = fl * 10 - weak * self.F.wit * 1.5 + Math.random() * (1 - self.F.wit) * 12 - AE.CARDS[c.id].lv * 0.3;
      if (!best || sc > best.sc) best = { sc: sc, h: h, i: i };
    }
  });
  return best;
};
AE.ArcanaGame.prototype.update = function (g) {
  const I = g.input; this.t++;
  if (this.phase === 'choose') {
    if (I.rep.up || I.rep.down) { this.list.move(I); AE.Sfx.play('move'); }
    if (I.pressed.ok) {
      const k = this.pool[this.list.sel]; const used = this.pick.filter(function (p) { return p === k; }).length;
      if (used >= AE.S_.cards[k]) { AE.Sfx.play('buzz'); return; }
      this.pick.push(k); AE.Sfx.play('ok');
      if (this.pick.length === 5) { this.phand = this.pick.map(function (k) { return { id: k, side: 'p' }; }); this.phase = 'play'; this.t = 0; this.msg = this.turn === 'p' ? 'You go first.' : this.F.name + ' goes first.'; }
    }
    if (I.pressed.back) { if (this.pick.length) { this.pick.pop(); AE.Sfx.play('back'); } else { AE.game.pop(this); this.done('no'); } }
    return;
  }
  if (this.phase === 'play') {
    if (this.board.every(Boolean)) { this.finish(); return; }
    if (this.turn === 'e') {
      if (this.t < 40) return;
      const m = this.aiMove(); const c = this.ehand.splice(m.h, 1)[0];
      const fl = this.place(c, m.i); AE.Sfx.play(fl.length ? 'hit' : 'ok'); this.flash = { cells: fl, t: 20 };
      this.turn = 'p'; this.t = 0; this.stage = 'hand'; return;
    }
    if (this.stage !== 'board') {
      if (I.rep.up) { this.hsel = (this.hsel + this.phand.length - 1) % this.phand.length; AE.Sfx.play('move'); }
      if (I.rep.down) { this.hsel = (this.hsel + 1) % this.phand.length; AE.Sfx.play('move'); }
      if (I.pressed.ok) { this.stage = 'board'; AE.Sfx.play('ok'); while (this.board[this.cell]) this.cell = (this.cell + 1) % 9; }
      return;
    }
    const mv = function (d) { return d; };
    if (I.rep.left && this.cell % 3 > 0) { this.cell--; AE.Sfx.play('move'); }
    if (I.rep.right && this.cell % 3 < 2) { this.cell++; AE.Sfx.play('move'); }
    if (I.rep.up && this.cell >= 3) { this.cell -= 3; AE.Sfx.play('move'); }
    if (I.rep.down && this.cell < 6) { this.cell += 3; AE.Sfx.play('move'); }
    if (I.pressed.back) { this.stage = 'hand'; AE.Sfx.play('back'); }
    if (I.pressed.ok) {
      if (this.board[this.cell]) { AE.Sfx.play('buzz'); return; }
      const c = this.phand.splice(this.hsel, 1)[0]; this.hsel = Math.min(this.hsel, Math.max(0, this.phand.length - 1));
      const fl = this.place(c, this.cell); AE.Sfx.play(fl.length ? 'hit' : 'ok'); this.flash = { cells: fl, t: 20 };
      this.turn = 'e'; this.t = 0; this.stage = 'hand';
    }
    return;
  }
  if (this.phase === 'claim') {
    if (I.rep.up) { this.csel = (this.csel + this.claimFrom.length - 1) % this.claimFrom.length; AE.Sfx.play('move'); }
    if (I.rep.down) { this.csel = (this.csel + 1) % this.claimFrom.length; AE.Sfx.play('move'); }
    if (I.pressed.ok) { const k = this.claimFrom[this.csel]; AE.S_.cards[k] = (AE.S_.cards[k] || 0) + 1; AE.Sfx.play('chest'); this.msg = 'You won ' + AE.CARDS[k].name + '!'; this.phase = 'over'; this.t = 0; }
    return;
  }
  if (this.phase === 'over' && this.t > 30 && (I.pressed.ok || I.pressed.back)) { AE.game.pop(this); this.done(this.result); }
};
AE.ArcanaGame.prototype.finish = function () {
  const p = this.score('p'), e = this.score('e'); const S = AE.S_;
  S.arcana = S.arcana || { w: 0, l: 0, d: 0 };
  if (p > e) {
    this.result = 'win'; S.arcana.w++; AE.Sfx.play('save');
    this.claimFrom = this.F.deck.filter(function (k, i, a) { return a.indexOf(k) === i; }); this.csel = 0; this.phase = 'claim'; this.msg = 'You win! Choose a card.';
  } else if (e > p) {
    this.result = 'lose'; S.arcana.l++; AE.Sfx.play('buzz');
    // they take the best card you played
    const best = this.pick.slice().sort(function (a, b) { return AE.CARDS[b].lv - AE.CARDS[a].lv; })[0];
    S.cards[best]--; if (S.cards[best] <= 0) delete S.cards[best];
    this.msg = 'You lose. ' + this.F.name + ' takes your ' + AE.CARDS[best].name + '.'; this.phase = 'over';
  } else { this.result = 'draw'; S.arcana.d++; this.msg = 'A draw. Nobody loses a card.'; this.phase = 'over'; }
  this.t = 0;
};
AE.ArcanaGame.prototype.draw = function (ctx) {
  const self = this;
  ctx.fillStyle = '#10301c'; ctx.fillRect(0, 0, AE.W, AE.H);
  ctx.fillStyle = '#184428'; for (let y = 0; y < AE.H; y += 8) for (let x = (y / 8) % 2 * 8; x < AE.W; x += 16) ctx.fillRect(x, y, 8, 8);
  if (this.phase === 'choose') {
    AE.window(ctx, 8, 8, 150, 208); AE.text(ctx, 'Choose 5 cards (' + this.pick.length + '/5)', 16, 14, '#ffe080');
    const L = this.list; for (let r = 0; r < L.rows; r++) {
      const i = L.top + r; if (i >= this.pool.length) break; const k = this.pool[i]; const D = AE.CARDS[k];
      const used = this.pick.filter(function (p) { return p === k; }).length; const dupeIdx = this.pool.slice(0, i).filter(function (p) { return p === k; }).length;
      AE.text(ctx, 'L' + D.lv + ' ' + D.name, 26, 30 + r * 14, dupeIdx < used ? '#666' : '#fff');
      if (i === L.sel) AE.cursor(ctx, 12, 30 + r * 14, true);
    }
    AE.drawCard(ctx, this.pool[this.list.sel], 190, 30, 'p');
    this.pick.forEach(function (k, i) { AE.drawCard(ctx, k, 166 + (i % 2) * 44, 90 + Math.floor(i / 2) * 42, 'p'); });
    AE.text(ctx, this.F.rules.length ? 'Rules: ' + this.F.rules.join(', ') : 'Rules: basic', 166, 214 - 8, '#cfc');
    return;
  }
  // board
  const BX = 68, BY = 36;
  for (let i = 0; i < 9; i++) {
    const x = BX + (i % 3) * 40, y = BY + Math.floor(i / 3) * 48;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x, y, 40, 48); ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.strokeRect(x + 0.5, y + 0.5, 39, 47);
    if (this.elems[i]) { ctx.fillStyle = AE.ELEMCOL[this.elems[i]]; ctx.globalAlpha = 0.5; ctx.fillRect(x + 16, y + 20, 8, 8); ctx.globalAlpha = 1; }
    const c = this.board[i];
    if (c) AE.drawCard(ctx, c.id, x, y, c.side, { n: [0, 1, 2, 3].map(function (k) { return self.val(c, i, k); }) });
    if (this.flash && this.flash.t > 0 && this.flash.cells.indexOf(i) >= 0) { ctx.fillStyle = 'rgba(255,255,255,' + (this.flash.t / 30) + ')'; ctx.fillRect(x, y, 40, 48); }
    if (this.phase === 'play' && this.turn === 'p' && this.stage === 'board' && i === this.cell) { ctx.strokeStyle = '#ffe080'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, 38, 46); ctx.lineWidth = 1; }
  }
  if (this.flash) this.flash.t--;
  // hands
  this.ehand.forEach(function (c, i) { AE.drawCard(ctx, c.id, 8, 18 + i * 34, 'e', { back: !self.rules.includes('open') && false }); });
  (this.phand || []).forEach(function (c, i) { const sel = self.turn === 'p' && i === self.hsel && self.phase === 'play'; AE.drawCard(ctx, c.id, 208 - (sel ? 8 : 0), 18 + i * 34, 'p', { sel: sel }); });
  // score
  AE.text(ctx, String(this.score('e')), 30, 202, '#ff8080', { align: 'center' }); AE.text(ctx, String(this.score('p')), 228, 202, '#80a0ff', { align: 'center' });
  AE.text(ctx, this.F.name, 8, 4, '#ffb0b0'); AE.text(ctx, 'YOU', 248, 4, '#b0c8ff', { align: 'right' });
  if (this.phase === 'play') AE.text(ctx, this.turn === 'p' ? (this.stage === 'board' ? 'Place your card' : 'Pick a card') : this.F.name + ' is thinking...', AE.W / 2, 190, '#fff', { align: 'center' });
  if (this.phase === 'claim') {
    AE.window(ctx, 60, 30, 136, 20 + this.claimFrom.length * 12); AE.text(ctx, 'Take one card:', 68, 36, '#ffe080');
    this.claimFrom.forEach(function (k, i) { AE.text(ctx, AE.CARDS[k].name, 84, 50 + i * 12, '#fff'); if (i === self.csel) AE.cursor(ctx, 70, 50 + i * 12, true); });
    AE.drawCard(ctx, this.claimFrom[this.csel], 108, 60 + this.claimFrom.length * 12, 'p');
  }
  if (this.phase === 'over') { AE.window(ctx, 30, 96, 196, 28); AE.text(ctx, this.msg, AE.W / 2, 104, '#fff', { align: 'center' }); }
  else if (this.msg && this.t < 90 && this.phase === 'play') AE.text(ctx, this.msg, AE.W / 2, 22, '#ffe080', { align: 'center' });
};
// the menu's card list: a proper browser now
AE.CardList = function () { this.sel = 0; };
AE.CardList.prototype.update = function (I) {
  const ks = Object.keys(AE.S_.cards).filter(function (k) { return AE.CARDS[k]; });
  if (I.rep.up) this.sel = Math.max(0, this.sel - 1); if (I.rep.down) this.sel = Math.min(ks.length - 1, this.sel + 1);
  if (I.pressed.back || I.pressed.ok) return 'close';
};
AE.CardList.prototype.draw = function (ctx) {
  AE.window(ctx, 0, 0, AE.W, AE.H); const S = AE.S_;
  const ks = Object.keys(S.cards).filter(function (k) { return AE.CARDS[k]; }).sort(function (a, b) { return AE.CARDS[a].lv - AE.CARDS[b].lv || (a < b ? -1 : 1); });
  const rec = S.arcana || { w: 0, l: 0, d: 0 };
  AE.text(ctx, 'Arcana  ' + ks.length + '/' + Object.keys(AE.CARDS).length + ' kinds   W' + rec.w + ' L' + rec.l + ' D' + rec.d, 10, 6, '#ffe080');
  if (!ks.length) { AE.text(ctx, 'No cards yet. The dealer at the Lucky Lantern', 10, 26, '#888'); AE.text(ctx, '(Market Ward) gives every new player a deck.', 10, 38, '#888'); return; }
  const top = Math.max(0, Math.min(this.sel - 6, ks.length - 14));
  ks.slice(top, top + 14).forEach(function (k, r) { const i = top + r; AE.text(ctx, 'L' + AE.CARDS[k].lv + ' ' + AE.CARDS[k].name + ' x' + S.cards[k], 22, 24 + r * 13, '#fff'); if (i === this.sel) AE.cursor(ctx, 8, 24 + r * 13, true); }, this);
  if (ks[this.sel]) AE.drawCard(ctx, ks[this.sel], 200, 40, 'p');
};
