/* =================================================================
   FILE: src/PuzzleData.ts
   PURPOSE: Content loader and puzzle validation system
   ================================================================= */

export interface PuzzleData {
  land: number;
  level: number;
  base_length: number;
  words: string[];
  locked_indices?: number[];
  decoy_candidates?: { [word: string]: string[] };
  alt_chain_available?: boolean;
  alt_chain_length?: number;
  time_limit_seconds?: number;
}

export interface WordChainState {
  currentIndex: number;
  words: string[];
  lockedIndices: Set<number>;
  completedIndices: Set<number>;
  isComplete: boolean;
  wrongCount: number;
  startTime: number;
  submissions: Array<{
    word: string;
    correct: boolean;
    timeMs: number;
  }>;
}

export class PuzzleLoader {
  private static puzzleCache: Map<string, PuzzleData> = new Map();

  // Sample puzzle data - using the exact configurations provided
  private static samplePuzzles: PuzzleData[] = [
    {
      land: 1,
      level: 1,
      base_length: 11,
      words: ["car","door","stop","sign","up","start","button","nose","ring","bell","tower"],
      locked_indices: [],
      decoy_candidates: {
        "door": ["handle","hinge","entry"],
        "button": ["switch","toggle","key"],
        "ring": ["circle","loop","jewel"]
      },
      alt_chain_available: false,
      alt_chain_length: 0,
      time_limit_seconds: 0
    },
    {
      land: 1,
      level: 2,
      base_length: 11,
      words: ["train","station","master","key","lock","pick","pocket","change","rate","heart","beat"],
      locked_indices: [3,4],
      decoy_candidates: {
        "master": ["teacher","boss","owner"],
        "pick": ["choose","strum","guitar"],
        "pocket": ["wallet","pouch","jeans"],
        "rate": ["speed","price","score"],
        "beat": ["rhythm","defeat","drum"]
      },
      alt_chain_available: true,
      alt_chain_length: 25,
      time_limit_seconds: 0
    },
    {
      land: 1,
      level: 3,
      base_length: 11,
      words: ["moon","light","house","party","line","cook","book","club","soda","pop","quiz"],
      locked_indices: [],
      decoy_candidates: {
        "light": ["bright","lamp","bulb"],
        "party": ["celebration","group","side"],
        "line": ["queue","rope","bar"],
        "book": ["novel","reserve","text"]
      },
      alt_chain_available: false,
      alt_chain_length: 0,
      time_limit_seconds: 90
    }
  ];

  static async loadPuzzle(land: number, level: number): Promise<PuzzleData | null> {
    const key = `${land}-${level}`;
    
    // Check cache first
    if (this.puzzleCache.has(key)) {
      return this.puzzleCache.get(key)!;
    }

    // For demo, use sample puzzles
    const puzzle = this.samplePuzzles.find(p => p.land === land && p.level === level);
    if (puzzle) {
      this.puzzleCache.set(key, puzzle);
      return puzzle;
    }

    // Generate procedural puzzle if not found
    const generated = this.generatePuzzle(land, level);
    this.puzzleCache.set(key, generated);
    return generated;
  }

  private static generatePuzzle(land: number, level: number): PuzzleData {
    // Simple procedural generation for demo
    const wordSets = [
      ["sun", "light", "house", "boat", "ride", "share", "hold", "fast", "food", "chain", "link"],
      ["tree", "top", "hat", "trick", "shot", "gun", "powder", "snow", "ball", "park", "bench"],
      ["rock", "paper", "cut", "out", "side", "walk", "talk", "show", "time", "bomb", "shell"],
      ["wind", "mill", "stone", "cold", "war", "ship", "yard", "stick", "note", "book", "case"],
      ["star", "fish", "bone", "dry", "ice", "cream", "dream", "land", "mark", "time", "clock"]
    ];

    const words = wordSets[(land + level - 1) % wordSets.length];
    
    // Randomly add some locked indices for higher levels
    const lockedIndices: number[] = [];
    if (level > 2) {
      const lockCount = Math.min(3, Math.floor(level / 3));
      for (let i = 0; i < lockCount; i++) {
        const index = Math.floor(Math.random() * words.length);
        if (!lockedIndices.includes(index)) {
          lockedIndices.push(index);
        }
      }
    }

    return {
      land,
      level,
      base_length: 11,
      words,
      locked_indices: lockedIndices,
      decoy_candidates: {},
      alt_chain_available: Math.random() > 0.6,
      alt_chain_length: 25,
      time_limit_seconds: level > 5 ? 120 + (level * 10) : 0
    };
  }

  static validatePuzzle(puzzle: PuzzleData): boolean {
    // Ensure unique forward solution
    if (puzzle.words.length < puzzle.base_length) return false;
    
    // Check that locked indices don't prevent completion
    const lockedSet = new Set(puzzle.locked_indices || []);
    let unlockedCount = 0;
    
    for (let i = 0; i < puzzle.words.length; i++) {
      if (!lockedSet.has(i)) {
        unlockedCount++;
      }
    }
    
    // Must have at least 2 unlocked words after any lockdown
    return unlockedCount >= 2;
  }

  static createWordChainState(puzzle: PuzzleData): WordChainState {
    return {
      currentIndex: 0,
      words: [...puzzle.words],
      lockedIndices: new Set(puzzle.locked_indices || []),
      completedIndices: new Set(),
      isComplete: false,
      wrongCount: 0,
      startTime: Date.now(),
      submissions: []
    };
  }
}