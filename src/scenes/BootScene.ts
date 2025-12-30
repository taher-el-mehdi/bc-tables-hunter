import Phaser from 'phaser';
import { GameConfig, GameplayConfig } from '../config/gameConfig';
import { AudioService } from '../services/AudioService';

export class BootScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private percentText!: Phaser.GameObjects.Text;
  private loadingText!: Phaser.GameObjects.Text;

  constructor() {
    super('BootScene');
  }

  preload() {
    const { width, height } = this.scale;
    // Use configured background color for consistent branding
    this.cameras.main.setBackgroundColor(GameConfig.backgroundColor as any);

    // Progress background box (subtle tint using primary table color)
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(GameplayConfig.colors.table, 0.12);
    this.progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
    this.progressBox.lineStyle(2, GameplayConfig.colors.table, 0.9);
    this.progressBox.strokeRect(width / 2 - 160, height / 2 - 25, 320, 50);

    // Progress bar (primary color)
    this.progressBar = this.add.graphics();

    // Loading text (use theme text color)
    const textColor = '#' + GameplayConfig.colors.text.toString(16).padStart(6, '0');
    this.loadingText = this.add.text(width / 2, height / 2 - 40, 'Loading...', {
      fontFamily: 'Orbitron',
      fontSize: '20px',
      color: textColor
    }).setOrigin(0.5);

    this.percentText = this.add.text(width / 2, height / 2, '0%', {
      fontFamily: 'Orbitron',
      fontSize: '18px',
      color: textColor
    }).setOrigin(0.5);

    // Start the font loading + progress animation
    this.loadFontsAndFinish();
  }

  private async loadFontsAndFinish() {
    let percent = 0;
    const { width, height } = this.scale;

    const updateBar = () => {
      this.progressBar.clear();
      // Use primary table color for the progress fill
      this.progressBar.fillStyle(GameplayConfig.colors.table, 1);
      this.progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * (percent / 100), 30);
      this.percentText.setText(Math.round(percent) + '%');
    };

    const ticker = this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        percent = Math.min(95, percent + Phaser.Math.Between(1, 3));
        updateBar();
      }
    });

    // Wait for Orbitron font to load (with timeout fallback)
    try {
      const fonts: Promise<any>[] = [];
      if ((document as any).fonts && (document as any).fonts.load) {
        fonts.push((document as any).fonts.load('700 16px Orbitron'));
      }
      if ((document as any).fonts && (document as any).fonts.ready) {
        fonts.push((document as any).fonts.ready);
      }
      // Wait for either the font(s) or a 2s timeout
      await Promise.race([Promise.all(fonts), new Promise(res => setTimeout(res, 2000))]);
    } catch (e) {
      // ignore and proceed
    }

    // Stop the ticking animation
    ticker.remove(false);

    // Animate completion to 100%
    const obj = { v: percent };
    this.tweens.add({
      targets: obj,
      v: 100,
      duration: 350,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        percent = obj.v;
        updateBar();
      },
      onComplete: () => {
        // Fade out loader then start Menu
        this.time.delayedCall(250, () => {
          this.tweens.add({
            targets: [this.progressBar, this.progressBox, this.loadingText, this.percentText],
            alpha: 0,
            duration: 300,
            onComplete: () => {
              try {
                const audio = AudioService.getInstance();
                audio.init();
                audio.playBackground();
              } catch (e) {
                // ignored
              }
              this.scene.start('MenuScene');
            }
          });
        });
      }
    });
  }

  create() {
    // intentionally left blank; scene will switch from loader
  }
}
