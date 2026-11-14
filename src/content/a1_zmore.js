/* ================= Act I additions: Lantern Heights, Ash Lane, and more side quests ================= */
(function () {
  const cs = AE.cs, EV = AE.EV, F = function () { return AE.S_.flags; }, Q = AE.quest;
  const sayAs = function (n, t) { return AE.say(t, { name: n }); };
  AE.ITEMS.clerk_pass = { name: 'Aurex Badge', k: true, desc: 'A security badge, dropped on the Spire Stair. The photo is of a very tired man.' };
  AE.ITEMS.chorus_bell = { name: 'Chorus Bell', k: true, price: 800, desc: 'An ancient brass bell, "liberated" from the Aurex Museum. It hums when Lyra is near.' };
  AE.ITEMS.moss_flower = { name: 'Crystal-moss Flower', k: true, desc: 'A glowing flower from Lyra\'s garden in the Sumps.' };
  AE.ITEMS.nell_letter = { name: 'Nell\'s Letter', k: true, desc: 'A letter from Nell, in the plate, to her brother Marlo, in the Sumps.' };
  AE.SHOPS.sumps_junk.items.push('chorus_bell');
  AE.SHOPS.ph_boutique = { name: 'Silk & Steel', items: ['silk_robe', 'iron_bangle', 'titan_band', 'star_pendant', 'silver_glasses', 'headband', 'power_wrist', 'guard_ring'] };
  Object.assign(AE.QUESTS, { pass: 'The tired clerk\'s badge', museum: 'The missing Chorus Bell', moss: 'A flower from below', marlo: 'Marlo\'s sister', rats: 'Rat patrol (Wardens\' Hall)' });
  AE.ARCANA_FOES.cafe = { name: 'CARD FAN', deck: ['c_trooper', 'c_gunner', 'c_heavy', 'c_drone', 'c_rivet', 'c_hawk', 'c_bulwark'], rules: ['elemental'], wit: 0.65, hi: 'Arcana with coffee! The civilised way. Elemental rules, if you please.', lose: 'Well played. Have a biscuit.' };
  EV.inn_heights = function () { return AE.inn(150, 'CONCIERGE'); };
  EV.a1_cards_cafe = function () { return AE.has('card_deck') ? AE.Arcana.duel('cafe') : sayAs('CARD FAN', 'No deck? The Lucky Lantern in the Market Ward gives them away. Not that I\'ve been down there. Ever.'); };

  // ---------- the tired clerk's badge (Spire Stair) ----------
  EV.a1_q_pass = async function () {
    if (Q('pass') === 'done') { await sayAs('HAGGARD CLERK', 'I still have my job! I hate my job! Thank you!'); return; }
    if (AE.has('clerk_pass')) {
      AE.take('clerk_pass'); Q('pass', 'done');
      await sayAs('HAGGARD CLERK', 'My badge! Where... the Spire Stair? I was never on the Spire Stair. I don\'t know why it was there. Don\'t tell anyone.');
      AE.S_.gold += 500; await AE.notice('Received 500 Gil'); await AE.gain('hi_potion', 2); return;
    }
    await sayAs('HAGGARD CLERK', 'I\'ve lost my security badge. If Aurex finds out I\'ll be sent down to the Sumps. Permanently.');
    await sayAs('HAGGARD CLERK', 'I may, possibly, have taken a shortcut home via the Spire Stair. Once. Hypothetically.');
    if (!Q('pass')) Q('pass', 1);
  };
  // ---------- the missing Chorus Bell (Aurex Museum + Junk Mira) ----------
  const EXH = ['A cutaway model of Reactor 1. A plaque: "Clean light for every home." Someone has written "except the Sumps" in pencil.',
    'A photograph of Aurelian Aurex cutting a ribbon on the first plate pillar, sixty years ago. Below him, in the shadow, a row of workers.',
    'A Crystal shard in a glass case, glowing faintly. The label says it is a replica. It doesn\'t feel like a replica.',
    'An empty plinth. A card reads: "Chorus Bell, 3rd Age. Temporarily removed for cleaning."',
    'A painted map of Aethra with the four Crystals marked in gold. The Crater in the north is painted over in black.',
    'A model of a floating island held up by lines of light. "The Sky Citadel: myth or opportunity? An Aurex Dynamics vision."'];
  EV.a1_exhibit = async function (e) { await AE.say(EXH[(e && e.n) || 0]); if ((e && e.n) === 2 && AE.S_.party.indexOf('lyra') >= 0) await cs.s('lyra', 'It\'s real. It\'s crying, very quietly.'); };
  EV.a1_q_museum = async function () {
    if (Q('museum') === 'done') { await sayAs('CURATOR', 'The Bell is back where it belongs. It rings by itself sometimes. We pretend it doesn\'t.'); return; }
    if (AE.has('chorus_bell')) {
      AE.take('chorus_bell'); Q('museum', 'done');
      await sayAs('CURATOR', 'The Chorus Bell! From a junk stall in the SUMPS? Oh, the Board must never know. You have my eternal, discreet gratitude.');
      await AE.gain('prism:revive'); return;
    }
    await sayAs('CURATOR', 'Welcome to the Museum of Progress. Do mind the empty plinth. Our Chorus Bell was stolen. From a museum! On the plate!');
    await sayAs('CURATOR', 'If such a thing were to turn up... below... one would pay handsomely. Discreetly.');
    if (!Q('museum')) Q('museum', 1);
  };
  // ---------- a flower from below (the boy in Lantern Heights) ----------
  EV.a1_q_kite = async function () {
    if (Q('moss') === 'done') { await sayAs('BOY', 'It still glows! I keep it under my bed. Mum thinks it\'s a lamp.'); return; }
    if (AE.has('moss_flower')) {
      AE.take('moss_flower'); Q('moss', 'done');
      await sayAs('BOY', 'It\'s glowing! With no reactor or anything! Is the whole Sumps like this?');
      if (AE.S_.party.indexOf('lyra') >= 0) await cs.s('lyra', 'Just one garden. Maybe one day more.');
      await AE.gain('speed_draught', 2); AE.S_.gold += 300; await AE.notice('Received 300 Gil'); return;
    }
    await sayAs('BOY', 'My teacher says there\'s a flower in the Sumps that glows by itself. I don\'t believe it. Nothing glows by itself.');
    await sayAs('BOY', 'If you brought me one, I\'d believe it.');
    if (!Q('moss')) Q('moss', 1);
  };
  const fb = EV.a1_flowerbed;
  EV.a1_flowerbed = async function () {
    if (Q('moss') === 1 && !AE.has('moss_flower')) { await AE.say('You carefully pick one glowing flower.'); await AE.gain('moss_flower'); return; }
    return fb.apply(this, arguments);
  };
  // ---------- Marlo's sister (the Spillway -> Ash Lane -> Lantern Heights -> back) ----------
  const mb = EV.a1_marlo_bar;
  EV.a1_marlo_bar = async function () {
    if (Q('marlo') === 'done') { await sayAs('MARLO', 'Nell writes every week now. From the plate. With a stamp and everything. Thank you, Warden.'); return; }
    if (AE.has('nell_letter')) {
      AE.take('nell_letter'); Q('marlo', 'done'); cs.flag('q_marlo_done');
      await sayAs('MARLO', 'This is... this is Nell\'s writing. She\'s alive. She\'s ALIVE. She\'s a maid on the plate? Nell can\'t even fold a sheet!');
      await sayAs('MARLO', 'Here. It\'s not much. It was going to be for her birthday.');
      await AE.gain('prism:mp_plus'); return;
    }
    if (!Q('marlo')) {
      await mb.apply(this, arguments);
      const r = await AE.ask('MARLO: ...Would you go and look, Warden? On Ash Lane? I can\'t. I just can\'t.', ['I\'ll look', 'Not now'], { name: 'MARLO', cancel: 1 });
      if (r === 0) { Q('marlo', 1); cs.flag('q_marlo_go'); await sayAs('MARLO', 'West along Lantern Row. Her name\'s Nell. Nell Barr.'); }
      return;
    }
    await sayAs('MARLO', 'Ash Lane is west along Lantern Row. Nell Barr. Please.');
  };
  EV.a1_memorial = async function () {
    await AE.say('A board nailed to a broken lamp post, covered in names. FOUND. MISSING. SAFE. Some names have been crossed out and written again.');
    if (Q('marlo') === 1) {
      await AE.say('Near the bottom, in fresh chalk: NELL BARR - SAFE - TAKEN UP TO THE PLATE (AUREX RELIEF WORK). LANTERN HEIGHTS.');
      Q('marlo', 2); cs.flag('q_marlo_nell');
      await AE.say('She\'s alive. Someone in Lantern Heights, on the plate, will know where she is.', { name: 'TIP' });
    }
  };
  EV.a1_q_marlo = async function () { await sayAs('MARLO', 'I came anyway. I had to see. ...I can\'t find her name on anything.'); };
  EV.a1_q_sister = async function () {
    if (F().q_marlo_nell && Q('marlo') === 2) { await sayAs('MRS ALBRIGHT', 'Our new girl? Nell. Aurex sent her up from below after the... incident. She works hard. She cries at night. Is she in trouble?'); return; }
    await sayAs('MRS ALBRIGHT', 'Visitors! From the Tower, I expect. Do sit. Don\'t touch the vase.');
  };
  EV.a1_nell = async function () {
    if (AE.has('nell_letter') || Q('marlo') === 'done') { await sayAs('NELL', 'Tell Marlo I\'m eating. Tell him I\'m not, actually, but tell him I am.'); return; }
    await sayAs('NELL', 'Marlo? My brother Marlo sent you? He thinks I\'m dead. Of course he does. Aurex never told anyone where they took us.');
    await sayAs('NELL', 'Wait. Let me write to him. Please take it. They read the post up here.');
    await AE.gain('nell_letter');
  };
  // ---------- small talk ----------
  EV.a1_engineer = async function () {
    await sayAs('RETIRED ENGINEER', 'Forty years on the reactors. Do you know what the Aetherflow sounds like through a pressure valve? Like voices. We all heard them. We all pretended not to.');
    await sayAs('RETIRED ENGINEER', 'Reactor 4 sat on the deepest vein in Halcyon. If someone wanted to drink a lot of the flow very fast, that\'s where they\'d start.');
  };
  EV.a1_butler = async function () {
    await sayAs('BUTLER', F().a1_done ? 'The President is... indisposed. The house is closed to visitors.' : 'The Aurex residence. The President is at the Tower. You may admire the hall. Admire it from where you are standing, please.');
  };
  // ---------- rat patrol (Wardens' Hall) ----------
  const bo = EV.a1_bounty;
  EV.a1_bounty = async function () {
    await bo.apply(this, arguments);
    const k = (AE.S_.bestiary.sumprat || 0);
    if (!Q('rats')) {
      const r = await AE.ask('WARDEN CLERK: Small job, if you want it. Drain 9 rats are getting into the grain. Kill eight Sump Rats. 400 Gil.', ['Take it', 'No thanks'], { name: 'WARDEN CLERK', cancel: 1 });
      if (r === 0) { Q('rats', 1); AE.S_.ratsFrom = k; }
      return;
    }
    if (Q('rats') === 1) {
      const got = k - (AE.S_.ratsFrom || 0);
      if (got >= 8) { Q('rats', 'done'); AE.S_.gold += 400; AE.Sfx.play('coin'); await sayAs('WARDEN CLERK', 'Eight rats. The grain merchants thank you. Here\'s 400.'); }
      else await sayAs('WARDEN CLERK', 'Sump Rats so far: ' + got + ' of 8.');
    }
  };
})();
