import Phaser from 'phaser';

const TARGET_WORD = 'PHASER';

export default class JuiceScene extends Phaser.Scene {
  private letterSlots: { box: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text }[] = [];
  private currentSlotIndex = 0;
  private isSubmitting = false;

  constructor() {
    super('JuiceScene');
  }

  preload() {
    // Nothing to preload for now
  }

  create() {
    this.add.text(this.cameras.main.width / 2, 50, 'WordRun Juice Test', {
      color: '#ffffff',
      fontSize: '32px',
    }).setOrigin(0.5);

    this.createWordBox();
    this.createKeyboard();
  }

  private createWordBox() {
    const slotSize = 48;
    const slotMargin = 8;
    const totalWidth = (slotSize * TARGET_WORD.length) + (slotMargin * (TARGET_WORD.length - 1));
    const startX = this.cameras.main.width / 2 - totalWidth / 2;
    const startY = 200;

    for (let i = 0; i < TARGET_WORD.length; i++) {
      const x = startX + i * (slotSize + slotMargin) + slotSize / 2;
      
      const box = this.add.rectangle(x, startY, slotSize, slotSize, 0x4a4e69, 1)
        .setStrokeStyle(2, 0x9a8c98);

      const text = this.add.text(x, startY, '', {
        color: '#ffffff',
        fontSize: '32px',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      this.letterSlots.push({ box, text });
    }
  }

  private createKeyboard() {
    const keyRows = [
      'QWERTYUIOP',
      'ASDFGHJKL',
      'ZXCVBNM',
    ];
    const keySize = 35;
    const keyMargin = 4;
    const keyboardY = 450;

    keyRows.forEach((row, rowIndex) => {
      const rowWidth = (keySize * row.length) + (keyMargin * (row.length - 1));
      const rowStartX = this.cameras.main.width / 2 - rowWidth / 2;
      
      for (let i = 0; i < row.length; i++) {
        const keyChar = row[i];
        const x = rowStartX + i * (keySize + keyMargin) + keySize / 2;
        const y = keyboardY + rowIndex * (keySize + keyMargin);

        const keyBox = this.add.rectangle(x, y, keySize, keySize, 0x22223b)
          .setStrokeStyle(2, 0x9a8c98)
          .setInteractive({ useHandCursor: true });

        this.add.text(x, y, keyChar, {
          fontSize: '20px',
        }).setOrigin(0.5);

        keyBox.on('pointerdown', () => {
          this.handleKeyPress(keyChar);
        });
      }
    });

    // Add Backspace and Enter keys
    const specialKeyY = keyboardY + keyRows.length * (keySize + keyMargin);
    const backspaceKey = this.add.rectangle(this.cameras.main.width / 2 - 60, specialKeyY, 80, keySize, 0xc9ada7)
      .setStrokeStyle(2, 0x9a8c98)
      .setInteractive({ useHandCursor: true });
    this.add.text(this.cameras.main.width / 2 - 60, specialKeyY, '⌫', { fontSize: '20px' }).setOrigin(0.5);
    backspaceKey.on('pointerdown', () => this.handleBackspace());

    const enterKey = this.add.rectangle(this.cameras.main.width / 2 + 60, specialKeyY, 80, keySize, 0x4ade80)
      .setStrokeStyle(2, 0x9a8c98)
      .setInteractive({ useHandCursor: true });
    this.add.text(this.cameras.main.width / 2 + 60, specialKeyY, 'ENTER', { fontSize: '20px', color: '#000000' }).setOrigin(0.5);
    enterKey.on('pointerdown', () => this.handleSubmit());
  }

  private handleKeyPress(char: string) {
    if (this.isSubmitting || this.currentSlotIndex >= TARGET_WORD.length) {
      return;
    }
    this.letterSlots[this.currentSlotIndex].text.setText(char);
    this.currentSlotIndex++;
  }

  private handleBackspace() {
    if (this.isSubmitting || this.currentSlotIndex <= 0) {
      return;
    }
    this.currentSlotIndex--;
    this.letterSlots[this.currentSlotIndex].text.setText('');
  }

  private handleSubmit() {
    if (this.isSubmitting || this.currentSlotIndex < TARGET_WORD.length) {
      // Maybe add a "not enough letters" animation here
      return;
    }

    this.isSubmitting = true;

    const guess = this.letterSlots.map(s => s.text.text).join('');

    if (guess === TARGET_WORD) {
      this.playCorrectWordAnimation();
    } else {
      this.playIncorrectWordAnimation();
    }
  }

  private playCorrectWordAnimation() {
    const timeline = this.tweens.createTimeline();

    this.letterSlots.forEach((slot, i) => {
      // 1. Flash box green
      slot.box.setFillStyle(0x4ade80);

      // 2. Bounce letter up
      timeline.add({
        targets: slot.text,
        y: slot.text.y - 25,
        duration: 200,
        ease: 'Cubic.easeOut',
        offset: i * 50, // Stagger start
      });

      // 3. Bounce letter back down with a little bounce
      timeline.add({
        targets: slot.text,
        y: slot.text.y,
        duration: 400,
        ease: 'Bounce.easeOut',
      });
    });

    timeline.play();
    
    // 4. Camera shake
    this.cameras.main.shake(150, 0.008);

    timeline.on('complete', () => {
      // Reset for next word (or end of level)
      this.time.delayedCall(500, () => {
        this.currentSlotIndex = 0;
        this.letterSlots.forEach(s => {
          s.text.setText('');
          s.box.setFillStyle(0x4a4e69);
        });
        this.isSubmitting = false;
      });
    });
  }

  private playIncorrectWordAnimation() {
    // 1. Flash boxes red
    this.letterSlots.forEach(slot => {
      slot.box.setFillStyle(0xe63946);
    });

    // 2. Shake the word
    const shakeAmount = 10;
    this.tweens.add({
      targets: this.letterSlots.map(s => [s.box, s.text]),
      x: `+=${shakeAmount}`,
      duration: 50,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        // Reset positions
        this.letterSlots.forEach(s => {
          s.box.setX(s.text.x);
        });
        
        // 3. Clear letters and reset color after shake
        this.time.delayedCall(100, () => {
          this.currentSlotIndex = 0;
          this.letterSlots.forEach(s => {
            s.text.setText('');
            s.box.setFillStyle(0x4a4e69);
          });
          this.isSubmitting = false;
        });
      }
    });
  }

  update() {
    //
  }
}
