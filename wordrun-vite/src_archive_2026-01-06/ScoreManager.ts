/* =================================================================
   FILE: src/ScoreManager.ts
   PURPOSE: Unified scoring system with bonuses and multipliers
   ================================================================= */

export interface ScoreBreakdown {
  basePoints: number;
  bonusPoints: number;
  penaltyPoints: number;
  speedMultiplier: number;
  accuracyBonus: number;
  streakBonus: number;
  finalScore: number;
}

export interface Submission {
  word: string;
  correct: boolean;
  timeMs: number;
  hintsUsed: number;
}

export class ScoreManager {
  private submissions: Submission[] = [];
  private currentStreak: number = 0;
  private maxStreak: number = 0;
  private hintsUsed: number = 0;
  private skipsUsed: number = 0;
  private lockdownTax: number = 0;
  private pressureBonus: number = 0;
  private speedComboActive: boolean = false;
  private precisionStreak: number = 0;

  reset() {
    this.submissions = [];
    this.currentStreak = 0;
    this.maxStreak = 0;
    this.hintsUsed = 0;
    this.skipsUsed = 0;
    this.lockdownTax = 0;
    this.pressureBonus = 0;
    this.speedComboActive = false;
    this.precisionStreak = 0;
  }

  addSubmission(word: string, correct: boolean, timeMs: number, hintsUsedForWord: number = 0) {
    this.submissions.push({
      word,
      correct,
      timeMs,
      hintsUsed: hintsUsedForWord
    });

    if (correct) {
      this.currentStreak++;
      this.maxStreak = Math.max(this.maxStreak, this.currentStreak);
      this.precisionStreak++;
      
      // Check for speed combo (3+ correct submissions ≤5s each)
      if (this.submissions.length >= 3) {
        const last3 = this.submissions.slice(-3);
        const allCorrect = last3.every(s => s.correct);
        const allFast = last3.every(s => s.timeMs <= 5000);
        this.speedComboActive = allCorrect && allFast;
      }
    } else {
      this.currentStreak = 0;
      this.precisionStreak = 0;
      this.speedComboActive = false;
    }

    this.hintsUsed += hintsUsedForWord;
  }

  addSkip() {
    this.skipsUsed++;
  }

  addLockdownTax(lockedCount: number) {
    this.lockdownTax += 25 * lockedCount;
  }

  addPressureBonus(correctAfterLockdown: number) {
    this.pressureBonus += 15 * correctAfterLockdown;
  }

  triggerVoidBreak() {
    this.currentStreak = 0;
    this.speedComboActive = false;
    // Reset multipliers without additional penalty
  }

  calculateScore(): ScoreBreakdown {
    // Base scoring
    let basePoints = 0;
    let penaltyPoints = 0;

    for (const sub of this.submissions) {
      if (sub.correct) {
        basePoints += 100;
      } else {
        penaltyPoints += 50;
      }
      penaltyPoints += sub.hintsUsed * 25; // 25 per hint letter
    }

    penaltyPoints += this.skipsUsed * 100; // 100 per skip
    penaltyPoints += this.lockdownTax;

    // Bonus points
    let bonusPoints = this.pressureBonus;

    // Precision Streak bonus
    if (this.precisionStreak >= 10) {
      bonusPoints += 500;
    }

    // Chain Reaction bonus (auto-solve next 2 words)
    const recentCorrect = this.submissions.slice(-5).filter(s => s.correct);
    if (recentCorrect.length === 5) {
      const avgTime = recentCorrect.reduce((sum, s) => sum + s.timeMs, 0) / 5;
      if (avgTime <= 8000) {
        bonusPoints += 200; // Chain reaction bonus
      }
    }

    // Speed multiplier
    const correctSubmissions = this.submissions.filter(s => s.correct);
    let speedMultiplier = 1.0;
    if (correctSubmissions.length > 0) {
      const avgTime = correctSubmissions.reduce((sum, s) => sum + s.timeMs, 0) / correctSubmissions.length;
      if (avgTime <= 2000) speedMultiplier = 2.0;
      else if (avgTime <= 3000) speedMultiplier = 1.5;
      else if (avgTime <= 5000) speedMultiplier = 1.2;
    }

    // Speed combo multiplier
    if (this.speedComboActive) {
      speedMultiplier *= 1.5;
    }

    // Accuracy bonus
    const totalSubmissions = this.submissions.length;
    const correctCount = this.submissions.filter(s => s.correct).length;
    const accuracy = totalSubmissions > 0 ? (correctCount / totalSubmissions) * 100 : 0;
    
    let accuracyBonus = 0;
    if (accuracy >= 95) accuracyBonus = 0.15;
    else if (accuracy >= 90) accuracyBonus = 0.10;
    else if (accuracy >= 85) accuracyBonus = 0.05;

    // Streak bonus
    let streakBonus = 0;
    if (this.maxStreak >= 10) streakBonus = 300;
    else if (this.maxStreak >= 7) streakBonus = 150;
    else if (this.maxStreak >= 5) streakBonus = 60;

    // Final calculation
    const subtotal = (basePoints + bonusPoints - penaltyPoints) * speedMultiplier;
    const withAccuracy = subtotal * (1 + accuracyBonus);
    const finalScore = Math.max(0, Math.round(withAccuracy + streakBonus));

    return {
      basePoints,
      bonusPoints,
      penaltyPoints,
      speedMultiplier,
      accuracyBonus,
      streakBonus,
      finalScore
    };
  }

  getCurrentStreak(): number {
    return this.currentStreak;
  }

  getMaxStreak(): number {
    return this.maxStreak;
  }

  isSpeedComboActive(): boolean {
    return this.speedComboActive;
  }

  getPrecisionStreak(): number {
    return this.precisionStreak;
  }

  getAccuracy(): number {
    const total = this.submissions.length;
    if (total === 0) return 100;
    const correct = this.submissions.filter(s => s.correct).length;
    return Math.round((correct / total) * 100);
  }

  getAverageTime(): number {
    const correctSubmissions = this.submissions.filter(s => s.correct);
    if (correctSubmissions.length === 0) return 0;
    return Math.round(correctSubmissions.reduce((sum, s) => sum + s.timeMs, 0) / correctSubmissions.length);
  }
}