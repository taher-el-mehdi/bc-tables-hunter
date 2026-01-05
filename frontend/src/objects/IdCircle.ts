import { BaseCircle } from './BaseCircle';
import { GameplayConfig } from '../config/gameConfig';

export class IdCircle extends BaseCircle {
  constructor(scene: Phaser.Scene, x: number, y: number, id: number, tableId: number) {
    super(
      scene,
      x,
      y,
      id,
      tableId.toString(),
      GameplayConfig.colors.idCircle,
      GameplayConfig.colors.selected
    );
  }

  protected resetColor() {
    this.circle.setFillStyle(GameplayConfig.colors.idCircle);
  }
}
