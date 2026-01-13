# WordRun - Agent-Ready Context for MVP Production
## Synchronized Project State Post-Audit (2026-01-13)

**Status**: PRE-SPRINT PREREQUISITES INCOMPLETE - Multi-Agent Sprint BLOCKED
**Version**: 0.0.09 (Post-Audit)
**Critical Path**: Complete 6 prerequisites BEFORE executing 5-hour multi-agent sprint
**Estimated Time to Ready State**: 29 hours (can be parallelized)

---

## EXECUTIVE SUMMARY FOR AGENTS

### What You Need to Know

**The Goal**: Produce 5-land MVP (125 levels) ready for App Store/Google Play submission

**The Problem**: Story/lore framework is complete, but CONTENT is missing. The multi-agent sprint cannot begin until 6 prerequisite documents are created.

**The Blockers**:
1. Land Distribution Matrix (maps 120 lands → 9 nations) - DOES NOT EXIST
2. Story beat expansion (8 beats → 120 land sub-beats) - NOT DONE
3. First 5 lands word chains + NPC dialogue - NOT WRITTEN
4. Ad integration architecture - NOT DESIGNED
5. Visual design system (Lands 1-5) - NOT SPECIFIED
6. NPC roster (Lands 1-5) - NOT CREATED

**Your Role**: Once prerequisites are complete, execute WORDRUN-AI-DEVELOPMENT-PLAN.md 5-hour sprint to produce 5 polished levels demonstrating quality baseline.

---

## CURRENT PROJECT STATE (2026-01-13)

### Completed Foundation (Ready to Use)

**Story Framework ✅**:
- 9-nation world with dual spiritual attributes (Fruit of Spirit + Works of Flesh)
- Detective-Thriller-Myth genre structure with 8 story beats
- Protagonist journey routes (9-nation tours in both acts)
- National language design system (all 9 languages fully specified)
- National word pools organized by nation and mode (NationalWordPools.md)
- National-language-designer AI agent operational (.claude/agents/national-language-designer.md)

**Reference Documents** (Read These First):
- `Lore&StoryDraft1.md` - Core narrative with 9 explorers and ancient language discovery
- `AlignedStorySynopsisBeats_v2.md` - 8 story beats for game structure
- `WorldState_And_TravelRoutes.md` - Political dynamics and protagonist routes
- `NationalLanguageDesignSystem.md` - Linguistic frameworks for all 9 nations
- `NationalWordPools.md` - Ready-to-use vocabulary by nation and mode
- `WORDRUN-AI-DEVELOPMENT-PLAN.md` - 65-page multi-agent MVP execution strategy

**Technical Infrastructure ✅**:
- Functional prototype (3,000 levels with basic mechanics)
- Phaser 3.90.0 + Vite 6.2.6 + TypeScript 5.8.3 + Supabase
- 4 components extracted with tests (ComboBar, RuutCharacter, HintSystem, PowerUpInventory)
- Git SSH authentication configured (secure push/pull)

**Market Research & Strategy ✅**:
- 73,000-word market research brief (Market-Research-Brief-2026.md)
- "Competitive Word-Chain Puzzle" positioning validated
- Target metrics: D1: 35-40%, D7: 18-22%, D30: 8-10%, ARPDAU: $0.10-$0.15

**Emotional Design Framework ✅**:
- 58,000-word research report (emotional-design-research-report.md)
- Top 10 prioritized actions (WORDRUN-TOP-10-EMOTIONAL-DESIGN-ACTIONS.md)
- Microinteraction timing specs (typing: 500-600ms celebration for correct word)
- High-schooler friendly design audit checklist (EMOTIONAL_DESIGN_CHECKLIST.md)

### Missing Prerequisites (BLOCKING MVP)

**PREREQUISITE #1: Land Distribution Matrix** (NOT CREATED)
- **What It Is**: Master table mapping all 120 lands to nations, acts, story beats, language modes, difficulty
- **Why Critical**: Without this, agents cannot produce land-specific content
- **Format**: 120-row table in LandDistributionMatrix.md
- **Columns Required**:
  - Land# (1-120)
  - Nation (Aethelgard, Carnea, Salomia, Gilead, Niridia, Tobin, Kanaan, Patmos, Corinthia)
  - Act (FirstHalf: 1-60, SecondHalf: 61-120)
  - BorderType ('ally', 'neutral', 'tense', 'enemy')
  - StoryBeat (1-8, which beat this land represents)
  - LanguageMode ('A' Transformed, 'B' Base, 'C' Rebellion)
  - DifficultyTier (1-5)
- **Estimated Time**: 3 hours
- **Dependencies**: WorldState_And_TravelRoutes.md (political relations), AlignedStorySynopsisBeats_v2.md (8 beats)

**Distribution Logic Guidance**:
- 120 lands / 9 nations = ~13-14 lands per nation (can vary slightly)
- First Half (Lands 1-60): Use "Normal State" relations matrix
- Second Half (Lands 61-120): Use "Aggressive State" relations matrix
- 8 story beats → ~15 lands per beat (distribute evenly)
- Language Mode distribution: 40% Mode B (Base), 30% Mode A (Transformed), 30% Mode C (Rebellion)
- Difficulty progression: Lands 1-24 (Tier 1-2), Lands 25-60 (Tier 2-3), Lands 61-96 (Tier 3-4), Lands 97-120 (Tier 4-5)

