// usage: node tests/music.js   Every track decodes in the browser; every map, script and battle names a real track.
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/build/dev.html'); await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
  const names = new Set();
  for (const f of require('child_process').execSync("ls src/*.js src/content/*.js").toString().trim().split('\n'))
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/(?:music\(|Music\.play\(|music: *)'([a-z_0-9]+)'/g)) names.add(m[1]);
  const r = await p.evaluate(async (names) => {
    const out = { bad: [], decoded: 0, short: [] };
    for (const k of Object.keys(AE.MUSIC)) {
      const buf = await AE.decode('t:' + k, AE.MUSIC[k]);
      if (!buf) out.bad.push('decode ' + k); else { out.decoded++; if (buf.duration < 3) out.short.push(k + ' ' + buf.duration.toFixed(1)); }
    }
    const res = (n) => { const key = AE.TRACKS[n] || n; return key[0] === '#' ? AE.MUSIC[key.slice(1)] : AE.MUSIC[key]; };
    for (const id in AE.MAPS) { const m = AE.MAPS[id].music; if (m && !res(m)) out.bad.push('map ' + id + ' ' + m); }
    for (const n of names) if (!res(n)) out.bad.push('script ' + n);
    for (const ids of [['vesper1'], ['nyxar2'], ['drago4'], ['w_tide'], ['slime']]) out[ids[0]] = AE.battleMusicFor(ids);
    // play a few for real: field, battle, jingle
    AE.Music.play('world'); await new Promise(r => setTimeout(r, 1500)); out.playing = AE.Music.cur + ' ' + !!AE.Music.src;
    AE.Music.play('victory'); await new Promise(r => setTimeout(r, 800)); out.jingle = AE.Music.cur + ' ' + AE.Music.jingle + ' ' + !!AE.Music.src;
    return out;
  }, [...names]);
  console.log(JSON.stringify(r)); if (errs.length) console.log('ERRORS', errs.slice(0, 3)); await b.close();
})();
