import { BaseCircle } from './BaseCircle';
import { GameplayConfig } from '../config/gameConfig';

export class IdCircle extends BaseCircle {
  constructor(scene: Phaser.Scene, x: number, y: number, id: number) {
    super(scene, x, y, id, id.toString(), GameplayConfig.colors.id, GameplayConfig.colors.selectedId);
  }

  protected resetColor(): void {
    this.circle.setFillStyle(GameplayConfig.colors.id);
  }
}