**PREREQUISITE #2: Story Beat Expansion** (NOT DONE)
- **What It Is**: Break 8 high-level story beats into 120 land-specific sub-beats
- **Why Critical**: Level designers need narrative context for each land's 25 levels
- **Format**: ExpandedStoryBeats.md with 120 sub-beat descriptions
- **Structure**:
  ```markdown
  ## Beat 1: The Inciting Incident (Lands 1-15)

  ### Land 1 (Aethelgard, First Half): "The Package Arrives"
  - Mini-narrative: Protagonist receives mysterious stone package at home
  - Emotional tone: Curiosity + confusion
  - NPC moment: Delivery ruut mentions "last ferry to Carnea departs soon"

  ### Land 2 (Carnea, First Half): "The Accidental Journey"
  - Mini-narrative: Protagonist boards ferry but it departs before he can leave
  - Emotional tone: Frustration + determination
  - NPC moment: Ferry captain explains port closures, trapped in Carnea

  [... continue for all 120 lands]
  ```
- **Estimated Time**: 5 hours (creative writing)
- **Dependencies**: AlignedStorySynopsisBeats_v2.md, WorldState_And_TravelRoutes.md, Land Distribution Matrix

**PREREQUISITE #3: First 5 Lands Full Content** (NOT WRITTEN)
- **What It Is**: For Lands 1-5 (125 levels), produce:
  - Word chains with linguistic flavor (using NationalWordPools.md)
  - NPC dialogue (level start, level complete, land intro, land outro, mid-land checkpoint)
  - Hint text per word
  - Alternative answer sets per word
  - Story sub-beat text per level
- **Why Critical**: Multi-agent sprint produces INTEGRATION, not CONTENT. Content must exist first.
- **Format**: 5 separate files: Land1Content.md, Land2Content.md, ..., Land5Content.md
- **Structure Per Land**:
  ```markdown
  # Land [X] Content: [Nation Name]

  ## Land Metadata
  - Nation: [Nation]
  - Act: [FirstHalf/SecondHalf]
  - Language Mode: [A/B/C]
  - Story Beat: [Beat description]
  - Difficulty: [Tier]
  - Color Palette: [Primary, Secondary, Accent]

  ## Land Intro Dialogue
  **NPC**: [Name] ([Nation] guide character)
  **Text**: [3-5 sentences using national language patterns]

  ## Levels 1-25

  ### Level 1: [Mini-narrative moment]
  **Word Chain**: [word1] → [word2] → [word3] → ... → [word11]
  **Hints**: ["hint1", "hint2", ..., "hint11"]
  **Alternative Answers**: [[], ["alt1"], [], ..., []]
  **NPC Dialogue (if any)**: [Text]

  [... repeat for all 25 levels]

  ## Land Outro Dialogue
  **NPC**: [Name]
  **Text**: [2-3 sentences transitioning to next land]
  ```
- **Estimated Time**: 8 hours (with national-language-designer agent assistance)
- **Dependencies**: Land Distribution Matrix, ExpandedStoryBeats.md, NationalWordPools.md, NationalLanguageDesignSystem.md

**Example Level Content** (Land 1, Level 1, Aethelgard):
```markdown
### Level 1: "Ruut finds mysterious package"
**Word Chain**: package → box → container → vessel → ship → sail → journey → path → road → home → family
**Hints**: [
  "Something delivered in mail",
  "A cardboard ___",
  "Holds items",
  "Boat or container",
  "Water transport",
  "Catch the wind",
  "Long trip",
  "Way forward",
  "Highway or street",
  "Where you live",
  "Parents and children"
]
**Alternative Answers**: [
  ["parcel"],
  ["carton"],
  [],
  [],
  ["boat"],
  ["sailing"],
  ["trip", "voyage"],
  ["trail", "route"],
  ["street"],
  [],
  ["relatives"]
]
**NPC Dialogue**: None (first level intro via land intro dialogue)
**Aethelgard Linguistic Flavor**:
- Love/Hatred tension: Words emphasize connection (family, home) but with underlying distance
- Mode B (Base): Telegraph style, verb-first: "Saw package... strange warmth"
```

**PREREQUISITE #4: Ad Integration Architecture** (NOT DESIGNED)
- **What It Is**: Technical specification for AdMob SDK integration with Phaser 3 + Cordova
- **Why Critical**: Ads affect UI layout (banner space reservation), scene flow (interstitial placement), and monetization testing. Retrofitting later WILL break design.
- **Format**: AdIntegrationSpec.md with technical details
- **Required Sections**:
  1. **Ad Network Selection**: AdMob (Google) recommended
  2. **Ad Slot Types**: Banner (persistent), Interstitial (after level complete), Rewarded Video (opt-in)
  3. **Placement Strategy**: Frequency, trigger points, UI considerations
  4. **Cordova Plugin**: cordova-admob-plus (actively maintained)
  5. **TypeScript Integration**: AdMobManager class skeleton
  6. **Layout Adjustments**: Reserve 50px bottom space for banner ad
  7. **Revenue Projections**: eCPM estimates per ad type
