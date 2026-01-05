import Phaser from 'phaser';

export const GameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#0f0f23',
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
  spawnInterval: 2000,
  maxCircles: 10,
  colors: {
    table: 0x006c7fff,
    id: 0xff2e63,
    selected: 0x01981dff,
    selectedId: 0xff6b9d,
    matched: 0x6bffb8,
    outline: 0x2a2a4a,
    outlineHover: 0x01981dff,
    text: 0xe8e6e3,
    ui: {
      primary: 0x00d9ff,
      secondary: 0x8b5cf6,
      accent: 0x01981dff,
      success: 0x6bffb8,
      warning: 0xff9f43,
      danger: 0xff2e63,
      textDim: 0x9ca3af,
      background: 0x1a1a2e,
      backgroundAlt: 0x16213e
    }
  },
  scoring: {
    base: 10,
    speedBonus: {
      fast: 10,
      medium: 5
    },
    streakMultiplier: {
      medium: 1.5,
      high: 2.0
    }
  }
};
