import Phaser from 'phaser';
import { GameplayConfig } from '../config/gameConfig';

export class ResultScene extends Phaser.Scene {
  private retryBtn!: Phaser.GameObjects.Text;
  private menuBtn!: Phaser.GameObjects.Text;

  constructor() {
    super('ResultScene');
  }

  init(data: any) {
    this.registry.set('resultData', data);
  }

  create() {
    const { width, height } = this.scale;
    const small = Math.min(width, height);
    const data = this.registry.get('resultData') || { matched: 0, time: '00:00:00' };

    // Background overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x0b0b0b, 0.85);

    const titleSize = Math.round(small / 12);
    const resultSize = Math.round(small / 26);
    const btnSize = Math.round(small / 22);

    // Title
    this.add.text(width / 2, height * 0.3, 'Well Done!', {
      fontFamily: 'Orbitron',
      fontSize: `${titleSize}px`,
      color: '#' + GameplayConfig.colors.matched.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Results
    this.add.text(width / 2, height * 0.45, `Matched: ${data.matched}`, {
      fontFamily: 'Orbitron',
      fontSize: `${resultSize}px`,
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.54, `Time: ${data.time}`, {
      fontFamily: 'Orbitron',
      fontSize: `${resultSize}px`,
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Buttons: Retry and Main Menu
    this.retryBtn = this.add.text(width / 2 - 100, height * 0.7, 'Play Again', {
      fontFamily: 'Orbitron',
      fontSize: `${btnSize}px`,
      color: '#ffffff',
      backgroundColor: '#' + GameplayConfig.colors.table.toString(16).padStart(6, '0'),
      padding: { x: Math.round(btnSize * 0.6), y: Math.round(btnSize * 0.4) }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.retryBtn.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    this.menuBtn = this.add.text(width / 2 + 100, height * 0.7, 'Main Menu', {
      fontFamily: 'Orbitron',
      fontSize: `${btnSize}px`,
      color: '#' + GameplayConfig.colors.table.toString(16).padStart(6, '0'),
      backgroundColor: '#ffffff',
      padding: { x: Math.round(btnSize * 0.6), y: Math.round(btnSize * 0.4) }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.menuBtn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    // Responsive adjustments
    this.scale.on('resize', this.onResize, this);
  }

  private onResize() {
    const { width, height } = this.scale;
    const small = Math.min(width, height);

    const btnSize = Math.round(small / 22);

    // update buttons positions and sizes
    this.retryBtn.setStyle({ fontSize: `${btnSize}px`, padding: { x: Math.round(btnSize * 0.6), y: Math.round(btnSize * 0.4) } });
    this.retryBtn.setPosition(width / 2 - 100, height * 0.7);

    this.menuBtn.setStyle({ fontSize: `${btnSize}px`, padding: { x: Math.round(btnSize * 0.6), y: Math.round(btnSize * 0.4) } });
    this.menuBtn.setPosition(width / 2 + 100, height * 0.7);
  }
}
