import { BaseCircle } from './BaseCircle';
import { GameplayConfig } from '../config/gameConfig';

export class TableCircle extends BaseCircle {
  constructor(scene: Phaser.Scene, x: number, y: number, id: number, name: string) {
    super(scene, x, y, id, name, GameplayConfig.colors.table);
  }

  protected resetColor(): void {
    this.circle.setFillStyle(GameplayConfig.colors.table);
  }
}
