export type HintSystemOptions = {
  hintButton: HTMLButtonElement;
  hintBadge: HTMLSpanElement;
  hintText: HTMLSpanElement;
  modalOverlay: HTMLDivElement;
  modalCloseButton: HTMLButtonElement;
  modalNoThanksButton: HTMLButtonElement;
  modalPlayButton: HTMLElement;
  cooldownText: HTMLDivElement;
  cooldownMs: number;
  initialHintCount: number;
  onRequestHint: () => string | null;
  onAfterUse?: () => void;
  onAfterModalClose?: () => void;
  onWatchAd?: () => void;
};

export class HintSystem {
  private hintButton: HTMLButtonElement;
  private hintBadge: HTMLSpanElement;
  private hintText: HTMLSpanElement;
  private modalOverlay: HTMLDivElement;
  private modalCloseButton: HTMLButtonElement;
  private modalNoThanksButton: HTMLButtonElement;
  private modalPlayButton: HTMLElement;
  private cooldownText: HTMLDivElement;
  private cooldownMs: number;
  private onRequestHint: () => string | null;
  private onAfterUse?: () => void;
  private onAfterModalClose?: () => void;
  private onWatchAd?: () => void;

  private hintCount: number;
  private hintNextAt: number | null = null;
  private cooldownTimer?: number;

  // Public API: manages hint UI, modal, and cooldown timers.
  constructor(options: HintSystemOptions) {
    this.hintButton = options.hintButton;
    this.hintBadge = options.hintBadge;
    this.hintText = options.hintText;
    this.modalOverlay = options.modalOverlay;
    this.modalCloseButton = options.modalCloseButton;
    this.modalNoThanksButton = options.modalNoThanksButton;
    this.modalPlayButton = options.modalPlayButton;
    this.cooldownText = options.cooldownText;
    this.cooldownMs = options.cooldownMs;
    this.onRequestHint = options.onRequestHint;
    this.onAfterUse = options.onAfterUse;
    this.onAfterModalClose = options.onAfterModalClose;
    this.onWatchAd = options.onWatchAd;
    this.hintCount = options.initialHintCount;

    this.hintButton.onclick = () => this.useHint();
    this.modalCloseButton.onclick = () => this.closeModal();
    this.modalNoThanksButton.onclick = () => this.closeModal();
    this.modalPlayButton.onclick = () => {
      this.closeModal();
      this.onWatchAd?.();
    };
    this.modalOverlay.onclick = (ev) => {
      if (ev.target === this.modalOverlay) this.closeModal();
    };

    this.updateUI();
  }

  useHint(): void {
    if (this.hintCount > 0) {
      const clue = this.onRequestHint();
      if (!clue) return;
      this.hintText.textContent = clue;
      this.hintCount -= 1;
      if (this.hintCount === 0) {
        this.hintNextAt = Date.now() + this.cooldownMs;
      }
      this.updateUI();
      this.onAfterUse?.();
      return;
    }

    this.openModal();
  }

  openModal(): void {
    this.modalOverlay.style.display = 'flex';
    this.modalOverlay.classList.add('show');
    this.modalOverlay.setAttribute('aria-hidden', 'false');

    if (!this.hintNextAt) this.hintNextAt = Date.now() + this.cooldownMs;
    clearInterval(this.cooldownTimer);
    this.cooldownTimer = window.setInterval(() => {
      const rem = (this.hintNextAt ?? 0) - Date.now();
      this.cooldownText.textContent = rem > 0 ? `${this.formatMs(rem)} till next hint` : 'Hint ready';
      if (rem <= 0) clearInterval(this.cooldownTimer);
    }, 1000);
  }

  closeModal(): void {
    this.modalOverlay.classList.remove('show');
    this.modalOverlay.setAttribute('aria-hidden', 'true');
    this.modalOverlay.style.display = 'none';
    clearInterval(this.cooldownTimer);
    this.cooldownTimer = undefined;
    this.onAfterModalClose?.();
  }

  setHintCount(count: number): void {
    this.hintCount = Math.max(0, count);
    this.updateUI();
  }

  clearHintText(): void {
    this.hintText.textContent = '';
  }

  reset(count = this.hintCount): void {
    this.hintCount = count;
    this.hintNextAt = null;
    clearInterval(this.cooldownTimer);
    this.cooldownTimer = undefined;
    this.hintText.textContent = '';
    this.updateUI();
  }

  shutdown(): void {
    this.hintButton.onclick = null;
    this.modalCloseButton.onclick = null;
    this.modalNoThanksButton.onclick = null;
    this.modalPlayButton.onclick = null;
    this.modalOverlay.onclick = null;
    clearInterval(this.cooldownTimer);
    this.cooldownTimer = undefined;
  }

  private updateUI(): void {
    if (this.hintCount > 0) {
      this.hintBadge.style.display = 'inline-flex';
      this.hintBadge.textContent = String(this.hintCount);
    } else {
      this.hintBadge.style.display = 'none';
    }
  }

  private formatMs(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }
}