- **Estimated Time**: 4 hours (technical research + architecture doc)
- **Dependencies**: Market-Research-Brief-2026.md (monetization targets), GAME_CONFIG (screen dimensions)

**UI Space Reservation** (CRITICAL):
```typescript
// src/scenes/GameplayScene.ts layout constants
const SCREEN_HEIGHT = 844;  // iPhone 14 Pro portrait
const BANNER_AD_HEIGHT = 50;  // AdMob smart banner
const PLAYABLE_HEIGHT = SCREEN_HEIGHT - BANNER_AD_HEIGHT;  // 794
const WORD_INPUT_Y = PLAYABLE_HEIGHT - 44;  // 750 (safe zone above banner)
```

**PREREQUISITE #5: Visual Design System (Lands 1-5)** (NOT SPECIFIED)
- **What It Is**: Color palettes, background themes, Ruut skin assignments, particle effects for first 5 lands
- **Why Critical**: DesignAgent needs specific visual direction to create design_system.json. Generic instructions insufficient.
- **Format**: VisualDesignSystem_Lands1-5.md
- **Required Per Land**:
  ```markdown
  ## Land [X]: [Nation Name] ([Fruit] / [Work])

  **Color Palette**:
  - Primary: #XXXXXX (derived from [Fruit] attribute)
  - Secondary: #XXXXXX (complementary)
  - Accent: #XXXXXX (highlight color)
  - Background: #XXXXXX or gradient spec

  **Emotional Tone**: [curiosity, determination, joy, wonder, calm, urgency]

  **Ruut Skin**: [Base, AethelgardSkin, CarneaSkin, etc.]

  **Particle Theme**: [seasonal (spring, summer, fall, winter), spiritual (light, dark, neutral)]

  **UI Component Theming**:
  - Buttons: [color, border radius, shadow style]
  - Word Box: [background, border, text color]
  - Combo Bar: [fill color, glow effect]
  ```
- **Estimated Time**: 6 hours (visual design work)
- **Dependencies**: emotional-design-research-report.md (visceral design principles), NationalLanguageDesignSystem.md (attribute mappings)

