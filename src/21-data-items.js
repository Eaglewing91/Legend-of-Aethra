/* ================= Items, weapons, armour, accessories ================= */
// use: what it does in and out of battle. target: ally | allies | enemy | enemies | any
AE.ITEMS = {
  potion: { name: 'Potion', price: 50, use: { heal: 100 }, target: 'ally', desc: 'Restores 100 HP.' },
  hi_potion: { name: 'Hi-Potion', price: 300, use: { heal: 500 }, target: 'ally', desc: 'Restores 500 HP.' },
  x_potion: { name: 'X-Potion', price: 3000, use: { heal: 9999 }, target: 'ally', desc: 'Restores all HP.' },
  ether: { name: 'Ether', price: 1500, use: { mp: 100 }, target: 'ally', desc: 'Restores 100 MP.' },
  turbo_ether: { name: 'Turbo Ether', price: 4000, use: { mp: 999 }, target: 'ally', desc: 'Restores all MP.' },
  elixir: { name: 'Elixir', price: 0, use: { heal: 9999, mp: 999 }, target: 'ally', desc: 'Restores all HP and MP.' },
  megalixir: { name: 'Megalixir', price: 0, use: { heal: 9999, mp: 999 }, target: 'allies', desc: 'Restores all HP and MP to the party.' },
  phoenix_down: { name: 'Phoenix Plume', price: 300, use: { revive: 0.25 }, target: 'ally', ko: true, desc: 'Revives a fallen ally.' },
  antidote: { name: 'Antidote', price: 40, use: { cure: ['poison'] }, target: 'ally', desc: 'Cures Poison.' },
  eye_drops: { name: 'Eye Drops', price: 50, use: { cure: ['blind'] }, target: 'ally', desc: 'Cures Blind.' },
  echo_screen: { name: 'Echo Herb', price: 100, use: { cure: ['silence'] }, target: 'ally', desc: 'Cures Silence.' },
  soft: { name: 'Softener', price: 150, use: { cure: ['stone', 'petrify'] }, target: 'ally', desc: 'Cures Stone.' },
  remedy: { name: 'Remedy', price: 1000, use: { cure: ['poison', 'blind', 'silence', 'stone', 'confuse', 'sleep', 'paralyse', 'frog', 'berserk', 'slow', 'stop', 'doom'] }, target: 'ally', desc: 'Cures all bad status.' },
  tent: { name: 'Tent', price: 500, field: 'tent', desc: 'Rest at a save point: restores the party.' },
  cottage: { name: 'Cottage', price: 1500, field: 'tent', desc: 'Rest anywhere on the world map.' },
  smoke_bomb: { name: 'Smoke Bomb', price: 200, battle: 'escape', target: 'none', desc: 'Escape from battle.' },
  grenade: { name: 'Grenade', price: 150, use: { damage: 180, elem: 'fire' }, target: 'enemies', desc: 'Damages all enemies.' },
  frost_vial: { name: 'Frost Vial', price: 0, use: { damage: 320, elem: 'ice' }, target: 'enemy', desc: 'Ice damage to one enemy.' },
  spark_cell: { name: 'Spark Cell', price: 0, use: { damage: 320, elem: 'bolt' }, target: 'enemy', desc: 'Bolt damage to one enemy.' },
  hero_tonic: { name: 'Hero Tonic', price: 0, use: { status: ['berserk', 'haste'] }, target: 'ally', desc: 'Haste and Berserk.' },
  speed_draught: { name: 'Speed Draught', price: 0, use: { status: ['haste'] }, target: 'ally', desc: 'Haste.' },
  power_source: { name: 'Power Source', price: 0, use: { boost: 'str' }, target: 'ally', desc: 'Raises Strength by 1 for good.' },
  guard_source: { name: 'Guard Source', price: 0, use: { boost: 'vit' }, target: 'ally', desc: 'Raises Vitality by 1 for good.' },
  mind_source: { name: 'Mind Source', price: 0, use: { boost: 'mag' }, target: 'ally', desc: 'Raises Magic by 1 for good.' },
  spirit_source: { name: 'Spirit Source', price: 0, use: { boost: 'spr' }, target: 'ally', desc: 'Raises Spirit by 1 for good.' },
  speed_source: { name: 'Speed Source', price: 0, use: { boost: 'spd' }, target: 'ally', desc: 'Raises Speed by 1 for good.' },
  luck_source: { name: 'Luck Source', price: 0, use: { boost: 'lck' }, target: 'ally', desc: 'Raises Luck by 1 for good.' },
  // talonbird feed (breeding/racing)
  greens: { name: 'Gysahl-free Greens', price: 80, field: 'feed', desc: 'Talonbird feed. Calms a wild bird.' },
  sweetroot: { name: 'Sweetroot', price: 600, field: 'feed', desc: 'Talonbird feed: better racing stats.' },
  // key items (k: true)
  reactor_pass: { name: 'Reactor Pass', k: true, desc: 'Undercurrent\'s forged pass into Reactor 4.' },
  vesper_file: { name: 'Vesper\'s File', k: true, desc: 'Notes on Project Cradle: draining the Crystals.' },
  rail_ticket: { name: 'Rail Ticket', k: true, desc: 'One way out of Halcyon.' },
  wind_shard: { name: 'Wind Shard', k: true, desc: 'All that is left of the Wind Crystal.' },
  water_shard: { name: 'Water Shard', k: true, desc: 'All that is left of the Water Crystal.' },
  fire_shard: { name: 'Fire Shard', k: true, desc: 'All that is left of the Fire Crystal.' },
  earth_shard: { name: 'Earth Shard', k: true, desc: 'All that is left of the Earth Crystal.' },
  ranch_pass: { name: 'Ranch Pass', k: true, desc: 'Lets you hire Talonbirds at Kestrel Ranch.' },
  spire_pass: { name: 'Gilded Spire Pass', k: true, desc: 'Free entry to the Gilded Spire for life.' },
  skimmer_key: { name: 'Skimmer Key', k: true, desc: 'The key to a desert Skimmer.' },
  ship_charter: { name: 'Ship Charter', k: true, desc: 'Passage on the Saltmere ferry.' },
  diving_suit: { name: 'Pressure Suit', k: true, desc: 'Lets the submersible dive deep.' },
  engine_core: { name: 'Aether Engine Core', k: true, desc: 'The heart of an airship.' },
  lumen_bell: { name: 'Lumen Bell', k: true, desc: 'Rings to open the hidden way to Lumen.' },
  frost_lantern: { name: 'Frost Lantern', k: true, desc: 'Lights the way through the Frostgate Mines.' },
  citadel_key: { name: 'Citadel Key', k: true, desc: 'Opens the gates of the Sky Citadel.' },
  surge_manual_kael: { name: 'Windborne Manual', k: true, desc: 'Teaches Kael his last Surge Art.' },
  surge_manual_lyra: { name: 'Bloom Codex', k: true, desc: 'Teaches Lyra her last Surge Art.' },
  surge_manual_bram: { name: 'Siege Manual', k: true, desc: 'Teaches Bram his last Surge Art.' },
  surge_manual_sable: { name: 'Shadow Ledger', k: true, desc: 'Teaches Sable her last Surge Art.' },
  surge_manual_orin: { name: 'Genesis Folio', k: true, desc: 'Teaches Orin his last Surge Art.' },
  surge_manual_ember: { name: 'Choir Score', k: true, desc: 'Teaches Ember her last Surge Art.' },
  surge_manual_rook: { name: 'Core Schematic', k: true, desc: 'Teaches Rook his last Surge Art.' },
  surge_manual_vesna: { name: 'Marksman\'s Log', k: true, desc: 'Teaches Vesna her last Surge Art.' },
  card_deck: { name: 'Arcana Deck', k: true, desc: 'Your deck of Arcana cards. Challenge players everywhere.' },
  spire_token: { name: 'Spire Tokens', k: true, desc: 'Gilded Spire currency.' },
};
// weapons: type must match the character's weapon kind. slots: number of Prism slots; links: linked pairs
AE.WEAPONS = {};
AE.ARMORS = {};
AE.ACCS = {};
(function () {
  const W = function (id, name, type, atk, hit, slots, links, price, extra) { AE.WEAPONS[id] = Object.assign({ name: name, type: type, atk: atk, hit: hit, slots: slots, links: links, price: price }, extra || {}); };
  // blades (Kael)
  W('courier_blade', 'Courier Blade', 'blade', 18, 96, 2, 1, 0);
  W('steel_saber', 'Steel Saber', 'blade', 26, 97, 2, 1, 600);
  W('wind_cutter', 'Wind Cutter', 'blade', 34, 98, 3, 1, 1500, { elem: 'wind' });
  W('dawn_edge', 'Dawn Edge', 'blade', 46, 98, 4, 2, 3400);
  W('storm_brand', 'Storm Brand', 'blade', 58, 99, 4, 2, 6800, { elem: 'bolt' });
  W('crystal_saber', 'Crystal Saber', 'blade', 74, 100, 6, 3, 12000);
  W('zephyr_fang', 'Zephyr Fang', 'blade', 88, 100, 6, 3, 0, { stats: { spd: 10 } });
  W('sky_render', 'Sky Render', 'blade', 120, 110, 8, 4, 0, { ult: 1, stats: { str: 20, spd: 20 } });
  // staves (Lyra)
  W('oak_staff', 'Oak Staff', 'staff', 10, 96, 2, 1, 0, { stats: { mag: 3 } });
  W('copper_staff', 'Copper Staff', 'staff', 15, 97, 3, 1, 700, { stats: { mag: 5 } });
  W('mending_rod', 'Mending Staff', 'staff', 22, 98, 4, 2, 2200, { stats: { mag: 9, spr: 5 } });
  W('lumen_staff', 'Lumen Staff', 'staff', 30, 98, 4, 2, 5200, { stats: { mag: 14, spr: 9 } });
  W('aurora_staff', 'Aurora Staff', 'staff', 40, 99, 6, 3, 10500, { stats: { mag: 20, spr: 14 } });
  W('seraph_staff', 'Seraph Staff', 'staff', 62, 110, 8, 4, 0, { ult: 1, stats: { mag: 40, spr: 40 } });
  // lances (Bram)
  W('service_lance', 'Service Lance', 'lance', 22, 92, 2, 1, 0);
  W('rifle_lance', 'Rifle Lance', 'lance', 30, 94, 2, 1, 750);
  W('breach_lance', 'Breach Lance', 'lance', 40, 95, 3, 1, 1800);
  W('volt_lance', 'Volt Lance', 'lance', 52, 96, 4, 2, 4000, { elem: 'bolt' });
  W('siege_lance', 'Siege Lance', 'lance', 66, 97, 4, 2, 7800);
  W('dragoon_pike', 'Wyvern Pike', 'lance', 82, 98, 6, 3, 13500);
  W('bastion', 'Bastion', 'lance', 128, 105, 8, 4, 0, { ult: 1, stats: { str: 25, vit: 25 } });
  // daggers (Sable)
  W('kris', 'Kris', 'dagger', 15, 99, 2, 1, 0);
  W('stiletto', 'Stiletto', 'dagger', 22, 100, 2, 1, 550, { stats: { spd: 2 } });
  W('mythril_knife', 'Silversteel Knife', 'dagger', 30, 102, 3, 1, 1600, { stats: { spd: 4 } });
  W('viper_fang', 'Viper Fang', 'dagger', 40, 103, 4, 2, 3600, { addStatus: 'poison' });
  W('nightshade', 'Nightshade', 'dagger', 54, 104, 4, 2, 7200, { stats: { lck: 10 } });
  W('mist_dirk', 'Mist Dirk', 'dagger', 70, 106, 6, 3, 12800, { stats: { spd: 12 } });
  W('vanishing_edge', 'Vanishing Edge', 'dagger', 112, 120, 8, 4, 0, { ult: 1, stats: { spd: 30, lck: 30 } });
  // rods (Orin)
  W('scholar_rod', 'Scholar\'s Rod', 'rod', 10, 95, 3, 1, 0, { stats: { mag: 5 } });
  W('ember_rod', 'Flame Rod', 'rod', 16, 96, 3, 1, 1400, { elem: 'fire', stats: { mag: 8 } });
  W('frost_rod', 'Frost Rod', 'rod', 20, 97, 4, 2, 2600, { elem: 'ice', stats: { mag: 11 } });
  W('thunder_rod', 'Thunder Rod', 'rod', 26, 97, 4, 2, 4800, { elem: 'bolt', stats: { mag: 15 } });
  W('sage_rod', 'Sage\'s Rod', 'rod', 34, 98, 6, 3, 9800, { stats: { mag: 24 } });
  W('genesis_rod', 'Genesis Rod', 'rod', 58, 105, 8, 4, 0, { ult: 1, stats: { mag: 50 } });
  // bells (Ember)
  W('brass_bell', 'Brass Bell', 'bell', 12, 96, 3, 1, 0, { stats: { spr: 4 } });
  W('silver_bell', 'Silver Bell', 'bell', 20, 97, 4, 2, 3200, { stats: { mag: 8, spr: 8 } });
  W('choir_bell', 'Choir Bell', 'bell', 30, 98, 5, 2, 7400, { stats: { mag: 14, spr: 14 } });
  W('echo_bell', 'Echo Bell', 'bell', 40, 99, 6, 3, 11800, { stats: { mag: 20, spr: 18 } });
  W('aethrael_bell', 'Bell of Aethrael', 'bell', 60, 110, 8, 4, 0, { ult: 1, stats: { mag: 40, spr: 40 } });
  // fists (Rook)
  W('iron_knuckle', 'Iron Knuckle', 'fist', 30, 96, 2, 1, 0);
  W('piston_fist', 'Piston Fist', 'fist', 44, 97, 3, 1, 3000);
  W('dynamo', 'Dynamo', 'fist', 60, 98, 4, 2, 6400, { elem: 'bolt' });
  W('titan_grip', 'Titan Grip', 'fist', 78, 99, 6, 3, 12200);
  W('omega_core', 'Omega Core', 'fist', 124, 105, 8, 4, 0, { ult: 1, stats: { str: 30, vit: 30 } });
  // guns (Vesna) - hit from the back row at full strength
  W('scout_rifle', 'Scout Rifle', 'gun', 38, 100, 3, 1, 0, { long: 1 });
  W('long_rifle', 'Long Rifle', 'gun', 52, 102, 4, 2, 5200, { long: 1 });
  W('hunter_rifle', 'Hunter\'s Rifle', 'gun', 66, 104, 4, 2, 8200, { long: 1, stats: { lck: 8 } });
  W('aether_rifle', 'Aether Rifle', 'gun', 80, 106, 6, 3, 12600, { long: 1 });
  W('final_word', 'Final Word', 'gun', 126, 120, 8, 4, 0, { ult: 1, long: 1, stats: { spd: 25, lck: 25 } });
  // armour: everyone
  const A = function (id, name, def, mdef, eva, slots, links, price, extra) { AE.ARMORS[id] = Object.assign({ name: name, def: def, mdef: mdef, eva: eva, slots: slots, links: links, price: price }, extra || {}); };
  A('bronze_band', 'Bronze Band', 8, 4, 0, 1, 0, 100);
  A('leather_vest', 'Leather Vest', 10, 5, 2, 1, 0, 150);
  A('silk_robe', 'Silk Robe', 6, 10, 2, 2, 0, 200);
  A('iron_mail', 'Iron Mail', 14, 4, 0, 1, 0, 300);
  A('iron_bangle', 'Iron Bangle', 16, 8, 0, 2, 1, 500);
  A('titan_band', 'Titan Band', 24, 12, 2, 2, 1, 1200);
  A('mythril_vest', 'Silversteel Vest', 32, 18, 4, 3, 1, 2600);
  A('carbon_band', 'Carbon Band', 40, 24, 4, 4, 2, 4400);
  A('mage_coat', 'Sage\'s Coat', 30, 40, 6, 4, 2, 5000);
  A('crystal_band', 'Crystal Band', 56, 36, 6, 4, 2, 8200);
  A('dragon_mail', 'Wyrmscale Mail', 70, 44, 6, 6, 3, 13000, { half: ['fire', 'ice', 'bolt'] });
  A('aegis_band', 'Aegis Band', 86, 62, 10, 6, 3, 0);
  A('aether_armlet', 'Aether Armlet', 110, 110, 15, 8, 4, 0);
  // accessories
  const C = function (id, name, price, extra) { AE.ACCS[id] = Object.assign({ name: name, price: price }, extra); };
  C('power_wrist', 'Power Wrist', 1200, { stats: { str: 10 } });
  C('guard_ring', 'Guard Ring', 1200, { stats: { vit: 10 } });
  C('mind_pendant', 'Mind Pendant', 1500, { stats: { mag: 10 } });
  C('spirit_charm', 'Spirit Charm', 1500, { stats: { spr: 10 } });
  C('swift_boots', 'Swift Boots', 2000, { stats: { spd: 10 } });
  C('lucky_coin', 'Lucky Coin', 0, { stats: { lck: 25 } });
  C('star_pendant', 'Star Pendant', 1800, { guard: ['poison'] });
  C('silver_glasses', 'Silver Glasses', 1800, { guard: ['blind'] });
  C('headband', 'Headband', 2200, { guard: ['sleep'] });
  C('safety_bit', 'Safety Bit', 0, { guard: ['stone', 'doom', 'stop'] });
  C('ribbon', 'Ribbon', 0, { guard: ['poison', 'blind', 'silence', 'stone', 'confuse', 'sleep', 'paralyse', 'frog', 'berserk', 'slow', 'stop', 'doom'] });
  C('sprint_shoes', 'Sprint Shoes', 0, { effect: 'haste' });
  C('barrier_ring', 'Barrier Ring', 0, { effect: 'protect', also: 'shell' });
  C('regen_charm', 'Regen Charm', 0, { effect: 'regen' });
  C('champion_belt', 'Champion Belt', 0, { stats: { str: 30, vit: 30 } });
  C('sages_circlet', 'Sage\'s Circlet', 0, { stats: { mag: 30, spr: 30 } });
  C('cat_bell', 'Cat\'s Bell', 0, { effect: 'walkheal' });
  C('fury_ring', 'Fury Ring', 0, { effect: 'berserk', stats: { str: 20 } });
})();
