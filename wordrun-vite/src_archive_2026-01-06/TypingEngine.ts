/* =================================================================
   FILE: src/TypingEngine.ts
   PURPOSE: Core typing logic with command parsing and typo forgiveness
   ================================================================= */

export interface TypingResult {
  type: 'word' | 'command' | 'invalid';
  content: string;
  isCorrect?: boolean;
  suggestion?: string;
}

export class TypingEngine {
  private currentWord: string = '';
  private targetWord: string = '';
  private allowTypoForgiveness: boolean = true;
  private typoWindow: number = 2000; // 2 seconds
  private lastInputTime: number = 0;

  setTarget(word: string) {
    this.targetWord = word.toLowerCase().trim();
  }

  // Calculate Levenshtein distance for typo forgiveness
  private levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const substitution = matrix[j - 1][i - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i] + 1, // deletion
          substitution // substitution
        );
      }
    }

    return matrix[b.length][a.length];
  }

  // Check if input qualifies for typo forgiveness
  private isTypoForgiveness(input: string, target: string, timeElapsed: number): boolean {
    if (!this.allowTypoForgiveness) return false;
    if (target.length < 4) return false; // Only for words length ≥4
    if (timeElapsed > this.typoWindow) return false; // Within 2 seconds
    
    const distance = this.levenshteinDistance(input, target);
    return distance === 1; // Exactly 1 character difference
  }

  processInput(input: string): TypingResult {
    const now = Date.now();
    const trimmed = input.trim();
    this.lastInputTime = now;

    // Check for commands
    if (trimmed.startsWith('?')) {
      return { type: 'command', content: 'hint' };
    }
    if (trimmed === '/skip') {
      return { type: 'command', content: 'skip' };
    }
    if (trimmed === '!surge') {
      return { type: 'command', content: 'surge' };
    }
    if (trimmed === '!freeze') {
      return { type: 'command', content: 'freeze' };
    }
    if (trimmed === '!clean') {
      return { type: 'command', content: 'clean' };
    }
    if (trimmed === '!undo') {
      return { type: 'command', content: 'undo' };
    }

    // Process as word
    const inputLower = trimmed.toLowerCase();
    const timeElapsed = now - this.lastInputTime;

    // Exact match
    if (inputLower === this.targetWord) {
      return { type: 'word', content: trimmed, isCorrect: true };
    }

    // Typo forgiveness check
    if (this.isTypoForgiveness(inputLower, this.targetWord, timeElapsed)) {
      return { 
        type: 'word', 
        content: trimmed, 
        isCorrect: true, 
        suggestion: this.targetWord 
      };
    }

    // Incorrect
    return { type: 'word', content: trimmed, isCorrect: false };
  }

  reset() {
    this.currentWord = '';
    this.targetWord = '';
    this.lastInputTime = Date.now();
  }
}