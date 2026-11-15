/* ================= Battle music by foe =================
   Most fights use the battle or boss theme. Some foes have their own: Vesper's waltz ("One, Two, Three"), Nyxar's
   final battle ("The Last Memory"), and "Those Who Stand" for Drago's duels and the roaming Weapons. */
(function () {
  const pick = function (ids) {
    if (ids.some(function (id) { return /^nyxar/.test(id); })) return 'nyxar';
    if (ids.some(function (id) { return /^vesper\d/.test(id); })) return 'vesper_battle';
    if (ids.some(function (id) { return /^drago\d|^w_/.test(id); })) return 'fierce';
    return null;
  };
  const sb = AE.startBattle;
  AE.startBattle = function (form, o) {
    if (form && !form.music && form.enemies) { const m = pick(form.enemies); if (m) form = Object.assign({}, form, { music: m }); }
    return sb.call(this, form, o);
  };
  AE.battleMusicFor = pick;
})();
