import Phaser from 'phaser';
import { GameplayConfig } from '../config/gameConfig';

export abstract class BaseCircle extends Phaser.GameObjects.Container {
  protected circle: Phaser.GameObjects.Arc;
  protected textObj: Phaser.GameObjects.Text;
  public id: number;
  public isSelected: boolean = false;
  protected selectedColor: number; // Store custom selected color

  constructor(scene: Phaser.Scene, x: number, y: number, id: number, text: string, color: number, selectedColor?: number) {
    super(scene, x, y);
    this.id = id;
    this.selectedColor = selectedColor || GameplayConfig.colors.selected; // Use custom or default

    this.setSize(GameplayConfig.circleRadius * 2, GameplayConfig.circleRadius * 2);

    // Draw Circle
    this.circle = scene.add.circle(0, 0, GameplayConfig.circleRadius, color);
    // Default outline (white)
    this.circle.setStrokeStyle(2, GameplayConfig.colors.outline);
    this.add(this.circle);

    // Draw Text (white by default)
    const textColor = '#' + GameplayConfig.colors.text.toString(16).padStart(6, '0');
    const textColorHover = '#' + GameplayConfig.colors.outlineHover.toString(16).padStart(6, '0');
    this.textObj = scene.add.text(0, 0, text, {
      fontFamily: 'Orbitron',
      fontSize: '16px',
      color: textColor,
      align: 'center',
      fontStyle: 'bold',
      wordWrap: { width: GameplayConfig.circleRadius * 1.5 }
    });
    this.textObj.setOrigin(0.5);
    // Ensure the text does NOT intercept pointer events so the container remains clickable when hovering over the text
    this.textObj.setInteractive = () => this.textObj; // Disable interactivity
    this.textObj.input = null;
    this.add(this.textObj);

    // Change outline and text color on hover (only triggers when pointer is inside hitArea)
    this.on('pointerover', () => {
      this.circle.setStrokeStyle(2, GameplayConfig.colors.outlineHover);
      this.textObj.setColor(textColorHover);
    });
    this.on('pointerout', () => {
      this.circle.setStrokeStyle(2, GameplayConfig.colors.outline);
      this.textObj.setColor(textColor);
    });

    // Physics
    scene.physics.world.enable(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(GameplayConfig.circleRadius);
    body.setCollideWorldBounds(true);
    // Softer bounce and damping for smoother, more natural motion
    body.setBounce(0.9, 0.9);
    body.setDamping(true);
    body.setDrag(20);
    body.setMaxVelocity(160);
    
    // Random gentle velocity (slightly increased for snappier motion)
    const speed = Math.max(36, Math.round(GameplayConfig.circleRadius * 1.0));
    body.setVelocity(
      Phaser.Math.Between(-speed, speed), 
      Phaser.Math.Between(-speed, speed)
    );

    // Flow seed to vary motion per circle
    (this as any)._flowSeed = Phaser.Math.FloatBetween(0, Math.PI * 2);
    (this as any)._flowFreq = Phaser.Math.FloatBetween(0.2, 0.6);
    (this as any)._flowAmp = Phaser.Math.FloatBetween(0.05, 0.25);

    // Interaction - precise circular hit area, hand cursor handled by Phaser
    const isTouch = (scene.sys.game as any).device && (scene.sys.game as any).device.input && (scene.sys.game as any).device.input.touch;
    const hitRadius = GameplayConfig.circleRadius + (isTouch ? 8 : 0);
    this.setInteractive({
      hitArea: new Phaser.Geom.Circle(0, 0, hitRadius),
      hitAreaCallback: Phaser.Geom.Circle.Contains,
      useHandCursor: !isTouch
    });

    // Add to scene
    scene.add.existing(this);
  }

  public setSelected(selected: boolean) {
    this.isSelected = selected;
    if (selected) {
      this.circle.setFillStyle(this.selectedColor);
      this.scene.tweens.add({
        targets: this,
        scale: 1.08,
        duration: 150,
        yoyo: true,
        repeat: -1
      });
    } else {
      this.resetColor();
      this.setScale(1);
      this.scene.tweens.killTweensOf(this);
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
      this.setInteractive({
        hitArea: new Phaser.Geom.Circle(0, 0, GameplayConfig.circleRadius),
        hitAreaCallback: Phaser.Geom.Circle.Contains,
        useHandCursor: true
      });
      this.setAlpha(1);
    }
  }

  // Smooth flow nudge to make movement feel organic
  public applyFlow(time: number) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    const seed = (this as any)._flowSeed || 0;
    const freq = (this as any)._flowFreq || 0.4;
    const amp = (this as any)._flowAmp || 0.12;

    // small oscillation angle in radians
    const t = time / 1000;
    const angle = Math.sin(t * freq + seed) * amp;

    const vx = body.velocity.x;
    const vy = body.velocity.y;

    // rotate the velocity vector slightly and lerp towards it for smoothness
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const desiredX = vx * cos - vy * sin;
    const desiredY = vx * sin + vy * cos;

    // small lerp to avoid popping
    const lerp = 0.06;
    body.setVelocity(Phaser.Math.Linear(vx, desiredX, lerp), Phaser.Math.Linear(vy, desiredY, lerp));
  }

  protected abstract resetColor(): void;
}
