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
- Music: an original score in a Final Fantasy style (tools/music: a synthesised orchestra and a score notation), 45 tracks
  in a separate Soundtrack script. Leitmotifs: the main theme (world map, airship, ending), Lyra's Chorus song, Vesper's
  "One, Two, Three" waltz and Nyxar's tritone. Every town has its own theme; Vesper, Nyxar, Drago and the Weapons have
  their own battle music; victory fanfare, inn and game-over jingles.

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
| **Kael Ardent** | A newly sworn Warden of the Vanguard Academy; not who he thinks he is. Lead. | Blades | Gale Rush, Skysplitter, Tempest Arc, Aether Edge |
| **Lyra Vale** | Reactor technician, secretly one of the last Chorus who hear the Aetherflow. | Staves | Mending Light, Ward Bloom, Sanctuary, Rebirth |
| **Bram Hollis** | Ex-Aurex knight-captain who leads the rebel cell *Undercurrent*; burned Thornbrook on orders. | Rifle-lances | Breach Shot, Overload, Siege Line, Last Stand |
| **Sable** | Undercity thief and spy, raised at the Lantern House orphanage. | Daggers | Pickpocket Flurry, Shadowstep, Thousand Cuts, Vanish |
| **Orin Thale** | Crystal scholar who taught Vesper, hiding in his desert tower. | Rods | Arcane Surge, Starfall, Gravity Well, Genesis |
| **Ember** | Young summoner from Lumen, last of her line. | Bells | Echo Call, Twin Echo, Echo Chorus, Grand Echo |
| **Rook** *(optional)* | A Chorus-era automaton holding the real Kael's last memories. | Fists | Piston Barrage, Core Burst, Overclock, Self-Repair |
| **Vesna** *(optional)* | Sharpshooter, Vesper's former partner in Project Cradle. | Guns | Deadeye, Spread Shot, Rain of Lead, Final Mark |

## Systems
- **ATB** (Active or Wait, battle speed 1–5). Commands: Attack, (Prism commands), Magic, Echo, Item, Surge when
  full. Defend and Row (front/back) as in the classics. Run by holding both flee keys.
- **Stats**: HP, MP, Str, Def, Mag, Spr, Spd, Luck; levels 1–99; AP for Prisms; Gil.
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

## Story

### What we take from FF7 and FF8 (in spirit only)
| | FF7 | FF8 | What Aethra does with the idea |
|---|---|---|---|
| Opening | Eco-terrorists bomb a corporate reactor draining the planet's life | Cadets graduate from a mercenary academy on their first contract | Kael, a newly sworn **Warden** of the Vanguard Academy, takes his first contract: escort the rebel cell **Undercurrent** into Aurex's **Reactor 4** |
| The world's lifeblood | The Lifestream, mako | Sorceress power passed between people | The **Aetherflow**, the planet's living memory, welling up as crystal; four Crystals hold the sky up |
| The heroine | Aerith, last of an ancient people who hear the planet | Rinoa, a rebel who falls for the aloof lead | **Lyra**, a reactor technician secretly one of the last **Chorus**, people who can hear the Aetherflow |
| The lead's secret | Cloud's memories aren't his own | Squall shuts everyone out | Kael's memories of Thornbrook belong to someone who **died seven years ago** |
| The face of the enemy | Sephiroth, made by the company, wants to become a god | Edea, possessed by a sorceress from the future | **Dr. Vesper Lune**, Aurex's chief engineer, raised in the same orphanage as the party, guided by a voice from the Crater |
| The thing behind it | Jenova, an alien calamity | Ultimecia's time compression | **Nyxar, the Hollow Echo**: the memory of the world's first calamity, sealed in the Crater, wanting to be the only memory left |
| Mid-game shock | Aerith's death; Cloud hands over the Black Materia | The orphanage reveal | Kael hands Vesper the last shard; Lyra falls into the Aetherflow to save him |
| The world breaks | Meteor; the Weapons wake | The Lunar Cry | **The Sundering**: the sky cracks, the **Sky Wardens** wake and lay waste to cities |
| Flashbacks | Kalm, Nibelheim | Laguna's dreams | Playable **Memory Dives** as the real Kael Ardent, seven years ago |
| Mobile base | The Highwind | Garden flies | The Vanguard Academy lifts off as a flying fortress, then the airship **Skylark** |
| Side fun | Gold Saucer, chocobos | Triple Triad | The **Gilded Spire**, **Talonbirds**, the **Arcana** card game |

Everything in the right-hand column is ours: names, people, places, twists and how they play out.

