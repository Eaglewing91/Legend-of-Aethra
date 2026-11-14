/* ================= Act II: Meridia — story and side events ================= */
(function () {
  const cs = AE.cs, EV = AE.EV, F = function () { return AE.S_.flags; }, Q = AE.quest;
  const s = function (who, t) { return cs.s(who, t); }, sayAs = function (n, t) { return AE.say(t, { name: n }); };
  const inP = function (id) { return AE.S_.party.indexOf(id) >= 0 || AE.S_.reserve.indexOf(id) >= 0; };
  AE.ITEMS.old_drawing = { name: 'Child\'s Drawing', k: true, desc: 'Three children under a lantern: KAEL, VESPER, SABLE, in wax crayon.' };
  AE.ITEMS.keeper_key = { name: 'Windkeeper\'s Key', k: true, desc: 'Opens the Wind Shrine. Cold to the touch, and humming.' };
  AE.ITEMS.owner_pardon = { name: 'Owner\'s Pardon', k: true, desc: 'A gold-edged card: the bearer is welcome in the Gilded Spire.' };
  AE.QUESTS.chick = 'A lost talonbird chick';

  EV.inn_thorn = function () { return AE.inn(80); };
  EV.inn_kestrel = function () { return AE.inn(60, 'MARGA'); };
  EV.inn_spire = function () { return AE.inn(200, 'CONCIERGE'); };
  EV.inn_wind = function () { return AE.inn(120); };

  // ---------- Thornbrook ----------
  EV.a2_thorn = async function () {
    cs.flag('a2_thorn'); cs.music('melancholy');
    await s('kael', '...Thornbrook.');
    await s('lyra', 'Your village? It\'s lovely, Kael. It looks brand new.');
    await s('kael', 'It is brand new. That\'s what\'s wrong with it. The well was on the other side of the green. The mill had a red roof.');
    await s('bram', '...');
    await s('sable', 'Seven years is a long time. Places change.');
    await s('kael', 'People shouldn\'t. Nobody\'s looked at me twice.');
    cs.music('village');
  };
  EV.a2_memorial = async function () {
    await sayAs('MEMORIAL KEEPER', 'The fire took forty-one souls. Their names are cut in the stone.');
    await AE.say('Near the bottom of the stone, newly cleaned: KAEL ARDENT, WARDEN-IN-TRAINING. AGED 12. HE WENT BACK FOR THE CHILDREN.');
    await s('kael', '...That\'s a mistake.');
    await sayAs('MEMORIAL KEEPER', 'No mistake, young man. I carved it myself. Buried him myself, what the fire left.');
    if (inP('lyra')) await s('lyra', 'Kael...');
  };
  EV.a2_ilse = async function () {
    if (F().a2_ilse) { await sayAs('MOTHER ILSE', 'Stay for supper. Please. All of you. I\'ll set a place for... for whoever you are, love. It doesn\'t matter.'); return; }
    cs.flag('a2_ilse'); cs.music('sad');
    await sayAs('MOTHER ILSE', 'Visitors? How lovely. We don\'t get many, now that...');
    await AE.wait(30); cs.emote('ilse', '!');
    await sayAs('MOTHER ILSE', '...Kael? Kael Ardent?');
    await s('kael', 'Mother Ilse.');
    await sayAs('MOTHER ILSE', 'No. No, you can\'t be. I held your hand while they... You were twelve. You were so small.');
    await sayAs('MOTHER ILSE', 'But it\'s your face. Older. Your father\'s chin. And you stand with your left foot forward, just like you did, like the Academy books.');
    await sayAs('MOTHER ILSE', 'Let me see your coat. I sewed your name in every coat you ever owned. ...There\'s no name. There\'s no name in it.');
    await s('kael', 'I remember you. I remember this room. Beds by the window. You sang when the thunder came.');
    await sayAs('MOTHER ILSE', 'I did. I did. Oh, love. Oh, what did they do to you?');
    if (inP('sable')) {
      await sayAs('MOTHER ILSE', '...And that\'s... Sable? Little Sable, who stole all the jam?');
      await s('sable', 'Hi, Mother.');
      await s('lyra', 'Sable? You grew up HERE?');
      await s('sable', 'With him. With the real him. And with...');
      await sayAs('MOTHER ILSE', 'With Vesper. Our Vesper. She\'s at Aurex now, doing such important work. She sends money every month. She paid for every board of this house.');
    }
    await s('kael', 'Vesper paid for the village to be rebuilt.');
    await sayAs('MOTHER ILSE', 'She was always the clever one. Always counting things. Children, stars, pennies. She used to count you to sleep, Kael. One, two, three...');
    await AE.say('Kael\'s head rings like a struck bell.'); AE.game.flash = 8; await cs.shake(16);
    await sayAs('MOTHER ILSE', 'Stay with me tonight. All of you. Whoever you are, you are welcome in the Lantern House.');
    AE.healAll(); await AE.gain('cat_bell');
    if (inP('sable')) await s('sable', 'Sorry, Warden. I knew. Since Halcyon. I didn\'t know how to say it.');
    await s('kael', '...Say it when we\'re done. Not now.');
    cs.music('peaceful');
  };
  EV.a2_coats = async function () {
    await AE.say('A row of small coats on hooks. Names stitched inside each collar in careful thread: TOMAS. ELI. MIRA. VESPER (old, faded). SABLE (tiny, much mended). KAEL (scorched at the hem).');
  };
  EV.a2_fenn = async function () { await sayAs('MRS FENN', 'This was the Ardent house, before. Aurex gave it to us after the fire. Lovely people, they say. All gone.'); };
  EV.a2_ardent_drawer = async function () {
    if (AE.has('old_drawing')) { await AE.say('An empty drawer.'); return; }
    await AE.say('At the back of the drawer: a child\'s drawing, crumpled and smoke-stained.'); await AE.gain('old_drawing');
    await AE.say('Three children under a lantern. Above them in wax crayon: KAEL. VESPER. SABLE. The tallest one is holding everyone\'s hand.');
  };
  EV.a2_orphan_cards = function () { return AE.has('card_deck') ? AE.Arcana.duel('orphan') : sayAs('ORPHAN', 'Do you play Arcana? You need a deck first!'); };

  // ---------- Mistwood and Kestrel ----------
  EV.a2_thornmaw = async function () {
    cs.shake(20);
    await AE.say('The trees of the Elder Glade lean in. One of them opens a mouth full of thorns.');
    if (inP('lyra')) await s('lyra', 'It\'s old. Older than Halcyon. And it\'s furious. Something drank its roots dry.');
    await cs.battle(['thornmaw'], { bg: 'forest', boss: 1, noRun: 1 });
    cs.flag('a2_mist');
    if (inP('lyra')) await s('lyra', 'Aurex test wells, all along the glade. They\'re draining the whole forest to feed the Wind Shrine drills.');
  };
  EV.a2_chick = async function () {
    await AE.say('A fluffy talonbird chick, lost and cheeping.'); cs.flag('q_chick'); Q('chick', 1);
    cs.remove(AE.field().npcs.find(function (n) { return n.def && n.def.name === 'CHICK'; }).id);
    await AE.notice('The chick hops into Kael\'s pack.');
  };
  EV.a2_joda = async function () {
    if (F().a2_talon) { await sayAs('RANCHER JODA', 'Your bird waits outside the ranch gate. Ride it across shallow rivers, and nothing will dare jump you.'); return; }
    cs.flag('a2_talon');
    await sayAs('RANCHER JODA', 'You came through Mistwood? On FOOT? With Thornmaw in the glade? ...Huh. Thornmaw\'s dead? Then you\'ve done me a kindness.');
    await sayAs('RANCHER JODA', 'Here. A Ranch Pass, and the pick of my stable. Talonbirds are fast, they cross shallow rivers, and wild monsters won\'t come near one.');
    await AE.gain('ranch_pass'); await AE.gain('greens', 3);
    const p = AE.WORLD.places.kestrel; const q = AE.landNear(p[0], p[1] + 2); AE.S_.vehicles.talon = { x: q[0], y: q[1], have: 1 };
    await AE.notice('A talonbird waits outside Kestrel Ranch.');
    await sayAs('RANCHER JODA', 'The Gilded Spire\'s south-west, on the big mesa. They race talonbirds there. And north of here, the Old Mine cuts through to Windhaven.');
  };
  EV.a2_breeder = async function () {
    if (Q('chick') === 1) {
      Q('chick', 'done'); await sayAs('BREEDER TAL', 'Pip! Little Pip! You found her! She\'s our best racer\'s chick. Here, take these. And when she\'s grown, she\'s yours to race.');
      await AE.gain('sweetroot', 3); AE.S_.mybird = { name: 'Pip', spd: 7.5, sta: 70 }; await AE.notice('You can now race Pip at the Gilded Spire.'); return;
    }
    await sayAs('BREEDER TAL', 'Feed a bird Sweetroot before a race, and it\'ll run its heart out. That\'s the secret. Don\'t tell the Spire.');
    if (AE.S_.mybird && AE.has('sweetroot')) {
      const r = await AE.ask('Feed ' + AE.S_.mybird.name + ' a Sweetroot? (Better racing.)', ['Feed', 'Not now'], { cancel: 1 });
      if (r === 0) { AE.take('sweetroot'); AE.S_.mybird.spd = Math.min(12, AE.S_.mybird.spd + 0.5); AE.S_.mybird.sta += 6; await AE.notice(AE.S_.mybird.name + ' looks faster.'); }
    }
  };

  // ---------- the Gilded Spire ----------
  EV.a2_spire = async function () {
    cs.flag('a2_spire'); cs.music('spire');
    await AE.say('The Gilded Spire. Gold lamps, gold doors, and somewhere, always, the sound of coins.');
    if (inP('sable')) await s('sable', 'Oh, I LOVE it here. Nobody notices one more pair of hands.');
    if (inP('bram')) await s('bram', 'Keep your purses close. Especially near Sable.');
    await AE.say('The Arcana Hall, the Talon Track, the Battle Square and the slots all trade in Spire Tokens. The Exchange swaps them for prizes.', { name: 'TIP' });
  };
  EV.a2_murder = async function () {
    cs.flag('a2_framed'); cs.music('tension');
    await AE.say('A crowd around the hotel steps. Two Aurex officers lie dead, shot clean through.');
    await sayAs('SPIRE GUARD', 'There! Those are the Reactor 4 terrorists from the broadcasts! Seize them!');
    if (inP('bram')) { await s('bram', '...A clean shot through the plate armour. That\'s a gun-arm. I know that wound.'); }
    await s('kael', 'We didn\'t do this.');
    await sayAs('SPIRE GUARD', 'Tell it to the sand!');
    await AE.game.fadeOut(0.03);
    await cs.narrate(['The Spire\'s justice is simple. The accused are lowered into the desert pit below the mesa.', 'Nobody climbs out.']);
    await cs.warp('spire_prison', AE.MAPS.spire_prison.entry[0], AE.MAPS.spire_prison.entry[1], 2);
  };
  EV.a2_prison_in = async function () {
    cs.flag('a2_prison_in');
    await sayAs('PRISONER', 'New meat! Welcome to the pit. The only way out is up, and the only way up is the Owner\'s pardon.');
    await sayAs('PRISONER', 'And the Owner pardons whoever brings him the real killer. Ha. Nobody ever does.');
    await s('kael', 'Then we find the real killer.');
    if (inP('bram')) await s('bram', 'I know who it is. A man with a gun for an arm. He\'s here. I\'d bet my life on it. ...I owe him that much.');
  };
  EV.a2_harl = async function () {
    cs.music('boss');
    await sayAs('HARL', 'Hollis. Bram Hollis. Seven years. You look old, Captain.');
    if (inP('bram')) {
      await s('bram', 'Harl. It\'s you killing Aurex men in the Spire.');
      await sayAs('HARL', 'Every one of them was at Thornbrook. Every one. I\'ve got a list. You\'re on it, Captain.');
      await s('lyra', 'Thornbrook? Bram, what is he talking about?');
      await sayAs('HARL', 'He didn\'t tell you? Captain Hollis got an order. Burn the village, contain the "outbreak". I refused. They took my arm for it, and my name.');
      await sayAs('HARL', 'He didn\'t refuse.');
      await s('bram', '...No. I didn\'t.');
      await s('kael', '...');
    } else await sayAs('HARL', 'Whoever you are, you\'re in my pit. That makes you mine.');
    await cs.battle(['harl'], { bg: 'desert', boss: 1, noRun: 1 });
    await sayAs('HARL', 'Hah... You fight for him? For the man who lit the match? Then you\'re as blind as he was.');
    await sayAs('HARL', 'Tell the Owner it was me. I\'m done. Seven years... it\'s enough.');
    cs.flag('a2_prison_out');
    if (inP('bram')) {
      await s('bram', 'I followed the order, Kael. I told myself it was quarantine. I told myself a lot of things.');
      await s('kael', 'You burned my village.');
      await s('bram', 'Yes.');
      await s('kael', '...We\'ll talk about it at the Lantern House. Not in a pit.');
    }
    await AE.game.fadeOut(0.04);
    await cs.narrate(['The Owner of the Gilded Spire was a fat man in a gold chair who liked a good story.', 'He liked this one so much he pardoned everyone, gave them a gold card, and the keys to a desert Skimmer.']);
    await AE.gain('owner_pardon'); await AE.gain('skimmer_key');
    const g = AE.WORLD.places.gilded; const q = AE.landNear(g[0], g[1] + 2); AE.S_.vehicles.skimmer = { x: q[0], y: q[1], have: 1 };
    await cs.warp('gilded_spire', 27, 40, 2);
    await AE.say('A Skimmer waits below the Spire\'s lift. It crosses deserts and plains at speed.', { name: 'TIP' });
  };
  EV.a2_exchange = function () { return AE.exchange(); };
  EV.a2_race = function () { return AE.race(); };
  EV.a2_slots = function () { return AE.slots(); };
  EV.a2_gallery = function () { return AE.gallery(); };
  EV.a2_arena = function () { return AE.arena(); };
  EV.a2_cards_spire = function () { return AE.has('card_deck') ? AE.Arcana.duel('spire') : sayAs('CARD PLAYER', 'No deck? The Lucky Lantern in Halcyon gives them out. Or try the Arcana Hall.'); };
  EV.a2_cards_master = async function () {
    if (!AE.has('card_deck')) { await AE.gain('card_deck'); ['c_rat', 'c_slime', 'c_drone', 'c_trooper', 'c_hawk', 'c_crawler', 'c_bat'].forEach(function (c) { AE.S_.cards[c] = (AE.S_.cards[c] || 0) + 1; }); await sayAs('ARCANA MASTER', 'No deck? Have one. The Hall insists.'); return; }
    return AE.Arcana.duel('master');
  };
  EV.a2_cards_duchess = function () { return AE.has('card_deck') ? AE.Arcana.duel('duchess') : sayAs('DUCHESS', 'Darling, you need a deck.'); };
  EV.a2_cards_monk = function () { return AE.has('card_deck') ? AE.Arcana.duel('monk') : sayAs('MONK', 'A deck first, friend.'); };

  // ---------- the Old Mine ----------
  EV.a2_miner = async function () {
    await sayAs('OLD MINER', 'Silver, they dug for. Then Aurex bought the claim and dug for something else. Dug till the walls started glowing.');
    await sayAs('OLD MINER', 'There\'s a big old mole down in the Deep Vein. Thinks it\'s a king. It\'s been eating the Aurex crews. Can\'t say I blame it.');
  };
  EV.a2_moleking = async function () {
    await cs.shake(30); await AE.say('The floor heaves. A huge mole wearing a crown of broken drill bits bursts up through the rock.');
    await cs.battle(['moleking'], { bg: 'cave', boss: 1, noRun: 1 });
    cs.flag('a2_mine'); await AE.say('Daylight shines down a shaft ahead: the far side of the mountain, and the road to Windhaven.');
  };

  // ---------- Windhaven ----------
  EV.a2_wind = async function () {
    cs.flag('a2_wind');
    await AE.say('Windhaven. White temples, prayer flags, and wind that never stops. Aurex drilling rigs stand around the shrine gate like vultures.');
    if (inP('lyra')) await s('lyra', 'The Wind Crystal is in there. I can hear it. It\'s... it\'s scared, Kael. Like the core was.');
    await s('kael', 'Vesper said "when the Crystals call you, answer". I don\'t hear anything.');
    if (inP('lyra')) await s('lyra', 'Good. Keep not hearing it.');
  };
  EV.a2_windkeeper = async function () { await sayAs('WINDKEEPER', F().a2_drain ? 'Aurex is inside. Please. The Crystal...' : 'The shrine is sealed. Only the Windkeeper\'s Key opens it, and the Key rests with the dead, in the Ossuary.'); };
  EV.a2_elder = async function () {
    await sayAs('ELDER SORREL', 'Aurex has paid us very well to open the shrine. I told them the Key is lost. It is not lost. It is buried with the first Windkeeper, in the deepest ossuary.');
    await sayAs('ELDER SORREL', 'If Aurex must have the Crystal, I would rather someone kind held the door. The catacombs are east. Bring the Key, and I will trust you with it.');
    cs.flag('a2_elder');
  };
  EV.a2_lich = async function () {
    await AE.say('Bones rise from the ossuary niches and knit together around a cold blue flame.');
    await sayAs('OSSUARY WARDEN', 'THE KEY SLEEPS WITH THE KEEPER. THE KEEPER SLEEPS WITH ME.');
    await cs.battle(['lich'], { bg: 'temple', boss: 1, noRun: 1 });
    cs.flag('a2_lich'); await AE.gain('keeper_key');
  };
  EV.a2_shrine_gate = async function () {
    if (!AE.has('keeper_key')) { await AE.say('A great sealed door, carved with wings. It has a keyhole shaped like a feather.'); return; }
    await AE.say('The Windkeeper\'s Key turns. The door sighs open... and Aurex drill-cable runs in through a hole already cut in the shrine\'s wall.');
    if (inP('bram')) await s('bram', 'They didn\'t wait for a key. They cut their way in.');
    cs.flag('a2_drain');
  };
  EV.a2_drago2 = async function () {
    cs.flag('a2_drago2');
    cs.spawn('drago', 'drago', AE.field().player.x, AE.field().player.y - 3, 2);
    await sayAs('DRAGO', 'Warden. I hoped it would be you. The doctor is upstairs, waiting for her shard. I\'m to keep everyone else out.');
    await sayAs('DRAGO', 'I read her Cradle files, you know. All of them. I know what you are now.');
    await s('kael', 'Then tell me.');
    await sayAs('DRAGO', 'Beat me first. That\'s the only honest way I know.');
    await cs.battle(['windtrooper', 'drago2', 'windtrooper'], { bg: 'temple', boss: 1, noRun: 1 });
    await sayAs('DRAGO', 'Ha... Better. Much better. Fine. You want the truth? You\'re a container, Warden. A jar with a dead boy\'s memories poured in.');
    await sayAs('DRAGO', 'And jars don\'t get a say in where they\'re carried. Remember that, when she calls you.');
    cs.remove('drago');
  };
  EV.a2_engine = async function () {
    cs.music('boss');
    await AE.say('The Crystal Heart. A great green crystal floats over the floor, wrapped in Aurex cables. A drilling engine the size of a house is chewing into its base.');
    await sayAs('TEMPEST ENGINE', 'EXTRACTION AT 61 PERCENT. INTERFERENCE DETECTED. PURGING.');
    await cs.battle(['tempest'], { bg: 'sky', boss: 1, noRun: 1 });
    cs.flag('a2_engine'); cs.music('revelation');
    await AE.say('The engine dies. The crystal shudders... and cracks from end to end. Something small and bright falls out of the heart of it: a shard of green light.');
    await s('kael', '...');
    cs.spawn('vesper', 'vesper', AE.field().player.x, AE.field().player.y - 4, 2);
    await sayAs('VESPER', 'There it is. The Wind Shard. Bring it here, bright boy.');
    await AE.say('Kael\'s hand is already closing on the shard. His feet are already walking.'); AE.game.flash = 10;
    if (inP('lyra')) await s('lyra', 'Kael! KAEL! Stop! Look at me!');
    await sayAs('VESPER', 'He can\'t, Chorus. He\'s mine. He was made to carry, and carry he will. One, two, three...');
    await s('kael', 'One... two...');
    await AE.say('Kael places the Wind Shard in Vesper\'s hand.');
    await sayAs('VESPER', 'Good boy. Now come with me. You belong in the Cradle.');
    if (inP('lyra')) {
      await s('lyra', 'NO. He belongs to himself!');
      await AE.say('Lyra throws her arms around Kael and pulls. Something in the dying Crystal SINGS, louder than Vesper\'s counting, and Kael\'s eyes clear.');
      await s('kael', '...Lyra?');
    }
    await sayAs('VESPER', 'A Chorus song. How old-fashioned. Keep him, then. For now. I have what I came for. Three to go.');
    cs.remove('vesper'); await cs.shake(60);
    await AE.say('The shrine shakes apart. From the shattered crystal rises a shape of green wind and white wings.');
    await sayAs('SYLPHINE', 'Child of the Chorus. The Crystal is gone; its memory lives in me. Call, and I will come.');
    await AE.gain('prism:sylphine');
    await AE.game.fadeOut(0.04);
    await cs.narrate(['The Wind Shrine fell into the valley that night.', 'In Windhaven, the wind stopped for the first time in a thousand years.',
      'Kael Ardent sat on the temple steps until dawn, staring at his empty hand.', '"I gave it to her," he said. "I couldn\'t stop. I didn\'t want to stop."',
      '"Then next time, we stop you," said Lyra. "That\'s what we\'re for."']);
    await cs.title('END OF ACT II', 'MERIDIA', 180);
    cs.flag('a2_done'); cs.chapter(3);
    await cs.warp('windhaven', 27, 30, 2);
    await AE.say('Vesper needs three more Shards. The Water Crystal lies across the sea in Solmara. The ferry leaves from Port Lark, east.', { name: 'TIP' });
  };
})();
AE.EV['enter:gs_hotel'] = function () { if (AE.S_.flags.a2_spire && !AE.S_.flags.a2_framed) return AE.EV.a2_murder(); };
