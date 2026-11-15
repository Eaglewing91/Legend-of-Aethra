// usage: node tests/turns.js [out.png]   Turn-based battles: one fighter at a time, in Speed order; screenshot of the turn strip
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1024, height: 896 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/build/dev.html'); await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
  const r = await p.evaluate(async () => {
    AE.newGame(); for (let i = 0; i < 5; i++) AE.game.step(); AE.game.scenes = [];
    ['kael', 'lyra', 'bram'].forEach(id => AE.joinMember(id, 20)); AE.setParty(['kael', 'lyra', 'bram']);
    let res = null; AE.startBattle({ enemies: ['goblin', 'goblin', 'wolf'].filter(id => AE.ENEMIES[id]).concat(Object.keys(AE.ENEMIES).slice(0, 3)).slice(0, 3) }, { canLose: 1 }).then(x => res = x);
    const B = AE.game.scenes[AE.game.scenes.length - 1], log = []; let maxBusy = 0, menuWhileBusy = 0, frames = 0;
    while ((B.phase === 'fight' || B.phase === 'intro') && frames < 60 * 300) {
      AE.game.step(); AE.tickWaits && 0; frames++;
      const acting = (B.busy ? 1 : 0) + (B.menu ? 1 : 0); maxBusy = Math.max(maxBusy, acting); if (B.busy && B.menu) menuWhileBusy++;
      if (B.menu && B.menu.depth === 0 && frames % 7 === 0) { const f = B.menu.f, t = B.foes(f)[0]; log.push(f.name); if (t) B.commit({ user: f, kind: 'attack', targets: [t] }); }
      if (B.busy && B.cur && log[log.length - 1] !== '>' + B.cur.name && B.cur.side === 'enemy') log.push('>' + B.cur.name);
      await new Promise(r => setTimeout(r, 0));
    }
    const st = { busy: B.busy, menu: !!(B.menu), depth: B.menu && B.menu.depth, q: B.queue.length, ready: B.ready.map(f => f.name), wait: B.all().filter(f => f.waiting).map(f => f.name), phase: B.phase, hp: B.all().map(f => f.name + ':' + f.hp + ':' + f.atb.toFixed(2) + ':' + Object.keys(f.status).join('/')), gap: B.gap };
    return { st, frames, turns: log.length, menuWhileBusy, log: log.slice(0, 24).join(' '), spd: B.party.map(f => f.name + ':' + f.spd).concat(B.enemies.map(f => f.name + ':' + f.spd)).join(' ') };
  });
  console.log(JSON.stringify(r));
  // screenshot with the strip
  await p.evaluate(() => { AE.game.scenes = []; AE.startBattle({ enemies: ['colossus'], bg: 'lava', boss: 1 }, { canLose: 1 }); });
  await p.waitForTimeout(2500); await p.screenshot({ path: process.argv[2] || '/tmp/turns.png' });
  console.log(errs.length ? errs.slice(0, 3) : 'no errors'); await b.close();
})();
