// usage: node tests/play.js steps.txt   (one step per line)
//   js <code>        run code in the page          key <Code> [n]   press a key n times (KeyZ, ArrowUp, ...)
//   hold <Code> <ms> hold a key                    wait <ms>         wait
//   shot <file>      screenshot                    talk <n>          press Z n times, 250 ms apart (skip dialogue)
//   until <js> [ms]  wait until an expression is true (default 20 s)
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const steps = fs.readFileSync(process.argv[2], 'utf8').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'));
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 512, height: 448 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); else if (m.text().startsWith('LOG')) console.log(m.text()); });
  await p.goto('file://' + process.cwd() + '/build/dev.html'); await p.waitForFunction(() => window.ready, null, { timeout: 30000 });
  for (const s of steps) {
    const [cmd, ...rest] = s.split(' '); const arg = rest.join(' ');
    try {
      if (cmd === 'js') { const r = await p.evaluate(arg); if (r !== undefined) console.log('=>', JSON.stringify(r)); }
      else if (cmd === 'key') { const n = +(rest[1] || 1); for (let i = 0; i < n; i++) { await p.keyboard.down(rest[0]); await p.waitForTimeout(60); await p.keyboard.up(rest[0]); await p.waitForTimeout(90); } }
      else if (cmd === 'hold') { await p.keyboard.down(rest[0]); await p.waitForTimeout(+rest[1]); await p.keyboard.up(rest[0]); }
      else if (cmd === 'wait') await p.waitForTimeout(+arg);
      else if (cmd === 'shot') { await p.screenshot({ path: arg }); console.log('shot', arg); }
      else if (cmd === 'talk') { for (let i = 0; i < +arg; i++) { await p.keyboard.down('KeyZ'); await p.waitForTimeout(50); await p.keyboard.up('KeyZ'); await p.waitForTimeout(200); } }
      else if (cmd === 'until') { const ms = +(rest[rest.length - 1]) || 20000; const code = isNaN(+rest[rest.length - 1]) ? arg : rest.slice(0, -1).join(' '); await p.waitForFunction(code, null, { timeout: ms, polling: 100 }); }
    } catch (e) { console.log('step failed:', s, '\n  ', e.message.split('\n')[0]); }
  }
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 12).join('\n') : 'no errors');
  await b.close();
})();
