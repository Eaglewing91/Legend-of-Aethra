/* ================= The story, deepened =================
   New scenes that fill the gaps between the big beats, so the cast have room to be people:
   - Night talks: the first time you rest at an inn in each part of the story, the party talks into the night.
     Every character's arc gets its quiet moments here (Kael's borrowed memories, Lyra and the Chorus, Bram's guilt,
     Sable's secret, Orin's shame, Ember's mother, Rook's archive, Vesna's past, Drago's doubts).
   - Arrivals: first visits to Port Lark, Saltmere, Sunscar, Frostgate, the Deeproot, Mideel and the Academy are staged.
   - The world reacting: Aurex broadcasts after each Crystal falls; Corvin Aurex on screen; Halcyon after the plate.
   - The last night before the Citadel, aboard the Academy.
   Written as additions: none of the original events lose a line, so every story flag fires as before. */
(function () {
  const cs = AE.cs, EV = AE.EV, F = function () { return AE.S_.flags; };
  const s = function (who, t) { return cs.s(who, t); }, sayAs = function (n, t) { return AE.say(t, { name: n }); };
  const inP = function (id) { return AE.S_.party.indexOf(id) >= 0 || AE.S_.reserve.indexOf(id) >= 0; };
  const has = function () { for (let i = 0; i < arguments.length; i++) if (!inP(arguments[i])) return false; return true; };
  const once = function (flag) { if (F()[flag]) return false; cs.flag(flag); return true; };
  const field = function () { return AE.field(); };
  // stage someone near the hero for a scene (they walk in from a step or two away)
  const stage = async function (id, who, dx, dy, dir) {
    const f = field(); if (!f) return; const p = f.player;
    cs.spawn(id, who, p.x + dx, p.y + dy, dir === undefined ? 2 : dir);
  };
  const leave = function (ids) { ids.forEach(function (id) { try { cs.remove(id); } catch (e) {} }); };
  const after = function (name, fn) { const o = EV[name]; EV[name] = async function () { const r = o ? await o.apply(this, arguments) : undefined; await fn.apply(this, arguments); return r; }; };
  const before = function (name, fn) { const o = EV[name]; EV[name] = async function () { await fn.apply(this, arguments); return o ? o.apply(this, arguments) : undefined; }; };
  const onEnter = function (map, fn) { const o = EV['enter:' + map]; EV['enter:' + map] = async function () { if (o) await o.apply(this, arguments); await fn.apply(this, arguments); }; };
  const broadcast = async function (lines) {
    AE.Sfx.play('text'); await AE.say('A crackle from every speaker in town. The Aurex broadcast.');
    for (const l of lines) await sayAs(l[0], l[1]);
  };

  // ======================= NIGHT TALKS (first inn rest in each part of the story) =======================
  const TALKS = [
    // ---- Act II ----
    { id: 'n_ashfields', ch: 2, need: ['kael', 'lyra'], run: async function () {
      await cs.narrate(['That night, nobody could sleep. The inn\'s fire burned low, and one by one they drifted down to sit by it.']);
      await s('lyra', 'Can I ask you something? On the train, when you said "the Academy taught us". Do you remember the Academy? Really remember it?');
      await s('kael', 'The drill yard. The bell at five. Headmaster Cairn\'s voice. The smell of oil on the practice blades.');
      await s('kael', '...I don\'t remember a single face. Not one other cadet. Isn\'t that strange? Three years, and nobody.');
      await s('lyra', 'Maybe you were a loner.');
      await s('kael', 'Maybe I wasn\'t there.');
      if (inP('bram')) await s('bram', 'You were there. I checked your papers before Reactor 4. Sworn and sealed. Whatever you are, the Academy put its name to you.');
      if (inP('sable')) await s('sable', '...');
      await s('lyra', 'Then we go to Thornbrook and find out. Together. That\'s the job now.');
    } },
    { id: 'n_thorn', ch: 2, need: ['kael', 'bram'], when: function () { return F().a2_ilse; }, run: async function () {
      await cs.narrate(['The Lantern House. Mother Ilse made up beds for all of them, and nobody had the heart to say no.', 'Bram Hollis sat on the back step in the cold until Kael came out to find him.']);
      await s('bram', 'I keep waiting for you to hit me. It\'d be easier.');
      await s('kael', 'For you.');
      await s('bram', 'For me. Aye.');
      await s('bram', 'I\'ll tell it properly, Kael. All of it. When you\'re ready to hear it, not when I\'m ready to say it. I owe you that much.');
      await s('kael', 'Mother Ilse made you up a bed. Next to mine. She doesn\'t know. I\'m not going to tell her.');
      await s('bram', '...Thank you.');
      if (inP('sable')) { await s('sable', 'You two done brooding? She\'s made cocoa. Nobody says no to Mother Ilse\'s cocoa. I tried once. I was six. I still regret it.'); }
    } },
    { id: 'n_spire', ch: 2, need: ['kael', 'sable'], when: function () { return F().a2_prison_out; }, run: async function () {
      await cs.narrate(['The Gilded Rest. Silk sheets, gold taps, and a bill the Owner would never send.']);
      await s('sable', 'Warden. Can I tell you something? About him. The other Kael.');
      await s('kael', 'Go on.');
      await s('sable', 'He was rubbish at cards. Truly terrible. He always played his best card first because he thought it was rude to make people wait.');
      await s('kael', '...I do that.');
      await s('sable', 'I know. I watched you in the Lucky Lantern. I nearly cried into my drink.');
      await s('sable', 'I knew from the first night in the Sumps. I followed you to Halcyon because I thought... I thought maybe he got out. I thought maybe they\'d been keeping him.');
      await s('kael', 'And then you found me.');
      await s('sable', 'And then I found you. And you\'re not him. But you\'re not nothing either. I\'m still working out what you are. ...You\'re my friend. That\'ll do for now.');
    } },
    { id: 'n_wind', ch: 3, need: ['kael', 'lyra'], run: async function () {
      await cs.narrate(['Across the strait, in a harbour inn that smelled of tar and rain, Kael finally said it out loud.']);
      await s('kael', 'When she counts, everything goes quiet. Like being underwater. I can see my hand moving and I don\'t mind. That\'s the worst part. I don\'t mind.');
      await s('lyra', 'At the shrine, I heard the Crystal sing. Right through her counting. It was like... like the Chorus songs my gran used to hum when she thought nobody was listening.');
      await s('lyra', 'Gran said our family "heard the deep". I thought it was just one of her things. Then Reactor 4 started screaming, and I was the only one who could hear it.');
      await s('kael', 'So you can hear the Crystals, and I can\'t stop walking to them. What a pair.');
      await s('lyra', 'Then here\'s the deal. You walk; I sing. Every time. Even if I have to sing badly.');
      await s('kael', 'You sang badly at the shrine?');
      await s('lyra', 'Terribly. It still worked. Don\'t tell anyone.');
    } },
    // ---- Act III ----
    { id: 'n_sunscar', ch: 3, need: ['kael', 'orin'], when: function () { return F().a3_orin; }, run: async function () {
      await cs.narrate(['Sunscar\'s inn had one lamp, and Orin Thale sat under it with a book he wasn\'t reading.']);
      await sayAs('ORIN', 'She used to sit exactly where you are sitting. Fifteen years old. She would ask me a question, and before I could answer, she would ask four more.');
      await sayAs('ORIN', '"Can the Aetherflow give back what it takes?" That was the one. I said: in the old stories, sometimes. She wrote it down. She underlined it twice.');
      await s('kael', 'You didn\'t make her do this.');
      await sayAs('ORIN', 'No. Grief did that, and Nyxar fed it. But I handed a grieving child a key and called it a lesson. A teacher is supposed to know what his lessons are for.');
      await sayAs('ORIN', 'When we find her, I would like to speak to her first. Not to stop her. I am not a fool. Only to say I am sorry, before anyone draws a sword.');
      await s('kael', 'You\'ll get your chance. I promise.');
    } },
    { id: 'n_rook', ch: 3, need: ['kael', 'rook'], when: function () { return F().a3_dive; }, run: async function () {
      await sayAs('ROOK', 'Kael. A question, if permitted. You are not the boy. Yet you remember being him. Does that hurt?');
      await s('kael', 'Like a tooth that isn\'t there.');
      await sayAs('ROOK', 'I have held his last memory for seven years. Every night I run it, in case something changes. Nothing ever changes. He always goes back for the tenth.');
      await sayAs('ROOK', 'I do not know what I am for, now that I have given it to you. Archive constructs are built to keep. Not to... let go.');
      await s('kael', 'Then keep this instead. Whatever happens next. Somebody should remember it properly.');
      await sayAs('ROOK', '...Acknowledged. New archive opened. Title: "The ones who went back."');
    } },
    { id: 'n_vesna', ch: 3, need: ['kael', 'vesna'], run: async function () {
      await sayAs('VESNA', 'You want to know why I left. Everybody does, eventually. Ask.');
      await s('kael', 'Why did you leave?');
      await sayAs('VESNA', 'Vessel Two opened its eyes and asked for its mother. In a twelve-year-old\'s voice. Then it stopped. Vesper wrote down the time.');
      await sayAs('VESNA', 'I walked out that night. I told myself someone else would stop her. Seven years of telling myself that, with a rifle and a bottle.');
      await sayAs('VESNA', 'You\'re Seven, by the way. The seventh try. You\'re the first one who didn\'t stop.');
      await s('kael', '...Thank you for telling me.');
      await sayAs('VESNA', 'Don\'t thank me. Live. That\'s the only apology I\'ll take from either of us.');
    } },
    // ---- Act IV ----
    { id: 'n_frost', ch: 4, need: ['kael', 'lyra'], run: async function () {
      await cs.narrate(['Snow against the shutters. The Skylark tied down in the square, creaking. Three Crystals gone.']);
      await s('lyra', 'One left. And she\'ll call you. You know she will.');
      await s('kael', 'I know.');
      await s('lyra', 'So what do we do? Leave you behind? Tie you to the Skylark?');
      await s('kael', 'If it comes to it. Yes. Tie me down, knock me out, sit on me. Whatever it takes.');
      await s('lyra', 'And if it doesn\'t work?');
      await s('kael', 'Then don\'t follow me. Promise.');
      await s('lyra', '...No. I won\'t promise that. Ask me something else.');
      if (inP('sable')) await s('sable', 'She won\'t promise. I won\'t promise. Bram definitely won\'t. Face it, Warden, you\'re stuck with us.');
    } },
    { id: 'n_lumen', ch: 4, need: ['ember'], when: function () { return F().a4_ember; }, run: async function () {
      await sayAs('EMBER', 'Can I sit here? The Elders snore. All of them. In harmony.');
      if (inP('lyra')) await s('lyra', 'Of course. ...You were very brave at the trial.');
      await sayAs('EMBER', 'My mother was the summoner before me. She went to the Crater to listen to it, two winters ago. She said someone had to understand it.');
      await sayAs('EMBER', 'She didn\'t come back. And now the voice sounds like her. It says "Ember, come home". It says it every night.');
      if (inP('kael')) await s('kael', 'Vesper hears a voice too. It promised her someone back.');
      await sayAs('EMBER', 'That\'s how it works. It finds the hole in you and it fits itself into it. The Echoes taught me its name, so I can say it out loud. Saying it makes it smaller.');
      await sayAs('EMBER', 'Nyxar. ...See? Smaller.');
    } },
    // ---- Act V ----
    { id: 'n_academy', ch: 5, need: [], when: function () { return !F().a5_kael; }, run: async function () {
      await cs.narrate(['The Academy\'s dormitories had been built for three hundred cadets. Most of the beds were empty. The engines hummed under the floor.']);
      if (inP('bram')) await s('bram', 'She jumped. Didn\'t even look back. Just ran and jumped.');
      if (inP('sable')) await s('sable', 'That\'s Lyra. That\'s exactly Lyra. She\'ll have grabbed him by the collar and refused to let go. You watch.');
      if (inP('orin')) await sayAs('ORIN', 'The Aetherflow gives back what it takes, the old books say. Sometimes. I used to think that was a comfort. Tonight I will choose to think so again.');
      if (inP('ember')) await sayAs('EMBER', 'I can hear the Echoes. They\'re not sad. They\'re waiting. That\'s different from sad.');
      if (inP('rook')) await sayAs('ROOK', 'I am adding tonight to the archive. Title: "The ones who waited."');
      await AE.say('Somewhere below, a Warden cadet began to play a flute, badly. Nobody asked him to stop.');
    } },
    { id: 'n_return', ch: 5, need: ['kael', 'lyra'], when: function () { return F().a5_kael; }, run: async function () {
      await s('lyra', 'How does it feel? Being... you?');
      await s('kael', 'Quieter. Her counting\'s gone. I listened for it all the way here. Nothing.');
      await s('lyra', 'And Thornbrook? The memories?');
      await s('kael', 'Still there. I still love that village. I just know it isn\'t mine to grieve. It\'s his. I\'ll put flowers on his stone when this is over.');
      await s('lyra', 'And what\'s yours?');
      await s('kael', 'Reactor 4. A girl who opened a door for strangers. The Sumps. Bram\'s terrible singing. Sable stealing my boots. You, jumping into a river of memory after somebody who wasn\'t sure he existed.');
      await s('lyra', 'That\'s a good list.');
      await s('kael', 'I\'m keeping it.');
    } },
  ];
  const nightTalk = async function () {
    const S = AE.S_; S.talks = S.talks || {};
    const t = TALKS.find(function (x) { return !S.talks[x.id] && S.chapter === x.ch && x.need.every(inP) && (!x.when || x.when()); });
    if (!t) return;
    S.talks[t.id] = 1; const mus = AE.S_.musicOverride; cs.music('quiet');
    await t.run();
    cs.music(mus || null);
  };
  const inn0 = AE.inn;
  AE.inn = async function () { const r = await inn0.apply(this, arguments); if (r) await nightTalk(); return r; };
  AE.nightTalk = nightTalk; AE.TALKS = TALKS;

  // ======================= ACT II =======================
  after('a2_memorial', async function () {
    if (!once('st_memorial')) return;
    await AE.say('Kael kneels and traces the letters with one finger. They are cut deep. Someone has kept them clean for seven years.');
    if (inP('sable')) await s('sable', 'I scrubbed it, every summer, before I ran off to Halcyon. Somebody kept on after I left.');
  });
  after('a2_moleking', async function () {
    if (!once('st_mine')) return;
    if (inP('bram')) await s('bram', 'Aurex drill-heads, all the way down. They\'re not mining silver. They\'re mining the Aetherflow itself. Bleeding the mountain.');
    if (inP('lyra')) await s('lyra', 'It\'s everywhere. The forest, the mine, the reactors. They\'re drinking the whole world dry, and calling it progress.');
  });
  after('a2_engine', async function () {
    if (!once('st_wind_after')) return;
    await broadcast([['AUREX BROADCAST', 'This is Aurex Dynamics, keeping your lights on. The Windhaven installation has been secured following a terrorist attack on the shrine.'],
      ['CORVIN AUREX', 'Citizens, this is your President. The Wind Crystal is safe in Aurex hands. Its energy will power Halcyon for a century. Sleep well, Aethra.'],
      ['AUREX BROADCAST', 'Dr. Vesper Lune, our chief engineer, was unavailable for comment.']]);
    if (inP('bram')) await s('bram', '"Safe in Aurex hands." The Crystal\'s in pieces at the bottom of a valley.');
    await s('kael', 'He doesn\'t know. Corvin. He thinks she works for him.');
    if (inP('lyra')) await s('lyra', 'Then he\'s in for a nasty surprise.');
  });

  // ======================= ACT III =======================
  onEnter('portlark', async function () {
    if (!F().a2_done || !once('st_portlark')) return;
    await AE.say('Port Lark. Gulls, rope, tar, the smell of fish, and beyond the harbour wall, the sea, grey to the edge of the world.');
    if (inP('lyra')) { await s('lyra', 'I\'ve never seen it. Not once. Twenty years in Halcyon, under the plate, and I\'ve never seen the sea.'); }
    if (inP('sable')) await s('sable', 'It\'s mostly wet. You get used to it.');
    if (inP('lyra')) await s('lyra', 'It\'s singing. Very far away. Very low. Like somebody humming in another room.');
    await s('kael', 'Is that good or bad?');
    if (inP('lyra')) await s('lyra', '...It\'s singing the way a person hums when they\'re trying not to cry.');
  });
  onEnter('saltmere', async function () {
    if (!F().a3_ferry || !once('st_saltmere')) return;
    await AE.say('Saltmere. Drying racks stand empty along the quay. The water in the harbour is the colour of bottle glass, and very still.');
    await sayAs('FISHERWOMAN', 'Three weeks. Not a fish. Not one. The old women say the sea\'s gone to sleep. The young ones say Aurex poisoned it. Me, I say both.');
    await sayAs('FISHERWOMAN', 'There was a light out past the reef, the night it happened. Like a lighthouse, but underwater. Then nothing.');
    if (inP('sable')) await s('sable', 'Smugglers\' Grotto\'s round the point. If anybody\'s got a way under the water, it\'s Kestra. ...She\'s going to kill me.');
  });
  before('a3_sunscar', async function () {
    if (F().a3_sunscar || F().vesna_joined) return;
    await AE.say('On a rooftop above the well, a woman with a long rifle watches you walk into town. When you look up, she is gone.');
    if (inP('sable')) await s('sable', 'Somebody\'s been following us since the ferry. I keep seeing the glint off that scope.');
  });
  after('a3_dive3', async function () {
    if (!once('st_after_dive') || !inP('sable')) return;
    await s('sable', 'The tenth child.');
    await s('kael', 'Sable?');
    await s('sable', 'It was me. I was five. He put me down on the grass and said "stay". And then he went back in for Tomas, and the roof...');
    await s('sable', 'I\'ve been trying to say thank you for twelve years, and I\'ve been saying it to the wrong face.');
    await s('kael', 'Say it to him. On the stone. I\'ll come with you.');
  });

  // ======================= ACT IV =======================
  after('a4_frost', async function () {
    if (!once('st_frost')) return;
    await broadcast([['AUREX BROADCAST', 'Fire Crystal installation at Mount Cinder: offline. Water installation at the Coral Sanctum: offline. Wind installation: offline.'],
      ['CORVIN AUREX', 'Doctor Lune. Doctor LUNE. This is the President. You will report to the board, in person, by the end of the week. Three Crystals and not one watt delivered.'],
      ['VESPER', 'Corvin. Darling. I never worked for you. You were a very large purse with a very small man attached. Go and look out of your window tonight. Look up.']]);
    if (inP('orin')) await sayAs('ORIN', 'She has stopped pretending. That is when she is most dangerous.');
  });
  onEnter('deeproot_3', async function () {
    if (!once('st_deeproot')) return;
    await AE.say('The roots of the world grow down through the cavern roof, as thick as towers. Some of them glow faintly. Some of them are bleeding light.');
    if (inP('lyra')) await s('lyra', 'The Earth Crystal is crying. I can hear all four now, Kael. Three of them are just... echoes. Ghosts. This one is the last real voice.');
    if (inP('ember')) await sayAs('EMBER', 'The Echoes say the Sky Wardens are dreaming. When this one breaks, they wake up. All of them, at once.');
    if (inP('kael')) await s('kael', 'If I start walking towards her, stop me. Whatever it takes.');
    if (inP('bram')) await s('bram', 'I\'ll sit on you myself. I\'m very heavy.');
  });
  // Drago's fourth fight and Corvin's last call, before the Sundering
  before('a4_sundering', async function () {
    if (!once('a4_drago4')) return;
    cs.music('tension');
    await stage('drago', 'drago', 0, -3, 2);
    await sayAs('DRAGO', 'Warden. Fourth time. You keep turning up where the world is ending.');
    await sayAs('DRAGO', 'President Aurex ordered me to hold this cavern. Nobody in, nobody out. Not her. Not you. I\'m told she\'s already inside. I\'m told a lot of things.');
    await s('kael', 'Then let us through and we\'ll stop her.');
    await sayAs('DRAGO', 'You\'re the one she needs, you fool. You\'re the key. The best thing I can do for this world is make sure you never reach that Crystal.');
    await cs.battle(['flametrooper', 'drago4', 'flametrooper'], { bg: 'cave', boss: 1, noRun: 1 });
    await sayAs('DRAGO', '...Fine. FINE. Go. If you\'re walking to her, at least you\'re walking on your own feet.');
    await sayAs('DRAGO', 'And Warden: if this goes wrong, it was never your fault. Remember that. Somebody should say it to you once.');
    leave(['drago']);
  });

  // ======================= ACT V =======================
  before('a5_headmaster', async function () {
    if (F().a5_kael || !once('st_academy')) return;
    cs.music('sad');
    await AE.say('The Vanguard Academy\'s war room. A long table, a map of the world with red ink spreading across it, and a tall old man in a Warden\'s coat.');
    await sayAs('HEADMASTER CAIRN', 'Sit. All of you. You look like you\'ve walked through the end of the world, which I suppose you have.');
    await sayAs('HEADMASTER CAIRN', 'I swore Kael in myself. Six months ago. He walked into this room on his own two feet with a letter of acceptance in a hand nobody here had ever seen.');
    await sayAs('HEADMASTER CAIRN', 'I knew what he was. A Cradle Vessel. Aurex sent him to us to be "trained". I took him anyway. Do you know why?');
    if (inP('bram')) await s('bram', 'Because the contract\'s sacred. Whoever signs it.');
    await sayAs('HEADMASTER CAIRN', 'Because he asked to be a Warden. Not Aurex. Him. Whatever made him, the boy who stood here wanted to protect people. That was enough for me.');
  });
  onEnter('mideel', async function () {
    if (!F().a4_done || F().a5_kael || !once('st_mideel')) return;
    await AE.say('Mideel Shallows. Houses on stilts over water that glows faintly green at the edges. The Aetherflow comes up here, quiet, like breath on a cold morning.');
    if (inP('sable')) await s('sable', 'Something washed up three days ago, they said. Glowing. In the clinic.');
    if (inP('bram')) await s('bram', 'Two somethings, the ferryman said. Two.');
  });
  // Halcyon's last stand: the city remembers who helped
  const hal = EV['place:halcyon'];
  EV['place:halcyon'] = async function (w) {
    const first = F().a5_kael && !F().a5_halcyon;
    if (first) {
      w.busy = true;
      await AE.say('Halcyon. Half the plate has fallen. Through the hole, for the first time in forty years, the Sumps can see the sky. It is red.');
      await sayAs('NAN CORRA', 'Warden! You came back. Course you came back. Half the Sumps is on the rooftops with whatever they could carry. Pip\'s made a catapult. Gods help us.');
      await sayAs('PIP', 'It\'s a TREBUCHET, Nan.');
      if (inP('bram')) await s('bram', 'Undercurrent! On me! Get the children down to the old reactor tunnels. The Academy\'s guns are covering the plate!');
      w.busy = false;
    }
    const r = await hal.apply(this, arguments);
    if (first && F().a5_halcyon) {
      await AE.say('The Sky Warden falls across the broken plate, and lies still. In the Sumps, people come out of their doors and stand in the street, looking up.');
      await sayAs('NAN CORRA', 'Would you look at that. The sky. Red as a sore, but it\'s the sky. My mother told me about it.');
      if (inP('lyra')) await s('lyra', 'Kael. Listen. Can you hear them? Everyone down there, humming. They don\'t even know they\'re doing it.');
    }
    return r;
  };
  // the last night, before the Citadel
  const crater0 = EV['place:crater'];
  EV['place:crater'] = async function (w) {
    if (F().a5_halcyon && !F().st_lastnight) {
      cs.flag('st_lastnight'); w.busy = true; cs.music('quiet');
      await cs.narrate(['The night before the Citadel, the Academy hung in the red sky above the Crater, and nobody slept.', 'One by one, they found their way up to the deck.']);
      if (inP('bram')) await s('bram', 'When this is done, I\'m going back to Thornbrook. Mother Ilse needs a new roof. I owe that village about a thousand roofs.');
      if (inP('sable')) await s('sable', 'I\'m going to open a card hall. Honest games. Mostly honest. Fairly honest.');
      if (inP('orin')) await sayAs('ORIN', 'I am going to speak to my student. That is all I have left to want. It is enough.');
      if (inP('ember')) await sayAs('EMBER', 'I\'m going to say its name to its face. And then I\'m going home, and the Elders are going to make a fuss, and I\'m going to let them.');
      if (inP('rook')) await sayAs('ROOK', 'I will archive all of it. Every word on this deck. Somebody should remember the night before.');
      if (inP('vesna')) await sayAs('VESNA', 'I\'m going to finish what I started with her. Whatever that turns out to mean.');
      if (F().a5_drago_joins) await sayAs('DRAGO', 'I\'m going to find out who I am when nobody\'s giving me orders. Terrifying prospect.');
      if (inP('lyra')) await s('lyra', 'And you, Kael?');
      await s('kael', 'I\'m going to finish the contract. Get everyone out. And back again.');
      if (inP('lyra')) await s('lyra', 'Everyone?');
      await s('kael', 'Everyone. Her too, if she\'ll let me.');
      w.busy = false;
    }
    return crater0.apply(this, arguments);
  };
  // the enemies new to these scenes
  if (AE.ENEMIES.drago3) {
    const D = AE.ENEMIES.drago3; AE.E('drago4', D.name, D.lv + 9, Math.round(D.hp * 1.6), Math.round(D.atk * 1.25), Math.round(D.def * 1.2), Math.round(D.mag * 1.2), Math.round(D.mdef * 1.2), D.spd + 4, Math.round((D.exp || 3000) * 1.5), Math.round((D.ap || 100) * 1.4), 0, D.art, { boss: 1, ai: D.ai, weak: D.weak, absorb: D.absorb });
  }
})();
