/* =================================================================
   FILE: src/GameModes.ts
   PURPOSE: Different game modes (Story, Hidden Letter, Scrabble, Multiplayer)
   ================================================================= */

export type GameMode = 'story' | 'hidden' | 'scrabble' | 'versus' | 'teams' | 'coop';

export interface GameModeConfig {
  mode: GameMode;
  timeMultiplier: number;
  scoreMultiplier: number;
  specialRules: string[];
}

export interface HiddenLetterState {
  revealedLetters: boolean[];
  guessedCorrectly: boolean;
  wrongGuesses: number;
  maxWrongGuesses: number;
  firstTenSecondsBonus: boolean;
}

export interface ScrambleState {
  scrambledLetters: string[];
  originalWord: string;
  solved: boolean;
}

export interface MultiplayerState {
  playerId: string;
  opponentId?: string;
  teamId?: string;
  currentTurn?: string;
  sharedProgress?: number;
  timeRemaining?: number;
  strikes?: number;
  maxStrikes?: number;
}

export class GameModeManager {
  private currentMode: GameMode = 'story';
  private config: GameModeConfig;
  private hiddenState?: HiddenLetterState;
  private scrambleState?: ScrambleState;
  private multiplayerState?: MultiplayerState;

  constructor(mode: GameMode = 'story') {
    this.currentMode = mode;
    this.config = this.getModeConfig(mode);
  }

  private getModeConfig(mode: GameMode): GameModeConfig {
    switch (mode) {
      case 'story':
        return {
          mode: 'story',
          timeMultiplier: 1.0,
          scoreMultiplier: 1.0,
          specialRules: ['progression', 'lives', 'penalty_box']
        };
      
      case 'hidden':
        return {
          mode: 'hidden',
          timeMultiplier: 1.5,
          scoreMultiplier: 1.2,
          specialRules: ['letter_reveal', 'first_10s_bonus', 'randomize_after_4_wrong']
        };
      
      case 'scrabble':
        return {
          mode: 'scrabble',
          timeMultiplier: 1.3,
          scoreMultiplier: 1.1,
          specialRules: ['letter_scramble', 'unscramble_to_solve']
        };
      
      case 'versus':
        return {
          mode: 'versus',
          timeMultiplier: 0.8,
          scoreMultiplier: 1.5,
          specialRules: ['simultaneous_typing', 'first_correct_wins']
        };
      
      case 'teams':
        return {
          mode: 'teams',
          timeMultiplier: 1.0,
          scoreMultiplier: 1.3,
          specialRules: ['shared_chain', '10s_per_turn', 'shared_bonuses']
        };
      
      case 'coop':
        return {
          mode: 'coop',
          timeMultiplier: 0.9,
          scoreMultiplier: 1.4,
          specialRules: ['group_completion', 'shared_strikes', 'shared_lockdown']
        };
      
      default:
        return this.getModeConfig('story');
    }
  }

  setMode(mode: GameMode) {
    this.currentMode = mode;
    this.config = this.getModeConfig(mode);
    this.resetModeState();
  }

  private resetModeState() {
    this.hiddenState = undefined;
    this.scrambleState = undefined;
    this.multiplayerState = undefined;

    // Initialize mode-specific state
    switch (this.currentMode) {
      case 'hidden':
        this.initHiddenLetterMode();
        break;
      case 'scrabble':
        this.initScrambleMode();
        break;
      case 'versus':
      case 'teams':
      case 'coop':
        this.initMultiplayerMode();
        break;
    }
  }

  private initHiddenLetterMode() {
    this.hiddenState = {
      revealedLetters: [],
      guessedCorrectly: false,
      wrongGuesses: 0,
      maxWrongGuesses: 4,
      firstTenSecondsBonus: true
    };
  }

  private initScrambleMode() {
    this.scrambleState = {
      scrambledLetters: [],
      originalWord: '',
      solved: false
    };
  }

  private initMultiplayerMode() {
    this.multiplayerState = {
      playerId: 'player1', // Would be generated/assigned
      strikes: 0,
      maxStrikes: 3
    };
  }

