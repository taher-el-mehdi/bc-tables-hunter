import Phaser from 'phaser';

interface ResultData { state: { score: number; matches: number; wrong: number } }

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }

  create(data: ResultData) {
    const { width, height } = this.scale;
    const state = data?.state || { score: 0, matches: 0, wrong: 0 };

    this.add.text(width / 2, height / 2 - 60, 'Round Result', {
      fontFamily: 'Orbitron', fontSize: '28px', color: '#f8fafc'
    }).setOrigin(0.5);

    const summary = `Score: ${state.score}\nMatches: ${state.matches}\nWrong: ${state.wrong}`;
    this.add.text(width / 2, height / 2, summary, {
      fontFamily: 'Orbitron', fontSize: '20px', color: '#e2e8f0', align: 'center'
    }).setOrigin(0.5);

    const btn = this.add.text(width / 2, height / 2 + 100, 'Play Again', {
      fontFamily: 'Orbitron', fontSize: '22px', color: '#d9f99d', backgroundColor: '#1e293b'
    }).setOrigin(0.5).setPadding(12, 8, 12, 8).setInteractive({ useHandCursor: true });

    btn.on('pointerup', () => this.scene.start('MenuScene'));
  }
}
