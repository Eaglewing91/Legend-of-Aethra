// usage: node tests/level.js     Levelling pace: EXP, AP and time per battle in a few areas at a few party levels,
// fought by a simple automated player (strongest spells, potions, Elixirs for Greedy Urns, Phoenix Plumes).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/build/dev.html'); await p.waitForFunction(() => window.ready, null, { timeout: 30000 });
  const r = await p.evaluate(async () => {
    const G = AE.game; G.stop(); AE.Music = null; AE.say = () => Promise.resolve(); AE.notice = () => Promise.resolve(); AE.tutorial = () => Promise.resolve();
    AE.newGame(); for (let i = 0; i < 5; i++) G.step(); G.scenes = [];
    const S = AE.S_; S.cfg.speed = 5;
    const run = async function (group, n, lv) {
      ['kael', 'lyra', 'bram'].forEach(id => { delete S.m[id]; AE.joinMember(id, lv); }); S.party = ['kael', 'lyra', 'bram'];
      S.prisms = []; ['kael', 'lyra', 'bram'].forEach(id => { const a = AE.addPrism('bolt', 99999), c = AE.addPrism('fire', 99999); S.m[id].slots = { weapon: [a, c], armor: [] }; });
      AE.calcAll(); S.inv = {}; AE.addItem('potion', 60); AE.addItem('phoenix_down', 40); AE.addItem('elixir', 30);
      const exp0 = S.party.reduce((a, id) => a + S.m[id].exp, 0); let frames = 0, wins = 0, losses = 0;
      for (let k = 0; k < n; k++) {
        AE.healAll(); let done = null;
        AE.startBattle(AE.rollFormation(group), { canLose: 1 }).then(x => done = x);
        for (let i = 0; i < 60 * 60 * 5 && done === null; i++) {
          const B = G.top();
          if (B && B.kind === 'battle') {
            if ((B.phase === 'win' || B.phase === 'lose') && i % 4 === 0) G.input.down.ok = true;
            if (B.menu) {
              const u = B.menu.f, foes = B.foes(u), dead = B.party.find(x => !AE.alive(x)), urn = foes.find(e => e.d.urn && !e.fed);
              let act;
              if (dead && S.inv.phoenix_down) act = { kind: 'item', id: 'phoenix_down', targets: [dead] };
              else if (urn && S.inv.elixir) act = { kind: 'item', id: 'elixir', targets: [urn] };
              else if (u.hp < u.maxhp * 0.35 && S.inv.potion) act = { kind: 'item', id: 'potion', targets: [u] };
              else if (u.mp >= 52) act = { kind: 'magic', id: Math.random() < 0.5 ? 'bolaga' : 'firaga', targets: [foes.find(e => !e.d.urn || e.fed) || foes[0]] };
              else act = { kind: 'attack', targets: [foes[0]] };
              act.user = u; B.commit(act);
            }
          }
          G.step(); frames++; await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
          if (i % 500 === 0) await new Promise(r => setTimeout(r, 0));
        }
        if (done === 'win') wins++; else losses++;
      }
      const exp1 = S.party.reduce((a, id) => a + S.m[id].exp, 0), ap = S.prisms.reduce((a, q) => a + q.ap, 0) - 6 * 99999;
      return { area: group, startLv: lv, battles: n, wins, losses, expPerBattle: Math.round((exp1 - exp0) / 3 / n), apPerBattle: Math.round(ap / 6 / n), secsPerBattle: Math.round(frames / 60 / n), expPerMin: Math.round((exp1 - exp0) / 3 / (frames / 3600)), endLv: S.party.map(id => S.m[id].lv) };
    };
    return [await run('w_meridia_s', 15, 20), await run('w_needle', 15, 30), await run('w_nordheim', 15, 45), await run('w_needle', 15, 45), await run('citadel', 15, 55), await run('w_needle', 15, 55)];
  });
  r.forEach(x => console.log(JSON.stringify(x))); if (errs.length) console.log('ERRORS', errs.slice(0, 3)); await b.close();
})();
