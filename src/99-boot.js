/* ================= Boot: unpack the data, decode the art, start ================= */
// gzip + base64 -> object (maps and the world are shipped compressed)
AE.unz = async function (b64) {
  const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  const txt = await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  return JSON.parse(txt);
};
// Draw at a whole-number scale that matches the screen (2x to 5x), so pixel art stays crisp and even. If the canvas is a
// little bigger than the space it's shown in, the browser shrinks it smoothly; it is only drawn 'pixelated' when it has
// to be enlarged. Low detail keeps the cheap 2x.
AE.fitCanvas = function (g) {
  const c = g && g.canvas; if (!c) return;
  const r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  if (r.width < 8 || r.height < 8) return;
  const need = Math.min(r.width / AE.W, r.height / AE.H) * dpr;
  const low = AE.S_ && AE.S_.cfg && AE.S_.cfg.lowfx, max = low ? 2 : 5;
  const S = Math.max(2, Math.min(max, Math.ceil(need - 0.05)));
  if (S !== AE.S) { AE.S = S; c.width = AE.W * S; c.height = AE.H * S; g.ctx.setTransform(S, 0, 0, S, 0, 0); g.ctx.imageSmoothingEnabled = false; }
  c.style.imageRendering = AE.S >= need ? 'auto' : 'pixelated';
};
AE.boot = async function (host, data, opts) {
  opts = opts || {};
  if (data.mapsz) { data.maps = await AE.unz(data.mapsz); delete data.mapsz; }
  if (data.worldz) { data.world = await AE.unz(data.worldz); delete data.worldz; }
  AE.VERSION = data.version; AE.SHEETS = data.sheets; AE.FILL_ORDER = data.fills; AE.FXMETA = data.fx; AE.MS = data.ms || null; AE.BOSSFW = data.bossfw || {}; AE.SIDES = data.sides || {};
  AE.MAPS = data.maps; AE.WORLD = data.world; AE.SFX = data.sfx || {}; AE.MUSIC = Object.assign(AE.MUSIC || {}, data.music || {});
  const canvas = document.createElement('canvas'); canvas.className = 'ae-canvas'; host.appendChild(canvas);
  canvas.style.imageRendering = 'pixelated'; canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.style.objectFit = 'contain'; canvas.tabIndex = 0;
  const g = new AE.Game(canvas);
  AE.fitCanvas(g); try { new ResizeObserver(function () { AE.fitCanvas(g); }).observe(canvas); } catch (e) {} window.addEventListener('resize', function () { AE.fitCanvas(g); });
  const keys = Object.keys(data.art); let left = keys.length;
  return new Promise(function (res) {
    const ready = function () {
      AE.S_ = AE.newState();
      g.push(new AE.Title()); g.start(); res(g);
    };
    keys.forEach(function (k) {
      const im = new Image(); im.onload = im.onerror = function () { AE.IMG[k] = im; if (--left === 0) ready(); };
      im.src = 'data:image/png;base64,' + data.art[k];
    });
    if (!keys.length) ready();
    const kd = function (e) { if (!g.running || (opts.active && !opts.active())) return; if (g.input.key(e.code, true)) { e.preventDefault(); e.stopPropagation(); AE.ac(); } };
    const ku = function (e) { if (g.input.key(e.code, false)) { e.preventDefault(); } };
    window.addEventListener('keydown', kd, true); window.addEventListener('keyup', ku, true);
    window.addEventListener('blur', function () { g.input.clear(); });
    g.unbind = function () { window.removeEventListener('keydown', kd, true); window.removeEventListener('keyup', ku, true); };
  });
};
AE.newGame = function () {
  const S = AE.S_ = AE.newState(); S.playing = true;
  AE.joinMember('kael', 1);
  (AE.START && AE.START.inv || {}) && Object.keys((AE.START && AE.START.inv) || {}).forEach(function (k) { AE.addItem(k, AE.START.inv[k]); });
  const st = AE.START || { map: Object.keys(AE.MAPS)[0], x: 5, y: 5 };
  AE.game.push(new AE.Field(st.map, st.x, st.y, st.dir || 2));
  if (AE.EV['newgame']) AE.field().run('newgame');
};
