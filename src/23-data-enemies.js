/* ================= Enemies, enemy skills and encounter tables =================
   art: {mon: 'Slime', hue, k} | {boss: 'GiantSlime', anim, fw, fh, k} | {cast: 'trooper'} */
AE.ENEMIES = {};
AE.SKILLS = {};
AE.SPECIALS = {};
AE.ENC = {};
AE.SHOPS = {};
// E(id, name, lv, hp, atk, def, mag, mdef, spd, exp, ap, gold, art, extra)
AE.E = function (id, name, lv, hp, atk, def, mag, mdef, spd, exp, ap, gold, art, extra) {
  AE.ENEMIES[id] = Object.assign({ name: name, lv: lv, hp: hp, atk: atk, def: def, mag: mag, mdef: mdef, spd: spd, exp: exp, ap: ap, gold: gold, art: art, mp: 60 }, extra || {});
};
AE.K = function (id, o) { AE.SKILLS[id] = o; };
