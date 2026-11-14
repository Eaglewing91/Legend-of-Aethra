# Legend of Aethra — design bible

An original techno-fantasy RPG in the spirit of Final Fantasy 7 and 8, for Torn Arcade's Legends folder.
Everything here is our own: names, characters, story, monsters' names and music choices. No Square Enix
names, characters, logos, music or signature terms.

## Pillars
1. **Open world.** After the opening city, the whole world is yours to roam. Vehicles widen it step by step
   (on foot → Talonbird mount → Skimmer buggy → boat → submersible → airship). Danger, not walls, guides you.
2. **Depth everywhere.** Every town has homes to enter, people with something to say, shops, side quests and
   secrets. Every dungeon is several floors with a theme, a puzzle mechanic, treasure, a mid-boss and a boss.
3. **Build your own party.** Anyone can learn anything through Prisms slotted into gear. Characters differ by
   stats, weapons and Surge Arts.
4. **Things to do besides the story.** An arcade city with minigames, a card game, Talonbird racing and breeding,
   hidden super-bosses, ultimate weapons, Echo trials and a post-game tower.

## Presentation
- 2D pixel art at 256×224 (drawn at 2×). Towns, dungeons and battles are top-down tile maps
  (Ninja Adventure, CC0) with Mana Seed people (licensed to the author; kept out of the public repo).
- **World map in pseudo-3D**: a tilted perspective view (like the SNES Mode 7 world maps) that you can rotate.
  Towns, mountains, trees and vehicles stand up as sprites.
- Battles side-view, party of **3** on the right, enemies on the left, ATB bars, Surge gauges.
- Music: Ninja Adventure tracks (CC0) in a separate Soundtrack script; jingles for victory, level up, game over.

## World: Aethra
A world of three continents where Aether, the life-current of the planet, wells up as crystal. The four great
Crystals (Wind, Water, Fire, Earth) anchor the sky-currents that keep the islands of the upper sky aloft.

**Aurex Dynamics** runs the world's power from **Halcyon**, a vast tiered industrial capital built around
the Spire, a reactor that drinks Aether straight from the ground. Its president is **Corvin Aurex**. Its chief
engineer, **Dr. Vesper Lune**, secretly wants to drain all four Crystals to rebuild the lost Sky Citadel and
make herself its god.

### Continents and regions
- **Meridia (central)**: Halcyon (capital, 4 districts), the Ashfields (reactor waste), Thornbrook (farming
  village), Mistwood, Kestrel Ranch (Talonbirds), Gilded Spire (arcade city, on a mesa), Windhaven (temple
  town of the Wind Crystal).
- **Solmara (south-east)**: Saltmere (port), Coral Sanctum (Water Crystal, under the sea), Sunscar Desert,
  Sunscar (desert town), Dunewreck (buried airship), Mount Cinder (Fire Crystal), Orin's Tower.
- **Nordheim (north)**: Frostgate (mining town), Deeproot Caverns (Earth Crystal), Lumen (hidden summoner
  village), the Crater (final approach), Northern islands.
- **Upper sky**: islands reached by airship; the Sky Citadel rises in Act IV.

## Cast (party of 3 in battle; swap at save points / on the world map)
| Name | Role in story | Weapon | Surge Arts (4 levels) |
|---|---|---|---|
| **Kael Ardent** | Ex-Aurex security trooper turned courier-mercenary. Lead. | Blades | Gale Rush, Skysplitter, Tempest Arc, Aether Edge |
| **Lyra Vale** | Spire reactor technician who learned what the drain does; rebel healer. | Staves | Mending Light, Ward Bloom, Sanctuary, Rebirth |
| **Bram Hollis** | Disgraced Aurex knight-captain leading the rebel cell *Undercurrent*. | Rifle-lances | Breach Shot, Overload, Siege Line, Last Stand |
| **Sable** | Thief and spy from the Halcyon undercity. | Daggers | Pickpocket Flurry, Shadowstep, Thousand Cuts, Vanish |
| **Orin Thale** | Old scholar of the Crystals, in his tower in the desert. | Rods | Arcane Surge, Starfall, Gravity Well, Genesis |
| **Ember** | Young summoner from Lumen, last of her line. | Bells | Echo Call, Twin Echo, Echo Chorus, Grand Echo |
| **Rook** *(optional)* | An ancient automaton found in Dunewreck. | Fists | Piston Barrage, Core Burst, Overclock, Self-Repair |
| **Vesna** *(optional)* | A mercenary sharpshooter hunting Vesper. | Guns | Deadeye, Spread Shot, Rain of Lead, Final Mark |

## Systems
- **ATB** (Active or Wait, battle speed 1–5). Commands: Attack, (Prism commands), Magic, Echo, Item, Surge when
  full. Defend and Row (front/back) as in the classics. Run by holding both flee keys.
