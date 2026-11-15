# Legend of Aethra changelog

## 1.0.9 — 2026-11-15

- Stairs and doors you could not walk to are fixed, everywhere: the stairs in the Sumps house (a bed blocked the way into the back room), the cellar stairs in the Thorn & Kettle and the Anchor inns (a prop stood in the doorway), and five more that the 1.0.5 prop clean-up had cut off: the Spire Exchange cellar, the Gale Inn upstairs, Old Mine (down to the Deep Vein), Orin's Tower (up to Floor 3) and the Sky Citadel gate.
- New check (tools/check_warps.py): every door and stairs in the game can be walked onto from where you arrive.

## 1.0.8 — 2026-11-15

- Townspeople repeat what they have to say: talking to someone again plays their whole conversation again (before, each talk moved on one line and then only the last line repeated).

## 1.0.7 — 2026-11-15

- Fewer chests: 286 down to 208. Each area now has at most one chest of potions, ethers or gold (the best one is kept), and the rarest items are much scarcer in the whole game: 4 Megalixirs, 8 Elixirs, 8 X-Potions, 5 Turbo Ethers and 1 Ribbon. Gear, Prisms and key items are all still there. Act 1 alone has 32 fewer chests.
- Menus: the level no longer overlaps "Wpn" / "Weapon" on the Prism and Equip screens, or the name on the Status screen; "Back" (back row) no longer overlaps other text; long names and messages fit the screen; long enemy names in battle are shortened to fit their box. A new test draws every menu and battle screen and checks no text overlaps.

## 1.0.6 — 2026-11-15

- After the first boss (Bulwark), the escape no longer starts with the camera stuck on empty space: the camera now always comes back to you when a cutscene ends or you change map. Saves made on the stuck screen load normally.
- Reactor 4, Pressure Hall: the chest above the stairs down (you could only reach it by stepping on the stairs) has moved to free floor beside the other chests.
- Reactor 4, Condenser Deck: the way to the core is now proper stairs down in the cross-shaped room, not an invisible trigger across a corridor.
- Any chest that could only be reached from stairs or a door has been moved to free floor.

## 1.0.5 — 2026-11-15

- **FF7-style numbers.** HP and MP now grow by Final Fantasy VII's own tables (Kael grows like Cloud, Bram like Barret, Lyra like Aeris, Sable like Yuffie, and so on): about 200 HP at Lv 1, 300 at Lv 6, 760 at Lv 20, 3,650 at Lv 50 and 9,400 at Lv 99. Strength, Vitality, Magic and Spirit follow FF7's curve too. Enemy HP and damage are scaled to match, so battles take about as long and hit about as hard as before (checked with a full simulated playthrough: every story battle won).
- Sources (Power Source, Guard Source...) now really raise the stat.
- Indoors and in dungeons: you can no longer walk onto the tops of tall props (pipes, shelves, cabinets) standing against a wall. Where a prop stood in the only way through, it has been taken out.
- Checked the whole game for places you could get stuck: every gate's switch or story trigger is reachable before the gate opens, no standing person blocks a way through, every key item has a source, and every map without a door has a scripted way out.

## 1.0.4 — 2026-11-15

- Switch puzzles (valves, levers, terminals, runes, crystals, orbs) in every dungeon: each switch you still need to use has a gold arrow and a glow over it, so they are easy to find. The arrow goes once it is used.
- Reactor 4, Intake: Sable explains the valve puzzle when you arrive.

## 1.0.3 — 2026-11-15

- Examining things: facing an object (a console, a bed, a mural, a lock) now works when its examine spot is the floor beside it, everywhere in the game, not just at Reactor 4.
- A gold arrow and a glow show where to go at the start: the gate console, then the reactor doors. The first tip explains how to examine things.
- Checked every map: every examine spot, switch puzzle, sealed gate and story flag can be reached and triggered.

## 1.0.2 — 2026-11-15

- The opening: the Reactor 4 gate console now works when you face it (it only answered from the floor in front of it), and Sable says where it is: the east end of the platform.
- Pressing OK while standing on a spot you can examine now works whichever way you face.

## 1.0.1 — 2026-11-15

- Battles are now turn based: one fighter acts at a time, in Speed order, and nothing moves while you choose. A strip at the top of the screen shows whose turn is next. Haste and Slow change how often a turn comes round.
- The Battle mode option (Active / Wait) is gone; Battle speed now sets the pause between turns.

## 1.0.0 — 2026-11-15
- First release: all five acts, with night talks at inns, arrival scenes, a rival's fourth stand, a last night before
  the Citadel and epilogues for every character who joined you.
- 300 maps: towns with their own shapes and streets, 157 interiors with upstairs rooms and cellars, and multi-floor
  dungeons.
- An open 3D world map with vehicles (talonbird, skimmer, boat, submersible, airship), day and night, weather, and places
  that can only be reached by sea or air.
- Battles: Prisms, Surge Arts, Echo summons, Mimic, back attacks, a Bestiary, difficulty settings and New Game+.
- Secrets: hidden places and guardians, a ghost ship, Needle Atoll, legendary Prisms and rumours to follow.
- Side content: the Arcana card game, talonbird races and breeding, the Gilded Spire minigames, snowboarding, a submarine
  duel, the Battle Square, side quests, trials, roaming Weapons, super-bosses and the Abyssal Spire.
- The Soundtrack: an optional script with an original 45-track score, encoded at 32 kbps stereo so it stays clean (no crackle).
- Sound that holds up: a limiter and soft clipper stop music and effects clipping together; only the last few decoded
  tracks are kept in memory (long sessions on phones stay light); the audio sleeps while the game is closed; the music
  arrives whichever script loads first; the phone's mute, volume and the in-game Music option apply at once.
- A touch pad for phones and tablets, with a Flee button in battles you can run from.
- Sharper battles: the game draws at a resolution matched to your screen, sprites scale by whole pixels, the battle
  backdrops are painted at three times the detail, and every boss faces your party.
- Plays inside the Torn Arcade phone (Torn Arcade 2.57.0 or later) or from the Tampermonkey menu.
