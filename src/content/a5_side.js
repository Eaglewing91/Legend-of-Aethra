/* ================= Optional content: Plumage Isle and the Gold Talonbird, Shipwreck Cove, the ultimate weapons,
   the missing Echoes, Vesna's and Rook's stories, the Arcana championship ================= */
(function () {
  const E = AE.E, cs = AE.cs, EV = AE.EV, F = function () { return AE.S_.flags; }, Q = AE.quest;
  const s = function (who, t) { return cs.s(who, t); }, sayAs = function (n, t) { return AE.say(t, { name: n }); };
  const inP = function (id) { return AE.S_.party.indexOf(id) >= 0 || AE.S_.reserve.indexOf(id) >= 0; };
  Object.assign(AE.QUESTS, { races: 'Talonbird ranks (Plumage Isle)', vesna: 'Vesna: Vessel Zero', rookmem: 'Rook\'s last memory', champ: 'Arcana championship', weapons: 'The ultimate weapons' });
  EV.inn_plumage = function () { return AE.inn(100, 'WEN\'S MUM'); };

  // ---------- Plumage Isle: ranked races, training, the Gold Talonbird ----------
  const RANKS = [['C', 6, 50, 500], ['B', 7.5, 65, 1500], ['A', 9, 80, 4000], ['S', 10.5, 95, 0]];
  EV.a5_racescout = async function () {
    const S = AE.S_; S.raceRank = S.raceRank || 0;
    if (!S.mybird) { await sayAs('RACE SCOUT', 'No bird of your own? Kestrel Ranch rears chicks. Find yourself one, then come back and race the ranks.'); return; }
    if (S.raceRank >= 4) { await sayAs('RACE SCOUT', 'S-rank champion. There\'s nobody left to beat. Except yourself.'); return; }
    const R = RANKS[S.raceRank];
    const c = await AE.ask('RACE SCOUT: ' + R[0] + '-rank race. ' + S.mybird.name + ' (speed ' + S.mybird.spd.toFixed(1) + ', stamina ' + S.mybird.sta + ') against the ' + R[0] + '-rank field?', ['Race', 'Not yet'], { name: 'RACE SCOUT', cancel: 1 });
    if (c !== 0) return;
    const field = [0, 1, 2].map(function (k) { return { name: ['Gale', 'Thunderfoot', 'Ember-Tail', 'Dusk', 'Sunwing', 'Old Ironclaw'][(S.raceRank * 2 + k) % 6], spd: R[1] + Math.random() - 0.5, sta: R[2] + AE.rand(10), luck: 30 }; });
    field.push({ name: S.mybird.name, spd: S.mybird.spd, sta: S.mybird.sta, luck: 50, mine: 1 });
    const won = await AE.race({ birds: field, pick: 3, ranked: 1 });
    if (!won) { await sayAs('RACE SCOUT', 'Not this time. Train your bird with Choco-Wen and come back.'); return; }
    S.raceRank++; AE.Sfx.play('save');
    if (S.raceRank < 4) { AE.S_.gold += R[3]; await AE.notice(R[0] + '-rank won! +' + R[3] + ' G'); return; }
    await sayAs('RACE SCOUT', 'S-RANK! ' + S.mybird.name + ' is the fastest bird in Aethra! The old breeder will want to see you.');
    Q('races', 'done');
  };
  EV.a5_breeder = async function () {
    const S = AE.S_;
    if (!S.mybird) { await sayAs('CHOCO-WEN', 'Every racer starts as a chick. Kestrel Ranch, on the mainland, has them.'); return; }
    const r = await AE.ask('CHOCO-WEN: Training session for ' + S.mybird.name + '? 1,000 G. (Speed ' + S.mybird.spd.toFixed(1) + '/12, stamina ' + S.mybird.sta + '/120)', ['Train speed', 'Train stamina', 'Not now'], { name: 'CHOCO-WEN', cancel: 2 });
    if (r === 2) return; if (!AE.pay(1000)) { await sayAs('CHOCO-WEN', 'Birds eat a lot, you know. 1,000 G.'); return; }
    if (r === 0) S.mybird.spd = Math.min(12, S.mybird.spd + 0.6); else S.mybird.sta = Math.min(120, S.mybird.sta + 10);
    AE.Sfx.play('ok'); await AE.notice(S.mybird.name + ' trained hard. Speed ' + S.mybird.spd.toFixed(1) + ', stamina ' + S.mybird.sta + '.');
  };
  EV.a5_oldbreeder = async function () {
    const S = AE.S_;
    if (S.vehicles.gtalon) { await sayAs('OLD BREEDER', 'The gold one\'s waiting by the shore. Mountains, shallow seas: she doesn\'t care.'); return; }
    if ((S.raceRank || 0) < 4) { await sayAs('OLD BREEDER', 'Once in a lifetime a gold talonbird hatches. She only follows an S-rank rider. Race the ranks, then come and see me.'); return; }
    await sayAs('OLD BREEDER', 'S-rank. Well, well. She\'s been watching you race. Come and meet her.');
    const p = AE.WORLD.places.talon_isle, q = AE.landNear(p[0] + 2, p[1] + 2); S.vehicles.gtalon = { x: q[0], y: q[1], have: 1 };
    Q('races', 'done'); AE.Sfx.play('secret'); await AE.notice('The Gold Talonbird waits on the shore. She crosses mountains and shallow seas.');
    await AE.gain('card:c_talon');
  };

  // ---------- Shipwreck Cove: Kestra's last stand and Nocturne ----------
  E('kestra2', 'Kestra, Ghost Captain', 58, 70000, 190, 90, 120, 90, 56, 18000, 500, 20000, { cast: 'sable', k: 1.5, hue: 200, bright: 0.7 }, { boss: 1, ai: [[3, 'kestra_rain'], [2, 'attack'], [1, 'pilfer'], [1, 'void_ray']], drop: [['vanishing_edge', 1]] });
  E('nocturne_g', 'Nocturne', 60, 90000, 170, 100, 190, 120, 50, 22000, 600, 0, { mon: 'Spirit2', k: 3.6, hue: 260, bright: 0.5 }, { boss: 1, absorb: ['dark'], weak: ['holy'], ai: [[2, 'void_ray'], [2, 'wail'], [1, 'nx_forget'], [1, 'attack']] });
  E('wraith', 'Drowned Sailor', 50, 5000, 160, 70, 90, 70, 36, 1000, 60, 600, { mon: 'Skull', hue: 200 }, { undead: 1, weak: ['holy', 'fire'], ai: [[3, 'attack'], [1, 'drain_touch']] });
  E('cove_crab', 'Wreck Crab', 50, 6000, 170, 110, 40, 60, 28, 1000, 60, 500, { mon: 'GreenOctopus', hue: 200 }, { weak: ['bolt'], absorb: ['water'], ai: [[3, 'attack'], [1, 'pinch']] });
  AE.ENC.cove = { bg: 'ship', sets: [{ enemies: ['wraith', 'wraith'], w: 3 }, { enemies: ['cove_crab', 'wraith'], w: 2 }, { enemies: ['wraith', 'wraith', 'cove_crab'], w: 1 }] };
  EV.a5_kestra2 = async function () {
    cs.flag('a5_kestra2');
    await AE.say('A ship\'s wheel spins on its own. A woman in a drowned captain\'s coat steps out of the dark: Kestra, or what the sea kept of her.');
    if (inP('sable')) { await s('sable', 'Kestra?! The Sundering took the Grotto... it took you?'); await sayAs('KESTRA', 'Grotto law, little Sable. Beat me, take what you want. One last time.'); }
    await cs.battle(['kestra2'], { bg: 'ship', boss: 1, noRun: 1 });
    await sayAs('KESTRA', 'Ha... still fast. Take my blade. Vanishing Edge. It was always going to be yours.');
    if (inP('sable')) await s('sable', 'Goodbye, Kestra.');
  };
  EV.a5_nocturne = async function () {
    cs.flag('a5_nocturne');
    await AE.say('In the Black Hold, darkness gathers into wings. An Echo older than shipwrecks: Nocturne, who keeps the memories of the drowned.');
    await cs.battle(['nocturne_g'], { bg: 'underwater', boss: 1, noRun: 1 });
    await AE.gain('prism:nocturne');
  };
  // Ignarok: freed when the Fire Crystal dies (Mount Cinder), not only stolen
  const col = EV.a3_colossus;
  EV.a3_colossus = async function () { await col.apply(this, arguments); if (!AE.S_.prisms.some(function (p) { return p.id === 'ignarok'; })) await AE.gain('prism:ignarok'); };

  // ---------- the ultimate weapons ----------
  const ilse = EV.a2_ilse;
  EV.a2_ilse = async function () {
    if (AE.S_.chapter >= 5 && inP('bram') && !F().ult_bram) {
      cs.flag('ult_bram');
      await sayAs('MOTHER ILSE', 'Captain Hollis. They told me. About the fire, and the order.');
      await s('bram', 'I won\'t ask you to forgive me.');
      await sayAs('MOTHER ILSE', 'Good. I won\'t, yet. But you\'ve been carrying this house\'s children on your back for a year, I hear. Carry this too. It was the old Warden\'s. Kael\'s father.');
      await AE.gain('bastion'); return;
    }
    return ilse.apply(this, arguments);
  };
  const elder = EV.a2_elder;
  EV.a2_elder = async function () {
    if (AE.S_.chapter >= 5 && inP('lyra') && !F().ult_lyra) {
      cs.flag('ult_lyra');
      await sayAs('ELDER SORREL', 'The wind came back the night the sky healed. And with it, this: found on the steps where the shrine stood. It hums when you\'re near, Chorus.');
      await AE.gain('seraph_staff'); return;
    }
    return elder.apply(this, arguments);
  };
  const eb = EV.a4_elderbell;
  EV.a4_elderbell = async function () {
    const n = AE.S_.prisms.filter(function (p) { return (AE.PRISMS[p.id] || {}).type === 'echo'; }).map(function (p) { return p.id; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).length;
    if (inP('ember') && n >= 7 && !F().ult_ember) {
      cs.flag('ult_ember');
      await sayAs('ELDER BELL', 'Seven Echoes answer you, child. Then this bell is yours: Aethrael\'s own. The last summoner of Lumen rings the first bell.');
      await AE.gain('aethrael_bell'); return;
    }
    if (inP('ember') && !F().ult_ember) await sayAs('ELDER BELL', 'When seven Echoes answer Ember\'s bell (' + n + ' so far), come back to me.');
    return eb.apply(this, arguments);
  };
  // Vesna: Vessel Zero (Mideel Shallows clinic, after the Sundering)
  E('vessel0', 'Vessel Zero', 60, 80000, 180, 90, 170, 110, 48, 20000, 500, 0, { cast: 'kael', k: 1.4, hue: 180, bright: 1.3 }, { boss: 1, ai: [[2, 'attack'], [2, 'h0_flow'], [1, 'h0_scream'], [1, 'h0_mend', 'hurt']], drop: [['final_word', 1]] });
  const doc = EV.a5_mideel_doc;
  EV.a5_mideel_doc = async function () {
    if (F().a5_kael && inP('vesna') && !F().vesna_q) {
      cs.flag('vesna_q'); Q('vesna', 'done');
      await sayAs('DOCTOR', 'There\'s another patient. Pulled from the flow a month ago. He has... the same face as your friend.');
      await sayAs('VESNA', '...Vessel Zero. The first one. The one I walked out on. He never woke up. I never stayed to see.');
      await sayAs('VESNA', 'He\'s awake now, and he\'s not well. Let me end this. Let me finish what we started, kindly.');
      await cs.battle(['vessel0'], { bg: 'citadel', boss: 1, noRun: 1 });
      await sayAs('VESNA', 'Sleep now. Properly this time. ...I built this rifle to kill Vesper. I think I\'ll just keep it, and not.');
      return;
    }
    return doc.apply(this, arguments);
  };
  // Rook's last memory (Dunewreck, after the Sundering)
  const dw = AE.EV['place:dunewreck'];
  EV['place:dunewreck'] = async function (w) {
    if (AE.S_.chapter >= 5 && inP('rook') && !F().rook_mem) {
      cs.flag('rook_mem'); Q('rookmem', 'done');
      await sayAs('ROOK', 'Wait. I have one memory I have not shown you. Not the boy\'s. Mine.');
      await AE.say('Rook remembers: three hundred years ago, a Chorus singer building him in this ship, so that someone would keep their memories if they were all lost.');
      await sayAs('ROOK', 'She made me to remember. Kael, you were made to carry. Neither of us chose it. We choose what we do with it.');
      await AE.gain('surge_manual_rook');
      w.busy = false; return;
    }
    if (dw) return dw.apply(this, arguments);
    w.busy = false; w.enterPlace('dunewreck', true);
  };

  // ---------- the Arcana championship (Gilded Spire, from Act IV) ----------
  Object.assign(AE.ARCANA_FOES, {
    champ1: { name: 'THE TWINS', deck: ['c_kestra', 'c_crab', 'c_dwarden', 'c_harl', 'c_scorpid', 'c_rockbiter', 'c_moleking'], rules: ['same', 'elemental'], wit: 0.9, hi: 'Championship, round one. We play as one. That\'s cheating. We don\'t care.', lose: 'Two of us, and still...' },
    champ2: { name: 'MASTER ORLAN', deck: ['c_colossus', 'c_tempest', 'c_lich', 'c_ilse', 'c_frostwyrm', 'c_rootking', 'c_thornmaw'], rules: ['same', 'elemental'], wit: 1, hi: 'Round two. Forty years at these tables. Impress me.', lose: 'Impressive.' },
    champ3: { name: 'THE OWNER', deck: ['c_vesper', 'c_drago', 'c_nyxar', 'c_h0', 'c_jugg', 'c_dwarden', 'c_colossus'], rules: ['same', 'elemental'], wit: 1, hi: 'The final. I own this Spire. Let\'s see if I own you.', lose: 'The Spire has a new champion. I hate it. Well done.' }
  });
  const cm = EV.a2_cards_master;
  EV.a2_cards_master = async function () {
    if (AE.S_.chapter >= 4 && AE.has('card_deck') && Q('champ') !== 'done') {
      const r = await AE.ask('ARCANA MASTER: The Arcana Championship is open. Three rounds, no rests. Enter?', ['Enter', 'Just a game', 'Not now'], { name: 'ARCANA MASTER', cancel: 2 });
      if (r === 2) return; if (r === 1) return cm.apply(this, arguments);
      for (const f of ['champ1', 'champ2', 'champ3']) { const res = await AE.Arcana.duel(f); if (res !== 'win') { await sayAs('ARCANA MASTER', 'Knocked out. The championship waits for you.'); return; } }
      Q('champ', 'done'); AE.Sfx.play('save'); await AE.notice('ARCANA CHAMPION!');
      await AE.gain('card:c_kael'); await AE.gain('lucky_coin'); return;
    }
    return cm.apply(this, arguments);
  };
})();
