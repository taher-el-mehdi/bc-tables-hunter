import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Preload assets here if needed
    this.cameras.main.setBackgroundColor('#0f172a');
  }

  create() {
    this.scene.start('MenuScene');
  }
}
