// usage: node tests/shot.js out.png "js to run before the shot" [frames]
const { chromium } = require('playwright');
(async () => {
  const [out, js, frames] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 512, height: 448 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + process.cwd() + '/build/dev.html'); await p.waitForFunction(() => window.ready, null, { timeout: 30000 });
  if (js) await p.evaluate(js);
  await p.waitForTimeout(+(frames || 600));
  await p.screenshot({ path: out });
  console.log(errs.length ? errs.slice(0, 8).join('\n') : 'ok');
  await b.close();
})();
