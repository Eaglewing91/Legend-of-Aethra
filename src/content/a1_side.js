/* ================= Act I: side quests, the Pit, bounties, Arcana players, inns ================= */
(function () {
  const cs = AE.cs, EV = AE.EV, F = function () { return AE.S_.flags; }, Q = AE.quest;
  const sayAs = function (name, t) { return AE.say(t, { name: name }); };
  AE.QUESTS.tam = 'Medicine for Tam';
  AE.QUESTS.pell = 'A letter for Granny Osk';
  AE.QUESTS.hask = 'Old Hask\'s badge';
  AE.QUESTS.pit = 'Champion of the Pit';
  AE.QUESTS.b_rustback = 'Bounty: Rustback';
  AE.QUESTS.b_leviathan = 'Bounty: the Sump Leviathan';

  EV.inn_sumps = function () { return AE.inn(40, 'INNKEEPER'); };

  // ---------- Tam's medicine: Ada Teller -> Doc Marrow -> a Glowcap from Drain 9 ----------
  EV.a1_ada = async function () {
    if (Q('tam') === 'done') { await sayAs('ADA TELLER', 'Tam\'s eating again. Eating everything. I\'ll never be able to thank you enough. So I won\'t try. I\'ll just make you soup, forever.'); return; }
    if (AE.has('tam_medicine')) {
      AE.take('tam_medicine'); Q('tam', 'done'); cs.flag('q_tam_done');
      await sayAs('ADA TELLER', 'Doc Marrow\'s tonic! Oh, oh, thank you. Tam, love, drink this. All of it. Yes, I know it tastes like a drain.');
      await sayAs('ADA TELLER', 'Please, take these. Tam\'s father wore them when he worked the reactors. They kept the bad air out of him, at least for a while.');
      await AE.gain('star_pendant'); AE.S_.gold += 300; await AE.notice('Received 300 G');
      return;
    }
    await sayAs('ADA TELLER', 'My boy Tam has the reactor cough. Everyone on Lantern Row gets it in the end, but he\'s only eight.');
    await sayAs('ADA TELLER', 'Doc Marrow says he could make a tonic if he had the right mushroom. I can\'t go into the drains. I can\'t leave Tam.');
    if (!Q('tam')) Q('tam', 1);
  };
  EV.a1_marrow = async function () {
    if (Q('tam') === 'done' || AE.has('tam_medicine')) { await sayAs('DOC MARROW', 'Get that tonic to the Tellers. And come back if anything aches. Everything aches. That\'s the Sumps.'); return; }
    if (AE.has('glowcap')) {
      AE.take('glowcap'); await sayAs('DOC MARROW', 'A Glowcap! A fat one, too. Give me a minute with my mortar...');
      await AE.wait(40); AE.Sfx.play('heal'); await AE.gain('tam_medicine');
      await sayAs('DOC MARROW', 'One lung tonic. For the Teller boy, yes? Off you go.');
      return;
    }
    await sayAs('DOC MARROW', 'Sit, sit. Let me look at you. ...Fell from the plate? And not a broken bone. Remarkable. Ridiculous, but remarkable.');
    AE.healAll(); await AE.notice('Doc Marrow patches you up. The party is fully healed.');
    if (Q('tam')) await sayAs('DOC MARROW', 'The Teller boy? I need a Glowcap. It only grows deep in Drain 9, in the cisterns. Bring me one and I\'ll make his tonic.');
  };

  // ---------- Mrs Pell's letter ----------
  EV.a1_pell = async function () {
    if (Q('pell') === 'done') { await sayAs('MRS PELL', 'Osk sent a reply! Three pages. Two of them are about my handwriting.'); return; }
    if (Q('pell') === 1) { await sayAs('MRS PELL', 'Granny Osk lives on the east side of the Sumps. Thank you, dear.'); return; }
    await sayAs('MRS PELL', 'You\'re going back into the Sumps? Would you take this to Granny Osk? It\'s from her grandson.');
    await sayAs('MRS PELL', 'He works for Aurex up on the plate. He can\'t write it himself, they read the post. So he tells me, and I write it.');
    Q('pell', 1); await AE.gain('pell_letter');
  };
  EV.a1_osk = async function () {
    if (AE.has('pell_letter')) {
      AE.take('pell_letter'); Q('pell', 'done');
      await sayAs('GRANNY OSK', 'A letter? From... oh. Oh, he did write. He did. He says he\'s eating properly. He\'s lying. Bless him.');
      await sayAs('GRANNY OSK', 'Here. Take these. They were his. He won\'t need them up there.');
      await AE.gain('hi_potion', 2); await AE.gain('prism:luck_plus');
      return;
    }
    await sayAs('GRANNY OSK', Q('pell') === 'done' ? 'I read his letter every morning. My eyes are bad. I know it by heart anyway.' : 'My grandson went up the Spire Stair to work for Aurex. He sends money every month. He never writes.');
  };

  // ---------- Old Hask and his badge ----------
  EV.a1_hask = async function () {
    if (Q('hask') === 'done') { await sayAs('OLD HASK', 'Warden. Keep your oath, and the oath\'ll keep you. Mostly.'); return; }
    if (AE.has('hask_badge')) {
      AE.take('hask_badge'); Q('hask', 'done');
      await sayAs('OLD HASK', '...My badge. You beat Gorr. You actually beat that great walking wall.');
      await sayAs('OLD HASK', 'Thirty years a Warden. I lost this the night I bet it in the Pit, drunk and stupid, and Gorr took it off me with one swing.');
      await sayAs('OLD HASK', 'Take my old blade. It cut wind once. Maybe it\'ll remember how.');
      await AE.gain('wind_cutter');
      await sayAs('OLD HASK', 'And lad. Your stance. Academy-perfect, it is. But nobody fights like the book. Not unless the book is all they\'ve got.');
      return;
    }
    await sayAs('OLD HASK', 'An Academy pup! Sit. Sit. You want to hear about the Code?');
    await sayAs('OLD HASK', '"The contract is sacred. The client is not. Know the difference." First line of the oath. Took me twenty years to understand it.');
    await sayAs('OLD HASK', 'I had a badge once. Lost it to Gorr in the Pit. If you ever beat him, I\'d dearly like it back.');
    if (!Q('hask')) Q('hask', 1);
  };

  // ---------- the schoolroom ----------
  EV.a1_teacher = async function () {
    await sayAs('MISS ODELL', 'Good morning! We\'re doing geography. Children, who can tell the Warden where Meridia is?');
    await sayAs('MISS ODELL', '...Across the water to the east. Yes. I grew up there. In an orphanage in Thornbrook, called the Lantern House.');
    await sayAs('MISS ODELL', 'Mother Ilse ran it. She sewed our names into our coats. She used to say some of us would forget them otherwise.');
    if (AE.S_.party.indexOf('sable') >= 0) { await cs.s('sable', '...'); await sayAs('MISS ODELL', 'Have we met, miss? You look awfully familiar.'); await cs.s('sable', 'Nope. Got one of those faces.'); }
  };
  EV.a1_arcana_kid = async function () {
    if (!AE.has('card_deck')) { await sayAs('PUPIL', 'Do you play Arcana? You need a deck. The dealer at the Lucky Lantern gives them away. Market Ward!'); return; }
    await AE.Arcana.duel('kid');
  };

  // ---------- Arcana at the Lucky Lantern ----------
  EV.a1_arcana_dealer = async function () {
    if (!AE.has('card_deck')) {
      await sayAs('DEALER', 'Never played Arcana? Well, then. Every soul in Aethra should have a deck. House gift.');
      await AE.gain('card_deck');
      ['c_rat', 'c_slime', 'c_drone', 'c_trooper', 'c_hawk', 'c_crawler', 'c_bat'].forEach(function (c) { AE.S_.cards[c] = (AE.S_.cards[c] || 0) + 1; });
      await AE.notice('Received 7 Arcana cards');
      await sayAs('DEALER', 'Five cards a side on a three-by-three board. Each card has four numbers. Put yours next to mine, and if your side is bigger, my card turns your colour.');
      await sayAs('DEALER', 'Most cards on the board at the end wins. Winner takes one card from the loser. Talk to anyone with a deck to play.');
      return;
    }
    await AE.Arcana.duel('dealer');
  };
  EV.a1_arcana_noble = function () { return AE.has('card_deck') ? AE.Arcana.duel('noble') : sayAs('ARCANA PLAYER', 'No deck, no game. The dealer at the bar hands them out.'); };
  EV.a1_cardsharp = function () { return AE.has('card_deck') ? AE.Arcana.duel('sharp') : sayAs('CARD SHARP', 'Cards? You? Come back with a deck, kid.'); };

  // ---------- the Pit ----------
  const ROUNDS = [
    { foes: ['pit_brawler', 'pit_brawler'], prize: 200, name: 'the Ash Lane Brawlers' },
    { foes: ['pit_hound', 'pit_hound', 'pit_hound'], prize: 300, name: 'Vorn\'s Hounds' },
    { foes: ['pit_lizard', 'hawk'], prize: 400, name: 'a Drake and its handler\'s hawk' },
    { foes: ['pit_twin', 'pit_twin'], prize: 600, name: 'the Ogre Twins' },
    { foes: ['gorr'], prize: 2000, name: 'GORR THE UNBROKEN', boss: 1 }];
  EV.a1_pit = async function () {
    const k = Q('pit') === 'done' ? 5 : (Q('pit') || 0);
    if (k >= 5) {
      const r = await AE.ask('PITMASTER VORN: The champion returns! Want a rematch with Gorr, for the crowd? No prize but glory.', ['Fight Gorr', 'Not now'], { name: 'PITMASTER VORN', cancel: 1 });
      if (r === 0) await cs.battle(['gorr'], { bg: 'ruins', boss: 1 });
      return;
    }
    const R = ROUNDS[k];
    if (k === 0) await sayAs('PITMASTER VORN', 'Fresh meat! Five bouts. Win them all and you face Gorr the Unbroken. Lose, and you walk out. Or get carried.');
    const c = await AE.ask('PITMASTER VORN: Bout ' + (k + 1) + ' of 5: ' + R.name + '. Entry is 100 G. Prize ' + R.prize + ' G. Ready?', ['Fight', 'Not yet'], { name: 'PITMASTER VORN', cancel: 1 });
    if (c !== 0) return;
    if (!AE.pay(100)) { await sayAs('PITMASTER VORN', 'No money, no blood. Come back richer.'); return; }
    const res = await cs.battle(R.foes, { bg: 'ruins', boss: R.boss, noRun: 1, canLose: 1 });
    if (res !== 'win') { AE.healAll(); await sayAs('PITMASTER VORN', 'Carried out! Ha! The crowd loved it. Heal up and try again.'); return; }
    AE.S_.gold += R.prize; AE.Sfx.play('coin'); await AE.notice('Won ' + R.prize + ' G');
    if (k === 4) {
      Q('pit', 'done');
      await sayAs('PITMASTER VORN', 'GORR IS BROKEN! Thirty-one wins and the Warden breaks him! The crowd is losing its mind!');
      await sayAs('GORR', '...Good fight. Here. I won this off an old man. He fought better than he drank. Give it back to him.');
      await AE.gain('hask_badge'); await AE.gain('power_wrist');
      return;
    }
    Q('pit', k + 1);
    await sayAs('PITMASTER VORN', ['Not bad! Next up, my hounds. They bite.', 'Still standing! Next bout\'s a drake. Bring water.', 'The crowd knows your name now! The Ogre Twins are waiting.', 'Only one left. Gorr. Rest first. Pray, if you\'re the sort.'][k]);
  };

  // ---------- Wardens' Hall bounties ----------
  EV.a1_bounty_board = async function () {
    const L = ['WARDENS\' HALL - HALCYON CHAPTER. Open bounties:'];
    L.push(Q('b_rustback') === 'done' ? '[CLAIMED] Rustback - a giant red crawler in Drain 9.' : 'RUSTBACK. A giant crawler nesting in the upper tunnels of Drain 9. 600 G.');
    L.push(Q('b_leviathan') === 'done' ? '[CLAIMED] The Sump Leviathan.' : 'THE SUMP LEVIATHAN. Something huge in the deep cistern of Drain 9. 1,500 G and a Prism.');
    for (const l of L) await AE.say(l);
  };
  EV.a1_bounty = async function () {
    let paid = false;
    if (F().bounty_rustback && Q('b_rustback') !== 'done') { Q('b_rustback', 'done'); AE.S_.gold += 600; paid = true; await sayAs('WARDEN CLERK', 'Rustback, confirmed dead. 600 gold, Warden. Sign here. And here. And here.'); await AE.notice('Received 600 G'); }
    if (F().bounty_leviathan && Q('b_leviathan') !== 'done') { Q('b_leviathan', 'done'); AE.S_.gold += 1500; paid = true; await sayAs('WARDEN CLERK', 'The Sump Leviathan! The whole Hall owes you a drink. 1,500 gold, and the chapter\'s own Prism.'); await AE.notice('Received 1,500 G'); await AE.gain('prism:elemental'); }
    if (!paid) await sayAs('WARDEN CLERK', 'Bounties are on the board. Kill the thing, come back, get paid. Academy badge? Good. No forms for you, then. Some forms.');
    if (!Q('b_rustback')) Q('b_rustback', 1); if (!Q('b_leviathan')) Q('b_leviathan', 1);
  };
  EV.a1_rustback = async function () {
    if (F().bounty_rustback) return;
    await AE.say('Webs as thick as rope. Something red and enormous unfolds from the ceiling.');
    const r = await cs.battle(['rustback'], { bg: 'cave', boss: 1, noRun: 1 });
    cs.flag('bounty_rustback'); await AE.say('Rustback is dead. Claim the bounty at the Wardens\' Hall.');
  };
  EV.a1_leviathan = async function () {
    if (F().bounty_leviathan) return;
    await cs.shake(30);
    await AE.say('The sewage heaves. A vast pale squid rises from the cistern, its eyes like drain covers.');
    if (AE.S_.party.indexOf('lyra') >= 0) await cs.s('lyra', 'It\'s been drinking the runoff from the reactors. It\'s full of the flow. Poor thing. Big, angry poor thing.');
    await cs.battle(['leviathan'], { bg: 'swamp', boss: 1, noRun: 1 });
    cs.flag('bounty_leviathan'); await AE.say('The Sump Leviathan sinks for good. Claim the bounty at the Wardens\' Hall.');
  };
})();
