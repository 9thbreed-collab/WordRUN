type ComboBarConfig = {
  comboEl: HTMLDivElement;
  comboFillEl: HTMLDivElement;
  min?: number;
  max?: number;
  t1?: number;
  t2?: number;
  t3?: number;
  drainT1?: number;
  drainT2?: number;
  drainT3?: number;
};

const DEFAULT_MIN = 0.01;
const DEFAULT_MAX = 1.0;
const DEFAULT_T1 = 0.4;
const DEFAULT_T2 = 0.65;
const DEFAULT_T3 = 0.8;
const DEFAULT_DRAIN_T1 = 3;
const DEFAULT_DRAIN_T2 = 5;
const DEFAULT_DRAIN_T3 = 7;

export class ComboBar {
  private comboEl: HTMLDivElement;
  private comboFillEl: HTMLDivElement;
  private min: number;
  private max: number;
  private t1: number;
  private t2: number;
  private t3: number;
  private drainT1: number;
  private drainT2: number;
  private drainT3: number;

  private value: number = DEFAULT_MIN;
  private comboLockedUntil = 0;
  private lastUpdateMs: number;

  // Public API: manage combo value + visuals + drain behavior.
  constructor(config: ComboBarConfig) {
    this.comboEl = config.comboEl;
    this.comboFillEl = config.comboFillEl;
    this.min = config.min ?? DEFAULT_MIN;
    this.max = config.max ?? DEFAULT_MAX;
    this.t1 = config.t1 ?? DEFAULT_T1;
    this.t2 = config.t2 ?? DEFAULT_T2;
    this.t3 = config.t3 ?? DEFAULT_T3;
    this.drainT1 = config.drainT1 ?? DEFAULT_DRAIN_T1;
    this.drainT2 = config.drainT2 ?? DEFAULT_DRAIN_T2;
    this.drainT3 = config.drainT3 ?? DEFAULT_DRAIN_T3;
    this.lastUpdateMs = performance.now();
  }

  getValue(): number {
    return this.value;
  }

  setValue(value: number, persist = true): void {
    this.value = Math.max(this.min, Math.min(this.max, value));
    this.updateComboVisuals(persist);
  }

  gain(amount = 0.35): number {
    const next = Math.min(this.max, this.value + amount);
    this.value = next;
    this.updateComboVisuals(true);
    return this.value;
  }

  getTier(value = this.value): number {
    if (value >= this.t3) return 3;
    if (value >= this.t2) return 2;
    if (value >= this.t1) return 1;
    return 0;
  }

  getTierThresholds(): { t1: number; t2: number; t3: number } {
    return { t1: this.t1, t2: this.t2, t3: this.t3 };
  }

  initializeFromPersisted(): void {
    const prevCombo = (window as any).__comboValue__ as number | undefined;
    const next = (typeof prevCombo === 'number' && prevCombo >= this.t1)
      ? Math.min(this.max, Math.max(prevCombo, this.min))
      : this.min;
    this.setValue(next, true);
    this.persist();
  }

  persist(): void {
    (window as any).__comboValue__ = this.value;
  }

  reset(): void {
    this.value = this.min;
    this.comboLockedUntil = 0;
    this.lastUpdateMs = performance.now();
    this.updateComboVisuals(true);
  }

  drainTick(now = performance.now()): void {
    const dt = (now - this.lastUpdateMs) / 1000;
    this.lastUpdateMs = now;

    const val = this.value;
    if (now < this.comboLockedUntil) {
      const remaining = (this.comboLockedUntil - now) / 1000;
      if (remaining > 0) {
        const toDrain = Math.max(0, val - this.min);
        const step = (toDrain / remaining) * dt;
        this.value = Math.max(this.min, val - step);
        this.updateComboVisuals(true);
      }
      return;
    }

    let rate = 0;
    if (val >= this.t3) rate = (val - this.min) / this.drainT3;
    else if (val >= this.t2) rate = (val - this.min) / this.drainT2;
    else if (val >= this.t1) rate = (val - this.min) / this.drainT1;
    else rate = (val - this.min) / 4;

    const newVal = Math.max(this.min, val - rate * dt);

    const prevTier = this.getTier(val);
    const nextTier = this.getTier(newVal);
    if (prevTier === 3 && nextTier < 3) this.comboLockedUntil = now + this.drainT3 * 1000;

    this.value = newVal;
    this.updateComboVisuals(true);
  }

  shutdown(): void {
    // No listeners to remove yet, keep API consistent.
  }

  private updateComboVisuals(persist: boolean): void {
    const pct = Math.max(this.min, Math.min(this.max, this.value)) * 100;
    this.comboFillEl.style.width = `${pct}%`;
    if (persist) this.persist();
  }
}
