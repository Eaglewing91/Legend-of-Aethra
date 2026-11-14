// usage: node tests/worldmap.js out.png   (saves the world's colour map, as the game builds it, with place names)
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + process.cwd() + '/build/dev.html'); await p.waitForFunction(() => window.ready, null, { timeout: 30000 });
  const url = await p.evaluate(() => {
    AE.buildWorldTexture(); const T = AE.WT, c = document.createElement('canvas'); c.width = T.w; c.height = T.h; const x = c.getContext('2d'); x.drawImage(T.canvas, 0, 0);
    x.font = 'bold 11px sans-serif'; x.textAlign = 'center';
    for (const k in AE.WORLD.places) { const q = AE.WORLD.places[k], X = q[0] * 4 + 2, Y = q[1] * 4 + 2;
      x.fillStyle = '#d02020'; x.beginPath(); x.arc(X, Y, 3, 0, 7); x.fill(); x.strokeStyle = 'rgba(0,0,0,.7)'; x.lineWidth = 3; x.lineJoin = 'round'; x.strokeText(q[6], X, Y - 6); x.fillStyle = '#fff'; x.fillText(q[6], X, Y - 6); }
    return c.toDataURL('image/png'); });
  fs.writeFileSync(process.argv[2], Buffer.from(url.split(',')[1], 'base64')); await b.close();
})();
