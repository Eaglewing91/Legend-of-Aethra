// load the built userscript into a fake Torn page with Tampermonkey shims, open it in a "phone" host, start a game
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 700 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.setContent('<html><body style="background:#333"><div id="phone" style="position:relative;width:560px;height:480px;margin:40px;background:#111"></div></body></html>');
  await p.evaluate(() => { const st = {}; window.GM_getValue = (k, d) => (k in st ? st[k] : d); window.GM_setValue = (k, v) => { st[k] = v; }; window.GM_registerMenuCommand = () => {}; window.ST = st; });
  if (!process.argv[3]) await p.addScriptTag({ content: fs.readFileSync('build/Legend-of-Aethra-Art.user.js', 'utf8') });
  await p.addScriptTag({ content: fs.readFileSync('build/Legend-of-Aethra.user.js', 'utf8') });
  const here = await p.evaluate(() => new Promise(r => { document.addEventListener('aethra:here', e => r(e.detail)); document.dispatchEvent(new CustomEvent('aethra:ping')); }));
  console.log('here', here);
  await p.evaluate(() => document.dispatchEvent(new CustomEvent('aethra:open', { detail: JSON.stringify({ host: 'phone', volume: 50 }) })));
  await p.waitForTimeout(2500); await p.screenshot({ path: process.argv[2] + '/us1.png' });
  await p.keyboard.press('KeyZ'); await p.waitForTimeout(2500);
  for (let i = 0; i < 30; i++) { await p.keyboard.press('KeyZ'); await p.waitForTimeout(150); }
  await p.screenshot({ path: process.argv[2] + '/us2.png' });
  await p.evaluate(() => document.dispatchEvent(new CustomEvent('aethra:close')));
  await p.waitForTimeout(300);
  console.log('saved keys', await p.evaluate(() => Object.keys(window.ST)));
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no errors'); await b.close();
})();
