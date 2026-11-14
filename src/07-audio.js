/* ================= Sound and music =================
   Sound effects are small clips built into the game; music comes from the optional Soundtrack scripts (or the dev
   page). Logical track names (town, battle...) map to the tracks; jingles play once and return to the field music. */
AE.Audio = { ctx: null, master: null, vol: 0.8, muted: false, buf: {} };
AE.ac = function () {
  const A = AE.Audio;
  if (!A.ctx) {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    A.ctx = new C(); A.master = A.ctx.createGain(); A.master.gain.value = A.muted ? 0 : A.vol; A.master.connect(A.ctx.destination);
  }
  if (A.ctx.state === 'suspended') A.ctx.resume();
  return A.ctx;
};
AE.setVolume = function (v) { const A = AE.Audio; A.vol = AE.clamp(v, 0, 1); if (A.master) A.master.gain.value = A.muted ? 0 : A.vol; };
AE.setMuted = function (m) { const A = AE.Audio; A.muted = !!m; if (A.master) A.master.gain.value = A.muted ? 0 : A.vol; };
AE.b64buf = function (b64) { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; };
AE.decode = function (key, b64) {
  const A = AE.Audio, c = AE.ac(); if (!c || !b64) return Promise.resolve(null);
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
// logical names -> soundtrack keys
AE.TRACKS = {
  title: 'intro', story: 'story', town: 'village', village: 'calm_village', city: 'manor', slums: 'lost_village', world: 'adventure', road: 'road',
  battle: 'fight', boss: 'fight2', dungeon: 'dungeon', cave: 'cave', reactor: 'tension', factory: 'tension', sad: 'sad', temple: 'temple',
  mystic: 'mystical', forest: 'dark_forest', clearing: 'clearing', boat: 'boat', sea: 'boat', water: 'aquatic', desert: 'sunny', final: 'final_area',
  castle: 'dark_castle', ruins: 'ruins', crypt: 'crypt', curse: 'curse', dream: 'dream', airship: 'ascension', spire: 'good_time', revelation: 'revelation',
  lament: 'lament', ending: 'end_theme', credits: 'credit', melancholy: 'melancholia', chill: 'chill', peaceful: 'peaceful', quiet: 'quiet', snow: 'quiet',
  victory: '#victory', gameover: '#gameover', levelup: '#levelup'
};
AE.Music = {
  cur: null, src: null, gain: null, want: null, jingle: false,
  play: function (name) {
    if (!name) return;
    if (name === this.cur && !this.jingle) return;
    const key = AE.TRACKS[name] || name, self = this;
    this.cur = name; this.want = key;
    const c = AE.ac(); if (!c) return;
    const isJ = key[0] === '#', data = isJ ? (AE.SFX || {})[key.slice(1)] : (AE.MUSIC || {})[key];
    this.stop(0.25);
    if (!data) return;
    this.jingle = isJ;
    AE.decode('mus:' + key, data).then(function (buf) {
      if (!buf || self.want !== key) return;
      const s = c.createBufferSource(), g = c.createGain(); s.buffer = buf; s.loop = !isJ;
      const v = (AE.S_ && AE.S_.cfg ? AE.S_.cfg.music : 1) * 0.6;
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
