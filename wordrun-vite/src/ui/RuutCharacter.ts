import { getRuutCosmetic, onProfileChanged } from '../ProfileStore';

type RuutMood = 'idle' | 'happy' | 'sad';

type RuutCharacterDeps = {
  getCosmetic?: typeof getRuutCosmetic;
  onProfileChanged?: typeof onProfileChanged;
};

export class RuutCharacter {
  private el: HTMLDivElement | null;
  private getCosmetic: typeof getRuutCosmetic;
  private onProfileChangedFn: typeof onProfileChanged;
  private unsub?: () => void;

  constructor(el: HTMLDivElement | null, deps: RuutCharacterDeps = {}) {
    this.el = el;
    this.getCosmetic = deps.getCosmetic ?? getRuutCosmetic;
    this.onProfileChangedFn = deps.onProfileChanged ?? onProfileChanged;
  }

  // Public API: initialize skin + mood lifecycle.
  init(): void {
    if (!this.el) return;

    const applySkin = () => {
      const { skinKey } = this.getCosmetic();
      const skinToUrl: Record<string, string> = {
        ruut_walk: '/assets/characters/ruut_walk_cycle.png',
      };
      const url = skinToUrl[skinKey] ?? skinToUrl.ruut_walk;
      this.el!.style.backgroundImage = `url('${url}')`;
    };

    applySkin();
    this.setMood('idle');

    try { this.unsub?.(); } catch {}
    this.unsub = this.onProfileChangedFn(() => applySkin());
  }

  setMood(mood: RuutMood): void {
    if (!this.el) return;
    this.el.classList.remove('idle', 'happy', 'sad');
    this.el.classList.add(mood);

    const anyEl: any = this.el;
    window.clearTimeout(anyEl.__ruutTO);

    if (mood === 'happy') {
      anyEl.__ruutTO = window.setTimeout(() => this.setMood('idle'), 650);
    } else if (mood === 'sad') {
      anyEl.__ruutTO = window.setTimeout(() => this.setMood('idle'), 450);
    }
  }

  shutdown(): void {
    if (!this.el) return;
    const anyEl: any = this.el;
    window.clearTimeout(anyEl.__ruutTO);
    try { this.unsub?.(); } catch {}
  }
}
