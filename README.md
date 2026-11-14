# 💎 Legend of Aethra

A 16-bit style role-playing game for [Torn](https://www.torn.com), in the spirit of the classic active-time-battle RPGs.
It plays inside the **Torn Arcade** phone (Legends folder) or in its own window from the Tampermonkey menu.

**Install:** [Legend-of-Aethra.user.js](https://github.com/Eaglewing91/Legend-of-Aethra/raw/main/build/Legend-of-Aethra.user.js)
(about 0.7 MB) and its [Art & Effects](https://github.com/Eaglewing91/Legend-of-Aethra/raw/main/build/Legend-of-Aethra-Art.user.js) script (needed, about 1.1 MB). Optional music: [Legend-of-Aethra-Soundtrack.user.js](https://github.com/Eaglewing91/Legend-of-Aethra/raw/main/build/Legend-of-Aethra-Soundtrack.user.js) (every track, about 9 MB). Without it you still hear the sound effects, but no background music.

## The game
A newly sworn Warden of the Vanguard Academy takes his first contract: get the rebel cell Undercurrent into Aurex
Dynamics' Reactor 4, and out again. The reactor goes up far bigger than planned, and the Warden falls into a story about
stolen memories, four Crystals that hold up the sky, and the woman who wants all four.

- **Five acts**, about 40 hours: Halcyon, Meridia, Solmara, Nordheim and the Broken Sky. 170+ maps: towns, interiors and
  big multi-floor dungeons (Reactor 4, Aurex Tower, the Spire Stair, Mistwood, the Wind Shrine, the Coral Sanctum,
  Orin's Tower, Mount Cinder, the Deeproot, the Sky Citadel and more).
- **Active-time battles** with Wait or Active mode, front and back rows, elements, status effects, stealing, Surge
  Arts and Echo summons. About 150 monsters and 40 bosses.
- **Prisms**: slot them in weapons and armour for spells, commands and support; link them in pairs; they level up.
- **A Mode 7 world map** you can cross on foot, by talonbird, skimmer, boat, submersible and the airship Skylark.
- **Side content**: the Arcana card game (60+ cards), talonbird races, slots, a shooting gallery, the Battle Square,
  the Pit, bounties, side quests, Echo trials, super-bosses and the 50-floor Abyssal Spire.
- Three save files plus a resume point when you close it.

**Controls:** arrows/WASD move · Z, Enter or Space OK · X or Esc back · C menu · Shift run · M world map ·
hold Q+E to flee a battle.

## Rules and privacy
The game never reads, clicks or changes Torn's page, makes no network requests, uses no API key and no websockets.
It reads keys only while its window is open. Saves stay in Tampermonkey storage on your device. It talks to Torn Arcade
through page events only (`aethra:ping`, `aethra:here`, `aethra:open`, `aethra:close`, `aethra:closed`, `aethra:mute`,
`aethra:volume`); the Soundtrack script answers `aethra-music:request` with `aethra-music`.

| Data Storage | Data Sharing | Purpose of Use | Key Storage & Sharing | Key Access Level |
|---|---|---|---|---|
| Only locally (save files in Tampermonkey storage) | Nobody | Public amusement | Not stored / Not shared (no key used) | None (no API key needed) |

## Credits
By Eaglewing [571041]. Art, music and sound: "Ninja Adventure" by Pixel-boy and AAA (CC0). Characters and townspeople:
"Mana Seed" by Seliel the Shaper, used under licence with permission (not CC0; don't extract or reuse it).
All rights reserved, for use on Torn only: see [LICENCE](LICENCE).
