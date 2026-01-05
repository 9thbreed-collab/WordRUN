/**
 * Applies wheel submission rules:
 * - Valid words are accepted (no penalty).
 * - Wrong words are penalized.
 * - If only 2 letters selected but the puzzle's targets are all length > 2
 *   AND "forgiveShortTwoLetter" is true, do not penalize (gentle shake only).
 */
export interface RuleConfig {
  forgiveShortTwoLetter: boolean
  minWordLen: number  // typically 2
}

export function evaluateWheelSubmission(
  pathLetters: string[],
  validWords: Set<string>,
  anyTargetStartsWith: (prefix: string) => boolean,
  cfg: RuleConfig
): { ok: boolean; penalize: boolean; reason: string } {
  const guess = pathLetters.join('').toLowerCase()
  const len = pathLetters.length
  if (validWords.has(guess)) {
    return { ok:true, penalize:false, reason:'valid' }
  }

  // If player picked exactly 2 letters:
  if (len === 2 && cfg.forgiveShortTwoLetter) {
    // Forgive if any target word starts with those 2 letters (player is exploring a longer word)
    if (anyTargetStartsWith(guess)) return { ok:false, penalize:false, reason:'forgiven_2_prefix' }
  }

  // Below minimum length? Penalize only if there are valid words of that length in the puzzle.
  if (len < cfg.minWordLen) {
    return { ok:false, penalize:false, reason:'too_short' }
  }

  // Otherwise wrong guess → penalize
  return { ok:false, penalize:true, reason:'wrong' }
}