### Premise
Aethra's four Crystals (Wind, Water, Fire, Earth) are where the Aetherflow, the planet's living memory, rises to the
surface. They also anchor the sky-currents that hold up the islands of the upper sky. **Aurex Dynamics** powers the
world by drinking the Aetherflow through reactors. Its president, **Corvin Aurex**, thinks it's simply business.
Its chief engineer, **Dr. Vesper Lune**, is running **Project Cradle**: draining all four Crystals to raise the lost
**Sky Citadel**, the throne the Chorus once used to sing the world into being. She believes she'll use it to make a
better world. The voice that taught her how is **Nyxar**.

### Cast and their arcs
- **Kael Ardent**, 19: a newly sworn Warden of the Vanguard Academy, a mercenary school with a long code of honour.
  Cool, guarded, very good with a blade. He remembers growing up in Thornbrook and remembers the fire that burned it.
  *Truth:* the real Kael Ardent, a Warden, died in that fire seven years ago. "Our" Kael is a **Vessel**: a body grown
  by Project Cradle and given the dead man's memories so it could carry the Crystal shards. Vesper can call to him.
  *Arc:* from "I'm somebody else's leftovers" to choosing who he is.
- **Lyra Vale**, 18: a technician at Reactor 4 who hears the Aetherflow screaming and secretly helps Undercurrent.
  One of the last of the Chorus. Warm, stubborn, funny. *Arc:* she steps into the Aetherflow to pull Kael back. She
  survives, changed. At the end, her song (with every Chorus voice in the flow) holds the sky up.
- **Bram Hollis**, 38: an ex-Aurex knight-captain who leads Undercurrent. Loud, big-hearted, a father to his men.
  *Arc:* he was the officer who followed the order to burn Thornbrook. He confesses at the Lantern House.
- **Sable**, 17: an undercity thief and Undercurrent's spy. Quick, cheeky, steals from the party twice.
  *Arc:* she grew up at the Lantern House with Kael's original and Vesper's little sister. She knew all along.
- **Orin Thale**, 71: a Crystal scholar who taught Vesper. He hides in his desert tower, ashamed of what he taught
  her. *Arc:* he faces his student.
- **Ember**, 12: the last summoner of Lumen. Echoes answer her bell. *Arc:* the voice in the Crater sounds like
  her mother. Ember is the one who names Nyxar for what it is.
- **Rook** *(optional)*: a Chorus-era automaton in the buried airship Dunewreck. It carries the real Kael Ardent's
  last memories (and through them, the Memory Dives).
- **Vesna Korr** *(optional)*: a mercenary sharpshooter and Vesper's former partner in Project Cradle. She walked out
  when the first Vessels died. She hunts Vesper to end what they started.
- **Dr. Vesper Lune**: brilliant, gentle-voiced, utterly sure. An orphan of the Lantern House. Thornbrook burned
  because her first Cradle test there failed. She tells herself she's saving the world from Aurex.
- **Corvin Aurex**: the company's president. Vesper kills him at the end of Act IV.
- **Mother Ilse**: runs the Lantern House orphanage in Thornbrook, where Vesper, Sable and the real Kael grew up.
- **Captain Drago Venn**: Aurex's security chief and the party's recurring rival (five fights), who finally sides
  with the party at the Sky Citadel.

### Act I: Halcyon (about 6 hours)
1. **Reactor 4.** Kael's first Warden contract: get Bram, Sable and two Undercurrent rebels into Reactor 4 and out
   again. Lyra opens a door for them from inside. **Boss: Warden-class security mech "Bulwark".**
2. The reactor goes up larger than planned. Vesper triggered the overload herself. Aurex's broadcasts blame
   Undercurrent and call it a massacre. Kael and Lyra fall through the plates into **the Sumps** (undercity).
3. **The Sumps and the Market Ward**: Undercurrent's hideout in the bar "The Spillway", side quests, the arena, and
   Kael's first Warden bounty.
4. Aurex seals the Sumps to "contain the terrorists". The party climbs the **Spire Stair** (outer scaffold, 6
   floors) to **Aurex Tower** (8 floors: lobby, records, labs, Cradle vault).
5. In the Cradle vault: glass tanks of Vessels with Kael's face. Kael doesn't understand. Vesper meets him and
   calls him "my bright boy". Corvin Aurex announces Project Cradle to the board.
6. **Boss: Captain Drago Venn** on the tower roof. Escape by stolen freight train through the **Rail Yards** into
   the Ashfields. *Act I ends:* Halcyon behind them, the open world ahead.

