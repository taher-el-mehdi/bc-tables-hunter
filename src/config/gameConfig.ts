import Phaser from 'phaser';

export const GameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#e7eae7ff', // Light Gray for better contrast
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

export const GameplayConfig = {
  circleRadius: 60,
  spawnInterval: 2000, // ms
  maxCircles: 10,
  colors: {
    table: 0x005A9E, // Microsoft Blue
    id: 0x00796B,    // Microsoft Red
    selected: 0xFF8A00, // Microsoft Yellow
    matched: 0x3CDA5B,  // Microsoft Green
    outline: 0xffffff,  // White outline (default)
    outlineHover: 0xFFB900,  // Microsoft Yellow
    text: 0xFFFFFF        // White for better contrast
  },
  scoring: {
    base: 10,
    speedBonus: {
      fast: 10, // < 1.5s
      medium: 5 // < 3s
    },
    streakMultiplier: {
      medium: 1.5, // 3 correct
      high: 2.0    // 5 correct
    }
  }
};
