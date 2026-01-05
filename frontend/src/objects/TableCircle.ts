import { BaseCircle } from './BaseCircle';
import { GameplayConfig } from '../config/gameConfig';

export class TableCircle extends BaseCircle {
  constructor(scene: Phaser.Scene, x: number, y: number, id: number, tableName: string) {
    super(
      scene,
      x,
      y,
      id,
      tableName,
      GameplayConfig.colors.tableCircle,
      GameplayConfig.colors.selected
    );
  }

  protected resetColor() {
    this.circle.setFillStyle(GameplayConfig.colors.tableCircle);
  }
}