**Color Derivation Logic** (Fruit of Spirit → Color):
- Love (Aethelgard): Warm reds/pinks (#E91E63, #F06292)
- Joy (Carnea): Bright yellows/oranges (#FFC107, #FFD54F)
- Peace (Salomia): Soft blues/greens (#4CAF50, #81C784)
- Longsuffering (Gilead): Earthy browns/greens (#8D6E63, #A1887F)
- Gentleness (Niridia): Pastel purples/blues (#9C27B0, #BA68C8)
- Goodness (Tobin): Pure whites/golds (#FFFFFF, #FFD700)
- Faith (Kanaan): Deep blues/silvers (#2196F3, #64B5F6)
- Meekness (Patmos): Muted grays/lavenders (#9E9E9E, #BDBDBD)
- Temperance (Corinthia): Balanced teal/cyan (#009688, #4DB6AC)

**PREREQUISITE #6: NPC Roster (Lands 1-5)** (NOT CREATED)
- **What It Is**: Character profiles for NPCs appearing in first 5 lands
- **Why Critical**: NPC dialogue must reflect national linguistic "accent" and personality traits. Generic NPCs break immersion.
- **Format**: NPCRoster_Lands1-5.md
- **Required Per NPC**:
  ```markdown
  ## NPC: [Name]

  **Nation Origin**: [Nation]
  **Role**: [Guide, Merchant, Port Official, etc.]
  **Appears In**: [Land X, Land Y]

  **Personality Traits** (aligned with national attributes):
  - [Trait 1 derived from Fruit of Spirit]
  - [Trait 2 derived from dominant Work of Flesh]
  - [Trait 3 derived from recessive Work of Flesh]

  **Speech Patterns** (using NationalLanguageDesignSystem.md):
  - Grammar: [Verb-first, article omission, ellipses usage]
  - Vocabulary: [Common words from NationalWordPools.md]
  - Tone: [Formal, casual, suspicious, welcoming]

  **Dialogue Examples**:
  - Greeting: "[Example using national language patterns]"
  - Level Start: "[Example]"
  - Level Complete: "[Example]"

  **Appearance Notes** (for future asset creation):
  - [Physical description, clothing style, distinctive features]
  ```
- **Estimated Time**: 3 hours (with national-language-designer agent)
- **Dependencies**: NationalLanguageDesignSystem.md, WorldState_And_TravelRoutes.md (political contexts), Land Distribution Matrix

**Example NPC** (Aethelgard guide):
```markdown
## NPC: Theryn

**Nation Origin**: Aethelgard (Love/Hatred)
**Role**: Ferry dock guide (first encounter)
**Appears In**: Land 1 (Aethelgard), Land 6 (Aethelgard revisit in Second Half)

**Personality Traits**:
- Warm but guarded (Love dormant, Hatred active)
- Quick to judge strangers (Hatred work)
- Secretly helpful once trust established (Love emerging)

**Speech Patterns**:
- Grammar: Verb-first, minimal articles, short phrases
- Vocabulary: Distrust words ("stranger", "careful", "watch"), connection words ("ferry", "passage", "journey")
- Tone: Initially suspicious, gradually warming

**Dialogue Examples**:
- Greeting (suspicious): "Saw you from ferry. That box... why carry?"
- Level Complete (warming): "Solved well. Perhaps... not stranger after all."
- Land Outro (helpful): "Path ahead... dangerous. Take this. Will need."

**Appearance Notes**:
- Weathered dock worker clothing (grays, dark reds)
- Carries lantern (Aethelgard lighting theme)
- Scarf covering lower face (guarded personality visual)
```

---

## MULTI-AGENT SPRINT EXECUTION (AFTER PREREQUISITES)

### Handoff Directory Structure

Once prerequisites are complete, agents will populate these directories:

```
/handoff/
  /01_story/          # StoryAgent populates with land content
  /02_design/         # DesignAgent creates visual specifications
  /03_code/           # CodingAgent implements functionality
  /04_test/           # TestAgent validates quality
  /05_polish/         # PolishAgent adds game juice
  /sync/              # Human approval gates and blockers
```

### 5-Hour Sprint Timeline (from WORDRUN-AI-DEVELOPMENT-PLAN.md)

**Hour 0-1: Story Foundation (StoryAgent)**
- Read: Land Distribution Matrix, ExpandedStoryBeats.md, Land1-5Content.md files
- Populate: handoff/01_story/story_framework.md (with ACTUAL content, not placeholders)
- Populate: handoff/01_story/land_themes.json (Lands 1-5 with color palettes, language modes, difficulty)
- Populate: handoff/01_story/character_profiles.md (NPCs from NPCRoster_Lands1-5.md)
- Output: handoff/sync/current_status.json (phase: "story_complete", ready_for_review: true)

**Hour 1-3: Parallel Build (DesignAgent + CodingAgent + TestAgent)**

*DesignAgent Track*:
- Read: handoff/01_story/*, VisualDesignSystem_Lands1-5.md, WORDRUN-TOP-10-EMOTIONAL-DESIGN-ACTIONS.md
- Create: handoff/02_design/design_system.json (colors, typography, spacing, animation timing)
- Create: handoff/02_design/microinteractions.md (typing animation: 500-600ms celebration, 400ms error recovery)
- Create: handoff/02_design/ruut_animation_spec.md (4 mood states: idle, happy, sad, celebrate)
- Create: handoff/02_design/emotional_map.md (target emotion per interaction type)

*CodingAgent Track*:
- Read: handoff/01_story/*, handoff/02_design/* (as they become available), AdIntegrationSpec.md
- Extract: WordBox component from GameplayScene.ts (5th component, ~500+ lines)
- Implement: Typing microinteraction (follow handoff/02_design/microinteractions.md timing)
- Integrate: ComboBar, RuutCharacter components with new design system
- Create: AdMobManager skeleton class (reserve banner space, stub ad methods)
- Create: StoryIntegration service (hooks for NPC dialogue, land theming, word selection)
- Output: handoff/03_code/component_api.md, handoff/03_code/integration_points.md

*TestAgent Track*:
- Write: WordBox component tests (as CodingAgent completes extraction)
- Write: Typing microinteraction timing tests (validate 500-600ms celebration, 400ms error)
- Run: Performance baseline (target: 60 FPS sustained)
- Verify: EMOTIONAL_DESIGN_CHECKLIST.md items for implemented features

**Hour 3-4: Integration (CodingAgent + TestAgent)**
- Apply: design_system.json to GameplayScene.ts (colors, typography from VisualDesignSystem_Lands1-5.md)
- Implement: Chain completion celebration sequence (2-3 second particle + Ruut animation)
- Wire up: Story integration points (NPC dialogue triggers, land theme application)
- Test: Integration tests (all components working together)
- Output: handoff/04_test/test_report.md, handoff/04_test/performance_report.md

**Hour 4-5: Polish + Monitoring (PolishAgent + TestAgent)**
- Add: Particle effects for correct word + chain completion
- Implement: Haptic feedback (if supported on device)
- Create: handoff/05_polish/personalization_schema.json (data model for Spotify-like AI)
- Set up: AI monitoring hooks (session tracking, FPS logging, error reporting)
- Final: Performance test (60 FPS verification)
- Output: handoff/05_polish/polish_manifest.md

**Human Review Checkpoints**:
- After Hour 1 (60 min): Approve story framework in handoff/01_story/
- After Hour 2 (120 min): Approve design system in handoff/02_design/
- After Hour 4 (240 min): Approve integration in handoff/03_code/ + handoff/04_test/
- After Hour 5 (300 min): MVP sign-off

**Deliverable**: 5 fully polished levels (Land 1, Levels 1-5) demonstrating quality baseline.

---

## DATA SCHEMAS FOR AGENT INTEGRATION

### LandTheme Interface (TypeScript)

```typescript
// src/types/StoryTypes.ts

interface LandTheme {
  id: number;  // 1-120
  name: string;  // "Verdant Beginnings"
  nation: string;  // "Aethelgard"
  storyContext: {
    chapter: number;  // 1-8 (story beat)
    act: 'FirstHalf' | 'SecondHalf';
    significance: string;  // Why this land matters to story
    narrativeHook: string;  // One-sentence teaser
    emotionalTone: 'curiosity' | 'determination' | 'joy' | 'wonder' | 'calm' | 'urgency';
  };
  visualTheme: {
    primaryColor: string;  // Hex color
    secondaryColor: string;
    accentColor: string;
    atmosphere: 'bright' | 'mystical' | 'tense' | 'peaceful' | 'celebratory';
    season: 'spring' | 'summer' | 'autumn' | 'winter' | 'eternal';
  };
  languageRegion: {
    nation: string;  // "Aethelgard"
    dialect: string;  // "Love's Whisper (Dormant)"
    mode: 'A' | 'B' | 'C';  // Transformed, Base, Rebellion
    wordInfluence: string[];  // Words more likely to appear
    greetingPhrase: string;  // NPC greeting in local dialect
  };
  progression: {
    requiredLevel: number;  // Previous land's final level
    unlocksLand: number | null;  // Next land ID
    storyUnlocks: string[];  // What story elements become available
    difficulty: 1 | 2 | 3 | 4 | 5;
  };
  politicalContext: {
    borderType: 'ally' | 'neutral' | 'tense' | 'enemy';
    travelMethod: string;  // "Ferry", "Land route", "Border passage with language"
  };
}
```

### LevelTemplate Interface (TypeScript)

```typescript
// templates/level.template.ts

interface LevelTemplate {
  metadata: {
    landId: number;
    levelIndex: number;  // 1-25 within land
    difficulty: 1 | 2 | 3 | 4 | 5;
    estimatedDuration: number;  // seconds
  };
  puzzle: {
    chain: string[];  // 11 words
    hints: string[];  // Hint text per word (11 items)
    alternativeAnswers: string[][];  // Valid alternatives per position (11 arrays)
  };
  storyIntegration: {
    themeRelevance: number;  // 0-1 how relevant to land theme
    emotionalBeat: string;  // What emotion this level targets
    npcAppearance: boolean;  // Whether NPC shows up
    npcDialogue?: string;  // Text if NPC appears
  };
  rewards: {
    baseXP: number;
    starThresholds: [number, number, number];  // Time thresholds for 1/2/3 stars
    specialReward?: string;  // Unlock item
  };
  traps: {
    lockedRungs: number[];  // Which rungs are locked
    trapType: 'standard' | 'timed' | 'limited-hints';
  };
}
```

### CharacterProfile Interface (TypeScript)

```typescript
// src/types/StoryTypes.ts

interface CharacterProfile {
  id: string;
  name: string;
  nation: string;  // "Aethelgard"
  role: 'protagonist' | 'npc' | 'antagonist' | 'guide';
  backstory: {
    summary: string;  // 2-3 sentences
    fullStory: string;  // Detailed backstory (loaded on demand)
  };
  personality: {
    traits: string[];  // ["guarded", "helpful", "suspicious"]
    speechStyle: string;  // "Verb-first, short phrases, gradually warming"
    catchphrase: string;  // "Path ahead... dangerous. Take this."
  };
  appearance: {
    baseSprite: string;  // Asset key
    description: string;  // Physical appearance notes
  };
  gameplayInfluence: {
    appearsInLands: number[];  // [1, 6]
    dialogueTriggers: DialogueTrigger[];
  };
  linguisticFlavor: {
    grammarPatterns: string[];  // ["Verb-first", "Article omission"]
    vocabularyPreferences: string[];  // ["stranger", "careful", "watch", "ferry"]
    toneShift: string;  // "Initially suspicious → gradually warming"
  };
}

interface DialogueTrigger {
  condition: 'level_start' | 'level_complete' | 'land_complete' | 'first_failure' | 'streak_milestone';
  landId?: number;
  levelId?: number;
  dialogue: string;
  emotion: string;
}
```

---

## AGENT PROMPTS (FOR SPRINT EXECUTION)

### StoryAgent Activation Prompt

```
You are the StoryAgent for WordRun. Your role is to populate handoff/01_story/ with ACTUAL content (not placeholders).

PREREQUISITES COMPLETED (Read These):
- /Users/nathanielgiddens/WordRunProject/LandDistributionMatrix.md (land → nation mappings)
- /Users/nathanielgiddens/WordRunProject/ExpandedStoryBeats.md (120 land sub-beats)
- /Users/nathanielgiddens/WordRunProject/Land1Content.md through Land5Content.md (word chains + NPC dialogue)
- /Users/nathanielgiddens/WordRunProject/NPCRoster_Lands1-5.md (character profiles)

YOUR TASKS (60 minutes):

1. Create handoff/01_story/story_framework.md
   - Consolidate Land1-5Content.md into unified story framework
   - Include: World overview, Ruut backstory, 9 nations summary, protagonist journey arc
   - Document: How story informs gameplay (word selection, NPC triggers, land theming)

2. Create handoff/01_story/land_themes.json
   - Populate LandTheme objects for Lands 1-5 (use TypeScript interface from AGENT_READY_CONTEXT.md)
   - Extract: Nation, colors, language mode, difficulty from LandDistributionMatrix.md
   - Extract: Story beat, narrative hook, emotional tone from ExpandedStoryBeats.md
   - Extract: Word influence, greeting phrase from NPCRoster_Lands1-5.md

3. Create handoff/01_story/character_profiles.md
   - Populate CharacterProfile objects for all NPCs in NPCRoster_Lands1-5.md
   - Include: Personality traits, speech patterns, dialogue examples, appearance notes

4. Create handoff/01_story/language_concepts.md
   - Document: How national languages influence word selection (reference NationalLanguageDesignSystem.md)
   - Provide: Mode A/B/C examples for Lands 1-5 nations
   - List: Word pools per nation from NationalWordPools.md

OUTPUT: Update handoff/sync/current_status.json with phase: "story_complete", ready_for_review: true

CONSTRAINTS:
- Maximum 60 minutes for this phase
- NO placeholders - use actual content from prerequisite docs
- Follow handoff file format (see WORDRUN-AI-DEVELOPMENT-PLAN.md Appendix B.1)
```

### DesignAgent Activation Prompt

```
You are the DesignAgent for WordRun. Your role is to translate story framework + visual design specs into implementation-ready design files.

PREREQUISITES (Check First):
- handoff/sync/current_status.json must show phase: "story_complete"
- Read: handoff/01_story/* (all files)
- Read: /Users/nathanielgiddens/WordRunProject/VisualDesignSystem_Lands1-5.md

YOUR TASKS (90 minutes):

1. Create handoff/02_design/design_system.json
   - Extract color palettes from VisualDesignSystem_Lands1-5.md
   - Define: Typography (font families, sizes, weights)
   - Define: Spacing constants (padding, margins, gaps)
   - Define: Animation timing (typing: 500-600ms celebration, 400ms error recovery)
   - Define: Border radius, shadow styles, opacity values

2. Create handoff/02_design/microinteractions.md
   - Specify: Typing interaction (per keystroke visual feedback)
   - Specify: Correct word celebration (500-600ms timing, particle effects, Ruut animation trigger)
   - Specify: Incorrect word feedback (400ms red flash, shake animation)
   - Specify: Chain completion celebration (2-3 second sequence: particle burst → Ruut celebrate → score display)
   - Include: All timing values, animation curves (ease-in-out, bounce, etc.)

3. Create handoff/02_design/ruut_animation_spec.md
   - Define 4 mood states: idle, happy, sad, celebrate
   - Specify: When to transition between moods (based on gameplay events)
   - Document: Animation loop timings, sprite sheet references
   - Apply: Emotional design principles from WORDRUN-TOP-10-EMOTIONAL-DESIGN-ACTIONS.md

4. Create handoff/02_design/emotional_map.md
   - Map: Target emotion per interaction type (typing → flow state, correct word → accomplishment, chain complete → triumph)
   - Document: Emotional arc of typical level (curiosity → determination → accomplishment)
   - Explain: How design supports story themes (colors reinforce national attributes, Ruut expressions reflect player state)

OUTPUT: Update handoff/sync/current_status.json with phase: "design_complete"

CONSTRAINTS:
- Maximum 90 minutes for this phase
- Design must be implementable in Phaser 3
- Prioritize core gameplay interactions (typing, celebration, Ruut)
- Reference story framework in all visual decisions
```

### CodingAgent Activation Prompt

```
You are the CodingAgent for WordRun. Your role is to implement game functionality according to design specifications.

PREREQUISITES (Check First):
- handoff/sync/current_status.json must show phase: "design_complete"
- Read: handoff/01_story/* (story context)
- Read: handoff/02_design/* (design specs)
- Read: /Users/nathanielgiddens/WordRunProject/AdIntegrationSpec.md

YOUR TASKS:

Phase 2B (Hour 1-3, 120 minutes):
1. Extract WordBox component from GameplayScene.ts
   - Follow: Existing component patterns in src/ui/ (ComboBar, RuutCharacter)
   - Include: TypeScript interfaces, dependency injection, init/shutdown lifecycle
   - Write: Tests in src/test/WordBox.test.ts
   - Document: API in component file docstrings

2. Implement typing microinteraction
   - Follow: handoff/02_design/microinteractions.md timing specs
   - Target: <16ms input latency (60 FPS requirement)
   - Add: Visual feedback per keystroke (letter pop-in animation)
   - Add: Correct word celebration (500-600ms particle + Ruut trigger)
   - Add: Incorrect word feedback (400ms red flash + shake)

3. Integrate existing components with new design
   - Apply: handoff/02_design/design_system.json colors to ComboBar, RuutCharacter, HintSystem, PowerUpInventory
   - Update: Typography, spacing, border radius to match design system

4. Create AdMobManager skeleton class
   - Location: src/services/AdMobManager.ts
   - Methods: showBanner(), hideBanner(), showInterstitial(), showRewardedVideo(rewardType)
   - Integration: Phaser EventEmitter pattern (see AdIntegrationSpec.md)
   - Layout: Reserve 50px bottom space in GameplayScene.ts (PLAYABLE_HEIGHT = 794)

5. Create StoryIntegration service
   - Location: src/services/StoryIntegration.ts
   - Methods: getLevelNarrative(landId, levelId), showNPCDialogue(dialogue), applyLandTheme(landTheme)
   - Data: Load from handoff/01_story/land_themes.json

Phase 3 (Hour 3-4, 60 minutes):
6. Apply design system to GameplayScene
   - Update: Colors, typography, spacing throughout scene
   - Test: Visual consistency with design_system.json

7. Implement celebration sequence
   - Follow: handoff/02_design/microinteractions.md chain completion spec
   - Sequence: Particle burst (500ms) → Ruut celebrate animation (1000ms) → Score display (500ms)

8. Wire up story integration points
   - Hook: Level start → StoryIntegration.getLevelNarrative() → Show NPC dialogue if applicable
   - Hook: Land complete → StoryIntegration.applyLandTheme() → Update colors for next land

OUTPUT FILES:
- Modified TypeScript files in src/
- handoff/03_code/component_api.md (WordBox API documentation)
- handoff/03_code/integration_points.md (Where story hooks are located)

CONSTRAINTS:
- Target: 60 FPS sustained
- No console errors
- All new code must have tests
- Follow existing code patterns (dependency injection, lifecycle management)
```

---

## CONFLICT RESOLUTIONS (HUMAN DECISIONS NEEDED)

### Resolution Status: PENDING USER INPUT

**Conflict #1: Gambo.ai Role**
- **Question**: Should the ad system use AdMob (recommended), or did you intend a different platform?
- **Context**: Gambo.ai is a game builder, not an ad SDK. See PROJECT_AUDIT_EXECUTIVE_SUMMARY.md Section 4 for AdMob integration architecture.
- **Recommendation**: Use AdMob with Cordova plugin (cordova-admob-plus)

**Conflict #2: MVP Scope (5 Lands vs 1 Land)**
- **Question**: Should the MVP target 5 lands (125 levels) or 1 land (25 levels) for quality baseline?
- **Context**: 1 land allows polish-to-perfection; 5 lands risks inconsistent quality. See PROJECT_AUDIT_EXECUTIVE_SUMMARY.md Section 5 for recommendation.
- **Recommendation**: 1 land MVP (25 levels), then expand to 5 lands post-validation

**Conflict #3: Story "Completeness" Definition**
- **Question**: Does "Story complete" mean framework-ready (Option A) or all 125 levels have written content (Option B)?
- **Context**: Framework is complete. Content is incomplete. See PROJECT_AUDIT_EXECUTIVE_SUMMARY.md Section 2 Conflict #1.
- **Clarification Needed**: Confirm framework is sufficient, or specify content depth required

---

## SUCCESS CRITERIA FOR MVP

### Functional Requirements
- [x] Core typing mechanic (prototype exists)
- [ ] WordBox component extracted and tested
- [ ] Word chain completion (11 words per level)
- [ ] Combo system functional
- [ ] Typo forgiveness (Levenshtein distance)
- [ ] Level completion flow
- [ ] 5 playable levels (or 25 if 1-land scope)

### Emotional Design Requirements (from EMOTIONAL_DESIGN_CHECKLIST.md)
- [ ] Typing microinteraction (letter animation on keystroke)
- [ ] Correct word celebration (500-600ms sequence)
- [ ] Chain completion celebration (2-3 second particle + Ruut)
- [ ] Ruut mood animations (4 states implemented)
- [ ] Design system applied (colors, typography match specs)

### Performance Requirements
- [ ] 60 FPS sustained during gameplay
- [ ] <16ms input latency for typing
- [ ] <2 seconds initial load time
- [ ] <500ms level transition
- [ ] <150MB memory usage

### Story Integration Requirements
- [ ] Story framework exists (handoff/01_story/)
- [ ] Land theme applied (visual reflects Land 1 attributes)
- [ ] NPC dialogue hook functional (can trigger placeholder or real dialogue)
- [ ] Story data schema validated (LandTheme, CharacterProfile interfaces)

### Ad Integration Requirements
- [ ] AdMobManager class implemented (skeleton with stubs)
- [ ] Banner ad space reserved (50px bottom, PLAYABLE_HEIGHT = 794)
- [ ] Interstitial trigger logic defined (every 3rd level)
- [ ] Rewarded video button UI created ("Watch Ad → Get 1 Life")

### Monitoring Requirements
- [ ] Session data collection (basic metrics captured)
- [ ] Performance logging (FPS/memory tracked)
- [ ] Personalization schema defined (data model for Spotify-like AI)

---

## AGENT COORDINATION WORKFLOW

### Pre-Sprint Human Actions (Required BEFORE Sprint)

1. **Resolve Conflicts** (15 minutes)
   - Confirm ad network choice (AdMob recommended)
   - Confirm MVP scope (1 land vs 5 lands)
   - Clarify story completeness definition

2. **Create 6 Prerequisites** (29 hours, can parallelize with multiple agents):
   - LandDistributionMatrix.md (3 hours)
   - ExpandedStoryBeats.md (5 hours)
   - Land1-5Content.md files (8 hours with national-language-designer agent)
   - AdIntegrationSpec.md (4 hours)
   - VisualDesignSystem_Lands1-5.md (6 hours)
   - NPCRoster_Lands1-5.md (3 hours with national-language-designer agent)

3. **Approve Prerequisites** (2 hours)
   - Review all 6 prerequisite documents for accuracy
   - Validate Land Distribution Matrix logic (120 lands evenly distributed)
   - Approve visual design system (colors feel right for nations)
   - Approve NPC roster (characters have personality depth)

### Sprint Execution (5 Hours, Fully Automated After Prerequisites)

**Setup** (5 minutes):
- Ensure handoff/ directory structure exists
- Initialize handoff/sync/current_status.json with phase: "foundation"
- Confirm all prerequisite files exist in project root

**Hour 0-1**: StoryAgent (automated)
- Reads prerequisites, populates handoff/01_story/
- Updates handoff/sync/current_status.json to phase: "story_complete"
- **Human Checkpoint**: Review handoff/01_story/ files, approve or request revisions

**Hour 1-3**: Parallel Build (automated)
- DesignAgent populates handoff/02_design/
- CodingAgent implements in src/
- TestAgent writes tests in src/test/
- Agents monitor handoff/sync/blockers.md for issues
- **Human Checkpoint**: Review handoff/02_design/ files, approve design system

**Hour 3-4**: Integration (automated)
- CodingAgent applies design system, implements celebration sequence
- TestAgent runs integration tests
- Agents update handoff/04_test/ with results
- **Human Checkpoint**: Review handoff/04_test/test_report.md, verify 60 FPS

**Hour 4-5**: Polish (automated)
- PolishAgent adds particle effects, haptics, personalization schema
- TestAgent runs final performance tests
- Agents update handoff/05_polish/polish_manifest.md
- **Human Checkpoint**: MVP sign-off or document remaining work

**Output**: 5 fully polished levels (or 25 if 1-land scope) demonstrating quality baseline.

---

## NEXT SESSION ACTION ITEMS (PRIORITY ORDER)

### Immediate (Next Session Start)

1. **Resolve Gambo.ai Confusion** (5 minutes)
   - Confirm ad network: AdMob, IronSource, Unity Ads, or other?
   - If different platform intended, provide correct name

2. **Confirm MVP Scope** (5 minutes)
   - 5 lands (125 levels) or 1 land (25 levels)?
   - Recommendation: Start with 1 land for quality baseline, expand post-validation

3. **Clarify Story Completeness** (5 minutes)
   - Is framework-ready sufficient (Option A)?
   - Or do all 125 levels need written content before sprint (Option B)?

### Blocking Tasks (Must Complete Before Sprint)

4. **Create Land Distribution Matrix** (3 hours)
   - Use CLAUDE.md Line 296-318 instructions
   - Deliverable: LandDistributionMatrix.md with 120-row table

5. **Create Ad Integration Spec** (2 hours)
   - Finalize ad network choice (AdMob recommended)
   - Document placement strategy (banner, interstitial, rewarded video)
   - Update GameplayScene layout constants for ad space
   - Deliverable: AdIntegrationSpec.md

6. **Expand Story Beats** (5 hours)
   - Break 8 beats into 120 land sub-beats
   - Deliverable: ExpandedStoryBeats.md

7. **Create First 5 Lands Content** (8 hours with national-language-designer agent)
   - Word chains with linguistic flavor for Lands 1-5
   - NPC dialogue (intro, outro, level moments)
   - Deliverable: Land1Content.md through Land5Content.md

8. **Create Visual Design System** (6 hours)
   - 5 color palettes (one per land)
   - Background themes, Ruut skin assignments
   - Deliverable: VisualDesignSystem_Lands1-5.md

9. **Create NPC Roster** (3 hours with national-language-designer agent)
   - 5-10 character profiles for Lands 1-5
   - Personality traits, dialogue examples
   - Deliverable: NPCRoster_Lands1-5.md

### Sprint Execution (After Prerequisites Complete)

10. **Execute Multi-Agent Sprint** (5 hours)
    - Follow WORDRUN-AI-DEVELOPMENT-PLAN.md timeline
    - Human reviews at Hour 1, 2, 4, 5 checkpoints
    - Deliverable: 5 polished levels (or 25 if 1-land scope)

---

## DOCUMENT METADATA

**Version**: 0.0.09 (Post-Audit)
**Purpose**: Agent-ready context for MVP production
**Prerequisites**: 6 documents (INCOMPLETE)
**Sprint Readiness**: NOT READY (prerequisites missing)
**Blockers**: LandDistributionMatrix.md, ExpandedStoryBeats.md, Land1-5Content.md, AdIntegrationSpec.md, VisualDesignSystem_Lands1-5.md, NPCRoster_Lands1-5.md
**Estimated Time to Ready**: 29 hours (can parallelize)
**Related Documents**: WORDRUN-AI-DEVELOPMENT-PLAN.md, PROJECT_AUDIT_EXECUTIVE_SUMMARY.md, CLAUDE.md
**Next Review**: After Land Distribution Matrix creation
