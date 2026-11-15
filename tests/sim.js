// usage: node tests/sim.js seq.json [encounters per segment] [out.json]
// A simulated playthrough: starts a fresh game at level 1, then for every story battle (in story order, recorded
// by the story tests) it plays a few random encounters of that area, rests, and fights the story battle for real.
// A simple player AI fights: heals when someone is low, revives the fallen, uses Surges when ready, casts its best
// attack spell some of the time, otherwise attacks the weakest foe. Gear and Prisms follow what the story has given
// by that point; the AI equips the best it owns and slots every Prism. The game runs flat out, without drawing.
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const seq = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), K = +(process.argv[3] || 8), out = process.argv[4] || '/tmp/sim.json';
  const b = await chromium.launch(); const p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.text().startsWith('SIM')) console.log(m.text()); });
  await p.goto('file://' + process.cwd() + '/build/dev.html'); await p.waitForFunction(() => window.ready, null, { timeout: 30000 });
  const res = await p.evaluate(async ({ seq, K, ATOLL }) => {
    const G = AE.game; G.stop(); AE.Music = null;
    AE.say = function (t, o) { return Promise.resolve(o && o.choices ? 0 : undefined); }; AE.notice = function () { return Promise.resolve(); };
    AE.tutorial = function () { return Promise.resolve(); };
    const tick = async function () { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
    let frames = 0;
    const runUntil = async function (fn, max) {
      for (let i = 0; i < (max || 60 * 60 * 20); i++) {
        const top = G.top();
        if (top && top.kind === 'battle') {
          if ((top.phase === 'win' || top.phase === 'lose') && i % 4 === 0) G.input.down.ok = true;
          if (top.menu && !top.busy) decide(top, top.menu.f);
        } else if (top && top.kind === 'msg' && i % 4 === 0) G.input.down.ok = true;
        G.step(); frames++; await tick(); if (i % 500 === 0) await new Promise(r => setTimeout(r, 0));
        if (fn()) return true;
      }
      return false;
    };
    // ---------- the player AI ----------
    const usedItems = {};
    const decide = function (B, f) {
      const S = AE.S_, foes = B.foes(f), friends = B.friends(f), dead = B.party.filter(x => !AE.alive(x) && !x.gone);
      const spells = []; f.abil.magic.forEach(m => (AE.PRISMS[m.id].spells || []).slice(0, m.lv).forEach(s => spells.push(s)));
      const can = s => AE.SPELLS[s] && f.mp >= AE.SPELLS[s].mp && !f.status.silence;
      const commit = act => { act.user = f; B.commit(act); };
      if (!foes.length) return commit({ kind: 'defend', targets: [f] });
      // revive
      if (dead.length) {
        const rv = ['life2', 'life'].find(can); if (rv) return commit({ kind: 'magic', id: rv, targets: [dead[0]] });
        if (S.inv.phoenix_down) { usedItems.phoenix_down = (usedItems.phoenix_down || 0) + 1; return commit({ kind: 'item', id: 'phoenix_down', targets: [dead[0]] }); }
      }
      // cure crippling status (confusion, sleep, stop, silence, stone) on an ally
      const bad = friends.find(x => x.status.confuse || x.status.sleep || x.status.stop || x.status.stone || (x.status.silence && x !== f));
      if (bad) { if (can('esuna')) return commit({ kind: 'magic', id: 'esuna', targets: [bad] }); if (S.inv.remedy) { usedItems.remedy = (usedItems.remedy || 0) + 1; return commit({ kind: 'item', id: 'remedy', targets: [bad] }); } }
      // against a boss, raise guards once: Protect, Shell, Haste
      if (foes.some(x => x.d && x.d.boss)) for (const [sp, st] of [['protect', 'protect'], ['shell', 'shell'], ['haste', 'haste']]) { const t = friends.find(x => !x.status[st]); if (t && can(sp) && Math.random() < 0.5) return commit({ kind: 'magic', id: sp, targets: [t] }); }
      // heal the lowest if below 40%
      const low = friends.slice().sort((a, c) => a.hp / a.maxhp - c.hp / c.maxhp)[0];
      if (low && low.hp < low.maxhp * 0.4) {
        const many = friends.filter(x => x.hp < x.maxhp * 0.6).length >= 2;
        const hs = ['curaga', 'cura', 'cure'].find(can);
        if (hs) return commit({ kind: 'magic', id: hs, targets: many ? friends : [low], all: many });
        const it = ['x_potion', 'hi_potion', 'potion'].find(k => S.inv[k]); if (it) { usedItems[it] = (usedItems[it] || 0) + 1; return commit({ kind: 'item', id: it, targets: [low] }); }
      }
      // Surge
      if (f.surge >= 1) {
        const arts = AE.CHARS[f.id].surge.filter(s => AE.SURGES[s].lv <= (f.m.surgeLv || 1)); const id = arts[arts.length - 1];
        const L = AE.SURGES[id]; return commit({ kind: 'surge', id: id, targets: L.target === 'self' ? [f] : L.kind === 'heal' || L.kind === 'buff' ? B.friends(f, 1) : L.target === 'enemy' ? [foes[0]] : foes });
      }
      // attack magic: the strongest affordable, aimed at a weakness when there is one
      const atk = spells.filter(s => can(s) && AE.SPELLS[s].kind === 'mag').sort((a, c) => AE.SPELLS[c].power - AE.SPELLS[a].power);
      const boss = foes.some(x => x.d && x.d.boss);
      if (atk.length && (boss || foes.length > 1 || Math.random() < 0.3) && f.mp > f.maxmp * (boss ? 0.15 : 0.4)) {
        let best = atk[0], tgt = foes[0];
        for (const s of atk) for (const t of foes) if (AE.elemMod(t, AE.SPELLS[s].elem) > 1) { best = s; tgt = t; break; }
        const all = !boss && foes.length > 1 && AE.SPELLS[best].all;
        return commit({ kind: 'magic', id: best, targets: all ? foes : [tgt], all: all });
      }
      return commit({ kind: 'attack', targets: [foes.slice().sort((a, c) => a.hp - c.hp)[0]] });
    };
    // ---------- gear and Prisms ----------
    const best = function (id, slot) {
      const S = AE.S_, C = AE.CHARS[id], m = S.m[id], owned = Object.keys(S.inv).concat(m.equip[slot] ? [m.equip[slot]] : []);
      if (slot === 'weapon') return owned.filter(k => AE.WEAPONS[k] && AE.WEAPONS[k].type === (AE.WEAPONS[m.equip.weapon] || {}).type).sort((a, c) => AE.WEAPONS[c].atk - AE.WEAPONS[a].atk)[0] || m.equip.weapon;
      if (slot === 'armor') return owned.filter(k => AE.ARMORS[k]).sort((a, c) => (AE.ARMORS[c].def + AE.ARMORS[c].mdef) - (AE.ARMORS[a].def + AE.ARMORS[a].mdef))[0] || m.equip.armor;
    };
    const equipAll = function () {
      const S = AE.S_, ids = S.party;
      ids.forEach(id => ['weapon', 'armor'].forEach(slot => { const m = S.m[id], b2 = best(id, slot); if (b2 && b2 !== m.equip[slot] && S.inv[b2]) { if (m.equip[slot]) AE.addItem(m.equip[slot], 1); AE.addItem(b2, -1); m.equip[slot] = b2; } }));
      // slot every Prism: healing magic first to the best caster, then the rest round-robin
      ids.forEach(id => { S.m[id].slots = { weapon: [], armor: [] }; });
      const cap = id => { const m = S.m[id], w = AE.WEAPONS[m.equip.weapon], a = AE.ARMORS[m.equip.armor]; return { weapon: w ? w.slots : 0, armor: a ? a.slots : 0 }; };
      const free = id => { const c = cap(id), m = S.m[id]; return (c.weapon - m.slots.weapon.length) + (c.armor - m.slots.armor.length); };
      const put = (id, pid) => { const c = cap(id), m = S.m[id]; if (m.slots.weapon.length < c.weapon) m.slots.weapon.push(pid); else if (m.slots.armor.length < c.armor) m.slots.armor.push(pid); };
      const order = S.prisms.map((P, i) => i).sort((a, c) => { const pa = AE.PRISMS[S.prisms[a].id], pc = AE.PRISMS[S.prisms[c].id]; const rank = D => D.type === 'magic' ? (D.spells && D.spells[0] === 'cure' ? 0 : 1) : D.type === 'echo' ? 2 : D.type === 'indep' ? 3 : 4; return rank(pa) - rank(pc); });
      const casters = ids.slice().sort((a, c) => S.m[c].st.mag - S.m[a].st.mag);
      let k = 0;
      order.forEach(pid => { for (let t = 0; t < ids.length; t++) { const id = casters[(k + t) % ids.length]; if (free(id) > 0) { put(id, pid); k = (k + t + 1) % ids.length; return; } } });
      AE.calcAll();
    };
    const sync = function (rec, avgLv) {
      const S = AE.S_;
      rec.party.forEach(id => { if (!S.m[id]) AE.joinMember(id, Math.max(1, Math.round(avgLv))); });
      S.party = rec.party.filter(id => S.m[id]).slice(0, 3);
      const have = {}; S.prisms.forEach(P => { have[P.id] = (have[P.id] || 0) + 1; });
      const want = {}; rec.prisms.forEach(id => { want[id] = (want[id] || 0) + 1; });
      Object.keys(want).forEach(id => { for (let i = have[id] || 0; i < want[id]; i++) AE.addPrism(id); });
      rec.gear.forEach(g => { if (!S.inv[g] && !Object.values(S.m).some(m => m.equip.weapon === g || m.equip.armor === g || m.equip.acc === g)) AE.addItem(g, 1); });
      S.gold = Math.max(S.gold, 0);
      // a player stocks up between areas: top up healing items with the Gil they have
      [['potion', 50, 8], ['hi_potion', 300, 6], ['phoenix_down', 300, 4], ['ether', 1500, 2], ['remedy', 1000, 3]].forEach(([id, pr, n]) => { while ((S.inv[id] || 0) < n && S.gold >= pr && (id !== 'hi_potion' || S.chapter >= 2)) { S.gold -= pr; AE.addItem(id, 1); } });
      // shopping: the best weapon and armour each member can afford, and the attack and healing Prisms on sale,
      // limited to what the shops of this stage of the story would sell (by price)
      const cap = [0, 1600, 7000, 16000, 34000, 70000][Math.min(5, S.chapter)] || 70000;
      const wares = [].concat(...Object.values(AE.SHOPS).map(sh => sh.items || []));
      const price = id => id.indexOf('prism:') === 0 ? (AE.PRISMS[id.slice(6)] || {}).price || 0 : (AE.ITEMDB(id) || {}).price || 0;
      S.party.forEach(id => {
        const m = S.m[id];
        ['weapon', 'armor'].forEach(slot => {
          const cur = slot === 'weapon' ? AE.WEAPONS[m.equip.weapon] : AE.ARMORS[m.equip.armor];
          const score = d => slot === 'weapon' ? d.atk : d.def + d.mdef;
          const opts = wares.filter(k => (slot === 'weapon' ? AE.WEAPONS[k] && (!cur || AE.WEAPONS[k].type === cur.type) : AE.ARMORS[k]) && price(k) > 0 && price(k) <= cap && price(k) <= S.gold)
            .sort((a, c) => score(slot === 'weapon' ? AE.WEAPONS[c] : AE.ARMORS[c]) - score(slot === 'weapon' ? AE.WEAPONS[a] : AE.ARMORS[a]));
          if (opts.length && (!cur || score(slot === 'weapon' ? AE.WEAPONS[opts[0]] : AE.ARMORS[opts[0]]) > score(cur))) { S.gold -= price(opts[0]); AE.addItem(opts[0], 1); }
        });
      });
      const owned = {}; S.prisms.forEach(P => owned[P.id] = (owned[P.id] || 0) + 1);
      wares.filter(k => k.indexOf('prism:') === 0).map(k => k.slice(6)).filter((k, i, a) => a.indexOf(k) === i)
        .filter(k => AE.PRISMS[k] && ['magic', 'support', 'indep'].indexOf(AE.PRISMS[k].type) >= 0 && price('prism:' + k) <= cap)
        .sort((a, c) => (AE.PRISMS[a].type === 'magic' ? 0 : 1) - (AE.PRISMS[c].type === 'magic' ? 0 : 1))
        .forEach(k => { const want = AE.PRISMS[k].spells && AE.PRISMS[k].spells[0] === 'cure' ? 2 : 1; while ((owned[k] || 0) < want && S.gold >= price('prism:' + k)) { S.gold -= price('prism:' + k); AE.addPrism(k); owned[k] = (owned[k] || 0) + 1; } });
      equipAll();
    };
    const battle = async function (form, o) {
      let result = null; const f0 = frames;
      AE.startBattle(form, Object.assign({ canLose: 1 }, o || {})).then(r => { result = r; });
      await runUntil(() => result !== null, 60 * 60 * 15);
      return { result: result || 'timeout', frames: frames - f0 };
    };
    // ---------- damage tracing: what hurts the party, per battle ----------
    let trace = {};
    const perf0 = AE.Battle.prototype.perform;
    AE.Battle.prototype.perform = function (act) { this._act = act; return perf0.apply(this, arguments); };
    const hurt0 = AE.Battle.prototype.hurt;
    AE.Battle.prototype.hurt = function (f, d, o) {
      if (f.side === 'party' && d > 0 && this._act && this._act.user && this._act.user.side === 'enemy') {
        const k = this._act.kind === 'attack' ? 'attack' : (this._act.id || this._act.kind), T = trace[k] = trace[k] || { n: 0, sum: 0, max: 0 };
        T.n++; T.sum += Math.floor(d); T.max = Math.max(T.max, Math.floor(d));
      }
      return hurt0.apply(this, arguments);
    };
    const giv0 = AE.giveStatus;
    AE.giveStatus = function (t, s, o) { const r = giv0.apply(this, arguments); if (r && t.side === 'party') { trace['status:' + s] = (trace['status:' + s] || 0) + 1; } return r; };
    // ---------- the run ----------
    AE.newGame(); await runUntil(() => true, 5); G.scenes = []; const S = AE.S_; S.cfg.speed = 5; S.cfg.atb = 'active'; S.cfg.diff = 1;
    const log = [], enc = { won: 0, lost: 0, frames: 0, n: 0 };
    let lastEnc = 'r4';
    const atoll = (ATOLL || '').split(':'); const atollAt = +atoll[0], atollN = +(atoll[1] || 0);
    for (let i = 0; i < seq.length; i++) {
      const rec = seq[i];
      if (atollN && i === atollAt) {   // an optional trip to Needle Atoll
        const lv0 = S.party.map(id => S.m[id].lv);
        for (let k = 0; k < atollN; k++) { AE.healAll(); await battle(AE.rollFormation('w_needle')); }
        console.log('SIM atoll trip: ' + atollN + ' battles, levels ' + lv0 + ' -> ' + S.party.map(id => S.m[id].lv));
      } if (rec.en.some(e => !AE.ENEMIES[e])) continue;
      const avgLv = S.party.length ? S.party.reduce((a, id) => a + S.m[id].lv, 0) / S.party.length : 1;
      sync(rec, avgLv); if (rec.enc && AE.ENC[rec.enc]) lastEnc = rec.enc;
      const encN = rec.boss ? K : Math.floor(K / 2);
      for (let k = 0; k < encN; k++) {
        if (!AE.ENC[lastEnc]) break;
        const f = AE.rollFormation(lastEnc); const r = await battle(f);
        enc.n++; enc.frames += r.frames; if (r.result === 'win') enc.won++; else { enc.lost++; AE.healAll(); }
      }
      AE.healAll(); equipAll();
      let tries = 0, r;
      do {
        tries++; trace = {}; r = await battle({ enemies: rec.en.slice(), bg: rec.bg, boss: rec.boss, noRun: 1 });
        if (r.result !== 'win') { for (let k = 0; k < 4 && AE.ENC[lastEnc]; k++) await battle(AE.rollFormation(lastEnc)); AE.healAll(); equipAll(); }
      } while (r.result !== 'win' && tries < 3);
      const party = S.party.map(id => ({ id: id, lv: S.m[id].lv, hp: S.m[id].hp + '/' + S.m[id].maxhp }));
      const row = { i: i, ch: rec.ch, foes: rec.en.join(','), boss: rec.boss, result: r.result, tries: tries, secs: Math.round(r.frames / 60), party: party, storyLv: rec.lv, gil: S.gold, hurt: trace };
      log.push(row); console.log('SIM ' + JSON.stringify(row));
    }
    return { log, enc: { n: enc.n, won: enc.won, lost: enc.lost, avgSecs: Math.round(enc.frames / Math.max(1, enc.n) / 60) }, usedItems, playMinutes: Math.round(frames / 3600) };
  }, { seq, K, ATOLL: process.argv[5] || '' });
  fs.writeFileSync(out, JSON.stringify(res, null, 1));
  console.log('ENC', JSON.stringify(res.enc), 'ITEMS', JSON.stringify(res.usedItems), 'battle minutes', res.playMinutes, errs.length ? 'ERRORS ' + errs.slice(0, 5).join(' | ') : 'no errors');
  await b.close();
})();