  // Hidden Letter Mode Methods
  initHiddenWord(word: string): HiddenLetterState {
    if (this.currentMode !== 'hidden') {
      throw new Error('Not in hidden letter mode');
    }

    this.hiddenState = {
      revealedLetters: new Array(word.length).fill(false),
      guessedCorrectly: false,
      wrongGuesses: 0,
      maxWrongGuesses: 4,
      firstTenSecondsBonus: true
    };

    return this.hiddenState;
  }

  revealLetter(word: string, position: number): boolean {
    if (!this.hiddenState || this.currentMode !== 'hidden') return false;

    if (position >= 0 && position < word.length) {
      this.hiddenState.revealedLetters[position] = true;
      return true;
    }
    return false;
  }

  guessHiddenWord(word: string, guess: string, timeElapsed: number): { correct: boolean, bonus: boolean } {
    if (!this.hiddenState || this.currentMode !== 'hidden') {
      return { correct: false, bonus: false };
    }

    const correct = word.toLowerCase() === guess.toLowerCase();
    const bonus = correct && timeElapsed <= 10000 && this.hiddenState.firstTenSecondsBonus;

    if (correct) {
      this.hiddenState.guessedCorrectly = true;
    } else {
      this.hiddenState.wrongGuesses++;
      
      // Randomize after 4 wrong guesses
      if (this.hiddenState.wrongGuesses >= this.hiddenState.maxWrongGuesses) {
        // Signal that puzzle should be randomized
        return { correct: false, bonus: false };
      }
    }

    if (timeElapsed > 10000) {
      this.hiddenState.firstTenSecondsBonus = false;
    }

    return { correct, bonus };
  }

  // Scrabble Mode Methods
  initScrambledWord(word: string): string[] {
    if (this.currentMode !== 'scrabble') {
      throw new Error('Not in scrabble mode');
    }

    const letters = word.split('');
    // Fisher-Yates shuffle
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }

    this.scrambleState = {
      scrambledLetters: letters,
      originalWord: word,
      solved: false
    };

    return letters;
  }

  unscrambleGuess(guess: string): boolean {
    if (!this.scrambleState || this.currentMode !== 'scrabble') return false;

    const correct = this.scrambleState.originalWord.toLowerCase() === guess.toLowerCase();
    if (correct) {
      this.scrambleState.solved = true;
    }

    return correct;
  }

  // Multiplayer Mode Methods
  initMultiplayer(playerId: string, config: Partial<MultiplayerState> = {}) {
    if (!['versus', 'teams', 'coop'].includes(this.currentMode)) {
      throw new Error('Not in multiplayer mode');
    }

    this.multiplayerState = {
      playerId,
      strikes: 0,
      maxStrikes: 3,
      ...config
    };
  }

  updateMultiplayerState(updates: Partial<MultiplayerState>) {
    if (this.multiplayerState) {
      Object.assign(this.multiplayerState, updates);
    }
  }

  // Getters
  getCurrentMode(): GameMode {
    return this.currentMode;
  }

  getConfig(): GameModeConfig {
    return this.config;
  }

  getHiddenState(): HiddenLetterState | undefined {
    return this.hiddenState;
  }

  getScrambleState(): ScrambleState | undefined {
    return this.scrambleState;
  }

  getMultiplayerState(): MultiplayerState | undefined {
    return this.multiplayerState;
  }

  // Check if word should be randomized in hidden mode
  shouldRandomizeHidden(): boolean {
    return this.hiddenState?.wrongGuesses >= this.hiddenState?.maxWrongGuesses;
  }

  // Calculate mode-specific score multiplier
  getScoreMultiplier(): number {
    let multiplier = this.config.scoreMultiplier;

    // Add mode-specific bonuses
    if (this.currentMode === 'hidden' && this.hiddenState?.firstTenSecondsBonus) {
      multiplier *= 2.0; // 2x bonus for first 10 seconds
    }

    return multiplier;
  }

  // Calculate mode-specific time limit
  calculateTimeLimit(baseTime: number): number {
    return Math.round(baseTime * this.config.timeMultiplier);
  }
}