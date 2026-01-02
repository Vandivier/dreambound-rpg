# DreamBound RPG

A dynamically generated text-based RPG where reality and dreams blur. Features AI-driven narrative, party management, and procedural quests powered by the Google Gemini API.

## Background / How to Play

1. **The Awakening**: You awaken on a strange stone platform in a field with no memory of how you arrived. You set out to determine whether this world is a hallucination, dream, or reality.
2. **The Journey**: Explore the procedurally generated world, survive encounters, and complete quests to discover the truth.
3. **The Truth**: Completing **Major Quests** weakens the veil. Every time a major quest is cleared, there is a **1 in 6 chance** to trigger the End Game, where the ultimate questions of your existence are answered.

## Features

- **Infinite Procedural World**: Every step generates a new map location (Town, Wilderness, Dungeon) with unique descriptions and interactable objects.
- **Skill System**: Unlock unique skills like *Fireball*, *Triple Slash*, or *Charm* as you level up. Use Energy Points (EP) to execute powerful moves.
- **Appraisal System**: Many items found in the dream are vague "Special" items (e.g., "Shadow-Stitch Tunic"). Visit an **Appraiser** in Towns to reveal their true nature (Weapon, Armor, Consumable) and unlock their stats.
- **Tactical Combat**: Turn-based combat with stats (HP, EP, ATK, DEF), skills, weaknesses, status effects, and RNG mechanics.
- **Intuition Quests**: The player is never lost. "Intuition" provides a constant stream of objectives to guide gameplay and provide consistent rewards.
- **AI Dungeon Master**: Actions are interpreted by Google Gemini. You can type freeform actions ("I inspect the ancient runes") and the AI resolves the outcome.
- **Dynamic Entities**: Enemies and Items are generated on the fly. Unique "Glitch" items appear if the AI connection falters.
- **Persistent State**: Auto-saves to LocalStorage.
- **Resilient Architecture**: Includes robust error handling, retries for API quotas, and a fallback "Glitch Mode" narrative if the AI is unreachable.

## Hybrid RNG Generation System

DreamBound uses a Hybrid AI D20 system to balance consistent gameplay with AI creativity.

Generative AI is used to interpret results 20% of the time following the 80/20 rule.

80% of the time, stock RPG mechanics are used. The system also falls back to stock
mechanics in the case of an AI error.

Notably, all critical results are interpreted with AI.

| D20 Roll | Outcome | Description |
| :--- | :--- | :--- |
| **1** | **Critical Failure** | A negative result of outlier magnitude, determined by AI. |
| **2** | **Negative Unique** | A negative result of mundane magnitude, determined by AI. |
| **3 - 12** | **Common** | Selects from a pre-defined library of Stock Common entities. |
| **13 - 15** | **Uncommon** | Selects from a pre-defined library of Stock Uncommon entities. |
| **16 - 18** | **Rare** | Selects from a pre-defined library of Stock Rare entities. |
| **19** | **Positive Unique** | A positive result of mundane magnitude, determined by AI. |
| **20** | **Critical Success** | A positive result of outlier magnitude, determined by AI. |

*Note: Enemies scale stats based on the player's current level.*

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google GenAI SDK (`@google/genai`)
- **Icons**: Heroicons

## Setup

1. Clone the repository.
2. Install dependencies: `npm install`
3. Set your API Key in the environment variables (handled by the platform environment).
4. Start the dev server: `npm start`

## Developer Notes

- The game logic is split between deterministic mechanics (`services/gameLogic.ts`, `services/skills.ts`) and AI imagination (`services/geminiService.ts`).
- State is centralized in `App.tsx` and managed via the `useGameLogic` hook.

## TODO / Possible Future Features

- Images, audio, animations, video; better UI
- Easy/medium/hard mode, stock-only mode, hardcore mode, and arcade mode with online leaderboard
- Multiplayer, skirmish, hyperparameter tuning eg tunable stock vs generative ratio
- Unlockable characters with standardized stories, quests, events
- Record and share game runs and generated entities with the community
- Metakarma system: Encyclopedia entries can be persisted as unlockables into future runs. Players can rate entries and the system may respect their rating such that preferred entities are included more frequently.
- Mod and extension support
- Better guardrails, particularly cancelling or denying insane custom prompts, potentially in a configurable way (eg bool to allow/deny NSFW)
- Improved mechanic consistency. Example: The story says my bard has a lute but I don't see it equipped nor in inventory. An NPC chat indicates a request for help but there is no formal quest.
- Balancing/pacing improvements (level vs reward rate, etc) and regional levels that have difficulty multipliers independent of player level (real danger mechanic)
- Maybe seasons, weather, farming/base elements
- Custom actions inside combat too, just like we can do outside of combat currently.
- Maybe: degradable equipment, memories, skills
- Add automated tests
- Refactor to smaller average files size
- Game should be offline-friendly and fully playable without AI. AI should be used when available
- Special Action: "Enter Dungeon" should actually spawn a dungeon and change the "World Map" to a "Dungeon Map." The user can only exit the dungeon from specific exit cells.
- handling for longer responses and chained responses with tool usage. currently, sometimes a response errors because it gets truncated by message limit.
- Ocean tiles and sailing system
- Maybe outer space...? maybe aliens? idk bro
- Real unlockable grafting system w graft class
- Raise level cap
- harder party recruiting
- better encyclopedia (including NPC names of ppl that wanted to join party and last seen at)
- different character races
- starting race and class bonuses
- equipment-sensitive moves (eg cant 'triple shot' with a sword)
- elemental ability subsystem
- crafting, fishing, mining, enchanting, alchemy systems.
- more npcs with relevant abilities like a blacksmith that can make a custom sword
- currently, closing and opening a shop again changes the items... this shouldn't happen except maybe after several turns to simulate inventory turnover