- **Stats**: HP, MP, Str, Def, Mag, Spr, Spd, Luck; levels 1–99; AP for Prisms; Gold (G).
- **Prisms**: slotted in weapon and armour slots, some linked in pairs. Types:
  - *Magic*: Fire/Ice/Bolt (3 tiers), Cure (4), Esuna, Life, Barrier (Protect/Shell), Haste/Slow, Sleep,
    Silence, Poison, Gravity, Quake, Aero, Holy, Flare, Ultima, Meteor-class "Starfall".
  - *Command*: Steal/Mug, Scan, Sense, Throw, Morph (turn foes into items), Double-Cast, Enemy Skill.
  - *Support* (linked): All, Elemental, Added Effect, Absorb, Counter, Quick.
  - *Independent*: HP+, MP+, Speed+, Luck+, Cover, Long Reach, Pre-emptive, Encounter Down/Up, Gold/EXP up.
  - *Echo* (summons): Sylphine (wind), Marrowtide (water), Ignarok (fire), Gaiadon (earth), Voltigar (thunder),
    Glacielle (ice), Seraphel (holy), Nocturne (dark), Aethrael (ultimate). Each has a trial dungeon or boss.
  Prisms level up with AP and split into a copy at Master level.
- **Surge gauge** fills when hit; each character has 4 levels of Surge Arts, unlocked by use and by story items.
- **Status**: Poison, Blind, Silence, Sleep, Paralyse, Confuse, Berserk, Stone, Doom, Frog, Slow, Stop,
  Haste, Protect, Shell, Regen, Reflect, Float, KO. Elements: Fire, Ice, Bolt, Water, Wind, Earth, Holy, Dark.
- **Field**: grid movement, run button, random encounters by area, save points (crystal pillars), inns, shops,
  treasure, hidden items, NPCs and events with branching dialogue, Talonbird tracks for catching mounts.
- **Vehicles**: Talonbird (fast, no encounters, crosses shallow rivers; coloured breeds cross mountains/sea),
  Skimmer (buggy, deserts and plains), Boat, Submersible (undersea areas), Airship *Skylark* (flies anywhere).
- **Minigames** at Gilded Spire: Talonbird races (betting, breeding), Arcana card game (also played by NPCs
  worldwide, cards drop from monsters), shooting gallery, slots, a battle arena. Prizes include unique Prisms.
- **Side content**: 40+ side quests, 9 Echoes, ultimate weapons for each character, 3 super-bosses,
  the post-game Abyssal Spire (50 floors).

## Story (five acts)
**Act I — Halcyon.** Kael, hired by the rebel cell Undercurrent (Bram, Sable), raids a Spire reactor and
meets Lyra, a technician who helps them escape. The raid is framed as a massacre. Through the four districts,
the undercity and a corporate tower, they learn of Vesper's Crystal project and escape Halcyon by train.
*Dungeons: Reactor 4 (4 floors), Undercity sewers, Aurex Tower (8 floors), the Rail Yards.*

**Act II — Meridia.** Thornbrook, Mistwood, Kestrel Ranch (Talonbirds), the Gilded Spire, and Windhaven,
where Aurex attacks the Wind Crystal. It shatters; Lyra holds a shard, and Echo Sylphine is born.
*Dungeons: Mistwood (3 areas), Old Mine, Windhaven Catacombs, Wind Shrine (5 floors).*

**Act III — Solmara.** Saltmere, the sea journey, the Coral Sanctum (Water Crystal) by submersible, Sunscar,
Orin's Tower (Orin joins), Dunewreck (Rook, the Skylark's engine), and Mount Cinder (Fire Crystal).
*Dungeons: Smugglers' Grotto, Coral Sanctum (5 floors), Sunscar Ruins, Orin's Tower (6 floors),
Dunewreck (4 decks), Mount Cinder (6 areas).*

**Act IV — Nordheim.** Frostgate, Lumen (Ember joins), the Deeproot Caverns (Earth Crystal). Vesper takes the
last shard, kills Corvin Aurex and raises the Sky Citadel; the sky cracks and the world changes
(new monsters, towns in trouble, new areas open).
*Dungeons: Frostgate Mines, Lumen Trial, Deeproot Caverns (6 floors), the Crater.*

**Act V — The Broken Sky.** Gather allies, recover the Skylark, optional content everywhere, then the
Sky Citadel (8 floors with branching paths) and Vesper in three forms. Ending and credits.

## Technical
- Userscript in the Legends folder. Separate scripts: game, art (Mana Seed atlases + monsters), soundtrack.
- Talks to Torn Arcade only by page events (open, closed, scores, mute, volume, pad). No requests of any kind.
- Saves: 3 files in Tampermonkey storage, plus quick save at save points.
- Maps authored as data in `tools/` (ASCII layouts + autotiling) and built into compact JSON by `build.py`.
