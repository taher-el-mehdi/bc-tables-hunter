import Phaser from 'phaser';
import { GameplayConfig } from '../config/gameConfig';
import { AudioService } from '../services/AudioService';

export class MenuScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private startButton!: Phaser.GameObjects.Text;
  private muteButton!: Phaser.GameObjects.Text;

  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;
    const small = Math.min(width, height);

    const titleSize = Math.round(small / 12);
    const subtitleSize = Math.round(small / 26);
    const buttonSize = Math.round(small / 22);

    // Title
    this.titleText = this.add.text(width / 2, height * 0.3, 'AL Tables Hunter', {
      fontFamily: 'Orbitron',
      fontSize: `${titleSize}px`,
      color: '#' + GameplayConfig.colors.table.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Subtitle
    this.subtitleText = this.add.text(width / 2, height * 0.4, 'Match Table Name with Table Id', {
      fontFamily: 'Orbitron',
      fontSize: `${subtitleSize}px`,
      color: '#6b6b6b',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Start button styled with Business Central blue
    this.startButton = this.add.text(width / 2, height * 0.6, 'Start Game', {
      fontFamily: 'Orbitron',
      fontSize: `${buttonSize}px`,
      color: '#ffffff',
      backgroundColor: '#' + GameplayConfig.colors.table.toString(16).padStart(6, '0'),
      padding: { x: Math.round(buttonSize * 0.6), y: Math.round(buttonSize * 0.4) },
      align: 'center',
      stroke: '#005a9e',
      strokeThickness: 2
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        this.startButton.setStyle({ backgroundColor: '#005a9e' });
        this.startButton.setScale(1.03);
      })
      .on('pointerout', () => {
        this.startButton.setStyle({ backgroundColor: '#' + GameplayConfig.colors.table.toString(16).padStart(6, '0') });
        this.startButton.setScale(1);
      })
      .on('pointerdown', () => this.scene.start('GameScene'));

    // Mute / Unmute button (bottom-left)
    const audio = AudioService.getInstance();
    const muteX = 20;
    const muteY = height - 20;
    const mbFontSize = Math.max(16, Math.round(Math.min(width, height) / 40));
    this.muteButton = this.add.text(muteX, muteY, audio.isMuted() ? '🔇' : '🔊', {
      fontFamily: 'Orbitron',
      fontSize: `${mbFontSize}px`,
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.18)',
      padding: { x: 8, y: 6 }
    }).setOrigin(0, 1).setInteractive({ useHandCursor: true });

    this.muteButton.on('pointerdown', () => {
      audio.toggleMute();
      this.muteButton.setText(audio.isMuted() ? '🔇' : '🔊');
      // quick tactile feedback animation
      this.tweens.add({ targets: this.muteButton, scale: 0.88, duration: 80, yoyo: true });
    });
    // Update layout on resize
    this.scale.on('resize', this.onResize, this);
  }

  private onResize() {
    const { width, height } = this.scale;
    const small = Math.min(width, height);

    const titleSize = Math.round(small / 12);
    const subtitleSize = Math.round(small / 26);
    const buttonSize = Math.round(small / 22);

    this.titleText.setStyle({ fontSize: `${titleSize}px` });
    this.titleText.setPosition(width / 2, height * 0.3);

    this.subtitleText.setStyle({ fontSize: `${subtitleSize}px` });
    this.subtitleText.setPosition(width / 2, height * 0.4);

    this.startButton.setStyle({
      fontSize: `${buttonSize}px`,
      padding: { x: Math.round(buttonSize * 0.6), y: Math.round(buttonSize * 0.4) }
    });
    this.startButton.setPosition(width / 2, height * 0.6);

    // update mute button position (bottom-left)
    if (this.muteButton) {
      const mbFontSize = Math.max(14, Math.round(Math.min(width, height) / 40));
      this.muteButton.setPosition(20, height - 20);
      this.muteButton.setStyle({ fontSize: `${mbFontSize}px` });
    }
  }
}