### Act II: Meridia (about 8 hours)
1. **Thornbrook**, the village Kael remembers, rebuilt. Nobody remembers him. Mother Ilse does. She calls him by
   the dead boy's name and cries.
2. **Mistwood** (3 areas) to **Kestrel Ranch**: tame the first Talonbird. Optional: race and breed them.
3. **The Gilded Spire**: the arcade city on a mesa. Minigames, the Arcana card game, a frame-up for murder, and
   **Spire Prison**, a desert pit (Bram's past comes out).
4. **The Old Mine** (4 floors), then **Windhaven**, temple-town of the Wind Crystal. Aurex arrives to drain it.
   **Windhaven Catacombs** and the **Wind Shrine** (5 floors). **Boss: "Tempest Engine".**
5. Kael's head fills with Vesper's voice. He walks to her and hands her the **Wind Shard**. Lyra stops him from
   going with her. The Shrine collapses. *Act II ends* on the Wind Crystal's death and Sylphine's birth from it.

### Act III: Solmara (about 9 hours)
1. **Port Lark** by ferry to **Saltmere**. **Smugglers' Grotto**: Sable's old crew. The submersible.
2. **The Coral Sanctum** (5 floors) under the sea: the Water Crystal is already drained. **Boss: the Drowned
   Warden**, a Sky Warden still asleep. A first hint of what is coming.
3. **Sunscar**, a desert town, and its buried **Sunscar Ruins** (Chorus history). **Orin's Tower** (6 floors of
   puzzles): Orin joins and tells them about the Chorus, the Sky Citadel and Nyxar.
4. **Dunewreck**, a Chorus-era airship buried in sand. Rook wakes up. **The first Memory Dive**: play as the real
   Kael Ardent, the night Thornbrook burned. The party gets the Aether Engine Core for the **Skylark**.
5. **Mount Cinder** (6 areas) and the Fire Crystal: Drago Venn again, then **Boss: "Ignis Colossus"**. Vesper
   takes the Fire Shard. Optional: Vesna's quest begins.

### Act IV: Nordheim (about 8 hours)
1. The Skylark flies. **Frostgate**, a mining town. **Frostgate Mines** (5 floors).
2. **Lumen**, the hidden summoners' village: Ember's trial and Ember joins. The Lantern House revelation, told at
   last: everyone has a piece of it. Bram confesses.
3. **The Deeproot Caverns** (6 floors) to the Earth Crystal. Vesper is waiting. She calls Kael and he goes to her.
   She has all four shards. **The Sundering**: the Sky Citadel rises over the Crater, the sky cracks, Corvin Aurex
   dies, and Lyra throws herself into the Aetherflow after Kael.
4. **The Vanguard Academy lifts off** and takes in the party as a flying fortress. It becomes the party's base.

### Act V: The Broken Sky (open; 10+ hours with side content)
1. The world has changed: red sky, new monsters, towns in trouble. The **Sky Wardens** are loose (five huge
   bosses that roam the world map; one attacks Halcyon).
2. **Find Kael**: at **Mideel Shallows**, a clinic where the Aetherflow surfaces, Kael lies broken. **Memory Dive
   inside his mind** with Lyra: he and Lyra rebuild who he is. Kael rejoins as himself.
3. **Open world.** The Skylark is yours. Echo trials, ultimate weapons, Vesna's quest, Rook's last memory, the
   Abyssal Spire, Arcana championship, Talonbird racing to the gold Talonbird, three hidden super-bosses.
4. **Halcyon's last stand**: the Sky Warden attack, the Academy's guns, and Drago Venn's change of side.
5. **The Sky Citadel** (8 floors, branching): the party splits into teams to open the gates.
   **The Aetherflow** beneath the Citadel (final area). **Vesper Lune** (3 forms); then **Nyxar, the Hollow Echo**
   (2 forms). Lyra and every Chorus voice in the flow sing the sky back together.
6. **Ending**: the Crystals don't come back, so Aurex's reactors fall silent and the world has to learn to live
   without them. Kael, his own name now, at Thornbrook. Credits.

### Themes
Who are you if your memories are borrowed? What is a world's memory worth? Taking the power that feeds a city has a
price, and so does giving it up.

## Technical
- Userscript in the Legends folder. Separate scripts: game, art (Mana Seed atlases + monsters), soundtrack.
- Talks to Torn Arcade only by page events (open, closed, scores, mute, volume, pad). No requests of any kind.
- Saves: 3 files in Tampermonkey storage, plus quick save at save points.
- Maps authored as data in `tools/` (ASCII layouts + autotiling) and built into compact JSON by `build.py`.
