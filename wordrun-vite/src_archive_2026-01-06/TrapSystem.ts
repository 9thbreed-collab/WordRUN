/* =================================================================
   FILE: src/TrapSystem.ts
   PURPOSE: Trap system including Lockdown Chain, Decoy, and Void Break
   ================================================================= */

export interface TrapState {
  lockdownActive: boolean;
  lockedIndices: Set<number>;
  decoyActive: boolean;
  decoyWords: string[];
  voidBreakTriggered: boolean;
}

export class TrapSystem {
  private state: TrapState;
  private onTrapTriggered?: (type: string, data?: any) => void;

  constructor(onTrapTriggered?: (type: string, data?: any) => void) {
    this.state = {
      lockdownActive: false,
      lockedIndices: new Set(),
      decoyActive: false,
      decoyWords: [],
      voidBreakTriggered: false
    };
    this.onTrapTriggered = onTrapTriggered;
  }

  reset() {
    this.state = {
      lockdownActive: false,
      lockedIndices: new Set(),
      decoyActive: false,
      decoyWords: [],
      voidBreakTriggered: false
    };
  }

  // Lockdown Chain Trap
  triggerLockdown(words: string[], currentIndex: number, lockCount: number): boolean {
    // Ensure at least 2 future unlocked words exist
    const futureIndices = Array.from({ length: words.length - currentIndex - 1 }, (_, i) => currentIndex + 1 + i);
    if (futureIndices.length - lockCount < 2) {
      return false; // Cannot trigger lockdown, not enough future words
    }

    // Randomly select indices to lock from future words
    const indicesToLock: number[] = [];
    const availableIndices = futureIndices.slice(); // copy array
    
    for (let i = 0; i < lockCount && availableIndices.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableIndices.length);
      const indexToLock = availableIndices.splice(randomIndex, 1)[0];
      indicesToLock.push(indexToLock);
    }

    this.state.lockdownActive = true;
    this.state.lockedIndices = new Set(indicesToLock);

    if (this.onTrapTriggered) {
      this.onTrapTriggered('lockdown', { 
        lockedIndices: indicesToLock,
        lockCount 
      });
    }

    return true;
  }

  // Decoy Trap
  triggerDecoy(targetWord: string, decoyWords: string[]) {
    this.state.decoyActive = true;
    this.state.decoyWords = decoyWords;

    if (this.onTrapTriggered) {
      this.onTrapTriggered('decoy', { 
        targetWord,
        decoyWords 
      });
    }
  }

  // Void Break Trap
  triggerVoidBreak() {
    this.state.voidBreakTriggered = true;

    if (this.onTrapTriggered) {
      this.onTrapTriggered('voidBreak', {});
    }
  }

  // Clean decoy trap
  cleanDecoy() {
    this.state.decoyActive = false;
    this.state.decoyWords = [];
  }

  // Check if a word index is locked
  isLocked(index: number): boolean {
    return this.state.lockedIndices.has(index);
  }

  // Get locked indices
  getLockedIndices(): number[] {
    return Array.from(this.state.lockedIndices);
  }

  // Check if decoy is active
  isDecoyActive(): boolean {
    return this.state.decoyActive;
  }

  // Get decoy words for autocomplete
  getDecoyWords(): string[] {
    return this.state.decoyWords;
  }

  // Check if word should trigger lockdown
  shouldTriggerLockdown(currentIndex: number, totalWords: number, level: number): boolean {
    if (this.state.lockdownActive) return false; // Already active
    
    // Probability increases with level
    const baseProbability = 0.1; // 10% base chance
    const levelMultiplier = Math.min(1.0, level * 0.05); // +5% per level, max 100%
    const probability = baseProbability + levelMultiplier;
    
    // Only trigger after a few words have been completed
    if (currentIndex < 2) return false;
    
    // Check if enough future words remain
    const remainingWords = totalWords - currentIndex - 1;
    if (remainingWords < 4) return false; // Need at least 4 remaining for minimum lockdown
    
    return Math.random() < probability;
  }

  // Check if word should trigger decoy
  shouldTriggerDecoy(currentIndex: number, hasDecoyData: boolean): boolean {
    if (this.state.decoyActive) return false; // Already active
    if (!hasDecoyData) return false; // No decoy data available
    
    // 20% chance to trigger decoy
    return Math.random() < 0.2;
  }

  // Check if word should trigger void break
  shouldTriggerVoidBreak(currentStreak: number): boolean {
    if (this.state.voidBreakTriggered) return false; // Already triggered this level
    if (currentStreak < 3) return false; // Only trigger on streaks
    
    // 15% chance when on a streak
    return Math.random() < 0.15;
  }

  // Calculate lockdown tax and pressure bonus
  calculateLockdownEffects(correctAfterLockdown: number): { tax: number, bonus: number } {
    const lockCount = this.state.lockedIndices.size;
    const tax = lockCount * 25; // -25 per locked word
    const bonus = correctAfterLockdown * 15; // +15 per correct word after lockdown
    
    return { tax, bonus };
  }

  // Auto-solve locked words at level completion
  autoSolveLockedWords(words: string[]): string[] {
    const solved: string[] = [];
    for (const index of this.state.lockedIndices) {
      if (index < words.length) {
        solved.push(words[index]);
      }
    }
    return solved;
  }

  getState(): TrapState {
    return { ...this.state };
  }
}