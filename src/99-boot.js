/* ================= Boot: unpack the data, decode the art, start ================= */
AE.boot = function (host, data, opts) {
  opts = opts || {};
  AE.VERSION = data.version; AE.SHEETS = data.sheets; AE.FILL_ORDER = data.fills; AE.FXMETA = data.fx; AE.MS = data.ms || null; AE.BOSSFW = data.bossfw || {};
  AE.MAPS = data.maps; AE.SFX = data.sfx || {}; AE.MUSIC = Object.assign(AE.MUSIC || {}, data.music || {});
  const canvas = document.createElement('canvas'); canvas.className = 'ae-canvas'; host.appendChild(canvas);
  canvas.style.imageRendering = 'pixelated'; canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.style.objectFit = 'contain'; canvas.tabIndex = 0;
  const g = new AE.Game(canvas);
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
