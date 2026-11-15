const { chromium } = require('playwright');
(async () => {
  const [page, out, w, h] = [process.argv[2], process.argv[3], +process.argv[4], +process.argv[5]];
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: w, height: h } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + page); await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
  await p.evaluate(() => { AE.newGame(); for (let i = 0; i < 5; i++) AE.game.step(); AE.game.scenes = []; ['kael', 'lyra', 'bram'].forEach(id => AE.joinMember(id, 30)); AE.setParty(['kael', 'lyra', 'bram']);
    AE.startBattle({ enemies: ['colossus'], bg: 'lava', boss: 1 }, { canLose: 1 }); });
  await p.waitForTimeout(3500);
  console.log('S=' + await p.evaluate(() => AE.S), await p.evaluate(() => document.querySelector('canvas').style.imageRendering), errs.slice(0, 2));
  await p.screenshot({ path: out }); await b.close();
})();
