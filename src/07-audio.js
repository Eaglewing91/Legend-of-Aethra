/* ================= Sound and music =================
   Sound effects are small clips built into the game; music comes from the optional Soundtrack scripts (or the dev
   page). Logical track names (town, battle...) map to the tracks; jingles play once and return to the field music. */
AE.Audio = { ctx: null, master: null, vol: 0.8, muted: false, buf: {} };
AE.ac = function () {
  const A = AE.Audio;
  if (!A.ctx) {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    A.ctx = new C(); A.master = A.ctx.createGain(); A.master.gain.value = A.muted ? 0 : A.vol;
    // a brick-wall limiter before the speakers: music and effects together never clip (clipping is heard as crackle)
    try {
      const L = A.ctx.createDynamicsCompressor(); L.threshold.value = -6; L.knee.value = 3; L.ratio.value = 12; L.attack.value = 0.002; L.release.value = 0.2;
      // then a soft clipper: untouched below 0.8, rounded off above, so the output can never pass full scale
      const W = A.ctx.createWaveShaper(), n = 2049, cv = new Float32Array(n);
      for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1, ax = Math.abs(x); cv[i] = ax <= 0.8 ? x : Math.sign(x) * (0.8 + 0.19 * Math.tanh((ax - 0.8) / 0.19)); }
      W.curve = cv; W.oversample = '2x';
      const pre = A.ctx.createGain(); pre.gain.value = 0.9;   // a little headroom for the compressor's make-up gain
      A.master.connect(pre); pre.connect(L); L.connect(W); W.connect(A.ctx.destination); A.limiter = W;
    } catch (e) { A.master.connect(A.ctx.destination); }
  }
  if (A.ctx.state === 'suspended') A.ctx.resume();
  return A.ctx;
};
AE.setVolume = function (v) { const A = AE.Audio; A.vol = AE.clamp(v, 0, 1); if (A.master) A.master.gain.value = A.muted ? 0 : A.vol; };
AE.setMuted = function (m) { const A = AE.Audio; A.muted = !!m; if (A.master) A.master.gain.value = A.muted ? 0 : A.vol; };
AE.b64buf = function (b64) { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; };
AE.MUSIC_KEEP = 3;   // decoded music tracks kept in memory (the one playing and the last few)
AE.decode = function (key, b64) {
  const A = AE.Audio, c = AE.ac(); if (!c || !b64) return Promise.resolve(null);
  if (key.indexOf('mus:') === 0) {
    A.lru = (A.lru || []).filter(function (k) { return k !== key; }); A.lru.push(key);
    while (A.lru.length > AE.MUSIC_KEEP) delete A.buf[A.lru.shift()];
  }
  if (A.buf[key]) return A.buf[key];
  A.buf[key] = new Promise(function (res) { try { c.decodeAudioData(AE.b64buf(b64), res, function () { res(null); }); } catch (e) { res(null); } });
  return A.buf[key];
};
AE.Sfx = {
  last: {},
  play: function (name) {
    const c = AE.ac(); if (!c || AE.Audio.muted) return;
    const now = c.currentTime; if (this.last[name] && now - this.last[name] < 0.04) return; this.last[name] = now;
    if (name === 'text') return this.blip(880, 0.02, 0.03);
    if (name === 'move' && !(AE.SFX || {}).move) return this.blip(660, 0.03, 0.06);
    const b64 = (AE.SFX || {})[name] || (AE.SFX || {})[(AE.SFXALIAS || {})[name]];
    if (!b64) return;
    AE.decode('sfx:' + name, b64).then(function (buf) {
      if (!buf) return; const s = c.createBufferSource(), g = c.createGain(); g.gain.value = 0.55; s.buffer = buf; s.connect(g); g.connect(AE.Audio.master); s.start();
    });
  },
  blip: function (hz, len, vol) {
    const c = AE.ac(); const o = c.createOscillator(), g = c.createGain(); o.type = 'square'; o.frequency.value = hz;
    g.gain.setValueAtTime(vol, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + len);
    o.connect(g); g.connect(AE.Audio.master); o.start(); o.stop(c.currentTime + len + 0.01);
  }
};
// logical names -> soundtrack tracks (maps and scripts may also name a track directly). Jingles (#) play once.
AE.TRACKS = {
  title: 'prelude', story: 'story', town: 'town', village: 'town', city: 'halcyon', slums: 'sumps', world: 'world', road: 'quiet',
  battle: 'battle', boss: 'boss', dungeon: 'dungeon', cave: 'cave', reactor: 'reactor', factory: 'tower', sad: 'sorrow', temple: 'temple',
  mystic: 'mystic', mystical: 'lumen', forest: 'forest', clearing: 'peaceful', boat: 'sea', water: 'water', desert: 'desert',
  final: 'citadel', castle: 'castle', ruins: 'ruins', crypt: 'crypt', curse: 'memory', dream: 'memory', airship: 'airship', spire: 'gilded',
  revelation: 'vesper', lament: 'sorrow', ending: 'ending', credits: 'ending', melancholy: 'lyra', chill: 'tavern', peaceful: 'peaceful',
  quiet: 'quiet', snow: 'frost', tension: 'tension', victory: '#victory', gameover: '#gameover', levelup: '#levelup'
};
AE.Music = {
  cur: null, src: null, gain: null, want: null, jingle: false,
  level: function () { const m = AE.S_ && AE.S_.cfg && AE.S_.cfg.music !== undefined ? AE.S_.cfg.music : 1; return m * 0.85; },
  setLevel: function () { const c = AE.Audio.ctx; if (this.gain && c) { try { this.gain.gain.cancelScheduledValues(c.currentTime); this.gain.gain.setTargetAtTime(Math.max(0.0001, this.level()), c.currentTime, 0.05); } catch (e) {} } },
  play: function (name) {
    if (!name) return;
    if (name === this.cur && !this.jingle) return;
    const key = AE.TRACKS[name] || name, self = this;
    this.cur = name; this.want = key;
    const c = AE.ac(); if (!c) return;
    const isJ = key[0] === '#', data = isJ ? ((AE.MUSIC || {})[key.slice(1)] || (AE.SFX || {})[key.slice(1)]) : (AE.MUSIC || {})[key];
    this.stop(0.25);
    if (!data) return;
    this.jingle = isJ;
    AE.decode('mus:' + key, data).then(function (buf) {
      if (!buf || self.want !== key) return;
      const s = c.createBufferSource(), g = c.createGain(); s.buffer = buf; s.loop = !isJ;
      const v = AE.Music.level();
      g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(Math.max(0.001, v), c.currentTime + 0.4);
      s.connect(g); g.connect(AE.Audio.master); s.start(); self.src = s; self.gain = g;
    });
  },
  stop: function (fade) {
    const c = AE.Audio.ctx; if (!c || !this.src) return;
    const s = this.src, g = this.gain; this.src = null;
    try { g.gain.setValueAtTime(g.gain.value, c.currentTime); g.gain.linearRampToValueAtTime(0, c.currentTime + (fade || 0.01)); s.stop(c.currentTime + (fade || 0.01) + 0.02); } catch (e) {}
  },
  tick: function () {}
};
