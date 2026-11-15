/* ================= Act I: Halcyon — the main story =================
   Flags in order: a1_open_done, r4_gate_open, r4_in, r4_door, r4_boss, esc_drago, esc_collapse, a1_fell, a1_woke, a1_rest,
   a1_spill, a1_plan, a1_seal, a1_stair, spire_brute, a1_view, a1_plaza, a1_lobby, a1_records, a1_specimen, a1_exec,
   a1_vault, a1_drago, a1_yards_in, a1_train (Act I ends). */
(function () {
  const cs = AE.cs, EV = AE.EV, F = function () { return AE.S_.flags; };
  const s = function (who, t) { return cs.s(who, t); };
  const sayAs = function (name, t) { return AE.say(t, { name: name }); };

  AE.START = { map: 'r4_gate', x: 5, y: 6, dir: 1, inv: { potion: 4, phoenix_down: 1 } };
  AE.ITEMS.glowcap = { name: 'Glowcap', k: true, desc: 'A mushroom that shines in the dark. Doc Marrow needs it for medicine.' };
  AE.ITEMS.tam_medicine = { name: 'Lung Tonic', k: true, desc: 'Doc Marrow\'s medicine for Tam Teller.' };
  AE.ITEMS.pell_letter = { name: 'Letter to Osk', k: true, desc: 'Mrs Pell\'s letter for Granny Osk, from her grandson.' };
  AE.ITEMS.hask_badge = { name: 'Warden\'s Badge', k: true, desc: 'A tarnished Warden badge. Old Hask lost it to Gorr in the Pit.' };
  AE.ITEMS.pit_pass = { name: 'Pit Fighter\'s Tag', k: true, desc: 'Lets you enter the Pit\'s tournament.' };

  // ---------- the opening: the night train to Reactor 4 ----------
  EV['enter:r4_gate'] = async function () {
    if (F().a1_open_done) return;
    const f = AE.field(); f.player.dir = 1;
    await cs.narrate(['Aethra.', 'Beneath its earth runs the Aetherflow: the living memory of everything that has ever been.',
      'Where the flow wells up, it hardens into Crystal. Four Crystals hold the islands of the upper sky aloft.',
      'In the city of Halcyon, Aurex Dynamics drinks the Aetherflow through eight great reactors, and sells the light back by the hour.',
      'Tonight, a newly sworn Warden of the Vanguard Academy takes his first contract.']);
    await cs.title('HALCYON', 'Reactor 4 - Outer Gate', 160);
    cs.music('reactor');
    await cs.walk('bram', 'D1L10', 1); cs.face('bram', 0); cs.face('hero', 2);
    await s('bram', 'So you\'re the Warden the Academy sent. I asked for a squad. They sent me a boy and a sword.');
    await s('kael', 'Warden contract one-one-two-seven. Escort Undercurrent into Reactor 4, and out again. Payment on completion.');
    await s('kael', 'What you do inside isn\'t my business.');
    await s('bram', 'Hah! They teach you to talk like a ledger at that school? Bram Hollis. I run this outfit.');
    await cs.walk('sable', 'D1L19', 2); cs.face('sable', 3);
    await s('sable', 'And I\'m the one who actually gets the doors open. Sable. Don\'t touch my things.');
    await s('sable', 'Ooh, an Academy sword. That\'s worth more than this whole platform.');
    await s('kael', 'It isn\'t for sale.');
    await s('sable', 'Everything\'s for sale, Warden. Just not everything\'s for sale to you.');
    cs.face('pip', 3); cs.face('marlo', 3);
    await sayAs('PIP', 'Pip! I carry the explosives. Mostly I don\'t drop them.');
    await sayAs('MARLO', 'Marlo. Ignore Pip. Don\'t ignore the explosives.');
    await s('bram', 'Here\'s the job. We go in, we plant one door charge on the core intake, we get out. Nobody gets hurt.');
    await s('bram', 'Aurex shuts Reactor 4 for a month, Halcyon gets a month of the Aetherflow left alone. That\'s all Undercurrent wants.');
    await s('kael', '...A month.');
    await s('bram', 'You got a problem with that, Warden?');
    await s('kael', 'Not my business.');
    // the patrol
    AE.Sfx.play('buzz'); await cs.shake(20);
    cs.spawn('t1', 'trooper', 18, 9, 1); cs.spawn('t2', 'trooper', 19, 9, 1);
    await cs.together([['t1', 'U3', 2], ['t2', 'U3', 2]]);
    await sayAs('AUREX TROOPER', 'Hold it! This platform is closed to the public!');
    await s('bram', 'We\'re not the public, son.');
    await AE.say('Battle tip: battles are turn based. The strip at the top shows whose turn is next. On your turn, choose a command. Attack with your weapon, or open Magic to use a Prism\'s spells. Items heal.', { name: 'TIP' });
    AE.setParty(['kael', 'bram', 'sable'], 1);
    AE.slotPrism('kael', 'restore'); AE.slotPrism('bram', 'bolt'); AE.slotPrism('sable', 'steal');
    const r = await cs.battle(['a_trooper', 'a_trooper'], { bg: 'reactor', noRun: 1 });
    cs.remove('t1'); cs.remove('t2'); cs.remove('bram'); cs.remove('sable');
    await s('bram', 'Not bad, kid. Not bad at all.');
    await AE.say('Kael equipped a Restore Prism (Cure). Bram has Bolt, Sable has Steal. Open the menu (C) and choose Prisms to slot more as you find them. To examine something, face it and press Z. A gold arrow shows where to go.', { name: 'TIP' });
    await s('sable', 'Gate console\'s at the east end of the platform, past the lamp. Give me ten seconds and an Academy sword to hold.');
    await s('kael', 'You can have the ten seconds.');
    cs.flag('a1_open_done');
  };
  EV.a1_gate_console = async function () {
    if (F().r4_gate_open) { await AE.say('The console blinks: GATE OPEN. MAINTENANCE OVERRIDE.'); return; }
    await s('sable', 'Let\'s see... Aurex passcodes are always someone\'s birthday. Corvin Aurex, born the fifth of Harrowmonth...');
    AE.Sfx.play('ok'); await AE.wait(30); AE.Sfx.play('door');
    await s('sable', 'And we\'re in. Told you. Ten seconds.');
    await sayAs('PIP', 'We\'ll hold the platform and keep the train warm. Go!');
    cs.flag('r4_gate_open'); cs.flag('r4_in');
  };
  EV.a1_gate_locked = async function () { if (!F().r4_gate_open) await AE.say('The reactor gate is sealed. The console on the platform must control it.'); };
  EV.a1_pip = async function () { await sayAs('PIP', F().r4_gate_open ? 'Go! The train leaves when the charge goes, with or without you!' : 'Sable\'s the one with the codes. I\'m the one with the... other things.'); };
  EV.a1_marlo = async function () { await sayAs('MARLO', 'Twelve years I\'ve watched that chimney. Twelve years of grey sky. Tonight it stops.'); };
  EV.a1_bram_gate = async function () { await s('bram', 'Ready when you are, Warden.'); };
  EV.a1_sable_gate = async function () { await s('sable', 'Don\'t look at me like that. I said I wouldn\'t steal the sword. I didn\'t say anything about your wallet.'); };
  EV.a1_marlo_heal = async function () {
    await sayAs('MARLO', 'You look rough. Here, field kit. Patch yourselves up.');
    AE.healAll(); AE.Sfx.play('heal'); await AE.notice('The party is fully healed.');
  };
  // the first floor inside: the valve puzzle, explained
  EV['enter:r4_1'] = async function () {
    if (F().r4_1_hint || F().r4_valves1) return; cs.flag('r4_1_hint');
    await s('sable', 'Intake level. The stairs down are on the east side, behind a pressure seal.');
    await s('sable', 'Three valve wheels in the side rooms hold it shut. Turn all three and it opens. Look for the gold arrows.');
  };
  // the shutter in the Pressure Hall: Lyra's voice on the intercom
  EV.a1_r4_door = async function () {
    await AE.say('A security shutter blocks the stairs. A speaker grille crackles beside it.');
    await sayAs('VOICE', '...Hello? Is someone at shutter nine? The sensors say three people. Three people who aren\'t on my roster.');
    await s('bram', 'Undercurrent. We\'re expected.');
    await sayAs('VOICE', 'You\'re LATE, is what you are. The relief shift starts in forty minutes.');
    await sayAs('VOICE', 'Listen. I\'ll open it. But you promised a door charge. Just the intake. If you hurt anything else down there...');
    await sayAs('VOICE', '...it\'s already hurting. Can\'t you hear it? No. Of course you can\'t.');
    await s('kael', 'Who is that?');
    await s('bram', 'Our friend on the inside. Don\'t ask her name. She\'d have to stop being our friend.');
    AE.Sfx.play('door'); cs.flag('r4_door');
  };

  // ---------- the core ----------
  EV['enter:r4_core'] = async function () {
    if (F().r4_boss) return;
    cs.spawn('lyra', 'lyra', 16, 7, 0);
  };
  EV.a1_bulwark = async function () {
    if (F().r4_boss) return;
    const f = AE.field();
    await cs.pan(16, 8, 30);
    cs.face('lyra', 2); await cs.emote('lyra', '!');
    await s('lyra', 'Stop! Don\'t come any closer to the core. It\'s... it\'s awake tonight.');
    await s('bram', 'So you\'re the voice. You\'re just a kid.');
    await s('lyra', 'I\'m eighteen and I\'m a level-three technician and I just betrayed my employer for you, so maybe be nice?');
    await s('kael', '...The crystal\'s glowing.');
    await s('lyra', 'It does that when it\'s scared. Everyone thinks the Aetherflow is just fuel. It isn\'t. It remembers. It\'s screaming.');
    await s('sable', 'Charming. Can we blow it up now?');
    AE.Sfx.play('quake'); await cs.shake(40);
    await s('lyra', 'Oh no. That\'s the core guardian. They said it was decommissioned!');
    await AE.say('A Warden-class security mech drops from the gantry above, steam pouring from its joints.');
    await sayAs('BULWARK', 'INTRUDERS DETECTED IN CORE LEVEL. LETHAL FORCE AUTHORISED.');
    cs.hide('lyra');
    const r = await cs.battle(['bulwark'], { bg: 'reactor', boss: 1, noRun: 1 });
    cs.hide('lyra', false); cs.flag('r4_boss');
    await s('bram', 'Now. Pip\'s charge, on the intake, and we walk.');
    await cs.walk('hero', 'U1');
    await s('lyra', 'That\'s not a door charge. That\'s... Bram, that\'s ten times the charge you promised me!');
    await s('bram', 'That\'s the charge Pip packed. It\'s a door charge. It\'s the same charge we always...');
    AE.Sfx.play('buzz'); await cs.shake(30);
    await sayAs('PA SYSTEM', 'Attention. Core overload sequence authorised. Reactor 4 personnel, evacuate. You have four minutes.');
    await sayAs('PA SYSTEM', 'Authorisation: Lune. Vesper. Chief Engineer.');
    await s('lyra', 'Dr. Lune? She\'s... she\'s not stopping it. She\'s STARTING it!');
    await s('bram', 'Our charge isn\'t even armed! Sable!');
    await s('sable', 'Not us! The core\'s doing it by itself! RUN!');
    await s('bram', 'Sable, with me, the main lift to the train! Warden! Get the girl out by the service catwalk, it\'s faster!');
    await s('kael', 'That\'s not in the contract.');
    await s('bram', 'Then I\'m adding it! GO!');
    AE.away('bram'); AE.away('sable');
    await cs.join('lyra', Math.max(4, AE.S_.m.kael.lv));
    AE.setParty(['kael', 'lyra']); AE.slotPrism('lyra', 'ice'); AE.slotPrism('lyra', 'restore');
    AE.Timer.start(240, 'timeout_reactor');
    await cs.warp('r4_escape', 69, 9, 3);
    await AE.say('Four minutes. Follow the service catwalk west, down under the plate.', { name: 'LYRA' });
  };
  EV['enter:r4_escape'] = async function () { if (!AE.S_.timer && !F().a1_fell) AE.Timer.start(240, 'timeout_reactor'); };
  EV.a1_esc_drago = async function () {
    cs.flag('esc_drago');
    cs.spawn('drago', 'drago', 51, 9, 1);
    await cs.walk('drago', 'D0'); await cs.walk('drago', 'R1');
    await sayAs('???', 'A Warden. Here. Of all the reactors in Halcyon.');
    await sayAs('DRAGO', 'Captain Drago Venn, Aurex Security. And you\'re late for your own funeral, both of you.');
    await s('lyra', 'Captain, the reactor\'s overloading, we have to...');
    await sayAs('DRAGO', 'I know what it\'s doing. I know who told it to.');
    await sayAs('DRAGO', 'Warden. The Academy sends me its roster every season. There\'s no Kael on this year\'s oath.');
    await s('kael', '...How do you know my name?');
    await sayAs('DRAGO', 'That\'s the question, isn\'t it. Go on. Run. I\'d rather fight you on a better day.');
    await cs.walk('drago', 'D2', 2); cs.remove('drago');
    await s('lyra', 'Who WAS that?');
    await s('kael', 'Someone who reads rosters.');
  };
  EV.a1_esc_collapse = async function () {
    cs.flag('esc_collapse'); await cs.shake(40);
    await AE.say('Behind you, a whole length of catwalk tears loose and spins down into the dark.');
    await s('lyra', 'Don\'t stop! Don\'t look down! Definitely don\'t look down!');
  };
  EV.a1_fall = async function () {
    AE.Timer.stop();
    await s('lyra', 'It ends here! It just... ends! Where\'s the rest of it?!');
    await cs.shake(60); AE.game.flash = 20;
    await s('kael', 'Lyra. Hold on to me.');
    await s('lyra', 'What? Why? What are you...');
    AE.Sfx.play('boom'); AE.game.flash = 40; await AE.wait(40);
    await cs.narrate(['Reactor 4 tore itself apart.', 'The blast lifted the plate above it like a sheet of paper, and dropped it on twelve streets of the Sumps.',
      'Two figures fell with it.', '...', 'The Aetherflow caught them. Or something in it did.']);
    cs.flag('a1_fell');
    await cs.warp('sumps', 10, 10, 2);
  };

  // ---------- the Sumps ----------
  EV['enter:sumps'] = async function () {
    if (!F().a1_fell || F().a1_woke) return;
    cs.music('sad');
    cs.pose('hero', 'b_dead'); cs.spawn('lyra', 'lyra', 12, 8, 3);
    await AE.wait(60);
    await s('lyra', '...Hey. Hey, Warden. You\'re lying on my flowers.');
    cs.pose('hero', null); await cs.jump('hero'); cs.face('hero', 1);
    await s('kael', '...We\'re alive.');
    await s('lyra', 'We\'re alive. We fell, I don\'t know, a hundred metres? And we landed in the one soft place in the whole Sumps.');
    await s('lyra', 'My crystal-moss. It only grows for me. And it caught us. That doesn\'t happen.');
    await s('kael', 'You said the Aetherflow was screaming. In the core.');
    await s('lyra', '...You remember that? Most people just tell me I\'m strange.');
    await s('lyra', 'I hear it. I always have. Like a choir in the next room. My Nan says my mother heard it too.');
    await s('lyra', 'And when we fell... it said a name. Not mine. I think it was yours, but it was... wrong somehow.');
    await s('kael', 'Kael Ardent.');
    await s('lyra', 'Kael. Okay. I\'m Lyra. Lyra Vale. Thanks for not letting go.');
    await s('kael', 'My contract was with Bram. I need to find him.');
    await s('lyra', 'If Bram\'s alive, he\'ll be at the Spillway. Everyone ends up at the Spillway eventually.');
    await s('lyra', 'But first my house. It\'s just east of here. Nan Corra will want to see I\'m in one piece, and you look like you need a bed.');
    cs.remove('lyra'); cs.flag('a1_woke'); cs.music('slums');
    await AE.say('Lyra\'s house is east of the flower bed. The Spillway is the big hall south-west of Cinder Square.', { name: 'TIP' });
  };
  EV.a1_flowerbed = async function () {
    if (AE.S_.party.indexOf('lyra') >= 0 && F().a1_woke) { await s('lyra', 'They\'re called crystal-moss. They drink the Aetherflow from the ground and turn it into light. No reactor needed.'); return; }
    await AE.say('Pale flowers glow faintly between the scrap.');
  };
  EV.a1_corra = async function () {
    if (!F().a1_rest) {
      await sayAs('NAN CORRA', 'Lyra Vale! Out all night, and the whole sky falling, and you come home looking like you were thrown out of a reactor!');
      await s('lyra', 'Nan, I was thrown out of a reactor.');
      await sayAs('NAN CORRA', 'Don\'t you joke at me. And who is this? He\'s bleeding on my floor.');
      await s('kael', 'Kael. Sorry about the floor.');
      await sayAs('NAN CORRA', 'Polite, at least. Both of you, into the back. Sleep. We\'ll talk when you can stand up straight.');
      await AE.say('Rest in the beds at the back of the room.', { name: 'TIP' });
      return;
    }
    if (!F().a1_spill) { await sayAs('NAN CORRA', 'Go find your Bram, then. And Kael. Bring her back to me.'); return; }
    await sayAs('NAN CORRA', 'I raised that girl from a bundle on my doorstep. Her mother left her with a song and nothing else.');
    await sayAs('NAN CORRA', 'She is going to do something brave and stupid, Warden. When she does, be standing next to her.');
    AE.healAll(); await AE.notice('Nan Corra patches everyone up. The party is fully healed.');
  };
  EV.a1_lyra_bed = async function () {
    if (F().a1_rest) { await AE.say('Lyra\'s bed. A stuffed talonbird with one eye watches you.'); return; }
    await AE.game.fadeOut(0.03); AE.healAll(); cs.music('quiet');
    await cs.narrate(['The radio in the kitchen murmurs through the night.', 'AUREX NEWS: Terrorists of the group calling itself Undercurrent have destroyed Reactor 4.',
      'Early reports suggest more than two hundred dead in the Ash Lane collapse.', 'President Corvin Aurex has declared a Containment Order for the undercity. Citizens are asked to remain calm.',
      'Morning comes. In the Sumps, it looks the same as night.']);
    cs.flag('a1_rest'); await AE.game.fadeIn(0.03); cs.music('village');
    await s('lyra', 'Two hundred people. Bram didn\'t do that. He couldn\'t have. He carries sweets in his pocket for the kids on Lantern Row.');
    await s('kael', 'The charge in the core was never armed. The reactor went up by itself.');
    await s('lyra', 'Not by itself. You heard the PA. "Authorisation: Lune."');
    await s('lyra', 'Dr. Vesper Lune. Chief Engineer. She runs every reactor in Halcyon. I\'ve seen her twice. She was kind to me, once.');
    await s('lyra', 'Why would she blow up her own reactor?');
    await s('kael', 'Not my business. My business is Bram, and my pay.');
    await s('lyra', 'Wow. Okay. I\'m coming with you anyway, so you\'d better get used to my business too.');
  };

  // ---------- the Spillway ----------
  EV['enter:spillway'] = EV.a1_spillway_enter = async function () {
    if (F().a1_spill) return;
    if (!F().a1_woke) return;
    cs.spawn('bram', 'bram', 15, 8, 2); cs.spawn('sable', 'sable', 16, 8, 2);
    await AE.wait(20); cs.face('bram', 2);
    await s('bram', 'WARDEN! Ha! I knew it, I told Sable, nothing that stubborn dies from a little fall!');
    await s('sable', 'He said, and I quote, "the boy\'s jam on a plate now". Hi, Warden.');
    await cs.walk('hero', 'U3');
    await s('kael', 'You told me it was a door charge.');
    await s('bram', 'It WAS a door charge! I swear it on my men, on every one of them. It was never even armed.');
    await s('sable', 'We were on the train when it went. Pip saw the core flash before anything touched it.');
    await s('lyra', 'It was Dr. Lune. Vesper Lune. She started the overload from somewhere else. I heard her code on the PA.');
    await s('bram', '...Aurex\'s chief engineer blew her own reactor and dropped the plate on Ash Lane. And now Aurex says it was us.');
    await s('bram', 'Two hundred people. My name on all of them.');
    await s('kael', 'The contract was in and out. I got you in. You got yourselves out. One thousand five hundred.');
    await s('sable', 'Oh, he\'s cold. I like him. I don\'t trust him, but I like him.');
    await s('bram', '...Fair\'s fair. You did your job.');
    AE.S_.gold += 1500; AE.Sfx.play('coin'); await AE.notice('Received 1,500 Gil');
    await s('bram', 'Come down to the hideout when you\'re ready. Behind the bar, down the stairs. I might have another job, if you\'ve the stomach.');
    cs.remove('bram'); cs.remove('sable'); cs.flag('a1_spill');
    await sayAs('TESS', 'And you two, wipe your feet. This is a respectable terrorist bar.');
  };
  EV.a1_tess = async function () {
    if (!F().a1_spill) { await sayAs('TESS', 'Lyra! Gods, girl, they said Reactor 4 went up with the night shift in it.'); return; }
    const r = await AE.ask('TESS: What\'ll it be?', ['Drink (heals, 30 Gil)', 'Rumours', 'Nothing'], { name: 'TESS', cancel: 2 });
    if (r === 0) { if (!AE.pay(30)) { await sayAs('TESS', 'No tabs. Not after Pip.'); return; } AE.healAll(); AE.Sfx.play('heal'); await sayAs('TESS', 'On the house. Well. On thirty gold of the house.'); return; }
    if (r === 1) {
      const R = ['Gorr the Unbroken fights in the Pit at the Market Ward. Thirty-one wins. If you beat him, folk say Old Hask wants a word.',
        'Drain 9\'s got something living in it. The Wardens\' Hall has a bounty out. Big money.', 'Doc Marrow\'s been asking after a Glowcap mushroom. Grows deep in the drains.',
        'The Spire Stair goes all the way up the plate pillar. Sable knows a way past the guards. Sable knows a way past everything.'];
      await sayAs('TESS', R[AE.rand(R.length)]);
    }
  };
  EV.a1_pip_bar = async function () { await sayAs('PIP', 'I checked my charge a hundred times. A hundred! It never even blinked. Someone else blew that core.'); };
  EV.a1_marlo_bar = async function () { await sayAs('MARLO', 'My sister lived on Ash Lane. ...Lives. She lives on Ash Lane. I haven\'t been to look.'); };

  EV.a1_bram_hideout = async function () {
    if (F().a1_plan) { await s('bram', 'Spire Stair\'s in the north-east of the Sumps. Sable will meet you there. Stock up first.'); return; }
    cs.music('story');
    await s('bram', 'Here\'s the truth of it. Aurex is calling us murderers on every radio in Halcyon. Undercurrent\'s finished unless we prove otherwise.');
    await s('lyra', 'Dr. Lune\'s authorisation will be on the reactor logs. In Aurex Tower. On the plate.');
    await s('sable', 'Seventy floors up and every lift guarded. Easy.');
    AE.Sfx.play('buzz'); await cs.shake(20);
    await sayAs('RADIO', 'By order of President Aurex: under the Containment Order, all lifts between the undercity and the plate are sealed, effective immediately.');
    await sayAs('RADIO', 'Residents of the Sumps will remain below until the terrorists responsible for Reactor 4 are surrendered.');
    cs.flag('a1_seal');
    await s('bram', '...They\'re going to starve the Sumps until somebody hands us over.');
    await s('sable', 'Then we don\'t take the lifts. The Spire Stair. It\'s the maintenance scaffold up the side of the plate pillar. Six storeys of rust and wind.');
    await s('sable', 'There\'s a barricade and a few bored guards at the bottom. I can deal with bored.');
    await s('bram', 'Up the Stair, across the plate, into the Tower. We take the logs and put Vesper Lune\'s name on every radio in the city.');
    await s('bram', 'Warden. You\'ve done your contract. I can\'t pay you for this one. Not much, anyway.');
    await s('kael', '...');
    await s('lyra', 'Then I\'ll pay him.');
    await s('kael', 'With what?');
    await s('lyra', 'Crystal-moss. A whole bed of it. It\'s the only thing in the Sumps that glows without a reactor. Worth more than gold, if you ask me.');
    await s('kael', 'That\'s not how contracts work.');
    await s('lyra', 'It is today.');
    await s('kael', '...Warden contract one-one-two-eight. Client: Lyra Vale. Escort the client to Aurex Tower, and out again.');
    await s('sable', 'He said yes! Bram, he said yes in his ledger voice!');
    await s('bram', 'HA! Welcome to Undercurrent, Warden. Unofficially. We\'ll have badges made.');
    AE.away('bram', false); AE.away('sable', false);
    AE.setParty(['kael', 'lyra', 'bram']);
    await AE.say('Bram and Sable rejoin. Up to three fight at once: change who fights with Order in the menu (C) or at any save crystal.', { name: 'TIP' });
    await s('sable', 'I\'ll go ahead and get friendly with the guards. Meet me at the Spire Stair, north-east, when you\'re stocked up.');
    await s('sable', 'And Warden? The Market Ward\'s east along Lantern Row. The Pit pays well. Just saying.');
    cs.flag('a1_plan'); cs.remove('bram'); cs.remove('sable'); cs.music('slums');
  };
  EV.a1_sable_hideout = async function () { await s('sable', 'Bram\'s the plan. I\'m the part of the plan that actually works.'); };

  // ---------- the Spire Stair ----------
  EV.a1_stair_locked = async function () {
    if (F().a1_stair) return;
    if (!F().a1_plan) { await AE.say('An Aurex barricade seals the Spire Stair. Guards stand behind it.'); return; }
    if (AE.S_.party.indexOf('sable') < 0) { AE.setParty(AE.S_.party.slice(0, 2).concat(['sable'])); }
    await s('sable', 'There you are. I\'ve made friends with the guards. Well. I\'ve made them very confused.');
    await sayAs('AUREX SERGEANT', 'You! That\'s the girl from the reactor broadcast! Detain them!');
    await s('sable', '...Friends was a strong word.');
    await cs.battle(['patrol', 'a_trooper', 'a_trooper'], { bg: 'factory', noRun: 1 });
    await s('sable', 'Right. The lock\'s a Corvin special. Someone\'s birthday...');
    AE.Sfx.play('door'); cs.flag('a1_stair');
    await s('bram', 'Six floors up, lads. Don\'t look down. Seriously, Pip fell off this thing once.');
    await s('lyra', 'Is Pip all right?');
    await s('bram', 'Pip landed on Marlo. Marlo\'s never forgiven him.');
  };
  EV.a1_brute = async function () {
    if (F().spire_brute) return;
    AE.Sfx.play('quake'); await cs.shake(30);
    await AE.say('A hulking work-brute in a welded harness swings down from the crane, a steel girder in its fists.');
    await s('bram', 'Aurex uses those for heavy lifting. Somebody\'s told this one to lift US.');
    await cs.battle(['brute'], { bg: 'factory', boss: 1, noRun: 1 });
    cs.flag('spire_brute');
    await s('sable', 'And it had a pocket full of gold. I checked. Professional courtesy.');
  };
  EV.a1_view = async function () {
    cs.flag('a1_view'); cs.music('melancholy');
    await AE.say('The scaffold opens onto the wind. Below, all of Halcyon spreads out in rings of light. Below that, the dark of the Sumps.');
    await s('lyra', 'I\'ve never been this high. I\'ve never seen the plate from the outside.');
    await s('lyra', 'It\'s beautiful. That\'s the worst part. It\'s really beautiful.');
    await s('bram', 'I used to stand guard up here. Aurex knight-captain Hollis, polished boots and all.');
    await s('sable', 'You never told me that.');
    await s('bram', 'Not a time I\'m proud of. ...Let it lie, Sable.');
    await s('lyra', 'Kael, where are you from? Really from?');
    await s('kael', 'Thornbrook. A village in Meridia, across the water. It burned when I was twelve.');
    await s('lyra', 'I\'m sorry.');
    await s('kael', 'I don\'t remember the fire. I remember the day after. Ash, coming down like snow. And a woman calling everyone\'s names in the street.');
    await s('kael', 'She called mine three times before I answered. As if I didn\'t know it was mine.');
    await s('sable', '...');
    await s('bram', '...');
    await s('lyra', 'Well. You know it now. Kael Ardent, who won\'t let go.');
    cs.music('factory');
  };

  // ---------- the upper plate and Aurex Tower ----------
  EV.a1_plaza = async function () {
    cs.flag('a1_plaza');
    await AE.say('Aurex Plaza. Clean stone, real trees, and a sky you can see. The tower doors stand ahead.');
    await s('lyra', 'Trees. They have TREES up here.');
    await sayAs('TOWER GUARD', 'Halt! Identification!');
    await s('bram', 'Here\'s my identification.');
    await cs.battle(['secoff', 'secoff'], { bg: 'city', noRun: 1 });
    await s('sable', 'Front door. Bold. I\'d never do it this way.');
    await s('bram', 'That\'s why I do the plans.');
  };
  EV.a1_receptionist = async function () {
    if (!F().a1_lobby) { await sayAs('RECEPTIONIST', 'Welcome to Aurex Dynamics. Do you have an appointment?'); return; }
    await sayAs('RECEPTIONIST', 'Please don\'t hurt me. The stairs are behind the desk. The lifts are off for "security".');
    await sayAs('RECEPTIONIST', '...The Executive Floor is the sixth. If anyone asks, I told you nothing. I\'ve been looking for a new job anyway.');
  };
  EV.a1_lobby = async function () {
    cs.flag('a1_lobby');
    await sayAs('RECEPTIONIST', 'Welcome to Aurex Dynamics. Do you have an appointment?');
    await s('kael', 'No.');
    await sayAs('RECEPTIONIST', 'Then please take a seat. The current wait is approximately... oh. Oh, you\'re the terrorists.');
    AE.Sfx.play('buzz'); await cs.shake(20);
    await sayAs('SPEAKER', 'Security breach in the lobby. All units.');
    await cs.battle(['secoff', 'sentinel', 'secoff'], { bg: 'city', noRun: 1 });
    await s('lyra', 'Stairs behind the desk. Up!');
  };
  EV.a1_records = async function () {
    if (F().a1_records) { await AE.say('Filing drawers, emptied by Sable with great professionalism.'); return; }
    if (!AE.S_.m.sable) { await AE.say('Filing drawers, locked.'); return; }
    await s('sable', 'Records. Ooh, locked drawers. Locked drawers are just drawers that are shy.');
    await AE.wait(30); AE.Sfx.play('chest');
    await s('sable', 'Reactor logs, reactor logs... no. Wait. This one\'s sealed in Lune\'s colour. "PROJECT CRADLE."');
    await AE.gain('vesper_file');
    await s('sable', '"Phase three. Vessel Seven, designation ARDENT, lost during the Reactor 4 field test. Recovery priority: absolute."');
    await s('lyra', 'Ardent. Kael, that\'s your...');
    await s('kael', 'It\'s a common name in Meridia.');
    await s('sable', '...It isn\'t, though.');
    await s('bram', 'Vessel. What in all the deeps is a vessel?');
    await s('sable', '"Vessel Seven exhibits stable memory transfer from the donor. Subject believes himself to be the donor." ...That\'s all. The rest\'s in the Cradle vault, seventh floor.');
    await s('kael', 'Then that\'s where we go. For the logs.');
    await s('lyra', 'For the logs. Sure.');
    cs.flag('a1_records');
  };
  EV.a1_specimen = async function () {
    AE.Sfx.play('quake'); await cs.shake(40);
    await AE.say('Every tank in the lab cracks at once. Something tall and pale climbs out of the largest, trailing light like a wet sheet.');
    await s('lyra', 'It\'s... made of the flow. Raw Aetherflow, poured into a shape. And it\'s singing.');
    await s('lyra', 'That\'s my lullaby. Why does it know my lullaby?!');
    await cs.battle(['h0'], { bg: 'city', boss: 1, noRun: 1 });
    cs.flag('a1_specimen');
    await s('lyra', 'It stopped singing. ...It sounded relieved.');
    await s('bram', 'Upstairs. Before Aurex grows another one.');
  };
  EV.a1_exec = async function () {
    cs.flag('a1_exec'); cs.music('revelation');
    await AE.say('Voices from the boardroom. Bram waves everyone down behind the partition.');
    cs.spawn('corvin', 'corvin', 13, 6, 2); cs.spawn('vesper', 'vesper', 22, 6, 2); cs.spawn('dragoX', 'drago', 28, 6, 2);
    cs.spawn('b1', 'Noble', 16, 8, 1); cs.spawn('b2', 'Sultan', 19, 8, 1); cs.spawn('b3', 'OldMan2', 25, 8, 1);
    await cs.pan(19, 6, 50);
    await sayAs('CORVIN AUREX', 'Reactor 4 has cost us four percent of output. It has also handed us a war we can sell. Every family on the plate is afraid of the dark now.');
    await sayAs('CORVIN AUREX', 'Afraid people pay for light, gentlemen. Afraid people pay double.');
    await sayAs('BOARD MEMBER', 'And the Sumps?');
    await sayAs('CORVIN AUREX', 'Sealed until Undercurrent is hanged in the Market Ward. Captain Venn assures me it will be quick.');
    await sayAs('DRAGO', 'I assured you it would be thorough, sir. I said nothing about quick.');
    await sayAs('CORVIN AUREX', 'Dr. Lune. Your little science project. The board would like to know why it needed a whole reactor.');
    await sayAs('VESPER', 'Because Reactor 4 sat on the deepest vein of the Aetherflow in Halcyon, President. And because my Vessel needed to come home.');
    await sayAs('VESPER', 'Project Cradle is ahead of schedule. Seven years of failures, and then he simply walked into my reactor on his own two feet.');
    await sayAs('VESPER', 'Once the four Crystals are drained, the Sky Citadel rises. You will have the only throne in the sky.');
    await sayAs('CORVIN AUREX', 'A throne. Yes. Good. Thrones are good business.');
    await sayAs('VESPER', 'They are the only business.');
    await AE.wait(30); cs.face('vesper', 2); await cs.pan(AE.field().player.x, AE.field().player.y, 40);
    await sayAs('VESPER', '...Come up to the vault when you\'re ready, bright boy. I left the door open for you.');
    await cs.pan(19, 6, 30);
    await sayAs('CORVIN AUREX', 'Doctor? Who are you talking to?');
    await sayAs('VESPER', 'Old friends. Meeting adjourned.');
    await AE.game.fadeOut(0.05);
    ['corvin', 'vesper', 'dragoX', 'b1', 'b2', 'b3'].forEach(cs.remove);
    cs.follow(); await AE.game.fadeIn(0.05);
    await s('lyra', 'She knew we were here. She looked right at you, Kael.');
    await s('bram', '"Drain the four Crystals." The Crystals hold up the sky. Even Aurex isn\'t that mad.');
    await s('sable', 'Not Aurex. Her. Corvin thinks it\'s a business plan. She doesn\'t.');
    await s('kael', 'The vault. The logs will be there.');
    await s('lyra', 'Kael...');
    await s('kael', 'The logs.');
    cs.music('city');
  };
  EV.a1_tank = async function () { await AE.say('A tank of pale fluid. Inside floats a sleeping young man with your face. A plate reads: VESSEL 3 - DEGRADED. DO NOT WAKE.'); };
  EV.a1_tank2 = async function () { await AE.say('Another tank. Another sleeper with your face, thinner, older somehow. VESSEL 5 - MEMORY REJECTED. SUBJECT REVERTED.'); };
  EV.a1_vault = async function () {
    cs.flag('a1_vault'); cs.music('mystic');
    await AE.say('Rows of tanks glow in the dark. In every one floats a young man with silver-blond hair, eyes closed. Every one of them has Kael\'s face.');
    await s('bram', 'Deeps preserve us.');
    await s('kael', '...They\'re not me.');
    await s('lyra', 'Kael, look at me. Look at me, not at them.');
    cs.spawn('vesper', 'vesper', 17, 7, 2);
    await AE.wait(30); AE.Sfx.play('echo');
    await sayAs('VESPER', 'They\'re not you. You\'re right, bright boy. They\'re what you would have been if you had not come out right.');
    await sayAs('VESPER', 'Seven tries. Seven sleeping boys. And then you. The one who walked out of Thornbrook\'s ashes believing every word of a dead man\'s memories.');
    AE.game.flash = 10; await cs.shake(20);
    await s('kael', 'Get... out of my head.');
    await sayAs('VESPER', 'Oh, I\'m not in your head. You\'re in mine. You always have been.');
    await sayAs('VESPER', 'Mother Ilse used to say you would forget your own name if it weren\'t sewn into your coat. Do you remember Mother Ilse, Kael?');
    await s('sable', '...');
    await s('lyra', 'Leave him alone!');
    await sayAs('VESPER', 'A Chorus girl. Of course. The flow brings its singers together at the end of things. You hear it weeping, don\'t you, little one?');
    await sayAs('VESPER', 'I\'m going to make it stop. I\'m going to make everything stop hurting. You will see.');
    await s('bram', 'You dropped a plate on two hundred people!');
    await sayAs('VESPER', 'Two hundred and twelve. I counted, Captain Hollis. I always count. You should try it some time. Thornbrook, for instance.');
    await s('bram', '...!');
    await sayAs('VESPER', 'Go on up to the roof, children. Drago so wants to meet you properly. And Kael... when the Crystals call you, answer. You won\'t be able to help it.');
    await AE.game.fadeOut(0.06); cs.remove('vesper'); await AE.game.fadeIn(0.06);
    await s('lyra', 'She\'s gone. Kael? Kael, talk to me.');
    await s('kael', 'I remember Thornbrook. I remember the well and the mill and the orphanage on the hill. I remember the fire. I REMEMBER it.');
    await s('lyra', 'Then it\'s yours. Whatever she says. Come on. The roof.');
    await s('sable', '(...Mother Ilse.)');
    AE.Sfx.play('door');
  };
  EV.a1_drago = async function () {
    cs.flag('a1_drago'); cs.music('boss');
    cs.spawn('drago', 'drago', 21, 13, 2); cs.spawn('g1', 'officer', 19, 14, 2); cs.spawn('g2', 'officer', 23, 14, 2);
    await cs.pan(21, 15, 30);
    await sayAs('DRAGO', 'There you are. The Warden who isn\'t on the roster, the Chorus girl, the thief, and... Captain Hollis. I wondered when.');
    await s('bram', 'Venn. Still polishing Aurex\'s boots?');
    await sayAs('DRAGO', 'Still running from what you did in them?');
    await sayAs('DRAGO', 'Warden. You want to know what you are? So do I. Let\'s find out the honest way.');
    await cs.battle(['secoff', 'drago1', 'secoff'], { bg: 'sky', boss: 1, noRun: 1 });
    cs.remove('g1'); cs.remove('g2'); cs.follow();
    await sayAs('DRAGO', 'Ha... You fight like the Academy. Every textbook stance, perfect. Too perfect. Like someone learned you out of a book.');
    AE.Sfx.play('quake'); await cs.shake(30);
    await AE.say('An Aurex gunship rises beside the roof. Drago steps back onto its ramp.');
    await sayAs('DRAGO', 'This isn\'t over. I\'ll be the one who finds out what you are. Not her.');
    cs.remove('drago');
    await s('bram', 'Cargo lift! East edge of the roof! It runs straight down to the Rail Yards!');
    await s('sable', 'We\'re leaving Halcyon? Without the logs?');
    await s('lyra', 'We have the Cradle file. And Vesper\'s going after the Crystals. Somebody has to get there first.');
  };
  EV.a1_cargo_lift = async function () {
    const r = await AE.ask('Take the cargo lift down to the Rail Yards? (You can\'t come back up.)', ['Go', 'Not yet'], { cancel: 1 });
    if (r !== 0) return;
    AE.Sfx.play('door'); await cs.warp('railyards', AE.MAPS.railyards.entry[0], AE.MAPS.railyards.entry[1], 2);
  };
  EV.a1_yards_in = async function () {
    cs.flag('a1_yards_in');
    await s('sable', 'The Rail Yards. Freight Nine leaves for the Ashfields on the hour, and it never stops for anyone.');
    await s('bram', 'Then we don\'t ask it to. Through the yards, onto the engine, out of Halcyon.');
    await s('lyra', 'Nan Corra... Pip, Marlo, the Sumps...');
    await s('bram', 'The Sumps has survived Aurex for forty years. It\'ll survive one more month. But Vesper won\'t stop at one city.');
    await s('kael', 'The contract was the tower and out again. This is the out again.');
    await s('lyra', '...Thank you, Kael.');
  };
  EV.a1_train = async function () {
    cs.flag('a1_train');
    await AE.say('Freight Nine hisses at the platform, steam boiling off its iron flanks. Something huge and armoured climbs down from the engine roof.');
    await sayAs('IRON JUGGERNAUT', 'RAIL SECURITY UNIT ONE. ALL OUTBOUND TRAFFIC SUSPENDED. COMPLY.');
    await s('sable', 'A rail guardian. They bolted a rail guardian to the train.');
    await s('bram', 'Then we unbolt it!');
    await cs.battle(['juggernaut'], { bg: 'factory', boss: 1, noRun: 1 });
    // the chase: Aurex skimmer-bikes run the train down on the Ashfields road
    cs.music('battle');
    await AE.say('Freight Nine lurches out of the yards. Behind it, engines scream: a whole squadron of Aurex skimmer-bikes pours out of the gate.');
    await s('sable', 'There\'s a skimmer chained to the flatcar! Warden, can you ride?');
    await s('kael', 'The Academy taught us.');
    await s('sable', 'The Academy taught you EVERYTHING, didn\'t it. Go!');
    for (;;) {
      const r = await AE.chase({ secs: 70 });
      if (r === 'win') break;
      const again = await AE.ask('The bikes have the train boxed in! Try again?', ['Again!', 'Again (Sable drives slower)'], { name: 'BRAM' });
      if (again === 1) AE.S_.flags.chase_easy = 1;
    }
    AE.S_.gold += 1200; AE.Sfx.play('coin'); await AE.notice('The Aurex riders drop 1,200 Gil on the road.');
    await s('bram', 'HA! Look at them tumble! Kid, you ride like a lunatic.');
    cs.music('story');
    await cs.narrate(['Freight Nine tore out of the Halcyon yards at dawn, four stowaways in its coal tender.',
      'Behind them, the plate shone like a crown over the dark of the Sumps.', 'Ahead lay the Ashfields, and beyond them, the whole of Meridia.',
      'Somewhere in a laboratory in the sky, a woman with silver hair smiled, and wrote a seventh name in her ledger.']);
    await cs.title('END OF ACT I', 'HALCYON', 180);
    cs.chapter(2); cs.flag('a1_done');
    await AE.say('The whole world is open to you now. Thornbrook lies east across the Ashfields. Use the map (M) to find your way.', { name: 'TIP' });
    const p = AE.landNear(80, 97);
    AE.toWorld(p[0], p[1]);
  };
  // after Act I, Halcyon is sealed
  EV['place:halcyon'] = async function () { await AE.notice('Halcyon\'s gates are sealed under the Containment Order.'); };
})();

// the nearest walkable world tile to (x, y)
AE.landNear = function (x, y) {
  for (let r = 0; r < 30; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    if (AE.WALK.foot.indexOf(AE.wtile(x + dx, y + dy)) >= 0) return [x + dx, y + dy];
  }
  return [x, y];
};
