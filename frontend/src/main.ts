import Phaser from 'phaser';
import { GameConfig } from './config/gameConfig';
import BootScene from './scenes/BootScene';
import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';
import ResultScene from './scenes/ResultScene';

import './style.css';

const config = {
  ...GameConfig,
  scene: [BootScene, MenuScene, GameScene, ResultScene]
};

new Phaser.Game(config);
