import Phaser from 'phaser';

export const GameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#0f0f23', // Deep space blue-black
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
    table: 0x006c7fff, // Bright cyan (Table Names)
    id: 0xff2e63,    // Vibrant pink/red (Table IDs)
    selected: 0x01981dff, // Green for table name selection
    selectedId: 0xff6b9d, // Soft pink for ID selection (lighter pink, easier on eyes)
    matched: 0x6bffb8,  // Bright mint green
    outline: 0x2a2a4a,  // Subtle dark purple-gray
    outlineHover: 0x01981dff,  // Warm amber on hover (softer than bright yellow)
    text: 0xe8e6e3,        // Soft cream/off-white (easier on eyes than pure white)
    ui: {
      primary: 0x00d9ff,   // Cyan for primary UI
      secondary: 0x8b5cf6, // Purple for secondary elements
      accent: 0x01981dff,    // Warm amber for accents (softer than bright yellow)
      success: 0x6bffb8,   // Mint for success states
      warning: 0xff9f43,   // Orange for warnings
      danger: 0xff2e63,    // Pink-red for errors/danger
      textDim: 0x9ca3af,   // Gray for dimmed text
      background: 0x1a1a2e, // Dark blue-gray background
      backgroundAlt: 0x16213e // Alternative dark background
    }
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
