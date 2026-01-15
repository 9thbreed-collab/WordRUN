# WordRun Gameplay Scene Specification v1
**Build Target:** First Working Prototype with Emotional Design
**Visual Reference:** GameplayInspo/S1.jpg (cat character position = Ruut position)
**Design Base:** Option A (Conservative Balance) from WR_UI_C_D1-D4_options.md

---

## 1. VIEWPORT & CANVAS

```
Width: 390px
Height: 844px
Background: Dark theme (#0e0e12) OR themed background per land
Orientation: Portrait (mobile-first)
Scale Mode: FIT with CENTER_BOTH
```

---

## 2. LAYOUT SPECIFICATION (Match S1.jpg Structure)

### Top Bar (y: 0-60px)
| Element | Position | Size | Content |
|---------|----------|------|---------|
| Settings Gear | top-left (20, 20) | 40x40px | Gear icon, opens settings |
| Level Indicator | left of center (80, 20) | auto | "Lv: {levelNumber}" |
| Currency Display | top-right (310, 20) | auto | Coin icon + amount |
| Power-up Counter | top-right (350, 50) | 50x30px | Icon + count |

### Word Grid Area (y: 80-450px)
| Element | Position | Size | Content |
|---------|----------|------|---------|
| Word Container | centered | 340x370px | Cream/light background (#F5F5DC) |
| Word Rungs | inside container | 11 rows | Completed words show in pink tiles (#FFB6C1) |
| Current Word | highlighted row | full width | Active word being typed |

### Combo Display (y: 450-500px)
| Element | Position | Size | Content |
|---------|----------|------|---------|
| Combo Text | centered | auto | "COMBO X {multiplier}" in orange gradient |
| Combo Badge | right of text | 30x30px | "Aa" badge (optional) |

### Input Area (y: 500-700px)
| Element | Position | Size | Content |
|---------|----------|------|---------|
| Input Field | centered | 300x60px | Text input for typing words |
| Submit Button | right of input | 60x60px | Checkmark or arrow icon |

### Bottom Bar (y: 700-810px)
| Element | Position | Size | Content |
|---------|----------|------|---------|
| Shuffle/Skip Button | left (40, 740) | 50x50px | Shuffle icon |
| **RUUT CHARACTER** | **bottom-left (20, 680)** | **100x100px** | **Animated character** |
| Hint Button | right (340, 740) | 50x50px | Lightbulb + cost |
| Bonus Words | bottom-right (320, 790) | auto | "BONUS Words 0/5" |

### Safe Zones
- Top: 44px (notch avoidance)
- Bottom: 34px (home indicator avoidance)

---

## 3. RUUT CHARACTER SPECIFICATION

**Position:** Bottom-left corner, similar to cat in S1.jpg
**Size:** 100x100px
**Anchor:** Bottom-left of sprite at (20, 780)

### Animation States & Triggers

| State | Asset | Trigger Condition |
|-------|-------|-------------------|
| **Level Start** | `Wave.mov` | Play once when level loads |
| **Idle** | `3DFrontFacingModelAPose.png` | Default state, loops/static |
| **Happy (Streak)** | `Hurray!.mov` | Every 2-3 correct answers in a row |
| **Happy (Recovery)** | `BarelyMadeIt.mov` | First correct answer after 2+ wrong answers |
| **Sad** | `Sad.mov` | First wrong answer after a streak of correct |
| **Level Complete** | `LevelCompleteHappyDance.mov` | When all 11 words completed |

### Animation Logic (Pseudocode)
```
correctStreak = 0
wrongStreak = 0

onCorrectAnswer():
    correctStreak++
    if wrongStreak >= 2:
        play("BarelyMadeIt.mov")  // Recovery celebration
        wrongStreak = 0
    else if correctStreak % 3 == 0:  // Every 3rd correct
        play("Hurray!.mov")
    else:
        // Stay idle or small reaction
    wrongStreak = 0

onWrongAnswer():
    if correctStreak >= 2:
        play("Sad.mov")  // Lost a streak
    wrongStreak++
    correctStreak = 0

onLevelStart():
    play("Wave.mov")
    then play("3DFrontFacingModelAPose.png")  // Return to idle

onLevelComplete():
    play("LevelCompleteHappyDance.mov")
```

---

## 4. WORD CHAIN DISPLAY

### Structure
- 11 word "rungs" displayed vertically
- Completed words: Pink tiles (#FFB6C1) with white text
- Current word: Highlighted/glowing border
- Upcoming words: Grayed out or hidden

### Word Rung Styling
```css
.word-rung {
    background: #FFB6C1;
    border-radius: 8px;
    padding: 8px 16px;
    margin: 4px 0;
    font-family: 'Nunito', sans-serif;
    font-size: 24px;
    font-weight: bold;
    color: white;
    text-transform: uppercase;
}

.word-rung.current {
    border: 3px solid #4CAF50;
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

.word-rung.locked {
    background: #ccc;
    color: #999;
}
```

---

## 5. COMBO SYSTEM VISUAL

### Display
- Text: "COMBO X {n}" where n = multiplier (1, 2, 3, etc.)
- Style: Orange gradient text with slight glow
- Position: Below word grid, above input

### Animation on Combo Increase
```
Duration: 250ms
Scale: 1.0 → 1.15 → 1.0
Easing: ease-out then ease-in
Color flash: Brief white overlay (100ms)
```

---

## 6. INPUT FIELD SPECIFICATION

### Default State
```css
.word-input {
    background: #fff;
    border: 3px solid #4CAF50;
    border-radius: 30px;
    padding: 12px 24px;
    font-size: 28px;
    text-align: center;
    width: 300px;
}
```

### Feedback States

**On Correct Word:**
```
Border: Flash green (#4CAF50) brighter for 200ms
Scale: 1.0 → 1.05 → 1.0 over 150ms
Clear input field
```

**On Wrong Word:**
```
Border: Flash red (#FF6B6B) for 300ms
Shake: 4px horizontal oscillation over 150ms
Keep text (don't clear)
```

**On Typo Forgiven:**
```
Border: Brief yellow (#FFD700) flash for 200ms
Subtle shake: 2px for 100ms
Auto-correct and proceed
```

---

## 7. ANIMATION TIMING (Emotional Design)

All feedback must feel instant. Target: <100ms to START animation, 150-300ms to COMPLETE.

| Event | Start Delay | Duration | Total |
|-------|-------------|----------|-------|
| Correct word scale | 0ms | 150ms | 150ms |
| Wrong word shake | 0ms | 150ms | 150ms |
| Combo text pop | 0ms | 250ms | 250ms |
| Ruut animation | 0ms | 500-1000ms | varies |
| Word rung fade-in | 50ms | 200ms | 250ms |

---

## 8. AUDIO TRIGGERS (Placeholders)

| Event | Sound | Duration |
|-------|-------|----------|
| Correct word | Crisp "pop" or "click" | ~100ms |
| Wrong word | Soft "thud" or "buzz" | ~150ms |
| Combo increase | Rising chime | ~200ms |
| Level complete | Celebration fanfare | ~2000ms |

---

## 9. GAME FLOW

```
1. LEVEL START
   - Show level number
   - Ruut plays Wave.mov
   - Display first word target (word 1 of 11)
   - Input field focused

2. GAMEPLAY LOOP (repeat 11 times)
   - Player types word
   - On submit:
     - Validate word
     - If correct:
       - Mark rung complete
       - Update combo
       - Trigger Ruut reaction (if applicable)
       - Move to next word
     - If wrong:
       - Show error feedback
       - Trigger Ruut sad (if streak broken)
       - Keep on same word

3. LEVEL COMPLETE
   - All 11 words done
   - Ruut plays LevelCompleteHappyDance.mov
   - Show results overlay
   - Transition to next level or map
```

---

## 10. FILE STRUCTURE FOR BUILD

```
/wordrun-gameplay/
├── index.html
├── styles.css
├── game.js
├── assets/
│   ├── ruut/
│   │   ├── Wave.mov
│   │   ├── 3DFrontFacingModelAPose.png
│   │   ├── Hurray!.mov
│   │   ├── BarelyMadeIt.mov
│   │   ├── Sad.mov
│   │   └── LevelCompleteHappyDance.mov
│   ├── audio/
│   │   ├── correct.mp3
│   │   ├── wrong.mp3
│   │   ├── combo.mp3
│   │   └── complete.mp3
│   └── ui/
│       ├── settings.svg
│       ├── hint.svg
│       └── shuffle.svg
└── data/
    └── level1.json  (word chain data)
```

---

## 11. SAMPLE LEVEL DATA

```json
{
  "level": 1,
  "land": "Aethelgard",
  "words": [
    "CAR", "DOOR", "STOP", "SIGN", "UP",
    "START", "BUTTON", "NOSE", "RING", "BELL", "TOWER"
  ],
  "bonusWords": ["AUTO", "HALT", "CHIME"],
  "timeLimit": null,
  "starChallenges": {
    "time": 60,
    "accuracy": 90,
    "combo": 3
  }
}
```

---

## 12. SUCCESS CRITERIA

The build is successful when:
- [ ] Layout matches S1.jpg structure (character bottom-left, word grid center, input bottom)
- [ ] Ruut displays and plays idle animation
- [ ] Typing a correct word advances the chain
- [ ] Typing a wrong word shows error feedback
- [ ] Ruut reacts appropriately (happy on streaks, sad on streak break)
- [ ] Combo counter increments and animates
- [ ] Level completes after 11 words
- [ ] All animations feel responsive (<100ms start)

---

**This spec is the SINGLE SOURCE OF TRUTH for the first build.**
**Do not deviate. Build exactly this.**
