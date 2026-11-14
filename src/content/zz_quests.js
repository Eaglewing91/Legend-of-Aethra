/* ================= Side quests across Acts II-V (the people added in tools/maps/z_people.py) ================= */
(function () {
  const cs = AE.cs, EV = AE.EV, F = function () { return AE.S_.flags; }, Q = AE.quest, S = function () { return AE.S_; };
  const sayAs = function (n, t) { return AE.say(t, { name: n }); };
  const kills = function (id) { return S().bestiary[id] || 0; };
  const K = function (id, name, desc) { AE.ITEMS[id] = { name: name, k: true, desc: desc }; };
  K('mill_gear', 'Mill Gear', 'A great iron gear from the Old Mine\'s workings. Thornbrook\'s mill needs one.');
  K('sealed_crate', 'Sealed Crate', 'A heavy crate for a merchant in Saltmere. Don\'t shake it.');
  K('coral_sample', 'Living Coral', 'A piece of coral from the Coral Sanctum, still faintly glowing.');
  Object.assign(AE.QUESTS, { mill: 'The Thornbrook mill', bears: 'Bears in the paddock', tip: 'The tipster\'s race', imps: 'Imps in the flags', crate: 'A crate for Saltmere',
    coral: 'The dying reef', stars: 'The stargazer', miner: 'The missing miner', bells: 'The bells of Lumen', flowsick: 'Flow-sickness', spar: 'Academy sparring', wardens: 'The Sky Wardens' });
  // a generic kill-count quest: start, count from the start, pay
  const hunt = function (id, giver, enemy, n, intro, done, reward) {
    return async function () {
      if (Q(id) === 'done') { await sayAs(giver, done[1]); return; }
      if (!Q(id)) { await sayAs(giver, intro); Q(id, 1); S()['from_' + id] = kills(enemy); return; }
      const got = kills(enemy) - (S()['from_' + id] || 0);
      if (got < n) { await sayAs(giver, (AE.ENEMIES[enemy] || {}).name + ': ' + got + ' of ' + n + '.'); return; }
      Q(id, 'done'); await sayAs(giver, done[0]); await reward();
    };
  };
  // Thornbrook: the mill gear
  EV.q_mill = async function () {
    if (Q('mill') === 'done') { await sayAs('MILLER BROM', 'Hear that? Grinding! First bread from our own flour in seven years.'); return; }
    if (AE.has('mill_gear')) { AE.take('mill_gear'); Q('mill', 'done'); await sayAs('MILLER BROM', 'That\'s the one! Iron from the old seam. Here, for your trouble.'); await AE.gain('hi_potion', 3); await AE.gain('prism:luck_plus'); return; }
    await sayAs('MILLER BROM', 'The mill\'s rebuilt but she won\'t turn. Cracked drive gear. There were spares in the Old Mine, before Aurex bought it. Lower shafts, if you go that way.');
    if (!Q('mill')) Q('mill', 1);
  };
  EV.q_bears = hunt('bears', 'FENCER', 'mossbear', 3, 'Moss Bears keep breaking my fences. Three of the brutes, out of Mistwood and the woods round here. Thin them out?',
    ['Three bears! The birds can sleep again. Here, the good feed.', 'Fences holding. Bears sulking.'], async function () { await AE.gain('sweetroot', 3); AE.S_.gold += 800; await AE.notice('Received 800 G'); });
  EV.q_tip = async function () {
    if (Q('tip') === 'done') { await sayAs('TIPSTER', 'I knew that bird had it in her. I always know. Mostly.'); return; }
    if (!S().mybird) { await sayAs('TIPSTER', 'Got a bird of your own? No? Kestrel Ranch has chicks. A rider with their own bird and a little luck could make me rich. I mean, us.'); return; }
    if ((S().raceRank || 0) >= 1) { Q('tip', 'done'); AE.tokens(1000); await sayAs('TIPSTER', 'You won a ranked race! I had a little bet on you. A big bet. Your cut: 1,000 tokens.'); return; }
    await sayAs('TIPSTER', 'Win a ranked race on Plumage Isle with that bird of yours, and I\'ll make it worth your while.');
    if (!Q('tip')) Q('tip', 1);
  };
  EV.q_imps = hunt('imps', 'FLAG KEEPER', 'galeimp', 6, 'Gale Imps tear down our prayer flags. They nest in the Wind Shrine. Six of them, Warden, and the flags will fly again.',
    ['The flags fly. The wind reads them. Take this, blessed by the Windkeepers.', 'Listen to them snap in the wind. Prayers, all of them.'], async function () { await AE.gain('prism:speed_plus'); });
  // Port Lark -> Saltmere: the crate
  EV.q_crate = async function () {
    if (Q('crate') === 'done') { await sayAs('SHIFTY SAILOR', 'Pleasure doing business. You never saw me.'); return; }
    if (Q('crate') === 1) { await sayAs('SHIFTY SAILOR', 'The merchant in Saltmere. Big hat. Don\'t open it.'); return; }
    const r = await AE.ask('SHIFTY SAILOR: You going to Saltmere? Take this crate to the merchant there. No questions. 2,000 G on delivery.', ['Take it', 'No'], { name: 'SHIFTY SAILOR', cancel: 1 });
    if (r === 0) { Q('crate', 1); await AE.gain('sealed_crate'); }
  };
  EV.q_crate_end = async function () {
    if (AE.has('sealed_crate')) { AE.take('sealed_crate'); Q('crate', 'done'); await sayAs('MERCHANT', 'Ah, my... spices. Yes. Spices. Here\'s your fee.'); AE.S_.gold += 2000; await AE.notice('Received 2,000 G'); return; }
    await sayAs('MERCHANT', 'Spices, silks, things that aren\'t spices or silks. Ask about anything. Except that.');
  };
  // Saltmere: the dying reef
  EV.q_coral = async function () {
    if (Q('coral') === 'done') { await sayAs('FISHER GIRL', 'The fish came back! Mum cried. Then she sold them.'); return; }
    if (F().a3_coral) { Q('coral', 'done'); await sayAs('FISHER GIRL', 'You went down to the Coral Sanctum? And the reef\'s singing again, a bit. You did that. Here, my lucky shell.'); await AE.gain('regen_charm'); return; }
    await sayAs('FISHER GIRL', 'The reef\'s dying. The Coral Sanctum stopped singing. Somebody has to go down and see why. Not me. I\'m nine.');
    if (!Q('coral')) Q('coral', 1);
  };
  EV.q_stars = async function () {
    if (Q('stars') === 'done') { await sayAs('STARGAZER', 'The new stars are still there, where the sky cracked. I\'ve named one after you. It\'s very small.'); return; }
    if (F().a3_orin) { Q('stars', 'done'); await sayAs('STARGAZER', 'You brought Orin Thale down from his tower! He taught me my first constellation, sixty years ago. Give him this, with my thanks. Or keep it. Orin hates presents.'); await AE.gain('mind_pendant'); return; }
    await sayAs('STARGAZER', 'Orin Thale, in his tower in the east desert, knows more about the sky than anyone alive. He hasn\'t come down in seven years.');
    if (!Q('stars')) Q('stars', 1);
  };
  // Frostgate: the missing miner
  EV.q_miner = async function () {
    if (Q('miner') === 'done') { await sayAs('WORRIED WIFE', 'He\'s home. He\'s grumpy. He\'s HOME.'); return; }
    if (F().q_miner_saved) { Q('miner', 'done'); await sayAs('WORRIED WIFE', 'You found him! The frozen lake level? That fool. Thank you, thank you.'); await AE.gain('elixir'); AE.S_.gold += 1500; await AE.notice('Received 1,500 G'); return; }
    await sayAs('WORRIED WIFE', 'My husband went down for the Aurex night shift three days ago. The frozen lake level. He hasn\'t come up.');
    if (!Q('miner')) Q('miner', 1);
  };
  EV.q_miner_found = async function () { cs.flag('q_miner_saved'); await sayAs('TRAPPED MINER', 'Light! Real people! My lamp died and I\'ve been sitting here counting icicles. Tell my wife I\'m coming. Slowly.'); };
  // Lumen: the five bells
  EV.q_bells = async function () {
    if (Q('bells') === 'done') { await sayAs('BELL WARDEN', 'Five bells, five notes. The village sleeps easy.'); return; }
    let n = 0; for (let i = 0; i < 5; i++) if (F()['bell' + i]) n++;
    if (n >= 5) { Q('bells', 'done'); await sayAs('BELL WARDEN', 'All five rung, and in tune! Ember\'s mother used to do that every evening. Take her silver bell, and her manual.'); await AE.gain('silver_bell'); await AE.gain('surge_manual_ember'); return; }
    await sayAs('BELL WARDEN', 'Five old bells guard Lumen\'s corners and its heart. Nobody has rung them since Ember\'s mother died. Ring them all. (' + n + ' of 5)');
    if (!Q('bells')) Q('bells', 1);
  };
  EV.q_bell = async function (e) { const k = 'bell' + ((e && e.n) || 0); AE.Sfx.play('echo'); if (!F()[k]) { cs.flag(k); await AE.say('The bell rings out, clear and cold.'); } else await AE.say('The bell hums, still warm from your hand.'); };
  // Mideel: flow-sickness
  EV.q_flowsick = async function () {
    if (Q('flowsick') === 'done') { await sayAs('NURSE', 'They\'re all sitting up and complaining about the food. Best sign there is.'); return; }
    if (AE.has('remedy') >= 3) { AE.take('remedy', 3); Q('flowsick', 'done'); await sayAs('NURSE', 'Three Remedies! That\'s enough for the whole ward. Here: the doctor said the one who helped should have this.'); await AE.gain('safety_bit'); return; }
    await sayAs('NURSE', 'Since the Sundering, people come up out of the shallows flow-sick: confused, forgetting. Remedies help. We need three.');
    if (!Q('flowsick')) Q('flowsick', 1);
  };
  // the Academy: sparring and the Sky Wardens
  EV.q_spar = async function () {
    const n = S().spar || 0;
    if (n >= 3) { await sayAs('SPARRING MASTER', 'You\'ve beaten my best three. Go and beat something that matters.'); return; }
    const r = await AE.ask('SPARRING MASTER: Sparring round ' + (n + 1) + ' of 3 against Academy instructors. No hard feelings, and no real blades. Mostly.', ['Spar', 'Later'], { name: 'SPARRING MASTER', cancel: 1 });
    if (r !== 0) return;
    const foes = [['secoff', 'secoff'], ['heavy', 'secoff', 'heavy'], ['voidknight']][n];
    const res = await AE.startBattle({ enemies: foes, bg: 'temple', noRun: 1 }, { canLose: 1 }); AE.healAll();
    if (res !== 'win') { await sayAs('SPARRING MASTER', 'Down you go! Up you get. Again when you\'re ready.'); return; }
    S().spar = n + 1;
    if (n + 1 === 3) { Q('spar', 'done'); await sayAs('SPARRING MASTER', 'Three for three. Here: the old siege manual. Captain Hollis will know what to do with it.'); await AE.gain('surge_manual_bram'); }
    else await sayAs('SPARRING MASTER', 'Not bad. Next round when you\'re ready.');
  };
  EV.q_wardens = async function () {
    const W = ['w_ashen', 'w_storm', 'w_frost', 'w_iron'], n = W.filter(function (w) { return F()['beat_' + w]; }).length;
    if (Q('wardens') === 'done') { await sayAs('ARCHIVIST', 'Four Sky Wardens, fallen. The sky is quieter. I have written it all down, beautifully.'); return; }
    if (S().chapter < 5) { await sayAs('ARCHIVIST', 'The Academy archives speak of Sky Wardens: guardians that wake when the Crystals die. Let us hope it is only a story.'); return; }
    if (n >= 4) { Q('wardens', 'done'); await sayAs('ARCHIVIST', 'All four roaming Wardens! The Chorus left a score in our archive for this day. The Chorus girl should have it.'); await AE.gain('surge_manual_lyra'); return; }
    await sayAs('ARCHIVIST', 'Four Sky Wardens roam the world: the Ashen Warden over the Ashfields and the mesa, the Storm Warden in northern Meridia, the Rime Warden in Nordheim, the Iron Warden in Solmara. ' + n + ' of 4 have fallen.');
    if (!Q('wardens')) Q('wardens', 1);
  };
  // Vesna's own manual comes with her quest
  const vq = EV.a5_mideel_doc;
  EV.a5_mideel_doc = async function () { const before = F().vesna_q; await vq.apply(this, arguments); if (!before && F().vesna_q) await AE.gain('surge_manual_vesna'); };
})();
