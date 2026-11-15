// usage: node tests/sound.js   The game, the Soundtrack and Torn Arcade together, as on Torn: music arrives whichever script
// loads first (or late), plays through a limiter without clipping, follows mute and volume, sleeps when closed, and keeps
// only a few decoded tracks in memory. Also runs without the Soundtrack.
const { chromium } = require('playwright'); const fs = require('fs');
// (the game script is patched in memory to expose AE, for this test only)
const GAME = fs.readFileSync('build/Legend-of-Aethra.user.js', 'utf8').replace("document.addEventListener('aethra-music:ready'", "window.AE = AE; document.addEventListener('aethra-music:ready'"), ST = fs.readFileSync('build/Legend-of-Aethra-Soundtrack.user.js', 'utf8');
const TA = fs.existsSync('../torn-arcade.user.js/Torn-Arcade.user.js') ? fs.readFileSync('../torn-arcade.user.js/Torn-Arcade.user.js', 'utf8') : null;
const wait = ms => new Promise(r => setTimeout(r, ms));
async function page(b, order) {
  const p = await b.newPage({ viewport: { width: 1100, height: 800 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**/*', r => r.request().url().startsWith('https://www.torn.com/') ? r.fulfill({ body: '<html><body style="background:#222"></body></html>', contentType: 'text/html' }) : r.abort());
  await p.goto('https://www.torn.com/index.php');
  await p.evaluate(() => { const st = {}; window.GM_getValue = (k, d) => (k in st ? st[k] : d); window.GM_setValue = (k, v) => { st[k] = v; }; window.GM_deleteValue = k => { delete st[k]; }; window.GM_registerMenuCommand = (n, f) => { window.__menus = window.__menus || {}; window.__menus[n] = f; }; window.GM_info = { script: { version: 'x' } }; window.unsafeWindow = window; });
  for (const s of order) if (s) await p.addScriptTag({ content: s });
  await wait(600);
  return { p, errs };
}
// meter: RMS and peak after the limiter, over ms milliseconds
const meter = (p, ms) => p.evaluate(ms => new Promise(res => {
  const A = AE.Audio, c = A.ctx; if (!c) return res({ none: 1 });
  const an = c.createAnalyser(); an.fftSize = 2048; (A.limiter || A.master).connect(an); const d = new Float32Array(2048); let sum = 0, n = 0, pk = 0;
  const iv = setInterval(() => { an.getFloatTimeDomainData(d); for (const v of d) { sum += v * v; n++; pk = Math.max(pk, Math.abs(v)); } }, 40);
  setTimeout(() => { clearInterval(iv); an.disconnect(); res({ rms: +(Math.sqrt(sum / Math.max(1, n))).toFixed(4), peak: +pk.toFixed(3), state: c.state }); }, ms);
}), ms);
const open = p => p.evaluate(() => { const f = (window.__menus || {})['Play Legend of Aethra']; if (f) f(); else throw new Error('no menu command'); });
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const R = {};
  // 1. Soundtrack first, then the game; open from the menu
  let { p, errs } = await page(b, [ST, GAME, TA]);
  await open(p); await wait(2500);
  R.tracksArrived = await p.evaluate(() => Object.keys(AE.MUSIC || {}).length);
  R.titleMusic = await p.evaluate(() => [AE.Music.cur, !!AE.Music.src]); R.titleLevel = await meter(p, 1200);
  // 2. a loud battle with effects firing: the limiter must hold the peak under full scale
  await p.evaluate(() => { AE.newGame(); for (let i = 0; i < 5; i++) AE.game.step(); AE.game.scenes = []; ['kael', 'lyra', 'bram'].forEach(id => AE.joinMember(id, 40)); AE.setParty(['kael', 'lyra', 'bram']);
    AE.startBattle({ enemies: ['nyxar2'], boss: 1 }, { canLose: 1 }); window.__fx = setInterval(() => ['boom', 'quake', 'spell_fire', 'hit', 'surge'].forEach(n => AE.Sfx.play(n)), 120); });
  await wait(2500); R.battle = await meter(p, 3000); await p.evaluate(() => clearInterval(window.__fx));
  // 3. mute and volume from the phone
  await p.evaluate(() => document.dispatchEvent(new CustomEvent('aethra:mute', { detail: JSON.stringify({ muted: true }) })));
  R.muted = await meter(p, 800);
  await p.evaluate(() => { document.dispatchEvent(new CustomEvent('aethra:mute', { detail: JSON.stringify({ muted: false }) })); document.dispatchEvent(new CustomEvent('aethra:volume', { detail: JSON.stringify({ volume: 25 }) })); });
  R.vol25 = await meter(p, 1500);
  await p.evaluate(() => document.dispatchEvent(new CustomEvent('aethra:volume', { detail: JSON.stringify({ volume: 100 }) })));
  // 4. the Music option in the menu changes the playing track's level at once
  await p.evaluate(() => { AE.S_.cfg.music = 0.5; AE.Music.setLevel(); }); R.musicLow = await meter(p, 1500); await p.evaluate(() => { AE.S_.cfg.music = 1; AE.Music.setLevel(); });
  // 5. many areas in a row: only a few decoded tracks stay in memory
  R.decodedBefore = await p.evaluate(() => Object.keys(AE.Audio.buf).filter(k => k.indexOf('mus:') === 0).length);
  for (const t of ['world', 'town', 'halcyon', 'sumps', 'frost', 'desert', 'lumen', 'cave', 'temple', 'reactor']) { await p.evaluate(t => AE.Music.play(t), t); await wait(700); }
  R.decodedAfter10 = await p.evaluate(() => Object.keys(AE.Audio.buf).filter(k => k.indexOf('mus:') === 0).length);
  R.lastPlaying = await p.evaluate(() => [AE.Music.cur, !!AE.Music.src]);
  // 6. close (the engine sleeps) and open again (music comes back)
  await p.evaluate(() => AE.host.close()); await wait(800); R.closed = await p.evaluate(() => AE.Audio.ctx.state);
  await open(p); await wait(1500); R.reopened = await p.evaluate(() => [AE.Audio.ctx.state, AE.Music.cur, !!AE.Music.src]);
  // 7. jingles come from the Soundtrack
  await p.evaluate(() => AE.Music.play('victory')); await wait(800); R.victoryJingle = await p.evaluate(() => [AE.Music.jingle, !!AE.Music.src]);
  R.errors1 = errs.slice(0, 3); await p.close();
  // 8. the game first, the Soundtrack much later (after the game is already open)
  ({ p, errs } = await page(b, [GAME, TA]));
  await open(p); await wait(1500); R.lateBefore = await p.evaluate(() => Object.keys(AE.MUSIC || {}).length);
  await p.addScriptTag({ content: ST }); await wait(2500);
  R.lateAfter = await p.evaluate(() => [Object.keys(AE.MUSIC || {}).length, AE.Music.cur, !!AE.Music.src]);
  R.errors2 = errs.slice(0, 3); await p.close();
  // 9. no Soundtrack at all: effects still play, the victory jingle falls back to the built-in one, nothing breaks
  ({ p, errs } = await page(b, [GAME, TA]));
  await open(p); await wait(1500);
  await p.evaluate(() => { window.__fx = setInterval(() => AE.Sfx.play('hit'), 100); }); R.noSoundtrackFx = await meter(p, 1000); await p.evaluate(() => clearInterval(window.__fx));
  await p.evaluate(() => AE.Music.play('victory')); await wait(600); R.noSoundtrackJingle = await p.evaluate(() => [AE.Music.jingle, !!AE.Music.src]);
  R.errors3 = errs.slice(0, 3);
  console.log(JSON.stringify(R, null, 1)); await b.close();
})();
