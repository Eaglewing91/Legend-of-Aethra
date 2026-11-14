/* ================= Cutscene helpers =================
   Story events are async functions: await AE.say(...), await walk('lyra', 'RRUU'), await battle(...). People in a
   scene are field actors (map npcs by id, the leader as 'hero', or actors added with spawn()). */
AE.cs = {
  f: function () { return AE.field(); },
  // find an actor: 'hero', an npc id from the map, or a spawned actor
  a: function (id) { const f = AE.field(); if (!f) return null; if (id === 'hero') return f.player; return f.npcs.find(function (n) { return n.id === id; }) || null; },
  spawn: function (id, who, x, y, dir, o) { const f = AE.field(); const a = new AE.Actor(Object.assign({ x: x, y: y, dir: dir === undefined ? 2 : dir, who: who, cast: !!(AE.MS && AE.MS[who] && AE.MS[who].idle), def: { still: 1 }, id: id, home: [x, y], wait: 9e9 }, o || {})); f.npcs.push(a); return a; },
  remove: function (id) { const f = AE.field(); f.npcs = f.npcs.filter(function (n) { return n.id !== id; }); },
  hide: function (id, v) { const a = AE.cs.a(id); if (a) a.hidden = v === undefined ? true : v; },
  face: function (id, d) { const a = AE.cs.a(id); if (a) a.dir = typeof d === 'number' ? d : 'URDL'.indexOf(d); },
  // walk a path of letters U R D L (repeat counts allowed: 'R3U2'); speed 1 walk, 2 run; ignores collisions
  walk: async function (id, path, speed) {
    const a = AE.cs.a(id); if (!a) return;
    const steps = []; path.replace(/([URDL])(\d*)/g, function (_, d, n) { for (let i = 0; i < (+n || 1); i++) steps.push('URDL'.indexOf(d)); });
    for (const d of steps) {
      a.dir = d; const D = AE.DIRS[d]; a.x += D.x; a.y += D.y; a.moving = true; a.speed = speed || 1;
      await AE.until(function () { return !a.moving; });
    }
    if (id === 'hero') { AE.S_.x = a.x; AE.S_.y = a.y; }
  },
  // walk several at once
  together: function (list) { return Promise.all(list.map(function (l) { return AE.cs.walk(l[0], l[1], l[2]); })); },
  emote: async function (id, e, frames) { const a = AE.cs.a(id); if (!a) return; a.emote = e; await AE.wait(frames || 50); a.emote = null; },
  jump: async function (id) { const a = AE.cs.a(id); if (!a) return; for (let i = 0; i < 12; i++) { a.hop = -Math.sin(i / 11 * Math.PI) * 6; await AE.wait(1); } a.hop = 0; },
  pose: function (id, anim) { const a = AE.cs.a(id); if (a) { a.pose = anim; a.anim = 0; } },
  shake: async function (n) { const f = AE.field(); if (f) f.shake = n || 30; AE.Sfx.play('quake'); await AE.wait(n || 30); },
  flash: async function () { AE.game.flash = 12; await AE.wait(12); },
  // camera: lock on a tile, or follow the hero again
  pan: async function (x, y, frames) {
    const f = AE.field(); const sx = f.cam.x, sy = f.cam.y, tx = AE.clamp(x * 16 + 8 - AE.W / 2, 0, f.map.w * 16 - AE.W), ty = AE.clamp(y * 16 + 8 - AE.H / 2, 0, f.map.h * 16 - AE.H);
    f.camLock = true; frames = frames || 40;
    for (let i = 1; i <= frames; i++) { const k = i / frames, e = k * k * (3 - 2 * k); f.cam.x = sx + (tx - sx) * e; f.cam.y = sy + (ty - sy) * e; await AE.wait(1); }
  },
  follow: function () { const f = AE.field(); if (f) f.camLock = false; },
  warp: async function (map, x, y, dir) { await AE.game.fadeOut(0.08); const f = AE.field(); f.load(map, x, y, dir); f.title = 100; await AE.game.fadeIn(0.08); },
  title: async function (text, sub, frames) {
    const s = { kind: 'title-card', t: 0, update: function () { this.t++; }, draw: function (ctx) {
      const a = Math.min(1, this.t / 30, (frames - this.t) / 30); ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 86, AE.W, 50); AE.text(ctx, text, AE.W / 2, 96, '#ffe8a0', { align: 'center' }); if (sub) AE.text(ctx, sub, AE.W / 2, 114, '#c0c8e0', { align: 'center' }); ctx.globalAlpha = 1; } };
    frames = frames || 180; AE.game.push(s); await AE.wait(frames); AE.game.pop(s);
  },
  // full-screen text on black (narration, chapter cards)
  narrate: async function (lines) {
    const s = { kind: 'narrate', opaque: true, i: 0, t: 0, update: function (g) { this.t++; if (this.t > 30 && (g.input.pressed.ok || this.t > 60 + lines[this.i].length * 3)) { this.i++; this.t = 0; } }, draw: function (ctx) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, AE.W, AE.H); const L = lines[Math.min(this.i, lines.length - 1)] || ''; const a = Math.min(1, this.t / 20); ctx.globalAlpha = a;
      AE.wrap(L, 210).forEach(function (l, k, arr) { AE.text(ctx, l, AE.W / 2, AE.H / 2 - arr.length * 6 + k * 12, '#e0e4f0', { align: 'center' }); }); ctx.globalAlpha = 1; } };
    AE.game.push(s); await AE.until(function () { return s.i >= lines.length; }); AE.game.pop(s);
  },
  battle: function (enemies, o) { o = o || {}; return AE.startBattle(Object.assign({ enemies: enemies }, o), o); },
  join: async function (id, lv, quiet) {
    const S = AE.S_; const m = AE.joinMember(id, lv || Math.max(1, Math.round(AE.partyMembers().reduce(function (a, m) { return a + m.lv; }, 0) / Math.max(1, AE.partyMembers().length))));
    if (S.party.indexOf(id) < 0 && S.reserve.indexOf(id) < 0) { if (S.party.length < 3) S.party.push(id); else S.reserve.push(id); }
    if (!quiet) { AE.Sfx.play('save'); await AE.notice(AE.CHARS[id].name + ' joined the party!'); }
    return m;
  },
  leave: function (id) { const S = AE.S_; S.party = S.party.filter(function (p) { return p !== id; }); S.reserve = S.reserve.filter(function (p) { return p !== id; }); },
  music: function (n) { AE.S_.musicOverride = n || null; if (AE.Music) AE.Music.play(n || (AE.field() ? AE.field().map.d.music : 'world')); },
  flag: function (f, v) { AE.setFlag(f, v); const fl = AE.field(); if (fl) fl.map.applyVariants(); },
  chapter: function (n) { AE.S_.chapter = Math.max(AE.S_.chapter, n); },
  // a line from a named speaker: s('lyra', 'Hello!') -> say with the name box
  s: function (who, text, o) { const C = AE.CHARS[who]; return AE.say(text, Object.assign({ name: (C ? C.name : who).toUpperCase() }, o || {})); }
};
// field camera: respect a locked camera during cutscenes
(function () {
  const cf = AE.Field.prototype.camFollow;
  AE.Field.prototype.camFollow = function () { if (this.camLock) return; return cf.call(this); };
})();
