const POWERUP_ICONS: Record<string, string> = {
  lockKey: '🔑',
  bomb: '💣',
  hint: '💡',
};

export type PowerUpInventoryOptions = {
  powerBarEl: HTMLDivElement;
  overlayEl: HTMLDivElement;
  useButton: HTMLButtonElement;
  skipButton: HTMLButtonElement;
  onSlotClick: () => void;
  onConfirmUse: (lockedIndex: number) => void;
  onSkipUse: () => void;
};

export class PowerUpInventory {
  private powerSlots: HTMLDivElement[];
  private overlayEl: HTMLDivElement;
  private useButton: HTMLButtonElement;
  private skipButton: HTMLButtonElement;
  private onSlotClick: () => void;
  private onConfirmUse: (lockedIndex: number) => void;
  private onSkipUse: () => void;

  private lockKeyCount = 0;
  private pendingLockIndex: number | null = null;

  private boundOnSlotClick: () => void;
  private boundOnConfirm: () => void;
  private boundOnSkip: () => void;

  // Public API: render power bar + manage no-moves prompt.
  constructor(options: PowerUpInventoryOptions) {
    this.powerSlots = Array.from(
      options.powerBarEl.querySelectorAll<HTMLDivElement>('.powerSlot')
    );
    this.overlayEl = options.overlayEl;
    this.useButton = options.useButton;
    this.skipButton = options.skipButton;
    this.onSlotClick = options.onSlotClick;
    this.onConfirmUse = options.onConfirmUse;
    this.onSkipUse = options.onSkipUse;

    this.boundOnSlotClick = () => this.onSlotClick();
    this.boundOnConfirm = () => this.confirmUse();
    this.boundOnSkip = () => this.skipUse();

    this.attachHandlers();
  }

  setLockKeyCount(count: number): void {
    this.lockKeyCount = Math.max(0, count);
    this.render();
  }

  render(): void {
    if (!this.powerSlots || this.powerSlots.length === 0) return;

    const slotStates: { type: string | null; count: number }[] = [
      {
        type: this.lockKeyCount > 0 ? 'lockKey' : null,
        count: this.lockKeyCount,
      },
      { type: null, count: 0 },
      { type: null, count: 0 },
    ];

    this.powerSlots.forEach((slotEl, idx) => {
      const state = slotStates[idx] ?? { type: null, count: 0 };
      const { type, count } = state;

      slotEl.innerHTML = '';

      if (!type || count <= 0) {
        slotEl.classList.add('powerSlot-empty');
        slotEl.classList.remove('powerSlot-filled');
        return;
      }

      slotEl.classList.remove('powerSlot-empty');
      slotEl.classList.add('powerSlot-filled');

      const wrap = document.createElement('div');
      wrap.className = 'powerIconWrap';

      const iconSpan = document.createElement('span');
      iconSpan.className = 'powerIcon';
      iconSpan.textContent = POWERUP_ICONS[type] ?? '•';
      wrap.appendChild(iconSpan);

      if (count > 1) {
        const badge = document.createElement('span');
        badge.className = 'powerBadge';
        badge.textContent = String(count);
        wrap.appendChild(badge);
      }

      slotEl.appendChild(wrap);
    });
  }

  openPrompt(lockedIndex: number): void {
    this.pendingLockIndex = lockedIndex;
    this.overlayEl.style.display = 'flex';
    this.overlayEl.classList.add('show');
    this.overlayEl.setAttribute('aria-hidden', 'false');
  }

  closePrompt(): void {
    this.pendingLockIndex = null;
    this.overlayEl.classList.remove('show');
    this.overlayEl.setAttribute('aria-hidden', 'true');
    this.overlayEl.style.display = 'none';
  }

  shutdown(): void {
    if (this.powerSlots[0]) {
      this.powerSlots[0].removeEventListener('click', this.boundOnSlotClick);
    }
    this.useButton.removeEventListener('click', this.boundOnConfirm);
    this.skipButton.removeEventListener('click', this.boundOnSkip);
  }

  private attachHandlers(): void {
    if (this.powerSlots[0]) {
      this.powerSlots[0].addEventListener('click', this.boundOnSlotClick);
    }
    this.useButton.addEventListener('click', this.boundOnConfirm);
    this.skipButton.addEventListener('click', this.boundOnSkip);
  }

  private confirmUse(): void {
    if (this.pendingLockIndex === null) {
      this.closePrompt();
      return;
    }
    const lockedIndex = this.pendingLockIndex;
    this.onConfirmUse(lockedIndex);
    this.closePrompt();
  }

  private skipUse(): void {
    this.onSkipUse();
    this.closePrompt();
  }
}
