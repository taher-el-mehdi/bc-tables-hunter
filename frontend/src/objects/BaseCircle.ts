import Phaser from 'phaser';
import { GameplayConfig } from '../config/gameConfig';

export abstract class BaseCircle extends Phaser.GameObjects.Container {
  protected circle: Phaser.GameObjects.Arc;
  protected textObj: Phaser.GameObjects.Text;
  public id: number;
  public isSelected: boolean = false;
  protected selectedColor: number;

  constructor(scene: Phaser.Scene, x: number, y: number, id: number, text: string, color: number, selectedColor?: number) {
    super(scene, x, y);
    this.id = id;
    this.selectedColor = selectedColor || GameplayConfig.colors.selected;

    this.setSize(GameplayConfig.circleRadius * 2, GameplayConfig.circleRadius * 2);

    this.circle = scene.add.circle(0, 0, GameplayConfig.circleRadius, color);
    this.circle.setStrokeStyle(2, GameplayConfig.colors.outline);
    this.add(this.circle);

    const textColor = '#' + (GameplayConfig.colors.text & 0xFFFFFF).toString(16).padStart(6, '0');
    const hoverOutline = (GameplayConfig.colors.outlineHover & 0xFFFFFF);
    const textColorHover = '#' + hoverOutline.toString(16).padStart(6, '0');
    this.textObj = scene.add.text(0, 0, text, {
      fontFamily: 'Orbitron',
      fontSize: '16px',
      color: textColor,
      align: 'center',
      fontStyle: 'bold',
      wordWrap: { width: GameplayConfig.circleRadius * 1.5 }
    });
    this.textObj.setOrigin(0.5);
    this.textObj.setInteractive = () => this.textObj;
    (this.textObj as any).input = null;
    this.add(this.textObj);

    this.on('pointerover', () => {
      this.circle.setStrokeStyle(2, hoverOutline);
      this.textObj.setColor(textColorHover);
    });
    this.on('pointerout', () => {
      this.circle.setStrokeStyle(2, GameplayConfig.colors.outline);
      this.textObj.setColor(textColor);
    });

    scene.physics.world.enable(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(GameplayConfig.circleRadius);
    body.setCollideWorldBounds(true);
    // Softer motion but enough bounce to avoid overlap on collisions
    body.setBounce(0.6, 0.6);
    body.setDamping(true);
    body.setDrag(80);
    body.setMaxVelocity(90);

    // Lower initial velocity for easier clicking
    const speed = Math.max(16, Math.round(GameplayConfig.circleRadius * 0.4));
    body.setVelocity(
      Phaser.Math.Between(-speed, speed),
      Phaser.Math.Between(-speed, speed)
    );

    (this as any)._flowSeed = Phaser.Math.FloatBetween(0, Math.PI * 2);
    (this as any)._flowFreq = Phaser.Math.FloatBetween(0.1, 0.3);
    (this as any)._flowAmp = Phaser.Math.FloatBetween(0.03, 0.08);

    const isTouch = (scene.sys.game as any).device && (scene.sys.game as any).device.input && (scene.sys.game as any).device.input.touch;
    const hitRadius = GameplayConfig.circleRadius + (isTouch ? 16 : 16);
    this.setInteractive({
      hitArea: new Phaser.Geom.Circle(0, 0, hitRadius),
      hitAreaCallback: Phaser.Geom.Circle.Contains,
      useHandCursor: !isTouch
    });

    // Keep movement on click; selection is visual only (handled externally)

    scene.add.existing(this);
  }

  public setSelected(selected: boolean) {
    this.isSelected = selected;
    if (selected) {
      this.circle.setFillStyle(this.selectedColor);
      const accent = (GameplayConfig.colors.outlineHover & 0xFFFFFF);
      this.circle.setStrokeStyle(3, accent);
    } else {
      this.resetColor();
      this.circle.setStrokeStyle(2, GameplayConfig.colors.outline);
    }
  }

  public setMatched() {
    this.circle.setFillStyle(GameplayConfig.colors.matched);
    this.scene.tweens.add({
      targets: this,
      scale: 0,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.destroy();
      }
    });
  }

  public setDisabled(disabled: boolean) {
    if (disabled) {
      this.disableInteractive();
      this.setAlpha(0.6);
    } else {
      const hitRadius = GameplayConfig.circleRadius + 16;
      this.setInteractive({
        hitArea: new Phaser.Geom.Circle(0, 0, hitRadius),
        hitAreaCallback: Phaser.Geom.Circle.Contains,
        useHandCursor: true
      });
      this.setAlpha(1);
    }
  }

  public applyFlow(time: number) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    const seed = (this as any)._flowSeed || 0;
    const freq = (this as any)._flowFreq || 0.4;
    const amp = (this as any)._flowAmp || 0.12;

    const t = time / 1000;
    const angle = Math.sin(t * freq + seed) * amp;

    const vx = body.velocity.x;
    const vy = body.velocity.y;

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const desiredX = vx * cos - vy * sin;
    const desiredY = vx * sin + vy * cos;

    const lerp = 0.06;
    body.setVelocity(Phaser.Math.Linear(vx, desiredX, lerp), Phaser.Math.Linear(vy, desiredY, lerp));
  }

  protected abstract resetColor(): void;
}
