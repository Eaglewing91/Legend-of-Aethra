// usage: node tests/balance.js [page.html] [battles per area] [out.json]
// Balance by area: for every encounter group, a party of Kael, Lyra and Bram at the group's level, with the gear and
// Prisms the shops sell by then, fights N battles with the simulated player from tests/sim.js. Reports win rate,
// time, party turns, enemy hits as a share of the target's max HP, and HP left.
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const page = process.argv[2] || 'build/dev.html', N = +(process.argv[3] || 8), out = process.argv[4] || '/tmp/balance.json', MODE = process.argv[5] || 'areas';   // 'bosses': optional bosses
  const sim = fs.readFileSync(__dirname + '/sim.js', 'utf8'), ai = sim.slice(sim.indexOf('    // ---------- the player AI ----------'), sim.indexOf('    // ---------- gear and Prisms ----------'));
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/' + page); await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
  const code = `(async () => {
    const G = AE.game; G.stop(); AE.Music = null; AE.say = () => Promise.resolve(); AE.notice = () => Promise.resolve(); AE.tutorial = () => Promise.resolve();
    const tick = async function () { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
    let frames = 0;
    const runUntil = async function (fn, max) {
      for (let i = 0; i < (max || 60 * 60 * 20); i++) {
        const top = G.top();
        if (top && top.kind === 'battle') { if ((top.phase === 'win' || top.phase === 'lose') && i % 4 === 0) G.input.down.ok = true; if (top.menu && !top.busy) decide(top, top.menu.f); }
        else if (top && top.kind === 'msg' && i % 4 === 0) G.input.down.ok = true;
        G.step(); frames++; await tick(); if (i % 500 === 0) await new Promise(r => setTimeout(r, 0));
        if (fn()) return true;
      }
      return false;
    };
    ${ai}
    AE.newGame(); await runUntil(() => true, 5); G.scenes = []; const S = AE.S_; S.cfg.speed = 5; S.cfg.diff = 1;
    const wares = [].concat(...Object.values(AE.SHOPS).map(sh => sh.items || []));
    const price = id => id.indexOf('prism:') === 0 ? (AE.PRISMS[id.slice(6)] || {}).price || 0 : (AE.ITEMDB(id) || {}).price || 0;
    const capFor = L => L < 8 ? 400 : L < 15 ? 1600 : L < 25 ? 7000 : L < 35 ? 16000 : L < 45 ? 34000 : L < 60 ? 70000 : 1e9;
    // hits on the party, as a share of max HP
    let hits = [];
    const hurt0 = AE.Battle.prototype.hurt;
    AE.Battle.prototype.hurt = function (f, d, o) { if (f.side === 'party' && d > 0 && this._who === 'enemy') hits.push(Math.min(2, d / f.maxhp)); return hurt0.apply(this, arguments); };
    const perf0 = AE.Battle.prototype.perform; let turns = 0;
    AE.Battle.prototype.perform = function (act) { this._who = act.user && act.user.side; if (act.user && act.user.side === 'party') turns++; return perf0.apply(this, arguments); };
    const R = [];
    const FIX = '${process.env.FIX || ''}'; const process_fixed = g => FIX ? { enemies: FIX.split('+'), bg: AE.ENC[g].bg } : AE.rollFormation(g);
    const groups = Object.keys(AE.ENC).map(k => { const G2 = AE.ENC[k]; let lv = 0, n = 0; G2.sets.forEach(s => (s.enemies || []).forEach(e => { const D = AE.ENEMIES[typeof e === 'string' ? e : e.id]; if (D) { lv += D.lv; n++; } })); return [k, n ? Math.round(lv / n) : 0]; }).filter(g => g[1] > 0).sort((a, c) => a[1] - c[1]);
    const BOSSES = '${MODE}' === 'bosses', ONLY = '${process.env.ONLY || ''}';
    if (ONLY && !BOSSES) { const keep = ONLY.split(','); for (let i = groups.length - 1; i >= 0; i--) if (keep.indexOf(groups[i][0]) < 0) groups.splice(i, 1); }
    if (BOSSES) { groups.length = 0; Object.keys(AE.ENEMIES).filter(k => AE.ENEMIES[k].boss && AE.ENEMIES[k].lv >= 45 && (!ONLY || ONLY.split(',').indexOf(k) >= 0)).forEach(k => groups.push([k, Math.min(99, AE.ENEMIES[k].lv)])); groups.sort((a, c) => a[1] - c[1]); }
    for (const [grp, L] of groups) {
      // a fresh party at this level with what the shops sell by now
      S.m = {}; S.inv = {}; S.prisms = []; ['kael', 'lyra', 'bram'].forEach(id => AE.joinMember(id, L)); S.party = ['kael', 'lyra', 'bram'];
      const cap = capFor(L);
      S.party.forEach(id => { const m = S.m[id]; ['weapon', 'armor'].forEach(slot => {
        const cur = slot === 'weapon' ? AE.WEAPONS[m.equip.weapon] : AE.ARMORS[m.equip.armor], score = d => slot === 'weapon' ? d.atk : d.def + d.mdef;
        const opts = wares.filter(k => (slot === 'weapon' ? AE.WEAPONS[k] && cur && AE.WEAPONS[k].type === cur.type : AE.ARMORS[k]) && price(k) > 0 && price(k) <= cap).sort((a, c) => score((AE.WEAPONS[c] || AE.ARMORS[c])) - score((AE.WEAPONS[a] || AE.ARMORS[a])));
        if (opts.length && score(AE.WEAPONS[opts[0]] || AE.ARMORS[opts[0]]) > score(cur || { atk: 0, def: 0, mdef: 0 })) m.equip[slot] = opts[0];
      }); });
      const pl = L < 15 ? 0 : L < 30 ? 1 : L < 45 ? 2 : 3;
      const pr = ['restore', 'restore'].concat(wares.filter(k => k.indexOf('prism:') === 0).map(k => k.slice(6)).filter((k, i, a) => a.indexOf(k) === i && AE.PRISMS[k] && AE.PRISMS[k].type === 'magic' && price('prism:' + k) <= cap && k !== 'restore'));
      pr.forEach(k => { AE.addPrism(k); const P = S.prisms[S.prisms.length - 1], D = AE.PRISMS[k]; if (D.ap && D.ap.length) P.ap = D.ap[Math.min(D.ap.length - 1, pl)] || 0; });
      // slot Prisms round-robin, healing first to Lyra
      S.party.forEach(id => { S.m[id].slots = { weapon: [], armor: [] }; });
      const capS = id => { const m = S.m[id], w = AE.WEAPONS[m.equip.weapon], a = AE.ARMORS[m.equip.armor]; return [w ? w.slots : 0, a ? a.slots : 0]; };
      const order = ['lyra', 'kael', 'bram']; let k2 = 0;
      S.prisms.forEach((P, pid) => { for (let t = 0; t < 3; t++) { const id = order[(k2 + t) % 3], c = capS(id), m = S.m[id]; if (m.slots.weapon.length < c[0]) { m.slots.weapon.push(pid); k2 = (k2 + t + 1) % 3; return; } if (m.slots.armor.length < c[1]) { m.slots.armor.push(pid); k2 = (k2 + t + 1) % 3; return; } } });
      AE.calcAll();
      const r = { grp, lv: L, n: 0, won: 0, secs: 0, turns: 0, hpLeft: 0, items: 0 }; hits = [];
      for (let i = 0; i < ${N}; i++) {
        AE.healAll(); S.inv.potion = 6; S.inv.phoenix_down = 3; if (L >= 20) S.inv.hi_potion = 4; S.inv.remedy = 2;
        const before = Object.values(S.inv).reduce((a, c) => a + c, 0);
        let res = null; const f0 = frames; turns = 0;
        AE.startBattle(BOSSES ? { enemies: [grp], boss: 1, bg: 'citadel', noRun: 1 } : (process_fixed(grp)), { canLose: 1 }).then(x => res = x);
        await runUntil(() => res !== null, 60 * 60 * 8);
        r.n++; if (res === 'win') r.won++; r.secs += (frames - f0) / 60; r.turns += turns;
        r.hpLeft += S.party.reduce((a, id) => a + S.m[id].hp / S.m[id].maxhp, 0) / 3;
        r.items += before - Object.values(S.inv).reduce((a, c) => a + c, 0);
      }
      hits.sort((a, c) => a - c);
      r.hit = hits.length ? +(hits.reduce((a, c) => a + c, 0) / hits.length * 100).toFixed(1) : 0;
      r.hitMax = hits.length ? +(hits[hits.length - 1] * 100).toFixed(0) : 0; r.hit90 = hits.length ? +(hits[Math.floor(hits.length * 0.9)] * 100).toFixed(0) : 0;
      ['secs', 'turns', 'hpLeft', 'items'].forEach(q => r[q] = +(r[q] / r.n).toFixed(2));
      r.hp = S.party.map(id => S.m[id].maxhp).join('/');
      R.push(r); console.log('BAL ' + JSON.stringify(r));
    }
    return R;
  })()`;
  p.on('console', m => { if (m.text().startsWith('BAL')) console.log(m.text()); });
  const res = await p.evaluate(code);
  fs.writeFileSync(out, JSON.stringify(res, null, 1));
  console.log(errs.length ? 'ERRORS ' + errs.slice(0, 5).join(' | ') : 'no errors'); await b.close();
})();
