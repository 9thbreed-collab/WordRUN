# WordRun Procedural Requirements Document (PRD) - DRAFT

**Version:** 0.1.0
**Date:** 2026-01-14
**Author:** Gemini "Vibe Coder" Agent
**Status:** DRAFT

---

## 1. Vision & Core Principles: The "Why"

### 1.1 Product Vision

WordRun is a mobile word-association puzzle game that transcends simple mechanics. It is a **story-driven experience** where gameplay is the vehicle for narrative, and emotional design is the fuel. Players embark on a journey of discovery, not just of words, but of a world and a story, creating a cohesive experience where to advance in the game is to understand its lore.

### 1.2 The Vibe Check: Core Philosophy

*   **From:** "Make it work."
*   **To:** "Make it *feel*."

This project is a strategic reboot from a functional prototype to an emotionally resonant experience. Every decision must be filtered through the lens of our **four pillars**: Market Positioning, Story/Lore Integration, Monetization Strategy, and Design Excellence.

### 1.3 Non-Negotiable Principles

1.  **Story-First Integration:** The story is not an add-on; it is infused directly into every aspect of gameplay, from level design to mechanics.
2.  **Emotional Design as a Core Metric:** The game's success is measured not just by retention, but by its ability to evoke Accomplishment, Curiosity, Calm Confidence, and Delight.
3.  **Gameplay as Storytelling:** Word choices, puzzle mechanics, and difficulty will evolve and thematically link to the narrative's progression.
4.  **Quality as a Template:** The initial implementation sets the standard. We will systematize the game-building process by templating proven, high-quality designs for rapid, consistent expansion.

---

## 2. Product & Market: The "Who" and "Where"

### 2.1 Target Audience (Under Review)

*   **Primary:** Casual mobile gamers and word puzzle enthusiasts who crave deeper meaning and narrative in their games.
*   **Secondary:** Players of games like *Wordscapes*, *Candy Crush*, and *Words with Friends* who are looking for a more engaging, story-rich alternative.
*   **Psychographic Profile:** Seeks relaxation and mental stimulation; appreciates beauty and good storytelling; values personal growth and a sense of accomplishment.

### 2.2 Competitive Landscape

WordRun differentiates itself by blending the proven progression mechanics of games like *Candy Crush* with the cognitive challenge of word-chain puzzles and, most importantly, a deep, integrated narrative that is absent in most competitors.

*   **Vibe Check (Analytical Thinking):** We are not just another word game. We are creating a new genre: the "Narrative Puzzler." Our analysis must focus on how to merge the satisfying loops of puzzle games with the emotional investment of story-driven RPGs.

---

## 3. The Experience: Gameplay & Story (The "What")

### 3.1 Core Gameplay Loop

The fundamental player experience is a tight loop of cognitive challenge and emotional reward.

1.  **Present:** The player is presented with a word chain "ladder" with the first word revealed.
2.  **Solve:** The player types the next associated word in the chain (e.g., Car → **Door**).
3.  **Feedback:** The game provides immediate, "juicy" feedback.
    *   **Correct:** A celebratory micro-interaction (animation, sound, haptics) occurs. The character, Ruut, climbs the ladder.
    *   **Incorrect:** A gentle, non-punishing feedback animation occurs, encouraging another try.
4.  **Repeat:** The player continues up the 11-word ladder.
5.  **Complete:** Finishing the chain triggers a major celebration and progression.
6.  **Narrate:** A small piece of the story is revealed, providing context for the next level.

### 3.2 Systems & Mechanics

*   **Vibe Check (Logical Thinking):** These are the rules of our world. They must be consistent, fair, and serve the core emotional goals. The logic must be transparent to the player, even if the underlying calculations are complex.

| System | Description | Logical Implementation |
| :--- | :--- | :--- |
| **Typing Engine** | Handles all text input, command parsing (`?` hint, `/skip`), and typo forgiveness. | - Levenshtein distance for typos (1-char diff allowed within 2s for words ≥4 chars). <br> - A state machine manages player input mode (typing vs. command). |
| **Scoring** | Calculates score based on speed, accuracy, and combos. | - `Score = (Base * Speed Multiplier * Accuracy Multiplier) + Combo Bonus - Penalties`. <br> - All constants (`Base=100`, `HintPenalty=-25`) are defined in `gameConfig.json`. |
| **Trap System** | Introduces gameplay obstacles like locked rungs. | - Locked rungs force a "skip." The number of locked rungs scales with meta-level difficulty. <br> - Penalty box system with escalating wait times for failure. |
| **Progression** | Manages player's journey through 3,000 levels across 120 lands. | - `LevelManager` tracks player progress. <br> - `DataManager` syncs state with Supabase, ensuring offline safety and caching. |
| **Game Modes** | Varies the core gameplay loop. | - `GameModeManager` switches between modes like Story, Hidden Letter, and Scrabble. <br> - Each mode modifies a specific part of the `GameplayScene` logic. |

### 3.3 Story & World

*   **Vibe Check (Analytical Thinking):** The story is the spine of the project. We must break it down into components (themes, characters, beats) and map them analytically to game components (lands, levels, mechanics).

#### 3.3.1 The Narrative Synopsis

An ancient language is discovered that reveals the "loving contents of the heart" (the Fruit of the Spirit). It can also, in hardened hearts, reveal their opposites (the Works of the Flesh). The world is divided into 9 nations, each with a dominant "loving attribute" and two opposing "fleshly attributes." The player's journey is one of discovery, navigating this politically tense world to understand the power of this language.

#### 3.3.2 Narrative Integration Framework

