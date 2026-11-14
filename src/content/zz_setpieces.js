/* ================= Set pieces: the submersible run into the Coral Sanctum, the Skylark's first flight north ================= */
(function () {
  const cs = AE.cs, EV = AE.EV, F = function () { return AE.S_.flags; };
  const run = async function (theme, secs, intro, after, gold) {
    for (const [who, line] of intro) await (who ? cs.s(who, line) : AE.say(line));
    for (;;) { const r = await AE.chase({ theme: theme, secs: secs }); if (r === 'win') break; await AE.ask('Again?', ['Again!'], { name: 'TIP' }); }
    AE.S_.gold += gold; AE.Sfx.play('coin'); await AE.notice('Salvaged ' + gold + ' Gil from the wreckage.');
    for (const [who, line] of after) await (who ? cs.s(who, line) : AE.say(line));
  };
  EV['enter:coral_1'] = async function () {
    if (F().sea_run) return; cs.flag('sea_run'); cs.music('battle');
    await run('sea', 50, [[null, 'Halfway down to the Sanctum, the sonar pings: Aurex divers on sea-sleds, cutting towards the submersible.'], ['sable', 'Kestra said not to scratch her! Kael, out the airlock, keep them off the hull!']],
      [['sable', 'Not a scratch. Well. One scratch. Kestra will never know.']], 2500);
    cs.music('water');
  };
  const fg = EV['place:frostgate'];
  EV['place:frostgate'] = async function (w) {
    if (!F().sky_run && F().a3_done) {
      w.busy = true; cs.flag('sky_run'); AE.Music.play('battle');
      await run('sky', 55, [[null, 'Over the northern sea, Aurex gunships rise out of the cloud. Grapples bite into the Skylark\'s rails.'], ['bram', 'Boarders! Everyone on deck! Kid, take the starboard rail!']],
        [['rook', 'Hull integrity acceptable. Morale: elevated.'], ['bram', 'HA! Let them try that again!']], 3500);
      w.busy = false; AE.Music.play('airship');
    }
    if (fg) return fg.apply(this, arguments);
    w.busy = false; w.enterPlace('frostgate', true);
  };
})();
