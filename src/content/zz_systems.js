/* ================= Talonbird breeding (Plumage Isle) =================
   Like FF7's chocobo farm: pair your bird with a bought mate, feed them a nut, and the chick may be born a
   better colour. Yellow -> Blue -> Green -> Black -> Gold. Each colour runs faster; a Gold chick is the Gold
   Talonbird itself (the other way to earn her, besides the S-rank races). */
(function () {
  const EV = AE.EV, sayAs = function (n, t) { return AE.say(t, { name: n }); };
  Object.assign(AE.ITEMS, {
    lunar_nut: { name: 'Lunar Nut', price: 1500, field: 'feed', desc: 'Breeding nut. Can bring a Blue chick.' },
    sun_nut: { name: 'Sun Nut', price: 4000, field: 'feed', desc: 'Breeding nut. Can bring a Green chick.' },
    storm_nut: { name: 'Storm Nut', price: 9000, field: 'feed', desc: 'Breeding nut. Can bring a Black chick.' },
    star_nut: { name: 'Star Nut', price: 20000, field: 'feed', desc: 'Breeding nut. Can bring a Gold chick.' },
  });
  const COL = ['Yellow', 'Blue', 'Green', 'Black', 'Gold'], NUT = [null, 'lunar_nut', 'sun_nut', 'storm_nut', 'star_nut'];
  const MATES = [['a farm hen', 2000, 0], ['a river runner', 6000, 1], ['a ridge climber', 12000, 2], ['a storm-black cock', 25000, 3]];
  const NAMES = ['Pip', 'Dandelion', 'Comet', 'Juniper', 'Blaze', 'Saffron', 'Tempest', 'Nimbus', 'Sorrel', 'Aurum'];
  const breed0 = EV.a5_breeder;
  EV.a5_breeder = async function () {
    const S = AE.S_;
    if (!S.mybird) return breed0.apply(this, arguments);
    S.mybird.col = S.mybird.col || 0;
    const r = await AE.ask('CHOCO-WEN: What\'ll it be for ' + S.mybird.name + ' (' + COL[S.mybird.col] + ')?', ['Train', 'Breed', 'Buy nuts', 'Leave'], { name: 'CHOCO-WEN', cancel: 3 });
    if (r === 0) return breed0.apply(this, arguments);
    if (r === 2) {
      const c = await AE.ask('Nuts: Lunar 1,500 / Sun 4,000 / Storm 9,000 / Star 20,000 Gil.', ['Lunar Nut', 'Sun Nut', 'Storm Nut', 'Star Nut', 'None'], { name: 'CHOCO-WEN', cancel: 4 });
      if (c === 4 || c < 0) return; const id = NUT[c + 1];
      if (!AE.pay(AE.ITEMS[id].price)) { await sayAs('CHOCO-WEN', 'Not enough Gil, dear.'); return; }
      await AE.gain(id, 1); return;
    }
    if (r !== 1) return;
    if (S.mybird.col >= 4) { await sayAs('CHOCO-WEN', 'A Gold bird? There\'s nothing finer to breed. Go and fly her.'); return; }
    const m = await AE.ask('A mate for ' + S.mybird.name + '?', MATES.map(function (x) { return x[0] + ' (' + AE.fmt(x[1]) + ')'; }).concat(['None']), { name: 'CHOCO-WEN', cancel: 4 });
    if (m < 0 || m >= 4) return;
    const nuts = NUT.slice(1).filter(function (n) { return (S.inv[n] || 0) > 0; });
    if (!nuts.length) { await sayAs('CHOCO-WEN', 'They need a nut to get in the mood. I sell them.'); return; }
    const ni = await AE.ask('Which nut?', nuts.map(function (n) { return AE.ITEMS[n].name; }).concat(['None']), { name: 'CHOCO-WEN', cancel: nuts.length });
    if (ni < 0 || ni >= nuts.length) return;
    if (!AE.pay(MATES[m][1])) { await sayAs('CHOCO-WEN', 'The mate\'s owner wants paying first.'); return; }
    const nut = nuts[ni], tier = NUT.indexOf(nut); S.inv[nut]--;
    await AE.say('The birds are left in the nest overnight...');
    // the chick: a better colour if the mate is good enough and the nut is strong enough
    const cur = S.mybird.col, mateT = MATES[m][2];
    const up = tier === cur + 1 && mateT >= cur ? 1 : 0;
    const col = Math.min(4, cur + up), name = NAMES[(S.stats.battles + col * 3) % NAMES.length];
    const chick = { name: name, col: col, spd: Math.min(12, (S.mybird.spd + 7 + mateT) / 2 + 0.6 + col * 0.4), sta: Math.min(120, Math.round((S.mybird.sta + 70 + mateT * 10) / 2) + 6) };
    S.stable = S.stable || []; S.stable.push(S.mybird); S.mybird = chick; AE.Sfx.play('secret');
    await AE.notice('A ' + COL[col] + ' chick hatched! Its name is ' + name + '. Speed ' + chick.spd.toFixed(1) + ', stamina ' + chick.sta + '.');
    if (!up) await sayAs('CHOCO-WEN', cur < 4 ? 'To get a ' + COL[cur + 1] + ' one you need a ' + AE.ITEMS[NUT[cur + 1]].name + ' and a mate at least as good as your bird.' : '');
    if (col === 4 && !S.vehicles.gtalon) {
      await sayAs('CHOCO-WEN', 'Gold! In all my years... She\'ll cross mountains and shallow seas for you.');
      const p = AE.WORLD.places.talon_isle, q = AE.landNear(p[0] + 2, p[1] + 2); S.vehicles.gtalon = { x: q[0], y: q[1], have: 1 };
      AE.quest && AE.quest('races', 'done');
    }
  };
})();