| Integration Point | Description |
| :--- | :--- |
| **Land Theming** | Each of the 120 lands is mapped to one of the 9 nations, inheriting its visual theme, emotional tone, and "linguistic accent" (influencing word pools). |
| **NPC Dialogue** | NPCs deliver brief, engaging dialogue between levels and sometimes during gameplay, providing context and advancing the plot. |
| **Gameplay as Story** | The puzzles themselves reflect the narrative. A "tense" border crossing might feature more difficult words or a higher number of traps. |
| **Character Arc** | Ruut, the protagonist, grows and evolves alongside the player, with their journey reflecting the themes of the story. |

---

## 4. The Feel: Emotional Design & UX (The "How It Feels")

### 4.1 Emotional Core

The game is designed to evoke a specific emotional palette:
- **Primary Emotion:** **Accomplishment.** The player must feel smart and capable.
- **Supporting Emotions:** **Curiosity** (story), **Calm Confidence** (typing flow), and **Delight** (microinteractions).

### 4.2 Design Pillars (Applying Don Norman)

1.  **Visceral (The Gut Reaction):** Each land has a unique, beautiful aesthetic. The UI is clean, and the character is instantly likable. First impressions must be stunning.
2.  **Behavioral (The Joy of Use):** Typing must be a fluid, satisfying experience. The game provides clear, immediate, and rewarding feedback for every action. 60 FPS is non-negotiable.
3.  **Reflective (The Personal Connection):** The player's journey is their own. The story creates long-term meaning, streaks build identity, and shareable moments create social pride.

### 4.3 Microinteraction Blueprint: The "Correct Word" Celebration

This is the most critical interaction and must be perfect.
1.  **Trigger:** Player submits a correct word.
2.  **Rules & Feedback (500-600ms):**
    *   The word input glows green.
    *   A satisfying "chime" sound plays, rising in pitch.
    *   Ruut performs a quick "jump up" animation to the next rung.
    *   Subtle particle effects burst from the new rung.
    *   The combo meter animates smoothly upwards.
3.  **Loop:** The intensity of the celebration can subtly increase with the combo meter.

---

## 5. The Build: Architecture & Procedure (The "How to Build It")

### 5.1 Technical Stack

| Component | Technology | Version |
| :--- | :--- | :--- |
| **Game Engine** | Phaser | 3.90.0 |
| **Build Tool** | Vite | 6.2.6 |
| **Language** | TypeScript | 5.8.3 |
| **Backend** | Supabase | 2.79.0 |
| **Styling** | Tailwind CSS | |
| **Testing** | Vitest | 3.2.4 |

### 5.2 Architectural Blueprint

*   **Vibe Check (Computational Thinking):** This is the algorithm of our game. We must think in terms of data structures, singletons, scene management, and asynchronous operations. The architecture must be scalable and maintainable.

1.  **Scene-Based Structure:** The game is modularized into Phaser Scenes (`Preloader`, `GameplayScene`, `MapScene`). UI and transitions are separated from core logic.
2.  **Singleton Data Manager:** The `DataManager.ts` is the single source of truth for all game data. It handles all Supabase communication, caching, and offline safety. **Rule: Never call Supabase directly.**
3.  **Component-Based Gameplay:** Large scenes like `GameplayScene.ts` (4,539 lines) are being actively refactored into smaller, testable components (e.g., `ComboBar`, `WordBox`, `RuutCharacter`).
4.  **Data-Driven Configuration:** Game balance constants (scoring, timers, etc.) are not hardcoded. They are managed in `config.ts` and `gameConfig.json` to allow for easy tweaking.
5.  **Story Integration Service:** A dedicated service (`StoryIntegration.ts`) will act as an abstraction layer between the raw story data and the gameplay scenes, providing methods like `getLevelNarrative()` and `getThemedWordPool()`.

### 5.3 Development Process

*   **Vibe Check (Procedural Thinking):** This is our build ritual. A clear, step-by-step process ensures quality and predictability.

1.  **Phase 1: Foundation (Story & Strategy):** Define the narrative and design pillars before writing a line of code. (CURRENTLY IN THIS PHASE)
2.  **Phase 2: Parallel Build (Design + Code):** The Design Agent creates specs (`microinteractions.md`) while the Coding Agent implements core functionality.
3.  **Phase 3: Integration:** The Coding Agent integrates the design specs into the functional code.
4.  **Phase 4: Polish & Test:** The Polish Agent adds "game juice" (particles, haptics). The Test Agent runs comprehensive tests for performance, functionality, and emotional validation.
5.  **Phase 5: Template & Expand:** Once a feature or level meets the quality baseline, it is turned into a template for rapid, AI-assisted expansion.

---

## 6. The Future: Monetization & Roadmap

### 6.1 Ethical Monetization Strategy

**Core Principle:** Never gate story content or core progression. Monetize convenience and cosmetics. A player must be able to experience the entire story for free.

*   **Rewarded Ads:** Optional for hints, life refills.
*   **Consumable IAP:** Hint tokens, power-ups.
*   **Cosmetic IAP:** Ruut skins, UI themes.
*   **Premium Pass (Optional):** Ad-free experience, exclusive cosmetics, but **no exclusive story content.**

### 6.2 Immediate Roadmap

1.  **Finalize The Four Pillars:** Complete market research, solidify story/lore, define monetization, and establish the design system.
2.  **Create the Land Distribution Matrix:** Map all 120 lands to the 9 nations, assigning story beats and difficulty progression. This is the master blueprint for content.
3.  **Execute the 5-Hour MVP Sprint:** Build 5 fully polished levels that serve as the quality template for the entire game, following the multi-agent plan.
4.  **Resume Technical Refactoring:** Continue extracting components from `GameplayScene.ts` once the new design direction is set.
5.  **Begin Templated Expansion:** Use the MVP as a template to begin expanding the game content.
